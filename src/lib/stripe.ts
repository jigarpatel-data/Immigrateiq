
"use server";

import { redirect } from 'next/navigation';
import { auth } from './firebase'; // Corrected import
import { headers } from 'next/headers';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-06-20',
});

export async function handleCheckout() {
    const currentUser = auth.currentUser;

    if (!currentUser) {
        throw new Error("User must be logged in to checkout.");
    }
    
    // IMPORTANT: Replace this with the actual Price ID from your Stripe product.
    const priceId = 'YOUR_PRICE_ID_HERE'; 

    const headersList = headers();
    const origin = headersList.get('origin');

    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price: priceId,
                quantity: 1,
            }],
            mode: 'subscription',
            customer_email: currentUser.email!,
            success_url: `${origin}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${origin}/`,
        });

        if (session.url) {
            redirect(session.url);
        } else {
            throw new Error("Could not create Stripe Checkout session.");
        }
    } catch (error) {
        console.error("Stripe session creation failed:", error);
        throw error;
    }
}
