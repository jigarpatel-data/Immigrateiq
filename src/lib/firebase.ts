
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD3_j3i6ogbRa9HcE4UsUty2ZLnuS_hAxU",
  authDomain: "immigration-uni-84368757-ca3d4.firebaseapp.com",
  projectId: "immigration-uni-84368757-ca3d4",
  storageBucket: "immigration-uni-84368757-ca3d4.firebasestorage.app",
  messagingSenderId: "9301678245",
  appId: "1:9301678245:web:bdc2bffad50c925030554c"
};


const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
