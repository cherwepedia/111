const express = require('express');
const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { marked } = require('marked');
const ejs = require('ejs');

const app = express();
const PORT = 3000;

// Serve static assets
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// Load site config
const config = {
  title: 'Червепедия',
  description: 'Энциклопедия Черветреда — свободная энциклопедия, которую может редактировать каждый',
  baseurl: '',
  url: ''
};

// Load featured
let featured = [
  {
    title: "Кинаман",
    url: "/люди/kinaman/",
    image: "https://picsum.photos/seed/kinaman/400/300",
    excerpt: "Легендарный участник Черветреда, известный своими мемами и активной деятельностью."
  }
];

// Load all posts
function loadPosts() {
  const postsDir = path.join(__dirname, '_posts');
  if (!fs.existsSync(postsDir)) return [];

  return fs.readdirSync(postsDir)
    .filter(f => f.endsWith('.md'))
    .map(filename => {
      const content = fs.readFileSync(path.join(postsDir, filename), 'utf-8');
      const { data, content: body } = matter(content);

      // Parse filename for date
      const match = filename.match(/^(\d{4}-\d{2}-\d{2})-(.+)\.md$/);
      const slug = match ? match[2] : filename.replace('.md', '');

      // Build URL based on categories
      const cats = data.categories || [];
      const category = cats[0] || 'uncategorized';
      const url = `/${encodeURIComponent(category.toLowerCase())}/${slug}/`;

      return {
        ...data,
        slug,
        url,
        content: body,
        htmlContent: marked(body),
        excerpt: body.slice(0, 200).replace(/[#*_\[\]]/g, '') + '...'
      };
    });
}

// Generate search data
function getSearchData(posts) {
  return posts.map(post => ({
    title: post.title,
    url: post.url,
    content: post.content.replace(/[#*_\[\]<>]/g, '').slice(0, 500),
    excerpt: post.excerpt,
    categories: post.categories || [],
    image: post.infobox?.image || '',
    featured: post.featured || false
  }));
}

// Template helpers
function renderLayout(layoutName, data) {
  const layoutPath = path.join(__dirname, '_layouts', `${layoutName}.html`);
  let template = fs.readFileSync(layoutPath, 'utf-8');

  // Remove Jekyll front matter
  template = template.replace(/^---[\s\S]*?---/, '');

  return template;
}

// Home page
app.get('/', (req, res) => {
  const posts = loadPosts();
  const searchData = getSearchData(posts);

  const html = `
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${config.title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Serif:wght@400;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/glightbox@3.2.0/dist/css/glightbox.min.css">
  <link rel="stylesheet" href="/assets/css/main.css">
</head>
<body>
  <header class="site-header">
    <div class="header-container">
      <a href="/" class="site-logo">Червепедия</a>
      <nav class="site-nav">
        <a href="/">Главная</a>
        <a href="/categories/">Категории</a>
        <a href="/random/" id="random-link">Случайная</a>
      </nav>
    </div>
  </header>

  <main class="site-main">
    <section class="home-hero">
      <h1 class="home-title">Червепедия</h1>
      <p class="home-subtitle">Энциклопедия Черветреда — свободная энциклопедия, которую может редактировать каждый</p>

      <div class="search-container">
        <div class="search-input-wrapper">
          <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
          <input type="text" id="search-input" class="search-input" placeholder="Поиск по энциклопедии..." autocomplete="off" spellcheck="false">
        </div>
        <div id="search-results" class="search-results"></div>
      </div>

      <div class="quick-links">
        <a href="/random/" id="random-article-btn" class="quick-link">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>
          </svg>
          Случайная статья
        </a>
        <a href="/categories/" class="quick-link">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 6h18M3 12h18M3 18h18"/>
          </svg>
          Категории
        </a>
      </div>
    </section>

    ${posts.filter(p => p.featured).length > 0 || featured.length > 0 ? `
    <section class="featured-section">
      <h2 class="featured-title">Избранные статьи</h2>
      <div class="featured-carousel">
        <div class="swiper">
          <div class="swiper-wrapper">
            ${featured.map(item => `
            <div class="swiper-slide">
              <a href="${item.url}" class="featured-slide">
                <img src="${item.image}" alt="${item.title}" class="featured-slide-image" loading="lazy">
                <div class="featured-slide-content">
                  <h3 class="featured-slide-title">${item.title}</h3>
                  <p class="featured-slide-excerpt">${item.excerpt}</p>
                </div>
              </a>
            </div>
            `).join('')}
            ${posts.filter(p => p.featured).map(post => `
            <div class="swiper-slide">
              <a href="${post.url}" class="featured-slide">
                <img src="${post.infobox?.image || 'https://picsum.photos/400/300?random=' + Math.random()}" alt="${post.title}" class="featured-slide-image" loading="lazy">
                <div class="featured-slide-content">
                  <h3 class="featured-slide-title">${post.title}</h3>
                  <p class="featured-slide-excerpt">${post.excerpt.slice(0, 100)}</p>
                </div>
              </a>
            </div>
            `).join('')}
          </div>
        </div>
        <div class="swiper-button-prev"></div>
        <div class="swiper-button-next"></div>
        <div class="swiper-pagination"></div>
      </div>
    </section>
    ` : ''}
  </main>

  <footer class="site-footer">
    <div class="footer-container">
      <p>&copy; ${new Date().getFullYear()} Червепедия — Энциклопедия Черветреда</p>
    </div>
  </footer>

  <script src="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/glightbox@3.2.0/dist/js/glightbox.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/fuse.js@7.0.0"></script>
  <script>window.searchData = ${JSON.stringify(searchData)};</script>
  <script src="/assets/js/main.js"></script>
</body>
</html>
  `;

  res.send(html);
});

// Categories page
app.get('/categories/', (req, res) => {
  const posts = loadPosts();
  const searchData = getSearchData(posts);

  // Simple categories structure
  const cats = [
    { name: 'Истоки', slug: 'истоки', description: 'История возникновения и развития' },
    { name: 'Люди', slug: 'люди', description: 'Известные личности и участники' },
    { name: 'Черветред', slug: 'черветред', description: 'Основные концепции и явления' },
    { name: 'Политика', slug: 'политика', description: 'Политические события и движения' }
  ];

  const html = `
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Категории — ${config.title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Serif:wght@400;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css">
  <link rel="stylesheet" href="/assets/css/main.css">
</head>
<body>
  <header class="site-header">
    <div class="header-container">
      <a href="/" class="site-logo">Червепедия</a>
      <nav class="site-nav">
        <a href="/">Главная</a>
        <a href="/categories/">Категории</a>
        <a href="/random/" id="random-link">Случайная</a>
      </nav>
    </div>
  </header>

  <main class="site-main">
    <div class="categories-page">
      <h1>Категории</h1>

      ${cats.map(cat => {
        const catPosts = posts.filter(p =>
          (p.categories || []).some(c => c.toLowerCase() === cat.name.toLowerCase())
        );
        return `
        <div class="category-section" id="${cat.slug}">
          <div class="category-header">
            <div>
              <span class="category-name">${cat.name}</span>
              <span style="color: var(--color-text-muted); font-size: 0.875rem; margin-left: 0.5rem;">${cat.description}</span>
            </div>
            <span class="category-toggle">+</span>
          </div>
          <div class="category-content">
            ${catPosts.map(post => `
            <a href="${post.url}" class="article-list-item">
              <img src="${post.infobox?.image || 'https://picsum.photos/seed/' + encodeURIComponent(post.title) + '/160/120'}" alt="" class="article-list-image" loading="lazy">
              <div class="article-list-content">
                <div class="article-list-title">${post.title}</div>
                <div class="article-list-excerpt">${post.excerpt.slice(0, 120)}</div>
              </div>
            </a>
            `).join('')}
            ${catPosts.length === 0 ? '<div class="article-list-item" style="justify-content: center; color: var(--color-text-muted);">Нет статей в этой категории</div>' : ''}
          </div>
        </div>
        `;
      }).join('')}
    </div>
  </main>

  <footer class="site-footer">
    <div class="footer-container">
      <p>&copy; ${new Date().getFullYear()} Червепедия — Энциклопедия Черветреда</p>
    </div>
  </footer>

  <script src="https://cdn.jsdelivr.net/npm/fuse.js@7.0.0"></script>
  <script>window.searchData = ${JSON.stringify(searchData)};</script>
  <script src="/assets/js/main.js"></script>
</body>
</html>
  `;

  res.send(html);
});

// Random redirect
app.get('/random/', (req, res) => {
  const posts = loadPosts();
  if (posts.length === 0) {
    return res.redirect('/');
  }
  const randomPost = posts[Math.floor(Math.random() * posts.length)];
  res.redirect(randomPost.url);
});

// Generate TOC from content
function generateToc(html) {
  const headings = [];
  const regex = /<h([23])[^>]*id="([^"]*)"[^>]*>([^<]*)<\/h[23]>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    headings.push({
      level: parseInt(match[1]),
      id: match[2],
      title: match[3]
    });
  }

  if (headings.length === 0) {
    // Try without id
    const regex2 = /<h([23])[^>]*>([^<]*)<\/h[23]>/gi;
    let counter = 0;
    html = html.replace(regex2, (match, level, title) => {
      const id = 'section-' + (counter++);
      headings.push({ level: parseInt(level), id, title });
      return match.replace(`<h${level}`, `<h${level} id="${id}"`);
    });
  }

  return { headings, html };
}

