import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    Image,
    Alert,
    Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { api } from '../../services/api';
import { supabase } from '../../config/supabaseAuth';
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
        avatarUrl: '',
    });
    
    const [uploadingImage, setUploadingImage] = React.useState(false);

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
                            avatarUrl: data.avatarUrl || data.avatar_url || '',
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

    const handleChangePassword = async () => {
        // Use Supabase Password Reset
        // We need the email. If it's not in userData, we might need to fetch it or use the session user.
        // Assuming userData might have it if getProfile returned it. If not, try supabase.auth.getUser()

        let email = userData.email;
        if (!email) {
            const { data: { user } } = await supabase.auth.getUser();
            email = user?.email;
        }

        if (email) {
            const { error } = await supabase.auth.resetPasswordForEmail(email);
            if (error) {
                console.error("Password Reset Error", error);
                alert("Error: " + error.message);
            } else {
                alert("Password reset email sent!");
            }
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
        try {
            await supabase.auth.signOut();
            // Also clear any custom tokens if used
            await api.removeCustomToken();

            // Ensure navigation state is reset
            navigation.dispatch(
                CommonActions.reset({
                    index: 0,
                    routes: [{ name: 'MemberLogin' }],
                })
            );
        } catch (e) {
            console.error("Logout Error:", e);
        }
    };

    const handleUpgradePlan = () => {
        console.log('Upgrade Plan');
    };

    const handlePickImage = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission needed', 'Sorry, we need camera roll permissions to make this work!');
                return;
            }

            let result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'], // Updated to use array format
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.5,
                base64: true,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const asset = result.assets[0];
                await uploadImage(asset);
            }
        } catch (error) {
            console.error("Error picking image:", error);
            Alert.alert('Error', 'Could not pick the image.');
        }
    };

    const uploadImage = async (asset) => {
        try {
            setUploadingImage(true);
            const fileName = asset.fileName || `avatar-${Date.now()}.jpg`;
            const fileType = asset.mimeType || 'image/jpeg';
            
            // 1. Get presigned URL
            const { uploadUrl, path } = await api.getUploadUrl('user-media-public', fileName, fileType);
            
            // 2. Fetch the local image as blob
            const response = await fetch(asset.uri);
            const blob = await response.blob();
            
            // 3. Upload to Supabase Storage via presigned URL
            const uploadRes = await fetch(uploadUrl, {
                method: 'PUT',
                body: blob,
                headers: {
                    'Content-Type': fileType,
                },
            });

            if (!uploadRes.ok) {
                throw new Error('Failed to upload image to storage');
            }

            // 4. Extract public URL assuming the bucket is public and standard path structure
            const { data: { publicUrl } } = supabase.storage.from('user-media-public').getPublicUrl(path);

            // 5. Save to database
            await api.updateProfile({ avatar_url: publicUrl });

            setUserData(prev => ({ ...prev, avatarUrl: publicUrl }));
            Alert.alert("Success", "Profile picture updated!");

        } catch (error) {
            console.error("Upload Error:", error);
            Alert.alert("Error", "Could not upload profile picture.");
        } finally {
            setUploadingImage(false);
        }
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
                    <TouchableOpacity style={styles.profilePicture} onPress={handlePickImage} disabled={uploadingImage}>
                        {userData.avatarUrl ? (
                            <Image source={{ uri: userData.avatarUrl }} style={styles.profileImage} />
                        ) : (
                            <Ionicons name="person" size={40} color="#FFFFFF" />
                        )}
                        {uploadingImage && (
                            <View style={styles.uploadingOverlay}>
                                <Text style={styles.uploadingText}>...</Text>
                            </View>
                        )}
                    </TouchableOpacity>
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
        overflow: 'hidden',
    },
    profileImage: {
        width: '100%',
        height: '100%',
    },
    uploadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    uploadingText: {
        color: '#FFF',
        fontWeight: 'bold',
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
