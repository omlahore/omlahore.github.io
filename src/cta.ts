import { gsap } from "gsap";

// Contact: a grid that bends around the button like a lens, with a pulse running out
// from the middle every few seconds. Hovering the button sends a bigger one.
export function initCta(reduced: boolean) {
  const section = document.querySelector<HTMLElement>("[data-cta]")!;
  const path = section.querySelector<SVGPathElement>("[data-cta-path]")!;
  const button = section.querySelector<HTMLElement>("[data-cta-button]")!;
  const label = button.querySelector<HTMLElement>(".cta__label")!;

  let W = 0;
  let H = 0;
  let cx = 0;
  let cy = 0;
  let R = 0;
  let cols = 12;
  let rows = 8;
  const wave = { r: -1, a: 0, speed: 9 };
  const lens = { op: 0 };

  const measure = () => {
    W = section.clientWidth;
    H = section.clientHeight;
    cx = W / 2;
    cy = H / 2;
    R = button.offsetWidth / 2;
    cols = W > 767 ? 12 : 6;
    rows = 8;
    path.ownerSVGElement!.setAttribute("viewBox", `0 0 ${W} ${H}`);
    draw();
  };

  const moved = (x: number, y: number) => {
    const dx = x - cx;
    const dy = y - cy;
    const d = Math.hypot(dx, dy) || 1;
    let push = 0;
    const reach = R * 1.9;
    if (d < reach) push += lens.op * (1 - d / reach) * R * 0.32;
    if (wave.r >= 0) push += wave.a * 26 * Math.exp(-(((d - wave.r) / 50) ** 2));
    return [x + (dx / d) * push, y + (dy / d) * push];
  };

  const draw = () => {
    let d = "";
    const step = 24;
    for (let c = 0; c <= cols; c++) {
      const x = (W / cols) * c;
      for (let y = 0; y <= H + step; y += step) {
        const [px, py] = moved(x, Math.min(y, H));
        d += `${y === 0 ? "M" : "L"}${px.toFixed(1)} ${py.toFixed(1)}`;
      }
    }
    for (let r = 0; r <= rows; r++) {
      const y = (H / rows) * r;
      for (let x = 0; x <= W + step; x += step) {
        const [px, py] = moved(Math.min(x, W), y);
        d += `${x === 0 ? "M" : "L"}${px.toFixed(1)} ${py.toFixed(1)}`;
      }
    }
    path.setAttribute("d", d);
  };

  measure();
  new ResizeObserver(measure).observe(section);
  if (reduced) return;

  const pulse = (strength: number, speed: number) => {
    wave.r = R * 0.9;
    wave.a = strength;
    wave.speed = speed;
  };

  const beat = gsap.timeline({ repeat: -1, repeatDelay: 0.4, paused: true });
  beat.fromTo(label, { scale: 0.86 }, { scale: 1.04, duration: 2.2, ease: "power2.in" });
  beat.call(() => pulse(1, 9));
  beat.to(label, { scale: 0.86, duration: 0.18, ease: "power4.out" });

  let hovered = false;
  button.addEventListener("mouseenter", () => {
    hovered = true;
    beat.pause();
    gsap.to(label, { scale: 1.08, duration: 0.6, ease: "expo.out" });
    gsap.to(lens, { op: 1, duration: 1, ease: "expo.out" });
    pulse(3, 18);
  });
  button.addEventListener("mouseleave", () => {
    hovered = false;
    gsap.to(lens, { op: 0, duration: 0.8, ease: "expo.inOut" });
    beat.play(0);
  });

  let visible = false;
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible && !hovered) beat.play();
    else beat.pause();
  }).observe(section);

  gsap.ticker.add(() => {
    if (!visible) return;
    if (wave.r >= 0) {
      wave.r += wave.speed;
      wave.a *= 0.985;
      if (wave.r > Math.hypot(W, H)) wave.r = -1;
    }
    draw();
  });
}
