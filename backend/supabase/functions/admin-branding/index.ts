
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
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

        const userId = user.id;

        // 3. Parse action and payload from body
        const body = await req.json();
        const { action, payload, branchId } = body;

        let targetOwnerId = userId;

        // Determine Owner ID (Branding is stored on Owner Profile)
        // Check if the current user is an owner
        const { data: activeOwner } = await supabaseClient
            .from('owners')
            .select('id')
            .eq('id', userId)
            .maybeSingle();

        if (!activeOwner) {
            // Not an owner, try to find context via Branch Access (e.g. Branch Admin)
            let query = supabaseClient
                .from('branch_users')
                .select('role, branches(owner_id)')
                .eq('user_id', userId)
                .in('role', ['branch_admin']); // Only admins can manage branding

            if (branchId) {
                query = query.eq('branch_id', branchId);
            }

            const { data: branchUser, error: branchError } = await query.limit(1).single();

            if (branchError || !branchUser?.branches?.owner_id) {
                console.error("Branding Access Error:", branchError);
                throw new Error("You are not authorized to manage branding for this gym.");
            }

            targetOwnerId = branchUser.branches.owner_id;
        }

        let result;
        let error;

        switch (action) {
            case 'fetch':
            case undefined:
                // Fetch Branding Details
                const { data: ownerProfile, error: fetchError } = await supabaseClient
                    .from('owners')
                    .select('business_name, metadata')
                    .eq('id', targetOwnerId)
                    .maybeSingle();

                if (fetchError) {
                    console.error("Error fetching admin branding:", fetchError);
                    // Don't crash, return defaults
                    result = {
                        gymName: 'My Gym',
                        branding: { primaryColor: '#2D3748', secondaryColor: '#718096' }
                    };
                } else {
                    result = {
                        gymName: ownerProfile?.business_name || 'My Gym',
                        branding: ownerProfile?.metadata?.branding || {}
                    };
                }
                break;

            case 'update':
                // Update Branding Details
                const { gymName, branding } = payload;
                if (!gymName) throw new Error("Gym Name is required");

                // Get existing metadata
                const { data: existingOwner } = await supabaseClient
                    .from('owners')
                    .select('metadata')
                    .eq('id', targetOwnerId)
                    .maybeSingle();

                const currentMetadata = existingOwner?.metadata || {};
                const updatedMetadata = {
                    ...currentMetadata,
                    branding: {
                        ...(currentMetadata.branding || {}),
                        ...branding
                    }
                };

                const { data: updateData, error: updateError } = await supabaseClient
                    .from('owners')
                    .update({
                        business_name: gymName,
                        metadata: updatedMetadata
                    })
                    .eq('id', targetOwnerId)
                    .select()
                    .single();

                if (updateError) throw updateError;
                result = updateData;
                break;

            default:
                throw new Error(`Invalid action: ${action}`);
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
