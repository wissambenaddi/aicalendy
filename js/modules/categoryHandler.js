/**
 * Fichier : js/modules/categoryHandler.js
 * Description : Gère la logique spécifique à la section "Mes Catégories".
 */

import { translations, setLanguage } from './translator.js';
import * as api from './core/api.js';
import * as utils from './core/utils.js';
import { renderList } from './core/dashboard.js'; // <<< Import de renderList depuis dashboard.js (dans core)

// Références aux éléments de la modale de création
const createCategoryModal = document.getElementById('create-category-modal');
const createCategoryForm = document.getElementById('create-category-form');
const cancelCreateCategoryBtn = document.getElementById('cancel-create-category-btn');
const createCategoryErrorElement = document.getElementById('create-category-error');
const categoriesContentContainer = document.getElementById('categories-content'); // Conteneur principal de la section

// --- Fonctions Modales Catégories ---
function showCreateCategoryModal() {
    if (createCategoryModal) {
        createCategoryForm?.reset();
        if(createCategoryErrorElement) createCategoryErrorElement.textContent = '';
        createCategoryModal.classList.add('active');
        createCategoryForm?.querySelector('input[name="titre"]')?.focus();
    } else {
        console.error("Modal 'create-category-modal' not found.");
    }
 }
function hideCreateCategoryModal() {
    if (createCategoryModal) {
        createCategoryModal.classList.remove('active');
    }
}

// --- Fonctions d'Affichage Catégories ---

/** Génère et affiche les cartes de catégories dans le conteneur spécifié. */
function renderCategoryCards(container, categories) {
    if (!container) { console.error("Conteneur de catégories non trouvé."); return; }
    const currentLang = document.documentElement.lang || 'fr';
    container.innerHTML = ''; // Vider

    // --- Header Section Catégories ---
    const title = document.createElement('h1'); title.className = 'text-2xl md:text-3xl font-bold text-gray-900'; title.dataset.translateKey = 'categories_section_title'; title.textContent = translations[currentLang]?.['categories_section_title'] || 'Mes Catégories';
    const createBtn = document.createElement('button'); createBtn.id = 'create-category-btn'; createBtn.className = 'inline-flex items-center px-4 py-2 bg-indigo-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-indigo-700 active:bg-indigo-800 focus:outline-none focus:border-indigo-800 focus:ring focus:ring-indigo-300 disabled:opacity-25 transition'; const createBtnText = translations[currentLang]?.['dashboard_create_category'] || 'Créer'; createBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4 mr-2 -ml-1"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg><span data-translate-key="dashboard_create_category">${createBtnText}</span>`;
    // Le listener sera ajouté dans initCategoryEventListeners
    const headerDiv = document.createElement('div'); headerDiv.className = 'flex justify-between items-center mb-6'; headerDiv.appendChild(title); headerDiv.appendChild(createBtn);
    container.appendChild(headerDiv);
    // --- Fin Header ---

    // --- Grid ou Message Vide ---
    if (!categories || categories.length === 0) {
        console.log("renderCategoryCards: Aucune catégorie à afficher."); // DEBUG LOG
        const emptyText = translations[currentLang]?.['no_categories_found'] || 'Aucune catégorie créée.';
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'text-center py-10 text-gray-500';
        emptyDiv.textContent = emptyText;
        container.appendChild(emptyDiv);
    } else {
        console.log(`renderCategoryCards: Affichage de ${categories.length} catégories.`); // DEBUG LOG
        const grid = document.createElement('div'); grid.className = 'category-grid';
        categories.forEach(cat => {
            const card = document.createElement('div'); card.className = 'category-card'; card.dataset.categoryId = cat.id; card.dataset.categoryName = cat.titre;
            const colorBar = document.createElement('div'); colorBar.className = 'category-card-color-bar'; if (cat.couleur) colorBar.style.backgroundColor = cat.couleur; card.appendChild(colorBar);
            const content = document.createElement('div'); content.className = 'category-card-content'; const iconHTML = cat.icone ? `<span class="text-xl mr-2">${cat.icone}</span>` : ''; content.innerHTML = `<h3 class="category-card-title flex items-center">${iconHTML}${cat.titre || 'Sans titre'}</h3> <p class="text-xs text-gray-500 mb-1">Dép: ${cat.departement || '-'}</p> <p class="text-xs text-gray-500 mb-2">Resp: ${cat.responsable || '-'}</p> <p class="category-card-description">${cat.description || 'Pas de description.'}</p>`; card.appendChild(content);
            const footer = document.createElement('div'); footer.className = 'category-card-footer'; const actionsText = translations[currentLang]?.['card_actions'] || 'Actions :'; footer.innerHTML = `<span class="text-xs text-gray-500" data-translate-key="card_actions">${actionsText}</span> <div class="category-card-actions"> <button title="${translations[currentLang]?.['action_view_appointments'] || 'Voir RDV'}" data-action="view" data-category-id="${cat.id}" data-category-name="${cat.titre}" aria-label="${translations[currentLang]?.['action_view_appointments'] || 'Voir RDV'}" class="p-1 text-gray-500 hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 rounded-full hover:bg-gray-100"> <svg class="w-5 h-5 pointer-events-none" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg> </button> <button title="${translations[currentLang]?.['action_edit'] || 'Modifier'}" data-action="edit" data-category-id="${cat.id}" aria-label="${translations[currentLang]?.['action_edit'] || 'Modifier'}" class="p-1 text-gray-500 hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 rounded-full hover:bg-gray-100"> <svg class="w-5 h-5 pointer-events-none" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" /></svg> </button> <button title="${translations[currentLang]?.['action_delete'] || 'Supprimer'}" data-action="delete" data-category-id="${cat.id}" data-category-name="${cat.titre}" aria-label="${translations[currentLang]?.['action_delete'] || 'Supprimer'}" class="p-1 text-red-500 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 rounded-full hover:bg-red-50"> <svg class="w-5 h-5 pointer-events-none" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg> </button> </div>`;
            card.appendChild(footer); grid.appendChild(card);
        });
        container.appendChild(grid);
    }
    setLanguage(currentLang); // Appliquer traductions
}

