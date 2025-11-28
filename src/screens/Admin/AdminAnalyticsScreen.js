import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform, Dimensions, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

const AdminAnalyticsScreen = ({ navigation }) => {
    const [dateRange, setDateRange] = useState('30 Days');
    const [chartMetric, setChartMetric] = useState('Revenue');

    // Mock Data
    const kpis = [
        { title: 'Active Members', value: '1,240', change: '+12%', trend: 'up' },
        { title: 'Active Trainers', value: '45', change: '+5%', trend: 'up' },
        { title: 'Monthly Revenue', value: '₹ 42.5L', change: '+8.5%', trend: 'up' },
        { title: 'New Sign-ups', value: '128', change: '-2%', trend: 'down' },
        { title: 'Churn Rate', value: '4.2%', change: '-0.5%', trend: 'up' }, // 'up' here means good (decrease in churn)
        { title: 'Conversion Rate', value: '22%', change: '+1.5%', trend: 'up' },
    ];

    const funnelData = [
        { label: 'Visitors', value: 5000, color: '#E2E8F0' },
        { label: 'Leads', value: 2500, color: '#CBD5E0' },
        { label: 'Signups', value: 1000, color: '#A0AEC0' },
        { label: 'App Installed', value: 800, color: '#718096' },
        { label: 'Active Member', value: 400, color: '#2D3748' },
    ];

    const inquiries = [
        { source: 'Website', count: 450, status: 'Open', conversion: '15%' },
        { source: 'Referral', count: 120, status: 'Closed', conversion: '40%' },
        { source: 'Campaign', count: 300, status: 'In Progress', conversion: '10%' },
        { source: 'Walk-in', count: 50, status: 'Closed', conversion: '60%' },
    ];

    const trainers = [
        { name: 'Sarah Smith', clients: 24, response: '15m', workouts: 145, rating: 4.9 },
        { name: 'Mike Jones', clients: 18, response: '45m', workouts: 98, rating: 4.7 },
        { name: 'Jane Roe', clients: 30, response: '10m', workouts: 210, rating: 5.0 },
    ];

    const alerts = [
        { type: 'error', message: 'Payment gateway sync failed for 3 transactions.' },
        { type: 'warning', message: '5 Trainer approvals pending.' },
        { type: 'info', message: 'New feature "Diet Logs" is now active.' },
    ];

    // Simple Chart Component (Mock)
    const SimpleBarChart = ({ height = 100, color = '#3182CE' }) => (
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', height, gap: 4 }}>
            {[40, 60, 45, 80, 55, 70, 65, 90, 50, 75, 60, 85].map((h, i) => (
                <View key={i} style={{ flex: 1, backgroundColor: color, height: `${h}%`, borderRadius: 2, opacity: 0.8 }} />
            ))}
        </View>
    );

    const SimpleLineChart = ({ height = 100, color = '#38A169' }) => (
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', height, gap: 4 }}>
            {[30, 40, 35, 50, 45, 60, 55, 70, 65, 80, 75, 90].map((h, i) => (
                <View key={i} style={{ flex: 1, backgroundColor: color, height: `${h}%`, borderRadius: 2, opacity: 0.6 }} />
            ))}
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Sidebar */}
            {isWeb && width > 768 && (
                <View style={styles.sidebar}>
                    <View style={styles.sidebarHeader}>
                        <Ionicons name="fitness" size={32} color="#3182CE" />
                        <Text style={styles.sidebarTitle}>FitPlatform</Text>
                    </View>
                    <TouchableOpacity style={styles.sidebarItem} onPress={() => navigation.navigate('AdminDashboard')}>
                        <Ionicons name="grid-outline" size={20} color="#4A5568" />
                        <Text style={styles.sidebarItemText}>Dashboard</Text>
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
                    <TouchableOpacity style={styles.sidebarItemActive}>
                        <Ionicons name="bar-chart-outline" size={20} color="#3182CE" />
                        <Text style={styles.sidebarItemTextActive}>Analytics</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.sidebarItem} onPress={() => navigation.navigate('AdminSettings')}>
                        <Ionicons name="settings-outline" size={20} color="#4A5568" />
                        <Text style={styles.sidebarItemText}>Settings</Text>
                    </TouchableOpacity>
                </View>
            )}

            <View style={styles.mainContent}>
                {/* Sticky Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.pageTitle}>Analytics & Monitoring</Text>
                        <Text style={styles.pageSubtitle}>Track gym performance, user engagement, revenue trends, and inquiries.</Text>
                    </View>
                    <View style={styles.headerControls}>
                        <View style={styles.datePicker}>
                            {['Today', '7 Days', '30 Days', 'Custom'].map(d => (
                                <TouchableOpacity
                                    key={d}
                                    style={[styles.dateOption, dateRange === d && styles.dateOptionActive]}
                                    onPress={() => setDateRange(d)}
                                >
                                    <Text style={[styles.dateText, dateRange === d && styles.dateTextActive]}>{d}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <TouchableOpacity style={styles.exportButton}>
                            <Ionicons name="download-outline" size={18} color="#4A5568" />
                            <Text style={styles.exportButtonText}>Export</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {/* KPI Grid */}
                    <View style={styles.kpiGrid}>
                        {kpis.map((kpi, index) => (
                            <View key={index} style={styles.kpiCard}>
                                <Text style={styles.kpiTitle}>{kpi.title}</Text>
                                <View style={styles.kpiRow}>
                                    <Text style={styles.kpiValue}>{kpi.value}</Text>
                                    <View style={[styles.trendBadge, kpi.trend === 'up' ? styles.trendUp : styles.trendDown]}>
                                        <Ionicons name={kpi.trend === 'up' ? "arrow-up" : "arrow-down"} size={12} color={kpi.trend === 'up' ? "#38A169" : "#E53E3E"} />
                                        <Text style={[styles.trendText, kpi.trend === 'up' ? styles.textUp : styles.textDown]}>{kpi.change}</Text>
                                    </View>
                                </View>
                                <View style={styles.sparkline}>
                                    <SimpleLineChart height={30} color={kpi.trend === 'up' ? "#C6F6D5" : "#FED7D7"} />
                                </View>
                            </View>
                        ))}
                    </View>

                    {/* Engagement Charts */}
                    <View style={styles.chartsRow}>
                        <View style={styles.chartCard}>
                            <Text style={styles.cardTitle}>Member Activity</Text>
                            <Text style={styles.chartSubtitle}>Workouts logged per day</Text>
                            <View style={styles.chartContainer}>
                                <SimpleLineChart height={150} color="#3182CE" />
                            </View>
                        </View>
                        <View style={styles.chartCard}>
                            <Text style={styles.cardTitle}>Trainer Activity</Text>
                            <Text style={styles.chartSubtitle}>Sessions & Plans created</Text>
                            <View style={styles.chartContainer}>
                                <SimpleBarChart height={150} color="#805AD5" />
                            </View>
                        </View>
                    </View>

                    {/* Billing Trends */}
                    <View style={styles.sectionCard}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.cardTitle}>Billing & Revenue Trends</Text>
                            <View style={styles.toggleGroup}>
                                {['Revenue', 'Subscribers', 'Failures'].map(m => (
                                    <TouchableOpacity
                                        key={m}
                                        style={[styles.toggleBtn, chartMetric === m && styles.toggleBtnActive]}
                                        onPress={() => setChartMetric(m)}
                                    >
                                        <Text style={[styles.toggleText, chartMetric === m && styles.toggleTextActive]}>{m}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                        <View style={styles.largeChart}>
                            <SimpleLineChart height={200} color="#38A169" />
                        </View>
                    </View>

                    <View style={styles.gridContainer}>
                        {/* User Funnel */}
                        <View style={styles.card}>
                            <Text style={styles.cardTitle}>User Funnel</Text>
                            <View style={styles.funnelContainer}>
                                {funnelData.map((step, i) => (
                                    <View key={i} style={styles.funnelStep}>
                                        <View style={[styles.funnelBar, { width: `${(step.value / 5000) * 100}%`, backgroundColor: step.color }]}>
                                            <Text style={styles.funnelLabel}>{step.label}</Text>
                                        </View>
                                        <Text style={styles.funnelValue}>{step.value}</Text>
                                        <Text style={styles.funnelPercent}>{Math.round((step.value / 5000) * 100)}%</Text>
                                    </View>
                                ))}
                            </View>
                        </View>

                        {/* Inquiry Management */}
                        <View style={styles.card}>
                            <Text style={styles.cardTitle}>Inquiry Summary</Text>
                            <View style={styles.tableContainer}>
                                <View style={styles.tableRowHeader}>
                                    <Text style={[styles.tableCell, { flex: 2 }]}>Source</Text>
                                    <Text style={[styles.tableCell, { flex: 1 }]}>Count</Text>
                                    <Text style={[styles.tableCell, { flex: 1.5 }]}>Status</Text>
                                    <Text style={[styles.tableCell, { flex: 1 }]}>Conv.</Text>
                                </View>
                                {inquiries.map((inq, i) => (
                                    <View key={i} style={styles.tableRow}>
                                        <Text style={[styles.tableCell, { flex: 2 }]}>{inq.source}</Text>
                                        <Text style={[styles.tableCell, { flex: 1 }]}>{inq.count}</Text>
                                        <View style={[styles.tableCell, { flex: 1.5 }]}>
                                            <View style={[styles.statusBadge, inq.status === 'Open' ? styles.statusWarning : styles.statusActive]}>
                                                <Text style={styles.statusTextSimple}>{inq.status}</Text>
                                            </View>
                                        </View>
                                        <Text style={[styles.tableCell, { flex: 1 }]}>{inq.conversion}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    </View>

                    {/* Trainer Leaderboard & Alerts */}
                    <View style={styles.gridContainer}>
                        <View style={[styles.card, { flex: 2 }]}>
                            <Text style={styles.cardTitle}>Trainer Leaderboard</Text>
                            <View style={styles.tableContainer}>
                                <View style={styles.tableRowHeader}>
                                    <Text style={[styles.tableCell, { flex: 2 }]}>Trainer</Text>
                                    <Text style={[styles.tableCell, { flex: 1 }]}>Clients</Text>
                                    <Text style={[styles.tableCell, { flex: 1 }]}>Response</Text>
                                    <Text style={[styles.tableCell, { flex: 1 }]}>Workouts</Text>
                                    <Text style={[styles.tableCell, { flex: 1 }]}>Rating</Text>
                                </View>
                                {trainers.map((t, i) => (
                                    <View key={i} style={styles.tableRow}>
                                        <Text style={[styles.tableCell, { flex: 2, fontWeight: '500' }]}>{i + 1}. {t.name}</Text>
                                        <Text style={[styles.tableCell, { flex: 1 }]}>{t.clients}</Text>
                                        <Text style={[styles.tableCell, { flex: 1 }]}>{t.response}</Text>
                                        <Text style={[styles.tableCell, { flex: 1 }]}>{t.workouts}</Text>
                                        <View style={[styles.tableCell, { flex: 1, flexDirection: 'row', alignItems: 'center' }]}>
                                            <Ionicons name="star" size={14} color="#D69E2E" />
                                            <Text style={{ marginLeft: 4 }}>{t.rating}</Text>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        </View>

                        <View style={[styles.card, { flex: 1 }]}>
                            <Text style={styles.cardTitle}>System Alerts</Text>
                            {alerts.map((alert, i) => (
                                <View key={i} style={[styles.alertItem, alert.type === 'error' ? styles.alertError : alert.type === 'warning' ? styles.alertWarning : styles.alertInfo]}>
                                    <Ionicons
                                        name={alert.type === 'error' ? "alert-circle" : alert.type === 'warning' ? "warning" : "information-circle"}
                                        size={20}
                                        color={alert.type === 'error' ? "#E53E3E" : alert.type === 'warning' ? "#D69E2E" : "#3182CE"}
                                    />
                                    <Text style={styles.alertText}>{alert.message}</Text>
                                </View>
                            ))}
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
    headerControls: { alignItems: 'flex-end', gap: 16 },
    datePicker: { flexDirection: 'row', backgroundColor: '#F7FAFC', borderRadius: 8, padding: 4 },
    dateOption: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6 },
    dateOptionActive: { backgroundColor: '#FFF', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2 },
    dateText: { fontSize: 13, color: '#718096' },
    dateTextActive: { color: '#2D3748', fontWeight: '600' },
    exportButton: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#CBD5E0', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 6 },
    exportButtonText: { marginLeft: 8, color: '#4A5568', fontWeight: '600' },

    scrollContent: { padding: 32 },

    kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 24, marginBottom: 32 },
    kpiCard: { flex: 1, minWidth: 200, backgroundColor: '#FFF', padding: 20, borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
    kpiTitle: { fontSize: 14, color: '#718096', marginBottom: 8 },
    kpiRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 12 },
    kpiValue: { fontSize: 24, fontWeight: 'bold', color: '#2D3748' },
    trendBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 12 },
    trendUp: { backgroundColor: '#F0FFF4' },
    trendDown: { backgroundColor: '#FFF5F5' },
    trendText: { fontSize: 12, marginLeft: 2, fontWeight: '600' },
    textUp: { color: '#38A169' },
    textDown: { color: '#E53E3E' },
    sparkline: { height: 30, justifyContent: 'flex-end' },

    chartsRow: { flexDirection: 'row', gap: 24, marginBottom: 32 },
    chartCard: { flex: 1, backgroundColor: '#FFF', padding: 24, borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
    cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#2D3748', marginBottom: 4 },
    chartSubtitle: { fontSize: 14, color: '#718096', marginBottom: 20 },
    chartContainer: { height: 150, justifyContent: 'flex-end' },

    sectionCard: { backgroundColor: '#FFF', padding: 24, borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2, marginBottom: 32 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    toggleGroup: { flexDirection: 'row', backgroundColor: '#F7FAFC', borderRadius: 8, padding: 4 },
    toggleBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6 },
    toggleBtnActive: { backgroundColor: '#FFF', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2 },
    toggleText: { fontSize: 13, color: '#718096' },
    toggleTextActive: { color: '#2D3748', fontWeight: '600' },
    largeChart: { height: 200, justifyContent: 'flex-end' },

    gridContainer: { flexDirection: 'row', gap: 24, marginBottom: 32 },
    card: { flex: 1, backgroundColor: '#FFF', padding: 24, borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },

    funnelContainer: { gap: 16 },
    funnelStep: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    funnelBar: { height: 32, borderRadius: 4, justifyContent: 'center', paddingHorizontal: 8, minWidth: 100 },
    funnelLabel: { fontSize: 12, fontWeight: '600', color: '#2D3748' },
    funnelValue: { fontSize: 14, fontWeight: 'bold', color: '#2D3748', width: 40, textAlign: 'right' },
    funnelPercent: { fontSize: 12, color: '#718096', width: 40, textAlign: 'right' },

    tableContainer: { marginTop: 16 },
    tableRowHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingBottom: 8, marginBottom: 8 },
    tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F7FAFC' },
    tableCell: { fontSize: 14, color: '#2D3748' },
    statusBadge: { paddingVertical: 2, paddingHorizontal: 8, borderRadius: 12, alignSelf: 'flex-start' },
    statusActive: { backgroundColor: '#F0FFF4' },
    statusWarning: { backgroundColor: '#FEFCBF' },
    statusTextSimple: { fontSize: 12, fontWeight: '600', color: '#4A5568' },

    alertItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 8, marginBottom: 8, gap: 12 },
    alertError: { backgroundColor: '#FFF5F5' },
    alertWarning: { backgroundColor: '#FFFFF0' },
    alertInfo: { backgroundColor: '#EBF8FF' },
    alertText: { fontSize: 14, color: '#2D3748', flex: 1 },
});

export default AdminAnalyticsScreen;
