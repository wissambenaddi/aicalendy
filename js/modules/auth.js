/**
 * Fichier : js/modules/auth.js
 * Description : Gère la logique côté client pour l'authentification.
 * Stocke les informations utilisateur dans localStorage après connexion réussie.
 */

import { translations } from './translator.js';
// import { setLanguage } from './translator.js'; // Import si nécessaire ailleurs

// --- Fonctions Indicateur de Force (inchangées) ---
function checkPasswordStrength(password) { /* ... code inchangé ... */
    if (!password) return 0; const hasLetters = /[a-zA-Z]/.test(password); const hasNumbers = /[0-9]/.test(password);
    if (hasLetters && hasNumbers) { return password.length >= 8 ? 3 : 2; } else if (hasLetters || hasNumbers) { return 1; } else { return 1; }
}
function updateStrengthIndicator(indicatorId, strengthLevel) { /* ... code inchangé ... */
    const indicatorElement = document.getElementById(indicatorId); if (!indicatorElement) return;
    const barElement = indicatorElement.querySelector('.strength-bar'); const textElement = indicatorElement.querySelector('.strength-text');
    if (!barElement || !textElement) { console.error(`Missing elements: ${indicatorId}`); return; }
    const strengthKeys = { 1: 'password_strength_weak', 2: 'password_strength_medium', 3: 'password_strength_strong' };
    const strengthClasses = { 1: 'weak', 2: 'medium', 3: 'strong' };
    barElement.classList.remove('weak', 'medium', 'strong'); textElement.classList.remove('weak', 'medium', 'strong');
    textElement.textContent = ''; indicatorElement.style.display = 'none';
    if (strengthLevel > 0) {
        const levelKey = strengthKeys[strengthLevel]; const levelClass = strengthClasses[strengthLevel];
        const currentLang = document.documentElement.lang || 'fr';
        barElement.classList.add(levelClass); textElement.classList.add(levelClass);
        const translatedText = translations[currentLang]?.[levelKey];
        if (translatedText) { textElement.textContent = translatedText; }
        else { textElement.textContent = levelClass.charAt(0).toUpperCase() + levelClass.slice(1); console.warn(`Translation not found for key ${levelKey} in lang ${currentLang}`); }
        indicatorElement.style.display = 'block';
    }
}
// --- Fin Fonctions Indicateur ---

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirm-password');

    // Listeners indicateur force (si page inscription)
    if (registerForm) { /* ... listeners inchangés ... */
        if (passwordInput) { passwordInput.addEventListener('input', () => { updateStrengthIndicator('password-strength-indicator', checkPasswordStrength(passwordInput.value)); }); }
        if (confirmPasswordInput) { confirmPasswordInput.addEventListener('input', () => { updateStrengthIndicator('confirm-password-strength-indicator', checkPasswordStrength(confirmPasswordInput.value)); }); }
    }

    // --- Logique Connexion ---
    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
             event.preventDefault();
             const loginIdentifier = loginForm.loginIdentifier.value;
             const password = loginForm.password.value;
             const submitButton = loginForm.querySelector('button[type="submit"]');
             const originalButtonTextKey = "login_button";
             const currentLang = document.documentElement.lang || 'fr';
             const originalButtonText = translations[currentLang]?.[originalButtonTextKey] || "Se connecter";
             submitButton.disabled = true;
             submitButton.textContent = 'Connexion...';
             console.log('Tentative de connexion avec:', { loginIdentifier, password: '***' });
             try {
                 const response = await fetch('/api/login', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ loginIdentifier, password }) });
                 const data = await response.json();
                 if (response.ok && data.success && data.user) { // Vérifier aussi la présence de data.user
                     console.log('Connexion réussie:', data);

                     // === AJOUT : Stocker les infos utilisateur dans localStorage ===
                     try {
                         localStorage.setItem('loggedInUser', JSON.stringify(data.user));
                         console.log('User info stored in localStorage');
                     } catch (storageError) {
                         console.error('Failed to store user info in localStorage:', storageError);
                         // Gérer l'erreur si localStorage n'est pas dispo ou plein
                     }
                     // ==============================================================

                     window.location.href = 'dashboard_user.html'; // Redirection
                 } else {
                     console.error('Erreur de connexion:', data.message); alert(`Erreur de connexion: ${data.message || 'Identifiant/Email ou mot de passe incorrect.'}`);
                 }
             } catch (error) {
                 console.error('Erreur lors de la tentative de connexion (réseau ou autre):', error); alert('Une erreur réseau est survenue. Veuillez réessayer.');
             } finally {
                  submitButton.disabled = false;
                  submitButton.textContent = originalButtonText;
             }
        });
    }

    // --- Logique Inscription ---
    if (registerForm) {
        registerForm.addEventListener('submit', async (event) => {
             // ... (code d'inscription inchangé) ...
             event.preventDefault();
             const firstName = registerForm.firstName.value; const lastName = registerForm.lastName.value;
             const email = registerForm.email.value; const password = registerForm.password.value;
             const confirmPassword = registerForm['confirm-password'].value; const termsAccepted = registerForm.terms.checked;
             const submitButton = registerForm.querySelector('button[type="submit"]');
             const originalButtonTextKey = "create_account_button"; const currentLang = document.documentElement.lang || 'fr';
             const originalButtonText = translations[currentLang]?.[originalButtonTextKey] || "Créer mon compte";
             console.log('Tentative d\'inscription avec:', { firstName, lastName, email, password: '***', confirmPassword: '***', termsAccepted });
             if (!firstName || !lastName) { alert('Veuillez renseigner votre nom et prénom.'); return; }
             if (password !== confirmPassword) { alert('Les mots de passe ne correspondent pas.'); return; }
             if (!termsAccepted) { alert('Vous devez accepter les conditions d\'utilisation.'); return; }
             const strength = checkPasswordStrength(password); if (strength < 2) { alert('Le mot de passe est trop faible. Il doit contenir des lettres et des chiffres.'); return; }
              submitButton.disabled = true; submitButton.textContent = 'Création...';
             try {
                  const response = await fetch('/api/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ firstName, lastName, email, password }) });
                  const data = await response.json();
                  if (response.ok && data.success) {
                      console.log('Inscription réussie:', data); alert('Compte créé ! Veuillez consulter vos emails pour activer votre compte.'); window.location.href = 'connexion_account.html';
                  } else { console.error('Erreur d\'inscription:', data.message); alert(`Erreur d'inscription: ${data.message || 'Impossible de créer le compte'}`); }
             } catch (error) { console.error('Erreur lors de la tentative d\'inscription (réseau ou autre):', error); alert('Une erreur réseau est survenue lors de l\'inscription.');
             } finally { submitButton.disabled = false; submitButton.textContent = originalButtonText; }
        });
    }

}); // Fin de DOMContentLoaded
