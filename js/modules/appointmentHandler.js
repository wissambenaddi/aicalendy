/**
 * Fichier : js/modules/appointmentHandler.js
 * Description : Gère la logique spécifique à la section "Mes Rendez-vous".
 */

import { translations, setLanguage } from './translator.js'; // OK
import * as api from './core/api.js'; // <<< Chemin CORRIGÉ vers core/
import * as utils from './core/utils.js'; // <<< Chemin CORRIGÉ vers core/

// --- Références aux éléments DOM spécifiques aux RDV ---
const appointmentsListContainer = document.getElementById('appointments-list-container');
const createAppointmentBtn = document.getElementById('create-appointment-btn');

// --- Références Modale Création RDV ---
const createAppointmentModal = document.getElementById('create-appointment-modal');
const createAppointmentForm = document.getElementById('create-appointment-form');
const cancelCreateAppointmentBtn = document.getElementById('cancel-create-appointment-btn');
const createAppointmentErrorElement = document.getElementById('create-appointment-error');
const appointmentCategorySelect = document.getElementById('appointment-category');

// --- Références Modale Détails RDV ---
const appointmentDetailsModal = document.getElementById('appointment-details-modal');
const detailsApptTitle = document.getElementById('details-appt-title');
const detailsApptCategory = document.getElementById('details-appt-category');
const detailsApptDate = document.getElementById('details-appt-date');
const detailsApptStartTime = document.getElementById('details-appt-start-time');
const detailsApptEndTime = document.getElementById('details-appt-end-time');
const detailsApptStatus = document.getElementById('details-appt-status');
const closeAppointmentDetailsBtn = document.getElementById('close-appointment-details-btn');
const editAppointmentBtnFromDetails = document.getElementById('edit-appointment-btn'); // Renommé pour clarté
let currentViewingAppointmentId = null;

// --- Références Modale Édition RDV ---
const editAppointmentModal = document.getElementById('edit-appointment-modal');
const editAppointmentForm = document.getElementById('edit-appointment-form');
const cancelEditAppointmentBtn = document.getElementById('cancel-edit-appointment-btn');
const editAppointmentErrorElement = document.getElementById('edit-appointment-error');
const editAppointmentCategorySelect = document.getElementById('edit-appointment-category');
const editAppointmentIdInput = document.getElementById('edit-appointment-id');
const editAppointmentTitleInput = document.getElementById('edit-appointment-title');
const editAppointmentDateInput = document.getElementById('edit-appointment-date');
const editAppointmentStartTimeInput = document.getElementById('edit-appointment-start-time');
const editAppointmentEndTimeInput = document.getElementById('edit-appointment-end-time');

// --- Références Modale Confirmation Annulation RDV ---
const cancelAppointmentConfirmModal = document.getElementById('cancel-appointment-confirm-modal');
const confirmCancelAppointmentBtn = document.getElementById('confirm-cancel-appointment-btn');
const cancelCancelAppointmentBtn = document.getElementById('cancel-cancel-appointment-btn');
let appointmentIdToCancel = null;


// --- Fonctions Modales RDV ---

/** Affiche la modale de création de RDV et charge les catégories */
async function showCreateAppointmentModal() {
    if (!createAppointmentModal || !appointmentCategorySelect) { console.error("Modale création RDV ou select catégorie non trouvé."); return; }
    if(createAppointmentErrorElement) createAppointmentErrorElement.textContent = ''; createAppointmentForm?.reset();
    appointmentCategorySelect.innerHTML = `<option value="" disabled selected data-translate-key="appointment_form_select_category">${translations[document.documentElement.lang || 'fr']?.['appointment_form_select_category'] || 'Sélectionner...'}</option>`;
    appointmentCategorySelect.disabled = true;
    try {
        const categories = await api.fetchCategories(); // Utilise api.js
        if (categories && categories.length > 0) {
            categories.forEach(cat => { const option = document.createElement('option'); option.value = cat.id; option.textContent = cat.titre; appointmentCategorySelect.appendChild(option); });
            appointmentCategorySelect.disabled = false;
        } else { console.warn("Aucune catégorie trouvée."); if(createAppointmentErrorElement) createAppointmentErrorElement.textContent = "Aucune catégorie disponible."; }
    } catch (error) { console.error("Erreur chargement catégories pour modale RDV:", error); if(createAppointmentErrorElement) createAppointmentErrorElement.textContent = "Erreur chargement des catégories."; }
    createAppointmentModal.classList.add('active'); createAppointmentForm?.querySelector('input[name="titre"]')?.focus();
}
function hideCreateAppointmentModal() { if (createAppointmentModal) { createAppointmentModal.classList.remove('active'); } }

