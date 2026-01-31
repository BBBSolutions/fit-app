import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const authHeader = req.headers.get('authorization');
        if (!authHeader) throw new Error('Missing authorization header');
        const token = authHeader.replace('Bearer ', '');

        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
        const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

        const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
        if (authError || !user) throw new Error("Unauthorized");
        const userId = user.id;

        // Parse action and payload from body
        const body = await req.json();
        const { action, payload, branchId } = body;

        // Get Admin Profile & Gym Code (New Schema)
        let query = supabaseClient
            .from('branch_users')
            .select('role, branches(gym_code)')
            .eq('user_id', userId)
            .in('role', ['owner', 'branch_admin']);

        if (branchId) {
            query = query.eq('branch_id', branchId);
        }

        const { data: branchUser, error: branchError } = await query.limit(1).single();

        if (branchError || !branchUser?.branches?.gym_code) {
            throw new Error("Admin profile or Gym Code not found (billing lookup failed)");
        }
        const gymCode = branchUser.branches.gym_code;

        // 2. Handle Actions
        let result;
        let error;

        switch (action) {
            // PLANS (CRUD)
            case 'fetch_plans':
                ({ data: result, error } = await supabaseClient
                    .from('plans')
                    .select('id, name, description, price, currency, interval, features, is_active, type, stripe_price_id, gym_code, created_at')
                    .eq('gym_code', gymCode)
                    .order('created_at', { ascending: false }));
                break;

            case 'create_plan':
                if (!payload) throw new Error("Missing payload for create_plan");
                ({ data: result, error } = await supabaseClient
                    .from('plans')
                    .insert({ ...payload, gym_code: gymCode })
                    .select('id, name, description, price, currency, interval, features, is_active, type, stripe_price_id, gym_code, created_at')
                    .single());
                break;

            case 'update_plan':
                if (!payload?.id) throw new Error("Missing plan ID for update");
                const { id: planId, ...planUpdates } = payload;
                ({ data: result, error } = await supabaseClient
                    .from('plans')
                    .update(planUpdates)
                    .eq('id', planId)
                    .eq('gym_code', gymCode)
                    .select('id, name, description, price, currency, interval, features, is_active, type, stripe_price_id, gym_code, created_at')
                    .single());
                break;

            case 'delete_plan':
                if (!payload?.id) throw new Error("Missing plan ID for delete");
                ({ data: result, error } = await supabaseClient
                    .from('plans')
                    .delete()
                    .eq('id', payload.id)
                    .eq('gym_code', gymCode));
                break;

            // SUBSCRIPTIONS & INVOICES (Read-Only Logic for now, likely joining with users)
            case 'fetch_billing_overview':
                // 1. Fetch Plans
                const { data: plans } = await supabaseClient
                    .from('plans')
                    .select('id, name, price, interval')
                    .eq('gym_code', gymCode);

                const planMap: Record<string, any> = {};
                (plans || []).forEach((p: any) => planMap[p.id] = p);

                let allSubscriptions: any[] = [];

                // Helper to calc next billing
                const calculateNextBilling = (startDateStr: string, interval: string) => {
                    const date = new Date(startDateStr || Date.now());
                    const intervalLower = interval?.toLowerCase() || 'monthly';

                    if (intervalLower === 'yearly' || intervalLower === 'year') {
                        date.setFullYear(date.getFullYear() + 1);
                    } else if (intervalLower === 'half yearly' || intervalLower === '6 months') {
                        date.setMonth(date.getMonth() + 6);
                    } else if (intervalLower === 'quarterly' || intervalLower === 'quarter') {
                        date.setMonth(date.getMonth() + 3);
                    } else {
                        // Monthly or default
                        date.setMonth(date.getMonth() + 1);
                    }
                    return date.toISOString().split('T')[0];
                };

                // 2. Pending Members (Invitations) -> Show as ACTIVE for Billing purposes
                const { data: invites } = await supabaseClient
                    .from('invitations')
                    .select('id, name, plan_id, pt_plan_id, created_at, status')
                    .eq('gym_code', gymCode)
                    .eq('status', 'pending')
                    .not('plan_id', 'is', null);

                if (invites) {
                    invites.forEach((inv: any) => {
                        const plan = planMap[inv.plan_id];
                        const ptPlan = inv.pt_plan_id ? planMap[inv.pt_plan_id] : null;

                        if (plan) {
                            const totalAmount = (Number(plan.price) || 0) + (ptPlan ? (Number(ptPlan.price) || 0) : 0);
                            allSubscriptions.push({
                                id: `inv-${inv.id}`,
                                member: inv.name, // Removed '(Pending)' suffix as per "Active" request imply they are treated as members
                                plan: plan.name,
                                amount: totalAmount,
                                pt: ptPlan ? 'Yes' : 'No',
                                status: 'Active', // Requested by user
                                nextBilling: calculateNextBilling(inv.created_at, plan.interval),
                                method: 'Cash/Manual'
                            });
                        }
                    });
                }

                // 3. Active Members (Profiles + Subscriptions Table)
                const { data: profiles } = await supabaseClient
                    .from('profiles')
                    .select('user_id, full_name')
                    .eq('gym_code', gymCode);

                const profileMap: Record<string, any> = {};
                const userIds: string[] = [];
                if (profiles) {
                    profiles.forEach((p: any) => {
                        profileMap[p.user_id] = p;
                        userIds.push(p.user_id);
                    });
                }

                if (userIds.length > 0) {
                    // Fetch active subscriptions
                    const { data: activeSubs } = await supabaseClient
                        .from('subscriptions')
                        .select('id, user_id, plan_id, pt_plan_id, status, created_at')
                        .in('user_id', userIds)
                        .eq('status', 'active');

                    if (activeSubs) {
                        activeSubs.forEach((sub: any) => {
                            const plan = planMap[sub.plan_id];
                            const ptPlan = sub.pt_plan_id ? planMap[sub.pt_plan_id] : null;
                            const profile = profileMap[sub.user_id];

                            if (plan && profile) {
                                const totalAmount = (Number(plan.price) || 0) + (ptPlan ? (Number(ptPlan.price) || 0) : 0);
                                allSubscriptions.push({
                                    id: sub.id,
                                    member: profile.full_name,
                                    plan: plan.name,
                                    amount: totalAmount,
                                    pt: ptPlan ? 'Yes' : 'No',
                                    status: 'Active',
                                    nextBilling: calculateNextBilling(sub.created_at, plan.interval),
                                    method: 'Cash/Manual'
                                });
                            }
                        });
                    }
                }

                result = { subscriptions: allSubscriptions, invoices: [] };
                break;

            default:
                throw new Error(`Invalid action: ${action}`);
        }

        if (error) throw error;

        return new Response(JSON.stringify(result || { success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error) {
        console.error("Error:", error.message);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }
});
