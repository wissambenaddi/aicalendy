/**
 * Fichier : js/modules/dashboard.js
 * Description : Gère la logique du tableau de bord : navigation, affichage infos user,
 * KPIs, affichage dynamique des catégories et des rendez-vous par catégorie,
 * gestion des modales (logout, création catégorie, création tâche), dropdown profil.
 */

// Importer les traductions pour les messages et textes dynamiques
// Assurez-vous que translator.js exporte bien l'objet 'translations'
import { translations } from './translator.js';
// Décommentez si setLanguage est nécessaire (ex: pour titre H1 dynamique si non géré autrement)
// import { setLanguage } from './translator.js';

let progressChartInstance = null; // Référence globale au graphique Chart.js

// --- Fonctions Utilitaires ---
/** Formate un timestamp (ms) en date et heure lisibles */
function formatDateTime(timestamp, locale = 'fr', options = { dateStyle: 'medium', timeStyle: 'short' }) {
    if (timestamp === null || timestamp === undefined) return ''; // Gérer null/undefined
    try {
        const date = new Date(timestamp);
        // Vérifier si la date est valide après conversion
        if (isNaN(date.getTime())) {
            console.warn("Timestamp invalide pour formatDateTime:", timestamp);
            return 'Date invalide';
        }
        return date.toLocaleString(locale, options);
    }
    catch (e) { console.error("Error formatting date:", e); return 'Date invalide'; }
}
/** Formate un timestamp (ms) en date lisible */
function formatDate(timestamp, locale = 'fr', options = { dateStyle: 'short' }) {
     if (timestamp === null || timestamp === undefined) return ''; // Gérer null/undefined
     try {
         const date = new Date(timestamp);
         if (isNaN(date.getTime())) {
            console.warn("Timestamp invalide pour formatDate:", timestamp);
            return 'Date invalide';
         }
         return date.toLocaleDateString(locale, options);
     }
     catch (e) { console.error("Error formatting date:", e); return 'Date invalide'; }
}

// --- Fonctions d'Affichage Dynamique ---

/**
 * Affiche une liste de RDV ou Tâches dans un élément UL donné.
 * @param {HTMLElement|null} listElement - L'élément UL où insérer la liste.
 * @param {Array|null} items - Le tableau d'objets (rendez-vous ou tâches).
 * @param {'appointments' | 'tasks'} type - Le type d'éléments.
 */
function renderList(listElement, items, type) {
    if (!listElement) {
        console.error(`Element UL non trouvé pour renderList (type: ${type})`);
        return;
    }
    listElement.innerHTML = ''; // Vider la liste précédente
    const currentLang = document.documentElement.lang || 'fr';
    let isEmpty = true;
    let emptyKey = '';

    // Déterminer la clé de traduction pour le message "liste vide"
    if (type === 'appointments') {
        emptyKey = listElement.id === 'category-appointments-list' ? 'no_appointments_in_category' : 'dashboard_no_appointments_today';
    } else { // tasks
        emptyKey = 'dashboard_no_tasks_today';
    }

    // Générer les éléments <li> si la liste n'est pas vide
    if (items && items.length > 0) {
        isEmpty = false;
        items.forEach(item => {
            const li = document.createElement('li');
            li.className = 'dashboard-list-item';
            const isAppointment = type === 'appointments';
            // Ajouter classe si tâche en retard
            if (!isAppointment && item.date_echeance < Date.now() && !item.est_complete) { li.classList.add('dashboard-item-overdue'); }

            const titleSpan = document.createElement('span');
            titleSpan.className = 'dashboard-item-title';
            titleSpan.textContent = item.titre || 'Sans titre';
            titleSpan.title = item.titre || ''; // Tooltip

            const dateSpan = document.createElement('span');
            dateSpan.className = 'dashboard-item-date';
            const timestamp = isAppointment ? item.heure_debut : item.date_echeance;
            const formatOptions = isAppointment ? { dateStyle: 'short', timeStyle: 'short' } : { dateStyle: 'short' };
            dateSpan.textContent = formatDateTime(timestamp, currentLang, formatOptions);

            li.appendChild(titleSpan);
            li.appendChild(dateSpan);
            listElement.appendChild(li);
        });
    }

    // Afficher le message si la liste est vide
    if (isEmpty) {
        const emptyText = translations[currentLang]?.[emptyKey] || (type === 'appointments' ? 'Aucun rendez-vous.' : 'Aucune tâche.');
        listElement.innerHTML = `<li class="dashboard-list-empty">${emptyText}</li>`;
    }
}


