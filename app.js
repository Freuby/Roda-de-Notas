/* ======================= CONFIG ======================= */
const SUPABASE_URL = "https://tmzrcuxzipzjakbilnmj.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtenJjdXh6aXB6amFrYmlsbm1qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY4NjU1MzYsImV4cCI6MjA1MjQ0MTUzNn0.cQjFnuX6pOJ_-zR0TSSoPPcflIpOccr1fY622YwRUzo";

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
});

/* ======================= STATE ======================= */
const state = {
  loadingAuth: true,
  session: null,
  profile: null,
  profiles: {},        // id -> profile
  authMode: 'login',    // 'login' | 'signup'
  authError: '',
  authBusy: false,

  spaces: [],
  currentSpaceId: null,
  pages: [],
  currentPageId: null,
  blocks: [],
  comments: {},          // block_id -> [comments]
  openComments: new Set(),
  openToggles: new Set(),

  allSongs: null,         // cached list of songs
  songPickerForBlock: null, // block id when picker open
  songPickerQuery: '',

  typeMenu: null,         // {parentId, x, y}
  sidebarOpen: false,
  notifications: [],      // [{id, user_id, block_id, page_id, page_title, content, created_at, seen}]
  notifPanelOpen: false,
  notifTimer: null,
};

const BLOCK_TYPES = [
  { type:'heading', label:'Titre', icon:'H1' },
  { type:'subheading', label:'Sous-titre', icon:'H2' },
  { type:'toggle', label:'Titre dépliant', icon:'▸' },
  { type:'paragraph', label:'Texte', icon:'¶' },
  { type:'bullet', label:'Liste à puces', icon:'•' },
  { type:'numbered', label:'Liste numérotée', icon:'1.' },
  { type:'callout', label:'Encadré', icon:'!' },
  { type:'video', label:'Vidéo YouTube', icon:'▶' },
  { type:'song', label:'Chant (base de données)', icon:'♪' },
  { type:'divider', label:'Séparateur', icon:'—' },
];

const SONG_CATEGORIES = {
  angola:'Angola', saoBentoPequeno:'São Bento Pequeno', saoBentoGrande:'São Bento Grande',
  sambaDeRoda:'Samba de Roda', maculele:'Maculelê', puxadaDeRede:'Puxada de Rede', autre:'Autre'
};

