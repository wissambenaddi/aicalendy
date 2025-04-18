/**
 * Fichier : server.js
 * Description : Serveur Node.js Express avec API pour AiCalendy.
 * Gère l'authentification, les catégories, les rendez-vous, les tâches, le profil et les données du dashboard.
 */

const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const crypto = require('crypto'); // Pour générer des tokens

const app = express();
const PORT = process.env.PORT || 8080; // Utiliser variable d'environnement ou port par défaut
const saltRounds = 10; // Complexité du hachage bcrypt
const TOKEN_EXPIRY_DURATION = 3600000; // 1 heure en millisecondes pour l'expiration du token d'activation

// Configuration pour récupérer l'IP correctement derrière un proxy (si applicable)
app.set('trust proxy', true);

// Middlewares
app.use(express.json()); // Pour parser le JSON des requêtes
app.use(express.static(path.join(__dirname))); // Servir les fichiers statiques (HTML, CSS, JS client)

// --- Connexion à la base de données SQLite ---
const dbPath = path.resolve(__dirname, 'database.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("Erreur de connexion à la base de données:", err.message);
    } else {
        console.log("Connecté à la base de données SQLite.");
        // Activer les clés étrangères (important pour les relations, ex: suppression en cascade)
        db.run("PRAGMA foreign_keys = ON;", (pragmaErr) => {
            if (pragmaErr) {
                console.error("Erreur activation clés étrangères:", pragmaErr.message);
            } else {
                console.log("Clés étrangères activées.");
                initializeDatabase(); // Créer les tables si elles n'existent pas
            }
        });
    }
});

// --- Fonctions Helper pour la DB (Promesses) ---
function dbGet(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) {
                console.error("Erreur DB (get):", err.message, "SQL:", sql, "Params:", params); // Log détaillé
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
}

function dbAll(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) {
                console.error("Erreur DB (all):", err.message, "SQL:", sql, "Params:", params); // Log détaillé
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

function dbRun(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) { // Utiliser function() pour avoir accès à 'this'
            if (err) {
                console.error("Erreur DB (run):", err.message, "SQL:", sql, "Params:", params); // Log détaillé
                reject(err);
            } else {
                // Retourne { lastID, changes }
                resolve({ lastID: this.lastID, changes: this.changes });
            }
        });
    });
}

// --- Initialisation de la base de données ---
async function initializeDatabase() {
    try {
        console.log("Initialisation de la base de données...");
        // Table Utilisateurs (avec nouvelles colonnes profil)
        await dbRun(`CREATE TABLE IF NOT EXISTS users (
            identifiant TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            hashedPassword TEXT NOT NULL,
            firstName TEXT,
            lastName TEXT,
            role TEXT DEFAULT 'user',
            isActive INTEGER DEFAULT 0,
            activationToken TEXT,
            tokenExpiry INTEGER,
            phone TEXT,
            address TEXT,
            birthdate TEXT, -- Format YYYY-MM-DD
            timezone TEXT,
            language TEXT DEFAULT 'fr',
            theme TEXT DEFAULT 'light',
            homeSection TEXT DEFAULT 'dashboard',
            signature TEXT,
            avatarUrl TEXT,
            lastLoginTime INTEGER, -- Timestamp ms UTC
            lastLoginIp TEXT,
            lastLoginBrowser TEXT,
            team TEXT, -- Ajouté pour le profil
            specialty TEXT -- Ajouté pour le profil
        )`);
        console.log("Table 'users' vérifiée/créée.");

        // Table Catégories
        await dbRun(`CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            titre TEXT NOT NULL,
            description TEXT,
            couleur TEXT,
            icone TEXT,
            departement TEXT,
            responsable TEXT,
            FOREIGN KEY (user_id) REFERENCES users (identifiant) ON DELETE CASCADE
        )`);
        console.log("Table 'categories' vérifiée/créée.");

        // Table Rendez-vous
        await dbRun(`CREATE TABLE IF NOT EXISTS appointments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            categorie_id INTEGER,
            titre TEXT NOT NULL,
            heure_debut INTEGER NOT NULL, -- Timestamp ms UTC
            heure_fin INTEGER NOT NULL,   -- Timestamp ms UTC
            statut TEXT DEFAULT 'confirmed', -- confirmed, pending, canceled
            FOREIGN KEY (user_id) REFERENCES users (identifiant) ON DELETE CASCADE,
            FOREIGN KEY (categorie_id) REFERENCES categories (id) ON DELETE SET NULL -- Si cat supprimée, RDV reste mais sans cat
        )`);
        console.log("Table 'appointments' vérifiée/créée.");

        // Table Tâches
        await dbRun(`CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            titre TEXT NOT NULL,
            description TEXT,
            date_creation INTEGER,      -- Timestamp ms UTC
            date_echeance INTEGER,    -- Timestamp ms UTC (représente la date à minuit UTC)
            priorite INTEGER DEFAULT 2, -- 1: Basse, 2: Moyenne, 3: Haute
            statut TEXT DEFAULT 'todo', -- todo, inprogress, done
            est_complete INTEGER DEFAULT 0, -- 0: Non, 1: Oui
            responsable TEXT,
            categorie_departement TEXT, -- Lien optionnel vers catégorie/département
            FOREIGN KEY (user_id) REFERENCES users (identifiant) ON DELETE CASCADE
        )`);
        console.log("Table 'tasks' vérifiée/créée.");

        // Créer l'admin par défaut s'il n'existe pas
        await createDefaultAdmin();

        console.log("Initialisation de la base de données terminée.");

    } catch (error) {
        console.error("Erreur lors de l'initialisation de la base de données:", error);
    }
}

