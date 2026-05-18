const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 10000;
const DB_FILE = path.join(__dirname, 'db.json');

app.use(express.json());
app.use(express.static(__dirname));

// ─── UTILITAIRES ───
function loadDB() {
  if (fs.existsSync(DB_FILE)) {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  }
  return {
    users: [{
      id: 1, role: 'admin', nom: 'KOUAMÉ', prenom: 'SOSSOU',
      email: 'sossou2026@gmail.com', telephone: '0000000000',
      password_hash: '', proprio_id: null, validated: true,
      created_at: '2024-01-01T00:00:00Z'
    }],
    proprietaire_stock: {},
    ouvrier_rapports: [],
    ouvrier_lignes: [],
    ventes: [],
    validations_financieres: [],
    sequences: { users: 1, ouvrier_rapports: 0, ventes: 0, validations_financieres: 0 }
  };
}

function saveDB(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

function hashPassword(pw) {
  return crypto.createHash('sha256').update(pw + 'sossou-salt-2024').digest('hex');
}

function nextId(seq) {
  const db = loadDB();
  db.sequences[seq] = (db.sequences[seq] || 0) + 1;
  saveDB(db);
  return db.sequences[seq];
}

// Init DB
let db = loadDB();
if (!db.users[0].password_hash) {
  db.users[0].password_hash = hashPassword('admin2024');
  saveDB(db);
}

// ─── ROUTES API ───

// GET DB
app.get('/api/db', (req, res) => {
  res.json(loadDB());
});

// Register
app.post('/api/register', (req, res) => {
  const data = req.body;
  const db = loadDB();
  const existing = db.users.find(u => u.email === data.email || u.telephone === data.telephone);
  if (existing) {
    return res.status(400).json({ error: 'Un compte existe déjà' });
  }
  const user = {
    id: nextId('users'),
    role: 'massier',
    nom: data.nom,
    prenom: data.prenom,
    email: data.email,
    telephone: data.telephone,
    password_hash: hashPassword(data.password),
    proprio_id: data.proprio_id,
    validated: false,
    created_at: new Date().toISOString()
  };
  db.users.push(user);
  saveDB(db);
  res.json({ success: true, message: 'Inscription réussie' });
});

// Login
app.post('/api/login', (req, res) => {
  const { identifier, password } = req.body;
  const db = loadDB();
  const user = db.users.find(u => u.email === identifier || u.telephone === identifier);
  if (!user || user.password_hash !== hashPassword(password)) {
    return res.status(401).json({ error: 'Identifiants incorrects' });
  }
  if (user.role === 'massier' && !user.validated) {
    return res.status(403).json({ error: 'Compte en attente de validation' });
  }
  const userSafe = { ...user };
  delete userSafe.password_hash;
  const redirect = user.role === 'admin' ? '/admin-console' : user.role === 'proprietaire' ? '/proprietaire' : '/massier';
  res.json({ success: true, user: userSafe, redirect });
});

// Create Proprietaire
app.post('/api/proprietaires', (req, res) => {
  const data = req.body;
  const db = loadDB();
  const existing = db.users.find(u => u.email === data.email);
  if (existing) {
    return res.status(400).json({ error: 'Email déjà utilisé' });
  }
  const proprioId = nextId('users');
  db.users.push({
    id: proprioId,
    role: 'proprietaire',
    nom: data.nom,
    prenom: data.prenom,
    email: data.email,
    telephone: data.telephone,
    password_hash: hashPassword(data.password),
    proprio_id: null,
    validated: true,
    created_at: new Date().toISOString()
  });
  db.proprietaire_stock[proprioId] = { stock_515: 0, stock_510: 0 };
  saveDB(db);
  res.json({ success: true, id: proprioId });
});

// Submit Rapport
app.post('/api/rapports', (req, res) => {
  const data = req.body;
  const db = loadDB();
  const rapportId = nextId('ouvrier_rapports');
  db.ouvrier_rapports.push({
    id: rapportId,
    massier_id: data.massier_id,
    date: new Date().toISOString().split('T')[0],
    soumis_at: new Date().toISOString()
  });
  for (const ligne of data.lignes || []) {
    db.ouvrier_lignes.push({
      id: nextId('ouvrier_lignes'),
      rapport_id: rapportId,
      nom_ouvrier: ligne.nom_ouvrier,
      qte_515: ligne.qte_515 || 0,
      qte_510: ligne.qte_510 || 0
    });
  }
  const total515 = (data.lignes || []).reduce((s, l) => s + (l.qte_515 || 0), 0);
  const total510 = (data.lignes || []).reduce((s, l) => s + (l.qte_510 || 0), 0);
  const massier = db.users.find(u => u.id === data.massier_id);
  if (massier && massier.proprio_id) {
    const sid = massier.proprio_id;
    if (!db.proprietaire_stock[sid]) db.proprietaire_stock[sid] = { stock_515: 0, stock_510: 0 };
    db.proprietaire_stock[sid].stock_515 += total515;
    db.proprietaire_stock[sid].stock_510 += total510;
  }
  saveDB(db);
  res.json({ success: true, rapport_id: rapportId });
});

// Submit Vente
app.post('/api/ventes', (req, res) => {
  const data = req.body;
  const db = loadDB();
  const venteId = nextId('ventes');
  db.ventes.push({
    id: venteId,
    massier_id: data.massier_id,
    qte_515: data.qte_515 || 0,
    qte_510: data.qte_510 || 0,
    date_at: new Date().toISOString()
  });
  const massier = db.users.find(u => u.id === data.massier_id);
  if (massier && massier.proprio_id) {
    const sid = massier.proprio_id;
    if (!db.proprietaire_stock[sid]) db.proprietaire_stock[sid] = { stock_515: 0, stock_510: 0 };
    db.proprietaire_stock[sid].stock_515 = Math.max(db.proprietaire_stock[sid].stock_515 - (data.qte_515 || 0), 0);
    db.proprietaire_stock[sid].stock_510 = Math.max(db.proprietaire_stock[sid].stock_510 - (data.qte_510 || 0), 0);
  }
  saveDB(db);
  res.json({ success: true });
});

// Validate Massier
app.post('/api/validate-massier', (req, res) => {
  const db = loadDB();
  const massier = db.users.find(u => u.id === req.body.massier_id);
  if (massier) {
    massier.validated = true;
    saveDB(db);
    return res.json({ success: true });
  }
  res.status(404).json({ error: 'Massier non trouvé' });
});

// Valider Rapport
app.post('/api/valider-rapport', (req, res) => {
  const data = req.body;
  const db = loadDB();
  db.validations_financieres.push({
    id: nextId('validations_financieres'),
    massier_id: data.massier_id,
    rapport_id: data.rapport_id,
    montant_515: data.montant_515 || 0,
    montant_510: data.montant_510 || 0,
    total: (data.montant_515 || 0) + (data.montant_510 || 0),
    valide_at: new Date().toISOString()
  });
  saveDB(db);
  res.json({ success: true });
});

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ─── DÉMARRAGE ───
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 SOSSOU KOUAMÉ Server running on port ${PORT}`);
  console.log(`📁 DB: ${DB_FILE}`);
  console.log(`👤 Admin: sossou2026@gmail.com / admin2024`);
});
