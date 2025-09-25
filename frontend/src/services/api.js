const API_BASE = '/api';

class ApiService {
    static async login(username, password) {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        return response.json();
    }

    static async register(userData) {
        const response = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        return response.json();
    }

    static async uploadFile(file, token) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${API_BASE}/files/upload`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        return response.json();
    }

    static async getFiles(token, isAdmin = false, options = {}) {
        const url = isAdmin ? `${API_BASE}/admin/files` : `${API_BASE}/files`;
        
        // Создаем URL с параметрами
        const params = new URLSearchParams();
        if (options.page) params.append('page', options.page);
        if (options.limit) params.append('limit', options.limit);
        if (options.sort_by) params.append('sort_by', options.sort_by);
        if (options.sort_order) params.append('sort_order', options.sort_order);
        if (options.search) params.append('search', options.search);
        if (options.user_filter) params.append('user_filter', options.user_filter);
        if (options.size_from) params.append('size_from', options.size_from);
        if (options.size_to) params.append('size_to', options.size_to);
        if (options.date_from) params.append('date_from', options.date_from);
        if (options.date_to) params.append('date_to', options.date_to);

        const fullUrl = params.toString() ? `${url}?${params.toString()}` : url;
        
        const response = await fetch(fullUrl, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.json();
    }

    static async downloadFile(fileId, token) {
        const response = await fetch(`${API_BASE}/files/download/${fileId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response;
    }

    static async deleteFile(fileId, token) {
        const response = await fetch(`${API_BASE}/files/${fileId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.json();
    }

    // Методы для управления пользователями
    static async getAllUsers(token) {
        const response = await fetch(`${API_BASE}/users`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.json();
    }

    static async getUser(userId, token) {
        const response = await fetch(`${API_BASE}/users/${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.json();
    }

    static async updateUserRole(userId, newRole, token) {
        const response = await fetch(`${API_BASE}/users/${userId}/role`, {
            method: 'PUT',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ role: newRole })
        });
        return response.json();
    }

    static async deleteUser(userId, token) {
        const response = await fetch(`${API_BASE}/users/${userId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.json();
    }
}

export default ApiService;