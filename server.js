/**
 * Fichier : server.js
 * Description : Serveur Node.js avec Express gérant l'authentification
 * (login/register) avec une base de données SQLite et hachage bcrypt.
 * Inclut la génération de token d'activation et la route d'activation.
 */

const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const crypto = require('crypto'); // Module Node.js pour la génération de tokens

const app = express();
const PORT = 8080;
const saltRounds = 10;
const TOKEN_EXPIRY_DURATION = 3600000; // 1 heure en millisecondes

app.use(express.json());
app.use(express.static(path.join(__dirname)));

// --- Connexion DB et Création Table ---
const db = new sqlite3.Database('./database.db', (err) => {
    if (err) { console.error("Erreur connexion DB:", err.message); process.exit(1); }
    else {
        console.log('Connecté à la base de données SQLite.');
        db.run(`CREATE TABLE IF NOT EXISTS users (
            identifiant TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, hashedPassword TEXT NOT NULL,
            firstName TEXT, lastName TEXT, role TEXT, isActive INTEGER DEFAULT 0,
            activationToken TEXT, tokenExpiry INTEGER
        )`, (err) => {
            if (err) console.error("Erreur création table users:", err.message);
            else { console.log("Table 'users' prête."); /* ... création admin par défaut ... */ }
        });
    }
});
// ---------------------------------------------

// --- Route API pour la Connexion (Identifiant ou Email) ---
app.post('/api/login', (req, res) => {
    // ... (code de connexion inchangé) ...
    console.log('Requête reçue sur /api/login:', req.body);
    const { loginIdentifier, password } = req.body;
    if (!loginIdentifier || !password) { return res.status(400).json({ success: false, message: 'Identifiant/Email et mot de passe requis.' }); }
    const sql = `SELECT * FROM users WHERE (identifiant = ? OR email = ?)`;
    db.get(sql, [loginIdentifier, loginIdentifier], async (err, user) => {
        if (err) { console.error("Erreur DB login:", err.message); return res.status(500).json({ success: false, message: 'Erreur serveur.' }); }
        if (!user) { console.log(`Échec login (not found): ${loginIdentifier}`); return res.status(401).json({ success: false, message: 'Identifiant/Email ou mot de passe incorrect.' }); }
        if (user.isActive !== 1) { console.log(`Échec login (not active): ${loginIdentifier}`); return res.status(403).json({ success: false, message: 'Compte non activé. Veuillez vérifier vos emails.' }); }
        try {
            const match = await bcrypt.compare(password, user.hashedPassword);
            if (match) {
                console.log(`Connexion réussie pour ${loginIdentifier}`);
                const dummyToken = `fake-token-for-${user.identifiant}-${Date.now()}`;
                res.json({ success: true, message: 'Connexion réussie !', token: dummyToken, user: { name: `${user.firstName} ${user.lastName}`, role: user.role, email: user.email } });
            } else {
                console.log(`Échec login (wrong pass): ${loginIdentifier}`);
                res.status(401).json({ success: false, message: 'Identifiant/Email ou mot de passe incorrect.' });
            }
        } catch (compareError) { console.error("Erreur bcrypt.compare:", compareError); res.status(500).json({ success: false, message: 'Erreur serveur vérification.' }); }
    });
});
// -----------------------------------

