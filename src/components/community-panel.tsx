import { CardPreview } from "@/components/card-preview";
import { getTypeFrameSpec } from "@/data/full-magic-pack";
import { type CommunityCardCommentPayload, type CommunityCardFeedSort, type CommunityCardPagePayload, type CommunityCardPayload, type CommunityFeedbackType, type CommunityPollPayload, type CommunityPollSelectionType, type CommunitySetCardPayload, type CommunitySetPayload, createCommunityPoll, fetchCommunityCardComments, fetchCommunityCards, fetchCommunityFeaturedCard, fetchCommunityPolls, fetchCommunitySetCards, fetchCommunitySets, markCommunityCardsSeen, saveCommunityCardComment, setCommunityPollStatus, submitCommunityFeedback, submitCommunityPollVote, toggleCommunityCardLike, toggleCommunitySetFollow, uploadCommunityFeedbackScreenshot } from "@/lib/account-sets";
import { CARDMAGIC_APP_VERSION } from "@/lib/app-version";
import { formatCompactCommentDate } from "@/lib/format-comment-date";
import { getResizedCommunityImageUrl } from "@/lib/community-image";
import { getEditableCardFace } from "@/lib/dfc";
import { getPreviewTypeFrame } from "@/lib/preview-type-frame";
import { isSupabaseConfigured } from "@/lib/supabase";
import { createUuid } from "@/lib/uuid";
import { type CardSet, type MainScrollBoundaryHandler, type MainScrollWindow, type SetCardSnapshot } from "@/types/app-domain";
import type { CardDraft } from "@/types/card";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { Image as ExpoImage } from "expo-image";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { BookOpen, Bug, ChevronDown, ChevronUp, Database, Download, Eye, Heart, ListPlus, MessageCircle, RefreshCw, Search, SlidersHorizontal, Tags, Upload, Users, X } from "lucide-react-native";
import { type ReactNode, memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ActivityIndicator, Alert, Image, type LayoutChangeEvent, Modal, Platform, Pressable, ScrollView, Text, TextInput, View, useWindowDimensions } from "react-native";

// CardMagic community panel and its sub-components, extracted from App.tsx.
// Self-contained: imports nothing from App.tsx. App-specific helpers with deep
// dependency chains (getSafeSetCardPreviewCard, normalizePickedImage) are passed
// in as props from App.

const CARD_BACK_PREVIEW_ASPECT_RATIO = 375 / 523;
const noopCardPreviewHandler = () => undefined;

type CommunityBrowseMode = "cards" | "sets";
const COMMUNITY_CARD_PAGE_SIZE = 8;
const COMMUNITY_INITIAL_RENDERED_CARD_COUNT = 3;
const COMMUNITY_AUTO_LOAD_MORE_THRESHOLD = 420;
const COMMUNITY_SCROLL_WINDOW_UPDATE_THRESHOLD = 96;
const COMMUNITY_FEED_CARD_ROW_CHROME_HEIGHT = 150;
const COMMUNITY_SET_INITIAL_RENDERED_CARD_COUNT = 4;
const COMMUNITY_SET_RENDERED_CARD_BATCH_SIZE = 4;
const COMMUNITY_FEED_OVERSCAN_PX = 1200;
const COMMUNITY_FEED_ESTIMATED_CARD_ITEM_HEIGHT = 690;

