import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Sparkles, Share2, Bookmark } from "lucide-react";
import { MobileFrame } from "@/components/MobileFrame";
import { AiButton } from "@/components/AiButton";
import { AskAiSheet } from "@/components/AskAiSheet";
import { computeWrapped, type WrappedStats } from "@/lib/sessionSignals";

export const Route = createFileRoute("/wrapped")({
  head: () => ({
    meta: [
      { title: "Your Session Wrapped · PurSuit" },
      { name: "description", content: "A recap of the careers you've been exploring." },
    ],
  }),
  component: WrappedPage,
});

function WrappedPage() {
  const [stats, setStats] = useState<WrappedStats | null>(null);
  const [askOpen, setAskOpen] = useState(false);

  useEffect(() => { setStats(computeWrapped()); }, []);

  const top = stats?.topCareers[0]?.career ?? "Data Analyst";

  return (
    <MobileFrame>
      <div className="px-5 pt-5">
        <div className="flex items-center gap-3">
          <Link to="/profile" aria-label="Back" className="p-1 -ml-1"><ArrowLeft className="h-5 w-5" /></Link>
          <h1 className="text-base font-semibold">Session Wrapped</h1>
        </div>

        <div className="relative mt-5 overflow-hidden rounded-3xl p-6 text-white" style={{ background: "linear-gradient(135deg, oklch(0.45 0.22 295) 0%, oklch(0.4 0.2 255) 100%)" }}>
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <Sparkles className="h-6 w-6" />
          <p className="mt-4 text-sm/5 opacity-90">Your top career this session</p>
          <p className="mt-1 text-3xl font-bold">{top}</p>
          <p className="mt-1 text-xs opacity-80">Based on what you watched, liked and saved</p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <Card title="Depth preference" big={(stats?.depth ?? "balanced").toUpperCase()} sub="how deep you watch" />
          <Card title="Most replayed" big={stats?.mostReplayed ?? "—"} sub="post id" />
        </div>

        <div className="mt-4 rounded-2xl border border-border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Top careers explored</p>
          <ul className="mt-3 space-y-2.5">
            {(stats?.topCareers ?? []).slice(0, 5).map((c, i) => (
              <li key={c.career} className="flex items-center justify-between text-sm">
                <span><span className="text-muted-foreground">{i + 1}.</span> {c.career}</span>
                <span className="text-xs text-muted-foreground">{c.score.toFixed(1)} pts</span>
              </li>
            ))}
            {!stats?.topCareers.length && (
              <li className="text-sm text-muted-foreground">Watch a few videos to populate this.</li>
            )}
          </ul>
        </div>

        <div className="mt-4 rounded-2xl border border-border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Recurring themes</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {(stats?.themes ?? []).map((t) => (
              <span key={t.name} className="rounded-full border border-border bg-background px-3 py-1.5 text-xs">{t.name}</span>
            ))}
            {!stats?.themes.length && <p className="text-sm text-muted-foreground">No themes yet.</p>}
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-2 pb-6">
          <AiButton onClick={() => setAskOpen(true)} className="w-full !py-3">Ask AI to explain this</AiButton>
          <div className="flex gap-2">
            <button className="flex-1 rounded-full border border-border bg-card px-4 py-3 text-sm font-medium">
              <span className="inline-flex items-center gap-2"><Share2 className="h-4 w-4" /> Share recap</span>
            </button>
            <button className="flex-1 rounded-full border border-border bg-card px-4 py-3 text-sm font-medium">
              <span className="inline-flex items-center gap-2"><Bookmark className="h-4 w-4" /> Save recap</span>
            </button>
          </div>
        </div>
      </div>

      <AskAiSheet open={askOpen} onOpenChange={setAskOpen} career={top} />
    </MobileFrame>
  );
}

function Card({ title, big, sub }: { title: string; big: string; sub: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{title}</p>
      <p className="mt-1 truncate text-base font-semibold">{big}</p>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}
