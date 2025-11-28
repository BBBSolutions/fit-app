import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const AdminDrawer = ({ visible, onClose, navigation, currentScreen }) => {
    const menuItems = [
        { name: 'Dashboard', route: 'AdminDashboard', icon: 'grid-outline' },
        { name: 'Content', route: 'AdminContentManager', icon: 'document-text-outline' },
        { name: 'Leads', route: 'AdminLeadManagement', icon: 'funnel-outline' },
        { name: 'Branding', route: 'AdminBranding', icon: 'color-palette-outline' },
        { name: 'Users', route: 'AdminUserOnboarding', icon: 'people-outline' },
        { name: 'Billing', route: 'AdminBilling', icon: 'card-outline' },
        { name: 'Analytics', route: 'AdminAnalytics', icon: 'bar-chart-outline' },
        { name: 'Settings', route: 'AdminSettings', icon: 'settings-outline' },
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
                            <Ionicons name="fitness" size={32} color="#3182CE" />
                            <Text style={styles.headerTitle}>FitPlatform</Text>
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
                                    color={currentScreen === item.route ? '#3182CE' : '#4A5568'}
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
                        <TouchableOpacity style={styles.footerButton}>
                            <Ionicons name="log-out-outline" size={20} color="#E53E3E" />
                            <Text style={styles.footerButtonText}>Logout</Text>
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
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2D3748',
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
        backgroundColor: '#EBF8FF',
    },
    menuItemText: {
        fontSize: 16,
        color: '#4A5568',
        fontWeight: '500',
    },
    menuItemTextActive: {
        color: '#3182CE',
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
        color: '#E53E3E',
    },
});

export default AdminDrawer;