export function CommunityPanel({
  sets,
  accountUser,
  onRegisterMainScrollHandler,
  onExportCardImage,
  getSafeSetCardPreviewCard,
  normalizePickedImage,
}: {
  sets: CardSet[];
  accountUser: SupabaseUser | null;
  onRegisterMainScrollHandler?: (handler: MainScrollBoundaryHandler | null) => void;
  onExportCardImage: (card: CardDraft, cardName: string, footerOwnerName?: string, imageUrl?: string) => Promise<void>;
  getSafeSetCardPreviewCard: (snapshot: SetCardSnapshot, set: CardSet) => CardDraft;
  normalizePickedImage: (
    asset: Pick<ImagePicker.ImagePickerAsset, "uri" | "width" | "height">,
    options: { maxDimension: number; compress: number; format: ImageManipulator.SaveFormat },
  ) => Promise<string>;
}) {
  const [browseMode, setBrowseMode] = useState<CommunityBrowseMode>("cards");
  const [searchText, setSearchText] = useState("");
  const [feedSort, setFeedSort] = useState<CommunityCardFeedSort>("newest");
  const [hideSeenCards, setHideSeenCards] = useState(false);
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [communityCards, setCommunityCards] = useState<CommunityCardPayload[]>([]);
  const [communitySets, setCommunitySets] = useState<CommunitySetPayload[]>([]);
  const [selectedCommunitySetId, setSelectedCommunitySetId] = useState<string | null>(null);
  const [communitySetCardsBySetId, setCommunitySetCardsBySetId] = useState<Record<string, CommunitySetCardPayload[]>>({});
  const [communitySetCardsLoadingId, setCommunitySetCardsLoadingId] = useState<string | null>(null);
  const [communitySetCardsErrorBySetId, setCommunitySetCardsErrorBySetId] = useState<Record<string, string>>({});
  const [visibleCommunitySetCardCountsBySetId, setVisibleCommunitySetCardCountsBySetId] = useState<Record<string, number>>({});
  const [featuredCard, setFeaturedCard] = useState<CommunityCardPayload | null>(null);
  const [communityBusy, setCommunityBusy] = useState(false);
  const [communitySetsLoaded, setCommunitySetsLoaded] = useState(false);
  const [communityLoadingMore, setCommunityLoadingMore] = useState(false);
  const [communityHasMoreCards, setCommunityHasMoreCards] = useState(false);
  const [communityNextOffset, setCommunityNextOffset] = useState(0);
  const [communityError, setCommunityError] = useState<string | null>(null);
  const [commentPopoverCard, setCommentPopoverCard] = useState<CommunityCardPayload | null>(null);
  const [pollsPopoverOpen, setPollsPopoverOpen] = useState(false);
  const [feedbackPopoverOpen, setFeedbackPopoverOpen] = useState(false);
  const [communityScrollWindow, setCommunityScrollWindow] = useState<MainScrollWindow | null>(null);
  const communityCardsRef = useRef<CommunityCardPayload[]>([]);
  const communitySetsRef = useRef<CommunitySetPayload[]>([]);
  const featuredCardRef = useRef<CommunityCardPayload | null>(null);
  const communityAutoLoadInFlightRef = useRef(false);
  const communitySeenMarkIdsRef = useRef<Set<string>>(new Set());
  const communityScrollWindowRef = useRef<MainScrollWindow | null>(null);
  const canManageCommunityPolls = accountUser?.email?.toLowerCase() === "gtjoe51@gmail.com";
  const localCards = useMemo(
    () =>
      sets.flatMap((set) =>
        set.cards.slice(0, 6).map((snapshot) => ({
          id: snapshot.id,
          setName: set.name,
          card: getSafeSetCardPreviewCard(snapshot, set),
        })),
      ),
    [sets],
  );
  const normalizedSearchText = searchText.trim().toLowerCase();
  const filteredCommunityCards = useMemo(() => {
    if (!normalizedSearchText) {
      return communityCards;
    }

    return communityCards.filter((entry) => {
      const haystack = `${entry.name} ${entry.typeLine} ${entry.rarity ?? ""} ${entry.frameTreatment ?? ""}`.toLowerCase();
      return haystack.includes(normalizedSearchText);
    });
  }, [communityCards, normalizedSearchText]);
  const filteredSets = useMemo(() => {
    if (!normalizedSearchText) {
      return communitySets;
    }

    return communitySets.filter((set) => {
      const haystack = `${set.name} ${set.code ?? ""} ${set.authorName}`.toLowerCase();
      return haystack.includes(normalizedSearchText);
    });
  }, [communitySets, normalizedSearchText]);
  const loadCommunityCards = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setCommunityError("Supabase is not configured.");
      return;
    }

    setCommunityBusy(true);
    setCommunityLoadingMore(false);
    setCommunityError(null);

    try {
      const page = await fetchCommunityCards(COMMUNITY_CARD_PAGE_SIZE, 0, { sort: feedSort, hideSeen: hideSeenCards });
      setCommunityCards(page.cards);
      setCommunityHasMoreCards(page.hasMore);
      setCommunityNextOffset(page.nextOffset);

      void fetchCommunityFeaturedCard()
        .then(setFeaturedCard)
        .catch((error) => {
          console.warn("Unable to load weekly featured card.", error);
        });
    } catch (error) {
      setCommunityError(error instanceof Error ? error.message : "Unable to load community cards.");
    } finally {
      setCommunityBusy(false);
    }
  }, [feedSort, hideSeenCards]);

  const loadCommunitySets = useCallback(async () => {
    if (!isSupabaseConfigured || communitySetsLoaded) {
      return;
    }

    try {
      const directory = await fetchCommunitySets(24, 0);
      setCommunitySets(directory);
      setCommunitySetsLoaded(true);
    } catch (error) {
      console.warn("Unable to load community sets.", error);
    }
  }, [communitySetsLoaded]);

  const loadMoreCommunityCards = useCallback(async () => {
    if (communityBusy || communityLoadingMore || !communityHasMoreCards) {
      return;
    }

    setCommunityLoadingMore(true);
    setCommunityError(null);

    try {
      const page: CommunityCardPagePayload = await fetchCommunityCards(
        COMMUNITY_CARD_PAGE_SIZE,
        communityNextOffset,
        { sort: feedSort, hideSeen: hideSeenCards },
      );
      setCommunityCards((current) => {
        const existingIds = new Set(current.map((entry) => entry.id));
        const uniqueCards = page.cards.filter((entry) => !existingIds.has(entry.id));
        return [...current, ...uniqueCards];
      });
      setCommunityHasMoreCards(page.hasMore);
      setCommunityNextOffset(page.nextOffset);
    } catch (error) {
      setCommunityError(error instanceof Error ? error.message : "Unable to load more community cards.");
    } finally {
      setCommunityLoadingMore(false);
    }
  }, [communityBusy, communityHasMoreCards, communityLoadingMore, communityNextOffset, feedSort, hideSeenCards]);

  const handleCommunityMainScroll = useCallback<MainScrollBoundaryHandler>((event) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const nextScrollWindow = {
      offsetY: Math.max(0, contentOffset.y),
      viewportHeight: Math.max(1, layoutMeasurement.height),
    };
    const previousScrollWindow = communityScrollWindowRef.current;

    if (
      !previousScrollWindow ||
      Math.abs(previousScrollWindow.offsetY - nextScrollWindow.offsetY) >= COMMUNITY_SCROLL_WINDOW_UPDATE_THRESHOLD ||
      Math.abs(previousScrollWindow.viewportHeight - nextScrollWindow.viewportHeight) >= 24
    ) {
      communityScrollWindowRef.current = nextScrollWindow;
      setCommunityScrollWindow(nextScrollWindow);
    }

    if (
      browseMode !== "cards" ||
      normalizedSearchText ||
      communityBusy ||
      communityLoadingMore ||
      !communityHasMoreCards ||
      communityCards.length === 0
    ) {
      return;
    }

    const distanceFromBottom = contentSize.height - (contentOffset.y + layoutMeasurement.height);

    if (distanceFromBottom > COMMUNITY_AUTO_LOAD_MORE_THRESHOLD || communityAutoLoadInFlightRef.current) {
      return;
    }

    communityAutoLoadInFlightRef.current = true;
    void loadMoreCommunityCards().finally(() => {
      communityAutoLoadInFlightRef.current = false;
    });
  }, [
    browseMode,
    communityBusy,
    communityCards.length,
    communityHasMoreCards,
    communityLoadingMore,
    loadMoreCommunityCards,
    normalizedSearchText,
  ]);

  useEffect(() => {
    onRegisterMainScrollHandler?.(handleCommunityMainScroll);

    return () => {
      onRegisterMainScrollHandler?.(null);
    };
  }, [handleCommunityMainScroll, onRegisterMainScrollHandler]);

  useEffect(() => {
    communityCardsRef.current = communityCards;
  }, [communityCards]);

  useEffect(() => {
    communitySetsRef.current = communitySets;
  }, [communitySets]);

  useEffect(() => {
    featuredCardRef.current = featuredCard;
  }, [featuredCard]);

  const patchCommunityCard = useCallback((cardId: string, patch: Partial<CommunityCardPayload>) => {
    setCommunityCards((current) => current.map((entry) => entry.id === cardId ? { ...entry, ...patch } : entry));
    setFeaturedCard((current) => current?.id === cardId ? { ...current, ...patch } : current);
  }, []);

  const handleToggleCommunityLike = useCallback(async (cardId: string, liked: boolean) => {
    const currentCard =
      communityCardsRef.current.find((entry) => entry.id === cardId) ??
      (featuredCardRef.current?.id === cardId ? featuredCardRef.current : null);

    if (!currentCard) {
      return;
    }

    const nextLikeCount = Math.max(0, currentCard.likeCount + (liked ? 1 : -1));
    patchCommunityCard(cardId, { likedByViewer: liked, likeCount: nextLikeCount });

    try {
      await toggleCommunityCardLike(cardId, liked);
    } catch (error) {
      patchCommunityCard(cardId, {
        likedByViewer: currentCard.likedByViewer,
        likeCount: currentCard.likeCount,
      });
      Alert.alert("Community like unavailable", error instanceof Error ? error.message : "CardMagic could not update the like.");
    }
  }, [patchCommunityCard]);

  const handleToggleCommunitySetFollow = useCallback(async (setId: string, followed: boolean) => {
    const previousSet = communitySetsRef.current.find((entry) => entry.id === setId);

    if (!previousSet) {
      return;
    }

    setCommunitySets((current) => current.map((entry) => (
      entry.id === setId
        ? {
            ...entry,
            followedByViewer: followed,
            followerCount: Math.max(0, entry.followerCount + (followed ? 1 : -1)),
          }
        : entry
    )));

    try {
      await toggleCommunitySetFollow(setId, followed);
    } catch (error) {
      setCommunitySets((current) => current.map((entry) => (
        entry.id === setId
          ? {
              ...entry,
              followedByViewer: previousSet.followedByViewer,
              followerCount: previousSet.followerCount,
            }
          : entry
      )));
      Alert.alert("Set follow unavailable", error instanceof Error ? error.message : "CardMagic could not update this set follow.");
    }
  }, []);

  const openCommunityComments = useCallback((cardId: string) => {
    const currentCard =
      communityCardsRef.current.find((entry) => entry.id === cardId) ??
      (featuredCardRef.current?.id === cardId ? featuredCardRef.current : null);

    if (!currentCard) {
      return;
    }

    setCommentPopoverCard(currentCard);
  }, []);
  const handleCommunityCommentCountChange = useCallback((cardId: string, commentCount: number) => {
    patchCommunityCard(cardId, { commentCount });
  }, [patchCommunityCard]);

  const markVisibleCommunityCardsSeen = useCallback((cardIds: string[]) => {
    if (hideSeenCards || cardIds.length === 0) {
      return;
    }

    const unmarkedIds = Array.from(new Set(cardIds)).filter((cardId) => (
      !communitySeenMarkIdsRef.current.has(cardId)
    ));

    if (unmarkedIds.length === 0) {
      return;
    }

    for (const cardId of unmarkedIds) {
      communitySeenMarkIdsRef.current.add(cardId);
    }

    void markCommunityCardsSeen(unmarkedIds).catch((error) => {
      for (const cardId of unmarkedIds) {
        communitySeenMarkIdsRef.current.delete(cardId);
      }

      console.warn("Unable to mark rendered community cards seen.", error);
    });
  }, [hideSeenCards]);

  const openCommunitySet = useCallback((set: CommunitySetPayload) => {
    const nextSelectedSetId = selectedCommunitySetId === set.id ? null : set.id;
    setSelectedCommunitySetId(nextSelectedSetId);
    setVisibleCommunitySetCardCountsBySetId((current) => ({
      ...current,
      [set.id]: current[set.id] ?? COMMUNITY_SET_INITIAL_RENDERED_CARD_COUNT,
    }));

    if (!nextSelectedSetId || communitySetCardsBySetId[set.id] || communitySetCardsLoadingId === set.id) {
      return;
    }

    setCommunitySetCardsLoadingId(set.id);
    setCommunitySetCardsErrorBySetId((current) => {
      const next = { ...current };
      delete next[set.id];
      return next;
    });

    void fetchCommunitySetCards(set.id)
      .then((cards) => {
        setCommunitySetCardsBySetId((current) => ({
          ...current,
          [set.id]: cards,
        }));
        setVisibleCommunitySetCardCountsBySetId((current) => ({
          ...current,
          [set.id]: current[set.id] ?? COMMUNITY_SET_INITIAL_RENDERED_CARD_COUNT,
        }));
      })
      .catch((error) => {
        setCommunitySetCardsErrorBySetId((current) => ({
          ...current,
          [set.id]: error instanceof Error ? error.message : "Unable to load this set.",
        }));
      })
      .finally(() => {
        setCommunitySetCardsLoadingId((current) => current === set.id ? null : current);
      });
  }, [communitySetCardsBySetId, communitySetCardsLoadingId, selectedCommunitySetId]);

  const showMoreCommunitySetCards = useCallback((setId: string) => {
    setVisibleCommunitySetCardCountsBySetId((current) => ({
      ...current,
      [setId]: (current[setId] ?? COMMUNITY_SET_INITIAL_RENDERED_CARD_COUNT) + COMMUNITY_SET_RENDERED_CARD_BATCH_SIZE,
    }));
  }, []);

  useEffect(() => {
    void loadCommunityCards();
  }, [accountUser?.id, loadCommunityCards]);

  useEffect(() => {
    setCommunitySets([]);
    setCommunitySetsLoaded(false);
    setSelectedCommunitySetId(null);
    setCommunitySetCardsBySetId({});
    setCommunitySetCardsErrorBySetId({});
    setCommunitySetCardsLoadingId(null);
    setVisibleCommunitySetCardCountsBySetId({});
  }, [accountUser?.id]);

  useEffect(() => {
    if (browseMode === "sets") {
      void loadCommunitySets();
    }
  }, [browseMode, loadCommunitySets]);

  return (
    <View style={{ width: "100%", maxWidth: 560, gap: 14 }}>
      <View
        style={{
          gap: 10,
          zIndex: 30,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
          <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
            <Text
              selectable
              numberOfLines={1}
              adjustsFontSizeToFit
              style={{ color: "#101318", fontSize: 32, fontWeight: "900" }}
            >
              Community
            </Text>
            <Text selectable style={{ color: "#606775", fontSize: 14, fontWeight: "700" }}>
              Browse shared cards and sets
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open community polls"
            onPress={() => setPollsPopoverOpen(true)}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              borderWidth: 1,
              borderColor: pollsPopoverOpen ? "#0b7180" : "#d8dbe2",
              backgroundColor: pollsPopoverOpen ? "#151820" : "#ffffff",
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#000000",
              shadowOpacity: 0.08,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: 5 },
            }}
          >
            <ListPlus size={18} color={pollsPopoverOpen ? "#ffffff" : "#151820"} strokeWidth={2.6} />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open community feedback"
            onPress={() => setFeedbackPopoverOpen(true)}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              borderWidth: 1,
              borderColor: feedbackPopoverOpen ? "#0b7180" : "#d8dbe2",
              backgroundColor: feedbackPopoverOpen ? "#151820" : "#ffffff",
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#000000",
              shadowOpacity: 0.08,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: 5 },
            }}
          >
            <MessageCircle size={18} color={feedbackPopoverOpen ? "#ffffff" : "#151820"} strokeWidth={2.6} />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Refresh community feed"
            disabled={communityBusy}
            onPress={() => void loadCommunityCards()}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              borderWidth: 1,
              borderColor: "#d8dbe2",
              backgroundColor: communityBusy ? "#eef1f5" : "#ffffff",
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#000000",
              shadowOpacity: 0.08,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: 5 },
            }}
          >
            {communityBusy ? (
              <ActivityIndicator color="#0b7180" size="small" />
            ) : (
              <RefreshCw size={18} color="#151820" strokeWidth={2.6} />
            )}
          </Pressable>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View
            style={{
              flex: 1,
              minHeight: 44,
              borderRadius: 999,
              borderCurve: "continuous",
              borderWidth: 1,
              borderColor: "#d8dbe2",
              backgroundColor: "#ffffff",
              paddingHorizontal: 12,
              flexDirection: "row",
              alignItems: "center",
              gap: 9,
            }}
          >
            <Search size={17} color="#68707d" strokeWidth={2.4} />
            <TextInput
              accessibilityLabel="Search community cards and sets"
              value={searchText}
              onChangeText={setSearchText}
              placeholder="Search community"
              placeholderTextColor="#68707d"
              autoCapitalize="none"
              autoCorrect={false}
              style={{
                flex: 1,
                minHeight: 42,
                color: "#151820",
                fontSize: 14,
                fontWeight: "800",
                paddingVertical: 0,
              }}
            />
          </View>

          <View style={{ position: "relative" }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open community filter menu"
              accessibilityState={{ expanded: filterMenuOpen }}
              onPress={() => setFilterMenuOpen((current) => !current)}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                borderWidth: 1,
                borderColor: filterMenuOpen || hideSeenCards || feedSort !== "newest" ? "#0b7180" : "#d8dbe2",
                backgroundColor: filterMenuOpen || hideSeenCards || feedSort !== "newest" ? "#151820" : "#ffffff",
                alignItems: "center",
                justifyContent: "center",
                shadowColor: "#000000",
                shadowOpacity: 0.08,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 5 },
              }}
            >
              <SlidersHorizontal
                size={18}
                color={filterMenuOpen || hideSeenCards || feedSort !== "newest" ? "#ffffff" : "#151820"}
                strokeWidth={2.6}
              />
            </Pressable>

            {filterMenuOpen ? (
              <View
                style={{
                  position: "absolute",
                  top: 50,
                  right: 0,
                  width: 220,
                  borderRadius: 14,
                  borderCurve: "continuous",
                  borderWidth: 1,
                  borderColor: "#d8dbe2",
                  backgroundColor: "#ffffff",
                  padding: 8,
                  gap: 6,
                  shadowColor: "#000000",
                  shadowOpacity: 0.16,
                  shadowRadius: 18,
                  shadowOffset: { width: 0, height: 12 },
                  zIndex: 50,
                }}
              >
                <Text selectable={false} style={{ color: "#68707d", fontSize: 11, fontWeight: "900", textTransform: "uppercase", paddingHorizontal: 8, paddingTop: 2 }}>
                  Feed order
                </Text>
                <CommunityMenuOptionButton
                  label="Newest"
                  selected={feedSort === "newest"}
                  onPress={() => {
                    setFeedSort("newest");
                    setFilterMenuOpen(false);
                  }}
                />
                <CommunityMenuOptionButton
                  label="Most liked"
                  selected={feedSort === "most_liked"}
                  onPress={() => {
                    setFeedSort("most_liked");
                    setFilterMenuOpen(false);
                  }}
                />
                <View style={{ height: 1, backgroundColor: "#eceef2", marginVertical: 2 }} />
                <CommunityMenuOptionButton
                  label="Hide seen cards"
                  selected={hideSeenCards}
                  onPress={() => setHideSeenCards((current) => !current)}
                />
              </View>
            ) : null}
          </View>
        </View>
      </View>

      <WeeklyFeaturedCardPreview card={featuredCard} loading={communityBusy} />

      <View style={{ flexDirection: "row", gap: 8 }}>
        <CommunityModeButton
          label="Cards"
          selected={browseMode === "cards"}
          onPress={() => setBrowseMode("cards")}
        />
        <CommunityModeButton
          label="Sets"
          selected={browseMode === "sets"}
          onPress={() => setBrowseMode("sets")}
        />
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
        <View
          style={{
            paddingHorizontal: 12,
            paddingVertical: 10,
            borderBottomWidth: 1,
            borderBottomColor: "#eceef2",
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Database size={17} color="#151820" strokeWidth={2.4} />
          <Text selectable={false} style={{ flex: 1, color: "#151820", fontSize: 14, fontWeight: "900" }}>
            {browseMode === "cards" ? "Card Feed" : "Set Directory"}
          </Text>
          <Text selectable={false} style={{ color: "#0b7180", fontSize: 11, fontWeight: "900", textTransform: "uppercase" }}>
            {communityBusy ? "Loading" : "Live"}
          </Text>
        </View>

        {communityError ? (
          <CommunityEmptyState
            icon={<Database size={24} color="#68707d" strokeWidth={2.4} />}
            title="Community feed unavailable"
            detail={communityError}
          />
        ) : browseMode === "cards" ? (
          <CommunityCardsPreview
            cards={filteredCommunityCards}
            localFallbackCards={localCards}
            feedResetKey={`${feedSort}:${hideSeenCards ? "hide-seen" : "all"}:${normalizedSearchText}`}
            scrollWindow={communityScrollWindow}
            hasMore={Boolean(!normalizedSearchText && communityCards.length > 0 && communityHasMoreCards)}
            loadingMore={communityLoadingMore}
            onVisibleCommunityCardIdsChange={markVisibleCommunityCardsSeen}
            onToggleLike={handleToggleCommunityLike}
            onOpenComments={openCommunityComments}
            onExportCardImage={onExportCardImage}
          />
        ) : (
          <CommunitySetsPreview
            sets={filteredSets}
            viewerUserId={accountUser?.id}
            selectedSetId={selectedCommunitySetId}
            cardsBySetId={communitySetCardsBySetId}
            loadingSetId={communitySetCardsLoadingId}
            errorBySetId={communitySetCardsErrorBySetId}
            visibleCardCountsBySetId={visibleCommunitySetCardCountsBySetId}
            onOpenSet={openCommunitySet}
            onToggleSetFollow={handleToggleCommunitySetFollow}
            onShowMoreSetCards={showMoreCommunitySetCards}
            onExportCardImage={onExportCardImage}
          />
        )}
      </View>
      <CommunityCommentsPopover
        card={commentPopoverCard}
        onClose={() => setCommentPopoverCard(null)}
        onCommentCountChange={handleCommunityCommentCountChange}
      />
      <CommunityPollsPopover
        visible={pollsPopoverOpen}
        canCreatePolls={canManageCommunityPolls}
        onClose={() => setPollsPopoverOpen(false)}
      />
      <CommunityFeedbackPopover
        visible={feedbackPopoverOpen}
        accountUser={accountUser}
        onClose={() => setFeedbackPopoverOpen(false)}
        normalizePickedImage={normalizePickedImage}
      />
    </View>
  );
}

