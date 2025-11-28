import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Modal, Switch, Platform, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SuperAdminDrawer from '../../components/SuperAdminDrawer';

const isWeb = Platform.OS === 'web';

const SuperAdminGymOnboardingManagerScreen = ({ navigation }) => {
    const [drawerVisible, setDrawerVisible] = useState(false);
    const { width } = useWindowDimensions();
    const isMobile = width < 768;

    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [filterTier, setFilterTier] = useState('All');
    const [selectedGym, setSelectedGym] = useState(null);
    const [detailsPanelVisible, setDetailsPanelVisible] = useState(false);
    const [addGymModalVisible, setAddGymModalVisible] = useState(false);

    const [newGym, setNewGym] = useState({
        name: '',
        code: '',
        ownerName: '',
        ownerEmail: '',
        ownerPhone: '',
        tier: 'Basic',
    });

    const [gyms, setGyms] = useState([
        { id: '1', logo: '🏋️', name: 'Elite Fitness Center', code: 'EFC001', owner: 'John Smith', email: 'john@elite.com', tier: 'Pro', progress: 85, billing: 'Completed', status: 'Active' },
        { id: '2', logo: '💪', name: 'PowerGym Downtown', code: 'PGD002', owner: 'Sarah Johnson', email: 'sarah@powergym.com', tier: 'Enterprise', progress: 100, billing: 'Completed', status: 'Active' },
        { id: '3', logo: '🔥', name: 'FlexFit Studio', code: 'FFS003', owner: 'Mike Chen', email: 'mike@flexfit.com', tier: 'Basic', progress: 60, billing: 'Pending', status: 'Approved' },
        { id: '4', logo: '⚡', name: 'CrossFit Warriors', code: 'CFW004', owner: 'Emily Davis', email: 'emily@cfwarriors.com', tier: 'Pro', progress: 40, billing: 'Pending', status: 'Pending' },
    ]);

    const kpis = [
        { label: 'Pending Applications', value: '12', change: '+3', icon: 'time-outline', color: '#D69E2E' },
        { label: 'Approved Gyms', value: '45', change: '+8', icon: 'checkmark-circle-outline', color: '#38A169' },
        { label: 'Active Gyms', value: '38', change: '+5', icon: 'flash-outline', color: '#3182CE' },
        { label: 'Rejected/Inactive', value: '7', change: '-2', icon: 'close-circle-outline', color: '#E53E3E' },
        { label: 'Missing Billing', value: '5', change: '0', icon: 'card-outline', color: '#805AD5' },
    ];

    const onboardingSteps = [
        { name: 'Profile Completed', completed: true, date: '2024-01-10' },
        { name: 'Branding Uploaded', completed: true, date: '2024-01-11' },
        { name: 'Trainers Added', completed: true, date: '2024-01-12' },
        { name: 'Payment Gateway Connected', completed: false, date: null },
        { name: 'Subscription Tier Selected', completed: true, date: '2024-01-10' },
        { name: 'App Launch Ready', completed: false, date: null },
    ];

    const alerts = [
        { message: '3 gyms pending verification', severity: 'warning', icon: 'alert-circle' },
        { message: '2 gyms with failed billing', severity: 'error', icon: 'close-circle' },
        { message: '5 gyms without trainers', severity: 'info', icon: 'information-circle' },
    ];

    const handleGymClick = (gym) => {
        setSelectedGym(gym);
        setDetailsPanelVisible(true);
    };

    const handleAddGym = () => {
        const gymCode = newGym.code || `GYM${String(gyms.length + 1).padStart(3, '0')}`;
        setGyms([...gyms, { ...newGym, id: Date.now().toString(), code: gymCode, logo: '🏋️', progress: 0, billing: 'Pending', status: 'Pending' }]);
        setAddGymModalVisible(false);
        setNewGym({ name: '', code: '', ownerName: '', ownerEmail: '', ownerPhone: '', tier: 'Basic' });
    };

    const getStatusColor = (status) => {
        const colors = { 'Pending': '#D69E2E', 'Approved': '#38A169', 'Active': '#3182CE', 'Rejected': '#E53E3E' };
        return colors[status] || '#718096';
    };

    const filteredGyms = gyms.filter(gym => {
        const matchesSearch = gym.name.toLowerCase().includes(searchQuery.toLowerCase()) || gym.code.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = filterStatus === 'All' || gym.status === filterStatus;
        const matchesTier = filterTier === 'All' || gym.tier === filterTier;
        return matchesSearch && matchesStatus && matchesTier;
    });

    return (
        <View style={styles.outerContainer}>
            <SuperAdminDrawer
                visible={drawerVisible}
                onClose={() => setDrawerVisible(false)}
                navigation={navigation}
                currentScreen="SuperAdminGymOnboarding"
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
                    <TouchableOpacity style={styles.sidebarItemActive}>
                        <Ionicons name="business-outline" size={20} color="#805AD5" />
                        <Text style={styles.sidebarItemTextActive}>Gym Onboarding</Text>
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
                                <Text style={styles.pageTitle}>Gym Onboarding Manager</Text>
                                <Text style={styles.pageSubtitle}>Review new gym applications and manage activation status.</Text>
                            </View>
                        </View>
                        <View style={{ flexDirection: 'row', gap: 12 }}>
                            <TouchableOpacity style={styles.iconButton}>
                                <Ionicons name="refresh-outline" size={20} color="#4A5568" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.outlineButton}>
                                <Ionicons name="download-outline" size={18} color="#4A5568" />
                                <Text style={styles.outlineButtonText}>Export</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* KPIs */}
                    <View style={styles.kpiGrid}>
                        {kpis.map((kpi, i) => (
                            <View key={i} style={styles.kpiCard}>
                                <Ionicons name={kpi.icon} size={24} color={kpi.color} />
                                <Text style={styles.kpiValue}>{kpi.value}</Text>
                                <Text style={styles.kpiLabel}>{kpi.label}</Text>
                                <Text style={[styles.kpiChange, { color: kpi.change.startsWith('+') ? '#38A169' : '#718096' }]}>{kpi.change}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Alerts */}
                    <View style={styles.alertsCard}>
                        <Text style={styles.cardTitle}>Alerts & Flags</Text>
                        {alerts.map((alert, i) => (
                            <View key={i} style={styles.alertRow}>
                                <Ionicons name={alert.icon} size={20} color={alert.severity === 'error' ? '#E53E3E' : alert.severity === 'warning' ? '#D69E2E' : '#3182CE'} />
                                <Text style={styles.alertText}>{alert.message}</Text>
                                <TouchableOpacity style={styles.alertButton}>
                                    <Text style={styles.alertButtonText}>Review</Text>
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>

                    {/* Filters */}
                    <View style={styles.filtersRow}>
                        <View style={styles.searchContainer}>
                            <Ionicons name="search" size={18} color="#718096" />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Search by gym name or code…"
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                        </View>
                        <View style={styles.filterGroup}>
                            {['All', 'Pending', 'Approved', 'Active', 'Rejected'].map(status => (
                                <TouchableOpacity
                                    key={status}
                                    style={[styles.filterChip, filterStatus === status && styles.filterChipActive]}
                                    onPress={() => setFilterStatus(status)}
                                >
                                    <Text style={[styles.filterChipText, filterStatus === status && styles.filterChipTextActive]}>{status}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Table */}
                    <View style={styles.tableCard}>
                        <View style={styles.tableActions}>
                            <Text style={styles.tableTitle}>Gym Applications</Text>
                            <TouchableOpacity style={styles.primaryButton} onPress={() => setAddGymModalVisible(true)}>
                                <Ionicons name="add" size={18} color="#FFF" />
                                <Text style={styles.primaryButtonText}>Add Gym</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.tableHeader}>
                            <Text style={[styles.tableHeaderCell, { flex: 0.5 }]}>Logo</Text>
                            <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Gym Name</Text>
                            <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Code</Text>
                            <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Owner</Text>
                            <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Tier</Text>
                            <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Progress</Text>
                            <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Billing</Text>
                            <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Status</Text>
                            <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Actions</Text>
                        </View>
                        {filteredGyms.map(gym => (
                            <TouchableOpacity key={gym.id} style={styles.tableRow} onPress={() => handleGymClick(gym)}>
                                <Text style={[styles.tableCell, { flex: 0.5, fontSize: 24 }]}>{gym.logo}</Text>
                                <Text style={[styles.tableCell, { flex: 2, fontWeight: '600' }]}>{gym.name}</Text>
                                <Text style={[styles.tableCell, { flex: 1, color: '#718096' }]}>{gym.code}</Text>
                                <View style={[styles.tableCell, { flex: 1.5 }]}>
                                    <Text style={{ fontSize: 14, color: '#2D3748' }}>{gym.owner}</Text>
                                    <Text style={{ fontSize: 12, color: '#718096' }}>{gym.email}</Text>
                                </View>
                                <Text style={[styles.tableCell, { flex: 1 }]}>{gym.tier}</Text>
                                <View style={[styles.tableCell, { flex: 1.5 }]}>
                                    <View style={styles.progressBar}>
                                        <View style={[styles.progressFill, { width: `${gym.progress}%` }]} />
                                    </View>
                                    <Text style={styles.progressText}>{gym.progress}%</Text>
                                </View>
                                <Text style={[styles.tableCell, { flex: 1, color: gym.billing === 'Completed' ? '#38A169' : '#D69E2E' }]}>{gym.billing}</Text>
                                <View style={[styles.tableCell, { flex: 1 }]}>
                                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(gym.status) + '20' }]}>
                                        <Text style={[styles.statusText, { color: getStatusColor(gym.status) }]}>{gym.status}</Text>
                                    </View>
                                </View>
                                <View style={[styles.tableCell, { flex: 1, flexDirection: 'row', gap: 8 }]}>
                                    <TouchableOpacity onPress={() => handleGymClick(gym)}>
                                        <Ionicons name="eye-outline" size={18} color="#3182CE" />
                                    </TouchableOpacity>
                                    <TouchableOpacity>
                                        <Ionicons name="checkmark-circle-outline" size={18} color="#38A169" />
                                    </TouchableOpacity>
                                    <TouchableOpacity>
                                        <Ionicons name="close-circle-outline" size={18} color="#E53E3E" />
                                    </TouchableOpacity>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                </ScrollView>

                {/* Details Side Panel */}
                <Modal visible={detailsPanelVisible} animationType="slide" transparent onRequestClose={() => setDetailsPanelVisible(false)}>
                    <View style={styles.panelOverlay}>
                        <TouchableOpacity style={styles.panelBackdrop} onPress={() => setDetailsPanelVisible(false)} />
                        <View style={styles.sidePanel}>
                            <View style={styles.panelHeader}>
                                <Text style={styles.panelTitle}>Gym Details</Text>
                                <TouchableOpacity onPress={() => setDetailsPanelVisible(false)}>
                                    <Ionicons name="close" size={28} color="#4A5568" />
                                </TouchableOpacity>
                            </View>
                            <ScrollView style={styles.panelContent}>
                                {selectedGym && (
                                    <>
                                        <View style={styles.panelSection}>
                                            <Text style={styles.panelSectionTitle}>Gym Identity</Text>
                                            <Text style={styles.gymLogo}>{selectedGym.logo}</Text>
                                            <Text style={styles.gymName}>{selectedGym.name}</Text>
                                            <Text style={styles.gymCode}>{selectedGym.code}</Text>
                                            <Text style={styles.panelLabel}>Owner</Text>
                                            <Text style={styles.panelValue}>{selectedGym.owner}</Text>
                                            <Text style={styles.panelLabel}>Email</Text>
                                            <Text style={styles.panelValue}>{selectedGym.email}</Text>
                                        </View>

                                        <View style={styles.panelSection}>
                                            <Text style={styles.panelSectionTitle}>Subscription Tier</Text>
                                            <View style={styles.tierSelector}>
                                                {['Free', 'Basic', 'Pro', 'Enterprise'].map(tier => (
                                                    <TouchableOpacity
                                                        key={tier}
                                                        style={[styles.tierOption, selectedGym.tier === tier && styles.tierOptionActive]}
                                                    >
                                                        <Text style={[styles.tierText, selectedGym.tier === tier && styles.tierTextActive]}>{tier}</Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </View>
                                        </View>

                                        <View style={styles.panelSection}>
                                            <Text style={styles.panelSectionTitle}>Onboarding Progress</Text>
                                            {onboardingSteps.map((step, i) => (
                                                <View key={i} style={styles.checklistItem}>
                                                    <Ionicons
                                                        name={step.completed ? 'checkmark-circle' : 'ellipse-outline'}
                                                        size={24}
                                                        color={step.completed ? '#38A169' : '#CBD5E0'}
                                                    />
                                                    <View style={styles.checklistContent}>
                                                        <Text style={[styles.checklistText, step.completed && styles.checklistTextCompleted]}>{step.name}</Text>
                                                        {step.date && <Text style={styles.checklistDate}>{step.date}</Text>}
                                                    </View>
                                                </View>
                                            ))}
                                        </View>

                                        <View style={styles.panelSection}>
                                            <Text style={styles.panelSectionTitle}>Billing Status</Text>
                                            <View style={styles.billingCard}>
                                                <View style={styles.billingRow}>
                                                    <Text style={styles.billingLabel}>Payment Gateway</Text>
                                                    <Text style={[styles.billingValue, { color: selectedGym.billing === 'Completed' ? '#38A169' : '#E53E3E' }]}>
                                                        {selectedGym.billing === 'Completed' ? 'Connected' : 'Not Connected'}
                                                    </Text>
                                                </View>
                                                <View style={styles.billingRow}>
                                                    <Text style={styles.billingLabel}>Last Sync</Text>
                                                    <Text style={styles.billingValue}>2024-01-15 10:30 AM</Text>
                                                </View>
                                            </View>
                                            <TouchableOpacity style={styles.outlineButton}>
                                                <Text style={styles.outlineButtonText}>View Billing Details</Text>
                                            </TouchableOpacity>
                                        </View>

                                        <View style={styles.panelActions}>
                                            <TouchableOpacity style={styles.approveButton}>
                                                <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                                                <Text style={styles.approveButtonText}>Approve Gym</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity style={styles.activateButton}>
                                                <Ionicons name="flash" size={20} color="#FFF" />
                                                <Text style={styles.activateButtonText}>Activate Gym</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity style={styles.rejectButton}>
                                                <Ionicons name="close-circle" size={20} color="#E53E3E" />
                                                <Text style={styles.rejectButtonText}>Reject Gym</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </>
                                )}
                            </ScrollView>
                        </View>
                    </View>
                </Modal>

                {/* Add Gym Modal */}
                <Modal visible={addGymModalVisible} animationType="slide" onRequestClose={() => setAddGymModalVisible(false)}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Add Gym Manually</Text>
                            <TouchableOpacity onPress={() => setAddGymModalVisible(false)}>
                                <Ionicons name="close" size={28} color="#4A5568" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.modalContent}>
                            <Text style={styles.label}>Gym Name</Text>
                            <TextInput style={styles.input} value={newGym.name} onChangeText={t => setNewGym({ ...newGym, name: t })} />
                            <Text style={styles.label}>Gym Code (auto-generated if empty)</Text>
                            <TextInput style={styles.input} value={newGym.code} onChangeText={t => setNewGym({ ...newGym, code: t })} placeholder="Leave empty to auto-generate" />
                            <Text style={styles.label}>Owner Name</Text>
                            <TextInput style={styles.input} value={newGym.ownerName} onChangeText={t => setNewGym({ ...newGym, ownerName: t })} />
                            <Text style={styles.label}>Owner Email</Text>
                            <TextInput style={styles.input} value={newGym.ownerEmail} onChangeText={t => setNewGym({ ...newGym, ownerEmail: t })} />
                            <Text style={styles.label}>Owner Phone</Text>
                            <TextInput style={styles.input} value={newGym.ownerPhone} onChangeText={t => setNewGym({ ...newGym, ownerPhone: t })} />
                            <Text style={styles.label}>Default Subscription Tier</Text>
                            <View style={styles.tierSelector}>
                                {['Free', 'Basic', 'Pro', 'Enterprise'].map(tier => (
                                    <TouchableOpacity
                                        key={tier}
                                        style={[styles.tierOption, newGym.tier === tier && styles.tierOptionActive]}
                                        onPress={() => setNewGym({ ...newGym, tier })}
                                    >
                                        <Text style={[styles.tierText, newGym.tier === tier && styles.tierTextActive]}>{tier}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                            <View style={styles.modalActions}>
                                <TouchableOpacity style={styles.cancelButton} onPress={() => setAddGymModalVisible(false)}>
                                    <Text style={styles.cancelButtonText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.saveButton} onPress={handleAddGym}>
                                    <Text style={styles.saveButtonText}>Create Gym</Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
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
    iconButton: { padding: 10, borderRadius: 8, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0' },
    outlineButton: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, gap: 8, backgroundColor: '#FFF' },
    outlineButtonText: { color: '#4A5568', fontWeight: '600', fontSize: 15 },

    kpiGrid: { flexDirection: 'row', gap: 16, marginBottom: 24 },
    kpiCard: { flex: 1, backgroundColor: '#FFF', padding: 20, borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2, alignItems: 'center' },
    kpiValue: { fontSize: 28, fontWeight: 'bold', color: '#2D3748', marginTop: 8, marginBottom: 4 },
    kpiLabel: { fontSize: 13, color: '#718096', textAlign: 'center' },
    kpiChange: { fontSize: 12, fontWeight: '600', marginTop: 4 },

    alertsCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 20, marginBottom: 24, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
    cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#2D3748', marginBottom: 16 },
    alertRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F7FAFC' },
    alertText: { flex: 1, fontSize: 14, color: '#2D3748' },
    alertButton: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6, backgroundColor: '#F7FAFC' },
    alertButtonText: { fontSize: 13, fontWeight: '600', color: '#4A5568' },

    filtersRow: { marginBottom: 24, gap: 16 },
    searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: '#E2E8F0' },
    searchInput: { flex: 1, padding: 10, fontSize: 15 },
    filterGroup: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
    filterChip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0' },
    filterChipActive: { backgroundColor: '#3182CE', borderColor: '#3182CE' },
    filterChipText: { fontSize: 13, color: '#4A5568' },
    filterChipTextActive: { color: '#FFF', fontWeight: '600' },

    tableCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 24, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2, marginBottom: 24 },
    tableActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    tableTitle: { fontSize: 20, fontWeight: 'bold', color: '#2D3748' },
    primaryButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#3182CE', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, gap: 8 },
    primaryButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
    tableHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingBottom: 12, marginBottom: 12 },
    tableHeaderCell: { fontSize: 13, fontWeight: '600', color: '#4A5568', textTransform: 'uppercase' },
    tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F7FAFC' },
    tableCell: { fontSize: 14, color: '#2D3748' },
    progressBar: { height: 8, backgroundColor: '#F7FAFC', borderRadius: 4, overflow: 'hidden', marginBottom: 4 },
    progressFill: { height: '100%', backgroundColor: '#3182CE', borderRadius: 4 },
    progressText: { fontSize: 12, color: '#718096' },
    statusBadge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12, alignSelf: 'flex-start' },
    statusText: { fontSize: 12, fontWeight: '600' },

    panelOverlay: { flex: 1, flexDirection: 'row', justifyContent: 'flex-end' },
    panelBackdrop: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)' },
    sidePanel: { width: 450, backgroundColor: '#FFF', shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 8, elevation: 5 },
    panelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
    panelTitle: { fontSize: 24, fontWeight: 'bold', color: '#1A202C' },
    panelContent: { flex: 1, padding: 24 },
    panelSection: { marginBottom: 32 },
    panelSectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#2D3748', marginBottom: 16 },
    gymLogo: { fontSize: 48, textAlign: 'center', marginBottom: 8 },
    gymName: { fontSize: 20, fontWeight: 'bold', color: '#2D3748', textAlign: 'center', marginBottom: 4 },
    gymCode: { fontSize: 14, color: '#718096', textAlign: 'center', marginBottom: 16 },
    panelLabel: { fontSize: 13, fontWeight: '600', color: '#718096', marginTop: 12, marginBottom: 4 },
    panelValue: { fontSize: 16, color: '#2D3748' },
    tierSelector: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
    tierOption: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFF' },
    tierOptionActive: { backgroundColor: '#EBF8FF', borderColor: '#3182CE' },
    tierText: { fontSize: 14, color: '#4A5568' },
    tierTextActive: { color: '#3182CE', fontWeight: '600' },
    checklistItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 16 },
    checklistContent: { flex: 1 },
    checklistText: { fontSize: 15, color: '#2D3748' },
    checklistTextCompleted: { color: '#718096', textDecorationLine: 'line-through' },
    checklistDate: { fontSize: 12, color: '#718096', marginTop: 2 },
    billingCard: { backgroundColor: '#F7FAFC', borderRadius: 8, padding: 16, marginBottom: 12 },
    billingRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    billingLabel: { fontSize: 14, color: '#718096' },
    billingValue: { fontSize: 14, fontWeight: '600', color: '#2D3748' },
    panelActions: { gap: 12, marginTop: 24 },
    approveButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#38A169', paddingVertical: 12, borderRadius: 8, gap: 8 },
    approveButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
    activateButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#3182CE', paddingVertical: 12, borderRadius: 8, gap: 8 },
    activateButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
    rejectButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E53E3E', paddingVertical: 12, borderRadius: 8, gap: 8 },
    rejectButtonText: { color: '#E53E3E', fontWeight: '600', fontSize: 15 },

    modalContainer: { flex: 1, backgroundColor: '#FFF' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
    modalTitle: { fontSize: 24, fontWeight: 'bold', color: '#1A202C' },
    modalContent: { flex: 1, padding: 24 },
    label: { fontSize: 14, fontWeight: '600', color: '#4A5568', marginTop: 16, marginBottom: 8 },
    input: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, padding: 12, fontSize: 16, backgroundColor: '#FFF' },
    modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 32, marginBottom: 24 },
    cancelButton: { paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0' },
    cancelButtonText: { color: '#4A5568', fontWeight: '600' },
    saveButton: { backgroundColor: '#3182CE', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8 },
    saveButtonText: { color: '#FFF', fontWeight: 'bold' },
});

export default SuperAdminGymOnboardingManagerScreen;
