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

function readLearningData() {
  const progressPath = path.join(hexo.base_dir, '.generated', 'learning.json');
  if (!fs.existsSync(progressPath)) {
    throw new Error('Learning progress data is missing. Run npm run prepare first.');
  }
  return JSON.parse(fs.readFileSync(progressPath, 'utf8'));
}

function progressItems(collection) {
  const items = [{
    completed: collection.completed,
    total: collection.total,
    percentage: collection.percentage,
    singular: collection.unit.singular,
    plural: collection.unit.plural
  }];
  if (collection.tutorialProgress) items.push(collection.tutorialProgress);
  return items;
}

function renderProgressTrack(progress) {
  const plural = escapeHtml(progress.plural);
  return `<div class="learning-progress__track" role="progressbar" aria-valuemin="0" aria-valuemax="${progress.total}" aria-valuenow="${progress.completed}" aria-label="${progress.completed} of ${progress.total} ${plural.toLowerCase()} complete">
      <span style="width: ${progress.percentage}%"></span>
    </div>`;
}

function renderProgress(collection) {
  const items = progressItems(collection).map((progress) => `
    <div class="learning-progress__item">
      <div class="learning-progress__summary">
        <strong>${escapeHtml(progress.plural)}</strong>
        <span>${progress.completed} / ${progress.total} ${escapeHtml(progress.plural)}</span>
      </div>
      ${renderProgressTrack(progress)}
    </div>`).join('');
  return `<section class="learning-progress" aria-labelledby="learning-progress-title">
    <h2 id="learning-progress-title">Learning Progress</h2>
    <div class="learning-progress__items">${items}
    </div>
  </section>`;
}

function renderTutorial(tutorial) {
  if (!tutorial) return '';
  const title = escapeHtml(tutorial.title);
  if (tutorial.completed) {
    return `<div class="learning-path__tutorial is-complete"><span class="learning-path__branch" aria-hidden="true">↳</span><a href="${escapeHtml(tutorial.path)}">${title}</a><span class="learning-path__status" aria-label="Complete">✓</span></div>`;
  }
  return `<div class="learning-path__tutorial is-pending"><span class="learning-path__branch" aria-hidden="true">↳</span><span class="learning-path__title">${title}</span><span class="learning-path__status" aria-label="Pending">○</span></div>`;
}

function renderCollection(collection) {
  const unitItems = collection.units.map((unit) => {
    const number = escapeHtml(unit.numberLabel);
    const title = escapeHtml(unit.title);
    const label = collection.unit.showLabelInPath
      ? `${escapeHtml(collection.unit.singular)} ${number}`
      : number;
    const primary = unit.completed
      ? `<div class="learning-path__item is-complete"><span class="learning-path__number">${label}</span><a href="${escapeHtml(unit.path)}">${title}</a><span class="learning-path__status" aria-label="Complete">✓</span></div>`
      : `<div class="learning-path__item is-pending"><span class="learning-path__number">${label}</span><span class="learning-path__title">${title}</span><span class="learning-path__status" aria-label="Pending">○</span></div>`;
    return `<li class="learning-path__group">${primary}${renderTutorial(unit.tutorial)}</li>`;
  }).join('');

  return `<section class="learning-dashboard" aria-labelledby="learning-dashboard-title">
  <header class="learning-dashboard__header">
    <p class="learning-dashboard__eyebrow">${escapeHtml(collection.type === 'course' ? 'Course Notes' : 'Book Notes')}</p>
    <h1 id="learning-dashboard-title">${escapeHtml(collection.title)}</h1>
    <p class="learning-dashboard__description">${escapeHtml(collection.subtitle)}</p>
  </header>
  ${renderProgress(collection)}
  <section class="learning-path" aria-labelledby="learning-path-title">
    <h2 id="learning-path-title">Learning Path</h2>
    <ol>${unitItems}</ol>
  </section>
</section>`;
}

hexo.extend.tag.register('learning_home', function learningHomeTag() {
  const learning = readLearningData();
  const cards = learning.collections.map((collection) => {
    const progress = progressItems(collection).map((item) => `
        <div class="learning-collection-card__progress-item">
          <span>${item.completed} / ${item.total} ${escapeHtml(item.plural)}</span>
          ${renderProgressTrack(item)}
        </div>`).join('');
    return `<article class="learning-collection-card">
      <div class="learning-collection-card__body">
        <p class="learning-collection-card__kind">${escapeHtml(collection.type === 'course' ? 'Course' : 'Book')}</p>
        <h2><a href="${escapeHtml(collection.path)}">${escapeHtml(collection.title)}</a></h2>
        <p>${escapeHtml(collection.subtitle)}</p>
      </div>
      <div class="learning-collection-card__progress">${progress}
      </div>
    </article>`;
  }).join('');

  return `<section class="learning-home" aria-labelledby="learning-home-title">
  <header class="learning-dashboard__header">
    <p class="learning-dashboard__eyebrow">${escapeHtml(learning.site.subtitle)}</p>
    <h1 id="learning-home-title">${escapeHtml(learning.site.title)}</h1>
  </header>
  <section class="learning-collections" aria-label="Learning collections">${cards}
  </section>
</section>`;
});

hexo.extend.tag.register('learning_collection', function learningCollectionTag(args) {
  const collectionId = args.join(' ').trim();
  const learning = readLearningData();
  const collection = learning.collections.find((item) => item.id === collectionId);
  if (!collection) throw new Error(`Unknown learning collection: ${collectionId}`);
  return renderCollection(collection);
});

// Backwards-compatible tag for any locally cached page that still uses the old name.
hexo.extend.tag.register('learning_dashboard', function learningDashboardTag() {
  const learning = readLearningData();
  const collection = learning.collections.find((item) => item.id === 'deep-learning');
  if (!collection) throw new Error('Deep Learning collection is missing.');
  return renderCollection(collection);
});
