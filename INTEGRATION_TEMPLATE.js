/**
 * QUICK INTEGRATION TEMPLATE
 * Use this as a reference to integrate the profile page with your existing code
 */

// ============================================================================
// 1. UPDATE frontend/public/js/firebase.js
// ============================================================================

// ADD THESE IMPORTS AND EXPORTS:
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-analytics.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js"; // ADD THIS LINE

const firebaseConfig = {
  apiKey: "AIzaSyBL8_6nVU2OCwvNRYWqbx4NzD3PgftnFUE",
  authDomain: "complicopilot.firebaseapp.com",
  projectId: "complicopilot",
  storageBucket: "complicopilot.appspot.com",
  messagingSenderId: "314466368999",
  appId: "1:314466368999:web:90bddd39193c34fc80d142",
  measurementId: "G-8657BX50YD"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app); // ADD THIS LINE

let analytics = null;
if (typeof window !== "undefined" && 'measurementId' in firebaseConfig && location.hostname !== "localhost") {
  try { 
    analytics = getAnalytics(app); 
  } catch (e) { 
    console.warn("Analytics initialization skipped:", e.message); 
  }
}

export { app, analytics, db }; // ADD db TO EXPORT

// ============================================================================
// 2. UPDATE YOUR AUTH FORM SUBMISSION HANDLER
// ============================================================================

// Find where you handle signup form submission and replace with this:

async function handleSignUp(email, password, fullName, company) {
  try {
    // Import Firebase functions
    const { createUserWithEmailAndPassword } = await import(
      "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js"
    );
    const { getAuth } = await import(
      "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js"
    );
    const { doc, setDoc } = await import(
      "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js"
    );
    
    const auth = getAuth();
    
    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // ✨ NEW: Save user profile to Firestore ✨
    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, {
      name: fullName,
      email: email,
      company: company || '',
      phone: '',
      address: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    console.log('✅ User created and saved:', user.uid);
    
    // Redirect to profile page (or dashboard)
    window.location.href = 'profile.html';
    
    return user;
  } catch (error) {
    console.error('❌ Signup error:', error);
    throw error;
  }
}

// ============================================================================
// 3. UPDATE YOUR RECEIPT UPLOAD HANDLER
// ============================================================================

// When you upload a receipt, add userId to the data:

async function handleReceiptUpload(imageFile, vendor, date, amount, category) {
  try {
    const { getAuth } = await import(
      "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js"
    );
    const { collection, addDoc, serverTimestamp } = await import(
      "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js"
    );
    
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    // Upload image to Firebase Storage (if using storage)
    // For now, we'll use a placeholder
    
    // Create receipt document in Firestore
    const receiptData = {
      userId: user.uid, // ✨ IMPORTANT: Add user ID
      vendor: vendor || 'Unknown',
      date: date || new Date().toISOString().split('T')[0],
      amount: parseFloat(amount) || 0,
      currency: 'USD',
      category: category || 'Uncategorized',
      status: 'completed',
      imageUrl: 'image-url-here', // Update with actual image URL
      createdAt: new Date(),
    };
    
    // Save to Firestore
    const receiptsRef = collection(db, 'receipts');
    const docRef = await addDoc(receiptsRef, receiptData);
    
    console.log('✅ Receipt saved:', docRef.id);
    
    return {
      id: docRef.id,
      ...receiptData
    };
  } catch (error) {
    console.error('❌ Error uploading receipt:', error);
    throw error;
  }
}

// ============================================================================
// 4. FIRESTORE SECURITY RULES TO SET IN FIREBASE CONSOLE
// ============================================================================

/*
Go to Firebase Console → Firestore Database → Rules
Replace entire content with:

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own user document
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
    
    // Users can only read/write their own receipts
    match /receipts/{receiptId} {
      allow read, write: if request.auth.uid == resource.data.userId;
      allow create: if request.auth.uid == request.resource.data.userId;
    }
    
    // Categories are readable by all authenticated users
    match /categories/{categoryId} {
      allow read: if request.auth.uid != null;
      allow write: if false; // Read-only
    }
  }
}

Click "Publish" when done
*/

// ============================================================================
// 5. TEST CHECKLIST
// ============================================================================

/*
✅ BEFORE TESTING:
  [ ] Updated firebase.js with db export
  [ ] Updated auth signup to save to Firestore
  [ ] Updated receipt upload to include userId
  [ ] Set Firestore security rules in Firebase Console
  
✅ TESTING:
  [ ] Start frontend: npm start
  [ ] Sign up with test account
  [ ] Check Firestore users collection - should have user doc
  [ ] Upload a receipt
  [ ] Check Firestore receipts collection - should have receipt with userId
  [ ] Go to profile page
  [ ] Should see profile info and receipt history
  [ ] Try search/filter
  [ ] Try edit profile
  
✅ IF SOMETHING DOESN'T WORK:
  [ ] Check browser console for errors
  [ ] Check Firebase Console for user/data
  [ ] Verify security rules are published
  [ ] Check that userId matches in receipts
  [ ] Try clearing browser cache and refresh
*/

// ============================================================================
// 6. USEFUL FIREBASE QUERIES (FOR DEBUGGING)
// ============================================================================

// Get all receipts for logged-in user:
async function debugGetUserReceipts() {
  const { query, where, getDocs, collection } = await import(
    "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js"
  );
  const { getAuth } = await import(
    "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js"
  );
  
  const auth = getAuth();
  const user = auth.currentUser;
  
  const receiptsRef = collection(db, 'receipts');
  const q = query(receiptsRef, where('userId', '==', user.uid));
  const receiptsSnap = await getDocs(q);
  
  console.log(`Found ${receiptsSnap.size} receipts:`, receiptsSnap.docs.map(d => d.data()));
}

// Get current user profile:
async function debugGetUserProfile() {
  const { doc, getDoc } = await import(
    "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js"
  );
  const { getAuth } = await import(
    "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js"
  );
  
  const auth = getAuth();
  const user = auth.currentUser;
  
  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);
  
  if (userSnap.exists()) {
    console.log('User profile:', userSnap.data());
  } else {
    console.log('No user profile found!');
  }
}

// Run in browser console to debug:
// debugGetUserProfile()
// debugGetUserReceipts()

// ============================================================================
// 7. COMMON ERRORS & FIXES
// ============================================================================

/*
ERROR: "Cannot read property 'toDate' of undefined"
FIX: Make sure you're using new Date() not Firestore timestamp in some places

ERROR: "Rule evaluation failed: permission denied"
FIX: Check security rules are published and match your data structure

ERROR: "No receipts found" on profile page
FIX: Make sure:
  1. Receipts collection has documents with userId field
  2. userId matches the logged-in user's uid
  3. Security rules allow reading

ERROR: "Cannot redirect to profile.html"
FIX: Make sure profile.html exists in public folder

ERROR: "db is not defined" in profile.js
FIX: Make sure you exported db from firebase.js
    export { app, analytics, db }
*/

// ============================================================================
// INTEGRATION COMPLETE!
// ============================================================================

console.log('Profile page integration template created');
console.log('Follow the steps above to integrate with your existing code');
