import { Platform } from "react-native";

import { supabase } from "@/lib/supabase";
import { type CreditPackId, type UserProgressProfile } from "@/lib/progression";

export type CheckoutProductId = CreditPackId | "monthly";
export type CreditTransactionType = "spend" | "promo_code" | "level_reward";

type CheckoutResponse = {
  checkoutUrl?: string;
  error?: string;
};

type RemoteProfileRow = {
  progress: unknown;
};

export async function createStripeCheckoutUrl(productId: CheckoutProductId) {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const returnUrl = getClientReturnUrl();
  const { data, error } = await supabase.functions.invoke<CheckoutResponse>("create-checkout-session", {
    body: {
      productId,
      successUrl: `${returnUrl}?checkout=success`,
      cancelUrl: `${returnUrl}?checkout=cancelled`,
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data?.checkoutUrl) {
    throw new Error(data?.error ?? "Stripe Checkout did not return a redirect URL.");
  }

  return data.checkoutUrl;
}

export async function fetchRemoteUserProgress(userId: string) {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("progress")
    .eq("id", userId)
    .maybeSingle<RemoteProfileRow>();

  if (error) {
    throw new Error(error.message);
  }

  return data?.progress ?? null;
}

export async function updateRemoteUserProgress(profile: UserProgressProfile) {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { data, error } = await supabase.rpc("save_user_progress", {
    p_progress: profile,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function recordCreditTransaction({
  amount,
  type,
  source,
  referenceId,
  balanceAfter,
  metadata = {},
}: {
  amount: number;
  type: CreditTransactionType;
  source?: string;
  referenceId?: string;
  balanceAfter?: number;
  metadata?: Record<string, unknown>;
}) {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { error } = await supabase.rpc("record_credit_transaction", {
    p_amount: Math.trunc(amount),
    p_type: type,
    p_source: source ?? null,
    p_reference_id: referenceId ?? null,
    p_balance_after: typeof balanceAfter === "number" ? Math.trunc(balanceAfter) : null,
    p_metadata: metadata,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function hasRedeemedPromotionalCreditCode(userId: string, code: string) {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { data, error } = await supabase
    .from("credit_transactions")
    .select("id")
    .eq("user_id", userId)
    .eq("type", "promo_code")
    .eq("reference_id", `promo:${code}`)
    .maybeSingle<{ id: string }>();

  if (error) {
    throw new Error(error.message);
  }

  return Boolean(data?.id);
}

function getClientReturnUrl() {
  const configuredSiteUrl = process.env.EXPO_PUBLIC_SITE_URL;

  if (configuredSiteUrl) {
    return configuredSiteUrl.replace(/\/$/, "");
  }

  if (Platform.OS === "web" && typeof window !== "undefined") {
    return `${window.location.origin}${window.location.pathname}`;
  }

  return "cardmagic://checkout";
}
