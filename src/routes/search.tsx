import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { ArrowLeft, Search as SearchIcon } from "lucide-react";
import { MobileFrame } from "@/components/MobileFrame";
import { careers } from "@/lib/fixtures";

export const Route = createFileRoute("/search")({
  head: () => ({
    meta: [
      { title: "Search careers · PurSuit" },
      { name: "description", content: "Search and discover careers across every field." },
    ],
  }),
  component: SearchPage,
});

const FILTERS = ["All", "Tech", "Design", "Healthcare", "Engineering", "Remote-friendly"];

function SearchPage() {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("All");
  const navigate = useNavigate();

  const results = useMemo(() => {
    return careers.filter((c) => {
      const matchesQ = q.trim() === "" || c.title.toLowerCase().includes(q.toLowerCase());
      const matchesF = filter === "All" || c.category === filter || (filter === "Remote-friendly" && c.category === "Tech");
      return matchesQ && matchesF;
    });
  }, [q, filter]);

  return (
    <MobileFrame>
      <div className="px-5 pb-6 pt-5">
        <div className="flex items-center gap-3">
          <Link to="/" aria-label="Back" className="p-1 -ml-1">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search careers, skills…"
              className="w-full rounded-full border border-border bg-card py-2.5 pl-10 pr-4 text-sm outline-none placeholder:text-muted-foreground focus:border-ring"
            />
          </div>
        </div>

        <div className="no-scrollbar mt-4 -mx-5 flex gap-2 overflow-x-auto px-5">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs ${
                filter === f
                  ? "border-transparent bg-foreground text-background"
                  : "border-border bg-card text-foreground"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <h2 className="mt-6 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {q ? "Results" : "Trending careers"}
        </h2>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {results.map((c) => (
            <button
              key={c.id}
              onClick={() => navigate({ to: "/career/$id", params: { id: c.id } })}
              className="flex aspect-[4/5] flex-col justify-between rounded-2xl border border-border bg-card p-3 text-left transition-colors hover:bg-accent"
            >
              <div className="text-3xl">{c.emoji}</div>
              <div>
                <p className="text-sm font-semibold">{c.title}</p>
                <p className="text-xs text-muted-foreground">{c.category}</p>
              </div>
            </button>
          ))}
          {results.length === 0 && (
            <p className="col-span-2 mt-6 text-center text-sm text-muted-foreground">
              No careers match "{q}"
            </p>
          )}
        </div>
      </div>
    </MobileFrame>
  );
}
