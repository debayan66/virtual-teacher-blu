import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Icon } from './Icon';
import type { IconName } from './Icon';

export const cx = (...parts: (string | false | null | undefined)[]) =>
  parts.filter(Boolean).join(' ');

/* ----------------------------- button ---------------------------------- */

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'ghost';
  size?: 'md' | 'sm';
  icon?: IconName;
  iconRight?: IconName;
  loading?: boolean;
}

export function Button({
  variant = 'default',
  size = 'md',
  icon,
  iconRight,
  loading,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={cx(
        'btn',
        variant === 'primary' && 'btn-primary',
        variant === 'ghost' && 'btn-ghost',
        size === 'sm' && 'btn-sm',
        className,
      )}
    >
      {loading ? (
        <Icon name="refresh" size={15} className="spin" />
      ) : (
        icon && <Icon name={icon} size={size === 'sm' ? 14 : 16} />
      )}
      {children}
      {iconRight && <Icon name={iconRight} size={size === 'sm' ? 14 : 16} />}
    </button>
  );
}

/* --------------------------- segmented --------------------------------- */

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: { value: T; label: string; title?: string }[];
  value: T;
  onChange: (v: T) => void;
  ariaLabel: string;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ left: 0, width: 0 });

  useLayoutEffect(() => {
    const el = wrap.current?.querySelector<HTMLElement>(`[data-value="${value}"]`);
    if (!el) return;
    setBox({ left: el.offsetLeft, width: el.offsetWidth });
  }, [value, options.length]);

  return (
    <div className="seg" ref={wrap} role="group" aria-label={ariaLabel}>
      <span className="seg-indicator" style={{ left: box.left, width: box.width }} />
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          data-value={o.value}
          className="seg-btn"
          aria-pressed={o.value === value}
          title={o.title}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ----------------------------- status ---------------------------------- */

export function Dot({ tone = 'idle' }: { tone?: 'ok' | 'warn' | 'err' | 'live' | 'idle' }) {
  return <span className={cx('dot', tone !== 'idle' && `dot-${tone}`)} />;
}

export function Pill({
  tone = 'neutral',
  icon,
  children,
}: {
  tone?: 'neutral' | 'ok' | 'warn' | 'err' | 'info';
  icon?: IconName;
  children: ReactNode;
}) {
  return (
    <span className={cx('pill', tone !== 'neutral' && `pill-${tone}`)}>
      {icon && <Icon name={icon} size={12} />}
      {children}
    </span>
  );
}

export function Meter({
  value,
  indeterminate,
  label,
}: {
  value: number;
  indeterminate?: boolean;
  label?: string;
}) {
  return (
    <div
      className={cx('bar', indeterminate && 'bar-indeterminate')}
      role="progressbar"
      aria-valuenow={indeterminate ? undefined : Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <i style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

export function Spinner({ size = 16 }: { size?: number }) {
  return <Icon name="refresh" size={size} className="spin" />;
}

/* ---------------------------- tooltip ---------------------------------- */

export function Tooltip({ label, children }: { label: string; children: ReactNode }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  const show = () => {
    const r = ref.current?.getBoundingClientRect();
    if (r) setPos({ x: r.left + r.width / 2, y: r.top - 8 });
  };

  return (
    <>
      <span
        ref={ref}
        style={{ display: 'inline-flex' }}
        onMouseEnter={show}
        onMouseLeave={() => setPos(null)}
        onFocus={show}
        onBlur={() => setPos(null)}
      >
        {children}
      </span>
      <AnimatePresence>
        {pos && (
          <motion.span
            className="tip"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.14 }}
            style={{
              left: pos.x,
              top: pos.y,
              transform: 'translate(-50%, -100%)',
            }}
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </>
  );
}

/* ----------------------------- modal ----------------------------------- */

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="modal-scrim"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={onClose}
        >
          <motion.div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ opacity: 0, y: 16, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.99 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-head">
              <h3>{title}</h3>
              <button className="icon-btn" onClick={onClose} aria-label="Close dialog">
                <Icon name="close" size={17} />
              </button>
            </div>
            {children}
            {footer && <div className="modal-foot">{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ---------------------------- toasts ----------------------------------- */

export function ToastStack({
  toasts,
  onDismiss,
}: {
  toasts: { id: number; kind: 'ok' | 'err' | 'info'; message: string }[];
  onDismiss: (id: number) => void;
}) {
  return (
    <div className="toasts" aria-live="polite">
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            className={cx('toast', t.kind === 'err' && 'toast-err', t.kind === 'ok' && 'toast-ok')}
            initial={{ opacity: 0, x: 24, scale: 0.97 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 24, scale: 0.97 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            layout
          >
            <Icon
              name={t.kind === 'err' ? 'alert' : t.kind === 'ok' ? 'check' : 'info'}
              size={17}
              style={{
                flex: 'none',
                marginTop: 2,
                color: t.kind === 'err' ? 'var(--err)' : t.kind === 'ok' ? 'var(--ok)' : 'var(--cyan)',
              }}
            />
            <span style={{ flex: 1 }}>{t.message}</span>
            <button
              className="icon-btn"
              style={{ width: 24, height: 24 }}
              onClick={() => onDismiss(t.id)}
              aria-label="Dismiss"
            >
              <Icon name="close" size={14} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

/* --------------------- empty / error / loading states ------------------ */

export function StateBlock({
  icon,
  title,
  body,
  action,
  secondary,
  tone = 'neutral',
}: {
  icon: IconName;
  title: string;
  body: string;
  action?: ReactNode;
  secondary?: ReactNode;
  tone?: 'neutral' | 'error';
}) {
  return (
    <motion.div
      className="state"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      style={tone === 'error' ? { borderColor: 'rgba(255,107,107,.35)' } : undefined}
    >
      <span className="state-art" style={tone === 'error' ? { color: 'var(--err)' } : undefined}>
        <Icon name={icon} size={40} strokeWidth={1.3} />
      </span>
      <div>
        <div className="state-title">{title}</div>
        <p className="state-body" style={{ marginTop: 8 }}>
          {body}
        </p>
      </div>
      {(action || secondary) && (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
          {action}
          {secondary}
        </div>
      )}
    </motion.div>
  );
}

export function LoadingBlock({ label }: { label: string }) {
  return (
    <div className="state" role="status" aria-live="polite">
      <Spinner size={26} />
      <div className="state-title" style={{ fontSize: 17 }}>
        {label}
      </div>
      <div style={{ display: 'grid', gap: 8, width: 'min(360px, 100%)' }}>
        <div className="skeleton" style={{ height: 10, width: '70%' }} />
        <div className="skeleton" style={{ height: 10 }} />
        <div className="skeleton" style={{ height: 10, width: '45%' }} />
      </div>
    </div>
  );
}