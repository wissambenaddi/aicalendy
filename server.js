/**
 * Fichier : server.js (Exemple Backend Minimaliste)
 * Description : Serveur Node.js simple avec Express pour gérer
 * les requêtes d'authentification (login/register).
 * Login accepte maintenant un 'loginIdentifier' (identifiant ou email).
 *
 * ATTENTION : TOUJOURS NON SÉCURISÉ POUR LA PRODUCTION !
 */

const express = require('express');
const path = require('path');
const app = express();
const PORT = 8080;

app.use(express.json());
app.use(express.static(path.join(__dirname)));

// --- Base de données Utilisateurs (Simulation en mémoire) ---
// Utilise des identifiants simples comme clés, mais stocke aussi l'email.
const users = {
    "testuser": { // Identifiant simple
        password: "password123", // NON SÉCURISÉ
        name: "Utilisateur Test",
        role: "Utilisateur",
        email: "test@example.com" // Email associé
    },
    "admin": { // Identifiant simple
        password: "admin", // NON SÉCURISÉ
        name: "Administrateur",
        role: "Admin",
        email: "admin@example.com" // Email associé
    }
};
// -------------------------------------------------------------

// --- Route API pour la Connexion ---
app.post('/api/login', (req, res) => {
    // === MODIFIÉ : Attend 'loginIdentifier' ===
    console.log('Requête reçue sur /api/login:', req.body);
    const { loginIdentifier, password } = req.body; // Accepte un identifiant générique

    if (!loginIdentifier || !password) {
        return res.status(400).json({ success: false, message: 'Identifiant/Email et mot de passe requis.' });
    }

    let user = null;
    let foundByIdentifier = false;

    // === MODIFIÉ : Logique de recherche ===
    // 1. Chercher par identifiant simple (clé de l'objet)
    if (users[loginIdentifier]) {
        user = users[loginIdentifier];
        foundByIdentifier = true;
        console.log(`Utilisateur trouvé par identifiant: ${loginIdentifier}`);
    } else {
        // 2. Si non trouvé, chercher par email dans les valeurs de l'objet
        console.log(`Identifiant non trouvé comme clé, recherche par email: ${loginIdentifier}`);
        const userId = Object.keys(users).find(key => users[key].email === loginIdentifier);
        if (userId) {
            user = users[userId];
            console.log(`Utilisateur trouvé par email (${loginIdentifier}) sous l'identifiant: ${userId}`);
        } else {
             console.log(`Aucun utilisateur trouvé pour: ${loginIdentifier}`);
        }
    }
    // ==================================

    // ATTENTION : Comparaison de mot de passe en clair (NON SÉCURISÉ !)
    if (user && user.password === password) {
        // Connexion réussie
        const identifierUsed = foundByIdentifier ? loginIdentifier : user.email; // Utilise l'identifiant ou l'email pour le log/token
        console.log(`Connexion réussie pour ${identifierUsed}`);
        const dummyToken = `fake-token-for-${identifierUsed}-${Date.now()}`;
        res.json({
            success: true,
            message: 'Connexion réussie !',
            token: dummyToken,
            user: { name: user.name, role: user.role, email: user.email }
        });
    } else {
        // Échec de la connexion
        console.log(`Échec de connexion pour ${loginIdentifier}`);
        res.status(401).json({ success: false, message: 'Identifiant/Email ou mot de passe incorrect.' }); // Message mis à jour
    }
});
// -----------------------------------

// --- Route API pour l'Inscription ---
// Reste inchangée pour l'instant (utilise toujours l'email comme identifiant unique principal)
app.post('/api/register', (req, res) => {
    console.log('Requête reçue sur /api/register:', req.body);
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email et mot de passe requis.' });
    }

    const emailExists = Object.values(users).some(u => u.email === email);
    if (emailExists) {
         console.log(`Tentative d'inscription échouée (email déjà pris): ${email}`);
         return res.status(409).json({ success: false, message: 'Cet email est déjà utilisé.' });
    }

    // Création d'un identifiant simple (à améliorer si nécessaire)
    const baseIdentifiant = email.split('@')[0];
    let newIdentifiant = baseIdentifiant;
    let counter = 0;
    while(users[newIdentifiant]) { // Assure l'unicité de l'identifiant simple
        counter++;
        newIdentifiant = `${baseIdentifiant}${counter}`;
    }

    users[newIdentifiant] = {
        password: password, // HACHER CE MOT DE PASSE !
        name: "Nouvel Utilisateur",
        role: "Utilisateur",
        email: email
    };

    console.log(`Nouvel utilisateur enregistré: ${email} (identifiant: ${newIdentifiant})`);
    res.status(201).json({ success: true, message: 'Compte créé avec succès !' });
});
// ------------------------------------

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
    console.log('ATTENTION : Ce serveur est un exemple non sécurisé à des fins de démonstration.');
});
