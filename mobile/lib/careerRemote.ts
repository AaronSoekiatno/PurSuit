import type { Json } from "../types/database";
import type { Career } from "./fixtures";
import { slugify } from "./slug";
import { supabase } from "./supabase";

/**
 * Load a career row from Supabase when the title isn’t in local `fixtures` careers.
 * Matches by exact `career_title` (preferred) or by slugified title vs route segment.
 */
export async function fetchCareerFromDb(
  slugFromRoute: string,
  exactTitle?: string | null,
): Promise<{ career_title: string; trait_tags: Json } | null> {
  const slug = slugFromRoute.trim();
  if (!slug) return null;

  if (exactTitle?.trim()) {
    const { data, error } = await supabase
      .from("careers")
      .select("career_title, trait_tags")
      .eq("career_title", exactTitle.trim())
      .maybeSingle();
    if (!error && data) return data;
  }

  const { data: rows, error } = await supabase.from("careers").select("career_title, trait_tags");
  if (error || !rows?.length) return null;
  return rows.find((r) => slugify(r.career_title) === slug) ?? null;
}

/** Shape a minimal DB row into the same `Career` type the detail screen expects. */
export function mapCareerRowToCareer(row: {
  career_title: string;
  trait_tags: Json;
}): Career {
  const keys =
    row.trait_tags && typeof row.trait_tags === "object" && !Array.isArray(row.trait_tags)
      ? Object.keys(row.trait_tags as Record<string, unknown>).slice(0, 12)
      : [];

  return {
    id: slugify(row.career_title),
    title: row.career_title,
    emoji: "💼",
    category: "Career",
    salary: "Varies by role, region, and experience.",
    skills:
      keys.length > 0 ? keys.map((k) => k.replace(/_/g, " ")) : ["Explore this path"],
    pathways: [
      "Research requirements for your region",
      "Talk to people already in the role",
    ],
    tasks: [
      "Day-to-day work varies by employer — tap Ask AI for role-specific ideas.",
    ],
    overview: `Learn more about ${row.career_title}. Your PurSuit feed engagement helps personalize career fit.`,
  };
}
