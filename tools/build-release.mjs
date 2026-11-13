// Builds the release files for this module: <out>/module.zip and <out>/module.json (default out: dist/).
// No dependencies (Node 18+). Run from the repository root:
//   node tools/build-release.mjs                  build dist/module.zip and dist/module.json
//   node tools/build-release.mjs --dry-run        list what would ship
//   node tools/build-release.mjs --tag v1.2.3     check the tag matches module.json's version and point
//                                                 "download" at that tag's module.zip (in the built files only)
//   node tools/build-release.mjs --out <dir>      write somewhere else
// Every path in the zip sits under "<id>/". Development files never ship: tests/, tools/, node_modules/,
// dist/, dot files, *.test.mjs, OS clutter, and any extra patterns in .zipignore (one glob per line).
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const option = name => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : null; };
const fail = message => { console.error(message); process.exit(1); };

const manifestText = fs.readFileSync(path.join(root, 'module.json'), 'utf8');
const manifest = JSON.parse(manifestText);
if (!manifest.id || !manifest.version) fail('module.json needs an id and a version.');

// The download link always names the version's tag, so an old manifest keeps pointing at its own zip.
const tag = option('--tag');
let manifestOut = manifestText;
if (tag) {
  if (tag !== `v${manifest.version}`) fail(`Tag ${tag} does not match module.json version ${manifest.version} (expected v${manifest.version}).`);
  if (!/^https:\/\/github\.com\/[^/]+\/[^/]+$/.test(manifest.url ?? '')) fail('module.json "url" must be the GitHub repository URL.');
  const download = `${manifest.url}/releases/download/${tag}/module.zip`;
  if (manifest.download !== download) {
    manifest.download = download;
    manifestOut = `${JSON.stringify(manifest, null, 2)}\n`;
    console.log(`download set to ${download}`);
  }
} else if (manifest.download && !manifest.download.endsWith(`/v${manifest.version}/module.zip`)) {
  console.warn(`Warning: "download" does not point at v${manifest.version}: ${manifest.download}`);
}

const DEFAULT_EXCLUDES = ['tests/**', 'tools/**', 'node_modules/**', 'dist/**', '**/.*', '**/.*/**', 'UI-REFRESH.md', '**/*.test.mjs', '**/Thumbs.db', '**/desktop.ini'];
const ignoreFile = path.join(root, '.zipignore');
const extra = fs.existsSync(ignoreFile) ? fs.readFileSync(ignoreFile, 'utf8').split(/\r?\n/).map(s => s.trim()).filter(s => s && !s.startsWith('#')) : [];
// Globs: "**/" any folders (or none), "/**" everything below, "*" within one path segment.
function globToRegExp(glob) {
  let re = '';
  for (let i = 0; i < glob.length; i++) {
    if (glob.startsWith('**/', i)) { re += '(?:.*/)?'; i += 2; }
    else if (glob.startsWith('/**', i) && i + 3 === glob.length) { re += '(?:/.*)?'; i += 2; }
    else if (glob[i] === '*') re += '[^/]*';
    else if (glob[i] === '?') re += '[^/]';
    else re += glob[i].replace(/[.+^${}()|[\]\\]/g, '\\$&');
  }
  return new RegExp(`^${re}$`);
}
const excludes = [...DEFAULT_EXCLUDES, ...extra].map(globToRegExp);
const excluded = rel => excludes.some(re => re.test(rel));
function collect(dir, rel = '') {
  const out = [];
  for (const entry of fs.readdirSync(dir, {withFileTypes:true}).sort((a, b) => a.name.localeCompare(b.name))) {
    const childRel = rel ? `${rel}/${entry.name}` : entry.name;
    if (excluded(childRel) || excluded(`${childRel}/`)) continue;
    if (entry.isDirectory()) out.push(...collect(path.join(dir, entry.name), childRel));
    else if (entry.isFile()) out.push(childRel);
  }
  return out;
}
const files = collect(root);
for (const required of ['module.json', ...(manifest.esmodules ?? []), ...(manifest.styles ?? []), ...(manifest.languages ?? []).map(l => l.path)])
  if (!files.includes(required)) fail(`Missing required file: ${required}`);

if (args.includes('--dry-run')) {
  for (const f of files) console.log(`${manifest.id}/${f}`);
  console.log(`${files.length} files would go into module.zip`);
  process.exit(0);
}

// Minimal zip writer (deflate, forward-slash names, UTF-8 flag).
const crcTable = Array.from({length:256}, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc32 = buf => zlib.crc32 ? zlib.crc32(buf) : (() => { let c = 0xffffffff; for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; })();
const dosTime = date => ({time:(date.getHours() << 11) | (date.getMinutes() << 5) | (date.getSeconds() >> 1), date:((date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate()});
const locals = [], centrals = []; let offset = 0;
for (const rel of files) {
  const name = Buffer.from(`${manifest.id}/${rel}`, 'utf8');
  const data = rel === 'module.json' ? Buffer.from(manifestOut, 'utf8') : fs.readFileSync(path.join(root, rel));
  const deflated = zlib.deflateRawSync(data, {level:9}), store = deflated.length >= data.length, body = store ? data : deflated;
  const {time, date} = dosTime(fs.statSync(path.join(root, rel)).mtime), crc = crc32(data);
  const local = Buffer.alloc(30);
  local.writeUInt32LE(0x04034b50, 0); local.writeUInt16LE(20, 4); local.writeUInt16LE(0x0800, 6); local.writeUInt16LE(store ? 0 : 8, 8);
  local.writeUInt16LE(time, 10); local.writeUInt16LE(date, 12); local.writeUInt32LE(crc, 14); local.writeUInt32LE(body.length, 18); local.writeUInt32LE(data.length, 22); local.writeUInt16LE(name.length, 26);
  const central = Buffer.alloc(46);
  central.writeUInt32LE(0x02014b50, 0); central.writeUInt16LE(20, 4); central.writeUInt16LE(20, 6); central.writeUInt16LE(0x0800, 8); central.writeUInt16LE(store ? 0 : 8, 10);
  central.writeUInt16LE(time, 12); central.writeUInt16LE(date, 14); central.writeUInt32LE(crc, 16); central.writeUInt32LE(body.length, 20); central.writeUInt32LE(data.length, 24); central.writeUInt16LE(name.length, 28); central.writeUInt32LE(offset, 42);
  locals.push(local, name, body); centrals.push(central, name); offset += local.length + name.length + body.length;
}
const centralSize = centrals.reduce((n, b) => n + b.length, 0), end = Buffer.alloc(22);
end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(files.length, 8); end.writeUInt16LE(files.length, 10); end.writeUInt32LE(centralSize, 12); end.writeUInt32LE(offset, 16);
const outDir = path.resolve(root, option('--out') ?? 'dist');
fs.mkdirSync(outDir, {recursive:true});
fs.writeFileSync(path.join(outDir, 'module.zip'), Buffer.concat([...locals, ...centrals, end]));
fs.writeFileSync(path.join(outDir, 'module.json'), manifestOut);
console.log(`Wrote ${path.join(outDir, 'module.zip')} (${files.length} files) and module.json for ${manifest.id} ${manifest.version}.`);
