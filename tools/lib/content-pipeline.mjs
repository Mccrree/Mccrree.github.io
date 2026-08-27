import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import MarkdownIt from 'markdown-it';

const moduleDir = path.dirname(fileURLToPath(import.meta.url));
export const ROOT_DIR = path.resolve(moduleDir, '..', '..');
export const SITE_ORIGIN = 'https://mccrree.github.io';

const markdown = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: false
});

function diagnostic(level, file, message, line = null) {
  return { level, file, line, message };
}

export function formatChapterNumber(number) {
  return String(number).padStart(2, '0');
}

export function unitStem(unit) {
  return `${formatChapterNumber(unit.number)}-${unit.slug}`;
}

export function unitFileName(unit) {
  return `${unitStem(unit)}.md`;
}

export function unitUrl(collection, unit) {
  return `${collection.route}${unitStem(unit)}/`;
}

// Kept as public aliases for scripts or tests that used the original chapter helpers.
export const chapterStem = unitStem;
export const chapterFileName = unitFileName;
export function chapterUrl(chapter) {
  return `/deep-learning/${unitStem(chapter)}/`;
}

function collectInlineTokens(tokens) {
  const result = [];
  for (const token of tokens) {
    if (!token.children) continue;
    for (const child of token.children) result.push(child);
  }
  return result;
}

function isExternalUrl(value) {
  return /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(value);
}

function cleanUrlPath(value) {
  return value.split('#', 1)[0].split('?', 1)[0];
}

function safeDecode(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

function isSafeProjectPath(value, requiredPrefix) {
  if (typeof value !== 'string' || value.length === 0 || value.includes('\\')) return false;
  if (path.posix.isAbsolute(value)) return false;
  const segments = value.split('/');
  return value.startsWith(`${requiredPrefix}/`) && !segments.includes('..') && !segments.includes('.');
}

async function listFilesRecursively(directory) {
  if (!existsSync(directory)) return [];
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await listFilesRecursively(fullPath));
    if (entry.isFile()) files.push(fullPath);
  }
  return files;
}

function mathSourceWithoutCode(tokens, lines) {
  const excluded = new Set();
  for (const token of tokens) {
    if (!['fence', 'code_block'].includes(token.type) || !token.map) continue;
    for (let index = token.map[0]; index < token.map[1]; index += 1) excluded.add(index);
  }
  return lines.filter((_, index) => !excluded.has(index)).join('\n');
}

function validateCodeFences(lines, relativeFile) {
  let openFence = null;
  for (let index = 0; index < lines.length; index += 1) {
    const match = lines[index].match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
    if (!match) continue;
    const marker = match[1];
    if (!openFence) {
      openFence = { character: marker[0], length: marker.length, line: index + 1 };
      continue;
    }
    if (
      marker[0] === openFence.character
      && marker.length >= openFence.length
      && match[2].trim().length === 0
    ) {
      openFence = null;
    }
  }
  return openFence
    ? [diagnostic('error', relativeFile, 'Code fence is not closed.', openFence.line)]
    : [];
}

