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
            case undefined:
                // Unified Fetch from branch_users
                let branchIds = [];
                if (branchId) {
                    branchIds = [branchId];
                } else {
                    if (branchUser.role === 'owner') {
                        const { data: branches } = await supabaseClient
                            .from('branches')
                            .select('id')
                            .eq('gym_code', gymCode);
                        branchIds = branches?.map(b => b.id) || [];
                    } else {
                        branchIds = [branchUser.branch_id];
                    }
                }

                // 1. Fetch Branch Users (Active) - Only Members and Trainers
                const { data: bUsers, error: bError } = await supabaseClient
                    .from('branch_users')
                    .select('user_id, role, status, created_at')
                    .in('branch_id', branchIds)
                    .in('role', ['member', 'trainer'])
                    .order('created_at', { ascending: false });

                if (bError) throw bError;

                // 1b. Fetch Pending Invitations - Only Members and Trainers
                const { data: invitations, error: iError } = await supabaseClient
                    .from('invitations')
                    .select('*')
                    .eq('gym_code', gymCode)
                    .eq('status', 'pending')
                    .in('role', ['member', 'trainer', 'Member', 'Trainer']);

                if (iError) throw iError;

                const activeUsers = bUsers || [];
                const pendingUsers = invitations || [];

                if (activeUsers.length === 0 && pendingUsers.length === 0) {
                    result = [];
                    break;
                }

                const userIds = activeUsers.map(u => u.user_id);

                // 2. Fetch Profiles for Active Users
                let profiles = [];
                let subscriptions = [];

                if (userIds.length > 0) {
                    const { data: pData, error: pError } = await supabaseClient
                        .from('profiles')
                        .select('user_id, name, full_name, phone_number, address, assigned_trainer_id, assigned_session')
                        .in('user_id', userIds);

                    if (pError) throw pError;
                    profiles = pData || [];

                    const { data: sData, error: sError } = await supabaseClient
                        .from('subscriptions')
                        .select('user_id, plan_id, pt_plan_id, status')
                        .in('user_id', userIds);

                    if (sError) throw sError;
                    subscriptions = sData || [];
                }

                // Helper to get latest active sub
                const getSub = (uid) => {
                    const userSubs = subscriptions?.filter(s => s.user_id === uid) || [];
                    if (userSubs.length === 0) return { plan_id: null, pt_plan_id: null };

                    // Prioritize active, else take first
                    const active = userSubs.find(s => s.status === 'active') || userSubs[0];
                    return active || { plan_id: null, pt_plan_id: null };
                };

                // 3. Fetch Owners for Active Users (since owners might not have full profiles)
                let ownersData = [];
                if (userIds.length > 0) {
                    const { data: oData } = await supabaseClient
                        .from('owners')
                        .select('id, name, phone, email')
                        .in('id', userIds);
                    ownersData = oData || [];
                }

                // 4. Merge Data
                const mappedActive = activeUsers.map(u => {
                    const profile = profiles?.find(p => p.user_id === u.user_id) || {};
                    const ownerEntry = ownersData?.find(o => o.id === u.user_id) || {};
                    const subInfo = getSub(u.user_id);

                    const finalName = profile.full_name || profile.name || ownerEntry.name || 'Unknown';
                    const finalPhone = profile.phone_number || ownerEntry.phone || 'No Phone';

                    return {
                        id: u.user_id,
                        full_name: finalName,
                        phone_number: finalPhone,
                        email: ownerEntry.email || null,
                        role: u.role,
                        status: u.status === 'active' ? 'Active' : 'Pending',
                        created_at: u.created_at,
                        gym_code: gymCode,
                        plan_id: subInfo.plan_id,
                        pt_plan_id: subInfo.pt_plan_id,
                        address: profile.address,
                        assigned_trainer_id: profile.assigned_trainer_id,
                        assigned_trainer_name: null,
                        assigned_session: profile.assigned_session || null
                    };
                });

                const mappedPending = pendingUsers.map(inv => ({
                    id: inv.id, // Invitation ID (not User UUID yet)
                    full_name: inv.name,
                    phone_number: inv.phone,
                    email: inv.email,
                    role: inv.role,
                    status: 'Pending',
                    created_at: inv.created_at,
                    gym_code: inv.gym_code,
                    plan_id: inv.plan_id,
                    pt_plan_id: inv.pt_plan_id,
                    address: inv.address,
                    assigned_trainer_id: inv.assigned_trainer_id,
                    assigned_trainer_name: null,
                    assigned_session: inv.assigned_session || null
                }));

                result = [...mappedActive, ...mappedPending].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

                // Populate assigned_trainer_name (now that we have all profiles logic)
                const allTrainers = result.filter(u => u.role === 'trainer' || u.role === 'Trainer');
                result.forEach(u => {
                    if (u.assigned_trainer_id) {
                        // Look in both active and pending list just in case, though usually trainers are active
                        // Note: ID for pending users is int, ID for active is UUID. 
                        // Assigned Admin ID/User ID will overlap.
                        // Ideally assigned_trainer_id refers to a User UUID.
                        const trainer = allTrainers.find(t => t.id === u.assigned_trainer_id);
                        if (trainer) u.assigned_trainer_name = trainer.full_name;
                    }
                });
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
                    plan_id: u.plan_id || null,
                    status: 'pending'
                }));

                ({ data: result, error } = await supabaseClient
                    .from('invitations')
                    .insert(invitationsToInsert)
                    .select());
                break;

            case 'create':
                // Create User: Auth -> Profile -> BranchUser -> Subscription
                if (!payload.name || !payload.phone) {
                    throw new Error("Name and Phone are required");
                }

                const rawInput = payload.phone;
                const phoneNoPlus = rawInput.replace(/^\+/, '');
                const digitsOnly = phoneNoPlus.replace(/\D/g, ''); // strip non-digits

                // Default to India (+91) if 10 digits
                const e164Phone = digitsOnly.length === 10
                    ? '+91' + digitsOnly
                    : '+' + digitsOnly;

                // 1. Create Auth User
                const { data: newUser, error: createError } = await supabaseClient.auth.admin.createUser({
                    phone: e164Phone,
                    email: payload.email,
                    phone_confirm: true,
                    user_metadata: { role: payload.role?.toLowerCase() || 'member' }
                });

                let newUserId = newUser?.user?.id;

                if (createError) {
                    console.log("CreateUser Failed:", createError.message);
                    const msg = createError.message.toLowerCase();

                    // If user exists, try to find them
                    if (msg.includes('already registered') || msg.includes('exists') || msg.includes('unique constraint')) {
                        console.log("User likely exists. Searching for ID...");

                        // 0. Try finding in 'app_users' (Most reliable sync table)
                        let matchQuery = `phone.eq.${e164Phone}`;
                        if (payload.email) matchQuery += `,email.eq.${payload.email}`;

                        const { data: appUserMatch } = await supabaseClient
                            .from('app_users')
                            .select('id')
                            .or(matchQuery)
                            .maybeSingle();

                        if (appUserMatch) {
                            newUserId = appUserMatch.id;
                            console.log("Found User ID via app_users:", newUserId);
                        }

                        // 1. Try finding in 'profiles'
                        if (!newUserId) {
                            const { data: profileUser } = await supabaseClient
                                .from('profiles')
                                .select('user_id')
                                .or(`phone_number.eq.${e164Phone},phone_number.eq.${payload.phone}`)
                                .maybeSingle();

                            if (profileUser) {
                                newUserId = profileUser.user_id;
                                console.log("Found User ID via Profiles:", newUserId);
                            }
                        }

                        // 2. Try 'owners'
                        if (!newUserId) {
                            const { data: ownerUser } = await supabaseClient
                                .from('owners')
                                .select('id')
                                .eq('phone', e164Phone)
                                .maybeSingle();

                            if (ownerUser) {
                                newUserId = ownerUser.id;
                                console.log("Found User ID via Owners (e164):", newUserId);
                            } else {
                                // Try raw
                                const { data: ownerUserRaw } = await supabaseClient
                                    .from('owners')
                                    .select('id')
                                    .eq('phone', digitsOnly) // try raw digits
                                    .maybeSingle();

                                if (ownerUserRaw) {
                                    newUserId = ownerUserRaw.id;
                                    console.log("Found User ID via Owners (raw):", newUserId);
                                }
                            }
                        }

                        // 3. Fallback: Search Auth Users (with Pagination & Robust Matching)
                        if (!newUserId) {
                            console.log("Fallback: Searching Auth List...");

                            let page = 1;
                            const PER_PAGE_LIMIT = 1000;
                            let hasMore = true;
                            let totalScanned = 0;

                            while (hasMore && !newUserId) {
                                const { data: { users: searchedUsers }, error: listError } = await supabaseClient.auth.admin.listUsers({
                                    page: page,
                                    perPage: PER_PAGE_LIMIT
                                });

                                if (listError) {
                                    console.error("ListUsers Error:", listError);
                                    hasMore = false;
                                    break;
                                }

                                if (!searchedUsers || searchedUsers.length === 0) {
                                    hasMore = false;
                                    break;
                                }

                                totalScanned += searchedUsers.length;

                                // Robust Matching
                                const found = searchedUsers.find(u => {
                                    if (payload.email && u.email && u.email.toLowerCase() === payload.email.toLowerCase()) return true;

                                    // Normalize phones: Strip all non-digits
                                    const uPhoneClean = u.phone ? u.phone.replace(/\D/g, '') : '';
                                    const inputPhoneClean = digitsOnly; // e.g. 919893224938

                                    // Check for exact match of digits
                                    if (uPhoneClean === inputPhoneClean) return true;

                                    // Check if one contains the other (risky but handles missing country code)
                                    // Only do this if lengths are reasonable (e.g. > 9 digits) to avoid partial matches on short numbers
                                    if (uPhoneClean.length > 9 && inputPhoneClean.length > 9) {
                                        if (uPhoneClean.includes(inputPhoneClean) || inputPhoneClean.includes(uPhoneClean)) return true;
                                    }

                                    return false;
                                });

                                if (found) {
                                    newUserId = found.id;
                                    console.log(`Found User ID via Auth List (Page ${page}, Scanned ${totalScanned}). (ID: ${newUserId})`);
                                    hasMore = false; // Stop searching
                                } else {
                                    // Check if we should continue
                                    if (searchedUsers.length < PER_PAGE_LIMIT) {
                                        hasMore = false;
                                    } else {
                                        page++;
                                    }
                                }
                            }

                            if (!newUserId) {
                                throw new Error(`User exists (conflict) but not found after scanning ${totalScanned} auth users. (Input: ${e164Phone})`);
                            }
                        }
                    } else {
                        throw createError;
                    }
                }

                if (!newUserId) throw new Error("Failed to generate User ID");

                // 2. Ensure public.app_users record exists (Critical for orphaned users)
                // This satisfies the profiles_user_id_fkey constraint
                const { error: appUserErr } = await supabaseClient
                    .from('app_users')
                    .upsert({
                        id: newUserId,
                        email: payload.email || null,
                        phone: e164Phone
                    });

                if (appUserErr) {
                    console.error("Failed to sync app_users:", appUserErr);
                    // We continue, but profile insert might fail if this failed.
                }

                // 3. Create Profile (if not exists)
                const { error: profileErr } = await supabaseClient
                    .from('profiles')
                    .upsert({
                        user_id: newUserId,
                        full_name: payload.name,
                        phone_number: e164Phone, // Use normalized phone
                        role: payload.role?.toLowerCase() || 'member',
                        gym_code: gymCode,
                        address: payload.address,
                        assigned_trainer_id: payload.assigned_trainer_id,
                        assigned_session: payload.assigned_session
                    });

                if (profileErr) throw profileErr;

                // 3. Add to Branch (BranchUser)
                let targetBranchId = branchId || branchUser.branch_id;

                if (!targetBranchId && branchUser.role === 'owner') {
                    const { data: b } = await supabaseClient.from('branches').select('id').eq('gym_code', gymCode).limit(1).single();
                    targetBranchId = b?.id;
                }

                if (!targetBranchId) throw new Error("Could not determine target branch for user.");

                const { error: buError } = await supabaseClient
                    .from('branch_users')
                    .insert({
                        branch_id: targetBranchId,
                        user_id: newUserId,
                        role: payload.role?.toLowerCase() || 'member',
                        status: 'active',
                        permissions: payload.permissions || []
                    });

                if (buError) {
                    if (!buError.message.includes('duplicate')) throw buError;
                }

                // 4. Create Subscription
                if (payload.plan_id || payload.pt_plan_id) {
                    await supabaseClient
                        .from('subscriptions')
                        .insert({
                            user_id: newUserId,
                            plan_id: payload.plan_id || null,
                            pt_plan_id: payload.pt_plan_id || null,
                            status: 'active'
                        });
                }

                // 5. Assign Trainer (Sync to trainer_clients)
                if (payload.assigned_trainer_id) {
                    const { error: tcError } = await supabaseClient
                        .from('trainer_clients')
                        .upsert({
                            trainer_id: payload.assigned_trainer_id,
                            client_id: newUserId,
                            status: 'Active', // Default status
                            gym_code: gymCode
                        });

                    if (tcError) console.error("Failed to assign trainer in trainer_clients:", tcError);
                }

                result = { success: true, userId: newUserId };
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
                        assigned_trainer_id: payload.assigned_trainer_id,
                        assigned_session: payload.assigned_session
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
                if (payload.assigned_session !== undefined) profileUpdates.assigned_session = payload.assigned_session;

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

                // 4. Sync Trainer Assignment to trainer_clients
                if (payload.assigned_trainer_id !== undefined) {
                    if (payload.assigned_trainer_id === null) {
                        await supabaseClient
                            .from('trainer_clients')
                            .delete()
                            .eq('client_id', payload.id)
                            .eq('gym_code', gymCode);
                    } else {
                        await supabaseClient
                            .from('trainer_clients')
                            .upsert({
                                trainer_id: payload.assigned_trainer_id,
                                client_id: payload.id,
                                status: 'Active',
                                gym_code: gymCode
                            });
                    }
                }
                break;

            case 'delete':
                if (!payload?.id) throw new Error("Missing user ID");

                // 1. Try deleting Invitation (Pending User)
                const { data: deletedInvite, error: delInviteError } = await supabaseClient
                    .from('invitations')
                    .delete()
                    .eq('id', payload.id) // pending user ID is int
                    .eq('gym_code', gymCode)
                    .select()
                    .maybeSingle();

                if (delInviteError) throw delInviteError;

                if (deletedInvite) {
                    result = { success: true, deleted: 'invitation' };
                    break;
                }

                // 2. If not invitation, Soft delete Active User (detach from Gym)
                // Note: payload.id for active user is UUID string
                const { data: deletedProfile, error: delProfileError } = await supabaseClient
                    .from('profiles')
                    .update({
                        gym_code: null,
                        age: null,
                        gender: null,
                        height: null,
                        weight: null,
                        fitness_level: null,
                        primary_goal: null,
                        goal: null,
                        body_measurements: null,
                        activity_level: null,
                        workout_days: null,
                        injuries: null,
                        medical_conditions: null,
                        workout_location: null,
                        training_style: null,
                        exercises_to_avoid: null,
                        experience_duration: null,
                        plan_type: null,
                        waist: null,
                        hip: null,
                        chest: null,
                        arms: null,
                        thighs: null
                    })
                    .eq('user_id', payload.id)
                    .eq('gym_code', gymCode)
                    .select()
                    .maybeSingle();

                if (delProfileError) throw delProfileError;

                // Also remove from branch_users to be thorough
                await supabaseClient
                    .from('branch_users')
                    .delete()
                    .eq('user_id', payload.id)
                    .in('branch_id', (
                        await supabaseClient
                            .from('branches')
                            .select('id')
                            .eq('gym_code', gymCode)
                    ).data?.map(b => b.id) || []
                    );

                // 4. Remove from trainer_clients
                await supabaseClient
                    .from('trainer_clients')
                    .delete()
                    .eq('client_id', payload.id)
                    .eq('gym_code', gymCode);

                result = deletedProfile;
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
