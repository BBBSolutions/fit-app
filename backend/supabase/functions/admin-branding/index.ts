
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

        const userId = user.id;

        // 2. Parse action and payload from body
        const body = await req.json();
        const { action, payload } = body;

        let result;
        let error;

        switch (action) {
            case 'fetch':
            case undefined:
                // Fetch Branding Details
                const { data: profile, error: fetchError } = await supabaseClient
                    .from('profiles')
                    .select('organization_name, gym_metadata')
                    .eq('user_id', userId)
                    .single();

                if (fetchError) throw fetchError;

                // Return structured data for UI
                result = {
                    gymName: profile.organization_name || '',
                    branding: profile.gym_metadata?.branding || {}
                    // branding structure: { primaryColor, secondaryColor, accentColor, logo }
                };
                break;

            case 'update':
                // Update Branding Details
                const { gymName, branding } = payload;
                if (!gymName) throw new Error("Gym Name is required");

                // Get existing metadata to merge
                const { data: existingProfile } = await supabaseClient
                    .from('profiles')
                    .select('gym_metadata')
                    .eq('user_id', userId)
                    .single();

                const currentMetadata = existingProfile?.gym_metadata || {};
                const updatedMetadata = {
                    ...currentMetadata,
                    branding: {
                        ...currentMetadata.branding,
                        ...branding
                    }
                };

                const { data: updateData, error: updateError } = await supabaseClient
                    .from('profiles')
                    .update({
                        organization_name: gymName,
                        gym_metadata: updatedMetadata
                    })
                    .eq('user_id', userId)
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
