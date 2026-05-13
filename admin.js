(function () {

/* ─────────────────────────────────────────
   PASSWORD CONFIG
   Default password: admin

   To change it, open browser console and run:
     crypto.subtle.digest('SHA-256', new TextEncoder().encode('yournewpassword'))
       .then(b => console.log([...new Uint8Array(b)].map(x => x.toString(16).padStart(2,'0')).join('')))
   Paste the result as PASSWORD_HASH below.
───────────────────────────────────────── */
var PASSWORD_HASH = '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918';

/* ─────────────────────────────────────────
   Default painting data — keep in sync with index.html
───────────────────────────────────────── */
var defaultPaintings = [
  { id: 1, src: 'images/painting-1.jpg', title: 'Untitled I',              year: '2024', medium: 'Oil on canvas'     },
  { id: 2, src: 'images/painting-2.jpg', title: 'Figure Study II',         year: '2024', medium: 'Acrylic on linen'  },
  { id: 3, src: 'images/painting-3.jpg', title: 'Still Life with Vessels', year: '2023', medium: 'Oil on canvas'     },
  { id: 4, src: 'images/painting-4.jpg', title: 'Horizon',                 year: '2023', medium: 'Oil on panel'      },
  { id: 5, src: 'images/painting-5.jpg', title: 'Portrait Study',          year: '2023', medium: 'Oil on canvas'     },
  { id: 6, src: 'images/painting-6.jpg', title: 'Reflection III',          year: '2022', medium: 'Acrylic on canvas' },
  { id: 7, src: 'images/painting-7.jpg', title: 'Interior',                year: '2022', medium: 'Oil on canvas'     },
  { id: 8, src: 'images/painting-8.jpg', title: 'Forest',                  year: '2021', medium: 'Oil on linen'      },
];

/* ─────────────────────────────────────────
   Helpers
───────────────────────────────────────── */
function getPaintings() {
  var stored = localStorage.getItem('nh_paintings');
  if (stored) { try { return JSON.parse(stored); } catch (e) {} }
  return JSON.parse(JSON.stringify(defaultPaintings));
}

function savePaintings(paintings) {
  localStorage.setItem('nh_paintings', JSON.stringify(paintings));
}

function hashPassword(pw) {
  return crypto.subtle
    .digest('SHA-256', new TextEncoder().encode(pw))
    .then(function (buf) {
      return Array.from(new Uint8Array(buf))
        .map(function (b) { return b.toString(16).padStart(2, '0'); })
        .join('');
    });
}

function escapeAttr(str) {
  return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

function toBase64(str)  { return btoa(unescape(encodeURIComponent(str))); }
function fromBase64(b64) { return decodeURIComponent(escape(atob(b64))); }

function nextId(paintings) {
  if (!paintings.length) return 1;
  return Math.max.apply(null, paintings.map(function (p) { return p.id; })) + 1;
}

function detectGitHub() {
  var host = window.location.hostname;
  if (host.endsWith('.github.io')) {
    var owner = host.replace('.github.io', '');
    var parts = window.location.pathname.replace(/^\//, '').split('/');
    var repo  = (parts[0] && parts[0] !== 'admin.html') ? parts[0] : owner + '.github.io';
    return { owner: owner, repo: repo };
  }
  return null;
}

/* ─────────────────────────────────────────
   Elements
───────────────────────────────────────── */
var loginScreen = document.getElementById('login-screen');
var adminPanel  = document.getElementById('admin-panel');
var pwInput     = document.getElementById('password-input');
var loginBtn    = document.getElementById('login-btn');
var loginError  = document.getElementById('login-error');
var ghStatus    = document.getElementById('gh-status');
var publishBtn  = document.getElementById('publish-btn');

/* ─────────────────────────────────────────
   Session
───────────────────────────────────────── */
function enterAdmin() {
  sessionStorage.setItem('nh_admin', '1');
  loginScreen.style.display = 'none';
  adminPanel.style.display  = 'block';
  loadGitHubSettings();
  renderPaintings();
}

if (sessionStorage.getItem('nh_admin') === '1') enterAdmin();

/* ─────────────────────────────────────────
   Login
───────────────────────────────────────── */
loginBtn.addEventListener('click', function () {
  loginError.textContent = '';
  hashPassword(pwInput.value).then(function (hash) {
    if (hash === PASSWORD_HASH) {
      enterAdmin();
    } else {
      loginError.textContent = 'Incorrect password.';
      pwInput.value = '';
      pwInput.focus();
    }
  });
});

pwInput.addEventListener('keydown', function (e) {
  if (e.key === 'Enter') loginBtn.click();
  loginError.textContent = '';
});

/* ─────────────────────────────────────────
   GitHub settings
───────────────────────────────────────── */
function loadGitHubSettings() {
  var saved = JSON.parse(localStorage.getItem('nh_gh_settings') || '{}');
  var auto  = detectGitHub();
  document.getElementById('gh-token').value = saved.token || '';
  document.getElementById('gh-owner').value = saved.owner || (auto && auto.owner) || '';
  document.getElementById('gh-repo').value  = saved.repo  || (auto && auto.repo)  || '';
}

document.getElementById('save-gh-btn').addEventListener('click', function () {
  localStorage.setItem('nh_gh_settings', JSON.stringify({
    token: document.getElementById('gh-token').value.trim(),
    owner: document.getElementById('gh-owner').value.trim(),
    repo:  document.getElementById('gh-repo').value.trim(),
  }));
  showToast('Settings saved ✓');
});

/* ─────────────────────────────────────────
   Collect current field values from DOM
───────────────────────────────────────── */
function collectPaintings() {
  var paintings = getPaintings();
  var rows = document.querySelectorAll('.painting-row');
  var result = [];

  rows.forEach(function (row) {
    var id = parseInt(row.getAttribute('data-id'));
    var p  = paintings.find(function (x) { return x.id === id; }) || { id: id };
    row.querySelectorAll('input[data-field]').forEach(function (input) {
      p[input.getAttribute('data-field')] = input.value;
    });
    result.push(p);
  });

  return result;
}

/* ─────────────────────────────────────────
   Render all painting rows
───────────────────────────────────────── */
function field(label, name, id, value, full) {
  return (
    '<div class="field-group' + (full ? ' full' : '') + '">' +
    '<label>' + label + '</label>' +
    '<input type="text" data-field="' + name + '" data-id="' + id + '" value="' + escapeAttr(value) + '" />' +
    '</div>'
  );
}

function renderPaintings() {
  var list      = document.getElementById('paintings-list');
  var paintings = getPaintings();
  list.innerHTML = '';

  paintings.forEach(function (p, index) {
    var row = document.createElement('div');
    row.className  = 'painting-row';
    row.setAttribute('data-id', p.id);

    row.innerHTML =
      '<div class="painting-thumb"><img src="' + escapeAttr(p.src || '') + '" alt="" /></div>' +
      '<div class="painting-fields">' +
        field('Title',      'title',  p.id, p.title  || '') +
        field('Year',       'year',   p.id, p.year   || '') +
        field('Medium',     'medium', p.id, p.medium || '') +
        field('Image path', 'src',    p.id, p.src    || '', true) +
        '<div class="row-actions full">' +
          '<button class="btn-move btn-up"   data-id="' + p.id + '" ' + (index === 0 ? 'disabled' : '') + '>↑</button>' +
          '<button class="btn-move btn-down" data-id="' + p.id + '" ' + (index === paintings.length - 1 ? 'disabled' : '') + '>↓</button>' +
          '<button class="btn-remove"        data-id="' + p.id + '">Remove</button>' +
        '</div>' +
      '</div>';

    list.appendChild(row);

    // Live thumbnail update when src changes
    row.querySelector('input[data-field="src"]').addEventListener('change', function () {
      row.querySelector('.painting-thumb img').src = this.value;
    });
  });

  // Up / Down buttons
  list.querySelectorAll('.btn-up').forEach(function (btn) {
    btn.addEventListener('click', function () { movePainting(parseInt(btn.getAttribute('data-id')), -1); });
  });

  list.querySelectorAll('.btn-down').forEach(function (btn) {
    btn.addEventListener('click', function () { movePainting(parseInt(btn.getAttribute('data-id')), 1); });
  });

  // Remove buttons
  list.querySelectorAll('.btn-remove').forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (confirm('Remove this painting? This cannot be undone until you publish.')) {
        removePainting(parseInt(btn.getAttribute('data-id')));
      }
    });
  });

  // Add painting button
  var addBtn = document.createElement('button');
  addBtn.className   = 'add-row-btn';
  addBtn.textContent = '+ Add painting';
  addBtn.addEventListener('click', addPainting);
  list.appendChild(addBtn);
}

