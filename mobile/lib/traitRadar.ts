import type { TraitVector } from "./traitFit";

/** Max axes so the spider stays readable on phone screens. */
export const RADAR_MAX_AXES = 8;

/** Inner radius ratio — keeps the polygon off the dead center. */
const MIN_RADIUS_RATIO = 0.14;

export type RadarAxis = {
  key: string;
  /** Raw accumulated signal (can be negative before clamp for display). */
  value: number;
  /** 0–1 for polygon radius (from positive magnitude vs max axis). */
  normalized: number;
};

/** Human-readable label from snake_case trait_tags keys. */
export function formatTraitLabel(key: string): string {
  const titled = key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
  /** Trait tag `ai` titles as "Ai"; show acronym as AI. */
  return titled.replace(/\bAi\b/g, "AI");
}

/**
 * Pick top traits by positive magnitude for the radar.
 * Negative contributions (e.g. skip penalties) are clamped to 0 for the chart.
 */
export function selectRadarAxes(
  vec: TraitVector,
  maxAxes = RADAR_MAX_AXES,
): RadarAxis[] {
  const entries = Object.entries(vec)
    .filter(([, v]) => Number.isFinite(v))
    .map(([key, value]) => ({
      key,
      value,
      mag: Math.max(0, value),
    }))
    .sort((a, b) => b.mag - a.mag)
    .slice(0, maxAxes);

  const maxMag = Math.max(...entries.map((e) => e.mag), 1e-9);

  return entries.map((e) => ({
    key: e.key,
    value: e.value,
    normalized: e.mag / maxMag,
  }));
}

export function radarPolygonPoints(
  cx: number,
  cy: number,
  normalizedRadii: number[],
  maxR: number,
): string {
  const n = normalizedRadii.length;
  const minR = maxR * MIN_RADIUS_RATIO;
  return normalizedRadii
    .map((t, i) => {
      const angle = -Math.PI / 2 + (2 * Math.PI * i) / n;
      const r = minR + t * (maxR - minR);
      return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
    })
    .join(" ");
}

export function regularPolygonPoints(
  cx: number,
  cy: number,
  r: number,
  sides: number,
): string {
  return Array.from({ length: sides }, (_, i) => {
    const angle = -Math.PI / 2 + (2 * Math.PI * i) / sides;
    return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
  }).join(" ");
}