/** Affiche la modale de détails de RDV avec les données fournies */
function showAppointmentDetailsModal(appointmentData) {
    if (!appointmentDetailsModal) return; const currentLang = document.documentElement.lang || 'fr';
    currentViewingAppointmentId = appointmentData.id;
    if(detailsApptTitle) detailsApptTitle.textContent = appointmentData.titre || 'Rendez-vous';
    if(detailsApptCategory) detailsApptCategory.textContent = appointmentData.categorie_titre || 'Non spécifiée';
    if(detailsApptDate) detailsApptDate.textContent = utils.formatDate(appointmentData.heure_debut, currentLang, { dateStyle: 'full' });
    if(detailsApptStartTime) detailsApptStartTime.textContent = utils.formatDateTime(appointmentData.heure_debut, currentLang, { timeStyle: 'short' });
    if(detailsApptEndTime) detailsApptEndTime.textContent = utils.formatDateTime(appointmentData.heure_fin, currentLang, { timeStyle: 'short' });
    if(detailsApptStatus) {
        detailsApptStatus.innerHTML = ''; const statusBadge = document.createElement('span'); statusBadge.className = 'appointment-status-badge';
        let statusText = appointmentData.statut || 'pending'; let statusClass = `appointment-status-${statusText}`; let translationKey = `appointment_status_${statusText}`;
        statusBadge.textContent = translations[currentLang]?.[translationKey] || statusText; statusBadge.classList.add(statusClass); detailsApptStatus.appendChild(statusBadge);
    }
    appointmentDetailsModal.classList.add('active');
}
function hideAppointmentDetailsModal() { if (appointmentDetailsModal) { appointmentDetailsModal.classList.remove('active'); currentViewingAppointmentId = null; } }

/** Affiche la modale d'édition de RDV et pré-remplit les champs */
async function showEditAppointmentModal(appointmentData) {
    if (!editAppointmentModal || !editAppointmentCategorySelect || !appointmentData) { console.error("Modale édition RDV, select catégorie ou données RDV manquants."); alert("Impossible d'ouvrir la modification."); return; }
    if(editAppointmentErrorElement) editAppointmentErrorElement.textContent = ''; editAppointmentForm?.reset();
    editAppointmentCategorySelect.innerHTML = `<option value="" disabled data-translate-key="appointment_form_select_category">${translations[document.documentElement.lang || 'fr']?.['appointment_form_select_category'] || 'Sélectionner...'}</option>`;
    editAppointmentCategorySelect.disabled = true;
    try {
        const categories = await api.fetchCategories(); // Utilise api.js
        if (categories && categories.length > 0) {
            categories.forEach(cat => { const option = document.createElement('option'); option.value = cat.id; option.textContent = cat.titre; if (cat.id === appointmentData.categorie_id) { option.selected = true; } editAppointmentCategorySelect.appendChild(option); });
            editAppointmentCategorySelect.disabled = false;
        } else { console.warn("Aucune catégorie trouvée pour sélecteur édition."); }
    } catch (error) { console.error("Erreur chargement catégories pour modale édition RDV:", error); if(editAppointmentErrorElement) editAppointmentErrorElement.textContent = "Erreur chargement des catégories."; }
    if(editAppointmentIdInput) editAppointmentIdInput.value = appointmentData.id;
    if(editAppointmentTitleInput) editAppointmentTitleInput.value = appointmentData.titre || '';
    if(editAppointmentDateInput) editAppointmentDateInput.value = utils.formatTimestampForDateInput(appointmentData.heure_debut);
    if(editAppointmentStartTimeInput) editAppointmentStartTimeInput.value = utils.formatTimestampForTimeInput(appointmentData.heure_debut);
    if(editAppointmentEndTimeInput) editAppointmentEndTimeInput.value = utils.formatTimestampForTimeInput(appointmentData.heure_fin);
    editAppointmentModal.classList.add('active'); editAppointmentTitleInput?.focus();
}
function hideEditAppointmentModal() { if (editAppointmentModal) { editAppointmentModal.classList.remove('active'); } }

