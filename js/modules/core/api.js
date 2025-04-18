/**
 * Fichier : js/modules/core/api.js
 * Description : Fonctions pour interagir avec l'API backend.
 */

// Helper générique pour fetch
async function fetchApi(url, options = {}) {
    console.log(`// DEBUG API: Appel fetchApi pour ${options.method || 'GET'} ${url}`); // DEBUG LOG
    try {
        const defaultHeaders = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            // Ajouter ici d'autres headers par défaut si nécessaire (ex: token d'authentification)
        };
        options.headers = { ...defaultHeaders, ...options.headers };

        // Forcer la non-utilisation du cache pour les requêtes GET (ou sans méthode spécifiée)
        if (!options.method || options.method.toUpperCase() === 'GET') {
             options.cache = 'no-store'; // Empêche le navigateur de mettre en cache
             options.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
             options.headers['Pragma'] = 'no-cache';
             options.headers['Expires'] = '0';
        }

        const response = await fetch(url, options);
        console.log(`// DEBUG API: Réponse reçue pour ${url}, Statut: ${response.status}`); // DEBUG LOG

        // Gérer les réponses sans contenu (ex: DELETE réussi)
        if (response.status === 204) {
             console.log(`// DEBUG API: Réponse 204 (No Content) pour ${url}`); // DEBUG LOG
             return { success: true }; // Simuler une réponse succès
        }

        // Cloner la réponse pour pouvoir la lire plusieurs fois si nécessaire (ex: lire en texte si JSON échoue)
        const responseClone = response.clone();

        try {
            const data = await response.json(); // Essayer de parser en JSON
            console.log(`// DEBUG API: Données JSON parsées pour ${url}:`, data); // DEBUG LOG

            if (!response.ok) {
                // Si le statut n'est pas OK (>=400), utiliser le message de l'API ou un message générique
                const errorMessage = data?.message || `Erreur HTTP ${response.status}`;
                console.error(`// DEBUG API: Erreur API (non-OK) sur ${url}:`, errorMessage, data); // DEBUG LOG
                throw new Error(errorMessage); // Remonter l'erreur avec le message de l'API
            }

            // Optionnel: Vérifier si la structure attendue est présente (ex: { success: true, ... })
             if (typeof data.success === 'undefined') {
                 console.warn(`// DEBUG API: Réponse JSON pour ${url} n'a pas de propriété 'success'.`, data);
                 // Si le statut était OK mais 'success' manque, on peut choisir de continuer ou de lever une erreur
                 // Ici, on continue mais on logue un avertissement.
             }
            return data; // Retourner les données JSON

        } catch (jsonError) {
             // Si le parsing JSON échoue
             console.error(`// DEBUG API: Erreur parsing JSON pour ${url}:`, jsonError); // DEBUG LOG
             // Essayer de lire la réponse comme texte pour voir ce qui a été reçu
             try {
                 const textData = await responseClone.text();
                 console.error(`// DEBUG API: Réponse texte brute reçue pour ${url}:`, textData); // DEBUG LOG
             } catch (textError) {
                 console.error(`// DEBUG API: Impossible de lire la réponse texte pour ${url}:`, textError); // DEBUG LOG
             }
             // Remonter une erreur indiquant une réponse invalide
             throw new Error(`Réponse invalide du serveur (statut ${response.status}).`);
        }

    } catch (error) {
        // Gérer les erreurs réseau ou celles remontées par les blocs précédents
        console.error(`// DEBUG API: Erreur réseau ou autre pour ${options.method || 'GET'} ${url}:`, error); // DEBUG LOG
        // Remonter l'erreur pour qu'elle soit traitée par le code appelant
        throw error;
    }
}

// --- Catégories ---
export async function fetchCategories() {
    console.log("// DEBUG API: Appel fetchCategories"); // DEBUG LOG
    try {
        const result = await fetchApi('/api/categories');
        // Vérification plus stricte de la réponse
        if (result && result.success && Array.isArray(result.categories)) {
            console.log("// DEBUG API: fetchCategories succès, retour:", result.categories); // DEBUG LOG
            return result.categories;
        } else {
            // Si success est false ou categories n'est pas un tableau
            console.error("// DEBUG API: Réponse inattendue mais valide JSON pour fetchCategories:", result); // DEBUG LOG
            throw new Error(result?.message || "Format de réponse invalide pour les catégories.");
        }
    } catch (error) {
         // Gérer les erreurs remontées par fetchApi (réseau, parsing, non-OK)
         console.error("// DEBUG API: Erreur dans fetchCategories:", error); // DEBUG LOG
         // Remonter une erreur générique ou celle de l'API si disponible
         throw new Error(error.message || "Erreur récupération catégories.");
    }
}

export async function createCategory(categoryData) {
    console.log("// DEBUG API: Appel createCategory avec:", categoryData);
    return await fetchApi('/api/categories', {
        method: 'POST',
        body: JSON.stringify(categoryData)
    });
}

export async function deleteCategory(categoryId) {
    console.log(`// DEBUG API: Appel deleteCategory pour ID: ${categoryId}`);
    return await fetchApi(`/api/categories/${categoryId}`, {
        method: 'DELETE'
    });
}

