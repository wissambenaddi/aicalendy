/**
 * Fichier : js/modules/auth.js
 * Description : Gère la logique côté client pour les formulaires
 * de connexion et d'inscription, y compris l'appel à l'API backend.
 */

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    // --- Logique pour le formulaire de connexion ---
    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => { // Ajout de 'async' pour utiliser 'await'
            event.preventDefault(); // Empêche l'envoi standard du formulaire

            const email = loginForm.email.value;
            const password = loginForm.password.value;
            const submitButton = loginForm.querySelector('button[type="submit"]');
            const originalButtonText = submitButton.textContent; // Sauvegarde texte initial

            // Désactiver le bouton et afficher un indicateur de chargement (optionnel)
            submitButton.disabled = true;
            submitButton.textContent = 'Connexion...'; // Ou utiliser un spinner

            console.log('Tentative de connexion avec:', { email, password });

            try {
                // --- Appel à l'API Backend ---
                const response = await fetch('/api/login', { // URL de l'API backend
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email, password }) // Envoi des données en JSON
                });

                const data = await response.json(); // Attend la réponse JSON du serveur

                if (response.ok && data.success) { // Vérifie si la requête HTTP est OK et si le backend renvoie success: true
                    console.log('Connexion réussie:', data);
                    // --- Redirection vers le tableau de bord ---
                    window.location.href = 'dashboard_user.html';
                    // Optionnel: stocker le token reçu (data.token) dans localStorage/sessionStorage
                    // localStorage.setItem('authToken', data.token);
                } else {
                    // Afficher l'erreur renvoyée par le backend
                    console.error('Erreur de connexion:', data.message);
                    alert(`Erreur de connexion: ${data.message || 'Identifiants incorrects'}`); // Utiliser une meilleure UI qu'une alerte
                }

            } catch (error) {
                // Gérer les erreurs réseau ou autres erreurs inattendues
                console.error('Erreur lors de la tentative de connexion:', error);
                alert('Une erreur réseau est survenue. Veuillez réessayer.'); // Utiliser une meilleure UI
            } finally {
                 // Réactiver le bouton et restaurer le texte dans tous les cas
                 submitButton.disabled = false;
                 submitButton.textContent = originalButtonText;
            }
            // --- Fin de l'appel API ---
        });
    }

    // --- Logique pour le formulaire d'inscription ---
    if (registerForm) {
        registerForm.addEventListener('submit', async (event) => { // Ajout de 'async'
            event.preventDefault();

            const email = registerForm.email.value;
            const password = registerForm.password.value;
            const confirmPassword = registerForm['confirm-password'].value;
            const termsAccepted = registerForm.terms.checked;
            const submitButton = registerForm.querySelector('button[type="submit"]');
            const originalButtonText = submitButton.textContent;

            console.log('Tentative d\'inscription avec:', { email, password: '***', confirmPassword: '***', termsAccepted }); // Ne pas logger les mots de passe

            // --- Validation Côté Client ---
            if (password !== confirmPassword) {
                alert('Les mots de passe ne correspondent pas.'); // Remplacer alert
                return;
            }
            if (!termsAccepted) {
                 alert('Vous devez accepter les conditions d\'utilisation.'); // Remplacer alert
                 return;
            }
            // Ajouter d'autres validations si nécessaire (longueur mdp, format email...)
            // --- Fin Validation ---

             // Désactiver bouton / Afficher chargement
             submitButton.disabled = true;
             submitButton.textContent = 'Création...';

            try {
                 // --- Appel à l'API Backend pour l'inscription ---
                 const response = await fetch('/api/register', { // URL de l'API backend pour l'inscription
                     method: 'POST',
                     headers: { 'Content-Type': 'application/json' },
                     body: JSON.stringify({ email, password }) // N'envoyer que le nécessaire
                 });

                 const data = await response.json();

                 if (response.ok && data.success) {
                     console.log('Inscription réussie:', data);
                     alert('Compte créé avec succès ! Vous pouvez maintenant vous connecter.'); // Remplacer alert
                     // Rediriger vers la page de connexion
                     window.location.href = 'connexion_account.html';
                 } else {
                     console.error('Erreur d\'inscription:', data.message);
                     alert(`Erreur d'inscription: ${data.message || 'Impossible de créer le compte'}`); // Remplacer alert
                 }

            } catch (error) {
                 console.error('Erreur lors de la tentative d\'inscription:', error);
                 alert('Une erreur réseau est survenue lors de l\'inscription.'); // Remplacer alert
            } finally {
                 // Réactiver le bouton / Restaurer texte
                 submitButton.disabled = false;
                 submitButton.textContent = originalButtonText;
            }
             // --- Fin Appel API ---
        });
    }

}); // Fin de DOMContentLoaded
