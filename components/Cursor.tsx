"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A single lerped cursor that changes size/label from `data-cursor` on
 * whatever is under the pointer. Rendered in difference blend so it stays
 * legible over both the dark page and the bright side of the portrait.
 */
export default function Cursor() {
  const ref = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (
      window.matchMedia("(pointer: coarse)").matches ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    setEnabled(true);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const el = ref.current;
    const label = labelRef.current;
    if (!el) return;

    const pos = { x: innerWidth / 2, y: innerHeight / 2 };
    const cur = { ...pos };
    let raf = 0;
    let shown = false;

    const onMove = (e: PointerEvent) => {
      pos.x = e.clientX;
      pos.y = e.clientY;
      if (!shown) {
        shown = true;
        el.style.opacity = "1";
      }
      const hit = (e.target as HTMLElement)?.closest?.(
        "[data-cursor], a, button",
      ) as HTMLElement | null;
      const state = hit?.dataset?.cursor || (hit ? "link" : "");
      el.dataset.state = state;
      if (label) label.textContent = hit?.dataset?.cursorLabel || "";
    };

    const loop = () => {
      raf = requestAnimationFrame(loop);
      cur.x += (pos.x - cur.x) * 0.18;
      cur.y += (pos.y - cur.y) * 0.18;
      el.style.transform = `translate3d(${cur.x}px, ${cur.y}px, 0)`;
    };

    window.addEventListener("pointermove", onMove);
    raf = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div className="cursor" ref={ref} style={{ opacity: 0 }} aria-hidden="true">
      <div className="cursorDot" />
      <div className="cursorRing">
        <span className="cursorLabel" ref={labelRef} />
      </div>
    </div>
  );
}
