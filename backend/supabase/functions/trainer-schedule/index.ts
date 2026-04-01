import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";

console.log("Trainer Schedule Function Up!");

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

        const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
        if (authError || !user) {
            console.error("Auth error:", authError);
            throw new Error("Unauthorized");
        }

        const trainerId = user.id;
        const url = new URL(req.url);

        // ------------------------------------------------------------------
        // GET /trainer-schedule?date=YYYY-MM-DD
        // Returns all sessions for the trainer on the given date (or today).
        // ------------------------------------------------------------------
        if (req.method === 'GET') {
            const dateParam = url.searchParams.get('date');
            const date = dateParam ? new Date(dateParam) : new Date();

            // Build start/end of the day in UTC
            const startOfDay = new Date(date);
            startOfDay.setUTCHours(0, 0, 0, 0);
            const endOfDay = new Date(date);
            endOfDay.setUTCHours(23, 59, 59, 999);

            const { data: sessions, error } = await supabaseClient
                .from('scheduled_sessions')
                .select('*')
                .eq('trainer_id', trainerId)
                .gte('scheduled_at', startOfDay.toISOString())
                .lte('scheduled_at', endOfDay.toISOString())
                .order('scheduled_at', { ascending: true });

            if (error) throw error;

            // Enrich with client names
            const clientIds = [...new Set(sessions.map((s: any) => s.client_id))];
            let profilesMap: Record<string, any> = {};

            if (clientIds.length > 0) {
                const { data: profiles } = await supabaseClient
                    .from('profiles')
                    .select('user_id, full_name, avatar_url')
                    .in('user_id', clientIds);

                if (profiles) {
                    profiles.forEach((p: any) => {
                        profilesMap[p.user_id] = p;
                    });
                }
            }

            const enriched = sessions.map((s: any) => {
                const profile = profilesMap[s.client_id] || {};
                return {
                    ...s,
                    clientName: profile.full_name || 'Unknown Client',
                    clientAvatar: profile.avatar_url || null,
                };
            });

            return new Response(JSON.stringify(enriched), {
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        // ------------------------------------------------------------------
        // POST /trainer-schedule  – Create a new scheduled session
        // ------------------------------------------------------------------
        if (req.method === 'POST') {
            const body = await req.json();
            const { client_id, scheduled_at, duration_minutes, session_type, goal, notes } = body;

            if (!client_id || !scheduled_at) {
                throw new Error('client_id and scheduled_at are required');
            }

            const { data, error } = await supabaseClient
                .from('scheduled_sessions')
                .insert({
                    trainer_id: trainerId,
                    client_id,
                    scheduled_at,
                    duration_minutes: duration_minutes || 60,
                    session_type: session_type || 'Personal Training',
                    goal: goal || null,
                    notes: notes || null,
                    status: 'upcoming',
                })
                .select()
                .single();

            if (error) throw error;
            return new Response(JSON.stringify(data), {
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        // ------------------------------------------------------------------
        // PATCH /trainer-schedule?id=<sessionId>  – Update status / details
        // ------------------------------------------------------------------
        if (req.method === 'PATCH') {
            const sessionId = url.searchParams.get('id');
            if (!sessionId) throw new Error('Session ID is required');

            const updates = await req.json();

            const { data, error } = await supabaseClient
                .from('scheduled_sessions')
                .update(updates)
                .eq('id', sessionId)
                .eq('trainer_id', trainerId)   // Security guard
                .select()
                .single();

            if (error) throw error;
            return new Response(JSON.stringify(data), {
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        // ------------------------------------------------------------------
        // DELETE /trainer-schedule?id=<sessionId>
        // ------------------------------------------------------------------
        if (req.method === 'DELETE') {
            const sessionId = url.searchParams.get('id');
            if (!sessionId) throw new Error('Session ID is required');

            const { error } = await supabaseClient
                .from('scheduled_sessions')
                .delete()
                .eq('id', sessionId)
                .eq('trainer_id', trainerId);

            if (error) throw error;
            return new Response(JSON.stringify({ success: true }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        throw new Error("Method not supported");

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
