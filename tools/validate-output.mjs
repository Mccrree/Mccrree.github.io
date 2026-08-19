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
  if (h1Count > 1) {
    errors.push(`${relative}: expected at most one H1, found ${h1Count}.`);
  }
  if (!/<meta\s+name=["']viewport["']/i.test(html)) {
    errors.push(`${relative}: missing viewport metadata.`);
  }
  if (/<mjx-merror\b|data-mjx-error=/i.test(html)) {
    errors.push(`${relative}: MathJax reported a rendering error.`);
  }
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

for (const expected of ['index.html', 'deep-learning/index.html', 'archives/index.html', 'tags/index.html', 'about/index.html', 'search.xml']) {
  if (!relativeFiles.has(expected)) errors.push(`Missing required output: ${expected}`);
}

for (const dashboard of ['index.html', 'deep-learning/index.html']) {
  if (!/<section class=["']learning-dashboard["']/i.test(htmlByFile.get(dashboard) ?? '')) {
    errors.push(`${dashboard}: missing learning dashboard.`);
  }
}

const progress = JSON.parse(await fs.readFile(path.join(ROOT_DIR, '.generated', 'learning.json'), 'utf8'));
for (const chapter of progress.chapters.filter((item) => item.completed && item.hasMath)) {
  const target = `${chapter.path.replace(/^\//, '')}index.html`;
  const html = htmlByFile.get(target) ?? '';
  if (!/\\(?:\(|\[)/.test(html)) {
    errors.push(`${target}: source contains math but no Pandoc math delimiters were found.`);
  }
  if (!/js\/third-party\/math\/mathjax\.js/i.test(html)
      || !/data-name=["']enableMath["'][^>]*>true<\/script>/i.test(html)) {
    errors.push(`${target}: source contains math but the on-demand MathJax loader is not enabled.`);
  }
}

if (errors.length > 0) {
  for (const error of errors) console.error(`[ERROR] ${error}`);
  console.error(`Output check failed with ${errors.length} error(s).`);
  process.exitCode = 1;
} else {
  console.log(`Output check: ${relativeFiles.size} files and ${htmlFiles.length} HTML pages valid.`);
}
