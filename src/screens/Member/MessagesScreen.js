import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Alert,
    SafeAreaView,
    RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';

const MessagesScreen = ({ route, navigation }) => {
    const { trainerId } = route.params || {};

    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(false);
    const scrollViewRef = useRef();
    const pollInterval = useRef(null);

    const [trainerName, setTrainerName] = useState(route.params?.trainerName || '');

    // ... code ...

    useEffect(() => {
        if (trainerId) {
            // optimized: only fetch if name is missing
            if (!trainerName) {
                api.getProfileById(trainerId).then(profile => {
                    setTrainerName(profile.name);
                }).catch(err => console.log("Failed to fetch trainer name", err));
            }

            fetchMessages();
            // Poll for new messages every 10 seconds
            pollInterval.current = setInterval(fetchMessages, 10000);
        }
        return () => {
            if (pollInterval.current) clearInterval(pollInterval.current);
        };
    }, [trainerId]);

    const fetchMessages = async (isRefresh = false) => {
        try {
            if (!isRefresh && messages.length === 0) setLoading(true);
            const data = await api.getMessages(trainerId);
            setMessages(data);
        } catch (error) {
            console.error("Failed to load messages:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        fetchMessages(true);
    }, []);

    const handleSendMessage = async () => {
        if (!newMessage.trim()) return;
        try {
            await api.sendMessage(trainerId, newMessage);
            setNewMessage('');
            fetchMessages(true); // Immediate refresh
        } catch (error) {
            Alert.alert("Error", "Failed to send message.");
        }
    };

    if (!trainerId) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.container}>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                            <Ionicons name="arrow-back" size={24} color="#1A202C" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Messages</Text>
                        <View style={{ width: 24 }} />
                    </View>
                    <View style={styles.centerContent}>
                        <Text style={styles.emptyText}>No trainer assigned yet.</Text>
                        <Text style={styles.subText}>You need to be assigned to a trainer to start chatting.</Text>
                    </View>
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
                    <View>
                        <Text style={styles.headerTitle}>{trainerName || 'Trainer'}</Text>
                        <Text style={styles.headerSubtitle}>Online</Text>
                    </View>
                    <TouchableOpacity style={styles.menuButton}>
                        <Ionicons name="ellipsis-vertical" size={24} color="#1A202C" />
                    </TouchableOpacity>
                </View>

                {/* Chat Area */}
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={{ flex: 1 }}
                    keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
                >
                    <ScrollView
                        style={styles.chatContainer}
                        contentContainerStyle={{ padding: 20, flexGrow: 1 }}
                        ref={scrollViewRef}
                        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    >
                        {loading && messages.length === 0 && <ActivityIndicator style={{ marginTop: 20 }} color="#3182CE" />}

                        {!loading && messages.length === 0 && (
                            <View style={styles.emptyContainer}>
                                <Ionicons name="chatbubbles-outline" size={48} color="#CBD5E0" />
                                <Text style={styles.emptyText}>Start a conversation!</Text>
                            </View>
                        )}

                        {messages.map((msg, index) => {
                            // Logic: If sender is ME (user), show on right.
                            // But wait, the API returns messages relative to ids.
                            // We don't have 'me' ID easily available in variable unless we store it.
                            // However, we know 'trainerId'. So if sender_id === trainerId, it's incoming.
                            // If sender_id !== trainerId, it MUST be me.

                            const isMe = msg.sender_id !== trainerId;

                            return (
                                <View key={index} style={[styles.messageBubble, isMe ? styles.myMessage : styles.theirMessage]}>
                                    <Text style={[styles.messageText, isMe ? styles.myMessageText : styles.theirMessageText]}>{msg.content}</Text>
                                    <Text style={[styles.messageTime, isMe ? { color: '#E2E8F0' } : { color: '#A0AEC0' }]}>
                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </Text>
                                </View>
                            );
                        })}
                    </ScrollView>

                    {/* Input Area */}
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="Type a message..."
                            value={newMessage}
                            onChangeText={setNewMessage}
                            multiline
                        />
                        <TouchableOpacity onPress={handleSendMessage} style={styles.sendButton} disabled={!newMessage.trim()}>
                            <Ionicons name="send" size={20} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
    container: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F7FAFC' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#1A202C' },
    headerSubtitle: { fontSize: 12, color: '#48BB78', fontWeight: '600' },
    backButton: { padding: 4 },
    menuButton: { padding: 4 },
    centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    subText: { fontSize: 14, color: '#718096', textAlign: 'center', marginTop: 8 },

    chatContainer: { flex: 1, backgroundColor: '#F7FAFC' },
    emptyContainer: { alignItems: 'center', marginTop: 60 },
    emptyText: { color: '#A0AEC0', marginTop: 12, fontSize: 16 },

    inputContainer: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingBottom: 80 },
    input: { flex: 1, backgroundColor: '#EDF2F7', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 16, color: '#2D3748', marginRight: 12, maxHeight: 100 },
    sendButton: { backgroundColor: '#3182CE', width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },

    messageBubble: { maxWidth: '75%', padding: 12, borderRadius: 16, marginBottom: 12 },
    myMessage: { alignSelf: 'flex-end', backgroundColor: '#3182CE', borderBottomRightRadius: 2 },
    theirMessage: { alignSelf: 'flex-start', backgroundColor: '#FFFFFF', borderBottomLeftRadius: 2, borderWidth: 1, borderColor: '#EDF2F7' },
    messageText: { fontSize: 16 },
    myMessageText: { color: '#FFF' },
    theirMessageText: { color: '#2D3748' },
    messageTime: { fontSize: 10, alignSelf: 'flex-end', marginTop: 4 }
});

export default MessagesScreen;
