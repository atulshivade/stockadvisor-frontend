/**
 * StockAdvisor - Main Application
 * Developed by Atul Shivade @2026
 */

// Initialize App on DOM Load
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('exchangeSelect').value = selectedExchange;
    updateCurrency();
    setupAuthListeners();
    setupSearch();
    setupEventListeners();
    
    if (token) {
        checkAuth();
    } else {
        showAuth();
    }
});

// Initialize App after Login
function initApp() {
    if (currentUser) {
        document.getElementById('userInitials').textContent = 
            (currentUser.first_name?.[0] || '') + (currentUser.last_name?.[0] || '');
        
        // Only atul.shivade@gmail.com can see Admin, Feedback, and Sanity tabs
        if (currentUser.email === ADMIN_EMAIL) {
            document.getElementById('adminBadge').style.display = 'flex';
            document.getElementById('adminNavBtn').style.display = 'block';
            document.getElementById('feedbackNavBtn').style.display = 'block';
            document.getElementById('sanityNavBtn').style.display = 'block';
        } else {
            document.getElementById('adminBadge').style.display = 'none';
            document.getElementById('adminNavBtn').style.display = 'none';
            document.getElementById('feedbackNavBtn').style.display = 'none';
            document.getElementById('sanityNavBtn').style.display = 'none';
            // Non-admin users always go to home page (markets)
            showTab('markets');
        }
    }
    loadAllData();
}

// Load All Data
function loadAllData() {
    Promise.all([fetchMarket(), fetchPortfolioData(), fetchWatchlistData(), fetchAIPicks()]);
}

// Setup Event Listeners
function setupEventListeners() {
    // Close dropdowns on outside click
    document.addEventListener('click', e => {
        if (!e.target.closest('#userAvatar')) {
            document.getElementById('userDropdown').classList.remove('active');
        }
        if (!e.target.closest('.search-wrapper')) {
            document.getElementById('searchResults').classList.remove('active');
        }
    });
}

// Setup Search
function setupSearch() {
    const input = document.getElementById('searchInput');
    input.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        const q = input.value.trim();
        if (q.length < 1) {
            document.getElementById('searchResults').classList.remove('active');
            return;
        }
        document.getElementById('searchResults').innerHTML = '<div class="search-loading">Searching...</div>';
        document.getElementById('searchResults').classList.add('active');
        searchTimeout = setTimeout(() => searchStocks(q), 300);
    });
}

// Exchange Change Handler
function onExchangeChange() {
    selectedExchange = document.getElementById('exchangeSelect').value;
    localStorage.setItem('exchange', selectedExchange);
    updateCurrency();
    loadAllData();
}

// Tab Navigation
function showTab(tab) {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
    document.querySelectorAll('.tab-content').forEach(t => t.style.display = 'none');
    document.getElementById(tab + 'Tab').style.display = 'block';
    
    // Refresh data when switching tabs
    if (tab === 'markets') fetchMarket();
    else if (tab === 'portfolio') fetchPortfolioData();
    else if (tab === 'watchlist') fetchWatchlistData();
    else if (tab === 'aipicks') fetchAIPicks();
    else if (tab === 'feedback') fetchFeedback();
    else if (tab === 'admin') { fetchAdminStats(); fetchUsers(); fetchGuestSessions(); }
    else if (tab === 'sanity') fetchSanityResults();
}

// Toggle User Dropdown
function toggleUserDropdown() {
    document.getElementById('userDropdown').classList.toggle('active');
}

// Filter Feedback
function filterFeedback(status) {
    feedbackFilter = status;
    document.querySelectorAll('#feedbackTab .tab').forEach((t, i) => {
        t.classList.toggle('active', 
            (status === null && i === 0) || 
            (status === 'new' && i === 1) || 
            (status === 'in_progress' && i === 2) || 
            (status === 'resolved' && i === 3)
        );
    });
    fetchFeedback();
}

// Modal Functions
function openFeedbackModal() {
    document.getElementById('feedbackModal').classList.add('active');
}

function closeFeedbackModal() {
    document.getElementById('feedbackModal').classList.remove('active');
}

