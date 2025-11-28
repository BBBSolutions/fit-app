import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Platform, useWindowDimensions, Switch, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';


const isWeb = Platform.OS === 'web';

const AdminSettingsScreen = ({ navigation }) => {
    const [activeSection, setActiveSection] = useState('General');

    // Mock Data & State
    const [general, setGeneral] = useState({ name: 'FitPlatform Gym', code: 'GYM001', email: 'admin@fitplatform.com', phone: '+1 555 0199', timezone: 'UTC-5', address: '123 Fitness Blvd', city: 'New York', state: 'NY', zip: '10001' });
    const [branding, setBranding] = useState({ primary: '#3182CE', secondary: '#2D3748' });
    const [roles, setRoles] = useState({ defaultRole: 'Member', autoAssign: true });
    const [billing, setBilling] = useState({ currency: 'USD', autoCancel: false, emailReminders: true, tax: '8.875' });
    const [notifications, setNotifications] = useState({ emailSignup: true, emailPayment: true, pushInactive: false, systemAlerts: true });
    const [security, setSecurity] = useState({ twoFactor: false, allowNewDevices: true });

    const integrations = [
        { name: 'Stripe', icon: 'card', status: 'Connected', color: '#6772E5' },
        { name: 'Twilio', icon: 'chatbubbles', status: 'Not Connected', color: '#F22F46' },
        { name: 'Google Analytics', icon: 'analytics', status: 'Connected', color: '#E37400' },
        { name: 'Firebase', icon: 'logo-firebase', status: 'Connected', color: '#FFCA28' },
    ];

    const logs = [
        { time: '2023-11-27 10:30', action: 'User Login', user: 'admin@fit.com', ip: '192.168.1.1', status: 'Success' },
        { time: '2023-11-27 09:15', action: 'Update Plan', user: 'admin@fit.com', ip: '192.168.1.1', status: 'Success' },
        { time: '2023-11-26 18:45', action: 'Failed Payment', user: 'System', ip: '-', status: 'Error' },
    ];

    const renderSectionContent = () => {
        switch (activeSection) {
            case 'General':
                return (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>General Settings</Text>
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Gym Name</Text>
                            <TextInput style={styles.input} value={general.name} onChangeText={t => setGeneral({ ...general, name: t })} />
                        </View>
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Gym Code (Read-only)</Text>
                            <TextInput style={[styles.input, styles.readOnly]} value={general.code} editable={false} />
                        </View>
                        <View style={styles.row}>
                            <View style={[styles.formGroup, { flex: 1, marginRight: 16 }]}>
                                <Text style={styles.label}>Contact Email</Text>
                                <TextInput style={styles.input} value={general.email} onChangeText={t => setGeneral({ ...general, email: t })} />
                            </View>
                            <View style={[styles.formGroup, { flex: 1 }]}>
                                <Text style={styles.label}>Contact Phone</Text>
                                <TextInput style={styles.input} value={general.phone} onChangeText={t => setGeneral({ ...general, phone: t })} />
                            </View>
                        </View>
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Address</Text>
                            <TextInput style={styles.input} value={general.address} onChangeText={t => setGeneral({ ...general, address: t })} />
                        </View>
                        <View style={styles.row}>
                            <TextInput style={[styles.input, { flex: 2, marginRight: 16 }]} value={general.city} placeholder="City" />
                            <TextInput style={[styles.input, { flex: 1, marginRight: 16 }]} value={general.state} placeholder="State" />
                            <TextInput style={[styles.input, { flex: 1 }]} value={general.zip} placeholder="ZIP" />
                        </View>
                        <TouchableOpacity style={styles.saveButton}><Text style={styles.saveButtonText}>Save Changes</Text></TouchableOpacity>
                    </View>
                );
            case 'Branding':
                return (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Branding</Text>
                        <View style={styles.brandingPreview}>
                            <View style={styles.logoPlaceholder}><Text style={styles.logoText}>Logo</Text></View>
                            <TouchableOpacity style={styles.outlineButton}><Text style={styles.outlineButtonText}>Upload New Logo</Text></TouchableOpacity>
                        </View>
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Primary Color</Text>
                            <View style={styles.colorPicker}>
                                <View style={[styles.colorPreview, { backgroundColor: branding.primary }]} />
                                <TextInput style={styles.input} value={branding.primary} onChangeText={t => setBranding({ ...branding, primary: t })} />
                            </View>
                        </View>
                        <TouchableOpacity style={styles.saveButton}><Text style={styles.saveButtonText}>Save Branding</Text></TouchableOpacity>
                    </View>
                );
            case 'Users & Roles':
                return (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Users & Roles</Text>
                        <View style={styles.settingRow}>
                            <Text style={styles.settingLabel}>Default Role for New Users</Text>
                            <View style={styles.badge}><Text style={styles.badgeText}>Member</Text></View>
                        </View>
                        <View style={styles.settingRow}>
                            <Text style={styles.settingLabel}>Auto-assign Trainer to New Members</Text>
                            <Switch value={roles.autoAssign} onValueChange={v => setRoles({ ...roles, autoAssign: v })} />
                        </View>
                        <Text style={[styles.label, { marginTop: 24, marginBottom: 16 }]}>Role Permissions</Text>
                        <View style={styles.permissionTable}>
                            <View style={styles.permRow}>
                                <Text style={styles.permRole}>Trainer</Text>
                                <View style={styles.permToggle}><Text style={styles.permLabel}>Analytics</Text><Switch value={false} /></View>
                                <View style={styles.permToggle}><Text style={styles.permLabel}>Manage Users</Text><Switch value={false} /></View>
                                <View style={styles.permToggle}><Text style={styles.permLabel}>Create Plans</Text><Switch value={true} /></View>
                            </View>
                        </View>
                        <TouchableOpacity style={styles.saveButton}><Text style={styles.saveButtonText}>Save Permissions</Text></TouchableOpacity>
                    </View>
                );
            case 'Billing':
                return (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Billing Settings</Text>
                        <View style={styles.settingRow}>
                            <Text style={styles.settingLabel}>Current Gateway</Text>
                            <Text style={{ fontWeight: 'bold', color: '#6772E5' }}>Stripe (Connected)</Text>
                        </View>
                        <View style={styles.settingRow}>
                            <Text style={styles.settingLabel}>Auto-cancel overdue memberships</Text>
                            <Switch value={billing.autoCancel} onValueChange={v => setBilling({ ...billing, autoCancel: v })} />
                        </View>
                        <View style={styles.settingRow}>
                            <Text style={styles.settingLabel}>Email payment reminders</Text>
                            <Switch value={billing.emailReminders} onValueChange={v => setBilling({ ...billing, emailReminders: v })} />
                        </View>
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Default Currency</Text>
                            <TextInput style={styles.input} value={billing.currency} />
                        </View>
                        <TouchableOpacity style={styles.saveButton}><Text style={styles.saveButtonText}>Save Billing Settings</Text></TouchableOpacity>
                    </View>
                );
            case 'Integrations':
                return (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Integrations</Text>
                        <View style={styles.integrationsGrid}>
                            {integrations.map((int, i) => (
                                <View key={i} style={styles.integrationCard}>
                                    <Ionicons name={int.icon} size={32} color={int.color} style={{ marginBottom: 12 }} />
                                    <Text style={styles.intName}>{int.name}</Text>
                                    <Text style={[styles.intStatus, int.status === 'Connected' ? styles.textSuccess : styles.textMuted]}>{int.status}</Text>
                                    <TouchableOpacity style={[styles.smallButton, int.status === 'Connected' ? styles.btnOutline : styles.btnPrimary]}>
                                        <Text style={int.status === 'Connected' ? styles.btnOutlineText : styles.btnPrimaryText}>
                                            {int.status === 'Connected' ? 'Disconnect' : 'Connect'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                    </View>
                );
            case 'Notifications':
                return (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Notification Settings</Text>
                        <Text style={styles.subHeader}>Email Notifications</Text>
                        <View style={styles.settingRow}><Text style={styles.settingLabel}>New Sign-ups</Text><Switch value={notifications.emailSignup} /></View>
                        <View style={styles.settingRow}><Text style={styles.settingLabel}>Failed Payments</Text><Switch value={notifications.emailPayment} /></View>
                        <Text style={[styles.subHeader, { marginTop: 24 }]}>Push Notifications</Text>
                        <View style={styles.settingRow}><Text style={styles.settingLabel}>System Alerts</Text><Switch value={notifications.systemAlerts} /></View>
                        <TouchableOpacity style={styles.saveButton}><Text style={styles.saveButtonText}>Save Preferences</Text></TouchableOpacity>
                    </View>
                );
            case 'Security':
                return (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Security</Text>
                        <View style={styles.settingRow}>
                            <Text style={styles.settingLabel}>Two-Factor Authentication</Text>
                            <Switch value={security.twoFactor} onValueChange={v => setSecurity({ ...security, twoFactor: v })} />
                        </View>
                        <View style={styles.settingRow}>
                            <Text style={styles.settingLabel}>Allow Admin Login from New Devices</Text>
                            <Switch value={security.allowNewDevices} onValueChange={v => setSecurity({ ...security, allowNewDevices: v })} />
                        </View>
                        <Text style={[styles.subHeader, { marginTop: 24 }]}>Active Sessions</Text>
                        <View style={styles.sessionRow}>
                            <Ionicons name="desktop-outline" size={24} color="#4A5568" />
                            <View style={{ flex: 1, marginLeft: 12 }}>
                                <Text style={styles.sessionDevice}>Chrome on Windows</Text>
                                <Text style={styles.sessionMeta}>New York, USA • Active now</Text>
                            </View>
                            <TouchableOpacity><Text style={{ color: '#E53E3E', fontWeight: '600' }}>Revoke</Text></TouchableOpacity>
                        </View>
                        <TouchableOpacity style={[styles.saveButton, { backgroundColor: '#E53E3E', marginTop: 32 }]}><Text style={styles.saveButtonText}>Logout All Devices</Text></TouchableOpacity>
                    </View>
                );
            case 'System Logs':
                return (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>System Logs</Text>
                        <View style={styles.logTable}>
                            <View style={styles.logHeader}>
                                <Text style={[styles.logCell, { flex: 2 }]}>Timestamp</Text>
                                <Text style={[styles.logCell, { flex: 2 }]}>Action</Text>
                                <Text style={[styles.logCell, { flex: 2 }]}>User</Text>
                                <Text style={[styles.logCell, { flex: 1 }]}>Status</Text>
                            </View>
                            {logs.map((log, i) => (
                                <View key={i} style={styles.logRow}>
                                    <Text style={[styles.logCell, { flex: 2, color: '#718096' }]}>{log.time}</Text>
                                    <Text style={[styles.logCell, { flex: 2, fontWeight: '500' }]}>{log.action}</Text>
                                    <Text style={[styles.logCell, { flex: 2 }]}>{log.user}</Text>
                                    <Text style={[styles.logCell, { flex: 1, color: log.status === 'Success' ? '#38A169' : '#E53E3E' }]}>{log.status}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                );
            default:
                return null;
        }
    };

    const { width } = useWindowDimensions();
    const isMobile = width < 768 || !isWeb;

    return (
        <View style={styles.container}>
            {/* Main Sidebar (App Nav) - Desktop Only */}
            {!isMobile && (
                <View style={styles.mainSidebar}>
                    <View style={styles.sidebarHeader}>
                        <Ionicons name="fitness" size={32} color="#3182CE" />
                    </View>
                    <TouchableOpacity style={styles.mainSidebarItem} onPress={() => navigation.navigate('AdminDashboard')}>
                        <Ionicons name="grid-outline" size={24} color="#A0AEC0" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.mainSidebarItem} onPress={() => navigation.navigate('AdminContentManager')}>
                        <Ionicons name="document-text-outline" size={24} color="#A0AEC0" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.mainSidebarItem} onPress={() => navigation.navigate('AdminLeadManagement')}>
                        <Ionicons name="funnel-outline" size={24} color="#A0AEC0" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.mainSidebarItem} onPress={() => navigation.navigate('AdminUserOnboarding')}>
                        <Ionicons name="people-outline" size={24} color="#A0AEC0" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.mainSidebarItem} onPress={() => navigation.navigate('AdminBranding')}>
                        <Ionicons name="color-palette-outline" size={24} color="#A0AEC0" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.mainSidebarItem} onPress={() => navigation.navigate('AdminBilling')}>
                        <Ionicons name="card-outline" size={24} color="#A0AEC0" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.mainSidebarItem} onPress={() => navigation.navigate('AdminAnalytics')}>
                        <Ionicons name="bar-chart-outline" size={24} color="#A0AEC0" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.mainSidebarItemActive}>
                        <Ionicons name="settings" size={24} color="#3182CE" />
                    </TouchableOpacity>
                </View>
            )}

            <View style={{ flex: 1, flexDirection: isMobile ? 'column' : 'row' }}>
                {/* Settings Sidebar / Tabs */}
                <View style={[styles.settingsSidebar, isMobile && styles.settingsSidebarMobile]}>
                    <Text style={[styles.settingsTitle, isMobile && { display: 'none' }]}>Settings</Text>
                    <ScrollView
                        horizontal={isMobile}
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={isMobile ? styles.settingsTabsMobile : null}
                    >
                        {['General', 'Branding', 'Users & Roles', 'Billing', 'Integrations', 'Notifications', 'Security', 'System Logs'].map(section => (
                            <TouchableOpacity
                                key={section}
                                style={[
                                    styles.settingsItem,
                                    isMobile && styles.settingsItemMobile,
                                    activeSection === section && styles.settingsItemActive,
                                    isMobile && activeSection === section && styles.settingsItemActiveMobile
                                ]}
                                onPress={() => setActiveSection(section)}
                            >
                                <Text style={[
                                    styles.settingsItemText,
                                    activeSection === section && styles.settingsItemTextActive,
                                    isMobile && activeSection === section && { color: '#3182CE' }
                                ]}>{section}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Main Content */}
                <ScrollView style={styles.contentArea} contentContainerStyle={[styles.contentContainer, isMobile && styles.contentContainerMobile]}>
                    <View style={styles.header}>
                        {isMobile && (
                            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                                <Ionicons name="arrow-back" size={24} color="#2D3748" />
                            </TouchableOpacity>
                        )}
                        <View>
                            <Text style={styles.pageTitle}>{activeSection}</Text>
                            <Text style={styles.pageSubtitle}>Manage your gym account, preferences, and integrations.</Text>
                        </View>
                    </View>
                    {renderSectionContent()}
                </ScrollView>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, flexDirection: 'row', backgroundColor: '#F7FAFC' },

    // Main Sidebar (Icon only)
    mainSidebar: { width: 80, backgroundColor: '#FFF', borderRightWidth: 1, borderRightColor: '#E2E8F0', alignItems: 'center', paddingVertical: 24 },
    sidebarHeader: { marginBottom: 40 },
    mainSidebarItem: { padding: 12, marginBottom: 16, borderRadius: 12 },
    mainSidebarItemActive: { padding: 12, marginBottom: 16, borderRadius: 12, backgroundColor: '#EBF8FF' },

    // Settings Sidebar
    settingsSidebar: { width: 240, backgroundColor: '#F7FAFC', borderRightWidth: 1, borderRightColor: '#E2E8F0', paddingVertical: 32, paddingHorizontal: 16 },
    settingsSidebarMobile: { width: '100%', borderRightWidth: 0, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingVertical: 12, paddingHorizontal: 0 },
    settingsTitle: { fontSize: 24, fontWeight: 'bold', color: '#1A202C', marginBottom: 24, paddingHorizontal: 12 },

    settingsTabsMobile: { paddingHorizontal: 16, gap: 8 },
    settingsItem: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, marginBottom: 4 },
    settingsItemMobile: { marginBottom: 0, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: 'transparent' },
    settingsItemActive: { backgroundColor: '#E2E8F0' },
    settingsItemActiveMobile: { backgroundColor: '#EBF8FF', borderColor: '#3182CE' },

    settingsItemText: { fontSize: 15, color: '#4A5568', fontWeight: '500' },
    settingsItemTextActive: { color: '#1A202C', fontWeight: '600' },

    // Content
    contentArea: { flex: 1, backgroundColor: '#FFF' },
    contentContainer: { padding: 48, maxWidth: 1000 },
    contentContainerMobile: { padding: 20 },

    header: { marginBottom: 32, flexDirection: 'row', alignItems: 'flex-start', gap: 16 },
    backButton: { padding: 4, marginTop: 4 },
    pageTitle: { fontSize: 28, fontWeight: 'bold', color: '#1A202C', marginBottom: 8 },
    pageSubtitle: { fontSize: 16, color: '#718096' },

    card: { marginBottom: 32 },
    cardTitle: { fontSize: 20, fontWeight: 'bold', color: '#2D3748', marginBottom: 24, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },

    formGroup: { marginBottom: 20 },
    label: { fontSize: 14, fontWeight: '600', color: '#4A5568', marginBottom: 8 },
    input: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, padding: 12, fontSize: 16, color: '#2D3748' },
    readOnly: { backgroundColor: '#F7FAFC', color: '#718096' },
    row: { flexDirection: 'row', marginBottom: 20 },

    saveButton: { backgroundColor: '#3182CE', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8, alignSelf: 'flex-start', marginTop: 16 },
    saveButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },

    // Branding
    brandingPreview: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, gap: 24 },
    logoPlaceholder: { width: 80, height: 80, backgroundColor: '#EDF2F7', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
    logoText: { color: '#A0AEC0', fontWeight: 'bold' },
    outlineButton: { borderWidth: 1, borderColor: '#E2E8F0', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 6 },
    outlineButtonText: { color: '#4A5568', fontWeight: '600' },
    colorPicker: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    colorPreview: { width: 40, height: 40, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0' },

    // Settings Rows
    settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F7FAFC' },
    settingLabel: { fontSize: 16, color: '#2D3748' },
    badge: { backgroundColor: '#EBF8FF', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6 },
    badgeText: { color: '#3182CE', fontSize: 12, fontWeight: '600' },
    subHeader: { fontSize: 16, fontWeight: 'bold', color: '#2D3748', marginTop: 16, marginBottom: 8 },

    // Permissions
    permissionTable: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, padding: 16 },
    permRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    permRole: { fontSize: 16, fontWeight: 'bold', color: '#2D3748', width: 100 },
    permToggle: { alignItems: 'center', gap: 8 },
    permLabel: { fontSize: 12, color: '#718096' },

    // Integrations
    integrationsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 24 },
    integrationCard: { width: '45%', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 24, alignItems: 'center' },
    intName: { fontSize: 16, fontWeight: 'bold', color: '#2D3748', marginBottom: 4 },
    intStatus: { fontSize: 12, marginBottom: 16 },
    textSuccess: { color: '#38A169' },
    textMuted: { color: '#A0AEC0' },
    smallButton: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6 },
    btnOutline: { borderWidth: 1, borderColor: '#E2E8F0' },
    btnOutlineText: { color: '#E53E3E', fontSize: 12, fontWeight: '600' },
    btnPrimary: { backgroundColor: '#3182CE' },
    btnPrimaryText: { color: '#FFF', fontSize: 12, fontWeight: '600' },

    // Sessions
    sessionRow: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#F7FAFC', borderRadius: 8, marginTop: 12 },
    sessionDevice: { fontSize: 14, fontWeight: 'bold', color: '#2D3748' },
    sessionMeta: { fontSize: 12, color: '#718096' },

    // Logs
    logTable: { marginTop: 16 },
    logHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingBottom: 8, marginBottom: 8 },
    logRow: { flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F7FAFC' },
    logCell: { fontSize: 14, color: '#2D3748' },
});

export default AdminSettingsScreen;
