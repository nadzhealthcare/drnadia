"use client";

import { useEffect, useRef, type ElementType, type ReactNode } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";

type Props = {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  delay?: number;
  /** stagger direct children instead of moving the block as one */
  stagger?: number;
  y?: number;
  blur?: number;
  id?: string;
} & Record<`data-${string}`, string | undefined>;

export default function Reveal({
  children,
  as: Tag = "div",
  className = "",
  delay = 0,
  stagger,
  y = 26,
  blur = 0,
  id,
  ...rest
}: Props) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      const targets = stagger ? Array.from(el.children) : [el];
      gsap.fromTo(
        targets,
        {
          opacity: 0,
          y,
          filter: blur ? `blur(${blur}px)` : "none",
        },
        {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 1.1,
          ease: "expo.out",
          delay,
          stagger: stagger ?? 0,
          scrollTrigger: { trigger: el, start: "top 86%", once: true },
        },
      );
    }, el);

    ScrollTrigger.refresh();
    return () => ctx.revert();
  }, [delay, stagger, y, blur]);

  return (
    <Tag ref={ref as never} className={className} id={id} {...rest}>
      {children}
    </Tag>
  );
}
