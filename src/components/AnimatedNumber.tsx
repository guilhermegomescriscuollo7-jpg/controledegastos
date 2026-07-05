"use client";

import { useEffect, useRef, useState } from "react";
import { BRL } from "@/lib/categories";

/**
 * Valor em reais que "sobe" da última cifra até a nova quando muda
 * (ex.: ao trocar o mês). Respeita prefers-reduced-motion.
 */
export function AnimatedNumber({
  value,
  className,
  style,
  duration = 700,
}: {
  value: number;
  className?: string;
  style?: React.CSSProperties;
  duration?: number;
}) {
  const [display, setDisplay] = useState(0);
  const fromRef = useRef(0);

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      fromRef.current = value;
      setDisplay(value);
      return;
    }

    const from = fromRef.current;
    const start = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      setDisplay(from + (value - from) * eased);
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        fromRef.current = value;
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return (
    <span className={className} style={style}>
      {BRL.format(display)}
    </span>
  );
}
