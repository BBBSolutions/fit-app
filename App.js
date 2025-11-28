import React from 'react';
import { Button, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { collection, addDoc } from 'firebase/firestore';
import { db } from './src/config/firebase';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  const testDatabase = async () => {
    try {
      await addDoc(collection(db, "testing"), {
        text: "Hello Firebase",
        timestamp: new Date()
      });
      console.log("Success");
    } catch (e) {
      console.error("Error adding document: ", e);
    }
  };

  return (
    <SafeAreaProvider>
      <View style={{ marginTop: 50, padding: 10 }}>
        <Button title="Test Database" onPress={testDatabase} />
      </View>
      <AppNavigator />
    </SafeAreaProvider>
  );
}
