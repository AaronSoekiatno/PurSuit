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

export type CareerRow = {
  career_title: string;
  trait_tags: Json;
  created_at: string;
  updated_at: string;
};

/** Mirrors `public.feed_posts` — trait vectors live on `careers.trait_tags`, not here. */
export type FeedPostRow = {
  id: string;
  post_type: "video" | "slideshow";
  career_title: string | null;
  industry: string | null;
  published_at: string;
  is_published: boolean;
  video: VideoPayload | null;
  slideshow: SlideshowSlide[] | null;
};

/** Row returned when selecting `*, careers (...)` from feed_posts */
export type FeedPostRowWithCareer = FeedPostRow & {
  careers:
    | Pick<CareerRow, "career_title" | "trait_tags">
    | Pick<CareerRow, "career_title" | "trait_tags">[]
    | null;
};

/** Minimal Database typing for @supabase/supabase-js generics */
export type Database = {
  public: {
    Tables: {
      careers: {
        Row: CareerRow;
        Insert: Omit<CareerRow, "created_at" | "updated_at"> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<CareerRow, "career_title">>;
        Relationships: [];
      };
      feed_posts: {
        Row: FeedPostRow;
        Insert: Omit<FeedPostRow, "id" | "published_at"> & {
          id?: string;
          published_at?: string;
        };
        Update: Partial<
          Omit<FeedPostRow, "id"> & { published_at?: string }
        >;
        Relationships: [
          {
            foreignKeyName: "feed_posts_career_title_fkey";
            columns: ["career_title"];
            isOneToOne: false;
            referencedRelation: "careers";
            referencedColumns: ["career_title"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
