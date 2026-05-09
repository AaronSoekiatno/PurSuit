import type { FeedPost } from "./fixtures";

const MAX = 5;

export type RecentPostSnapshot = {
  id: string;
  careerTag: string;
  caption: string;
  handle: string;
};

const buf: RecentPostSnapshot[] = [];

/** Call when a feed card becomes the primary visible item. */
export function recordFeedImpression(post: FeedPost): void {
  const snap: RecentPostSnapshot = {
    id: post.id,
    careerTag: post.career_tag,
    caption: post.caption,
    handle: post.handle,
  };
  const idx = buf.findIndex((x) => x.id === snap.id);
  if (idx >= 0) buf.splice(idx, 1);
  buf.unshift(snap);
  while (buf.length > MAX) buf.pop();
}

export function getRecentFeedPosts(): RecentPostSnapshot[] {
  return [...buf];
}
