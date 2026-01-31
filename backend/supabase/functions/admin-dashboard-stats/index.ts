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

        const { branchId } = await req.json().catch(() => ({}));

        // Check if user is admin (owner/branch_admin) and get Gym Code
        // New Schema: Users are in `branch_users` linked to `branches`
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
            console.error("Error fetching admin branch data:", branchError);
            throw new Error("Admin profile not found, or you are not an admin of the specified gym branch.");
        }

        const gymCode = branchUser.branches.gym_code;

        // 1. Get Active Members Count (Filtered by Gym Code)
        const { count: memberCount, error: memberError } = await supabaseClient
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .neq('role', 'trainer') // Assuming default or 'member' is member, and 'trainer' is trainer.
            .neq('role', 'admin')
            .eq('gym_code', gymCode);

        // 1b. Get Pending Member Invitations (Converted Leads who haven't accepted yet)
        const { count: invitedMemberCount, error: inviteError } = await supabaseClient
            .from('invitations')
            .select('*', { count: 'exact', head: true })
            .or('role.eq.member,role.eq.Member') // Handle mixed case potential
            .eq('status', 'pending')
            .eq('gym_code', gymCode);

        if (memberError) console.error("Error fetching member count:", memberError);
        if (inviteError) console.error("Error fetching invite count:", inviteError);

        const totalActiveMembers = (memberCount || 0) + (invitedMemberCount || 0);

        // 2. Get Active Trainers Count (Filtered by Gym Code)
        const { count: trainerCount, error: trainerError } = await supabaseClient
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'trainer')
            .eq('gym_code', gymCode);


        if (trainerError) {
            console.error("Error fetching trainer count:", trainerError);
        }

        // 2b. Get Pending Trainer Invitations
        const { count: invitedTrainerCount, error: inviteTrainerError } = await supabaseClient
            .from('invitations')
            .select('*', { count: 'exact', head: true })
            .or('role.eq.trainer,role.eq.Trainer')
            .eq('status', 'pending')
            .eq('gym_code', gymCode);

        if (inviteTrainerError) console.error("Error fetching invited trainer count:", inviteTrainerError);

        const totalActiveTrainers = (trainerCount || 0) + (invitedTrainerCount || 0);

        // 2c. Fetch all active user IDs for this gym to filter payments
        const { data: gymProfiles } = await supabaseClient
            .from('profiles')
            .select('user_id')
            .eq('gym_code', gymCode);

        const activeUserIds = gymProfiles ? gymProfiles.map(p => p.user_id) : [];

        // 3. Get Revenue (MRR - Sum of Active Plans) to match Billing Section

        // A. Fetch Plans
        const { data: plans } = await supabaseClient
            .from('plans')
            .select('id, price')
            .eq('gym_code', gymCode);

        const planPriceMap: Record<string, number> = {};
        (plans || []).forEach((p: any) => planPriceMap[p.id] = Number(p.price) || 0);

        let totalRevenue = 0;

        // B. Add Pending Invitations Value
        const { data: invitePlans } = await supabaseClient
            .from('invitations')
            .select('plan_id, pt_plan_id')
            .eq('gym_code', gymCode)
            .eq('status', 'pending');

        if (invitePlans) {
            invitePlans.forEach((inv: any) => {
                const planPrice = inv.plan_id ? (planPriceMap[inv.plan_id] || 0) : 0;
                const ptPrice = inv.pt_plan_id ? (planPriceMap[inv.pt_plan_id] || 0) : 0;
                totalRevenue += planPrice + ptPrice;
            });
        }

        // C. Add Active Subscriptions Value
        if (activeUserIds.length > 0) {
            const { data: activeSubs } = await supabaseClient
                .from('subscriptions')
                .select('plan_id, pt_plan_id')
                .in('user_id', activeUserIds)
                .eq('status', 'active'); // Only active subscriptions

            if (activeSubs) {
                activeSubs.forEach((sub: any) => {
                    const planPrice = sub.plan_id ? (planPriceMap[sub.plan_id] || 0) : 0;
                    const ptPrice = sub.pt_plan_id ? (planPriceMap[sub.pt_plan_id] || 0) : 0;
                    totalRevenue += planPrice + ptPrice;
                });
            }
        }

        // Legacy Payment Logic Removed
        let monthlyRevenue = totalRevenue; // Using variable matching return logic elsewhere

        // 4. Inquiries / Leads (Count from 'leads' table)
        const { count: leadsCount, error: leadsError } = await supabaseClient
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('gym_code', gymCode);

        if (leadsError) {
            console.error("Error fetching leads count:", leadsError);
        }

        // 5. Leads Summary (Aggregation by Source)
        // We need to fetch actual leads to aggregate if we want source distribution
        const { data: allLeads } = await supabaseClient
            .from('leads')
            .select('source, status')
            .eq('gym_code', gymCode);

        let leadsSummary = [];
        if (allLeads && allLeads.length > 0) {
            const summaryMap = new Map();
            allLeads.forEach(lead => {
                const source = lead.source || 'Unknown';
                if (!summaryMap.has(source)) {
                    summaryMap.set(source, { source, count: 0, converted: 0 });
                }
                const entry = summaryMap.get(source);
                entry.count += 1;
                if (lead.status === 'won' || lead.status === 'converted') { // Assuming 'won' or 'converted' means conversion
                    entry.converted += 1;
                }
            });

            // Format for frontend: { source: 'Instagram', count: 12, conversion: '25%' }
            leadsSummary = Array.from(summaryMap.values()).map(item => ({
                source: item.source,
                count: item.count,
                conversion: item.count > 0 ? `${Math.round((item.converted / item.count) * 100)}%` : '0%'
            }));
        }

        // 6. Recent Activity (Fetch from lead_logs, leads, profiles)
        // Fetch top recent items from each relevant table
        const limit = 5;

        // A. Logs
        const { data: recentLogs } = await supabaseClient
            .from('lead_logs')
            .select('note, created_at, type')
            .eq('gym_code', gymCode)
            .order('created_at', { ascending: false })
            .limit(limit);

        // B. New Leads
        const { data: recentLeads } = await supabaseClient
            .from('leads')
            .select('name, source, created_at')
            .eq('gym_code', gymCode)
            .order('created_at', { ascending: false })
            .limit(limit);

        // C. New Members
        const { data: recentMembers } = await supabaseClient
            .from('profiles')
            .select('full_name, created_at')
            .eq('gym_code', gymCode)
            .neq('role', 'admin') // Filter out admins potentially
            .order('created_at', { ascending: false })
            .limit(limit);

        // D. Invited Members (Pending)
        const { data: recentInvites } = await supabaseClient
            .from('invitations')
            .select('name, created_at, role')
            .eq('gym_code', gymCode)
            .order('created_at', { ascending: false })
            .limit(limit);

        let combinedActivity = [];

        // Map and combine
        if (recentLogs) {
            recentLogs.forEach(log => combinedActivity.push({
                type: 'log',
                text: log.note,
                raw_time: new Date(log.created_at),
                time: new Date(log.created_at).toLocaleDateString(),
                icon: log.type === 'Call' ? 'call' : 'document-text',
                color: '#3182CE'
            }));
        }

        if (recentLeads) {
            recentLeads.forEach(lead => combinedActivity.push({
                type: 'lead',
                text: `New Lead: ${lead.name} (${lead.source || 'Unknown'})`,
                raw_time: new Date(lead.created_at),
                time: new Date(lead.created_at).toLocaleDateString(),
                icon: 'person',
                color: '#ED8936' // Orange for leads
            }));
        }

        if (recentMembers) {
            recentMembers.forEach(member => combinedActivity.push({
                type: 'member',
                text: `New Member Joined: ${member.full_name}`,
                raw_time: new Date(member.created_at),
                time: new Date(member.created_at).toLocaleDateString(),
                icon: 'person-add',
                color: '#48BB78' // Green for members
            }));
        }

        if (recentInvites) {
            recentInvites.forEach(invite => combinedActivity.push({
                type: 'invite',
                text: `New Member Invited: ${invite.name}`,
                raw_time: new Date(invite.created_at),
                time: new Date(invite.created_at).toLocaleDateString(),
                icon: 'mail-outline',
                color: '#805AD5' // Purple for invites
            }));
        }

        // Sort by date desc and take top N
        combinedActivity.sort((a, b) => b.raw_time - a.raw_time);
        const recentActivity = combinedActivity.slice(0, 10).map((item, index) => ({
            id: index,
            text: item.text,
            time: item.time,
            icon: item.icon,
            color: item.color
        }));

        return new Response(JSON.stringify({
            activeMembers: totalActiveMembers, // Updated count
            activeTrainers: totalActiveTrainers, // Updated count (Profiles + Invitations)
            monthlyRevenue: monthlyRevenue,
            leads: leadsCount || 0,
            recentActivity: recentActivity,
            pendingTasks: [],   // Placeholder for real tasks
            leadsSummary: leadsSummary,
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
