import { useCallback, useEffect, useRef, useState } from 'react';

/** Wall-clock playback driven by requestAnimationFrame. */
export function usePlayback(duration: number) {
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [rate, setRate] = useState(1);
  const raf = useRef(0);
  const last = useRef(0);

  useEffect(() => {
    if (!playing) return;
    last.current = performance.now();
    const tick = (now: number) => {
      const dt = ((now - last.current) / 1000) * rate;
      last.current = now;
      setTime((prev) => {
        const next = prev + dt;
        if (next >= duration) {
          setPlaying(false);
          return duration;
        }
        return next;
      });
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [playing, rate, duration]);

  // Clamp when the lesson length changes (language switch can retime scenes).
  useEffect(() => {
    setTime((t) => (t > duration ? duration : t));
  }, [duration]);

  const seek = useCallback(
    (t: number) => setTime(Math.max(0, Math.min(duration, t))),
    [duration],
  );
  const toggle = useCallback(() => {
    setPlaying((p) => {
      if (!p && time >= duration - 0.01) setTime(0);
      return !p;
    });
  }, [time, duration]);

  return {
    time,
    playing,
    rate,
    duration,
    setRate,
    setPlaying,
    seek,
    toggle,
    restart: () => {
      setTime(0);
      setPlaying(true);
    },
    skip: (delta: number) => seek(time + delta),
  };
}

/* ------------------------------------------------------------------ */

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false,
  );
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setMatches(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [query]);
  return matches;
}

/** Honoured by every animated component in the app. */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}

export function useDebounced<T>(value: T, delay = 180): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/** rAF-backed pointer parallax, disabled for reduced motion. */
export function useParallax<T extends HTMLElement>(enabled: boolean) {
  const ref = useRef<T | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;
    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      setOffset({
        x: ((e.clientX - rect.left) / rect.width - 0.5) * 2,
        y: ((e.clientY - rect.top) / rect.height - 0.5) * 2,
      });
    };
    const onLeave = () => setOffset({ x: 0, y: 0 });
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    return () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
    };
  }, [enabled]);

  return { ref, offset };
}