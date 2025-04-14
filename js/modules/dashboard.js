/**
 * Fichier : js/modules/dashboard.js
 * Description : Gère la logique et les interactions spécifiques
 * à la page du tableau de bord (dashboard_user.html), y compris la navigation
 * entre les sections, les actions sur les cartes et la modale de déconnexion.
 */

// Importation nécessaire si on veut utiliser setLanguage pour le titre principal
// et que translator.js l'exporte correctement.
// import { setLanguage } from './translator.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log('Dashboard JS loaded');

    const sidebarNav = document.querySelector('aside nav');
    const mainContentContainer = document.querySelector('main'); // Conteneur principal

    // Références pour la modale de déconnexion
    const logoutModal = document.getElementById('logout-confirm-modal');
    const confirmLogoutBtn = document.getElementById('confirm-logout-btn');
    const cancelLogoutBtn = document.getElementById('cancel-logout-btn');
    // const closeModalBtn = document.getElementById('close-modal-btn'); // Décommentez si vous ajoutez un bouton X

    // --- Gestion de la navigation par section ---

    // Fonction pour afficher la section demandée et mettre à jour les états actifs
    function showSection(sectionId) {
        console.log(`Showing section: ${sectionId}`);
        let sectionFound = false;

        // Masquer toutes les sections dans <main>
        mainContentContainer?.querySelectorAll('.main-section').forEach(section => {
            section.classList.remove('active'); // Utilise la classe CSS pour masquer
        });

        // Afficher la section cible
        const targetSection = document.getElementById(`${sectionId}-content`);
        if (targetSection) {
            targetSection.classList.add('active'); // Utilise la classe CSS pour afficher
            sectionFound = true;
        } else {
            // Si la section demandée n'existe pas (ex: hash invalide), afficher le dashboard par défaut
            console.warn(`Content section with id "${sectionId}-content" not found.`);
            const fallbackSection = document.getElementById('dashboard-content');
            if (fallbackSection) {
                fallbackSection.classList.add('active');
                sectionId = 'dashboard'; // Corriger l'ID pour la suite
                sectionFound = true;
                // Optionnel : corriger le hash dans l'URL si on tombe sur le fallback
                // window.location.hash = sectionId; // Attention, cela peut re-déclencher hashchange
            }
        }

        // Si une section est bien affichée (cible ou fallback)
        if(sectionFound) {
            // Mettre à jour le lien actif dans la sidebar
            sidebarNav?.querySelectorAll('.sidebar-link').forEach(link => {
                link.classList.remove('active');
                // Compare l'attribut href du lien (ex: #categories) avec l'ID de la section affichée
                if (link.getAttribute('href') === `#${sectionId}`) {
                    link.classList.add('active');
                }
            });

            // Mettre à jour le titre principal (H1) DANS la section qui vient d'être activée
            const activeSection = document.getElementById(`${sectionId}-content`);
            const mainTitleElement = activeSection?.querySelector('h1[data-translate-key]'); // Cible le H1 avec la clé

            if (mainTitleElement) {
                const titleKey = `${sectionId}_section_title`; // Construit la clé (ex: categories_section_title)
                mainTitleElement.dataset.translateKey = titleKey; // Assigne la bonne clé au H1

                // Essayer de retraduire le titre (et le reste) en utilisant setLanguage
                try {
                    // Vérifie si la fonction setLanguage est disponible (importée ou globale)
                    if (typeof setLanguage === 'function') {
                        const currentLang = document.documentElement.lang || 'fr';
                        setLanguage(currentLang); // Appelle setLanguage pour mettre à jour les traductions
                    } else {
                         console.warn("setLanguage function not available. Cannot update title translation dynamically.");
                         // Alternative : Mettre à jour manuellement si setLanguage n'est pas importable
                         // mais nécessite l'accès à l'objet 'translations'
                    }
                } catch (e) {
                    console.error("Error trying to call setLanguage for title update:", e);
                }
            } else {
                 console.warn(`H1 title element with data-translate-key not found in active section: ${sectionId}-content`);
            }
        }
    }

    // Gestionnaire d'événements pour les clics sur les liens de la sidebar (délégation d'événement)
    if (sidebarNav) {
        sidebarNav.addEventListener('click', (event) => {
            // Trouve le lien <a> le plus proche qui a été cliqué
            const link = event.target.closest('a.sidebar-link');
            // Vérifie si c'est bien un lien interne de section (commence par #)
            if (link && link.getAttribute('href')?.startsWith('#')) {
                event.preventDefault(); // Empêche le comportement par défaut du lien (#)
                const sectionId = link.getAttribute('href').substring(1); // Récupère l'ID sans le #
                // Met à jour le hash dans l'URL (ce qui déclenchera l'événement 'hashchange')
                window.location.hash = sectionId;
            }
        });
    }

     // Gestionnaire pour le changement de hash (boutons précédent/suivant, clic sur lien)
     window.addEventListener('hashchange', () => {
         // Récupère le nouvel ID depuis le hash, ou utilise 'dashboard' par défaut
         const sectionId = window.location.hash ? window.location.hash.substring(1) : 'dashboard';
         showSection(sectionId); // Affiche la section correspondante
     });


    // Afficher la section initiale correcte au chargement de la page
    const initialSectionId = window.location.hash ? window.location.hash.substring(1) : 'dashboard';
    showSection(initialSectionId);


    // --- Logique pour les boutons d'action des cartes (dans la section catégories) ---
    const categoriesContent = document.getElementById('categories-content');
    if (categoriesContent) {
        categoriesContent.addEventListener('click', (event) => {
             const button = event.target.closest('button[data-translate-key]');
             // Vérifie si c'est un bouton d'action de carte
             if (!button || !button.dataset.translateKey.startsWith('action_')) return;

             const card = button.closest('.bg-white');
             const categoryTitleElement = card?.querySelector('[data-translate-key$="_title"]');
             const categoryTitle = categoryTitleElement ? categoryTitleElement.textContent : 'Catégorie inconnue';
             const actionKey = button.dataset.translateKey;

             // Exécute l'action correspondante (placeholders actuels)
             switch (actionKey) {
                case 'action_copy_link': console.log(`Action: Copier le lien pour "${categoryTitle}"`); alert(`Copier lien pour ${categoryTitle} (à implémenter)`); break;
                case 'action_view_appointments': console.log(`Action: Voir les rendez-vous pour "${categoryTitle}"`); alert(`Voir RDV pour ${categoryTitle} (à implémenter)`); break;
                case 'action_edit': console.log(`Action: Modifier la catégorie "${categoryTitle}"`); alert(`Modifier ${categoryTitle} (à implémenter)`); break;
                case 'action_delete': console.log(`Action: Supprimer la catégorie "${categoryTitle}"`); if (confirm(`Êtes-vous sûr de vouloir supprimer la catégorie "${categoryTitle}" ?`)) { alert(`Supprimer ${categoryTitle} (logique backend à implémenter)`); } break;
             }
        });
    }

    // --- Logique pour le bouton "Créer une catégorie" (dans la section catégories) ---
     const createCategoryButtonContainer = document.getElementById('categories-content');
     if (createCategoryButtonContainer) {
        const createCategoryButtonElement = createCategoryButtonContainer.querySelector('button span[data-translate-key="dashboard_create_category"]');
        if (createCategoryButtonElement) {
            const actualButton = createCategoryButtonElement.closest('button');
            if(actualButton) {
                actualButton.addEventListener('click', () => {
                    console.log('Action: Créer une nouvelle catégorie');
                    alert('Ouvrir formulaire/page de création de catégorie (à implémenter)');
                });
            }
        }
     }


    // --- Gestion de la Modale de Déconnexion ---

    // Fonction pour masquer la modale
     function hideLogoutModal() {
         if (logoutModal) {
             // Retire la classe du body pour déclencher la transition CSS de masquage
             document.body.classList.remove('modal-open');
         }
     }

     // Listener sur le lien "Se déconnecter" dans la sidebar
     const logoutLinkContainer = document.querySelector('aside');
     if (logoutLinkContainer) {
        const logoutLinkElement = logoutLinkContainer.querySelector('a span[data-translate-key="sidebar_logout"]');
         if (logoutLinkElement) {
             const actualLink = logoutLinkElement.closest('a');
             if(actualLink) {
                actualLink.addEventListener('click', (event) => {
                    event.preventDefault(); // Empêche la navigation si href="#"
                    console.log('Action: Ouvrir modale de déconnexion');
                    // Afficher la modale en ajoutant la classe au body
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
             // 2. Optionnel: Appeler une API backend /api/logout pour invalider le token côté serveur
             // --- Fin Actions ---

             // Redirection vers la page de connexion
             window.location.href = 'connexion_account.html';
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

     // Optionnel: Fermer la modale si on clique sur l'overlay (le fond sombre)
     if (logoutModal) {
         logoutModal.addEventListener('click', (event) => {
             // Ne ferme que si le clic est directement sur l'overlay
             if (event.target === logoutModal) {
                 hideLogoutModal();
             }
         });
     }

     // Optionnel: Fermer avec un bouton X (si ajouté dans le HTML avec id="close-modal-btn")
     // const closeModalBtn = document.getElementById('close-modal-btn');
     // if (closeModalBtn) {
     //     closeModalBtn.addEventListener('click', hideLogoutModal);
     // }

}); // Fin de l'écouteur DOMContentLoaded
