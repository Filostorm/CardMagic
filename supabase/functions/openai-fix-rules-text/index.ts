import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const OPENAI_RULES_TEXT_MODELS = ["gpt-5.2", "gpt-5.1", "gpt-5", "gpt-4.1"] as const;
const MAX_JSON_BODY_BYTES = 64 * 1024;
const MAX_PROMPT_LENGTH = 8000;
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cardmagic-request-id",
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
    const user = await getAuthenticatedUser(request.headers.get("Authorization"));

    if (!user) {
      return json({ error: "Sign in before fixing rules text." }, 401);
    }

    const { prompt } = await readJsonBody<{ prompt?: string }>(request, MAX_JSON_BODY_BYTES);
    const normalizedPrompt = prompt?.trim() ?? "";

    if (!normalizedPrompt) {
      return json({ error: "Prompt is required." }, 400);
    }

    if (normalizedPrompt.length > MAX_PROMPT_LENGTH) {
      return json({ error: `Prompt must be ${MAX_PROMPT_LENGTH} characters or fewer.` }, 400);
    }

    return json({ content: await fixRulesText(normalizedPrompt) });
  } catch (error) {
    if (error instanceof RequestValidationError) {
      return json({ error: error.message }, error.status);
    }

    return json({ error: error instanceof Error ? error.message : "OpenAI rules text fixer failed." }, 500);
  }
});

type SupabaseAuthUser = {
  id: string;
};

class RequestValidationError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "RequestValidationError";
    this.status = status;
  }
}

async function getAuthenticatedUser(authorization: string | null): Promise<SupabaseAuthUser | null> {
  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  const supabaseUrl = requireEnv("SUPABASE_URL").replace(/\/$/, "");
  const supabaseAnonKey = requireEnv("SUPABASE_ANON_KEY");
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
  return typeof user?.id === "string" ? { id: user.id } : null;
}

async function readJsonBody<T>(request: Request, maxBytes: number): Promise<T> {
  const contentLength = Number(request.headers.get("Content-Length") ?? "0");

  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    throw new RequestValidationError("Request body is too large.", 413);
  }

  const body = await request.text();

  if (body.length > maxBytes) {
    throw new RequestValidationError("Request body is too large.", 413);
  }

  try {
    return JSON.parse(body) as T;
  } catch {
    throw new RequestValidationError("Request body must be valid JSON.", 400);
  }
}

async function fixRulesText(prompt: string) {
  let lastError: Error | null = null;

  for (const model of OPENAI_RULES_TEXT_MODELS) {
    try {
      const body: Record<string, unknown> = {
        model,
        text: {
          format: {
            type: "json_schema",
            name: "fixed_rules_text",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              required: ["rulesText"],
              properties: {
                rulesText: { type: "string" },
              },
            },
          },
        },
        input: [
          {
            role: "system",
            content:
              "You are a Magic: The Gathering Oracle rules editor. Correct both templating and rules-functionality defects. Return only JSON that matches the schema.",
          },
          { role: "user", content: prompt },
        ],
      };

      if (model.startsWith("gpt-5")) {
        body.reasoning = { effort: "medium" };
      }

      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${requireEnv("OPENAI_API_KEY")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload?.error?.message || `OpenAI rules text fixer failed with HTTP ${response.status}.`);
      }

      const content = getResponsesTextOutput(payload);

      if (!content) {
        throw new Error("OpenAI did not return fixed rules text.");
      }

      return content;
    } catch (error) {
      const textError = error instanceof Error ? error : new Error("OpenAI rules text fixer failed.");
      lastError = textError;

      if (!shouldTryNextOpenAiTextModel(textError)) {
        throw textError;
      }
    }
  }

  throw lastError ?? new Error("OpenAI rules text fixer failed.");
}

function getResponsesTextOutput(payload: Record<string, unknown>) {
  if (typeof payload.output_text === "string") {
    return payload.output_text;
  }

  const output = Array.isArray(payload.output) ? payload.output : [];

  for (const item of output) {
    if (!item || typeof item !== "object") {
      continue;
    }

    const content = Array.isArray((item as { content?: unknown }).content)
      ? (item as { content: unknown[] }).content
      : [];

    for (const block of content) {
      if (!block || typeof block !== "object") {
        continue;
      }

      const text = (block as { text?: unknown }).text;

      if (typeof text === "string") {
        return text;
      }
    }
  }

  return null;
}

function shouldTryNextOpenAiTextModel(error: Error) {
  return /\b(?:model|unsupported|not supported|not found|does not exist|access|permission|available)\b/i.test(
    error.message,
  );
}

function requireEnv(name: string) {
  const value = Deno.env.get(name);

  if (!value) {
    throw new Error(`${name} is not configured.`);
  }

  return value;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
