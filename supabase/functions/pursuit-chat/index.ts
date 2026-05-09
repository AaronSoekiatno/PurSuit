/// <reference path="./edge-runtime.d.ts" />

/**
 * Supabase Edge Function: Claude chat for PurSuit (feed / wrapped / career grounding).
 *
 * Deploy: `supabase secrets set ANTHROPIC_API_KEY=sk-ant-...` then `supabase functions deploy pursuit-chat`
 * Optional: `supabase secrets set CLAUDE_MODEL=claude-sonnet-4-6` (or another Messages API model id)
 */

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/** Override with `supabase secrets set CLAUDE_MODEL=...` if your key expects a different id. */
const DEFAULT_MODEL = "claude-sonnet-4-6";

const SYSTEM_PREAMBLE = `You are PurSuit's career exploration assistant inside a TikTok-style careers app for young people exploring jobs and education paths.

Guidelines:
- When **images** are attached to the user's latest message, they are frames or slides from the post they were viewing (career spotlight video or carousel). Use them to answer questions about what is visibly happening — objects, clothing, setting, on-screen text, charts, etc. If something is unclear, say what you can and cannot see.
- Prioritize the **Grounding JSON** when the user's question relates to what's on screen or their session recap. If the topic is still about careers, education, or work but not the current card, answer helpfully using general knowledge — no need to force tie-ins.
- Encourage **multiple options**, **uncertainty where appropriate**, and **next steps to validate** (talk to a counselor, shadow someone, try a small project). Never present a single destiny.
- **Not** professional, immigration, legal, financial, medical, or therapeutic advice. Say so briefly if asked, and suggest appropriate professionals.
- If the user asks about something **clearly unrelated** to careers, education, skills, or planning (e.g. trivia, homework in other subjects, unrelated entertainment), reply in **1–2 short sentences** declining to go deep and redirect gently to career exploration.
- Keep answers concise unless the user asks for detail. Use plain language.`;

type ChatMessage = { role: "user" | "assistant"; content: string };

type VisionPayload = {
  imageUrls: string[];
  imagesBase64: { media_type: string; data: string }[];
};

type AnthropicContentBlock =
  | { type: "text"; text: string }
  | {
    type: "image";
    source: { type: "base64"; media_type: string; data: string };
  };

const MAX_VISION_IMAGES = 8;
const MAX_IMAGE_BYTES = 3_500_000;

function uint8ToBase64(bytes: Uint8Array): string {
  const CHUNK = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += CHUNK) {
    const sub = bytes.subarray(i, i + CHUNK);
    for (let j = 0; j < sub.length; j++) {
      binary += String.fromCharCode(sub[j]!);
    }
  }
  return btoa(binary);
}

async function resolveVisionImages(
  vision: VisionPayload | null,
): Promise<{ media_type: string; data: string }[]> {
  if (!vision) return [];
  const out: { media_type: string; data: string }[] = [];

  for (const url of vision.imageUrls) {
    if (out.length >= MAX_VISION_IMAGES) break;
    if (typeof url !== "string" || !url.startsWith("https://")) continue;
    try {
      const res = await fetch(url, { redirect: "follow" });
      if (!res.ok) continue;
      const buf = new Uint8Array(await res.arrayBuffer());
      if (buf.byteLength > MAX_IMAGE_BYTES) continue;
      const ct = res.headers.get("content-type") ?? "image/jpeg";
      const rawMt = ct.split(";")[0]!.trim().toLowerCase();
      const media_type = /^image\/(jpeg|png|gif|webp)$/i.test(rawMt)
        ? rawMt
        : "image/jpeg";
      out.push({ media_type, data: uint8ToBase64(buf) });
    } catch {
      continue;
    }
  }

  for (const img of vision.imagesBase64) {
    if (out.length >= MAX_VISION_IMAGES) break;
    if (!img?.data || typeof img.data !== "string") continue;
    const mt = typeof img.media_type === "string" && img.media_type.startsWith("image/")
      ? img.media_type
      : "image/jpeg";
    const cleaned = img.data.replace(/\s/g, "");
    const approxBytes = (cleaned.length * 3) / 4;
    if (approxBytes > MAX_IMAGE_BYTES) continue;
    out.push({ media_type: mt, data: cleaned });
  }

  return out;
}

