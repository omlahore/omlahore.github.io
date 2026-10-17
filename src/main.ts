import "./style.css";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { initPalette, shuffleHue } from "./palette";
import { initField } from "./field";
import { initConsole } from "./console";
import { initRoom } from "./room";
import { initTunnel } from "./tunnel";
import { initCrawl } from "./crawl";
import { initCta } from "./cta";
import { initCounters, initIndex, initStretch, initVideos, initVisit } from "./sections";

gsap.registerPlugin(ScrollTrigger, SplitText);

const root = document.documentElement;
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
if (reduced) root.classList.add("rm");

initPalette(reduced);

let lenis: Lenis | null = null;
if (!reduced) {
  lenis = new Lenis({ lerp: 0.1 });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((t) => lenis!.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  lenis.stop();
}

document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((a) =>
  a.addEventListener("click", (e) => {
    const id = a.getAttribute("href")!;
    const target = id === "#top" ? 0 : document.querySelector<HTMLElement>(id);
    if (target === null) return;
    e.preventDefault();
    const easing = (t: number) => (t < 0.5 ? 16 * t ** 5 : 1 - (-2 * t + 2) ** 5 / 2);
    if (lenis) lenis.scrollTo(target, { offset: id === "#merged" ? 0 : -64, duration: 1.6, easing });
    else window.scrollTo({ top: target === 0 ? 0 : (target as HTMLElement).offsetTop - 64 });
    if (target instanceof HTMLElement) {
      target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
    }
  }),
);

document.querySelector<HTMLButtonElement>("[data-shuffle]")!.addEventListener("click", shuffleHue);

// the name fills the width exactly
const title = document.querySelector<HTMLElement>("[data-title]")!;
const fitTitle = () => {
  title.style.fontSize = "100px";
  title.style.width = "max-content";
  const natural = title.getBoundingClientRect().width;
  title.style.width = "";
  const size = Math.min((100 * title.parentElement!.clientWidth) / natural, innerHeight * 0.5);
  title.style.fontSize = `${(size * 0.995).toFixed(2)}px`;
};
fitTitle();
window.addEventListener("resize", fitTitle);

const clock = document.querySelector<HTMLElement>("[data-clock]")!;
const fmt = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit" });
const tick = () => (clock.textContent = fmt.format(new Date()));
tick();
window.setInterval(tick, 15000);

const BANDS = [
  ["exec /usr/bin/profiles", "open ~/.env", "write src/config.js", "connect 140.82.112.3:443", "exec go test -race ./...", "unlink ~/Library/…/models", "exec git push fork", "open README.md"],
  ["zot", "OneBusAway maglev", "Volcano", "kthena", "Grafana", "Kyverno", "OpenKruise", "Kestra", "Headlamp", "PipeCD", "Phase", "MDN"],
];
document.querySelectorAll<HTMLElement>("[data-band]").forEach((track, i) => {
  const items = BANDS[i % BANDS.length];
  const one = items.map((s) => (i === 0 ? `<span>● ${s}</span>` : `<span><b>${s}</b> merged</span>`)).join("");
  track.innerHTML = one + one + one + one;
  if (reduced) return;
  if (i % 2) gsap.set(track, { xPercent: -25 });
  const tween = gsap.to(track, { xPercent: i % 2 ? 0 : -25, duration: 30, ease: "none", repeat: -1 });
  lenis?.on("scroll", ({ velocity }: { velocity: number }) => {
    gsap.to(tween, { timeScale: 1 + Math.min(Math.abs(velocity) * 0.25, 8), duration: 0.3, overwrite: true });
  });
});

initField(document.querySelector<HTMLCanvasElement>("[data-field]")!, reduced);
initConsole(document.querySelector<HTMLElement>("[data-console]")!, reduced);
initRoom(reduced);
initStretch(reduced);
initIndex();
initVideos();
initVisit();
initTunnel(reduced);
initCrawl(reduced);
initCta(reduced);
initCounters(reduced);

document.fonts?.ready.then(() => {
  fitTitle();
  ScrollTrigger.refresh();
});

// intro: a count to 100 while the mark builds, then the frame draws in, the header drops
// and the name rises letter by letter
const intro = document.querySelector<HTMLElement>("[data-intro]")!;
const done = () => {
  root.classList.remove("is-loading");
  intro.remove();
  lenis?.start();
  document.dispatchEvent(new Event("introend"));
  ScrollTrigger.refresh();
};

if (reduced) {
  done();
} else {
  // two branches draw in and merge into the O, then the O opens into the page
  const split = new SplitText(title.querySelectorAll(".hero__word"), { type: "chars", charsClass: "char" });
  const branches = intro.querySelectorAll("[data-intro-b]");
  const ring = intro.querySelector<SVGCircleElement>("[data-intro-o]")!;
  const typed = intro.querySelector<HTMLElement>("[data-intro-type]")!;
  const count = intro.querySelector<HTMLElement>("[data-intro-count]")!;
  const o = ring.getBoundingClientRect();
  const cx = o.left + o.width / 2;
  const cy = o.top + o.height / 2;
  const far = Math.hypot(Math.max(cx, innerWidth - cx), Math.max(cy, innerHeight - cy));
  const hole = { h: (o.width / 2) * (10.5 / 22.5) };
  intro.style.setProperty("--x", `${cx}px`);
  intro.style.setProperty("--y", `${cy}px`);
  const cmd = "open omlahore.github.io";
  const c = { v: 0, k: 0 };
  const tl = gsap.timeline({ delay: 0.1, onComplete: done });
  tl.set("[data-frame]", { scale: 0 })
    .set("[data-head]", { yPercent: -120 })
    .set(split.chars, { yPercent: 110 })
    .set(".hero__star", { scale: 0, rotate: -180 })
    .set(ring, { opacity: 0 })
    .to(c, { v: 100, duration: 1.7, ease: "power2.inOut", onUpdate: () => (count.textContent = String(Math.round(c.v))) }, 0)
    .to(c, { k: cmd.length, duration: 0.8, ease: "none", onUpdate: () => (typed.textContent = cmd.slice(0, Math.round(c.k))) }, 0.15)
    .to(branches, { strokeDashoffset: 0, duration: 0.9, ease: "power3.inOut" }, 0.2)
    .set(ring, { opacity: 1 }, 0.95)
    .to(ring, { strokeDashoffset: 0, duration: 0.7, ease: "power3.out" }, 0.95)
    .to(".intro__term, .intro__count", { opacity: 0, duration: 0.3 }, 1.75)
    .to(hole, {
      h: far,
      duration: 1.1,
      ease: "expo.in",
      onUpdate: () => intro.style.setProperty("--h", `${hole.h}px`),
    }, 1.8)
    .to("[data-frame]", { scale: 1, duration: 1.4, ease: "power3.inOut", stagger: 0.06 }, 2.4)
    .to("[data-head]", { yPercent: 0, duration: 1.1, ease: "expo.out" }, 2.6)
    .to(split.chars, { yPercent: 0, duration: 1.1, ease: "expo.out", stagger: 0.035 }, 2.65)
    .to(".hero__star", { scale: 1, rotate: 0, duration: 1.2, ease: "expo.out" }, 2.8)
    .from(".hero__meta span", { opacity: 0, y: 10, duration: 0.6, stagger: 0.08 }, 2.95);
}
