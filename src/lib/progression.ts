export type CreditSpendCategory = "artImage" | "artImageHigh" | "subjectMask" | "setIcon" | "rulesText";

export type ProgressEventType =
  | "upload-art"
  | "generate-art"
  | "upload-set-icon"
  | "fix-rules-text"
  | "save-card"
  | "create-set"
  | "export-card"
  | "export-set";

export type UserProgressCounters = {
  uploadedImages: number;
  generatedImages: number;
  uploadedSetIcons: number;
  fixedRulesTexts: number;
  savedCards: number;
  createdSets: number;
  exportedCards: number;
  exportedSets: number;
};

export type UserProgressProfile = {
  schemaVersion: 1;
  credits: number;
  lifetimeCreditsPurchased: number;
  lifetimeLevelCreditsEarned: number;
  highestRewardedLevel: number;
  lifetimeXpEarned: number;
  subscribedMonthly: boolean;
  completedAchievementIds: string[];
  counters: UserProgressCounters;
};

export type AchievementCounterKey = keyof UserProgressCounters;

export type AchievementDefinition = {
  id: string;
  family: string;
  tier: number;
  title: string;
  description: string;
  counter: AchievementCounterKey;
  target: number;
  xpReward: number;
};

export type XpLevelState = {
  level: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  progressRatio: number;
};

export type CreditPackId = "spark" | "forge" | "vault";

export type CreditPack = {
  id: CreditPackId;
  label: string;
  credits: number;
  priceLabel: string;
  bonusXp: number;
};

export type ProgressMutationResult = {
  profile: UserProgressProfile;
  unlockedAchievements: AchievementDefinition[];
};

export const CREDIT_SPEND_COSTS: Record<CreditSpendCategory, number> = {
  artImage: 10,
  artImageHigh: 12,
  subjectMask: 4,
  setIcon: 4,
  rulesText: 0,
};

export const CREDIT_SPEND_RULES: Array<{
  category: CreditSpendCategory;
  label: string;
  detail: string;
  cost: number;
}> = [
  {
    category: "artImage",
    label: "AI card art - Medium",
    detail: "Generated image",
    cost: CREDIT_SPEND_COSTS.artImage,
  },
  {
    category: "artImageHigh",
    label: "AI card art - High",
    detail: "Higher-detail image",
    cost: CREDIT_SPEND_COSTS.artImageHigh,
  },
  {
    category: "subjectMask",
    label: "Subject mask",
    detail: "Over-border segmentation",
    cost: CREDIT_SPEND_COSTS.subjectMask,
  },
  {
    category: "setIcon",
    label: "Set icon",
    detail: "Custom symbol slot",
    cost: CREDIT_SPEND_COSTS.setIcon,
  },
  {
    category: "rulesText",
    label: "Rules text",
    detail: "AI templating pass",
    cost: CREDIT_SPEND_COSTS.rulesText,
  },
];

export const CREDIT_PACKS: CreditPack[] = [
  { id: "spark", label: "Spark Pack", credits: 100, priceLabel: "$4.99", bonusXp: 30 },
  { id: "forge", label: "Forge Pack", credits: 300, priceLabel: "$12.99", bonusXp: 110 },
  { id: "vault", label: "Vault Pack", credits: 750, priceLabel: "$24.99", bonusXp: 320 },
];

export const MONTHLY_SUBSCRIPTION_PRODUCT = {
  credits: 450,
  priceLabel: "$9.99/mo",
  bonusXp: 220,
};

const DEFAULT_STARTING_CREDITS = 100;
const XP_PER_SPENT_CREDIT = 2;
const CREDITS_PER_LEVEL_REWARD = 10;

const DEFAULT_COUNTERS: UserProgressCounters = {
  uploadedImages: 0,
  generatedImages: 0,
  uploadedSetIcons: 0,
  fixedRulesTexts: 0,
  savedCards: 0,
  createdSets: 0,
  exportedCards: 0,
  exportedSets: 0,
};

const PROGRESS_EVENT_COUNTERS: Record<ProgressEventType, AchievementCounterKey> = {
  "upload-art": "uploadedImages",
  "generate-art": "generatedImages",
  "upload-set-icon": "uploadedSetIcons",
  "fix-rules-text": "fixedRulesTexts",
  "save-card": "savedCards",
  "create-set": "createdSets",
  "export-card": "exportedCards",
  "export-set": "exportedSets",
};

