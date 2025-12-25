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
    Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { api } from '../../services/api';

const WorkoutDetailScreen = ({ route, navigation }) => {
    const { workoutId, assignmentId, title, status } = route.params || {};
    const [loading, setLoading] = useState(true);
    const [workout, setWorkout] = useState(null);
    const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
    const [isCompleted, setIsCompleted] = useState(status === 'completed');

    // Helper to get consistent exercise ID
    const getExerciseId = (exercise, index) => {
        if (exercise && exercise.id) return exercise.id.toString();
        // Fallback to index if no ID, but ensure string
        return index.toString();
    };

    const [showDemoModal, setShowDemoModal] = useState(false);
    const [selectedExercise, setSelectedExercise] = useState(null);
    const [loggedSets, setLoggedSets] = useState({});
    const [currentLog, setCurrentLog] = useState({
        weight: '',
        reps: '',
        notes: '',
    });
    const [editingSet, setEditingSet] = useState(null); // { exerciseId, index }

    // Load Workout Data
    React.useEffect(() => {
        const loadData = async () => {
            if (!workoutId) return;
            try {
                const [data, logs] = await Promise.all([
                    api.getWorkoutDetail(workoutId),
                    api.getWorkoutLogs(assignmentId)
                ]);

                // Ensure data structure matches UI expectations
                setWorkout({
                    ...data,
                    day: data.metadata?.day || 1, // Fallback
                    week: data.metadata?.week || 1,
                    totalExercises: data.exercises?.length || 0,
                    // Ensure generic fields if missing
                    title: data.title || title,
                    exercises: data.exercises || []
                });

                console.log("WorkoutDetail: Fetched logs:", logs);

                // Process Logs
                if (logs && logs.length > 0) {
                    const logsByExercise = {};
                    logs.forEach(log => {
                        // Backend logs use 'exercise_id' (snake_case)
                        // Make sure we convert to string for consistency
                        const exId = log.exercise_id.toString();

                        if (!logsByExercise[exId]) {
                            logsByExercise[exId] = [];
                        }
                        // Transform snake_case log to camelCase for UI
                        logsByExercise[exId].push({
                            id: log.id, // Store ID for updates/deletion
                            setNumber: log.set_number,
                            weight: log.weight,
                            reps: log.reps,
                            notes: log.notes
                        });
                    });
                    setLoggedSets(logsByExercise);
                }

            } catch (error) {
                console.error("Failed to load workout:", error);
                alert("Failed to load workout details.");
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [workoutId, assignmentId]);

    const handleLogSet = async () => {
        if (!currentLog.weight || !currentLog.reps) {
            alert("Please enter weight and reps");
            return;
        }

        const currentExercise = workout.exercises[currentExerciseIndex];
        const exerciseId = getExerciseId(currentExercise, currentExerciseIndex);

        console.log("HandleLogSet: ExerciseId:", exerciseId, "EditingSet:", editingSet);

        try {
            // Check if we are in Edit Mode for THIS exercise
            if (editingSet && editingSet.exerciseId === exerciseId) {
                // UPDATE EXISTING SET (Server-Side Persisted)
                const index = editingSet.index;
                const updatedSets = [...(loggedSets[exerciseId] || [])];
                const oldSet = updatedSets[index];

                // Call API to Update (Upsert)
                // We pass the ID so the backend updates the record instead of creating new
                const response = await api.logWorkoutSet({
                    id: oldSet.id,
                    assignmentId,
                    exerciseId: exerciseId,
                    exerciseName: currentExercise.name,
                    setNumber: oldSet.setNumber,
                    weight: currentLog.weight,
                    reps: currentLog.reps,
                    notes: currentLog.notes
                });

                if (updatedSets[index]) {
                    updatedSets[index] = {
                        ...updatedSets[index],
                        id: response.id || oldSet.id, // Ensure ID is preserved/updated
                        weight: currentLog.weight,
                        reps: currentLog.reps,
                        notes: currentLog.notes
                    };

                    setLoggedSets({
                        ...loggedSets,
                        [exerciseId]: updatedSets
                    });
                    console.log("Updated set on server:", response);
                }

                setEditingSet(null);
                setCurrentLog({ weight: '', reps: '', notes: '' });

            } else {
                // CREATE NEW SET
                const setNumber = (loggedSets[exerciseId] || []).length + 1;

                // Call API for creation
                const response = await api.logWorkoutSet({
                    assignmentId,
                    exerciseId: exerciseId,
                    exerciseName: currentExercise.name,
                    setNumber,
                    weight: currentLog.weight,
                    reps: currentLog.reps,
                    notes: currentLog.notes
                });

                const newSet = {
                    id: response.id, // Capture ID
                    setNumber,
                    weight: currentLog.weight,
                    reps: currentLog.reps,
                    notes: currentLog.notes,
                };

                setLoggedSets({
                    ...loggedSets,
                    [exerciseId]: [...(loggedSets[exerciseId] || []), newSet],
                });

                setCurrentLog({ weight: '', reps: '', notes: '' });
                console.log("Created new set:", newSet);
            }

        } catch (error) {
            console.error("Failed to log set:", error);
            alert("Failed to save log. Please try again.");
        }
    };

    const handleDeleteSet = async (exerciseId, index) => {
        console.log("Deleting set:", exerciseId, index);
        try {
            const sets = loggedSets[exerciseId];
            if (!sets) return;

            const setToDelete = sets[index];

            // Call Backend to Delete
            if (setToDelete.id) {
                await api.deleteWorkoutLog(setToDelete.id);
                console.log("Deleted set from server with ID:", setToDelete.id);
            }

            // Local Delete
            const updatedSets = [...sets];
            updatedSets.splice(index, 1);

            setLoggedSets({
                ...loggedSets,
                [exerciseId]: updatedSets
            });

            // Exit edit mode if filtering the edited one
            if (editingSet && editingSet.exerciseId === exerciseId && editingSet.index === index) {
                setEditingSet(null);
                setCurrentLog({ weight: '', reps: '', notes: '' });
            }
        } catch (error) {
            console.error("Failed to delete set:", error);
            alert("Failed to delete set. Please try again.");
        }
    };

    const handleEditSet = (exerciseId, index) => {
        console.log("Editing set:", exerciseId, index);
        const set = loggedSets[exerciseId][index];
        setCurrentLog({
            weight: set.weight.toString(),
            reps: set.reps.toString(),
            notes: set.notes || ''
        });
        setEditingSet({ exerciseId, index });
    };

    // ... Navigation handlers ...
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
        if (isCompleted || status === 'completed') return 100;
        const totalSets = workout.exercises.reduce((sum, ex) => sum + ex.sets, 0);
        const completedSets = Object.values(loggedSets).reduce((sum, sets) => sum + sets.length, 0);
        return Math.round((completedSets / totalSets) * 100);
    };

    const handleCompleteWorkout = async () => {
        try {
            await api.completeWorkout(assignmentId);
            setIsCompleted(true);
            alert('Congratulations! Workout completed! 🎉');
            navigation.navigate('MainApp', { screen: 'WorkoutPlans' });
        } catch (error) {
            console.error("Failed to complete workout:", error);
            alert("Failed to mark workout as complete.");
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                    <Text>Loading workout...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!workout) return null;

    const currentExercise = workout.exercises[currentExerciseIndex];
    const currentExId = getExerciseId(currentExercise, currentExerciseIndex);

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>

                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Text style={styles.backButtonText}>← Back</Text>
                    </TouchableOpacity>
                    <View style={styles.headerTextContainer}>
                        <Text style={styles.headerTitle}>Today's Workout</Text>
                        <Text style={styles.headerSubtitle}>Day {workout.day} — Week {workout.week}</Text>
                    </View>
                </View>

                {/* Summary */}
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
                    </View>
                </View>

                {/* Current Exercise */}
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

                    <TouchableOpacity style={styles.demoButton} onPress={() => handleViewDemo(currentExercise)}>
                        <Text style={styles.demoButtonText}>View Demo Video</Text>
                    </TouchableOpacity>
                </View>

                {/* Logging Section */}
                <View style={[styles.loggingCard, editingSet && styles.loggingCardEditing]}>
                    <View style={styles.loggingHeaderRow}>
                        <Text style={styles.loggingTitle}>
                            {editingSet ? 'Update Set' : 'Log Your Set'}
                        </Text>
                        {editingSet && (
                            <TouchableOpacity onPress={() => {
                                setEditingSet(null);
                                setCurrentLog({ weight: '', reps: '', notes: '' });
                            }}>
                                <Text style={styles.cancelEditText}>Cancel</Text>
                            </TouchableOpacity>
                        )}
                    </View>

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

                    <TouchableOpacity
                        style={[styles.logButton, editingSet && styles.logButtonEditing]}
                        onPress={handleLogSet}
                    >
                        <Text style={styles.logButtonText}>
                            {editingSet ? 'Update Set' : 'Log Set'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Logged Sets */}
                {loggedSets[currentExId] && loggedSets[currentExId].length > 0 && (
                    <View style={styles.loggedSetsCard}>
                        <Text style={styles.loggedSetsTitle}>Completed Sets</Text>
                        {loggedSets[currentExId].map((set, index) => (
                            <View key={index} style={styles.setChip}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.setChipText}>
                                        ⭕ Set {set.setNumber}: {set.reps} reps — {set.weight}kg
                                    </Text>
                                    {set.notes && (
                                        <Text style={styles.setChipNotes}>Note: {set.notes}</Text>
                                    )}
                                </View>
                                <View style={styles.setActions}>
                                    <TouchableOpacity
                                        style={styles.actionBtn}
                                        onPress={() => handleEditSet(currentExId, index)}
                                        activeOpacity={0.7}
                                    >
                                        <Ionicons name="create-outline" size={20} color="#3182CE" />
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={styles.actionBtn}
                                        activeOpacity={0.7}
                                        onPress={() => handleDeleteSet(currentExId, index)}
                                    >
                                        <Ionicons name="trash-outline" size={20} color="#E53E3E" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}
                    </View>
                )}

                {/* Completion */}
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

            {/* Demo Modal */}
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
    loggingCardEditing: {
        borderColor: '#3182CE',
        borderWidth: 2,
    },
    loggingHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    cancelEditText: {
        color: '#E53E3E',
        fontWeight: '600',
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
    logButtonEditing: {
        backgroundColor: '#3182CE',
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
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    setActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionBtn: {
        marginLeft: 12,
        padding: 8, // Increased padding for better touch area
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
