/**
 * Fichier : js/modules/auth.js
 * Description : Gère la logique côté client pour les formulaires
 * de connexion et d'inscription.
 */

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    // --- Logique pour le formulaire de connexion ---
    if (loginForm) {
        loginForm.addEventListener('submit', (event) => {
            event.preventDefault(); // Empêche l'envoi standard du formulaire

            const email = loginForm.email.value;
            const password = loginForm.password.value;

            console.log('Tentative de connexion avec:', { email, password });

            // --- À FAIRE ---
            // 1. Ajouter la validation des champs (format email, mot de passe non vide)
            // 2. Envoyer les données au backend (par exemple via l'API Fetch)
            //    fetch('/api/login', {
            //        method: 'POST',
            //        headers: { 'Content-Type': 'application/json' },
            //        body: JSON.stringify({ email, password })
            //    })
            //    .then(response => response.json())
            //    .then(data => {
            //        if (data.success) {
            //            // Rediriger vers le tableau de bord ou autre page
            //            window.location.href = '/dashboard_user.html';
            //        } else {
            //            // Afficher un message d'erreur
            //            console.error('Erreur de connexion:', data.message);
            //            alert(`Erreur de connexion: ${data.message}`); // Remplacer alert par une meilleure UI
            //        }
            //    })
            //    .catch(error => {
            //        console.error('Erreur réseau ou serveur:', error);
            //        alert('Une erreur est survenue.'); // Remplacer alert
            //    });
            // --- Fin du À FAIRE ---

            // Message temporaire pour le développement
            alert('Logique de connexion à implémenter (voir console).');
        });
    }

    // --- Logique pour le formulaire d'inscription ---
    if (registerForm) {
        registerForm.addEventListener('submit', (event) => {
            event.preventDefault(); // Empêche l'envoi standard du formulaire

            const email = registerForm.email.value;
            const password = registerForm.password.value;
            const confirmPassword = registerForm['confirm-password'].value;
            const termsAccepted = registerForm.terms.checked;

            console.log('Tentative d\'inscription avec:', { email, password, confirmPassword, termsAccepted });

            // --- À FAIRE ---
            // 1. Ajouter la validation des champs :
            //    - Format email valide
            //    - Mot de passe non vide et respectant des critères (longueur, etc.)
            //    - Mot de passe et confirmation identiques
            //    - Conditions acceptées
            if (password !== confirmPassword) {
                alert('Les mots de passe ne correspondent pas.'); // Remplacer alert
                return; // Arrêter le processus
            }
            if (!termsAccepted) {
                 alert('Vous devez accepter les conditions d\'utilisation.'); // Remplacer alert
                 return; // Arrêter le processus
            }
            // 2. Envoyer les données au backend (via Fetch API)
            //    fetch('/api/register', { /* ... */ })
            //    .then(response => response.json())
            //    .then(data => {
            //        if (data.success) {
            //            // Rediriger vers la page de connexion ou le tableau de bord
            //             window.location.href = '/connexion_account.html'; // ou dashboard
            //        } else {
            //            // Afficher un message d'erreur (ex: email déjà utilisé)
            //            console.error('Erreur d\'inscription:', data.message);
            //            alert(`Erreur d'inscription: ${data.message}`); // Remplacer alert
            //        }
            //    })
            //    .catch(error => { /* ... gestion erreur réseau ... */ });
            // --- Fin du À FAIRE ---

             // Message temporaire pour le développement
             alert('Logique d\'inscription à implémenter (voir console).');
        });
    }

    // --- Autre logique JS pour l'authentification si nécessaire ---
    // Par exemple, gestion du bouton "Mot de passe oublié ?"

}); // Fin de DOMContentLoaded

// Note: Si vous voulez utiliser les traductions de translator.js ici,
// il faudrait importer les fonctions nécessaires :
// import { setLanguage, initLanguageSwitcher } from './translator.js';
// et ajouter les attributs data-translate-key aux éléments HTML correspondants.