/* ─────────────────────────────────────────
   Move painting up (-1) or down (+1)
───────────────────────────────────────── */
function movePainting(id, direction) {
  var paintings = collectPaintings();
  var index = paintings.findIndex(function (p) { return p.id === id; });
  var target = index + direction;

  if (target < 0 || target >= paintings.length) return;

  var temp          = paintings[index];
  paintings[index]  = paintings[target];
  paintings[target] = temp;

  savePaintings(paintings);
  renderPaintings();
}

/* ─────────────────────────────────────────
   Remove painting by id
───────────────────────────────────────── */
function removePainting(id) {
  var paintings = collectPaintings().filter(function (p) { return p.id !== id; });
  savePaintings(paintings);
  renderPaintings();
}

/* ─────────────────────────────────────────
   Add new empty painting at the end
───────────────────────────────────────── */
function addPainting() {
  var paintings = collectPaintings();
  paintings.push({
    id:     nextId(paintings),
    src:    '',
    title:  'New Painting',
    year:   new Date().getFullYear().toString(),
    medium: '',
  });
  savePaintings(paintings);
  renderPaintings();

  // Scroll new row into view
  var rows = document.querySelectorAll('.painting-row');
  var last = rows[rows.length - 1];
  if (last) last.scrollIntoView({ behavior: 'smooth', block: 'center' });
  // Focus title input
  var titleInput = last && last.querySelector('input[data-field="title"]');
  if (titleInput) { titleInput.select(); }
}

