import { Bell, BookOpen, Check, ChevronDown, KeyRound, RefreshCw, Save, Sparkles, User, UserPlus, X } from "lucide-react-native";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Modal, Platform, Pressable, ScrollView, Text, TextInput, useWindowDimensions, View } from "react-native";
import type { TextInputProps } from "react-native";
import type { User as SupabaseUser } from "@supabase/supabase-js";

import {
  type AccountProfile,
  changeAccountPassword,
  deleteAccount,
  fetchAccountProfile,
  sendAccountPasswordResetEmail,
  setAccountPasswordFromRecovery,
  updateAccountUsername,
} from "@/lib/account-profile";
import type { CommunityNotificationPayload } from "@/lib/account-sets";
import { authRedirectUrl, isSupabaseConfigured, supabase } from "@/lib/supabase";

type AccountModalProps = {
  visible: boolean;
  user: SupabaseUser | null;
  passwordRecoveryMode?: boolean;
  onClose: () => void;
  onAuthSuccess: () => void;
  onPasswordRecoveryComplete?: () => void;
  onProfileChange?: (profile: AccountProfile) => void;
  notifications?: CommunityNotificationPayload[];
  notificationsLoading?: boolean;
  notificationsError?: string | null;
  onRefreshNotifications?: () => void;
  onMarkNotificationsRead?: (notificationIds: string[]) => void;
  showCreatorTools: boolean;
  onChangeShowCreatorTools: (visible: boolean) => void;
};

type AuthMode = "sign-in" | "sign-up";

type BrowserCredentialInputProps = Partial<TextInputProps> & {
  id?: string;
  name?: string;
};

function getBrowserCredentialInputProps({
  id,
  name,
  autoComplete,
}: {
  id: string;
  name: string;
  autoComplete: NonNullable<TextInputProps["autoComplete"]>;
}): BrowserCredentialInputProps {
  if (Platform.OS !== "web") {
    return {};
  }

  return {
    id,
    name,
    autoComplete,
  };
}