async function inspectUnit(rootDir, collection, definition) {
  const fileName = unitFileName(definition);
  const stem = unitStem(definition);
  const relativeFile = path.posix.join(collection.contentDirectory, fileName);
  const filePath = path.join(rootDir, ...relativeFile.split('/'));
  const assetDir = path.join(rootDir, ...collection.contentDirectory.split('/'), stem);
  const result = {
    ...definition,
    collectionId: collection.id,
    numberLabel: formatChapterNumber(definition.number),
    stem,
    fileName,
    relativeFile,
    filePath,
    assetDir,
    url: unitUrl(collection, definition),
    exists: existsSync(filePath),
    valid: false,
    errors: [],
    warnings: [],
    links: [],
    hasMath: false,
    source: null,
    bodyWithoutTitle: null,
    h1Range: null
  };

  if (!result.exists) return result;

  const source = await fs.readFile(filePath, 'utf8');
  result.source = source;
  const lines = source.split(/\r\n|\n|\r/);

  if (source.includes('\uFFFD')) {
    result.errors.push(diagnostic('error', relativeFile, 'File is not valid UTF-8 text.'));
  }
  if (source.charCodeAt(0) === 0xFEFF) {
    result.errors.push(diagnostic('error', relativeFile, 'Remove the UTF-8 BOM at the start of the file.', 1));
  }
  if (lines[0]?.trim() === '---') {
    result.errors.push(diagnostic('error', relativeFile, 'Learning-note Markdown must not contain front matter; metadata is generated automatically.', 1));
  }
  result.errors.push(...validateCodeFences(lines, relativeFile));

  let tokens;
  try {
    tokens = markdown.parse(source, {});
  } catch (error) {
    result.errors.push(diagnostic('error', relativeFile, `Markdown cannot be parsed: ${error.message}`));
    return result;
  }

  const headings = [];
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (token.type !== 'heading_open') continue;
    const inline = tokens[index + 1];
    headings.push({
      level: Number(token.tag.slice(1)),
      title: inline?.type === 'inline' ? inline.content.trim() : '',
      map: token.map
    });
  }

  const h1Headings = headings.filter((heading) => heading.level === 1);
  if (h1Headings.length !== 1) {
    result.errors.push(diagnostic('error', relativeFile, `Exactly one H1 is required; found ${h1Headings.length}.`));
  } else {
    const h1 = h1Headings[0];
    const firstContentLine = lines.findIndex((line) => line.trim().length > 0);
    if (h1.map?.[0] !== firstContentLine) {
      result.errors.push(diagnostic('error', relativeFile, 'The first non-empty content must be the note H1.', firstContentLine + 1));
    }
    if (h1.title !== definition.title) {
      result.errors.push(diagnostic(
        'error',
        relativeFile,
        `H1 must be “${definition.title}”; found “${h1.title}”.`,
        (h1.map?.[0] ?? 0) + 1
      ));
    }
    if (h1.map) {
      result.h1Range = h1.map;
      const eol = source.includes('\r\n') ? '\r\n' : '\n';
      const bodyLines = [...lines];
      bodyLines.splice(h1.map[0], h1.map[1] - h1.map[0]);
      result.bodyWithoutTitle = bodyLines.join(eol);
    }
  }

  let previousLevel = 1;
  for (const heading of headings.filter((item) => item.level > 1)) {
    const line = (heading.map?.[0] ?? 0) + 1;
    if (heading.level > 3) {
      result.warnings.push(diagnostic('warning', relativeFile, `H${heading.level} will not appear in the note TOC; it includes H2/H3 only.`, line));
    }
    if (heading.level - previousLevel > 1) {
      result.warnings.push(diagnostic('warning', relativeFile, `Heading jumps from H${previousLevel} to H${heading.level}.`, line));
    }
    previousLevel = heading.level;
  }

  const inlineTokens = collectInlineTokens(tokens);
  const referencedAssets = new Set();
  for (const token of inlineTokens) {
    if (token.type === 'image') {
      const sourceUrl = token.attrGet('src') ?? '';
      if (!token.content.trim()) {
        result.warnings.push(diagnostic('warning', relativeFile, `Image “${sourceUrl}” is missing alt text.`));
      }
      if (!sourceUrl || isExternalUrl(sourceUrl) || sourceUrl.startsWith('/')) {
        if (isExternalUrl(sourceUrl)) {
          result.warnings.push(diagnostic('warning', relativeFile, `External image cannot be verified during the build: ${sourceUrl}`));
        }
        continue;
      }
      const cleaned = safeDecode(cleanUrlPath(sourceUrl));
      if (cleaned === null) {
        result.errors.push(diagnostic('error', relativeFile, `Image path has invalid encoding: ${sourceUrl}`));
        continue;
      }
      const segments = cleaned.replaceAll('\\', '/').split('/');
      if (segments.includes('..') || path.isAbsolute(cleaned)) {
        result.errors.push(diagnostic('error', relativeFile, `Image path must stay inside the note asset directory: ${sourceUrl}`));
        continue;
      }
      const resolved = path.resolve(assetDir, cleaned);
      const assetRoot = path.resolve(assetDir);
      if (resolved !== assetRoot && !resolved.startsWith(`${assetRoot}${path.sep}`)) {
        result.errors.push(diagnostic('error', relativeFile, `Image path must stay inside the note asset directory: ${sourceUrl}`));
        continue;
      }
      referencedAssets.add(resolved.toLowerCase());
      if (!existsSync(resolved)) {
        result.errors.push(diagnostic('error', relativeFile, `Image does not exist: ${sourceUrl}`));
      }
    }

    if (token.type === 'link_open') {
      const href = token.attrGet('href');
      if (href) result.links.push(href);
    }
  }

  for (const assetFile of await listFilesRecursively(assetDir)) {
    if (!referencedAssets.has(path.resolve(assetFile).toLowerCase())) {
      result.warnings.push(diagnostic(
        'warning',
        relativeFile,
        `Unreferenced file in the note asset directory: ${path.relative(assetDir, assetFile).replaceAll('\\', '/')}`
      ));
    }
  }

  const mathSource = mathSourceWithoutCode(tokens, lines);
  const displayMathMarkers = mathSource.match(/(?<!\\)\$\$/g) ?? [];
  result.hasMath = displayMathMarkers.length > 0 || /(?<!\\)\$(?!\$)\S[^\n$]*?\S(?<!\\)\$(?!\$)/.test(mathSource);
  if (displayMathMarkers.length % 2 !== 0) {
    result.errors.push(diagnostic('error', relativeFile, 'Display-math $$ delimiters are not balanced.'));
  }

  result.valid = result.errors.length === 0;
  return result;
}

