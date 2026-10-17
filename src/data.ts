import prs from "./prs.json";

type PR = { repo: string; n: number; title: string; url: string; merged: string };

export type Card =
  | { kind: "video" | "image"; src: string; title: string; meta: string; href: string; alt: string }
  | { kind: "pr"; repo: string; n: number; title: string; url: string; date: string };

const PICKS: [string, number][] = [
  ["grafana/grafana", 130413],
  ["project-zot/zot", 4475],
  ["kyverno/kyverno", 16977],
  ["OneBusAway/maglev", 1420],
  ["volcano-sh/kthena", 1784],
  ["phasehq/console", 972],
  ["project-zot/zot", 4515],
  ["OneBusAway/maglev", 1470],
  ["pipe-cd/pipecd", 7327],
  ["volcano-sh/volcano", 5957],
  ["kubernetes-sigs/headlamp", 7073],
  ["project-zot/zot", 4489],
];

const pr = (repo: string, n: number): Card => {
  const p = (prs as PR[]).find((x) => x.repo === repo && x.n === n)!;
  const date = new Date(p.merged).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
  return { kind: "pr", repo: p.repo, n: p.n, title: p.title, url: p.url, date };
};

const [a, b, c, d, e, f, g, h, i, j, k, l] = PICKS.map(([r, n]) => pr(r, n));

export const CARDS: Card[] = [
  { kind: "video", src: "/media/removemacai.mp4", title: "RemoveMacAI", meta: "Mac app and CLI", href: "https://github.com/omlahore/RemoveMacAI", alt: "RemoveMacAI turning off Apple Intelligence from the terminal" },
  a,
  b,
  { kind: "image", src: "/media/overview-dark.webp", title: "RemoveMacAI", meta: "5k stars", href: "https://omlahore.github.io/RemoveMacAI/", alt: "The RemoveMacAI app's overview screen" },
  c,
  d,
  { kind: "video", src: "/media/bodycam.mp4", title: "bodycam", meta: "Go, eslogger", href: "https://github.com/omlahore/bodycam", alt: "bodycam recording what an AI coding agent does on a Mac" },
  e,
  f,
  { kind: "image", src: "/media/bodycam-summary.webp", title: "bodycam", meta: "56 commands to fix one test", href: "https://github.com/omlahore/bodycam", alt: "bodycam's summary after recording Claude Code fix a test" },
  g,
  h,
  { kind: "image", src: "/media/intelligence-dark.webp", title: "RemoveMacAI", meta: "Apple Intelligence, off", href: "https://github.com/omlahore/RemoveMacAI", alt: "The RemoveMacAI app's Apple Intelligence screen" },
  i,
  j,
  { kind: "image", src: "/media/bodycam-session.webp", title: "bodycam", meta: "the menu bar app", href: "https://github.com/omlahore/bodycam", alt: "A recorded session in the bodycam app" },
  k,
  l,
];
