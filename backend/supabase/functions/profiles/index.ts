import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.0.0";
import { corsHeaders } from "../_shared/cors.ts";

console.log("Profiles Function Up!");

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // Auth Check
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) throw new Error('Missing Authorization header');

        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

        if (authError || !user) {
            throw new Error("Unauthorized: " + (authError?.message || "Invalid Token"));
        }

        const userId = user.id;

        // Handlers
        const url = new URL(req.url);
        const path = url.pathname.replace(/\/$/, '').split('/').pop(); // "get" or "update" or "profiles"

        // --- Specific Routes First ---
        if (path === 'push-token' && req.method === 'POST') {
            const { token } = await req.json();
            console.log("Saving push token for user:", userId, token);

            const { error } = await supabaseClient
                .from('profiles')
                .update({ push_token: token })
                .eq('user_id', userId);

            if (error) throw error;

            return new Response(JSON.stringify({ success: true }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        if (path === 'get' || req.method === 'GET') {
            // Check if specific userId is requested
            const requestedUserId = url.searchParams.get('userId');
            console.log("Profiles GET. AuthUser:", userId, "RequestedUser:", requestedUserId, "URL:", req.url);
            const targetId = requestedUserId || userId;

            const { data: profiles, error } = await supabaseClient
                .from('profiles')
                .select('*')
                .eq('user_id', targetId)
                .limit(1);

            if (error) throw error;

            // Handle if no profile found
            if (!profiles || profiles.length === 0) {
                return new Response(JSON.stringify({ error: "Profile not found" }), {
                    status: 404,
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                });
            }

            const profile = profiles[0];

            // Fetch trainer info if it exists (for Members)
            // Fetch trainer info if it exists (for Members)
            // Use limit(1) to avoid "Cannot coerce..." error if multiple records exist
            const { data: trainerRelations } = await supabaseClient
                .from('trainer_clients')
                .select('trainer_id')
                .eq('client_id', targetId)
                .limit(1);

            if (trainerRelations && trainerRelations.length > 0) {
                // @ts-ignore
                profile.trainer_id = trainerRelations[0].trainer_id;
            }

            // Fetch user roles from branch_users
            const { data: branchUserRoles } = await supabaseClient
                .from('branch_users')
                .select('role')
                .eq('user_id', targetId);

            profile.roles = branchUserRoles ? branchUserRoles.map(r => r.role) : [];

            return new Response(JSON.stringify(profile), {
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        if (path === 'update' || req.method === 'POST' || req.method === 'PUT') {
            const updates = await req.json();
            // Prevent updating read-only or dynamic fields
            delete updates.user_id;
            delete updates.roles;
            delete updates.trainer_id;

            console.log("Upserting profile for:", userId, "Data:", JSON.stringify(updates));

            // Use upsert to handle cases where profile might be missing
            const { data, error } = await supabaseClient
                .from('profiles')
                .upsert({ user_id: userId, ...updates })
                .select();

            if (error) {
                console.error("Upsert Error:", error);
                throw error;
            }

            if (!data || data.length === 0) {
                console.error("Upsert returned no rows. Updates:", updates);
                // If upsert returns no rows, it usually means RLS violation or constraint failure not caught
                throw new Error("Update returned no data. Check RLS or schema.");
            }

            return new Response(JSON.stringify(data[0]), {
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        throw new Error("Route not found");

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
