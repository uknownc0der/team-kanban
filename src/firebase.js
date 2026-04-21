// src/firebase.js
// Replace these values with your own from Firebase Console
// Project Settings → Your Apps → Firebase SDK snippet → Config

import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCHRHKGRjmUuWN47u2zUenIJxv5R_4BNFI",
  authDomain: "maqam-kanban.firebaseapp.com",
  projectId: "maqam-kanban",
  storageBucket: "maqam-kanban.firebasestorage.app",
  messagingSenderId: "390056884000",
  appId: "1:390056884000:web:cb35fd7e924d184b0d8945"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);
