import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Modal, Switch, Platform, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import SuperAdminDrawer from '../../components/SuperAdminDrawer';

const isWeb = Platform.OS === 'web';

const SuperAdminOpenAITokenUsageMonitorScreen = ({ navigation }) => {
    const [drawerVisible, setDrawerVisible] = useState(false);
    const { width } = useWindowDimensions();
    const isMobile = width < 768;

    const [dateRange, setDateRange] = useState('30 days');
    const [selectedGym, setSelectedGym] = useState(null);
    const [detailsPanelVisible, setDetailsPanelVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');

    const kpis = [
        { label: 'Total Tokens Used', value: '12.4M', change: '+18.5%', icon: 'flash', color: '#3182CE' },
        { label: 'Total AI Cost', value: '$2,847', change: '+12.3%', icon: 'cash', color: '#38A169' },
        { label: 'Highest-Usage Gym', value: 'Elite Fitness', change: '145K tokens', icon: 'trophy', color: '#D69E2E' },
        { label: 'Fastest Growing', value: '+245%', change: 'PowerGym', icon: 'trending-up', color: '#805AD5' },
        { label: 'Avg Tokens/User', value: '2,840', change: '+8.2%', icon: 'people', color: '#3182CE' },
        { label: 'Errors/Failed', value: '12', change: '-25%', icon: 'warning', color: '#E53E3E' },
    ];

    const gyms = [
        { id: '1', name: 'Elite Fitness Center', code: 'EFC001', tokens: 145000, cost: 421.50, actions: 1240, model: 'GPT-4o', status: 'Within Limit', tier: 'Pro' },
        { id: '2', name: 'PowerGym Downtown', code: 'PGD002', tokens: 98000, cost: 285.20, actions: 890, model: 'GPT-4o-mini', status: 'Near Limit', tier: 'Enterprise' },
        { id: '3', name: 'FlexFit Studio', code: 'FFS003', tokens: 52000, cost: 151.60, actions: 520, model: 'GPT-4o', status: 'Within Limit', tier: 'Basic' },
        { id: '4', name: 'CrossFit Warriors', code: 'CFW004', tokens: 125000, cost: 363.75, actions: 1050, model: 'GPT-4o', status: 'Exceeded', tier: 'Pro' },
    ];

    const topUsers = [
        { name: 'John Smith', gym: 'Elite Fitness', role: 'Trainer', tokens: 12500, feature: 'AI Workout Gen' },
        { name: 'Sarah Johnson', gym: 'PowerGym', role: 'Member', tokens: 8900, feature: 'AI Diet Plan' },
        { name: 'Mike Chen', gym: 'FlexFit', role: 'Trainer', tokens: 7200, feature: 'AI Insights' },
        { name: 'Emily Davis', gym: 'CrossFit', role: 'Admin', tokens: 6800, feature: 'Chat AI' },
    ];

    const modelUsage = [
        { name: 'GPT-4o', tokens: '5.2M', cost: '$1,248', percentage: 42 },
        { name: 'GPT-4o-mini', tokens: '4.8M', cost: '$892', percentage: 39 },
        { name: 'Embeddings', tokens: '1.8M', cost: '$421', percentage: 15 },
        { name: 'Vision', tokens: '480K', cost: '$186', percentage: 4 },
    ];

    const errors = [
        { type: 'Rate Limit', count: 5, time: '2 min ago' },
        { type: 'Over Quota', count: 3, time: '15 min ago' },
        { type: 'Timeout', count: 2, time: '1 hour ago' },
        { type: 'Invalid Request', count: 2, time: '2 hours ago' },
    ];

    const handleGymClick = (gym) => {
        setSelectedGym(gym);
        setDetailsPanelVisible(true);
    };

    const getStatusColor = (status) => {
        const colors = { 'Within Limit': '#38A169', 'Near Limit': '#D69E2E', 'Exceeded': '#E53E3E' };
        return colors[status] || '#718096';
    };

    const filteredGyms = gyms.filter(gym => {
        const matchesSearch = gym.name.toLowerCase().includes(searchQuery.toLowerCase()) || gym.code.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = filterStatus === 'All' || gym.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    return (
        <View style={styles.outerContainer}>
            <SuperAdminDrawer
                visible={drawerVisible}
                onClose={() => setDrawerVisible(false)}
                navigation={navigation}
                currentScreen="SuperAdminAITokenMonitor"
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
                    <TouchableOpacity style={styles.sidebarItemActive}>
                        <Ionicons name="pulse-outline" size={20} color="#805AD5" />
                        <Text style={styles.sidebarItemTextActive}>AI Token Monitor</Text>
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
                                <TouchableOpacity
                                    onPress={() => setDrawerVisible(true)}
                                    style={styles.hamburgerButton}
                                >
                                    <Ionicons name="menu" size={28} color="#2D3748" />
                                </TouchableOpacity>
                            )}
                            <View>
                                <Text style={styles.pageTitle}>AI Token Usage Monitor</Text>
                                <Text style={styles.pageSubtitle}>Track OpenAI token consumption and costs across all gyms.</Text>
                            </View>
                        </View>
                        <View style={styles.headerActions}>
                            <View style={styles.dateRangeSelector}>
                                {['Today', '7 days', '30 days', 'Custom'].map(range => (
                                    <TouchableOpacity
                                        key={range}
                                        style={[styles.rangeButton, dateRange === range && styles.rangeButtonActive]}
                                        onPress={() => setDateRange(range)}
                                    >
                                        <Text style={[styles.rangeButtonText, dateRange === range && styles.rangeButtonTextActive]}>{range}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                            <TouchableOpacity style={styles.exportButton}>
                                <Ionicons name="download-outline" size={18} color="#4A5568" />
                                <Text style={styles.exportButtonText}>Export</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* KPI Cards */}
                    <View style={styles.kpiGrid}>
                        {kpis.map((kpi, i) => (
                            <View key={i} style={styles.kpiCard}>
                                <View style={styles.kpiHeader}>
                                    <Ionicons name={kpi.icon} size={24} color={kpi.color} />
                                    <Text style={[styles.kpiChange, { color: kpi.change.startsWith('+') ? '#38A169' : kpi.change.startsWith('-') ? '#E53E3E' : '#718096' }]}>
                                        {kpi.change}
                                    </Text>
                                </View>
                                <Text style={styles.kpiValue}>{kpi.value}</Text>
                                <Text style={styles.kpiLabel}>{kpi.label}</Text>
                            </View>
                        ))}
                    </View>

                    {/* AI Usage Over Time Chart */}
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.cardTitle}>AI Usage Over Time</Text>
                            <View style={styles.chartFilters}>
                                {['All Models', 'GPT', 'Embeddings', 'Vision', 'Audio'].map(filter => (
                                    <TouchableOpacity key={filter} style={styles.filterChip}>
                                        <Text style={styles.filterChipText}>{filter}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                        <View style={styles.chartPlaceholder}>
                            <Ionicons name="bar-chart" size={48} color="#CBD5E0" />
                            <Text style={styles.chartPlaceholderText}>Line chart: Daily token usage by model</Text>
                        </View>
                    </View>

                    {/* Usage Breakdown by Gym */}
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.cardTitle}>Usage Breakdown by Gym</Text>
                            <View style={styles.searchContainer}>
                                <Ionicons name="search" size={18} color="#718096" />
                                <TextInput
                                    style={styles.searchInput}
                                    placeholder="Search gyms..."
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                />
                            </View>
                        </View>
                        <View style={styles.filterRow}>
                            {['All', 'Within Limit', 'Near Limit', 'Exceeded'].map(status => (
                                <TouchableOpacity
                                    key={status}
                                    style={[styles.statusFilter, filterStatus === status && styles.statusFilterActive]}
                                    onPress={() => setFilterStatus(status)}
                                >
                                    <Text style={[styles.statusFilterText, filterStatus === status && styles.statusFilterTextActive]}>{status}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <View style={styles.table}>
                            <View style={styles.tableHeader}>
                                <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Gym Name</Text>
                                <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Code</Text>
                                <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Tokens Used</Text>
                                <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Cost ($)</Text>
                                <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Actions</Text>
                                <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Top Model</Text>
                                <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Status</Text>
                                <Text style={[styles.tableHeaderCell, { flex: 0.5 }]}></Text>
                            </View>
                            {filteredGyms.map(gym => (
                                <TouchableOpacity key={gym.id} style={styles.tableRow} onPress={() => handleGymClick(gym)}>
                                    <Text style={[styles.tableCell, { flex: 2, fontWeight: '600' }]}>{gym.name}</Text>
                                    <Text style={[styles.tableCell, { flex: 1, color: '#718096' }]}>{gym.code}</Text>
                                    <Text style={[styles.tableCell, { flex: 1 }]}>{(gym.tokens / 1000).toFixed(1)}K</Text>
                                    <Text style={[styles.tableCell, { flex: 1 }]}>${gym.cost.toFixed(2)}</Text>
                                    <Text style={[styles.tableCell, { flex: 1 }]}>{gym.actions}</Text>
                                    <Text style={[styles.tableCell, { flex: 1 }]}>{gym.model}</Text>
                                    <View style={[styles.tableCell, { flex: 1 }]}>
                                        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(gym.status) + '20' }]}>
                                            <Text style={[styles.statusText, { color: getStatusColor(gym.status) }]}>{gym.status}</Text>
                                        </View>
                                    </View>
                                    <View style={[styles.tableCell, { flex: 0.5 }]}>
                                        <Ionicons name="chevron-forward" size={18} color="#CBD5E0" />
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Top Users and Model Usage */}
                    <View style={styles.twoColumnRow}>
                        {/* Top Users */}
                        <View style={[styles.card, { flex: 1 }]}>
                            <Text style={styles.cardTitle}>Top Users (Members & Trainers)</Text>
                            <View style={styles.userList}>
                                {topUsers.map((user, i) => (
                                    <View key={i} style={styles.userRow}>
                                        <View style={styles.userAvatar}>
                                            <Text style={styles.userAvatarText}>{user.name.split(' ').map(n => n[0]).join('')}</Text>
                                        </View>
                                        <View style={styles.userInfo}>
                                            <Text style={styles.userName}>{user.name}</Text>
                                            <Text style={styles.userMeta}>{user.gym} • {user.role}</Text>
                                        </View>
                                        <View style={styles.userStats}>
                                            <Text style={styles.userTokens}>{(user.tokens / 1000).toFixed(1)}K</Text>
                                            <Text style={styles.userFeature}>{user.feature}</Text>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        </View>

                        {/* Model Usage */}
                        <View style={[styles.card, { flex: 1 }]}>
                            <Text style={styles.cardTitle}>Usage by Model Type</Text>
                            <View style={styles.modelList}>
                                {modelUsage.map((model, i) => (
                                    <View key={i} style={styles.modelRow}>
                                        <Text style={styles.modelName}>{model.name}</Text>
                                        <View style={styles.modelBar}>
                                            <View style={[styles.modelBarFill, { width: `${model.percentage}%` }]} />
                                        </View>
                                        <Text style={styles.modelTokens}>{model.tokens}</Text>
                                        <Text style={styles.modelCost}>{model.cost}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    </View>

                    {/* Error Monitor and Cost Forecast */}
                    <View style={styles.twoColumnRow}>
                        {/* Error Monitor */}
                        <View style={[styles.card, { flex: 1 }]}>
                            <Text style={styles.cardTitle}>Error & Rate Limit Monitor</Text>
                            <View style={styles.errorList}>
                                {errors.map((error, i) => (
                                    <View key={i} style={styles.errorRow}>
                                        <Ionicons name="alert-circle" size={20} color="#E53E3E" />
                                        <View style={styles.errorInfo}>
                                            <Text style={styles.errorType}>{error.type}</Text>
                                            <Text style={styles.errorTime}>{error.time}</Text>
                                        </View>
                                        <Text style={styles.errorCount}>{error.count}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>

                        {/* Cost Forecast */}
                        <View style={[styles.card, { flex: 1 }]}>
                            <Text style={styles.cardTitle}>Cost Forecast</Text>
                            <View style={styles.forecastContent}>
                                <Text style={styles.forecastLabel}>Estimated Monthly Cost</Text>
                                <Text style={styles.forecastValue}>$8,542</Text>
                                <Text style={styles.forecastChange}>+15.3% vs last month</Text>
                                <View style={styles.forecastChart}>
                                    <Ionicons name="trending-up" size={32} color="#3182CE" />
                                    <Text style={styles.forecastChartText}>Trend based on 7-day average</Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* System Controls */}
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>System-Wide AI Controls</Text>
                        <View style={styles.controlsGrid}>
                            <View style={styles.controlItem}>
                                <Text style={styles.controlLabel}>Global Monthly Budget Limit</Text>
                                <TextInput style={styles.controlInput} placeholder="$10,000" />
                            </View>
                            <View style={styles.controlItem}>
                                <Text style={styles.controlLabel}>Vision API</Text>
                                <Switch value={true} />
                            </View>
                            <View style={styles.controlItem}>
                                <Text style={styles.controlLabel}>Audio Transcription</Text>
                                <Switch value={true} />
                            </View>
                            <View style={styles.controlItem}>
                                <Text style={styles.controlLabel}>AI Workout Generator</Text>
                                <Switch value={true} />
                            </View>
                            <View style={styles.controlItem}>
                                <Text style={styles.controlLabel}>High-cost Models (GPT-4o)</Text>
                                <Switch value={false} />
                            </View>
                        </View>
                    </View>
                </ScrollView>

                {/* Gym Details Panel */}
                <Modal visible={detailsPanelVisible} animationType="slide" transparent onRequestClose={() => setDetailsPanelVisible(false)}>
                    <View style={styles.panelOverlay}>
                        <TouchableOpacity style={styles.panelBackdrop} onPress={() => setDetailsPanelVisible(false)} />
                        <View style={styles.sidePanel}>
                            <View style={styles.panelHeader}>
                                <Text style={styles.panelTitle}>Gym Usage Details</Text>
                                <TouchableOpacity onPress={() => setDetailsPanelVisible(false)}>
                                    <Ionicons name="close" size={28} color="#4A5568" />
                                </TouchableOpacity>
                            </View>
                            <ScrollView style={styles.panelContent}>
                                {selectedGym && (
                                    <>
                                        <View style={styles.panelSection}>
                                            <Text style={styles.panelSectionTitle}>Overview</Text>
                                            <Text style={styles.gymName}>{selectedGym.name}</Text>
                                            <Text style={styles.gymCode}>{selectedGym.code}</Text>
                                            <Text style={styles.gymTier}>Tier: {selectedGym.tier}</Text>
                                        </View>

                                        <View style={styles.panelSection}>
                                            <Text style={styles.panelSectionTitle}>Usage Metrics</Text>
                                            <View style={styles.metricRow}>
                                                <Text style={styles.metricLabel}>Total Tokens Used</Text>
                                                <Text style={styles.metricValue}>{(selectedGym.tokens / 1000).toFixed(1)}K</Text>
                                            </View>
                                            <View style={styles.metricRow}>
                                                <Text style={styles.metricLabel}>Cost Estimate</Text>
                                                <Text style={styles.metricValue}>${selectedGym.cost.toFixed(2)}</Text>
                                            </View>
                                            <View style={styles.metricRow}>
                                                <Text style={styles.metricLabel}>AI Actions</Text>
                                                <Text style={styles.metricValue}>{selectedGym.actions}</Text>
                                            </View>
                                        </View>

                                        <View style={styles.panelSection}>
                                            <Text style={styles.panelSectionTitle}>Top Features Used</Text>
                                            <View style={styles.featureList}>
                                                <View style={styles.featureItem}>
                                                    <Text style={styles.featureName}>AI Workout Generator</Text>
                                                    <Text style={styles.featurePercentage}>45%</Text>
                                                </View>
                                                <View style={styles.featureItem}>
                                                    <Text style={styles.featureName}>AI Diet Plan</Text>
                                                    <Text style={styles.featurePercentage}>30%</Text>
                                                </View>
                                                <View style={styles.featureItem}>
                                                    <Text style={styles.featureName}>AI Insights</Text>
                                                    <Text style={styles.featurePercentage}>15%</Text>
                                                </View>
                                                <View style={styles.featureItem}>
                                                    <Text style={styles.featureName}>Chat AI</Text>
                                                    <Text style={styles.featurePercentage}>10%</Text>
                                                </View>
                                            </View>
                                        </View>

                                        <View style={styles.panelSection}>
                                            <Text style={styles.panelSectionTitle}>Controls</Text>
                                            <View style={styles.controlGroup}>
                                                <Text style={styles.controlLabel}>Monthly Token Cap</Text>
                                                <TextInput style={styles.controlInput} placeholder="150,000" keyboardType="numeric" />
                                            </View>
                                            <View style={styles.switchRow}>
                                                <Text style={styles.switchLabel}>Enable AI for this gym</Text>
                                                <Switch value={true} />
                                            </View>
                                            <TouchableOpacity style={styles.warningButton}>
                                                <Ionicons name="mail-outline" size={18} color="#D69E2E" />
                                                <Text style={styles.warningButtonText}>Send Usage Warning</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity style={styles.detailsButton}>
                                                <Text style={styles.detailsButtonText}>View Detailed Logs</Text>
                                            </TouchableOpacity>
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
    rangeButton: { paddingVertical: 8, paddingHorizontal: 16 },
    rangeButtonActive: { backgroundColor: '#3182CE' },
    rangeButtonText: { fontSize: 14, color: '#4A5568', fontWeight: '500' },
    rangeButtonTextActive: { color: '#FFF', fontWeight: '600' },
    exportButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, gap: 8 },
    exportButtonText: { fontSize: 14, fontWeight: '600', color: '#4A5568' },

    kpiGrid: { flexDirection: 'row', gap: 16, marginBottom: 24, flexWrap: 'wrap' },
    kpiCard: { flex: 1, minWidth: 200, backgroundColor: '#FFF', padding: 20, borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
    kpiHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    kpiChange: { fontSize: 13, fontWeight: '600' },
    kpiValue: { fontSize: 28, fontWeight: 'bold', color: '#2D3748', marginBottom: 4 },
    kpiLabel: { fontSize: 13, color: '#718096' },

    card: { backgroundColor: '#FFF', borderRadius: 12, padding: 24, marginBottom: 24, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    cardTitle: { fontSize: 20, fontWeight: 'bold', color: '#2D3748' },
    chartFilters: { flexDirection: 'row', gap: 8 },
    filterChip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, backgroundColor: '#F7FAFC', borderWidth: 1, borderColor: '#E2E8F0' },
    filterChipText: { fontSize: 13, color: '#4A5568' },

    chartPlaceholder: { height: 300, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F7FAFC', borderRadius: 8 },
    chartPlaceholderText: { fontSize: 14, color: '#A0AEC0', marginTop: 12 },

    searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F7FAFC', borderRadius: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: '#E2E8F0', width: 300 },
    searchInput: { flex: 1, padding: 8, fontSize: 14 },
    filterRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
    statusFilter: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, backgroundColor: '#F7FAFC', borderWidth: 1, borderColor: '#E2E8F0' },
    statusFilterActive: { backgroundColor: '#3182CE', borderColor: '#3182CE' },
    statusFilterText: { fontSize: 13, color: '#4A5568' },
    statusFilterTextActive: { color: '#FFF', fontWeight: '600' },

    table: {},
    tableHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingBottom: 12, marginBottom: 12 },
    tableHeaderCell: { fontSize: 13, fontWeight: '600', color: '#4A5568', textTransform: 'uppercase' },
    tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F7FAFC' },
    tableCell: { fontSize: 14, color: '#2D3748' },
    statusBadge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12, alignSelf: 'flex-start' },
    statusText: { fontSize: 12, fontWeight: '600' },

    twoColumnRow: { flexDirection: 'row', gap: 24, marginBottom: 24 },

    userList: { gap: 16 },
    userRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    userAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#3182CE', justifyContent: 'center', alignItems: 'center' },
    userAvatarText: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
    userInfo: { flex: 1 },
    userName: { fontSize: 15, fontWeight: '600', color: '#2D3748', marginBottom: 2 },
    userMeta: { fontSize: 13, color: '#718096' },
    userStats: { alignItems: 'flex-end' },
    userTokens: { fontSize: 16, fontWeight: 'bold', color: '#2D3748', marginBottom: 2 },
    userFeature: { fontSize: 12, color: '#718096' },

    modelList: { gap: 16 },
    modelRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    modelName: { fontSize: 15, fontWeight: '600', color: '#2D3748', width: 120 },
    modelBar: { flex: 1, height: 8, backgroundColor: '#F7FAFC', borderRadius: 4, overflow: 'hidden' },
    modelBarFill: { height: '100%', backgroundColor: '#3182CE', borderRadius: 4 },
    modelTokens: { fontSize: 14, color: '#2D3748', width: 70, textAlign: 'right' },
    modelCost: { fontSize: 14, fontWeight: '600', color: '#38A169', width: 70, textAlign: 'right' },

    errorList: { gap: 12 },
    errorRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, backgroundColor: '#FEF5F5', borderRadius: 8 },
    errorInfo: { flex: 1 },
    errorType: { fontSize: 15, fontWeight: '600', color: '#E53E3E', marginBottom: 2 },
    errorTime: { fontSize: 13, color: '#718096' },
    errorCount: { fontSize: 18, fontWeight: 'bold', color: '#E53E3E' },

    forecastContent: { alignItems: 'center', paddingVertical: 20 },
    forecastLabel: { fontSize: 14, color: '#718096', marginBottom: 8 },
    forecastValue: { fontSize: 36, fontWeight: 'bold', color: '#2D3748', marginBottom: 4 },
    forecastChange: { fontSize: 14, color: '#38A169', marginBottom: 20 },
    forecastChart: { alignItems: 'center', gap: 8 },
    forecastChartText: { fontSize: 13, color: '#718096' },

    controlsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 24 },
    controlItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minWidth: '45%', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F7FAFC' },
    controlLabel: { fontSize: 15, color: '#2D3748', flex: 1 },
    controlInput: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, padding: 10, fontSize: 15, width: 150 },

    panelOverlay: { flex: 1, flexDirection: 'row', justifyContent: 'flex-end' },
    panelBackdrop: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)' },
    sidePanel: { width: 450, backgroundColor: '#FFF', shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 8, elevation: 5 },
    panelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
    panelTitle: { fontSize: 24, fontWeight: 'bold', color: '#1A202C' },
    panelContent: { flex: 1, padding: 24 },
    panelSection: { marginBottom: 32 },
    panelSectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#2D3748', marginBottom: 16 },
    gymName: { fontSize: 20, fontWeight: 'bold', color: '#2D3748', marginBottom: 4 },
    gymCode: { fontSize: 14, color: '#718096', marginBottom: 8 },
    gymTier: { fontSize: 15, color: '#3182CE', fontWeight: '600' },
    metricRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F7FAFC' },
    metricLabel: { fontSize: 15, color: '#718096' },
    metricValue: { fontSize: 15, fontWeight: '600', color: '#2D3748' },
    featureList: { gap: 12 },
    featureItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
    featureName: { fontSize: 15, color: '#2D3748' },
    featurePercentage: { fontSize: 15, fontWeight: '600', color: '#3182CE' },
    controlGroup: { marginBottom: 16 },
    switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, marginBottom: 16 },
    switchLabel: { fontSize: 15, color: '#2D3748' },
    warningButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FEF5E7', borderWidth: 1, borderColor: '#D69E2E', paddingVertical: 12, borderRadius: 8, gap: 8, marginBottom: 12 },
    warningButtonText: { fontSize: 15, fontWeight: '600', color: '#D69E2E' },
    detailsButton: { backgroundColor: '#3182CE', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
    detailsButtonText: { fontSize: 15, fontWeight: 'bold', color: '#FFF' },
});

export default SuperAdminOpenAITokenUsageMonitorScreen;
