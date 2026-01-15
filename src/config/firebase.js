import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence, getAuth } from "firebase/auth";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { getFirestore } from "firebase/firestore";
// Import compat for expo-firebase-recaptcha
import firebase from "firebase/compat/app";
import "firebase/compat/auth";

const firebaseConfig = {
    apiKey: "AIzaSyCwZJ7KrzdyiNQu6zBZ_pA9UdGCYznNg28",
    authDomain: "fitapp-old.firebaseapp.com",
    projectId: "fitapp-old",
    storageBucket: "fitapp-old.firebasestorage.app",
    messagingSenderId: "328526308438",
    appId: "1:328526308438:web:618fcd8d479f7075fbc7f7",
    measurementId: "G-LF7FW72TSH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Compat for libraries that need it (like expo-firebase-recaptcha)
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Initialize services
// Use initializeAuth for React Native persistence
// Initialize services
let auth;
if (Platform.OS === 'web') {
    auth = getAuth(app);
} else {
    auth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage)
    });
}

const db = getFirestore(app);

export { auth, db, firebaseConfig };
