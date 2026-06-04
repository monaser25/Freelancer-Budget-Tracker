import { readdir, rm } from 'node:fs/promises';
import { join } from 'node:path';

const publicDir = join(process.cwd(), 'public');
const exact = new Set(['sw.js', 'sw.js.map']);
const generatedPrefixes = ['swe-worker-', 'workbox-'];

const shouldRemove = (name) => (
  exact.has(name) ||
  generatedPrefixes.some((prefix) => name.startsWith(prefix) && (name.endsWith('.js') || name.endsWith('.js.map')))
);

try {
  const entries = await readdir(publicDir);
  await Promise.all(
    entries
      .filter(shouldRemove)
      .map((name) => rm(join(publicDir, name), { force: true })),
  );
} catch (err) {
  if (err?.code !== 'ENOENT') throw err;
}