export const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  {
    id: "upload-art-1",
    family: "upload-art",
    tier: 1,
    title: "First image uploaded",
    description: "Upload 1 card-art image.",
    counter: "uploadedImages",
    target: 1,
    xpReward: 40,
  },
  {
    id: "upload-art-10",
    family: "upload-art",
    tier: 2,
    title: "Image curator",
    description: "Upload 10 card-art images.",
    counter: "uploadedImages",
    target: 10,
    xpReward: 120,
  },
  {
    id: "upload-art-50",
    family: "upload-art",
    tier: 3,
    title: "Art archive",
    description: "Upload 50 card-art images.",
    counter: "uploadedImages",
    target: 50,
    xpReward: 420,
  },
  {
    id: "generate-art-1",
    family: "generate-art",
    tier: 1,
    title: "First generated image",
    description: "Generate 1 AI card-art image.",
    counter: "generatedImages",
    target: 1,
    xpReward: 70,
  },
  {
    id: "generate-art-10",
    family: "generate-art",
    tier: 2,
    title: "Prompt apprentice",
    description: "Generate 10 AI card-art images.",
    counter: "generatedImages",
    target: 10,
    xpReward: 180,
  },
  {
    id: "generate-art-30",
    family: "generate-art",
    tier: 3,
    title: "Prompt architect",
    description: "Generate 30 AI card-art images.",
    counter: "generatedImages",
    target: 30,
    xpReward: 520,
  },
  {
    id: "set-icon-1",
    family: "set-icon",
    tier: 1,
    title: "First set icon",
    description: "Add 1 custom set icon.",
    counter: "uploadedSetIcons",
    target: 1,
    xpReward: 35,
  },
  {
    id: "set-icon-5",
    family: "set-icon",
    tier: 2,
    title: "Iconographer",
    description: "Add 5 custom set icons.",
    counter: "uploadedSetIcons",
    target: 5,
    xpReward: 110,
  },
  {
    id: "set-icon-20",
    family: "set-icon",
    tier: 3,
    title: "Symbol master",
    description: "Add 20 custom set icons.",
    counter: "uploadedSetIcons",
    target: 20,
    xpReward: 360,
  },
  {
    id: "rules-text-1",
    family: "rules-text",
    tier: 1,
    title: "First templated rules",
    description: "Run 1 AI rules-text pass.",
    counter: "fixedRulesTexts",
    target: 1,
    xpReward: 45,
  },
  {
    id: "rules-text-10",
    family: "rules-text",
    tier: 2,
    title: "Rules editor",
    description: "Run 10 AI rules-text passes.",
    counter: "fixedRulesTexts",
    target: 10,
    xpReward: 140,
  },
  {
    id: "rules-text-40",
    family: "rules-text",
    tier: 3,
    title: "Template specialist",
    description: "Run 40 AI rules-text passes.",
    counter: "fixedRulesTexts",
    target: 40,
    xpReward: 460,
  },
  {
    id: "save-card-1",
    family: "save-card",
    tier: 1,
    title: "First saved card",
    description: "Save 1 card to a set.",
    counter: "savedCards",
    target: 1,
    xpReward: 35,
  },
  {
    id: "save-card-10",
    family: "save-card",
    tier: 2,
    title: "Set builder",
    description: "Save 10 cards to sets.",
    counter: "savedCards",
    target: 10,
    xpReward: 120,
  },
  {
    id: "save-card-50",
    family: "save-card",
    tier: 3,
    title: "Collection architect",
    description: "Save 50 cards to sets.",
    counter: "savedCards",
    target: 50,
    xpReward: 430,
  },
  {
    id: "create-set-1",
    family: "create-set",
    tier: 1,
    title: "First custom set",
    description: "Create 1 set shell.",
    counter: "createdSets",
    target: 1,
    xpReward: 50,
  },
  {
    id: "create-set-5",
    family: "create-set",
    tier: 2,
    title: "World builder",
    description: "Create 5 set shells.",
    counter: "createdSets",
    target: 5,
    xpReward: 180,
  },
  {
    id: "export-card-1",
    family: "export-card",
    tier: 1,
    title: "First card export",
    description: "Export 1 card.",
    counter: "exportedCards",
    target: 1,
    xpReward: 45,
  },
  {
    id: "export-card-10",
    family: "export-card",
    tier: 2,
    title: "Showcase loop",
    description: "Export 10 cards.",
    counter: "exportedCards",
    target: 10,
    xpReward: 160,
  },
  {
    id: "export-set-1",
    family: "export-set",
    tier: 1,
    title: "First set export",
    description: "Export 1 set.",
    counter: "exportedSets",
    target: 1,
    xpReward: 80,
  },
  {
    id: "export-set-5",
    family: "export-set",
    tier: 2,
    title: "Release manager",
    description: "Export 5 sets.",
    counter: "exportedSets",
    target: 5,
    xpReward: 220,
  },
];

export function createDefaultUserProgress(): UserProgressProfile {
  return {
    schemaVersion: 1,
    credits: DEFAULT_STARTING_CREDITS,
    lifetimeCreditsPurchased: DEFAULT_STARTING_CREDITS,
    lifetimeLevelCreditsEarned: 0,
    highestRewardedLevel: 1,
    lifetimeXpEarned: 0,
    subscribedMonthly: false,
    completedAchievementIds: [],
    counters: { ...DEFAULT_COUNTERS },
  };
}

