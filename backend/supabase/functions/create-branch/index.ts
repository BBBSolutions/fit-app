import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { verify } from "https://deno.land/x/djwt@v2.8/mod.ts";
const CUSTOM_JWT_SECRET = Deno.env.get("CUSTOM_JWT_SECRET") ?? "SUPER_SECRET_FALLBACK";
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function generateGymCode(city, gymName) {
    // Format: FIT-CITY-RANDOM (e.g., FIT-DEL-XV92)
    const cityCode = (city || 'GEN').substring(0, 3).toUpperCase();
    const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `FIT-${cityCode}-${randomPart}`;
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // Use Service Role for admin actions
        const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
        console.log("Service Key length:", serviceKey.length);
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            serviceKey
        );

        const body = await req.json();

        const {
            gymName, branchName, city, state, country, address, street, pincode
        } = body;

        // 1. Verify Custom JWT
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) throw new Error('Missing Authorization header');

        const token = authHeader.replace('Bearer ', '');

        let userId = null;
        let authError = null;

        // Try Supabase Auth First
        const userClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: `Bearer ${token}` } } }
        );
        const { data: { user }, error: sbError } = await userClient.auth.getUser();

        if (user && !sbError) {
            userId = user.id;
        } else {
            // Fallback to Custom JWT
            try {
                if (!CUSTOM_JWT_SECRET) {
                    throw new Error('Server Config Error: Missing JWT Secret');
                }
                const key = await crypto.subtle.importKey(
                    "raw",
                    new TextEncoder().encode(CUSTOM_JWT_SECRET),
                    { name: "HMAC", hash: "SHA-256" },
                    false,
                    ["verify"]
                );
                const payload = await verify(token, key);
                if (payload && payload.sub) {
                    userId = payload.sub as string;
                }
            } catch (err) {
                authError = err;
            }
        }

        if (!userId) throw new Error(`Invalid Token: ${authError?.message || sbError?.message || 'Missing user ID'}`);

        // 2. Ensure Owner Exists in 'public.owners'
        // We received fullName, email, phone from the body now.
        const { fullName, email, phone } = body;

        const { data: existingOwner } = await supabaseAdmin
            .from('owners')
            .select('id')
            .eq('id', userId)
            .single();

        if (!existingOwner) {
            console.log("Owner record missing, creating...");

            let finalName = fullName;
            let finalEmail = email;
            let finalPhone = phone;

            // Fallback: Fetch from Auth / Profiles if missing
            if (!finalName || !finalEmail) {
                console.log("Owner details missing in body, fetching from Auth/Profiles...");

                // 1. Fetch from Auth
                const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
                if (!userError && userData && userData.user) {
                    finalEmail = finalEmail || userData.user.email;
                    finalPhone = finalPhone || userData.user.phone;
                    // Try metadata for name
                    finalName = finalName || userData.user.user_metadata?.full_name || userData.user.user_metadata?.name;
                }

                // 2. Fetch from Profiles (if name still missing)
                if (!finalName) {
                    const { data: profile } = await supabaseAdmin
                        .from('profiles')
                        .select('name')
                        .eq('user_id', userId)
                        .single();

                    if (profile) {
                        finalName = profile.name;
                    }
                }
            }

            if (!finalName) throw new Error("Missing Owner Name. Please update your profile or provide name.");
            if (!finalEmail) throw new Error("Missing Owner Email.");

            const { error: ownerError } = await supabaseAdmin
                .from('owners')
                .insert({
                    id: userId,
                    name: finalName,
                    email: finalEmail,
                    phone: finalPhone,
                    business_name: gymName
                });

            if (ownerError) {
                console.error("Failed to create owner record:", ownerError);
                throw new Error(`Failed to initialize owner profile: ${ownerError.message}`);
            }
        }

        // Generate Unique Gym Code (simple retry logic)
        let gymCode = '';
        let isUnique = false;
        let attempts = 0;

        while (!isUnique && attempts < 5) {
            gymCode = generateGymCode(city, gymName);
            const { data } = await supabaseAdmin.from('branches').select('id').eq('gym_code', gymCode).single();
            if (!data) isUnique = true;
            attempts++;
        }

        if (!isUnique) throw new Error('Failed to generate unique gym code. Please try again.');

        // Create Branch
        const { data: branch, error: branchError } = await supabaseAdmin
            .from('branches')
            .insert({
                owner_id: userId,
                name: branchName || gymName, // Default to Gym Name if no branch name
                city,
                state,
                country,
                address: street, // Use street as address line
                zip_code: pincode,
                gym_code: gymCode,
                // Add default timezone if provided or default to valid one
                timezone: 'UTC'
            })
            .select()
            .single();

        if (branchError) throw branchError;

        // Assign Owner as Branch Admin
        const { error: memberError } = await supabaseAdmin
            .from('branch_users')
            .insert({
                branch_id: branch.id,
                user_id: userId,
                role: 'owner', // The owner is also an 'owner' within the branch context
                status: 'active'
            });

        if (memberError) {
            // Basic cleanup if assignment fails
            await supabaseAdmin.from('branches').delete().eq('id', branch.id);
            throw memberError;
        }

        return new Response(
            JSON.stringify({ branch, message: 'Branch created successfully' }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        );

    } catch (error) {
        console.error("Create Branch Error:", error);

        let skLength = -1;
        try { skLength = (Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '').length; } catch (e) { }

        return new Response(
            JSON.stringify({ error: error.message, __debug_sk_length: skLength }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            }
        );
    }
});
