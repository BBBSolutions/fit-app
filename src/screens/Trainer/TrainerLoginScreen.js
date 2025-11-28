import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Button, Alert } from 'react-native';

const TrainerLoginScreen = ({ navigation }) => {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [otp, setOtp] = useState('');
    const [showOtpInput, setShowOtpInput] = useState(false);

    const handleSendOtp = () => {
        if (phoneNumber.trim() === '') {
            Alert.alert('Error', 'Please enter a phone number');
            return;
        }
        // Simulate sending OTP
        setShowOtpInput(true);
        Alert.alert('Success', 'OTP sent!');
    };

    const handleEnter = () => {
        if (otp.trim() === '') {
            Alert.alert('Error', 'Please enter the OTP');
            return;
        }
        // Simulate OTP verification - navigate to onboarding
        navigation.navigate('TrainerOnboarding');
    };

    return (
        <View style={styles.container}>
            <Text style={styles.text}>Trainer Login</Text>

            {!showOtpInput ? (
                <>
                    <TextInput
                        style={styles.input}
                        placeholder="Phone Number"
                        value={phoneNumber}
                        onChangeText={setPhoneNumber}
                        keyboardType="phone-pad"
                    />
                    <Button title="Send OTP" onPress={handleSendOtp} />
                </>
            ) : (
                <>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter OTP"
                        value={otp}
                        onChangeText={setOtp}
                        keyboardType="number-pad"
                    />
                    <Button title="Enter" onPress={handleEnter} />
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

export default TrainerLoginScreen;
