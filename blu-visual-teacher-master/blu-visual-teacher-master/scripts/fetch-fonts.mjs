#!/usr/bin/env node
/** Build-time font fetcher: bundles OFL woff2 files into public/fonts. */
import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const OUT = path.resolve('public/fonts');
const KEEP = new Set(['latin', 'latin-ext', 'devanagari']);

const FAMILIES = [
  { q: 'Space+Grotesk:wght@400..700', slug: 'space-grotesk' },
  { q: 'Inter:wght@400..700', slug: 'inter' },
  { q: 'JetBrains+Mono:wght@400..700', slug: 'jetbrains-mono' },
  { q: 'Noto+Sans+Devanagari:wght@400..700', slug: 'noto-devanagari' },
];

async function get(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(res.status + ' ' + url);
  return res;
}

const faces = [];
await mkdir(OUT, { recursive: true });

for (const fam of FAMILIES) {
  const text = await get('https://fonts.googleapis.com/css2?family=' + fam.q + '&display=swap').then((r) => r.text());
  const blocks = text.split('/*').map((b) => b.trim()).filter(Boolean);
  for (const block of blocks) {
    const subset = block.slice(0, block.indexOf('*/')).trim();
    if (!KEEP.has(subset)) continue;
    const family = /font-family:\s*'([^']+)'/.exec(block)?.[1];
    const weight = /font-weight:\s*([^;]+);/.exec(block)?.[1]?.trim() || '400';
    const url = /url\((https:\/\/[^)]+\.woff2)\)/.exec(block)?.[1];
    const range = /unicode-range:\s*([^;]+);/.exec(block)?.[1]?.trim();
    if (!family || !url) continue;
    const file = fam.slug + '-' + subset + '-' + weight.replace(/\s+/g, '_') + '.woff2';
    const dest = path.join(OUT, file);
    if (!existsSync(dest)) {
      const buf = Buffer.from(await get(url).then((r) => r.arrayBuffer()));
      await writeFile(dest, buf);
      console.log('saved', file, (buf.length / 1024).toFixed(1) + 'kB');
    }
    faces.push(
      "@font-face{font-family:'" + family + "';font-style:normal;font-weight:" + weight +
        ";font-display:swap;src:url('/fonts/" + file + "') format('woff2');" +
        (range ? 'unicode-range:' + range + ';' : '') + '}',
    );
  }
}

const header = '/* Bundled OFL fonts. No runtime CDN or font service is used.\n   Fetched once by scripts/fetch-fonts.mjs. */\n';
await writeFile(path.resolve('src/styles/fonts.css'), header + faces.join('\n') + '\n');
console.log('wrote src/styles/fonts.css with ' + faces.length + ' faces');
