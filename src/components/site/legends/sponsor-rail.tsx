"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import styles from "./legends-site.module.css";

export function SponsorRail({ children }: { children: ReactNode }) {
  const rail = useRef<HTMLDivElement>(null);
  const [overflow, setOverflow] = useState(false);
  const [paused, setPaused] = useState(false);
  const [interacting, setInteracting] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(true);

  useEffect(() => {
    const element = rail.current;
    if (!element) return;
    const measure = () => setOverflow(element.scrollWidth > element.clientWidth + 1);
    const resize = new ResizeObserver(measure);
    resize.observe(element);
    for (const child of element.children) resize.observe(child);
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => setReducedMotion(motion.matches);
    motion.addEventListener("change", updateMotion);
    measure();
    updateMotion();
    return () => { resize.disconnect(); motion.removeEventListener("change", updateMotion); };
  }, [children]);

  const advance = useCallback((direction: number) => {
    const element = rail.current;
    if (!element) return;
    const item = element.firstElementChild as HTMLElement | null;
    const step = (item?.offsetWidth ?? 150) + (parseFloat(getComputedStyle(element).columnGap) || 0);
    const end = element.scrollWidth - element.clientWidth;
    const left = direction > 0 && element.scrollLeft >= end - 2 ? 0
      : direction < 0 && element.scrollLeft <= 2 ? end : element.scrollLeft + direction * step;
    element.scrollTo({ left, behavior: reducedMotion ? "instant" : "smooth" });
  }, [reducedMotion]);

  useEffect(() => {
    if (!overflow || paused || interacting || reducedMotion) return;
    const timer = window.setInterval(() => advance(1), 3000);
    return () => window.clearInterval(timer);
  }, [overflow, paused, interacting, reducedMotion, advance]);

  return <div role="region" aria-label="Team sponsors"
    onMouseEnter={() => setInteracting(true)} onMouseLeave={() => setInteracting(false)}
    onFocus={() => setInteracting(true)} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setInteracting(false); }}
    onTouchStart={() => setPaused(true)}>
    <div ref={rail} className={styles.sponsorLogos} tabIndex={overflow ? 0 : undefined} aria-label="Sponsor logos; swipe or use arrow keys to browse">
      {children}
    </div>
    {overflow && <div className={styles.sponsorControls}>
      <button type="button" onClick={() => advance(-1)} aria-label="Previous sponsors">← Previous</button>
      {!reducedMotion && <button type="button" onClick={() => setPaused((value) => !value)} aria-pressed={paused}>{paused ? "Play rotation" : "Pause rotation"}</button>}
      <button type="button" onClick={() => advance(1)} aria-label="Next sponsors">Next →</button>
    </div>}
  </div>;
}
