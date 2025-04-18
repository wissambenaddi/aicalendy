/**
 * Fichier : js/modules/utils.js
 * Description : Fonctions utilitaires communes (formatage, etc.)
 */

/** Formate un timestamp (ms) en date et heure lisibles */
export function formatDateTime(timestamp, locale = 'fr', options = { dateStyle: 'medium', timeStyle: 'short' }) {
    if (timestamp === null || timestamp === undefined) return '';
    try {
        const date = new Date(timestamp);
        if (isNaN(date.getTime())) { console.warn("Timestamp invalide pour formatDateTime:", timestamp); return 'Date invalide'; }
        return date.toLocaleString(locale, options);
    } catch (e) { console.error("Error formatting date:", e); return 'Date invalide'; }
}

/** Formate un timestamp (ms) en date lisible */
export function formatDate(timestamp, locale = 'fr', options = { dateStyle: 'short' }) {
     if (timestamp === null || timestamp === undefined) return '';
     try {
         const date = new Date(timestamp);
         if (isNaN(date.getTime())) { console.warn("Timestamp invalide pour formatDate:", timestamp); return 'Date invalide'; }
         return date.toLocaleDateString(locale, options);
     } catch (e) { console.error("Error formatting date:", e); return 'Date invalide'; }
}

/** Formate un timestamp en YYYY-MM-DD pour input[type=date] */
export function formatTimestampForDateInput(timestamp) {
    if (!timestamp) return '';
    try {
        const date = new Date(timestamp); if (isNaN(date.getTime())) return '';
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    } catch(e) { console.error("Error formatting timestamp for date input:", e); return ''; }
}

/** Formate un timestamp en HH:MM pour input[type=time] */
export function formatTimestampForTimeInput(timestamp) {
     if (!timestamp) return '';
     try {
         const date = new Date(timestamp); if (isNaN(date.getTime())) return '';
         const hours = date.getHours().toString().padStart(2, '0');
         const minutes = date.getMinutes().toString().padStart(2, '0');
         return `${hours}:${minutes}`;
     } catch(e) { console.error("Error formatting timestamp for time input:", e); return ''; }
}
