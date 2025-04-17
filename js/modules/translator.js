/**
 * Fichier : js/modules/translator.js
 * Description : Gère la traduction du contenu textuel de la page.
 */

// Objet contenant toutes les traductions
const translations = {
    fr: {
        // --- Landing Page ---
        login: "Se connecter", register: "S'enregistrer", hero_title: "Simplifiez la planification de vos rendez-vous, quelle que soit votre activité.",
        hero_subtitle: "Créez des calendriers personnalisés pour vos entretiens, démos, consultations et plus encore, et laissez vos invités choisir leur créneau idéal.",
        cta_try_free: "Essayer AiCalendy gratuitement", how_it_works_title: "Comment ça marche ?", step1_title: "1. Créer une catégorie",
        step1_desc: "Définissez le type de rendez-vous (entretien, démo...).", step2_title: "2. Définir ses disponibilités",
        step2_desc: "Indiquez vos jours et heures libres pour cette catégorie.", step3_title: "3. Partager le lien",
        step3_desc: "Obtenez un lien unique à envoyer à vos invités.", step4_title: "4. Recevoir les réservations",
        step4_desc: "Les rendez-vous s'ajoutent automatiquement.", features_title: "Pourquoi choisir AiCalendy ?", feature1_title: "Flexibilité totale",
        feature1_desc: "Créez autant de catégories de calendriers que nécessaire, adaptées à chaque besoin.", feature2_title: "Gain de temps considérable",
        feature2_desc: "Éliminez les allers-retours pour trouver le bon créneau.", feature3_title: "Expérience fluide pour vos invités",
        feature3_desc: "Interface simple et intuitive pour choisir un créneau.", feature4_title: "Intégration facile",
        feature4_desc: "Connectez AiCalendy à vos calendriers existants (Google, Outlook...).", feature5_title: "Adapté à tous les métiers",
        feature5_desc: "Idéal pour les RH, la vente, le marketing, les consultants, etc.", cta_bottom_title: "Prêt à simplifier votre planification ?",
        cta_bottom_subtitle: "Rejoignez des milliers de professionnels qui gagnent du temps avec AiCalendy.", cta_bottom_button1: "Démarrer mon essai gratuit",
        cta_bottom_button2: "Découvrir les fonctionnalités", footer_copyright: "&copy; 2025 AiCalendy. Tous droits réservés.",
        footer_privacy: "Politique de confidentialité", footer_terms: "Conditions d'utilisation",
        // --- Dashboard ---
        sidebar_dashboard: "Dashboard", sidebar_categories: "Mes Catégories", sidebar_tasks: "Mes tâches",
        sidebar_appointments: "Mes Rendez-vous", sidebar_profile: "Mon Profil", sidebar_logout: "Se déconnecter",
        header_username: "Nom Utilisateur", header_role: "Administrateur",
        dashboard_section_title: "Tableau de Bord Principal", categories_section_title: "Mes Catégories de Rendez-vous",
        tasks_section_title: "Mes Tâches", appointments_section_title: "Mes Rendez-vous", profile_section_title: "Mon Profil",
        // --- Dashboard KPIs / Listes ---
        dashboard_today_title: "Aujourd'hui", dashboard_appointments_today: "Rendez-vous", dashboard_tasks_due_today: "Tâches à échéance",
        dashboard_quick_stats: "Statistiques Rapides", dashboard_overdue_tasks_stat: "Tâches en retard", dashboard_appointments_week_stat: "RDV cette semaine",
        dashboard_no_appointments_today: "Aucun rendez-vous aujourd'hui.", dashboard_no_tasks_today: "Aucune tâche due aujourd'hui.", dashboard_view_all: "Voir tout",
        // --- Section Catégories ---
        dashboard_create_category: "Créer une catégorie", card_actions: "Actions :", action_copy_link: "Copier le lien",
        action_view_appointments: "Voir les rendez-vous", action_edit: "Modifier", action_delete: "Supprimer",
        category_appointments_title: "Rendez-vous pour : {categoryName}", back_to_categories: "Retour aux catégories",
        no_categories_found: "Aucune catégorie créée pour le moment.", no_appointments_in_category: "Aucun rendez-vous planifié pour cette catégorie.",
        // --- Modale Création Catégorie ---
        create_category_title: "Nouvelle Catégorie", category_form_title: "Nom de la catégorie", category_form_description: "Description",
        category_form_color: "Couleur associée", category_form_icon: "Icône / Emoji", category_form_department: "Département lié",
        category_form_assignee: "Responsable", category_form_cancel: "Annuler", category_form_create: "Créer la catégorie",
        // --- Confirmation Suppression Catégorie ---
        category_delete_confirm_title: "Confirmer Suppression", category_delete_confirm_text: "Êtes-vous sûr de vouloir supprimer la catégorie \"{categoryName}\" ? Les rendez-vous liés seront dissociés.",
        // --- Section Tâches ---
        no_tasks_found: "Aucune tâche à afficher.",
        // --- Modale Création Tâche ---
        dashboard_create_task: "Créer une tâche", create_task_title: "Nouvelle Tâche", task_form_title: "Titre",
        task_form_description: "Description", task_form_due_date: "Date d'échéance", task_form_assignee: "Responsable",
        task_form_priority: "Priorité", task_form_priority_low: "Basse", task_form_priority_medium: "Moyenne", task_form_priority_high: "Haute",
        task_form_status: "Statut", task_form_status_todo: "À faire", task_form_status_inprogress: "En cours", task_form_status_done: "Terminé",
        task_form_category: "Catégorie/Département", task_form_cancel: "Annuler", task_form_create: "Créer la tâche",
        // --- Modale Action Tâche ---
        task_action_modal_title: "Actions pour la tâche", task_action_change_status: "Changer Statut", task_action_delete: "Supprimer",
        task_action_select_status: "Nouveau statut :", task_action_confirm_status: "Valider Statut", task_action_cancel: "Annuler",
        task_delete_confirm_title: "Confirmer Suppression", task_delete_confirm_text: "Êtes-vous sûr de vouloir supprimer cette tâche ?",
        // --- Dropdown Profil Header ---
        dropdown_profile: "Mon Profil", dropdown_logout: "Se déconnecter",
        // --- Page d'inscription ---
        create_account_title: "Créez votre compte AiCalendy", continue_with_google: "Continuer avec Google", continue_with_outlook: "Continuer avec Outlook",
        or_separator: "OU", first_name_label: "Prénom", last_name_label: "Nom", email_label: "Adresse e-mail",
        password_label: "Mot de passe", confirm_password_label: "Confirmer le mot de passe", password_strength: "Force du mot de passe :",
        password_strength_weak: "Faible", password_strength_medium: "Moyen", password_strength_strong: "Fort", terms_agree: "J'accepte les",
        terms_link: "Conditions d'utilisation", privacy_link: "Politique de confidentialité", create_account_button: "Créer mon compte",
        already_have_account: "Déjà un compte ?", login_link: "Se connecter",
        // --- Page de connexion ---
        login_title: "Connectez-vous à AiCalendy", login_identifier_label: "Identifiant ou Email", forgot_password: "Mot de passe oublié ?",
        login_button: "Se connecter", no_account_yet: "Pas encore de compte ?", register_link: "S'inscrire gratuitement",
        // --- Modale de déconnexion ---
        logout_confirm_title: "Confirmation de déconnexion", logout_confirm_text: "Êtes-vous sûr de vouloir vous déconnecter ?",
        logout_confirm_button: "Continuer", logout_cancel_button: "Annuler",
    },
    en: {
        // --- Landing Page ---
        login: "Login", register: "Register", hero_title: "Simplify scheduling your appointments...", hero_subtitle: "Create custom calendars...", cta_try_free: "Try for free", how_it_works_title: "How does it work?", step1_title: "1. Create Category", step1_desc: "Define the type...", step2_title: "2. Set Availability", step2_desc: "Indicate your free times...", step3_title: "3. Share Link", step3_desc: "Get a unique link...", step4_title: "4. Receive Bookings", step4_desc: "Appointments added...", features_title: "Why AiCalendy?", feature1_title: "Flexibility", feature1_desc: "Create many categories...", feature2_title: "Time Savings", feature2_desc: "Eliminate back-and-forth...", feature3_title: "Smooth Experience", feature3_desc: "Simple interface...", feature4_title: "Easy Integration", feature4_desc: "Connect existing calendars...", feature5_title: "All Professions", feature5_desc: "Ideal for HR, sales...", cta_bottom_title: "Ready to simplify?", cta_bottom_subtitle: "Join thousands...", cta_bottom_button1: "Start free trial", cta_bottom_button2: "Discover features", footer_copyright: "&copy; 2025 AiCalendy...", footer_privacy: "Privacy Policy", footer_terms: "Terms of Use",
        // --- Dashboard ---
        sidebar_dashboard: "Dashboard", sidebar_categories: "My Categories", sidebar_tasks: "My Tasks", sidebar_appointments: "My Appointments", sidebar_profile: "My Profile", sidebar_logout: "Logout", header_username: "User Name", header_role: "Administrator", dashboard_section_title: "Main Dashboard", categories_section_title: "My Appointment Categories", tasks_section_title: "My Tasks", appointments_section_title: "My Appointments", profile_section_title: "My Profile",
        // --- Dashboard KPIs / Lists ---
        dashboard_today_title: "Today", dashboard_appointments_today: "Appointments", dashboard_tasks_due_today: "Tasks Due", dashboard_quick_stats: "Quick Stats", dashboard_overdue_tasks_stat: "Overdue Tasks", dashboard_appointments_week_stat: "Appointments this week", dashboard_no_appointments_today: "No appointments today.", dashboard_no_tasks_today: "No tasks due today.", dashboard_view_all: "View all",
        // --- Categories Section ---
        dashboard_create_category: "Create category", card_actions: "Actions:", action_copy_link: "Copy link", action_view_appointments: "View appointments", action_edit: "Edit", action_delete: "Delete", category_appointments_title: "Appointments for: {categoryName}", back_to_categories: "Back to categories", no_categories_found: "No categories created yet.", no_appointments_in_category: "No appointments scheduled for this category.",
        // --- Create Category Modal ---
        create_category_title: "New Category", category_form_title: "Category Name", category_form_description: "Description", category_form_color: "Associated Color", category_form_icon: "Icon / Emoji", category_form_department: "Linked Department", category_form_assignee: "Assignee", category_form_cancel: "Cancel", category_form_create: "Create Category",
        // --- Category Delete Confirmation ---
        category_delete_confirm_title: "Confirm Deletion", category_delete_confirm_text: "Are you sure you want to delete the category \"{categoryName}\"? Linked appointments will be dissociated.",
        // --- Tasks Section ---
        no_tasks_found: "No tasks found.",
        // --- Create Task Modal ---
        dashboard_create_task: "Create Task", create_task_title: "New Task", task_form_title: "Title", task_form_description: "Description", task_form_due_date: "Due Date", task_form_assignee: "Assignee", task_form_priority: "Priority", task_form_priority_low: "Low", task_form_priority_medium: "Medium", task_form_priority_high: "High", task_form_status: "Status", task_form_status_todo: "To Do", task_form_status_inprogress: "In Progress", task_form_status_done: "Done", task_form_category: "Category/Department", task_form_cancel: "Cancel", task_form_create: "Create Task",
        // --- Task Action Modal ---
        task_action_modal_title: "Task Actions", task_action_change_status: "Change Status", task_action_delete: "Delete", task_action_select_status: "New status:", task_action_confirm_status: "Confirm Status", task_action_cancel: "Cancel", task_delete_confirm_title: "Confirm Deletion", task_delete_confirm_text: "Are you sure you want to delete this task?",
        // --- User Dropdown ---
        dropdown_profile: "My Profile", dropdown_logout: "Logout",
        // --- Registration Page ---
        create_account_title: "Create your AiCalendy account", continue_with_google: "Continue with Google", continue_with_outlook: "Continue with Outlook", or_separator: "OR", first_name_label: "First Name", last_name_label: "Last Name", email_label: "Email address", password_label: "Password", confirm_password_label: "Confirm password", password_strength: "Strength:", password_strength_weak: "Weak", password_strength_medium: "Medium", password_strength_strong: "Strong", terms_agree: "I agree to the", terms_link: "Terms of Use", privacy_link: "Privacy Policy", create_account_button: "Create my account", already_have_account: "Already have an account?", login_link: "Login",
        // --- Login Page ---
        login_title: "Login to AiCalendy", login_identifier_label: "Username or Email", forgot_password: "Forgot password?", login_button: "Login", no_account_yet: "No account yet?", register_link: "Register for free",
        // --- Logout Modal ---
        logout_confirm_title: "Logout Confirmation", logout_confirm_text: "Are you sure you want to log out?", logout_confirm_button: "Continue", logout_cancel_button: "Cancel",
    }
};

