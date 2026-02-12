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

        const { branchId, allBranches } = await req.json().catch(() => ({}));

        let gymCodes: string[] = [];

        if (allBranches) {
            // Fetch ALL branches where user is Owner or Admin
            // 1. From branch_users (assigned roles)
            const { data: allUserBranches, error: allBranchesError } = await supabaseClient
                .from('branch_users')
                .select('branches(gym_code)')
                .eq('user_id', userId)
                .in('role', ['owner', 'branch_admin']);

            if (allBranchesError) {
                console.error("Error fetching all branches:", allBranchesError);
                throw new Error("Failed to fetch branches.");
            }

            // 2. From branches table (direct ownership - fail-safe)
            const { data: ownedBranches, error: ownedError } = await supabaseClient
                .from('branches')
                .select('gym_code')
                .eq('owner_id', userId);

            if (ownedError) console.error("Error fetching owned branches:", ownedError);

            // Extract gym codes and merge
            const linkedCodes = allUserBranches?.map((b: any) => b.branches?.gym_code) || [];
            const ownedCodes = ownedBranches?.map((b: any) => b.gym_code) || [];

            // Deduplicate
            gymCodes = [...new Set([...linkedCodes, ...ownedCodes])].filter(code => code);

        } else {
            // Check specific branch permissions
            let query = supabaseClient
                .from('branch_users')
                .select('role, branches(gym_code)')
                .eq('user_id', userId)
                .in('role', ['owner', 'branch_admin']);

            if (branchId) {
                query = query.eq('branch_id', branchId);
                const { data: branchUser, error: branchError } = await query.limit(1).single();

                if (branchError || !branchUser?.branches?.gym_code) {
                    console.error("Error fetching admin branch data:", branchError);
                    throw new Error("Admin profile not found, or you are not an admin of the specified gym branch.");
                }
                gymCodes = [branchUser.branches.gym_code];
            } else {
                // Prevent default fallback to random branch
                console.error("No branchId provided for dashboard stats");
                throw new Error("Branch ID is required.");
            }
        }

        if (gymCodes.length === 0) {
            return new Response(JSON.stringify({
                activeMembers: 0,
                activeTrainers: 0,
                monthlyRevenue: 0,
                leads: 0,
                recentActivity: [],
                pendingTasks: [],
                leadsSummary: [],
                upcomingEvents: []
            }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }


        // 1. Get Active Members Count (Filtered by Gym Codes)
        const { count: memberCount, error: memberError } = await supabaseClient
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .in('role', ['member', 'Member'])
            .in('gym_code', gymCodes);

        // 1b. Get Pending Member Invitations
        const { count: invitedMemberCount, error: inviteError } = await supabaseClient
            .from('invitations')
            .select('*', { count: 'exact', head: true })
            .or('role.eq.member,role.eq.Member')
            .eq('status', 'pending')
            .in('gym_code', gymCodes);

        if (memberError) console.error("Error fetching member count:", memberError);
        if (inviteError) console.error("Error fetching invite count:", inviteError);

        const totalActiveMembers = (memberCount || 0) + (invitedMemberCount || 0);

        // 2. Get Active Trainers Count
        const { count: trainerCount, error: trainerError } = await supabaseClient
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .in('role', ['trainer', 'Trainer'])
            .in('gym_code', gymCodes);

        if (trainerError) console.error("Error fetching trainer count:", trainerError);

        // 2b. Get Pending Trainer Invitations
        const { count: invitedTrainerCount, error: inviteTrainerError } = await supabaseClient
            .from('invitations')
            .select('*', { count: 'exact', head: true })
            .or('role.eq.trainer,role.eq.Trainer')
            .eq('status', 'pending')
            .in('gym_code', gymCodes);

        if (inviteTrainerError) console.error("Error fetching invited trainer count:", inviteTrainerError);

        const totalActiveTrainers = (trainerCount || 0) + (invitedTrainerCount || 0);

        // 2c. Fetch all active user IDs for these gyms to filter payments
        const { data: gymProfiles } = await supabaseClient
            .from('profiles')
            .select('user_id')
            .in('gym_code', gymCodes);

        const activeUserIds = gymProfiles ? gymProfiles.map(p => p.user_id) : [];

        // 3. Get Revenue (MRR - Sum of Active Plans)

        // A. Fetch Plans
        const { data: plans } = await supabaseClient
            .from('plans')
            .select('id, price')
            .in('gym_code', gymCodes);

        const planPriceMap: Record<string, number> = {};
        (plans || []).forEach((p: any) => planPriceMap[p.id] = Number(p.price) || 0);

        let totalRevenue = 0;

        // C. Add Active Subscriptions Value
        if (activeUserIds.length > 0) {
            const { data: activeSubs } = await supabaseClient
                .from('subscriptions')
                .select('plan_id, pt_plan_id')
                .in('user_id', activeUserIds)
                .eq('status', 'active');

            if (activeSubs) {
                activeSubs.forEach((sub: any) => {
                    const planPrice = sub.plan_id ? (planPriceMap[sub.plan_id] || 0) : 0;
                    const ptPrice = sub.pt_plan_id ? (planPriceMap[sub.pt_plan_id] || 0) : 0;
                    totalRevenue += planPrice + ptPrice;
                });
            }
        }

        let monthlyRevenue = totalRevenue;

        // 4. Inquiries / Leads
        const { count: leadsCount, error: leadsError } = await supabaseClient
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .in('gym_code', gymCodes);

        if (leadsError) console.error("Error fetching leads count:", leadsError);

        // 5. Leads Summary (Aggregation by Source)
        const { data: allLeads } = await supabaseClient
            .from('leads')
            .select('source, status')
            .in('gym_code', gymCodes);

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
                if (lead.status === 'won' || lead.status === 'converted') {
                    entry.converted += 1;
                }
            });

            leadsSummary = Array.from(summaryMap.values()).map(item => ({
                source: item.source,
                count: item.count,
                conversion: item.count > 0 ? `${Math.round((item.converted / item.count) * 100)}%` : '0%'
            }));
        }

        // 6. Recent Activity
        const limit = 5;

        // A. Logs
        const { data: recentLogs } = await supabaseClient
            .from('lead_logs')
            .select('note, created_at, type')
            .in('gym_code', gymCodes)
            .order('created_at', { ascending: false })
            .limit(limit);

        // B. New Leads
        const { data: recentLeads } = await supabaseClient
            .from('leads')
            .select('name, source, created_at')
            .in('gym_code', gymCodes)
            .order('created_at', { ascending: false })
            .limit(limit);

        // C. New Members
        const { data: recentMembers } = await supabaseClient
            .from('profiles')
            .select('full_name, created_at')
            .in('gym_code', gymCodes)
            .neq('role', 'admin')
            .order('created_at', { ascending: false })
            .limit(limit);

        // D. Invited Members (Pending)
        const { data: recentInvites } = await supabaseClient
            .from('invitations')
            .select('name, created_at, role')
            .in('gym_code', gymCodes)
            .order('created_at', { ascending: false })
            .limit(limit);

        let combinedActivity: any[] = [];

        if (recentLogs) {
            recentLogs.forEach((log: any) => combinedActivity.push({
                type: 'log',
                text: log.note,
                raw_time: new Date(log.created_at),
                time: new Date(log.created_at).toLocaleDateString(),
                icon: log.type === 'Call' ? 'call' : 'document-text',
                color: '#3182CE'
            }));
        }

        if (recentLeads) {
            recentLeads.forEach((lead: any) => combinedActivity.push({
                type: 'lead',
                text: `New Lead: ${lead.name} (${lead.source || 'Unknown'})`,
                raw_time: new Date(lead.created_at),
                time: new Date(lead.created_at).toLocaleDateString(),
                icon: 'person',
                color: '#ED8936'
            }));
        }

        if (recentMembers) {
            recentMembers.forEach((member: any) => combinedActivity.push({
                type: 'member',
                text: `New Member Joined: ${member.full_name}`,
                raw_time: new Date(member.created_at),
                time: new Date(member.created_at).toLocaleDateString(),
                icon: 'person-add',
                color: '#48BB78'
            }));
        }

        if (recentInvites) {
            recentInvites.forEach((invite: any) => combinedActivity.push({
                type: 'invite',
                text: `New Member Invited: ${invite.name}`,
                raw_time: new Date(invite.created_at),
                time: new Date(invite.created_at).toLocaleDateString(),
                icon: 'mail-outline',
                color: '#805AD5'
            }));
        }

        combinedActivity.sort((a, b) => b.raw_time.getTime() - a.raw_time.getTime());
        const recentActivity = combinedActivity.slice(0, 10).map((item, index) => ({
            id: index,
            text: item.text,
            time: item.time,
            icon: item.icon,
            color: item.color
        }));

        return new Response(JSON.stringify({
            activeMembers: totalActiveMembers,
            activeTrainers: totalActiveTrainers,
            monthlyRevenue: monthlyRevenue,
            leads: leadsCount || 0,
            recentActivity: recentActivity,
            pendingTasks: [],
            leadsSummary: leadsSummary,
            upcomingEvents: []
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
