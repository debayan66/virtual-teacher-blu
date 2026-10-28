import type { LanguageEntry, OfflineState } from './types';

/**
 * Local language manifest. `assetsInstalled` describes packages that exist on
 * this machine; voice availability is probed live from the device in
 * src/lib/voices.ts so we never claim an offline language that cannot speak.
 */
export const LANGUAGES: LanguageEntry[] = [
  {
    code: 'en',
    name: 'English',
    native: 'English',
    script: 'Latin',
    translation: 'full',
    captions: 'full',
    narration: 'full',
    packMB: 0,
    assetsInstalled: true,
    requires: [],
  },
  {
    code: 'hi',
    name: 'Hindi',
    native: 'हिन्दी',
    script: 'Devanagari',
    translation: 'full',
    captions: 'full',
    narration: 'full',
    packMB: 42,
    assetsInstalled: true,
    requires: ['Noto Sans Devanagari', 'hi-IN narration voice', 'hi translation model'],
  },
  {
    code: 'bn',
    name: 'Bengali',
    native: 'বাংলা',
    script: 'Bengali',
    translation: 'full',
    captions: 'full',
    narration: 'partial',
    packMB: 51,
    assetsInstalled: false,
    requires: ['Noto Sans Bengali', 'bn narration voice', 'bn translation model'],
  },
  {
    code: 'ta',
    name: 'Tamil',
    native: 'தமிழ்',
    script: 'Tamil',
    translation: 'full',
    captions: 'full',
    narration: 'partial',
    packMB: 48,
    assetsInstalled: false,
    requires: ['Noto Sans Tamil', 'ta narration voice', 'ta translation model'],
  },
  {
    code: 'te',
    name: 'Telugu',
    native: 'తెలుగు',
    script: 'Telugu',
    translation: 'full',
    captions: 'partial',
    narration: 'none',
    packMB: 47,
    assetsInstalled: false,
    requires: ['Noto Sans Telugu', 'te translation model'],
  },
  {
    code: 'mr',
    name: 'Marathi',
    native: 'मराठी',
    script: 'Devanagari',
    translation: 'full',
    captions: 'full',
    narration: 'partial',
    packMB: 43,
    assetsInstalled: true,
    requires: ['Noto Sans Devanagari', 'mr narration voice'],
  },
  {
    code: 'gu',
    name: 'Gujarati',
    native: 'ગુજરાતી',
    script: 'Gujarati',
    translation: 'partial',
    captions: 'full',
    narration: 'none',
    packMB: 44,
    assetsInstalled: false,
    requires: ['Noto Sans Gujarati', 'gu translation model'],
  },
  {
    code: 'kn',
    name: 'Kannada',
    native: 'ಕನ್ನಡ',
    script: 'Kannada',
    translation: 'partial',
    captions: 'partial',
    narration: 'none',
    packMB: 46,
    assetsInstalled: false,
    requires: ['Noto Sans Kannada', 'kn translation model'],
  },
  {
    code: 'ml',
    name: 'Malayalam',
    native: 'മലയാളം',
    script: 'Malayalam',
    translation: 'partial',
    captions: 'partial',
    narration: 'none',
    packMB: 46,
    assetsInstalled: false,
    requires: ['Noto Sans Malayalam', 'ml translation model'],
  },
  {
    code: 'pa',
    name: 'Punjabi',
    native: 'ਪੰਜਾਬੀ',
    script: 'Gurmukhi',
    translation: 'partial',
    captions: 'full',
    narration: 'partial',
    packMB: 45,
    assetsInstalled: false,
    requires: ['Noto Sans Gurmukhi', 'pa narration voice'],
  },
  {
    code: 'ur',
    name: 'Urdu',
    native: 'اردو',
    script: 'Nastaliq',
    translation: 'partial',
    captions: 'partial',
    narration: 'none',
    packMB: 58,
    assetsInstalled: false,
    requires: ['Noto Nastaliq Urdu', 'ur translation model'],
  },
  {
    code: 'es',
    name: 'Spanish',
    native: 'Español',
    script: 'Latin',
    translation: 'full',
    captions: 'full',
    narration: 'full',
    packMB: 18,
    assetsInstalled: true,
    requires: ['es narration voice'],
  },
  {
    code: 'fr',
    name: 'French',
    native: 'Français',
    script: 'Latin',
    translation: 'full',
    captions: 'full',
    narration: 'full',
    packMB: 18,
    assetsInstalled: true,
    requires: ['fr narration voice'],
  },
  {
    code: 'de',
    name: 'German',
    native: 'Deutsch',
    script: 'Latin',
    translation: 'full',
    captions: 'full',
    narration: 'partial',
    packMB: 19,
    assetsInstalled: false,
    requires: ['Noto Sans', 'de narration voice'],
  },
  {
    code: 'pt',
    name: 'Portuguese',
    native: 'Português',
    script: 'Latin',
    translation: 'full',
    captions: 'full',
    narration: 'partial',
    packMB: 19,
    assetsInstalled: false,
    requires: ['pt narration voice'],
  },
  {
    code: 'ja',
    name: 'Japanese',
    native: '日本語',
    script: 'Japanese',
    translation: 'partial',
    captions: 'full',
    narration: 'partial',
    packMB: 74,
    assetsInstalled: false,
    requires: ['Noto Sans JP', 'ja narration voice', 'ja translation model'],
  },
  {
    code: 'zh',
    name: 'Chinese (Simplified)',
    native: '简体中文',
    script: 'Han',
    translation: 'partial',
    captions: 'full',
    narration: 'full',
    packMB: 82,
    assetsInstalled: false,
    requires: ['Noto Sans SC', 'zh narration voice', 'zh translation model'],
  },
  {
    code: 'ko',
    name: 'Korean',
    native: '한국어',
    script: 'Hangul',
    translation: 'none',
    captions: 'partial',
    narration: 'none',
    packMB: 68,
    assetsInstalled: false,
    requires: ['Noto Sans KR', 'ko translation model'],
  },
  {
    code: 'ar',
    name: 'Arabic',
    native: 'العربية',
    script: 'Arabic',
    translation: 'partial',
    captions: 'partial',
    narration: 'full',
    packMB: 61,
    assetsInstalled: false,
    requires: ['Noto Sans Arabic', 'ar narration voice', 'ar translation model'],
  },
  {
    code: 'sw',
    name: 'Swahili',
    native: 'Kiswahili',
    script: 'Latin',
    translation: 'none',
    captions: 'partial',
    narration: 'partial',
    packMB: 22,
    assetsInstalled: false,
    requires: ['sw narration voice', 'sw translation model'],
  },
];