/** Met à jour le contenu textuel */
function setLanguage(lang) {
    if (!translations[lang]) { console.error(`Langue "${lang}" non supportée.`); return; }
    document.documentElement.setAttribute('lang', lang);
    document.querySelectorAll('.lang-btn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.getElementById(`lang-${lang}`);
    if (activeBtn) activeBtn.classList.add('active');

    document.querySelectorAll('[data-translate-key]').forEach(element => {
        const key = element.dataset.translateKey;
        let translationText = translations[lang]?.[key];

        // Gestion des placeholders comme {categoryName}
        if (translationText && translationText.includes('{')) {
            // Ne pas remplacer ici, laisser le code JS spécifique le faire
            // (ex: dans loadCategoryAppointments ou la confirmation de suppression)
        }

        if (translationText !== undefined) {
            // Cas spécifiques pour ne pas écraser d'autres contenus ou structures
            if (key.startsWith('action_')) { element.setAttribute('title', translationText); element.setAttribute('aria-label', translationText); }
            else if (key === 'password_strength') { const strengthSpan = element.querySelector('.strength-text'); if (strengthSpan) { element.firstChild.textContent = translationText + ' '; } else { element.innerHTML = translationText; } }
            else if (element.id === 'user-name-display') { /* Géré par JS */ }
            // else if (element.id === 'user-role-display') { element.innerHTML = translationText; } // Laisser JS gérer ou traduire ici
            else { element.innerHTML = translationText; }
        } else { console.warn(`Clé "${key}" non trouvée pour lang "${lang}".`); }
    });

    // Traduire les options des <select>
    const taskPrioritySelect = document.getElementById('task-priority');
    if(taskPrioritySelect) {
        taskPrioritySelect.options[0].textContent = translations[lang]?.task_form_priority_low || 'Basse';
        taskPrioritySelect.options[1].textContent = translations[lang]?.task_form_priority_medium || 'Moyenne';
        taskPrioritySelect.options[2].textContent = translations[lang]?.task_form_priority_high || 'Haute';
    }
    const taskStatusSelect = document.getElementById('task-status');
     if(taskStatusSelect) {
        taskStatusSelect.options[0].textContent = translations[lang]?.task_form_status_todo || 'À faire';
        taskStatusSelect.options[1].textContent = translations[lang]?.task_form_status_inprogress || 'En cours';
        taskStatusSelect.options[2].textContent = translations[lang]?.task_form_status_done || 'Terminé';
    }
    // Traduire les options du select dans la modale d'action tâche
    const taskActionStatusSelect = document.getElementById('task-action-new-status');
     if(taskActionStatusSelect) {
        taskActionStatusSelect.options[0].textContent = translations[lang]?.task_form_status_todo || 'À faire';
        taskActionStatusSelect.options[1].textContent = translations[lang]?.task_form_status_inprogress || 'En cours';
        taskActionStatusSelect.options[2].textContent = translations[lang]?.task_form_status_done || 'Terminé';
    }
}

/** Initialise les boutons de langue */
function initLanguageSwitcher() {
    const btnFr = document.getElementById('lang-fr');
    const btnEn = document.getElementById('lang-en');
    if (btnFr) btnFr.addEventListener('click', (e) => { e.preventDefault(); setLanguage('fr'); });
    else console.warn("Bouton 'lang-fr' non trouvé.");
    if (btnEn) btnEn.addEventListener('click', (e) => { e.preventDefault(); setLanguage('en'); });
    else console.warn("Bouton 'lang-en' non trouvé.");

    const initialLang = document.documentElement.lang || 'fr';
    const initialActiveBtn = document.getElementById(`lang-${initialLang}`);
    if (initialActiveBtn) { document.querySelectorAll('.lang-btn').forEach(btn => btn.classList.remove('active')); initialActiveBtn.classList.add('active'); }
}

// Initialisation au chargement du DOM
document.addEventListener('DOMContentLoaded', () => {
    initLanguageSwitcher();
    const initialLang = document.documentElement.lang || 'fr';
    // Appeler setLanguage une fois que le DOM est prêt
    // pour traduire les éléments initiaux et les options de select
    setLanguage(initialLang);
});

// Exporter l'objet translations et les fonctions si nécessaire
export { translations, setLanguage, initLanguageSwitcher };
