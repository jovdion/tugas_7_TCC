const API_URL = 'https://tugas-7-dion-913201672104.us-central1.run.app';

function joinUrl(base, path) {
    if (base.endsWith('/')) base = base.slice(0, -1);
    if (!path.startsWith('/')) path = '/' + path;
    return base + path;
}

let token = localStorage.getItem('token');

function handleSessionExpired() {
    alert('Sesi Anda telah habis. Silakan login ulang.');
    localStorage.removeItem('token');
    token = null;
    window.location.href = 'login.html';
}

function checkTokenValidity(response) {
    return !(response.status === 401 || response.status === 403);
}

async function refreshAccessToken() {
    try {
        const response = await fetch(joinUrl(API_URL, 'refresh-token'), {
            method: 'GET',
            credentials: 'include'
        });

        if (!response.ok) throw new Error('Refresh token gagal');

        const data = await response.json();
        if (data.accessToken) {
            localStorage.setItem('token', data.accessToken);
            token = data.accessToken;
            console.log('Token berhasil di-refresh');
            return true;
        }

        return false;
    } catch (err) {
        console.error('Gagal refresh token:', err);
        return false;
    }
}

async function apiRequest(url, options = {}, retry = true) {
    try {
        token = localStorage.getItem('token');
        if (!token) {
            handleSessionExpired();
            return null;
        }

        options.headers = options.headers || {};
        options.headers.Authorization = `Bearer ${token}`; // Add token to Authorization header

        let response = await fetch(url, options);

        if (checkTokenValidity(response)) return response;

        if (retry) {
            const refreshed = await refreshAccessToken();
            if (refreshed) {
                options.headers.Authorization = `Bearer ${token}`;
                return await apiRequest(url, options, false);
            }
        }

        handleSessionExpired();
        return null;
    } catch (err) {
        console.error("API Request Error:", err);
        throw err;
    }
}

// Login form handling
const loginForm = document.getElementById("loginForm");
if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        try {
            const response = await fetch(joinUrl(API_URL, 'login'), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });

            if (!response.ok) {
                const errorData = await response.json();
                alert("Login gagal: " + (errorData.msg || "Terjadi kesalahan"));
                return;
            }

            const data = await response.json();
            localStorage.setItem("token", data.accessToken);
            token = data.accessToken;
            window.location.href = "index.html";
        } catch (err) {
            console.error(err);
            alert("Terjadi kesalahan saat login.");
        }
    });
}

// Fetch notes function
async function fetchNotes() {
    try {
        const response = await apiRequest(`${API_URL}/catatan`);
        if (!response || !response.ok) throw new Error('Gagal mengambil catatan');

        const notes = await response.json();
        const catatanList = document.getElementById('catatan-list');
        catatanList.innerHTML = '';

        if (notes.length === 0) {
            catatanList.innerHTML = `<tr><td colspan="4">Belum ada catatan. Buat catatan baru!</td></tr>`;
            return;
        }

        notes.forEach(note => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${note.catatan_id}</td>
                <td>${note.name}</td>
                <td>${note.judul}</td>
                <td>${note.isi_catatan}</td>
                <td>
                    <button onclick="editNote(${note.catatan_id}, '${note.name}', '${note.judul}', '${note.isi_catatan}')" class="edit">Edit</button>
                    <button onclick="deleteNote(${note.catatan_id})" class="delete">Hapus</button>
                </td>
            `;
            catatanList.appendChild(row);
        });
    } catch (error) {
        console.error('Error fetching notes:', error);
        alert('Gagal mengambil catatan.');
    }
}

// Example of other code (CRUD functions for catatan, etc.) remains as you originally had it...
