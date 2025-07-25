// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
// IMPORTANT: In a real production application, these keys should be stored
// securely as an environment variables and not be hardcoded.
const firebaseConfig = {
    apiKey: "AIzaSyCsAZjQYSkd6GnRMZjlTj9gE3er0C6T7CU",
    authDomain: "redirect-2a90a.firebaseapp.com",
    projectId: "redirect-2a90a",
    storageBucket: "redirect-2a90a.firebasestorage.app",
    messagingSenderId: "339748579597",
    appId: "1:339748579597:web:8bef1a3182649cecdc6844",
    measurementId: "G-E7VW58JM16"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);


// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);