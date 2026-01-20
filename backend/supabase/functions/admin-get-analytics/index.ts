import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.0.0";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { token } = await req.json();

        if (!token) throw new Error('Missing token');

        // 1. Verify Auth & Get Gym Code
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
        const firebaseKey = Deno.env.get('FIREBASE_API_KEY') ?? '';
        const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

        const authResponse = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken: token })
        });
        const googleData = await authResponse.json();
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

        const { data: adminProfile, error: profileError } = await supabaseClient
            .from('profiles')
            .select('gym_code')
            .eq('user_id', internalUserId)
            .single();

        if (profileError || !adminProfile?.gym_code) throw new Error("Admin profile or Gym Code not found");
        const gymCode = adminProfile.gym_code;

        // 2. Aggregate Data
        // Users Count
        const { count: memberCount } = await supabaseClient
            .from('profiles')
            .select('id', { count: 'exact', head: true })
            .eq('gym_code', gymCode)
            .eq('role', 'member');

        const { count: trainerCount } = await supabaseClient
            .from('profiles')
            .select('id', { count: 'exact', head: true })
            .eq('gym_code', gymCode)
            .eq('role', 'trainer');

        // Leads
        const { count: newLeadsCount } = await supabaseClient
            .from('leads')
            .select('id', { count: 'exact', head: true })
            .eq('gym_code', gymCode)
            .eq('status', 'New');

        // Revenue (Sum of 'payments') - Joined with profiles to filter by gym
        const { data: gymUsers } = await supabaseClient.from('profiles').select('user_id').eq('gym_code', gymCode);
        const userIds = gymUsers?.map(u => u.user_id) || [];

        let totalRevenue = 0;
        if (userIds.length > 0) {
            const { data: payments } = await supabaseClient
                .from('payments')
                .select('amount')
                .in('user_id', userIds)
                .eq('status', 'succeeded');

            // Assuming amount is in cents/paise
            totalRevenue = payments?.reduce((acc, curr) => acc + (curr.amount || 0), 0) || 0;
        }

        // Calculate trends (mock logic for now as we don't have historical snapshots easily without complex queries)
        // In a real app, you'd query 'created_at' ranges.

        const analyticsData = {
            kpis: [
                { title: 'Active Members', value: memberCount || 0, change: '0%', trend: 'flat' },
                { title: 'Active Trainers', value: trainerCount || 0, change: '0%', trend: 'flat' },
                { title: 'Total Revenue', value: `₹ ${totalRevenue}`, change: '0%', trend: 'flat' }, // Format appropriately
                { title: 'New Leads', value: newLeadsCount || 0, change: '0%', trend: 'flat' },
            ],
            funnel: [], // Populate if we have enough leads data stages
            recentActivity: [] // Could be latest logins or workouts
        };

        return new Response(JSON.stringify(analyticsData), {
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
