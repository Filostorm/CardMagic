import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

type StripeCheckoutSession = {
  id: string;
  object: "checkout.session";
  client_reference_id?: string | null;
  customer?: string | null;
  subscription?: string | null;
  metadata?: {
    supabase_user_id?: string;
    product_id?: string;
  } | null;
};

type StripeEvent = {
  id: string;
  type: string;
  data: {
    object: StripeCheckoutSession;
  };
};

const STRIPE_WEBHOOK_TOLERANCE_SECONDS = 300;

serve(async (request) => {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const payload = await request.text();
  const signature = request.headers.get("Stripe-Signature") ?? "";
  const webhookSecret = requireEnv("STRIPE_WEBHOOK_SECRET");

  if (!(await verifyStripeSignature(payload, signature, webhookSecret))) {
    return new Response("Invalid Stripe signature", { status: 400 });
  }

  const event = JSON.parse(payload) as StripeEvent;

  if (!["checkout.session.completed", "checkout.session.async_payment_succeeded"].includes(event.type)) {
    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const session = event.data.object;
  const userId = session.metadata?.supabase_user_id ?? session.client_reference_id;
  const productId = session.metadata?.product_id;

  if (!userId || !productId) {
    return new Response("Missing checkout metadata", { status: 400 });
  }

  const supabase = createClient(requireEnv("SUPABASE_URL"), requireEnv("SUPABASE_SERVICE_ROLE_KEY"));
  const { error } = await supabase.rpc("grant_stripe_purchase", {
    p_stripe_event_id: event.id,
    p_user_id: userId,
    p_product_id: productId,
    p_stripe_checkout_session_id: session.id,
    p_stripe_customer_id: session.customer ?? null,
    p_stripe_subscription_id: session.subscription ?? null,
  });

  if (error) {
    return new Response(error.message, { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  });
});

async function verifyStripeSignature(payload: string, signatureHeader: string, secret: string) {
  const timestamp = signatureHeader.match(/(?:^|,)t=([^,]+)/)?.[1];
  const signatures = [...signatureHeader.matchAll(/(?:^|,)v1=([^,]+)/g)].map((match) => match[1]);

  if (!timestamp || signatures.length === 0) {
    return false;
  }

  const timestampSeconds = Number(timestamp);

  if (
    !Number.isFinite(timestampSeconds) ||
    Math.abs(Date.now() / 1000 - timestampSeconds) > STRIPE_WEBHOOK_TOLERANCE_SECONDS
  ) {
    return false;
  }

  const signedPayload = `${timestamp}.${payload}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const expectedSignature = toHex(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(signedPayload)));

  return signatures.some((signature) => timingSafeEqual(signature, expectedSignature));
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;

  for (let index = 0; index < a.length; index += 1) {
    result |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }

  return result === 0;
}

function toHex(buffer: ArrayBuffer) {
  return [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function requireEnv(name: string) {
  const value = Deno.env.get(name);

  if (!value) {
    throw new Error(`${name} is not configured.`);
  }

  return value;
}
