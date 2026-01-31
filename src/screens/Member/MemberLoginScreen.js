import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Button, Alert, TouchableOpacity } from 'react-native';
import { supabase } from '../../config/supabaseAuth';
import { api } from '../../services/api';
import { adminApi } from '../../services/adminApi';

const MemberLoginScreen = ({ navigation, route }) => {
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
      // dev hack
      // import adminApi
      // We need to import adminApi at top level, let's fix imports first

      // ... (rest of logic)
      // Actually, I should update the imports first.

      const { data, error } = await supabase.auth.verifyOtp({
        phone: phoneNumber,
        token: verificationCode,
        type: 'sms'
      });

      if (error) throw error;

      // START: Join Gym Logic
      if (gymCode) {
        try {
          await adminApi.joinBranch(gymCode, 'member');
          Alert.alert('Success', `You have successfully joined the gym (${gymCode})!`);
        } catch (joinErr) {
          console.error("Join Gym Error:", joinErr);
          // Don't block login if join fails, but maybe alert user?
          // "Failed to join gym. You can try again from Dashboard."
          Alert.alert('Notice', 'Login successful, but failed to join gym automatically. Please contact reception.');
        }
      }
      // END: Join Gym Logic

      // Check Profile Completion
      try {
        const profile = await api.getProfile();
        console.log("Login Profile Check (Member):", profile);

        if (profile && profile.name && profile.goal) {
          navigation.replace('MainApp');
        } else {
          navigation.navigate('OnboardingSurvey');
        }
      } catch (e) {
        console.log("Profile incomplete, to onboarding");
        navigation.navigate('OnboardingSurvey');
      }
    } catch (err) {
      console.error("Verification Error:", err);
      Alert.alert('Error', `Invalid OTP: ${err.message}`);
    }
  };



  // Dev Helper
  const handleGuestLogin = () => {
    const { signInAnonymously } = require('firebase/auth');
    supabase.auth.signInAnonymously()
      .then(({ data, error }) => {
        if (error) throw error;
        navigation.navigate('OnboardingSurvey');
      })
      .catch(e => Alert.alert("Auth Failed", e.message));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Member Login</Text>

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
          <TouchableOpacity onPress={() => setVerificationId(null)} style={{ marginTop: 10 }}>
            <Text style={{ color: 'blue' }}>Wrong number? Try again</Text>
          </TouchableOpacity>
        </>
      )}

      <View style={{ marginTop: 40, borderTopWidth: 1, borderColor: '#eee', paddingTop: 20, width: '100%' }}>
        <Button
          title="Dev: Login as New Guest"
          color="#666"
          onPress={handleGuestLogin}
        />
        <Text style={{ textAlign: 'center', marginTop: 5, fontSize: 10, color: '#888' }}>
          (Testing Only: Creates Anonymous User)
        </Text>
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

export default MemberLoginScreen;
