import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    SafeAreaView,
    TouchableOpacity,
    Modal,
    TextInput,
    Alert,
    Dimensions,
    RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';
import { useFocusEffect } from '@react-navigation/native';
import { LineChart } from "react-native-chart-kit"; // Ensure this is installed

const SCREEN_WIDTH = Dimensions.get('window').width;

const ProgressScreen = () => {
    // State
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [memberDetails, setMemberDetails] = useState({});

    // Stats
    const [weightHistory, setWeightHistory] = useState([]);
    const [currentWeight, setCurrentWeight] = useState(0);
    const [weightChange, setWeightChange] = useState(0);

    const [workoutStats, setWorkoutStats] = useState({
        workoutsThisWeek: 0,
        caloriesBurned: 0,
        totalMinutes: 0,
        streakDays: 0,
        history: []
    });

    const [chartPeriod, setChartPeriod] = useState('3 Months'); // '1 Month', '3 Months', 'All'
    const [personalRecords, setPersonalRecords] = useState([]);

    // Edit Modal
    const [showEditModal, setShowEditModal] = useState(false);
    const [editedDetails, setEditedDetails] = useState({});
    const [newWeight, setNewWeight] = useState('');

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            // 1. Profile
            // 1. Profile
            const profile = await api.getProfile();

            // Normalize: Move legacy top-level fields into body_measurements
            // This ensures the Edit Modal has a complete object to work with,
            // preventing data loss when only one field is edited.
            const normalizedMeasurements = {
                ...(profile.body_measurements || {}),
                waist: profile.body_measurements?.waist || profile.waist,
                hips: profile.body_measurements?.hips || profile.body_measurements?.hip || profile.hip,
                chest: profile.body_measurements?.chest || profile.chest,
                arms: profile.body_measurements?.arms || profile.arms,
                thighs: profile.body_measurements?.thighs || profile.thighs,
            };

            const normalizedProfile = {
                ...profile,
                body_measurements: normalizedMeasurements
            };

            setMemberDetails(normalizedProfile);
            setEditedDetails(normalizedProfile); // Now 'editedDetails' has the full picture

            if (profile.weight) {
                setCurrentWeight(parseFloat(profile.weight));
                setNewWeight(profile.weight);
            }

            // 2. Weight History (Last 90 days for now)
            const endDate = new Date().toISOString().split('T')[0];
            const startDateObj = new Date();
            startDateObj.setDate(startDateObj.getDate() - 90);
            const startDate = startDateObj.toISOString().split('T')[0];

            const weights = await api.getMeasurementHistory('weight', startDate, endDate);

            // Format for Chart
            // If empty, use current weight as single point
            if (weights && weights.length > 0) {
                const formatted = weights.map(w => ({
                    value: parseFloat(w.value),
                    date: w.date, // 'YYYY-MM-DD'
                    label: `${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][new Date(w.date).getMonth()]} ${new Date(w.date).getDate()}`
                }));
                setWeightHistory(formatted);

                // Calculate change (Last - First in period)
                const first = formatted[0].value;
                const last = formatted[formatted.length - 1].value;
                setWeightChange((last - first).toFixed(1));
            } else {
                setWeightHistory([]);
                setWeightChange(0);
            }

            // 3. Workout Stats (This Week)
            try {
                const today = new Date();
                const day = today.getDay(); // 0 (Sun) - 6 (Sat)
                const diff = day === 0 ? 6 : day - 1; // Adjust so Monday is 0, Sunday is 6

                const firstDayOfWeek = new Date(today);
                firstDayOfWeek.setDate(today.getDate() - diff); // Monday

                const endOfWeek = new Date(firstDayOfWeek);
                endOfWeek.setDate(firstDayOfWeek.getDate() + 6); // Sunday

                // Set end of week to end of the day to ensure we catch today's workouts
                endOfWeek.setHours(23, 59, 59, 999);

                const weekStart = firstDayOfWeek.toISOString().split('T')[0];
                const weekEnd = endOfWeek.toISOString(); // Send full ISO string to capture time

                const sessions = await api.getWorkoutStats(weekStart, weekEnd);

                // Aggregate
                let count = 0;
                let cals = 0;
                let mins = 0;

                if (sessions) {
                    count = sessions.length;
                    sessions.forEach(s => {
                        if (s.metrics) {
                            cals += (parseInt(s.metrics.caloriesBurned) || 0);
                            mins += (parseInt(s.metrics.durationMinutes) || 0);
                        } else if (s.completed_at && s.started_at) {
                            const start = new Date(s.started_at);
                            const end = new Date(s.completed_at);
                            const diffMs = end - start;
                            mins += Math.round(diffMs / 60000);
                        }
                    });
                }

                setWorkoutStats({
                    workoutsThisWeek: count,
                    caloriesBurned: cals,
                    totalMinutes: mins,
                    streakDays: 0,
                    history: sessions || []
                });
            } catch (statsError) {
                console.error("Failed to load workout stats:", statsError);
                // Don't fail the whole screen
            }

            // 4. Personal Records
            try {
                const prs = await api.getPersonalRecords();
                setPersonalRecords(prs || []);
            } catch (prError) {
                console.error("PR fetch failed:", prError);
            }




        } catch (error) {
            console.error("Fetch Data Error:", error);
            Alert.alert("Error", "Failed to load progress data");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [fetchData])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const handleSaveDetails = async () => {
        try {
            // Extract latest measurements from the nested object
            const measurements = editedDetails.body_measurements || {};

            // Update Profile: Sync both JSONB and top-level columns to ensure persistence
            // and overwrite any legacy "stuck" values.
            const profileToUpdate = {
                ...editedDetails,
                weight: newWeight,
                // Top-level overrides (match OnboardingSurvey schema where possible)
                waist: measurements.waist || null,
                hip: measurements.hips || measurements.hip || null, // Onboarding uses 'hip'
                chest: measurements.chest || null,
                arms: measurements.arms || null,
                thighs: measurements.thighs || null,

                // Ensure JSONB is also fully updated
                body_measurements: {
                    ...measurements,
                    hip: measurements.hips || measurements.hip // Standardize in JSON too
                }
            };

            await api.updateProfile(profileToUpdate);

            // Log Weight if changed
            if (newWeight && parseFloat(newWeight) !== parseFloat(currentWeight)) {
                try {
                    const today = new Date().toISOString().split('T')[0];
                    await api.logMeasurement(today, 'weight', parseFloat(newWeight));
                } catch (logError) {
                    console.error("Failed to log measurement history:", logError);
                    // Don't block UI update if only history logging fails
                }
            }

            Alert.alert('Success', 'Profile updated');
            setShowEditModal(false);
            onRefresh(); // Reload data
        } catch (e) {
            console.error(e);
            Alert.alert('Error', 'Failed to save profile');
        }
    };

    // Chart Config
    const chartConfig = {
        backgroundGradientFrom: "#ffffff",
        backgroundGradientTo: "#ffffff",
        color: (opacity = 1) => `rgba(49, 130, 206, ${opacity})`,
        strokeWidth: 2,
        barPercentage: 0.5,
        useShadowColorFromDataset: false
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.contentContainer}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                <Text style={styles.headerTitle}>Progress</Text>

                {/* 1. Weight Chart */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle}>Weight Trend</Text>
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{chartPeriod}</Text>
                        </View>
                    </View>

                    {weightHistory.length > 1 ? (
                        <LineChart
                            data={{
                                labels: weightHistory.map(w => w.label).filter((_, i) => i % Math.ceil(weightHistory.length / 6) === 0), // Thin out labels
                                datasets: [{ data: weightHistory.map(w => w.value) }]
                            }}
                            width={SCREEN_WIDTH - 60}
                            height={220}
                            yAxisSuffix="kg"
                            chartConfig={chartConfig}
                            bezier
                            style={{ marginVertical: 8, borderRadius: 16 }}
                        />
                    ) : (
                        <View style={styles.emptyChart}>
                            <Text style={styles.emptyText}>Not enough data for chart yet.</Text>
                            <Text style={styles.emptyText}>Log your weight to see trends.</Text>
                        </View>
                    )}

                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>Current</Text>
                            <Text style={styles.statValue}>{currentWeight} kg</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>Change</Text>
                            <Text style={[styles.statValue, { color: weightChange > 0 ? '#48BB78' : weightChange < 0 ? '#3182CE' : '#718096' }]}>
                                {weightChange > 0 ? '+' : ''}{weightChange} kg
                            </Text>
                        </View>
                    </View>
                </View>

                {/* 2. Personal Records */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>🏆 Personal Records</Text>
                    {personalRecords.length > 0 ? (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginLeft: -20, paddingLeft: 20 }}>
                            {personalRecords.map((pr, idx) => (
                                <View key={idx} style={styles.prCard}>
                                    <Text style={styles.prValue}>{pr.max_weight}<Text style={styles.prUnit}>kg</Text></Text>
                                    <Text style={styles.prLabel} numberOfLines={1}>{pr.exercise_name}</Text>
                                </View>
                            ))}
                        </ScrollView>
                    ) : (
                        <View style={styles.emptyPrCard}>
                            <Text style={styles.emptyText}>No records yet. Log a workout!</Text>
                        </View>
                    )}
                </View>

                {/* 3. Weekly Stats */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>This Week</Text>
                    <View style={styles.summaryRow}>
                        <View style={styles.summaryCard}>
                            <Text style={styles.summaryIcon}>💪</Text>
                            <Text style={styles.summaryValue}>{workoutStats.workoutsThisWeek}</Text>
                            <Text style={styles.summaryLabel}>Workouts</Text>
                        </View>
                        <View style={styles.summaryCard}>
                            <Text style={styles.summaryIcon}>🔥</Text>
                            <Text style={styles.summaryValue}>{workoutStats.caloriesBurned}</Text>
                            <Text style={styles.summaryLabel}>Calories</Text>
                        </View>
                        <View style={styles.summaryCard}>
                            <Text style={styles.summaryIcon}>⏱</Text>
                            <Text style={styles.summaryValue}>{workoutStats.totalMinutes}</Text>
                            <Text style={styles.summaryLabel}>Minutes</Text>
                        </View>
                    </View>
                </View>

                {/* 3. My Details Snippet */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle}>My Details</Text>
                        <TouchableOpacity onPress={() => setShowEditModal(true)}>
                            <Ionicons name="create-outline" size={24} color="#3182CE" />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.detailsGrid}>
                        <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>Height</Text>
                            <Text style={styles.detailValue}>{memberDetails.height || '-'} cm</Text>
                        </View>
                        <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>Weight</Text>
                            <Text style={styles.detailValue}>{memberDetails.weight || '-'} kg</Text>
                        </View>
                        <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>BMI</Text>
                            <Text style={styles.detailValue}>
                                {memberDetails.weight && memberDetails.height
                                    ? (memberDetails.weight / ((memberDetails.height / 100) ** 2)).toFixed(1)
                                    : '-'}
                            </Text>
                        </View>
                        <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>Waist</Text>
                            <Text style={styles.detailValue}>{memberDetails.body_measurements?.waist || memberDetails.waist || '-'} cm</Text>
                        </View>
                        <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>Hips</Text>
                            <Text style={styles.detailValue}>{memberDetails.body_measurements?.hips || memberDetails.body_measurements?.hip || memberDetails.hip || '-'} cm</Text>
                        </View>
                        <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>Chest</Text>
                            <Text style={styles.detailValue}>{memberDetails.body_measurements?.chest || memberDetails.chest || '-'} cm</Text>
                        </View>
                        <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>Arms</Text>
                            <Text style={styles.detailValue}>{memberDetails.body_measurements?.arms || memberDetails.arms || '-'} cm</Text>
                        </View>
                        <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>Thighs</Text>
                            <Text style={styles.detailValue}>{memberDetails.body_measurements?.thighs || memberDetails.thighs || '-'} cm</Text>
                        </View>
                    </View>
                </View>

            </ScrollView>

            {/* Edit Modal (Simplified for brevity) */}
            <Modal visible={showEditModal} animationType="slide" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Update Body Stats</Text>
                            <TouchableOpacity onPress={() => setShowEditModal(false)}>
                                <Ionicons name="close" size={24} color="#000" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={{ maxHeight: 400 }}>
                            <Text style={styles.label}>Weight (kg)</Text>
                            <TextInput
                                style={styles.input}
                                value={newWeight ? String(newWeight) : ''}
                                onChangeText={setNewWeight}
                                keyboardType="numeric"
                            />

                            <View style={styles.row}>
                                <View style={styles.halfInput}>
                                    <Text style={styles.label}>Waist (cm)</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={editedDetails.body_measurements?.waist || ''}
                                        onChangeText={t => setEditedDetails({
                                            ...editedDetails,
                                            body_measurements: { ...editedDetails.body_measurements, waist: t }
                                        })}
                                        keyboardType="numeric"
                                    />
                                </View>
                                <View style={styles.halfInput}>
                                    <Text style={styles.label}>Hips (cm)</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={editedDetails.body_measurements?.hips || ''}
                                        onChangeText={t => setEditedDetails({
                                            ...editedDetails,
                                            body_measurements: { ...editedDetails.body_measurements, hips: t }
                                        })}
                                        keyboardType="numeric"
                                    />
                                </View>
                            </View>

                            <View style={styles.row}>
                                <View style={styles.halfInput}>
                                    <Text style={styles.label}>Chest (cm)</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={editedDetails.body_measurements?.chest || ''}
                                        onChangeText={t => setEditedDetails({
                                            ...editedDetails,
                                            body_measurements: { ...editedDetails.body_measurements, chest: t }
                                        })}
                                        keyboardType="numeric"
                                    />
                                </View>
                                <View style={styles.halfInput}>
                                    <Text style={styles.label}>Arms (cm)</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={editedDetails.body_measurements?.arms || ''}
                                        onChangeText={t => setEditedDetails({
                                            ...editedDetails,
                                            body_measurements: { ...editedDetails.body_measurements, arms: t }
                                        })}
                                        keyboardType="numeric"
                                    />
                                </View>
                            </View>

                            <View style={styles.row}>
                                <View style={styles.halfInput}>
                                    <Text style={styles.label}>Thighs (cm)</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={editedDetails.body_measurements?.thighs || ''}
                                        onChangeText={t => setEditedDetails({
                                            ...editedDetails,
                                            body_measurements: { ...editedDetails.body_measurements, thighs: t }
                                        })}
                                        keyboardType="numeric"
                                    />
                                </View>
                            </View>
                        </ScrollView>

                        <TouchableOpacity style={styles.saveButton} onPress={handleSaveDetails}>
                            <Text style={styles.saveButtonText}>Save & Log</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F5F7FA' },
    container: { flex: 1 },
    contentContainer: { padding: 20, paddingBottom: 100 },
    headerTitle: { fontSize: 28, fontWeight: '800', color: '#1A202C', marginBottom: 20 },
    card: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    cardTitle: { fontSize: 18, fontWeight: '700', color: '#2D3748' },
    badge: { backgroundColor: '#EBF8FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    badgeText: { color: '#3182CE', fontSize: 12, fontWeight: '600' },

    emptyChart: { height: 180, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F7FAFC', borderRadius: 12 },
    emptyText: { color: '#718096', fontSize: 16, fontWeight: '600' },
    emptySubText: { color: '#A0AEC0', fontSize: 14, marginTop: 4 },

    statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 15 },
    statItem: { alignItems: 'center' },
    statLabel: { fontSize: 12, color: '#718096', marginBottom: 4 },
    statValue: { fontSize: 20, fontWeight: '700', color: '#2D3748' },

    section: { marginBottom: 20 },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: '#2D3748', marginBottom: 12 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
    summaryCard: { backgroundColor: '#fff', borderRadius: 12, padding: 15, width: '31%', alignItems: 'center', shadowOpacity: 0.05, elevation: 2 },
    summaryIcon: { fontSize: 24, marginBottom: 8 },
    summaryValue: { fontSize: 18, fontWeight: '700', color: '#2D3748' },
    summaryLabel: { fontSize: 11, color: '#718096' },

    detailsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    detailItem: { width: '48%', marginBottom: 15 },
    detailLabel: { fontSize: 12, color: '#718096' },
    detailValue: { fontSize: 16, fontWeight: '600', color: '#2D3748' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    modalContent: { backgroundColor: '#fff', borderRadius: 20, padding: 20 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: '700' },
    label: { fontSize: 14, fontWeight: '600', color: '#4A5568', marginTop: 10, marginBottom: 5 },
    input: { backgroundColor: '#F7FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, padding: 12, fontSize: 16 },
    saveButton: { backgroundColor: '#3182CE', marginTop: 20, padding: 15, borderRadius: 12, alignItems: 'center' },
    saveButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },

    prCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginRight: 12,
        width: 120,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    prValue: {
        fontSize: 22,
        fontWeight: '800',
        color: '#2B6CB0',
        marginBottom: 4,
    },
    prUnit: {
        fontSize: 14,
        fontWeight: '600',
        color: '#718096',
    },
    prLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#4A5568',
    },
    emptyPrCard: {
        padding: 20,
        backgroundColor: '#F7FAFC',
        borderRadius: 12,
        alignItems: 'center',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10
    },
    halfInput: {
        width: '48%'
    }
});

export default ProgressScreen;
