import { getAuth } from "firebase/auth";
import { API_BASE_URL } from "../config/supabaseConfig";

const getHeaders = async () => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
        throw new Error("User not authenticated");
    }

    const token = await user.getIdToken();
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
};

export const api = {
    // Auth
    authVerify: async (token) => {
        console.log("Verify Token called with:", token ? token.substring(0, 10) + "..." : "null");
        try {
            // We pass token explicitly comfortably or derive it again if needed.
            // The endpoint expects { "token": "..." } in body
            const response = await fetch(`${API_BASE_URL}/auth-verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token })
            });

            const text = await response.text();
            console.log("Auth Verify Raw Response:", text);

            if (!response.ok) {
                console.error("Auth Verify Error Status:", response.status);
                throw new Error('Auth verification failed: ' + text);
            }
            return JSON.parse(text);
        } catch (error) {
            console.error("Auth Exception:", error);
            throw error;
        }
    },

    // Profiles
    getProfile: async () => {
        const headers = await getHeaders();
        const response = await fetch(`${API_BASE_URL}/profiles/get`, {
            method: 'GET',
            headers
        });
        if (!response.ok) throw new Error('Failed to fetch profile');

        const data = await response.json();

        // Transform snake_case to camelCase for the frontend
        const toCamelCase = (str) => str.replace(/_([a-z])/g, (g) => g[1].toUpperCase());

        const transformedData = {};
        Object.keys(data).forEach(key => {
            const camelKey = toCamelCase(key);
            transformedData[camelKey] = data[key];
        });

        // Specific Mapping fixes
        if (transformedData.goal) transformedData.primaryGoal = transformedData.goal;

        console.log("API: getProfile (Self) result:", transformedData);
        return transformedData;
    },

    updateProfile: async (data) => {
        const headers = await getHeaders();
        const auth = getAuth();
        const user = auth.currentUser;

        console.log("Updating Profile (Raw):", data);

        // Convert camelCase keys to snake_case for Supabase
        const toSnakeCase = (str) => str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);

        const dbData = {};
        Object.keys(data).forEach(key => {
            // Handle specific overrides
            if (key === 'primaryGoal') {
                dbData['goal'] = data[key];
            } else {
                dbData[toSnakeCase(key)] = data[key];
            }
        });

        // 1. Standardize Name: Ensure both 'name' and 'full_name' are populated
        if (dbData.name && !dbData.full_name) {
            dbData.full_name = dbData.name;
        } else if (dbData.full_name && !dbData.name) {
            dbData.name = dbData.full_name;
        }

        // 2. Capture Phone Number from Auth if not provided
        if (!dbData.phone_number && user && user.phoneNumber) {
            dbData.phone_number = user.phoneNumber;
        }

        console.log("Updating Profile (SnakeCase):", dbData);

        const response = await fetch(`${API_BASE_URL}/profiles/update`, {
            method: 'POST', // or PUT depending on implementation
            headers,
            body: JSON.stringify(dbData)
        });

        const text = await response.text();
        console.log("Update Profile Response:", text);

        if (!response.ok) {
            console.error("Update Profile Error Status:", response.status);
            throw new Error('Failed to update profile: ' + text);
        }
        return JSON.parse(text);
    },

    // Workouts
    getWorkouts: async () => {
        const headers = await getHeaders();
        const response = await fetch(`${API_BASE_URL}/workouts/list`, {
            method: 'GET',
            headers
        });
        if (!response.ok) throw new Error('Failed to fetch workouts');
        return response.json();
    },

    getWorkoutDetail: async (id) => {
        const headers = await getHeaders();
        const response = await fetch(`${API_BASE_URL}/workouts/list?id=${id}`, {
            method: 'GET',
            headers
        });
        if (!response.ok) throw new Error('Failed to fetch workout details');
        return response.json();
    },

    createWorkout: async (workoutData) => {
        const headers = await getHeaders();
        const response = await fetch(`${API_BASE_URL}/workouts/create`, {
            method: 'POST',
            headers,
            body: JSON.stringify(workoutData)
        });
        if (!response.ok) throw new Error('Failed to create workout');
        return response.json();
    },

    // Sessions
    startSession: async (workoutId) => {
        const headers = await getHeaders();
        const response = await fetch(`${API_BASE_URL}/sessions/start`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ workout_id: workoutId })
        });
        if (!response.ok) throw new Error('Failed to start session');
        return response.json();
    },

    async getProfileById(userId) {
        const headers = await getHeaders();
        const response = await fetch(`${API_BASE_URL}/profiles/get?userId=${userId}`, {
            method: 'GET',
            headers
        });
        if (!response.ok) throw new Error('Failed to fetch profile');
        const data = await response.json();

        // Reuse transformation logic locally for now
        const toCamelCase = (str) => str.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
        const transformedData = {};
        Object.keys(data).forEach(key => {
            const camelKey = toCamelCase(key);
            transformedData[camelKey] = data[key];
        });

        // Ensure name fallback
        if (!transformedData.name && transformedData.fullName) {
            transformedData.name = transformedData.fullName;
        }

        return transformedData;
    },

    // Media
    getUploadUrl: async (bucket, fileName, fileType) => {
        const headers = await getHeaders();
        const response = await fetch(`${API_BASE_URL}/media/presign`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ bucket, fileName, fileType })
        });
        if (!response.ok) throw new Error('Failed to get upload URL');
        return response.json();
    },

    completeUpload: async (data) => {
        const headers = await getHeaders();
        const response = await fetch(`${API_BASE_URL}/media/complete`, {
            method: 'POST',
            headers,
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Failed to complete upload');
        return response.json();
    },
    // Trainer - Client Management
    getClients: async () => {
        const headers = await getHeaders();
        // This functionality might ideally need a custom Edge Function to join tables easily,
        // or we can just fetch from 'trainer_clients' and then fetch profiles.
        // For simplicity/performance, let's assume we create a 'trainer/clients' function or query directly.
        // Let's try querying the table directly via standard REST if we exposed it, but we blocked auto-exposure?
        // Actually, we haven't exposed tables via PostgREST in this architecture explicitly, we rely on Functions often?
        // Wait, 'profiles/get' is a function. 'workouts/list' is a function.
        // So we should probably create a 'trainer/clients' function or similar.
        // OR we can just use the supabase client directly in the frontend if we installed it?
        // But we are using raw fetch here.
        // Let's assume we use a new function `clients` similar to others.

        // However, Step 1 is to just allow fetching.
        // Let's create `clients/list` function?
        // For now, let's call a new endpoint: `${API_BASE_URL}/clients/list`

        const response = await fetch(`${API_BASE_URL}/clients/list`, {
            method: 'GET',
            headers
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Clients API Error:", response.status, errorText);
            console.warn("Clients API not ready or failed, returning empty list");
            return [];
        }
        return response.json();
    },

    inviteClient: async (email) => {
        const headers = await getHeaders();
        const response = await fetch(`${API_BASE_URL}/clients/invite`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ email })
        });
        if (!response.ok) throw new Error('Failed to invite client');
        return response.json();
    },

    // Workout Assignments
    assignWorkout: async (trainerId, clientId, workoutId) => {
        const headers = await getHeaders();
        // Assuming we will create a dedicated endpoint for this or reuse a generic function
        // For MVP, we likely need a new Edge Function 'workouts/assign'
        const response = await fetch(`${API_BASE_URL}/workouts/assign`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ trainer_id: trainerId, client_id: clientId, workout_id: workoutId })
        });
        if (!response.ok) throw new Error('Failed to assign workout');
        return response.json();
    },

    getAssignedWorkouts: async (clientId) => {
        const headers = await getHeaders();
        const response = await fetch(`${API_BASE_URL}/workouts/assigned?client_id=${clientId}`, {
            method: 'GET',
            headers
        });
        if (!response.ok) throw new Error('Failed to fetch assigned workouts');
        return response.json();
    },

    getTrainerWorkouts: async (trainerId) => {
        // Re-uses generic list but filters by trainer? 
        // Actually standard list usually filters by "my workouts".
        // If called as a trainer, getWorkouts() should return their created workouts.
        return api.getWorkouts();
    },

    // Messaging
    sendMessage: async (receiverId, content) => {
        const headers = await getHeaders();
        const response = await fetch(`${API_BASE_URL}/messages/send`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ receiverId, content })
        });
        if (!response.ok) throw new Error('Failed to send message');
        return response.json();
    },

    getMessages: async (targetUserId) => {
        const headers = await getHeaders();
        const response = await fetch(`${API_BASE_URL}/messages/list?userId=${targetUserId}`, {
            method: 'GET',
            headers
        });
        if (!response.ok) throw new Error('Failed to fetch messages');
        return response.json();
    }
};