export function AccountModal({
  visible,
  user,
  passwordRecoveryMode = false,
  onClose,
  onAuthSuccess,
  onPasswordRecoveryComplete,
  onProfileChange,
  notifications = [],
  notificationsLoading = false,
  notificationsError = null,
  onRefreshNotifications,
  onMarkNotificationsRead,
  showCreatorTools,
  onChangeShowCreatorTools,
}: AccountModalProps) {
  const { width, height } = useWindowDimensions();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMode, setAuthMode] = useState<AuthMode>("sign-in");
  const [username, setUsername] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [recoveryPassword, setRecoveryPassword] = useState("");
  const [recoveryPasswordConfirm, setRecoveryPasswordConfirm] = useState("");
  const [passwordPanelOpen, setPasswordPanelOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const accountLabel = useMemo(() => user?.email ?? "Not signed in", [user?.email]);
  const unreadNotificationIds = useMemo(
    () => notifications.filter((notification) => !notification.readAt).map((notification) => notification.id),
    [notifications],
  );
  const panelMaxHeight = Math.max(360, Math.min(720, height - 28));
  const isSignUpMode = authMode === "sign-up";
  const authEmailAutocomplete = isSignUpMode ? "email" : "username";
  const authPasswordAutocomplete = isSignUpMode ? "new-password" : "current-password";
  const authPasswordTextContentType = isSignUpMode ? "newPassword" : "password";

  useEffect(() => {
    let active = true;

    if (!visible || !user) {
      setUsername("");
      setCurrentPassword("");
      setNewPassword("");
      setRecoveryPassword("");
      setRecoveryPasswordConfirm("");
      setPasswordPanelOpen(false);
      if (!visible) {
        setAuthMode("sign-in");
      }
      return () => {
        active = false;
      };
    }

    void fetchAccountProfile(user.id)
      .then((profile) => {
        if (active) {
          setUsername(profile.username ?? profile.displayName ?? user.email?.split("@")[0] ?? "");
        }
      })
      .catch((error) => {
        if (active) {
          setMessage(error instanceof Error ? error.message : "Unable to load account profile.");
        }
      });

    return () => {
      active = false;
    };
  }, [user, visible]);

  useEffect(() => {
    if (visible && passwordRecoveryMode) {
      setPasswordPanelOpen(false);
      setCurrentPassword("");
      setNewPassword("");
      setMessage("Enter a new password for your account.");
    }
  }, [passwordRecoveryMode, visible]);

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
      let error: Error | null = null;

      if (action === "sign-in") {
        const result = await supabase.auth.signInWithPassword({ email: trimmedEmail, password });
        error = result.error;
      } else {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          setMessage(sessionError.message);
          return;
        }

        if (sessionData.session?.user && "is_anonymous" in sessionData.session.user && sessionData.session.user.is_anonymous) {
          const result = await supabase.auth.updateUser(
            { email: trimmedEmail, password },
            { emailRedirectTo: authRedirectUrl },
          );
          error = result.error;
        } else {
          const result = await supabase.auth.signUp({
            email: trimmedEmail,
            password,
            options: {
              emailRedirectTo: authRedirectUrl,
            },
          });
          error = result.error;
        }
      }

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

  const saveUsername = async () => {
    setBusy(true);
    setMessage(null);

    try {
      const profile = await updateAccountUsername(username);
      setUsername(profile.username ?? "");
      setMessage("Username updated.");
      onProfileChange?.(profile);
      onAuthSuccess();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to update username.");
    } finally {
      setBusy(false);
    }
  };

  const savePassword = async () => {
    setBusy(true);
    setMessage(null);

    try {
      await changeAccountPassword(user?.email ?? "", currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setPasswordPanelOpen(false);
      setMessage("Password updated.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to update password.");
    } finally {
      setBusy(false);
    }
  };

  const saveRecoveryPassword = async () => {
    setBusy(true);
    setMessage(null);

    try {
      if (recoveryPassword.length < 6) {
        setMessage("Password must be at least 6 characters.");
        return;
      }

      if (recoveryPassword !== recoveryPasswordConfirm) {
        setMessage("Passwords do not match.");
        return;
      }

      await setAccountPasswordFromRecovery(recoveryPassword);
      setRecoveryPassword("");
      setRecoveryPasswordConfirm("");
      setMessage("Password updated.");
      onPasswordRecoveryComplete?.();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to update password.");
    } finally {
      setBusy(false);
    }
  };

  const sendPasswordResetEmail = async () => {
    setBusy(true);
    setMessage(null);

    try {
      await sendAccountPasswordResetEmail(user?.email ?? email);
      setMessage("Password reset email sent.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to send password reset email.");
    } finally {
      setBusy(false);
    }
  };

  const confirmDeleteAccount = () => {
    const runDelete = async () => {
      setBusy(true);
      setMessage(null);

      try {
        await deleteAccount();
        setMessage("Account deleted.");
        onAuthSuccess();
        onClose();
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Unable to delete account.");
      } finally {
        setBusy(false);
      }
    };

    if (Platform.OS === "web" && typeof window !== "undefined") {
      if (window.confirm("Delete this account and all account-owned CardMagic data? This cannot be undone.")) {
        void runDelete();
      }
      return;
    }

    Alert.alert(
      "Delete account?",
      "This deletes your CardMagic account and account-owned Supabase data. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => void runDelete() },
      ],
    );
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
            maxHeight: panelMaxHeight,
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

          <ScrollView
            keyboardShouldPersistTaps="handled"
            style={{ maxHeight: Math.max(260, panelMaxHeight - 86) }}
            contentContainerStyle={{ padding: 14, gap: 12 }}
          >
            {!isSupabaseConfigured ? (
              <AccountNotice text="Supabase is not configured. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY." />
            ) : null}

            {user ? (
              <>
                {passwordRecoveryMode ? (
                  <View
                    style={{
                      borderRadius: 12,
                      borderCurve: "continuous",
                      borderWidth: 1,
                      borderColor: "#b8d7df",
                      backgroundColor: "#ffffff",
                      padding: 10,
                      gap: 8,
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <KeyRound size={18} color="#0b7180" strokeWidth={2.6} />
                      <Text selectable={false} style={{ color: "#151820", fontSize: 14, fontWeight: "900" }}>
                        Reset password
                      </Text>
                    </View>
                    <TextInput
                      accessibilityLabel="New password"
                      value={recoveryPassword}
                      onChangeText={setRecoveryPassword}
                      autoComplete="new-password"
                      secureTextEntry
                      autoCapitalize="none"
                      autoCorrect={false}
                      importantForAutofill="yes"
                      placeholder="New password"
                      placeholderTextColor="#9aa1ad"
                      textContentType="newPassword"
                      style={inputStyle}
                    />
                    <TextInput
                      accessibilityLabel="Confirm new password"
                      value={recoveryPasswordConfirm}
                      onChangeText={setRecoveryPasswordConfirm}
                      autoComplete="new-password"
                      secureTextEntry
                      autoCapitalize="none"
                      autoCorrect={false}
                      importantForAutofill="yes"
                      placeholder="Confirm new password"
                      placeholderTextColor="#9aa1ad"
                      textContentType="newPassword"
                      style={inputStyle}
                    />
                    <PrimaryButton
                      label="Update password"
                      disabled={busy || recoveryPassword.length < 6 || recoveryPasswordConfirm.length < 6}
                      onPress={() => void saveRecoveryPassword()}
                    />
                  </View>
                ) : (
                  <>
                    <AccountNotificationsSection
                      notifications={notifications}
                      loading={notificationsLoading}
                      error={notificationsError}
                      unreadNotificationIds={unreadNotificationIds}
                      onRefresh={onRefreshNotifications}
                      onMarkRead={onMarkNotificationsRead}
                    />
                    <ToggleRow
                      title="Creator tools"
                      detail="AI generation, credit balance, and XP surfaces"
                      value={showCreatorTools}
                      onChange={onChangeShowCreatorTools}
                    />
                    <View style={{ gap: 8 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <TextInput
                          accessibilityLabel="Username"
                          value={username}
                          onChangeText={(value) =>
                            setUsername(
                              value
                                .normalize("NFKD")
                                .replace(/[\u0300-\u036f]/g, "")
                                .replace(/[^A-Za-z0-9_]/g, "")
                                .slice(0, 24),
                            )
                          }
                          autoComplete="username"
                          autoCapitalize="none"
                          autoCorrect={false}
                          importantForAutofill="no"
                          placeholder="Username"
                          placeholderTextColor="#9aa1ad"
                          textContentType="nickname"
                          style={{ ...inputStyle, flex: 1 }}
                        />
                        <IconButton
                          accessibilityLabel="Save username"
                          disabled={busy || username.trim().length < 3}
                          onPress={() => void saveUsername()}
                          icon={<Save size={18} color={busy || username.trim().length < 3 ? "#9aa1ad" : "#ffffff"} strokeWidth={2.7} />}
                        />
                      </View>
                    </View>
                    <View
                      style={{
                        borderRadius: 12,
                        borderCurve: "continuous",
                        borderWidth: 1,
                        borderColor: "#d8dbe2",
                        backgroundColor: "#ffffff",
                        overflow: "hidden",
                      }}
                    >
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={passwordPanelOpen ? "Collapse password change" : "Change password"}
                        accessibilityState={{ expanded: passwordPanelOpen }}
                        onPress={() => setPasswordPanelOpen((current) => !current)}
                        style={{
                          minHeight: 48,
                          paddingHorizontal: 12,
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 9,
                        }}
                      >
                        <KeyRound size={18} color="#151820" strokeWidth={2.6} />
                        <Text selectable={false} style={{ flex: 1, color: "#151820", fontSize: 13, fontWeight: "900" }}>
                          Change password
                        </Text>
                        <ChevronDown
                          size={18}
                          color="#68707d"
                          strokeWidth={2.6}
                          style={{ transform: [{ rotate: passwordPanelOpen ? "180deg" : "0deg" }] }}
                        />
                      </Pressable>
                      {passwordPanelOpen ? (
                        <View style={{ borderTopWidth: 1, borderTopColor: "#eceef2", padding: 10, gap: 8 }}>
                          <TextInput
                            accessibilityLabel="Current password"
                            value={currentPassword}
                            onChangeText={setCurrentPassword}
                            autoComplete="current-password"
                            secureTextEntry
                            autoCapitalize="none"
                            autoCorrect={false}
                            importantForAutofill="yes"
                            placeholder="Current password"
                            placeholderTextColor="#9aa1ad"
                            textContentType="password"
                            style={inputStyle}
                          />
                          <TextInput
                            accessibilityLabel="New password"
                            value={newPassword}
                            onChangeText={setNewPassword}
                            autoComplete="new-password"
                            secureTextEntry
                            autoCapitalize="none"
                            autoCorrect={false}
                            importantForAutofill="yes"
                            placeholder="New password"
                            placeholderTextColor="#9aa1ad"
                            textContentType="newPassword"
                            style={inputStyle}
                          />
                          <View style={{ flexDirection: width < 380 ? "column" : "row", gap: 8 }}>
                            <PrimaryButton
                              label="Update"
                              disabled={busy || currentPassword.length === 0 || newPassword.length < 6}
                              onPress={() => void savePassword()}
                            />
                            <SecondaryButton
                              label="Email reset"
                              disabled={busy}
                              onPress={() => void sendPasswordResetEmail()}
                            />
                          </View>
                        </View>
                      ) : null}
                    </View>
                    <View style={{ flexDirection: width < 380 ? "column" : "row", gap: 9 }}>
                      <SecondaryButton label="Sign out" disabled={busy} onPress={signOut} />
                      <DangerButton label="Delete account" disabled={busy} onPress={confirmDeleteAccount} />
                    </View>
                  </>
                )}
              </>
            ) : (
              <>
                <TextInput
                  nativeID="cardmagic-login-username"
                  accessibilityLabel="Email"
                  value={email}
                  onChangeText={setEmail}
                  autoComplete={authEmailAutocomplete}
                  autoCapitalize="none"
                  autoCorrect={false}
                  importantForAutofill="yes"
                  inputMode="email"
                  keyboardType="email-address"
                  placeholder="email@example.com"
                  placeholderTextColor="#9aa1ad"
                  textContentType={isSignUpMode ? "emailAddress" : "username"}
                  style={inputStyle}
                  {...getBrowserCredentialInputProps({
                    id: "cardmagic-login-username",
                    name: isSignUpMode ? "email" : "username",
                    autoComplete: authEmailAutocomplete,
                  })}
                />
                <TextInput
                  nativeID="cardmagic-login-password"
                  accessibilityLabel="Password"
                  value={password}
                  onChangeText={setPassword}
                  autoComplete={authPasswordAutocomplete}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  importantForAutofill="yes"
                  placeholder={isSignUpMode ? "Create password" : "Password"}
                  placeholderTextColor="#9aa1ad"
                  textContentType={authPasswordTextContentType}
                  style={inputStyle}
                  {...getBrowserCredentialInputProps({
                    id: "cardmagic-login-password",
                    name: "password",
                    autoComplete: authPasswordAutocomplete,
                  })}
                />
                <View style={{ flexDirection: width < 380 ? "column" : "row", gap: 9 }}>
                  <PrimaryButton
                    label={isSignUpMode ? "Create account" : "Sign in"}
                    disabled={busy || !isSupabaseConfigured}
                    onPress={() => void runAuthAction(authMode)}
                  />
                  <SecondaryButton
                    label={isSignUpMode ? "Back to sign in" : "Create account"}
                    disabled={busy || !isSupabaseConfigured}
                    onPress={() => {
                      setMessage(null);
                      setAuthMode(isSignUpMode ? "sign-in" : "sign-up");
                    }}
                  />
                </View>
                {!isSignUpMode ? (
                  <SecondaryButton
                    label="Email password reset"
                    disabled={busy || !isSupabaseConfigured}
                    onPress={() => void sendPasswordResetEmail()}
                  />
                ) : null}
              </>
            )}

            {busy ? <ActivityIndicator color="#0b7180" /> : null}
            {message ? <Text style={{ color: "#5f6570", fontSize: 12, fontWeight: "800" }}>{message}</Text> : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function AccountNotificationsSection({
  notifications,
  loading,
  error,
  unreadNotificationIds,
  onRefresh,
  onMarkRead,
}: {
  notifications: CommunityNotificationPayload[];
  loading: boolean;
  error: string | null;
  unreadNotificationIds: string[];
  onRefresh?: () => void;
  onMarkRead?: (notificationIds: string[]) => void;
}) {
  const unreadCount = unreadNotificationIds.length;

  return (
    <View
      style={{
        borderRadius: 12,
        borderCurve: "continuous",
        borderWidth: 1,
        borderColor: "#d8dbe2",
        backgroundColor: "#ffffff",
        overflow: "hidden",
      }}
    >
      <View
        style={{
          minHeight: 44,
          paddingHorizontal: 12,
          paddingVertical: 9,
          borderBottomWidth: 1,
          borderBottomColor: "#eceef2",
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
        }}
      >
        <Bell size={17} color="#151820" strokeWidth={2.5} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text selectable={false} numberOfLines={1} style={{ color: "#151820", fontSize: 14, fontWeight: "900" }}>
            Notifications
          </Text>
          <Text selectable={false} numberOfLines={1} style={{ color: "#68707d", fontSize: 11, fontWeight: "800" }}>
            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Refresh notifications"
          disabled={loading || !onRefresh}
          onPress={onRefresh}
          style={{
            width: 34,
            height: 34,
            borderRadius: 17,
            borderWidth: 1,
            borderColor: "#d8dbe2",
            backgroundColor: loading ? "#eef1f5" : "#ffffff",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {loading ? <ActivityIndicator color="#0b7180" size="small" /> : <RefreshCw size={15} color="#151820" strokeWidth={2.5} />}
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Mark notifications read"
          disabled={unreadCount === 0 || !onMarkRead}
          onPress={() => onMarkRead?.(unreadNotificationIds)}
          style={{
            width: 34,
            height: 34,
            borderRadius: 17,
            borderWidth: 1,
            borderColor: unreadCount > 0 ? "#b8d7df" : "#d8dbe2",
            backgroundColor: unreadCount > 0 ? "#eef8fb" : "#f4f5f7",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Check size={15} color={unreadCount > 0 ? "#0b7180" : "#9aa1ad"} strokeWidth={2.7} />
        </Pressable>
      </View>

      <View style={{ padding: 10, gap: 8 }}>
        {error ? (
          <Text selectable style={{ color: "#a62231", fontSize: 12, lineHeight: 17, fontWeight: "800" }}>
            {error}
          </Text>
        ) : null}
        {notifications.length > 0 ? (
          notifications.map((notification) => (
            <AccountNotificationRow key={notification.id} notification={notification} />
          ))
        ) : null}
      </View>
    </View>
  );
}

function AccountNotificationRow({ notification }: { notification: CommunityNotificationPayload }) {
  const unread = !notification.readAt;
  const title =
    notification.kind === "set_followed"
      ? `${notification.actorName} followed ${notification.setName}`
      : notification.kind === "collaboration_set_joined"
        ? `${notification.actorName} joined ${notification.setName}`
      : `${notification.cardName ?? "A card"} was added to ${notification.setName}`;
  const detail =
    notification.kind === "set_followed"
      ? "A viewer subscribed to one of your community sets."
      : notification.kind === "collaboration_set_joined"
        ? "A collaborator accepted your set invite link."
      : `${notification.actorName} updated a set you follow.`;

  return (
    <View
      style={{
        borderRadius: 10,
        borderCurve: "continuous",
        borderWidth: 1,
        borderColor: unread ? "#b8d7df" : "#eceef2",
        backgroundColor: unread ? "#f2fbfd" : "#fbfcfe",
        padding: 10,
        flexDirection: "row",
        gap: 9,
      }}
    >
      <View
        style={{
          width: 30,
          height: 30,
          borderRadius: 15,
          backgroundColor: unread ? "#0b7180" : "#eef1f5",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {notification.kind === "set_followed" || notification.kind === "collaboration_set_joined" ? (
          <UserPlus size={15} color={unread ? "#ffffff" : "#68707d"} strokeWidth={2.5} />
        ) : (
          <BookOpen size={15} color={unread ? "#ffffff" : "#68707d"} strokeWidth={2.5} />
        )}
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Text selectable={false} numberOfLines={2} style={{ color: "#151820", fontSize: 12, lineHeight: 16, fontWeight: "900" }}>
          {title}
        </Text>
        <Text selectable={false} numberOfLines={2} style={{ color: "#68707d", fontSize: 11, lineHeight: 15, fontWeight: "800" }}>
          {detail}
        </Text>
        <Text selectable={false} numberOfLines={1} style={{ color: "#8a93a3", fontSize: 10, fontWeight: "900", textTransform: "uppercase" }}>
          {formatNotificationDate(notification.createdAt)}
        </Text>
      </View>
    </View>
  );
}

function formatNotificationDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
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

function ToggleRow({
  title,
  detail,
  value,
  onChange,
}: {
  title: string;
  detail: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={title}
      accessibilityHint={detail}
      accessibilityState={{ checked: value }}
      onPress={() => onChange(!value)}
      style={{
        minHeight: 58,
        borderRadius: 12,
        borderCurve: "continuous",
        borderWidth: 1,
        borderColor: value ? "#b8d7df" : "#d8dbe2",
        backgroundColor: value ? "#eef8fb" : "#ffffff",
        paddingHorizontal: 12,
        paddingVertical: 10,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
      }}
    >
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: 17,
          backgroundColor: value ? "#0b7180" : "#eef1f5",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Sparkles size={16} color={value ? "#ffffff" : "#68707d"} strokeWidth={2.7} />
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Text selectable={false} numberOfLines={1} style={{ color: "#151820", fontSize: 13, fontWeight: "900" }}>
          {title}
        </Text>
        <Text selectable={false} numberOfLines={2} style={{ color: "#68707d", fontSize: 11, lineHeight: 15, fontWeight: "800" }}>
          {detail}
        </Text>
      </View>
      <View
        style={{
          width: 44,
          height: 26,
          borderRadius: 13,
          backgroundColor: value ? "#0b7180" : "#d8dbe2",
          padding: 3,
          alignItems: value ? "flex-end" : "flex-start",
        }}
      >
        <View
          style={{
            width: 20,
            height: 20,
            borderRadius: 10,
            backgroundColor: "#ffffff",
          }}
        />
      </View>
    </Pressable>
  );
}

function IconButton({
  accessibilityLabel,
  disabled,
  onPress,
  icon,
}: {
  accessibilityLabel: string;
  disabled?: boolean;
  onPress: () => void;
  icon: ReactNode;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      onPress={onPress}
      style={{
        width: 46,
        height: 46,
        borderRadius: 23,
        borderCurve: "continuous",
        backgroundColor: disabled ? "#eef0f4" : "#111820",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {icon}
    </Pressable>
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

function DangerButton({ label, disabled, onPress }: { label: string; disabled?: boolean; onPress: () => void }) {
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
        borderColor: disabled ? "#e1c6c6" : "#b4232d",
        backgroundColor: disabled ? "#f4eeee" : "#fff1f1",
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 16,
      }}
    >
      <Text selectable={false} numberOfLines={1} style={{ color: disabled ? "#9f7777" : "#8e1d1d", fontSize: 13, fontWeight: "900" }}>
        {label}
      </Text>
    </Pressable>
  );
}
