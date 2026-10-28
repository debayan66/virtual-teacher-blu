import type {
  ApiResult,
  ExportInput,
  ExportProgress,
  GenerateInput,
  HealthResponse,
} from './types';

/**
 * Typed API layer for the local Blu backend.
 *
 * Every call resolves to a discriminated result instead of throwing, so the UI
 * can render an honest "backend unavailable" state rather than inventing a
 * successful generation, language pack install or video export.
 */
const BASE = '/api';
const TIMEOUT_MS = 5000;

async function request<T>(
  path: string,
  init?: RequestInit & { json?: unknown },
  timeoutMs = TIMEOUT_MS,
): Promise<ApiResult<T>> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const headers: Record<string, string> = { Accept: 'application/json' };
  let body: string | undefined;
  if (init?.json !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(init.json);
  }
  try {
    const res = await fetch(`${BASE}${path}`, {
      ...init,
      headers: { ...headers, ...(init?.headers ?? {}) },
      body,
      signal: controller.signal,
    });
    if (!res.ok) {
      let detail: string | null = null;
      try {
        const payload = (await res.json()) as { error?: string; message?: string };
        detail = payload.error ?? payload.message ?? null;
      } catch {
        /* non-JSON body: proxy/transport failure rather than a real API error */
      }
      if (detail === null && res.status >= 500) {
        // A 5xx with no API payload means the request never reached a backend.
        return {
          ok: false,
          error: { kind: 'offline', status: res.status, message: 'No response from the local backend service.' },
        };
      }
      return {
        ok: false,
        error: {
          kind: res.status >= 500 ? 'offline' : 'http',
          status: res.status,
          message: detail ?? `Backend responded ${res.status} ${res.statusText}`,
        },
      };
    }
    const data = (await res.json()) as T;
    return { ok: true, data };
  } catch (err) {
    const aborted = err instanceof DOMException && err.name === 'AbortError';
    const badJson = err instanceof SyntaxError;
    if (badJson) {
      // Vite/dev servers answer unmatched paths with the app shell.
      return {
        ok: false,
        error: {
          kind: 'offline',
          message: 'The endpoint returned a page instead of JSON — no local backend is running there.',
        },
      };
    }
    return {
      ok: false,
      error: {
        kind: aborted ? 'timeout' : 'offline',
        message: aborted
          ? `The local backend did not answer within ${Math.round(timeoutMs / 1000)}s.`
          : 'No response from the local backend service.',
      },
    };
  } finally {
    clearTimeout(timer);
  }
}

export const api = {
  health: () => request<HealthResponse>('/health', {}, 3000),

  generateLesson: (input: GenerateInput) =>
    request<{ lessonId: string; status: string }>('/lessons', { method: 'POST', json: input }, 30000),

  startExport: (input: ExportInput) =>
    request<{ jobId: string }>('/exports', { method: 'POST', json: input }, 20000),

  exportProgress: (jobId: string) =>
    request<ExportProgress>(`/exports/${encodeURIComponent(jobId)}`, {}, 8000),

  prepareLanguage: (code: string) =>
    request<{ jobId: string; language: string }>(
      `/languages/${encodeURIComponent(code)}/prepare`,
      { method: 'POST' },
      60000,
    ),

  languageStatus: (code: string) =>
    request<{ code: string; installed: boolean; assets: string[] }>(
      `/languages/${encodeURIComponent(code)}`,
      {},
      8000,
    ),
};

/** Human copy for each failure mode, used across pages. */
export function describeApiError(kind: string, status?: number): string {
  switch (kind) {
    case 'timeout':
      return 'The local backend is running but not responding.';
    case 'http':
      return `The local backend rejected the request (${status ?? 'error'}).`;
    case 'invalid':
      return 'The backend returned a response the studio could not read.';
    case 'unsupported':
      return 'This action is not supported by the connected backend version.';
    default:
      return 'The local backend service is not reachable.';
  }
}