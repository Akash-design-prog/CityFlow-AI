// Firebase configuration and initialization
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, setPersistence, browserLocalPersistence } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { FIREBASE_CONFIG } from './config.js';

// Initialize Firebase
const app = initializeApp(FIREBASE_CONFIG);
export const auth = getAuth(app);

// Set persistence to local (session survives browser restarts)
setPersistence(auth, browserLocalPersistence)
    .then(() => {
        console.log("Firebase Auth persistence set to local");
    })
    .catch((error) => {
        console.error("Error setting persistence:", error);
    });

console.log("Firebase Auth initialized");
