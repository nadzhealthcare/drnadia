"use client";

import { useEffect, useRef, useState } from "react";
import { SLIDES, frameSlide } from "@/lib/heroSlides";
import styles from "./HeroCanvas.module.css";

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main(){
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const FRAG = `
precision highp float;

// the outgoing slide (A) and the incoming one (B); each is a mono plate the
// spotlight reveals a colour plate out of
uniform sampler2D uAMono;
uniform sampler2D uAColour;
uniform sampler2D uBMono;
uniform sampler2D uBColour;
uniform vec2  uAOrigin;
uniform vec2  uASize;
uniform vec2  uBOrigin;
uniform vec2  uBSize;
// 1 where a slide is a mono/colour pair, 0 where it is a single flat plate
uniform float uARev;
uniform float uBRev;

uniform vec2  uRes;        // canvas size, css px
uniform vec2  uMouse;      // 0..1, y up
uniform float uHover;      // 0 = idle, 1 = pointer engaged
uniform float uOpen;       // 0 = spotlight, 1 = the colour plate laid bare
uniform float uVel;        // pointer speed, smoothed
uniform float uTime;
uniform float uIntro;      // 0 -> 1 defocus settle on mount
uniform float uScroll;     // -1..1 parallax
uniform float uSlide;      // 0 = showing A, 1 = showing B

varying vec2 vUv;

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }

float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++){ v += a * noise(p); p *= 2.03; a *= 0.5; }
  return v;
}

// focal-point cover — origin/size come from frameSlide() so the layout knows
// exactly where her face lands. uv is y-up; screen px here is y-down.
vec2 coverUv(vec2 uv, vec2 origin, vec2 size){
  vec2 px = vec2(uv.x, 1.0 - uv.y) * uRes;
  vec2 iuv = (px - origin) / size;
  return vec2(iuv.x, 1.0 - iuv.y);  // textures upload flipped
}

vec3 defocus(sampler2D t, vec2 uv, float r){
  vec3 s = vec3(0.0);
  for (int i = 0; i < 8; i++){
    float a = float(i) * 0.7854;
    s += texture2D(t, uv + vec2(cos(a), sin(a)) * r).rgb;
  }
  return s / 8.0;
}

// one slide, composited: mono plate with the colour plate revealed inside the
// spotlight, plus the chromatic split and warm halo on the reveal edge
vec3 plate(sampler2D tMono, sampler2D tColour, vec2 origin, vec2 size,
           vec2 uv, vec2 disp, vec2 dir, float rim, float mask, float reveal){
  // a flat slide takes no displacement, so its plate stays perfectly still
  vec2 d = disp * reveal;
  vec2 uvM = coverUv(uv + d * 0.42, origin, size);
  vec2 uvC = coverUv(uv + d, origin, size);

  vec3 m = texture2D(tMono, uvM).rgb;

  float ca = (0.0022 * rim + uVel * 0.006) * reveal;
  vec3 c;
  c.r = texture2D(tColour, uvC + dir * ca).r;
  c.g = texture2D(tColour, uvC).g;
  c.b = texture2D(tColour, uvC - dir * ca).b;

  float m2 = mask * reveal;
  vec3 col = mix(m, c, m2);
  col += vec3(0.42, 0.28, 0.17) * rim * m2 * (0.05 + 0.09 * uHover);
  return col;
}

void main(){
  vec2 uv = vUv;
  vec2 aspect = vec2(uRes.x / uRes.y, 1.0);

  vec2 d = (uv - uMouse) * aspect;
  float dist = length(d);
  vec2 dir = d / max(dist, 1e-4);

  float n  = fbm(uv * 3.2 + uTime * 0.05);
  float n2 = fbm(uv * 7.0 - uTime * 0.04);

  // the reveal edge breathes so it never reads as a hard circle
  float radius = mix(0.28, 0.44, uHover) * (0.88 + 0.24 * n);
  float mask = 1.0 - smoothstep(radius * 0.55, radius, dist);
  mask *= mix(0.6, 1.0, uHover);
  // clicking opens the mask out to the whole frame
  mask = mix(mask, 1.0, uOpen);

  // displacement is an annulus: it peaks ON the reveal edge and falls to
  // nothing at the centre, so the face inside the spotlight stays sharp
  float e = (dist - radius) / (radius * 0.55);
  // no rim once it is fully open — there is no longer an edge to ripple
  float rim = exp(-e * e) * (1.0 - uOpen);
  // the whole frame ripples a little as one slide hands over to the next
  float churn = sin(uSlide * 3.14159) * 0.9;
  float amp = (0.010 * uHover + uVel * 0.22 + 0.012 * churn) * (0.6 + n2);
  vec2 disp = dir * rim * amp;

  vec2 base = uv + vec2(0.0, uScroll * 0.055);

  vec3 col;
  if (uSlide <= 0.001){
    col = plate(uAMono, uAColour, uAOrigin, uASize, base, disp, dir, rim, mask, uARev);
  } else if (uSlide >= 0.999){
    col = plate(uBMono, uBColour, uBOrigin, uBSize, base, disp, dir, rim, mask, uBRev);
  } else {
    vec3 a = plate(uAMono, uAColour, uAOrigin, uASize, base, disp, dir, rim, mask, uARev);
    vec3 b = plate(uBMono, uBColour, uBOrigin, uBSize, base, disp, dir, rim, mask, uBRev);
    // organic dissolve sweeping left to right rather than a flat crossfade
    float field = 0.62 * fbm(uv * 2.4 + 11.0) + 0.38 * (1.0 - uv.x);
    col = mix(a, b, smoothstep(field - 0.16, field + 0.16, uSlide * 1.32 - 0.16));
  }

  // mount: the plate resolves out of defocus
  if (uIntro < 0.999){
    vec2 uvM = coverUv(base, uAOrigin, uASize);
    col = mix(defocus(uAMono, uvM, (1.0 - uIntro) * 0.035), col, uIntro);
  }

  // vignette + a touch of grain so it sits with the rest of the page
  float vig = smoothstep(1.25, 0.30, length((uv - 0.5) * vec2(1.05, 1.0)));
  col *= 0.76 + 0.24 * vig;
  col += (hash(uv * 900.0 + uTime) - 0.5) * 0.02;

  gl_FragColor = vec4(col, 1.0);
}`;

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const sh = gl.createShader(type)!;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    console.warn(gl.getShaderInfoLog(sh));
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

function makeTexture(gl: WebGLRenderingContext, img: TexImageSource) {
  const tex = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, tex);
  // sources are not power-of-two, so clamp + linear, no mipmaps
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
  return tex;
}

