import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.0.0";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const authHeader = req.headers.get('authorization');
        if (!authHeader) throw new Error('Missing authorization header');
        const token = authHeader.replace('Bearer ', '');

        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
        const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

        const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
        if (authError || !user) throw new Error("Unauthorized");
        const userId = user.id;

        // Parse options from body (if present)
        let branchId;
        try {
            const body = await req.json();
            branchId = body.branchId;
        } catch {
            // Ignore JSON parse error if body is empty
        }

        // Get Admin Profile & Gym Code (New Schema)
        let query = supabaseClient
            .from('branch_users')
            .select('role, branches(gym_code)')
            .eq('user_id', userId)
            .in('role', ['owner', 'branch_admin']);

        if (branchId) {
            query = query.eq('branch_id', branchId);
        }

        const { data: branchUser, error: branchError } = await query.limit(1).single();

        if (branchError || !branchUser?.branches?.gym_code) {
            throw new Error("Admin profile or Gym Code not found");
        }
        const gymCode = branchUser.branches.gym_code;

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