// Fonction pour créer l'admin par défaut
async function createDefaultAdmin() {
    const adminUser = 'admin';
    const adminEmail = 'admin@example.com'; // Changez ceci si nécessaire
    const adminPassword = 'password'; // IMPORTANT: Changez ce mot de passe !

    try {
        const existingAdmin = await dbGet('SELECT identifiant FROM users WHERE identifiant = ?', [adminUser]);
        if (!existingAdmin) {
            const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);
            await dbRun(
                'INSERT INTO users (identifiant, email, hashedPassword, firstName, lastName, role, isActive) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [adminUser, adminEmail, hashedPassword, 'Admin', 'Sys', 'admin', 1] // Activé par défaut
            );
            console.log(`Utilisateur admin par défaut '${adminUser}' créé.`);
        } else {
            // console.log(`Utilisateur admin '${adminUser}' existe déjà.`);
        }
    } catch (error) {
        console.error("Erreur lors de la création de l'admin par défaut:", error);
    }
}

// === Route de test simple ===
app.get('/api/test', (req, res) => {
    console.log('// DEBUG SERVER: /api/test route hit!'); // DEBUG LOG
    res.json({ success: true, message: 'Test route works!' });
});
// =====================================

// --- Routes API Authentification ---
app.post('/api/login', async (req, res) => {
    const { loginIdentifier, password } = req.body;
    console.log('Tentative de connexion pour:', loginIdentifier);
    if (!loginIdentifier || !password) {
        return res.status(400).json({ success: false, message: 'Identifiant/Email et mot de passe requis.' });
    }
    try {
        const user = await dbGet('SELECT * FROM users WHERE identifiant = ? OR email = ?', [loginIdentifier, loginIdentifier]);
        if (user && await bcrypt.compare(password, user.hashedPassword)) {
            if (user.isActive) {
                console.log('Connexion réussie pour:', user.identifiant);

                // === AJOUT : Mettre à jour les infos de sécurité ===
                const now = Date.now();
                // Essayer de récupérer l'IP (peut varier selon la config serveur/proxy)
                const ip = req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || req.connection?.socket?.remoteAddress || null;
                const userAgent = req.headers['user-agent'] || null;
                try {
                    await dbRun(
                        'UPDATE users SET lastLoginTime = ?, lastLoginIp = ?, lastLoginBrowser = ? WHERE identifiant = ?',
                        [now, ip, userAgent, user.identifiant]
                    );
                    console.log(`Infos sécurité MàJ pour ${user.identifiant}: IP=${ip}, UA=${userAgent}`);
                } catch (updateError) {
                    console.error("Erreur MàJ infos sécurité:", updateError);
                    // Continuer même si la MàJ échoue, la connexion est réussie
                }
                // =================================================

                res.json({
                    success: true,
                    message: 'Connexion réussie',
                    user: { // Ne pas renvoyer hashedPassword, token, etc.
                        identifiant: user.identifiant,
                        email: user.email,
                        name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
                        role: user.role
                        // Ajouter d'autres infos si nécessaire (ex: prefs de langue/thème)
                    }
                });
            } else {
                res.status(403).json({ success: false, message: 'Compte non activé. Vérifiez vos emails.' });
            }
        } else {
            res.status(401).json({ success: false, message: 'Identifiant/Email ou mot de passe incorrect.' });
        }
    } catch (error) {
        console.error("Erreur serveur lors de la connexion:", error);
        res.status(500).json({ success: false, message: 'Erreur serveur lors de la connexion.' });
    }
});

app.post('/api/register', async (req, res) => {
    const { firstName, lastName, email, password } = req.body;
    if (!firstName || !lastName || !email || !password) {
        return res.status(400).json({ success: false, message: 'Tous les champs sont requis.' });
    }
    // TODO: Ajouter validation email/password plus robuste
    try {
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const activationToken = crypto.randomBytes(20).toString('hex');
        const tokenExpiry = Date.now() + TOKEN_EXPIRY_DURATION;
        const identifiant = email; // Utiliser l'email comme identifiant unique pour simplifier

        await dbRun(
            'INSERT INTO users (identifiant, email, hashedPassword, firstName, lastName, activationToken, tokenExpiry) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [identifiant, email, hashedPassword, firstName, lastName, activationToken, tokenExpiry]
        );
        console.log(`Utilisateur ${identifiant} enregistré. Token: ${activationToken}`);
        // TODO: Envoyer l'email d'activation ici avec le lien contenant le token
        res.status(201).json({ success: true, message: 'Compte créé. Veuillez vérifier vos emails pour l\'activation.' });
    } catch (error) {
        if (error.message.includes('UNIQUE constraint failed: users.email') || error.message.includes('UNIQUE constraint failed: users.identifiant')) {
            res.status(409).json({ success: false, message: 'Cet email ou identifiant est déjà utilisé.' });
        } else {
            console.error("Erreur serveur lors de l'inscription:", error);
            res.status(500).json({ success: false, message: 'Erreur serveur lors de l\'inscription.' });
        }
    }
});

