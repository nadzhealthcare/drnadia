"use client";

import { useEffect, useRef } from "react";
import styles from "./Nav.module.css";

const LINKS = [
  { href: "#story", label: "Story" },
  { href: "#recognition", label: "Recognition" },
  { href: "#approach", label: "Approach" },
  { href: "#contact", label: "Contact" },
];

export default function Nav() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let last = window.scrollY;

    const onScroll = () => {
      const y = window.scrollY;
      // hide going down, bring it back the moment the user reverses
      el.dataset.hidden = y > 120 && y > last ? "1" : "0";
      last = y;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className={styles.nav} ref={ref} data-hidden="0">
      <a className={styles.brand} href="#top" data-cursor="link">
        Dr. Nadia Choudhry
      </a>
      <div className={styles.links}>
        {LINKS.map((l) => (
          <a key={l.href} href={l.href} data-cursor="link">
            <span data-text={l.label}>{l.label}</span>
          </a>
        ))}
      </div>
    </nav>
  );
}
