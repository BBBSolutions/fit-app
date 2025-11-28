import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Switch, Platform, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SuperAdminDrawer from '../../components/SuperAdminDrawer';

const isWeb = Platform.OS === 'web';

const SuperAdminGlobalSettingsScreen = ({ navigation }) => {
    const [drawerVisible, setDrawerVisible] = useState(false);
    const { width } = useWindowDimensions();
    const isMobile = width < 768;

    const [systemConfig, setSystemConfig] = useState({
        platformName: 'FitPlatform',
        timezone: 'UTC-5',
        currency: 'USD',
        supportEmail: 'support@fitplatform.com',
        supportPhone: '+1 555-0199',
        apiBaseUrl: 'https://api.fitplatform.com',
    });

    const [branding, setBranding] = useState({
        primaryColor: '#3182CE',
        secondaryColor: '#2D3748',
        applyToNewGyms: true,
    });

    const [onboardingRules, setOnboardingRules] = useState({
        autoApprove: false,
        requirePayment: true,
        enableFreeTrial: true,
    });

    const [featureFlags, setFeatureFlags] = useState({
        aiWorkout: true,
        aiDiet: true,
        trainerInsights: true,
        analytics2: false,
        leadManager: true,
        chat: true,
        gamification: false,
    });

    const [storagePolicy, setStoragePolicy] = useState({
        provider: 'Firebase',
        bucketName: 'fitplatform-storage',
        maxUploadSize: '10MB',
        allowedTypes: 'JPG, PNG, PDF',
    });

    const [maintenance, setMaintenance] = useState({
        enabled: false,
        message: 'System is under maintenance. We will be back soon.',
    });

    const providers = [
        { name: 'SMTP', status: 'Connected', icon: 'mail', color: '#38A169' },
        { name: 'SendGrid', status: 'Connected', icon: 'send', color: '#3182CE' },
        { name: 'Twilio SMS', status: 'Not Connected', icon: 'chatbubbles', color: '#718096' },
        { name: 'WhatsApp API', status: 'Not Connected', icon: 'logo-whatsapp', color: '#718096' },
    ];

    return (
        <View style={styles.outerContainer}>
            <SuperAdminDrawer
                visible={drawerVisible}
                onClose={() => setDrawerVisible(false)}
                navigation={navigation}
                currentScreen="SuperAdminGlobalSettings"
            />

            {/* Sidebar - Desktop Only */}
            {!isMobile && (
                <View style={styles.sidebar}>
                    <View style={styles.sidebarHeader}>
                        <Ionicons name="shield-checkmark" size={32} color="#805AD5" />
                        <Text style={styles.sidebarTitle}>SuperAdmin</Text>
                    </View>
                    <TouchableOpacity style={styles.sidebarItemActive}>
                        <Ionicons name="settings-outline" size={20} color="#805AD5" />
                        <Text style={styles.sidebarItemTextActive}>Global Settings</Text>
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
                                <Text style={styles.pageTitle}>Global Platform Settings</Text>
                                <Text style={styles.pageSubtitle}>Configure platform-wide defaults and administrative controls.</Text>
                            </View>
                        </View>
                    </View>

                    {/* System Configuration */}
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Ionicons name="settings-outline" size={24} color="#3182CE" />
                            <Text style={styles.cardTitle}>System Configuration</Text>
                        </View>
                        <View style={styles.formRow}>
                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Platform Name</Text>
                                <TextInput
                                    style={styles.input}
                                    value={systemConfig.platformName}
                                    onChangeText={t => setSystemConfig({ ...systemConfig, platformName: t })}
                                />
                            </View>
                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Default Timezone</Text>
                                <TextInput
                                    style={styles.input}
                                    value={systemConfig.timezone}
                                    onChangeText={t => setSystemConfig({ ...systemConfig, timezone: t })}
                                />
                            </View>
                        </View>
                        <View style={styles.formRow}>
                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Default Currency</Text>
                                <TextInput
                                    style={styles.input}
                                    value={systemConfig.currency}
                                    onChangeText={t => setSystemConfig({ ...systemConfig, currency: t })}
                                />
                            </View>
                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Support Email</Text>
                                <TextInput
                                    style={styles.input}
                                    value={systemConfig.supportEmail}
                                    onChangeText={t => setSystemConfig({ ...systemConfig, supportEmail: t })}
                                />
                            </View>
                        </View>
                        <View style={styles.formRow}>
                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Support Phone</Text>
                                <TextInput
                                    style={styles.input}
                                    value={systemConfig.supportPhone}
                                    onChangeText={t => setSystemConfig({ ...systemConfig, supportPhone: t })}
                                />
                            </View>
                            <View style={styles.formGroup}>
                                <Text style={styles.label}>API Base URL (Read-only)</Text>
                                <TextInput
                                    style={[styles.input, styles.readOnly]}
                                    value={systemConfig.apiBaseUrl}
                                    editable={false}
                                />
                            </View>
                        </View>
                        <TouchableOpacity style={styles.primaryButton}>
                            <Text style={styles.primaryButtonText}>Save Settings</Text>
                        </TouchableOpacity>
                    </View>

                    {/* White-Label Defaults */}
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Ionicons name="color-palette-outline" size={24} color="#805AD5" />
                            <Text style={styles.cardTitle}>White-Label Defaults</Text>
                        </View>
                        <View style={styles.formRow}>
                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Default Primary Color</Text>
                                <View style={styles.colorPicker}>
                                    <View style={[styles.colorPreview, { backgroundColor: branding.primaryColor }]} />
                                    <TextInput
                                        style={styles.input}
                                        value={branding.primaryColor}
                                        onChangeText={t => setBranding({ ...branding, primaryColor: t })}
                                    />
                                </View>
                            </View>
                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Default Secondary Color</Text>
                                <View style={styles.colorPicker}>
                                    <View style={[styles.colorPreview, { backgroundColor: branding.secondaryColor }]} />
                                    <TextInput
                                        style={styles.input}
                                        value={branding.secondaryColor}
                                        onChangeText={t => setBranding({ ...branding, secondaryColor: t })}
                                    />
                                </View>
                            </View>
                        </View>
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Default Logo</Text>
                            <TouchableOpacity style={styles.uploadButton}>
                                <Ionicons name="cloud-upload-outline" size={20} color="#4A5568" />
                                <Text style={styles.uploadButtonText}>Upload Logo</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.switchRow}>
                            <Text style={styles.switchLabel}>Apply to All New Gyms</Text>
                            <Switch
                                value={branding.applyToNewGyms}
                                onValueChange={v => setBranding({ ...branding, applyToNewGyms: v })}
                            />
                        </View>
                        <TouchableOpacity style={styles.primaryButton}>
                            <Text style={styles.primaryButtonText}>Save Branding Defaults</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Gym Onboarding Rules */}
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Ionicons name="business-outline" size={24} color="#D69E2E" />
                            <Text style={styles.cardTitle}>Gym Onboarding Rules</Text>
                        </View>
                        <View style={styles.switchRow}>
                            <Text style={styles.switchLabel}>Auto-approve new gym registrations</Text>
                            <Switch
                                value={onboardingRules.autoApprove}
                                onValueChange={v => setOnboardingRules({ ...onboardingRules, autoApprove: v })}
                            />
                        </View>
                        <View style={styles.switchRow}>
                            <Text style={styles.switchLabel}>Require payment setup before activation</Text>
                            <Switch
                                value={onboardingRules.requirePayment}
                                onValueChange={v => setOnboardingRules({ ...onboardingRules, requirePayment: v })}
                            />
                        </View>
                        <View style={styles.switchRow}>
                            <Text style={styles.switchLabel}>Enable "Free Trial Gym Account"</Text>
                            <Switch
                                value={onboardingRules.enableFreeTrial}
                                onValueChange={v => setOnboardingRules({ ...onboardingRules, enableFreeTrial: v })}
                            />
                        </View>
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Gym Contract Template (PDF)</Text>
                            <TouchableOpacity style={styles.uploadButton}>
                                <Ionicons name="document-attach-outline" size={20} color="#4A5568" />
                                <Text style={styles.uploadButtonText}>Upload Contract Template</Text>
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity style={styles.primaryButton}>
                            <Text style={styles.primaryButtonText}>Save Onboarding Rules</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Feature Flags */}
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Ionicons name="toggle-outline" size={24} color="#38A169" />
                            <Text style={styles.cardTitle}>Feature Flags</Text>
                        </View>
                        <View style={styles.featureGrid}>
                            <View style={styles.featureItem}>
                                <View>
                                    <Text style={styles.featureName}>AI Workout Generator</Text>
                                    <Text style={styles.featureDescription}>Generate personalized workouts with AI</Text>
                                </View>
                                <Switch value={featureFlags.aiWorkout} onValueChange={v => setFeatureFlags({ ...featureFlags, aiWorkout: v })} />
                            </View>
                            <View style={styles.featureItem}>
                                <View>
                                    <Text style={styles.featureName}>AI Diet Assistant</Text>
                                    <Text style={styles.featureDescription}>AI-powered nutrition plans</Text>
                                </View>
                                <Switch value={featureFlags.aiDiet} onValueChange={v => setFeatureFlags({ ...featureFlags, aiDiet: v })} />
                            </View>
                            <View style={styles.featureItem}>
                                <View>
                                    <Text style={styles.featureName}>Trainer Insights</Text>
                                    <Text style={styles.featureDescription}>Advanced analytics for trainers</Text>
                                </View>
                                <Switch value={featureFlags.trainerInsights} onValueChange={v => setFeatureFlags({ ...featureFlags, trainerInsights: v })} />
                            </View>
                            <View style={styles.featureItem}>
                                <View>
                                    <Text style={styles.featureName}>Admin Analytics 2.0</Text>
                                    <Text style={styles.featureDescription}>Next-gen reporting dashboard</Text>
                                </View>
                                <Switch value={featureFlags.analytics2} onValueChange={v => setFeatureFlags({ ...featureFlags, analytics2: v })} />
                            </View>
                            <View style={styles.featureItem}>
                                <View>
                                    <Text style={styles.featureName}>Enhanced Lead Manager</Text>
                                    <Text style={styles.featureDescription}>CRM-style lead tracking</Text>
                                </View>
                                <Switch value={featureFlags.leadManager} onValueChange={v => setFeatureFlags({ ...featureFlags, leadManager: v })} />
                            </View>
                            <View style={styles.featureItem}>
                                <View>
                                    <Text style={styles.featureName}>Chat System</Text>
                                    <Text style={styles.featureDescription}>Real-time messaging</Text>
                                </View>
                                <Switch value={featureFlags.chat} onValueChange={v => setFeatureFlags({ ...featureFlags, chat: v })} />
                            </View>
                            <View style={styles.featureItem}>
                                <View>
                                    <Text style={styles.featureName}>Gamification</Text>
                                    <Text style={styles.featureDescription}>Points, badges, and leaderboards</Text>
                                </View>
                                <Switch value={featureFlags.gamification} onValueChange={v => setFeatureFlags({ ...featureFlags, gamification: v })} />
                            </View>
                        </View>
                        <TouchableOpacity style={styles.primaryButton}>
                            <Text style={styles.primaryButtonText}>Save Feature Flags</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Email / SMS Providers */}
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Ionicons name="mail-outline" size={24} color="#E53E3E" />
                            <Text style={styles.cardTitle}>Email / SMS Providers</Text>
                        </View>
                        <View style={styles.providersGrid}>
                            {providers.map((provider, i) => (
                                <View key={i} style={styles.providerCard}>
                                    <Ionicons name={provider.icon} size={32} color={provider.color} />
                                    <Text style={styles.providerName}>{provider.name}</Text>
                                    <Text style={[styles.providerStatus, { color: provider.color }]}>{provider.status}</Text>
                                    <TouchableOpacity style={styles.configureButton}>
                                        <Text style={styles.configureButtonText}>Configure</Text>
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* Storage & File Policy */}
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Ionicons name="cloud-outline" size={24} color="#3182CE" />
                            <Text style={styles.cardTitle}>Storage & File Policy</Text>
                        </View>
                        <View style={styles.formRow}>
                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Storage Provider</Text>
                                <TextInput style={styles.input} value={storagePolicy.provider} />
                            </View>
                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Bucket Name</Text>
                                <TextInput
                                    style={styles.input}
                                    value={storagePolicy.bucketName}
                                    onChangeText={t => setStoragePolicy({ ...storagePolicy, bucketName: t })}
                                />
                            </View>
                        </View>
                        <View style={styles.formRow}>
                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Max Upload Size</Text>
                                <TextInput
                                    style={styles.input}
                                    value={storagePolicy.maxUploadSize}
                                    onChangeText={t => setStoragePolicy({ ...storagePolicy, maxUploadSize: t })}
                                />
                            </View>
                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Allowed File Types</Text>
                                <TextInput
                                    style={styles.input}
                                    value={storagePolicy.allowedTypes}
                                    onChangeText={t => setStoragePolicy({ ...storagePolicy, allowedTypes: t })}
                                />
                            </View>
                        </View>
                        <TouchableOpacity style={styles.primaryButton}>
                            <Text style={styles.primaryButtonText}>Save Policy</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Maintenance Mode */}
                    <View style={[styles.card, styles.maintenanceCard]}>
                        <View style={styles.cardHeader}>
                            <Ionicons name="warning-outline" size={24} color="#E53E3E" />
                            <Text style={styles.cardTitle}>Maintenance Mode</Text>
                        </View>
                        <View style={styles.switchRow}>
                            <Text style={styles.switchLabel}>Enable Maintenance Mode</Text>
                            <Switch
                                value={maintenance.enabled}
                                onValueChange={v => setMaintenance({ ...maintenance, enabled: v })}
                            />
                        </View>
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Maintenance Message</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                multiline
                                numberOfLines={3}
                                value={maintenance.message}
                                onChangeText={t => setMaintenance({ ...maintenance, message: t })}
                            />
                        </View>
                        <TouchableOpacity style={[styles.primaryButton, styles.dangerButton]}>
                            <Text style={styles.primaryButtonText}>Apply Maintenance Mode</Text>
                        </TouchableOpacity>
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
    header: { marginBottom: 32 },
    pageTitle: { fontSize: 32, fontWeight: 'bold', color: '#1A202C', marginBottom: 8 },
    pageSubtitle: { fontSize: 16, color: '#718096' },

    card: { backgroundColor: '#FFF', borderRadius: 12, padding: 24, marginBottom: 24, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
    cardTitle: { fontSize: 20, fontWeight: 'bold', color: '#2D3748' },

    formRow: { flexDirection: 'row', gap: 16, marginBottom: 16 },
    formGroup: { flex: 1 },
    label: { fontSize: 14, fontWeight: '600', color: '#4A5568', marginBottom: 8 },
    input: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, padding: 12, fontSize: 15, backgroundColor: '#FFF' },
    readOnly: { backgroundColor: '#F7FAFC', color: '#718096' },
    textArea: { height: 80, textAlignVertical: 'top' },

    colorPicker: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    colorPreview: { width: 40, height: 40, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0' },

    uploadButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderStyle: 'dashed', borderColor: '#CBD5E0', borderRadius: 8, padding: 16, gap: 8 },
    uploadButtonText: { fontSize: 15, fontWeight: '600', color: '#4A5568' },

    switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F7FAFC' },
    switchLabel: { fontSize: 15, color: '#2D3748', flex: 1 },

    featureGrid: { gap: 16, marginBottom: 16 },
    featureItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F7FAFC' },
    featureName: { fontSize: 15, fontWeight: '600', color: '#2D3748', marginBottom: 4 },
    featureDescription: { fontSize: 13, color: '#718096' },

    providersGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
    providerCard: { width: '23%', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 20, alignItems: 'center', gap: 8 },
    providerName: { fontSize: 15, fontWeight: 'bold', color: '#2D3748' },
    providerStatus: { fontSize: 13, marginBottom: 8 },
    configureButton: { borderWidth: 1, borderColor: '#E2E8F0', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6 },
    configureButtonText: { fontSize: 13, fontWeight: '600', color: '#4A5568' },

    primaryButton: { backgroundColor: '#3182CE', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8, alignSelf: 'flex-start', marginTop: 8 },
    primaryButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },

    maintenanceCard: { borderLeftWidth: 4, borderLeftColor: '#E53E3E' },
    dangerButton: { backgroundColor: '#E53E3E' },
});

export default SuperAdminGlobalSettingsScreen;
