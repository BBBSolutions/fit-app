import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { adminApi } from '../../services/adminApi';
import AdminDrawer from '../../components/AdminDrawer';

const isWeb = Platform.OS === 'web';

const AdminBroadcastScreen = ({ navigation, route }) => {
    const { branchId, gymCode, branchName } = route.params || {};

    const [drawerVisible, setDrawerVisible] = useState(false);
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [targetBranchId, setTargetBranchId] = useState('all');
    const [targetRole, setTargetRole] = useState('all');
    
    const [branches, setBranches] = useState([]);
    const [loadingBranches, setLoadingBranches] = useState(true);
    const [sending, setSending] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoadingBranches(true);
        try {
            const branchesData = await adminApi.getBranches();
            setBranches(branchesData?.branches || []);
        } catch (error) {
            console.error("Failed to fetch branches:", error);
            if (error.message !== "Unauthorized") {
                Alert.alert("Error", "Failed to load branches");
            }
        } finally {
            setLoadingBranches(false);
        }
    };

    const executeSend = async () => {
        setSending(true);
        try {
            const result = await adminApi.sendBroadcastMessage({
                branchId: targetBranchId,
                role: targetRole,
                title: title.trim(),
                message: message.trim()
            });
            
            if (result.success) {
                if (isWeb) {
                    window.alert(`Success: Broadcast sent successfully to ${result.count} users.`);
                } else {
                    Alert.alert('Success', `Broadcast sent successfully to ${result.count} users.`);
                }
                setTitle('');
                setMessage('');
            } else {
                if (isWeb) window.alert(result.message || 'Users processed.');
                else Alert.alert('Status', result.message || 'Users processed.');
            }
        } catch (error) {
            console.error("Broadcast error:", error);
            if (isWeb) window.alert(error.message || 'Failed to send broadcast');
            else Alert.alert('Error', error.message || 'Failed to send broadcast');
        } finally {
            setSending(false);
        }
    };

    const handleSend = async () => {
        if (!title.trim() || !message.trim()) {
            if (isWeb) window.alert('Title and Message are required.');
            else Alert.alert('Validation Error', 'Title and Message are required.');
            return;
        }

        const confirmMessage = `Are you sure you want to send this message to ${targetRole === 'all' ? 'all users' : targetRole + 's'} in ${targetBranchId === 'all' ? 'All Branches' : 'the selected branch'}?`;

        if (isWeb) {
            if (window.confirm(confirmMessage)) {
                executeSend();
            }
        } else {
            Alert.alert(
                'Confirm Broadcast',
                confirmMessage,
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Send', onPress: executeSend }
                ]
            );
        }
    };

    return (
        <View style={styles.container}>
            <AdminDrawer
                visible={drawerVisible}
                onClose={() => setDrawerVisible(false)}
                navigation={navigation}
                currentScreen="AdminBroadcast"
                extraParams={{ branchId, gymCode, branchName }}
            />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#4A5568" />
                </TouchableOpacity>
                <Text style={styles.pageTitle}>Broadcast Message</Text>
                <TouchableOpacity
                    onPress={() => navigation.navigate('AdminInbox', { branchId, gymCode, branchName })}
                    style={styles.inboxButton}
                >
                    <Ionicons name="chatbubbles" size={22} color="#3182CE" />
                    <Text style={styles.inboxButtonText}>Inbox</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>New Broadcast</Text>
                    <Text style={styles.cardSubtitle}>Send a push notification and in-app message to your members or trainers.</Text>

                    {/* Filter Section */}
                    <View style={styles.filtersContainer}>
                        <View style={styles.filterGroup}>
                            <Text style={styles.label}>Target Branch</Text>
                            <View style={styles.dropdownContainer}>
                                {loadingBranches ? (
                                    <ActivityIndicator size="small" color="#3182CE" />
                                ) : (
                                    <select
                                        style={styles.webSelect}
                                        value={targetBranchId}
                                        onChange={(e) => setTargetBranchId(e.target.value)}
                                        disabled={isWeb ? undefined : true}
                                    >
                                        <option value="all">All Branches</option>
                                        {branches.map(b => (
                                            <option key={b.id} value={b.id}>{b.name} ({b.city})</option>
                                        ))}
                                    </select>
                                )}
                                {!isWeb && <Text style={styles.mobileSelectText}>Web feature. Defaulting to all branches or please use Web version for dropdowns.</Text>}
                            </View>
                        </View>

                        <View style={styles.filterGroup}>
                            <Text style={styles.label}>Target Role</Text>
                            <View style={styles.dropdownContainer}>
                                <select
                                    style={styles.webSelect}
                                    value={targetRole}
                                    onChange={(e) => setTargetRole(e.target.value)}
                                    disabled={isWeb ? undefined : true}
                                >
                                    <option value="all">All Members & Trainers</option>
                                    <option value="member">Members Only</option>
                                    <option value="trainer">Trainers Only</option>
                                </select>
                                {!isWeb && <Text style={styles.mobileSelectText}>Please use Web version for dropdowns.</Text>}
                            </View>
                        </View>
                    </View>

                    {/* Message Details */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Message Title</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="E.g., Gym Closed Tomorrow"
                            value={title}
                            onChangeText={setTitle}
                            maxLength={100}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Message Body</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Type your message here..."
                            value={message}
                            onChangeText={setMessage}
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                        />
                    </View>

                    <TouchableOpacity 
                        style={[styles.button, (!title.trim() || !message.trim() || sending) && styles.buttonDisabled]} 
                        onPress={handleSend}
                        disabled={!title.trim() || !message.trim() || sending}
                    >
                        {sending ? (
                            <ActivityIndicator color="#FFF" size="small" />
                        ) : (
                            <>
                                <Ionicons name="send" size={20} color="#FFF" />
                                <Text style={styles.buttonText}>Send Broadcast</Text>
                            </>
                        )}
                    </TouchableOpacity>

                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F7FAFC' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
    backButton: { padding: 4 },
    menuButton: { padding: 4 },
    pageTitle: { fontSize: 20, fontWeight: 'bold', color: '#1A202C' },
    scrollContent: { padding: 20, alignItems: 'center' },
    card: { backgroundColor: '#FFF', padding: 24, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2, width: '100%', maxWidth: 600 },
    cardTitle: { fontSize: 20, fontWeight: 'bold', color: '#2D3748', marginBottom: 8 },
    cardSubtitle: { fontSize: 14, color: '#718096', marginBottom: 24 },
    
    filtersContainer: { flexDirection: 'row', gap: 16, marginBottom: 24, flexWrap: 'wrap' },
    filterGroup: { flex: 1, minWidth: 200 },
    label: { fontSize: 14, fontWeight: '600', color: '#4A5568', marginBottom: 8 },
    dropdownContainer: { marginBottom: 8 },
    webSelect: { width: '100%', padding: 12, borderRadius: 8, borderColor: '#CBD5E0', borderWidth: 1, backgroundColor: '#FFF', color: '#2D3748', fontSize: 14, outline: 'none' },
    mobileSelectText: { fontSize: 12, color: '#A0AEC0', fontStyle: 'italic', marginTop: 4 },
    
    inputGroup: { marginBottom: 20 },
    input: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, padding: 12, fontSize: 16, color: '#2D3748', backgroundColor: '#FFF' },
    textArea: { height: 120 },
    
    button: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#3182CE', padding: 16, borderRadius: 8, gap: 8, marginTop: 8 },
    buttonDisabled: { backgroundColor: '#A0AEC0' },
    buttonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
    inboxButton: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6, paddingHorizontal: 10, backgroundColor: '#EBF8FF', borderRadius: 8 },
    inboxButtonText: { color: '#3182CE', fontWeight: '700', fontSize: 14 },
});

export default AdminBroadcastScreen;
