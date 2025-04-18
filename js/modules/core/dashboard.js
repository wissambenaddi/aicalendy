/**
 * Fichier : js/modules/core/dashboard.js
 * Description : Gère la logique principale du tableau de bord (utilise les handlers spécifiques).
 */

// Importer les traductions et setLanguage (depuis le dossier parent)
import { translations, setLanguage } from '../translator.js'; // Chemin OK: remonte d'un niveau
// Importer les utilitaires et les fonctions API (depuis le même dossier core)
import * as utils from './utils.js'; // Chemin OK: même dossier
import * as api from './api.js'; // Chemin OK: même dossier
// Importer les handlers spécifiques (depuis le dossier parent)
import * as categoryHandler from '../categoryHandler.js'; // Chemin OK: remonte d'un niveau
import * as taskHandler from '../taskHandler.js'; // Chemin OK: remonte d'un niveau
import * as appointmentHandler from '../appointmentHandler.js'; // Chemin OK: remonte d'un niveau
import * as profileHandler from '../profileHandler.js'; // Chemin OK: remonte d'un niveau

let progressChartInstance = null; // Référence globale au graphique Chart.js (non utilisé actuellement)

// --- Fonctions d'Affichage Dynamique (Génériques ou pour Dashboard Principal) ---

/**
 * Affiche une liste de RDV ou Tâches dans un élément UL donné.
 * NOTE: Exportée pour être utilisée par les handlers.
 * @param {HTMLElement|null} listElement - L'élément UL où insérer la liste.
 * @param {Array|null} items - Le tableau d'objets (rendez-vous ou tâches).
 * @param {'appointments' | 'tasks'} type - Le type d'éléments.
 */
