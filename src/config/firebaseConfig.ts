import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
    apiKey: "AIzaSyDjvygwaioS6R-92_Qk1w-EN04ui_3TMf0",
    authDomain: "smarthire-db770.firebaseapp.com",
    projectId: "smarthire-db770",
    storageBucket: "smarthire-db770.firebasestorage.app",
    messagingSenderId: "633302302091",
    appId: "1:633302302091:web:b4cb407ef9f3d677b9838e",
    measurementId: "G-QQ7NNB1PX8"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth with persistence for React Native
let auth;
try {
    auth = getAuth(app);
} catch (e) {
    auth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage)
    });
}

const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };

