import { supabase } from "../config/supabaseAuth";
import { API_BASE_URL, SUPABASE_ANON_KEY } from "../config/supabaseConfig";
import AsyncStorage from '@react-native-async-storage/async-storage';

const CUSTOM_TOKEN_KEY = 'fitapp_custom_jwt';

// Returns true if a JWT token string is expired
const isTokenExpired = (token) => {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (!payload.exp) return false;
        // Add a 30-second buffer to avoid edge cases
        return Date.now() >= (payload.exp - 30) * 1000;
    } catch (e) {
        return true; // Treat unparseable tokens as expired
    }
};

const getHeaders = async () => {
    // 1. Try Custom JWT first (MVP Auth)
    const customToken = await AsyncStorage.getItem(CUSTOM_TOKEN_KEY);
    if (customToken) {
        if (isTokenExpired(customToken)) {
            console.warn('Custom JWT expired, clearing stored token.');
            await AsyncStorage.removeItem(CUSTOM_TOKEN_KEY);
            // Fall through to Supabase session below
        } else {
            return {
                'Authorization': `Bearer ${customToken}`,
                'Content-Type': 'application/json'
            };
        }
    }

    // 2. Fallback to Supabase Auth (Legacy/Future)
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        throw new Error("User not authenticated");
    }

    return {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
    };
};


