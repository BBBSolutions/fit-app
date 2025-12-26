import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    Image,
} from 'react-native';
import { api } from '../../services/api';
import { useFocusEffect } from '@react-navigation/native';

const MemberHomeDashboardScreen = ({ navigation }) => {
    const [userName, setUserName] = useState('');
    const [stats, setStats] = useState({
        streak: 0,
        calories: 0,
        sessions: 0,
        loading: true
    });
    const [todaysWorkout, setTodaysWorkout] = useState(null);


    useFocusEffect(
        React.useCallback(() => {
            api.getProfile().then(data => {
                const name = data?.name || data?.first_name || 'Member';
                setUserName(name);
            }).catch(err => console.error("Home load error:", err));

            // Fetch Assignments
            api.getAssignedWorkouts('').then(data => {
                if (data && data.length > 0) {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);

                    const todaysAssignment = data.find(assignment => {
                        const date = new Date(assignment.scheduled_date || assignment.created_at || Date.now());
                        date.setHours(0, 0, 0, 0);
                        return date.getTime() === today.getTime();
                    });

                    setTodaysWorkout(todaysAssignment ? {
                        ...todaysAssignment.workout,
                        status: todaysAssignment.status,
                        assignmentId: todaysAssignment.id
                    } : null);
                } else {
                    setTodaysWorkout(null);
                }
            }).catch(err => console.error("Home workout load error:", err));

            // Fetch Stats (Last 365 days)
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - 365);

            api.getWorkoutStats(startDate.toISOString(), endDate.toISOString())
                .then(sessions => {
                    let totalCalories = 0;
                    let currentStreak = 0;

                    if (sessions && Array.isArray(sessions)) {
                        // 1. Total Sessions
                        const totalSessions = sessions.length;

                        // 2. Calories
                        totalCalories = sessions.reduce((acc, session) => {
                            const cals = session.metrics?.caloriesBurned || session.metrics?.calories || 0;
                            return acc + cals;
                        }, 0);

                        // 3. Streak Calculation
                        // Sort by date descending
                        const sortedSessions = sessions
                            .map(s => new Date(s.started_at || s.created_at))
                            .sort((a, b) => b - a);

                        if (sortedSessions.length > 0) {
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);

                            const uniqueDates = [];
                            sortedSessions.forEach(d => {
                                d.setHours(0, 0, 0, 0);
                                const t = d.getTime();
                                if (!uniqueDates.includes(t)) uniqueDates.push(t);
                            });

                            // Check if latest is today or yesterday to start streak
                            const latest = uniqueDates[0];
                            const yesterday = new Date(today);
                            yesterday.setDate(yesterday.getDate() - 1);

                            if (latest === today.getTime() || latest === yesterday.getTime()) {
                                currentStreak = 1;
                                let previousDate = new Date(latest);

                                for (let i = 1; i < uniqueDates.length; i++) {
                                    const date = new Date(uniqueDates[i]);
                                    const expectedPrev = new Date(previousDate);
                                    expectedPrev.setDate(expectedPrev.getDate() - 1);

                                    if (date.getTime() === expectedPrev.getTime()) {
                                        currentStreak++;
                                        previousDate = date;
                                    } else {
                                        break;
                                    }
                                }
                            } else {
                                currentStreak = 0;
                            }
                        }

                        setStats({
                            streak: currentStreak,
                            calories: totalCalories,
                            sessions: totalSessions,
                            loading: false
                        });
                    } else {
                        setStats({ streak: 0, calories: 0, sessions: 0, loading: false });
                    }
                })
                .catch(err => {
                    console.error("Failed to fetch stats:", err);
                    setStats(prev => ({ ...prev, loading: false }));
                });

        }, [])
    );

    const handleStartWorkout = () => {
        if (todaysWorkout) {
            if (todaysWorkout.status === 'completed') {
                // User wants "startworkout navigates to not completed workouts section"
                // Assuming this means the list of other available workouts.
                // The previous logic was 'MemberCreateWorkout'. 
                // "startworkout navigates to not completed workouts section"
                navigation.navigate('Workouts', { tab: 'pending' });
            } else {
                navigation.navigate('Workouts', { tab: 'pending' }); // Or specific detail?
            }
        } else {
            navigation.navigate('MemberCreateWorkout');
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>

                {/* 1. Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>Good Morning,</Text>
                        <Text style={styles.userName}>{userName || 'Loading...'}</Text>
                    </View>
                    <View style={styles.logoPlaceholder}>
                        <Text style={styles.logoText}>GYM</Text>
                    </View>
                </View>

                {/* 2. Today's Workout Card */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Today's Workout</Text>
                    {todaysWorkout ? (
                        <View style={styles.workoutCard}>
                            <View style={styles.workoutHeader}>
                                <View>
                                    <Text style={styles.workoutTitle}>{todaysWorkout.title || "Workout"}</Text>
                                    <Text style={styles.workoutDuration}>⏱ {todaysWorkout.duration || "N/A"}</Text>
                                </View>
                                {todaysWorkout.status === 'completed' && (
                                    <View style={{ backgroundColor: '#C6F6D5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 }}>
                                        <Text style={{ color: '#2F855A', fontWeight: 'bold', fontSize: 12 }}>Completed</Text>
                                    </View>
                                )}
                            </View>

                            <View style={styles.exerciseList}>
                                {(todaysWorkout.exercises || []).slice(0, 3).map((ex, idx) => (
                                    <View key={idx} style={styles.exerciseItem}>
                                        <View style={styles.exerciseIcon} />
                                        <View>
                                            <Text style={styles.exerciseName}>{typeof ex === 'string' ? ex : ex.name}</Text>
                                            <Text style={styles.exerciseDetails}>{typeof ex === 'string' ? '' : `${ex.sets} Sets x ${ex.reps} Reps`}</Text>
                                        </View>
                                    </View>
                                ))}
                            </View>

                            <TouchableOpacity
                                style={styles.startButton}
                                onPress={handleStartWorkout}
                            >
                                <Text style={styles.startButtonText}>
                                    {todaysWorkout.status === 'completed' ? 'Start New Workout' : 'Start Workout'}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.viewPlanLink}
                                onPress={() => navigation.navigate('Workouts', {
                                    tab: todaysWorkout.status === 'completed' ? 'completed' : 'pending'
                                })}
                            >
                                <Text style={styles.viewPlanText}>View Full Plan</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.workoutCard}>
                            <Text style={{ color: '#718096', marginBottom: 10 }}>No workout assigned for today.</Text>
                            <TouchableOpacity style={styles.startButton} onPress={() => navigation.navigate('MemberCreateWorkout')}>
                                <Text style={styles.startButtonText}>Start New Workout</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {/* 3. Progress Summary */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Your Progress</Text>
                    <View style={styles.progressRow}>
                        <View style={styles.progressCard}>
                            <Text style={styles.progressValue}>🔥 {stats.streak}</Text>
                            <Text style={styles.progressLabel}>Day Streak</Text>
                        </View>
                        <View style={styles.progressCard}>
                            <Text style={styles.progressValue}>⚡ {stats.calories.toLocaleString()}</Text>
                            <Text style={styles.progressLabel}>Kcal Burned</Text>
                        </View>
                        <View style={styles.progressCard}>
                            <Text style={styles.progressValue}>🏋️ {stats.sessions}</Text>
                            <Text style={styles.progressLabel}>Sessions</Text>
                        </View>
                    </View>
                </View>



                {/* 5. Quick Actions */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Quick Actions</Text>
                    <View style={styles.quickActionsRow}>
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => navigation.navigate('Progress')}
                        >
                            <Text style={styles.actionIcon}>⚖️</Text>
                            <Text style={styles.actionText}>Log Weight</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => navigation.navigate('DietLogging')}
                        >
                            <Text style={styles.actionIcon}>🥗</Text>
                            <Text style={styles.actionText}>Log Diet</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => navigation.navigate('MemberCreateWorkout')}
                        >
                            <Text style={styles.actionIcon}>💪</Text>
                            <Text style={styles.actionText}>+ Workout</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={[styles.quickActionsRow, { marginTop: 12 }]}>
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => navigation.navigate('Messages')}
                        >
                            <Text style={styles.actionIcon}>💬</Text>
                            <Text style={styles.actionText}>Trainer</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.footerSpacer} />
            </ScrollView>

            {/* 6. Bottom Tabs (Placeholder) */}
            <View style={styles.bottomTabs}>
                <TouchableOpacity style={styles.tabItem}>
                    <Text style={[styles.tabIcon, styles.activeTab]}>🏠</Text>
                    <Text style={[styles.tabText, styles.activeTab]}>Home</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.tabItem}>
                    <Text style={styles.tabIcon}>💪</Text>
                    <Text style={styles.tabText}>Workouts</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.tabItem}>
                    <Text style={styles.tabIcon}>📈</Text>
                    <Text style={styles.tabText}>Progress</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.tabItem}>
                    <Text style={styles.tabIcon}>👤</Text>
                    <Text style={styles.tabText}>Profile</Text>
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
        paddingBottom: 100, // Space for bottom tabs
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    greeting: {
        fontSize: 16,
        color: '#718096',
    },
    userName: {
        fontSize: 24,
        fontWeight: '800',
        color: '#1A202C',
    },
    logoPlaceholder: {
        width: 40,
        height: 40,
        backgroundColor: '#2D3748',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 10,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2D3748',
        marginBottom: 12,
    },
    workoutCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    workoutHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    workoutTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2D3748',
        flex: 1,
    },
    workoutDuration: {
        fontSize: 14,
        color: '#718096',
        fontWeight: '600',
    },
    exerciseList: {
        marginBottom: 20,
    },
    exerciseItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    exerciseIcon: {
        width: 40,
        height: 40,
        backgroundColor: '#EDF2F7',
        borderRadius: 8,
        marginRight: 12,
    },
    exerciseName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#4A5568',
    },
    exerciseDetails: {
        fontSize: 14,
        color: '#A0AEC0',
    },
    startButton: {
        backgroundColor: '#3182CE',
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
        marginBottom: 12,
    },
    startButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    viewPlanLink: {
        alignItems: 'center',
    },
    viewPlanText: {
        color: '#3182CE',
        fontSize: 14,
        fontWeight: '600',
    },
    progressRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    progressCard: {
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
    progressValue: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2D3748',
        marginBottom: 4,
    },
    progressLabel: {
        fontSize: 12,
        color: '#718096',
        textAlign: 'center',
    },
    graphCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    graphPlaceholder: {
        height: 150,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderStyle: 'dashed',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    graphPlaceholderText: {
        color: '#A0AEC0',
    },
    quickActionsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    actionButton: {
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
    actionIcon: {
        fontSize: 24,
        marginBottom: 8,
    },
    actionText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#4A5568',
        textAlign: 'center',
    },
    bottomTabs: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        paddingBottom: 20, // Adjust for safe area if needed
    },
    tabItem: {
        alignItems: 'center',
    },
    tabIcon: {
        fontSize: 20,
        color: '#A0AEC0',
        marginBottom: 4,
    },
    tabText: {
        fontSize: 10,
        color: '#A0AEC0',
        fontWeight: '600',
    },
    activeTab: {
        color: '#3182CE',
    },
});

export default MemberHomeDashboardScreen;
