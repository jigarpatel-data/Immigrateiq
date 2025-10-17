
"use server";

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { getFirestore, doc, addDoc, collection, onSnapshot } from 'firebase/firestore';
import { app } from './firebase'; // Do not need auth here anymore

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-06-20',
});

const db = getFirestore(app);

export async function handleCheckout(userId: string) {
    if (!userId) {
        throw new Error("User ID is required to handle checkout.");
    }
    
    const priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID!; 
    const headersList = headers();
    const origin = headersList.get('origin');
    
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
