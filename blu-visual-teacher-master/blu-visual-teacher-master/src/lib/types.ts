/* Domain model for lessons, scenes and the backend contract. */

export type Level = 'beginner' | 'intermediate' | 'advanced';

export type SceneKind = 'title' | 'diagram' | 'code';

/** Tone drives accessible, colour-independent status as well as hue. */
export type Tone = 'neutral' | 'focus' | 'good' | 'bad' | 'accent';

export interface SceneBase {
  id: string;
  kind: SceneKind;
  /** Seconds. */
  duration: number;
  /** Short label used by the timeline, scene navigator and thumbnails. */
  title: string;
  /** Narration script per language code — real text, never fabricated audio. */
  narration: Record<string, string>;
  /** Caption cue text per language code, index-aligned and timed across the scene. */
  captions: Record<string, string[]>;
}

export interface TitleScene extends SceneBase {
  kind: 'title';
  eyebrow: string;
  headline: string;
  sub: string;
  points: string[];
}

export interface DiagramNode {
  id: string;
  x: number; // 0..100 (% of stage width)
  y: number; // 0..100 (% of stage height)
  label: string;
  sub?: string;
  tone: Tone;
  shape?: 'box' | 'circle' | 'cloud';
}

export interface DiagramEdge {
  id: string;
  from: string;
  to: string;
  label?: string;
  tone: Tone;
  /** Control-point offset for curved links, in stage units. */
  bend?: number;
  dashed?: boolean;
}

export type DiagramAction =
  | { at: number; action: 'show-node'; node: string }
  | { at: number; action: 'show-edge'; edge: string }
  | { at: number; action: 'packet'; edge: string; tone: Tone; label?: string }
  | { at: number; action: 'show-label'; edge: string }
  | { at: number; action: 'mark'; node: string; tone: Tone };

export interface DiagramScene extends SceneBase {
  kind: 'diagram';
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  /** Progressive reveal steps, in seconds from scene start. */
  steps: DiagramAction[];
  legend: { label: string; tone: Tone }[];
}

export interface CodeBeat {
  at: number; // seconds from scene start
  line: number; // 1-based
  note: string;
}

export interface CodeProbe {
  at: number;
  command: string;
  result: string;
  tone: Tone;
}

export interface CodeScene extends SceneBase {
  kind: 'code';
  file: string;
  lines: string[];
  beats: CodeBeat[];
  probes: CodeProbe[];
  language: string;
}

export type Scene = TitleScene | DiagramScene | CodeScene;

export interface Lesson {
  id: string;
  title: string;
  topic: string;
  level: Level;
  durationMinutes: number;
  languages: string[]; // languages this lesson has narration + captions for
  scenes: Scene[];
  /** True when the lesson shipped with the app instead of being generated. */
  sample: boolean;
  sampleNote?: string;
  createdAt: string;
  status: 'ready' | 'draft';
}

/* ---------------------------- creation input ---------------------------- */

export interface GenerateInput {
  topic: string;
  level: Level;
  minutes: number;
  narration: string;
  captions: string;
}

/* ------------------------------- export -------------------------------- */

export interface ExportInput {
  lessonId: string;
  narration: string;
  captions: string;
  /** '' disables the caption track. */
  resolution: '1080p' | '720p' | '480p';
  format: 'mp4' | 'webm';
  burnInCaptions: boolean;
}

export type ExportProgress = {
  jobId: string;
  state: 'queued' | 'rendering' | 'encoding' | 'done' | 'failed';
  percent: number;
  stage: string;
  file?: string;
  path?: string;
  bytes?: number;
  error?: string;
};

/* ------------------------------ languages ------------------------------ */

export type Coverage = 'full' | 'partial' | 'none';

export interface LanguageEntry {
  code: string;
  name: string;
  native: string;
  script: string;
  /** Lesson translation assets shipped with the app. */
  translation: Coverage;
  /** Caption rendering + fonts. */
  captions: Coverage;
  /** Narration script coverage. */
  narration: Coverage;
  /** Megabytes of local assets required for offline use. */
  packMB: number;
  /** Whether those assets are already on this machine (manifest data). */
  assetsInstalled: boolean;
  /** What "prepare for offline" has to fetch/install. */
  requires: string[];
}

export type OfflineState = 'listed' | 'assets' | 'voice' | 'ready';

/* -------------------------------- api ---------------------------------- */

export type ApiErrorKind = 'offline' | 'http' | 'timeout' | 'invalid' | 'unsupported';

export interface ApiError {
  kind: ApiErrorKind;
  message: string;
  status?: number;
}

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: ApiError };

export interface HealthResponse {
  service: string;
  version: string;
  models: string[];
}