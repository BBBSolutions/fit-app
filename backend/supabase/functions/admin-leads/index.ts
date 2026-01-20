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
            case 'fetch':
                ({ data: result, error } = await supabaseClient
                    .from('leads')
                    .select('*')
                    .eq('gym_code', gymCode)
                    .order('created_at', { ascending: false }));
                break;

            case 'create':
                if (!payload) throw new Error("Missing payload for create");
                ({ data: result, error } = await supabaseClient
                    .from('leads')
                    .insert({ ...payload, gym_code: gymCode })
                    .select()
                    .single());
                break;

            case 'update':
                if (!payload?.id) throw new Error("Missing lead ID for update");
                const { id, ...updates } = payload;
                ({ data: result, error } = await supabaseClient
                    .from('leads')
                    .update(updates)
                    .eq('id', id)
                    .eq('gym_code', gymCode) // Security: Ensure generic update doesn't cross tenants
                    .select()
                    .single());
                break;

            case 'delete':
                if (!payload?.id) throw new Error("Missing lead ID for delete");
                ({ data: result, error } = await supabaseClient
                    .from('leads')
                    .delete()
                    .eq('id', payload.id)
                    .eq('gym_code', gymCode));
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
