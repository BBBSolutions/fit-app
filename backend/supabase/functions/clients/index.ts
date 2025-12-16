import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.0.0";
import { corsHeaders } from "../_shared/cors.ts";

console.log("Clients Function Up!");

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) throw new Error('Missing Authorization header');
        const token = authHeader.replace('Bearer ', '');

        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        // Verify/Get User ID from Token (Simplified: in prod use Google Verify)
        const googleRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${Deno.env.get('FIREBASE_API_KEY')}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken: token })
        });
        const googleData = await googleRes.json();
        if (!googleData.users) throw new Error("Unauthorized");
        const firebaseUid = googleData.users[0].localId;

        const { data: userMap } = await supabaseClient
            .from('app_users')
            .select('id')
            .eq('firebase_uid', firebaseUid)
            .single();

        if (!userMap) {
            console.error("User map not found for UID:", firebaseUid);
            throw new Error("User not found");
        }
        const trainerId = userMap.id;
        console.log("Resolved Trainer ID:", trainerId);

        const url = new URL(req.url);
        const path = url.pathname.replace(/\/$/, '').split('/').pop(); // "list" or "invite"

        if (path === 'list') {
            // 1. Get List of Client IDs
            const { data: relations, error: relError } = await supabaseClient
                .from('trainer_clients')
                .select('client_id, status')
                .eq('trainer_id', trainerId);

            if (relError) {
                console.error("Error fetching relations:", relError);
                throw relError;
            }

            const clientIds = relations.map(r => r.client_id);
            const statusMap = relations.reduce((acc, r) => {
                acc[r.client_id] = r.status;
                return acc;
            }, {});

            if (clientIds.length === 0) {
                return new Response(JSON.stringify([]), {
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                });
            }

            // 2. Get Profiles
            const { data: profiles, error: profileError } = await supabaseClient
                .from('profiles')
                .select('*')
                .in('user_id', clientIds);

            if (profileError) {
                console.error("Error fetching profiles:", profileError);
                throw profileError;
            }

            // 3. Merge
            const clients = profiles.map(p => ({
                id: p.user_id,
                name: p.full_name || p.name || 'Unknown',
                goal: p.goal,
                status: statusMap[p.user_id] || 'Active',
                image: p.avatar_url,
                lastActive: 'Unknown',
                plan: 'None'
            }));

            return new Response(JSON.stringify(clients), {
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        if (path === 'invite') {
            const { email } = await req.json();
            // TODO: Implement invitation logic (lookup user by email, create pending record)
            // For now just mock it or throw unimplemented
            return new Response(JSON.stringify({ message: "Invite sent (mock)" }), {
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
