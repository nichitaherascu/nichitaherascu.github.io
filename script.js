(function () {

/* ─────────────────────────────────────────
   Utility: animate a single CSS property
   using requestAnimationFrame so transitions
   fire reliably after display changes.
───────────────────────────────────────── */
function animate(el, fromProps, toProps, duration, callback) {
  Object.assign(el.style, fromProps);
  el.style.transition = '';

  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      el.style.transition = buildTransition(toProps, duration);
      Object.assign(el.style, toProps);
      if (callback) {
        setTimeout(callback, duration);
      }
    });
  });
}

function buildTransition(props, duration) {
  return Object.keys(props)
    .map(function (p) { return p + ' ' + duration + 'ms ease'; })
    .join(', ');
}


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

  // Update nav active state
  navLinks.forEach(function (l) { l.classList.remove('active'); });
  var activeLink = document.querySelector('nav a[data-target="' + targetId + '"]');
  if (activeLink) activeLink.classList.add('active');

  // First load — just show the section
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

  // Fade out current
  animate(current,
    { opacity: '1', transform: 'translateY(0)' },
    { opacity: '0', transform: 'translateY(-8px)' },
    220,
    function () {
      current.style.display = 'none';
      current.style.transition = '';

      // Smooth scroll to top of main panel
      mainEl.scrollTo({ top: 0, behavior: 'smooth' });

      // Fade in next
      next.style.display = 'block';
      animate(next,
        { opacity: '0', transform: 'translateY(12px)' },
        { opacity: '1', transform: 'translateY(0)' },
        380,
        function () {
          busy = false;
        }
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

// Show default section on load
showSection('paintings');


/* ─────────────────────────────────────────
   Lightbox — fade + scale on open/close
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

  // Populate content
  lightboxImg.src            = imgEl.src;
  lightboxTitle.textContent  = title;
  lightboxYear.textContent   = year;
  lightboxMedium.textContent = medium;

  // Show overlay, start transparent
  lightbox.style.display = 'flex';
  document.body.style.overflow = 'hidden';

  // 1. Fade in the dark overlay
  animate(lightbox,
    { opacity: '0' },
    { opacity: '1' },
    280
  );

  // 2. Scale + fade in the inner content, slightly delayed
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

  // 1. Fade out inner content first
  animate(lightboxInner,
    { opacity: '1', transform: 'scale(1)' },
    { opacity: '0', transform: 'scale(0.96)' },
    200
  );

  // 2. Fade out overlay
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

// Open on painting click
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

// Close triggers
document.getElementById('lightbox-close').addEventListener('click', closeLightbox);

lightbox.addEventListener('click', function (e) {
  if (e.target === lightbox) closeLightbox();
});

document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') closeLightbox();
});

})();