/**
 * Fichier : server.js
 * Description : Serveur Node.js complet avec Express gérant l'authentification
 * et les APIs pour les catégories, rendez-vous, dashboard, et tâches.
 */

const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const app = express();
const PORT = 8080;
const saltRounds = 10;
const TOKEN_EXPIRY_DURATION = 3600000; // 1 heure en millisecondes

// Middlewares
app.use(express.json()); // Pour parser le JSON des requêtes
app.use(express.static(path.join(__dirname))); // Pour servir les fichiers statiques (HTML, CSS, JS client)

// --- Connexion DB et Création/Vérification des Tables ---
const db = new sqlite3.Database('./database.db', (err) => {
    if (err) {
        console.error("Erreur fatale connexion DB:", err.message);
        process.exit(1); // Arrêter si la DB n'est pas accessible
    } else {
        console.log('Connecté à la base de données SQLite.');
        // Utiliser serialize pour exécuter les créations de table en séquence
        // et s'assurer que les FOREIGN KEYS sont créées après les tables référencées.
        db.serialize(() => {
            // Table users
            db.run(`CREATE TABLE IF NOT EXISTS users (
                identifiant TEXT PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                hashedPassword TEXT NOT NULL,
                firstName TEXT,
                lastName TEXT,
                role TEXT,
                isActive INTEGER DEFAULT 0,
                activationToken TEXT,
                tokenExpiry INTEGER
            )`, (err) => { if (err) console.error("Erreur table users:", err.message); else console.log("Table 'users' prête."); });

            // Table categories (créée avant appointments et tasks si FK utilisées)
            db.run(`CREATE TABLE IF NOT EXISTS categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_identifiant TEXT NOT NULL,
                titre TEXT NOT NULL,
                description TEXT,
                duree INTEGER,
                couleur TEXT,
                FOREIGN KEY (user_identifiant) REFERENCES users (identifiant) ON DELETE CASCADE
            )`, (err) => { if (err) console.error("Erreur table categories:", err.message); else console.log("Table 'categories' prête."); });

            // Table tasks
            db.run(`CREATE TABLE IF NOT EXISTS tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_identifiant TEXT NOT NULL,
                titre TEXT NOT NULL,
                description TEXT,
                date_echeance INTEGER,          -- Timestamp ms
                responsable TEXT,
                priorite INTEGER DEFAULT 2,     -- 1=Basse, 2=Moyenne, 3=Haute
                statut TEXT DEFAULT 'todo',     -- 'todo', 'inprogress', 'done'
                categorie_departement TEXT,
                est_complete INTEGER NOT NULL DEFAULT 0, -- 0=non, 1=oui
                date_completion INTEGER,        -- Timestamp ms
                FOREIGN KEY (user_identifiant) REFERENCES users (identifiant) ON DELETE CASCADE
            )`, (err) => { if (err) console.error("Erreur table tasks:", err.message); else console.log("Table 'tasks' prête."); });

            // Table appointments
            db.run(`CREATE TABLE IF NOT EXISTS appointments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_identifiant TEXT NOT NULL,
                titre TEXT,
                heure_debut INTEGER NOT NULL, -- Timestamp ms
                heure_fin INTEGER,            -- Timestamp ms
                categorie_id INTEGER,
                FOREIGN KEY (user_identifiant) REFERENCES users (identifiant) ON DELETE CASCADE,
                FOREIGN KEY (categorie_id) REFERENCES categories (id) ON DELETE SET NULL
            )`, (err) => {
                if (err) console.error("Erreur table appointments:", err.message);
                else {
                    console.log("Table 'appointments' prête.");
                    // Création admin par défaut (une fois toutes les tables potentiellement créées)
                    createDefaultAdmin();
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
                        else console.log("Utilisateur Admin par défaut créé.");
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
            const dummyToken = `fake-token-for-${user.identifiant}-${Date.now()}`; // Remplacer par JWT
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
        // Générer identifiant unique
        const baseIdentifiant = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
        let identifiant = baseIdentifiant; let counter = 0; let unique = false;
        while (!unique) { const row = await dbGet(`SELECT identifiant FROM users WHERE identifiant = ?`, [identifiant]); if (!row) unique = true; else identifiant = `${baseIdentifiant}${++counter}`; }
        // Générer token activation
        const activationToken = crypto.randomBytes(32).toString('hex');
        const tokenExpiry = Date.now() + TOKEN_EXPIRY_DURATION;

        const insertSql = `INSERT INTO users (identifiant, email, hashedPassword, firstName, lastName, role, isActive, activationToken, tokenExpiry) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        await dbRun(insertSql, [identifiant, email, hashedPassword, firstName, lastName, "Utilisateur", 0, activationToken, tokenExpiry]);

        console.log(`Nouvel utilisateur pré-enregistré: ${email} (identifiant: ${identifiant})`);
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
        res.redirect('/connexion_account.html?activated=true');

    } catch (error) { console.error("Erreur lors de l'activation:", error); res.status(500).send('<!DOCTYPE html><html><body><h1>Erreur serveur.</h1></body></html>'); }
});
// ---------------------------------------------

// --- Route API Dashboard ---
app.get('/api/dashboard/data', async (req, res) => {
    console.log("Requête reçue sur /api/dashboard/data");
    const userIdentifiant = 'admin'; // TODO: Remplacer par Auth
    console.log(`Récupération données dashboard pour: ${userIdentifiant}`);

    try {
        const nowMs = Date.now(); const startOfDay = new Date(nowMs).setHours(0, 0, 0, 0); const startOfTomorrow = startOfDay + 24*60*60*1000; const startOfTwoDaysLater = startOfTomorrow + 24*60*60*1000; const startOfWeek = new Date(startOfDay - ((new Date(nowMs).getDay() + 6) % 7) * 24*60*60*1000).getTime(); const startOfNextWeek = startOfWeek + 7*24*60*60*1000;

        const appointmentsTodayPromise = dbAll(`SELECT id, titre, heure_debut FROM appointments WHERE user_identifiant = ? AND heure_debut >= ? AND heure_debut < ? ORDER BY heure_debut ASC LIMIT 5`, [userIdentifiant, startOfDay, startOfTomorrow]);
        const tasksDueTodayPromise = dbAll(`SELECT id, titre, date_echeance FROM tasks WHERE user_identifiant = ? AND est_complete = 0 AND date_echeance >= ? AND date_echeance < ? ORDER BY date_echeance ASC LIMIT 5`, [userIdentifiant, startOfDay, startOfTomorrow]);
        const overdueTasksPromise = dbGet(`SELECT COUNT(*) as count FROM tasks WHERE user_identifiant = ? AND est_complete = 0 AND date_echeance < ?`, [userIdentifiant, startOfDay]);
        const appointmentsWeekPromise = dbGet(`SELECT COUNT(*) as count FROM appointments WHERE user_identifiant = ? AND heure_debut >= ? AND heure_debut < ?`, [userIdentifiant, startOfWeek, startOfNextWeek]);
        const weeklyProgressPromise = new Promise((resolve, reject) => { const sevenDaysAgo = nowMs - 7*24*60*60*1000; const sql = `SELECT strftime('%w', date_completion / 1000, 'unixepoch') as dayOfWeek, COUNT(*) as count FROM tasks WHERE user_identifiant = ? AND est_complete = 1 AND date_completion >= ? GROUP BY dayOfWeek ORDER BY dayOfWeek ASC`; db.all(sql, [userIdentifiant, sevenDaysAgo], (err, rows) => { if (err) reject(err); else { const weeklyData = Array(7).fill(0); rows.forEach(row => { const dayIndex = parseInt(row.dayOfWeek, 10); if (dayIndex >= 0 && dayIndex < 7) weeklyData[dayIndex] = row.count; }); resolve(weeklyData); } }); });

        const [ appointmentsToday, tasksDueToday, overdueTasksResult, appointmentsWeekResult, weeklyProgressData ] = await Promise.all([ appointmentsTodayPromise, tasksDueTodayPromise, overdueTasksPromise, appointmentsWeekPromise, weeklyProgressPromise ]);

        res.json({ success: true, data: { appointmentsToday, tasksDueToday, overdueTasksCount: overdueTasksResult?.count || 0, appointmentsWeekCount: appointmentsWeekResult?.count || 0, weeklyProgressData } });
    } catch (error) { console.error("Erreur récupération données dashboard:", error); res.status(500).json({ success: false, message: "Erreur serveur récupération données dashboard." }); }
});
// -----------------------------

// --- Routes API Catégories ---
app.get('/api/categories', async (req, res) => {
    console.log("Requête reçue sur GET /api/categories");
    const userIdentifiant = 'admin'; // TODO: Auth
    try {
        const sql = `SELECT id, titre, description, couleur, duree FROM categories WHERE user_identifiant = ? ORDER BY titre ASC`;
        const categories = await dbAll(sql, [userIdentifiant]);
        console.log(`Catégories trouvées pour ${userIdentifiant}:`, categories.length);
        res.json({ success: true, categories: categories });
    } catch (error) { console.error("Erreur GET /api/categories:", error); res.status(500).json({ success: false, message: "Erreur serveur récupération catégories." }); }
});

app.post('/api/categories', async (req, res) => {
    console.log("Requête reçue sur POST /api/categories:", req.body);
    const userIdentifiant = 'admin'; // TODO: Auth
    const { titre, description, duree, couleur } = req.body;
    if (!titre) return res.status(400).json({ success: false, message: 'Le titre de la catégorie est requis.' });

    try {
        const sql = `INSERT INTO categories (user_identifiant, titre, description, duree, couleur) VALUES (?, ?, ?, ?, ?)`;
        const params = [ userIdentifiant, titre, description || null, duree ? parseInt(duree, 10) : null, couleur || null ];
        const result = await dbRun(sql, params);
        console.log(`Nouvelle catégorie créée ID: ${result.lastID} pour ${userIdentifiant}`);
        const newCategory = await dbGet(`SELECT * FROM categories WHERE id = ?`, [result.lastID]);
        res.status(201).json({ success: true, message: 'Catégorie créée avec succès.', category: newCategory });
    } catch (error) { console.error("Erreur POST /api/categories:", error); res.status(500).json({ success: false, message: "Erreur serveur lors de la création de la catégorie." }); }
});
// --------------------------

// --- Route API Rendez-vous ---
app.get('/api/appointments', async (req, res) => {
    const categoryId = req.query.category_id; console.log(`Requête reçue sur /api/appointments ${categoryId ? 'pour catégorie id ' + categoryId : '(tous)'}`);
    const userIdentifiant = 'admin'; // TODO: Auth
    try {
        let sql = `SELECT id, titre, heure_debut, heure_fin, categorie_id FROM appointments WHERE user_identifiant = ?`;
        const params = [userIdentifiant];
        if (categoryId) { sql += ` AND categorie_id = ?`; params.push(categoryId); }
        sql += ` ORDER BY heure_debut ASC`;
        const appointments = await dbAll(sql, params);
        console.log(`RDV trouvés pour ${userIdentifiant} ${categoryId ? 'catégorie ' + categoryId : ''}:`, appointments.length);
        res.json({ success: true, appointments: appointments });
    } catch (error) { console.error("Erreur récupération rendez-vous:", error); res.status(500).json({ success: false, message: "Erreur serveur récupération rendez-vous." }); }
});
// ---------------------------

// --- Routes API Tâches ---
app.get('/api/tasks', async (req, res) => {
    console.log("Requête reçue sur GET /api/tasks");
    const userIdentifiant = 'admin'; // TODO: Auth
    try {
        const sql = `SELECT id, titre, date_echeance, responsable, priorite, statut, categorie_departement, est_complete FROM tasks WHERE user_identifiant = ? ORDER BY date_echeance ASC NULLS LAST`;
        const tasks = await dbAll(sql, [userIdentifiant]);
        res.json({ success: true, tasks: tasks });
    } catch (error) { console.error("Erreur GET /api/tasks:", error); res.status(500).json({ success: false, message: "Erreur serveur récupération tâches." }); }
});

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
// -----------------------

// Route racine
app.get('/', (req, res) => { res.sendFile(path.join(__dirname, 'index.html')); });

// Démarrage serveur
app.listen(PORT, () => { console.log(`Serveur démarré sur http://localhost:${PORT}`); });

// Fermeture propre de la DB
process.on('SIGINT', () => { db.close((err) => { if (err) console.error("Erreur fermeture DB:", err.message); else console.log('Base de données SQLite fermée.'); process.exit(err ? 1 : 0); }); });

