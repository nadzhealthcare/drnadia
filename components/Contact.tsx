"use client";

import BlurText from "./BlurText";
import ContactForm from "./ContactForm";
import Reveal from "./Reveal";
import s from "./sections.module.css";

const LINKS = [
  { href: "mailto:md@nadzhealthcare.com", label: "md@nadzhealthcare.com", tag: "Email" },
  { href: "https://www.instagram.com/drnadiachoudhry", label: "Instagram", tag: "@drnadiachoudhry" },
  { href: "https://www.linkedin.com/in/drnadiachoudhry", label: "LinkedIn", tag: "Profile" },
  { href: "https://www.youtube.com/@thedrnadz", label: "YouTube", tag: "The Dr Nadz Show" },
  { href: "https://x.com/Dr_Nadia_Ch", label: "X", tag: "@Dr_Nadia_Ch" },
  { href: "https://www.nadzhealthcare.com", label: "NADZ Healthcare", tag: "Practice" },
];

export default function Contact() {
  return (
    <section
      className={s.contact}
      id="contact"
      data-bg="#0e0f10"
      data-tint="rgba(196,150,116,.15)"
      data-tint-y="80%"
    >
      <Reveal>
        <p className="micro">Contact</p>
      </Reveal>

      <BlurText
        as="h2"
        text="Begin a conversation."
        split="char"
        blur={26}
        stagger={0.028}
      />

      <div className={s.crow}>
        <Reveal>
          <p className={s.l}>
            Based between Abu Dhabi and Dubai, she takes on{" "}
            <i>patients, partners and platforms</i> across the UAE and beyond,
            in practice, in media, <i>and in the case for prevention.</i>
          </p>

          <ContactForm />
        </Reveal>

        <Reveal className={s.links2} stagger={0.06}>
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              target={l.href.startsWith("http") ? "_blank" : undefined}
              rel={l.href.startsWith("http") ? "noopener noreferrer" : undefined}
              data-cursor="link"
            >
              {l.label}
              <em>{l.tag}</em>
            </a>
          ))}
        </Reveal>
      </div>

      <footer className={s.footer}>
        <div>
          <p className={s.fb}>
            Nadia <i>Choudhry</i>
          </p>
          <p className="micro" style={{ marginTop: 4 }}>
            © {new Date().getFullYear()} All rights reserved
          </p>
        </div>
        <p className="micro">Physician · Founder · Podcaster</p>
        <p className="micro">Abu Dhabi - Dubai</p>
        <p className="micro">
          Developed by{" "}
          <a
            className={s.credit}
            href="https://thedarwin.co/"
            target="_blank"
            rel="noopener noreferrer"
            data-cursor="link"
          >
            Darwin Corp
          </a>
        </p>
      </footer>
    </section>
  );
}
