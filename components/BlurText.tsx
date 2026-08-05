"use client";

import { useEffect, useMemo, useRef, type ElementType } from "react";
import { gsap, ScrollTrigger, prefersReducedMotion } from "@/lib/gsap";

type Props = {
  /** Wrap a run in *asterisks* to set it in the italic serif. */
  text: string;
  as?: ElementType;
  className?: string;
  /** "char" gives the heavier, more dramatic bloom — keep it for short lines. */
  split?: "word" | "char";
  delay?: number;
  stagger?: number;
  blur?: number;
  y?: number;
  /** Fire on mount instead of when scrolled into view (hero copy). */
  onLoad?: boolean;
  style?: React.CSSProperties;
};

type Piece = { text: string; italic: boolean };

function parse(text: string): Piece[] {
  return text
    .split("*")
    .map((t, i) => ({ text: t, italic: i % 2 === 1 }))
    .filter((p) => p.text.length > 0);
}

export default function BlurText({
  text,
  as: Tag = "span",
  className = "",
  split = "word",
  delay = 0,
  stagger = 0.055,
  blur = 16,
  y = 26,
  onLoad = false,
  style,
}: Props) {
  const ref = useRef<HTMLElement>(null);

  const pieces = useMemo(() => parse(text), [text]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const words = el.querySelectorAll<HTMLElement>(".w");
    if (!words.length) return;

    if (prefersReducedMotion()) {
      el.dataset.ready = "1";
      gsap.set(words, { opacity: 1, filter: "none", y: 0 });
      return;
    }

    const ctx = gsap.context(() => {
      el.dataset.ready = "1";
      const tween = gsap.fromTo(
        words,
        {
          opacity: 0,
          filter: `blur(${blur}px)`,
          yPercent: (y / 26) * 55,
          scale: 1.06,
        },
        {
          opacity: 1,
          filter: "blur(0px)",
          yPercent: 0,
          scale: 1,
          duration: 1.25,
          ease: "expo.out",
          stagger: { each: stagger, from: "start" },
          delay,
          // Blur filters are expensive, so drop the hint once the word lands —
          // and clear the filter outright rather than leaving `blur(0px)` on,
          // which still costs a filter pass and keeps the span on its own
          // compositing layer for nothing.
          onComplete: () =>
            gsap.set(words, { willChange: "auto", filter: "none" }),
          scrollTrigger: onLoad
            ? undefined
            : { trigger: el, start: "top 88%", once: true },
        },
      );
      return () => {
        tween.scrollTrigger?.kill();
      };
    }, el);

    ScrollTrigger.refresh();
    return () => ctx.revert();
  }, [blur, delay, onLoad, stagger, y, text]);

  return (
    <Tag
      ref={ref as never}
      className={`blurText ${className}`}
      data-ready="0"
      style={style}
    >
      {pieces.map((piece, pi) => {
        const units =
          split === "char"
            ? Array.from(piece.text)
            : piece.text.split(/(\s+)/).filter((s) => s.length > 0);

        const Inner = piece.italic ? "i" : "span";

        return (
          <Inner key={pi}>
            {units.map((u, ui) =>
              // whitespace stays a plain text node so lines still wrap
              split === "word" && /^\s+$/.test(u) ? (
                <span key={ui}> </span>
              ) : (
                <span key={ui} className="w">
                  {u}
                </span>
              ),
            )}
          </Inner>
        );
      })}
    </Tag>
  );
}