/** Affiche la modale de confirmation d'annulation */
function showCancelAppointmentConfirmModal(apptId) {
    if (!cancelAppointmentConfirmModal) return;
    appointmentIdToCancel = apptId;
    cancelAppointmentConfirmModal.classList.add('active');
}
function hideCancelAppointmentConfirmModal() {
    if (cancelAppointmentConfirmModal) {
        cancelAppointmentConfirmModal.classList.remove('active');
        appointmentIdToCancel = null;
    }
}

// --- Fonctions d'Affichage RDV ---

/** Génère le HTML pour la liste des rendez-vous (sous forme de tableau). */
function renderAppointmentsList(container, appointments) {
    if (!container) { console.error("Conteneur de liste de RDV non trouvé."); return; }
    const currentLang = document.documentElement.lang || 'fr'; container.innerHTML = '';
    if (!appointments || appointments.length === 0) { const emptyKey = 'no_appointments_found'; const emptyText = translations[currentLang]?.[emptyKey] || 'Aucun rendez-vous trouvé.'; container.innerHTML = `<div class="appointments-empty-message">${emptyText}</div>`; return; }
    const table = document.createElement('table'); table.className = 'appointments-table w-full'; const thead = table.createTHead(); const headerRow = thead.insertRow(); const headers = ['Titre', 'Date et Heure', 'Statut', 'Actions']; headers.forEach(text => { const th = document.createElement('th'); th.scope = 'col'; th.textContent = text; headerRow.appendChild(th); });
    const tbody = table.createTBody();
    appointments.forEach(appt => {
        const row = tbody.insertRow();
        row.insertCell().textContent = appt.titre || 'Rendez-vous';
        const cellDateTime = row.insertCell(); cellDateTime.textContent = utils.formatDateTime(appt.heure_debut, currentLang, { dateStyle: 'long', timeStyle: 'short' });
        const cellStatus = row.insertCell(); const statusBadge = document.createElement('span'); statusBadge.className = 'appointment-status-badge'; let statusText = appt.statut || 'pending'; let statusClass = `appointment-status-${statusText}`; let translationKey = `appointment_status_${statusText}`; statusBadge.textContent = translations[currentLang]?.[translationKey] || statusText; statusBadge.classList.add(statusClass); cellStatus.appendChild(statusBadge);
        const cellActions = row.insertCell(); cellActions.className = 'appointment-actions';
        cellActions.innerHTML = `
            <button title="${translations[currentLang]?.['appointment_action_details'] || 'Détails'}" data-action="view-appt" data-appt-id="${appt.id}" class="details-btn"> <svg class="inline w-3 h-3 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg> <span data-translate-key="appointment_action_details">Détails</span> </button>
            <button title="${translations[currentLang]?.['appointment_action_reschedule'] || 'Reprogrammer'}" data-action="reschedule-appt" data-appt-id="${appt.id}" class="reschedule-btn"> <svg class="inline w-3 h-3 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" /></svg> <span data-translate-key="appointment_action_reschedule">Reprogrammer</span> </button>
            <button title="${translations[currentLang]?.['appointment_action_cancel'] || 'Annuler'}" data-action="cancel-appt" data-appt-id="${appt.id}" class="cancel-btn"> <svg class="inline w-3 h-3 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" /></svg> <span data-translate-key="appointment_action_cancel">Annuler</span> </button>
        `;
    });
    container.appendChild(table);
}

// --- Chargement Initial & Export ---

/** Charge tous les rendez-vous depuis l'API et les affiche */
export async function loadAllAppointments() {
    if (!appointmentsListContainer) { console.error("Conteneur '#appointments-list-container' non trouvé."); return; }
    appointmentsListContainer.innerHTML = '<div class="text-center py-10 text-gray-500">Chargement des rendez-vous...</div>';
    try {
        const appointments = await api.fetchAppointments();
        renderAppointmentsList(appointmentsListContainer, appointments);
        initAppointmentListEventListeners(); // Attacher listeners à la liste rendue
    } catch (error) {
        console.error("Erreur loadAllAppointments:", error);
        const currentLang = document.documentElement.lang || 'fr';
        const errorText = translations[currentLang]?.['no_appointments_found'] || 'Erreur chargement rendez-vous.';
        appointmentsListContainer.innerHTML = `<div class="appointments-empty-message text-red-600">${errorText} (${error.message})</div>`;
    }
}

