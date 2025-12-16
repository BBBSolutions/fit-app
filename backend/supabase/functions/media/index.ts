import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.0.0";
import { corsHeaders } from "../_shared/cors.ts";

console.log("Media Function Up!");

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) throw new Error('Missing Authorization header');
        const token = authHeader.replace('Bearer ', '');

        // Authorization
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
        if (url.pathname.endsWith('/presign') && req.method === 'POST') {
            const { fileName, fileType, bucket } = await req.json();

            // Validate Bucket (Security)
            const allowedBuckets = ['user-media-private', 'user-media-public'];
            if (!allowedBuckets.includes(bucket)) throw new Error("Invalid Bucket");

            // Construct unique path: user_id/timestamp_filename
            const filePath = `${userId}/${Date.now()}_${fileName}`;

            const { data, error } = await supabaseClient
                .storage
                .from(bucket)
                .createSignedUrl(filePath, 300); // 5 mins

            if (error) throw error;

            // Optionally, we could pre-insert a record into 'media' table here with status 'pending'
            // But requirements said "Edge function stores final metadata" on complete.
            // We will just return the upload URL.

            return new Response(JSON.stringify({
                uploadUrl: data.signedUrl,
                path: filePath,
                token: data.token
            }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        if (url.pathname.endsWith('/complete') && req.method === 'POST') {
            const { path, bucket, type, size, metadata } = await req.json();

            const { data: media, error } = await supabaseClient
                .from('media')
                .insert({
                    user_id: userId,
                    bucket_id: bucket,
                    file_path: path,
                    type: type,
                    size_bytes: size,
                    metadata: metadata
                })
                .select()
                .single();

            if (error) throw error;
            return new Response(JSON.stringify(media), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        throw new Error("Route not found");

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
