// Global Environment Gateway Configuration
const API_BASE_URL = "http://localhost:8080";

const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const alertBox = document.getElementById('alertBox');

// Navigation Toggles
if(document.getElementById('showRegisterBtn')) {
    document.getElementById('showRegisterBtn').addEventListener('click', (e) => {
        e.preventDefault(); loginForm.classList.add('hidden'); registerForm.classList.remove('hidden'); hideAlert();
    });
}
if(document.getElementById('showLoginBtn')) {
    document.getElementById('showLoginBtn').addEventListener('click', (e) => {
        e.preventDefault(); registerForm.classList.add('hidden'); loginForm.classList.remove('hidden'); hideAlert();
    });
}

function showAlert(message, isError = false) {
    alertBox.textContent = message; 
    alertBox.classList.remove('hidden', 'bg-red-500', 'bg-green-500');
    alertBox.classList.add(isError ? 'bg-red-500' : 'bg-green-500');
}
function hideAlert() { alertBox.classList.add('hidden'); }

// Sign Up Handler
if(registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('regEmail').value;
        const password = document.getElementById('regPassword').value;
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await response.json();
            if (response.ok) {
                showAlert('Registration successful!', false);
                setTimeout(() => document.getElementById('showLoginBtn').click(), 1500);
            } else { showAlert(data.error || 'Registration failed.', true); }
        } catch (error) { showAlert('Cannot reach Java Server on port 8080.', true); }
    });
}

// Login Handler
if(loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await response.json();
            if (response.ok) {
                localStorage.setItem('jwtToken', data.token); // Secure token storage
                showAlert('Access authorized! Launching...', false);
                setTimeout(() => { window.location.href = 'dashboard.html'; }, 1000);
            } else { showAlert(data.error || 'Invalid credentials.', true); }
        } catch (error) { showAlert('Cannot reach Java Server on port 8080.', true); }
    });
}