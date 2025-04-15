/**
 * Fichier : js/modules/auth.js
 * Description : Gère la logique côté client pour l'authentification,
 * y compris l'indicateur de force de mot de passe.
 */

// Importer l'objet translations depuis translator.js
// Assurez-vous que le chemin './translator.js' est correct par rapport à auth.js
import { translations } from './translator.js';
// L'import de setLanguage n'est plus nécessaire ici pour l'indicateur de force

// --- Fonctions pour l'indicateur de force ---

/**
 * Vérifie la force d'un mot de passe.
 * @param {string} password - Le mot de passe à vérifier.
 * @returns {number} Niveau de force (0: vide, 1: faible, 2: moyen, 3: fort)
 */
function checkPasswordStrength(password) {
    if (!password) return 0; // Vide

    const hasLetters = /[a-zA-Z]/.test(password);
    const hasNumbers = /[0-9]/.test(password);
    // Optionnel: ajouter d'autres critères (longueur, majuscules, symboles)
    // const hasUpper = /[A-Z]/.test(password);
    // const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    // Logique de score simple : lettres ET chiffres requis pour Moyen/Fort
    if (hasLetters && hasNumbers) {
        // Fort si 8+ caractères, sinon Moyen
        return password.length >= 8 ? 3 : 2;
    } else if (hasLetters || hasNumbers) {
        // Faible si seulement lettres OU seulement chiffres
        return 1;
    } else {
        // Faible aussi si ne contient ni lettre ni chiffre (ex: que des symboles)
        return 1;
    }
}

/**
 * Met à jour l'affichage de l'indicateur de force (barre et texte).
 * @param {string} indicatorId - ID de l'élément conteneur de l'indicateur HTML.
 * @param {number} strengthLevel - Niveau de force retourné par checkPasswordStrength (0-3).
 */
function updateStrengthIndicator(indicatorId, strengthLevel) {
    const indicatorElement = document.getElementById(indicatorId);
    if (!indicatorElement) return; // Quitter si l'élément n'est pas trouvé

    const barElement = indicatorElement.querySelector('.strength-bar');
    const textElement = indicatorElement.querySelector('.strength-text');

    // Vérifier si les sous-éléments sont présents
    if (!barElement || !textElement) {
        console.error(`Éléments manquants dans l'indicateur de force : ${indicatorId}`);
        return;
    }

    // Clés de traduction et classes CSS correspondantes
    const strengthKeys = { 1: 'password_strength_weak', 2: 'password_strength_medium', 3: 'password_strength_strong' };
    const strengthClasses = { 1: 'weak', 2: 'medium', 3: 'strong' };

    // Réinitialiser les classes et le texte
    barElement.classList.remove('weak', 'medium', 'strong');
    textElement.classList.remove('weak', 'medium', 'strong');
    textElement.textContent = '';
    textElement.removeAttribute('data-translate-key'); // Au cas où il était défini avant
    indicatorElement.style.display = 'none'; // Cacher par défaut

    // Si le niveau est supérieur à 0
    if (strengthLevel > 0) {
        const levelKey = strengthKeys[strengthLevel]; // Clé de traduction (ex: 'password_strength_weak')
        const levelClass = strengthClasses[strengthLevel]; // Classe CSS (ex: 'weak')
        const currentLang = document.documentElement.lang || 'fr'; // Langue actuelle

        // Appliquer la classe CSS à la barre et au texte pour la couleur/largeur
        barElement.classList.add(levelClass);
        textElement.classList.add(levelClass);

        // Utiliser l'objet translations importé pour définir le texte
        const translatedText = translations[currentLang]?.[levelKey];
        if (translatedText) {
            textElement.textContent = translatedText; // Appliquer le texte traduit
        } else {
            // Fallback si la traduction n'est pas trouvée
            textElement.textContent = levelClass.charAt(0).toUpperCase() + levelClass.slice(1); // Affiche Weak, Medium, Strong
            console.warn(`Traduction non trouvée pour la clé ${levelKey} dans la langue ${currentLang}`);
        }

        indicatorElement.style.display = 'block'; // Rendre l'indicateur visible
    }
}
// --- Fin Fonctions Indicateur ---


