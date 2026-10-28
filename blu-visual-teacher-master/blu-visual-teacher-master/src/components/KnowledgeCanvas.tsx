import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { usePrefersReducedMotion } from '../lib/playback';

/**
 * Original hero composition: a topic flows into a lesson plan and splits into
 * visuals, audio and captions. Everything is generated SVG — no external art,
 * no remote assets — and all motion stops under prefers-reduced-motion.
 */

const TOPICS = [
  'photosynthesis',
  'FIFO queues',
  'derivative rules',
  'verb tense',
  'tectonic plates',
  'recursion',
];

const DRIFT_NODES = [
  { x: 66, y: 138 },
  { x: 470, y: 176 },
  { x: 96, y: 356 },
  { x: 486, y: 372 },
  { x: 62, y: 470 },
  { x: 500, y: 486 },
];

const OUTPUTS = [
  { id: 'visual', y: 508, title: 'Animated scenes', sub: 'title · diagram · code' },
  { id: 'audio', y: 618, title: 'Narration audio', sub: 'installed device voices' },
  { id: 'captions', y: 728, title: 'Multilingual captions', sub: 'native script rendering' },
];

function VisualGlyph({ reduced }: { reduced: boolean }) {
  const frames = ['title', 'diagram', 'code'] as const;
  const [i, setI] = useState(0);

  useEffect(() => {
    if (reduced) return;
    const t = window.setInterval(() => setI((v) => (v + 1) % frames.length), 2200);
    return () => window.clearInterval(t);
  }, [reduced]);

  const mode = frames[i];
  return (
    <span className="glyph-frame" aria-hidden="true">
      <AnimatePresence mode="wait">
        <motion.svg
          key={mode}
          width="52"
          height="34"
          viewBox="0 0 52 34"
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
        >
          <rect x="0.7" y="0.7" width="50.6" height="32.6" rx="3" fill="rgba(255,121,0,.08)" stroke="rgba(255,121,0,.42)" />
          {mode === 'title' && (
            <>
              <rect x="9" y="12" width="34" height="3.4" rx="1.7" fill="#FF7900" />
              <rect x="14" y="19" width="24" height="2.4" rx="1.2" fill="rgba(244,247,255,.5)" />
            </>
          )}
          {mode === 'diagram' && (
            <>
              <circle cx="14" cy="17" r="4" fill="none" stroke="#FF7900" strokeWidth="1.6" />
              <circle cx="38" cy="10" r="3.4" fill="none" stroke="#173B8F" strokeWidth="1.6" />
              <circle cx="38" cy="25" r="3.4" fill="none" stroke="#2563EB" strokeWidth="1.6" />
              <path d="M18 16 34 11M18 19l16 5" stroke="rgba(244,247,255,.45)" strokeWidth="1.3" />
            </>
          )}
          {mode === 'code' && (
            <>
              <rect x="9" y="9" width="22" height="2.6" rx="1.3" fill="#2563EB" />
              <rect x="14" y="15" width="26" height="2.6" rx="1.3" fill="rgba(244,247,255,.55)" />
              <rect x="14" y="21" width="16" height="2.6" rx="1.3" fill="rgba(255,121,0,.75)" />
            </>
          )}
        </motion.svg>
      </AnimatePresence>
    </span>
  );
}

function CaptionGlyph({ reduced }: { reduced: boolean }) {
  const langs = ['EN', 'हिन्दी', 'Español'];
  const [i, setI] = useState(0);
  useEffect(() => {
    if (reduced) return;
    const t = window.setInterval(() => setI((v) => (v + 1) % langs.length), 1800);
    return () => window.clearInterval(t);
  }, [reduced]);

  return (
    <span className="glyph-caption" aria-hidden="true">
      <span className="glyph-caption-line" />
      <span className="glyph-caption-line short" />
      <AnimatePresence mode="wait">
        <motion.b
          key={langs[i]}
          className="script-label"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.26 }}
        >
          {langs[i]}
        </motion.b>
      </AnimatePresence>
    </span>
  );
}

function AudioGlyph({ reduced }: { reduced: boolean }) {
  return (
    <span className={reduced ? 'glyph-audio' : 'glyph-audio is-live'} aria-hidden="true">
      <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#173B8F" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11.2 5.2 6.6 9.2H3.4v5.6h3.2l4.6 4z" />
        <path className="arc a1" d="M15 9.4a3.6 3.6 0 0 1 0 5.2" />
        <path className="arc a2" d="M17.6 7a7 7 0 0 1 0 10" />
      </svg>
    </span>
  );
}

