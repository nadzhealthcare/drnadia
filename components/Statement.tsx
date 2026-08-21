"use client";

import BlurText from "./BlurText";
import Reveal from "./Reveal";
import s from "./sections.module.css";

export default function Statement() {
  return (
    <section
      className={s.stmt}
      id="story"
      data-bg="#1c1d1f"
      data-tint="rgba(196,150,116,.13)"
    >
      <Reveal>
        <p className="micro">Practice</p>
      </Reveal>

      <BlurText
        as="h2"
        className={s.stmtLead}
        text="Driven by a vision, Dr. Nadia Choudhry is redefining healthcare through *innovation* and *patient-first care*."
        blur={20}
        stagger={0.05}
      />

      <Reveal className={s.cols} stagger={0.12}>
        <p className="tiny">
          Born and raised in Abu Dhabi, she took her medical degree at Gulf
          Medical University in Ajman before practising across obstetrics and
          gynaecology, general surgery, neurosurgery, paediatrics, aesthetics
          and family medicine.
        </p>
        <p className="tiny">
          Six specialties, six vantage points on the same body. What they
          produced was a conviction that health is not a set of isolated
          systems, but something interconnected, and deeply personal.
        </p>
      </Reveal>
    </section>
  );
}
