/**
 * Fichier : js/modules/dashboard.js
 * Description : Gère la logique du tableau de bord : navigation, affichage infos user,
 * KPIs, affichage dynamique des catégories, tâches, rendez-vous,
 * gestion des modales (logout, création catégorie, création tâche, action tâche, création RDV, détails RDV, édition RDV), dropdown profil.
 */

// Importer les traductions pour les messages et textes dynamiques
// Assurez-vous que translator.js exporte bien l'objet 'translations'
import { translations, setLanguage } from './translator.js'; // Importe setLanguage aussi

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
// Helper pour formater un timestamp en YYYY-MM-DD pour input[type=date]
function formatTimestampForDateInput(timestamp) {
    if (!timestamp) return '';
    try {
        const date = new Date(timestamp);
        if (isNaN(date.getTime())) return '';
        // Attention au fuseau horaire ! Pour l'instant, on prend l'heure locale.
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    } catch(e) { console.error("Error formatting timestamp for date input:", e); return ''; }
}
// Helper pour formater un timestamp en HH:MM pour input[type=time]
function formatTimestampForTimeInput(timestamp) {
     if (!timestamp) return '';
     try {
         const date = new Date(timestamp);
         if (isNaN(date.getTime())) return '';
         const hours = date.getHours().toString().padStart(2, '0');
         const minutes = date.getMinutes().toString().padStart(2, '0');
         return `${hours}:${minutes}`;
     } catch(e) { console.error("Error formatting timestamp for time input:", e); return ''; }
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
        // Utiliser une clé spécifique si on est dans la section tâches principale
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
            // Afficher date ET heure pour RDV, juste date pour tâches
            const formatOptions = isAppointment
                ? { dateStyle: 'short', timeStyle: 'short' }
                : { dateStyle: 'short' };
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
    if (!container) { console.error("Conteneur de catégories non trouvé."); return; }
    const currentLang = document.documentElement.lang || 'fr';
    container.innerHTML = ''; // Vider

    // --- Header Section Catégories ---
    const title = document.createElement('h1'); title.className = 'text-2xl md:text-3xl font-bold text-gray-900'; title.dataset.translateKey = 'categories_section_title'; title.textContent = translations[currentLang]?.['categories_section_title'] || 'Mes Catégories';
    const createBtn = document.createElement('button'); createBtn.id = 'create-category-btn'; createBtn.className = 'inline-flex items-center px-4 py-2 bg-indigo-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-indigo-700 active:bg-indigo-800 focus:outline-none focus:border-indigo-800 focus:ring focus:ring-indigo-300 disabled:opacity-25 transition'; const createBtnText = translations[currentLang]?.['dashboard_create_category'] || 'Créer'; createBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4 mr-2 -ml-1"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg><span data-translate-key="dashboard_create_category">${createBtnText}</span>`;
    createBtn.addEventListener('click', showCreateCategoryModal); // Listener ajouté ici
    const headerDiv = document.createElement('div'); headerDiv.className = 'flex justify-between items-center mb-6'; headerDiv.appendChild(title); headerDiv.appendChild(createBtn);
    container.appendChild(headerDiv); // Ajouter le header d'abord
    // --- Fin Header ---

    // --- Grid ou Message Vide ---
    if (!categories || categories.length === 0) {
        const emptyText = translations[currentLang]?.['no_categories_found'] || 'Aucune catégorie créée.';
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'text-center py-10 text-gray-500';
        emptyDiv.textContent = emptyText;
        container.appendChild(emptyDiv); // Ajouter le message vide après le header
    } else {
        // Créer et ajouter la grille avec les cartes
        const grid = document.createElement('div'); grid.className = 'category-grid';
        categories.forEach(cat => {
            const card = document.createElement('div'); card.className = 'category-card'; card.dataset.categoryId = cat.id; card.dataset.categoryName = cat.titre;
            const colorBar = document.createElement('div'); colorBar.className = 'category-card-color-bar'; if (cat.couleur) colorBar.style.backgroundColor = cat.couleur; card.appendChild(colorBar);
            const content = document.createElement('div'); content.className = 'category-card-content';
            const iconHTML = cat.icone ? `<span class="text-xl mr-2">${cat.icone}</span>` : '';
            content.innerHTML = `<h3 class="category-card-title flex items-center">${iconHTML}${cat.titre || 'Sans titre'}</h3> <p class="text-xs text-gray-500 mb-1">Dép: ${cat.departement || '-'}</p> <p class="text-xs text-gray-500 mb-2">Resp: ${cat.responsable || '-'}</p> <p class="category-card-description">${cat.description || 'Pas de description.'}</p>`; card.appendChild(content);
            const footer = document.createElement('div'); footer.className = 'category-card-footer'; const actionsText = translations[currentLang]?.['card_actions'] || 'Actions :';
            footer.innerHTML = `<span class="text-xs text-gray-500" data-translate-key="card_actions">${actionsText}</span> <div class="category-card-actions"> <button title="${translations[currentLang]?.['action_view_appointments'] || 'Voir RDV'}" data-action="view" data-category-id="${cat.id}" data-category-name="${cat.titre}" aria-label="${translations[currentLang]?.['action_view_appointments'] || 'Voir RDV'}" class="p-1 text-gray-500 hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 rounded-full hover:bg-gray-100"> <svg class="w-5 h-5 pointer-events-none" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg> </button> <button title="${translations[currentLang]?.['action_edit'] || 'Modifier'}" data-action="edit" data-category-id="${cat.id}" aria-label="${translations[currentLang]?.['action_edit'] || 'Modifier'}" class="p-1 text-gray-500 hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 rounded-full hover:bg-gray-100"> <svg class="w-5 h-5 pointer-events-none" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" /></svg> </button> <button title="${translations[currentLang]?.['action_delete'] || 'Supprimer'}" data-action="delete" data-category-id="${cat.id}" data-category-name="${cat.titre}" aria-label="${translations[currentLang]?.['action_delete'] || 'Supprimer'}" class="p-1 text-red-500 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 rounded-full hover:bg-red-50"> <svg class="w-5 h-5 pointer-events-none" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg> </button> </div>`;
            card.appendChild(footer); grid.appendChild(card);
        });
        container.appendChild(grid); // Ajouter la grille après le header
    }
}

