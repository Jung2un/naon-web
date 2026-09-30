"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowUp } from "lucide-react";

export function BackToTop() {
  const [atBottom, setAtBottom] = useState(false);

  useEffect(() => {
    let frame = 0;
    function measure() {
      frame = 0;
      const bottom = document.documentElement.scrollHeight - window.innerHeight;
      setAtBottom(bottom > 2 && window.scrollY >= bottom - 2);
    }
    function schedule() {
      if (!frame) frame = window.requestAnimationFrame(measure);
    }
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    const observer = new ResizeObserver(schedule);
    observer.observe(document.body);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      observer.disconnect();
    };
  }, []);

  if (!atBottom) return null;

  return createPortal(
    <button
      type="button"
      aria-label="맨 위로 이동"
      onClick={() => {
        document.getElementById("main-content")?.focus({ preventScroll: true });
        window.scrollTo({
          top: 0,
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
            .matches
            ? "instant"
            : "smooth",
        });
      }}
      className="fixed bottom-[calc(var(--bottom-nav-h)+1rem)] right-4 z-30 inline-flex size-12 items-center justify-center rounded-full border border-line bg-surface text-ink shadow-overlay transition-colors hover:bg-primary-soft lg:right-6"
    >
      <ArrowUp className="size-5" aria-hidden />
    </button>,
    document.body,
  );
}
