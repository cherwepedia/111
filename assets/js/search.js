// Поиск по статьям
let searchData = [];

// Загрузка данных для поиска
fetch('/search.json')
  .then(response => response.json())
  .then(data => {
    searchData = data;
  })
  .catch(error => {
    console.log('Search data not loaded:', error);
  });

function performSearch(query) {
  const searchResults = document.getElementById('searchResults');
  const content = document.querySelector('.content');

  // Синхронизация полей поиска
  const desktopInput = document.getElementById('desktopSearchInput');
  const mobileInput = document.getElementById('mobileSearchInput');

  if (desktopInput && desktopInput !== event?.target) {
    desktopInput.value = query;
  }
  if (mobileInput && mobileInput !== event?.target) {
    mobileInput.value = query;
  }

  if (!query || query.trim() === '') {
    searchResults.style.display = 'none';
    content.style.display = 'block';
    return;
  }

  // Поиск
  const results = searchData.filter(post => {
    const searchStr = (post.title + ' ' + post.content + ' ' + post.categories.join(' ')).toLowerCase();
    return searchStr.includes(query.toLowerCase());
  });

  // Отображение результатов
  if (results.length > 0) {
    let html = '<h2>Результаты поиска</h2>';
    results.forEach(post => {
      html += `
        <div class="search-result-item">
          <div class="search-result-content">
            <h3 class="search-result-title">
              <a href="${post.url}">${post.title}</a>
            </h3>
            <p class="search-result-excerpt">${post.excerpt}</p>
            <div class="search-result-categories">
              ${post.categories.map(cat => `<span class="category-tag">${cat}</span>`).join('')}
            </div>
          </div>
          ${post.image ? `
            <div class="search-result-image">
              <img src="${post.image}" alt="${post.title}" loading="lazy">
            </div>
          ` : ''}
        </div>
      `;
    });
    searchResults.innerHTML = html;
    searchResults.style.display = 'block';
    content.style.display = 'none';
  } else {
    searchResults.innerHTML = '<h2>Результаты поиска</h2><p>Ничего не найдено</p>';
    searchResults.style.display = 'block';
    content.style.display = 'none';
  }
}

// Ленивая загрузка изображений
document.addEventListener('DOMContentLoaded', function() {
  const lazyImages = document.querySelectorAll('img[loading="lazy"]');

  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.classList.add('loaded');
          observer.unobserve(img);
        }
      });
    });

    lazyImages.forEach(img => imageObserver.observe(img));
  } else {
    // Fallback для старых браузеров
    lazyImages.forEach(img => img.classList.add('loaded'));
  }
});
