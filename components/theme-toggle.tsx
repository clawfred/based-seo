"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";

function canUseViewTransitions(): boolean {
  return (
    typeof document !== "undefined" &&
    typeof (document as unknown as { startViewTransition?: unknown }).startViewTransition ===
      "function"
  );
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const btnRef = React.useRef<HTMLButtonElement | null>(null);

  const toggle = React.useCallback(() => {
    const nextTheme = theme === "dark" ? "light" : "dark";

    // Respect reduced motion.
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setTheme(nextTheme);
      return;
    }

    if (!canUseViewTransitions() || !btnRef.current) {
      setTheme(nextTheme);
      return;
    }

    const { top, left, width, height } = btnRef.current.getBoundingClientRect();
    const x = left + width / 2;
    const y = top + height / 2;

    // Compute a circle large enough to cover the entire viewport.
    const maxX = Math.max(x, window.innerWidth - x);
    const maxY = Math.max(y, window.innerHeight - y);
    const endRadius = Math.hypot(maxX, maxY);

    const transition = (
      document as unknown as { startViewTransition: (cb: () => void) => { ready: Promise<void> } }
    ).startViewTransition(() => {
      setTheme(nextTheme);
    });

    transition.ready.then(() => {
      const clip = [`circle(0px at ${x}px ${y}px)`, `circle(${endRadius}px at ${x}px ${y}px)`];

      // Always animate the NEW view "painting" in.
      // This gives the same effect for both dark→light and light→dark.
      document.documentElement.animate(
        {
          clipPath: clip,
        },
        {
          duration: 520,
          easing: "cubic-bezier(0.2, 1, 0.2, 1)",
          pseudoElement: "::view-transition-new(root)",
        },
      );
    });
  }, [setTheme, theme]);

  return (
    <Button
      ref={btnRef}
      variant="ghost"
      size="icon"
      className="size-9 rounded-md"
      onClick={toggle}
      aria-label="Toggle theme"
    >
      <Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </Button>
  );
}
