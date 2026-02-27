import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";

console.log("Diet Function Up!");

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) throw new Error('Missing Authorization header');

        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        const token = authHeader.replace('Bearer ', '');

        const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

        if (authError || !user) {
            console.error("Auth error:", authError);
            throw new Error("Unauthorized");
        }

        const userId = user.id;

        const url = new URL(req.url);
        // Path logic might be 'diet/log' so we check path suffix or query params
        // api.js calls `${API_BASE_URL}/diet/log`
        // In local Supabase serving, it might rout to /functions/v1/diet/log or just /diet
        // We will assume standard handling.

        if (req.method === 'GET') {
            const date = url.searchParams.get('date');
            if (!date) throw new Error("Date parameter is required");

            const { data, error } = await supabaseClient
                .from('diet_logs')
                .select('*')
                .eq('user_id', userId)
                .eq('date', date)
                .maybeSingle();

            if (error) throw error;
            if (!data) {
                return new Response(JSON.stringify(null), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
            }

            return new Response(JSON.stringify(data), {
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        if (req.method === 'POST') {
            const body = await req.json();
            const { date, daily_calories, water_intake, meals } = body;

            if (!date) throw new Error("Date is required in body");

            const { data, error } = await supabaseClient
                .from('diet_logs')
                .upsert({
                    user_id: userId,
                    date,
                    daily_calories,
                    water_intake,
                    meals
                }, { onConflict: 'user_id, date' })
                .select()
                .single();

            if (error) throw error;

            return new Response(JSON.stringify(data), {
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        throw new Error("Method not supported");

    } catch (error) {
        console.error("Error:", error.message);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
