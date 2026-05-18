// SOSSOU KOUAMÉ - Frontend (app.js)
const PRIX_515 = 1300;
const PRIX_510 = 1400;

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// ─── BARRE DE CHARGEMENT ───
let _progressTimer = null;
function showLoading() {
  const bar = document.getElementById('progress-bar');
  const overlay = document.getElementById('loading-overlay');
  if (bar) { bar.style.width = '0%'; bar.classList.remove('done'); requestAnimationFrame(() => { bar.style.width = '70%'; }); }
  if (overlay) overlay.classList.add('show');
}
function hideLoading() {
  const bar = document.getElementById('progress-bar');
  const overlay = document.getElementById('loading-overlay');
  if (bar) { bar.classList.add('done'); bar.style.width = '100%'; }
  if (overlay) overlay.classList.remove('show');
  clearTimeout(_progressTimer);
  _progressTimer = setTimeout(() => { if (bar) { bar.style.width = '0%'; bar.classList.remove('done'); } }, 600);
}

// ─── UTILITAIRE AFFICHER/CACHER MOT DE PASSE ───
function togglePw(inputId, eyeId) {
  const input = document.getElementById(inputId);
  const eye = document.getElementById(eyeId);
  if (!input || !eye) return;
  if (input.type === 'password') {
    input.type = 'text';
    eye.innerHTML = '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>';
  } else {
    input.type = 'password';
    eye.innerHTML = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
  }
}

// ─── API ───
async function apiGet(endpoint) {
  const res = await fetch(endpoint);
  return res.json();
}

async function apiPost(endpoint, data) {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(data)
  });
  return res.json();
}

// ─── SESSION ───
let __session = null;
function getSession() {
  if (__session) return __session;
  try { const raw = sessionStorage.getItem('sossou_session'); if (raw) { __session = JSON.parse(raw); return __session; } } catch(e) {}
  return null;
}
function setSession(user) { __session = user; try { sessionStorage.setItem('sossou_session', JSON.stringify(user)); } catch(e) {} }
function clearSession() { __session = null; try { sessionStorage.removeItem('sossou_session'); } catch(e) {} }
function handleLogout() { clearSession(); navigate('/'); }

// ─── ROUTER ───
let currentRoute = '/';
function navigate(path) { currentRoute = path; window.history.pushState({}, '', '#' + path); render(); }
window.addEventListener('popstate', () => { currentRoute = window.location.hash.slice(1) || '/'; render(); });

// ─── RENDU ───
function render() {
  const app = $('#app');
  const path = currentRoute;
  const session = getSession();
  if (path === '/') renderHome(app);
  else if (path === '/register') renderRegister(app);
  else if (path === '/login') renderLogin(app);
  else if (path === '/admin') renderAdminLogin(app);
  else if (path === '/massier') { if (!session || session.role !== 'massier') { navigate('/login'); return; } renderMassier(app, session); }
  else if (path === '/proprietaire') { if (!session || session.role !== 'proprietaire') { navigate('/login'); return; } renderProprietaire(app, session); }
  else if (path === '/admin-console') { if (!session || session.role !== 'admin') { navigate('/admin'); return; } renderAdminConsole(app, session); }
  else renderHome(app);
}

// ─── COMPOSANTS UI ───
function Header(title, subtitle, session, showLogout = true) {
  const roleColors = { admin: 'from-indigo-600 to-purple-600', proprietaire: 'from-purple-600 to-pink-600', massier: 'from-blue-600 to-indigo-600' };
  const grad = roleColors[session?.role] || 'from-indigo-600 to-purple-600';
  return `
    <div class="glass p-5 mb-6 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center shadow-lg flex-shrink-0">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        </div>
        <div>
          <h1 class="text-lg font-bold text-gray-900 leading-tight">${title}</h1>
          ${subtitle ? `<p class="text-xs text-gray-500 mt-0.5">${subtitle}</p>` : ''}
        </div>
      </div>
      ${showLogout ? `<button onclick="handleLogout()" class="flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors cursor-pointer text-sm font-medium border border-red-100">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        Déconnexion
      </button>` : ''}
    </div>
  `;
}

function Message(type, text) {
  const cls = type === 'error' ? 'msg-error' : 'msg-success';
  const icon = type === 'error'
    ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>'
    : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>';
  return `<div class="${cls}">${icon}<span>${text}</span></div>`;
}

// ─── PAGE ACCUEIL ───
function renderHome(container) {
  container.innerHTML = `
    <div class="page">
      <div class="glass p-8 md:p-12 max-w-sm w-full text-center page-anim">
        <div class="mb-8">
          <div class="w-24 h-24 mx-auto bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 rounded-3xl flex items-center justify-center shadow-2xl mb-5" style="box-shadow:0 20px 40px rgba(99,102,241,.5)">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8"><path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M17 18h1"/><path d="M12 18h1"/><path d="M7 18h1"/></svg>
          </div>
          <h1 class="text-3xl font-extrabold text-gray-900 mb-1 tracking-tight">SOSSOU KOUAMÉ</h1>
          <p class="text-base font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text" style="color:transparent">Gestion Multi-Niveaux</p>
          <p class="text-sm text-gray-400 mt-2">Appolinaire — Ouvriers & Ventes</p>
        </div>

        <div class="space-y-3">
          <button onclick="navigate('/register')" class="btn-primary">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
            Inscription Massier
          </button>
          <button onclick="navigate('/login')" class="btn-secondary">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
            Connexion
          </button>
          <button onclick="navigate('/admin')" class="btn-dark">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            Espace Administrateur
          </button>
        </div>

        <div class="mt-8 pt-6 border-t border-gray-100">
          <p class="text-xs text-gray-400 flex items-center justify-center gap-1.5">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            +229 01 67 92 40 76
          </p>
          <p class="text-xs text-gray-300 mt-1">© 2024 Sossou Kouamé Appolinaire</p>
        </div>
      </div>
    </div>
  `;
}

