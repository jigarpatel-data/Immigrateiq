
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  "projectId": "thecanindian",
  "appId": "1:369816088263:web:f517a23ced8e01d61898e2",
  "storageBucket": "thecanindian.firebasestorage.app",
  "apiKey": "AIzaSyBwgxY7qUOmHZBxOx9f2BFS_Hwie5Dy1Ok",
  "authDomain": "thecanindian.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "369816088263"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
