import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '../../components/ScreenWrapper';

const WelcomeScreen = ({ navigation }) => {
    const [view, setView] = useState('main');

    const renderMain = () => (
        <View style={styles.content}>
            <View style={styles.header}>
                <Ionicons name="fitness" size={60} color="#3182CE" />
                <Text style={styles.title}>FitPlatform</Text>
                <Text style={styles.subtitle}>Manage your fitness journey or your gym business.</Text>
            </View>

            <View style={styles.actions}>
                <TouchableOpacity style={styles.primaryButton} onPress={() => setView('new')} accessibilityRole="button">
                    <Text style={styles.primaryButtonText}>I'm New</Text>
                    <Ionicons name="arrow-forward" size={20} color="#FFF" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.secondaryButton} onPress={() => setView('existing')} accessibilityRole="button">
                    <Text style={styles.secondaryButtonText}>I have an account</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderNewUserOptions = () => (
        <View style={styles.content}>
            <TouchableOpacity onPress={() => setView('main')} style={styles.backButton} accessibilityRole="button">
                <Ionicons name="arrow-back" size={24} color="#4A5568" />
            </TouchableOpacity>

            <Text style={styles.sectionTitle}>How will you use FitPlatform?</Text>

            <TouchableOpacity
                style={styles.optionCard}
                onPress={() => navigation.navigate('GymOwnerSignup')}
                accessibilityRole="button"
            >
                <View style={[styles.iconBox, { backgroundColor: '#EBF8FF' }]}>
                    <Ionicons name="business" size={28} color="#3182CE" />
                </View>
                <View style={styles.optionText}>
                    <Text style={styles.optionTitle}>Gym Owner</Text>
                    <Text style={styles.optionDesc}>I want to manage my gym, trainers, and members.</Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#CBD5E0" />
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.optionCard}
                onPress={() => navigation.navigate('Login')}
                accessibilityRole="button"
            >
                <View style={[styles.iconBox, { backgroundColor: '#F0FFF4' }]}>
                    <Ionicons name="person" size={28} color="#38A169" />
                </View>
                <View style={styles.optionText}>
                    <Text style={styles.optionTitle}>Individual</Text>
                    <Text style={styles.optionDesc}>I want to track my workouts or find a trainer.</Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#CBD5E0" />
            </TouchableOpacity>
        </View>
    );

    const renderExistingUserOptions = () => (
        <View style={styles.content}>
            <TouchableOpacity onPress={() => setView('main')} style={styles.backButton} accessibilityRole="button">
                <Ionicons name="arrow-back" size={24} color="#4A5568" />
            </TouchableOpacity>

            <Text style={styles.sectionTitle}>Welcome Back!</Text>

            <TouchableOpacity
                style={styles.optionCard}
                onPress={() => navigation.navigate('AdminLogin')}
                accessibilityRole="button"
            >
                <View style={[styles.iconBox, { backgroundColor: '#E9D8FD' }]}>
                    <Ionicons name="briefcase" size={28} color="#805AD5" />
                </View>
                <View style={styles.optionText}>
                    <Text style={styles.optionTitle}>Gym Owner</Text>
                    <Text style={styles.optionDesc}>Login to your admin dashboard.</Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#CBD5E0" />
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.optionCard}
                onPress={() => navigation.navigate('GymCode')}
                accessibilityRole="button"
            >
                <View style={[styles.iconBox, { backgroundColor: '#EDF2F7' }]}>
                    <Ionicons name="people" size={28} color="#4A5568" />
                </View>
                <View style={styles.optionText}>
                    <Text style={styles.optionTitle}>Member / Trainer</Text>
                    <Text style={styles.optionDesc}>Login with your Gym Code or account.</Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#CBD5E0" />
            </TouchableOpacity>
        </View>
    );

    return (
        <ScreenWrapper backgroundColor="#F7FAFC" keyboardAvoiding={false}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {view === 'main' && renderMain()}
                {view === 'new' && renderNewUserOptions()}
                {view === 'existing' && renderExistingUserOptions()}
            </ScrollView>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
    },
    content: {
        padding: 24,
        maxWidth: 500,
        width: '100%',
        alignSelf: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 48,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#2D3748',
        marginTop: 16,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#718096',
        textAlign: 'center',
        paddingHorizontal: 20,
    },
    actions: {
        gap: 16,
    },
    primaryButton: {
        backgroundColor: '#3182CE',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        shadowColor: '#3182CE',
        shadowOpacity: 0.2,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 8,
        elevation: 4,
    },
    primaryButtonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    secondaryButton: {
        backgroundColor: '#FFF',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    secondaryButtonText: {
        color: '#4A5568',
        fontSize: 18,
        fontWeight: '600',
    },
    backButton: {
        marginBottom: 24,
        alignSelf: 'flex-start',
        padding: 8,
        marginLeft: -8,
    },
    sectionTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2D3748',
        marginBottom: 32,
    },
    optionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        padding: 20,
        borderRadius: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#EDF2F7',
        minHeight: 72,
    },
    iconBox: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    optionText: {
        flex: 1,
    },
    optionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2D3748',
        marginBottom: 4,
    },
    optionDesc: {
        fontSize: 14,
        color: '#718096',
    },
});

export default WelcomeScreen;
