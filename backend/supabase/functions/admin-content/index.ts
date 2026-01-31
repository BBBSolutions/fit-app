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
            throw new Error("Admin profile or Gym Code not found");
        }
        const gymCode = branchUser.branches.gym_code;

        // 2. Handle Actions
        let result;
        let error;

        switch (action) {
            case 'fetch':
                ({ data: result, error } = await supabaseClient
                    .from('content')
                    .select('*')
                    .eq('gym_code', gymCode)
                    .order('updated_at', { ascending: false }));
                break;

            case 'create':
                if (!payload) throw new Error("Missing payload for create");
                ({ data: result, error } = await supabaseClient
                    .from('content')
                    .insert({
                        ...payload,
                        gym_code: gymCode,
                        author_id: userId
                    })
                    .select()
                    .single());
                break;

            case 'update':
                if (!payload?.id) throw new Error("Missing content ID for update");
                const { id, ...updates } = payload;
                ({ data: result, error } = await supabaseClient
                    .from('content')
                    .update(updates)
                    .eq('id', id)
                    .eq('gym_code', gymCode)
                    .select()
                    .single());
                break;

            case 'delete':
                if (!payload?.id) throw new Error("Missing content ID for delete");
                ({ data: result, error } = await supabaseClient
                    .from('content')
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
