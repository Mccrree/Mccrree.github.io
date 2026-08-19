import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { ROOT_DIR, validateProject } from '../tools/lib/content-pipeline.mjs';

async function createFixture() {
  const rootDir = await fs.mkdtemp(path.join(os.tmpdir(), 'udl-site-'));
  await fs.mkdir(path.join(rootDir, 'data'), { recursive: true });
  await fs.mkdir(path.join(rootDir, 'content', 'chapters'), { recursive: true });
  await fs.copyFile(path.join(ROOT_DIR, 'data', 'chapters.json'), path.join(rootDir, 'data', 'chapters.json'));
  return rootDir;
}

test('a clean Chapter is valid and its H1 is mapped out of the rendered body', async (context) => {
  const rootDir = await createFixture();
  context.after(() => fs.rm(rootDir, { recursive: true, force: true }));
  await fs.mkdir(path.join(rootDir, 'content', 'chapters', '01-introduction'));
  await fs.writeFile(
    path.join(rootDir, 'content', 'chapters', '01-introduction.md'),
    '# Introduction\n\n## Notes\n\nTest text.\n\n![Diagram](diagram.svg)\n',
    'utf8'
  );
  await fs.writeFile(
    path.join(rootDir, 'content', 'chapters', '01-introduction', 'diagram.svg'),
    '<svg xmlns="http://www.w3.org/2000/svg"></svg>\n',
    'utf8'
  );

  const report = await validateProject({ rootDir });
  assert.equal(report.errors.length, 0);
  assert.equal(report.chapters[0].valid, true);
  assert.equal(report.chapters[0].bodyWithoutTitle.includes('# Introduction'), false);
  assert.equal(report.chapters[0].bodyWithoutTitle.includes('## Notes'), true);
});
test('a missing Chapter image is a build error', async (context) => {
  const rootDir = await createFixture();
  context.after(() => fs.rm(rootDir, { recursive: true, force: true }));
  await fs.writeFile(
    path.join(rootDir, 'content', 'chapters', '01-introduction.md'),
    '# Introduction\n\n![Missing](missing.svg)\n',
    'utf8'
  );

  const report = await validateProject({ rootDir });
  assert.equal(report.chapters[0].valid, false);
  assert.match(report.errors.map((item) => item.message).join('\n'), /图片不存在/);
});

test('an H1 that disagrees with the Manifest is a build error', async (context) => {
  const rootDir = await createFixture();
  context.after(() => fs.rm(rootDir, { recursive: true, force: true }));
  await fs.writeFile(
    path.join(rootDir, 'content', 'chapters', '01-introduction.md'),
    '# Different Title\n',
    'utf8'
  );

  const report = await validateProject({ rootDir });
  assert.equal(report.chapters[0].valid, false);
  assert.match(report.errors.map((item) => item.message).join('\n'), /H1 必须是/);
});