/** Charge et affiche les RDV pour une catégorie spécifique */
async function loadCategoryAppointments(categoryId, categoryName) {
    const container = categoriesContentContainer; // Utiliser la référence globale
    if (!container) return;
    const currentLang = document.documentElement.lang || 'fr';
    container.innerHTML = `<div class="text-center py-10 text-gray-500">Chargement RDV pour ${categoryName}...</div>`;
    try {
        const appointments = await api.fetchAppointments({ category_id: categoryId });
        container.innerHTML = ''; // Vider le conteneur
        const backButton = document.createElement('button');
        backButton.id = 'back-to-categories-btn';
        backButton.className = 'back-button';
        const backText = translations[currentLang]?.['back_to_categories'] || 'Retour';
        backButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" /></svg> ${backText}`;
        // Le listener pour ce bouton est maintenant géré par handleCategorySectionClick
        // backButton.addEventListener('click', loadCategories); // Supprimé
        container.appendChild(backButton);

        const title = document.createElement('h1');
        title.className = 'text-2xl md:text-3xl font-bold text-gray-900 mb-6';
        let titleText = translations[currentLang]?.['category_appointments_title'] || 'RDV pour : {categoryName}';
        title.textContent = titleText.replace('{categoryName}', categoryName);
        container.appendChild(title);

        const listContainer = document.createElement('div');
        listContainer.className = 'dashboard-list-section';
        const listElement = document.createElement('ul');
        listElement.id = 'category-appointments-list';
        listElement.className = 'dashboard-list';
        listContainer.appendChild(listElement);
        container.appendChild(listContainer);

        // Utilisation de la fonction renderList importée depuis dashboard.js
        renderList(listElement, appointments, 'appointments');

         // S'assurer que la traduction est appliquée après le rendu dynamique
         setLanguage(currentLang);

    } catch (error) {
        console.error(`Erreur chargement RDV cat ${categoryId}:`, error);
        container.innerHTML = `<div class="text-center py-10 text-red-600">Erreur chargement RDV: ${error.message}</div>`;
    }
}


// --- Chargement Initial & Export ---

/** Charge et affiche les catégories (Fonction principale pour cette section) */
export async function loadCategories() {
    const container = categoriesContentContainer;
    if (!container) { console.error("Conteneur '#categories-content' non trouvé."); return; }
    console.log("loadCategories: Début du chargement..."); // DEBUG LOG
    container.innerHTML = '<div class="text-center py-10 text-gray-500">Chargement catégories...</div>'; // Message initial

    try {
        const categories = await api.fetchCategories(); // Appel API
        console.log("loadCategories: Catégories reçues de l'API:", categories); // DEBUG LOG

        // Appel du rendu, que la liste soit vide ou non
        renderCategoryCards(container, categories);

        // Les listeners sont (ré)attachés seulement si nécessaire (ou une seule fois via init)
        // initCategoryEventListeners(); // Normalement appelé une seule fois au début

    } catch (error) {
        console.error("Erreur loadCategories:", error); // DEBUG LOG
        const currentLang = document.documentElement.lang || 'fr';
        // Utiliser une clé de traduction générique pour les erreurs de chargement si possible
        const errorText = translations[currentLang]?.['error_loading_categories'] || 'Erreur chargement catégories.';
        // Afficher l'erreur DANS le conteneur
        container.innerHTML = `<div class="text-center py-10 text-red-600">${errorText} (${error.message || 'Erreur inconnue'})</div>`;
        setLanguage(currentLang); // Traduire le message d'erreur si possible
    } finally {
         console.log("loadCategories: Fin de l'exécution."); // DEBUG LOG
    }
}


// --- Gestion des Événements ---

