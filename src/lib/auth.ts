
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
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  type User
} from "firebase/auth";

type AuthResult = {
  user?: User | null;
  error?: string | null;
};

export async function handleSignUp(email: string, password: string): Promise<AuthResult> {
  try {
    await setPersistence(auth, browserLocalPersistence);
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await sendEmailVerification(userCredential.user);
    return { user: userCredential.user, error: null };
  } catch (error: any) {
    if (error.code === 'auth/email-already-in-use') {
      return { error: "An account with this email address already exists." };
    }
    return { error: error.message };
  }
}

export async function handleSignIn(email: string, password: string): Promise<AuthResult> {
  try {
    await setPersistence(auth, browserLocalPersistence);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);

    if (!userCredential.user.emailVerified) {
      await sendEmailVerification(userCredential.user);
      await firebaseSignOut(auth);
      return { error: "Your email is not verified. We've sent a new verification link to your inbox." };
    }
    
    return { user: userCredential.user, error: null };
  } catch (error: any) {
    if (error.code === 'auth/invalid-credential') {
      return { error: "Incorrect email or password. Please try again." };
    }
    return { error: error.message };
  }
}

export async function handleGoogleSignIn(): Promise<AuthResult> {
  const provider = new GoogleAuthProvider();
  try {
    await setPersistence(auth, browserLocalPersistence);
    const result = await signInWithPopup(auth, provider);
    return { user: result.user, error: null };
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

export async function handlePasswordReset(email: string): Promise<{error: string | null}> {
  try {
    await sendPasswordResetEmail(auth, email);
    return { error: null };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function handleProfileUpdate(profileData: { displayName?: string; photoURL?: string }): Promise<{ error: string | null }> {
    if (!auth.currentUser) {
        return { error: "You must be logged in to update your profile." };
    }
    try {
        await updateProfile(auth.currentUser, profileData);
        await auth.currentUser.getIdToken(true);
        return { error: null };
    } catch (error: any) {
        return { error: error.message };
    }
}

export function initAuthListener(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, (user) => {
    if (user && !user.emailVerified) {
      callback(null);
    } else {
      callback(user);
    }
  });
}
