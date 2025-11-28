import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Modal, Switch, Platform, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SuperAdminDrawer from '../../components/SuperAdminDrawer';

const isWeb = Platform.OS === 'web';

const SuperAdminSubscriptionTierManagerScreen = ({ navigation }) => {
    const [drawerVisible, setDrawerVisible] = useState(false);
    const { width } = useWindowDimensions();
    const isMobile = width < 768;

    const [editModalVisible, setEditModalVisible] = useState(false);
    const [selectedTier, setSelectedTier] = useState(null);

    const [newTier, setNewTier] = useState({
        name: '',
        description: '',
        priceMonthly: '',
        priceYearly: '',
        currency: 'USD',
        active: true,
        maxMembers: '',
        maxTrainers: '',
        maxWorkoutPlans: '',
        maxChatMessages: '',
        storageLimit: '',
        aiTokens: '',
        costPerAdditionalTokens: '',
        hardCapAI: false,
        aiWorkout: true,
        aiDiet: true,
        trainerInsights: false,
        automatedFollowups: false,
        customBranding: false,
        whiteLabel: false,
        freeTrialDays: '0',
    });

    const [tiers, setTiers] = useState([
        { id: '1', name: 'Free', priceMonthly: 0, priceYearly: 0, maxMembers: 50, maxTrainers: 2, aiTokens: 1000, active: true, gymsCount: 45 },
        { id: '2', name: 'Basic', priceMonthly: 99, priceYearly: 999, maxMembers: 200, maxTrainers: 10, aiTokens: 10000, active: true, gymsCount: 28 },
        { id: '3', name: 'Pro', priceMonthly: 299, priceYearly: 2999, maxMembers: 1000, maxTrainers: 50, aiTokens: 50000, active: true, gymsCount: 12 },
        { id: '4', name: 'Enterprise', priceMonthly: 999, priceYearly: 9999, maxMembers: -1, maxTrainers: -1, aiTokens: 200000, active: true, gymsCount: 3 },
    ]);

    const [auditLog] = useState([
        { id: '1', action: 'Created tier "Pro"', user: 'Admin', timestamp: '2024-01-15 10:30 AM' },
        { id: '2', action: 'Updated pricing for "Basic"', user: 'Admin', timestamp: '2024-01-14 03:20 PM' },
        { id: '3', action: 'Disabled tier "Starter"', user: 'Admin', timestamp: '2024-01-12 11:45 AM' },
    ]);

    const handleEditTier = (tier) => {
        setSelectedTier(tier);
        setEditModalVisible(true);
    };

    const handleSaveTier = () => {
        setEditModalVisible(false);
        setSelectedTier(null);
    };

    return (
        <View style={styles.outerContainer}>
            <SuperAdminDrawer
                visible={drawerVisible}
                onClose={() => setDrawerVisible(false)}
                navigation={navigation}
                currentScreen="SuperAdminSubscriptionTiers"
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
                    <TouchableOpacity style={styles.sidebarItemActive}>
                        <Ionicons name="pricetag-outline" size={20} color="#805AD5" />
                        <Text style={styles.sidebarItemTextActive}>Subscription Tiers</Text>
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
                                <Text style={styles.pageTitle}>Subscription Tier Manager</Text>
                                <Text style={styles.pageSubtitle}>Define pricing and feature limits for gyms on the platform.</Text>
                            </View>
                        </View>
                        <TouchableOpacity style={styles.primaryButton} onPress={() => setEditModalVisible(true)}>
                            <Ionicons name="add" size={20} color="#FFF" />
                            <Text style={styles.primaryButtonText}>New Tier</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Revenue Forecast */}
                    <View style={styles.revenueCard}>
                        <Text style={styles.cardTitle}>Revenue Forecast</Text>
                        <View style={styles.revenueGrid}>
                            <View style={styles.revenueItem}>
                                <Text style={styles.revenueLabel}>Monthly Recurring Revenue</Text>
                                <Text style={styles.revenueValue}>$42,580</Text>
                                <Text style={styles.revenueChange}>+8.5% vs last month</Text>
                            </View>
                            <View style={styles.revenueItem}>
                                <Text style={styles.revenueLabel}>Expected Upgrade Rate</Text>
                                <Text style={styles.revenueValue}>12.3%</Text>
                                <Text style={styles.revenueChange}>+2.1% vs last month</Text>
                            </View>
                            <View style={styles.revenueItem}>
                                <Text style={styles.revenueLabel}>ARPU</Text>
                                <Text style={styles.revenueValue}>$485</Text>
                                <Text style={styles.revenueChange}>+5.2% vs last month</Text>
                            </View>
                            <View style={styles.revenueItem}>
                                <Text style={styles.revenueLabel}>Tier Churn</Text>
                                <Text style={styles.revenueValue}>3.2%</Text>
                                <Text style={[styles.revenueChange, { color: '#38A169' }]}>-1.5% vs last month</Text>
                            </View>
                        </View>
                    </View>

                    {/* Tier Cards Grid */}
                    <Text style={styles.sectionTitle}>Subscription Tiers</Text>
                    <View style={styles.tierGrid}>
                        {tiers.map(tier => (
                            <View key={tier.id} style={styles.tierCard}>
                                <View style={styles.tierCardHeader}>
                                    <View>
                                        <Text style={styles.tierName}>{tier.name}</Text>
                                        <Text style={styles.tierGymsCount}>{tier.gymsCount} gyms</Text>
                                    </View>
                                    <Switch value={tier.active} />
                                </View>
                                <View style={styles.tierPricing}>
                                    <Text style={styles.tierPrice}>${tier.priceMonthly}</Text>
                                    <Text style={styles.tierPricePeriod}>/month</Text>
                                </View>
                                <Text style={styles.tierPriceYearly}>${tier.priceYearly}/year</Text>
                                <View style={styles.tierFeatures}>
                                    <View style={styles.tierFeature}>
                                        <Ionicons name="people" size={16} color="#718096" />
                                        <Text style={styles.tierFeatureText}>{tier.maxMembers === -1 ? 'Unlimited' : tier.maxMembers} Members</Text>
                                    </View>
                                    <View style={styles.tierFeature}>
                                        <Ionicons name="fitness" size={16} color="#718096" />
                                        <Text style={styles.tierFeatureText}>{tier.maxTrainers === -1 ? 'Unlimited' : tier.maxTrainers} Trainers</Text>
                                    </View>
                                    <View style={styles.tierFeature}>
                                        <Ionicons name="sparkles" size={16} color="#718096" />
                                        <Text style={styles.tierFeatureText}>{tier.aiTokens.toLocaleString()} AI Tokens</Text>
                                    </View>
                                </View>
                                <View style={styles.tierActions}>
                                    <TouchableOpacity style={styles.tierActionButton} onPress={() => handleEditTier(tier)}>
                                        <Ionicons name="create-outline" size={18} color="#3182CE" />
                                        <Text style={styles.tierActionText}>Edit</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.tierActionButton}>
                                        <Ionicons name="copy-outline" size={18} color="#805AD5" />
                                        <Text style={[styles.tierActionText, { color: '#805AD5' }]}>Duplicate</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}
                    </View>

                    {/* Tier Comparison Table */}
                    <Text style={styles.sectionTitle}>Tier Comparison</Text>
                    <View style={styles.comparisonCard}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <View style={styles.comparisonTable}>
                                <View style={styles.comparisonRow}>
                                    <Text style={[styles.comparisonCell, styles.comparisonHeaderCell]}>Feature</Text>
                                    {tiers.map(tier => (
                                        <Text key={tier.id} style={[styles.comparisonCell, styles.comparisonTierHeader]}>{tier.name}</Text>
                                    ))}
                                </View>
                                <View style={styles.comparisonRow}>
                                    <Text style={styles.comparisonCell}>Monthly Price</Text>
                                    {tiers.map(tier => (
                                        <Text key={tier.id} style={styles.comparisonCell}>${tier.priceMonthly}</Text>
                                    ))}
                                </View>
                                <View style={styles.comparisonRow}>
                                    <Text style={styles.comparisonCell}>Max Members</Text>
                                    {tiers.map(tier => (
                                        <Text key={tier.id} style={styles.comparisonCell}>{tier.maxMembers === -1 ? 'Unlimited' : tier.maxMembers}</Text>
                                    ))}
                                </View>
                                <View style={styles.comparisonRow}>
                                    <Text style={styles.comparisonCell}>Max Trainers</Text>
                                    {tiers.map(tier => (
                                        <Text key={tier.id} style={styles.comparisonCell}>{tier.maxTrainers === -1 ? 'Unlimited' : tier.maxTrainers}</Text>
                                    ))}
                                </View>
                                <View style={styles.comparisonRow}>
                                    <Text style={styles.comparisonCell}>AI Token Limit</Text>
                                    {tiers.map(tier => (
                                        <Text key={tier.id} style={styles.comparisonCell}>{tier.aiTokens.toLocaleString()}</Text>
                                    ))}
                                </View>
                                <View style={styles.comparisonRow}>
                                    <Text style={styles.comparisonCell}>White-label Branding</Text>
                                    {tiers.map(tier => (
                                        <Ionicons key={tier.id} name={tier.id === '3' || tier.id === '4' ? 'checkmark-circle' : 'close-circle'} size={20} color={tier.id === '3' || tier.id === '4' ? '#38A169' : '#E53E3E'} />
                                    ))}
                                </View>
                                <View style={styles.comparisonRow}>
                                    <Text style={styles.comparisonCell}>Priority Support</Text>
                                    {tiers.map(tier => (
                                        <Ionicons key={tier.id} name={tier.id === '4' ? 'checkmark-circle' : 'close-circle'} size={20} color={tier.id === '4' ? '#38A169' : '#E53E3E'} />
                                    ))}
                                </View>
                            </View>
                        </ScrollView>
                    </View>

                    {/* Automated Notifications */}
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Automated Notifications</Text>
                        <View style={styles.switchRow}>
                            <Text style={styles.switchLabel}>Email gyms when their tier is updated</Text>
                            <Switch value={true} />
                        </View>
                        <View style={styles.switchRow}>
                            <Text style={styles.switchLabel}>Auto notify on nearing usage limits</Text>
                            <Switch value={true} />
                        </View>
                        <View style={styles.switchRow}>
                            <Text style={styles.switchLabel}>Auto suggest upgrade when hitting caps</Text>
                            <Switch value={false} />
                        </View>
                    </View>

                    {/* Audit Log */}
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Change History</Text>
                        {auditLog.map(log => (
                            <View key={log.id} style={styles.auditRow}>
                                <View style={styles.auditIcon}>
                                    <Ionicons name="time-outline" size={18} color="#718096" />
                                </View>
                                <View style={styles.auditContent}>
                                    <Text style={styles.auditAction}>{log.action}</Text>
                                    <Text style={styles.auditMeta}>{log.user} • {log.timestamp}</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                </ScrollView>

                {/* Edit Tier Modal */}
                <Modal visible={editModalVisible} animationType="slide" onRequestClose={() => setEditModalVisible(false)}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{selectedTier ? 'Edit Tier' : 'Create New Tier'}</Text>
                            <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                                <Ionicons name="close" size={28} color="#4A5568" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.modalContent}>
                            <Text style={styles.sectionLabel}>Tier Details</Text>
                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Tier Name</Text>
                                <TextInput style={styles.input} placeholder="e.g., Pro" value={newTier.name} onChangeText={t => setNewTier({ ...newTier, name: t })} />
                            </View>
                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Description</Text>
                                <TextInput style={[styles.input, styles.textArea]} multiline numberOfLines={3} placeholder="Brief description..." value={newTier.description} onChangeText={t => setNewTier({ ...newTier, description: t })} />
                            </View>
                            <View style={styles.formRow}>
                                <View style={styles.formGroup}>
                                    <Text style={styles.label}>Price (Monthly)</Text>
                                    <TextInput style={styles.input} placeholder="99" keyboardType="numeric" value={newTier.priceMonthly} onChangeText={t => setNewTier({ ...newTier, priceMonthly: t })} />
                                </View>
                                <View style={styles.formGroup}>
                                    <Text style={styles.label}>Price (Yearly)</Text>
                                    <TextInput style={styles.input} placeholder="999" keyboardType="numeric" value={newTier.priceYearly} onChangeText={t => setNewTier({ ...newTier, priceYearly: t })} />
                                </View>
                            </View>
                            <View style={styles.switchRow}>
                                <Text style={styles.switchLabel}>Active</Text>
                                <Switch value={newTier.active} onValueChange={v => setNewTier({ ...newTier, active: v })} />
                            </View>

                            <Text style={styles.sectionLabel}>Feature Allowances</Text>
                            <View style={styles.formRow}>
                                <View style={styles.formGroup}>
                                    <Text style={styles.label}>Max Members</Text>
                                    <TextInput style={styles.input} placeholder="1000" keyboardType="numeric" value={newTier.maxMembers} onChangeText={t => setNewTier({ ...newTier, maxMembers: t })} />
                                </View>
                                <View style={styles.formGroup}>
                                    <Text style={styles.label}>Max Trainers</Text>
                                    <TextInput style={styles.input} placeholder="50" keyboardType="numeric" value={newTier.maxTrainers} onChangeText={t => setNewTier({ ...newTier, maxTrainers: t })} />
                                </View>
                            </View>

                            <Text style={styles.sectionLabel}>AI Usage Controls</Text>
                            <View style={styles.formRow}>
                                <View style={styles.formGroup}>
                                    <Text style={styles.label}>Included AI Token Credits</Text>
                                    <TextInput style={styles.input} placeholder="50000" keyboardType="numeric" value={newTier.aiTokens} onChangeText={t => setNewTier({ ...newTier, aiTokens: t })} />
                                </View>
                                <View style={styles.formGroup}>
                                    <Text style={styles.label}>Cost per 1k Additional Tokens</Text>
                                    <TextInput style={styles.input} placeholder="0.50" keyboardType="numeric" value={newTier.costPerAdditionalTokens} onChangeText={t => setNewTier({ ...newTier, costPerAdditionalTokens: t })} />
                                </View>
                            </View>

                            <View style={styles.modalActions}>
                                <TouchableOpacity style={styles.cancelButton} onPress={() => setEditModalVisible(false)}>
                                    <Text style={styles.cancelButtonText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.previewButton}>
                                    <Text style={styles.previewButtonText}>Preview Tier</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.saveButton} onPress={handleSaveTier}>
                                    <Text style={styles.saveButtonText}>Save & Publish</Text>
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
    primaryButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#3182CE', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8, gap: 8 },
    primaryButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },

    revenueCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 24, marginBottom: 24, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
    cardTitle: { fontSize: 20, fontWeight: 'bold', color: '#2D3748', marginBottom: 20 },
    revenueGrid: { flexDirection: 'row', gap: 20 },
    revenueItem: { flex: 1 },
    revenueLabel: { fontSize: 13, color: '#718096', marginBottom: 8 },
    revenueValue: { fontSize: 28, fontWeight: 'bold', color: '#2D3748', marginBottom: 4 },
    revenueChange: { fontSize: 13, color: '#3182CE', fontWeight: '600' },

    sectionTitle: { fontSize: 24, fontWeight: 'bold', color: '#1A202C', marginBottom: 16, marginTop: 8 },
    tierGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 32 },
    tierCard: { width: '23%', backgroundColor: '#FFF', borderRadius: 12, padding: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
    tierCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
    tierName: { fontSize: 20, fontWeight: 'bold', color: '#2D3748', marginBottom: 4 },
    tierGymsCount: { fontSize: 13, color: '#718096' },
    tierPricing: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 4 },
    tierPrice: { fontSize: 32, fontWeight: 'bold', color: '#2D3748' },
    tierPricePeriod: { fontSize: 14, color: '#718096', marginLeft: 4 },
    tierPriceYearly: { fontSize: 13, color: '#718096', marginBottom: 16 },
    tierFeatures: { gap: 8, marginBottom: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#E2E8F0' },
    tierFeature: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    tierFeatureText: { fontSize: 14, color: '#4A5568' },
    tierActions: { flexDirection: 'row', gap: 12, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#E2E8F0' },
    tierActionButton: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, justifyContent: 'center', paddingVertical: 8, borderRadius: 6, borderWidth: 1, borderColor: '#E2E8F0' },
    tierActionText: { fontSize: 14, fontWeight: '600', color: '#3182CE' },

    comparisonCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 24, marginBottom: 24, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
    comparisonTable: { gap: 0 },
    comparisonRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingVertical: 12, alignItems: 'center' },
    comparisonCell: { width: 150, fontSize: 14, color: '#2D3748', paddingHorizontal: 12 },
    comparisonHeaderCell: { fontWeight: 'bold', color: '#4A5568', fontSize: 13, textTransform: 'uppercase' },
    comparisonTierHeader: { fontWeight: 'bold', color: '#2D3748', fontSize: 16 },

    card: { backgroundColor: '#FFF', borderRadius: 12, padding: 24, marginBottom: 24, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
    switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F7FAFC' },
    switchLabel: { fontSize: 15, color: '#2D3748', flex: 1 },

    auditRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F7FAFC' },
    auditIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F7FAFC', justifyContent: 'center', alignItems: 'center' },
    auditContent: { flex: 1 },
    auditAction: { fontSize: 15, color: '#2D3748', marginBottom: 4 },
    auditMeta: { fontSize: 13, color: '#718096' },

    modalContainer: { flex: 1, backgroundColor: '#FFF' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
    modalTitle: { fontSize: 24, fontWeight: 'bold', color: '#1A202C' },
    modalContent: { flex: 1, padding: 24 },
    sectionLabel: { fontSize: 18, fontWeight: 'bold', color: '#2D3748', marginTop: 24, marginBottom: 16, paddingBottom: 8, borderBottomWidth: 2, borderBottomColor: '#3182CE' },
    formGroup: { marginBottom: 16 },
    formRow: { flexDirection: 'row', gap: 16, marginBottom: 16 },
    label: { fontSize: 14, fontWeight: '600', color: '#4A5568', marginBottom: 8 },
    input: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, padding: 12, fontSize: 15, backgroundColor: '#FFF' },
    textArea: { height: 80, textAlignVertical: 'top' },
    modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 32, marginBottom: 24 },
    cancelButton: { paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0' },
    cancelButtonText: { color: '#4A5568', fontWeight: '600', fontSize: 15 },
    previewButton: { paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8, borderWidth: 1, borderColor: '#805AD5', backgroundColor: '#FFF' },
    previewButtonText: { color: '#805AD5', fontWeight: '600', fontSize: 15 },
    saveButton: { backgroundColor: '#3182CE', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8 },
    saveButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
});

export default SuperAdminSubscriptionTierManagerScreen;