// ─── PAGE INSCRIPTION ───
async function renderRegister(container) {
  showLoading();
  try {
    const db = await apiGet('/api/db');
    const proprios = db.users.filter(u => u.role === 'proprietaire');
    hideLoading();

    container.innerHTML = `
      <div class="page">
        <div class="glass p-8 max-w-lg w-full page-anim">
          <button onclick="navigate('/')" class="flex items-center gap-2 text-gray-400 hover:text-indigo-600 mb-6 transition-colors cursor-pointer text-sm font-medium">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
            Retour
          </button>

          <div class="flex items-center gap-3 mb-6">
            <div class="w-11 h-11 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
            </div>
            <div>
              <h2 class="text-xl font-bold text-gray-900">Inscription Massier</h2>
              <p class="text-xs text-gray-400">Créer votre compte</p>
            </div>
          </div>

          <div id="msg"></div>

          <form id="registerForm" class="space-y-4">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Nom</label>
                <input type="text" name="nom" required class="inp" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Prénom</label>
                <input type="text" name="prenom" required class="inp" />
              </div>
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Email</label>
              <input type="email" name="email" required class="inp" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Téléphone</label>
              <input type="tel" name="telephone" required placeholder="0XXXXXXXX ou +229XXXXXXXX" class="inp" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Propriétaire</label>
              <select name="proprio_id" required class="inp">
                <option value="">Choisir un propriétaire...</option>
                ${proprios.map(p => `<option value="${p.id}">${p.prenom} ${p.nom}</option>`).join('')}
              </select>
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Mot de passe</label>
              <div class="relative">
                <input type="password" name="password" id="pw-register" required minlength="6" class="inp pr-10" />
                <button type="button" onclick="togglePw('pw-register','eye-register')" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-500 transition-colors">
                  <svg id="eye-register" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                </button>
              </div>
            </div>
            <button type="submit" class="btn-primary">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
              S'inscrire
            </button>
          </form>
        </div>
      </div>
    `;

    $('#registerForm').onsubmit = async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const data = Object.fromEntries(fd);

      if (!data.telephone.match(/^(\+?[0-9]{7,15}|0[0-9]{8})$/)) {
        $('#msg').innerHTML = Message('error', 'Téléphone invalide (ex: 0XXXXXXXX ou +229XXXXXXXX)');
        return;
      }

      showLoading();
      try {
        const result = await apiPost('/api/register', data);
        hideLoading();
        if (!result.success) {
          $('#msg').innerHTML = Message('error', result.error || 'Erreur inscription');
          return;
        }
        container.innerHTML = `
          <div class="page">
            <div class="glass p-10 max-w-sm w-full text-center page-anim">
              <div class="w-20 h-20 mx-auto bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center mb-5 shadow-xl">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              </div>
              <h2 class="text-2xl font-bold text-gray-900 mb-2">Inscription réussie !</h2>
              <p class="text-gray-500 text-sm mb-6">Votre compte est en attente de validation par votre propriétaire.</p>
              <button onclick="navigate('/login')" class="btn-primary">Aller à la connexion</button>
            </div>
          </div>
        `;
      } catch(err) {
        hideLoading();
        $('#msg').innerHTML = Message('error', 'Erreur de connexion au serveur');
      }
    };
  } catch(err) {
    hideLoading();
    container.innerHTML = `<div class="page"><div class="glass p-8 text-center text-red-600">Erreur de chargement</div></div>`;
  }
}

// ─── PAGE CONNEXION ───
function renderLogin(container) {
  container.innerHTML = `
    <div class="page">
      <div class="glass p-8 max-w-sm w-full page-anim">
        <button onclick="navigate('/')" class="flex items-center gap-2 text-gray-400 hover:text-indigo-600 mb-6 transition-colors cursor-pointer text-sm font-medium">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          Retour
        </button>

        <div class="flex items-center gap-3 mb-6">
          <div class="w-11 h-11 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
          </div>
          <div>
            <h2 class="text-xl font-bold text-gray-900">Connexion</h2>
            <p class="text-xs text-gray-400">Accéder à votre espace</p>
          </div>
        </div>

        <div id="msg"></div>

        <form id="loginForm" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Email ou Téléphone</label>
            <input type="text" name="identifier" required placeholder="email@example.com" class="inp" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Mot de passe</label>
            <div class="relative">
              <input type="password" name="password" id="pw-login" required class="inp pr-10" />
              <button type="button" onclick="togglePw('pw-login','eye-login')" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-500 transition-colors">
                <svg id="eye-login" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              </button>
            </div>
          </div>
          <button type="submit" class="btn-primary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
            Se connecter
          </button>
        </form>

        <p class="mt-5 text-center text-sm text-gray-400">
          Pas encore de compte ?
          <button onclick="navigate('/register')" class="text-indigo-600 hover:text-indigo-700 font-semibold cursor-pointer ml-1">S'inscrire</button>
        </p>
      </div>
    </div>
  `;

  $('#loginForm').onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    showLoading();
    try {
      const result = await apiPost('/api/login', { identifier: fd.get('identifier'), password: fd.get('password') });
      hideLoading();
      if (!result.success) { $('#msg').innerHTML = Message('error', result.error || 'Identifiants incorrects'); return; }
      setSession({ id: result.user.id, email: result.user.email, role: result.user.role, nom: result.user.nom, prenom: result.user.prenom, proprio_id: result.user.proprio_id });
      navigate(result.redirect);
    } catch(err) { hideLoading(); $('#msg').innerHTML = Message('error', 'Erreur de connexion'); }
  };
}

