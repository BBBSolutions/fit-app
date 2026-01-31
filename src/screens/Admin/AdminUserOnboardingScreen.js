import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Modal, FlatList, Image, Platform, Dimensions, ActivityIndicator, Alert } from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import * as DocumentPicker from 'expo-document-picker';
import { adminApi } from '../../services/adminApi';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

const normalizeRole = (role) => {
    if (!role) return 'Member';
    return role.toLowerCase() === 'trainer' ? 'Trainer' : 'Member';
};


const AdminUserOnboardingScreen = ({ navigation, route }) => {
    const { branchId } = route.params || {}; // Get branchId from navigation params
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState('All');
    const [modalVisible, setModalVisible] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [convertingLeadId, setConvertingLeadId] = useState(null); // Track lead being converted
    const [inviteLink, setInviteLink] = useState('');
    const [inviteRole, setInviteRole] = useState('Member');
    const [generatedLinks, setGeneratedLinks] = useState([]);
    const [plans, setPlans] = useState([]);
    const [membershipPlans, setMembershipPlans] = useState([]);
    const [ptPlans, setPtPlans] = useState([]);

    React.useEffect(() => {
        fetchData();
    }, []);

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
        setLoading(true);
        try {
            const [usersData, plansData] = await Promise.all([
                adminApi.getUsers(branchId),
                adminApi.getPlans(branchId) // Assuming getPlans also filters by gym_code/branch
            ]);

            if (Array.isArray(usersData)) {
                const mappedUsers = usersData.map(u => ({
                    id: u.id,
                    name: u.full_name || 'No Name',
                    phone: u.phone_number || '-',
                    email: u.email || '',
                    role: normalizeRole(u.role),
                    gymId: u.gym_code || '-',
                    assignedTrainerId: u.assigned_trainer_id || null, // Capture ID
                    assignedTrainer: u.assigned_trainer_name || '-',  // Capture Name
                    status: u.status || 'Active',
                    plan_id: u.plan_id,
                    pt_plan_id: u.pt_plan_id,
                    address: u.address || ''
                }));
                setUsers(mappedUsers);
            }

            if (Array.isArray(plansData)) {
                setPlans(plansData);
                setMembershipPlans(plansData.filter(p => !p.type || p.type === 'Membership'));
                setPtPlans(plansData.filter(p => p.type === 'Personal Training'));
            }
        } catch (error) {
            console.error("Failed to fetch data:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const data = await adminApi.getUsers(branchId);
            if (Array.isArray(data)) {
                // Map backend fields to frontend model if needed
                const mappedUsers = data.map(u => ({
                    id: u.id,
                    name: u.full_name || 'No Name',
                    phone: u.phone_number || '-',
                    email: u.email || '',
                    role: normalizeRole(u.role),
                    gymId: u.gym_code || '-',
                    gymId: u.gym_code || '-',
                    assignedTrainerId: u.assigned_trainer_id || null, // Capture ID
                    assignedTrainer: u.assigned_trainer_name || '-',  // Capture Name
                    status: u.status || 'Active',
                    plan_id: u.plan_id,
                    pt_plan_id: u.pt_plan_id,
                    address: u.address || ''
                }));
                setUsers(mappedUsers);
            }
        } catch (error) {
            console.error("Failed to fetch users:", error);
            // setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    // Stats
    const totalMembers = users.filter(u => u.role === 'Member' || u.role === 'member').length;
    const totalTrainers = users.filter(u => u.role === 'Trainer' || u.role === 'trainer').length;
    const pendingInvites = 0; // users.filter(u => u.status === 'Pending').length;

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
                // Edit / Update
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

                // Refresh list locally or fetch
                setUsers(users.map(u => u.id === currentUser.id ? { ...u, ...currentUser } : u));
            } else {
                // Create New User (Invitation)
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

                // Refresh list from backend (which now includes the pending user)
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
        const header = "name,phone,email,role,address,assignedTrainer\n";
        const sample = "John Doe,1234567890,john@example.com,Member,123 Main St,\nJane Smith,0987654321,jane@example.com,Trainer,,\n";
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
        <View style={styles.container}>
            {/* Sidebar (Simplified) */}
            {isWeb && width > 768 && (
                <View style={styles.sidebar}>
                    <View style={styles.sidebarHeader}>
                        <Ionicons name="fitness" size={32} color="#3182CE" />
                        <Text style={styles.sidebarTitle}>FitPlatform</Text>
                    </View>
                    <TouchableOpacity style={styles.sidebarItem} onPress={() => navigation.navigate('AdminDashboard')}>
                        <Ionicons name="grid-outline" size={20} color="#4A5568" />
                        <Text style={styles.sidebarItemText}>Dashboard</Text>
                    </TouchableOpacity>
                    {/* <TouchableOpacity style={styles.sidebarItem} onPress={() => navigation.navigate('AdminContentManager')}>
                        <Ionicons name="document-text-outline" size={20} color="#4A5568" />
                        <Text style={styles.sidebarItemText}>Content</Text>
                    </TouchableOpacity> */}
                    <TouchableOpacity style={styles.sidebarItem} onPress={() => navigation.navigate('AdminLeadManagement')}>
                        <Ionicons name="funnel-outline" size={20} color="#4A5568" />
                        <Text style={styles.sidebarItemText}>Leads</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.sidebarItem}
                        onPress={() => navigation.navigate('AdminBranding')}
                    >
                        <Ionicons name="color-palette-outline" size={20} color="#4A5568" />
                        <Text style={styles.sidebarItemText}>Branding</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.sidebarItemActive}>
                        <Ionicons name="people-outline" size={20} color="#3182CE" />
                        <Text style={styles.sidebarItemTextActive}>Users</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.sidebarItem} onPress={() => navigation.navigate('AdminSettings')}>
                        <Ionicons name="settings-outline" size={20} color="#4A5568" />
                        <Text style={styles.sidebarItemText}>Settings</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.sidebarItem} onPress={() => navigation.navigate('AdminBilling')}>
                        <Ionicons name="card-outline" size={20} color="#4A5568" />
                        <Text style={styles.sidebarItemText}>Billing</Text>
                    </TouchableOpacity>
                    {/* <TouchableOpacity style={styles.sidebarItem} onPress={() => navigation.navigate('AdminAnalytics')}>
                        <Ionicons name="bar-chart-outline" size={20} color="#4A5568" />
                        <Text style={styles.sidebarItemText}>Analytics</Text>
                    </TouchableOpacity> */}
                </View>
            )}

            <ScrollView style={styles.mainContent} contentContainerStyle={styles.contentContainer}>
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.pageTitle}>User Onboarding & Management</Text>
                        <Text style={styles.pageSubtitle}>Import members and trainers, assign roles, and manage access.</Text>
                    </View>
                    <TouchableOpacity style={styles.primaryButton} onPress={handleAddUser}>
                        <Ionicons name="add" size={20} color="#FFF" />
                        <Text style={styles.primaryButtonText}>Add User</Text>
                    </TouchableOpacity>
                </View>

                {/* Quick Stats */}
                <View style={styles.statsContainer}>
                    <View style={styles.statCard}>
                        <Text style={styles.statLabel}>Total Members</Text>
                        <Text style={styles.statValue}>{totalMembers}</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statLabel}>Total Trainers</Text>
                        <Text style={styles.statValue}>{totalTrainers}</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statLabel}>Pending Invitations</Text>
                        <Text style={styles.statValue}>{pendingInvites}</Text>
                    </View>
                </View>

                <View style={styles.gridContainer}>
                    {/* Bulk Import */}
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Bulk Import</Text>
                        <View style={styles.uploadArea}>
                            <Ionicons name="cloud-upload-outline" size={40} color="#CBD5E0" />
                            <Text style={styles.uploadText}>Drag & drop CSV file here or click to upload</Text>
                            <Text style={styles.uploadHint}>Supported fields: name, phone, email, role, address, assignedTrainer</Text>
                            <TouchableOpacity style={styles.outlineButton} onPress={handleFileUpload}>
                                <Text style={styles.outlineButtonText}>Upload CSV File</Text>
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity style={styles.linkButton} onPress={handleDownloadSample}>
                            <Text style={styles.linkButtonText}>Download sample CSV</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Invitation Links */}
                    <View style={styles.card}>
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
                            <TouchableOpacity style={styles.secondaryButton} onPress={generateInviteLink}>
                                <Text style={styles.secondaryButtonText}>Generate Link</Text>
                            </TouchableOpacity>
                        </View>
                        {inviteLink ? (
                            <View style={styles.linkDisplay}>
                                <Text style={styles.linkText} numberOfLines={1}>{inviteLink}</Text>
                                <TouchableOpacity onPress={() => alert('Copied!')}>
                                    <Ionicons name="copy-outline" size={20} color="#3182CE" />
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
                    </View>
                </View>

                {/* User Management Table */}
                <View style={styles.tableCard}>
                    <View style={styles.tableHeader}>
                        <Text style={styles.cardTitle}>User Management</Text>
                        <View style={styles.tableControls}>
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Search by name or phone..."
                                value={searchQuery}
                                onChangeText={setSearchQuery}
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

                    <View style={styles.tableContainer}>
                        {loading ? (
                            <View style={{ padding: 20, alignItems: 'center' }}>
                                <ActivityIndicator size="large" color="#3182CE" />
                                <Text style={{ marginTop: 10, color: '#718096' }}>Loading users...</Text>
                            </View>
                        ) : filteredUsers.length === 0 ? (
                            <View style={{ padding: 40, alignItems: 'center', backgroundColor: '#FFF' }}>
                                <Ionicons name="people-outline" size={48} color="#CBD5E0" />
                                <Text style={{ marginTop: 16, color: '#718096', fontSize: 16 }}>No users found.</Text>
                                <Text style={{ color: '#A0AEC0', fontSize: 14 }}>Try adding a new user or inviting active members.</Text>
                            </View>
                        ) : (
                            <View>
                                <View style={styles.tableRowHeader}>
                                    <Text style={[styles.tableCell, styles.colAvatar]}></Text>
                                    <Text style={[styles.tableCell, styles.colName, styles.headerText]}>Full Name</Text>
                                    <Text style={[styles.tableCell, styles.colPhone, styles.headerText]}>Phone</Text>
                                    <Text style={[styles.tableCell, styles.colRole, styles.headerText]}>Role</Text>
                                    <Text style={[styles.tableCell, styles.colGymId, styles.headerText]}>Gym ID</Text>
                                    <Text style={[styles.tableCell, styles.colTrainer, styles.headerText]}>Assigned Trainer</Text>
                                    <Text style={[styles.tableCell, styles.colStatus, styles.headerText]}>Status</Text>
                                    <Text style={[styles.tableCell, styles.colActions, styles.headerText]}>Actions</Text>
                                </View>
                                {filteredUsers.map(user => (
                                    <View key={user.id} style={styles.tableRow}>
                                        <View style={[styles.tableCell, styles.colAvatar]}>
                                            <View style={styles.avatarPlaceholder}>
                                                <Text style={styles.avatarText}>{user.name.charAt(0)}</Text>
                                            </View>
                                        </View>
                                        <Text style={[styles.tableCell, styles.colName]}>{user.name}</Text>
                                        <Text style={[styles.tableCell, styles.colPhone]}>{user.phone}</Text>
                                        <View style={[styles.tableCell, styles.colRole]}>
                                            <View style={[styles.badge, user.role === 'Trainer' ? styles.badgeTrainer : styles.badgeMember]}>
                                                <Text style={[styles.badgeText, user.role === 'Trainer' ? styles.badgeTextTrainer : styles.badgeTextMember]}>{user.role}</Text>
                                            </View>
                                        </View>
                                        <Text style={[styles.tableCell, styles.colGymId]}>{user.gymId}</Text>
                                        <Text style={[styles.tableCell, styles.colTrainer]}>{user.assignedTrainer}</Text>
                                        <View style={[styles.tableCell, styles.colStatus]}>
                                            <View style={[styles.statusDot, user.status === 'Active' ? styles.statusActive : styles.statusPending]} />
                                            <Text style={styles.statusText}>{user.status}</Text>
                                        </View>
                                        <View style={[styles.tableCell, styles.colActions]}>
                                            <TouchableOpacity onPress={() => handleEditUser(user)} style={styles.actionButton}>
                                                <Ionicons name="create-outline" size={18} color="#4A5568" />
                                            </TouchableOpacity>
                                            <TouchableOpacity onPress={() => handleDeleteUser(user.id)} style={styles.actionButton}>
                                                <Ionicons name="trash-outline" size={18} color="#E53E3E" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>
                </View>
            </ScrollView>

            {/* Add/Edit User Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>{currentUser?.id ? 'Edit User' : 'Add New User'}</Text>

                        <Text style={styles.label}>Full Name</Text>
                        <TextInput
                            style={styles.input}
                            value={currentUser?.name}
                            onChangeText={(t) => setCurrentUser({ ...currentUser, name: t })}
                        />

                        <Text style={styles.label}>Phone</Text>
                        <TextInput
                            style={styles.input}
                            value={currentUser?.phone}
                            onChangeText={(t) => setCurrentUser({ ...currentUser, phone: t })}
                            keyboardType="phone-pad"
                        />

                        <Text style={styles.label}>Email</Text>
                        <TextInput
                            style={styles.input}
                            value={currentUser?.email}
                            onChangeText={(t) => setCurrentUser({ ...currentUser, email: t })}
                            keyboardType="email-address"
                        />

                        <Text style={styles.label}>Address</Text>
                        <TextInput
                            style={styles.input}
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
                            <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.saveButton} onPress={handleSaveUser}>
                                <Text style={styles.saveButtonText}>Save User</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View >
            </Modal >
        </View >
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: '#F7FAFC',
    },
    sidebar: {
        width: 250,
        backgroundColor: '#FFFFFF',
        borderRightWidth: 1,
        borderRightColor: '#E2E8F0',
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
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2D3748',
        marginLeft: 10,
    },
    sidebarItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderRadius: 8,
        marginBottom: 4,
    },
    sidebarItemActive: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderRadius: 8,
        marginBottom: 4,
        backgroundColor: '#EBF8FF',
    },
    sidebarItemText: {
        fontSize: 16,
        color: '#4A5568',
        marginLeft: 12,
    },
    sidebarItemTextActive: {
        fontSize: 16,
        color: '#3182CE',
        marginLeft: 12,
        fontWeight: '600',
    },
    mainContent: {
        flex: 1,
    },
    contentContainer: {
        padding: 32,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 32,
    },
    pageTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1A202C',
        marginBottom: 8,
    },
    pageSubtitle: {
        fontSize: 16,
        color: '#718096',
    },
    primaryButton: {
        backgroundColor: '#3182CE',
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    primaryButtonText: {
        color: '#FFF',
        fontWeight: 'bold',
        marginLeft: 8,
    },
    statsContainer: {
        flexDirection: 'row',
        gap: 24,
        marginBottom: 32,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#FFF',
        padding: 20,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    statLabel: {
        fontSize: 14,
        color: '#718096',
        marginBottom: 8,
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2D3748',
    },
    gridContainer: {
        flexDirection: width > 1024 ? 'row' : 'column',
        gap: 24,
        marginBottom: 32,
    },
    card: {
        flex: 1,
        backgroundColor: '#FFF',
        padding: 24,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2D3748',
        marginBottom: 20,
    },
    uploadArea: {
        borderWidth: 2,
        borderColor: '#E2E8F0',
        borderStyle: 'dashed',
        borderRadius: 12,
        padding: 32,
        alignItems: 'center',
        backgroundColor: '#F7FAFC',
        marginBottom: 16,
    },
    uploadText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#4A5568',
        marginTop: 12,
        textAlign: 'center',
    },
    uploadHint: {
        fontSize: 12,
        color: '#A0AEC0',
        marginTop: 8,
        marginBottom: 16,
        textAlign: 'center',
    },
    outlineButton: {
        borderWidth: 1,
        borderColor: '#3182CE',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 6,
        backgroundColor: '#FFF',
    },
    outlineButtonText: {
        color: '#3182CE',
        fontWeight: '600',
    },
    linkButton: {
        alignSelf: 'center',
    },
    linkButtonText: {
        color: '#718096',
        textDecorationLine: 'underline',
    },
    inviteControls: {
        marginBottom: 20,
    },
    selectWrapper: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4A5568',
        marginBottom: 8,
    },
    roleToggle: {
        flexDirection: 'row',
        backgroundColor: '#EDF2F7',
        borderRadius: 8,
        padding: 4,
    },
    roleOption: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 6,
    },
    roleOptionActive: {
        backgroundColor: '#FFF',
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    roleOptionText: {
        fontSize: 14,
        color: '#718096',
        fontWeight: '600',
    },
    roleOptionTextActive: {
        color: '#3182CE',
    },
    secondaryButton: {
        backgroundColor: '#EDF2F7',
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 8,
    },
    secondaryButtonText: {
        color: '#2D3748',
        fontWeight: '600',
    },
    linkDisplay: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EBF8FF',
        padding: 12,
        borderRadius: 8,
        marginBottom: 20,
        justifyContent: 'space-between',
    },
    linkText: {
        color: '#3182CE',
        flex: 1,
        marginRight: 10,
    },
    recentLinks: {
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        paddingTop: 16,
    },
    subHeader: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4A5568',
        marginBottom: 12,
    },
    linkItem: {
        marginBottom: 8,
    },
    linkItemText: {
        fontSize: 13,
        color: '#718096',
    },
    tableCard: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 24,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    tableHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
        flexWrap: 'wrap',
        gap: 16,
    },
    tableControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        flexWrap: 'wrap',
    },
    searchInput: {
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 8,
        padding: 10,
        width: 250,
        fontSize: 14,
    },
    filterTabs: {
        flexDirection: 'row',
        backgroundColor: '#F7FAFC',
        borderRadius: 8,
        padding: 2,
    },
    filterTab: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 6,
    },
    filterTabActive: {
        backgroundColor: '#FFF',
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    filterTabText: {
        fontSize: 13,
        color: '#718096',
    },
    filterTabTextActive: {
        color: '#2D3748',
        fontWeight: '600',
    },
    tableContainer: {
        minWidth: 800,
    },
    tableRowHeader: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        paddingBottom: 12,
        marginBottom: 12,
    },
    tableRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F7FAFC',
    },
    tableCell: {
        paddingHorizontal: 8,
    },
    headerText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#A0AEC0',
        textTransform: 'uppercase',
    },
    colAvatar: { width: 50 },
    colName: { flex: 2 },
    colPhone: { flex: 1.5 },
    colEmail: { flex: 2 },
    colRole: { flex: 1 },
    colGymId: { flex: 1 },
    colTrainer: { flex: 1.5 },
    colStatus: { flex: 1 },
    colActions: { width: 80, flexDirection: 'row', gap: 8 },

    avatarPlaceholder: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#EDF2F7',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#4A5568',
    },
    badge: {
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    badgeMember: { backgroundColor: '#EBF8FF' },
    badgeTrainer: { backgroundColor: '#F0FFF4' },
    badgeText: { fontSize: 12, fontWeight: '600' },
    badgeTextMember: { color: '#3182CE' },
    badgeTextTrainer: { color: '#38A169' },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    statusActive: { backgroundColor: '#38A169' },
    statusPending: { backgroundColor: '#D69E2E' },
    statusText: { fontSize: 14, color: '#4A5568' },
    actionButton: {
        padding: 4,
    },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 32,
        width: 500,
        maxWidth: '90%',
        shadowColor: '#000',
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 24,
        color: '#2D3748',
    },
    input: {
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
        fontSize: 16,
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 8,
        marginBottom: 16,
        backgroundColor: '#FFF',
    },
    dropdown: {
        height: 50,
        paddingHorizontal: 12,
    },
    placeholderStyle: {
        fontSize: 16,
        color: '#A0AEC0',
    },
    selectedTextStyle: {
        fontSize: 16,
        color: '#2D3748',
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
        marginTop: 24,
    },
    cancelButton: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    cancelButtonText: {
        color: '#4A5568',
        fontWeight: '600',
    },
    saveButton: {
        backgroundColor: '#3182CE',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    saveButtonText: {
        color: '#FFF',
        fontWeight: 'bold',
    },
});

export default AdminUserOnboardingScreen;
