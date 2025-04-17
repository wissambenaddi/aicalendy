/**
 * Fichier : js/modules/dashboard.js
 * Description : Gère la logique du tableau de bord : navigation, affichage infos user,
 * KPIs, affichage dynamique des catégories, tâches, rendez-vous,
 * gestion des modales (logout, création catégorie, création tâche, action tâche), dropdown profil.
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
    if (!container) return;
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

/** Gère le clic sur la checkbox d'une tâche pour ouvrir la modale d'action */
function handleTaskCheckboxClick(event) {
    const checkbox = event.target;
    const taskId = checkbox.dataset.taskId;
    const taskTitle = checkbox.dataset.taskTitle || 'Inconnu';
    console.log(`Checkbox cliquée pour Tâche ID: ${taskId} (${taskTitle})`);

    // Empêcher le changement d'état visuel immédiat de la checkbox
    checkbox.checked = !checkbox.checked;

    // Ouvrir la modale d'action
    showTaskActionModal(taskId, taskTitle);
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
// --- Fin Fonctions Modales ---


// --- Initialisation et Gestion Navigation ---
document.addEventListener('DOMContentLoaded', () => {
    console.log('Dashboard JS loaded');
    // Références éléments
    const sidebarNav = document.querySelector('aside nav'); const mainContentContainer = document.querySelector('main'); const userNameElement = document.getElementById('user-name-display'); const userRoleElement = document.getElementById('user-role-display');
    const userProfileTrigger = document.getElementById('user-profile-trigger'); const userProfileDropdown = document.getElementById('user-profile-dropdown'); const headerLogoutBtn = document.getElementById('header-logout-btn');
    const createTaskBtn = document.getElementById('create-task-btn');

    // Affichage infos user
    try { const storedUser = localStorage.getItem('loggedInUser'); if (storedUser) { const userData = JSON.parse(storedUser); if (userNameElement && userData.name) userNameElement.textContent = userData.name; if (userRoleElement && userData.role) userRoleElement.textContent = userData.role; } else { console.log('No user data found.'); } } catch (error) { console.error('Error getting user data:', error); }

    // Fonction showSection
    function showSection(sectionId) {
        console.log(`Showing section: ${sectionId}`); let sectionFound = false; mainContentContainer?.querySelectorAll('.main-section').forEach(section => section.classList.remove('active')); const targetSection = document.getElementById(`${sectionId}-content`);
        if (targetSection) { targetSection.classList.add('active'); sectionFound = true; } else { const fallbackSection = document.getElementById('dashboard-content'); if (fallbackSection) { fallbackSection.classList.add('active'); sectionId = 'dashboard'; sectionFound = true; window.location.hash = sectionId; } }
        if(sectionFound) {
            sidebarNav?.querySelectorAll('.sidebar-link').forEach(link => { link.classList.remove('active'); if (link.getAttribute('href') === `#${sectionId}`) { link.classList.add('active'); } }); const activeSection = document.getElementById(`${sectionId}-content`);
            // Mise à jour traduction titre section (sauf pour catégories gérées dynamiquement)
            if (sectionId !== 'categories') {
                const mainTitleElement = activeSection?.querySelector('h1[data-translate-key]');
                if (mainTitleElement) {
                    const titleKey = `${sectionId}_section_title`; mainTitleElement.dataset.translateKey = titleKey;
                    try {
                         // Vérifier si la fonction existe avant de l'appeler
                         if (typeof setLanguage === 'function') {
                             setLanguage(document.documentElement.lang || 'fr');
                         } else {
                             console.warn("setLanguage function not found when trying to translate title.");
                         }
                    } catch (e) { console.error("Error calling setLanguage:", e); }
                } else { console.warn(`H1 title not found in section: ${sectionId}-content`); }
            }
            // Charger les données spécifiques à la section
            if (sectionId === 'dashboard') { loadDashboardData(); }
            else if (sectionId === 'categories') { loadCategories(); }
            else if (sectionId === 'tasks') { loadTasks(); } // Appel correct ici
            // else if (sectionId === 'appointments') { loadAllAppointments(); } // TODO
            // else if (sectionId === 'profile') { loadProfile(); } // TODO
        }
    }

    // Listeners navigation
    if (sidebarNav) { sidebarNav.addEventListener('click', (event) => { const link = event.target.closest('a.sidebar-link'); if (link && link.getAttribute('href')?.startsWith('#')) { event.preventDefault(); const sectionId = link.getAttribute('href').substring(1); if (window.location.hash !== `#${sectionId}`) { window.location.hash = sectionId; } else { showSection(sectionId); document.getElementById(`${sectionId}-content`)?.scrollTo(0, 0); } } }); }
    window.addEventListener('hashchange', () => { const sectionId = window.location.hash ? window.location.hash.substring(1) : 'dashboard'; showSection(sectionId); }); const initialSectionId = window.location.hash ? window.location.hash.substring(1) : 'dashboard'; showSection(initialSectionId); // Premier appel

    // Listener Actions Catégories
    const categoriesContent = document.getElementById('categories-content');
    if (categoriesContent) {
        categoriesContent.addEventListener('click', async (event) => { // Rendu async pour delete
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
             taskData.priorite = taskData.priorite || '2'; // Assurer string pour priorité
             console.log("Données création tâche (avant envoi):", taskData);
             try {
                 const response = await fetch('/api/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json', /* Auth */ }, body: JSON.stringify(taskData) }); const result = await response.json();
                 if (response.ok && result.success) { console.log("Tâche créée:", result.task); hideCreateTaskModal(); loadTasks(); /* Rafraîchir la liste */ }
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

             if (button) { // Gérer clic sur bouton action (Edit/Delete)
                const action = button.dataset.action; const taskId = button.dataset.taskId; const taskTitle = button.closest('tr')?.querySelector('.task-title')?.textContent;
                if (action === 'edit-task') { console.log(`Action: Modifier tâche ${taskId}`); alert(`Modifier tâche ${taskId} (à implémenter)`); }
                else if (action === 'delete-task') { console.log(`Action: Supprimer tâche ${taskId} via bouton`); showTaskActionModal(taskId, taskTitle); } // Ouvre modale pour confirmer
             } else if (checkbox) { // Gérer clic sur checkbox
                 handleTaskCheckboxClick(event); // Ouvre modale d'action
             }
         });
     }

}); // Fin de DOMContentLoaded
