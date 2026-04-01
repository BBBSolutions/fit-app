import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TextInput,
    TouchableOpacity,
    SafeAreaView,
    Modal,
    Image,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';

const formatDateTime = (dateString) => {
    if (!dateString || dateString === 'Unknown') return 'N/A';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[d.getMonth()];
    const day = d.getDate();
    const year = d.getFullYear();
    
    let hours = d.getHours();
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    
    return `${month} ${day}, ${year}, ${hours}:${minutes} ${ampm}`;
};

const TrainerClientListScreen = ({ navigation }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFilter, setSelectedFilter] = useState('All');
    const [showSortMenu, setShowSortMenu] = useState(false);
    const [sortBy, setSortBy] = useState('Name A-Z');
    const [showFabMenu, setShowFabMenu] = useState(false);

    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadClients();
    }, []);

    const loadClients = async () => {
        try {
            setLoading(true);
            const data = await api.getClients();
            // Data format from backend: { id, name, goal, status, image, lastActive, plan }
            // Ensure status fallback
            const formatted = data.map(c => ({
                ...c,
                status: c.status || 'Active',
                lastActive: formatDateTime(c.lastActive),
                plan: c.plan || 'No Plan'
            }));
            setClients(formatted);
        } catch (error) {
            console.error("Failed to load clients:", error);
            // Optional: fallback to empty or show error
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = () => {
        loadClients();
    };

    const filters = ['All', 'Active', 'Pending Review', 'New Signup', 'Needs Attention', 'High Priority'];
    const sortOptions = ['Name A-Z', 'Goal', 'Last Active', 'Progress %'];

    const getStatusColor = (status) => {
        switch (status) {
            case 'Active': return '#48BB78';
            case 'Pending Review': return '#ECC94B';
            case 'Needs Attention': return '#F56565';
            case 'New Signup': return '#4299E1';
            default: return '#A0AEC0';
        }
    };

    const filteredClients = clients.filter(client => {
        const matchesSearch = client.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = selectedFilter === 'All' || client.status === selectedFilter;
        return matchesSearch && matchesFilter;
    });

    const renderClientItem = ({ item }) => (
        <TouchableOpacity style={styles.clientCard} onPress={() => navigation.navigate('TrainerClientDetails', { client: item })}>
            <Image source={{ uri: item.image }} style={styles.clientImage} />
            <View style={styles.clientInfo}>
                <View style={styles.clientHeader}>
                    <Text style={styles.clientName}>{item.name}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                        <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
                    </View>
                </View>
                <Text style={styles.clientGoal}>{item.goal}</Text>
                <View style={styles.clientDetailsRow}>
                    <Text style={styles.clientDetailText}>Last workout: {item.lastActive}</Text>
                    <Text style={styles.clientDetailText}>•</Text>
                    <Text style={styles.clientDetailText}>{item.plan}</Text>
                </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#CBD5E0" />
        </TouchableOpacity>
    );

    const renderEmptyState = () => (
        <View style={styles.emptyStateContainer}>
            <View style={styles.emptyIconContainer}>
                <Ionicons name="people-outline" size={64} color="#CBD5E0" />
            </View>
            <Text style={styles.emptyTitle}>No clients found</Text>
            <Text style={styles.emptySubtitle}>Try adjusting your filters or add a new client.</Text>
            <TouchableOpacity style={styles.emptyButton}>
                <Text style={styles.emptyButtonText}>Add Client</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>

                {/* 1. Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.headerTitle}>My Clients</Text>
                        <Text style={styles.headerSubtitle}>Manage your active and past clients</Text>
                    </View>
                    <TouchableOpacity style={styles.profileButton}>
                        <Ionicons name="person-circle-outline" size={40} color="#4A5568" />
                    </TouchableOpacity>
                </View>

                {/* 2. Search Bar */}
                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color="#A0AEC0" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search clients by name..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholderTextColor="#A0AEC0"
                    />
                </View>

                {/* 3. Filter Chips */}
                <View style={styles.filterContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContent}>
                        {filters.map((filter) => (
                            <TouchableOpacity
                                key={filter}
                                style={[
                                    styles.filterChip,
                                    selectedFilter === filter && styles.filterChipActive,
                                ]}
                                onPress={() => setSelectedFilter(filter)}
                            >
                                <Text
                                    style={[
                                        styles.filterText,
                                        selectedFilter === filter && styles.filterTextActive,
                                    ]}
                                >
                                    {filter}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* 5. Sort Dropdown (Placed above list) */}
                <View style={styles.sortContainer}>
                    <Text style={styles.resultCount}>{filteredClients.length} Clients</Text>
                    <TouchableOpacity style={styles.sortButton} onPress={() => setShowSortMenu(!showSortMenu)}>
                        <Text style={styles.sortButtonText}>Sort by: {sortBy}</Text>
                        <Ionicons name="chevron-down" size={16} color="#4A5568" />
                    </TouchableOpacity>
                </View>

                {/* Sort Menu Modal (Simplified for demo) */}
                {showSortMenu && (
                    <View style={styles.sortMenu}>
                        {sortOptions.map((option) => (
                            <TouchableOpacity
                                key={option}
                                style={styles.sortOption}
                                onPress={() => {
                                    setSortBy(option);
                                    setShowSortMenu(false);
                                }}
                            >
                                <Text style={[styles.sortOptionText, sortBy === option && styles.sortOptionTextActive]}>
                                    {option}
                                </Text>
                                {sortBy === option && <Ionicons name="checkmark" size={16} color="#3182CE" />}
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {/* 4. Client List */}
                <FlatList
                    data={filteredClients}
                    renderItem={renderClientItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={renderEmptyState}
                    showsVerticalScrollIndicator={false}
                    refreshing={loading}
                    onRefresh={handleRefresh}
                />

            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F7FAFC',
    },
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 10,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#1A202C',
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#718096',
        marginTop: 4,
    },
    profileButton: {
        padding: 4,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        marginHorizontal: 20,
        marginTop: 10,
        paddingHorizontal: 16,
        height: 50,
        borderRadius: 25,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#2D3748',
    },
    filterContainer: {
        marginTop: 16,
        height: 40,
    },
    filterContent: {
        paddingHorizontal: 20,
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        marginRight: 10,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        justifyContent: 'center',
    },
    filterChipActive: {
        backgroundColor: '#3182CE',
        borderColor: '#3182CE',
    },
    filterText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#718096',
    },
    filterTextActive: {
        color: '#FFFFFF',
    },
    sortContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginTop: 16,
        marginBottom: 10,
        zIndex: 1,
    },
    resultCount: {
        fontSize: 14,
        color: '#718096',
        fontWeight: '600',
    },
    sortButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    sortButtonText: {
        fontSize: 14,
        color: '#4A5568',
        fontWeight: '600',
        marginRight: 4,
    },
    sortMenu: {
        position: 'absolute',
        top: 190,
        right: 20,
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        padding: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
        zIndex: 10,
        width: 150,
    },
    sortOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 12,
    },
    sortOptionText: {
        fontSize: 14,
        color: '#4A5568',
    },
    sortOptionTextActive: {
        color: '#3182CE',
        fontWeight: '600',
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 100,
    },
    clientCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    clientImage: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#EDF2F7',
    },
    clientInfo: {
        flex: 1,
        marginLeft: 16,
    },
    clientHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    clientName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#2D3748',
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '700',
    },
    clientGoal: {
        fontSize: 14,
        color: '#4A5568',
        fontWeight: '500',
        marginBottom: 4,
    },
    clientDetailsRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    clientDetailText: {
        fontSize: 12,
        color: '#A0AEC0',
        marginRight: 6,
    },
    emptyStateContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 60,
    },
    emptyIconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#EDF2F7',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#2D3748',
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 16,
        color: '#718096',
        textAlign: 'center',
        marginBottom: 24,
    },
    emptyButton: {
        backgroundColor: '#3182CE',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 25,
    },
    emptyButtonText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 16,
    },
    fab: {
        position: 'absolute',
        bottom: 30,
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#3182CE',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#3182CE',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
        zIndex: 20,
    },
    fabMenuContainer: {
        position: 'absolute',
        bottom: 100,
        right: 20,
        alignItems: 'flex-end',
        zIndex: 19,
    },
    fabMenuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    fabMenuText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2D3748',
        marginRight: 12,
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    fabMenuIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
});

export default TrainerClientListScreen;