/** Génère et affiche les cartes de catégories dans le conteneur spécifié. */
function renderCategoryCards(container, categories) {
    if (!container) return;
    const currentLang = document.documentElement.lang || 'fr';
    container.innerHTML = ''; // Vider

    // --- Header Section Catégories ---
    const title = document.createElement('h1'); title.className = 'text-2xl md:text-3xl font-bold text-gray-900'; title.dataset.translateKey = 'categories_section_title'; title.textContent = translations[currentLang]?.['categories_section_title'] || 'Mes Catégories';
    const createBtn = document.createElement('button'); createBtn.id = 'create-category-btn'; createBtn.className = 'inline-flex items-center px-4 py-2 bg-indigo-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-indigo-700 active:bg-indigo-800 focus:outline-none focus:border-indigo-800 focus:ring focus:ring-indigo-300 disabled:opacity-25 transition'; const createBtnText = translations[currentLang]?.['dashboard_create_category'] || 'Créer'; createBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4 mr-2 -ml-1"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg><span data-translate-key="dashboard_create_category">${createBtnText}</span>`;
    // Listener pour OUVRIR la modale
    createBtn.addEventListener('click', showCreateCategoryModal);
    const headerDiv = document.createElement('div'); headerDiv.className = 'flex justify-between items-center mb-6'; headerDiv.appendChild(title); headerDiv.appendChild(createBtn); container.appendChild(headerDiv);
    // --- Fin Header ---

    // Afficher message si pas de catégories
    if (!categories || categories.length === 0) { const emptyText = translations[currentLang]?.['no_categories_found'] || 'Aucune catégorie créée.'; container.innerHTML += `<div class="text-center py-10 text-gray-500">${emptyText}</div>`; return; }

    // Créer la grille pour les cartes
    const grid = document.createElement('div'); grid.className = 'category-grid';
    categories.forEach(cat => {
        const card = document.createElement('div'); card.className = 'category-card'; card.dataset.categoryId = cat.id; card.dataset.categoryName = cat.titre;
        const colorBar = document.createElement('div'); colorBar.className = 'category-card-color-bar'; if (cat.couleur) colorBar.style.backgroundColor = cat.couleur; card.appendChild(colorBar);
        const content = document.createElement('div'); content.className = 'category-card-content'; const durationText = cat.duree ? `<p class="text-xs text-gray-500 mb-2">${cat.duree} min</p>` : ''; content.innerHTML = `<h3 class="category-card-title">${cat.titre || 'Sans titre'}</h3> ${durationText} <p class="category-card-description">${cat.description || 'Pas de description.'}</p>`; card.appendChild(content);
        const footer = document.createElement('div'); footer.className = 'category-card-footer'; const actionsText = translations[currentLang]?.['card_actions'] || 'Actions :';
        footer.innerHTML = `<span class="text-xs text-gray-500" data-translate-key="card_actions">${actionsText}</span> <div class="category-card-actions"> <button title="${translations[currentLang]?.['action_view_appointments'] || 'Voir RDV'}" data-action="view" data-category-id="${cat.id}" data-category-name="${cat.titre}" aria-label="${translations[currentLang]?.['action_view_appointments'] || 'Voir RDV'}" class="p-1 text-gray-500 hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 rounded-full hover:bg-gray-100"> <svg class="w-5 h-5 pointer-events-none" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg> </button> <button title="${translations[currentLang]?.['action_edit'] || 'Modifier'}" data-action="edit" data-category-id="${cat.id}" aria-label="${translations[currentLang]?.['action_edit'] || 'Modifier'}" class="p-1 text-gray-500 hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 rounded-full hover:bg-gray-100"> <svg class="w-5 h-5 pointer-events-none" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" /></svg> </button> <button title="${translations[currentLang]?.['action_delete'] || 'Supprimer'}" data-action="delete" data-category-id="${cat.id}" data-category-name="${cat.titre}" aria-label="${translations[currentLang]?.['action_delete'] || 'Supprimer'}" class="p-1 text-red-500 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 rounded-full hover:bg-red-50"> <svg class="w-5 h-5 pointer-events-none" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg> </button> </div>`;
        card.appendChild(footer); grid.appendChild(card);
    });
    container.appendChild(grid);
}