// ─── PAGE ADMIN LOGIN ───
function renderAdminLogin(container) {
  container.innerHTML = `
    <div class="page">
      <div class="glass p-8 max-w-sm w-full page-anim">
        <button onclick="navigate('/')" class="flex items-center gap-2 text-gray-400 hover:text-indigo-600 mb-6 transition-colors cursor-pointer text-sm font-medium">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          Retour
        </button>

        <div class="flex items-center gap-3 mb-2">
          <div class="w-11 h-11 bg-gradient-to-br from-gray-800 to-indigo-900 rounded-xl flex items-center justify-center shadow-lg">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <div>
            <h2 class="text-xl font-bold text-gray-900">Espace Administrateur</h2>
            <p class="text-xs text-gray-400">Connexion sécurisée réservée à l'admin</p>
          </div>
        </div>

        <div class="mt-4 mb-5 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <p class="text-xs text-amber-700 font-medium">Zone réservée à l'administrateur système</p>
        </div>

        <div id="msg"></div>

        <form id="adminForm" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Email Admin</label>
            <input type="email" name="email" required class="inp" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Mot de passe</label>
            <div class="relative">
              <input type="password" name="password" id="pw-admin" required class="inp pr-10" />
              <button type="button" onclick="togglePw('pw-admin','eye-admin')" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-500 transition-colors">
                <svg id="eye-admin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              </button>
            </div>
          </div>
          <button type="submit" class="btn-dark">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            Accéder
          </button>
        </form>
      </div>
    </div>
  `;

  $('#adminForm').onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    showLoading();
    try {
      const result = await apiPost('/api/login', { identifier: fd.get('email'), password: fd.get('password') });
      hideLoading();
      if (!result.success || result.user.role !== 'admin') { $('#msg').innerHTML = Message('error', result.error || 'Accès refusé'); return; }
      setSession({ id: result.user.id, email: result.user.email, role: result.user.role, nom: result.user.nom, prenom: result.user.prenom });
      navigate('/admin-console');
    } catch(err) { hideLoading(); $('#msg').innerHTML = Message('error', 'Erreur de connexion'); }
  };
}

// ─── PAGE MASSIER ───
async function renderMassier(container, session) {
  showLoading();
  try {
    const db = await apiGet('/api/db');
    hideLoading();

    container.innerHTML = `
      <div class="min-h-screen p-4 md:p-6">
        <div class="max-w-2xl mx-auto page-anim">
          ${Header('Espace Massier', `${session.prenom} ${session.nom}`, session)}
          <div id="msg"></div>

          <div class="flex gap-2 mb-5 flex-wrap">
            <button onclick="setMassierTab('rapport')" id="tab-rapport" class="tab tab-active">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              Point Ouvriers
            </button>
            <button onclick="setMassierTab('vente')" id="tab-vente" class="tab tab-inactive">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
              Vente
            </button>
            <button onclick="setMassierTab('validations')" id="tab-validations" class="tab tab-inactive">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
              Validations
            </button>
          </div>

          <div id="massier-content"></div>
        </div>
      </div>
    `;

    window.massierTab = 'rapport';
    window.massierLignes = [{ nom_ouvrier: '', qte_515: '', qte_510: '' }];
    window.massierDB = db;
    renderMassierContent();
  } catch(err) {
    hideLoading();
    container.innerHTML = `<div class="page"><div class="glass p-8 text-center text-red-600">Erreur de chargement</div></div>`;
  }
}

function setMassierTab(tab) {
  window.massierTab = tab;
  $$('.tab').forEach(t => { if (t.id && t.id.startsWith('tab-')) t.className = 'tab tab-inactive'; });
  const el = $(`#tab-${tab}`); if (el) el.className = 'tab tab-active';
  renderMassierContent();
}

