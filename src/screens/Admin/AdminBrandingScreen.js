import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Image, Platform, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

const AdminBrandingScreen = ({ navigation }) => {
    const [gymName, setGymName] = useState('FitLife Gym');
    const [primaryColor, setPrimaryColor] = useState('#3182CE');
    const [secondaryColor, setSecondaryColor] = useState('#2D3748');
    const [accentColor, setAccentColor] = useState('#38B2AC');
    const [logo, setLogo] = useState(null);
    const [loading, setLoading] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    const handleSave = () => {
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            setHasUnsavedChanges(false);
            alert('Branding settings saved!');
        }, 1500);
    };

    const handleColorChange = (setter, color) => {
        setter(color);
        setHasUnsavedChanges(true);
    };

    const handleNameChange = (text) => {
        setGymName(text);
        setHasUnsavedChanges(true);
    };

    return (
        <View style={styles.container}>
            {/* Sidebar (Simplified for this screen) */}
            {isWeb && width > 768 && (
                <View style={styles.sidebar}>
                    <View style={styles.sidebarHeader}>
                        <Ionicons name="fitness" size={32} color="#3182CE" />
                        <Text style={styles.sidebarTitle}>FitPlatform</Text>
                    </View>
                    <TouchableOpacity style={styles.sidebarItem} onPress={() => navigation.navigate('AdminDashboard')}>
                        <Ionicons name="grid-outline" size={20} color="#4A5568" />
                        <Text style={styles.sidebarItemText}>Dashboard</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.sidebarItem} onPress={() => navigation.navigate('AdminContentManager')}>
                        <Ionicons name="document-text-outline" size={20} color="#4A5568" />
                        <Text style={styles.sidebarItemText}>Content</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.sidebarItem} onPress={() => navigation.navigate('AdminLeadManagement')}>
                        <Ionicons name="funnel-outline" size={20} color="#4A5568" />
                        <Text style={styles.sidebarItemText}>Leads</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.sidebarItemActive}>
                        <Ionicons name="color-palette-outline" size={20} color="#3182CE" />
                        <Text style={styles.sidebarItemTextActive}>Branding</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.sidebarItem}
                        onPress={() => navigation.navigate('AdminUserOnboarding')}
                    >
                        <Ionicons name="people-outline" size={20} color="#4A5568" />
                        <Text style={styles.sidebarItemText}>Users</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.sidebarItem} onPress={() => navigation.navigate('AdminSettings')}>
                        <Ionicons name="settings-outline" size={20} color="#4A5568" />
                        <Text style={styles.sidebarItemText}>Settings</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.sidebarItem} onPress={() => navigation.navigate('AdminBilling')}>
                        <Ionicons name="card-outline" size={20} color="#4A5568" />
                        <Text style={styles.sidebarItemText}>Billing</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.sidebarItem} onPress={() => navigation.navigate('AdminAnalytics')}>
                        <Ionicons name="bar-chart-outline" size={20} color="#4A5568" />
                        <Text style={styles.sidebarItemText}>Analytics</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Main Content */}
            <ScrollView style={styles.mainContent} contentContainerStyle={styles.contentContainer}>
                <View style={styles.header}>
                    <View>
                        <Text style={styles.pageTitle}>Branding & White-Label Settings</Text>
                        <Text style={styles.pageSubtitle}>Customize your gym’s app appearance</Text>
                    </View>
                    <View style={styles.saveSection}>
                        {hasUnsavedChanges && <Text style={styles.unsavedText}>Unsaved changes</Text>}
                        <TouchableOpacity
                            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
                            onPress={handleSave}
                            disabled={loading}
                        >
                            <Text style={styles.saveButtonText}>{loading ? 'Saving...' : 'Save Branding'}</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.gridContainer}>
                    <View style={styles.leftColumn}>
                        {/* Gym Logo Upload */}
                        <View style={styles.card}>
                            <Text style={styles.cardTitle}>Gym Logo</Text>
                            <View style={styles.uploadArea}>
                                <View style={styles.logoPreviewCircle}>
                                    {logo ? (
                                        <Image source={{ uri: logo }} style={styles.logoImage} />
                                    ) : (
                                        <Ionicons name="image-outline" size={40} color="#CBD5E0" />
                                    )}
                                </View>
                                <View style={styles.uploadActions}>
                                    <TouchableOpacity style={styles.uploadButton}>
                                        <Text style={styles.uploadButtonText}>Upload Logo</Text>
                                    </TouchableOpacity>
                                    <Text style={styles.uploadHint}>Supported formats: PNG, JPG</Text>
                                </View>
                                {logo && (
                                    <TouchableOpacity onPress={() => setLogo(null)} style={styles.deleteButton}>
                                        <Ionicons name="trash-outline" size={20} color="#E53E3E" />
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>

                        {/* Color Scheme Selection */}
                        <View style={styles.card}>
                            <Text style={styles.cardTitle}>Color Scheme</Text>
                            <View style={styles.colorRow}>
                                <View style={styles.colorPickerContainer}>
                                    <Text style={styles.colorLabel}>Primary</Text>
                                    <View style={styles.colorInputWrapper}>
                                        <View style={[styles.colorPreview, { backgroundColor: primaryColor }]} />
                                        <TextInput
                                            style={styles.colorInput}
                                            value={primaryColor}
                                            onChangeText={(t) => handleColorChange(setPrimaryColor, t)}
                                        />
                                    </View>
                                </View>
                                <View style={styles.colorPickerContainer}>
                                    <Text style={styles.colorLabel}>Secondary</Text>
                                    <View style={styles.colorInputWrapper}>
                                        <View style={[styles.colorPreview, { backgroundColor: secondaryColor }]} />
                                        <TextInput
                                            style={styles.colorInput}
                                            value={secondaryColor}
                                            onChangeText={(t) => handleColorChange(setSecondaryColor, t)}
                                        />
                                    </View>
                                </View>
                                <View style={styles.colorPickerContainer}>
                                    <Text style={styles.colorLabel}>Accent</Text>
                                    <View style={styles.colorInputWrapper}>
                                        <View style={[styles.colorPreview, { backgroundColor: accentColor }]} />
                                        <TextInput
                                            style={styles.colorInput}
                                            value={accentColor}
                                            onChangeText={(t) => handleColorChange(setAccentColor, t)}
                                        />
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* App Display Name */}
                        <View style={styles.card}>
                            <Text style={styles.cardTitle}>App Display Name</Text>
                            <TextInput
                                style={styles.textInput}
                                value={gymName}
                                onChangeText={handleNameChange}
                                placeholder="Enter app name"
                            />
                            <Text style={styles.helperText}>This name appears under the app icon and in the header.</Text>
                        </View>
                    </View>

                    {/* Preview Section */}
                    <View style={styles.rightColumn}>
                        <View style={styles.previewCard}>
                            <Text style={styles.cardTitle}>Live Preview</Text>
                            <View style={styles.mockupContainer}>
                                <View style={styles.mockupPhone}>
                                    <View style={[styles.mockupHeader, { backgroundColor: primaryColor }]}>
                                        <Ionicons name="menu" size={20} color="#FFF" />
                                        <Text style={styles.mockupHeaderText}>{gymName}</Text>
                                        <Ionicons name="notifications" size={20} color="#FFF" />
                                    </View>
                                    <View style={styles.mockupBody}>
                                        <View style={[styles.mockupBanner, { backgroundColor: secondaryColor }]}>
                                            <Text style={{ color: '#FFF', fontSize: 12 }}>Welcome back!</Text>
                                        </View>
                                        <View style={styles.mockupContent}>
                                            <View style={[styles.mockupButton, { backgroundColor: accentColor }]}>
                                                <Text style={styles.mockupButtonText}>Start Workout</Text>
                                            </View>
                                            <View style={[styles.mockupCard, { borderLeftColor: primaryColor, borderLeftWidth: 4 }]}>
                                                <Text style={{ fontSize: 10, fontWeight: 'bold' }}>Today's Plan</Text>
                                            </View>
                                        </View>
                                    </View>
                                    <View style={styles.mockupFooter}>
                                        <Ionicons name="home" size={20} color={primaryColor} />
                                        <Ionicons name="barbell" size={20} color="#A0AEC0" />
                                        <Ionicons name="person" size={20} color="#A0AEC0" />
                                    </View>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: '#F7FAFC',
    },
    sidebar: {
        width: 250,
        backgroundColor: '#FFFFFF',
        borderRightWidth: 1,
        borderRightColor: '#E2E8F0',
        paddingVertical: 24,
        paddingHorizontal: 16,
    },
    sidebarHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 40,
        paddingHorizontal: 8,
    },
    sidebarTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2D3748',
        marginLeft: 10,
    },
    sidebarItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderRadius: 8,
        marginBottom: 4,
    },
    sidebarItemActive: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderRadius: 8,
        marginBottom: 4,
        backgroundColor: '#EBF8FF',
    },
    sidebarItemText: {
        fontSize: 16,
        color: '#4A5568',
        marginLeft: 12,
    },
    sidebarItemTextActive: {
        fontSize: 16,
        color: '#3182CE',
        marginLeft: 12,
        fontWeight: '600',
    },
    mainContent: {
        flex: 1,
    },
    contentContainer: {
        padding: 32,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 32,
    },
    pageTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1A202C',
        marginBottom: 8,
    },
    pageSubtitle: {
        fontSize: 16,
        color: '#718096',
    },
    saveSection: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    unsavedText: {
        color: '#D69E2E',
        marginRight: 16,
        fontWeight: '500',
    },
    saveButton: {
        backgroundColor: '#3182CE',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        shadowColor: '#3182CE',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    saveButtonDisabled: {
        backgroundColor: '#A0AEC0',
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 16,
    },
    gridContainer: {
        flexDirection: width > 1024 ? 'row' : 'column',
        gap: 24,
    },
    leftColumn: {
        flex: 2,
        gap: 24,
    },
    rightColumn: {
        flex: 1,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
        marginBottom: 24,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2D3748',
        marginBottom: 20,
    },
    uploadArea: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#E2E8F0',
        borderStyle: 'dashed',
        borderRadius: 12,
        padding: 24,
        backgroundColor: '#F7FAFC',
    },
    logoPreviewCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#EDF2F7',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 20,
        overflow: 'hidden',
    },
    logoImage: {
        width: '100%',
        height: '100%',
    },
    uploadActions: {
        flex: 1,
    },
    uploadButton: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#CBD5E0',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 6,
        alignSelf: 'flex-start',
        marginBottom: 8,
    },
    uploadButtonText: {
        color: '#4A5568',
        fontWeight: '600',
    },
    uploadHint: {
        fontSize: 12,
        color: '#A0AEC0',
    },
    deleteButton: {
        padding: 8,
    },
    colorRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 20,
    },
    colorPickerContainer: {
        flex: 1,
        minWidth: 120,
    },
    colorLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4A5568',
        marginBottom: 8,
    },
    colorInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 8,
        padding: 8,
    },
    colorPreview: {
        width: 24,
        height: 24,
        borderRadius: 4,
        marginRight: 8,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.1)',
    },
    colorInput: {
        flex: 1,
        fontSize: 14,
        color: '#2D3748',
    },
    textInput: {
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: '#2D3748',
        backgroundColor: '#F7FAFC',
    },
    helperText: {
        fontSize: 13,
        color: '#718096',
        marginTop: 8,
    },
    previewCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
        alignItems: 'center',
    },
    mockupContainer: {
        padding: 20,
        backgroundColor: '#EDF2F7',
        borderRadius: 20,
    },
    mockupPhone: {
        width: 200,
        height: 400,
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        borderWidth: 8,
        borderColor: '#1A202C',
        overflow: 'hidden',
    },
    mockupHeader: {
        height: 50,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
    },
    mockupHeaderText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 12,
    },
    mockupBody: {
        flex: 1,
        backgroundColor: '#F7FAFC',
    },
    mockupBanner: {
        height: 60,
        justifyContent: 'center',
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    mockupContent: {
        paddingHorizontal: 16,
    },
    mockupButton: {
        paddingVertical: 8,
        borderRadius: 6,
        alignItems: 'center',
        marginBottom: 12,
    },
    mockupButtonText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 10,
    },
    mockupCard: {
        backgroundColor: '#FFFFFF',
        padding: 12,
        borderRadius: 8,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    mockupFooter: {
        height: 50,
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
    },
});

export default AdminBrandingScreen;
