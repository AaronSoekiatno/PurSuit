import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Users } from "lucide-react";
import { MobileFrame } from "@/components/MobileFrame";

export const Route = createFileRoute("/following")({
  head: () => ({
    meta: [{ title: "Following · PurSuit" }, { name: "description", content: "Videos from creators you follow." }],
  }),
  component: FollowingPage,
});

function FollowingPage() {
  return (
    <MobileFrame>
      <div className="flex items-center gap-3 px-5 pt-5">
        <Link to="/" aria-label="Back" className="p-1 -ml-1"><ArrowLeft className="h-5 w-5" /></Link>
        <h1 className="text-base font-semibold">Following</h1>
      </div>
      <div className="flex flex-col items-center justify-center px-8 pt-32 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-card">
          <Users className="h-7 w-7 text-muted-foreground" />
        </div>
        <p className="mt-4 text-base font-semibold">No followed creators yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Tap the + on any creator's avatar in your For You feed.
        </p>
        <Link
          to="/"
          className="mt-5 rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background"
        >
          Explore For You
        </Link>
      </div>
    </MobileFrame>
  );
}
