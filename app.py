#!/usr/bin/env python3
"""
SOSSOU KOUAMÉ - Gestion Multi-Niveaux
Serveur HTTP minimal pour Render.com
"""

import os
import json
import hashlib
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

PORT = int(os.environ.get('PORT', 1000))
DB_FILE = 'db.json'

# ─── UTILITAIRES ───
def load_db():
    if os.path.exists(DB_FILE):
        with open(DB_FILE, 'r') as f:
            return json.load(f)
    return {
        "users": [{
            "id": 1, "role": "admin", "nom": "KOUAMÉ", "prenom": "SOSSOU",
            "email": "sossou2026@gmail.com", "telephone": "0000000000",
            "password_hash": "", "proprio_id": None, "validated": True,
            "created_at": "2024-01-01T00:00:00Z"
        }],
        "proprietaire_stock": {},
        "ouvrier_rapports": [],
        "ouvrier_lignes": [],
        "ventes": [],
        "validations_financieres": [],
        "sequences": {"users": 1, "ouvrier_rapports": 0, "ventes": 0, "validations_financieres": 0}
    }

def save_db(db):
    with open(DB_FILE, 'w') as f:
        json.dump(db, f, indent=2)

def hash_password(pw):
    return hashlib.sha256((pw + 'sossou-salt-2024').encode()).hexdigest()

# Init DB
db = load_db()
if not db['users'][0].get('password_hash'):
    db['users'][0]['password_hash'] = hash_password('admin2024')
    save_db(db)

def next_id(seq):
    db['sequences'][seq] = db['sequences'].get(seq, 0) + 1
    save_db(db)
    return db['sequences'][seq]

# ─── MIME TYPES ───
MIME_TYPES = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.css': 'text/css',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
}

