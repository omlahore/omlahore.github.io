import { gsap } from "gsap";
import prs from "./prs.json";

type PR = { repo: string; n: number; title: string; url: string; merged: string };

const ago = (iso: string) => {
  const days = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 86400000));
  return days === 0 ? "today" : days === 1 ? "1 day ago" : `${days} days ago`;
};

// The header types out real recent activity, one entry at a time.
export function initConsole(el: HTMLElement, reduced: boolean) {
  const latest = (prs as PR[])
    .slice()
    .sort((a, b) => b.merged.localeCompare(a.merged))
    .slice(0, 8)
    .map((p) => `merged  ${p.repo.split("/")[1]}#${p.n}  ${p.title}  (${ago(p.merged)})`);
  const lines = [
    ...latest.slice(0, 3),
    "stars   RemoveMacAI  5k",
    ...latest.slice(3, 6),
    "brew    install omlahore/tap/bodycam",
    ...latest.slice(6),
    "release RemoveMacAI 1.1.3",
  ];

  if (reduced) {
    el.textContent = lines.slice(0, 2).join("\n");
    return;
  }

  let i = 0;
  let msg = "";
  let text = "";
  let wait = 0;
  let lastAt = 0;
  let started = false;
  document.addEventListener("introend", () => (started = true), { once: true });
  gsap.ticker.add((t) => {
    const now = t * 1000;
    if (!started || now - lastAt < wait) return;
    lastAt = now;
    if (!msg) {
      msg = lines[i++ % lines.length];
      text += text ? "\n" : "";
      wait = 120;
      return;
    }
    const take = msg.length > 60 ? 2 : 1;
    text += msg.slice(0, take);
    msg = msg.slice(take);
    wait = msg ? 18 : 2600;
    text = text.split("\n").slice(-2).join("\n");
    el.textContent = text;
  });
}