document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirm-password');

    // Ajout des écouteurs pour l'indicateur de force (uniquement si on est sur la page d'inscription)
    if (registerForm) {
        if (passwordInput) {
            passwordInput.addEventListener('input', () => {
                updateStrengthIndicator('password-strength-indicator', checkPasswordStrength(passwordInput.value));
            });
        }
        if (confirmPasswordInput) {
            confirmPasswordInput.addEventListener('input', () => {
                updateStrengthIndicator('confirm-password-strength-indicator', checkPasswordStrength(confirmPasswordInput.value));
                // Optionnel : Vérifier la correspondance des mots de passe en temps réel ici
            });
        }
    }


    // --- Logique pour le formulaire de connexion ---
    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
             event.preventDefault();
             const loginIdentifier = loginForm.loginIdentifier.value;
             const password = loginForm.password.value;
             const submitButton = loginForm.querySelector('button[type="submit"]');
             const originalButtonTextKey = "login_button";
             const currentLang = document.documentElement.lang || 'fr';
             const originalButtonText = translations[currentLang]?.[originalButtonTextKey] || "Se connecter"; // Texte par défaut
             submitButton.disabled = true;
             submitButton.textContent = 'Connexion...'; // À traduire idéalement
             console.log('Tentative de connexion avec:', { loginIdentifier, password: '***' });
             try {
                 const response = await fetch('/api/login', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ loginIdentifier, password }) });
                 const data = await response.json();
                 if (response.ok && data.success) {
                     console.log('Connexion réussie:', data); window.location.href = 'dashboard_user.html';
                 } else {
                     console.error('Erreur de connexion:', data.message); alert(`Erreur de connexion: ${data.message || 'Identifiant/Email ou mot de passe incorrect.'}`);
                 }
             } catch (error) {
                 console.error('Erreur lors de la tentative de connexion (réseau ou autre):', error); alert('Une erreur réseau est survenue. Veuillez réessayer.');
             } finally {
                  submitButton.disabled = false;
                  submitButton.textContent = originalButtonText; // Restaurer texte
             }
        });
    }

    // --- Logique pour le formulaire d'inscription ---
    if (registerForm) {
        registerForm.addEventListener('submit', async (event) => {
             event.preventDefault();
             const firstName = registerForm.firstName.value;
             const lastName = registerForm.lastName.value;
             const email = registerForm.email.value;
             const password = registerForm.password.value;
             const confirmPassword = registerForm['confirm-password'].value;
             const termsAccepted = registerForm.terms.checked;
             const submitButton = registerForm.querySelector('button[type="submit"]');
             const originalButtonTextKey = "create_account_button";
             const currentLang = document.documentElement.lang || 'fr';
             const originalButtonText = translations[currentLang]?.[originalButtonTextKey] || "Créer mon compte"; // Texte par défaut

             console.log('Tentative d\'inscription avec:', { firstName, lastName, email, password: '***', confirmPassword: '***', termsAccepted });

             // Validations Côté Client
             if (!firstName || !lastName) { alert('Veuillez renseigner votre nom et prénom.'); return; }
             if (password !== confirmPassword) { alert('Les mots de passe ne correspondent pas.'); return; }
             if (!termsAccepted) { alert('Vous devez accepter les conditions d\'utilisation.'); return; }
             const strength = checkPasswordStrength(password);
             if (strength < 2) { alert('Le mot de passe est trop faible. Il doit contenir des lettres et des chiffres.'); return; }

              submitButton.disabled = true;
              submitButton.textContent = 'Création...'; // À traduire

             try {
                  // Appel API Register avec toutes les infos
                  const response = await fetch('/api/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ firstName, lastName, email, password }) });
                  const data = await response.json();
                  if (response.ok && data.success) {
                      console.log('Inscription réussie:', data);
                      alert('Compte créé ! Veuillez consulter vos emails pour activer votre compte.');
                      window.location.href = 'connexion_account.html';
                  } else {
                      console.error('Erreur d\'inscription:', data.message); alert(`Erreur d'inscription: ${data.message || 'Impossible de créer le compte'}`);
                  }
             } catch (error) {
                  console.error('Erreur lors de la tentative d\'inscription (réseau ou autre):', error); alert('Une erreur réseau est survenue lors de l\'inscription.');
             } finally {
                  submitButton.disabled = false;
                  submitButton.textContent = originalButtonText; // Restaurer texte
             }
        });
    }

}); // Fin de l'écouteur DOMContentLoaded
