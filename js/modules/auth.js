/**
 * Fichier : js/modules/auth.js
 * Description : Gère la logique côté client pour les formulaires
 * de connexion et d'inscription, y compris l'appel à l'API backend.
 * Utilise maintenant 'loginIdentifier' (identifiant ou email) pour la connexion.
 */

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    // --- Logique pour le formulaire de connexion ---
    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => { // Utilisation de async pour await
            event.preventDefault(); // Empêche l'envoi standard du formulaire

            // Lire la valeur du champ 'Identifiant ou Email'
            const loginIdentifier = loginForm.loginIdentifier.value; // Utilise le nouvel ID/nom
            const password = loginForm.password.value;
            const submitButton = loginForm.querySelector('button[type="submit"]');
            // Sauvegarde du texte original du bouton pour le restaurer après la requête
            const originalButtonText = submitButton.textContent;

            // Désactiver le bouton et afficher un état de chargement
            submitButton.disabled = true;
            submitButton.textContent = 'Connexion...'; // Texte temporaire pendant le chargement

            console.log('Tentative de connexion avec:', { loginIdentifier, password: '***' }); // Ne pas afficher le mot de passe dans les logs

            try {
                // Appel à l'API Backend pour la connexion
                const response = await fetch('/api/login', { // URL de l'API backend
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json', // Indique qu'on envoie du JSON
                    },
                    // Envoyer l'identifiant (ou email) et le mot de passe
                    body: JSON.stringify({ loginIdentifier, password })
                });

                // Attendre et parser la réponse JSON du serveur
                const data = await response.json();

                // Vérifier si la requête HTTP a réussi (status 2xx) ET si le backend confirme le succès
                if (response.ok && data.success) {
                    console.log('Connexion réussie:', data);
                    // --- Redirection vers le tableau de bord ---
                    window.location.href = 'dashboard_user.html';
                    // Optionnel: stocker le token reçu pour les futures requêtes authentifiées
                    // if(data.token) {
                    //     localStorage.setItem('authToken', data.token);
                    // }
                } else {
                    // Afficher le message d'erreur renvoyé par le backend ou un message générique
                    console.error('Erreur de connexion:', data.message);
                    alert(`Erreur de connexion: ${data.message || 'Identifiant/Email ou mot de passe incorrect.'}`); // Remplacer alert par une meilleure UI
                }

            } catch (error) {
                // Gérer les erreurs réseau (serveur inaccessible, pas de connexion internet, etc.)
                console.error('Erreur lors de la tentative de connexion (réseau ou autre):', error);
                alert('Une erreur réseau est survenue. Veuillez réessayer.'); // Remplacer alert
            } finally {
                 // Dans tous les cas (succès ou échec), réactiver le bouton et restaurer son texte
                 submitButton.disabled = false;
                 submitButton.textContent = originalButtonText;
            }
        });
    }

    // --- Logique pour le formulaire d'inscription ---
    // Cette partie utilise toujours l'email pour l'inscription pour l'instant
    if (registerForm) {
        registerForm.addEventListener('submit', async (event) => { // Utilisation de async
            event.preventDefault();

            const email = registerForm.email.value;
            const password = registerForm.password.value;
            const confirmPassword = registerForm['confirm-password'].value;
            const termsAccepted = registerForm.terms.checked;
            const submitButton = registerForm.querySelector('button[type="submit"]');
            const originalButtonText = submitButton.textContent;

            console.log('Tentative d\'inscription avec:', { email, password: '***', confirmPassword: '***', termsAccepted });

            // Validations côté client basiques
            if (password !== confirmPassword) {
                alert('Les mots de passe ne correspondent pas.'); // Remplacer alert
                return; // Arrêter si invalide
            }
            if (!termsAccepted) {
                 alert('Vous devez accepter les conditions d\'utilisation.'); // Remplacer alert
                 return; // Arrêter si invalide
            }
            // Ajouter d'autres validations ici si nécessaire (ex: format email, force mdp)

             // Désactiver bouton / Afficher chargement
             submitButton.disabled = true;
             submitButton.textContent = 'Création...';

            try {
                 // Appel à l'API Backend pour l'inscription
                 const response = await fetch('/api/register', { // URL différente pour l'inscription
                     method: 'POST',
                     headers: { 'Content-Type': 'application/json' },
                     // Envoyer email et mot de passe (le backend gère le reste)
                     body: JSON.stringify({ email, password })
                 });

                 const data = await response.json();

                 if (response.ok && data.success) {
                     console.log('Inscription réussie:', data);
                     alert('Compte créé avec succès ! Vous pouvez maintenant vous connecter.'); // Remplacer alert
                     // Rediriger vers la page de connexion après inscription réussie
                     window.location.href = 'connexion_account.html';
                 } else {
                     // Afficher l'erreur du backend (ex: email déjà pris)
                     console.error('Erreur d\'inscription:', data.message);
                     alert(`Erreur d'inscription: ${data.message || 'Impossible de créer le compte'}`); // Remplacer alert
                 }

            } catch (error) {
                 // Gérer les erreurs réseau
                 console.error('Erreur lors de la tentative d\'inscription (réseau ou autre):', error);
                 alert('Une erreur réseau est survenue lors de l\'inscription.'); // Remplacer alert
            } finally {
                 // Réactiver le bouton / Restaurer texte
                 submitButton.disabled = false;
                 submitButton.textContent = originalButtonText;
            }
        });
    }

}); // Fin de l'écouteur DOMContentLoaded
