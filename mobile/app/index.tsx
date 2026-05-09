import { Feather, Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { Link, router } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewToken,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAskAi } from "../contexts/AskAiChatContext";
import { fetchFeed } from "../lib/feed";
import type { FeedPost } from "../lib/fixtures";
import { resolveCareerIdFromTag } from "../lib/fixtures";
import { APP_TAB_BAR_HEIGHT } from "../lib/layout";
import { recordFeedImpression } from "../lib/recentFeedBuffer";
import { trackEvent } from "../lib/sessionSignals";

const WIN_H = Dimensions.get("window").height;

/** TikTok-style double-tap window (ms). */
const DOUBLE_TAP_MS = 280;

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 10_000) return `${Math.round(n / 1000)}K`;
  if (n >= 1_000) return n.toLocaleString("en-US");
  return String(n);
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { visible: askVisible, openFromFeed } = useAskAi();
  const [tab, setTab] = useState<"foryou" | "following">("foryou");
  const [activeId, setActiveId] = useState<string | null>(null);

  const { data: posts, isLoading } = useQuery({
    queryKey: ["feed"],
    queryFn: fetchFeed,
  });

  const items = posts ?? [];

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const v = viewableItems.find((x) => x.isViewable);
      const post = v?.item as FeedPost | undefined;
      if (post) {
        setActiveId(post.id);
        recordFeedImpression(post);
        void trackEvent({
          type: "view",
          postId: post.id,
          career: post.career_tag,
          fraction: 0.8,
        });
      }
    },
    [],
  );

  const viewabilityConfig = useMemo(
    () => ({ itemVisiblePercentThreshold: 65 }),
    [],
  );

  if (isLoading) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color="#fff" size="large" />
      </View>
    );
  }

  const listData = tab === "following" ? [] : items;

  return (
    <View style={styles.root}>
      <View
        style={[styles.header, { paddingTop: insets.top + 8 }]}
        pointerEvents="box-none"
      >
        <View style={styles.headerTabs}>
          <Pressable onPress={() => setTab("following")}>
            <Text style={[styles.tabText, tab === "following" && styles.tabOn]}>
              Following
            </Text>
          </Pressable>
          <Pressable onPress={() => setTab("foryou")} style={styles.tabForyou}>
            <Text style={[styles.tabText, tab === "foryou" && styles.tabOn]}>
              For You
            </Text>
            {tab === "foryou" && <View style={styles.tabDot} />}
          </Pressable>
        </View>
        <View style={styles.headerIcons}>
          <Link href="/search" asChild>
            <Pressable hitSlop={12}>
              <Feather name="search" size={24} color="#fff" />
            </Pressable>
          </Link>
          <Link href="/settings" asChild>
            <Pressable hitSlop={12}>
              <Feather name="more-horizontal" size={24} color="#fff" />
            </Pressable>
          </Link>
        </View>
      </View>

      <FlatList
        data={listData}
        scrollEnabled={!askVisible}
        keyExtractor={(item) => item.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        decelerationRate="fast"
        snapToAlignment="start"
        viewabilityConfig={viewabilityConfig}
        onViewableItemsChanged={onViewableItemsChanged}
        renderItem={({ item }) => (
          <FeedCard
            post={item}
            isActive={activeId === item.id}
            onAskAi={() => {
              openFromFeed(item);
              void trackEvent({ type: "ask_ai", career: item.career_tag });
            }}
          />
        )}
        ListEmptyComponent={
          tab === "following" ? (
            <View style={[styles.emptyPage, { height: WIN_H }]}>
              <Feather name="users" size={48} color="#64748b" />
              <Text style={styles.emptyTitle}>No followed creators yet</Text>
              <Text style={styles.emptySub}>
                Tap the + on a creator avatar in For You, or explore careers in Search.
              </Text>
              <Pressable style={styles.cta} onPress={() => setTab("foryou")}>
                <Text style={styles.ctaText}>Explore For You</Text>
              </Pressable>
              <Link href="/search" asChild>
                <Pressable style={[styles.cta, styles.ctaSecondary]}>
                  <Text style={styles.ctaSecondaryText}>Browse careers</Text>
                </Pressable>
              </Link>
            </View>
          ) : (
            <View style={[styles.emptyPage, { height: WIN_H }]}>
              <Text style={styles.emptyTitle}>No videos yet</Text>
              <Text style={styles.emptySub}>
                Publish rows to feed_posts in Supabase to populate the feed.
              </Text>
            </View>
          )
        }
        getItemLayout={(_, index) => ({
          length: WIN_H,
          offset: WIN_H * index,
          index,
        })}
      />

    </View>
  );
}

