// SOSSOU KOUAMÉ - Gestion Multi-Niveaux
// Application Vanilla JS avec base JSON locale

const PRIX_515 = 1300;
const PRIX_510 = 1400;
const ADMIN_EMAIL = 'sossou2026@gmail.com';

// ─── UTILITAIRES ───
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);
const el = (tag, cls, html) => { const e = document.createElement(tag); if(cls) e.className = cls; if(html) e.innerHTML = html; return e; };

async function hashPassword(pw) {
  const encoder = new TextEncoder();
  const data = encoder.encode(pw + 'sossou-salt-2024');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ─── STOCKAGE VIA API ───
let DB_CACHE = null;

async function loadDB() {
  if (DB_CACHE) return DB_CACHE;
  try {
    const res = await fetch('/api/db');
    DB_CACHE = await res.json();
    return DB_CACHE;
  } catch(e) {
    // Fallback: valeur par défaut
    DB_CACHE = {
      users: [{
        id: 1, role: 'admin', nom: 'KOUAMÉ', prenom: 'SOSSOU',
        email: ADMIN_EMAIL, telephone: '0000000000',
        password_hash: '', proprio_id: null, validated: true,
        created_at: new Date().toISOString()
      }],
      proprietaire_stock: {},
      ouvrier_rapports: [],
      ouvrier_lignes: [],
      ventes: [],
      validations_financieres: [],
      sequences: { users: 1, ouvrier_rapports: 0, ventes: 0, validations_financieres: 0 }
    };
    hashPassword('admin2024').then(h => { DB_CACHE.users[0].password_hash = h; });
    return DB_CACHE;
  }
}

async function apiPost(endpoint, data) {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(data)
  });
  DB_CACHE = null; // Invalidate cache
  return res.json();
}

function saveDB(db) {
  DB_CACHE = db;
}

let DB = loadDB();

let LOCAL_SEQ = { users: 100, ouvrier_rapports: 100, ventes: 100, validations_financieres: 100, ouvrier_lignes: 100 };
function nextId(seq) {
  LOCAL_SEQ[seq] = (LOCAL_SEQ[seq] || 100) + 1;
  return LOCAL_SEQ[seq];
}

// ─── SESSION ───
let __session = null;

function getSession() {
  if (__session) return __session;
  try {
    const raw = sessionStorage.getItem('sossou_session');
    if (raw) { __session = JSON.parse(raw); return __session; }
  } catch(e) {}
  return null;
}

function setSession(user) {
  __session = user;
  try { sessionStorage.setItem('sossou_session', JSON.stringify(user)); } catch(e) {}
}

function clearSession() {
  __session = null;
  try { sessionStorage.removeItem('sossou_session'); } catch(e) {}
}

function handleLogout() {
  clearSession();
  navigate('/');
}

// ─── ROUTER ───
let currentRoute = '/';

function navigate(path) {
  currentRoute = path;
  window.history.pushState({}, '', '#' + path);
  render();
}

window.addEventListener('popstate', () => {
  currentRoute = window.location.hash.slice(1) || '/';
  render();
});

// ─── RENDU ───
function render() {
  const app = $('#app');
  const path = currentRoute;
  const session = getSession();

  if (path === '/') renderHome(app);
  else if (path === '/register') renderRegister(app);
  else if (path === '/login') renderLogin(app);
  else if (path === '/admin') renderAdminLogin(app);
  else if (path === '/massier') {
    if (!session || session.role !== 'massier') { navigate('/login'); return; }
    renderMassier(app, session);
  }
  else if (path === '/proprietaire') {
    if (!session || session.role !== 'proprietaire') { navigate('/login'); return; }
    renderProprietaire(app, session);
  }
  else if (path === '/admin-console') {
    if (!session || session.role !== 'admin') { navigate('/admin'); return; }
    renderAdminConsole(app, session);
  }
  else renderHome(app);
}

// ─── COMPOSANTS UI ───
function Header(title, subtitle, session, showLogout = true) {
  return `
    <div class="glass p-6 mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">${title}</h1>
        ${subtitle ? `<p class="text-gray-600 mt-1">${subtitle}</p>` : ''}
      </div>
      ${showLogout ? `
      <button onclick="handleLogout()" class="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors cursor-pointer">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        Déconnexion
      </button>` : ''}
    </div>
  `;
}

function Message(type, text) {
  const colors = type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700';
  const icon = type === 'error'
    ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>'
    : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>';
  return `<div class="mb-4 p-4 ${colors} border rounded-xl text-sm flex items-center gap-2">${icon}${text}</div>`;
}

