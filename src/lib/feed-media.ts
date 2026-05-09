import { FEED_MEDIA_BUCKET, supabase } from "./supabase";

/** Signed URL for a path inside `feed-media` (private bucket). */
export async function createFeedMediaSignedUrl(
  storagePath: string,
  expiresInSeconds = 3600
) {
  const { data, error } = await supabase.storage
    .from(FEED_MEDIA_BUCKET)
    .createSignedUrl(storagePath, expiresInSeconds);

  if (error) throw error;
  return data.signedUrl;
}
