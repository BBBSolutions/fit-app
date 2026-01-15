import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    SafeAreaView,
    Image,
    ActivityIndicator,
    RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../../services/api';
import { colors, spacing, borderRadius, typography } from '../../theme/theme';

const TrainerChatScreen = ({ navigation }) => {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadClients = async () => {
        try {
            setLoading(true);
            const data = await api.getClients();
            // Data format: { id, name, image, ... }
            setClients(data);
        } catch (error) {
            console.error("Failed to load clients:", error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadClients();
        }, [])
    );

    const onRefresh = async () => {
        setRefreshing(true);
        await loadClients();
        setRefreshing(false);
    };

    const handleClientPress = (client) => {
        // Navigate to Client Details with the Messages tab active
        navigation.navigate('TrainerClientDetails', {
            client,
            initialTab: 'Messages'
        });
    };

    const renderClientItem = ({ item }) => (
        <TouchableOpacity style={styles.clientCard} onPress={() => handleClientPress(item)}>
            <Image
                source={{ uri: item.image || item.avatar_url }}
                style={styles.avatar}
            />
            <View style={styles.clientInfo}>
                <Text style={styles.clientName}>{item.name || item.full_name || 'Client'}</Text>
                <Text style={styles.subText}>Tap to view messages</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.gray[400]} />
        </TouchableOpacity>
    );

    const renderEmptyState = () => (
        <View style={styles.emptyStateContainer}>
            <View style={styles.emptyIconContainer}>
                <Ionicons name="chatbubbles-outline" size={64} color={colors.gray[300]} />
            </View>
            <Text style={styles.emptyTitle}>No Conversations</Text>
            <Text style={styles.emptySubtitle}>You haven't added any clients yet.</Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Messages</Text>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.trainer.primary} />
                </View>
            ) : (
                <FlatList
                    data={clients}
                    renderItem={renderClientItem}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={renderEmptyState}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.trainer.primary} />
                    }
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F7FAFC',
    },
    header: {
        paddingHorizontal: spacing.l,
        paddingVertical: spacing.l,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    headerTitle: {
        fontSize: typography.fontSize.xxl,
        fontWeight: typography.fontWeight.extrabold,
        color: '#2D3748',
    },
    listContent: {
        padding: spacing.l,
    },
    clientCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#EDF2F7',
    },
    clientInfo: {
        flex: 1,
        marginLeft: spacing.md,
    },
    clientName: {
        fontSize: typography.fontSize.md,
        fontWeight: typography.fontWeight.bold,
        color: '#2D3748',
    },
    subText: {
        fontSize: typography.fontSize.sm,
        color: colors.gray[500],
        marginTop: 2,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyStateContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 100,
    },
    emptyIconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#EDF2F7',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.l,
    },
    emptyTitle: {
        fontSize: typography.fontSize.xl,
        fontWeight: typography.fontWeight.bold,
        color: '#2D3748',
        marginBottom: spacing.xs,
    },
    emptySubtitle: {
        fontSize: typography.fontSize.md,
        color: colors.gray[500],
        textAlign: 'center',
    },
});

export default TrainerChatScreen;
