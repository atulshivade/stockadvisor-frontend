/**
 * StockAdvisor - API Functions
 * Developed by Atul Shivade @2026
 */

// Generic API Call Helper
async function api(path, opts = {}) {
    const res = await fetch(`${API}${path}`, {
        ...opts,
        headers: { ...opts.headers, Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error((await res.json()).detail || 'Error');
    return res.json();
}

// Market Data
async function fetchMarket() {
    try {
        const data = await api(`/stocks/market-overview?exchange=${selectedExchange}`);
        renderMarketOverview(data);
    } catch (e) {
        document.getElementById('marketTable').innerHTML = `<div class="empty-state">Error: ${e.message}</div>`;
    }
}

// Portfolio Data
async function fetchPortfolioData() {
    try {
        const data = await api(`/portfolio?exchange=${selectedExchange}`);
        renderPortfolio(data);
    } catch (e) { console.error(e); }
}

// Watchlist Data
async function fetchWatchlistData() {
    try {
        const data = await api(`/watchlist?exchange=${selectedExchange}`);
        renderWatchlist(data);
    } catch (e) { console.error(e); }
}

// AI Recommendations
async function fetchAIPicks() {
    try {
        const data = await api(`/recommendations?exchange=${selectedExchange}`);
        renderAIPicks(data);
    } catch (e) {
        document.getElementById('aiPicksTable').innerHTML = `<div class="empty-state">Error: ${e.message}</div>`;
    }
}

// Feedback
async function fetchFeedback() {
    try {
        const url = feedbackFilter ? `/feedback?status=${feedbackFilter}` : '/feedback';
        const data = await api(url);
        renderFeedbackList(data);
    } catch (e) {
        document.getElementById('feedbackList').innerHTML = `<div class="empty-state">Error: ${e.message}</div>`;
    }
}

// Admin Stats
async function fetchAdminStats() {
    try {
        const data = await api('/admin/stats');
        renderAdminStats(data);
    } catch (e) { console.error(e); }
}

// Users
async function fetchUsers() {
    try {
        const data = await api('/admin/users');
        renderUsersList(data);
    } catch (e) {
        document.getElementById('usersList').innerHTML = `<div class="empty-state">Error: ${e.message}</div>`;
    }
}

// Sanity Results
async function fetchSanityResults() {
    try {
        const data = await api('/admin/sanity/results');
        if (data.results && data.results.length > 0) {
            displaySanityResults(data);
        } else {
            document.getElementById('sanityResults').innerHTML = '<div class="empty-state">No tests run yet. Click "Run All Tests" to execute sanity tests.</div>';
            document.getElementById('sanityTotal').textContent = '0';
            document.getElementById('sanityPassed').textContent = '0';
            document.getElementById('sanityFailed').textContent = '0';
            document.getElementById('sanityErrors').textContent = '0';
        }
    } catch (e) {
        document.getElementById('sanityResults').innerHTML = `<div class="empty-state">Error: ${e.message}</div>`;
    }
}

// Run Sanity Tests
async function runSanityTests() {
    document.getElementById('sanityResults').innerHTML = '<div class="loading"><div class="spinner"></div>Running sanity tests... This may take a moment.</div>';
    try {
        const data = await api('/admin/sanity/run', { method: 'POST' });
        displaySanityResults(data);
    } catch (e) {
        document.getElementById('sanityResults').innerHTML = `<div class="empty-state">Error: ${e.message}</div>`;
    }
}

// Search Stocks
async function searchStocks(q) {
    try {
        const data = await api(`/stocks/search?q=${encodeURIComponent(q)}&exchange=${selectedExchange}`);
        renderSearchResults(data);
    } catch (e) {
        document.getElementById('searchResults').innerHTML = '<div class="search-loading">Search failed</div>';
    }
}

// Get Stock Quote
async function getStockQuote(symbol) {
    return await api(`/stocks/quote/${symbol}?exchange=${selectedExchange}`);
}

// Portfolio Actions
async function addToPortfolio(symbol, quantity, avgCost) {
    return await api(`/portfolio/add?exchange=${selectedExchange}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol, quantity, avg_cost: avgCost })
    });
}

async function removeFromPortfolio(symbol) {
    if (!confirm(`Remove ${symbol} from portfolio?`)) return;
    try {
        await api(`/portfolio/${symbol}?exchange=${selectedExchange}`, { method: 'DELETE' });
        fetchPortfolioData();
    } catch (e) { alert(e.message); }
}

// Watchlist Actions
async function addToWatchlist(symbol) {
    try {
        await api(`/watchlist/add?exchange=${selectedExchange}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ symbol })
        });
        fetchWatchlistData();
        alert(`${symbol} added to watchlist!`);
    } catch (e) { alert(e.message); }
}

async function removeFromWatchlist(symbol) {
    try {
        await api(`/watchlist/${symbol}?exchange=${selectedExchange}`, { method: 'DELETE' });
        fetchWatchlistData();
    } catch (e) { alert(e.message); }
}

// Feedback Actions
async function submitFeedback() {
    try {
        await api('/feedback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: document.getElementById('feedbackType').value,
                message: document.getElementById('feedbackMessage').value,
                page: window.location.pathname
            })
        });
        closeFeedbackModal();
        document.getElementById('feedbackMessage').value = '';
        alert('Feedback submitted! Thank you.');
    } catch (e) { alert(e.message); }
}

async function updateFeedbackStatus(id, status) {
    try {
        await api(`/feedback/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        fetchFeedback();
    } catch (e) { alert(e.message); }
}

async function deleteFeedback(id) {
    if (!confirm('Delete this feedback?')) return;
    try {
        await api(`/feedback/${id}`, { method: 'DELETE' });
        fetchFeedback();
    } catch (e) { alert(e.message); }
}

// Admin Actions
async function toggleUserStatus(email, active) {
    try {
        await api(`/admin/users/${encodeURIComponent(email)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_active: active })
        });
        fetchUsers();
    } catch (e) { alert(e.message); }
}

async function resetUserPassword(email) {
    if (!confirm(`Reset password for ${email}?`)) return;
    try {
        const data = await api(`/admin/users/${encodeURIComponent(email)}/reset-password`, { method: 'POST' });
        alert(`Password reset! New temporary password: ${data.temporary_password}\n\nPlease share this securely with the user.`);
        fetchUsers();
    } catch (e) { alert(e.message); }
}

// Guest Sessions (Admin)
async function fetchGuestSessions() {
    try {
        const data = await api('/admin/guest-sessions');
        renderGuestSessions(data);
    } catch (e) {
        const container = document.getElementById('guestSessionsList');
        if (container) {
            container.innerHTML = `<div class="empty-state">Error: ${e.message}</div>`;
        }
    }
}

