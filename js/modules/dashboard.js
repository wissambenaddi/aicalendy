/**
 * Fichier : js/modules/dashboard.js
 * Description : Gère la logique et les interactions spécifiques
 * à la page du tableau de bord (dashboard_user.html), y compris la navigation
 * entre les sections et les actions sur les cartes.
 */

// Importation nécessaire si on veut utiliser setLanguage pour le titre principal
// Décommentez la ligne suivante si translator.js exporte bien setLanguage
// import { setLanguage } from './translator.js';

// Essayons d'importer l'objet translations directement pour le fallback
// Décommentez la ligne suivante si translator.js exporte l'objet translations
// import { translations } from './translator.js'; // Assurez-vous que translator.js exporte 'translations'

document.addEventListener('DOMContentLoaded', () => {
    console.log('Dashboard JS loaded');

    const sidebarNav = document.querySelector('aside nav');
    const mainContentContainer = document.querySelector('main'); // Conteneur principal
    // Le titre H1 sera recherché dans la section active au moment du changement

    // --- Gestion de la navigation par section ---

    // Fonction pour afficher la section demandée et mettre à jour les états actifs
    function showSection(sectionId) {
        console.log(`Showing section: ${sectionId}`);
        let sectionFound = false;

        // Masquer toutes les sections
        mainContentContainer?.querySelectorAll('.main-section').forEach(section => {
            section.classList.remove('active');
        });

        // Afficher la section cible
        const targetSection = document.getElementById(`${sectionId}-content`);
        if (targetSection) {
            targetSection.classList.add('active');
            sectionFound = true;
        } else {
            console.warn(`Content section with id "${sectionId}-content" not found.`);
            // Fallback sur la section dashboard si la section demandée n'existe pas
            const fallbackSection = document.getElementById('dashboard-content');
            if (fallbackSection) {
                fallbackSection.classList.add('active');
                sectionId = 'dashboard'; // Mettre à jour l'ID pour le reste de la logique
                sectionFound = true;
                 // Mettre à jour le hash de l'URL pour refléter le fallback
                window.location.hash = sectionId;
            }
        }

        // Si au moins une section est affichée (cible ou fallback)
        if(sectionFound) {
            // Mettre à jour le lien actif dans la sidebar
            sidebarNav?.querySelectorAll('.sidebar-link').forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${sectionId}`) {
                    link.classList.add('active');
                }
            });

            // Mettre à jour le titre principal (H1) DANS la section active
            const activeSection = document.getElementById(`${sectionId}-content`);
            const mainTitleElement = activeSection?.querySelector('h1[data-translate-key]');

            if (mainTitleElement) {
                const titleKey = `${sectionId}_section_title`;
                mainTitleElement.dataset.translateKey = titleKey;

                // Tenter de retraduire avec setLanguage si disponible
                try {
                    // Vérifier si setLanguage est défini globalement ou importé
                    if (typeof setLanguage === 'function') {
                        const currentLang = document.documentElement.lang || 'fr';
                        setLanguage(currentLang); // Appeler setLanguage pour retraduire toute la page (y compris le nouveau titre)
                    } else {
                         console.warn("setLanguage function not available for dynamic title update. Import it or handle manually.");
                         // Fallback manuel si setLanguage n'est pas disponible
                         // (Nécessiterait d'importer l'objet 'translations' ou de l'avoir globalement)
                         // const currentLang = document.documentElement.lang || 'fr';
                         // if (typeof translations !== 'undefined' && translations[currentLang]?.[titleKey]) {
                         //    mainTitleElement.textContent = translations[currentLang][titleKey];
                         // } else {
                         //    mainTitleElement.textContent = sectionId.charAt(0).toUpperCase() + sectionId.slice(1); // Titre par défaut
                         // }
                    }
                } catch (e) {
                    console.error("Error calling setLanguage:", e);
                     // Fallback manuel en cas d'erreur
                }
            } else {
                 console.warn(`H1 title element with data-translate-key not found in active section: ${sectionId}-content`);
            }
        }
    }

    // Gestionnaire d'événements pour les clics sur les liens de la sidebar
    if (sidebarNav) {
        sidebarNav.addEventListener('click', (event) => {
            const link = event.target.closest('a.sidebar-link');
            if (link && link.getAttribute('href')?.startsWith('#')) {
                event.preventDefault(); // Empêche le comportement par défaut du lien
                const sectionId = link.getAttribute('href').substring(1);
                // Mettre à jour le hash seulement si différent pour éviter boucle avec hashchange
                if (window.location.hash !== `#${sectionId}`) {
                    window.location.hash = sectionId; // Déclenche l'événement 'hashchange'
                } else {
                    // Si on clique sur le lien déjà actif, on appelle showSection
                    // pour s'assurer que tout est correct (utile si le DOM a changé)
                    // ou pour remonter en haut de page.
                    showSection(sectionId);
                    const activeSectionContent = document.getElementById(`${sectionId}-content`);
                    activeSectionContent?.scrollTo(0, 0); // Remonte en haut
                }
            }
        });
    }

     // Gestionnaire pour le changement de hash (boutons précédent/suivant, modification manuelle URL)
     window.addEventListener('hashchange', () => {
         const sectionId = window.location.hash ? window.location.hash.substring(1) : 'dashboard';
         showSection(sectionId);
     });


    // Afficher la section initiale au chargement de la page
    const initialSectionId = window.location.hash ? window.location.hash.substring(1) : 'dashboard';
    showSection(initialSectionId);


    // --- Logique pour les boutons d'action des cartes (dans la section catégories) ---
    const categoriesContent = document.getElementById('categories-content');
    if (categoriesContent) {
        categoriesContent.addEventListener('click', (event) => {
            const button = event.target.closest('button[data-translate-key]');
            // Vérifie si c'est bien un bouton d'action de carte
            if (!button || !button.dataset.translateKey.startsWith('action_')) return;

            const card = button.closest('.bg-white'); // Remonte à la carte parente
            const categoryTitleElement = card?.querySelector('[data-translate-key$="_title"]'); // Trouve le titre dans la carte
            const categoryTitle = categoryTitleElement ? categoryTitleElement.textContent : 'Catégorie inconnue';
            const actionKey = button.dataset.translateKey;

            // Logique spécifique pour chaque action
            switch (actionKey) {
                case 'action_copy_link':
                    console.log(`Action: Copier le lien pour "${categoryTitle}"`);
                    alert(`Copier lien pour ${categoryTitle} (à implémenter)`); // Placeholder
                    break;
                case 'action_view_appointments':
                    console.log(`Action: Voir les rendez-vous pour "${categoryTitle}"`);
                    alert(`Voir RDV pour ${categoryTitle} (à implémenter)`); // Placeholder
                    break;
                case 'action_edit':
                    console.log(`Action: Modifier la catégorie "${categoryTitle}"`);
                    alert(`Modifier ${categoryTitle} (à implémenter)`); // Placeholder
                    break;
                case 'action_delete':
                    console.log(`Action: Supprimer la catégorie "${categoryTitle}"`);
                    if (confirm(`Êtes-vous sûr de vouloir supprimer la catégorie "${categoryTitle}" ?`)) {
                         alert(`Supprimer ${categoryTitle} (logique backend à implémenter)`); // Placeholder
                        // card.remove(); // Supprimer la carte de l'UI (après succès backend)
                    }
                    break;
            }
        });
    }

    // --- Logique pour le bouton "Créer une catégorie" (dans la section catégories) ---
     const createCategoryButtonContainer = document.getElementById('categories-content'); // Le bouton est dans cette section
     if (createCategoryButtonContainer) {
        // Cible plus précisément le bouton via son contenu ou un ID/classe spécifique si possible
        const createCategoryButtonElement = createCategoryButtonContainer.querySelector('button span[data-translate-key="dashboard_create_category"]');
        if (createCategoryButtonElement) {
            const actualButton = createCategoryButtonElement.closest('button');
            if(actualButton) {
                actualButton.addEventListener('click', () => {
                    console.log('Action: Créer une nouvelle catégorie');
                    alert('Ouvrir formulaire/page de création de catégorie (à implémenter)'); // Placeholder
                });
            }
        }
     }


    // --- Logique pour le bouton "Se déconnecter" ---
     const logoutLinkContainer = document.querySelector('aside'); // Le lien est dans la sidebar
     if (logoutLinkContainer) {
        const logoutLinkElement = logoutLinkContainer.querySelector('a span[data-translate-key="sidebar_logout"]');
         if (logoutLinkElement) {
             const actualLink = logoutLinkElement.closest('a');
             if(actualLink) {
                actualLink.addEventListener('click', (event) => {
                    event.preventDefault(); // Empêche la navigation si href="#"
                    console.log('Action: Se déconnecter');
                    if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
                         alert('Déconnexion (logique backend et redirection à implémenter)'); // Placeholder
                        // window.location.href = '/connexion_account.html'; // Redirection après succès
                    }
                });
             }
         }
     }

}); // Fin de DOMContentLoaded

// Note sur l'importation de setLanguage/translations:
// Si vous décommentez l'import de setLanguage en haut, assurez-vous que
// votre fichier js/modules/translator.js exporte bien cette fonction:
// export function setLanguage(...) { ... }
// Si vous n'utilisez pas de bundler, les imports directs entre modules
// fonctionnent dans les navigateurs modernes mais peuvent avoir des contraintes
// (chemins, CORS si servi depuis file://). Utiliser une extension comme
// Live Server est recommandé pour le développement local.
