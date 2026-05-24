/* ============================================================
   WATERFORDS COCKTAILS — js/script.js
   ============================================================ */

'use strict';

// ── Init pattern: handle defer + DOMContentLoaded race ──
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

function init() {
  loadComponents();
}

/* ── 1. Load header & footer via fetch ── */
async function loadComponents() {
  const base = getBasePath();

  try {
    const [headerRes, footerRes] = await Promise.all([
      fetch(base + 'components/header.html'),
      fetch(base + 'components/footer.html')
    ]);

    const headerHTML = await headerRes.text();
    const footerHTML = await footerRes.text();

    const headerSlot = document.getElementById('header-slot');
    const footerSlot = document.getElementById('footer-slot');

    if (headerSlot) {
      headerSlot.innerHTML = headerHTML;
      // Fix asset paths in loaded HTML
      headerSlot.querySelectorAll('[src]').forEach(el => {
        if (!el.src.startsWith('http')) el.src = base + el.getAttribute('src');
      });
      headerSlot.querySelectorAll('[href]').forEach(el => {
        const href = el.getAttribute('href');
        if (href && !href.startsWith('http') && !href.startsWith('#') && !href.startsWith('mailto') && !href.startsWith('tel')) {
          // keep nav hrefs as-is (relative to root)
        }
      });
    }

    if (footerSlot) {
      footerSlot.innerHTML = footerHTML;
    }

    // Init all features after components are loaded
    initHeader();
    initMobileMenu();
    initLangSwitcher();
    initI18n();
    setActiveNavLink();
    initScrollReveal();
    initVideoSection();
    initRetailersStrip();
    initCookieBanner();
    initContactForm();
    initSmoothScroll();
    initTiltCards();

  } catch (err) {
    console.warn('Component load failed:', err);
    // Still init non-component features
    initScrollReveal();
    initVideoSection();
    initCookieBanner();
    initContactForm();
    initSmoothScroll();
  }
}

/* ── Helper: determine base path ── */
function getBasePath() {
  const path = window.location.pathname;
  // If at root or index, base is ''
  // If in a subdirectory, adjust accordingly
  return '';
}

/* ── 2. Header scroll behaviour ── */
function initHeader() {
  const header = document.getElementById('site-header');
  if (!header) return;

  function onScroll() {
    if (window.scrollY > 60) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // run once on load
}

/* ── 3. Mobile Menu ── */
function initMobileMenu() {
  const toggle    = document.getElementById('menuToggle');
  const mobileMenu = document.getElementById('mobileMenu');
  if (!toggle || !mobileMenu) return;

  function openMenu() {
    mobileMenu.classList.add('open');
    toggle.classList.add('open');
    document.body.classList.add('menu-open');
    document.body.style.overflow = 'hidden';
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Close menu');
  }

  function closeMenu() {
    mobileMenu.classList.remove('open');
    toggle.classList.remove('open');
    document.body.classList.remove('menu-open');
    document.body.style.overflow = '';
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open menu');
  }

  toggle.addEventListener('click', () => {
    mobileMenu.classList.contains('open') ? closeMenu() : openMenu();
  });

  // Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });

  // Auto-close on link click
  mobileMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', closeMenu);
  });
}

/* ── 4. Language Switcher ── */
const I18N_CACHE = {};
let currentLang = localStorage.getItem('wf-lang') || 'en';

async function loadTranslations(lang) {
  if (I18N_CACHE[lang]) return I18N_CACHE[lang];
  try {
    const base = getBasePath();
    const res = await fetch(base + 'i18n/' + lang + '.json');
    const data = await res.json();
    I18N_CACHE[lang] = data;
    return data;
  } catch (e) {
    console.warn('i18n load failed for', lang);
    return null;
  }
}

async function applyTranslations(lang) {
  const data = await loadTranslations(lang);
  if (!data) return;

  // Apply data-i18n attributes
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const value = getNestedKey(data, key);
    if (value !== undefined) {
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.placeholder = value;
      } else {
        el.textContent = value;
      }
    }
  });

  // Apply data-i18n-placeholder
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    const value = getNestedKey(data, key);
    if (value) el.placeholder = value;
  });

  // Update html lang attribute
  document.documentElement.lang = lang;

  currentLang = lang;
  localStorage.setItem('wf-lang', lang);

  // Update lang switcher UI
  updateLangSwitcherUI(lang);
}

function getNestedKey(obj, keyPath) {
  return keyPath.split('.').reduce((acc, key) => {
    return acc && acc[key] !== undefined ? acc[key] : undefined;
  }, obj);
}