function renderMassierContent() {
  const container = $('#massier-content');
  if (!container) return;
  const session = getSession();
  const db = window.massierDB || {};

  if (window.massierTab === 'rapport') {
    container.innerHTML = `
      <div class="glass p-6">
        <div class="flex items-center gap-2 mb-1">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
          <h3 class="text-base font-bold text-gray-900">Point des Ouvriers</h3>
        </div>
        <p class="text-xs text-gray-400 mb-5 ml-6">Prix: 5/15 = <strong>${PRIX_515} F</strong> &nbsp;|&nbsp; 5/10 = <strong>${PRIX_510} F</strong></p>

        <form id="rapportForm" class="space-y-4">
          <div id="lignes-container" class="space-y-3"></div>
          <div class="flex gap-2 pt-1">
            <button type="button" onclick="addLigne()" class="flex items-center gap-1.5 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors cursor-pointer text-sm font-semibold border border-indigo-100">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Ajouter
            </button>
            <button type="submit" class="btn-small flex-1">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 2L11 13"/><path d="M22 2L15 22 11 13 2 9l20-7z"/></svg>
              Soumettre le rapport
            </button>
          </div>
        </form>
      </div>
    `;
    renderLignes();

    $('#rapportForm').onsubmit = async (e) => {
      e.preventDefault();
      const lignesData = window.massierLignes.filter(l => l.nom_ouvrier.trim()).map(l => ({ nom_ouvrier: l.nom_ouvrier, qte_515: parseInt(l.qte_515) || 0, qte_510: parseInt(l.qte_510) || 0 }));
      if (lignesData.length === 0) { const msg = $('#msg'); if (msg) msg.innerHTML = Message('error', 'Ajoutez au moins un ouvrier'); return; }
      showLoading();
      try {
        const result = await apiPost('/api/rapports', { massier_id: session.id, lignes: lignesData });
        hideLoading();
        if (!result.success) { const msg = $('#msg'); if (msg) msg.innerHTML = Message('error', result.error || 'Erreur'); return; }
        window.massierLignes = [{ nom_ouvrier: '', qte_515: '', qte_510: '' }];
        const msg = $('#msg'); if (msg) msg.innerHTML = Message('success', 'Rapport soumis avec succès !');
        renderLignes();
      } catch(err) { hideLoading(); const msg = $('#msg'); if (msg) msg.innerHTML = Message('error', 'Erreur de connexion'); }
    };
  }

  else if (window.massierTab === 'vente') {
    container.innerHTML = `
      <div class="glass p-6">
        <div class="flex items-center gap-2 mb-5">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
          <h3 class="text-base font-bold text-gray-900">Déclarer une Vente</h3>
        </div>
        <form id="venteForm" class="space-y-4 max-w-xs">
          <div>
            <label class="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Quantité 5/15</label>
            <input type="number" name="qte_515" min="0" value="0" class="inp" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Quantité 5/10</label>
            <input type="number" name="qte_510" min="0" value="0" class="inp" />
          </div>
          <button type="submit" class="btn-small">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 2L11 13"/><path d="M22 2L15 22 11 13 2 9l20-7z"/></svg>
            Déclarer la vente
          </button>
        </form>
      </div>
    `;

    $('#venteForm').onsubmit = async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      showLoading();
      try {
        const result = await apiPost('/api/ventes', { massier_id: session.id, qte_515: parseInt(fd.get('qte_515')) || 0, qte_510: parseInt(fd.get('qte_510')) || 0 });
        hideLoading();
        if (result.success) { const msg = $('#msg'); if (msg) msg.innerHTML = Message('success', 'Vente déclarée avec succès !'); e.target.reset(); }
      } catch(err) { hideLoading(); const msg = $('#msg'); if (msg) msg.innerHTML = Message('error', 'Erreur de connexion'); }
    };
  }

  else if (window.massierTab === 'validations') {
    const vals = (db.validations_financieres || []).filter(v => v.massier_id === session.id);
    container.innerHTML = `
      <div class="glass p-6">
        <div class="flex items-center gap-2 mb-5">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
          <h3 class="text-base font-bold text-gray-900">Validations Financières</h3>
        </div>
        ${vals.length === 0
          ? '<p class="text-gray-400 text-center py-10 text-sm">Aucune validation reçue pour le moment.</p>'
          : `<div class="space-y-3">${vals.map(v => `
            <div class="item-card">
              <div class="flex justify-between items-center">
                <div>
                  <p class="font-semibold text-gray-900 text-sm">Validation #${v.id}</p>
                  <p class="text-xs text-gray-400 mt-0.5">${new Date(v.valide_at).toLocaleDateString('fr-FR')}</p>
                </div>
                <p class="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text" style="color:transparent">${v.total.toLocaleString()} F</p>
              </div>
              <div class="mt-2 flex gap-4 text-xs text-gray-500">
                <span class="flex items-center gap-1"><span class="w-2 h-2 bg-indigo-400 rounded-full"></span>5/15: ${v.montant_515.toLocaleString()} F</span>
                <span class="flex items-center gap-1"><span class="w-2 h-2 bg-purple-400 rounded-full"></span>5/10: ${v.montant_510.toLocaleString()} F</span>
              </div>
            </div>
          `).join('')}</div>`
        }
      </div>
    `;
  }
}

function renderLignes() {
  const container = $('#lignes-container');
  if (!container) return;
  container.innerHTML = window.massierLignes.map((l, i) => `
    <div class="flex gap-2 items-end p-3 bg-gray-50 rounded-xl border border-gray-100">
      <div class="flex-1">
        <label class="block text-xs font-medium text-gray-500 mb-1">Nom Ouvrier</label>
        <input type="text" value="${l.nom_ouvrier}" onchange="updateLigne(${i},'nom_ouvrier',this.value)" placeholder="Ex: Jean" class="inp" />
      </div>
      <div class="w-20">
        <label class="block text-xs font-medium text-gray-500 mb-1">5/15</label>
        <input type="number" min="0" value="${l.qte_515}" onchange="updateLigne(${i},'qte_515',this.value)" class="inp" />
      </div>
      <div class="w-20">
        <label class="block text-xs font-medium text-gray-500 mb-1">5/10</label>
        <input type="number" min="0" value="${l.qte_510}" onchange="updateLigne(${i},'qte_510',this.value)" class="inp" />
      </div>
      ${window.massierLignes.length > 1 ? `
      <button type="button" onclick="removeLigne(${i})" class="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors mb-0.5 cursor-pointer flex-shrink-0">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
      </button>` : '<div class="w-8"></div>'}
    </div>
  `).join('');
}

function updateLigne(index, field, value) { window.massierLignes[index][field] = value; }
function addLigne() { window.massierLignes.push({ nom_ouvrier: '', qte_515: '', qte_510: '' }); renderLignes(); }
function removeLigne(index) { window.massierLignes.splice(index, 1); renderLignes(); }

