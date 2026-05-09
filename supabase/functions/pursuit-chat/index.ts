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
- Prioritize the **Grounding JSON** when the user's question relates to what's on screen or their session recap. If the topic is still about careers, education, or work but not the current card, answer helpfully using general knowledge — no need to force tie-ins.
- Encourage **multiple options**, **uncertainty where appropriate**, and **next steps to validate** (talk to a counselor, shadow someone, try a small project). Never present a single destiny.
- **Not** professional, immigration, legal, financial, medical, or therapeutic advice. Say so briefly if asked, and suggest appropriate professionals.
- If the user asks about something **clearly unrelated** to careers, education, skills, or planning (e.g. trivia, homework in other subjects, unrelated entertainment), reply in **1–2 short sentences** declining to go deep and redirect gently to career exploration.
- Keep answers concise unless the user asks for detail. Use plain language.`;

type ChatMessage = { role: "user" | "assistant"; content: string };

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

    const model = Deno.env.get("CLAUDE_MODEL") ?? DEFAULT_MODEL;
    const system = buildSystem(g);

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
        messages,
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
