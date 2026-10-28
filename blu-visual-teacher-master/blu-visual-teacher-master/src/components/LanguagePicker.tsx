import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from './Icon';
import { cx } from './ui';
import { LANGUAGES, offlineState } from '../lib/languages';
import type { LanguageEntry } from '../lib/types';
import { findVoice, useDeviceVoices } from '../lib/voices';

interface Props {
  value: string;
  onChange: (code: string) => void;
  label: string;
  hint?: string;
  /** Optional filter, e.g. only languages a lesson ships captions for. */
  filter?: (entry: LanguageEntry) => boolean;
  disabled?: boolean;
  compact?: boolean;
  id?: string;
}

/**
 * Searchable language menu. Languages are identified by name and native
 * script — never by flag, because a language is not a country.
 */
export function LanguagePicker({
  value,
  onChange,
  label,
  hint,
  filter,
  disabled,
  compact,
  id,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const root = useRef<HTMLDivElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const { voices } = useDeviceVoices();

  const selected = LANGUAGES.find((l) => l.code === value);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = LANGUAGES.filter((l) => (filter ? filter(l) : true));
    if (!q) return base;
    return base.filter((l) =>
      [l.name, l.native, l.code, l.script].some((v) => v.toLowerCase().includes(q)),
    );
  }, [query, filter]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    const t = window.setTimeout(() => search.current?.focus(), 40);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
      window.clearTimeout(t);
    };
  }, [open]);

  const pick = (code: string) => {
    onChange(code);
    setOpen(false);
    setQuery('');
  };

  return (
    <div className="picker" ref={root}>
      <span className="field-label">
        <span>{label}</span>
        {hint && <span style={{ letterSpacing: '0.06em' }}>{hint}</span>}
      </span>
      <button
        type="button"
        id={id}
        className={cx('picker-trigger', open && 'is-open')}
        onClick={() => !disabled && setOpen((v) => !v)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${label}: ${selected ? selected.name : value}`}
      >
        <span className="picker-value">
          <b className="script-label">{selected?.native ?? value.toUpperCase()}</b>
          <i>{selected?.name ?? 'Unknown'}</i>
        </span>
        <span className="picker-meta">
          {selected && (
            <span
              className={cx('dot', selected.assetsInstalled ? 'dot-ok' : 'dot-warn')}
              title={
                selected.assetsInstalled ? 'Local assets installed' : 'Offline pack not installed'
              }
            />
          )}
          <Icon name="chevron" size={14} style={{ transform: open ? 'rotate(180deg)' : 'none' }} />
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="picker-menu"
            role="listbox"
            aria-label={label}
            initial={{ opacity: 0, y: -8, scaleY: 0.96 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -6, scaleY: 0.98 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            style={{ transformOrigin: 'top' }}
          >
            <div className="picker-search">
              <Icon name="search" size={15} />
              <input
                ref={search}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search languages · भाषा · 语言"
                aria-label="Search languages"
              />
            </div>

            <div className="picker-list" role="group">
              {list.length === 0 && (
                <div className="picker-empty">
                  No language matches “{query}”.
                  <span>Try a language name, its native script, or a code such as <b>hi</b>.</span>
                </div>
              )}
              {list.map((l) => {
                const state = offlineState(l, Boolean(findVoice(voices, l.code)));
                const voice = findVoice(voices, l.code);
                const isSel = l.code === value;
                return (
                  <button
                    key={l.code}
                    type="button"
                    role="option"
                    aria-selected={isSel}
                    className={cx('picker-option', isSel && 'is-sel')}
                    onClick={() => pick(l.code)}
                  >
                    <span className="picker-option-name">
                      <b>{l.name}</b>
                      <em className="script-label">{l.native}</em>
                    </span>
                    <span className="picker-option-state">
                      <span className="micro" style={{ fontSize: 9.5 }}>
                        {state === 'ready'
                          ? 'Offline ready'
                          : state === 'assets'
                            ? 'No voice'
                            : state === 'voice'
                              ? 'Packs missing'
                              : 'Listed only'}
                      </span>
                      <span
                        className={cx(
                          'dot',
                          state === 'ready'
                            ? 'dot-ok'
                            : state === 'listed'
                              ? ''
                              : 'dot-warn',
                        )}
                      />
                    </span>
                    {isSel && <Icon name="check" size={14} className="picker-check" />}
                    {voice && compact === false && (
                      <span className="micro picker-voice" title={voice.name}>
                        {voice.name}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="picker-foot">
              <span className="micro">
                {LANGUAGES.filter((l) => offlineState(l, Boolean(findVoice(voices, l.code))) === 'ready').length}{' '}
                of {LANGUAGES.length} ready offline
              </span>
              <span className="micro">Languages, not flags</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}