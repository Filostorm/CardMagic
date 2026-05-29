import { LinearGradient } from "expo-linear-gradient";
import {
  BookOpen,
  CheckCircle2,
  Crown,
  Download,
  Flame,
  Gem,
  Hammer,
  ImagePlus,
  Palette,
  Save,
  Sparkles,
  Trophy,
  Upload,
  X,
  Zap,
} from "lucide-react-native";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  ActivityIndicator,
  type DimensionValue,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";

import {
  CREDIT_PACKS,
  CREDIT_SPEND_RULES,
  type CreditPack,
  getAchievementProgress,
  getVisibleAchievementMilestones,
  getXpLevelState,
  MONTHLY_SUBSCRIPTION_PRODUCT,
  type AchievementDefinition,
  type AchievementCounterKey,
  type CreditPackId,
  type UserProgressProfile,
} from "@/lib/progression";

const CARDMAGIC_TERMS_URL = "https://cardmagic.craftsmannsoftware.com/terms/";
const CARDMAGIC_EULA_URL = "https://cardmagic.craftsmannsoftware.com/eula/";

export type XpFloatingNumber = {
  id: string;
  xp: number;
  color: string;
  offsetPercent: number;
  skewDeg: number;
};

export type LevelUpToastItem = {
  id: string;
  level: number;
  creditReward: number;
};

