import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '../../components/ScreenWrapper';

const LoginScreen = ({ navigation, route }) => {
    const { gymCode } = route.params || {};

    return (
        <ScreenWrapper backgroundColor="#F7FAFC" keyboardAvoiding={false}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.container}>
                    <View style={styles.header}>
                        <Ionicons name="log-in-outline" size={44} color="#3182CE" />
                        <Text style={styles.title}>Choose login type</Text>
                        <Text style={styles.subtitle}>
                            {gymCode ? `Joining gym ${gymCode}` : 'Continue as member, trainer, or gym admin.'}
                        </Text>
                    </View>

                    <TouchableOpacity
                        accessibilityRole="button"
                        accessibilityLabel="Login as member"
                        style={styles.optionCard}
                        onPress={() => navigation.navigate('MemberLogin', { gymCode })}
                    >
                        <View style={[styles.iconBox, { backgroundColor: '#EBF8FF' }]}>
                            <Ionicons name="person" size={24} color="#3182CE" />
                        </View>
                        <View style={styles.optionText}>
                            <Text style={styles.optionTitle}>Member</Text>
                            <Text style={styles.optionDesc}>Track workouts, progress, and goals.</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#A0AEC0" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        accessibilityRole="button"
                        accessibilityLabel="Login as trainer"
                        style={styles.optionCard}
                        onPress={() => navigation.navigate('TrainerLogin', { gymCode })}
                    >
                        <View style={[styles.iconBox, { backgroundColor: '#E6FFFA' }]}>
                            <Ionicons name="barbell" size={24} color="#2C7A7B" />
                        </View>
                        <View style={styles.optionText}>
                            <Text style={styles.optionTitle}>Trainer</Text>
                            <Text style={styles.optionDesc}>Manage clients, sessions, and plans.</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#A0AEC0" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        accessibilityRole="button"
                        accessibilityLabel="Login as gym owner"
                        style={styles.optionCard}
                        onPress={() => navigation.navigate('AdminLogin')}
                    >
                        <View style={[styles.iconBox, { backgroundColor: '#FAF5FF' }]}>
                            <Ionicons name="business" size={24} color="#805AD5" />
                        </View>
                        <View style={styles.optionText}>
                            <Text style={styles.optionTitle}>Gym Owner</Text>
                            <Text style={styles.optionDesc}>Access your admin dashboard.</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#A0AEC0" />
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: 20,
        paddingVertical: 24,
    },
    container: {
        width: '100%',
        maxWidth: 560,
        alignSelf: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 28,
        paddingHorizontal: 8,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#2D3748',
        marginTop: 10,
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 15,
        color: '#718096',
        textAlign: 'center',
    },
    optionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        padding: 16,
        marginBottom: 12,
        minHeight: 70,
    },
    iconBox: {
        width: 46,
        height: 46,
        borderRadius: 23,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    optionText: {
        flex: 1,
    },
    optionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#2D3748',
        marginBottom: 2,
    },
    optionDesc: {
        fontSize: 13,
        color: '#718096',
    },
});

export default LoginScreen;
