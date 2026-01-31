import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function generateGymCode(city, gymName) {
    // Format: FIT-CITY-RANDOM (e.g., FIT-DEL-XV92)
    const cityCode = (city || 'GEN').substring(0, 3).toUpperCase();
    const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `FIT-${cityCode}-${randomPart}`;
}

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

        // Use Service Role for admin actions (like inserting into branch_users for specific roles if needed)
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        const {
            gymName, branchName, city, state, country, address, street, pincode
        } = await req.json();

        const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
        if (userError || !user) throw new Error('Unauthorized');

        // Generate Unique Gym Code (simple retry logic)
        let gymCode = '';
        let isUnique = false;
        let attempts = 0;

        while (!isUnique && attempts < 5) {
            gymCode = generateGymCode(city, gymName);
            const { data } = await supabaseAdmin.from('branches').select('id').eq('gym_code', gymCode).single();
            if (!data) isUnique = true;
            attempts++;
        }

        if (!isUnique) throw new Error('Failed to generate unique gym code. Please try again.');

        // Create Branch
        const { data: branch, error: branchError } = await supabaseAdmin
            .from('branches')
            .insert({
                owner_id: user.id,
                name: branchName || gymName, // Default to Gym Name if no branch name
                city,
                state,
                country,
                address: street, // Use street as address line
                zip_code: pincode,
                gym_code: gymCode,
                // Add default timezone if provided or default to valid one
                timezone: 'UTC'
            })
            .select()
            .single();

        if (branchError) throw branchError;

        // Assign Owner as Branch Admin
        const { error: memberError } = await supabaseAdmin
            .from('branch_users')
            .insert({
                branch_id: branch.id,
                user_id: user.id,
                role: 'owner', // The owner is also an 'owner' within the branch context
                status: 'active'
            });

        if (memberError) {
            // Basic cleanup if assignment fails
            await supabaseAdmin.from('branches').delete().eq('id', branch.id);
            throw memberError;
        }

        return new Response(
            JSON.stringify({ branch, message: 'Branch created successfully' }),
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
