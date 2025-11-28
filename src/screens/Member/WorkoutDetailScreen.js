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
} from 'react-native';

const WorkoutDetailScreen = ({ navigation }) => {
    const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
    const [showDemoModal, setShowDemoModal] = useState(false);
    const [selectedExercise, setSelectedExercise] = useState(null);
    const [loggedSets, setLoggedSets] = useState({});
    const [currentLog, setCurrentLog] = useState({
        weight: '',
        reps: '',
        notes: '',
    });

    // Sample workout data
    const workout = {
        title: 'Full Body Strength',
        day: 1,
        week: 1,
        totalExercises: 5,
        duration: '45 min',
        calories: '350 kcal',
        exercises: [
            {
                id: 1,
                name: 'Barbell Squats',
                sets: 4,
                reps: 12,
                restTime: '60 sec',
                instructions: [
                    'Stand with feet shoulder-width apart',
                    'Lower your body by bending knees',
                    'Keep back straight and chest up',
                    'Push through heels to return to start',
                ],
            },
            {
                id: 2,
                name: 'Bench Press',
                sets: 4,
                reps: 10,
                restTime: '90 sec',
                instructions: [
                    'Lie flat on bench',
                    'Grip bar slightly wider than shoulders',
                    'Lower bar to chest',
                    'Press up explosively',
                ],
            },
            {
                id: 3,
                name: 'Bent Over Rows',
                sets: 3,
                reps: 12,
                restTime: '60 sec',
                instructions: [
                    'Bend at hips with slight knee bend',
                    'Pull bar to lower chest',
                    'Squeeze shoulder blades together',
                    'Lower with control',
                ],
            },
            {
                id: 4,
                name: 'Overhead Press',
                sets: 3,
                reps: 10,
                restTime: '90 sec',
                instructions: [
                    'Stand with feet hip-width apart',
                    'Press bar overhead',
                    'Keep core tight',
                    'Lower to shoulders',
                ],
            },
            {
                id: 5,
                name: 'Deadlifts',
                sets: 3,
                reps: 8,
                restTime: '120 sec',
                instructions: [
                    'Stand with feet hip-width apart',
                    'Grip bar outside knees',
                    'Lift by extending hips and knees',
                    'Keep bar close to body',
                ],
            },
        ],
    };

    const currentExercise = workout.exercises[currentExerciseIndex];

    const handleLogSet = () => {
        if (!currentLog.weight || !currentLog.reps) {
            return;
        }

        const exerciseId = currentExercise.id;
        const existingSets = loggedSets[exerciseId] || [];
        const newSet = {
            setNumber: existingSets.length + 1,
            weight: currentLog.weight,
            reps: currentLog.reps,
            notes: currentLog.notes,
        };

        setLoggedSets({
            ...loggedSets,
            [exerciseId]: [...existingSets, newSet],
        });

        setCurrentLog({ weight: '', reps: '', notes: '' });
    };

    const handleViewDemo = (exercise) => {
        setSelectedExercise(exercise);
        setShowDemoModal(true);
    };

    const handlePreviousExercise = () => {
        if (currentExerciseIndex > 0) {
            setCurrentExerciseIndex(currentExerciseIndex - 1);
        }
    };

    const handleNextExercise = () => {
        if (currentExerciseIndex < workout.exercises.length - 1) {
            setCurrentExerciseIndex(currentExerciseIndex + 1);
        }
    };

    const calculateProgress = () => {
        const totalSets = workout.exercises.reduce((sum, ex) => sum + ex.sets, 0);
        const completedSets = Object.values(loggedSets).reduce(
            (sum, sets) => sum + sets.length,
            0
        );
        return Math.round((completedSets / totalSets) * 100);
    };

    const handleCompleteWorkout = () => {
        alert('Congratulations! Workout completed! 🎉');
        navigation.goBack();
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>

                {/* 1. Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Text style={styles.backButtonText}>← Back</Text>
                    </TouchableOpacity>
                    <View style={styles.headerTextContainer}>
                        <Text style={styles.headerTitle}>Today's Workout</Text>
                        <Text style={styles.headerSubtitle}>Day {workout.day} — Week {workout.week}</Text>
                    </View>
                </View>

                {/* 2. Workout Summary Card */}
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryTitle}>{workout.title}</Text>
                    <View style={styles.summaryRow}>
                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryValue}>{workout.totalExercises}</Text>
                            <Text style={styles.summaryLabel}>Exercises</Text>
                        </View>
                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryValue}>{workout.duration}</Text>
                            <Text style={styles.summaryLabel}>Duration</Text>
                        </View>
                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryValue}>{workout.calories}</Text>
                            <Text style={styles.summaryLabel}>Calories</Text>
                        </View>
                    </View>
                </View>

                {/* 3. Current Exercise Card */}
                <View style={styles.exerciseCard}>
                    <View style={styles.exerciseHeader}>
                        <Text style={styles.exerciseNumber}>
                            Exercise {currentExerciseIndex + 1}/{workout.totalExercises}
                        </Text>
                    </View>

                    <Text style={styles.exerciseName}>{currentExercise.name}</Text>

                    <View style={styles.exerciseThumbnail}>
                        <Text style={styles.thumbnailText}>📹</Text>
                    </View>

                    <View style={styles.exerciseStats}>
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>Sets × Reps</Text>
                            <Text style={styles.statValue}>
                                {currentExercise.sets} × {currentExercise.reps}
                            </Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>Rest Time</Text>
                            <Text style={styles.statValue}>{currentExercise.restTime}</Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={styles.demoButton}
                        onPress={() => handleViewDemo(currentExercise)}
                    >
                        <Text style={styles.demoButtonText}>View Demo Video</Text>
                    </TouchableOpacity>
                </View>

                {/* 4. Logging Section */}
                <View style={styles.loggingCard}>
                    <Text style={styles.loggingTitle}>Log Your Set</Text>

                    <View style={styles.inputRow}>
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Weight (kg)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="20"
                                keyboardType="numeric"
                                value={currentLog.weight}
                                onChangeText={(text) => setCurrentLog({ ...currentLog, weight: text })}
                            />
                        </View>
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Reps</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="12"
                                keyboardType="numeric"
                                value={currentLog.reps}
                                onChangeText={(text) => setCurrentLog({ ...currentLog, reps: text })}
                            />
                        </View>
                    </View>

                    <Text style={styles.inputLabel}>Notes (Optional)</Text>
                    <TextInput
                        style={[styles.input, styles.notesInput]}
                        placeholder="How did it feel?"
                        value={currentLog.notes}
                        onChangeText={(text) => setCurrentLog({ ...currentLog, notes: text })}
                    />

                    <TouchableOpacity style={styles.logButton} onPress={handleLogSet}>
                        <Text style={styles.logButtonText}>Log Set</Text>
                    </TouchableOpacity>
                </View>

                {/* 5. Logged Sets */}
                {loggedSets[currentExercise.id] && loggedSets[currentExercise.id].length > 0 && (
                    <View style={styles.loggedSetsCard}>
                        <Text style={styles.loggedSetsTitle}>Completed Sets</Text>
                        {loggedSets[currentExercise.id].map((set, index) => (
                            <View key={index} style={styles.setChip}>
                                <Text style={styles.setChipText}>
                                    ⭕ Set {set.setNumber}: {set.reps} reps — {set.weight}kg
                                </Text>
                                {set.notes && (
                                    <Text style={styles.setChipNotes}>Note: {set.notes}</Text>
                                )}
                            </View>
                        ))}
                    </View>
                )}

                {/* 6. Workout Completion Section */}
                <View style={styles.completionCard}>
                    <Text style={styles.completionTitle}>Workout Progress</Text>
                    <View style={styles.progressBarContainer}>
                        <View style={[styles.progressBar, { width: `${calculateProgress()}%` }]} />
                    </View>
                    <Text style={styles.progressText}>{calculateProgress()}% Complete</Text>

                    <TouchableOpacity
                        style={styles.completeButton}
                        onPress={handleCompleteWorkout}
                    >
                        <Text style={styles.completeButtonText}>Complete Workout</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.bottomSpacer} />
            </ScrollView>

            {/* 7. Sticky Bottom Action Bar */}
            <View style={styles.bottomBar}>
                <TouchableOpacity
                    style={[styles.navButton, currentExerciseIndex === 0 && styles.navButtonDisabled]}
                    onPress={handlePreviousExercise}
                    disabled={currentExerciseIndex === 0}
                >
                    <Text style={styles.navButtonText}>← Previous</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        styles.navButton,
                        currentExerciseIndex === workout.exercises.length - 1 && styles.navButtonDisabled,
                    ]}
                    onPress={handleNextExercise}
                    disabled={currentExerciseIndex === workout.exercises.length - 1}
                >
                    <Text style={styles.navButtonText}>Next →</Text>
                </TouchableOpacity>
            </View>

            {/* 8. Demo Video Modal */}
            <Modal
                visible={showDemoModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowDemoModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <TouchableOpacity
                            style={styles.modalCloseButton}
                            onPress={() => setShowDemoModal(false)}
                        >
                            <Text style={styles.modalCloseText}>✕ Close</Text>
                        </TouchableOpacity>

                        {selectedExercise && (
                            <>
                                <Text style={styles.modalTitle}>{selectedExercise.name}</Text>

                                <View style={styles.videoPlaceholder}>
                                    <Text style={styles.videoPlaceholderText}>📹 Video Demo Placeholder</Text>
                                </View>

                                <View style={styles.instructionsContainer}>
                                    <Text style={styles.instructionsTitle}>Instructions:</Text>
                                    {selectedExercise.instructions.map((instruction, index) => (
                                        <Text key={index} style={styles.instructionText}>
                                            {index + 1}. {instruction}
                                        </Text>
                                    ))}
                                </View>
                            </>
                        )}
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
        marginBottom: 20,
    },
    backButton: {
        marginBottom: 8,
    },
    backButtonText: {
        fontSize: 16,
        color: '#3182CE',
        fontWeight: '600',
    },
    headerTextContainer: {
        marginTop: 8,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#1A202C',
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#718096',
        marginTop: 4,
    },
    summaryCard: {
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
    summaryTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#2D3748',
        marginBottom: 16,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    summaryItem: {
        alignItems: 'center',
    },
    summaryValue: {
        fontSize: 24,
        fontWeight: '700',
        color: '#3182CE',
    },
    summaryLabel: {
        fontSize: 12,
        color: '#718096',
        marginTop: 4,
    },
    exerciseCard: {
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
    exerciseHeader: {
        marginBottom: 8,
    },
    exerciseNumber: {
        fontSize: 12,
        color: '#718096',
        fontWeight: '600',
    },
    exerciseName: {
        fontSize: 22,
        fontWeight: '700',
        color: '#2D3748',
        marginBottom: 16,
    },
    exerciseThumbnail: {
        height: 120,
        backgroundColor: '#EDF2F7',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    thumbnailText: {
        fontSize: 48,
    },
    exerciseStats: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 16,
        paddingVertical: 12,
        backgroundColor: '#F7FAFC',
        borderRadius: 8,
    },
    statItem: {
        alignItems: 'center',
    },
    statLabel: {
        fontSize: 12,
        color: '#718096',
        marginBottom: 4,
    },
    statValue: {
        fontSize: 16,
        fontWeight: '700',
        color: '#2D3748',
    },
    demoButton: {
        backgroundColor: '#3182CE',
        borderRadius: 10,
        paddingVertical: 12,
        alignItems: 'center',
    },
    demoButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    loggingCard: {
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
    loggingTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2D3748',
        marginBottom: 16,
    },
    inputRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    inputContainer: {
        width: '48%',
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4A5568',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#EDF2F7',
        borderRadius: 10,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        color: '#2D3748',
    },
    notesInput: {
        marginBottom: 16,
    },
    logButton: {
        backgroundColor: '#48BB78',
        borderRadius: 10,
        paddingVertical: 14,
        alignItems: 'center',
    },
    logButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    loggedSetsCard: {
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
    loggedSetsTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#2D3748',
        marginBottom: 12,
    },
    setChip: {
        backgroundColor: '#EBF8FF',
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
    },
    setChipText: {
        fontSize: 14,
        color: '#2D3748',
        fontWeight: '600',
    },
    setChipNotes: {
        fontSize: 12,
        color: '#718096',
        marginTop: 4,
    },
    completionCard: {
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
    completionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2D3748',
        marginBottom: 12,
    },
    progressBarContainer: {
        height: 12,
        backgroundColor: '#E2E8F0',
        borderRadius: 6,
        overflow: 'hidden',
        marginBottom: 8,
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#48BB78',
        borderRadius: 6,
    },
    progressText: {
        fontSize: 14,
        color: '#718096',
        textAlign: 'center',
        marginBottom: 16,
    },
    completeButton: {
        backgroundColor: '#3182CE',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
    },
    completeButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
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
    navButton: {
        backgroundColor: '#3182CE',
        borderRadius: 10,
        paddingVertical: 12,
        paddingHorizontal: 24,
        minWidth: 120,
        alignItems: 'center',
    },
    navButtonDisabled: {
        backgroundColor: '#CBD5E0',
    },
    navButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 24,
        width: '100%',
        maxHeight: '80%',
    },
    modalCloseButton: {
        alignSelf: 'flex-end',
        marginBottom: 12,
    },
    modalCloseText: {
        fontSize: 16,
        color: '#718096',
        fontWeight: '600',
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#2D3748',
        marginBottom: 16,
    },
    videoPlaceholder: {
        height: 200,
        backgroundColor: '#EDF2F7',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    videoPlaceholderText: {
        fontSize: 18,
        color: '#718096',
    },
    instructionsContainer: {
        marginTop: 8,
    },
    instructionsTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2D3748',
        marginBottom: 12,
    },
    instructionText: {
        fontSize: 14,
        color: '#4A5568',
        marginBottom: 8,
        lineHeight: 20,
    },
});

export default WorkoutDetailScreen;
