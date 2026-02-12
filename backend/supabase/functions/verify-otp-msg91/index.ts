import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { create, getNumericDate } from "https://deno.land/x/djwt@v2.8/mod.ts";

const MSG91_AUTH_KEY = Deno.env.get("MSG91_AUTH_KEY") ?? "";
const CUSTOM_JWT_SECRET = Deno.env.get("CUSTOM_JWT_SECRET") ?? "SUPER_SECRET_FALLBACK"; // Must be set in secrets

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { phone, authToken, widgetId, expires } = await req.json();

        if (!phone || !authToken) {
            throw new Error("Missing phone or auth token");
        }

        // 1. Verify OTP with MSG91
        // https://docs.msg91.com/p/tf9G5/e/3/OTP/verify-otp
        // Adjust URL based on whether using Widget (authToken) or Standard OTP
        // For Widget, the 'authToken' typically comes from the widget success payload.
        // We verify it using MSG91 API.

        console.log(`Verifying MSG91 Token for ${phone}...`);

        // Use MSG91 Verify Endpoint
        // 1. Verify OTP via Stateless Hash
        // We expect 'widgetId' to contain the HASH from the client (repurposing the field or adding new param)
        // Let's assume the client passes the hash in 'widgetId' variable OR we assume 'authToken' is OTP.
        // Client sends: { phone, authToken: enteredOtp, widgetId: hash }

        const otp = authToken;
        const hash = widgetId;

        if (!hash || !expires) {
            throw new Error("Missing verification data (hash or expiry)");
        }

        // Check Expiry (5 minutes = 300000 ms)
        const expiryTime = Number(expires);
        if (Date.now() > expiryTime) {
            throw new Error("OTP Expired (Valid for 5 mins)");
        }

        const HASH_SECRET = Deno.env.get("CUSTOM_JWT_SECRET") || "SUPER_SECRET_FALLBACK";

        // Re-calculate Hash: HMAC-SHA256(phone + "." + otp + "." + expires)
        const encoder = new TextEncoder();
        const keyData = encoder.encode(HASH_SECRET);
        const dataToHash = encoder.encode(`${phone}.${otp}.${expires}`);

        const cryptoKey = await crypto.subtle.importKey(
            "raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
        );
        const signature = await crypto.subtle.sign("HMAC", cryptoKey, dataToHash);

        const hashArray = Array.from(new Uint8Array(signature));
        const computedHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        if (computedHash !== hash) {
            console.error(`Hash Mismatch! Expected: ${computedHash}, Got: ${hash}`);
            throw new Error("Invalid OTP");
        }

        console.log("OTP Verified Successfully via Hash");

        /* SKIPPING MSG91 CALL
        const msg91Res = await fetch(`https://api.msg91.com/api/v5/otp/verify?mobile=${phone}&otp=${authToken}&authkey=${MSG91_AUTH_KEY}`, {
            method: 'GET' // or POST
        });
        ...
        */



        // 2. Verified! Handle User in Supabase Auth
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        // Check if user exists in AUTH
        // We use admin.listUsers because getting by phone directly isn't always exposed simply in admin API without wrapper
        // But createUser handles "User already exists" typically? Or we can search.
        // Actually, listUsers with phone filter is best.

        // Note: formatted phone '91...' should probably be '+91...' for Supabase Auth consistency if desired, 
        // but if we treat '919...' as the phone string, that's fine too as long as consistent.
        // Supabase Auth usually prefers E.164 (+).
        // My 'phone' input is '9198...' (no plus).
        // I will search for it as is.

        let userId = null;
        let userRole = 'owner';

        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
        // listUsers pagination defaults to 50. If many users, this is risky. 
        // Better: Try to create, catch error if exists, OR use getUserById if we had ID.
        // Since we verify phone, let's just create.

        // Actually, getUser(token) is how we usually do it. But here we have phone.
        // Let's try creating:

        // We need E.164 for Supabase Auth usually (starts with +).
        // verify-otp sends '91...' or raw input.
        // Ensure strictly one '+' at start AND no spaces/dashes.
        const rawPhone = phone.replace(/^\+/, ''); // remove leading +
        const digitsOnly = rawPhone.replace(/\D/g, ''); // remove all non-digits (spaces, dashes, parens)

        // Default to India (+91) if 10 digits
        const e164Phone = digitsOnly.length === 10
            ? '+91' + digitsOnly
            : '+' + digitsOnly;

        console.log(`Checking Auth/DB for: ${e164Phone} (Raw: ${phone})`);

        // ... rest of logic ...
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
            phone: e164Phone,
            email_confirm: true,
            phone_confirm: true,
            user_metadata: { role: 'owner' }
        });

        if (createError) {
            // If already exists, we find the user
            console.log("CreateUser Failed:", createError.message);
            console.log("CreateUser Failed:", createError.message);

            // Allow "already registered" OR generic "msg" (sometimes error format varies)
            // We proceed to lookup if error indicates existence.
            if (createError.message && (
                createError.message.includes('already registered') ||
                createError.message.includes('exists') ||
                createError.message.includes('unique constraint')
            )) {
                console.log("User likely exists. Searching for ID...");

                // 1. Try finding in 'profiles' (Most reliable for App Users)
                // Note: Phone format in profiles must match what we search (e.g. +91...)
                // We search with both strict e164Phone and potentially raw phone? 
                // Let's try e164Phone first.
                const { data: profileUser } = await supabase
                    .from('profiles')
                    .select('user_id')
                    .eq('phone_number', e164Phone)
                    .maybeSingle();

                if (profileUser) {
                    userId = profileUser.user_id;
                    console.log("Found User ID via Profiles:", userId);
                }

                // 2. If not in profiles, try 'owners' (for Gym Owners)
                if (!userId) {
                    // Try e164Phone first
                    const { data: ownerUser } = await supabase
                        .from('owners')
                        .select('id')
                        .eq('phone', e164Phone)
                        .maybeSingle();

                    if (ownerUser) {
                        userId = ownerUser.id;
                        console.log("Found User ID via Owners (e164):", userId);
                    } else {
                        // Try without '+' (raw phone)
                        const { data: ownerUserRaw } = await supabase
                            .from('owners')
                            .select('id')
                            .eq('phone', phone)
                            .maybeSingle();

                        if (ownerUserRaw) {
                            userId = ownerUserRaw.id;
                            console.log("Found User ID via Owners (raw):", userId);
                        }
                    }
                }

                // 3. Fallback: Search Auth Users (Slow/Limited)
                if (!userId) {
                    console.log("User not in profiles/owners. Fallback: Searching Auth List...");
                    const { data: { users } } = await supabase.auth.admin.listUsers({ perPage: 1000 });

                    // Try to find by e164 (+91...) OR raw digits (91...)
                    // Auth users strictly stores valid E.164 usually, but legacy might differ.
                    const last10 = digitsOnly.slice(-10);
                    const found = users?.find(u =>
                        u.phone === e164Phone ||
                        u.phone === digitsOnly ||
                        u.phone === rawPhone ||
                        (u.phone && u.phone.endsWith(last10)) // Match last 10 digits (Catch +7 vs +91 mismatch)
                    );

                    if (found) {
                        userId = found.id;
                        console.log("Found User ID via Auth List (Fallback). Phone:", found.phone);
                    } else {
                        // Log attempted searches for debugging
                        console.error("User Search Failed. Tried:", { e164Phone, digitsOnly, rawPhone, last10 });
                    }
                }
            } else {
                throw createError;
            }
        } else {
            // New user created successfully
            userId = newUser.user.id;
            console.log("Created New Auth User:", userId);
        }

        if (!userId) {
            console.error("Critical: Could not resolve User ID for phone:", e164Phone);
            throw new Error("User exists but could not be retrieved. Please contact support.");
        }

        // --- SELF HEALING --- 
        // Ensure DB records exist for this Auth User (fixes Orphaned users)
        try {
            // 1. Ensure app_users
            const { error: appUserErr } = await supabase
                .from('app_users')
                .upsert({
                    id: userId,
                    phone: e164Phone
                });
            if (appUserErr) console.error("Self-Heal: Failed to sync app_users", appUserErr);

            // 2. Ensure profiles
            // We only create stub if missing. 
            // If we have a profile, we don't overwrite it (upsert with onConflict usually updates, but we can ignore if we change nothing important)
            // Actually, we just want to ensure a row exists.
            const { error: profileErr } = await supabase
                .from('profiles')
                .upsert({
                    user_id: userId,
                    // If creating new, set stub data. If updating, these fields might be overwritten?
                    // We should use 'onConflict' to DO NOTHING if exists? 
                    // Supabase upsert updates by default.
                    // Let's Check existence first to avoid overwriting Name if we don't have it here.
                    // Wait, we don't have Name here. Creating a profile with NULL name is fine?
                    // profiles table has full_name.
                    // Let's try inserting only if not exists.
                }, { onConflict: 'user_id', ignoreDuplicates: true });
            // ignoreDuplicates: true prevents update. 

            if (profileErr) console.error("Self-Heal: Failed to sync profiles", profileErr);

        } catch (healErr) {
            console.error("Self-Heal Error:", healErr);
            // Don't block login
        }
        // --- END SELF HEALING ---

        // Return this userId as the 'user' object
        // And we don't need to insert into 'users' table if we don't want to, 
        // OR we insert into `public.users` with this ID to keep it in sync.

        // Let's keep `public.users` sync for safety??
        // Actually, if I just return the `userId`, the custom JWT uses it.
        // Then `create-branch` uses it.
        // Then `create-branch` inserts into `owners`.

        let user = { id: userId, role: 'owner' };

        // Attempt to sync to public.users or public.owners?
        // Let's leave public.users alone if it's confusing. 
        // But the previous code used it.
        // Let's try to update/insert public.users if it exists, using REAl ID.
        // If public.users has serial ID, this fails. If uuid, it works.
        // Let's skip public.users and focus on Auth ID.


        // 3. Issue Custom JWT
        // Documentation: https://supabase.com/docs/guides/auth/jwts
        // We sign it with the project's JWT Secret so Supabase respects it.

        if (!CUSTOM_JWT_SECRET) {
            throw new Error("Server Misconfiguration: Missing JWT Secret");
        }

        // Convert hex secret to bytes if needed, but usually it's a string in env for Edge Functions?
        // Actually Supabase JWT secret is provided as a string. DJWT expects a generic Key.
        // We need to import 'crypto' to generate key from string.

        const key = await crypto.subtle.importKey(
            "raw",
            new TextEncoder().encode(CUSTOM_JWT_SECRET),
            { name: "HMAC", hash: "SHA-256" },
            false,
            ["sign"]
        );

        const payload = {
            iss: "supabase",
            sub: user.id, // Important: This becomes auth.uid()
            aud: "authenticated",
            exp: getNumericDate(60 * 60 * 24 * 7), // 7 days
            role: "authenticated", // Standard Supabase role
            formatted_phone: phone, // Custom claim
            app_metadata: { provider: "msg91" },
            user_metadata: { role: user.role }
        };

        const token = await create({ alg: "HS256", typ: "JWT" }, payload, key);

        return new Response(
            JSON.stringify({ token, user, message: "Login successful" }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        );

    } catch (error) {
        console.error("Verify OTP Error:", error);
        return new Response(
            JSON.stringify({ error: error.message, details: "Check Function Logs" }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            }
        );
    }
});
