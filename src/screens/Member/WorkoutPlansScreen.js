import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    Platform,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';
import { useFocusEffect } from '@react-navigation/native';
import { RefreshControl } from 'react-native';

// Helper to get month names
const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];



const WorkoutPlansScreen = ({ navigation, route }) => {
    const [userProfile, setUserProfile] = useState(null);
    const [signupDate, setSignupDate] = useState(null);

    // Date State
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
    const [selectedWeek, setSelectedWeek] = useState(null); // Full week object
    const [isMonthDropdownOpen, setIsMonthDropdownOpen] = useState(false);

    const [allAssignments, setAllAssignments] = useState([]);
    const [currentTrainerId, setCurrentTrainerId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    // Tab State
    const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'completed'

    const weeksScrollRef = useRef(null);

    // Summary Data
    const [planSummary, setPlanSummary] = useState({
        totalWorkouts: 0,
        totalMinutes: 0,
        trainerNotes: '',
    });

    // Initialize from params
    useEffect(() => {
        if (route.params?.tab) {
            setActiveTab(route.params.tab);
        }
    }, [route.params]);

    // 1. Fetch Profile for Signup Date
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const profile = await api.getProfile();
                setUserProfile(profile);
                // Fallback to Jan 1st of current year if no created_at, just for safety
                // In real app, created_at should exist.
                const created = (profile.createdAt || profile.created_at) ? new Date(profile.createdAt || profile.created_at) : new Date();
                setSignupDate(created);

                // Set initial view to today, but respect bounds? 
                // Actually, let's stick to current date initially, 
                // but user might want to see "Week 1" initially? 
                // Usually users want to see "Current active week".
                // We'll rely on defaults set in useState, but we might need to adjust if 
                // current date < signup date (impossible) or if we need to sync.
            } catch (error) {
                console.error("Failed to fetch profile", error);
            }
        };
        fetchProfile();
    }, []);

    const loadData = async () => {
        try {
            const data = await api.getAssignedWorkouts('');
            if (data && data.length > 0) {
                const formatted = data.map(assignment => ({
                    ...assignment,
                    workout: assignment.workout || {},
                    date: new Date(assignment.scheduled_date || assignment.created_at || Date.now())
                }));
                setAllAssignments(formatted);

                if (formatted[0].trainer_id) {
                    setCurrentTrainerId(formatted[0].trainer_id);
                }
            } else {
                setAllAssignments([]);
            }
        } catch (err) {
            console.error("Failed to fetch workouts:", err);
        }
    };

    // 2. Fetch Assignments
    useFocusEffect(
        React.useCallback(() => {
            setLoading(true);
            loadData().finally(() => setLoading(false));
        }, [])
    );

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        Promise.all([
            api.getProfile().then(profile => {
                setUserProfile(profile);
                const created = (profile.createdAt || profile.created_at) ? new Date(profile.createdAt || profile.created_at) : new Date();
                setSignupDate(created);
            }),
            loadData()
        ]).finally(() => setRefreshing(false));
    }, []);

    // Auto-refresh: Poll for new assignments every 15 seconds
    const lastAssignmentCountRef = React.useRef(null);

    React.useEffect(() => {
        const checkForNewAssignments = async () => {
            try {
                const assignments = await api.getAssignedWorkouts('');
                const currentCount = assignments ? assignments.length : 0;

                if (lastAssignmentCountRef.current !== null && currentCount !== lastAssignmentCountRef.current) {
                    console.log('WorkoutPlans Auto-refresh: Assignment count changed from', lastAssignmentCountRef.current, 'to', currentCount);
                    loadData();
                }
                lastAssignmentCountRef.current = currentCount;
            } catch (err) {
                // Silently ignore polling errors
            }
        };

        const interval = setInterval(checkForNewAssignments, 15000); // every 15 seconds

        return () => clearInterval(interval);
    }, []);

    // 3. User Weeks Calculation
    // Logic: Week 1 starts on signupDate. Week N is signupDate + (N-1)*7 days.
    // We need to generate weeks that overlap with the selected Year/Month.
    const weeksInView = useMemo(() => {
        if (!signupDate) return [];

        const weeks = [];
        // Determine the start and end of the selected month view
        // Actually, we want to show weeks that *fall in* this month.
        // Let's iterate from Week 1 until we pass the selected month.

        const viewYear = currentYear;
        const viewMonth = currentMonth; // 0-indexed

        const monthStart = new Date(viewYear, viewMonth, 1);
        const monthEnd = new Date(viewYear, viewMonth + 1, 0, 23, 59, 59);

        // Start counting from signupDate
        let tempDate = new Date(signupDate);
        // Normalize signupDate to start of day?
        // "Week starts from user signup date".
        // Let's keep the time components or normalize? 
        // Typically plans are day-based. Let's normalize signup to 00:00:00.
        tempDate.setHours(0, 0, 0, 0);

        let weekCount = 1;

        // Optimization: Jump close to the selected month instead of iterating from Day 1 if signup was years ago.
        // But for "Week X" labeling accuracy, we ideally calculate the offset.
        // Difference in days between monthStart and signupDate?

        const oneDay = 24 * 60 * 60 * 1000;
        // If signup is in future of selected time (e.g. looking back? allowed?), loops won't run. 
        // But we prevent looking back before signup.

        // Safety: Prevent infinite loops
        let safety = 0;
        while (safety < 5000) {
            const weekStart = new Date(tempDate);
            let weekEnd = new Date(tempDate);

            if (weekCount === 1) {
                // Week 1: Ends on the upcoming Sunday
                // If today is Sunday, (7-0)%7 = 0. Ends today.
                // If today is Saturday, (7-6)%7 = 1. Ends tomorrow.
                const currentDay = weekStart.getDay();
                const daysUntilSunday = (7 - currentDay) % 7;
                weekEnd.setDate(weekEnd.getDate() + daysUntilSunday);
            } else {
                // Week 2+: Standard 7 day week (Mon-Sun)
                weekEnd.setDate(weekEnd.getDate() + 6);
            }

            weekEnd.setHours(23, 59, 59, 999);

            // Check if this week overlaps with the selected month
            const overlaps = (weekStart <= monthEnd) && (weekEnd >= monthStart);

            if (overlaps) {
                let label = `Week ${weekCount}`;
                const startStr = weekStart.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
                const endStr = weekEnd.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });

                weeks.push({
                    id: weekCount,
                    label: label,
                    rangeLabel: `${startStr} - ${endStr}`,
                    start: weekStart,
                    end: weekEnd
                });
            }

            // Stop if we are completely past the month
            if (weekStart > monthEnd) break;

            // Next week
            tempDate = new Date(weekEnd);
            tempDate.setDate(tempDate.getDate() + 1);
            tempDate.setHours(0, 0, 0, 0);

            weekCount++;
            safety++;
        }

        return weeks;
    }, [signupDate, currentYear, currentMonth]);

    // Auto-select the current week or first available week when list changes
    useEffect(() => {
        // Try to find a week that contains "today" if inside the view, else first week
        if (weeksInView.length > 0) {
            const today = new Date();
            const currentWeek = weeksInView.find(w => today >= w.start && today <= w.end);
            if (currentWeek) {
                setSelectedWeek(currentWeek);
                setTimeout(() => weeksScrollRef.current?.scrollToEnd({ animated: true }), 300);
            } else {
                setSelectedWeek(weeksInView[0]);
                setTimeout(() => weeksScrollRef.current?.scrollTo({ x: 0, animated: true }), 300);
            }
        } else {
            setSelectedWeek(null);
        }
    }, [weeksInView]);


    // 4. Filtering Assignments
    const filteredWorkouts = useMemo(() => {
        if (!selectedWeek || !allAssignments) return [];

        return allAssignments.filter(a => {
            const d = a.date;
            const matchesWeek = d >= selectedWeek.start && d <= selectedWeek.end;

            const isCompleted = a.status === 'completed';

            if (activeTab === 'completed') {
                return matchesWeek && isCompleted;
            } else {
                // Pending = not completed
                return matchesWeek && !isCompleted;
            }
        }).map(a => ({
            id: a.workout?.id,
            assignmentId: a.id,
            day: a.date.toLocaleDateString('en-US', { weekday: 'long' }),
            title: a.workout?.title || 'Untitled Workout',
            duration: a.workout?.duration || '45 mins',
            exercises: a.workout?.exercises || [],
            status: a.status
        }));
    }, [allAssignments, selectedWeek, activeTab]);


    // Update summary
    useEffect(() => {
        setPlanSummary({
            totalWorkouts: filteredWorkouts.length,
            totalMinutes: filteredWorkouts.reduce((acc, curr) => acc + (parseInt(curr.duration) || 0), 0),
            trainerNotes: filteredWorkouts.length > 0 ? "Keep crushing your goals!" : "No workouts scheduled."
        });
    }, [filteredWorkouts]);


    // Handlers
    const handleViewDetails = (workout) => {
        if (workout.status === 'completed') {
            navigation.navigate('WorkoutResults', {
                workout: workout
            });
        } else {
            navigation.navigate('WorkoutDetail', {
                workoutId: workout.id,
                assignmentId: workout.assignmentId,
                title: workout.title,
                status: workout.status
            });
        }
    };

    const handleDeletePlan = async (assignmentId) => {
        // ... same delete logic ...
        const doDelete = async () => {
            try {
                await api.deleteWorkoutAssignment(assignmentId);
                setAllAssignments(prev => prev.filter(a => a.id !== assignmentId));
            } catch (error) {
                Alert.alert("Error", "Could not delete workout.");
            }
        };
        if (Platform.OS === 'web') {
            if (confirm("Delete this workout?")) doDelete();
        } else {
            Alert.alert("Delete Workout", "Are you sure?", [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: doDelete }
            ]);
        }
    };

    // Year Change Logic
    const handleYearChange = (increment) => {
        const newYear = currentYear + increment;

        if (!signupDate) {
            setCurrentYear(newYear);
            return;
        }

        // Validate Year
        if (newYear < signupDate.getFullYear()) return; // Prevent going before signup

        setCurrentYear(newYear);

        // Reset Month Logic
        if (newYear === signupDate.getFullYear()) {
            // If going back to signup year, reset to signup month
            setCurrentMonth(signupDate.getMonth());
        } else {
            // Future years start at January
            setCurrentMonth(0);
        }
    };

    // Render Helpers
    const isYearValid = (y) => {
        if (!signupDate) return true;
        return y >= signupDate.getFullYear();
    };

    const isMonthValid = (mIndex) => {
        if (!signupDate) return true;
        if (currentYear > signupDate.getFullYear()) return true;
        // If same year, month must be >= signup month
        return mIndex >= signupDate.getMonth();
    };

    // Dropdown Selection
    const handleMonthSelect = (idx) => {
        setCurrentMonth(idx);
        setIsMonthDropdownOpen(false);
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.contentContainer}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3182CE']} tintColor="#3182CE" />
                }
            >

                <View style={styles.headerSection}>
                    <Text style={styles.headerTitle}>My Journey</Text>
                    <Text style={styles.subHeader}>Track your progress week by week</Text>
                </View>

                {/* Controls */}
                <View style={styles.controlsContainer}>

                    {/* Year Control */}
                    <View style={styles.yearControl}>
                        {/* Only allow going back if prev year is valid */}
                        <TouchableOpacity
                            onPress={() => handleYearChange(-1)}
                            disabled={!isYearValid(currentYear - 1)}
                            style={{ opacity: !isYearValid(currentYear - 1) ? 0.3 : 1 }}
                        >
                            <Ionicons name="chevron-back" size={20} color="#2D3748" />
                        </TouchableOpacity>

                        <Text style={styles.yearText}>{currentYear}</Text>

                        <TouchableOpacity onPress={() => handleYearChange(1)}>
                            <Ionicons name="chevron-forward" size={20} color="#2D3748" />
                        </TouchableOpacity>
                    </View>

                    {/* Month Dropdown */}
                    <View style={styles.monthDropdownContainer}>
                        <TouchableOpacity
                            style={styles.dropdownTrigger}
                            onPress={() => setIsMonthDropdownOpen(!isMonthDropdownOpen)}
                        >
                            <Text style={styles.dropdownText}>{MONTHS[currentMonth]}</Text>
                            <Ionicons name={isMonthDropdownOpen ? "caret-up" : "caret-down"} size={16} color="#4A5568" />
                        </TouchableOpacity>

                        {isMonthDropdownOpen && (
                            <View style={styles.dropdownMenu}>
                                <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
                                    {MONTHS.map((m, idx) => {
                                        const disabled = !isMonthValid(idx);
                                        return (
                                            <TouchableOpacity
                                                key={m}
                                                style={[
                                                    styles.dropdownItem,
                                                    currentMonth === idx && styles.dropdownItemActive,
                                                    disabled && styles.dropdownItemDisabled
                                                ]}
                                                onPress={() => !disabled && handleMonthSelect(idx)}
                                                disabled={disabled}
                                            >
                                                <Text style={[
                                                    styles.dropdownItemText,
                                                    currentMonth === idx && styles.dropdownItemTextActive,
                                                    disabled && styles.dropdownItemTextDisabled
                                                ]}>{m}</Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </ScrollView>
                            </View>
                        )}
                    </View>
                </View>

                {/* Weeks Horizontal List */}
                <View style={styles.weeksListContainer}>
                    <ScrollView ref={weeksScrollRef} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
                        {weeksInView.length > 0 ? weeksInView.map((week) => {
                            const isActive = selectedWeek && selectedWeek.id === week.id;
                            return (
                                <TouchableOpacity
                                    key={week.id}
                                    style={[styles.weekPill, isActive && styles.weekPillActive]}
                                    onPress={() => setSelectedWeek(week)}
                                >
                                    <Text style={[styles.weekPillTitle, isActive && styles.weekPillTitleActive]}>{week.label}</Text>
                                    <Text style={[styles.weekPillRange, isActive && styles.weekPillRangeActive]}>{week.rangeLabel}</Text>
                                </TouchableOpacity>
                            );
                        }) : (
                            <Text style={styles.noWeeksText}>No weeks available just yet.</Text>
                        )}
                    </ScrollView>
                </View>

                {/* Status Tabs (Segmented Control) */}
                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[styles.tabButton, activeTab === 'pending' && styles.tabButtonActive]}
                        onPress={() => setActiveTab('pending')}
                    >
                        <Text style={[styles.tabText, activeTab === 'pending' && styles.tabTextActive]}>Pending</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tabButton, activeTab === 'completed' && styles.tabButtonActive]}
                        onPress={() => setActiveTab('completed')}
                    >
                        <Text style={[styles.tabText, activeTab === 'completed' && styles.tabTextActive]}>Completed</Text>
                    </TouchableOpacity>
                </View>

                {/* Workouts List */}
                <View style={styles.workoutListSection}>
                    {!selectedWeek ? (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>Select a week to view plans.</Text>
                        </View>
                    ) : filteredWorkouts.length === 0 ? (
                        <View style={styles.emptyState}>
                            <View style={styles.emptyiconBg}>
                                <Ionicons name="barbell-outline" size={32} color="#A0AEC0" />
                            </View>
                            <Text style={styles.emptyText}>No workouts scheduled for {selectedWeek.label}.</Text>
                            <TouchableOpacity style={styles.createBtn} onPress={() => navigation.navigate('MemberCreateWorkout')}>
                                <Text style={styles.createBtnText}>Create Custom Workout</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        filteredWorkouts.map((workout, index) => (
                            <View key={workout.assignmentId || index} style={styles.modernCard}>
                                <View style={styles.cardLeftStrip} />
                                <View style={styles.cardContent}>
                                    <View style={styles.cardHeader}>
                                        <Text style={styles.cardDay}>{workout.day}</Text>
                                        <View style={[styles.statusBadge, workout.status === 'completed' && styles.statusBadgeCompleted]}>
                                            <Text style={[styles.statusText, workout.status === 'completed' && styles.statusTextCompleted]}>
                                                {workout.status || 'Pending'}
                                            </Text>
                                        </View>
                                    </View>

                                    <Text style={styles.cardTitle}>{workout.title}</Text>

                                    <View style={styles.cardMetaRow}>
                                        <Ionicons name="time-outline" size={14} color="#718096" />
                                        <Text style={styles.cardMetaText}>{workout.duration}</Text>
                                        <Text style={styles.cardMetaSeparator}>•</Text>
                                        <Ionicons name="fitness-outline" size={14} color="#718096" />
                                        <Text style={styles.cardMetaText}>{workout.exercises ? workout.exercises.length : 0} Exercises</Text>
                                    </View>

                                    <View style={styles.cardFooter}>
                                        <TouchableOpacity onPress={() => handleDeletePlan(workout.assignmentId)}>
                                            <Ionicons name="trash-outline" size={18} color="#E53E3E" style={{ opacity: 0.6 }} />
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={styles.startBtn}
                                            onPress={() => handleViewDetails(workout)}
                                        >
                                            <Text style={styles.startBtnText}>{workout.status === 'completed' ? 'Results' : 'Start'}</Text>
                                            <Ionicons name="arrow-forward" size={14} color="#fff" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        ))
                    )}
                </View>

                <View style={styles.bottomSpacer} />
            </ScrollView>

            {/* Floating Actions */}
            <View style={styles.fabContainer}>
                <TouchableOpacity style={styles.fabMain} onPress={() => navigation.navigate('MemberCreateWorkout')}>
                    <Ionicons name="add" size={30} color="#FFFFFF" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.fabMini} onPress={() => navigation.navigate('Chat', { trainerId: currentTrainerId })}>
                    <Ionicons name="chatbubble-ellipses-outline" size={22} color="#3182CE" />
                </TouchableOpacity>
            </View>

        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F7FAFC', // Slightly lighter gray/blue
    },
    container: {
        flex: 1,
    },
    contentContainer: {
        paddingBottom: 100,
    },
    headerSection: {
        padding: 24,
        backgroundColor: '#FFFFFF',
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 5,
        zIndex: 10,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#1A202C',
        letterSpacing: -0.5,
    },
    subHeader: {
        fontSize: 14,
        color: '#718096',
        marginTop: 4,
        fontWeight: '500',
    },
    controlsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        marginTop: 20,
        justifyContent: 'space-between',
        zIndex: 20, // Important for dropdown
    },
    yearControl: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 16,
        shadowColor: 'rgba(0,0,0,0.05)',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 4,
        elevation: 2,
    },
    yearText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#2D3748',
        marginHorizontal: 12,
    },
    monthDropdownContainer: {
        flex: 1,
        marginLeft: 12,
        position: 'relative',
    },
    dropdownTrigger: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 16,
        shadowColor: 'rgba(0,0,0,0.05)',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 4,
        elevation: 2,
    },
    dropdownText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2D3748',
    },
    dropdownMenu: {
        position: 'absolute',
        top: 50,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 10,
        zIndex: 100,
        maxHeight: 250,
    },
    dropdownItem: {
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderRadius: 8,
    },
    dropdownItemActive: {
        backgroundColor: '#EBF8FF', // Light blue bg
    },
    dropdownItemDisabled: {
        opacity: 0.4,
    },
    dropdownItemText: {
        fontSize: 15,
        color: '#4A5568',
        fontWeight: '500',
    },
    dropdownItemTextActive: {
        color: '#3182CE',
        fontWeight: '700',
    },
    dropdownItemTextDisabled: {
        color: '#A0AEC0',
    },
    weeksListContainer: {
        marginTop: 20,
        zIndex: 1,
    },
    weekPill: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 14,
        marginRight: 10,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        minWidth: 100,
    },
    weekPillActive: {
        backgroundColor: '#3182CE',
        borderColor: '#3182CE',
        shadowColor: '#3182CE',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    weekPillTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#4A5568',
        marginBottom: 2,
    },
    weekPillTitleActive: {
        color: '#FFFFFF',
    },
    weekPillRange: {
        fontSize: 11,
        color: '#A0AEC0',
        fontWeight: '500',
    },
    weekPillRangeActive: {
        color: '#EBF8FF', // very light blue
    },
    noWeeksText: {
        color: '#A0AEC0',
        paddingHorizontal: 20,
        fontStyle: 'italic',
    },
    workoutListSection: {
        padding: 20,
        zIndex: 0,
    },
    modernCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        marginBottom: 16,
        flexDirection: 'row',
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    cardLeftStrip: {
        width: 6,
        backgroundColor: '#3182CE',
    },
    cardContent: {
        flex: 1,
        padding: 16,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    cardDay: {
        fontSize: 12,
        textTransform: 'uppercase',
        color: '#A0AEC0',
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    statusBadge: {
        backgroundColor: '#EDF2F7',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    statusBadgeCompleted: {
        backgroundColor: '#C6F6D5',
    },
    statusText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#718096',
    },
    statusTextCompleted: {
        color: '#276749',
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2D3748',
        marginBottom: 8,
    },
    cardMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    cardMetaText: {
        fontSize: 13,
        color: '#718096',
        marginLeft: 4,
        fontWeight: '500',
    },
    cardMetaSeparator: {
        marginHorizontal: 8,
        color: '#CBD5E0',
    },
    cardFooter: {
        marginTop: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F7FAFC',
    },
    startBtn: {
        flexDirection: 'row',
        backgroundColor: '#3182CE',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        alignItems: 'center',
    },
    startBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 13,
        marginRight: 4,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyiconBg: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#EDF2F7',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    emptyText: {
        color: '#718096',
        fontSize: 16,
        fontWeight: '500',
    },
    createBtn: {
        marginTop: 16,
        paddingVertical: 10,
        paddingHorizontal: 20,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#CBD5E0',
        borderRadius: 20,
    },
    createBtnText: {
        color: '#4A5568',
        fontWeight: '600',
        fontSize: 14,
    },
    fabContainer: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        alignItems: 'center',
    },
    fabMain: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#2B6CB0',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#2B6CB0',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
        marginBottom: 16,
    },
    fabMini: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    bottomSpacer: { height: 100 },

    // Tab Styles
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#EDF2F7',
        borderRadius: 20,
        padding: 4,
        marginHorizontal: 20,
        marginBottom: 16,
    },
    tabButton: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 16,
    },
    tabButtonActive: {
        backgroundColor: '#FFFFFF',
        shadowColor: 'rgba(0,0,0,0.05)',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 4,
        elevation: 2,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#A0AEC0',
    },
    tabTextActive: {
        color: '#2D3748',
        fontWeight: '700',
    }
});

export default WorkoutPlansScreen;
