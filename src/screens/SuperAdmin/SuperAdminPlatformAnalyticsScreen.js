import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal, Switch, Platform, useWindowDimensions, TextInput, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SuperAdminDrawer from '../../components/SuperAdminDrawer';

const isWeb = Platform.OS === 'web';

const SuperAdminPlatformAnalyticsScreen = ({ navigation }) => {
    const [drawerVisible, setDrawerVisible] = useState(false);
    const { width } = useWindowDimensions();
    const isMobile = width < 768;

    const [dateRange, setDateRange] = useState('30 days');
    const [selectedGym, setSelectedGym] = useState(null);
    const [detailsPanelVisible, setDetailsPanelVisible] = useState(false);

    // Mock Data
    const kpis = [
        { label: 'Total Active Gyms', value: '142', change: '+5%', icon: 'business', color: '#3182CE' },
        { label: 'Total Members', value: '12,450', change: '+12%', icon: 'people', color: '#38A169' },
        { label: 'Total Trainers', value: '840', change: '+8%', icon: 'fitness', color: '#805AD5' },
        { label: 'MRR', value: '$42.5K', change: '+15%', icon: 'cash', color: '#2B6CB0' },
        { label: 'AI Tokens (Mo)', value: '12.4M', change: '+22%', icon: 'hardware-chip', color: '#D69E2E' },
        { label: 'Churn Rate', value: '1.2%', change: '-0.5%', icon: 'trending-down', color: '#E53E3E' },
    ];

    const gymRankings = [
        { id: '1', name: 'Elite Fitness Center', members: 1250, revenue: '$12,500', growth: '+15%', activity: 'High', aiUsage: '1.2M', conversion: '24%', status: 'Healthy' },
        { id: '2', name: 'PowerGym Downtown', members: 980, revenue: '$9,800', growth: '+8%', activity: 'Med', aiUsage: '850K', conversion: '18%', status: 'Healthy' },
        { id: '3', name: 'FlexFit Studio', members: 450, revenue: '$4,500', growth: '-2%', activity: 'Low', aiUsage: '120K', conversion: '12%', status: 'At Risk' },
        { id: '4', name: 'CrossFit Warriors', members: 890, revenue: '$8,900', growth: '+22%', activity: 'High', aiUsage: '2.1M', conversion: '32%', status: 'Healthy' },
    ];

    const handleGymClick = (gym) => {
        setSelectedGym(gym);
        setDetailsPanelVisible(true);
    };

    return (
        <View style={styles.outerContainer}>
            <SuperAdminDrawer
                visible={drawerVisible}
                onClose={() => setDrawerVisible(false)}
                navigation={navigation}
                currentScreen="SuperAdminAnalytics"
            />

            {/* Sidebar - Desktop Only */}
            {!isMobile && (
                <View style={styles.sidebar}>
                    <View style={styles.sidebarHeader}>
                        <Ionicons name="shield-checkmark" size={32} color="#805AD5" />
                        <Text style={styles.sidebarTitle}>SuperAdmin</Text>
                    </View>
                    <TouchableOpacity style={styles.sidebarItem} onPress={() => navigation.navigate('SuperAdminGlobalSettings')}>
                        <Ionicons name="settings-outline" size={20} color="#4A5568" />
                        <Text style={styles.sidebarItemText}>Global Settings</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.sidebarItem} onPress={() => navigation.navigate('SuperAdminGymOnboarding')}>
                        <Ionicons name="business-outline" size={20} color="#4A5568" />
                        <Text style={styles.sidebarItemText}>Gym Onboarding</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.sidebarItem} onPress={() => navigation.navigate('SuperAdminSubscriptionTiers')}>
                        <Ionicons name="pricetag-outline" size={20} color="#4A5568" />
                        <Text style={styles.sidebarItemText}>Subscription Tiers</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.sidebarItem} onPress={() => navigation.navigate('SuperAdminAITokenMonitor')}>
                        <Ionicons name="pulse-outline" size={20} color="#4A5568" />
                        <Text style={styles.sidebarItemText}>AI Token Monitor</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.sidebarItem} onPress={() => navigation.navigate('SuperAdminDeployment')}>
                        <Ionicons name="rocket-outline" size={20} color="#4A5568" />
                        <Text style={styles.sidebarItemText}>Deployment Center</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.sidebarItem} onPress={() => navigation.navigate('SuperAdminBilling')}>
                        <Ionicons name="card-outline" size={20} color="#4A5568" />
                        <Text style={styles.sidebarItemText}>Platform Billing</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.sidebarItemActive}>
                        <Ionicons name="bar-chart-outline" size={20} color="#805AD5" />
                        <Text style={styles.sidebarItemTextActive}>Analytics</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.sidebarItem} onPress={() => navigation.navigate('SuperAdminSystemLogs')}>
                        <Ionicons name="terminal-outline" size={20} color="#4A5568" />
                        <Text style={styles.sidebarItemText}>System Logs</Text>
                    </TouchableOpacity>
                </View>
            )}

            <View style={styles.container}>
                <ScrollView style={styles.mainContent}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                            {isMobile && (
                                <TouchableOpacity onPress={() => setDrawerVisible(true)} style={styles.hamburgerButton}>
                                    <Ionicons name="menu" size={28} color="#2D3748" />
                                </TouchableOpacity>
                            )}
                            <View>
                                <Text style={styles.pageTitle}>Platform Analytics Dashboard</Text>
                                <Text style={styles.pageSubtitle}>A unified view of platform-wide growth, usage, and gym performance.</Text>
                            </View>
                        </View>
                        <View style={styles.headerActions}>
                            <View style={styles.dateRangeSelector}>
                                {['7D', '30D', '3M', '1Y'].map(range => (
                                    <TouchableOpacity
                                        key={range}
                                        style={[styles.rangeButton, dateRange === range && styles.rangeButtonActive]}
                                        onPress={() => setDateRange(range)}
                                    >
                                        <Text style={[styles.rangeButtonText, dateRange === range && styles.rangeButtonTextActive]}>{range}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                            <TouchableOpacity style={styles.actionButton}>
                                <Ionicons name="refresh-outline" size={18} color="#4A5568" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.actionButton}>
                                <Ionicons name="download-outline" size={18} color="#4A5568" />
                                <Text style={styles.actionButtonText}>Export</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* High-Level KPIs */}
                    <View style={styles.kpiGrid}>
                        {kpis.map((kpi, index) => (
                            <View key={index} style={styles.kpiCard}>
                                <View style={styles.kpiHeader}>
                                    <Ionicons name={kpi.icon} size={20} color={kpi.color} />
                                    <Text style={[styles.kpiChange, { color: kpi.change.startsWith('+') ? '#38A169' : '#E53E3E' }]}>{kpi.change}</Text>
                                </View>
                                <Text style={styles.kpiValue}>{kpi.value}</Text>
                                <Text style={styles.kpiLabel}>{kpi.label}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Revenue & Growth Trends */}
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.cardTitle}>Revenue & Growth Trends</Text>
                            <View style={styles.chartFilters}>
                                {['Revenue', 'Active Gyms', 'New Members', 'AI Tokens'].map(filter => (
                                    <TouchableOpacity key={filter} style={styles.filterChip}>
                                        <Text style={styles.filterChipText}>{filter}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                        <View style={styles.chartPlaceholder}>
                            <Ionicons name="stats-chart" size={48} color="#CBD5E0" />
                            <Text style={styles.chartPlaceholderText}>Interactive Growth Chart</Text>
                        </View>
                    </View>

                    {/* Gym Performance Ranking */}
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Gym Performance Ranking</Text>
                        <View style={styles.table}>
                            <View style={styles.tableHeader}>
                                <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Gym Name</Text>
                                <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Members</Text>
                                <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Revenue</Text>
                                <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Growth</Text>
                                <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Activity</Text>
                                <Text style={[styles.tableHeaderCell, { flex: 1 }]}>AI Usage</Text>
                                <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Status</Text>
                            </View>
                            {gymRankings.map(gym => (
                                <TouchableOpacity key={gym.id} style={styles.tableRow} onPress={() => handleGymClick(gym)}>
                                    <Text style={[styles.tableCell, { flex: 2, fontWeight: '600' }]}>{gym.name}</Text>
                                    <Text style={[styles.tableCell, { flex: 1 }]}>{gym.members}</Text>
                                    <Text style={[styles.tableCell, { flex: 1 }]}>{gym.revenue}</Text>
                                    <Text style={[styles.tableCell, { flex: 1, color: gym.growth.startsWith('+') ? '#38A169' : '#E53E3E' }]}>{gym.growth}</Text>
                                    <Text style={[styles.tableCell, { flex: 1 }]}>{gym.activity}</Text>
                                    <Text style={[styles.tableCell, { flex: 1 }]}>{gym.aiUsage}</Text>
                                    <View style={[styles.tableCell, { flex: 1 }]}>
                                        <View style={[styles.statusBadge, { backgroundColor: gym.status === 'Healthy' ? '#C6F6D5' : '#FED7D7' }]}>
                                            <Text style={[styles.statusText, { color: gym.status === 'Healthy' ? '#276749' : '#9B2C2C' }]}>{gym.status}</Text>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* AI Usage & User Growth */}
                    <View style={styles.twoColumnRow}>
                        <View style={[styles.card, { flex: 1 }]}>
                            <Text style={styles.cardTitle}>AI Usage by Model</Text>
                            <View style={styles.chartPlaceholder}>
                                <Ionicons name="pie-chart" size={48} color="#CBD5E0" />
                                <Text style={styles.chartPlaceholderText}>Model Distribution Pie Chart</Text>
                            </View>
                        </View>
                        <View style={[styles.card, { flex: 1 }]}>
                            <Text style={styles.cardTitle}>User Growth Summary</Text>
                            <View style={styles.chartPlaceholder}>
                                <Ionicons name="trending-up" size={48} color="#CBD5E0" />
                                <Text style={styles.chartPlaceholderText}>Member & Trainer Growth</Text>
                            </View>
                        </View>
                    </View>

                    {/* Engagement & Leads */}
                    <View style={styles.twoColumnRow}>
                        <View style={[styles.card, { flex: 1 }]}>
                            <Text style={styles.cardTitle}>Engagement Analytics</Text>
                            <View style={styles.statsGrid}>
                                <View style={styles.statItem}>
                                    <Text style={styles.statLabel}>Daily Workouts</Text>
                                    <Text style={styles.statValue}>3,420</Text>
                                </View>
                                <View style={styles.statItem}>
                                    <Text style={styles.statLabel}>Retention Rate</Text>
                                    <Text style={styles.statValue}>85%</Text>
                                </View>
                                <View style={styles.statItem}>
                                    <Text style={styles.statLabel}>MAU</Text>
                                    <Text style={styles.statValue}>8,200</Text>
                                </View>
                                <View style={styles.statItem}>
                                    <Text style={styles.statLabel}>Plans Generated</Text>
                                    <Text style={styles.statValue}>12.5K</Text>
                                </View>
                            </View>
                        </View>
                        <View style={[styles.card, { flex: 1 }]}>
                            <Text style={styles.cardTitle}>Lead Conversion Funnel</Text>
                            <View style={styles.funnelContainer}>
                                <View style={styles.funnelStep}>
                                    <Text style={styles.funnelLabel}>Inquiries</Text>
                                    <View style={[styles.funnelBar, { width: '100%' }]} />
                                    <Text style={styles.funnelValue}>1,200</Text>
                                </View>
                                <View style={styles.funnelStep}>
                                    <Text style={styles.funnelLabel}>Trials</Text>
                                    <View style={[styles.funnelBar, { width: '60%' }]} />
                                    <Text style={styles.funnelValue}>720</Text>
                                </View>
                                <View style={styles.funnelStep}>
                                    <Text style={styles.funnelLabel}>Converted</Text>
                                    <View style={[styles.funnelBar, { width: '30%' }]} />
                                    <Text style={styles.funnelValue}>360</Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Platform Health & Billing */}
                    <View style={styles.twoColumnRow}>
                        <View style={[styles.card, { flex: 1 }]}>
                            <Text style={styles.cardTitle}>Platform Health</Text>
                            <View style={styles.healthList}>
                                <View style={styles.healthItem}>
                                    <Text style={styles.healthLabel}>API Uptime</Text>
                                    <Text style={[styles.healthValue, { color: '#38A169' }]}>99.99%</Text>
                                </View>
                                <View style={styles.healthItem}>
                                    <Text style={styles.healthLabel}>Error Rate</Text>
                                    <Text style={[styles.healthValue, { color: '#38A169' }]}>0.02%</Text>
                                </View>
                                <View style={styles.healthItem}>
                                    <Text style={styles.healthLabel}>DB Latency</Text>
                                    <Text style={[styles.healthValue, { color: '#D69E2E' }]}>45ms</Text>
                                </View>
                            </View>
                        </View>
                        <View style={[styles.card, { flex: 1 }]}>
                            <Text style={styles.cardTitle}>Billing Health</Text>
                            <View style={styles.billingStats}>
                                <View style={styles.billingItem}>
                                    <Text style={styles.billingLabel}>Failed Payments</Text>
                                    <Text style={[styles.billingValue, { color: '#E53E3E' }]}>12</Text>
                                </View>
                                <View style={styles.billingItem}>
                                    <Text style={styles.billingLabel}>Overdue Invoices</Text>
                                    <Text style={[styles.billingValue, { color: '#D69E2E' }]}>5</Text>
                                </View>
                                <View style={styles.billingItem}>
                                    <Text style={styles.billingLabel}>Net Revenue</Text>
                                    <Text style={[styles.billingValue, { color: '#38A169' }]}>$38.2K</Text>
                                </View>
                            </View>
                        </View>
                    </View>

                </ScrollView>

                {/* Gym Analytics Side Panel */}
                <Modal visible={detailsPanelVisible} animationType="slide" transparent onRequestClose={() => setDetailsPanelVisible(false)}>
                    <View style={styles.panelOverlay}>
                        <TouchableOpacity style={styles.panelBackdrop} onPress={() => setDetailsPanelVisible(false)} />
                        <View style={styles.sidePanel}>
                            <View style={styles.panelHeader}>
                                <Text style={styles.panelTitle}>Gym Analytics</Text>
                                <TouchableOpacity onPress={() => setDetailsPanelVisible(false)}>
                                    <Ionicons name="close" size={28} color="#4A5568" />
                                </TouchableOpacity>
                            </View>
                            <ScrollView style={styles.panelContent}>
                                {selectedGym && (
                                    <>
                                        <View style={styles.panelSection}>
                                            <Text style={styles.gymName}>{selectedGym.name}</Text>
                                            <Text style={styles.gymStatus}>{selectedGym.status}</Text>
                                        </View>
                                        <View style={styles.panelSection}>
                                            <Text style={styles.panelSectionTitle}>Performance Snapshot</Text>
                                            <View style={styles.detailRow}>
                                                <Text style={styles.detailLabel}>Active Members</Text>
                                                <Text style={styles.detailValue}>{selectedGym.members}</Text>
                                            </View>
                                            <View style={styles.detailRow}>
                                                <Text style={styles.detailLabel}>Monthly Revenue</Text>
                                                <Text style={styles.detailValue}>{selectedGym.revenue}</Text>
                                            </View>
                                            <View style={styles.detailRow}>
                                                <Text style={styles.detailLabel}>AI Usage</Text>
                                                <Text style={styles.detailValue}>{selectedGym.aiUsage}</Text>
                                            </View>
                                        </View>
                                        <View style={styles.panelSection}>
                                            <Text style={styles.panelSectionTitle}>Quick Actions</Text>
                                            <View style={styles.actionButtons}>
                                                <TouchableOpacity style={styles.panelButton}>
                                                    <Ionicons name="card-outline" size={20} color="#4A5568" />
                                                    <Text style={styles.panelButtonText}>View Billing</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity style={styles.panelButton}>
                                                    <Ionicons name="chatbubble-outline" size={20} color="#4A5568" />
                                                    <Text style={styles.panelButtonText}>Message Admin</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity style={styles.panelButton}>
                                                    <Ionicons name="people-outline" size={20} color="#4A5568" />
                                                    <Text style={styles.panelButtonText}>Assign Success Manager</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </>
                                )}
                            </ScrollView>
                        </View>
                    </View>
                </Modal>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    outerContainer: { flex: 1, flexDirection: 'row', backgroundColor: '#F7FAFC' },
    sidebar: { width: 250, backgroundColor: '#FFF', borderRightWidth: 1, borderRightColor: '#E2E8F0', paddingVertical: 24, paddingHorizontal: 16 },
    sidebarHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 40, paddingHorizontal: 8, gap: 10 },
    sidebarTitle: { fontSize: 20, fontWeight: 'bold', color: '#805AD5' },
    sidebarItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 8, marginBottom: 4, gap: 12 },
    sidebarItemActive: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 8, marginBottom: 4, backgroundColor: '#F3E8FF', gap: 12 },
    sidebarItemText: { fontSize: 16, color: '#4A5568' },
    sidebarItemTextActive: { fontSize: 16, color: '#805AD5', fontWeight: '600' },
    hamburgerButton: { padding: 8 },

    container: { flex: 1, backgroundColor: '#F7FAFC' },
    mainContent: { flex: 1, padding: 24 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
    pageTitle: { fontSize: 32, fontWeight: 'bold', color: '#1A202C', marginBottom: 4 },
    pageSubtitle: { fontSize: 16, color: '#718096' },
    headerActions: { flexDirection: 'row', gap: 12, alignItems: 'center' },
    dateRangeSelector: { flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', overflow: 'hidden' },
    rangeButton: { paddingVertical: 8, paddingHorizontal: 12 },
    rangeButtonActive: { backgroundColor: '#3182CE' },
    rangeButtonText: { fontSize: 13, color: '#4A5568', fontWeight: '500' },
    rangeButtonTextActive: { color: '#FFF', fontWeight: '600' },
    actionButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, gap: 8 },
    actionButtonText: { fontSize: 14, fontWeight: '600', color: '#4A5568' },

    kpiGrid: { flexDirection: 'row', gap: 16, marginBottom: 24, flexWrap: 'wrap' },
    kpiCard: { flex: 1, minWidth: 180, backgroundColor: '#FFF', padding: 20, borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
    kpiHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    kpiChange: { fontSize: 13, fontWeight: '600' },
    kpiValue: { fontSize: 24, fontWeight: 'bold', color: '#2D3748', marginBottom: 4 },
    kpiLabel: { fontSize: 13, color: '#718096' },

    card: { backgroundColor: '#FFF', borderRadius: 12, padding: 24, marginBottom: 24, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#2D3748', marginBottom: 16 },
    chartFilters: { flexDirection: 'row', gap: 8 },
    filterChip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, backgroundColor: '#F7FAFC', borderWidth: 1, borderColor: '#E2E8F0' },
    filterChipText: { fontSize: 13, color: '#4A5568' },
    chartPlaceholder: { height: 200, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F7FAFC', borderRadius: 8 },
    chartPlaceholderText: { fontSize: 14, color: '#A0AEC0', marginTop: 12 },

    table: {},
    tableHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingBottom: 12, marginBottom: 12 },
    tableHeaderCell: { fontSize: 12, fontWeight: '600', color: '#4A5568', textTransform: 'uppercase' },
    tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F7FAFC' },
    tableCell: { fontSize: 14, color: '#2D3748' },
    statusBadge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12, alignSelf: 'flex-start' },
    statusText: { fontSize: 12, fontWeight: '600' },

    twoColumnRow: { flexDirection: 'row', gap: 24, marginBottom: 24 },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
    statItem: { width: '45%', padding: 12, backgroundColor: '#F7FAFC', borderRadius: 8 },
    statLabel: { fontSize: 13, color: '#718096', marginBottom: 4 },
    statValue: { fontSize: 18, fontWeight: 'bold', color: '#2D3748' },

    funnelContainer: { gap: 12 },
    funnelStep: { gap: 4 },
    funnelLabel: { fontSize: 13, color: '#4A5568' },
    funnelBar: { height: 8, backgroundColor: '#3182CE', borderRadius: 4 },
    funnelValue: { fontSize: 13, fontWeight: '600', color: '#2D3748', alignSelf: 'flex-end' },

    healthList: { gap: 12 },
    healthItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, backgroundColor: '#F7FAFC', borderRadius: 8 },
    healthLabel: { fontSize: 14, color: '#4A5568' },
    healthValue: { fontSize: 14, fontWeight: 'bold' },

    billingStats: { flexDirection: 'row', justifyContent: 'space-between' },
    billingItem: { alignItems: 'center' },
    billingLabel: { fontSize: 13, color: '#718096', marginBottom: 4 },
    billingValue: { fontSize: 18, fontWeight: 'bold' },

    panelOverlay: { flex: 1, flexDirection: 'row', justifyContent: 'flex-end' },
    panelBackdrop: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)' },
    sidePanel: { width: 400, backgroundColor: '#FFF', shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 8, elevation: 5 },
    panelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
    panelTitle: { fontSize: 20, fontWeight: 'bold', color: '#1A202C' },
    panelContent: { flex: 1, padding: 24 },
    panelSection: { marginBottom: 32 },
    panelSectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#2D3748', marginBottom: 16 },
    gymName: { fontSize: 24, fontWeight: 'bold', color: '#2D3748', marginBottom: 4 },
    gymStatus: { fontSize: 14, color: '#38A169', fontWeight: '600' },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F7FAFC' },
    detailLabel: { fontSize: 14, color: '#718096' },
    detailValue: { fontSize: 14, fontWeight: '600', color: '#2D3748' },
    actionButtons: { gap: 12 },
    panelButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E2E8F0', paddingVertical: 12, borderRadius: 8, gap: 8 },
    panelButtonText: { fontSize: 14, fontWeight: '600', color: '#4A5568' },
});

export default SuperAdminPlatformAnalyticsScreen;
