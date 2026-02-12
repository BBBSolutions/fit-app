import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform, Dimensions, Image, useWindowDimensions, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import AdminDrawer from '../../components/AdminDrawer';
import { adminApi } from '../../services/adminApi';

const isWeb = Platform.OS === 'web';

const AdminDashboardScreen = ({ navigation, route }) => {
    const { branchId, gymCode, branchName } = route.params || {};
    // React.useEffect(() => {
    //    alert(`Params: ${JSON.stringify(route.params)}`);
    // }, [route.params]);
    const [drawerVisible, setDrawerVisible] = useState(false);
    const { width } = useWindowDimensions();
    const isMobile = width < 768;

    const [stats, setStats] = useState({
        activeMembers: 0,
        activeTrainers: 0,
        monthlyRevenue: 0,
        leads: 0,
        recentActivity: [],
        pendingTasks: [],
        leadsSummary: [],
        upcomingEvents: []
    });
    const [loading, setLoading] = useState(true);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const data = await adminApi.getDashboardStats(branchId);
            setStats({
                ...data,
                // Ensure arrays are at least empty arrays if undefined
                recentActivity: data.recentActivity || [],
                pendingTasks: data.pendingTasks || [],
                leadsSummary: data.leadsSummary || [],
                upcomingEvents: data.upcomingEvents || []
            });
        } catch (error) {
            console.error("Failed to fetch admin stats:", error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        React.useCallback(() => {
            if (branchId) {
                fetchStats();
            } else {
                // Should not happen via normal flow, but prevents default data leak
                // console.warn("Dashboard stats skipped: No Branch ID");
            }
        }, [branchId])
    );

    const kpis = [
        { title: 'Active Members', value: loading ? '...' : stats.activeMembers, change: null, trend: null, icon: 'people' },
        { title: 'Active Trainers', value: loading ? '...' : stats.activeTrainers, change: null, trend: null, icon: 'fitness' },
        { title: 'Total Revenue', value: loading ? '...' : `₹ ${stats.monthlyRevenue}`, change: null, trend: null, icon: 'cash' },
        { title: 'New Leads', value: loading ? '...' : stats.leads, change: null, trend: null, icon: 'trending-up' },
        // { title: 'Open Inquiries', value: '0', change: null, trend: null, icon: 'chatbubbles' }, // Hidden until implemented
    ];

    const quickActions = [
        { label: 'Add Member', icon: 'person-add', route: 'AdminUserOnboarding' },
        { label: 'Add Trainer', icon: 'id-card', route: 'AdminUserOnboarding' },
        { label: 'Create Plan', icon: 'calendar', route: 'EditWorkoutPlan' },
        { label: 'Invite Link', icon: 'link', route: 'AdminUserOnboarding' },
        { label: 'View Billing', icon: 'card', route: 'AdminBilling' },
        // { label: 'Analytics', icon: 'bar-chart', route: 'AdminAnalytics' },
    ];

    // Data is now in 'stats' state

    // Simple Chart Component (Placeholder for future data)
    const SimpleLineChart = ({ height = 60, color = '#3182CE', data = [] }) => {
        if (!data || data.length === 0) {
            return (
                <View style={{ height, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F7FAFC', borderRadius: 8 }}>
                    <Text style={{ fontSize: 12, color: '#A0AEC0' }}>No data available</Text>
                </View>
            );
        }
        return (
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', height, gap: 4 }}>
                {data.map((h, i) => (
                    <View key={i} style={{ flex: 1, backgroundColor: color, height: `${h}%`, borderRadius: 2, opacity: 0.6 }} />
                ))}
            </View>
        );
    };

    const SimpleBarChart = ({ height = 60, color = '#805AD5', data = [] }) => {
        if (!data || data.length === 0) {
            return (
                <View style={{ height, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F7FAFC', borderRadius: 8 }}>
                    <Text style={{ fontSize: 12, color: '#A0AEC0' }}>No data available</Text>
                </View>
            );
        }
        return (
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', height, gap: 4 }}>
                {data.map((h, i) => (
                    <View key={i} style={{ flex: 1, backgroundColor: color, height: `${h}%`, borderRadius: 2, opacity: 0.8 }} />
                ))}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <AdminDrawer
                visible={drawerVisible}
                onClose={() => setDrawerVisible(false)}
                navigation={navigation}
                currentScreen="AdminDashboard"
                extraParams={{ branchId, gymCode, branchName }}
            />

            {/* Sidebar - Desktop Only */}
            {!isMobile && (
                <View style={styles.sidebar}>
                    <View style={styles.sidebarHeader}>
                        <Ionicons name="fitness" size={32} color="#3182CE" />
                        <Text style={styles.sidebarTitle}>FitPlatform</Text>
                    </View>
                    <TouchableOpacity style={styles.sidebarItemActive}>
                        <Ionicons name="grid-outline" size={20} color="#3182CE" />
                        <Text style={styles.sidebarItemTextActive}>Dashboard</Text>
                    </TouchableOpacity>
                    {/* <TouchableOpacity style={styles.sidebarItem} onPress={() => navigation.navigate('AdminContentManager', { branchId, gymCode, branchName })}>
                        <Ionicons name="document-text-outline" size={20} color="#4A5568" />
                        <Text style={styles.sidebarItemText}>Content</Text>
                    </TouchableOpacity> */}
                    <TouchableOpacity style={styles.sidebarItem} onPress={() => navigation.navigate('AdminLeadManagement', { branchId, gymCode, branchName })}>
                        <Ionicons name="funnel-outline" size={20} color="#4A5568" />
                        <Text style={styles.sidebarItemText}>Leads</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.sidebarItem} onPress={() => navigation.navigate('AdminBranding', { branchId, gymCode, branchName })}>
                        <Ionicons name="color-palette-outline" size={20} color="#4A5568" />
                        <Text style={styles.sidebarItemText}>Branding</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.sidebarItem} onPress={() => navigation.navigate('AdminUserOnboarding', { branchId, gymCode, branchName })}>
                        <Ionicons name="people-outline" size={20} color="#4A5568" />
                        <Text style={styles.sidebarItemText}>Users</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.sidebarItem} onPress={() => navigation.navigate('AdminBilling', { branchId, gymCode, branchName })}>
                        <Ionicons name="card-outline" size={20} color="#4A5568" />
                        <Text style={styles.sidebarItemText}>Billing</Text>
                    </TouchableOpacity>
                    {/* <TouchableOpacity style={styles.sidebarItem} onPress={() => navigation.navigate('AdminAnalytics', { branchId, gymCode, branchName })}>
                        <Ionicons name="bar-chart-outline" size={20} color="#4A5568" />
                        <Text style={styles.sidebarItemText}>Analytics</Text>
                    </TouchableOpacity> */}
                    <TouchableOpacity style={styles.sidebarItem} onPress={() => navigation.navigate('AdminSettings', { branchId, gymCode, branchName })}>
                        <Ionicons name="settings-outline" size={20} color="#4A5568" />
                        <Text style={styles.sidebarItemText}>Settings</Text>
                    </TouchableOpacity>
                </View>
            )}

            <View style={styles.mainContent}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        {isMobile && (
                            <TouchableOpacity
                                onPress={() => setDrawerVisible(true)}
                                style={styles.hamburgerButton}
                            >
                                <Ionicons name="menu" size={28} color="#2D3748" />
                            </TouchableOpacity>
                        )}
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.pageTitle, isMobile && { fontSize: 20 }]}>Dashboard Overview {branchName ? `- ${branchName}` : ''}</Text>
                            <Text style={styles.pageSubtitle}>Manage your gym operations, performance, and activity in one place.</Text>
                        </View>
                    </View>
                    <View style={styles.headerControls}>
                        <TouchableOpacity
                            style={[styles.iconButton, { flexDirection: 'row', gap: 8, paddingHorizontal: 12 }]}
                            onPress={() => navigation.navigate('OwnerBranchList')}
                        >
                            <Ionicons name="business-outline" size={20} color="#4A5568" />
                            <Text style={{ color: '#4A5568', fontWeight: '600', fontSize: 14 }}>Switch Branch</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.iconButton} onPress={fetchStats}>
                            <Ionicons name="refresh-outline" size={20} color={loading ? "#A0AEC0" : "#4A5568"} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('AdminSettings')}>
                            <Ionicons name="settings-outline" size={20} color="#4A5568" />
                        </TouchableOpacity>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>AD</Text>
                        </View>
                    </View>
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {/* KPI Summary */}
                    <View style={styles.kpiGrid}>
                        {kpis.map((kpi, index) => (
                            <View key={index} style={styles.kpiCard}>
                                <View style={styles.kpiHeader}>
                                    <View style={styles.kpiIcon}>
                                        <Ionicons name={kpi.icon} size={18} color="#3182CE" />
                                    </View>
                                    {kpi.change && (
                                        <View style={[styles.trendBadge, kpi.trend === 'up' ? styles.trendUp : styles.trendDown]}>
                                            <Text style={[styles.trendText, kpi.trend === 'up' ? styles.textUp : styles.textDown]}>{kpi.change}</Text>
                                        </View>
                                    )}
                                </View>
                                <Text style={styles.kpiValue}>{kpi.value}</Text>
                                <Text style={styles.kpiTitle}>{kpi.title}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Main Grid Layout */}
                    <View style={[styles.gridContainer, isMobile && styles.gridContainerMobile]}>
                        {/* Left Column (Main Content) */}
                        <View style={styles.leftColumn}>

                            {/* Activity Snapshot - Hidden
                            <View style={styles.sectionCard}>
                                <Text style={styles.cardTitle}>Activity Snapshot</Text>
                                <View style={styles.chartsRow}>
                                    <View style={styles.chartContainer}>
                                        <Text style={styles.chartLabel}>Member Engagement</Text>
                                        <SimpleLineChart height={100} color="#3182CE" />
                                    </View>
                                    <View style={styles.chartContainer}>
                                        <Text style={styles.chartLabel}>Trainer Productivity</Text>
                                        <SimpleBarChart height={100} color="#805AD5" />
                                    </View>
                                </View>
                            </View>
                            */}

                            {/* Quick Actions */}
                            <Text style={styles.sectionTitle}>Quick Actions</Text>
                            <View style={styles.quickActionsGrid}>
                                {quickActions.map((action, i) => (
                                    <TouchableOpacity
                                        key={i}
                                        style={[styles.actionCard, isMobile && { width: '47%' }]}
                                        onPress={() => action.route && navigation.navigate(action.route, { branchId, gymCode, branchName })}
                                    >
                                        <Ionicons name={action.icon} size={24} color="#4A5568" />
                                        <Text style={styles.actionLabel}>{action.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Recent Activity Feed */}
                            <View style={styles.sectionCard}>
                                <Text style={styles.cardTitle}>Recent Activity</Text>
                                <View style={styles.activityList}>
                                    {stats.recentActivity.length === 0 ? (
                                        <Text style={{ color: '#A0AEC0', fontStyle: 'italic', padding: 8 }}>No recent activity to show.</Text>
                                    ) : (
                                        stats.recentActivity.map(item => (
                                            <View key={item.id} style={styles.activityItem}>
                                                <View style={[styles.activityIcon, { backgroundColor: item.color + '20' }]}>
                                                    <Ionicons name={item.icon} size={16} color={item.color} />
                                                </View>
                                                <View style={styles.activityContent}>
                                                    <Text style={styles.activityText}>{item.text}</Text>
                                                    <Text style={styles.activityTime}>{item.time}</Text>
                                                </View>
                                            </View>
                                        ))
                                    )}
                                </View>
                            </View>
                        </View>

                        {/* Right Column (Sidebar Widgets) */}
                        <View style={styles.rightColumn}>
                            {/* Pending Tasks - Hidden
                            <View style={styles.card}>
                                <Text style={styles.cardTitle}>Pending Tasks</Text>
                                {stats.pendingTasks.length === 0 ? (
                                    <Text style={{ color: '#A0AEC0', fontStyle: 'italic', padding: 8 }}>No pending tasks.</Text>
                                ) : (
                                    stats.pendingTasks.map(task => (
                                        <View key={task.id} style={styles.taskItem}>
                                            <View style={styles.taskContent}>
                                                <Text style={styles.taskText}>{task.text}</Text>
                                                <View style={[styles.severityDot, task.severity === 'high' ? { backgroundColor: '#E53E3E' } : { backgroundColor: '#D69E2E' }]} />
                                            </View>
                                            <TouchableOpacity style={styles.taskButton}>
                                                <Text style={styles.taskButtonText}>{task.action}</Text>
                                            </TouchableOpacity>
                                        </View>
                                    ))
                                )}
                            </View>
                            */}

                            {/* Leads Summary */}
                            <View style={styles.card}>
                                <Text style={styles.cardTitle}>Leads Summary</Text>
                                {stats.leadsSummary.length === 0 ? (
                                    <Text style={{ color: '#A0AEC0', fontStyle: 'italic', padding: 8 }}>No leads data available.</Text>
                                ) : (
                                    <View style={styles.tableContainer}>
                                        <View style={styles.tableRowHeader}>
                                            <Text style={[styles.tableCell, { flex: 2 }]}>Source</Text>
                                            <Text style={[styles.tableCell, { flex: 1 }]}>New</Text>
                                            <Text style={[styles.tableCell, { flex: 1 }]}>Conv.</Text>
                                        </View>
                                        {stats.leadsSummary.map((lead, i) => (
                                            <View key={i} style={styles.tableRow}>
                                                <Text style={[styles.tableCell, { flex: 2 }]}>{lead.source}</Text>
                                                <Text style={[styles.tableCell, { flex: 1, fontWeight: 'bold' }]}>{lead.count}</Text>
                                                <Text style={[styles.tableCell, { flex: 1, color: '#38A169' }]}>{lead.conversion}</Text>
                                            </View>
                                        ))}
                                    </View>
                                )}
                            </View>

                            {/* Upcoming Events - Hidden
                            <View style={styles.card}>
                                <Text style={styles.cardTitle}>Upcoming Events</Text>
                                {stats.upcomingEvents.length === 0 ? (
                                    <Text style={{ color: '#A0AEC0', fontStyle: 'italic', padding: 8 }}>No upcoming events.</Text>
                                ) : (
                                    stats.upcomingEvents.map((event, i) => (
                                        <View key={i} style={styles.eventItem}>
                                            <View style={styles.eventTimeBox}>
                                                <Text style={styles.eventTime}>{event.time}</Text>
                                            </View>
                                            <View>
                                                <Text style={styles.eventTitle}>{event.title}</Text>
                                                <Text style={styles.eventTrainer}>{event.trainer}</Text>
                                            </View>
                                        </View>
                                    ))
                                )}
                            </View>
                            */}
                        </View>
                    </View>
                </ScrollView>
            </View>
        </View >
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, flexDirection: 'row', backgroundColor: '#F7FAFC' },
    sidebar: { width: 250, backgroundColor: '#FFF', borderRightWidth: 1, borderRightColor: '#E2E8F0', paddingVertical: 24, paddingHorizontal: 16 },
    sidebarHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 40, paddingHorizontal: 8 },
    sidebarTitle: { fontSize: 20, fontWeight: 'bold', color: '#2D3748', marginLeft: 10 },
    sidebarItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 8, marginBottom: 4 },
    sidebarItemActive: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 8, marginBottom: 4, backgroundColor: '#EBF8FF' },
    sidebarItemText: { fontSize: 16, color: '#4A5568', marginLeft: 12 },
    sidebarItemTextActive: { fontSize: 16, color: '#3182CE', marginLeft: 12, fontWeight: '600' },

    mainContent: { flex: 1 },
    header: { padding: 32, paddingBottom: 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    pageTitle: { fontSize: 28, fontWeight: 'bold', color: '#1A202C', marginBottom: 8 },
    pageSubtitle: { fontSize: 16, color: '#718096' },
    headerControls: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    iconButton: { padding: 8, borderRadius: 8, backgroundColor: '#F7FAFC' },
    hamburgerButton: { padding: 8, marginRight: 4 },
    avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#3182CE', justifyContent: 'center', alignItems: 'center' },
    avatarText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },

    scrollContent: { padding: 32 },

    kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 24, marginBottom: 32 },
    kpiCard: { flex: 1, minWidth: 180, backgroundColor: '#FFF', padding: 20, borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
    kpiHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    kpiIcon: { padding: 8, backgroundColor: '#EBF8FF', borderRadius: 8 },
    trendBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 12 },
    trendUp: { backgroundColor: '#F0FFF4' },
    trendDown: { backgroundColor: '#FFF5F5' },
    trendText: { fontSize: 12, fontWeight: '600' },
    textUp: { color: '#38A169' },
    textDown: { color: '#E53E3E' },
    kpiValue: { fontSize: 24, fontWeight: 'bold', color: '#2D3748', marginBottom: 4 },
    kpiTitle: { fontSize: 13, color: '#718096' },

    gridContainer: { flexDirection: 'row', gap: 24 },
    gridContainerMobile: { flexDirection: 'column' },
    leftColumn: { flex: 2, gap: 32 },
    rightColumn: { flex: 1, gap: 24 },

    sectionCard: { backgroundColor: '#FFF', padding: 24, borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
    cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#2D3748', marginBottom: 16 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#2D3748', marginBottom: 16 },

    chartsRow: { flexDirection: 'row', gap: 24 },
    chartContainer: { flex: 1 },
    chartLabel: { fontSize: 14, color: '#718096', marginBottom: 12 },

    quickActionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
    actionCard: { width: '30%', backgroundColor: '#FFF', padding: 20, borderRadius: 12, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2, gap: 12 },
    actionLabel: { fontSize: 14, fontWeight: '600', color: '#4A5568' },

    activityList: { gap: 16 },
    activityItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
    activityIcon: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    activityContent: { flex: 1 },
    activityText: { fontSize: 14, color: '#2D3748', marginBottom: 2 },
    activityTime: { fontSize: 12, color: '#718096' },

    card: { backgroundColor: '#FFF', padding: 20, borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
    taskItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F7FAFC' },
    taskContent: { flex: 1 },
    taskText: { fontSize: 14, color: '#2D3748', marginBottom: 4 },
    severityDot: { width: 8, height: 8, borderRadius: 4 },
    taskButton: { paddingVertical: 4, paddingHorizontal: 12, backgroundColor: '#EDF2F7', borderRadius: 6 },
    taskButtonText: { fontSize: 12, fontWeight: '600', color: '#4A5568' },

    tableContainer: { marginTop: 8 },
    tableRowHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingBottom: 8, marginBottom: 8 },
    tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F7FAFC' },
    tableCell: { fontSize: 13, color: '#2D3748' },

    eventItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F7FAFC' },
    eventTimeBox: { backgroundColor: '#EBF8FF', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6 },
    eventTime: { fontSize: 12, fontWeight: '600', color: '#3182CE' },
    eventTitle: { fontSize: 14, fontWeight: '600', color: '#2D3748' },
    eventTrainer: { fontSize: 12, color: '#718096' },
});

export default AdminDashboardScreen;