// ─── PAGE ACCUEIL ───
function renderHome(container) {
  container.innerHTML = `
    <div class="page">
      <div class="glass p-8 md:p-12 max-w-2xl w-full text-center">
        <div class="mb-8">
          <div class="w-20 h-20 mx-auto bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl mb-4">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M17 18h1"/><path d="M12 18h1"/><path d="M7 18h1"/></svg>
          </div>
          <h1 class="text-3xl md:text-4xl font-bold text-gray-900 mb-2">SOSSOU KOUAMÉ</h1>
          <p class="text-lg text-gray-600 font-medium">Gestion Multi-Niveaux</p>
          <p class="text-sm text-gray-500 mt-2">Appolinaire — Système de gestion des ouvriers et ventes</p>
        </div>

        <div class="space-y-4">
          <button onclick="navigate('/register')" class="w-full flex items-center justify-center gap-3 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:bg-indigo-700 transition-all duration-200 transform hover:scale-105 active:scale-95 cursor-pointer">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
            Inscription Massier
          </button>

          <button onclick="navigate('/login')" class="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white/90 text-indigo-600 font-semibold rounded-xl shadow-lg hover:bg-white transition-all duration-200 transform hover:scale-105 active:scale-95 border border-indigo-200 cursor-pointer">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
            Connexion
          </button>

          <button onclick="navigate('/admin')" class="w-full flex items-center justify-center gap-3 px-6 py-3 bg-gray-800 text-white font-semibold rounded-xl shadow-lg hover:bg-gray-900 transition-all duration-200 transform hover:scale-105 active:scale-95 cursor-pointer">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            Espace Administrateur
          </button>
        </div>

        <div class="mt-8 pt-6 border-t border-gray-200">
          <p class="text-sm text-gray-500 flex items-center justify-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            Contact: +229 01 67 92 40 76
          </p>
          <p class="text-xs text-gray-400 mt-2">© 2024 Sossou Kouamé Appolinaire. Tous droits réservés.</p>
        </div>
      </div>
    </div>
  `;
}

// ─── PAGE INSCRIPTION ───
async function renderRegister(container) {
  const proprios = DB.users.filter(u => u.role === 'proprietaire');

  container.innerHTML = `
    <div class="page">
      <div class="glass p-8 max-w-lg w-full">
        <button onclick="navigate('/')" class="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 transition-colors cursor-pointer">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          Retour
        </button>

        <h2 class="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="indigo" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
          Inscription Massier
        </h2>

        <div id="msg"></div>

        <form id="registerForm" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Nom</label>
              <input type="text" name="nom" required class="inp" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
              <input type="text" name="prenom" required class="inp" />
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" name="email" required class="inp" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
            <input type="tel" name="telephone" required placeholder="0XXXXXXXX" pattern="0[0-9]{8}" class="inp" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Propriétaire</label>
            <select name="proprio_id" required class="inp">
              <option value="">Choisir un propriétaire...</option>
              ${proprios.map(p => `<option value="${p.id}">${p.prenom} ${p.nom}</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
            <input type="password" name="password" required minlength="6" class="inp" />
          </div>
          <button type="submit" class="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:bg-indigo-700 transition-all duration-200 cursor-pointer">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
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

    if (!data.telephone.match(/^0[0-9]{8}$/)) {
      $('#msg').innerHTML = Message('error', 'Téléphone invalide (format: 0XXXXXXXX)');
      return;
    }

    const existing = DB.users.find(u => u.email === data.email || u.telephone === data.telephone);
    if (existing) {
      $('#msg').innerHTML = Message('error', 'Un compte existe déjà avec cet email ou téléphone');
      return;
    }

    const hash = await hashPassword(data.password);
    const user = {
      id: nextId('users'),
      role: 'massier',
      nom: data.nom,
      prenom: data.prenom,
      email: data.email,
      telephone: data.telephone,
      password_hash: hash,
      proprio_id: parseInt(data.proprio_id),
      validated: false,
      created_at: new Date().toISOString()
    };

    DB.users.push(user);
    saveDB(DB);

    container.innerHTML = `
      <div class="page">
        <div class="glass p-8 max-w-md w-full text-center">
          <div class="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="green" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
          </div>
          <h2 class="text-2xl font-bold text-gray-900 mb-2">Inscription réussie !</h2>
          <p class="text-gray-600 mb-6">Votre compte a été créé. En attente de validation par le propriétaire.</p>
          <button onclick="navigate('/login')" class="w-full px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:bg-indigo-700 transition-all cursor-pointer">
            Aller à la connexion
          </button>
        </div>
      </div>
    `;
  };
}

