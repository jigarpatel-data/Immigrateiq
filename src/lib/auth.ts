
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

export async function handleSignUp(email: string, password: string):Promise<{error: string | null}> {
  try {
    await setPersistence(auth, browserLocalPersistence);
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await sendEmailVerification(userCredential.user);
    // Sign out the user immediately after creation. They must verify email before logging in.
    await firebaseSignOut(auth);
    return { error: null };
  } catch (error: any) {
    if (error.code === 'auth/email-already-in-use') {
      return { error: "An account with this email address already exists." };
    }
    return { error: error.message };
  }
}

export async function handleSignIn(email: string, password: string): Promise<{error: string | null}> {
  try {
    await setPersistence(auth, browserLocalPersistence);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);

    if (!userCredential.user.emailVerified) {
      // Optionally re-send the verification email if they try to log in without verifying
      await sendEmailVerification(userCredential.user);
      await firebaseSignOut(auth); // Log them out
      return { error: "Your email is not verified. We've sent a new verification link to your inbox." };
    }
    
    return { error: null };
  } catch (error: any) {
    if (error.code === 'auth/invalid-credential') {
      return { error: "Incorrect email or password. Please try again." };
    }
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
        // Force a refresh of the user's token to get the latest profile data
        await auth.currentUser.getIdToken(true);
        return { error: null };
    } catch (error: any) {
        return { error: error.message };
    }
}

export function initAuthListener(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, (user) => {
    if (user && !user.emailVerified) {
      // Don't consider the user "logged in" for the app's purposes if email is not verified
      callback(null);
    } else {
      callback(user);
    }
  });
}

    