/** Charge et affiche les RDV pour une catégorie spécifique */
async function loadCategoryAppointments(categoryId, categoryName) {
    const container = document.getElementById('categories-content'); if (!container) return; const currentLang = document.documentElement.lang || 'fr'; container.innerHTML = `<div class="text-center py-10 text-gray-500">Chargement RDV pour ${categoryName}...</div>`;
    try {
        const response = await fetch(`/api/appointments?category_id=${categoryId}`, { /* headers */ }); if (!response.ok) throw new Error(`Erreur HTTP ${response.status}`); const result = await response.json();
        if (result.success && result.appointments) {
            container.innerHTML = ''; const backButton = document.createElement('button'); backButton.id = 'back-to-categories-btn'; backButton.className = 'back-button'; const backText = translations[currentLang]?.['back_to_categories'] || 'Retour'; backButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" /></svg> ${backText}`; backButton.addEventListener('click', loadCategories); container.appendChild(backButton);
            const title = document.createElement('h1'); title.className = 'text-2xl md:text-3xl font-bold text-gray-900 mb-6'; let titleText = translations[currentLang]?.['category_appointments_title'] || 'RDV pour : {categoryName}'; title.textContent = titleText.replace('{categoryName}', categoryName); container.appendChild(title);
            const listContainer = document.createElement('div'); listContainer.className = 'dashboard-list-section'; const listElement = document.createElement('ul'); listElement.id = 'category-appointments-list'; listElement.className = 'dashboard-list'; listContainer.appendChild(listElement); container.appendChild(listContainer); renderList(listElement, result.appointments, 'appointments');
        } else { throw new Error(result.message || "Erreur récupération RDV."); }
    } catch (error) { console.error(`Erreur chargement RDV cat ${categoryId}:`, error); container.innerHTML = `<div class="text-center py-10 text-red-600">Erreur chargement RDV.</div>`; }
}

/** Charge et affiche les catégories */
async function loadCategories() {
    const container = document.getElementById('categories-content'); if (!container) return; container.innerHTML = '<div class="text-center py-10 text-gray-500">Chargement catégories...</div>';
    try {
        const response = await fetch('/api/categories', { /* headers */ }); if (!response.ok) throw new Error(`Erreur HTTP ${response.status} (${response.statusText}) appel ${response.url}`); const result = await response.json();
        if (result.success && result.categories) { renderCategoryCards(container, result.categories); }
        else { throw new Error(result.message || "Erreur récupération catégories."); }
    } catch (error) { console.error("Erreur loadCategories:", error); const currentLang = document.documentElement.lang || 'fr'; const errorText = translations[currentLang]?.['no_categories_found'] || 'Erreur chargement catégories.'; container.innerHTML = `<div class="text-center py-10 text-red-600">${errorText}</div>`; }
}

