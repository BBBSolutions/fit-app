import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    SafeAreaView,
    ScrollView,
    Alert,
    Platform,
    Modal,
    FlatList,
    Image,
    ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';

const MemberCreateWorkoutScreen = ({ navigation }) => {
    const [workoutTitle, setWorkoutTitle] = useState('');
    const [exercises, setExercises] = useState([]); // Selected exercises

    // Exercise Library State
    const [libraryExercises, setLibraryExercises] = useState([]);
    const [filteredExercises, setFilteredExercises] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [showExerciseModal, setShowExerciseModal] = useState(false);
    const [loadingLibrary, setLoadingLibrary] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState("All");

    const flatListRef = React.useRef(null);

    // Dynamic Categories
    const categories = ["All", ...new Set(libraryExercises.map(ex => ex.category))].sort();

    const [loading, setLoading] = useState(false);

    const fetchLibrary = async () => {
        setLoadingLibrary(true);
        try {
            const data = await api.getExercises();
            setLibraryExercises(data || []);
            setFilteredExercises(data || []);
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Failed to load exercise library");
        } finally {
            setLoadingLibrary(false);
        }
    };

    const handleSearch = (text) => {
        setSearchQuery(text);
        applyFilters(text, selectedCategory);
    };

    const handleCategorySelect = (category) => {
        setSelectedCategory(category);
        applyFilters(searchQuery, category);
        // Scroll to top when category changes
        if (flatListRef.current) {
            flatListRef.current.scrollToOffset({ animated: true, offset: 0 });
        }
    };

    const applyFilters = (query, category) => {
        let filtered = libraryExercises;

        if (category && category !== "All") {
            filtered = filtered.filter(ex => ex.category === category);
        }

        if (query) {
            filtered = filtered.filter(ex =>
                ex.name.toLowerCase().includes(query.toLowerCase())
            );
        }

        setFilteredExercises(filtered);
    };

    const handleSelectExercise = (exercise) => {
        // Add to workout list with default sets/reps
        setExercises([...exercises, { ...exercise, sets: '3', reps: '12' }]);
        setShowExerciseModal(false);
        setSearchQuery('');
        setFilteredExercises(libraryExercises);
    };

    const handleRemoveExercise = (index) => {
        const newExercises = exercises.filter((_, i) => i !== index);
        setExercises(newExercises);
    };

    const updateExercise = (index, field, value) => {
        const newExercises = [...exercises];
        newExercises[index][field] = value;
        setExercises(newExercises);
    };

    const handleCreateWorkout = async () => {
        if (!workoutTitle.trim()) {
            Alert.alert('Missing Info', 'Please enter a workout name');
            return;
        }

        if (exercises.length === 0) {
            Alert.alert('Missing Info', 'Please add at least one exercise');
            return;
        }

        setLoading(true);
        try {
            const formattedExercises = exercises.map((ex, index) => ({
                id: (index + 1).toString(),
                name: ex.name,
                sets: parseInt(ex.sets) || 1,
                reps: parseInt(ex.reps) || 10,
                restTime: '60s',
                image_url: ex.image_url,
                video_url: ex.video_url
            }));

            const assignment = await api.createCustomWorkout({
                title: workoutTitle,
                exercises: formattedExercises
            });

            if (Platform.OS === 'web') {
                alert("Workout created! Starting now...");
                navigation.replace('WorkoutDetail', {
                    workoutId: assignment.workout_id,
                    assignmentId: assignment.id,
                    title: workoutTitle,
                    status: 'assigned'
                });
            } else {
                Alert.alert("Success", "Workout created! Starting now...", [
                    {
                        text: "OK", onPress: () => {
                            navigation.replace('WorkoutDetail', {
                                workoutId: assignment.workout_id,
                                assignmentId: assignment.id,
                                title: workoutTitle,
                                status: 'assigned'
                            });
                        }
                    }
                ]);
            }

        } catch (error) {
            console.error("Failed to create workout:", error);
            Alert.alert("Error", "Failed to create workout. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // Load library on open modal if empty
    const openLibrary = () => {
        if (libraryExercises.length === 0) {
            fetchLibrary();
        }
        setShowExerciseModal(true);
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>

                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#2D3748" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Create Custom Workout</Text>
                </View>

                {/* Workout Name */}
                <View style={styles.formSection}>
                    <Text style={styles.label}>Workout Name</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g., Full Body Blast"
                        value={workoutTitle}
                        onChangeText={setWorkoutTitle}
                    />
                </View>

                {/* Exercises List */}
                <View style={styles.exercisesSection}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <Text style={styles.sectionTitle}>Exercises</Text>
                        <TouchableOpacity style={styles.addExerciseButton} onPress={openLibrary}>
                            <Ionicons name="add" size={20} color="#fff" />
                            <Text style={styles.addExerciseText}>Add Exercise</Text>
                        </TouchableOpacity>
                    </View>

                    {exercises.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>No exercises added yet.</Text>
                            <Text style={styles.emptySubText}>Tap "Add Exercise" to select from library.</Text>
                        </View>
                    ) : (
                        exercises.map((exercise, index) => (
                            <View key={index} style={styles.exerciseCard}>
                                <View style={styles.exerciseInfoRow}>
                                    {/* Thumbnail (if available) - checking both camel and snake case just in case */}
                                    {(exercise.image_url || exercise.imageUrl) && (
                                        <Image
                                            source={{ uri: exercise.image_url || exercise.imageUrl }}
                                            style={styles.exerciseThumb}
                                        />
                                    )}
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.exerciseName}>{exercise.name}</Text>
                                        <Text style={styles.exerciseCategory}>{exercise.category}</Text>
                                    </View>
                                    <TouchableOpacity onPress={() => handleRemoveExercise(index)}>
                                        <Ionicons name="trash-outline" size={20} color="#E53E3E" />
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.setsRow}>
                                    <View style={styles.setInputGroup}>
                                        <Text style={styles.subLabel}>Sets</Text>
                                        <TextInput
                                            style={styles.smallInput}
                                            keyboardType="numeric"
                                            value={String(exercise.sets)}
                                            onChangeText={(text) => updateExercise(index, 'sets', text)}
                                        />
                                    </View>
                                    <View style={styles.setInputGroup}>
                                        <Text style={styles.subLabel}>Reps</Text>
                                        <TextInput
                                            style={styles.smallInput}
                                            keyboardType="numeric"
                                            value={String(exercise.reps)}
                                            onChangeText={(text) => updateExercise(index, 'reps', text)}
                                        />
                                    </View>
                                </View>
                            </View>
                        ))
                    )}
                </View>

                {/* Create Button */}
                <TouchableOpacity
                    style={[styles.createButton, loading && styles.disabledButton]}
                    onPress={handleCreateWorkout}
                    disabled={loading}
                >
                    <Text style={styles.createButtonText}>
                        {loading ? "Creating..." : "Start Workout"}
                    </Text>
                </TouchableOpacity>

            </ScrollView>

            {/* Exercise Selection Modal */}
            <Modal visible={showExerciseModal} animationType="slide" presentationStyle="pageSheet">
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Select Exercise</Text>
                        <TouchableOpacity onPress={() => setShowExerciseModal(false)}>
                            <Text style={styles.closeText}>Close</Text>
                        </TouchableOpacity>
                    </View>

                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search exercises..."
                        value={searchQuery}
                        onChangeText={handleSearch}
                    />

                    {/* Category Filter Chips */}
                    <View style={{ height: 50, marginBottom: 10 }}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 15 }}>
                            {categories.map((cat) => (
                                <TouchableOpacity
                                    key={cat}
                                    style={[
                                        styles.categoryChip,
                                        selectedCategory === cat && styles.selectedChip
                                    ]}
                                    onPress={() => handleCategorySelect(cat)}
                                >
                                    <Text style={[
                                        styles.categoryChipText,
                                        selectedCategory === cat && styles.selectedChipText
                                    ]}>{cat}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    {loadingLibrary ? (
                        <ActivityIndicator size="large" color="#3182CE" style={{ marginTop: 50 }} />
                    ) : (
                        <FlatList
                            ref={flatListRef}
                            data={filteredExercises}
                            keyExtractor={(item) => item.id}
                            numColumns={4}
                            key="grid-4" // Force re-render for column change
                            columnWrapperStyle={styles.columnWrapper}
                            contentContainerStyle={{ paddingBottom: 20 }}
                            initialNumToRender={24}
                            maxToRenderPerBatch={24}
                            windowSize={5}
                            removeClippedSubviews={true}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.gridItem}
                                    onPress={() => handleSelectExercise(item)}
                                >
                                    <View style={styles.gridImageContainer}>
                                        <Image
                                            source={{ uri: item.image_url || 'https://via.placeholder.com/150' }}
                                            style={styles.gridThumb}
                                            resizeMode="cover"
                                        />
                                        {/* Overlay Checkmark or 'Add' indication? */}
                                        <View style={styles.addIconOverlay}>
                                            <Ionicons name="add" size={12} color="#fff" />
                                        </View>
                                    </View>
                                    <Text style={styles.gridName} numberOfLines={2}>{item.name}</Text>
                                    {/* <Text style={styles.gridCategory} numberOfLines={1}>{item.category}</Text> */}
                                </TouchableOpacity>
                            )}
                        />
                    )}
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F5F7FA' },
    container: { flex: 1 },
    contentContainer: { padding: 20, paddingBottom: 40 },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
    backButton: { marginRight: 16 },
    headerTitle: { fontSize: 24, fontWeight: '800', color: '#1A202C' },
    formSection: { marginBottom: 24 },
    label: { fontSize: 16, fontWeight: '600', color: '#4A5568', marginBottom: 8 },
    input: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, fontSize: 16, color: '#2D3748', borderWidth: 1, borderColor: '#E2E8F0' },
    exercisesSection: { marginBottom: 24 },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: '#2D3748' },

    addExerciseButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#3182CE', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
    addExerciseText: { color: '#fff', fontWeight: '600', marginLeft: 6, fontSize: 14 },

    emptyState: { alignItems: 'center', padding: 30, backgroundColor: '#EDF2F7', borderRadius: 12, borderStyle: 'dashed', borderWidth: 2, borderColor: '#CBD5E0' },
    emptyText: { color: '#4A5568', fontWeight: '600', fontSize: 16 },
    emptySubText: { color: '#718096', marginTop: 4 },

    exerciseCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#E2E8F0' },
    exerciseInfoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    exerciseThumb: { width: 50, height: 50, borderRadius: 8, marginRight: 12, backgroundColor: '#E2E8F0' },
    exerciseName: { fontWeight: '700', fontSize: 16, color: '#2D3748' },
    exerciseCategory: { fontSize: 12, color: '#718096' },

    setsRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#EDF2F7', paddingTop: 12 },
    setInputGroup: { marginRight: 20, width: 60 },
    subLabel: { fontSize: 11, color: '#718096', marginBottom: 4 },
    smallInput: { backgroundColor: '#EDF2F7', borderRadius: 8, padding: 8, textAlign: 'center', fontWeight: 'bold' },

    createButton: { backgroundColor: '#48BB78', borderRadius: 12, paddingVertical: 16, alignItems: 'center', shadowColor: '#48BB78', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
    disabledButton: { backgroundColor: '#A0AEC0', shadowOpacity: 0 },
    createButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },

    // Modal Styles
    modalContainer: { flex: 1, backgroundColor: '#fff', paddingTop: 20 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#EDF2F7' },
    modalTitle: { fontSize: 18, fontWeight: '700' },
    closeText: { color: '#3182CE', fontSize: 16 },
    searchInput: { margin: 15, backgroundColor: '#F7FAFC', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0' },
    // Grid Styles
    columnWrapper: { justifyContent: 'flex-start', paddingHorizontal: 10 },
    gridItem: {
        flex: 1 / 4,
        margin: 5,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 6,
        borderWidth: 1,
        borderColor: '#EDF2F7',
        alignItems: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1
    },
    gridImageContainer: {
        width: '100%',
        aspectRatio: 1,
        borderRadius: 8,
        overflow: 'hidden',
        marginBottom: 6,
        position: 'relative',
        backgroundColor: '#F7FAFC'
    },
    gridThumb: { width: '100%', height: '100%' },
    gridName: { fontSize: 12, fontWeight: '700', color: '#2D3748', textAlign: 'center', marginBottom: 2 },
    gridCategory: { fontSize: 9, color: '#718096', textAlign: 'center' },

    addIconOverlay: {
        position: 'absolute', bottom: 4, right: 4, backgroundColor: '#3182CE', borderRadius: 8, width: 18, height: 18, justifyContent: 'center', alignItems: 'center'
    },

    // Category Chips
    categoryChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#EDF2F7', marginRight: 10, alignSelf: 'center' },
    selectedChip: { backgroundColor: '#3182CE' },
    categoryChipText: { fontSize: 14, fontWeight: '600', color: '#4A5568' },
    selectedChipText: { color: '#FFFFFF' }
});

export default MemberCreateWorkoutScreen;
