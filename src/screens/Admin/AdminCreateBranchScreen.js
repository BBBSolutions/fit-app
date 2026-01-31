import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { adminApi } from '../../services/adminApi';
import { Country, State, City } from 'country-state-city';
import { Dropdown } from 'react-native-element-dropdown';
import theme from '../../theme/theme';

const countriesData = Country.getAllCountries().map(c => ({ label: c.name, value: c.isoCode }));

const AdminCreateBranchScreen = ({ navigation, route }) => {
    const [loading, setLoading] = useState(false);
    const [isFocus, setIsFocus] = useState(false);

    const isEditMode = route.params?.mode === 'edit';
    const branchToEdit = route.params?.branchData;

    // Dropdown Data
    const [statesData, setStatesData] = useState([]);
    const [citiesData, setCitiesData] = useState([]);
    const [selectedCountryCode, setSelectedCountryCode] = useState(null);
    const [selectedStateCode, setSelectedStateCode] = useState(null);

    const [formData, setFormData] = useState({
        gymName: '',
        branchName: '',
        street: '',
        city: '',
        state: '',
        country: '',
        pincode: '',
    });

    React.useEffect(() => {
        if (isEditMode && branchToEdit) {
            setFormData({
                gymName: branchToEdit.name,
                branchName: branchToEdit.name,
                city: branchToEdit.city || '',
                state: branchToEdit.state || '',
                country: branchToEdit.country || '',
                street: '',
                pincode: ''
            });

            if (branchToEdit.country) {
                const c = countriesData.find(x => x.label === branchToEdit.country);
                if (c) {
                    setSelectedCountryCode(c.value);
                    const states = State.getStatesOfCountry(c.value).map(s => ({ label: s.name, value: s.isoCode }));
                    setStatesData(states);

                    if (branchToEdit.state) {
                        const s = states.find(x => x.label === branchToEdit.state);
                        if (s) {
                            setSelectedStateCode(s.value);
                            setCitiesData(City.getCitiesOfState(c.value, s.value).map(city => ({ label: city.name, value: city.name })));
                        }
                    }
                }
            }
        }
    }, [isEditMode, branchToEdit]);

    const handleCountryChange = (item) => {
        setFormData({ ...formData, country: item.label, state: '', city: '' });
        setSelectedCountryCode(item.value);
        setStatesData(State.getStatesOfCountry(item.value).map(s => ({ label: s.name, value: s.isoCode })));
        setCitiesData([]);
        setSelectedStateCode(null);
        setIsFocus(false);
    };

    const handleStateChange = (item) => {
        setFormData({ ...formData, state: item.label, city: '' });
        setSelectedStateCode(item.value);
        setCitiesData(City.getCitiesOfState(selectedCountryCode, item.value).map(c => ({ label: c.name, value: c.name })));
        setIsFocus(false);
    };

    const handleCreateBranch = async () => {
        if (!formData.branchName || !formData.city) {
            if (!isEditMode && (!formData.gymName || !formData.street)) {
                Alert.alert("Missing Fields", "Please fill in all required fields.");
                return;
            }
            if (isEditMode && !formData.branchName) {
                Alert.alert("Missing Fields", "Branch Name is required.");
                return;
            }
        }

        setLoading(true);
        try {
            if (isEditMode) {
                await adminApi.updateBranch(branchToEdit.id, {
                    name: formData.branchName,
                    city: formData.city,
                    state: formData.state,
                    country: formData.country,
                });
                Alert.alert("Success", "Branch updated successfully!", [{ text: "OK", onPress: () => navigation.goBack() }]);
            } else {
                await adminApi.createBranch(formData);
                if (Platform.OS === 'web') {
                    alert("Success: Branch created successfully!");
                    navigation.goBack();
                } else {
                    Alert.alert("Success", "Branch created successfully!", [
                        { text: "OK", onPress: () => navigation.goBack() }
                    ]);
                }
            }
        } catch (error) {
            console.error("Branch Action Error:", error);
            Alert.alert("Error", error.message || "Failed to save branch.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#2D3748" />
                </TouchableOpacity>
                <Text style={styles.title}>{isEditMode ? 'Edit Branch' : 'Add New Branch'}</Text>
            </View>

            <View style={styles.formCard}>
                <Text style={styles.sectionTitle}>Branch Details</Text>

                {!isEditMode && (
                    <>
                        <Text style={styles.label}>Gym Name</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. FitLife Gym"
                            value={formData.gymName}
                            onChangeText={(t) => setFormData({ ...formData, gymName: t })}
                        />
                    </>
                )}

                <Text style={styles.label}>Branch Name</Text>
                <TextInput
                    style={styles.input}
                    placeholder="e.g. Downtown Branch"
                    value={formData.branchName}
                    onChangeText={(t) => setFormData({ ...formData, branchName: t })}
                />

                <Text style={styles.label}>Country</Text>
                <Dropdown
                    style={[styles.dropdown, isFocus && { borderColor: theme.colors.primary }]}
                    placeholderStyle={styles.placeholderStyle}
                    selectedTextStyle={styles.selectedTextStyle}
                    inputSearchStyle={styles.inputSearchStyle}
                    iconStyle={styles.iconStyle}
                    data={countriesData}
                    search
                    maxHeight={300}
                    labelField="label"
                    valueField="value"
                    placeholder={!isFocus ? 'Select country' : '...'}
                    searchPlaceholder="Search..."
                    value={selectedCountryCode}
                    onFocus={() => setIsFocus(true)}
                    onBlur={() => setIsFocus(false)}
                    onChange={handleCountryChange}
                />

                <Text style={styles.label}>State / Province</Text>
                <Dropdown
                    style={[styles.dropdown, isFocus && { borderColor: theme.colors.primary }]}
                    placeholderStyle={styles.placeholderStyle}
                    selectedTextStyle={styles.selectedTextStyle}
                    inputSearchStyle={styles.inputSearchStyle}
                    iconStyle={styles.iconStyle}
                    data={statesData}
                    search
                    maxHeight={300}
                    labelField="label"
                    valueField="value"
                    placeholder={!isFocus ? 'Select state' : '...'}
                    searchPlaceholder="Search..."
                    value={selectedStateCode}
                    onFocus={() => setIsFocus(true)}
                    onBlur={() => setIsFocus(false)}
                    onChange={handleStateChange}
                    disable={!selectedCountryCode}
                />

                <Text style={styles.label}>City</Text>
                <Dropdown
                    style={[styles.dropdown, isFocus && { borderColor: theme.colors.primary }]}
                    placeholderStyle={styles.placeholderStyle}
                    selectedTextStyle={styles.selectedTextStyle}
                    inputSearchStyle={styles.inputSearchStyle}
                    iconStyle={styles.iconStyle}
                    data={citiesData}
                    search
                    maxHeight={300}
                    labelField="label"
                    valueField="value"
                    placeholder={!isFocus ? 'Select city' : '...'}
                    searchPlaceholder="Search..."
                    value={formData.city}
                    onFocus={() => setIsFocus(true)}
                    onBlur={() => setIsFocus(false)}
                    onChange={item => {
                        setFormData({ ...formData, city: item.value });
                        setIsFocus(false);
                    }}
                    disable={!selectedStateCode}
                />

                <Text style={styles.label}>Street Address</Text>
                <TextInput
                    style={styles.input}
                    placeholder="e.g. 123 Main St"
                    value={formData.street}
                    onChangeText={(t) => setFormData({ ...formData, street: t })}
                />

                <Text style={styles.label}>Pincode / Zip Code</Text>
                <TextInput
                    style={styles.input}
                    placeholder="e.g. 10001"
                    keyboardType="numeric"
                    value={formData.pincode}
                    onChangeText={(t) => setFormData({ ...formData, pincode: t })}
                />

                <TouchableOpacity
                    style={styles.submitButton}
                    onPress={handleCreateBranch}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <Text style={styles.submitButtonText}>{isEditMode ? 'Update Branch' : 'Create Branch'}</Text>
                    )}
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F7FAFC' },
    scrollContent: { padding: 20 },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    backButton: { marginRight: 16 },
    title: { fontSize: 24, fontWeight: 'bold', color: '#1A202C' },
    formCard: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#2D3748', marginBottom: 20 },
    label: { fontSize: 14, fontWeight: '600', color: '#4A5568', marginBottom: 8, marginTop: 16 },
    input: {
        backgroundColor: '#F7FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: '#2D3748',
    },
    dropdown: {
        height: 50,
        borderColor: '#E2E8F0',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 8,
        backgroundColor: '#F7FAFC',
    },
    placeholderStyle: { fontSize: 16, color: '#A0AEC0' },
    selectedTextStyle: { fontSize: 16, color: '#2D3748' },
    inputSearchStyle: { height: 40, fontSize: 16 },
    iconStyle: { width: 20, height: 20 },
    submitButton: {
        backgroundColor: theme.colors.primary,
        borderRadius: 8,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 32,
    },
    submitButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});

export default AdminCreateBranchScreen;
