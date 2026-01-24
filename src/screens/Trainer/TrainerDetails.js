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
import { api } from '../../services/api';
import { colors, spacing, borderRadius, typography, shadows } from '../../theme/theme';

const TrainerDetails = ({ navigation }) => {
    const [trainerProfile, setTrainerProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    const [stats, setStats] = useState([
        { id: 1, label: 'Active Clients', value: '0', icon: 'people', color: colors.trainer.primary },
        { id: 2, label: 'Total Sessions', value: '0', icon: 'barbell', color: colors.success },
        { id: 3, label: 'Avg Rating', value: '5.0', icon: 'star', color: colors.warning },
    ]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [profile, clients] = await Promise.all([
                api.getProfile(),
                api.getClients()
            ]);

            setTrainerProfile(profile);

            // Calculate Stats
            let clientCount = 0;
            let sessionCount = 0;

            if (Array.isArray(clients)) {
                clientCount = clients.length;

                // Fetch assignments to count total sessions
                const sessionsPromises = clients.map(async (client) => {
                    try {
                        const workouts = await api.getAssignedWorkouts(client.id);
                        return workouts;
                    } catch (e) {
                        return [];
                    }
                });

                const results = await Promise.all(sessionsPromises);
                const allAssignments = results.flat();
                sessionCount = allAssignments.length;
            }

            setStats([
                { id: 1, label: 'Active Clients', value: clientCount.toString(), icon: 'people', color: colors.trainer.primary },
                { id: 2, label: 'Total Sessions', value: sessionCount.toString(), icon: 'barbell', color: colors.success },
                { id: 3, label: 'Avg Rating', value: '5.0', icon: 'star', color: colors.warning },
            ]);

        } catch (error) {
            console.error('Failed to load trainer data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        const { supabase } = require('../../config/supabaseAuth');
        try {
            await supabase.auth.signOut();
            // For web compatibility
            if (typeof window !== 'undefined') {
                window.location.reload();
            }
            navigation.replace('GymCode');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.contentContainer}
            >
                {/* Header with Profile */}
                <View style={styles.header}>
                    <View style={styles.headerContent}>
                        <View style={styles.avatarContainer}>
                            <View style={styles.avatar}>
                                <Ionicons name="person" size={48} color={colors.trainer.primary} />
                            </View>
                        </View>
                        <Text style={styles.trainerName}>
                            {trainerProfile?.fullName || 'Trainer Profile'}
                        </Text>
                        <Text style={styles.trainerSpecialization}>
                            {trainerProfile?.primarySpecialization || 'Fitness Specialist'}
                        </Text>
                        {trainerProfile?.certifications && (
                            <View style={styles.certificationBadge}>
                                <Ionicons name="ribbon" size={14} color={colors.white} />
                                <Text style={styles.certificationText}>Certified Professional</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Statistics Cards */}
                <View style={styles.statsSection}>
                    {stats.map((stat) => (
                        <View key={stat.id} style={styles.statCard}>
                            <View style={[styles.statIconContainer, { backgroundColor: stat.color + '20' }]}>
                                <Ionicons name={stat.icon} size={24} color={stat.color} />
                            </View>
                            <Text style={styles.statValue}>{stat.value}</Text>
                            <Text style={styles.statLabel}>{stat.label}</Text>
                        </View>
                    ))}
                </View>

                {/* Profile Information */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Profile Information</Text>

                    <View style={styles.infoCard}>
                        <InfoRow icon="mail" label="Email" value={trainerProfile?.email || 'N/A'} />
                        <Divider />
                        <InfoRow
                            icon="call"
                            label="Phone"
                            value={trainerProfile?.phoneNumber || trainerProfile?.phone || 'Not provided'}
                        />
                        <Divider />

                        <InfoRow
                            icon="calendar"
                            label="Years Experience"
                            value={`${trainerProfile?.yearsOfExperience || '0'} years`}
                        />
                    </View>
                </View>

                {/* Specializations */}
                {trainerProfile?.secondarySkills && trainerProfile.secondarySkills.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Specializations</Text>
                        <View style={styles.skillsCard}>
                            <View style={styles.skillsContainer}>
                                {trainerProfile.secondarySkills.map((skill, index) => (
                                    <View key={index} style={styles.skillChip}>
                                        <Text style={styles.skillText}>{skill}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    </View>
                )}

                {/* Settings */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Settings</Text>

                    <View style={styles.settingsCard}>
                        <SettingRow
                            icon="person-circle"
                            label="Edit Profile"
                            onPress={() => navigation.navigate('TrainerOnboarding')}
                        />
                        <Divider />
                        <SettingRow
                            icon="notifications"
                            label="Notifications"
                            onPress={() => { }}
                        />
                        <Divider />
                        <SettingRow
                            icon="help-circle"
                            label="Help & Support"
                            onPress={() => { }}
                        />
                        <Divider />
                        <SettingRow
                            icon="shield-checkmark"
                            label="Privacy Policy"
                            onPress={() => { }}
                        />
                    </View>
                </View>

                {/* Logout Button */}
                <View style={styles.section}>
                    <TouchableOpacity
                        style={styles.logoutButton}
                        onPress={handleLogout}
                    >
                        <Ionicons name="log-out-outline" size={20} color={colors.white} style={{ marginRight: 8 }} />
                        <Text style={styles.logoutButtonText}>Logout</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.bottomSpacer} />
            </ScrollView>
        </SafeAreaView>
    );
};

// Helper Components
const InfoRow = ({ icon, label, value }) => (
    <View style={styles.infoRow}>
        <View style={styles.infoLeft}>
            <Ionicons name={icon} size={20} color={colors.trainer.primary} />
            <Text style={styles.infoLabel}>{label}</Text>
        </View>
        <Text style={styles.infoValue}>{value}</Text>
    </View>
);

const SettingRow = ({ icon, label, onPress }) => (
    <TouchableOpacity style={styles.settingRow} onPress={onPress}>
        <View style={styles.settingLeft}>
            <Ionicons name={icon} size={22} color={colors.trainer.primary} />
            <Text style={styles.settingLabel}>{label}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.gray[400]} />
    </TouchableOpacity>
);

const Divider = () => <View style={styles.divider} />;

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: colors.trainer.background,
    },
    container: {
        flex: 1,
    },
    contentContainer: {
        paddingBottom: 100,
    },
    header: {
        backgroundColor: colors.trainer.primary,
        paddingTop: spacing.huge,
        paddingBottom: spacing.xxxl,
        alignItems: 'center',
    },
    headerContent: {
        alignItems: 'center',
    },
    avatarContainer: {
        marginBottom: spacing.lg,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: colors.white,
        alignItems: 'center',
        justifyContent: 'center',
        ...shadows.lg,
    },
    trainerName: {
        fontSize: typography.fontSize.xxl,
        fontWeight: typography.fontWeight.bold,
        color: colors.white,
        marginBottom: spacing.xs,
    },
    trainerSpecialization: {
        fontSize: typography.fontSize.base,
        color: 'rgba(255, 255, 255, 0.9)',
        marginBottom: spacing.md,
    },
    certificationBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.md,
    },
    certificationText: {
        fontSize: typography.fontSize.sm,
        color: colors.white,
        fontWeight: typography.fontWeight.semibold,
        marginLeft: spacing.xs,
    },
    statsSection: {
        flexDirection: 'row',
        paddingHorizontal: spacing.xl,
        marginBottom: spacing.xxl,
        justifyContent: 'space-between',
    },
    statCard: {
        backgroundColor: colors.white,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        flex: 1,
        alignItems: 'center',
        marginHorizontal: spacing.xs,
        ...shadows.md,
    },
    statIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.sm,
    },
    statValue: {
        fontSize: typography.fontSize.xxl,
        fontWeight: typography.fontWeight.bold,
        color: colors.text.primary,
        marginBottom: spacing.xs,
    },
    statLabel: {
        fontSize: typography.fontSize.xs,
        color: colors.text.tertiary,
        textAlign: 'center',
    },
    section: {
        paddingHorizontal: spacing.xl,
        marginBottom: spacing.xxl,
    },
    sectionTitle: {
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.bold,
        color: colors.text.primary,
        marginBottom: spacing.md,
    },
    infoCard: {
        backgroundColor: colors.white,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        ...shadows.md,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.md,
    },
    infoLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    infoLabel: {
        fontSize: typography.fontSize.base,
        color: colors.text.secondary,
        marginLeft: spacing.md,
        fontWeight: typography.fontWeight.medium,
    },
    infoValue: {
        fontSize: typography.fontSize.base,
        color: colors.text.primary,
        fontWeight: typography.fontWeight.semibold,
    },
    skillsCard: {
        backgroundColor: colors.white,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        ...shadows.md,
    },
    skillsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    skillChip: {
        backgroundColor: colors.trainer.primary + '20',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.md,
        marginRight: spacing.sm,
        marginBottom: spacing.sm,
    },
    skillText: {
        fontSize: typography.fontSize.sm,
        color: colors.trainer.primary,
        fontWeight: typography.fontWeight.semibold,
    },
    settingsCard: {
        backgroundColor: colors.white,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        ...shadows.md,
    },
    settingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.md,
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    settingLabel: {
        fontSize: typography.fontSize.base,
        color: colors.text.primary,
        marginLeft: spacing.md,
        fontWeight: typography.fontWeight.medium,
    },
    divider: {
        height: 1,
        backgroundColor: colors.gray[200],
    },
    bottomSpacer: {
        height: spacing.xl,
    },
    logoutButton: {
        backgroundColor: colors.error,
        borderRadius: borderRadius.md,
        paddingVertical: spacing.lg,
        paddingHorizontal: spacing.xl,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        ...shadows.md,
    },
    logoutButtonText: {
        fontSize: typography.fontSize.base,
        fontWeight: typography.fontWeight.semibold,
        color: colors.white,
    },
});

export default TrainerDetails;
