"use client";

import Image from "next/image";
import BlurText from "./BlurText";
import Events from "./Events";
import Reveal from "./Reveal";
import s from "./sections.module.css";

const AWARDS = [
  {
    yr: "2025",
    title: "“Best Home Healthcare”",
    body: "Health Magazine Annual Health Awards, presented by H.E. Sheikh Nahyan bin Mubarak Al Nahyan",
    mark: "Award",
    img: "/assets/drnadia6.webp",
    pos: "50% 44%",
    w: 1080,
    h: 1350,
    alt: "Dr. Nadia Choudhry receiving the Health Magazine award",
  },
  {
    yr: "2025",
    title: "NADZ Healthcare founded",
    body: "1st January, established to deliver continuous, proactive care in the home",
    mark: "Practice",
    img: "/assets/drnadia7.webp",
    pos: "50% 30%",
    w: 1080,
    h: 1350,
    alt: "Dr. Nadia Choudhry",
  },
  {
    yr: "Ongoing",
    title: "The Dr Nadz Show",
    body: "Conversations on medicine, wellness and the human side of healing",
    mark: "Media",
    img: "/assets/drnadia5.webp",
    pos: "50% 30%",
    w: 1080,
    h: 1350,
    alt: "Dr. Nadia Choudhry speaking",
  },
];

export default function Recognition() {
  return (
    <>
      <section
        className="sect"
        id="recognition"
        data-bg="#1a1a1c"
        data-tint="rgba(196,150,116,.08)"
      >
        <BlurText
          as="h2"
          className="hSec"
          text="Recognition"
          split="char"
          blur={24}
        />

        <Reveal className={s.rows} stagger={0.09}>
          {AWARDS.map((a) => (
            <div className={s.row} key={a.title}>
              <p className={s.yr}>{a.yr}</p>
              <p className={s.txt}>
                <b>{a.title}</b> - {a.body}
              </p>
              <p className={s.rowMark}>{a.mark}</p>

              {/* hovering the row opens this strip beneath the entry */}
              <div
                className={s.rowShot}
                style={{ ["--shot-pos" as string]: a.pos }}
              >
                <Image
                  src={a.img}
                  alt={a.alt}
                  width={a.w}
                  height={a.h}
                  sizes="(max-width: 860px) 90vw, 300px"
                />
              </div>
            </div>
          ))}
        </Reveal>
      </section>

      {/* the events run sideways under a pin, so this sits outside the padded
          section rather than inside it */}
      <Events />
    </>
  );
}