// ─── PAGE CONNEXION ───
async function renderLogin(container) {
  container.innerHTML = `
    <div class="page">
      <div class="glass p-8 max-w-md w-full">
        <button onclick="navigate('/')" class="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 transition-colors cursor-pointer">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          Retour
        </button>

        <h2 class="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="indigo" stroke-width="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
          Connexion
        </h2>

        <div id="msg"></div>

        <form id="loginForm" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Email ou Téléphone</label>
            <input type="text" name="identifier" required placeholder="email@example.com ou 0XXXXXXXX" class="inp" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
            <input type="password" name="password" required class="inp" />
          </div>
          <button type="submit" class="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:bg-indigo-700 transition-all cursor-pointer">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
            Se connecter
          </button>
        </form>

        <p class="mt-4 text-center text-sm text-gray-500">
          Pas encore de compte ?
          <button onclick="navigate('/register')" class="text-indigo-600 hover:underline font-medium cursor-pointer">S'inscrire</button>
        </p>
      </div>
    </div>
  `;

  $('#loginForm').onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const identifier = fd.get('identifier');
    const password = fd.get('password');

    const user = DB.users.find(u => u.email === identifier || u.telephone === identifier);
    if (!user) {
      $('#msg').innerHTML = Message('error', 'Identifiants incorrects');
      return;
    }

    const hash = await hashPassword(password);
    if (user.password_hash !== hash) {
      $('#msg').innerHTML = Message('error', 'Identifiants incorrects');
      return;
    }

    if (user.role === 'massier' && !user.validated) {
      $('#msg').innerHTML = Message('error', 'Votre compte est en attente de validation par le propriétaire');
      return;
    }

    setSession({ id: user.id, email: user.email, role: user.role, nom: user.nom, prenom: user.prenom, proprio_id: user.proprio_id });

    if (user.role === 'admin') navigate('/admin-console');
    else if (user.role === 'proprietaire') navigate('/proprietaire');
    else navigate('/massier');
  };
}

// ─── PAGE ADMIN LOGIN ───
async function renderAdminLogin(container) {
  container.innerHTML = `
    <div class="page">
      <div class="glass p-8 max-w-md w-full">
        <button onclick="navigate('/')" class="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 transition-colors cursor-pointer">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          Retour
        </button>

        <h2 class="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-3">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="indigo" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          Espace Administrateur
        </h2>
        <p class="text-sm text-gray-500 mb-6">Connexion sécurisée réservée à l'admin</p>

        <div id="msg"></div>

        <form id="adminForm" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Email Admin</label>
            <input type="email" name="email" required class="inp" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
            <input type="password" name="password" required class="inp" />
          </div>
          <button type="submit" class="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:bg-indigo-700 transition-all cursor-pointer">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            Accéder
          </button>
        </form>
      </div>
    </div>
  `;

  $('#adminForm').onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const email = fd.get('email');
    const password = fd.get('password');

    const user = DB.users.find(u => u.email === email && u.role === 'admin');
    if (!user) {
      $('#msg').innerHTML = Message('error', 'Accès refusé');
      return;
    }

    const hash = await hashPassword(password);
    if (user.password_hash !== hash) {
      $('#msg').innerHTML = Message('error', 'Mot de passe incorrect');
      return;
    }

    setSession({ id: user.id, email: user.email, role: user.role, nom: user.nom, prenom: user.prenom });
    navigate('/admin-console');
  };
}

// ─── PAGE MASSIER ───
function renderMassier(container, session) {
  const user = DB.users.find(u => u.id === session.id);
  const validations = DB.validations_financieres.filter(v => v.massier_id === session.id);

  container.innerHTML = `
    <div class="min-h-screen p-4 md:p-8">
      <div class="max-w-4xl mx-auto">
        ${Header('Espace Massier', `${session.prenom} ${session.nom}`, session)}

        <div id="msg"></div>

        <div class="flex gap-2 mb-6">
          <button onclick="setMassierTab('rapport')" id="tab-rapport" class="tab tab-active">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            Point Ouvriers
          </button>
          <button onclick="setMassierTab('vente')" id="tab-vente" class="tab tab-inactive">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
            Déclarer Vente
          </button>
          <button onclick="setMassierTab('validations')" id="tab-validations" class="tab tab-inactive">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            Validations
          </button>
        </div>

        <div id="massier-content"></div>
      </div>
    </div>
  `;

  window.massierTab = 'rapport';
  window.massierLignes = [{ nom_ouvrier: '', qte_515: '', qte_510: '' }];
  renderMassierContent();
}

function setMassierTab(tab) {
  window.massierTab = tab;
  $$('.tab').forEach(t => t.className = 'tab tab-inactive');
  $(`#tab-${tab}`).className = 'tab tab-active';
  renderMassierContent();
}

