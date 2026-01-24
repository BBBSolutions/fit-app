// Shared authentication helper for admin functions
// This extracts and verifies the Supabase JWT token

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.0.0";

export async function authenticateAdmin(req: Request) {
    // Get token from Authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) throw new Error('Missing authorization header');

    const token = authHeader.replace('Bearer ', '');

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Verify Supabase JWT and get user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
        console.error("Auth error:", authError);
        throw new Error("Unauthorized");
    }

    const userId = user.id; // Direct UUID from Supabase Auth

    // Get Admin Profile & Gym Code
    const { data: adminProfile, error: adminError } = await supabaseClient
        .from('profiles')
        .select('gym_code')
        .eq('user_id', userId)
        .single();

    if (adminError || !adminProfile?.gym_code) {
        console.error("Error fetching admin profile or missing gym code:", adminError);
        throw new Error("Admin profile not found or missing Gym Code");
    }

    return {
        userId,
        gymCode: adminProfile.gym_code,
        supabaseClient
    };
}
