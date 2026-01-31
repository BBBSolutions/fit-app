import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        const { email, password, name, phone, businessName } = await req.json();

        // 1. Create Auth User
        let { data: authUser, error: authError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { name, phone, role: 'owner' }
        });

        let existingUser = null;

        if (authError) {
            // If user already exists, update their password so we can login
            if (authError.message?.includes("already registered") || authError.message?.includes("unique")) {
                console.log("User exists. Updating password...");

                // Find user by email to get ID
                // Note: listUsers isn't efficient for large userbases but fine for this scope
                const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

                if (listError) throw listError;

                const match = users.find(u => u.email === email);

                if (match) {
                    const { error: updateError } = await supabase.auth.admin.updateUserById(
                        match.id,
                        { password: password }
                    );
                    if (updateError) throw updateError;

                    // Proceed to checking/creating owner record
                    authUser = { user: match };
                    existingUser = match;
                } else {
                    throw authError; // Should have found them if they exist
                }
            } else {
                throw authError;
            }
        }

        // 2. Create Owner Record (if not exists)
        // We use upsert if possible, or ignore duplicate key error
        const { error: ownerError } = await supabase
            .from('owners')
            .upsert({
                id: authUser.user.id,
                name,
                email,
                phone,
                business_name: businessName
            }, { onConflict: 'id' }); // Upsert by ID to ensure data is fresh

        if (ownerError) {
            // Only convert to throw if it's a real error, upsert handles duplicates
            throw ownerError;
        }

        return new Response(
            JSON.stringify({ user: authUser.user, message: 'Owner account created successfully' }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        );

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            }
        );
    }
});