function validateCoursesConfig(config, configFile) {
  const diagnostics = [];
  if (!config || typeof config !== 'object' || !Array.isArray(config.collections) || config.collections.length === 0) {
    return [diagnostic('error', configFile, 'Course metadata must contain a non-empty collections array.')];
  }
  if (typeof config.site?.title !== 'string' || typeof config.site?.subtitle !== 'string') {
    diagnostics.push(diagnostic('error', configFile, 'Site title and subtitle are required.'));
  }

  const ids = new Set();
  const routes = new Set();
  const contentDirectories = new Set();
  for (const collection of config.collections) {
    const label = collection?.id || '(missing id)';
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(collection?.id ?? '')) {
      diagnostics.push(diagnostic('error', configFile, `Collection id is invalid: ${label}`));
    } else if (ids.has(collection.id)) {
      diagnostics.push(diagnostic('error', configFile, `Collection id is duplicated: ${collection.id}`));
    }
    ids.add(collection?.id);

    if (!/^\/[a-z0-9]+(?:-[a-z0-9]+)*\/$/.test(collection?.route ?? '')) {
      diagnostics.push(diagnostic('error', configFile, `Collection route is invalid for ${label}.`));
    } else if (routes.has(collection.route)) {
      diagnostics.push(diagnostic('error', configFile, `Collection route is duplicated: ${collection.route}`));
    }
    routes.add(collection?.route);

    if (!isSafeProjectPath(collection?.contentDirectory, 'content')) {
      diagnostics.push(diagnostic('error', configFile, `contentDirectory is invalid for ${label}.`));
    } else if (contentDirectories.has(collection.contentDirectory)) {
      diagnostics.push(diagnostic('error', configFile, `contentDirectory is shared by multiple collections: ${collection.contentDirectory}`));
    }
    contentDirectories.add(collection?.contentDirectory);

    if (!isSafeProjectPath(collection?.manifest, 'data') || !collection.manifest.endsWith('.json')) {
      diagnostics.push(diagnostic('error', configFile, `Manifest path is invalid for ${label}.`));
    }
    if (!Number.isInteger(collection?.expectedUnits) || collection.expectedUnits < 1) {
      diagnostics.push(diagnostic('error', configFile, `expectedUnits must be a positive integer for ${label}.`));
    }
    if (typeof collection?.title !== 'string' || !collection.title.trim()) {
      diagnostics.push(diagnostic('error', configFile, `Title is required for ${label}.`));
    }
    if (typeof collection?.subtitle !== 'string' || !collection.subtitle.trim()) {
      diagnostics.push(diagnostic('error', configFile, `Subtitle is required for ${label}.`));
    }
    if (typeof collection?.unit?.singular !== 'string' || typeof collection?.unit?.plural !== 'string') {
      diagnostics.push(diagnostic('error', configFile, `Unit labels are required for ${label}.`));
    }
    if (!Array.isArray(collection?.tags) || collection.tags.some((tag) => typeof tag !== 'string' || !tag.trim())) {
      diagnostics.push(diagnostic('error', configFile, `Tags must be a list of non-empty strings for ${label}.`));
    }
    if (typeof collection?.generatedDirectory !== 'string' || collection.generatedDirectory.includes('..') || collection.generatedDirectory.includes('/')) {
      diagnostics.push(diagnostic('error', configFile, `generatedDirectory is invalid for ${label}.`));
    }
  }
  return diagnostics;
}

