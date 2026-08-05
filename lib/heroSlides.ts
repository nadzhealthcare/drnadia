/**
 * Hero slides and their focal-point cover framing.
 *
 * The canvas is full-bleed, so the crop moves with the viewport and the only
 * safe way to keep the title off her face is to compute where the face
 * actually lands and hand those numbers to the layout. The shader's uniforms
 * and the layout's custom properties both come from frameSlide(), so they can
 * never disagree.
 */

export type Slide = {
  id: string;
  /** the plate you always see — outside the spotlight, where there is one */
  mono: string;
  /**
   * Second plate the spotlight reveals. Omit it and the slide renders flat:
   * no mask, no displacement, no halo. Only the opening slide is a pair.
   */
  colour?: string;
  /** both plates of a slide share an aspect ratio */
  img: { w: number; h: number };
  /**
   * Her face in image-normalized coords, y from the top. `top` is the
   * hairline, not the crown: letting type cross hair is normal editorially
   * and is the only way the bands stay usable once the cover crop makes her
   * head most of the viewport. Type must never enter this box.
   */
  face: { left: number; right: number; top: number; bottom: number };
  /** horizontal focal point — where her face should sit across the screen */
  anchorX: number;
  /** share of leftover vertical space given to the band above her head */
  topShare: number;
  eyebrow: string;
  /** BlurText syntax — *runs in asterisks* are set in the italic serif */
  lineA: string;
  lineB: string;
};

export const SLIDES: Slide[] = [
  {
    id: "portrait",
    // the one pair on the page: the spotlight lifts the neon plate out of the
    // monochrome one, and it drives itself rather than following a pointer
    mono: "/assets/hero_nadia2.webp",
    colour: "/assets/hero_nadia1.webp",
    img: { w: 2466, h: 1209 },
    face: { left: 0.39, right: 0.53, top: 0.232, bottom: 0.592 },
    anchorX: 0.5,
    /*
     * At 2.04:1 every plate here is wider than an ordinary viewport, so cover
     * always scales by height and there is no vertical slack to distribute —
     * her face sits where the frame puts it and topShare has nothing to do.
     * Left at a neutral value for the clamp's sake.
     */
    topShare: 0.5,
    eyebrow: "Physician · Founder · Podcaster",
    lineA: "Dr. Nadia",
    lineB: "*Choudhry*",
  },
  {
    id: "practice",
    // flat plate, no reveal — she stands right of centre against the panelling
    mono: "/assets/hero_nadia3.webp",
    img: { w: 2466, h: 1209 },
    face: { left: 0.61, right: 0.72, top: 0.185, bottom: 0.41 },
    anchorX: 0.62,
    topShare: 0.5,
    eyebrow: "NADZ Healthcare · Est. 2025",
    // kept to a similar character count as the name so the slides set at a
    // comparable size once each line is fitted to the full width
    lineA: "Before",
    lineB: "*the symptom*",
  },
  {
    id: "longevity",
    // flat plate, no reveal — a full-length frame, so her face is small and
    // high in the picture and the band beneath it is generous
    mono: "/assets/hero_nadia4.webp",
    img: { w: 2466, h: 1209 },
    face: { left: 0.5, right: 0.585, top: 0.12, bottom: 0.245 },
    anchorX: 0.5,
    topShare: 0.5,
    eyebrow: "Longevity · Personalized care",
    lineA: "Measured in",
    lineB: "*decades*",
  },
];

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));

export type Framing = {
  /** rendered image size in css px */
  sw: number;
  sh: number;
  /** rendered image origin relative to the canvas, css px, y down */
  ox: number;
  oy: number;
  /** the face box on screen, css px from the top/left of the hero */
  faceTop: number;
  faceBottom: number;
  faceLeft: number;
  faceRight: number;
  /** 0..1 — how much vertical crop is spare, for scaling the parallax */
  slack: number;
};

export function frameSlide(slide: Slide, w: number, h: number): Framing {
  const { img, face } = slide;
  const scale = Math.max(w / img.w, h / img.h);
  const sw = img.w * scale;
  const sh = img.h * scale;

  const faceH = (face.bottom - face.top) * sh;
  const spare = h - faceH;

  // Split whatever is left over between the two type bands rather than
  // centring her — on a wide desktop the portrait crop makes her head two
  // thirds of the viewport, and centring leaves the top band unusable. If the
  // face is taller than the viewport there is nothing to split, so centre it.
  const wantTop = spare > 0 ? slide.topShare * spare : spare / 2;

  const faceCx = (face.left + face.right) / 2;
  const ox = clamp(slide.anchorX * w - faceCx * sw, w - sw, 0);
  const oy = clamp(wantTop - face.top * sh, h - sh, 0);

  return {
    sw,
    sh,
    ox,
    oy,
    faceTop: clamp(oy + face.top * sh, 0, h),
    faceBottom: clamp(oy + face.bottom * sh, 0, h),
    faceLeft: clamp(ox + face.left * sw, 0, w),
    faceRight: clamp(ox + face.right * sw, 0, w),
    slack: Math.min(1, (sh - h) / Math.max(h, 1)),
  };
}
