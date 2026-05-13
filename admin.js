(function () {

/* ─────────────────────────────────────────
   PASSWORD  (default: "admin")
   To change — run in browser console:
     crypto.subtle.digest('SHA-256', new TextEncoder().encode('newpassword'))
       .then(b => console.log([...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')))
   Paste result as PASSWORD_HASH.
───────────────────────────────────────── */
var PASSWORD_HASH = '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918';

/* ─────────────────────────────────────────
   Default data
───────────────────────────────────────── */
var defaultPaintings = [
  { id:1, src:'images/painting-1.jpg', title:'Untitled I',              year:'2024', medium:'Oil on canvas',     description:'' },
  { id:2, src:'images/painting-2.jpg', title:'Figure Study II',         year:'2024', medium:'Acrylic on linen',  description:'' },
  { id:3, src:'images/painting-3.jpg', title:'Still Life with Vessels', year:'2023', medium:'Oil on canvas',     description:'' },
  { id:4, src:'images/painting-4.jpg', title:'Horizon',                 year:'2023', medium:'Oil on panel',      description:'' },
  { id:5, src:'images/painting-5.jpg', title:'Portrait Study',          year:'2023', medium:'Oil on canvas',     description:'' },
  { id:6, src:'images/painting-6.jpg', title:'Reflection III',          year:'2022', medium:'Acrylic on canvas', description:'' },
  { id:7, src:'images/painting-7.jpg', title:'Interior',                year:'2022', medium:'Oil on canvas',     description:'' },
  { id:8, src:'images/painting-8.jpg', title:'Forest',                  year:'2021', medium:'Oil on linen',      description:'' },
];

var defaultTextContent = {
  intro:     'Painting is a way of thinking with the hand. Each work begins not with an image in mind but with a surface and a question — what remains when everything unnecessary is removed.',
  process:   'The works are built in layers, slowly. Oil on canvas or linen, sometimes panel. Colour is arrived at through mixing and erasure rather than selection. A painting is finished when it starts to resist further change.',
  place:     'Much of the work is rooted in landscape — not as subject but as condition. The flatness of the east, the grey weight of winter light, the particular silence of fields at the edge of a town.',
  biography: 'Nichita Herascu is a painter based in Europe. He studied fine art and has exhibited work internationally. He is currently working on a new body of work.',
};

var defaultResumeContent = {
  name: 'Nichita Herascu',
  bio:  ['Born in 2000 in Bucharest, Romania.', 'Resides and works in Bucharest, Romania.'],
  education: [
    { id:1, years:'2021 – 2022', detail:'Photography and Videography, University of Arts Bucharest, Bucharest, Romania' },
    { id:2, years:'2019 – 2020', detail:'Advanced Graphic Design, Pixellab, Bucharest, Romania' },
    { id:3, years:'2015 – 2019', detail:'Industrial & Product Design, Nicolae Tonitza Art Highschool, Bucharest, Romania' },
  ],
  exhibitions: [
    { id:1, year:'2019', detail:'Extravaganzza, group exhibition, Bucharest, Romania' },
    { id:2, year:'2019', detail:'Tête-à-Tête 3, group exhibition, Bucharest, Romania' },
    { id:3, year:'2018', detail:'MNAC, group exhibition, Bucharest, Romania' },
    { id:4, year:'2017', detail:'Tête-à-Tête 2, Artmark, group exhibition, Bucharest, Romania' },
  ],
  studio: 'Str. Emil Racovita 22A\n041761\nRomania',
  email:  'nichitaherascu@gmail.com',
};

/* ─────────────────────────────────────────
   Helpers
───────────────────────────────────────── */
function get(key, def)  { var s=localStorage.getItem(key); if(s){try{return JSON.parse(s);}catch(e){}} return JSON.parse(JSON.stringify(def)); }
function save(key, val) { localStorage.setItem(key, JSON.stringify(val)); }

function getPaintings()     { return get('nh_paintings',      defaultPaintings); }
function getTextContent()   { return get('nh_text_content',   defaultTextContent); }
function getResumeContent() { return get('nh_resume_content', defaultResumeContent); }

function hashPassword(pw) {
  return crypto.subtle.digest('SHA-256', new TextEncoder().encode(pw))
    .then(function(buf){ return Array.from(new Uint8Array(buf)).map(function(b){return b.toString(16).padStart(2,'0');}).join(''); });
}

function esc(str)  { return String(str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function attr(str) { return String(str||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;'); }
function toB64(s)  { return btoa(unescape(encodeURIComponent(s))); }
function frB64(s)  { return decodeURIComponent(escape(atob(s))); }
function nextId(arr){ return arr.length ? Math.max.apply(null,arr.map(function(x){return x.id;})) + 1 : 1; }

function detectGitHub() {
  var h = window.location.hostname;
  if (!h.endsWith('.github.io')) return null;
  var owner = h.replace('.github.io','');
  var parts = window.location.pathname.replace(/^\//,'').split('/');
  return { owner:owner, repo:(parts[0]&&parts[0]!=='admin.html') ? parts[0] : owner+'.github.io' };
}

/* ─────────────────────────────────────────
   Session + Login
───────────────────────────────────────── */
var loginScreen = document.getElementById('login-screen');
var adminPanel  = document.getElementById('admin-panel');
var pwInput     = document.getElementById('password-input');
var loginError  = document.getElementById('login-error');

function enterAdmin() {
  sessionStorage.setItem('nh_admin','1');
  loginScreen.style.display = 'none';
  adminPanel.style.display  = 'block';
  loadGitHubSettings();
  renderPaintings();
  renderTextEditor();
  renderResumeEditor();
}

if (sessionStorage.getItem('nh_admin') === '1') enterAdmin();

document.getElementById('login-btn').addEventListener('click', function() {
  loginError.textContent = '';
  hashPassword(pwInput.value).then(function(hash) {
    if (hash === PASSWORD_HASH) { enterAdmin(); }
    else { loginError.textContent = 'Incorrect password.'; pwInput.value=''; pwInput.focus(); }
  });
});

pwInput.addEventListener('keydown', function(e) {
  if (e.key==='Enter') document.getElementById('login-btn').click();
  loginError.textContent = '';
});

/* ─────────────────────────────────────────
   GitHub settings
───────────────────────────────────────── */
function loadGitHubSettings() {
  var s=JSON.parse(localStorage.getItem('nh_gh_settings')||'{}'), a=detectGitHub();
  document.getElementById('gh-token').value = s.token||'';
  document.getElementById('gh-owner').value = s.owner||(a&&a.owner)||'';
  document.getElementById('gh-repo').value  = s.repo ||(a&&a.repo) ||'';
}

document.getElementById('save-gh-btn').addEventListener('click', function() {
  localStorage.setItem('nh_gh_settings', JSON.stringify({
    token: document.getElementById('gh-token').value.trim(),
    owner: document.getElementById('gh-owner').value.trim(),
    repo:  document.getElementById('gh-repo').value.trim(),
  }));
  showToast('Settings saved ✓');
});

/* ─────────────────────────────────────────
   Tab switching
───────────────────────────────────────── */
var tabTitles = { paintings:'Paintings', text:'Text', resume:'Resume' };

document.querySelectorAll('.tab-btn').forEach(function(btn) {
  btn.addEventListener('click', function() {
    document.querySelectorAll('.tab-btn').forEach(function(b){ b.classList.remove('active'); });
    document.querySelectorAll('.tab-panel').forEach(function(p){ p.classList.remove('active'); });
    btn.classList.add('active');
    document.getElementById('tab-'+btn.getAttribute('data-tab')).classList.add('active');
    document.getElementById('admin-tab-title').textContent = tabTitles[btn.getAttribute('data-tab')];
  });
});

/* ─────────────────────────────────────────
   PAINTINGS TAB
───────────────────────────────────────── */
function collectPaintings() {
  var paintings=getPaintings(), result=[];
  document.querySelectorAll('.painting-row').forEach(function(row) {
    var id=parseInt(row.getAttribute('data-id'));
    var p=paintings.find(function(x){return x.id===id;})||{id:id};
    row.querySelectorAll('[data-field]').forEach(function(el){ p[el.getAttribute('data-field')]=el.value; });
    result.push(p);
  });
  return result;
}

function inputField(label, name, id, value, full) {
  return '<div class="field-group'+(full?' full':'')+'"><label>'+label+'</label>'+
         '<input type="text" data-field="'+name+'" data-id="'+id+'" value="'+attr(value||'')+'"/></div>';
}

function textareaField(label, name, id, value) {
  return '<div class="field-group full"><label>'+label+'</label>'+
         '<textarea data-field="'+name+'" data-id="'+id+'" rows="3">'+esc(value||'')+'</textarea></div>';
}

function renderPaintings() {
  var list=document.getElementById('paintings-list');
  var paintings=getPaintings();
  list.innerHTML='';

  paintings.forEach(function(p, idx) {
    var row=document.createElement('div');
    row.className='painting-row';
    row.setAttribute('data-id', p.id);
    row.innerHTML=
      '<div class="painting-thumb"><img src="'+attr(p.src||'')+'" alt=""/></div>'+
      '<div class="painting-fields">'+
        inputField('Title','title',p.id,p.title)+
        inputField('Year','year',p.id,p.year)+
        inputField('Medium','medium',p.id,p.medium)+
        inputField('Image path','src',p.id,p.src,true)+
        textareaField('Description','description',p.id,p.description)+
        '<div class="row-actions full">'+
          '<button class="btn-move btn-up" data-id="'+p.id+'"'+(idx===0?' disabled':'')+'>↑</button>'+
          '<button class="btn-move btn-down" data-id="'+p.id+'"'+(idx===paintings.length-1?' disabled':'')+'>↓</button>'+
          '<button class="btn-remove" data-id="'+p.id+'">Remove</button>'+
        '</div>'+
      '</div>';
    list.appendChild(row);

    row.querySelector('input[data-field="src"]').addEventListener('change', function() {
      row.querySelector('.painting-thumb img').src = this.value;
    });
  });

  list.querySelectorAll('.btn-up').forEach(function(b){
    b.addEventListener('click', function(){ movePainting(parseInt(b.getAttribute('data-id')),-1); });
  });
  list.querySelectorAll('.btn-down').forEach(function(b){
    b.addEventListener('click', function(){ movePainting(parseInt(b.getAttribute('data-id')),1); });
  });
  list.querySelectorAll('.btn-remove').forEach(function(b){
    b.addEventListener('click', function(){
      if(confirm('Remove this painting?')) removePainting(parseInt(b.getAttribute('data-id')));
    });
  });

  var addBtn=document.createElement('button');
  addBtn.className='add-row-btn';
  addBtn.textContent='+ Add painting';
  addBtn.addEventListener('click', addPainting);
  list.appendChild(addBtn);
}

function movePainting(id, dir) {
  var p=collectPaintings(), i=p.findIndex(function(x){return x.id===id;}), t=i+dir;
  if(t<0||t>=p.length) return;
  var tmp=p[i]; p[i]=p[t]; p[t]=tmp;
  save('nh_paintings',p); renderPaintings();
}

function removePainting(id) {
  save('nh_paintings', collectPaintings().filter(function(p){return p.id!==id;}));
  renderPaintings();
}

function addPainting() {
  var p=collectPaintings();
  p.push({id:nextId(p), src:'', title:'New Painting', year:new Date().getFullYear().toString(), medium:'', description:''});
  save('nh_paintings',p); renderPaintings();
  var rows=document.querySelectorAll('.painting-row');
  var last=rows[rows.length-1];
  if(last){ last.scrollIntoView({behavior:'smooth',block:'center'}); var t=last.querySelector('input[data-field="title"]'); if(t) t.select(); }
}

/* ─────────────────────────────────────────
   TEXT TAB
───────────────────────────────────────── */
function renderTextEditor() {
  var c=getTextContent();
  var el=document.getElementById('text-editor');
  el.innerHTML=
    edSection('Introduction','text-intro',c.intro,5)+
    edSection('Process','text-process',c.process,4)+
    edSection('Place','text-place',c.place,4)+
    edSection('Biography','text-biography',c.biography,4);

  function edSection(label, id, value, rows) {
    return '<div class="editor-section"><h3>'+label+'</h3>'+
           '<textarea id="'+id+'" rows="'+rows+'">'+esc(value)+'</textarea></div>';
  }
}

function collectTextContent() {
  return {
    intro:     document.getElementById('text-intro').value,
    process:   document.getElementById('text-process').value,
    place:     document.getElementById('text-place').value,
    biography: document.getElementById('text-biography').value,
  };
}

/* ─────────────────────────────────────────
   RESUME TAB
───────────────────────────────────────── */
function renderResumeEditor() {
  var c=getResumeContent();
  var el=document.getElementById('resume-editor');
  el.innerHTML='';

  /* Identity */
  var identity=mkDiv('editor-block');
  identity.innerHTML='<h3>Identity</h3>';
  identity.appendChild(labeledInput('Name','resume-name',c.name));
  identity.appendChild(labeledInput('Bio line 1','resume-bio-0',c.bio[0]||''));
  identity.appendChild(labeledInput('Bio line 2','resume-bio-1',c.bio[1]||''));
  el.appendChild(identity);

  /* Education */
  el.appendChild(entryBlock('Education','education-entries',c.education,'years'));

  /* Exhibitions */
  el.appendChild(entryBlock('Selected Exhibitions','exhibition-entries',c.exhibitions,'year'));

  /* Contact */
  var contact=mkDiv('editor-block');
  contact.innerHTML='<h3>Contact</h3>';
  contact.appendChild(labeledTextarea('Studio address','resume-studio',c.studio,3));
  contact.appendChild(labeledInput('Email','resume-email',c.email));
  el.appendChild(contact);
}

function mkDiv(cls) { var d=document.createElement('div'); d.className=cls; return d; }

function labeledInput(label, id, value) {
  var w=mkDiv('editor-section');
  w.innerHTML='<h3>'+label+'</h3><input type="text" id="'+id+'" value="'+attr(value)+'" />';
  return w;
}

function labeledTextarea(label, id, value, rows) {
  var w=mkDiv('editor-section');
  w.innerHTML='<h3>'+label+'</h3><textarea id="'+id+'" rows="'+rows+'">'+esc(value)+'</textarea>';
  return w;
}

function entryBlock(title, listId, entries, yearField) {
  var block=mkDiv('editor-block');
  var h=document.createElement('h3'); h.textContent=title;
  block.appendChild(h);
  var list=mkDiv('entry-list'); list.id=listId;
  block.appendChild(list);
  entries.forEach(function(e){ list.appendChild(entryRow(e, yearField)); });
  var addBtn=document.createElement('button');
  addBtn.className='add-entry-btn';
  addBtn.textContent='+ Add entry';
  addBtn.addEventListener('click', function(){
    var ne={id:Date.now()}; ne[yearField]=''; ne.detail='';
    list.appendChild(entryRow(ne, yearField));
  });
  block.appendChild(addBtn);
  return block;
}

function entryRow(entry, yearField) {
  var row=mkDiv('entry-row');
  row.setAttribute('data-id', entry.id);
  var yr=document.createElement('input'); yr.type='text';
  yr.value=entry[yearField]||'';
  yr.placeholder=yearField==='years'?'2021 – 2022':'2024';
  yr.setAttribute('data-year-field', yearField);
  var det=document.createElement('input'); det.type='text';
  det.value=entry.detail||''; det.placeholder='Detail';
  var rm=document.createElement('button');
  rm.className='btn-remove-entry'; rm.textContent='✕';
  rm.addEventListener('click', function(){ row.remove(); });
  row.appendChild(yr); row.appendChild(det); row.appendChild(rm);
  return row;
}

function collectResumeContent() {
  function entries(listId, yearField) {
    var r=[];
    document.querySelectorAll('#'+listId+' .entry-row').forEach(function(row){
      var inputs=row.querySelectorAll('input');
      var e={id:parseInt(row.getAttribute('data-id'))||Date.now(), detail:inputs[1]?inputs[1].value:''};
      e[yearField]=inputs[0]?inputs[0].value:'';
      r.push(e);
    });
    return r;
  }
  return {
    name:        (document.getElementById('resume-name')||{}).value||'',
    bio:         [(document.getElementById('resume-bio-0')||{}).value||'',(document.getElementById('resume-bio-1')||{}).value||''],
    education:   entries('education-entries','years'),
    exhibitions: entries('exhibition-entries','year'),
    studio:      (document.getElementById('resume-studio')||{}).value||'',
    email:       (document.getElementById('resume-email') ||{}).value||'',
  };
}

/* ─────────────────────────────────────────
   Build HTML for publishing
───────────────────────────────────────── */
function buildPaintingsHTML(paintings) {
  return paintings.map(function(p){
    return '        <div class="painting-item" data-id="'+p.id+'" data-title="'+attr(p.title||'')+
           '" data-year="'+attr(p.year||'')+'" data-medium="'+attr(p.medium||'')+
           '" data-description="'+attr(p.description||'')+'">\n'+
           '          <img src="'+attr(p.src||'')+'" alt="" />\n        </div>';
  }).join('\n');
}

function buildTextHTML(c) {
  return [
    '        <p>'+esc(c.intro||'')+'</p>',
    '        <h2 data-i18n="text-heading-process">Process</h2>',
    '        <p>'+esc(c.process||'')+'</p>',
    '        <h2 data-i18n="text-heading-place">Place</h2>',
    '        <p>'+esc(c.place||'')+'</p>',
    '        <h2 data-i18n="text-heading-biography">Biography</h2>',
    '        <p>'+esc(c.biography||'')+'</p>',
  ].join('\n');
}

function buildResumeHTML(c) {
  var h='      <div class="resume-inner">\n\n';
  h+='        <div class="resume-identity">\n';
  h+='          <p class="resume-name">'+esc(c.name)+'</p>\n';
  (c.bio||[]).forEach(function(b){ h+='          <p class="resume-bio">'+esc(b)+'</p>\n'; });
  h+='        </div>\n\n';
  h+='        <div class="resume-block" data-section="education">\n';
  h+='          <h2 class="resume-heading" data-i18n="resume-heading-education">Education</h2>\n';
  (c.education||[]).forEach(function(e){
    h+='          <div class="resume-entry"><span class="resume-year">'+esc(e.years||e.year||'')+'</span>'+
       '<span class="resume-detail">'+esc(e.detail||'')+'</span></div>\n';
  });
  h+='        </div>\n\n';
  h+='        <div class="resume-block" data-section="exhibitions">\n';
  h+='          <h2 class="resume-heading" data-i18n="resume-heading-exhibitions">Selected Exhibitions</h2>\n';
  (c.exhibitions||[]).forEach(function(e){
    h+='          <div class="resume-entry"><span class="resume-year">'+esc(e.year||'')+'</span>'+
       '<span class="resume-detail">'+esc(e.detail||'')+'</span></div>\n';
  });
  h+='        </div>\n\n';
  h+='        <div class="resume-block" data-section="contact">\n';
  h+='          <h2 class="resume-heading" data-i18n="resume-heading-contact">Contact</h2>\n';
  h+='          <div class="resume-entry"><span class="resume-year" data-i18n="resume-studio-label">Studio</span>'+
     '<span class="resume-detail">'+esc(c.studio||'').replace(/\n/g,'<br />')+'</span></div>\n';
  h+='          <div class="resume-entry"><span class="resume-year" data-i18n="resume-email-label">Email</span>'+
     '<span class="resume-detail"><a href="mailto:'+attr(c.email||'')+'" class="resume-link">'+esc(c.email||'')+'</a></span></div>\n';
  h+='        </div>\n\n';
  h+='      </div>';
  return h;
}

function replaceSection(html, startTag, endTag, newContent) {
  var s=html.indexOf(startTag), e=html.indexOf(endTag)+endTag.length;
  if(s===-1||e===-1) throw new Error('Markers not found: '+startTag);
  return html.slice(0,s)+startTag+'\n'+newContent+'\n      '+endTag+html.slice(e);
}

/* ─────────────────────────────────────────
   Publish
───────────────────────────────────────── */
var ghStatus   = document.getElementById('gh-status');
var publishBtn = document.getElementById('publish-btn');

function setStatus(type, msg){ ghStatus.className='gh-status '+type; ghStatus.textContent=msg; }

publishBtn.addEventListener('click', function() {
  var s=JSON.parse(localStorage.getItem('nh_gh_settings')||'{}');
  var token=document.getElementById('gh-token').value.trim()||s.token;
  var owner=document.getElementById('gh-owner').value.trim()||s.owner;
  var repo =document.getElementById('gh-repo').value.trim() ||s.repo;
  if(!token||!owner||!repo){ setStatus('error','Fill in your GitHub token, owner and repository first.'); return; }

  var paintings=collectPaintings();
  var text     =collectTextContent();
  var resume   =collectResumeContent();
  save('nh_paintings',     paintings);
  save('nh_text_content',  text);
  save('nh_resume_content',resume);

  var apiUrl ='https://api.github.com/repos/'+owner+'/'+repo+'/contents/index.html';
  var headers={'Authorization':'token '+token,'Accept':'application/vnd.github.v3+json','Content-Type':'application/json'};

  publishBtn.disabled=true; publishBtn.textContent='Publishing…';
  setStatus('loading','Fetching index.html…');

  fetch(apiUrl,{headers:headers})
    .then(function(r){ if(!r.ok) throw new Error('Fetch failed ('+r.status+')'); return r.json(); })
    .then(function(data){
      var sha=data.sha, content=frB64(data.content.replace(/\n/g,''));
      content=replaceSection(content,'<!-- PAINTINGS:START -->','<!-- PAINTINGS:END -->',
        '      <div class="paintings-grid">\n\n'+buildPaintingsHTML(paintings)+'\n\n      </div>');
      content=replaceSection(content,'<!-- TEXT:START -->','<!-- TEXT:END -->',buildTextHTML(text));
      content=replaceSection(content,'<!-- RESUME:START -->','<!-- RESUME:END -->',buildResumeHTML(resume));
      setStatus('loading','Committing…');
      return fetch(apiUrl,{method:'PUT',headers:headers,body:JSON.stringify({message:'Update content via admin',content:toB64(content),sha:sha})});
    })
    .then(function(r){ if(!r.ok) return r.json().then(function(d){throw new Error(d.message||'Commit failed');}); return r.json(); })
    .then(function(){ setStatus('success','✓ Published! Site updates in ~1 minute.'); showToast('Published ✓'); })
    .catch(function(err){ setStatus('error','✗ '+err.message); showToast('Error — see settings bar'); })
    .finally(function(){ publishBtn.disabled=false; publishBtn.textContent='Publish to live site ↑'; });
});

/* ─────────────────────────────────────────
   Logout + Toast
───────────────────────────────────────── */
document.getElementById('logout-btn').addEventListener('click', function() {
  sessionStorage.removeItem('nh_admin');
  adminPanel.style.display='none'; loginScreen.style.display='flex'; pwInput.value='';
});

function showToast(msg) {
  var t=document.createElement('div'); t.className='toast'; t.textContent=msg;
  document.body.appendChild(t);
  setTimeout(function(){t.classList.add('show');},10);
  setTimeout(function(){t.classList.remove('show');setTimeout(function(){t.remove();},300);},3000);
}

})();