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

    static async getFiles(token, isAdmin = false) {
        const url = isAdmin ? `${API_BASE}/admin/files` : `${API_BASE}/files`;
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.json();
    }
}

export default ApiService;