app.get('/api/activate', async (req, res) => {
    const { token } = req.query;
    if (!token) { return res.status(400).send('Token d\'activation manquant.'); }
    try {
        const user = await dbGet('SELECT * FROM users WHERE activationToken = ?', [token]);
        if (!user) { return res.status(400).send('Token invalide.'); }
        if (user.isActive) { return res.send('Compte déjà activé.'); }
        if (user.tokenExpiry < Date.now()) { return res.status(400).send('Token expiré.'); }

        await dbRun('UPDATE users SET isActive = 1, activationToken = NULL, tokenExpiry = NULL WHERE identifiant = ?', [user.identifiant]);
        console.log(`Compte ${user.identifiant} activé.`);
        // Rediriger vers la page de connexion avec un message de succès
        res.redirect('/connexion_account.html?activated=true');
    } catch (error) {
        console.error("Erreur lors de l'activation:", error);
        res.status(500).send('Erreur serveur lors de l\'activation.');
    }
});
// ---------------------------------------------

// --- Route API Dashboard Data ---
app.get('/api/dashboard/data', async (req, res) => {
    const userIdentifiant = 'admin'; // TODO: Remplacer par l'utilisateur authentifié
    console.log(`// DEBUG SERVER: Requête reçue sur /api/dashboard/data pour : ${userIdentifiant}`);
    res.setHeader('Cache-Control', 'no-store'); // Empêcher la mise en cache

    try {
        const now = Date.now();
        const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);

        // Rendez-vous aujourd'hui
        const appointmentsTodaySql = `SELECT id, titre, heure_debut FROM appointments WHERE user_id = ? AND heure_debut >= ? AND heure_debut <= ? AND statut != 'canceled' ORDER BY heure_debut ASC`;
        const appointmentsToday = await dbAll(appointmentsTodaySql, [userIdentifiant, todayStart.getTime(), todayEnd.getTime()]);

        // Tâches dues aujourd'hui
        const todayDateString = todayStart.toISOString().split('T')[0]; // YYYY-MM-DD
        const tasksDueTodaySql = `SELECT id, titre, date_echeance, est_complete FROM tasks WHERE user_id = ? AND date(date_echeance / 1000, 'unixepoch') = ? AND est_complete = 0 ORDER BY date_echeance ASC`;
        const tasksDueToday = await dbAll(tasksDueTodaySql, [userIdentifiant, todayDateString]);

        // Stats rapides
        const overdueTasksSql = `SELECT COUNT(*) as count FROM tasks WHERE user_id = ? AND est_complete = 0 AND date_echeance < ?`;
        const overdueResult = await dbGet(overdueTasksSql, [userIdentifiant, todayStart.getTime()]); // Comparer au début du jour
        const weekStart = new Date(todayStart); weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Dimanche
        const weekEnd = new Date(weekStart); weekEnd.setDate(weekEnd.getDate() + 7); weekEnd.setMilliseconds(-1); // Samedi fin de journée
        const appointmentsWeekSql = `SELECT COUNT(*) as count FROM appointments WHERE user_id = ? AND heure_debut >= ? AND heure_debut <= ? AND statut != 'canceled'`;
        const appointmentsWeekResult = await dbGet(appointmentsWeekSql, [userIdentifiant, weekStart.getTime(), weekEnd.getTime()]);

        // Tâches récentes / à venir (5 prochaines non terminées)
        const recentTasksSql = `
            SELECT id, titre, date_echeance, statut, est_complete
            FROM tasks
            WHERE user_id = ? AND est_complete = 0 AND date_echeance >= ?
            ORDER BY date_echeance ASC
            LIMIT 5`;
        const recentTasks = await dbAll(recentTasksSql, [userIdentifiant, todayStart.getTime()]); // Tâches à partir d'aujourd'hui

        console.log("// DEBUG SERVER: Données Dashboard récupérées:", { appointmentsToday, tasksDueToday, overdueResult, appointmentsWeekResult, recentTasks });

        res.json({
            success: true,
            data: {
                appointmentsToday: appointmentsToday || [],
                tasksDueToday: tasksDueToday || [],
                overdueTasksCount: overdueResult?.count || 0,
                appointmentsWeekCount: appointmentsWeekResult?.count || 0,
                recentTasks: recentTasks || []
            }
        });

    } catch (error) {
        console.error("// DEBUG SERVER: Erreur lors de la récupération des données du dashboard:", error);
        res.status(500).json({ success: false, message: "Erreur serveur." });
    }
});
// -----------------------------

