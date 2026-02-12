import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, Modal, TextInput, ScrollView, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { adminApi } from '../../services/adminApi';
import { Ionicons } from '@expo/vector-icons';
import theme from '../../theme/theme';

const StatsOverview = ({ stats, loading }) => {
    const statItems = [
        { label: 'Total Members', value: stats.activeMembers || 0, icon: 'people', color: '#3182CE' },
        { label: 'Active Trainers', value: stats.activeTrainers || 0, icon: 'fitness', color: '#38A169' },
        { label: 'Total Leads', value: stats.leads || 0, icon: 'people-circle-outline', color: '#DD6B20' },
        { label: 'Total Revenue', value: `₹${stats.monthlyRevenue || 0}`, icon: 'cash', color: '#805AD5' },
    ];

    return (
        <View style={styles.statsContainer}>
            <Text style={styles.statsTitle}>Overview (All Branches)</Text>
            <View style={styles.statsGrid}>
                {statItems.map((item, index) => (
                    <View key={index} style={styles.statCard}>
                        <View style={[styles.statIconContainer, { backgroundColor: `${item.color}20` }]}>
                            <Ionicons name={item.icon} size={20} color={item.color} />
                        </View>
                        <View>
                            {loading ? (
                                <ActivityIndicator size="small" color={item.color} />
                            ) : (
                                <Text style={[styles.statValue, { color: item.color }]}>{item.value}</Text>
                            )}
                            <Text style={styles.statLabel}>{item.label}</Text>
                        </View>
                    </View>
                ))}
            </View>
        </View>
    );
};

