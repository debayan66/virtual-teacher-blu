import { motion } from 'framer-motion';
import { useRef, useState } from 'react';
import { Icon } from '../Icon';
import type { IconName } from '../Icon';
import { cx } from '../ui';
import { sceneStarts, totalDuration } from '../../lib/sampleLesson';
import type { Lesson, SceneKind } from '../../lib/types';

const KIND_ICON: Record<SceneKind, IconName> = {
  title: 'spark',
  diagram: 'grid',
  code: 'command',
};

const KIND_TONE: Record<SceneKind, string> = {
  title: 'linear-gradient(135deg, rgba(85,230,255,.34), rgba(109,124,255,.22))',
  diagram: 'linear-gradient(135deg, rgba(109,124,255,.34), rgba(167,139,250,.22))',
  code: 'linear-gradient(135deg, rgba(167,139,250,.34), rgba(255,138,107,.22))',
};

interface Props {
  lesson: Lesson;
  time: number;
  onSeek: (t: number) => void;
  narrationLang: string;
  captionLang: string;
}

function fmt(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, '0')}`;
}

export function Timeline({ lesson, time, onSeek, narrationLang, captionLang }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const starts = sceneStarts(lesson);
  const total = totalDuration(lesson);
  const pct = (t: number) => `${(t / total) * 100}%`;

  const seekFromEvent = (clientX: number) => {
    const el = trackRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    onSeek(ratio * total);
  };

  const ticks: number[] = [];
  const step = total > 60 ? 15 : 10;
  for (let t = 0; t <= total; t += step) ticks.push(t);

  return (
    <div className="timeline">
      <div className="tl-head">
        <span className="micro">Timeline</span>
        <span className="tl-head-meta">
          {lesson.scenes.length} scenes · {fmt(total)} · drag to scrub
        </span>
      </div>

      <div
        className="tl-body"
        ref={trackRef}
        role="slider"
        tabIndex={0}
        aria-label="Lesson timeline"
        aria-valuemin={0}
        aria-valuemax={Math.round(total)}
        aria-valuenow={Math.round(time)}
        aria-valuetext={`${fmt(time)} of ${fmt(total)}`}
        onPointerDown={(e) => {
          setDragging(true);
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
          seekFromEvent(e.clientX);
        }}
        onPointerMove={(e) => dragging && seekFromEvent(e.clientX)}
        onPointerUp={() => setDragging(false)}
        onPointerCancel={() => setDragging(false)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') onSeek(time + 1);
          if (e.key === 'ArrowLeft') onSeek(time - 1);
        }}
      >
        <div className="tl-ruler" aria-hidden="true">
          {ticks.map((t) => (
            <span key={t} className="tl-tick" style={{ left: pct(t) }}>
              <i />
              {fmt(t)}
            </span>
          ))}
        </div>

        <div className="tl-scenes">
          {lesson.scenes.map((s, i) => {
            const start = starts[i];
            const active = time >= start && time < start + s.duration;
            return (
              <button
                key={s.id}
                type="button"
                className={cx('tl-scene', active && 'is-active')}
                style={{ width: `${(s.duration / total) * 100}%`, background: KIND_TONE[s.kind] }}
                onClick={() => onSeek(start + 0.01)}
                title={`${s.title} · ${fmt(s.duration)}`}
                aria-current={active || undefined}
              >
                <span className="tl-scene-top">
                  <Icon name={KIND_ICON[s.kind]} size={13} />
                  <b>{String(i + 1).padStart(2, '0')}</b>
                </span>
                <span className="tl-scene-title">{s.title}</span>
                <span className="tl-scene-dur">{fmt(s.duration)}</span>
              </button>
            );
          })}
        </div>

        <div className="tl-lane tl-lane-narr" aria-hidden="true">
          <span className="tl-lane-tag">Narration · {narrationLang.toUpperCase()}</span>
          {lesson.scenes.map((s, i) => {
            const text = s.narration[narrationLang] ?? s.narration.en;
            const missing = !s.narration[narrationLang];
            return (
              <span
                key={s.id}
                className={cx('tl-lane-seg', missing && 'is-missing')}
                style={{
                  left: pct(starts[i]),
                  width: `${(s.duration / total) * 100}%`,
                }}
              >
                {missing ? 'no script in this language' : text}
              </span>
            );
          })}
        </div>

        <div className="tl-lane tl-lane-cap" aria-hidden="true">
          <span className="tl-lane-tag">Captions · {captionLang.toUpperCase()}</span>
          {lesson.scenes.map((s, i) => {
            const cues = s.captions[captionLang] ?? s.captions.en;
            const dur = s.duration / cues.length;
            return cues.map((_, ci) => (
              <span
                key={`${s.id}-${ci}`}
                className="tl-cue"
                style={{
                  left: pct(starts[i] + ci * dur),
                  width: `${(dur / total) * 100}%`,
                }}
              />
            ));
          })}
        </div>

        <motion.div
          className="tl-playhead"
          style={{ left: pct(time) }}
          transition={{ duration: 0 }}
        >
          <span className="tl-playhead-head" />
          <span className="tl-playhead-time">{fmt(time)}</span>
        </motion.div>
      </div>
    </div>
  );
}