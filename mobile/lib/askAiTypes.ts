import type { Career, FeedPost } from "./fixtures";
import type { WrappedStats } from "./sessionSignals";

export type ChatMessage = { role: "user" | "assistant"; content: string };

export type FeedGrounding = {
  kind: "feed";
  activePost: {
    id: string;
    careerTag: string;
    caption: string;
    handle: string;
    videoUrl?: string | null;
  };
  recentPosts: {
    id: string;
    careerTag: string;
    caption: string;
    handle: string;
  }[];
};

export type WrappedGrounding = {
  kind: "wrapped";
  stats: WrappedStats;
};

export type CareerGrounding = {
  kind: "career";
  career: Pick<
    Career,
    "id" | "title" | "category" | "overview" | "salary" | "skills" | "pathways" | "tasks"
  >;
};

export type ChatGrounding = FeedGrounding | WrappedGrounding | CareerGrounding;

export function feedPostToGroundingPayload(post: FeedPost): FeedGrounding["activePost"] {
  return {
    id: post.id,
    careerTag: post.career_tag,
    caption: post.caption,
    handle: post.handle,
    videoUrl: post.media_video_url ?? null,
  };
}
