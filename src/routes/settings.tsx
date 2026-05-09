import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Trash2 } from "lucide-react";
import { MobileFrame } from "@/components/MobileFrame";
import { Switch } from "@/components/ui/switch";
import { clearSignals } from "@/lib/sessionSignals";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings · PurSuit" }, { name: "description", content: "Account and privacy settings." }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const [captions, setCaptions] = useState(true);
  const [sessionOnly, setSessionOnly] = useState(false);
  const [lang, setLang] = useState("English");

  return (
    <MobileFrame>
      <div className="px-5 pt-5">
        <div className="flex items-center gap-3">
          <Link to="/" aria-label="Back" className="p-1 -ml-1"><ArrowLeft className="h-5 w-5" /></Link>
          <h1 className="text-base font-semibold">Settings</h1>
        </div>

        <Group title="Playback">
          <Row label="Captions" desc="Show captions on videos when available">
            <Switch checked={captions} onCheckedChange={setCaptions} />
          </Row>
        </Group>

        <Group title="Language">
          <Row label="App language" desc="Affects feed and UI">
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              className="rounded-md border border-border bg-card px-3 py-1.5 text-sm"
            >
              <option>English</option><option>Español</option><option>Français</option>
            </select>
          </Row>
        </Group>

        <Group title="Privacy">
          <Row
            label="Session-only mode"
            desc="Don't persist watch history. Recaps still work for the current session, then reset on close."
          >
            <Switch checked={sessionOnly} onCheckedChange={setSessionOnly} />
          </Row>
          <button
            onClick={() => { clearSignals(); }}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm text-destructive"
          >
            <Trash2 className="h-4 w-4" /> Clear session analytics
          </button>
        </Group>

        <Group title="About">
          <Row label="Version" desc="PurSuit v0.1.0 (web preview)">
            <span className="text-xs text-muted-foreground">beta</span>
          </Row>
        </Group>

        <div className="h-6" />
      </div>
    </MobileFrame>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-6">
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h2>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Row({ label, desc, children }: { label: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-4">
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="truncate text-xs text-muted-foreground">{desc}</p>
      </div>
      {children}
    </div>
  );
}
