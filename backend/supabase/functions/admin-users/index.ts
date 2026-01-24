import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.0.0";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
    // Handle CORS preflight request
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // Get token from Authorization header
        const authHeader = req.headers.get('authorization');
        if (!authHeader) throw new Error('Missing authorization header');

        const token = authHeader.replace('Bearer ', '');

        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

        const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

        // 1. Verify Supabase JWT and get user
        const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

        if (authError || !user) {
            console.error("Auth error:", authError);
            throw new Error("Unauthorized");
        }

        const userId = user.id; // Direct UUID from Supabase Auth

        // 2. Get Admin Profile & Gym Code
        const { data: adminProfile, error: adminError } = await supabaseClient
            .from('profiles')
            .select('gym_code')
            .eq('user_id', userId)
            .single();

        if (adminError || !adminProfile?.gym_code) {
            console.error("Error fetching admin profile or missing gym code:", adminError);
            throw new Error("Admin profile not found or missing Gym Code");
        }

        const gymCode = adminProfile.gym_code;

        // 3. Parse action and payload from body
        const body = await req.json();
        const { action, payload } = body;

        // 4. Handle Actions
        let result;
        let error;

        switch (action) {
            case 'fetch':
            case undefined: // Default to fetch if no action
                // 1. Fetch Active Profiles
                const { data: activeUsers, error: profilesError } = await supabaseClient
                    .from('profiles')
                    .select('user_id, full_name, role, phone_number, created_at, gym_code, address, app_users(email)')
                    .eq('gym_code', gymCode)
                    .neq('role', 'admin')
                    .order('created_at', { ascending: false });

                if (profilesError) throw profilesError;

                // 2. Fetch Pending Invitations
                const { data: pendingUsers, error: invitesError } = await supabaseClient
                    .from('invitations')
                    .select('id, name, role, phone, email, plan_id, pt_plan_id, created_at, status, address')
                    .eq('gym_code', gymCode)
                    .eq('status', 'pending')
                    .order('created_at', { ascending: false });

                if (invitesError) throw invitesError;

                // 3. Fetch Active Subscriptions for Active Users
                const activeUserIds = activeUsers.map(u => u.user_id);
                let userPlans: any = {};

                if (activeUserIds.length > 0) {
                    const { data: subs } = await supabaseClient
                        .from('subscriptions')
                        .select('user_id, plan_id, pt_plan_id')
                        .in('user_id', activeUserIds)
                        .eq('status', 'active'); // Or just take the latest?

                    if (subs) {
                        subs.forEach(s => {
                            userPlans[s.user_id] = { plan_id: s.plan_id, pt_plan_id: s.pt_plan_id };
                        });
                    }
                }

                // 4. Merge & Map
                const mappedActive = activeUsers.map(u => ({
                    id: u.user_id,
                    full_name: u.full_name,
                    phone_number: u.phone_number,
                    email: u.app_users?.email,
                    role: u.role,
                    status: 'Active',
                    created_at: u.created_at,
                    gym_code: u.gym_code,
                    plan_id: userPlans[u.user_id]?.plan_id || null,
                    pt_plan_id: userPlans[u.user_id]?.pt_plan_id || null,
                    address: u.address
                }));

                const mappedPending = pendingUsers.map(u => ({
                    id: u.id,
                    full_name: u.name,
                    phone_number: u.phone,
                    email: u.email,
                    role: u.role,
                    status: 'Pending',
                    created_at: u.created_at,
                    gym_code: gymCode,
                    plan_id: u.plan_id,
                    pt_plan_id: u.pt_plan_id,
                    address: u.address
                }));

                // Combine and sort by newest first
                result = [...mappedPending, ...mappedActive].sort((a, b) =>
                    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                );
                break;

            case 'bulk_create':
                const { users } = payload;
                if (!Array.isArray(users) || users.length === 0) {
                    throw new Error("No users provided");
                }

                const invitationsToInsert = users.map(u => ({
                    gym_code: gymCode,
                    role: u.role?.toLowerCase() || 'member',
                    name: u.name,
                    phone: u.phone,
                    email: u.email,
                    address: u.address || null,
                    plan_id: null,
                    status: 'pending'
                }));

                ({ data: result, error } = await supabaseClient
                    .from('invitations')
                    .insert(invitationsToInsert)
                    .select());
                break;

            case 'create':
                // Creating a user "Directly" means creating an Invitation
                if (!payload.name || (!payload.phone && !payload.email)) {
                    throw new Error("Name and either Phone or Email are required");
                }

                // Check if already invited
                const { data: existingInvite } = await supabaseClient
                    .from('invitations')
                    .select('id')
                    .eq('gym_code', gymCode)
                    .or(`phone.eq.${payload.phone},email.eq.${payload.email}`)
                    .maybeSingle();

                if (existingInvite) throw new Error("User already invited");

                // Create Invitation
                ({ data: result, error } = await supabaseClient
                    .from('invitations')
                    .insert({
                        gym_code: gymCode,
                        role: payload.role?.toLowerCase() || 'member',
                        name: payload.name,
                        phone: payload.phone,
                        email: payload.email,
                        plan_id: payload.plan_id || null,
                        pt_plan_id: payload.pt_plan_id || null,
                        status: 'pending',
                        address: payload.address
                    })
                    .select()
                    .single());
                break;

            case 'update':
                if (!payload?.id) throw new Error("Missing user ID");

                // 1. Try updating Invitation (Pending User)
                const { data: inviteUpdate, error: inviteError } = await supabaseClient
                    .from('invitations')
                    .update({
                        name: payload.name,
                        phone: payload.phone,
                        email: payload.email,
                        role: payload.role?.toLowerCase(),
                        plan_id: payload.plan_id,
                        pt_plan_id: payload.pt_plan_id,
                        address: payload.address
                    })
                    .eq('id', payload.id)
                    .select()
                    .maybeSingle();

                if (inviteUpdate) {
                    result = inviteUpdate;
                    break;
                }

                // 2. If not invitation, Update Profile (Active User)
                const profileUpdates: any = {};
                if (payload.name) profileUpdates.full_name = payload.name;
                if (payload.phone) profileUpdates.phone_number = payload.phone;
                if (payload.role) profileUpdates.role = payload.role.toLowerCase();
                if (payload.address) profileUpdates.address = payload.address;

                const { data: profileUpdate, error: profileError } = await supabaseClient
                    .from('profiles')
                    .update(profileUpdates)
                    .eq('user_id', payload.id)
                    .eq('gym_code', gymCode)
                    .select()
                    .single();

                if (profileError) throw profileError;
                result = profileUpdate;

                // 3. Update Subscription for Active User
                if (payload.plan_id || payload.pt_plan_id !== undefined) {
                    const { data: existingSub } = await supabaseClient
                        .from('subscriptions')
                        .select('id')
                        .eq('user_id', payload.id)
                        .maybeSingle();

                    const subUpdates: any = {};
                    if (payload.plan_id) subUpdates.plan_id = payload.plan_id;
                    if (payload.pt_plan_id !== undefined) subUpdates.pt_plan_id = payload.pt_plan_id;

                    if (existingSub) {
                        await supabaseClient
                            .from('subscriptions')
                            .update(subUpdates)
                            .eq('id', existingSub.id);
                    } else {
                        await supabaseClient
                            .from('subscriptions')
                            .insert({
                                user_id: payload.id,
                                plan_id: payload.plan_id || null,
                                pt_plan_id: payload.pt_plan_id || null,
                                status: 'active'
                            });
                    }
                }
                break;

            case 'delete':
                if (!payload?.id) throw new Error("Missing user ID");
                // Soft delete / Detach from Gym (set gym_code to null)
                ({ data: result, error } = await supabaseClient
                    .from('profiles')
                    .update({ gym_code: null })
                    .eq('user_id', payload.id)
                    .eq('gym_code', gymCode)
                    .select()
                    .single());
                break;

            default:
                throw new Error(`Invalid action: ${action}`);
        }

        if (error) {
            console.error("Action Error:", error);
            throw error;
        }

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
