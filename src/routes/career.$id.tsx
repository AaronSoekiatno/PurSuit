import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Bookmark, ExternalLink } from "lucide-react";
import { MobileFrame } from "@/components/MobileFrame";
import { AiButton } from "@/components/AiButton";
import { AskAiSheet } from "@/components/AskAiSheet";
import { careers } from "@/lib/fixtures";

export const Route = createFileRoute("/career/$id")({
  loader: ({ params }): import("@/lib/fixtures").Career => {
    const c = careers.find((x) => x.id === params.id);
    if (!c) throw notFound();
    return c;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.title ?? "Career"} · PurSuit` },
      { name: "description", content: loaderData?.overview ?? "" },
      { property: "og:title", content: `${loaderData?.title ?? "Career"} on PurSuit` },
      { property: "og:description", content: loaderData?.overview ?? "" },
    ],
  }),
  errorComponent: ({ error }) => (
    <div className="flex min-h-dvh items-center justify-center text-sm text-muted-foreground">
      {error.message}
    </div>
  ),
  notFoundComponent: () => (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 text-sm">
      Career not found.
      <Link to="/search" className="rounded-full bg-foreground px-4 py-2 text-background">Browse</Link>
    </div>
  ),
  component: CareerDetailPage,
});

function CareerDetailPage() {
  const c = Route.useLoaderData();
  const [saved, setSaved] = useState(false);
  const [askOpen, setAskOpen] = useState(false);

  return (
    <MobileFrame>
      <div className="px-5 pt-5">
        <div className="flex items-center justify-between">
          <Link to="/" aria-label="Back" className="p-1 -ml-1"><ArrowLeft className="h-5 w-5" /></Link>
          <button
            onClick={() => setSaved((v) => !v)}
            aria-label="Bookmark"
            className="rounded-full border border-border bg-card p-2"
          >
            <Bookmark className={`h-4 w-4 ${saved ? "fill-foreground" : ""}`} />
          </button>
        </div>

        <div className="mt-6 flex items-center gap-4">
          <div className="text-5xl">{c.emoji}</div>
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{c.category}</p>
            <h1 className="text-2xl font-bold">{c.title}</h1>
          </div>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-foreground/85">{c.overview}</p>

        <div className="mt-4 flex items-center gap-3">
          <AiButton onClick={() => setAskOpen(true)}>Ask AI about this</AiButton>
        </div>

        <Section title="Salary">
          <p className="text-sm">{c.salary}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Salary varies widely by location, employer, and experience.
          </p>
        </Section>

        <Section title="Skills">
          <div className="flex flex-wrap gap-2">
            {c.skills.map((s) => (
              <span key={s} className="rounded-full border border-border bg-card px-3 py-1.5 text-xs">{s}</span>
            ))}
          </div>
        </Section>

        <Section title="Pathways in">
          <ul className="space-y-2 text-sm">
            {c.pathways.map((p) => (
              <li key={p} className="rounded-xl border border-border bg-card p-3">{p}</li>
            ))}
          </ul>
        </Section>

        <Section title="Day-to-day tasks">
          <ul className="space-y-2 text-sm">
            {c.tasks.map((t) => (
              <li key={t} className="flex gap-2 rounded-xl border border-border bg-card p-3">
                <span className="text-muted-foreground">›</span>{t}
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Resources">
          <ul className="space-y-2 text-sm">
            {["O*NET profile", "Subreddit", "BLS outlook"].map((r) => (
              <li key={r} className="flex items-center gap-2 text-muted-foreground">
                <ExternalLink className="h-3.5 w-3.5" /> {r}
              </li>
            ))}
          </ul>
        </Section>

        <div className="h-6" />
      </div>

      <AskAiSheet open={askOpen} onOpenChange={setAskOpen} career={c.title} />
    </MobileFrame>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-6">
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h2>
      {children}
    </div>
  );
}
