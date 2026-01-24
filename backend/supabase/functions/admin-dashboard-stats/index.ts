import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.0.0";
import { corsHeaders } from "../_shared/cors.ts";

console.log("Admin Dashboard Stats Function Up!");

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const authHeader = req.headers.get('authorization');
        if (!authHeader) throw new Error('Missing authorization header');
        const token = authHeader.replace('Bearer ', '');

        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        // Verify Supabase JWT
        const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
        if (authError || !user) throw new Error("Unauthorized");
        const userId = user.id;

        // Check if user is admin and get Gym Code
        const { data: adminProfile, error: adminError } = await supabaseClient
            .from('profiles')
            .select('gym_code')
            .eq('user_id', userId)
            .single();

        if (adminError || !adminProfile?.gym_code) {
            console.error("Error fetching admin profile or missing gym code:", adminError);
            throw new Error("Admin profile not found or missing Gym Code");
        }

        const gymCode = adminProfile.gym_code;

        // 1. Get Active Members Count (Filtered by Gym Code)
        const { count: memberCount, error: memberError } = await supabaseClient
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .neq('role', 'trainer') // Assuming default or 'member' is member, and 'trainer' is trainer.
            .neq('role', 'admin')
            .eq('gym_code', gymCode);

        if (memberError) {
            console.error("Error fetching member count:", memberError);
        }

        // 2. Get Active Trainers Count (Filtered by Gym Code)
        const { count: trainerCount, error: trainerError } = await supabaseClient
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'trainer')
            .eq('gym_code', gymCode);


        if (trainerError) {
            console.error("Error fetching trainer count:", trainerError);
        }

        // 3. Get Monthly Revenue (Sum from payments table for current month)
        // Note: Assuming 'payments' table has 'amount' and 'created_at'
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const { data: payments, error: paymentError } = await supabaseClient
            .from('payments')
            .select('amount')
            .gte('created_at', startOfMonth.toISOString());

        let monthlyRevenue = 0;
        if (!paymentError && payments) {
            monthlyRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
        }

        // 4. Inquiries / Leads (Mock for now or count if table exists)
        // We know 'leads' table doesn't exist yet, so we return a placeholder or 0
        const leadsCount = 0;

        return new Response(JSON.stringify({
            activeMembers: memberCount || 0,
            activeTrainers: trainerCount || 0,
            monthlyRevenue: monthlyRevenue,
            leads: leadsCount,
            recentActivity: [], // Placeholder for real activity log
            pendingTasks: [],   // Placeholder for real tasks
            leadsSummary: [],   // Placeholder for leads aggregation
            upcomingEvents: []  // Placeholder for calendar events
        }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
