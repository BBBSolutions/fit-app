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

    useFocusEffect(
        React.useCallback(() => {
            api.getProfile().then(data => {
                // Check for either camelCase (from our transformer) or snake_case 
                // just to be safe, though our transformer ensures camelCase.
                const name = data?.name || data?.first_name || 'Member';
                setUserName(name);
            }).catch(err => console.error("Home load error:", err));
        }, [])
    );

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
                    <View style={styles.workoutCard}>
                        <View style={styles.workoutHeader}>
                            <Text style={styles.workoutTitle}>Full Body Strength – Day 1</Text>
                            <Text style={styles.workoutDuration}>⏱ 45 min</Text>
                        </View>

                        <View style={styles.exerciseList}>
                            <View style={styles.exerciseItem}>
                                <View style={styles.exerciseIcon} />
                                <View>
                                    <Text style={styles.exerciseName}>Barbell Squats</Text>
                                    <Text style={styles.exerciseDetails}>3 Sets x 10 Reps</Text>
                                </View>
                            </View>
                            <View style={styles.exerciseItem}>
                                <View style={styles.exerciseIcon} />
                                <View>
                                    <Text style={styles.exerciseName}>Bench Press</Text>
                                    <Text style={styles.exerciseDetails}>3 Sets x 12 Reps</Text>
                                </View>
                            </View>
                            <View style={styles.exerciseItem}>
                                <View style={styles.exerciseIcon} />
                                <View>
                                    <Text style={styles.exerciseName}>Bent Over Rows</Text>
                                    <Text style={styles.exerciseDetails}>3 Sets x 12 Reps</Text>
                                </View>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={styles.startButton}
                            onPress={() => navigation.navigate('WorkoutDetail')}
                        >
                            <Text style={styles.startButtonText}>Start Workout</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.viewPlanLink}>
                            <Text style={styles.viewPlanText}>View Full Plan</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* 3. Progress Summary */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Your Progress</Text>
                    <View style={styles.progressRow}>
                        <View style={styles.progressCard}>
                            <Text style={styles.progressValue}>🔥 5</Text>
                            <Text style={styles.progressLabel}>Day Streak</Text>
                        </View>
                        <View style={styles.progressCard}>
                            <Text style={styles.progressValue}>⚡ 2,150</Text>
                            <Text style={styles.progressLabel}>Kcal Burned</Text>
                        </View>
                        <View style={styles.progressCard}>
                            <Text style={styles.progressValue}>🏋️ 12</Text>
                            <Text style={styles.progressLabel}>Sessions</Text>
                        </View>
                    </View>
                </View>

                {/* 4. Weight Trend Graph */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Weight Progress</Text>
                    <View style={styles.graphCard}>
                        <View style={styles.graphPlaceholder}>
                            <Text style={styles.graphPlaceholderText}>Weight Trend Graph Placeholder</Text>
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
                            onPress={() => navigation.navigate('Messages')}
                        >
                            <Text style={styles.actionIcon}>💬</Text>
                            <Text style={styles.actionText}>Message Trainer</Text>
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
