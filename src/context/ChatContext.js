import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import { AppState } from 'react-native';
import { supabase } from '../config/supabaseAuth';
import { api } from '../services/api';

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
    const [unreadCount, setUnreadCount] = useState(0);
    const [currentUserId, setCurrentUserId] = useState(null);
    // useRef to avoid stale closure inside Supabase realtime callback
    const currentUserIdRef = useRef(null);
    const pollRef = useRef(null);

    const fetchUnreadCount = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) {
                setUnreadCount(0);
                currentUserIdRef.current = null;
                return;
            }

            // Use the auth user ID directly — same UUID stored in messages.receiver_id
            const uid = session.user.id;
            if (currentUserIdRef.current !== uid) {
                currentUserIdRef.current = uid;
                setCurrentUserId(uid);
            }

            const data = await api.getUnreadCount();
            const count = data?.count || 0;
            setUnreadCount(count);
        } catch (e) {
            // Silent fail on poll errors
        }
    };

    useEffect(() => {
        // Initial fetch
        fetchUnreadCount();

        // Poll every 12 seconds for reliable badge updates
        pollRef.current = setInterval(fetchUnreadCount, 12000);

        // Auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
            fetchUnreadCount();
        });

        // App comes to foreground
        const appStateSubscription = AppState.addEventListener('change', nextAppState => {
            if (nextAppState === 'active') fetchUnreadCount();
        });

        // Realtime — new message INSERT
        const channel = supabase
            .channel('public:messages')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'messages' },
                (payload) => {
                    // Use ref to avoid stale closure
                    if (currentUserIdRef.current && payload.new.receiver_id === currentUserIdRef.current) {
                        setUnreadCount(prev => prev + 1);
                    } else {
                        fetchUnreadCount();
                    }
                }
            )
            .subscribe();

        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
            appStateSubscription.remove();
            supabase.removeChannel(channel);
            if (subscription) subscription.unsubscribe();
        };
    }, []); // Run once on mount — uses ref to avoid stale userId

    const markAsRead = async (senderId) => {
        try {
            await api.markMessagesRead(senderId);
            fetchUnreadCount();
        } catch (error) {
            console.error('Error marking messages as read:', error);
        }
    };

    return (
        <ChatContext.Provider value={{ unreadCount, hasUnread: unreadCount > 0, fetchUnreadCount, markAsRead }}>
            {children}
        </ChatContext.Provider>
    );
};

export const useChat = () => useContext(ChatContext);