function FeedCard({
  post,
  isActive,
  onAskAi,
}: {
  post: FeedPost;
  isActive: boolean;
  onAskAi: () => void;
}) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const lastTapMs = useRef(0);

  const toggleLike = useCallback(() => {
    setLiked((prev) => {
      const next = !prev;
      if (next)
        void trackEvent({ type: "like", postId: post.id, career: post.career_tag });
      return next;
    });
  }, [post.career_tag, post.id]);

  const likeFromDoubleTap = useCallback(() => {
    setLiked((was) => {
      if (was) return was;
      void trackEvent({ type: "like", postId: post.id, career: post.career_tag });
      return true;
    });
  }, [post.career_tag, post.id]);

  const onVideoAreaPress = useCallback(() => {
    const now = Date.now();
    if (now - lastTapMs.current < DOUBLE_TAP_MS) {
      lastTapMs.current = 0;
      likeFromDoubleTap();
    } else {
      lastTapMs.current = now;
    }
  }, [likeFromDoubleTap]);

  const initial = post.handle.replace("@", "")[0]?.toUpperCase() ?? "P";
  const careerPath = resolveCareerIdFromTag(post.career_tag);

  return (
    <View style={{ height: WIN_H, width: "100%" }}>
      <LinearGradient
        colors={[...post.gradientColors]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Pressable
        style={styles.doubleTapLayer}
        onPress={onVideoAreaPress}
        accessibilityLabel="Double-tap to like"
      />
      <View style={styles.rail}>
        <View style={styles.avatarWrap}>
          <LinearGradient
            colors={["#e879f9", "#fb7185"]}
            style={styles.avatar}
          >
            <Text style={styles.avatarText}>{initial}</Text>
          </LinearGradient>
          <View style={styles.plusBadge}>
            <Feather name="plus" size={14} color="#fff" />
          </View>
        </View>

        <RailBtn
          icon={
            <Ionicons
              name={liked ? "heart" : "heart-outline"}
              size={30}
              color={liked ? "#ff3040" : "#fff"}
            />
          }
          label={formatCount(post.likes + (liked ? 1 : 0))}
          onPress={toggleLike}
        />
        <RailBtn
          icon={<Feather name="message-circle" size={28} color="#fff" />}
          label={formatCount(post.comments)}
        />
        <RailBtn
          icon={
            <Ionicons
              name={saved ? "bookmark" : "bookmark-outline"}
              size={28}
              color={saved ? "#f4d03f" : "#fff"}
            />
          }
          label={formatCount(post.saves + (saved ? 1 : 0))}
          onPress={() => {
            const next = !saved;
            setSaved(next);
            if (next)
              void trackEvent({ type: "save", postId: post.id, career: post.career_tag });
          }}
        />
        <RailBtn
          icon={<Feather name="send" size={28} color="#fff" />}
          label={formatCount(post.shares)}
        />

        <Pressable
          onPress={onAskAi}
          style={styles.aiCircle}
          accessibilityLabel="Ask AI"
        >
          <Feather name="zap" size={22} color="#fff" />
        </Pressable>
      </View>

      <View style={[styles.meta, { paddingBottom: APP_TAB_BAR_HEIGHT + 34 }]}>
        <Pressable
          onPress={() => router.push(`/career/${careerPath}`)}
          style={styles.careerPill}
        >
          <Text style={styles.careerPillEmoji}>💼</Text>
          <Text style={styles.careerPillText}>{post.career_tag}</Text>
        </Pressable>
        <Text style={styles.handle}>{post.handle}</Text>
        <Text style={styles.caption} numberOfLines={2}>
          {post.caption}
        </Text>
      </View>

      {isActive && (
        <View style={styles.progressOuter}>
          <View style={styles.progressInner} />
        </View>
      )}
    </View>
  );
}

function RailBtn({
  icon,
  label,
  onPress,
}: {
  icon: ReactNode;
  label: string;
  onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.railBtn}>
      {icon}
      <Text style={styles.railLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },
  center: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  headerTabs: { flexDirection: "row", alignItems: "center", gap: 20 },
  tabForyou: { flexDirection: "row", alignItems: "center", gap: 6 },
  tabText: { fontSize: 16, fontWeight: "600", color: "rgba(255,255,255,0.55)" },
  tabOn: { color: "#fff" },
  tabDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#fff",
  },
  headerIcons: { flexDirection: "row", alignItems: "center", gap: 14 },

  /** Below meta / rail so career pill and actions stay tappable. */
  doubleTapLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
  },

  /** Sit above tab bar; tuned so AI button lines up with caption text. */
  rail: {
    position: "absolute",
    right: 12,
    bottom: APP_TAB_BAR_HEIGHT + 42,
    zIndex: 10,
    alignItems: "center",
    gap: 28,
  },
  avatarWrap: { alignItems: "center" },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 16, fontWeight: "700", color: "#fff" },
  plusBadge: {
    position: "absolute",
    bottom: -8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#f43f5e",
    alignItems: "center",
    justifyContent: "center",
  },
  railBtn: { alignItems: "center", gap: 4 },
  railLabel: { fontSize: 11, fontWeight: "700", color: "#fff" },

  aiCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(147,51,234,0.95)",
    alignItems: "center",
    justifyContent: "center",
  },

  meta: {
    position: "absolute",
    left: 0,
    right: 70,
    bottom: 0,
    zIndex: 5,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  careerPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 12,
  },
  careerPillEmoji: { fontSize: 14 },
  careerPillText: { fontSize: 12, fontWeight: "600", color: "#fff" },
  handle: { fontSize: 15, fontWeight: "800", color: "#fff" },
  caption: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    color: "rgba(255,255,255,0.88)",
  },

  progressOuter: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: APP_TAB_BAR_HEIGHT + 12,
    height: 2,
    borderRadius: 1,
    backgroundColor: "rgba(255,255,255,0.15)",
    overflow: "hidden",
  },
  progressInner: {
    width: "33%",
    height: "100%",
    backgroundColor: "rgba(255,255,255,0.85)",
  },

  emptyPage: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    backgroundColor: "#000",
    gap: 10,
  },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#fff", textAlign: "center" },
  emptySub: {
    fontSize: 14,
    color: "#94a3b8",
    textAlign: "center",
  },
  cta: {
    marginTop: 8,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
  },
  ctaText: { fontSize: 14, fontWeight: "700", color: "#000" },
  ctaSecondary: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
  },
  ctaSecondaryText: { fontSize: 14, fontWeight: "600", color: "#fff" },
});
