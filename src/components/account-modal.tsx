import { User, X } from "lucide-react-native";
import { useMemo, useState } from "react";
import { ActivityIndicator, Modal, Pressable, Text, TextInput, useWindowDimensions, View } from "react-native";
import type { User as SupabaseUser } from "@supabase/supabase-js";

import { authRedirectUrl, isSupabaseConfigured, supabase } from "@/lib/supabase";

type AccountModalProps = {
  visible: boolean;
  user: SupabaseUser | null;
  syncing: boolean;
  onClose: () => void;
  onSyncProgress: () => void;
  onAuthSuccess: () => void;
};

export function AccountModal({ visible, user, syncing, onClose, onSyncProgress, onAuthSuccess }: AccountModalProps) {
  const { width } = useWindowDimensions();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const accountLabel = useMemo(() => user?.email ?? "Not signed in", [user?.email]);

  if (!visible) {
    return null;
  }

  const runAuthAction = async (action: "sign-in" | "sign-up") => {
    setBusy(true);
    setMessage(null);

    try {
      if (!supabase) {
        setMessage("Supabase is not configured.");
        return;
      }

      const trimmedEmail = email.trim();
      const { error } =
        action === "sign-in"
          ? await supabase.auth.signInWithPassword({ email: trimmedEmail, password })
          : await supabase.auth.signUp({
              email: trimmedEmail,
              password,
              options: {
                emailRedirectTo: authRedirectUrl,
              },
            });

      if (error) {
        setMessage(error.message);
        return;
      }

      setPassword("");
      if (action === "sign-in") {
        onAuthSuccess();
        return;
      }

      setMessage("Account created. Check your email if confirmation is enabled.");
    } finally {
      setBusy(false);
    }
  };

  const signOut = async () => {
    setBusy(true);
    setMessage(null);

    try {
      if (!supabase) {
        setMessage("Supabase is not configured.");
        return;
      }

      const { error } = await supabase.auth.signOut();
      setMessage(error?.message ?? "Signed out.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(9, 12, 18, 0.52)",
          alignItems: "center",
          justifyContent: "center",
          padding: 14,
        }}
      >
        <View
          style={{
            width: "100%",
            maxWidth: Math.min(500, width - 20),
            borderRadius: 22,
            borderCurve: "continuous",
            backgroundColor: "#f7f8fb",
            borderWidth: 1,
            borderColor: "rgba(255, 255, 255, 0.62)",
            overflow: "hidden",
            shadowColor: "#000000",
            shadowOpacity: 0.26,
            shadowRadius: 28,
            shadowOffset: { width: 0, height: 18 },
            elevation: 20,
          }}
        >
          <View style={{ backgroundColor: "#111820", padding: 18, gap: 12 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View style={{ flex: 1, gap: 4 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <User size={19} color="#72e6ff" strokeWidth={2.5} />
                  <Text selectable={false} style={{ color: "#ffffff", fontSize: 22, fontWeight: "900" }}>
                    Account
                  </Text>
                </View>
                <Text selectable numberOfLines={1} style={{ color: "rgba(255,255,255,0.72)", fontSize: 12, fontWeight: "800" }}>
                  {accountLabel}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close account"
                onPress={onClose}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 19,
                  backgroundColor: "rgba(255, 255, 255, 0.14)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={19} color="#ffffff" strokeWidth={2.7} />
              </Pressable>
            </View>
          </View>

          <View style={{ padding: 14, gap: 12 }}>
            {!isSupabaseConfigured ? (
              <AccountNotice text="Supabase is not configured. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY." />
            ) : null}

            {user ? (
              <>
                <AccountNotice text="Purchases, credit balances, and saved sets sync through Supabase." />
                <PrimaryButton label={syncing ? "Syncing..." : "Sync account"} disabled={syncing} onPress={onSyncProgress} />
                <SecondaryButton label="Sign out" disabled={busy} onPress={signOut} />
              </>
            ) : (
              <>
                <TextInput
                  nativeID="cardmagic-login-username"
                  accessibilityLabel="Email"
                  value={email}
                  onChangeText={setEmail}
                  autoComplete="username"
                  autoCapitalize="none"
                  autoCorrect={false}
                  importantForAutofill="yes"
                  inputMode="email"
                  keyboardType="email-address"
                  placeholder="email@example.com"
                  placeholderTextColor="#9aa1ad"
                  textContentType="username"
                  style={inputStyle}
                />
                <TextInput
                  nativeID="cardmagic-login-password"
                  accessibilityLabel="Password"
                  value={password}
                  onChangeText={setPassword}
                  autoComplete="current-password"
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  importantForAutofill="yes"
                  placeholder="Password"
                  placeholderTextColor="#9aa1ad"
                  textContentType="password"
                  style={inputStyle}
                />
                <View style={{ flexDirection: width < 380 ? "column" : "row", gap: 9 }}>
                  <PrimaryButton
                    label="Sign in"
                    disabled={busy || !isSupabaseConfigured}
                    onPress={() => void runAuthAction("sign-in")}
                  />
                  <SecondaryButton
                    label="Create account"
                    disabled={busy || !isSupabaseConfigured}
                    onPress={() => void runAuthAction("sign-up")}
                  />
                </View>
              </>
            )}

            {busy ? <ActivityIndicator color="#0b7180" /> : null}
            {message ? <Text style={{ color: "#5f6570", fontSize: 12, fontWeight: "800" }}>{message}</Text> : null}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const inputStyle = {
  minHeight: 46,
  borderRadius: 12,
  borderCurve: "continuous" as const,
  borderWidth: 1,
  borderColor: "#d8dbe2",
  backgroundColor: "#ffffff",
  paddingHorizontal: 12,
  color: "#151820",
  fontSize: 14,
  fontWeight: "700" as const,
};

function AccountNotice({ text }: { text: string }) {
  return (
    <View style={{ borderRadius: 12, borderCurve: "continuous", backgroundColor: "#eef8fb", padding: 12 }}>
      <Text style={{ color: "#33515b", fontSize: 12, lineHeight: 17, fontWeight: "800" }}>{text}</Text>
    </View>
  );
}

function PrimaryButton({ label, disabled, onPress }: { label: string; disabled?: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={{
        flex: 1,
        minHeight: 46,
        borderRadius: 23,
        borderCurve: "continuous",
        backgroundColor: disabled ? "#9aa1ad" : "#111820",
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 16,
      }}
    >
      <Text selectable={false} numberOfLines={1} style={{ color: "#ffffff", fontSize: 13, fontWeight: "900" }}>
        {label}
      </Text>
    </Pressable>
  );
}

function SecondaryButton({ label, disabled, onPress }: { label: string; disabled?: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={{
        flex: 1,
        minHeight: 46,
        borderRadius: 23,
        borderCurve: "continuous",
        borderWidth: 1,
        borderColor: "#d8dbe2",
        backgroundColor: disabled ? "#eef0f4" : "#ffffff",
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 16,
      }}
    >
      <Text selectable={false} numberOfLines={1} style={{ color: "#151820", fontSize: 13, fontWeight: "900" }}>
        {label}
      </Text>
    </Pressable>
  );
}
