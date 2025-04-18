/**
 * Fichier : js/modules/taskHandler.js
 * Description : Gère la logique spécifique à la section "Mes Tâches".
 */

import { translations, setLanguage } from './translator.js'; // OK
import * as api from './core/api.js'; // <<< Chemin CORRIGÉ vers core/
import * as utils from './core/utils.js'; // <<< Chemin CORRIGÉ vers core/

// --- Références aux éléments DOM spécifiques aux tâches ---
const createTaskModal = document.getElementById('create-task-modal');
const createTaskForm = document.getElementById('create-task-form');
const cancelCreateTaskBtn = document.getElementById('cancel-create-task-btn');
const createTaskErrorElement = document.getElementById('create-task-error');
const tasksListContainer = document.getElementById('tasks-list-container');
const createTaskBtn = document.getElementById('create-task-btn'); // Bouton "Créer une tâche"

// --- Références Modale Action Tâche ---
const taskActionModal = document.getElementById('task-action-modal');
const taskActionModalTitle = document.getElementById('task-action-modal-task-title');
const taskActionStatusChanger = document.getElementById('task-action-status-changer');
const taskActionNewStatusSelect = document.getElementById('task-action-new-status');
const taskActionConfirmStatusBtn = document.getElementById('confirm-status-change-btn');
const taskActionChangeStatusBtn = document.getElementById('task-action-change-status-btn');
const taskActionDeleteBtn = document.getElementById('task-action-delete-btn');
const taskActionCancelBtn = document.getElementById('cancel-task-action-btn');
const taskActionError = document.getElementById('task-action-error');
let currentTaskActionId = null; // ID de la tâche en cours d'action

// --- Fonctions Modales Tâches ---
function showCreateTaskModal() {
    if (createTaskModal) {
        createTaskForm?.reset();
        if(createTaskErrorElement) createTaskErrorElement.textContent = '';
        createTaskModal.classList.add('active');
        createTaskForm?.querySelector('input[name="titre"]')?.focus();
    } else {
        console.error("Modal 'create-task-modal' not found.");
    }
}

function hideCreateTaskModal() {
    if (createTaskModal) {
        createTaskModal.classList.remove('active');
    }
}

function showTaskActionModal(taskId, taskTitle) {
    if (taskActionModal) {
        currentTaskActionId = taskId;
        if (taskActionModalTitle) taskActionModalTitle.textContent = taskTitle || 'Tâche sélectionnée';
        if (taskActionStatusChanger) taskActionStatusChanger.classList.add('hidden'); // Cacher par défaut
        if (taskActionError) taskActionError.textContent = '';
        // Pré-sélectionner le statut actuel si possible (nécessiterait de passer le statut actuel)
        // if(taskActionNewStatusSelect && currentStatus) taskActionNewStatusSelect.value = currentStatus;
        taskActionModal.classList.add('active');
    } else {
        console.error("Modal 'task-action-modal' non trouvée.");
    }
}

function hideTaskActionModal() {
    if (taskActionModal) {
        taskActionModal.classList.remove('active');
        currentTaskActionId = null;
    }
}


// --- Fonctions d'Affichage Tâches ---

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
        const cellDueDate = row.insertCell(); cellDueDate.textContent = utils.formatDate(task.date_echeance, currentLang); if (task.date_echeance && task.date_echeance < Date.now() && !task.est_complete) { cellDueDate.classList.add('text-red-600', 'font-medium'); }
        row.insertCell().textContent = task.responsable || '-';
        const cellPriority = row.insertCell(); const priorityBadge = document.createElement('span'); priorityBadge.className = 'priority-badge'; let priorityText = translations[currentLang]?.['task_form_priority_medium'] || 'Moyenne'; let priorityClass = 'priority-medium'; if (task.priorite === 1) { priorityText = translations[currentLang]?.['task_form_priority_low'] || 'Basse'; priorityClass = 'priority-low'; } else if (task.priorite === 3) { priorityText = translations[currentLang]?.['task_form_priority_high'] || 'Haute'; priorityClass = 'priority-high'; } priorityBadge.textContent = priorityText; priorityBadge.classList.add(priorityClass); cellPriority.appendChild(priorityBadge);
        const cellStatus = row.insertCell(); const statusBadge = document.createElement('span'); statusBadge.className = 'status-badge'; let statusText = translations[currentLang]?.['task_form_status_todo'] || 'À faire'; let statusClass = 'status-todo'; if (task.statut === 'inprogress') { statusText = translations[currentLang]?.['task_form_status_inprogress'] || 'En cours'; statusClass = 'status-inprogress'; } else if (task.statut === 'done') { statusText = translations[currentLang]?.['task_form_status_done'] || 'Terminé'; statusClass = 'status-done'; } statusBadge.textContent = statusText; statusBadge.classList.add(statusClass); cellStatus.appendChild(statusBadge);
        row.insertCell().textContent = task.categorie_departement || '-';
        const cellActions = row.insertCell(); cellActions.className = 'task-actions'; cellActions.innerHTML = `<button title="Modifier" data-action="edit-task" data-task-id="${task.id}" class="p-1"><svg class="w-4 h-4 pointer-events-none" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" /></svg></button> <button title="Supprimer" data-action="delete-task" data-task-id="${task.id}" class="p-1 delete-btn"><svg class="w-4 h-4 pointer-events-none" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg></button>`;
    });
    container.appendChild(table);
}

