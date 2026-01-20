import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.0.0";
import { corsHeaders } from "../_shared/cors.ts";

console.log("Auth Verify Function Up!");

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { token } = await req.json();
    if (!token) throw new Error("Missing ID Token");

    // 1. Verify Firebase Token
    // Ideally use firebase-admin, but running in Deno Edge is tricky with Node modules.
    // We will verify via a simple fetch to Google's public keys or assume client sends valid token 
    // AND verify strictly against Google's tokeninfo endpoint for MVP security.
    // Production should use a proper JWT library with cached Google certs.

    // Using Google's tokeninfo endpoint (Not recommended for high throughput but works for MVP/Analysis)
    const googleRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${Deno.env.get('FIREBASE_API_KEY')}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken: token })
    });

    const googleData = await googleRes.json();
    if (googleData.error) throw new Error(googleData.error.message);
    if (!googleData.users || googleData.users.length === 0) throw new Error("Invalid Token");

    const firebaseUser = googleData.users[0];
    const { localId: uid, email } = firebaseUser;

    // 2. Sync to Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // check if user exists
    const { data: existingUser } = await supabaseClient
      .from('app_users')
      .select('id')
      .eq('firebase_uid', uid)
      .single();

    let internalId;

    if (existingUser) {
      internalId = existingUser.id;
      // Update last seen
      await supabaseClient.from('app_users').update({ last_seen: new Date() }).eq('id', internalId);
    } else {
      // Create new user (Internal Map)
      const { data: newUser, error: createError } = await supabaseClient
        .from('app_users')
        .insert({
          firebase_uid: uid,
          email: email
        })
        .select('id')
        .single();

      if (createError) throw createError;
      internalId = newUser.id;

      // CHECK FOR INVITATIONS
      // We check by Phone (if available) or Email
      let matchedInvite = null;

      // Construct query: gym_code is not known yet, searching global invitations?
      // Yes, invitations are unique by phone/email ideally.

      // Note: firebaseUser.phoneNumber often comes as +1234567890
      const phone = firebaseUser.phoneNumber;

      let inviteQuery = supabaseClient.from('invitations').select('*').eq('status', 'pending');

      if (phone && email) {
        inviteQuery = inviteQuery.or(`phone.eq.${phone},email.eq.${email}`);
      } else if (phone) {
        inviteQuery = inviteQuery.eq('phone', phone);
      } else if (email) {
        inviteQuery = inviteQuery.eq('email', email);
      }

      const { data: invites } = await inviteQuery;
      // Take the most recent one if multiple (rare)
      matchedInvite = invites && invites.length > 0 ? invites[0] : null;

      const profileData = {
        user_id: internalId,
        email: email,
        full_name: matchedInvite ? matchedInvite.name : null,
        gym_code: matchedInvite ? matchedInvite.gym_code : null,
        role: matchedInvite ? matchedInvite.role : 'member' // Default to member if no invite
      };

      // Create profile
      await supabaseClient.from('profiles').insert(profileData);

      // If invite matched, mark as accepted
      if (matchedInvite) {
        await supabaseClient
          .from('invitations')
          .update({ status: 'accepted', updated_at: new Date() })
          .eq('id', matchedInvite.id);
      }
    }

    return new Response(
      JSON.stringify({
        user_id: internalId,
        firebase_uid: uid,
        status: "authenticated"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