function updateLangSwitcherUI(lang) {
  const flags = { en: '🇬🇧', nl: '🇳🇱', de: '🇩🇪' };
  const labels = { en: 'EN', nl: 'NL', de: 'DE' };

  // Desktop
  const currentFlag = document.getElementById('currentFlag');
  const currentLabel = document.getElementById('currentLangLabel');
  if (currentFlag) currentFlag.textContent = flags[lang] || flags.en;
  if (currentLabel) currentLabel.textContent = labels[lang] || 'EN';

  document.querySelectorAll('.lang-option').forEach(opt => {
    opt.classList.toggle('active', opt.dataset.lang === lang);
  });

  // Mobile
  document.querySelectorAll('.mobile-lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });
}

function initLangSwitcher() {
  const switcher = document.getElementById('langSwitcher');
  const btn      = document.getElementById('langBtn');
  const dropdown = document.getElementById('langDropdown');
  if (!switcher || !btn || !dropdown) return;

  btn.addEventListener('click', () => {
    const open = switcher.classList.toggle('open');
    btn.setAttribute('aria-expanded', open.toString());
  });

  // Close when clicking outside
  document.addEventListener('click', (e) => {
    if (!switcher.contains(e.target)) {
      switcher.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    }
  });

  // Keyboard navigation in dropdown
  dropdown.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      switcher.classList.remove('open');
      btn.focus();
    }
  });

  // Desktop lang options
  document.querySelectorAll('.lang-option').forEach(opt => {
    opt.addEventListener('click', () => {
      applyTranslations(opt.dataset.lang);
      switcher.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    });
    opt.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        applyTranslations(opt.dataset.lang);
        switcher.classList.remove('open');
        btn.focus();
      }
    });
  });

  // Mobile lang buttons
  document.querySelectorAll('.mobile-lang-btn').forEach(mbBtn => {
    mbBtn.addEventListener('click', () => {
      applyTranslations(mbBtn.dataset.lang);
    });
  });
}

function initI18n() {
  applyTranslations(currentLang);
}

/* ── 5. Active nav link ── */
function setActiveNavLink() {
  const page = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href === page || (page === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });
}

/* ── 6. Scroll reveal ── */
function initScrollReveal() {
  const elements = document.querySelectorAll('.reveal');
  if (!elements.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  elements.forEach(el => observer.observe(el));
}

/* ── 7. Video play button ── */
function initVideoSection() {
  const wrapper  = document.querySelector('.video-wrapper');
  const playBtn  = document.querySelector('.video-play-btn');
  const videoEl  = document.querySelector('.video-wrapper video');
  if (!wrapper || !playBtn || !videoEl) return;

  playBtn.addEventListener('click', () => {
    wrapper.classList.add('playing');
    videoEl.play();
    videoEl.controls = true;
  });

  videoEl.addEventListener('pause', () => {
    if (videoEl.ended) {
      wrapper.classList.remove('playing');
      videoEl.controls = false;
    }
  });
}

/* ── 8. Retailers strip – duplicate for seamless loop ── */
function initRetailersStrip() {
  const track = document.querySelector('.retailers-track');
  if (!track) return;

  // Clone all children for infinite scroll
  const items = Array.from(track.children);
  items.forEach(item => {
    const clone = item.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    track.appendChild(clone);
  });
}

/* ── 9. Cookie banner ── */
function initCookieBanner() {
  const banner  = document.querySelector('.cookie-banner');
  if (!banner) return;

  // If already accepted/declined, hide
  if (localStorage.getItem('wf-cookies')) {
    banner.classList.add('hidden');
    return;
  }

  const acceptBtn  = banner.querySelector('.cookie-accept');
  const declineBtn = banner.querySelector('.cookie-decline');

  if (acceptBtn) {
    acceptBtn.addEventListener('click', () => {
      localStorage.setItem('wf-cookies', 'accepted');
      banner.classList.add('hidden');
    });
  }

  if (declineBtn) {
    declineBtn.addEventListener('click', () => {
      localStorage.setItem('wf-cookies', 'declined');
      banner.classList.add('hidden');
    });
  }
}

/* ── 10. Contact form (Formspree) ── */
function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn  = form.querySelector('[type="submit"]');
    const successMsg = document.getElementById('form-success');
    const formData   = new FormData(form);

    // Show loading state
    const originalText = submitBtn.textContent;
    submitBtn.textContent = submitBtn.dataset.sending || 'Sending...';
    submitBtn.disabled = true;

    try {
      const res = await fetch(form.action, {
        method: 'POST',
        body: formData,
        headers: { 'Accept': 'application/json' }
      });

      if (res.ok) {
        form.reset();
        if (successMsg) {
          successMsg.style.display = 'block';
          successMsg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      } else {
        alert('Something went wrong. Please try again.');
      }
    } catch {
      alert('Something went wrong. Please try again.');
    }

    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
  });
}

/* ── 11. Smooth scroll for anchor links ── */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

/* ── 12. Subtle tilt on product/flavour cards ── */
function initTiltCards() {
  const cards = document.querySelectorAll('.tilt-card');
  if (!cards.length || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) / (rect.width / 2);
      const dy = (e.clientY - cy) / (rect.height / 2);
      card.style.transform = `perspective(800px) rotateY(${dx * 4}deg) rotateX(${-dy * 4}deg) translateZ(4px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
}
