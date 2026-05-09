import type { Json } from "../types/database";
import { readSignalEvents, type SignalEvent } from "./sessionSignals";
import { supabase } from "./supabase";

export type TraitVector = Record<string, number>;

/** Parse careers.trait_tags JSON into numeric trait weights. */
export function traitTagsToVector(tags: Json | undefined | null): TraitVector {
  if (!tags || typeof tags !== "object" || Array.isArray(tags)) return {};
  const out: TraitVector = {};
  for (const [k, v] of Object.entries(tags)) {
    const n = typeof v === "number" ? v : Number(v);
    if (!Number.isFinite(n)) continue;
    out[k] = n;
  }
  return out;
}

/** Engagement multiplier applied to the career's trait vector for this event. */
export function eventTraitWeight(e: SignalEvent): number {
  switch (e.type) {
    case "view":
      return 2 * clamp01(e.fraction);
    case "like":
      return 4;
    case "save":
      return 6;
    case "rewatch":
      return 3;
    case "ask_ai":
      return 2;
    case "skip":
      return -1;
    default:
      return 0;
  }
}

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

/** Sum weighted career trait vectors (same keys as careers.trait_tags). */
export function accumulateUserTraitVector(
  events: SignalEvent[],
  careersByTitle: Map<string, TraitVector>,
): TraitVector {
  const acc: TraitVector = {};
  for (const e of events) {
    if (!("career" in e) || !e.career) continue;
    const w = eventTraitWeight(e);
    if (w === 0) continue;
    const vec = careersByTitle.get(e.career);
    if (!vec || Object.keys(vec).length === 0) continue;
    for (const [trait, val] of Object.entries(vec)) {
      acc[trait] = (acc[trait] ?? 0) + val * w;
    }
  }
  return acc;
}

function sortedUnionKeys(...vectors: TraitVector[]): string[] {
  const s = new Set<string>();
  for (const v of vectors) {
    for (const k of Object.keys(v)) s.add(k);
  }
  return [...s].sort();
}

function toDense(vec: TraitVector, keys: string[]): number[] {
  return keys.map((k) => vec[k] ?? 0);
}

function l2(arr: number[]): number {
  return Math.sqrt(arr.reduce((sum, x) => sum + x * x, 0));
}

/** Cosine similarity on aligned trait axes (missing traits = 0). */
export function cosineSimilarity(a: TraitVector, b: TraitVector): number {
  const keys = sortedUnionKeys(a, b);
  if (keys.length === 0) return 0;
  const da = toDense(a, keys);
  const db = toDense(b, keys);
  const na = l2(da);
  const nb = l2(db);
  if (na === 0 || nb === 0) return 0;
  let dot = 0;
  for (let i = 0; i < keys.length; i++) dot += da[i] * db[i];
  return dot / (na * nb);
}

export async function fetchCareersTraitMap(): Promise<
  Map<string, TraitVector>
> {
  const { data, error } = await supabase
    .from("careers")
    .select("career_title, trait_tags");

  if (error || !data?.length) return new Map();

  const m = new Map<string, TraitVector>();
  for (const row of data) {
    m.set(row.career_title, traitTagsToVector(row.trait_tags));
  }
  return m;
}

export interface CareerRankingRow {
  career_title: string;
  similarity: number;
  careerTraits: TraitVector;
}

/** Rank careers by cosine similarity to the accumulated user vector. */
export function rankCareersBySimilarity(
  userVector: TraitVector,
  careersByTitle: Map<string, TraitVector>,
): CareerRankingRow[] {
  const rows: CareerRankingRow[] = [];
  for (const [career_title, careerTraits] of careersByTitle) {
    rows.push({
      career_title,
      similarity: cosineSimilarity(userVector, careerTraits),
      careerTraits,
    });
  }
  return rows.sort((a, b) => b.similarity - a.similarity);
}

/** Signals + Supabase careers → user vector + ranked careers (top match first). */
export async function getCareerFitFromSignals(): Promise<{
  userVector: TraitVector;
  ranking: CareerRankingRow[];
  recommendedCareer: string | null;
}> {
  const [events, careersMap] = await Promise.all([
    readSignalEvents(),
    fetchCareersTraitMap(),
  ]);

  const userVector = accumulateUserTraitVector(events, careersMap);
  const ranking = rankCareersBySimilarity(userVector, careersMap);
  const userNorm = l2(Object.values(userVector));
  const recommendedCareer =
    userNorm > 1e-9 ? ranking[0]?.career_title ?? null : null;

  return {
    userVector,
    ranking,
    recommendedCareer,
  };
}
