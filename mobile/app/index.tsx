import { Feather, Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useIsFocused } from "@react-navigation/native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { Link, router } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ComponentRef, MutableRefObject, ReactNode } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewToken,
} from "react-native";
import {
  FlatList as GHFlatList,
  Gesture,
  GestureDetector,
} from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAskAi } from "../contexts/AskAiChatContext";
import { captureFeedVision, registerFeedVision } from "../lib/feedVisionRegistry";
import { fetchFeed } from "../lib/feed";
import type { FeedPost } from "../lib/fixtures";
import { resolveCareerIdFromTag } from "../lib/fixtures";
import {
  homeFeedListRef,
  homeFeedSwitchToForYouRef,
} from "../lib/homeFeedListRef";
import {
  selectionHaptic,
  successHaptic,
  tapHaptic,
} from "../lib/haptics";
import { APP_TAB_BAR_HEIGHT } from "../lib/layout";
import { recordFeedImpression } from "../lib/recentFeedBuffer";
import { trackEvent } from "../lib/sessionSignals";
import type { VisionPayload } from "../lib/visionTypes";

const WIN_H = Dimensions.get("window").height;
const WIN_W = Dimensions.get("window").width;

/** Matches `styles.rail`: avatar → … → save → share → AI anchored above tab bar. */
const RAIL_ANCHOR_BOTTOM = 118;
const RAIL_AI_H = 48;
const RAIL_GAP = 28;
/** Approx height of one `RailBtn` (icon + label + gaps). */
const RAIL_ACTION_BLOCK_H = 46;

/**
 * Distance from screen bottom to the bottom edge of the save button block in the rail.
 */
const SAVE_RAIL_BTN_BOTTOM =
  RAIL_ANCHOR_BOTTOM +
  RAIL_AI_H +
  RAIL_GAP +
  RAIL_ACTION_BLOCK_H +
  RAIL_GAP +
  RAIL_ACTION_BLOCK_H;

/** Dots under save, nudged toward tab bar; horizontally centered (`slideMarkers`). */
const SLIDE_MARKERS_BOTTOM = SAVE_RAIL_BTN_BOTTOM - 14 - 28;

type ClipPlaybackInfo = {
  /** 0–1 along the clip timeline */
  progress: number;
  playing: boolean;
  buffering: boolean;
};