const BY_CODE = new Map(LANGUAGES.map((l) => [l.code, l]));

export function getLanguage(code: string): LanguageEntry | undefined {
  return BY_CODE.get(code);
}

export function languageName(code: string): string {
  return BY_CODE.get(code)?.name ?? code.toUpperCase();
}

export function languageNative(code: string): string {
  return BY_CODE.get(code)?.native ?? code;
}

/** Filter by name, native name, code or script. */
export function searchLanguages(query: string): LanguageEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return LANGUAGES;
  return LANGUAGES.filter((l) =>
    [l.name, l.native, l.code, l.script].some((v) => v.toLowerCase().includes(q)),
  );
}

/**
 * Distinguishes "listed" from "assets installed" from "genuinely usable offline",
 * which requires local assets AND a device voice AND caption coverage.
 */
export function offlineState(entry: LanguageEntry, hasDeviceVoice: boolean): OfflineState {
  if (entry.assetsInstalled && hasDeviceVoice && entry.captions !== 'none') return 'ready';
  if (entry.assetsInstalled) return 'assets';
  if (hasDeviceVoice) return 'voice';
  return 'listed';
}

export const OFFLINE_STATE_LABEL: Record<OfflineState, string> = {
  ready: 'Offline ready',
  assets: 'Assets installed · no voice',
  voice: 'Voice installed · packs missing',
  listed: 'Listed only',
};

/** Names of the things "Prepare for offline use" will install. */
export function requiredAssets(entry: LanguageEntry): string[] {
  return entry.requires.length ? entry.requires : ['Built-in — nothing to download'];
}