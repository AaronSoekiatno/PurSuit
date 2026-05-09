import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Sparkles, Construction } from "lucide-react";
import { MobileFrame } from "@/components/MobileFrame";

export const Route = createFileRoute("/create")({
  head: () => ({
    meta: [{ title: "Create · PurSuit" }, { name: "description", content: "Creator tools coming soon." }],
  }),
  component: CreatePage,
});

function CreatePage() {
  return (
    <MobileFrame>
      <div className="flex items-center gap-3 px-5 pt-5">
        <Link to="/" aria-label="Back" className="p-1 -ml-1"><ArrowLeft className="h-5 w-5" /></Link>
        <h1 className="text-base font-semibold">Create</h1>
      </div>
      <div className="flex flex-col items-center justify-center px-8 pt-28 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full gradient-ai">
          <Construction className="h-7 w-7 text-white" />
        </div>
        <p className="mt-4 text-base font-semibold">Creator tools — coming soon</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Soon you'll be able to film a day-in-the-life and tag a career.
        </p>
        <div className="mt-6 flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5" /> Want early access? Sign in coming soon.
        </div>
      </div>
    </MobileFrame>
  );
}
