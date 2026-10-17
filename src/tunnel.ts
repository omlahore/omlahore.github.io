import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CARDS, type Card } from "./data";

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (t: number) => t * t * (3 - 2 * t);
const easeIn = (t: number) => t * t * t * t;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const MERGE_ICON =
  '<svg width="12" height="12" viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M5 3.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm0 2.122a2.25 2.25 0 1 0-1.5 0v5.256a2.251 2.251 0 1 0 1.5 0V8.75c.6.47 1.36.75 2.18.75h2.89a2.25 2.25 0 1 0 0-1.5H7.18A2.18 2.18 0 0 1 5 5.82v-.448ZM4.25 13.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm8.25-5a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Z"/></svg>';

const cardHTML = (c: Card) => {
  if (c.kind === "pr") {
    return `<a class="card card--pr" href="${c.url}"><span class="pr__top"><span>${esc(c.repo)}</span><span class="pr__badge">${MERGE_ICON}Merged</span></span><p class="pr__title">${esc(c.title)}</p><span class="pr__foot"><span>#${c.n}</span><span>${c.date}</span></span></a>`;
  }
  const media =
    c.kind === "video"
      ? `<video class="card__media" muted loop playsinline preload="none" data-src="${c.src}" aria-label="${esc(c.alt)}"></video>`
      : `<img class="card__media" src="${c.src}" alt="${esc(c.alt)}" loading="lazy" decoding="async" />`;
  return `<a class="card" href="${c.href}">${media}<span class="card__cap"><b>${esc(c.title)}</b><span>${esc(c.meta)}</span></span></a>`;
};

type Ghost = { el: HTMLElement; row: number; k: number };

