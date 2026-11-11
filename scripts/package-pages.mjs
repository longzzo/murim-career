import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, realpath, stat, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

if (process.argv.length !== 3) throw new Error('Usage: node scripts/package-pages.mjs <new-output-directory>');
const source = await realpath(fileURLToPath(new URL('../src/web-v1/', import.meta.url)));
const destination = resolve(process.argv[2]);
const artRoot = 'assets/art';
const manifestFile = artRoot + '/art-manifest.json';

async function readRuntimeFile(relative) {
  const path = join(source, relative);
  if (await realpath(path) !== path || !(await stat(path)).isFile()) {
    throw new Error('Expected a regular runtime file: ' + relative);
  }
  return readFile(path);
}

const manifestBytes = await readRuntimeFile(manifestFile);
const manifest = JSON.parse(manifestBytes);
if (manifest.schemaVersion !== 1 || !Array.isArray(manifest.assets) || !manifest.assets.length) {
  throw new Error('Invalid runtime art manifest');
}

const modules = (await readdir(source, { withFileTypes: true }))
  .filter(entry => entry.isFile() && /^[a-z0-9-]+\.mjs$/.test(entry.name))
  .map(entry => entry.name);
if (!modules.includes('ui.mjs')) throw new Error('Missing game entry module');

const files = new Map([[manifestFile, manifestBytes]]);
for (const path of [
  'index.html', 'style.css', ...modules,
  artRoot + '/skill-vfx-map.v001.json',
  artRoot + '/licenses/PIXELFX-LICENSE.txt',
  artRoot + '/licenses/PIXELFX-NOTICE.md',
  artRoot + '/licenses/PIXELFX-PROVENANCE.md',
]) {
  files.set(path, await readRuntimeFile(path));
}

async function includeAsset(file, expectedHash, pattern) {
  if (typeof file !== 'string' || !pattern.test(file)) throw new Error('Invalid runtime asset path: ' + file);
  const path = artRoot + '/' + file;
  const bytes = await readRuntimeFile(path);
  if (createHash('sha256').update(bytes).digest('hex') !== expectedHash) {
    throw new Error('Runtime asset hash mismatch: ' + path);
  }
  files.set(path, bytes);
}

for (const asset of manifest.assets) {
  await includeAsset(asset.file, asset.sha256, /^(?:backgrounds|characters|effects|ui)\/[a-z0-9_-]+\.(?:png|svg)$/i);
  if (asset.metadataFile) {
    await includeAsset(asset.metadataFile, asset.metadataSha256, /^effects\/[a-z0-9_-]+\.json$/i);
  }
}

await mkdir(destination);
for (const [relative, bytes] of files) {
  const path = join(destination, relative);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, bytes, { flag: 'wx' });
}
console.log(`Packaged ${files.size} game files from src/web-v1.`);
