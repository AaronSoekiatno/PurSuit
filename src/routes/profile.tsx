import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Settings as SettingsIcon } from "lucide-react";
import { MobileFrame } from "@/components/MobileFrame";
import { careers } from "@/lib/fixtures";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile · PurSuit" },
      { name: "description", content: "Your saved careers, videos and recaps." },
    ],
  }),
  component: ProfilePage,
});

const TABS = ["Saved Careers", "Saved Videos", "Recaps"] as const;

function ProfilePage() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Saved Careers");

  return (
    <MobileFrame>
      <div className="px-5 pt-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-400 to-blue-500 text-xl font-semibold text-white">
              U
            </div>
            <div>
              <p className="text-base font-semibold">Your name</p>
              <p className="text-xs text-muted-foreground">@you</p>
            </div>
          </div>
          <Link to="/settings" aria-label="Settings" className="p-2">
            <SettingsIcon className="h-5 w-5 text-muted-foreground" />
          </Link>
        </div>

        <div className="mt-5 flex gap-3 text-center text-sm">
          <Stat label="Watched" value="48" />
          <Stat label="Saved" value="12" />
          <Stat label="Recaps" value="3" />
        </div>

        <Link
          to="/wrapped"
          className="mt-5 flex items-center justify-between rounded-2xl border border-border bg-card p-4"
        >
          <div>
            <p className="text-sm font-semibold">Your Session Wrapped</p>
            <p className="text-xs text-muted-foreground">See what you've been exploring</p>
          </div>
          <span className="rounded-full gradient-ai px-3 py-1.5 text-xs font-semibold text-white">View</span>
        </Link>

        <div className="mt-6 flex gap-1 rounded-full bg-muted p-1">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 rounded-full px-3 py-2 text-xs font-medium transition-colors ${
                tab === t ? "bg-background text-foreground shadow" : "text-muted-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 pb-6">
          {tab === "Saved Careers" &&
            careers.slice(0, 4).map((c) => (
              <Link
                to="/career/$id"
                params={{ id: c.id }}
                key={c.id}
                className="flex aspect-[4/5] flex-col justify-between rounded-2xl border border-border bg-card p-3"
              >
                <div className="text-3xl">{c.emoji}</div>
                <div>
                  <p className="text-sm font-semibold">{c.title}</p>
                  <p className="text-xs text-muted-foreground">{c.category}</p>
                </div>
              </Link>
            ))}
          {tab === "Saved Videos" && <Empty msg="No saved videos yet. Tap the bookmark on any video." />}
          {tab === "Recaps" && <Empty msg="Open Wrapped to generate your first recap." />}
        </div>
      </div>
    </MobileFrame>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex-1 rounded-2xl border border-border bg-card py-3">
      <p className="text-base font-semibold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function Empty({ msg }: { msg: string }) {
  return <p className="col-span-2 mt-4 text-center text-sm text-muted-foreground">{msg}</p>;
}
