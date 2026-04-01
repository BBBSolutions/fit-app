import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    SafeAreaView,
    Platform,
    Modal,
    Alert,
    KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';

const DietLoggingScreen = ({ navigation }) => {
    const [dailyCalories, setDailyCalories] = useState(1450);
    const [recommendedCalories] = useState(2200);
    const [waterIntake, setWaterIntake] = useState(1500);
    const [waterGoal] = useState(5000);

    const [meals, setMeals] = useState([
        {
            id: 1,
            category: 'Breakfast',
            name: 'Oatmeal with Berries',
            calories: 350,
            protein: 12,
            carbs: 58,
            fat: 8,
            notes: 'With almond milk',
        },
        {
            id: 2,
            category: 'Lunch',
            name: 'Grilled Chicken Salad',
            calories: 450,
            protein: 35,
            carbs: 25,
            fat: 18,
            notes: '',
        },
    ]);

    const [showMealModal, setShowMealModal] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [editingMealId, setEditingMealId] = useState(null);
    const [newMeal, setNewMeal] = useState({
        name: '',
        calories: '',
        protein: '',
        carbs: '',
        fat: '',
        notes: '',
    });

    const openMealModal = (category) => {
        setSelectedCategory(category);
        setEditingMealId(null);
        setNewMeal({ name: '', calories: '', protein: '', carbs: '', fat: '', notes: '' });
        setShowMealModal(true);
    };

    const editMeal = (meal) => {
        setSelectedCategory(meal.category);
        setEditingMealId(meal.id);
        setNewMeal({
            name: meal.name,
            calories: String(meal.calories),
            protein: String(meal.protein),
            carbs: String(meal.carbs),
            fat: String(meal.fat),
            notes: meal.notes || '',
        });
        setShowMealModal(true);
    };

    const saveMealEntry = () => {
        if (!newMeal.name || !newMeal.calories) {
            if (Platform.OS === 'web') {
                alert('Please enter food name and calories');
            } else {
                Alert.alert('Error', 'Please enter food name and calories');
            }
            return;
        }

        const caloriesVal = parseInt(newMeal.calories) || 0;
        const proteinVal = parseInt(newMeal.protein) || 0;
        const carbsVal = parseInt(newMeal.carbs) || 0;
        const fatVal = parseInt(newMeal.fat) || 0;

        if (editingMealId) {
            // Update Existing Logic
            const updatedMeals = meals.map(m => {
                if (m.id === editingMealId) {
                    return {
                        ...m,
                        name: newMeal.name,
                        calories: caloriesVal,
                        protein: proteinVal,
                        carbs: carbsVal,
                        fat: fatVal,
                        notes: newMeal.notes
                    };
                }
                return m;
            });

            // Calculate diff for calories
            const oldMeal = meals.find(m => m.id === editingMealId);
            const oldCals = oldMeal ? oldMeal.calories : 0;
            const diff = caloriesVal - oldCals;

            setMeals(updatedMeals);
            setDailyCalories(dailyCalories + diff);

        } else {
            // Add New Logic
            const meal = {
                id: Date.now(),
                category: selectedCategory,
                name: newMeal.name,
                calories: caloriesVal,
                protein: proteinVal,
                carbs: carbsVal,
                fat: fatVal,
                notes: newMeal.notes,
            };

            setMeals([...meals, meal]);
            setDailyCalories(dailyCalories + meal.calories);
        }

        setShowMealModal(false);
        setNewMeal({
            name: '',
            calories: '',
            protein: '',
            carbs: '',
            fat: '',
            notes: '',
        });
        setEditingMealId(null);
    };

    const deleteMeal = (id) => {
        const meal = meals.find((m) => m.id === id);

        const performDelete = () => {
            setMeals(meals.filter((m) => m.id !== id));
            setDailyCalories(dailyCalories - meal.calories);
        };

        if (Platform.OS === 'web') {
            if (window.confirm('Are you sure you want to delete this meal?')) {
                performDelete();
            }
        } else {
            Alert.alert('Delete Meal', 'Are you sure you want to delete this meal?', [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: performDelete,
                },
            ]);
        }
    };

    const adjustWater = (amount) => {
        const newAmount = Math.max(0, waterIntake + amount);
        setWaterIntake(newAmount);
    };

    const [initialData, setInitialData] = useState(null);
    const [selectedDate, setSelectedDate] = useState(new Date());

    const isToday = useMemo(() => {
        const now = new Date();
        return (
            selectedDate.getDate() === now.getDate() &&
            selectedDate.getMonth() === now.getMonth() &&
            selectedDate.getFullYear() === now.getFullYear()
        );
    }, [selectedDate]);

    const changeDate = (days) => {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() + days);
        if (newDate > new Date()) return;
        
        if (hasUnsavedChanges()) {
            Alert.alert(
                'Unsaved Changes',
                'You have unsaved changes. Discard them?',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Discard', style: 'destructive', onPress: () => setSelectedDate(newDate) }
                ]
            );
        } else {
            setSelectedDate(newDate);
        }
    };

    const dateStr = useMemo(() => {
        const d = selectedDate;
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }, [selectedDate]);

    const loadDietData = async () => {
        try {
            const log = await api.getDietLog(dateStr);
            if (log) {
                const loadedMeals = log.meals || [];
                const loadedWater = log.water_intake || 0;
                const loadedCalories = log.daily_calories || 0;

                setMeals(loadedMeals);
                setWaterIntake(loadedWater);
                setDailyCalories(loadedCalories);

                setInitialData({
                    meals: JSON.stringify(loadedMeals),
                    water: loadedWater,
                    calories: loadedCalories
                });
            } else {
                setMeals([]);
                setWaterIntake(0);
                setDailyCalories(0);
                setInitialData({
                    meals: JSON.stringify([]),
                    water: 0,
                    calories: 0
                });
            }
        } catch (error) {
            console.error("Error loading diet log:", error);
            setMeals([]);
            setWaterIntake(0);
            setDailyCalories(0);
            setInitialData({
                meals: JSON.stringify([]),
                water: 0,
                calories: 0
            });
        }
    };

    useEffect(() => {
        loadDietData();
    }, [dateStr]);

    const hasUnsavedChanges = () => {
        if (!initialData) return false;
        const currentMealsStr = JSON.stringify(meals);
        const hasMealsChanged = currentMealsStr !== initialData.meals;
        const hasWaterChanged = waterIntake !== initialData.water;
        return hasMealsChanged || hasWaterChanged;
    };

    const handleSave = async () => {
        try {
            await api.saveDietLog(dateStr, {
                daily_calories: dailyCalories,
                water_intake: waterIntake,
                meals: meals
            });

            // Update initial data to match saved data using functional update or re-fetching?
            // Simply setting specific values is cleaner than re-fetching
            setInitialData({
                meals: JSON.stringify(meals),
                water: waterIntake,
                calories: dailyCalories
            });

            Alert.alert('Success', 'Daily log saved successfully!');
            // Optional: navigation.goBack(); -> User requested "only come when there is new diet log", so maybe stay? 
            // Usually "Save" implies staying or going back. I'll keep goBack() or remove it based on preference.
            // User said "save daily log botton is always there , it will only come when there is new diet log"
            // So if I save, the button should disappear. I will REMOVE goBack() to verify the button disappears.
        } catch (error) {
            console.error("Error saving diet log:", error);
            Alert.alert('Error', 'Failed to save log. Please try again.');
        }
    };

    const getMealsByCategory = (category) => {
        return meals.filter((meal) => meal.category === category);
    };

    const totalMacros = meals.reduce(
        (acc, meal) => ({
            protein: acc.protein + meal.protein,
            carbs: acc.carbs + meal.carbs,
            fat: acc.fat + meal.fat,
        }),
        { protein: 0, carbs: 0, fat: 0 }
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>

                {/* 1. Header */}
                <View style={[styles.header, { marginBottom: 10 }]}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#2D3748" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Log Your Diet</Text>
                    <View style={styles.headerSpacer} />
                </View>

                {/* Date Selector */}
                <View style={styles.dateSelector}>
                    <TouchableOpacity onPress={() => changeDate(-1)} style={styles.dateChevron}>
                        <Ionicons name="chevron-back" size={24} color="#2D3748" />
                    </TouchableOpacity>
                    <Text style={styles.dateText}>
                        {isToday ? "Today" : selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </Text>
                    <TouchableOpacity onPress={() => changeDate(1)} disabled={isToday} style={styles.dateChevron}>
                        <Ionicons name="chevron-forward" size={24} color={isToday ? "#CBD5E0" : "#2D3748"} />
                    </TouchableOpacity>
                </View>

                {/* 2. Daily Summary Card */}
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryTitle}>Today's Summary</Text>
                    <View style={styles.caloriesContainer}>
                        <Text style={styles.caloriesValue}>{dailyCalories}</Text>
                        <Text style={styles.caloriesLabel}>/ {recommendedCalories} kcal</Text>
                    </View>

                    <View style={styles.macrosRow}>
                        <View style={styles.macroItem}>
                            <View style={[styles.macroRing, { borderColor: '#F6AD55' }]}>
                                <Text style={styles.macroValue}>{totalMacros.carbs}g</Text>
                            </View>
                            <Text style={styles.macroLabel}>Carbs</Text>
                        </View>
                        <View style={styles.macroItem}>
                            <View style={[styles.macroRing, { borderColor: '#FC8181' }]}>
                                <Text style={styles.macroValue}>{totalMacros.protein}g</Text>
                            </View>
                            <Text style={styles.macroLabel}>Protein</Text>
                        </View>
                        <View style={styles.macroItem}>
                            <View style={[styles.macroRing, { borderColor: '#4FD1C5' }]}>
                                <Text style={styles.macroValue}>{totalMacros.fat}g</Text>
                            </View>
                            <Text style={styles.macroLabel}>Fat</Text>
                        </View>
                    </View>
                </View>

                {/* 3. Add Meal Section */}
                <Text style={styles.sectionTitle}>Add Meal</Text>
                <View style={styles.mealButtonsRow}>
                    <TouchableOpacity
                        style={styles.mealButton}
                        onPress={() => openMealModal('Breakfast')}
                    >
                        <Ionicons name="sunny" size={24} color="#F6AD55" />
                        <Text style={styles.mealButtonText}>Breakfast</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.mealButton}
                        onPress={() => openMealModal('Lunch')}
                    >
                        <Ionicons name="restaurant" size={24} color="#FC8181" />
                        <Text style={styles.mealButtonText}>Lunch</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.mealButtonsRow}>
                    <TouchableOpacity
                        style={styles.mealButton}
                        onPress={() => openMealModal('Dinner')}
                    >
                        <Ionicons name="moon" size={24} color="#9F7AEA" />
                        <Text style={styles.mealButtonText}>Dinner</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.mealButton}
                        onPress={() => openMealModal('Snacks')}
                    >
                        <Ionicons name="add-circle" size={24} color="#4FD1C5" />
                        <Text style={styles.mealButtonText}>Snacks</Text>
                    </TouchableOpacity>
                </View>

                {/* 5. Daily Meal List */}
                {['Breakfast', 'Lunch', 'Dinner', 'Snacks'].map((category) => {
                    const categoryMeals = getMealsByCategory(category);
                    if (categoryMeals.length === 0) return null;

                    return (
                        <View key={category} style={styles.mealSection}>
                            <Text style={styles.mealCategoryTitle}>{category}</Text>
                            {categoryMeals.map((meal) => (
                                <View key={meal.id} style={styles.mealCard}>
                                    <View style={styles.mealCardContent}>
                                        <View style={styles.mealInfo}>
                                            <Text style={styles.mealName}>{meal.name}</Text>
                                            <Text style={styles.mealCalories}>{meal.calories} kcal</Text>
                                            <Text style={styles.mealMacros}>
                                                P: {meal.protein}g • C: {meal.carbs}g • F: {meal.fat}g
                                            </Text>
                                            {meal.notes && (
                                                <Text style={styles.mealNotes}>Note: {meal.notes}</Text>
                                            )}
                                        </View>
                                        <View style={styles.mealActions}>
                                            <TouchableOpacity
                                                style={styles.actionButton}
                                                onPress={() => editMeal(meal)}
                                            >
                                                <Ionicons name="create-outline" size={20} color="#3182CE" />
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={styles.actionButton}
                                                onPress={() => deleteMeal(meal.id)}
                                            >
                                                <Ionicons name="trash-outline" size={20} color="#E53E3E" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                            ))}
                        </View>
                    );
                })}

                {/* 6. Add Water Intake */}
                <Text style={styles.sectionTitle}>Water Intake</Text>
                <View style={styles.waterCard}>
                    <View style={styles.waterHeader}>
                        <Ionicons name="water" size={24} color="#3182CE" />
                        <Text style={styles.waterValue}>{waterIntake} ml</Text>
                        <Text style={styles.waterGoal}>/ {waterGoal} ml</Text>
                    </View>

                    <View style={styles.waterProgressBar}>
                        <View
                            style={[
                                styles.waterProgress,
                                { width: `${Math.min((waterIntake / waterGoal) * 100, 100)}%` },
                            ]}
                        />
                    </View>

                    <View style={styles.waterButtons}>
                        <TouchableOpacity
                            style={styles.waterButton}
                            onPress={() => adjustWater(-250)}
                        >
                            <Ionicons name="remove" size={20} color="#FFFFFF" />
                            <Text style={styles.waterButtonText}>-250ml</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.waterButton}
                            onPress={() => adjustWater(250)}
                        >
                            <Ionicons name="add" size={20} color="#FFFFFF" />
                            <Text style={styles.waterButtonText}>+250ml</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.bottomSpacer} />
            </ScrollView>

            {/* 7. Save Button - Only visible if changes detected */}
            {
                hasUnsavedChanges() && (
                    <View style={styles.bottomBar}>
                        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                            <Text style={styles.saveButtonText}>Save Daily Log</Text>
                        </TouchableOpacity>
                    </View>
                )
            }

            {/* 4. Meal Entry Modal */}
            <Modal
                visible={showMealModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowMealModal(false)}
            >
                <KeyboardAvoidingView 
                    style={styles.modalOverlay}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {editingMealId ? 'Edit Meal' : `Add ${selectedCategory}`}
                            </Text>
                            <TouchableOpacity onPress={() => setShowMealModal(false)}>
                                <Ionicons name="close" size={24} color="#2D3748" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView>
                            <Text style={styles.inputLabel}>Food Name</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g., Grilled Chicken"
                                value={newMeal.name}
                                onChangeText={(text) => setNewMeal({ ...newMeal, name: text })}
                            />

                            <Text style={styles.inputLabel}>Calories</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g., 250"
                                keyboardType="numeric"
                                value={newMeal.calories}
                                onChangeText={(text) => setNewMeal({ ...newMeal, calories: text })}
                            />

                            <View style={styles.macroInputRow}>
                                <View style={styles.macroInputContainer}>
                                    <Text style={styles.inputLabel}>Protein (g)</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="0"
                                        keyboardType="numeric"
                                        value={newMeal.protein}
                                        onChangeText={(text) => setNewMeal({ ...newMeal, protein: text })}
                                    />
                                </View>
                                <View style={styles.macroInputContainer}>
                                    <Text style={styles.inputLabel}>Carbs (g)</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="0"
                                        keyboardType="numeric"
                                        value={newMeal.carbs}
                                        onChangeText={(text) => setNewMeal({ ...newMeal, carbs: text })}
                                    />
                                </View>
                                <View style={styles.macroInputContainer}>
                                    <Text style={styles.inputLabel}>Fat (g)</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="0"
                                        keyboardType="numeric"
                                        value={newMeal.fat}
                                        onChangeText={(text) => setNewMeal({ ...newMeal, fat: text })}
                                    />
                                </View>
                            </View>

                            <Text style={styles.inputLabel}>Notes (Optional)</Text>
                            <TextInput
                                style={[styles.input, styles.notesInput]}
                                placeholder="Any additional notes..."
                                multiline
                                value={newMeal.notes}
                                onChangeText={(text) => setNewMeal({ ...newMeal, notes: text })}
                            />

                            <TouchableOpacity style={styles.addButton} onPress={saveMealEntry}>
                                <Text style={styles.addButtonText}>
                                    {editingMealId ? 'Update Meal' : 'Add Meal'}
                                </Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
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
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#2D3748',
    },
    headerSpacer: {
        width: 40,
    },
    dateSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        paddingHorizontal: 20,
        paddingVertical: 12,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    dateText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#2D3748',
    },
    dateChevron: {
        padding: 4,
    },
    summaryCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    summaryTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#718096',
        marginBottom: 12,
    },
    caloriesContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: 20,
    },
    caloriesValue: {
        fontSize: 36,
        fontWeight: '700',
        color: '#3182CE',
    },
    caloriesLabel: {
        fontSize: 16,
        color: '#718096',
        marginLeft: 8,
    },
    macrosRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    macroItem: {
        alignItems: 'center',
    },
    macroRing: {
        width: 70,
        height: 70,
        borderRadius: 35,
        borderWidth: 4,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    macroValue: {
        fontSize: 16,
        fontWeight: '700',
        color: '#2D3748',
    },
    macroLabel: {
        fontSize: 12,
        color: '#718096',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2D3748',
        marginBottom: 12,
    },
    mealButtonsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    mealButton: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginHorizontal: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    mealButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2D3748',
        marginTop: 8,
    },
    mealSection: {
        marginBottom: 20,
    },
    mealCategoryTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#2D3748',
        marginBottom: 8,
    },
    mealCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    mealCardContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    mealInfo: {
        flex: 1,
    },
    mealName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2D3748',
        marginBottom: 4,
    },
    mealCalories: {
        fontSize: 14,
        fontWeight: '700',
        color: '#3182CE',
        marginBottom: 4,
    },
    mealMacros: {
        fontSize: 12,
        color: '#718096',
        marginBottom: 4,
    },
    mealNotes: {
        fontSize: 12,
        color: '#A0AEC0',
        fontStyle: 'italic',
    },
    mealActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionButton: {
        padding: 8,
        marginLeft: 4,
    },
    waterCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    waterHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    waterValue: {
        fontSize: 24,
        fontWeight: '700',
        color: '#2D3748',
        marginLeft: 12,
    },
    waterGoal: {
        fontSize: 16,
        color: '#718096',
        marginLeft: 4,
    },
    waterProgressBar: {
        height: 12,
        backgroundColor: '#E2E8F0',
        borderRadius: 6,
        overflow: 'hidden',
        marginBottom: 16,
    },
    waterProgress: {
        height: '100%',
        backgroundColor: '#3182CE',
        borderRadius: 6,
    },
    waterButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    waterButton: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: '#3182CE',
        borderRadius: 10,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 4,
    },
    waterButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
        marginLeft: 6,
    },
    bottomSpacer: {
        height: 20,
    },
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 5,
    },
    saveButton: {
        backgroundColor: '#3182CE',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        maxHeight: '85%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#2D3748',
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4A5568',
        marginBottom: 8,
        marginTop: 8,
    },
    input: {
        backgroundColor: '#F7FAFC',
        borderRadius: 10,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 15,
        color: '#2D3748',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    macroInputRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    macroInputContainer: {
        width: '31%',
    },
    notesInput: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    addButton: {
        backgroundColor: '#3182CE',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 20,
    },
    addButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
});

export default DietLoggingScreen;