export function normalizeUserProgressProfile(value: unknown): UserProgressProfile {
  if (!isRecord(value)) {
    return createDefaultUserProgress();
  }

  const defaults = createDefaultUserProgress();
  const candidate: Record<string, unknown> = value.schemaVersion === 1 ? value : {};
  const normalized: UserProgressProfile = {
    schemaVersion: 1,
    credits: normalizeFiniteNumber(candidate.credits, defaults.credits),
    lifetimeCreditsPurchased: normalizeFiniteNumber(
      candidate.lifetimeCreditsPurchased,
      defaults.lifetimeCreditsPurchased,
    ),
    lifetimeXpEarned: normalizeFiniteNumber(candidate.lifetimeXpEarned, defaults.lifetimeXpEarned),
    lifetimeLevelCreditsEarned: normalizeFiniteNumber(
      candidate.lifetimeLevelCreditsEarned,
      defaults.lifetimeLevelCreditsEarned,
    ),
    highestRewardedLevel: normalizeFiniteNumber(
      candidate.highestRewardedLevel,
      getXpLevelState({ ...defaults, lifetimeXpEarned: normalizeFiniteNumber(candidate.lifetimeXpEarned, 0) }).level,
    ),
    subscribedMonthly: typeof candidate.subscribedMonthly === "boolean" ? candidate.subscribedMonthly : false,
    completedAchievementIds: normalizeStringArray(candidate.completedAchievementIds),
    counters: normalizeUserProgressCounters(candidate.counters),
  };

  return reconcileAchievementUnlocks(normalized).profile;
}

export function getXpLevelState(profile: UserProgressProfile): XpLevelState {
  let level = 1;
  let xpIntoLevel = Math.max(0, Math.floor(profile.lifetimeXpEarned));
  let xpForNextLevel = getXpRequirementForLevel(level);

  while (xpIntoLevel >= xpForNextLevel) {
    xpIntoLevel -= xpForNextLevel;
    level += 1;
    xpForNextLevel = getXpRequirementForLevel(level);
  }

  return {
    level,
    xpIntoLevel,
    xpForNextLevel,
    progressRatio: xpForNextLevel > 0 ? xpIntoLevel / xpForNextLevel : 1,
  };
}

export function canSpendCredits(profile: UserProgressProfile, category: CreditSpendCategory) {
  const cost = CREDIT_SPEND_COSTS[category];

  return {
    ok: profile.credits >= cost,
    cost,
    shortfall: Math.max(0, cost - profile.credits),
  };
}

export function spendProgressCredits(
  profile: UserProgressProfile,
  category: CreditSpendCategory,
): ProgressMutationResult & { ok: boolean; cost: number } {
  const cost = CREDIT_SPEND_COSTS[category];

  if (profile.credits < cost) {
    return {
      ok: false,
      cost,
      profile,
      unlockedAchievements: [],
    };
  }

  return {
    ok: true,
    cost,
    ...reconcileAchievementUnlocks({
      ...profile,
      credits: profile.credits - cost,
      lifetimeXpEarned: profile.lifetimeXpEarned + cost * XP_PER_SPENT_CREDIT,
    }),
  };
}

export function applyProgressEvent(
  profile: UserProgressProfile,
  eventType: ProgressEventType,
): ProgressMutationResult {
  const counterKey = PROGRESS_EVENT_COUNTERS[eventType];

  return reconcileAchievementUnlocks({
    ...profile,
    counters: {
      ...profile.counters,
      [counterKey]: profile.counters[counterKey] + 1,
    },
  });
}

export function buyCreditPack(profile: UserProgressProfile, packId: CreditPackId): ProgressMutationResult {
  const pack = CREDIT_PACKS.find((candidate) => candidate.id === packId);

  if (!pack) {
    return { profile, unlockedAchievements: [] };
  }

  return reconcileAchievementUnlocks({
    ...profile,
    credits: profile.credits + pack.credits,
    lifetimeCreditsPurchased: profile.lifetimeCreditsPurchased + pack.credits,
    lifetimeXpEarned: profile.lifetimeXpEarned + pack.bonusXp,
  });
}

export function subscribeMonthly(profile: UserProgressProfile): ProgressMutationResult {
  if (profile.subscribedMonthly) {
    return { profile, unlockedAchievements: [] };
  }

  return reconcileAchievementUnlocks({
    ...profile,
    credits: profile.credits + MONTHLY_SUBSCRIPTION_PRODUCT.credits,
    lifetimeCreditsPurchased: profile.lifetimeCreditsPurchased + MONTHLY_SUBSCRIPTION_PRODUCT.credits,
    lifetimeXpEarned: profile.lifetimeXpEarned + MONTHLY_SUBSCRIPTION_PRODUCT.bonusXp,
    subscribedMonthly: true,
  });
}

