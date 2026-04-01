import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";

console.log("Admin Broadcast Function Up!");

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) throw new Error('Missing Authorization header');
        const token = authHeader.replace('Bearer ', '');

        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

        const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

        const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

        if (authError || !user) {
            console.error("Auth error:", authError);
            throw new Error("Unauthorized");
        }

        const userId = user.id;

        const body = await req.json();
        const { branchId, role, userIds, title, message } = body;

        if (!title || !message) {
            throw new Error("Title and message are required");
        }

        // 1. Get Admin Profile & Gym Code to restrict scope
        let query = supabaseClient
            .from('branch_users')
            .select('branch_id, role, branches(gym_code)')
            .eq('user_id', userId)
            .in('role', ['owner', 'branch_admin'])
            .limit(1)
            .single();

        const { data: adminBranchUser, error: adminError } = await query;

        if (adminError || !adminBranchUser?.branches?.gym_code) {
            console.error("Error fetching admin data:", adminError);
            throw new Error("Unauthorized: Must be an owner or branch admin.");
        }

        const gymCode = adminBranchUser.branches.gym_code;

        // 2. Determine target branches
        let targetBranchIds = [];
        if (branchId === 'all' || !branchId) {
            if (adminBranchUser.role === 'owner') {
                const { data: branches } = await supabaseClient
                    .from('branches')
                    .select('id')
                    .eq('gym_code', gymCode);
                targetBranchIds = branches?.map(b => b.id) || [];
            } else {
                targetBranchIds = [adminBranchUser.branch_id];
            }
        } else {
            targetBranchIds = [branchId];
        }

        if (targetBranchIds.length === 0) {
            throw new Error("No branches found to broadcast to.");
        }

        // 3. Find Target Users
        let usersQuery = supabaseClient
            .from('branch_users')
            .select('user_id, role')
            .in('branch_id', targetBranchIds);

        if (role && role !== 'all') {
            usersQuery = usersQuery.eq('role', role);
        } else {
            // Include members and trainers by default when 'all' is selected
            usersQuery = usersQuery.in('role', ['member', 'trainer']);
        }

        const { data: targetUsersData, error: targetUsersError } = await usersQuery;

        if (targetUsersError) {
            throw targetUsersError;
        }

        let finalUserIds = targetUsersData.map(u => u.user_id);
        
        // Ensure uniqueness
        finalUserIds = [...new Set(finalUserIds)];

        // Filter by specific userIds if provided
        if (userIds && Array.isArray(userIds) && userIds.length > 0) {
            finalUserIds = finalUserIds.filter(id => userIds.includes(id));
        }

        if (finalUserIds.length === 0) {
            return new Response(JSON.stringify({ success: true, message: "No users matched the criteria." }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        // 4. Send In-App Messages (Optional, but good for persistence)
        // Since it's a broadcast, we'll insert into `messages` table
        const messagesToInsert = finalUserIds.map(targetId => ({
            sender_id: userId,
            receiver_id: targetId,
            content: `**${title}**\n\n${message}`
        }));

        // Insert in batches if many
        const chunkSize = 1000;
        for (let i = 0; i < messagesToInsert.length; i += chunkSize) {
            const chunk = messagesToInsert.slice(i, i + chunkSize);
            await supabaseClient.from('messages').insert(chunk);
        }

        // 5. Send Push Notifications
        const { data: profiles } = await supabaseClient
            .from('profiles')
            .select('user_id, push_token')
            .in('user_id', finalUserIds)
            .not('push_token', 'is', null);

        if (profiles && profiles.length > 0) {
            const pushTokens = profiles.map(p => p.push_token).filter(t => t);
            
            // Expo push supports sending arrays of messages
            const expoMessages = pushTokens.map(token => ({
                to: token,
                sound: 'default',
                title: title,
                body: message,
                data: { screen: 'Messages' }, // Deep link to Messages
            }));

            // ChunkExpo messages
            const expoChunkSize = 100;
            for (let i = 0; i < expoMessages.length; i += expoChunkSize) {
                const chunk = expoMessages.slice(i, i + expoChunkSize);
                try {
                    await fetch('https://exp.host/--/api/v2/push/send', {
                        method: 'POST',
                        headers: {
                            'Accept': 'application/json',
                            'Accept-encoding': 'gzip, deflate',
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(chunk),
                    });
                } catch (e) {
                    console.error("Expo Push Error chunk:", e);
                }
            }
        }

        return new Response(JSON.stringify({ success: true, count: finalUserIds.length }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
