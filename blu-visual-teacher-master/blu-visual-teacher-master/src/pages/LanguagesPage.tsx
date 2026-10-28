import { AnimatePresence, motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { Icon } from '../components/Icon';
import { Button, Meter, Modal, Pill, StateBlock, cx } from '../components/ui';
import { api, describeApiError } from '../lib/api';
import { LANGUAGES, OFFLINE_STATE_LABEL, offlineState, requiredAssets } from '../lib/languages';
import { useStore } from '../lib/store';
import { findVoice, useDeviceVoices } from '../lib/voices';
import type { Coverage, LanguageEntry, OfflineState } from '../lib/types';

type Filter = 'all' | 'ready' | 'assets' | 'missing';

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All languages' },
  { value: 'ready', label: 'Offline ready' },
  { value: 'assets', label: 'Assets installed' },
  { value: 'missing', label: 'Not prepared' },
];

function CoverageBar({ entry }: { entry: LanguageEntry }) {
  const segs: { label: string; v: Coverage }[] = [
    { label: 'Translation', v: entry.translation },
    { label: 'Captions', v: entry.captions },
    { label: 'Narration', v: entry.narration },
  ];
  return (
    <div className="cov">
      {segs.map((s) => (
        <span
          key={s.label}
          className={cx('cov-seg', `is-${s.v}`)}
          title={`${s.label}: ${s.v === 'full' ? 'available' : s.v === 'partial' ? 'partial' : 'unavailable'}`}
        >
          <i style={{ width: s.v === 'full' ? '100%' : s.v === 'partial' ? '50%' : '0%' }} />
          <em>{s.label.slice(0, 4)}</em>
        </span>
      ))}
    </div>
  );
}

function StatePill({ state }: { state: OfflineState }) {
  const tone = state === 'ready' ? 'ok' : state === 'listed' ? 'neutral' : 'warn';
  const icon = state === 'ready' ? 'check' : state === 'listed' ? 'info' : 'cloudOff';
  return (
    <Pill tone={tone} icon={icon}>
      {OFFLINE_STATE_LABEL[state]}
    </Pill>
  );
}

