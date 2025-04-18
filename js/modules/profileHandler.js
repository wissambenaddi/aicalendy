/**
 * Fichier : js/modules/profileHandler.js
 * Description : Gère la logique spécifique à la section "Mon Profil".
 */

import { translations, setLanguage } from './translator.js'; // OK
import * as api from './core/api.js'; // <<< Chemin CORRIGÉ vers core/
import * as utils from './core/utils.js'; // <<< Chemin CORRIGÉ vers core/

// --- Références aux éléments DOM spécifiques au profil ---
const displayNameElement = document.getElementById('profile-display-name');
const displayEmailElement = document.getElementById('profile-display-email');
const displayRoleElement = document.getElementById('profile-display-role');
const displayPhoneElement = document.getElementById('profile-display-phone');
const displayAddressElement = document.getElementById('profile-display-address');
const displayDobElement = document.getElementById('profile-display-dob');
const displayTimezoneElement = document.getElementById('profile-display-timezone');
const displayAvailabilityElement = document.getElementById('profile-display-availability');
const displayTeamElement = document.getElementById('profile-display-team');
const displaySpecialtyElement = document.getElementById('profile-display-specialty');
const statsCatCountElement = document.getElementById('profile-stats-cat-count');
const statsApptCountElement = document.getElementById('profile-stats-appt-count');
const statsAttendanceElement = document.getElementById('profile-stats-attendance');
const securityLastLoginElement = document.getElementById('profile-security-last-login');
const securityLastIpElement = document.getElementById('profile-security-last-ip');
const securityLastBrowserElement = document.getElementById('profile-security-last-browser');
const securityAuthMethodElement = document.getElementById('profile-security-auth-method');
const prefsThemeElement = document.getElementById('profile-prefs-theme');
const prefsLanguageElement = document.getElementById('profile-prefs-language');
const prefsDefaultPageElement = document.getElementById('profile-prefs-default-page');
const prefsSignatureElement = document.getElementById('profile-prefs-signature');

// Références au formulaire de mise à jour
const profileUpdateForm = document.getElementById('profile-update-form');
const formFirstNameInput = document.getElementById('profile-firstName');
const formLastNameInput = document.getElementById('profile-lastName');
const formEmailInput = document.getElementById('profile-email');
const formPhoneInput = document.getElementById('profile-phone'); // <<< Nouveau
const formAddressInput = document.getElementById('profile-address'); // <<< Nouveau
const formBirthdateInput = document.getElementById('profile-birthdate'); // <<< Nouveau
const formTimezoneInput = document.getElementById('profile-timezone'); // <<< Nouveau
const formTeamInput = document.getElementById('profile-team'); // <<< Nouveau
const formSpecialtyInput = document.getElementById('profile-specialty'); // <<< Nouveau
const messageElement = document.getElementById('profile-update-message');


// --- Chargement et Affichage des Données ---

