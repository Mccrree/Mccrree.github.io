import fs from 'node:fs/promises';
import path from 'node:path';

import { ROOT_DIR, SITE_ORIGIN } from './lib/content-pipeline.mjs';

const publicDir = path.join(ROOT_DIR, 'public');
const errors = [];

async function listFiles(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await listFiles(fullPath));
    if (entry.isFile()) files.push(fullPath);
  }
  return files;
}

function publicTarget(pathname, files) {
  let relative;
  try {
    relative = decodeURIComponent(pathname).replace(/^\/+/, '');
  } catch {
    return null;
  }
  if (!relative) relative = 'index.html';
  const candidates = [relative];
  if (relative.endsWith('/')) candidates.push(`${relative}index.html`);
  if (!path.extname(relative)) candidates.push(`${relative}.html`, `${relative}/index.html`);
  return candidates.find((candidate) => files.has(candidate.replaceAll('\\', '/'))) ?? null;
}

function assertContains(relative, pattern, message) {
  if (!pattern.test(htmlByFile.get(relative) ?? '')) errors.push(`${relative}: ${message}`);
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const allFiles = await listFiles(publicDir);
const relativeFiles = new Set(allFiles.map((file) => path.relative(publicDir, file).replaceAll('\\', '/')));
const htmlFiles = allFiles.filter((file) => file.endsWith('.html'));
const idsByFile = new Map();
const htmlByFile = new Map();

for (const file of htmlFiles) {
  const relative = path.relative(publicDir, file).replaceAll('\\', '/');
  const html = await fs.readFile(file, 'utf8');
  htmlByFile.set(relative, html);
  idsByFile.set(relative, new Set([...html.matchAll(/\s(?:id|name)=["']([^"']+)["']/gi)].map((match) => match[1])));
  const h1Count = [...html.matchAll(/<h1\b/gi)].length;
  if (h1Count > 1) errors.push(`${relative}: expected at most one H1, found ${h1Count}.`);
  if (!/<meta\s+name=["']viewport["']/i.test(html)) errors.push(`${relative}: missing viewport metadata.`);
  if (/<mjx-merror\b|data-mjx-error=/i.test(html)) errors.push(`${relative}: MathJax reported a rendering error.`);
}

for (const [relative, html] of htmlByFile) {
  const route = relative === 'index.html' ? '/' : `/${relative.replace(/index\.html$/, '')}`;
  for (const match of html.matchAll(/\s(?:href|src)=["']([^"']+)["']/gi)) {
    const rawValue = match[1].replaceAll('&amp;', '&');
    if (!rawValue || rawValue === '#' || /^(?:mailto:|tel:|javascript:|data:)/i.test(rawValue)) continue;
    let url;
    try {
      url = new URL(rawValue, new URL(route, SITE_ORIGIN));
    } catch {
      errors.push(`${relative}: invalid URL ${rawValue}`);
      continue;
    }
    if (url.origin !== SITE_ORIGIN) continue;
    const target = publicTarget(url.pathname, relativeFiles);
    if (!target) {
      errors.push(`${relative}: broken internal resource ${rawValue}`);
      continue;
    }
    if (url.hash && url.hash !== '#') {
      const anchor = decodeURIComponent(url.hash.slice(1));
      if (target.endsWith('.html') && !idsByFile.get(target)?.has(anchor)) {
        errors.push(`${relative}: missing anchor ${rawValue}`);
      }
    }
  }
}

for (const expected of [
  'index.html',
  'deep-learning/index.html',
  'comp2022/index.html',
  'archives/index.html',
  'tags/index.html',
  'about/index.html',
  'search.xml'
]) {
  if (!relativeFiles.has(expected)) errors.push(`Missing required output: ${expected}`);
}

assertContains('index.html', /<section class=["']learning-home["']/i, 'missing learning homepage.');
assertContains('index.html', /Mccrree(?:&#39;|&apos;|')s Learning Notes/i, 'missing site title.');
assertContains('index.html', /href=["']\/deep-learning\/["']/i, 'missing Deep Learning collection link.');
assertContains('index.html', /href=["']\/comp2022\/["']/i, 'missing COMP2022 collection link.');
assertContains('deep-learning/index.html', /<section class=["']learning-dashboard["']/i, 'missing Deep Learning dashboard.');
assertContains('comp2022/index.html', /<section class=["']learning-dashboard["']/i, 'missing COMP2022 dashboard.');
assertContains('deep-learning/index.html', /href=["']\/deep-learning\/03-shallow-neural-networks\/["']/i, 'missing original Chapter 3 URL.');
assertContains('comp2022/index.html', /COMP2022/i, 'missing course code.');
assertContains('comp2022/index.html', /Models of Computation/i, 'missing course title.');

const learning = JSON.parse(await fs.readFile(path.join(ROOT_DIR, '.generated', 'learning.json'), 'utf8'));
const deepLearning = learning.collections.find((item) => item.id === 'deep-learning');
const comp2022 = learning.collections.find((item) => item.id === 'comp2022');
if (!deepLearning || deepLearning.total !== 21) {
  errors.push('Learning data: expected a 21-Chapter Deep Learning collection.');
}
if (!comp2022 || comp2022.total !== 12) {
  errors.push('Learning data: expected a 12-Week COMP2022 collection.');
}
if (!comp2022?.tutorialProgress || comp2022.tutorialProgress.total !== 12) {
  errors.push('Learning data: expected 12 planned COMP2022 Tutorials.');
}

for (const collection of learning.collections) {
  const actualCompleted = collection.units.filter((unit) => unit.completed).length;
  if (collection.completed !== actualCompleted || collection.total !== collection.units.length) {
    errors.push(`Learning data: inconsistent progress for ${collection.id}.`);
  }
  assertContains(
    'index.html',
    new RegExp(`${collection.completed}\\s*\\/\\s*${collection.total}\\s+${escapeRegExp(collection.unit.plural)}`, 'i'),
    `missing independent progress for ${collection.id}.`
  );
  if (collection.tutorialProgress) {
    const actualTutorials = collection.units.filter((unit) => unit.tutorial?.completed).length;
    if (collection.tutorialProgress.completed !== actualTutorials
        || collection.tutorialProgress.total !== collection.units.filter((unit) => unit.tutorial).length) {
      errors.push(`Learning data: inconsistent Tutorial progress for ${collection.id}.`);
    }
    assertContains(
      'index.html',
      new RegExp(`${collection.tutorialProgress.completed}\\s*\\/\\s*${collection.tutorialProgress.total}\\s+Tutorials`, 'i'),
      `missing independent Tutorial progress for ${collection.id}.`
    );
  }
}

const compHtml = htmlByFile.get('comp2022/index.html') ?? '';
const pendingWeeks = [...compHtml.matchAll(/class=["'][^"']*learning-path__item[^"']*is-pending[^"']*["']/gi)].length;
const expectedPendingWeeks = comp2022 ? comp2022.total - comp2022.completed : 0;
if (pendingWeeks !== expectedPendingWeeks) {
  errors.push(`comp2022/index.html: expected ${expectedPendingWeeks} pending weeks, found ${pendingWeeks}.`);
}
for (const week of comp2022?.units ?? []) {
  const linked = new RegExp(`<a\\s+href=["']${escapeRegExp(week.path)}["']`, 'i').test(compHtml);
  if (week.completed && !linked) errors.push(`comp2022/index.html: completed Week ${week.numberLabel} is not linked.`);
  if (!week.completed && linked) errors.push(`comp2022/index.html: planned Week ${week.numberLabel} links to a missing article.`);
}
const tutorialRows = [...compHtml.matchAll(/class=["'][^"']*learning-path__tutorial[^"']*["']/gi)].length;
const pendingTutorials = [...compHtml.matchAll(/class=["'][^"']*learning-path__tutorial[^"']*is-pending[^"']*["']/gi)].length;
const expectedTutorials = comp2022?.tutorialProgress?.total ?? 0;
const expectedPendingTutorials = expectedTutorials - (comp2022?.tutorialProgress?.completed ?? 0);
if (tutorialRows !== expectedTutorials) {
  errors.push(`comp2022/index.html: expected ${expectedTutorials} Tutorial rows, found ${tutorialRows}.`);
}
if (pendingTutorials !== expectedPendingTutorials) {
  errors.push(`comp2022/index.html: expected ${expectedPendingTutorials} pending Tutorials, found ${pendingTutorials}.`);
}
for (const week of comp2022?.units ?? []) {
  const tutorial = week.tutorial;
  if (!tutorial) continue;
  const linked = new RegExp(`<a\\s+href=["']${escapeRegExp(tutorial.path)}["']`, 'i').test(compHtml);
  if (tutorial.completed && !linked) errors.push(`comp2022/index.html: completed Tutorial ${tutorial.numberLabel} is not linked.`);
  if (!tutorial.completed && linked) errors.push(`comp2022/index.html: planned Tutorial ${tutorial.numberLabel} links to a missing article.`);
}
const generatedCompArticles = [...relativeFiles].filter((file) => /^comp2022\/\d{2}-[^/]+\/index\.html$/.test(file));
if (generatedCompArticles.length !== (comp2022?.completed ?? 0)) {
  errors.push(`COMP2022 output: expected ${comp2022?.completed ?? 0} article(s), found ${generatedCompArticles.length}.`);
}
const generatedTutorialArticles = [...relativeFiles].filter((file) => /^comp2022\/\d{2}-[^/]+\/tutorial\/index\.html$/.test(file));
if (generatedTutorialArticles.length !== (comp2022?.tutorialProgress?.completed ?? 0)) {
  errors.push(`COMP2022 output: expected ${comp2022?.tutorialProgress?.completed ?? 0} Tutorial article(s), found ${generatedTutorialArticles.length}.`);
}

for (const collection of learning.collections) {
  const articles = collection.units.flatMap((unit) => [unit, ...(unit.tutorial ? [unit.tutorial] : [])]);
  for (const unit of articles.filter((item) => item.completed && item.hasMath)) {
    const target = `${unit.path.replace(/^\//, '')}index.html`;
    const html = htmlByFile.get(target) ?? '';
    if (!/\\(?:\(|\[)/.test(html)) {
      errors.push(`${target}: source contains math but no Pandoc math delimiters were found.`);
    }
    if (!/js\/third-party\/math\/mathjax\.js/i.test(html)
        || !/data-name=["']enableMath["'][^>]*>true<\/script>/i.test(html)) {
      errors.push(`${target}: source contains math but the on-demand MathJax loader is not enabled.`);
    }
  }
}

if (errors.length > 0) {
  for (const error of errors) console.error(`[ERROR] ${error}`);
  console.error(`Output check failed with ${errors.length} error(s).`);
  process.exitCode = 1;
} else {
  console.log(`Output check: ${relativeFiles.size} files and ${htmlFiles.length} HTML pages valid.`);
}
