import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { Button, Pill, StateBlock, cx } from '../components/ui';
import { totalDuration } from '../lib/sampleLesson';
import { useStore } from '../lib/store';
import type { Lesson } from '../lib/types';

function LessonCard({ lesson, index }: { lesson: Lesson; index: number }) {
  const { openLesson } = useStore();
  const navigate = useNavigate();
  const total = totalDuration(lesson);

  return (
    <motion.article
      className="lib-card cut-br"
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.06, 0.3), ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="lib-thumb">
        <span className="lib-thumb-glow" />
        <span className="micro lib-thumb-kicker">Scene 01 · title</span>
        <b>{lesson.title}</b>
        <div className="lib-thumb-strip">
          {lesson.scenes.map((s) => (
            <span key={s.id} className={cx('thumb-chip', `is-${s.kind}`)}>
              {s.kind}
            </span>
          ))}
        </div>
      </div>

      <div className="lib-card-body">
        <div className="lib-card-head">
          <h3>{lesson.title}</h3>
          {lesson.sample ? (
            <Pill tone="warn" icon="info">
              Sample
            </Pill>
          ) : (
            <Pill tone="ok" icon="check">
              Generated
            </Pill>
          )}
        </div>
        <p className="lib-card-topic">{lesson.topic}</p>
        <div className="lib-card-meta">
          <span>{lesson.level}</span>
          <span>{total}s</span>
          <span>{lesson.scenes.length} scenes</span>
          <span>{lesson.languages.length} languages</span>
        </div>
        {lesson.sampleNote && <p className="lib-card-note">{lesson.sampleNote}</p>}
      </div>

      <div className="lib-card-actions">
        <Button
          variant="primary"
          icon="play"
          onClick={() => {
            openLesson(lesson.id);
            navigate('/studio');
          }}
        >
          Open in studio
        </Button>
        <Button
          icon="film"
          onClick={() => {
            openLesson(lesson.id);
            navigate('/export');
          }}
        >
          Export
        </Button>
      </div>
    </motion.article>
  );
}

export function LibraryPage() {
  const { lessons, backend, backendError, probe, notify } = useStore();
  const navigate = useNavigate();

  const generated = lessons.filter((l) => !l.sample);
  const samples = lessons.filter((l) => l.sample);

  return (
    <div className="page library">
      <header className="section-head">
        <div>
          <div className="section-kicker">
            <span className="kicker-line" />
            <span className="micro">Lesson library</span>
          </div>
          <h1 className="section-title">Everything you have generated</h1>
          <p className="lede" style={{ marginTop: 12 }}>
            Generated lessons live here. The shipped sample stays available so the studio is never
            an empty shell.
          </p>
        </div>
        <Button variant="primary" icon="plus" onClick={() => navigate('/')}>
          Create a lesson
        </Button>
      </header>

      {backend === 'offline' && (
        <div className="lib-banner" role="status">
          <Icon name="cloudOff" size={17} />
          <div>
            <b>Local backend not reachable</b>
            <p>
              {backendError?.message ??
                'Generation, language preparation and export need the local service.'}{' '}
              Everything else — the studio, scene playback, captions and language switching — runs
              fully offline.
            </p>
          </div>
          <Button size="sm" icon="refresh" onClick={async () => { await probe(); notify('info', 'Backend re-probed.'); }}>
            Retry
          </Button>
        </div>
      )}

      <section aria-labelledby="generated-title">
        <div className="lib-section-head">
          <h2 id="generated-title">Generated lessons</h2>
          <span className="micro">{generated.length} item{generated.length === 1 ? '' : 's'}</span>
        </div>

        {generated.length === 0 ? (
          <StateBlock
            icon="spark"
            title="No generated lessons yet"
            body="Type a topic into the console and Blu will plan scenes, narration and captions for it. Until the local backend answers, the sample lesson below keeps the studio usable."
            action={
              <Button variant="primary" icon="plus" onClick={() => navigate('/')}>
                Open the lesson console
              </Button>
            }
            secondary={
              <Button
                icon="play"
                onClick={() => {
                  navigate('/studio');
                }}
              >
                Explore the sample lesson
              </Button>
            }
          />
        ) : (
          <div className="lib-grid">
            {generated.map((l, i) => (
              <LessonCard key={l.id} lesson={l} index={i} />
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="sample-title" className="lib-sample-section">
        <div className="lib-section-head">
          <h2 id="sample-title">Shipped with the app</h2>
          <span className="micro">{samples.length} sample</span>
        </div>
        <div className="lib-grid">
          {samples.map((l, i) => (
            <LessonCard key={l.id} lesson={l} index={i} />
          ))}
        </div>
      </section>
    </div>
  );
}