import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.0.0";
import { corsHeaders } from "../_shared/cors.ts";

console.log("Admin Dashboard Stats Function Up!");

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { token } = await req.json();

        if (!token) throw new Error('Missing token in request body');

        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        // Verify user via Firebase
        const googleRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${Deno.env.get('FIREBASE_API_KEY')}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken: token })
        });
        const googleData = await googleRes.json();
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

        // Check if user is admin and get Gym Code
        const { data: adminProfile, error: adminError } = await supabaseClient
            .from('profiles')
            .select('gym_code')
            .eq('user_id', internalUserId)
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
