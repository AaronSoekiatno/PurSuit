/**
 * Multimodal payload for Ask AI on feed posts.
 * - `imageUrls`: HTTPS URLs the edge function fetches (slideshow slides, poster).
 * - `imagesBase64`: JPEG frames from the device (e.g. expo-video thumbnails).
 */
export type VisionPayload = {
  imageUrls: string[];
  imagesBase64: { media_type: "image/jpeg"; data: string }[];
};

export function emptyVisionPayload(): VisionPayload {
  return { imageUrls: [], imagesBase64: [] };
}
