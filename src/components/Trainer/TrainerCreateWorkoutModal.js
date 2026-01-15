
import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Modal,
    FlatList,
    Image,
    ActivityIndicator,
    Alert,
    ScrollView,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';

const TrainerCreateWorkoutModal = ({ visible, onClose, onSave, loadingSave }) => {
    const [workoutTitle, setWorkoutTitle] = useState('');
    const [exercises, setExercises] = useState([]); // Selected exercises

    // Exercise Library State
    const [libraryExercises, setLibraryExercises] = useState([]);
    const [filteredExercises, setFilteredExercises] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [showExercisePicker, setShowExercisePicker] = useState(false);
    const [loadingLibrary, setLoadingLibrary] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState("All");

    const flatListRef = useRef(null);

    // Dynamic Categories
    const categories = ["All", ...new Set(libraryExercises.map(ex => ex.category))].sort();

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
        setExercises([...exercises, { ...exercise, sets: '3', reps: '12', restTime: '60s' }]);
        setShowExercisePicker(false);
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

    const handleSave = () => {
        if (!workoutTitle.trim()) {
            Alert.alert('Missing Info', 'Please enter a workout name');
            return;
        }

        if (exercises.length === 0) {
            Alert.alert('Missing Info', 'Please add at least one exercise');
            return;
        }

        const formattedExercises = exercises.map((ex, index) => ({
            id: (index + 1).toString(),
            name: ex.name,
            sets: parseInt(ex.sets) || 1,
            reps: parseInt(ex.reps) || 10,
            restTime: ex.restTime || '60s',
            image_url: ex.image_url,
            video_url: ex.video_url
        }));

        const workoutData = {
            title: workoutTitle,
            exercises: formattedExercises
        };

        onSave(workoutData);
    };

    const openLibrary = () => {
        if (libraryExercises.length === 0) {
            fetchLibrary();
        }
        setShowExercisePicker(true);
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <View style={styles.modalContainer}>
                {/* Main Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Create Custom Plan</Text>
                    <TouchableOpacity onPress={onClose}>
                        <Text style={styles.closeText}>Cancel</Text>
                    </TouchableOpacity>
                </View>

                <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
                    <ScrollView style={styles.scrollContainer} contentContainerStyle={{ paddingBottom: 40 }}>
                        {/* Workout Name */}
                        <View style={styles.section}>
                            <Text style={styles.label}>Plan Name</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. Strength Phase 1"
                                value={workoutTitle}
                                onChangeText={setWorkoutTitle}
                            />
                        </View>

                        {/* Exercises List */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>Exercises ({exercises.length})</Text>
                                <TouchableOpacity style={styles.addButton} onPress={openLibrary}>
                                    <Ionicons name="add" size={16} color="#FFF" />
                                    <Text style={styles.addButtonText}>Add</Text>
                                </TouchableOpacity>
                            </View>

                            {exercises.length === 0 ? (
                                <View style={styles.emptyState}>
                                    <Text style={styles.emptyText}>No exercises added.</Text>
                                </View>
                            ) : (
                                exercises.map((exercise, index) => (
                                    <View key={index} style={styles.exerciseCard}>
                                        <View style={styles.cardHeader}>
                                            <Text style={styles.exerciseName}>{exercise.name}</Text>
                                            <TouchableOpacity onPress={() => handleRemoveExercise(index)}>
                                                <Ionicons name="trash-outline" size={20} color="#E53E3E" />
                                            </TouchableOpacity>
                                        </View>

                                        <View style={styles.inputsRow}>
                                            <View style={styles.inputGroup}>
                                                <Text style={styles.inputLabel}>Sets</Text>
                                                <TextInput
                                                    style={styles.smallInput}
                                                    keyboardType="numeric"
                                                    value={String(exercise.sets)}
                                                    onChangeText={(text) => updateExercise(index, 'sets', text)}
                                                />
                                            </View>
                                            <View style={styles.inputGroup}>
                                                <Text style={styles.inputLabel}>Reps</Text>
                                                <TextInput
                                                    style={styles.smallInput}
                                                    keyboardType="numeric"
                                                    value={String(exercise.reps)}
                                                    onChangeText={(text) => updateExercise(index, 'reps', text)}
                                                />
                                            </View>
                                            <View style={[styles.inputGroup, { flex: 1.5 }]}>
                                                <Text style={styles.inputLabel}>Rest</Text>
                                                <TextInput
                                                    style={styles.smallInput}
                                                    value={String(exercise.restTime || '')}
                                                    placeholder="e.g. 60s"
                                                    onChangeText={(text) => updateExercise(index, 'restTime', text)}
                                                />
                                            </View>
                                        </View>
                                    </View>
                                ))
                            )}
                        </View>
                    </ScrollView>

                    {/* Footer / Save Button */}
                    <View style={styles.footer}>
                        <TouchableOpacity
                            style={[styles.saveButton, loadingSave && styles.saveButtonDisabled]}
                            onPress={handleSave}
                            disabled={loadingSave}
                        >
                            <Text style={styles.saveButtonText}>{loadingSave ? "Creating..." : "Create & Assign Plan"}</Text>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>

                {/* Sub-Modal: Exercise Picker */}
                <Modal visible={showExercisePicker} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowExercisePicker(false)}>
                    <View style={styles.pickerContainer}>
                        <View style={styles.pickerHeader}>
                            <Text style={styles.pickerTitle}>Select Exercise</Text>
                            <TouchableOpacity onPress={() => setShowExercisePicker(false)}>
                                <Text style={styles.closeText}>Close</Text>
                            </TouchableOpacity>
                        </View>

                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search exercises..."
                            value={searchQuery}
                            onChangeText={handleSearch}
                        />

                        {/* Category Filter */}
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
                            <ActivityIndicator size="large" color="#3182CE" style={{ marginTop: 40 }} />
                        ) : (
                            <FlatList
                                ref={flatListRef}
                                data={filteredExercises}
                                keyExtractor={(item) => item.id}
                                numColumns={3}
                                contentContainerStyle={{ padding: 10 }}
                                renderItem={({ item }) => (
                                    <TouchableOpacity style={styles.gridItem} onPress={() => handleSelectExercise(item)}>
                                        <Image
                                            source={{ uri: item.image_url || 'https://via.placeholder.com/150' }}
                                            style={styles.gridImage}
                                        />
                                        <Text style={styles.gridLabel} numberOfLines={2}>{item.name}</Text>
                                    </TouchableOpacity>
                                )}
                            />
                        )}
                    </View>
                </Modal>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalContainer: { flex: 1, backgroundColor: '#F7FAFC' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#EDF2F7' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#1A202C' },
    closeText: { fontSize: 16, color: '#3182CE', fontWeight: '600' },

    scrollContainer: { flex: 1, padding: 20 },
    section: { marginBottom: 24 },
    label: { fontSize: 15, fontWeight: '600', color: '#4A5568', marginBottom: 8 },
    input: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, padding: 12, fontSize: 16, color: '#2D3748' },

    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: '#2D3748' },
    addButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#3182CE', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    addButtonText: { color: '#FFF', fontSize: 12, fontWeight: '700', marginLeft: 4 },

    emptyState: { padding: 30, alignItems: 'center', backgroundColor: '#EDF2F7', borderRadius: 12, borderStyle: 'dashed', borderWidth: 1, borderColor: '#CBD5E0' },
    emptyText: { color: '#718096' },

    exerciseCard: { backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
    exerciseName: { fontSize: 16, fontWeight: '700', color: '#2D3748', flex: 1, marginRight: 10 },

    inputsRow: { flexDirection: 'row', justifyContent: 'space-between' },
    inputGroup: { flex: 1, marginRight: 10 },
    inputLabel: { fontSize: 12, color: '#718096', marginBottom: 4 },
    smallInput: { backgroundColor: '#F7FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, padding: 8, textAlign: 'center', color: '#2D3748', fontWeight: '600' },

    footer: { padding: 20, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#EDF2F7', paddingBottom: Platform.OS === 'ios' ? 40 : 20 },
    saveButton: { backgroundColor: '#48BB78', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
    saveButtonDisabled: { backgroundColor: '#A0AEC0' },
    saveButtonText: { color: '#FFF', fontSize: 18, fontWeight: '700' },

    // Picker Styles
    pickerContainer: { flex: 1, backgroundColor: '#FFF', paddingTop: 20 },
    pickerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#EDF2F7' },
    pickerTitle: { fontSize: 18, fontWeight: '700' },
    searchInput: { margin: 15, backgroundColor: '#F7FAFC', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0' },

    categoryChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#EDF2F7', marginRight: 10, alignSelf: 'center' },
    selectedChip: { backgroundColor: '#3182CE' },
    categoryChipText: { fontSize: 14, fontWeight: '600', color: '#4A5568' },
    selectedChipText: { color: '#FFFFFF' },

    gridItem: { flex: 1 / 3, margin: 4, aspectRatio: 0.8, backgroundColor: '#F7FAFC', borderRadius: 8, padding: 4, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
    gridImage: { width: '80%', height: '60%', resizeMode: 'contain', marginBottom: 4 },
    gridLabel: { fontSize: 11, textAlign: 'center', color: '#2D3748', fontWeight: '600' }
});

export default TrainerCreateWorkoutModal;