/** Seek by fraction 0–1; wired from `FeedClipVideo` when the clip is active. */
function ClipSeekBar({
  progress,
  playing,
  buffering,
  seek,
}: {
  progress: number;
  playing: boolean;
  buffering: boolean;
  seek: (fraction: number) => void;
}) {
  const [scrubFraction, setScrubFraction] = useState<number | null>(null);
  const trackWidthRef = useRef(0);

  const shown = scrubFraction ?? progress;

  const seekFromX = useCallback(
    (locationX: number) => {
      const w = trackWidthRef.current;
      if (!(w > 0)) return;
      const f = Math.min(1, Math.max(0, locationX / w));
      seek(f);
      setScrubFraction(f);
    },
    [seek],
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_e, g) =>
          Math.abs(g.dx) > 4 || Math.abs(g.dy) > 4,
        onPanResponderGrant: (e) => {
          tapHaptic();
          seekFromX(e.nativeEvent.locationX);
        },
        onPanResponderMove: (e) => seekFromX(e.nativeEvent.locationX),
        onPanResponderRelease: () => setScrubFraction(null),
        onPanResponderTerminate: () => setScrubFraction(null),
      }),
    [seekFromX],
  );

  return (
    <View
      style={[
        styles.progressScrubWrap,
        !playing && styles.progressOuterPaused,
        buffering && styles.progressOuterBuffering,
      ]}
      accessibilityRole="adjustable"
      accessibilityLabel="Video scrubber"
      {...panResponder.panHandlers}
    >
      <View
        style={styles.progressOuter}
        pointerEvents="none"
        onLayout={(e) => {
          trackWidthRef.current = e.nativeEvent.layout.width;
        }}
      >
        <View
          style={[
            styles.progressInner,
            {
              width: `${Math.min(100, Math.max(0, shown * 100))}%`,
            },
          ]}
        />
      </View>
    </View>
  );
}

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
  const isFocused = useIsFocused();
  const { visible: askVisible, openFromFeed } = useAskAi();
  const [tab, setTab] = useState<"foryou" | "following">("foryou");
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    homeFeedSwitchToForYouRef.current = () => {
      setTab("foryou");
    };
    return () => {
      homeFeedSwitchToForYouRef.current = null;
    };
  }, []);

  const { data: posts, isLoading, isFetching } = useQuery({
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
      }
    },
    [],
  );

  const viewabilityConfig = useMemo(
    () => ({ itemVisiblePercentThreshold: 65 }),
    [],
  );

  const listData = tab === "following" ? [] : items;

  return (
    <View style={styles.root}>
      <View
        style={[styles.header, { paddingTop: insets.top + 8 }]}
        pointerEvents="box-none"
      >
        <View style={styles.headerTabs}>
          <Pressable
            onPressIn={() => selectionHaptic()}
            onPress={() => setTab("following")}
          >
            <Text style={[styles.tabText, tab === "following" && styles.tabOn]}>
              Following
            </Text>
          </Pressable>
          <Pressable
            onPressIn={() => selectionHaptic()}
            onPress={() => setTab("foryou")}
            style={styles.tabForyou}
          >
            <Text style={[styles.tabText, tab === "foryou" && styles.tabOn]}>
              For You
            </Text>
            {tab === "foryou" && <View style={styles.tabDot} />}
          </Pressable>
        </View>
        <View style={styles.headerIcons}>
          <Link href="/search" asChild>
            <Pressable hitSlop={12} onPressIn={() => tapHaptic()}>
              <Feather name="search" size={24} color="#fff" />
            </Pressable>
          </Link>
          <Link href="/settings" asChild>
            <Pressable hitSlop={12} onPressIn={() => tapHaptic()}>
              <Feather name="more-horizontal" size={24} color="#fff" />
            </Pressable>
          </Link>
        </View>
      </View>

      {isLoading ? (
        <View style={[styles.center, { paddingTop: insets.top }]}>
          <ActivityIndicator color="#fff" size="large" />
        </View>
      ) : (
        <FlatList
          ref={(el) => {
            homeFeedListRef.current = el;
          }}
          data={listData}
          scrollEnabled={!askVisible}
          keyExtractor={(item) => item.id}
          pagingEnabled
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}
          decelerationRate="fast"
          snapToAlignment="start"
          viewabilityConfig={viewabilityConfig}
          onViewableItemsChanged={onViewableItemsChanged}
          renderItem={({ item }) => (
            <FeedCard
              post={item}
              isActive={isFocused && activeId === item.id}
              onAskAi={async () => {
                const vision = await captureFeedVision(item.id);
                openFromFeed(item, vision);
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
                <Pressable
                  style={styles.cta}
                  onPressIn={() => tapHaptic()}
                  onPress={() => setTab("foryou")}
                >
                  <Text style={styles.ctaText}>Explore For You</Text>
                </Pressable>
                <Link href="/search" asChild>
                  <Pressable
                    style={[styles.cta, styles.ctaSecondary]}
                    onPressIn={() => tapHaptic()}
                  >
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
      )}

      {!isLoading && isFetching && items.length > 0 ? (
        <View style={styles.feedRefetchOverlay} pointerEvents="none">
          <ActivityIndicator color="#fff" size="large" />
        </View>
      ) : null}
    </View>
  );
}

function FeedClipVideo({
  uri,
  isActive,
  onPlaybackUpdate,
  onDoubleTapLike,
  clipSeekRef,
  visionCaptureRef,
  posterUrl,
}: {
  uri: string;
  isActive: boolean;
  onPlaybackUpdate?: (info: ClipPlaybackInfo) => void;
  onDoubleTapLike: () => void;
  clipSeekRef: MutableRefObject<((fraction: number) => void) | null>;
  visionCaptureRef: MutableRefObject<(() => Promise<VisionPayload>) | null>;
  posterUrl: string | null;
}) {
  const [pausedByUser, setPausedByUser] = useState(false);
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTapRef = useRef(0);

  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    p.muted = false;
    p.timeUpdateEventInterval = 0.1;
  });

  useEffect(() => {
    if (!isActive) {
      clipSeekRef.current = null;
      return;
    }

    clipSeekRef.current = (fraction: number) => {
      const dur = player.duration;
      if (!(typeof dur === "number" && Number.isFinite(dur) && dur > 0)) return;
      const t = Math.min(dur, Math.max(0, fraction * dur));
      player.currentTime = t;
      onPlaybackUpdate?.({
        progress: t / dur,
        playing: player.playing,
        buffering: player.status === "loading",
      });
    };

    return () => {
      clipSeekRef.current = null;
    };
  }, [player, isActive, onPlaybackUpdate, clipSeekRef]);

  useEffect(() => {
    if (!onPlaybackUpdate || !isActive) return;

    const sync = () => {
      const dur = player.duration;
      const cur = player.currentTime;
      const safeDur =
        typeof dur === "number" && Number.isFinite(dur) && dur > 0 ? dur : 0;
      const progress =
        safeDur > 0 ? Math.min(1, Math.max(0, cur / safeDur)) : 0;
      onPlaybackUpdate({
        progress,
        playing: player.playing,
        buffering: player.status === "loading",
      });
    };

    const subs = [
      player.addListener("timeUpdate", sync),
      player.addListener("playingChange", sync),
      player.addListener("statusChange", sync),
      player.addListener("sourceLoad", sync),
    ];
    sync();

    return () => {
      for (const s of subs) s.remove();
    };
  }, [player, onPlaybackUpdate, isActive]);

  useEffect(() => {
    if (!isActive) setPausedByUser(false);
  }, [isActive]);

  useEffect(() => {
    if (isActive && !pausedByUser) void player.play();
    else player.pause();
  }, [isActive, pausedByUser, player]);

  useEffect(
    () => () => {
      if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
    },
    [],
  );

  useEffect(() => {
    if (!isActive) {
      visionCaptureRef.current = null;
      return;
    }

    visionCaptureRef.current = async (): Promise<VisionPayload> => {
      const imageUrls: string[] = [];
      if (posterUrl?.startsWith("https://")) imageUrls.push(posterUrl);
      const imagesBase64: VisionPayload["imagesBase64"] = [];

      if (Platform.OS !== "web") {
        try {
          const t =
            typeof player.currentTime === "number" && Number.isFinite(player.currentTime)
              ? player.currentTime
              : 0;
          const dur =
            typeof player.duration === "number" &&
            Number.isFinite(player.duration) &&
            player.duration > 0
              ? player.duration
              : 0;
          const tSafe = dur > 0 ? Math.min(Math.max(0, t), dur - 0.05) : Math.max(0, t);
          const t2 =
            dur > 0 ? Math.min(Math.max(0, t - 2), dur - 0.05) : Math.max(0, t - 2);
          const times = Array.from(new Set([tSafe, t2])).slice(0, 2);
          const thumbs = await player.generateThumbnailsAsync(times, { maxWidth: 720 });
          for (const thumb of thumbs) {
            const imageRef = await ImageManipulator.manipulate(thumb).renderAsync();
            const out = await imageRef.saveAsync({
              compress: 0.82,
              format: SaveFormat.JPEG,
              base64: true,
            });
            if (out.base64) {
              imagesBase64.push({ media_type: "image/jpeg", data: out.base64 });
            }
          }
        } catch {
          /* optional thumbnails */
        }
      }

      return { imageUrls, imagesBase64 };
    };

    return () => {
      visionCaptureRef.current = null;
    };
  }, [isActive, player, posterUrl, visionCaptureRef]);

  const showPausedHint = isActive && pausedByUser;

  const onOverlayPress = useCallback(() => {
    const now = Date.now();
    if (now - lastTapRef.current < DOUBLE_TAP_MS) {
      if (tapTimerRef.current) {
        clearTimeout(tapTimerRef.current);
        tapTimerRef.current = null;
      }
      lastTapRef.current = 0;
      onDoubleTapLike();
      return;
    }
    lastTapRef.current = now;
    if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
    tapTimerRef.current = setTimeout(() => {
      tapTimerRef.current = null;
      lastTapRef.current = 0;
      tapHaptic();
      setPausedByUser((p) => !p);
    }, DOUBLE_TAP_MS);
  }, [onDoubleTapLike]);

  return (
    <View style={styles.mediaLayer}>
      <VideoView
        style={StyleSheet.absoluteFill}
        player={player}
        contentFit="cover"
        nativeControls={false}
      />
      <Pressable
        style={styles.videoTapOverlay}
        onPress={onOverlayPress}
        accessibilityLabel={
          pausedByUser
            ? "Play video. Double tap to like."
            : "Pause video. Double tap to like."
        }
      />
      {showPausedHint ? (
        <View style={styles.pauseHintWrap} pointerEvents="none">
          <Ionicons name="play" size={56} color="rgba(255,255,255,0.92)" />
        </View>
      ) : null}
    </View>
  );
}

