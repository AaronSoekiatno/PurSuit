import { supabase } from "./supabase";

import type { FeedPostRow } from "../types/database";

/** Published feed items, newest first (matches RLS: only is_published rows are visible). */
export async function fetchPublishedFeed(): Promise<FeedPostRow[]> {
  const { data, error } = await supabase
    .from("feed_posts")
    .select("*")
    .eq("is_published", true)
    .order("published_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as FeedPostRow[];
}
