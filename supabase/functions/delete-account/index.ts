import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

type SupabaseAuthUser = {
  id: string;
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
    const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
    const user = await getAuthenticatedUser(supabaseUrl, serviceRoleKey, request.headers.get("Authorization"));

    if (!user) {
      return json({ error: "Sign in before deleting your account." }, 401);
    }

    const deleteResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users/${user.id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        apikey: serviceRoleKey,
      },
    });

    if (!deleteResponse.ok) {
      const body = await deleteResponse.json().catch(() => null);
      return json({ error: body?.msg ?? body?.message ?? "Supabase could not delete the account." }, 400);
    }

    return json({ ok: true });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Unexpected delete account error." }, 500);
  }
});

async function getAuthenticatedUser(
  supabaseUrl: string,
  serviceRoleKey: string,
  authorization: string | null,
): Promise<SupabaseAuthUser | null> {
  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  const token = authorization.slice("Bearer ".length);
  const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: serviceRoleKey,
    },
  });

  if (!userResponse.ok) {
    return null;
  }

  const user = await userResponse.json();
  return typeof user?.id === "string" ? { id: user.id } : null;
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
