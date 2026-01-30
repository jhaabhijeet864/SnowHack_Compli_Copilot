// Firebase SDK via CDN (no bundler needed)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";

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
export const auth = getAuth(app);

console.log('✅ Firebase initialized successfully');