// ─── PAGE PROPRIÉTAIRE ───
async function renderProprietaire(container, session) {
  showLoading();
  try {
    const db = await apiGet('/api/db');
    hideLoading();

    const myId = parseInt(session.id);
    const massiers = db.users.filter(u => u.role === 'massier' && parseInt(u.proprio_id) === myId);
    const pending = massiers.filter(m => !m.validated);
    const stock = db.proprietaire_stock[session.id] || { stock_515: 0, stock_510: 0 };
    const rapports = db.ouvrier_rapports.filter(r => { const m = db.users.find(u => u.id === r.massier_id); return m && parseInt(m.proprio_id) === myId; });
    const ventes = db.ventes.filter(v => { const m = db.users.find(u => u.id === v.massier_id); return m && parseInt(m.proprio_id) === myId; });

    container.innerHTML = `
      <div class="min-h-screen p-4 md:p-6">
        <div class="max-w-3xl mx-auto page-anim">
          ${Header('Espace Propriétaire', `${session.prenom} ${session.nom}`, session)}
          <div id="msg"></div>

          ${pending.length > 0 ? `
          <div class="mb-5 p-4 glass-purple rounded-2xl border-l-4 border-amber-400">
            <div class="flex items-center gap-2 mb-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <p class="font-bold text-amber-800 text-sm">${pending.length} massier(s) en attente de validation</p>
            </div>
            <div class="space-y-2">
              ${pending.map(m => `
                <div class="pending-card flex items-center justify-between">
                  <div>
                    <p class="font-semibold text-gray-900 text-sm">${m.prenom} ${m.nom}</p>
                    <p class="text-xs text-gray-500">${m.email} · ${m.telephone}</p>
                  </div>
                  <button onclick="validateMassier(${m.id})" class="btn-green">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    Valider
                  </button>
                </div>
              `).join('')}
            </div>
          </div>` : ''}

          <div class="grid grid-cols-2 gap-3 mb-5">
            <div class="stat-card stat-indigo">
              <p class="text-xs font-medium opacity-80 mb-1">Stock 5/15</p>
              <p class="text-3xl font-extrabold">${stock.stock_515}</p>
            </div>
            <div class="stat-card stat-purple">
              <p class="text-xs font-medium opacity-80 mb-1">Stock 5/10</p>
              <p class="text-3xl font-extrabold">${stock.stock_510}</p>
            </div>
          </div>

          <div class="flex gap-2 mb-5 flex-wrap">
            <button onclick="setProprioTab('massiers')" id="ptab-massiers" class="tab tab-active">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
              Massiers (${massiers.length})
            </button>
            <button onclick="setProprioTab('stock')" id="ptab-stock" class="tab tab-inactive">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
              Stock
            </button>
            <button onclick="setProprioTab('rapports')" id="ptab-rapports" class="tab tab-inactive">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/></svg>
              Rapports (${rapports.length})
            </button>
            <button onclick="setProprioTab('ventes')" id="ptab-ventes" class="tab tab-inactive">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
              Ventes (${ventes.length})
            </button>
          </div>

          <div id="proprio-content"></div>
        </div>
      </div>
    `;

    window.proprioTab = 'massiers';
    window.proprioData = { massiers, pending, stock, rapports, ventes, db };
    renderProprioContent();
  } catch(err) {
    hideLoading();
    container.innerHTML = `<div class="page"><div class="glass p-8 text-center text-red-600">Erreur de chargement</div></div>`;
  }
}

function setProprioTab(tab) {
  window.proprioTab = tab;
  $$('.tab').forEach(t => { if (t.id && t.id.startsWith('ptab-')) t.className = 'tab tab-inactive'; });
  const el = $(`#ptab-${tab}`); if (el) el.className = 'tab tab-active';
  renderProprioContent();
}

