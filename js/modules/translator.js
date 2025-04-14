/**
 * Fichier : js/modules/translator.js
 * Description : Gère la traduction du contenu textuel de la page entre le français et l'anglais.
 * Ce fichier est maintenant un module ES6.
 */

// 1. Définir les traductions pour chaque clé et chaque langue supportée
const translations = {
    fr: {
        // --- Landing Page ---
        login: "Se connecter",
        register: "S'enregistrer",
        hero_title: "Simplifiez la planification de vos rendez-vous, quelle que soit votre activité.",
        hero_subtitle: "Créez des calendriers personnalisés pour vos entretiens, démos, consultations et plus encore, et laissez vos invités choisir leur créneau idéal.",
        cta_try_free: "Essayer AiCalendy gratuitement",
        how_it_works_title: "Comment ça marche ?",
        step1_title: "1. Créer une catégorie",
        step1_desc: "Définissez le type de rendez-vous (entretien, démo...).",
        step2_title: "2. Définir ses disponibilités",
        step2_desc: "Indiquez vos jours et heures libres pour cette catégorie.",
        step3_title: "3. Partager le lien",
        step3_desc: "Obtenez un lien unique à envoyer à vos invités.",
        step4_title: "4. Recevoir les réservations",
        step4_desc: "Les rendez-vous s'ajoutent automatiquement.",
        features_title: "Pourquoi choisir AiCalendy ?",
        feature1_title: "Flexibilité totale",
        feature1_desc: "Créez autant de catégories de calendriers que nécessaire, adaptées à chaque besoin.",
        feature2_title: "Gain de temps considérable",
        feature2_desc: "Éliminez les allers-retours pour trouver le bon créneau.",
        feature3_title: "Expérience fluide pour vos invités",
        feature3_desc: "Interface simple et intuitive pour choisir un créneau.",
        feature4_title: "Intégration facile",
        feature4_desc: "Connectez AiCalendy à vos calendriers existants (Google, Outlook...).",
        feature5_title: "Adapté à tous les métiers",
        feature5_desc: "Idéal pour les RH, la vente, le marketing, les consultants, etc.",
        cta_bottom_title: "Prêt à simplifier votre planification ?",
        cta_bottom_subtitle: "Rejoignez des milliers de professionnels qui gagnent du temps avec AiCalendy.",
        cta_bottom_button1: "Démarrer mon essai gratuit",
        cta_bottom_button2: "Découvrir les fonctionnalités",
        footer_copyright: "&copy; 2025 AiCalendy. Tous droits réservés.",
        footer_privacy: "Politique de confidentialité",
        footer_terms: "Conditions d'utilisation",

        // --- Dashboard ---
        sidebar_categories: "Mes Catégories",
        sidebar_appointments: "Mes Rendez-vous",
        sidebar_profile: "Mon Profil",
        sidebar_logout: "Se déconnecter",
        header_username: "Nom Utilisateur",
        header_role: "Administrateur",
        dashboard_title: "Mes Catégories de Rendez-vous",
        dashboard_create_category: "Créer une catégorie",
        category1_title: "Entretien de Recrutement", // Exemple
        category1_desc: "Session de 45 minutes pour évaluer les candidats.", // Exemple
        category2_title: "Démonstration Produit", // Exemple
        category2_desc: "Présentation interactive de 30 minutes.", // Exemple
        card_actions: "Actions :",
        action_copy_link: "Copier le lien",
        action_view_appointments: "Voir les rendez-vous",
        action_edit: "Modifier",
        action_delete: "Supprimer",

        // --- Page d'inscription ---
        create_account_title: "Créez votre compte AiCalendy",
        continue_with_google: "Continuer avec Google", // Clé réutilisée
        continue_with_outlook: "Continuer avec Outlook", // Clé réutilisée
        or_separator: "OU", // Clé réutilisée
        email_label: "Adresse e-mail", // Clé réutilisée
        password_label: "Mot de passe", // Clé réutilisée
        confirm_password_label: "Confirmer le mot de passe",
        terms_agree: "J'accepte les",
        terms_link: "Conditions d'utilisation", // Clé réutilisée
        privacy_link: "Politique de confidentialité", // Clé réutilisée
        create_account_button: "Créer mon compte",
        already_have_account: "Déjà un compte ?",
        login_link: "Se connecter", // Clé réutilisée

        // --- Page de connexion ---
        login_title: "Connectez-vous à AiCalendy",
        forgot_password: "Mot de passe oublié ?",
        login_button: "Se connecter", // Clé réutilisée (même texte que login_link)
        no_account_yet: "Pas encore de compte ?",
        register_link: "S'inscrire gratuitement", // Clé réutilisée (même texte que register)

    },
    en: {
        // --- Landing Page ---
        login: "Login",
        register: "Register",
        hero_title: "Simplify scheduling your appointments, whatever your business.",
        hero_subtitle: "Create custom calendars for your interviews, demos, consultations, and more, and let your guests choose their ideal slot.",
        cta_try_free: "Try AiCalendy for free",
        how_it_works_title: "How does it work?",
        step1_title: "1. Create a category",
        step1_desc: "Define the type of appointment (interview, demo...).",
        step2_title: "2. Set your availability",
        step2_desc: "Indicate your available days and times for this category.",
        step3_title: "3. Share the link",
        step3_desc: "Get a unique link to send to your guests.",
        step4_title: "4. Receive bookings",
        step4_desc: "Appointments are added automatically.",
        features_title: "Why choose AiCalendy?",
        feature1_title: "Total flexibility",
        feature1_desc: "Create as many calendar categories as needed, tailored to each requirement.",
        feature2_title: "Significant time savings",
        feature2_desc: "Eliminate back-and-forth emails to find the right time slot.",
        feature3_title: "Smooth experience for your guests",
        feature3_desc: "Simple and intuitive interface to choose a time slot.",
        feature4_title: "Easy integration",
        feature4_desc: "Connect AiCalendy to your existing calendars (Google, Outlook...).",
        feature5_title: "Suitable for all professions",
        feature5_desc: "Ideal for HR, sales, marketing, consultants, etc.",
        cta_bottom_title: "Ready to simplify your scheduling?",
        cta_bottom_subtitle: "Join thousands of professionals saving time with AiCalendy.",
        cta_bottom_button1: "Start my free trial",
        cta_bottom_button2: "Discover features",
        footer_copyright: "&copy; 2025 AiCalendy. All rights reserved.",
        footer_privacy: "Privacy Policy",
        footer_terms: "Terms of Use",

         // --- Dashboard ---
         sidebar_categories: "My Categories",
         sidebar_appointments: "My Appointments",
         sidebar_profile: "My Profile",
         sidebar_logout: "Logout",
         header_username: "User Name",
         header_role: "Administrator",
         dashboard_title: "My Appointment Categories",
         dashboard_create_category: "Create category",
         category1_title: "Recruitment Interview", // Example
         category1_desc: "45-minute session to evaluate candidates.", // Example
         category2_title: "Product Demonstration", // Example
         category2_desc: "30-minute interactive presentation.", // Example
         card_actions: "Actions:",
         action_copy_link: "Copy link",
         action_view_appointments: "View appointments",
         action_edit: "Edit",
         action_delete: "Delete",

         // --- Page d'inscription ---
         create_account_title: "Create your AiCalendy account",
         continue_with_google: "Continue with Google", // Reused key
         continue_with_outlook: "Continue with Outlook", // Reused key
         or_separator: "OR", // Reused key
         email_label: "Email address", // Reused key
         password_label: "Password", // Reused key
         confirm_password_label: "Confirm password",
         terms_agree: "I agree to the",
         terms_link: "Terms of Use", // Reused key
         privacy_link: "Privacy Policy", // Reused key
         create_account_button: "Create my account",
         already_have_account: "Already have an account?",
         login_link: "Login", // Reused key

         // --- Page de connexion ---
         login_title: "Login to AiCalendy",
         forgot_password: "Forgot password?",
         login_button: "Login", // Reused key (same text as login_link)
         no_account_yet: "No account yet?",
         register_link: "Register for free", // Reused key (same text as register)
    }
};

