import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    SafeAreaView,
    RefreshControl,
    FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';
import { useChat } from '../../context/ChatContext';
import { useFocusEffect } from '@react-navigation/native';

const MessagesListScreen = ({ navigation }) => {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [chats, setChats] = useState([]); 
    const { unreadCount } = useChat();

    const fetchChats = async () => {
        try {
            let combinedChats = [];

            let trainerEntry = null;

            // 1. Fetch assigned trainer
            const profile = await api.getProfile();
            const trainerId = profile.trainerId || profile.trainer_id || profile.assignedTrainerId || profile.assigned_trainer_id;

            if (trainerId) {
                try {
                    const trainerProfile = await api.getProfileById(trainerId);
                    trainerEntry = { id: trainerId, name: trainerProfile.name || 'Your Trainer', role: 'trainer', unread_count: 0, last_message_time: new Date(0).toISOString() };
                } catch (e) {
                    trainerEntry = { id: trainerId, name: 'Your Trainer', role: 'trainer', unread_count: 0, last_message_time: new Date(0).toISOString() };
                }
            }

            // 2. Fetch active chat threads
            try {
                const threads = await api.getChatThreads();
                if (Array.isArray(threads)) {
                    threads.forEach(t => {
                        // Check if it's the trainer we already fetched
                        if (trainerEntry && trainerEntry.id === t.user_id) {
                            trainerEntry.unread_count = t.unread_count || 0;
                            trainerEntry.last_message_time = t.last_message_time || trainerEntry.last_message_time;
                            combinedChats.push(trainerEntry);
                            trainerEntry = null; // added
                        } else if (!combinedChats.find(c => c.id === t.user_id)) {
                            combinedChats.push({ 
                                id: t.user_id, 
                                name: t.name || t.full_name || 'Admin', 
                                role: t.role || 'user',
                                unread_count: t.unread_count || 0,
                                last_message_time: t.last_message_time || new Date(0).toISOString()
                            });
                        }
                    });
                }
            } catch (e) {
                console.warn("Could not fetch threads, using fallback.");
            }
            
            // Add trainer if they weren't in the active threads
            if (trainerEntry) {
                combinedChats.push(trainerEntry);
            }

            // Sort by last message time (newest first)
            combinedChats.sort((a, b) => {
                return new Date(b.last_message_time || 0) - new Date(a.last_message_time || 0);
            });

            setChats(combinedChats);

        } catch (error) {
            console.error("Failed to load chats:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        React.useCallback(() => {
            fetchChats();
        }, [])
    );

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        fetchChats();
    }, []);

    const navigateToChat = (chatItem) => {
        navigation.navigate('Chat', { trainerId: chatItem.id, trainerName: chatItem.name });
    };

    if (loading && !refreshing) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Messages</Text>
                </View>
                <View style={styles.centerContent}>
                    <ActivityIndicator size="large" color="#3182CE" />
                </View>
            </SafeAreaView>
        );
    }

    const renderChatItem = ({ item }) => {
        const isUnread = item.unread_count > 0;
        return (
            <TouchableOpacity style={styles.chatListItem} onPress={() => navigateToChat(item)}>
                <View style={styles.avatarContainer}>
                    <Ionicons name="person" size={24} color="#A0AEC0" />
                    {item.role === 'admin' || item.role === 'owner' || item.role === 'branch_admin' ? (
                        <View style={{ position: 'absolute', bottom: -5, right: -5, backgroundColor: '#3182CE', borderRadius: 10, padding: 2 }}>
                            <Ionicons name="shield-checkmark" size={12} color="#FFF" />
                        </View>
                    ) : null}
                </View>
                <View style={styles.chatInfo}>
                    <Text style={[styles.chatName, isUnread && styles.chatNameUnread]}>{item.name}</Text>
                    <Text style={[styles.chatPreview, isUnread && styles.chatPreviewUnread]}>
                        Tap to view messages
                    </Text>
                </View>
                {isUnread && (
                    <View style={styles.greenDot} />
                )}
                <Ionicons name="chevron-forward" size={20} color="#CBD5E0" />
            </TouchableOpacity>
        );
    };

    const renderEmptyComponent = () => (
        <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={48} color="#CBD5E0" />
            <Text style={styles.emptyText}>No messages yet.</Text>
            <Text style={styles.subText}>You will be able to message your trainer here once assigned.</Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Messages</Text>
            </View>
            <FlatList
                data={chats}
                keyExtractor={(item) => item.id}
                renderItem={renderChatItem}
                ListEmptyComponent={renderEmptyComponent}
                contentContainerStyle={{ flexGrow: 1 }}
                style={styles.container}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
    container: { flex: 1, backgroundColor: '#F7FAFC' },
    header: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F7FAFC',
        backgroundColor: '#FFFFFF',
    },
    headerTitle: { fontSize: 24, fontWeight: '800', color: '#1A202C' },
    centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyContainer: { alignItems: 'center', marginTop: 60, paddingHorizontal: 20 },
    emptyText: { color: '#4A5568', marginTop: 12, fontSize: 18, fontWeight: '600' },
    subText: { fontSize: 14, color: '#718096', textAlign: 'center', marginTop: 8 },

    chatListItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#EDF2F7',
    },
    avatarContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#EDF2F7',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    unreadBadge: {
        position: 'absolute',
        top: -2,
        right: -2,
        backgroundColor: '#E53E3E',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    unreadText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: 'bold',
    },
    chatInfo: {
        flex: 1,
    },
    chatName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2D3748',
        marginBottom: 4,
    },
    chatNameUnread: {
        fontWeight: 'bold',
        color: '#1A202C',
    },
    chatPreview: {
        fontSize: 14,
        color: '#718096',
    },
    chatPreviewUnread: {
        color: '#2D3748',
        fontWeight: '500',
    },
    greenDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#48BB78',
        marginRight: 10,
    }
});

export default MessagesListScreen;
