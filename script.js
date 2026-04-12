(function () {

/* ─────────────────────────────────────────
   Utility: double-rAF animate
───────────────────────────────────────── */
function animate(el, fromProps, toProps, duration, callback) {
  Object.assign(el.style, fromProps);
  el.style.transition = '';
  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      el.style.transition = Object.keys(toProps)
        .map(function (p) { return p + ' ' + duration + 'ms ease'; })
        .join(', ');
      Object.assign(el.style, toProps);
      if (callback) setTimeout(callback, duration);
    });
  });
}


/* ─────────────────────────────────────────
   Loader
   – fills the name left→right over 1.4s
   – fades the overlay out once done
───────────────────────────────────────── */
var loader     = document.getElementById('loader');
var loaderFill = document.querySelector('.loader-name-fill');

window.addEventListener('load', function () {

  // Trigger the text fill
  setTimeout(function () {
    loaderFill.style.transition = 'width 1.4s cubic-bezier(0.4, 0, 0.2, 1)';
    loaderFill.style.width = '100%';
  }, 150);

  // Fade out loader after fill finishes
  setTimeout(function () {
    animate(loader,
      { opacity: '1' },
      { opacity: '0' },
      600,
      function () {
        loader.style.display = 'none';
      }
    );
  }, 1800);

});


/* ─────────────────────────────────────────
   Navigation — fade + slide between sections
───────────────────────────────────────── */
var navLinks = document.querySelectorAll('nav a[data-target]');
var mainEl   = document.querySelector('main');
var current  = null;
var busy     = false;

function showSection(targetId) {
  if (busy) return;
  var next = document.getElementById(targetId);
  if (!next || (current && current.id === targetId)) return;

  navLinks.forEach(function (l) { l.classList.remove('active'); });
  var activeLink = document.querySelector('nav a[data-target="' + targetId + '"]');
  if (activeLink) activeLink.classList.add('active');

  if (!current) {
    next.style.display = 'block';
    animate(next,
      { opacity: '0', transform: 'translateY(12px)' },
      { opacity: '1', transform: 'translateY(0)' },
      400
    );
    current = next;
    return;
  }

  busy = true;

  animate(current,
    { opacity: '1', transform: 'translateY(0)' },
    { opacity: '0', transform: 'translateY(-8px)' },
    220,
    function () {
      current.style.display = 'none';
      current.style.transition = '';
      mainEl.scrollTo({ top: 0, behavior: 'smooth' });

      next.style.display = 'block';
      animate(next,
        { opacity: '0', transform: 'translateY(12px)' },
        { opacity: '1', transform: 'translateY(0)' },
        380,
        function () { busy = false; }
      );
      current = next;
    }
  );
}

navLinks.forEach(function (link) {
  link.addEventListener('click', function () {
    showSection(this.getAttribute('data-target'));
  });
});

showSection('paintings');


/* ─────────────────────────────────────────
   Lightbox — fade + scale on open / close
───────────────────────────────────────── */
var lightbox       = document.getElementById('lightbox');
var lightboxInner  = lightbox.querySelector('.lightbox-inner');
var lightboxImg    = document.getElementById('lightbox-img');
var lightboxTitle  = document.getElementById('lightbox-title');
var lightboxYear   = document.getElementById('lightbox-year');
var lightboxMedium = document.getElementById('lightbox-medium');
var lightboxIsOpen = false;

function openLightbox(imgEl, title, year, medium) {
  if (lightboxIsOpen) return;
  lightboxIsOpen = true;

  lightboxImg.src            = imgEl.src;
  lightboxTitle.textContent  = title;
  lightboxYear.textContent   = year;
  lightboxMedium.textContent = medium;

  lightbox.style.display = 'flex';
  document.body.style.overflow = 'hidden';

  // Overlay fades in
  animate(lightbox,
    { opacity: '0' },
    { opacity: '1' },
    280
  );

  // Content scales in, slightly after overlay
  setTimeout(function () {
    animate(lightboxInner,
      { opacity: '0', transform: 'scale(0.96)' },
      { opacity: '1', transform: 'scale(1)' },
      340
    );
  }, 100);
}

function closeLightbox() {
  if (!lightboxIsOpen) return;

  animate(lightboxInner,
    { opacity: '1', transform: 'scale(1)' },
    { opacity: '0', transform: 'scale(0.96)' },
    200
  );

  setTimeout(function () {
    animate(lightbox,
      { opacity: '1' },
      { opacity: '0' },
      240,
      function () {
        lightbox.style.display = 'none';
        lightbox.style.transition = '';
        lightboxInner.style.transition = '';
        document.body.style.overflow = '';
        lightboxIsOpen = false;
      }
    );
  }, 120);
}

document.querySelectorAll('.painting-item').forEach(function (item) {
  item.addEventListener('click', function () {
    openLightbox(
      item.querySelector('img'),
      item.getAttribute('data-title'),
      item.getAttribute('data-year'),
      item.getAttribute('data-medium')
    );
  });
});

document.getElementById('lightbox-close').addEventListener('click', closeLightbox);

lightbox.addEventListener('click', function (e) {
  if (e.target === lightbox) closeLightbox();
});

document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') closeLightbox();
});

})();