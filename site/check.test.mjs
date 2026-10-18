import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { checkSite } from './check.mjs';

test('checks rendered links and decoded anchors without fetching external sites', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'reading-site-links-'));
  try {
    await writeFile(join(directory, 'index.html'), '<a href="reference.html?view=all#an%20idea">Read</a><a href="https://example.invalid/">External</a>');
    await writeFile(join(directory, 'reference.html'), '<h1 id="an idea">An idea</h1><a href="/">Home</a>');
    assert.deepEqual(await checkSite(directory), { pages: 2, links: 3 });

    await writeFile(join(directory, 'reference.html'), '<h1 id="changed">Changed</h1>');
    await assert.rejects(checkSite(directory), /Missing anchor #an%20idea/);

    await rm(join(directory, 'reference.html'));
    await assert.rejects(checkSite(directory), /Missing file reference.html/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('rejects local-machine URLs and missing image assets', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'reading-site-assets-'));
  try {
    await writeFile(join(directory, 'index.html'), '<a href="file:///private/note.md">Local</a><img src="missing.svg">');
    await assert.rejects(checkSite(directory), error => {
      assert.match(error.message, /Unsupported URL scheme file:/);
      assert.match(error.message, /Missing file missing.svg/);
      return true;
    });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
