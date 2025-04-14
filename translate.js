/**
 * Fichier : translate.js
 * Description : Gère la traduction du contenu textuel de la page entre le français et l'anglais.
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
        header_username: "Nom Utilisateur", // Remplacer par la vraie donnée si possible
        header_role: "Administrateur", // Remplacer par la vraie donnée si possible
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
        // Clé pour le message si aucune catégorie (à ajouter dans le HTML si nécessaire)
        // no_categories_title: "Aucune catégorie trouvée",
        // no_categories_desc: "Commencez par créer votre première catégorie de rendez-vous.",
        // no_categories_button: "Nouvelle Catégorie",

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
         header_username: "User Name", // Replace with real data if possible
         header_role: "Administrator", // Replace with real data if possible
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
         // Key for the message if no categories (to be added in HTML if needed)
         // no_categories_title: "No categories found",
         // no_categories_desc: "Get started by creating your first appointment category.",
         // no_categories_button: "New Category",
    }
};

/**
 * Met à jour le contenu textuel de la page en fonction de la langue sélectionnée.
 * @param {string} lang - La langue cible ('fr' ou 'en').
 */
function setLanguage(lang) {
    // Vérifie si la langue demandée existe dans les traductions
    if (!translations[lang]) {
        console.error(`Language "${lang}" not supported.`);
        return;
    }

    // Met à jour l'attribut lang de la balise <html>
    document.documentElement.setAttribute('lang', lang);

    // Met à jour le style des boutons de langue
    const langButtons = document.querySelectorAll('.lang-btn');
    langButtons.forEach(btn => {
        btn.classList.remove('active');
    });
    const activeBtn = document.getElementById(`lang-${lang}`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }

    // Sélectionne tous les éléments ayant une clé de traduction
    const elementsToTranslate = document.querySelectorAll('[data-translate-key]');

    elementsToTranslate.forEach(element => {
        const key = element.dataset.translateKey;
        // Vérifie si la traduction existe pour cette clé et cette langue
        if (translations[lang][key] !== undefined) {
            // Utilise innerHTML pour permettre l'interprétation des entités HTML (ex: &copy;)
            element.innerHTML = translations[lang][key];
        } else {
            // Avertit si une clé de traduction est manquante pour la langue actuelle
            console.warn(`Translation key "${key}" not found for language "${lang}".`);
        }
    });
}

// 3. Ajouter les écouteurs d'événements aux boutons une fois le DOM chargé
document.addEventListener('DOMContentLoaded', () => {
    const btnFr = document.getElementById('lang-fr');
    const btnEn = document.getElementById('lang-en');

    if (btnFr) {
        btnFr.addEventListener('click', (e) => {
            e.preventDefault(); // Empêche le comportement par défaut si c'est un lien
            setLanguage('fr');
        });
    } else {
         console.warn("Button/link with id 'lang-fr' not found.");
    }

    if (btnEn) {
        btnEn.addEventListener('click', (e) => {
            e.preventDefault(); // Empêche le comportement par défaut si c'est un lien
            setLanguage('en');
        });
    } else {
         console.warn("Button/link with id 'lang-en' not found.");
    }

    // Gère l'état actif initial basé sur la langue du HTML
    const initialLang = document.documentElement.lang || 'fr';
    const initialActiveBtn = document.getElementById(`lang-${initialLang}`);
     if (initialActiveBtn) {
         document.querySelectorAll('.lang-btn').forEach(btn => btn.classList.remove('active'));
         initialActiveBtn.classList.add('active');
     }
     // Appelle setLanguage une fois au chargement pour s'assurer que le contenu correspond à la langue initiale
     // (utile si le HTML par défaut n'est pas en 'fr' ou pour rafraîchir le contenu)
     // setLanguage(initialLang); // Décommenter si nécessaire
});
