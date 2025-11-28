import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TextInput,
    TouchableOpacity,
    SafeAreaView,
    Image,
    KeyboardAvoidingView,
    Platform,
    Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const TrainerChatScreen = ({ navigation, route }) => {
    // Dummy client data (in a real app, this would come from route.params)
    const clientName = route.params?.clientName || 'Sarah Johnson';
    const clientImage = route.params?.clientImage || 'https://randomuser.me/api/portraits/women/44.jpg';
    const isOnline = true;

    const [messageText, setMessageText] = useState('');
    const [messages, setMessages] = useState([
        {
            id: '1',
            text: 'Hi Coach! I just finished my workout for today.',
            sender: 'client',
            timestamp: '10:30 AM',
            date: 'Today',
        },
        {
            id: '2',
            text: 'Great job Sarah! How did the squats feel?',
            sender: 'trainer',
            timestamp: '10:32 AM',
            date: 'Today',
        },
        {
            id: '3',
            text: 'They felt good, but I struggled a bit with the last set.',
            sender: 'client',
            timestamp: '10:33 AM',
            date: 'Today',
        },
        {
            id: '4',
            text: 'That is normal. Try lowering the weight slightly next time and focus on form.',
            sender: 'trainer',
            timestamp: '10:35 AM',
            date: 'Today',
        },
        {
            id: '5',
            text: 'Will do! Thanks for the tip.',
            sender: 'client',
            timestamp: '10:36 AM',
            date: 'Today',
        },
        {
            id: '6',
            text: 'Also, I updated my weight log this morning.',
            sender: 'client',
            timestamp: '10:36 AM',
            date: 'Today',
        },
    ]);

    const flatListRef = useRef(null);

    const sendMessage = () => {
        if (messageText.trim() === '') return;

        const newMessage = {
            id: Date.now().toString(),
            text: messageText,
            sender: 'trainer',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            date: 'Today',
        };

        setMessages((prevMessages) => [...prevMessages, newMessage]);
        setMessageText('');
    };

    useEffect(() => {
        // Scroll to bottom when new message is added
        setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
    }, [messages]);

    const renderDateSeparator = (date) => (
        <View style={styles.dateSeparator}>
            <Text style={styles.dateSeparatorText}>{date}</Text>
        </View>
    );

    const renderMessageItem = ({ item, index }) => {
        const isTrainer = item.sender === 'trainer';
        const showDate = index === 0 || messages[index - 1].date !== item.date;
        const showAvatar = !isTrainer && (index === messages.length - 1 || messages[index + 1]?.sender === 'trainer');

        return (
            <View>
                {showDate && renderDateSeparator(item.date)}
                <View style={[styles.messageRow, isTrainer ? styles.messageRowRight : styles.messageRowLeft]}>
                    {!isTrainer && (
                        <View style={styles.avatarContainer}>
                            {showAvatar ? (
                                <Image source={{ uri: clientImage }} style={styles.avatar} />
                            ) : (
                                <View style={styles.avatarPlaceholder} />
                            )}
                        </View>
                    )}
                    <View style={[styles.bubble, isTrainer ? styles.bubbleRight : styles.bubbleLeft]}>
                        <Text style={[styles.messageText, isTrainer ? styles.messageTextRight : styles.messageTextLeft]}>
                            {item.text}
                        </Text>
                        <Text style={[styles.timestamp, isTrainer ? styles.timestampRight : styles.timestampLeft]}>
                            {item.timestamp}
                        </Text>
                    </View>
                </View>
            </View>
        );
    };

    const renderEmptyState = () => (
        <View style={styles.emptyStateContainer}>
            <Ionicons name="chatbubbles-outline" size={80} color="#E2E8F0" />
            <Text style={styles.emptyStateText}>Start chatting with your client</Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                {/* 1. Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#2D3748" />
                    </TouchableOpacity>
                    <Image source={{ uri: clientImage }} style={styles.headerAvatar} />
                    <View style={styles.headerInfo}>
                        <Text style={styles.headerName}>{clientName}</Text>
                        <Text style={styles.headerStatus}>{isOnline ? 'Online' : 'Last seen recently'}</Text>
                    </View>
                    <TouchableOpacity style={styles.headerOption}>
                        <Ionicons name="ellipsis-vertical" size={24} color="#2D3748" />
                    </TouchableOpacity>
                </View>

                {/* 2. Messages List */}
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderMessageItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.messagesList}
                    ListEmptyComponent={renderEmptyState}
                    showsVerticalScrollIndicator={false}
                />

                {/* 5. Typing Indicator Placeholder (Conditional) */}
                {/* <View style={styles.typingIndicator}>
          <Text style={styles.typingText}>Client is typing...</Text>
        </View> */}

                {/* 4. Input Bar */}
                <View style={styles.inputContainer}>
                    <TouchableOpacity style={styles.attachButton}>
                        <Ionicons name="add" size={28} color="#A0AEC0" />
                    </TouchableOpacity>
                    <TextInput
                        style={styles.input}
                        placeholder="Type a message..."
                        value={messageText}
                        onChangeText={setMessageText}
                        multiline
                    />
                    <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
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
        backgroundColor: '#FFFFFF',
    },
    container: {
        flex: 1,
        backgroundColor: '#F7FAFC',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
        zIndex: 10,
    },
    backButton: {
        marginRight: 12,
    },
    headerAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#EDF2F7',
    },
    headerInfo: {
        flex: 1,
        marginLeft: 12,
    },
    headerName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#2D3748',
    },
    headerStatus: {
        fontSize: 12,
        color: '#48BB78', // Green for online
        marginTop: 2,
    },
    headerOption: {
        padding: 4,
    },
    messagesList: {
        paddingHorizontal: 16,
        paddingBottom: 20,
        paddingTop: 16,
        flexGrow: 1,
    },
    dateSeparator: {
        alignSelf: 'center',
        backgroundColor: '#EDF2F7',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        marginBottom: 16,
        marginTop: 8,
    },
    dateSeparatorText: {
        fontSize: 12,
        color: '#718096',
        fontWeight: '600',
    },
    messageRow: {
        flexDirection: 'row',
        marginBottom: 12,
        alignItems: 'flex-end',
    },
    messageRowLeft: {
        justifyContent: 'flex-start',
    },
    messageRowRight: {
        justifyContent: 'flex-end',
    },
    avatarContainer: {
        width: 32,
        marginRight: 8,
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#EDF2F7',
    },
    avatarPlaceholder: {
        width: 32,
        height: 32,
    },
    bubble: {
        maxWidth: '75%',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 1,
        elevation: 1,
    },
    bubbleLeft: {
        backgroundColor: '#FFFFFF',
        borderBottomLeftRadius: 4,
    },
    bubbleRight: {
        backgroundColor: '#3182CE',
        borderBottomRightRadius: 4,
    },
    messageText: {
        fontSize: 15,
        lineHeight: 20,
    },
    messageTextLeft: {
        color: '#2D3748',
    },
    messageTextRight: {
        color: '#FFFFFF',
    },
    timestamp: {
        fontSize: 10,
        marginTop: 4,
        alignSelf: 'flex-end',
    },
    timestampLeft: {
        color: '#A0AEC0',
    },
    timestampRight: {
        color: 'rgba(255, 255, 255, 0.8)',
    },
    emptyStateContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 300,
    },
    emptyStateText: {
        marginTop: 16,
        fontSize: 16,
        color: '#A0AEC0',
        fontWeight: '600',
    },
    typingIndicator: {
        paddingHorizontal: 20,
        paddingVertical: 8,
    },
    typingText: {
        fontSize: 12,
        color: '#718096',
        fontStyle: 'italic',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
    },
    attachButton: {
        padding: 8,
        marginRight: 8,
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
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#3182CE',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 12,
    },
});

export default TrainerChatScreen;