/** Charge et affiche les RDV pour une catégorie spécifique */
async function loadCategoryAppointments(categoryId, categoryName) {
    const container = document.getElementById('categories-content'); if (!container) return; const currentLang = document.documentElement.lang || 'fr'; container.innerHTML = `<div class="text-center py-10 text-gray-500">Chargement RDV pour ${categoryName}...</div>`;
    try {
        const response = await fetch(`/api/appointments?category_id=${categoryId}`, { headers: { 'Accept': 'application/json' } }); if (!response.ok) throw new Error(`Erreur HTTP ${response.status}`); const result = await response.json();
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
        const response = await fetch('/api/categories', { headers: { 'Accept': 'application/json' } }); if (!response.ok) throw new Error(`Erreur HTTP ${response.status} (${response.statusText}) appel ${response.url}`); const result = await response.json();
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
        const response = await fetch('/api/dashboard/data', { headers: { 'Accept': 'application/json' } }); if (!response.ok) throw new Error(`Erreur HTTP ${response.status}`); const result = await response.json();
        if (result.success && result.data) {
            const data = result.data; console.log("Dashboard data received:", data);
            renderList(appointmentsListEl, data.appointmentsToday, 'appointments'); renderList(tasksListEl, data.tasksDueToday, 'tasks');
            if (overdueTasksEl) { overdueTasksEl.textContent = data.overdueTasksCount ?? '-'; overdueTasksEl.classList.toggle('danger', (data.overdueTasksCount ?? 0) > 0); }
            if (appointmentsWeekEl) { appointmentsWeekEl.textContent = data.appointmentsWeekCount ?? '-'; }
            if (chartCanvas && typeof Chart !== 'undefined') { const ctx = chartCanvas.getContext('2d'); if (progressChartInstance) progressChartInstance.destroy(); const labels = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']; const chartData = data.weeklyProgressData || Array(7).fill(0); progressChartInstance = new Chart(ctx, { type: 'bar', data: { labels: labels, datasets: [{ label: 'Tâches complétées', data: chartData, backgroundColor: 'rgba(79, 70, 229, 0.6)', borderColor: 'rgba(79, 70, 229, 1)', borderWidth: 1 }] }, options: { scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }, responsive: true, plugins: { legend: { display: false } } } }); } else { console.error("Chart canvas/library not found."); }
        } else { throw new Error(result.message || "Erreur récupération données dashboard."); }
    } catch (error) { console.error("Erreur loadDashboardData:", error); if (appointmentsListEl) appointmentsListEl.innerHTML = '<li class="dashboard-list-empty text-red-600">Erreur chargement</li>'; if (tasksListEl) tasksListEl.innerHTML = '<li class="dashboard-list-empty text-red-600">Erreur chargement</li>'; }
}

/** Génère le HTML pour la liste des tâches (sous forme de tableau). */
function renderTasksList(container, tasks) {
    if (!container) { console.error("Conteneur de liste de tâches non trouvé."); return; }
    const currentLang = document.documentElement.lang || 'fr'; container.innerHTML = '';
    if (!tasks || tasks.length === 0) { const emptyKey = 'no_tasks_found'; const emptyText = translations[currentLang]?.[emptyKey] || 'Aucune tâche à afficher.'; container.innerHTML = `<div class="tasks-empty-message">${emptyText}</div>`; return; }
    const table = document.createElement('table'); table.className = 'tasks-table w-full'; const thead = table.createTHead(); const headerRow = thead.insertRow(); const headers = ['', 'Titre', 'Échéance', 'Responsable', 'Priorité', 'Statut', 'Cat/Dept', 'Actions']; headers.forEach(text => { const th = document.createElement('th'); th.scope = 'col'; th.textContent = text; headerRow.appendChild(th); });
    const tbody = table.createTBody();
    tasks.forEach(task => {
        const row = tbody.insertRow(); row.className = task.est_complete ? 'task-completed opacity-60' : '';
        const cellCheckbox = row.insertCell(); const checkbox = document.createElement('input'); checkbox.type = 'checkbox'; checkbox.checked = task.est_complete === 1; checkbox.dataset.taskId = task.id; checkbox.dataset.taskTitle = task.titre; checkbox.className = 'task-checkbox'; checkbox.setAttribute('aria-label', `Actions pour la tâche ${task.titre}`); cellCheckbox.appendChild(checkbox);
        const cellTitle = row.insertCell(); cellTitle.textContent = task.titre; cellTitle.className = 'task-title';
        const cellDueDate = row.insertCell(); cellDueDate.textContent = formatDate(task.date_echeance, currentLang); if (task.date_echeance && task.date_echeance < Date.now() && !task.est_complete) { cellDueDate.classList.add('text-red-600', 'font-medium'); }
        row.insertCell().textContent = task.responsable || '-';
        const cellPriority = row.insertCell(); const priorityBadge = document.createElement('span'); priorityBadge.className = 'priority-badge'; let priorityText = translations[currentLang]?.['task_form_priority_medium'] || 'Moyenne'; let priorityClass = 'priority-medium'; if (task.priorite === 1) { priorityText = translations[currentLang]?.['task_form_priority_low'] || 'Basse'; priorityClass = 'priority-low'; } else if (task.priorite === 3) { priorityText = translations[currentLang]?.['task_form_priority_high'] || 'Haute'; priorityClass = 'priority-high'; } priorityBadge.textContent = priorityText; priorityBadge.classList.add(priorityClass); cellPriority.appendChild(priorityBadge);
        const cellStatus = row.insertCell(); const statusBadge = document.createElement('span'); statusBadge.className = 'status-badge'; let statusText = translations[currentLang]?.['task_form_status_todo'] || 'À faire'; let statusClass = 'status-todo'; if (task.statut === 'inprogress') { statusText = translations[currentLang]?.['task_form_status_inprogress'] || 'En cours'; statusClass = 'status-inprogress'; } else if (task.statut === 'done') { statusText = translations[currentLang]?.['task_form_status_done'] || 'Terminé'; statusClass = 'status-done'; } statusBadge.textContent = statusText; statusBadge.classList.add(statusClass); cellStatus.appendChild(statusBadge);
        row.insertCell().textContent = task.categorie_departement || '-';
        const cellActions = row.insertCell(); cellActions.className = 'task-actions'; cellActions.innerHTML = `<button title="Modifier" data-action="edit-task" data-task-id="${task.id}" class="p-1"><svg class="w-4 h-4 pointer-events-none" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" /></svg></button> <button title="Supprimer" data-action="delete-task" data-task-id="${task.id}" class="p-1 delete-btn"><svg class="w-4 h-4 pointer-events-none" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg></button>`;
    });
    container.appendChild(table);
}

/** Charge les tâches depuis l'API et les affiche */
async function loadTasks() {
    const container = document.getElementById('tasks-list-container'); if (!container) { console.error("Conteneur '#tasks-list-container' non trouvé."); return; } container.innerHTML = '<div class="text-center py-10 text-gray-500">Chargement des tâches...</div>';
    try {
        const response = await fetch('/api/tasks', { headers: { 'Accept': 'application/json' } }); if (!response.ok) throw new Error(`Erreur HTTP ${response.status}`); const result = await response.json();
        if (result.success && result.tasks) { renderTasksList(container, result.tasks); }
        else { throw new Error(result.message || "Erreur récupération tâches."); }
    } catch (error) { console.error("Erreur loadTasks:", error); const currentLang = document.documentElement.lang || 'fr'; const errorText = translations[currentLang]?.['no_tasks_found'] || 'Erreur chargement tâches.'; container.innerHTML = `<div class="tasks-empty-message text-red-600">${errorText} (${error.message})</div>`; }
}

/** Génère le HTML pour la liste des rendez-vous (sous forme de tableau). */
function renderAppointmentsList(container, appointments) {
    if (!container) { console.error("Conteneur de liste de RDV non trouvé."); return; }
    const currentLang = document.documentElement.lang || 'fr';
    container.innerHTML = ''; // Vider

    if (!appointments || appointments.length === 0) {
        const emptyKey = 'no_appointments_found';
        const emptyText = translations[currentLang]?.[emptyKey] || 'Aucun rendez-vous trouvé.';
        container.innerHTML = `<div class="appointments-empty-message">${emptyText}</div>`;
        return;
    }

    const table = document.createElement('table'); table.className = 'appointments-table w-full';
    const thead = table.createTHead(); const headerRow = thead.insertRow();
    // TODO: Traduire les en-têtes
    const headers = ['Titre', 'Date et Heure', 'Statut', 'Actions'];
    headers.forEach(text => { const th = document.createElement('th'); th.scope = 'col'; th.textContent = text; headerRow.appendChild(th); });

    const tbody = table.createTBody();
    appointments.forEach(appt => {
        const row = tbody.insertRow();

        row.insertCell().textContent = appt.titre || 'Rendez-vous';
        const cellDateTime = row.insertCell();
        cellDateTime.textContent = formatDateTime(appt.heure_debut, currentLang, { dateStyle: 'long', timeStyle: 'short' });

        const cellStatus = row.insertCell();
        const statusBadge = document.createElement('span');
        statusBadge.className = 'appointment-status-badge';
        let statusText = appt.statut || 'pending'; // Défaut si null
        let statusClass = `appointment-status-${statusText}`;
        let translationKey = `appointment_status_${statusText}`;
        statusBadge.textContent = translations[currentLang]?.[translationKey] || statusText;
        statusBadge.classList.add(statusClass);
        cellStatus.appendChild(statusBadge);

        const cellActions = row.insertCell();
        cellActions.className = 'appointment-actions';
        cellActions.innerHTML = `
            <button title="${translations[currentLang]?.['appointment_action_details'] || 'Détails'}" data-action="view-appt" data-appt-id="${appt.id}" class="details-btn"> <svg class="inline w-3 h-3 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg> <span data-translate-key="appointment_action_details">Détails</span> </button>
            <button title="${translations[currentLang]?.['appointment_action_reschedule'] || 'Reprogrammer'}" data-action="reschedule-appt" data-appt-id="${appt.id}" class="reschedule-btn"> <svg class="inline w-3 h-3 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" /></svg> <span data-translate-key="appointment_action_reschedule">Reprogrammer</span> </button>
            <button title="${translations[currentLang]?.['appointment_action_cancel'] || 'Annuler'}" data-action="cancel-appt" data-appt-id="${appt.id}" class="cancel-btn"> <svg class="inline w-3 h-3 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" /></svg> <span data-translate-key="appointment_action_cancel">Annuler</span> </button>
        `;
    });

    container.appendChild(table);
}

/** Charge tous les rendez-vous depuis l'API et les affiche */
async function loadAllAppointments() {
    const container = document.getElementById('appointments-list-container');
    if (!container) { console.error("Conteneur '#appointments-list-container' non trouvé."); return; }
    container.innerHTML = '<div class="text-center py-10 text-gray-500">Chargement des rendez-vous...</div>';

    try {
        const response = await fetch('/api/appointments', { headers: { 'Accept': 'application/json' } });
        if (!response.ok) throw new Error(`Erreur HTTP ${response.status}`);
        const result = await response.json();
        if (result.success && result.appointments) {
            renderAppointmentsList(container, result.appointments);
        } else {
            throw new Error(result.message || "Erreur récupération rendez-vous.");
        }
    } catch (error) {
        console.error("Erreur loadAllAppointments:", error);
        const currentLang = document.documentElement.lang || 'fr';
        const errorText = translations[currentLang]?.['no_appointments_found'] || 'Erreur chargement rendez-vous.';
        container.innerHTML = `<div class="appointments-empty-message text-red-600">${errorText} (${error.message})</div>`;
    }
}

/** Gère le clic sur la checkbox d'une tâche pour ouvrir la modale d'action */
function handleTaskCheckboxClick(event) {
    const checkbox = event.target;
    const taskId = checkbox.dataset.taskId;
    const taskTitle = checkbox.dataset.taskTitle || 'Inconnu';
    console.log(`Checkbox cliquée pour Tâche ID: ${taskId} (${taskTitle})`);
    checkbox.checked = !checkbox.checked; // Annuler le changement visuel
    showTaskActionModal(taskId, taskTitle); // Ouvrir la modale
}


// --- Fonctions Modales ---
const createCategoryModal = document.getElementById('create-category-modal'); const createCategoryForm = document.getElementById('create-category-form'); const cancelCreateCategoryBtn = document.getElementById('cancel-create-category-btn'); const createCategoryErrorElement = document.getElementById('create-category-error');
function showCreateCategoryModal() { if (createCategoryModal) { createCategoryForm?.reset(); if(createCategoryErrorElement) createCategoryErrorElement.textContent = ''; createCategoryModal.classList.add('active'); createCategoryForm?.querySelector('input[name="titre"]')?.focus(); } else { console.error("Modal 'create-category-modal' not found."); } }
function hideCreateCategoryModal() { if (createCategoryModal) { createCategoryModal.classList.remove('active'); } }
const createTaskModal = document.getElementById('create-task-modal'); const createTaskForm = document.getElementById('create-task-form'); const cancelCreateTaskBtn = document.getElementById('cancel-create-task-btn'); const createTaskErrorElement = document.getElementById('create-task-error');
function showCreateTaskModal() { if (createTaskModal) { createTaskForm?.reset(); if(createTaskErrorElement) createTaskErrorElement.textContent = ''; createTaskModal.classList.add('active'); createTaskForm?.querySelector('input[name="titre"]')?.focus(); } else { console.error("Modal 'create-task-modal' not found."); } }
function hideCreateTaskModal() { if (createTaskModal) { createTaskModal.classList.remove('active'); } }
const logoutModal = document.getElementById('logout-confirm-modal'); const confirmLogoutBtn = document.getElementById('confirm-logout-btn'); const cancelLogoutBtn = document.getElementById('cancel-logout-btn');
function showLogoutModal() { if (logoutModal) logoutModal.classList.add('active'); }
function hideLogoutModal() { if (logoutModal) logoutModal.classList.remove('active'); }
// --- Fonctions Modale Action Tâche ---
const taskActionModal = document.getElementById('task-action-modal'); const taskActionModalTitle = document.getElementById('task-action-modal-task-title'); const taskActionStatusChanger = document.getElementById('task-action-status-changer'); const taskActionNewStatusSelect = document.getElementById('task-action-new-status'); const taskActionConfirmStatusBtn = document.getElementById('confirm-status-change-btn'); const taskActionChangeStatusBtn = document.getElementById('task-action-change-status-btn'); const taskActionDeleteBtn = document.getElementById('task-action-delete-btn'); const taskActionCancelBtn = document.getElementById('cancel-task-action-btn'); const taskActionError = document.getElementById('task-action-error'); let currentTaskActionId = null;
function showTaskActionModal(taskId, taskTitle) { if (taskActionModal) { currentTaskActionId = taskId; if (taskActionModalTitle) taskActionModalTitle.textContent = taskTitle || 'Tâche sélectionnée'; if (taskActionStatusChanger) taskActionStatusChanger.classList.add('hidden'); if (taskActionError) taskActionError.textContent = ''; taskActionModal.classList.add('active'); } else { console.error("Modal 'task-action-modal' non trouvée."); } }
function hideTaskActionModal() { if (taskActionModal) { taskActionModal.classList.remove('active'); currentTaskActionId = null; } }
// --- Fonctions Modale Création RDV ---
const createAppointmentModal = document.getElementById('create-appointment-modal');
const createAppointmentForm = document.getElementById('create-appointment-form');
const cancelCreateAppointmentBtn = document.getElementById('cancel-create-appointment-btn');
const createAppointmentErrorElement = document.getElementById('create-appointment-error');
const appointmentCategorySelect = document.getElementById('appointment-category');

/** Affiche la modale de création de RDV et charge les catégories */
async function showCreateAppointmentModal() {
    if (!createAppointmentModal || !appointmentCategorySelect) { console.error("Modale de création RDV ou sélecteur de catégorie non trouvé."); return; }
    if(createAppointmentErrorElement) createAppointmentErrorElement.textContent = ''; createAppointmentForm?.reset();
    appointmentCategorySelect.innerHTML = `<option value="" disabled selected data-translate-key="appointment_form_select_category">${translations[document.documentElement.lang || 'fr']?.['appointment_form_select_category'] || 'Sélectionner...'}</option>`;
    appointmentCategorySelect.disabled = true;
    try {
        const response = await fetch('/api/categories', { headers: { 'Accept': 'application/json' } }); if (!response.ok) throw new Error('Erreur chargement catégories'); const result = await response.json();
        if (result.success && result.categories && result.categories.length > 0) {
            result.categories.forEach(cat => { const option = document.createElement('option'); option.value = cat.id; option.textContent = cat.titre; appointmentCategorySelect.appendChild(option); });
            appointmentCategorySelect.disabled = false;
        } else { console.warn("Aucune catégorie trouvée pour peupler le sélecteur."); }
    } catch (error) { console.error("Erreur chargement catégories pour modale RDV:", error); if(createAppointmentErrorElement) createAppointmentErrorElement.textContent = "Erreur chargement des catégories."; }
    createAppointmentModal.classList.add('active'); createAppointmentForm?.querySelector('input[name="titre"]')?.focus();
}
/** Cache la modale de création de RDV */
function hideCreateAppointmentModal() { if (createAppointmentModal) { createAppointmentModal.classList.remove('active'); } }
// --- Fonctions Modale Détails RDV ---
const appointmentDetailsModal = document.getElementById('appointment-details-modal');
const detailsApptTitle = document.getElementById('details-appt-title');
const detailsApptCategory = document.getElementById('details-appt-category');
const detailsApptDate = document.getElementById('details-appt-date');
const detailsApptStartTime = document.getElementById('details-appt-start-time');
const detailsApptEndTime = document.getElementById('details-appt-end-time');
const detailsApptStatus = document.getElementById('details-appt-status');
const closeAppointmentDetailsBtn = document.getElementById('close-appointment-details-btn');
const editAppointmentBtn = document.getElementById('edit-appointment-btn');
let currentViewingAppointmentId = null;

/** Affiche la modale de détails de RDV avec les données fournies */
function showAppointmentDetailsModal(appointmentData) {
    if (!appointmentDetailsModal) return; const currentLang = document.documentElement.lang || 'fr';
    currentViewingAppointmentId = appointmentData.id;
    if(detailsApptTitle) detailsApptTitle.textContent = appointmentData.titre || 'Rendez-vous';
    if(detailsApptCategory) detailsApptCategory.textContent = appointmentData.categorie_titre || 'Non spécifiée';
    if(detailsApptDate) detailsApptDate.textContent = formatDate(appointmentData.heure_debut, currentLang, { dateStyle: 'full' });
    if(detailsApptStartTime) detailsApptStartTime.textContent = formatDateTime(appointmentData.heure_debut, currentLang, { timeStyle: 'short' });
    if(detailsApptEndTime) detailsApptEndTime.textContent = formatDateTime(appointmentData.heure_fin, currentLang, { timeStyle: 'short' });
    if(detailsApptStatus) {
        detailsApptStatus.innerHTML = ''; const statusBadge = document.createElement('span'); statusBadge.className = 'appointment-status-badge';
        let statusText = appointmentData.statut || 'pending'; let statusClass = `appointment-status-${statusText}`; let translationKey = `appointment_status_${statusText}`;
        statusBadge.textContent = translations[currentLang]?.[translationKey] || statusText; statusBadge.classList.add(statusClass); detailsApptStatus.appendChild(statusBadge);
    }
    appointmentDetailsModal.classList.add('active');
}
/** Cache la modale de détails de RDV */
function hideAppointmentDetailsModal() { if (appointmentDetailsModal) { appointmentDetailsModal.classList.remove('active'); currentViewingAppointmentId = null; } }
// --- Fonctions Modale Édition RDV ---
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

/** Affiche la modale d'édition de RDV et pré-remplit les champs */
async function showEditAppointmentModal(appointmentData) {
    if (!editAppointmentModal || !editAppointmentCategorySelect || !appointmentData) { console.error("Modale d'édition RDV, sélecteur catégorie ou données RDV manquants."); alert("Impossible d'ouvrir la modification du rendez-vous."); return; }
    if(editAppointmentErrorElement) editAppointmentErrorElement.textContent = ''; editAppointmentForm?.reset();
    editAppointmentCategorySelect.innerHTML = `<option value="" disabled data-translate-key="appointment_form_select_category">${translations[document.documentElement.lang || 'fr']?.['appointment_form_select_category'] || 'Sélectionner...'}</option>`;
    editAppointmentCategorySelect.disabled = true;
    try {
        const response = await fetch('/api/categories', { headers: { 'Accept': 'application/json' } }); if (!response.ok) throw new Error('Erreur chargement catégories'); const result = await response.json();
        if (result.success && result.categories && result.categories.length > 0) {
            result.categories.forEach(cat => { const option = document.createElement('option'); option.value = cat.id; option.textContent = cat.titre; if (cat.id === appointmentData.categorie_id) { option.selected = true; } editAppointmentCategorySelect.appendChild(option); });
            editAppointmentCategorySelect.disabled = false;
        } else { console.warn("Aucune catégorie trouvée pour peupler le sélecteur d'édition."); }
    } catch (error) { console.error("Erreur chargement catégories pour modale édition RDV:", error); if(editAppointmentErrorElement) editAppointmentErrorElement.textContent = "Erreur chargement des catégories."; }
    if(editAppointmentIdInput) editAppointmentIdInput.value = appointmentData.id;
    if(editAppointmentTitleInput) editAppointmentTitleInput.value = appointmentData.titre || '';
    if(editAppointmentDateInput) editAppointmentDateInput.value = formatTimestampForDateInput(appointmentData.heure_debut);
    if(editAppointmentStartTimeInput) editAppointmentStartTimeInput.value = formatTimestampForTimeInput(appointmentData.heure_debut);
    if(editAppointmentEndTimeInput) editAppointmentEndTimeInput.value = formatTimestampForTimeInput(appointmentData.heure_fin);
    editAppointmentModal.classList.add('active'); editAppointmentTitleInput?.focus();
}
/** Cache la modale d'édition de RDV */
function hideEditAppointmentModal() { if (editAppointmentModal) { editAppointmentModal.classList.remove('active'); } }
// --- Fonctions Modale Confirmation Annulation RDV ---
const cancelAppointmentConfirmModal = document.getElementById('cancel-appointment-confirm-modal');
const confirmCancelAppointmentBtn = document.getElementById('confirm-cancel-appointment-btn');
const cancelCancelAppointmentBtn = document.getElementById('cancel-cancel-appointment-btn');
let appointmentIdToCancel = null; // Pour stocker l'ID pendant la confirmation

/** Affiche la modale de confirmation d'annulation */
function showCancelAppointmentConfirmModal(apptId) {
    if (!cancelAppointmentConfirmModal) return;
    appointmentIdToCancel = apptId; // Stocker l'ID
    cancelAppointmentConfirmModal.classList.add('active');
}
/** Cache la modale de confirmation d'annulation */
function hideCancelAppointmentConfirmModal() {
    if (cancelAppointmentConfirmModal) {
        cancelAppointmentConfirmModal.classList.remove('active');
        appointmentIdToCancel = null; // Réinitialiser l'ID
    }
}
// --- Fin Fonctions Modales ---


// --- Initialisation et Gestion Navigation ---
document.addEventListener('DOMContentLoaded', () => {
    console.log('Dashboard JS loaded');
    // Références éléments
    const sidebarNav = document.querySelector('aside nav'); const mainContentContainer = document.querySelector('main'); const userNameElement = document.getElementById('user-name-display'); const userRoleElement = document.getElementById('user-role-display');
    const userProfileTrigger = document.getElementById('user-profile-trigger'); const userProfileDropdown = document.getElementById('user-profile-dropdown'); const headerLogoutBtn = document.getElementById('header-logout-btn');
    const createTaskBtn = document.getElementById('create-task-btn');
    const createAppointmentBtn = document.getElementById('create-appointment-btn'); // Référence ajoutée

    // Affichage infos user
    try { const storedUser = localStorage.getItem('loggedInUser'); if (storedUser) { const userData = JSON.parse(storedUser); if (userNameElement && userData.name) userNameElement.textContent = userData.name; if (userRoleElement && userData.role) userRoleElement.textContent = userData.role; } else { console.log('No user data found.'); } } catch (error) { console.error('Error getting user data:', error); }

    // Fonction showSection
    function showSection(sectionId) {
        console.log(`Showing section: ${sectionId}`); let sectionFound = false; mainContentContainer?.querySelectorAll('.main-section').forEach(section => section.classList.remove('active')); const targetSection = document.getElementById(`${sectionId}-content`);
        if (targetSection) { targetSection.classList.add('active'); sectionFound = true; } else { const fallbackSection = document.getElementById('dashboard-content'); if (fallbackSection) { fallbackSection.classList.add('active'); sectionId = 'dashboard'; sectionFound = true; window.location.hash = sectionId; } }
        if(sectionFound) {
            sidebarNav?.querySelectorAll('.sidebar-link').forEach(link => { link.classList.remove('active'); if (link.getAttribute('href') === `#${sectionId}`) { link.classList.add('active'); } }); const activeSection = document.getElementById(`${sectionId}-content`);
            if (sectionId !== 'categories') {
                const mainTitleElement = activeSection?.querySelector('h1[data-translate-key]');
                if (mainTitleElement) {
                    const titleKey = `${sectionId}_section_title`; mainTitleElement.dataset.translateKey = titleKey;
                    try { if (typeof setLanguage === 'function') { setLanguage(document.documentElement.lang || 'fr'); } else { console.warn("setLanguage function not found when trying to translate title."); } } catch (e) { console.error("Error calling setLanguage:", e); }
                } else { console.warn(`H1 title not found in section: ${sectionId}-content`); }
            }
            if (sectionId === 'dashboard') { loadDashboardData(); }
            else if (sectionId === 'categories') { loadCategories(); }
            else if (sectionId === 'tasks') { loadTasks(); }
            else if (sectionId === 'appointments') { loadAllAppointments(); }
            // else if (sectionId === 'profile') { loadProfile(); } // TODO
        }
    }

    // Listeners navigation
    if (sidebarNav) { sidebarNav.addEventListener('click', (event) => { const link = event.target.closest('a.sidebar-link'); if (link && link.getAttribute('href')?.startsWith('#')) { event.preventDefault(); const sectionId = link.getAttribute('href').substring(1); if (window.location.hash !== `#${sectionId}`) { window.location.hash = sectionId; } else { showSection(sectionId); document.getElementById(`${sectionId}-content`)?.scrollTo(0, 0); } } }); }
    window.addEventListener('hashchange', () => { const sectionId = window.location.hash ? window.location.hash.substring(1) : 'dashboard'; showSection(sectionId); }); const initialSectionId = window.location.hash ? window.location.hash.substring(1) : 'dashboard'; showSection(initialSectionId); // Premier appel

    // Listener Actions Catégories
    const categoriesContent = document.getElementById('categories-content');
    if (categoriesContent) {
        categoriesContent.addEventListener('click', async (event) => {
             const button = event.target.closest('button[data-action]'); if (!button) return; const action = button.dataset.action; const categoryId = button.dataset.categoryId; const categoryName = button.dataset.categoryName;
             switch (action) {
                case 'view': console.log(`Action: Voir les RDV pour catégorie ${categoryId} (${categoryName})`); loadCategoryAppointments(categoryId, categoryName); break;
                case 'edit': console.log(`Action: Modifier catégorie ${categoryId}`); alert(`Modifier catégorie ${categoryId} (à implémenter)`); break;
                case 'delete':
                    console.log(`Action: Supprimer catégorie ${categoryId}`); const currentLang = document.documentElement.lang || 'fr'; let confirmMsg = translations[currentLang]?.['category_delete_confirm_text'] || 'Supprimer "{categoryName}" ?'; confirmMsg = confirmMsg.replace('{categoryName}', categoryName || `ID ${categoryId}`);
                    if (confirm(confirmMsg)) {
                        console.log(`Confirmer suppression catégorie ${categoryId}`); button.disabled = true;
                        try {
                            const response = await fetch(`/api/categories/${categoryId}`, { method: 'DELETE', /* headers: { Auth } */ }); const result = await response.json();
                            if (response.ok && result.success) { console.log("Catégorie supprimée"); loadCategories(); }
                            else { console.error("Erreur suppression cat:", result.message); alert(`Erreur: ${result.message || 'Impossible de supprimer.'}`); button.disabled = false; }
                        } catch (error) { console.error("Erreur réseau suppression cat:", error); alert("Erreur réseau."); button.disabled = false; }
                    }
                    break;
             }
        });
    }

     // --- Gestion Dropdown Profil ---
     if (userProfileTrigger && userProfileDropdown) {
        userProfileTrigger.addEventListener('click', (event) => { event.stopPropagation(); userProfileDropdown.classList.toggle('hidden'); userProfileTrigger.setAttribute('aria-expanded', !userProfileDropdown.classList.contains('hidden')); });
        document.addEventListener('click', (event) => { if (!userProfileDropdown.classList.contains('hidden') && !userProfileTrigger.contains(event.target) && !userProfileDropdown.contains(event.target)) { userProfileDropdown.classList.add('hidden'); userProfileTrigger.setAttribute('aria-expanded', 'false');} });
        const profileLink = userProfileDropdown.querySelector('a[href="#profile"]'); if (profileLink) { profileLink.addEventListener('click', () => { userProfileDropdown.classList.add('hidden'); userProfileTrigger.setAttribute('aria-expanded', 'false'); }); }
        if (headerLogoutBtn) { headerLogoutBtn.addEventListener('click', () => { userProfileDropdown.classList.add('hidden'); userProfileTrigger.setAttribute('aria-expanded', 'false'); showLogoutModal(); }); }
    } else {
         console.warn("Éléments du dropdown profil non trouvés.");
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
             const formData = new FormData(createCategoryForm); const categoryData = Object.fromEntries(formData.entries());
             categoryData.description = categoryData.description || null; categoryData.couleur = categoryData.couleur || '#4f46e5'; categoryData.icone = categoryData.icone || null; categoryData.departement = categoryData.departement || null; categoryData.responsable = categoryData.responsable || null;
             console.log("Données création catégorie:", categoryData);
             try {
                 const response = await fetch('/api/categories', { method: 'POST', headers: { 'Content-Type': 'application/json', /* Auth */ }, body: JSON.stringify(categoryData) }); const result = await response.json();
                 if (response.ok && result.success) { console.log("Catégorie créée:", result.category); hideCreateCategoryModal(); loadCategories(); }
                 else { console.error("Erreur création:", result.message); if(createCategoryErrorElement) createCategoryErrorElement.textContent = result.message || "Erreur."; }
             } catch (error) { console.error("Erreur réseau création:", error); if(createCategoryErrorElement) createCategoryErrorElement.textContent = "Erreur réseau.";
             } finally { submitButton.disabled = false; submitButton.textContent = originalButtonText; }
         });
     }

     // === Listeners pour la modale de création de TÂCHE ===
     if (createTaskBtn) { createTaskBtn.addEventListener('click', showCreateTaskModal); }
     if (cancelCreateTaskBtn) { cancelCreateTaskBtn.addEventListener('click', hideCreateTaskModal); }
     if (createTaskModal) { createTaskModal.addEventListener('click', (event) => { if (event.target === createTaskModal) { hideCreateTaskModal(); } }); }
     if (createTaskForm) {
         createTaskForm.addEventListener('submit', async (event) => {
             event.preventDefault(); const submitButton = createTaskForm.querySelector('button[type="submit"]'); const originalButtonTextKey = "task_form_create"; const currentLang = document.documentElement.lang || 'fr'; const originalButtonText = translations[currentLang]?.[originalButtonTextKey] || "Créer la tâche";
             submitButton.disabled = true; submitButton.textContent = "Création..."; if(createTaskErrorElement) createTaskErrorElement.textContent = '';
             const formData = new FormData(createTaskForm); const taskData = Object.fromEntries(formData.entries());
             taskData.priorite = taskData.priorite || '2';
             console.log("Données création tâche (avant envoi):", taskData);
             try {
                 const response = await fetch('/api/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json', /* Auth */ }, body: JSON.stringify(taskData) }); const result = await response.json();
                 if (response.ok && result.success) { console.log("Tâche créée:", result.task); hideCreateTaskModal(); loadTasks(); }
                 else { console.error("Erreur création tâche:", result.message); if(createTaskErrorElement) createTaskErrorElement.textContent = result.message || "Erreur."; }
             } catch (error) { console.error("Erreur réseau création tâche:", error); if(createTaskErrorElement) createTaskErrorElement.textContent = "Erreur réseau.";
             } finally { submitButton.disabled = false; submitButton.textContent = originalButtonText; }
         });
     }

     // === Listeners pour la modale d'ACTION de TÂCHE ===
     if (taskActionChangeStatusBtn) { taskActionChangeStatusBtn.addEventListener('click', () => { if (taskActionStatusChanger) taskActionStatusChanger.classList.remove('hidden'); }); }
     if (taskActionConfirmStatusBtn) {
         taskActionConfirmStatusBtn.addEventListener('click', async () => {
             if (!currentTaskActionId || !taskActionNewStatusSelect) return;
             const newStatus = taskActionNewStatusSelect.value; const isCompleted = (newStatus === 'done') ? 1 : 0;
             console.log(`Confirmer changement statut tâche ${currentTaskActionId} à ${newStatus}`);
             taskActionConfirmStatusBtn.disabled = true; taskActionConfirmStatusBtn.textContent = "Maj..."; if(taskActionError) taskActionError.textContent = '';
             try {
                 const response = await fetch(`/api/tasks/${currentTaskActionId}/status`, { method: 'PUT', headers: { 'Content-Type': 'application/json', /* Auth */ }, body: JSON.stringify({ statut: newStatus, est_complete: isCompleted }) }); const result = await response.json();
                 if (response.ok && result.success) { console.log("Statut MàJ succès"); hideTaskActionModal(); loadTasks(); } // Rafraîchir
                 else { console.error("Erreur MàJ statut:", result.message); if(taskActionError) taskActionError.textContent = result.message || "Erreur MàJ statut."; }
             } catch (error) { console.error("Erreur réseau MàJ statut:", error); if(taskActionError) taskActionError.textContent = "Erreur réseau.";
             } finally { taskActionConfirmStatusBtn.disabled = false; taskActionConfirmStatusBtn.textContent = translations[document.documentElement.lang || 'fr']?.['task_action_confirm_status'] || "Valider Statut"; }
         });
     }
     if (taskActionDeleteBtn) {
         taskActionDeleteBtn.addEventListener('click', async () => {
             if (!currentTaskActionId) return;
             const taskTitle = taskActionModalTitle?.textContent.replace('Tâche : ','') || `ID ${currentTaskActionId}`;
             const confirmMsg = translations[document.documentElement.lang || 'fr']?.['task_delete_confirm_text'] || `Supprimer la tâche "${taskTitle}" ?`;
             if (confirm(confirmMsg)) {
                 console.log(`Confirmer suppression tâche ${currentTaskActionId}`);
                 taskActionDeleteBtn.disabled = true; taskActionDeleteBtn.textContent = "Suppression..."; if(taskActionError) taskActionError.textContent = '';
                 try {
                     const response = await fetch(`/api/tasks/${currentTaskActionId}`, { method: 'DELETE', headers: { /* Auth */ } }); const result = await response.json();
                     if (response.ok && result.success) { console.log("Tâche supprimée succès"); hideTaskActionModal(); loadTasks(); } // Rafraîchir
                     else { console.error("Erreur suppression:", result.message); if(taskActionError) taskActionError.textContent = result.message || "Erreur suppression."; }
                 } catch (error) { console.error("Erreur réseau suppression:", error); if(taskActionError) taskActionError.textContent = "Erreur réseau.";
                 } finally { taskActionDeleteBtn.disabled = false; taskActionDeleteBtn.textContent = translations[document.documentElement.lang || 'fr']?.['task_action_delete'] || "Supprimer"; }
             }
         });
     }
     if (taskActionCancelBtn) { taskActionCancelBtn.addEventListener('click', hideTaskActionModal); }
     if (taskActionModal) { taskActionModal.addEventListener('click', (event) => { if (event.target === taskActionModal) { hideTaskActionModal(); } }); }

     // === Listener pour les actions sur la liste des tâches (Checkbox + Edit/Delete boutons) ===
     const tasksListContainer = document.getElementById('tasks-list-container');
     if (tasksListContainer) {
         tasksListContainer.addEventListener('click', (event) => {
             const button = event.target.closest('button[data-action]');
             const checkbox = event.target.closest('input[type="checkbox"].task-checkbox');
             if (button) {
                const action = button.dataset.action; const taskId = button.dataset.taskId; const taskTitle = button.closest('tr')?.querySelector('.task-title')?.textContent;
                if (action === 'edit-task') { console.log(`Action: Modifier tâche ${taskId}`); alert(`Modifier tâche ${taskId} (à implémenter)`); }
                else if (action === 'delete-task') { console.log(`Action: Supprimer tâche ${taskId} via bouton`); showTaskActionModal(taskId, taskTitle); }
             } else if (checkbox) { handleTaskCheckboxClick(event); }
         });
     }

      // === Listener pour les actions sur la liste des RDV ===
      const appointmentsListContainer = document.getElementById('appointments-list-container');
      if (appointmentsListContainer) {
          appointmentsListContainer.addEventListener('click', async (event) => { // Rendu async pour fetch détails
              const button = event.target.closest('button[data-action]');
              if (!button) return;
              const action = button.dataset.action; const apptId = button.dataset.apptId;
              if (action === 'view-appt') {
                  console.log(`Action: Voir détails RDV ${apptId}`); button.disabled = true;
                  try {
                      const response = await fetch(`/api/appointments/${apptId}`, { headers: { 'Accept': 'application/json' } }); if (!response.ok) throw new Error(`Erreur HTTP ${response.status}`); const result = await response.json();
                      if (result.success && result.appointment) { showAppointmentDetailsModal(result.appointment); }
                      else { throw new Error(result.message || 'Impossible de charger les détails.'); }
                  } catch (error) { console.error("Erreur fetch détails RDV:", error); alert(`Erreur: Impossible de charger les détails du rendez-vous. ${error.message}`);
                  } finally { button.disabled = false; }
              } else if (action === 'reschedule-appt') {
                  console.log(`Action: Reprogrammer RDV ${apptId}`); button.disabled = true;
                  try {
                      const response = await fetch(`/api/appointments/${apptId}`, { headers: { 'Accept': 'application/json' } }); if (!response.ok) throw new Error(`Erreur HTTP ${response.status}`); const result = await response.json();
                      if (result.success && result.appointment) { showEditAppointmentModal(result.appointment); }
                      else { throw new Error(result.message || 'Impossible de charger les données pour modification.'); }
                  } catch (error) { console.error("Erreur fetch détails RDV pour édition:", error); alert(`Erreur: Impossible de charger les données pour modification. ${error.message}`);
                  } finally { button.disabled = false; }
              } else if (action === 'cancel-appt') {
                  console.log(`Action: Annuler RDV ${apptId}`);
                  showCancelAppointmentConfirmModal(apptId); // Ouvre la modale de confirmation personnalisée
              }
          });
      }

      // === Listener pour bouton "Nouveau RDV" ===
      if (createAppointmentBtn) { createAppointmentBtn.addEventListener('click', showCreateAppointmentModal); }
      else { console.warn('Bouton "create-appointment-btn" non trouvé.'); }

      // === Listeners pour Modale Création RDV ===
      if (cancelCreateAppointmentBtn) { cancelCreateAppointmentBtn.addEventListener('click', hideCreateAppointmentModal); }
      if (createAppointmentModal) { createAppointmentModal.addEventListener('click', (event) => { if (event.target === createAppointmentModal) { hideCreateAppointmentModal(); } }); }
      if (createAppointmentForm) {
          createAppointmentForm.addEventListener('submit', async (event) => {
              event.preventDefault(); const submitButton = createAppointmentForm.querySelector('button[type="submit"]'); const originalButtonTextKey = "appointment_form_create"; const currentLang = document.documentElement.lang || 'fr'; const originalButtonText = translations[currentLang]?.[originalButtonTextKey] || "Créer le rendez-vous";
              submitButton.disabled = true; submitButton.textContent = "Création..."; if(createAppointmentErrorElement) createAppointmentErrorElement.textContent = '';
              const formData = new FormData(createAppointmentForm); const appointmentData = {};
              appointmentData.titre = formData.get('titre') || null; appointmentData.categorie_id = formData.get('categorie_id');
              const dateStr = formData.get('date'); const startTimeStr = formData.get('heure_debut'); const endTimeStr = formData.get('heure_fin');
              let startTimestamp = null; let endTimestamp = null;
              if (dateStr && startTimeStr) { try { startTimestamp = new Date(`${dateStr}T${startTimeStr}`).getTime(); if (isNaN(startTimestamp)) throw new Error("Date/heure début invalide"); } catch(e) { console.error("Erreur parsing date/heure début:", e); if(createAppointmentErrorElement) createAppointmentErrorElement.textContent = "Format date/heure de début invalide."; submitButton.disabled = false; submitButton.textContent = originalButtonText; return; } } else { if(createAppointmentErrorElement) createAppointmentErrorElement.textContent = "Date et heure de début requises."; submitButton.disabled = false; submitButton.textContent = originalButtonText; return; }
              if (dateStr && endTimeStr) { try { endTimestamp = new Date(`${dateStr}T${endTimeStr}`).getTime(); if (isNaN(endTimestamp)) throw new Error("Date/heure fin invalide"); if (endTimestamp <= startTimestamp) throw new Error("Heure fin avant ou égale à heure début"); } catch(e) { console.error("Erreur parsing/validation date/heure fin:", e); if(createAppointmentErrorElement) createAppointmentErrorElement.textContent = e.message || "Format date/heure de fin invalide ou incohérent."; submitButton.disabled = false; submitButton.textContent = originalButtonText; return; } } else { if(createAppointmentErrorElement) createAppointmentErrorElement.textContent = "Heure de fin requise."; submitButton.disabled = false; submitButton.textContent = originalButtonText; return; }
              const bodyData = { titre: appointmentData.titre, categorie_id: appointmentData.categorie_id, heure_debut: startTimestamp, heure_fin: endTimestamp, statut: 'confirmed' };
              console.log("Données création RDV (avant envoi):", bodyData);
              try {
                  const response = await fetch('/api/appointments', { method: 'POST', headers: { 'Content-Type': 'application/json', /* Auth */ }, body: JSON.stringify(bodyData) }); const result = await response.json();
                  if (response.ok && result.success) { console.log("RDV créé:", result.appointment); hideCreateAppointmentModal(); loadAllAppointments(); }
                  else { console.error("Erreur création RDV (API):", result.message); if(createAppointmentErrorElement) createAppointmentErrorElement.textContent = result.message || "Erreur lors de la création."; }
              } catch (error) { console.error("Erreur réseau création RDV:", error); if(createAppointmentErrorElement) createAppointmentErrorElement.textContent = "Erreur réseau lors de la soumission.";
              } finally { submitButton.disabled = false; submitButton.textContent = originalButtonText; }
          });
      }

       // === Listeners pour Modale Détails RDV ===
       if(closeAppointmentDetailsBtn) { closeAppointmentDetailsBtn.addEventListener('click', hideAppointmentDetailsModal); }
       if(appointmentDetailsModal) { appointmentDetailsModal.addEventListener('click', (event) => { if (event.target === appointmentDetailsModal) { hideAppointmentDetailsModal(); } }); }
       if(editAppointmentBtn) {
           editAppointmentBtn.addEventListener('click', async () => { // Rendre async pour fetch détails
               if(currentViewingAppointmentId) {
                   console.log(`Action: Modifier RDV ${currentViewingAppointmentId} (depuis détails)`);
                   hideAppointmentDetailsModal(); // Fermer détails
                   editAppointmentBtn.disabled = true; // Désactiver pendant chargement
                   try {
                        const response = await fetch(`/api/appointments/${currentViewingAppointmentId}`, { headers: { 'Accept': 'application/json' } });
                        if (!response.ok) throw new Error(`Erreur HTTP ${response.status}`);
                        const result = await response.json();
                        if (result.success && result.appointment) {
                            showEditAppointmentModal(result.appointment); // Ouvre la modale d'édition pré-remplie
                        } else { throw new Error(result.message || 'Impossible de charger les données pour modification.'); }
                    } catch (error) { console.error("Erreur fetch détails RDV pour édition depuis détails:", error); alert(`Erreur: Impossible de charger les données pour modification. ${error.message}`);
                    } finally { editAppointmentBtn.disabled = false; } // Réactiver
               }
           });
       }

       // === Listeners pour Modale Édition RDV ===
       if (cancelEditAppointmentBtn) { cancelEditAppointmentBtn.addEventListener('click', hideEditAppointmentModal); }
       if (editAppointmentModal) { editAppointmentModal.addEventListener('click', (event) => { if (event.target === editAppointmentModal) { hideEditAppointmentModal(); } }); }
       if (editAppointmentForm) {
           editAppointmentForm.addEventListener('submit', async (event) => {
               event.preventDefault(); const submitButton = editAppointmentForm.querySelector('button[type="submit"]'); const originalButtonTextKey = "appointment_form_save"; const currentLang = document.documentElement.lang || 'fr'; const originalButtonText = translations[currentLang]?.[originalButtonTextKey] || "Enregistrer";
               submitButton.disabled = true; submitButton.textContent = "Sauvegarde..."; if(editAppointmentErrorElement) editAppointmentErrorElement.textContent = '';
               const formData = new FormData(editAppointmentForm); const appointmentId = formData.get('appointment_id');
               if (!appointmentId) { if(editAppointmentErrorElement) editAppointmentErrorElement.textContent = "Erreur : ID du rendez-vous manquant."; submitButton.disabled = false; submitButton.textContent = originalButtonText; return; }
               const appointmentData = {}; appointmentData.titre = formData.get('titre') || null; appointmentData.categorie_id = formData.get('categorie_id');
               const dateStr = formData.get('date'); const startTimeStr = formData.get('heure_debut'); const endTimeStr = formData.get('heure_fin');
               let startTimestamp = null; let endTimestamp = null;
               if (dateStr && startTimeStr) { try { startTimestamp = new Date(`${dateStr}T${startTimeStr}`).getTime(); if (isNaN(startTimestamp)) throw new Error("Date/heure début invalide"); } catch(e) { console.error("Erreur parsing date/heure début:", e); if(editAppointmentErrorElement) editAppointmentErrorElement.textContent = "Format date/heure de début invalide."; submitButton.disabled = false; submitButton.textContent = originalButtonText; return; } } else { if(editAppointmentErrorElement) editAppointmentErrorElement.textContent = "Date et heure de début requises."; submitButton.disabled = false; submitButton.textContent = originalButtonText; return; }
               if (dateStr && endTimeStr) { try { endTimestamp = new Date(`${dateStr}T${endTimeStr}`).getTime(); if (isNaN(endTimestamp)) throw new Error("Date/heure fin invalide"); if (endTimestamp <= startTimestamp) throw new Error("Heure fin avant ou égale à heure début"); } catch(e) { console.error("Erreur parsing/validation date/heure fin:", e); if(editAppointmentErrorElement) editAppointmentErrorElement.textContent = e.message || "Format date/heure de fin invalide ou incohérent."; submitButton.disabled = false; submitButton.textContent = originalButtonText; return; } } else { if(editAppointmentErrorElement) editAppointmentErrorElement.textContent = "Heure de fin requise."; submitButton.disabled = false; submitButton.textContent = originalButtonText; return; }
               const bodyData = { titre: appointmentData.titre, categorie_id: appointmentData.categorie_id, heure_debut: startTimestamp, heure_fin: endTimestamp /*, statut: 'confirmed' // On ne change pas le statut ici par défaut */ };
               console.log(`Données MàJ RDV ${appointmentId} (avant envoi):`, bodyData);
               try {
                   const response = await fetch(`/api/appointments/${appointmentId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', /* Auth */ }, body: JSON.stringify(bodyData) }); const result = await response.json();
                   if (response.ok && result.success) { console.log("RDV mis à jour:", result.appointment); hideEditAppointmentModal(); loadAllAppointments(); }
                   else { console.error("Erreur MàJ RDV (API):", result.message); if(editAppointmentErrorElement) editAppointmentErrorElement.textContent = result.message || "Erreur lors de la mise à jour."; }
               } catch (error) { console.error("Erreur réseau MàJ RDV:", error); if(editAppointmentErrorElement) editAppointmentErrorElement.textContent = "Erreur réseau lors de la soumission.";
               } finally { submitButton.disabled = false; submitButton.textContent = originalButtonText; }
           });
       }

       // === Listeners pour Modale Confirmation Annulation RDV ===
       if(cancelCancelAppointmentBtn) { cancelCancelAppointmentBtn.addEventListener('click', hideCancelAppointmentConfirmModal); }
       if(cancelAppointmentConfirmModal) { cancelAppointmentConfirmModal.addEventListener('click', (event) => { if (event.target === cancelAppointmentConfirmModal) { hideCancelAppointmentConfirmModal(); } }); }
       if(confirmCancelAppointmentBtn) {
           confirmCancelAppointmentBtn.addEventListener('click', async () => {
               if (!appointmentIdToCancel) return;
               console.log(`Confirmation annulation RDV ${appointmentIdToCancel}`); confirmCancelAppointmentBtn.disabled = true; const originalText = confirmCancelAppointmentBtn.textContent; confirmCancelAppointmentBtn.textContent = "Annulation...";
               try {
                   const response = await fetch(`/api/appointments/${appointmentIdToCancel}/status`, { method: 'PUT', headers: { 'Content-Type': 'application/json', /* Auth */ }, body: JSON.stringify({ statut: 'canceled' }) }); const result = await response.json();
                   if (response.ok && result.success) { console.log("RDV annulé avec succès (statut mis à jour)."); hideCancelAppointmentConfirmModal(); loadAllAppointments(); }
                   else { console.error("Erreur annulation RDV (API):", result.message); alert(`Erreur lors de l'annulation: ${result.message || 'Erreur inconnue.'}`); }
               } catch (error) { console.error("Erreur réseau annulation RDV:", error); alert("Erreur réseau lors de la tentative d'annulation.");
               } finally { confirmCancelAppointmentBtn.disabled = false; confirmCancelAppointmentBtn.textContent = originalText; appointmentIdToCancel = null; }
           });
       }

}); // Fin de DOMContentLoaded
