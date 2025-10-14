
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  "projectId": "immigration-uni-84368757-ca3d4",
  "appId": "1:958434784267:web:2d2b4b445582f3484c25eb",
  "storageBucket": "immigration-uni-84368757-ca3d4.appspot.com",
  "apiKey": "AIzaSyDaLwmuGvjOez8542Q12345y3NoF5s39qA",
  "authDomain": "immigration-uni-84368757-ca3d4.firebaseapp.com",
  "messagingSenderId": "958434784267"
};


const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