export function KnowledgeCanvas() {
  const reduced = usePrefersReducedMotion();
  const [topicIndex, setTopicIndex] = useState(0);

  useEffect(() => {
    if (reduced) return;
    const t = window.setInterval(() => setTopicIndex((v) => (v + 1) % TOPICS.length), 3400);
    return () => window.clearInterval(t);
  }, [reduced]);

  return (
    <svg
      className="knowledge-canvas"
      viewBox="0 0 560 780"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="kc-line" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FF7900" stopOpacity="0.9" />
          <stop offset="1" stopColor="#2563EB" stopOpacity="0.7" />
        </linearGradient>
        <radialGradient id="kc-core" cx="50%" cy="45%">
          <stop offset="0" stopColor="#2563EB" stopOpacity="0.55" />
          <stop offset="1" stopColor="#2563EB" stopOpacity="0.06" />
        </radialGradient>
        <linearGradient id="kc-chip" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="rgba(255,121,0,.14)" />
          <stop offset="1" stopColor="rgba(37,99,235,.14)" />
        </linearGradient>
      </defs>

      {/* --- ambient topic nodes ------------------------------------------ */}
      <g className="kc-drift">
        {DRIFT_NODES.map((n, i) => (
          <g key={i}>
            <circle cx={n.x} cy={n.y} r="4.5" fill="rgba(100,116,139,.45)" />
            <circle cx={n.x} cy={n.y} r="11" fill="none" stroke="rgba(100,116,139,.18)" />
          </g>
        ))}
        <path
          d="M66 138 96 356M470 176 486 372M96 356 62 470M486 372 500 486M66 138 470 176M62 470 500 486"
          stroke="rgba(140,170,230,.16)"
          strokeWidth="1"
          strokeDasharray="4 7"
        />
      </g>

      {/* --- input --------------------------------------------------------- */}
      <g className="kc-input">
        <rect x="120" y="24" width="320" height="62" rx="8" fill="url(#kc-chip)" stroke="rgba(255,121,0,.42)" />
        <text x="144" y="50" className="kc-micro" fill="rgba(165,176,197,.9)">
          YOUR TOPIC
        </text>
        <text x="144" y="72" className="kc-topic" fill="#171717">
          {reduced ? TOPICS[0] : TOPICS[topicIndex]}
        </text>
        <circle cx="418" cy="55" r="6" fill="#FF7900" />
        <circle cx="418" cy="55" r="11" fill="none" stroke="rgba(255,121,0,.4)" />
      </g>

      {/* --- flow into the planner ---------------------------------------- */}
      <path d="M280 86 V 190" stroke="url(#kc-line)" strokeWidth="2" fill="none" />
      <path
        className={reduced ? undefined : 'kc-dash'}
        d="M280 86 V 190"
        stroke="rgba(255,121,0,.85)"
        strokeWidth="2.4"
        strokeDasharray="10 14"
        fill="none"
      />

      {/* --- planner core -------------------------------------------------- */}
      <g className="kc-hub">
        <circle cx="280" cy="250" r="86" fill="url(#kc-core)" />
        <circle
          className={reduced ? undefined : 'kc-ring'}
          cx="280"
          cy="250"
          r="80"
          fill="none"
          stroke="rgba(255,121,0,.4)"
          strokeWidth="1.4"
          strokeDasharray="6 12"
        />
        <circle cx="280" cy="250" r="62" fill="rgba(9,14,26,.86)" stroke="rgba(37,99,235,.55)" strokeWidth="1.6" />
        <text x="280" y="243" textAnchor="middle" className="kc-micro" fill="rgba(165,176,197,.95)">
          LESSON PLAN
        </text>
        <text x="280" y="268" textAnchor="middle" className="kc-hub-title" fill="#171717">
          4 scenes · 51s
        </text>
      </g>

      {/* --- bus to the three media --------------------------------------- */}
      <path d="M280 312 V 440 H 492 V 728" stroke="rgba(37,99,235,.55)" strokeWidth="1.8" fill="none" />
      <path
        d="M492 508 H 460M492 618 H 460M492 728 H 460"
        stroke="rgba(37,99,235,.55)"
        strokeWidth="1.8"
      />

      {OUTPUTS.map((o) => (
        <g key={o.id}>
          <rect
            x="40"
            y={o.y - 40}
            width="420"
            height="80"
            rx="9"
            fill="rgba(17,24,39,.72)"
            stroke="rgba(100,116,139,.2)"
          />
          <foreignObject x="52" y={o.y - 32} width="396" height="64">
            <div className="kc-out">
              {o.id === 'visual' && <VisualGlyph reduced={reduced} />}
              {o.id === 'audio' && <AudioGlyph reduced={reduced} />}
              {o.id === 'captions' && <CaptionGlyph reduced={reduced} />}
              <span className="kc-out-text">
                <b>{o.title}</b>
                <i>{o.sub}</i>
              </span>
            </div>
          </foreignObject>
        </g>
      ))}

      <Packs reduced={reduced} />
    </svg>
  );
}

function Packs({ reduced }: { reduced: boolean }) {
  return (
    <>
      {reduced ? null : (
        <g>
          {[0, 1, 2].map((i) => (
            <motion.rect
              key={`a-${i}`}
              width="7"
              height="7"
              rx="1.5"
              fill="#FF7900"
              animate={{ x: [280, 280], y: [96, 190], opacity: [0, 1, 0] }}
              transition={{ duration: 1.6, delay: i * 0.5, repeat: Infinity, ease: 'linear' }}
            />
          ))}
          {OUTPUTS.map((o, i) => (
            <motion.rect
              key={o.id}
              width="7"
              height="7"
              rx="1.5"
              fill={o.id === 'audio' ? '#173B8F' : '#2563EB'}
              animate={{
                x: [280, 488, 466],
                y: [312, 440, o.y],
                opacity: [0, 1, 1, 0],
              }}
              transition={{ duration: 2.6, delay: 0.4 + i * 0.75, repeat: Infinity, ease: 'linear' }}
            />
          ))}
        </g>
      )}
    </>
  );
}