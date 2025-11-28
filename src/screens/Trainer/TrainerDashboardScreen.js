import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const TrainerDashboardScreen = ({ navigation }) => {
    const [showFABMenu, setShowFABMenu] = useState(false);

    const pendingReviews = [
        { id: 1, clientName: 'Sarah Johnson', goal: 'Lose Fat', week: 'Week 1', day: 'Day 3' },
        { id: 2, clientName: 'Mike Chen', goal: 'Build Muscle', week: 'Week 2', day: 'Day 1' },
        { id: 3, clientName: 'Emma Davis', goal: 'Get Toned', week: 'Week 1', day: 'Day 5' },
    ];

    const todaySessions = [
        { id: 1, time: '10:00 AM', clientName: 'John Smith', type: 'Personal Training' },
        { id: 2, time: '11:30 AM', clientName: 'Lisa Brown', type: 'Assessment' },
        { id: 3, time: '2:00 PM', clientName: 'David Wilson', type: 'Check-In' },
        { id: 4, time: '4:00 PM', clientName: 'Rachel Green', type: 'Personal Training' },
    ];

    const notifications = [
        { id: 1, text: 'New client sign-up: Alex Martinez', icon: 'person-add' },
        { id: 2, text: 'Sarah completed Week 2 workout', icon: 'checkmark-circle' },
        { id: 3, text: 'Mike updated his weight log', icon: 'trending-up' },
        { id: 4, text: 'Emma sent you a message', icon: 'chatbubble' },
    ];

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>

                {/* 1. Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.headerTitle}>Trainer Dashboard</Text>
                        <Text style={styles.headerSubtitle}>Welcome back, Coach!</Text>
                    </View>
                    <TouchableOpacity style={styles.avatarButton}>
                        <Ionicons name="person-circle" size={40} color="#3182CE" />
                    </TouchableOpacity>
                </View>

                {/* 2. Quick Stats Section */}
                <View style={styles.statsRow}>
                    <View style={styles.statCard}>
                        <Ionicons name="people" size={28} color="#3182CE" />
                        <Text style={styles.statValue}>24</Text>
                        <Text style={styles.statLabel}>Active Clients</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Ionicons name="document-text" size={28} color="#F6AD55" />
                        <Text style={styles.statValue}>3</Text>
                        <Text style={styles.statLabel}>Pending Reviews</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Ionicons name="calendar" size={28} color="#48BB78" />
                        <Text style={styles.statValue}>12</Text>
                        <Text style={styles.statLabel}>Sessions This Week</Text>
                    </View>
                </View>

                {/* 3. Pending AI Plan Reviews */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Pending AI Plan Reviews</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {pendingReviews.map((review) => (
                            <View key={review.id} style={styles.reviewCard}>
                                <Text style={styles.reviewClientName}>{review.clientName}</Text>
                                <View style={styles.reviewGoalBadge}>
                                    <Text style={styles.reviewGoalText}>{review.goal}</Text>
                                </View>
                                <Text style={styles.reviewWeek}>{review.week} • {review.day}</Text>
                                <TouchableOpacity style={styles.reviewButton}>
                                    <Text style={styles.reviewButtonText}>Review Plan</Text>
                                    <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </ScrollView>
                </View>

                {/* 4. Today's Schedule */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Today's Schedule</Text>
                    {todaySessions.map((session) => (
                        <View key={session.id} style={styles.sessionCard}>
                            <View style={styles.sessionTime}>
                                <Ionicons name="time-outline" size={20} color="#3182CE" />
                                <Text style={styles.sessionTimeText}>{session.time}</Text>
                            </View>
                            <View style={styles.sessionInfo}>
                                <Text style={styles.sessionClientName}>{session.clientName}</Text>
                                <Text style={styles.sessionType}>{session.type}</Text>
                            </View>
                            <TouchableOpacity style={styles.sessionButton}>
                                <Ionicons name="play-circle" size={24} color="#3182CE" />
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>

                {/* 5. Client Management Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Client Management</Text>
                    <View style={styles.managementCard}>
                        <TouchableOpacity
                            style={styles.managementOption}
                            onPress={() => navigation.navigate('TrainerClientList')}
                        >
                            <Ionicons name="people-outline" size={24} color="#3182CE" />
                            <Text style={styles.managementText}>View All Clients</Text>
                            <Ionicons name="chevron-forward" size={20} color="#A0AEC0" />
                        </TouchableOpacity>
                        <View style={styles.managementDivider} />
                        <TouchableOpacity
                            style={styles.managementOption}
                            onPress={() => navigation.navigate('TrainerChat')}
                        >
                            <Ionicons name="chatbubbles-outline" size={24} color="#3182CE" />
                            <Text style={styles.managementText}>Messages / Chat</Text>
                            <Ionicons name="chevron-forward" size={20} color="#A0AEC0" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* 6. Performance Analytics */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Weekly Performance</Text>
                    <View style={styles.analyticsCard}>
                        <View style={styles.chartPlaceholder}>
                            <Text style={styles.chartPlaceholderText}>📊 Performance Chart</Text>
                        </View>
                        <View style={styles.metricsRow}>
                            <View style={styles.metricItem}>
                                <Text style={styles.metricValue}>18</Text>
                                <Text style={styles.metricLabel}>Sessions Completed</Text>
                            </View>
                            <View style={styles.metricItem}>
                                <Text style={styles.metricValue}>87%</Text>
                                <Text style={styles.metricLabel}>Client Adherence</Text>
                            </View>
                            <View style={styles.metricItem}>
                                <Text style={styles.metricValue}>4.8</Text>
                                <Text style={styles.metricLabel}>Average Rating</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* 7. Notifications Panel */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Notifications</Text>
                    <View style={styles.notificationsCard}>
                        {notifications.map((notification) => (
                            <View key={notification.id} style={styles.notificationItem}>
                                <View style={styles.notificationIcon}>
                                    <Ionicons name={notification.icon} size={20} color="#3182CE" />
                                </View>
                                <Text style={styles.notificationText}>{notification.text}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                <View style={styles.bottomSpacer} />
            </ScrollView>

            {/* 8. Floating Action Button */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => setShowFABMenu(!showFABMenu)}
            >
                <Ionicons name={showFABMenu ? "close" : "add"} size={28} color="#FFFFFF" />
            </TouchableOpacity>

            {/* FAB Menu */}
            {showFABMenu && (
                <View style={styles.fabMenu}>
                    <TouchableOpacity style={styles.fabMenuItem}>
                        <Ionicons name="barbell-outline" size={20} color="#2D3748" />
                        <Text style={styles.fabMenuText}>Create Workout Plan</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.fabMenuItem}>
                        <Ionicons name="person-add-outline" size={20} color="#2D3748" />
                        <Text style={styles.fabMenuText}>Add Client</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.fabMenuItem}>
                        <Ionicons name="megaphone-outline" size={20} color="#2D3748" />
                        <Text style={styles.fabMenuText}>Send Broadcast Message</Text>
                    </TouchableOpacity>
                </View>
            )}
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
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
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
    avatarButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    statCard: {
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
    statValue: {
        fontSize: 24,
        fontWeight: '700',
        color: '#2D3748',
        marginTop: 8,
    },
    statLabel: {
        fontSize: 11,
        color: '#718096',
        textAlign: 'center',
        marginTop: 4,
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
    reviewCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginRight: 12,
        width: 200,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    reviewClientName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2D3748',
        marginBottom: 8,
    },
    reviewGoalBadge: {
        backgroundColor: '#EBF8FF',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start',
        marginBottom: 8,
    },
    reviewGoalText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#3182CE',
    },
    reviewWeek: {
        fontSize: 13,
        color: '#718096',
        marginBottom: 12,
    },
    reviewButton: {
        backgroundColor: '#3182CE',
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    reviewButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
        marginRight: 4,
    },
    sessionCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    sessionTime: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 16,
    },
    sessionTimeText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2D3748',
        marginLeft: 6,
    },
    sessionInfo: {
        flex: 1,
    },
    sessionClientName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2D3748',
        marginBottom: 4,
    },
    sessionType: {
        fontSize: 13,
        color: '#718096',
    },
    sessionButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    managementCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    managementOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
    },
    managementText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#2D3748',
        flex: 1,
        marginLeft: 12,
    },
    managementDivider: {
        height: 1,
        backgroundColor: '#E2E8F0',
    },
    analyticsCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    chartPlaceholder: {
        height: 120,
        backgroundColor: '#EDF2F7',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    chartPlaceholderText: {
        fontSize: 16,
        color: '#A0AEC0',
    },
    metricsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    metricItem: {
        alignItems: 'center',
    },
    metricValue: {
        fontSize: 20,
        fontWeight: '700',
        color: '#3182CE',
        marginBottom: 4,
    },
    metricLabel: {
        fontSize: 11,
        color: '#718096',
        textAlign: 'center',
    },
    notificationsCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    notificationItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    notificationIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#EBF8FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    notificationText: {
        fontSize: 14,
        color: '#4A5568',
        flex: 1,
    },
    bottomSpacer: {
        height: 20,
    },
    fab: {
        position: 'absolute',
        bottom: 90,
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#3182CE',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#3182CE',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    fabMenu: {
        position: 'absolute',
        bottom: 160,
        right: 20,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    fabMenuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    fabMenuText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2D3748',
        marginLeft: 12,
    },
});

export default TrainerDashboardScreen;
