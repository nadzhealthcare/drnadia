"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import BlurText from "./BlurText";
import s from "./BigQuote.module.css";

/**
 * Each card keeps its source's own proportions rather than a shared crop, so
 * `w`/`h` carry the native pixel size and the ratio is derived from them.
 * `fx`/`fy` are where it comes to rest, as a fraction of the viewport from the
 * centre; `d` is when it sets off. They ring the quote — the type keeps its own
 * layer above them — and stay square to the frame.
 */
const CARDS = [
  { src: "/assets/drnadia1.webp", w: 1200, h: 630, fx: -0.34, fy: -0.32, d: 0 },
  { src: "/assets/drnadia4.webp", w: 1080, h: 1350, fx: -0.4, fy: 0, d: 0.4 },
  {
    src: "/assets/drnadia5.webp",
    w: 1080,
    h: 1350,
    fx: -0.26,
    fy: 0.31,
    d: 0.8,
  },
  { src: "/assets/drnadia3.webp", w: 1200, h: 630, fx: 0, fy: -0.4, d: 1.2 },
  { src: "/assets/drnadia2.webp", w: 1200, h: 630, fx: 0.34, fy: -0.32, d: 1.6 },
  { src: "/assets/drnadia6.webp", w: 1080, h: 1350, fx: 0.4, fy: 0.01, d: 2 },
  {
    src: "/assets/drnadia7.webp",
    w: 1080,
    h: 1350,
    fx: 0.26,
    fy: 0.31,
    d: 2.4,
  },
];

export default function BigQuote() {
  const stageRef = useRef<HTMLElement>(null);
  const fieldRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState<number | null>(null);

  const close = useCallback(() => setOpen(null), []);

  useEffect(() => {
    const stage = stageRef.current;
    const field = fieldRef.current;
    if (!stage || !field) return;

    const mm = gsap.matchMedia();

    /*
     * Only the wide, motion-permitting case flies. Narrow viewports and
     * reduced-motion visitors get the same cards laid out flat beneath the
     * quote, with no pin and no 3D — still openable.
     */
    mm.add(
      "(min-width: 901px) and (prefers-reduced-motion: no-preference)",
      () => {
        const cards = gsap.utils.toArray<HTMLElement>(`.${s.card}`, field);

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: stage,
            start: "top top",
            end: () => `+=${window.innerHeight * 2.2}`,
            pin: true,
            anticipatePin: 1,
            scrub: 0.8,
            // pins must refresh before the triggers positioned after them
            refreshPriority: 1,
            invalidateOnRefresh: true,
          },
        });

        cards.forEach((card, i) => {
          const c = CARDS[i];
          tl.fromTo(
            card,
            {
              // far behind the quote, dead centre, out of focus
              z: -2600,
              x: 0,
              y: 0,
              // resolved against the card's size at render time, so it holds
              // whatever the clamp and aspect-ratio work out to
              xPercent: -50,
              yPercent: -50,
              opacity: 0,
              filter: "blur(26px)",
            },
            {
              // function-based so a resize re-derives the resting places
              z: 0,
              x: () => window.innerWidth * c.fx,
              y: () => window.innerHeight * c.fy,
              xPercent: -50,
              yPercent: -50,
              opacity: 1,
              filter: "blur(0px)",
              duration: 2,
              ease: "power2.out",
            },
            c.d,
          );
        });

        return () => {
          tl.scrollTrigger?.kill();
          tl.kill();
        };
      },
    );

    return () => mm.revert();
  }, []);

  /*
   * While the lightbox is open: Esc closes it, and Lenis is told to hold still
   * so the page cannot scroll away behind it. `overflow: hidden` on the body
   * would not do that — Lenis drives the scroll itself.
   */
  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    window.dispatchEvent(new CustomEvent("scroll-lock", { detail: true }));
    return () => {
      window.removeEventListener("keydown", onKey);
      window.dispatchEvent(new CustomEvent("scroll-lock", { detail: false }));
    };
  }, [open, close]);

  return (
    <section
      ref={stageRef}
      className={s.stage}
      data-bg="#191a1c"
      data-tint="rgba(196,150,116,.17)"
      data-tint-y="60%"
    >
      {/* the cards share one perspective, so they read as one depth of field */}
      <div className={s.field} ref={fieldRef}>
        {CARDS.map((c, i) => (
          <button
            type="button"
            className={s.card}
            key={c.src}
            data-orient={c.w > c.h ? "land" : "port"}
            style={{ aspectRatio: `${c.w} / ${c.h}` }}
            onClick={() => setOpen(i)}
            aria-label={`Open photograph ${i + 1} of ${CARDS.length}`}
            data-cursor="link"
          >
            {/* the drift lives on its own element: GSAP owns the card's
                transform, so a second animation there would be overwritten */}
            <span
              className={s.float}
              style={{
                animationDuration: `${6.4 + (i % 3) * 1.1}s`,
                animationDelay: `${i * -1.3}s`,
              }}
            >
              <Image
                src={c.src}
                alt=""
                width={c.w}
                height={c.h}
                sizes="(max-width: 900px) 46vw, 300px"
              />
            </span>
          </button>
        ))}
      </div>

      <div className={s.quote}>
        <BlurText
          as="h2"
          className={s.line}
          text="Every milestone advances Dr. Nadia’s *mission* to *transform* healthcare."
          blur={22}
          stagger={0.045}
        />
      </div>


      {open !== null && (
        <div
          className={s.modal}
          role="dialog"
          aria-modal="true"
          aria-label="Photograph"
          onClick={close}
        >
          <button
            type="button"
            className={s.close}
            onClick={close}
            aria-label="Close"
            autoFocus
          >
            Close
          </button>
          {/*
            The frame is sized from the viewport and its own ratio, not from
            the image's intrinsic size: `width: auto` would size to whatever
            the optimizer happened to serve, which capped this well below the
            space actually available.
          */}
          <div
            className={s.frame}
            style={{ ["--ar" as string]: CARDS[open].w / CARDS[open].h }}
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              className={s.modalImg}
              src={CARDS[open].src}
              alt="Dr. Nadia Choudhry"
              fill
              sizes="96vw"
              priority
            />
          </div>
        </div>
      )}
    </section>
  );
}
