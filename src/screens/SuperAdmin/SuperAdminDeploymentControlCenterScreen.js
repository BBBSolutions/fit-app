import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Switch, TextInput, Platform, useWindowDimensions, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SuperAdminDrawer from '../../components/SuperAdminDrawer';

const isWeb = Platform.OS === 'web';

const SuperAdminDeploymentControlCenterScreen = ({ navigation }) => {
    const [drawerVisible, setDrawerVisible] = useState(false);
    const { width } = useWindowDimensions();
    const isMobile = width < 768;

    const [environment, setEnvironment] = useState('Production');
    const [selectedDeployment, setSelectedDeployment] = useState(null);

    const currentRelease = {
        version: 'v1.4.2',
        deployedAt: '2024-01-28 14:30',
        deployedBy: 'Admin User',
        notes: 'Performance improvements and bug fixes for chat system.',
        status: 'Stable',
    };

    const deploymentTimeline = [
        { id: 1, status: 'success', title: 'Release Live', time: '14:30', completed: true },
        { id: 2, status: 'success', title: 'Verification Passed', time: '14:25', completed: true },
        { id: 3, status: 'success', title: 'Rollout 100%', time: '14:20', completed: true },
        { id: 4, status: 'success', title: 'Build Completed', time: '14:10', completed: true },
        { id: 5, status: 'success', title: 'Deployment Started', time: '14:05', completed: true },
    ];

    const deploymentHistory = [
        { id: '1', version: 'v1.4.2', date: 'Jan 28, 2024', by: 'Admin', status: 'Success', duration: '5m 20s' },
        { id: '2', version: 'v1.4.1', date: 'Jan 20, 2024', by: 'DevOps', status: 'Rolled Back', duration: '4m 10s' },
        { id: '3', version: 'v1.4.0', date: 'Jan 15, 2024', by: 'Admin', status: 'Success', duration: '6m 05s' },
    ];

    const appVersions = [
        { name: 'Member Mobile App', current: '2.1.0', min: '2.0.0', lastUpdate: '2 days ago' },
        { name: 'Trainer Mobile App', current: '1.8.5', min: '1.8.0', lastUpdate: '5 days ago' },
        { name: 'Gym Admin Web', current: '3.0.2', min: '3.0.0', lastUpdate: '1 week ago' },
    ];

    const featureFlags = [
        { name: 'AI Workout Generator', enabled: true, rollout: 100 },
        { name: 'AI Diet Assistant', enabled: true, rollout: 50 },
        { name: 'Chat System', enabled: true, rollout: 100 },
        { name: 'New Analytics Engine', enabled: false, rollout: 0 },
        { name: 'Vision API', enabled: true, rollout: 25 },
    ];

    const systemHealth = [
        { label: 'API Latency', value: '45ms', status: 'ok' },
        { label: 'Error Rate', value: '0.02%', status: 'ok' },
        { label: 'Uptime', value: '99.99%', status: 'ok' },
        { label: 'CPU Usage', value: '42%', status: 'ok' },
        { label: 'DB Read/Write', value: '1.2k/s', status: 'warning' },
        { label: 'Storage', value: '65%', status: 'ok' },
    ];

    const maintenance = {
        next: 'Feb 05, 2024 - 02:00 AM UTC',
        status: 'Upcoming',
        message: 'Database optimization and security patches.',
    };

    const getStatusColor = (status) => {
        switch (status.toLowerCase()) {
            case 'stable': return '#38A169';
            case 'success': return '#38A169';
            case 'failed': return '#E53E3E';
            case 'rolled back': return '#D69E2E';
            case 'ok': return '#38A169';
            case 'warning': return '#D69E2E';
            case 'critical': return '#E53E3E';
            default: return '#718096';
        }
    };

    return (
        <View style={styles.outerContainer}>
            <SuperAdminDrawer
                visible={drawerVisible}
                onClose={() => setDrawerVisible(false)}
                navigation={navigation}
                currentScreen="SuperAdminDeployment"
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
                    <TouchableOpacity style={styles.sidebarItemActive}>
                        <Ionicons name="rocket-outline" size={20} color="#805AD5" />
                        <Text style={styles.sidebarItemTextActive}>Deployment Center</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.sidebarItem} onPress={() => navigation.navigate('SuperAdminBilling')}>
                        <Ionicons name="card-outline" size={20} color="#4A5568" />
                        <Text style={styles.sidebarItemText}>Platform Billing</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.sidebarItem} onPress={() => navigation.navigate('SuperAdminAnalytics')}>
                        <Ionicons name="bar-chart-outline" size={20} color="#4A5568" />
                        <Text style={styles.sidebarItemText}>Analytics</Text>
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
                                <Text style={styles.pageTitle}>Deployment Control Center</Text>
                                <Text style={styles.pageSubtitle}>Manage app releases, environments, and system health.</Text>
                            </View>
                        </View>
                        <View style={styles.headerActions}>
                            <TouchableOpacity style={styles.outlineButton}>
                                <Ionicons name="document-text-outline" size={18} color="#4A5568" />
                                <Text style={styles.outlineButtonText}>View Logs</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.primaryButton}>
                                <Ionicons name="cloud-upload-outline" size={18} color="#FFF" />
                                <Text style={styles.primaryButtonText}>Deploy New Release</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Environment Switcher */}
                    <View style={styles.envSwitcher}>
                        {['Development', 'Staging', 'Production'].map(env => (
                            <TouchableOpacity
                                key={env}
                                style={[styles.envTab, environment === env && styles.envTabActive]}
                                onPress={() => setEnvironment(env)}
                            >
                                <Text style={[styles.envTabText, environment === env && styles.envTabTextActive]}>
                                    {env === 'Development' ? '🚧 ' : env === 'Staging' ? '🧪 ' : '🚀 '}
                                    {env}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={styles.gridContainer}>
                        {/* Left Column */}
                        <View style={styles.column}>
                            {/* Current Release Summary */}
                            <View style={styles.card}>
                                <View style={styles.cardHeader}>
                                    <Text style={styles.cardTitle}>Current Release</Text>
                                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(currentRelease.status) + '20' }]}>
                                        <Text style={[styles.statusText, { color: getStatusColor(currentRelease.status) }]}>{currentRelease.status}</Text>
                                    </View>
                                </View>
                                <View style={styles.releaseInfo}>
                                    <Text style={styles.releaseVersion}>{currentRelease.version}</Text>
                                    <Text style={styles.releaseMeta}>Deployed {currentRelease.deployedAt} by {currentRelease.deployedBy}</Text>
                                    <Text style={styles.releaseNotes}>{currentRelease.notes}</Text>
                                </View>
                                <View style={styles.cardActions}>
                                    <TouchableOpacity style={styles.dangerButtonOutline}>
                                        <Text style={styles.dangerButtonText}>Rollback</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.secondaryButton}>
                                        <Text style={styles.secondaryButtonText}>View Changelog</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Deployment Activity Timeline */}
                            <View style={styles.card}>
                                <Text style={styles.cardTitle}>Live Activity</Text>
                                <View style={styles.timeline}>
                                    {deploymentTimeline.map((item, index) => (
                                        <View key={item.id} style={styles.timelineItem}>
                                            <View style={styles.timelineLeft}>
                                                <View style={[styles.timelineDot, { backgroundColor: getStatusColor(item.status) }]} />
                                                {index !== deploymentTimeline.length - 1 && <View style={styles.timelineLine} />}
                                            </View>
                                            <View style={styles.timelineContent}>
                                                <Text style={styles.timelineTitle}>{item.title}</Text>
                                                <Text style={styles.timelineTime}>{item.time}</Text>
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            </View>

                            {/* App Version Manager */}
                            <View style={styles.card}>
                                <Text style={styles.cardTitle}>App Versions</Text>
                                {appVersions.map((app, index) => (
                                    <View key={index} style={styles.versionRow}>
                                        <View>
                                            <Text style={styles.versionAppName}>{app.name}</Text>
                                            <Text style={styles.versionMeta}>Live: {app.current} • Min: {app.min}</Text>
                                        </View>
                                        <View style={styles.versionActions}>
                                            <TouchableOpacity style={styles.smallButton}>
                                                <Text style={styles.smallButtonText}>Update</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        </View>

                        {/* Right Column */}
                        <View style={styles.column}>
                            {/* System Health */}
                            <View style={styles.card}>
                                <Text style={styles.cardTitle}>System Health</Text>
                                <View style={styles.healthGrid}>
                                    {systemHealth.map((metric, index) => (
                                        <View key={index} style={styles.healthItem}>
                                            <Text style={styles.healthLabel}>{metric.label}</Text>
                                            <Text style={[styles.healthValue, { color: getStatusColor(metric.status) }]}>{metric.value}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>

                            {/* Feature Flags */}
                            <View style={styles.card}>
                                <Text style={styles.cardTitle}>Feature Flags</Text>
                                {featureFlags.map((flag, index) => (
                                    <View key={index} style={styles.flagRow}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.flagName}>{flag.name}</Text>
                                            <View style={styles.rolloutBar}>
                                                <View style={[styles.rolloutFill, { width: `${flag.rollout}%` }]} />
                                            </View>
                                            <Text style={styles.rolloutText}>{flag.rollout}% Rollout</Text>
                                        </View>
                                        <Switch value={flag.enabled} />
                                    </View>
                                ))}
                            </View>

                            {/* Scheduled Maintenance */}
                            <View style={styles.card}>
                                <Text style={styles.cardTitle}>Scheduled Maintenance</Text>
                                <View style={styles.maintenanceBox}>
                                    <View style={styles.maintenanceHeader}>
                                        <Ionicons name="calendar-outline" size={20} color="#4A5568" />
                                        <Text style={styles.maintenanceStatus}>{maintenance.status}</Text>
                                    </View>
                                    <Text style={styles.maintenanceDate}>{maintenance.next}</Text>
                                    <Text style={styles.maintenanceMessage}>{maintenance.message}</Text>
                                    <View style={styles.maintenanceActions}>
                                        <TouchableOpacity style={styles.smallButtonOutline}>
                                            <Text style={styles.smallButtonTextOutline}>Edit</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={styles.smallButtonOutline}>
                                            <Text style={styles.smallButtonTextOutline}>Cancel</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Deployment History Table */}
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Deployment History</Text>
                        <View style={styles.table}>
                            <View style={styles.tableHeader}>
                                <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Version</Text>
                                <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Date</Text>
                                <Text style={[styles.tableHeaderCell, { flex: 1 }]}>By</Text>
                                <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Status</Text>
                                <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Duration</Text>
                                <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Actions</Text>
                            </View>
                            {deploymentHistory.map(item => (
                                <View key={item.id} style={styles.tableRow}>
                                    <Text style={[styles.tableCell, { flex: 1, fontWeight: '600' }]}>{item.version}</Text>
                                    <Text style={[styles.tableCell, { flex: 1.5 }]}>{item.date}</Text>
                                    <Text style={[styles.tableCell, { flex: 1 }]}>{item.by}</Text>
                                    <View style={[styles.tableCell, { flex: 1 }]}>
                                        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                                            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
                                        </View>
                                    </View>
                                    <Text style={[styles.tableCell, { flex: 1 }]}>{item.duration}</Text>
                                    <View style={[styles.tableCell, { flex: 1, flexDirection: 'row', gap: 8 }]}>
                                        <TouchableOpacity>
                                            <Ionicons name="refresh-circle-outline" size={20} color="#D69E2E" />
                                        </TouchableOpacity>
                                        <TouchableOpacity>
                                            <Ionicons name="document-text-outline" size={20} color="#4A5568" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* Manual Tools & Logs */}
                    <View style={styles.gridContainer}>
                        <View style={[styles.card, { flex: 1 }]}>
                            <Text style={styles.cardTitle}>Admin Tools</Text>
                            <View style={styles.toolsGrid}>
                                <TouchableOpacity style={styles.toolButton}>
                                    <Ionicons name="trash-outline" size={20} color="#E53E3E" />
                                    <Text style={styles.toolButtonText}>Clear Cache</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.toolButton}>
                                    <Ionicons name="server-outline" size={20} color="#D69E2E" />
                                    <Text style={styles.toolButtonText}>Restart API</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.toolButton}>
                                    <Ionicons name="sync-outline" size={20} color="#3182CE" />
                                    <Text style={styles.toolButtonText}>Reindex DB</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.toolButton}>
                                    <Ionicons name="stop-circle-outline" size={20} color="#E53E3E" />
                                    <Text style={styles.toolButtonText}>Emergency Stop</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                        <View style={[styles.card, { flex: 1 }]}>
                            <Text style={styles.cardTitle}>Quick Logs</Text>
                            <View style={styles.logsList}>
                                {['Build Logs', 'Crash Reports', 'AI Requests', 'Database Queries'].map((log, i) => (
                                    <TouchableOpacity key={i} style={styles.logItem}>
                                        <Text style={styles.logText}>{log}</Text>
                                        <Ionicons name="open-outline" size={16} color="#4A5568" />
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    </View>

                </ScrollView>
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

    primaryButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#3182CE', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, gap: 8 },
    primaryButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
    outlineButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, gap: 8 },
    outlineButtonText: { color: '#4A5568', fontWeight: '600', fontSize: 14 },

    envSwitcher: { flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 8, padding: 4, marginBottom: 24, alignSelf: 'flex-start', borderWidth: 1, borderColor: '#E2E8F0' },
    envTab: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 6 },
    envTabActive: { backgroundColor: '#EDF2F7' },
    envTabText: { fontSize: 14, color: '#718096', fontWeight: '500' },
    envTabTextActive: { color: '#2D3748', fontWeight: '600' },

    gridContainer: { flexDirection: 'row', gap: 24, flexWrap: 'wrap' },
    column: { flex: 1, minWidth: 300, gap: 24 },

    card: { backgroundColor: '#FFF', borderRadius: 12, padding: 24, marginBottom: 24, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#2D3748', marginBottom: 16 },

    statusBadge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12 },
    statusText: { fontSize: 12, fontWeight: '600' },

    releaseInfo: { marginBottom: 16 },
    releaseVersion: { fontSize: 24, fontWeight: 'bold', color: '#2D3748', marginBottom: 4 },
    releaseMeta: { fontSize: 13, color: '#718096', marginBottom: 8 },
    releaseNotes: { fontSize: 14, color: '#4A5568', lineHeight: 20 },
    cardActions: { flexDirection: 'row', gap: 12 },
    dangerButtonOutline: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 6, borderWidth: 1, borderColor: '#E53E3E' },
    dangerButtonText: { color: '#E53E3E', fontWeight: '600', fontSize: 13 },
    secondaryButton: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 6, backgroundColor: '#EDF2F7' },
    secondaryButtonText: { color: '#4A5568', fontWeight: '600', fontSize: 13 },

    timeline: { paddingLeft: 8 },
    timelineItem: { flexDirection: 'row', marginBottom: 20 },
    timelineLeft: { alignItems: 'center', marginRight: 12, width: 20 },
    timelineDot: { width: 12, height: 12, borderRadius: 6, zIndex: 1 },
    timelineLine: { width: 2, backgroundColor: '#E2E8F0', flex: 1, position: 'absolute', top: 12, bottom: -20, left: 5 },
    timelineContent: { flex: 1 },
    timelineTitle: { fontSize: 14, fontWeight: '600', color: '#2D3748' },
    timelineTime: { fontSize: 12, color: '#718096' },

    versionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F7FAFC' },
    versionAppName: { fontSize: 15, fontWeight: '600', color: '#2D3748' },
    versionMeta: { fontSize: 13, color: '#718096' },
    smallButton: { backgroundColor: '#EDF2F7', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6 },
    smallButtonText: { fontSize: 12, fontWeight: '600', color: '#4A5568' },

    healthGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
    healthItem: { width: '45%', backgroundColor: '#F7FAFC', padding: 12, borderRadius: 8 },
    healthLabel: { fontSize: 13, color: '#718096', marginBottom: 4 },
    healthValue: { fontSize: 18, fontWeight: 'bold' },

    flagRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F7FAFC' },
    flagName: { fontSize: 14, fontWeight: '600', color: '#2D3748', marginBottom: 4 },
    rolloutBar: { height: 4, backgroundColor: '#EDF2F7', borderRadius: 2, width: 100, marginBottom: 4 },
    rolloutFill: { height: '100%', backgroundColor: '#3182CE', borderRadius: 2 },
    rolloutText: { fontSize: 11, color: '#718096' },

    maintenanceBox: { backgroundColor: '#FFFAF0', padding: 16, borderRadius: 8, borderWidth: 1, borderColor: '#FEEBC8' },
    maintenanceHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    maintenanceStatus: { fontSize: 13, fontWeight: '600', color: '#D69E2E' },
    maintenanceDate: { fontSize: 14, fontWeight: 'bold', color: '#2D3748', marginBottom: 4 },
    maintenanceMessage: { fontSize: 13, color: '#4A5568', marginBottom: 12 },
    maintenanceActions: { flexDirection: 'row', gap: 8 },
    smallButtonOutline: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 4, borderWidth: 1, borderColor: '#CBD5E0', backgroundColor: '#FFF' },
    smallButtonTextOutline: { fontSize: 12, fontWeight: '600', color: '#4A5568' },

    table: {},
    tableHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingBottom: 12, marginBottom: 12 },
    tableHeaderCell: { fontSize: 12, fontWeight: '600', color: '#718096', textTransform: 'uppercase' },
    tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F7FAFC' },
    tableCell: { fontSize: 14, color: '#2D3748' },

    toolsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    toolButton: { width: '48%', flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFF' },
    toolButtonText: { fontSize: 13, fontWeight: '600', color: '#4A5568' },

    logsList: { gap: 8 },
    logItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, backgroundColor: '#F7FAFC', borderRadius: 8 },
    logText: { fontSize: 14, color: '#2D3748' },
});

export default SuperAdminDeploymentControlCenterScreen;
