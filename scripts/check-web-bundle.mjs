import {readFileSync, statSync} from 'node:fs';
import {resolve} from 'node:path';
import {gzipSync} from 'node:zlib';

const root = resolve(process.env.CARDMAGIC_CLOUDFLARE_OUTPUT_DIR || 'dist');
const html = readFileSync(resolve(root, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g)].map(match => match[1]);
let bytes = 0;
let gzipBytes = 0;
for (const script of scripts) {
  if (/^https?:/.test(script)) continue;
  const path = resolve(root, script.replace(/^\//, ''));
  if (!path.startsWith(root + '/')) throw new Error('Bundle path escaped the output directory.');
  bytes += statSync(path).size;
  gzipBytes += gzipSync(readFileSync(path)).length;
}
// 2026-09-05: same-source baseline 5,386,199 bytes / 1,025,904 gzip.
// Used-icons baseline 3,619,354 bytes / 858,740 gzip. Leave a narrow margin.
console.log(JSON.stringify({check: 'initial-web-bundle', bytes, gzipBytes}));
if (bytes === 0 || bytes > 3_800_000 || gzipBytes > 900_000) {
  throw new Error('Initial web bundle exceeded its budget. Measure and explain growth before changing the limit.');
}
