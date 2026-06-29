/* ============================================================
   WATERFORDS COCKTAILS — js/script.js
   ============================================================ */
'use strict';

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
  try {
    const [headerRes, footerRes] = await Promise.all([
      fetch('components/header.html'),
      fetch('components/footer.html')
    ]);

    if (!headerRes.ok || !footerRes.ok) throw new Error('Component fetch failed');

    const headerHTML = await headerRes.text();
    const footerHTML = await footerRes.text();

    const headerSlot = document.getElementById('header-slot');
    const footerSlot = document.getElementById('footer-slot');

    if (headerSlot) headerSlot.innerHTML = headerHTML;
    if (footerSlot) footerSlot.innerHTML = footerHTML;

    initHeader();
    initMobileMenu();
    initLangSwitcher();
    initI18n();
    setActiveNavLink();
    initScrollReveal();
    initVideoSection();
    initCookieBanner();
    initContactForm();
    initSmoothScroll();
    initTiltCards();

    // Partners dynamisch laden
    loadPartnersHome();
    loadPartnersWhereToBuy();

  } catch (err) {
    console.warn('Component load failed:', err);
    initScrollReveal();
    initVideoSection();
    initCookieBanner();
    initContactForm();
    initSmoothScroll();
    loadPartnersHome();
    loadPartnersWhereToBuy();
  }
}

/* ── 2. Header scroll ── */
function initHeader() {
  const header = document.getElementById('site-header');
  if (!header) return;
  const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 60);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* ── 3. Mobile menu ── */
function initMobileMenu() {
  const toggle     = document.getElementById('menuToggle');
  const mobileMenu = document.getElementById('mobileMenu');
  if (!toggle || !mobileMenu) return;

  const openMenu = () => {
    mobileMenu.classList.add('open');
    toggle.classList.add('open');
    document.body.classList.add('menu-open');
    document.body.style.overflow = 'hidden';
    toggle.setAttribute('aria-expanded', 'true');
  };
  const closeMenu = () => {
    mobileMenu.classList.remove('open');
    toggle.classList.remove('open');
    document.body.classList.remove('menu-open');
    document.body.style.overflow = '';
    toggle.setAttribute('aria-expanded', 'false');
  };

  toggle.addEventListener('click', () => {
    mobileMenu.classList.contains('open') ? closeMenu() : openMenu();
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });
  mobileMenu.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
}

/* ── 4. Language switcher ── */
const I18N_CACHE = {};
let currentLang = localStorage.getItem('wf-lang') || 'en';

async function loadTranslations(lang) {
  if (I18N_CACHE[lang]) return I18N_CACHE[lang];
  try {
    const res = await fetch('i18n/' + lang + '.json');
    if (!res.ok) throw new Error();
    const data = await res.json();
    I18N_CACHE[lang] = data;
    return data;
  } catch {
    console.warn('i18n load failed for', lang);
    return null;
  }
}

async function applyTranslations(lang) {
  const data = await loadTranslations(lang);
  if (!data) return;

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key   = el.getAttribute('data-i18n');
    const value = getNestedKey(data, key);
    if (value === undefined) return;
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      el.placeholder = value;
    } else {
      el.textContent = value;
    }
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const value = getNestedKey(data, el.getAttribute('data-i18n-placeholder'));
    if (value) el.placeholder = value;
  });

  document.documentElement.lang = lang;
  currentLang = lang;
  localStorage.setItem('wf-lang', lang);

  updateLangSwitcherUI(lang);
}

function getNestedKey(obj, keyPath) {
  return keyPath.split('.').reduce((acc, key) => (acc && acc[key] !== undefined) ? acc[key] : undefined, obj);
}

function updateLangSwitcherUI(lang) {
  const labels = { en: 'EN', nl: 'NL', de: 'DE' };

  const currentLabel = document.getElementById('currentLangLabel');
  if (currentLabel) currentLabel.textContent = labels[lang] || 'EN';

  const currentFlag = document.getElementById('currentFlag');
  if (currentFlag) {
    const activeOption = document.querySelector('.lang-option[data-lang="' + lang + '"] .flag-icon');
    if (activeOption) currentFlag.innerHTML = activeOption.innerHTML;
  }

  document.querySelectorAll('.lang-option').forEach(opt => {
    const isActive = opt.dataset.lang === lang;
    opt.classList.toggle('active', isActive);
    opt.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });

  document.querySelectorAll('.mobile-lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });
}

function initLangSwitcher() {
  const switcher = document.getElementById('langSwitcher');
  const btn      = document.getElementById('langBtn');
  const dropdown = document.getElementById('langDropdown');
  if (!switcher || !btn || !dropdown) return;

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = switcher.classList.toggle('open');
    btn.setAttribute('aria-expanded', isOpen.toString());
  });

  document.addEventListener('click', (e) => {
    if (!switcher.contains(e.target)) {
      switcher.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && switcher.classList.contains('open')) {
      switcher.classList.remove('open');
      btn.focus();
    }
  });

  document.querySelectorAll('.lang-option').forEach(opt => {
    opt.addEventListener('click', () => {
      applyTranslations(opt.dataset.lang);
      switcher.classList.remove('open');
    });
    opt.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        applyTranslations(opt.dataset.lang);
        switcher.classList.remove('open');
      }
    });
  });

  document.querySelectorAll('.mobile-lang-btn').forEach(btn => {
    btn.addEventListener('click', () => applyTranslations(btn.dataset.lang));
  });
}

function initI18n() { applyTranslations(currentLang); }

