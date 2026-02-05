/**
 * Червепедия — Main JavaScript
 * Mobile Menu, Lightbox, Categories Accordion, Favorites Carousel (auto slow infinite + drag + touch + buttons)
 */
(function () {
  'use strict';

  // ==================== MOBILE MENU ====================
  class MobileMenu {
    constructor() {
      this.toggle = document.getElementById('mobile-menu-toggle');
      this.nav = document.getElementById('mobile-nav');
      if (!this.toggle || !this.nav) return;

      this.toggle.addEventListener('click', () => this.toggleMenu());
    }

    toggleMenu() {
      this.nav.classList.toggle('active');
      this.toggle.classList.toggle('active');
    }
  }

  // ==================== LIGHTBOX ====================
  class Lightbox {
    constructor() {
      this.lightbox = document.getElementById('lightbox');
      if (!this.lightbox) return;

      this.overlay = this.lightbox.querySelector('.lightbox-overlay');
      this.image = this.lightbox.querySelector('.lightbox-image');
      this.caption = this.lightbox.querySelector('.lightbox-caption');
      this.closeBtn = this.lightbox.querySelector('.lightbox-close');
      this.prevBtn = this.lightbox.querySelector('.lightbox-prev');
      this.nextBtn = this.lightbox.querySelector('.lightbox-next');
      this.currentSpan = this.lightbox.querySelector('.lightbox-current');
      this.totalSpan = this.lightbox.querySelector('.lightbox-total');

      this.images = [];
      this.currentIndex = 0;

      this.init();
    }

    init() {
      document.querySelectorAll('[data-lightbox]').forEach((img, index) => {
        img.style.cursor = 'pointer';
        img.addEventListener('click', () => this.open(index));
      });

      this.images = Array.from(document.querySelectorAll('[data-lightbox]'));

      this.closeBtn?.addEventListener('click', () => this.close());
      this.overlay?.addEventListener('click', () => this.close());
      this.prevBtn?.addEventListener('click', () => this.prev());
      this.nextBtn?.addEventListener('click', () => this.next());

      document.addEventListener('keydown', (e) => {
        if (!this.lightbox.classList.contains('active')) return;
        switch (e.key) {
          case 'Escape': this.close(); break;
          case 'ArrowLeft': this.prev(); break;
          case 'ArrowRight': this.next(); break;
        }
      });
    }

    open(index) {
      this.currentIndex = index;
      this.updateImage();
      this.lightbox.classList.add('active');
      document.body.style.overflow = 'hidden';
    }

    close() {
      this.lightbox.classList.remove('active');
      document.body.style.overflow = '';
    }

    prev() {
      this.currentIndex = (this.currentIndex - 1 + this.images.length) % this.images.length;
      this.updateImage();
    }

    next() {
      this.currentIndex = (this.currentIndex + 1) % this.images.length;
      this.updateImage();
    }

    updateImage() {
      const img = this.images[this.currentIndex];
      if (!img) return;

      this.image.src = img.src;
      this.image.alt = img.alt || '';
      this.caption.textContent = img.alt || '';
      this.currentSpan.textContent = this.currentIndex + 1;
      this.totalSpan.textContent = this.images.length;

      const showNav = this.images.length > 1;
      this.prevBtn.style.display = showNav ? '' : 'none';
      this.nextBtn.style.display = showNav ? '' : 'none';
    }
  }

  // ==================== CATEGORIES ACCORDION ====================
  class CategoriesAccordion {
    constructor() {
      document.querySelectorAll('.category-header').forEach(header => {
        const group = header.closest('.category-group');
        if (group?.id !== 'politika') group.classList.add('open');

        header.addEventListener('click', () => {
          group.classList.toggle('open');
        });
      });
    }
  }

  // ==================== FAVORITES CAROUSEL ====================
  class FavoritesCarousel {
    constructor(container) {
      this.container = container;
      this.track = container.querySelector('.favorites-track');
      if (!this.track) return;

      this.prevBtn = container.querySelector('.carousel-prev');
      this.nextBtn = container.querySelector('.carousel-next');

      this.isDragging = false;
      this.startX = 0;
      this.scrollLeft = 0;

      this.init();
    }

    init() {
      // Кнопки (смещение на ширину видимой области)
      this.prevBtn?.addEventListener('click', () => this.scrollBy(-this.track.clientWidth));
      this.nextBtn?.addEventListener('click', () => this.scrollBy(this.track.clientWidth));

      // Drag / swipe
      this.track.addEventListener('mousedown',  e => this.startDragging(e));
      this.track.addEventListener('touchstart', e => this.startDragging(e), { passive: false });

      document.addEventListener('mousemove', e => this.onMove(e));
      document.addEventListener('mouseup',   () => this.stopDragging());
      document.addEventListener('mouseleave', () => this.stopDragging());

      document.addEventListener('touchmove', e => this.onMove(e), { passive: false });
      document.addEventListener('touchend',   () => this.stopDragging());
      document.addEventListener('touchcancel', () => this.stopDragging());
    }

    startDragging(e) {
      this.isDragging = true;
      this.container.classList.add('dragging');
      this.track.style.animationPlayState = 'paused'; // останавливаем авто-анимацию

      const clientX = e.type.includes('mouse') ? e.pageX : e.touches[0].clientX;
      this.startX = clientX - this.track.getBoundingClientRect().left;
      this.scrollLeft = this.track.scrollLeft;

      e.preventDefault();
    }

    onMove(e) {
      if (!this.isDragging) return;
      e.preventDefault();

      const clientX = e.type.includes('mouse') ? e.pageX : e.touches[0].clientX;
      const x = clientX - this.track.getBoundingClientRect().left;
      const walk = (x - this.startX) * 2.2;

      this.track.scrollLeft = this.scrollLeft - walk;
    }

    stopDragging() {
      if (!this.isDragging) return;
      this.isDragging = false;
      this.container.classList.remove('dragging');
      this.track.style.animationPlayState = 'running'; // возобновляем авто-прокрутку
    }

    scrollBy(amount) {
      this.track.scrollBy({ left: amount, behavior: 'smooth' });
    }
  }

  // ==================== ИНИЦИАЛИЗАЦИЯ ====================
  document.addEventListener('DOMContentLoaded', () => {
    new MobileMenu();
    new Lightbox();
    new CategoriesAccordion();

    const favorites = document.querySelector('.favorites-carousel');
    if (favorites) {
      new FavoritesCarousel(favorites);
    }
  });
})();
