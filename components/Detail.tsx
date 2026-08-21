"use client";

import Image from "next/image";
import Parallax from "./Parallax";
import Reveal from "./Reveal";
import s from "./sections.module.css";

const ROWS = [
  {
    h: "Assessment and Baseline",
    p: "Nothing is prescribed before the whole picture is drawn - history, lifestyle, inherited risk and current markers, mapped against where the patient intends to be in twenty years.",
    ph: "Pre - illness",
    list: [
      "Health history",
      "Risk profiling",
      "Screening and labs",
      "Lifestyle audit",
      "Baseline markers",
      "Goals - the plan",
    ],
  },
  {
    h: "Prevention and Continuity",
    p: "The plan is carried out where the patient actually lives. Follow-up runs continuously rather than in appointments, which is how small drifts get caught while they are still small.",
    ph: "Care - delivery",
    list: ["Home healthcare", "Ongoing monitoring", "Nutrition and movement"],
  },
  {
    h: "Longevity and Balance",
    p: "The measure she works to is not years but capacity - the energy, clarity and balance carried through them, reassessed and adjusted as the decades move.",
    ph: "Long - term",
    list: ["Healthspan tracking", "Energy and recovery", "Periodic reassessment"],
  },
];

export default function Detail() {
  return (
    <section
      className={s.detail}
      data-bg="#14171b"
      data-tint="rgba(214,132,84,.16)"
      data-tint-y="18%"
    >
      <div className={s.detailBg} aria-hidden="true">
        <Parallax amount={7}>
          <Image
            src="/assets/hero_nadia2.webp"
            alt=""
            fill
            sizes="100vw"
            style={{ objectFit: "cover" }}
          />
        </Parallax>
      </div>

      {ROWS.map((r) => (
        <Reveal className={s.drow} key={r.h}>
          <div>
            <h4>{r.h}</h4>
            <p className="tiny">{r.p}</p>
          </div>
          <p className={s.dph}>{r.ph}</p>
          <div className={s.dlist}>
            {r.list.map((i) => (
              <div key={i}>{i}</div>
            ))}
          </div>
        </Reveal>
      ))}
    </section>
  );
}
