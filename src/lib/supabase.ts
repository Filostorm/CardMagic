import "react-native-url-polyfill/auto";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

const DEFAULT_SUPABASE_URL = "https://lfalybddbubnkrbhaafj.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY = "sb_publishable_JPv8IbFC0vT7FORtyiiFsw_Tmm-Zilu";
const DEFAULT_SITE_URL = "https://cardmagic.craftsmannsoftware.com";

export const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? DEFAULT_SUPABASE_URL;
export const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? DEFAULT_SUPABASE_ANON_KEY;
const siteUrl = process.env.EXPO_PUBLIC_SITE_URL ?? DEFAULT_SITE_URL;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
export const authRedirectUrl = siteUrl.replace(/\/$/, "");

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: Platform.OS === "web",
      },
    })
  : null;
