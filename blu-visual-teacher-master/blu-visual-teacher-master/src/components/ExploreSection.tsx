import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from './Icon';
import { usePrefersReducedMotion } from '../lib/playback';
import { useStore } from '../lib/store';
import type { Level } from '../lib/types';

interface Example {
  id: string;
  index: string;
  title: string;
  blurb: string;
  topic: string;
  level: Level;
  minutes: string;
  tags: string[];
  visual: 'topology' | 'math' | 'trace';
}

const EXAMPLES: Example[] = [
  {
    id: 'network',
    index: '01',
    title: 'Network topology',
    blurb: 'Watch packets cross a firewall, split into allowed and blocked paths.',
    topic: 'How a firewall protects a network',
    level: 'intermediate',
    minutes: '1',
    tags: ['diagram scene', 'sample lesson'],
    visual: 'topology',
  },
  {
    id: 'math',
    index: '02',
    title: 'Mathematical visualisation',
    blurb: 'A curve, a moving tangent, and the derivative appearing under your eyes.',
    topic: 'The derivative, visualised',
    level: 'beginner',
    minutes: '3',
    tags: ['title + diagram', 'plot'],
    visual: 'math',
  },
  {
    id: 'trace',
    index: '03',
    title: 'Code execution trace',
    blurb: 'Step through a recursive call stack line by line with live output.',
    topic: 'Recursion, traced step by step',
    level: 'advanced',
    minutes: '5',
    tags: ['code scene', 'annotations'],
    visual: 'trace',
  },
];

/* ------------------------------ visuals -------------------------------- */

function TopologyVisual({ reduced }: { reduced: boolean }) {
  const nodes = [
    { x: 22, y: 54 },
    { x: 74, y: 30 },
    { x: 74, y: 78 },
    { x: 126, y: 18 },
    { x: 126, y: 90 },
  ];
  const edges = [
    'M28 54 L68 33',
    'M28 54 L68 76',
    'M80 33 L120 19',
    'M80 76 L120 89',
  ];
  return (
    <svg viewBox="0 0 148 108" className="mini-svg" aria-hidden="true">
      {edges.map((d, i) => (
        <path key={i} d={d} stroke="rgba(100,116,139,.34)" strokeWidth="1.2" strokeDasharray="3 5" />
      ))}
      <path d="M80 33 L120 19" stroke="rgba(74,222,128,.7)" strokeWidth="1.6" />
      <path d="M80 76 L120 89" stroke="rgba(255,107,107,.7)" strokeWidth="1.6" strokeDasharray="4 4" />
      {nodes.map((n, i) => (
        <g key={i}>
          <circle cx={n.x} cy={n.y} r={i === 1 ? 7 : 5.5} fill="#FFFFFF" stroke={i === 1 ? '#FF7900' : 'rgba(100,116,139,.7)'} strokeWidth="1.6" />
          {i === 1 && <circle cx={n.x} cy={n.y} r="11" fill="none" stroke="rgba(255,121,0,.35)" />}
        </g>
      ))}
      {!reduced && (
        <>
          <motion.circle
            r="3"
            fill="#FF7900"
            initial={{ cx: 28, cy: 54, opacity: 0 }}
            animate={{ cx: [28, 74, 126], cy: [54, 30, 18], opacity: [0, 1, 1, 0] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'linear', times: [0, 0.4, 0.8, 1] }}
          />
          <motion.circle
            r="3"
            fill="#DC2626"
            initial={{ cx: 28, cy: 54, opacity: 0 }}
            animate={{ cx: [28, 74], cy: [54, 78], opacity: [0, 1, 1, 0] }}
            transition={{ duration: 1.7, repeat: Infinity, ease: 'linear', delay: 0.7, times: [0, 0.5, 0.85, 1] }}
          />
        </>
      )}
    </svg>
  );
}

