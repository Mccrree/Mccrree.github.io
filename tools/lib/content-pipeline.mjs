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

export function chapterStem(chapter) {
  return `${formatChapterNumber(chapter.number)}-${chapter.slug}`;
}

export function chapterFileName(chapter) {
  return `${chapterStem(chapter)}.md`;
}

export function chapterUrl(chapter) {
  return `/deep-learning/${chapterStem(chapter)}/`;
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

async function inspectChapter(rootDir, chapter) {
  const relativeFile = path.posix.join('content', 'chapters', chapterFileName(chapter));
  const filePath = path.join(rootDir, ...relativeFile.split('/'));
  const assetDir = path.join(rootDir, 'content', 'chapters', chapterStem(chapter));
  const result = {
    ...chapter,
    numberLabel: formatChapterNumber(chapter.number),
    stem: chapterStem(chapter),
    fileName: chapterFileName(chapter),
    relativeFile,
    filePath,
    assetDir,
    url: chapterUrl(chapter),
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
    result.errors.push(diagnostic('error', relativeFile, '文件不是有效的 UTF-8 文本。'));
  }
  if (source.charCodeAt(0) === 0xFEFF) {
    result.errors.push(diagnostic('error', relativeFile, '请移除文件开头的 UTF-8 BOM。', 1));
  }
  if (lines[0]?.trim() === '---') {
    result.errors.push(diagnostic('error', relativeFile, 'Chapter Markdown 不需要 Front Matter；metadata 会自动生成。', 1));
  }

  let tokens;
  try {
    tokens = markdown.parse(source, {});
  } catch (error) {
    result.errors.push(diagnostic('error', relativeFile, `Markdown 无法解析：${error.message}`));
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
    result.errors.push(diagnostic(
      'error',
      relativeFile,
      `必须且只能包含一个 H1，当前检测到 ${h1Headings.length} 个。`
    ));
  } else {
    const h1 = h1Headings[0];
    const firstContentLine = lines.findIndex((line) => line.trim().length > 0);
    if (h1.map?.[0] !== firstContentLine) {
      result.errors.push(diagnostic('error', relativeFile, '第一个非空内容必须是 Chapter H1。', firstContentLine + 1));
    }
    if (h1.title !== chapter.title) {
      result.errors.push(diagnostic(
        'error',
        relativeFile,
        `H1 必须是 “${chapter.title}”，当前为 “${h1.title}”。`,
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
      result.warnings.push(diagnostic(
        'warning', relativeFile, `H${heading.level} 不会进入 Chapter TOC；TOC 仅包含 H2/H3。`, line
      ));
    }
    if (heading.level - previousLevel > 1) {
      result.warnings.push(diagnostic(
        'warning', relativeFile, `Heading 从 H${previousLevel} 跳到 H${heading.level}。`, line
      ));
    }
    previousLevel = heading.level;
  }

  const inlineTokens = collectInlineTokens(tokens);
  const referencedAssets = new Set();
  for (const token of inlineTokens) {
    if (token.type === 'image') {
      const sourceUrl = token.attrGet('src') ?? '';
      if (!token.content.trim()) {
        result.warnings.push(diagnostic('warning', relativeFile, `图片 “${sourceUrl}” 缺少 alt text。`, token.map?.[0]));
      }
      if (!sourceUrl || isExternalUrl(sourceUrl) || sourceUrl.startsWith('/')) {
        if (isExternalUrl(sourceUrl)) {
          result.warnings.push(diagnostic('warning', relativeFile, `外部图片不会在构建时验证：${sourceUrl}`));
        }
        continue;
      }
      const cleaned = safeDecode(cleanUrlPath(sourceUrl));
      if (cleaned === null) {
        result.errors.push(diagnostic('error', relativeFile, `图片路径包含无效编码：${sourceUrl}`));
        continue;
      }
      const segments = cleaned.replaceAll('\\', '/').split('/');
      if (segments.includes('..') || path.isAbsolute(cleaned)) {
        result.errors.push(diagnostic('error', relativeFile, `图片路径不得越出 Chapter 资源目录：${sourceUrl}`));
        continue;
      }
      const resolved = path.resolve(assetDir, cleaned);
      const assetRoot = path.resolve(assetDir);
      if (resolved !== assetRoot && !resolved.startsWith(`${assetRoot}${path.sep}`)) {
        result.errors.push(diagnostic('error', relativeFile, `图片路径不得越出 Chapter 资源目录：${sourceUrl}`));
        continue;
      }
      referencedAssets.add(resolved.toLowerCase());
      if (!existsSync(resolved)) {
        result.errors.push(diagnostic('error', relativeFile, `图片不存在：${sourceUrl}`));
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
        `资源目录中存在未引用文件：${path.relative(assetDir, assetFile).replaceAll('\\', '/')}`
      ));
    }
  }

  const mathSource = mathSourceWithoutCode(tokens, lines);
  const displayMathMarkers = mathSource.match(/(?<!\\)\$\$/g) ?? [];
  result.hasMath = displayMathMarkers.length > 0 || /(?<!\\)\$(?!\$)\S[^\n$]*?\S(?<!\\)\$(?!\$)/.test(mathSource);
  if (displayMathMarkers.length % 2 !== 0) {
    result.errors.push(diagnostic('error', relativeFile, '块级数学公式的 $$ 定界符数量不成对。'));
  }

  result.valid = result.errors.length === 0;
  return result;
}

function validateManifest(manifest, manifestFile) {
  const diagnostics = [];
  if (!Array.isArray(manifest) || manifest.length !== 21) {
    diagnostics.push(diagnostic('error', manifestFile, 'Chapter Manifest 必须恰好包含 21 项。'));
    return diagnostics;
  }
  const slugs = new Set();
  for (let index = 0; index < manifest.length; index += 1) {
    const chapter = manifest[index];
    if (chapter.number !== index + 1) {
      diagnostics.push(diagnostic('error', manifestFile, `第 ${index + 1} 项的 number 必须是 ${index + 1}。`));
    }
    if (!chapter.title || typeof chapter.title !== 'string') {
      diagnostics.push(diagnostic('error', manifestFile, `Chapter ${index + 1} 缺少 title。`));
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(chapter.slug ?? '')) {
      diagnostics.push(diagnostic('error', manifestFile, `Chapter ${index + 1} 的 slug 无效。`));
    }
    if (slugs.has(chapter.slug)) {
      diagnostics.push(diagnostic('error', manifestFile, `slug 重复：${chapter.slug}`));
    }
    slugs.add(chapter.slug);
  }
  return diagnostics;
}

function validateInternalLinks(chapters) {
  const diagnostics = [];
  const byUrl = new Map(chapters.map((chapter) => [chapter.url, chapter]));
  const staticRoutes = new Set(['/', '/about/', '/archives/', '/deep-learning/', '/tags/']);

  for (const chapter of chapters.filter((item) => item.exists)) {
    for (const href of chapter.links) {
      if (href.startsWith('#') || isExternalUrl(href)) continue;
      const cleaned = cleanUrlPath(href);
      if (/\.md$/i.test(cleaned)) {
        diagnostics.push(diagnostic(
          'error',
          chapter.relativeFile,
          `Chapter 链接请使用最终根路径，不要链接 .md 文件：${href}`
        ));
        continue;
      }
      if (!cleaned.startsWith('/')) continue;
      const normalized = cleaned.endsWith('/') ? cleaned : `${cleaned}/`;
      if (staticRoutes.has(normalized)) continue;
      const target = byUrl.get(normalized);
      if (!target) {
        diagnostics.push(diagnostic('error', chapter.relativeFile, `内部链接不在站点路由中：${href}`));
      } else if (!target.exists || !target.valid) {
        diagnostics.push(diagnostic('error', chapter.relativeFile, `内部链接指向尚未发布的 Chapter：${href}`));
      }
    }
  }
  return diagnostics;
}

export async function validateProject({ rootDir = ROOT_DIR } = {}) {
  const manifestPath = path.join(rootDir, 'data', 'chapters.json');
  const manifestFile = 'data/chapters.json';
  let manifest;
  try {
    manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
  } catch (error) {
    return {
      manifest: [],
      chapters: [],
      errors: [diagnostic('error', manifestFile, `无法读取 Manifest：${error.message}`)],
      warnings: []
    };
  }

  const manifestDiagnostics = validateManifest(manifest, manifestFile);
  const chaptersDir = path.join(rootDir, 'content', 'chapters');
  await fs.mkdir(chaptersDir, { recursive: true });
  const expectedFiles = new Set(manifest.map(chapterFileName));
  const expectedDirs = new Set(manifest.map(chapterStem));
  const rootEntries = await fs.readdir(chaptersDir, { withFileTypes: true });
  const unexpectedDiagnostics = [];
  for (const entry of rootEntries) {
    if (entry.name.startsWith('.')) continue;
    if (entry.isFile() && entry.name.endsWith('.md') && !expectedFiles.has(entry.name)) {
      unexpectedDiagnostics.push(diagnostic('error', 'content/chapters', `未在 Manifest 中定义的 Markdown：${entry.name}`));
    }
    if (entry.isDirectory() && !expectedDirs.has(entry.name)) {
      unexpectedDiagnostics.push(diagnostic('error', 'content/chapters', `未在 Manifest 中定义的资源目录：${entry.name}`));
    }
  }

  const chapters = await Promise.all(manifest.map((chapter) => inspectChapter(rootDir, chapter)));
  const internalLinkDiagnostics = validateInternalLinks(chapters);
  const allDiagnostics = [
    ...manifestDiagnostics,
    ...unexpectedDiagnostics,
    ...chapters.flatMap((chapter) => [...chapter.errors, ...chapter.warnings]),
    ...internalLinkDiagnostics
  ];
  const errors = allDiagnostics.filter((item) => item.level === 'error');
  const warnings = allDiagnostics.filter((item) => item.level === 'warning');

  return { manifest, chapters, errors, warnings };
}

export function printReport(report) {
  for (const item of [...report.errors, ...report.warnings]) {
    const location = item.line ? `${item.file}:${item.line}` : item.file;
    const label = item.level === 'error' ? 'ERROR' : 'WARNING';
    console[item.level === 'error' ? 'error' : 'warn'](`[${label}] ${location} — ${item.message}`);
  }
  const complete = report.chapters.filter((chapter) => chapter.exists && chapter.valid).length;
  console.log(`Content check: ${complete}/21 Chapters valid, ${report.errors.length} error(s), ${report.warnings.length} warning(s).`);
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
    const stat = execFileSync(
      process.execPath,
      ['-e', `const fs=require('fs');console.log(fs.statSync(${JSON.stringify(filePath)}).mtime.toISOString())`],
      { encoding: 'utf8' }
    ).trim();
    return stat;
  } catch {
    return new Date().toISOString();
  }
}

export function generatedFrontMatter(chapter, dates, previous, next) {
  const values = [
    '---',
    'layout: post',
    `title: ${JSON.stringify(chapter.title)}`,
    `date: ${JSON.stringify(dates.published)}`,
    `updated: ${JSON.stringify(dates.updated)}`,
    `permalink: ${JSON.stringify(chapter.url.slice(1))}`,
    'tags:',
    `  - ${JSON.stringify('Understanding Deep Learning')}`,
    'comments: false',
    'mathjax: true',
    'toc: true',
    'disableNunjucks: true',
    `chapter_number: ${JSON.stringify(chapter.numberLabel)}`,
    `chapter_title: ${JSON.stringify(chapter.title)}`,
    `chapter_path: ${JSON.stringify(chapter.url)}`
  ];
  if (previous) {
    values.push(
      `prev_chapter_number: ${JSON.stringify(previous.numberLabel)}`,
      `prev_chapter_title: ${JSON.stringify(previous.title)}`,
      `prev_chapter_path: ${JSON.stringify(previous.url)}`
    );
  }
  if (next) {
    values.push(
      `next_chapter_number: ${JSON.stringify(next.numberLabel)}`,
      `next_chapter_title: ${JSON.stringify(next.title)}`,
      `next_chapter_path: ${JSON.stringify(next.url)}`
    );
  }
  values.push('---', '');
  return values.join('\n');
}