function renderMassierContent() {
  const container = $('#massier-content');
  const session = getSession();

  if (window.massierTab === 'rapport') {
    container.innerHTML = `
      <div class="glass p-6">
        <h3 class="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="indigo" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          Point des Ouvriers
        </h3>
        <p class="text-sm text-gray-500 mb-4">Prix: 5/15 = ${PRIX_515} F | 5/10 = ${PRIX_510} F</p>

        <form id="rapportForm" class="space-y-4">
          <div id="lignes-container"></div>
          <div class="flex gap-3">
            <button type="button" onclick="addLigne()" class="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Ajouter un ouvrier
            </button>
            <button type="submit" class="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:bg-indigo-700 transition-all cursor-pointer">
              Soumettre le rapport
            </button>
          </div>
        </form>
      </div>
    `;
    renderLignes();

    $('#rapportForm').onsubmit = (e) => {
      e.preventDefault();
      const lignesData = window.massierLignes
        .filter(l => l.nom_ouvrier.trim())
        .map(l => ({ nom_ouvrier: l.nom_ouvrier, qte_515: parseInt(l.qte_515) || 0, qte_510: parseInt(l.qte_510) || 0 }));

      if (lignesData.length === 0) {
        $('#msg').innerHTML = Message('error', 'Ajoutez au moins un ouvrier');
        return;
      }

      const rapportId = nextId('ouvrier_rapports');
      DB.ouvrier_rapports.push({
        id: rapportId, massier_id: session.id,
        date: new Date().toISOString().split('T')[0],
        soumis_at: new Date().toISOString()
      });

      lignesData.forEach(l => {
        DB.ouvrier_lignes.push({
          id: nextId('ouvrier_lignes'),
          rapport_id: rapportId,
          ...l
        });
      });

      const total515 = lignesData.reduce((s, l) => s + l.qte_515, 0);
      const total510 = lignesData.reduce((s, l) => s + l.qte_510, 0);
      const stock = DB.proprietaire_stock[session.proprio_id] || { stock_515: 0, stock_510: 0 };
      stock.stock_515 += total515;
      stock.stock_510 += total510;
      DB.proprietaire_stock[session.proprio_id] = stock;

      saveDB(DB);
      window.massierLignes = [{ nom_ouvrier: '', qte_515: '', qte_510: '' }];
      $('#msg').innerHTML = Message('success', 'Rapport soumis avec succès !');
      renderLignes();
    };
  }

  else if (window.massierTab === 'vente') {
    container.innerHTML = `
      <div class="glass p-6">
        <h3 class="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="indigo" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
          Déclarer une Vente
        </h3>
        <form id="venteForm" class="space-y-4 max-w-md">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Quantité 5/15</label>
            <input type="number" name="qte_515" min="0" value="0" class="inp" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Quantité 5/10</label>
            <input type="number" name="qte_510" min="0" value="0" class="inp" />
          </div>
          <button type="submit" class="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:bg-indigo-700 transition-all cursor-pointer">
            Déclarer la vente
          </button>
        </form>
      </div>
    `;

    $('#venteForm').onsubmit = (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const qte515 = parseInt(fd.get('qte_515')) || 0;
      const qte510 = parseInt(fd.get('qte_510')) || 0;

      DB.ventes.push({
        id: nextId('ventes'),
        massier_id: session.id,
        qte_515: qte515,
        qte_510: qte510,
        date_at: new Date().toISOString()
      });

      const stock = DB.proprietaire_stock[session.proprio_id] || { stock_515: 0, stock_510: 0 };
      stock.stock_515 = Math.max(stock.stock_515 - qte515, 0);
      stock.stock_510 = Math.max(stock.stock_510 - qte510, 0);
      DB.proprietaire_stock[session.proprio_id] = stock;

      saveDB(DB);
      $('#msg').innerHTML = Message('success', 'Vente déclarée avec succès !');
      e.target.reset();
    };
  }

  else if (window.massierTab === 'validations') {
    const validations = DB.validations_financieres.filter(v => v.massier_id === session.id);
    container.innerHTML = `
      <div class="glass p-6">
        <h3 class="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="indigo" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
          Validations Financières
        </h3>
        ${validations.length === 0
          ? '<p class="text-gray-500 text-center py-8">Aucune validation reçue pour le moment.</p>'
          : `<div class="space-y-3">${validations.map(v => `
            <div class="p-4 bg-white/50 rounded-xl border border-gray-100">
              <div class="flex justify-between items-start">
                <div>
                  <p class="font-medium text-gray-900">Validation #${v.id}</p>
                  <p class="text-sm text-gray-500">${new Date(v.valide_at).toLocaleDateString('fr-FR')}</p>
                </div>
                <div class="text-right">
                  <p class="text-lg font-bold text-indigo-600">${v.total.toLocaleString()} F</p>
                </div>
              </div>
              <div class="mt-2 flex gap-4 text-sm text-gray-600">
                <span>5/15: ${v.montant_515.toLocaleString()} F</span>
                <span>5/10: ${v.montant_510.toLocaleString()} F</span>
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
    <div class="flex gap-3 items-end">
      <div class="flex-1">
        <label class="block text-xs font-medium text-gray-600 mb-1">Nom Ouvrier</label>
        <input type="text" value="${l.nom_ouvrier}" onchange="updateLigne(${i}, 'nom_ouvrier', this.value)" class="inp" />
      </div>
      <div class="w-24">
        <label class="block text-xs font-medium text-gray-600 mb-1">5/15</label>
        <input type="number" min="0" value="${l.qte_515}" onchange="updateLigne(${i}, 'qte_515', this.value)" class="inp" />
      </div>
      <div class="w-24">
        <label class="block text-xs font-medium text-gray-600 mb-1">5/10</label>
        <input type="number" min="0" value="${l.qte_510}" onchange="updateLigne(${i}, 'qte_510', this.value)" class="inp" />
      </div>
      ${window.massierLignes.length > 1 ? `
      <button type="button" onclick="removeLigne(${i})" class="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors mb-1 cursor-pointer">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
      </button>` : ''}
    </div>
  `).join('');
}

function updateLigne(index, field, value) {
  window.massierLignes[index][field] = value;
}

function addLigne() {
  window.massierLignes.push({ nom_ouvrier: '', qte_515: '', qte_510: '' });
  renderLignes();
}

function removeLigne(index) {
  window.massierLignes.splice(index, 1);
  renderLignes();
}

// ─── PAGE PROPRIÉTAIRE ───
function renderProprietaire(container, session) {
  const massiers = DB.users.filter(u => u.role === 'massier' && u.proprio_id === session.id);
  const pending = massiers.filter(m => !m.validated);
  const stock = DB.proprietaire_stock[session.id] || { stock_515: 0, stock_510: 0 };
  const rapports = DB.ouvrier_rapports.filter(r => {
    const m = DB.users.find(u => u.id === r.massier_id);
    return m && m.proprio_id === session.id;
  });
  const ventes = DB.ventes.filter(v => {
    const m = DB.users.find(u => u.id === v.massier_id);
    return m && m.proprio_id === session.id;
  });

  container.innerHTML = `
    <div class="min-h-screen p-4 md:p-8">
      <div class="max-w-5xl mx-auto">
        ${Header('Espace Propriétaire', `${session.prenom} ${session.nom}`, session)}

        <div id="msg"></div>

        <div class="grid grid-cols-2 gap-4 mb-6">
          <div class="glass p-4 text-center">
            <p class="text-sm text-gray-500">Stock Terrain 5/15</p>
            <p class="text-3xl font-bold text-indigo-600">${stock.stock_515}</p>
          </div>
          <div class="glass p-4 text-center">
            <p class="text-sm text-gray-500">Stock Terrain 5/10</p>
            <p class="text-3xl font-bold text-purple-600">${stock.stock_510}</p>
          </div>
        </div>

        <div class="flex gap-2 mb-6 flex-wrap">
          <button onclick="setProprioTab('massiers')" id="ptab-massiers" class="tab tab-active">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            Massiers (${massiers.length})
          </button>
          <button onclick="setProprioTab('stock')" id="ptab-stock" class="tab tab-inactive">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
            Stock & Mouvements
          </button>
          <button onclick="setProprioTab('rapports')" id="ptab-rapports" class="tab tab-inactive">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
            Rapports (${rapports.length})
          </button>
          <button onclick="setProprioTab('ventes')" id="ptab-ventes" class="tab tab-inactive">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
            Ventes (${ventes.length})
          </button>
        </div>

        <div id="proprio-content"></div>
      </div>
    </div>
  `;

  window.proprioTab = 'massiers';
  window.proprioData = { massiers, pending, stock, rapports, ventes };
  renderProprioContent();
}

function setProprioTab(tab) {
  window.proprioTab = tab;
  const tabs = document.querySelectorAll('#proprio-content').parentElement.querySelectorAll('.tab');
  tabs.forEach(t => t.className = 'tab tab-inactive');
  const activeTab = document.getElementById(`ptab-${tab}`);
  if (activeTab) activeTab.className = 'tab tab-active';
  renderProprioContent();
}

function renderProprioContent() {
  const container = $('#proprio-content');
  if (!container) return;
  const { massiers, pending, stock, rapports, ventes } = window.proprioData;
  const session = getSession();

  if (window.proprioTab === 'massiers') {
    container.innerHTML = `
      <div class="space-y-6">
        ${pending.length > 0 ? `
        <div class="glass p-6 border-l-4 border-yellow-400">
          <h3 class="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="orange" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            Massiers en attente (${pending.length})
          </h3>
          <div class="space-y-3">
            ${pending.map(m => `
              <div class="flex items-center justify-between p-4 bg-yellow-50 rounded-xl">
                <div>
                  <p class="font-medium text-gray-900">${m.prenom} ${m.nom}</p>
                  <p class="text-sm text-gray-500">${m.email} · ${m.telephone}</p>
                </div>
                <button onclick="validateMassier(${m.id})" class="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  Valider
                </button>
              </div>
            `).join('')}
          </div>
        </div>` : ''}

        <div class="glass p-6">
          <h3 class="text-lg font-bold text-gray-900 mb-4">Tous les massiers</h3>
          ${massiers.length === 0 ? '<p class="text-gray-500 text-center py-8">Aucun massier enregistré.</p>' : `
          <div class="space-y-3">
            ${massiers.map(m => `
              <div class="p-4 bg-white/50 rounded-xl border border-gray-100 flex items-center justify-between">
                <div>
                  <p class="font-medium text-gray-900">${m.prenom} ${m.nom}</p>
                  <p class="text-sm text-gray-500">${m.email} · ${m.telephone}</p>
                </div>
                <span class="px-3 py-1 rounded-full text-xs font-medium ${m.validated ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}">
                  ${m.validated ? 'Validé' : 'En attente'}
                </span>
              </div>
            `).join('')}
          </div>`}
        </div>
      </div>
    `;
  }

  else if (window.proprioTab === 'stock') {
    const allMouvements = [
      ...rapports.map(r => {
        const lignes = DB.ouvrier_lignes.filter(l => l.rapport_id === r.id);
        const total515 = lignes.reduce((s, l) => s + l.qte_515, 0);
        const total510 = lignes.reduce((s, l) => s + l.qte_510, 0);
        const m = DB.users.find(u => u.id === r.massier_id);
        return { type: 'rapport', id: r.id, qte_515: total515, qte_510: total510, date: r.soumis_at, nom: m ? `${m.prenom} ${m.nom}` : 'Inconnu' };
      }),
      ...ventes.map(v => {
        const m = DB.users.find(u => u.id === v.massier_id);
        return { type: 'vente', id: v.id, qte_515: v.qte_515, qte_510: v.qte_510, date: v.date_at, nom: m ? `${m.prenom} ${m.nom}` : 'Inconnu' };
      })
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    container.innerHTML = `
      <div class="glass p-6">
        <h3 class="text-lg font-bold text-gray-900 mb-4">Mouvements de Stock</h3>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead><tr class="border-b border-gray-200">
              <th class="text-left py-3 px-2">Type</th>
              <th class="text-right py-3 px-2">5/15</th>
              <th class="text-right py-3 px-2">5/10</th>
              <th class="text-right py-3 px-2">Date</th>
            </tr></thead>
            <tbody>
              ${allMouvements.map(m => `
                <tr class="border-b border-gray-100">
                  <td class="py-3 px-2">
                    <span class="flex items-center gap-1 ${m.type === 'rapport' ? 'text-green-600' : 'text-red-600'}">
                      ${m.type === 'rapport'
                        ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>'
                        : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>'}
                      ${m.type === 'rapport' ? 'Rapport' : 'Vente'} (${m.nom})
                    </span>
                  </td>
                  <td class="text-right py-3 px-2 font-medium ${m.type === 'rapport' ? 'text-green-600' : 'text-red-600'}">${m.type === 'rapport' ? '+' : '-'}${m.qte_515}</td>
                  <td class="text-right py-3 px-2 font-medium ${m.type === 'rapport' ? 'text-green-600' : 'text-red-600'}">${m.type === 'rapport' ? '+' : '-'}${m.qte_510}</td>
                  <td class="text-right py-3 px-2 text-gray-500">${new Date(m.date).toLocaleDateString('fr-FR')}</td>
                </tr>
              `).join('')}
              ${allMouvements.length === 0 ? '<tr><td colspan="4" class="text-center py-8 text-gray-500">Aucun mouvement enregistré.</td></tr>' : ''}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  else if (window.proprioTab === 'rapports') {
    container.innerHTML = `
      <div class="space-y-4">
        ${rapports.length === 0 ? '<div class="glass p-6 text-center text-gray-500">Aucun rapport reçu.</div>' : ''}
        ${rapports.map(r => {
          const lignes = DB.ouvrier_lignes.filter(l => l.rapport_id === r.id);
          const total515 = lignes.reduce((s, l) => s + l.qte_515, 0);
          const total510 = lignes.reduce((s, l) => s + l.qte_510, 0);
          const m = DB.users.find(u => u.id === r.massier_id);
          const alreadyValidated = DB.validations_financieres.some(v => v.rapport_id === r.id);
          return `
            <div class="glass p-6">
              <div class="flex items-center justify-between mb-4">
                <div>
                  <p class="font-bold text-gray-900">Rapport #${r.id} — ${m ? m.prenom + ' ' + m.nom : 'Inconnu'}</p>
                  <p class="text-sm text-gray-500">${new Date(r.soumis_at).toLocaleDateString('fr-FR')}</p>
                </div>
                <div class="text-right">
                  <p class="text-sm text-gray-600">5/15: <span class="font-bold text-indigo-600">${total515}</span></p>
                  <p class="text-sm text-gray-600">5/10: <span class="font-bold text-purple-600">${total510}</span></p>
                </div>
              </div>
              ${alreadyValidated ? `
                <div class="p-3 bg-green-50 rounded-lg text-green-700 text-sm flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  Déjà validé financièrement
                </div>
              ` : `
                <div class="bg-gray-50 rounded-xl p-4">
                  <p class="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                    Validation financière
                  </p>
                  <div class="flex gap-3 items-end" id="val-form-${r.id}">
                    <div>
                      <label class="block text-xs text-gray-500 mb-1">Montant 5/15 (F)</label>
                      <input type="number" id="val-515-${r.id}" min="0" value="${total515 * PRIX_515}" class="inp w-32" />
                    </div>
                    <div>
                      <label class="block text-xs text-gray-500 mb-1">Montant 5/10 (F)</label>
                      <input type="number" id="val-510-${r.id}" min="0" value="${total510 * PRIX_510}" class="inp w-32" />
                    </div>
                    <button onclick="validerRapport(${r.id}, ${r.massier_id})" class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors cursor-pointer">
                      Valider
                    </button>
                  </div>
                </div>
              `}
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  else if (window.proprioTab === 'ventes') {
    container.innerHTML = `
      <div class="glass p-6">
        <h3 class="text-lg font-bold text-gray-900 mb-4">Historique des Ventes</h3>
        ${ventes.length === 0 ? '<p class="text-gray-500 text-center py-8">Aucune vente déclarée.</p>' : `
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead><tr class="border-b border-gray-200">
              <th class="text-left py-3 px-2">Massier</th>
              <th class="text-right py-3 px-2">5/15</th>
              <th class="text-right py-3 px-2">5/10</th>
              <th class="text-right py-3 px-2">Date</th>
            </tr></thead>
            <tbody>
              ${ventes.map(v => {
                const m = DB.users.find(u => u.id === v.massier_id);
                return `
                  <tr class="border-b border-gray-100">
                    <td class="py-3 px-2">${m ? m.prenom + ' ' + m.nom : 'Inconnu'}</td>
                    <td class="text-right py-3 px-2 font-medium">${v.qte_515}</td>
                    <td class="text-right py-3 px-2 font-medium">${v.qte_510}</td>
                    <td class="text-right py-3 px-2 text-gray-500">${new Date(v.date_at).toLocaleDateString('fr-FR')}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>`}
      </div>
    `;
  }
}

function validateMassier(massierId) {
  const m = DB.users.find(u => u.id === massierId);
  if (m) {
    m.validated = true;
    saveDB(DB);
    const msgDiv = document.getElementById('msg');
    if (msgDiv) msgDiv.innerHTML = Message('success', 'Massier validé avec succès !');
    setTimeout(() => {
      const app = document.getElementById('app');
      const session = getSession();
      if (app && session) renderProprietaire(app, session);
    }, 500);
  }
}

function validerRapport(rapportId, massierId) {
  const el515 = document.getElementById(`val-515-${rapportId}`);
  const el510 = document.getElementById(`val-510-${rapportId}`);
  const m515 = el515 ? (parseInt(el515.value) || 0) : 0;
  const m510 = el510 ? (parseInt(el510.value) || 0) : 0;

  DB.validations_financieres.push({
    id: nextId('validations_financieres'),
    massier_id: massierId,
    rapport_id: rapportId,
    montant_515: m515,
    montant_510: m510,
    total: m515 + m510,
    valide_at: new Date().toISOString()
  });

  saveDB(DB);
  const msgDiv = document.getElementById('msg');
  if (msgDiv) msgDiv.innerHTML = Message('success', 'Rapport validé financièrement');
  setTimeout(() => {
    const app = document.getElementById('app');
    const session = getSession();
    if (app && session) renderProprietaire(app, session);
  }, 500);
}

// ─── PAGE ADMIN CONSOLE ───
function renderAdminConsole(container, session) {
  const proprios = DB.users.filter(u => u.role === 'proprietaire');

  container.innerHTML = `
    <div class="min-h-screen p-4 md:p-8">
      <div class="max-w-5xl mx-auto">
        ${Header('Console Administrateur', `${session.prenom} ${session.nom} (${session.email})`, session)}

        <div id="msg"></div>

        <div class="glass p-6 mb-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-bold text-gray-900 flex items-center gap-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="indigo" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
              Créer un Propriétaire
            </h2>
            <button onclick="toggleAdminForm()" class="text-indigo-600 hover:underline cursor-pointer" id="toggle-form-btn">
              Afficher le formulaire
            </button>
          </div>

          <form id="createProprioForm" class="space-y-4 hidden">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                <input type="text" name="nom" required class="inp" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
                <input type="text" name="prenom" required class="inp" />
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" name="email" required class="inp" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
              <input type="tel" name="telephone" required placeholder="0XXXXXXXX" pattern="0[0-9]{8}" class="inp" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
              <input type="password" name="password" required minlength="6" class="inp" />
            </div>
            <button type="submit" class="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:bg-indigo-700 transition-all cursor-pointer">
              Créer le propriétaire
            </button>
          </form>
        </div>

        <div class="glass p-6">
          <h2 class="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="indigo" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M2 12h20"/></svg>
            Arborescence Globale (${proprios.length} propriétaires)
          </h2>

          ${proprios.length === 0 ? '<p class="text-gray-500 text-center py-8">Aucun propriétaire enregistré.</p>' : `
          <div class="space-y-4">
            ${proprios.map(proprio => {
              const massiers = DB.users.filter(u => u.role === 'massier' && u.proprio_id === proprio.id);
              const stock = DB.proprietaire_stock[proprio.id] || { stock_515: 0, stock_510: 0 };
              return `
                <div class="border border-gray-200 rounded-xl overflow-hidden">
                  <button onclick="toggleProprioTree(${proprio.id})" class="w-full p-4 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between cursor-pointer">
                    <div class="flex items-center gap-3">
                      <div class="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="indigo" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                      </div>
                      <div class="text-left">
                        <p class="font-bold text-gray-900">${proprio.prenom} ${proprio.nom}</p>
                        <p class="text-sm text-gray-500">${proprio.email}</p>
                      </div>
                    </div>
                    <div class="flex items-center gap-4">
                      <div class="text-right">
                        <p class="text-xs text-gray-500">Stock 5/15</p>
                        <p class="font-bold text-indigo-600">${stock.stock_515}</p>
                      </div>
                      <div class="text-right">
                        <p class="text-xs text-gray-500">Stock 5/10</p>
                        <p class="font-bold text-purple-600">${stock.stock_510}</p>
                      </div>
                      <div class="text-right">
                        <p class="text-xs text-gray-500">Massiers</p>
                        <p class="font-bold text-gray-700">${massiers.length}</p>
                      </div>
                      <svg id="arrow-${proprio.id}" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="gray" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
                    </div>
                  </button>

                  <div id="tree-${proprio.id}" class="hidden p-4 bg-white/50">
                    ${massiers.length === 0 ? '<p class="text-gray-500 text-sm py-2">Aucun massier rattaché.</p>' : `
                    <div class="space-y-2">
                      ${massiers.map(m => `
                        <div class="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100">
                          <div class="flex items-center gap-3">
                            <div class="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="purple" stroke-width="2"><path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M17 18h1"/><path d="M12 18h1"/><path d="M7 18h1"/></svg>
                            </div>
                            <div>
                              <p class="font-medium text-gray-900">${m.prenom} ${m.nom}</p>
                              <p class="text-xs text-gray-500">${m.email} · ${m.telephone}</p>
                            </div>
                          </div>
                          <span class="px-2 py-1 rounded-full text-xs font-medium ${m.validated ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}">
                            ${m.validated ? 'Validé' : 'En attente'}
                          </span>
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

    if (!data.telephone.match(/^0[0-9]{8}$/)) {
      $('#msg').innerHTML = Message('error', 'Téléphone invalide');
      return;
    }

    const existing = DB.users.find(u => u.email === data.email);
    if (existing) {
      $('#msg').innerHTML = Message('error', 'Email déjà utilisé');
      return;
    }

    const hash = await hashPassword(data.password);
    const proprioId = nextId('users');
    DB.users.push({
      id: proprioId,
      role: 'proprietaire',
      nom: data.nom,
      prenom: data.prenom,
      email: data.email,
      telephone: data.telephone,
      password_hash: hash,
      proprio_id: null,
      validated: true,
      created_at: new Date().toISOString()
    });

    DB.proprietaire_stock[proprioId] = { stock_515: 0, stock_510: 0 };
    saveDB(DB);

    $('#msg').innerHTML = Message('success', 'Propriétaire créé avec succès !');
    e.target.reset();
    toggleAdminForm();
    setTimeout(() => {
      const app = document.getElementById('app');
      const session = getSession();
      if (app && session) renderAdminConsole(app, session);
    }, 500);
  };
}

function toggleAdminForm() {
  const form = document.getElementById('createProprioForm');
  const btn = document.getElementById('toggle-form-btn');
  if (form && btn) {
    form.classList.toggle('hidden');
    btn.textContent = form.classList.contains('hidden') ? 'Afficher le formulaire' : 'Masquer le formulaire';
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


// ─── EXPOSITION FONCTIONS GLOBALES (pour onclick) ───
window.navigate = navigate;
window.render = render;
window.handleLogout = handleLogout;
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
