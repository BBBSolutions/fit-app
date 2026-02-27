import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';
import { supabase } from '../../config/supabaseAuth';

// UI Components
import ScreenWrapper from '../../components/ScreenWrapper';
import GradientCard from '../../components/GradientCard';
import StandardInput from '../../components/StandardInput';
import AnimatedButton from '../../components/AnimatedButton';
import { colors, spacing, typography, borderRadius } from '../../theme/theme';

const TrainerOnboardingSurveyScreen = ({ navigation }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        fullName: '',
        age: '',
        gender: '',
        phoneNumber: '',
        email: '',
        yearsOfExperience: '',
        primarySpecialization: '',
        secondarySkills: [],
        certificationType: '',
        certificationNotes: '',
        coachingMethod: '',
        clientType: '',
        maxClients: '',
        bio: '',
    });

    const [showDropdown, setShowDropdown] = useState({
        gender: false,
        yearsOfExperience: false,
        primarySpecialization: false,
        certificationType: false,
        coachingMethod: false,
        clientType: false,
    });

    useEffect(() => {
        loadExistingProfile();
    }, []);

    const loadExistingProfile = async () => {
        try {
            setLoading(true);
            setLoading(true);

            // Get current user from Supabase
            const { data: { user } } = await supabase.auth.getUser();
            const loginPhoneNumber = user?.phone || '';

            const profile = await api.getProfile();
            if (profile) {
                console.log("Loading existing profile for edit:", profile);
                setFormData(prev => ({
                    ...prev,
                    fullName: profile.fullName || profile.name || prev.fullName,
                    age: profile.age ? profile.age.toString() : prev.age,
                    gender: profile.gender || prev.gender,
                    // Use profile phone if exists, otherwise fallback to login phone
                    phoneNumber: profile.phone || profile.phoneNumber || loginPhoneNumber,
                    email: profile.email || prev.email,
                    yearsOfExperience: profile.yearsOfExperience || prev.yearsOfExperience,
                    primarySpecialization: profile.primarySpecialization || prev.primarySpecialization,
                    secondarySkills: profile.secondarySkills || prev.secondarySkills,
                    certificationType: profile.certificationType || prev.certificationType,
                    certificationNotes: profile.certificationNotes || prev.certificationNotes,
                    coachingMethod: profile.coachingMethod || prev.coachingMethod,
                    clientType: profile.clientType || prev.clientType,
                    maxClients: profile.maxClients ? profile.maxClients.toString() : prev.maxClients,
                    bio: profile.bio || prev.bio,
                }));
            } else if (loginPhoneNumber) {
                // No profile yet, but we have login phone
                setFormData(prev => ({ ...prev, phoneNumber: loginPhoneNumber }));
            }
        } catch (error) {
            console.error("Failed to load existing profile:", error);
        } finally {
            setLoading(false);
        }
    };

    // Dropdown options
    const genderOptions = ['Male', 'Female', 'Other'];
    const experienceOptions = ['0-1 years', '1-3 years', '3-5 years', '5+ years'];
    const specializationOptions = [
        'Weight Loss',
        'Strength Training',
        'Bodybuilding',
        'Functional Fitness',
        'Sports Conditioning',
        'General Personal Training',
    ];
    const secondarySkillsOptions = [
        'Nutrition Guidance',
        'Rehab Training',
        'Mobility/Stretching',
        'HIIT',
        'Yoga/Pilates',
        'Senior Fitness',
    ];
    const certificationOptions = ['ACE', 'NASM', 'CrossFit Level 1', 'ISSA', 'Other'];
    const coachingMethodOptions = ['In-person', 'Online', 'Hybrid'];
    const clientTypeOptions = ['Beginners', 'Intermediate', 'Athletes', 'Seniors', 'General Public'];

    const updateField = (field, value) => {
        setFormData({ ...formData, [field]: value });
    };

    const toggleDropdown = (field) => {
        // Close others when opening one
        const newState = { ...showDropdown };
        Object.keys(newState).forEach(k => {
            if (k !== field) newState[k] = false;
        });
        newState[field] = !showDropdown[field];
        setShowDropdown(newState);
    };

    const selectDropdownOption = (field, value) => {
        updateField(field, value);
        setShowDropdown({ ...showDropdown, [field]: false });
    };

    const toggleSecondarySkill = (skill) => {
        const currentSkills = formData.secondarySkills || [];
        if (currentSkills.includes(skill)) {
            updateField('secondarySkills', currentSkills.filter((s) => s !== skill));
        } else {
            updateField('secondarySkills', [...currentSkills, skill]);
        }
    };

    const handleSaveProfile = async () => {
        // Validation - only required fields (certifications are optional)
        if (!formData.fullName || !formData.email || !formData.primarySpecialization) {
            Alert.alert('Missing Information', 'Please fill in all required fields:\n• Full Name\n• Email Address\n• Primary Specialization');
            return;
        }

        setLoading(true);
        console.log('Saving profile:', formData);

        // Include role: 'trainer' to ensure they are marked correctly in DB
        const profileData = { ...formData, role: 'trainer' };

        try {
            const { api } = require('../../services/api');
            await api.updateProfile(profileData);
            console.log('Profile saved successfully');

            // Navigate directly for web compatibility
            navigation.replace('TrainerMainApp');
        } catch (error) {
            console.error('Failed to save trainer profile:', error);
            Alert.alert('Error', 'Failed to save profile. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const Dropdown = ({ field, placeholder, options }) => (
        <View style={styles.dropdownContainer}>
            <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => toggleDropdown(field)}
            >
                <Text style={[styles.dropdownButtonText, !formData[field] && styles.placeholderText]}>
                    {formData[field] || placeholder}
                </Text>
                <Ionicons name={showDropdown[field] ? "chevron-up" : "chevron-down"} size={20} color={colors.text.secondary} />
            </TouchableOpacity>

            {showDropdown[field] && (
                <View style={styles.dropdownList}>
                    {options.map((option) => (
                        <TouchableOpacity
                            key={option}
                            style={styles.dropdownItem}
                            onPress={() => selectDropdownOption(field, option)}
                        >
                            <Text style={[
                                styles.dropdownItemText,
                                formData[field] === option && styles.dropdownItemTextSelected
                            ]}>
                                {option}
                            </Text>
                            {formData[field] === option && (
                                <Ionicons name="checkmark" size={16} color={colors.primary} />
                            )}
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </View>
    );

    return (
        <ScreenWrapper useGradient={true} style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
            >
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.contentContainer}
                    showsVerticalScrollIndicator={false}
                >
                    {/* 1. Header */}
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Trainer Onboarding</Text>
                        <Text style={styles.headerSubtitle}>Tell us about yourself to verify your profile</Text>
                    </View>

                    {/* 2. Basic Details */}
                    <GradientCard glassmorphic={true} style={styles.sectionCard}>
                        <View style={styles.cardHeader}>
                            <View style={[styles.iconContainer, { backgroundColor: '#EBF8FF' }]}>
                                <Ionicons name="person" size={20} color={colors.primary} />
                            </View>
                            <Text style={styles.cardTitle}>Basic Details</Text>
                        </View>

                        <StandardInput
                            label="Full Name *"
                            placeholder="e.g. John Smith"
                            value={formData.fullName}
                            onChangeText={(text) => updateField('fullName', text)}
                            leftIcon={<Ionicons name="person-outline" size={20} color={colors.text.tertiary} />}
                        />

                        <View style={styles.row}>
                            <View style={{ flex: 1, marginRight: spacing.sm }}>
                                <StandardInput
                                    label="Age"
                                    placeholder="e.g. 30"
                                    keyboardType="numeric"
                                    value={formData.age}
                                    onChangeText={(text) => updateField('age', text)}
                                />
                            </View>
                            <View style={{ flex: 1, marginLeft: spacing.sm }}>
                                <Text style={styles.label}>Gender</Text>
                                <Dropdown
                                    field="gender"
                                    placeholder="Select"
                                    options={genderOptions}
                                />
                            </View>
                        </View>

                        <StandardInput
                            label="Phone Number"
                            placeholder="e.g. +1 234 567 8900"
                            value={formData.phoneNumber}
                            keyboardType="phone-pad"
                            onChangeText={(text) => updateField('phoneNumber', text)}
                            leftIcon={<Ionicons name="call-outline" size={20} color={colors.text.tertiary} />}
                        />

                        <StandardInput
                            label="Email Address *"
                            placeholder="e.g. trainer@example.com"
                            value={formData.email}
                            keyboardType="email-address"
                            onChangeText={(text) => updateField('email', text)}
                            leftIcon={<Ionicons name="mail-outline" size={20} color={colors.text.tertiary} />}
                        />
                    </GradientCard>

                    {/* 3. Professional Information */}
                    <GradientCard glassmorphic={true} style={styles.sectionCard}>
                        <View style={styles.cardHeader}>
                            <View style={[styles.iconContainer, { backgroundColor: '#F0FFF4' }]}>
                                <Ionicons name="briefcase" size={20} color={colors.success} />
                            </View>
                            <Text style={styles.cardTitle}>Professional Information</Text>
                        </View>

                        <Text style={styles.label}>Years of Experience</Text>
                        <Dropdown
                            field="yearsOfExperience"
                            placeholder="Select experience"
                            options={experienceOptions}
                        />

                        <Text style={[styles.label, { marginTop: spacing.md }]}>Primary Specialization *</Text>
                        <Dropdown
                            field="primarySpecialization"
                            placeholder="Select specialization"
                            options={specializationOptions}
                        />

                        <Text style={[styles.label, { marginTop: spacing.md }]}>Secondary Skills (optional)</Text>
                        <View style={styles.multiSelectContainer}>
                            {secondarySkillsOptions.map((skill) => (
                                <TouchableOpacity
                                    key={skill}
                                    style={[
                                        styles.multiSelectChip,
                                        formData.secondarySkills?.includes(skill) && styles.multiSelectChipActive,
                                    ]}
                                    onPress={() => toggleSecondarySkill(skill)}
                                >
                                    <Text
                                        style={[
                                            styles.multiSelectChipText,
                                            formData.secondarySkills?.includes(skill) && styles.multiSelectChipTextActive,
                                        ]}
                                    >
                                        {skill}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </GradientCard>

                    {/* 4. Certifications */}
                    <GradientCard glassmorphic={true} style={styles.sectionCard}>
                        <View style={styles.cardHeader}>
                            <View style={[styles.iconContainer, { backgroundColor: '#FFF5F5' }]}>
                                <Ionicons name="ribbon" size={20} color={colors.error} />
                            </View>
                            <Text style={styles.cardTitle}>Certifications (Optional)</Text>
                        </View>

                        <Text style={styles.label}>Certification Type</Text>
                        <Dropdown
                            field="certificationType"
                            placeholder="Select certification"
                            options={certificationOptions}
                        />

                        {/* Upload placeholder */}
                        <TouchableOpacity style={styles.uploadBox}>
                            <Ionicons name="cloud-upload-outline" size={32} color={colors.text.tertiary} />
                            <Text style={styles.uploadText}>Tap to upload certificate</Text>
                        </TouchableOpacity>

                        <StandardInput
                            label="Additional Notes"
                            placeholder="e.g. Certificate ID, expiry date..."
                            value={formData.certificationNotes}
                            onChangeText={(text) => updateField('certificationNotes', text)}
                            multiline
                            numberOfLines={3}
                            style={{ minHeight: 80, textAlignVertical: 'top' }}
                        />
                    </GradientCard>

                    {/* 5. Coaching Preferences */}
                    <GradientCard glassmorphic={true} style={styles.sectionCard}>
                        <View style={styles.cardHeader}>
                            <View style={[styles.iconContainer, { backgroundColor: '#FAF5FF' }]}>
                                <Ionicons name="settings" size={20} color={colors.secondary} />
                            </View>
                            <Text style={styles.cardTitle}>Coaching Preferences</Text>
                        </View>

                        <Text style={styles.label}>Preferred Coaching Method</Text>
                        <Dropdown
                            field="coachingMethod"
                            placeholder="Select method"
                            options={coachingMethodOptions}
                        />

                        <Text style={[styles.label, { marginTop: spacing.md }]}>Target Client Type</Text>
                        <Dropdown
                            field="clientType"
                            placeholder="Select client type"
                            options={clientTypeOptions}
                        />

                        <StandardInput
                            label="Max Clients Capacity"
                            placeholder="e.g. 15"
                            value={formData.maxClients}
                            keyboardType="numeric"
                            onChangeText={(text) => updateField('maxClients', text)}
                            containerStyle={{ marginTop: spacing.md }}
                        />
                    </GradientCard>

                    {/* 6. Bio */}
                    <GradientCard glassmorphic={true} style={styles.sectionCard}>
                        <View style={styles.cardHeader}>
                            <View style={[styles.iconContainer, { backgroundColor: '#FFFFF0' }]}>
                                <Ionicons name="document-text" size={20} color={colors.warning} />
                            </View>
                            <Text style={styles.cardTitle}>Bio / Introduction</Text>
                        </View>

                        <StandardInput
                            placeholder="Write a short introduction for your clients..."
                            value={formData.bio}
                            onChangeText={(text) => updateField('bio', text)}
                            multiline
                            numberOfLines={6}
                            style={{ minHeight: 120, textAlignVertical: 'top' }}
                        />
                    </GradientCard>

                    <View style={styles.footerSpacer} />
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Sticky Save Button */}
            <View style={styles.footer}>
                <AnimatedButton
                    title="Save Profile"
                    onPress={handleSaveProfile}
                    loading={loading}
                    variant="primary"
                    gradient={true}
                />
            </View>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    contentContainer: {
        padding: spacing.lg,
        paddingBottom: 100,
    },
    header: {
        marginBottom: spacing.xl,
        marginTop: spacing.md,
    },
    headerTitle: {
        fontSize: typography.fontSize.xxxl,
        fontWeight: typography.fontWeight.extrabold,
        color: colors.white,
        marginBottom: spacing.xs,
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    headerSubtitle: {
        fontSize: typography.fontSize.md,
        color: 'rgba(255, 255, 255, 0.9)',
    },
    sectionCard: {
        marginBottom: spacing.xl,
        padding: spacing.lg,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: borderRadius.round,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    cardTitle: {
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.bold,
        color: colors.text.primary,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    label: {
        fontSize: typography.fontSize.sm,
        fontWeight: '600',
        color: colors.text.secondary,
        marginBottom: spacing.xs,
        marginLeft: spacing.xs,
    },
    dropdownContainer: {
        zIndex: 10, // Helps with overlay if needed, though mostly handled by FlatList logic usually
    },
    dropdownButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: colors.input.background,
        borderWidth: 1,
        borderColor: colors.input.border,
        borderRadius: borderRadius.md,
        paddingHorizontal: spacing.md,
        paddingVertical: 14, // Match StandardInput height roughly
    },
    dropdownButtonText: {
        fontSize: typography.fontSize.base,
        color: colors.text.primary,
    },
    placeholderText: {
        color: colors.text.tertiary,
    },
    dropdownList: {
        backgroundColor: colors.white,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: colors.border,
        marginTop: spacing.xs,
        overflow: 'hidden',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 3,
            },
            web: {
                boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
            },
        }),
    },
    dropdownItem: {
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.background.secondary,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dropdownItemText: {
        fontSize: typography.fontSize.base,
        color: colors.text.secondary,
    },
    dropdownItemTextSelected: {
        color: colors.primary,
        fontWeight: '600',
    },
    multiSelectContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: spacing.xs,
    },
    multiSelectChip: {
        backgroundColor: colors.background.secondary,
        borderRadius: borderRadius.round,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        marginRight: spacing.sm,
        marginBottom: spacing.sm,
        borderWidth: 1,
        borderColor: colors.border,
    },
    multiSelectChipActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    multiSelectChipText: {
        fontSize: typography.fontSize.sm,
        color: colors.text.secondary,
    },
    multiSelectChipTextActive: {
        color: colors.white,
        fontWeight: '600',
    },
    uploadBox: {
        backgroundColor: colors.background.secondary,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: colors.border,
        borderStyle: 'dashed',
        paddingVertical: spacing.xl,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.lg,
        marginTop: spacing.xs,
    },
    uploadText: {
        fontSize: typography.fontSize.sm,
        color: colors.text.tertiary,
        marginTop: spacing.xs,
    },
    footerSpacer: {
        height: 80,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: colors.white,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -2 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
            },
            android: {
                elevation: 5,
            },
            web: {
                boxShadow: '0px -2px 5px rgba(0, 0, 0, 0.05)',
            },
        }),
    },
});

export default TrainerOnboardingSurveyScreen;
