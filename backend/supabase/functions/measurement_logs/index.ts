import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
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

        // GET Request (Fetch History)
        if (req.method === 'GET') {
            const url = new URL(req.url);
            let type = url.searchParams.get('type') || url.searchParams.get('type_filter');
            let dateGte = url.searchParams.get('date.gte') || url.searchParams.get('start_date');
            let dateLte = url.searchParams.get('date.lte') || url.searchParams.get('end_date');
            
            // Allow fetching for another user if user_id is passed (e.g. Trainer viewing Client)
            const targetUserId = url.searchParams.get('user_id') || userId;
            console.log(`[measurement_logs GET] authUserId: ${userId}, targetUserId: ${targetUserId}, type: ${type}, dateGte: ${dateGte}, dateLte: ${dateLte}`);

            if (type?.startsWith('eq.')) type = type.replace('eq.', '');
            if (dateGte?.startsWith('gte.')) dateGte = dateGte.replace('gte.', '');
            if (dateLte?.startsWith('lte.')) dateLte = dateLte.replace('lte.', '');

            // Ensure 'type' is one of the valid columns to prevent SQL injection or bad requests
            const validColumns = ['weight', 'waist', 'hips', 'chest', 'arms', 'thighs', 'neck', 'shoulders', 'calves', 'body_fat_percentage', 'muscle_mass_percentage', 'water_percentage', 'bone_mass', 'visceral_fat', 'bmr', 'metabolic_age'];
            if (!validColumns.includes(type)) {
                // If the frontend sends something we don't know, just return empty to not crash
                return new Response(JSON.stringify([]), {
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                });
            }

            // Map frontend 'hips' to database column 'hip'
            const dbColumn = type === 'hips' ? 'hip' : type;

            let query = supabaseClient
                .from('measurement_logs')
                .select(`id, date, ${dbColumn}`)
                .eq('user_id', targetUserId)
                .not(dbColumn, 'is', null)
                .order('date', { ascending: true });

            if (dateGte) query = query.gte('date', dateGte);
            if (dateLte) query = query.lte('date', dateLte);

            const { data, error } = await query;
            console.log(`[measurement_logs GET] Query result: ${data?.length} rows, error: ${error?.message || 'none'}`);
            if (error) throw error;

            // Map the specific column back to a generic 'value' property for the frontend
            const mappedData = data.map(item => ({
                id: item.id,
                date: item.date,
                type: type,
                value: item[dbColumn]
            }));

            return new Response(JSON.stringify(mappedData), {
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        // POST Request (Log Measurement)
        if (req.method === 'POST') {
            const body = await req.json();
            const { date, type, value } = body;

            if (!date || !type || value === undefined) throw new Error("Missing required fields: date, type, value");

            const validColumns = ['weight', 'waist', 'hips', 'chest', 'arms', 'thighs', 'neck', 'shoulders', 'calves', 'body_fat_percentage', 'muscle_mass_percentage', 'water_percentage', 'bone_mass', 'visceral_fat', 'bmr', 'metabolic_age'];
            if (!validColumns.includes(type)) {
                throw new Error("Invalid measurement type: " + type);
            }

            // Map frontend 'hips' to database column 'hip'
            const dbColumn = type === 'hips' ? 'hip' : type;

            // First, try to fetch an existing log for this date
            const { data: existingLog, error: fetchError } = await supabaseClient
                .from('measurement_logs')
                .select('*')
                .eq('user_id', userId)
                .eq('date', date)
                .limit(1)
                .maybeSingle();

            if (fetchError) throw fetchError;

            let query;
            if (existingLog) {
                // Update the existing row for this date
                query = supabaseClient
                    .from('measurement_logs')
                    .update({ [dbColumn]: value })
                    .eq('id', existingLog.id)
                    .select()
                    .single();
            } else {
                // Insert a new row for this date
                query = supabaseClient
                    .from('measurement_logs')
                    .insert({
                        user_id: userId,
                        date,
                        [dbColumn]: value
                    })
                    .select()
                    .single();
            }

            const { data, error } = await query;
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
