
"use server";

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { getFirestore, doc, addDoc, collection, onSnapshot } from 'firebase/firestore';
import { app, auth } from './firebase'; // Import auth

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-06-20',
});

const db = getFirestore(app);

export async function handleCheckout() {
    const priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID!; 
    const headersList = headers();
    const origin = headersList.get('origin');
    
    // Get the current user directly from auth
    const user = auth.currentUser;

    if (!user) {
        throw new Error("User is not authenticated.");
    }
    const userId = user.uid;

    try {
        // Create a new checkout session in the 'customers' collection for the user.
        // The Stripe Firebase Extension will detect this and create a session.
        const checkoutSessionRef = collection(db, 'customers', userId, 'checkout_sessions');
        
        const sessionDocRef = await addDoc(checkoutSessionRef, {
            price: priceId,
            success_url: `${origin}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${origin}/`,
        });

        // Wait for the session to be created by the extension
        return new Promise<void>((resolve, reject) => {
            const unsubscribe = onSnapshot(sessionDocRef, (snap) => {
                const { error, url } = snap.data() || {};
                if (error) {
                    unsubscribe();
                    console.error(`An error occurred: ${error.message}`);
                    reject(new Error(error.message));
                }
                if (url) {
                    unsubscribe();
                    console.log("Stripe Checkout URL:", url);
                    redirect(url);
                    resolve();
                }
            });
        });

    } catch (error) {
        console.error("Stripe session creation failed:", error);
        throw error;
    }
}
