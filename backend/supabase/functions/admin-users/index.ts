import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
    // Handle CORS preflight request
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

        // 1. Verify Supabase JWT and get user
        const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

        if (authError || !user) {
            console.error("Auth error:", authError);
            throw new Error("Unauthorized");
        }

        const userId = user.id; // Direct UUID from Supabase Auth

        // 3. Parse action and payload from body
        const body = await req.json();
        const { action, payload, branchId } = body;

        // 2. Get Admin Profile & Gym Code (New Schema: branch_users -> branches)
        let query = supabaseClient
            .from('branch_users')
            .select('branch_id, role, branches(gym_code)')
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

        // 4. Handle Actions
        let result;
        let error;

        switch (action) {
            case 'fetch':
            case undefined: // Default to fetch if no action
                // 1. Fetch Active Profiles (Join with Profiles again to get assigned trainer name if needed, or just IDs)
                // We need to fetch 'assigned_trainer_id' and ideally the trainer's name. 
                // Since self-join is complex in one go, let's fetch IDs first or mapping.
                // Assuming 'assigned_trainer_id' exists in profiles.
                const { data: activeUsers, error: profilesError } = await supabaseClient
                    .from('profiles')
                    .select('user_id, full_name, role, phone_number, created_at, gym_code, address, assigned_trainer_id, app_users(email)')
                    .eq('gym_code', gymCode)
                    .neq('role', 'admin')
                    .order('created_at', { ascending: false });

                if (profilesError) throw profilesError;

                // 2. Fetch Pending Invitations
                const { data: pendingUsers, error: invitesError } = await supabaseClient
                    .from('invitations')
                    .select('id, name, role, phone, email, plan_id, pt_plan_id, created_at, status, address, assigned_trainer_id')
                    .eq('gym_code', gymCode)
                    .eq('status', 'pending')
                    .order('created_at', { ascending: false });

                if (invitesError) throw invitesError;

                // 3. Fetch Active Subscriptions for Active Users
                const activeUserIds = activeUsers.map(u => u.user_id);
                let userPlans: any = {};

                if (activeUserIds.length > 0) {
                    const { data: subs } = await supabaseClient
                        .from('subscriptions')
                        .select('user_id, plan_id, pt_plan_id')
                        .in('user_id', activeUserIds)
                        .eq('status', 'active'); // Or just take the latest?

                    if (subs) {
                        subs.forEach(s => {
                            userPlans[s.user_id] = { plan_id: s.plan_id, pt_plan_id: s.pt_plan_id };
                        });
                    }
                }

                // 4. Merge & Map
                const mappedActive = activeUsers.map(u => ({
                    id: u.user_id,
                    full_name: u.full_name,
                    phone_number: u.phone_number,
                    email: u.app_users?.email,
                    role: u.role,
                    status: 'Active',
                    created_at: u.created_at,
                    gym_code: u.gym_code,
                    plan_id: userPlans[u.user_id]?.plan_id || null,
                    pt_plan_id: userPlans[u.user_id]?.pt_plan_id || null,
                    address: u.address,
                    assigned_trainer_id: u.assigned_trainer_id,
                    // We can map trainer name here efficiently if we had a map of all trainers.
                    // Let's create a trainer map from activeUsers AND pendingUsers (Invited Trainers)
                    assigned_trainer_name: activeUsers.find(t => t.user_id === u.assigned_trainer_id)?.full_name
                        || pendingUsers.find(t => t.id === u.assigned_trainer_id)?.name
                }));

                const mappedPending = pendingUsers.map(u => ({
                    id: u.id,
                    full_name: u.name,
                    phone_number: u.phone,
                    email: u.email,
                    role: u.role,
                    status: 'Pending',
                    created_at: u.created_at,
                    gym_code: gymCode,
                    plan_id: u.plan_id,
                    pt_plan_id: u.pt_plan_id,
                    address: u.address,
                    assigned_trainer_id: u.assigned_trainer_id,
                    assigned_trainer_name: activeUsers.find(t => t.user_id === u.assigned_trainer_id)?.full_name
                        || pendingUsers.find(t => t.id === u.assigned_trainer_id)?.name
                }));

                // Combine and sort by newest first
                result = [...mappedPending, ...mappedActive].sort((a, b) =>
                    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                );
                break;

            case 'bulk_create':
                const { users } = payload;
                if (!Array.isArray(users) || users.length === 0) {
                    throw new Error("No users provided");
                }

                const invitationsToInsert = users.map(u => ({
                    gym_code: gymCode,
                    role: u.role?.toLowerCase() || 'member',
                    name: u.name,
                    phone: u.phone,
                    email: u.email,
                    address: u.address || null,
                    plan_id: null,
                    status: 'pending'
                }));

                ({ data: result, error } = await supabaseClient
                    .from('invitations')
                    .insert(invitationsToInsert)
                    .select());
                break;

            case 'create':
                // Creating a user "Directly" means creating an Invitation
                if (!payload.name || (!payload.phone && !payload.email)) {
                    throw new Error("Name and either Phone or Email are required");
                }

                // Handling Branch Admin Creation specifically to ensure branch_users entry + permissions
                if (payload.role === 'branch_admin') {
                    // Check if user exists as strict profile first might be tricky if they are new. 
                    // Usually we invite them via auth, but here we are creating a profile/invitation.
                    // If we want them to login, they need an auth user. 
                    // Simple flow: Create Invitation -> They accept -> Auth User created -> trigger creates profile -> we update role?
                    // OR: "Create User" here implies creating a "Ghost" user or Pre-created user? 
                    // Looking at 'bulk_create', it creates INVITATIONS.
                    // So specific Branch Admin creation should probably also be an Invitation if they don't exist?
                    // But for Admin, we might want to attach permissions NOW. Invitation table needs 'permissions' col?
                    // Or just store it in metadata?
                    // Let's assume we create an INVITATION with role='branch_admin'. 
                    // When they accept, they become branch_admin. 
                    // WE NEED TO STORE PERMISSIONS IN INVITATION or somewhere. 
                    // Let's add 'permissions' to invitation creation for now if standard flow.
                    // BUT, if we want to assign permissions to EXISTING user, we do it via branch_users.

                    // For now, let's treat "Create" as "Create Invitation" as per existing code.
                    // I will add 'permissions' to the INSERT.
                    // IMPORTANT: 'invitations' table does not have 'permissions' column yet.
                    // I should add it to migration or use a metadata field?
                    // 'invitations' has 'role'. 
                    // Let's add 'permissions' to 'invitations' table too in a migration update or separate one?
                    // Better: use 'create_branch_admin' action if we want to be explicit, but 'create' is generic.
                    // I'll stick to 'create' and add permissions to payload.
                    // I need to update INVITATION schema to store permissions? Or just handle it post-signup?
                    // If they are pending, we can't save to branch_users yet as there is no user_id?
                    // Wait, `branch_users` links `user_id` (auth id).
                    // So we need `permissions` in `invitations` table to copy over on signup.
                    // I will assume for this task we might need to modify `invitations` table too. 
                    // OR just stick to updating permissions for ACTIVE users.
                    // Let's try to update `invitations` logic to accept `permissions` JSONB.
                    // I will need to update the migration to add permissions to invitations too.
                }

                // Check if already invited

                const { data: existingInvite } = await supabaseClient
                    .from('invitations')
                    .select('id')
                    .eq('gym_code', gymCode)
                    .or(`phone.eq.${payload.phone},email.eq.${payload.email}`)
                    .maybeSingle();

                if (existingInvite) {
                    // Update existing invitation instead of erroring
                    ({ data: result, error } = await supabaseClient
                        .from('invitations')
                        .update({
                            role: payload.role?.toLowerCase() || 'member',
                            name: payload.name,
                            plan_id: payload.plan_id || null,
                            pt_plan_id: payload.pt_plan_id || null,
                            address: payload.address,
                            permissions: payload.permissions || [],
                            assigned_trainer_id: payload.assigned_trainer_id || null
                        })
                        .eq('id', existingInvite.id)
                        .select()
                        .maybeSingle());
                } else {
                    // Create New Invitation
                    ({ data: result, error } = await supabaseClient
                        .from('invitations')
                        .insert({
                            gym_code: gymCode,
                            role: payload.role?.toLowerCase() || 'member',
                            name: payload.name,
                            phone: payload.phone,
                            email: payload.email,
                            plan_id: payload.plan_id || null,
                            pt_plan_id: payload.pt_plan_id || null,
                            status: 'pending',
                            address: payload.address,
                            permissions: payload.permissions || [],
                            assigned_trainer_id: payload.assigned_trainer_id || null
                        })
                        .select()
                        .maybeSingle());
                }
                break;

            case 'update':
                if (!payload?.id) throw new Error("Missing user ID");

                // 1. Try updating Invitation (Pending User)
                const { data: inviteUpdate, error: inviteError } = await supabaseClient
                    .from('invitations')
                    .update({
                        name: payload.name,
                        phone: payload.phone,
                        email: payload.email,
                        role: payload.role?.toLowerCase(),
                        plan_id: payload.plan_id,
                        pt_plan_id: payload.pt_plan_id,
                        address: payload.address,
                        permissions: payload.permissions,
                        assigned_trainer_id: payload.assigned_trainer_id
                    })
                    .eq('id', payload.id)
                    .maybeSingle();

                if (inviteError) throw inviteError;

                if (inviteUpdate) {
                    result = inviteUpdate;
                    break;
                }

                // 2. If not invitation, Update Profile (Active User)
                const profileUpdates: any = {};
                if (payload.name) profileUpdates.full_name = payload.name;
                if (payload.phone) profileUpdates.phone_number = payload.phone;
                if (payload.role) profileUpdates.role = payload.role.toLowerCase();
                if (payload.role) profileUpdates.role = payload.role.toLowerCase();
                if (payload.address) profileUpdates.address = payload.address;
                if (payload.assigned_trainer_id !== undefined) profileUpdates.assigned_trainer_id = payload.assigned_trainer_id;

                const { data: profileUpdate, error: profileError } = await supabaseClient
                    .from('profiles')
                    .update(profileUpdates)
                    .eq('user_id', payload.id)
                    .eq('gym_code', gymCode)
                    .select()
                    .maybeSingle();

                if (profileError) throw profileError;

                if (!profileUpdate) {
                    console.log("Warning: Profile update returned no rows for ID:", payload.id);
                    // Do not throw error here, just return success status
                }
                result = profileUpdate;

                if (profileError) throw profileError;
                result = profileUpdate;

                // 2b. Update Branch User Permissions (if applicable)
                if (payload.permissions !== undefined && branchUser.branch_id) {
                    // Update permissions for the user in this specific branch
                    const { error: permError } = await supabaseClient
                        .from('branch_users')
                        .update({ permissions: payload.permissions })
                        .eq('user_id', payload.id)
                        .eq('branch_id', branchUser.branch_id);

                    if (permError) {
                        console.error("Failed to update permissions:", permError);
                        // We might not throw here to avoid failing the whole profile update if just perms fail, 
                        // but usually it's better to be strict.
                        throw permError;
                    }
                }

                // 3. Update Subscription for Active User
                if (payload.plan_id || payload.pt_plan_id !== undefined) {
                    const { data: existingSub } = await supabaseClient
                        .from('subscriptions')
                        .select('id')
                        .eq('user_id', payload.id)
                        .maybeSingle();

                    const subUpdates: any = {};
                    if (payload.plan_id) subUpdates.plan_id = payload.plan_id;
                    if (payload.pt_plan_id !== undefined) subUpdates.pt_plan_id = payload.pt_plan_id;

                    if (existingSub) {
                        await supabaseClient
                            .from('subscriptions')
                            .update(subUpdates)
                            .eq('id', existingSub.id);
                    } else {
                        await supabaseClient
                            .from('subscriptions')
                            .insert({
                                user_id: payload.id,
                                plan_id: payload.plan_id || null,
                                pt_plan_id: payload.pt_plan_id || null,
                                status: 'active'
                            });
                    }
                }
                break;

            case 'delete':
                if (!payload?.id) throw new Error("Missing user ID");
                // Soft delete / Detach from Gym (set gym_code to null)
                ({ data: result, error } = await supabaseClient
                    .from('profiles')
                    .update({ gym_code: null })
                    .eq('user_id', payload.id)
                    .eq('gym_code', gymCode)
                    .select()
                    .maybeSingle());
                break;

            default:
                throw new Error(`Invalid action: ${action}`);
        }

        if (error) {
            console.error("Action Error:", error);
            throw error;
        }

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
