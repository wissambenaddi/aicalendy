/**
 * Fichier : js/modules/auth.js
 * Description : Gère la logique côté client pour l'authentification (connexion, inscription),
 *              le toggle de mot de passe et l'indicateur de force.
 */

import { translations } from './translator.js';

// --- Fonctions Indicateur Force MDP ---
/**
 * Évalue la force d'un mot de passe.
 * @param {string} password
 * @returns {'weak'|'medium'|'strong'}
 */
function checkPasswordStrength(password) {
  let score = 0;
  if (!password || password.length < 6) return 'weak';
  if (password.length >= 8) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (score < 3) return 'weak';
  if (score < 5) return 'medium';
  return 'strong';
}

/**
 * Met à jour l'indicateur visuel de force du mot de passe.
 * @param {HTMLElement} container
 * @param {'weak'|'medium'|'strong'} level
 */
function updateStrengthIndicator(container, level) {
  const bar = container.querySelector('.strength-bar');
  const text = container.querySelector('.strength-text');
  const lang = document.documentElement.lang || 'fr';
  if (!bar || !text) return;

  container.style.display = 'block';
  bar.className = `strength-bar ${level}`;
  text.className = `strength-text ${level}`;

  let key = 'password_strength_' + level;
  text.textContent = translations[lang]?.[key] || level;
}
// --- Fin Indicateur ---

// --- Toggle mot de passe (HTML utilise data-target) ---
document.addEventListener('DOMContentLoaded', () => {
  // SSO buttons (facultatif)
  const googleBtn = document.querySelector('.sso-button.google');
  const outlookBtn = document.querySelector('.sso-button.outlook');
  if (googleBtn) googleBtn.addEventListener('click', () => window.location.href = '/auth/google');
  if (outlookBtn) outlookBtn.addEventListener('click', () => window.location.href = '/auth/outlook');

  // Indicateur de force lors de la saisie du mdp
  const pwdInput = document.getElementById('password');
  const strengthCont = document.getElementById('password-strength-indicator');
  if (pwdInput && strengthCont) {
    pwdInput.addEventListener('input', e => {
      const val = e.target.value;
      if (val) {
        const lvl = checkPasswordStrength(val);
        updateStrengthIndicator(strengthCont, lvl);
      } else {
        strengthCont.style.display = 'none';
      }
    });
  }

  // Toggle show/hide password
  document.querySelectorAll('.toggle-password').forEach(btn => {
    const targetId = btn.getAttribute('data-target');
    const input = document.getElementById(targetId);
    if (!input) return;
    btn.addEventListener('click', () => {
      const isPwd = input.type === 'password';
      input.type = isPwd ? 'text' : 'password';
      btn.classList.toggle('is-visible');
      btn.setAttribute('aria-label', isPwd ? 'Masquer le mot de passe' : 'Afficher le mot de passe');
    });
  });

  // Formulaire connexion
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async e => {
      e.preventDefault();
      const btn = loginForm.querySelector('button[type=submit]');
      const orig = btn.textContent;
      btn.disabled = true;
      btn.textContent = 'Connexion...';
      try {
        const data = Object.fromEntries(new FormData(loginForm).entries());
        const res = await fetch('/api/login', {
          method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(data)
        });
        const json = await res.json();
        if (res.ok && json.success && json.user) {
          localStorage.setItem('loggedInUser', JSON.stringify(json.user));
          window.location.href = 'dashboard_user.html';
        } else {
          alert(`Erreur de connexion: ${json.message||'Identifiant ou mot de passe incorrect.'}`);
          btn.disabled = false;
          btn.textContent = orig;
        }
      } catch (err) {
        alert('Erreur réseau lors de la connexion.');
        btn.disabled = false;
        btn.textContent = orig;
      }
    });
  }

  // Formulaire inscription
  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', async e => {
      e.preventDefault();
      const btn = registerForm.querySelector('button[type=submit]');
      const orig = btn.textContent;
      const pwd = document.getElementById('password').value;
      const confirm = document.getElementById('confirm-password').value;
      if (pwd !== confirm) return alert('Les mots de passe ne correspondent pas.');
      if (!document.getElementById('terms')?.checked) return alert('Veuillez accepter les conditions.');
      btn.disabled = true;
      btn.textContent = 'Création...';
      try {
        const form = new FormData(registerForm);
        const payload = {
          firstName: form.get('firstName'),
          lastName: form.get('lastName'),
          email: form.get('email'),
          password: form.get('password')
        };
        const res = await fetch('/api/register', {
          method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)
        });
        const json = await res.json();
        if (res.ok && json.success) {
          alert(json.message||'Compte créé !');
          window.location.href = 'connexion_account.html';
        } else {
          alert(`Erreur d'inscription: ${json.message||'Une erreur est survenue.'}`);
          btn.disabled = false;
          btn.textContent = orig;
        }
      } catch {
        alert('Erreur réseau lors de l\'inscription.');
        btn.disabled = false;
        btn.textContent = orig;
      }
    });
  }

  // Message d'activation sur connexion
  if (window.location.pathname.includes('connexion_account.html')) {
    const params = new URLSearchParams(window.location.search);
    if (params.get('activated') === 'true') {
      alert('Votre compte a été activé avec succès !');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }
});
