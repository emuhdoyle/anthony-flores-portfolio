'use strict';
const $ = (query) => document.querySelector(query);
const archive = $('#archive');
const indexPanel = $('#project-index');
const indexList = $('#index-list');
const indexToggle = $('#index-toggle');
const status = $('#live-status');
const mobile = matchMedia('(max-width:760px)');
const reducedMotion = matchMedia('(prefers-reduced-motion:reduce)');
let projects = [];
let tiles = [];
let activeProject = null;
let indexOpen = false;
let focusReturn = null;
let lightboxItemId = null;
let layoutAnimations = [];
const aboutDialog = $('#about-dialog');
const aboutHeader = aboutDialog.querySelector('.dialog-header');
let aboutScrollY = 0;
let aboutScrollAnchor = 0;
let aboutScrollDirection = 0;
let aboutScrollFrame = null;

function revealAboutHeader() {
  aboutHeader.classList.remove('is-hidden');
  aboutScrollY = Math.max(0, aboutDialog.scrollTop);
  aboutScrollAnchor = aboutScrollY;
  aboutScrollDirection = 0;
}

// Hide after scrolling down; a small upward scroll brings navigation back.
aboutDialog.addEventListener('scroll', () => {
  if (aboutScrollFrame !== null) return;
  aboutScrollFrame = requestAnimationFrame(() => {
    aboutScrollFrame = null;
    const maxScroll = Math.max(0, aboutDialog.scrollHeight - aboutDialog.clientHeight);
    const y = Math.max(0, Math.min(aboutDialog.scrollTop, maxScroll));
    const delta = y - aboutScrollY;
    if (!delta) return;
    const direction = Math.sign(delta);
    if (direction !== aboutScrollDirection) {
      aboutScrollAnchor = aboutScrollY;
      aboutScrollDirection = direction;
    }
    if (y <= aboutHeader.offsetHeight) {
      aboutHeader.classList.remove('is-hidden');
    } else if (direction > 0 && y - aboutScrollAnchor >= 24) {
      aboutHeader.classList.add('is-hidden');
    } else if (direction < 0 && aboutScrollAnchor - y >= 12) {
      aboutHeader.classList.remove('is-hidden');
    }
    aboutScrollY = y;
  });
}, {passive:true});
aboutHeader.addEventListener('focusin', revealAboutHeader);

function setHighlight(projectId) {
  activeProject = projectId;
  archive.classList.toggle('has-highlight', !!projectId);
  indexList.classList.toggle('has-highlight', !!projectId);
  tiles.forEach(tile => tile.classList.toggle('highlighted', tile.dataset.project === projectId));
  [...indexList.children].forEach(button => button.classList.toggle('active', button.dataset.project === projectId));
}

function setIndex(open) {
  if (indexOpen === open) return;
  layoutAnimations.forEach(animation => animation.cancel());
  layoutAnimations = [];
  const before = new Map(tiles.map(tile => [tile, tile.getBoundingClientRect()]));
  indexOpen = open;
  document.body.classList.toggle('index-open', open);
  indexToggle.setAttribute('aria-expanded', String(open));
  indexPanel.hidden = !open;
  indexPanel.inert = !open;
  setHighlight(null);
  // FLIP preserves the thumbnail size and animates the new row positions.
  if (!mobile.matches && !reducedMotion.matches) {
    tiles.forEach(tile => {
      const from = before.get(tile);
      const to = tile.getBoundingClientRect();
      const dx = from.left - to.left;
      const dy = from.top - to.top;
      if (Math.abs(dx) < .5 && Math.abs(dy) < .5) return;
      layoutAnimations.push(tile.animate([
        {transform:`translate(${dx}px,${dy}px)`},
        {transform:'translate(0,0)'}
      ], {duration:520,easing:'cubic-bezier(.22,.75,.2,1)'}));
    });
  }
  status.textContent = open ? 'Project index opened.' : 'Project index closed.';
}

function openDialog(dialog) {
  if (dialog.open) return;
  focusReturn = document.activeElement;
  dialog.showModal();
  dialog.scrollTop = 0;
  if (dialog === aboutDialog) revealAboutHeader();
  dialog.querySelector('.close').focus({preventScroll:true});
}

function getImage(item, thumbnail = false) {
  return thumbnail ? item.thumbnail || item.image : item.image;
}

function openLightbox(item) {
  lightboxItemId = item.id;
  const media = $('#lightbox-media');
  const caption = $('#lightbox-caption');
  media.replaceChildren();
  caption.textContent = item.label;
  media.classList.toggle('is-video', item.type === 'video');
  if (item.type === 'video') {
    const player = document.createElement('iframe');
    player.src = item.embedUrl;
    player.title = item.label;
    player.allow = 'autoplay; fullscreen; picture-in-picture';
    player.allowFullscreen = true;
    player.referrerPolicy = 'strict-origin-when-cross-origin';
    media.append(player);
    const link = document.createElement('a');
    link.href = item.videoUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = 'Open video in Google Drive';
    const arrowDocument = new DOMParser().parseFromString("<svg class=\"external-arrow\" aria-hidden=\"true\" focusable=\"false\" width=\"10\" height=\"10\" viewBox=\"0 0 10 10\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"><g clip-path=\"url(#ant-arrow-video-clip)\"><path d=\"M9 8.38462V1H1.61538M9 1L1 9\" stroke-width=\"1.25\" stroke=\"currentColor\"/><rect x=\"8.86133\" y=\"0.375\" width=\"0.765625\" height=\"0.765625\" fill=\"currentColor\"/></g><defs><clipPath id=\"ant-arrow-video-clip\"><rect width=\"10\" height=\"10\" fill=\"currentColor\"/></clipPath></defs></svg>", 'image/svg+xml');
    const arrow = document.importNode(arrowDocument.documentElement, true);
    link.append('\u00a0', arrow);
    caption.append(link);
  } else {
    const source = getImage(item);
    if (!source) return;
    const image = document.createElement('img');
    image.src = source;
    image.alt = item.label;
    media.append(image);
  }
  setHighlight(null);
  openDialog($('#lightbox-dialog'));
}

