import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, Platform } from 'react-native';
import { supabase } from '../../config/supabaseAuth';
import { api } from '../../services/api';
import { adminApi } from '../../services/adminApi';

// UI Components
import ScreenWrapper from '../../components/ScreenWrapper';
import GradientCard from '../../components/GradientCard';
import StandardInput from '../../components/StandardInput';
import AnimatedButton from '../../components/AnimatedButton';
import { colors, typography, spacing } from '../../theme/theme';

const TrainerLoginScreen = ({ navigation, route }) => {
    const { gymCode } = route.params || {};
    const [phoneNumber, setPhoneNumber] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [verificationCode, setVerificationCode] = useState('');
    const [loading, setLoading] = useState(false);
    // Store Hash & Expiry
    const [otpHash, setOtpHash] = useState(null);
    const [otpExpiry, setOtpExpiry] = useState(null);

    const handleSendOtp = async () => {
        if (phoneNumber.trim() === '') {
            if (Platform.OS === 'web') {
                window.alert('Please enter a phone number');
            } else {
                Alert.alert('Error', 'Please enter a phone number');
            }
            return;
        }

        setLoading(true);
        try {
            const result = await api.sendMsg91OTP(phoneNumber);
            if (result.hash) {
                setOtpHash(result.hash);
                setOtpExpiry(result.expires);
                setOtpSent(true);
                Alert.alert('Success', 'WhatsApp OTP sent!');
            } else {
                throw new Error("No hash returned");
            }
        } catch (err) {
            console.error("OTP Error:", err);
            if (Platform.OS === 'web') {
                window.alert(`Failed to send OTP: ${err.message}`);
            } else {
                Alert.alert('Error', `Failed to send OTP: ${err.message}`);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (verificationCode.trim() === '') {
            if (Platform.OS === 'web') {
                window.alert('Please enter the OTP');
            } else {
                Alert.alert('Error', 'Please enter the OTP');
            }
            return;
        }

        setLoading(true);
        try {
            // 1. Verify & Get Token
            const { token } = await api.verifyMsg91Token(phoneNumber, verificationCode, otpHash, otpExpiry);
            if (!token) throw new Error("Verification failed");

            // 2. Set Custom Token
            await api.setCustomToken(token);

            // 3. Join Gym Logic
            if (gymCode) {
                try {
                    await adminApi.joinBranch(gymCode, 'trainer');
                    Alert.alert('Success', `You have successfully joined the gym (${gymCode}) as a Trainer!`);
                } catch (joinErr) {
                    console.error("Join Gym Error:", joinErr);
                    if (joinErr.message?.includes('already a member')) {
                        console.log("Already a member, proceeding...");
                    } else {
                        Alert.alert('Notice', 'Login successful, but failed to join gym automatically. Please contact Owner.');
                    }
                }
            }

            // 4. Check Profile & Redirect
            try {
                const profile = await api.getProfile();
                console.log("Login Profile Check (Trainer):", profile);

                if (profile && profile.fullName && profile.primarySpecialization) {
                    navigation.replace('TrainerMainApp');
                } else {
                    navigation.navigate('TrainerOnboarding');
                }
            } catch (profileErr) {
                console.log("Profile check failed, going to onboarding:", profileErr);
                navigation.navigate('TrainerOnboarding');
            }
        } catch (err) {
            console.error("Verification Error:", err);
            if (Platform.OS === 'web') {
                window.alert(`Invalid OTP: ${err.message}`);
            } else {
                Alert.alert('Error', `Invalid OTP: ${err.message}`);
            }
        } finally {
            setLoading(false);
        }
    };

    // Guest login removed (Firebase legacy)

    return (
        <ScreenWrapper useGradient={true} style={styles.container}>
            <View style={styles.contentContainer}>

                <View style={styles.headerContainer}>
                    <Text style={styles.title}>Welcome Back</Text>
                    <Text style={styles.subtitle}>Trainer Access</Text>
                </View>

                <GradientCard
                    glassmorphic={true}
                    gradientBorder={true}
                    style={styles.card}
                >
                    {!otpSent ? (
                        <>
                            <StandardInput
                                label="Phone Number"
                                placeholder="e.g. 9893569046"
                                value={phoneNumber}
                                onChangeText={setPhoneNumber}
                                keyboardType="phone-pad"
                                autoComplete="tel"
                                leftIcon={<Text style={{ fontSize: 18 }}>📱</Text>}
                            />
                            <AnimatedButton
                                title="Send OTP"
                                onPress={handleSendOtp}
                                loading={loading}
                                size="large"
                            />
                        </>
                    ) : (
                        <>
                            <StandardInput
                                label="Verification Code"
                                placeholder="Enter 6-digit OTP"
                                value={verificationCode}
                                onChangeText={setVerificationCode}
                                keyboardType="number-pad"
                                leftIcon={<Text style={{ fontSize: 18 }}>🔒</Text>}
                            />
                            <AnimatedButton
                                title="Verify OTP"
                                onPress={handleVerifyOtp}
                                loading={loading}
                                size="large"
                            />

                            <TouchableOpacity onPress={() => setOtpSent(false)} style={styles.retryLink}>
                                <Text style={styles.retryText}>Wrong number? Try again</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </GradientCard>



            </View>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
    },
    contentContainer: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: spacing.xl,
    },
    headerContainer: {
        marginBottom: spacing.xxl,
        alignItems: 'center',
    },
    title: {
        fontSize: typography.fontSize.huge,
        fontWeight: typography.fontWeight.bold,
        color: colors.white,
        textAlign: 'center',
        marginBottom: spacing.xs,
    },
    subtitle: {
        fontSize: typography.fontSize.lg,
        color: colors.gray[200],
        textAlign: 'center',
    },
    card: {
        width: '100%',
    },
    retryLink: {
        marginTop: spacing.lg,
        alignItems: 'center',
    },
    retryText: {
        color: colors.primary,
        fontWeight: typography.fontWeight.medium,
    },
    footer: {
        marginTop: spacing.xl,
        alignItems: 'center',
    }
});

export default TrainerLoginScreen;

