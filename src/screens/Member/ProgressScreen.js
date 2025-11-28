import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    SafeAreaView,
    TouchableOpacity,
    Modal,
    TextInput,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ProgressScreen = () => {
    // Sample data
    const [currentWeight, setCurrentWeight] = useState(75.5);
    const weightChange = -2.3;
    const streakDays = 12;
    const workoutsThisWeek = 4;
    const caloriesBurned = 1850;
    const totalMinutes = 180;

    // Member details from onboarding (including body measurements)
    const [memberDetails, setMemberDetails] = useState({
        name: 'Alex Johnson',
        age: '28',
        gender: 'Male',
        height: '175',
        weight: '75.5',
        waist: '32',
        hip: '38',
        chest: '40',
        arms: '14',
        thighs: '22',
        fitnessLevel: 'Intermediate',
        primaryGoal: 'Build Muscle',
        experience: '1-2 years',
        workoutDays: '4-5 days/week',
        activityLevel: 'Moderately Active',
    });

    const [showEditModal, setShowEditModal] = useState(false);
    const [editedDetails, setEditedDetails] = useState({ ...memberDetails });
    const [showDropdown, setShowDropdown] = useState({
        fitnessLevel: false,
        primaryGoal: false,
        experience: false,
    });

    // Dropdown options (from onboarding)
    const fitnessLevelOptions = ['Beginner', 'Intermediate', 'Advanced'];
    const goalOptions = ['Lose Weight', 'Build Muscle', 'Get Toned', 'Improve Endurance', 'General Fitness'];
    const experienceOptions = ['Never', 'Less than 6 months', '6 months - 1 year', '1-2 years', '2+ years'];

    const completedWorkouts = [
        { id: 1, title: 'Full Body Strength', date: 'Nov 24, 2025', duration: '45 min' },
        { id: 2, title: 'Upper Body Focus', date: 'Nov 22, 2025', duration: '40 min' },
        { id: 3, title: 'Leg Day', date: 'Nov 20, 2025', duration: '50 min' },
        { id: 4, title: 'Cardio & Core', date: 'Nov 18, 2025', duration: '35 min' },
    ];

    const handleSaveDetails = () => {
        setMemberDetails(editedDetails);
        setCurrentWeight(parseFloat(editedDetails.weight));
        setShowEditModal(false);
        Alert.alert('Success', 'Your details have been updated!');
    };

    const handleCancelEdit = () => {
        setEditedDetails({ ...memberDetails });
        setShowEditModal(false);
        setShowDropdown({ fitnessLevel: false, primaryGoal: false, experience: false });
    };

    const selectDropdownOption = (field, value) => {
        setEditedDetails({ ...editedDetails, [field]: value });
        setShowDropdown({ ...showDropdown, [field]: false });
    };

    // Generate streak calendar (7 columns x 5 rows = 35 days)
    const generateStreakCalendar = () => {
        const days = [];
        for (let i = 0; i < 35; i++) {
            const isActive = i >= 35 - streakDays;
            days.push(
                <View
                    key={i}
                    style={[styles.calendarDay, isActive && styles.calendarDayActive]}
                />
            );
        }
        return days;
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>

                {/* 1. Header */}
                <Text style={styles.headerTitle}>Progress</Text>

                {/* Member Details Card */}
                <View style={styles.card}>
                    <View style={styles.detailsHeader}>
                        <Text style={styles.cardTitle}>My Details</Text>
                        <TouchableOpacity onPress={() => setShowEditModal(true)}>
                            <Ionicons name="create-outline" size={24} color="#3182CE" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.detailsGrid}>
                        <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>Name</Text>
                            <Text style={styles.detailValue}>{memberDetails.name}</Text>
                        </View>
                        <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>Age</Text>
                            <Text style={styles.detailValue}>{memberDetails.age}</Text>
                        </View>
                        <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>Gender</Text>
                            <Text style={styles.detailValue}>{memberDetails.gender}</Text>
                        </View>
                        <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>Height</Text>
                            <Text style={styles.detailValue}>{memberDetails.height} cm</Text>
                        </View>
                        <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>Weight</Text>
                            <Text style={styles.detailValue}>{memberDetails.weight} kg</Text>
                        </View>
                        <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>Fitness Level</Text>
                            <Text style={styles.detailValue}>{memberDetails.fitnessLevel}</Text>
                        </View>
                        <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>Goal</Text>
                            <Text style={styles.detailValue}>{memberDetails.primaryGoal}</Text>
                        </View>
                        <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>Experience</Text>
                            <Text style={styles.detailValue}>{memberDetails.experience}</Text>
                        </View>
                    </View>

                    {/* Body Measurements Section */}
                    <Text style={styles.measurementsTitle}>Body Measurements</Text>
                    <View style={styles.detailsGrid}>
                        <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>Waist</Text>
                            <Text style={styles.detailValue}>{memberDetails.waist} inches</Text>
                        </View>
                        <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>Hip</Text>
                            <Text style={styles.detailValue}>{memberDetails.hip} inches</Text>
                        </View>
                        <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>Chest</Text>
                            <Text style={styles.detailValue}>{memberDetails.chest} inches</Text>
                        </View>
                        <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>Arms</Text>
                            <Text style={styles.detailValue}>{memberDetails.arms} inches</Text>
                        </View>
                        <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>Thighs</Text>
                            <Text style={styles.detailValue}>{memberDetails.thighs} inches</Text>
                        </View>
                    </View>
                </View>

                {/* 2. Weight Trend Card */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Weight Progress</Text>

                    <View style={styles.weightGraphPlaceholder}>
                        <Text style={styles.graphPlaceholderText}>📈 Weight Trend Graph</Text>
                    </View>

                    <View style={styles.weightStats}>
                        <View style={styles.weightStatItem}>
                            <Text style={styles.weightStatLabel}>Current Weight</Text>
                            <Text style={styles.weightStatValue}>{currentWeight} kg</Text>
                        </View>
                        <View style={styles.weightStatItem}>
                            <Text style={styles.weightStatLabel}>Change</Text>
                            <Text style={[styles.weightStatValue, styles.weightChange]}>
                                {weightChange > 0 ? '+' : ''}{weightChange} kg
                            </Text>
                        </View>
                    </View>
                </View>

                {/* 3. Streak Calendar */}
                <View style={styles.card}>
                    <View style={styles.streakHeader}>
                        <Text style={styles.cardTitle}>Workout Streak</Text>
                        <View style={styles.streakBadge}>
                            <Text style={styles.streakBadgeText}>🔥 {streakDays} Days</Text>
                        </View>
                    </View>

                    <View style={styles.calendarGrid}>
                        {generateStreakCalendar()}
                    </View>
                </View>

                {/* 4. Weekly Summary Cards */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>This Week</Text>
                    <View style={styles.summaryRow}>
                        <View style={styles.summaryCard}>
                            <Text style={styles.summaryIcon}>💪</Text>
                            <Text style={styles.summaryValue}>{workoutsThisWeek}</Text>
                            <Text style={styles.summaryLabel}>Workouts</Text>
                        </View>
                        <View style={styles.summaryCard}>
                            <Text style={styles.summaryIcon}>🔥</Text>
                            <Text style={styles.summaryValue}>{caloriesBurned}</Text>
                            <Text style={styles.summaryLabel}>Calories</Text>
                        </View>
                        <View style={styles.summaryCard}>
                            <Text style={styles.summaryIcon}>⏱</Text>
                            <Text style={styles.summaryValue}>{totalMinutes}</Text>
                            <Text style={styles.summaryLabel}>Minutes</Text>
                        </View>
                    </View>
                </View>

                {/* 5. Completed Workouts List */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Completed Workouts</Text>
                    {completedWorkouts.map((workout) => (
                        <View key={workout.id} style={styles.workoutItem}>
                            <View style={styles.statusDot} />
                            <View style={styles.workoutInfo}>
                                <Text style={styles.workoutTitle}>{workout.title}</Text>
                                <Text style={styles.workoutMeta}>
                                    {workout.date} • {workout.duration}
                                </Text>
                            </View>
                        </View>
                    ))}
                </View>

                <View style={styles.bottomSpacer} />
            </ScrollView>

            {/* Edit Details Modal */}
            <Modal
                visible={showEditModal}
                animationType="slide"
                transparent={true}
                onRequestClose={handleCancelEdit}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Edit My Details</Text>
                            <TouchableOpacity onPress={handleCancelEdit}>
                                <Ionicons name="close" size={24} color="#2D3748" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView>
                            <Text style={styles.inputLabel}>Name</Text>
                            <TextInput
                                style={styles.input}
                                value={editedDetails.name}
                                onChangeText={(text) => setEditedDetails({ ...editedDetails, name: text })}
                            />

                            <View style={styles.inputRow}>
                                <View style={styles.inputHalf}>
                                    <Text style={styles.inputLabel}>Age</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={editedDetails.age}
                                        keyboardType="numeric"
                                        onChangeText={(text) => setEditedDetails({ ...editedDetails, age: text })}
                                    />
                                </View>
                                <View style={styles.inputHalf}>
                                    <Text style={styles.inputLabel}>Gender</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={editedDetails.gender}
                                        onChangeText={(text) => setEditedDetails({ ...editedDetails, gender: text })}
                                    />
                                </View>
                            </View>

                            <View style={styles.inputRow}>
                                <View style={styles.inputHalf}>
                                    <Text style={styles.inputLabel}>Height (cm)</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={editedDetails.height}
                                        keyboardType="numeric"
                                        onChangeText={(text) => setEditedDetails({ ...editedDetails, height: text })}
                                    />
                                </View>
                                <View style={styles.inputHalf}>
                                    <Text style={styles.inputLabel}>Weight (kg)</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={editedDetails.weight}
                                        keyboardType="numeric"
                                        onChangeText={(text) => setEditedDetails({ ...editedDetails, weight: text })}
                                    />
                                </View>
                            </View>

                            {/* Body Measurements */}
                            <Text style={styles.sectionLabel}>Body Measurements (inches)</Text>

                            <View style={styles.inputRow}>
                                <View style={styles.inputHalf}>
                                    <Text style={styles.inputLabel}>Waist</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={editedDetails.waist}
                                        keyboardType="numeric"
                                        onChangeText={(text) => setEditedDetails({ ...editedDetails, waist: text })}
                                    />
                                </View>
                                <View style={styles.inputHalf}>
                                    <Text style={styles.inputLabel}>Hip</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={editedDetails.hip}
                                        keyboardType="numeric"
                                        onChangeText={(text) => setEditedDetails({ ...editedDetails, hip: text })}
                                    />
                                </View>
                            </View>

                            <View style={styles.inputRow}>
                                <View style={styles.inputHalf}>
                                    <Text style={styles.inputLabel}>Chest</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={editedDetails.chest}
                                        keyboardType="numeric"
                                        onChangeText={(text) => setEditedDetails({ ...editedDetails, chest: text })}
                                    />
                                </View>
                                <View style={styles.inputHalf}>
                                    <Text style={styles.inputLabel}>Arms</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={editedDetails.arms}
                                        keyboardType="numeric"
                                        onChangeText={(text) => setEditedDetails({ ...editedDetails, arms: text })}
                                    />
                                </View>
                            </View>

                            <Text style={styles.inputLabel}>Thighs</Text>
                            <TextInput
                                style={styles.input}
                                value={editedDetails.thighs}
                                keyboardType="numeric"
                                onChangeText={(text) => setEditedDetails({ ...editedDetails, thighs: text })}
                            />

                            {/* Fitness Level Dropdown */}
                            <Text style={styles.inputLabel}>Fitness Level</Text>
                            <TouchableOpacity
                                style={styles.dropdown}
                                onPress={() => setShowDropdown({ ...showDropdown, fitnessLevel: !showDropdown.fitnessLevel })}
                            >
                                <Text style={styles.dropdownText}>{editedDetails.fitnessLevel}</Text>
                                <Ionicons name="chevron-down" size={20} color="#718096" />
                            </TouchableOpacity>
                            {showDropdown.fitnessLevel && (
                                <View style={styles.dropdownList}>
                                    {fitnessLevelOptions.map((option) => (
                                        <TouchableOpacity
                                            key={option}
                                            style={styles.dropdownItem}
                                            onPress={() => selectDropdownOption('fitnessLevel', option)}
                                        >
                                            <Text style={styles.dropdownItemText}>{option}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}

                            {/* Primary Goal Dropdown */}
                            <Text style={styles.inputLabel}>Primary Goal</Text>
                            <TouchableOpacity
                                style={styles.dropdown}
                                onPress={() => setShowDropdown({ ...showDropdown, primaryGoal: !showDropdown.primaryGoal })}
                            >
                                <Text style={styles.dropdownText}>{editedDetails.primaryGoal}</Text>
                                <Ionicons name="chevron-down" size={20} color="#718096" />
                            </TouchableOpacity>
                            {showDropdown.primaryGoal && (
                                <View style={styles.dropdownList}>
                                    {goalOptions.map((option) => (
                                        <TouchableOpacity
                                            key={option}
                                            style={styles.dropdownItem}
                                            onPress={() => selectDropdownOption('primaryGoal', option)}
                                        >
                                            <Text style={styles.dropdownItemText}>{option}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}

                            {/* Experience Dropdown */}
                            <Text style={styles.inputLabel}>Experience</Text>
                            <TouchableOpacity
                                style={styles.dropdown}
                                onPress={() => setShowDropdown({ ...showDropdown, experience: !showDropdown.experience })}
                            >
                                <Text style={styles.dropdownText}>{editedDetails.experience}</Text>
                                <Ionicons name="chevron-down" size={20} color="#718096" />
                            </TouchableOpacity>
                            {showDropdown.experience && (
                                <View style={styles.dropdownList}>
                                    {experienceOptions.map((option) => (
                                        <TouchableOpacity
                                            key={option}
                                            style={styles.dropdownItem}
                                            onPress={() => selectDropdownOption('experience', option)}
                                        >
                                            <Text style={styles.dropdownItemText}>{option}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}

                            <View style={styles.modalButtons}>
                                <TouchableOpacity style={styles.cancelButton} onPress={handleCancelEdit}>
                                    <Text style={styles.cancelButtonText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.saveButton} onPress={handleSaveDetails}>
                                    <Text style={styles.saveButtonText}>Save Changes</Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
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
    headerTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#1A202C',
        marginBottom: 24,
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
    detailsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2D3748',
    },
    measurementsTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#2D3748',
        marginTop: 16,
        marginBottom: 12,
    },
    detailsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    detailItem: {
        width: '48%',
        marginBottom: 16,
    },
    detailLabel: {
        fontSize: 12,
        color: '#718096',
        marginBottom: 4,
    },
    detailValue: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2D3748',
    },
    weightGraphPlaceholder: {
        height: 150,
        backgroundColor: '#EDF2F7',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    graphPlaceholderText: {
        fontSize: 16,
        color: '#A0AEC0',
    },
    weightStats: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    weightStatItem: {
        alignItems: 'center',
    },
    weightStatLabel: {
        fontSize: 12,
        color: '#718096',
        marginBottom: 4,
    },
    weightStatValue: {
        fontSize: 20,
        fontWeight: '700',
        color: '#2D3748',
    },
    weightChange: {
        color: '#48BB78',
    },
    streakHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    streakBadge: {
        backgroundColor: '#FED7D7',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    streakBadgeText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#C53030',
    },
    calendarGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    calendarDay: {
        width: '12%',
        aspectRatio: 1,
        backgroundColor: '#E2E8F0',
        borderRadius: 6,
        marginBottom: 8,
    },
    calendarDayActive: {
        backgroundColor: '#3182CE',
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2D3748',
        marginBottom: 12,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    summaryCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        width: '31%',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    summaryIcon: {
        fontSize: 24,
        marginBottom: 8,
    },
    summaryValue: {
        fontSize: 20,
        fontWeight: '700',
        color: '#2D3748',
        marginBottom: 4,
    },
    summaryLabel: {
        fontSize: 11,
        color: '#718096',
        textAlign: 'center',
    },
    workoutItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    statusDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#48BB78',
        marginRight: 12,
    },
    workoutInfo: {
        flex: 1,
    },
    workoutTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2D3748',
        marginBottom: 4,
    },
    workoutMeta: {
        fontSize: 13,
        color: '#A0AEC0',
    },
    bottomSpacer: {
        height: 20,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        maxHeight: '90%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#2D3748',
    },
    sectionLabel: {
        fontSize: 16,
        fontWeight: '700',
        color: '#2D3748',
        marginTop: 16,
        marginBottom: 8,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4A5568',
        marginBottom: 8,
        marginTop: 8,
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
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 24,
        marginBottom: 20,
    },
    cancelButton: {
        flex: 1,
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
        marginRight: 8,
        borderWidth: 2,
        borderColor: '#E2E8F0',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#4A5568',
    },
    saveButton: {
        flex: 1,
        backgroundColor: '#3182CE',
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
        marginLeft: 8,
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
});

export default ProgressScreen;
