import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity,
    ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator,
    SafeAreaView, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { adminApi } from '../../services/adminApi';

const AdminChatScreen = ({ navigation, route }) => {
    const { userId, userName, userRole, branchId, gymCode, branchName } = route.params || {};

    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const scrollViewRef = useRef();
    const pollInterval = useRef(null);

    const fetchMessages = async () => {
        try {
            const data = await adminApi.getMessages(userId);
            setMessages(data || []);
        } catch (e) {
            console.error('Failed to fetch messages:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (userId) {
            fetchMessages();
            // Mark as read when opening
            adminApi.markMessagesRead(userId).catch(() => {});
            // Poll for new messages every 8 seconds
            pollInterval.current = setInterval(fetchMessages, 8000);
        }
        return () => {
            if (pollInterval.current) clearInterval(pollInterval.current);
        };
    }, [userId]);

    const handleSend = async () => {
        const content = newMessage.trim();
        if (!content) return;
        setSending(true);
        try {
            await adminApi.sendMessage(userId, content);
            setNewMessage('');
            await fetchMessages();
        } catch (e) {
            if (Platform.OS === 'web') {
                window.alert('Failed to send message.');
            } else {
                Alert.alert('Error', 'Failed to send message.');
            }
        } finally {
            setSending(false);
        }
    };

    const getRoleColor = (role) => {
        if (role === 'member') return '#3182CE';
        if (role === 'trainer') return '#38A169';
        return '#805AD5';
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#4A5568" />
                </TouchableOpacity>
                <View style={styles.headerInfo}>
                    <Text style={styles.headerName}>{userName || 'User'}</Text>
                    <Text style={[styles.headerRole, { color: getRoleColor(userRole) }]}>
                        {userRole ? userRole.charAt(0).toUpperCase() + userRole.slice(1) : ''}
                    </Text>
                </View>
                <View style={{ width: 32 }} />
            </View>

            {/* Messages */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                {loading ? (
                    <View style={styles.center}>
                        <ActivityIndicator size="large" color="#3182CE" />
                    </View>
                ) : (
                    <ScrollView
                        ref={scrollViewRef}
                        style={styles.chatArea}
                        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
                        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
                    >
                        {messages.length === 0 && (
                            <View style={styles.emptyState}>
                                <Ionicons name="chatbubble-ellipses-outline" size={48} color="#CBD5E0" />
                                <Text style={styles.emptyText}>No messages yet. Start the conversation!</Text>
                            </View>
                        )}
                        {messages.map((msg, index) => {
                            // If sender_id is the member/trainer (userId), it's incoming.
                            // If sender_id is NOT userId, it means admin sent it.
                            const isAdminMessage = msg.sender_id !== userId;
                            return (
                                <View key={index} style={[styles.bubble, isAdminMessage ? styles.adminBubble : styles.userBubble]}>
                                    {!isAdminMessage && (
                                        <Text style={styles.senderLabel}>{userName}</Text>
                                    )}
                                    <Text style={[styles.bubbleText, isAdminMessage ? styles.adminBubbleText : styles.userBubbleText]}>
                                        {msg.content}
                                    </Text>
                                    <Text style={[styles.timeText, isAdminMessage ? { color: '#E2E8F0' } : { color: '#A0AEC0' }]}>
                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </Text>
                                </View>
                            );
                        })}
                    </ScrollView>
                )}

                {/* Input Area */}
                <View style={styles.inputRow}>
                    <TextInput
                        style={styles.input}
                        placeholder={`Reply to ${userName}...`}
                        value={newMessage}
                        onChangeText={setNewMessage}
                        multiline
                    />
                    <TouchableOpacity
                        style={[styles.sendBtn, (!newMessage.trim() || sending) && styles.sendBtnDisabled]}
                        onPress={handleSend}
                        disabled={!newMessage.trim() || sending}
                    >
                        {sending
                            ? <ActivityIndicator size="small" color="#FFF" />
                            : <Ionicons name="send" size={20} color="#FFF" />
                        }
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#FFF' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingVertical: 14,
        backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
    },
    backButton: { padding: 4 },
    headerInfo: { alignItems: 'center' },
    headerName: { fontSize: 17, fontWeight: '700', color: '#1A202C' },
    headerRole: { fontSize: 12, fontWeight: '600', marginTop: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    chatArea: { flex: 1, backgroundColor: '#F7FAFC' },
    emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 80, gap: 12 },
    emptyText: { color: '#A0AEC0', fontSize: 15, textAlign: 'center' },
    bubble: {
        maxWidth: '75%', padding: 12, borderRadius: 16,
        marginBottom: 10,
    },
    adminBubble: {
        alignSelf: 'flex-end', backgroundColor: '#3182CE',
        borderBottomRightRadius: 3,
    },
    userBubble: {
        alignSelf: 'flex-start', backgroundColor: '#FFF',
        borderBottomLeftRadius: 3, borderWidth: 1, borderColor: '#E2E8F0',
    },
    senderLabel: { fontSize: 11, color: '#718096', fontWeight: '600', marginBottom: 3 },
    bubbleText: { fontSize: 15 },
    adminBubbleText: { color: '#FFF' },
    userBubbleText: { color: '#2D3748' },
    timeText: { fontSize: 10, alignSelf: 'flex-end', marginTop: 4 },
    inputRow: {
        flexDirection: 'row', alignItems: 'center',
        padding: 12, backgroundColor: '#FFF',
        borderTopWidth: 1, borderTopColor: '#E2E8F0',
        paddingBottom: Platform.OS === 'web' ? 12 : 24,
    },
    input: {
        flex: 1, backgroundColor: '#EDF2F7', borderRadius: 20,
        paddingHorizontal: 16, paddingVertical: 10,
        fontSize: 15, color: '#2D3748', marginRight: 10, maxHeight: 100,
    },
    sendBtn: {
        backgroundColor: '#3182CE', width: 44, height: 44,
        borderRadius: 22, justifyContent: 'center', alignItems: 'center',
    },
    sendBtnDisabled: { backgroundColor: '#A0AEC0' },
});

export default AdminChatScreen;
