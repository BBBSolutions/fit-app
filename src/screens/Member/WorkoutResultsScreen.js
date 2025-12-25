import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    ScrollView,
    SafeAreaView,
    Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// Muscle Mapping (Percentages based on standard body outline)
// These need to be calibrated to the specific assets 'body_front.png' and 'body_back.png'
const MUSCLE_MAP = {
    // Front Muscles
    chest: { view: 'front', top: '23%', left: '35%', width: '30%', height: '10%' },
    pecs: { view: 'front', top: '23%', left: '35%', width: '30%', height: '10%' },
    shoulders: { view: 'front', top: '20%', left: '25%', width: '50%', height: '8%' },
    deltoids: { view: 'front', top: '20%', left: '25%', width: '50%', height: '8%' },
    biceps: { view: 'front', top: '28%', left: '20%', width: '10%', height: '12%', double: true }, // rough approx
    abs: { view: 'front', top: '35%', left: '42%', width: '16%', height: '15%' },
    core: { view: 'front', top: '35%', left: '42%', width: '16%', height: '15%' },
    quads: { view: 'front', top: '52%', left: '35%', width: '30%', height: '20%' },
    legs: { view: 'front', top: '52%', left: '35%', width: '30%', height: '20%' }, // Generic legs = quads for front

    // Back Muscles
    back: { view: 'back', top: '25%', left: '35%', width: '30%', height: '20%' },
    lats: { view: 'back', top: '28%', left: '32%', width: '36%', height: '15%' },
    traps: { view: 'back', top: '18%', left: '40%', width: '20%', height: '10%' },
    triceps: { view: 'back', top: '28%', left: '22%', width: '10%', height: '10%', double: true },
    glutes: { view: 'back', top: '48%', left: '35%', width: '30%', height: '10%' },
    hamstrings: { view: 'back', top: '60%', left: '35%', width: '30%', height: '15%' },
    calves: { view: 'back', top: '78%', left: '35%', width: '30%', height: '12%' },
};

