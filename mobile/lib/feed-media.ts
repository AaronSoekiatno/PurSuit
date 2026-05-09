import { supabase } from "./supabase";

export const FEED_MEDIA_BUCKET = "feed-media" as const;

/** Signed URL for a path inside `feed-media` (private bucket). */
export async function signFeedMediaPath(
  storagePath: string,
  expiresSeconds = 3600,
): Promise<string | null> {
  const trimmed = storagePath.trim();
  if (!trimmed) return null;

  const { data, error } = await supabase.storage
    .from(FEED_MEDIA_BUCKET)
    .createSignedUrl(trimmed, expiresSeconds);

  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}
