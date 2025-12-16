import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';
import { useFocusEffect } from '@react-navigation/native';

const WorkoutPlansScreen = ({ navigation }) => {
    const [selectedWeek, setSelectedWeek] = useState(1);

    // Sample workout plan data
    // Initial empty state
    const [weeklyPlan, setWeeklyPlan] = useState([]);
    const [currentTrainerId, setCurrentTrainerId] = useState(null);

    // Backend Integration
    useFocusEffect(
        React.useCallback(() => {
            // Pass null to let backend infer ID from auth token
            api.getAssignedWorkouts('')
                .then(data => {
                    if (data && data.length > 0) {
                        // Map assignments to workout structure expected by UI
                        // and add a synthetic 'day' if missing
                        const formattedPlan = data.map((assignment, index) => {
                            const w = assignment.workout || {};
                            return {
                                ...w,
                                id: w.id, // Ensure ID is top level
                                assignmentId: assignment.id,
                                day: w.metadata?.day || `Workout ${index + 1}`,
                                status: assignment.status,
                                trainerId: assignment.trainer_id // Store trainer ID
                            };
                        });
                        setWeeklyPlan(formattedPlan);

                        // Find Trainer ID from first assignment
                        if (formattedPlan.length > 0 && formattedPlan[0].trainerId && !currentTrainerId) {
                            setCurrentTrainerId(formattedPlan[0].trainerId);
                        }

                        // Update summary based on real data
                        setPlanSummary(prev => ({
                            ...prev,
                            totalWorkouts: formattedPlan.length,
                            totalMinutes: formattedPlan.reduce((acc, curr) => acc + (parseInt(curr.duration) || 0), 0),
                            trainerNotes: "Keep up the great work! Your new plan is ready."
                        }));
                    } else {
                        setWeeklyPlan([]);
                        setPlanSummary(prev => ({
                            ...prev,
                            totalWorkouts: 0,
                            trainerNotes: "No workouts assigned yet. Ask your trainer for a plan!"
                        }));
                    }
                })
                .catch(err => console.error("Failed to fetch assigned workouts:", err));
        }, [])
    );

    // Summary Data (Dynamic)
    const [planSummary, setPlanSummary] = useState({
        totalWorkouts: 0,
        totalCalories: 0,
        totalMinutes: 0,
        trainerNotes: 'Complete workouts to see your weekly summary here.',
    });

    const handleViewDetails = (day) => {
        // Navigate to WorkoutDetailScreen
        navigation.navigate('WorkoutDetail');
    };

    const handleEditPlan = () => {
        // Navigate to EditWorkoutPlanScreen
        navigation.navigate('EditWorkoutPlan');
    };

    const handleRefreshPlan = () => {
        console.log('Refresh AI Plan');
    };

    const handleMessageTrainer = () => {
        // Navigate to Messages tab
        if (currentTrainerId) {
            navigation.navigate('Messages', { trainerId: currentTrainerId });
        } else {
            // Fallback or show alert
            console.log("No trainer ID found from assignments");
            navigation.navigate('Messages'); // Will show empty state
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>

                {/* 1. Header */}
                <Text style={styles.headerTitle}>Your Workout Plan</Text>

                {/* 2. Week Selector */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.weekSelector}
                    contentContainerStyle={styles.weekSelectorContent}
                >
                    {[1, 2, 3, 4].map((week) => (
                        <TouchableOpacity
                            key={week}
                            style={[
                                styles.weekButton,
                                selectedWeek === week && styles.weekButtonActive,
                            ]}
                            onPress={() => setSelectedWeek(week)}
                        >
                            <Text
                                style={[
                                    styles.weekButtonText,
                                    selectedWeek === week && styles.weekButtonTextActive,
                                ]}
                            >
                                Week {week}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* 3. Weekly Plan List */}
                <View style={styles.section}>
                    {weeklyPlan.map((workout, index) => (
                        <View key={index} style={styles.workoutCard}>
                            <View style={styles.workoutHeader}>
                                <View>
                                    <Text style={styles.dayName}>{workout.day}</Text>
                                    <Text style={styles.workoutTitle}>{workout.title}</Text>
                                </View>
                                <View style={styles.durationBadge}>
                                    <Ionicons name="time-outline" size={14} color="#718096" />
                                    <Text style={styles.durationText}>{workout.duration}</Text>
                                </View>
                            </View>

                            <View style={styles.exercisePreview}>
                                {workout.exercises && workout.exercises.map((exercise, idx) => (
                                    <View key={idx} style={styles.exerciseItem}>
                                        <View style={styles.exerciseDot} />
                                        <Text style={styles.exerciseText}>
                                            {typeof exercise === 'string'
                                                ? exercise
                                                : `${exercise.name}${exercise.sets ? ` (${exercise.sets} x ${exercise.reps})` : (exercise.duration ? ` (${exercise.duration})` : '')}`}
                                        </Text>
                                    </View>
                                ))}
                            </View>

                            {workout.duration !== 'Rest' && (
                                <TouchableOpacity
                                    style={styles.viewDetailsButton}
                                    onPress={() => handleViewDetails(workout.day)}
                                >
                                    <Text style={styles.viewDetailsText}>View Details</Text>
                                    <Ionicons name="arrow-forward" size={16} color="#3182CE" />
                                </TouchableOpacity>
                            )}
                        </View>
                    ))}
                </View>

                {/* 4. Plan Summary Box */}
                <View style={styles.summaryBox}>
                    <Text style={styles.summaryTitle}>Weekly Summary</Text>

                    <View style={styles.summaryStats}>
                        <View style={styles.summaryStatItem}>
                            <Text style={styles.summaryStatValue}>{planSummary.totalWorkouts}</Text>
                            <Text style={styles.summaryStatLabel}>Workouts</Text>
                        </View>
                        <View style={styles.summaryStatItem}>
                            <Text style={styles.summaryStatValue}>{planSummary.totalCalories}</Text>
                            <Text style={styles.summaryStatLabel}>Calories</Text>
                        </View>
                        <View style={styles.summaryStatItem}>
                            <Text style={styles.summaryStatValue}>{planSummary.totalMinutes}</Text>
                            <Text style={styles.summaryStatLabel}>Minutes</Text>
                        </View>
                    </View>

                    <View style={styles.trainerNotesSection}>
                        <Text style={styles.trainerNotesTitle}>Trainer Notes</Text>
                        <Text style={styles.trainerNotesText}>{planSummary.trainerNotes}</Text>
                    </View>
                </View>

                <View style={styles.bottomSpacer} />
            </ScrollView>

            {/* 5. Floating Action Buttons */}
            <View style={styles.fabContainer}>
                <TouchableOpacity style={styles.fab} onPress={handleEditPlan}>
                    <Ionicons name="create" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.fab, styles.fabSecondary]} onPress={handleRefreshPlan}>
                    <Ionicons name="refresh" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.fab, styles.fabTertiary]} onPress={handleMessageTrainer}>
                    <Ionicons name="chatbubble" size={24} color="#FFFFFF" />
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
        paddingBottom: 120,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#1A202C',
        marginBottom: 20,
    },
    weekSelector: {
        marginBottom: 24,
    },
    weekSelectorContent: {
        paddingRight: 20,
    },
    weekButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        marginRight: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    weekButtonActive: {
        backgroundColor: '#3182CE',
        borderColor: '#3182CE',
    },
    weekButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4A5568',
    },
    weekButtonTextActive: {
        color: '#FFFFFF',
    },
    section: {
        marginBottom: 24,
    },
    workoutCard: {
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
    workoutHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    dayName: {
        fontSize: 12,
        color: '#718096',
        fontWeight: '600',
        marginBottom: 4,
    },
    workoutTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2D3748',
    },
    durationBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F7FAFC',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
    },
    durationText: {
        fontSize: 12,
        color: '#718096',
        marginLeft: 4,
        fontWeight: '600',
    },
    exercisePreview: {
        marginBottom: 12,
    },
    exerciseItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    exerciseDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#3182CE',
        marginRight: 8,
    },
    exerciseText: {
        fontSize: 14,
        color: '#4A5568',
    },
    viewDetailsButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        marginTop: 8,
    },
    viewDetailsText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#3182CE',
        marginRight: 4,
    },
    summaryBox: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    summaryTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2D3748',
        marginBottom: 16,
    },
    summaryStats: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 20,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    summaryStatItem: {
        alignItems: 'center',
    },
    summaryStatValue: {
        fontSize: 24,
        fontWeight: '700',
        color: '#3182CE',
        marginBottom: 4,
    },
    summaryStatLabel: {
        fontSize: 12,
        color: '#718096',
    },
    trainerNotesSection: {
        backgroundColor: '#F7FAFC',
        borderRadius: 12,
        padding: 16,
    },
    trainerNotesTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#2D3748',
        marginBottom: 8,
    },
    trainerNotesText: {
        fontSize: 14,
        color: '#4A5568',
        lineHeight: 20,
    },
    bottomSpacer: {
        height: 20,
    },
    fabContainer: {
        position: 'absolute',
        bottom: 90,
        right: 20,
    },
    fab: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#9F7AEA',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
        shadowColor: '#9F7AEA',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    fabSecondary: {
        backgroundColor: '#3182CE',
        shadowColor: '#3182CE',
    },
    fabTertiary: {
        backgroundColor: '#48BB78',
        shadowColor: '#48BB78',
    },
});

export default WorkoutPlansScreen;
