import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal, Switch, Platform, useWindowDimensions, TextInput, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SuperAdminDrawer from '../../components/SuperAdminDrawer';

const isWeb = Platform.OS === 'web';

const SuperAdminSystemLogsScreen = ({ navigation }) => {
    const [drawerVisible, setDrawerVisible] = useState(false);
    const { width } = useWindowDimensions();
    const isMobile = width < 768;

    const [selectedLog, setSelectedLog] = useState(null);
    const [detailsPanelVisible, setDetailsPanelVisible] = useState(false);
    const [filterCategory, setFilterCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    // Mock Data
    const kpis = [
        { label: 'Uptime', value: '99.99%', change: 'Stable', icon: 'server', color: '#38A169' },
        { label: 'Error Rate', value: '0.02%', change: '-0.01%', icon: 'warning', color: '#3182CE' },
        { label: 'Avg Latency', value: '45ms', change: '-5ms', icon: 'speedometer', color: '#805AD5' },
        { label: 'Failed AI Calls', value: '12', change: '+2', icon: 'hardware-chip', color: '#E53E3E' },
        { label: 'Auth Failures', value: '5', change: '-1', icon: 'lock-closed', color: '#D69E2E' },
        { label: 'Billing Errors', value: '2', change: '0', icon: 'card', color: '#E53E3E' },
    ];

    const logs = [
        { id: 'LOG-001', timestamp: '2024-10-25 10:30:15', severity: 'Error', category: 'API', message: 'Failed to fetch gym details', user: 'admin@elite.com', gym: 'Elite Fitness' },
        { id: 'LOG-002', timestamp: '2024-10-25 10:28:45', severity: 'Info', category: 'Auth', message: 'User logged in successfully', user: 'trainer@powergym.com', gym: 'PowerGym' },
        { id: 'LOG-003', timestamp: '2024-10-25 10:25:30', severity: 'Warning', category: 'AI', message: 'Token usage approaching limit', user: 'System', gym: 'FlexFit' },
        { id: 'LOG-004', timestamp: '2024-10-25 10:20:10', severity: 'Critical', category: 'Billing', message: 'Payment gateway timeout', user: 'System', gym: 'CrossFit Warriors' },
        { id: 'LOG-005', timestamp: '2024-10-25 10:15:00', severity: 'Info', category: 'Deployment', message: 'Deployment started: v1.2.5', user: 'DevOps', gym: 'N/A' },
    ];

    const handleViewLog = (log) => {
        setSelectedLog(log);
        setDetailsPanelVisible(true);
    };

    const getSeverityColor = (severity) => {
        const colors = { 'Critical': '#E53E3E', 'Error': '#E53E3E', 'Warning': '#D69E2E', 'Info': '#3182CE' };
        return colors[severity] || '#718096';
    };

    return (
        <View style={styles.outerContainer}>
            <SuperAdminDrawer
                visible={drawerVisible}
                onClose={() => setDrawerVisible(false)}
                navigation={navigation}
                currentScreen="SuperAdminSystemLogs"
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
                    <TouchableOpacity style={styles.sidebarItem} onPress={() => navigation.navigate('SuperAdminAnalytics')}>
                        <Ionicons name="bar-chart-outline" size={20} color="#4A5568" />
                        <Text style={styles.sidebarItemText}>Analytics</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.sidebarItemActive}>
                        <Ionicons name="terminal-outline" size={20} color="#805AD5" />
                        <Text style={styles.sidebarItemTextActive}>System Logs</Text>
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
                                <Text style={styles.pageTitle}>System Logs & Monitoring</Text>
                                <Text style={styles.pageSubtitle}>Track platform activity, API events, AI usage, and system-level issues.</Text>
                            </View>
                        </View>
                        <View style={styles.headerActions}>
                            <TouchableOpacity style={styles.actionButton}>
                                <Ionicons name="refresh-outline" size={18} color="#4A5568" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.actionButton}>
                                <Ionicons name="download-outline" size={18} color="#4A5568" />
                                <Text style={styles.actionButtonText}>Export Logs</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Log Type Filters */}
                    <View style={styles.filterBar}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                            {['All Logs', 'Authentication', 'API', 'AI Requests', 'Billing', 'Deployment', 'Errors', 'Warnings', 'Security'].map(filter => (
                                <TouchableOpacity
                                    key={filter}
                                    style={[styles.filterPill, filterCategory === filter && styles.filterPillActive]}
                                    onPress={() => setFilterCategory(filter)}
                                >
                                    <Text style={[styles.filterPillText, filterCategory === filter && styles.filterPillTextActive]}>{filter}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                        <View style={styles.searchContainer}>
                            <Ionicons name="search" size={16} color="#718096" />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Search logs..."
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                        </View>
                    </View>

                    {/* System Status Summary */}
                    <View style={styles.kpiGrid}>
                        {kpis.map((kpi, index) => (
                            <View key={index} style={styles.kpiCard}>
                                <View style={styles.kpiHeader}>
                                    <Ionicons name={kpi.icon} size={20} color={kpi.color} />
                                    <Text style={[styles.kpiChange, { color: kpi.change.startsWith('-') ? '#38A169' : '#718096' }]}>{kpi.change}</Text>
                                </View>
                                <Text style={styles.kpiValue}>{kpi.value}</Text>
                                <Text style={styles.kpiLabel}>{kpi.label}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Log Stream Viewer */}
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.cardTitle}>Log Stream</Text>
                            <View style={styles.autoRefresh}>
                                <Text style={styles.autoRefreshText}>Auto-refresh</Text>
                                <Switch value={true} />
                            </View>
                        </View>
                        <View style={styles.table}>
                            <View style={styles.tableHeader}>
                                <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Timestamp</Text>
                                <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Severity</Text>
                                <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Category</Text>
                                <Text style={[styles.tableHeaderCell, { flex: 3 }]}>Message</Text>
                                <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>User</Text>
                                <Text style={[styles.tableHeaderCell, { flex: 0.5 }]}></Text>
                            </View>
                            {logs.map(log => (
                                <TouchableOpacity key={log.id} style={styles.tableRow} onPress={() => handleViewLog(log)}>
                                    <Text style={[styles.tableCell, { flex: 1.5, color: '#718096', fontSize: 12 }]}>{log.timestamp}</Text>
                                    <View style={[styles.tableCell, { flex: 1 }]}>
                                        <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(log.severity) + '20' }]}>
                                            <Text style={[styles.severityText, { color: getSeverityColor(log.severity) }]}>{log.severity}</Text>
                                        </View>
                                    </View>
                                    <Text style={[styles.tableCell, { flex: 1 }]}>{log.category}</Text>
                                    <Text style={[styles.tableCell, { flex: 3 }]} numberOfLines={1}>{log.message}</Text>
                                    <Text style={[styles.tableCell, { flex: 1.5 }]}>{log.user}</Text>
                                    <View style={[styles.tableCell, { flex: 0.5 }]}>
                                        <Ionicons name="chevron-forward" size={16} color="#CBD5E0" />
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Charts & Monitors */}
                    <View style={styles.twoColumnRow}>
                        <View style={[styles.card, { flex: 1 }]}>
                            <Text style={styles.cardTitle}>Error Trends</Text>
                            <View style={styles.chartPlaceholder}>
                                <Ionicons name="stats-chart" size={48} color="#CBD5E0" />
                                <Text style={styles.chartPlaceholderText}>Error & Warning Trends Chart</Text>
                            </View>
                        </View>
                        <View style={[styles.card, { flex: 1 }]}>
                            <Text style={styles.cardTitle}>AI Error Monitor</Text>
                            <View style={styles.monitorStats}>
                                <View style={styles.monitorItem}>
                                    <Text style={styles.monitorLabel}>Over-Quota</Text>
                                    <Text style={[styles.monitorValue, { color: '#E53E3E' }]}>3</Text>
                                </View>
                                <View style={styles.monitorItem}>
                                    <Text style={styles.monitorLabel}>Timeouts</Text>
                                    <Text style={[styles.monitorValue, { color: '#D69E2E' }]}>8</Text>
                                </View>
                                <View style={styles.monitorItem}>
                                    <Text style={styles.monitorLabel}>Model Errors</Text>
                                    <Text style={[styles.monitorValue, { color: '#3182CE' }]}>1</Text>
                                </View>
                            </View>
                            <View style={[styles.chartPlaceholder, { height: 100, marginTop: 16 }]}>
                                <Text style={styles.chartPlaceholderText}>Sparkline Graph</Text>
                            </View>
                        </View>
                    </View>

                    {/* API Performance & Security */}
                    <View style={styles.twoColumnRow}>
                        <View style={[styles.card, { flex: 1 }]}>
                            <Text style={styles.cardTitle}>API Performance</Text>
                            <View style={styles.apiGrid}>
                                <View style={styles.apiItem}>
                                    <Text style={styles.apiLabel}>Avg Latency</Text>
                                    <Text style={styles.apiValue}>45ms</Text>
                                </View>
                                <View style={styles.apiItem}>
                                    <Text style={styles.apiLabel}>Peak Latency</Text>
                                    <Text style={styles.apiValue}>120ms</Text>
                                </View>
                                <View style={styles.apiItem}>
                                    <Text style={styles.apiLabel}>Req/Sec</Text>
                                    <Text style={styles.apiValue}>240</Text>
                                </View>
                                <View style={styles.apiItem}>
                                    <Text style={styles.apiLabel}>Slowest Endpoint</Text>
                                    <Text style={[styles.apiValue, { fontSize: 12 }]}>/api/v1/analytics</Text>
                                </View>
                            </View>
                        </View>
                        <View style={[styles.card, { flex: 1 }]}>
                            <Text style={styles.cardTitle}>Security Events</Text>
                            <View style={styles.securityList}>
                                <View style={styles.securityItem}>
                                    <Ionicons name="warning" size={16} color="#E53E3E" />
                                    <Text style={styles.securityText}>Failed login from IP 192.168.1.1</Text>
                                </View>
                                <View style={styles.securityItem}>
                                    <Ionicons name="shield" size={16} color="#D69E2E" />
                                    <Text style={styles.securityText}>Admin permission changed for User #42</Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Deployment & Alerts */}
                    <View style={styles.twoColumnRow}>
                        <View style={[styles.card, { flex: 1 }]}>
                            <Text style={styles.cardTitle}>Latest Deployments</Text>
                            <View style={styles.deploymentItem}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <View style={[styles.statusDot, { backgroundColor: '#38A169' }]} />
                                    <Text style={styles.deploymentName}>v1.2.5 (Production)</Text>
                                </View>
                                <Text style={styles.deploymentTime}>2 hours ago</Text>
                            </View>
                            <View style={styles.deploymentItem}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <View style={[styles.statusDot, { backgroundColor: '#E53E3E' }]} />
                                    <Text style={styles.deploymentName}>v1.2.6-beta (Staging)</Text>
                                </View>
                                <Text style={styles.deploymentTime}>5 hours ago</Text>
                            </View>
                        </View>
                        <View style={[styles.card, { flex: 1 }]}>
                            <Text style={styles.cardTitle}>Alerts Manager</Text>
                            <View style={styles.alertToggle}>
                                <Text style={styles.alertLabel}>Alert on repeated failures</Text>
                                <Switch value={true} />
                            </View>
                            <View style={styles.alertToggle}>
                                <Text style={styles.alertLabel}>Alert on high AI usage</Text>
                                <Switch value={true} />
                            </View>
                            <View style={styles.alertToggle}>
                                <Text style={styles.alertLabel}>Alert on suspicious logins</Text>
                                <Switch value={false} />
                            </View>
                        </View>
                    </View>

                </ScrollView>

                {/* Log Details Side Panel */}
                <Modal visible={detailsPanelVisible} animationType="slide" transparent onRequestClose={() => setDetailsPanelVisible(false)}>
                    <View style={styles.panelOverlay}>
                        <TouchableOpacity style={styles.panelBackdrop} onPress={() => setDetailsPanelVisible(false)} />
                        <View style={styles.sidePanel}>
                            <View style={styles.panelHeader}>
                                <Text style={styles.panelTitle}>Log Details</Text>
                                <TouchableOpacity onPress={() => setDetailsPanelVisible(false)}>
                                    <Ionicons name="close" size={28} color="#4A5568" />
                                </TouchableOpacity>
                            </View>
                            <ScrollView style={styles.panelContent}>
                                {selectedLog && (
                                    <>
                                        <View style={styles.panelSection}>
                                            <Text style={styles.panelSectionTitle}>Metadata</Text>
                                            <View style={styles.detailRow}>
                                                <Text style={styles.detailLabel}>Timestamp</Text>
                                                <Text style={styles.detailValue}>{selectedLog.timestamp}</Text>
                                            </View>
                                            <View style={styles.detailRow}>
                                                <Text style={styles.detailLabel}>Severity</Text>
                                                <Text style={[styles.detailValue, { color: getSeverityColor(selectedLog.severity) }]}>{selectedLog.severity}</Text>
                                            </View>
                                            <View style={styles.detailRow}>
                                                <Text style={styles.detailLabel}>Category</Text>
                                                <Text style={styles.detailValue}>{selectedLog.category}</Text>
                                            </View>
                                            <View style={styles.detailRow}>
                                                <Text style={styles.detailLabel}>User</Text>
                                                <Text style={styles.detailValue}>{selectedLog.user}</Text>
                                            </View>
                                            <View style={styles.detailRow}>
                                                <Text style={styles.detailLabel}>Gym</Text>
                                                <Text style={styles.detailValue}>{selectedLog.gym}</Text>
                                            </View>
                                        </View>
                                        <View style={styles.panelSection}>
                                            <Text style={styles.panelSectionTitle}>Payload</Text>
                                            <View style={styles.codeBlock}>
                                                <Text style={styles.codeText}>{JSON.stringify(selectedLog, null, 2)}</Text>
                                            </View>
                                        </View>
                                        <View style={styles.panelSection}>
                                            <Text style={styles.panelSectionTitle}>Actions</Text>
                                            <View style={styles.actionButtons}>
                                                <TouchableOpacity style={styles.panelButton}>
                                                    <Ionicons name="copy-outline" size={20} color="#4A5568" />
                                                    <Text style={styles.panelButtonText}>Copy Payload</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity style={styles.panelButton}>
                                                    <Ionicons name="flag-outline" size={20} color="#E53E3E" />
                                                    <Text style={[styles.panelButtonText, { color: '#E53E3E' }]}>Flag for Investigation</Text>
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
    headerActions: { flexDirection: 'row', gap: 12 },
    actionButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, gap: 8 },
    actionButtonText: { fontSize: 14, fontWeight: '600', color: '#4A5568' },

    filterBar: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, gap: 16 },
    filterScroll: { flexGrow: 0 },
    filterPill: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, backgroundColor: '#EDF2F7', marginRight: 8 },
    filterPillActive: { backgroundColor: '#3182CE' },
    filterPillText: { fontSize: 13, color: '#4A5568' },
    filterPillTextActive: { color: '#FFF', fontWeight: '600' },
    searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: '#E2E8F0', flex: 1, maxWidth: 300 },
    searchInput: { flex: 1, padding: 8, fontSize: 14 },

    kpiGrid: { flexDirection: 'row', gap: 16, marginBottom: 24, flexWrap: 'wrap' },
    kpiCard: { flex: 1, minWidth: 150, backgroundColor: '#FFF', padding: 16, borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
    kpiHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    kpiChange: { fontSize: 12, fontWeight: '600' },
    kpiValue: { fontSize: 20, fontWeight: 'bold', color: '#2D3748', marginBottom: 2 },
    kpiLabel: { fontSize: 12, color: '#718096' },

    card: { backgroundColor: '#FFF', borderRadius: 12, padding: 24, marginBottom: 24, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#2D3748' },
    autoRefresh: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    autoRefreshText: { fontSize: 13, color: '#718096' },

    table: {},
    tableHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingBottom: 12, marginBottom: 12 },
    tableHeaderCell: { fontSize: 12, fontWeight: '600', color: '#4A5568', textTransform: 'uppercase' },
    tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F7FAFC' },
    tableCell: { fontSize: 13, color: '#2D3748' },
    severityBadge: { paddingVertical: 2, paddingHorizontal: 8, borderRadius: 12, alignSelf: 'flex-start' },
    severityText: { fontSize: 11, fontWeight: '600' },

    twoColumnRow: { flexDirection: 'row', gap: 24, marginBottom: 24 },
    chartPlaceholder: { height: 150, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F7FAFC', borderRadius: 8 },
    chartPlaceholderText: { fontSize: 13, color: '#A0AEC0' },

    monitorStats: { flexDirection: 'row', justifyContent: 'space-between' },
    monitorItem: { alignItems: 'center' },
    monitorLabel: { fontSize: 12, color: '#718096', marginBottom: 4 },
    monitorValue: { fontSize: 18, fontWeight: 'bold' },

    apiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
    apiItem: { width: '45%', padding: 12, backgroundColor: '#F7FAFC', borderRadius: 8 },
    apiLabel: { fontSize: 12, color: '#718096', marginBottom: 4 },
    apiValue: { fontSize: 16, fontWeight: 'bold', color: '#2D3748' },

    securityList: { gap: 12 },
    securityItem: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, backgroundColor: '#FFF5F5', borderRadius: 8 },
    securityText: { fontSize: 13, color: '#2D3748' },

    deploymentItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F7FAFC' },
    statusDot: { width: 8, height: 8, borderRadius: 4 },
    deploymentName: { fontSize: 14, fontWeight: '500', color: '#2D3748' },
    deploymentTime: { fontSize: 12, color: '#718096' },

    alertToggle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F7FAFC' },
    alertLabel: { fontSize: 14, color: '#2D3748' },

    panelOverlay: { flex: 1, flexDirection: 'row', justifyContent: 'flex-end' },
    panelBackdrop: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)' },
    sidePanel: { width: 500, backgroundColor: '#FFF', shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 8, elevation: 5 },
    panelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
    panelTitle: { fontSize: 20, fontWeight: 'bold', color: '#1A202C' },
    panelContent: { flex: 1, padding: 24 },
    panelSection: { marginBottom: 32 },
    panelSectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#2D3748', marginBottom: 16 },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F7FAFC' },
    detailLabel: { fontSize: 14, color: '#718096' },
    detailValue: { fontSize: 14, fontWeight: '500', color: '#2D3748' },
    codeBlock: { backgroundColor: '#1A202C', padding: 16, borderRadius: 8 },
    codeText: { color: '#FFF', fontFamily: 'monospace', fontSize: 12 },
    actionButtons: { gap: 12 },
    panelButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E2E8F0', paddingVertical: 12, borderRadius: 8, gap: 8 },
    panelButtonText: { fontSize: 14, fontWeight: '600', color: '#4A5568' },
});

export default SuperAdminSystemLogsScreen;
