'use strict';

const fs = require('node:fs');
const path = require('node:path');

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

hexo.extend.tag.register('learning_dashboard', function learningDashboardTag() {
  const progressPath = path.join(hexo.base_dir, '.generated', 'learning.json');
  if (!fs.existsSync(progressPath)) {
    throw new Error('Learning progress data is missing. Run npm run prepare first.');
  }
  const progress = JSON.parse(fs.readFileSync(progressPath, 'utf8'));
  const chapterItems = progress.chapters.map((chapter) => {
    const number = escapeHtml(chapter.numberLabel);
    const title = escapeHtml(chapter.title);
    if (chapter.completed) {
      const href = escapeHtml(chapter.path);
      return `<li class="learning-path__item is-complete"><span class="learning-path__number">${number}</span><a href="${href}">${title}</a><span class="learning-path__status" aria-label="Complete">✓</span></li>`;
    }
    return `<li class="learning-path__item is-pending"><span class="learning-path__number">${number}</span><span class="learning-path__title">${title}</span><span class="learning-path__status" aria-label="Pending">○</span></li>`;
  }).join('');

  return `<section class="learning-dashboard" aria-labelledby="learning-dashboard-title">
  <header class="learning-dashboard__header">
    <p class="learning-dashboard__eyebrow">Personal Knowledge Notes</p>
    <h1 id="learning-dashboard-title">${escapeHtml(progress.title)}</h1>
    <p class="learning-dashboard__description">${escapeHtml(progress.description)}</p>
  </header>
  <section class="learning-progress" aria-labelledby="learning-progress-title">
    <div class="learning-progress__summary">
      <h2 id="learning-progress-title">Learning Progress</h2>
      <span>${progress.completed} / ${progress.total} Chapters</span>
    </div>
    <div class="learning-progress__track" role="progressbar" aria-valuemin="0" aria-valuemax="${progress.total}" aria-valuenow="${progress.completed}" aria-label="${progress.completed} of ${progress.total} chapters complete">
      <span style="width: ${progress.percentage}%"></span>
    </div>
  </section>
  <section class="learning-path" aria-labelledby="learning-path-title">
    <h2 id="learning-path-title">Learning Path</h2>
    <ol>${chapterItems}</ol>
  </section>
</section>`;
});