export function LanguagesPage() {
  const { notify, backend } = useStore();
  const { voices } = useDeviceVoices();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [target, setTarget] = useState<LanguageEntry | null>(null);
  const [job, setJob] = useState<'idle' | 'working' | 'failed'>('idle');
  const [error, setError] = useState<{ kind: string; status?: number; message: string } | null>(null);

  const stateOf = (l: LanguageEntry) => offlineState(l, Boolean(findVoice(voices, l.code)));

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return LANGUAGES.filter((l) => {
      const matches = !q || [l.name, l.native, l.code, l.script].some((v) => v.toLowerCase().includes(q));
      if (!matches) return false;
      const st = stateOf(l);
      if (filter === 'ready') return st === 'ready';
      if (filter === 'assets') return st === 'assets';
      if (filter === 'missing') return st === 'listed' || st === 'voice';
      return true;
    });
  }, [query, filter, voices]);

  const counts = useMemo(() => {
    const c = { ready: 0, assets: 0, listed: 0, total: LANGUAGES.length, mb: 0 };
    for (const l of LANGUAGES) {
      const st = stateOf(l);
      if (st === 'ready') c.ready++;
      else if (st === 'listed') c.listed++;
      else c.assets++;
      if (!l.assetsInstalled) c.mb += l.packMB;
    }
    return c;
  }, [voices]);

  async function prepare() {
    if (!target) return;
    setJob('working');
    setError(null);
    const res = await api.prepareLanguage(target.code);
    if (res.ok) {
      setJob('idle');
      notify('ok', `${target.name} pack download started.`);
      return;
    }
    setJob('failed');
    setError(res.error);
    notify('err', `${target.name} could not be prepared.`);
  }

  return (
    <div className="page languages">
      <header className="section-head">
        <div>
          <div className="section-kicker">
            <span className="kicker-line" />
            <span className="micro">Language manager</span>
          </div>
          <h1 className="section-title">Twenty languages, honestly reported</h1>
          <p className="lede" style={{ marginTop: 12 }}>
            A language can be listed, have its packs installed, or be genuinely usable offline.
            Blu only claims the last one when local assets <em>and</em> a real device voice exist.
          </p>
        </div>
        <div className="lang-search">
          <Icon name="search" size={16} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search हिन्दी · Tamil · ar"
            aria-label="Search languages"
          />
          {query && (
            <button className="icon-btn" onClick={() => setQuery('')} aria-label="Clear search">
              <Icon name="close" size={14} />
            </button>
          )}
        </div>
      </header>

      <div className="lang-stats">
        <div className="lang-stat">
          <b>{counts.ready}</b>
          <span>Ready offline</span>
          <i>assets + device voice</i>
        </div>
        <div className="lang-stat">
          <b>{counts.assets}</b>
          <span>Partially installed</span>
          <i>missing packs or voices</i>
        </div>
        <div className="lang-stat">
          <b>{counts.listed}</b>
          <span>Listed only</span>
          <i>nothing on this machine</i>
        </div>
        <div className="lang-stat">
          <b>{counts.mb} MB</b>
          <span>Still to download</span>
          <i>if you prepare everything</i>
        </div>
      </div>

      <div className="lang-filters" role="group" aria-label="Filter languages">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            className={cx('lang-filter', filter === f.value && 'is-on')}
            onClick={() => setFilter(f.value)}
            aria-pressed={filter === f.value}
          >
            {f.label}
            <span className="micro">
              {f.value === 'all'
                ? LANGUAGES.length
                : LANGUAGES.filter((l) => {
                    const st = stateOf(l);
                    if (f.value === 'ready') return st === 'ready';
                    if (f.value === 'assets') return st === 'assets';
                    return st === 'listed' || st === 'voice';
                  }).length}
            </span>
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <StateBlock
          icon="search"
          title="No language matches that"
          body={`Nothing in the ${filter === 'all' ? 'catalogue' : 'filtered list'} matches “${query}”. Try a language name, its native script, or clear the active filter.`}
          action={
            <Button
              onClick={() => {
                setQuery('');
                setFilter('all');
              }}
            >
              Reset search and filters
            </Button>
          }
        />
      ) : (
        <ul className="lang-grid">
          <AnimatePresence initial={false}>
            {list.map((l, i) => {
              const voice = findVoice(voices, l.code);
              const st = stateOf(l);
              const partial = l.translation === 'partial' || l.captions === 'partial' || l.narration !== 'full';
              return (
                <motion.li
                  key={l.code}
                  className={cx('lang-row', st === 'ready' && 'is-ready')}
                  layout
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.3, delay: Math.min(i * 0.02, 0.3), ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="lang-id">
                    <span className="lang-code">{l.code}</span>
                    <span className="lang-names">
                      <b className="script-label">{l.native}</b>
                      <i>{l.name} · {l.script}</i>
                    </span>
                  </div>

                  <CoverageBar entry={l} />

                  <div className="lang-support">
                    <span className={cx('cov-flag', partial && 'is-partial')}>
                      <Icon name={partial ? 'info' : 'check'} size={13} />
                      {partial ? 'Partial support' : 'Full support'}
                    </span>
                    <span className={cx('cov-flag', voice ? 'is-ok' : 'is-off')}>
                      <Icon name={voice ? 'mic' : 'mute'} size={13} />
                      {voice ? `${voice.name.slice(0, 24)}${voice.name.length > 24 ? '…' : ''}` : 'No device voice'}
                    </span>
                  </div>

                  <div className="lang-state">
                    <StatePill state={st} />
                    <span className="micro">
                      {l.assetsInstalled ? `${l.packMB} MB installed` : `${l.packMB} MB to fetch`}
                    </span>
                  </div>

                  <div className="lang-action">
                    <Button
                      size="sm"
                      variant={st === 'ready' ? 'ghost' : 'primary'}
                      icon={st === 'ready' ? 'eye' : 'download'}
                      onClick={() => {
                        setTarget(l);
                        setJob('idle');
                        setError(null);
                      }}
                    >
                      {st === 'ready' ? 'Inspect' : 'Prepare offline'}
                    </Button>
                  </div>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}

      <Modal
        open={Boolean(target)}
        onClose={() => setTarget(null)}
        title={target ? `Prepare ${target.name} for offline use` : ''}
        footer={
          target && (
            <>
              <Button variant="ghost" onClick={() => setTarget(null)}>
                Close
              </Button>
              <Button
                variant="primary"
                icon="download"
                loading={job === 'working'}
                onClick={() => void prepare()}
                disabled={target.assetsInstalled && Boolean(findVoice(voices, target.code))}
              >
                {target.assetsInstalled && findVoice(voices, target.code)
                  ? 'Already prepared'
                  : 'Prepare for offline use'}
              </Button>
            </>
          )
        }
      >
        {target && (
          <div className="prep">
            <div className="prep-head">
              <span className="script-label prep-native">{target.native}</span>
              <StatePill state={stateOf(target)} />
            </div>

            <p className="prep-intro">
              Everything below must live on this machine before {target.name} works without
              internet. Partial coverage stays partial — Blu will not report a language as ready
              until each piece is present.
            </p>

            <ul className="prep-list">
              {requiredAssets(target).map((asset, i) => {
                const hasVoice = /voice/i.test(asset);
                const done = hasVoice
                  ? Boolean(findVoice(voices, target.code))
                  : target.assetsInstalled;
                return (
                  <li key={asset} className={cx('prep-item', done && 'is-done')}>
                    <span className="prep-check">
                      <Icon name={done ? 'check' : 'plus'} size={14} />
                    </span>
                    <span className="prep-name">
                      <b>{asset}</b>
                      <i>{hasVoice ? 'device narration voice' : 'local model or asset'}</i>
                    </span>
                    <span className="prep-status micro">{done ? 'present' : 'missing'}</span>
                  </li>
                );
              })}
            </ul>

            <div className="prep-summary">
              <div>
                <span className="micro">Download</span>
                <b>{target.assetsInstalled ? '0 MB' : `${target.packMB} MB`}</b>
              </div>
              <div>
                <span className="micro">Coverage</span>
                <b>
                  {target.translation}/{target.captions}/{target.narration}
                </b>
              </div>
              <div>
                <span className="micro">Requires backend</span>
                <b>{backend === 'online' ? 'Connected' : 'Not reachable'}</b>
              </div>
            </div>

            <Meter value={stateOf(target) === 'ready' ? 100 : target.assetsInstalled ? 55 : 12} label="Offline readiness" />

            {job === 'failed' && error && (
              <div className="prep-error" role="alert">
                <Icon name="alert" size={16} />
                <div>
                  <b>{describeApiError(error.kind, error.status)}</b>
                  <p>{error.message}</p>
                  <p className="prep-error-note">
                    Nothing was installed and this language stays marked{' '}
                    {OFFLINE_STATE_LABEL[stateOf(target)].toLowerCase()} until the backend confirms
                    the download.
                  </p>
                  <Button size="sm" icon="refresh" onClick={() => void prepare()} style={{ marginTop: 10 }}>
                    Try again
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}