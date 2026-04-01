import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    Dimensions,
    SafeAreaView,
    Image
} from 'react-native';
import { BarChart } from "react-native-chart-kit";
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../../services/api';
import { useChat } from '../../context/ChatContext';

// UI Components
import { colors, spacing, borderRadius, typography, shadows } from '../../theme/theme';

const TrainerDashboardScreen = ({ navigation }) => {
    const { unreadCount } = useChat();
    const [showFABMenu, setShowFABMenu] = useState(false);
    const [trainerName, setTrainerName] = useState('Coach');
    const [trainerImage, setTrainerImage] = useState(null);
    const [clientCount, setClientCount] = useState(0);

    // Schedule / Assignments State
    const [allAssignments, setAllAssignments] = useState([]); // Store ALL for filtering
    const [displayedAssignments, setDisplayedAssignments] = useState([]); // What's actually shown
    const [loadingSchedule, setLoadingSchedule] = useState(true);

    // Filter State
    const [filterMode, setFilterMode] = useState('recent'); // 'recent' or 'date'
    const [selectedDate, setSelectedDate] = useState(new Date());

    const [refreshing, setRefreshing] = useState(false);

    // Notifications State
    const [notifications, setNotifications] = useState([]);

    const fetchDashboardData = async () => {
        try {
            // Parallel fetch for profile and clients
            const [profile, clients] = await Promise.all([
                api.getProfile(),
                api.getClients()
            ]);

            if (profile) {
                const nameToDisplay = profile.fullName || profile.name || 'Coach';
                setTrainerName(nameToDisplay);
                setTrainerImage(profile.avatarUrl || profile.avatar_url || profile.image || null);
            }

            if (Array.isArray(clients)) {
                // console.log("Dashboard: Fetched clients:", clients.length);
                setClientCount(clients.length);

                // Fetch assignments for all clients
                const sessionsPromises = clients.map(async (client) => {
                    try {
                        const workouts = await api.getAssignedWorkouts(client.id);

                        // Map workouts with client info
                        return workouts.map(w => ({
                            ...w,
                            clientName: client.name || client.full_name || 'Client',
                            avatar: client.avatar_url,
                            client_id: client.id, // Add client_id for navigation
                        }));
                    } catch (e) {
                        // specific error handling not needed here, fail silently for dashboard
                        return [];
                    }
                });

                const results = await Promise.all(sessionsPromises);

                // Flatten and Sort by most recent
                const all = results.flat()
                    .filter(w => w.assigned_at) // Ensure timestamp exists
                    .sort((a, b) => new Date(b.assigned_at) - new Date(a.assigned_at));

                setAllAssignments(all);

                // Generate Notifications from Assignments
                const newNotifications = [];

                // 0. Unread messages from Admin/members
                try {
                    const threads = await api.getChatThreads();
                    if (Array.isArray(threads)) {
                        const unreadThreads = threads.filter(t => t.unread_count > 0);
                        unreadThreads.forEach(t => {
                            newNotifications.push({
                                id: `msg-${t.user_id}`,
                                text: `New message from ${t.name || t.full_name || 'Admin'} (${t.unread_count} unread)`,
                                icon: 'chatbubble-ellipses',
                                color: '#E53E3E',
                                onPress: () => {} // placeholder, will navigate below
                            });
                        });
                    }
                } catch (e) {
                    // silent fail
                }

                // 1. Recent completions
                const recentCompletions = all.filter(w => w.status?.toLowerCase() === 'completed').slice(0, 3);
                recentCompletions.forEach(w => {
                    newNotifications.push({
                        id: `comp-${w.id}`,
                        text: `${w.clientName} completed ${w.workout?.title || 'a workout'}`,
                        icon: 'checkmark-circle',
                        color: colors.success
                    });
                });

                // 2. Pending today
                const todayStr = new Date().toDateString();
                const pendingToday = all.filter(w =>
                    w.status?.toLowerCase() !== 'completed' &&
                    new Date(w.assigned_at).toDateString() === todayStr
                ).slice(0, 3);

                pendingToday.forEach(w => {
                    newNotifications.push({
                        id: `pend-${w.id}`,
                        text: `${w.clientName} has ${w.workout?.title} today`,
                        icon: 'time',
                        color: colors.warning
                    });
                });

                // 3. New Clients
                if (newNotifications.length === 0 && clients.length > 0) {
                    newNotifications.push({
                        id: 'generic-1',
                        text: `You have ${clients.length} active clients.`,
                        icon: 'people',
                        color: colors.primary
                    });
                }

                setNotifications(newNotifications);

            } else {
                console.log("Dashboard: Clients is not an array:", clients);
            }

        } catch (error) {
            console.error("Failed to load dashboard data:", error);
        } finally {
            setLoadingSchedule(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchDashboardData();

            // specific polling for real-time updates (every 10 seconds)
            const intervalId = setInterval(() => {
                // Silent update (no loading spinner)
                fetchDashboardData();
            }, 10000);

            return () => clearInterval(intervalId); // Cleanup on blur
        }, [])
    );

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchDashboardData();
        setRefreshing(false);
    }, []);

    // Handle Filtering logic
    useEffect(() => {
        if (filterMode === 'recent') {
            // Show top 5 most recent
            setDisplayedAssignments(allAssignments.slice(0, 5));
        } else {
            // Filter by selected Date
            const targetStr = selectedDate.toDateString();
            const filtered = allAssignments.filter(w => {
                const d = new Date(w.assigned_at).toDateString();
                return d === targetStr;
            });
            setDisplayedAssignments(filtered);
        }
    }, [allAssignments, filterMode, selectedDate]);

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Header - Transparent to show gradient */}
            <View style={styles.headerContainer}>
                <View style={styles.header}>
                    <View>
                        <Text style={styles.headerTitle}>Dashboard</Text>
                        <Text style={styles.headerSubtitle}>Welcome back, {trainerName}!</Text>
                    </View>
                    <TouchableOpacity style={styles.avatarButton} onPress={() => navigation.navigate('Profile')}>
                        {trainerImage ? (
                            <Image source={{ uri: trainerImage }} style={styles.profileImage} />
                        ) : (
                            <Ionicons name="person-circle" size={40} color={colors.text.primary} />
                        )}
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.contentContainer}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.white} />}
            >
                {/* 2. Quick Stats Section */}
                <View style={styles.statsRow}>
                    <View style={[styles.card, styles.statCardWrapper]}>
                        <View style={styles.statContent}>
                            <Ionicons name="people" size={28} color="#3182CE" />
                            <Text style={styles.statValue}>{clientCount}</Text>
                            <Text style={styles.statLabel}>Active Clients</Text>
                        </View>
                    </View>

                    <View style={[styles.card, styles.statCardWrapper]}>
                        <View style={styles.statContent}>
                            <Ionicons name="document-text" size={28} color={colors.warning} />
                            <Text style={styles.statValue}>0</Text>
                            <Text style={styles.statLabel}>Pending Reviews</Text>
                        </View>
                    </View>

                    <View style={[styles.card, styles.statCardWrapper]}>
                        <View style={styles.statContent}>
                            <Ionicons name="calendar" size={28} color={colors.success} />
                            <Text style={styles.statValue}>{displayedAssignments ? displayedAssignments.length : 0}</Text>
                            <Text style={styles.statLabel}>Visible Plans</Text>
                        </View>
                    </View>
                </View>

                {/* 4. Today's Schedule */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Assignments</Text>
                        <View style={styles.filterContainer}>
                            <TouchableOpacity
                                style={[styles.filterBtn, filterMode === 'recent' && styles.filterBtnActive]}
                                onPress={() => setFilterMode('recent')}
                            >
                                <Text style={[styles.filterBtnText, filterMode === 'recent' && styles.filterBtnTextActive]}>Recent</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.filterBtn, filterMode === 'date' && styles.filterBtnActive]}
                                onPress={() => setFilterMode('date')}
                            >
                                <Text style={[styles.filterBtnText, filterMode === 'date' && styles.filterBtnTextActive]}>By Date</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Date Strip (Visible only in Date mode) */}
                    {filterMode === 'date' && (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateStrip}>
                            {[-2, -1, 0, 1, 2, 3, 4].map(dayOffset => {
                                const d = new Date();
                                d.setDate(d.getDate() + dayOffset);
                                const isSelected = d.toDateString() === selectedDate.toDateString();
                                const isToday = d.toDateString() === new Date().toDateString();

                                return (
                                    <TouchableOpacity
                                        key={dayOffset}
                                        style={[styles.dateItem, isSelected && styles.dateItemActive]}
                                        onPress={() => setSelectedDate(d)}
                                    >
                                        <Text style={[styles.dateDay, isSelected && styles.dateTextActive]}>
                                            {d.toLocaleDateString('en-US', { weekday: 'short' })}
                                        </Text>
                                        <Text style={[styles.dateNum, isSelected && styles.dateTextActive]}>
                                            {d.getDate()}
                                        </Text>
                                        {isToday && <View style={styles.todayDot} />}
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    )}

                    <View style={[styles.card, { padding: spacing.sm }]}>
                        {loadingSchedule ? (
                            <View style={styles.emptyState}>
                                <Text style={styles.emptyStateText}>Loading schedule...</Text>
                            </View>
                        ) : displayedAssignments.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Text style={styles.emptyStateText}>
                                    {filterMode === 'date' ? 'No workouts for this date.' : 'No recent assignments.'}
                                </Text>
                            </View>
                        ) : (
                            displayedAssignments.map((session, index) => (
                                <View key={session.id || index} style={styles.sessionCard}>
                                    <View style={styles.sessionTime}>
                                        <Ionicons
                                            name={session.status?.toLowerCase() === 'completed' ? "checkmark-circle" : "time-outline"}
                                            size={20}
                                            color={session.status?.toLowerCase() === 'completed' ? colors.success : "#3182CE"}
                                        />
                                        {/* Using assigned time or default */}
                                        <Text style={styles.sessionTimeText}>
                                            {new Date(session.assigned_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}{'\n'}
                                            {new Date(session.assigned_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </Text>
                                    </View>
                                    <View style={styles.sessionInfo}>
                                        <Text style={styles.sessionClientName}>{session.clientName}</Text>
                                        <Text style={styles.sessionType}>{session.workout?.title || 'Workout'}</Text>
                                        <Text style={styles.sessionStatus}>{session.status}</Text>
                                    </View>
                                    <TouchableOpacity
                                        style={styles.sessionButton}
                                        onPress={() => navigation.navigate('TrainerClientDetails', { clientId: session.client_id, initialTab: 'Workouts' })}
                                    >
                                        <Ionicons name="chevron-forward-circle" size={24} color="#3182CE" />
                                    </TouchableOpacity>
                                </View>
                            ))
                        )}
                    </View>
                </View>

                {/* 5. Client Management Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Client Management</Text>
                    <View style={[styles.card, { padding: 0 }]}>
                        <TouchableOpacity
                            style={styles.managementOption}
                            onPress={() => navigation.navigate('Clients')}
                        >
                            <Ionicons name="people-outline" size={24} color="#3182CE" />
                            <Text style={styles.managementText}>View All Clients</Text>
                            <Ionicons name="chevron-forward" size={20} color="#666" />
                        </TouchableOpacity>
                        <View style={styles.managementDivider} />
                        <TouchableOpacity
                            style={styles.managementOption}
                            onPress={() => navigation.navigate('Messages')}
                        >
                            <Ionicons name="chatbubbles-outline" size={24} color="#3182CE" />
                            <Text style={styles.managementText}>Messages / Chat</Text>
                            <Ionicons name="chevron-forward" size={20} color="#666" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* 6. Performance Analytics */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Weekly Performance</Text>
                    <View style={styles.card}>
                        {allAssignments.length > 0 ? (
                            <View style={{ alignItems: 'center' }}>
                                <BarChart
                                    data={{
                                        labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
                                        datasets: [{
                                            data: (() => {
                                                const counts = [0, 0, 0, 0, 0, 0, 0];
                                                allAssignments.forEach(w => {
                                                    if (!w.assigned_at) return;
                                                    const day = new Date(w.assigned_at).getDay();
                                                    const index = day === 0 ? 6 : day - 1;
                                                    counts[index] += 1;
                                                });
                                                return counts;
                                            })()
                                        }]
                                    }}
                                    width={Dimensions.get("window").width - 80} // Adjusted width for padding
                                    height={220}
                                    yAxisLabel=""
                                    yAxisSuffix=""
                                    chartConfig={{
                                        backgroundColor: "transparent",
                                        backgroundGradientFrom: "#ffffff",
                                        backgroundGradientTo: "#ffffff",
                                        backgroundGradientFromOpacity: 0,
                                        backgroundGradientToOpacity: 0,
                                        decimalPlaces: 0,
                                        color: (opacity = 1) => `rgba(49, 130, 206, ${opacity})`,
                                        labelColor: (opacity = 1) => `rgba(113, 128, 150, ${opacity})`,
                                        style: {
                                            borderRadius: 16
                                        },
                                        barPercentage: 0.6,
                                    }}
                                    style={{
                                        marginVertical: 8,
                                        borderRadius: 16
                                    }}
                                    showValuesOnTopOfBars
                                />
                            </View>
                        ) : (
                            <View style={styles.chartPlaceholder}>
                                <Text style={styles.chartPlaceholderText}>No data to display yet</Text>
                            </View>
                        )}

                        <View style={styles.metricsRow}>
                            <View style={styles.metricItem}>
                                <Text style={styles.metricValue}>{allAssignments.length}</Text>
                                <Text style={styles.metricLabel}>Total Assignments</Text>
                            </View>
                            <View style={styles.metricItem}>
                                <Text style={styles.metricValue}>
                                    {allAssignments.length > 0
                                        ? Math.round((allAssignments.filter(w => w.status?.toLowerCase() === 'completed').length / allAssignments.length) * 100)
                                        : 0}%
                                </Text>
                                <Text style={styles.metricLabel}>Completion Rate</Text>
                            </View>
                            <View style={styles.metricItem}>
                                <Text style={styles.metricValue}>{clientCount}</Text>
                                <Text style={styles.metricLabel}>Active Clients</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* 7. Notifications Panel */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Notifications</Text>
                    <View style={[styles.card, { padding: 0 }]}>
                        {unreadCount > 0 && (
                            <TouchableOpacity
                                style={styles.notificationItem}
                                onPress={() => navigation.navigate('Messages')}
                            >
                                <View style={[styles.notificationIcon, { backgroundColor: colors.error + '20' }]}>
                                    <Ionicons name="chatbubble-ellipses" size={20} color={colors.error} />
                                </View>
                                <Text style={styles.notificationText}>You have {unreadCount} unread message{unreadCount > 1 ? 's' : ''}</Text>
                                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.error, marginLeft: 'auto' }} />
                            </TouchableOpacity>
                        )}
                        {notifications.length > 0 ? (
                            notifications.map((notification) => {
                                const isMessage = notification.id?.startsWith('msg-');
                                const Inner = (
                                    <>
                                        <View style={[styles.notificationIcon, { backgroundColor: notification.color ? notification.color + '20' : '#EBF8FF' }]}>
                                            <Ionicons name={notification.icon} size={20} color={notification.color || '#3182CE'} />
                                        </View>
                                        <Text style={[styles.notificationText, isMessage && { fontWeight: '700', color: '#C53030' }]}>{notification.text}</Text>
                                        {isMessage && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#E53E3E', marginLeft: 'auto' }} />}
                                    </>
                                );
                                return isMessage ? (
                                    <TouchableOpacity key={notification.id} style={styles.notificationItem} onPress={() => navigation.navigate('Messages')}>
                                        {Inner}
                                    </TouchableOpacity>
                                ) : (
                                    <View key={notification.id} style={styles.notificationItem}>{Inner}</View>
                                );
                            })
                        ) : (
                            <Text style={{ color: colors.gray[500], fontStyle: 'italic', textAlign: 'center', padding: 10 }}>
                                No new notifications
                            </Text>
                        )}
                    </View>
                </View>

                <View style={styles.bottomSpacer} />
            </ScrollView>

        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    container: {
        flex: 1,
    },
    headerContainer: {
        // backgroundColor: colors.trainer.primary, // Removed for transparent gradient effect
        paddingHorizontal: spacing.xl,
        paddingTop: spacing.lg,
        paddingBottom: spacing.xxl,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: typography.fontSize.xxxl,
        fontWeight: typography.fontWeight.extrabold,
        color: colors.text.primary,
    },
    headerSubtitle: {
        fontSize: typography.fontSize.base,
        color: colors.text.secondary || '#4A5568',
        marginTop: spacing.xs,
    },
    avatarButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    scrollView: {
        flex: 1,
    },
    contentContainer: {
        padding: 20,
        paddingBottom: 100,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 0,
        marginBottom: spacing.xxl,
    },
    statCardWrapper: {
        flex: 1,
        minWidth: 100, // Ensure they don't get too small before wrapping
        minHeight: 110,
        padding: 10,
        margin: 0,
    },
    statContent: {
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        flex: 1,
    },
    statValue: {
        fontSize: typography.fontSize.xl,
        fontWeight: typography.fontWeight.bold,
        color: colors.text.primary,
        marginTop: spacing.xs,
    },
    statValueLight: {
        fontSize: typography.fontSize.xl,
        fontWeight: typography.fontWeight.bold,
        color: '#FFF',
        marginTop: spacing.xs,
    },
    statLabel: {
        fontSize: 10,
        color: colors.text.tertiary,
        textAlign: 'center',
        marginTop: spacing.xs,
        fontWeight: '600',
    },
    statLabelLight: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.9)',
        textAlign: 'center',
        marginTop: spacing.xs,
        fontWeight: '600',
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text.primary,
        marginBottom: 12,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    filterContainer: {
        flexDirection: 'row',
        backgroundColor: colors.gray ? colors.gray[100] : '#EDF2F7',
        borderRadius: 8,
        padding: 2,
    },
    filterBtn: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 6,
    },
    filterBtnActive: {
        backgroundColor: '#FFFFFF',
    },
    filterBtnText: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.gray ? colors.gray[500] : '#718096',
    },
    filterBtnTextActive: {
        color: '#3182CE',
    },
    dateStrip: {
        marginBottom: 16,
        flexGrow: 0,
    },
    dateItem: {
        width: 50,
        height: 60,
        backgroundColor: colors.gray ? colors.gray[100] : '#F7FAFC',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    dateItemActive: {
        backgroundColor: '#3182CE',
    },
    dateDay: {
        fontSize: 12,
        color: '#4A5568',
        marginBottom: 4,
    },
    dateNum: {
        fontSize: 16,
        fontWeight: '700',
        color: '#2D3748',
    },
    dateTextActive: {
        color: '#FFFFFF',
    },
    todayDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#3182CE',
        position: 'absolute',
        bottom: 6,
    },
    sessionCard: {
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
    },
    sessionTime: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 16,
        minWidth: 80,
    },
    sessionTimeText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#2D3748',
        marginLeft: 6,
        textAlign: 'center',
    },
    sessionInfo: {
        flex: 1,
    },
    sessionClientName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2D3748',
        marginBottom: 4,
    },
    sessionType: {
        fontSize: 13,
        color: '#718096',
    },
    sessionStatus: {
        fontSize: 12,
        color: '#718096',
        marginTop: 2,
        textTransform: 'capitalize',
        fontWeight: '500',
    },
    sessionButton: {
        padding: 8,
    },
    managementOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
    },
    managementText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#2D3748',
        flex: 1,
        marginLeft: 12,
    },
    managementDivider: {
        height: 1,
        backgroundColor: '#E2E8F0',
        marginLeft: 52, // Indent to align with text
    },
    chartPlaceholder: {
        height: 120,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderStyle: 'dashed',
        borderRadius: 8,
    },
    chartPlaceholderText: {
        fontSize: 16,
        color: '#A0AEC0',
    },
    metricsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 10,
    },
    metricItem: {
        alignItems: 'center',
    },
    metricValue: {
        fontSize: 20,
        fontWeight: '700',
        color: '#3182CE',
        marginBottom: 4,
    },
    metricLabel: {
        fontSize: 11,
        color: '#718096',
        textAlign: 'center',
    },
    notificationItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        paddingHorizontal: 16,
    },
    notificationIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#EBF8FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    notificationText: {
        fontSize: 14,
        color: '#4A5568',
        flex: 1,
    },
    bottomSpacer: {
        height: 20,
    },
    emptyState: {
        padding: 20,
        alignItems: 'center',
    },
    emptyStateText: {
        color: '#A0AEC0',
        fontSize: 14,
    },
    fab: {
        position: 'absolute',
        bottom: 90,
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#3182CE',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#3182CE',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    fabMenu: {
        position: 'absolute',
        bottom: 160,
        right: 20,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    fabMenuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    fabMenuText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2D3748',
        marginLeft: 12,
    },
});

export default TrainerDashboardScreen;
