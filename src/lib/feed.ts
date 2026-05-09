import { supabase } from "@/integrations/supabase/client";
import { feedFixtures, type FeedPost } from "./fixtures";

/**
 * Fetch feed posts from Supabase `feed_posts` if available.
 * Falls back to local fixtures so the app always renders.
 */
export async function fetchFeed(): Promise<FeedPost[]> {
  try {
    // Cast to any: table may not exist yet; we degrade gracefully.
    const { data, error } = await (supabase as any)
      .from("feed_posts")
      .select("*")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(20);

    if (error || !data || data.length === 0) return feedFixtures;

    return data.map((row: any, i: number): FeedPost => ({
      id: String(row.id),
      handle: row.handle ?? row.creator_handle ?? "@creator",
      avatar_url: row.avatar_url ?? null,
      career_tag: row.career_tag ?? "Career",
      caption: row.caption ?? "",
      likes: Number(row.likes ?? row.like_count ?? 0),
      comments: Number(row.comments ?? row.comment_count ?? 0),
      saves: Number(row.saves ?? row.save_count ?? 0),
      shares: Number(row.shares ?? row.share_count ?? 0),
      gradient: feedFixtures[i % feedFixtures.length].gradient,
      video_url: row.video_url ?? null,
    }));
  } catch {
    return feedFixtures;
  }
}