/** Initialise les écouteurs d'événements spécifiques à la section Catégories */
export function initCategoryEventListeners() {
    console.log("Initialisation des listeners pour la section Catégories...");
    if (categoriesContentContainer) {
        // Utiliser la délégation d'événements sur le conteneur principal
        categoriesContentContainer.removeEventListener('click', handleCategorySectionClick); // Eviter doublons
        categoriesContentContainer.addEventListener('click', handleCategorySectionClick);
    } else {
        console.warn("Conteneur '#categories-content' non trouvé pour attacher les listeners.");
    }

    // Listeners pour la modale de création (attachés une seule fois)
    if (cancelCreateCategoryBtn) {
        cancelCreateCategoryBtn.removeEventListener('click', hideCreateCategoryModal);
        cancelCreateCategoryBtn.addEventListener('click', hideCreateCategoryModal);
    }
    if (createCategoryModal) {
        createCategoryModal.removeEventListener('click', handleCategoryModalOverlayClick);
        createCategoryModal.addEventListener('click', handleCategoryModalOverlayClick);
    }
    if (createCategoryForm) {
        createCategoryForm.removeEventListener('submit', handleCreateCategorySubmit);
        createCategoryForm.addEventListener('submit', handleCreateCategorySubmit);
    }
}

// Handler unique pour les clics dans la section catégorie (délégation)
async function handleCategorySectionClick(event) {
    const createButton = event.target.closest('#create-category-btn');
    const actionButton = event.target.closest('button[data-action]');
    const backButton = event.target.closest('#back-to-categories-btn'); // Gérer le bouton retour

    if (createButton) {
        showCreateCategoryModal();
    } else if (actionButton) {
        handleCategoryCardAction(actionButton); // Passer le bouton directement
    } else if (backButton) {
        loadCategories(); // Recharger la vue principale des catégories
    }
}


// Handler pour les actions sur les cartes catégorie
async function handleCategoryCardAction(button) { // Reçoit le bouton cliqué
    const action = button.dataset.action;
    const categoryId = button.dataset.categoryId;
    const categoryName = button.dataset.categoryName; // Récupérer le nom depuis data attribute

    switch (action) {
        case 'view':
            console.log(`Action: Voir les RDV pour catégorie ${categoryId} (${categoryName})`);
            loadCategoryAppointments(categoryId, categoryName);
            break;
        case 'edit':
            console.log(`Action: Modifier catégorie ${categoryId}`);
            alert(`Modifier catégorie ${categoryId} (à implémenter)`);
            // TODO: Implémenter la modale d'édition de catégorie
            break;
        case 'delete':
            console.log(`Action: Supprimer catégorie ${categoryId}`);
            const currentLang = document.documentElement.lang || 'fr';
            let confirmMsg = translations[currentLang]?.['category_delete_confirm_text'] || 'Supprimer "{categoryName}" ?';
            confirmMsg = confirmMsg.replace('{categoryName}', categoryName || `ID ${categoryId}`);
            if (confirm(confirmMsg)) {
                console.log(`Confirmer suppression catégorie ${categoryId}`);
                button.disabled = true;
                try {
                    await api.deleteCategory(categoryId);
                    console.log("Catégorie supprimée");
                    loadCategories(); // Recharger la vue des catégories
                } catch (error) {
                    console.error("Erreur suppression cat:", error);
                    alert(`Erreur: ${error.message || 'Impossible de supprimer.'}`);
                    button.disabled = false; // Réactiver si erreur
                }
            }
            break;
    }
}

// Handler pour la soumission du formulaire de création
async function handleCreateCategorySubmit(event) {
    event.preventDefault();
    const submitButton = createCategoryForm.querySelector('button[type="submit"]');
    const originalButtonTextKey = "category_form_create";
    const currentLang = document.documentElement.lang || 'fr';
    const originalButtonText = translations[currentLang]?.[originalButtonTextKey] || "Créer";

    submitButton.disabled = true;
    submitButton.textContent = "Création...";
    if(createCategoryErrorElement) createCategoryErrorElement.textContent = '';

    const formData = new FormData(createCategoryForm);
    const categoryData = Object.fromEntries(formData.entries());
    // Assigner null si vide pour éviter d'envoyer des chaînes vides
    categoryData.description = categoryData.description || null;
    categoryData.couleur = categoryData.couleur || '#4f46e5'; // Couleur par défaut
    categoryData.icone = categoryData.icone || null;
    categoryData.departement = categoryData.departement || null;
    categoryData.responsable = categoryData.responsable || null;

    try {
        const result = await api.createCategory(categoryData);
        console.log("Catégorie créée:", result.category);
        hideCreateCategoryModal();
        loadCategories(); // Recharger la vue des catégories
    } catch (error) {
        console.error("Erreur création:", error);
        if(createCategoryErrorElement) createCategoryErrorElement.textContent = error.message || "Erreur.";
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
    }
}

// Handler pour clic sur l'overlay de la modale
function handleCategoryModalOverlayClick(event) {
    if (event.target === createCategoryModal) {
        hideCreateCategoryModal();
    }
}
