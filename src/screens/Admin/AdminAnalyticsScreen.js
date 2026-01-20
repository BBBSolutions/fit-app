import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform, Dimensions, FlatList, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { adminApi } from '../../services/adminApi';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

const AdminAnalyticsScreen = ({ navigation }) => {
    const [dateRange, setDateRange] = useState('30 Days');
    const [chartMetric, setChartMetric] = useState('Revenue');
    const [isLoading, setIsLoading] = useState(false);

    // Dynamic Data State
    const [kpis, setKpis] = useState([
        { title: 'Active Members', value: '-', change: '-', trend: 'flat' },
        { title: 'Active Trainers', value: '-', change: '-', trend: 'flat' },
        { title: 'Monthly Revenue', value: '-', change: '-', trend: 'flat' },
        { title: 'New Sign-ups', value: '-', change: '-', trend: 'flat' },
        { title: 'Churn Rate', value: '-', change: '-', trend: 'flat' },
        { title: 'Conversion Rate', value: '-', change: '-', trend: 'flat' },
    ]);
    const [funnelData, setFunnelData] = useState([]);
    const [inquiries, setInquiries] = useState([]);
    const [trainers, setTrainers] = useState([]);
    const [alerts, setAlerts] = useState([]);

    useEffect(() => {
        fetchAnalytics();
    }, [dateRange]);

    const fetchAnalytics = async () => {
        setIsLoading(true);
        try {
            // Map '30 Days' etc to whatever format backend expects if needed.
            // Currently backend treats 'range' loosely or defaults.
            const data = await adminApi.getAnalytics(dateRange);

            if (data) {
                if (data.kpis) setKpis(data.kpis);
                if (data.funnel) setFunnelData(data.funnel);
                if (data.inquiries) setInquiries(data.inquiries);
                if (data.trainers) setTrainers(data.trainers);
                // Alerts not yet in backend response, keep empty or mock if critical
            }

        } catch (error) {
            console.error("Failed to fetch analytics:", error);
        } finally {
            setIsLoading(false);
        }
    };


    // Simple Chart Component (Mock/Placeholder for now as real charting lib not installed)
    const SimpleBarChart = ({ height = 100, color = '#3182CE' }) => (
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', height, gap: 4, opacity: 0.3 }}>
            {[20, 40, 30, 50, 40, 60, 50, 70, 60, 80, 70, 90].map((h, i) => (
                <View key={i} style={{ flex: 1, backgroundColor: color, height: `${h}%`, borderRadius: 2 }} />
            ))}
        </View>
    );

    const SimpleLineChart = ({ height = 100, color = '#38A169' }) => (
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', height, gap: 4, opacity: 0.3 }}>
            {[10, 30, 20, 40, 30, 50, 40, 60, 50, 70, 60, 80].map((h, i) => (
                <View key={i} style={{ flex: 1, backgroundColor: color, height: `${h}%`, borderRadius: 2 }} />
            ))}
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Sidebar check removed - assuming managed by parent navigator or responsive layout handles it elsewhere
               But keeping container/layout structure similar to existing file
            */}

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

                {isLoading ? (
                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                        <ActivityIndicator size="large" color="#3182CE" />
                        <Text style={{ marginTop: 16, color: '#718096' }}>Loading analytics...</Text>
                    </View>
                ) : (
                    <ScrollView contentContainerStyle={styles.scrollContent}>
                        {/* KPI Grid */}
                        <View style={styles.kpiGrid}>
                            {kpis.map((kpi, index) => (
                                <View key={index} style={styles.kpiCard}>
                                    <Text style={styles.kpiTitle}>{kpi.title}</Text>
                                    <View style={styles.kpiRow}>
                                        <Text style={styles.kpiValue}>{kpi.value}</Text>
                                        <View style={[styles.trendBadge, kpi.trend === 'up' ? styles.trendUp : kpi.trend === 'down' ? styles.trendDown : { backgroundColor: '#EDF2F7' }]}>
                                            <Ionicons
                                                name={kpi.trend === 'up' ? "arrow-up" : kpi.trend === 'down' ? "arrow-down" : "remove"}
                                                size={10}
                                                color={kpi.trend === 'up' ? "#38A169" : kpi.trend === 'down' ? "#E53E3E" : "#718096"}
                                            />
                                            <Text style={[styles.trendText, kpi.trend === 'up' ? styles.textUp : kpi.trend === 'down' ? styles.textDown : { color: '#718096' }]}>
                                                {kpi.change}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={styles.sparkline}>
                                        <SimpleLineChart height={30} color="#CBD5E0" />
                                    </View>
                                </View>
                            ))}
                        </View>

                        {/* Engagement Charts */}
                        <View style={styles.chartsRow}>
                            <View style={styles.chartCard}>
                                <Text style={styles.cardTitle}>Member Activity</Text>
                                <Text style={styles.chartSubtitle}>Workouts logged per day</Text>
                                <View style={[styles.chartContainer, { alignItems: 'center', justifyContent: 'center' }]}>
                                    <SimpleBarChart height={150} />
                                </View>
                            </View>
                            <View style={styles.chartCard}>
                                <Text style={styles.cardTitle}>Trainer Activity</Text>
                                <Text style={styles.chartSubtitle}>Sessions & Plans created</Text>
                                <View style={[styles.chartContainer, { alignItems: 'center', justifyContent: 'center' }]}>
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
                            <View style={[styles.largeChart, { alignItems: 'center', justifyContent: 'center' }]}>
                                {/* Placeholder for large chart */}
                                <SimpleLineChart height={180} color="#3182CE" />
                            </View>
                        </View>

                        <View style={styles.gridContainer}>
                            {/* User Funnel */}
                            <View style={styles.card}>
                                <Text style={styles.cardTitle}>User Funnel</Text>
                                <View style={styles.funnelContainer}>
                                    {funnelData.length === 0 ? (
                                        <View style={{ padding: 20, alignItems: 'center' }}>
                                            <Text style={{ color: '#A0AEC0' }}>No funnel data available.</Text>
                                        </View>
                                    ) : funnelData.map((step, i) => (
                                        <View key={i} style={styles.funnelStep}>
                                            <View style={[styles.funnelBar, { width: `${Math.max(10, (step.value / (funnelData[0]?.value || 1)) * 100)}%`, backgroundColor: step.color }]}>
                                                <Text style={styles.funnelLabel}>{step.label}</Text>
                                            </View>
                                            <Text style={styles.funnelValue}>{step.value}</Text>
                                            {/* Calculate percent based on previous step or max */}
                                            <Text style={styles.funnelPercent}>{i > 0 && funnelData[0].value > 0 ? Math.round((step.value / funnelData[0].value) * 100) : 100}%</Text>
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
                                    {inquiries.length === 0 ? (
                                        <View style={{ padding: 20, alignItems: 'center' }}>
                                            <Text style={{ color: '#A0AEC0' }}>No recent inquiries.</Text>
                                        </View>
                                    ) : inquiries.map((inq, i) => (
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
                                    {trainers.length === 0 ? (
                                        <View style={{ padding: 20, alignItems: 'center' }}>
                                            <Text style={{ color: '#A0AEC0' }}>No trainer data.</Text>
                                        </View>
                                    ) : trainers.map((t, i) => (
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
                                {alerts.length === 0 ? (
                                    <View style={{ padding: 20, alignItems: 'center' }}>
                                        <Ionicons name="checkmark-circle-outline" size={48} color="#C6F6D5" />
                                        <Text style={{ color: '#A0AEC0', marginTop: 8 }}>All systems normal.</Text>
                                    </View>
                                ) : alerts.map((alert, i) => (
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
                )}
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
