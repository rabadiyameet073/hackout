// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBgEnwRwhxfLlZaZEqd7zmBWorcFtQVEao",
  authDomain: "coast-watcher.firebaseapp.com",
  projectId: "coast-watcher",
  storageBucket: "coast-watcher.firebasestorage.app",
  messagingSenderId: "1072524054266",
  appId: "1:1072524054266:web:4cdbd4d380e9532036c343"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Enable offline persistence
try {
  enableIndexedDbPersistence(db);
} catch (error: any) {
  if (error.code == 'failed-precondition') {
    // Multiple tabs open, persistence can only be enabled in one tab at a time.
    console.warn('Firestore persistence failed: multiple tabs open.');
  } else if (error.code == 'unimplemented') {
    // The current browser does not support all of the features required to enable persistence
    console.warn('Firestore persistence not available in this browser.');
  }
}


export { app, auth, db, storage };
