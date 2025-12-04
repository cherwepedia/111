// Мобильное меню
function toggleMobileMenu() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('mobileMenuOverlay');

  sidebar.classList.toggle('active');
  overlay.classList.toggle('active');
}

// Закрытие меню при клике на ссылку
document.addEventListener('DOMContentLoaded', function() {
  const sidebarLinks = document.querySelectorAll('.sidebar-nav a');

  sidebarLinks.forEach(link => {
    link.addEventListener('click', function() {
      if (window.innerWidth <= 768) {
        toggleMobileMenu();
      }
    });
  });

  // Предзагрузка критических ресурсов
  const criticalImages = document.querySelectorAll('.infobox-image img, .gallery-item img');
  criticalImages.forEach(img => {
    const src = img.getAttribute('src');
    if (src) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      document.head.appendChild(link);
    }
  });
});

// Оптимизация производительности - debounce для поиска
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Применяем debounce к поиску
if (typeof performSearch === 'function') {
  const debouncedSearch = debounce(performSearch, 300);

  const searchInputs = document.querySelectorAll('#desktopSearchInput, #mobileSearchInput');
  searchInputs.forEach(input => {
    if (input) {
      input.addEventListener('input', (e) => debouncedSearch(e.target.value));
    }
  });
}

// Плавная прокрутка к якорям
document.addEventListener('DOMContentLoaded', function() {
  const links = document.querySelectorAll('a[href^="#"]');

  links.forEach(link => {
    link.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href === '#') return;

      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
});

// Оптимизация: отложенная загрузка для iframe
document.addEventListener('DOMContentLoaded', function() {
  const iframes = document.querySelectorAll('iframe[loading="lazy"]');

  if ('IntersectionObserver' in window) {
    const iframeObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const iframe = entry.target;
          if (iframe.dataset.src) {
            iframe.src = iframe.dataset.src;
          }
          observer.unobserve(iframe);
        }
      });
    });

    iframes.forEach(iframe => iframeObserver.observe(iframe));
  }
});