function openPortfolioModal(symbol, price, qty = 10, avgCost = null) {
    pendingPortfolioSymbol = symbol;
    document.getElementById('portfolioModalTitle').textContent = avgCost ? 'Edit Portfolio' : 'Add to Portfolio';
    document.getElementById('portfolioModalStock').innerHTML = `<div style="font-weight:600;font-size:1.1rem">${symbol}</div><div style="color:var(--text-muted)">Current: ${currencySymbol}${price.toFixed(2)}</div>`;
    document.getElementById('portfolioQty').value = qty;
    document.getElementById('portfolioPrice').value = avgCost || price;
    document.getElementById('portfolioModalSubmit').textContent = avgCost ? 'Update' : 'Add to Portfolio';
    document.getElementById('portfolioModal').classList.add('active');
}

function closePortfolioModal() {
    document.getElementById('portfolioModal').classList.remove('active');
    pendingPortfolioSymbol = null;
}

async function confirmAddPortfolio() {
    if (!pendingPortfolioSymbol) return;
    const qty = parseInt(document.getElementById('portfolioQty').value) || 1;
    const price = parseFloat(document.getElementById('portfolioPrice').value) || 0;
    try {
        await addToPortfolio(pendingPortfolioSymbol, qty, price);
        closePortfolioModal();
        fetchPortfolioData();
        alert(`${pendingPortfolioSymbol} added to portfolio!`);
    } catch (e) { alert(e.message); }
}

