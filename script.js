/* ═════════════════════════════════════════
   LOADER — isolated so nothing can block it
═════════════════════════════════════════ */
(function () {
  var loader = document.getElementById('loader');
  var fill   = document.querySelector('.loader-name-fill');
  if (!loader) return;

  var finished = false;

  function finish() {
    if (finished) return;
    finished = true;
    loader.style.transition = 'opacity 600ms ease';
    loader.style.opacity = '0';
    setTimeout(function () { loader.style.display = 'none'; }, 650);
  }

  /* 1. Start the fill immediately */
  if (fill) {
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        fill.style.transition = 'width 1.4s cubic-bezier(0.4,0,0.2,1)';
        fill.style.width = '100%';
      });
    });
  }

  /* 2. Normal path */
  window.addEventListener('load', function () { setTimeout(finish, 1400); });

  /* 3. Hard fallback — fires even if `load` never does */
  setTimeout(finish, 2600);
})();

/* ═════════════════════════════════════════
   SITE
═════════════════════════════════════════ */
(function () {

/* ─────────────────────────────────────────
   i18n — declared first
───────────────────────────────────────── */
var i18n = {
  en: {
    'nav-paintings':'Paintings','nav-resume':'Resume','nav-text':'Text','nav-contact':'Contact',
    'resume-bio-1':'Born in 2000 in Bucharest, Romania.',
    'resume-bio-2':'Resides and works in Bucharest, Romania.',
    'resume-heading-education':'Education',
    'resume-heading-exhibitions':'Selected Exhibitions',
    'resume-heading-contact':'Contact',
    'resume-studio-label':'Studio','resume-email-label':'Email',
    'text-heading-process':'Process',
    'text-heading-place':'Place',
    'text-heading-biography':'Biography'
  },
  de: {
    'nav-paintings':'Gemälde','nav-resume':'Lebenslauf','nav-text':'Text','nav-contact':'Kontakt',
    'resume-bio-1':'Geboren 2000 in Bukarest, Rumänien.',
    'resume-bio-2':'Lebt und arbeitet in Bukarest, Rumänien.',
    'resume-heading-education':'Ausbildung',
    'resume-heading-exhibitions':'Ausgewählte Ausstellungen',
    'resume-heading-contact':'Kontakt',
    'resume-studio-label':'Atelier','resume-email-label':'E-Mail',
    'text-heading-process':'Prozess',
    'text-heading-place':'Ort',
    'text-heading-biography':'Biografie'
  }
};

var currentLang = 'en';

function t(key, fallback) {
  var dict = i18n[currentLang] || i18n.en;
  return dict[key] !== undefined ? dict[key] : fallback;
}

/* ─────────────────────────────────────────
   Utilities
───────────────────────────────────────── */
function animate(el, fromProps, toProps, duration, callback) {
  if (!el) { if (callback) callback(); return; }
  Object.assign(el.style, fromProps);
  el.style.transition = '';
  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      el.style.transition = Object.keys(toProps).map(function (p) {
        return p + ' ' + duration + 'ms ease';
      }).join(', ');
      Object.assign(el.style, toProps);
      if (callback) setTimeout(callback, duration);
    });
  });
}

function escHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ─────────────────────────────────────────
   Overrides — admin localStorage → live page
───────────────────────────────────────── */
function applyPaintingOverrides() {
  var stored = localStorage.getItem('nh_paintings');
  if (!stored) return;

  var paintings;
  try { paintings = JSON.parse(stored); } catch (e) { return; }
  if (!Array.isArray(paintings) || !paintings.length) return;

  var grid = document.querySelector('.paintings-grid');
  if (!grid) return;

  grid.innerHTML = paintings.map(function (p) {
    return '<div class="painting-item"' +
           ' data-id="'          + escHtml(p.id) + '"' +
           ' data-title="'       + escHtml(p.title || '') + '"' +
           ' data-year="'        + escHtml(p.year || '') + '"' +
           ' data-medium="'      + escHtml(p.medium || '') + '"' +
           ' data-description="' + escHtml(p.description || '') + '">' +
           '<img src="' + escHtml(p.src || '') + '" alt="" />' +
           '</div>';
  }).join('');
}

