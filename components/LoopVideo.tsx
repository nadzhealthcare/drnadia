"use client";

import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "@/lib/gsap";

type Props = {
  src: string;
  poster: string;
  className?: string;
  /** described by the figure's caption, so the element itself is decorative */
  label?: string;
};

/**
 * A muted, looping background reel.
 *
 * `muted` + `playsInline` are what make autoplay permissible at all on iOS and
 * in Chrome's policy; without both the play() promise rejects and the poster is
 * all anyone ever sees. Playback is tied to visibility so a reel that has been
 * scrolled past stops decoding, and reduced-motion visitors get the poster
 * frame instead of motion they did not ask for.
 */
export default function LoopVideo({ src, poster, className, label }: Props) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (prefersReducedMotion()) {
      el.removeAttribute("autoplay");
      el.pause();
      return;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // a rejected promise here is normal (tab hidden, low power mode);
          // the poster stays up and nothing else breaks
          el.play().catch(() => {});
        } else {
          el.pause();
        }
      },
      { threshold: 0.05 },
    );
    io.observe(el);

    return () => io.disconnect();
  }, []);

  return (
    <video
      ref={ref}
      className={className}
      src={src}
      poster={poster}
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      disablePictureInPicture
      aria-label={label}
      role={label ? undefined : "presentation"}
      tabIndex={-1}
    />
  );
}
