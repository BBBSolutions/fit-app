import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    SafeAreaView,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const TrainerOnboardingSurveyScreen = ({ navigation }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        fullName: '',
        age: '',
        gender: '',
        phoneNumber: '+91 234 567 8900', // Pre-filled from verification
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
        setShowDropdown({ ...showDropdown, [field]: !showDropdown[field] });
    };

    const selectDropdownOption = (field, value) => {
        updateField(field, value);
        setShowDropdown({ ...showDropdown, [field]: false });
    };

    const toggleSecondarySkill = (skill) => {
        const currentSkills = formData.secondarySkills;
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
            setLoading(false);
            // Navigate directly for web compatibility
            navigation.replace('TrainerDashboard');
        } catch (error) {
            console.error('Failed to save trainer profile:', error);
            setLoading(false);
            Alert.alert('Error', 'Failed to save profile. Please try again.');
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>

                {/* 1. Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Trainer Onboarding</Text>
                    <Text style={styles.headerSubtitle}>Tell us about yourself</Text>
                </View>

                {/* 2. Basic Details */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="person-outline" size={24} color="#3182CE" />
                        <Text style={styles.cardTitle}>Basic Details</Text>
                    </View>

                    <Text style={styles.label}>Full Name *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g., John Smith"
                        value={formData.fullName}
                        onChangeText={(text) => updateField('fullName', text)}
                    />

                    <View style={styles.inputRow}>
                        <View style={styles.inputHalf}>
                            <Text style={styles.label}>Age</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g., 30"
                                keyboardType="numeric"
                                value={formData.age}
                                onChangeText={(text) => updateField('age', text)}
                            />
                        </View>
                        <View style={styles.inputHalf}>
                            <Text style={styles.label}>Gender</Text>
                            <TouchableOpacity
                                style={styles.dropdown}
                                onPress={() => toggleDropdown('gender')}
                            >
                                <Text style={[styles.dropdownText, !formData.gender && styles.placeholder]}>
                                    {formData.gender || 'Select'}
                                </Text>
                                <Ionicons name="chevron-down" size={20} color="#718096" />
                            </TouchableOpacity>
                            {showDropdown.gender && (
                                <View style={styles.dropdownList}>
                                    {genderOptions.map((option) => (
                                        <TouchableOpacity
                                            key={option}
                                            style={styles.dropdownItem}
                                            onPress={() => selectDropdownOption('gender', option)}
                                        >
                                            <Text style={styles.dropdownItemText}>{option}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                        </View>
                    </View>

                    <Text style={styles.label}>Phone Number</Text>
                    <TextInput
                        style={[styles.input, styles.inputDisabled]}
                        value={formData.phoneNumber}
                        editable={false}
                    />

                    <Text style={styles.label}>Email Address *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g., trainer@example.com"
                        keyboardType="email-address"
                        value={formData.email}
                        onChangeText={(text) => updateField('email', text)}
                    />
                </View>

                {/* 3. Professional Information */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="briefcase-outline" size={24} color="#3182CE" />
                        <Text style={styles.cardTitle}>Professional Information</Text>
                    </View>

                    <Text style={styles.label}>Years of Experience</Text>
                    <TouchableOpacity
                        style={styles.dropdown}
                        onPress={() => toggleDropdown('yearsOfExperience')}
                    >
                        <Text style={[styles.dropdownText, !formData.yearsOfExperience && styles.placeholder]}>
                            {formData.yearsOfExperience || 'Select experience'}
                        </Text>
                        <Ionicons name="chevron-down" size={20} color="#718096" />
                    </TouchableOpacity>
                    {showDropdown.yearsOfExperience && (
                        <View style={styles.dropdownList}>
                            {experienceOptions.map((option) => (
                                <TouchableOpacity
                                    key={option}
                                    style={styles.dropdownItem}
                                    onPress={() => selectDropdownOption('yearsOfExperience', option)}
                                >
                                    <Text style={styles.dropdownItemText}>{option}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    <Text style={styles.label}>Primary Training Specialization *</Text>
                    <TouchableOpacity
                        style={styles.dropdown}
                        onPress={() => toggleDropdown('primarySpecialization')}
                    >
                        <Text style={[styles.dropdownText, !formData.primarySpecialization && styles.placeholder]}>
                            {formData.primarySpecialization || 'Select specialization'}
                        </Text>
                        <Ionicons name="chevron-down" size={20} color="#718096" />
                    </TouchableOpacity>
                    {showDropdown.primarySpecialization && (
                        <View style={styles.dropdownList}>
                            {specializationOptions.map((option) => (
                                <TouchableOpacity
                                    key={option}
                                    style={styles.dropdownItem}
                                    onPress={() => selectDropdownOption('primarySpecialization', option)}
                                >
                                    <Text style={styles.dropdownItemText}>{option}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    <Text style={styles.label}>Secondary Skills (optional)</Text>
                    <View style={styles.multiSelectContainer}>
                        {secondarySkillsOptions.map((skill) => (
                            <TouchableOpacity
                                key={skill}
                                style={[
                                    styles.multiSelectChip,
                                    formData.secondarySkills.includes(skill) && styles.multiSelectChipActive,
                                ]}
                                onPress={() => toggleSecondarySkill(skill)}
                            >
                                <Text
                                    style={[
                                        styles.multiSelectChipText,
                                        formData.secondarySkills.includes(skill) && styles.multiSelectChipTextActive,
                                    ]}
                                >
                                    {skill}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* 4. Certifications (Optional) */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="ribbon-outline" size={24} color="#3182CE" />
                        <Text style={styles.cardTitle}>Certifications (Optional)</Text>
                    </View>

                    <Text style={styles.label}>Certification Type</Text>
                    <TouchableOpacity
                        style={styles.dropdown}
                        onPress={() => toggleDropdown('certificationType')}
                    >
                        <Text style={[styles.dropdownText, !formData.certificationType && styles.placeholder]}>
                            {formData.certificationType || 'Select certification'}
                        </Text>
                        <Ionicons name="chevron-down" size={20} color="#718096" />
                    </TouchableOpacity>
                    {showDropdown.certificationType && (
                        <View style={styles.dropdownList}>
                            {certificationOptions.map((option) => (
                                <TouchableOpacity
                                    key={option}
                                    style={styles.dropdownItem}
                                    onPress={() => selectDropdownOption('certificationType', option)}
                                >
                                    <Text style={styles.dropdownItemText}>{option}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    <Text style={styles.label}>Upload Certificate</Text>
                    <TouchableOpacity style={styles.uploadBox}>
                        <Ionicons name="cloud-upload-outline" size={32} color="#A0AEC0" />
                        <Text style={styles.uploadText}>Tap to upload certificate</Text>
                    </TouchableOpacity>

                    <Text style={styles.label}>Additional Notes</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="e.g., Certificate ID, expiry date..."
                        multiline
                        numberOfLines={3}
                        value={formData.certificationNotes}
                        onChangeText={(text) => updateField('certificationNotes', text)}
                    />
                </View>

                {/* 5. Coaching Preferences */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="settings-outline" size={24} color="#3182CE" />
                        <Text style={styles.cardTitle}>Coaching Preferences</Text>
                    </View>

                    <Text style={styles.label}>Preferred Coaching Method</Text>
                    <TouchableOpacity
                        style={styles.dropdown}
                        onPress={() => toggleDropdown('coachingMethod')}
                    >
                        <Text style={[styles.dropdownText, !formData.coachingMethod && styles.placeholder]}>
                            {formData.coachingMethod || 'Select method'}
                        </Text>
                        <Ionicons name="chevron-down" size={20} color="#718096" />
                    </TouchableOpacity>
                    {showDropdown.coachingMethod && (
                        <View style={styles.dropdownList}>
                            {coachingMethodOptions.map((option) => (
                                <TouchableOpacity
                                    key={option}
                                    style={styles.dropdownItem}
                                    onPress={() => selectDropdownOption('coachingMethod', option)}
                                >
                                    <Text style={styles.dropdownItemText}>{option}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    <Text style={styles.label}>Preferred Client Type</Text>
                    <TouchableOpacity
                        style={styles.dropdown}
                        onPress={() => toggleDropdown('clientType')}
                    >
                        <Text style={[styles.dropdownText, !formData.clientType && styles.placeholder]}>
                            {formData.clientType || 'Select client type'}
                        </Text>
                        <Ionicons name="chevron-down" size={20} color="#718096" />
                    </TouchableOpacity>
                    {showDropdown.clientType && (
                        <View style={styles.dropdownList}>
                            {clientTypeOptions.map((option) => (
                                <TouchableOpacity
                                    key={option}
                                    style={styles.dropdownItem}
                                    onPress={() => selectDropdownOption('clientType', option)}
                                >
                                    <Text style={styles.dropdownItemText}>{option}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    <Text style={styles.label}>Max Clients You Can Manage</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g., 15"
                        keyboardType="numeric"
                        value={formData.maxClients}
                        onChangeText={(text) => updateField('maxClients', text)}
                    />
                </View>

                {/* 6. Bio/Introduction */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="document-text-outline" size={24} color="#3182CE" />
                        <Text style={styles.cardTitle}>Bio/Introduction</Text>
                    </View>

                    <Text style={styles.label}>About You</Text>
                    <TextInput
                        style={[styles.input, styles.bioTextArea]}
                        placeholder="Write a short introduction for your clients..."
                        multiline
                        numberOfLines={6}
                        value={formData.bio}
                        onChangeText={(text) => updateField('bio', text)}
                    />
                </View>

                <View style={styles.bottomSpacer} />
            </ScrollView>

            {/* 7. Save & Continue */}
            <View style={styles.bottomBar}>
                <TouchableOpacity
                    style={[styles.saveButton, loading && styles.saveButtonDisabled]}
                    onPress={handleSaveProfile}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <Text style={styles.saveButtonText}>Save Profile</Text>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },
    container: {
        flex: 1,
    },
    contentContainer: {
        padding: 20,
        paddingBottom: 100,
    },
    header: {
        marginBottom: 24,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#1A202C',
        marginBottom: 8,
    },
    headerSubtitle: {
        fontSize: 16,
        color: '#718096',
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2D3748',
        marginLeft: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4A5568',
        marginBottom: 8,
        marginTop: 12,
    },
    input: {
        backgroundColor: '#F7FAFC',
        borderRadius: 10,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 15,
        color: '#2D3748',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    inputDisabled: {
        backgroundColor: '#EDF2F7',
        color: '#A0AEC0',
    },
    inputRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    inputHalf: {
        width: '48%',
    },
    dropdown: {
        backgroundColor: '#F7FAFC',
        borderRadius: 10,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dropdownText: {
        fontSize: 15,
        color: '#2D3748',
    },
    placeholder: {
        color: '#A0AEC0',
    },
    dropdownList: {
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginTop: 4,
        maxHeight: 200,
    },
    dropdownItem: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    dropdownItemText: {
        fontSize: 15,
        color: '#2D3748',
    },
    multiSelectContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 8,
    },
    multiSelectChip: {
        backgroundColor: '#F7FAFC',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginRight: 8,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    multiSelectChipActive: {
        backgroundColor: '#3182CE',
        borderColor: '#3182CE',
    },
    multiSelectChipText: {
        fontSize: 14,
        color: '#4A5568',
    },
    multiSelectChipTextActive: {
        color: '#FFFFFF',
    },
    uploadBox: {
        backgroundColor: '#F7FAFC',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#E2E8F0',
        borderStyle: 'dashed',
        paddingVertical: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    uploadText: {
        fontSize: 14,
        color: '#A0AEC0',
        marginTop: 8,
    },
    textArea: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    bioTextArea: {
        minHeight: 120,
        textAlignVertical: 'top',
    },
    bottomSpacer: {
        height: 20,
    },
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 5,
    },
    saveButton: {
        backgroundColor: '#3182CE',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
    },
    saveButtonDisabled: {
        backgroundColor: '#A0AEC0',
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
});

export default TrainerOnboardingSurveyScreen;
