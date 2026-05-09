import type { FeedPostRowWithCareer } from "../types/database";
import { signFeedMediaPath } from "./feed-media";
import { supabase } from "./supabase";
import { feedFixtures, type FeedPost } from "./fixtures";
import { traitTagsToVector } from "./traitFit";

/** Demo creator names — one is picked at random per post when shaping the feed. */
const FEED_DISPLAY_NAMES = [
  "Sookie",
  "Paman",
  "Yohan",
  "Bonas",
  "Larry",
  "GoatNBA",
  "Khloe",
  "Braden",
  "Ang"
] as const;

function randomFeedHandle(): string {
  const i = Math.floor(Math.random() * FEED_DISPLAY_NAMES.length);
  return FEED_DISPLAY_NAMES[i]!;
}

function withRandomFeedHandles(posts: FeedPost[]): FeedPost[] {
  return posts.map((p) => ({ ...p, handle: randomFeedHandle() }));
}

async function resolveRowMedia(row: FeedPostRowWithCareer): Promise<{
  media_video_url: string | null;
  media_poster_url: string | null;
  slideshow_slides: {
    uri: string;
    caption?: string;
    duration_ms?: number;
  }[];
}> {
  let media_video_url: string | null = null;
  let media_poster_url: string | null = null;
  const slideshow_slides: {
    uri: string;
    caption?: string;
    duration_ms?: number;
  }[] = [];

  if (row.post_type === "video") {
    const v = row.video;
    if (v?.playback_url?.trim()) media_video_url = v.playback_url.trim();
    else if (v?.storage_path?.trim())
      media_video_url = await signFeedMediaPath(v.storage_path.trim());
    if (v?.poster_path?.trim()) {
      const p = await signFeedMediaPath(v.poster_path.trim());
      if (p) media_poster_url = p;
    }
  } else if (row.post_type === "slideshow" && Array.isArray(row.slideshow)) {
    for (const slide of row.slideshow) {
      if (!slide?.image_path?.trim()) continue;
      const uri = await signFeedMediaPath(slide.image_path.trim());
      if (uri)
        slideshow_slides.push({
          uri,
          caption: slide.caption,
          duration_ms: slide.duration_ms,
        });
    }
  }

  return { media_video_url, media_poster_url, slideshow_slides };
}

/**
 * Fetch feed for the TikTok-style UI. Embeds `careers.trait_tags`, shuffles order
 * so the first item is random among published posts. Signs Storage paths for playback.
 */
export async function fetchFeed(): Promise<FeedPost[]> {
  try {
    const { data, error } = await supabase
      .from("feed_posts")
      .select(
        `
        *,
        careers (
          career_title,
          trait_tags
        )
      `,
      )
      .eq("is_published", true)
      .order("published_at", { ascending: false })
      .limit(80);

    if (error || !data?.length) return withRandomFeedHandles(feedFixtures);

    const rows = shuffleArray(data as FeedPostRowWithCareer[]);
    const resolved = await Promise.all(rows.map((r) => resolveRowMedia(r)));

    return rows.map((row, i): FeedPost => {
      const title = row.career_title ?? "Career";
      const r = resolved[i]!;
      const cap =
        Array.isArray(row.slideshow) && row.slideshow[0]?.caption
          ? row.slideshow[0].caption
          : row.post_type === "video" && r.media_video_url
            ? "Watch a career spotlight."
            : "Discover this career.";

      const joined = row.careers;
      const careerRow = Array.isArray(joined) ? joined[0] : joined;
      const career_trait_tags =
        careerRow?.trait_tags != null
          ? traitTagsToVector(careerRow.trait_tags)
          : {};

      return {
        id: String(row.id),
        handle: randomFeedHandle(),
        career_tag: title,
        career_trait_tags,
        caption: cap,
        likes: feedFixtures[i % feedFixtures.length]!.likes,
        comments: feedFixtures[i % feedFixtures.length]!.comments,
        saves: feedFixtures[i % feedFixtures.length]!.saves,
        shares: feedFixtures[i % feedFixtures.length]!.shares,
        gradientColors: feedFixtures[i % feedFixtures.length]!.gradientColors,
        post_type: row.post_type,
        media_video_url: r.media_video_url,
        media_poster_url: r.media_poster_url ?? null,
        slideshow_slides: r.slideshow_slides,
      };
    });
  } catch {
    return withRandomFeedHandles(feedFixtures);
  }
}

/** Fisher–Yates shuffle (copy). */
function shuffleArray<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
