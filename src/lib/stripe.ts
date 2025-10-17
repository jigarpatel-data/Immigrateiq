
"use client";

import { FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  addDoc,
  collection,
  getFirestore,
  onSnapshot,
} from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";

export const getCheckoutUrl = async (
  app: FirebaseApp,
  priceId: string
): Promise<string> => {
  const auth = getAuth(app);
  const userId = auth.currentUser?.uid;
  if (!userId) throw new Error("User is not authenticated");

  const db = getFirestore(app);
  const checkoutSessionRef = collection(
    db,
    "customers",
    userId,
    "checkout_sessions"
  );

  const docRef = await addDoc(checkoutSessionRef, {
    price: priceId,
    success_url: `${window.location.origin}/dashboard`,
    cancel_url: window.location.origin,
  });

  return new Promise<string>((resolve, reject) => {
    const unsubscribe = onSnapshot(docRef, (snap) => {
      const { error, url } = snap.data() as {
        error?: { message: string };
        url?: string;
      };
      if (error) {
        unsubscribe();
        reject(new Error(`An error occurred: ${error.message}`));
      }
      if (url) {
        console.log("Stripe Checkout URL:", url);
        unsubscribe();
        resolve(url);
      }
    });
  });
};

export const getPortalUrl = async (app: FirebaseApp): Promise<string> => {
  const auth = getAuth(app);
  const user = auth.currentUser;

  if (!user) throw new Error("User is not authenticated.");

  let dataWithUrl: any;
  try {
    const functions = getFunctions(app, "us-central1");
    // The function name is provided by the Stripe extension.
    const functionRef = httpsCallable(
      functions,
      "ext-firestore-stripe-payments-createPortalLink"
    );
    const { data } = await functionRef({
      returnUrl: `${window.location.origin}/profile`,
    });

    dataWithUrl = data as { url: string };
  } catch (error) {
    console.error(error);
    // Provide a more specific error message if possible.
    if (error instanceof Error && 'details' in error) {
        const details = (error as any).details;
        if (details && details.code === 'unauthenticated') {
            throw new Error("Authentication error: You must be logged in to manage billing.");
        }
    }
    throw new Error("Failed to create billing portal link.");
  }

  if (dataWithUrl.url) {
    return dataWithUrl.url;
  } else {
    throw new Error("No portal URL returned. This can happen if the user has no active subscriptions.");
  }
};
