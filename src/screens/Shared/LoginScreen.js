import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';



const LoginScreen = ({ navigation, route }) => {
    const { gymCode } = route.params || {};

    return (
        <View style={styles.container}>
            <Text style={styles.text}>Login Screen</Text>
            {gymCode && <Text style={{ marginBottom: 20, color: 'gray' }}>Joining Gym: {gymCode}</Text>}
            <Button
                title="Login as Member"
                onPress={() => navigation.navigate('MemberLogin', { gymCode })}
            />
            <Button
                title="Login as Trainer"
                onPress={() => navigation.navigate('TrainerLogin', { gymCode })}
            />
            <Button
                title="Login as Admin"
                onPress={() => navigation.navigate('AdminLogin')}
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
