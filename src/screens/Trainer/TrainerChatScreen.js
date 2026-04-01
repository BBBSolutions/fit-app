import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    SafeAreaView,
    Image,
    ActivityIndicator,
    RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../../services/api';
import { colors, spacing, borderRadius, typography } from '../../theme/theme';

const TrainerChatScreen = ({ navigation }) => {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadClients = async () => {
        try {
            setLoading(true);
            let combinedChats = [];

            // 1. Fetch assigned clients
            try {
                const data = await api.getClients();
                if (Array.isArray(data)) {
                    data.forEach(client => {
                        combinedChats.push({ 
                            ...client,
                            user_id: client.user_id || client.id,
                            role: 'member', // ensure we know they are a standard client
                            unread_count: 0,
                            last_message_time: new Date(0).toISOString()
                        });
                    });
                }
            } catch (error) {
                console.error("Failed to load assigned clients:", error);
            }

            // 2. Fetch specific threads (e.g. from Admin or branch staff)
            try {
                const threads = await api.getChatThreads();
                if (Array.isArray(threads)) {
                    threads.forEach(t => {
                        // Check if it's already an assigned client
                        const existingClientInfo = combinedChats.find(c => c.user_id === t.user_id || c.id === t.user_id);
                        if (existingClientInfo) {
                            existingClientInfo.unread_count = t.unread_count || 0;
                            existingClientInfo.last_message_time = t.last_message_time || existingClientInfo.last_message_time;
                        } else {
                            // Avoid duplicates if a client is also returned in threads
                            combinedChats.push({
                                id: t.user_id,
                                user_id: t.user_id,
                                name: t.name || t.full_name || 'Admin',
                                role: t.role || 'user',
                                unread_count: t.unread_count || 0,
                                last_message_time: t.last_message_time || new Date(0).toISOString()
                            });
                        }
                    });
                }
            } catch (error) {
                console.warn("Could not fetch threads, using fallback.");
            }

            // Sort by last message time (newest first)
            combinedChats.sort((a, b) => {
                return new Date(b.last_message_time || 0) - new Date(a.last_message_time || 0);
            });

            setClients(combinedChats);
        } catch (error) {
            console.error("Failed to load clients/chats:", error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadClients();
        }, [])
    );

    const onRefresh = async () => {
        setRefreshing(true);
        await loadClients();
        setRefreshing(false);
    };

    const handleClientPress = (client) => {
        // Navigate to Client Details with the Messages tab active
        navigation.navigate('TrainerClientDetails', {
            client,
            initialTab: 'Messages'
        });
    };

    const renderClientItem = ({ item }) => {
        const isUnread = item.unread_count > 0;
        return (
            <TouchableOpacity style={styles.clientCard} onPress={() => handleClientPress(item)}>
                <View style={[styles.avatar, { justifyContent: 'center', alignItems: 'center' }]}>
                    {item.image || item.avatar_url ? (
                        <Image source={{ uri: item.image || item.avatar_url }} style={styles.avatar} />
                    ) : (
                        <Ionicons name="person" size={24} color="#A0AEC0" />
                    )}
                    {item.role === 'admin' || item.role === 'owner' || item.role === 'branch_admin' ? (
                        <View style={{ position: 'absolute', bottom: -5, right: -5, backgroundColor: '#3182CE', borderRadius: 10, padding: 2 }}>
                            <Ionicons name="shield-checkmark" size={12} color="#FFF" />
                        </View>
                    ) : null}
                </View>
                <View style={styles.clientInfo}>
                    <Text style={[styles.clientName, isUnread && styles.clientNameUnread]}>{item.name || item.full_name || 'User'}</Text>
                    <Text style={[styles.subText, isUnread && styles.subTextUnread]}>Tap to view messages</Text>
                </View>
                {isUnread && (
                    <View style={styles.greenDot} />
                )}
                <Ionicons name="chevron-forward" size={20} color={colors.gray[400]} />
            </TouchableOpacity>
        );
    };

    const renderEmptyState = () => (
        <View style={styles.emptyStateContainer}>
            <View style={styles.emptyIconContainer}>
                <Ionicons name="chatbubbles-outline" size={64} color={colors.gray[300]} />
            </View>
            <Text style={styles.emptyTitle}>No Conversations</Text>
            <Text style={styles.emptySubtitle}>You haven't added any clients yet.</Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Messages</Text>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.trainer.primary} />
                </View>
            ) : (
                <FlatList
                    data={clients}
                    renderItem={renderClientItem}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={renderEmptyState}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.trainer.primary} />
                    }
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F7FAFC',
    },
    header: {
        paddingHorizontal: spacing.l,
        paddingVertical: spacing.l,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    headerTitle: {
        fontSize: typography.fontSize.xxl,
        fontWeight: typography.fontWeight.extrabold,
        color: '#2D3748',
    },
    listContent: {
        padding: spacing.l,
    },
    clientCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#EDF2F7',
    },
    clientInfo: {
        flex: 1,
        marginLeft: spacing.md,
    },
    clientName: {
        fontSize: typography.fontSize.md,
        fontWeight: typography.fontWeight.bold,
        color: '#2D3748',
    },
    clientNameUnread: {
        fontWeight: '900',
        color: '#1A202C',
    },
    subText: {
        fontSize: typography.fontSize.sm,
        color: colors.gray[500],
        marginTop: 2,
    },
    subTextUnread: {
        color: '#2D3748',
        fontWeight: '600',
    },
    greenDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#48BB78',
        marginRight: 10,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyStateContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 100,
    },
    emptyIconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#EDF2F7',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.l,
    },
    emptyTitle: {
        fontSize: typography.fontSize.xl,
        fontWeight: typography.fontWeight.bold,
        color: '#2D3748',
        marginBottom: spacing.xs,
    },
    emptySubtitle: {
        fontSize: typography.fontSize.md,
        color: colors.gray[500],
        textAlign: 'center',
    },
});

export default TrainerChatScreen;
