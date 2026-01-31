import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // Get token from Authorization header
        const authHeader = req.headers.get('authorization');
        if (!authHeader) throw new Error('Missing authorization header');
        const token = authHeader.replace('Bearer ', '');

        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
        const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

        // Verify Supabase JWT
        const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
        if (authError || !user) throw new Error("Unauthorized");
        const userId = user.id;

        // Parse action and payload from body
        const body = await req.json();
        const { action, payload, branchId } = body;

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
            throw new Error("Admin profile or Gym Code not found (branch lookup failed)");
        }
        const gymCode = branchUser.branches.gym_code;

        // 2. Handle Actions
        let result;
        let error;

        switch (action) {
            case 'fetch':
                const { data: leads, error: leadsError } = await supabaseClient
                    .from('leads')
                    .select('*')
                    .eq('gym_code', gymCode)
                    .order('created_at', { ascending: false });

                if (leadsError) throw leadsError;

                // Fetch trainer names manually
                const trainerIds = [...new Set(leads.map(l => l.assigned_trainer_id).filter(id => id))];
                let trainerMap: Record<string, string> = {};

                if (trainerIds.length > 0) {
                    const { data: trainers } = await supabaseClient
                        .from('profiles')
                        .select('user_id, full_name')
                        .in('user_id', trainerIds);

                    if (trainers) {
                        trainers.forEach(t => {
                            trainerMap[t.user_id] = t.full_name;
                        });
                    }
                }

                result = leads.map(l => ({
                    ...l,
                    assigned_trainer_name: trainerMap[l.assigned_trainer_id] || null
                }));
                break;

            case 'create':
                if (!payload) throw new Error("Missing payload for create");
                ({ data: result, error } = await supabaseClient
                    .from('leads')
                    .insert({ ...payload, gym_code: gymCode })
                    .select()
                    .single());
                break;

            case 'update':
                if (!payload?.id) throw new Error("Missing lead ID for update");
                const { id, ...updates } = payload;

                // Allow specific fields including assignments
                const allowedUpdates: any = {};
                if (updates.name !== undefined) allowedUpdates.name = updates.name;
                if (updates.phone !== undefined) allowedUpdates.phone = updates.phone;
                if (updates.email !== undefined) allowedUpdates.email = updates.email;
                if (updates.source !== undefined) allowedUpdates.source = updates.source;
                if (updates.status !== undefined) allowedUpdates.status = updates.status;
                if (updates.notes !== undefined) allowedUpdates.notes = updates.notes;
                if (updates.assigned_trainer_id !== undefined) allowedUpdates.assigned_trainer_id = updates.assigned_trainer_id;
                if (updates.address !== undefined) allowedUpdates.address = updates.address;
                if (updates.lost_reason !== undefined) allowedUpdates.lost_reason = updates.lost_reason;

                ({ data: result, error } = await supabaseClient
                    .from('leads')
                    .update(allowedUpdates)
                    .eq('id', id)
                    .eq('gym_code', gymCode)
                    .select()
                    .single());
                break;

            case 'fetch_logs':
                if (!payload?.lead_id) throw new Error("Missing lead ID");
                ({ data: result, error } = await supabaseClient
                    .from('lead_logs')
                    .select('*')
                    .eq('lead_id', payload.lead_id)
                    .eq('gym_code', gymCode)
                    .order('created_at', { ascending: false }));
                break;

            case 'add_log':
                if (!payload?.lead_id || !payload.note) throw new Error("Missing log details");
                ({ data: result, error } = await supabaseClient
                    .from('lead_logs')
                    .insert({
                        lead_id: payload.lead_id,
                        note: payload.note,
                        type: payload.type || 'Note',
                        created_by: userId,
                        gym_code: gymCode
                    })
                    .select()
                    .single());
                break;

            case 'delete':
                if (!payload?.id) throw new Error("Missing lead ID for delete");
                ({ data: result, error } = await supabaseClient
                    .from('leads')
                    .delete()
                    .eq('id', payload.id)
                    .eq('gym_code', gymCode));
                break;

            default:
                throw new Error(`Invalid action: ${action}`);
        }

        if (error) throw error;

        return new Response(JSON.stringify(result || { success: true }), {
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