// --- Route API pour l'Inscription ---
app.post('/api/register', async (req, res) => {
    console.log('Requête reçue sur /api/register:', req.body);
    const { firstName, lastName, email, password } = req.body;

    if (!firstName || !lastName || !email || !password) {
        return res.status(400).json({ success: false, message: 'Tous les champs sont requis.' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Générer identifiant unique
        const baseIdentifiant = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
        let identifiant = baseIdentifiant;
        let counter = 0;
        let unique = false;
        while (!unique) {
            const row = await new Promise((resolve, reject) => { db.get(`SELECT identifiant FROM users WHERE identifiant = ?`, [identifiant], (err, row) => err ? reject(err) : resolve(row)); });
            if (!row) unique = true;
            else identifiant = `${baseIdentifiant}${++counter}`;
        }

        // Générer token d'activation
        const activationToken = crypto.randomBytes(32).toString('hex');
        const tokenExpiry = Date.now() + TOKEN_EXPIRY_DURATION;

        // Insertion dans la base de données
        const insertSql = `INSERT INTO users (identifiant, email, hashedPassword, firstName, lastName, role, isActive, activationToken, tokenExpiry) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        await new Promise((resolve, reject) => {
            db.run(insertSql, [ identifiant, email, hashedPassword, firstName, lastName, "Utilisateur", 0, activationToken, tokenExpiry ], function(err) {
                if (err) { reject({ status: err.message.includes('UNIQUE') ? 409 : 500, message: err.message.includes('UNIQUE') ? 'Email ou Identifiant déjà utilisé.' : 'Erreur création compte.' }); }
                else resolve(this);
            });
        });

        console.log(`Nouvel utilisateur pré-enregistré: ${email} (identifiant: ${identifiant})`);

        // === AJOUT D'UN LOG DE DÉBOGAGE ===
        console.log("DEBUG: Avant la simulation d'envoi d'email.");
        // ==================================

        // Simulation : Envoi de l'email de confirmation
        const activationLink = `http://localhost:${PORT}/api/activate?token=${activationToken}`;
        console.log("--------------------------------------------------");
        console.log("SIMULATION D'ENVOI D'EMAIL D'ACTIVATION");
        console.log(`À: ${email}`);
        console.log(`Sujet: Activez votre compte AiCalendy`);
        console.log(`Corps: Cliquez sur ce lien pour activer : ${activationLink}`);
        console.log("--------------------------------------------------");

        res.status(201).json({ success: true, message: 'Compte créé ! Veuillez consulter vos emails (ou la console du serveur pour la simulation) pour activer votre compte.' });

    } catch (error) {
        console.error("Erreur globale lors de l'inscription:", error);
        const status = error.status || 500;
        const message = error.message || 'Erreur serveur.';
        res.status(status).json({ success: false, message: message });
    }
});
// ------------------------------------

// --- Route d'activation par Email ---
app.get('/api/activate', async (req, res) => {
    // ... (code de la route d'activation inchangé) ...
    const { token } = req.query;
    console.log(`Requête reçue sur /api/activate avec token: ${token ? 'présent' : 'absent'}`);
    if (!token) { return res.status(400).send('<!DOCTYPE html><html><body><h1>Token manquant.</h1></body></html>'); }
    try {
        const sql = `SELECT * FROM users WHERE activationToken = ? AND tokenExpiry > ? AND isActive = 0`;
        const user = await new Promise((resolve, reject) => { db.get(sql, [token, Date.now()], (err, row) => err ? reject(err) : resolve(row)); });
        if (!user) { console.log(`Échec activation: Token invalide/expiré/utilisé pour token: ${token}`); return res.status(400).send('<!DOCTYPE html><html><body><h1>Lien invalide ou expiré.</h1></body></html>'); }
        const updateSql = `UPDATE users SET isActive = 1, activationToken = NULL, tokenExpiry = NULL WHERE identifiant = ?`;
        await new Promise((resolve, reject) => { db.run(updateSql, [user.identifiant], (err) => err ? reject(err) : resolve()); });
        console.log(`Compte activé avec succès pour ${user.email}`);
        res.redirect('/connexion_account.html?activated=true');
    } catch (error) { console.error("Erreur lors de l'activation:", error); res.status(500).send('<!DOCTYPE html><html><body><h1>Erreur serveur.</h1></body></html>'); }
});
// ===========================================

// Route racine
app.get('/', (req, res) => { res.sendFile(path.join(__dirname, 'index.html')); });

// Démarrage serveur
app.listen(PORT, () => { console.log(`Serveur démarré sur http://localhost:${PORT}`); });

// Fermeture propre de la DB
process.on('SIGINT', () => { db.close(() => { console.log('DB fermée.'); process.exit(0); }); });