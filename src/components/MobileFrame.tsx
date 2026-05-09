import { Link, useLocation } from "@tanstack/react-router";
import { Home, Plus, User } from "lucide-react";
import { type ReactNode } from "react";

interface MobileFrameProps {
  children: ReactNode;
  /** Hide bottom tabs (e.g. for fullscreen onboarding) */
  hideTabs?: boolean;
  /** Reserve bottom safe-area padding for content above the tab bar */
  padForTabs?: boolean;
}

export function MobileFrame({ children, hideTabs = false, padForTabs = true }: MobileFrameProps) {
  return (
    <div className="min-h-dvh w-full bg-background text-foreground">
      <div className="relative mx-auto flex min-h-dvh w-full max-w-[480px] flex-col overflow-hidden bg-background">
        <main className={`relative flex-1 ${padForTabs && !hideTabs ? "pb-[76px]" : ""}`}>
          {children}
        </main>
        {!hideTabs && <BottomTabs />}
      </div>
    </div>
  );
}

function BottomTabs() {
  const { pathname } = useLocation();
  const isHome = pathname === "/" || pathname.startsWith("/following");
  const isProfile = pathname.startsWith("/profile");

  return (
    <nav
      className="absolute bottom-0 left-0 right-0 z-30 flex h-[76px] items-center justify-around border-t border-border bg-background/95 px-6 pb-3 pt-2 backdrop-blur"
      aria-label="Primary"
    >
      <Link
        to="/"
        className="flex flex-1 flex-col items-center justify-center gap-1"
        aria-label="Home"
      >
        <Home
          className={`h-6 w-6 ${isHome ? "text-foreground" : "text-muted-foreground"}`}
          strokeWidth={isHome ? 2.4 : 2}
        />
        <span className={`text-[11px] ${isHome ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
          Home
        </span>
      </Link>

      <Link
        to="/create"
        className="flex flex-1 items-center justify-center"
        aria-label="Create"
      >
        <span className="flex h-9 w-14 items-center justify-center rounded-md bg-foreground text-background">
          <Plus className="h-5 w-5" strokeWidth={2.5} />
        </span>
      </Link>

      <Link
        to="/profile"
        className="flex flex-1 flex-col items-center justify-center gap-1"
        aria-label="Profile"
      >
        <User
          className={`h-6 w-6 ${isProfile ? "text-foreground" : "text-muted-foreground"}`}
          strokeWidth={isProfile ? 2.4 : 2}
        />
        <span className={`text-[11px] ${isProfile ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
          Profile
        </span>
      </Link>
    </nav>
  );
}