// --- Chargement Initial & Export ---

/** Charge les tâches depuis l'API et les affiche */
export async function loadTasks() {
    if (!tasksListContainer) { console.error("Conteneur '#tasks-list-container' non trouvé."); return; }
    tasksListContainer.innerHTML = '<div class="text-center py-10 text-gray-500">Chargement des tâches...</div>';
    try {
        const tasks = await api.fetchTasks();
        renderTasksList(tasksListContainer, tasks);
        // (Ré)attacher les listeners spécifiques à la liste après le rendu
        initTaskListEventListeners();
    } catch (error) {
        console.error("Erreur loadTasks:", error);
        const currentLang = document.documentElement.lang || 'fr';
        const errorText = translations[currentLang]?.['no_tasks_found'] || 'Erreur chargement tâches.';
        tasksListContainer.innerHTML = `<div class="tasks-empty-message text-red-600">${errorText} (${error.message})</div>`;
    }
}

// --- Gestion des Événements ---

/** Gère le clic sur la checkbox d'une tâche pour ouvrir la modale d'action */
function handleTaskCheckboxClick(event) {
    const checkbox = event.target;
    const taskId = checkbox.dataset.taskId;
    const taskTitle = checkbox.dataset.taskTitle || 'Inconnu';
    console.log(`Checkbox cliquée pour Tâche ID: ${taskId} (${taskTitle})`);
    checkbox.checked = !checkbox.checked; // Annuler le changement visuel immédiat
    showTaskActionModal(taskId, taskTitle); // Ouvrir la modale d'action
}

/** Initialise les écouteurs d'événements spécifiques à la section Tâches */
export function initTaskEventListeners() {
    console.log("Initialisation des listeners pour la section Tâches...");

    // Bouton "Créer une tâche"
    if (createTaskBtn) {
        createTaskBtn.removeEventListener('click', showCreateTaskModal); // Eviter doublons
        createTaskBtn.addEventListener('click', showCreateTaskModal);
    } else {
        console.warn("Bouton 'create-task-btn' non trouvé pour listener.");
    }

    // Modale Création Tâche
    if (cancelCreateTaskBtn) {
        cancelCreateTaskBtn.removeEventListener('click', hideCreateTaskModal);
        cancelCreateTaskBtn.addEventListener('click', hideCreateTaskModal);
    }
    if (createTaskModal) {
        createTaskModal.removeEventListener('click', handleCreateTaskModalOverlayClick);
        createTaskModal.addEventListener('click', handleCreateTaskModalOverlayClick);
    }
    if (createTaskForm) {
        createTaskForm.removeEventListener('submit', handleCreateTaskSubmit);
        createTaskForm.addEventListener('submit', handleCreateTaskSubmit);
    }

    // Modale Action Tâche
    if (taskActionChangeStatusBtn) {
        taskActionChangeStatusBtn.removeEventListener('click', handleShowStatusChanger);
        taskActionChangeStatusBtn.addEventListener('click', handleShowStatusChanger);
    }
    if (taskActionConfirmStatusBtn) {
        taskActionConfirmStatusBtn.removeEventListener('click', handleConfirmStatusChange);
        taskActionConfirmStatusBtn.addEventListener('click', handleConfirmStatusChange);
    }
    if (taskActionDeleteBtn) {
        taskActionDeleteBtn.removeEventListener('click', handleDeleteTask);
        taskActionDeleteBtn.addEventListener('click', handleDeleteTask);
    }
    if (taskActionCancelBtn) {
        taskActionCancelBtn.removeEventListener('click', hideTaskActionModal);
        taskActionCancelBtn.addEventListener('click', hideTaskActionModal);
    }
    if (taskActionModal) {
        taskActionModal.removeEventListener('click', handleTaskActionModalOverlayClick);
        taskActionModal.addEventListener('click', handleTaskActionModalOverlayClick);
    }

    // Listener délégué pour les actions sur la liste des tâches
    initTaskListEventListeners(); // Appel initial pour la liste déjà affichée
}

/** Attache les listeners à la liste des tâches (appelé après chaque render) */
function initTaskListEventListeners() {
     if (tasksListContainer) {
        // Supprimer l'ancien listener pour éviter les doublons si la liste est re-rendue
        tasksListContainer.removeEventListener('click', handleTaskListClick);
        // Ajouter le nouveau listener
        tasksListContainer.addEventListener('click', handleTaskListClick);
    } else {
         console.warn("Conteneur '#tasks-list-container' non trouvé pour attacher les listeners de liste.");
    }
}

