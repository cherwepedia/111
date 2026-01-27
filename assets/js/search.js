/**
 * Червепедия - Search Engine
 * Поиск + случайная статья (работает везде)
 */

(function () {
  'use strict';

  /* ==========================
     SEARCH (БЕЗ ИЗМЕНЕНИЙ)
     ========================== */

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

  function fuzzyMatch(text, query) {
    text = text.toLowerCase();
    query = query.toLowerCase();

    if (text.includes(query)) return { match: true, score: 100 };

    const ruQuery = convertLayout(query, enToRu);
    if (text.includes(ruQuery)) return { match: true, score: 95 };

    const enQuery = convertLayout(query, ruToEn);
    if (text.includes(enQuery)) return { match: true, score: 95 };

    if (query.length >= 3) {
      for (const word of text.split(/\s+/)) {
        const dist = levenshteinDistance(word.slice(0, query.length + 2), query);
        if (dist <= Math.floor(query.length / 4) + 1) {
          return { match: true, score: 80 - dist * 5 };
        }
      }
    }

    return { match: false, score: 0 };
  }

  function simpleMarkdown(text) {
    if (!text) return '';
    return text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>');
  }

  /* ==========================
     RANDOM ARTICLE (FIXED)
     ========================== */

  class RandomArticle {
    constructor() {
      this.buttons = document.querySelectorAll('.nav-random');
      this.articles = [];
      this.init();
    }

    async init() {
      await this.loadArticles();

      if (!this.articles.length) return;

      this.buttons.forEach(btn => {
        btn.addEventListener('click', e => {
          e.preventDefault();
          this.goToRandom();
        });
      });
    }

    async loadArticles() {
      // 1. пробуем search-data (главная)
      const dataScript = document.getElementById('search-data');
      if (dataScript) {
        try {
          this.articles = JSON.parse(dataScript.textContent);
          return;
        } catch {}
      }

      // 2. fallback: грузим search.json (статьи)
      try {
        const res = await fetch('/search.json', { cache: 'force-cache' });
        if (!res.ok) return;
        this.articles = await res.json();
      } catch {}
    }

    goToRandom() {
      const a = this.articles[Math.floor(Math.random() * this.articles.length)];
      if (!a || !a.url) return;
      window.location.assign(a.url);
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    new RandomArticle();
  });
})();
