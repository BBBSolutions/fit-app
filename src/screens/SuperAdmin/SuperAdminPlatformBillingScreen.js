import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal, Switch, Platform, useWindowDimensions, TextInput, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SuperAdminDrawer from '../../components/SuperAdminDrawer';

const isWeb = Platform.OS === 'web';

const SuperAdminPlatformBillingScreen = ({ navigation }) => {
    const [drawerVisible, setDrawerVisible] = useState(false);
    const { width } = useWindowDimensions();
    const isMobile = width < 768;

    const [dateRange, setDateRange] = useState('30 days');
    const [detailsPanelVisible, setDetailsPanelVisible] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');

    // KPI Data
    const kpis = [
        { label: 'Monthly Recurring Revenue', value: '$42,500', change: '+12.5%', icon: 'cash-outline', color: '#38A169' },
        { label: 'Annual Recurring Revenue', value: '$510,000', change: '+8.2%', icon: 'calendar-outline', color: '#3182CE' },
        { label: 'Active Paying Gyms', value: '142', change: '+5', icon: 'business-outline', color: '#805AD5' },
        { label: 'Failed Payments', value: '4', change: '-2', icon: 'alert-circle-outline', color: '#E53E3E' },
    ];

    // Subscription Overview Data
    const subscriptionOverview = [
        { tier: 'Enterprise', count: 12, color: '#805AD5' },
        { tier: 'Pro', count: 45, color: '#3182CE' },
        { tier: 'Basic', count: 85, color: '#38A169' },
        { tier: 'Free', count: 20, color: '#718096' },
    ];

    // Invoices Data
    const invoices = [
        { id: 'INV-2024-001', gym: 'Elite Fitness', tier: 'Pro', amount: '$199.00', status: 'Paid', date: 'Oct 24, 2024', due: 'Oct 24, 2024' },
        { id: 'INV-2024-002', gym: 'PowerGym Downtown', tier: 'Enterprise', amount: '$499.00', status: 'Paid', date: 'Oct 23, 2024', due: 'Oct 23, 2024' },
        { id: 'INV-2024-003', gym: 'FlexFit Studio', tier: 'Basic', amount: '$99.00', status: 'Failed', date: 'Oct 22, 2024', due: 'Oct 22, 2024' },
        { id: 'INV-2024-004', gym: 'CrossFit Warriors', tier: 'Pro', amount: '$199.00', status: 'Pending', date: 'Oct 25, 2024', due: 'Oct 25, 2024' },
        { id: 'INV-2024-005', gym: 'Yoga Zen', tier: 'Basic', amount: '$99.00', status: 'Paid', date: 'Oct 21, 2024', due: 'Oct 21, 2024' },
    ];

    const handleViewInvoice = (invoice) => {
        setSelectedInvoice(invoice);
        setDetailsPanelVisible(true);
    };

    const getStatusColor = (status) => {
        const colors = { 'Paid': '#38A169', 'Pending': '#D69E2E', 'Failed': '#E53E3E', 'Refunded': '#718096' };
        return colors[status] || '#718096';
    };

    const filteredInvoices = invoices.filter(inv => {
        const matchesSearch = inv.gym.toLowerCase().includes(searchQuery.toLowerCase()) || inv.id.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = filterStatus === 'All' || inv.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    return (
        <View style={styles.outerContainer}>
            <SuperAdminDrawer
                visible={drawerVisible}
                onClose={() => setDrawerVisible(false)}
                navigation={navigation}
                currentScreen="SuperAdminBilling"
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
                    <TouchableOpacity style={styles.sidebarItemActive}>
                        <Ionicons name="card-outline" size={20} color="#805AD5" />
                        <Text style={styles.sidebarItemTextActive}>Platform Billing</Text>
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
                                <Text style={styles.pageTitle}>Platform Billing & Invoices</Text>
                                <Text style={styles.pageSubtitle}>Manage payments from gyms, subscription revenue, and platform billing settings.</Text>
                            </View>
                        </View>
                        <View style={styles.headerActions}>
                            <TouchableOpacity style={styles.actionButton}>
                                <Ionicons name="download-outline" size={18} color="#4A5568" />
                                <Text style={styles.actionButtonText}>Export CSV</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Revenue Summary (KPIs) */}
                    <View style={styles.kpiGrid}>
                        {kpis.map((kpi, index) => (
                            <View key={index} style={styles.kpiCard}>
                                <View style={styles.kpiHeader}>
                                    <Ionicons name={kpi.icon} size={24} color={kpi.color} />
                                    <Text style={[styles.kpiChange, { color: kpi.change.startsWith('+') ? '#38A169' : '#E53E3E' }]}>{kpi.change}</Text>
                                </View>
                                <Text style={styles.kpiValue}>{kpi.value}</Text>
                                <Text style={styles.kpiLabel}>{kpi.label}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Revenue Trends Chart Placeholder */}
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.cardTitle}>Revenue Trends</Text>
                            <View style={styles.chartFilters}>
                                {['7 days', '30 days', '3 months'].map(range => (
                                    <TouchableOpacity key={range} style={[styles.filterChip, dateRange === range && styles.filterChipActive]} onPress={() => setDateRange(range)}>
                                        <Text style={[styles.filterChipText, dateRange === range && styles.filterChipTextActive]}>{range}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                        <View style={styles.chartPlaceholder}>
                            <Ionicons name="bar-chart-outline" size={48} color="#CBD5E0" />
                            <Text style={styles.chartPlaceholderText}>Revenue Chart Visualization</Text>
                        </View>
                    </View>

                    <View style={styles.twoColumnRow}>
                        {/* Subscription Overview */}
                        <View style={[styles.card, { flex: 1 }]}>
                            <Text style={styles.cardTitle}>Subscription Overview</Text>
                            <View style={styles.subscriptionList}>
                                {subscriptionOverview.map((item, index) => (
                                    <View key={index} style={styles.subscriptionRow}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                            <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: item.color }} />
                                            <Text style={styles.subscriptionTier}>{item.tier}</Text>
                                        </View>
                                        <Text style={styles.subscriptionCount}>{item.count} Gyms</Text>
                                    </View>
                                ))}
                            </View>
                            <View style={styles.alertBox}>
                                <Ionicons name="alert-circle" size={20} color="#D69E2E" />
                                <Text style={styles.alertText}>5 gyms have overdue payments.</Text>
                            </View>
                        </View>

                        {/* Billing Alerts Panel */}
                        <View style={[styles.card, { flex: 1 }]}>
                            <Text style={styles.cardTitle}>Billing Alerts</Text>
                            <View style={styles.alertList}>
                                <View style={styles.alertItem}>
                                    <Ionicons name="warning" size={20} color="#E53E3E" />
                                    <View>
                                        <Text style={styles.alertTitle}>Failed Payments</Text>
                                        <Text style={styles.alertDesc}>4 transactions failed today.</Text>
                                    </View>
                                </View>
                                <View style={styles.alertItem}>
                                    <Ionicons name="card" size={20} color="#D69E2E" />
                                    <View>
                                        <Text style={styles.alertTitle}>Payment Gateway</Text>
                                        <Text style={styles.alertDesc}>Stripe webhook latency high.</Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Invoices Table */}
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.cardTitle}>Recent Invoices</Text>
                            <View style={styles.searchContainer}>
                                <Ionicons name="search" size={18} color="#718096" />
                                <TextInput
                                    style={styles.searchInput}
                                    placeholder="Search gym or invoice ID..."
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                />
                            </View>
                        </View>
                        <View style={styles.filterRow}>
                            {['All', 'Paid', 'Pending', 'Failed'].map(status => (
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
                                <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Invoice ID</Text>
                                <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Gym Name</Text>
                                <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Amount</Text>
                                <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Status</Text>
                                <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Date</Text>
                                <Text style={[styles.tableHeaderCell, { flex: 0.5 }]}></Text>
                            </View>
                            {filteredInvoices.map(invoice => (
                                <TouchableOpacity key={invoice.id} style={styles.tableRow} onPress={() => handleViewInvoice(invoice)}>
                                    <Text style={[styles.tableCell, { flex: 1.5, fontWeight: '600' }]}>{invoice.id}</Text>
                                    <Text style={[styles.tableCell, { flex: 2 }]}>{invoice.gym}</Text>
                                    <Text style={[styles.tableCell, { flex: 1 }]}>{invoice.amount}</Text>
                                    <View style={[styles.tableCell, { flex: 1 }]}>
                                        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(invoice.status) + '20' }]}>
                                            <Text style={[styles.statusText, { color: getStatusColor(invoice.status) }]}>{invoice.status}</Text>
                                        </View>
                                    </View>
                                    <Text style={[styles.tableCell, { flex: 1.5, color: '#718096' }]}>{invoice.date}</Text>
                                    <View style={[styles.tableCell, { flex: 0.5 }]}>
                                        <Ionicons name="chevron-forward" size={18} color="#CBD5E0" />
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Payment Gateway & Tax Settings */}
                    <View style={styles.twoColumnRow}>
                        <View style={[styles.card, { flex: 1 }]}>
                            <Text style={styles.cardTitle}>Payment Gateway</Text>
                            <View style={styles.gatewayConfig}>
                                <View style={styles.gatewayHeader}>
                                    <Ionicons name="logo-usd" size={24} color="#6772E5" />
                                    <Text style={styles.gatewayName}>Stripe</Text>
                                    <View style={styles.connectedBadge}>
                                        <Text style={styles.connectedText}>Connected</Text>
                                    </View>
                                </View>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>API Key</Text>
                                    <TextInput style={styles.input} value="pk_test_..." editable={false} />
                                </View>
                                <View style={styles.switchRow}>
                                    <Text style={styles.switchLabel}>Test Mode</Text>
                                    <Switch value={false} />
                                </View>
                            </View>
                        </View>

                        <View style={[styles.card, { flex: 1 }]}>
                            <Text style={styles.cardTitle}>Tax Settings</Text>
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>GST %</Text>
                                <TextInput style={styles.input} placeholder="18%" />
                            </View>
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>VAT %</Text>
                                <TextInput style={styles.input} placeholder="0%" />
                            </View>
                            <View style={styles.switchRow}>
                                <Text style={styles.switchLabel}>Apply tax per gym location</Text>
                                <Switch value={true} />
                            </View>
                            <TouchableOpacity style={styles.primaryButton}>
                                <Text style={styles.primaryButtonText}>Save Settings</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                </ScrollView>

                {/* Gym Details Side Panel */}
                <Modal visible={detailsPanelVisible} animationType="slide" transparent onRequestClose={() => setDetailsPanelVisible(false)}>
                    <View style={styles.panelOverlay}>
                        <TouchableOpacity style={styles.panelBackdrop} onPress={() => setDetailsPanelVisible(false)} />
                        <View style={styles.sidePanel}>
                            <View style={styles.panelHeader}>
                                <Text style={styles.panelTitle}>Invoice Details</Text>
                                <TouchableOpacity onPress={() => setDetailsPanelVisible(false)}>
                                    <Ionicons name="close" size={28} color="#4A5568" />
                                </TouchableOpacity>
                            </View>
                            <ScrollView style={styles.panelContent}>
                                {selectedInvoice && (
                                    <>
                                        <View style={styles.panelSection}>
                                            <Text style={styles.panelSectionTitle}>Invoice Info</Text>
                                            <View style={styles.detailRow}>
                                                <Text style={styles.detailLabel}>Invoice ID</Text>
                                                <Text style={styles.detailValue}>{selectedInvoice.id}</Text>
                                            </View>
                                            <View style={styles.detailRow}>
                                                <Text style={styles.detailLabel}>Amount</Text>
                                                <Text style={styles.detailValue}>{selectedInvoice.amount}</Text>
                                            </View>
                                            <View style={styles.detailRow}>
                                                <Text style={styles.detailLabel}>Status</Text>
                                                <Text style={[styles.detailValue, { color: getStatusColor(selectedInvoice.status) }]}>{selectedInvoice.status}</Text>
                                            </View>
                                            <View style={styles.detailRow}>
                                                <Text style={styles.detailLabel}>Date</Text>
                                                <Text style={styles.detailValue}>{selectedInvoice.date}</Text>
                                            </View>
                                        </View>

                                        <View style={styles.panelSection}>
                                            <Text style={styles.panelSectionTitle}>Gym Details</Text>
                                            <Text style={styles.gymName}>{selectedInvoice.gym}</Text>
                                            <Text style={styles.gymTier}>{selectedInvoice.tier} Plan</Text>
                                        </View>

                                        <View style={styles.panelSection}>
                                            <Text style={styles.panelSectionTitle}>Actions</Text>
                                            <View style={styles.actionButtons}>
                                                <TouchableOpacity style={styles.panelButton}>
                                                    <Ionicons name="cloud-download-outline" size={20} color="#4A5568" />
                                                    <Text style={styles.panelButtonText}>Download PDF</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity style={styles.panelButton}>
                                                    <Ionicons name="mail-outline" size={20} color="#4A5568" />
                                                    <Text style={styles.panelButtonText}>Resend Invoice</Text>
                                                </TouchableOpacity>
                                                {selectedInvoice.status === 'Failed' && (
                                                    <TouchableOpacity style={[styles.panelButton, { borderColor: '#E53E3E' }]}>
                                                        <Ionicons name="refresh-outline" size={20} color="#E53E3E" />
                                                        <Text style={[styles.panelButtonText, { color: '#E53E3E' }]}>Retry Payment</Text>
                                                    </TouchableOpacity>
                                                )}
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
    filterChipActive: { backgroundColor: '#3182CE', borderColor: '#3182CE' },
    filterChipText: { fontSize: 13, color: '#4A5568' },
    filterChipTextActive: { color: '#FFF' },
    chartPlaceholder: { height: 200, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F7FAFC', borderRadius: 8 },
    chartPlaceholderText: { fontSize: 14, color: '#A0AEC0' },

    twoColumnRow: { flexDirection: 'row', gap: 24, marginBottom: 24 },
    subscriptionList: { gap: 12 },
    subscriptionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F7FAFC' },
    subscriptionTier: { fontSize: 15, color: '#2D3748', fontWeight: '500' },
    subscriptionCount: { fontSize: 15, fontWeight: '600', color: '#2D3748' },
    alertBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FEF5E7', padding: 12, borderRadius: 8, marginTop: 16 },
    alertText: { fontSize: 14, color: '#D69E2E', fontWeight: '600' },

    alertList: { gap: 12 },
    alertItem: { flexDirection: 'row', gap: 12, padding: 12, backgroundColor: '#FEF5F5', borderRadius: 8 },
    alertTitle: { fontSize: 14, fontWeight: 'bold', color: '#E53E3E' },
    alertDesc: { fontSize: 13, color: '#718096' },

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

    gatewayConfig: { gap: 16 },
    gatewayHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
    gatewayName: { fontSize: 18, fontWeight: 'bold', color: '#2D3748' },
    connectedBadge: { backgroundColor: '#C6F6D5', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 12 },
    connectedText: { fontSize: 12, fontWeight: '600', color: '#276749' },
    inputGroup: { marginBottom: 16 },
    inputLabel: { fontSize: 14, color: '#4A5568', marginBottom: 8 },
    input: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, padding: 10, fontSize: 15, backgroundColor: '#FFF' },
    switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    switchLabel: { fontSize: 15, color: '#2D3748' },
    primaryButton: { backgroundColor: '#3182CE', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
    primaryButtonText: { fontSize: 15, fontWeight: 'bold', color: '#FFF' },

    panelOverlay: { flex: 1, flexDirection: 'row', justifyContent: 'flex-end' },
    panelBackdrop: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)' },
    sidePanel: { width: 450, backgroundColor: '#FFF', shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 8, elevation: 5 },
    panelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
    panelTitle: { fontSize: 24, fontWeight: 'bold', color: '#1A202C' },
    panelContent: { flex: 1, padding: 24 },
    panelSection: { marginBottom: 32 },
    panelSectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#2D3748', marginBottom: 16 },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F7FAFC' },
    detailLabel: { fontSize: 15, color: '#718096' },
    detailValue: { fontSize: 15, fontWeight: '600', color: '#2D3748' },
    gymName: { fontSize: 20, fontWeight: 'bold', color: '#2D3748', marginBottom: 4 },
    gymTier: { fontSize: 15, color: '#3182CE', fontWeight: '600' },
    actionButtons: { gap: 12 },
    panelButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E2E8F0', paddingVertical: 12, borderRadius: 8, gap: 8 },
    panelButtonText: { fontSize: 15, fontWeight: '600', color: '#4A5568' },
});

export default SuperAdminPlatformBillingScreen;
