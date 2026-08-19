import fs from 'node:fs/promises';
import path from 'node:path';

import {
  ROOT_DIR,
  generatedFrontMatter,
  getGitDates,
  printReport,
  validateProject
} from './lib/content-pipeline.mjs';

const generatedDir = path.join(ROOT_DIR, '.generated');
const sourceDir = path.join(generatedDir, 'source');

function assertGeneratedDirectory(target) {
  if (path.dirname(target) !== ROOT_DIR || path.basename(target) !== '.generated') {
    throw new Error(`Refusing to reset unexpected directory: ${target}`);
  }
}

async function writeText(relativePath, content) {
  const target = path.join(sourceDir, ...relativePath.split('/'));
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, content, 'utf8');
}

const report = await validateProject();
printReport(report);
if (report.errors.length > 0) process.exit(1);

assertGeneratedDirectory(generatedDir);
await fs.rm(generatedDir, { recursive: true, force: true });
await fs.mkdir(path.join(sourceDir, '_posts'), { recursive: true });

const completed = report.chapters.filter((chapter) => chapter.exists && chapter.valid);
for (const chapter of completed) {
  const previousDefinition = report.chapters[chapter.number - 2];
  const nextDefinition = report.chapters[chapter.number];
  const previous = previousDefinition?.exists && previousDefinition.valid ? previousDefinition : null;
  const next = nextDefinition?.exists && nextDefinition.valid ? nextDefinition : null;
  const dates = getGitDates(ROOT_DIR, chapter.relativeFile);
  const generatedMarkdown = `${generatedFrontMatter(chapter, dates, previous, next)}${chapter.bodyWithoutTitle ?? ''}`;
  await writeText(`_posts/${chapter.fileName}`, generatedMarkdown);
  try {
    await fs.access(chapter.assetDir);
    await fs.cp(chapter.assetDir, path.join(sourceDir, '_posts', chapter.stem), { recursive: true });
  } catch {
    // Asset directories are optional.
  }
}

const progress = {
  title: 'Understanding Deep Learning',
  completed: completed.length,
  total: report.chapters.length,
  percentage: Math.round((completed.length / report.chapters.length) * 100),
  chapters: report.chapters.map((chapter) => ({
    number: chapter.number,
    numberLabel: chapter.numberLabel,
    title: chapter.title,
    slug: chapter.slug,
    path: chapter.url,
    completed: chapter.exists && chapter.valid,
    hasMath: chapter.hasMath
  }))
};

await fs.mkdir(generatedDir, { recursive: true });
await fs.writeFile(path.join(generatedDir, 'learning.json'), `${JSON.stringify(progress, null, 2)}\n`, 'utf8');
await writeText('_data/learning.json', `${JSON.stringify(progress, null, 2)}\n`);

const dashboardPage = `---
layout: page
title: ""
comments: false
toc:
  enable: false
header: false
---
{% learning_dashboard %}
`;
await writeText('index.md', dashboardPage);
await writeText('deep-learning/index.md', dashboardPage);
await writeText('tags/index.md', `---
layout: page
title: Tags
type: tags
comments: false
---
`);
if (completed.length === 0) {
  await writeText('archives/index.md', `---
layout: page
title: Archives
comments: false
---

尚无已发布的 Chapter。
`);
}

const aboutSource = await fs.readFile(path.join(ROOT_DIR, 'site', 'pages', 'about.md'), 'utf8');
await writeText('about/index.md', aboutSource);

console.log(`Prepared ${completed.length}/21 Chapter(s) in .generated/source.`);
