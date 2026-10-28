import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { Icon } from '../components/Icon';
import { Button, Meter, Pill, Segmented, StateBlock, Tooltip, cx } from '../components/ui';
import { LanguagePicker } from '../components/LanguagePicker';
import { api, describeApiError } from '../lib/api';
import { languageName } from '../lib/languages';
import { totalDuration } from '../lib/sampleLesson';
import { useStore } from '../lib/store';
import type { ExportProgress } from '../lib/types';

type Phase = 'idle' | 'starting' | 'running' | 'done' | 'failed';

const RESOLUTIONS = [
  { value: '1080p', label: '1080p' },
  { value: '720p', label: '720p' },
  { value: '480p', label: '480p' },
];

const FORMATS = [
  { value: 'mp4', label: 'MP4 · H.264' },
  { value: 'webm', label: 'WebM · VP9' },
];

function fmtBytes(n?: number) {
  if (!n) return '—';
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function ExportPage() {
  const { currentLesson, narration, setNarration, captions, setCaptions, notify, backend, probe } =
    useStore();
  const lesson = currentLesson;

  const [res, setRes] = useState('1080p');
  const [format, setFormat] = useState('mp4');
  const [burn, setBurn] = useState(true);
  const [capMode, setCapMode] = useState<'on' | 'off'>('on');
  const [phase, setPhase] = useState<Phase>('idle');
  const [progress, setProgress] = useState<ExportProgress | null>(null);
  const [error, setError] = useState<{ kind: string; status?: number; message: string } | null>(null);
  const poll = useRef<number | null>(null);

  const duration = totalDuration(lesson);
  const filename = `${lesson.id}_${narration}_${res}.${format === 'mp4' ? 'mp4' : 'webm'}`;

  useEffect(() => () => { if (poll.current) window.clearInterval(poll.current); }, []);

  async function start() {
    setPhase('starting');
    setError(null);
    setProgress(null);
    const res0 = await api.startExport({
      lessonId: lesson.id,
      narration,
      captions: capMode === 'on' ? captions : '',
      resolution: res as '1080p' | '720p' | '480p',
      format: format as 'mp4' | 'webm',
      burnInCaptions: burn,
    });
    if (!res0.ok) {
      setPhase('failed');
      setError(res0.error);
      notify('err', 'Export could not start — the local backend is unavailable.');
      return;
    }
    setPhase('running');
    notify('info', 'Export started. Rendering scenes…');
    const jobId = res0.data.jobId;
    poll.current = window.setInterval(async () => {
      const p = await api.exportProgress(jobId);
      if (!p.ok) {
        if (poll.current) window.clearInterval(poll.current);
        setPhase('failed');
        setError(p.error);
        return;
      }
      setProgress(p.data);
      if (p.data.state === 'done') {
        if (poll.current) window.clearInterval(poll.current);
        setPhase('done');
        notify('ok', `Export complete: ${p.data.file ?? 'file'}`);
      } else if (p.data.state === 'failed') {
        if (poll.current) window.clearInterval(poll.current);
        setPhase('failed');
        setError({ kind: 'http', message: p.data.error ?? 'The render job failed.' });
      }
    }, 900);
  }

  const running = phase === 'starting' || phase === 'running';

  return (
    <div className="page export">
      <header className="section-head">
        <div>
          <div className="section-kicker">
            <span className="kicker-line" />
            <span className="micro">Export</span>
          </div>
          <h1 className="section-title">Render the lesson into a video</h1>
          <p className="lede" style={{ marginTop: 12 }}>
            The last step of the studio: choose the language mix and format, then let the local
            backend compose scenes, narration and captions into a file.
          </p>
        </div>
        <Pill tone={backend === 'online' ? 'ok' : 'warn'} icon={backend === 'online' ? 'check' : 'cloudOff'}>
          {backend === 'online' ? 'Backend connected' : 'Backend offline'}
        </Pill>
      </header>

      <div className="export-grid">
        {/* ---------------------------- preview ------------------------- */}
        <section className="export-preview panel cut-br" aria-label="Export preview">
          <div className="export-thumb">
            <div className="export-thumb-scene">
              <span className="micro">Scene 01 · title</span>
              <b className="export-thumb-title">{lesson.title}</b>
              <div className="export-thumb-chips">
                {lesson.scenes.map((s, i) => (
                  <span key={s.id} className={cx('thumb-chip', `is-${s.kind}`)}>
                    {String(i + 1).padStart(2, '0')} {s.kind}
                  </span>
                ))}
              </div>
            </div>
            <div className="export-thumb-overlay">
              <span className="micro">16:9 · {res} · {format.toUpperCase()}</span>
            </div>
          </div>

          <dl className="export-facts">
            <div>
              <dt>Lesson</dt>
              <dd>{lesson.title}</dd>
            </div>
            <div>
              <dt>Narration</dt>
              <dd className="script-label">{languageName(narration)}</dd>
            </div>
            <div>
              <dt>Captions</dt>
              <dd className="script-label">{capMode === 'on' ? languageName(captions) : 'Off'}</dd>
            </div>
            <div>
              <dt>Runtime</dt>
              <dd>{duration}s · {lesson.scenes.length} scenes</dd>
            </div>
          </dl>
        </section>

        {/* ---------------------------- settings ------------------------ */}
        <section className="export-settings panel" aria-label="Export settings">
          <div className="export-settings-head">
            <span className="micro">Output settings</span>
            <span className="micro">local backend</span>
          </div>

          <div className="export-form">
            <LanguagePicker
              label="Narration language"
              value={narration}
              onChange={setNarration}
              compact={false}
            />

            <div className="field">
              <span className="field-label">
                <span>Captions</span>
                <span>{capMode === 'on' ? 'burned in' : 'disabled'}</span>
              </span>
              <div className="export-cap-row">
                <Segmented
                  ariaLabel="Caption mode"
                  options={[
                    { value: 'on', label: 'Include' },
                    { value: 'off', label: 'No captions' },
                  ]}
                  value={capMode}
                  onChange={(v) => setCapMode(v as 'on' | 'off')}
                />
              </div>
              <div className={cx('export-cap-lang', capMode === 'off' && 'is-off')}>
                <LanguagePicker
                  label="Caption language"
                  value={captions}
                  onChange={setCaptions}
                  compact={false}
                  disabled={capMode === 'off'}
                />
              </div>
            </div>

            <div className="field">
              <span className="field-label">Resolution</span>
              <Segmented ariaLabel="Resolution" options={RESOLUTIONS} value={res} onChange={setRes} />
            </div>

            <div className="field">
              <span className="field-label">Format</span>
              <Segmented ariaLabel="Format" options={FORMATS} value={format} onChange={setFormat} />
            </div>

            <button
              className={cx('toggle', burn && 'is-on')}
              onClick={() => setBurn((v) => !v)}
              role="switch"
              aria-checked={burn}
            >
              <span className="toggle-track">
                <span className="toggle-knob" />
              </span>
              <span className="toggle-text">
                <b>Burn captions into the video</b>
                <i>Subtitles stay visible in every player</i>
              </span>
            </button>
          </div>

          <div className="export-estimate">
            <div>
              <span className="micro">Expected file</span>
              <code>{filename}</code>
            </div>
            <div>
              <span className="micro">Rough size</span>
              <code>{res === '1080p' ? '≈ 18 MB' : res === '720p' ? '≈ 11 MB' : '≈ 6 MB'}</code>
            </div>
          </div>

          <button className="generate-btn export-go" onClick={() => void start()} disabled={running}>
            <span className="generate-btn-sweep" aria-hidden="true" />
            <span className="generate-btn-inner">
              {phase === 'starting' ? (
                <>
                  <Icon name="refresh" size={17} className="spin" />
                  Requesting render…
                </>
              ) : phase === 'running' ? (
                <>
                  <Icon name="film" size={17} />
                  Rendering…
                </>
              ) : (
                <>
                  <Icon name="download" size={17} />
                  Export video
                  <Icon name="arrowRight" size={17} />
                </>
              )}
            </span>
          </button>

          <p className="console-foot">
            Export runs on the local backend. Blu never reports success before the backend confirms
            the finished file.
          </p>
        </section>

        {/* ---------------------------- progress ------------------------ */}
        <section className="export-progress panel" aria-label="Export progress" aria-live="polite">
          <div className="export-settings-head">
            <span className="micro">Progress</span>
            <span className="micro">{phase}</span>
          </div>

          <AnimatePresence mode="wait">
            {(phase === 'idle' || phase === 'starting') && (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <StateBlock
                  icon="film"
                  title={phase === 'idle' ? 'Nothing rendering yet' : 'Contacting the render service'}
                  body={
                    phase === 'idle'
                      ? 'Configure the output, then start the export. Progress, stage names and the final file details appear here.'
                      : 'Waiting for the local backend to accept the render job…'
                  }
                />
              </motion.div>
            )}

            {phase === 'running' && (
              <motion.div
                key="running"
                className="export-live"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <div className="export-live-top">
                  <b>{progress?.stage ?? 'Queued'}</b>
                  <span>{Math.round(progress?.percent ?? 0)}%</span>
                </div>
                <Meter value={progress?.percent ?? 0} label="Export progress" />
                <div className="export-stages">
                  {['Rendering scenes', 'Narration mix', 'Encoding'].map((s, i) => {
                    const p = progress?.percent ?? 0;
                    const done = p > (i + 1) * 33;
                    const active = !done && p > i * 33;
                    return (
                      <span key={s} className={cx('export-stage', done && 'is-done', active && 'is-on')}>
                        <span className="dot" />
                        {s}
                      </span>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {phase === 'failed' && error && (
              <motion.div key="failed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <StateBlock
                  tone="error"
                  icon="alert"
                  title="Export did not run"
                  body={`${describeApiError(error.kind, error.status)} ${error.message} No file was created, so nothing is reported as complete.`}
                  action={
                    <Button icon="refresh" onClick={() => void start()}>
                      Retry export
                    </Button>
                  }
                  secondary={
                    <Button
                      variant="ghost"
                      icon="refresh"
                      onClick={async () => {
                        await probe();
                        notify('info', 'Re-probed the local backend.');
                      }}
                    >
                      Probe backend
                    </Button>
                  }
                />
              </motion.div>
            )}

            {phase === 'done' && progress && (
              <motion.div
                key="done"
                className="export-done"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              >
                <span className="export-done-badge">
                  <Icon name="check" size={26} />
                </span>
                <b>Export complete</b>
                <div className="export-done-file">
                  <span className="micro">File</span>
                  <code>{progress.file ?? filename}</code>
                </div>
                <div className="export-done-file">
                  <span className="micro">Location</span>
                  <code>{progress.path ?? '—'}</code>
                </div>
                <div className="export-done-meta">
                  <span>{fmtBytes(progress.bytes)}</span>
                  <span>{res}</span>
                  <span>{format.toUpperCase()}</span>
                  <span>{capMode === 'on' ? `captions ${captions}` : 'no captions'}</span>
                </div>
                <div className="export-done-actions">
                  <Tooltip label="Copying needs clipboard permission in this browser">
                    <Button
                      icon="copy"
                      onClick={() => {
                        void navigator.clipboard?.writeText(progress.path ?? progress.file ?? '');
                        notify('ok', 'Path copied to clipboard.');
                      }}
                    >
                      Copy path
                    </Button>
                  </Tooltip>
                  <Tooltip label="Reveal in the file explorer needs the desktop backend bridge">
                    <Button disabled icon="folder">
                      Reveal in folder
                    </Button>
                  </Tooltip>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </div>
    </div>
  );
}