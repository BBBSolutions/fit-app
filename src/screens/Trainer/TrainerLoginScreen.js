import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Button, Alert, TouchableOpacity } from 'react-native';
import { supabase } from '../../config/supabaseAuth';
import { api } from '../../services/api';

import { adminApi } from '../../services/adminApi';

const TrainerLoginScreen = ({ navigation, route }) => {
    const { gymCode } = route.params || {};
    const [phoneNumber, setPhoneNumber] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [verificationCode, setVerificationCode] = useState('');

    const handleSendOtp = async () => {
        if (phoneNumber.trim() === '') {
            Alert.alert('Error', 'Please enter a phone number');
            return;
        }

        try {
            const { error } = await supabase.auth.signInWithOtp({
                phone: phoneNumber,
            });

            if (error) throw error;

            setOtpSent(true);
            Alert.alert('Success', 'OTP sent!');
        } catch (err) {
            console.error("Phone Auth Error:", err);
            Alert.alert('Error', `Failed to send OTP: ${err.message}`);
        }
    };

    const handleVerifyOtp = async () => {
        if (verificationCode.trim() === '') {
            Alert.alert('Error', 'Please enter the OTP');
            return;
        }

        try {
            const { data, error } = await supabase.auth.verifyOtp({
                phone: phoneNumber,
                token: verificationCode,
                type: 'sms'
            });

            if (error) throw error;

            // START: Join Gym Logic
            if (gymCode) {
                try {
                    await adminApi.joinBranch(gymCode, 'trainer');
                    Alert.alert('Success', `You have successfully joined the gym (${gymCode}) as a Trainer!`);
                } catch (joinErr) {
                    console.error("Join Gym Error:", joinErr);
                    Alert.alert('Notice', 'Login successful, but failed to join gym automatically. Please contact Owner.');
                }
            }
            // END: Join Gym Logic

            // Check Profile Completion
            try {
                const profile = await api.getProfile();
                console.log("Login Profile Check:", profile);

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
            Alert.alert('Error', `Invalid OTP: ${err.message}`);
        }
    };

    // Dev Helper
    const handleGuestLogin = () => {
        supabase.auth.signInAnonymously()
            .then(({ data, error }) => {
                if (error) throw error;
                navigation.navigate('TrainerOnboarding');
            })
            .catch(e => Alert.alert("Auth Failed", e.message));
    };

    return (
        <View style={styles.container}>
            <Text style={styles.text}>Trainer Login</Text>

            {!otpSent ? (
                <>
                    <TextInput
                        style={styles.input}
                        placeholder="+1 999 999 9999"
                        value={phoneNumber}
                        onChangeText={setPhoneNumber}
                        keyboardType="phone-pad"
                        autoComplete="tel"
                    />
                    <Button title="Send OTP" onPress={handleSendOtp} />
                </>
            ) : (
                <>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter 6-digit OTP"
                        value={verificationCode}
                        onChangeText={setVerificationCode}
                        keyboardType="number-pad"
                    />
                    <Button title="Verify OTP" onPress={handleVerifyOtp} />
                    <TouchableOpacity onPress={() => setOtpSent(false)} style={{ marginTop: 10 }}>
                        <Text style={{ color: 'blue' }}>Wrong number? Try again</Text>
                    </TouchableOpacity>
                </>
            )}

            <View style={{ marginTop: 40, borderTopWidth: 1, borderColor: '#eee', paddingTop: 20, width: '100%' }}>
                <Button
                    title="Dev: Login (Guest)"
                    color="#666"
                    onPress={handleGuestLogin}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    text: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    input: {
        width: '100%',
        height: 50,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 5,
        paddingHorizontal: 10,
        marginBottom: 20,
    },
});

export default TrainerLoginScreen;
