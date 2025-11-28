import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';



const LoginScreen = ({ navigation }) => {
    return (
        <View style={styles.container}>
            <Text style={styles.text}>Login Screen</Text>
            <Button
                title="Login as Member"
                onPress={() => navigation.navigate('MemberLogin')}
            />
            <Button
                title="Login as Trainer"
                onPress={() => navigation.navigate('TrainerLogin')}
            />
            <Button
                title="Login as Admin"
                onPress={() => navigation.navigate('AdminDashboard')}
                color="#805AD5"
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    text: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
    },
});

export default LoginScreen;
