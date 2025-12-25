import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';
import { useFocusEffect, CommonActions } from '@react-navigation/native';

const ProfileScreen = ({ navigation }) => {
    // Sample user data
    // Initial state with empty values
    const [userData, setUserData] = React.useState({
        name: '',
        gymName: '',
        age: '',
        gender: '',
        height: '',
        weight: '',
        fitnessLevel: '',
        primaryGoal: '',
        planType: 'Free',
    });

    // Backend Integration
    useFocusEffect(
        React.useCallback(() => {
            api.getProfile()
                .then(data => {
                    // Map API response to UI state
                    if (data) {
                        setUserData(prev => ({
                            ...prev,
                            ...data,
                            // Handle potential mismatched field names or formats here if needed
                        }));
                    }
                })
                .catch(err => console.error("Failed to fetch profile:", err));
        }, [])
    );

    const handleEditProfile = () => {
        // Navigate to OnboardingSurvey in 'edit' mode with current data
        navigation.navigate('OnboardingSurvey', { isEditMode: true, existingData: userData });
    };

    const handleChangePassword = () => {
        const { getAuth, sendPasswordResetEmail } = require('firebase/auth');
        const auth = getAuth();
        if (auth.currentUser && auth.currentUser.email) {
            sendPasswordResetEmail(auth, auth.currentUser.email)
                .then(() => {
                    alert("Password reset email sent!");
                })
                .catch((error) => {
                    console.error("Password Reset Error", error);
                    alert("Error: " + error.message);
                });
        } else {
            alert("No email found for user.");
        }
    };

    // Helper to update preferences
    const updatePreferences = async (newPrefs) => {
        const updatedPreferences = { ...userData.preferences, ...newPrefs };

        // Optimistic Update
        setUserData(prev => ({
            ...prev,
            preferences: updatedPreferences
        }));

        try {
            await api.updateProfile({ preferences: updatedPreferences });
        } catch (error) {
            console.error("Failed to update preferences:", error);
            alert("Failed to save settings");
            // Revert on failure? For now, we'll just alert.
        }
    };

    const handleNotificationSettings = () => {
        const currentVal = userData.preferences?.notificationsEnabled ?? true; // Default true
        const newVal = !currentVal;
        updatePreferences({ notificationsEnabled: newVal });
        alert(`Notifications ${newVal ? 'Enabled' : 'Disabled'}`);
    };

    const handleAppTheme = () => {
        const currentTheme = userData.preferences?.theme || 'Light';
        const newTheme = currentTheme === 'Light' ? 'Dark' : 'Light';
        updatePreferences({ theme: newTheme });
        // In a real app, this would trigger a Context update
        alert(`Theme set to ${newTheme}`);
    };

    const handleLogout = async () => {
        const { getAuth, signOut } = require('firebase/auth');
        const auth = getAuth();
        try {
            await signOut(auth);
            // Ensure navigation state is reset
            navigation.dispatch(
                CommonActions.reset({
                    index: 0,
                    routes: [{ name: 'MemberLogin' }], // Or LoginScreen if that's the root
                })
            );
        } catch (e) {
            console.error("Logout Error:", e);
        }
    };

    const handleUpgradePlan = () => {
        console.log('Upgrade Plan');
    };

    const isNotificationsEnabled = userData.preferences?.notificationsEnabled ?? true;
    const currentTheme = userData.preferences?.theme || 'Light';

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>

                {/* 1. Header */}
                <Text style={styles.headerTitle}>Profile</Text>

                {/* 2. User Info Card */}
                <View style={styles.userCard}>
                    <View style={styles.profilePicture}>
                        <Ionicons name="person" size={40} color="#FFFFFF" />
                    </View>
                    <View style={styles.userInfo}>
                        <Text style={styles.userName}>{userData.name}</Text>
                        <Text style={styles.gymName}>{userData.gymName}</Text>
                    </View>
                    <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
                        <Ionicons name="create-outline" size={20} color="#3182CE" />
                    </TouchableOpacity>
                </View>

                {/* 3. Personal Data Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Personal Information</Text>
                    <View style={styles.card}>
                        <View style={styles.dataRow}>
                            <Text style={styles.dataLabel}>Age</Text>
                            <Text style={styles.dataValue}>{userData.age}</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.dataRow}>
                            <Text style={styles.dataLabel}>Gender</Text>
                            <Text style={styles.dataValue}>{userData.gender}</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.dataRow}>
                            <Text style={styles.dataLabel}>Height</Text>
                            <Text style={styles.dataValue}>{userData.height}</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.dataRow}>
                            <Text style={styles.dataLabel}>Weight</Text>
                            <Text style={styles.dataValue}>{userData.weight}</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.dataRow}>
                            <Text style={styles.dataLabel}>Fitness Level</Text>
                            <Text style={styles.dataValue}>{userData.fitnessLevel}</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.dataRow}>
                            <Text style={styles.dataLabel}>Primary Goal</Text>
                            <Text style={styles.dataValue}>{userData.primaryGoal}</Text>
                        </View>
                    </View>
                </View>

                {/* 4. Settings Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Settings</Text>
                    <View style={styles.card}>
                        <TouchableOpacity style={styles.settingRow} onPress={handleEditProfile}>
                            <View style={styles.settingLeft}>
                                <Ionicons name="person-outline" size={20} color="#4A5568" />
                                <Text style={styles.settingText}>Edit Profile</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#A0AEC0" />
                        </TouchableOpacity>
                        <View style={styles.divider} />
                        <TouchableOpacity style={styles.settingRow} onPress={handleChangePassword}>
                            <View style={styles.settingLeft}>
                                <Ionicons name="lock-closed-outline" size={20} color="#4A5568" />
                                <Text style={styles.settingText}>Change Password</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#A0AEC0" />
                        </TouchableOpacity>
                        <View style={styles.divider} />
                        <TouchableOpacity style={styles.settingRow} onPress={handleNotificationSettings}>
                            <View style={styles.settingLeft}>
                                <Ionicons name={isNotificationsEnabled ? "notifications-outline" : "notifications-off-outline"} size={20} color="#4A5568" />
                                <Text style={styles.settingText}>Notifications</Text>
                            </View>
                            <Text style={styles.themeValue}>{isNotificationsEnabled ? 'On' : 'Off'}</Text>
                        </TouchableOpacity>
                        <View style={styles.divider} />
                        <TouchableOpacity style={styles.settingRow} onPress={handleAppTheme}>
                            <View style={styles.settingLeft}>
                                <Ionicons name={currentTheme === 'Dark' ? "moon-outline" : "sunny-outline"} size={20} color="#4A5568" />
                                <Text style={styles.settingText}>App Theme</Text>
                            </View>
                            <Text style={styles.themeValue}>{currentTheme}</Text>
                        </TouchableOpacity>
                        <View style={styles.divider} />
                        <TouchableOpacity style={styles.settingRow} onPress={handleLogout}>
                            <View style={styles.settingLeft}>
                                <Ionicons name="log-out-outline" size={20} color="#E53E3E" />
                                <Text style={[styles.settingText, styles.logoutText]}>Logout</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* 5. Subscription Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Subscription</Text>
                    <View style={styles.subscriptionCard}>
                        <View style={styles.planHeader}>
                            <View>
                                <Text style={styles.planLabel}>Current Plan</Text>
                                <Text style={styles.planType}>{userData.planType}</Text>
                            </View>
                            <View style={styles.premiumBadge}>
                                <Ionicons name="star" size={16} color="#F6AD55" />
                            </View>
                        </View>
                        {userData.planType === 'Free' && (
                            <TouchableOpacity style={styles.upgradeButton} onPress={handleUpgradePlan}>
                                <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                <View style={styles.bottomSpacer} />
            </ScrollView>
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
    contentContainer: {
        padding: 20,
        paddingBottom: 100,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#1A202C',
        marginBottom: 24,
    },
    userCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    profilePicture: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#3182CE',
        justifyContent: 'center',
        alignItems: 'center',
    },
    userInfo: {
        flex: 1,
        marginLeft: 16,
    },
    userName: {
        fontSize: 20,
        fontWeight: '700',
        color: '#2D3748',
        marginBottom: 4,
    },
    gymName: {
        fontSize: 14,
        color: '#718096',
    },
    editButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#EBF8FF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2D3748',
        marginBottom: 12,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    dataRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
    },
    dataLabel: {
        fontSize: 15,
        color: '#718096',
    },
    dataValue: {
        fontSize: 15,
        fontWeight: '600',
        color: '#2D3748',
    },
    divider: {
        height: 1,
        backgroundColor: '#E2E8F0',
    },
    settingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    settingText: {
        fontSize: 15,
        color: '#2D3748',
        marginLeft: 12,
        fontWeight: '500',
    },
    logoutText: {
        color: '#E53E3E',
    },
    themeValue: {
        fontSize: 14,
        color: '#718096',
    },
    subscriptionCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    planHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    planLabel: {
        fontSize: 13,
        color: '#718096',
        marginBottom: 4,
    },
    planType: {
        fontSize: 20,
        fontWeight: '700',
        color: '#2D3748',
    },
    premiumBadge: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#FFFAF0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    upgradeButton: {
        backgroundColor: '#3182CE',
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
    },
    upgradeButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    bottomSpacer: {
        height: 20,
    },
});

export default ProfileScreen;
