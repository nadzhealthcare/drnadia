"use client";

import Image from "next/image";
import BlurText from "./BlurText";
import LoopVideo from "./LoopVideo";
import Parallax from "./Parallax";
import Reveal from "./Reveal";
import s from "./sections.module.css";

export default function Bands() {
  return (
    <>
      <section
        className={s.band}
        data-bg="#2a1317"
        data-tint="rgba(178,62,80,.26)"
        data-tint-y="34%"
      >
        <Reveal className={s.bandInner} data-media="portrait">
          {/* the reel is shot portrait, so this figure carries its own aspect
              rather than the landscape crop */}
          <figure className={`${s.bandMedia} ${s.bandPortrait}`}>
            <Parallax amount={5}>
              <LoopVideo
                src="/assets/reel.mp4"
                poster="/assets/reel-poster.jpg"
                label="Dr. Nadia Choudhry at work — clinic visits, home care and consultations"
              />
            </Parallax>
            <figcaption className="micro">NADZ Healthcare</figcaption>
          </figure>

          <div className={s.bandCopy}>
            <p className="micro">Founded 01 · 01 · 2025</p>
            <BlurText
              as="h3"
              text="An argument against the *conventional model*"
              blur={18}
            />
            <p className="tiny">
              Modern healthcare had become efficient, but often impersonal.
              Long waits, brief consultations, and fragmented care left patients
              feeling like just another appointment. Dr. Nadia believed there
              had to be a better way.
            </p>
            <div className={s.rule} />
          </div>
        </Reveal>
      </section>

      <section
        className={s.band}
        data-bg="#101c25"
        data-tint="rgba(96,176,208,.28)"
        data-tint-y="30%"
      >
        <Reveal className={s.bandInner} data-media="portrait" data-flip="1">
          <figure className={`${s.bandMedia} ${s.bandPortrait}`}>
            <Parallax amount={6}>
              <Image
                src="/assets/drnadiapose.webp"
                alt="Dr. Nadia Choudhry"
                width={1091}
                height={1458}
                sizes="(max-width: 860px) 100vw, 480px"
              />
            </Parallax>
            <figcaption className="micro">Before the symptom</figcaption>
          </figure>

          <div className={s.bandCopy}>
            <p className="micro">Prevention</p>
            <BlurText
              as="h3"
              text="The years *before* anything shows up"
              blur={18}
            />
            <p className="tiny">
              Modern medicine treats illness well. Her interest lies in the gap
              that opens before it — the years before symptoms surface, before
              conditions establish themselves, before intervention becomes the
              only option left.
            </p>
            <div className={s.rule} />
          </div>
        </Reveal>
      </section>
    </>
  );
}
