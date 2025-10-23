// Fix: Use the Firebase compat library for initialization to resolve an import error
// that can occur when a v8-style Firebase package is used with v9 modular syntax.
import firebase from "firebase/compat/app";
import "firebase/compat/firestore";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDmq6_coo5kDOi-wbkpSgcnDAR8EWoDSgw",
  authDomain: "plugin-pitch.firebaseapp.com",
  projectId: "plugin-pitch",
  storageBucket: "plugin-pitch.firebasestorage.app",
  messagingSenderId: "948231875593",
  appId: "1:948231875593:web:c11df88844bdfc603fdcd8",
  measurementId: "G-43MS246S6M"
};

// Initialize Firebase using the compat API
const app = firebase.initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
