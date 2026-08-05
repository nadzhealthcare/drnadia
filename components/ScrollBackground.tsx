"use client";

import { useEffect } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";

/**
 * Every section carries `data-bg` (and optionally `data-tint`). As one takes
 * over the middle of the viewport the fixed backdrop tweens to its palette,
 * so the page reads as a single surface changing temperature rather than a
 * stack of coloured blocks.
 */
export default function ScrollBackground() {
  useEffect(() => {
    const backdrop = document.querySelector<HTMLElement>(".backdrop");
    if (!backdrop) return;

    const sections = gsap.utils.toArray<HTMLElement>("[data-bg]");
    if (!sections.length) return;

    const apply = (el: HTMLElement) => {
      const bg = el.dataset.bg!;
      const tint = el.dataset.tint || "rgba(196,150,116,0)";
      const tintY = el.dataset.tintY || "24%";
      gsap.to(backdrop, {
        backgroundColor: bg,
        duration: 0.9,
        ease: "power2.out",
        overwrite: "auto",
      });
      gsap.to(backdrop, {
        "--bg-tint": tint,
        "--tint-y": tintY,
        duration: 1.1,
        ease: "power2.out",
        overwrite: "auto",
      } as gsap.TweenVars);
      gsap.to(document.documentElement, {
        "--bg": bg,
        duration: 0.9,
      } as gsap.TweenVars);
    };

    const triggers = sections.map((el) =>
      ScrollTrigger.create({
        trigger: el,
        start: "top 60%",
        end: "bottom 40%",
        /*
         * Refresh last. A refresh reverts each pin to measure its natural
         * position, so anything recalculated before the pinned sections would
         * read a layout with no pin spacers in it — which had these triggers
         * sitting thousands of pixels early, cycling the backdrop through
         * later sections while the reader was still inside a pin.
         */
        refreshPriority: -1,
        onEnter: () => apply(el),
        onEnterBack: () => apply(el),
      }),
    );

    apply(sections[0]);

    return () => triggers.forEach((t) => t.kill());
  }, []);

  return <div className="backdrop" aria-hidden="true" />;
}
