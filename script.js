javascript (function () {

var currentLang = 'en';

function animate(el, fromProps, toProps, duration, callback) { Object.assign(el.style, fromProps); el.style.transition = ''; requestAnimationFrame(function () { requestAnimationFrame(function () { el.style.transition = Object.keys(toProps).map(function (p) { return p+' '+duration+'ms ease'; }).join(', '); Object.assign(el.style, toProps); if (callback) setTimeout(callback, duration); }); }); }

function escHtml(s) { return String(s||'').replace(/&/g,'&').replace(/</g,'<').replace(/>/g,'>'); }

/* ───────────────────────────────────────── Overrides — apply admin localStorage data to the live page ───────────────────────────────────────── */ function applyPaintingOverrides() { var stored = localStorage.getItem('nh_paintings'); if (!stored) return; try { var paintings = JSON.parse(stored); var grid = document.querySelector('.paintings-grid'); if (!grid || !Array.isArray(paintings)) return;

grid.innerHTML = paintings.map(function(p){ return '\n'+ ' \n'; }).join('\n'); } catch (e) {} }

/* Render structured text content */ function applyTextOverrides() { var stored = localStorage.getItem('nh_text_content'); if (!stored) return; try { var c = JSON.parse(stored); var textInner = document.querySelector('#text .text-inner'); if (!textInner) return;

var html = ''; if (c.intro) html += '' + escHtml(c.intro) + ''; if (c.process) { html += '' + (i18n[currentLang]['text-heading-process'] || 'Process') + ''; html += '' + escHtml(c.process) + ''; } if (c.place) { html += '' + (i18n[currentLang]['text-heading-place'] || 'Place') + ''; html += '' + escHtml(c.place) + ''; } if (c.biography) { html += '' + (i18n[currentLang]['text-heading-biography'] || 'Biography') + ''; html += '' + escHtml(c.biography) + ''; } if (c.all) { var paras = c.all.split(/\n\n+/).map(function(p){ return p.trim(); }).filter(Boolean); html = paras.map(function(p){ return ''+escHtml(p)+''; }).join(''); } if (html) textInner.innerHTML = html; } catch (e) {} }

function applyResumeOverrides() { var stored = localStorage.getItem('nh_resume_content'); if (!stored) return; try { var c = JSON.parse(stored); var section = document.getElementById('resume'); if (!section) return;

var nameEl = section.querySelector('.resume-name'); if (nameEl && c.name !== undefined) nameEl.textContent = c.name;

var bioEls = section.querySelectorAll('.resume-bio'); if (c.bio) c.bio.forEach(function (text, i) { if (bioEls[i]) bioEls[i].textContent = text; });

function rebuildEntries(block, entries, yearKey) { if (!block || !entries) return; block.querySelectorAll('.resume-entry').forEach(function (el) { el.remove(); }); entries.forEach(function (e) { var row = document.createElement('div'); row.className = 'resume-entry'; row.innerHTML = ''+escHtml(e[yearKey]||e.year||'')+''+ ''+escHtml(e.detail||'')+''; block.appendChild(row); }); }

rebuildEntries(section.querySelector('[data-section="education"]'), c.education, 'years'); rebuildEntries(section.querySelector('[data-section="exhibitions"]'), c.exhibitions, 'year');

var contactBlock = section.querySelector('[data-section="contact"]'); if (contactBlock) { if (c.studio !== undefined) { var studioDetail = contactBlock.querySelector('.resume-entry:first-child .resume-detail'); if (studioDetail) studioDetail.innerHTML = escHtml(c.studio).replace(/\n/g,''); } if (c.email !== undefined) { var emailLink = contactBlock.querySelector('a.resume-link'); if (emailLink) { emailLink.href='mailto:'+c.email; emailLink.textContent=c.email; } } } } catch (e) {} }

applyPaintingOverrides(); applyTextOverrides(); applyResumeOverrides();

/* ───────────────────────────────────────── Loader ───────────────────────────────────────── */ var loader = document.getElementById('loader'); var loaderFill = document.querySelector('.loader-name-fill');

window.addEventListener('load', function () { setTimeout(function () { loaderFill.style.transition='width 1.4s cubic-bezier(0.4,0,0.2,1)'; loaderFill.style.width='100%'; }, 150); setTimeout(function () { animate(loader,{opacity:'1'},{opacity:'0'},600,function(){loader.style.display='none';}); }, 1800); });

/* ───────────────────────────────────────── Hamburger ───────────────────────────────────────── */ var asideEl = document.querySelector('aside'); var hamburger = document.getElementById('hamburger'); var mainEl = document.querySelector('main');

function setMainPadding() { mainEl.style.paddingTop = window.innerWidth<=640 ? (asideEl.offsetHeight+24)+'px' : ''; }

hamburger.addEventListener('click', function(){ asideEl.classList.toggle('menu-open'); setTimeout(setMainPadding,360); }); window.addEventListener('resize', function(){ if(window.innerWidth>640) asideEl.classList.remove('menu-open'); setMainPadding(); }); window.addEventListener('load', setMainPadding);

/* ───────────────────────────────────────── i18n ───────────────────────────────────────── */ var i18n = { en: { 'nav-paintings':'Paintings','nav-resume':'Resume','nav-text':'Text','nav-contact':'Contact', 'resume-bio-1':'Born in 2000 in Bucharest, Romania.', 'resume-bio-2':'Resides and works in Bucharest, Romania.', 'resume-heading-education':'Education', 'resume-heading-exhibitions':'Selected Exhibitions', 'resume-heading-contact':'Contact', 'resume-studio-label':'Studio','resume-email-label':'Email', 'text-heading-process':'Process', 'text-heading-place':'Place', 'text-heading-biography':'Biography' }, de: { 'nav-paintings':'Gemälde','nav-resume':'Lebenslauf','nav-text':'Text','nav-contact':'Kontakt', 'resume-bio-1':'Geboren 2000 in Bukarest, Rumänien.', 'resume-bio-2':'Lebt und arbeitet in Bukarest, Rumänien.', 'resume-heading-education':'Ausbildung', 'resume-heading-exhibitions':'Ausgewählte Ausstellungen', 'resume-heading-contact':'Kontakt', 'resume-studio-label':'Atelier','resume-email-label':'E-Mail', 'text-heading-process':'Prozess', 'text-heading-place':'Ort', 'text-heading-biography':'Biografie' } };

function applyLanguage(lang) { currentLang = lang; document.querySelectorAll('[data-i18n]').forEach(function (el) { var key=el.getAttribute('data-i18n'); if (i18n[lang][key]!==undefined) el.textContent=i18n[lang][key]; }); document.querySelectorAll('[data-i18n-html]').forEach(function (el) { var key=el.getAttribute('data-i18n-html'); if (i18n[lang][key]!==undefined) el.innerHTML=i18n[lang][key]; }); document.querySelectorAll('.lang-btn').forEach(function (btn) { btn.classList.toggle('active', btn.getAttribute('data-lang')===lang); }); applyTextOverrides(); applyResumeOverrides(); }

document.querySelectorAll('.lang-btn').forEach(function (btn) { btn.addEventListener('click', function(){ applyLanguage(this.getAttribute('data-lang')); }); });

/* ───────────────────────────────────────── Navigation ───────────────────────────────────────── */ var navLinks = document.querySelectorAll('nav a[data-target]'); var current = null; var busy = false;

function showSection(targetId) { if (busy) return; var next=document.getElementById(targetId); if (!next||(current&&current.id===targetId)) return; navLinks.forEach(function(l){l.classList.remove('active');}); var al=document.querySelector('nav a[data-target="'+targetId+'"]'); if (al) al.classList.add('active'); if (window.innerWidth<=640){ asideEl.classList.remove('menu-open'); setTimeout(setMainPadding,360); } if (!current) { next.style.display='block'; animate(next,{opacity:'0',transform:'translateY(12px)'},{opacity:'1',transform:'translateY(0)'},400); current=next; return; } busy=true; animate(current,{opacity:'1',transform:'translateY(0)'},{opacity:'0',transform:'translateY(-8px)'},220,function(){ current.style.display='none'; current.style.transition=''; mainEl.scrollTo({top:0,behavior:'smooth'}); next.style.display='block'; animate(next,{opacity:'0',transform:'translateY(12px)'},{opacity:'1',transform:'translateY(0)'},380,function(){busy=false;}); current=next; }); }

navLinks.forEach(function(link){ link.addEventListener('click',function(){showSection(this.getAttribute('data-target'));}); }); showSection('paintings');

/* ───────────────────────────────────────── Lightbox (Event Delegation) ───────────────────────────────────────── */ var lightbox = document.getElementById('lightbox'); var lightboxInner = lightbox.querySelector('.lightbox-inner'); var lightboxImg = document.getElementById('lightbox-img'); var lightboxTitle = document.getElementById('lightbox-title'); var lightboxYear = document.getElementById('lightbox-year'); var lightboxMedium = document.getElementById('lightbox-medium'); var lightboxDesc = document.getElementById('lightbox-description'); var lightboxIsOpen = false;

function openLightbox(imgEl, title, year, medium, description) { if (lightboxIsOpen || !imgEl) return; lightboxIsOpen=true; lightboxImg.src=imgEl.src; lightboxTitle.textContent=title||''; lightboxYear.textContent=year||''; lightboxMedium.textContent=medium||''; lightboxDesc.textContent=description||''; lightboxDesc.style.display=description?'block':'none'; lightbox.style.display='flex'; document.body.style.overflow='hidden'; animate(lightbox,{opacity:'0'},{opacity:'1'},280); setTimeout(function(){ animate(lightboxInner,{opacity:'0',transform:'scale(0.96)'},{opacity:'1',transform:'scale(1)'},340); },100); }

function closeLightbox() { if (!lightboxIsOpen) return; animate(lightboxInner,{opacity:'1',transform:'scale(1)'},{opacity:'0',transform:'scale(0.96)'},200); setTimeout(function(){ animate(lightbox,{opacity:'1'},{opacity:'0'},240,function(){ lightbox.style.display='none'; lightbox.style.transition=''; lightboxInner.style.transition=''; document.body.style.overflow=''; lightboxIsOpen=false; }); },120); }

var grid = document.querySelector('.paintings-grid'); if (grid) { grid.addEventListener('click', function(e) { var item = e.target.closest('.painting-item'); if (item) { openLightbox( item.querySelector('img'), item.getAttribute('data-title'), item.getAttribute('data-year'), item.getAttribute('data-medium'), item.getAttribute('data-description') ); } }); }

document.getElementById('lightbox-close').addEventListener('click', closeLightbox); lightbox.addEventListener('click', function(e){ if(e.target===lightbox) closeLightbox(); }); document.addEventListener('keydown', function(e){ if(e.key==='Escape') closeLightbox(); });

})();