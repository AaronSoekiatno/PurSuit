import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Sparkles, Send, ExternalLink } from "lucide-react";
import { useState, useEffect } from "react";
import { trackEvent } from "@/lib/sessionSignals";

interface AskAiSheetProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  career: string;
}

const QUICK_PROMPTS = [
  "Is this right for me?",
  "What should I learn first?",
  "Show me alternatives",
  "How do I get started this week?",
];

interface Msg { role: "user" | "ai"; content: string }

export function AskAiSheet({ open, onOpenChange, career }: AskAiSheetProps) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    if (open) {
      setMessages([
        {
          role: "ai",
          content: `Hey — I can help you explore **${career}**. Pick a prompt below or ask anything.`,
        },
      ]);
      trackEvent({ type: "ask_ai", career });
    }
  }, [open, career]);

  function send(prompt: string) {
    if (!prompt.trim()) return;
    setMessages((m) => [
      ...m,
      { role: "user", content: prompt },
      {
        role: "ai",
        content:
          "I'd connect to a model here in production. Want me to wire Lovable AI? For now: this would summarize the career, list typical first steps, and suggest reading.",
      },
    ]);
    setInput("");
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[88dvh] rounded-t-3xl border-border bg-popover p-0 text-foreground"
      >
        <SheetHeader className="border-b border-border px-5 py-4">
          <SheetTitle className="flex items-center gap-2 text-base font-semibold">
            <span className="flex h-7 w-7 items-center justify-center rounded-full gradient-ai">
              <Sparkles className="h-4 w-4 text-white" />
            </span>
            Ask AI · {career}
          </SheetTitle>
        </SheetHeader>

        <div className="flex h-[calc(88dvh-64px)] flex-col">
          <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4 no-scrollbar">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "ml-auto bg-secondary text-secondary-foreground"
                    : "bg-muted text-foreground"
                }`}
              >
                {m.content}
              </div>
            ))}

            <div className="pt-2">
              <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">Quick prompts</p>
              <div className="flex flex-wrap gap-2">
                {QUICK_PROMPTS.map((p) => (
                  <button
                    key={p}
                    onClick={() => send(p)}
                    className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-foreground hover:bg-accent"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-3">
              <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">Sources to check</p>
              <ul className="space-y-1.5 text-sm">
                <li className="flex items-center gap-2 text-muted-foreground">
                  <ExternalLink className="h-3.5 w-3.5" /> BLS Occupational Outlook
                </li>
                <li className="flex items-center gap-2 text-muted-foreground">
                  <ExternalLink className="h-3.5 w-3.5" /> r/{career.replace(/\s+/g, "").toLowerCase()}
                </li>
                <li className="flex items-center gap-2 text-muted-foreground">
                  <ExternalLink className="h-3.5 w-3.5" /> O*NET role profile
                </li>
              </ul>
            </div>

            <p className="pt-4 text-[11px] leading-snug text-muted-foreground">
              PurSuit AI provides general guidance, not professional career, medical, or financial advice.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2 border-t border-border px-4 py-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Ask about ${career}…`}
              className="flex-1 rounded-full border border-border bg-card px-4 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-ring"
            />
            <button
              type="submit"
              className="flex h-10 w-10 items-center justify-center rounded-full gradient-ai text-white"
              aria-label="Send"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
