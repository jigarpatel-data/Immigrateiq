
"use server";

import { redirect } from 'next/navigation';
import { auth } from './firebase';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { app } from './firebase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-06-20',
});

const db = getFirestore(app);

export async function handleCheckout() {
    const currentUser = auth.currentUser;
    const priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID!; 
    const headersList = headers();
    const origin = headersList.get('origin');

    let session;
    try {
        if (currentUser) {
             session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: [{
                    price: priceId,
                    quantity: 1,
                }],
                mode: 'subscription',
                customer_email: currentUser.email!,
                metadata: {
                    userId: currentUser.uid,
                },
                success_url: `${origin}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${origin}/`,
            });
        } else {
             session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: [{
                    price: priceId,
                    quantity: 1,
                }],
                mode: 'subscription',
                // For new users, we let them enter email on Stripe's page.
                // The webhook will handle creating the user record.
                success_url: `${origin}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${origin}/`,
            });
        }


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

export async function handleStripeEvent(event: Stripe.Event) {
    switch (event.type) {
        case 'checkout.session.completed':
            const session = event.data.object as Stripe.Checkout.Session;
            
            if (session.mode === 'subscription' && session.payment_status === 'paid') {
                const subscriptionId = session.subscription as string;
                const customerId = session.customer as string;
                const userId = session.metadata?.userId;
                
                if (!userId) {
                    console.error("Webhook Error: No userId in checkout session metadata.");
                    return;
                }

                try {
                    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
                    
                    const userDocRef = doc(db, 'users', userId);

                    await setDoc(userDocRef, {
                        stripeCustomerId: customerId,
                        subscriptionId: subscription.id,
                        plan: subscription.items.data[0].price.id,
                        status: subscription.status,
                        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
                    }, { merge: true });

                    console.log(`Successfully updated subscription for user ${userId}`);

                } catch (error) {
                    console.error('Error updating user subscription in Firestore:', error);
                }
            }
            break;
        
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted':
            const subscription = event.data.object as Stripe.Subscription;
            const customerId = subscription.customer as string;
            
            // Find user by customerId (you'll need to query for this)
            // This part is more advanced. For now, we'll focus on creation.
            // A query would look like: 
            // const q = query(collection(db, "users"), where("stripeCustomerId", "==", customerId));
            // Then update the doc.
            break;

        default:
            console.log(`Unhandled event type ${event.type}`);
    }
}