function stepLightbox(direction) {
  const items = projects.flatMap(project => project.items).filter(item => item.type === 'video' || getImage(item));
  const currentIndex = items.findIndex(item => item.id === lightboxItemId);
  if (currentIndex < 0 || items.length < 2) return;
  openLightbox(items[(currentIndex + direction + items.length) % items.length]);
}

function openProject(projectId) {
  const project = projects.find(p => p.id === projectId);
  if (project?.items.length) openLightbox(project.items[0]);
}

function createTile(item,p) {
  const tile = document.createElement('article');
  tile.className = 'tile';
  tile.dataset.project = p.id;
  tile.dataset.item = item.id;
  const button = document.createElement('button');
  button.className = 'thumbnail';
  button.dataset.frame = item.thumbnailFrame || 'artwork';
  if (item.thumbnailPosition) button.style.setProperty('--thumbnail-position', item.thumbnailPosition);
  const thumbnailBackground = item.thumbnailBackground || p.thumbnailBackground;
  if (thumbnailBackground) button.style.setProperty('--thumbnail-bg', thumbnailBackground);
  button.setAttribute('aria-label',`${item.label}. ${item.type === 'video' ? 'Play film' : 'Enlarge image'}.`);
  button.setAttribute('aria-haspopup','dialog');
  if (item.type === 'video') {
    button.classList.add('video-thumbnail');
    const play = document.createElement('span');
    play.className = 'play-icon';
    play.setAttribute('aria-hidden','true');
    button.append(play);
  }
  const caption = document.createElement('div');
  caption.className = 'caption';
  const id = document.createElement('span');
  id.className = 'item-id';
  id.textContent = `_${p.id}`;
  const name = document.createElement('span');
  name.className = 'item-label';
  name.textContent = `${p.captionPrefix || p.client.toUpperCase()}_${item.captionType || "WORK"}`;
  caption.title = `${item.label} — ${p.title}`;
  caption.append(name,id);
  button.addEventListener('click',() => openLightbox(item));
  button.addEventListener('focus',() => setHighlight(p.id));
  button.addEventListener('blur',() => setHighlight(null));
  tile.addEventListener('pointerenter',e => {if (e.pointerType !== 'touch') setHighlight(p.id);});
  tile.addEventListener('pointerleave',() => {if (activeProject === p.id) setHighlight(null);});
  const source = getImage(item, true);
  if (source) {
    const image = document.createElement('img');
    image.src = source;
    image.alt = '';
    button.prepend(image);
  }
  tile.append(button,caption);
  return tile;
}

function render() {
  tiles = projects.flatMap(p => p.items.map(item => createTile(item,p)));
  archive.replaceChildren(...tiles);
  indexList.replaceChildren(...projects.map(p => {
    const button = document.createElement('button');
    button.className = 'index-item';
    button.dataset.project = p.id;
    button.setAttribute('aria-haspopup','dialog');
    button.append(document.createTextNode(`${p.id} ${p.title}`));
    const discipline = document.createElement('span');
    discipline.className = 'discipline';
    discipline.textContent = p.category;
    button.append(discipline);
    button.addEventListener('pointerenter',e => {if(e.pointerType !== 'touch') setHighlight(p.id);});
    button.addEventListener('pointerleave',() => setHighlight(null));
    button.addEventListener('focus',() => setHighlight(p.id));
    button.addEventListener('blur',() => setHighlight(null));
    button.addEventListener('click',() => openProject(p.id));
    return button;
  }));
}

indexToggle.addEventListener('click',() => setIndex(!indexOpen));
document.querySelectorAll('[data-dialog]').forEach(button => button.addEventListener('click',() => openDialog(document.getElementById(button.dataset.dialog))));
document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click',() => document.getElementById(button.dataset.close).close()));
document.querySelectorAll('dialog').forEach(dialog => dialog.addEventListener('close',() => {
  if (dialog.id === 'lightbox-dialog') {
    $('#lightbox-media').replaceChildren();
    lightboxItemId = null;
  }
  setHighlight(null);
  if(focusReturn?.isConnected) focusReturn.focus({preventScroll:true});
}));
$('#lightbox-dialog').addEventListener('click',e => {
  if (e.target === e.currentTarget || e.target.id === 'lightbox-media' || e.target.classList.contains('lightbox-shell')) e.currentTarget.close();
});
document.addEventListener('keydown',e => {
  if ($('#lightbox-dialog').open && !e.altKey && !e.ctrlKey && !e.metaKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
    e.preventDefault();
    stepLightbox(e.key === 'ArrowRight' ? 1 : -1);
    return;
  }
  if(e.key === 'Escape' && indexOpen && !document.querySelector('dialog[open]')) {
    setIndex(false);indexToggle.focus({preventScroll:true});
  }
});
fetch('projects.json').then(r => {
  if(!r.ok) throw new Error('Unable to load project data');
  return r.json();
}).then(data => {projects=data;render();}).catch(() => {
  archive.innerHTML = '<p class="loading">The work could not load. Please refresh the page.</p>';
  indexToggle.disabled = true;
});