// Handler pour les clics délégués sur la liste des tâches
function handleTaskListClick(event) {
    const button = event.target.closest('button[data-action]');
    const checkbox = event.target.closest('input[type="checkbox"].task-checkbox');

    if (button) {
        const action = button.dataset.action;
        const taskId = button.dataset.taskId;
        const taskTitle = button.closest('tr')?.querySelector('.task-title')?.textContent; // Récupérer le titre depuis la ligne
        if (action === 'edit-task') {
            console.log(`Action: Modifier tâche ${taskId}`);
            alert(`Modifier tâche ${taskId} (à implémenter)`);
            // TODO: Ouvrir une modale d'édition de tâche
        } else if (action === 'delete-task') {
            console.log(`Action: Supprimer tâche ${taskId} via bouton`);
            showTaskActionModal(taskId, taskTitle); // Ouvrir la modale d'action pour confirmation
        }
    } else if (checkbox) {
        handleTaskCheckboxClick(event); // Gérer le clic sur la checkbox
    }
}


// --- Handlers pour les événements des modales ---

function handleCreateTaskModalOverlayClick(event) {
    if (event.target === createTaskModal) {
        hideCreateTaskModal();
    }
}

async function handleCreateTaskSubmit(event) {
    event.preventDefault();
    const submitButton = createTaskForm.querySelector('button[type="submit"]');
    const originalButtonTextKey = "task_form_create";
    const currentLang = document.documentElement.lang || 'fr';
    const originalButtonText = translations[currentLang]?.[originalButtonTextKey] || "Créer la tâche";

    submitButton.disabled = true;
    submitButton.textContent = "Création...";
    if(createTaskErrorElement) createTaskErrorElement.textContent = '';

    const formData = new FormData(createTaskForm);
    const taskData = Object.fromEntries(formData.entries());
    taskData.priorite = taskData.priorite || '2'; // Assurer une valeur par défaut

    console.log("Données création tâche (avant envoi):", taskData);
    try {
        const result = await api.createTask(taskData);
        console.log("Tâche créée:", result.task);
        hideCreateTaskModal();
        loadTasks(); // Recharger la liste des tâches
    } catch (error) {
        console.error("Erreur création tâche:", error);
        if(createTaskErrorElement) createTaskErrorElement.textContent = error.message || "Erreur.";
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
    }
}

function handleShowStatusChanger() {
     if (taskActionStatusChanger) taskActionStatusChanger.classList.remove('hidden');
}

async function handleConfirmStatusChange() {
    if (!currentTaskActionId || !taskActionNewStatusSelect) return;
    const newStatus = taskActionNewStatusSelect.value;
    const isCompleted = (newStatus === 'done') ? 1 : 0;
    console.log(`Confirmer changement statut tâche ${currentTaskActionId} à ${newStatus}`);

    taskActionConfirmStatusBtn.disabled = true;
    taskActionConfirmStatusBtn.textContent = "Maj...";
    if(taskActionError) taskActionError.textContent = '';

    try {
        await api.updateTaskStatus(currentTaskActionId, { statut: newStatus, est_complete: isCompleted });
        console.log("Statut MàJ succès");
        hideTaskActionModal();
        loadTasks(); // Recharger la liste des tâches
    } catch (error) {
        console.error("Erreur MàJ statut:", error);
        if(taskActionError) taskActionError.textContent = error.message || "Erreur MàJ statut.";
    } finally {
        taskActionConfirmStatusBtn.disabled = false;
        taskActionConfirmStatusBtn.textContent = translations[document.documentElement.lang || 'fr']?.['task_action_confirm_status'] || "Valider Statut";
    }
}

async function handleDeleteTask() {
    if (!currentTaskActionId) return;
    const taskTitle = taskActionModalTitle?.textContent.replace('Tâche : ','') || `ID ${currentTaskActionId}`;
    const currentLang = document.documentElement.lang || 'fr';
    const confirmMsg = translations[currentLang]?.['task_delete_confirm_text'] || `Supprimer la tâche "${taskTitle}" ?`;

    // Utilisation de la modale de confirmation native pour l'instant
    if (confirm(confirmMsg)) {
        console.log(`Confirmer suppression tâche ${currentTaskActionId}`);
        taskActionDeleteBtn.disabled = true;
        taskActionDeleteBtn.textContent = "Suppression...";
        if(taskActionError) taskActionError.textContent = '';

        try {
            await api.deleteTask(currentTaskActionId);
            console.log("Tâche supprimée succès");
            hideTaskActionModal();
            loadTasks(); // Recharger la liste des tâches
        } catch (error) {
            console.error("Erreur suppression:", error);
            if(taskActionError) taskActionError.textContent = error.message || "Erreur suppression.";
        } finally {
            taskActionDeleteBtn.disabled = false;
            taskActionDeleteBtn.textContent = translations[currentLang]?.['task_action_delete'] || "Supprimer";
        }
    }
}

function handleTaskActionModalOverlayClick(event) {
     if (event.target === taskActionModal) {
        hideTaskActionModal();
    }
}
