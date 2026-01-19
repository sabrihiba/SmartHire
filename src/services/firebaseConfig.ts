import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// User's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDn_UN2o2lAHKl6B2ucLHge-_4Q_YO-_xA",
    authDomain: "app-job-tracker-2b26d.firebaseapp.com",
    projectId: "app-job-tracker-2b26d",
    storageBucket: "app-job-tracker-2b26d.firebasestorage.app",
    messagingSenderId: "286048400139",
    appId: "1:286048400139:web:883192461b06e7a758e80e",
    measurementId: "G-TLKT7HM7NT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with persistence
let auth;
if (Platform.OS === 'web') {
    auth = getAuth(app);
} else {
    auth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage)
    });
}

const db = getFirestore(app);

export { auth, db };
