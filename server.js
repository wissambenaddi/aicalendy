/**
 * Fichier : server.js
 * Description : Serveur Node.js complet avec Express gérant l'authentification
 * et les APIs pour les catégories, rendez-vous, dashboard, et tâches.
 */

// Importations des modules nécessaires
const express = require('express');
const path = require('path'); // Pour gérer les chemins de fichiers
const sqlite3 = require('sqlite3').verbose(); // Pour interagir avec SQLite
const bcrypt = require('bcrypt'); // Pour hacher les mots de passe
const crypto = require('crypto'); // Pour générer des tokens aléatoires

// Initialisation de l'application Express
const app = express();
const PORT = 8080; // Port sur lequel le serveur écoutera
const saltRounds = 10; // Complexité du hachage bcrypt
const TOKEN_EXPIRY_DURATION = 3600000; // Durée de validité du token d'activation (1 heure en ms)

// Middlewares
app.use(express.json()); // Pour parser le JSON dans le corps des requêtes (req.body)
app.use(express.static(path.join(__dirname))); // Pour servir les fichiers statiques (HTML, CSS, JS client) depuis le répertoire courant

// --- Connexion DB et Création/Vérification des Tables ---
const db = new sqlite3.Database('./database.db', (err) => {
    if (err) {
        // Si la connexion échoue, log l'erreur et arrête le serveur
        console.error("Erreur fatale connexion DB:", err.message);
        process.exit(1);
    } else {
        console.log('Connecté à la base de données SQLite.');
        // Utiliser serialize pour s'assurer que les tables sont créées en séquence
        db.serialize(() => {
            // Table users: Stocke les informations des utilisateurs
            db.run(`CREATE TABLE IF NOT EXISTS users (
                identifiant TEXT PRIMARY KEY,         -- Identifiant unique choisi par l'utilisateur ou généré
                email TEXT UNIQUE NOT NULL,           -- Email unique, utilisé pour la connexion/récupération
                hashedPassword TEXT NOT NULL,       -- Mot de passe haché
                firstName TEXT,                     -- Prénom
                lastName TEXT,                      -- Nom
                role TEXT DEFAULT 'Utilisateur',    -- Rôle (ex: Utilisateur, Admin)
                isActive INTEGER DEFAULT 0,         -- Statut d'activation (0=non, 1=oui)
                activationToken TEXT,               -- Token unique pour l'activation par email
                tokenExpiry INTEGER                 -- Timestamp d'expiration du token d'activation
            )`, (err) => { if (err) console.error("Erreur table users:", err.message); else console.log("Table 'users' prête."); });

            // Table categories: Stocke les types de rendez-vous
            db.run(`CREATE TABLE IF NOT EXISTS categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT, -- ID auto-généré
                user_identifiant TEXT NOT NULL,       -- Lien vers l'utilisateur propriétaire
                titre TEXT NOT NULL,                  -- Nom de la catégorie (requis)
                description TEXT,                     -- Optionnel
                couleur TEXT,                         -- Optionnel
                icone TEXT,                           -- Optionnel
                departement TEXT,                     -- Optionnel
                responsable TEXT,                     -- Optionnel
                FOREIGN KEY (user_identifiant) REFERENCES users (identifiant) ON DELETE CASCADE -- Supprime les catégories si l'utilisateur est supprimé
            )`, (err) => { if (err) console.error("Erreur table categories:", err.message); else console.log("Table 'categories' prête."); });

            // Table tasks: Stocke les tâches à faire
            db.run(`CREATE TABLE IF NOT EXISTS tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_identifiant TEXT NOT NULL,       -- Lien vers l'utilisateur
                titre TEXT NOT NULL,                  -- Titre de la tâche
                description TEXT,                     -- Description détaillée
                date_echeance INTEGER,                -- Date limite (Timestamp ms)
                responsable TEXT,                     -- Personne assignée (simple texte pour l'instant)
                priorite INTEGER DEFAULT 2,           -- Priorité (1=Basse, 2=Moyenne, 3=Haute)
                statut TEXT DEFAULT 'todo',           -- Statut ('todo', 'inprogress', 'done')
                categorie_departement TEXT,           -- Catégorisation libre
                est_complete INTEGER NOT NULL DEFAULT 0, -- Indicateur de complétion (0 ou 1)
                date_completion INTEGER,              -- Timestamp de complétion
                FOREIGN KEY (user_identifiant) REFERENCES users (identifiant) ON DELETE CASCADE
            )`, (err) => { if (err) console.error("Erreur table tasks:", err.message); else console.log("Table 'tasks' prête."); });

            // Table appointments: Stocke les rendez-vous planifiés
            db.run(`CREATE TABLE IF NOT EXISTS appointments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_identifiant TEXT NOT NULL,       -- Lien vers l'utilisateur propriétaire du calendrier
                titre TEXT,                           -- Titre/Objet du RDV (peut être généré ou saisi)
                heure_debut INTEGER NOT NULL,         -- Heure de début (Timestamp ms)
                heure_fin INTEGER,                    -- Heure de fin (Timestamp ms)
                categorie_id INTEGER,                 -- Lien vers la catégorie correspondante
                statut TEXT DEFAULT 'confirmed',      -- Statut du RDV ('confirmed', 'pending', 'canceled')
                -- Ajouter d'autres champs si nécessaire (ex: nom/email de l'invité)
                FOREIGN KEY (user_identifiant) REFERENCES users (identifiant) ON DELETE CASCADE,
                FOREIGN KEY (categorie_id) REFERENCES categories (id) ON DELETE SET NULL -- Si la catégorie est supprimée, le lien devient NULL
            )`, (err) => {
                if (err) { console.error("Erreur table appointments:", err.message); }
                else {
                    console.log("Table 'appointments' prête.");
                    createDefaultAdmin(); // Créer l'admin après que toutes les tables sont prêtes
                }
            });
        });
    }
});

