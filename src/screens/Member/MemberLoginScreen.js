import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Button, Alert, TouchableOpacity, Platform } from 'react-native';
import { supabase } from '../../config/supabaseAuth';
import { api } from '../../services/api';
import { adminApi } from '../../services/adminApi';

const MemberLoginScreen = ({ navigation, route }) => {
  const { gymCode } = route.params || {};
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  // Store Hash & Expiry for Stateless Verification
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
      // Result should contain { success: true, hash, expires }
      if (result.hash) {
        setOtpHash(result.hash);
        setOtpExpiry(result.expires);
        setOtpSent(true);
        Alert.alert('Success', 'WhatsApp OTP sent!');
      } else {
        throw new Error("No hash returned from server");
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
      // 1. Verify OTP & Get Token
      // verifyMsg91Token(phone, otpInput, hash, expiry)
      const { token } = await api.verifyMsg91Token(phoneNumber, verificationCode, otpHash, otpExpiry);
      if (!token) throw new Error("Verification failed");

      // 2. Set Custom Token
      await api.setCustomToken(token);

      // 3. Join Gym Logic (if applicable)
      if (gymCode) {
        try {
          const res = await adminApi.joinBranch(gymCode, 'member');
          if (res && !res.alreadyMember) {
            Alert.alert('Success', `You have successfully joined the gym (${gymCode})!`);
          }
        } catch (joinErr) {
          const msg = joinErr.message || "";
          if (msg.toLowerCase().includes('already a member')) {
            // Expected state for returning users, no log needed
          } else {
            console.error("Join Gym Error:", joinErr);
            Alert.alert('Notice', 'Login successful. (Join status: ' + msg + ')');
          }
        }
      }

      // 4. Check Profile & Redirect
      try {
        const profile = await api.getProfile();
        console.log("Login Profile Check (Member):", profile);

        // --- Role Validation ---
        // If profile has roles, they must include 'member' or be empty (new user).
        if (profile && profile.roles && profile.roles.length > 0) {
          if (!profile.roles.includes('member')) {
            // Not a member (e.g., exclusively trainer or owner).
            await api.removeCustomToken(); // Clear token
            if (Platform.OS === 'web') {
              window.alert("Access Denied: This phone number is registered as a Trainer. Please use the Trainer App.");
            } else {
              Alert.alert("Access Denied", "This phone number is registered as a Trainer. Please use the Trainer App.");
            }
            setLoading(false);
            return;
          }
        }
        // -----------------------

        // If profile has name and goal, assume onboarding done
        if (profile && profile.name && profile.goal) {
          navigation.replace('MainApp');
        } else {
          // If created by Admin, they might have Name but no Goal.
          // Send to Onboarding to finish setup?
          // For now, yes, send to OnboardingSurvey to complete profile.
          navigation.replace('OnboardingSurvey', { existingData: profile });
        }
      } catch (e) {
        console.log("Profile check failed, going to onboarding");
        navigation.replace('OnboardingSurvey', { existingData: null });
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

  // Dev Helper
  // Guest login removed (Firebase legacy)

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Member Login (WhatsApp)</Text>

      {!otpSent ? (
        <>
          <TextInput
            style={styles.input}
            placeholder="Phone Number (e.g. 9893569046)"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
            autoComplete="tel"
          />
          <Button title={loading ? "Sending..." : "Send OTP"} onPress={handleSendOtp} disabled={loading} />
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
          <Button title={loading ? "Verifying..." : "Verify OTP"} onPress={handleVerifyOtp} disabled={loading} />
          <TouchableOpacity onPress={() => setOtpSent(false)} style={{ marginTop: 10 }}>
            <Text style={{ color: 'blue' }}>Wrong number? Try again</Text>
          </TouchableOpacity>
        </>
      )}
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
