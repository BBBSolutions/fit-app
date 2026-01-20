import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.0.0";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { token, action, payload } = await req.json();

        if (!token) throw new Error('Missing token');

        // 1. Verify Auth & Get Gym Code
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
        const firebaseKey = Deno.env.get('FIREBASE_API_KEY') ?? '';
        const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

        const authResponse = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken: token })
        });
        const googleData = await authResponse.json();
        if (!googleData.users) throw new Error("Unauthorized");
        const firebaseUid = googleData.users[0].localId;

        // 2. Resolve Internal User ID
        const { data: userData, error: userError } = await supabaseClient
            .from('app_users')
            .select('id')
            .eq('firebase_uid', firebaseUid)
            .single();

        if (userError || !userData) throw new Error("User map not found");
        const internalUserId = userData.id;

        const { data: adminProfile, error: profileError } = await supabaseClient
            .from('profiles')
            .select('gym_code')
            .eq('user_id', internalUserId)
            .single();

        if (profileError || !adminProfile?.gym_code) throw new Error("Admin profile or Gym Code not found");
        const gymCode = adminProfile.gym_code;

        // 2. Handle Actions
        let result;
        let error;

        switch (action) {
            // PLANS (CRUD)
            case 'fetch_plans':
                ({ data: result, error } = await supabaseClient
                    .from('plans')
                    .select('*')
                    .eq('gym_code', gymCode)
                    .order('created_at', { ascending: false }));
                break;

            case 'create_plan':
                if (!payload) throw new Error("Missing payload for create_plan");
                ({ data: result, error } = await supabaseClient
                    .from('plans')
                    .insert({ ...payload, gym_code: gymCode })
                    .select()
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
                    .select()
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
                // This would usually come from Stripe or distinct tables. 
                // For now, we will return empty lists or query the existing (schema v1) subscriptions table if relevant,
                // but migration 20240101...00_initial_schema.sql created a 'subscriptions' table.
                // We need to ensuring we filter by users belonging to this gym.

                // 1. Get all user IDs for this gym
                const { data: gymUsers } = await supabaseClient
                    .from('profiles')
                    .select('user_id')
                    .eq('gym_code', gymCode);

                const userIds = gymUsers?.map(u => u.user_id) || [];

                let subscriptions = [];
                let invoices = []; // 'payments' table in schema

                if (userIds.length > 0) {
                    const { data: subs } = await supabaseClient
                        .from('subscriptions')
                        .select('*, profiles:user_id(name)') // Join to get user name
                        .in('user_id', userIds);
                    subscriptions = subs || [];

                    const { data: invs } = await supabaseClient
                        .from('payments') // Assuming payments acts as invoices history
                        .select('*, profiles:user_id(name)')
                        .in('user_id', userIds)
                        .order('created_at', { ascending: false })
                        .limit(50);
                    invoices = invs || [];
                }

                result = { subscriptions, invoices };
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
