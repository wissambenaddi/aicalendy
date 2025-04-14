/**
 * Fichier : translate.js
 * Description : Gère la traduction du contenu textuel de la page entre le français et l'anglais.
 */

// 1. Définir les traductions pour chaque clé et chaque langue supportée
const translations = {
    fr: {
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
        footer_copyright: "&copy; 2025 AiCalendy. Tous droits réservés.", // Utilise innerHTML, donc l'entité fonctionne
        footer_privacy: "Politique de confidentialité",
        footer_terms: "Conditions d'utilisation"
    },
    en: {
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
        footer_terms: "Terms of Use"
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
            console.warn(`Translation key "${key}" not found for language "${lang}".`);
        }
    });
}

// 3. Ajouter les écouteurs d'événements aux boutons une fois le DOM chargé
// Utilisation de DOMContentLoaded pour s'assurer que les boutons existent
document.addEventListener('DOMContentLoaded', () => {
    const btnFr = document.getElementById('lang-fr');
    const btnEn = document.getElementById('lang-en');

    if (btnFr) {
        btnFr.addEventListener('click', () => setLanguage('fr'));
    } else {
         console.warn("Button with id 'lang-fr' not found.");
    }

    if (btnEn) {
        btnEn.addEventListener('click', () => setLanguage('en'));
    } else {
         console.warn("Button with id 'lang-en' not found.");
    }

    // Optionnel : Définir la langue initiale au chargement.
    // Ici, on pourrait vérifier une préférence stockée (localStorage) ou la langue du navigateur.
    // Par défaut, on suppose que le HTML est en français, donc on active le bouton FR visuellement.
    // Si le HTML initial était en anglais, il faudrait appeler setLanguage('en') ici.
    const initialLang = document.documentElement.lang || 'fr'; // Prend la langue du HTML ou 'fr' par défaut
    const initialActiveBtn = document.getElementById(`lang-${initialLang}`);
     if (initialActiveBtn) {
         // S'assure que seul le bouton initial est actif visuellement au cas où le HTML change
         document.querySelectorAll('.lang-btn').forEach(btn => btn.classList.remove('active'));
         initialActiveBtn.classList.add('active');
     }
     // Note: Pas besoin d'appeler setLanguage() ici si le HTML est déjà dans la langue par défaut.
});
