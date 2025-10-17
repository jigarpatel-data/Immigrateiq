
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';
import { handleStripeEvent } from '@/lib/stripe';

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

    try {
        await handleStripeEvent(event);
        return NextResponse.json({ received: true });
    } catch (error: any) {
        console.error('Error handling webhook event:', error);
        return NextResponse.json({ error: 'Webhook handler failed.' }, { status: 500 });
    }
}
