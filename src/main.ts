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
  const split = new SplitText(title.querySelectorAll(".hero__word"), { type: "chars", charsClass: "char" });
  const mark = intro.querySelector("[data-intro-mark]")!;
  const count = intro.querySelector<HTMLElement>("[data-intro-count]")!;
  const c = { v: 0 };
  const tl = gsap.timeline({ delay: 0.1, onComplete: done });
  tl.set("[data-frame]", { scale: 0 })
    .set("[data-head]", { yPercent: -120 })
    .set(split.chars, { yPercent: 110 })
    .set(".hero__star", { scale: 0, rotate: -180 })
    .to(c, { v: 100, duration: 1.3, ease: "power2.inOut", onUpdate: () => (count.textContent = String(Math.round(c.v))) }, 0)
    .from(mark.querySelectorAll(".v"), { scaleY: 0, duration: 0.7, ease: "power4.inOut", stagger: 0.12 }, 0)
    .from(mark.querySelectorAll(".h"), { scaleX: 0, duration: 0.45, ease: "power4.inOut" }, 0.55)
    .to([mark, count], { opacity: 0, duration: 0.35, ease: "power2.in" }, 1.35)
    .to(intro, { yPercent: -100, duration: 0.9, ease: "expo.inOut" }, 1.45)
    .to("[data-frame]", { scale: 1, duration: 1.4, ease: "power3.inOut", stagger: 0.06 }, 1.4)
    .to("[data-head]", { yPercent: 0, duration: 1.1, ease: "expo.out" }, 1.85)
    .to(split.chars, { yPercent: 0, duration: 1.1, ease: "expo.out", stagger: 0.035 }, 1.9)
    .to(".hero__star", { scale: 1, rotate: 0, duration: 1.2, ease: "expo.out" }, 2.05)
    .from(".hero__meta span", { opacity: 0, y: 10, duration: 0.6, stagger: 0.08 }, 2.25);
}