/** Charge et affiche les KPIs + Graphique du Dashboard */
async function loadDashboardData() {
    console.log("Loading Dashboard Data...");
    const appointmentsListEl = document.getElementById('today-appointments-list'); const tasksListEl = document.getElementById('today-tasks-list'); const overdueTasksEl = document.getElementById('stat-overdue-tasks'); const appointmentsWeekEl = document.getElementById('stat-appointments-week'); const chartCanvas = document.getElementById('progress-chart');
    if (appointmentsListEl) appointmentsListEl.innerHTML = '<li class="dashboard-list-empty">Chargement...</li>'; if (tasksListEl) tasksListEl.innerHTML = '<li class="dashboard-list-empty">Chargement...</li>'; if (overdueTasksEl) overdueTasksEl.textContent = '-'; if (appointmentsWeekEl) appointmentsWeekEl.textContent = '-';
    try {
        const response = await fetch('/api/dashboard/data', { /* headers */ }); if (!response.ok) throw new Error(`Erreur HTTP ${response.status}`); const result = await response.json();
        if (result.success && result.data) {
            const data = result.data; console.log("Dashboard data received:", data);
            renderList(appointmentsListEl, data.appointmentsToday, 'appointments'); renderList(tasksListEl, data.tasksDueToday, 'tasks');
            if (overdueTasksEl) { overdueTasksEl.textContent = data.overdueTasksCount ?? '-'; overdueTasksEl.classList.toggle('danger', (data.overdueTasksCount ?? 0) > 0); }
            if (appointmentsWeekEl) { appointmentsWeekEl.textContent = data.appointmentsWeekCount ?? '-'; }
            if (chartCanvas && typeof Chart !== 'undefined') { const ctx = chartCanvas.getContext('2d'); if (progressChartInstance) progressChartInstance.destroy(); const labels = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']; const chartData = data.weeklyProgressData || Array(7).fill(0); progressChartInstance = new Chart(ctx, { type: 'bar', data: { labels: labels, datasets: [{ label: 'Tâches complétées', data: chartData, backgroundColor: 'rgba(79, 70, 229, 0.6)', borderColor: 'rgba(79, 70, 229, 1)', borderWidth: 1 }] }, options: { scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }, responsive: true, plugins: { legend: { display: false } } } }); } else { console.error("Chart canvas/library not found."); }
        } else { throw new Error(result.message || "Erreur récupération données dashboard."); }
    } catch (error) { console.error("Erreur loadDashboardData:", error); if (appointmentsListEl) appointmentsListEl.innerHTML = '<li class="dashboard-list-empty text-red-600">Erreur chargement</li>'; if (tasksListEl) tasksListEl.innerHTML = '<li class="dashboard-list-empty text-red-600">Erreur chargement</li>'; }
}

// --- Fonctions Modale Création Catégorie ---
const createCategoryModal = document.getElementById('create-category-modal'); const createCategoryForm = document.getElementById('create-category-form'); const cancelCreateCategoryBtn = document.getElementById('cancel-create-category-btn'); const createCategoryErrorElement = document.getElementById('create-category-error');
function showCreateCategoryModal() { if (createCategoryModal) { createCategoryForm?.reset(); if(createCategoryErrorElement) createCategoryErrorElement.textContent = ''; createCategoryModal.classList.add('active'); createCategoryForm?.querySelector('input[name="titre"]')?.focus(); } else { console.error("Modal 'create-category-modal' not found."); } }
function hideCreateCategoryModal() { if (createCategoryModal) { createCategoryModal.classList.remove('active'); } }
// --- Fin Fonctions Modale Création Catégorie ---

// --- Fonctions Modale Création Tâche ---
const createTaskModal = document.getElementById('create-task-modal'); const createTaskForm = document.getElementById('create-task-form'); const cancelCreateTaskBtn = document.getElementById('cancel-create-task-btn'); const createTaskErrorElement = document.getElementById('create-task-error');
function showCreateTaskModal() { if (createTaskModal) { createTaskForm?.reset(); if(createTaskErrorElement) createTaskErrorElement.textContent = ''; createTaskModal.classList.add('active'); createTaskForm?.querySelector('input[name="titre"]')?.focus(); } else { console.error("Modal 'create-task-modal' not found."); } }
function hideCreateTaskModal() { if (createTaskModal) { createTaskModal.classList.remove('active'); } }
// --- Fin Fonctions Modale Création Tâche ---


// --- Fonctions Modale Logout ---
const logoutModal = document.getElementById('logout-confirm-modal'); const confirmLogoutBtn = document.getElementById('confirm-logout-btn'); const cancelLogoutBtn = document.getElementById('cancel-logout-btn');
function showLogoutModal() { if (logoutModal) logoutModal.classList.add('active'); }
function hideLogoutModal() { if (logoutModal) logoutModal.classList.remove('active'); }
// --- Fin Fonctions Modale Logout ---


// --- Initialisation et Gestion Navigation ---
document.addEventListener('DOMContentLoaded', () => {
    console.log('Dashboard JS loaded');
    // Références éléments
    const sidebarNav = document.querySelector('aside nav'); const mainContentContainer = document.querySelector('main'); const userNameElement = document.getElementById('user-name-display'); const userRoleElement = document.getElementById('user-role-display');
    const userProfileTrigger = document.getElementById('user-profile-trigger'); const userProfileDropdown = document.getElementById('user-profile-dropdown'); const headerLogoutBtn = document.getElementById('header-logout-btn');
    const createTaskBtn = document.getElementById('create-task-btn'); // Bouton dans la section Tâches

    // Affichage infos user
    try { const storedUser = localStorage.getItem('loggedInUser'); if (storedUser) { const userData = JSON.parse(storedUser); if (userNameElement && userData.name) userNameElement.textContent = userData.name; if (userRoleElement && userData.role) userRoleElement.textContent = userData.role; } else { console.log('No user data found.'); } } catch (error) { console.error('Error getting user data:', error); }

    // Fonction showSection
    function showSection(sectionId) {
        console.log(`Showing section: ${sectionId}`); let sectionFound = false; mainContentContainer?.querySelectorAll('.main-section').forEach(section => section.classList.remove('active')); const targetSection = document.getElementById(`${sectionId}-content`);
        if (targetSection) { targetSection.classList.add('active'); sectionFound = true; } else { const fallbackSection = document.getElementById('dashboard-content'); if (fallbackSection) { fallbackSection.classList.add('active'); sectionId = 'dashboard'; sectionFound = true; window.location.hash = sectionId; } }
        if(sectionFound) {
            sidebarNav?.querySelectorAll('.sidebar-link').forEach(link => { link.classList.remove('active'); if (link.getAttribute('href') === `#${sectionId}`) { link.classList.add('active'); } }); const activeSection = document.getElementById(`${sectionId}-content`);
            // Ne pas mettre à jour H1 pour categories car géré dynamiquement
            if (sectionId !== 'categories') { const mainTitleElement = activeSection?.querySelector('h1[data-translate-key]'); if (mainTitleElement) { const titleKey = `${sectionId}_section_title`; mainTitleElement.dataset.translateKey = titleKey; try { if (typeof setLanguage === 'function') { setLanguage(document.documentElement.lang || 'fr'); } else { console.warn("setLanguage not available."); } } catch (e) { console.error("Error calling setLanguage:", e); } } else { console.warn(`H1 title not found in section: ${sectionId}-content`); } }
            // Charger les données spécifiques à la section
            if (sectionId === 'dashboard') { loadDashboardData(); }
            else if (sectionId === 'categories') { loadCategories(); }
            // else if (sectionId === 'tasks') { loadTasks(); } // TODO: Appeler la fonction pour charger les tâches
            // else if (sectionId === 'appointments') { loadAllAppointments(); } // TODO: Appeler la fonction pour charger tous les RDV
            // else if (sectionId === 'profile') { loadProfile(); } // TODO: Appeler la fonction pour charger le profil
        }
    }

    // Listeners navigation
    if (sidebarNav) { sidebarNav.addEventListener('click', (event) => { const link = event.target.closest('a.sidebar-link'); if (link && link.getAttribute('href')?.startsWith('#')) { event.preventDefault(); const sectionId = link.getAttribute('href').substring(1); if (window.location.hash !== `#${sectionId}`) { window.location.hash = sectionId; } else { showSection(sectionId); document.getElementById(`${sectionId}-content`)?.scrollTo(0, 0); } } }); }
    window.addEventListener('hashchange', () => { const sectionId = window.location.hash ? window.location.hash.substring(1) : 'dashboard'; showSection(sectionId); }); const initialSectionId = window.location.hash ? window.location.hash.substring(1) : 'dashboard'; showSection(initialSectionId);

    // Listener Actions Catégories
    const categoriesContent = document.getElementById('categories-content');
    if (categoriesContent) {
        categoriesContent.addEventListener('click', (event) => {
             const button = event.target.closest('button[data-action]');
             if (!button) return; // Ignorer si ce n'est pas un bouton d'action de carte
             const action = button.dataset.action; const categoryId = button.dataset.categoryId; const categoryName = button.dataset.categoryName;
             switch (action) {
                case 'view': console.log(`Action: Voir les RDV pour catégorie ${categoryId} (${categoryName})`); loadCategoryAppointments(categoryId, categoryName); break;
                case 'edit': console.log(`Action: Modifier catégorie ${categoryId}`); alert(`Modifier catégorie ${categoryId} (à implémenter)`); break;
                case 'delete': console.log(`Action: Supprimer catégorie ${categoryId}`); if (confirm(`Êtes-vous sûr de vouloir supprimer la catégorie "${categoryName}" et tous ses rendez-vous associés ?`)) { alert(`Supprimer catégorie ${categoryId} (logique backend à implémenter)`); } break;
             }
        });
    }

     // --- Gestion Dropdown Profil ---
     if (userProfileTrigger && userProfileDropdown) {
        userProfileTrigger.addEventListener('click', (event) => { event.stopPropagation(); userProfileDropdown.classList.toggle('hidden'); });
        document.addEventListener('click', (event) => { if (!userProfileDropdown.classList.contains('hidden') && !userProfileTrigger.contains(event.target) && !userProfileDropdown.contains(event.target)) { userProfileDropdown.classList.add('hidden'); } });
        const profileLink = userProfileDropdown.querySelector('a[href="#profile"]'); if (profileLink) { profileLink.addEventListener('click', () => { userProfileDropdown.classList.add('hidden'); }); }
        if (headerLogoutBtn) { headerLogoutBtn.addEventListener('click', () => { userProfileDropdown.classList.add('hidden'); showLogoutModal(); }); }
    }

     // --- Gestion Modale Logout ---
     if (confirmLogoutBtn) { confirmLogoutBtn.addEventListener('click', () => { localStorage.removeItem('loggedInUser'); window.location.href = 'index.html'; hideLogoutModal(); }); } if (cancelLogoutBtn) { cancelLogoutBtn.addEventListener('click', hideLogoutModal); } if (logoutModal) { logoutModal.addEventListener('click', (event) => { if (event.target === logoutModal) { hideLogoutModal(); } }); }

     // === Listeners pour la modale de création de catégorie ===
     if (cancelCreateCategoryBtn) { cancelCreateCategoryBtn.addEventListener('click', hideCreateCategoryModal); }
     if (createCategoryModal) { createCategoryModal.addEventListener('click', (event) => { if (event.target === createCategoryModal) { hideCreateCategoryModal(); } }); }
     if (createCategoryForm) {
         createCategoryForm.addEventListener('submit', async (event) => {
             event.preventDefault(); const submitButton = createCategoryForm.querySelector('button[type="submit"]'); const originalButtonTextKey = "category_form_create"; const currentLang = document.documentElement.lang || 'fr'; const originalButtonText = translations[currentLang]?.[originalButtonTextKey] || "Créer";
             submitButton.disabled = true; submitButton.textContent = "Création..."; if(createCategoryErrorElement) createCategoryErrorElement.textContent = '';
             const formData = new FormData(createCategoryForm); const categoryData = Object.fromEntries(formData.entries()); categoryData.duree = categoryData.duree ? parseInt(categoryData.duree, 10) : null;
             console.log("Données création catégorie:", categoryData);
             try {
                 const response = await fetch('/api/categories', { method: 'POST', headers: { 'Content-Type': 'application/json', /* Auth */ }, body: JSON.stringify(categoryData) }); const result = await response.json();
                 if (response.ok && result.success) { console.log("Catégorie créée:", result.category); hideCreateCategoryModal(); loadCategories(); } // Recharger
                 else { console.error("Erreur création:", result.message); if(createCategoryErrorElement) createCategoryErrorElement.textContent = result.message || "Erreur."; }
             } catch (error) { console.error("Erreur réseau création:", error); if(createCategoryErrorElement) createCategoryErrorElement.textContent = "Erreur réseau.";
             } finally { submitButton.disabled = false; submitButton.textContent = originalButtonText; }
         });
     }
     // =====================================================

     // === Listeners pour la modale de création de TÂCHE ===
     if (createTaskBtn) { createTaskBtn.addEventListener('click', showCreateTaskModal); }
     if (cancelCreateTaskBtn) { cancelCreateTaskBtn.addEventListener('click', hideCreateTaskModal); }
     if (createTaskModal) { createTaskModal.addEventListener('click', (event) => { if (event.target === createTaskModal) { hideCreateTaskModal(); } }); }
     if (createTaskForm) {
         createTaskForm.addEventListener('submit', async (event) => {
             event.preventDefault(); const submitButton = createTaskForm.querySelector('button[type="submit"]'); const originalButtonTextKey = "task_form_create"; const currentLang = document.documentElement.lang || 'fr'; const originalButtonText = translations[currentLang]?.[originalButtonTextKey] || "Créer la tâche";
             submitButton.disabled = true; submitButton.textContent = "Création..."; if(createTaskErrorElement) createTaskErrorElement.textContent = '';
             const formData = new FormData(createTaskForm); const taskData = Object.fromEntries(formData.entries()); taskData.priorite = taskData.priorite ? parseInt(taskData.priorite, 10) : 2;
             console.log("Données création tâche:", taskData);
             try {
                 const response = await fetch('/api/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json', /* Auth */ }, body: JSON.stringify(taskData) }); const result = await response.json();
                 if (response.ok && result.success) { console.log("Tâche créée:", result.task); hideCreateTaskModal(); /* TODO: loadTasks(); */ alert("Tâche créée ! (Rafraîchissement TODO)"); }
                 else { console.error("Erreur création tâche:", result.message); if(createTaskErrorElement) createTaskErrorElement.textContent = result.message || "Erreur."; }
             } catch (error) { console.error("Erreur réseau création tâche:", error); if(createTaskErrorElement) createTaskErrorElement.textContent = "Erreur réseau.";
             } finally { submitButton.disabled = false; submitButton.textContent = originalButtonText; }
         });
     }
     // ===========================================================

}); // Fin de DOMContentLoaded
