import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.0.0";
import { corsHeaders } from "../_shared/cors.ts";

console.log("Sessions Function Up!");

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) throw new Error('Missing Authorization header');
        const token = authHeader.replace('Bearer ', '');

        // Authorization
        const googleRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${Deno.env.get('FIREBASE_API_KEY')}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken: token })
        });
        const googleData = await googleRes.json();
        if (!googleData.users) throw new Error("Unauthorized");
        const firebaseUid = googleData.users[0].localId;

        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        const { data: userMap } = await supabaseClient
            .from('app_users')
            .select('id')
            .eq('firebase_uid', firebaseUid)
            .single();
        if (!userMap) throw new Error("User not found");
        const userId = userMap.id;

        const url = new URL(req.url);
        const pathParts = url.pathname.split('/');
        const action = pathParts[pathParts.length - 1]; // "start", "finish" or ID?

        // POST /sessions/start
        if (action === 'start' && req.method === 'POST') {
            const { workout_id } = await req.json();

            const { data: session, error } = await supabaseClient
                .from('sessions')
                .insert({
                    user_id: userId,
                    workout_id: workout_id || null,
                    status: 'started',
                    started_at: new Date()
                })
                .select()
                .single();

            if (error) throw error;
            return new Response(JSON.stringify(session), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        // POST /sessions/finish
        // We expect body to contain session_id if simpler, or use URL param /sessions/:id/finish
        if (action === 'finish' && req.method === 'POST') {
            const { session_id, logs, metrics } = await req.json();

            const { data: session, error } = await supabaseClient
                .from('sessions')
                .update({
                    status: 'completed',
                    completed_at: new Date(),
                    logs: logs || {},
                    metrics: metrics || {}
                })
                .eq('id', session_id)
                .eq('user_id', userId) // Security check
                .select()
                .single();

            if (error) throw error;
            return new Response(JSON.stringify(session), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        throw new Error("Action not found");

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
