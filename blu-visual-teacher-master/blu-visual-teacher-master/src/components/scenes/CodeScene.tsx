import { motion, AnimatePresence } from 'framer-motion';
import { useMemo } from 'react';
import type { CodeScene as CodeSceneData, Tone } from '../../lib/types';

interface Props {
  scene: CodeSceneData;
  t: number;
  reduced: boolean;
}

const KEYWORDS = /^(allow|deny|function|return|if|else|const|let|import|from|def|class|for|while)$/i;
const TONE_COLOR: Record<Tone, string> = {
  neutral: 'rgba(163,184,224,.8)',
  focus: '#FF7900',
  good: '#4ADE80',
  bad: '#FF6B6B',
  accent: '#4D8BFF',
};

interface Tok {
  text: string;
  cls: string;
}

function tokenize(line: string): Tok[] {
  const hash = line.indexOf('#');
  if (hash >= 0) {
    return [
      ...tokenize(line.slice(0, hash)),
      { text: line.slice(hash), cls: 'tok-comment' },
    ];
  }
  const out: Tok[] = [];
  const re = /([A-Za-z_][\w.]*)(=)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|(\b\d+(?:\.\d+)?\b)|([A-Za-z_][\w]*)|(\s+)|(.)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line))) {
    if (m[1]) {
      out.push({ text: m[1], cls: 'tok-key' });
      out.push({ text: '=', cls: 'tok-op' });
    } else if (m[3]) out.push({ text: m[3], cls: 'tok-str' });
    else if (m[4]) out.push({ text: m[4], cls: 'tok-num' });
    else if (m[5]) out.push({ text: m[5], cls: KEYWORDS.test(m[5]) ? 'tok-kw' : 'tok-plain' });
    else if (m[6]) out.push({ text: m[6], cls: 'tok-plain' });
    else out.push({ text: m[7] ?? '', cls: 'tok-plain' });
  }
  return out;
}

/**
 * Scene C — interactive code scene.
 * The current line, the annotation and the sample output all advance with
 * lesson playback time, so the panel teaches rather than merely displaying.
 */
export function CodeSceneView({ scene, t, reduced }: Props) {
  const activeBeat = useMemo(() => {
    let current = scene.beats[0];
    for (const b of scene.beats) if (t >= b.at) current = b;
    return t >= 0 ? current : scene.beats[0];
  }, [scene.beats, t]);

  const visibleProbes = scene.probes.filter((p) => t >= p.at);
  const activeLine = activeBeat.line;
  const tokens = useMemo(() => scene.lines.map(tokenize), [scene.lines]);

  return (
    <div className="scene scene-code">
      <div className="code-wrap">
        <div className="code-bar">
          <span className="code-tab">
            <span className="code-dot" />
            {scene.file}
          </span>
          <span className="code-bar-right">
            <span className="micro">{scene.language}</span>
            <span className="micro">line {activeLine} / {scene.lines.length}</span>
          </span>
        </div>

        <div className="code-cols">
          <div className="code-editor">
            {scene.lines.map((line, i) => {
              const n = i + 1;
              const on = n === activeLine;
              return (
                <motion.div
                  key={n}
                  className={on ? 'code-line is-active' : 'code-line'}
                  animate={{
                    backgroundColor: on ? 'rgba(255,121,0,.11)' : 'rgba(255,121,0,0)',
                    opacity: on ? 1 : 0.55,
                  }}
                  transition={{ duration: reduced ? 0 : 0.32, ease: [0.16, 1, 0.3, 1] }}
                >
                  <span className="code-n">{n}</span>
                  <code className="code-text">
                    {tokens[i].map((tk, j) => (
                      <span key={j} className={tk.cls}>
                        {tk.text}
                      </span>
                    ))}
                  </code>
                  {on && (
                    <motion.span
                      className="code-caret"
                      layoutId={undefined}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    />
                  )}
                </motion.div>
              );
            })}
          </div>

          <aside className="code-side">
            <div className="code-concept">
              <span className="micro">Concept</span>
              <b>First match wins</b>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeBeat.line}
                className="code-note"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
              >
                <span className="code-note-tag">Line {activeBeat.line} matters because</span>
                <p>{activeBeat.note}</p>
              </motion.div>
            </AnimatePresence>

            <div className="code-out">
              <div className="code-out-head">
                <span className="micro">Sample output</span>
                <span className="micro">{visibleProbes.length} / {scene.probes.length} probes</span>
              </div>
              <div className="code-out-body">
                {visibleProbes.length === 0 && (
                  <div className="code-out-empty">Output appears as the narration reaches each probe.</div>
                )}
                <AnimatePresence initial={false}>
                  {visibleProbes.map((p) => (
                    <motion.div
                      key={p.command}
                      className="probe"
                      initial={{ opacity: 0, x: -14 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <div className="probe-cmd">
                        <span className="probe-prompt">$</span>
                        {p.command}
                      </div>
                      <div className="probe-result" style={{ color: TONE_COLOR[p.tone] }}>
                        {p.result}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}