function validateManifest(manifest, collection) {
  const diagnostics = [];
  const manifestFile = collection.manifest;
  if (!Array.isArray(manifest)) {
    return [diagnostic('error', manifestFile, `${collection.title} manifest must be an array.`)];
  }
  if (manifest.length !== collection.expectedUnits) {
    diagnostics.push(diagnostic('error', manifestFile, `${collection.title} manifest must contain exactly ${collection.expectedUnits} items.`));
  }

  const numbers = new Set();
  const slugs = new Set();
  for (let index = 0; index < manifest.length; index += 1) {
    const unit = manifest[index] ?? {};
    if (!Number.isInteger(unit.number) || unit.number < 1) {
      diagnostics.push(diagnostic('error', manifestFile, `Item ${index + 1} has an invalid number.`));
    } else if (numbers.has(unit.number)) {
      diagnostics.push(diagnostic('error', manifestFile, `Unit number is duplicated: ${unit.number}`));
    }
    numbers.add(unit.number);
    if (unit.number !== index + 1) {
      diagnostics.push(diagnostic('error', manifestFile, `Item ${index + 1} must use number ${index + 1}.`));
    }
    if (typeof unit.title !== 'string' || !unit.title.trim()) {
      diagnostics.push(diagnostic('error', manifestFile, `Unit ${index + 1} is missing a title.`));
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(unit.slug ?? '')) {
      diagnostics.push(diagnostic('error', manifestFile, `Unit ${index + 1} has an invalid slug.`));
    } else if (slugs.has(unit.slug)) {
      diagnostics.push(diagnostic('error', manifestFile, `Slug is duplicated: ${unit.slug}`));
    }
    slugs.add(unit.slug);
  }
  return diagnostics;
}

function normalizedRoute(href, sourceUrl) {
  const cleaned = cleanUrlPath(href);
  if (!cleaned) return null;
  const pathname = new URL(cleaned, `${SITE_ORIGIN}${sourceUrl}`).pathname;
  return pathname.endsWith('/') ? pathname : `${pathname}/`;
}

function validateRoutes(collections, articles) {
  const diagnostics = [];
  const publishedByUrl = new Map();
  const allRoutes = new Map();
  const staticRoutes = new Set(['/', '/about/', '/archives/', '/tags/']);

  for (const collection of collections) {
    if (staticRoutes.has(collection.route) || allRoutes.has(collection.route)) {
      diagnostics.push(diagnostic('error', 'data/courses.json', `Course page URL collides with another route: ${collection.route}`));
    }
    allRoutes.set(collection.route, collection.id);
  }
  for (const article of articles) {
    if (staticRoutes.has(article.url) || allRoutes.has(article.url)) {
      diagnostics.push(diagnostic('error', article.relativeFile, `Article URL collides with another route: ${article.url}`));
    } else {
      allRoutes.set(article.url, article.relativeFile);
    }
    if (article.exists && article.valid) publishedByUrl.set(article.url, article);
  }

  for (const article of articles.filter((item) => item.exists && item.valid)) {
    for (const href of article.links) {
      if (href.startsWith('#') || isExternalUrl(href)) continue;
      const cleaned = cleanUrlPath(href);
      if (/\.md$/i.test(cleaned)) {
        diagnostics.push(diagnostic('error', article.relativeFile, `Use the final site URL instead of linking to a Markdown file: ${href}`));
        continue;
      }
      const route = normalizedRoute(href, article.url);
      if (!route || staticRoutes.has(route) || collections.some((collection) => collection.route === route)) continue;
      if (!allRoutes.has(route)) {
        diagnostics.push(diagnostic('error', article.relativeFile, `Internal link is not a site route: ${href}`));
      } else if (!publishedByUrl.has(route)) {
        diagnostics.push(diagnostic('error', article.relativeFile, `Internal link points to a planned but unpublished note: ${href}`));
      }
    }
  }
  return diagnostics;
}

