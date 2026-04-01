import React, { useState, useCallback, useRef } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    FlatList, ActivityIndicator, SafeAreaView, RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { adminApi } from '../../services/adminApi';

const AdminInboxScreen = ({ navigation, route }) => {
    const { branchId, gymCode, branchName } = route.params || {};
    const [threads, setThreads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchThreads = async () => {
        try {
            const data = await adminApi.getChatThreads();
            // Sort newest first
            const sorted = (data || []).sort((a, b) =>
                new Date(b.last_message_time || 0) - new Date(a.last_message_time || 0)
            );
            setThreads(sorted);
        } catch (e) {
            console.error('Failed to load inbox:', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const pollRef = useRef(null);

    useFocusEffect(
        useCallback(() => {
            fetchThreads();
            // Poll every 8 seconds for new replies
            pollRef.current = setInterval(fetchThreads, 8000);
            return () => {
                if (pollRef.current) clearInterval(pollRef.current);
            };
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchThreads();
    };

    const getRoleLabel = (role) => {
        if (!role) return '';
        if (role === 'member') return '👤 Member';
        if (role === 'trainer') return '🏋️ Trainer';
        return '👑 ' + role;
    };

    const getRoleColor = (role) => {
        if (role === 'member') return '#3182CE';
        if (role === 'trainer') return '#38A169';
        return '#805AD5';
    };

    const renderItem = ({ item }) => {
        const isUnread = item.unread_count > 0;
        const displayName = item.name || item.full_name || 'User';
        const lastTime = item.last_message_time
            ? new Date(item.last_message_time).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
            : '';
        return (
            <TouchableOpacity
                style={[styles.threadCard, isUnread && styles.threadCardUnread]}
                onPress={() => navigation.navigate('AdminChat', {
                    userId: item.user_id,
                    userName: displayName,
                    userRole: item.role,
                    branchId, gymCode, branchName
                })}
            >
                <View style={[styles.avatar, { backgroundColor: getRoleColor(item.role) + '20' }]}>
                    <Ionicons
                        name={item.role === 'trainer' ? 'barbell' : 'person'}
                        size={22}
                        color={getRoleColor(item.role)}
                    />
                </View>
                <View style={styles.threadInfo}>
                    <Text style={[styles.threadName, isUnread && styles.threadNameUnread]}>
                        {displayName}
                    </Text>
                    <Text style={[styles.threadRole, { color: getRoleColor(item.role) }]}>
                        {getRoleLabel(item.role)}
                    </Text>
                    {lastTime ? <Text style={styles.threadTime}>{lastTime}</Text> : null}
                </View>
                {isUnread && (
                    <View style={styles.unreadBadge}>
                        <Text style={styles.unreadBadgeText}>{item.unread_count}</Text>
                    </View>
                )}
                <Ionicons name="chevron-forward" size={20} color="#CBD5E0" />
            </TouchableOpacity>
        );
    };

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={56} color="#CBD5E0" />
            <Text style={styles.emptyTitle}>No Replies Yet</Text>
            <Text style={styles.emptySubtitle}>When members or trainers reply to your broadcasts, their messages will appear here.</Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#4A5568" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Message Inbox</Text>
                <View style={{ width: 32 }} />
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#3182CE" />
                </View>
            ) : (
                <FlatList
                    data={threads}
                    keyExtractor={(item) => item.user_id}
                    renderItem={renderItem}
                    ListEmptyComponent={renderEmpty}
                    contentContainerStyle={{ flexGrow: 1 }}
                    style={styles.list}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F7FAFC' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingVertical: 16,
        backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0'
    },
    backButton: { padding: 4 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1A202C' },
    list: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    threadCard: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#FFF', padding: 16,
        borderBottomWidth: 1, borderBottomColor: '#EDF2F7',
    },
    threadCardUnread: { backgroundColor: '#EBF8FF' },
    avatar: {
        width: 48, height: 48, borderRadius: 24,
        justifyContent: 'center', alignItems: 'center',
        marginRight: 14,
    },
    threadInfo: { flex: 1 },
    threadName: { fontSize: 16, fontWeight: '600', color: '#2D3748', marginBottom: 2 },
    threadNameUnread: { fontWeight: 'bold', color: '#1A202C' },
    threadRole: { fontSize: 13, fontWeight: '500' },
    threadTime: { fontSize: 11, color: '#A0AEC0', marginTop: 2 },
    unreadBadge: {
        backgroundColor: '#E53E3E', borderRadius: 12,
        minWidth: 24, height: 24, justifyContent: 'center',
        alignItems: 'center', paddingHorizontal: 6, marginRight: 8,
    },
    unreadBadgeText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
    emptyContainer: {
        flex: 1, justifyContent: 'center', alignItems: 'center',
        paddingHorizontal: 40, marginTop: 80,
    },
    emptyTitle: { fontSize: 20, fontWeight: '700', color: '#4A5568', marginTop: 16, marginBottom: 8 },
    emptySubtitle: { fontSize: 14, color: '#718096', textAlign: 'center', lineHeight: 22 },
});

export default AdminInboxScreen;
