import { getAuth } from "firebase/auth";
import { API_BASE_URL, SUPABASE_ANON_KEY } from "../config/supabaseConfig";

const getHeaders = async () => {
    // For Supabase Functions, we must use the Anon Key or a valid Supabase JWT in the Authorization header.
    // Sending the Firebase token here causes a 401 "Invalid JWT" from the Supabase Gateway.
    // We pass the Firebase token in a custom header if verification is needed securely.

    // For this implementation, we use Anon Key to pass the gateway.
    return {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
    };
};

export const adminApi = {
    getDashboardStats: async () => {
        const headers = await getHeaders();
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) throw new Error("User not authenticated");
        const token = await user.getIdToken();

        const response = await fetch(`${API_BASE_URL}/admin-dashboard-stats`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ token })
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
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) throw new Error("User not authenticated");
        const token = await user.getIdToken();

        const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ token, ...body })
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
