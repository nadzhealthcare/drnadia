"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import HeroCanvas from "./HeroCanvas";
import BlurText from "./BlurText";
import { SLIDES, frameSlide } from "@/lib/heroSlides";
import styles from "./Hero.module.css";

/** how long a slide holds before it hands over, ms */
const HOLD = 7000;

/** below this the joined line is too long to set at a useful size */
const JOIN_WIDTH = 900;

/**
 * The headline is bottom-anchored against a clipping edge, so a descender has
 * to be paid for. Measured against the loaded faces: a line with descenders
 * drops 0.161em below its 0.84em line box, one without stays 0.044em inside
 * it. Only headlines that actually need the allowance give up size for it.
 * `f` is included for italic runs, where the serif's f descends too.
 */
const DESCENDER_EM = 0.17;

/** font size the headline is measured at before being scaled to the band */
const PROBE_PX = 100;

/**
 * Widths come from summing integer `offsetWidth` values, which under-report
 * the true fractional total by up to half a pixel per span — across twenty
 * glyphs that is enough to size a line a hair wider than the band it has to
 * sit in, and the wrap silently doubles the block's height. This margin keeps
 * the line clear of the edge; the wrap guard below catches anything left.
 */
const WIDTH_SAFETY = 0.994;

/**
 * Size the headline by measuring it rather than predicting it.
 *
 * The measurement runs on a hidden clone, not the live element, for two
 * reasons. `offsetWidth` is a rounded integer, and summing twenty of them
 * under-reports the real width by enough to overrun the band — and the guard
 * meant to catch that used the same rounded figure, so it never fired. The
 * live spans also carry the blur-in's transforms, which corrupt any fractional
 * rect read. A clone with those styles stripped has neither problem.
 */
const fitHeadline = (
  head: HTMLElement,
  bandH: number,
  bandW: number,
  lines: number,
  capPx: number,
) => {
  const runs = [...head.querySelectorAll<HTMLElement>(".blurText")];
  if (!runs.length) return null;

  const ghost = document.createElement("div");
  ghost.setAttribute("aria-hidden", "true");
  ghost.style.cssText =
    "position:absolute;left:-99999px;top:0;visibility:hidden;" +
    `pointer-events:none;white-space:nowrap;font-size:${PROBE_PX}px`;
  head.appendChild(ghost);

  const strip = (el: HTMLElement) => {
    el.style.transform = "";
    el.style.filter = "";
    el.style.opacity = "";
    el.style.display = "inline-block";
    el.style.whiteSpace = "nowrap";
    el.querySelectorAll<HTMLElement>(".w").forEach((w) => {
      w.style.transform = "";
      w.style.filter = "";
      w.style.opacity = "";
    });
    return el;
  };

  const clones = runs.map((r) => {
    const c = strip(r.cloneNode(true) as HTMLElement);
    ghost.appendChild(c);
    return c;
  });

  let joinW = 0;
  const joiner = head.querySelector<HTMLElement>("[data-joiner]");
  if (joiner) {
    const jc = joiner.cloneNode(true) as HTMLElement;
    jc.style.display = "inline-block";
    ghost.appendChild(jc);
    joinW = jc.getBoundingClientRect().width;
  }

  // fractional, and free of the animation's transforms
  const widths = clones.map((c) => c.getBoundingClientRect().width);
  const widthEm =
    (lines === 1
      ? widths.reduce((a, b) => a + b, 0) + joinW
      : Math.max(...widths)) / PROBE_PX;

  ghost.remove();

  const prev = head.style.fontSize;
  head.style.fontSize = `${PROBE_PX}px`;
  const heightEm = head.offsetHeight / PROBE_PX;
  head.style.fontSize = prev;

  if (!widthEm || !heightEm) return null;
  return {
    size: Math.min(bandH / heightEm, (bandW * WIDTH_SAFETY) / widthEm, capPx),
    widthEm,
    heightEm,
  };
};

const hasDescender = (text: string) =>
  text
    .split("*")
    .some((run, i) => (i % 2 === 1 ? /[gjpqyf]/ : /[gjpqy]/).test(run));

