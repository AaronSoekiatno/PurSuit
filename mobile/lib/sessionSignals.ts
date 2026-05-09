import AsyncStorage from "@react-native-async-storage/async-storage";

export type SignalEvent =
  | { type: "view"; postId: string; career: string; fraction: number; t: number }
  | { type: "skip"; postId: string; career: string; t: number }
  | { type: "rewatch"; postId: string; career: string; t: number }
  | { type: "like"; postId: string; career: string; t: number }
  | { type: "save"; postId: string; career: string; t: number }
  | { type: "ask_ai"; career: string; t: number };

const KEY = "pursuit:signals:v1";

/** Read stored engagement events (for trait vector / recommendations). */
export async function readSignalEvents(): Promise<SignalEvent[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SignalEvent[]) : [];
  } catch {
    return [];
  }
}

async function writeAll(events: SignalEvent[]) {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(events.slice(-500)));
  } catch {
    /* ignore */
  }
}

export async function trackEvent(
  e: Record<string, unknown> & { type: SignalEvent["type"] },
) {
  const all = await readSignalEvents();
  all.push({ ...e, t: Date.now() } as SignalEvent);
  await writeAll(all);
}

export interface WrappedStats {
  totalEvents: number;
  topCareers: { career: string; score: number }[];
  depth: "intro" | "advanced" | "balanced";
  themes: { name: string; count: number }[];
  mostReplayed: string | null;
}

export async function computeWrapped(): Promise<WrappedStats> {
  const events = await readSignalEvents();
  const careerScore: Record<string, number> = {};
  const replayCount: Record<string, number> = {};
  let intro = 0;
  let advanced = 0;

  for (const e of events) {
    if ("career" in e && e.career) {
      const w =
        e.type === "save"
          ? 5
          : e.type === "like"
            ? 3
            : e.type === "ask_ai"
              ? 4
              : e.type === "view"
                ? Math.max(0.2, e.fraction)
                : e.type === "rewatch"
                  ? 2
                  : e.type === "skip"
                    ? -0.5
                    : 0;
      careerScore[e.career] = (careerScore[e.career] ?? 0) + w;
    }
    if (e.type === "rewatch") replayCount[e.postId] = (replayCount[e.postId] ?? 0) + 1;
    if (e.type === "view") {
      if (e.fraction < 0.4) intro++;
      else if (e.fraction > 0.85) advanced++;
    }
  }

  const topCareers = Object.entries(careerScore)
    .map(([career, score]) => ({ career, score }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const depth: WrappedStats["depth"] =
    advanced > intro * 1.25 ? "advanced" : intro > advanced * 1.25 ? "intro" : "balanced";

  const themes = topCareers
    .slice(0, 3)
    .map((c) => ({ name: c.career, count: Math.round(c.score) }));

  const mostReplayed =
    Object.entries(replayCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  return { totalEvents: events.length, topCareers, depth, themes, mostReplayed };
}

export async function clearSignals() {
  await AsyncStorage.removeItem(KEY);
}