async function openStockModal(symbol) {
    document.getElementById('stockModal').classList.add('active');
    document.getElementById('stockModalTitle').textContent = symbol;
    document.getElementById('stockModalBody').innerHTML = '<div class="loading"><div class="spinner"></div>Loading...</div>';
    document.getElementById('searchResults').classList.remove('active');
    
    try {
        const data = await getStockQuote(symbol);
        const ai = data.ai_analysis || {};
        const sentimentClass = (ai.overall_sentiment || '').toLowerCase().replace(' ', '-');
        const tvUrl = data.tradingview_url || `https://www.tradingview.com/symbols/${symbol}/`;
        
        document.getElementById('stockModalBody').innerHTML = `
            <div style="display:grid;gap:1rem">
                <div style="display:flex;justify-content:space-between;align-items:center">
                    <div>
                        <div style="font-size:1.5rem;font-weight:700">${data.name || symbol}</div>
                        <div style="color:var(--text-muted)">${data.sector || ''} | ${data.exchange || selectedExchange}</div>
                    </div>
                    <div style="text-align:right">
                        <div style="font-size:1.75rem;font-weight:700;font-family:var(--font-mono)">${currencySymbol}${(data.current_price || 0).toLocaleString()}</div>
                        <div class="change ${(data.change_percent || 0) >= 0 ? 'positive' : 'negative'}" style="font-size:1rem">${(data.change_percent || 0) >= 0 ? '+' : ''}${(data.change_percent || 0).toFixed(2)}% (${currencySymbol}${(data.change || 0).toFixed(2)})</div>
                    </div>
                </div>
                
                <a href="${tvUrl}" target="_blank" class="tv-link-btn" style="align-self:flex-start">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                    Open in TradingView
                </a>
                
                <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:0.75rem">
                    <div style="padding:0.75rem;background:var(--bg-primary);border-radius:8px"><div style="font-size:0.7rem;color:var(--text-muted)">Open</div><div style="font-weight:600;font-family:var(--font-mono)">${currencySymbol}${(data.open_price || 0).toFixed(2)}</div></div>
                    <div style="padding:0.75rem;background:var(--bg-primary);border-radius:8px"><div style="font-size:0.7rem;color:var(--text-muted)">High</div><div style="font-weight:600;font-family:var(--font-mono)">${currencySymbol}${(data.day_high || 0).toFixed(2)}</div></div>
                    <div style="padding:0.75rem;background:var(--bg-primary);border-radius:8px"><div style="font-size:0.7rem;color:var(--text-muted)">Low</div><div style="font-weight:600;font-family:var(--font-mono)">${currencySymbol}${(data.day_low || 0).toFixed(2)}</div></div>
                    <div style="padding:0.75rem;background:var(--bg-primary);border-radius:8px"><div style="font-size:0.7rem;color:var(--text-muted)">Volume</div><div style="font-weight:600;font-family:var(--font-mono)">${((data.volume || 0) / 1e6).toFixed(1)}M</div></div>
                </div>
                
                <div style="padding:1rem;background:var(--bg-primary);border-radius:8px">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem">
                        <h4 style="margin:0;display:flex;align-items:center;gap:0.5rem"><span class="ai-badge">AI ANALYSIS</span></h4>
                        <span class="sentiment-badge ${sentimentClass}">${ai.overall_sentiment || 'NEUTRAL'}</span>
                    </div>
                    <div style="margin-bottom:1rem">
                        <div style="font-size:0.8rem;color:var(--text-muted);margin-bottom:0.25rem">Confidence Score</div>
                        <div style="display:flex;align-items:center;gap:0.75rem">
                            <div style="flex:1;height:8px;background:var(--bg-hover);border-radius:4px;overflow:hidden">
                                <div style="width:${ai.confidence_score || 50}%;height:100%;background:var(--accent-gradient)"></div>
                            </div>
                            <span style="font-weight:600">${(ai.confidence_score || 50).toFixed(0)}%</span>
                        </div>
                    </div>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">
                        <div>
                            <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:0.25rem">Short Term (${ai.short_term_outlook?.timeframe || '1-4 weeks'})</div>
                            <div style="font-weight:600;color:${ai.short_term_outlook?.recommendation?.includes('BUY') ? 'var(--positive)' : ai.short_term_outlook?.recommendation?.includes('SELL') ? 'var(--negative)' : 'var(--warning)'}">${ai.short_term_outlook?.recommendation || 'HOLD'}</div>
                            <div style="font-size:0.8rem;color:var(--text-muted)">Target: ${ai.short_term_outlook?.target_change > 0 ? '+' : ''}${ai.short_term_outlook?.target_change || 0}%</div>
                        </div>
                        <div>
                            <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:0.25rem">Long Term (${ai.long_term_outlook?.timeframe || '6-12 months'})</div>
                            <div style="font-weight:600;color:${ai.long_term_outlook?.recommendation?.includes('BUY') ? 'var(--positive)' : ai.long_term_outlook?.recommendation?.includes('SELL') ? 'var(--negative)' : 'var(--warning)'}">${ai.long_term_outlook?.recommendation || 'HOLD'}</div>
                            <div style="font-size:0.8rem;color:var(--text-muted)">Target: ${ai.long_term_outlook?.target_change > 0 ? '+' : ''}${ai.long_term_outlook?.target_change || 0}%</div>
                        </div>
                    </div>
                    <div style="margin-top:1rem;display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;font-size:0.85rem">
                        <div><span style="color:var(--text-muted)">Risk:</span> <span style="font-weight:500">${ai.risk_level || 'Medium'}</span></div>
                        <div><span style="color:var(--text-muted)">Technical:</span> <span style="font-weight:500">${ai.technical_rating || 'Neutral'}</span></div>
                    </div>
                    ${ai.bullish_factors?.length ? `<div style="margin-top:1rem"><div style="font-size:0.75rem;color:var(--positive);margin-bottom:0.25rem">Bullish Factors</div><div style="font-size:0.85rem">${ai.bullish_factors.join(' • ')}</div></div>` : ''}
                    ${ai.bearish_factors?.length ? `<div style="margin-top:0.5rem"><div style="font-size:0.75rem;color:var(--negative);margin-bottom:0.25rem">Bearish Factors</div><div style="font-size:0.85rem">${ai.bearish_factors.join(' • ')}</div></div>` : ''}
                </div>
                
                <div style="display:flex;gap:0.75rem">
                    <button class="btn btn-primary" style="flex:1" onclick="openPortfolioModal('${symbol}',${data.current_price || 0});closeStockModal()">Add to Portfolio</button>
                    <button class="btn btn-secondary" style="flex:1" onclick="addToWatchlist('${symbol}');closeStockModal()">Add to Watchlist</button>
                </div>
            </div>
        `;
    } catch (e) {
        document.getElementById('stockModalBody').innerHTML = `<div class="empty-state">Error: ${e.message}</div>`;
    }
}

function closeStockModal() {
    document.getElementById('stockModal').classList.remove('active');
}