// Article page - dynamic route
app.get('/:category/:slug/', (req, res) => {
  const posts = loadPosts();
  const searchData = getSearchData(posts);
  const { category, slug } = req.params;

  const post = posts.find(p => p.slug === slug);

  if (!post) {
    return res.status(404).send('Статья не найдена');
  }

  // Add IDs to headings for TOC
  let processedHtml = post.htmlContent;
  let counter = 0;
  processedHtml = processedHtml.replace(/<h([23])>([^<]*)<\/h[23]>/gi, (match, level, title) => {
    const id = 'section-' + (counter++);
    return `<h${level} id="${id}">${title}</h${level}>`;
  });

  // Generate TOC
  const tocItems = [];
  const tocRegex = /<h([23])\s+id="([^"]+)"[^>]*>([^<]*)<\/h[23]>/gi;
  let tocMatch;
  while ((tocMatch = tocRegex.exec(processedHtml)) !== null) {
    tocItems.push({
      level: parseInt(tocMatch[1]),
      id: tocMatch[2],
      title: tocMatch[3]
    });
  }

  const html = `
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${post.title} — ${config.title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Serif:wght@400;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/glightbox@3.2.0/dist/css/glightbox.min.css">
  <link rel="stylesheet" href="/assets/css/main.css">
</head>
<body>
  <header class="site-header">
    <div class="header-container">
      <a href="/" class="site-logo">Червепедия</a>
      <nav class="site-nav">
        <a href="/">Главная</a>
        <a href="/categories/">Категории</a>
        <a href="/random/" id="random-link">Случайная</a>
      </nav>
    </div>
  </header>

  <main class="site-main">
    <article class="wiki-article">
      <header class="article-header">
        <h1 class="article-title">${post.title}</h1>
      </header>

      ${post.intro ? `<div class="article-intro">${marked(post.intro)}</div>` : ''}

      <!-- Table of Contents -->
      ${tocItems.length > 0 ? `
      <nav class="toc-container">
        <div class="toc-header" onclick="toggleToc()">
          <span class="toc-title">Содержание</span>
          <span class="toc-toggle" id="toc-toggle">[скрыть]</span>
        </div>
        <div class="toc-content" id="toc-content">
          <ul class="toc-list">
            ${tocItems.map((item, i) => `
              <li class="toc-item toc-level-${item.level}">
                <a href="#${item.id}">${item.title}</a>
              </li>
            `).join('')}
          </ul>
        </div>
      </nav>
      ` : ''}

      <div class="article-body">
        ${post.infobox ? `
        <aside class="infobox">
          ${post.infobox.image ? `
          <div class="infobox-image">
            <a href="${post.infobox.image}" class="glightbox" data-gallery="infobox">
              <img src="${post.infobox.image}" alt="${post.title}">
            </a>
            <div class="infobox-image-title">${post.infobox.image_caption || post.title}</div>
          </div>
          ` : ''}
          <table class="infobox-table">
            ${(post.infobox.data || []).map(item => `
            <tr>
              <th>${item.label}</th>
              <td>${item.value}</td>
            </tr>
            `).join('')}
          </table>
        </aside>
        ` : ''}

        <div class="article-content">
          ${processedHtml}
        </div>
      </div>

      ${post.gallery && post.gallery.length > 0 ? `
      <section class="article-gallery">
        <h2>Галерея</h2>
        <div class="gallery-grid">
          ${post.gallery.map(img => `
          <figure class="gallery-item">
            <a href="${img.url}" class="glightbox" data-gallery="article-gallery" data-description="${img.caption || ''}">
              <img src="${img.url}" alt="${img.caption || ''}">
            </a>
            ${img.caption ? `<figcaption>${img.caption}</figcaption>` : ''}
          </figure>
          `).join('')}
        </div>
      </section>
      ` : ''}

      <footer class="article-footer">
        <div class="article-categories">
          <span class="categories-label">Категории:</span>
          ${(post.categories || []).map(cat => `
          <a href="/categories/#${encodeURIComponent(cat.toLowerCase())}" class="category-tag">${cat}</a>
          `).join('')}
        </div>
      </footer>
    </article>
  </main>

  <footer class="site-footer">
    <div class="footer-container">
      <p>&copy; ${new Date().getFullYear()} Червепедия — Энциклопедия Черветреда</p>
    </div>
  </footer>

  <script src="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/glightbox@3.2.0/dist/js/glightbox.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/fuse.js@7.0.0"></script>
  <script>window.searchData = ${JSON.stringify(searchData)};</script>
  <script src="/assets/js/main.js"></script>
  <script>
    document.addEventListener('DOMContentLoaded', function() {
      // Initialize lightbox
      const lightbox = GLightbox({
        touchNavigation: true,
        loop: true,
        closeButton: true
      });

      // Initialize article carousels
      document.querySelectorAll('.article-carousel').forEach(function(el) {
        new Swiper(el.querySelector('.swiper'), {
          slidesPerView: 1,
          spaceBetween: 0,
          navigation: {
            nextEl: el.querySelector('.swiper-button-next'),
            prevEl: el.querySelector('.swiper-button-prev'),
          },
          pagination: {
            el: el.querySelector('.swiper-pagination'),
            clickable: true
          }
        });
      });
    });

    function toggleToc() {
      const content = document.getElementById('toc-content');
      const toggle = document.getElementById('toc-toggle');
      if (content.style.display === 'none') {
        content.style.display = 'block';
        toggle.textContent = '[скрыть]';
      } else {
        content.style.display = 'none';
        toggle.textContent = '[показать]';
      }
    }
  </script>
</body>
</html>
  `;

  res.send(html);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Червепедия preview server running at http://localhost:${PORT}`);
});
