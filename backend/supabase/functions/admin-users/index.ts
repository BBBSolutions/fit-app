import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.0.0";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
    // Handle CORS preflight request
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const body = await req.json();
        const { token } = body;
        const { action, payload } = body;

        if (!token) throw new Error('Missing token in request body');

        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
        const firebaseKey = Deno.env.get('FIREBASE_API_KEY') ?? '';

        const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

        // 1. Verify Auth Token (Firebase)
        const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken: token })
        });

        const googleData = await response.json();
        if (!googleData.users) throw new Error("Unauthorized");
        const firebaseUid = googleData.users[0].localId;

        // 2. Resolve Internal User ID
        const { data: userData, error: userError } = await supabaseClient
            .from('app_users')
            .select('id')
            .eq('firebase_uid', firebaseUid)
            .single();

        if (userError || !userData) throw new Error("User map not found");
        const internalUserId = userData.id;

        // 3. Fetcy Admin Profile & Gym Code
        const { data: adminProfile, error: adminError } = await supabaseClient
            .from('profiles')
            .select('gym_code')
            .eq('user_id', internalUserId)
            .single();

        if (adminError || !adminProfile?.gym_code) {
            console.error("Error fetching admin profile or missing gym code:", adminError);
            throw new Error("Admin profile not found or missing Gym Code");
        }

        const gymCode = adminProfile.gym_code;

        // 4. Handle Actions
        let result;
        let error;

        switch (action) {
            case 'fetch':
            case undefined: // Default to fetch if no action
                // 1. Fetch Active Profiles
                const { data: activeUsers, error: profilesError } = await supabaseClient
                    .from('profiles')
                    .select('user_id, full_name, role, phone_number, created_at, gym_code, app_users(email)')
                    .eq('gym_code', gymCode)
                    .neq('role', 'admin')
                    .order('created_at', { ascending: false });

                if (profilesError) throw profilesError;

                // 2. Fetch Pending Invitations
                const { data: pendingUsers, error: invitesError } = await supabaseClient
                    .from('invitations')
                    .select('id, name, role, phone, email, created_at, status')
                    .eq('gym_code', gymCode)
                    .eq('status', 'pending')
                    .order('created_at', { ascending: false });

                if (invitesError) throw invitesError;

                // 3. Merge & Map
                const mappedActive = activeUsers.map(u => ({
                    id: u.user_id,
                    full_name: u.full_name,
                    phone_number: u.phone_number,
                    email: u.app_users?.email,
                    role: u.role,
                    status: 'Active',
                    created_at: u.created_at,
                    gym_code: u.gym_code
                }));

                const mappedPending = pendingUsers.map(u => ({
                    id: u.id,
                    full_name: u.name,
                    phone_number: u.phone,
                    email: u.email,
                    role: u.role,
                    status: 'Pending',
                    created_at: u.created_at,
                    gym_code: gymCode
                }));

                // Combine and sort by newest first
                result = [...mappedPending, ...mappedActive].sort((a, b) =>
                    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                );
                break;

            case 'create':
                // Creating a user "Directly" means creating an Invitation
                if (!payload.name || (!payload.phone && !payload.email)) {
                    throw new Error("Name and either Phone or Email are required");
                }

                // Check if already invited
                const { data: existingInvite } = await supabaseClient
                    .from('invitations')
                    .select('id')
                    .eq('gym_code', gymCode)
                    .or(`phone.eq.${payload.phone},email.eq.${payload.email}`)
                    .maybeSingle();

                if (existingInvite) throw new Error("User already invited");

                // Create Invitation
                ({ data: result, error } = await supabaseClient
                    .from('invitations')
                    .insert({
                        gym_code: gymCode,
                        role: payload.role?.toLowerCase() || 'member',
                        name: payload.name,
                        phone: payload.phone,
                        email: payload.email,
                        status: 'pending'
                    })
                    .select()
                    .single());
                break;

            case 'update':
                if (!payload?.id) throw new Error("Missing user ID");
                // Only allow updating specific fields
                const updateData: any = {};
                if (payload.name) updateData.full_name = payload.name;
                if (payload.phone) updateData.phone_number = payload.phone;
                if (payload.role) updateData.role = payload.role.toLowerCase();

                ({ data: result, error } = await supabaseClient
                    .from('profiles')
                    .update(updateData)
                    .eq('user_id', payload.id) // This is the user_id (UUID)
                    .eq('gym_code', gymCode) // Ensure belongs to this gym
                    .select()
                    .single());
                break;

            case 'delete':
                if (!payload?.id) throw new Error("Missing user ID");
                // Soft delete / Detach from Gym (set gym_code to null)
                ({ data: result, error } = await supabaseClient
                    .from('profiles')
                    .update({ gym_code: null })
                    .eq('user_id', payload.id)
                    .eq('gym_code', gymCode)
                    .select()
                    .single());
                break;

            default:
                throw new Error(`Invalid action: ${action}`);
        }

        if (error) {
            console.error("Action Error:", error);
            throw error;
        }

        return new Response(JSON.stringify(result || { success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error) {
        console.error("Error:", error.message);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }
});
