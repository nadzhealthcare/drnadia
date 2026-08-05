"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger, prefersReducedMotion } from "@/lib/gsap";

/**
 * Lenis drives the page scroll and GSAP's ticker drives Lenis, so every
 * ScrollTrigger reads the same frame Lenis just wrote. Without this the
 * scroll-linked backdrop and reveals lag one frame behind the content.
 */
export default function SmoothScroll() {
  useEffect(() => {
    if (prefersReducedMotion()) return;

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      touchMultiplier: 1.6,
      lerp: 0.1,
    });

    lenis.on("scroll", ScrollTrigger.update);

    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    /*
     * Recalculate every trigger once the page has actually settled. This effect
     * runs before the sections mount, so the refresh is deferred two frames —
     * past their mount effects, and outside the refresh cycle that
     * `gsap.matchMedia` setup runs inside, since a refresh requested during a
     * refresh is dropped. Fonts land later still and reflow the type, so the
     * same recalculation runs again once they are ready.
     *
     * Note this is not what keeps triggers correct around the pinned sections —
     * that is `refreshPriority`, set on the pins and on the backdrop triggers.
     */
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => ScrollTrigger.refresh());
    });
    document.fonts?.ready.then(() => ScrollTrigger.refresh());

    /*
     * Overlays (the lightbox) ask for the page to hold still. `overflow:
     * hidden` on the body cannot do that here, because Lenis drives the scroll
     * itself rather than leaving it to the browser.
     */
    const onLock = (e: Event) => {
      const locked = (e as CustomEvent<boolean>).detail;
      if (locked) lenis.stop();
      else lenis.start();
    };
    window.addEventListener("scroll-lock", onLock);

    // in-page anchors go through Lenis so they inherit the same easing
    const onClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement)?.closest?.(
        'a[href^="#"]',
      ) as HTMLAnchorElement | null;
      if (!anchor) return;
      const id = anchor.getAttribute("href");
      if (!id || id === "#") return;
      const el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      lenis.scrollTo(el as HTMLElement, { offset: 0, duration: 1.4 });
    };
    document.addEventListener("click", onClick);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll-lock", onLock);
      document.removeEventListener("click", onClick);
      gsap.ticker.remove(raf);
      lenis.destroy();
    };
  }, []);

  return null;
}
