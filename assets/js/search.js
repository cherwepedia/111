/**
 * Червепедия - Search Engine
 * Поиск с автодополнением, исправлением раскладки и опечаток
 */

(function () {
  'use strict';

  // Keyboard layout mapping (EN -> RU)
  const enToRu = {
    q: 'й', w: 'ц', e: 'у', r: 'к', t: 'е', y: 'н', u: 'г', i: 'ш', o: 'щ', p: 'з',
    '[': 'х', ']': 'ъ', a: 'ф', s: 'ы', d: 'в', f: 'а', g: 'п', h: 'р', j: 'о', k: 'л',
    l: 'д', ';': 'ж', "'": 'э', z: 'я', x: 'ч', c: 'с', v: 'м', b: 'и', n: 'т', m: 'ь',
    ',': 'б', '.': 'ю'
  };

  const ruToEn = Object.fromEntries(Object.entries(enToRu).map(([k, v]) => [v, k]));

  function convertLayout(text, mapping) {
    return text.toLowerCase().split('').map(c => mapping[c] || c).join('');
  }

  function fuzzyMatch(text, query) {
    text = text.toLowerCase();
    query = query.toLowerCase();

    if (text.includes(query)) return { match: true, score: 100 };

    const ruQuery = convertLayout(query, enToRu);
    if (text.includes(ruQuery)) return { match: true, score: 95 };

    const enQuery = convertLayout(query, ruToEn);
    if (text.includes(enQuery)) return { match: true, score: 95 };

    if (query.length >= 3 && query.length <= 20) {
      const words = text.split(/\s+/);
      for (const word of words) {
        if (word.length >= query.length - 2) {
          const dist = levenshteinDistance(word.slice(0, query.length + 2), query);
          if (dist <= Math.floor(query.length / 4) + 1) {
            return { match: true, score: 80 - dist * 5 };
          }
        }
      }
    }

    return { match: false, score: 0 };
  }

  function levenshteinDistance(a, b) {
    const matrix = Array.from({ length: b.length + 1 }, (_, i) => [i]);
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        matrix[i][j] =
          b[i - 1] === a[j - 1]
            ? matrix[i - 1][j - 1]
            : Math.min(
                matrix[i - 1][j - 1] + 1,
                matrix[i][j - 1] + 1,
                matrix[i - 1][j] + 1
              );
      }
    }
    return matrix[b.length][a.length];
  }

  // простой markdown → html (для результатов поиска)
  function simpleMarkdown(text) {
    if (!text) return '';
    return text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>');
  }

  class ChervepediaSearch {
    constructor() {
      this.articles = [];
      this.input = document.getElementById('search-input');
      this.results = document.getElementById('search-results');
      this.debounceTimer = null;

      if (!this.input || !this.results) return;
      this.init();
    }

    init() {
      this.loadArticles();
      this.bindEvents();
    }

    loadArticles() {
      const dataScript = document.getElementById('search-data');
      if (!dataScript) return;

      try {
        this.articles = JSON.parse(dataScript.textContent);
      } catch (e) {
        console.error('Failed to parse search data:', e);
      }
    }

    bindEvents() {
      this.input.addEventListener('input', () => {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => this.search(), 150);
      });

      this.input.addEventListener('focus', () => {
        if (this.input.value.trim().length >= 2) this.search();
      });

      document.addEventListener('click', e => {
        if (!this.input.contains(e.target) && !this.results.contains(e.target)) {
          this.hideResults();
        }
      });

      this.input.addEventListener('keydown', e => this.handleKeydown(e));
    }

    handleKeydown(e) {
      const items = this.results.querySelectorAll('.search-result-item');
      const active = this.results.querySelector('.search-result-item.active');
      let index = Array.from(items).indexOf(active);

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        index = index < items.length - 1 ? index + 1 : 0;
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        index = index > 0 ? index - 1 : items.length - 1;
      } else if (e.key === 'Enter' && active) {
        e.preventDefault();
        window.location.href = active.href;
        return;
      } else if (e.key === 'Escape') {
        this.hideResults();
        return;
      } else {
        return;
      }

      items.forEach(i => i.classList.remove('active'));
      items[index]?.classList.add('active');
    }

    search() {
      const query = this.input.value.trim();
      if (query.length < 2) return this.hideResults();

      const results = this.articles
        .map(article => {
          const t = fuzzyMatch(article.title, query);
          const i = fuzzyMatch(article.intro || '', query);
          const c = fuzzyMatch(article.content || '', query);

          let score = 0;
          if (t.match) score = t.score + 50;
          else if (i.match) score = i.score + 25;
          else if (c.match) score = c.score;

          return { ...article, score };
        })
        .filter(a => a.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 8);

      this.renderResults(results);
    }

    renderResults(results) {
      if (!results.length) {
        this.results.innerHTML = '<div class="search-no-results">Ничего не найдено</div>';
        return this.showResults();
      }

      this.results.innerHTML = results.map(a => `
        <a href="${a.url}" class="search-result-item">
          ${a.image ? `<img src="${a.image}" class="search-result-image" alt="">` : ''}
          <div class="search-result-content">
            <div class="search-result-title">${a.title}</div>
            <div class="search-result-excerpt">
              ${simpleMarkdown(a.intro_html || a.intro || '')}
            </div>
          </div>
        </a>
      `).join('');

      this.showResults();
    }

    showResults() {
      this.results.classList.add('active');
    }

    hideResults() {
      this.results.classList.remove('active');
    }
  }

  class RandomArticle {
    constructor() {
      this.buttons = document.querySelectorAll('.nav-random');
      this.articles = [];
      this.ready = false;
      this.init();
    }

    init() {
      const dataScript = document.getElementById('search-data');
      if (!dataScript) return;

      try {
        this.articles = JSON.parse(dataScript.textContent);
        this.ready = this.articles.length > 0;
      } catch {
        return;
      }

      this.buttons.forEach(btn => {
        btn.addEventListener('click', e => {
          e.preventDefault();
          this.goToRandom();
        });
      });
    }

    goToRandom() {
      if (!this.ready) return;

      const index = Math.floor(Math.random() * this.articles.length);
      const article = this.articles[index];
      if (!article || !article.url) return;

      window.location.assign(article.url);
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    new ChervepediaSearch();
    new RandomArticle();
  });
})();
