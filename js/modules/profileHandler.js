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
const formPhoneInput = document.getElementById('profile-phone');
const formAddressInput = document.getElementById('profile-address');
const formBirthdateInput = document.getElementById('profile-birthdate');
const formTimezoneInput = document.getElementById('profile-timezone');
const formTeamInput = document.getElementById('profile-team');
const formSpecialtyInput = document.getElementById('profile-specialty');
const messageElement = document.getElementById('profile-update-message');

// Références bouton et modale Mot de Passe
const changePasswordButton = document.getElementById('profile-button-change-password');
const changePasswordModal = document.getElementById('change-password-modal');
const changePasswordForm = document.getElementById('change-password-form');
const currentPasswordInput = document.getElementById('current-password');
const newPasswordInput = document.getElementById('new-password');
const confirmNewPasswordInput = document.getElementById('confirm-new-password');
const cancelChangePasswordBtn = document.getElementById('cancel-change-password-btn');
const changePasswordErrorElement = document.getElementById('change-password-error');
const changePasswordSuccessElement = document.getElementById('change-password-success');


// --- Fonctions Modale Mot de Passe ---
function showChangePasswordModal() {
    if (changePasswordModal) {
        changePasswordForm?.reset();
        if(changePasswordErrorElement) changePasswordErrorElement.textContent = '';
        if(changePasswordSuccessElement) changePasswordSuccessElement.textContent = '';
        changePasswordModal.classList.add('active');
        currentPasswordInput?.focus();
    } else { console.error("Modale 'change-password-modal' non trouvée."); }
}

function hideChangePasswordModal() {
    if (changePasswordModal) {
        changePasswordModal.classList.remove('active');
    }
}

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
    if (formPhoneInput) formPhoneInput.value = '';
    if (formAddressInput) formAddressInput.value = '';
    if (formBirthdateInput) formBirthdateInput.value = '';
    if (formTimezoneInput) formTimezoneInput.value = '';
    if (formTeamInput) formTeamInput.value = '';
    if (formSpecialtyInput) formSpecialtyInput.value = '';


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
        if (formPhoneInput) formPhoneInput.value = profile.phone || '';
        if (formAddressInput) formAddressInput.value = profile.address || '';
        if (formBirthdateInput) formBirthdateInput.value = profile.birthdate || ''; // Format YYYY-MM-DD
        if (formTimezoneInput) formTimezoneInput.value = profile.timezone || '';
        if (formTeamInput) formTeamInput.value = profile.team || '';
        if (formSpecialtyInput) formSpecialtyInput.value = profile.specialty || '';

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
    // Formulaire principal
    if (profileUpdateForm) {
        profileUpdateForm.removeEventListener('submit', handleProfileUpdateSubmit); // Eviter doublons
        profileUpdateForm.addEventListener('submit', handleProfileUpdateSubmit);
    } else {
        console.warn("Formulaire '#profile-update-form' non trouvé.");
    }

    // Bouton "Changer mot de passe"
    if (changePasswordButton) {
        changePasswordButton.removeEventListener('click', showChangePasswordModal);
        changePasswordButton.addEventListener('click', showChangePasswordModal);
    } else {
        console.warn("Bouton '#profile-button-change-password' non trouvé.");
    }

    // Modale Changement Mot de Passe
    if (cancelChangePasswordBtn) {
        cancelChangePasswordBtn.removeEventListener('click', hideChangePasswordModal); // Eviter doublons
        cancelChangePasswordBtn.addEventListener('click', hideChangePasswordModal);
    }
    if (changePasswordModal) {
        changePasswordModal.removeEventListener('click', handlePasswordModalOverlayClick); // Eviter doublons
        changePasswordModal.addEventListener('click', handlePasswordModalOverlayClick);
    }
    if (changePasswordForm) {
         changePasswordForm.removeEventListener('submit', handleChangePasswordSubmit); // Eviter doublons
        changePasswordForm.addEventListener('submit', handleChangePasswordSubmit);
    }
}

// Handler pour clic sur l'overlay de la modale mot de passe
function handlePasswordModalOverlayClick(event) {
     if (event.target === changePasswordModal) {
        hideChangePasswordModal();
    }
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
    // Récupérer toutes les données du formulaire
    const profileData = {
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        email: formData.get('email'),
        phone: formData.get('phone') || null,
        address: formData.get('address') || null,
        birthdate: formData.get('birthdate') || null,
        timezone: formData.get('timezone') || null,
        team: formData.get('team') || null,
        specialty: formData.get('specialty') || null
        // Ajouter d'autres champs si le formulaire est étendu
    };

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

/** Handler pour la soumission du formulaire de changement de mot de passe */
async function handleChangePasswordSubmit(event) {
    event.preventDefault();
    const submitButton = changePasswordForm.querySelector('button[type="submit"]');
    const originalButtonTextKey = "appointment_form_save"; // Réutiliser clé existante
    const currentLang = document.documentElement.lang || 'fr';
    const originalButtonText = translations[currentLang]?.[originalButtonTextKey] || "Enregistrer";

    // Récupérer les valeurs
    const currentPassword = currentPasswordInput.value;
    const newPassword = newPasswordInput.value;
    const confirmNewPassword = confirmNewPasswordInput.value;

    // Réinitialiser messages
    if(changePasswordErrorElement) changePasswordErrorElement.textContent = '';
    if(changePasswordSuccessElement) changePasswordSuccessElement.textContent = '';

    // Validation simple
    if (!currentPassword || !newPassword || !confirmNewPassword) {
        if(changePasswordErrorElement) changePasswordErrorElement.textContent = translations[currentLang]?.['error_all_fields_required'] || "Tous les champs sont requis.";
        return;
    }
    if (newPassword !== confirmNewPassword) {
        if(changePasswordErrorElement) changePasswordErrorElement.textContent = translations[currentLang]?.['error_passwords_dont_match'] || "Les nouveaux mots de passe ne correspondent pas.";
        return;
    }
    if (newPassword.length < 6) { // Exemple de validation simple
         if(changePasswordErrorElement) changePasswordErrorElement.textContent = translations[currentLang]?.['error_password_too_short'] || "Le nouveau mot de passe doit faire au moins 6 caractères.";
        return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "Sauvegarde..."; // TODO: Traduire

    try {
        const result = await api.changePassword({ currentPassword, newPassword }); // Appel API
        if (result.success) {
            if(changePasswordSuccessElement) changePasswordSuccessElement.textContent = translations[currentLang]?.['password_change_success'] || "Mot de passe modifié avec succès !";
            changePasswordForm.reset();
            // Optionnel: fermer la modale après un délai
            setTimeout(hideChangePasswordModal, 2000);
        } else {
             // L'API devrait renvoyer un message d'erreur spécifique
             if(changePasswordErrorElement) changePasswordErrorElement.textContent = result.message || (translations[currentLang]?.['password_change_error'] || "Erreur lors de la modification.");
        }
    } catch (error) {
        console.error("Erreur changement mot de passe:", error);
        // Afficher l'erreur spécifique renvoyée par l'API si possible
        if(changePasswordErrorElement) changePasswordErrorElement.textContent = error.message || (translations[currentLang]?.['error_network_or_server'] || "Erreur réseau ou serveur.");
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
    }
}