// --- Routes API Catégories ---
app.get('/api/categories', async (req, res) => {
    console.log(`// DEBUG SERVER: Début du handler GET /api/categories`); // DEBUG LOG
    const userIdentifiant = 'admin'; // TODO: Auth
    console.log(`// DEBUG SERVER: Requête reçue sur GET /api/categories pour ${userIdentifiant}`);
    res.setHeader('Cache-Control', 'no-store');

    try {
        const sql = `SELECT id, titre, description, couleur, icone, departement, responsable
                     FROM categories
                     WHERE user_id = ?
                     ORDER BY titre ASC`;
        const categories = await dbAll(sql, [userIdentifiant]);
        console.log(`// DEBUG SERVER: Résultat DB pour catégories de ${userIdentifiant}:`, categories);

        const responseData = { success: true, categories: categories || [] };
        console.log(`// DEBUG SERVER: Envoi réponse pour GET /api/categories:`, responseData);
        res.json(responseData);

    } catch (error) {
        console.error(`// DEBUG SERVER: Erreur GET /api/categories pour ${userIdentifiant}:`, error);
        res.status(500).json({ success: false, message: "Erreur serveur lors de la récupération des catégories." });
    }
});

app.post('/api/categories', async (req, res) => {
    console.log(`// DEBUG SERVER: Début du handler POST /api/categories`); // DEBUG LOG
    const userIdentifiant = 'admin'; // TODO: Auth
    const { titre, description, couleur, icone, departement, responsable } = req.body;
    console.log(`// DEBUG SERVER: Données reçues pour POST /api/categories:`, req.body); // DEBUG LOG

    if (!titre) {
        console.log("// DEBUG SERVER: Titre manquant pour POST /api/categories"); // DEBUG LOG
        return res.status(400).json({ success: false, message: 'Le titre de la catégorie est requis.' });
    }

    try {
        const sql = `INSERT INTO categories (user_id, titre, description, couleur, icone, departement, responsable)
                     VALUES (?, ?, ?, ?, ?, ?, ?)`;
        const params = [
            userIdentifiant,
            titre,
            description || null,
            couleur || null,
            icone || null,
            departement || null,
            responsable || null
        ];

        console.log(`// DEBUG SERVER: Exécution SQL pour POST /api/categories:`, sql, params); // DEBUG LOG
        const result = await dbRun(sql, params);
        console.log(`// DEBUG SERVER: Résultat dbRun pour POST /api/categories:`, result); // DEBUG LOG

        if (result.lastID) {
            const newCategory = await dbGet('SELECT * FROM categories WHERE id = ?', [result.lastID]);
            console.log(`// DEBUG SERVER: Nouvelle catégorie récupérée:`, newCategory); // DEBUG LOG
            console.log(`// DEBUG SERVER: Envoi réponse succès pour POST /api/categories`); // DEBUG LOG
            res.status(201).json({ success: true, message: 'Catégorie créée avec succès.', category: newCategory });
        } else {
            console.error(`// DEBUG SERVER: Erreur lors de la création de catégorie (lastID manquant), résultat dbRun:`, result); // DEBUG LOG
            throw new Error('Impossible de récupérer la catégorie après création.');
        }

    } catch (error) {
        console.error(`// DEBUG SERVER: Erreur POST /api/categories pour ${userIdentifiant}:`, error); // DEBUG LOG
        res.status(500).json({ success: false, message: "Erreur serveur lors de la création de la catégorie." });
    }
});

app.delete('/api/categories/:id', async (req, res) => {
    const categoryId = req.params.id;
    const userIdentifiant = 'admin'; // TODO: Auth
    console.log(`Requête reçue: DELETE /api/categories/${categoryId} pour user ${userIdentifiant}`);
    try {
        const result = await dbRun('DELETE FROM categories WHERE id = ? AND user_id = ?', [categoryId, userIdentifiant]);
        if (result.changes > 0) {
            console.log(`Catégorie ${categoryId} supprimée.`);
            res.status(204).send(); // Succès sans contenu
        } else {
            console.log(`Catégorie ${categoryId} non trouvée ou non autorisée pour ${userIdentifiant}.`);
            res.status(404).json({ success: false, message: 'Catégorie non trouvée ou non autorisée.' });
        }
    } catch (error) {
        console.error(`Erreur DELETE /api/categories/${categoryId}:`, error);
        res.status(500).json({ success: false, message: 'Erreur serveur lors de la suppression.' });
    }
});
// --------------------------

