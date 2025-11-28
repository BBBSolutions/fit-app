import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SuperAdminDrawer = ({ visible, onClose, navigation, currentScreen }) => {
    const menuItems = [
        { name: 'Global Settings', route: 'SuperAdminGlobalSettings', icon: 'settings-outline' },
        { name: 'Gym Onboarding', route: 'SuperAdminGymOnboarding', icon: 'business-outline' },
        { name: 'Subscription Tiers', route: 'SuperAdminSubscriptionTiers', icon: 'pricetag-outline' },
        { name: 'AI Token Monitor', route: 'SuperAdminAITokenMonitor', icon: 'pulse-outline' },
        { name: 'Deployment Center', route: 'SuperAdminDeployment', icon: 'rocket-outline' },
        { name: 'Platform Billing', route: 'SuperAdminBilling', icon: 'card-outline' },
        { name: 'Analytics', route: 'SuperAdminAnalytics', icon: 'bar-chart-outline' },
        { name: 'System Logs', route: 'SuperAdminSystemLogs', icon: 'terminal-outline' },
    ];

    const handleNavigate = (route) => {
        onClose();
        if (route !== currentScreen) {
            navigation.navigate(route);
        }
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.container}>
                {/* Backdrop */}
                <TouchableOpacity
                    style={styles.backdrop}
                    activeOpacity={1}
                    onPress={onClose}
                />

                {/* Drawer */}
                <View style={styles.drawer}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerContent}>
                            <Ionicons name="shield-checkmark" size={32} color="#805AD5" />
                            <Text style={styles.headerTitle}>SuperAdmin</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={28} color="#4A5568" />
                        </TouchableOpacity>
                    </View>

                    {/* Menu Items */}
                    <ScrollView style={styles.menu}>
                        {menuItems.map((item) => (
                            <TouchableOpacity
                                key={item.route}
                                style={[
                                    styles.menuItem,
                                    currentScreen === item.route && styles.menuItemActive
                                ]}
                                onPress={() => handleNavigate(item.route)}
                            >
                                <Ionicons
                                    name={item.icon}
                                    size={22}
                                    color={currentScreen === item.route ? '#805AD5' : '#4A5568'}
                                />
                                <Text style={[
                                    styles.menuItemText,
                                    currentScreen === item.route && styles.menuItemTextActive
                                ]}>
                                    {item.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <TouchableOpacity style={styles.footerButton} onPress={() => navigation.navigate('GymCode')}>
                            <Ionicons name="exit-outline" size={20} color="#718096" />
                            <Text style={styles.footerButtonText}>Exit SuperAdmin</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'row',
    },
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    drawer: {
        width: 280,
        backgroundColor: '#FFF',
        shadowColor: '#000',
        shadowOffset: { width: 2, height: 0 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 5,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        backgroundColor: '#F7FAFC',
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#805AD5',
    },
    closeButton: {
        padding: 4,
    },
    menu: {
        flex: 1,
        paddingVertical: 16,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        marginHorizontal: 12,
        marginVertical: 4,
        borderRadius: 8,
        gap: 12,
    },
    menuItemActive: {
        backgroundColor: '#F3E8FF',
    },
    menuItemText: {
        fontSize: 16,
        color: '#4A5568',
        fontWeight: '500',
    },
    menuItemTextActive: {
        color: '#805AD5',
        fontWeight: '600',
    },
    footer: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
    },
    footerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        gap: 8,
    },
    footerButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#718096',
    },
});

export default SuperAdminDrawer;
