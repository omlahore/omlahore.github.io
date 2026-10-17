import { gsap } from "gsap";
import { createNoise } from "./noise";

// Hero background: an ASCII field driven by noise. The pointer leaves a ripple.
const RAMP = " .·:-=+*#%@";

export function initField(canvas: HTMLCanvasElement, reduced: boolean) {
  const ctx = canvas.getContext("2d")!;
  const noise = createNoise();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let w = 0;
  let h = 0;
  let cols = 0;
  let rows = 0;
  let cw = 11;
  let ch = 18;
  let ink = "#0d0420";
  let atlas: HTMLCanvasElement | null = null;
  const pointer = { x: -9999, y: -9999, sx: -9999, sy: -9999, v: 0 };
  const ripples: { x: number; y: number; r: number; a: number }[] = [];

  const buildAtlas = () => {
    ink = getComputedStyle(document.documentElement).getPropertyValue("--ink").trim() || ink;
    atlas = document.createElement("canvas");
    atlas.width = Math.ceil(cw * dpr) * RAMP.length;
    atlas.height = Math.ceil(ch * dpr);
    const a = atlas.getContext("2d")!;
    a.scale(dpr, dpr);
    a.fillStyle = ink;
    a.font = `500 ${Math.round(ch * 0.72)}px "JetBrains Mono", monospace`;
    a.textBaseline = "middle";
    a.textAlign = "center";
    for (let i = 0; i < RAMP.length; i++) a.fillText(RAMP[i], i * Math.ceil(cw * dpr) / dpr + cw / 2, ch / 2);
  };

  const resize = () => {
    const r = canvas.getBoundingClientRect();
    w = r.width;
    h = r.height;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    cw = w < 600 ? 10 : 12;
    ch = w < 600 ? 16 : 19;
    cols = Math.ceil(w / cw);
    rows = Math.ceil(h / ch);
    buildAtlas();
    draw(performance.now());
  };

  const draw = (t: number) => {
    if (!atlas) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const time = t * 0.00012;
    const gw = Math.ceil(cw * dpr);
    const gh = Math.ceil(ch * dpr);
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const px = x * cw;
        const py = y * ch;
        let v = noise(x * 0.045 + time, y * 0.07 - time * 0.6) + noise(x * 0.11 - time * 1.4, y * 0.16) * 0.35;
        const dx = px - pointer.sx;
        const dy = py - pointer.sy;
        const d = Math.hypot(dx, dy);
        if (d < 220) v += (1 - d / 220) * 0.55;
        for (const rp of ripples) {
          const rd = Math.abs(Math.hypot(px - rp.x, py - rp.y) - rp.r);
          if (rd < 26) v += (1 - rd / 26) * 0.6 * rp.a;
        }
        if (v < -0.02) continue;
        const idx = Math.min(RAMP.length - 1, Math.floor((v + 0.05) * 1.7 * RAMP.length));
        if (idx <= 0) continue;
        ctx.drawImage(atlas, idx * gw, 0, gw, gh, Math.round(px * dpr), Math.round(py * dpr), gw, gh);
      }
    }
  };

  let lastRipple = 0;
  window.addEventListener(
    "pointermove",
    (e) => {
      const r = canvas.getBoundingClientRect();
      pointer.x = e.clientX - r.left;
      pointer.y = e.clientY - r.top;
      if (pointer.sx < -999) {
        pointer.sx = pointer.x;
        pointer.sy = pointer.y;
      }
      const now = performance.now();
      if (now - lastRipple > 140 && pointer.y > 0 && pointer.y < h) {
        ripples.push({ x: pointer.x, y: pointer.y, r: 0, a: 1 });
        if (ripples.length > 8) ripples.shift();
        lastRipple = now;
      }
    },
    { passive: true },
  );

  let visible = true;
  new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(canvas);

  resize();
  let rt = 0;
  window.addEventListener("resize", () => {
    clearTimeout(rt);
    rt = window.setTimeout(resize, 120);
  });
  document.addEventListener("palettechange", buildAtlas);
  document.fonts?.ready.then(buildAtlas);

  if (reduced) return;
  let acc = 0;
  gsap.ticker.add((time, dt) => {
    if (!visible) return;
    pointer.sx += (pointer.x - pointer.sx) * 0.12;
    pointer.sy += (pointer.y - pointer.sy) * 0.12;
    for (const rp of ripples) {
      rp.r += 6;
      rp.a *= 0.965;
    }
    while (ripples.length && ripples[0].a < 0.05) ripples.shift();
    acc += dt;
    if (acc < 30) return;
    acc = 0;
    draw(time * 1000);
  });
}
