import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const VP_Y = 0.24;
const ANGLE = 76;

const MERGE =
  '<svg width="18" height="18" viewBox="0 0 16 16" aria-hidden="true" style="vertical-align:-3px;margin-right:6px"><path fill="currentColor" d="M5 3.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm0 2.122a2.25 2.25 0 1 0-1.5 0v5.256a2.251 2.251 0 1 0 1.5 0V8.75c.6.47 1.36.75 2.18.75h2.89a2.25 2.25 0 1 0 0-1.5H7.18A2.18 2.18 0 0 1 5 5.82v-.448ZM4.25 13.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm8.25-5a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Z"/></svg>';

const KINDS = [
  ["obj obj--key", "⌘"],
  ["obj obj--key", "⌥"],
  ["obj obj--key", "go"],
  ["obj obj--pill", `${MERGE}Merged`],
  ["obj obj--term", "<b>zsh</b><span>$ go test -race ./...<br>ok  0.412s</span>"],
  ["obj obj--file", "RemoveMacAI.mobileconfig"],
  ["obj obj--star", "★"],
  ["obj obj--switch", ""],
] as const;

type Obj = {
  el: HTMLElement;
  x: number; y: number; z: number;
  vx: number; vy: number; vz: number;
  rx: number; ry: number; vrx: number; vry: number;
  alive: boolean; drag: boolean; falling: boolean; fallAt: number;
};

