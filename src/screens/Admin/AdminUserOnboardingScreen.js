import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Modal,
    Platform,
    Dimensions,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView
} from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import * as DocumentPicker from 'expo-document-picker';
import { adminApi } from '../../services/adminApi';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

// UI Components
import ScreenWrapper from '../../components/ScreenWrapper';
import GradientCard from '../../components/GradientCard';
import StandardInput from '../../components/StandardInput';
import AnimatedButton from '../../components/AnimatedButton';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme/theme';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

const normalizeRole = (role) => {
    if (!role) return 'Member';
    const lower = role.toLowerCase();
    if (lower === 'trainer') return 'Trainer';
    if (lower === 'owner') return 'Owner';
    if (lower === 'branch_admin') return 'Admin';
    return 'Member';
};

const AdminUserOnboardingScreen = ({ navigation, route }) => {
    const { branchId } = route.params || {};
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState('All');
    const [modalVisible, setModalVisible] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [convertingLeadId, setConvertingLeadId] = useState(null);
    const [inviteLink, setInviteLink] = useState('');
    const [inviteRole, setInviteRole] = useState('Member');
    const [generatedLinks, setGeneratedLinks] = useState([]);
    const [plans, setPlans] = useState([]);
    const [membershipPlans, setMembershipPlans] = useState([]);
    const [ptPlans, setPtPlans] = useState([]);
    const [loadedBranchId, setLoadedBranchId] = useState(null);

    useFocusEffect(
        React.useCallback(() => {
            if (branchId) {
                if (branchId !== loadedBranchId) {
                    setUsers([]);
                    setLoading(true);
                } else if (users.length === 0) {
                    setLoading(true);
                }
                fetchData();
            } else {
                setLoading(false);
            }
        }, [branchId, loadedBranchId, users.length])
    );

    React.useEffect(() => {
        if (route.params?.prefill) {
            setCurrentUser({
                ...route.params.prefill,
                assignedTrainer: '',
                role: 'Member'
            });
            if (route.params.leadId) {
                setConvertingLeadId(route.params.leadId);
            }
            setModalVisible(true);
            navigation.setParams({ prefill: null, leadId: null });
        }
    }, [route.params]);

    const fetchData = async () => {
        try {
            const usersData = await adminApi.getUsers(branchId);
            const plansData = await adminApi.getPlans(branchId);

            if (Array.isArray(usersData)) {
                const mappedUsers = usersData.map(u => ({
                    id: u.id,
                    name: u.full_name || 'No Name',
                    phone: u.phone_number || '-',
                    email: u.email || '',
                    role: normalizeRole(u.role),
                    gymId: u.gym_code || '-',
                    assignedTrainerId: u.assigned_trainer_id || null,
                    assignedTrainer: u.assigned_trainer_name || '-',
                    status: u.status || 'Active',
                    plan_id: u.plan_id,
                    pt_plan_id: u.pt_plan_id,
                    address: u.address || ''
                }));
                setUsers(mappedUsers);
            } else {
                setUsers([]);
            }

            if (Array.isArray(plansData)) {
                setPlans(plansData);
                setMembershipPlans(plansData.filter(p => !p.type || p.type === 'Membership'));
                setPtPlans(plansData.filter(p => p.type === 'Personal Training'));
            }
            setLoadedBranchId(branchId);
        } catch (error) {
            console.error("Failed to fetch data:", error);
            Alert.alert("Error", "Failed to load users: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const data = await adminApi.getUsers(branchId);
            if (Array.isArray(data)) {
                const mappedUsers = data.map(u => ({
                    id: u.id,
                    name: u.full_name || 'No Name',
                    phone: u.phone_number || '-',
                    email: u.email || '',
                    role: normalizeRole(u.role),
                    gymId: u.gym_code || '-',
                    assignedTrainerId: u.assigned_trainer_id || null,
                    assignedTrainer: u.assigned_trainer_name || '-',
                    status: u.status || 'Active',
                    plan_id: u.plan_id,
                    pt_plan_id: u.pt_plan_id,
                    address: u.address || ''
                }));
                setUsers(mappedUsers);
            }
        } catch (error) {
            console.error("Failed to fetch users:", error);
        } finally {
            setLoading(false);
        }
    };

    const totalMembers = users.filter(u => u.role === 'Member' || u.role === 'member').length;
    const totalTrainers = users.filter(u => u.role === 'Trainer' || u.role === 'trainer').length;
    const pendingInvites = 0;

    const handleAddUser = () => {
        setCurrentUser({ name: '', phone: '', email: '', role: 'Member', assignedTrainer: '', address: '', plan_id: null, pt_plan_id: null });
        setModalVisible(true);
    };

    const handleEditUser = (user) => {
        setCurrentUser({ ...user });
        setModalVisible(true);
    };

    const handleDeleteUser = async (id) => {
        if (confirm('Are you sure you want to remove this user from the gym?')) {
            try {
                await adminApi.deleteUser(id, branchId);
                setUsers(users.filter(u => u.id !== id));
            } catch (error) {
                alert('Failed to delete user');
                console.error(error);
            }
        }
    };

    const handleSaveUser = async () => {
        if (!currentUser.name) {
            alert('Please fill in required fields');
            return;
        }

        setLoading(true);
        try {
            if (currentUser.id) {
                await adminApi.updateUser({
                    id: currentUser.id,
                    name: currentUser.name,
                    phone: currentUser.phone,
                    role: currentUser.role,
                    address: currentUser.address,
                    plan_id: currentUser.plan_id,
                    pt_plan_id: currentUser.pt_plan_id,
                    assigned_trainer_id: currentUser.assignedTrainerId
                }, branchId);
                setUsers(users.map(u => u.id === currentUser.id ? { ...u, ...currentUser } : u));
            } else {
                await adminApi.createUser({
                    name: currentUser.name,
                    phone: currentUser.phone,
                    email: currentUser.email,
                    role: currentUser.role,
                    address: currentUser.address,
                    plan_id: currentUser.plan_id,
                    pt_plan_id: currentUser.pt_plan_id,
                    assigned_trainer_id: currentUser.assignedTrainerId
                }, branchId);
                await fetchUsers();
                if (convertingLeadId) {
                    try {
                        await adminApi.updateLead({ id: convertingLeadId, status: 'Converted' }, branchId);
                    } catch (e) {
                        console.error("Failed to update lead status", e);
                    }
                    setConvertingLeadId(null);
                }
                Alert.alert("Success", "User added. They will appear as 'Pending' until they sign in.");
            }
            setModalVisible(false);
        } catch (error) {
            Alert.alert('Error', error.message || 'Failed to save user');
        } finally {
            setLoading(false);
        }
    };

    const generateInviteLink = () => {
        const link = `https://fitapp.com/invite/${Math.random().toString(36).substring(7)}`;
        setInviteLink(link);
        setGeneratedLinks([...generatedLinks, { link, role: inviteRole, date: new Date().toLocaleDateString() }]);
    };

    const handleDownloadSample = () => {
        const header = "name,phone,email,role,subscription,address,assignedTrainer\n";
        const sample = "John Doe,1234567890,john@example.com,Member,Basic Plan,123 Main St,\nJane Smith,0987654321,jane@example.com,Trainer,,\n";
        const csvContent = header + sample;

        if (Platform.OS === 'web') {
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'fitapp_users_sample.csv';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } else {
            Alert.alert("Info", "Sample download not implemented for mobile yet. Please copy:\n" + csvContent);
        }
    };

    const handleFileUpload = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['text/csv', 'application/vnd.ms-excel', 'text/comma-separated-values', 'text/plain'],
                copyToCacheDirectory: true
            });

            if (result.canceled) return;

            const file = result.assets[0];
            const content = await fetch(file.uri).then(r => r.text());

            const rows = content.split('\n').map(row => row.trim()).filter(row => row);
            if (rows.length < 2) return;

            const headers = rows[0].split(',').map(h => h.trim().toLowerCase());

            const usersToImport = rows.slice(1).map(row => {
                const values = row.split(',').map(v => v.trim());
                const user = {};
                headers.forEach((h, i) => {
                    let key = h;
                    if (key === 'full name') key = 'name';
                    user[key] = values[i] || '';
                });

                if (user.subscription) {
                    const plan = plans.find(p => p.name.toLowerCase() === user.subscription.toLowerCase());
                    if (plan) {
                        user.plan_id = plan.id;
                    }
                }

                return user;
            }).filter(u => u.name && (u.phone || u.email));

            if (usersToImport.length === 0) {
                Alert.alert("Error", "No valid users found in CSV.");
                return;
            }

            if (Platform.OS === 'web') {
                if (confirm(`Found ${usersToImport.length} users. Import them?`)) {
                    await performBulkImport(usersToImport);
                }
            } else {
                Alert.alert(
                    "Confirm Import",
                    `Found ${usersToImport.length} users. Import them?`,
                    [
                        { text: "Cancel", style: "cancel" },
                        { text: "Import", onPress: () => performBulkImport(usersToImport) }
                    ]
                );
            }

        } catch (error) {
            console.error("File upload error", error);
            Alert.alert("Error", "Failed to upload file");
        }
    };

    const performBulkImport = async (usersToImport) => {
        setLoading(true);
        try {
            await adminApi.bulkCreateUsers(usersToImport, branchId);
            Alert.alert("Success", "Users imported successfully");
            fetchUsers();
        } catch (error) {
            Alert.alert("Error", "Import failed: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) || user.phone.includes(searchQuery);
        const matchesFilter = filter === 'All' ||
            (filter === 'Members' && user.role === 'Member') ||
            (filter === 'Trainers' && user.role === 'Trainer') ||
            (filter === 'Pending' && user.status === 'Pending');
        return matchesSearch && matchesFilter;
    });

    return (
        <ScreenWrapper useGradient={false} style={styles.container}>
            {/* Sidebar for Web */}
            {isWeb && width > 768 && (
                <View style={styles.sidebar}>
                    <View style={styles.sidebarHeader}>
                        <Ionicons name="fitness" size={32} color={colors.primary} />
                        <Text style={styles.sidebarTitle}>FitPlatform</Text>
                    </View>
                    <TouchableOpacity style={styles.sidebarItem} onPress={() => navigation.navigate('AdminDashboard', { branchId, gymCode: route.params?.gymCode, branchName: route.params?.branchName })}>
                        <Ionicons name="grid-outline" size={20} color={colors.text.secondary} />
                        <Text style={styles.sidebarItemText}>Dashboard</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.sidebarItem} onPress={() => navigation.navigate('AdminLeadManagement', { branchId, gymCode: route.params?.gymCode, branchName: route.params?.branchName })}>
                        <Ionicons name="funnel-outline" size={20} color={colors.text.secondary} />
                        <Text style={styles.sidebarItemText}>Leads</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.sidebarItem} onPress={() => navigation.navigate('AdminBranding', { branchId, gymCode: route.params?.gymCode, branchName: route.params?.branchName })}>
                        <Ionicons name="color-palette-outline" size={20} color={colors.text.secondary} />
                        <Text style={styles.sidebarItemText}>Branding</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.sidebarItemActive}>
                        <Ionicons name="people" size={20} color={colors.primary} />
                        <Text style={styles.sidebarItemTextActive}>Users</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.sidebarItem} onPress={() => navigation.navigate('AdminSettings', { branchId, gymCode: route.params?.gymCode, branchName: route.params?.branchName })}>
                        <Ionicons name="settings-outline" size={20} color={colors.text.secondary} />
                        <Text style={styles.sidebarItemText}>Settings</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.sidebarItem} onPress={() => navigation.navigate('AdminBilling', { branchId, gymCode: route.params?.gymCode, branchName: route.params?.branchName })}>
                        <Ionicons name="card-outline" size={20} color={colors.text.secondary} />
                        <Text style={styles.sidebarItemText}>Billing</Text>
                    </TouchableOpacity>
                </View>
            )}

            <ScrollView style={styles.mainContent} contentContainerStyle={styles.contentContainer}>
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.pageTitle}>User Onboarding & Management</Text>
                        <Text style={styles.pageSubtitle}>Manage your gym members and trainers</Text>
                    </View>
                    <AnimatedButton
                        title="Add User"
                        onPress={handleAddUser}
                        icon={<Ionicons name="add" size={20} color={colors.white} />}
                        style={{ width: 140 }}
                    />
                </View>

                {/* Quick Stats */}
                <View style={styles.statsContainer}>
                    <GradientCard
                        style={styles.statCard}
                        contentStyle={styles.statCardContent}
                        useGradient={true}
                        fullHeight={true}
                    >
                        <View style={styles.statIconContainer}>
                            <Ionicons name="people" size={24} color={colors.white} />
                        </View>
                        <View>
                            <Text style={styles.statLabelLight}>Total Members</Text>
                            <Text style={styles.statValueLight}>{totalMembers}</Text>
                        </View>
                    </GradientCard>
                    <GradientCard
                        style={styles.statCard}
                        contentStyle={styles.statCardContent}
                        useGradient={true}
                        gradientColors={colors.trainerGradient}
                        fullHeight={true}
                    >
                        <View style={styles.statIconContainer}>
                            <Ionicons name="fitness" size={24} color={colors.white} />
                        </View>
                        <View>
                            <Text style={styles.statLabelLight}>Total Trainers</Text>
                            <Text style={styles.statValueLight}>{totalTrainers}</Text>
                        </View>
                    </GradientCard>
                    <GradientCard
                        style={styles.statCard}
                        contentStyle={styles.statCardContent}
                        useGradient={true}
                        gradientColors={colors.accentGradient}
                        fullHeight={true}
                    >
                        <View style={styles.statIconContainer}>
                            <Ionicons name="mail" size={24} color={colors.white} />
                        </View>
                        <View>
                            <Text style={styles.statLabelLight}>Pending Invites</Text>
                            <Text style={styles.statValueLight}>{pendingInvites}</Text>
                        </View>
                    </GradientCard>
                </View>

                <View style={styles.gridContainer}>
                    {/* Bulk Import */}
                    <GradientCard style={styles.gridItem} glassmorphic={true}>
                        <Text style={styles.cardTitle}>Bulk Import</Text>
                        <View style={styles.uploadArea}>
                            <Ionicons name="cloud-upload-outline" size={40} color={colors.text.tertiary} />
                            <Text style={styles.uploadText}>Drag & drop CSV file here</Text>
                            <Text style={styles.uploadHint}>Supported fields: name, phone, email, role, address, assignedTrainer</Text>
                            <AnimatedButton
                                title="Upload CSV File"
                                onPress={handleFileUpload}
                                variant="outline"
                                style={{ marginTop: spacing.md }}
                            />
                        </View>
                        <TouchableOpacity style={styles.linkButton} onPress={handleDownloadSample}>
                            <Text style={styles.linkButtonText}>Download sample CSV</Text>
                        </TouchableOpacity>
                    </GradientCard>

                    {/* Invitation Links */}
                    <GradientCard style={styles.gridItem} glassmorphic={true}>
                        <Text style={styles.cardTitle}>Invitation Links</Text>
                        <View style={styles.inviteControls}>
                            <View style={styles.selectWrapper}>
                                <Text style={styles.label}>Role:</Text>
                                <View style={styles.roleToggle}>
                                    <TouchableOpacity
                                        style={[styles.roleOption, inviteRole === 'Member' && styles.roleOptionActive]}
                                        onPress={() => setInviteRole('Member')}
                                    >
                                        <Text style={[styles.roleOptionText, inviteRole === 'Member' && styles.roleOptionTextActive]}>Member</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.roleOption, inviteRole === 'Trainer' && styles.roleOptionActive]}
                                        onPress={() => setInviteRole('Trainer')}
                                    >
                                        <Text style={[styles.roleOptionText, inviteRole === 'Trainer' && styles.roleOptionTextActive]}>Trainer</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                            <AnimatedButton
                                title="Generate Link"
                                onPress={generateInviteLink}
                                variant="secondary"
                                size="small"
                                style={{ width: 120 }}
                            />
                        </View>
                        {inviteLink ? (
                            <View style={styles.linkDisplay}>
                                <Text style={styles.linkText} numberOfLines={1}>{inviteLink}</Text>
                                <TouchableOpacity onPress={() => alert('Copied!')}>
                                    <Ionicons name="copy-outline" size={20} color={colors.primary} />
                                </TouchableOpacity>
                            </View>
                        ) : null}
                        <View style={styles.recentLinks}>
                            <Text style={styles.subHeader}>Recent Links</Text>
                            {generatedLinks.map((link, index) => (
                                <View key={index} style={styles.linkItem}>
                                    <Text style={styles.linkItemText}>{link.role} Invite - {link.date}</Text>
                                </View>
                            ))}
                        </View>
                    </GradientCard>
                </View>

                {/* User Management Table */}
                <GradientCard style={styles.tableCard} glassmorphic={true}>
                    <View style={styles.tableHeader}>
                        <Text style={styles.cardTitle}>User Management</Text>
                        <View style={styles.tableControls}>
                            <StandardInput
                                placeholder="Search by name or phone..."
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                containerStyle={{ width: 250, marginBottom: 0 }}
                                leftIcon={<Ionicons name="search" size={18} color={colors.text.tertiary} />}
                            />
                            <View style={styles.filterTabs}>
                                {['All', 'Members', 'Trainers', 'Pending'].map(f => (
                                    <TouchableOpacity
                                        key={f}
                                        style={[styles.filterTab, filter === f && styles.filterTabActive]}
                                        onPress={() => setFilter(f)}
                                    >
                                        <Text style={[styles.filterTabText, filter === f && styles.filterTabTextActive]}>{f}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    </View>

                    <ScrollView horizontal={true} showsHorizontalScrollIndicator={true}>
                        <View style={styles.tableContainer}>
                            {loading ? (
                                <View style={{ padding: 40, alignItems: 'center', width: '100%' }}>
                                    <ActivityIndicator size="large" color={colors.primary} />
                                    <Text style={{ marginTop: 10, color: colors.text.secondary }}>Loading users...</Text>
                                </View>
                            ) : filteredUsers.length === 0 ? (
                                <View style={{ padding: 40, alignItems: 'center', width: '100%' }}>
                                    <Ionicons name="people-outline" size={48} color={colors.text.disabled} />
                                    <Text style={{ marginTop: 16, color: colors.text.secondary, fontSize: 16 }}>No users found.</Text>
                                </View>
                            ) : (
                                <View>
                                    <View style={styles.tableRowHeader}>
                                        <Text style={[styles.tableCell, styles.colAvatar]}></Text>
                                        <Text style={[styles.tableCell, styles.colName, styles.headerText]}>Full Name</Text>
                                        <Text style={[styles.tableCell, styles.colPhone, styles.headerText]}>Phone</Text>
                                        <Text style={[styles.tableCell, styles.colRole, styles.headerText]}>Role</Text>
                                        <Text style={[styles.tableCell, styles.colSubscription, styles.headerText]}>Subscription</Text>
                                        <Text style={[styles.tableCell, styles.colGymId, styles.headerText]}>Gym ID</Text>
                                        <Text style={[styles.tableCell, styles.colTrainer, styles.headerText]}>Assigned Trainer</Text>
                                        <Text style={[styles.tableCell, styles.colStatus, styles.headerText]}>Status</Text>
                                        <Text style={[styles.tableCell, styles.colActions, styles.headerText]}>Actions</Text>
                                    </View>
                                    {filteredUsers.map(user => {
                                        const planName = plans.find(p => p.id === user.plan_id)?.name || '-';
                                        return (
                                            <View key={user.id} style={styles.tableRow}>
                                                <View style={[styles.tableCell, styles.colAvatar]}>
                                                    <View style={styles.avatarPlaceholder}>
                                                        <Text style={styles.avatarText}>{user.name.charAt(0)}</Text>
                                                    </View>
                                                </View>
                                                <Text style={[styles.tableCell, styles.colName]}>{user.name}</Text>
                                                <Text style={[styles.tableCell, styles.colPhone]}>{user.phone}</Text>
                                                <View style={[styles.tableCell, styles.colRole]}>
                                                    <View style={[
                                                        styles.badge,
                                                        user.role === 'Trainer' ? styles.badgeTrainer :
                                                            user.role === 'Owner' ? styles.badgeOwner :
                                                                user.role === 'Admin' ? styles.badgeAdmin :
                                                                    styles.badgeMember
                                                    ]}>
                                                        <Text style={[
                                                            styles.badgeText,
                                                            user.role === 'Trainer' ? styles.badgeTextTrainer :
                                                                user.role === 'Owner' ? styles.badgeTextOwner :
                                                                    user.role === 'Admin' ? styles.badgeTextAdmin :
                                                                        styles.badgeTextMember
                                                        ]}>{user.role}</Text>
                                                    </View>
                                                </View>
                                                <Text style={[styles.tableCell, styles.colSubscription]}>{planName}</Text>
                                                <Text style={[styles.tableCell, styles.colGymId]}>{user.gymId}</Text>
                                                <Text style={[styles.tableCell, styles.colTrainer]}>{user.assignedTrainer}</Text>
                                                <View style={[styles.tableCell, styles.colStatus]}>
                                                    <View style={[styles.statusDot, user.status === 'Active' ? styles.statusActive : styles.statusPending]} />
                                                    <Text style={styles.statusText}>{user.status}</Text>
                                                </View>
                                                <View style={[styles.tableCell, styles.colActions]}>
                                                    <TouchableOpacity onPress={() => handleEditUser(user)} style={styles.actionButton}>
                                                        <Ionicons name="create-outline" size={18} color={colors.text.secondary} />
                                                    </TouchableOpacity>
                                                    <TouchableOpacity onPress={() => handleDeleteUser(user.id)} style={styles.actionButton}>
                                                        <Ionicons name="trash-outline" size={18} color={colors.error} />
                                                    </TouchableOpacity>
                                                </View>
                                            </View>
                                        );
                                    })}
                                </View>
                            )}
                        </View>
                    </ScrollView>
                </GradientCard>
            </ScrollView>

            {/* Add/Edit User Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text style={styles.modalTitle}>{currentUser?.id ? 'Edit User' : 'Add New User'}</Text>

                            <StandardInput
                                label="Full Name"
                                value={currentUser?.name}
                                onChangeText={(t) => setCurrentUser({ ...currentUser, name: t })}
                            />

                            <StandardInput
                                label="Phone"
                                value={currentUser?.phone}
                                onChangeText={(t) => setCurrentUser({ ...currentUser, phone: t })}
                                keyboardType="phone-pad"
                            />

                            <StandardInput
                                label="Email"
                                value={currentUser?.email}
                                onChangeText={(t) => setCurrentUser({ ...currentUser, email: t })}
                                keyboardType="email-address"
                            />

                            <StandardInput
                                label="Address"
                                value={currentUser?.address}
                                onChangeText={(t) => setCurrentUser({ ...currentUser, address: t })}
                                placeholder="Enter full address"
                            />

                            <Text style={styles.label}>Role</Text>
                            <View style={styles.roleToggle}>
                                <TouchableOpacity
                                    style={[styles.roleOption, currentUser?.role === 'Member' && styles.roleOptionActive]}
                                    onPress={() => setCurrentUser({ ...currentUser, role: 'Member' })}
                                >
                                    <Text style={[styles.roleOptionText, currentUser?.role === 'Member' && styles.roleOptionTextActive]}>Member</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.roleOption, currentUser?.role === 'Trainer' && styles.roleOptionActive]}
                                    onPress={() => setCurrentUser({ ...currentUser, role: 'Trainer' })}
                                >
                                    <Text style={[styles.roleOptionText, currentUser?.role === 'Trainer' && styles.roleOptionTextActive]}>Trainer</Text>
                                </TouchableOpacity>
                            </View>

                            {currentUser?.role === 'Member' && (
                                <>
                                    <Text style={styles.label}>Subscription Plan</Text>
                                    <View style={styles.pickerContainer}>
                                        <Dropdown
                                            style={styles.dropdown}
                                            placeholderStyle={styles.placeholderStyle}
                                            selectedTextStyle={styles.selectedTextStyle}
                                            data={membershipPlans}
                                            maxHeight={300}
                                            labelField="name"
                                            valueField="id"
                                            placeholder="Select Main Membership (Required)"
                                            value={currentUser?.plan_id}
                                            onChange={item => {
                                                setCurrentUser({ ...currentUser, plan_id: item.id });
                                            }}
                                        />
                                    </View>

                                    <Text style={styles.label}>Personal Training Plan (Optional)</Text>
                                    <View style={styles.pickerContainer}>
                                        <Dropdown
                                            style={styles.dropdown}
                                            placeholderStyle={styles.placeholderStyle}
                                            selectedTextStyle={styles.selectedTextStyle}
                                            data={ptPlans}
                                            maxHeight={300}
                                            labelField="name"
                                            valueField="id"
                                            placeholder="Select PT Plan"
                                            value={currentUser?.pt_plan_id}
                                            onChange={item => {
                                                setCurrentUser({ ...currentUser, pt_plan_id: item.id });
                                            }}
                                        />
                                    </View>

                                    <Text style={styles.label}>Assigned Trainer</Text>
                                    <View style={styles.pickerContainer}>
                                        <Dropdown
                                            style={styles.dropdown}
                                            placeholderStyle={styles.placeholderStyle}
                                            selectedTextStyle={styles.selectedTextStyle}
                                            data={users.filter(u => u.role === 'Trainer')}
                                            maxHeight={300}
                                            labelField="name"
                                            valueField="id"
                                            placeholder="Select Trainer (Optional)"
                                            value={currentUser?.assignedTrainerId}
                                            onChange={item => {
                                                setCurrentUser({ ...currentUser, assignedTrainerId: item.id, assignedTrainer: item.name });
                                            }}
                                        />
                                    </View>
                                </>
                            )}

                            <View style={styles.modalActions}>
                                <AnimatedButton
                                    title="Cancel"
                                    onPress={() => setModalVisible(false)}
                                    variant="outline"
                                    style={{ flex: 1, marginRight: spacing.sm }}
                                />
                                <AnimatedButton
                                    title="Save User"
                                    onPress={handleSaveUser}
                                    style={{ flex: 1, marginLeft: spacing.sm }}
                                />
                            </View>
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'row',
    },
    sidebar: {
        width: 250,
        backgroundColor: colors.white,
        borderRightWidth: 1,
        borderRightColor: colors.border,
        paddingVertical: 24,
        paddingHorizontal: 16,
    },
    sidebarHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 40,
        paddingHorizontal: 8,
    },
    sidebarTitle: {
        fontSize: typography.fontSize.xl,
        fontWeight: 'bold',
        color: colors.text.primary,
        marginLeft: 10,
    },
    sidebarItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderRadius: borderRadius.md,
        marginBottom: 4,
    },
    sidebarItemActive: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderRadius: borderRadius.md,
        marginBottom: 4,
        backgroundColor: '#EBF8FF',
    },
    sidebarItemText: {
        fontSize: typography.fontSize.md,
        color: colors.text.secondary,
        marginLeft: 12,
    },
    sidebarItemTextActive: {
        fontSize: typography.fontSize.md,
        color: colors.primary,
        marginLeft: 12,
        fontWeight: '600',
    },
    mainContent: {
        flex: 1,
    },
    contentContainer: {
        padding: spacing.xxl,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.xxl,
        flexWrap: 'wrap',
        gap: 16,
    },
    pageTitle: {
        fontSize: typography.fontSize.xxxl,
        fontWeight: 'bold',
        color: colors.text.primary,
        marginBottom: 4,
    },
    pageSubtitle: {
        fontSize: typography.fontSize.md,
        color: colors.text.secondary,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        flexWrap: 'wrap', // Ensure wrapping on mobile
        marginBottom: spacing.xxl,
        gap: spacing.lg,
    },
    statCard: {
        flex: 1,
        minWidth: 200,
    },
    statCardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.lg,
    },
    statIconContainer: {
        width: 48,
        height: 48,
        borderRadius: borderRadius.lg,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.lg,
    },
    statLabelLight: {
        fontSize: typography.fontSize.sm,
        color: colors.white,
        opacity: 0.9,
    },
    statValueLight: {
        fontSize: typography.fontSize.xxl,
        fontWeight: 'bold',
        color: colors.white,
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.lg,
        marginBottom: spacing.xxl,
    },
    gridItem: {
        flex: 1,
        minWidth: 300,
    },
    cardTitle: {
        fontSize: typography.fontSize.lg,
        fontWeight: 'bold',
        color: colors.text.primary,
        marginBottom: spacing.lg,
    },
    uploadArea: {
        borderWidth: 2,
        borderColor: colors.border,
        borderStyle: 'dashed',
        borderRadius: borderRadius.lg,
        padding: spacing.xl,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.background.secondary,
    },
    uploadText: {
        fontSize: typography.fontSize.md,
        fontWeight: '600',
        color: colors.text.secondary,
        marginBottom: spacing.xs,
        marginTop: spacing.sm,
    },
    uploadHint: {
        fontSize: typography.fontSize.sm,
        color: colors.text.tertiary,
        marginBottom: spacing.md,
        textAlign: 'center',
    },
    linkButton: {
        marginTop: spacing.md,
        alignSelf: 'center',
    },
    linkButtonText: {
        color: colors.primary,
        fontSize: typography.fontSize.sm,
        fontWeight: '500',
    },
    inviteControls: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.lg,
        flexWrap: 'wrap',
        gap: spacing.md,
    },
    selectWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    label: {
        fontSize: typography.fontSize.sm,
        fontWeight: '600',
        color: colors.text.secondary,
        marginRight: spacing.md,
        marginBottom: spacing.xs,
    },
    roleToggle: {
        flexDirection: 'row',
        backgroundColor: colors.background.secondary,
        borderRadius: borderRadius.md,
        padding: 4,
    },
    roleOption: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 6,
    },
    roleOptionActive: {
        backgroundColor: colors.white,
        ...shadows.sm,
    },
    roleOptionText: {
        fontSize: typography.fontSize.sm,
        color: colors.text.secondary,
    },
    roleOptionTextActive: {
        color: colors.primary,
        fontWeight: '600',
    },
    linkDisplay: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background.secondary,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        marginBottom: spacing.lg,
    },
    linkText: {
        flex: 1,
        color: colors.text.primary,
        fontSize: typography.fontSize.sm,
        marginRight: spacing.sm,
    },
    recentLinks: {
        marginTop: spacing.md,
    },
    subHeader: {
        fontSize: typography.fontSize.sm,
        fontWeight: 'bold',
        color: colors.text.secondary,
        marginBottom: spacing.sm,
    },
    linkItem: {
        paddingVertical: spacing.xs,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    linkItemText: {
        fontSize: typography.fontSize.sm,
        color: colors.text.tertiary,
    },
    tableCard: {
        flex: 1,
        padding: 0,
    },
    tableHeader: {
        padding: spacing.lg,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        flexWrap: 'wrap',
        gap: spacing.md,
    },
    tableControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    filterTabs: {
        flexDirection: 'row',
        backgroundColor: colors.background.secondary,
        borderRadius: borderRadius.md,
        padding: 4,
    },
    filterTab: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 6,
    },
    filterTabActive: {
        backgroundColor: colors.white,
        ...shadows.sm,
    },
    filterTabText: {
        fontSize: typography.fontSize.sm,
        color: colors.text.tertiary,
    },
    filterTabTextActive: {
        color: colors.primary,
        fontWeight: '600',
    },
    tableContainer: {
        minWidth: 1000,
    },
    tableRowHeader: {
        flexDirection: 'row',
        backgroundColor: colors.background.secondary,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        alignItems: 'center',
    },
    tableRow: {
        flexDirection: 'row',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    headerText: {
        fontWeight: '600',
        color: colors.text.secondary,
        fontSize: typography.fontSize.sm,
    },
    tableCell: {
        paddingHorizontal: spacing.sm,
    },
    colAvatar: { width: 50 },
    colName: { flex: 1.5, fontWeight: '500', color: colors.text.primary },
    colPhone: { flex: 1.2, color: colors.text.secondary },
    colRole: { flex: 1 },
    colSubscription: { flex: 1.2, color: colors.text.secondary },
    colGymId: { flex: 1, color: colors.text.tertiary },
    colTrainer: { flex: 1.2, color: colors.text.secondary },
    colStatus: { flex: 1 },
    colActions: { width: 80, flexDirection: 'row', gap: spacing.sm },

    avatarPlaceholder: {
        width: 32,
        height: 32,
        borderRadius: borderRadius.round,
        backgroundColor: colors.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: colors.white,
        fontWeight: 'bold',
        fontSize: typography.fontSize.sm,
    },
    badge: {
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: borderRadius.round,
        alignSelf: 'flex-start',
    },
    badgeMember: { backgroundColor: '#EBF8FF' },
    badgeTrainer: { backgroundColor: '#F0FFF4' },
    badgeOwner: { backgroundColor: '#FAF5FF' },
    badgeAdmin: { backgroundColor: '#FFF5F5' },
    badgeText: { fontSize: 12, fontWeight: '600' },
    badgeTextMember: { color: '#3182CE' },
    badgeTextTrainer: { color: '#38A169' },
    badgeTextOwner: { color: '#805AD5' },
    badgeTextAdmin: { color: '#E53E3E' },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    statusActive: { backgroundColor: colors.success },
    statusPending: { backgroundColor: colors.warning },
    statusText: { fontSize: typography.fontSize.sm, color: colors.text.secondary },

    // Modal Styles
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background.overlay,
        padding: spacing.lg,
    },
    modalContent: {
        width: '100%',
        maxWidth: 500,
        backgroundColor: colors.white,
        borderRadius: borderRadius.xl,
        padding: spacing.xl,
        ...shadows.xl,
        maxHeight: '90%',
    },
    modalTitle: {
        fontSize: typography.fontSize.xl,
        fontWeight: 'bold',
        color: colors.text.primary,
        marginBottom: spacing.lg,
        textAlign: 'center',
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: colors.input.border,
        borderRadius: borderRadius.md,
        backgroundColor: colors.input.background,
        marginBottom: spacing.lg,
    },
    dropdown: {
        height: 50,
        paddingHorizontal: spacing.md,
    },
    placeholderStyle: {
        fontSize: typography.fontSize.base,
        color: colors.input.placeholder,
    },
    selectedTextStyle: {
        fontSize: typography.fontSize.base,
        color: colors.text.primary,
    },
    modalActions: {
        flexDirection: 'row',
        marginTop: spacing.lg,
        paddingTop: spacing.lg,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
});

export default AdminUserOnboardingScreen;