function renderProprioContent() {
  const container = $('#proprio-content');
  if (!container) return;
  const { massiers, pending, stock, rapports, ventes, db } = window.proprioData || {};
  const session = getSession();

  if (window.proprioTab === 'massiers') {
    container.innerHTML = `
      <div class="glass p-6">
        <h3 class="text-base font-bold text-gray-900 mb-4">Tous les massiers (${(massiers||[]).length})</h3>
        ${(massiers || []).length === 0 ? '<p class="text-gray-400 text-center py-10 text-sm">Aucun massier enregistré.</p>' : `
        <div class="space-y-2">
          ${massiers.map(m => `
            <div class="item-card flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm text-white ${m.validated ? 'bg-gradient-to-br from-green-400 to-emerald-600' : 'bg-gradient-to-br from-amber-400 to-orange-500'}">
                  ${m.prenom[0]}${m.nom[0]}
                </div>
                <div>
                  <p class="font-semibold text-gray-900 text-sm">${m.prenom} ${m.nom}</p>
                  <p class="text-xs text-gray-400">${m.email}</p>
                </div>
              </div>
              <span class="${m.validated ? 'badge-ok' : 'badge-pending'}">
                ${m.validated ? '✓ Validé' : '⏳ En attente'}
              </span>
            </div>
          `).join('')}
        </div>`}
      </div>
    `;
  }

  else if (window.proprioTab === 'stock') {
    const allMouvements = [
      ...(rapports || []).map(r => {
        const lignes = (db.ouvrier_lignes || []).filter(l => l.rapport_id === r.id);
        const t515 = lignes.reduce((s, l) => s + (l.qte_515 || 0), 0);
        const t510 = lignes.reduce((s, l) => s + (l.qte_510 || 0), 0);
        const m = db.users.find(u => u.id === r.massier_id);
        return { type: 'rapport', id: r.id, qte_515: t515, qte_510: t510, date: r.soumis_at, nom: m ? `${m.prenom} ${m.nom}` : 'Inconnu' };
      }),
      ...(ventes || []).map(v => {
        const m = db.users.find(u => u.id === v.massier_id);
        return { type: 'vente', id: v.id, qte_515: v.qte_515 || 0, qte_510: v.qte_510 || 0, date: v.date_at, nom: m ? `${m.prenom} ${m.nom}` : 'Inconnu' };
      })
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    container.innerHTML = `
      <div class="glass p-6">
        <h3 class="text-base font-bold text-gray-900 mb-4">Mouvements de Stock</h3>
        ${allMouvements.length === 0 ? '<p class="text-gray-400 text-center py-10 text-sm">Aucun mouvement enregistré.</p>' :
        `<div class="space-y-2">
          ${allMouvements.map(m => `
            <div class="item-card flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg flex items-center justify-center ${m.type === 'rapport' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}">
                  ${m.type === 'rapport'
                    ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>'
                    : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/></svg>'}
                </div>
                <div>
                  <p class="text-sm font-semibold text-gray-800">${m.type === 'rapport' ? 'Rapport' : 'Vente'} — ${m.nom}</p>
                  <p class="text-xs text-gray-400">${new Date(m.date).toLocaleDateString('fr-FR')}</p>
                </div>
              </div>
              <div class="text-right text-xs font-bold ${m.type === 'rapport' ? 'text-green-600' : 'text-red-600'}">
                <div>${m.type === 'rapport' ? '+' : '-'}${m.qte_515} (5/15)</div>
                <div>${m.type === 'rapport' ? '+' : '-'}${m.qte_510} (5/10)</div>
              </div>
            </div>
          `).join('')}
        </div>`}
      </div>
    `;
  }

  else if (window.proprioTab === 'rapports') {
    container.innerHTML = `
      <div class="space-y-3">
        ${(rapports || []).length === 0 ? '<div class="glass p-6 text-center text-gray-400 text-sm">Aucun rapport reçu.</div>' : ''}
        ${(rapports || []).map(r => {
          const lignes = (db.ouvrier_lignes || []).filter(l => l.rapport_id === r.id);
          const total515 = lignes.reduce((s, l) => s + (l.qte_515 || 0), 0);
          const total510 = lignes.reduce((s, l) => s + (l.qte_510 || 0), 0);
          const m = db.users.find(u => u.id === r.massier_id);
          const alreadyValidated = (db.validations_financieres || []).some(v => v.rapport_id === r.id);
          return `
            <div class="glass p-5">
              <div class="flex items-center justify-between mb-3">
                <div>
                  <p class="font-bold text-gray-900 text-sm">Rapport #${r.id} — ${m ? m.prenom + ' ' + m.nom : 'Inconnu'}</p>
                  <p class="text-xs text-gray-400">${new Date(r.soumis_at).toLocaleDateString('fr-FR')}</p>
                </div>
                <div class="text-right">
                  <div class="flex gap-3 text-xs font-bold">
                    <span class="text-indigo-600">${total515} (5/15)</span>
                    <span class="text-purple-600">${total510} (5/10)</span>
                  </div>
                </div>
              </div>
              ${alreadyValidated
                ? `<div class="flex items-center gap-2 p-2.5 bg-green-50 rounded-xl text-green-700 text-xs font-semibold border border-green-100">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    Déjà validé financièrement
                  </div>`
                : `<div class="bg-gray-50 rounded-xl p-3 border border-gray-100">
                    <p class="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                      Validation financière
                    </p>
                    <div class="flex gap-2 items-end flex-wrap">
                      <div>
                        <label class="block text-xs text-gray-400 mb-1">Montant 5/15 (F)</label>
                        <input type="number" id="val-515-${r.id}" min="0" value="${total515 * PRIX_515}" class="inp w-28 text-sm" />
                      </div>
                      <div>
                        <label class="block text-xs text-gray-400 mb-1">Montant 5/10 (F)</label>
                        <input type="number" id="val-510-${r.id}" min="0" value="${total510 * PRIX_510}" class="inp w-28 text-sm" />
                      </div>
                      <button onclick="validerRapport(${r.id}, ${r.massier_id})" class="btn-small">Valider</button>
                    </div>
                  </div>`
              }
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  else if (window.proprioTab === 'ventes') {
    container.innerHTML = `
      <div class="glass p-6">
        <h3 class="text-base font-bold text-gray-900 mb-4">Historique des Ventes (${(ventes||[]).length})</h3>
        ${(ventes || []).length === 0 ? '<p class="text-gray-400 text-center py-10 text-sm">Aucune vente déclarée.</p>' : `
        <div class="space-y-2">
          ${ventes.map(v => {
            const m = db.users.find(u => u.id === v.massier_id);
            return `
              <div class="item-card flex items-center justify-between">
                <div>
                  <p class="font-semibold text-gray-900 text-sm">${m ? m.prenom + ' ' + m.nom : 'Inconnu'}</p>
                  <p class="text-xs text-gray-400">${new Date(v.date_at).toLocaleDateString('fr-FR')}</p>
                </div>
                <div class="text-right text-xs font-bold text-red-600">
                  <div>${v.qte_515 || 0} (5/15)</div>
                  <div>${v.qte_510 || 0} (5/10)</div>
                </div>
              </div>
            `;
          }).join('')}
        </div>`}
      </div>
    `;
  }
}

async function validateMassier(massierId) {
  showLoading();
  try {
    const result = await apiPost('/api/validate-massier', { massier_id: massierId });
    hideLoading();
    if (result.success) {
      const msg = $('#msg'); if (msg) msg.innerHTML = Message('success', 'Massier validé avec succès !');
      setTimeout(() => { const app = $('#app'); const session = getSession(); if (app && session) { if (session.role === 'proprietaire') renderProprietaire(app, session); else renderAdminConsole(app, session); } }, 600);
    }
  } catch(err) { hideLoading(); const msg = $('#msg'); if (msg) msg.innerHTML = Message('error', 'Erreur de validation'); }
}

async function validerRapport(rapportId, massierId) {
  const el515 = document.getElementById(`val-515-${rapportId}`);
  const el510 = document.getElementById(`val-510-${rapportId}`);
  showLoading();
  try {
    const result = await apiPost('/api/valider-rapport', { massier_id: massierId, rapport_id: rapportId, montant_515: el515 ? (parseInt(el515.value) || 0) : 0, montant_510: el510 ? (parseInt(el510.value) || 0) : 0 });
    hideLoading();
    if (result.success) { const msg = $('#msg'); if (msg) msg.innerHTML = Message('success', 'Rapport validé financièrement'); setTimeout(() => { const app = $('#app'); const session = getSession(); if (app && session) renderProprietaire(app, session); }, 600); }
  } catch(err) { hideLoading(); const msg = $('#msg'); if (msg) msg.innerHTML = Message('error', 'Erreur de validation'); }
}

// ─── PAGE ADMIN CONSOLE ───
async function renderAdminConsole(container, session) {
  showLoading();
  try {
    const db = await apiGet('/api/db');
    hideLoading();

    const proprios = db.users.filter(u => u.role === 'proprietaire');
    const allMassiers = db.users.filter(u => u.role === 'massier');
    const pendingAll = allMassiers.filter(m => !m.validated);
    const totalStock515 = Object.values(db.proprietaire_stock || {}).reduce((s, st) => s + (st.stock_515 || 0), 0);
    const totalStock510 = Object.values(db.proprietaire_stock || {}).reduce((s, st) => s + (st.stock_510 || 0), 0);

    container.innerHTML = `
      <div class="min-h-screen p-4 md:p-6">
        <div class="max-w-4xl mx-auto page-anim">
          ${Header('Console Administrateur', `${session.prenom} ${session.nom}`, session)}
          <div id="msg"></div>

          <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div class="stat-card stat-indigo">
              <p class="text-xs font-medium opacity-80 mb-1">Propriétaires</p>
              <p class="text-3xl font-extrabold">${proprios.length}</p>
            </div>
            <div class="stat-card stat-purple">
              <p class="text-xs font-medium opacity-80 mb-1">Massiers</p>
              <p class="text-3xl font-extrabold">${allMassiers.length}</p>
            </div>
            <div class="stat-card stat-green">
              <p class="text-xs font-medium opacity-80 mb-1">Stock 5/15</p>
              <p class="text-3xl font-extrabold">${totalStock515}</p>
            </div>
            <div class="stat-card stat-rose">
              <p class="text-xs font-medium opacity-80 mb-1">Stock 5/10</p>
              <p class="text-3xl font-extrabold">${totalStock510}</p>
            </div>
          </div>

          ${pendingAll.length > 0 ? `
          <div class="glass p-5 mb-5 border-l-4 border-amber-400">
            <div class="flex items-center gap-2 mb-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <p class="font-bold text-amber-800 text-sm">${pendingAll.length} massier(s) en attente de validation</p>
            </div>
            <div class="space-y-2">
              ${pendingAll.map(m => {
                const proprio = proprios.find(p => p.id === parseInt(m.proprio_id));
                return `
                  <div class="pending-card flex items-center justify-between">
                    <div>
                      <p class="font-semibold text-gray-900 text-sm">${m.prenom} ${m.nom}</p>
                      <p class="text-xs text-gray-500">${m.email} · ${m.telephone}</p>
                      ${proprio ? `<p class="text-xs text-indigo-600 font-medium mt-0.5">Propriétaire : ${proprio.prenom} ${proprio.nom}</p>` : ''}
                    </div>
                    <button onclick="validateMassier(${m.id})" class="btn-green">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                      Valider
                    </button>
                  </div>
                `;
              }).join('')}
            </div>
          </div>` : ''}

          <div class="glass p-5 mb-5">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-base font-bold text-gray-900 flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
                Créer un Propriétaire
              </h2>
              <button onclick="toggleAdminForm()" id="toggle-form-btn" class="text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer px-3 py-1.5 bg-indigo-50 rounded-lg border border-indigo-100">
                + Nouveau
              </button>
            </div>
            <form id="createProprioForm" class="space-y-4 hidden">
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Nom</label>
                  <input type="text" name="nom" required class="inp" />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Prénom</label>
                  <input type="text" name="prenom" required class="inp" />
                </div>
              </div>
              <div>
                <label class="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Email</label>
                <input type="email" name="email" required class="inp" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Téléphone</label>
                <input type="tel" name="telephone" required placeholder="0XXXXXXXX ou +229XXXXXXXX" class="inp" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Mot de passe</label>
                <div class="relative">
                  <input type="password" name="password" id="pw-proprio" required minlength="6" class="inp pr-10" />
                  <button type="button" onclick="togglePw('pw-proprio','eye-proprio')" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-500 transition-colors">
                    <svg id="eye-proprio" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  </button>
                </div>
              </div>
              <button type="submit" class="btn-small">Créer le propriétaire</button>
            </form>
          </div>

          <div class="glass p-5">
            <h2 class="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              Arborescence (${proprios.length} propriétaires)
            </h2>

            ${proprios.length === 0 ? '<p class="text-gray-400 text-center py-8 text-sm">Aucun propriétaire enregistré.</p>' : `
            <div class="space-y-3">
              ${proprios.map(proprio => {
                const ms = allMassiers.filter(u => parseInt(u.proprio_id) === parseInt(proprio.id));
                const st = db.proprietaire_stock[proprio.id] || { stock_515: 0, stock_510: 0 };
                const pendingMs = ms.filter(m => !m.validated);
                return `
                  <div class="border border-gray-200 rounded-xl overflow-hidden">
                    <button onclick="toggleProprioTree(${proprio.id})" class="w-full p-4 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between cursor-pointer">
                      <div class="flex items-center gap-3">
                        <div class="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow">
                          ${proprio.prenom[0]}${proprio.nom[0]}
                        </div>
                        <div class="text-left">
                          <p class="font-bold text-gray-900 text-sm">${proprio.prenom} ${proprio.nom}</p>
                          <p class="text-xs text-gray-400">${proprio.email}</p>
                        </div>
                      </div>
                      <div class="flex items-center gap-3">
                        ${pendingMs.length > 0 ? `<span class="badge-pending">${pendingMs.length} en attente</span>` : ''}
                        <div class="text-right hidden sm:block">
                          <p class="text-xs text-gray-400">Stock</p>
                          <p class="text-xs font-bold text-indigo-600">${st.stock_515}/${st.stock_510}</p>
                        </div>
                        <div class="text-right">
                          <p class="text-xs text-gray-400">Massiers</p>
                          <p class="font-bold text-gray-700">${ms.length}</p>
                        </div>
                        <svg id="arrow-${proprio.id}" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2" style="transition:transform .2s"><polyline points="9 18 15 12 9 6"/></svg>
                      </div>
                    </button>
                    <div id="tree-${proprio.id}" class="hidden p-3 bg-white/60 border-t border-gray-100">
                      ${ms.length === 0 ? '<p class="text-gray-400 text-sm py-2 text-center">Aucun massier rattaché.</p>' : `
                      <div class="space-y-2">
                        ${ms.map(m => `
                          <div class="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100">
                            <div class="flex items-center gap-2.5">
                              <div class="w-8 h-8 rounded-lg ${m.validated ? 'bg-emerald-100' : 'bg-amber-100'} flex items-center justify-center text-xs font-bold ${m.validated ? 'text-emerald-700' : 'text-amber-700'}">
                                ${m.prenom[0]}${m.nom[0]}
                              </div>
                              <div>
                                <p class="font-semibold text-gray-900 text-sm">${m.prenom} ${m.nom}</p>
                                <p class="text-xs text-gray-400">${m.telephone}</p>
                              </div>
                            </div>
                            <div class="flex items-center gap-2">
                              <span class="${m.validated ? 'badge-ok' : 'badge-pending'}">${m.validated ? '✓' : '⏳'}</span>
                              ${!m.validated ? `<button onclick="validateMassier(${m.id})" class="btn-green">Valider</button>` : ''}
                            </div>
                          </div>
                        `).join('')}
                      </div>`}
                    </div>
                  </div>
                `;
              }).join('')}
            </div>`}
          </div>
        </div>
      </div>
    `;

    $('#createProprioForm').onsubmit = async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const data = Object.fromEntries(fd);
      if (!data.telephone.match(/^(\+?[0-9]{7,15}|0[0-9]{8})$/)) { $('#msg').innerHTML = Message('error', 'Téléphone invalide'); return; }
      showLoading();
      try {
        const result = await apiPost('/api/proprietaires', data);
        hideLoading();
        if (!result.success) { $('#msg').innerHTML = Message('error', result.error || 'Erreur'); return; }
        $('#msg').innerHTML = Message('success', 'Propriétaire créé avec succès !');
        e.target.reset();
        toggleAdminForm();
        setTimeout(() => { const app = $('#app'); const session = getSession(); if (app && session) renderAdminConsole(app, session); }, 600);
      } catch(err) { hideLoading(); $('#msg').innerHTML = Message('error', 'Erreur de connexion'); }
    };
  } catch(err) {
    hideLoading();
    container.innerHTML = `<div class="page"><div class="glass p-8 text-center text-red-600">Erreur de chargement</div></div>`;
  }
}

function toggleAdminForm() {
  const form = document.getElementById('createProprioForm');
  const btn = document.getElementById('toggle-form-btn');
  if (form && btn) {
    form.classList.toggle('hidden');
    btn.textContent = form.classList.contains('hidden') ? '+ Nouveau' : '✕ Fermer';
  }
}

function toggleProprioTree(proprioId) {
  const tree = document.getElementById(`tree-${proprioId}`);
  const arrow = document.getElementById(`arrow-${proprioId}`);
  if (tree && arrow) {
    tree.classList.toggle('hidden');
    arrow.style.transform = tree.classList.contains('hidden') ? 'rotate(0deg)' : 'rotate(90deg)';
  }
}

// ─── EXPOSITION FONCTIONS GLOBALES ───
window.navigate = navigate;
window.render = render;
window.handleLogout = handleLogout;
window.togglePw = togglePw;
window.setMassierTab = setMassierTab;
window.setProprioTab = setProprioTab;
window.addLigne = addLigne;
window.removeLigne = removeLigne;
window.updateLigne = updateLigne;
window.renderLignes = renderLignes;
window.validateMassier = validateMassier;
window.validerRapport = validerRapport;
window.toggleAdminForm = toggleAdminForm;
window.toggleProprioTree = toggleProprioTree;

// ─── INITIALISATION ───
document.addEventListener('DOMContentLoaded', () => {
  currentRoute = window.location.hash.slice(1) || '/';
  render();
});