/**
 * Met à jour le contenu textuel de la page en fonction de la langue sélectionnée.
 * @param {string} lang - La langue cible ('fr' ou 'en').
 */
export function setLanguage(lang) {
    // === AJOUT DE LOG ===
    console.log(`Setting language to: ${lang}`);
    // =====================

    if (!translations[lang]) {
        console.error(`Language "${lang}" not supported.`);
        return;
    }

    document.documentElement.setAttribute('lang', lang);

    const langButtons = document.querySelectorAll('.lang-btn');
    langButtons.forEach(btn => {
        btn.classList.remove('active');
    });
    const activeBtn = document.getElementById(`lang-${lang}`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }

    const elementsToTranslate = document.querySelectorAll('[data-translate-key]');
    // === AJOUT DE LOG ===
    console.log(`Found ${elementsToTranslate.length} elements to translate.`);
    // =====================

    elementsToTranslate.forEach((element, index) => {
        const key = element.dataset.translateKey;
        const translationText = translations[lang][key];

        // === AJOUT DE LOG ===
        // Log pour chaque élément, surtout ceux qui posent problème
        if (['forgot_password', 'login_button', 'no_account_yet', 'register_link'].includes(key)) {
             console.log(`[${index}] Processing key: ${key}, Element:`, element);
        }
        // =====================


        if (translationText !== undefined) {
             // === AJOUT DE LOG ===
             if (['forgot_password', 'login_button', 'no_account_yet', 'register_link'].includes(key)) {
                console.log(`   Translation found: "${translationText}"`);
             }
            // =====================

            if (key.startsWith('action_')) {
                element.setAttribute('title', translationText);
                element.setAttribute('aria-label', translationText);
            } else {
                // === AJOUT DE LOG ===
                // console.log(`   Updating innerHTML for key: ${key}`); // Optionnel: log pour tous les innerHTML
                // =====================
                element.innerHTML = translationText;
            }
        } else {
            console.warn(`[${index}] Translation key "${key}" not found for language "${lang}". Element:`, element);
        }
    });
     // === AJOUT DE LOG ===
     console.log("Translation loop finished.");
     // =====================
}

