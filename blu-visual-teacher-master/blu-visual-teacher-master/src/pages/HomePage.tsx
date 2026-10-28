import { motion } from 'framer-motion';
import { useState } from 'react';
import { CreationConsole } from '../components/CreationConsole';
import { ExploreSection } from '../components/ExploreSection';
import { KnowledgeCanvas } from '../components/KnowledgeCanvas';
import { Icon } from '../components/Icon';
import { useStore } from '../lib/store';
import type { Level } from '../lib/types';

const STATS = [
  { k: 'Scene designs', v: '3', note: 'title · diagram · code' },
  { k: 'Languages', v: '20', note: 'native script captions' },
  { k: 'Internet needed', v: '0', note: 'once assets are installed' },
];

export function HomePage() {
  const [topic, setTopic] = useState('How a firewall protects a network');
  const [level, setLevel] = useState<Level>('intermediate');
  const [minutes, setMinutes] = useState('1');
  const { narration, captions, setNarration, setCaptions } = useStore();

  return (
    <div className="page home">
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-grid">
          <div className="hero-copy">
            <motion.span
              className="eyebrow"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <span className="dot dot-live" />
              Offline-first learning studio
              <span className="eyebrow-sep" />
              <span>runs on your machine</span>
            </motion.span>

            <motion.h1
              id="hero-title"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
            >
              Make Knowledge
              <br />
              <span className="grad-text">Come Alive.</span>
            </motion.h1>

            <motion.p
              className="lede"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.14 }}
            >
              Turn any topic into an animated lesson, narrated in your language. Create, explore,
              and learn — even offline.
            </motion.p>

            <motion.ul
              className="hero-stats"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.22 }}
            >
              {STATS.map((s) => (
                <li key={s.k}>
                  <b>{s.v}</b>
                  <span>
                    {s.k}
                    <i>{s.note}</i>
                  </span>
                </li>
              ))}
            </motion.ul>

            <motion.div
              className="console-wrap"
              initial={{ opacity: 0, y: 26 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <CreationConsole
                topic={topic}
                onTopic={setTopic}
                level={level}
                onLevel={setLevel}
                minutes={minutes}
                onMinutes={setMinutes}
                narration={narration}
                onNarration={setNarration}
                captions={captions}
                onCaptions={setCaptions}
              />
            </motion.div>
          </div>

          <aside className="hero-side" aria-label="Knowledge composition">
            <div className="hero-side-head">
              <span className="micro">Knowledge pipeline</span>
              <span className="micro" style={{ letterSpacing: '0.06em' }}>
                topic → scenes · audio · captions
              </span>
            </div>
            <div className="hero-visual">
              <KnowledgeCanvas />
            </div>
            <p className="hero-side-note">
              <Icon name="info" size={14} />
              Illustrative composition — the real pipeline runs on your local backend.
            </p>
          </aside>
        </div>
      </section>

      <ExploreSection
        onUse={({ topic: t, level: l, minutes: m }) => {
          setTopic(t);
          setLevel(l);
          setMinutes(m);
          document.getElementById('topic')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          window.setTimeout(() => document.getElementById('topic')?.focus(), 420);
        }}
      />
    </div>
  );
}