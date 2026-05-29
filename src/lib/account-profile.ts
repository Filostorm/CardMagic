import { supabase } from "@/lib/supabase";

export type AccountProfile = {
  username?: string;
  displayName?: string;
};

type AccountProfileRow = {
  username: string | null;
  display_name: string | null;
};

type DeleteAccountResponse = {
  ok?: boolean;
  error?: string;
};

export async function fetchAccountProfile(userId: string): Promise<AccountProfile> {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("username, display_name")
    .eq("id", userId)
    .maybeSingle<AccountProfileRow>();

  if (error) {
    throw new Error(error.message);
  }

  return {
    username: data?.username ?? undefined,
    displayName: data?.display_name ?? undefined,
  };
}

export async function updateAccountUsername(username: string): Promise<AccountProfile> {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { data, error } = await supabase
    .rpc("set_profile_username", { p_username: username.trim() });

  if (error) {
    throw new Error(error.message);
  }

  const row = ((data ?? []) as AccountProfileRow[])[0];

  return {
    username: row?.username ?? undefined,
    displayName: row?.display_name ?? undefined,
  };
}

export async function changeAccountPassword(password: string): Promise<void> {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    throw new Error(error.message);
  }
}

export async function deleteAccount(): Promise<void> {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { data, error } = await supabase.functions.invoke<DeleteAccountResponse>("delete-account", {
    body: {},
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data?.ok) {
    throw new Error(data?.error ?? "Account deletion failed.");
  }

  await supabase.auth.signOut();
}
