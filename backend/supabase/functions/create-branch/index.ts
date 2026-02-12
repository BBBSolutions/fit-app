import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { verify } from "https://deno.land/x/djwt@v2.8/mod.ts";

const CUSTOM_JWT_SECRET = Deno.env.get("CUSTOM_JWT_SECRET") ?? "";

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
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        const body = await req.json();

        const {
            gymName, branchName, city, state, country, address, street, pincode
        } = body;

        // 1. Verify Custom JWT
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) throw new Error('Missing Authorization header');

        const token = authHeader.replace('Bearer ', '');

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
        const userId = payload.sub;

        if (!userId) throw new Error('Invalid Token: Missing user ID');

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
            // We need name and email.
            if (!fullName || !email) {
                // Should we error? Or try to use metadata?
                // Frontend is now sending it. 
                // Fallback: use placeholders if critical to proceed? No, better error.
                if (!fullName) throw new Error("Missing Owner Name for registration");
                // Email is unique in owners table, so we must provide it.
            }

            const { error: ownerError } = await supabaseAdmin
                .from('owners')
                .insert({
                    id: userId,
                    name: fullName,
                    email: email || `owner_${userId}@example.com`, // Fallback only if absolutely needed
                    phone: phone,
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
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            }
        );
    }
});
