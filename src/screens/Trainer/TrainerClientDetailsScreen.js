import React, { useState, useEffect, useRef } from 'react';
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
import { api } from '../../services/api';

const TrainerClientDetailsScreen = ({ route, navigation }) => {
    // Get client data passed from params
    const { client } = route.params || {};

    const [activeTab, setActiveTab] = useState('Overview');
    const [assignedWorkouts, setAssignedWorkouts] = useState([]);
    const [loadingAssignments, setLoadingAssignments] = useState(false);

    // Assignment State
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [trainerWorkouts, setTrainerWorkouts] = useState([]);
    const [loadingWorkouts, setLoadingWorkouts] = useState(false);

    // Messaging State
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const pollInterval = useRef(null);
    const scrollViewRef = React.useRef();

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        fetchMessages(true).finally(() => setRefreshing(false));
    }, []);

    const fetchMessages = async (isBackground = false) => {
        try {
            if (!isBackground) setLoadingMessages(true);
            const data = await api.getMessages(client.id);
            setMessages(data);
        } catch (error) {
            console.error("Failed to load messages:", error);
        } finally {
            if (!isBackground) setLoadingMessages(false);
        }
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim()) return;
        try {
            await api.sendMessage(client.id, newMessage);
            setNewMessage('');
            fetchMessages(true); // Refresh chat immediately
        } catch (error) {
            Alert.alert("Error", "Failed to send message.");
        }
    };

    // ... (assignments logic omitted)

    useEffect(() => {
        if (activeTab === 'Messages' && client) {
            fetchMessages();
            // Poll for new messages every 10 seconds
            pollInterval.current = setInterval(() => fetchMessages(true), 10000);
        } else {
            // Clear interval if switching tabs
            if (pollInterval.current) clearInterval(pollInterval.current);
        }

        return () => {
            if (pollInterval.current) clearInterval(pollInterval.current);
        };
    }, [activeTab, client]);

    const fetchAssignedWorkouts = async () => {
        try {
            setLoadingAssignments(true);
            const data = await api.getAssignedWorkouts(client.id);
            setAssignedWorkouts(data);
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Failed to fetch assigned workouts");
        } finally {
            setLoadingAssignments(false);
        }
    };

    const handleOpenAssignModal = async () => {
        setShowAssignModal(true);
        if (trainerWorkouts.length === 0) {
            try {
                setLoadingWorkouts(true);
                const workouts = await api.getWorkouts();
                setTrainerWorkouts(workouts);
            } catch (error) {
                Alert.alert("Error", "Failed to load workouts");
            } finally {
                setLoadingWorkouts(false);
            }
        }
    };

    const handleAssignWorkout = async (workoutId) => {
        try {
            await api.assignWorkout(client.id, workoutId);
            setShowAssignModal(false);
            Alert.alert("Success", "Workout assigned successfully!");
            fetchAssignedWorkouts();
        } catch (error) {
            Alert.alert("Error", "Failed to assign workout");
        }
    };

    useEffect(() => {
        if (client) {
            fetchAssignedWorkouts();
        }
    }, [client]);

    useEffect(() => {
        if (activeTab === 'Messages' && client) {
            fetchMessages();
            // Optional: Set up polling here if needed, or stick to manual refresh for now
        }
    }, [activeTab, client]);


    // Fallback if no client data
    if (!client) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.container}>
                    <Text>No client data found.</Text>
                </View>
            </SafeAreaView>
        );
    }

    const renderWorkoutItem = ({ item }) => (
        <TouchableOpacity style={styles.workoutCard} onPress={() => handleAssignWorkout(item.id)}>
            <Text style={styles.workoutName}>{item.title}</Text>
            <Text style={styles.workoutMeta}>{item.difficulty} • {item.duration}</Text>
            <Ionicons name="add-circle-outline" size={24} color="#3182CE" />
        </TouchableOpacity>
    );

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

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                {/* Header / Nav Bar */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#1A202C" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{client.name}</Text>
                    <TouchableOpacity style={styles.menuButton}>
                        <Ionicons name="ellipsis-horizontal" size={24} color="#1A202C" />
                    </TouchableOpacity>
                </View>

                {activeTab !== 'Messages' ? (
                    <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
                        {/* Profile Section */}
                        <View style={styles.profileSection}>
                            {client.image ? (
                                <Image
                                    source={{ uri: client.image }}
                                    style={styles.profileImage}
                                />
                            ) : (
                                <View style={[styles.profileImage, { justifyContent: 'center', alignItems: 'center' }]}>
                                    <Ionicons name="person" size={50} color="#CBD5E0" />
                                </View>
                            )}
                            <Text style={styles.clientName}>{client.name}</Text>
                            <Text style={styles.clientGoal}>{client.goal || 'No specific goal'}</Text>
                            <View style={styles.statusBadge}>
                                <View style={[styles.statusDot, { backgroundColor: client.status === 'Active' ? '#48BB78' : '#ECC94B' }]} />
                                <Text style={styles.statusText}>{client.status || 'Active'}</Text>
                            </View>
                        </View>

                        {/* Stats Grid */}
                        <View style={styles.statsContainer}>
                            <View style={styles.statCard}>
                                <Text style={styles.statLabel}>Plan</Text>
                                <Text style={styles.statValue}>{client.plan || 'N/A'}</Text>
                            </View>
                            <View style={styles.statCard}>
                                <Text style={styles.statLabel}>Last Active</Text>
                                <Text style={styles.statValue}>{client.lastActive || 'Never'}</Text>
                            </View>
                            <View style={styles.statCard}>
                                <Text style={styles.statLabel}>Age</Text>
                                <Text style={styles.statValue}>{client.age || 'N/A'}</Text>
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
                                <TouchableOpacity style={styles.card}>
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
                                <TouchableOpacity style={styles.assignButton} onPress={handleOpenAssignModal}>
                                    <Ionicons name="add" size={20} color="#FFF" />
                                    <Text style={styles.assignButtonText}>Assign New Workout</Text>
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
                                const isMe = msg.sender_id !== client.id; // If sender is NOT client, it's me (trainer)
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

            {/* Assignment Modal */}
            <Modal
                visible={showAssignModal}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setShowAssignModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Workout to Assign</Text>
                            <TouchableOpacity onPress={() => setShowAssignModal(false)}>
                                <Text style={styles.closeText}>Close</Text>
                            </TouchableOpacity>
                        </View>
                        {loadingWorkouts ? (
                            <ActivityIndicator style={{ marginTop: 40 }} size="large" color="#3182CE" />
                        ) : (
                            <FlatList
                                data={trainerWorkouts}
                                keyExtractor={item => item.id}
                                renderItem={renderWorkoutItem}
                                contentContainerStyle={{ padding: 20 }}
                                ListEmptyComponent={<Text style={styles.emptyText}>No workouts found in your library.</Text>}
                            />
                        )}
                    </View>
                </View>
            </Modal>
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
    assignButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#3182CE', padding: 16, borderRadius: 12, marginBottom: 20 },
    assignButtonText: { color: '#FFF', fontWeight: '700', marginLeft: 8 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { width: '90%', maxHeight: '80%', backgroundColor: '#F7FAFC', borderRadius: 16, overflow: 'hidden' },
    modalHeader: { padding: 20, backgroundColor: '#FFF', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    modalTitle: { fontSize: 18, fontWeight: '700' },
    closeText: { color: '#3182CE', fontSize: 16 },
    workoutCard: { backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    workoutName: { fontSize: 16, fontWeight: '700', color: '#2D3748' },
    workoutMeta: { fontSize: 14, color: '#718096' },
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
