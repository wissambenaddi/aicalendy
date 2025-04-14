/**
 * Fichier : server.js (Exemple Backend Minimaliste)
 * Description : Serveur Node.js simple avec Express pour gérer
 * les requêtes d'authentification (login/register).
 *
 * ATTENTION : CE CODE EST UNIQUEMENT POUR ILLUSTRATION.
 * IL N'EST PAS SÉCURISÉ POUR LA PRODUCTION !
 * - Les mots de passe sont stockés et comparés en clair.
 * - Pas de validation d'entrée robuste.
 * - Pas de gestion de session/token sécurisée.
 * - Gestion des erreurs minimale.
 */

const express = require('express');
const path = require('path'); // Pour servir les fichiers statiques (HTML, CSS, JS)
const app = express();
const PORT = 8080; // Port sur lequel le serveur écoutera

// Middleware pour parser le JSON dans le corps des requêtes POST
app.use(express.json());

// Middleware pour servir les fichiers statiques (HTML, CSS, JS du dossier courant)
// Permet au navigateur de charger index.html, style.css, translator.js, etc.
app.use(express.static(path.join(__dirname))); // Sert les fichiers depuis le dossier où server.js est lancé

// --- Base de données Utilisateurs (Simulation en mémoire) ---
// ATTENTION : En production, utilisez une vraie base de données (SQL, NoSQL)
//             et stockez les mots de passe HACHÉS (avec bcrypt).
const users = {
    // Exemple d'utilisateur (mot de passe en clair - MAUVAISE PRATIQUE !)
    "test@example.com": {
        password: "password123",
        name: "Utilisateur Test",
        role: "Utilisateur" // Exemple de rôle
    },
    "admin@example.com": {
        password: "password123",
        name: "Administrateur",
        role: "Admin" // Exemple de rôle
    }
};
// -------------------------------------------------------------

// --- Route API pour la Connexion ---
app.post('/api/login', (req, res) => {
    console.log('Requête reçue sur /api/login:', req.body);
    const { email, password } = req.body;

    // Vérification très basique (manque validation d'entrée)
    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email et mot de passe requis.' });
    }

    const user = users[email];

    // ATTENTION : Comparaison de mot de passe en clair (NON SÉCURISÉ !)
    if (user && user.password === password) {
        // Connexion réussie
        console.log(`Connexion réussie pour ${email}`);
        // En production: générer un token JWT ou une session ici
        const dummyToken = `fake-token-for-${email}-${Date.now()}`;
        res.json({
            success: true,
            message: 'Connexion réussie !',
            token: dummyToken, // Envoyer un token (même factice ici)
            user: { name: user.name, role: user.role } // Envoyer quelques infos utilisateur
        });
    } else {
        // Échec de la connexion
        console.log(`Échec de connexion pour ${email}`);
        res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect.' });
    }
});
// -----------------------------------

// --- Route API pour l'Inscription ---
app.post('/api/register', (req, res) => {
    console.log('Requête reçue sur /api/register:', req.body);
    const { email, password } = req.body;

    // Validation très basique
    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email et mot de passe requis.' });
    }
    // Ajouter validation format email, longueur mot de passe, etc.

    // Vérifier si l'utilisateur existe déjà
    if (users[email]) {
        console.log(`Tentative d'inscription échouée (email déjà pris): ${email}`);
        return res.status(409).json({ success: false, message: 'Cet email est déjà utilisé.' }); // 409 Conflict
    }

    // ATTENTION : Stockage du mot de passe en clair (NON SÉCURISÉ !)
    // En production: hacher le mot de passe avec bcrypt avant de le stocker
    users[email] = {
        password: password, // HACHER CE MOT DE PASSE !
        name: "Nouvel Utilisateur", // Nom par défaut
        role: "Utilisateur"
    };

    console.log(`Nouvel utilisateur enregistré: ${email}`);
    res.status(201).json({ success: true, message: 'Compte créé avec succès !' }); // 201 Created
});
// ------------------------------------

// --- Route pour servir index.html par défaut ---
// Si quelqu'un accède à la racine, on sert index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});
// -------------------------------------------


// Démarrage du serveur
app.listen(PORT, () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
    console.log('ATTENTION : Ce serveur est un exemple non sécurisé à des fins de démonstration.');
});