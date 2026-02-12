import { supabase } from "../config/supabaseAuth";
import { API_BASE_URL, SUPABASE_ANON_KEY } from "../config/supabaseConfig";
import AsyncStorage from '@react-native-async-storage/async-storage';

const CUSTOM_TOKEN_KEY = 'fitapp_custom_jwt';

const getHeaders = async () => {
    // 1. Try Custom JWT first (MVP Auth)
    const customToken = await AsyncStorage.getItem(CUSTOM_TOKEN_KEY);
    if (customToken) {
        return {
            'Authorization': `Bearer ${customToken}`,
            'Content-Type': 'application/json'
        };
    }

    // 2. Fallback to Supabase Session
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        throw new Error("User not authenticated");
    }

    return {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
    };
};

export const adminApi = {
    getDashboardStats: async (branchId) => {
        const headers = await getHeaders();

        const response = await fetch(`${API_BASE_URL}/admin-dashboard-stats`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ branchId })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Admin Stats Error:", response.status, errorText);
            throw new Error('Failed to fetch admin stats');
        }

        return response.json();
    },

    getAggregatedStats: async () => {
        const headers = await getHeaders();

        const response = await fetch(`${API_BASE_URL}/admin-dashboard-stats`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ allBranches: true })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Admin Aggregated Stats Error:", response.status, errorText);
            throw new Error('Failed to fetch aggregated admin stats');
        }

        return response.json();
    },

    getBranches: async () => {
        const headers = await getHeaders();
        const response = await fetch(`${API_BASE_URL}/admin-branches`, {
            method: 'GET', // Changed to GET usually, but strict mode might want POST if Edge Function expects body. serve(req) -> req.json() implies POST/PUT Usually. But my code uses req.method check? 
            // My admin-branches code: serve(async (req) ... doesn't check method for logic, but usually GET is better for fetching.
            // However, `req.json()` fails on GET requests in Deno/Node if body is empty? 
            // Let's stick to POST for consistency with other functions if they use req.json().
            // admin-branches code: `const { ... } = await req.json()` IS NOT USED! I didn't verify that.
            // I looked at my writen code:
            // serve(async (req) => { ... const { data: { user } } = ... }
            // I DO NOT call `req.json()` in admin-branches!
            // So GET is fine.
            method: 'POST', // sticking to POST for now to avoid any OPTIONS/Body weirdness with Supabase functions sometimes.
            headers,
            body: JSON.stringify({})
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Fetch Branches Error:", response.status, errorText);
            throw new Error('Failed to fetch branches');
        }
        return response.json();
    },

    updateBranch: async (branchId, updates) => {
        const headers = await getHeaders();
        const response = await fetch(`${API_BASE_URL}/admin-branches`, {
            method: 'PUT',
            headers,
            body: JSON.stringify({ branchId, updates })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Failed to update branch');
        }
        return response.json();
    },

    deleteBranch: async (branchId) => {
        const headers = await getHeaders();
        const response = await fetch(`${API_BASE_URL}/admin-branches`, {
            method: 'DELETE',
            headers,
            body: JSON.stringify({ branchId })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Failed to delete branch');
        }
        return response.json();
    },

    signupGymOwner: async (details) => {
        const headers = await getHeaders();
        const response = await fetch(`${API_BASE_URL}/signup-gym-owner`, {
            method: 'POST',
            headers,
            body: JSON.stringify(details)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Signup Gym Owner Error:", response.status, errorText);
            throw new Error('Failed to register gym');
        }

        return response.json();
    },

    createOwner: async (details) => {
        // This is an unauthed call for signup
        const headers = {
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
        };

        const response = await fetch(`${API_BASE_URL}/create-owner`, {
            method: 'POST',
            headers,
            body: JSON.stringify(details)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Failed to create owner profile');
        }
        return response.json();
    },

    createBranch: async (details) => {
        const headers = await getHeaders();
        const response = await fetch(`${API_BASE_URL}/create-branch`, {
            method: 'POST',
            headers,
            body: JSON.stringify(details)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Failed to create branch');
        }
        return response.json();
    },

    joinBranch: async (gymCode, role = 'member') => {
        const headers = await getHeaders();
        const response = await fetch(`${API_BASE_URL}/join-branch`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ gymCode, role })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Failed to join gym');
        }
        return response.json();
    },

    async _post(endpoint, body) {
        const headers = await getHeaders();

        const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
            method: 'POST',
            headers,
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`${endpoint} Error:`, response.status, errorText);
            throw new Error(`Failed to request ${endpoint}`);
        }

        return response.json();
    },

    // USERS
    getUsers: async (branchId) => {
        return adminApi._post('admin-users', { action: 'fetch', branchId });
    },
    createUser: async (user, branchId) => {
        return adminApi._post('admin-users', { action: 'create', payload: user, branchId });
    },
    bulkCreateUsers: async (users, branchId) => {
        return adminApi._post('admin-users', { action: 'bulk_create', payload: { users }, branchId });
    },

    // BRANDING
    fetchBranding: async (branchId) => {
        return adminApi._post('admin-branding', { action: 'fetch', branchId });
    },
    updateBranding: async (data, branchId) => {
        return adminApi._post('admin-branding', { action: 'update', payload: data, branchId });
    },
    updateUser: async (user, branchId) => {
        return adminApi._post('admin-users', { action: 'update', payload: user, branchId });
    },
    deleteUser: async (id, branchId) => {
        return adminApi._post('admin-users', { action: 'delete', payload: { id }, branchId });
    },

    // LEADS
    getLeads: async (branchId) => {
        return adminApi._post('admin-leads', { action: 'fetch', branchId });
    },
    createLead: async (lead, branchId) => {
        return adminApi._post('admin-leads', { action: 'create', payload: lead, branchId });
    },
    updateLead: async (lead, branchId) => {
        return adminApi._post('admin-leads', { action: 'update', payload: lead, branchId });
    },
    deleteLead: async (id, branchId) => {
        return adminApi._post('admin-leads', { action: 'delete', payload: { id }, branchId });
    },
    fetchLeadLogs: async (leadId, branchId) => {
        return adminApi._post('admin-leads', { action: 'fetch_logs', payload: { lead_id: leadId }, branchId });
    },
    addLeadLog: async (log, branchId) => {
        return adminApi._post('admin-leads', { action: 'add_log', payload: log, branchId });
    },

    // CONTENT
    getContent: async (branchId) => {
        return adminApi._post('admin-content', { action: 'fetch', branchId });
    },
    createContent: async (content, branchId) => {
        return adminApi._post('admin-content', { action: 'create', payload: content, branchId });
    },
    updateContent: async (content, branchId) => {
        return adminApi._post('admin-content', { action: 'update', payload: content, branchId });
    },
    deleteContent: async (id, branchId) => {
        return adminApi._post('admin-content', { action: 'delete', payload: { id }, branchId });
    },

    // BILLING
    getPlans: async (branchId) => {
        return adminApi._post('admin-billing', { action: 'fetch_plans', branchId });
    },
    createPlan: async (plan, branchId) => {
        return adminApi._post('admin-billing', { action: 'create_plan', payload: plan, branchId });
    },
    updatePlan: async (plan, branchId) => {
        return adminApi._post('admin-billing', { action: 'update_plan', payload: plan, branchId });
    },
    deletePlan: async (id, branchId) => {
        return adminApi._post('admin-billing', { action: 'delete_plan', payload: { id }, branchId });
    },
    getBillingOverview: async (branchId) => {
        return adminApi._post('admin-billing', { action: 'fetch_billing_overview', branchId });
    },

    // ANALYTICS
    getAnalytics: async (range, branchId) => {
        return adminApi._post('admin-get-analytics', { branchId, range }); // Assuming backend can handle range too if needed in future
    }
};

export { supabase };