/**
 * Does a band's content need more room than the band has?
 *
 * Deliberately sums `offsetHeight` rather than reading `scrollHeight`: the
 * blur-in animation translates each word downward on its way in, and a
 * transformed descendant counts toward scrollable overflow. Measuring that way
 * reports phantom overflow for the first second of the page's life — which is
 * exactly when the first measurement runs.
 */
const overflows = (n: HTMLElement | null) => {
  if (!n) return false;
  const kids = ([...n.children] as HTMLElement[]).filter(
    (k) => getComputedStyle(k).display !== "none",
  );
  const gap = parseFloat(getComputedStyle(n).rowGap) || 0;
  const needed =
    kids.reduce((sum, k) => sum + k.offsetHeight, 0) +
    gap * Math.max(0, kids.length - 1);
  return needed > n.clientHeight + 1;
};

export default function Hero() {
  const ref = useRef<HTMLElement>(null);
  /** the band the headline lives in, and the row sharing it */
  const bandRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<HTMLDivElement>(null);
  const footRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const go = useCallback((next: number) => {
    setIndex(((next % SLIDES.length) + SLIDES.length) % SLIDES.length);
  }, []);

  /**
   * The portrait is full-bleed, so the crop — and therefore where her face
   * sits — changes with both the viewport and the slide. frameSlide() is the
   * same pure function the shader's uniforms come from, so these custom
   * properties describe exactly the band the type has to stay out of.
   */
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const measure = () => {
      const r = el.getBoundingClientRect();
      const f = frameSlide(SLIDES[index], r.width, r.height);
      el.style.setProperty("--face-top", `${Math.round(f.faceTop)}px`);
      el.style.setProperty(
        "--face-bottom",
        `${Math.round(r.height - f.faceBottom)}px`,
      );
      /*
       * The headline fills the band's width — that edge-to-edge run is what
       * makes the name read large, more than the px value does. Wide enough,
       * both words set on one line; narrower, they stack and the fit follows
       * whichever of the two is longer.
       */
      const s = SLIDES[index];
      const band = bandRef.current;
      const head = headRef.current;
      const foot = footRef.current;
      if (!band || !head || !foot) return;

      const lines = r.width >= JOIN_WIDTH ? 1 : 2;
      el.dataset.lines = `${lines}`;
      // pay for descenders only when the headline actually has any
      const desc = hasDescender(s.lineA + s.lineB) ? DESCENDER_EM : 0;
      el.style.setProperty("--desc", `${desc}em`);

      // measure with the headline visible, then decide whether to keep it
      el.dataset.tight = "0";
      // the footer row and the gap above it share the band with the headline
      const rowGap = parseFloat(getComputedStyle(band).rowGap) || 0;
      const fit = fitHeadline(
        head,
        band.clientHeight - foot.offsetHeight - rowGap,
        band.clientWidth,
        lines,
        Math.min(r.width * (lines === 1 ? 0.13 : 0.22), 300),
      );
      let size = fit && Math.floor(fit.size);

      /*
       * Apply, then check what actually rendered and ease down until it holds.
       * Two ways the first guess can be a shade optimistic: a single line can
       * wrap, which doubles the height and drops the fill to whichever run is
       * longer; and the line can simply overrun the band, which the clipped
       * band then cuts mid-word. The second is what happens when the fit was
       * taken against the fallback face and the real one sets wider.
       */
      if (fit && size) {
        for (let i = 0; i < 6; i++) {
          el.style.setProperty("--fit", `${size}px`);
          const wrapped =
            lines === 1 && head.offsetHeight > fit.heightEm * size * 1.4;
          // widthEm is fractional and font-accurate, so this predicts the
          // set width instead of re-reading a rounded one
          const overruns = fit.widthEm * size > band.clientWidth;
          if (!wrapped && !overruns) break;
          size = Math.floor(size * 0.96);
        }
      }

      /*
       * A very short landscape window can leave a band too shallow for even
       * the 28px floor, and a clipped sliver of a headline looks broken — so
       * that case drops the line rather than showing it cut. This runs inside
       * the ResizeObserver callback, before paint, so the measure-then-hide
       * round trip is never visible.
       */
      if (!size || size < 28) {
        el.dataset.tight = "1";
      } else {
        el.style.setProperty("--fit", `${Math.floor(size)}px`);
        el.dataset.tight = overflows(band) ? "1" : "0";
      }
    };

    const ro = new ResizeObserver(measure);
    ro.observe(el);
    measure();

    /*
     * Measure again once the webfonts land. The fit comes from real glyph
     * widths, and the first pass runs against the fallback face — which sets
     * narrower than Playfair does, so the headline is sized too large and
     * overflows its band the moment the real face swaps in.
     */
    let alive = true;
    document.fonts?.ready.then(() => {
      if (alive) measure();
    });

    return () => {
      alive = false;
      ro.disconnect();
    };
  }, [index]);

  // auto-advance, held while the pointer is exploring the reveal
  useEffect(() => {
    if (paused || SLIDES.length < 2) return;
    const id = window.setTimeout(() => go(index + 1), HOLD);
    return () => window.clearTimeout(id);
  }, [index, paused, go]);

  const slide = SLIDES[index];

  return (
    <section
      ref={ref}
      className={styles.hero}
      data-bg="#111214"
      data-tint="rgba(196,150,116,.22)"
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
    >
      <div className={styles.media}>
        <HeroCanvas index={index} />
      </div>
      {/* darkens only where the type lives; stays clear across the face */}
      <div className={styles.scrim} aria-hidden="true" />

      {/* the slide lines change as the sequence runs, so the document keeps a
          stable heading of its own rather than borrowing whichever is on screen */}
      <h1 className="srOnly">
        Dr. Nadia Choudhry - physician and founder of NADZ Healthcare
      </h1>

      {/* ── everything above her face ── */}
      <div className={styles.top}>
        <div className={styles.meta}>
          <p className="micro">{slide.eyebrow}</p>
          <p className="micro">Abu&nbsp;Dhabi - Dubai</p>
        </div>
      </div>

      {/*
        ── everything below her face ──
        The headline sits here rather than above: on both pairs the cover crop
        leaves the lower band roughly twice the upper one, and on slide one it
        is the only band with room for it at all.
      */}
      <div className={styles.bottom} ref={bandRef}>
        {/* both words in one line — joined edge to edge on a wide viewport,
            stacked when there isn't the width for it */}
        <div className={styles.headline} ref={headRef} aria-hidden="true">
          <BlurText
            key={`a${index}`}
            text={slide.lineA}
            split="char"
            onLoad
            stagger={0.03}
            blur={22}
            delay={index === 0 ? 0.35 : 0.45}
          />
          {/* measurable so the joined line's width can be summed exactly */}
          <span className={styles.joiner} data-joiner>
            {" "}
          </span>
          <BlurText
            key={`b${index}`}
            className={styles.serifRun}
            text={slide.lineB}
            split="char"
            onLoad
            stagger={0.034}
            blur={26}
            delay={index === 0 ? 0.62 : 0.7}
          />
        </div>

        <div className={styles.foot} ref={footRef}>
          <div className={styles.slides}>
            {SLIDES.map((s, i) => (
              <button
                key={s.id}
                type="button"
                className={styles.dot}
                data-active={i === index ? "1" : "0"}
                aria-label={`Show slide ${i + 1}: ${s.eyebrow}`}
                aria-current={i === index}
                onClick={() => go(i)}
                data-cursor="link"
              >
                <span className={styles.dotNum}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className={styles.dotBar}>
                  {/* remounting restarts the fill in step with the timer,
                      which also restarts whenever `paused` flips */}
                  <span
                    key={`${index}-${paused}`}
                    className={styles.dotFill}
                    style={{ animationDuration: `${HOLD}ms` }}
                    data-run={i === index && !paused ? "1" : "0"}
                  />
                </span>
              </button>
            ))}
          </div>

          <a className={styles.jump} href="#story" data-cursor="link">
            <span>Read the practice</span>
            <em>↓</em>
          </a>
          <p className={`micro ${styles.scrollCue}`}>Scroll</p>
        </div>
      </div>
    </section>
  );
}
