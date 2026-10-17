import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import prs from "./prs.json";

type PR = { repo: string; n: number; title: string; url: string; merged: string };
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

// Big section titles start condensed and stretch to the full width as they scroll in.
export function initStretch(reduced: boolean) {
  const els = [...document.querySelectorAll<HTMLElement>("[data-stretch]")];
  const fit = () =>
    els.forEach((el) => {
      el.style.fontVariationSettings = `"wdth" 125`;
      el.style.fontSize = "100px";
      el.style.width = "max-content";
      const counters = [...el.querySelectorAll<HTMLElement>("[data-count]")];
      const shown = counters.map((c) => c.textContent);
      counters.forEach((c) => (c.textContent = Number(c.dataset.count).toLocaleString("en-US")));
      const natural = el.getBoundingClientRect().width;
      counters.forEach((c, i) => (c.textContent = shown[i]));
      el.style.width = "";
      const avail = el.parentElement!.clientWidth;
      el.style.fontSize = `${((100 * avail) / natural) * 0.98}px`;
      el.style.fontVariationSettings = `"wdth" ${reduced ? 125 : (widths.get(el) ?? 62).toFixed(1)}`;
      guard(el);
    });
  // never let a title spill past its column, whatever the browser measured
  const guard = (el: HTMLElement) => {
    const over = el.scrollWidth / el.clientWidth;
    if (over > 1.001) el.style.fontSize = `${(parseFloat(el.style.fontSize) / over) * 0.99}px`;
  };
  const widths = new Map<HTMLElement, number>();
  fit();
  document.fonts?.ready.then(fit);
  document.fonts?.addEventListener?.("loadingdone", fit);
  window.addEventListener("resize", fit);
  if (reduced) return;
  els.forEach((el) => {
    const o = { w: 62 };
    gsap.to(o, {
      w: 125,
      ease: "none",
      scrollTrigger: { trigger: el, start: "top 95%", end: "top 35%", scrub: 0.6 },
      onUpdate: () => {
        widths.set(el, o.w);
        el.style.fontVariationSettings = `"wdth" ${o.w.toFixed(1)}`;
        if (o.w > 110) guard(el);
      },
    });
  });
}

// Count numbers up from zero the first time they come into view.
export function initCounters(reduced: boolean) {
  if (reduced) return;
  document.querySelectorAll<HTMLElement>("[data-count]").forEach((el) => {
    const target = Number(el.dataset.count);
    const suffix = el.dataset.suffix ?? "";
    const o = { v: 0 };
    el.textContent = `0${suffix}`;
    gsap.to(o, {
      v: target,
      duration: 1.8,
      ease: "power3.out",
      scrollTrigger: { trigger: el, start: "top 88%", once: true },
      onUpdate: () => (el.textContent = Math.round(o.v).toLocaleString("en-US") + suffix),
    });
  });
}

// Videos in the case studies load and play only while on screen.
export function initVideos() {
  document.querySelectorAll<HTMLVideoElement>("video[data-autoplay]").forEach((v) => {
    ScrollTrigger.create({
      trigger: v,
      start: "top bottom+=200",
      end: "bottom top",
      onToggle: (self) => {
        if (self.isActive) {
          if (!v.src) v.src = v.dataset.src!;
          v.play().catch(() => {});
        } else v.pause();
      },
    });
  });
}

// The biggest projects with their latest merged pull requests, then the rest as a list.
export function initIndex() {
  const host = document.querySelector<HTMLElement>("[data-oss]")!;
  const groups = new Map<string, PR[]>();
  for (const p of prs as PR[]) {
    if (!groups.has(p.repo)) groups.set(p.repo, []);
    groups.get(p.repo)!.push(p);
  }
  const fmt = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });
  const sorted = [...groups.entries()].sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]));
  const top = sorted.slice(0, 5);
  const rest = sorted.slice(5);
  const groupsHTML = top
    .map(([repo, list]) => {
      const [org, name] = repo.split("/");
      const rows = list
        .slice()
        .sort((a, b) => b.merged.localeCompare(a.merged))
        .slice(0, 3)
        .map((p) => `<li><a href="${p.url}"><span class="oss__d">${fmt(p.merged)}</span><span class="oss__t">${esc(p.title)}</span><span class="oss__n">#${p.n}</span></a></li>`)
        .join("");
      return `<div class="oss__group"><h3 class="oss__repo">${esc(name)}<sup>${list.length}</sup><small>${esc(org)}</small></h3><ol class="oss__prs">${rows}</ol></div>`;
    })
    .join("");
  const chips = rest
    .map(([repo, list]) => `<li><a href="https://github.com/${repo}/pulls?q=is%3Apr+author%3Aomlahore+is%3Amerged">${esc(repo.split("/")[1])}<sup>${list.length}</sup></a></li>`)
    .join("");
  host.innerHTML = `${groupsHTML}<div class="oss__rest"><p class="oss__restlabel">And ${rest.length} more projects</p><ul class="oss__chips">${chips}</ul></div>`;
}

// The bodycam panel: this visit, recorded the way bodycam records an agent.
export function initVisit() {
  const out = document.querySelector<HTMLElement>("[data-visit]")!;
  const t0 = performance.now();
  const c = { scroll: 0, px: 0, move: 0, click: 0, key: 0, copy: 0, hidden: 0 };
  let lastY = window.scrollY;
  let lastClick = "";
  window.addEventListener("scroll", () => {
    c.scroll++;
    c.px += Math.abs(window.scrollY - lastY);
    lastY = window.scrollY;
  }, { passive: true });
  window.addEventListener("pointermove", () => c.move++, { passive: true });
  window.addEventListener("click", (e) => {
    c.click++;
    const t = (e.target as Element).closest("a, button");
    lastClick = t ? (t.textContent || t.getAttribute("aria-label") || "").trim().replace(/\s+/g, " ").slice(0, 28) : "the page";
  });
  window.addEventListener("keydown", () => c.key++);
  document.addEventListener("copy", () => c.copy++);
  document.addEventListener("visibilitychange", () => document.hidden && c.hidden++);
  const n = (v: number) => v.toLocaleString("en-US").padStart(7);
  const render = () => {
    const s = Math.floor((performance.now() - t0) / 1000);
    const rows: [string, string, string][] = [
      ["scroll", n(c.scroll), `${Math.round(c.px).toLocaleString("en-US")} px`],
      ["pointer moves", n(c.move), ""],
      ["clicks", n(c.click), lastClick ? `last: ${lastClick}` : ""],
      ["key presses", n(c.key), ""],
      ["copies", n(c.copy), ""],
      ["tab switches", n(c.hidden), ""],
      ["sent", n(0), "bytes"],
    ];
    out.innerHTML =
      `you <b>(${Math.floor(s / 60)}m ${String(s % 60).padStart(2, "0")}s on this page)</b>\n` +
      rows.map(([k, v, d], i) => `${i === rows.length - 1 ? "└─" : "├─"} ${k.padEnd(14)}${v}  <b>${esc(d)}</b>`).join("\n");
  };
  render();
  window.setInterval(render, 1000);
}