// --- Routes API Rendez-vous ---
app.get('/api/appointments', async (req, res) => {
    const userIdentifiant = 'admin'; // TODO: Auth
    const categoryId = req.query.category_id;
    console.log(`GET /api/appointments pour ${userIdentifiant}, category_id: ${categoryId}`);
    res.setHeader('Cache-Control', 'no-store');
    try {
        let sql = `SELECT a.id, a.titre, a.heure_debut, a.heure_fin, a.statut, c.titre as categorie_titre, c.couleur as categorie_couleur
                   FROM appointments a
                   LEFT JOIN categories c ON a.categorie_id = c.id
                   WHERE a.user_id = ? AND a.statut != 'canceled'`;
        const params = [userIdentifiant];
        if (categoryId) {
            sql += ' AND a.categorie_id = ?';
            params.push(categoryId);
        }
        sql += ' ORDER BY a.heure_debut ASC';
        const appointments = await dbAll(sql, params);
        res.json({ success: true, appointments: appointments || [] });
    } catch (error) {
        console.error("Erreur GET /api/appointments:", error);
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
});

app.post('/api/appointments', async (req, res) => {
    console.log(`// DEBUG SERVER: Début du handler POST /api/appointments`); // DEBUG LOG
    const userIdentifiant = 'admin'; // TODO: Auth
    const { categorie_id, titre, heure_debut, heure_fin, statut } = req.body;
    console.log(`// DEBUG SERVER: Données reçues pour POST /api/appointments:`, req.body); // DEBUG LOG

    if (!categorie_id || !titre || !heure_debut || !heure_fin) {
        console.log("// DEBUG SERVER: Champs manquants pour POST /api/appointments");
        return res.status(400).json({ success: false, message: 'Les champs catégorie, titre, heure de début et heure de fin sont requis.' });
    }
    if (typeof heure_debut !== 'number' || typeof heure_fin !== 'number' || heure_fin <= heure_debut) {
        console.log("// DEBUG SERVER: Timestamps invalides ou incohérents pour POST /api/appointments");
        return res.status(400).json({ success: false, message: 'Les heures de début et de fin sont invalides ou incohérentes.' });
    }

    try {
        const sql = `INSERT INTO appointments (user_id, categorie_id, titre, heure_debut, heure_fin, statut) VALUES (?, ?, ?, ?, ?, ?)`;
        const params = [ userIdentifiant, categorie_id, titre, heure_debut, heure_fin, statut || 'confirmed' ];
        console.log(`// DEBUG SERVER: Exécution SQL pour POST /api/appointments:`, sql, params); // DEBUG LOG
        const result = await dbRun(sql, params);
        console.log(`// DEBUG SERVER: Résultat dbRun pour POST /api/appointments:`, result); // DEBUG LOG
        if (result.lastID) {
            const newAppointment = await dbGet('SELECT * FROM appointments WHERE id = ?', [result.lastID]);
            console.log(`// DEBUG SERVER: Nouveau RDV récupéré:`, newAppointment); // DEBUG LOG
            console.log(`// DEBUG SERVER: Envoi réponse succès pour POST /api/appointments`); // DEBUG LOG
            res.status(201).json({ success: true, message: 'Rendez-vous créé avec succès.', appointment: newAppointment });
        } else {
            console.error(`// DEBUG SERVER: Erreur lors de la création de RDV (lastID manquant), résultat dbRun:`, result);
            res.status(500).json({ success: false, message: "Erreur serveur lors de la récupération du rendez-vous créé." });
        }
    } catch (error) {
        console.error(`// DEBUG SERVER: Erreur POST /api/appointments pour ${userIdentifiant}:`, error);
        res.status(500).json({ success: false, message: "Erreur serveur lors de la création du rendez-vous." });
    }
});


app.get('/api/appointments/:id', async (req, res) => {
     const appointmentId = req.params.id;
     const userIdentifiant = 'admin'; // TODO: Auth
     console.log(`GET /api/appointments/${appointmentId} pour ${userIdentifiant}`);
     try {
         const sql = `SELECT a.*, c.titre as categorie_titre FROM appointments a LEFT JOIN categories c ON a.categorie_id = c.id WHERE a.id = ? AND a.user_id = ?`;
         const appointment = await dbGet(sql, [appointmentId, userIdentifiant]);
         if (appointment) {
             res.json({ success: true, appointment });
         } else {
             res.status(404).json({ success: false, message: 'Rendez-vous non trouvé.' });
         }
     } catch (error) {
         console.error(`Erreur GET /api/appointments/${appointmentId}:`, error);
         res.status(500).json({ success: false, message: 'Erreur serveur.' });
     }
});

app.put('/api/appointments/:id', async (req, res) => {
    const appointmentId = req.params.id;
    const userIdentifiant = 'admin'; // TODO: Auth
    const { titre, categorie_id, heure_debut, heure_fin } = req.body;
    console.log(`PUT /api/appointments/${appointmentId} pour ${userIdentifiant} avec données:`, req.body);

    if (!titre || !categorie_id || !heure_debut || !heure_fin || heure_fin <= heure_debut) {
        return res.status(400).json({ success: false, message: 'Données invalides ou manquantes.' });
    }

    try {
        const sql = `UPDATE appointments SET titre = ?, categorie_id = ?, heure_debut = ?, heure_fin = ?
                     WHERE id = ? AND user_id = ?`;
        const params = [titre, categorie_id, heure_debut, heure_fin, appointmentId, userIdentifiant];
        const result = await dbRun(sql, params);

        if (result.changes > 0) {
            const updatedAppointment = await dbGet('SELECT * FROM appointments WHERE id = ?', [appointmentId]);
            res.json({ success: true, message: 'Rendez-vous mis à jour.', appointment: updatedAppointment });
        } else {
            res.status(404).json({ success: false, message: 'Rendez-vous non trouvé ou non autorisé.' });
        }
    } catch (error) {
        console.error(`Erreur PUT /api/appointments/${appointmentId}:`, error);
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
});

app.put('/api/appointments/:id/status', async (req, res) => {
    const appointmentId = req.params.id;
    const { statut } = req.body;
    const userIdentifiant = 'admin'; // TODO: Auth
    console.log(`PUT /api/appointments/${appointmentId}/status à '${statut}' pour ${userIdentifiant}`);

    if (!statut || !['confirmed', 'pending', 'canceled'].includes(statut)) {
        return res.status(400).json({ success: false, message: 'Statut invalide.' });
    }

    try {
        const sql = `UPDATE appointments SET statut = ? WHERE id = ? AND user_id = ?`;
        const result = await dbRun(sql, [statut, appointmentId, userIdentifiant]);

        if (result.changes > 0) {
            res.json({ success: true, message: 'Statut mis à jour.' });
        } else {
            res.status(404).json({ success: false, message: 'Rendez-vous non trouvé ou non autorisé.' });
        }
    } catch (error) {
        console.error(`Erreur PUT /api/appointments/${appointmentId}/status:`, error);
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
});
// ---------------------------

// --- Routes API Tâches ---
app.get('/api/tasks', async (req, res) => {
    const userIdentifiant = 'admin'; // TODO: Auth
    console.log(`GET /api/tasks pour ${userIdentifiant}`);
    res.setHeader('Cache-Control', 'no-store');
    try {
        const sql = `SELECT * FROM tasks WHERE user_id = ? ORDER BY date_echeance ASC, date_creation DESC`;
        const tasks = await dbAll(sql, [userIdentifiant]);
        res.json({ success: true, tasks: tasks || [] });
    } catch (error) {
        console.error("Erreur GET /api/tasks:", error);
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
 });

app.post('/api/tasks', async (req, res) => {
    console.log(`// DEBUG SERVER: Début du handler POST /api/tasks`); // DEBUG LOG
    const userIdentifiant = 'admin'; // TODO: Auth
    const { titre, description, date_echeance, responsable, priorite, statut, categorie_departement } = req.body;
    console.log(`// DEBUG SERVER: Données reçues pour POST /api/tasks:`, req.body); // DEBUG LOG

    if (!titre) {
        console.log("// DEBUG SERVER: Titre manquant pour POST /api/tasks"); // DEBUG LOG
        return res.status(400).json({ success: false, message: 'Le titre de la tâche est requis.' });
    }

    let dueDateTimestamp = null;
    if (date_echeance && date_echeance.trim() !== '') {
        try {
            const dateParts = date_echeance.split('-');
            if (dateParts.length === 3) {
                 dueDateTimestamp = Date.UTC(parseInt(dateParts[0], 10), parseInt(dateParts[1], 10) - 1, parseInt(dateParts[2], 10));
                 if (isNaN(dueDateTimestamp)) { throw new Error('Date invalide après parsing UTC.'); }
                 console.log(`// DEBUG SERVER: Date échéance convertie en timestamp UTC: ${dueDateTimestamp} (pour ${date_echeance})`);
            } else { throw new Error('Format de date invalide.'); }
        } catch (e) {
            console.error("// DEBUG SERVER: Erreur conversion date échéance:", e);
            return res.status(400).json({ success: false, message: 'Format de date d\'échéance invalide (YYYY-MM-DD attendu).' });
        }
    } else { console.log("// DEBUG SERVER: Date d'échéance non fournie ou vide."); }

    const creationTimestamp = Date.now();
    const estComplete = (statut === 'done') ? 1 : 0;

    try {
        const sql = `INSERT INTO tasks (user_id, titre, description, date_creation, date_echeance, priorite, statut, est_complete, responsable, categorie_departement)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        const params = [ userIdentifiant, titre, description || null, creationTimestamp, dueDateTimestamp, priorite || 2, statut || 'todo', estComplete, responsable || null, categorie_departement || null ];

        console.log(`// DEBUG SERVER: Exécution SQL pour POST /api/tasks:`, sql, params); // DEBUG LOG
        const result = await dbRun(sql, params);
        console.log(`// DEBUG SERVER: Résultat dbRun pour POST /api/tasks:`, result); // DEBUG LOG

        if (result.lastID) {
            const newTask = await dbGet('SELECT * FROM tasks WHERE id = ?', [result.lastID]);
            console.log(`// DEBUG SERVER: Nouvelle tâche récupérée:`, newTask); // DEBUG LOG
            console.log(`// DEBUG SERVER: Envoi réponse succès pour POST /api/tasks`); // DEBUG LOG
            res.status(201).json({ success: true, message: 'Tâche créée avec succès.', task: newTask });
        } else {
            console.error(`// DEBUG SERVER: Erreur lors de la création de tâche (lastID manquant), résultat dbRun:`, result);
            res.status(500).json({ success: false, message: "Erreur serveur lors de la récupération de la tâche créée." });
        }

    } catch (error) {
        console.error(`// DEBUG SERVER: Erreur POST /api/tasks pour ${userIdentifiant}:`, error); // DEBUG LOG
        res.status(500).json({ success: false, message: "Erreur serveur lors de la création de la tâche." });
    }
});


app.put('/api/tasks/:id/status', async (req, res) => {
    const taskId = req.params.id;
    const { statut, est_complete } = req.body;
    const userIdentifiant = 'admin'; // TODO: Auth
    console.log(`// DEBUG SERVER: Début du handler PUT /api/tasks/${taskId}/status`); // DEBUG LOG
    console.log(`// DEBUG SERVER: Données reçues pour MàJ statut tâche ${taskId}:`, req.body); // DEBUG LOG

    if (statut === undefined || est_complete === undefined) {
        console.log(`// DEBUG SERVER: Statut ou est_complete manquant pour PUT /api/tasks/${taskId}/status`);
        return res.status(400).json({ success: false, message: 'Le statut et l\'état complet sont requis.' });
    }
    if (!['todo', 'inprogress', 'done'].includes(statut)) {
        console.log(`// DEBUG SERVER: Statut invalide pour PUT /api/tasks/${taskId}/status:`, statut);
        return res.status(400).json({ success: false, message: 'Statut invalide.' });
    }
    if (typeof est_complete !== 'number' || (est_complete !== 0 && est_complete !== 1)) {
         console.log(`// DEBUG SERVER: est_complete invalide pour PUT /api/tasks/${taskId}/status:`, est_complete);
        return res.status(400).json({ success: false, message: 'État complet invalide (doit être 0 ou 1).' });
    }

    try {
        const sql = `UPDATE tasks SET statut = ?, est_complete = ? WHERE id = ? AND user_id = ?`;
        const params = [statut, est_complete, taskId, userIdentifiant];
        console.log(`// DEBUG SERVER: Exécution SQL pour PUT /api/tasks/${taskId}/status:`, sql, params); // DEBUG LOG
        const result = await dbRun(sql, params);
        console.log(`// DEBUG SERVER: Résultat dbRun pour PUT /api/tasks/${taskId}/status:`, result); // DEBUG LOG
        if (result.changes > 0) {
            const updatedTask = await dbGet('SELECT * FROM tasks WHERE id = ?', [taskId]);
            console.log(`// DEBUG SERVER: Tâche récupérée après MàJ statut:`, updatedTask); // DEBUG LOG
            console.log(`// DEBUG SERVER: Envoi réponse succès pour PUT /api/tasks/${taskId}/status`); // DEBUG LOG
            res.json({ success: true, message: 'Statut de la tâche mis à jour.', task: updatedTask });
        } else {
            console.log(`// DEBUG SERVER: Tâche ${taskId} non trouvée ou non autorisée pour MàJ statut par ${userIdentifiant}.`);
            res.status(404).json({ success: false, message: 'Tâche non trouvée ou non autorisée.' });
        }
    } catch (error) {
        console.error(`// DEBUG SERVER: Erreur PUT /api/tasks/${taskId}/status pour ${userIdentifiant}:`, error);
        res.status(500).json({ success: false, message: "Erreur serveur lors de la mise à jour du statut de la tâche." });
    }
});

app.delete('/api/tasks/:id', async (req, res) => {
    const taskId = req.params.id;
    const userIdentifiant = 'admin'; // TODO: Auth
    console.log(`// DEBUG SERVER: Début du handler DELETE /api/tasks/${taskId}`); // DEBUG LOG
    console.log(`// DEBUG SERVER: Requête reçue pour DELETE /api/tasks/${taskId} pour user ${userIdentifiant}`); // DEBUG LOG
    try {
        const sql = 'DELETE FROM tasks WHERE id = ? AND user_id = ?';
        const params = [taskId, userIdentifiant];
        console.log(`// DEBUG SERVER: Exécution SQL pour DELETE /api/tasks/${taskId}:`, sql, params); // DEBUG LOG
        const result = await dbRun(sql, params);
        console.log(`// DEBUG SERVER: Résultat dbRun pour DELETE /api/tasks/${taskId}:`, result); // DEBUG LOG
        if (result.changes > 0) {
            console.log(`// DEBUG SERVER: Tâche ${taskId} supprimée.`); // DEBUG LOG
            console.log(`// DEBUG SERVER: Envoi réponse succès (204) pour DELETE /api/tasks/${taskId}`); // DEBUG LOG
            res.status(204).send(); // Succès sans contenu
        } else {
            console.log(`// DEBUG SERVER: Tâche ${taskId} non trouvée ou non autorisée pour suppression par ${userIdentifiant}.`);
            res.status(404).json({ success: false, message: 'Tâche non trouvée ou non autorisée.' });
        }
    } catch (error) {
        console.error(`// DEBUG SERVER: Erreur DELETE /api/tasks/${taskId} pour ${userIdentifiant}:`, error);
        res.status(500).json({ success: false, message: 'Erreur serveur lors de la suppression de la tâche.' });
    }
});
// ---------------------------

// --- Routes API Profil Utilisateur ---
app.get('/api/profile', async (req, res) => {
    const userIdentifiant = 'admin'; // TODO: Auth
    console.log(`Requête reçue sur GET /api/profile pour ${userIdentifiant}`);
    res.setHeader('Cache-Control', 'no-store');
    try {
        const sql = `SELECT identifiant, email, firstName, lastName, role, phone, address, birthdate, timezone, language, theme, homeSection, signature, avatarUrl, lastLoginTime, lastLoginIp, lastLoginBrowser, team, specialty FROM users WHERE identifiant = ?`; // Ajout team, specialty
        const profileData = await dbGet(sql, [userIdentifiant]);
        if (!profileData) { return res.status(404).json({ success: false, message: 'Profil non trouvé.' }); }
        const profile = {
            identifiant: profileData.identifiant, email: profileData.email, firstName: profileData.firstName, lastName: profileData.lastName, role: profileData.role, phone: profileData.phone, address: profileData.address, birthdate: profileData.birthdate, timezone: profileData.timezone, language: profileData.language, theme: profileData.theme, homeSection: profileData.homeSection, signature: profileData.signature, avatarUrl: profileData.avatarUrl,
            team: profileData.team, // Ajouté
            specialty: profileData.specialty, // Ajouté
            security: { last_login: profileData.lastLoginTime, last_ip: profileData.lastLoginIp, last_browser: profileData.lastLoginBrowser, auth_method: 'Email/Mdp' },
            stats: { category_count: null, appointment_count: null, attendance_rate: null } // TODO: Calculer stats
        };
        res.json({ success: true, profile: profile });
    } catch (error) {
        console.error(`Erreur GET /api/profile pour ${userIdentifiant}:`, error);
        res.status(500).json({ success: false, message: "Erreur serveur lors de la récupération du profil." });
    }
});

app.put('/api/profile', async (req, res) => {
    const userIdentifiant = 'admin'; // TODO: Auth
    console.log(`Requête reçue sur PUT /api/profile pour ${userIdentifiant}:`, req.body);
    const { firstName, lastName, email, phone, address, birthdate, timezone, team, specialty /* Ajouter: language, theme, homeSection, signature, avatarUrl */ } = req.body;
    if (!firstName || !lastName || !email) { return res.status(400).json({ success: false, message: 'Prénom, nom et email sont requis.' }); }
    // TODO: Ajouter validations
    try {
        const emailCheckSql = `SELECT identifiant FROM users WHERE email = ? AND identifiant != ?`;
        const existingUser = await dbGet(emailCheckSql, [email, userIdentifiant]);
        if (existingUser) { return res.status(409).json({ success: false, message: 'Cet email est déjà utilisé par un autre compte.' }); }

        // Construire la requête UPDATE dynamiquement serait plus robuste, mais pour l'instant :
        const updateSql = `UPDATE users SET
            firstName = ?, lastName = ?, email = ?, phone = ?, address = ?,
            birthdate = ?, timezone = ?, team = ?, specialty = ?
            -- Ajouter language = ?, theme = ?, homeSection = ?, signature = ?, avatarUrl = ? ici si besoin
            WHERE identifiant = ?`;
        const params = [
            firstName, lastName, email,
            phone || null, address || null, birthdate || null, timezone || null,
            team || null, specialty || null, // Ajouté
            // Ajouter les autres champs ici
            userIdentifiant
        ];
        console.log("// DEBUG SERVER: Exécution UPDATE Profile:", updateSql, params);
        const result = await dbRun(updateSql, params);
        if (result.changes === 0) { return res.status(404).json({ success: false, message: 'Utilisateur non trouvé.' }); }
        console.log(`Profil ${userIdentifiant} mis à jour.`);
        // Renvoyer le profil complet mis à jour (sans le mot de passe)
        const updatedProfileData = await dbGet(`SELECT identifiant, email, firstName, lastName, role, phone, address, birthdate, timezone, language, theme, homeSection, signature, avatarUrl, lastLoginTime, lastLoginIp, lastLoginBrowser, team, specialty FROM users WHERE identifiant = ?`, [userIdentifiant]);
        const updatedProfile = {
            identifiant: updatedProfileData.identifiant, email: updatedProfileData.email, firstName: updatedProfileData.firstName, lastName: updatedProfileData.lastName, role: updatedProfileData.role, phone: updatedProfileData.phone, address: updatedProfileData.address, birthdate: updatedProfileData.birthdate, timezone: updatedProfileData.timezone, language: updatedProfileData.language, theme: updatedProfileData.theme, homeSection: updatedProfileData.homeSection, signature: updatedProfileData.signature, avatarUrl: updatedProfileData.avatarUrl,
            team: updatedProfileData.team, specialty: updatedProfileData.specialty, // Ajouté
            security: { last_login: updatedProfileData.lastLoginTime, last_ip: updatedProfileData.lastLoginIp, last_browser: updatedProfileData.lastLoginBrowser, auth_method: 'Email/Mdp' },
            stats: { category_count: null, appointment_count: null, attendance_rate: null }
        };
        res.json({ success: true, message: 'Profil mis à jour avec succès.', profile: updatedProfile });
    } catch (error) {
        console.error(`Erreur PUT /api/profile pour ${userIdentifiant}:`, error);
         if (error.message && error.message.includes('UNIQUE constraint failed') && error.message.includes('users.email')) { res.status(409).json({ success: false, message: 'Cet email est déjà utilisé par un autre compte.' }); }
         else { res.status(500).json({ success: false, message: "Erreur serveur lors de la mise à jour du profil." }); }
    }
});
// -----------------------------------

// --- Route racine et démarrage serveur ---
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
});

// Fermer proprement la DB lors de l'arrêt du serveur
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            return console.error(err.message);
        }
        console.log('Connexion à la base de données fermée.');
        process.exit(0);
    });
});
