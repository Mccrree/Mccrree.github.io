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

function publicCollection(collection) {
  return {
    id: collection.id,
    type: collection.type,
    code: collection.code,
    title: collection.title,
    subtitle: collection.subtitle,
    path: collection.route,
    completed: collection.completed,
    total: collection.total,
    percentage: collection.percentage,
    unit: collection.unit,
    units: collection.units.map((unit) => ({
      number: unit.number,
      numberLabel: unit.numberLabel,
      title: unit.title,
      slug: unit.slug,
      path: unit.url,
      completed: unit.exists && unit.valid,
      hasMath: unit.hasMath
    }))
  };
}

const report = await validateProject();
printReport(report);
if (report.errors.length > 0) process.exit(1);

assertGeneratedDirectory(generatedDir);
await fs.rm(generatedDir, { recursive: true, force: true });
await fs.mkdir(path.join(sourceDir, '_posts'), { recursive: true });

let completedTotal = 0;
for (const collection of report.collections) {
  const completed = collection.units.filter((unit) => unit.exists && unit.valid);
  completedTotal += completed.length;
  for (const unit of completed) {
    const previousDefinition = collection.units[unit.number - 2];
    const nextDefinition = collection.units[unit.number];
    const previous = previousDefinition?.exists && previousDefinition.valid ? previousDefinition : null;
    const next = nextDefinition?.exists && nextDefinition.valid ? nextDefinition : null;
    const dates = getGitDates(ROOT_DIR, unit.relativeFile);
    const generatedMarkdown = `${generatedFrontMatter(collection, unit, dates, previous, next)}${unit.bodyWithoutTitle ?? ''}`;
    const postDirectory = collection.generatedDirectory
      ? `_posts/${collection.generatedDirectory}`
      : '_posts';
    await writeText(`${postDirectory}/${unit.fileName}`, generatedMarkdown);
    try {
      await fs.access(unit.assetDir);
      await fs.cp(unit.assetDir, path.join(sourceDir, ...postDirectory.split('/'), unit.stem), { recursive: true });
    } catch {
      // Asset directories are optional.
    }
  }
}

const learning = {
  site: report.site,
  collections: report.collections.map(publicCollection)
};
const learningJson = `${JSON.stringify(learning, null, 2)}\n`;
await fs.mkdir(generatedDir, { recursive: true });
await fs.writeFile(path.join(generatedDir, 'learning.json'), learningJson, 'utf8');
await writeText('_data/learning.json', learningJson);

await writeText('index.md', `---
layout: page
title: ""
comments: false
toc:
  enable: false
header: false
---
{% learning_home %}
`);

for (const collection of report.collections) {
  await writeText(`${collection.id}/index.md`, `---
layout: page
title: ""
comments: false
toc:
  enable: false
header: false
---
{% learning_collection ${collection.id} %}
`);
}

await writeText('tags/index.md', `---
layout: page
title: Tags
type: tags
comments: false
---
`);
if (completedTotal === 0) {
  await writeText('archives/index.md', `---
layout: page
title: Archives
comments: false
---

No learning notes have been published yet.
`);
}

const aboutSource = await fs.readFile(path.join(ROOT_DIR, 'site', 'pages', 'about.md'), 'utf8');
await writeText('about/index.md', aboutSource);

const summary = report.collections
  .map((collection) => `${collection.completed}/${collection.total} ${collection.unit.plural}`)
  .join(', ');
console.log(`Prepared learning collections in .generated/source: ${summary}.`);
