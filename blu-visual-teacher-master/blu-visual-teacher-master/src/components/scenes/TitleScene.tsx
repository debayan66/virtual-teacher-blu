import { motion } from 'framer-motion';
import type { TitleScene as TitleSceneData } from '../../lib/types';

interface Props {
  scene: TitleSceneData;
  t: number;
  reduced: boolean;
}

const SHAPES = [
  { x: 84, y: 20, s: 1, d: 0 },
  { x: 74, y: 74, s: 0.7, d: 1.4 },
  { x: 93, y: 58, s: 0.55, d: 2.6 },
  { x: 62, y: 14, s: 0.5, d: 3.4 },
];

/**
 * Scene A — cinematic title card.
 * Large expressive typography over a restrained geometric field; every reveal
 * is triggered by lesson playback time, not by decorative looping animation.
 */
export function TitleSceneView({ scene, t, reduced }: Props) {
  const lines = scene.headline.split('\n');
  const show = (at: number) => t >= at && !reduced;
  const settled = t >= 1.1 || reduced;

  return (
    <div className="scene scene-title">
      <div className="scene-title-bg" aria-hidden="true">
        {!reduced &&
          SHAPES.map((s, i) => (
            <motion.span
              key={i}
              className="title-shape"
              style={{ left: `${s.x}%`, top: `${s.y}%`, scale: s.s }}
              animate={{ y: [0, -18, 0], rotate: [0, 12, 0] }}
              transition={{ duration: 14, delay: s.d, repeat: Infinity, ease: 'easeInOut' }}
            />
          ))}
        <span className="title-glow" />
        <span className="title-rule" />
      </div>

      <div className="scene-title-inner">
        <motion.div
          className="scene-eyebrow"
          initial={reduced ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.04, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="scene-eyebrow-dot" />
          {scene.eyebrow}
        </motion.div>

        <h2 className="scene-headline">
          {lines.map((line, i) => (
            <motion.span
              key={line}
              className="scene-headline-line"
              initial={reduced ? false : { opacity: 0, y: 26, filter: 'blur(7px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{
                duration: 0.75,
                delay: 0.14 + i * 0.13,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              {line}
            </motion.span>
          ))}
        </h2>

        <motion.p
          className="scene-sub"
          initial={false}
          animate={{ opacity: show(1.5) ? 1 : 0, y: show(1.5) ? 0 : 12 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        >
          {scene.sub}
        </motion.p>

        <ul className="scene-points">
          {scene.points.map((p, i) => (
            <motion.li
              key={p}
              initial={false}
              animate={{
                opacity: show(2.1 + i * 0.45) ? 1 : 0,
                x: show(2.1 + i * 0.45) ? 0 : -14,
              }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <span className="point-index">{String(i + 1).padStart(2, '0')}</span>
              {p}
            </motion.li>
          ))}
        </ul>
      </div>

      <div className="scene-corner-mark" aria-hidden="true">
        {settled && <span />}
      </div>
    </div>
  );
}