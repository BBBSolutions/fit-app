import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography, shadows } from '../../theme/theme';
import { api } from '../../services/api';

const TrainerScheduleScreen = ({ navigation }) => {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchClients = useCallback(async () => {
        try {
            const data = await api.getClients();
            setClients(data || []);
        } catch (err) {
            console.error('Failed to fetch clients:', err);
        }
    }, []);

    const loadData = async () => {
        setLoading(true);
        await fetchClients();
        setLoading(false);
    };

    // Load data when screen comes into focus
    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            loadData();
        });
        return unsubscribe;
    }, [navigation, fetchClients]);

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchClients();
        setRefreshing(false);
    };

    const getSessionClients = (sessionName) => {
        return clients.filter(c => c.assigned_session === sessionName);
    };

    const morningClients = getSessionClients('Morning');
    const afternoonClients = getSessionClients('Afternoon');
    const eveningClients = getSessionClients('Evening');

    const renderClientCard = (client) => (
        <TouchableOpacity
            key={client.id}
            style={styles.sessionCard}
            onPress={() => navigation.navigate('TrainerClientDetails', { clientId: client.id })}
        >
            <View style={styles.sessionBody}>
                <View style={styles.clientInfo}>
                    <View style={styles.avatarPlaceholder}>
                        <Ionicons name="person" size={24} color={colors.trainer?.primary || '#3182CE'} />
                    </View>
                    <View style={styles.clientDetails}>
                        <Text style={styles.clientName}>{client.name}</Text>
                        <Text style={styles.sessionType}>{client.goal || 'Select to assign workout'}</Text>
                    </View>
                </View>
                <View style={styles.actionBtn}>
                    <Ionicons name="chevron-forward" size={24} color={colors.gray?.[400] || '#A0AEC0'} />
                </View>
            </View>
        </TouchableOpacity>
    );

    const renderSessionGroup = (title, timeRange, groupClients, iconName, iconColor) => (
        <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={[styles.iconContainer, { backgroundColor: iconColor + '20' }]}>
                        <Ionicons name={iconName} size={24} color={iconColor} />
                    </View>
                    <View style={{ marginLeft: spacing.sm }}>
                        <Text style={styles.sectionTitle}>{title}</Text>
                        <Text style={styles.sectionSubtitle}>{timeRange}</Text>
                    </View>
                </View>
                <View style={styles.countBadge}>
                    <Text style={styles.countText}>{groupClients.length}</Text>
                </View>
            </View>

            {groupClients.length === 0 ? (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>No members assigned</Text>
                </View>
            ) : (
                groupClients.map(renderClientCard)
            )}
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerContent}>
                    <View style={{ flex: 1, marginRight: spacing.md }}>
                        <Text style={styles.headerTitle}>Assigned Schedule</Text>
                        <Text style={styles.headerSubtitle}>View your daily member sessions</Text>
                    </View>
                    <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
                        <Ionicons name="refresh" size={22} color="#3182CE" />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={colors.trainer?.primary || '#3182CE'} />
                        <Text style={styles.loadingText}>Loading schedule...</Text>
                    </View>
                ) : (
                    <>
                        {renderSessionGroup('Morning Session', '6:00 AM - 12:00 PM', morningClients, 'partly-sunny', '#D69E2E')}
                        {renderSessionGroup('Afternoon Session', '12:00 PM - 4:00 PM', afternoonClients, 'sunny', '#DD6B20')}
                        {renderSessionGroup('Evening Session', '4:00 PM - 10:00 PM', eveningClients, 'moon', '#4A5568')}
                    </>
                )}
                <View style={styles.bottomSpacer} />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },
    header: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: spacing.xl,
        paddingTop: spacing.xl,
        paddingBottom: spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: typography.fontSize.xxxl,
        fontWeight: typography.fontWeight.extrabold,
        color: '#1A202C',
    },
    headerSubtitle: {
        fontSize: typography.fontSize.base,
        color: '#718096',
        marginTop: spacing.xs,
    },
    refreshButton: {
        backgroundColor: '#EBF8FF',
        borderRadius: borderRadius.md,
        padding: spacing.sm,
    },
    container: {
        flex: 1,
    },
    contentContainer: {
        padding: spacing.xl,
        paddingBottom: 100,
    },
    section: {
        marginBottom: spacing.xxl,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    iconContainer: {
        padding: spacing.sm,
        borderRadius: borderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sectionTitle: {
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.bold,
        color: colors.text?.primary || '#1A202C',
    },
    sectionSubtitle: {
        fontSize: typography.fontSize.sm,
        color: '#718096',
        marginTop: 2,
    },
    countBadge: {
        backgroundColor: '#EDF2F7',
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: 12,
    },
    countText: {
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.bold,
        color: '#4A5568',
    },
    loadingContainer: {
        alignItems: 'center',
        paddingVertical: spacing.huge || 60,
    },
    loadingText: {
        marginTop: spacing.md,
        fontSize: typography.fontSize.base,
        color: colors.text?.secondary || '#718096',
    },
    sessionCard: {
        padding: spacing.lg,
        backgroundColor: colors.white,
        borderRadius: borderRadius.lg,
        marginBottom: spacing.md,
        ...shadows.sm,
    },
    sessionBody: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
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
        backgroundColor: colors.gray?.[100] || '#F7FAFC',
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
        color: colors.text?.primary || '#1A202C',
        marginBottom: spacing.xs / 2,
    },
    sessionType: {
        fontSize: typography.fontSize.sm,
        color: colors.text?.tertiary || '#718096',
    },
    actionBtn: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingLeft: spacing.sm,
    },
    emptyState: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: '#CBD5E0',
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        alignItems: 'center',
    },
    emptyStateText: {
        fontSize: typography.fontSize.sm,
        color: '#A0AEC0',
    },
    bottomSpacer: {
        height: spacing.xl,
    },
});

export default TrainerScheduleScreen;