function FeedSlideshow({
  slides,
  onDoubleTapLike,
  visionCaptureRef,
}: {
  slides: FeedPost["slideshow_slides"];
  onDoubleTapLike: () => void;
  visionCaptureRef: MutableRefObject<(() => Promise<VisionPayload>) | null>;
}) {
  type SlideRow = FeedPost["slideshow_slides"][number];
  const listRef = useRef<ComponentRef<typeof GHFlatList<SlideRow>>>(null);
  const [index, setIndex] = useState(0);

  const doubleTapGesture = useMemo(
    () =>
      Gesture.Tap()
        .numberOfTaps(2)
        .onEnd((_e, success) => {
          if (success) runOnJS(onDoubleTapLike)();
        }),
    [onDoubleTapLike],
  );

  const slideshowGestures = useMemo(
    () =>
      Gesture.Simultaneous(Gesture.Native(), doubleTapGesture),
    [doubleTapGesture],
  );

  useEffect(() => {
    visionCaptureRef.current = async (): Promise<VisionPayload> => ({
      imageUrls: slides
        .slice(0, 8)
        .map((s) => s.uri)
        .filter((u) => typeof u === "string" && u.startsWith("https://")),
      imagesBase64: [],
    });
    return () => {
      visionCaptureRef.current = null;
    };
  }, [slides, visionCaptureRef]);

  return (
    <View style={styles.mediaLayer}>
      <GestureDetector gesture={slideshowGestures}>
        <GHFlatList<SlideRow>
          ref={listRef}
          style={StyleSheet.absoluteFill}
          data={slides}
          horizontal
          pagingEnabled
          nestedScrollEnabled
          keyExtractor={(item, i) => `${i}-${item.uri}`}
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => {
            const x = e.nativeEvent.contentOffset.x;
            setIndex(
              Math.min(
                slides.length - 1,
                Math.max(0, Math.round(x / WIN_W)),
              ),
            );
          }}
          getItemLayout={(_, i) => ({
            length: WIN_W,
            offset: WIN_W * i,
            index: i,
          })}
          renderItem={({ item }) => (
            <View style={{ width: WIN_W, height: WIN_H }}>
              <Image
                source={{ uri: item.uri }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                transition={200}
              />
            </View>
          )}
        />
      </GestureDetector>
      {slides.length > 0 ? (
        <View style={styles.slideMarkers} pointerEvents="none">
          <View style={styles.slideMarkersRow}>
            {slides.map((_, i) => (
              <View
                key={`dot-${i}-${slides[i]?.uri}`}
                style={[
                  styles.slideMarkerDot,
                  i === index && styles.slideMarkerDotActive,
                ]}
              />
            ))}
          </View>
        </View>
      ) : null}
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
  const queryClient = useQueryClient();
  const bumpCareerFit = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ["careerFit"] });
  }, [queryClient]);

  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [clipPlayback, setClipPlayback] = useState<ClipPlaybackInfo>({
    progress: 0,
    playing: false,
    buffering: true,
  });

  const clipSeekRef = useRef<((fraction: number) => void) | null>(null);
  const visionCaptureRef = useRef<(() => Promise<VisionPayload>) | null>(null);

  useEffect(() => {
    return registerFeedVision(post.id, async () => {
      const fn = visionCaptureRef.current;
      if (fn) return fn();
      return { imageUrls: [], imagesBase64: [] };
    });
  }, [post.id]);

  const showVideo =
    post.post_type === "video" && Boolean(post.media_video_url?.trim());
  const showSlideshow =
    post.post_type === "slideshow" && post.slideshow_slides.length > 0;

  /** Once the clip has played without buffering, hide loading overlay until next post. */
  const [videoReadyLatch, setVideoReadyLatch] = useState(false);

  useEffect(() => {
    setVideoReadyLatch(false);
  }, [post.id]);

  useEffect(() => {
    if (showVideo && isActive && clipPlayback.playing && !clipPlayback.buffering) {
      setVideoReadyLatch(true);
    }
  }, [showVideo, isActive, clipPlayback.playing, clipPlayback.buffering]);

  const showVideoLoadingOverlay =
    showVideo &&
    isActive &&
    (!videoReadyLatch || clipPlayback.buffering);

  const onClipPlaybackUpdate = useCallback((info: ClipPlaybackInfo) => {
    setClipPlayback(info);
  }, []);

  const seekClip = useCallback((fraction: number) => {
    clipSeekRef.current?.(fraction);
  }, []);

  const onDoubleTapLike = useCallback(() => {
    successHaptic();
    setLiked((wasLiked) => {
      if (!wasLiked) {
        void trackEvent({
          type: "like",
          postId: post.id,
          career: post.career_tag,
        });
        bumpCareerFit();
      }
      return true;
    });
  }, [post.id, post.career_tag, bumpCareerFit]);

  useEffect(() => {
    if (!isActive) return;
    const start = Date.now();
    return () => {
      const sec = (Date.now() - start) / 1000;
      if (sec < 0.25) return;
      const fraction = Math.min(1, sec / 42);
      void trackEvent({
        type: "view",
        postId: post.id,
        career: post.career_tag,
        fraction,
      });
      bumpCareerFit();
    };
  }, [isActive, post.id, post.career_tag, bumpCareerFit]);

  const initial = post.handle.replace(/^@/, "")[0]?.toUpperCase() ?? "P";
  const careerPath = resolveCareerIdFromTag(post.career_tag);

  return (
    <View style={{ height: WIN_H, width: "100%" }}>
      <LinearGradient
        colors={[...post.gradientColors]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {showVideo && post.media_video_url ? (
        <FeedClipVideo
          uri={post.media_video_url}
          isActive={isActive}
          onPlaybackUpdate={onClipPlaybackUpdate}
          onDoubleTapLike={onDoubleTapLike}
          clipSeekRef={clipSeekRef}
          visionCaptureRef={visionCaptureRef}
          posterUrl={post.media_poster_url ?? null}
        />
      ) : showSlideshow ? (
        <FeedSlideshow
          slides={post.slideshow_slides}
          onDoubleTapLike={onDoubleTapLike}
          visionCaptureRef={visionCaptureRef}
        />
      ) : null}

      {showVideoLoadingOverlay ? (
        <View style={styles.feedLoadingOverlay} pointerEvents="none">
          <ActivityIndicator color="#fff" size="large" />
        </View>
      ) : null}
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
          onPress={() => {
            const next = !liked;
            setLiked(next);
            if (next) {
              void trackEvent({
                type: "like",
                postId: post.id,
                career: post.career_tag,
              });
              bumpCareerFit();
            }
          }}
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
            if (next) {
              void trackEvent({
                type: "save",
                postId: post.id,
                career: post.career_tag,
              });
              bumpCareerFit();
            }
          }}
        />
        <RailBtn
          icon={<Feather name="send" size={28} color="#fff" />}
          label={formatCount(post.shares)}
        />

        <Pressable
          onPressIn={() => tapHaptic()}
          onPress={onAskAi}
          style={styles.aiCircle}
          accessibilityLabel="Ask AI"
        >
          <Feather name="zap" size={22} color="#fff" />
        </Pressable>
      </View>

      <View style={[styles.meta, { paddingBottom: APP_TAB_BAR_HEIGHT + 34 }]}>
        <Pressable
          onPressIn={() => tapHaptic()}
          onPress={() =>
            router.push(
              `/career/${encodeURIComponent(careerPath)}?t=${encodeURIComponent(post.career_tag)}`,
            )
          }
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

      {showVideo && isActive && (
        <ClipSeekBar
          progress={clipPlayback.progress}
          playing={clipPlayback.playing}
          buffering={clipPlayback.buffering}
          seek={seekClip}
        />
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
    <Pressable
      onPressIn={() => tapHaptic()}
      onPress={onPress}
      style={styles.railBtn}
    >
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

  /** Sit above tab bar; tuned so AI button lines up with caption text. */
  rail: {
    position: "absolute",
    right: 12,
    bottom: APP_TAB_BAR_HEIGHT + 42,
    zIndex: 30,
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
    zIndex: 25,
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

  mediaLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  videoTapOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
  },
  pauseHintWrap: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 3,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.12)",
  },
  slideMarkers: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: SLIDE_MARKERS_BOTTOM,
    zIndex: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  slideMarkersRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    flexWrap: "wrap",
    maxWidth: "88%",
  },
  slideMarkerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.28)",
  },
  /** Active slide: same circle shape, brighter / slightly larger (“lit”). */
  slideMarkerDotActive: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: "#fff",
    opacity: 1,
    shadowColor: "#fff",
    shadowOpacity: 0.55,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },

  /** Full-screen dim + spinner while feed refetches (keeps prior items visible). */
  feedRefetchOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.28)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 40,
  },

  /** Until the active clip is playing, dim the card and show a loader. */
  feedLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 14,
  },

  /** Extra vertical padding for scrubbing without overlapping the tab bar. */
  progressScrubWrap: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: APP_TAB_BAR_HEIGHT + 12,
    paddingVertical: 12,
    justifyContent: "center",
    zIndex: 35,
  },
  progressOuter: {
    height: 3,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.15)",
    overflow: "hidden",
  },
  progressOuterPaused: {
    opacity: 0.55,
  },
  progressOuterBuffering: {
    opacity: 0.75,
  },
  progressInner: {
    height: "100%",
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 1,
  },

  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 76,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-around",
    paddingHorizontal: 24,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(0,0,0,0.95)",
    zIndex: 20,
  },
  bottomItem: { flex: 1, alignItems: "center", gap: 4 },
  bottomLabel: { fontSize: 11, fontWeight: "600", color: "rgba(255,255,255,0.6)" },
  bottomLabelOn: { fontSize: 11, fontWeight: "700", color: "#fff" },
  createBtn: {
    width: 56,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
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
