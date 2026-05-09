import type { ChatGrounding, ChatMessage } from "./askAiTypes";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export type PursuitChatRequest = {
  grounding: ChatGrounding;
  messages: ChatMessage[];
};

export type PursuitChatResponse = { reply: string } | { error: string; detail?: string };

/**
 * Call pursuit-chat via fetch so non-2xx JSON bodies (503 missing key, 502 Anthropic, etc.)
 * are surfaced. `supabase.functions.invoke` often only returns a generic “non-2xx” message.
 */
export async function invokePursuitChat(
  body: PursuitChatRequest,
): Promise<{ reply: string }> {
  if (!supabaseUrl || !anonKey) {
    throw new Error("Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY");
  }

  const url = `${supabaseUrl.replace(/\/$/, "")}/functions/v1/pursuit-chat`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${anonKey}`,
        apikey: anonKey,
      },
      body: JSON.stringify(body),
    });
  } catch (e) {
    throw new Error(e instanceof Error ? e.message : "Network error calling pursuit-chat");
  }

  let json: PursuitChatResponse | null = null;
  try {
    json = (await res.json()) as PursuitChatResponse;
  } catch {
    throw new Error(`pursuit-chat HTTP ${res.status} (invalid JSON)`);
  }

  if (!res.ok) {
    if (json && "error" in json && json.error) {
      throw new Error(
        json.detail ? `${json.error}: ${json.detail}` : json.error,
      );
    }
    throw new Error(`pursuit-chat failed (HTTP ${res.status})`);
  }

  if (json && "error" in json && json.error) {
    throw new Error(json.detail ? `${json.error}: ${json.detail}` : json.error);
  }

  if (json && "reply" in json && typeof json.reply === "string" && json.reply.length > 0) {
    return { reply: json.reply };
  }

  throw new Error("Invalid response from pursuit-chat");
}