function applyTextOverrides() {
  var stored = localStorage.getItem('nh_text_content');
  if (!stored) return;

  var c;
  try { c = JSON.parse(stored); } catch (e) { return; }
  if (!c) return;

  var textInner = document.querySelector('#text .text-inner');
  if (!textInner) return;

  var html = '';

  if (c.all) {
    html = c.all.split(/\n\n+/)
      .map(function (p) { return p.trim(); })
      .filter(Boolean)
      .map(function (p) { return '<p>' + escHtml(p) + '</p>'; })
      .join('');
  } else {
    if (c.intro) html += '<p>' + escHtml(c.intro) + '</p>';
    if (c.process) {
      html += '<h2 data-i18n="text-heading-process">' + escHtml(t('text-heading-process', 'Process')) + '</h2>';
      html += '<p>' + escHtml(c.process) + '</p>';
    }
    if (c.place) {
      html += '<h2 data-i18n="text-heading-place">' + escHtml(t('text-heading-place', 'Place')) + '</h2>';
      html += '<p>' + escHtml(c.place) + '</p>';
    }
    if (c.biography) {
      html += '<h2 data-i18n="text-heading-biography">' + escHtml(t('text-heading-biography', 'Biography')) + '</h2>';
      html += '<p>' + escHtml(c.biography) + '</p>';
    }
  }

  if (html) textInner.innerHTML = html;
}

function applyResumeOverrides() {
  var stored = localStorage.getItem('nh_resume_content');
  if (!stored) return;

  var c;
  try { c = JSON.parse(stored); } catch (e) { return; }
  if (!c) return;

  var section = document.getElementById('resume');
  if (!section) return;

  var nameEl = section.querySelector('.resume-name');
  if (nameEl && c.name !== undefined) nameEl.textContent = c.name;

  var bioEls = section.querySelectorAll('.resume-bio');
  if (Array.isArray(c.bio)) {
    c.bio.forEach(function (text, i) { if (bioEls[i]) bioEls[i].textContent = text; });
  }

  function rebuildEntries(block, entries, yearKey) {
    if (!block || !Array.isArray(entries)) return;
    block.querySelectorAll('.resume-entry').forEach(function (el) { el.remove(); });
    entries.forEach(function (e) {
      var row = document.createElement('div');
      row.className = 'resume-entry';
      row.innerHTML = '<span class="resume-year">'   + escHtml(e[yearKey] || e.year || '') + '</span>' +
                      '<span class="resume-detail">' + escHtml(e.detail || '')             + '</span>';
      block.appendChild(row);
    });
  }

  rebuildEntries(section.querySelector('[data-section="education"]'),   c.education,   'years');
  rebuildEntries(section.querySelector('[data-section="exhibitions"]'), c.exhibitions, 'year');

  var contactBlock = section.querySelector('[data-section="contact"]');
  if (contactBlock) {
    if (c.studio !== undefined) {
      var studioDetail = contactBlock.querySelector('.resume-entry:first-of-type .resume-detail');
      if (studioDetail) studioDetail.innerHTML = escHtml(c.studio).replace(/\n/g, '<br />');
    }
    if (c.email !== undefined) {
      var emailLink = contactBlock.querySelector('a.resume-link');
      if (emailLink) {
        emailLink.href = 'mailto:' + c.email;
        emailLink.textContent = c.email;
      }
    }
  }
}

/* Each guarded independently */
try { applyPaintingOverrides(); } catch (e) { console.warn('paintings override failed', e); }
try { applyTextOverrides();     } catch (e) { console.warn('text override failed', e); }
try { applyResumeOverrides();   } catch (e) { console.warn('resume override failed', e); }

/* ─────────────────────────────────────────
   Top bar / hamburger
───────────────────────────────────────── */
var asideEl   = document.querySelector('aside');
var hamburger = document.getElementById('hamburger');
var mainEl    = document.querySelector('main');

function setMainPadding() {
  if (!mainEl || !asideEl) return;
  mainEl.style.paddingTop = window.innerWidth <= 640
    ? (asideEl.offsetHeight + 24) + 'px'
    : '';
}

if (hamburger) {
  hamburger.addEventListener('click', function () {
    asideEl.classList.toggle('menu-open');
    setTimeout(setMainPadding, 360);
  });
}

window.addEventListener('resize', function () {
  if (window.innerWidth > 640 && asideEl) asideEl.classList.remove('menu-open');
  setMainPadding();
});

window.addEventListener('load', setMainPadding);
setMainPadding();

/* ─────────────────────────────────────────
   Language switching
───────────────────────────────────────── */
function applyLanguage(lang) {
  if (!i18n[lang]) return;
  currentLang = lang;

  document.querySelectorAll('[data-i18n]').forEach(function (el) {
    var key = el.getAttribute('data-i18n');
    if (i18n[lang][key] !== undefined) el.textContent = i18n[lang][key];
  });

  document.querySelectorAll('[data-i18n-html]').forEach(function (el) {
    var key = el.getAttribute('data-i18n-html');
    if (i18n[lang][key] !== undefined) el.innerHTML = i18n[lang][key];
  });

  document.querySelectorAll('.lang-btn').forEach(function (btn) {
    btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
  });

  try { applyTextOverrides();   } catch (e) {}
  try { applyResumeOverrides(); } catch (e) {}

  /* Re-translate freshly rebuilt nodes */
  document.querySelectorAll('#text [data-i18n], #resume [data-i18n]').forEach(function (el) {
    var key = el.getAttribute('data-i18n');
    if (i18n[lang][key] !== undefined) el.textContent = i18n[lang][key];
  });
}