/* ======================= HELPERS ======================= */
const root = document.getElementById('root');
function esc(s){ return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function uid(){ return crypto.randomUUID(); }

function showToast(msg){
  let t = document.querySelector('.toast');
  if(!t){ t = document.createElement('div'); t.className='toast'; document.body.appendChild(t); }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(()=> t.classList.remove('show'), 2200);
}

function extractYoutubeId(url){
  if(!url) return null;
  const patterns = [
    /youtu\.be\/([A-Za-z0-9_-]{6,})/,
    /youtube\.com\/watch\?v=([A-Za-z0-9_-]{6,})/,
    /youtube\.com\/embed\/([A-Za-z0-9_-]{6,})/,
    /youtube\.com\/shorts\/([A-Za-z0-9_-]{6,})/
  ];
  for(const p of patterns){ const m = url.match(p); if(m) return m[1]; }
  return null;
}

function normalize(s){
  return (s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
}

function fmtDate(iso){
  if(!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', {day:'numeric', month:'short'}) + ' à ' + d.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'});
}

function profileName(id){
  const p = state.profiles[id];
  if(!p) return 'Inconnu';
  const n = [p.first_name, p.last_name].filter(Boolean).join(' ').trim();
  if(n) return n;
  if(p.email) return p.email.split('@')[0];
  return 'Inconnu';
}

/* ======================= AUTH ======================= */
sb.auth.onAuthStateChange((event, session)=>{
  const hadSession = !!state.session;
  state.session = session;
  state.loadingAuth = false;
  if(session && !hadSession){
    bootstrapAfterLogin();
  } else if(!session && hadSession){
    state.spaces=[]; state.currentSpaceId=null; state.pages=[]; state.currentPageId=null; state.blocks=[];
    render();
  }
  // other events (TOKEN_REFRESHED, USER_UPDATED, etc.) just update the session silently
});

async function bootstrapAfterLogin(){
  await Promise.all([loadProfiles(), loadSpaces()]);
  await loadNotifications();
  startNotifPolling();
  render();
}

async function loadNotifications(){
  const meId = state.session.user.id;
  // get all comments not written by me, across all pages
  const { data: comments, error } = await sb
    .from('comments')
    .select('id, block_id, content, created_at, user_id, seen_by')
    .neq('user_id', meId)
    .order('created_at', {ascending: false})
    .limit(50);
  if(error || !comments) return;

  // get page info for each block
  const blockIds = [...new Set(comments.map(c=>c.block_id))];
  if(!blockIds.length){ state.notifications=[]; return; }

  const { data: blocks } = await sb.from('blocks').select('id, page_id').in('id', blockIds);
  const pageIds = [...new Set((blocks||[]).map(b=>b.page_id))];
  const { data: pages } = await sb.from('pages').select('id, title').in('id', pageIds);

  const blockToPage = {};
  (blocks||[]).forEach(b=> blockToPage[b.id] = b.page_id);
  const pageMap = {};
  (pages||[]).forEach(p=> pageMap[p.id] = p.title);

  state.notifications = comments.map(c=>({
    ...c,
    page_id: blockToPage[c.block_id],
    page_title: pageMap[blockToPage[c.block_id]] || 'Cours inconnu',
    seen: (c.seen_by||[]).includes(meId),
  }));
}

function startNotifPolling(){
  if(state.notifTimer) clearInterval(state.notifTimer);
  state.notifTimer = setInterval(async ()=>{
    const prevUnseen = state.notifications.filter(n=>!n.seen).length;
    await loadNotifications();
    const newUnseen = state.notifications.filter(n=>!n.seen).length;
    if(newUnseen > prevUnseen) render(); // re-render badge
    else if(newUnseen !== prevUnseen) render();
  }, 30000);
}

async function markAllSeen(){
  const meId = state.session.user.id;
  const unseenIds = state.notifications.filter(n=>!n.seen).map(n=>n.id);
  if(!unseenIds.length) return;
  // update seen_by for each
  await sb.rpc('mark_comments_seen', { comment_ids: unseenIds, user_id: meId }).then(()=>{});
  // fallback: update one by one if rpc not available
  for(const id of unseenIds){
    const c = state.notifications.find(n=>n.id===id);
    const newSeen = [...new Set([...(c.seen_by||[]), meId])];
    await sb.from('comments').update({seen_by: newSeen}).eq('id', id);
  }
  state.notifications.forEach(n=> n.seen = true);
  render();
}

async function goToNotification(notif){
  // mark seen
  const meId = state.session.user.id;
  const newSeen = [...new Set([...(notif.seen_by||[]), meId])];
  await sb.from('comments').update({seen_by: newSeen}).eq('id', notif.id);
  notif.seen = true;
  state.notifPanelOpen = false;

  // navigate to the right space/page
  if(notif.page_id){
    const { data: page } = await sb.from('pages').select('space_id').eq('id', notif.page_id).single();
    if(page){
      await selectSpace(page.space_id);
      await selectPage(notif.page_id);
      // open comment section for that block
      state.openComments.add(notif.block_id);
    }
  }
  render();
}

function renderNotifPanel(){
  const notifs = state.notifications;
  const unseenCount = notifs.filter(n=>!n.seen).length;
  return `<div class="notif-panel">
    <div class="notif-head">
      <span>Commentaires récents</span>
      ${unseenCount ? `<button class="notif-mark-all" data-mark-all-seen="1">Tout marquer lu</button>` : '<span style="color:var(--muted);font-weight:400;font-size:11px;">Tout lu ✓</span>'}
    </div>
    <div class="notif-list">
      ${notifs.length ? notifs.map(n=>`
        <div class="notif-item ${n.seen?'':'unseen'}" data-goto-notif="${n.id}">
          <div class="ni-who">${esc(profileName(n.user_id))} <span style="font-weight:400;color:var(--muted)">${fmtDate(n.created_at)}</span></div>
          <div class="ni-where">📄 ${esc(n.page_title)}</div>
          <div class="ni-text">« ${esc((n.content||'').substring(0,80))}${(n.content||'').length>80?'…':''} »</div>
        </div>
      `).join('') : `<div class="notif-empty">Aucun commentaire de vos collègues pour l'instant.</div>`}
    </div>
  </div>`;
}

async function loadProfiles(){
  const { data, error } = await sb.from('profiles').select('id,first_name,last_name,email');
  if(!error && data){
    state.profiles = {};
    data.forEach(p=> state.profiles[p.id] = p);
    state.profile = state.profiles[state.session.user.id] || null;
  }
}

async function doSignIn(email, password){
  state.authBusy = true; state.authError=''; render();
  const { error } = await sb.auth.signInWithPassword({ email, password });
  state.authBusy = false;
  if(error){ state.authError = traduireErreur(error.message); render(); }
}

async function doSignUp(email, password, first_name, last_name){
  state.authBusy = true; state.authError=''; render();
  try{
    const { data, error } = await sb.auth.signUp({
      email, password,
      options: { data: { first_name, last_name } }
    });
    state.authBusy = false;
    if(error){ state.authError = traduireErreur(error.message); render(); return; }
    if(data && data.session){
      // signed in immediately (no email confirmation required)
      return;
    }
    state.authError = '__confirm__';
    render();
  } catch(err){
    state.authBusy = false;
    state.authError = 'Erreur: ' + (err && err.message ? err.message : String(err));
    render();
  }
}

function traduireErreur(msg){
  if(/already registered/i.test(msg)) return 'Un compte existe déjà avec cet e-mail.';
  if(/invalid login credentials/i.test(msg)) return 'E-mail ou mot de passe incorrect.';
  if(/password should be/i.test(msg)) return 'Le mot de passe doit contenir au moins 6 caractères.';
  if(/rate limit/i.test(msg)) return 'Trop de tentatives, réessayez dans un instant.';
  return msg;
}

async function doSignOut(){
  await sb.auth.signOut();
}

/* ======================= DATA: SPACES ======================= */
async function loadSpaces(){
  const { data, error } = await sb.from('spaces').select('*').order('order_index',{ascending:true}).order('created_at',{ascending:true});
  if(error){ showToast('Erreur de chargement des espaces'); return; }
  state.spaces = data || [];
  if(!state.currentSpaceId && state.spaces.length){
    state.currentSpaceId = state.spaces[0].id;
  }
  if(state.currentSpaceId){
    await loadPages(state.currentSpaceId);
  }
}

async function createSpace(){
  const name = prompt('Nom du nouvel espace (ex : Année 2026-2027)');
  if(!name || !name.trim()) return;
  const maxOrder = state.spaces.reduce((m,s)=>Math.max(m, s.order_index||0), -1);
  const { data, error } = await sb.from('spaces').insert({ name: name.trim(), created_by: state.session.user.id, order_index: maxOrder+1 }).select().single();
  if(error){ showToast('Impossible de créer l’espace'); return; }
  state.spaces.push(data);
  state.currentSpaceId = data.id;
  state.pages = []; state.currentPageId = null; state.blocks=[];
  render();
}

async function selectSpace(id){
  if(state.currentSpaceId === id) return;
  state.currentSpaceId = id;
  state.currentPageId = null;
  state.blocks = [];
  state.pages = [];
  render();
  await loadPages(id);
  render();
}

async function renameSpace(space){
  const name = prompt('Renommer cet espace', space.name);
  if(!name || !name.trim() || name===space.name) return;
  space.name = name.trim();
  render();
  await sb.from('spaces').update({name:space.name}).eq('id', space.id);
}

/* ======================= DATA: PAGES ======================= */
async function loadPages(spaceId){
  const { data, error } = await sb.from('pages').select('*').eq('space_id', spaceId).order('order_index',{ascending:true}).order('created_at',{ascending:true});
  if(error){ showToast('Erreur de chargement des cours'); return; }
  state.pages = data || [];
  if(state.pages.length && !state.currentPageId){
    await selectPage(state.pages[0].id, true);
  }
}

async function createPage(){
  if(!state.currentSpaceId) return;
  const maxOrder = state.pages.reduce((m,p)=>Math.max(m,p.order_index||0), -1);
  const title = 'Nouveau cours';
  const { data, error } = await sb.from('pages').insert({
    space_id: state.currentSpaceId, title, created_by: state.session.user.id, order_index: maxOrder+1
  }).select().single();
  if(error){ showToast('Impossible de créer le cours'); return; }
  state.pages.push(data);
  await selectPage(data.id);
}

async function selectPage(id, skipRender){
  state.currentPageId = id;
  state.blocks = [];
  state.comments = {};
  if(!skipRender) render();
  await loadBlocks(id);
  render();
}

async function deletePage(page){
  if(!confirm(`Supprimer le cours « ${page.title} » et tout son contenu ?\n\nCette action est irréversible.`)) return;
  const { data: blocks } = await sb.from('blocks').select('id').eq('page_id', page.id);
  const ids = (blocks||[]).map(b=>b.id);
  if(ids.length){
    await sb.from('comments').delete().in('block_id', ids);
    await sb.from('blocks').delete().eq('page_id', page.id);
  }
  await sb.from('pages').delete().eq('id', page.id);
  state.pages = state.pages.filter(p=>p.id!==page.id);
  if(state.currentPageId === page.id){
    state.currentPageId = null; state.blocks=[];
    if(state.pages.length) await selectPage(state.pages[0].id, true);
  }
  render();
}

async function movePage(page, dir){
  const idx = state.pages.findIndex(p=>p.id===page.id);
  const swapIdx = idx + dir;
  if(swapIdx<0 || swapIdx>=state.pages.length) return;
  const other = state.pages[swapIdx];
  const a = page.order_index||0, b = other.order_index||0;
  page.order_index = b; other.order_index = a;
  [state.pages[idx], state.pages[swapIdx]] = [state.pages[swapIdx], state.pages[idx]];
  render();
  await sb.from('pages').update({order_index:page.order_index}).eq('id',page.id);
  await sb.from('pages').update({order_index:other.order_index}).eq('id',other.id);
}

function updatePageTitle(page, title){
  page.title = title;
  clearTimeout(page._t);
  page._t = setTimeout(()=> savePageTitleNow(page), 500);
}

async function savePageTitleNow(page){
  clearTimeout(page._t);
  const { error } = await sb.from('pages').update({title: page.title}).eq('id', page.id);
  if(error){ console.error('save page title error', error); showToast('Erreur de sauvegarde du titre: ' + error.message); }
}

/* ======================= DATA: BLOCKS ======================= */
async function loadBlocks(pageId){
  const { data, error } = await sb.from('blocks').select('*').eq('page_id', pageId).order('order_index',{ascending:true});
  if(error){ showToast('Erreur de chargement du contenu'); return; }
  state.blocks = data || [];
  await loadComments();
}

async function loadComments(){
  const ids = state.blocks.map(b=>b.id);
  state.comments = {};
  if(!ids.length) return;
  const { data, error } = await sb.from('comments').select('*').in('block_id', ids).order('created_at',{ascending:true});
  if(error) return;
  (data||[]).forEach(c=>{
    if(!state.comments[c.block_id]) state.comments[c.block_id]=[];
    state.comments[c.block_id].push(c);
  });
}

function siblingBlocks(parentId){
  return state.blocks.filter(b=> (b.parent_block_id||null) === (parentId||null)).sort((a,b)=>a.order_index-b.order_index);
}

async function addBlock(type, parentId){
  const siblings = siblingBlocks(parentId);
  const maxOrder = siblings.reduce((m,b)=>Math.max(m,b.order_index||0), -1);
  let content = {};
  if(type==='video') content = {url:'', caption:''};
  if(type==='song') content = {};
  if(type==='callout') content = {text:'', emoji:'💡'};
  if(['heading','subheading','paragraph','bullet','numbered','toggle'].includes(type)) content = {text:''};

  const row = {
    page_id: state.currentPageId,
    type, content,
    parent_block_id: parentId || null,
    order_index: maxOrder+1,
    created_by: state.session.user.id
  };
  const { data, error } = await sb.from('blocks').insert(row).select().single();
  if(error){ showToast('Impossible d’ajouter ce bloc'); return; }
  state.blocks.push(data);
  if(type==='toggle') state.openToggles.add(data.id);
  if(type==='song'){ state.songPickerForBlock = data.id; state.songPickerQuery=''; ensureSongsLoaded().then(render); }
  state.typeMenu = null;
  render();
  if(type!=='song'){
    setTimeout(()=>{
      const el = document.querySelector(`[data-block-id="${data.id}"] .block-content[contenteditable="true"]`);
      if(el) el.focus();
    }, 30);
  }
}

async function updateBlockContent(block, patch, opts){
  block.content = Object.assign({}, block.content, patch);
  if(!opts || !opts.skipSave){
    clearTimeout(block._t);
    block._t = setTimeout(()=>{ saveBlockNow(block); }, opts && opts.delay!=null ? opts.delay : 450);
  }
}

async function saveBlockNow(block){
  clearTimeout(block._t);
  const { error } = await sb.from('blocks').update({content: block.content, updated_at: new Date().toISOString()}).eq('id', block.id);
  if(error){ console.error('save block error', error); showToast('Erreur de sauvegarde: ' + error.message); }
}

async function deleteBlock(block){
  const children = state.blocks.filter(b=>b.parent_block_id===block.id);
  const msg = children.length
    ? `Supprimer ce bloc et ses ${children.length} élément(s) enfant(s) ? Cette action est irréversible.`
    : 'Supprimer ce bloc ? Cette action est irréversible.';
  if(!confirm(msg)) return;
  // delete children recursively
  const toDelete = [block.id];
  const collectChildren = (pid)=>{
    state.blocks.filter(b=>b.parent_block_id===pid).forEach(c=>{ toDelete.push(c.id); collectChildren(c.id); });
  };
  collectChildren(block.id);
  await sb.from('comments').delete().in('block_id', toDelete);
  await sb.from('blocks').delete().in('id', toDelete);
  state.blocks = state.blocks.filter(b=>!toDelete.includes(b.id));
  render();
}

async function moveBlock(block, dir){
  const siblings = siblingBlocks(block.parent_block_id);
  const idx = siblings.findIndex(b=>b.id===block.id);
  const swapIdx = idx+dir;
  if(swapIdx<0 || swapIdx>=siblings.length) return;
  const other = siblings[swapIdx];
  const a = block.order_index, b = other.order_index;
  block.order_index = b; other.order_index = a;
  render();
  await sb.from('blocks').update({order_index:block.order_index}).eq('id',block.id);
  await sb.from('blocks').update({order_index:other.order_index}).eq('id',other.id);
}

async function toggleLock(page){
  page.locked = !page.locked;
  render();
  const { error } = await sb.from('pages').update({locked: page.locked}).eq('id', page.id);
  if(error){ showToast('Erreur de sauvegarde du verrou'); page.locked = !page.locked; render(); }
}

function toggleOpen(id){
  if(state.openToggles.has(id)) state.openToggles.delete(id);
  else state.openToggles.add(id);
  render();
}

/* ======================= SONGS ======================= */
async function ensureSongsLoaded(){
  if(state.allSongs) return;
  try{
    const { data, error } = await sb.from('songs').select('id,title,category,mnemonic,lyrics,mediaLink').order('title',{ascending:true});
    if(error){ console.error('songs load error', error); showToast('Erreur de chargement des chants: ' + error.message); state.allSongs = []; return; }
    state.allSongs = data || [];
  } catch(err){
    console.error('songs load exception', err);
    showToast('Erreur de chargement des chants');
    state.allSongs = [];
  }
}

async function chooseSong(block, song){
  await updateBlockContent(block, {
    song_id: song.id, title: song.title, category: song.category,
    mnemonic: song.mnemonic, lyrics: song.lyrics, mediaLink: song.mediaLink
  }, {skipSave:true});
  await saveBlockNow(block);
  state.songPickerForBlock = null;
  document.querySelectorAll('body > .menu-overlay').forEach(o=>o.remove());
  render();
}

/* ======================= COMMENTS ======================= */
function toggleComments(blockId){
  if(state.openComments.has(blockId)) state.openComments.delete(blockId);
  else state.openComments.add(blockId);
  render();
}

async function addComment(blockId, text){
  if(!text.trim()) return;
  const { data, error } = await sb.from('comments').insert({
    block_id: blockId, user_id: state.session.user.id, content: text.trim()
  }).select().single();
  if(error){ showToast('Impossible d’envoyer le commentaire'); return; }
  if(!state.comments[blockId]) state.comments[blockId]=[];
  state.comments[blockId].push(data);
  render();
}

async function deleteComment(blockId, comment){
  await sb.from('comments').delete().eq('id', comment.id);
  state.comments[blockId] = (state.comments[blockId]||[]).filter(c=>c.id!==comment.id);
  render();
}

/* ======================= RENDER ======================= */
function render(){
  if(state.loadingAuth){ root.innerHTML = `<div class="auth-loading">Chargement de la roda…</div>`; return; }
  if(!state.session){ root.innerHTML = renderAuth(); attachAuthEvents(); return; }
  root.innerHTML = renderApp();
  attachAppEvents();
}

/* ---- AUTH SCREEN ---- */
function renderAuth(){
  const isSignup = state.authMode==='signup';
  const confirmMsg = state.authError === '__confirm__';
  return `
  <div class="auth-screen">
    <div class="auth-card">
      <div class="roda-mark">🪘</div>
      <h1 class="auth-title">Roda de Notas</h1>
      <p class="auth-sub">${isSignup ? 'Créez votre compte enseignant·e' : 'Connectez-vous pour ouvrir le cahier'}</p>
      ${confirmMsg ? `<div class="auth-error" style="background:var(--green-soft); color:var(--green);">Compte créé ! Vérifiez votre e-mail pour confirmer, puis connectez-vous.</div>` : ''}
      ${(state.authError && !confirmMsg) ? `<div class="auth-error">${esc(state.authError)}</div>` : ''}
      <form id="auth-form">
        ${isSignup ? `
        <div class="auth-row2">
          <div class="auth-field"><label>Prénom</label><input name="first_name" required></div>
          <div class="auth-field"><label>Nom</label><input name="last_name"></div>
        </div>` : ''}
        <div class="auth-field"><label>E-mail</label><input type="email" name="email" required autocomplete="email"></div>
        <div class="auth-field"><label>Mot de passe</label><input type="password" name="password" required minlength="6" autocomplete="${isSignup?'new-password':'current-password'}"></div>
        <button class="auth-submit" type="submit" ${state.authBusy?'disabled':''}>${state.authBusy ? 'Patientez…' : (isSignup ? 'Créer le compte' : 'Se connecter')}</button>
      </form>
      <div class="auth-switch">
        ${isSignup ? 'Déjà un compte ?' : 'Pas encore de compte ?'}
        <button data-switch>${isSignup ? 'Se connecter' : 'Créer un compte'}</button>
      </div>
    </div>
  </div>`;
}

function attachAuthEvents(){
  const form = document.getElementById('auth-form');
  form.addEventListener('submit', e=>{
    e.preventDefault();
    const fd = new FormData(form);
    const email = fd.get('email'), password = fd.get('password');
    if(state.authMode==='signup'){
      doSignUp(email, password, (fd.get('first_name')||'').trim(), (fd.get('last_name')||'').trim());
    } else {
      doSignIn(email, password);
    }
  });
  document.querySelector('[data-switch]').addEventListener('click', ()=>{
    state.authMode = state.authMode==='signup' ? 'login' : 'signup';
    state.authError='';
    render();
  });
}

/* ---- APP SHELL ---- */
function renderApp(){
  const space = state.spaces.find(s=>s.id===state.currentSpaceId);
  const page = state.pages.find(p=>p.id===state.currentPageId);
  return `
  <div class="app">
  <div class="topbar">
    <button class="hamburger" data-toggle-sidebar="1">☰</button>
    <div class="brand">🪘 Roda de Notas</div>
  </div>
  <div class="sidebar-backdrop ${state.sidebarOpen?'show':''}" data-close-sidebar></div>
  <div class="sidebar ${state.sidebarOpen?'open':''}">
    <div class="sidebar-header">
      <div class="brand"><span class="roda-mark">🪘</span> Roda de Notas</div>
    </div>
    <div class="sidebar-section spaces">
      <p class="section-label">Espaces</p>
      ${state.spaces.map(s=>`
        <div class="space-row ${s.id===state.currentSpaceId?'active':''}" data-select-space="${s.id}" data-rename-space="${s.id}">
          <div class="space-dot">${esc(initials(s.name))}</div>
          <div class="space-name">${esc(s.name)}</div>
        </div>
      `).join('')}
      <button class="add-link" data-create-space="1">＋ Nouvel espace</button>
    </div>
    <div class="sidebar-section pages">
      <p class="section-label">${space ? esc(space.name) : 'Cours'}</p>
      ${state.pages.map((p,i)=>`
        <div class="page-row ${p.id===state.currentPageId?'active':''}" data-select-page="${p.id}">
          <span class="ptitle">${esc(p.title || 'Sans titre')}</span>
          <span class="pmove">
            <button class="icon-btn lock-btn ${p.locked?'locked':''}" data-toggle-lock="${p.id}" title="${p.locked?'Déverrouiller':'Verrouiller'}">${p.locked?'🔒':'🔓'}</button>
            <button class="icon-btn" data-move-page="${p.id}" data-dir="-1" title="Monter">▲</button>
            <button class="icon-btn" data-move-page="${p.id}" data-dir="1" title="Descendre">▼</button>
            <button class="icon-btn" data-delete-page="${p.id}" title="Supprimer">✕</button>
          </span>
        </div>
      `).join('')}
      ${state.currentSpaceId ? `<button class="add-link" data-create-page="1">＋ Nouveau cours</button>` : ''}
    </div>
    <div class="sidebar-footer">
      <span class="who">${esc(profileName(state.session.user.id))}</span>
      <button class="notif-btn ${state.notifications.filter(n=>!n.seen).length ? 'has' : ''}" data-notif-panel="1" title="Commentaires récents">
        💬${state.notifications.filter(n=>!n.seen).length ? `<span class="notif-badge">${state.notifications.filter(n=>!n.seen).length}</span>` : ''}
      </button>
      <button class="signout" data-signout="1">Déconnexion</button>
    </div>
    ${state.notifPanelOpen ? renderNotifPanel() : ''}
  </div>
  <div class="main">
    <div class="main-inner">
      ${page ? renderPage(page) : renderEmptyState()}
    </div>
  </div>
  ${state.typeMenu ? renderTypeMenu() : ''}
  </div>
  `;
}

function initials(name){
  return (name||'').trim().split(/\\s+/).map(w=>w[0]).slice(0,2).join('').toUpperCase() || '?';
}

function renderEmptyState(){
  if(!state.spaces.length){
    return `<div class="empty-state">
      <div class="roda-mark">🪘</div>
      <h2 class="font-display">Bem-vindo !</h2>
      <p>Créez votre premier espace pour commencer à noter vos cours.</p>
      <button class="add-block-btn" style="width:auto;" data-create-space="1">＋ Créer un espace</button>
    </div>`;
  }
  return `<div class="empty-state">
    <div class="roda-mark">🪘</div>
    <h2 class="font-display">Aucun cours pour l'instant</h2>
    <p>Créez une fiche pour noter votre prochaine séance.</p>
    <button class="add-block-btn" style="width:auto;" data-create-page="1">＋ Nouveau cours</button>
  </div>`;
}

/* ---- PAGE ---- */
function renderPage(page){
  const locked = !!page.locked;
  const topBlocks = siblingBlocks(null);
  return `
    <input class="page-title" value="${esc(page.title||'')}" placeholder="Titre du cours" data-page-title="${page.id}" ${locked?'readonly style="cursor:default"':''}>
    <p class="page-meta">Modifié le ${fmtDate(page.updated_at)} · espace « ${esc((state.spaces.find(s=>s.id===page.space_id)||{}).name||'')} »</p>
    ${locked ? `
      <div class="page-locked-banner">
        🔒 Ce cours est verrouillé — consultation uniquement.
        <button data-toggle-lock="${page.id}">Déverrouiller</button>
      </div>` : ''}
    <div class="blocks-list">
      ${topBlocks.map(b=>renderBlock(b, 0, locked)).join('')}
    </div>
    ${!locked ? `<div class="add-block-zone">
      <button class="add-block-btn" data-add-root="1">＋ Ajouter un bloc</button>
    </div>` : ''}
  `;
}

/* ---- BLOCK RENDER ---- */
function renderBlock(block, depth, locked){
  const siblings = siblingBlocks(block.parent_block_id);
  const idx = siblings.findIndex(b=>b.id===block.id);
  const canUp = idx>0, canDown = idx<siblings.length-1;
  const controls = locked ? '' : `
    <div class="block-controls">
      ${renderCommentToggle(block)}
      <button class="icon-btn" data-move="${block.id}" data-dir="-1" ${canUp?'':'disabled style="opacity:.25"'} title="Monter">▲</button>
      <button class="icon-btn" data-move="${block.id}" data-dir="1" ${canDown?'':'disabled style="opacity:.25"'} title="Descendre">▼</button>
      <button class="icon-btn" data-delete-block="${block.id}" title="Supprimer">🗑</button>
    </div>`;

  let inner = '';
  const c = block.content || {};

  switch(block.type){
    case 'heading':
    case 'subheading':
    case 'paragraph':
      inner = `<div class="block-content" ${locked?'':'contenteditable="true"'} data-field="text" data-placeholder="${block.type==='heading'?'Titre…':block.type==='subheading'?'Sous-titre…':'Écrivez quelque chose…'}">${esc(c.text||'')}</div>`;
      break;
    case 'bullet': {
      inner = `<span class="marker">•</span><div class="block-content" ${locked?'':'contenteditable="true"'} data-field="text" data-placeholder="Élément de liste…">${esc(c.text||'')}</div>`;
      break;
    }
    case 'numbered': {
      const num = idx+1;
      inner = `<span class="marker">${num}.</span><div class="block-content" ${locked?'':'contenteditable="true"'} data-field="text" data-placeholder="Élément de liste…">${esc(c.text||'')}</div>`;
      break;
    }
    case 'callout':
      inner = `<span class="callout-icon">${esc(c.emoji||'💡')}</span><div class="block-content" ${locked?'':'contenteditable="true"'} data-field="text" data-placeholder="Note importante…">${esc(c.text||'')}</div>`;
      break;
    case 'divider':
      inner = `<hr>`;
      break;
    case 'video':
      inner = renderVideoBlock(block, c, locked);
      break;
    case 'song':
      inner = renderSongBlock(block, c, locked);
      break;
    case 'toggle':
      return renderToggleBlock(block, c, depth, controls, locked);
  }

  const blockClass = `block b-${block.type}`;
  const rowExtra = block.type==='callout' ? '' : '';
  let html = `<div class="${blockClass}" data-block-id="${block.id}" data-type="${block.type}">
    <div class="block-row">
      ${inner}
      ${controls}
    </div>
    ${renderCommentPanel(block)}
  </div>`;
  return html;
}

function renderToggleBlock(block, c, depth, controls, locked){
  const isOpen = state.openToggles.has(block.id);
  const children = siblingBlocks(block.id);
  return `<div class="block b-toggle ${isOpen?'open':'collapsed'}" data-block-id="${block.id}" data-type="toggle">
    <div class="block-row">
      <div class="toggle-head">
        <button class="toggle-caret" data-toggle="${block.id}">
          <svg width="10" height="10" viewBox="0 0 10 10"><path d="M2 1 L8 5 L2 9" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
        <div class="block-content" ${locked?'':'contenteditable="true"'} data-field="text" data-placeholder="Titre dépliant…">${esc(c.text||'')}</div>
      </div>
      ${controls}
    </div>
    ${renderCommentPanel(block)}
    <div class="toggle-children ${isOpen?'':'hidden'}">
      ${children.map(ch=>renderBlock(ch, depth+1, locked)).join('')}
      ${!locked ? `<button class="toggle-add" data-add-child="${block.id}">＋ Ajouter un élément ici</button>` : ''}
    </div>
  </div>`;
}

function renderVideoBlock(block, c, locked){
  const ytId = extractYoutubeId(c.url);
  return `<div class="video-wrap">
    ${!locked ? `<input class="video-url-input" data-field="url" placeholder="Collez un lien YouTube…" value="${esc(c.url||'')}">` : ''}
    ${ytId ? `
      <div class="video-frame"><iframe src="https://www.youtube.com/embed/${ytId}" title="Vidéo YouTube" allowfullscreen></iframe></div>
      <p style="margin:6px 0 0;"><a href="https://www.youtube.com/watch?v=${ytId}" target="_blank" rel="noopener" style="color:var(--terracotta); font-size:12.5px;">↗ Regarder sur YouTube (si la vidéo ne s'affiche pas ci-dessus)</a></p>
    ` : c.url ? `
      <div class="video-frame"><div class="video-placeholder">Lien non reconnu comme vidéo YouTube</div></div>
    ` : (!locked ? '' : '')}
    ${!locked ? `<div class="video-caption" contenteditable="true" data-field="caption" data-placeholder="Légende (optionnel)…">${esc(c.caption||'')}</div>` :
      (c.caption ? `<div class="video-caption">${esc(c.caption)}</div>` : '')}
  </div>`;
}

function renderSongBlock(block, c, locked){
  if(!c.song_id){
    if(locked) return `<div class="song-empty"><span>♪ Aucun chant sélectionné</span></div>`;
    return `<div class="song-empty">
      <span>♪ Aucun chant sélectionné</span>
      <button class="pick-song-btn" data-pick-song="${block.id}">Choisir un chant</button>
    </div>`;
  }
  const isOpen = state.openComments.has('song-open-'+block.id);
  return `<div class="song-card">
    <div class="song-head" data-song-toggle="${block.id}">
      <div class="song-note">♪</div>
      <div class="song-title">${esc(c.title||'Sans titre')}</div>
      <div class="song-cat">${esc(SONG_CATEGORIES[c.category]||c.category||'')}</div>
      ${!locked ? `<button class="icon-btn" data-pick-song="${block.id}" title="Changer de chant">⇄</button>` : ''}
    </div>
    <div class="song-body ${isOpen?'open':''}">
      ${c.lyrics ? `<div class="song-lyrics">${esc(c.lyrics)}</div>` : `<p style="color:var(--muted); font-size:13px;">Pas de paroles enregistrées.</p>`}
      ${c.mnemonic ? `<div class="song-mnemonic">💭 ${esc(c.mnemonic)}</div>` : ''}
      ${c.mediaLink ? `<p style="margin-top:8px;"><a href="${esc(c.mediaLink)}" target="_blank" rel="noopener" style="color:var(--terracotta); font-size:13px;">🔗 Écouter / regarder</a></p>` : ''}
    </div>
  </div>`;
}

/* ---- COMMENTS ---- */
function renderCommentToggle(block){
  const comments = state.comments[block.id]||[];
  return `<button class="comment-toggle ${comments.length?'has':''}" data-comment-toggle="${block.id}" title="Commentaires">💬${comments.length ? ' '+comments.length : ''}</button>`;
}
function renderCommentPanel(block){
  const comments = state.comments[block.id]||[];
  const isOpen = state.openComments.has(block.id);
  if(!isOpen) return '';
  const meId = state.session.user.id;
  return `
    <div class="comments-panel">
      ${comments.map(c=>`
        <div class="comment-item">
          <span class="comment-author">${esc(profileName(c.user_id))}</span>
          <span class="comment-date">${fmtDate(c.created_at)}</span>
          ${c.user_id===meId?`<button class="comment-del" data-delete-comment="${block.id}|${c.id}">supprimer</button>`:''}
          <div class="comment-text">${esc(c.content)}</div>
        </div>
      `).join('') || `<p style="font-size:12.5px; color:var(--muted); margin:0 0 6px;">Aucun commentaire pour l'instant.</p>`}
      <form class="comment-form" data-comment-form="${block.id}">
        <input class="comment-input" placeholder="Ajouter un commentaire…" autocomplete="off">
        <button class="comment-send" type="submit">Envoyer</button>
      </form>
    </div>
  `;
}

/* ---- TYPE MENU ---- */
function renderTypeMenu(){
  const {x,y} = state.typeMenu;
  return `<div class="menu-overlay" data-close-menu="1">
    <div class="type-menu" style="left:${x}px; top:${y}px;">
      ${BLOCK_TYPES.map(t=>`
        <button data-pick-type="${t.type}"><span class="ti">${t.icon}</span>${t.label}</button>
      `).join('')}
    </div>
  </div>`;
}

/* ---- SONG PICKER MODAL (rendered separately, appended to body) ---- */
function renderSongPicker(){
  if(!state.songPickerForBlock) return '';
  const q = normalize(state.songPickerQuery);
  const songs = (state.allSongs||[]).filter(s=> !q || normalize(s.title).includes(q) || normalize(s.lyrics).includes(q) || normalize(s.mnemonic).includes(q));
  return `
  <div class="menu-overlay" style="display:flex; align-items:center; justify-content:center; background:rgba(43,36,32,.35);" data-close-song-picker="1">
    <div style="background:var(--surface); border-radius:14px; width:min(520px, 92vw); max-height:80vh; display:flex; flex-direction:column; overflow:hidden; border:1px solid var(--border);" onclick="event.stopPropagation()">
      <div style="padding:16px 18px; border-bottom:1px solid var(--border);">
        <h3 style="margin:0 0 10px; font-size:17px;">Choisir un chant</h3>
        <input id="song-search" class="comment-input" style="width:100%;" placeholder="Rechercher un titre, des paroles…" value="${esc(state.songPickerQuery)}" autofocus>
      </div>
      <div style="overflow-y:auto; padding:8px;">
        ${state.allSongs===null ? `<p style="padding:16px; color:var(--muted);">Chargement des chants…</p>` :
          songs.length ? songs.map(s=>`
            <button data-choose-song="${s.id}" style="display:flex; align-items:center; gap:10px; width:100%; text-align:left; background:none; border:none; padding:10px 12px; border-radius:8px; font-size:14px;">
              <span class="song-note" style="width:24px;height:24px;font-size:12px;">♪</span>
              <span style="flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${esc(s.title)}</span>
              <span class="song-cat">${esc(SONG_CATEGORIES[s.category]||s.category||'')}</span>
            </button>
          `).join('') : `<p style="padding:16px; color:var(--muted);">Aucun chant trouvé.</p>`}
      </div>
      <div style="padding:10px 18px; border-top:1px solid var(--border); text-align:right;">
        <button class="icon-btn" data-close-song-picker="1" style="font-size:13px; padding:6px 10px;">Fermer</button>
      </div>
    </div>
  </div>`;
}

/* ======================= EVENTS ======================= */
function attachAppEvents(){
  // song picker overlay (separate from main render to allow live search)
  if(state.songPickerForBlock){
    document.querySelectorAll('body > .menu-overlay').forEach(o=>o.remove());
    const wrap = document.createElement('div');
    wrap.innerHTML = renderSongPicker();
    const overlay = wrap.querySelector('.menu-overlay');
    document.body.appendChild(overlay);
    overlay.addEventListener('click', (e)=>{
      if(e.target.dataset.closeSongPicker!==undefined){ state.songPickerForBlock=null; render(); }
    });
    const search = overlay.querySelector('#song-search');
    if(search){
      search.addEventListener('input', (e)=>{ state.songPickerQuery = e.target.value; refreshSongPickerList(); });
    }
    overlay.querySelectorAll('[data-choose-song]').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const song = state.allSongs.find(s=>s.id===btn.dataset.chooseSong);
        const block = state.blocks.find(b=>b.id===state.songPickerForBlock);
        if(song && block) chooseSong(block, song);
      });
    });
  }

  // topbar
  const ham = document.querySelector('[data-toggle-sidebar]');
  if(ham) ham.addEventListener('click', ()=>{ state.sidebarOpen=!state.sidebarOpen; render(); });
  const backdrop = document.querySelector('[data-close-sidebar]');
  if(backdrop) backdrop.addEventListener('click', ()=>{ state.sidebarOpen=false; state.notifPanelOpen=false; render(); });

  // spaces
  document.querySelectorAll('[data-select-space]').forEach(el=>{
    el.addEventListener('click', (e)=>{
      if(e.detail===2) return;
      selectSpace(el.dataset.selectSpace);
      state.sidebarOpen=false;
    });
    el.addEventListener('dblclick', ()=>{
      const space = state.spaces.find(s=>s.id===el.dataset.renameSpace);
      if(space) renameSpace(space);
    });
  });
  document.querySelectorAll('[data-create-space]').forEach(el=> el.addEventListener('click', createSpace));

  // pages
  document.querySelectorAll('[data-select-page]').forEach(el=>{
    el.addEventListener('click', (e)=>{
      if(e.target.closest('[data-move-page],[data-delete-page]')) return;
      selectPage(el.dataset.selectPage);
      state.sidebarOpen=false;
    });
  });
  document.querySelectorAll('[data-create-page]').forEach(el=> el.addEventListener('click', createPage));
  document.querySelectorAll('[data-lock-page],[data-toggle-lock]').forEach(el=>{
    el.addEventListener('click', (e)=>{
      e.stopPropagation();
      const id = el.dataset.lockPage || el.dataset.toggleLock;
      const p = state.pages.find(x=>x.id===id);
      if(p) toggleLock(p);
    });
  });

  document.querySelectorAll('[data-delete-page]').forEach(el=>{
    el.addEventListener('click', (e)=>{ e.stopPropagation(); const p=state.pages.find(x=>x.id===el.dataset.deletePage); if(p) deletePage(p); });
  });
  document.querySelectorAll('[data-move-page]').forEach(el=>{
    el.addEventListener('click', (e)=>{ e.stopPropagation(); const p=state.pages.find(x=>x.id===el.dataset.movePage); if(p) movePage(p, parseInt(el.dataset.dir)); });
  });

  // page title
  const pt = document.querySelector('[data-page-title]');
  if(pt){
    pt.addEventListener('input', ()=>{
      const page = state.pages.find(p=>p.id===pt.dataset.pageTitle);
      if(page) updatePageTitle(page, pt.value);
    });
    pt.addEventListener('blur', ()=>{
      const page = state.pages.find(p=>p.id===pt.dataset.pageTitle);
      if(page) savePageTitleNow(page);
    });
  }

  // sign out
  const so = document.querySelector('[data-signout]');
  if(so) so.addEventListener('click', doSignOut);

  // notifications
  document.querySelectorAll('[data-notif-panel]').forEach(el=>{
    el.addEventListener('click', (e)=>{
      e.stopPropagation();
      state.notifPanelOpen = !state.notifPanelOpen;
      render();
    });
  });
  document.querySelectorAll('[data-mark-all-seen]').forEach(el=>{
    el.addEventListener('click', (e)=>{ e.stopPropagation(); markAllSeen(); });
  });
  document.querySelectorAll('[data-goto-notif]').forEach(el=>{
    el.addEventListener('click', ()=>{
      const notif = state.notifications.find(n=>n.id===el.dataset.gotoNotif);
      if(notif) goToNotification(notif);
    });
  });

  // add root block
  document.querySelectorAll('[data-add-root]').forEach(el=>{
    el.addEventListener('click', (e)=> openTypeMenu(e, null));
  });
  document.querySelectorAll('[data-add-child]').forEach(el=>{
    el.addEventListener('click', (e)=> openTypeMenu(e, el.dataset.addChild));
  });

  // type menu
  if(state.typeMenu){
    const overlay = document.querySelector('[data-close-menu]');
    overlay.addEventListener('click', (e)=>{
      if(e.target===overlay){ state.typeMenu=null; render(); }
    });
    document.querySelectorAll('[data-pick-type]').forEach(el=>{
      el.addEventListener('click', ()=> addBlock(el.dataset.pickType, state.typeMenu.parentId));
    });
  }

  // block content editing
  document.querySelectorAll('.block-content[contenteditable="true"]').forEach(el=>{
    const blockEl = el.closest('[data-block-id]');
    const block = state.blocks.find(b=>b.id===blockEl.dataset.blockId);
    if(!block) return;
    const field = el.dataset.field || 'text';
    el.addEventListener('input', ()=> updateBlockContent(block, {[field]: el.innerText}));
    el.addEventListener('blur', ()=> saveBlockNow(block));
    el.addEventListener('keydown', (e)=>{
      if(e.key==='Enter' && !e.shiftKey && ['heading','subheading','paragraph','bullet','numbered','callout','toggle'].includes(block.type)){
        e.preventDefault();
        el.blur();
        addBlock(block.type==='toggle'?'paragraph':block.type, block.parent_block_id);
      }
    });
  });

  // video / caption inputs
  document.querySelectorAll('.video-url-input').forEach(el=>{
    const blockEl = el.closest('[data-block-id]');
    const block = state.blocks.find(b=>b.id===blockEl.dataset.blockId);
    el.addEventListener('input', ()=> updateBlockContent(block, {url: el.value}, {delay:600}));
    el.addEventListener('blur', ()=> render());
    el.addEventListener('keydown', (e)=>{ if(e.key==='Enter'){ e.preventDefault(); render(); } });
  });
  document.querySelectorAll('.video-caption').forEach(el=>{
    const blockEl = el.closest('[data-block-id]');
    const block = state.blocks.find(b=>b.id===blockEl.dataset.blockId);
    el.addEventListener('input', ()=> updateBlockContent(block, {caption: el.innerText}));
  });

  // toggle open/close
  document.querySelectorAll('[data-toggle]').forEach(el=>{
    el.addEventListener('click', ()=> toggleOpen(el.dataset.toggle));
  });

  // song
  document.querySelectorAll('[data-pick-song]').forEach(el=>{
    el.addEventListener('click', (e)=>{
      e.stopPropagation();
      state.songPickerForBlock = el.dataset.pickSong;
      state.songPickerQuery='';
      ensureSongsLoaded().then(render);
      render();
    });
  });
  document.querySelectorAll('[data-song-toggle]').forEach(el=>{
    el.addEventListener('click', (e)=>{
      if(e.target.closest('[data-pick-song]')) return;
      const key = 'song-open-'+el.dataset.songToggle;
      if(state.openComments.has(key)) state.openComments.delete(key); else state.openComments.add(key);
      render();
    });
  });

  // block controls
  document.querySelectorAll('[data-move]').forEach(el=>{
    el.addEventListener('click', ()=>{
      const block = state.blocks.find(b=>b.id===el.dataset.move);
      if(block) moveBlock(block, parseInt(el.dataset.dir));
    });
  });
  document.querySelectorAll('[data-delete-block]').forEach(el=>{
    el.addEventListener('click', ()=>{
      const block = state.blocks.find(b=>b.id===el.dataset.deleteBlock);
      if(block) deleteBlock(block);
    });
  });

  // comments
  document.querySelectorAll('[data-comment-toggle]').forEach(el=>{
    el.addEventListener('click', ()=> toggleComments(el.dataset.commentToggle));
  });
  document.querySelectorAll('[data-comment-form]').forEach(form=>{
    form.addEventListener('submit', (e)=>{
      e.preventDefault();
      const input = form.querySelector('input');
      addComment(form.dataset.commentForm, input.value);
      input.value='';
    });
  });
  document.querySelectorAll('[data-delete-comment]').forEach(el=>{
    el.addEventListener('click', ()=>{
      if(!confirm('Supprimer ce commentaire ?')) return;
      const [blockId, commentId] = el.dataset.deleteComment.split('|');
      const c = (state.comments[blockId]||[]).find(x=>x.id===commentId);
      if(c) deleteComment(blockId, c);
    });
  });
}

function refreshSongPickerList(){
  const overlay = document.querySelector('.menu-overlay[style*="rgba(43,36,32,.35)"]');
  if(!overlay) return;
  const q = normalize(state.songPickerQuery);
  const songs = (state.allSongs||[]).filter(s=> !q || normalize(s.title).includes(q) || normalize(s.lyrics).includes(q) || normalize(s.mnemonic).includes(q));
  const list = overlay.querySelector('div[style*="overflow-y:auto"]');
  list.innerHTML = state.allSongs===null ? `<p style="padding:16px; color:var(--muted);">Chargement des chants…</p>` :
    songs.length ? songs.map(s=>`
      <button data-choose-song="${s.id}" style="display:flex; align-items:center; gap:10px; width:100%; text-align:left; background:none; border:none; padding:10px 12px; border-radius:8px; font-size:14px;">
        <span class="song-note" style="width:24px;height:24px;font-size:12px;">♪</span>
        <span style="flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${esc(s.title)}</span>
        <span class="song-cat">${esc(SONG_CATEGORIES[s.category]||s.category||'')}</span>
      </button>
    `).join('') : `<p style="padding:16px; color:var(--muted);">Aucun chant trouvé.</p>`;
  list.querySelectorAll('[data-choose-song]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const song = state.allSongs.find(s=>s.id===btn.dataset.chooseSong);
      const block = state.blocks.find(b=>b.id===state.songPickerForBlock);
      if(song && block) chooseSong(block, song);
    });
  });
}

function openTypeMenu(e, parentId){
  const rect = e.target.getBoundingClientRect();
  let x = rect.left, y = rect.bottom + 6;
  const menuW = 230, menuH = 320;
  if(x + menuW > window.innerWidth - 12) x = window.innerWidth - menuW - 12;
  if(y + menuH > window.innerHeight - 12) y = rect.top - menuH - 6;
  state.typeMenu = { parentId, x: Math.max(8,x), y: Math.max(8,y) };
  render();
}

/* ======================= INIT ======================= */
render();
sb.auth.getSession().then(({data})=>{
  state.session = data.session;
  state.loadingAuth = false;
  if(data.session) bootstrapAfterLogin();
  else render();
});
