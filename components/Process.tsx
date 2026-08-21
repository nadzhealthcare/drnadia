"use client";

import BlurText from "./BlurText";
import Reveal from "./Reveal";
import s from "./sections.module.css";

const STEPS = [
  {
    n: "01",
    name: "Prevention",
    body: "Risk is read before it becomes diagnosis - history, inherited pattern, markers and lifestyle mapped against where the patient intends to be in twenty years.",
  },
  {
    n: "02",
    name: "Longevity",
    body: "The measure is not years but capacity: the energy, clarity and balance carried through them, reassessed as the decades move.",
  },
  {
    n: "03",
    name: "Personalization",
    body: "No two plans look alike, because no two bodies, households or intentions do. The protocol follows the person, never the other way around.",
  },
];

export default function Process() {
  return (
    <section
      className={s.proc}
      id="approach"
      data-bg="#221d18"
      data-tint="rgba(214,160,110,.16)"
      data-tint-y="46%"
    >
      <Reveal>
        <p className="micro">Philosophy</p>
      </Reveal>

      <BlurText
        as="p"
        className={s.procQ}
        text="So how is a *longer, better* life actually *built?*"
        blur={20}
      />

      <Reveal as="ol" className={s.procList} stagger={0.1}>
        {STEPS.map((step) => (
          <li className={s.procItem} key={step.n}>
            <div className={s.procHead}>
              <span className={s.procNum}>({step.n})</span>
              <span className={s.procName}>{step.name}</span>
            </div>
            <div className={s.procBody}>
              <div>
                <p className="tiny">{step.body}</p>
              </div>
            </div>
          </li>
        ))}
      </Reveal>
    </section>
  );
}