document.querySelectorAll('.lang-btn').forEach(function (btn) {
  btn.addEventListener('click', function () {
    applyLanguage(this.getAttribute('data-lang'));
  });
});

/* ─────────────────────────────────────────
   Navigation
───────────────────────────────────────── */
var navLinks = document.querySelectorAll('nav a[data-target]');
var current  = null;
var busy     = false;

function showSection(targetId) {
  if (busy) return;
  var next = document.getElementById(targetId);
  if (!next || (current && current.id === targetId)) return;

  navLinks.forEach(function (l) { l.classList.remove('active'); });
  var al = document.querySelector('nav a[data-target="' + targetId + '"]');
  if (al) al.classList.add('active');

  if (window.innerWidth <= 640 && asideEl) {
    asideEl.classList.remove('menu-open');
    setTimeout(setMainPadding, 360);
  }

  if (!current) {
    next.style.display = 'block';
    animate(next,
      { opacity: '0', transform: 'translateY(12px)' },
      { opacity: '1', transform: 'translateY(0)' }, 400);
    current = next;
    return;
  }

  busy = true;
  animate(current,
    { opacity: '1', transform: 'translateY(0)' },
    { opacity: '0', transform: 'translateY(-8px)' }, 220, function () {
      current.style.display = 'none';
      current.style.transition = '';
      window.scrollTo({ top: 0, behavior: 'smooth' });
      next.style.display = 'block';
      animate(next,
        { opacity: '0', transform: 'translateY(12px)' },
        { opacity: '1', transform: 'translateY(0)' }, 380, function () { busy = false; });
      current = next;
    });
}

navLinks.forEach(function (link) {
  link.addEventListener('click', function () {
    showSection(this.getAttribute('data-target'));
  });
});

showSection('paintings');

/* ─────────────────────────────────────────
   Lightbox (delegated — survives rebuilds)
───────────────────────────────────────── */
var lightbox = document.getElementById('lightbox');

if (lightbox) {
  var lightboxInner  = lightbox.querySelector('.lightbox-inner');
  var lightboxImg    = document.getElementById('lightbox-img');
  var lightboxTitle  = document.getElementById('lightbox-title');
  var lightboxYear   = document.getElementById('lightbox-year');
  var lightboxMedium = document.getElementById('lightbox-medium');
  var lightboxDesc   = document.getElementById('lightbox-description');
  var lightboxIsOpen = false;

  var openLightbox = function (imgEl, title, year, medium, description) {
    if (lightboxIsOpen || !imgEl) return;
    lightboxIsOpen = true;

    lightboxImg.src            = imgEl.src;
    lightboxTitle.textContent  = title  || '';
    lightboxYear.textContent   = year   || '';
    lightboxMedium.textContent = medium || '';
    lightboxDesc.textContent   = description || '';
    lightboxDesc.style.display = description ? 'block' : 'none';

    lightbox.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    animate(lightbox, { opacity: '0' }, { opacity: '1' }, 280);
    setTimeout(function () {
      animate(lightboxInner,
        { opacity: '0', transform: 'scale(0.96)' },
        { opacity: '1', transform: 'scale(1)' }, 340);
    }, 100);
  };

  var closeLightbox = function () {
    if (!lightboxIsOpen) return;
    animate(lightboxInner,
      { opacity: '1', transform: 'scale(1)' },
      { opacity: '0', transform: 'scale(0.96)' }, 200);
    setTimeout(function () {
      animate(lightbox, { opacity: '1' }, { opacity: '0' }, 240, function () {
        lightbox.style.display = 'none';
        lightbox.style.transition = '';
        lightboxInner.style.transition = '';
        document.body.style.overflow = '';
        lightboxIsOpen = false;
      });
    }, 120);
  };

  document.addEventListener('click', function (e) {
    if (!e.target || !e.target.closest) return;
    var item = e.target.closest('.painting-item');
    if (!item) return;
    openLightbox(
      item.querySelector('img'),
      item.getAttribute('data-title'),
      item.getAttribute('data-year'),
      item.getAttribute('data-medium'),
      item.getAttribute('data-description')
    );
  });

  var closeBtn = document.getElementById('lightbox-close');
  if (closeBtn) closeBtn.addEventListener('click', closeLightbox);

  lightbox.addEventListener('click', function (e) {
    if (e.target === lightbox) closeLightbox();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeLightbox();
  });
}

})();