/* ============================================
   Paged / Slide controller
   Automatically wraps top-level sections into slides.
   ============================================ */
(function () {
  'use strict';

  const SLIDE_SELECTOR = [
    'header.masthead',
    'nav.agenda',
    'main > section',
    'div.page > section',
    'div.outro',
    'div.nav-foot'
  ].join(', ');

  function wrapSlides() {
    const page = document.querySelector('.page');
    if (!page) return [];

    // Collect direct children that should become slides.
    // Strategy: take each top-level semantic block inside .page.
    const blocks = Array.from(page.children).filter(el => {
      return el.matches('header.masthead, nav.agenda, section, div.outro, div.nav-foot');
    });

    const slides = [];
    blocks.forEach((el, idx) => {
      const slide = document.createElement('div');
      slide.className = 'slide';
      slide.dataset.slideIndex = idx;
      // Keep id for anchor linking (use first id found)
      const id = el.id || el.getAttribute('data-id');
      if (id) slide.id = 'slide-' + id;
      el.parentNode.insertBefore(slide, el);
      slide.appendChild(el);
      slides.push(slide);
    });

    return slides;
  }

  function init() {
    const slides = wrapSlides();
    if (slides.length === 0) return;

    const pager = document.querySelector('.pager');
    const dotsWrap = pager.querySelector('.dots');
    const currentLabel = pager.querySelector('.counter .current');
    const totalLabel = pager.querySelector('.counter .total');
    const prevBtn = pager.querySelector('.btn.prev');
    const nextBtn = pager.querySelector('.btn.next');
    const progressFill = document.querySelector('.progress-line .fill');

    totalLabel.textContent = String(slides.length).padStart(2, '0');

    // Build dots
    slides.forEach((slide, i) => {
      const d = document.createElement('button');
      d.className = 'dot';
      d.setAttribute('aria-label', `Go to slide ${i + 1}`);
      d.addEventListener('click', () => go(i));
      dotsWrap.appendChild(d);
    });
    const dots = Array.from(dotsWrap.children);

    let current = 0;

    function go(idx) {
      if (idx < 0 || idx >= slides.length) return;
      slides.forEach((s, i) => {
        s.classList.remove('active', 'prev');
        if (i === idx) s.classList.add('active');
        else if (i < idx) s.classList.add('prev');
        // scroll each slide back to top when leaving
        if (i !== idx) s.scrollTop = 0;
      });
      dots.forEach((d, i) => d.classList.toggle('active', i === idx));
      currentLabel.textContent = String(idx + 1).padStart(2, '0');
      prevBtn.disabled = idx === 0;
      nextBtn.disabled = idx === slides.length - 1;
      progressFill.style.width = ((idx + 1) / slides.length * 100) + '%';
      // Update URL hash (without scroll jump)
      const id = slides[idx].id;
      if (id && history.replaceState) history.replaceState(null, '', '#' + id.replace(/^slide-/, ''));
      current = idx;
    }

    prevBtn.addEventListener('click', () => go(current - 1));
    nextBtn.addEventListener('click', () => go(current + 1));

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault(); go(current + 1);
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault(); go(current - 1);
      } else if (e.key === 'Home') {
        e.preventDefault(); go(0);
      } else if (e.key === 'End') {
        e.preventDefault(); go(slides.length - 1);
      }
    });

    // Agenda links: jump to the matching slide
    document.querySelectorAll('.agenda a.item').forEach(a => {
      a.addEventListener('click', (e) => {
        const href = a.getAttribute('href') || '';
        if (!href.startsWith('#')) return;
        const targetId = 'slide-' + href.slice(1);
        const idx = slides.findIndex(s => s.id === targetId);
        if (idx >= 0) {
          e.preventDefault();
          go(idx);
        }
      });
    });

    // Swipe support (touch)
    let touchStartX = null;
    document.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
    }, { passive: true });
    document.addEventListener('touchend', (e) => {
      if (touchStartX === null) return;
      const dx = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(dx) > 60) {
        if (dx < 0) go(current + 1);
        else go(current - 1);
      }
      touchStartX = null;
    });

    // Jump to hash on load
    const hash = location.hash.slice(1);
    if (hash) {
      const idx = slides.findIndex(s => s.id === 'slide-' + hash);
      if (idx >= 0) {
        go(idx);
        return;
      }
    }
    go(0);

    // Hide keyboard hint after first interaction
    const hint = document.querySelector('.kbd-hint');
    if (hint) {
      const hide = () => {
        hint.style.transition = 'opacity 0.5s';
        hint.style.opacity = '0';
        setTimeout(() => hint.remove(), 500);
      };
      document.addEventListener('keydown', hide, { once: true });
      setTimeout(hide, 8000);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
