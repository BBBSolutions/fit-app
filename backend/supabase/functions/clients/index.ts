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

        // Verify/Get User ID from Token using Supabase Auth
        const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

        if (authError || !user) {
            console.error("Supabase Auth Error:", authError);
            throw new Error("Unauthorized: " + (authError?.message || "Invalid Token"));
        }

        // Trainer ID is the authenticated user's ID
        const trainerId = user.id;
        console.log("Resolved Trainer ID (Supabase Auth):", trainerId);

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
                // Fallback: Check profiles for directly assigned users (legacy/migration support)
                const { data: profileClients, error: profileFallbackError } = await supabaseClient
                    .from('profiles')
                    .select('*')
                    .eq('assigned_trainer_id', trainerId);

                if (profileFallbackError) {
                    console.error("Error fetching fallback profiles:", profileFallbackError);
                }

                if (!profileClients || profileClients.length === 0) {
                    return new Response(JSON.stringify([]), {
                        headers: { ...corsHeaders, "Content-Type": "application/json" }
                    });
                }

                // Return mapped fallback clients
                const mappedFallback = profileClients.map(p => ({
                    id: p.user_id,
                    name: p.full_name || p.name || 'Unknown',
                    goal: p.goal,
                    status: 'Active', // Assumed active if assigned
                    image: p.avatar_url,
                    lastActive: p.updated_at || 'Unknown',
                    age: p.age || 'N/A',
                    plan: 'None'
                }));

                return new Response(JSON.stringify(mappedFallback), {
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
                lastActive: p.updated_at || 'Unknown',
                age: p.age || 'N/A',
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
