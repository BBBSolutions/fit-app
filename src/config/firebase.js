import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyDVT9jdg62E8eNtW4Ey2uUm8l2C4ALD-o0",
    authDomain: "fitapp-f11ef.firebaseapp.com",
    projectId: "fitapp-f11ef",
    storageBucket: "fitapp-f11ef.firebasestorage.app",
    messagingSenderId: "415713569316",
    appId: "1:415713569316:web:95b454efa1fe07b6f9c6b1",
    measurementId: "G-5ERLJ1PZX9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
