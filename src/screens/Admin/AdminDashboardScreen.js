import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform, Dimensions, Image, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AdminDrawer from '../../components/AdminDrawer';

const isWeb = Platform.OS === 'web';

const AdminDashboardScreen = ({ navigation }) => {
    const [drawerVisible, setDrawerVisible] = useState(false);
    const { width } = useWindowDimensions();
    const isMobile = width < 768;

    // Mock Data
    const kpis = [
        { title: 'Active Members', value: '1,240', change: '+12%', trend: 'up', icon: 'people' },
        { title: 'Active Trainers', value: '45', change: '+5%', trend: 'up', icon: 'fitness' },
        { title: 'Revenue (Month)', value: '₹ 42.5L', change: '+8.5%', trend: 'up', icon: 'cash' },
        { title: 'New Leads', value: '128', change: '+15%', trend: 'up', icon: 'trending-up' },
        { title: 'Open Inquiries', value: '12', change: '-2%', trend: 'down', icon: 'chatbubbles' }, // down is good here? context dependent, assuming generic up=good for now or just visual
    ];

    const quickActions = [
        { label: 'Add Member', icon: 'person-add', route: 'AdminUserOnboarding' },
        { label: 'Add Trainer', icon: 'id-card', route: 'AdminUserOnboarding' },
        { label: 'Create Plan', icon: 'calendar', route: 'EditWorkoutPlan' },
        { label: 'Invite Link', icon: 'link', route: 'AdminUserOnboarding' },
        { label: 'View Billing', icon: 'card', route: 'AdminBilling' },
        { label: 'Analytics', icon: 'bar-chart', route: 'AdminAnalytics' },
    ];

    const recentActivity = [
        { id: 1, text: 'New member sign-up: Alice Johnson', time: '2 mins ago', icon: 'person-add', color: '#3182CE' },
        { id: 2, text: 'Trainer Mike approved a workout plan', time: '15 mins ago', icon: 'checkmark-circle', color: '#38A169' },
        { id: 3, text: 'Payment received from Bob Smith', time: '1 hour ago', icon: 'cash', color: '#38A169' },
        { id: 4, text: 'Failed payment alert: David Lee', time: '2 hours ago', icon: 'alert-circle', color: '#E53E3E' },
        { id: 5, text: 'New inquiry: "Personal Training rates?"', time: '3 hours ago', icon: 'chatbubble', color: '#D69E2E' },
    ];

    const pendingTasks = [
        { id: 1, text: '3 Pending trainer approvals', severity: 'high', action: 'Review' },
        { id: 2, text: '5 Users without assigned trainers', severity: 'medium', action: 'Assign' },
        { id: 3, text: '2 Overdue payments', severity: 'high', action: 'View' },
        { id: 4, text: 'Payment gateway sync warning', severity: 'medium', action: 'Fix' },
    ];

    const leadsSummary = [
        { source: 'Walk-in', count: 15, conversion: '60%' },
        { source: 'Website', count: 45, conversion: '12%' },
        { source: 'Referral', count: 22, conversion: '40%' },
    ];

    const upcomingEvents = [
        { title: 'Group HIIT Session', time: '10:00 AM', trainer: 'Sarah' },
        { title: 'New Member Orientation', time: '2:00 PM', trainer: 'Mike' },
        { title: 'Staff Meeting', time: '5:00 PM', trainer: 'Admin' },
    ];

    // Simple Chart Component (Mock)
    const SimpleLineChart = ({ height = 60, color = '#3182CE' }) => (
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', height, gap: 4 }}>
            {[30, 45, 35, 60, 50, 70, 65, 85, 75, 90].map((h, i) => (
                <View key={i} style={{ flex: 1, backgroundColor: color, height: `${h}%`, borderRadius: 2, opacity: 0.6 }} />
            ))}
        </View>
    );

    const SimpleBarChart = ({ height = 60, color = '#805AD5' }) => (
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', height, gap: 4 }}>
            {[40, 60, 45, 80, 55, 70, 65, 90, 50, 75].map((h, i) => (
                <View key={i} style={{ flex: 1, backgroundColor: color, height: `${h}%`, borderRadius: 2, opacity: 0.8 }} />
            ))}
        </View>
    );

    return (
        <View style={styles.container}>
            <AdminDrawer
                visible={drawerVisible}
                onClose={() => setDrawerVisible(false)}
                navigation={navigation}
                currentScreen="AdminDashboard"
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
                    <TouchableOpacity style={styles.sidebarItem} onPress={() => navigation.navigate('AdminContentManager')}>
                        <Ionicons name="document-text-outline" size={20} color="#4A5568" />
                        <Text style={styles.sidebarItemText}>Content</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.sidebarItem} onPress={() => navigation.navigate('AdminLeadManagement')}>
                        <Ionicons name="funnel-outline" size={20} color="#4A5568" />
                        <Text style={styles.sidebarItemText}>Leads</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.sidebarItem} onPress={() => navigation.navigate('AdminBranding')}>
                        <Ionicons name="color-palette-outline" size={20} color="#4A5568" />
                        <Text style={styles.sidebarItemText}>Branding</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.sidebarItem} onPress={() => navigation.navigate('AdminUserOnboarding')}>
                        <Ionicons name="people-outline" size={20} color="#4A5568" />
                        <Text style={styles.sidebarItemText}>Users</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.sidebarItem} onPress={() => navigation.navigate('AdminBilling')}>
                        <Ionicons name="card-outline" size={20} color="#4A5568" />
                        <Text style={styles.sidebarItemText}>Billing</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.sidebarItem} onPress={() => navigation.navigate('AdminAnalytics')}>
                        <Ionicons name="bar-chart-outline" size={20} color="#4A5568" />
                        <Text style={styles.sidebarItemText}>Analytics</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.sidebarItem} onPress={() => navigation.navigate('AdminSettings')}>
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
                        <View>
                            <Text style={styles.pageTitle}>Dashboard Overview</Text>
                            <Text style={styles.pageSubtitle}>Manage your gym operations, performance, and activity in one place.</Text>
                        </View>
                    </View>
                    <View style={styles.headerControls}>
                        <TouchableOpacity style={styles.iconButton}>
                            <Ionicons name="refresh-outline" size={20} color="#4A5568" />
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
                                    <View style={[styles.trendBadge, kpi.trend === 'up' ? styles.trendUp : styles.trendDown]}>
                                        <Text style={[styles.trendText, kpi.trend === 'up' ? styles.textUp : styles.textDown]}>{kpi.change}</Text>
                                    </View>
                                </View>
                                <Text style={styles.kpiValue}>{kpi.value}</Text>
                                <Text style={styles.kpiTitle}>{kpi.title}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Main Grid Layout */}
                    <View style={styles.gridContainer}>
                        {/* Left Column (Main Content) */}
                        <View style={styles.leftColumn}>
                            {/* Activity Snapshot */}
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

                            {/* Quick Actions */}
                            <Text style={styles.sectionTitle}>Quick Actions</Text>
                            <View style={styles.quickActionsGrid}>
                                {quickActions.map((action, i) => (
                                    <TouchableOpacity
                                        key={i}
                                        style={styles.actionCard}
                                        onPress={() => action.route && navigation.navigate(action.route)}
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
                                    {recentActivity.map(item => (
                                        <View key={item.id} style={styles.activityItem}>
                                            <View style={[styles.activityIcon, { backgroundColor: item.color + '20' }]}>
                                                <Ionicons name={item.icon} size={16} color={item.color} />
                                            </View>
                                            <View style={styles.activityContent}>
                                                <Text style={styles.activityText}>{item.text}</Text>
                                                <Text style={styles.activityTime}>{item.time}</Text>
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        </View>

                        {/* Right Column (Sidebar Widgets) */}
                        <View style={styles.rightColumn}>
                            {/* Pending Tasks */}
                            <View style={styles.card}>
                                <Text style={styles.cardTitle}>Pending Tasks</Text>
                                {pendingTasks.map(task => (
                                    <View key={task.id} style={styles.taskItem}>
                                        <View style={styles.taskContent}>
                                            <Text style={styles.taskText}>{task.text}</Text>
                                            <View style={[styles.severityDot, task.severity === 'high' ? { backgroundColor: '#E53E3E' } : { backgroundColor: '#D69E2E' }]} />
                                        </View>
                                        <TouchableOpacity style={styles.taskButton}>
                                            <Text style={styles.taskButtonText}>{task.action}</Text>
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>

                            {/* Leads Summary */}
                            <View style={styles.card}>
                                <Text style={styles.cardTitle}>Leads Summary</Text>
                                <View style={styles.tableContainer}>
                                    <View style={styles.tableRowHeader}>
                                        <Text style={[styles.tableCell, { flex: 2 }]}>Source</Text>
                                        <Text style={[styles.tableCell, { flex: 1 }]}>New</Text>
                                        <Text style={[styles.tableCell, { flex: 1 }]}>Conv.</Text>
                                    </View>
                                    {leadsSummary.map((lead, i) => (
                                        <View key={i} style={styles.tableRow}>
                                            <Text style={[styles.tableCell, { flex: 2 }]}>{lead.source}</Text>
                                            <Text style={[styles.tableCell, { flex: 1, fontWeight: 'bold' }]}>{lead.count}</Text>
                                            <Text style={[styles.tableCell, { flex: 1, color: '#38A169' }]}>{lead.conversion}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>

                            {/* Upcoming Events */}
                            <View style={styles.card}>
                                <Text style={styles.cardTitle}>Upcoming Events</Text>
                                {upcomingEvents.map((event, i) => (
                                    <View key={i} style={styles.eventItem}>
                                        <View style={styles.eventTimeBox}>
                                            <Text style={styles.eventTime}>{event.time}</Text>
                                        </View>
                                        <View>
                                            <Text style={styles.eventTitle}>{event.title}</Text>
                                            <Text style={styles.eventTrainer}>{event.trainer}</Text>
                                        </View>
                                    </View>
                                ))}
                            </View>
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
