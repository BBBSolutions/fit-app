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

    // Dynamic Sets & History
    const [setCount, setSetCount] = useState(0);
    const [historyLogs, setHistoryLogs] = useState([]);

    // Helper to get consistent exercise ID
    const getExerciseId = (exercise, index) => {
        if (exercise && exercise.id) return exercise.id.toString();
        // Fallback to index if no ID, but ensure string
        return index.toString();
    };

    const [showDemoModal, setShowDemoModal] = useState(false);
    const [selectedExercise, setSelectedExercise] = useState(null);
    const [loggedSets, setLoggedSets] = useState({});

    // Track inputs for each set row: { [setIndex]: { weight: '10', reps: '12', notes: '' } }
    const [inputValues, setInputValues] = useState({});

    // Effect to reset dynamic set count when exercise changes OR logs are loaded
    React.useEffect(() => {
        if (workout && workout.exercises) {
            const ex = workout.exercises[currentExerciseIndex];
            const currentExId = getExerciseId(ex, currentExerciseIndex);

            // Calculate required sets based on Plan vs Logs
            const planSets = ex.sets || 3;
            const existingLogs = loggedSets[currentExId] || [];
            const maxLoggedSetNumber = existingLogs.length > 0
                ? Math.max(...existingLogs.map(l => l.setNumber))
                : 0;

            // Set count should be at least the plan, or the max logged set if higher.
            setSetCount(Math.max(planSets, maxLoggedSetNumber));

            // Fetch History (Exclude current assignment)
            if (assignmentId) {
                // Check ID Validity or Fallback to Name
                const hasValidId = currentExId && currentExId.length > 5;
                const hasName = currentExercise && currentExercise.name;

                if (hasValidId || hasName) {
                    console.log(`[WorkoutDetail] Fetching history. ID: ${hasValidId ? currentExId : 'N/A'}, Name: ${hasName ? currentExercise.name : 'N/A'}`);
                    // Pass ID (if valid) and Name (always good as backup/primary)
                    // Note: api.js signature updated to: (id, assignmentId, name)
                    api.getExerciseHistory(hasValidId ? currentExId : null, assignmentId, currentExercise.name)
                        .then(logs => {
                            console.log("[WorkoutDetail] History Logs Fetched:", logs);
                            setHistoryLogs(logs || []);
                        })
                        .catch(err => console.log("[WorkoutDetail] Failed to fetch history:", err));
                } else {
                    console.log(`[WorkoutDetail] Skipping history fetch. No valid ID or Name.`);
                    setHistoryLogs([]);
                }
            }
        }
    }, [currentExerciseIndex, workout, loggedSets, assignmentId]); // Added assignmentId dependency



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

    // Handlers removed (inline logic used now)


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

    const updatePlanSets = (newSetCount) => {
        if (!workout) return;

        // Optimistic UI Update
        const updatedExercises = [...workout.exercises];
        updatedExercises[currentExerciseIndex] = {
            ...updatedExercises[currentExerciseIndex],
            sets: newSetCount
        };
        const updatedWorkout = { ...workout, exercises: updatedExercises };
        setWorkout(updatedWorkout);

        // API Update
        api.updateWorkout(workout.id, { exercises: updatedExercises })
            .then(() => console.log("Plan updated successfully"))
            .catch(err => console.log("Plan update failed (likely unauthorized if not owner)", err));
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
                                {setCount} × {currentExercise.reps}
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

                {/* Dynamic Logging Table */}
                <View style={styles.loggingCard}>
                    {/* Table Header */}
                    <View style={styles.tableHeader}>
                        <Text style={[styles.colHeader, { flex: 0.8, textAlign: 'center' }]}>SET</Text>
                        {historyLogs.length > 0 && <Text style={[styles.colHeader, { flex: 2, textAlign: 'center' }]}>PREV</Text>}
                        <Text style={[styles.colHeader, { flex: 2, textAlign: 'center' }]}>KG</Text>
                        <Text style={[styles.colHeader, { flex: 2, textAlign: 'center' }]}>REPS</Text>
                        <Text style={[styles.colHeader, { flex: 1, textAlign: 'center' }]}>DONE</Text>
                    </View>

                    {/* Rows */}
                    {Array.from({ length: setCount }).map((_, i) => {
                        const index = i;
                        const setNumber = index + 1;
                        // Find existing log for this set number
                        const existingLog = (loggedSets[currentExId] || []).find(l => l.setNumber === setNumber);
                        const isLogged = !!existingLog;

                        // History match
                        // Debugging structure if first row
                        if (index === 0 && historyLogs.length > 0) {
                            console.log("[WorkoutDetail] First History Item:", historyLogs[0]);
                        }

                        const historyLog = historyLogs.find(l => l.set_number == setNumber); // Loose comparison
                        const prevText = historyLog ? `${historyLog.weight}kg x ${historyLog.reps}` : '-';
                        const placeholderWeight = historyLog ? String(historyLog.weight) : '0';
                        const placeholderReps = historyLog ? String(historyLog.reps) : '0';

                        // Use local input or fallback to existing log or empty
                        const currentInput = inputValues[index] || {};
                        const weightVal = currentInput.weight !== undefined ? currentInput.weight : (existingLog ? String(existingLog.weight) : '');
                        const repsVal = currentInput.reps !== undefined ? currentInput.reps : (existingLog ? String(existingLog.reps) : '');

                        const handleInputChange = (field, value) => {
                            setInputValues(prev => ({
                                ...prev,
                                [index]: { ...prev[index], [field]: value }
                            }));
                        };

                        const onLogSet = async () => {
                            if (!weightVal || !repsVal) {
                                Alert.alert("Missing Input", "Please enter weight and reps.");
                                return;
                            }
                            try {
                                const response = await api.logWorkoutSet({
                                    id: existingLog?.id,
                                    assignmentId,
                                    exerciseId: currentExId,
                                    exerciseName: currentExercise.name,
                                    setNumber: setNumber,
                                    weight: weightVal,
                                    reps: repsVal,
                                    notes: currentInput.notes || existingLog?.notes || ''
                                });

                                const newLog = {
                                    id: response.id || existingLog?.id,
                                    setNumber,
                                    weight: weightVal,
                                    reps: repsVal,
                                    notes: response.notes
                                };

                                setLoggedSets(prev => {
                                    const currentLogs = [...(prev[currentExId] || [])];
                                    const existingLogIndex = currentLogs.findIndex(l => l.setNumber === setNumber);
                                    if (existingLogIndex >= 0) currentLogs[existingLogIndex] = newLog;
                                    else currentLogs.push(newLog);
                                    return { ...prev, [currentExId]: currentLogs };
                                });
                            } catch (err) {
                                Alert.alert("Error", "Failed to log set.");
                            }
                        };

                        const onDeleteRow = async (setNumToDelete) => {
                            try {
                                // 1. Handle Logged Data
                                if (existingLog && existingLog.id) {
                                    // Delete this log
                                    await api.deleteWorkoutLog(existingLog.id);

                                    // 2. Shift subsequent logs in Backend (re-numbering)
                                    const subsequentLogs = (loggedSets[currentExId] || []).filter(l => l.setNumber > setNumToDelete);

                                    for (const log of subsequentLogs) {
                                        // Update log set_number - 1
                                        await api.logWorkoutSet({
                                            id: log.id,
                                            assignmentId,
                                            exerciseId: currentExId,
                                            exerciseName: currentExercise.name,
                                            setNumber: log.setNumber - 1, // Shift down
                                            weight: log.weight,
                                            reps: log.reps,
                                            notes: log.notes
                                        });
                                    }

                                    // Update Local State (Refetch or Manual Shift)
                                    // Manual Shift is faster for UI
                                    setLoggedSets(prev => {
                                        const oldLogs = prev[currentExId] || [];
                                        const newLogs = oldLogs
                                            .filter(l => l.id !== existingLog.id) // Remove deleted
                                            .map(l => l.setNumber > setNumToDelete ? { ...l, setNumber: l.setNumber - 1 } : l); // Shift others
                                        return { ...prev, [currentExId]: newLogs };
                                    });
                                }

                                // 3. Handle Inputs (Shift Up)
                                setInputValues(prev => {
                                    const newInputs = {};
                                    Object.keys(prev).forEach(key => {
                                        const idx = parseInt(key);
                                        if (idx < index) {
                                            newInputs[idx] = prev[idx]; // Keep before
                                        } else if (idx > index) {
                                            newInputs[idx - 1] = prev[idx]; // Shift after
                                        }
                                        // index is dropped
                                    });
                                    return newInputs;
                                });

                                // 4. Reduce Row Count
                                const newCount = setCount > 0 ? setCount - 1 : 0;
                                setSetCount(newCount);

                                // 5. Update PLAN (Persistent)
                                updatePlanSets(newCount);

                            } catch (err) {
                                console.error("Failed to delete log/row", err);
                                Alert.alert("Error", "Failed to delete row.");
                            }
                        };

                        return (
                            <View key={index} style={[styles.setRow, isLogged && styles.setRowLogged]}>
                                <Text style={styles.setNumber}>{setNumber}</Text>

                                {historyLogs.length > 0 && (
                                    <Text style={[styles.setNumber, { flex: 2, color: '#A0AEC0', fontWeight: 'normal' }]}>
                                        {prevText}
                                    </Text>
                                )}

                                <View style={styles.inputWrapper}>
                                    <TextInput
                                        style={styles.cellInput}
                                        keyboardType="numeric"
                                        placeholder={placeholderWeight}
                                        placeholderTextColor="#A0AEC0"
                                        value={weightVal}
                                        onChangeText={t => handleInputChange('weight', t)}
                                    />
                                </View>

                                <View style={styles.inputWrapper}>
                                    <TextInput
                                        style={styles.cellInput}
                                        keyboardType="numeric"
                                        placeholder={placeholderReps}
                                        placeholderTextColor="#A0AEC0"
                                        value={repsVal}
                                        onChangeText={t => handleInputChange('reps', t)}
                                    />
                                </View>

                                {/* Action Buttons */}
                                <View style={styles.rowActions}>
                                    <TouchableOpacity
                                        style={styles.iconBtn}
                                        onPress={() => onDeleteRow(setNumber)}
                                    >
                                        <Ionicons name="trash-outline" size={18} color="#E53E3E" />
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[styles.checkBtn, isLogged && styles.checkBtnLogged]}
                                        onPress={onLogSet}
                                    >
                                        <Ionicons name="checkmark" size={18} color={isLogged ? "#FFF" : "#CBD5E0"} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        );
                    })}

                    {/* Add Set Button Only */}
                    <View style={styles.setControls}>
                        <TouchableOpacity style={styles.addSetBtn} onPress={() => {
                            const newCount = setCount + 1;
                            setSetCount(newCount);
                            updatePlanSets(newCount);
                        }}>
                            <Text style={styles.addSetText}>+ Add Set</Text>
                        </TouchableOpacity>
                    </View>
                </View>

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
    // Styles for Table
    tableHeader: {
        flexDirection: 'row',
        marginBottom: 10,
        paddingHorizontal: 10,
    },
    colHeader: {
        fontSize: 12,
        fontWeight: '700',
        color: '#A0AEC0',
        letterSpacing: 0.5,
    },
    setRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        backgroundColor: '#F7FAFC',
        borderRadius: 12,
        padding: 5, // Tight padding
    },
    setRowLogged: {
        backgroundColor: '#F0FFF4', // Light green bg
    },
    setNumber: {
        flex: 0.8,
        fontSize: 14,
        fontWeight: '700',
        color: '#4A5568',
        textAlign: 'center',
    },
    inputWrapper: {
        flex: 2,
        alignItems: 'center',
    },
    cellInput: {
        backgroundColor: '#fff',
        borderRadius: 8,
        width: '90%',
        textAlign: 'center',
        paddingVertical: 8,
        fontSize: 16,
        color: '#2D3748',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    checkBtn: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#E2E8F0', // Slightly darker check bg
        borderRadius: 8,
        height: 32,
        width: 32,
    },
    checkBtnLogged: {
        backgroundColor: '#48BB78',
    },
    rowActions: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    iconBtn: {
        padding: 5,
        marginRight: 8,
    },
    setControls: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 16,
    },
    addSetBtn: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        backgroundColor: '#EBF8FF',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#BEE3F8',
        marginHorizontal: 8,
    },
    addSetText: {
        color: '#3182CE',
        fontWeight: '600',
        fontSize: 14,
    },
    removeSetBtn: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        backgroundColor: '#FFF5F5',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#FED7D7',
        marginHorizontal: 8,
    },
    removeSetText: {
        color: '#E53E3E',
        fontWeight: '600',
        fontSize: 14,
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
