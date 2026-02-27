import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Modal, Switch, Platform, ActivityIndicator, Alert, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { adminApi } from '../../services/adminApi';
import AdminDrawer from '../../components/AdminDrawer';

const AdminBillingScreen = ({ navigation, route }) => {
    const { branchId, gymCode, branchName } = route.params || {}; // Get branchId from navigation params
    // State
    const [plans, setPlans] = useState([]);
    const [subscriptions, setSubscriptions] = useState([]);

    const [modalVisible, setModalVisible] = useState(false);
    const [currentPlan, setCurrentPlan] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState('All');

    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Sidebar State
    const [drawerVisible, setDrawerVisible] = useState(false);
    const { width } = useWindowDimensions();
    const isMobile = width < 768;

    useFocusEffect(
        React.useCallback(() => {
            if (branchId) {
                fetchData();
            }
        }, [branchId])
    );

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [plansData, billingData] = await Promise.all([
                adminApi.getPlans(branchId),
                adminApi.getBillingOverview(branchId)
            ]);
            // Map backend plan fields to frontend if necessary
            // Backend: is_active, features, interval
            // Frontend: active, benefits, cycle
            const formattedPlans = (plansData || []).map(p => ({
                ...p,
                active: p.is_active,
                benefits: p.features || [],
                cycle: p.interval,
                type: p.type || 'Membership'
            }));

            setPlans(formattedPlans);

            if (billingData) {
                setSubscriptions(billingData.subscriptions || []);
            }
        } catch (error) {
            console.error("Failed to fetch billing data:", error);
            // Alert.alert("Error", "Failed to load billing data");
        } finally {
            setIsLoading(false);
        }
    };

    // Stats
    const totalRevenue = subscriptions.reduce((sum, sub) => sum + (Number(sub.amount) || 0), 0);
    // Format roughly for display, e.g. 4.2L
    const monthlyRevenue = `₹ ${totalRevenue.toLocaleString()}`;

    const activeSubscribers = subscriptions.filter(s => s.status === 'Active').length;
    const failedPayments = subscriptions.filter(s => s.status === 'Past Due').length;
    const refundRequests = 0; // Not yet implemented in backend

    // Handlers
    const handleAddPlan = () => {
        setCurrentPlan({ name: '', price: '', cycle: 'Monthly', active: true, description: '', benefits: [], type: 'Membership' });
        setModalVisible(true);
    };

    const handleEditPlan = (plan) => {
        setCurrentPlan({ ...plan });
        setModalVisible(true);
    };

    const handleDeletePlan = (id) => {
        Alert.alert(
            "Delete Plan",
            "Are you sure you want to delete this plan?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            setIsLoading(true);
                            await adminApi.deletePlan(id, branchId);
                            setPlans(plans.filter(p => p.id !== id));
                        } catch (error) {
                            Alert.alert("Error", "Failed to delete plan");
                        } finally {
                            setIsLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const handleSavePlan = async () => {
        if (!currentPlan.name || !currentPlan.price) {
            Alert.alert("Error", "Name and Price required");
            return;
        }

        setIsSaving(true);
        try {
            // Map frontend back to backend
            // Remove frontend-only keys (active, benefits, cycle) to avoid schema errors
            const { active, benefits, cycle, ...rest } = currentPlan;

            const planPayload = {
                ...rest,
                is_active: active,
                features: benefits,
                interval: cycle,
                type: rest.type
            };

            if (currentPlan.id) {
                const updated = await adminApi.updatePlan(planPayload, branchId);
                // Map back to frontend
                const formatted = {
                    ...updated,
                    active: updated.is_active,
                    benefits: updated.features || [],
                    cycle: updated.interval,
                    type: updated.type
                };
                setPlans(plans.map(p => p.id === currentPlan.id ? formatted : p));
            } else {
                const created = await adminApi.createPlan(planPayload, branchId);
                const formatted = {
                    ...created,
                    active: created.is_active,
                    benefits: created.features || [],
                    cycle: created.interval,
                    type: created.type
                };
                setPlans([...plans, formatted]);
            }
            setModalVisible(false);
        } catch (error) {
            Alert.alert("Error", "Failed to save plan");
        } finally {
            setIsSaving(false);
        }
    };

    const togglePlanStatus = async (id) => {
        const plan = plans.find(p => p.id === id);
        if (!plan) return;

        // Optimistic update
        const updatedPlans = plans.map(p => p.id === id ? { ...p, active: !p.active } : p);
        setPlans(updatedPlans);

        try {
            await adminApi.updatePlan({
                id: plan.id,
                is_active: !plan.active
            }, branchId);
        } catch (error) {
            Alert.alert("Error", "Failed to update plan status");
            setPlans(plans); // Revert
        }
    };

    return (
        <View style={styles.container}>
            <AdminDrawer
                visible={drawerVisible}
                onClose={() => setDrawerVisible(false)}
                navigation={navigation}
                currentScreen="AdminBilling"
                extraParams={{ branchId, gymCode, branchName }}
            />

            {/* Sidebar - Desktop Only */}
            {!isMobile && (
                <View style={styles.sidebar}>
                    <View style={styles.sidebarHeader}>
                        <Ionicons name="fitness" size={32} color="#3182CE" />
                        <Text style={styles.sidebarTitle}>FitPlatform</Text>
                    </View>
                    <TouchableOpacity style={styles.sidebarItem} onPress={() => navigation.navigate('AdminDashboard', { branchId, gymCode, branchName })}>
                        <Ionicons name="grid-outline" size={20} color="#4A5568" />
                        <Text style={styles.sidebarItemText}>Dashboard</Text>
                    </TouchableOpacity>
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
                    <TouchableOpacity style={styles.sidebarItemActive}>
                        <Ionicons name="card-outline" size={20} color="#3182CE" />
                        <Text style={styles.sidebarItemTextActive}>Billing</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.sidebarItem} onPress={() => navigation.navigate('AdminSettings', { branchId, gymCode, branchName })}>
                        <Ionicons name="settings-outline" size={20} color="#4A5568" />
                        <Text style={styles.sidebarItemText}>Settings</Text>
                    </TouchableOpacity>
                </View>
            )}

            <View style={styles.mainContent}>
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            {isMobile && (
                                <TouchableOpacity
                                    onPress={() => setDrawerVisible(true)}
                                    style={styles.hamburgerButton}
                                >
                                    <Ionicons name="menu" size={28} color="#2D3748" />
                                </TouchableOpacity>
                            )}
                            <View>
                                <Text style={styles.pageTitle}>Billing & Subscription Management</Text>
                                <Text style={styles.pageSubtitle}>Configure membership plans, manage payments, and track billing activity.</Text>
                            </View>
                        </View>
                        <View style={{ flexDirection: 'row', gap: 12 }}>
                            <TouchableOpacity style={styles.outlineButton} onPress={fetchData}>
                                <Ionicons name="refresh" size={18} color="#4A5568" />
                                <Text style={styles.outlineButtonText}>Refresh</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.primaryButton} onPress={handleAddPlan}>
                                <Ionicons name="add" size={20} color="#FFF" />
                                <Text style={styles.primaryButtonText}>Create New Plan</Text>
                            </TouchableOpacity>
                        </View>
                    </View>


                    {/* Billing Reports */}
                    <View style={styles.statsGrid}>
                        <View style={styles.statCard}>
                            <Text style={styles.statLabel}>Monthly Revenue</Text>
                            <Text style={styles.statValue}>{monthlyRevenue}</Text>
                            <Text style={styles.statTrend}>+0% (vs last month)</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={styles.statLabel}>Active Subscribers</Text>
                            <Text style={styles.statValue}>{activeSubscribers}</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={styles.statLabel}>Failed Payments</Text>
                            <Text style={[styles.statValue, { color: '#E53E3E' }]}>{failedPayments}</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={styles.statLabel}>Refund Requests</Text>
                            <Text style={styles.statValue}>{refundRequests}</Text>
                        </View>
                    </View>

                    {/* Membership Plans */}
                    <Text style={styles.sectionTitle}>Membership Plans</Text>
                    {isLoading && plans.length === 0 ? (
                        <ActivityIndicator size="large" color="#553C9A" style={{ marginBottom: 30 }} />
                    ) : (
                        <View style={styles.plansGrid}>
                            {plans.length === 0 ? (
                                <View style={[styles.planCard, { flex: 1, alignItems: 'center', justifyContent: 'center' }]}>
                                    <Ionicons name="pricetag-outline" size={48} color="#CBD5E0" />
                                    <Text style={{ marginTop: 16, color: '#718096' }}>No plans created yet.</Text>
                                </View>
                            ) : plans.map(plan => (
                                <View key={plan.id} style={styles.planCard}>
                                    <View style={styles.planHeader}>
                                        <View>
                                            <Text style={styles.planName}>{plan.name}</Text>
                                            <Text style={[styles.planCycle, { fontSize: 12, marginTop: 2, color: '#553C9A' }]}>{plan.type}</Text>
                                        </View>
                                        <Switch
                                            value={plan.active}
                                            onValueChange={() => togglePlanStatus(plan.id)}
                                            trackColor={{ false: "#CBD5E0", true: "#B794F4" }}
                                            thumbColor={plan.active ? "#553C9A" : "#f4f3f4"}
                                        />
                                    </View>
                                    <Text style={styles.planPrice}>₹ {plan.price} <Text style={styles.planCycle}>/ {plan.cycle}</Text></Text>
                                    <Text style={styles.planDesc}>{plan.description}</Text>
                                    <View style={styles.planBenefits}>
                                        {(plan.benefits || []).map((b, i) => (
                                            <Text key={i} style={styles.benefitItem}>• {b}</Text>
                                        ))}
                                    </View>
                                    <View style={styles.planActions}>
                                        <TouchableOpacity style={styles.iconButton} onPress={() => handleEditPlan(plan)}>
                                            <Ionicons name="create-outline" size={20} color="#4A5568" />
                                        </TouchableOpacity>
                                        <TouchableOpacity style={styles.iconButton} onPress={() => handleDeletePlan(plan.id)}>
                                            <Ionicons name="trash-outline" size={20} color="#E53E3E" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Subscription Activity */}
                    <View style={styles.tableCard}>
                        <View style={styles.tableHeader}>
                            <Text style={styles.cardTitle}>Subscription Activity</Text>
                            <View style={styles.tableControls}>
                                <TextInput
                                    style={styles.searchInput}
                                    placeholder="Search members..."
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                />
                                <View style={styles.filterTabs}>
                                    {['All', 'Active', 'Past Due', 'Cancelled'].map(f => (
                                        <TouchableOpacity
                                            key={f}
                                            style={[styles.filterTab, filter === f && styles.filterTabActive]}
                                            onPress={() => setFilter(f)}
                                        >
                                            <Text style={[styles.filterTabText, filter === f && styles.filterTabTextActive]}>{f}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        </View>
                        <ScrollView horizontal={true} showsHorizontalScrollIndicator={true}>
                            <View style={styles.tableContainer}>
                                <View style={styles.tableRowHeader}>
                                    <Text style={[styles.tableCell, { flex: 2 }]}>Member Name</Text>
                                    <Text style={[styles.tableCell, { flex: 2 }]}>Plan</Text>
                                    <Text style={[styles.tableCell, { flex: 0.8 }]}>PT</Text>
                                    <Text style={[styles.tableCell, { flex: 1 }]}>Status</Text>
                                    <Text style={[styles.tableCell, { flex: 1.5 }]}>Next Billing</Text>
                                    <Text style={[styles.tableCell, { flex: 1 }]}>Amount</Text>
                                    <Text style={[styles.tableCell, { flex: 1.5 }]}>Payment Method</Text>
                                    <Text style={[styles.tableCell, { width: 80 }]}>Actions</Text>
                                </View>

                                {subscriptions.length === 0 ? (
                                    <View style={{ padding: 40, alignItems: 'center' }}>
                                        <Text style={{ color: '#A0AEC0' }}>No active subscriptions.</Text>
                                    </View>
                                ) : subscriptions.map(sub => (
                                    <View key={sub.id} style={styles.tableRow}>
                                        <Text style={[styles.tableCell, { flex: 2, fontWeight: '500' }]}>{sub.member}</Text>
                                        <Text style={[styles.tableCell, { flex: 2 }]}>{sub.plan}</Text>
                                        <Text style={[styles.tableCell, { flex: 0.8 }]}>{sub.pt || 'No'}</Text>
                                        <View style={[styles.tableCell, { flex: 1 }]}>
                                            <View style={[styles.statusBadge,
                                            sub.status === 'Active' ? styles.statusActive :
                                                sub.status === 'Past Due' ? styles.statusWarning : styles.statusInactive
                                            ]}>
                                                <Text style={[styles.statusText,
                                                sub.status === 'Active' ? styles.textActive :
                                                    sub.status === 'Past Due' ? styles.textWarning : styles.textInactive
                                                ]}>{sub.status}</Text>
                                            </View>
                                        </View>
                                        <Text style={[styles.tableCell, { flex: 1.5 }]}>{sub.nextBilling}</Text>
                                        <Text style={[styles.tableCell, { flex: 1 }]}>₹ {sub.amount}</Text>
                                        <Text style={[styles.tableCell, { flex: 1.5, fontSize: 12, color: '#718096' }]}>{sub.method}</Text>
                                        <View style={[styles.tableCell, { width: 80, flexDirection: 'row', gap: 8 }]}>
                                            <TouchableOpacity><Ionicons name="eye-outline" size={18} color="#4A5568" /></TouchableOpacity>
                                            <TouchableOpacity><Ionicons name="ban-outline" size={18} color="#E53E3E" /></TouchableOpacity>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        </ScrollView>
                    </View>


                </ScrollView>
            </View >

            {/* Plan Modal */}
            <Modal visible={modalVisible} transparent={true} animationType="fade" onRequestClose={() => setModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>{currentPlan?.id ? 'Edit Plan' : 'Create New Plan'}</Text>

                        <Text style={styles.label}>Plan Type</Text>
                        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
                            {['Membership', 'Personal Training'].map(t => (
                                <TouchableOpacity
                                    key={t}
                                    onPress={() => setCurrentPlan({ ...currentPlan, type: t })}
                                    style={{
                                        paddingVertical: 8,
                                        paddingHorizontal: 16,
                                        borderRadius: 20,
                                        backgroundColor: currentPlan?.type === t ? '#553C9A' : '#EDF2F7'
                                    }}
                                >
                                    <Text style={{
                                        color: currentPlan?.type === t ? '#FFF' : '#718096',
                                        fontWeight: '600',
                                        fontSize: 14
                                    }}>{t}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={styles.label}>Plan Name</Text>
                        <TextInput style={styles.input} value={currentPlan?.name} onChangeText={t => setCurrentPlan({ ...currentPlan, name: t })} />

                        <View style={styles.row}>
                            <View style={{ flex: 1, marginRight: 10 }}>
                                <Text style={styles.label}>Price (₹)</Text>
                                <TextInput style={styles.input} value={currentPlan?.price ? String(currentPlan.price) : ''} onChangeText={t => setCurrentPlan({ ...currentPlan, price: t })} keyboardType="numeric" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.label}>Billing Cycle</Text>
                                <View style={styles.cycleSelector}>
                                    {['Monthly', 'Quarterly', 'Half Yearly', 'Yearly'].map(c => (
                                        <TouchableOpacity key={c} onPress={() => setCurrentPlan({ ...currentPlan, cycle: c })} style={[styles.cycleOption, currentPlan?.cycle === c && styles.cycleOptionActive]}>
                                            <Text style={[styles.cycleText, currentPlan?.cycle === c && styles.cycleTextActive]}>{c}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        </View>

                        <Text style={styles.label}>Description</Text>
                        <TextInput style={[styles.input, { height: 60 }]} multiline value={currentPlan?.description} onChangeText={t => setCurrentPlan({ ...currentPlan, description: t })} />

                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.saveButton} onPress={handleSavePlan}>
                                {isSaving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveButtonText}>Save Plan</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
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
    hamburgerButton: { padding: 8, marginRight: 8 },

    mainContent: { flex: 1 },
    scrollContent: { padding: 32, paddingBottom: 100 },
    stickyBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', position: 'sticky', top: 0, zIndex: 10 },
    syncText: { fontSize: 12, color: '#718096' },
    stickyActions: { flexDirection: 'row', gap: 12 },

    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 },
    pageTitle: { fontSize: 28, fontWeight: 'bold', color: '#1A202C', marginBottom: 8 },
    pageSubtitle: { fontSize: 16, color: '#718096' },

    primaryButton: { backgroundColor: '#553C9A', flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
    primaryButtonText: { color: '#FFF', fontWeight: 'bold', marginLeft: 8 },
    primaryButtonSmall: { backgroundColor: '#553C9A', flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 6 },
    primaryButtonTextSmall: { color: '#FFF', fontWeight: '600', fontSize: 12, marginLeft: 6 },
    outlineButton: { borderWidth: 1, borderColor: '#CBD5E0', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 6, alignSelf: 'flex-start' },
    outlineButtonText: { color: '#4A5568', fontWeight: '600' },
    outlineButtonSmall: { borderWidth: 1, borderColor: '#CBD5E0', flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 6 },
    outlineButtonTextSmall: { color: '#4A5568', fontWeight: '600', fontSize: 12, marginLeft: 6 },

    card: { backgroundColor: '#FFF', borderRadius: 12, padding: 24, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2, marginBottom: 24 },
    cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#2D3748' },
    cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },

    gatewayContent: { gap: 16 },
    gatewayIcons: { flexDirection: 'row', gap: 12 },
    gatewayDesc: { color: '#4A5568', fontSize: 14 },

    statsGrid: { flexDirection: 'row', gap: 24, marginBottom: 32 },
    statCard: { flex: 1, backgroundColor: '#FFF', padding: 20, borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
    statLabel: { fontSize: 14, color: '#718096', marginBottom: 8 },
    statValue: { fontSize: 24, fontWeight: 'bold', color: '#2D3748' },
    statTrend: { fontSize: 12, color: '#38A169', marginTop: 4 },

    sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#2D3748', marginBottom: 16 },
    plansGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 24, marginBottom: 32 },
    planCard: { flex: 1, minWidth: 250, backgroundColor: '#FFF', padding: 24, borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
    planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    planName: { fontSize: 16, fontWeight: 'bold', color: '#2D3748' },
    planPrice: { fontSize: 24, fontWeight: 'bold', color: '#2D3748', marginBottom: 8 },
    planCycle: { fontSize: 14, color: '#718096', fontWeight: 'normal' },
    planDesc: { fontSize: 14, color: '#718096', marginBottom: 16, height: 40 },
    planBenefits: { marginBottom: 20 },
    benefitItem: { fontSize: 13, color: '#4A5568', marginBottom: 4 },
    planActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
    iconButton: { padding: 4 },

    tableCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 24, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2, marginBottom: 24 },
    tableHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    tableControls: { flexDirection: 'row', gap: 16 },
    searchInput: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, padding: 8, width: 200, fontSize: 14 },
    filterTabs: { flexDirection: 'row', backgroundColor: '#F7FAFC', borderRadius: 8, padding: 2 },
    filterTab: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6 },
    filterTabActive: { backgroundColor: '#FFF', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2 },
    filterTabText: { fontSize: 13, color: '#718096' },
    filterTabTextActive: { color: '#2D3748', fontWeight: '600' },

    tableContainer: { minWidth: 800 },
    tableRowHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingBottom: 12, marginBottom: 12 },
    tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F7FAFC' },
    tableCell: { paddingHorizontal: 8, fontSize: 14, color: '#2D3748' },

    statusBadge: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 12, alignSelf: 'flex-start' },
    statusActive: { backgroundColor: '#F0FFF4' },
    statusInactive: { backgroundColor: '#EDF2F7' },
    statusWarning: { backgroundColor: '#FEFCBF' },
    textActive: { color: '#38A169', fontSize: 12, fontWeight: '600' },
    textInactive: { color: '#718096', fontSize: 12, fontWeight: '600' },
    textWarning: { color: '#D69E2E', fontSize: 12, fontWeight: '600' },
    statusTextSimple: { fontSize: 14, fontWeight: '500' },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { backgroundColor: '#FFF', borderRadius: 12, padding: 32, width: 500, maxWidth: '90%', shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 10, elevation: 5 },
    modalTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 24, color: '#2D3748' },
    label: { fontSize: 14, fontWeight: '600', color: '#4A5568', marginBottom: 8 },
    input: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 16 },
    row: { flexDirection: 'row', marginBottom: 16 },
    cycleSelector: { flexDirection: 'row', backgroundColor: '#EDF2F7', borderRadius: 8, padding: 4 },
    cycleOption: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6 },
    cycleOptionActive: { backgroundColor: '#FFF', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2 },
    cycleText: { fontSize: 14, color: '#718096', fontWeight: '600' },
    cycleTextActive: { color: '#553C9A' },
    modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 24 },
    cancelButton: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0' },
    cancelButtonText: { color: '#4A5568', fontWeight: '600' },
    saveButton: { backgroundColor: '#553C9A', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
    saveButtonText: { color: '#FFF', fontWeight: 'bold' },
});

export default AdminBillingScreen;
