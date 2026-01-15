import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, Button, Alert, TouchableOpacity } from 'react-native';
import { getAuth, PhoneAuthProvider, signInWithCredential } from 'firebase/auth';
import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';
import { api } from '../../services/api';
import { firebaseConfig } from '../../config/firebase';

const TrainerLoginScreen = ({ navigation }) => {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [verificationId, setVerificationId] = useState(null);
    const [verificationCode, setVerificationCode] = useState('');
    const recaptchaVerifier = useRef(null);

    const handleSendOtp = async () => {
        if (phoneNumber.trim() === '') {
            Alert.alert('Error', 'Please enter a phone number');
            return;
        }

        try {
            const auth = getAuth();
            const phoneProvider = new PhoneAuthProvider(auth);
            const verificationId = await phoneProvider.verifyPhoneNumber(
                phoneNumber,
                recaptchaVerifier.current
            );
            setVerificationId(verificationId);
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
            const credential = PhoneAuthProvider.credential(
                verificationId,
                verificationCode
            );
            const auth = getAuth();
            const userCredential = await signInWithCredential(auth, credential);
            console.log("Trainer Phone Auth Success:", userCredential.user.uid);

            // Backend Verification & Navigation
            handleBackendVerify(userCredential.user);

        } catch (err) {
            console.error("Verification Error:", err);
            Alert.alert('Error', `Invalid OTP: ${err.message}`);
        }
    };

    const handleBackendVerify = (user) => {
        if (user) {
            user.getIdToken().then(token => {
                api.authVerify(token).then(async () => {
                    try {
                        // Check Profile Completion
                        const profile = await api.getProfile();
                        console.log("Login Profile Check:", profile);

                        if (profile && profile.fullName && profile.primarySpecialization) {
                            navigation.replace('TrainerMainApp'); // Use replace to prevent back button
                        } else {
                            navigation.navigate('TrainerOnboarding');
                        }
                    } catch (profileErr) {
                        console.log("Profile check failed, going to onboarding:", profileErr);
                        navigation.navigate('TrainerOnboarding');
                    }
                }).catch(err => {
                    console.error("Backend Verification Failed:", err);
                    Alert.alert("Login Error", "Could not verify trainer with backend.");
                });
            });
        }
    };

    // Dev Helper
    const handleGuestLogin = () => {
        const { signInAnonymously, getAuth, signOut } = require('firebase/auth');
        const auth = getAuth();
        signOut(auth).then(() => {
            signInAnonymously(auth)
                .then((cred) => handleBackendVerify(cred.user))
                .catch(e => Alert.alert("Auth Failed", e.message));
        });
    };

    return (
        <View style={styles.container}>
            <FirebaseRecaptchaVerifierModal
                ref={recaptchaVerifier}
                firebaseConfig={firebaseConfig}
            />
            <Text style={styles.text}>Trainer Login</Text>

            {!verificationId ? (
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
                    <TouchableOpacity onPress={() => setVerificationId(null)} style={{ marginTop: 10 }}>
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
