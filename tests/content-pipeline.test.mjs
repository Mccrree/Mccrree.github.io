import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  ROOT_DIR,
  generatedFrontMatter,
  validateProject
} from '../tools/lib/content-pipeline.mjs';

async function createFixture() {
  const rootDir = await fs.mkdtemp(path.join(os.tmpdir(), 'learning-site-'));
  await fs.mkdir(path.join(rootDir, 'data'), { recursive: true });
  await fs.mkdir(path.join(rootDir, 'content', 'chapters'), { recursive: true });
  await fs.mkdir(path.join(rootDir, 'content', 'comp2022'), { recursive: true });
  for (const file of ['courses.json', 'chapters.json', 'comp2022.json']) {
    await fs.copyFile(path.join(ROOT_DIR, 'data', file), path.join(rootDir, 'data', file));
  }
  return rootDir;
}

function collection(report, id) {
  return report.collections.find((item) => item.id === id);
}

test('a clean Deep Learning chapter is valid and its H1 is omitted from the generated body', async (context) => {
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

test('a missing note image is a build error', async (context) => {
  const rootDir = await createFixture();
  context.after(() => fs.rm(rootDir, { recursive: true, force: true }));
  await fs.writeFile(
    path.join(rootDir, 'content', 'chapters', '01-introduction.md'),
    '# Introduction\n\n![Missing](missing.svg)\n',
    'utf8'
  );

  const report = await validateProject({ rootDir });
  assert.equal(report.chapters[0].valid, false);
  assert.match(report.errors.map((item) => item.message).join('\n'), /Image does not exist/);
});

test('an H1 that disagrees with its manifest is a build error', async (context) => {
  const rootDir = await createFixture();
  context.after(() => fs.rm(rootDir, { recursive: true, force: true }));
  await fs.writeFile(
    path.join(rootDir, 'content', 'chapters', '01-introduction.md'),
    '# Different Title\n',
    'utf8'
  );

  const report = await validateProject({ rootDir });
  assert.equal(report.chapters[0].valid, false);
  assert.match(report.errors.map((item) => item.message).join('\n'), /H1 must be/);
});

test('all 12 planned COMP2022 weeks may exist without empty Markdown files', async (context) => {
  const rootDir = await createFixture();
  context.after(() => fs.rm(rootDir, { recursive: true, force: true }));

  const report = await validateProject({ rootDir });
  const course = collection(report, 'comp2022');
  assert.equal(report.errors.length, 0);
  assert.equal(course.total, 12);
  assert.equal(course.completed, 0);
  assert.equal(course.units.every((unit) => !unit.exists), true);
});

test('a valid COMP2022 week gets a course-scoped stable URL', async (context) => {
  const rootDir = await createFixture();
  context.after(() => fs.rm(rootDir, { recursive: true, force: true }));
  await fs.writeFile(
    path.join(rootDir, 'content', 'comp2022', '01-reasoning-about-python-and-tiny-python.md'),
    '# Reasoning about Python & Tiny Python\n\n## Notes\n\nCourse text.\n',
    'utf8'
  );

  const report = await validateProject({ rootDir });
  const course = collection(report, 'comp2022');
  assert.equal(report.errors.length, 0);
  assert.equal(course.completed, 1);
  assert.equal(course.units[0].url, '/comp2022/01-reasoning-about-python-and-tiny-python/');
  assert.equal(report.chapters[0].url, '/deep-learning/01-introduction/');
});

test('generated COMP2022 metadata includes course tags and course-scoped navigation', async (context) => {
  const rootDir = await createFixture();
  context.after(() => fs.rm(rootDir, { recursive: true, force: true }));
  for (const [fileName, title] of [
    ['01-reasoning-about-python-and-tiny-python.md', 'Reasoning about Python & Tiny Python'],
    ['02-regular-expressions.md', 'Regular Expressions']
  ]) {
    await fs.writeFile(path.join(rootDir, 'content', 'comp2022', fileName), `# ${title}\n`, 'utf8');
  }

  const report = await validateProject({ rootDir });
  const course = collection(report, 'comp2022');
  const frontMatter = generatedFrontMatter(
    course,
    course.units[1],
    { published: '2026-01-01T00:00:00Z', updated: '2026-01-01T00:00:00Z' },
    course.units[0],
    null
  );
  assert.match(frontMatter, /course: "COMP2022"/);
  assert.match(frontMatter, /- "COMP2022"/);
  assert.match(frontMatter, /- "Models of Computation"/);
  assert.match(frontMatter, /prev_unit_path: "\/comp2022\/01-reasoning-about-python-and-tiny-python\/"/);
  assert.doesNotMatch(frontMatter, /\/deep-learning\//);
});

test('duplicate week numbers and slugs are manifest errors', async (context) => {
  const rootDir = await createFixture();
  context.after(() => fs.rm(rootDir, { recursive: true, force: true }));
  const manifestPath = path.join(rootDir, 'data', 'comp2022.json');
  const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
  manifest[1].number = manifest[0].number;
  manifest[1].slug = manifest[0].slug;
  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

  const report = await validateProject({ rootDir });
  const messages = report.errors.map((item) => item.message).join('\n');
  assert.match(messages, /Unit number is duplicated/);
  assert.match(messages, /Slug is duplicated/);
});

test('a Markdown filename not declared by its course manifest is an error', async (context) => {
  const rootDir = await createFixture();
  context.after(() => fs.rm(rootDir, { recursive: true, force: true }));
  await fs.writeFile(path.join(rootDir, 'content', 'comp2022', '04-wrong-name.md'), '# Automata\n', 'utf8');

  const report = await validateProject({ rootDir });
  assert.match(report.errors.map((item) => item.message).join('\n'), /Markdown filename is not defined/);
});

test('collection routes cannot collide across courses', async (context) => {
  const rootDir = await createFixture();
  context.after(() => fs.rm(rootDir, { recursive: true, force: true }));
  const configPath = path.join(rootDir, 'data', 'courses.json');
  const config = JSON.parse(await fs.readFile(configPath, 'utf8'));
  config.collections[1].route = config.collections[0].route;
  await fs.writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`, 'utf8');

  const report = await validateProject({ rootDir });
  assert.match(report.errors.map((item) => item.message).join('\n'), /route is duplicated|collides with another route/);
});

test('an unclosed fenced code block is an error', async (context) => {
  const rootDir = await createFixture();
  context.after(() => fs.rm(rootDir, { recursive: true, force: true }));
  await fs.writeFile(
    path.join(rootDir, 'content', 'comp2022', '02-regular-expressions.md'),
    '# Regular Expressions\n\n```python\nprint("open")\n',
    'utf8'
  );

  const report = await validateProject({ rootDir });
  assert.match(report.errors.map((item) => item.message).join('\n'), /Code fence is not closed/);
});
