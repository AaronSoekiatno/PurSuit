import { Sparkles } from "lucide-react";
import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export const AiButton = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, children, ...props }, ref) => (
    <button
      ref={ref}
      {...props}
      className={cn(
        "gradient-ai inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white shadow-[0_8px_30px_-8px_oklch(0.62_0.24_295/0.6)] transition-transform active:scale-95",
        className,
      )}
    >
      <Sparkles className="h-4 w-4" strokeWidth={2.4} />
      {children ?? "Ask AI"}
    </button>
  ),
);
AiButton.displayName = "AiButton";
