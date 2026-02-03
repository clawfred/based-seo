"use client";

import * as React from "react";

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  /**
   * Set to true to animate only once (default).
   */
  once?: boolean;
};

export function Reveal({ children, className, once = true }: RevealProps) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        if (entry.isIntersecting) {
          setVisible(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setVisible(false);
        }
      },
      { root: null, rootMargin: "-10% 0px -10% 0px", threshold: 0.1 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [once]);

  return (
    <div
      ref={ref}
      className={["reveal", visible ? "reveal--in" : "reveal--out", className]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}