async function inspectCollection(rootDir, collection) {
  let manifest;
  try {
    manifest = JSON.parse(await fs.readFile(path.join(rootDir, ...collection.manifest.split('/')), 'utf8'));
  } catch (error) {
    return {
      collection: { ...collection, units: [], completed: 0, total: collection.expectedUnits ?? 0, percentage: 0 },
      diagnostics: [diagnostic('error', collection.manifest, `Cannot read manifest: ${error.message}`)]
    };
  }

  const diagnostics = validateManifest(manifest, collection);
  const contentDirectory = path.join(rootDir, ...collection.contentDirectory.split('/'));
  const expectedFiles = new Set(manifest.map(unitFileName));
  const expectedDirectories = new Set(manifest.map(unitStem));
  if (existsSync(contentDirectory)) {
    for (const entry of await fs.readdir(contentDirectory, { withFileTypes: true })) {
      if (entry.name.startsWith('.')) continue;
      if (entry.isFile() && entry.name.endsWith('.md') && !expectedFiles.has(entry.name)) {
        diagnostics.push(diagnostic('error', collection.contentDirectory, `Markdown filename is not defined by the manifest: ${entry.name}`));
      }
      if (entry.isDirectory() && !expectedDirectories.has(entry.name)) {
        diagnostics.push(diagnostic('error', collection.contentDirectory, `Asset directory is not defined by the manifest: ${entry.name}`));
      }
    }
  }

  const units = await Promise.all(manifest.map((unit) => inspectUnit(rootDir, collection, unit)));
  diagnostics.push(...units.flatMap((unit) => [...unit.errors, ...unit.warnings]));
  const completed = units.filter((unit) => unit.exists && unit.valid).length;
  return {
    collection: {
      ...collection,
      units,
      completed,
      total: units.length,
      percentage: units.length === 0 ? 0 : Math.round((completed / units.length) * 100)
    },
    diagnostics
  };
}

export async function validateProject({ rootDir = ROOT_DIR } = {}) {
  const configFile = 'data/courses.json';
  let config;
  try {
    config = JSON.parse(await fs.readFile(path.join(rootDir, 'data', 'courses.json'), 'utf8'));
  } catch (error) {
    return {
      site: {},
      collections: [],
      articles: [],
      chapters: [],
      errors: [diagnostic('error', configFile, `Cannot read course metadata: ${error.message}`)],
      warnings: []
    };
  }

  const diagnostics = validateCoursesConfig(config, configFile);
  const usableCollections = config.collections.filter((collection) => (
    collection
    && typeof collection.id === 'string'
    && typeof collection.route === 'string'
    && isSafeProjectPath(collection.contentDirectory, 'content')
    && isSafeProjectPath(collection.manifest, 'data')
  ));
  const inspected = await Promise.all(usableCollections.map((collection) => inspectCollection(rootDir, collection)));
  const collections = inspected.map((item) => item.collection);
  diagnostics.push(...inspected.flatMap((item) => item.diagnostics));
  const articles = collections.flatMap((collection) => collection.units);
  diagnostics.push(...validateRoutes(collections, articles));

  const errors = diagnostics.filter((item) => item.level === 'error');
  const warnings = diagnostics.filter((item) => item.level === 'warning');
  return {
    site: config.site ?? {},
    collections,
    articles,
    chapters: collections.find((collection) => collection.id === 'deep-learning')?.units ?? [],
    errors,
    warnings
  };
}

