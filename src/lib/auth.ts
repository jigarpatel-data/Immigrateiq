
import { auth } from "./firebase";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  setPersistence,
  browserLocalPersistence,
  onAuthStateChanged,
  type User
} from "firebase/auth";

export async function handleSignUp(email: string, password: string):Promise<{error: string | null}> {
  try {
    await setPersistence(auth, browserLocalPersistence);
    await createUserWithEmailAndPassword(auth, email, password);
    return { error: null };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function handleSignIn(email: string, password: string): Promise<{error: string | null}> {
  try {
    await setPersistence(auth, browserLocalPersistence);
    await signInWithEmailAndPassword(auth, email, password);
    return { error: null };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function handleGoogleSignIn(): Promise<{error: string | null}> {
  const provider = new GoogleAuthProvider();
  try {
    await setPersistence(auth, browserLocalPersistence);
    await signInWithPopup(auth, provider);
    return { error: null };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function handleSignOut(): Promise<{error: string | null}> {
    try {
        await firebaseSignOut(auth);
        return { error: null };
    } catch(error: any) {
        return { error: error.message };
    }
}

export function initAuthListener(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}