export function renderList(listElement, items, type) { // <<< EXPORT AJOUTÉ
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
        emptyKey = listElement.closest('#tasks-content') ? 'no_tasks_found' : 'dashboard_no_tasks_today';
    }

    // Générer les éléments <li> si la liste n'est pas vide
    if (items && items.length > 0) {
        isEmpty = false;
        items.forEach(item => {
            const li = document.createElement('li');
            li.className = 'dashboard-list-item';
            const isAppointment = type === 'appointments';
            // Ajouter classe si tâche en retard
            if (!isAppointment && item.date_echeance && item.date_echeance < Date.now() && !item.est_complete) {
                 li.classList.add('dashboard-item-overdue');
            }

            const titleSpan = document.createElement('span');
            titleSpan.className = 'dashboard-item-title';
            titleSpan.textContent = item.titre || 'Sans titre';
            titleSpan.title = item.titre || ''; // Tooltip

            const dateSpan = document.createElement('span');
            dateSpan.className = 'dashboard-item-date';
            const timestamp = isAppointment ? item.heure_debut : item.date_echeance;
            const formatOptions = isAppointment ? { dateStyle: 'short', timeStyle: 'short' } : { dateStyle: 'short' };
            // Utilisation de la fonction importée depuis utils.js
            dateSpan.textContent = utils.formatDateTime(timestamp, currentLang, formatOptions);

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

/** Charge et affiche les KPIs + Graphique du Dashboard */
async function loadDashboardData() {
    console.log("Loading Dashboard Data..."); // DEBUG LOG
    const appointmentsListEl = document.getElementById('today-appointments-list');
    const tasksListEl = document.getElementById('today-tasks-list');
    const overdueTasksEl = document.getElementById('stat-overdue-tasks');
    const appointmentsWeekEl = document.getElementById('stat-appointments-week');
    const recentTasksContainer = document.getElementById('recent-tasks-list-container'); // Nouveau conteneur

    // Initialiser l'affichage pendant le chargement
    if (appointmentsListEl) appointmentsListEl.innerHTML = '<li class="dashboard-list-empty">Chargement...</li>';
    if (tasksListEl) tasksListEl.innerHTML = '<li class="dashboard-list-empty">Chargement...</li>';
    if (overdueTasksEl) overdueTasksEl.textContent = '-';
    if (appointmentsWeekEl) appointmentsWeekEl.textContent = '-';
    if (recentTasksContainer) recentTasksContainer.innerHTML = `<p class="text-sm text-gray-500 p-4 italic">Chargement des tâches...</p>`;


    try {
        // Utilisation de la fonction importée depuis api.js
        const data = await api.fetchDashboardData();
        console.log("Dashboard data received:", data); // DEBUG LOG

        // Affichage des listes Aujourd'hui (utilise la fonction renderList locale)
        renderList(appointmentsListEl, data.appointmentsToday, 'appointments');
        renderList(tasksListEl, data.tasksDueToday, 'tasks');

        // Affichage des statistiques
        if (overdueTasksEl) {
            overdueTasksEl.textContent = data.overdueTasksCount ?? '-';
            overdueTasksEl.classList.toggle('danger', (data.overdueTasksCount ?? 0) > 0);
        }
        if (appointmentsWeekEl) {
            appointmentsWeekEl.textContent = data.appointmentsWeekCount ?? '-';
        }

        // Affichage de la table des tâches récentes
        if (data.recentTasks) {
            renderRecentTasksTable(data.recentTasks); // Appel de la fonction locale
        } else {
            console.warn("Aucune donnée 'recentTasks' reçue de l'API.");
             if (recentTasksContainer) recentTasksContainer.innerHTML = `<p class="text-sm text-gray-500 p-4 italic">Aucune tâche récente ou à venir.</p>`;
        }

        // Logique du graphique (commentée ou supprimée car remplacée)
        /*
        const chartCanvas = document.getElementById('progress-chart');
        if (chartCanvas && typeof Chart !== 'undefined') {
            const ctx = chartCanvas.getContext('2d');
            if (progressChartInstance) { progressChartInstance.destroy(); }
            const labels = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
            const chartData = data.weeklyProgressData || Array(7).fill(0);
            progressChartInstance = new Chart(ctx, { // ... options ... });
        }
        */

    } catch (error) {
        console.error("Erreur loadDashboardData:", error);
        if (appointmentsListEl) appointmentsListEl.innerHTML = '<li class="dashboard-list-empty text-red-600">Erreur chargement</li>';
        if (tasksListEl) tasksListEl.innerHTML = '<li class="dashboard-list-empty text-red-600">Erreur chargement</li>';
        if (recentTasksContainer) recentTasksContainer.innerHTML = `<p class="text-sm text-red-600 p-4 italic">Erreur chargement tâches récentes.</p>`;
    }
}

/** Fonction pour afficher le tableau des tâches recentes */
function renderRecentTasksTable(tasks) {
    const container = document.getElementById('recent-tasks-list-container');
    if (!container) { console.error("Conteneur '#recent-tasks-list-container' non trouvé."); return; }
    container.innerHTML = ''; // Vider le conteneur
    const currentLang = document.documentElement.lang || 'fr';

    if (!tasks || tasks.length === 0) {
        container.innerHTML = `<p class="text-sm text-gray-500 p-4 italic" data-translate-key="dashboard_no_recent_tasks">Aucune tâche récente ou à venir.</p>`;
        setLanguage(currentLang); // Appliquer traduction
        return;
    }

    const table = document.createElement('table');
    table.className = 'w-full text-sm text-left text-gray-500 recent-tasks-table';
    const thead = table.createTHead();
    thead.className = "text-xs text-gray-700 uppercase bg-gray-50";
    const headerRow = thead.insertRow();
    const headers = [ { key: 'task_col_title', text: 'Tâche' }, { key: 'task_col_due_date', text: 'Échéance' }, { key: 'task_col_status', text: 'Statut' } ];
    headers.forEach(header => { const th = document.createElement('th'); th.scope = 'col'; th.className = 'px-4 py-3'; th.dataset.translateKey = header.key; th.textContent = header.text; headerRow.appendChild(th); });

    const tbody = table.createTBody();
    const now = Date.now();

    tasks.forEach(task => {
        const row = tbody.insertRow(); row.className = 'bg-white border-b hover:bg-gray-50';
        const cellTitle = row.insertCell(); cellTitle.className = 'px-4 py-3 font-medium text-gray-900 whitespace-nowrap'; cellTitle.textContent = task.titre;
        const cellDueDate = row.insertCell(); cellDueDate.className = 'px-4 py-3'; cellDueDate.textContent = task.date_echeance ? utils.formatDate(task.date_echeance, currentLang) : '-';
        const cellStatus = row.insertCell(); cellStatus.className = 'px-4 py-3'; const statusBadge = document.createElement('span'); statusBadge.className = 'status-badge-simple px-2 py-0.5 rounded-full text-xs font-medium';
        let statusText = ''; let statusClass = '';
        if (task.est_complete === 1 || task.statut === 'done') { statusText = translations[currentLang]?.task_form_status_done || 'Terminé'; statusClass = 'status-done-simple'; }
        else if (task.date_echeance && task.date_echeance < now) { statusText = translations[currentLang]?.task_status_overdue || 'En retard'; statusClass = 'status-overdue-simple'; }
        else { statusText = task.statut === 'inprogress' ? (translations[currentLang]?.task_form_status_inprogress || 'En cours') : (translations[currentLang]?.task_status_pending || 'En attente'); statusClass = task.statut === 'inprogress' ? 'status-inprogress-simple' : 'status-pending-simple'; }
        statusBadge.textContent = statusText; statusBadge.classList.add(statusClass); cellStatus.appendChild(statusBadge);
    });
    container.appendChild(table);
    setLanguage(currentLang); // Appliquer traduction si clés ajoutées
}


// --- Fonctions Modales (Génériques : Logout) ---
const logoutModal = document.getElementById('logout-confirm-modal');
const confirmLogoutBtn = document.getElementById('confirm-logout-btn');
const cancelLogoutBtn = document.getElementById('cancel-logout-btn');
function showLogoutModal() { if (logoutModal) logoutModal.classList.add('active'); }
function hideLogoutModal() { if (logoutModal) logoutModal.classList.remove('active'); }
// --- Fin Fonctions Modales ---


// --- Initialisation et Gestion Navigation ---
document.addEventListener('DOMContentLoaded', () => {
    console.log('Dashboard Core JS loaded - Vérification initiale'); // DEBUG LOG
    // Références éléments (garder celles utilisées globalement)
    const sidebarNav = document.querySelector('aside nav');
    const mainContentContainer = document.querySelector('main');
    const userNameElement = document.getElementById('user-name-display');
    const userRoleElement = document.getElementById('user-role-display');
    const userProfileTrigger = document.getElementById('user-profile-trigger');
    const userProfileDropdown = document.getElementById('user-profile-dropdown');
    const headerLogoutBtn = document.getElementById('header-logout-btn');
    // Les refs spécifiques aux modales/formulaires sont gérées par les handlers

    // Affichage infos user
    try { const storedUser = localStorage.getItem('loggedInUser'); if (storedUser) { const userData = JSON.parse(storedUser); if (userNameElement && userData.name) userNameElement.textContent = userData.name; if (userRoleElement && userData.role) userRoleElement.textContent = userData.role; } else { console.log('No user data found.'); } } catch (error) { console.error('Error getting user data:', error); }

    // Fonction showSection (appelle les handlers)
    function showSection(sectionId) {
        console.log(`// DEBUG LOG: showSection appelée avec sectionId: ${sectionId}`); // DEBUG LOG
        // S'assurer que mainContentContainer est défini
        if (!mainContentContainer) {
            console.error("// DEBUG LOG: Erreur: mainContentContainer n'est pas trouvé."); // DEBUG LOG
            return;
        }
        let sectionFound = false;
        const targetSectionId = `${sectionId}-content`;
        const targetSection = document.getElementById(targetSectionId);
        console.log(`// DEBUG LOG: Recherche de l'élément avec ID: ${targetSectionId}`, targetSection); // DEBUG LOG

        if (targetSection) {
             console.log(`// DEBUG LOG: Section ${sectionId} trouvée. Masquage des autres sections...`); // DEBUG LOG
             mainContentContainer.querySelectorAll('.main-section').forEach(section => {
                 section.classList.remove('active');
             });
             console.log(`// DEBUG LOG: Affichage de la section ${sectionId}...`); // DEBUG LOG
             targetSection.classList.add('active');
             sectionFound = true;
        } else {
            console.warn(`// DEBUG LOG: Section ${targetSectionId} non trouvée ! Fallback sur dashboard.`); // DEBUG LOG
            const fallbackSection = document.getElementById('dashboard-content');
            if (fallbackSection) {
                mainContentContainer.querySelectorAll('.main-section').forEach(section => section.classList.remove('active'));
                fallbackSection.classList.add('active');
                sectionId = 'dashboard'; // Mettre à jour l'ID de section actif
                sectionFound = true;
                console.warn(`// DEBUG LOG: Affichage du dashboard par défaut.`); // DEBUG LOG
            } else {
                 console.error("// DEBUG LOG: Erreur: Ni la section demandée ni le dashboard par défaut n'ont été trouvés."); // DEBUG LOG
                 return;
            }
        }

        if(sectionFound) {
            // Mettre à jour le lien actif dans la sidebar
            console.log(`// DEBUG LOG: Mise à jour du lien actif pour #${sectionId}`); // DEBUG LOG
            sidebarNav?.querySelectorAll('.sidebar-link').forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${sectionId}`) {
                    link.classList.add('active');
                }
            });

            // Traduire le titre principal de la section
            const activeSection = document.getElementById(`${sectionId}-content`);
            if (sectionId !== 'categories') { // Le titre des catégories est dans renderCategoryCards
                const mainTitleElement = activeSection?.querySelector('h1[data-translate-key]');
                if (mainTitleElement) {
                    const titleKey = `${sectionId}_section_title`;
                    mainTitleElement.dataset.translateKey = titleKey; // S'assurer que la clé est correcte
                    setLanguage(document.documentElement.lang || 'fr'); // Appeler pour traduire
                } else {
                    console.warn(`// DEBUG LOG: H1 title not found in section: ${sectionId}-content`); // DEBUG LOG
                }
            } else {
                 // S'assurer que la traduction est appliquée même pour les catégories si on change de langue
                 setLanguage(document.documentElement.lang || 'fr');
            }

            // Charger les données spécifiques à la section via les handlers
            console.log(`// DEBUG LOG: Appel du chargement des données pour la section: ${sectionId}`); // DEBUG LOG
            if (sectionId === 'dashboard') { loadDashboardData(); }
            else if (sectionId === 'categories') { categoryHandler.loadCategories(); }
            else if (sectionId === 'tasks') { taskHandler.loadTasks(); }
            else if (sectionId === 'appointments') { appointmentHandler.loadAllAppointments(); }
            else if (sectionId === 'profile') { profileHandler.loadProfileData(); }
        } else {
             console.error(`// DEBUG LOG: sectionFound est false pour ${sectionId}, impossible de continuer.`); // DEBUG LOG
        }
    }

    // Listeners navigation (reste ici)
     console.log("// DEBUG LOG: Attachement du listener 'click' à sidebarNav"); // DEBUG LOG
    if (sidebarNav) {
        sidebarNav.addEventListener('click', (event) => {
            const link = event.target.closest('a.sidebar-link');
            if (link && link.getAttribute('href')?.startsWith('#')) {
                event.preventDefault();
                const sectionId = link.getAttribute('href').substring(1);
                console.log(`// DEBUG LOG: Clic sidebar détecté pour #${sectionId}`); // DEBUG LOG
                window.location.hash = sectionId;
                 // Si le hash ne change pas (clic sur le lien déjà actif), forcer l'appel
                 if (window.location.hash === `#${sectionId}`) {
                     console.log(`// DEBUG LOG: Hash inchangé, appel direct de showSection pour #${sectionId}`); // DEBUG LOG
                     showSection(sectionId);
                     document.getElementById(`${sectionId}-content`)?.scrollTo(0, 0); // Remonter en haut
                 }
            }
        });
    } else {
        console.error("// DEBUG LOG: sidebarNav non trouvé pour attacher le listener 'click'."); // DEBUG LOG
    }

    console.log("// DEBUG LOG: Attachement du listener 'hashchange' à window"); // DEBUG LOG
    window.addEventListener('hashchange', () => {
        const sectionId = window.location.hash ? window.location.hash.substring(1) : 'dashboard';
        console.log(`// DEBUG LOG: hashchange détecté, nouvelle section: ${sectionId}`); // DEBUG LOG
        showSection(sectionId);
    });
    // Afficher la section initiale basée sur le hash ou le dashboard par défaut
    const initialSectionId = window.location.hash ? window.location.hash.substring(1) : 'dashboard';
    console.log(`// DEBUG LOG: Section initiale: ${initialSectionId}`); // DEBUG LOG
    showSection(initialSectionId);

    // --- Initialisation des listeners spécifiques aux sections ---
    // Ces fonctions attachent les listeners aux éléments DANS leurs sections respectives
    console.log("// DEBUG LOG: Appel des initEventListeners pour les handlers..."); // DEBUG LOG
    categoryHandler.initCategoryEventListeners();
    taskHandler.initTaskEventListeners();
    appointmentHandler.initAppointmentEventListeners();
    profileHandler.initProfileEventListeners();


     // --- Gestion Dropdown Profil (reste ici car dans header) ---
     if (userProfileTrigger && userProfileDropdown) {
        console.log("Attaching profile dropdown listeners...");
        userProfileTrigger.addEventListener('click', (event) => { event.stopPropagation(); userProfileDropdown.classList.toggle('hidden'); userProfileTrigger.setAttribute('aria-expanded', !userProfileDropdown.classList.contains('hidden')); });
        document.addEventListener('click', (event) => { if (!userProfileDropdown.classList.contains('hidden') && !userProfileTrigger.contains(event.target) && !userProfileDropdown.contains(event.target)) { userProfileDropdown.classList.add('hidden'); userProfileTrigger.setAttribute('aria-expanded', 'false');} });
        const profileLink = userProfileDropdown.querySelector('a[href="#profile"]'); if (profileLink) { profileLink.addEventListener('click', () => { userProfileDropdown.classList.add('hidden'); userProfileTrigger.setAttribute('aria-expanded', 'false'); /* La navigation par hash s'en occupe */ }); }
        if (headerLogoutBtn) { headerLogoutBtn.addEventListener('click', () => { userProfileDropdown.classList.add('hidden'); userProfileTrigger.setAttribute('aria-expanded', 'false'); showLogoutModal(); }); }
    } else {
         console.warn("Éléments du dropdown profil non trouvés.");
    }

     // --- Gestion Modale Logout (reste ici car global) ---
     if (confirmLogoutBtn) { confirmLogoutBtn.addEventListener('click', () => { localStorage.removeItem('loggedInUser'); window.location.href = 'index.html'; hideLogoutModal(); }); }
     if (cancelLogoutBtn) { cancelLogoutBtn.addEventListener('click', hideLogoutModal); }
     if (logoutModal) { logoutModal.addEventListener('click', (event) => { if (event.target === logoutModal) { hideLogoutModal(); } }); }

     // Les listeners pour les modales/formulaires spécifiques sont maintenant dans les handlers

    console.log("Fin de l'initialisation DOMContentLoaded."); // DEBUG LOG

}); // Fin de DOMContentLoaded
