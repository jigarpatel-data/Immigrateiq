
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';
// The official Stripe extension handles writing to Firestore.
// This webhook handler is now primarily for logging or custom actions if needed,
// but it no longer needs to write to Firestore itself.
// import { handleStripeEvent } from '@/lib/stripe';

// This is required to tell Next.js to not use its default body parser,
// so we can get the raw body for Stripe's signature verification.
export const config = {
  api: {
    bodyParser: false,
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-06-20',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Helper function to read the raw body from the request
async function getRawBody(req: Request) {
    const reader = req.body?.getReader();
    if (!reader) return null;

    let chunks = [];
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
    }
    
    const body = Buffer.concat(chunks);
    return body;
}


export async function POST(req: NextRequest) {
    const sig = headers().get('stripe-signature')!;
    let event: Stripe.Event;

    try {
        const rawBody = await getRawBody(req as unknown as Request);
        if(!rawBody) {
             return NextResponse.json({ error: 'Webhook Error: No body found' }, { status: 400 });
        }
        event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    } catch (err: any) {
        console.error(`Webhook signature verification failed: ${err.message}`);
        return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    // The Stripe Firebase Extension has its own dedicated webhook (`ext-firestore-stripe-payments-handle-webhook`)
    // that processes events and writes to Firestore. This custom webhook endpoint is no longer
    // responsible for that core logic. You can add custom logic here if needed, but for now,
    // we just acknowledge receipt of the event.
    
    try {
        // Example: You could log events or trigger other business logic here.
        console.log(`Received verified Stripe event: ${event.type}`);

        // The official extension handles writing to Firestore, so we just return success.
        // await handleStripeEvent(event); 
        return NextResponse.json({ received: true });
    } catch (error: any) {
        console.error('Error handling webhook event:', error);
        return NextResponse.json({ error: 'Webhook handler failed.' }, { status: 500 });
    }
}
