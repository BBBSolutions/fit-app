import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.0.0";
import { corsHeaders } from "../_shared/cors.ts";

console.log("Sync Exercises (Full Clone) Function Up!");

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        // 1. Fetch Exercises from GitHub (Full JSON)
        console.log("Fetching Exercises from GitHub...");
        const exercisesRes = await fetch("https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json");
        const exercisesData = await exercisesRes.json();

        // NO SLICE - fetching all exercises
        const allExercises = exercisesData;

        const IMAGE_BASE = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/";

        const mappedExercises = [];

        // Body Part Mapping (ExerciseDB Style)
        const BODY_PART_MAP: Record<string, string> = {
            "abdominals": "Waist",
            "abductors": "Legs",
            "adductors": "Legs",
            "biceps": "Arms",
            "calves": "Lower Legs",
            "chest": "Chest",
            "forearms": "Arms",
            "glutes": "Legs",
            "hamstrings": "Legs",
            "lats": "Back",
            "lower back": "Back",
            "middle back": "Back",
            "neck": "Neck",
            "quadriceps": "Legs",
            "shoulders": "Shoulders",
            "traps": "Back",
            "triceps": "Arms"
        };

        for (const ex of allExercises) {
            // Map Category: Use mapped body part or fallback to muscle name
            let categoryName = "Other";
            if (ex.primaryMuscles && ex.primaryMuscles.length > 0) {
                const muscle = ex.primaryMuscles[0].toLowerCase();
                categoryName = BODY_PART_MAP[muscle] || (muscle.charAt(0).toUpperCase() + muscle.slice(1));
            } else if (ex.category) {
                categoryName = ex.category.charAt(0).toUpperCase() + ex.category.slice(1);
            }

            // Map Image: Use first image
            let imageUrl = null;
            if (ex.images && ex.images.length > 0) {
                imageUrl = IMAGE_BASE + ex.images[0];
            }

            // Combine muscles
            const muscles = [...(ex.primaryMuscles || []), ...(ex.secondaryMuscles || [])];

            mappedExercises.push({
                name: ex.name,
                category: categoryName,
                image_url: imageUrl,
                video_url: null,
                instructions: ex.instructions,
                muscles_targeted: muscles
            });
        }

        console.log(`Preparing to upsert ${mappedExercises.length} exercises...`);

        // Batch upsert to avoid limits
        const BATCH_SIZE = 100;
        let totalUpserted = 0;

        for (let i = 0; i < mappedExercises.length; i += BATCH_SIZE) {
            const batch = mappedExercises.slice(i, i + BATCH_SIZE);
            const { error } = await supabaseClient
                .from('exercises')
                .upsert(batch, { onConflict: 'name', ignoreDuplicates: false });

            if (error) {
                console.error(`Error syncing batch ${i}:`, error);
                throw error;
            }
            totalUpserted += batch.length;
        }

        return new Response(JSON.stringify({
            message: `Successfully synced ${totalUpserted} of ${mappedExercises.length} exercises (Full Clone)`,
            data: mappedExercises.slice(0, 5) // Return sample
        }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