function MathVisual({ reduced }: { reduced: boolean }) {
  // y_svg = 84 - (0.012*(x-20)^2 + 14), sampled so tangents are exact.
  const samples = useMemo(() => {
    const out: { x: number; y: number; m: number }[] = [];
    for (let i = 0; i <= 40; i++) {
      const x = i * 1.5;
      const f = 0.012 * (x - 20) ** 2 + 14;
      const m = -0.024 * (x - 20);
      out.push({ x, y: 84 - f, m });
    }
    return out;
  }, []);

  const path = useMemo(
    () => samples.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' '),
    [samples],
  );

  const tangents = samples.map((p) => ({
    x1: p.x - 13,
    y1: p.y + 13 * p.m,
    x2: p.x + 13,
    y2: p.y - 13 * p.m,
  }));

  const key = {
    cx: samples.map((p) => p.x),
    cy: samples.map((p) => p.y),
    ...Object.fromEntries(
      ['x1', 'y1', 'x2', 'y2'].map((k) => [
        k,
        tangents.map((t) => t[k as 'x1' | 'y1' | 'x2' | 'y2']),
      ]),
    ),
  } as Record<string, number[]>;

  return (
    <svg viewBox="-2 4 66 86" className="mini-svg" aria-hidden="true">
      <path d="M0 84 H62M0 84 V6" stroke="rgba(100,116,139,.32)" strokeWidth="1" />
      <path d={path} fill="none" stroke="#FF7900" strokeWidth="1.8" strokeLinecap="round" />
      <motion.line
        stroke="#173B8F"
        strokeWidth="1.4"
        strokeDasharray="3 3"
        initial={
          reduced
            ? undefined
            : { x1: tangents[0].x1, y1: tangents[0].y1, x2: tangents[0].x2, y2: tangents[0].y2 }
        }
        animate={reduced ? { x1: tangents[16].x1, y1: tangents[16].y1, x2: tangents[16].x2, y2: tangents[16].y2 } : key}
        transition={reduced ? undefined : { duration: 4.5, repeat: Infinity, ease: 'linear' }}
      />
      <motion.circle
        r="3"
        fill="#FFFFFF"
        stroke="#FF7900"
        strokeWidth="1.6"
        initial={reduced ? undefined : { cx: samples[0].x, cy: samples[0].y }}
        animate={reduced ? { cx: samples[16].x, cy: samples[16].y } : { cx: key.cx, cy: key.cy }}
        transition={reduced ? undefined : { duration: 4.5, repeat: Infinity, ease: 'linear' }}
      />
    </svg>
  );
}

const TRACE_LINES = [
  { t: 'function fib(n) {', ok: true },
  { t: '  if (n < 2) return n;', ok: true },
  { t: '  return fib(n-1) +', ok: true },
  { t: '         fib(n-2);', ok: true },
  { t: '}', ok: true },
];

function TraceVisual({ reduced }: { reduced: boolean }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (reduced) return;
    const t = window.setInterval(() => setStep((s) => (s + 1) % TRACE_LINES.length), 900);
    return () => window.clearInterval(t);
  }, [reduced]);

  return (
    <div className="mini-trace" aria-hidden="true">
      {TRACE_LINES.map((l, i) => (
        <div key={i} className={i === step ? 'trace-line is-on' : 'trace-line'}>
          <span className="trace-n">{i + 1}</span>
          <code>{l.t}</code>
        </div>
      ))}
      <div className="trace-out">
        <span className="dot dot-ok" />
        <span>→ fib(5) = 5 · {TRACE_LINES[step].t.trim()}</span>
      </div>
    </div>
  );
}

/* ------------------------------ section -------------------------------- */

export function ExploreSection({
  onUse,
}: {
  onUse: (e: { topic: string; level: Level; minutes: string }) => void;
}) {
  const reduced = usePrefersReducedMotion();
  const { openLesson, notify } = useStore();
  const navigate = useNavigate();

  return (
    <section className="explore" aria-labelledby="explore-title">
      <div className="section-head">
        <div>
          <div className="section-kicker">
            <span className="kicker-line" />
            <span className="micro">Explore the possibilities</span>
          </div>
          <h2 className="section-title" id="explore-title">
            Three ways a topic becomes a lesson
          </h2>
          <p className="lede" style={{ marginTop: 12 }}>
            Each example uses a different scene design. Pick one to load it straight into the
            console above.
          </p>
        </div>
        <button className="btn btn-ghost" onClick={() => navigate('/languages')}>
          See language coverage
          <Icon name="arrowRight" size={16} />
        </button>
      </div>

      <div className="example-grid">
        {EXAMPLES.map((ex, i) => (
          <motion.article
            key={ex.id}
            className="example cut-br"
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="example-visual">
              {ex.visual === 'topology' && <TopologyVisual reduced={reduced} />}
              {ex.visual === 'math' && <MathVisual reduced={reduced} />}
              {ex.visual === 'trace' && <TraceVisual reduced={reduced} />}
              <span className="example-index micro">{ex.index}</span>
            </div>

            <div className="example-body">
              <h3>{ex.title}</h3>
              <p>{ex.blurb}</p>
              <div className="example-tags">
                {ex.tags.map((t) => (
                  <span key={t} className="micro">
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <div className="example-actions">
              <button
                className="btn btn-sm"
                onClick={() => {
                  onUse({ topic: ex.topic, level: ex.level, minutes: ex.minutes });
                  notify('info', `Console filled with “${ex.topic}”.`);
                }}
              >
                <Icon name="plus" size={14} />
                Use this topic
              </button>
              {ex.id === 'network' && (
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => {
                    openLesson('sample-firewall');
                    navigate('/studio');
                  }}
                >
                  <Icon name="play" size={13} />
                  Open sample
                </button>
              )}
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
}