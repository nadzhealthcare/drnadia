"use client";

import { useEffect, useState } from "react";

/**
 * A throwaway probe for the real device. Everything the site depends on that
 * varies by phone, browser and settings — reported in one place so a bug can be
 * read off a screenshot instead of guessed at.
 */
const PLATES = [
  "/assets/hero_nadia1.webp",
  "/assets/hero_nadia2.webp",
  "/assets/hero_nadia3.webp",
  "/assets/hero_nadia4.webp",
];

type Row = { k: string; v: string; bad?: boolean };

export default function Diag() {
  const [rows, setRows] = useState<Row[]>([]);
  const [audioNote, setAudioNote] = useState("tap the button below");
  const push = (k: string, v: string, bad = false) =>
    setRows((r) => [...r.filter((x) => x.k !== k), { k, v, bad }]);

  useEffect(() => {
    const mq = (q: string) => window.matchMedia(q).matches;
    push("reduce motion", String(mq("(prefers-reduced-motion: reduce)")), mq("(prefers-reduced-motion: reduce)"));
    push("hover / pointer", `${mq("(hover: hover)") ? "hover" : "none"} / ${mq("(pointer: coarse)") ? "coarse" : "fine"}`);
    push("viewport", `${innerWidth}x${innerHeight} @${devicePixelRatio}x`);
    push("svh support", String(CSS.supports("height", "100svh")), !CSS.supports("height", "100svh"));
    push("ua", navigator.userAgent.slice(0, 70));

    // WebGL
    try {
      const c = document.createElement("canvas");
      const gl = (c.getContext("webgl") ||
        c.getContext("experimental-webgl")) as WebGLRenderingContext | null;
      if (!gl) push("webgl", "MISSING", true);
      else {
        push("webgl", "ok");
        push("max texture", String(gl.getParameter(gl.MAX_TEXTURE_SIZE)));
        const dbg = gl.getExtension("WEBGL_debug_renderer_info");
        if (dbg) push("gpu", String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)).slice(0, 46));
      }
    } catch (e) {
      push("webgl", `threw: ${e}`, true);
    }

    // the four hero plates
    PLATES.forEach((src) => {
      const t = performance.now();
      const img = new Image();
      const name = src.split("/").pop()!;
      const timer = window.setTimeout(() => push(name, "STALLED >8s", true), 8000);
      img.onload = () => {
        window.clearTimeout(timer);
        push(name, `${img.naturalWidth}x${img.naturalHeight} in ${Math.round(performance.now() - t)}ms`);
      };
      img.onerror = () => {
        window.clearTimeout(timer);
        push(name, "FAILED", true);
      };
      img.src = src;
    });

    // fonts
    document.fonts?.ready.then(() =>
      push("fonts", `ready, ${document.fonts.size} faces`),
    );

    // what the site remembers about the sound choice
    try {
      push("sound setting", localStorage.getItem("nadz:sound") ?? "(none yet)");
    } catch {
      push("sound setting", "localStorage blocked", true);
    }

    // video
    const v = document.createElement("video");
    v.muted = true;
    v.playsInline = true;
    v.preload = "auto";
    v.src = "/assets/reel.mp4";
    v.oncanplay = () => push("video canplay", `readyState ${v.readyState}`);
    v.onerror = () =>
      push("video", `error code ${v.error?.code ?? "?"}`, true);
    v.play().then(
      () => push("video autoplay", "allowed"),
      (err) => push("video autoplay", `REFUSED: ${err?.name ?? err}`, true),
    );
    window.setTimeout(() => {
      push("video time", `t=${v.currentTime.toFixed(2)} paused=${v.paused}`, v.paused);
    }, 4000);
  }, []);

  return (
    <main
      style={{
        font: "13px/1.6 ui-monospace, monospace",
        padding: 20,
        background: "#0e0f10",
        color: "#f4f2f0",
        minHeight: "100svh",
      }}
    >
      <h1 style={{ fontSize: 15, marginBottom: 14 }}>drnadia diagnostics</h1>
      <table style={{ borderCollapse: "collapse", width: "100%" }}>
        <tbody>
          {rows.map((r) => (
            <tr key={r.k}>
              <td style={{ opacity: 0.6, padding: "5px 12px 5px 0", verticalAlign: "top", whiteSpace: "nowrap" }}>
                {r.k}
              </td>
              <td style={{ padding: "5px 0", color: r.bad ? "#ff8080" : "inherit", wordBreak: "break-all" }}>
                {r.v}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button
        type="button"
        onClick={() => {
          const a = new Audio("/assets/ambient.mp3");
          a.volume = 0.5;
          a.play().then(
            () => {
              setAudioNote("PLAYING at 50%. If you hear nothing, check the phone's silent switch and the volume.");
              window.setTimeout(() => {
                setAudioNote(
                  `playing=${!a.paused} t=${a.currentTime.toFixed(1)}s vol=${a.volume} — if this says playing and you hear nothing, it is the device, not the site`,
                );
              }, 2500);
            },
            (e) => setAudioNote(`REFUSED: ${e?.name ?? e}`),
          );
        }}
        style={{
          marginTop: 22, padding: "12px 18px", font: "inherit",
          background: "#f4f2f0", color: "#0e0f10", border: 0, borderRadius: 6,
        }}
      >
        ▶ test sound at 50%
      </button>
      <p style={{ marginTop: 10, color: "#9ad" }}>{audioNote}</p>

      <p style={{ opacity: 0.5, marginTop: 18 }}>
        Screenshot this and send it back. Red lines are the problem.
      </p>
    </main>
  );
}
