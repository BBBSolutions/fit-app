import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    Alert,
    SafeAreaView,
} from 'react-native';
import { api } from '../../services/api';

const OnboardingSurvey = ({ navigation, route }) => {
    const { isEditMode, existingData } = route.params || {};
    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: existingData?.name || '',
        email: existingData?.email || '',
        age: existingData?.age ? String(existingData.age) : '',
        gender: existingData?.gender || '',
        height: existingData?.height ? String(existingData.height) : '',
        weight: existingData?.weight ? String(existingData.weight) : '',
        fitnessLevel: existingData?.fitnessLevel || '',
        experienceDuration: existingData?.experienceDuration || '',
        goal: existingData?.primaryGoal || existingData?.goal || '',
        waist: existingData?.waist ? String(existingData.waist) : '',
        hip: existingData?.hip ? String(existingData.hip) : '',
        chest: existingData?.chest ? String(existingData.chest) : '',
        arms: existingData?.arms ? String(existingData.arms) : '',
        thighs: existingData?.thighs ? String(existingData.thighs) : '',
        activityLevel: existingData?.activityLevel || '',
        workoutDays: existingData?.workoutDays ? String(existingData.workoutDays) : '',
        injuries: existingData?.injuries || '',
        medicalConditions: existingData?.medicalConditions || '',
        workoutLocation: existingData?.workoutLocation || '',
        trainingStyle: existingData?.trainingStyle || '',
        exercisesToAvoid: existingData?.exercisesToAvoid || '',
        planType: existingData?.planType || '',
    });

    const updateField = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleNext = () => {
        // Basic validation example
        if (!formData.name || !formData.age || !formData.goal || !formData.planType) {
            Alert.alert('Missing Information', 'Please fill in the required fields.');
            return;
        }

        setIsLoading(true);

        // Backend Integration
        api.updateProfile(formData)
            .then(() => {
                Alert.alert("Success", isEditMode ? "Profile updated!" : "Profile setup complete!");
                if (isEditMode) {
                    navigation.goBack();
                } else {
                    navigation.navigate('MainApp');
                }
            })
            .catch(err => {
                console.error("Profile Save Error:", err);
                Alert.alert("Error", "Could not save profile. Please try again.");
            })
            .finally(() => {
                setIsLoading(false);
            });
    };

    const SelectionGroup = ({ options, selectedValue, onSelect }) => (
        <View style={styles.selectionGroup}>
            {options.map((option) => (
                <TouchableOpacity
                    key={option}
                    style={[
                        styles.selectionButton,
                        selectedValue === option && styles.selectionButtonActive,
                    ]}
                    onPress={() => onSelect(option)}
                >
                    <Text
                        style={[
                            styles.selectionButtonText,
                            selectedValue === option && styles.selectionButtonTextActive,
                        ]}
                    >
                        {option}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
                <Text style={styles.headerTitle}>Let's Get to Know You</Text>
                <Text style={styles.headerSubtitle}>
                    Help us create the perfect plan for you.
                </Text>

                {/* 1. Basic Information */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>1. Basic Information</Text>

                    <Text style={styles.label}>Name</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. Alex Johnson"
                        value={formData.name}
                        onChangeText={(text) => updateField('name', text)}
                    />

                    <Text style={styles.label}>Email (Recommended)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. alex@example.com"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={formData.email}
                        onChangeText={(text) => updateField('email', text)}
                    />

                    <Text style={styles.label}>Age</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. 25"
                        keyboardType="numeric"
                        value={formData.age}
                        onChangeText={(text) => updateField('age', text)}
                    />

                    <Text style={styles.label}>Gender</Text>
                    <SelectionGroup
                        options={['Male', 'Female', 'Other']}
                        selectedValue={formData.gender}
                        onSelect={(val) => updateField('gender', val)}
                    />

                    <View style={styles.row}>
                        <View style={styles.halfInputContainer}>
                            <Text style={styles.label}>Height (cm)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. 175"
                                keyboardType="numeric"
                                value={formData.height}
                                onChangeText={(text) => updateField('height', text)}
                            />
                        </View>
                        <View style={styles.halfInputContainer}>
                            <Text style={styles.label}>Weight (kg)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. 70"
                                keyboardType="numeric"
                                value={formData.weight}
                                onChangeText={(text) => updateField('weight', text)}
                            />
                        </View>
                    </View>
                </View>

                {/* 2. Fitness Experience */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>2. Fitness Experience</Text>

                    <Text style={styles.label}>Fitness Level</Text>
                    <SelectionGroup
                        options={['Beginner', 'Intermediate', 'Advanced']}
                        selectedValue={formData.fitnessLevel}
                        onSelect={(val) => updateField('fitnessLevel', val)}
                    />

                    <Text style={styles.label}>Experience Duration</Text>
                    <SelectionGroup
                        options={['0-6 months', '6-12 months', '1-3 years', '3+ years']}
                        selectedValue={formData.experienceDuration}
                        onSelect={(val) => updateField('experienceDuration', val)}
                    />
                </View>

                {/* 3. Primary Goal */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>3. Primary Goal</Text>
                    <SelectionGroup
                        options={[
                            'Lose Fat',
                            'Build Muscle',
                            'Improve Strength',
                            'Improve Endurance',
                            'General Fitness',
                        ]}
                        selectedValue={formData.goal}
                        onSelect={(val) => updateField('goal', val)}
                    />
                </View>

                {/* 4. Body Measurements (Optional) */}
                <View style={styles.section}>
                    <View style={styles.sectionHeaderRow}>
                        <Text style={styles.sectionTitle}>4. Body Measurements</Text>
                        <Text style={styles.optionalBadge}>Optional</Text>
                    </View>

                    <View style={styles.row}>
                        <View style={styles.halfInputContainer}>
                            <Text style={styles.label}>Waist (cm)</Text>
                            <TextInput
                                style={styles.input}
                                keyboardType="numeric"
                                value={formData.waist}
                                onChangeText={(text) => updateField('waist', text)}
                            />
                        </View>
                        <View style={styles.halfInputContainer}>
                            <Text style={styles.label}>Hip (cm)</Text>
                            <TextInput
                                style={styles.input}
                                keyboardType="numeric"
                                value={formData.hip}
                                onChangeText={(text) => updateField('hip', text)}
                            />
                        </View>
                    </View>

                    <View style={styles.row}>
                        <View style={styles.halfInputContainer}>
                            <Text style={styles.label}>Chest (cm)</Text>
                            <TextInput
                                style={styles.input}
                                keyboardType="numeric"
                                value={formData.chest}
                                onChangeText={(text) => updateField('chest', text)}
                            />
                        </View>
                        <View style={styles.halfInputContainer}>
                            <Text style={styles.label}>Arms (cm)</Text>
                            <TextInput
                                style={styles.input}
                                keyboardType="numeric"
                                value={formData.arms}
                                onChangeText={(text) => updateField('arms', text)}
                            />
                        </View>
                    </View>

                    <View style={styles.row}>
                        <View style={styles.halfInputContainer}>
                            <Text style={styles.label}>Thighs (cm)</Text>
                            <TextInput
                                style={styles.input}
                                keyboardType="numeric"
                                value={formData.thighs}
                                onChangeText={(text) => updateField('thighs', text)}
                            />
                        </View>
                    </View>
                </View>

                {/* 5. Lifestyle & Activity */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>5. Lifestyle & Activity</Text>

                    <Text style={styles.label}>Daily Activity Level</Text>
                    <SelectionGroup
                        options={[
                            'Sedentary',
                            'Lightly Active',
                            'Moderately Active',
                            'Very Active',
                        ]}
                        selectedValue={formData.activityLevel}
                        onSelect={(val) => updateField('activityLevel', val)}
                    />

                    <Text style={styles.label}>Weekly Workout Days</Text>
                    <SelectionGroup
                        options={['2', '3', '4', '5', '6']}
                        selectedValue={formData.workoutDays}
                        onSelect={(val) => updateField('workoutDays', val)}
                    />
                </View>

                {/* 6. Medical & Injury Information */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>6. Medical & Injury Information</Text>

                    <Text style={styles.label}>Existing Injuries</Text>
                    <SelectionGroup
                        options={['None', 'Back Pain', 'Knee Pain', 'Shoulder Pain']}
                        selectedValue={formData.injuries}
                        onSelect={(val) => updateField('injuries', val)}
                    />

                    <Text style={styles.label}>Medical Conditions</Text>
                    <SelectionGroup
                        options={['None', 'Diabetes', 'Blood Pressure']}
                        selectedValue={formData.medicalConditions}
                        onSelect={(val) => updateField('medicalConditions', val)}
                    />
                </View>

                {/* 7. Equipment Access */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>7. Equipment Access</Text>
                    <Text style={styles.label}>Workout Location</Text>
                    <SelectionGroup
                        options={['Full Gym', 'Home (Dumbbells)', 'Home (Bodyweight)']}
                        selectedValue={formData.workoutLocation}
                        onSelect={(val) => updateField('workoutLocation', val)}
                    />
                </View>

                {/* 8. Exercise Preferences */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>8. Exercise Preferences</Text>

                    <Text style={styles.label}>Preferred Training Style</Text>
                    <SelectionGroup
                        options={['Strength', 'HIIT', 'Cardio', 'Mixed']}
                        selectedValue={formData.trainingStyle}
                        onSelect={(val) => updateField('trainingStyle', val)}
                    />

                    <Text style={styles.label}>Exercises to Avoid</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="List any exercises you cannot perform..."
                        multiline
                        numberOfLines={3}
                        value={formData.exercisesToAvoid}
                        onChangeText={(text) => updateField('exercisesToAvoid', text)}
                    />
                </View>

                {/* 9. Plan Type */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>9. Plan Type</Text>
                    <TouchableOpacity
                        style={[
                            styles.planCard,
                            formData.planType === 'Free' && styles.planCardActive,
                        ]}
                        onPress={() => updateField('planType', 'Free')}
                    >
                        <Text style={styles.planTitle}>Free Plan</Text>
                        <Text style={styles.planDesc}>Manual plan creation.</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.planCard,
                            formData.planType === 'AI' && styles.planCardActive,
                        ]}
                        onPress={() => updateField('planType', 'AI')}
                    >
                        <View style={styles.rowBetween}>
                            <Text style={styles.planTitle}>AI-Generated Plan</Text>
                            <Text style={styles.paidBadge}>PAID</Text>
                        </View>
                        <Text style={styles.planDesc}>
                            Personalized plan based on your data.
                        </Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                    <Text style={styles.nextButtonText}>Next</Text>
                </TouchableOpacity>

                <View style={styles.footerSpacer} />
            </ScrollView>
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
        marginBottom: 24,
    },
    section: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2D3748',
        marginBottom: 16,
    },
    optionalBadge: {
        fontSize: 12,
        color: '#718096',
        backgroundColor: '#EDF2F7',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        overflow: 'hidden',
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4A5568',
        marginBottom: 8,
        marginTop: 8,
    },
    input: {
        backgroundColor: '#EDF2F7',
        borderRadius: 10,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        color: '#2D3748',
        marginBottom: 12,
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    rowBetween: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
    },
    halfInputContainer: {
        width: '48%',
    },
    selectionGroup: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 12,
    },
    selectionButton: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginRight: 8,
        marginBottom: 8,
        backgroundColor: '#FFFFFF',
    },
    selectionButtonActive: {
        backgroundColor: '#3182CE',
        borderColor: '#3182CE',
    },
    selectionButtonText: {
        fontSize: 14,
        color: '#4A5568',
        fontWeight: '500',
    },
    selectionButtonTextActive: {
        color: '#FFFFFF',
    },
    planCard: {
        borderWidth: 2,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        backgroundColor: '#FFFFFF',
    },
    planCardActive: {
        borderColor: '#3182CE',
        backgroundColor: '#EBF8FF',
    },
    planTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#2D3748',
        marginBottom: 4,
    },
    planDesc: {
        fontSize: 14,
        color: '#718096',
    },
    paidBadge: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#FFFFFF',
        backgroundColor: '#48BB78',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        overflow: 'hidden',
    },
    nextButton: {
        backgroundColor: '#3182CE',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 10,
        shadowColor: '#3182CE',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    nextButtonText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    footerSpacer: {
        height: 40,
    }
});

export default OnboardingSurvey;
