import { supabase } from "./supabase";
import { feedFixtures, type FeedPost } from "./fixtures";
import type { FeedPostRow } from "../types/database";

/**
 * Fetch feed for the TikTok-style UI. Maps Supabase `feed_posts` rows to `FeedPost`;
 * falls back to fixtures if the query fails or returns no rows.
 */
export async function fetchFeed(): Promise<FeedPost[]> {
  try {
    const { data, error } = await supabase
      .from("feed_posts")
      .select("*")
      .eq("is_published", true)
      .order("published_at", { ascending: false })
      .limit(20);

    if (error || !data?.length) return feedFixtures;

    return (data as FeedPostRow[]).map((row, i): FeedPost => {
      const title = row.career_title ?? "Career";
      const slug = title.toLowerCase().replace(/\s+/g, "");
      const cap =
        Array.isArray(row.slideshow) && row.slideshow[0]?.caption
          ? row.slideshow[0].caption
          : row.video?.playback_url
            ? "Watch a career spotlight."
            : "Discover this career.";

      return {
        id: String(row.id),
        handle: row.industry ? `@${slug}` : `@creator`,
        career_tag: title,
        caption: cap,
        likes: feedFixtures[i % feedFixtures.length].likes,
        comments: feedFixtures[i % feedFixtures.length].comments,
        saves: feedFixtures[i % feedFixtures.length].saves,
        shares: feedFixtures[i % feedFixtures.length].shares,
        gradientColors: feedFixtures[i % feedFixtures.length].gradientColors,
        video_url: row.video?.playback_url ?? null,
      };
    });
  } catch {
    return feedFixtures;
  }
}
