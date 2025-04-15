/**
 * Fichier : js/modules/dashboard.js
 * Description : Gère la logique et les interactions spécifiques
 * à la page du tableau de bord (dashboard_user.html), y compris la navigation,
 * les actions sur les cartes et la modale de déconnexion.
 */

// Importation nécessaire si on veut utiliser setLanguage pour le titre principal
// import { setLanguage } from './translator.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log('Dashboard JS loaded');

    const sidebarNav = document.querySelector('aside nav');
    const mainContentContainer = document.querySelector('main');

    // Références pour la modale de déconnexion
    const logoutModal = document.getElementById('logout-confirm-modal');
    const confirmLogoutBtn = document.getElementById('confirm-logout-btn');
    const cancelLogoutBtn = document.getElementById('cancel-logout-btn');
    // const closeModalBtn = document.getElementById('close-modal-btn');

    // --- Gestion de la navigation par section ---
    function showSection(sectionId) {
        // ... (code existant pour showSection - pas de changement ici) ...
        console.log(`Showing section: ${sectionId}`);
        let sectionFound = false;

        mainContentContainer?.querySelectorAll('.main-section').forEach(section => {
            section.classList.remove('active');
        });

        const targetSection = document.getElementById(`${sectionId}-content`);
        if (targetSection) {
            targetSection.classList.add('active');
            sectionFound = true;
        } else {
            console.warn(`Content section with id "${sectionId}-content" not found.`);
            const fallbackSection = document.getElementById('dashboard-content');
            if (fallbackSection) {
                fallbackSection.classList.add('active');
                sectionId = 'dashboard';
                sectionFound = true;
                window.location.hash = sectionId;
            }
        }

        if(sectionFound) {
            sidebarNav?.querySelectorAll('.sidebar-link').forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${sectionId}`) {
                    link.classList.add('active');
                }
            });

            const activeSection = document.getElementById(`${sectionId}-content`);
            const mainTitleElement = activeSection?.querySelector('h1[data-translate-key]');

            if (mainTitleElement) {
                const titleKey = `${sectionId}_section_title`;
                mainTitleElement.dataset.translateKey = titleKey;
                try {
                    if (typeof setLanguage === 'function') {
                        const currentLang = document.documentElement.lang || 'fr';
                        setLanguage(currentLang);
                    } else {
                         console.warn("setLanguage function not available for dynamic title update.");
                    }
                } catch (e) {
                    console.error("Error calling setLanguage:", e);
                }
            } else {
                 console.warn(`H1 title element with data-translate-key not found in active section: ${sectionId}-content`);
            }
        }
    }

    if (sidebarNav) {
        sidebarNav.addEventListener('click', (event) => {
            const link = event.target.closest('a.sidebar-link');
            if (link && link.getAttribute('href')?.startsWith('#')) {
                event.preventDefault();
                const sectionId = link.getAttribute('href').substring(1);
                if (window.location.hash !== `#${sectionId}`) {
                    window.location.hash = sectionId;
                } else {
                    showSection(sectionId);
                    const activeSectionContent = document.getElementById(`${sectionId}-content`);
                    activeSectionContent?.scrollTo(0, 0);
                }
            }
        });
    }

     window.addEventListener('hashchange', () => {
         const sectionId = window.location.hash ? window.location.hash.substring(1) : 'dashboard';
         showSection(sectionId);
     });

    const initialSectionId = window.location.hash ? window.location.hash.substring(1) : 'dashboard';
    showSection(initialSectionId);


    // --- Logique pour les boutons d'action des cartes ---
    // ... (code existant pour les actions des cartes - pas de changement ici) ...
    const categoriesContent = document.getElementById('categories-content');
    if (categoriesContent) {
        categoriesContent.addEventListener('click', (event) => {
             const button = event.target.closest('button[data-translate-key]');
             if (!button || !button.dataset.translateKey.startsWith('action_')) return;
             const card = button.closest('.bg-white');
             const categoryTitleElement = card?.querySelector('[data-translate-key$="_title"]');
             const categoryTitle = categoryTitleElement ? categoryTitleElement.textContent : 'Catégorie inconnue';
             const actionKey = button.dataset.translateKey;
             switch (actionKey) { /* ... cas existants ... */
                case 'action_copy_link': console.log(`Action: Copier le lien pour "${categoryTitle}"`); alert(`Copier lien pour ${categoryTitle} (à implémenter)`); break;
                case 'action_view_appointments': console.log(`Action: Voir les rendez-vous pour "${categoryTitle}"`); alert(`Voir RDV pour ${categoryTitle} (à implémenter)`); break;
                case 'action_edit': console.log(`Action: Modifier la catégorie "${categoryTitle}"`); alert(`Modifier ${categoryTitle} (à implémenter)`); break;
                case 'action_delete': console.log(`Action: Supprimer la catégorie "${categoryTitle}"`); if (confirm(`Êtes-vous sûr de vouloir supprimer la catégorie "${categoryTitle}" ?`)) { alert(`Supprimer ${categoryTitle} (logique backend à implémenter)`); } break;
             }
        });
    }
     const createCategoryButtonContainer = document.getElementById('categories-content');
     if (createCategoryButtonContainer) {
        const createCategoryButtonElement = createCategoryButtonContainer.querySelector('button span[data-translate-key="dashboard_create_category"]');
        if (createCategoryButtonElement) {
            const actualButton = createCategoryButtonElement.closest('button');
            if(actualButton) { actualButton.addEventListener('click', () => { console.log('Action: Créer une nouvelle catégorie'); alert('Ouvrir formulaire/page de création de catégorie (à implémenter)'); }); }
        }
     }


    // --- Gestion de la Modale de Déconnexion ---

    function hideLogoutModal() {
         if (logoutModal) {
             document.body.classList.remove('modal-open');
         }
     }

     // Listener sur le lien "Se déconnecter"
     const logoutLinkContainer = document.querySelector('aside');
     if (logoutLinkContainer) {
        const logoutLinkElement = logoutLinkContainer.querySelector('a span[data-translate-key="sidebar_logout"]');
         if (logoutLinkElement) {
             const actualLink = logoutLinkElement.closest('a');
             if(actualLink) {
                actualLink.addEventListener('click', (event) => {
                    event.preventDefault();
                    console.log('Action: Ouvrir modale de déconnexion');
                    if (logoutModal) {
                        document.body.classList.add('modal-open');
                    }
                });
             }
         }
     }

     // Listener sur le bouton "Continuer" de la modale
     if (confirmLogoutBtn) {
         confirmLogoutBtn.addEventListener('click', () => {
             console.log('Action: Déconnexion confirmée');
             // --- Actions de déconnexion réelles (à implémenter) ---
             // 1. Effacer le token stocké : localStorage.removeItem('authToken');
             // 2. Optionnel: Appeler une API backend /api/logout
             // --- Fin Actions ---

             // === MODIFIÉ : Redirection vers index.html ===
             window.location.href = 'index.html';
             // ============================================
             hideLogoutModal(); // Masquer la modale
         });
     }

     // Listener sur le bouton "Annuler" de la modale
     if (cancelLogoutBtn) {
         cancelLogoutBtn.addEventListener('click', () => {
             console.log('Action: Déconnexion annulée');
             hideLogoutModal(); // Masquer la modale
         });
     }

     // Optionnel: Fermer la modale si on clique sur l'overlay
     if (logoutModal) {
         logoutModal.addEventListener('click', (event) => {
             if (event.target === logoutModal) {
                 hideLogoutModal();
             }
         });
     }

     // Optionnel: Fermer avec un bouton X
     // const closeModalBtn = document.getElementById('close-modal-btn');
     // if (closeModalBtn) {
     //     closeModalBtn.addEventListener('click', hideLogoutModal);
     // }

}); // Fin de DOMContentLoaded
