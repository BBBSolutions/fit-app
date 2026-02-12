import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Alert, TouchableOpacity, ScrollView, ActivityIndicator, Modal, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../config/supabaseAuth';
import { adminApi } from '../../services/adminApi';
import { api } from '../../services/api';

import { Country, State, City } from 'country-state-city';
import { Dropdown } from 'react-native-element-dropdown';

const countriesData = Country.getAllCountries().map(c => ({ label: c.name, value: c.isoCode }));

// REPLACE THESE WITH YOUR ACTUAL KEYS
const MSG91_WIDGET_ID = "366174674959343238323934";
const MSG91_TOKEN_AUTH = "489401TrQeYRqt696f3d86P1"; // Usually just the widget ID manages config, but sometimes auth key needed check docs. 
// Actually for Widget, usually just WidgetID and Token/Auth key is for backend.
// Frontend widget just needs data-widget-id.

const GymOwnerSignupScreen = ({ navigation }) => {
    // 1: Owner Info, 2: Phone Verify (Widget), 3: Branch Info, 4: Success
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [isFocus, setIsFocus] = useState(false);

    // OTP State
    const [showOtpModal, setShowOtpModal] = useState(false);
    const [enteredOtp, setEnteredOtp] = useState('');
    const [isLoadingOtp, setIsLoadingOtp] = useState(false);
    const [otpHash, setOtpHash] = useState(''); // Store the hash
    const [otpExpires, setOtpExpires] = useState(null); // Store expiry timestamp

    // ...

    const handleStartVerification = async () => {
        if (!formData.fullName || !formData.phone) {
            Alert.alert('Missing Fields', 'Please fill in Name and Phone.');
            return;
        }

        setIsLoadingOtp(true);
        try {
            // 1. Send OTP via Backend
            // Auto-prepend 91 if user entered 10 digits
            let phoneToSend = formData.phone;
            if (phoneToSend.length === 10) {
                phoneToSend = '91' + phoneToSend;
            }

            console.log("Sending WhatsApp OTP to", phoneToSend);
            const res = await api.sendMsg91OTP(phoneToSend);
            console.log("Send Response:", res);

            if (res.hash) {
                setOtpHash(res.hash); // Store hash
                setOtpExpires(res.expires);
            } else {
                console.warn("No hash returned from backend!");
            }

            // 2. Open Modal
            setEnteredOtp('');
            setShowOtpModal(true);
            Alert.alert("WhatsApp OTP Sent", "Please check your WhatsApp messages.");
        } catch (error) {
            Alert.alert("Error", error.message);
        } finally {
            setIsLoadingOtp(false);
        }
    };

    const handleVerifyOTP = async () => {
        if (!enteredOtp || enteredOtp.length < 6) {
            Alert.alert("Invalid OTP", "Please enter the 6-digit code.");
            return;
        }

        setIsLoadingOtp(true);
        try {
            // 3. Verify OTP via Backend (Pass Hash as 3rd arg 'widgetId')
            // Using the 'widgetId(3rd arg)' slot to pass the HASH
            let phoneToVerify = formData.phone;
            if (phoneToVerify.length === 10) {
                phoneToVerify = '91' + phoneToVerify;
            }
            const res = await api.verifyMsg91Token(phoneToVerify, enteredOtp, otpHash, otpExpires);
            console.log("Verify Success:", res);

            await api.setCustomToken(res.token);

            setShowOtpModal(false);
            setStep(3);
            Alert.alert("Success", "Phone Verified!");
        } catch (error) {
            Alert.alert("Verification Failed", error.message);
        } finally {
            setIsLoadingOtp(false);
        }
    };

    // Dropdown Data
    const [statesData, setStatesData] = useState([]);
    const [citiesData, setCitiesData] = useState([]);
    const [selectedCountryCode, setSelectedCountryCode] = useState(null);
    const [selectedStateCode, setSelectedStateCode] = useState(null);

    // Form Stats
    const [formData, setFormData] = useState({
        // Owner Info
        fullName: '',
        email: '',
        phone: '',
        // Branch Info
        gymName: '',
        branchName: '',
        street: '',
        city: '',
        state: '',
        country: '',
        pincode: '',
        membersCount: '',
    });

    const [generatedGymCode, setGeneratedGymCode] = useState('');



    const handleRegisterBranch = async () => {
        if (!formData.gymName || !formData.city || !formData.country) {
            Alert.alert('Missing Fields', 'Gym Name, City, and Country are required.');
            return;
        }

        setLoading(true);
        try {
            const branchRes = await adminApi.createBranch({
                // Owner Details (for creating 'owners' record)
                fullName: formData.fullName,
                email: formData.email,
                phone: formData.phone,
                // Branch Details
                gymName: formData.gymName,
                branchName: formData.branchName,
                city: formData.city,
                state: formData.state,
                country: formData.country,
                street: formData.street,
                pincode: formData.pincode,
            });

            console.log("Branch Created:", branchRes);
            setGeneratedGymCode(branchRes.branch.gym_code);
            setStep(4);
        } catch (err) {
            Alert.alert('Error', `Failed to create branch: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };


    const handleGoToDashboard = () => {
        navigation.reset({
            index: 0,
            routes: [{ name: 'OwnerBranchList' }],
        });
    };

    // --- Render Steps ---

    const renderStep1_OwnerInfo = () => (
        <ScrollView contentContainerStyle={styles.formContainer}>
            <Text style={styles.stepsIndicator}>Step 1 of 3: Owner Details</Text>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>First, let's set up your owner profile.</Text>

            <Text style={styles.label}>Full Name <Text style={styles.req}>*</Text></Text>
            <TextInput
                style={styles.input}
                placeholder="John Doe"
                value={formData.fullName}
                onChangeText={(t) => setFormData({ ...formData, fullName: t })}
            />

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
                placeholder="9876543210"
                keyboardType="phone-pad"
                maxLength={10}
                value={formData.phone}
                onChangeText={(t) => setFormData({ ...formData, phone: t })}
            />
            <Text style={{ fontSize: 12, color: 'gray', marginBottom: 20 }}>Enter 10-digit mobile number</Text>

            <TouchableOpacity style={styles.button} onPress={handleStartVerification} disabled={loading}>
                {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Verify Phone (WhatsApp)</Text>}
            </TouchableOpacity>
        </ScrollView>
    );

    const renderStep3_BranchInfo = () => (
        <ScrollView contentContainerStyle={styles.formContainer}>
            <Text style={styles.stepsIndicator}>Step 3 of 3: Gym Details</Text>
            <Text style={styles.title}>Register First Branch</Text>
            <Text style={styles.subtitle}>Set up your first gym location.</Text>

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

            {/* Address Fields */}
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
                        valueField="value"
                        placeholder="Select City"
                        searchPlaceholder="Search..."
                        value={formData.city}
                        onChange={item => {
                            setFormData({ ...formData, city: item.value });
                        }}
                    />
                </View>
            </View>

            <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={styles.label}>Street Address</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="123 Main St"
                        value={formData.street}
                        onChangeText={(t) => setFormData({ ...formData, street: t })}
                    />
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text style={styles.label}>Pincode</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="10001"
                        value={formData.pincode}
                        onChangeText={(t) => setFormData({ ...formData, pincode: t })}
                    />
                </View>
            </View>

            <TouchableOpacity style={styles.button} onPress={handleRegisterBranch} disabled={loading}>
                {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Register Gym</Text>}
            </TouchableOpacity>
        </ScrollView>
    );

    const renderSuccess = () => (
        <View style={styles.centerContainer}>
            <Ionicons name="checkmark-circle" size={80} color="#38A169" />
            <Text style={styles.title}>All Set!</Text>
            <Text style={styles.subtitle}>Your account and gym branch are ready.</Text>

            <View style={styles.codeContainer}>
                <Text style={styles.codeLabel}>YOUR GYM CODE</Text>
                <Text style={styles.codeValue}>{generatedGymCode}</Text>
                <Text style={styles.codeHint}>Share this code with your staff and members.</Text>
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

            {step === 1 && renderStep1_OwnerInfo()}
            {step === 3 && renderStep3_BranchInfo()}
            {step === 4 && renderSuccess()}

            {/* Native OTP Modal */}
            <Modal visible={showOtpModal} animationType="slide" transparent={true} onRequestClose={() => setShowOtpModal(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.otpContainer}>
                        <TouchableOpacity style={styles.closeModalButton} onPress={() => setShowOtpModal(false)}>
                            <Ionicons name="close" size={24} color="#718096" />
                        </TouchableOpacity>

                        <Text style={styles.modalTitle}>Enter OTP</Text>
                        <Text style={styles.modalSubtitle}>Sent to {formData.phone}</Text>

                        <TextInput
                            style={styles.otpInput}
                            placeholder="123456"
                            keyboardType="number-pad"
                            maxLength={6}
                            value={enteredOtp}
                            onChangeText={setEnteredOtp}
                            autoFocus={true}
                        />

                        <TouchableOpacity style={styles.button} onPress={handleVerifyOTP} disabled={isLoadingOtp}>
                            {isLoadingOtp ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Verify</Text>}
                        </TouchableOpacity>

                        <TouchableOpacity style={{ marginTop: 20 }} onPress={handleStartVerification} disabled={isLoadingOtp}>
                            <Text style={{ color: '#3182CE' }}>Resend OTP</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View >
    );
};

// Styles Update for Modal
const modalStyles = StyleSheet.create({
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    otpContainer: { width: '85%', backgroundColor: 'white', borderRadius: 16, padding: 24, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5 },
    closeModalButton: { position: 'absolute', top: 16, right: 16 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
    modalSubtitle: { fontSize: 14, color: 'gray', marginBottom: 24 },
    otpInput: { width: '100%', height: 60, fontSize: 24, textAlign: 'center', letterSpacing: 8, borderWidth: 1, borderColor: '#CBD5E0', borderRadius: 8, marginBottom: 24, backgroundColor: '#F7FAFC' }
});

// Merging styles
const baseStyles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },
    formContainer: { padding: 32, paddingBottom: 100 },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },

    stepsIndicator: { fontSize: 12, color: '#3182CE', fontWeight: 'bold', marginBottom: 8, letterSpacing: 1 },

    title: { fontSize: 24, fontWeight: 'bold', color: '#2D3748', marginBottom: 8 },
    subtitle: { fontSize: 16, color: '#718096', marginBottom: 32 },

    label: { fontSize: 14, fontWeight: '600', color: '#4A5568', marginBottom: 8 },
    req: { color: '#E53E3E' },

    input: { height: 50, borderColor: '#E2E8F0', borderWidth: 1, borderRadius: 8, paddingHorizontal: 16, marginBottom: 20, backgroundColor: '#F7FAFC', fontSize: 16 },

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
    placeholderStyle: { fontSize: 16, color: '#A0AEC0' },
    selectedTextStyle: { fontSize: 16, color: '#2D3748' },
    inputSearchStyle: { height: 40, fontSize: 16 },

    row: { flexDirection: 'row' },

    button: { backgroundColor: '#3182CE', paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginTop: 12, width: '100%' },
    buttonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },

    linkText: { color: '#3182CE', marginTop: 16, fontSize: 14 },
    backButtonTop: { position: 'absolute', top: 40, right: 20, zIndex: 10, padding: 8, backgroundColor: '#EDF2F7', borderRadius: 20 },

    codeContainer: { backgroundColor: '#EBF8FF', padding: 24, borderRadius: 12, alignItems: 'center', marginVertical: 32, width: '100%' },
    codeLabel: { fontSize: 12, fontWeight: 'bold', color: '#3182CE', letterSpacing: 1 },
    codeValue: { fontSize: 48, fontWeight: 'bold', color: '#2C5282', letterSpacing: 4, marginVertical: 8 },
    codeHint: { fontSize: 13, color: '#4A5568', textAlign: 'center' },
});

const styles = { ...baseStyles, ...modalStyles };

export default GymOwnerSignupScreen;
