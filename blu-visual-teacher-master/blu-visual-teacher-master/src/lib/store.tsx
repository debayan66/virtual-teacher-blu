import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { api } from './api';
import { SAMPLE_LESSON } from './sampleLesson';
import type { ApiError, HealthResponse, Lesson } from './types';

export type BackendStatus = 'checking' | 'online' | 'offline';

export interface Toast {
  id: number;
  kind: 'ok' | 'err' | 'info';
  message: string;
}

interface StoreValue {
  backend: BackendStatus;
  backendInfo: HealthResponse | null;
  backendError: ApiError | null;
  probe: () => Promise<BackendStatus>;

  lessons: Lesson[];
  currentLesson: Lesson;
  openLesson: (id: string) => void;
  addLesson: (lesson: Lesson) => void;

  narration: string;
  captions: string;
  setNarration: (code: string) => void;
  setCaptions: (code: string) => void;

  toasts: Toast[];
  notify: (kind: Toast['kind'], message: string) => void;
  dismiss: (id: number) => void;
}

const StoreCtx = createContext<StoreValue | null>(null);

const PREFS_KEY = 'blu.prefs.v1';

interface Prefs {
  narration: string;
  captions: string;
}

function readPrefs(): Prefs {
  const fallback: Prefs = { narration: 'en', captions: 'en' };
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<Prefs>;
    return { narration: parsed.narration ?? 'en', captions: parsed.captions ?? 'en' };
  } catch {
    return fallback;
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [backend, setBackend] = useState<BackendStatus>('checking');
  const [backendInfo, setBackendInfo] = useState<HealthResponse | null>(null);
  const [backendError, setBackendError] = useState<ApiError | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([SAMPLE_LESSON]);
  const [currentId, setCurrentId] = useState(SAMPLE_LESSON.id);
  const [prefs, setPrefs] = useState<Prefs>(() => readPrefs());
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    } catch {
      /* storage unavailable — prefs stay in memory */
    }
  }, [prefs]);

  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const notify = useCallback(
    (kind: Toast['kind'], message: string) => {
      const id = Date.now() + Math.random();
      setToasts((list) => [...list, { id, kind, message }]);
      window.setTimeout(() => dismiss(id), kind === 'err' ? 7000 : 4200);
    },
    [dismiss],
  );

  const probe = useCallback(async (): Promise<BackendStatus> => {
    setBackend('checking');
    const res = await api.health();
    if (res.ok) {
      setBackend('online');
      setBackendInfo(res.data);
      setBackendError(null);
      return 'online';
    }
    setBackend('offline');
    setBackendInfo(null);
    setBackendError(res.error);
    return 'offline';
  }, []);

  useEffect(() => {
    void probe();
  }, [probe]);

  const currentLesson = useMemo(
    () => lessons.find((l) => l.id === currentId) ?? lessons[0],
    [lessons, currentId],
  );

  const value: StoreValue = {
    backend,
    backendInfo,
    backendError,
    probe,
    lessons,
    currentLesson,
    openLesson: (id) => setCurrentId(id),
    addLesson: (lesson) => {
      setLessons((list) => [lesson, ...list.filter((l) => l.id !== lesson.id)]);
      setCurrentId(lesson.id);
    },
    narration: prefs.narration,
    captions: prefs.captions,
    setNarration: (code) => setPrefs((p) => ({ ...p, narration: code })),
    setCaptions: (code) => setPrefs((p) => ({ ...p, captions: code })),
    toasts,
    notify,
    dismiss,
  };

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}