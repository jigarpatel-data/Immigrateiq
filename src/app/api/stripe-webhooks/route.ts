
import { NextRequest, NextResponse } from 'next/server';

// This is required to tell Next.js to not use its default body parser,
// so we can get the raw body for Stripe's signature verification.
export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req: NextRequest) {
    console.log("Stripe webhook received, but functionality is currently disabled. Acknowledging request.");
    // Since Stripe functionality is disabled, we just acknowledge the webhook to prevent Stripe from resending.
    return NextResponse.json({ received: true });
}
