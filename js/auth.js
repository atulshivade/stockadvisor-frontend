/**
 * StockAdvisor - Authentication Functions
 * Developed by Atul Shivade @2026
 */

// Check if backend is available
function checkBackendAvailable() {
    if (!BACKEND_AVAILABLE) {
        alert('⚠️ Backend Server Not Available\n\nThe app is deployed on Netlify but the backend server is running locally.\n\nTo test on mobile:\n1. Deploy backend to Render/Railway/Heroku\n2. Update BACKEND_URL in config.js\n\nFor now, please test on your local computer where the backend is running.');
        return false;
    }
    return true;
}

// Show Auth Container
function showAuth() {
    document.getElementById('authContainer').style.display = 'flex';
    document.getElementById('appContainer').style.display = 'none';
}

// Show App Container
function showApp() {
    document.getElementById('authContainer').style.display = 'none';
    document.getElementById('appContainer').style.display = 'flex';
    initApp();
}

// Toggle between Login and Register forms
function toggleAuth() {
    const login = document.getElementById('loginForm');
    const reg = document.getElementById('registerForm');
    const show = login.style.display !== 'none';
    login.style.display = show ? 'none' : 'block';
    reg.style.display = show ? 'block' : 'none';
    document.getElementById('authToggleText').textContent = show ? 'Have an account?' : 'New user?';
    document.getElementById('authToggleLink').textContent = show ? 'Sign in' : 'Create account';
}

// Check Authentication
async function checkAuth() {
    if (!BACKEND_AVAILABLE) {
        token = null;
        localStorage.removeItem('token');
        showAuth();
        return;
    }
    try {
        const res = await fetch(`${API}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error();
        currentUser = await res.json();
        showApp();
    } catch {
        token = null;
        localStorage.removeItem('token');
        showAuth();
    }
}

// Login Handler
async function handleLogin(e) {
    e.preventDefault();
    if (!checkBackendAvailable()) return;
    try {
        const res = await fetch(`${API}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `username=${encodeURIComponent(document.getElementById('loginEmail').value)}&password=${encodeURIComponent(document.getElementById('loginPassword').value)}`
        });
        if (!res.ok) throw new Error((await res.json()).detail || 'Login failed');
        const data = await res.json();
        token = data.access_token;
        localStorage.setItem('token', token);
        checkAuth();
    } catch (err) { alert(err.message); }
}

