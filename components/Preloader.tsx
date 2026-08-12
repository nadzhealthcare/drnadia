"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import s from "./Preloader.module.css";

/** the deck, dealt one over the next */
const STACK = [
  "/assets/drnadia6.webp",
  "/assets/event-padel-club.webp",
  "/assets/drnadia5.webp",
  "/assets/event-vital-voices.webp",
  "/assets/drnadiapose.webp",
  "/assets/hero_nadia1.webp",
];

/**
 * What the first screen actually needs. The hero's two plates are what the
 * page opens on, so the loader waits for them rather than for the deck alone.
 */
const CRITICAL = [...new Set([...STACK, "/assets/hero_nadia2.webp"])];

/** the deck needs long enough to read as a deck, however fast the network is */
const MIN_MS = 1900;
/** and the door opens regardless if something stalls */
const MAX_MS = 7000;

export default function Preloader() {
  const rootRef = useRef<HTMLDivElement>(null);
  const deckRef = useRef<HTMLDivElement>(null);
  const countRef = useRef<HTMLSpanElement>(null);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const root = rootRef.current;
    const deck = deckRef.current;
    if (!root || !deck) return;

    const reduced = prefersReducedMotion();
    const started = performance.now();
    let done = false;
    let progress = 0;

    // the page must not scroll underneath while the loader is up
    window.dispatchEvent(new CustomEvent("scroll-lock", { detail: true }));

    const finish = () => {
      if (done) return;
      done = true;
      window.dispatchEvent(new CustomEvent("scroll-lock", { detail: false }));

      if (reduced) {
        setGone(true);
        return;
      }
      gsap
        .timeline({ onComplete: () => setGone(true) })
        .to(deck, { scale: 1.06, opacity: 0, duration: 0.5, ease: "power2.in" })
        .to(
          root,
          {
            // wipes upward off the page rather than simply fading
            clipPath: "inset(0% 0% 100% 0%)",
            duration: 0.85,
            ease: "power3.inOut",
          },
          "-=0.15",
        );
    };

    // ── load the critical set, counting as they land ──────────
    let loaded = 0;
    const bump = () => {
      loaded++;
      progress = loaded / CRITICAL.length;
    };
    Promise.all(
      CRITICAL.map(
        (src) =>
          new Promise<void>((res) => {
            const img = new Image();
            // a failed image must not hold the door shut
            img.onload = img.onerror = () => {
              bump();
              res();
            };
            img.src = src;
          }),
      ),
    ).then(() => {
      const wait = Math.max(0, MIN_MS - (performance.now() - started));
      window.setTimeout(finish, wait);
    });

    const bail = window.setTimeout(finish, MAX_MS);

    // ── the deck, and the counter chasing the real figure ─────
    const ctx = gsap.context(() => {
      if (!reduced) {
        gsap.fromTo(
          `.${s.card}`,
          { opacity: 0, scale: 1.14, yPercent: 6, filter: "blur(12px)" },
          {
            opacity: 1,
            scale: 1,
            yPercent: 0,
            filter: "blur(0px)",
            duration: 0.5,
            ease: "expo.out",
            stagger: 0.15,
          },
        );
      }

      let shown = 0;
      gsap.ticker.add(function tick() {
        if (done) return gsap.ticker.remove(tick);
        // eases toward the true figure, so it never jumps or stalls at 99
        shown += (progress - shown) * 0.06;
        if (countRef.current)
          countRef.current.textContent = String(
            Math.min(99, Math.round(shown * 100)),
          ).padStart(2, "0");
      });
    }, root);

    return () => {
      window.clearTimeout(bail);
      ctx.revert();
    };
  }, []);

  if (gone) return null;

  return (
    <div className={`${s.root} preloader`} ref={rootRef} aria-hidden="true">
      <div className={s.deck} ref={deckRef}>
        {STACK.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={src}
            className={s.card}
            src={src}
            alt=""
            style={{ zIndex: i + 1 }}
          />
        ))}
      </div>

      <p className={s.meta}>
        <span className={s.name}>Dr. Nadia Choudhry</span>
        <span className={s.count}>
          <span ref={countRef}>00</span>
        </span>
      </p>
    </div>
  );
}
