/**
 * Fichier : js/modules/api.js
 * Description : Fonctions pour interagir avec l'API backend.
 */

// Helper générique pour fetch
async function fetchApi(url, options = {}) {
    try {
        // Ajouter des headers communs si nécessaire (ex: Auth token)
        const defaultHeaders = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            // 'Authorization': `Bearer ${localStorage.getItem('authToken')}` // Exemple si token
        };
        options.headers = { ...defaultHeaders, ...options.headers };

        // Ajouter Cache-Control pour les requêtes GET pour éviter les pbs de cache
        if (!options.method || options.method.toUpperCase() === 'GET') {
             options.cache = 'no-store'; // Force le navigateur à ne pas utiliser son cache
             options.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
             options.headers['Pragma'] = 'no-cache';
             options.headers['Expires'] = '0';
        }


        const response = await fetch(url, options);

        // Gestion spécifique si la réponse n'a pas de contenu (ex: DELETE succès)
        if (response.status === 204) {
             return { success: true }; // Ou retourner null, ou un objet spécifique
        }

        const data = await response.json();

        if (!response.ok) {
            // Tenter d'extraire un message d'erreur plus précis de l'API
            const errorMessage = data?.message || `Erreur HTTP ${response.status}`;
            console.error(`API Error (${response.status}) on ${url}:`, errorMessage, data);
            throw new Error(errorMessage);
        }

        return data; // Contient { success: true, ... } ou autre selon l'API

    } catch (error) {
        console.error(`Network or API error on ${options.method || 'GET'} ${url}:`, error);
        // Remonter l'erreur pour qu'elle soit gérée par le code appelant
        throw error;
    }
}

// --- Catégories ---
export async function fetchCategories() {
    const result = await fetchApi('/api/categories');
    if (result.success && Array.isArray(result.categories)) {
        return result.categories;
    } else {
        throw new Error(result.message || "Erreur récupération catégories.");
    }
}

export async function createCategory(categoryData) {
    return await fetchApi('/api/categories', {
        method: 'POST',
        body: JSON.stringify(categoryData)
    });
}

export async function deleteCategory(categoryId) {
    return await fetchApi(`/api/categories/${categoryId}`, {
        method: 'DELETE'
    });
    // Note: fetchApi gère la réponse 204 ou une réponse JSON { success: true }
}

// --- Tâches ---
export async function fetchTasks() {
    const result = await fetchApi('/api/tasks');
     if (result.success && Array.isArray(result.tasks)) {
        return result.tasks;
    } else {
        throw new Error(result.message || "Erreur récupération tâches.");
    }
}

export async function createTask(taskData) {
    return await fetchApi('/api/tasks', {
        method: 'POST',
        body: JSON.stringify(taskData)
    });
}

export async function updateTaskStatus(taskId, statusData) {
     return await fetchApi(`/api/tasks/${taskId}/status`, {
        method: 'PUT',
        body: JSON.stringify(statusData) // { statut: '...', est_complete: 0|1 }
    });
}

export async function deleteTask(taskId) {
     return await fetchApi(`/api/tasks/${taskId}`, {
        method: 'DELETE'
    });
}


// --- Rendez-vous ---
export async function fetchAppointments(filters = {}) { // Accepte des filtres optionnels
    const params = new URLSearchParams(filters); // Ex: { category_id: 123 }
    const url = `/api/appointments?${params.toString()}`;
    const result = await fetchApi(url);
     if (result.success && Array.isArray(result.appointments)) {
        return result.appointments;
    } else {
        throw new Error(result.message || "Erreur récupération rendez-vous.");
    }
}

export async function fetchAppointmentDetails(appointmentId) {
    const result = await fetchApi(`/api/appointments/${appointmentId}`);
     if (result.success && result.appointment) {
        return result.appointment;
    } else {
        throw new Error(result.message || 'Impossible de charger les détails.');
    }
}

export async function createAppointment(appointmentData) {
    return await fetchApi('/api/appointments', {
        method: 'POST',
        body: JSON.stringify(appointmentData)
    });
}

export async function updateAppointment(appointmentId, appointmentData) {
    return await fetchApi(`/api/appointments/${appointmentId}`, {
        method: 'PUT',
        body: JSON.stringify(appointmentData)
    });
}

export async function updateAppointmentStatus(appointmentId, statusData) {
    return await fetchApi(`/api/appointments/${appointmentId}/status`, {
        method: 'PUT',
        body: JSON.stringify(statusData) // Ex: { statut: 'canceled' }
    });
}

// --- Dashboard ---
export async function fetchDashboardData() {
    const result = await fetchApi('/api/dashboard/data');
     if (result.success && result.data) {
        return result.data;
    } else {
        throw new Error(result.message || "Erreur récupération données dashboard.");
    }
}

// --- Profil ---
export async function fetchProfile() {
    const result = await fetchApi('/api/profile');
     if (result.success && result.profile) {
        return result.profile;
    } else {
        throw new Error(result.message || "Impossible de charger le profil.");
    }
}

export async function updateProfile(profileData) {
    return await fetchApi('/api/profile', {
        method: 'PUT',
        body: JSON.stringify(profileData)
    });
}