/**
 * A 2466px plate is far more than a phone can resolve, and four of them at
 * full size is tens of megabytes of texture memory for a 390px screen — enough
 * for a mobile GPU to refuse the upload and leave the hero blank. Scale each
 * plate to what the drawing buffer can actually show before it goes up.
 */
const downscale = (img: HTMLImageElement, maxPx: number): TexImageSource => {
  if (img.naturalWidth <= maxPx) return img;
  const k = maxPx / img.naturalWidth;
  const c = document.createElement("canvas");
  c.width = Math.round(img.naturalWidth * k);
  c.height = Math.round(img.naturalHeight * k);
  c.getContext("2d")?.drawImage(img, 0, 0, c.width, c.height);
  return c;
};

/** textures that never arrive would otherwise leave the hero black forever */
const TEXTURE_TIMEOUT_MS = 9000;

/** how long a resting pointer holds the spotlight before the flow takes over */
const IDLE_MS = 2200;

/** WebGL1 guarantees eight texture units; one distinct source uses one */
const MAX_UNITS = 8;

export default function HeroCanvas({ index }: { index: number }) {
  /** only a paired slide reveals, so only it advertises the interaction */
  const reveals = !!SLIDES[index].colour;
  const [opened, setOpened] = useState(false);
  /** the render loop reads this, so toggling never restarts the GL context */
  const openRef = useRef(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [fallback, setFallback] = useState(false);

  // read inside the render loop so a slide change never restarts the context
  const target = useRef(index);
  target.current = index;

  const toggleOpen = () => {
    const next = !openRef.current;
    openRef.current = next;
    setOpened(next);
  };

  // a new slide starts closed again
  useEffect(() => {
    openRef.current = false;
    setOpened(false);
  }, [index]);

  /**
   * No WebGL at all: lay the plain <img> out with the exact
   * geometry frameSlide() describes, so the face lands in the same band the
   * layout has reserved for it.
   */
  useEffect(() => {
    const wrap = wrapRef.current;
    const img = imgRef.current;
    if (!fallback || !wrap || !img) return;

    const place = () => {
      const r = wrap.getBoundingClientRect();
      const f = frameSlide(SLIDES[index], r.width, r.height);
      img.style.left = `${f.ox}px`;
      img.style.top = `${f.oy}px`;
      img.style.width = `${f.sw}px`;
      img.style.height = `${f.sh}px`;
    };

    const ro = new ResizeObserver(place);
    ro.observe(wrap);
    place();
    return () => ro.disconnect();
  }, [fallback, index]);

  useEffect(() => {
    /*
     * Reduced motion keeps the picture and stops the movement, rather than
     * dropping to a still. What the preference is about here is the drifting
     * spotlight and the settle-from-defocus, not the photograph itself.
     */
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) {
      setFallback(true);
      return;
    }

    const gl = (canvas.getContext("webgl", {
      antialias: false,
      alpha: false,
      powerPreference: "high-performance",
    }) ||
      canvas.getContext("experimental-webgl")) as WebGLRenderingContext | null;

    if (!gl) {
      setFallback(true);
      return;
    }

    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) {
      setFallback(true);
      return;
    }

    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      setFallback(true);
      return;
    }
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW,
    );
    const loc = gl.getAttribLocation(prog, "aPos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const U = (n: string) => gl.getUniformLocation(prog, n);
    const u = {
      aMono: U("uAMono"),
      aColour: U("uAColour"),
      bMono: U("uBMono"),
      bColour: U("uBColour"),
      aOrigin: U("uAOrigin"),
      aSize: U("uASize"),
      bOrigin: U("uBOrigin"),
      bSize: U("uBSize"),
      aRev: U("uARev"),
      bRev: U("uBRev"),
      res: U("uRes"),
      mouse: U("uMouse"),
      hover: U("uHover"),
      open: U("uOpen"),
      vel: U("uVel"),
      time: U("uTime"),
      intro: U("uIntro"),
      scroll: U("uScroll"),
      slide: U("uSlide"),
    };

    let raf = 0;
    let disposed = false;
    let visible = true;

    /** stop drawing and hand over to the plain <img>, which shows the picture */
    const giveUp = () => {
      if (disposed) return;
      disposed = true;
      cancelAnimationFrame(raf);
      setFallback(true);
    };

    // a lost context on mobile is common under memory pressure
    canvas.addEventListener("webglcontextlost", (e) => {
      e.preventDefault();
      giveUp();
    });

    // ── state ───────────────────────────────────────────────
    /*
     * The spotlight follows the pointer while it is over the canvas and
     * otherwise drives itself, orbiting the point frameSlide() says her face
     * occupies so it stays on the subject at any crop rather than wandering
     * across empty backdrop. Either way it is only lit on a slide that has a
     * second plate to reveal.
     */
    const focus = { x: 0.5, y: 0.55 };
    const pointer = { x: 0.5, y: 0.55 };
    const cur = { x: 0.5, y: 0.55 };
    /**
     * Last pointer position over the canvas, whether it is still there, and
     * when it last moved — a cursor left resting on the hero should not hold
     * the spotlight still, so the flow resumes once it goes quiet.
     */
    const ptr = { x: 0.5, y: 0.55, over: false, moved: -1e9 };
    let hoverTarget = 0;
    let hover = 0;
    let open = 0;
    let vel = 0;
    let intro = 0;
    let scroll = 0;
    let slack = 0;
    let w = 1;
    let h = 1;

    // slide transition
    let from = target.current;
    let to = target.current;
    let progress = 1; // 1 = settled on `to`

    const applyFraming = () => {
      const fa = frameSlide(SLIDES[from], w, h);
      const fb = frameSlide(SLIDES[to], w, h);
      gl.uniform2f(u.aOrigin, fa.ox, fa.oy);
      gl.uniform2f(u.aSize, fa.sw, fa.sh);
      gl.uniform2f(u.bOrigin, fb.ox, fb.oy);
      gl.uniform2f(u.bSize, fb.sw, fb.sh);
      gl.uniform1f(u.aRev, SLIDES[from].colour ? 1 : 0);
      gl.uniform1f(u.bRev, SLIDES[to].colour ? 1 : 0);
      slack = Math.max(fa.slack, fb.slack);

      // aim the orbit at the incoming slide's face, in y-up uv
      focus.x = (fb.faceLeft + fb.faceRight) / 2 / w;
      focus.y = 1 - (fb.faceTop + fb.faceBottom) / 2 / h;
    };

    const bindSlides = () => {
      gl.uniform1i(u.aMono, slots[from].mono);
      gl.uniform1i(u.aColour, slots[from].colour);
      gl.uniform1i(u.bMono, slots[to].mono);
      gl.uniform1i(u.bColour, slots[to].colour);
    };

    const resize = () => {
      const r = wrap.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = Math.max(1, r.width);
      h = Math.max(1, r.height);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(u.res, w, h);
      applyFraming();
    };

    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    const coarse = window.matchMedia("(pointer: coarse)").matches;

    const onMove = (e: PointerEvent) => {
      const r = wrap.getBoundingClientRect();
      ptr.x = (e.clientX - r.left) / r.width;
      ptr.y = 1 - (e.clientY - r.top) / r.height;
      ptr.over = true;
      ptr.moved = performance.now();
    };
    const onLeave = () => {
      ptr.over = false;
    };

    // touch has no hover, so those visitors only ever get the autoplay path
    if (!coarse) {
      wrap.addEventListener("pointermove", onMove);
      wrap.addEventListener("pointerenter", onMove);
      wrap.addEventListener("pointerleave", onLeave);
    }

    const onScroll = () => {
      const r = wrap.getBoundingClientRect();
      const p = (r.top + r.height / 2) / window.innerHeight;
      scroll = Math.max(-1, Math.min(1, (p - 0.5) * 2));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
      },
      { threshold: 0 },
    );
    io.observe(wrap);

    /*
     * Textures: one unit per distinct source. A flat slide points both its
     * sampler slots at the same unit, so it costs one upload rather than two
     * and the shader still has something bound to sample.
     */
    const units: string[] = [];
    const unitOf = (src: string) => {
      const i = units.indexOf(src);
      return i >= 0 ? i : units.push(src) - 1;
    };
    const slots = SLIDES.map((sl) => ({
      mono: unitOf(sl.mono),
      colour: unitOf(sl.colour ?? sl.mono),
    }));
    if (units.length > MAX_UNITS) {
      console.warn(
        `hero: ${units.length} textures exceeds the guaranteed ${MAX_UNITS}`,
      );
    }
    let ready = 0;
    const wanted = units.length;

    // the drawing buffer is already sized by resize(), so it says exactly how
    // much detail is worth uploading
    const maxTex = Math.max(1280, canvas.width);

    const load = (src: string, unit: number) =>
      new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          if (disposed) return resolve();
          gl.activeTexture(gl.TEXTURE0 + unit);
          makeTexture(gl, downscale(img, maxTex));
          ready++;
          resolve();
        };
        img.onerror = reject;
        img.src = src;
      });

    /*
     * A request that neither loads nor errors leaves this promise pending and
     * the canvas at opacity 0 — a black hero with no way out. The timer turns
     * that into the still image instead.
     */
    const bail = window.setTimeout(() => {
      if (ready < wanted) giveUp();
    }, TEXTURE_TIMEOUT_MS);

    Promise.all(units.map((src, i) => load(src, i)))
      .then(() => {
        if (disposed) return;
        window.clearTimeout(bail);
        bindSlides();
        wrap.dataset.ready = "1";
      })
      .catch(() => {
        window.clearTimeout(bail);
        giveUp();
      });

    resize();
    bindSlides();

    // ── loop ────────────────────────────────────────────────
    const start = performance.now();
    let last = start;

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (disposed || ready < wanted || !visible) return;

      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const t = (now - start) / 1000;

      // a new index starts a dissolve from whatever is on screen
      if (target.current !== to) {
        from = progress >= 1 ? to : from;
        to = target.current;
        progress = 0;
        bindSlides();
        applyFraming();
      }
      if (progress < 1) {
        progress = Math.min(1, progress + dt / 1.45);
        if (progress >= 1) {
          from = to;
          bindSlides();
          applyFraming();
        }
      }

      // only a paired slide lights up at all
      const lit = (progress < 1 ? SLIDES[to] : SLIDES[from]).colour ? 1 : 0;
      const steering = ptr.over && now - ptr.moved < IDLE_MS;

      if (reduced) {
        // parked on her face: the reveal still reads, nothing travels
        pointer.x = focus.x;
        pointer.y = focus.y;
        hoverTarget = lit ? 0.75 : 0;
      } else if (lit && steering) {
        // hovering: the spotlight is the pointer, and opens to full size
        pointer.x = ptr.x;
        pointer.y = ptr.y;
        hoverTarget = 1;
      } else {
        /*
         * Otherwise it flows on its own around her face. Two frequencies per
         * axis rather than one, so the path never repeats on an obvious loop
         * and reads as drift rather than an orbit.
         */
        pointer.x =
          focus.x + Math.sin(t * 0.23) * 0.17 + Math.sin(t * 0.09) * 0.07;
        pointer.y =
          focus.y + Math.cos(t * 0.18) * 0.12 + Math.cos(t * 0.07) * 0.05;
        hoverTarget = lit ? 0.82 : 0;
      }

      const px = cur.x;
      const py = cur.y;
      const ease = 1 - Math.pow(0.001, dt); // frame-rate independent lerp
      cur.x += (pointer.x - cur.x) * ease;
      cur.y += (pointer.y - cur.y) * ease;

      const speed = Math.hypot(cur.x - px, cur.y - py) / Math.max(dt, 0.001);
      vel += (Math.min(speed * 0.05, 0.25) - vel) * Math.min(dt * 6, 1);

      hover += (hoverTarget - hover) * Math.min(dt * 3.2, 1);
      // only a paired slide can open, and it eases rather than snapping
      const openTarget = lit && openRef.current ? 1 : 0;
      open += (openTarget - open) * Math.min(dt * 3.4, 1);
      intro = reduced ? 1 : Math.min(1, intro + dt * 0.55);

      gl.uniform2f(u.mouse, cur.x, cur.y);
      gl.uniform1f(u.hover, hover);
      gl.uniform1f(u.open, open);
      gl.uniform1f(u.vel, vel);
      gl.uniform1f(u.time, reduced ? 0 : t);
      gl.uniform1f(u.intro, intro);
      // no vertical crop to spare means no room to parallax into
      gl.uniform1f(u.scroll, scroll * Math.min(slack, 1));
      gl.uniform1f(u.slide, progress);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      disposed = true;
      window.clearTimeout(bail);
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      wrap.removeEventListener("pointermove", onMove);
      wrap.removeEventListener("pointerenter", onMove);
      wrap.removeEventListener("pointerleave", onLeave);
      gl.deleteProgram(prog);
      gl.deleteBuffer(buf);
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      className={styles.wrap}
      data-ready="0"
      data-reveal={reveals ? "1" : "0"}
      data-open={opened ? "1" : "0"}
      data-cursor={reveals ? "media" : undefined}
      data-cursor-label={reveals ? (opened ? "Close" : "Reveal") : undefined}
      /* a real control rather than a bare click handler, so it can be
         reached and fired from the keyboard as well */
      role={reveals ? "button" : undefined}
      tabIndex={reveals ? 0 : undefined}
      aria-pressed={reveals ? opened : undefined}
      aria-label={
        reveals
          ? opened
            ? "Hide the colour portrait"
            : "Reveal the colour portrait"
          : undefined
      }
      onClick={reveals ? toggleOpen : undefined}
      onKeyDown={
        reveals
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                toggleOpen();
              }
            }
          : undefined
      }
    >
      {fallback ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={imgRef}
          className={styles.fallback}
          src={SLIDES[index].colour ?? SLIDES[index].mono}
          alt="Dr. Nadia Choudhry"
          fetchPriority="high"
        />
      ) : (
        <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
      )}
      <span className={styles.sr}>Portrait of Dr. Nadia Choudhry</span>
      {reveals && (
        <span className={styles.hint} aria-hidden="true">
          {opened ? "Click to close" : "Click to reveal"}
        </span>
      )}
    </div>
  );
}