function WeeklyFeaturedCardPreview({
  card,
  loading,
}: {
  card: CommunityCardPayload | null;
  loading: boolean;
}) {
  const { width: windowWidth } = useWindowDimensions();
  const previewWidth =
    windowWidth >= 900 ? 360 :
    windowWidth >= 620 ? 320 :
    Math.min(300, Math.max(232, windowWidth - 96));
  const previewAspectRatio = card ? getTypeFrameSpec(getPreviewTypeFrame(card.card)).aspectRatio : CARD_BACK_PREVIEW_ASPECT_RATIO;
  const reservedPreviewHeight = previewWidth / previewAspectRatio;

  return (
    <View
      style={{
        borderRadius: 12,
        borderCurve: "continuous",
        backgroundColor: "#101820",
        padding: 14,
        gap: 12,
        overflow: "hidden",
      }}
    >
      <LinearGradient
        pointerEvents="none"
        colors={["rgba(80,214,255,0.2)", "rgba(255,255,255,0)", "rgba(255,208,98,0.14)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: "absolute", inset: 0 }}
      />
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <View
          style={{
            width: 42,
            height: 42,
            borderRadius: 21,
            backgroundColor: "rgba(255,255,255,0.12)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Heart size={21} color="#ffffff" strokeWidth={2.5} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text selectable={false} style={{ color: "#ffffff", fontSize: 18, fontWeight: "900" }}>
            Weekly Featured Card
          </Text>
        </View>
      </View>

      {loading && !card ? (
        <View style={{ gap: 12, alignItems: "center" }}>
          <View
            style={{
              width: previewWidth,
              height: reservedPreviewHeight,
              borderRadius: 9,
              backgroundColor: "rgba(255,255,255,0.1)",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.14)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ActivityIndicator color="#6ed7e8" />
          </View>
          <View style={{ width: "100%", gap: 6, alignItems: "center" }}>
            <View style={{ width: "62%", height: 15, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.16)" }} />
            <View style={{ width: "46%", height: 12, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.12)" }} />
          </View>
        </View>
      ) : card ? (
        <View style={{ gap: 12, alignItems: "center" }}>
          {card.imageUrl ? (
            <Image
              source={{ uri: card.imageUrl }}
              resizeMode="contain"
              style={{
                width: previewWidth,
                height: previewWidth / previewAspectRatio,
                borderRadius: 9,
              }}
            />
          ) : (
            <CardPreview
              card={card.card}
              activeSection={null}
              width={previewWidth}
              cornerRadius={9}
              footerOwnerName={card.authorName}
              onSectionPress={noopCardPreviewHandler}
              onChange={noopCardPreviewHandler}
            />
          )}
          <View style={{ width: "100%", gap: 4 }}>
            <Text selectable={false} numberOfLines={1} style={{ color: "#ffffff", fontSize: 15, fontWeight: "900", textAlign: "center" }}>
              {card.name || "Untitled Card"}
            </Text>
            <Text selectable={false} numberOfLines={1} style={{ color: "rgba(255,255,255,0.72)", fontSize: 12, fontWeight: "800", textAlign: "center" }}>
              {card.authorName} · Level {card.authorLevel} · {card.likeCount} likes · {card.commentCount} comments
            </Text>
          </View>
        </View>
      ) : (
        <Text selectable={false} style={{ color: "rgba(255,255,255,0.72)", fontSize: 13, lineHeight: 18, fontWeight: "800" }}>
          No public cards are available for the weekly feature yet.
        </Text>
      )}
    </View>
  );
}

function CommunityModeButton({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`Show community ${label.toLowerCase()}`}
      onPress={onPress}
      style={{
        flex: 1,
        minHeight: 42,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: selected ? "#151820" : "#d8dbe2",
        backgroundColor: selected ? "#151820" : "#ffffff",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text selectable={false} style={{ color: selected ? "#ffffff" : "#151820", fontSize: 13, fontWeight: "900" }}>
        {label}
      </Text>
    </Pressable>
  );
}

function CommunityMenuOptionButton({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="menuitem"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      onPress={onPress}
      style={{
        minHeight: 38,
        borderRadius: 10,
        borderCurve: "continuous",
        backgroundColor: selected ? "rgba(11,113,128,0.1)" : "#ffffff",
        paddingHorizontal: 10,
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
      }}
    >
      <View
        style={{
          width: 16,
          height: 16,
          borderRadius: 8,
          borderWidth: 2,
          borderColor: selected ? "#0b7180" : "#c8ced8",
          backgroundColor: selected ? "#0b7180" : "#ffffff",
        }}
      />
      <Text selectable={false} numberOfLines={1} style={{ flex: 1, color: selected ? "#0b7180" : "#151820", fontSize: 13, fontWeight: "900" }}>
        {label}
      </Text>
    </Pressable>
  );
}

type FeedbackScreenshotDraft = {
  id: string;
  uri: string;
};

function CommunityFeedbackPopover({
  visible,
  accountUser,
  onClose,
  normalizePickedImage,
}: {
  visible: boolean;
  accountUser: SupabaseUser | null;
  onClose: () => void;
  normalizePickedImage: (
    asset: Pick<ImagePicker.ImagePickerAsset, "uri" | "width" | "height">,
    options: { maxDimension: number; compress: number; format: ImageManipulator.SaveFormat },
  ) => Promise<string>;
}) {
  const { height: windowHeight } = useWindowDimensions();
  const [feedbackType, setFeedbackType] = useState<CommunityFeedbackType>("feedback");
  const [feedbackBody, setFeedbackBody] = useState("");
  const [screenshots, setScreenshots] = useState<FeedbackScreenshotDraft[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setFeedbackError(null);
      setFeedbackSuccess(null);
    }
  }, [visible]);

  if (!visible) {
    return null;
  }

  const pickScreenshot = async () => {
    if (screenshots.length >= 3) {
      setFeedbackError("You can attach up to three screenshots.");
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      setFeedbackError("Enable photo library access to attach screenshots.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: false,
      quality: 0.82,
      preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Current,
    });

    if (result.canceled || !result.assets[0]?.uri) {
      return;
    }

    try {
      const uri = await normalizePickedImage(result.assets[0], {
        maxDimension: 1600,
        compress: 0.82,
        format: ImageManipulator.SaveFormat.JPEG,
      });
      setScreenshots((current) => [...current, { id: createUuid(), uri }].slice(0, 3));
      setFeedbackError(null);
    } catch (error) {
      setFeedbackError(error instanceof Error ? error.message : "CardMagic could not attach that screenshot.");
    }
  };

  const sendFeedback = async () => {
    if (!accountUser) {
      setFeedbackError("Sign in before sending feedback.");
      return;
    }

    setSubmitting(true);
    setFeedbackError(null);
    setFeedbackSuccess(null);

    try {
      const screenshotPaths: string[] = [];

      for (const [index, screenshot] of screenshots.entries()) {
        screenshotPaths.push(await uploadCommunityFeedbackScreenshot(accountUser.id, screenshot.uri, index));
      }

      await submitCommunityFeedback({
        feedbackType,
        body: feedbackBody,
        appVersion: CARDMAGIC_APP_VERSION,
        deviceInfo: getCommunityFeedbackDeviceInfo(),
        screenshotPaths,
      });

      setFeedbackBody("");
      setScreenshots([]);
      setFeedbackSuccess("Feedback submitted. Device metadata and screenshots were attached.");
    } catch (error) {
      setFeedbackError(error instanceof Error ? error.message : "CardMagic could not send feedback.");
    } finally {
      setSubmitting(false);
    }
  };

  const content = (
    <View
      pointerEvents="auto"
      style={{
        flex: 1,
        backgroundColor: "rgba(15, 18, 24, 0.48)",
        alignItems: "center",
        justifyContent: "center",
        padding: 14,
      }}
    >
      <View
        style={{
          width: "100%",
          maxWidth: 620,
          maxHeight: Math.max(430, windowHeight - 58),
          borderRadius: 16,
          borderCurve: "continuous",
          backgroundColor: "#ffffff",
          borderWidth: 1,
          borderColor: "#d8dbe2",
          overflow: "hidden",
          shadowColor: "#000000",
          shadowOpacity: 0.22,
          shadowRadius: 24,
          shadowOffset: { width: 0, height: 14 },
          elevation: 18,
        }}
      >
        <View
          style={{
            paddingHorizontal: 14,
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: "#eceef2",
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
          }}
        >
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text selectable={false} style={{ color: "#151820", fontSize: 17, fontWeight: "900" }}>
              Community feedback
            </Text>
            <Text selectable={false} style={{ color: "#68707d", fontSize: 12, fontWeight: "800" }}>
              Send a bug report or product note with diagnostic context
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close community feedback"
            onPress={onClose}
            style={{
              width: 34,
              height: 34,
              borderRadius: 17,
              backgroundColor: "#eef0f4",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={18} color="#20242d" strokeWidth={2.6} />
          </Pressable>
        </View>

        <ScrollView
          style={{ maxHeight: Math.max(360, windowHeight - 150) }}
          contentContainerStyle={{ padding: 14, gap: 14 }}
          keyboardShouldPersistTaps="handled"
        >
          {feedbackError ? (
            <View
              style={{
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "#f1bcc4",
                backgroundColor: "#fff5f6",
                padding: 10,
              }}
            >
              <Text selectable={false} style={{ color: "#a62231", fontSize: 12, lineHeight: 17, fontWeight: "800" }}>
                {feedbackError}
              </Text>
            </View>
          ) : null}

          {feedbackSuccess ? (
            <View
              style={{
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "#b7ecf4",
                backgroundColor: "#f2fcfd",
                padding: 10,
              }}
            >
              <Text selectable={false} style={{ color: "#0b7180", fontSize: 12, lineHeight: 17, fontWeight: "900" }}>
                {feedbackSuccess}
              </Text>
            </View>
          ) : null}

          {!accountUser ? (
            <View
              style={{
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "#f2d6a7",
                backgroundColor: "#fff9ed",
                padding: 10,
              }}
            >
              <Text selectable={false} style={{ color: "#8a5d0a", fontSize: 12, lineHeight: 17, fontWeight: "800" }}>
                Sign in so CardMagic can associate this report with your account.
              </Text>
            </View>
          ) : null}

          <View style={{ flexDirection: "row", gap: 8 }}>
            <CommunityModeButton
              label="Feedback"
              selected={feedbackType === "feedback"}
              onPress={() => setFeedbackType("feedback")}
            />
            <CommunityModeButton
              label="Bug report"
              selected={feedbackType === "bug"}
              onPress={() => setFeedbackType("bug")}
            />
          </View>

          <TextInput
            accessibilityLabel="Feedback content"
            value={feedbackBody}
            onChangeText={setFeedbackBody}
            placeholder={feedbackType === "bug" ? "What broke, what did you expect, and what did you tap before it happened?" : "What should CardMagic improve or add?"}
            placeholderTextColor="#68707d"
            multiline
            maxLength={4000}
            style={[communityPollInputStyle, { minHeight: 156, textAlignVertical: "top" }]}
          />

          <View style={{ gap: 10 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text selectable={false} style={{ color: "#151820", fontSize: 13, fontWeight: "900" }}>
                  Screenshots
                </Text>
                <Text selectable={false} style={{ color: "#68707d", fontSize: 11, fontWeight: "800" }}>
                  Optional, up to 3 images
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Attach feedback screenshot"
                disabled={submitting || screenshots.length >= 3}
                onPress={() => void pickScreenshot()}
                style={{
                  minHeight: 38,
                  borderRadius: 999,
                  backgroundColor: screenshots.length >= 3 ? "#d8dbe2" : "#151820",
                  paddingHorizontal: 14,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <Upload size={15} color="#ffffff" strokeWidth={2.6} />
                <Text selectable={false} style={{ color: "#ffffff", fontSize: 12, fontWeight: "900" }}>
                  Add
                </Text>
              </Pressable>
            </View>

            {screenshots.length > 0 ? (
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                {screenshots.map((screenshot, index) => (
                  <View
                    key={screenshot.id}
                    style={{
                      width: 96,
                      borderRadius: 12,
                      borderCurve: "continuous",
                      borderWidth: 1,
                      borderColor: "#d8dbe2",
                      backgroundColor: "#f8f9fb",
                      overflow: "hidden",
                    }}
                  >
                    <Image source={{ uri: screenshot.uri }} style={{ width: 94, height: 94, backgroundColor: "#eef0f4" }} resizeMode="cover" />
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Remove screenshot ${index + 1}`}
                      disabled={submitting}
                      onPress={() => setScreenshots((current) => current.filter((entry) => entry.id !== screenshot.id))}
                      style={{ minHeight: 32, alignItems: "center", justifyContent: "center" }}
                    >
                      <Text selectable={false} style={{ color: "#a62231", fontSize: 11, fontWeight: "900" }}>
                        Remove
                      </Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            ) : null}
          </View>

          <View
            style={{
              borderRadius: 12,
              borderCurve: "continuous",
              borderWidth: 1,
              borderColor: "#e1e5eb",
              backgroundColor: "#f8f9fb",
              padding: 10,
              gap: 4,
            }}
          >
            <Text selectable={false} style={{ color: "#68707d", fontSize: 11, fontWeight: "900", textTransform: "uppercase" }}>
              Diagnostics
            </Text>
            <Text selectable={false} style={{ color: "#46505d", fontSize: 12, lineHeight: 17, fontWeight: "800" }}>
              v{CARDMAGIC_APP_VERSION} · {Platform.OS}
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Submit community feedback"
            disabled={submitting}
            onPress={() => void sendFeedback()}
            style={{
              minHeight: 46,
              borderRadius: 999,
              backgroundColor: submitting ? "#8aa7ad" : "#151820",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
              gap: 8,
            }}
          >
            {submitting ? <ActivityIndicator color="#ffffff" size="small" /> : feedbackType === "bug" ? <Bug size={17} color="#ffffff" strokeWidth={2.6} /> : <MessageCircle size={17} color="#ffffff" strokeWidth={2.6} />}
            <Text selectable={false} style={{ color: "#ffffff", fontSize: 13, fontWeight: "900" }}>
              {submitting ? "Submitting" : "Submit"}
            </Text>
          </Pressable>
        </ScrollView>
      </View>
    </View>
  );

  if (Platform.OS === "web" && typeof document !== "undefined") {
    return createPortal(
      <View style={{ position: "fixed" as unknown as "absolute", inset: 0, zIndex: 190 }}>
        {content}
      </View>,
      document.body,
    );
  }

  return (
    <Modal transparent visible animationType="fade" onRequestClose={onClose}>
      {content}
    </Modal>
  );
}

function getCommunityFeedbackDeviceInfo() {
  const screenInfo = Platform.OS === "web" && typeof window !== "undefined"
    ? {
        width: window.screen?.width,
        height: window.screen?.height,
        pixelRatio: window.devicePixelRatio,
      }
    : undefined;

  return {
    platform: Platform.OS,
    os: Platform.OS,
    userAgent: Platform.OS === "web" && typeof navigator !== "undefined" ? navigator.userAgent : undefined,
    language: Platform.OS === "web" && typeof navigator !== "undefined" ? navigator.language : undefined,
    screen: screenInfo,
  };
}

function CommunityPollsPopover({
  visible,
  canCreatePolls,
  onClose,
}: {
  visible: boolean;
  canCreatePolls: boolean;
  onClose: () => void;
}) {
  const { height: windowHeight } = useWindowDimensions();
  const [polls, setPolls] = useState<CommunityPollPayload[]>([]);
  const [pollsLoading, setPollsLoading] = useState(false);
  const [pollsError, setPollsError] = useState<string | null>(null);
  const [draftSelections, setDraftSelections] = useState<Record<string, string[]>>({});
  const [savingPollId, setSavingPollId] = useState<string | null>(null);
  const [creatingPoll, setCreatingPoll] = useState(false);
  const [newPollTitle, setNewPollTitle] = useState("");
  const [newPollDescription, setNewPollDescription] = useState("");
  const [newPollSelectionType, setNewPollSelectionType] = useState<CommunityPollSelectionType>("single");
  const [newPollOptionsText, setNewPollOptionsText] = useState("Yes\nNo");

  const reloadPolls = useCallback(async () => {
    if (!visible) {
      return;
    }

    setPollsLoading(true);
    setPollsError(null);

    try {
      const nextPolls = await fetchCommunityPolls();
      setPolls(nextPolls);
      setDraftSelections(Object.fromEntries(
        nextPolls.map((poll) => [
          poll.id,
          poll.options.filter((option) => option.selectedByViewer).map((option) => option.id),
        ]),
      ));
    } catch (error) {
      setPollsError(error instanceof Error ? error.message : "CardMagic could not load community polls.");
    } finally {
      setPollsLoading(false);
    }
  }, [visible]);

  useEffect(() => {
    if (visible) {
      void reloadPolls();
    }
  }, [reloadPolls, visible]);

  if (!visible) {
    return null;
  }

  const submitVote = async (poll: CommunityPollPayload) => {
    const optionIds = draftSelections[poll.id] ?? [];

    if (optionIds.length === 0) {
      setPollsError("Choose at least one option before submitting your vote.");
      return;
    }

    setSavingPollId(poll.id);
    setPollsError(null);

    try {
      await submitCommunityPollVote(poll.id, optionIds);
      await reloadPolls();
    } catch (error) {
      setPollsError(error instanceof Error ? error.message : "CardMagic could not submit this vote.");
    } finally {
      setSavingPollId(null);
    }
  };

  const togglePollStatus = async (poll: CommunityPollPayload) => {
    setSavingPollId(poll.id);
    setPollsError(null);

    try {
      await setCommunityPollStatus(poll.id, poll.status === "open" ? "closed" : "open");
      await reloadPolls();
    } catch (error) {
      setPollsError(error instanceof Error ? error.message : "CardMagic could not update this poll.");
    } finally {
      setSavingPollId(null);
    }
  };

  const createPoll = async () => {
    const options = newPollOptionsText
      .split(/\r?\n/)
      .map((option) => option.trim())
      .filter(Boolean);

    setCreatingPoll(true);
    setPollsError(null);

    try {
      await createCommunityPoll({
        title: newPollTitle,
        description: newPollDescription,
        selectionType: newPollSelectionType,
        options,
      });
      setNewPollTitle("");
      setNewPollDescription("");
      setNewPollSelectionType("single");
      setNewPollOptionsText("Yes\nNo");
      await reloadPolls();
    } catch (error) {
      setPollsError(error instanceof Error ? error.message : "CardMagic could not create this poll.");
    } finally {
      setCreatingPoll(false);
    }
  };

  const content = (
    <View
      pointerEvents="auto"
      style={{
        flex: 1,
        backgroundColor: "rgba(15, 18, 24, 0.48)",
        alignItems: "center",
        justifyContent: "center",
        padding: 14,
      }}
    >
      <View
        style={{
          width: "100%",
          maxWidth: 720,
          maxHeight: Math.max(430, windowHeight - 58),
          borderRadius: 16,
          borderCurve: "continuous",
          backgroundColor: "#ffffff",
          borderWidth: 1,
          borderColor: "#d8dbe2",
          overflow: "hidden",
          shadowColor: "#000000",
          shadowOpacity: 0.22,
          shadowRadius: 24,
          shadowOffset: { width: 0, height: 14 },
          elevation: 18,
        }}
      >
        <View
          style={{
            paddingHorizontal: 14,
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: "#eceef2",
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
          }}
        >
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text selectable={false} style={{ color: "#151820", fontSize: 17, fontWeight: "900" }}>
              Community polls
            </Text>
            <Text selectable={false} style={{ color: "#68707d", fontSize: 12, fontWeight: "800" }}>
              Vote on feature direction and app priorities
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Refresh community polls"
            disabled={pollsLoading}
            onPress={() => void reloadPolls()}
            style={{
              width: 34,
              height: 34,
              borderRadius: 17,
              backgroundColor: "#eef0f4",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {pollsLoading ? <ActivityIndicator color="#0b7180" size="small" /> : <RefreshCw size={17} color="#20242d" strokeWidth={2.6} />}
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close community polls"
            onPress={onClose}
            style={{
              width: 34,
              height: 34,
              borderRadius: 17,
              backgroundColor: "#eef0f4",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={18} color="#20242d" strokeWidth={2.6} />
          </Pressable>
        </View>

        <ScrollView
          style={{ maxHeight: Math.max(360, windowHeight - 150) }}
          contentContainerStyle={{ padding: 14, gap: 14 }}
        >
          {pollsError ? (
            <View
              style={{
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "#f1bcc4",
                backgroundColor: "#fff5f6",
                padding: 10,
              }}
            >
              <Text selectable={false} style={{ color: "#a62231", fontSize: 12, lineHeight: 17, fontWeight: "800" }}>
                {pollsError}
              </Text>
            </View>
          ) : null}

          {canCreatePolls ? (
            <View
              style={{
                borderRadius: 14,
                borderCurve: "continuous",
                borderWidth: 1,
                borderColor: "#b7ecf4",
                backgroundColor: "#f2fcfd",
                padding: 12,
                gap: 10,
              }}
            >
              <Text selectable={false} style={{ color: "#0b7180", fontSize: 12, fontWeight: "900", textTransform: "uppercase" }}>
                Create poll
              </Text>
              <TextInput
                accessibilityLabel="Poll title"
                value={newPollTitle}
                onChangeText={setNewPollTitle}
                placeholder="Feature poll title"
                placeholderTextColor="#68707d"
                maxLength={120}
                style={communityPollInputStyle}
              />
              <TextInput
                accessibilityLabel="Poll description"
                value={newPollDescription}
                onChangeText={setNewPollDescription}
                placeholder="Optional context"
                placeholderTextColor="#68707d"
                maxLength={500}
                multiline
                style={[communityPollInputStyle, { minHeight: 72, textAlignVertical: "top" }]}
              />
              <View style={{ flexDirection: "row", gap: 8 }}>
                <CommunityModeButton
                  label="Single choice"
                  selected={newPollSelectionType === "single"}
                  onPress={() => setNewPollSelectionType("single")}
                />
                <CommunityModeButton
                  label="Multi choice"
                  selected={newPollSelectionType === "multiple"}
                  onPress={() => setNewPollSelectionType("multiple")}
                />
              </View>
              <TextInput
                accessibilityLabel="Poll options"
                value={newPollOptionsText}
                onChangeText={setNewPollOptionsText}
                placeholder="One option per line"
                placeholderTextColor="#68707d"
                multiline
                style={[communityPollInputStyle, { minHeight: 96, textAlignVertical: "top" }]}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Create community poll"
                disabled={creatingPoll}
                onPress={() => void createPoll()}
                style={{
                  minHeight: 44,
                  borderRadius: 999,
                  backgroundColor: creatingPoll ? "#8aa7ad" : "#151820",
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "row",
                  gap: 8,
                }}
              >
                {creatingPoll ? <ActivityIndicator color="#ffffff" size="small" /> : <ListPlus size={17} color="#ffffff" strokeWidth={2.6} />}
                <Text selectable={false} style={{ color: "#ffffff", fontSize: 13, fontWeight: "900" }}>
                  {creatingPoll ? "Creating poll" : "Create poll"}
                </Text>
              </Pressable>
            </View>
          ) : null}

          {pollsLoading && polls.length === 0 ? (
            <View style={{ minHeight: 180, alignItems: "center", justifyContent: "center" }}>
              <ActivityIndicator color="#0b7180" />
            </View>
          ) : polls.length > 0 ? (
            polls.map((poll) => {
              const selectedOptionIds = draftSelections[poll.id] ?? [];
              const totalVotes = poll.options.reduce((total, option) => total + option.voteCount, 0);
              const isSaving = savingPollId === poll.id;
              const isClosed = poll.status === "closed";

              return (
                <View
                  key={poll.id}
                  style={{
                    borderRadius: 14,
                    borderCurve: "continuous",
                    borderWidth: 1,
                    borderColor: isClosed ? "#d8dbe2" : "#b7ecf4",
                    backgroundColor: isClosed ? "#f8f9fb" : "#ffffff",
                    padding: 12,
                    gap: 10,
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
                    <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
                      <Text selectable={false} style={{ color: "#151820", fontSize: 16, lineHeight: 21, fontWeight: "900" }}>
                        {poll.title}
                      </Text>
                      {poll.description ? (
                        <Text selectable style={{ color: "#68707d", fontSize: 12, lineHeight: 17, fontWeight: "800" }}>
                          {poll.description}
                        </Text>
                      ) : null}
                      <Text selectable={false} style={{ color: "#8a93a3", fontSize: 11, fontWeight: "900", textTransform: "uppercase" }}>
                        {poll.selectionType === "multiple" ? "Multi choice" : "Single choice"} · {poll.status} · {totalVotes} {totalVotes === 1 ? "vote" : "votes"}
                      </Text>
                    </View>
                    {canCreatePolls ? (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={isClosed ? "Reopen poll" : "Close poll"}
                        disabled={isSaving}
                        onPress={() => void togglePollStatus(poll)}
                        style={{
                          minHeight: 32,
                          borderRadius: 999,
                          borderWidth: 1,
                          borderColor: "#d8dbe2",
                          backgroundColor: "#ffffff",
                          paddingHorizontal: 10,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Text selectable={false} style={{ color: "#46505d", fontSize: 11, fontWeight: "900" }}>
                          {isClosed ? "Reopen" : "Close"}
                        </Text>
                      </Pressable>
                    ) : null}
                  </View>

                  <View style={{ gap: 8 }}>
                    {poll.options.map((option) => {
                      const selected = selectedOptionIds.includes(option.id);
                      const percent = totalVotes > 0 ? Math.round((option.voteCount / totalVotes) * 100) : 0;

                      return (
                        <Pressable
                          key={option.id}
                          accessibilityRole={poll.selectionType === "multiple" ? "checkbox" : "radio"}
                          accessibilityState={{ checked: selected, disabled: isClosed }}
                          accessibilityLabel={`${option.label}, ${option.voteCount} votes`}
                          disabled={isClosed || isSaving}
                          onPress={() => {
                            setDraftSelections((current) => {
                              const currentSelection = current[poll.id] ?? [];
                              const nextSelection = poll.selectionType === "single"
                                ? [option.id]
                                : currentSelection.includes(option.id)
                                  ? currentSelection.filter((id) => id !== option.id)
                                  : [...currentSelection, option.id];

                              return { ...current, [poll.id]: nextSelection };
                            });
                          }}
                          style={{
                            minHeight: 44,
                            borderRadius: 12,
                            borderCurve: "continuous",
                            borderWidth: 1,
                            borderColor: selected ? "#0b7180" : "#d8dbe2",
                            backgroundColor: selected ? "rgba(11,113,128,0.08)" : "#ffffff",
                            padding: 10,
                            gap: 7,
                          }}
                        >
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 9 }}>
                            <View
                              style={{
                                width: 18,
                                height: 18,
                                borderRadius: poll.selectionType === "multiple" ? 5 : 9,
                                borderWidth: 2,
                                borderColor: selected ? "#0b7180" : "#c8ced8",
                                backgroundColor: selected ? "#0b7180" : "#ffffff",
                              }}
                            />
                            <Text selectable={false} style={{ flex: 1, color: "#151820", fontSize: 13, fontWeight: "900" }}>
                              {option.label}
                            </Text>
                            <Text selectable={false} style={{ color: "#68707d", fontSize: 12, fontWeight: "900" }}>
                              {percent}%
                            </Text>
                          </View>
                          <View style={{ height: 6, borderRadius: 999, backgroundColor: "#eceef2", overflow: "hidden" }}>
                            <View style={{ width: `${percent}%`, height: "100%", backgroundColor: selected ? "#0b7180" : "#b8c0cc" }} />
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Submit vote for ${poll.title}`}
                    disabled={isClosed || isSaving || selectedOptionIds.length === 0}
                    onPress={() => void submitVote(poll)}
                    style={{
                      minHeight: 42,
                      borderRadius: 999,
                      backgroundColor: isClosed || selectedOptionIds.length === 0 ? "#d8dbe2" : "#151820",
                      alignItems: "center",
                      justifyContent: "center",
                      flexDirection: "row",
                      gap: 8,
                    }}
                  >
                    {isSaving ? <ActivityIndicator color="#ffffff" size="small" /> : <ListPlus size={16} color="#ffffff" strokeWidth={2.6} />}
                    <Text selectable={false} style={{ color: "#ffffff", fontSize: 13, fontWeight: "900" }}>
                      {isClosed ? "Poll closed" : isSaving ? "Saving vote" : "Submit vote"}
                    </Text>
                  </Pressable>
                </View>
              );
            })
          ) : (
            <CommunityEmptyState
              icon={<ListPlus size={24} color="#68707d" strokeWidth={2.4} />}
              title="No polls yet"
              detail="Open polls will appear here for feature requests, release priorities, and community feedback."
            />
          )}
        </ScrollView>
      </View>
    </View>
  );

  if (Platform.OS === "web" && typeof document !== "undefined") {
    return createPortal(
      <View style={{ position: "fixed" as unknown as "absolute", inset: 0, zIndex: 180 }}>
        {content}
      </View>,
      document.body,
    );
  }

  return (
    <Modal transparent visible animationType="fade" onRequestClose={onClose}>
      {content}
    </Modal>
  );
}

const communityPollInputStyle = {
  minHeight: 44,
  borderRadius: 12,
  borderCurve: "continuous" as const,
  borderWidth: 1,
  borderColor: "#d8dbe2",
  backgroundColor: "#ffffff",
  color: "#151820",
  fontSize: 14,
  lineHeight: 19,
  fontWeight: "800" as const,
  paddingHorizontal: 12,
  paddingVertical: 10,
};

function CommunityCommentsPopover({
  card,
  onClose,
  onCommentCountChange,
}: {
  card: CommunityCardPayload | null;
  onClose: () => void;
  onCommentCountChange: (cardId: string, commentCount: number) => void;
}) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const [comments, setComments] = useState<CommunityCardCommentPayload[]>([]);
  const [draftBody, setDraftBody] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [loadingComments, setLoadingComments] = useState(false);
  const [savingComment, setSavingComment] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  const previewWidth =
    windowWidth >= 900 ? 260 :
    windowWidth >= 620 ? 230 :
    Math.min(210, Math.max(160, windowWidth - 190));

  useEffect(() => {
    let cancelled = false;

    if (!card) {
      setComments([]);
      setDraftBody("");
      setEditingCommentId(null);
      setCommentError(null);
      return;
    }

    setLoadingComments(true);
    setCommentError(null);
    setDraftBody("");
    setEditingCommentId(null);

    fetchCommunityCardComments(card.id)
      .then((nextComments) => {
        if (cancelled) {
          return;
        }

        setComments(nextComments);
        onCommentCountChange(card.id, nextComments.length);
      })
      .catch((error) => {
        if (!cancelled) {
          setCommentError(error instanceof Error ? error.message : "CardMagic could not load comments.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingComments(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [card, onCommentCountChange]);

  if (!card) {
    return null;
  }

  const editingComment = editingCommentId ? comments.find((comment) => comment.id === editingCommentId) : null;
  const saveLabel = editingComment ? "Update comment" : "Post comment";
  const canSaveComment = draftBody.trim().length > 0 && !savingComment;
  const saveComment = async () => {
    if (!canSaveComment) {
      return;
    }

    setSavingComment(true);
    setCommentError(null);

    try {
      const savedComment = await saveCommunityCardComment(card.id, draftBody, editingCommentId ?? undefined);
      setComments((current) => {
        const nextComments = editingCommentId
          ? current.map((comment) => comment.id === savedComment.id ? savedComment : comment)
          : [...current, savedComment];

        onCommentCountChange(card.id, nextComments.length);
        return nextComments;
      });
      setDraftBody("");
      setEditingCommentId(null);
    } catch (error) {
      setCommentError(error instanceof Error ? error.message : "CardMagic could not save this comment.");
    } finally {
      setSavingComment(false);
    }
  };
  const content = (
    <View
      pointerEvents="auto"
      style={{
        flex: 1,
        backgroundColor: "rgba(15, 18, 24, 0.48)",
        alignItems: "center",
        justifyContent: "center",
        padding: 14,
      }}
    >
      <View
        style={{
          width: "100%",
          maxWidth: 720,
          maxHeight: Math.max(420, windowHeight - 58),
          borderRadius: 16,
          borderCurve: "continuous",
          backgroundColor: "#ffffff",
          borderWidth: 1,
          borderColor: "#d8dbe2",
          overflow: "hidden",
          shadowColor: "#000000",
          shadowOpacity: 0.22,
          shadowRadius: 24,
          shadowOffset: { width: 0, height: 14 },
          elevation: 18,
        }}
      >
        <View
          style={{
            paddingHorizontal: 14,
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: "#eceef2",
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
          }}
        >
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text selectable={false} numberOfLines={1} style={{ color: "#151820", fontSize: 16, fontWeight: "900" }}>
              {card.name || "Untitled Card"}
            </Text>
            <Text selectable={false} numberOfLines={1} style={{ color: "#68707d", fontSize: 12, fontWeight: "800" }}>
              {card.authorName} · Level {card.authorLevel}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close comments"
            onPress={onClose}
            style={{
              width: 34,
              height: 34,
              borderRadius: 17,
              backgroundColor: "#eef0f4",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={18} color="#20242d" strokeWidth={2.6} />
          </Pressable>
        </View>

        <View
          style={{
            padding: 14,
            gap: 14,
            flexDirection: windowWidth >= 640 ? "row" : "column",
          }}
        >
          <View style={{ alignItems: "center", gap: 8 }}>
            <CardPreview
              card={card.card}
              activeSection={null}
              width={previewWidth}
              cornerRadius={9}
              footerOwnerName={card.authorName}
              onSectionPress={noopCardPreviewHandler}
              onChange={noopCardPreviewHandler}
            />
            <Text selectable={false} style={{ color: "#68707d", fontSize: 12, fontWeight: "800" }}>
              {comments.length} {comments.length === 1 ? "comment" : "comments"}
            </Text>
          </View>

          <View style={{ flex: 1, minWidth: 0, gap: 12 }}>
            <ScrollView
              style={{ maxHeight: windowWidth >= 640 ? Math.max(230, windowHeight - 360) : 210 }}
              contentContainerStyle={{ gap: 10, paddingRight: 2 }}
            >
              {loadingComments ? (
                <View style={{ minHeight: 120, alignItems: "center", justifyContent: "center" }}>
                  <ActivityIndicator color="#0b7180" />
                </View>
              ) : comments.length > 0 ? (
                comments.map((comment) => (
                  <View
                    key={comment.id}
                    style={{
                      borderRadius: 12,
                      borderCurve: "continuous",
                      borderWidth: 1,
                      borderColor: comment.editableByViewer ? "#b7ecf4" : "#eceef2",
                      backgroundColor: comment.editableByViewer ? "#f2fcfd" : "#f8f9fb",
                      padding: 10,
                      gap: 6,
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <Text selectable={false} style={{ flex: 1, color: "#151820", fontSize: 12, fontWeight: "900" }}>
                        {comment.authorName}
                      </Text>
                      <Text selectable={false} style={{ color: "#8a93a3", fontSize: 10, fontWeight: "800" }}>
                        {formatCompactCommentDate(comment.updatedAt)}
                      </Text>
                    </View>
                    <Text selectable style={{ color: "#2a303a", fontSize: 13, lineHeight: 18, fontWeight: "700" }}>
                      {comment.body}
                    </Text>
                    {comment.editableByViewer ? (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Edit your comment"
                        onPress={() => {
                          setEditingCommentId(comment.id);
                          setDraftBody(comment.body);
                        }}
                        style={{ alignSelf: "flex-start", paddingVertical: 4 }}
                      >
                        <Text selectable={false} style={{ color: "#0b7180", fontSize: 12, fontWeight: "900" }}>
                          Edit
                        </Text>
                      </Pressable>
                    ) : null}
                  </View>
                ))
              ) : (
                <View
                  style={{
                    minHeight: 120,
                    borderRadius: 12,
                    backgroundColor: "#f4f5f7",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 16,
                  }}
                >
                  <Text selectable={false} style={{ color: "#68707d", fontSize: 13, fontWeight: "900", textAlign: "center" }}>
                    No comments yet
                  </Text>
                </View>
              )}
            </ScrollView>

            <View style={{ gap: 8 }}>
              <TextInput
                accessibilityLabel={editingComment ? "Edit your comment" : "Add a comment"}
                value={draftBody}
                onChangeText={setDraftBody}
                placeholder={editingComment ? "Edit your comment" : "Add a comment"}
                placeholderTextColor="#8a93a3"
                multiline
                maxLength={500}
                style={{
                  minHeight: 82,
                  borderRadius: 12,
                  borderCurve: "continuous",
                  borderWidth: 1,
                  borderColor: "#d8dbe2",
                  backgroundColor: "#ffffff",
                  color: "#151820",
                  fontSize: 14,
                  lineHeight: 19,
                  fontWeight: "700",
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  textAlignVertical: "top",
                }}
              />
              {commentError ? (
                <Text selectable={false} style={{ color: "#a52735", fontSize: 12, fontWeight: "800" }}>
                  {commentError}
                </Text>
              ) : null}
              <View style={{ flexDirection: "row", gap: 8 }}>
                {editingComment ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Cancel comment edit"
                    onPress={() => {
                      setEditingCommentId(null);
                      setDraftBody("");
                    }}
                    style={{
                      minHeight: 42,
                      borderRadius: 999,
                      borderWidth: 1,
                      borderColor: "#d8dbe2",
                      paddingHorizontal: 14,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text selectable={false} style={{ color: "#46505d", fontSize: 13, fontWeight: "900" }}>
                      Cancel
                    </Text>
                  </Pressable>
                ) : null}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={saveLabel}
                  disabled={!canSaveComment}
                  onPress={() => void saveComment()}
                  style={{
                    flex: 1,
                    minHeight: 42,
                    borderRadius: 999,
                    backgroundColor: canSaveComment ? "#151820" : "#d8dbe2",
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "row",
                    gap: 8,
                  }}
                >
                  {savingComment ? <ActivityIndicator color="#ffffff" size="small" /> : <MessageCircle size={16} color="#ffffff" strokeWidth={2.5} />}
                  <Text selectable={false} style={{ color: "#ffffff", fontSize: 13, fontWeight: "900" }}>
                    {savingComment ? "Saving" : saveLabel}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );

  if (Platform.OS === "web" && typeof document !== "undefined") {
    return createPortal(
      <View style={{ position: "fixed" as unknown as "absolute", inset: 0, zIndex: 180 }}>
        {content}
      </View>,
      document.body,
    );
  }

  return (
    <Modal transparent visible animationType="fade" onRequestClose={onClose}>
      {content}
    </Modal>
  );
}

function CommunityCardsPreview({
  cards,
  localFallbackCards,
  feedResetKey,
  scrollWindow,
  hasMore,
  loadingMore,
  onVisibleCommunityCardIdsChange,
  onToggleLike,
  onOpenComments,
  onExportCardImage,
}: {
  cards: CommunityCardPayload[];
  localFallbackCards: Array<{ id: string; setName: string; card: CardDraft }>;
  feedResetKey: string;
  scrollWindow: MainScrollWindow | null;
  hasMore: boolean;
  loadingMore: boolean;
  onVisibleCommunityCardIdsChange: (cardIds: string[]) => void;
  onToggleLike: (cardId: string, liked: boolean) => void;
  onOpenComments: (cardId: string) => void;
  onExportCardImage: (card: CardDraft, cardName: string, footerOwnerName?: string, imageUrl?: string) => Promise<void>;
}) {
  const { width: windowWidth } = useWindowDimensions();
  const [listTopY, setListTopY] = useState(0);
  const [itemHeightsById, setItemHeightsById] = useState<Record<string, number>>({});
  const cardPreviewWidth =
    windowWidth >= 900 ? 420 :
    windowWidth >= 620 ? 380 :
    Math.min(360, Math.max(286, windowWidth - 28));
  const usingCommunityCards = cards.length > 0;
  const feedItems = useMemo(
    () =>
      usingCommunityCards
        ? cards.map((entry) => ({ kind: "community" as const, id: entry.id, entry }))
        : localFallbackCards.map((entry) => ({ kind: "fallback" as const, id: entry.id, entry })),
    [cards, localFallbackCards, usingCommunityCards],
  );
  const feedItemCount = feedItems.length;

  useEffect(() => {
    setItemHeightsById({});
  }, [cardPreviewWidth, feedResetKey]);

  const virtualWindow = useMemo(() => {
    if (feedItemCount === 0) {
      return {
        startIndex: 0,
        endIndex: 0,
        topSpacerHeight: 0,
        bottomSpacerHeight: 0,
      };
    }

    const estimatedInitialHeight =
      COMMUNITY_FEED_ESTIMATED_CARD_ITEM_HEIGHT * COMMUNITY_INITIAL_RENDERED_CARD_COUNT;
    const viewportTop = scrollWindow
      ? Math.max(0, scrollWindow.offsetY - listTopY - COMMUNITY_FEED_OVERSCAN_PX)
      : 0;
    const viewportBottom = scrollWindow
      ? Math.max(
          viewportTop + scrollWindow.viewportHeight,
          scrollWindow.offsetY - listTopY + scrollWindow.viewportHeight + COMMUNITY_FEED_OVERSCAN_PX,
        )
      : estimatedInitialHeight;
    let cursorY = 0;
    let startIndex = 0;
    let endIndex = feedItemCount;
    let topSpacerHeight = 0;
    let visibleHeight = 0;

    for (let index = 0; index < feedItemCount; index += 1) {
      const item = feedItems[index];
      const itemHeight = itemHeightsById[item.id] ?? COMMUNITY_FEED_ESTIMATED_CARD_ITEM_HEIGHT;
      const itemTop = cursorY;
      const itemBottom = cursorY + itemHeight;

      if (itemBottom < viewportTop) {
        startIndex = index + 1;
        topSpacerHeight += itemHeight;
      }

      if (itemTop <= viewportBottom) {
        endIndex = index + 1;
      }

      cursorY = itemBottom;
    }

    endIndex = Math.min(feedItemCount, Math.max(endIndex, startIndex + 1));

    for (let index = startIndex; index < endIndex; index += 1) {
      const item = feedItems[index];
      visibleHeight += itemHeightsById[item.id] ?? COMMUNITY_FEED_ESTIMATED_CARD_ITEM_HEIGHT;
    }

    return {
      startIndex,
      endIndex,
      topSpacerHeight,
      bottomSpacerHeight: Math.max(0, cursorY - topSpacerHeight - visibleHeight),
    };
  }, [feedItemCount, feedItems, itemHeightsById, listTopY, scrollWindow]);

  const visibleFeedItems = feedItems.slice(virtualWindow.startIndex, virtualWindow.endIndex);
  const visibleCommunityCardIds = useMemo(
    () => visibleFeedItems.flatMap((item) => (item.kind === "community" ? [item.id] : [])),
    [visibleFeedItems],
  );
  const visibleCommunityCardIdsKey = visibleCommunityCardIds.join("\n");
  const handleItemLayout = useCallback((itemId: string, event: LayoutChangeEvent) => {
    const measuredHeight = event.nativeEvent.layout.height;

    if (measuredHeight <= 0) {
      return;
    }

    setItemHeightsById((current) => {
      if (Math.abs((current[itemId] ?? 0) - measuredHeight) < 2) {
        return current;
      }

      return {
        ...current,
        [itemId]: measuredHeight,
      };
    });
  }, []);

  useEffect(() => {
    if (visibleCommunityCardIds.length > 0) {
      onVisibleCommunityCardIdsChange(visibleCommunityCardIds);
    }
  }, [onVisibleCommunityCardIdsChange, visibleCommunityCardIdsKey]);

  if (feedItemCount === 0) {
    return (
      <CommunityEmptyState
        icon={<Tags size={24} color="#68707d" strokeWidth={2.4} />}
        title="No community cards yet"
        detail="Save cards while signed in to publish them into the public Supabase card feed."
      />
    );
  }

  return (
    <View
      onLayout={(event) => setListTopY(event.nativeEvent.layout.y)}
      style={{ padding: 12, gap: 16 }}
    >
      {virtualWindow.topSpacerHeight > 0 ? (
        <View pointerEvents="none" style={{ height: virtualWindow.topSpacerHeight }} />
      ) : null}
      {visibleFeedItems.map((item) => (
        <View
          key={item.id}
          onLayout={(event) => handleItemLayout(item.id, event)}
        >
          {item.kind === "community" ? (
            <CommunityFeedCardItem
              entry={item.entry}
              cardPreviewWidth={cardPreviewWidth}
              onToggleLike={onToggleLike}
              onOpenComments={onOpenComments}
              onExportCardImage={onExportCardImage}
            />
          ) : (
            <CommunityFallbackCardItem
              entry={item.entry}
              cardPreviewWidth={cardPreviewWidth}
              onExportCardImage={onExportCardImage}
            />
          )}
        </View>
      ))}
      {virtualWindow.bottomSpacerHeight > 0 ? (
        <View pointerEvents="none" style={{ height: virtualWindow.bottomSpacerHeight }} />
      ) : null}
      {cards.length > 0 && hasMore && loadingMore ? (
        <View
          accessibilityRole="progressbar"
          style={{
            minHeight: 46,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: "#d8dbe2",
            backgroundColor: "#f4f5f7",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "row",
            gap: 8,
          }}
        >
          <ActivityIndicator color="#0b7180" size="small" />
          <Text selectable={false} style={{ color: "#68707d", fontSize: 13, fontWeight: "900" }}>
            Loading cards
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const CommunityFeedCardItem = memo(function CommunityFeedCardItem({
  entry,
  cardPreviewWidth,
  onToggleLike,
  onOpenComments,
  onExportCardImage,
}: {
  entry: CommunityCardPayload;
  cardPreviewWidth: number;
  onToggleLike: (cardId: string, liked: boolean) => void;
  onOpenComments: (cardId: string) => void;
  onExportCardImage: (card: CardDraft, cardName: string, footerOwnerName?: string, imageUrl?: string) => Promise<void>;
}) {
  // Use the lean row fields (not the card JSON) so this works whether the feed
  // payload carries a full card or just display metadata.
  const cardName = entry.name || "Untitled Card";
  const label = entry.typeLine || "Community card";
  const cardAspectRatio = getTypeFrameSpec(getPreviewTypeFrame(entry.card)).aspectRatio;
  const cardPreviewHeight = cardPreviewWidth / cardAspectRatio;
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    setImageLoaded(false);
  }, [entry.id, entry.imageUrl, cardPreviewWidth]);

  return (
    <View
      style={{
        borderBottomWidth: 1,
        borderBottomColor: "#eceef2",
        paddingVertical: 14,
        gap: 12,
        minHeight: cardPreviewHeight + COMMUNITY_FEED_CARD_ROW_CHROME_HEIGHT,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <View
          style={{
            width: 38,
            height: 38,
            borderRadius: 19,
            backgroundColor: "#151820",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Users size={18} color="#ffffff" strokeWidth={2.5} />
        </View>
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <Text selectable={false} numberOfLines={1} style={{ color: "#151820", fontSize: 14, fontWeight: "900" }}>
            {cardName}
          </Text>
          <Text selectable={false} numberOfLines={1} style={{ color: "#68707d", fontSize: 12, fontWeight: "800" }}>
            {entry.authorName} · Level {entry.authorLevel} · {label}
          </Text>
        </View>
      </View>

      <View
        style={{
          alignItems: "center",
          backgroundColor: "#f4f5f7",
          paddingVertical: 12,
        }}
      >
        <View
          style={{
            width: cardPreviewWidth,
            height: cardPreviewHeight,
            minHeight: cardPreviewHeight,
            borderRadius: 9,
            overflow: "hidden",
            backgroundColor: "#e7e9ee",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          {entry.imageUrl ? (
            <>
              {!imageLoaded ? <CommunityCardImagePlaceholder /> : null}
              <ExpoImage
                source={{ uri: getResizedCommunityImageUrl(entry.imageUrl, cardPreviewWidth) }}
                contentFit="contain"
                transition={180}
                cachePolicy="memory-disk"
                recyclingKey={entry.id}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageLoaded(true)}
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  opacity: imageLoaded ? 1 : 0,
                }}
              />
            </>
          ) : (
            <CardPreview
              card={entry.card}
              activeSection={null}
              width={cardPreviewWidth}
              cornerRadius={9}
              footerOwnerName={entry.authorName}
              onSectionPress={noopCardPreviewHandler}
              onChange={noopCardPreviewHandler}
            />
          )}
        </View>
      </View>

      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <CommunityFeedActionButton
          label={`${entry.likedByViewer ? "Unlike" : "Like"} ${cardName}`}
          icon={
            <Heart
              size={18}
              color={entry.likedByViewer ? "#d93a4a" : "#46505d"}
              fill={entry.likedByViewer ? "#d93a4a" : "transparent"}
              strokeWidth={2.5}
            />
          }
          text={`${entry.likeCount}`}
          selected={entry.likedByViewer}
          onPress={() => onToggleLike(entry.id, !entry.likedByViewer)}
        />
        <CommunityFeedActionButton
          label={`Comment on ${cardName}`}
          icon={<MessageCircle size={18} color="#46505d" strokeWidth={2.5} />}
          text={`${entry.commentCount}`}
          onPress={() => onOpenComments(entry.id)}
        />
        <CommunityFeedActionButton
          label={`Save rendered image for ${cardName}`}
          icon={<Download size={18} color="#46505d" strokeWidth={2.5} />}
          onPress={() => void onExportCardImage(entry.card, cardName, entry.authorName, entry.imageUrl)}
        />
      </View>
    </View>
  );
});

const CommunityFallbackCardItem = memo(function CommunityFallbackCardItem({
  entry,
  cardPreviewWidth,
  onExportCardImage,
}: {
  entry: { id: string; setName: string; card: CardDraft };
  cardPreviewWidth: number;
  onExportCardImage: (card: CardDraft, cardName: string, footerOwnerName?: string, imageUrl?: string) => Promise<void>;
}) {
  const face = getEditableCardFace(entry.card);
  const cardName = face.name || "Untitled Card";

  return (
    <View
      style={{
        borderBottomWidth: 1,
        borderBottomColor: "#eceef2",
        paddingVertical: 14,
        gap: 12,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <View
          style={{
            width: 38,
            height: 38,
            borderRadius: 19,
            backgroundColor: "#151820",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Users size={18} color="#ffffff" strokeWidth={2.5} />
        </View>
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <Text selectable={false} numberOfLines={1} style={{ color: "#151820", fontSize: 14, fontWeight: "900" }}>
            {cardName}
          </Text>
          <Text selectable={false} numberOfLines={1} style={{ color: "#68707d", fontSize: 12, fontWeight: "800" }}>
            {entry.setName} · Local preview
          </Text>
        </View>
      </View>

      <View
        style={{
          alignItems: "center",
          backgroundColor: "#f4f5f7",
          paddingVertical: 12,
        }}
      >
        <CardPreview
          card={entry.card}
          activeSection={null}
          width={cardPreviewWidth}
          cornerRadius={9}
          footerOwnerName={entry.setName}
          onSectionPress={noopCardPreviewHandler}
          onChange={noopCardPreviewHandler}
        />
      </View>

      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <CommunityFeedActionButton
          label={`Save rendered image for ${cardName}`}
          icon={<Download size={18} color="#46505d" strokeWidth={2.5} />}
          onPress={() => void onExportCardImage(entry.card, cardName, entry.setName)}
        />
      </View>
    </View>
  );
});

function CommunityFeedActionButton({
  label,
  icon,
  text,
  selected = false,
  onPress,
}: {
  label: string;
  icon: ReactNode;
  text?: string;
  selected?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={{
        flex: 1,
        minHeight: 40,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: selected ? "rgba(217,58,74,0.28)" : "#d8dbe2",
        backgroundColor: selected ? "rgba(217,58,74,0.08)" : "#ffffff",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        paddingHorizontal: 8,
      }}
    >
      {icon}
      {typeof text === "string" ? (
        <Text selectable={false} numberOfLines={1} style={{ color: selected ? "#a62231" : "#46505d", fontSize: 12, fontWeight: "900" }}>
          {text}
        </Text>
      ) : null}
    </Pressable>
  );
}

function CommunityCardImagePlaceholder() {
  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "#e7e9ee",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <ActivityIndicator color="#0b7180" size="small" />
    </View>
  );
}

function CommunitySetsPreview({
  sets,
  viewerUserId,
  selectedSetId,
  cardsBySetId,
  loadingSetId,
  errorBySetId,
  visibleCardCountsBySetId,
  onOpenSet,
  onToggleSetFollow,
  onShowMoreSetCards,
  onExportCardImage,
}: {
  sets: CommunitySetPayload[];
  viewerUserId?: string;
  selectedSetId: string | null;
  cardsBySetId: Record<string, CommunitySetCardPayload[]>;
  loadingSetId: string | null;
  errorBySetId: Record<string, string>;
  visibleCardCountsBySetId: Record<string, number>;
  onOpenSet: (set: CommunitySetPayload) => void;
  onToggleSetFollow: (setId: string, followed: boolean) => void;
  onShowMoreSetCards: (setId: string) => void;
  onExportCardImage: (card: CardDraft, cardName: string, footerOwnerName?: string, imageUrl?: string) => Promise<void>;
}) {
  const { width: windowWidth } = useWindowDimensions();
  const cardPreviewWidth =
    windowWidth >= 900 ? 360 :
    windowWidth >= 620 ? 330 :
    Math.min(320, Math.max(270, windowWidth - 56));

  if (sets.length === 0) {
    return (
      <CommunityEmptyState
        icon={<BookOpen size={24} color="#68707d" strokeWidth={2.4} />}
        title="No community sets yet"
        detail="The directory is ready for published set metadata, cover images, card counts, authors, and sort indexes."
      />
    );
  }

  return (
    <View style={{ padding: 12, gap: 10 }}>
      {sets.map((set) => {
        const expanded = selectedSetId === set.id;
        const setCards = cardsBySetId[set.id] ?? [];
        const visibleCardCount = Math.min(
          setCards.length,
          visibleCardCountsBySetId[set.id] ?? COMMUNITY_SET_INITIAL_RENDERED_CARD_COUNT,
        );
        const visibleSetCards = setCards.slice(0, visibleCardCount);
        const loading = loadingSetId === set.id;
        const error = errorBySetId[set.id];
        const viewerOwnsSet = Boolean(viewerUserId && viewerUserId === set.userId);

        return (
          <View
            key={set.id}
            style={{
              borderRadius: 10,
              borderCurve: "continuous",
              borderWidth: 1,
              borderColor: expanded ? "#9edbe5" : "#eceef2",
              backgroundColor: expanded ? "#f7fdfe" : "#fbfcfe",
              overflow: "hidden",
            }}
          >
            <View
              style={{
                minHeight: 72,
                padding: 10,
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
              }}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${expanded ? "Collapse" : "View"} ${set.name}`}
                accessibilityState={{ expanded }}
                onPress={() => onOpenSet(set)}
                style={({ pressed }) => ({
                  flex: 1,
                  minWidth: 0,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                  opacity: pressed ? 0.72 : 1,
                })}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    backgroundColor: "#151820",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <BookOpen size={21} color="#ffffff" strokeWidth={2.5} />
                </View>
                <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                  <Text selectable={false} numberOfLines={1} style={{ color: "#151820", fontSize: 14, fontWeight: "900" }}>
                    {set.name}
                  </Text>
                  <Text selectable={false} numberOfLines={1} style={{ color: "#68707d", fontSize: 12, fontWeight: "800" }}>
                    {set.authorName} · Level {set.authorLevel} · {set.cardCount} {set.cardCount === 1 ? "card" : "cards"}
                  </Text>
                  <Text selectable={false} numberOfLines={1} style={{ color: "#8a93a3", fontSize: 11, fontWeight: "900", textTransform: "uppercase" }}>
                    {set.code ?? "SET"} · {set.followerCount} {set.followerCount === 1 ? "viewer" : "viewers"}
                  </Text>
                </View>
              </Pressable>
              {viewerOwnsSet ? (
                <View
                  style={{
                    minHeight: 34,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: "#d8dbe2",
                    backgroundColor: "#f4f5f7",
                    alignItems: "center",
                    justifyContent: "center",
                    paddingHorizontal: 10,
                  }}
                >
                  <Text selectable={false} numberOfLines={1} style={{ color: "#68707d", fontSize: 11, fontWeight: "900" }}>
                    Your set
                  </Text>
                </View>
              ) : (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: set.followedByViewer }}
                  accessibilityLabel={`${set.followedByViewer ? "Stop viewing" : "Follow"} ${set.name}`}
                  onPress={() => onToggleSetFollow(set.id, !set.followedByViewer)}
                  style={{
                    minHeight: 34,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: set.followedByViewer ? "#0b7180" : "#d8dbe2",
                    backgroundColor: set.followedByViewer ? "rgba(11,113,128,0.1)" : "#ffffff",
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "row",
                    gap: 6,
                    paddingHorizontal: 10,
                  }}
                >
                  <Eye size={15} color={set.followedByViewer ? "#0b7180" : "#46505d"} strokeWidth={2.5} />
                  <Text selectable={false} numberOfLines={1} style={{ color: set.followedByViewer ? "#0b7180" : "#46505d", fontSize: 11, fontWeight: "900" }}>
                    {set.followedByViewer ? "Viewing" : "Follow"}
                  </Text>
                </Pressable>
              )}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${expanded ? "Collapse" : "View"} ${set.name}`}
                accessibilityState={{ expanded }}
                onPress={() => onOpenSet(set)}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 17,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {expanded ? (
                  <ChevronUp size={18} color="#46505d" strokeWidth={2.6} />
                ) : (
                  <ChevronDown size={18} color="#46505d" strokeWidth={2.6} />
                )}
              </Pressable>
            </View>

            {expanded ? (
              <View style={{ borderTopWidth: 1, borderTopColor: "#e2f1f4", padding: 10, gap: 12 }}>
                {loading ? (
                  <View style={{ minHeight: 54, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 }}>
                    <ActivityIndicator color="#0b7180" size="small" />
                    <Text selectable={false} style={{ color: "#68707d", fontSize: 12, fontWeight: "900" }}>
                      Loading set cards
                    </Text>
                  </View>
                ) : error ? (
                  <Text selectable style={{ color: "#a62231", fontSize: 12, lineHeight: 17, fontWeight: "800" }}>
                    {error}
                  </Text>
                ) : setCards.length === 0 ? (
                  <Text selectable={false} style={{ color: "#68707d", fontSize: 12, lineHeight: 17, fontWeight: "800" }}>
                    No public cards are available for this set.
                  </Text>
                ) : (
                  <>
                    {visibleSetCards.map((entry) => (
                      <CommunitySetCardPreview
                        key={entry.id}
                        entry={entry}
                        cardPreviewWidth={cardPreviewWidth}
                        onExportCardImage={onExportCardImage}
                      />
                    ))}
                    {visibleCardCount < setCards.length ? (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Load more cards from ${set.name}`}
                        onPress={() => onShowMoreSetCards(set.id)}
                        style={({ pressed }) => ({
                          minHeight: 42,
                          borderRadius: 999,
                          borderWidth: 1,
                          borderColor: "#d8dbe2",
                          backgroundColor: pressed ? "#eef1f5" : "#ffffff",
                          alignItems: "center",
                          justifyContent: "center",
                          paddingHorizontal: 12,
                          opacity: pressed ? 0.78 : 1,
                        })}
                      >
                        <Text selectable={false} numberOfLines={1} style={{ color: "#151820", fontSize: 12, fontWeight: "900" }}>
                          Load {Math.min(COMMUNITY_SET_RENDERED_CARD_BATCH_SIZE, setCards.length - visibleCardCount)} more cards
                        </Text>
                      </Pressable>
                    ) : null}
                  </>
                )}
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

function CommunitySetCardPreview({
  entry,
  cardPreviewWidth,
  onExportCardImage,
}: {
  entry: CommunitySetCardPayload;
  cardPreviewWidth: number;
  onExportCardImage: (card: CardDraft, cardName: string, footerOwnerName?: string, imageUrl?: string) => Promise<void>;
}) {
  const cardName = entry.name || "Untitled Card";
  const cardAspectRatio = getTypeFrameSpec(getPreviewTypeFrame(entry.card)).aspectRatio;
  const cardPreviewHeight = cardPreviewWidth / cardAspectRatio;
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    setImageLoaded(false);
  }, [entry.id, entry.imageUrl, cardPreviewWidth]);

  return (
    <View style={{ gap: 8 }}>
      <View style={{ gap: 2 }}>
        <Text selectable={false} numberOfLines={1} style={{ color: "#151820", fontSize: 13, fontWeight: "900" }}>
          {cardName}
        </Text>
        <Text selectable={false} numberOfLines={1} style={{ color: "#68707d", fontSize: 11, fontWeight: "800" }}>
          {entry.typeLine || "Community card"}
        </Text>
      </View>
      <View
        style={{
          alignItems: "center",
          backgroundColor: "transparent",
        }}
      >
        <View
          style={{
            width: cardPreviewWidth,
            height: cardPreviewHeight,
            minHeight: cardPreviewHeight,
            borderRadius: 9,
            overflow: "hidden",
            backgroundColor: "#e7e9ee",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          {entry.imageUrl ? (
            <>
              {!imageLoaded ? <CommunityCardImagePlaceholder /> : null}
              <ExpoImage
                source={{ uri: getResizedCommunityImageUrl(entry.imageUrl, cardPreviewWidth) }}
                contentFit="contain"
                transition={180}
                cachePolicy="memory-disk"
                recyclingKey={`set-${entry.id}`}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageLoaded(true)}
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  opacity: imageLoaded ? 1 : 0,
                }}
              />
            </>
          ) : (
            <CardPreview
              card={entry.card}
              activeSection={null}
              width={cardPreviewWidth}
              cornerRadius={9}
              footerOwnerName={entry.authorName}
              onSectionPress={noopCardPreviewHandler}
              onChange={noopCardPreviewHandler}
            />
          )}
        </View>
      </View>
      <CommunityFeedActionButton
        label={`Save rendered image for ${cardName}`}
        icon={<Download size={18} color="#46505d" strokeWidth={2.5} />}
        onPress={() => void onExportCardImage(entry.card, cardName, entry.authorName, entry.imageUrl)}
      />
    </View>
  );
}

function CommunityEmptyState({
  icon,
  title,
  detail,
}: {
  icon: ReactNode;
  title: string;
  detail: string;
}) {
  return (
    <View style={{ padding: 22, alignItems: "center", gap: 10 }}>
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: "#f0f2f5",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </View>
      <View style={{ gap: 4 }}>
        <Text selectable={false} style={{ color: "#151820", fontSize: 16, fontWeight: "900", textAlign: "center" }}>
          {title}
        </Text>
        <Text selectable style={{ color: "#68707d", fontSize: 12, lineHeight: 17, fontWeight: "800", textAlign: "center" }}>
          {detail}
        </Text>
      </View>
    </View>
  );
}

