/**
 * Червепедия - Main JavaScript
 * Lightbox, Carousel (touch + mouse), Categories, Mobile Menu
 */

(function() {
  'use strict';

  // --------------------
  // Mobile Menu
  // --------------------
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

  // --------------------
  // Lightbox
  // --------------------
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

      this.closeBtn.addEventListener('click', () => this.close());
      this.overlay.addEventListener('click', () => this.close());
      this.prevBtn.addEventListener('click', () => this.prev());
      this.nextBtn.addEventListener('click', () => this.next());

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

  // --------------------
  // Carousel (touch + mouse drag)
  // --------------------
  class Carousel {
    constructor(element) {
      this.container = element;
      this.track = element.querySelector('.carousel-track');
      this.slides = element.querySelectorAll('.carousel-slide');
      this.prevBtn = element.querySelector('.carousel-prev');
      this.nextBtn = element.querySelector('.carousel-next');
      this.dots = element.querySelectorAll('.carousel-dot');
      this.caption = element.closest('.article-carousel')?.querySelector('.carousel-caption');

      this.currentIndex = 0;
      this.captions = [];

      this.slides.forEach(slide => {
        const img = slide.querySelector('img');
        this.captions.push(img?.alt || '');
      });

      this.isDragging = false;
      this.startX = 0;
      this.scrollStart = 0;

      this.init();
    }

    init() {
      this.prevBtn?.addEventListener('click', () => this.prev());
      this.nextBtn?.addEventListener('click', () => this.next());

      this.dots.forEach((dot, index) => {
        dot.addEventListener('click', () => this.goTo(index));
      });

      // ---- Touch swipe ----
      this.track.addEventListener('touchstart', (e) => {
        this.startX = e.touches[0].clientX;
      }, { passive: true });

      this.track.addEventListener('touchend', (e) => {
        const endX = e.changedTouches[0].clientX;
        const diff = this.startX - endX;
        if (Math.abs(diff) > 50) {
          if (diff > 0) this.next();
          else this.prev();
        }
      }, { passive: true });

      // ---- Mouse drag ----
      this.track.addEventListener('mousedown', e => {
        this.isDragging = true;
        this.startX = e.pageX - this.track.offsetLeft;
        this.scrollStart = this.track.scrollLeft;
        this.track.classList.add('dragging');
      });

      this.track.addEventListener('mouseleave', () => {
        this.isDragging = false;
        this.track.classList.remove('dragging');
      });

      this.track.addEventListener('mouseup', () => {
        this.isDragging = false;
        this.track.classList.remove('dragging');
      });

      this.track.addEventListener('mousemove', e => {
        if (!this.isDragging) return;
        e.preventDefault();
        const x = e.pageX - this.track.offsetLeft;
        const walk = (x - this.startX) * 2; // скорость прокрутки
        this.track.scrollLeft = this.scrollStart - walk;
      });
    }

    prev() {
      this.goTo((this.currentIndex - 1 + this.slides.length) % this.slides.length);
    }

    next() {
      this.goTo((this.currentIndex + 1) % this.slides.length);
    }

    goTo(index) {
      this.currentIndex = index;
      const slideWidth = this.slides[0].offsetWidth;
      this.track.style.transform = `translateX(-${index * slideWidth}px)`;

      this.dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === index);
      });

      if (this.caption && this.captions[index]) {
        this.caption.textContent = this.captions[index];
      }
    }
  }

  // --------------------
  // Categories Accordion
  // --------------------
  class CategoriesAccordion {
    constructor() {
      document.querySelectorAll('.category-header').forEach(header => {
        const group = header.closest('.category-group');
        if (group.id !== 'politika') group.classList.add('open');
        header.addEventListener('click', () => group.classList.toggle('open'));
      });
    }
  }

  // --------------------
  // Initialize
  // --------------------
  document.addEventListener('DOMContentLoaded', () => {
    new MobileMenu();
    new Lightbox();
    new CategoriesAccordion();

    // Применяем Carousel ко всем блокам .carousel-container и .favorites-carousel
    document.querySelectorAll('.carousel-container, .favorites-carousel').forEach(el => {
      new Carousel(el);
    });
  });

})();
