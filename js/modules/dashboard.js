/**
 * Fichier : js/modules/dashboard.js
 * Description : Gère la logique et les interactions spécifiques
 * à la page du tableau de bord (dashboard_user.html).
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log('Dashboard JS loaded');

    // --- Logique pour les boutons d'action des cartes ---
    const cardContainer = document.querySelector('main'); // Ou un sélecteur plus précis

    if (cardContainer) {
        cardContainer.addEventListener('click', (event) => {
            const button = event.target.closest('button[data-translate-key]'); // Cible les boutons d'action

            if (!button) return; // Si le clic n'est pas sur un bouton d'action

            // Récupérer l'ID ou les infos de la catégorie parente (à adapter selon le HTML final)
            const card = button.closest('.bg-white'); // Exemple pour remonter à la carte
            const categoryTitleElement = card?.querySelector('[data-translate-key$="_title"]'); // Exemple
            const categoryTitle = categoryTitleElement ? categoryTitleElement.textContent : 'Catégorie inconnue';

            const actionKey = button.dataset.translateKey;

            switch (actionKey) {
                case 'action_copy_link':
                    console.log(`Action: Copier le lien pour "${categoryTitle}"`);
                    // --- À FAIRE ---
                    // Récupérer le lien associé à cette carte
                    // Utiliser l'API Clipboard pour copier le lien
                    // Afficher une notification de succès (ex: "Lien copié !")
                    alert(`Copier lien pour ${categoryTitle} (à implémenter)`); // Placeholder
                    break;
                case 'action_view_appointments':
                    console.log(`Action: Voir les rendez-vous pour "${categoryTitle}"`);
                    // --- À FAIRE ---
                    // Rediriger vers une page affichant les rendez-vous de cette catégorie
                    // ou ouvrir un modal, etc.
                    alert(`Voir RDV pour ${categoryTitle} (à implémenter)`); // Placeholder
                    break;
                case 'action_edit':
                    console.log(`Action: Modifier la catégorie "${categoryTitle}"`);
                    // --- À FAIRE ---
                    // Rediriger vers une page d'édition de catégorie
                    // ou ouvrir un modal d'édition, etc.
                    alert(`Modifier ${categoryTitle} (à implémenter)`); // Placeholder
                    break;
                case 'action_delete':
                    console.log(`Action: Supprimer la catégorie "${categoryTitle}"`);
                    // --- À FAIRE ---
                    // Afficher une confirmation avant suppression
                    // Si confirmé, envoyer une requête DELETE au backend
                    // Mettre à jour l'interface utilisateur (supprimer la carte)
                    if (confirm(`Êtes-vous sûr de vouloir supprimer la catégorie "${categoryTitle}" ?`)) {
                         alert(`Supprimer ${categoryTitle} (logique backend à implémenter)`); // Placeholder
                        // card.remove(); // Supprimer la carte de l'UI (après succès backend)
                    }
                    break;
            }
        });
    }

    // --- Logique pour le bouton "Créer une catégorie" ---
    const createCategoryButton = document.querySelector('button [data-translate-key="dashboard_create_category"]');
    if (createCategoryButton) {
         // Il faut cibler le bouton parent, pas le span intérieur
         const actualButton = createCategoryButton.closest('button');
         if(actualButton) {
            actualButton.addEventListener('click', () => {
                console.log('Action: Créer une nouvelle catégorie');
                // --- À FAIRE ---
                // Rediriger vers une page de création de catégorie
                // ou ouvrir un modal de création.
                alert('Ouvrir formulaire/page de création de catégorie (à implémenter)'); // Placeholder
            });
         }
    }

    // --- Logique pour le bouton "Se déconnecter" ---
     const logoutLink = document.querySelector('a [data-translate-key="sidebar_logout"]');
     if (logoutLink) {
         // Il faut cibler le lien parent, pas le span intérieur
         const actualLink = logoutLink.closest('a');
         if(actualLink) {
            actualLink.addEventListener('click', (event) => {
                event.preventDefault(); // Empêche la navigation si c'est un lien #
                console.log('Action: Se déconnecter');
                // --- À FAIRE ---
                // Envoyer une requête de déconnexion au backend
                // Supprimer les informations d'authentification locales (token, etc.)
                // Rediriger vers la page de connexion
                if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
                     alert('Déconnexion (logique backend et redirection à implémenter)'); // Placeholder
                    // window.location.href = '/connexion_account.html'; // Redirection après succès
                }
            });
         }
     }

    // --- Autres logiques spécifiques au dashboard ---
    // (Ex: chargement dynamique des catégories, gestion du dropdown utilisateur...)

}); // Fin de DOMContentLoaded