export function printReport(report) {
  for (const item of [...report.errors, ...report.warnings]) {
    const location = item.line ? `${item.file}:${item.line}` : item.file;
    const label = item.level === 'error' ? 'ERROR' : 'WARNING';
    console[item.level === 'error' ? 'error' : 'warn'](`[${label}] ${location} — ${item.message}`);
  }
  for (const collection of report.collections) {
    console.log(`Content check: ${collection.completed}/${collection.total} ${collection.unit.plural} valid — ${collection.title}.`);
  }
  console.log(`Content check: ${report.errors.length} error(s), ${report.warnings.length} warning(s).`);
}

export function getGitDates(rootDir, relativeFile) {
  try {
    const safeRoot = rootDir.replaceAll('\\', '/');
    const output = execFileSync(
      'git',
      ['-c', `safe.directory=${safeRoot}`, 'log', '--follow', '--format=%aI', '--', relativeFile],
      { cwd: rootDir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }
    ).trim();
    const dates = output.split(/\r?\n/).filter(Boolean);
    if (dates.length > 0) return { published: dates.at(-1), updated: dates[0] };
  } catch {
    // An uncommitted local file has no Git history; filesystem time is a preview-only fallback.
  }
  const stat = existsSync(path.join(rootDir, ...relativeFile.split('/')))
    ? execFileStatFallback(rootDir, relativeFile)
    : new Date().toISOString();
  return { published: stat, updated: stat };
}

function execFileStatFallback(rootDir, relativeFile) {
  const filePath = path.join(rootDir, ...relativeFile.split('/'));
  try {
    return execFileSync(
      process.execPath,
      ['-e', `const fs=require('fs');console.log(fs.statSync(${JSON.stringify(filePath)}).mtime.toISOString())`],
      { encoding: 'utf8' }
    ).trim();
  } catch {
    return new Date().toISOString();
  }
}

export function generatedFrontMatter(collection, unit, dates, previous, next) {
  const values = [
    '---',
    'layout: post',
    `title: ${JSON.stringify(unit.title)}`,
    `date: ${JSON.stringify(dates.published)}`,
    `updated: ${JSON.stringify(dates.updated)}`,
    `permalink: ${JSON.stringify(unit.url.slice(1))}`,
    `course: ${JSON.stringify(collection.code ?? collection.title)}`,
    'tags:',
    ...collection.tags.map((tag) => `  - ${JSON.stringify(tag)}`),
    'comments: false',
    'mathjax: true',
    'toc: true',
    'disableNunjucks: true',
    `collection_id: ${JSON.stringify(collection.id)}`,
    `collection_path: ${JSON.stringify(collection.route)}`,
    `unit_label: ${JSON.stringify(collection.unit.singular)}`,
    `unit_number: ${JSON.stringify(unit.numberLabel)}`,
    `unit_title: ${JSON.stringify(unit.title)}`,
    `unit_path: ${JSON.stringify(unit.url)}`
  ];
  if (collection.reference) {
    values.push(
      `reference_author: ${JSON.stringify(collection.reference.author)}`,
      `reference_title: ${JSON.stringify(collection.reference.title)}`
    );
  }
  if (collection.id === 'deep-learning') {
    values.push(
      `chapter_number: ${JSON.stringify(unit.numberLabel)}`,
      `chapter_title: ${JSON.stringify(unit.title)}`,
      `chapter_path: ${JSON.stringify(unit.url)}`
    );
  }
  if (previous) {
    values.push(
      `prev_unit_number: ${JSON.stringify(previous.numberLabel)}`,
      `prev_unit_title: ${JSON.stringify(previous.title)}`,
      `prev_unit_path: ${JSON.stringify(previous.url)}`
    );
  }
  if (next) {
    values.push(
      `next_unit_number: ${JSON.stringify(next.numberLabel)}`,
      `next_unit_title: ${JSON.stringify(next.title)}`,
      `next_unit_path: ${JSON.stringify(next.url)}`
    );
  }
  values.push('---', '');
  return values.join('\n');
}
