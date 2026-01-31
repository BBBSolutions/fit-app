import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        );

        // Service role for admin lookups and inserts
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        const { gymCode, role } = await req.json(); // role defaults to 'member' if not provided

        const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
        if (userError || !user) throw new Error('Unauthorized: Please login first.');

        // 1. Validate Gym Code
        const { data: branch, error: branchError } = await supabaseAdmin
            .from('branches')
            .select('id, name, owner_id')
            .eq('gym_code', gymCode)
            .single();

        if (branchError || !branch) {
            throw new Error('Invalid Gym Code. Please check and try again.');
        }

        // 2. Check if already a member
        const { data: existingMember } = await supabaseAdmin
            .from('branch_users')
            .select('id')
            .eq('branch_id', branch.id)
            .eq('user_id', user.id)
            .single();

        if (existingMember) {
            throw new Error('You are already a member of this gym.');
        }

        // 3. Add to Branch
        const { error: joinError } = await supabaseAdmin
            .from('branch_users')
            .insert({
                branch_id: branch.id,
                user_id: user.id,
                role: role || 'member',
                status: 'pending' // Default to pending until approved? Or active? Requirements say "Admin approval (optional config)". Let's defaults to pending or active based on a hypothetical setting. For now: PENDING.
            });

        if (joinError) throw joinError;

        return new Response(
            JSON.stringify({
                message: `Successfully joined ${branch.name}`,
                branch: branch
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        );

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            }
        );
    }
});
