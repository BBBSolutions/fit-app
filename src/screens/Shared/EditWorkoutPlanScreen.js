import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    SafeAreaView,
    Modal,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const EditWorkoutPlanScreen = ({ navigation }) => {
    const [workoutInfo, setWorkoutInfo] = useState({
        title: 'Full Body Strength',
        day: 1,
        week: 1,
        duration: '45 min',
    });

    const [exercises, setExercises] = useState([
        {
            id: 1,
            name: 'Barbell Squats',
            sets: '4',
            reps: '12',
            restTime: '60',
            equipment: 'Barbell',
        },
        {
            id: 2,
            name: 'Bench Press',
            sets: '4',
            reps: '10',
            restTime: '90',
            equipment: 'Barbell',
        },
        {
            id: 3,
            name: 'Bent Over Rows',
            sets: '3',
            reps: '12',
            restTime: '60',
            equipment: 'Barbell',
        },
    ]);

    const [trainerNotes, setTrainerNotes] = useState('Focus on proper form. Increase weight gradually.');
    const [showExerciseModal, setShowExerciseModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Sample exercise library
    const exerciseLibrary = [
        'Deadlifts',
        'Overhead Press',
        'Pull-ups',
        'Lunges',
        'Leg Press',
        'Dumbbell Curls',
        'Tricep Dips',
        'Plank',
        'Mountain Climbers',
        'Burpees',
    ];

    const updateExercise = (id, field, value) => {
        setExercises(
            exercises.map((ex) =>
                ex.id === id ? { ...ex, [field]: value } : ex
            )
        );
    };

    const deleteExercise = (id) => {
        Alert.alert(
            'Delete Exercise',
            'Are you sure you want to delete this exercise?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => setExercises(exercises.filter((ex) => ex.id !== id)),
                },
            ]
        );
    };

    const addExercise = (exerciseName) => {
        const newExercise = {
            id: Date.now(),
            name: exerciseName,
            sets: '3',
            reps: '10',
            restTime: '60',
            equipment: 'Bodyweight',
        };
        setExercises([...exercises, newExercise]);
        setShowExerciseModal(false);
        setSearchQuery('');
    };

    const handleSave = () => {
        Alert.alert('Success', 'Workout plan saved successfully!');
        navigation.goBack();
    };

    const handleDiscard = () => {
        Alert.alert(
            'Discard Changes',
            'Are you sure you want to discard all changes?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Discard',
                    style: 'destructive',
                    onPress: () => navigation.goBack(),
                },
            ]
        );
    };

    const filteredExercises = exerciseLibrary.filter((ex) =>
        ex.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>

                {/* 1. Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#2D3748" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Edit Workout Plan</Text>
                    <View style={styles.headerSpacer} />
                </View>

                {/* 2. Workout Info Card */}
                <View style={styles.infoCard}>
                    <Text style={styles.workoutTitle}>{workoutInfo.title}</Text>
                    <View style={styles.infoRow}>
                        <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>Day & Week</Text>
                            <Text style={styles.infoValue}>Day {workoutInfo.day} - Week {workoutInfo.week}</Text>
                        </View>
                        <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>Exercises</Text>
                            <Text style={styles.infoValue}>{exercises.length}</Text>
                        </View>
                        <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>Duration</Text>
                            <Text style={styles.infoValue}>{workoutInfo.duration}</Text>
                        </View>
                    </View>
                </View>

                {/* 3. Exercise List (Editable) */}
                <Text style={styles.sectionTitle}>Exercises</Text>
                {exercises.map((exercise, index) => (
                    <View key={exercise.id} style={styles.exerciseCard}>
                        <View style={styles.exerciseHeader}>
                            <Text style={styles.exerciseNumber}>Exercise {index + 1}</Text>
                            <TouchableOpacity onPress={() => deleteExercise(exercise.id)}>
                                <Ionicons name="trash-outline" size={20} color="#E53E3E" />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.inputLabel}>Exercise Name</Text>
                        <TextInput
                            style={styles.input}
                            value={exercise.name}
                            onChangeText={(text) => updateExercise(exercise.id, 'name', text)}
                        />

                        <View style={styles.inputRow}>
                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>Sets</Text>
                                <TextInput
                                    style={styles.input}
                                    value={exercise.sets}
                                    onChangeText={(text) => updateExercise(exercise.id, 'sets', text)}
                                    keyboardType="numeric"
                                />
                            </View>
                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>Reps</Text>
                                <TextInput
                                    style={styles.input}
                                    value={exercise.reps}
                                    onChangeText={(text) => updateExercise(exercise.id, 'reps', text)}
                                    keyboardType="numeric"
                                />
                            </View>
                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>Rest (sec)</Text>
                                <TextInput
                                    style={styles.input}
                                    value={exercise.restTime}
                                    onChangeText={(text) => updateExercise(exercise.id, 'restTime', text)}
                                    keyboardType="numeric"
                                />
                            </View>
                        </View>

                        <Text style={styles.inputLabel}>Equipment</Text>
                        <TextInput
                            style={styles.input}
                            value={exercise.equipment}
                            onChangeText={(text) => updateExercise(exercise.id, 'equipment', text)}
                        />

                        <TouchableOpacity style={styles.replaceButton}>
                            <Ionicons name="swap-horizontal" size={16} color="#3182CE" />
                            <Text style={styles.replaceButtonText}>Replace Exercise</Text>
                        </TouchableOpacity>
                    </View>
                ))}

                {/* 4. Add New Exercise Section */}
                <TouchableOpacity
                    style={styles.addExerciseButton}
                    onPress={() => setShowExerciseModal(true)}
                >
                    <Ionicons name="add-circle" size={24} color="#3182CE" />
                    <Text style={styles.addExerciseText}>Add Exercise</Text>
                </TouchableOpacity>

                {/* 5. Trainer Notes */}
                <Text style={styles.sectionTitle}>Trainer Notes</Text>
                <TextInput
                    style={styles.notesInput}
                    placeholder="Trainer Notes or Instructions"
                    value={trainerNotes}
                    onChangeText={setTrainerNotes}
                    multiline
                    numberOfLines={4}
                />

                <View style={styles.bottomSpacer} />
            </ScrollView>

            {/* 6. Save/Discard Buttons */}
            <View style={styles.bottomBar}>
                <TouchableOpacity style={styles.discardButton} onPress={handleDiscard}>
                    <Text style={styles.discardButtonText}>Discard</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                    <Text style={styles.saveButtonText}>Save Changes</Text>
                </TouchableOpacity>
            </View>

            {/* Exercise Library Modal */}
            <Modal
                visible={showExerciseModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowExerciseModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Exercise Library</Text>
                            <TouchableOpacity onPress={() => setShowExerciseModal(false)}>
                                <Ionicons name="close" size={24} color="#2D3748" />
                            </TouchableOpacity>
                        </View>

                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search Exercise Library"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />

                        <ScrollView style={styles.exerciseList}>
                            {filteredExercises.map((exercise, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={styles.exerciseListItem}
                                    onPress={() => addExercise(exercise)}
                                >
                                    <Text style={styles.exerciseListText}>{exercise}</Text>
                                    <Ionicons name="add" size={20} color="#3182CE" />
                                </TouchableOpacity>
                            ))}
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#2D3748',
    },
    headerSpacer: {
        width: 40,
    },
    infoCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    workoutTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#2D3748',
        marginBottom: 16,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    infoItem: {
        alignItems: 'center',
    },
    infoLabel: {
        fontSize: 12,
        color: '#718096',
        marginBottom: 4,
    },
    infoValue: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2D3748',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2D3748',
        marginBottom: 12,
    },
    exerciseCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    exerciseHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    exerciseNumber: {
        fontSize: 14,
        fontWeight: '600',
        color: '#718096',
    },
    inputLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#4A5568',
        marginBottom: 6,
        marginTop: 8,
    },
    input: {
        backgroundColor: '#F7FAFC',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 15,
        color: '#2D3748',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    inputRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    inputContainer: {
        width: '31%',
    },
    replaceButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        marginTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
    },
    replaceButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#3182CE',
        marginLeft: 6,
    },
    addExerciseButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        paddingVertical: 16,
        marginBottom: 24,
        borderWidth: 2,
        borderColor: '#3182CE',
        borderStyle: 'dashed',
    },
    addExerciseText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#3182CE',
        marginLeft: 8,
    },
    notesInput: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        fontSize: 15,
        color: '#2D3748',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        minHeight: 100,
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
        flexDirection: 'row',
        justifyContent: 'space-between',
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
    discardButton: {
        flex: 1,
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
        marginRight: 8,
        borderWidth: 2,
        borderColor: '#E2E8F0',
    },
    discardButtonText: {
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
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#2D3748',
    },
    searchInput: {
        backgroundColor: '#F7FAFC',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 15,
        color: '#2D3748',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 16,
    },
    exerciseList: {
        maxHeight: 400,
    },
    exerciseListItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        backgroundColor: '#F7FAFC',
        borderRadius: 8,
        marginBottom: 8,
    },
    exerciseListText: {
        fontSize: 15,
        color: '#2D3748',
        fontWeight: '500',
    },
});

export default EditWorkoutPlanScreen;
