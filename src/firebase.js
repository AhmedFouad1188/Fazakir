import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyAD4eY1CoPP_Ir_Zc5QyqIdZcYnqyE0t9Y",
    authDomain: "fazakir-34094.firebaseapp.com",
    projectId: "fazakir-34094",
    storageBucket: "fazakir-34094.firebasestorage.app",
    messagingSenderId: "999007199908",
    appId: "1:999007199908:web:83b0543d82fbc4b8d7fc31",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { auth, googleProvider, signInWithPopup };