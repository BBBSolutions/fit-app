import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.0.0";
import { corsHeaders } from "../_shared/cors.ts";

console.log("Measurement Logs Function Up!");

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // --- AUTH API ---
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) throw new Error('Missing Authorization header');
        const token = authHeader.replace('Bearer ', '');

        // Verify with Firebase
        const googleRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${Deno.env.get('FIREBASE_API_KEY')}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken: token })
        });
        const googleData = await googleRes.json();
        if (!googleData.users) throw new Error("Unauthorized: Invalid Firebase Token");
        const firebaseUid = googleData.users[0].localId;
        // ----------------

        // --- SUPABASE CLIENT ---
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        // Get Internal User ID
        const { data: userMap } = await supabaseClient
            .from('app_users')
            .select('id')
            .eq('firebase_uid', firebaseUid)
            .single();

        if (!userMap) throw new Error("User not found in database.");
        const userId = userMap.id;
        // -----------------------

        const url = new URL(req.url);
        
        // GET Request (Fetch History)
        if (req.method === 'GET') {
            const type = url.searchParams.get('type');
            const dateGte = url.searchParams.get('date.gte'); // We'll parse manual params from our API convention
            const dateLte = url.searchParams.get('date.lte');

            let query = supabaseClient
                .from('measurement_logs')
                .select('*')
                .eq('user_id', userId)
                .order('date', { ascending: true });

            // Since api.js sends PostgREST style params like type=eq.weight, we need to parse or simplify api.js
            // Let's simplify api.js to send clear params, OR handle the "eq." prefix here.
            // For robustness, let's look for clean params 'type', 'startDate', 'endDate'
            
            // NOTE: I will update api.js to send clean query params: ?type=weight&startDate=...&endDate=...
            if (type) query = query.eq('type', type.replace('eq.', ''));
            if (dateGte) query = query.gte('date', dateGte.replace('gte.', ''));
            if (dateLte) query = query.lte('date', dateLte.replace('lte.', ''));

            // Check if specific clean params are passed (from updated api.js)
            const cleanType = url.searchParams.get('type_filter');
            const cleanStart = url.searchParams.get('start_date');
            const cleanEnd = url.searchParams.get('end_date');

            if (cleanType) query = query.eq('type', cleanType);
            if (cleanStart) query = query.gte('date', cleanStart);
            if (cleanEnd) query = query.lte('date', cleanEnd);

            const { data, error } = await query;
            if (error) throw error;

            return new Response(JSON.stringify(data), {
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        // POST Request (Log Measurement)
        if (req.method === 'POST') {
            const body = await req.json();
            const { date, type, value } = body;

            if (!date || !type || value === undefined) throw new Error("Missing required fields: date, type, value");

            const { data, error } = await supabaseClient
                .from('measurement_logs')
                .insert({
                    user_id: userId,
                    date,
                    type,
                    value
                })
                .select()
                .single();

            if (error) throw error;

            return new Response(JSON.stringify(data), {
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        throw new Error(`Method ${req.method} not supported`);

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
