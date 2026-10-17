import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

type Star = { x: number; y: number; vx: number; vy: number; r: number; vr: number; s: number };

// About section: a one-point perspective room drawn as one SVG path. The back wall is the
// content column; its vertical offset follows scroll with some lag, so the walls move.
export function initRoom(reduced: boolean) {
  const room = document.querySelector<HTMLElement>("[data-room]")!;
  const inner = room.querySelector<HTMLElement>("[data-room-inner]")!;
  const svg = room.querySelector<SVGSVGElement>(".room__lines")!;
  const path = room.querySelector<SVGPathElement>("[data-room-path]")!;
  const canvas = room.querySelector<HTMLCanvasElement>("[data-stars]")!;
  const ctx = canvas.getContext("2d")!;

  let W = 0;
  let H = 0;
  let iw = 0;
  let ih = 0;
  let ix = 0;
  let iy = 0;
  let p = 0;
  let sp = 0;

  const measure = () => {
    W = room.clientWidth;
    H = room.clientHeight;
    iw = inner.offsetWidth;
    ih = inner.offsetHeight;
    ix = inner.offsetLeft;
    iy = inner.offsetTop;
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    canvas.width = innerWidth;
    canvas.height = innerHeight;
    draw();
  };

  const draw = () => {
    const off = (W > 767 ? 260 : 120) * (sp * 2 - 1);
    const o = { x1: 0, y1: 0, x2: W, y2: H };
    const i = { x1: ix, y1: iy + off, x2: ix + iw, y2: iy + ih + off };
    const cols = W > 767 ? 12 : 8;
    const depth = 5;
    let d = "";
    const line = (ax: number, ay: number, bx: number, by: number) => (d += `M${ax.toFixed(1)} ${ay.toFixed(1)}L${bx.toFixed(1)} ${by.toFixed(1)}`);
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    line(o.x1, o.y1, i.x1, i.y1);
    line(o.x2, o.y1, i.x2, i.y1);
    line(o.x2, o.y2, i.x2, i.y2);
    line(o.x1, o.y2, i.x1, i.y2);
    for (let g = 1; g < cols; g++) {
      line((W / cols) * g, o.y1, i.x1 + (iw / cols) * g, i.y1);
      line((W / cols) * g, o.y2, i.x1 + (iw / cols) * g, i.y2);
    }
    const rowsOuter = Math.max(6, Math.round(H / 220));
    for (let g = 0; g <= rowsOuter; g++) {
      line(o.x1, (H / rowsOuter) * g, i.x1, i.y1 + (ih / rowsOuter) * g);
      line(o.x2, (H / rowsOuter) * g, i.x2, i.y1 + (ih / rowsOuter) * g);
    }
    for (let g = 1; g < depth; g++) {
      const t = 1 - Math.pow(1 - g / depth, 2);
      const ax = lerp(o.x1, i.x1, t);
      const ay1 = lerp(o.y1, i.y1, t);
      const bx = lerp(o.x2, i.x2, t);
      const ay2 = lerp(o.y2, i.y2, t);
      line(ax, ay1, bx, ay1);
      line(ax, ay2, bx, ay2);
      line(ax, ay1, ax, ay2);
      line(bx, ay1, bx, ay2);
    }
    path.setAttribute("d", d);
  };

  ScrollTrigger.create({
    trigger: room,
    start: "top bottom",
    end: "bottom top",
    onUpdate: (self) => (p = self.progress),
  });

  // Hover a proof box and it throws GitHub stars.
  const stars: Star[] = [];
  const ink = () => getComputedStyle(document.documentElement).getPropertyValue("--ink").trim();
  room.querySelectorAll<HTMLElement>("[data-throw]").forEach((box) => {
    const throwStars = () => {
      if (reduced) return;
      const r = box.getBoundingClientRect();
      const n = innerWidth > 767 ? 9 : 5;
      for (let k = 0; k < n; k++) {
        stars.push({
          x: r.left + r.width / 2,
          y: r.top + r.height / 2,
          vx: (Math.random() * 2 - 1) * 6,
          vy: -6 - Math.random() * 9,
          r: 0,
          vr: (Math.random() * 2 - 1) * 12,
          s: 18 + Math.random() * 22,
        });
      }
    };
    box.addEventListener("mouseenter", throwStars);
    box.addEventListener("touchstart", throwStars, { passive: true });
  });

  const drawStars = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!stars.length) return;
    ctx.fillStyle = ink();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (let k = stars.length - 1; k >= 0; k--) {
      const s = stars[k];
      s.vy += 0.5;
      s.x += s.vx;
      s.y += s.vy;
      s.r += s.vr;
      if (s.y > innerHeight + 60) {
        stars.splice(k, 1);
        continue;
      }
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate((s.r * Math.PI) / 180);
      ctx.font = `900 ${s.s}px Anybody, sans-serif`;
      ctx.fillText("★", 0, 0);
      ctx.restore();
    }
  };

  measure();
  new ResizeObserver(measure).observe(room);
  let visible = false;
  new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(room);
  gsap.ticker.add(() => {
    if (!visible && !stars.length) return;
    const before = sp;
    sp += (p - sp) * 0.15;
    if (Math.abs(sp - before) > 0.0002) draw();
    drawStars();
  });
}
