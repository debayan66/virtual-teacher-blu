import { useEffect, useState } from 'react';

/**
 * Live device voice probe.
 *
 * Uses the platform speech synthesiser so a language is only described as
 * able to narrate offline when this machine actually has a voice for it.
 */
export interface DeviceVoice {
  code: string; // normalised BCP-47 prefix, e.g. 'hi'
  fullLang: string; // e.g. 'hi-IN'
  name: string;
  localService: boolean;
}

function normalise(lang: string): string {
  return lang.toLowerCase().replace('_', '-');
}

function collect(): DeviceVoice[] {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return [];
  const seen = new Map<string, DeviceVoice>();
  for (const v of window.speechSynthesis.getVoices()) {
    const lang = normalise(v.lang);
    const prefix = lang.split('-')[0];
    if (!seen.has(prefix)) {
      seen.set(prefix, {
        code: prefix,
        fullLang: v.lang,
        name: v.name,
        localService: v.localService,
      });
    }
  }
  return [...seen.values()];
}

export function useDeviceVoices(): { voices: DeviceVoice[]; ready: boolean; supported: boolean } {
  const [voices, setVoices] = useState<DeviceVoice[]>([]);
  const [ready, setReady] = useState(false);
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  useEffect(() => {
    if (!supported) {
      setReady(true);
      return;
    }
    const load = () => {
      const list = collect();
      setVoices(list);
      setReady(true);
    };
    load();
    window.speechSynthesis.addEventListener('voiceschanged', load);
    // Some engines populate the list asynchronously without firing the event.
    const t = window.setTimeout(load, 400);
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', load);
      window.clearTimeout(t);
    };
  }, [supported]);

  return { voices, ready, supported };
}

export function findVoice(voices: DeviceVoice[], langCode: string): DeviceVoice | undefined {
  const prefix = langCode.toLowerCase().split('-')[0];
  return voices.find((v) => v.code === prefix);
}