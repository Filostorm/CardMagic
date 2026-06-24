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

// Opens a pre-rendered "Opening Stripe Checkout" popup window synchronously so
// the browser treats it as a user-initiated open, then the caller navigates it
// to the real Stripe session URL once created. Web-only; returns null otherwise.
export function createPendingStripeCheckoutPopup() {
  if (Platform.OS !== "web" || typeof window === "undefined") {
    return null;
  }

  const popup = window.open("", "_blank", "popup,width=520,height=760");

  if (!popup) {
    return null;
  }

  popup.opener = null;
  popup.document.title = "Opening Stripe Checkout";
  popup.document.body.style.margin = "0";
  popup.document.body.style.fontFamily = "system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
  popup.document.body.style.background = "#f7f8fb";

  const document = popup.document;
  const main = document.createElement("main");
  const section = document.createElement("section");
  const badge = document.createElement("div");
  const heading = document.createElement("h1");
  const copy = document.createElement("p");

  Object.assign(main.style, {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    color: "#111820",
  });
  Object.assign(section.style, {
    maxWidth: "320px",
    textAlign: "center",
  });
  Object.assign(badge.style, {
    width: "42px",
    height: "42px",
    borderRadius: "21px",
    background: "#111820",
    color: "#ffffff",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "900",
    marginBottom: "14px",
  });
  Object.assign(heading.style, {
    fontSize: "20px",
    lineHeight: "1.2",
    margin: "0 0 8px",
    fontWeight: "900",
  });
  Object.assign(copy.style, {
    fontSize: "14px",
    lineHeight: "1.45",
    margin: "0",
    color: "#5f6570",
    fontWeight: "700",
  });

  badge.textContent = "CM";
  heading.textContent = "Opening Stripe Checkout";
  copy.textContent = "CardMagic is creating a secure checkout session.";
  section.append(badge, heading, copy);
  main.append(section);
  popup.document.body.replaceChildren(main);
  popup.focus();

  return popup;
}
