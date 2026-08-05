"use client";

import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import BlurText from "./BlurText";
import s from "./Journey.module.css";

type Chapter = {
  /** the word that rides the dial */
  key: string;
  /** BlurText syntax — *runs in asterisks* are set in the italic serif */
  title: string;
  body: string;
};

const CHAPTERS: Chapter[] = [
  {
    key: "The Problem",
    title: "Redefining *modern healthcare*",
    body: "Modern healthcare had become efficient, but often impersonal. Long waits, brief consultations, and fragmented care left patients feeling like just another appointment. Dr. Nadia believed there had to be a better way.",
  },
  {
    key: "The Question",
    title: "What if healthcare wasn't built around hospitals — *but around people?*",
    body: "That question became the foundation of a new way of thinking. One where relationships matter more than transactions, prevention matters more than treatment, and care continues beyond a single visit.",
  },
  {
    key: "The Birth of NADZ",
    title: "A *new beginning*",
    body: "In 2025, that vision took shape as NADZ Healthcare. Built around a patient-first philosophy, it was designed to deliver exceptional medical care with the accessibility, continuity, and personal connection modern healthcare had lost.",
  },
  {
    key: "The Ecosystem",
    title: "Not a clinic. *A healthcare ecosystem.*",
    body: "Services, doctors, technology, home healthcare, longevity and concierge medicine — brought together as one practice rather than a set of separate appointments.",
  },
  {
    key: "The Future",
    title: "A new era of *patient-first medicine*",
    body: "Driven by a vision to transform healthcare, Dr. Nadia Choudhry is leading a new era of patient-first medicine through innovation, accessibility, and personalized care.",
  },
];

/** degrees between neighbouring words on the dial */
const STEP = 13;

export default function Journey() {
  const stageRef = useRef<HTMLElement>(null);
  const wheelRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const nowRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const stage = stageRef.current;
    const wheel = wheelRef.current;
    const list = listRef.current;
    if (!stage || !wheel || !list) return;

    const mm = gsap.matchMedia();

    /*
     * Only the wide, motion-permitting case pins. Narrow viewports read the
     * chapters as a plain stacked list — a dial that size would be unreadable,
     * and pinning fights touch scrolling.
     */
    mm.add(
      "(min-width: 901px) and (prefers-reduced-motion: no-preference)",
      () => {
        const last = CHAPTERS.length - 1;
        const chapters = gsap.utils.toArray<HTMLElement>(`.${s.chapter}`, stage);
        const words = gsap.utils.toArray<HTMLElement>(`.${s.spoke}`, wheel);

        const show = (i: number) => {
          chapters.forEach((c, k) =>
            c.setAttribute("data-active", k === i ? "1" : "0"),
          );
          words.forEach((w, k) =>
            w.setAttribute("data-active", k === i ? "1" : "0"),
          );
          if (nowRef.current) {
            const label = String(i + 1).padStart(2, "0");
            if (nowRef.current.textContent !== label)
              nowRef.current.textContent = label;
          }
        };

        show(0);

        const st = ScrollTrigger.create({
          trigger: stage,
          start: "top top",
          // each handover gets a screen and a half of scroll to breathe
          end: () => `+=${last * window.innerHeight * 1.5}`,
          pin: true,
          anticipatePin: 1,
          scrub: 0.6,
          // pins must refresh before the triggers positioned after them
          refreshPriority: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            // the dial turns continuously; the copy snaps to the nearest word
            gsap.set(wheel, { rotate: -self.progress * last * STEP });
            if (barRef.current)
              barRef.current.style.transform = `scaleX(${self.progress})`;
            show(Math.round(self.progress * last));
          },
        });

        return () => st.kill();
      },
    );

    return () => mm.revert();
  }, []);

  return (
    <section
      ref={stageRef}
      className={s.stage}
      id="journey"
      data-bg="#251418"
      data-tint="rgba(186,68,84,.2)"
      data-tint-y="42%"
    >
      {/* ── the dial ── */}
      <div className={s.dial} aria-hidden="true">
        <div className={s.wheel} ref={wheelRef}>
          {CHAPTERS.map((c, i) => (
            <div
              key={c.key}
              className={s.spoke}
              data-active={i === 0 ? "1" : "0"}
              style={{ ["--i" as string]: i, ["--step" as string]: `${STEP}deg` }}
            >
              <span>{c.key}</span>
            </div>
          ))}
        </div>
        <span className={s.marker} />
      </div>

      {/* ── the copy ── */}
      <div className={s.panel}>
        <p className={`micro ${s.kicker}`}>The journey</p>

        <div className={s.chapters} ref={listRef}>
          {CHAPTERS.map((c, i) => (
            <article
              key={c.key}
              className={s.chapter}
              data-active={i === 0 ? "1" : "0"}
            >
              <p className={s.num}>
                <b>{String(i + 1).padStart(2, "0")}</b>
                <span>{c.key}</span>
              </p>
              <BlurText as="h3" className={s.title} text={c.title} blur={16} />
              <p className="tiny">{c.body}</p>
            </article>
          ))}
        </div>

        <div className={s.progress}>
          <p className="micro">
            <span ref={nowRef}>01</span> /{" "}
            {String(CHAPTERS.length).padStart(2, "0")}
          </p>
          <span className={s.bar}>
            <span className={s.barFill} ref={barRef} />
          </span>
        </div>
      </div>
    </section>
  );
}
