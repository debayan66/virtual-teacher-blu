import { motion } from 'framer-motion';
import { useMemo } from 'react';
import type { DiagramScene as DiagramSceneData, DiagramNode, Tone } from '../../lib/types';

interface Props {
  scene: DiagramSceneData;
  t: number;
  reduced: boolean;
}

const W = 1600;
const H = 900;
const HW = 176;
const HH = 74;

const TONE: Record<Tone, { stroke: string; fill: string; text: string; glow: string }> = {
  neutral: { stroke: 'rgba(163,184,224,.55)', fill: 'rgba(17,24,39,.92)', text: '#A5B0C5', glow: 'rgba(163,184,224,.3)' },
  focus: { stroke: '#FF7900', fill: 'rgba(8,26,34,.95)', text: '#EAFBFF', glow: 'rgba(255,121,0,.45)' },
  good: { stroke: '#4ADE80', fill: 'rgba(9,26,17,.95)', text: '#DFFBEB', glow: 'rgba(74,222,128,.4)' },
  bad: { stroke: '#FF6B6B', fill: 'rgba(30,12,14,.95)', text: '#FFE3E3', glow: 'rgba(255,107,107,.42)' },
  accent: { stroke: '#93B4FF', fill: 'rgba(22,16,36,.95)', text: '#EDE7FF', glow: 'rgba(77,139,255,.45)' },
};

function toPx(node: DiagramNode) {
  return { cx: (node.x / 100) * W, cy: (node.y / 100) * H };
}

/** Trim a segment between two boxes so the line stops at the borders. */
function trim(a: { cx: number; cy: number }, b: { cx: number; cy: number }) {
  const dx = b.cx - a.cx;
  const dy = b.cy - a.cy;
  const tx = Math.abs(dx) > 0.01 ? HW / Math.abs(dx) : Number.POSITIVE_INFINITY;
  const ty = Math.abs(dy) > 0.01 ? HH / Math.abs(dy) : Number.POSITIVE_INFINITY;
  const t = Math.min(tx, ty);
  return {
    x1: a.cx + dx * t,
    y1: a.cy + dy * t,
    x2: b.cx - dx * t,
    y2: b.cy - dy * t,
  };
}

/**
 * Scene B — living diagram.
 * Nodes, links, labels and packets are revealed by lesson playback time and
 * then keep flowing, so the animation stays in step with the narration.
 */
