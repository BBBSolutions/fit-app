import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';

const GymCodeScreen = ({ navigation }) => {
    const [gymCode, setGymCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleNext = async () => {
        if (gymCode.trim() === '') {
            if (Platform.OS === 'web') {
                window.alert('Please enter a Gym Code');
            } else {
                Alert.alert('Error', 'Please enter a Gym Code');
            }
            return;
        }

        setIsLoading(true);
        try {
            const isValid = await api.verifyGymCode(gymCode.trim().toUpperCase());
            if (!isValid) {
                if (Platform.OS === 'web') {
                    window.alert('Invalid Gym Code. Please check and try again.');
                } else {
                    Alert.alert('Error', 'Invalid Gym Code. Please check and try again.');
                }
                setIsLoading(false);
                return;
            }
            // Navigate to Login passing the gymCode
            navigation.navigate('Login', { gymCode: gymCode.trim().toUpperCase() });
        } catch (error) {
            if (Platform.OS === 'web') {
                window.alert('Something went wrong while verifying the Gym Code.');
            } else {
                Alert.alert('Error', 'Something went wrong while verifying the Gym Code.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleSuperAdminAccess = () => {
        navigation.navigate('SuperAdminGlobalSettings');
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Enter Gym Code</Text>
            <TextInput
                style={styles.input}
                placeholder="Gym Code"
                value={gymCode}
                onChangeText={setGymCode}
                autoCapitalize="characters"
                editable={!isLoading}
            />
            {isLoading ? (
                <ActivityIndicator size="large" color="#805AD5" />
            ) : (
                <Button title="Next" onPress={handleNext} />
            )}

            <TouchableOpacity style={styles.superAdminButton} onPress={handleSuperAdminAccess}>
                <Ionicons name="shield-checkmark" size={20} color="#805AD5" />
                <Text style={styles.superAdminText}>SuperAdmin Access</Text>
            </TouchableOpacity>
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
    title: {
        fontSize: 24,
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
    superAdminButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 30,
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#805AD5',
        borderStyle: 'dashed',
        gap: 8,
    },
    superAdminText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#805AD5',
    },
});

export default GymCodeScreen;