# ─── SERVEUR HTTP ───
class Handler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        pass

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path

        # API: GET DB
        if path == '/api/db':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(load_db()).encode())
            return

        # Static files
        if path == '/':
            path = '/index.html'

        file_path = path.lstrip('/')
        if not os.path.exists(file_path):
            self.send_error(404)
            return

        ext = os.path.splitext(file_path)[1].lower()
        content_type = MIME_TYPES.get(ext, 'application/octet-stream')

        with open(file_path, 'rb') as f:
            content = f.read()

        self.send_response(200)
        self.send_header('Content-Type', content_type)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(content)

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path

        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length).decode() if content_length else '{}'

        try:
            data = json.loads(body)
        except:
            data = {}

        db = load_db()
        response = {"success": False}

        # API: Register
        if path == '/api/register':
            existing = [u for u in db['users'] if u['email'] == data.get('email') or u['telephone'] == data.get('telephone')]
            if existing:
                response = {"error": "Un compte existe déjà"}
            else:
                user = {
                    "id": next_id('users'),
                    "role": "massier",
                    "nom": data.get('nom'),
                    "prenom": data.get('prenom'),
                    "email": data.get('email'),
                    "telephone": data.get('telephone'),
                    "password_hash": hash_password(data.get('password', '')),
                    "proprio_id": data.get('proprio_id'),
                    "validated": False,
                    "created_at": "2024-01-01T00:00:00Z"
                }
                db['users'].append(user)
                save_db(db)
                response = {"success": True, "message": "Inscription réussie"}

        # API: Login
        elif path == '/api/login':
            identifier = data.get('identifier', '')
            password = data.get('password', '')
            user = next((u for u in db['users'] if u['email'] == identifier or u['telephone'] == identifier), None)
            if user and user['password_hash'] == hash_password(password):
                if user['role'] == 'massier' and not user['validated']:
                    response = {"error": "Compte en attente de validation"}
                else:
                    response = {
                        "success": True,
                        "user": {k: v for k, v in user.items() if k != 'password_hash'},
                        "redirect": '/admin-console' if user['role'] == 'admin' else '/proprietaire' if user['role'] == 'proprietaire' else '/massier'
                    }
            else:
                response = {"error": "Identifiants incorrects"}

        # API: Create Proprietaire
        elif path == '/api/proprietaires':
            existing = [u for u in db['users'] if u['email'] == data.get('email')]
            if existing:
                response = {"error": "Email déjà utilisé"}
            else:
                proprio_id = next_id('users')
                db['users'].append({
                    "id": proprio_id,
                    "role": "proprietaire",
                    "nom": data.get('nom'),
                    "prenom": data.get('prenom'),
                    "email": data.get('email'),
                    "telephone": data.get('telephone'),
                    "password_hash": hash_password(data.get('password', '')),
                    "proprio_id": None,
                    "validated": True,
                    "created_at": "2024-01-01T00:00:00Z"
                })
                db['proprietaire_stock'][str(proprio_id)] = {"stock_515": 0, "stock_510": 0}
                save_db(db)
                response = {"success": True, "id": proprio_id}

        # API: Submit Rapport
        elif path == '/api/rapports':
            rapport_id = next_id('ouvrier_rapports')
            db['ouvrier_rapports'].append({
                "id": rapport_id,
                "massier_id": data.get('massier_id'),
                "date": "2024-01-01",
                "soumis_at": "2024-01-01T00:00:00Z"
            })
            for ligne in data.get('lignes', []):
                db['ouvrier_lignes'].append({
                    "id": next_id('ouvrier_lignes'),
                    "rapport_id": rapport_id,
                    "nom_ouvrier": ligne.get('nom_ouvrier'),
                    "qte_515": ligne.get('qte_515', 0),
                    "qte_510": ligne.get('qte_510', 0)
                })
            # Update stock
            total_515 = sum(l.get('qte_515', 0) for l in data.get('lignes', []))
            total_510 = sum(l.get('qte_510', 0) for l in data.get('lignes', []))
            massier = next((u for u in db['users'] if u['id'] == data.get('massier_id')), None)
            if massier and massier.get('proprio_id'):
                sid = str(massier['proprio_id'])
                if sid not in db['proprietaire_stock']:
                    db['proprietaire_stock'][sid] = {"stock_515": 0, "stock_510": 0}
                db['proprietaire_stock'][sid]['stock_515'] += total_515
                db['proprietaire_stock'][sid]['stock_510'] += total_510
            save_db(db)
            response = {"success": True, "rapport_id": rapport_id}

        # API: Submit Vente
        elif path == '/api/ventes':
            vente_id = next_id('ventes')
            db['ventes'].append({
                "id": vente_id,
                "massier_id": data.get('massier_id'),
                "qte_515": data.get('qte_515', 0),
                "qte_510": data.get('qte_510', 0),
                "date_at": "2024-01-01T00:00:00Z"
            })
            massier = next((u for u in db['users'] if u['id'] == data.get('massier_id')), None)
            if massier and massier.get('proprio_id'):
                sid = str(massier['proprio_id'])
                if sid not in db['proprietaire_stock']:
                    db['proprietaire_stock'][sid] = {"stock_515": 0, "stock_510": 0}
                db['proprietaire_stock'][sid]['stock_515'] = max(db['proprietaire_stock'][sid]['stock_515'] - data.get('qte_515', 0), 0)
                db['proprietaire_stock'][sid]['stock_510'] = max(db['proprietaire_stock'][sid]['stock_510'] - data.get('qte_510', 0), 0)
            save_db(db)
            response = {"success": True}

        # API: Validate Massier
        elif path == '/api/validate-massier':
            massier = next((u for u in db['users'] if u['id'] == data.get('massier_id')), None)
            if massier:
                massier['validated'] = True
                save_db(db)
                response = {"success": True}

        # API: Valider Rapport
        elif path == '/api/valider-rapport':
            db['validations_financieres'].append({
                "id": next_id('validations_financieres'),
                "massier_id": data.get('massier_id'),
                "rapport_id": data.get('rapport_id'),
                "montant_515": data.get('montant_515', 0),
                "montant_510": data.get('montant_510', 0),
                "total": data.get('montant_515', 0) + data.get('montant_510', 0),
                "valide_at": "2024-01-01T00:00:00Z"
            })
            save_db(db)
            response = {"success": True}

        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(response).encode())

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

# ─── DÉMARRAGE ───
if __name__ == '__main__':
    server = HTTPServer(('0.0.0.0', PORT), Handler)
    print(f'🚀 SOSSOU KOUAMÉ Server running on port {PORT}')
    print(f'📁 Serving files from: {os.getcwd()}')
    print(f'👤 Admin: sossou2026@gmail.com / admin2024')
    server.serve_forever()
