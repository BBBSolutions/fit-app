import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, Button, Alert, TouchableOpacity } from 'react-native';
import { getAuth, PhoneAuthProvider, signInWithCredential, signInAnonymously } from 'firebase/auth';
import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';
import { firebaseConfig } from '../../config/firebase';

import { api } from '../../services/api';

const AdminLoginScreen = ({ navigation }) => {
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
            const auth = getAuth();
            const credential = PhoneAuthProvider.credential(verificationId, verificationCode);
            const userCredential = await signInWithCredential(auth, credential);

            // Backend Verification (Creates User/Profile)
            const token = await userCredential.user.getIdToken();
            await api.authVerify(token);

            navigation.replace('AdminDashboard');
        } catch (err) {
            console.error("Verification Error:", err);
            Alert.alert('Error', `Invalid OTP: ${err.message}`);
        }
    };

    const handleDevLogin = async () => {
        try {
            const auth = getAuth();
            const userCredential = await signInAnonymously(auth);

            // Backend Verification (Creates User/Profile)
            const token = await userCredential.user.getIdToken();
            await api.authVerify(token);

            console.log("Admin Dev Login Success");
            navigation.replace('AdminDashboard');
        } catch (err) {
            Alert.alert("Auth Failed", err.message);
        }
    };

    return (
        <View style={styles.container}>
            <FirebaseRecaptchaVerifierModal
                ref={recaptchaVerifier}
                firebaseConfig={firebaseConfig}
            />
            <View style={styles.card}>
                <Text style={styles.title}>Admin Portal</Text>
                <Text style={styles.subtitle}>Login to access the dashboard</Text>

                {!verificationId ? (
                    <>
                        <Text style={styles.label}>Phone Number</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="+1 234 567 8900"
                            value={phoneNumber}
                            onChangeText={setPhoneNumber}
                            keyboardType="phone-pad"
                        />
                        <Button title="Send Login Code" onPress={handleSendOtp} color="#3182CE" />
                    </>
                ) : (
                    <>
                        <Text style={styles.label}>Verification Code</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="123456"
                            value={verificationCode}
                            onChangeText={setVerificationCode}
                            keyboardType="number-pad"
                        />
                        <Button title="Verify & Login" onPress={handleVerifyOtp} color="#3182CE" />
                        <TouchableOpacity onPress={() => setVerificationId(null)} style={{ marginTop: 12 }}>
                            <Text style={{ color: '#3182CE', textAlign: 'center' }}>Use a different number</Text>
                        </TouchableOpacity>
                    </>
                )}

                <View style={styles.divider}>
                    <View style={styles.line} />
                    <Text style={styles.orText}>OR</Text>
                    <View style={styles.line} />
                </View>

                <Button
                    title="Dev: Quick Login (Anonymous)"
                    color="#718096"
                    onPress={handleDevLogin}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F7FAFC', padding: 20 },
    card: { backgroundColor: '#FFF', padding: 32, borderRadius: 12, width: '100%', maxWidth: 400, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
    title: { fontSize: 24, fontWeight: 'bold', color: '#2D3748', marginBottom: 8, textAlign: 'center' },
    subtitle: { fontSize: 16, color: '#718096', marginBottom: 32, textAlign: 'center' },
    label: { fontSize: 14, fontWeight: '600', color: '#4A5568', marginBottom: 8 },
    input: { height: 44, borderColor: '#E2E8F0', borderWidth: 1, borderRadius: 6, paddingHorizontal: 12, marginBottom: 20, backgroundColor: '#FAFAFA' },
    divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 24 },
    line: { flex: 1, height: 1, backgroundColor: '#E2E8F0' },
    orText: { marginHorizontal: 12, color: '#A0AEC0', fontSize: 12, fontWeight: '600' },
});

export default AdminLoginScreen;