const WorkoutResultsScreen = ({ navigation, route }) => {
    const { workout } = route.params || {};
    const [view, setView] = useState('front'); // 'front' or 'back'

    // Calculate Stats
    const totalExercises = workout?.exercises?.length || 0;
    const duration = workout?.duration || '0 min';
    const estimatedCalories = workout?.calories || totalExercises * 40; // Rough estimate if missing

    // Determine worked muscles
    // This assumes exercise names or generic 'target' fields contain muscle names
    // We'll simplisticly search exercise names and 'muscle' property against our MAP keys.
    const workedMuscles = new Set();

    useEffect(() => {
        if (workout?.exercises) {
            workout.exercises.forEach(ex => {
                const text = (ex.name + ' ' + (ex.target || '')).toLowerCase();
                Object.keys(MUSCLE_MAP).forEach(muscle => {
                    if (text.includes(muscle)) {
                        workedMuscles.add(muscle);
                    }
                });
            });
            // If no generic matches, simple default fallback logic could be added here
        }
    }, [workout]);

    const handleEdit = () => {
        // Navigate back to details
        // We use navigate to ensure we land on the details screen even if it wasn't immediately previous
        navigation.navigate('WorkoutDetail', {
            workoutId: workout.id,
            assignmentId: workout.assignmentId,
            title: workout.title,
            status: workout.status
        });
    };

    const renderHighlights = () => {
        // Filter muscles relevant to current view
        // In a real app, this would use SVGs. Here we overlay absolute Views.
        // Array.from(workedMuscles) ...
        const highlights = [];

        Object.keys(MUSCLE_MAP).forEach(key => {
            if (workedMuscles.has(key)) {
                const data = MUSCLE_MAP[key];
                if (data.view === view) {
                    highlights.push(
                        <View
                            key={key}
                            style={{
                                position: 'absolute',
                                top: data.top,
                                left: data.left,
                                width: data.width,
                                height: data.height,
                                backgroundColor: 'rgba(255, 0, 0, 0.4)', // Red glow
                                borderRadius: 10,
                                zIndex: 10,
                                shadowColor: 'red',
                                shadowOffset: { width: 0, height: 0 },
                                shadowOpacity: 0.8,
                                shadowRadius: 10,
                                elevation: 5
                            }}
                        />
                    );
                    // Handle double (left/right symmetry) simplistically if needed
                    // For now, the 'width/left' in map covers center or broad areas.
                    // Improving accuracy would require separate Left/Right entries in MAP.
                }
            }
        });

        return highlights;
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.container}>

                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Workout Complete!</Text>
                    <Text style={styles.headerSub}>Great job crushing your goals.</Text>
                </View>

                {/* Body Visualizer */}
                <View style={styles.visualizerContainer}>
                    <View style={styles.toggleContainer}>
                        <TouchableOpacity
                            style={[styles.toggleBtn, view === 'front' && styles.toggleBtnActive]}
                            onPress={() => setView('front')}
                        >
                            <Text style={[styles.toggleText, view === 'front' && styles.toggleTextActive]}>Front</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.toggleBtn, view === 'back' && styles.toggleBtnActive]}
                            onPress={() => setView('back')}
                        >
                            <Text style={[styles.toggleText, view === 'back' && styles.toggleTextActive]}>Back</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.bodyImageContainer}>
                        <Image
                            source={view === 'front' ? require('../../../assets/body_front.png') : require('../../../assets/body_back.png')}
                            style={styles.bodyImage}
                            resizeMode="contain"
                        />
                        {renderHighlights()}
                    </View>
                </View>

                {/* Stats Cards */}
                <View style={styles.statsGrid}>
                    <View style={styles.statCard}>
                        <Ionicons name="flash" size={24} color="#F6E05E" />
                        <Text style={styles.statValue}>{estimatedCalories}</Text>
                        <Text style={styles.statLabel}>Calories</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Ionicons name="time" size={24} color="#63B3ED" />
                        <Text style={styles.statValue}>{duration}</Text>
                        <Text style={styles.statLabel}>Duration</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Ionicons name="barbell" size={24} color="#F687B3" />
                        <Text style={styles.statValue}>{totalExercises}</Text>
                        <Text style={styles.statLabel}>Exercises</Text>
                    </View>
                </View>

                {/* Detail Summary */}
                <View style={styles.summarySection}>
                    <Text style={styles.sectionTitle}>Summary</Text>
                    <Text style={styles.summaryText}>
                        You focused mainly on <Text style={{ fontWeight: 'bold' }}>{Array.from(workedMuscles).join(', ') || 'General Fitness'}</Text> today.
                    </Text>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Bottom Action */}
            <View style={styles.bottomBar}>
                <TouchableOpacity style={styles.editBtn} onPress={handleEdit}>
                    <Text style={styles.editBtnText}>Edit Workout</Text>
                    <Ionicons name="create-outline" size={20} color="#fff" style={{ marginLeft: 8 }} />
                </TouchableOpacity>
            </View>

        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F7FAFC',
    },
    container: {
        paddingBottom: 40,
    },
    header: {
        padding: 24,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#2D3748',
        textAlign: 'center',
    },
    headerSub: {
        fontSize: 16,
        color: '#718096',
        marginTop: 8,
    },
    visualizerContainer: {
        alignItems: 'center',
        marginVertical: 10,
    },
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: '#EDF2F7',
        borderRadius: 20,
        padding: 4,
        marginBottom: 20,
    },
    toggleBtn: {
        paddingVertical: 8,
        paddingHorizontal: 24,
        borderRadius: 16,
    },
    toggleBtnActive: {
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    toggleText: {
        color: '#A0AEC0',
        fontWeight: '600',
    },
    toggleTextActive: {
        color: '#2D3748',
        fontWeight: '700',
    },
    bodyImageContainer: {
        width: 300,
        height: 450,
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',
    },
    bodyImage: {
        width: '100%',
        height: '100%',
        opacity: 0.8, // Slight fade to make highlights pop
    },
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingHorizontal: 20,
        marginTop: 20,
    },
    statCard: {
        backgroundColor: '#fff',
        width: '30%',
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    statValue: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2D3748',
        marginTop: 8,
    },
    statLabel: {
        fontSize: 12,
        color: '#718096',
        marginTop: 2,
    },
    summarySection: {
        padding: 24,
        marginTop: 10,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2D3748',
        marginBottom: 8,
    },
    summaryText: {
        fontSize: 15,
        color: '#4A5568',
        lineHeight: 22,
    },
    bottomBar: {
        position: 'absolute',
        bottom: 30,
        left: 20,
        right: 20,
    },
    editBtn: {
        backgroundColor: '#3182CE',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 16,
        borderRadius: 16,
        shadowColor: '#3182CE',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    editBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
    }
});

export default WorkoutResultsScreen;
