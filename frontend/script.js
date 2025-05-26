const API_URL = 'http://localhost:3000';

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
        const response = await fetch(joinUrl(API_URL, 'token'), {
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
        options.headers.Authorization = `Bearer ${token}`;

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

// LOGIN
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

// REGISTER
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = document.getElementById('username').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confPassword = document.getElementById('confPassword').value;

        if (password !== confPassword) {
            alert('Password dan konfirmasi password tidak cocok!');
            return;
        }

        try {
            const response = await fetch(joinUrl(API_URL, 'users'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password, confPassword })
            });

            if (response.ok) {
                alert('Register berhasil! Silakan login.');
                window.location.href = 'login.html';
            } else {
                const data = await response.json();
                alert('Gagal Register: ' + (data.msg || 'Terjadi kesalahan'));
            }
        } catch (err) {
            console.error(err);
            alert('Terjadi kesalahan saat register.');
        }
    });

    const passwordInput = document.getElementById('password');
    const strengthMeter = document.querySelector('.strength-meter');

    if (passwordInput && strengthMeter) {
        passwordInput.addEventListener('input', function () {
            const password = this.value;
            let strength = 0;
            if (password.length >= 8) strength += 25;
            if (/[A-Z]/.test(password)) strength += 25;
            if (/[0-9]/.test(password)) strength += 25;
            if (/[^A-Za-z0-9]/.test(password)) strength += 25;

            strengthMeter.style.width = strength + '%';
            if (strength <= 25) strengthMeter.style.backgroundColor = '#ff4d4d';
            else if (strength <= 50) strengthMeter.style.backgroundColor = '#ffa64d';
            else if (strength <= 75) strengthMeter.style.backgroundColor = '#ffff4d';
            else strengthMeter.style.backgroundColor = '#4dff4d';
        });
    }
}

// INDEX.HTML LOGIC
const catatanForm = document.getElementById('catatan-form');
const catatanIdField = document.getElementById('catatan-id');
const namaField = document.getElementById('nama');
const judulField = document.getElementById('judul');
const isiField = document.getElementById('isi');
const catatanList = document.getElementById('catatan-list');
const formTitle = document.getElementById('form-title');
const submitBtn = document.getElementById('submit-btn');
const cancelBtn = document.getElementById('cancel-btn');
const statusDiv = document.getElementById('status');
const logoutBtn = document.getElementById('logoutBtn');

if (catatanForm && catatanIdField && namaField && judulField && isiField && catatanList && formTitle && submitBtn && cancelBtn && statusDiv) {
    cancelBtn.addEventListener('click', resetForm);
    catatanForm.addEventListener('submit', handleCatatanSubmit);
}

if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        try {
            await fetch(joinUrl(API_URL, 'logout'), {
                method: 'DELETE',
                credentials: 'include'
            });
        } catch (error) {
            console.error('Error saat logout:', error);
        } finally {
            localStorage.removeItem('token');
            token = null;
            window.location.href = 'login.html';
        }
    });
}

async function initializeApp() {
    token = localStorage.getItem('token');
    if (!token) {
        console.log('Token tidak ditemukan, redirect ke login');
        window.location.href = 'login.html';
        return;
    }

    console.log('Token ditemukan, memuat catatan...');
    await fetchNotes();
}

async function fetchNotes() {
    try {
        const response = await apiRequest(`${API_URL}/catatan`);
        if (!response || !response.ok) throw new Error('Gagal mengambil catatan');

        const notes = await response.json();
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

function resetForm() {
    catatanIdField.value = '';
    namaField.value = '';
    judulField.value = '';
    isiField.value = '';
    formTitle.textContent = 'Tambah Catatan Baru';
    submitBtn.textContent = 'Tambah';
    cancelBtn.style.display = 'none';
    statusDiv.textContent = '';
}

async function handleCatatanSubmit(event) {
    event.preventDefault();

    const id = catatanIdField.value;
    const name = namaField.value;
    const judul = judulField.value;
    const isi_catatan = isiField.value;

    if (!name || !judul || !isi_catatan) {
        alert('Nama, judul, dan isi catatan tidak boleh kosong.');
        return;
    }

    const method = id ? 'PUT' : 'POST';
    const url = id ? `${API_URL}/catatan-update/${id}` : `${API_URL}/catatan`;

    try {
        const response = await apiRequest(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, judul, isi_catatan })
        });

        if (!response || !response.ok) {
            const data = await response.json();
            alert(`Gagal ${id ? 'mengubah' : 'menambahkan'} catatan: ` + (data.msg || 'Terjadi kesalahan'));
            return;
        }

        resetForm();
        fetchNotes();
    } catch (error) {
        console.error('Error submitting note:', error);
        alert('Terjadi kesalahan saat menyimpan catatan.');
    }
}

async function deleteNote(id) {
    if (!confirm('Anda yakin ingin menghapus catatan ini?')) return;

    try {
        const response = await apiRequest(`${API_URL}/catatan-hapus/${id}`, { method: 'DELETE' });

        if (!response || !response.ok) {
            const data = await response.json();
            alert('Gagal menghapus catatan: ' + (data.msg || 'Terjadi kesalahan'));
            return;
        }

        fetchNotes();
    } catch (error) {
        console.error('Error deleting note:', error);
        alert('Terjadi kesalahan saat menghapus catatan.');
    }
}

function editNote(id, name, judul, isi_catatan) {
    catatanIdField.value = id;
    namaField.value = name;
    judulField.value = judul;
    isiField.value = isi_catatan;
    formTitle.textContent = 'Edit Catatan';
    submitBtn.textContent = 'Simpan';
    cancelBtn.style.display = 'inline';
    statusDiv.textContent = '';
}

// Jalankan hanya jika sedang di halaman index.html
if (window.location.pathname.includes('index.html') || window.location.pathname === '/' || window.location.pathname.endsWith('/')) {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('DOM loaded, inisialisasi aplikasi...');
        initializeApp();
    });
}