/* ── 5. Active nav link ── */
function setActiveNavLink() {
  const page = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link, .mobile-menu nav a').forEach(link => {
    const linkPage = (link.getAttribute('href') || '').split('/').pop();
    link.classList.toggle('active', linkPage === page || (page === '' && linkPage === 'index.html'));
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
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  elements.forEach(el => observer.observe(el));
}

/* ── 7. Video — auto-play when in view ── */
function initVideoSection() {
  const wrapper = document.querySelector('.video-wrapper');
  const videoEl = document.querySelector('.video-wrapper video');
  const playBtn = document.querySelector('.video-play-btn');
  if (!wrapper || !videoEl) return;

  if (playBtn) playBtn.style.display = 'none';

  videoEl.muted = true;
  videoEl.playsInline = true;
  videoEl.setAttribute('playsinline', '');
  videoEl.loop = true;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        videoEl.play().catch(() => {});
      } else {
        videoEl.pause();
      }
    });
  }, { threshold: 0.25 });

  observer.observe(wrapper);
}

/* ── 8. Cookie banner ── */
function initCookieBanner() {
  const banner = document.querySelector('.cookie-banner');
  if (!banner) return;
  if (localStorage.getItem('wf-cookies')) {
    banner.classList.add('hidden');
    return;
  }
  banner.querySelector('.cookie-accept')?.addEventListener('click', () => {
    localStorage.setItem('wf-cookies', 'accepted');
    banner.classList.add('hidden');
  });
  banner.querySelector('.cookie-decline')?.addEventListener('click', () => {
    localStorage.setItem('wf-cookies', 'declined');
    banner.classList.add('hidden');
  });
}

/* ── 9. Contact form ── */
function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn  = form.querySelector('[type="submit"]');
    const successMsg = document.getElementById('form-success');
    const formData   = new FormData(form);
    const originalText = submitBtn.textContent;
    submitBtn.textContent = submitBtn.dataset.sending || 'Sending...';
    submitBtn.disabled = true;
    try {
      const res = await fetch(form.action, { method: 'POST', body: formData, headers: { 'Accept': 'application/json' } });
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

/* ── 10. Smooth scroll ── */
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

/* ── 11. Subtle 3D tilt on cards ── */
function initTiltCards() {
  const cards = document.querySelectorAll('.tilt-card');
  if (!cards.length || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const dx = (e.clientX - rect.left - rect.width  / 2) / (rect.width  / 2);
      const dy = (e.clientY - rect.top  - rect.height / 2) / (rect.height / 2);
      card.style.transform = `perspective(800px) rotateY(${dx * 4}deg) rotateX(${-dy * 4}deg) translateZ(4px)`;
    });
    card.addEventListener('mouseleave', () => { card.style.transform = ''; });
  });
}

/* ── 12. Partners laden vanuit content/partners.json ─────────────────
   Volgorde = volgorde in de JSON array (zoals ingesteld in het CMS).
   Geen sortering op volgordegetal — positie in de lijst is leidend.
   ─────────────────────────────────────────────────────────────────── */
let _partnersCache = null;

async function fetchPartners() {
  if (_partnersCache) return _partnersCache;
  try {
    const res = await fetch('content/partners.json');
    if (!res.ok) throw new Error('partners.json not found');
    const data = await res.json();
    _partnersCache = data.partners || [];
    return _partnersCache;
  } catch (err) {
    console.warn('Partners JSON laden mislukt:', err);
    return [];
  }
}

/* ── 12a. Homepage: scrollende balk ── */
async function loadPartnersHome() {
  const track = document.getElementById('retailers-track-home');
  if (!track) return;

  const partners = await fetchPartners();
  // Geen sortering — volgorde in JSON is leidend
  const visible = partners.filter(p => p.zichtbaar_homepage !== false);

  if (!visible.length) return;

  track.innerHTML = '';

  visible.forEach(partner => {
    const item = buildLogoItem(partner, false);
    track.appendChild(item);
  });

  // Kloon voor naadloze oneindige scroll
  const items = Array.from(track.children);
  items.forEach(item => {
    const clone = item.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    track.appendChild(clone);
  });
}

/* ── 12b. Waar te koop: grid — max 20 ── */
async function loadPartnersWhereToBuy() {
  const grid = document.getElementById('partner-grid-where');
  if (!grid) return;

  const partners = await fetchPartners();
  // Geen sortering — volgorde in JSON is leidend, max 20
  const visible = partners
    .filter(p => p.zichtbaar_waar_te_koop !== false)
    .slice(0, 20);

  if (!visible.length) return;

  grid.innerHTML = '';

  visible.forEach(partner => {
    const item = buildLogoItem(partner, true);
    grid.appendChild(item);
  });
}

/* ── Helper: bouw een logo-item aan ── */
function buildLogoItem(partner, isGrid) {
  const wrapper = document.createElement('div');
  wrapper.setAttribute('role', 'listitem');
  wrapper.className = 'retailer-logo';

  if (isGrid) {
    wrapper.style.cssText = 'opacity:1; filter:none; width:auto; height:80px;';
  }

  const img = document.createElement('img');
  img.src     = partner.logo || '';
  img.alt     = partner.naam || '';
  img.loading = 'lazy';

  if (isGrid) {
    img.style.maxHeight = '60px';
  }

  // Klikbaar als URL is ingevuld
  if (partner.url && partner.url.trim() !== '') {
    const link = document.createElement('a');
    link.href   = partner.url;
    link.target = '_blank';
    link.rel    = 'noopener noreferrer';
    link.setAttribute('aria-label', partner.naam);
    link.appendChild(img);
    wrapper.appendChild(link);
  } else {
    wrapper.appendChild(img);
  }

  return wrapper;
}