export function grantPromotionalCredits(
  profile: UserProgressProfile,
  credits: number,
): ProgressMutationResult {
  const creditAmount = Math.max(0, Math.floor(credits));

  if (creditAmount <= 0) {
    return { profile, unlockedAchievements: [] };
  }

  return reconcileAchievementUnlocks({
    ...profile,
    credits: profile.credits + creditAmount,
    lifetimeCreditsPurchased: profile.lifetimeCreditsPurchased + creditAmount,
  });
}

export function getVisibleAchievementMilestones(profile: UserProgressProfile): AchievementDefinition[] {
  const completedIds = new Set(profile.completedAchievementIds);
  const familyOrder: string[] = [];
  const byFamily = new Map<string, AchievementDefinition[]>();

  for (const achievement of ACHIEVEMENT_DEFINITIONS) {
    if (!byFamily.has(achievement.family)) {
      byFamily.set(achievement.family, []);
      familyOrder.push(achievement.family);
    }

    byFamily.get(achievement.family)?.push(achievement);
  }

  return familyOrder.flatMap((family) => {
    const familyAchievements = byFamily.get(family) ?? [];
    const nextAchievement = familyAchievements.find((achievement) => !completedIds.has(achievement.id));
    const visibleAchievement = nextAchievement ?? familyAchievements[familyAchievements.length - 1];

    return visibleAchievement ? [visibleAchievement] : [];
  });
}

export function getAchievementProgress(profile: UserProgressProfile, achievement: AchievementDefinition) {
  const current = profile.counters[achievement.counter];
  const completed = profile.completedAchievementIds.includes(achievement.id);

  return {
    current,
    completed,
    progressRatio: achievement.target > 0 ? Math.min(1, current / achievement.target) : 1,
  };
}

function reconcileAchievementUnlocks(profile: UserProgressProfile): ProgressMutationResult {
  const completedIds = new Set(profile.completedAchievementIds);
  const unlockedAchievements: AchievementDefinition[] = [];
  let earnedXp = 0;

  for (const achievement of ACHIEVEMENT_DEFINITIONS) {
    if (completedIds.has(achievement.id)) {
      continue;
    }

    if (profile.counters[achievement.counter] < achievement.target) {
      continue;
    }

    completedIds.add(achievement.id);
    unlockedAchievements.push(achievement);
    earnedXp += achievement.xpReward;
  }

  if (unlockedAchievements.length === 0) {
    return {
      profile: applyLevelCreditRewards(profile),
      unlockedAchievements,
    };
  }

  return {
    profile: applyLevelCreditRewards({
      ...profile,
      lifetimeXpEarned: profile.lifetimeXpEarned + earnedXp,
      completedAchievementIds: Array.from(completedIds),
    }),
    unlockedAchievements,
  };
}

function applyLevelCreditRewards(profile: UserProgressProfile): UserProgressProfile {
  const levelState = getXpLevelState(profile);
  const earnedLevels = Math.max(0, levelState.level - profile.highestRewardedLevel);

  if (earnedLevels <= 0) {
    return profile;
  }

  const earnedCredits = earnedLevels * CREDITS_PER_LEVEL_REWARD;

  return {
    ...profile,
    credits: profile.credits + earnedCredits,
    lifetimeCreditsPurchased: profile.lifetimeCreditsPurchased + earnedCredits,
    lifetimeLevelCreditsEarned: profile.lifetimeLevelCreditsEarned + earnedCredits,
    highestRewardedLevel: levelState.level,
  };
}

function getXpRequirementForLevel(level: number) {
  return 240 + Math.max(0, level - 1) * 65;
}

function normalizeUserProgressCounters(value: unknown): UserProgressCounters {
  if (!isRecord(value)) {
    return { ...DEFAULT_COUNTERS };
  }

  return {
    uploadedImages: normalizeFiniteNumber(value.uploadedImages, 0),
    generatedImages: normalizeFiniteNumber(value.generatedImages, 0),
    uploadedSetIcons: normalizeFiniteNumber(value.uploadedSetIcons, 0),
    fixedRulesTexts: normalizeFiniteNumber(value.fixedRulesTexts, 0),
    savedCards: normalizeFiniteNumber(value.savedCards, 0),
    createdSets: normalizeFiniteNumber(value.createdSets, 0),
    exportedCards: normalizeFiniteNumber(value.exportedCards, 0),
    exportedSets: normalizeFiniteNumber(value.exportedSets, 0),
  };
}

function normalizeFiniteNumber(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : fallback;
}

function normalizeStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((entry): entry is string => typeof entry === "string");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}
