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

        // We expect "Bearer <FirebaseToken>"
        // In a real scenario, we verify this token again OR trust the client if we use Supabase Auth wrappers. 
        // BUT since we are bridging Firebase -> Supabase, we rely on our 'auth-verify' endpoint to have been called first
        // to create the user, AND here we should ideally verify the token again.
        // For MVP performance, let's assume we pass the internal Supabase UUID or verify Firebase token again.
        // OPTION A: Verify Firebase Token again (Secure).
        // OPTION B: Client sends custom header "x-user-id" validated by middleware (Not available here).

        // Let's implement lightweight Firebase verification or lookup.
        // For this specific deliverable, we'll repeat the lookup pattern or strictly require the UUID in the body/query 
        // validated against the token owner.

        // SIMPLIFICATION:
        // We will parse the body for `user_id` and rely on RLS if using Supabase Client with a custom JWT?
        // No, Supabase Client here is Service Role (Admin). We must manually enforce checks.

        // REVISED STRATEGY:
        // The Frontend has the Firebase Token. It calls this function.
        // We MUST verify the token to know WHO is asking.
        const token = authHeader.replace('Bearer ', '');
        // Call Google to verify (Costly but secure for stateless function)
        const googleRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${Deno.env.get('FIREBASE_API_KEY')}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken: token })
        });
        const googleData = await googleRes.json();
        if (!googleData.users) throw new Error("Unauthorized");
        const firebaseUid = googleData.users[0].localId;

        // Get User ID
        const { data: userMap } = await supabaseClient
            .from('app_users')
            .select('id')
            .eq('firebase_uid', firebaseUid)
            .single();

        if (!userMap) throw new Error("User not found in database. Call /auth/verify first.");
        const userId = userMap.id;

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

            const { data: profile, error } = await supabaseClient
                .from('profiles')
                .select('*')
                .eq('user_id', targetId)
                .single();
            if (error) throw error;

            // Fetch trainer info if it exists (for Members)
            const { data: trainerRelation } = await supabaseClient
                .from('trainer_clients')
                .select('trainer_id')
                .eq('client_id', targetId)
                .single();

            if (trainerRelation) {
                // @ts-ignore
                profile.trainer_id = trainerRelation.trainer_id;
            }

            return new Response(JSON.stringify(profile), {
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        if (path === 'update' || req.method === 'POST' || req.method === 'PUT') {
            const updates = await req.json();
            // Prevent updating user_id
            delete updates.user_id;

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
