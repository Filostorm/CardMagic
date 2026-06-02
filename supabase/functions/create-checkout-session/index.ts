import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

type CheckoutProductId = "spark" | "forge" | "vault" | "monthly";

type SupabaseAuthUser = {
  id: string;
  email?: string | null;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    const supabaseUrl = requireEnv("SUPABASE_URL").replace(/\/$/, "");
    const supabaseAnonKey = requireEnv("SUPABASE_ANON_KEY");
    const user = await getAuthenticatedUser(supabaseUrl, supabaseAnonKey, request.headers.get("Authorization"));

    if (!user) {
      return json({ error: "Sign in before starting checkout." }, 401);
    }

    const stripeSecretKey = requireEnv("STRIPE_SECRET_KEY");
    const priceMap = JSON.parse(requireEnv("CARDMAGIC_STRIPE_PRICE_MAP")) as Record<CheckoutProductId, string>;
    const { productId, successUrl, cancelUrl } = await request.json() as {
      productId?: CheckoutProductId;
      successUrl?: string;
      cancelUrl?: string;
    };

    if (!productId || !priceMap[productId]) {
      return json({ error: "Unknown checkout product." }, 400);
    }

    const fallbackSiteUrl = requireEnv("CARDMAGIC_SITE_URL").replace(/\/$/, "");
    const resolvedSuccessUrl = resolveReturnUrl(successUrl, `${fallbackSiteUrl}?checkout=success`, fallbackSiteUrl);
    const resolvedCancelUrl = resolveReturnUrl(cancelUrl, `${fallbackSiteUrl}?checkout=cancelled`, fallbackSiteUrl);
    const mode = productId === "monthly" ? "subscription" : "payment";
    const body = new URLSearchParams({
      mode,
      success_url: resolvedSuccessUrl,
      cancel_url: resolvedCancelUrl,
      client_reference_id: user.id,
      "line_items[0][price]": priceMap[productId],
      "line_items[0][quantity]": "1",
      "metadata[supabase_user_id]": user.id,
      "metadata[product_id]": productId,
      "allow_promotion_codes": "true",
    });

    if (user.email) {
      body.set("customer_email", user.email);
    }

    const stripeResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });
    const checkoutSession = await stripeResponse.json();

    if (!stripeResponse.ok) {
      return json({ error: checkoutSession?.error?.message ?? "Stripe Checkout failed." }, 400);
    }

    return json({ checkoutUrl: checkoutSession.url });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Unexpected checkout error." }, 500);
  }
});

async function getAuthenticatedUser(
  supabaseUrl: string,
  supabaseAnonKey: string,
  authorization: string | null,
): Promise<SupabaseAuthUser | null> {
  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  const token = authorization.slice("Bearer ".length);
  const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: supabaseAnonKey,
    },
  });

  if (!userResponse.ok) {
    return null;
  }

  const user = await userResponse.json();

  if (typeof user?.id !== "string") {
    return null;
  }

  return {
    id: user.id,
    email: typeof user.email === "string" ? user.email : null,
  };
}

function requireEnv(name: string) {
  const value = Deno.env.get(name);

  if (!value) {
    throw new Error(`${name} is not configured.`);
  }

  return value;
}

function resolveReturnUrl(candidate: string | undefined, fallback: string, allowedBaseUrl: string) {
  if (!candidate) {
    return fallback;
  }

  if (candidate.startsWith(`${allowedBaseUrl}/`) || candidate === allowedBaseUrl || candidate.startsWith("cardmagic://")) {
    return candidate;
  }

  return fallback;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
