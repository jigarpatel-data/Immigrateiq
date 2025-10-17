
"use server";

import { redirect } from 'next/navigation';
import { auth } from './firebase';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { getFirestore, doc, setDoc, getDocs, collection, query, where } from 'firebase/firestore';
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
             // For users who are not logged in
             session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: [{
                    price: priceId,
                    quantity: 1,
                }],
                mode: 'subscription',
                // Let user enter email on Stripe's page. The webhook will handle finding this user.
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

// Helper function to find a user in Firestore by their email
async function findUserByEmail(email: string) {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
        // Return the first user found with that email
        return querySnapshot.docs[0];
    }
    return null;
}

export async function handleStripeEvent(event: Stripe.Event) {
    switch (event.type) {
        case 'checkout.session.completed':
            const session = event.data.object as Stripe.Checkout.Session;
            
            if (session.mode === 'subscription' && session.payment_status === 'paid') {
                const subscriptionId = session.subscription as string;
                const customerId = session.customer as string;
                
                // Check for userId in metadata first (for existing logged-in users)
                let userId = session.metadata?.userId;

                // If no userId, find user by email (for new sign-ups at checkout)
                if (!userId && session.customer_email) {
                    try {
                        const q = query(collection(db, "users"), where("email", "==", session.customer_email));
                        const querySnapshot = await getDocs(q);
                        if (!querySnapshot.empty) {
                            userId = querySnapshot.docs[0].id;
                        } else {
                             // This is a fallback. The user should have been created during auth flow.
                             console.warn(`Webhook: Could not find user with email ${session.customer_email}`);
                        }
                    } catch (e) {
                         console.error("Webhook: Error querying for user by email", e);
                         return; // Stop processing
                    }
                }
                
                if (!userId) {
                    console.error("Webhook Error: No userId found in metadata or via email lookup.");
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
            // This is for handling renewals, cancellations, etc.
            const subscription = event.data.object as Stripe.Subscription;
            const customerId = subscription.customer as string;
            
             try {
                const q = query(collection(db, "users"), where("stripeCustomerId", "==", customerId));
                const querySnapshot = await getDocs(q);
                if (!querySnapshot.empty) {
                    const userDoc = querySnapshot.docs[0];
                    await setDoc(doc(db, 'users', userDoc.id), {
                        plan: subscription.items.data[0].price.id,
                        status: subscription.status,
                        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
                    }, { merge: true });
                     console.log(`Successfully updated subscription status for customer ${customerId}`);
                }
            } catch (error) {
                console.error('Error handling subscription update:', error);
            }
            break;

        default:
            // console.log(`Unhandled event type ${event.type}`);
    }
}