/**
 * Initialise les écouteurs d'événements pour les boutons de langue.
 */
export function initLanguageSwitcher() {
    const btnFr = document.getElementById('lang-fr');
    const btnEn = document.getElementById('lang-en');

    if (btnFr) {
        btnFr.addEventListener('click', (e) => {
            e.preventDefault();
            setLanguage('fr');
        });
    } else {
         console.warn("Button/link with id 'lang-fr' not found.");
    }

    if (btnEn) {
        btnEn.addEventListener('click', (e) => {
            e.preventDefault();
            setLanguage('en');
        });
    } else {
         console.warn("Button/link with id 'lang-en' not found.");
    }

    const initialLang = document.documentElement.lang || 'fr';
    const initialActiveBtn = document.getElementById(`lang-${initialLang}`);
     if (initialActiveBtn) {
         document.querySelectorAll('.lang-btn').forEach(btn => btn.classList.remove('active'));
         initialActiveBtn.classList.add('active');
     }
}

// --- Initialisation ---
document.addEventListener('DOMContentLoaded', () => {
    initLanguageSwitcher();
    const initialLang = document.documentElement.lang || 'fr';
    // === AJOUT DE LOG ===
    console.log(`Initial language check: ${initialLang}. Applying initial translation.`);
    // =====================
    setLanguage(initialLang);
});
