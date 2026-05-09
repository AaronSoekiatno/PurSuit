export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

/** One slide object stored in feed_posts.slideshow JSONB array */
export interface SlideshowSlide {
  image_path: string;
  caption?: string;
  duration_ms?: number;
}

/** Video payload in feed_posts.video */
export interface VideoPayload {
  storage_path?: string;
  playback_url?: string;
  poster_path?: string;
}

export type FeedPostRow = {
  id: string;
  post_type: "video" | "slideshow";
  career_title: string | null;
  industry: string | null;
  trait_tags: Json;
  published_at: string;
  is_published: boolean;
  video: VideoPayload | null;
  slideshow: SlideshowSlide[] | null;
};

/** Minimal Database typing for @supabase/supabase-js generics */
export type Database = {
  public: {
    Tables: {
      feed_posts: {
        Row: FeedPostRow;
        Insert: Omit<FeedPostRow, "id" | "published_at"> & {
          id?: string;
          published_at?: string;
        };
        Update: Partial<
          Omit<FeedPostRow, "id"> & { published_at?: string }
        >;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