export function ProgressionHud({
  profile,
  maxWidth,
  onOpenStore,
  onOpenAchievements,
}: {
  profile: UserProgressProfile;
  maxWidth: number;
  onOpenStore: () => void;
  onOpenAchievements: () => void;
}) {
  const levelState = useMemo(() => getXpLevelState(profile), [profile]);
  const progressPercent = `${Math.max(2, Math.round(levelState.progressRatio * 100))}%`;

  return (
    <View
      style={{
        width: "100%",
        maxWidth,
        flexDirection: "row",
        alignItems: "center",
        gap: 9,
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open credit store"
        onPress={onOpenStore}
        style={({ pressed }) => ({
          width: 96,
          minHeight: 42,
          borderRadius: 21,
          borderCurve: "continuous",
          borderWidth: 1,
          borderColor: pressed ? "#111820" : "rgba(17, 22, 31, 0.12)",
          backgroundColor: pressed ? "#eef8fb" : "#ffffff",
          paddingHorizontal: 11,
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
          gap: 6,
        })}
      >
        <Zap size={17} color="#0b7180" strokeWidth={2.7} />
        <Text
          selectable={false}
          numberOfLines={1}
          adjustsFontSizeToFit
          style={{
            color: "#111820",
            fontSize: 15,
            fontWeight: "900",
            fontVariant: ["tabular-nums"],
          }}
        >
          {profile.credits}
        </Text>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Show achievements. Level ${levelState.level}, ${levelState.xpIntoLevel} of ${levelState.xpForNextLevel} XP`}
        onPress={onOpenAchievements}
        style={({ pressed }) => ({
          flex: 1,
          minHeight: 42,
          borderRadius: 21,
          borderCurve: "continuous",
          backgroundColor: pressed ? "rgba(23, 32, 48, 0.12)" : "transparent",
          justifyContent: "center",
          gap: 5,
        })}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
          <Zap size={15} color="#0b7180" strokeWidth={2.7} />
          <Text
            selectable={false}
            numberOfLines={1}
            style={{ color: "#151820", fontSize: 12, fontWeight: "900" }}
          >
            Level {levelState.level}
          </Text>
          <View style={{ flex: 1 }} />
          <Text
            selectable={false}
            numberOfLines={1}
            style={{
              color: "#66707c",
              fontSize: 11,
              fontWeight: "800",
              fontVariant: ["tabular-nums"],
            }}
          >
            {levelState.xpIntoLevel}/{levelState.xpForNextLevel} XP
          </Text>
        </View>
        <View
          style={{
            height: 9,
            borderRadius: 999,
            overflow: "hidden",
            backgroundColor: "rgba(21, 24, 32, 0.13)",
          }}
        >
          <LinearGradient
            colors={["#4bd4f0", "#f0c86a"]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={{ width: progressPercent as DimensionValue, height: "100%" }}
          />
        </View>
      </Pressable>
    </View>
  );
}

export function AchievementCompletionPopups({
  popups,
  onDismiss,
  onOpenAchievements,
}: {
  popups: Array<AchievementDefinition & { popupId: string }>;
  onDismiss: (popupId: string) => void;
  onOpenAchievements: () => void;
}) {
  const { width } = useWindowDimensions();

  if (popups.length === 0) {
    return null;
  }

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        top: 52,
        left: 0,
        right: 0,
        zIndex: 180,
        alignItems: "center",
        paddingHorizontal: 14,
        gap: 8,
      }}
    >
      {popups.slice(-3).map((popup) => (
        <Pressable
          key={popup.popupId}
          accessibilityRole="button"
          accessibilityLabel={`Achievement complete: ${popup.title}`}
          onPress={onOpenAchievements}
          style={({ pressed }) => ({
            width: "100%",
            maxWidth: Math.min(520, width - 24),
            minHeight: 64,
            borderRadius: 18,
            borderCurve: "continuous",
            overflow: "hidden",
            opacity: pressed ? 0.92 : 1,
            shadowColor: "#000000",
            shadowOpacity: 0.22,
            shadowRadius: 22,
            shadowOffset: { width: 0, height: 12 },
            elevation: 18,
          })}
        >
          <LinearGradient
            colors={["#111820", "#183b48", "#0b7180"]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: "rgba(255, 255, 255, 0.18)",
              paddingVertical: 10,
              paddingLeft: 12,
              paddingRight: 8,
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: "rgba(255, 255, 255, 0.14)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Trophy size={21} color="#f7d879" strokeWidth={2.8} />
            </View>
            <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
              <Text
                selectable={false}
                numberOfLines={1}
                style={{ color: "rgba(255,255,255,0.72)", fontSize: 10.5, fontWeight: "900", textTransform: "uppercase" }}
              >
                Achievement complete
              </Text>
              <Text selectable={false} numberOfLines={1} style={{ color: "#ffffff", fontSize: 15, fontWeight: "900" }}>
                {popup.title}
              </Text>
              <Text selectable={false} numberOfLines={1} style={{ color: "rgba(255,255,255,0.68)", fontSize: 11, fontWeight: "800" }}>
                Tier {popup.tier} - Target {popup.target}
              </Text>
            </View>
            <View style={{ alignItems: "flex-end", gap: 6 }}>
              <View
                style={{
                  minWidth: 64,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: "rgba(255, 255, 255, 0.16)",
                  alignItems: "center",
                  justifyContent: "center",
                  paddingHorizontal: 9,
                }}
              >
                <Text selectable={false} numberOfLines={1} style={{ color: "#ffe08a", fontSize: 12, fontWeight: "900" }}>
                  +{popup.xpReward} XP
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Dismiss achievement popup"
                onPress={(event) => {
                  event.stopPropagation();
                  onDismiss(popup.popupId);
                }}
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 13,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={16} color="rgba(255,255,255,0.72)" strokeWidth={2.8} />
              </Pressable>
            </View>
          </LinearGradient>
        </Pressable>
      ))}
    </View>
  );
}

export function XpFloatingNumbers({
  numbers,
  onComplete,
}: {
  numbers: XpFloatingNumber[];
  onComplete: (id: string) => void;
}) {
  if (numbers.length === 0) {
    return null;
  }

  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        top: -28,
        left: 96,
        right: 0,
        height: 54,
        zIndex: 40,
      }}
    >
      {numbers.map((number) => (
        <XpFloatingNumberChip
          key={number.id}
          number={number}
          onComplete={onComplete}
        />
      ))}
    </View>
  );
}

function XpFloatingNumberChip({
  number,
  onComplete,
}: {
  number: XpFloatingNumber;
  onComplete: (id: string) => void;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(10)).current;
  const scale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 120,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 860,
          delay: 360,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(translateY, {
        toValue: -34,
        duration: 1340,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.08,
          duration: 160,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 280,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => onComplete(number.id));
  }, [number.id, onComplete, opacity, scale, translateY]);

  return (
    <Animated.View
      style={{
        position: "absolute",
        left: `${number.offsetPercent}%`,
        opacity,
        transform: [
          { translateY },
          { skewX: `${number.skewDeg}deg` },
          { rotate: `${number.skewDeg * 0.42}deg` },
          { scale },
        ],
      }}
    >
      <Text
        selectable={false}
        style={{
          color: number.color,
          fontSize: 19,
          fontWeight: "900",
          fontVariant: ["tabular-nums"],
          textShadowColor: "rgba(255, 255, 255, 0.86)",
          textShadowRadius: 6,
          textShadowOffset: { width: 0, height: 1 },
        }}
      >
        +{number.xp} XP
      </Text>
    </Animated.View>
  );
}

export function LevelUpToasts({
  toasts,
  onDismiss,
}: {
  toasts: LevelUpToastItem[];
  onDismiss: (id: string) => void;
}) {
  const { width } = useWindowDimensions();

  if (toasts.length === 0) {
    return null;
  }

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        top: 126,
        left: 0,
        right: 0,
        zIndex: 175,
        alignItems: "center",
        paddingHorizontal: 14,
        gap: 8,
      }}
    >
      {toasts.slice(-2).map((toast) => (
        <LevelUpToast
          key={toast.id}
          toast={toast}
          maxWidth={Math.min(460, width - 24)}
          onDismiss={onDismiss}
        />
      ))}
    </View>
  );
}

function LevelUpToast({
  toast,
  maxWidth,
  onDismiss,
}: {
  toast: LevelUpToastItem;
  maxWidth: number;
  onDismiss: (id: string) => void;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 280,
          delay: 2900,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: -8,
          duration: 280,
          delay: 2900,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => onDismiss(toast.id));
  }, [onDismiss, opacity, toast.id, translateY]);

  return (
    <Animated.View
      style={{
        width: "100%",
        maxWidth,
        opacity,
        transform: [{ translateY }],
      }}
    >
      <LinearGradient
        colors={["#151820", "#3f326f", "#0b7180"]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={{
          minHeight: 58,
          borderRadius: 18,
          borderCurve: "continuous",
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.2)",
          paddingHorizontal: 13,
          paddingVertical: 10,
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          boxShadow: "0 16px 30px rgba(0, 0, 0, 0.22)",
        }}
      >
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: "rgba(255,255,255,0.16)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Zap size={19} color="#ffe08a" strokeWidth={2.8} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text selectable={false} numberOfLines={1} style={{ color: "#ffffff", fontSize: 16, fontWeight: "900" }}>
            Level {toast.level} reached
          </Text>
          <Text selectable={false} numberOfLines={1} style={{ color: "rgba(255,255,255,0.72)", fontSize: 11, fontWeight: "800" }}>
            +{toast.creditReward} reward credits added
          </Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

export function AchievementsModal({
  visible,
  profile,
  onClose,
}: {
  visible: boolean;
  profile: UserProgressProfile;
  onClose: () => void;
}) {
  const { width, height } = useWindowDimensions();
  const levelState = useMemo(() => getXpLevelState(profile), [profile]);
  const visibleAchievements = useMemo(() => getVisibleAchievementMilestones(profile), [profile]);

  if (!visible) {
    return null;
  }

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
            maxWidth: Math.min(560, width - 20),
            maxHeight: Math.max(420, height * 0.86),
            borderRadius: 22,
            borderCurve: "continuous",
            overflow: "hidden",
            backgroundColor: "#f7f8fb",
            borderWidth: 1,
            borderColor: "rgba(255, 255, 255, 0.62)",
            boxShadow: "0 18px 40px rgba(0, 0, 0, 0.28)",
          }}
        >
          <LinearGradient
            colors={["#111820", "#204253", "#0b7180"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ padding: 18, gap: 14 }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <View style={{ flex: 1, gap: 4 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Trophy size={19} color="#f7d879" strokeWidth={2.6} />
                  <Text selectable={false} style={{ color: "#ffffff", fontSize: 22, fontWeight: "900" }}>
                    Achievements
                  </Text>
                </View>
                <Text selectable={false} style={{ color: "rgba(255,255,255,0.74)", fontSize: 12, fontWeight: "800" }}>
                  Level {levelState.level} - +10 credits when each new level is reached
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close achievements"
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
          </LinearGradient>
          <ScrollView showsVerticalScrollIndicator contentContainerStyle={{ padding: 14, gap: 8 }}>
            {visibleAchievements.map((achievement) => {
              const progress = getAchievementProgress(profile, achievement);

              return (
                <AchievementRow
                  key={achievement.id}
                  title={achievement.title}
                  description={achievement.description}
                  counter={achievement.counter}
                  current={progress.current}
                  target={achievement.target}
                  tier={achievement.tier}
                  xpReward={achievement.xpReward}
                  completed={progress.completed}
                  progressRatio={progress.progressRatio}
                />
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export function CreditStoreModal({
  visible,
  profile,
  onClose,
  onBuyCreditPack,
  onSubscribeMonthly,
  onRedeemCreditCode,
  canRedeemCreditCode,
  onRequireAccount,
  checkoutBusyProductId,
  checkoutErrorMessage,
}: {
  visible: boolean;
  profile: UserProgressProfile;
  onClose: () => void;
  onBuyCreditPack: (packId: CreditPackId) => void;
  onSubscribeMonthly: () => void;
  onRedeemCreditCode: (code: string) => Promise<{ ok: boolean; message: string; credits?: number }>;
  canRedeemCreditCode: boolean;
  onRequireAccount: () => void;
  checkoutBusyProductId?: CreditPackId | "monthly" | null;
  checkoutErrorMessage?: string | null;
}) {
  const { width, height } = useWindowDimensions();
  const [creditCode, setCreditCode] = useState("");
  const [creditCodeBusy, setCreditCodeBusy] = useState(false);
  const [creditCodeMessage, setCreditCodeMessage] = useState<{ ok: boolean; message: string } | null>(null);
  const levelState = useMemo(() => getXpLevelState(profile), [profile]);
  const modalMaxHeight = Math.max(420, height * 0.88);

  const redeemCreditCode = async () => {
    if (creditCodeBusy) {
      return;
    }

    if (!canRedeemCreditCode) {
      onRequireAccount();
      return;
    }

    setCreditCodeBusy(true);
    setCreditCodeMessage(null);

    try {
      const result = await onRedeemCreditCode(creditCode);
      setCreditCodeMessage({ ok: result.ok, message: result.message });

      if (result.ok) {
        setCreditCode("");
      }
    } catch (error) {
      setCreditCodeMessage({
        ok: false,
        message: error instanceof Error ? error.message : "Unable to redeem that code.",
      });
    } finally {
      setCreditCodeBusy(false);
    }
  };

  if (!visible) {
    return null;
  }

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
            maxWidth: Math.min(560, width - 20),
            maxHeight: modalMaxHeight,
            borderRadius: 24,
            borderCurve: "continuous",
            overflow: "hidden",
            backgroundColor: "#f7f8fb",
            borderWidth: 1,
            borderColor: "rgba(255, 255, 255, 0.62)",
            shadowColor: "#000000",
            shadowOpacity: 0.26,
            shadowRadius: 28,
            shadowOffset: { width: 0, height: 18 },
            elevation: 20,
          }}
        >
          <LinearGradient
            colors={["#111820", "#243c61", "#0b7180"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              padding: 18,
              gap: 16,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
              <View style={{ flex: 1, gap: 5 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Sparkles size={19} color="#f7d879" strokeWidth={2.5} />
                  <Text selectable={false} style={{ color: "#ffffff", fontSize: 22, fontWeight: "900" }}>
                    Credits Store
                  </Text>
                </View>
                <Text
                  selectable={false}
                  style={{ color: "rgba(255, 255, 255, 0.72)", fontSize: 12, lineHeight: 17, fontWeight: "800" }}
                >
                  Level {levelState.level} progression
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close credit store"
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
          </LinearGradient>

          <ScrollView
            showsVerticalScrollIndicator
            contentContainerStyle={{
              padding: 14,
              gap: 14,
            }}
          >
            <View
              style={{
                borderRadius: 14,
                borderCurve: "continuous",
                backgroundColor: "#ffffff",
                borderWidth: 1,
                borderColor: "#d9dde5",
                padding: 12,
                gap: 7,
              }}
            >
              <Text
                selectable={false}
                style={{ color: "#4b5563", fontSize: 10.5, lineHeight: 16, fontWeight: "800" }}
              >
                Credits, subscriptions, and generated assets are digital-only content. Purchases are non-refundable.
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                <Text selectable={false} style={{ color: "#66707c", fontSize: 10.5, fontWeight: "800" }}>
                  By purchasing, you agree to
                </Text>
                <LegalLink label="Terms of Service" url={CARDMAGIC_TERMS_URL} />
                <Text selectable={false} style={{ color: "#9aa3af", fontSize: 10, fontWeight: "900" }}>
                  -
                </Text>
                <LegalLink label="EULA" url={CARDMAGIC_EULA_URL} />
              </View>
            </View>

            <View style={{ gap: 9 }}>
              <SectionLabel title="Credit Code" />
              <View
                style={{
                  borderRadius: 14,
                  borderCurve: "continuous",
                  borderWidth: 1,
                  borderColor: "#d9dde5",
                  backgroundColor: "#ffffff",
                  padding: 13,
                  gap: 10,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <View
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 17,
                      backgroundColor: "#fff6da",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Zap size={18} color="#0b7180" strokeWidth={2.7} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text selectable={false} numberOfLines={1} style={{ color: "#111820", fontSize: 14, fontWeight: "900" }}>
                      Redeem Credits
                    </Text>
                    <Text selectable={false} style={{ color: "#66707c", fontSize: 11, lineHeight: 15, fontWeight: "800" }}>
                      {canRedeemCreditCode
                        ? "Enter a promotional code to add credits to your account balance."
                        : "Create an account or sign in to redeem promotional credit codes."}
                    </Text>
                  </View>
                </View>

                <View style={{ flexDirection: canRedeemCreditCode && width >= 420 ? "row" : "column", gap: 8 }}>
                  {canRedeemCreditCode ? (
                    <TextInput
                      accessibilityLabel="Credit code"
                      value={creditCode}
                      onChangeText={(value) => {
                        setCreditCode(value);
                        setCreditCodeMessage(null);
                      }}
                      autoCapitalize="characters"
                      autoCorrect={false}
                      editable={!creditCodeBusy}
                      returnKeyType="done"
                      onSubmitEditing={() => void redeemCreditCode()}
                      style={{
                        flex: 1,
                        minHeight: 46,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: "#d9dde5",
                        backgroundColor: "#f7f8fb",
                        paddingHorizontal: 12,
                        color: "#111820",
                        fontSize: 14,
                        fontWeight: "900",
                        letterSpacing: 0,
                      }}
                    />
                  ) : null}
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={canRedeemCreditCode ? "Redeem credit code" : "Create account to redeem credit code"}
                    disabled={creditCodeBusy}
                    onPress={() => void redeemCreditCode()}
                    style={({ pressed }) => ({
                      minHeight: 46,
                      borderRadius: 23,
                      backgroundColor: pressed ? "#243c61" : "#111820",
                      alignItems: "center",
                      justifyContent: "center",
                      paddingHorizontal: 18,
                      opacity: creditCodeBusy ? 0.72 : 1,
                    })}
                  >
                    {creditCodeBusy ? (
                      <ActivityIndicator color="#ffffff" />
                    ) : (
                      <Text selectable={false} numberOfLines={1} adjustsFontSizeToFit style={{ color: "#ffffff", fontSize: 14, fontWeight: "900" }}>
                        {canRedeemCreditCode ? "Redeem" : "Create account to redeem a code"}
                      </Text>
                    )}
                  </Pressable>
                </View>

                {creditCodeMessage ? (
                  <Text
                    selectable={false}
                    style={{
                      color: creditCodeMessage.ok ? "#177245" : "#b3261e",
                      fontSize: 12,
                      lineHeight: 17,
                      fontWeight: "900",
                    }}
                  >
                    {creditCodeMessage.message}
                  </Text>
                ) : null}
              </View>
            </View>

            <View style={{ gap: 9 }}>
              <SectionLabel title="Credit Packs" />
              {checkoutErrorMessage ? (
                <Text
                  selectable={false}
                  style={{
                    color: "#b3261e",
                    fontSize: 12,
                    lineHeight: 17,
                    fontWeight: "900",
                  }}
                >
                  {checkoutErrorMessage}
                </Text>
              ) : null}
              <View style={{ gap: 10 }}>
                {CREDIT_PACKS.map((pack) => (
                  <CreditPackPurchaseRow
                    key={pack.id}
                    pack={pack}
                    width={width}
                    disabled={Boolean(checkoutBusyProductId)}
                    busy={checkoutBusyProductId === pack.id}
                    dimmed={Boolean(checkoutBusyProductId && checkoutBusyProductId !== pack.id)}
                    onPress={() => onBuyCreditPack(pack.id)}
                  />
                ))}
              </View>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={profile.subscribedMonthly ? "Creator Pass active" : "Subscribe to Creator Pass"}
              disabled={profile.subscribedMonthly || Boolean(checkoutBusyProductId)}
              onPress={onSubscribeMonthly}
              style={{
                minHeight: 96,
                borderRadius: 16,
                borderCurve: "continuous",
                overflow: "hidden",
                opacity: profile.subscribedMonthly || (checkoutBusyProductId && checkoutBusyProductId !== "monthly") ? 0.78 : 1,
              }}
            >
              <LinearGradient
                colors={profile.subscribedMonthly ? ["#1f352d", "#315a48"] : ["#172033", "#5742a3", "#0b7180"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ padding: 15, gap: 10, borderRadius: 16, borderCurve: "continuous" }}
              >
                <View
                  style={{
                    flexDirection: width < 430 ? "column" : "row",
                    alignItems: width < 430 ? "stretch" : "center",
                    gap: width < 430 ? 12 : 14,
                  }}
                >
                  <View style={{ flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", gap: 11 }}>
                    <View
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 19,
                        backgroundColor: "rgba(255, 255, 255, 0.16)",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {profile.subscribedMonthly ? (
                        <CheckCircle2 size={20} color="#baf7d0" strokeWidth={2.7} />
                      ) : (
                        <Crown size={20} color="#ffe08a" strokeWidth={2.7} />
                      )}
                    </View>
                    <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
                      <Text selectable={false} numberOfLines={1} style={{ color: "#ffffff", fontSize: 17, fontWeight: "900" }}>
                        {profile.subscribedMonthly ? "Creator Pass Active" : "Creator Pass"}
                      </Text>
                      <Text
                        selectable={false}
                        numberOfLines={2}
                        style={{ color: "rgba(255,255,255,0.74)", fontSize: 12, lineHeight: 16, fontWeight: "800" }}
                      >
                        Monthly creator credits for art, masks, rules cleanup, and set symbols.
                      </Text>
                    </View>
                  </View>

                  <View
                    style={{
                      minWidth: width < 430 ? "100%" : 158,
                      alignItems: width < 430 ? "stretch" : "flex-end",
                      gap: 8,
                    }}
                  >
                    <View style={{ alignItems: width < 430 ? "flex-start" : "flex-end", gap: 2 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                        <Zap size={22} color="#72e6ff" strokeWidth={2.8} />
                        <Text
                          selectable={false}
                          numberOfLines={1}
                          style={{ color: "#ffffff", fontSize: 25, lineHeight: 29, fontWeight: "900" }}
                        >
                          {MONTHLY_SUBSCRIPTION_PRODUCT.credits} monthly
                        </Text>
                      </View>
                      <Text selectable={false} numberOfLines={1} style={{ color: "rgba(255,255,255,0.76)", fontSize: 11.5, fontWeight: "900" }}>
                        + {MONTHLY_SUBSCRIPTION_PRODUCT.bonusXp} XP
                      </Text>
                    </View>
                    <View
                      style={{
                        minHeight: 38,
                        borderRadius: 19,
                        backgroundColor: profile.subscribedMonthly ? "rgba(186, 247, 208, 0.18)" : "#111820",
                        alignItems: "center",
                        justifyContent: "center",
                        paddingHorizontal: 15,
                        alignSelf: width < 430 ? "stretch" : "flex-end",
                        minWidth: width < 430 ? undefined : 118,
                        flexDirection: "row",
                        gap: 8,
                      }}
                    >
                      {checkoutBusyProductId === "monthly" ? <ActivityIndicator color="#ffffff" /> : null}
                      <Text
                        selectable={false}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        style={{ color: "#ffffff", fontSize: 13.5, fontWeight: "900" }}
                      >
                        {checkoutBusyProductId === "monthly"
                          ? "Opening..."
                          : profile.subscribedMonthly
                            ? "Active"
                            : MONTHLY_SUBSCRIPTION_PRODUCT.priceLabel}
                      </Text>
                    </View>
                  </View>
                </View>
              </LinearGradient>
            </Pressable>

            <View style={{ gap: 9 }}>
              <SectionLabel title="Credit Costs" />
              <View style={{ gap: 8 }}>
                {CREDIT_SPEND_RULES.map((rule) => (
                  <View
                    key={rule.category}
                    style={{
                      minHeight: 50,
                      borderRadius: 12,
                      borderCurve: "continuous",
                      backgroundColor: "#ffffff",
                      borderWidth: 1,
                      borderColor: "#e0e4eb",
                      paddingHorizontal: 12,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <CostIcon category={rule.category} />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text selectable={false} numberOfLines={1} style={{ color: "#111820", fontSize: 13, fontWeight: "900" }}>
                        {rule.label}
                      </Text>
                      <Text selectable={false} numberOfLines={1} style={{ color: "#66707c", fontSize: 11, fontWeight: "800" }}>
                        {rule.detail}
                      </Text>
                    </View>
                    <Text
                      selectable={false}
                      style={{ color: "#111820", fontSize: 15, fontWeight: "900", fontVariant: ["tabular-nums"] }}
                    >
                      {rule.cost}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function LegalLink({ label, url, color = "#0b7180" }: { label: string; url: string; color?: string }) {
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`Open ${label}`}
      onPress={() => void Linking.openURL(url)}
      hitSlop={8}
    >
      <Text selectable={false} style={{ color, fontSize: 11, fontWeight: "900", textDecorationLine: "underline" }}>
        {label}
      </Text>
    </Pressable>
  );
}

function StoreMetric({ label, value, icon }: { label: string; value: number; icon: ReactNode }) {
  return (
    <View
      style={{
        flex: 1,
        minHeight: 58,
        borderRadius: 14,
        borderCurve: "continuous",
        backgroundColor: "rgba(255,255,255,0.12)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.14)",
        padding: 9,
        gap: 5,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
        {icon}
        <Text selectable={false} numberOfLines={1} style={{ color: "rgba(255,255,255,0.76)", fontSize: 10.5, fontWeight: "800" }}>
          {label}
        </Text>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <Zap size={18} color="#72e6ff" strokeWidth={2.8} />
        <Text
          selectable={false}
          numberOfLines={1}
          adjustsFontSizeToFit
          style={{ color: "#ffffff", fontSize: 18, fontWeight: "900", fontVariant: ["tabular-nums"] }}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

function CreditPackPurchaseRow({
  pack,
  width,
  disabled,
  busy,
  dimmed,
  onPress,
}: {
  pack: CreditPack;
  width: number;
  disabled: boolean;
  busy: boolean;
  dimmed: boolean;
  onPress: () => void;
}) {
  const compact = width < 430;
  const presentation = getCreditPackPresentation(pack.id);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Buy ${pack.label}, ${pack.credits} credits`}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: compact ? 138 : 98,
        borderRadius: 16,
        borderCurve: "continuous",
        borderWidth: 1,
        borderColor: pressed ? presentation.accent : presentation.borderColor,
        backgroundColor: pressed ? presentation.pressedBackgroundColor : "#ffffff",
        opacity: dimmed ? 0.58 : 1,
        overflow: "hidden",
        shadowColor: "#111820",
        shadowOpacity: 0.08,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 7 },
        elevation: 2,
      })}
    >
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 5,
          backgroundColor: presentation.accent,
        }}
      />
      <View
        style={{
          padding: 14,
          paddingLeft: 16,
          flexDirection: compact ? "column" : "row",
          alignItems: compact ? "stretch" : "center",
          gap: compact ? 12 : 14,
        }}
      >
        <View style={{ flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", gap: 11 }}>
          <CreditPackIcon packId={pack.id} />
          <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
              <Text selectable={false} numberOfLines={1} style={{ color: "#111820", fontSize: 15.5, fontWeight: "900" }}>
                {pack.label}
              </Text>
            </View>
            <Text selectable={false} numberOfLines={2} style={{ color: "#66707c", fontSize: 11.5, lineHeight: 16, fontWeight: "800" }}>
              Consumable credits for art, masks, rules cleanup, and set symbols.
            </Text>
          </View>
        </View>

        <View
          style={{
            minWidth: compact ? "100%" : 178,
            alignItems: compact ? "stretch" : "flex-end",
            gap: 8,
          }}
        >
          <View style={{ alignItems: compact ? "flex-start" : "flex-end", gap: 2 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
              <Zap size={22} color={presentation.accent} strokeWidth={2.8} />
              <Text selectable={false} numberOfLines={1} style={{ color: "#111820", fontSize: 25, lineHeight: 29, fontWeight: "900" }}>
                {pack.credits}
              </Text>
            </View>
            <Text selectable={false} numberOfLines={1} style={{ color: "#4e5967", fontSize: 11.5, fontWeight: "900" }}>
               + {pack.bonusXp} XP
            </Text>
          </View>
          <View
            style={{
              minHeight: 38,
              borderRadius: 19,
              backgroundColor: busy ? presentation.accentSoft : "#111820",
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: 15,
              alignSelf: compact ? "stretch" : "flex-end",
              minWidth: compact ? undefined : 118,
              flexDirection: "row",
              gap: 8,
            }}
          >
            {busy ? <ActivityIndicator color={presentation.accent} /> : null}
            <Text
              selectable={false}
              numberOfLines={1}
              adjustsFontSizeToFit
              style={{ color: busy ? presentation.accent : "#ffffff", fontSize: 13.5, fontWeight: "900" }}
            >
              {busy ? "Opening..." : `${pack.priceLabel}`}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

function CreditPackIcon({ packId }: { packId: CreditPackId }) {
  const presentation = getCreditPackPresentation(packId);
  const icon = {
    spark: <Flame size={19} color={presentation.accent} strokeWidth={2.7} />,
    forge: <Hammer size={19} color={presentation.accent} strokeWidth={2.7} />,
    vault: <Gem size={19} color={presentation.accent} strokeWidth={2.7} />,
  } satisfies Record<CreditPackId, ReactNode>;

  return (
    <View
      style={{
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: presentation.accentSoft,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {icon[packId]}
    </View>
  );
}

function getCreditPackPresentation(packId: CreditPackId) {
  const presentations = {
    spark: {
      accent: "#c45a17",
      accentSoft: "#fff1dc",
      borderColor: "#f0d8bd",
      pressedBackgroundColor: "#fff7ec",
    },
    forge: {
      accent: "#2764a6",
      accentSoft: "#eaf4ff",
      borderColor: "#c8def5",
      pressedBackgroundColor: "#f1f8ff",
    },
    vault: {
      accent: "#7350c8",
      accentSoft: "#f0ebff",
      borderColor: "#d8cef9",
      pressedBackgroundColor: "#f7f4ff",
    },
  } satisfies Record<CreditPackId, {
    accent: string;
    accentSoft: string;
    borderColor: string;
    pressedBackgroundColor: string;
  }>;

  return presentations[packId];
}

function SectionLabel({ title }: { title: string }) {
  return (
    <Text selectable={false} style={{ color: "#151b24", fontSize: 12, fontWeight: "900", textTransform: "uppercase" }}>
      {title}
    </Text>
  );
}

function CostIcon({ category }: { category: string }) {
  const icon =
    category === "artImage" || category === "artImageHigh" ? (
      <Palette size={17} color="#0b7180" strokeWidth={2.5} />
    ) : category === "setIcon" ? (
      <ImagePlus size={17} color="#6b4fc4" strokeWidth={2.5} />
    ) : (
      <BookOpen size={17} color="#b56d00" strokeWidth={2.5} />
    );

  return (
    <View
      style={{
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: "#f1f4f8",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {icon}
    </View>
  );
}

function AchievementRow({
  title,
  description,
  counter,
  current,
  target,
  tier,
  xpReward,
  completed,
  progressRatio,
}: {
  title: string;
  description: string;
  counter: AchievementCounterKey;
  current: number;
  target: number;
  tier: number;
  xpReward: number;
  completed: boolean;
  progressRatio: number;
}) {
  const progressPercent = `${Math.max(completed ? 100 : 3, Math.round(progressRatio * 100))}%`;

  return (
    <View
      style={{
        minHeight: 82,
        borderRadius: 13,
        borderCurve: "continuous",
        borderWidth: 1,
        borderColor: completed ? "rgba(40, 130, 88, 0.34)" : "#e0e4eb",
        backgroundColor: completed ? "#f0fbf5" : "#ffffff",
        padding: 12,
        gap: 9,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: completed ? "#dff7e9" : "#f1f4f8",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {completed ? <CheckCircle2 size={18} color="#228555" strokeWidth={2.6} /> : getAchievementIcon(counter)}
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text selectable={false} numberOfLines={1} style={{ color: "#111820", fontSize: 14, fontWeight: "900" }}>
            {title}
          </Text>
          <Text selectable={false} numberOfLines={1} style={{ color: "#66707c", fontSize: 11, fontWeight: "800" }}>
            Tier {tier} - {description}
          </Text>
        </View>
        <View style={{ alignItems: "flex-end", gap: 2 }}>
          <Text selectable={false} style={{ color: "#0b7180", fontSize: 12, fontWeight: "900", fontVariant: ["tabular-nums"] }}>
            +{xpReward} XP
          </Text>
          <Text selectable={false} style={{ color: "#66707c", fontSize: 10.5, fontWeight: "800", fontVariant: ["tabular-nums"] }}>
            {Math.min(current, target)}/{target}
          </Text>
        </View>
      </View>
      <View
        style={{
          height: 6,
          borderRadius: 999,
          overflow: "hidden",
          backgroundColor: completed ? "rgba(34, 133, 85, 0.16)" : "#edf0f4",
        }}
      >
        <LinearGradient
          colors={completed ? ["#41c780", "#83e6a9"] : ["#4bd4f0", "#f2c663"]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={{ height: "100%", width: progressPercent as DimensionValue }}
        />
      </View>
    </View>
  );
}

function getAchievementIcon(counter: AchievementCounterKey) {
  switch (counter) {
    case "uploadedImages":
      return <Upload size={18} color="#0b7180" strokeWidth={2.6} />;
    case "generatedImages":
      return <Palette size={18} color="#0b7180" strokeWidth={2.6} />;
    case "uploadedSetIcons":
      return <ImagePlus size={18} color="#6b4fc4" strokeWidth={2.6} />;
    case "fixedRulesTexts":
      return <BookOpen size={18} color="#b56d00" strokeWidth={2.6} />;
    case "savedCards":
      return <Save size={18} color="#344052" strokeWidth={2.6} />;
    case "createdSets":
      return <Trophy size={18} color="#c58b17" strokeWidth={2.6} />;
    case "exportedCards":
      return <Download size={18} color="#344052" strokeWidth={2.6} />;
    case "exportedSets":
      return <Trophy size={18} color="#344052" strokeWidth={2.6} />;
  }
}