export default function OwnerBranchListScreen({ navigation }) {
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({});
    const [statsLoading, setStatsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [adminModalVisible, setAdminModalVisible] = useState(false);
    const [selectedBranchForAdmin, setSelectedBranchForAdmin] = useState(null);
    const [adminForm, setAdminForm] = useState({ name: '', email: '', phone: '' });
    const [selectedPermissions, setSelectedPermissions] = useState([]);
    const [adminLoading, setAdminLoading] = useState(false);
    // New state for Options Modal
    const [optionsModalVisible, setOptionsModalVisible] = useState(false);
    const [activeBranch, setActiveBranch] = useState(null);

    const permissionsList = [
        { key: 'manage_users', label: 'Manage Users (Members/Trainers)' },
        { key: 'manage_content', label: 'Manage Content (Workouts/Diets)' },
        { key: 'view_analytics', label: 'View Analytics' },
        { key: 'manage_billing', label: 'Manage Billing' },
        { key: 'manage_settings', label: 'Manage Settings' }
    ];

    const fetchData = async () => {
        setLoading(true);
        setStatsLoading(true);
        try {
            const [branchData, statsData] = await Promise.all([
                adminApi.getBranches(),
                adminApi.getAggregatedStats()
            ]);

            if (branchData?.branches) {
                setBranches(branchData.branches);
            }
            setStats(statsData);
        } catch (error) {
            console.error("Error fetching data:", error);
            Alert.alert("Error", "Failed to load data.");
        } finally {
            setLoading(false);
            setStatsLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [])
    );

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchData();
    }, []);

    const handleBranchSelect = (branch) => {
        navigation.navigate('AdminDashboard', {
            branchId: branch.id,
            gymCode: branch.gym_code,
            branchName: branch.name
        });
    };

    const handleEditBranch = (branch) => {
        navigation.navigate('AdminCreateBranch', { mode: 'edit', branchData: branch });
    };

    const handleDeleteBranch = (branch) => {
        Alert.alert(
            "Delete Branch",
            `Are you sure you want to delete "${branch.name}"?\nThis action cannot be undone.`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            setLoading(true);
                            await adminApi.deleteBranch(branch.id);
                            Alert.alert("Success", "Branch deleted successfully.");
                            fetchData();
                        } catch (error) {
                            Alert.alert("Error", error.message || "Failed to delete branch");
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const handleAddAdmin = (branch) => {
        setSelectedBranchForAdmin(branch);
        setAdminForm({ name: '', email: '', phone: '' });
        setSelectedPermissions(['manage_users', 'view_analytics']); // Default permissions
        setAdminModalVisible(true);
    };

    const submitAddAdmin = async () => {
        if (!adminForm.name || (!adminForm.email && !adminForm.phone)) {
            Alert.alert("Missing Fields", "Please provide Name and either Email or Phone.");
            return;
        }

        setAdminLoading(true);
        try {
            await adminApi.createUser({
                name: adminForm.name,
                email: adminForm.email,
                phone: adminForm.phone,
                role: 'branch_admin',
                permissions: selectedPermissions,
                status: 'pending' // or active if we auto-activate
            }, selectedBranchForAdmin.id);

            Alert.alert("Success", "Admin invitation sent successfully!");
            setAdminModalVisible(false);
            // Optionally refresh or show feedback
        } catch (error) {
            Alert.alert("Error", error.message || "Failed to add admin.");
        } finally {
            setAdminLoading(false);
        }
    };

    const togglePermission = (key) => {
        if (selectedPermissions.includes(key)) {
            setSelectedPermissions(selectedPermissions.filter(p => p !== key));
        } else {
            setSelectedPermissions([...selectedPermissions, key]);
        }
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => handleBranchSelect(item)}
            activeOpacity={0.7}
        >
            <View style={styles.cardHeader}>
                <View style={styles.iconContainer}>
                    <Ionicons name="business" size={24} color={theme.colors.primary} />
                </View>
                <View style={styles.headerText}>
                    <Text style={styles.branchName}>{item.name}</Text>
                    <Text style={styles.gymCode}>Code: {item.gym_code}</Text>
                </View>
                {/* Options Menu */}
                <TouchableOpacity
                    style={styles.optionsButton}
                    onPress={() => {
                        setActiveBranch(item);
                        setOptionsModalVisible(true);
                    }}
                >
                    <Ionicons name="ellipsis-vertical" size={20} color="#718096" />
                </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailsRow}>
                <View style={styles.detailItem}>
                    <Ionicons name="location-outline" size={16} color="#718096" />
                    <Text style={styles.detailText}>{item.city}, {item.state}</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: item.role === 'owner' ? '#E9D8FD' : '#C6F6D5' }]}>
                    <Text style={[styles.badgeText, { color: item.role === 'owner' ? '#553C9A' : '#22543D' }]}>
                        {item.role === 'owner' ? 'Owner' : 'Admin'}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>All Branches</Text>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => navigation.navigate('AdminCreateBranch')}
                >
                    <Ionicons name="add" size={24} color="#FFF" />
                    <Text style={styles.addButtonText}>Add Branch</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={branches}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                ListHeaderComponent={<StatsOverview stats={stats} loading={statsLoading} />}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />
                }
                ListEmptyComponent={
                    !loading && (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No branches found.</Text>
                        </View>
                    )
                }
            />

            {/* Admin Creation Modal */}
            <Modal
                transparent={true}
                visible={adminModalVisible}
                animationType="slide"
                onRequestClose={() => setAdminModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Add Admin to {selectedBranchForAdmin?.name}</Text>
                            <TouchableOpacity onPress={() => setAdminModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#718096" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalScroll}>
                            <Text style={styles.label}>Name</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Admin Name"
                                value={adminForm.name}
                                onChangeText={t => setAdminForm({ ...adminForm, name: t })}
                            />

                            <Text style={styles.label}>Email</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="admin@example.com"
                                keyboardType="email-address"
                                value={adminForm.email}
                                onChangeText={t => setAdminForm({ ...adminForm, email: t })}
                            />

                            <Text style={styles.label}>Phone</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Phone Number"
                                keyboardType="phone-pad"
                                value={adminForm.phone}
                                onChangeText={t => setAdminForm({ ...adminForm, phone: t })}
                            />

                            <Text style={styles.label}>Permissions</Text>
                            <View style={styles.permissionsContainer}>
                                {permissionsList.map((perm) => (
                                    <TouchableOpacity
                                        key={perm.key}
                                        style={styles.checkboxRow}
                                        onPress={() => togglePermission(perm.key)}
                                    >
                                        <View style={[styles.checkbox, selectedPermissions.includes(perm.key) && styles.checkboxChecked]}>
                                            {selectedPermissions.includes(perm.key) && <Ionicons name="checkmark" size={14} color="#FFF" />}
                                        </View>
                                        <Text style={styles.checkboxLabel}>{perm.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </ScrollView>

                        <TouchableOpacity
                            style={styles.submitModalButton}
                            onPress={submitAddAdmin}
                            disabled={adminLoading}
                        >
                            {adminLoading ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <Text style={styles.submitModalButtonText}>Add Admin</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
            {/* Options Modal */}
            <Modal
                transparent={true}
                visible={optionsModalVisible}
                animationType="fade"
                onRequestClose={() => setOptionsModalVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setOptionsModalVisible(false)}
                >
                    <View style={styles.optionsModalContent}>
                        <Text style={styles.optionsTitle}>Manage {activeBranch?.name}</Text>

                        <TouchableOpacity
                            style={styles.optionItem}
                            onPress={() => {
                                setOptionsModalVisible(false);
                                handleEditBranch(activeBranch);
                            }}
                        >
                            <Ionicons name="create-outline" size={24} color={theme.colors.primary} />
                            <Text style={styles.optionText}>Edit Branch</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.optionItem}
                            onPress={() => {
                                setOptionsModalVisible(false);
                                handleAddAdmin(activeBranch);
                            }}
                        >
                            <Ionicons name="person-add-outline" size={24} color={theme.colors.primary} />
                            <Text style={styles.optionText}>Add Admin</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.optionItem}
                            onPress={() => {
                                setOptionsModalVisible(false);
                                // Small delay to allow modal to close before alert
                                setTimeout(() => handleDeleteBranch(activeBranch), 100);
                            }}
                        >
                            <Ionicons name="trash-outline" size={24} color="#E53E3E" />
                            <Text style={[styles.optionText, { color: '#E53E3E' }]}>Delete Branch</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.optionItem, styles.cancelOption]}
                            onPress={() => setOptionsModalVisible(false)}
                        >
                            <Text style={styles.cancelText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F7FAFC',
        padding: 16,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        marginTop: 10,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1A202C',
    },
    addButton: {
        flexDirection: 'row',
        backgroundColor: theme.colors.primary,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        alignItems: 'center',
    },
    addButtonText: {
        color: '#FFF',
        fontWeight: '600',
        marginLeft: 8,
    },
    listContent: {
        paddingBottom: 20,
    },
    card: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#EBF8FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    headerText: {
        flex: 1,
    },
    branchName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2D3748',
    },
    gymCode: {
        fontSize: 14,
        color: '#718096',
        marginTop: 4,
    },
    optionsButton: {
        padding: 8,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    divider: {
        height: 1,
        backgroundColor: '#E2E8F0',
        marginVertical: 12,
    },
    detailsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    detailText: {
        marginLeft: 6,
        color: '#4A5568',
        fontSize: 14,
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 50,
    },
    emptyText: {
        color: '#A0AEC0',
        fontSize: 16,
    },
    // Stats Styles
    statsContainer: {
        marginBottom: 20,
    },
    statsTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2D3748',
        marginBottom: 12,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 12
    },
    statCard: {
        width: '48%',
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'column',
        alignItems: 'flex-start',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
        marginBottom: 8 // spacing row gap
    },
    statIconContainer: {
        padding: 8,
        borderRadius: 8,
        marginBottom: 12,
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: '#718096',
        fontWeight: '500'
    },
    // Modal Styles (Unchanged mostly)
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    modalContent: {
        backgroundColor: '#FFF',
        width: '100%',
        maxWidth: 500,
        borderRadius: 12,
        padding: 24,
        maxHeight: '80%'
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2D3748'
    },
    modalScroll: {
        maxHeight: 400
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4A5568',
        marginBottom: 8,
        marginTop: 12
    },
    input: {
        backgroundColor: '#F7FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
    },
    permissionsContainer: {
        gap: 12,
        marginTop: 8
    },
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: theme.colors.primary,
        marginRight: 10,
        justifyContent: 'center',
        alignItems: 'center'
    },
    checkboxChecked: {
        backgroundColor: theme.colors.primary
    },
    checkboxLabel: {
        fontSize: 14,
        color: '#2D3748'
    },
    submitModalButton: {
        backgroundColor: theme.colors.primary,
        borderRadius: 8,
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 24,
    },
    submitModalButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold'
    },
    // New Styles for Options Modal
    optionsModalContent: {
        backgroundColor: '#FFF',
        width: '80%',
        maxWidth: 350,
        borderRadius: 16,
        padding: 20,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    optionsTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2D3748',
        marginBottom: 20,
        textAlign: 'center'
    },
    optionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#EDF2F7'
    },
    optionText: {
        fontSize: 16,
        color: '#4A5568',
        marginLeft: 15,
        fontWeight: '500'
    },
    cancelOption: {
        borderBottomWidth: 0,
        justifyContent: 'center',
        paddingVertical: 15,
        marginTop: 5
    },
    cancelText: {
        fontSize: 16,
        color: '#718096',
        fontWeight: 'bold'
    }
});
