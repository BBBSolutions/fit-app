import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    Modal,
    Animated,
    RefreshControl,
    Dimensions // Added
} from 'react-native';
import { BarChart } from "react-native-chart-kit"; // Added
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../../services/api';
import { useChat } from '../../context/ChatContext';
import GradientBackground from '../../components/GradientBackground';
import GradientCard from '../../components/GradientCard';
import { colors, spacing, borderRadius, typography, shadows } from '../../theme/theme';

const TrainerDashboardScreen = ({ navigation }) => {
    const { unreadCount } = useChat();
    const [showFABMenu, setShowFABMenu] = useState(false);
    const [trainerName, setTrainerName] = useState('Coach');
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
            }

            if (Array.isArray(clients)) {
                console.log("Dashboard: Fetched clients:", clients.length);
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

                // 3. New Clients (simulated by just checking recent addition to list if we had created_at, 
                // but since we might not, we can just generic message if list > 0 and no other notifs)
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
            {/* Header */}
            <View style={styles.headerContainer}>
                <View style={styles.header}>
                    <View>
                        <Text style={styles.headerTitle}>Dashboard</Text>
                        <Text style={styles.headerSubtitle}>Welcome back, {trainerName}!</Text>
                    </View>
                    <TouchableOpacity style={styles.avatarButton} onPress={() => navigation.navigate('Profile')}>
                        <Ionicons name="person-circle" size={40} color={colors.white} />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.contentContainer}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.trainer.primary} />}
            >

                {/* 2. Quick Stats Section using GradientCards */}
                <View style={styles.statsRow}>
                    <View style={[styles.gradientStatCard, { padding: 0, backgroundColor: 'transparent' }]}>
                        <LinearGradient
                            colors={['#4299E1', '#3182CE']}
                            style={{ flex: 1, borderRadius: borderRadius.lg, width: '100%', alignItems: 'center', justifyContent: 'center' }}
                        >
                            <View style={styles.statContent}>
                                <Ionicons name="people" size={28} color="#FFF" />
                                <Text style={styles.statValueLight}>{clientCount}</Text>
                                <Text style={styles.statLabelLight}>Active Clients</Text>
                            </View>
                        </LinearGradient>
                    </View>

                    <View style={styles.statCard}>
                        <Ionicons name="document-text" size={28} color={colors.warning} />
                        <Text style={styles.statValue}>0</Text>
                        <Text style={styles.statLabel}>Pending Reviews</Text>
                    </View>

                    <View style={styles.statCard}>
                        <Ionicons name="calendar" size={28} color={colors.success} />
                        <Text style={styles.statValue}>{displayedAssignments ? displayedAssignments.length : 0}</Text>
                        <Text style={styles.statLabel}>Visible Plans</Text>
                    </View>
                </View>

                {/* 3. Pending AI Plan Reviews - COMMENTED OUT
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Pending AI Plan Reviews</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {pendingReviews.map((review) => (
                            <View key={review.id} style={styles.reviewCard}>
                                <Text style={styles.reviewClientName}>{review.clientName}</Text>
                                <View style={styles.reviewGoalBadge}>
                                    <Text style={styles.reviewGoalText}>{review.goal}</Text>
                                </View>
                                <Text style={styles.reviewWeek}>{review.week} • {review.day}</Text>
                                <TouchableOpacity style={styles.reviewButton}>
                                    <Text style={styles.reviewButtonText}>Review Plan</Text>
                                    <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </ScrollView>
                </View>
                */ }

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

                {/* 5. Client Management Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Client Management</Text>
                    <View style={styles.managementCard}>
                        <TouchableOpacity
                            style={styles.managementOption}
                            onPress={() => navigation.navigate('Clients')}
                        >
                            <Ionicons name="people-outline" size={24} color="#3182CE" />
                            <Text style={styles.managementText}>View All Clients</Text>
                            <Ionicons name="chevron-forward" size={20} color="#A0AEC0" />
                        </TouchableOpacity>
                        <View style={styles.managementDivider} />
                        <TouchableOpacity
                            style={styles.managementOption}
                            onPress={() => navigation.navigate('Messages')}
                        >
                            <Ionicons name="chatbubbles-outline" size={24} color="#3182CE" />
                            <Text style={styles.managementText}>Messages / Chat</Text>
                            <Ionicons name="chevron-forward" size={20} color="#A0AEC0" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* 6. Performance Analytics */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Weekly Performance</Text>
                    <View style={styles.analyticsCard}>
                        {allAssignments.length > 0 ? (
                            <View style={{ alignItems: 'center' }}>
                                <BarChart
                                    data={{
                                        labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
                                        datasets: [{
                                            data: (() => {
                                                // Aggregate assignments by day of week
                                                const counts = [0, 0, 0, 0, 0, 0, 0]; // Mon-Sun
                                                // Simplified: Just showing last 7 days distribution roughly mapped to Mon-Sun for demo
                                                // For more accuracy, we'd map specific dates.
                                                // Let's do simple day mapping from all assignments

                                                allAssignments.forEach(w => {
                                                    if (!w.assigned_at) return;
                                                    const day = new Date(w.assigned_at).getDay(); // 0=Sun, 1=Mon
                                                    const index = day === 0 ? 6 : day - 1; // Shift to 0=Mon, 6=Sun
                                                    counts[index] += 1;
                                                });
                                                return counts;
                                            })()
                                        }]
                                    }}
                                    width={Dimensions.get("window").width - 40} // Responsive width
                                    height={220}
                                    yAxisLabel=""
                                    yAxisSuffix=""
                                    chartConfig={{
                                        backgroundColor: "#ffffff",
                                        backgroundGradientFrom: "#ffffff",
                                        backgroundGradientTo: "#ffffff",
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
                    <View style={styles.notificationsCard}>
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
                            notifications.map((notification) => (
                                <View key={notification.id} style={styles.notificationItem}>
                                    <View style={[styles.notificationIcon, { backgroundColor: notification.color ? notification.color + '20' : '#EBF8FF' }]}>
                                        <Ionicons name={notification.icon} size={20} color={notification.color || "#3182CE"} />
                                    </View>
                                    <Text style={styles.notificationText}>{notification.text}</Text>
                                </View>
                            ))
                        ) : (
                            <Text style={{ color: colors.gray[500], fontStyle: 'italic', textAlign: 'center', padding: 10 }}>
                                No new notifications
                            </Text>
                        )}
                    </View>
                </View>

                <View style={styles.bottomSpacer} />
            </ScrollView>

            {/* 8. Floating Action Button */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => setShowFABMenu(!showFABMenu)}
            >
                <Ionicons name={showFABMenu ? "close" : "add"} size={28} color="#FFFFFF" />
            </TouchableOpacity>

            {/* FAB Menu */}
            {showFABMenu && (
                <View style={styles.fabMenu}>
                    <TouchableOpacity style={styles.fabMenuItem}>
                        <Ionicons name="barbell-outline" size={20} color="#2D3748" />
                        <Text style={styles.fabMenuText}>Create Workout Plan</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.fabMenuItem}>
                        <Ionicons name="person-add-outline" size={20} color="#2D3748" />
                        <Text style={styles.fabMenuText}>Add Client</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.fabMenuItem}>
                        <Ionicons name="megaphone-outline" size={20} color="#2D3748" />
                        <Text style={styles.fabMenuText}>Send Broadcast Message</Text>
                    </TouchableOpacity>
                </View>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: colors.trainer.background,
    },
    headerContainer: {
        backgroundColor: colors.trainer.primary,
        paddingHorizontal: spacing.xl,
        paddingTop: spacing.lg,
        paddingBottom: spacing.xxl,
    },
    container: {
        flex: 1,
    },
    contentContainer: {
        padding: 20,
        paddingBottom: 100,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: typography.fontSize.xxxl,
        fontWeight: typography.fontWeight.extrabold,
        color: colors.white,
    },
    headerSubtitle: {
        fontSize: typography.fontSize.base,
        color: colors.white,
        opacity: 0.9,
        marginTop: spacing.xs,
    },
    avatarButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: -spacing.xxxl,
        marginBottom: spacing.xxl,
        paddingHorizontal: spacing.xl,
    },
    statCard: {
        backgroundColor: colors.white,
        borderRadius: borderRadius.lg,
        padding: spacing.md, // Reduced padding to fit 3 in row
        flex: 1,
        alignItems: 'center',
        marginHorizontal: 4, // Tighter margins
        ...shadows.md,
        minHeight: 110, // Ensure consistent height
        justifyContent: 'center',
    },
    gradientStatCard: {
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        flex: 1,
        alignItems: 'center',
        marginHorizontal: 4,
        ...shadows.md,
        minHeight: 110,
        justifyContent: 'center',
    },
    statContent: {
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
    },
    statValue: {
        fontSize: typography.fontSize.xl, // Slightly smaller
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
        fontSize: 10, // Smaller font for labels
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
        color: '#2D3748',
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
        backgroundColor: '#EDF2F7',
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
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
        elevation: 1,
    },
    filterBtnText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#718096',
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
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    dateItemActive: {
        backgroundColor: '#3182CE',
        borderColor: '#3182CE',
    },
    dateDay: {
        fontSize: 12,
        color: '#718096',
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
    reviewCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginRight: 12,
        width: 200,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    reviewClientName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2D3748',
        marginBottom: 8,
    },
    reviewGoalBadge: {
        backgroundColor: '#EBF8FF',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start',
        marginBottom: 8,
    },
    reviewGoalText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#3182CE',
    },
    reviewWeek: {
        fontSize: 13,
        color: '#718096',
        marginBottom: 12,
    },
    reviewButton: {
        backgroundColor: '#3182CE',
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    reviewButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
        marginRight: 4,
    },
    sessionCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    sessionTime: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 16,
    },
    sessionTimeText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2D3748',
        marginLeft: 6,
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
    sessionButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    managementCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    managementOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
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
    },
    analyticsCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    chartPlaceholder: {
        height: 120,
        backgroundColor: '#EDF2F7',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    chartPlaceholderText: {
        fontSize: 16,
        color: '#A0AEC0',
    },
    metricsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
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
    notificationsCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    notificationItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
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
    sessionStatus: {
        fontSize: 12,
        color: '#718096',
        marginTop: 2,
        textTransform: 'capitalize',
        fontWeight: '500',
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