// Fonction pour créer l'admin par défaut (si nécessaire)
function createDefaultAdmin() {
    const adminEmail = 'admin@example.com'; const adminIdentifiant = 'admin'; const adminPassword = 'admin';
    db.get(`SELECT identifiant FROM users WHERE identifiant = ? OR email = ?`, [adminIdentifiant, adminEmail], (err, row) => {
        if (err) { console.error("Erreur vérification admin:", err.message); return; }
        if (!row) { // S'il n'existe pas
            bcrypt.hash(adminPassword, saltRounds, (hashErr, hashedPassword) => {
                if (hashErr) { console.error("Erreur hachage admin:", hashErr); return; }
                db.run(`INSERT INTO users (identifiant, email, hashedPassword, firstName, lastName, role, isActive) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [adminIdentifiant, adminEmail, hashedPassword, 'Admin', 'Sys', 'Admin', 1], // Activé par défaut
                    (insertErr) => {
                        if (insertErr) console.error("Erreur insertion admin:", insertErr.message);
                        else console.log("Utilisateur Admin par défaut créé (identifiant: admin, mdp: admin).");
                    }
                );
            });
        }
    });
}
// ---------------------------------------------

// --- Helpers Promesses DB (pour utiliser async/await plus facilement) ---
function dbGet(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => err ? reject(err) : resolve(row));
    });
}
function dbAll(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => err ? reject(err) : resolve(rows || []));
    });
}
function dbRun(sql, params = []) {
     return new Promise((resolve, reject) => {
         db.run(sql, params, function(err) { // Utilise function() pour this
             if (err) reject(err);
             else resolve({ lastID: this.lastID, changes: this.changes });
         });
     });
}
// ---------------------------------------------


// --- Routes API Authentification ---

// POST /api/login
app.post('/api/login', async (req, res) => {
    console.log('Requête reçue sur /api/login:', req.body);
    const { loginIdentifier, password } = req.body;
    if (!loginIdentifier || !password) return res.status(400).json({ success: false, message: 'Identifiant/Email et mot de passe requis.' });

    try {
        const sql = `SELECT * FROM users WHERE (identifiant = ? OR email = ?)`;
        const user = await dbGet(sql, [loginIdentifier, loginIdentifier]);

        if (!user) { console.log(`Échec login (not found): ${loginIdentifier}`); return res.status(401).json({ success: false, message: 'Identifiant/Email ou mot de passe incorrect.' }); }
        if (user.isActive !== 1) { console.log(`Échec login (not active): ${loginIdentifier}`); return res.status(403).json({ success: false, message: 'Compte non activé. Veuillez vérifier vos emails.' }); }

        const match = await bcrypt.compare(password, user.hashedPassword);
        if (match) {
            console.log(`Connexion réussie pour ${loginIdentifier}`);
            // TODO: Remplacer par un vrai système de token JWT ou de session
            const dummyToken = `fake-token-for-${user.identifiant}-${Date.now()}`;
            res.json({ success: true, message: 'Connexion réussie !', token: dummyToken, user: { name: `${user.firstName} ${user.lastName}`, role: user.role, email: user.email } });
        } else {
            console.log(`Échec login (wrong pass): ${loginIdentifier}`);
            res.status(401).json({ success: false, message: 'Identifiant/Email ou mot de passe incorrect.' });
        }
    } catch (error) {
        console.error("Erreur lors du login:", error);
        res.status(500).json({ success: false, message: 'Erreur serveur lors de la connexion.' });
    }
});

// POST /api/register
app.post('/api/register', async (req, res) => {
    console.log('Requête reçue sur /api/register:', req.body);
    const { firstName, lastName, email, password } = req.body;
    if (!firstName || !lastName || !email || !password) return res.status(400).json({ success: false, message: 'Tous les champs sont requis.' });

    try {
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        // Générer identifiant unique basé sur email
        const baseIdentifiant = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        let identifiant = baseIdentifiant; let counter = 0; let unique = false;
        while (!unique) { const row = await dbGet(`SELECT identifiant FROM users WHERE identifiant = ?`, [identifiant]); if (!row) unique = true; else identifiant = `${baseIdentifiant}${++counter}`; }
        // Générer token activation
        const activationToken = crypto.randomBytes(32).toString('hex');
        const tokenExpiry = Date.now() + TOKEN_EXPIRY_DURATION;

        const insertSql = `INSERT INTO users (identifiant, email, hashedPassword, firstName, lastName, role, isActive, activationToken, tokenExpiry) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        await dbRun(insertSql, [identifiant, email, hashedPassword, firstName, lastName, "Utilisateur", 0, activationToken, tokenExpiry]);

        console.log(`Nouvel utilisateur pré-enregistré: ${email} (identifiant: ${identifiant})`);
        // Simuler l'envoi d'email
        const activationLink = `http://localhost:${PORT}/api/activate?token=${activationToken}`;
        console.log("--------------------------------------------------"); console.log("SIMULATION D'ENVOI D'EMAIL D'ACTIVATION"); console.log(`À: ${email}`); console.log(`Sujet: Activez votre compte AiCalendy`); console.log(`Corps: Cliquez sur ce lien pour activer : ${activationLink}`); console.log("--------------------------------------------------");
        res.status(201).json({ success: true, message: 'Compte créé ! Veuillez consulter vos emails (ou la console du serveur pour la simulation) pour activer votre compte.' });

    } catch (error) {
        console.error("Erreur globale lors de l'inscription:", error);
        const isUniqueConstraintError = error.message?.includes('UNIQUE constraint failed');
        const status = isUniqueConstraintError ? 409 : 500;
        const message = isUniqueConstraintError ? 'Email ou Identifiant déjà utilisé.' : 'Erreur serveur lors de l\'inscription.';
        res.status(status).json({ success: false, message: message });
    }
});

// GET /api/activate
app.get('/api/activate', async (req, res) => {
    const { token } = req.query; console.log(`Requête reçue sur /api/activate avec token: ${token ? 'présent' : 'absent'}`);
    if (!token) return res.status(400).send('<!DOCTYPE html><html><body><h1>Token manquant.</h1></body></html>');

    try {
        const sql = `SELECT * FROM users WHERE activationToken = ? AND tokenExpiry > ? AND isActive = 0`;
        const user = await dbGet(sql, [token, Date.now()]);

        if (!user) { console.log(`Échec activation: Token invalide/expiré/utilisé pour token: ${token}`); return res.status(400).send('<!DOCTYPE html><html><body><h1>Lien invalide ou expiré.</h1></body></html>'); }

        const updateSql = `UPDATE users SET isActive = 1, activationToken = NULL, tokenExpiry = NULL WHERE identifiant = ?`;
        await dbRun(updateSql, [user.identifiant]);

        console.log(`Compte activé avec succès pour ${user.email}`);
        // Rediriger vers la page de connexion avec un message de succès
        res.redirect('/connexion_account.html?activated=true');

    } catch (error) { console.error("Erreur lors de l'activation:", error); res.status(500).send('<!DOCTYPE html><html><body><h1>Erreur serveur.</h1></body></html>'); }
});
// ---------------------------------------------

// --- Route API Dashboard ---
// GET /api/dashboard/data
app.get('/api/dashboard/data', async (req, res) => {
    console.log("Requête reçue sur /api/dashboard/data");
    const userIdentifiant = 'admin'; // TODO: Remplacer par Auth
    console.log(`Récupération données dashboard pour: ${userIdentifiant}`);

    try {
        const nowMs = Date.now();
        const startOfDay = new Date(nowMs).setHours(0, 0, 0, 0);
        const startOfTomorrow = startOfDay + 24 * 60 * 60 * 1000;
        const startOfWeek = new Date(startOfDay - ((new Date(nowMs).getDay() + 6) % 7) * 24 * 60 * 60 * 1000).getTime();
        const startOfNextWeek = startOfWeek + 7 * 24 * 60 * 60 * 1000;
        const sevenDaysAgo = nowMs - 7 * 24 * 60 * 60 * 1000;

        const appointmentsTodayPromise = dbAll(`SELECT id, titre, heure_debut FROM appointments WHERE user_identifiant = ? AND heure_debut >= ? AND heure_debut < ? AND statut != 'canceled' ORDER BY heure_debut ASC LIMIT 5`, [userIdentifiant, startOfDay, startOfTomorrow]); // Exclure annulés
        const tasksDueTodayPromise = dbAll(`SELECT id, titre, date_echeance, est_complete FROM tasks WHERE user_identifiant = ? AND date_echeance >= ? AND date_echeance < ? ORDER BY date_echeance ASC LIMIT 5`, [userIdentifiant, startOfDay, startOfTomorrow]);
        const overdueTasksPromise = dbGet(`SELECT COUNT(*) as count FROM tasks WHERE user_identifiant = ? AND est_complete = 0 AND date_echeance < ?`, [userIdentifiant, startOfDay]);
        const appointmentsWeekPromise = dbGet(`SELECT COUNT(*) as count FROM appointments WHERE user_identifiant = ? AND heure_debut >= ? AND heure_debut < ? AND statut != 'canceled'`, [userIdentifiant, startOfWeek, startOfNextWeek]); // Exclure annulés
        const weeklyProgressPromise = new Promise((resolve, reject) => { const sql = `SELECT strftime('%w', date_completion / 1000, 'unixepoch') as dayOfWeek, COUNT(*) as count FROM tasks WHERE user_identifiant = ? AND est_complete = 1 AND date_completion >= ? GROUP BY dayOfWeek ORDER BY dayOfWeek ASC`; db.all(sql, [userIdentifiant, sevenDaysAgo], (err, rows) => { if (err) reject(err); else { const weeklyData = Array(7).fill(0); rows.forEach(row => { const dayIndex = parseInt(row.dayOfWeek, 10); if (dayIndex >= 0 && dayIndex < 7) weeklyData[dayIndex] = row.count; }); resolve(weeklyData); } }); });

        const [ appointmentsToday, tasksDueToday, overdueTasksResult, appointmentsWeekResult, weeklyProgressData ] = await Promise.all([ appointmentsTodayPromise, tasksDueTodayPromise, overdueTasksPromise, appointmentsWeekPromise, weeklyProgressPromise ]);

        res.json({ success: true, data: { appointmentsToday, tasksDueToday, overdueTasksCount: overdueTasksResult?.count || 0, appointmentsWeekCount: appointmentsWeekResult?.count || 0, weeklyProgressData } });
    } catch (error) { console.error("Erreur récupération données dashboard:", error); res.status(500).json({ success: false, message: "Erreur serveur récupération données dashboard." }); }
});
// -----------------------------

// --- Routes API Catégories ---
// GET /api/categories
app.get('/api/categories', async (req, res) => {
    console.log("Requête reçue sur GET /api/categories");
    const userIdentifiant = 'admin'; // TODO: Auth
    try {
        const sql = `SELECT id, titre, description, couleur, icone, departement, responsable FROM categories WHERE user_identifiant = ? ORDER BY titre ASC`;
        const categories = await dbAll(sql, [userIdentifiant]);
        console.log(`Catégories trouvées pour ${userIdentifiant}:`, categories.length);
        res.json({ success: true, categories: categories });
    } catch (error) { console.error("Erreur GET /api/categories:", error); res.status(500).json({ success: false, message: "Erreur serveur récupération catégories." }); }
});

// POST /api/categories
app.post('/api/categories', async (req, res) => {
    console.log("Requête reçue sur POST /api/categories:", req.body);
    const userIdentifiant = 'admin'; // TODO: Auth
    const { titre, description, couleur, icone, departement, responsable } = req.body;
    if (!titre) { return res.status(400).json({ success: false, message: 'Le nom de la catégorie est requis.' }); }
    try {
        const sql = `INSERT INTO categories (user_identifiant, titre, description, couleur, icone, departement, responsable) VALUES (?, ?, ?, ?, ?, ?, ?)`;
        const params = [ userIdentifiant, titre, description || null, couleur || null, icone || null, departement || null, responsable || null ];
        const result = await dbRun(sql, params);
        console.log(`Nouvelle catégorie créée ID: ${result.lastID} pour ${userIdentifiant}`);
        const newCategory = await dbGet(`SELECT * FROM categories WHERE id = ?`, [result.lastID]);
        res.status(201).json({ success: true, message: 'Catégorie créée avec succès.', category: newCategory });
    } catch (error) { console.error("Erreur POST /api/categories:", error); res.status(500).json({ success: false, message: "Erreur serveur lors de la création de la catégorie." }); }
});

// DELETE /api/categories/:id
app.delete('/api/categories/:id', async (req, res) => {
    const categoryId = req.params.id; const userIdentifiant = 'admin'; // TODO: Auth
    console.log(`Requête reçue sur DELETE /api/categories/${categoryId}`);
    try {
        const sql = `DELETE FROM categories WHERE id = ? AND user_identifiant = ?`;
        const result = await dbRun(sql, [categoryId, userIdentifiant]);
        if (result.changes === 0) return res.status(404).json({ success: false, message: 'Catégorie non trouvée ou accès non autorisé.' });
        console.log(`Catégorie ${categoryId} supprimée pour ${userIdentifiant}`);
        res.json({ success: true, message: 'Catégorie supprimée avec succès.' });
    } catch (error) { console.error(`Erreur DELETE /api/categories/${categoryId}:`, error); res.status(500).json({ success: false, message: "Erreur serveur lors de la suppression de la catégorie." }); }
});
// --------------------------

// --- Routes API Rendez-vous ---
// GET /api/appointments
app.get('/api/appointments', async (req, res) => {
    console.log(`Requête reçue sur /api/appointments`);
    const userIdentifiant = 'admin'; // TODO: Auth
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate'); res.setHeader('Pragma', 'no-cache'); res.setHeader('Expires', '0'); res.setHeader('Surrogate-Control', 'no-store');
    try {
        let sql = `SELECT a.id, a.titre, a.heure_debut, a.heure_fin, a.categorie_id, a.statut, c.titre as categorie_titre
                   FROM appointments a
                   LEFT JOIN categories c ON a.categorie_id = c.id
                   WHERE a.user_identifiant = ? AND a.statut != 'canceled'
                   ORDER BY a.heure_debut ASC`; // Tri par défaut, exclut les annulés
        const params = [userIdentifiant];
        const appointments = await dbAll(sql, params);
        console.log(`RDV actifs trouvés pour ${userIdentifiant}:`, appointments.length);
        res.json({ success: true, appointments: appointments });
    } catch (error) { console.error("Erreur récupération rendez-vous:", error); res.status(500).json({ success: false, message: "Erreur serveur récupération rendez-vous." }); }
});

// POST /api/appointments
app.post('/api/appointments', async (req, res) => {
    console.log("Requête reçue sur POST /api/appointments:", req.body);
    const userIdentifiant = 'admin'; // TODO: Auth
    const { titre, heure_debut, heure_fin, categorie_id, statut } = req.body;

    if (!heure_debut) { return res.status(400).json({ success: false, message: "L'heure de début est requise." }); }
    if (!categorie_id) { return res.status(400).json({ success: false, message: "La catégorie est requise." }); }
    const startTime = Number(heure_debut); const endTime = heure_fin ? Number(heure_fin) : null;
    if (isNaN(startTime)) { return res.status(400).json({ success: false, message: "Format d'heure de début invalide." }); }
    if (endTime !== null && isNaN(endTime)) { return res.status(400).json({ success: false, message: "Format d'heure de fin invalide." }); }
    if (endTime !== null && endTime <= startTime) { return res.status(400).json({ success: false, message: "L'heure de fin doit être après l'heure de début." }); }

    try {
        const sql = `INSERT INTO appointments (user_identifiant, titre, heure_debut, heure_fin, categorie_id, statut) VALUES (?, ?, ?, ?, ?, ?)`;
        const params = [ userIdentifiant, titre || null, startTime, endTime, categorie_id, statut || 'confirmed' ];
        const result = await dbRun(sql, params);
        console.log(`Nouveau RDV créé ID: ${result.lastID} pour ${userIdentifiant}`);
        const newAppointment = await dbGet(`SELECT * FROM appointments WHERE id = ?`, [result.lastID]);
        res.status(201).json({ success: true, message: 'Rendez-vous créé avec succès.', appointment: newAppointment });
    } catch (error) {
        console.error("Erreur POST /api/appointments:", error);
        if (error.message && error.message.includes('FOREIGN KEY constraint failed')) { res.status(400).json({ success: false, message: "Erreur : La catégorie sélectionnée n'existe pas." }); }
        else { res.status(500).json({ success: false, message: "Erreur serveur lors de la création du rendez-vous." }); }
    }
});

// GET /api/appointments/:id
app.get('/api/appointments/:id', async (req, res) => {
    const appointmentId = req.params.id; const userIdentifiant = 'admin'; // TODO: Auth
    console.log(`Requête reçue sur GET /api/appointments/${appointmentId}`);
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate'); res.setHeader('Pragma', 'no-cache'); res.setHeader('Expires', '0'); res.setHeader('Surrogate-Control', 'no-store');
    try {
        const sql = `SELECT a.id, a.titre, a.heure_debut, a.heure_fin, a.statut, a.categorie_id, c.titre as categorie_titre FROM appointments a LEFT JOIN categories c ON a.categorie_id = c.id WHERE a.id = ? AND a.user_identifiant = ?`;
        const appointment = await dbGet(sql, [appointmentId, userIdentifiant]);
        if (!appointment) { return res.status(404).json({ success: false, message: 'Rendez-vous non trouvé ou accès non autorisé.' }); }
        console.log(`Détails RDV ${appointmentId} trouvés pour ${userIdentifiant}`);
        res.json({ success: true, appointment: appointment });
    } catch (error) { console.error(`Erreur GET /api/appointments/${appointmentId}:`, error); res.status(500).json({ success: false, message: "Erreur serveur lors de la récupération des détails du rendez-vous." }); }
});

// PUT /api/appointments/:id
app.put('/api/appointments/:id', async (req, res) => {
    const appointmentId = req.params.id; const userIdentifiant = 'admin'; // TODO: Auth
    console.log(`Requête reçue sur PUT /api/appointments/${appointmentId}:`, req.body);
    const { titre, heure_debut, heure_fin, categorie_id, statut } = req.body;

    if (!heure_debut) { return res.status(400).json({ success: false, message: "L'heure de début est requise." }); }
    if (!categorie_id) { return res.status(400).json({ success: false, message: "La catégorie est requise." }); }
    const startTime = Number(heure_debut); const endTime = heure_fin ? Number(heure_fin) : null;
    if (isNaN(startTime)) { return res.status(400).json({ success: false, message: "Format d'heure de début invalide." }); }
    if (endTime !== null && isNaN(endTime)) { return res.status(400).json({ success: false, message: "Format d'heure de fin invalide." }); }
    if (endTime !== null && endTime <= startTime) { return res.status(400).json({ success: false, message: "L'heure de fin doit être après l'heure de début." }); }

    try {
        const checkSql = `SELECT id FROM appointments WHERE id = ? AND user_identifiant = ?`;
        const existingAppt = await dbGet(checkSql, [appointmentId, userIdentifiant]);
        if (!existingAppt) { return res.status(404).json({ success: false, message: 'Rendez-vous non trouvé ou accès non autorisé.' }); }

        const sql = `UPDATE appointments SET titre = ?, heure_debut = ?, heure_fin = ?, categorie_id = ?, statut = ? WHERE id = ? AND user_identifiant = ?`;
        const params = [ titre || null, startTime, endTime, categorie_id, statut || 'confirmed', appointmentId, userIdentifiant ];
        const result = await dbRun(sql, params);
        console.log(`RDV ${appointmentId} mis à jour pour ${userIdentifiant}. Changes: ${result.changes}`);
        const updatedAppointment = await dbGet(`SELECT * FROM appointments WHERE id = ?`, [appointmentId]);
        res.json({ success: true, message: 'Rendez-vous mis à jour avec succès.', appointment: updatedAppointment });
    } catch (error) {
        console.error(`Erreur PUT /api/appointments/${appointmentId}:`, error);
        if (error.message && error.message.includes('FOREIGN KEY constraint failed')) { res.status(400).json({ success: false, message: "Erreur : La catégorie sélectionnée n'existe pas." }); }
        else { res.status(500).json({ success: false, message: "Erreur serveur lors de la mise à jour du rendez-vous." }); }
    }
});

// PUT /api/appointments/:id/status
app.put('/api/appointments/:id/status', async (req, res) => {
    const appointmentId = req.params.id;
    const { statut } = req.body; // On attend un objet comme { "statut": "canceled" }
    const userIdentifiant = 'admin'; // TODO: Auth
    console.log(`Requête reçue sur PUT /api/appointments/${appointmentId}/status:`, req.body);

    if (!statut || !['confirmed', 'pending', 'canceled'].includes(statut)) { return res.status(400).json({ success: false, message: 'Statut invalide fourni.' }); }

    try {
        const checkSql = `SELECT id FROM appointments WHERE id = ? AND user_identifiant = ?`;
        const existingAppt = await dbGet(checkSql, [appointmentId, userIdentifiant]);
        if (!existingAppt) { return res.status(404).json({ success: false, message: 'Rendez-vous non trouvé ou accès non autorisé.' }); }

        const sql = `UPDATE appointments SET statut = ? WHERE id = ? AND user_identifiant = ?`;
        const params = [statut, appointmentId, userIdentifiant];
        const result = await dbRun(sql, params);
        console.log(`Statut RDV ${appointmentId} mis à jour à '${statut}' pour ${userIdentifiant}. Changes: ${result.changes}`);
        res.json({ success: true, message: 'Statut du rendez-vous mis à jour avec succès.' });
    } catch (error) { console.error(`Erreur PUT /api/appointments/${appointmentId}/status:`, error); res.status(500).json({ success: false, message: "Erreur serveur lors de la mise à jour du statut du rendez-vous." }); }
});
// ---------------------------

// --- Routes API Tâches ---
// GET /api/tasks
app.get('/api/tasks', async (req, res) => {
    console.log("Requête reçue sur GET /api/tasks");
    const userIdentifiant = 'admin'; // TODO: Auth
    try {
        const sql = `SELECT id, titre, date_echeance, responsable, priorite, statut, categorie_departement, est_complete FROM tasks WHERE user_identifiant = ? ORDER BY date_echeance ASC NULLS LAST, priorite DESC`;
        const tasks = await dbAll(sql, [userIdentifiant]);
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate'); res.setHeader('Pragma', 'no-cache'); res.setHeader('Expires', '0'); res.setHeader('Surrogate-Control', 'no-store');
        res.json({ success: true, tasks: tasks });
    } catch (error) {
        console.error("Erreur GET /api/tasks:", error);
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate'); res.setHeader('Pragma', 'no-cache'); res.setHeader('Expires', '0'); res.setHeader('Surrogate-Control', 'no-store');
        res.status(500).json({ success: false, message: "Erreur serveur récupération tâches." });
    }
});

// POST /api/tasks
app.post('/api/tasks', async (req, res) => {
    console.log("Requête reçue sur POST /api/tasks:", req.body);
    const userIdentifiant = 'admin'; // TODO: Auth
    const { titre, description, date_echeance, responsable, priorite, statut, categorie_departement } = req.body;
    if (!titre) return res.status(400).json({ success: false, message: 'Le titre de la tâche est requis.' });
    if (!statut || !['todo', 'inprogress', 'done'].includes(statut)) return res.status(400).json({ success: false, message: 'Statut invalide.' });
    if (!priorite || !['1', '2', '3'].includes(priorite)) return res.status(400).json({ success: false, message: 'Priorité invalide.' });

    let dueDateTimestamp = null;
    if (date_echeance) { try { const dateObj = new Date(date_echeance + 'T00:00:00'); if (!isNaN(dateObj.getTime())) dueDateTimestamp = dateObj.getTime(); else console.warn("Format date échéance invalide:", date_echeance); } catch(e) { console.warn("Erreur parsing date échéance:", date_echeance, e); } }
    const est_complete = (statut === 'done') ? 1 : 0; const date_completion = (statut === 'done') ? Date.now() : null;

    try {
        const sql = `INSERT INTO tasks (user_identifiant, titre, description, date_echeance, responsable, priorite, statut, categorie_departement, est_complete, date_completion) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        const params = [ userIdentifiant, titre, description || null, dueDateTimestamp, responsable || null, parseInt(priorite, 10), statut, categorie_departement || null, est_complete, date_completion ];
        const result = await dbRun(sql, params);
        console.log(`Nouvelle tâche créée ID: ${result.lastID} pour ${userIdentifiant}`);
        const newTask = await dbGet(`SELECT * FROM tasks WHERE id = ?`, [result.lastID]);
        res.status(201).json({ success: true, message: 'Tâche créée avec succès.', task: newTask });
    } catch (error) { console.error("Erreur POST /api/tasks:", error); res.status(500).json({ success: false, message: "Erreur serveur lors de la création de la tâche." }); }
});

// PUT /api/tasks/:id/status
app.put('/api/tasks/:id/status', async (req, res) => {
    const taskId = req.params.id; const { statut, est_complete } = req.body; const userIdentifiant = 'admin'; // TODO: Auth
    console.log(`Requête reçue sur PUT /api/tasks/${taskId}/status:`, req.body);
    if (!statut || !['todo', 'inprogress', 'done'].includes(statut)) return res.status(400).json({ success: false, message: 'Nouveau statut invalide.' });
    if (est_complete === undefined || ![0, 1].includes(Number(est_complete))) return res.status(400).json({ success: false, message: 'Valeur est_complete invalide (0 ou 1).' });
    const date_completion = (Number(est_complete) === 1) ? Date.now() : null;
    try {
        const sql = `UPDATE tasks SET statut = ?, est_complete = ?, date_completion = ? WHERE id = ? AND user_identifiant = ?`;
        const params = [statut, Number(est_complete), date_completion, taskId, userIdentifiant];
        const result = await dbRun(sql, params);
        if (result.changes === 0) return res.status(404).json({ success: false, message: 'Tâche non trouvée ou accès non autorisé.' });
        console.log(`Statut tâche ${taskId} mis à jour pour ${userIdentifiant}`);
        res.json({ success: true, message: 'Statut de la tâche mis à jour.' });
    } catch (error) { console.error(`Erreur PUT /api/tasks/${taskId}/status:`, error); res.status(500).json({ success: false, message: "Erreur serveur lors de la mise à jour du statut." }); }
});

// DELETE /api/tasks/:id
app.delete('/api/tasks/:id', async (req, res) => {
    const taskId = req.params.id; const userIdentifiant = 'admin'; // TODO: Auth
    console.log(`Requête reçue sur DELETE /api/tasks/${taskId}`);
    try {
        const sql = `DELETE FROM tasks WHERE id = ? AND user_identifiant = ?`;
        const result = await dbRun(sql, [taskId, userIdentifiant]);
        if (result.changes === 0) return res.status(404).json({ success: false, message: 'Tâche non trouvée ou accès non autorisé.' });
        console.log(`Tâche ${taskId} supprimée pour ${userIdentifiant}`);
        res.json({ success: true, message: 'Tâche supprimée avec succès.' });
    } catch (error) { console.error(`Erreur DELETE /api/tasks/${taskId}:`, error); res.status(500).json({ success: false, message: "Erreur serveur lors de la suppression de la tâche." }); }
});
// -----------------------

// Route racine
app.get('/', (req, res) => { res.sendFile(path.join(__dirname, 'index.html')); });

// Démarrage serveur
app.listen(PORT, () => { console.log(`Serveur démarré sur http://localhost:${PORT}`); });

// Fermeture propre de la DB
process.on('SIGINT', () => { db.close((err) => { if (err) console.error("Erreur fermeture DB:", err.message); else console.log('Base de données SQLite fermée.'); process.exit(err ? 1 : 0); }); });

