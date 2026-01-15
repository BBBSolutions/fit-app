import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography, shadows } from '../../theme/theme';

const TrainerScheduleScreen = ({ navigation }) => {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [view, setView] = useState('day'); // 'day', 'week', 'month'

    // Sessions data - to be fetched from API
    const todaySessions = [];

    const getStatusColor = (status) => {
        switch (status) {
            case 'upcoming':
                return colors.info;
            case 'completed':
                return colors.success;
            case 'cancelled':
                return colors.error;
            default:
                return colors.gray[400];
        }
    };

    const formatDate = (date) => {
        const options = { weekday: 'long', month: 'long', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerContent}>
                    <View>
                        <Text style={styles.headerTitle}>Schedule</Text>
                        <Text style={styles.headerSubtitle}>{formatDate(selectedDate)}</Text>
                    </View>
                    <TouchableOpacity style={styles.addButton}>
                        <Ionicons name="add-circle" size={32} color={colors.white} />
                    </TouchableOpacity>
                </View>

                {/* View Selector */}
                <View style={styles.viewSelector}>
                    {['day', 'week', 'month'].map((v) => (
                        <TouchableOpacity
                            key={v}
                            style={[styles.viewTab, view === v && styles.viewTabActive]}
                            onPress={() => setView(v)}
                        >
                            <Text style={[styles.viewTabText, view === v && styles.viewTabTextActive]}>
                                {v.charAt(0).toUpperCase() + v.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
                {/* Quick Stats */}
                <View style={styles.statsRow}>
                    <View style={styles.statCard}>
                        <Ionicons name="time-outline" size={24} color={colors.trainer.primary} />
                        <Text style={styles.statValue}>0</Text>
                        <Text style={styles.statLabel}>Sessions Today</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Ionicons name="checkmark-circle" size={24} color={colors.success} />
                        <Text style={styles.statValue}>0</Text>
                        <Text style={styles.statLabel}>Completed</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Ionicons name="trending-up" size={24} color={colors.info} />
                        <Text style={styles.statValue}>0</Text>
                        <Text style={styles.statLabel}>Upcoming</Text>
                    </View>
                </View>

                {/* Session Timeline */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Today's Sessions</Text>

                    {todaySessions.map((session, index) => (
                        <View key={session.id || index} style={styles.sessionWrapper}>
                            {/* Timeline */}
                            <View style={styles.timelineContainer}>
                                <View
                                    style={[
                                        styles.timelineDot,
                                        { backgroundColor: getStatusColor(session.status) },
                                    ]}
                                />
                                {index < todaySessions.length - 1 && <View style={styles.timelineLine} />}
                            </View>

                            {/* Session Card */}
                            <TouchableOpacity
                                style={styles.sessionCard}
                                onPress={() => navigation.navigate('TrainerClientDetails', { clientId: session.id })}
                            >
                                <View style={styles.sessionHeader}>
                                    <View style={styles.sessionTime}>
                                        <Ionicons name="time-outline" size={16} color={colors.trainer.primary} />
                                        <Text style={styles.timeText}>{session.time}</Text>
                                        <View style={styles.durationBadge}>
                                            <Text style={styles.durationText}>{session.duration} min</Text>
                                        </View>
                                    </View>
                                    <View
                                        style={[
                                            styles.statusBadge,
                                            { backgroundColor: getStatusColor(session.status) + '20' },
                                        ]}
                                    >
                                        <Text style={[styles.statusText, { color: getStatusColor(session.status) }]}>
                                            {session.status}
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.sessionBody}>
                                    <View style={styles.clientInfo}>
                                        <View style={styles.avatarPlaceholder}>
                                            <Ionicons name="person" size={24} color={colors.trainer.primary} />
                                        </View>
                                        <View style={styles.clientDetails}>
                                            <Text style={styles.clientName}>{session.clientName}</Text>
                                            <Text style={styles.sessionType}>{session.type}</Text>
                                        </View>
                                    </View>
                                    <TouchableOpacity style={styles.actionButton}>
                                        <Ionicons name="chevron-forward" size={20} color={colors.gray[400]} />
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.sessionFooter}>
                                    <View style={styles.goalBadge}>
                                        <Ionicons name="flag-outline" size={12} color={colors.trainer.primary} />
                                        <Text style={styles.goalText}>{session.goal}</Text>
                                    </View>
                                    {session.status === 'upcoming' && (
                                        <TouchableOpacity style={styles.startButton}>
                                            <Ionicons name="play-circle" size={20} color={colors.trainer.primary} />
                                            <Text style={styles.startButtonText}>Start Session</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>

                <View style={styles.bottomSpacer} />
            </ScrollView >
        </SafeAreaView >
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: colors.trainer.background,
    },
    header: {
        backgroundColor: colors.trainer.primary,
        paddingHorizontal: spacing.xl,
        paddingTop: spacing.xl,
        paddingBottom: spacing.lg,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    headerTitle: {
        fontSize: typography.fontSize.xxxl,
        fontWeight: typography.fontWeight.extrabold,
        color: colors.white,
    },
    headerSubtitle: {
        fontSize: typography.fontSize.base,
        color: colors.white,
        opacity: 0.9,
        marginTop: spacing.xs,
    },
    addButton: {
        padding: spacing.xs,
    },
    viewSelector: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: borderRadius.md,
        padding: spacing.xs,
    },
    viewTab: {
        flex: 1,
        paddingVertical: spacing.sm,
        alignItems: 'center',
        borderRadius: borderRadius.sm,
    },
    viewTabActive: {
        backgroundColor: colors.white,
    },
    viewTabText: {
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.semibold,
        color: 'rgba(255, 255, 255, 0.8)',
    },
    viewTabTextActive: {
        color: colors.trainer.primary,
    },
    container: {
        flex: 1,
    },
    contentContainer: {
        padding: spacing.xl,
        paddingBottom: 100,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: -spacing.xxxl,
        marginBottom: spacing.xxl,
    },
    statCard: {
        backgroundColor: colors.white,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        flex: 1,
        alignItems: 'center',
        marginHorizontal: spacing.xs,
        ...shadows.md,
    },
    statValue: {
        fontSize: typography.fontSize.xxl,
        fontWeight: typography.fontWeight.bold,
        color: colors.text.primary,
        marginTop: spacing.sm,
    },
    statLabel: {
        fontSize: typography.fontSize.xs,
        color: colors.text.tertiary,
        marginTop: spacing.xs,
        textAlign: 'center',
    },
    section: {
        marginBottom: spacing.xxl,
    },
    sectionTitle: {
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.bold,
        color: colors.text.primary,
        marginBottom: spacing.lg,
    },
    sessionWrapper: {
        flexDirection: 'row',
        marginBottom: spacing.lg,
    },
    timelineContainer: {
        width: 30,
        alignItems: 'center',
        marginRight: spacing.md,
    },
    timelineDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginTop: spacing.md,
    },
    timelineLine: {
        width: 2,
        flex: 1,
        backgroundColor: colors.gray[200],
        marginTop: spacing.sm,
    },
    sessionCard: {
        flex: 1,
        padding: spacing.lg,
        backgroundColor: colors.white,
        borderRadius: borderRadius.lg,
        ...shadows.md,
    },
    sessionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    sessionTime: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    timeText: {
        fontSize: typography.fontSize.base,
        fontWeight: typography.fontWeight.semibold,
        color: colors.text.primary,
        marginLeft: spacing.xs,
        marginRight: spacing.sm,
    },
    durationBadge: {
        backgroundColor: colors.gray[100],
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs / 2,
        borderRadius: borderRadius.sm,
    },
    durationText: {
        fontSize: typography.fontSize.xs,
        color: colors.text.secondary,
        fontWeight: typography.fontWeight.medium,
    },
    statusBadge: {
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs / 2,
        borderRadius: borderRadius.sm,
    },
    statusText: {
        fontSize: typography.fontSize.xs,
        fontWeight: typography.fontWeight.semibold,
        textTransform: 'capitalize',
    },
    sessionBody: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    clientInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    avatarPlaceholder: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: colors.gray[100],
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    clientDetails: {
        flex: 1,
    },
    clientName: {
        fontSize: typography.fontSize.md,
        fontWeight: typography.fontWeight.semibold,
        color: colors.text.primary,
        marginBottom: spacing.xs / 2,
    },
    sessionType: {
        fontSize: typography.fontSize.sm,
        color: colors.text.tertiary,
    },
    actionButton: {
        padding: spacing.sm,
    },
    sessionFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.gray[100],
    },
    goalBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.gray[50],
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.sm,
    },
    goalText: {
        fontSize: typography.fontSize.xs,
        color: colors.trainer.primary,
        fontWeight: typography.fontWeight.medium,
        marginLeft: spacing.xs,
    },
    startButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    startButtonText: {
        fontSize: typography.fontSize.sm,
        color: colors.trainer.primary,
        fontWeight: typography.fontWeight.semibold,
        marginLeft: spacing.xs,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.huge,
    },
    emptyStateTitle: {
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.bold,
        color: colors.text.secondary,
        marginTop: spacing.lg,
        marginBottom: spacing.xs,
    },
    emptyStateText: {
        fontSize: typography.fontSize.base,
        color: colors.text.tertiary,
        textAlign: 'center',
        paddingHorizontal: spacing.xl,
    },
    bottomSpacer: {
        height: spacing.xl,
    },
});

export default TrainerScheduleScreen;
