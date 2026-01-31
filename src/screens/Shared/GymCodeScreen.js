import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const GymCodeScreen = ({ navigation }) => {
    const [gymCode, setGymCode] = useState('');

    const handleNext = () => {
        if (gymCode.trim() === '') {
            Alert.alert('Error', 'Please enter a Gym Code');
            return;
        }
        // Navigate to Login passing the gymCode
        navigation.navigate('Login', { gymCode: gymCode.toUpperCase() });
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
            />
            <Button title="Next" onPress={handleNext} />

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
