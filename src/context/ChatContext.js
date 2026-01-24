import React, { createContext, useState, useEffect, useContext } from 'react';
import { AppState } from 'react-native';
import { supabase as supabaseClient } from '../services/supabaseClient';
import { supabase } from '../config/supabaseAuth';
import { api } from '../services/api';

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
    const [unreadCount, setUnreadCount] = useState(0);
    const [currentUserId, setCurrentUserId] = useState(null);

    const fetchUnreadCount = async () => {
        try {
            // Check Supabase session
            const { data: { session } } = await supabase.auth.getSession();

            // If no session, reset and return
            if (!session) {
                setUnreadCount(0);
                setCurrentUserId(null);
                return;
            }

            // We need our internal DB ID, not just Firebase UID
            // Accessing profile via existing API to simulate "me" call if needed, 
            // or we can query Supabase if public read is allowed on app_users (unlikely)
            // Let's use the profile API to get our ID.
            const profile = await api.getProfile();
            if (profile && profile.userId) {
                if (currentUserId !== profile.userId) {
                    setCurrentUserId(profile.userId);
                }

                // Use Authenticated API instead of direct Supabase query (to bypass RLS issues with Anon client)
                const data = await api.getUnreadCount();
                setUnreadCount(data.count || 0);

                // Fallback / Verification log
                // console.log("Unread Count updated via API");
            } else {
                console.log("ChatContext: No valid profile or userId found.");
            }
        } catch (e) {
            console.log("Failed to fetch unread count:", e);
        }
    };

    useEffect(() => {
        // Listen to Supabase auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            console.log("ChatContext: Auth State Changed:", session ? "Logged In" : "Logged Out");
            fetchUnreadCount();
        });

        fetchUnreadCount();

        // Refresh on App foreground
        const appStateSubscription = AppState.addEventListener('change', nextAppState => {
            if (nextAppState === 'active') {
                fetchUnreadCount();
            }
        });

        // Realtime Subscription
        const channel = supabase
            .channel('public:messages')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'messages' },
                (payload) => {
                    // Optimization: Check if msg is for me if possible. 
                    // Payload.new has the row. 
                    if (currentUserId && payload.new.receiver_id === currentUserId) {
                        setUnreadCount(prev => prev + 1);
                    } else {
                        // Fallback re-fetch
                        fetchUnreadCount();
                    }
                }
            )
            .subscribe();

        return () => {
            appStateSubscription.remove();
            supabaseClient.removeChannel(channel);
            if (subscription) subscription.unsubscribe();
        };
    }, [currentUserId]);

    const markAsRead = async (senderId) => {
        try {
            // 1. Optimistic / API call
            await api.markMessagesRead(senderId);

            // 2. Re-fetch count to be accurate
            fetchUnreadCount();
        } catch (error) {
            console.error("Error marking messages as read:", error);
        }
    };

    return (
        <ChatContext.Provider value={{ unreadCount, fetchUnreadCount, markAsRead }}>
            {children}
        </ChatContext.Provider>
    );
};

export const useChat = () => useContext(ChatContext);
