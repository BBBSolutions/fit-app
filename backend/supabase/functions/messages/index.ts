import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.0.0";
import { corsHeaders } from "../_shared/cors.ts";

console.log("Messages Function Up!");

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) throw new Error('Missing Authorization header');
        const token = authHeader.replace('Bearer ', '');

        // Verify Token via Firebase
        const googleRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${Deno.env.get('FIREBASE_API_KEY')}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken: token })
        });
        const googleData = await googleRes.json();
        if (!googleData.users) throw new Error("Unauthorized");
        const firebaseUid = googleData.users[0].localId;

        // Init Supabase
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        // Get User ID
        const { data: userMap } = await supabaseClient
            .from('app_users')
            .select('id')
            .eq('firebase_uid', firebaseUid)
            .single();
        if (!userMap) throw new Error("User not found");
        const userId = userMap.id;

        const url = new URL(req.url);
        const pathParts = url.pathname.split('/');
        const action = pathParts[pathParts.length - 1]; // "send", "list"

        // POST /messages/send
        if (action === 'send' && req.method === 'POST') {
            const body = await req.json();
            const { receiverId, content } = body;

            if (!receiverId || !content) throw new Error("Missing receiverId or content");

            const { data, error } = await supabaseClient
                .from('messages')
                .insert({
                    sender_id: userId,
                    receiver_id: receiverId,
                    content
                })
                .select()
                .single();

            if (error) throw error;

            // --- Push Notification Trigger ---
            try {
                // 1. Get Receiver's Push Token
                const { data: receiverProfile } = await supabaseClient
                    .from('profiles')
                    .select('push_token, name')
                    .eq('user_id', receiverId)
                    .single();

                if (receiverProfile?.push_token) {
                    // 2. Get Sender Name (Optional, good for notification body)
                    const { data: senderProfile } = await supabaseClient
                        .from('profiles')
                        .select('name')
                        .eq('user_id', userId)
                        .single();

                    const senderName = senderProfile?.name || 'New Message';

                    // 3. Send to Expo
                    await fetch('https://exp.host/--/api/v2/push/send', {
                        method: 'POST',
                        headers: {
                            'Accept': 'application/json',
                            'Accept-encoding': 'gzip, deflate',
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            to: receiverProfile.push_token,
                            sound: 'default',
                            title: senderName,
                            body: content,
                            data: { senderId: userId, screen: 'Messages' }, // Deep link data
                        }),
                    });
                    console.log("Push notification sent to", receiverId);
                }
            } catch (notifyError) {
                console.error("Notification failed:", notifyError);
                // Don't fail the request if notification fails
            }
            // ---------------------------------

            return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        // GET /messages/list?userId=TARGET_USER_ID
        if (action === 'list' && req.method === 'GET') {
            const matchUserId = url.searchParams.get('userId');
            if (!matchUserId) throw new Error("Missing userId param");

            const { data, error } = await supabaseClient
                .from('messages')
                .select('*')
                .or(`and(sender_id.eq.${userId},receiver_id.eq.${matchUserId}),and(sender_id.eq.${matchUserId},receiver_id.eq.${userId})`)
                .order('created_at', { ascending: true });

            if (error) throw error;
            return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        // POST /messages/mark-read
        if (action === 'mark-read' && req.method === 'POST') {
            const body = await req.json();
            const { senderId } = body;
            if (!senderId) throw new Error("Missing senderId");

            const { error } = await supabaseClient
                .from('messages')
                .update({ is_read: true })
                .eq('sender_id', senderId)
                .eq('receiver_id', userId)
                .eq('is_read', false);

            if (error) throw error;

            return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        // GET /messages/unread-count
        if (action === 'unread-count' && req.method === 'GET') {
            console.log(`Checking unread count for Receiver ID: ${userId}`);

            const { count, error } = await supabaseClient
                .from('messages')
                .select('*', { count: 'exact', head: true })
                .eq('receiver_id', userId)
                .eq('is_read', false);

            console.log(`Unread count result: ${count}, Error: ${JSON.stringify(error)}`);

            if (error) throw error;

            return new Response(JSON.stringify({ count: count || 0 }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        throw new Error("Method not allowed");

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
