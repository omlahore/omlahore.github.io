import { gsap } from "gsap";

// One hue drives the whole page. Colors are set in OKLCH at a fixed lightness and moderate
// chroma, so every hue reads equally bright and none of them turns neon. The hue drifts
// slowly forever; the shuffle button jumps it somewhere new and the drift carries on.

const TURN_MS = 120000;
let hue = 0;
let reduced = false;
let jumping = false;

const lightFor = (h: number) => {
  // yellows and greens look muddy at the base lightness, so lift them a little
  const near = (c: number, w: number) => Math.max(0, 1 - Math.abs(((h - c + 540) % 360) - 180) / w);
  return 0.74 + 0.08 * near(100, 45) + 0.03 * near(150, 40);
};

const chromaFor = (h: number) => {
  const near = (c: number, w: number) => Math.max(0, 1 - Math.abs(((h - c + 540) % 360) - 180) / w);
  return 0.13 - 0.03 * near(140, 50);
};

export function applyHue(h: number) {
  hue = ((h % 360) + 360) % 360;
  const L = lightFor(hue);
  const C = chromaFor(hue);
  const H = hue.toFixed(1);
  const r = document.documentElement.style;
  r.setProperty("--field", `oklch(${L.toFixed(3)} ${C.toFixed(3)} ${H})`);
  r.setProperty("--ink", `oklch(0.19 0.045 ${H})`);
  r.setProperty("--shade", `oklch(${(L - 0.2).toFixed(3)} ${(C + 0.02).toFixed(3)} ${H})`);
  r.setProperty("--paper", `oklch(0.975 0.018 ${H})`);
  r.setProperty("--grid", `oklch(0.19 0.045 ${H} / 0.3)`);
  r.setProperty("--dots", `oklch(${L.toFixed(3)} ${C.toFixed(3)} ${H} / 0.35)`);
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", `oklch(${L.toFixed(3)} ${C.toFixed(3)} ${H})`);
  document.dispatchEvent(new Event("palettechange"));
}

export function initPalette(isReduced: boolean) {
  reduced = isReduced;
  let start = Math.random() * 360;
  try {
    const last = Number(localStorage.getItem("om-hue"));
    if (!Number.isNaN(last) && Math.abs(((start - last + 540) % 360) - 180) < 60) start = (start + 150) % 360;
    localStorage.setItem("om-hue", String(Math.round(start)));
  } catch {
    /* storage can be blocked; the page still gets a color */
  }
  applyHue(start);
  if (reduced) return;
  let acc = 0;
  gsap.ticker.add((_t, dt) => {
    acc += dt;
    if (acc < 90 || jumping) return;
    applyHue(hue + (360 * acc) / TURN_MS);
    acc = 0;
  });
}

export function shuffleHue() {
  const to = hue + 100 + Math.random() * 160;
  if (reduced) return applyHue(to);
  const o = { h: hue };
  jumping = true;
  gsap.to(o, {
    h: to,
    duration: 1.1,
    ease: "power2.inOut",
    overwrite: true,
    onUpdate: () => applyHue(o.h),
    onComplete: () => (jumping = false),
  });
}

if (import.meta.env.DEV) {
  (window as unknown as { __hue: (h: number) => void }).__hue = (h: number) => {
    jumping = true;
    applyHue(h);
  };
}
