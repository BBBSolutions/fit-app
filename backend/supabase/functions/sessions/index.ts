import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
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

        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

        const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

        const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

        if (authError || !user) {
            console.error("Auth error:", authError);
            throw new Error("Unauthorized");
        }

        const userId = user.id;

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

        // GET /sessions (History)
        if (req.method === 'GET') {
            const startDate = url.searchParams.get('start_date');
            const endDate = url.searchParams.get('end_date');

            let query = supabaseClient
                .from('sessions')
                .select('id,started_at,completed_at,metrics')
                .eq('user_id', userId)
                .eq('status', 'completed')
                .order('started_at', { ascending: false });

            if (startDate) query = query.gte('started_at', startDate);
            if (endDate) query = query.lte('started_at', endDate);

            const { data, error } = await query;
            if (error) throw error;

            return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
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
