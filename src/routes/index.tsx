import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, MoreHorizontal, Heart, MessageCircle, Bookmark, Send, Plus } from "lucide-react";
import { MobileFrame } from "@/components/MobileFrame";
import { AiButton } from "@/components/AiButton";
import { AskAiSheet } from "@/components/AskAiSheet";
import { fetchFeed } from "@/lib/feed";
import type { FeedPost } from "@/lib/fixtures";
import { trackEvent } from "@/lib/sessionSignals";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PurSuit — For You" },
      { name: "description", content: "Discover real careers through short videos. Personalized For You feed." },
      { property: "og:title", content: "PurSuit — For You" },
      { property: "og:description", content: "Discover real careers through short videos." },
    ],
  }),
  component: HomePage,
});

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1).replace(/\.0$/, "")}K`;
  return String(n);
}

function HomePage() {
  const [tab, setTab] = useState<"foryou" | "following">("foryou");
  const [askOpen, setAskOpen] = useState(false);
  const [askCareer, setAskCareer] = useState("Data Analyst");
  const [activeIdx, setActiveIdx] = useState(0);

  const { data: posts } = useQuery({
    queryKey: ["feed"],
    queryFn: fetchFeed,
    staleTime: 60_000,
  });

  const items: FeedPost[] = posts ?? [];

  return (
    <MobileFrame padForTabs={false}>
      <div className="relative h-dvh w-full overflow-hidden bg-black">
        {/* Top header overlay */}
        <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between px-5 pt-4">
          <div className="pointer-events-auto flex items-center gap-5 text-base font-semibold">
            <button
              onClick={() => setTab("following")}
              className={cn(
                "transition-colors",
                tab === "following" ? "text-foreground" : "text-white/55",
              )}
            >
              Following
            </button>
            <button
              onClick={() => setTab("foryou")}
              className={cn(
                "flex items-center gap-1.5 transition-colors",
                tab === "foryou" ? "text-foreground" : "text-white/55",
              )}
            >
              For You
              {tab === "foryou" && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
            </button>
          </div>
          <div className="pointer-events-auto flex items-center gap-3">
            <Link to="/search" aria-label="Search">
              <Search className="h-6 w-6 text-foreground" strokeWidth={2.2} />
            </Link>
            <Link to="/settings" aria-label="More">
              <MoreHorizontal className="h-6 w-6 text-foreground" strokeWidth={2.4} />
            </Link>
          </div>
        </header>

        {/* Snap feed */}
        <div className="snap-y-mandatory no-scrollbar h-dvh overflow-y-scroll">
          {items.length === 0 && <EmptyFeed />}
          {items.map((p, i) => (
            <FeedCard
              key={p.id}
              post={p}
              isActive={i === activeIdx}
              onVisible={() => {
                setActiveIdx(i);
                setAskCareer(p.career_tag);
                trackEvent({ type: "view", postId: p.id, career: p.career_tag, fraction: 0.8 });
              }}
              onAskAi={() => {
                setAskCareer(p.career_tag);
                setAskOpen(true);
              }}
            />
          ))}
        </div>

        {/* Custom bottom tab bar (matches mockup spacing) */}
        <BottomBar />
      </div>

      <AskAiSheet open={askOpen} onOpenChange={setAskOpen} career={askCareer} />
    </MobileFrame>
  );
}

function EmptyFeed() {
  return (
    <div className="flex h-dvh items-center justify-center px-8 text-center">
      <div>
        <p className="text-base font-semibold text-foreground">No videos yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Connect creators or publish posts to <code className="rounded bg-card px-1">feed_posts</code> to start your feed.
        </p>
      </div>
    </div>
  );
}

function FeedCard({
  post,
  isActive,
  onVisible,
  onAskAi,
}: {
  post: FeedPost;
  isActive: boolean;
  onVisible: () => void;
  onAskAi: () => void;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.intersectionRatio > 0.6 && onVisible()),
      { threshold: [0, 0.6, 0.9] },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [onVisible]);

  return (
    <section
      ref={ref}
      className="snap-start relative h-dvh w-full overflow-hidden"
      style={{ background: post.gradient }}
      aria-label={`${post.career_tag} video`}
    >
      {/* subtle moving gradient feel */}
      <div className="pointer-events-none absolute inset-0 opacity-60 mix-blend-screen"
           style={{ background: "radial-gradient(60% 40% at 30% 20%, oklch(0.4 0.15 290 / 0.35), transparent 70%)" }} />

      {/* Right action rail */}
      <div className="absolute bottom-[210px] right-3 z-10 flex flex-col items-center gap-5 text-white">
        <div className="relative">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-white/90 bg-gradient-to-br from-fuchsia-400 to-rose-500 text-sm font-semibold">
            {post.handle[1]?.toUpperCase() ?? "P"}
          </div>
          <span className="absolute -bottom-2 left-1/2 flex h-5 w-5 -translate-x-1/2 items-center justify-center rounded-full bg-[oklch(0.66_0.22_25)] text-white">
            <Plus className="h-3 w-3" strokeWidth={3} />
          </span>
        </div>

        <RailButton
          icon={<Heart className={cn("h-7 w-7", liked && "fill-[oklch(0.7_0.21_20)] text-[oklch(0.7_0.21_20)]")} strokeWidth={1.8} />}
          label={formatCount(post.likes + (liked ? 1 : 0))}
          onClick={() => {
            setLiked((v) => !v);
            if (!liked) trackEvent({ type: "like", postId: post.id, career: post.career_tag });
          }}
        />
        <RailButton
          icon={<MessageCircle className="h-7 w-7" strokeWidth={1.8} />}
          label={formatCount(post.comments)}
        />
        <RailButton
          icon={<Bookmark className={cn("h-7 w-7", saved && "fill-foreground text-foreground")} strokeWidth={1.8} />}
          label={formatCount(post.saves + (saved ? 1 : 0))}
          onClick={() => {
            setSaved((v) => !v);
            if (!saved) trackEvent({ type: "save", postId: post.id, career: post.career_tag });
          }}
        />
        <RailButton icon={<Send className="h-7 w-7" strokeWidth={1.8} />} label={formatCount(post.shares)} />

        <AiButton onClick={onAskAi} className="!h-12 !w-12 !p-0 !rounded-full" aria-label="Ask AI">
          <></>
        </AiButton>
      </div>

      {/* Bottom meta overlay */}
      <div className="meta-overlay absolute inset-x-0 bottom-0 z-[5] px-5 pb-[110px] pt-24">
        <button
          onClick={() => navigate({ to: "/career/$id", params: { id: slugify(post.career_tag) } })}
          className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white backdrop-blur"
        >
          <span className="text-base leading-none">💼</span>
          {post.career_tag}
        </button>
        <p className="text-[15px] font-bold text-white">{post.handle}</p>
        <p className="mt-1 line-clamp-2 text-sm leading-snug text-white/85">{post.caption}</p>
      </div>

      {/* Thin progress indicator above tabs (mock-like) */}
      {isActive && (
        <div className="absolute inset-x-5 bottom-[88px] h-[2px] overflow-hidden rounded-full bg-white/15">
          <div className="h-full w-1/3 animate-pulse bg-white/80" />
        </div>
      )}
    </section>
  );
}

function RailButton({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1 active:scale-95">
      {icon}
      <span className="text-xs font-semibold text-white drop-shadow">{label}</span>
    </button>
  );
}

function BottomBar() {
  return (
    <nav className="absolute inset-x-0 bottom-0 z-20 flex h-[76px] items-center justify-around border-t border-white/10 bg-black/95 px-6 pb-3 pt-2 backdrop-blur">
      <Link to="/" className="flex flex-1 flex-col items-center justify-center gap-1">
        <HomeIconSolid />
        <span className="text-[11px] font-semibold text-white">Home</span>
      </Link>
      <Link to="/create" className="flex flex-1 items-center justify-center" aria-label="Create">
        <span className="flex h-9 w-14 items-center justify-center rounded-md bg-white text-black">
          <Plus className="h-5 w-5" strokeWidth={2.6} />
        </span>
      </Link>
      <Link to="/profile" className="flex flex-1 flex-col items-center justify-center gap-1">
        <ProfileIcon />
        <span className="text-[11px] text-white/60">Profile</span>
      </Link>
    </nav>
  );
}

function HomeIconSolid() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1v-8.5Z" stroke="currentColor" strokeWidth="2" className="text-white" strokeLinejoin="round" />
    </svg>
  );
}
function ProfileIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" className="text-white/60" />
      <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" stroke="currentColor" strokeWidth="2" className="text-white/60" strokeLinecap="round" />
    </svg>
  );
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
