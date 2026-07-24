import fs from 'node:fs';
import assert from 'node:assert/strict';

const read = p => fs.readFileSync(p, 'utf8');
const core = read('app-core.html');
const index = read('index.html');
const runtime = read('v11.js');
const sw = read('sw.js');

function extractWords(html) {
  const marker = 'const WORDS=';
  const pos = html.indexOf(marker);
  assert.ok(pos >= 0, 'WORDS array marker missing');
  const start = html.indexOf('[', pos + marker.length);
  assert.ok(start >= 0, 'WORDS array start missing');
  let depth = 0, quote = false, escaped = false;
  for (let i = start; i < html.length; i++) {
    const ch = html[i];
    if (quote) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') quote = false;
      continue;
    }
    if (ch === '"') { quote = true; continue; }
    if (ch === '[') depth++;
    else if (ch === ']') {
      depth--;
      if (depth === 0) return JSON.parse(html.slice(start, i + 1));
    }
  }
  throw new Error('WORDS array end missing');
}

const words = extractWords(core);
assert.equal(words.length, 1000, 'deck must contain exactly 1000 words');
assert.equal(new Set(words.map(w => w.id)).size, 1000, 'word ids must be unique');
assert.equal(new Set(words.map(w => w.en.toLowerCase())).size, 1000, 'English lemmas must be unique');
for (const w of words) {
  assert.ok(w.en && w.ru && w.ex && w.exRu && w.cloze, `incomplete card: ${w.id}`);
  assert.ok(w.cloze.includes('_____'), `cloze gap missing: ${w.en}`);
}

assert.match(index, /\.\/app-core\.html/, 'index must load same-origin app core');
assert.match(index, /\.\/v11\.js/, 'index must load v11 runtime');
assert.match(index, /\.\/v11\.css/, 'index must load v11 styles');
assert.ok(!index.includes('raw.githubusercontent.com'), 'index must not depend on Raw GitHub');
assert.match(sw, /app-core\.html/, 'service worker must cache app core');
assert.match(sw, /v11\.js/, 'service worker must cache v11 runtime');
assert.match(runtime, /indexedDB/, 'runtime must keep IndexedDB fallback');
assert.match(runtime, /buildSession=function/, 'runtime must override session scheduler');
assert.match(runtime, /teacherModeFor=function/, 'runtime must adapt exercise type');

console.log(`WordMemo smoke OK: ${words.length} cards, offline assets and v11 runtime validated.`);
