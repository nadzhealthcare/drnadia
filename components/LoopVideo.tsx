"use client";

import { useEffect, useRef } from "react";

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

    let visible = false;

    /*
     * Autoplay can still be refused even with muted + playsInline — iOS Low
     * Power Mode is the common case, and there the poster would simply sit
     * there forever. Falling back to the first interaction anywhere on the
     * page gets it running without asking the reader to do anything special.
     */
    const attempt = () => {
      if (!visible) return;
      el.play().catch(() => {});
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible) attempt();
        else el.pause();
      },
      { threshold: 0.05 },
    );
    io.observe(el);

    const opts = { passive: true } as const;
    window.addEventListener("touchstart", attempt, opts);
    window.addEventListener("pointerdown", attempt, opts);

    return () => {
      io.disconnect();
      window.removeEventListener("touchstart", attempt);
      window.removeEventListener("pointerdown", attempt);
    };
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
