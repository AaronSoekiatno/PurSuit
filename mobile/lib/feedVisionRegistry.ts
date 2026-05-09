import type { VisionPayload } from "./visionTypes";
import { emptyVisionPayload } from "./visionTypes";

type CaptureFn = () => Promise<VisionPayload>;

const registry = new Map<string, CaptureFn>();

/** FeedCard registers capture for the active post so Ask AI can snapshot slides / video frames. */
export function registerFeedVision(postId: string, capture: CaptureFn): () => void {
  registry.set(postId, capture);
  return () => {
    if (registry.get(postId) === capture) registry.delete(postId);
  };
}

export async function captureFeedVision(postId: string): Promise<VisionPayload> {
  const fn = registry.get(postId);
  if (!fn) return emptyVisionPayload();
  try {
    return await fn();
  } catch {
    return emptyVisionPayload();
  }
}
