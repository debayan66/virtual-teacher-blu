import type { Lesson } from './types';

/**
 * The sample lesson shipped with the app.
 * It is real lesson data, clearly marked as sample: no AI generation, no
 * narration audio and no video export are implied by its existence.
 */
export const SAMPLE_LESSON: Lesson = {
  id: 'sample-firewall',
  title: 'How a Firewall Protects a Network',
  topic: 'How a firewall protects a network',
  level: 'intermediate',
  durationMinutes: 1,
  languages: ['en', 'hi', 'es'],
  sample: true,
  sampleNote: 'Sample lesson — shipped with the app so the studio works with the backend offline.',
  createdAt: '2026-10-27T09:00:00.000Z',
  status: 'ready',
  scenes: [
    {
      id: 's1',
      kind: 'title',
      duration: 7,
      title: 'Title card',
      eyebrow: 'Network security · Lesson 01',
      headline: 'How a Firewall\nProtects a Network',
      sub: 'One box, one question: does this packet get in?',
      points: ['Inspect every packet', 'Allow what is trusted', 'Drop the rest'],
      narration: {
        en: 'A firewall sits between your network and the internet, and decides what is allowed in.',
        hi: 'फ़ायरवॉल आपके नेटवर्क और इंटरनेट के बीच बैठता है और तय करता है कि क्या अंदर आने देना है।',
        es: 'Un cortafuegos se sitúa entre tu red e Internet y decide qué puede entrar.',
      },
      captions: {
        en: [
          'Every packet entering your network',
          'faces a single decision:',
          'let it through, or drop it.',
        ],
        hi: [
          'आपके नेटवर्क में आने वाले हर पैकेट',
          'को एक ही फ़ैसला देना पड़ता है:',
          'आने दें — या रोक दें।',
        ],
        es: [
          'Cada paquete que entra en tu red',
          'enfrenta una sola decisión:',
          'pasarlo — o descartarlo.',
        ],
      },
    },
    {
      id: 's2',
      kind: 'diagram',
      duration: 19,
      title: 'Traffic flow',
      narration: {
        en: 'Traffic reaches the firewall and is checked against the rule set. Packets that match an allow rule continue to the server; packets that match a deny rule are stopped at the wall.',
        hi: 'ट्रैफ़िल फ़ायरवॉल तक पहुँचता है और नियम-सूची से जाँचा जाता है। अनुमति नियम से मेल खाने वाला पैकेट सर्वर तक जाता है; मना-है नियम से मेल खाने वाला वहीं रुक जाता है।',
        es: 'El tráfico llega al cortafuegos y se comprueba con las reglas. Los paquetes permitidos siguen hasta el servidor; los denegados se detienen en el muro.',
      },
      captions: {
        en: [
          'Traffic leaves the internet and reaches the firewall.',
          'The firewall checks each packet against its rules.',
          'Packets matching an allow rule continue to the server.',
          'Packets matching a deny rule are stopped here.',
        ],
        hi: [
          'ट्रैफ़िल इंटरनेट से निकलकर फ़ायरवॉल तक पहुँचता है।',
          'फ़ायरवॉल हर पैकेट को अपने नियमों से जाँचता है।',
          'अनुमति नियम से मेल खाने वाला पैकेट सर्वर तक जाता है।',
          'मना-है नियम से मेल खाने वाला पैकेट वहीं रुक जाता है।',
        ],
        es: [
          'El tráfico sale de Internet y llega al cortafuegos.',
          'El cortafuegos revisa cada paquete con sus reglas.',
          'Los paquetes permitidos continúan hacia el servidor.',
          'Los paquetes denegados se detienen aquí.',
        ],
      },
      nodes: [
        { id: 'net', x: 10, y: 50, label: 'Internet', sub: 'untrusted', tone: 'neutral', shape: 'cloud' },
        { id: 'fw', x: 44, y: 50, label: 'Firewall', sub: 'rule set', tone: 'focus', shape: 'box' },
        { id: 'srv', x: 83, y: 25, label: 'App server', sub: '10.0.4.12', tone: 'good', shape: 'box' },
        { id: 'drop', x: 83, y: 75, label: 'Dropped', sub: 'never delivered', tone: 'bad', shape: 'box' },
      ],
      edges: [
        { id: 'e1', from: 'net', to: 'fw', label: 'inbound', tone: 'neutral' },
        { id: 'e2', from: 'fw', to: 'srv', label: 'ALLOW · 443', tone: 'good' },
        { id: 'e3', from: 'fw', to: 'drop', label: 'DENY · 3389', tone: 'bad', dashed: true },
      ],
      steps: [
        { at: 0, action: 'show-node', node: 'net' },
        { at: 0.25, action: 'show-node', node: 'fw' },
        { at: 1.1, action: 'show-edge', edge: 'e1' },
        { at: 2.1, action: 'packet', edge: 'e1', tone: 'accent', label: 'HTTPS' },
        { at: 4.4, action: 'show-node', node: 'srv' },
        { at: 5.2, action: 'show-edge', edge: 'e2' },
        { at: 6.0, action: 'show-label', edge: 'e2' },
        { at: 7.0, action: 'packet', edge: 'e2', tone: 'good' },
        { at: 9.6, action: 'packet', edge: 'e1', tone: 'accent', label: 'RDP' },
        { at: 11.0, action: 'show-node', node: 'drop' },
        { at: 11.8, action: 'show-edge', edge: 'e3' },
        { at: 12.6, action: 'show-label', edge: 'e3' },
        { at: 13.6, action: 'packet', edge: 'e3', tone: 'bad' },
        { at: 15.8, action: 'mark', node: 'fw', tone: 'focus' },
      ],
      legend: [
        { label: 'Inspected', tone: 'neutral' },
        { label: 'Allowed through', tone: 'good' },
        { label: 'Stopped', tone: 'bad' },
      ],
    },
    {
      id: 's3',
      kind: 'code',
      duration: 17,
      title: 'Rule set',
      file: 'edge/firewall.rules',
      language: 'firewall',
      narration: {
        en: 'Rules are read from top to bottom and the first match wins. Port 443 stays open, Remote Desktop does not, and anything unmatched falls through to the final deny.',
        hi: 'नियम ऊपर से नीचे पढ़े जाते हैं और पहला मेल खाने वाला नियम फ़ैसला करता है। पोर्ट 443 खुला रहता है, Remote Desktop नहीं; बाकी सब अंतिम मना-है नियम तक चला जाता है।',
        es: 'Las reglas se leen de arriba abajo y gana la primera coincidencia. El puerto 443 sigue abierto, Remote Desktop no, y lo que no coincide cae en la denegación final.',
      },
      captions: {
        en: [
          'Rules are read from top to bottom.',
          'The first rule that matches decides the outcome.',
          'Port 443 stays open. Remote Desktop does not.',
          'Anything unmatched reaches the final deny.',
        ],
        hi: [
          'नियम ऊप से नीचे पढ़े जाते हैं।',
          'जो पहला नियम मेल खाता है, फ़ैसला उसी का होता है।',
          'पोर्ट 443 खुला रहता है, Remote Desktop नहीं।',
          'जो मेल नहीं खाता, वह अंतिम मना-है नियम तक पहुँचता है।',
        ],
        es: [
          'Las reglas se leen de arriba abajo.',
          'La primera regla que coincide decide el resultado.',
          'El puerto 443 sigue abierto. Remote Desktop no.',
          'Lo que no coincide llega a la denegación final.',
        ],
      },
      lines: [
        '# edge/firewall.rules — read top to bottom',
        'allow  proto=tcp  dport=443  from=any          # HTTPS',
        'allow  proto=tcp  dport=22   from=10.0.0.0/8   # office SSH',
        'deny   proto=tcp  dport=3389 from=any          # RDP exposed',
        'allow  proto=udp  dport=53   from=any          # DNS',
        'deny   proto=any  from=any                     # default: block',
      ],
      beats: [
        { at: 0.5, line: 1, note: 'Everything below is evaluated in order — position is policy.' },
        { at: 4.0, line: 2, note: 'Port 443 stays open so pages and APIs can load.' },
        { at: 7.2, line: 3, note: 'SSH answers only from inside the office range.' },
        { at: 10.4, line: 4, note: 'Remote Desktop reachable from anywhere = denied outright.' },
        { at: 13.8, line: 6, note: 'Unmatched traffic falls through to the final deny.' },
      ],
      probes: [
        {
          at: 2.6,
          command: 'blu-fw test src=198.51.100.7 dpt=443',
          result: 'ALLOW   matched rule 2',
          tone: 'good',
        },
        {
          at: 8.8,
          command: 'blu-fw test src=203.0.113.9 dpt=3389',
          result: 'DROP    matched rule 4',
          tone: 'bad',
        },
        {
          at: 15.0,
          command: 'blu-fw test src=203.0.113.9 dpt=8080',
          result: 'DROP    fell through to rule 6',
          tone: 'bad',
        },
      ],
    },
    {
      id: 's4',
      kind: 'title',
      duration: 8,
      title: 'Recap',
      eyebrow: 'Take these three',
      headline: 'Filter early.\nLog everything.\nDefault to deny.',
      sub: 'That is the whole craft of a firewall.',
      points: ['Inspect · allow · drop', 'Rules are ordered policy', 'Unknown traffic never wins'],
      narration: {
        en: 'Filter early, log everything, and default to deny. That is the whole craft of a firewall.',
        hi: 'जल्दी फ़िल्टर करें, सब कुछ लॉग करें, और मना-ही-मना रखें। फ़ायरवॉल का पूरा शिल्प यही है।',
        es: 'Filtra pronto, registra todo y deniega por defecto. Esa es toda la técnica del cortafuegos.',
      },
      captions: {
        en: ['Filter early, log everything,', 'and default to deny —', 'that is the whole craft.'],
        hi: ['जल्दी फ़िल्टर करें, सब कुछ लॉग करें,', 'और मना-ही-मना रखें —', 'फ़ायरवॉल का शिल्प यही है।'],
        es: ['Filtra pronto, registra todo', 'y deniega por defecto:', 'esa es la técnica.'],
      },
    },
  ],
};

/** Timeline helpers shared by the studio and the scene components. */
export function sceneStarts(lesson: Lesson): number[] {
  let t = 0;
  return lesson.scenes.map((s) => {
    const start = t;
    t += s.duration;
    return start;
  });
}

export function totalDuration(lesson: Lesson): number {
  return lesson.scenes.reduce((sum, s) => sum + s.duration, 0);
}

export function sceneAt(lesson: Lesson, time: number): number {
  const starts = sceneStarts(lesson);
  for (let i = lesson.scenes.length - 1; i >= 0; i--) {
    if (time >= starts[i]) return i;
  }
  return 0;
}