// --- Gestion des Événements ---

/** Initialise les écouteurs d'événements spécifiques à la section RDV */
export function initAppointmentEventListeners() {
    console.log("Initialisation des listeners pour la section Rendez-vous...");

    // Bouton "Nouveau RDV"
    if (createAppointmentBtn) {
        createAppointmentBtn.removeEventListener('click', showCreateAppointmentModal);
        createAppointmentBtn.addEventListener('click', showCreateAppointmentModal);
    } else { console.warn("Bouton 'create-appointment-btn' non trouvé."); }

    // Modale Création RDV
    if (cancelCreateAppointmentBtn) { cancelCreateAppointmentBtn.addEventListener('click', hideCreateAppointmentModal); }
    if (createAppointmentModal) { createAppointmentModal.addEventListener('click', handleCreateAppointmentModalOverlayClick); }
    if (createAppointmentForm) { createAppointmentForm.addEventListener('submit', handleCreateAppointmentSubmit); }

    // Modale Détails RDV
    if (closeAppointmentDetailsBtn) { closeAppointmentDetailsBtn.addEventListener('click', hideAppointmentDetailsModal); }
    if (appointmentDetailsModal) { appointmentDetailsModal.addEventListener('click', handleAppointmentDetailsModalOverlayClick); }
    if (editAppointmentBtnFromDetails) { editAppointmentBtnFromDetails.addEventListener('click', handleEditFromDetailsClick); }

    // Modale Édition RDV
    if (cancelEditAppointmentBtn) { cancelEditAppointmentBtn.addEventListener('click', hideEditAppointmentModal); }
    if (editAppointmentModal) { editAppointmentModal.addEventListener('click', handleEditAppointmentModalOverlayClick); }
    if (editAppointmentForm) { editAppointmentForm.addEventListener('submit', handleEditAppointmentSubmit); }

    // Modale Confirmation Annulation RDV
    if (cancelCancelAppointmentBtn) { cancelCancelAppointmentBtn.addEventListener('click', hideCancelAppointmentConfirmModal); }
    if (cancelAppointmentConfirmModal) { cancelAppointmentConfirmModal.addEventListener('click', handleCancelConfirmModalOverlayClick); }
    if (confirmCancelAppointmentBtn) { confirmCancelAppointmentBtn.addEventListener('click', handleConfirmCancelAppointment); }

    // Listener délégué pour la liste (appelé aussi après chaque chargement)
    initAppointmentListEventListeners();
}

/** Attache les listeners à la liste des RDV (appelé après chaque render) */
function initAppointmentListEventListeners() {
    if (appointmentsListContainer) {
        appointmentsListContainer.removeEventListener('click', handleAppointmentListClick);
        appointmentsListContainer.addEventListener('click', handleAppointmentListClick);
    } else {
        console.warn("Conteneur '#appointments-list-container' non trouvé pour listeners.");
    }
}

// Handler pour les clics délégués sur la liste des RDV
async function handleAppointmentListClick(event) {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    const action = button.dataset.action;
    const apptId = button.dataset.apptId;

    if (action === 'view-appt') {
        console.log(`Action: Voir détails RDV ${apptId}`); button.disabled = true;
        try {
            const appointment = await api.fetchAppointmentDetails(apptId);
            showAppointmentDetailsModal(appointment);
        } catch (error) { console.error("Erreur fetch détails RDV:", error); alert(`Erreur: ${error.message}`);
        } finally { button.disabled = false; }
    } else if (action === 'reschedule-appt') {
        console.log(`Action: Reprogrammer RDV ${apptId}`); button.disabled = true;
        try {
            const appointment = await api.fetchAppointmentDetails(apptId);
            showEditAppointmentModal(appointment);
        } catch (error) { console.error("Erreur fetch détails RDV pour édition:", error); alert(`Erreur: ${error.message}`);
        } finally { button.disabled = false; }
    } else if (action === 'cancel-appt') {
        console.log(`Action: Annuler RDV ${apptId}`);
        showCancelAppointmentConfirmModal(apptId);
    }
}

