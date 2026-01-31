import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
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

        const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
        if (userError || !user) throw new Error('Unauthorized');

        // Use Admin Client to bypass RLS recursion issues
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        // Fetch branches where the user is an owner or branch_admin
        const { data: userBranches, error: branchError } = await supabaseAdmin
            .from('branch_users')
            .select(`
                role,
                branches (
                    id,
                    name,
                    gym_code,
                    city,
                    state,
                    country,
                    address,
                    contact_email,
                    contact_phone,
                    zip_code,
                    timezone,
                    created_at
                )
            `)
            .eq('user_id', user.id)
            .in('role', ['owner', 'branch_admin']);

        if (branchError) throw branchError;

        // Transform data to a flat structure
        // Filter out any null branches (in case of data integrity issues)
        const branches = userBranches
            .filter(b => b.branches)
            .map(b => ({
                ...b.branches, // Spread branch details
                role: b.role   // Add user's role in that branch
            }));

        if (req.method === 'DELETE') {
            const { branchId } = await req.json();
            if (!branchId) throw new Error("Branch ID is required");

            // Verify ownership
            const { data: ownership, error: checkError } = await supabaseAdmin
                .from('branches')
                .select('id')
                .eq('id', branchId)
                .eq('owner_id', user.id)
                .single();

            if (checkError || !ownership) throw new Error("You do not have permission to delete this branch");

            const { error: deleteError } = await supabaseAdmin
                .from('branches')
                .delete()
                .eq('id', branchId);

            if (deleteError) throw deleteError;

            return new Response(JSON.stringify({ success: true }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            });
        }

        if (req.method === 'PUT') {
            const { branchId, updates } = await req.json();
            if (!branchId || !updates) throw new Error("Branch ID and updates are required");

            // Verify ownership
            const { data: ownership, error: checkError } = await supabaseAdmin
                .from('branches')
                .select('id')
                .eq('id', branchId)
                .eq('owner_id', user.id)
                .single();

            if (checkError || !ownership) throw new Error("You do not have permission to update this branch");

            const { data: updatedBranch, error: updateError } = await supabaseAdmin
                .from('branches')
                .update(updates)
                .eq('id', branchId)
                .select()
                .single();

            if (updateError) throw updateError;

            return new Response(JSON.stringify({ branch: updatedBranch }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            });
        }

        return new Response(
            JSON.stringify({ branches }),
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
