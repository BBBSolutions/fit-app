import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Button, Alert, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../config/supabaseAuth';
import { adminApi } from '../../services/adminApi';
import { api } from '../../services/api';

import { Country, State, City } from 'country-state-city';
import { Dropdown } from 'react-native-element-dropdown';

const countriesData = Country.getAllCountries().map(c => ({ label: c.name, value: c.isoCode }));

const GymOwnerSignupScreen = ({ navigation }) => {
    const [step, setStep] = useState(1); // 1: Details, 2: Phone Verify, 3: Success
    const [loading, setLoading] = useState(false);
    const [isFocus, setIsFocus] = useState(false);

    // Dropdown Data States
    const [statesData, setStatesData] = useState([]);
    const [citiesData, setCitiesData] = useState([]);

    // Selection Codes (for logic)
    const [selectedCountryCode, setSelectedCountryCode] = useState(null);
    const [selectedStateCode, setSelectedStateCode] = useState(null);

    // Form Stats
    const [formData, setFormData] = useState({
        fullName: '',
        gymName: '',
        branchName: '',
        street: '',
        city: '',
        state: '',
        country: '',
        pincode: '',
        address: '', // Consolidate or keep separate based on backend logic? Backend uses separate + generic.
        email: '',
        membersCount: '',
        phone: ''
    });

    // Auth State
    const [verificationCode, setVerificationCode] = useState('');
    const [generatedGymCode, setGeneratedGymCode] = useState('');

    const handleSendOtp = async () => {
        if (!formData.fullName || !formData.gymName || !formData.phone) {
            Alert.alert('Missing Fields', 'Please fill in all required fields.');
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.auth.signInWithOtp({
                phone: formData.phone,
            });

            if (error) throw error;

            setStep(2);
            Alert.alert('Success', 'OTP sent to your phone!');
        } catch (err) {
            console.error("Phone Auth Error:", err);
            Alert.alert('Error', `Failed to send OTP: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Dev Signup Bypass (uses anonymous signup)
    const handleDevSignup = async () => {
        if (!formData.fullName || !formData.gymName) {
            Alert.alert('Missing Fields', 'Please fill in Name and Gym Name.');
            return;
        }

        setLoading(true);
        try {
            const devEmail = 'dev_gym_owner@test.com';
            const devPassword = 'dev_password_123';

            // 1. Try to login first
            let { data, error } = await supabase.auth.signInWithPassword({
                email: devEmail,
                password: devPassword
            });

            // 2. If login fails (user doesn't exist or wrong password), try to sign up
            if (error || !data.user) {
                console.log("Dev user not found or login failed, trying to create...", error?.message);
                const signUpRes = await supabase.auth.signUp({
                    email: devEmail,
                    password: devPassword
                });

                if (signUpRes.error) {
                    // If existing user (but maybe wrong password in first step), throw original error
                    if (signUpRes.error.message.includes("already registered")) {
                        throw error || new Error("User exists but login failed");
                    }
                    throw signUpRes.error;
                }
                data = signUpRes.data;
            }

            if (!data.user) throw new Error("Failed to authenticate dev user");

            const result = await adminApi.signupGymOwner({
                name: formData.fullName,
                email: formData.email || devEmail,
                gymName: formData.gymName,
                branchName: formData.branchName,
                membersCount: formData.membersCount,
                address: formData.address,
                street: formData.street,
                city: formData.city,
                state: formData.state,
                country: formData.country,
                pincode: formData.pincode,
                userId: data.user.id,
                phone: formData.phone // Added phone
            });

            console.log("Dev Signup Success:", result);
            setGeneratedGymCode(result.gymCode);
            setStep(3);
        } catch (err) {
            console.error("Dev Signup Error:", err);
            if (err.message && err.message.includes("is invalid")) {
                Alert.alert(
                    'Dev Login Config Required',
                    'Failed to use Dev Email. Please ensure the "Email" provider is ENABLED in Supabase Dashboard -> Authentication -> Providers.',
                    [{ text: 'OK' }]
                );
            } else {
                Alert.alert('Error', `Dev Signup Failed: ${err.message}`);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyAndCreate = async () => {
        if (verificationCode.trim() === '') {
            Alert.alert('Error', 'Please enter the OTP');
            return;
        }

        setLoading(true);
        try {
            // Verify Supabase OTP
            const { data, error } = await supabase.auth.verifyOtp({
                phone: formData.phone,
                token: verificationCode,
                type: 'sms'
            });

            if (error) throw error;

            // Register Gym & Promote to Admin
            const result = await adminApi.signupGymOwner({
                name: formData.fullName,
                email: formData.email,
                gymName: formData.gymName,
                branchName: formData.branchName,
                membersCount: formData.membersCount,
                address: formData.address,
                street: formData.street,
                city: formData.city,
                state: formData.state,
                country: formData.country,
                pincode: formData.pincode,
                userId: data.user.id,
                phone: formData.phone // Added phone
            });

            console.log("Gym Owner Signup Success:", result);
            setGeneratedGymCode(result.gymCode); // Expected "A7B2X"
            setStep(3);

        } catch (err) {
            console.error("Signup Error:", err);
            Alert.alert('Error', `Failed to create account: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleGoToDashboard = () => {
        navigation.reset({
            index: 0,
            routes: [{ name: 'AdminLogin' }, { name: 'AdminDashboard' }],
        });
    };

    const renderDetailsForm = () => (
        <ScrollView contentContainerStyle={styles.formContainer}>
            <Text style={styles.title}>Register Your Gym</Text>
            <Text style={styles.subtitle}>Enter your business details to get started.</Text>

            <Text style={styles.label}>Full Name <Text style={styles.req}>*</Text></Text>
            <TextInput
                style={styles.input}
                placeholder="John Doe"
                value={formData.fullName}
                onChangeText={(t) => setFormData({ ...formData, fullName: t })}
            />

            <Text style={styles.label}>Gym Name <Text style={styles.req}>*</Text></Text>
            <TextInput
                style={styles.input}
                placeholder="Titan Fitness"
                value={formData.gymName}
                onChangeText={(t) => setFormData({ ...formData, gymName: t })}
            />

            <Text style={styles.label}>Branch Name (Optional)</Text>
            <TextInput
                style={styles.input}
                placeholder="Downtown Branch"
                value={formData.branchName}
                onChangeText={(t) => setFormData({ ...formData, branchName: t })}
            />

            <Text style={styles.label}>Country <Text style={styles.req}>*</Text></Text>
            <Dropdown
                style={[styles.dropdown, isFocus && { borderColor: 'blue' }]}
                placeholderStyle={styles.placeholderStyle}
                selectedTextStyle={styles.selectedTextStyle}
                inputSearchStyle={styles.inputSearchStyle}
                data={countriesData}
                search
                maxHeight={300}
                labelField="label"
                valueField="value"
                placeholder={!isFocus ? 'Select Country' : '...'}
                searchPlaceholder="Search..."
                value={selectedCountryCode}
                onFocus={() => setIsFocus(true)}
                onBlur={() => setIsFocus(false)}
                onChange={item => {
                    setSelectedCountryCode(item.value);
                    setFormData({ ...formData, country: item.label, state: '', city: '' });
                    setStatesData(State.getStatesOfCountry(item.value).map(s => ({ label: s.name, value: s.isoCode })));
                    setCitiesData([]);
                    setSelectedStateCode(null);
                    setIsFocus(false);
                }}
            />

            <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={styles.label}>State <Text style={styles.req}>*</Text></Text>
                    <Dropdown
                        style={[styles.dropdown]}
                        placeholderStyle={styles.placeholderStyle}
                        selectedTextStyle={styles.selectedTextStyle}
                        inputSearchStyle={styles.inputSearchStyle}
                        data={statesData}
                        search
                        maxHeight={300}
                        labelField="label"
                        valueField="value"
                        placeholder="Select State"
                        searchPlaceholder="Search..."
                        value={selectedStateCode}
                        onChange={item => {
                            setSelectedStateCode(item.value);
                            setFormData({ ...formData, state: item.label, city: '' });
                            setCitiesData(City.getCitiesOfState(selectedCountryCode, item.value).map(c => ({ label: c.name, value: c.name })));
                        }}
                    />
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text style={styles.label}>City <Text style={styles.req}>*</Text></Text>
                    <Dropdown
                        style={[styles.dropdown]}
                        placeholderStyle={styles.placeholderStyle}
                        selectedTextStyle={styles.selectedTextStyle}
                        inputSearchStyle={styles.inputSearchStyle}
                        data={citiesData}
                        search
                        maxHeight={300}
                        labelField="label"
                        valueField="value" // City doesn't have isoCode usually, use name
                        placeholder="Select City"
                        searchPlaceholder="Search..."
                        value={formData.city} // We store Name directly
                        onChange={item => {
                            setFormData({ ...formData, city: item.value });
                        }}
                    />
                </View>
            </View>

            <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={styles.label}>Street Address <Text style={styles.req}>*</Text></Text>
                    <TextInput
                        style={styles.input}
                        placeholder="123 Main St"
                        value={formData.street}
                        onChangeText={(t) => setFormData({ ...formData, street: t })}
                    />
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text style={styles.label}>Pincode <Text style={styles.req}>*</Text></Text>
                    <TextInput
                        style={styles.input}
                        placeholder="10001"
                        value={formData.pincode}
                        onChangeText={(t) => setFormData({ ...formData, pincode: t })}
                    />
                </View>
            </View>

            <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={styles.label}>Est. Members</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="100"
                        keyboardType="numeric"
                        value={formData.membersCount}
                        onChangeText={(t) => setFormData({ ...formData, membersCount: t })}
                    />
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                    {/* Placeholder for future field */}
                </View>
            </View>

            <Text style={styles.label}>Email (Optional)</Text>
            <TextInput
                style={styles.input}
                placeholder="john@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                value={formData.email}
                onChangeText={(t) => setFormData({ ...formData, email: t })}
            />

            <Text style={styles.label}>Phone Number <Text style={styles.req}>*</Text></Text>
            <TextInput
                style={styles.input}
                placeholder="+1 234 567 8900"
                keyboardType="phone-pad"
                value={formData.phone}
                onChangeText={(t) => setFormData({ ...formData, phone: t })}
            />

            <TouchableOpacity style={styles.button} onPress={handleSendOtp} disabled={loading}>
                {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Verify Phone & Continue</Text>}
            </TouchableOpacity>

            {/* Dev Bypass Button */}
            <TouchableOpacity style={[styles.button, { backgroundColor: '#718096', marginTop: 16 }]} onPress={handleDevSignup} disabled={loading}>
                <Text style={styles.buttonText}>Dev: Skip Verification</Text>
            </TouchableOpacity>

            <View style={{ height: 40 }} />
        </ScrollView>
    );

    const renderVerification = () => (
        <View style={styles.centerContainer}>
            <Text style={styles.title}>Verify Phone</Text>
            <Text style={styles.subtitle}>Enter the code sent to {formData.phone}</Text>

            <TextInput
                style={[styles.input, { textAlign: 'center', letterSpacing: 8, fontSize: 24, fontWeight: 'bold' }]}
                placeholder="------"
                keyboardType="number-pad"
                maxLength={6}
                value={verificationCode}
                onChangeText={setVerificationCode}
            />

            <TouchableOpacity style={styles.button} onPress={handleVerifyAndCreate} disabled={loading}>
                {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Complete Registration</Text>}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setStep(1)} disabled={loading}>
                <Text style={styles.linkText}>Change Details</Text>
            </TouchableOpacity>
        </View>
    );

    const renderSuccess = () => (
        <View style={styles.centerContainer}>
            <Ionicons name="checkmark-circle" size={80} color="#38A169" />
            <Text style={styles.title}>Welcome Aboard!</Text>
            <Text style={styles.subtitle}>Your gym has been successfully registered.</Text>

            <View style={styles.codeContainer}>
                <Text style={styles.codeLabel}>YOUR GYM CODE</Text>
                <Text style={styles.codeValue}>{generatedGymCode}</Text>
                <Text style={styles.codeHint}>Share this 5-digit code with your members and trainers so they can join your gym.</Text>
            </View>

            <TouchableOpacity style={styles.button} onPress={handleGoToDashboard}>
                <Text style={styles.buttonText}>Go to Dashboard</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.backButtonTop} onPress={() => navigation.goBack()}>
                <Ionicons name="close" size={24} color="#4A5568" />
            </TouchableOpacity>

            {step === 1 && renderDetailsForm()}
            {step === 2 && renderVerification()}
            {step === 3 && renderSuccess()}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },
    formContainer: { padding: 32, paddingBottom: 100 },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },

    title: { fontSize: 24, fontWeight: 'bold', color: '#2D3748', marginBottom: 8, textAlign: 'center' },
    subtitle: { fontSize: 16, color: '#718096', marginBottom: 32, textAlign: 'center' },

    label: { fontSize: 14, fontWeight: '600', color: '#4A5568', marginBottom: 8 },
    req: { color: '#E53E3E' },
    // Dropdown Styles
    dropdown: {
        height: 50,
        borderColor: '#E2E8F0',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 16,
        backgroundColor: '#F7FAFC',
        marginBottom: 20,
    },
    placeholderStyle: {
        fontSize: 16,
        color: '#A0AEC0',
    },
    selectedTextStyle: {
        fontSize: 16,
        color: '#2D3748',
    },
    inputSearchStyle: {
        height: 40,
        fontSize: 16,
    },
    itemTextStyle: {
        fontSize: 16,
        color: '#2D3748',
    },
    input: { height: 50, borderColor: '#E2E8F0', borderWidth: 1, borderRadius: 8, paddingHorizontal: 16, marginBottom: 20, backgroundColor: '#F7FAFC', fontSize: 16 },

    row: { flexDirection: 'row' },

    button: { backgroundColor: '#3182CE', paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginTop: 12, width: '100%' },
    buttonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },

    linkText: { color: '#3182CE', marginTop: 16, fontSize: 14 },

    backButtonTop: { position: 'absolute', top: 40, right: 20, zIndex: 10, padding: 8 },

    codeContainer: { backgroundColor: '#EBF8FF', padding: 24, borderRadius: 12, alignItems: 'center', marginVertical: 32, width: '100%' },
    codeLabel: { fontSize: 12, fontWeight: 'bold', color: '#3182CE', letterSpacing: 1 },
    codeValue: { fontSize: 48, fontWeight: 'bold', color: '#2C5282', letterSpacing: 4, marginVertical: 8 },
    codeHint: { fontSize: 13, color: '#4A5568', textAlign: 'center' },
});

export default GymOwnerSignupScreen;