// A floor that runs to a vanishing point, a line of text that crawls toward you,
// and things thrown out of the distance that you can grab.
export function initCrawl(reduced: boolean) {
  const section = document.querySelector<HTMLElement>("[data-crawl]")!;
  const stage = section.querySelector<HTMLElement>(".crawl__stage")!;
  const floor = section.querySelector<SVGPathElement>("[data-floor]")!;
  const text = section.querySelector<HTMLElement>("[data-crawl-text]")!;
  const host = section.querySelector<HTMLElement>("[data-objects]")!;

  let W = 0;
  let H = 0;
  let P = 0;

  const drawFloor = () => {
    W = stage.clientWidth;
    H = stage.clientHeight;
    const vx = W / 2;
    const vy = H * VP_Y;
    const n = W > 767 ? 12 : 8;
    let d = "";
    for (let i = 0; i <= n; i++) {
      d += `M${(W / n) * i} ${H}L${vx} ${vy}`;
      d += `M${(W / n) * i} 0L${vx} ${vy}`;
    }
    for (let i = 1; i < 8; i++) {
      d += `M0 ${(H / 8) * i}L${vx} ${vy}`;
      d += `M${W} ${(H / 8) * i}L${vx} ${vy}`;
    }
    for (let i = 1; i <= 10; i++) {
      const t = Math.pow(i / 10, 2.2);
      const y = vy + (H - vy) * t;
      d += `M0 ${y.toFixed(1)}H${W}`;
    }
    floor.ownerSVGElement!.setAttribute("viewBox", `0 0 ${W} ${H}`);
    floor.setAttribute("d", d);
  };

  const placeText = () => {
    const th = text.offsetHeight;
    const y = gsap.utils.interpolate(-4200, th + 300, P);
    text.style.transform = `translateX(-50%) rotateX(${ANGLE}deg) translateY(${y.toFixed(1)}px)`;
  };

  drawFloor();
  placeText();
  new ResizeObserver(() => {
    drawFloor();
    placeText();
  }).observe(stage);

  if (reduced) {
    P = 0.82;
    placeText();
    return;
  }

  ScrollTrigger.create({
    trigger: section,
    start: "top top",
    end: "bottom bottom",
    onUpdate: (self) => {
      P = self.progress;
      placeText();
    },
  });

  // thrown objects
  const pool: Obj[] = KINDS.map(([cls, html]) => {
    const el = document.createElement("div");
    el.className = cls;
    el.innerHTML = html;
    el.style.visibility = "hidden";
    host.appendChild(el);
    return { el, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, rx: 0, ry: 0, vrx: 0, vry: 0, alive: false, drag: false, falling: false, fallAt: 0 };
  });

  const launch = (o: Obj, warm = false) => {
    o.alive = true;
    o.drag = o.falling = false;
    o.x = 0;
    o.y = 0;
    o.z = warm ? -Math.random() * 5000 : -6000;
    o.vz = 34 + Math.random() * 16;
    o.vx = (Math.random() * 2 - 1) * W * 0.0035;
    o.vy = (0.25 + Math.random() * 0.75) * H * 0.0032 * (Math.random() < 0.75 ? 1 : -1);
    if (warm) {
      o.x = o.vx * Math.random() * 120;
      o.y = o.vy * Math.random() * 120;
    }
    o.rx = Math.random() * 360;
    o.ry = Math.random() * 360;
    o.vrx = 0.4 + Math.random() * 1.2;
    o.vry = 0.4 + Math.random() * 1.2;
    o.el.style.visibility = "visible";
    o.el.classList.remove("is-dragging");
  };

  const pointer = { x: 0, y: 0 };
  let dragged: Obj | null = null;
  pool.forEach((o) =>
    o.el.addEventListener("pointerdown", (e) => {
      if (!o.alive || o.falling) return;
      e.preventDefault();
      o.el.setPointerCapture(e.pointerId);
      dragged = o;
      o.drag = true;
      o.el.classList.add("is-dragging");
    }),
  );
  window.addEventListener("pointermove", (e) => {
    const r = stage.getBoundingClientRect();
    pointer.x = e.clientX - r.left - W / 2;
    pointer.y = e.clientY - r.top - H * VP_Y;
  });
  const release = () => {
    if (!dragged) return;
    dragged.drag = false;
    dragged.falling = true;
    dragged.fallAt = performance.now();
    dragged.el.classList.remove("is-dragging");
    dragged = null;
  };
  window.addEventListener("pointerup", release);
  window.addEventListener("pointercancel", release);

  let visible = false;
  let warmed = false;
  let nextAt = 0;
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible && !warmed) {
      warmed = true;
      pool.slice(0, 3).forEach((o) => launch(o, true));
    }
  }).observe(stage);

  gsap.ticker.add((t) => {
    if (!visible) return;
    const now = t * 1000;
    if (now > nextAt) {
      const idle = pool.filter((o) => !o.alive);
      if (idle.length && pool.length - idle.length < 5) launch(idle[Math.floor(Math.random() * idle.length)]);
      nextAt = now + 700 + Math.random() * 700;
    }
    for (const o of pool) {
      if (!o.alive) continue;
      if (o.drag) {
        o.vx += (pointer.x - o.x) * 0.08;
        o.vy += (pointer.y - o.y) * 0.08;
        o.vz += (0 - o.z) * 0.25;
        o.vx *= 0.82;
        o.vy *= 0.82;
        o.vz *= 0.7;
        o.x += o.vx * 0.5;
        o.y += o.vy * 0.5;
        o.z += o.vz * 0.3;
        o.ry += (o.vx * 0.4 - o.ry) * 0.2;
        o.rx += (-o.vy * 0.4 - o.rx) * 0.2;
      } else if (o.falling) {
        o.vy += 0.9;
        o.x += o.vx;
        o.y += o.vy;
        o.rx += o.vrx * 4;
        o.ry += o.vry * 4;
        if (now - o.fallAt > 1400) o.alive = false;
      } else {
        o.z += o.vz;
        o.x += o.vx;
        o.y += o.vy;
        o.rx += o.vrx;
        o.ry += o.vry;
        if (o.z > 600) o.alive = false;
      }
      if (!o.alive) {
        o.el.style.visibility = "hidden";
        continue;
      }
      o.el.style.transform = `translate3d(calc(-50% + ${o.x.toFixed(1)}px), calc(-50% + ${o.y.toFixed(1)}px), ${o.z.toFixed(1)}px) rotateX(${o.rx.toFixed(1)}deg) rotateY(${o.ry.toFixed(1)}deg)`;
    }
  });
}
