import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TextInput,
    TouchableOpacity,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const MessagesScreen = () => {
    const [messages, setMessages] = useState([
        {
            id: '1',
            text: 'Hey! How are you feeling after yesterday\'s workout?',
            sender: 'trainer',
            timestamp: '10:30 AM',
        },
        {
            id: '2',
            text: 'Feeling great! A bit sore but in a good way 💪',
            sender: 'member',
            timestamp: '10:32 AM',
        },
        {
            id: '3',
            text: 'That\'s perfect! The soreness means your muscles are adapting. Make sure to stay hydrated and get enough protein.',
            sender: 'trainer',
            timestamp: '10:33 AM',
        },
        {
            id: '4',
            text: 'Will do! Should I increase the weight for squats next session?',
            sender: 'member',
            timestamp: '10:35 AM',
        },
        {
            id: '5',
            text: 'Yes, let\'s add 5kg. Your form was excellent last time. Just maintain that technique!',
            sender: 'trainer',
            timestamp: '10:36 AM',
        },
    ]);
    const [inputText, setInputText] = useState('');
    const flatListRef = useRef(null);

    useEffect(() => {
        // Auto-scroll to bottom when messages change
        if (flatListRef.current && messages.length > 0) {
            flatListRef.current.scrollToEnd({ animated: true });
        }
    }, [messages]);

    const handleSend = () => {
        if (inputText.trim() === '') return;

        const newMessage = {
            id: Date.now().toString(),
            text: inputText,
            sender: 'member',
            timestamp: new Date().toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
            }),
        };

        setMessages([...messages, newMessage]);
        setInputText('');
    };

    const renderMessage = ({ item }) => {
        const isMember = item.sender === 'member';

        return (
            <View style={[styles.messageContainer, isMember && styles.messageContainerMember]}>
                {!isMember && (
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>T</Text>
                    </View>
                )}
                <View style={[styles.messageBubble, isMember && styles.messageBubbleMember]}>
                    <Text style={[styles.messageText, isMember && styles.messageTextMember]}>
                        {item.text}
                    </Text>
                    <Text style={[styles.timestamp, isMember && styles.timestampMember]}>
                        {item.timestamp}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Messages</Text>
                    <Text style={styles.headerSubtitle}>Chat with your trainer</Text>
                </View>

                {/* Chat List */}
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderMessage}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.chatList}
                    showsVerticalScrollIndicator={false}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                />

                {/* Input Bar */}
                <View style={styles.inputBar}>
                    <TextInput
                        style={styles.input}
                        placeholder="Type a message..."
                        value={inputText}
                        onChangeText={setInputText}
                        multiline
                        maxLength={500}
                    />
                    <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
                        <Ionicons name="send" size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
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
    header: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#1A202C',
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#718096',
        marginTop: 4,
    },
    chatList: {
        padding: 16,
        paddingBottom: 20,
    },
    messageContainer: {
        flexDirection: 'row',
        marginBottom: 16,
        alignItems: 'flex-end',
    },
    messageContainerMember: {
        justifyContent: 'flex-end',
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#3182CE',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    avatarText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    messageBubble: {
        maxWidth: '70%',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderTopLeftRadius: 4,
        padding: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    messageBubbleMember: {
        backgroundColor: '#3182CE',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 4,
    },
    messageText: {
        fontSize: 15,
        color: '#2D3748',
        lineHeight: 20,
    },
    messageTextMember: {
        color: '#FFFFFF',
    },
    timestamp: {
        fontSize: 11,
        color: '#A0AEC0',
        marginTop: 4,
    },
    timestampMember: {
        color: '#E6F2FF',
    },
    inputBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 5,
    },
    input: {
        flex: 1,
        backgroundColor: '#F7FAFC',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        fontSize: 15,
        color: '#2D3748',
        maxHeight: 100,
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#3182CE',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
        shadowColor: '#3182CE',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
    },
});

export default MessagesScreen;
