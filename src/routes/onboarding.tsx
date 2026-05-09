import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Welcome to PurSuit" },
      { name: "description", content: "Tell us about you so we can tailor your career feed." },
    ],
  }),
  component: OnboardingPage,
});

const INTERESTS = ["Tech", "Design", "Healthcare", "Finance", "Engineering", "Trades", "Education", "Media", "Science"];
const GOALS = ["Switch careers", "Just exploring", "Pick a major", "Find a first job", "Earn more"];
const EDU = ["High school", "Some college", "Bachelor's", "Grad school"];

function OnboardingPage() {
  const navigate = useNavigate();
  const [interests, setInterests] = useState<string[]>([]);
  const [goal, setGoal] = useState<string | null>(null);
  const [edu, setEdu] = useState<string | null>(null);

  function toggle(arr: string[], v: string, set: (n: string[]) => void) {
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-background px-6 pb-8 pt-12 text-foreground">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="flex h-7 w-7 items-center justify-center rounded-full gradient-ai">
          <Sparkles className="h-3.5 w-3.5 text-white" />
        </span>
        PurSuit
      </div>

      <h1 className="mt-8 text-3xl font-bold leading-tight">
        Find a <span className="text-gradient-ai">career path</span> that fits you.
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Pick a few things — your feed will adapt as you watch.
      </p>

      <Section title="Interests">
        <Chips options={INTERESTS} values={interests} onToggle={(v) => toggle(interests, v, setInterests)} />
      </Section>

      <Section title="Goal">
        <Chips options={GOALS} values={goal ? [goal] : []} onToggle={(v) => setGoal(v === goal ? null : v)} single />
      </Section>

      <Section title="Education">
        <Chips options={EDU} values={edu ? [edu] : []} onToggle={(v) => setEdu(v === edu ? null : v)} single />
      </Section>

      <Section title="Language">
        <select className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm">
          <option>English</option>
          <option>Español</option>
          <option>Français</option>
        </select>
      </Section>

      <button
        onClick={() => navigate({ to: "/" })}
        className="mt-auto flex items-center justify-center gap-2 rounded-full bg-foreground px-6 py-4 text-sm font-semibold text-background"
      >
        Start your feed <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-7">
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h2>
      {children}
    </div>
  );
}

function Chips({
  options, values, onToggle, single = false,
}: { options: string[]; values: string[]; onToggle: (v: string) => void; single?: boolean }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const active = values.includes(o);
        return (
          <button
            key={o}
            onClick={() => onToggle(o)}
            className={`rounded-full border px-3.5 py-2 text-sm transition-colors ${
              active
                ? "border-transparent bg-foreground text-background"
                : "border-border bg-card text-foreground hover:bg-accent"
            }`}
            aria-pressed={active}
          >
            {o}
          </button>
        );
      })}
      {single && values.length > 0 && (
        <span className="sr-only">Selected: {values[0]}</span>
      )}
    </div>
  );
}