// --- Tâches ---
export async function fetchTasks() {
    console.log("// DEBUG API: Appel fetchTasks");
    const result = await fetchApi('/api/tasks');
     if (result && result.success && Array.isArray(result.tasks)) {
        return result.tasks;
    } else {
        console.error("// DEBUG API: Réponse inattendue pour fetchTasks:", result);
        throw new Error(result?.message || "Erreur récupération tâches.");
    }
}

export async function createTask(taskData) {
     console.log("// DEBUG API: Appel createTask avec:", taskData);
    return await fetchApi('/api/tasks', {
        method: 'POST',
        body: JSON.stringify(taskData)
    });
}

export async function updateTaskStatus(taskId, statusData) {
    console.log(`// DEBUG API: Appel updateTaskStatus pour ID: ${taskId} avec:`, statusData);
    return await fetchApi(`/api/tasks/${taskId}/status`, {
        method: 'PUT',
        body: JSON.stringify(statusData)
    });
}

export async function deleteTask(taskId) {
    console.log(`// DEBUG API: Appel deleteTask pour ID: ${taskId}`);
    return await fetchApi(`/api/tasks/${taskId}`, {
        method: 'DELETE'
    });
}

// --- Rendez-vous ---
export async function fetchAppointments(filters = {}) {
    console.log("// DEBUG API: Appel fetchAppointments avec filtres:", filters);
    let url = '/api/appointments';
    if (filters.category_id) {
        url += `?category_id=${encodeURIComponent(filters.category_id)}`;
    }
    const result = await fetchApi(url);
     if (result && result.success && Array.isArray(result.appointments)) {
        return result.appointments;
    } else {
        console.error("// DEBUG API: Réponse inattendue pour fetchAppointments:", result);
        throw new Error(result?.message || "Erreur récupération rendez-vous.");
    }
}

export async function fetchAppointmentDetails(appointmentId) {
    console.log(`// DEBUG API: Appel fetchAppointmentDetails pour ID: ${appointmentId}`);
    const result = await fetchApi(`/api/appointments/${appointmentId}`);
     if (result && result.success && result.appointment) {
        return result.appointment;
    } else {
        console.error("// DEBUG API: Réponse inattendue pour fetchAppointmentDetails:", result);
        throw new Error(result?.message || "Erreur récupération détails rendez-vous.");
    }
}

export async function createAppointment(appointmentData) {
    console.log("// DEBUG API: Appel createAppointment avec:", appointmentData);
    return await fetchApi('/api/appointments', {
        method: 'POST',
        body: JSON.stringify(appointmentData)
    });
}

export async function updateAppointment(appointmentId, appointmentData) {
    console.log(`// DEBUG API: Appel updateAppointment pour ID: ${appointmentId} avec:`, appointmentData);
    return await fetchApi(`/api/appointments/${appointmentId}`, {
        method: 'PUT',
        body: JSON.stringify(appointmentData)
    });
}

export async function updateAppointmentStatus(appointmentId, statusData) {
     console.log(`// DEBUG API: Appel updateAppointmentStatus pour ID: ${appointmentId} avec:`, statusData);
    return await fetchApi(`/api/appointments/${appointmentId}/status`, {
        method: 'PUT',
        body: JSON.stringify(statusData)
    });
}

// --- Dashboard ---
export async function fetchDashboardData() {
    console.log("// DEBUG API: Appel fetchDashboardData");
    const result = await fetchApi('/api/dashboard/data');
     if (result && result.success && result.data) {
        return result.data;
    } else {
        console.error("// DEBUG API: Réponse inattendue pour fetchDashboardData:", result);
        throw new Error(result?.message || "Erreur récupération données dashboard.");
    }
}

// --- Profil ---
export async function fetchProfile() {
     console.log("// DEBUG API: Appel fetchProfile");
    const result = await fetchApi('/api/profile');
     if (result && result.success && result.profile) {
        return result.profile;
    } else {
        console.error("// DEBUG API: Réponse inattendue pour fetchProfile:", result);
        throw new Error(result?.message || "Erreur récupération profil.");
    }
}

export async function updateProfile(profileData) {
    console.log("// DEBUG API: Appel updateProfile avec:", profileData);
    return await fetchApi('/api/profile', {
        method: 'PUT',
        body: JSON.stringify(profileData)
    });
}

// --- Mot de Passe ---
/**
 * Envoie la requête pour changer le mot de passe utilisateur.
 * @param {object} passwordData - Doit contenir { currentPassword, newPassword }
 * @returns {Promise<object>} - La réponse JSON de l'API.
 */
export async function changePassword(passwordData) {
    console.log("// DEBUG API: Appel changePassword");
    if (!passwordData || !passwordData.currentPassword || !passwordData.newPassword) {
        throw new Error("Données de mot de passe manquantes pour l'appel API.");
    }
    return await fetchApi('/api/profile/password', {
        method: 'PUT',
        body: JSON.stringify(passwordData) // Envoie { currentPassword, newPassword }
    });
}
