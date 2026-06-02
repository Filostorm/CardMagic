export type AiCreditSpendCategory = "artImage" | "artImageHigh" | "subjectMask" | "setIcon" | "rulesText";

export type AiCreditSpendReceipt = {
  transactionId: string | null;
  category: AiCreditSpendCategory;
  cost: number;
  balanceAfter?: number;
  levelReward?: number;
  progress?: unknown;
};

type SpendAiCreditsParams = {
  supabaseUrl: string;
  supabaseAnonKey: string;
  accessToken: string;
  category: AiCreditSpendCategory;
  source: string;
  referenceId?: string;
  metadata?: Record<string, unknown>;
};

type RefundAiCreditSpendParams = {
  supabaseUrl: string;
  serviceRoleKey: string;
  userId: string;
  spend: AiCreditSpendReceipt;
  reason: string;
};

export class AiCreditSpendError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "AiCreditSpendError";
    this.status = status;
  }
}

export async function spendAiCredits({
  supabaseUrl,
  supabaseAnonKey,
  accessToken,
  category,
  source,
  referenceId,
  metadata = {},
}: SpendAiCreditsParams): Promise<AiCreditSpendReceipt> {
  const response = await fetch(`${supabaseUrl.replace(/\/$/, "")}/rest/v1/rpc/spend_ai_credits`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      apikey: supabaseAnonKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      p_category: category,
      p_source: source,
      p_reference_id: referenceId ?? null,
      p_metadata: metadata,
    }),
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message = getRpcErrorMessage(payload) ?? "Unable to spend AI credits.";
    throw new AiCreditSpendError(message, getSpendErrorStatus(response.status, message));
  }

  if (!payload || typeof payload !== "object") {
    throw new AiCreditSpendError("Credit spend RPC returned an invalid response.", 500);
  }

  return normalizeSpendReceipt(payload, category);
}

export async function refundAiCreditSpend({
  supabaseUrl,
  serviceRoleKey,
  userId,
  spend,
  reason,
}: RefundAiCreditSpendParams) {
  if (!spend.transactionId) {
    return null;
  }

  const response = await fetch(`${supabaseUrl.replace(/\/$/, "")}/rest/v1/rpc/refund_ai_credit_spend`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serviceRoleKey}`,
      apikey: serviceRoleKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      p_user_id: userId,
      p_spend_transaction_id: spend.transactionId,
      p_reason: reason,
    }),
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(getRpcErrorMessage(payload) ?? `Credit refund failed with HTTP ${response.status}.`);
  }

  return payload;
}

function normalizeSpendReceipt(payload: object, fallbackCategory: AiCreditSpendCategory): AiCreditSpendReceipt {
  const record = payload as Record<string, unknown>;
  const category = isAiCreditSpendCategory(record.category) ? record.category : fallbackCategory;

  return {
    transactionId: typeof record.transactionId === "string" ? record.transactionId : null,
    category,
    cost: normalizeNumber(record.cost, 0),
    balanceAfter: typeof record.balanceAfter === "number" ? record.balanceAfter : undefined,
    levelReward: typeof record.levelReward === "number" ? record.levelReward : undefined,
    progress: record.progress,
  };
}

function isAiCreditSpendCategory(value: unknown): value is AiCreditSpendCategory {
  return (
    value === "artImage" ||
    value === "artImageHigh" ||
    value === "subjectMask" ||
    value === "setIcon" ||
    value === "rulesText"
  );
}

function normalizeNumber(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function getSpendErrorStatus(status: number, message: string) {
  if (/not enough credits/i.test(message)) {
    return 402;
  }

  return status >= 400 && status < 600 ? status : 500;
}

function getRpcErrorMessage(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const record = payload as Record<string, unknown>;

  for (const key of ["message", "error", "hint", "details"]) {
    const value = record[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return null;
}
