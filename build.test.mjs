import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { copyFile, mkdtemp, readFile, readdir, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

test('a clean build ships the assets referenced by the landing page', async t => {
  const source = fileURLToPath(new URL('.', import.meta.url));
  const sandbox = await mkdtemp(join(tmpdir(), 'vector-build-'));
  t.after(() => rm(sandbox, { recursive: true, force: true }));

  // Build from fresh inputs so leftovers from a previous run cannot hide omissions.
  for (const entry of await readdir(source, { withFileTypes: true })) {
    if (entry.isFile() && !entry.name.startsWith('.')) {
      await copyFile(join(source, entry.name), join(sandbox, entry.name));
    }
  }
  execFileSync(process.execPath, ['build.mjs'], { cwd: sandbox });

  const output = join(sandbox, 'public');
  const html = await readFile(join(output, 'index.html'), 'utf8');
  const page = new URL('https://demo.example/index.html');
  const references = html.matchAll(/<(?:img|script|link)\b[^>]*?\s(?:src|href)\s*=\s*["']([^"']+)["']/gi);
  const assets = new Set();
  for (const [, reference] of references) {
    const url = new URL(reference, page);
    if (url.origin === page.origin) assets.add(decodeURIComponent(url.pathname.slice(1)));
  }
  assert.ok(assets.size > 0, 'expected local asset references in the landing page');
  for (const asset of assets) {
    const file = await stat(join(output, asset));
    assert.ok(file.isFile() && file.size > 0, `missing or empty build asset: ${asset}`);
  }
});