// --- Handlers pour les événements des modales ---

function handleCreateAppointmentModalOverlayClick(event) { if (event.target === createAppointmentModal) { hideCreateAppointmentModal(); } }
function handleAppointmentDetailsModalOverlayClick(event) { if (event.target === appointmentDetailsModal) { hideAppointmentDetailsModal(); } }
function handleEditAppointmentModalOverlayClick(event) { if (event.target === editAppointmentModal) { hideEditAppointmentModal(); } }
function handleCancelConfirmModalOverlayClick(event) { if (event.target === cancelAppointmentConfirmModal) { hideCancelAppointmentConfirmModal(); } }

async function handleCreateAppointmentSubmit(event) {
    event.preventDefault(); const submitButton = createAppointmentForm.querySelector('button[type="submit"]'); const originalButtonTextKey = "appointment_form_create"; const currentLang = document.documentElement.lang || 'fr'; const originalButtonText = translations[currentLang]?.[originalButtonTextKey] || "Créer le rendez-vous";
    submitButton.disabled = true; submitButton.textContent = "Création..."; if(createAppointmentErrorElement) createAppointmentErrorElement.textContent = '';
    const formData = new FormData(createAppointmentForm); const appointmentData = {};
    appointmentData.titre = formData.get('titre') || null; appointmentData.categorie_id = formData.get('categorie_id');
    const dateStr = formData.get('date'); const startTimeStr = formData.get('heure_debut'); const endTimeStr = formData.get('heure_fin');
    let startTimestamp = null; let endTimestamp = null;
    if (dateStr && startTimeStr) { try { startTimestamp = new Date(`${dateStr}T${startTimeStr}`).getTime(); if (isNaN(startTimestamp)) throw new Error("Date/heure début invalide"); } catch(e) { console.error("Erreur parsing date/heure début:", e); if(createAppointmentErrorElement) createAppointmentErrorElement.textContent = "Format date/heure de début invalide."; submitButton.disabled = false; submitButton.textContent = originalButtonText; return; } } else { if(createAppointmentErrorElement) createAppointmentErrorElement.textContent = "Date et heure de début requises."; submitButton.disabled = false; submitButton.textContent = originalButtonText; return; }
    if (dateStr && endTimeStr) { try { endTimestamp = new Date(`${dateStr}T${endTimeStr}`).getTime(); if (isNaN(endTimestamp)) throw new Error("Date/heure fin invalide"); if (endTimestamp <= startTimestamp) throw new Error("Heure fin avant ou égale à heure début"); } catch(e) { console.error("Erreur parsing/validation date/heure fin:", e); if(createAppointmentErrorElement) createAppointmentErrorElement.textContent = e.message || "Format date/heure de fin invalide ou incohérent."; submitButton.disabled = false; submitButton.textContent = originalButtonText; return; } } else { if(createAppointmentErrorElement) createAppointmentErrorElement.textContent = "Heure de fin requise."; submitButton.disabled = false; submitButton.textContent = originalButtonText; return; }
    const bodyData = { titre: appointmentData.titre, categorie_id: appointmentData.categorie_id, heure_debut: startTimestamp, heure_fin: endTimestamp, statut: 'confirmed' };
    try {
        const result = await api.createAppointment(bodyData);
        console.log("RDV créé:", result.appointment); hideCreateAppointmentModal(); loadAllAppointments();
    } catch (error) { console.error("Erreur création RDV (API):", error); if(createAppointmentErrorElement) createAppointmentErrorElement.textContent = error.message || "Erreur lors de la création.";
    } finally { submitButton.disabled = false; submitButton.textContent = originalButtonText; }
}

async function handleEditFromDetailsClick() {
    if(currentViewingAppointmentId) {
        console.log(`Action: Modifier RDV ${currentViewingAppointmentId} (depuis détails)`);
        hideAppointmentDetailsModal();
        editAppointmentBtnFromDetails.disabled = true;
        try {
             const appointment = await api.fetchAppointmentDetails(currentViewingAppointmentId);
             showEditAppointmentModal(appointment);
        } catch (error) { console.error("Erreur fetch détails RDV pour édition depuis détails:", error); alert(`Erreur: ${error.message}`);
        } finally { editAppointmentBtnFromDetails.disabled = false; }
    }
}