// The work section. A pill-shaped window in the page looks into a dark room that stays put
// while the window scrolls over it. Once the section pins, the window opens to fill the
// screen, each letter of MERGED becomes a stream of copies, and the cards sweep past.
export function initTunnel(reduced: boolean) {
  const section = document.querySelector<HTMLElement>("[data-tunnel]")!;
  const stage = section.querySelector<HTMLElement>("[data-stage]")!;
  const inside = section.querySelector<HTMLElement>("[data-inside]")!;
  const scene = section.querySelector<HTMLElement>("[data-scene]")!;
  const letters = section.querySelector<HTMLElement>("[data-letters]")!;
  const cardsEl = section.querySelector<HTMLElement>("[data-cards]")!;
  const gridPath = section.querySelector<SVGPathElement>("[data-grid-path]")!;
  const ring = section.querySelector<SVGPathElement>("[data-ring]")!;
  const gridSvg = gridPath.ownerSVGElement!;
  const word = (letters.textContent ?? "MERGED").trim();

  cardsEl.innerHTML = CARDS.map(cardHTML).join("");
  const cards = [...cardsEl.children] as HTMLElement[];
  section.style.setProperty("--tunnel-h", `${CARDS.length * 44 + 240}vh`);

  if (reduced) {
    cards.forEach((c) => {
      const v = c.querySelector<HTMLVideoElement>("video[data-src]");
      if (v) v.src = v.dataset.src!;
    });
    return;
  }

  const layout = cards.map((_, i) => ({
    y: (i % 2 ? -1 : 1) * (0.25 + Math.random() * 0.55),
    s: 0.82 + Math.random() * 0.26,
  }));

  let W = 0;
  let H = 0;
  let headH = 0;
  let glyph = 0;
  let ghosts: Ghost[] = [];
  let perRow = 0;
  const speeds = [...word].map(() => 0.8 + Math.random() * 0.7);
  const offsets = [...word].map(() => Math.random());

  const build = () => {
    W = stage.clientWidth;
    H = stage.clientHeight;
    headH = (document.querySelector<HTMLElement>("[data-head]")?.offsetHeight ?? 0) + 8;
    glyph = ((H - headH) / word.length) * 1.08;
    stage.style.setProperty("--glyph", `${glyph}px`);
    letters.replaceChildren();
    ghosts = [];
    perRow = Math.min(18, Math.round((W / (glyph * 0.6)) * 0.9) + 2);
    [...word].forEach((ch, row) => {
      for (let k = 0; k < perRow; k++) {
        const s = document.createElement("span");
        s.className = "ghost";
        s.textContent = ch;
        s.dataset.l = ch;
        letters.appendChild(s);
        ghosts.push({ el: s, row, k });
      }
    });
    let d = "";
    const cols = W > 767 ? 12 : 6;
    for (let c = 1; c < cols; c++) d += `M${(W / cols) * c} 0V${H}`;
    for (let r = 1; r < 8; r++) d += `M0 ${(H / 8) * r}H${W}`;
    gridSvg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    gridPath.setAttribute("d", d);
    render();
  };

  let T = 0;
  let drift = 0;
  const loaded = new Set<HTMLVideoElement>();

  const render = () => {
    const open = easeIn(clamp01(T / 0.11));
    const close = 1 - smooth(clamp01((T - 0.9) / 0.1));
    const grow = Math.min(open, close);
    const state = Math.min(smooth(clamp01((T - 0.05) / 0.06)), 1 - smooth(clamp01((T - 0.88) / 0.06)));

    // the window: a stadium centred in the stage, opening to the full screen
    const ww = Math.max(110, Math.min(170, W * 0.1));
    const wh = H * 0.74;
    const x = ((W - ww) / 2) * (1 - grow);
    const y = ((H - wh) / 2) * (1 - grow);
    const r = (ww / 2) * (1 - grow);
    inside.style.setProperty("--it", `${y}px`);
    inside.style.setProperty("--ib", `${y}px`);
    inside.style.setProperty("--ix", `${x}px`);
    inside.style.setProperty("--ir", `${r}px`);
    inside.style.setProperty("--state", state.toFixed(3));
    inside.style.setProperty("--dx", `${(-drift * 40) % 24}px`);

    // a thin outline around the window, with the grid cut away inside it
    const gap = 14 * (1 - grow);
    const rx = x - gap;
    const ry = y - gap;
    const rw = W - 2 * x + 2 * gap;
    const rh = H - 2 * y + 2 * gap;
    const rr = Math.min(r + gap, rw / 2);
    ring.setAttribute(
      "d",
      `M${rx + rr} ${ry}H${rx + rw - rr}A${rr} ${rr} 0 0 1 ${rx + rw} ${ry + rr}V${ry + rh - rr}A${rr} ${rr} 0 0 1 ${rx + rw - rr} ${ry + rh}H${rx + rr}A${rr} ${rr} 0 0 1 ${rx} ${ry + rh - rr}V${ry + rr}A${rr} ${rr} 0 0 1 ${rx + rr} ${ry}Z`,
    );

    // the room behind the window stays fixed to the viewport while the window moves
    const top = stage.getBoundingClientRect().top;
    scene.style.transform = `translate3d(0, ${(-top).toFixed(1)}px, 0)`;

    const n = word.length;
    const stackH = wh - ww * 0.9;
    const s0 = Math.min(stackH / (H - headH), (ww * 0.72) / (glyph * 0.62));
    const stackTop = (H - stackH) / 2;
    const time = T * 9 + drift;
    for (const g of ghosts) {
      const u = (((time * speeds[g.row] * 0.18 + offsets[g.row] + g.k / perRow) % 1) + 1) % 1;
      const head = (u - 0.5) * -2;
      const iy = ((g.row + 0.5) / n) * 2 - 1;
      const y0 = stackTop + (stackH / n) * (g.row + 0.5);
      const y1 = headH + ((H - headH) / n) * (g.row + 0.5);
      const gx = head * W * 0.56 * state;
      const gy = lerp(y0, y1, state) + iy * head * head * H * 0.06 * state;
      const sc = lerp(s0, 1, state);
      g.el.style.transform = `translate3d(${gx.toFixed(1)}px, ${gy.toFixed(1)}px, 0) translate(-50%, -50%) rotateY(${(head * -16 * state).toFixed(2)}deg) scale(${sc.toFixed(3)})`;
      g.el.style.setProperty("--h", head.toFixed(2));
    }

    const span = 0.76;
    const start = 0.12;
    const half = (span / cards.length) * 1.7;
    cards.forEach((el, i) => {
      const c = start + ((i + 0.5) / cards.length) * span;
      const p = (c - T) / half;
      const on = Math.abs(p) < 1.05 && state > 0.2;
      el.classList.toggle("is-on", on);
      const v = el.querySelector<HTMLVideoElement>("video");
      if (v) {
        if (Math.abs(p) < 2 && !loaded.has(v)) {
          v.src = v.dataset.src!;
          loaded.add(v);
        }
        if (on && v.paused) v.play().catch(() => {});
        else if (!on && !v.paused) v.pause();
      }
      if (!on) return;
      const cx = p * (W / 2 + el.offsetWidth * 0.62);
      const cy = layout[i].y * H * 0.2;
      const cz = -p * p * 260;
      el.style.transform = `translate3d(calc(-50% + ${cx.toFixed(1)}px), calc(-50% + ${cy.toFixed(1)}px), ${cz.toFixed(1)}px) rotateY(${(p * -26).toFixed(2)}deg) scale(${layout[i].s})`;
    });
  };

  ScrollTrigger.create({
    trigger: section,
    start: "top top",
    end: "bottom bottom",
    onUpdate: (self) => (T = self.progress),
  });

  let visible = false;
  new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(stage);
  gsap.ticker.add((_t, dt) => {
    if (!visible) return;
    drift += dt * 0.00025;
    render();
  });

  build();
  let rt = 0;
  new ResizeObserver(() => {
    clearTimeout(rt);
    rt = window.setTimeout(build, 100);
  }).observe(stage);
}
