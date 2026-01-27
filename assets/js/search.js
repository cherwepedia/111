/**
 * Червепедия - Search Engine
 * Поиск с автодополнением, исправлением раскладки и опечаток
 */

(function() {
  'use strict';

  // Keyboard layout mapping (EN -> RU)
  const enToRu = {
    'q': 'й', 'w': 'ц', 'e': 'у', 'r': 'к', 't': 'е', 'y': 'н', 'u': 'г', 'i': 'ш', 'o': 'щ', 'p': 'з',
    '[': 'х', ']': 'ъ', 'a': 'ф', 's': 'ы', 'd': 'в', 'f': 'а', 'g': 'п', 'h': 'р', 'j': 'о', 'k': 'л',
    'l': 'д', ';': 'ж', "'": 'э', 'z': 'я', 'x': 'ч', 'c': 'с', 'v': 'м', 'b': 'и', 'n': 'т', 'm': 'ь',
    ',': 'б', '.': 'ю'
  };

  // RU -> EN mapping
  const ruToEn = Object.fromEntries(Object.entries(enToRu).map(([k, v]) => [v, k]));

  // Convert text from one layout to another
  function convertLayout(text, mapping) {
    return text.toLowerCase().split('').map(c => mapping[c] || c).join('');
  }

  // Simple fuzzy matching with typo tolerance
  function fuzzyMatch(text, query) {
    text = text.toLowerCase();
    query = query.toLowerCase();

    if (text.includes(query)) return { match: true, score: 100 };

    // Try layout conversion
    const ruQuery = convertLayout(query, enToRu);
    if (text.includes(ruQuery)) return { match: true, score: 95 };

    const enQuery = convertLayout(query, ruToEn);
    if (text.includes(enQuery)) return { match: true, score: 95 };

    // Levenshtein-based fuzzy match for short queries
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

  // Levenshtein distance calculation
  function levenshteinDistance(a, b) {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b[i - 1] === a[j - 1]) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[b.length][a.length];
  }

  // Search class
  class ChervepediaSearch {
    constructor() {
      this.articles = [];
      this.input = document.getElementById('search-input');
      this.results = document.getElementById('search-results');
      this.debounceTimer = null;

      if (!this.input || !this.results) return;

      this.init();
    }

    async init() {
      await this.loadArticles();
      this.bindEvents();
    }

    async loadArticles() {
      // Articles are embedded in the page as JSON
      const dataScript = document.getElementById('search-data');
      if (dataScript) {
        try {
          this.articles = JSON.parse(dataScript.textContent);
        } catch (e) {
          console.error('Failed to parse search data:', e);
        }
      }
    }

    bindEvents() {
      this.input.addEventListener('input', () => this.handleInput());
      this.input.addEventListener('focus', () => this.handleFocus());
      document.addEventListener('click', (e) => this.handleClickOutside(e));
      this.input.addEventListener('keydown', (e) => this.handleKeydown(e));
    }

    handleInput() {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => this.search(), 150);
    }

    handleFocus() {
      if (this.input.value.trim().length >= 2) {
        this.search();
      }
    }

    handleClickOutside(e) {
      if (!this.input.contains(e.target) && !this.results.contains(e.target)) {
        this.hideResults();
      }
    }

    handleKeydown(e) {
      const items = this.results.querySelectorAll('.search-result-item');
      const active = this.results.querySelector('.search-result-item.active');
      let index = Array.from(items).indexOf(active);

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          index = index < items.length - 1 ? index + 1 : 0;
          this.setActiveItem(items, index);
          break;
        case 'ArrowUp':
          e.preventDefault();
          index = index > 0 ? index - 1 : items.length - 1;
          this.setActiveItem(items, index);
          break;
        case 'Enter':
          if (active) {
            e.preventDefault();
            window.location.href = active.href;
          }
          break;
        case 'Escape':
          this.hideResults();
          break;
      }
    }

    setActiveItem(items, index) {
      items.forEach(item => item.classList.remove('active'));
      if (items[index]) {
        items[index].classList.add('active');
        items[index].scrollIntoView({ block: 'nearest' });
      }
    }

    search() {
      const query = this.input.value.trim();

      if (query.length < 2) {
        this.hideResults();
        return;
      }

      const results = this.articles
        .map(article => {
          // Priority: title > intro > content
          const titleMatch = fuzzyMatch(article.title, query);
          const introMatch = fuzzyMatch(article.intro || '', query);
          const contentMatch = fuzzyMatch(article.content || '', query);

          let score = 0;
          if (titleMatch.match) score = titleMatch.score + 50;
          else if (introMatch.match) score = introMatch.score + 25;
          else if (contentMatch.match) score = contentMatch.score;

          return { ...article, score };
        })
        .filter(a => a.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 8);

      this.renderResults(results);
    }

    renderResults(results) {
      if (results.length === 0) {
        this.results.innerHTML = '<div class="search-no-results">Ничего не найдено</div>';
        this.showResults();
        return;
      }

      this.results.innerHTML = results.map(article => `
        <a href="${article.url}" class="search-result-item">
          ${article.image ? `<img src="${article.image}" alt="" class="search-result-image">` : ''}
          <div class="search-result-content">
            <div class="search-result-title">${this.escapeHtml(article.title)}</div>
            <div class="search-result-excerpt">${this.escapeHtml(article.intro || '')}</div>
          </div>
        </a>
      `).join('');

      this.showResults();
    }

    escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }

    showResults() {
      this.results.classList.add('active');
    }

    hideResults() {
      this.results.classList.remove('active');
    }
  }

  // Random article functionality
  class RandomArticle {
    constructor() {
      this.buttons = document.querySelectorAll('.nav-random');
      this.articles = [];
      this.init();
    }

    async init() {
      const dataScript = document.getElementById('search-data');
      if (dataScript) {
        try {
          this.articles = JSON.parse(dataScript.textContent);
        } catch (e) {
          console.error('Failed to parse search data:', e);
        }
      }

      this.buttons.forEach(btn => {
        btn.addEventListener('click', () => this.goToRandom());
      });
    }

    goToRandom() {
      if (this.articles.length === 0) return;
      const random = this.articles[Math.floor(Math.random() * this.articles.length)];
      window.location.href = random.url;
    }
  }

  // Initialize on DOM ready
  document.addEventListener('DOMContentLoaded', () => {
    new ChervepediaSearch();
    new RandomArticle();
  });
})();
