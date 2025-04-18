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
        dashboard_recent_tasks_title: "Tâches Récentes / à venir", // Ajouté
        dashboard_no_recent_tasks: "Aucune tâche récente ou à venir.", // Ajouté (optionnel)
        task_col_title: "Tâche", // Ajouté
        task_col_due_date: "Échéance", // Ajouté
        task_col_status: "Statut", // Ajouté
        task_status_overdue: "En retard", // Ajouté
        task_status_pending: "En attente", // Ajouté
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
        // --- Section Rendez-vous ---
        appointment_status_confirmed: "Confirmé", appointment_status_pending: "En attente", appointment_status_canceled: "Annulé",
        appointment_action_details: "Détails", appointment_action_reschedule: "Reprogrammer", appointment_action_cancel: "Annuler",
        no_appointments_found: "Aucun rendez-vous trouvé.",
        // --- Modale Création Rendez-vous ---
        create_appointment_title: "Nouveau Rendez-vous", appointment_form_title: "Titre / Objet", appointment_form_category: "Catégorie",
        appointment_form_select_category: "Sélectionner une catégorie...", appointment_form_date: "Date", appointment_form_start_time: "Heure de début",
        appointment_form_end_time: "Heure de fin", appointment_form_guest_name: "Nom de l'invité (optionnel)", appointment_form_guest_email: "Email de l'invité (optionnel)",
        appointment_form_create: "Créer le rendez-vous", appointment_form_cancel: "Annuler",
         // --- Modale Édition Rendez-vous ---
         edit_appointment_title: "Modifier le Rendez-vous",
         appointment_form_save: "Enregistrer les modifications",
        // --- Modale Détails Rendez-vous ---
        appointment_details_title: "Détails du Rendez-vous", appointment_details_category: "Catégorie", appointment_details_date: "Date",
        appointment_details_start_time: "Début", appointment_details_end_time: "Fin", appointment_details_status: "Statut",
        appointment_details_edit: "Modifier", appointment_details_close: "Fermer",
        // --- Modale Confirmation Annulation RDV ---
        appointment_cancel_confirm_title: "Confirmer l'Annulation",
        appointment_cancel_confirm_text: "Êtes-vous sûr de vouloir annuler ce rendez-vous ?",
        appointment_cancel_confirm_button: "Oui, Annuler",
        appointment_cancel_cancel_button: "Non, Retour",
        // === Clés Page Profil (Complétées) ===
        profile_info_title: "Données Personnelles",
        profile_label_fullname: "Nom complet",
        profile_label_email: "Adresse e-mail",
        profile_label_role: "Rôle",
        profile_label_secondary_phone: "Tél. secondaire",
        profile_label_address: "Adresse postale",
        profile_label_dob: "Date de naissance",
        profile_label_timezone: "Fuseau horaire",
        profile_label_availability: "Disponibilités",
        profile_label_team: "Équipe / Service",
        profile_label_specialty: "Fonction / Spécialité",
        profile_update_title: "Mettre à jour mes informations",
        profile_label_firstname: "Prénom",
        profile_label_lastname: "Nom",
        profile_button_save: "Enregistrer les modifications",
        profile_update_success: "Profil mis à jour avec succès !",
        profile_update_error: "Erreur lors de la mise à jour du profil.",
        profile_stats_title: "Statistiques",
        profile_label_cat_count: "Catégories créées",
        profile_label_appt_count: "Rendez-vous total",
        profile_label_attendance_rate: "Taux de présence",
        profile_security_title: "Informations de Sécurité",
        profile_label_last_login: "Dernière connexion",
        profile_label_last_ip: "Adresse IP (dernière)",
        profile_label_last_browser: "Navigateur / OS (dernière)",
        profile_label_auth_method: "Méthode d'auth.",
        profile_button_change_password: "Changer de mot de passe",
        profile_link_conn_history: "Voir l'historique complet",
        profile_prefs_title: "Personnalisation & Préférences",
        profile_label_theme: "Thème appliqué",
        profile_label_language: "Langue préférée",
        profile_label_default_page: "Page d'accueil",
        profile_label_photo: "Photo de profil",
        profile_label_signature: "Signature e-mail",
        profile_theme_light: "Clair",
        profile_theme_dark: "Sombre",
        profile_page_dashboard: "Dashboard",
        profile_page_categories: "Catégories",
        profile_page_tasks: "Tâches",
        profile_page_appointments: "Rendez-vous",
        profile_upload_photo: "Charger une photo",
        profile_edit_signature: "Modifier la signature",
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
        dashboard_recent_tasks_title: "Recent / Upcoming Tasks", // Added
        dashboard_no_recent_tasks: "No recent or upcoming tasks.", // Added (optional)
        task_col_title: "Task", // Added
        task_col_due_date: "Due Date", // Added
        task_col_status: "Status", // Added
        task_status_overdue: "Overdue", // Added
        task_status_pending: "Pending", // Added
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
         // --- Appointments Section/List Keys ---
         appointments_section_title: "My Appointments", appointment_status_confirmed: "Confirmed", appointment_status_pending: "Pending", appointment_status_canceled: "Canceled", appointment_action_details: "Details", appointment_action_reschedule: "Reschedule", appointment_action_cancel: "Cancel", no_appointments_found: "No appointments found.",
        // --- Create Appointment Modal Keys ---
        create_appointment_title: "New Appointment", appointment_form_title: "Title / Subject", appointment_form_category: "Category", appointment_form_select_category: "Select a category...", appointment_form_date: "Date", appointment_form_start_time: "Start Time", appointment_form_end_time: "End Time", appointment_form_guest_name: "Guest Name (optional)", appointment_form_guest_email: "Guest Email (optional)", appointment_form_create: "Create Appointment", appointment_form_cancel: "Cancel",
        // --- Edit Appointment Modal Keys ---
        edit_appointment_title: "Edit Appointment", appointment_form_save: "Save Changes",
        // --- Appointment Details Modal Keys ---
        appointment_details_title: "Appointment Details", appointment_details_category: "Category", appointment_details_date: "Date", appointment_details_start_time: "Start Time", appointment_details_end_time: "End Time", appointment_details_status: "Status", appointment_details_edit: "Edit", appointment_details_close: "Close",
        // --- Appointment Cancel Confirmation Modal Keys ---
        appointment_cancel_confirm_title: "Confirm Cancellation", appointment_cancel_confirm_text: "Are you sure you want to cancel this appointment?", appointment_cancel_confirm_button: "Yes, Cancel", appointment_cancel_cancel_button: "No, Go Back",
        // === Profile Page Keys (Completed) ===
        profile_info_title: "Personal Information",
        profile_label_fullname: "Full Name",
        profile_label_email: "Email Address",
        profile_label_role: "Role",
        profile_label_secondary_phone: "Secondary Phone",
        profile_label_address: "Postal Address",
        profile_label_dob: "Date of Birth",
        profile_label_timezone: "Timezone",
        profile_label_availability: "Availability",
        profile_label_team: "Team / Department",
        profile_label_specialty: "Function / Specialty",
        profile_update_title: "Update My Information",
        profile_label_firstname: "First Name",
        profile_label_lastname: "Last Name",
        profile_button_save: "Save Changes",
        profile_update_success: "Profile updated successfully!",
        profile_update_error: "Error updating profile.",
        profile_stats_title: "Statistics",
        profile_label_cat_count: "Categories Created",
        profile_label_appt_count: "Total Appointments",
        profile_label_attendance_rate: "Attendance Rate",
        profile_security_title: "Security Information",
        profile_label_last_login: "Last login",
        profile_label_last_ip: "IP Address (last)",
        profile_label_last_browser: "Browser / OS (last)",
        profile_label_auth_method: "Auth. Method",
        profile_button_change_password: "Change Password",
        profile_link_conn_history: "View full history",
        profile_prefs_title: "Customization & Preferences",
        profile_label_theme: "Applied Theme",
        profile_label_language: "Preferred Language",
        profile_label_default_page: "Default Home Page",
        profile_label_photo: "Profile Picture",
        profile_label_signature: "Email Signature",
        profile_theme_light: "Light",
        profile_theme_dark: "Dark",
        profile_page_dashboard: "Dashboard",
        profile_page_categories: "Categories",
        profile_page_tasks: "Tasks",
        profile_page_appointments: "Appointments",
        profile_upload_photo: "Upload Photo",
        profile_edit_signature: "Edit Signature",
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
        }

        if (translationText !== undefined) {
            // Cas spécifiques pour ne pas écraser d'autres contenus ou structures
            if (key.startsWith('action_') || key.startsWith('appointment_action_') || key === 'appointment_details_edit') {
                element.setAttribute('title', translationText);
                const spanElement = element.querySelector('span');
                if (spanElement) { spanElement.textContent = translationText; }
                element.setAttribute('aria-label', translationText);
            }
            else if (key === 'password_strength') { const strengthSpan = element.querySelector('.strength-text'); if (strengthSpan) { element.firstChild.textContent = translationText + ' '; } else { element.innerHTML = translationText; } }
            else if (element.id === 'user-name-display') { /* Géré par JS */ }
            else { element.innerHTML = translationText; }
        } else { console.warn(`Clé "${key}" non trouvée pour lang "${lang}".`); }
    });

    // Traduire les options des <select>
    const taskPrioritySelect = document.getElementById('task-priority');
    if(taskPrioritySelect) { /* ... */ }
    const taskStatusSelect = document.getElementById('task-status');
     if(taskStatusSelect) { /* ... */ }
    const taskActionStatusSelect = document.getElementById('task-action-new-status');
     if(taskActionStatusSelect) { /* ... */ }
    const apptCategorySelect = document.getElementById('appointment-category');
    if (apptCategorySelect && apptCategorySelect.options[0] && apptCategorySelect.options[0].value === "") { /* ... */ }
    const editApptCategorySelect = document.getElementById('edit-appointment-category');
    if (editApptCategorySelect && editApptCategorySelect.options[0] && editApptCategorySelect.options[0].value === "") { /* ... */ }
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

// Initialisation au chargement du DOM (pour ce module spécifique)
document.addEventListener('DOMContentLoaded', () => {
    initLanguageSwitcher();
    const initialLang = document.documentElement.lang || 'fr';
    setLanguage(initialLang); // Appeler pour traduire le contenu statique initial
});

// Exporter l'objet translations et les fonctions si nécessaire
export { translations, setLanguage, initLanguageSwitcher };