export function DiagramSceneView({ scene, t, reduced }: Props) {
  const pos = useMemo(() => {
    const map = new Map<string, { cx: number; cy: number }>();
    scene.nodes.forEach((n) => map.set(n.id, toPx(n)));
    return map;
  }, [scene.nodes]);

  const state = useMemo(() => {
    const nodes = new Map<string, Tone | null>();
    const edges = new Set<string>();
    const labels = new Set<string>();
    const marks = new Map<string, Tone>();
    const packets: { edge: string; tone: Tone; label?: string; at: number }[] = [];

    for (const step of scene.steps) {
      if (t < step.at) continue;
      switch (step.action) {
        case 'show-node':
          nodes.set(step.node, null);
          break;
        case 'show-edge':
          edges.add(step.edge);
          break;
        case 'show-label':
          labels.add(step.edge);
          break;
        case 'mark':
          marks.set(step.node, step.tone);
          break;
        case 'packet':
          packets.push({ edge: step.edge, tone: step.tone, label: step.label, at: step.at });
          break;
      }
    }
    return { nodes, edges, labels, marks, packets };
  }, [scene.steps, t]);

  const byId = (id: string) => scene.edges.find((e) => e.id === id);
  const nodeById = (id: string) => scene.nodes.find((n) => n.id === id);

  return (
    <div className="scene scene-diagram">
      <svg viewBox={`0 0 ${W} ${H}`} className="diagram-svg" aria-hidden="true">
        <defs>
          <marker id="ah-neutral" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0 10 5 0 10z" fill="rgba(163,184,224,.75)" />
          </marker>
          <marker id="ah-good" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0 10 5 0 10z" fill="#4ADE80" />
          </marker>
          <marker id="ah-bad" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0 10 5 0 10z" fill="#FF6B6B" />
          </marker>
          <radialGradient id="dg-node-glow">
            <stop offset="0" stopColor="rgba(255,121,0,.5)" />
            <stop offset="1" stopColor="rgba(255,121,0,0)" />
          </radialGradient>
        </defs>

        {/* graph paper inside the stage */}
        <g opacity="0.5">
          {Array.from({ length: 17 }, (_, i) => (
            <line key={`v${i}`} x1={(i * W) / 16} y1="0" x2={(i * W) / 16} y2={H} stroke="rgba(120,160,255,.05)" />
          ))}
          {Array.from({ length: 10 }, (_, i) => (
            <line key={`h${i}`} x1="0" y1={(i * H) / 9} x2={W} y2={(i * H) / 9} stroke="rgba(120,160,255,.05)" />
          ))}
        </g>

        {/* edges */}
        {scene.edges.map((e) => {
          const visible = state.edges.has(e.id);
          const a = pos.get(e.from);
          const b = pos.get(e.to);
          if (!a || !b) return null;
          const seg = trim(a, b);
          const tone = TONE[e.tone];
          return (
            <motion.g key={e.id} initial={false} animate={{ opacity: visible ? 1 : 0 }} transition={{ duration: 0.45 }}>
              <line
                x1={seg.x1}
                y1={seg.y1}
                x2={seg.x2}
                y2={seg.y2}
                stroke={tone.stroke}
                strokeWidth="4"
                strokeDasharray={e.dashed ? '16 14' : undefined}
                markerEnd={`url(#ah-${e.tone === 'bad' ? 'bad' : e.tone === 'good' ? 'good' : 'neutral'})`}
                opacity="0.85"
              />
              {state.labels.has(e.id) && e.label && (
                <motion.g
                  initial={reduced ? false : { opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  style={{ transformOrigin: `${(seg.x1 + seg.x2) / 2}px ${(seg.y1 + seg.y2) / 2}px` }}
                >
                  <rect
                    x={(seg.x1 + seg.x2) / 2 - 96}
                    y={(seg.y1 + seg.y2) / 2 - 26}
                    width="192"
                    height="52"
                    rx="10"
                    fill="rgba(6,10,20,.94)"
                    stroke={tone.stroke}
                    strokeWidth="2"
                  />
                  <text
                    x={(seg.x1 + seg.x2) / 2}
                    y={(seg.y1 + seg.y2) / 2 + 8}
                    textAnchor="middle"
                    className="dg-label"
                    fill={tone.text}
                  >
                    {e.label}
                  </text>
                </motion.g>
              )}
            </motion.g>
          );
        })}

        {/* nodes */}
        {scene.nodes.map((n) => {
          const visible = state.nodes.has(n.id);
          const p = pos.get(n.id);
          if (!p) return null;
          const markTone = state.marks.get(n.id);
          const tone = TONE[markTone ?? n.tone];
          return (
            <motion.g
              key={n.id}
              initial={false}
              animate={{ opacity: visible ? 1 : 0, scale: visible ? 1 : 0.86 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              style={{ transformOrigin: `${p.cx}px ${p.cy}px` }}
            >
              <rect
                x={p.cx - HW - 16}
                y={p.cy - HH - 16}
                width={(HW + 16) * 2}
                height={(HH + 16) * 2}
                rx="26"
                fill={tone.glow}
                opacity={markTone ? 0.5 : 0.16}
              />
              <rect
                x={p.cx - HW}
                y={p.cy - HH}
                width={HW * 2}
                height={HH * 2}
                rx="14"
                fill={tone.fill}
                stroke={tone.stroke}
                strokeWidth="3"
              />
              <rect
                x={p.cx - HW}
                y={p.cy - HH}
                width="7"
                height={HH * 2}
                rx="3.5"
                fill={tone.stroke}
                opacity="0.9"
              />
              <text x={p.cx - HW + 34} y={p.cy - 6} className="dg-node-title" fill={tone.text}>
                {n.label}
              </text>
              {n.sub && (
                <text x={p.cx - HW + 34} y={p.cy + 34} className="dg-node-sub" fill={tone.text} opacity="0.7">
                  {n.sub.toUpperCase()}
                </text>
              )}
              {!reduced && markTone && (
                <motion.rect
                  x={p.cx - HW}
                  y={p.cy - HH}
                  width={HW * 2}
                  height={HH * 2}
                  rx="14"
                  fill="none"
                  stroke={tone.stroke}
                  strokeWidth="3"
                  animate={{ opacity: [0.9, 0.2, 0.9], scale: [1, 1.03, 1] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                  style={{ transformOrigin: `${p.cx}px ${p.cy}px` }}
                />
              )}
            </motion.g>
          );
        })}

        {/* packets */}
        {state.packets.map((pk, i) => {
          const e = byId(pk.edge);
          if (!e) return null;
          const a = pos.get(e.from);
          const b = pos.get(e.to);
          if (!a || !b) return null;
          const seg = trim(a, b);
          const cycle = 2.6;
          const phase = reduced ? 0.5 : ((t - pk.at) % cycle) / cycle;
          const x = seg.x1 + (seg.x2 - seg.x1) * phase;
          const y = seg.y1 + (seg.y2 - seg.y1) * phase;
          const tone = TONE[pk.tone];
          const width = pk.label ? 62 + pk.label.length * 15 : 0;
          return (
            <motion.g
              key={`${pk.edge}-${i}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <g transform={`translate(${x} ${y})`}>
                {pk.label ? (
                  <>
                    <rect x={-width / 2} y="-27" width={width} height="54" rx="27" fill="rgba(6,10,20,.96)" stroke={tone.stroke} strokeWidth="2.5" />
                    <circle cx={-width / 2 + 27} cy="0" r="9" fill={tone.stroke} />
                    <text x="14" y="8" textAnchor="middle" className="dg-packet" fill={tone.text}>
                      {pk.label}
                    </text>
                  </>
                ) : (
                  <>
                    <circle r="17" fill={tone.glow} />
                    <circle r="10" fill={tone.stroke} />
                  </>
                )}
              </g>
            </motion.g>
          );
        })}
      </svg>

      <ul className="diagram-legend">
        {scene.legend.map((l) => (
          <li key={l.label}>
            <span className="legend-swatch" style={{ background: TONE[l.tone].stroke }} />
            {l.label}
          </li>
        ))}
      </ul>
    </div>
  );
}