import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Button, Alert, TouchableOpacity } from 'react-native';
import { supabase } from '../../config/supabaseAuth';

import { api } from '../../services/api';

const AdminLoginScreen = ({ navigation }) => {
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
            Alert.alert('Success', 'OTP sent to your phone!');
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

            console.log("Admin Login Success");
            navigation.replace('OwnerBranchList');
        } catch (err) {
            console.error("Verification Error:", err);
            Alert.alert('Error', `Invalid OTP: ${err.message}`);
        }
    };

    const handleDevLogin = async () => {
        try {
            const { data, error } = await supabase.auth.signInAnonymously();

            if (error) throw error;

            console.log("Admin Dev Login Success");
            navigation.replace('OwnerBranchList');
        } catch (err) {
            Alert.alert("Auth Failed", err.message);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.card}>
                <Text style={styles.title}>Admin Portal</Text>
                <Text style={styles.subtitle}>Login to access the dashboard</Text>

                {!otpSent ? (
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
                        <TouchableOpacity onPress={() => setOtpSent(false)} style={{ marginTop: 12 }}>
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
