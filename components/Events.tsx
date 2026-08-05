"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import BlurText from "./BlurText";
import s from "./Events.module.css";

/** every plate is 1368 × 1449, so the cards share one ratio */
const IMG = { w: 1368, h: 1449 };

const EVENTS: { src: string; title: string; meta: string; alt: string }[] = [
  {
    src: "/assets/event-health-award.webp",
    title: "Health Magazine Awards",
    meta: "2025 · Best Home Healthcare, presented by H.E. Sheikh Nahyan",
    alt: "Dr. Nadia Choudhry receiving the Best Home Healthcare award",
  },
  {
    src: "/assets/event-biohack-summit.webp",
    title: "World Biohack Summit",
    meta: "Dubai · 2025",
    alt: "Dr. Nadia Choudhry at the World Biohack Summit in Dubai",
  },
  {
    src: "/assets/event-vital-voices.webp",
    title: "Vital Voices",
    meta: "Podcast",
    alt: "Dr. Nadia Choudhry recording the Vital Voices podcast",
  },
  {
    src: "/assets/event-exhibition.webp",
    title: "Exhibition",
    meta: "Highlight",
    alt: "Dr. Nadia Choudhry at an exhibition",
  },
  {
    src: "/assets/event-sa-council.webp",
    title: "South African Business Council",
    meta: "Meet",
    alt: "Dr. Nadia Choudhry at the South African Business Council meet",
  },
  {
    src: "/assets/event-padel-club.webp",
    title: "Padel Club Event",
    meta: "Highlight",
    alt: "Dr. Nadia Choudhry speaking with guests at a padel club event",
  },
];

export default function Events() {
  const stageRef = useRef<HTMLElement>(null);
  const viewRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const nowRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const stage = stageRef.current;
    const view = viewRef.current;
    const track = trackRef.current;
    if (!stage || !view || !track) return;

    const mm = gsap.matchMedia();

    /*
     * Only the wide, motion-permitting case gets pinned. Touch viewports keep
     * a native swipeable track instead — pinning fights the platform's own
     * scrolling — and reduced-motion visitors get the same, unpinned.
     */
    mm.add(
      "(min-width: 861px) and (prefers-reduced-motion: no-preference)",
      () => {
        const cards = gsap.utils.toArray<HTMLElement>(`.${s.card}`, track);
        // recomputed on refresh so a resize or font swap cannot strand the run
        const distance = () => Math.max(0, track.scrollWidth - view.clientWidth);

        const drive = gsap.to(track, {
          x: () => -distance(),
          ease: "none",
          scrollTrigger: {
            trigger: stage,
            start: "top top",
            end: () => `+=${distance()}`,
            pin: true,
            anticipatePin: 1,
            scrub: 0.7,
            // pins must refresh before the triggers positioned after them
            refreshPriority: 1,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              if (barRef.current)
                barRef.current.style.transform = `scaleX(${self.progress})`;
              if (nowRef.current) {
                const i = Math.round(self.progress * (EVENTS.length - 1)) + 1;
                const label = String(i).padStart(2, "0");
                if (nowRef.current.textContent !== label)
                  nowRef.current.textContent = label;
              }
            },
          },
        });

        // Each card animates against its own position in the horizontal run.
        // containerAnimation is what lets a ScrollTrigger read "left 92%" of a
        // track that is being translated rather than scrolled.
        cards.forEach((card) => {
          gsap.fromTo(
            card,
            {
              opacity: 0,
              yPercent: 16,
              scale: 0.9,
              rotate: 1.5,
              filter: "blur(18px)",
            },
            {
              opacity: 1,
              yPercent: 0,
              scale: 1,
              rotate: 0,
              filter: "blur(0px)",
              duration: 1,
              ease: "expo.out",
              scrollTrigger: {
                trigger: card,
                containerAnimation: drive,
                start: "left 92%",
                once: true,
              },
            },
          );
        });

        ScrollTrigger.refresh();
      },
    );

    return () => mm.revert();
  }, []);

  return (
    <section
      ref={stageRef}
      className={s.stage}
      id="events"
      data-bg="#191a1d"
      data-tint="rgba(196,150,116,.1)"
    >
      <div className={s.head}>
        <BlurText
          as="h3"
          className={s.title}
          text="Events &amp; *Highlights*"
          blur={18}
        />
        <p className="micro">Moments that shaped the vision.</p>
      </div>

      <div className={s.view} ref={viewRef}>
        <div className={s.track} ref={trackRef}>
          {EVENTS.map((e, i) => (
            <article className={s.card} key={e.src}>
              <div className={s.shot}>
                <Image
                  src={e.src}
                  alt={e.alt}
                  width={IMG.w}
                  height={IMG.h}
                  sizes="(max-width: 860px) 78vw, 340px"
                />
              </div>
              <p className={s.num}>{String(i + 1).padStart(2, "0")}</p>
              <div className={s.cardFoot}>
                <h4>{e.title}</h4>
                <p className="micro">{e.meta}</p>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className={s.progress}>
        <p className="micro">
          <span ref={nowRef}>01</span> / {String(EVENTS.length).padStart(2, "0")}
        </p>
        <span className={s.bar}>
          <span className={s.barFill} ref={barRef} />
        </span>
        <p className="micro">Scroll</p>
      </div>
    </section>
  );
}