// Register Handler
async function handleRegister(e) {
    e.preventDefault();
    if (!checkBackendAvailable()) return;
    try {
        const res = await fetch(`${API}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: document.getElementById('regEmail').value,
                password: document.getElementById('regPassword').value,
                first_name: document.getElementById('regFirstName').value,
                last_name: document.getElementById('regLastName').value
            })
        });
        if (!res.ok) throw new Error((await res.json()).detail || 'Registration failed');
        const data = await res.json();
        token = data.access_token;
        localStorage.setItem('token', token);
        checkAuth();
    } catch (err) { alert(err.message); }
}

// SSO Login with OAuth popup
function ssoLogin(provider) {
    if (!checkBackendAvailable()) return;
    // Open OAuth popup directly - backend will redirect to demo login page
    const width = 500, height = 600;
    const left = (screen.width - width) / 2;
    const top = (screen.height - height) / 2;
    const authUrl = `${API}/auth/oauth/${provider}`;
    const popup = window.open(authUrl, `${provider}Login`, `width=${width},height=${height},left=${left},top=${top}`);
    
    // Listen for OAuth callback message
    const handler = function(e) {
        if (e.data && e.data.type === 'oauth_success') {
            token = e.data.token;
            localStorage.setItem('token', token);
            checkAuth();
            window.removeEventListener('message', handler);
        }
    };
    window.addEventListener('message', handler);
    
    // Check if popup was blocked
    if (!popup || popup.closed) {
        alert('Popup blocked! Please allow popups for this site.');
        window.removeEventListener('message', handler);
    }
}

// Logout
function logout() {
    token = null;
    currentUser = null;
    localStorage.removeItem('token');
    localStorage.removeItem('exchange');
    
    // Stop auto-refresh
    if (typeof stopAutoRefresh === 'function') stopAutoRefresh();
    
    // Clear all forms
    document.getElementById('loginEmail').value = '';
    document.getElementById('loginPassword').value = '';
    document.getElementById('regFirstName').value = '';
    document.getElementById('regLastName').value = '';
    document.getElementById('regEmail').value = '';
    document.getElementById('regPassword').value = '';
    
    // Clear search box
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.value = '';
    
    // Show login form (not register)
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('authToggleText').textContent = 'New user?';
    document.getElementById('authToggleLink').textContent = 'Create account';
    
    showAuth();
}

// Guest Login with device/location info
async function guestLogin() {
    if (!checkBackendAvailable()) return;
    try {
        // Collect device information
        const deviceInfo = {
            user_agent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            screen_width: screen.width,
            screen_height: screen.height,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        };
        
        // Try multiple IP geolocation services (more reliable than browser geolocation)
        const geoServices = [
            { url: 'https://ipapi.co/json/', parse: d => ({ ip: d.ip, city: d.city, country: d.country_name, lat: d.latitude, lon: d.longitude }) },
            { url: 'https://ip-api.com/json/', parse: d => ({ ip: d.query, city: d.city, country: d.country, lat: d.lat, lon: d.lon }) },
            { url: 'https://ipwho.is/', parse: d => ({ ip: d.ip, city: d.city, country: d.country, lat: d.latitude, lon: d.longitude }) }
        ];
        
        let locationFound = false;
        for (const service of geoServices) {
            if (locationFound) break;
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 3000);
                const res = await fetch(service.url, { signal: controller.signal });
                clearTimeout(timeoutId);
                
                if (res.ok) {
                    const data = await res.json();
                    const parsed = service.parse(data);
                    if (parsed.city && parsed.country) {
                        deviceInfo.ip_address = parsed.ip;
                        deviceInfo.city = parsed.city;
                        deviceInfo.country = parsed.country;
                        deviceInfo.latitude = parsed.lat;
                        deviceInfo.longitude = parsed.lon;
                        locationFound = true;
                        console.log('Location found via:', service.url);
                    }
                }
            } catch (e) {
                console.log('Geo service failed:', service.url, e.message);
            }
        }
        
        // Fallback: Try browser geolocation if IP services failed
        if (!locationFound && navigator.geolocation) {
            try {
                const position = await new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000, enableHighAccuracy: false });
                });
                deviceInfo.latitude = position.coords.latitude;
                deviceInfo.longitude = position.coords.longitude;
                // Reverse geocode to get city/country (optional fallback)
                deviceInfo.city = 'Detected via GPS';
                deviceInfo.country = deviceInfo.timezone.split('/')[0] || 'Unknown';
            } catch (locErr) {
                console.log('Browser geolocation failed:', locErr.message);
            }
        }
        
        // Final fallback: use timezone to estimate region
        if (!deviceInfo.city) {
            const tz = deviceInfo.timezone || '';
            if (tz.includes('America')) deviceInfo.country = 'United States';
            else if (tz.includes('Europe')) deviceInfo.country = 'Europe';
            else if (tz.includes('Asia/Kolkata') || tz.includes('Asia/Calcutta')) deviceInfo.country = 'India';
            else if (tz.includes('Asia')) deviceInfo.country = 'Asia';
            else deviceInfo.country = 'Unknown';
            deviceInfo.city = tz.split('/').pop()?.replace(/_/g, ' ') || 'Unknown';
        }
        
        const res = await fetch(`${API}/auth/guest`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(deviceInfo)
        });
        if (!res.ok) throw new Error((await res.json()).detail || 'Guest login failed');
        const data = await res.json();
        token = data.access_token;
        localStorage.setItem('token', token);
        checkAuth();
    } catch (err) { alert(err.message); }
}

// Setup Auth Event Listeners
function setupAuthListeners() {
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
}