async function handleEditAppointmentSubmit(event) {
    event.preventDefault(); const submitButton = editAppointmentForm.querySelector('button[type="submit"]'); const originalButtonTextKey = "appointment_form_save"; const currentLang = document.documentElement.lang || 'fr'; const originalButtonText = translations[currentLang]?.[originalButtonTextKey] || "Enregistrer";
    submitButton.disabled = true; submitButton.textContent = "Sauvegarde..."; if(editAppointmentErrorElement) editAppointmentErrorElement.textContent = '';
    const formData = new FormData(editAppointmentForm); const appointmentId = formData.get('appointment_id');
    if (!appointmentId) { if(editAppointmentErrorElement) editAppointmentErrorElement.textContent = "Erreur : ID du rendez-vous manquant."; submitButton.disabled = false; submitButton.textContent = originalButtonText; return; }
    const appointmentData = {}; appointmentData.titre = formData.get('titre') || null; appointmentData.categorie_id = formData.get('categorie_id');
    const dateStr = formData.get('date'); const startTimeStr = formData.get('heure_debut'); const endTimeStr = formData.get('heure_fin');
    let startTimestamp = null; let endTimestamp = null;
    if (dateStr && startTimeStr) { try { startTimestamp = new Date(`${dateStr}T${startTimeStr}`).getTime(); if (isNaN(startTimestamp)) throw new Error("Date/heure début invalide"); } catch(e) { console.error("Erreur parsing date/heure début:", e); if(editAppointmentErrorElement) editAppointmentErrorElement.textContent = "Format date/heure de début invalide."; submitButton.disabled = false; submitButton.textContent = originalButtonText; return; } } else { if(editAppointmentErrorElement) editAppointmentErrorElement.textContent = "Date et heure de début requises."; submitButton.disabled = false; submitButton.textContent = originalButtonText; return; }
    if (dateStr && endTimeStr) { try { endTimestamp = new Date(`${dateStr}T${endTimeStr}`).getTime(); if (isNaN(endTimestamp)) throw new Error("Date/heure fin invalide"); if (endTimestamp <= startTimestamp) throw new Error("Heure fin avant ou égale à heure début"); } catch(e) { console.error("Erreur parsing/validation date/heure fin:", e); if(editAppointmentErrorElement) editAppointmentErrorElement.textContent = e.message || "Format date/heure de fin invalide ou incohérent."; submitButton.disabled = false; submitButton.textContent = originalButtonText; return; } } else { if(editAppointmentErrorElement) editAppointmentErrorElement.textContent = "Heure de fin requise."; submitButton.disabled = false; submitButton.textContent = originalButtonText; return; }
    const bodyData = { titre: appointmentData.titre, categorie_id: appointmentData.categorie_id, heure_debut: startTimestamp, heure_fin: endTimestamp };
    try {
        const result = await api.updateAppointment(appointmentId, bodyData);
        console.log("RDV mis à jour:", result.appointment); hideEditAppointmentModal(); loadAllAppointments();
    } catch (error) { console.error("Erreur MàJ RDV (API):", error); if(editAppointmentErrorElement) editAppointmentErrorElement.textContent = error.message || "Erreur lors de la mise à jour.";
    } finally { submitButton.disabled = false; submitButton.textContent = originalButtonText; }
}

async function handleConfirmCancelAppointment() {
    if (!appointmentIdToCancel) return;
    console.log(`Confirmation annulation RDV ${appointmentIdToCancel}`); confirmCancelAppointmentBtn.disabled = true; const originalText = confirmCancelAppointmentBtn.textContent; confirmCancelAppointmentBtn.textContent = "Annulation...";
    try {
        await api.updateAppointmentStatus(appointmentIdToCancel, { statut: 'canceled' });
        console.log("RDV annulé avec succès (statut mis à jour)."); hideCancelAppointmentConfirmModal(); loadAllAppointments();
    } catch (error) { console.error("Erreur annulation RDV (API):", error); alert(`Erreur lors de l'annulation: ${error.message || 'Erreur inconnue.'}`);
    } finally { confirmCancelAppointmentBtn.disabled = false; confirmCancelAppointmentBtn.textContent = originalText; appointmentIdToCancel = null; }
}
