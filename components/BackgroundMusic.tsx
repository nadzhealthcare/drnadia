"use client";

import { useEffect, useRef, useState } from "react";
import s from "./BackgroundMusic.module.css";

const SRC = "/assets/ambient.mp3";
const VOLUME = 0.5;
/** a visitor who turned it off should stay turned off on the next visit */
const KEY = "nadz:sound";

export default function BackgroundMusic() {
  const ref = useRef<HTMLAudioElement>(null);
  const [on, setOn] = useState(false);

  /*
   * The source is attached on demand rather than rendered, so nobody pays for
   * 3.4MB they never hear — and setting it imperatively matters: going through
   * state would leave the element without a src on the very tick play() runs,
   * and the call would be refused for having nothing to play.
   */
  const ready = (el: HTMLAudioElement) => {
    if (!el.getAttribute("src")) {
      el.setAttribute("src", SRC);
      el.load();
    }
    el.volume = VOLUME;
    return el;
  };

  useEffect(() => {
    let declined = false;
    try {
      declined = localStorage.getItem(KEY) === "off";
    } catch {
      // private mode can throw on access alone
    }
    if (declined) return;

    /*
     * Audible media cannot autoplay — every browser refuses until the visitor
     * has interacted with the page. So the first gesture anywhere is what
     * starts it, which is the earliest a browser will allow.
     */
    const start = () => {
      const el = ref.current;
      if (!el) return;
      ready(el);
      el.play().then(
        () => setOn(true),
        () => {
          // still refused; the toggle stays available
        },
      );
      off();
    };
    const off = () => {
      window.removeEventListener("pointerdown", start);
      window.removeEventListener("keydown", start);
      window.removeEventListener("touchstart", start);
    };
    window.addEventListener("pointerdown", start, { passive: true });
    window.addEventListener("touchstart", start, { passive: true });
    window.addEventListener("keydown", start);
    return off;
  }, []);

  // a tab in the background should be silent
  useEffect(() => {
    const onVis = () => {
      const el = ref.current;
      if (!el || !on) return;
      if (document.hidden) el.pause();
      else el.play().catch(() => {});
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [on]);

  const toggle = () => {
    const el = ref.current;
    if (!el) return;
    ready(el);
    if (on) {
      el.pause();
      setOn(false);
      try {
        localStorage.setItem(KEY, "off");
      } catch {}
    } else {
      el.play().then(
        () => {
          setOn(true);
          try {
            localStorage.setItem(KEY, "on");
          } catch {}
        },
        () => {},
      );
    }
  };

  return (
    <>
      {/* src is attached on first use, not rendered */}
      <audio ref={ref} loop preload="none" aria-hidden="true" />
      <button
        type="button"
        className={s.toggle}
        onClick={toggle}
        aria-pressed={on}
        aria-label={on ? "Turn the music off" : "Turn the music on"}
        title={on ? "Sound on" : "Sound off"}
        data-on={on ? "1" : "0"}
        data-cursor="link"
      >
        {/* four bars that rise and fall while it plays, and lie flat when off */}
        <span className={s.bars} aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
        </span>
      </button>
    </>
  );
}
