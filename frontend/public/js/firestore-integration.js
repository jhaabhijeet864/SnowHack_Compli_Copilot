/**
 * AUTH INTEGRATION HELPER
 * Add this code to your auth.html to save users to Firestore on signup
 * 
 * Location: Add to the end of your auth form submission handler
 */

// After successful Firebase signup, call this function:
async function saveNewUserToFirestore(firebaseUser, fullName, company) {
    try {
        const { doc, setDoc } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
        import { db } from './js/firebase.js'; // Assumes you export db from firebase.js
        
        const userRef = doc(db, 'users', firebaseUser.uid);
        
        await setDoc(userRef, {
            name: fullName,
            email: firebaseUser.email,
            company: company || '',
            phone: '',
            address: '',
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        
        console.log('✅ User saved to Firestore:', firebaseUser.uid);
        return true;
    } catch (error) {
        console.error('❌ Error saving user to Firestore:', error);
        return false;
    }
}

// UPDATE YOUR AUTH.HTML SIGNUP FORM LIKE THIS:
/*

// Find your signup form submission handler and update it:

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const fullName = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const company = document.getElementById('signup-company').value;
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-confirm').value;
    
    if (password !== confirmPassword) {
        alert('Passwords do not match');
        return;
    }
    
    try {
        // Create Firebase user
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // ✨ NEW: Save to Firestore ✨
        const saved = await saveNewUserToFirestore(user, fullName, company);
        
        if (saved) {
            console.log('User created and saved successfully');
            // Redirect to profile page or dashboard
            window.location.href = 'profile.html'; // Or 'dashboard.html'
        } else {
            alert('Signup successful but profile creation failed. Please contact support.');
        }
    } catch (error) {
        console.error('Signup error:', error);
        alert('Signup failed: ' + error.message);
    }
});

*/

// ALSO UPDATE YOUR FIREBASE.JS TO EXPORT DB:
/*

// Add this to frontend/public/js/firebase.js

import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const db = getFirestore(app);

export { app, analytics, db };  // Export db!

*/