/** Charge les données du profil et pré-remplit le formulaire */
export async function loadProfileData() {
    if (messageElement) messageElement.textContent = ''; // Clear previous messages
    const loadingText = 'Chargement...'; const placeholderText = "Non défini";

    // Initialiser l'affichage avec des placeholders
    if (displayNameElement) displayNameElement.textContent = loadingText;
    if (displayEmailElement) displayEmailElement.textContent = loadingText;
    if (displayRoleElement) displayRoleElement.textContent = loadingText;
    if (displayPhoneElement) displayPhoneElement.textContent = placeholderText;
    if (displayAddressElement) displayAddressElement.textContent = placeholderText;
    if (displayDobElement) displayDobElement.textContent = placeholderText;
    if (displayTimezoneElement) displayTimezoneElement.textContent = placeholderText;
    if (displayAvailabilityElement) displayAvailabilityElement.textContent = placeholderText;
    if (displayTeamElement) displayTeamElement.textContent = placeholderText;
    if (displaySpecialtyElement) displaySpecialtyElement.textContent = placeholderText;
    if (statsCatCountElement) statsCatCountElement.textContent = '-';
    if (statsApptCountElement) statsApptCountElement.textContent = '-';
    if (statsAttendanceElement) statsAttendanceElement.textContent = '-';
    if (securityLastLoginElement) securityLastLoginElement.textContent = '-';
    if (securityLastIpElement) securityLastIpElement.textContent = '-';
    if (securityLastBrowserElement) securityLastBrowserElement.textContent = '-';
    if (securityAuthMethodElement) securityAuthMethodElement.textContent = '-';
    if (prefsThemeElement) prefsThemeElement.textContent = '-';
    if (prefsLanguageElement) prefsLanguageElement.textContent = '-';
    if (prefsDefaultPageElement) prefsDefaultPageElement.textContent = '-';
    if (prefsSignatureElement) prefsSignatureElement.textContent = '-';
    // Initialiser le formulaire
    if (formFirstNameInput) formFirstNameInput.value = '';
    if (formLastNameInput) formLastNameInput.value = '';
    if (formEmailInput) formEmailInput.value = '';
    if (formPhoneInput) formPhoneInput.value = ''; // <<< Nouveau
    if (formAddressInput) formAddressInput.value = ''; // <<< Nouveau
    if (formBirthdateInput) formBirthdateInput.value = ''; // <<< Nouveau
    if (formTimezoneInput) formTimezoneInput.value = ''; // <<< Nouveau
    if (formTeamInput) formTeamInput.value = ''; // <<< Nouveau
    if (formSpecialtyInput) formSpecialtyInput.value = ''; // <<< Nouveau


    try {
        const profile = await api.fetchProfile(); // Utilise api.js
        console.log("Profil chargé:", profile); const currentLang = document.documentElement.lang || 'fr';

        // --- Afficher les informations ---
        if (displayNameElement) displayNameElement.textContent = `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || placeholderText;
        if (displayEmailElement) displayEmailElement.textContent = profile.email || placeholderText;
        if (displayRoleElement) displayRoleElement.textContent = profile.role || placeholderText;
        if (displayPhoneElement) displayPhoneElement.textContent = profile.phone || placeholderText;
        if (displayAddressElement) displayAddressElement.textContent = profile.address || placeholderText;
        if (displayDobElement) displayDobElement.textContent = profile.birthdate ? utils.formatDate(profile.birthdate) : placeholderText; // Utilise utils.js
        if (displayTimezoneElement) displayTimezoneElement.textContent = profile.timezone || placeholderText;
        if (displayAvailabilityElement) displayAvailabilityElement.textContent = profile.availability || placeholderText; // Placeholder pour l'instant
        if (displayTeamElement) displayTeamElement.textContent = profile.team || placeholderText; // Assumant 'team' ajouté via ALTER
        if (displaySpecialtyElement) displaySpecialtyElement.textContent = profile.specialty || placeholderText; // Assumant 'specialty' ajouté via ALTER

        // Afficher les infos sécurité
        if (securityLastLoginElement) {
            securityLastLoginElement.textContent = profile.security?.last_login
                ? utils.formatDateTime(profile.security.last_login, currentLang, { dateStyle: 'medium', timeStyle: 'short' })
                : '-';
        }
        if (securityLastIpElement) {
            securityLastIpElement.textContent = profile.security?.last_ip || '-';
        }
        if (securityLastBrowserElement) {
            const userAgent = profile.security?.last_browser;
            securityLastBrowserElement.textContent = userAgent ? (userAgent.length > 50 ? userAgent.substring(0, 47) + '...' : userAgent) : '-';
            if(userAgent) securityLastBrowserElement.title = userAgent; // Tooltip complet
        }
        if (securityAuthMethodElement) {
            securityAuthMethodElement.textContent = profile.security?.auth_method || 'Email/Mdp';
        }

        // Afficher stats et prefs (placeholders pour l'instant)
        if (statsCatCountElement) statsCatCountElement.textContent = profile.stats?.category_count ?? '-';
        if (statsApptCountElement) statsApptCountElement.textContent = profile.stats?.appointment_count ?? '-';
        if (statsAttendanceElement) statsAttendanceElement.textContent = profile.stats?.attendance_rate ? `${profile.stats.attendance_rate}%` : '-';
        const themeText = profile.theme === 'dark' ? (translations[currentLang]?.profile_theme_dark || 'Sombre') : (translations[currentLang]?.profile_theme_light || 'Clair');
        if (prefsThemeElement) prefsThemeElement.textContent = themeText;
        const langText = profile.language === 'en' ? 'English' : 'Français';
        if (prefsLanguageElement) prefsLanguageElement.textContent = langText;
        const pageKey = `profile_page_${profile.homeSection || 'dashboard'}`;
        if (prefsDefaultPageElement) prefsDefaultPageElement.textContent = translations[currentLang]?.[pageKey] || (profile.homeSection || 'Dashboard');
        if (prefsSignatureElement) prefsSignatureElement.textContent = profile.signature ? 'Définie' : 'Non définie';

        // --- Pré-remplir le formulaire ---
        if (formFirstNameInput) formFirstNameInput.value = profile.firstName || '';
        if (formLastNameInput) formLastNameInput.value = profile.lastName || '';
        if (formEmailInput) formEmailInput.value = profile.email || '';
        if (formPhoneInput) formPhoneInput.value = profile.phone || ''; // <<< Nouveau
        if (formAddressInput) formAddressInput.value = profile.address || ''; // <<< Nouveau
        if (formBirthdateInput) formBirthdateInput.value = profile.birthdate || ''; // <<< Nouveau (format YYYY-MM-DD)
        if (formTimezoneInput) formTimezoneInput.value = profile.timezone || ''; // <<< Nouveau
        if (formTeamInput) formTeamInput.value = profile.team || ''; // <<< Nouveau
        if (formSpecialtyInput) formSpecialtyInput.value = profile.specialty || ''; // <<< Nouveau

    } catch (error) {
        console.error("Erreur loadProfileData:", error);
        if (messageElement) { messageElement.textContent = `Erreur chargement profil: ${error.message}`; messageElement.className = 'text-sm error'; }
        if (displayNameElement) displayNameElement.textContent = 'Erreur'; if (displayEmailElement) displayEmailElement.textContent = 'Erreur'; if (displayRoleElement) displayRoleElement.textContent = 'Erreur';
        // Laisser les autres champs avec leurs placeholders initiaux
    }
}

// --- Gestion des Événements ---

/** Initialise les écouteurs d'événements spécifiques à la section Profil */
export function initProfileEventListeners() {
    console.log("Initialisation des listeners pour la section Profil...");
    if (profileUpdateForm) {
        profileUpdateForm.removeEventListener('submit', handleProfileUpdateSubmit); // Eviter doublons
        profileUpdateForm.addEventListener('submit', handleProfileUpdateSubmit);
    } else {
        console.warn("Formulaire de mise à jour du profil '#profile-update-form' non trouvé.");
    }
    // TODO: Ajouter ici les listeners pour les boutons "Changer mot de passe", "Charger photo", etc.
}

/** Handler pour la soumission du formulaire de mise à jour du profil */
async function handleProfileUpdateSubmit(event) {
    event.preventDefault();
    const submitButton = profileUpdateForm.querySelector('button[type="submit"]');
    const originalButtonTextKey = "profile_button_save";
    const currentLang = document.documentElement.lang || 'fr';
    const originalButtonText = translations[currentLang]?.[originalButtonTextKey] || "Enregistrer";

    submitButton.disabled = true;
    submitButton.textContent = "Sauvegarde...";
    if(messageElement) messageElement.textContent = '';

    const formData = new FormData(profileUpdateForm);
    // === MODIFIÉ : Récupérer toutes les données du formulaire ===
    const profileData = {
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        email: formData.get('email'),
        phone: formData.get('phone') || null, // Envoyer null si vide
        address: formData.get('address') || null,
        birthdate: formData.get('birthdate') || null, // Garder YYYY-MM-DD
        timezone: formData.get('timezone') || null,
        team: formData.get('team') || null,
        specialty: formData.get('specialty') || null
        // Ajouter d'autres champs si le formulaire est étendu (language, theme...)
    };
    // ===========================================================

    console.log("Données MàJ Profil (avant envoi):", profileData);

    try {
        // Utilisation de la fonction importée depuis api.js
        const result = await api.updateProfile(profileData); // Envoyer l'objet complet
        console.log("Profil mis à jour:", result.profile);
        if(messageElement) {
            messageElement.textContent = translations[currentLang]?.['profile_update_success'] || "Profil mis à jour !";
            messageElement.className = 'text-sm success';
        }
        loadProfileData(); // Recharger les données affichées ET le formulaire
        // Mettre à jour le nom dans le header
        const userNameElementHeader = document.getElementById('user-name-display');
        if(userNameElementHeader && result.profile) {
            userNameElementHeader.textContent = `${result.profile.firstName || ''} ${result.profile.lastName || ''}`.trim();
            // Optionnel: Mettre à jour aussi le localStorage si utilisé ailleurs
            const storedUser = localStorage.getItem('loggedInUser');
            if(storedUser) {
                try {
                    const userData = JSON.parse(storedUser);
                    userData.name = `${result.profile.firstName || ''} ${result.profile.lastName || ''}`.trim();
                    // Mettre à jour d'autres champs si nécessaire dans localStorage
                    localStorage.setItem('loggedInUser', JSON.stringify(userData));
                } catch(e) { console.error("Erreur MàJ localStorage:", e); }
            }
        }
    } catch (error) {
        console.error("Erreur MàJ Profil (API):", error);
        if(messageElement) {
            messageElement.textContent = error.message || translations[currentLang]?.['profile_update_error'] || "Erreur MàJ profil.";
            messageElement.className = 'text-sm error';
        }
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
    }
}
