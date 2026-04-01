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

    const [selectedMetric, setSelectedMetric] = useState('weight');
    const [chartData, setChartData] = useState([]);
    const [metricHistory, setMetricHistory] = useState([]); // Raw history for analysis
    const [analysis, setAnalysis] = useState({ change: 0, avgWeekly: 0, direction: 'neutral' });

    // Measurements Config
    const metrics = [
        { id: 'weight', label: 'Weight', unit: 'kg' },
        { id: 'waist', label: 'Waist', unit: 'cm' },
        { id: 'hips', label: 'Hips', unit: 'cm' },
        { id: 'chest', label: 'Chest', unit: 'cm' },
        { id: 'arms', label: 'Arms', unit: 'cm' },
        { id: 'thighs', label: 'Thighs', unit: 'cm' },
    ];

    // Edit Modal
    // Edit Modal
    const [showEditModal, setShowEditModal] = useState(false);
    const [editedDetails, setEditedDetails] = useState({});
    const [newWeight, setNewWeight] = useState(''); // Specific for Weight input
    const [newValue, setNewValue] = useState(''); // Generic value placeholder if needed

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

            // 2. Metric History
            const endDate = new Date().toISOString().split('T')[0];
            const startDateObj = new Date();
            if (chartPeriod === '1 Month') startDateObj.setDate(startDateObj.getDate() - 30);
            else if (chartPeriod === '3 Months') startDateObj.setDate(startDateObj.getDate() - 90);
            else startDateObj.setDate(startDateObj.getDate() - 365); // All/Year

            const startDate = startDateObj.toISOString().split('T')[0];

            // Use selectedMetric
            const history = await api.getMeasurementHistory(selectedMetric, startDate, endDate);
            setMetricHistory(history || []);

            // Format for Chart
            if (history && history.length > 0) {
                // Sort by date just in case
                const sorted = [...history].sort((a, b) => new Date(a.date) - new Date(b.date));

                // Thin out data points for chart readability if too many
                const formatted = sorted.map(h => ({
                    value: parseFloat(h.value),
                    date: h.date,
                    label: `${new Date(h.date).getDate()}/${new Date(h.date).getMonth() + 1}`
                }));

                setChartData(formatted);

                // Calculate Analysis
                if (sorted.length >= 2) {
                    const latest = parseFloat(sorted[sorted.length - 1].value);
                    const initial = parseFloat(sorted[0].value);
                    const totalChange = (latest - initial).toFixed(1);

                    // Simple trend analysis
                    const direction = totalChange < 0 ? 'down' : totalChange > 0 ? 'up' : 'neutral';

                    // Calculate rough weekly average
                    const weeks = Math.max(1, (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24 * 7));
                    const avgWeekly = (totalChange / weeks).toFixed(2);

                    setAnalysis({ change: totalChange, avgWeekly, direction });
                } else {
                    setAnalysis({ change: 0, avgWeekly: 0, direction: 'neutral' });
                }
            } else {
                setChartData([]);
                setAnalysis({ change: 0, avgWeekly: 0, direction: 'neutral' });
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
    }, [selectedMetric, chartPeriod]);

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
                hip: measurements.hips || measurements.hip || null,
                chest: measurements.chest || null,
                arms: measurements.arms || null,
                thighs: measurements.thighs || null,

                // Ensure JSONB is also fully updated
                body_measurements: {
                    ...measurements,
                    hip: measurements.hips || measurements.hip
                }
            };

            await api.updateProfile(profileToUpdate);

            // Log Metrics History if changed
            const today = new Date().toISOString().split('T')[0];

            // 1. Weight
            if (newWeight && parseFloat(newWeight) !== parseFloat(currentWeight)) {
                try {
                    await api.logMeasurement(today, 'weight', parseFloat(newWeight));
                } catch (e) { console.error("Log weight failed", e); }
            }

            // 2. Other Measurements (Waist, Hips, etc.)
            // Compare editedDetails.body_measurements with memberDetails.body_measurements
            const oldMeasures = memberDetails.body_measurements || {};
            const newMeasures = measurements;

            // Map frontend keys to backend 'type' strings
            const keyMap = {
                waist: 'waist',
                hips: 'hips', // or 'hip' depending on backend convention, usage seems mixed but 'hips' in metrics array
                chest: 'chest',
                arms: 'arms',
                thighs: 'thighs'
            };

            for (const [key, type] of Object.entries(keyMap)) {
                const oldVal = oldMeasures[key];
                const newVal = newMeasures[key]; // Note: key in newMeasures depends on how TextInput updates it

                // Handle 'hips' vs 'hip' ambiguity in newMeasures if needed, but TextInput updates keys directly
                // If value changed and is not empty
                if (newVal && newVal !== oldVal) {
                    try {
                        await api.logMeasurement(today, type, parseFloat(newVal));
                    } catch (e) { console.error(`Log ${type} failed`, e); }
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

                {/* Metric Selector */}
                <View style={styles.selectorContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {metrics.map(m => (
                            <TouchableOpacity
                                key={m.id}
                                style={[styles.selectorChip, selectedMetric === m.id && styles.selectorChipActive]}
                                onPress={() => setSelectedMetric(m.id)}
                            >
                                <Text style={[styles.selectorText, selectedMetric === m.id && styles.selectorTextActive]}>
                                    {m.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* 1. Main Chart Card */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle}>
                            {metrics.find(m => m.id === selectedMetric)?.label} Trend
                        </Text>
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{chartPeriod}</Text>
                        </View>
                    </View>

                    {chartData.length > 0 ? (
                        <LineChart
                            data={{
                                labels: chartData.map(w => w.label).filter((_, i) => i % Math.ceil(chartData.length / 6) === 0),
                                datasets: [{ data: chartData.map(w => w.value) }]
                            }}
                            width={SCREEN_WIDTH - 60}
                            height={220}
                            yAxisSuffix={metrics.find(m => m.id === selectedMetric)?.unit}
                            chartConfig={chartConfig}
                            bezier
                            style={{ marginVertical: 8, borderRadius: 16 }}
                        />
                    ) : (
                        <View style={styles.emptyChart}>
                            <Text style={styles.emptyText}>No data for {metrics.find(m => m.id === selectedMetric)?.label} yet.</Text>
                            <Text style={styles.emptySubText}>Log an entry to see trends.</Text>
                        </View>
                    )}

                    {/* Analysis Section within Card */}
                    <View style={styles.analysisContainer}>
                        <View style={styles.analysisRow}>
                            <View>
                                <Text style={styles.analysisLabel}>Total Change</Text>
                                <Text style={[styles.analysisValue, {
                                    color: analysis.direction === 'neutral' ? '#718096'
                                        : (selectedMetric === 'weight' && analysis.direction === 'down') || (selectedMetric !== 'weight' && analysis.direction === 'up')
                                            ? '#48BB78' : '#E53E3E'
                                }]}>
                                    {analysis.change > 0 ? '+' : ''}{analysis.change} {metrics.find(m => m.id === selectedMetric)?.unit}
                                </Text>
                            </View>
                            <View>
                                <Text style={styles.analysisLabel}>Avg. Weekly</Text>
                                <Text style={styles.analysisValue}>
                                    {analysis.avgWeekly > 0 ? '+' : ''}{analysis.avgWeekly} {metrics.find(m => m.id === selectedMetric)?.unit}
                                </Text>
                            </View>
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
    },
    // New Styles for Selector
    selectorContainer: {
        marginBottom: 20,
    },
    selectorChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#fff',
        borderRadius: 20,
        marginRight: 10,
        borderWidth: 1,
        borderColor: '#E2E8F0'
    },
    selectorChipActive: {
        backgroundColor: '#3182CE',
        borderColor: '#3182CE'
    },
    selectorText: {
        color: '#718096',
        fontWeight: '600'
    },
    selectorTextActive: {
        color: '#fff'
    },
    // New Styles for Analysis
    analysisContainer: {
        marginTop: 20,
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0'
    },
    analysisRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 10
    },
    analysisLabel: {
        fontSize: 12,
        color: '#718096',
        marginBottom: 4
    },
    analysisValue: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2D3748'
    }
});

export default ProgressScreen;