function parseVisionBody(raw: unknown): VisionPayload | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const imageUrls = Array.isArray(o.imageUrls)
    ? o.imageUrls.filter((u): u is string => typeof u === "string")
    : [];
  const rawB64 = Array.isArray(o.imagesBase64) ? o.imagesBase64 : [];
  const imagesBase64: VisionPayload["imagesBase64"] = [];
  for (const item of rawB64) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const data = row.data;
    const media_type = row.media_type;
    if (typeof data !== "string") continue;
    imagesBase64.push({
      media_type: typeof media_type === "string" ? media_type : "image/jpeg",
      data,
    });
  }
  return { imageUrls, imagesBase64 };
}

function toAnthropicMessages(
  messages: ChatMessage[],
  visionBlocks: { media_type: string; data: string }[],
): { role: "user" | "assistant"; content: string | AnthropicContentBlock[] }[] {
  const out: { role: "user" | "assistant"; content: string | AnthropicContentBlock[] }[] =
    [];
  for (let i = 0; i < messages.length - 1; i++) {
    const m = messages[i]!;
    out.push({ role: m.role, content: m.content });
  }
  const last = messages[messages.length - 1]!;
  if (last.role !== "user") {
    throw new Error("Invariant: last message must be user");
  }
  if (visionBlocks.length === 0) {
    out.push({ role: "user", content: last.content });
  } else {
    const blocks: AnthropicContentBlock[] = [];
    for (const v of visionBlocks) {
      blocks.push({
        type: "image",
        source: {
          type: "base64",
          media_type: v.media_type,
          data: v.data,
        },
      });
    }
    blocks.push({ type: "text", text: last.content });
    out.push({ role: "user", content: blocks });
  }
  return out;
}

type Grounding =
  | {
      kind: "feed";
      activePost: Record<string, unknown>;
      recentPosts: Record<string, unknown>[];
    }
  | {
      kind: "wrapped";
      stats: Record<string, unknown>;
    }
  | {
      kind: "career";
      career: Record<string, unknown>;
    };

function buildSystem(grounding: Grounding): string {
  const block = JSON.stringify(grounding, null, 2);
  return `${SYSTEM_PREAMBLE}\n\n## Grounding (snapshot when user opened Ask AI)\n${block}`;
}

function trimMessages(messages: ChatMessage[], maxPairs = 20): ChatMessage[] {
  const sliced = messages.slice(-maxPairs * 2);
  const out: ChatMessage[] = [];
  for (const m of sliced) {
    if (m.role !== "user" && m.role !== "assistant") continue;
    const c = String(m.content ?? "").slice(0, 12_000);
    out.push({ role: m.role, content: c });
  }
  return out;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: "Server missing ANTHROPIC_API_KEY. Set it with: supabase secrets set ANTHROPIC_API_KEY=...",
        }),
        {
          status: 503,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "POST only" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as {
      grounding?: Grounding;
      messages?: ChatMessage[];
      vision?: unknown;
    };

    if (!body.grounding || typeof body.grounding !== "object") {
      return new Response(JSON.stringify({ error: "Missing grounding" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const g = body.grounding;
    if (g.kind !== "feed" && g.kind !== "wrapped" && g.kind !== "career") {
      return new Response(JSON.stringify({ error: "Invalid grounding.kind" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const messages = trimMessages(
      Array.isArray(body.messages) ? body.messages : [],
    );
    if (messages.length < 1 || messages[messages.length - 1]?.role !== "user") {
      return new Response(
        JSON.stringify({ error: "Last message must be a user message" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    let visionParsed: VisionPayload | null = parseVisionBody(body.vision);
    if (g.kind !== "feed") {
      visionParsed = null;
    }
    const visionBlocks = await resolveVisionImages(visionParsed);

    const model = Deno.env.get("CLAUDE_MODEL") ?? DEFAULT_MODEL;
    const system = buildSystem(g);

    const anthropicMessages = toAnthropicMessages(messages, visionBlocks);

    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 2048,
        system,
        messages: anthropicMessages,
      }),
    });

    const raw = await anthropicRes.text();
    if (!anthropicRes.ok) {
      console.error("Anthropic error", anthropicRes.status, raw.slice(0, 500));
      return new Response(
        JSON.stringify({
          error: "Assistant request failed",
          detail: raw.slice(0, 200),
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const parsed = JSON.parse(raw) as {
      content?: Array<{ type?: string; text?: string }>;
    };
    const text =
      parsed.content?.find((b) => b.type === "text")?.text?.trim() ?? "";

    if (!text) {
      return new Response(JSON.stringify({ error: "Empty assistant reply" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ reply: text }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
