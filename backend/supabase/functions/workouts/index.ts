import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
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

        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

        const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

        // 1. Verify Supabase JWT
        const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

        if (authError || !user) {
            console.error("Auth error:", authError);
            throw new Error("Unauthorized");
        }

        const userId = user.id;

        const url = new URL(req.url);
        const pathParts = url.pathname.split('/');
        const lastPart = pathParts[pathParts.length - 1]; // "list", "create" or ID

        // HISTORY ENDPOINT (Moved to top priority)
        // Check "history" presence in URL. Most robust way.
        if (req.method === 'GET' && req.url.includes('/history')) {
            console.log("[Workouts Function] ENTERED HISTORY BLOCK");
            const exerciseId = url.searchParams.get('exercise_id');
            const exerciseName = url.searchParams.get('exercise_name'); // Support Name Lookup
            const excludeAssignmentId = url.searchParams.get('exclude_assignment_id');

            console.log(`[History] Fetching. ID: ${exerciseId}, Name: ${exerciseName}, Exclude: ${excludeAssignmentId}`);

            if (!exerciseId && !exerciseName) throw new Error("Missing exercise ID or Name");

            // 1. Find recent log
            let query = supabaseClient
                .from('workout_logs')
                .select('workout_assignment_id, logged_at, exercise_name')
                .eq('user_id', userId) // Security
                .neq('workout_assignment_id', excludeAssignmentId || '00000000-0000-0000-0000-000000000000') // Ensure Valid UUID for NOT EQ
                .order('logged_at', { ascending: false })
                .limit(5); // Fetch a few to debug

            if (exerciseId) {
                query = query.eq('exercise_id', exerciseId);
            } else if (exerciseName) {
                query = query.eq('exercise_name', exerciseName);
            }

            const { data: candidates, error: recentError } = await query;
            console.log(`[History Debug] Query for Name: "${exerciseName}". Found candidates: ${candidates?.length}`);
            if (candidates && candidates.length > 0) console.log("First candidate:", candidates[0]);

            if (recentError) {
                console.error("[History] Error finding recent log:", recentError);
                throw recentError;
            }

            const recentLog = candidates && candidates.length > 0 ? candidates[0] : null;

            if (!recentLog) {
                console.log("[History] No previous logs found matching criteria.");
                return new Response(JSON.stringify([]), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
            }

            console.log(`[History] Found recent assignment: ${recentLog.workout_assignment_id}`);

            // 2. Fetch all logs for that assignment
            let logsQuery = supabaseClient
                .from('workout_logs')
                .select('*')
                .eq('workout_assignment_id', recentLog.workout_assignment_id)
                .order('set_number', { ascending: true });

            if (exerciseId) {
                logsQuery = logsQuery.eq('exercise_id', exerciseId);
            } else if (exerciseName) {
                logsQuery = logsQuery.eq('exercise_name', exerciseName);
            }

            const { data, error } = await logsQuery;

            if (error) throw error;
            return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

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
                .select('*, workout:workouts(title)')
                .single();

            if (error) throw error;

            // --- Push Notification Trigger ---
            try {
                console.log("Notification: Looking up push_token for client_id:", client_id);
                
                // 1. Get Receiver's (Client's) Push Token
                const { data: receiverProfile, error: profileError } = await supabaseClient
                    .from('profiles')
                    .select('push_token, name')
                    .eq('user_id', client_id)
                    .single();

                console.log("Notification: Client profile lookup result:", JSON.stringify(receiverProfile), "Error:", profileError);

                if (receiverProfile?.push_token) {
                    // 2. Get Trainer's Name
                    const { data: senderProfile } = await supabaseClient
                        .from('profiles')
                        .select('name')
                        .eq('user_id', userId)
                        .single();

                    const trainerName = senderProfile?.name || 'Your Trainer';
                    const workoutTitle = data.workout?.title || 'a new workout';

                    const notificationPayload = {
                        to: receiverProfile.push_token,
                        sound: 'default',
                        title: 'New Workout Assigned!',
                        body: `${trainerName} has assigned ${workoutTitle} to you.`,
                        data: { screen: 'Workouts', assignmentId: data.id },
                    };

                    console.log("Notification: Sending to Expo:", JSON.stringify(notificationPayload));

                    // 3. Send to Expo
                    const expoPushResponse = await fetch('https://exp.host/--/api/v2/push/send', {
                        method: 'POST',
                        headers: {
                            'Accept': 'application/json',
                            'Accept-encoding': 'gzip, deflate',
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(notificationPayload),
                    });
                    
                    const expoResult = await expoPushResponse.text();
                    console.log("Notification: Expo API response:", expoPushResponse.status, expoResult);
                } else {
                    console.log("Notification: No push_token found for client. Client needs to be on a physical device and have notifications enabled.");
                }
            } catch (notifyError) {
                console.error("Notification failed for workout assignment:", notifyError);
            }
            // ---------------------------------

            return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        if (lastPart === 'assignment' && req.method === 'DELETE') {
            const assignmentId = url.searchParams.get('id');
            if (!assignmentId) throw new Error("Missing assignment ID");

            // Verify ownership (Client deleting their own assignment OR Trainer deleting one they assigned)
            const { data: assignment } = await supabaseClient
                .from('workout_assignments')
                .select('client_id, trainer_id')
                .eq('id', assignmentId)
                .single();

            if (!assignment) throw new Error("Assignment not found");

            if (assignment.client_id !== userId && assignment.trainer_id !== userId) {
                throw new Error("Unauthorized to delete this assignment");
            }

            const { error } = await supabaseClient
                .from('workout_assignments')
                .delete()
                .eq('id', assignmentId);

            if (error) throw error;
            return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        if (lastPart === 'log-set') {
            if (req.method === 'POST') {
                const body = await req.json();
                // Check if ID is provided for Update (Upsert)
                if (body.id) {
                    const { error } = await supabaseClient
                        .from('workout_logs')
                        .update({
                            weight: body.weight,
                            reps: body.reps,
                            notes: body.notes
                            // Keep assignment/exercise immutable usually, or update if needed
                        })
                        .eq('id', body.id)
                        .eq('user_id', userId); // Security

                    if (error) throw error;
                    return new Response(JSON.stringify({ success: true, id: body.id }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
                } else {
                    // Create New
                    const { data, error } = await supabaseClient
                        .from('workout_logs')
                        .insert({
                            user_id: userId,
                            workout_assignment_id: body.assignmentId,
                            exercise_id: body.exerciseId,
                            exercise_name: body.exerciseName,
                            set_number: body.setNumber,
                            weight: body.weight,
                            reps: body.reps,
                            notes: body.notes
                        })
                        .select('id')
                        .single();

                    if (error) throw error;
                    return new Response(JSON.stringify({ success: true, id: data.id }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
                }
            }

            if (req.method === 'DELETE') {
                const logId = url.searchParams.get('id');
                if (!logId) throw new Error("Missing log ID");

                const { error } = await supabaseClient
                    .from('workout_logs')
                    .delete()
                    .eq('id', logId)
                    .eq('user_id', userId); // Security

                if (error) throw error;
                return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
            }
        }

        if (lastPart === 'logs' && req.method === 'GET') {
            const assignmentId = url.searchParams.get('assignment_id');
            if (!assignmentId) throw new Error("Missing assignment ID");

            const { data, error } = await supabaseClient
                .from('workout_logs')
                .select('*')
                .eq('workout_assignment_id', assignmentId)
                .eq('user_id', userId) // Security check
                .order('set_number', { ascending: true });

            if (error) throw error;
            return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }



        if (lastPart === 'complete' && req.method === 'POST') {
            const { assignmentId } = await req.json();

            // Verify ownership and get Workout metrics
            const { data: assignment } = await supabaseClient
                .from('workout_assignments')
                .select('*, workout:workouts(*)')
                .eq('id', assignmentId)
                .single();

            if (!assignment || assignment.client_id !== userId) {
                throw new Error("Unauthorized");
            }

            // 1. Update Assignment Status
            const { error: updateError } = await supabaseClient
                .from('workout_assignments')
                .update({ status: 'completed' })
                .eq('id', assignmentId);

            if (updateError) throw updateError;

            // 2. Create Session Entry for History/Stats
            const workout = assignment.workout;
            let durationMinutes = 30; // Default
            let caloriesBurned = 0;

            if (workout) {
                // Parse Duration (e.g. "45 min")
                if (workout.duration) {
                    const match = workout.duration.match(/(\d+)/);
                    if (match) durationMinutes = parseInt(match[1]);
                }
                // Parse Calories
                if (workout.calories) {
                    caloriesBurned = parseInt(workout.calories) || 0;
                }
            }

            const { error: sessionError } = await supabaseClient
                .from('sessions')
                .insert({
                    user_id: userId,
                    workout_id: assignment.workout_id,
                    started_at: new Date(Date.now() - durationMinutes * 60000).toISOString(), // Estimate start
                    completed_at: new Date().toISOString(),
                    status: 'completed',
                    metrics: {
                        durationMinutes,
                        caloriesBurned,
                        notes: 'Completed via Plan'
                    }
                });

            if (sessionError) {
                console.error("Failed to create session log:", sessionError);
                // Don't fail the request, just log it. The assignment is completed.
            }

            return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
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

        if (lastPart === 'prs' && req.method === 'GET') {
            // Allow fetching for another user if user_id is passed (e.g. Trainer viewing Client)
            const targetUserId = url.searchParams.get('user_id') || userId;

            const { data, error } = await supabaseClient
                .from('user_personal_records')
                .select('*')
                .eq('user_id', targetUserId)
                .order('max_weight', { ascending: false })
                .limit(10); // Top 10 heavy lifts

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
                    .eq('workout_id', workout.id) // Corrected from workout.id to idParam just to be safe, but workout.id is from DB
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

        // METHOD: PUT -> Update Workout (e.g. Plan Changes)
        if (req.method === 'PUT') {
            const idParam = url.searchParams.get('id');
            const body = await req.json();

            if (!idParam) throw new Error("Missing workout ID");

            // For now, allow update if User is Owner.
            // Future: Allow updating if Assigned (requires duplicating workout or storing overrides).
            // MVP: Just try to update.

            const { data, error } = await supabaseClient
                .from('workouts')
                .update({
                    exercises: body.exercises,
                    // Allow updating other fields if provided
                    ...(body.title && { title: body.title }),
                    ...(body.description && { description: body.description }),
                })
                .eq('id', idParam)
                .eq('user_id', userId) // Enforce ownership for safety!
                .select()
                .single();

            if (error) throw new Error("Update failed or Unauthorized: " + error.message);

            return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        // METHOD: POST -> Create (Existing Logic)


        if (lastPart === 'create-custom' && req.method === 'POST') {
            const body = await req.json();
            const { title, exercises } = body;

            // 1. Create Workout
            const { data: newWorkout, error: workoutError } = await supabaseClient
                .from('workouts')
                .insert({
                    title: title || 'Custom Workout',
                    description: 'Member created custom workout',
                    exercises: exercises,
                    user_id: userId,
                    is_public: false,
                    difficulty: 'Beginner',
                    duration: '30 min'
                })
                .select()
                .single();

            if (workoutError) {
                return new Response(JSON.stringify({ error: "Workout Creation Failed: " + workoutError.message }), {
                    status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
                });
            }

            // 2. Assign to Self
            const { data: assignment, error: assignError } = await supabaseClient
                .from('workout_assignments')
                .insert({
                    trainer_id: userId,
                    client_id: userId,
                    workout_id: newWorkout.id,
                    status: 'assigned'
                })
                .select()
                .single();

            if (assignError) {
                // Cleanup workout if assignment fails? Maybe not, keep it as "created" but not assigned?
                // For now, just report error.
                return new Response(JSON.stringify({ error: "Assignment Failed: " + assignError.message }), {
                    status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
                });
            }

            return new Response(JSON.stringify(assignment), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        if (req.method === 'POST' && (lastPart === 'create' || !lastPart || lastPart === 'workouts')) {
            const body = await req.json();
            const { title, description, difficulty, duration, exercises, metadata } = body;

            const { data: workout, error } = await supabaseClient
                .from('workouts')
                .insert({
                    title: title || 'Custom Workout',
                    description: 'Member created custom workout',
                    exercises: exercises, // JSONB
                    user_id: userId, // CORRECTED from created_by
                    is_public: false,
                    difficulty: 'Beginner', // Default
                    duration: '30 min'      // Default
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