export const api = {
    // Gym Code Verification
    verifyGymCode: async (gymCode) => {
        try {
            const { data, error } = await supabase.rpc('is_valid_gym_code', { p_gym_code: gymCode });
            if (error) {
                console.error("verifyGymCode RPC error:", error.message);
                return false;
            }
            return !!data;
        } catch (error) {
            console.error("verifyGymCode exception:", error);
            return false;
        }
    },

    // Auth
    authVerify: async (token) => {
        console.log("Verify Token called with:", token ? token.substring(0, 10) + "..." : "null");
        try {
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
        if (response.status === 404) {
            console.warn("getProfile: Profile not found (404). User might need to onboard.");
            return null;
        }

        if (!response.ok) {
            const errText = await response.text();
            console.error("getProfile Failed. Status:", response.status, "Error:", errText);
            throw new Error('Failed to fetch profile: ' + errText);
        }

        const data = await response.json();
        const toCamelCase = (str) => str.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
        const transformedData = {};
        Object.keys(data).forEach(key => {
            const camelKey = toCamelCase(key);
            transformedData[camelKey] = data[key];
        });
        if (transformedData.goal) transformedData.primaryGoal = transformedData.goal;
        if (!transformedData.name && transformedData.fullName) {
            transformedData.name = transformedData.fullName;
        }
        console.log("API: getProfile (Self) result:", transformedData);
        return transformedData;
    },

    savePushToken: async (token) => {
        const headers = await getHeaders();
        const response = await fetch(`${API_BASE_URL}/profiles/push-token`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ token })
        });
        if (!response.ok) {
            const errorText = await response.text();
            console.error("Backend Error:", response.status, errorText);
            throw new Error(`Failed to save push token: ${response.status} - ${errorText}`);
        }
        return response.json();
    },

    updateProfile: async (data) => {
        const headers = await getHeaders();
        console.log("Updating Profile (Raw):", data);
        const toSnakeCase = (str) => str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        const dbData = {};
        Object.keys(data).forEach(key => {
            if (key === 'primaryGoal') {
                dbData['goal'] = data[key];
            } else {
                dbData[toSnakeCase(key)] = data[key];
            }
        });
        if (dbData.name && !dbData.full_name) {
            dbData.full_name = dbData.name;
        } else if (dbData.full_name && !dbData.name) {
            dbData.name = dbData.full_name;
        }
        console.log("Updating Profile (SnakeCase):", dbData);
        const response = await fetch(`${API_BASE_URL}/profiles/update`, {
            method: 'POST',
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
        const toCamelCase = (str) => str.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
        const transformedData = {};
        Object.keys(data).forEach(key => {
            const camelKey = toCamelCase(key);
            transformedData[camelKey] = data[key];
        });
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
        if (!response.ok) {
            const text = await response.text();
            console.error("Presign error:", response.status, text);
            throw new Error(`Failed to get upload URL: ${text}`);
        }
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
        return api.getWorkouts();
    },

    deleteWorkoutAssignment: async (assignmentId) => {
        const headers = await getHeaders();
        const response = await fetch(`${API_BASE_URL}/workouts/assignment?id=${assignmentId}`, {
            method: 'DELETE',
            headers
        });
        if (!response.ok) throw new Error('Failed to delete workout assignment');
        return response.json();
    },

    logWorkoutSet: async (logData) => {
        const headers = await getHeaders();
        console.log("API: logWorkoutSet Payload:", logData);

        // Pass ID here if possible, to see if backend supports upsert on POST
        // But for now, standard POST
        const response = await fetch(`${API_BASE_URL}/workouts/log-set`, {
            method: 'POST',
            headers,
            body: JSON.stringify(logData)
        });
        if (!response.ok) {
            const text = await response.text();
            console.error("API: logWorkoutSet Failed:", text);
            throw new Error('Failed to log set');
        }
        return response.json();
    },

    deleteWorkoutLog: async (logId) => {
        console.log("API: deleteWorkoutLog called for ID:", logId);
        const headers = await getHeaders();
        // Updated to match backend 'log-set' endpoint
        const response = await fetch(`${API_BASE_URL}/workouts/log-set?id=${logId}`, {
            method: 'DELETE',
            headers
        });

        if (!response.ok) {
            const text = await response.text();
            console.error("API: deleteWorkoutLog Failed. Status:", response.status, "Response:", text);
            throw new Error('Failed to delete workout log: ' + text);
        }
        return response.json();
    },

    getWorkoutLogs: async (assignmentId) => {
        const headers = await getHeaders();
        const response = await fetch(`${API_BASE_URL}/workouts/logs?assignment_id=${assignmentId}`, {
            method: 'GET',
            headers
        });
        if (!response.ok) throw new Error('Failed to fetch workout logs');
        return response.json();
    },

    getExerciseHistory: async (exerciseId, assignmentId, exerciseName) => {
        const headers = await getHeaders();
        let url = `${API_BASE_URL}/workouts/history?`;

        // Build Params
        const params = new URLSearchParams();
        if (exerciseId && exerciseId.length > 5) params.append('exercise_id', exerciseId);
        if (exerciseName) params.append('exercise_name', exerciseName);
        if (assignmentId) params.append('exclude_assignment_id', assignmentId);

        url += params.toString();

        console.log("[API] getExerciseHistory calling URL:", url);

        const response = await fetch(url, {
            method: 'GET',
            headers
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error("getExerciseHistory failed. Status:", response.status, "Error:", errText);
            throw new Error('Failed to fetch exercise history: ' + errText);
        }
        return response.json();
    },

    updateWorkout: async (workoutId, data) => {
        const headers = await getHeaders();
        const response = await fetch(`${API_BASE_URL}/workouts?id=${workoutId}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Failed to update workout');
        return response.json();
    },

    createCustomWorkout: async (workoutData) => {
        const headers = await getHeaders();
        const response = await fetch(`${API_BASE_URL}/workouts/create-custom`, {
            method: 'POST',
            headers,
            body: JSON.stringify(workoutData)
        });
        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || 'Failed to create custom workout');
        }
        return response.json();
    },

    completeWorkout: async (assignmentId) => {
        const headers = await getHeaders();
        const response = await fetch(`${API_BASE_URL}/workouts/complete`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ assignmentId })
        });
        if (!response.ok) throw new Error('Failed to complete workout');
        return response.json();
    },

    // Messaging
    sendMessage: async (receiverId, content) => {
        console.log("sending message to:", receiverId, "content:", content);
        const headers = await getHeaders();
        const response = await fetch(`${API_BASE_URL}/messages/send`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ receiverId, content })
        });

        console.log("SendMessage Response Status:", response.status);
        if (!response.ok) {
            const errText = await response.text();
            console.error("SendMessage Error Body:", errText);
            throw new Error('Failed to send message: ' + errText);
        }

        const data = await response.json();
        console.log("SendMessage Success Data:", data);
        return data;
    },

    getMessages: async (targetUserId) => {
        const headers = await getHeaders();
        const response = await fetch(`${API_BASE_URL}/messages/list?userId=${targetUserId}&_t=${Date.now()}`, {
            method: 'GET',
            headers
        });
        if (!response.ok) throw new Error('Failed to fetch messages');
        return response.json();
    },

    markMessagesRead: async (senderId) => {
        const headers = await getHeaders();
        const response = await fetch(`${API_BASE_URL}/messages/mark-read`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ senderId })
        });
        if (!response.ok) throw new Error('Failed to mark messages as read');
        return response.json();
    },

    getChatThreads: async () => {
        const headers = await getHeaders();
        const response = await fetch(`${API_BASE_URL}/messages/threads?_t=${Date.now()}`, {
            method: 'GET',
            headers
        });
        if (!response.ok) {
            console.warn("Failed to fetch chat threads. Endpoint might be missing.");
            return [];
        }
        return response.json();
    },

    getUnreadCount: async () => {
        const headers = await getHeaders();
        const response = await fetch(`${API_BASE_URL}/messages/unread-count?_t=${Date.now()}`, {
            method: 'GET',
            headers
        });
        if (!response.ok) throw new Error('Failed to fetch unread count');
        return response.json();
    },

    // Diet Logging
    saveDietLog: async (date, dietData) => {
        const headers = await getHeaders();
        const response = await fetch(`${API_BASE_URL}/diet/log`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ date, ...dietData })
        });
        if (!response.ok) throw new Error('Failed to save diet log');
        return response.json();
    },

    getDietLog: async (date) => {
        const headers = await getHeaders();
        const response = await fetch(`${API_BASE_URL}/diet/log?date=${date}`, {
            method: 'GET',
            headers
        });
        if (response.status === 404) {
            return null; // No log for this day
        }
        if (!response.ok) throw new Error('Failed to fetch diet log');
        return response.json();
    },
    // Measurement / Progress Tracking
    getMeasurementHistory: async (type, startDate, endDate, userId = null) => {
        const headers = await getHeaders();
        let url = `${API_BASE_URL}/measurement_logs?type_filter=${type}&start_date=${startDate}&end_date=${endDate}`;
        if (userId) {
            url += `&user_id=${userId}`; // Backend support needed, or use 'target_user_id' convention if consistent
        }

        const response = await fetch(url, {
            method: 'GET',
            headers
        });
        if (!response.ok) {
            const errText = await response.text();
            console.error("Fetch Data Error:", response.status, errText);
            throw new Error('Failed to fetch measurement history: ' + errText);
        }
        const text = await response.text();
        try {
            return JSON.parse(text);
        } catch (e) {
            console.error("Failed to parse measurement response:", text);
            throw new Error("Invalid format from server: " + text.substring(0, 100));
        }
    },

    logMeasurement: async (date, type, value) => {
        const headers = await getHeaders();
        const response = await fetch(`${API_BASE_URL}/measurement_logs`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ date, type, value })
        });
        if (!response.ok) throw new Error('Failed to log measurement');
        return response.json();
    },

    getWorkoutStats: async (startDate, endDate, userId = null) => {
        const headers = await getHeaders();
        let url = `${API_BASE_URL}/sessions?start_date=${startDate}&end_date=${endDate}`;
        if (userId) {
            url += `&user_id=${userId}`;
        }
        const response = await fetch(url, {
            method: 'GET',
            headers
        });
        if (!response.ok) throw new Error('Failed to fetch workout stats');
        return response.json();
    },

    getPersonalRecords: async (userId = null) => {
        const headers = await getHeaders();
        let url = `${API_BASE_URL}/workouts/prs`;
        if (userId) {
            url += `?user_id=${userId}`;
        }
        const response = await fetch(url, {
            method: 'GET',
            headers
        });
        if (!response.ok) throw new Error('Failed to fetch PRs');
        return response.json();
    },

    getExercises: async (query = '') => {
        const headers = await getHeaders();
        const url = query
            ? `${API_BASE_URL}/exercises?q=${encodeURIComponent(query)}`
            : `${API_BASE_URL}/exercises`;

        const response = await fetch(url, {
            method: 'GET',
            headers
        });
        if (!response.ok) throw new Error('Failed to fetch exercises');
        return response.json();
    },

    // Custom Auth Helpers
    setCustomToken: async (token) => {
        await AsyncStorage.setItem(CUSTOM_TOKEN_KEY, token);
    },
    removeCustomToken: async () => {
        await AsyncStorage.removeItem(CUSTOM_TOKEN_KEY);
    },
    sendMsg91OTP: async (phone) => {
        const headers = {
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
        };
        // UPDATED: Now calling send-whatsapp-otp
        const response = await fetch(`${API_BASE_URL}/send-whatsapp-otp`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ phone })
        });

        if (!response.ok) {
            const txt = await response.text();
            let errorMessage = txt;
            try {
                const errObj = JSON.parse(txt);
                if (errObj.error) errorMessage = errObj.error;
            } catch (e) { }
            throw new Error(errorMessage || 'Failed to send WhatsApp OTP');
        }
        return response.json();
    },

    // Trainer Schedule
    getTrainerSchedule: async (date) => {
        const headers = await getHeaders();
        const dateStr = date ? date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
        const response = await fetch(`${API_BASE_URL}/trainer-schedule?date=${dateStr}`, {
            method: 'GET',
            headers
        });
        if (!response.ok) {
            const errorText = await response.text();
            console.error("Trainer Schedule Error:", response.status, errorText);
            return [];
        }
        return response.json();
    },

    createScheduledSession: async (sessionData) => {
        const headers = await getHeaders();
        const response = await fetch(`${API_BASE_URL}/trainer-schedule`, {
            method: 'POST',
            headers,
            body: JSON.stringify(sessionData)
        });
        if (!response.ok) {
            const errorText = await response.text();
            console.error("Create Schedule Error:", response.status, errorText);
            throw new Error('Failed to create scheduled session');
        }
        return response.json();
    },

    updateScheduledSession: async (sessionId, updates) => {
        const headers = await getHeaders();
        const response = await fetch(`${API_BASE_URL}/trainer-schedule?id=${sessionId}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify(updates)
        });
        if (!response.ok) throw new Error('Failed to update scheduled session');
        return response.json();
    },

    deleteScheduledSession: async (sessionId) => {
        const headers = await getHeaders();
        const response = await fetch(`${API_BASE_URL}/trainer-schedule?id=${sessionId}`, {
            method: 'DELETE',
            headers
        });
        if (!response.ok) throw new Error('Failed to delete scheduled session');
        return response.json();
    },

    verifyMsg91Token: async (phone, authToken, widgetId, expires) => {
        // Unauthenticated call, so we MANUALLY create headers
        const headers = {
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
        };

        const response = await fetch(`${API_BASE_URL}/verify-otp-msg91`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ phone, authToken, widgetId, expires })
        });

        if (!response.ok) {
            const errText = await response.text();
            let errorMessage = errText;
            try {
                const errObj = JSON.parse(errText);
                if (errObj.error) errorMessage = errObj.error;
            } catch (e) { }
            throw new Error(errorMessage || 'OTP Verification Failed');
        }
        return response.json();
    }
};
