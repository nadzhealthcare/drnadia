"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { gsap, ScrollTrigger, prefersReducedMotion } from "@/lib/gsap";

/** Scrubs its child vertically as the wrapper crosses the viewport. */
export default function Parallax({
  children,
  amount = 12,
  className = "",
}: {
  children: ReactNode;
  /** percent of the child's own height */
  amount?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el.firstElementChild,
        { yPercent: -amount },
        {
          yPercent: amount,
          ease: "none",
          scrollTrigger: {
            trigger: el,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        },
      );
    }, el);

    ScrollTrigger.refresh();
    return () => ctx.revert();
  }, [amount]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
