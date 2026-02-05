/**
 * Червепедия - Main JavaScript
 * Mobile Menu, Lightbox, Categories, Carousel (mouse + touch)
 */
(function() {
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
          case 'Escape':
            this.close();
            break;
          case 'ArrowLeft':
            this.prev();
            break;
          case 'ArrowRight':
            this.next();
            break;
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
      this.image.alt = img.alt;
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
        if (group.id !== 'politika') group.classList.add('open');

        header.addEventListener('click', () => {
          group.classList.toggle('open');
        });
      });
    }
  }

  // ==================== CAROUSEL (MOUSE + TOUCH) ====================
  class Carousel {
    constructor(container) {
      this.container = container;
      this.track = container.querySelector('.carousel-track');
      this.slides = container.querySelectorAll('.carousel-slide');
      this.prevBtn = container.querySelector('.carousel-prev');
      this.nextBtn = container.querySelector('.carousel-next');

      this.currentIndex = 0;

      this.init();
    }

    init() {
      // кнопки
      this.prevBtn?.addEventListener('click', () => this.prev());
      this.nextBtn?.addEventListener('click', () => this.next());

      // ================== MOUSE DRAG ==================
      let isDown = false;
      let startX, scrollLeft;

      this.track.addEventListener('mousedown', e => {
        isDown = true;
        this.container.classList.add('dragging');
        startX = e.pageX - this.container.offsetLeft;
        scrollLeft = this.track.scrollLeft;
      });

      this.track.addEventListener('mouseleave', () => {
        isDown = false;
        this.container.classList.remove('dragging');
      });

      this.track.addEventListener('mouseup', () => {
        isDown = false;
        this.container.classList.remove('dragging');
      });

      this.track.addEventListener('mousemove', e => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - this.container.offsetLeft;
        const walk = (x - startX) * 2; // скорость прокрутки
        this.track.scrollLeft = scrollLeft - walk;
      });

      // ================== TOUCH ==================
      let touchStartX = 0;
      this.track.addEventListener('touchstart', e => {
        touchStartX = e.touches[0].clientX;
      }, { passive: true });

      this.track.addEventListener('touchend', e => {
        const diff = touchStartX - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 20) {
          this.track.scrollBy({ left: diff, behavior: 'smooth' });
        }
      });
    }

    prev() {
      this.track.scrollBy({ left: -this.track.clientWidth, behavior: 'smooth' });
    }

    next() {
      this.track.scrollBy({ left: this.track.clientWidth, behavior: 'smooth' });
    }
  }

  // ==================== INIT ====================
  document.addEventListener('DOMContentLoaded', () => {
    new MobileMenu();
    new Lightbox();
    new CategoriesAccordion();

    // Все карусели на странице
    document.querySelectorAll('.carousel-container').forEach(container => {
      new Carousel(container);
    });
  });
})();