/* ─────────────────────────────────────────
   Build paintings HTML snippet for publishing
───────────────────────────────────────── */
function buildPaintingsHTML(paintings) {
  return paintings.map(function (p) {
    return (
      '        <div class="painting-item" data-id="' + p.id + '" ' +
      'data-title="'  + escapeAttr(p.title  || '') + '" ' +
      'data-year="'   + escapeAttr(p.year   || '') + '" ' +
      'data-medium="' + escapeAttr(p.medium || '') + '">\n' +
      '          <img src="' + escapeAttr(p.src || '') + '" alt="" />\n' +
      '        </div>'
    );
  }).join('\n');
}

/* ─────────────────────────────────────────
   Publish to GitHub
───────────────────────────────────────── */
function setStatus(type, msg) {
  ghStatus.className   = 'gh-status ' + type;
  ghStatus.textContent = msg;
}

publishBtn.addEventListener('click', function () {
  var settings = JSON.parse(localStorage.getItem('nh_gh_settings') || '{}');
  var token = document.getElementById('gh-token').value.trim() || settings.token;
  var owner = document.getElementById('gh-owner').value.trim() || settings.owner;
  var repo  = document.getElementById('gh-repo').value.trim()  || settings.repo;

  if (!token || !owner || !repo) {
    setStatus('error', 'Fill in your GitHub token, owner and repository first.');
    return;
  }

  var paintings = collectPaintings();
  savePaintings(paintings);

  var apiUrl  = 'https://api.github.com/repos/' + owner + '/' + repo + '/contents/index.html';
  var headers = {
    'Authorization': 'token ' + token,
    'Accept':        'application/vnd.github.v3+json',
    'Content-Type':  'application/json',
  };

  publishBtn.disabled    = true;
  publishBtn.textContent = 'Publishing…';
  setStatus('loading', 'Fetching index.html from GitHub…');

  fetch(apiUrl, { headers: headers })
    .then(function (res) {
      if (!res.ok) throw new Error('Could not fetch index.html (status ' + res.status + '). Check your token and repo.');
      return res.json();
    })
    .then(function (data) {
      var sha     = data.sha;
      var content = fromBase64(data.content.replace(/\n/g, ''));

      var startTag = '<!-- PAINTINGS:START -->';
      var endTag   = '<!-- PAINTINGS:END -->';
      var start    = content.indexOf(startTag);
      var end      = content.indexOf(endTag) + endTag.length;

      if (start === -1 || end === -1) {
        throw new Error('Marker comments not found in index.html.');
      }

      var newBlock =
        startTag + '\n' +
        '      <div class="paintings-grid">\n\n' +
        buildPaintingsHTML(paintings) + '\n\n' +
        '      </div>\n      ' + endTag;

      var updated = content.slice(0, start) + newBlock + content.slice(end);

      setStatus('loading', 'Committing changes…');

      return fetch(apiUrl, {
        method:  'PUT',
        headers: headers,
        body: JSON.stringify({
          message: 'Update paintings via admin',
          content: toBase64(updated),
          sha:     sha,
        }),
      });
    })
    .then(function (res) {
      if (!res.ok) return res.json().then(function (d) { throw new Error(d.message || 'Commit failed'); });
      return res.json();
    })
    .then(function () {
      setStatus('success', '✓ Published! Site updates in ~1 minute.');
      showToast('Published ✓');
    })
    .catch(function (err) {
      setStatus('error', '✗ ' + err.message);
      showToast('Error — see settings bar');
    })
    .finally(function () {
      publishBtn.disabled    = false;
      publishBtn.textContent = 'Publish to live site ↑';
    });
});

/* ─────────────────────────────────────────
   Logout
───────────────────────────────────────── */
document.getElementById('logout-btn').addEventListener('click', function () {
  sessionStorage.removeItem('nh_admin');
  adminPanel.style.display  = 'none';
  loginScreen.style.display = 'flex';
  pwInput.value = '';
});

/* ─────────────────────────────────────────
   Toast
───────────────────────────────────────── */
function showToast(msg) {
  var toast = document.createElement('div');
  toast.className   = 'toast';
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(function () { toast.classList.add('show'); }, 10);
  setTimeout(function () {
    toast.classList.remove('show');
    setTimeout(function () { toast.remove(); }, 300);
  }, 3000);
}

})();