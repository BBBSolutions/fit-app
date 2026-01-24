import { supabase } from "../config/supabaseAuth";
import { API_BASE_URL, SUPABASE_ANON_KEY } from "../config/supabaseConfig";

const getHeaders = async () => {
    // Get Supabase session token
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
    getDashboardStats: async () => {
        const headers = await getHeaders();

        const response = await fetch(`${API_BASE_URL}/admin-dashboard-stats`, {
            method: 'POST',
            headers,
            body: JSON.stringify({})
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Admin Stats Error:", response.status, errorText);
            throw new Error('Failed to fetch admin stats');
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
    getUsers: async () => {
        return adminApi._post('admin-users', { action: 'fetch' });
    },
    createUser: async (user) => {
        return adminApi._post('admin-users', { action: 'create', payload: user });
    },
    bulkCreateUsers: async (users) => {
        return adminApi._post('admin-users', { action: 'bulk_create', payload: { users } });
    },

    // BRANDING
    fetchBranding: async () => {
        return adminApi._post('admin-branding', { action: 'fetch' });
    },
    updateBranding: async (data) => {
        return adminApi._post('admin-branding', { action: 'update', payload: data });
    },
    updateUser: async (user) => {
        return adminApi._post('admin-users', { action: 'update', payload: user });
    },
    deleteUser: async (id) => {
        return adminApi._post('admin-users', { action: 'delete', payload: { id } });
    },

    // LEADS
    getLeads: async () => {
        return adminApi._post('admin-leads', { action: 'fetch' });
    },
    createLead: async (lead) => {
        return adminApi._post('admin-leads', { action: 'create', payload: lead });
    },
    updateLead: async (lead) => {
        return adminApi._post('admin-leads', { action: 'update', payload: lead });
    },
    deleteLead: async (id) => {
        return adminApi._post('admin-leads', { action: 'delete', payload: { id } });
    },
    fetchLeadLogs: async (leadId) => {
        return adminApi._post('admin-leads', { action: 'fetch_logs', payload: { lead_id: leadId } });
    },
    addLeadLog: async (log) => {
        return adminApi._post('admin-leads', { action: 'add_log', payload: log });
    },

    // CONTENT
    getContent: async () => {
        return adminApi._post('admin-content', { action: 'fetch' });
    },
    createContent: async (content) => {
        return adminApi._post('admin-content', { action: 'create', payload: content });
    },
    updateContent: async (content) => {
        return adminApi._post('admin-content', { action: 'update', payload: content });
    },
    deleteContent: async (id) => {
        return adminApi._post('admin-content', { action: 'delete', payload: { id } });
    },

    // BILLING
    getPlans: async () => {
        return adminApi._post('admin-billing', { action: 'fetch_plans' });
    },
    createPlan: async (plan) => {
        return adminApi._post('admin-billing', { action: 'create_plan', payload: plan });
    },
    updatePlan: async (plan) => {
        return adminApi._post('admin-billing', { action: 'update_plan', payload: plan });
    },
    deletePlan: async (id) => {
        return adminApi._post('admin-billing', { action: 'delete_plan', payload: { id } });
    },
    getBillingOverview: async () => {
        return adminApi._post('admin-billing', { action: 'fetch_billing_overview' });
    },

    // ANALYTICS
    getAnalytics: async () => {
        return adminApi._post('admin-get-analytics', {});
    }
};

export { supabase };
