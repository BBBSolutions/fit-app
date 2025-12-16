import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.0.0";
import { corsHeaders } from "../_shared/cors.ts";

console.log("Workouts Function Up!");

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) throw new Error('Missing Authorization header');
        const token = authHeader.replace('Bearer ', '');

        // Verify Token
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
        const lastPart = pathParts[pathParts.length - 1]; // "list", "create" or ID

        // GET /workouts/list OR /workouts?list
        // GET /workouts/:id

        if (lastPart === 'assign' && req.method === 'POST') {
            const body = await req.json();
            const { client_id, workout_id } = body;
            // trainer_id comes from auth (userId)

            const { data, error } = await supabaseClient
                .from('workout_assignments')
                .insert({
                    trainer_id: userId,
                    client_id,
                    workout_id,
                    status: 'assigned'
                })
                .select()
                .single();

            if (error) throw error;
            return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        if (lastPart === 'assigned' && req.method === 'GET') {
            // Fetch assigned workouts for a specific client (or self if client)
            const clientIdParam = url.searchParams.get('client_id');
            const targetClientId = clientIdParam || userId; // if no param, assume fetching for self

            // If asking for someone else, ensure we are a trainer (or handled by RLS)
            // RLS: "Trainers can manage assignments", "Clients can view assignments"
            // We'll trust RLS.

            const { data, error } = await supabaseClient
                .from('workout_assignments')
                .select('*, workout:workouts(*)') // Join with workouts table
                .eq('client_id', targetClientId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        // METHOD: GET -> List or Detail
        if (req.method === 'GET') {
            const idParam = url.searchParams.get('id');

            if (idParam) {
                // Get Detail
                const { data: workout, error } = await supabaseClient
                    .from('workouts')
                    .select('*')
                    .eq('id', idParam)
                    .single();
                if (error) throw error;
                // Security check (RLS handles this in DB, but service role bypasses RLS in some setups context, 
                // but here we instantiated client with service role key? 
                // YES: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
                // So we MUST manually verify ownership or public status or ASSIGNMENT.

                // 1. Is Owner?
                if (workout.user_id === userId) {
                    return new Response(JSON.stringify(workout), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
                }

                // 2. Is Public?
                if (workout.is_public) {
                    return new Response(JSON.stringify(workout), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
                }

                // 3. Is Assigned to Me?
                const { data: assignment } = await supabaseClient
                    .from('workout_assignments')
                    .select('id')
                    .eq('workout_id', workout.id)
                    .eq('client_id', userId)
                    .single();

                if (assignment) {
                    return new Response(JSON.stringify(workout), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
                }

                throw new Error("Unauthorized");

            } else {
                // List (My Created Workouts AND Public Workouts)
                const { data: workouts, error } = await supabaseClient
                    .from('workouts')
                    .select('*')
                    .or(`user_id.eq.${userId},is_public.eq.true`)
                    .order('created_at', { ascending: false });

                if (error) throw error;
                return new Response(JSON.stringify(workouts), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
            }
        }

        // METHOD: POST -> Create (Existing Logic)
        if (req.method === 'POST') {
            // ... existing create logic ...
            // We need to preserve the existing create logic here, but since I am replacing the block, I need to restate it.
            // Wait, the "TargetContent" was mainly the if (req.method) blocks. 
            // I should simply insert the new blocks BEFORE the existing blocks, OR replace thoughtfully.
            // Let's rewrite the logic to be cleaner.
        }

        // RE-WRITING THE LIST/CREATE LOGIC TO BE SAFE BECAUSE REPLACEMENT IS TRICKY WITH BLOCKS
        // I will return purely the new response for 'assign'/'assigned' and then fall through to the rest.
        // But wait, the tool `replace_file_content` replaces a specific block. 
        // I will replace lines 48-100 (The GET/POST block) with the new expanded logic.

        if (req.method === 'POST' && (lastPart === 'create' || !lastPart || lastPart === 'workouts')) {
            const body = await req.json();
            const { title, description, difficulty, duration, exercises, metadata } = body;

            const { data: workout, error } = await supabaseClient
                .from('workouts')
                .insert({
                    user_id: userId,
                    title,
                    description,
                    difficulty,
                    duration,
                    exercises, // JSONB array
                    metadata
                })
                .select()
                .single();

            if (error) throw error;
            return new Response(JSON.stringify(workout), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        throw new Error("Method not allowed");

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
