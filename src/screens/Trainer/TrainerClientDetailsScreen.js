import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    SafeAreaView,
    ScrollView,
    FlatList,
    Modal,
    ActivityIndicator,
    Alert,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../../services/api';
import { colors } from '../../theme/theme';
import { useChat } from '../../context/ChatContext';
import TrainerCreateWorkoutModal from '../../components/Trainer/TrainerCreateWorkoutModal';

const TrainerClientDetailsScreen = ({ route, navigation }) => {
    // Get params - handle both full client object and just ID
    const { client, clientId, initialTab } = route.params || {};

    const [clientData, setClientData] = useState(client || null);
    const [loadingClient, setLoadingClient] = useState(!client && !!clientId);
    const [activeTab, setActiveTab] = useState(initialTab || 'Overview');

    const [assignedWorkouts, setAssignedWorkouts] = useState([]);
    const [loadingAssignments, setLoadingAssignments] = useState(false);

    // Assignment States
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [trainerWorkouts, setTrainerWorkouts] = useState([]);
    const [loadingWorkouts, setLoadingWorkouts] = useState(false);

    // Custom Creation State
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [loadingCreate, setLoadingCreate] = useState(false);

    // Helper to get display name
    const getClientName = (data) => {
        if (!data) return 'Client';
        return data.name || data.full_name || data.fullName || 'Client';
    };

    // Trainer Profile State
    const [currentTrainer, setCurrentTrainer] = useState(null);

    // Refresh State
    const [refreshing, setRefreshing] = useState(false);

    // Messaging State
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loadingMessages, setLoadingMessages] = useState(false);
    const pollInterval = useRef(null);
    const scrollViewRef = useRef();

    useEffect(() => {
        const loadData = async () => {
            try {
                // 1. Fetch Trainer Profile
                const profile = await api.getProfile();
                setCurrentTrainer(profile);

                // 2. Fetch Client Data
                if (clientId) {
                    setLoadingClient(true);
                    try {
                        // Use getClients to get the full view (status, lastActive, age) as defined in backend
                        const clients = await api.getClients();
                        const found = clients.find(c => c.id === clientId);
                        if (found) {
                            setClientData(found);
                        } else {
                            // Fallback to profile fetch if not in list (edge case)
                            const fetchedProfile = await api.getProfileById(clientId);
                            setClientData(fetchedProfile);
                        }
                    } catch (err) {
                        console.error("Failed to fetch client details:", err);
                    }
                }
            } catch (error) {
                console.error("Failed to load data", error);
                Alert.alert("Error", "Failed to load client details");
            } finally {
                setLoadingClient(false);
            }
        };
        loadData();
    }, [clientId]);

    const fetchMessages = async (isBackground = false) => {
        if (!clientData) return;
        try {
            if (!isBackground) setLoadingMessages(true);
            const data = await api.getMessages(clientData.id);
            setMessages(data);
        } catch (error) {
            console.error("Failed to load messages:", error);
        } finally {
            if (!isBackground) setLoadingMessages(false);
        }
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !clientData) return;
        try {
            await api.sendMessage(clientData.id, newMessage);
            setNewMessage('');
            fetchMessages(true); // Refresh chat immediately
        } catch (error) {
            Alert.alert("Error", "Failed to send message.");
        }
    };

    const fetchAssignedWorkouts = async (isBackground = false) => {
        if (!clientData) return;
        try {
            if (!isBackground) setLoadingAssignments(true);
            const data = await api.getAssignedWorkouts(clientData.id);
            setAssignedWorkouts(data);
        } catch (error) {
            console.error(error);
            // Don't alert on background poll failure to avoid annoying the user
            if (!isBackground) Alert.alert("Error", "Failed to fetch assigned workouts");
        } finally {
            if (!isBackground) setLoadingAssignments(false);
        }
    };

    // Auto-refresh when screen comes into focus
    useFocusEffect(
        useCallback(() => {
            if (clientData) {
                fetchAssignedWorkouts();
            }
        }, [clientData])
    );

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        // Refresh both workouts and messages if needed
        Promise.all([
            fetchAssignedWorkouts(),
            fetchMessages(true)
        ]).finally(() => setRefreshing(false));
    }, [clientData]);

    const { markAsRead } = useChat();

    useEffect(() => {
        // Clear any existing interval when tab/client changes
        if (pollInterval.current) clearInterval(pollInterval.current);

        if (clientData) {
            if (activeTab === 'Messages') {
                fetchMessages();
                markAsRead(clientData.id);
                pollInterval.current = setInterval(() => fetchMessages(true), 5000); // 5s for chat
            } else if (activeTab === 'Workouts') {
                fetchAssignedWorkouts(true);
                pollInterval.current = setInterval(() => fetchAssignedWorkouts(true), 5000); // 5s for workouts
            }
        }

        return () => {
            if (pollInterval.current) clearInterval(pollInterval.current);
        };
    }, [activeTab, clientData]);

    const handleCreateCustomWorkout = async (workoutData) => {
        if (!currentTrainer || !clientData) {
            Alert.alert("Error", "Trainer profile or client data not loaded. Please try again.");
            return;
        }

        setLoadingCreate(true);
        try {
            // 1. Create the custom workout
            const created = await api.createCustomWorkout(workoutData);

            // 2. Assign it to the client
            const workoutId = created.workout_id || created.id; // handle partial response inconsistency if any

            if (workoutId) {
                // Corrected: pass trainerId first
                await api.assignWorkout(currentTrainer.id, clientData.id, workoutId);

                Alert.alert("Success", "Custom plan created and assigned!");
                setShowCreateModal(false);
                fetchAssignedWorkouts(); // Refresh list
            } else {
                Alert.alert("Error", "Created workout but failed to get ID.");
            }

        } catch (error) {
            console.error("Create Custom Error:", error);
            Alert.alert("Error", "Failed to create custom workout.");
        } finally {
            setLoadingCreate(false);
        }
    };

    const renderAssignedItem = ({ item }) => (
        <View style={styles.assignedCard}>
            <View style={{ flex: 1 }}>
                <Text style={styles.workoutName}>{item.workout?.title || 'Unknown Workout'}</Text>
                <Text style={styles.workoutMeta}>Assigned: {new Date(item.assigned_at).toLocaleDateString()}</Text>
            </View>
            <View style={styles.statusTag}>
                <Text style={styles.statusTagText}>{item.status}</Text>
            </View>
        </View>
    );

    if (loadingClient || !clientData) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                    <ActivityIndicator size="large" color={colors.trainer.primary} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#1A202C" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{getClientName(clientData)}</Text>
                    <TouchableOpacity style={styles.menuButton}>
                        <Ionicons name="ellipsis-horizontal" size={24} color="#1A202C" />
                    </TouchableOpacity>
                </View>

                {activeTab !== 'Messages' ? (
                    <ScrollView
                        contentContainerStyle={{ paddingBottom: 100 }}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                        }
                    >
                        {/* Profile Section */}
                        <View style={styles.profileSection}>
                            {clientData.image ? (
                                <Image
                                    source={{ uri: clientData.image }}
                                    style={styles.profileImage}
                                />
                            ) : (
                                <View style={[styles.profileImage, { justifyContent: 'center', alignItems: 'center' }]}>
                                    <Ionicons name="person" size={50} color="#CBD5E0" />
                                </View>
                            )}
                            <Text style={styles.clientName}>{getClientName(clientData)}</Text>
                            <Text style={styles.clientGoal}>{clientData.goal || 'No specific goal'}</Text>
                            <View style={styles.statusBadge}>
                                <View style={[styles.statusDot, { backgroundColor: clientData.status === 'Active' ? '#48BB78' : '#ECC94B' }]} />
                                <Text style={styles.statusText}>{clientData.status || 'Active'}</Text>
                            </View>
                        </View>

                        {/* Stats Grid */}
                        <View style={styles.statsContainer}>
                            <View style={styles.statCard}>
                                <Text style={styles.statLabel}>Plan</Text>
                                <Text style={styles.statValue}>{clientData.plan || 'N/A'}</Text>
                            </View>
                            <View style={styles.statCard}>
                                <Text style={styles.statLabel}>Last Active</Text>
                                <Text style={styles.statValue}>
                                    {clientData.lastActive && clientData.lastActive !== 'Unknown'
                                        ? new Date(clientData.lastActive).toLocaleDateString()
                                        : 'Never'}
                                </Text>
                            </View>
                            <View style={styles.statCard}>
                                <Text style={styles.statLabel}>Age</Text>
                                <Text style={styles.statValue}>{clientData.age || 'N/A'}</Text>
                            </View>
                        </View>

                        {/* Tabs */}
                        <View style={styles.tabContainer}>
                            {['Overview', 'Workouts', 'Messages'].map(tab => (
                                <TouchableOpacity
                                    key={tab}
                                    style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
                                    onPress={() => setActiveTab(tab)}
                                >
                                    <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Content Based on Tab */}
                        {activeTab === 'Overview' && (
                            <View>
                                <TouchableOpacity
                                    style={styles.card}
                                    onPress={() => navigation.navigate('TrainerClientProgress', {
                                        clientId: clientData.id,
                                        clientName: clientData.name
                                    })}
                                >
                                    <View style={styles.cardRow}>
                                        <Ionicons name="bar-chart-outline" size={24} color="#3182CE" />
                                        <View style={styles.cardTextContainer}>
                                            <Text style={styles.cardTitle}>Progress Tracking</Text>
                                            <Text style={styles.cardSubtitle}>View weight and body metrics</Text>
                                        </View>
                                        <Ionicons name="chevron-forward" size={20} color="#CBD5E0" />
                                    </View>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.card} onPress={() => setActiveTab('Workouts')}>
                                    <View style={styles.cardRow}>
                                        <Ionicons name="calendar-outline" size={24} color="#3182CE" />
                                        <View style={styles.cardTextContainer}>
                                            <Text style={styles.cardTitle}>Assigned Workouts</Text>
                                            <Text style={styles.cardSubtitle}>{assignedWorkouts.length} Active Plans</Text>
                                        </View>
                                        <Ionicons name="chevron-forward" size={20} color="#CBD5E0" />
                                    </View>
                                </TouchableOpacity>
                            </View>
                        )}

                        {activeTab === 'Workouts' && (
                            <View style={{ paddingHorizontal: 20 }}>
                                <TouchableOpacity style={styles.createButton} onPress={() => setShowCreateModal(true)}>
                                    <View style={styles.createIconContainer}>
                                        <Ionicons name="add" size={24} color="#FFF" />
                                    </View>
                                    <Text style={styles.createButtonText}>Create & Assign New Plan</Text>
                                </TouchableOpacity>

                                {loadingAssignments ? (
                                    <ActivityIndicator style={{ marginTop: 20 }} color="#3182CE" />
                                ) : (
                                    assignedWorkouts.length === 0 ? (
                                        <Text style={styles.emptyText}>No workouts assigned yet.</Text>
                                    ) : (
                                        assignedWorkouts.map(item => (
                                            <View key={item.id} style={{ marginBottom: 10 }}>
                                                {renderAssignedItem({ item })}
                                            </View>
                                        ))
                                    )
                                )}
                            </View>
                        )}
                    </ScrollView>
                ) : (
                    // Messages Tab Full Screen View
                    <View style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        {/* Tabs Repeater for navigation consistency */}
                        <View style={styles.tabContainer}>
                            {['Overview', 'Workouts', 'Messages'].map(tab => (
                                <TouchableOpacity
                                    key={tab}
                                    style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
                                    onPress={() => setActiveTab(tab)}
                                >
                                    <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <ScrollView
                            style={styles.chatContainer}
                            contentContainerStyle={{ padding: 20, flexGrow: 1 }}
                            ref={scrollViewRef}
                            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
                            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                        >
                            {loadingMessages && <ActivityIndicator />}
                            {messages.length === 0 && !loadingMessages && (
                                <Text style={styles.emptyText}>No messages yet. Say hello!</Text>
                            )}
                            {messages.map((msg, index) => {
                                const isMe = msg.sender_id !== clientData.id; // If sender is NOT client, it's me (trainer)
                                return (
                                    <View key={index} style={[styles.messageBubble, isMe ? styles.myMessage : styles.theirMessage]}>
                                        <Text style={[styles.messageText, isMe ? styles.myMessageText : styles.theirMessageText]}>{msg.content}</Text>
                                        <Text style={styles.messageTime}>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                                    </View>
                                );
                            })}
                        </ScrollView>

                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder="Type a message..."
                                value={newMessage}
                                onChangeText={setNewMessage}
                            />
                            <TouchableOpacity onPress={handleSendMessage} style={styles.sendButton}>
                                <Ionicons name="send" size={24} color="#FFF" />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

            </View>

            {/* Create Custom Workout Modal */}
            <TrainerCreateWorkoutModal
                visible={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSave={handleCreateCustomWorkout}
                loadingSave={loadingCreate}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F7FAFC' },
    container: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#FFFFFF' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#1A202C' },
    profileSection: { alignItems: 'center', paddingVertical: 30, backgroundColor: '#FFFFFF', marginBottom: 20 },
    profileImage: { width: 100, height: 100, borderRadius: 50, marginBottom: 16, backgroundColor: '#EDF2F7' },
    clientName: { fontSize: 24, fontWeight: '800', color: '#1A202C', marginBottom: 4 },
    clientGoal: { fontSize: 16, color: '#718096', marginBottom: 12 },
    statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F7FAFC', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#EDF2F7' },
    statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
    statusText: { fontSize: 12, fontWeight: '600', color: '#4A5568' },
    statsContainer: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 24 },
    statCard: { flex: 1, backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, alignItems: 'center', marginHorizontal: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
    statLabel: { fontSize: 12, color: '#718096', marginBottom: 4 },
    statValue: { fontSize: 16, fontWeight: '700', color: '#2D3748' },
    tabContainer: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
    tabButton: { paddingVertical: 12, marginRight: 24 },
    tabButtonActive: { borderBottomWidth: 2, borderBottomColor: '#3182CE' },
    tabText: { fontSize: 16, color: '#718096', fontWeight: '600' },
    tabTextActive: { color: '#3182CE' },
    card: { backgroundColor: '#FFFFFF', marginHorizontal: 20, marginBottom: 12, padding: 16, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
    cardRow: { flexDirection: 'row', alignItems: 'center' },
    cardTextContainer: { flex: 1, marginLeft: 16 },
    cardTitle: { fontSize: 16, fontWeight: '600', color: '#2D3748' },
    cardSubtitle: { fontSize: 14, color: '#718096', marginTop: 2 },

    createButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#3182CE', padding: 18, borderRadius: 16, marginBottom: 20, shadowColor: '#3182CE', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
    createIconContainer: { marginRight: 10 },
    createButtonText: { color: '#FFF', fontSize: 18, fontWeight: '700' },

    assignedCard: { backgroundColor: '#FFF', padding: 16, borderRadius: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    statusTag: { backgroundColor: '#E6FFFA', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    statusTagText: { color: '#38B2AC', fontSize: 12, fontWeight: '700' },
    emptyText: { textAlign: 'center', color: '#A0AEC0', marginTop: 20 },
    chatContainer: { flex: 1, backgroundColor: '#F0F4F8' },
    inputContainer: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingBottom: Platform.OS === 'ios' ? 30 : 12 },
    input: { flex: 1, backgroundColor: '#EDF2F7', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 16, color: '#2D3748', marginRight: 12 },
    sendButton: { backgroundColor: '#3182CE', width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
    messageBubble: { maxWidth: '80%', padding: 12, borderRadius: 16, marginBottom: 12 },
    myMessage: { alignSelf: 'flex-end', backgroundColor: '#3182CE', borderBottomRightRadius: 2 },
    theirMessage: { alignSelf: 'flex-start', backgroundColor: '#FFFFFF', borderBottomLeftRadius: 2 },
    messageText: { fontSize: 16 },
    myMessageText: { color: '#FFF' },
    theirMessageText: { color: '#2D3748' },
    messageTime: { fontSize: 10, color: '#E2E8F0', alignSelf: 'flex-end', marginTop: 4 }
});

export default TrainerClientDetailsScreen;
