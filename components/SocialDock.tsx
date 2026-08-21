"use client";

import { useEffect, useRef, useState } from "react";
import s from "./SocialDock.module.css";

const EMAIL = "md@nadzhealthcare.com";

const LINKS = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/drnadiachoudhry/",
    // simplified marks, drawn inline so the dock costs no extra request
    path: "M12 2.2c3.2 0 3.6 0 4.9.07 1.2.05 1.8.25 2.2.42.6.22 1 .48 1.4.9.43.42.7.82.92 1.4.17.43.37 1.06.42 2.25.06 1.28.07 1.66.07 4.9s0 3.6-.07 4.9c-.05 1.2-.25 1.8-.42 2.2a3.9 3.9 0 0 1-.92 1.4c-.42.43-.82.7-1.4.92-.43.17-1.06.37-2.25.42-1.28.06-1.66.07-4.9.07s-3.6 0-4.9-.07c-1.2-.05-1.8-.25-2.2-.42a3.9 3.9 0 0 1-1.4-.92 3.9 3.9 0 0 1-.92-1.4c-.17-.43-.37-1.06-.42-2.25C2.2 15.6 2.2 15.2 2.2 12s0-3.6.07-4.9c.05-1.2.25-1.8.42-2.2.22-.6.48-1 .92-1.4.42-.43.82-.7 1.4-.92.43-.17 1.06-.37 2.25-.42C8.5 2.2 8.9 2.2 12 2.2Zm0 3.5a6.3 6.3 0 1 0 0 12.6 6.3 6.3 0 0 0 0-12.6Zm0 10.4a4.1 4.1 0 1 1 0-8.2 4.1 4.1 0 0 1 0 8.2Zm6.5-10.6a1.47 1.47 0 1 1-2.95 0 1.47 1.47 0 0 1 2.95 0Z",
  },
  {
    label: "Facebook",
    href: "https://www.facebook.com/profile.php?id=61575798633927",
    path: "M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5 3.66 9.15 8.44 9.94v-7.03H7.9v-2.9h2.54V9.85c0-2.52 1.5-3.9 3.77-3.9 1.09 0 2.24.19 2.24.19v2.46h-1.26c-1.24 0-1.63.78-1.63 1.57v1.89h2.78l-.45 2.9h-2.33V22c4.78-.79 8.44-4.93 8.44-9.94Z",
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/drnadiachoudhry/",
    path: "M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.55V9h3.57v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0Z",
  },
];

/**
 * A dock that stays with the reader: a mail button that opens the address, and
 * the social marks beside it. Collapsed to a single button until asked for, so
 * it never competes with the page.
 */
export default function SocialDock() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  return (
    <div className={s.dock} ref={ref} data-open={open ? "1" : "0"}>
      <ul className={s.links}>
        {LINKS.map((l, i) => (
          <li key={l.label} style={{ ["--i" as string]: i }}>
            <a
              href={l.href}
              target="_blank"
              rel="noopener noreferrer"
              className={s.icon}
              aria-label={l.label}
              title={l.label}
              tabIndex={open ? 0 : -1}
              data-cursor="link"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d={l.path} />
              </svg>
            </a>
          </li>
        ))}
        <li style={{ ["--i" as string]: LINKS.length }}>
          <a
            href={`mailto:${EMAIL}`}
            className={`${s.icon} ${s.mailLink}`}
            aria-label={`Email ${EMAIL}`}
            title={EMAIL}
            tabIndex={open ? 0 : -1}
            data-cursor="link"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm.9 2 8.1 5.6L20.1 7H3.9Z" />
            </svg>
          </a>
        </li>
      </ul>

      <button
        type="button"
        className={s.toggle}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? "Close contact options" : "Contact Dr. Nadia"}
        data-cursor="link"
      >
        <span className={s.bars} aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path d="M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm.9 2 8.1 5.6L20.1 7H3.9Z" />
          </svg>
        </span>
      </button>
    </div>
  );
}
