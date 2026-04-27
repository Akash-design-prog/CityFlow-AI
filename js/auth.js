// Authentication and Navigation Logic
import { auth } from './firebase.js';
import { 
    GoogleAuthProvider,
    signInWithPopup, 
    signInWithRedirect,
    getRedirectResult,
    onAuthStateChanged,
    signOut 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const provider = new GoogleAuthProvider();
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

export async function handleGoogleSignIn() {
    try {
        const btn = document.getElementById('google-signin-btn');
        btn.disabled = true;
        btn.textContent = "Connecting...";
        
        if (isMobile) {
            console.log("Mobile detected: using signInWithRedirect");
            await signInWithRedirect(auth, provider);
        } else {
            console.log("Desktop detected: using signInWithPopup");
            await signInWithPopup(auth, provider);
        }
    } catch (error) {
        console.error("Error with Google Sign-In:", error);
        alert("Sign-in failed. Please try again.");
    } finally {
        const btn = document.getElementById('google-signin-btn');
        if (btn && !isMobile) { // Don't reset if redirecting
            btn.disabled = false;
            btn.innerHTML = '<span style="margin-right: 10px;">G</span> Continue with Google';
        }
    }
}

export function showAuthScreen() {
    goTo('screen-auth');
}

export function hideAuthScreen() {
    goTo('screen-home');
}

export async function logout() {
    try {
        await signOut(auth);
        console.log("Logged out");
    } catch (error) {
        console.error("Logout error:", error);
    }
}

// Auth State Observer
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("User is logged in:", user.displayName);
        const firstName = user.displayName ? user.displayName.split(' ')[0] : "User";
        
        // Update all name locations
        const elements = {
            'user-display-name': firstName,
            'insight-user-name': firstName,
            'insight-quote-user-name': firstName,
            'complete-user-name': firstName
        };

        Object.entries(elements).forEach(([id, name]) => {
            const el = document.getElementById(id);
            if (el) el.textContent = name;
        });
        
        goTo('screen-home');
    } else {
        console.log("User is logged out");
        goTo('screen-auth');
    }
});

export function goTo(id) {
    console.log("Navigating to:", id);
    const screens = document.querySelectorAll('.screen');
    screens.forEach(s => s.classList.remove('active'));
    
    const target = document.getElementById(id);
    if (target) {
        target.classList.add('active');
        
        // Trigger specific screen logic
        if (id === 'screen-home') {
            if (typeof window.initHomeMap === 'function') setTimeout(window.initHomeMap, 60);
        } else if (id === 'screen-nav') {
            if (typeof window.initNavMap === 'function') setTimeout(window.initNavMap, 60);
        } else if (id === 'screen-complete') {
            if (typeof window.animateCoins === 'function') setTimeout(window.animateCoins, 300);
        }

        // Invalidate map sizes if they exist
        setTimeout(() => {
            if (window.homeMap) window.homeMap.invalidateSize();
            if (window.navMap) window.navMap.invalidateSize();
        }, 80);
    } else {
        console.error("Target screen not found:", id);
    }
}

// Global exposure for onclick handlers in HTML
window.goTo = goTo;
window.handleGoogleSignIn = handleGoogleSignIn;
window.showAuthScreen = showAuthScreen;
window.hideAuthScreen = hideAuthScreen;
window.logout = logout;

// Handle redirect result for mobile
async function handleRedirect() {
    try {
        const result = await getRedirectResult(auth);
        if (result && result.user) {
            console.log("Redirect sign-in successful:", result.user.displayName);
            // onAuthStateChanged will handle the screen transition
        }
    } catch (error) {
        console.error("Error handling redirect result:", error);
    }
}

handleRedirect();
console.log("Auth module loaded, Google Sign-In ready");
