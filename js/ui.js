/**
 * StockAdvisor - UI Rendering Functions
 * Developed by Atul Shivade @2026
 */

// Update Currency Display
function updateCurrency() {
    currencySymbol = CURRENCIES[selectedExchange]?.s || '$';
    document.getElementById('currencyBadge').textContent = CURRENCIES[selectedExchange]?.c || 'USD';
    document.getElementById('portfolioCurrencyLabel').textContent = currencySymbol;
}

// Render Market Overview
function renderMarketOverview(data) {
    const stocks = data.stocks || [];
    if (stocks.length) {
        const sorted = [...stocks].sort((a, b) => (b.change_percent || 0) - (a.change_percent || 0));
        const top = sorted[0], bot = sorted[sorted.length - 1];
        const active = [...stocks].sort((a, b) => (b.volume || 0) - (a.volume || 0))[0];
        const avg = stocks.reduce((s, x) => s + (x.change_percent || 0), 0) / stocks.length;
        
        document.getElementById('topGainer').textContent = top?.symbol || '-';
        document.getElementById('topGainerChange').textContent = `+${(top?.change_percent || 0).toFixed(2)}%`;
        document.getElementById('topLoser').textContent = bot?.symbol || '-';
        document.getElementById('topLoserChange').textContent = `${(bot?.change_percent || 0).toFixed(2)}%`;
        document.getElementById('mostActive').textContent = active?.symbol || '-';
        document.getElementById('mostActiveVol').textContent = `${((active?.volume || 0) / 1e6).toFixed(1)}M vol`;
        document.getElementById('marketMood').textContent = avg > 0.5 ? 'Bullish' : avg < -0.5 ? 'Bearish' : 'Neutral';
        document.getElementById('marketMoodDesc').textContent = avg > 0 ? 'Market Up' : 'Market Down';
    }
    
    document.getElementById('marketTable').innerHTML = stocks.length ? `
        <div class="table-scroll-wrapper">
        <table class="data-table">
            <thead><tr><th>Stock</th><th>Price</th><th>Change</th><th class="hide-mobile">Volume</th><th>Actions</th></tr></thead>
            <tbody>${stocks.map(s => `
                <tr onclick="openStockModal('${s.symbol}')">
                    <td><div style="display:flex;align-items:center;gap:0.5rem"><span style="font-size:1rem">${s.logo || '📈'}</span><div><div style="font-weight:600">${s.symbol}</div><div style="color:var(--text-muted);font-size:0.7rem">${s.name?.substring(0, 15) || s.symbol}</div></div></div></td>
                    <td style="font-family:var(--font-mono);font-weight:600;white-space:nowrap">${currencySymbol}${(s.current_price || 0).toLocaleString()}</td>
                    <td><span class="change ${(s.change_percent || 0) >= 0 ? 'positive' : 'negative'}">${(s.change_percent || 0) >= 0 ? '+' : ''}${(s.change_percent || 0).toFixed(2)}%</span></td>
                    <td class="hide-mobile" style="color:var(--text-muted)">${((s.volume || 0) / 1e6).toFixed(1)}M</td>
                    <td onclick="event.stopPropagation()">
                        <div style="display:flex;gap:0.2rem">
                            <button class="action-btn" onclick="openPortfolioModal('${s.symbol}',${s.current_price || 0})" title="Add to Portfolio">+P</button>
                            <button class="action-btn" onclick="addToWatchlist('${s.symbol}')" title="Add to Watchlist">+W</button>
                            <a class="action-btn tv-link" href="${s.tradingview_url || `https://www.tradingview.com/symbols/${s.symbol}/`}" target="_blank" title="TradingView">TV</a>
                        </div>
                    </td>
                </tr>
            `).join('')}</tbody>
        </table>
        </div>
    ` : '<div class="empty-state">No market data</div>';
}

// Render Portfolio
function renderPortfolio(data) {
    document.getElementById('quickPortfolioValue').textContent = `${currencySymbol}${(data.total_value || 0).toLocaleString()}`;
    document.getElementById('quickDayChange').textContent = `${(data.day_gain || 0) >= 0 ? '+' : ''}${currencySymbol}${(data.day_gain || 0).toLocaleString()}`;
    document.getElementById('quickDayChange').className = (data.day_gain || 0) >= 0 ? 'positive' : 'negative';
    document.getElementById('quickTotalGain').textContent = `${(data.total_gain || 0) >= 0 ? '+' : ''}${currencySymbol}${(data.total_gain || 0).toLocaleString()}`;
    document.getElementById('quickTotalGain').className = (data.total_gain || 0) >= 0 ? 'positive' : 'negative';
    
    document.getElementById('portfolioStats').innerHTML = `
        <div class="stat-card"><div class="stat-label">Total Value</div><div class="stat-value">${currencySymbol}${(data.total_value || 0).toLocaleString()}</div></div>
        <div class="stat-card"><div class="stat-label">Day Change</div><div class="stat-value ${(data.day_gain || 0) >= 0 ? 'positive' : 'negative'}">${(data.day_gain || 0) >= 0 ? '+' : ''}${currencySymbol}${(data.day_gain || 0).toLocaleString()}</div></div>
        <div class="stat-card"><div class="stat-label">Total Gain</div><div class="stat-value ${(data.total_gain || 0) >= 0 ? 'positive' : 'negative'}">${(data.total_gain || 0) >= 0 ? '+' : ''}${currencySymbol}${(data.total_gain || 0).toLocaleString()}</div></div>
        <div class="stat-card"><div class="stat-label">Holdings</div><div class="stat-value">${(data.holdings || []).length}</div></div>
    `;
    
    const h = data.holdings || [];
    document.getElementById('portfolioTable').innerHTML = h.length ? `
        <div class="table-scroll-wrapper">
        <table class="data-table">
            <thead><tr><th>Stock</th><th>Qty</th><th class="hide-mobile">Avg</th><th>Price</th><th class="hide-mobile">Value</th><th>Gain</th><th>Act</th></tr></thead>
            <tbody>${h.map(s => `
                <tr onclick="openStockModal('${s.symbol}')">
                    <td><div style="display:flex;align-items:center;gap:0.5rem"><span style="font-size:1rem">${s.logo || '📈'}</span><div><div style="font-weight:600">${s.symbol}</div></div></div></td>
                    <td style="font-family:var(--font-mono)">${s.quantity}</td>
                    <td class="hide-mobile" style="font-family:var(--font-mono)">${currencySymbol}${(s.average_cost || 0).toFixed(0)}</td>
                    <td style="font-family:var(--font-mono)">${currencySymbol}${(s.current_price || 0).toFixed(0)}</td>
                    <td class="hide-mobile" style="font-family:var(--font-mono);font-weight:600">${currencySymbol}${(s.total_value || 0).toLocaleString()}</td>
                    <td><span class="change ${(s.gain || 0) >= 0 ? 'positive' : 'negative'}">${(s.gain_percent || 0).toFixed(1)}%</span></td>
                    <td onclick="event.stopPropagation()">
                        <div style="display:flex;gap:0.2rem">
                            <button class="action-btn" onclick="openPortfolioModal('${s.symbol}',${s.current_price || 0},${s.quantity},${s.average_cost})" title="Edit">E</button>
                            <button class="action-btn remove" onclick="removeFromPortfolio('${s.symbol}')" title="Remove">X</button>
                            <a class="action-btn tv-link" href="${s.tradingview_url || `https://www.tradingview.com/symbols/${s.symbol}/`}" target="_blank" title="TV">TV</a>
                        </div>
                    </td>
                </tr>
            `).join('')}</tbody>
        </table>
        </div>
    ` : '<div class="empty-state">No holdings in this exchange. Add stocks to your portfolio!</div>';
}

// Render Watchlist
function renderWatchlist(data) {
    const stocks = data.stocks || [];
    
    document.getElementById('sidebarWatchlist').innerHTML = stocks.length ? stocks.map(s => `
        <div class="stock-item" onclick="openStockModal('${s.symbol}')">
            <div class="stock-info">
                <div class="stock-logo">${s.logo || '📈'}</div>
                <div class="stock-details"><div class="stock-symbol">${s.symbol}</div><div class="stock-name">${s.name?.substring(0, 15) || ''}</div></div>
            </div>
            <div class="stock-price">
                <div class="price">${currencySymbol}${(s.current_price || 0).toLocaleString()}</div>
                <div class="change ${(s.change_percent || 0) >= 0 ? 'positive' : 'negative'}">${(s.change_percent || 0) >= 0 ? '+' : ''}${(s.change_percent || 0).toFixed(2)}%</div>
            </div>
            <div class="stock-actions" onclick="event.stopPropagation()">
                <button class="action-btn remove" onclick="removeFromWatchlist('${s.symbol}')" title="Remove">X</button>
                <a class="action-btn tv-link" href="${s.tradingview_url || `https://www.tradingview.com/symbols/${s.symbol}/`}" target="_blank" title="TV">TV</a>
            </div>
        </div>
    `).join('') : '<div class="empty-state">No stocks in watchlist</div>';
    
    document.getElementById('watchlistTable').innerHTML = stocks.length ? `
        <div class="table-scroll-wrapper">
        <table class="data-table">
            <thead><tr><th>Stock</th><th>Price</th><th>Change</th><th class="hide-mobile">Range</th><th>Act</th></tr></thead>
            <tbody>${stocks.map(s => `
                <tr onclick="openStockModal('${s.symbol}')">
                    <td><div style="display:flex;align-items:center;gap:0.5rem"><span style="font-size:1rem">${s.logo || '📈'}</span><div><div style="font-weight:600">${s.symbol}</div></div></div></td>
                    <td style="font-family:var(--font-mono);font-weight:600;white-space:nowrap">${currencySymbol}${(s.current_price || 0).toLocaleString()}</td>
                    <td><span class="change ${(s.change_percent || 0) >= 0 ? 'positive' : 'negative'}">${(s.change_percent || 0) >= 0 ? '+' : ''}${(s.change_percent || 0).toFixed(2)}%</span></td>
                    <td class="hide-mobile" style="color:var(--text-muted);font-size:0.8rem;white-space:nowrap">${currencySymbol}${(s.day_low || 0).toFixed(0)}-${currencySymbol}${(s.day_high || 0).toFixed(0)}</td>
                    <td onclick="event.stopPropagation()">
                        <div style="display:flex;gap:0.2rem">
                            <button class="action-btn" onclick="openPortfolioModal('${s.symbol}',${s.current_price || 0})" title="Add to Portfolio">+P</button>
                            <button class="action-btn remove" onclick="removeFromWatchlist('${s.symbol}')" title="Remove">X</button>
                            <a class="action-btn tv-link" href="${s.tradingview_url || `https://www.tradingview.com/symbols/${s.symbol}/`}" target="_blank" title="TV">TV</a>
                        </div>
                    </td>
                </tr>
            `).join('')}</tbody>
        </table>
        </div>
    ` : '<div class="empty-state">No stocks in watchlist</div>';
}

// Render AI Picks
function renderAIPicks(data) {
    document.getElementById('aiPicksTable').innerHTML = data.length ? `
        <div class="table-scroll-wrapper">
        <table class="data-table">
            <thead><tr><th>Stock</th><th>Rating</th><th class="hide-mobile">Conf</th><th>Target</th><th>Gain</th><th>Act</th></tr></thead>
            <tbody>${data.map(s => `
                <tr onclick="openStockModal('${s.symbol}')">
                    <td><div style="display:flex;align-items:center;gap:0.5rem"><span style="font-size:1rem">📈</span><div><div style="font-weight:600">${s.symbol}</div></div></div></td>
                    <td><span class="sentiment-badge ${(s.recommendation_type || '').replace('_', '-')}" style="font-size:0.65rem;padding:0.2rem 0.4rem">${(s.recommendation_type || '').replace('_', ' ').substring(0, 6)}</span></td>
                    <td class="hide-mobile"><span style="font-size:0.75rem">${((s.confidence_score || 0) * 100).toFixed(0)}%</span></td>
                    <td style="font-family:var(--font-mono);white-space:nowrap">${currencySymbol}${(s.target_price || 0).toFixed(0)}</td>
                    <td><span class="change positive">+${(s.potential_return || 0).toFixed(1)}%</span></td>
                    <td onclick="event.stopPropagation()">
                        <div style="display:flex;gap:0.2rem">
                            <button class="action-btn" onclick="openPortfolioModal('${s.symbol}',${s.current_price || 0})" title="Add to Portfolio">+P</button>
                            <button class="action-btn" onclick="addToWatchlist('${s.symbol}')" title="Add to Watchlist">+W</button>
                            <a class="action-btn tv-link" href="${s.tradingview_url || `https://www.tradingview.com/symbols/${s.symbol}/`}" target="_blank" title="TV">TV</a>
                        </div>
                    </td>
                </tr>
            `).join('')}</tbody>
        </table>
        </div>
    ` : '<div class="empty-state">No recommendations at this time</div>';
}

// Render Search Results
function renderSearchResults(data) {
    const results = document.getElementById('searchResults');
    if (!data.results?.length) {
        results.innerHTML = '<div class="search-loading">No results found</div>';
        return;
    }
    results.innerHTML = data.results.map(s => `
        <div class="search-result" onclick="openStockModal('${s.symbol}')">
            <div><span class="symbol">${s.symbol}</span><div class="name">${s.name}</div></div>
            <span style="font-size:1.2rem">${s.logo || '📈'}</span>
        </div>
    `).join('');
}

// Render Feedback List
function renderFeedbackList(data) {
    const items = data.feedback || [];
    document.getElementById('feedbackList').innerHTML = items.length ? items.map(f => `
        <div style="padding:1rem;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:flex-start;gap:1rem">
            <div style="flex:1">
                <div style="display:flex;gap:0.5rem;align-items:center;margin-bottom:0.5rem">
                    <span class="feedback-status ${f.status}">${f.status.replace('_', ' ')}</span>
                    <span style="color:var(--text-muted);font-size:0.75rem">${f.type}</span>
                    <span style="color:var(--text-muted);font-size:0.75rem">by ${f.user_name || f.user_email}</span>
                </div>
                <p style="margin:0;color:var(--text-primary)">${f.message}</p>
                <div style="margin-top:0.5rem;font-size:0.75rem;color:var(--text-muted)">${new Date(f.created_at).toLocaleString()}</div>
            </div>
            <div style="display:flex;gap:0.25rem">
                ${f.status === 'new' ? `<button class="btn btn-small btn-secondary" onclick="updateFeedbackStatus('${f.id}','in_progress')">Start</button>` : ''}
                ${f.status === 'in_progress' ? `<button class="btn btn-small btn-primary" onclick="updateFeedbackStatus('${f.id}','resolved')">Resolve</button>` : ''}
                ${f.status === 'resolved' ? `<button class="btn btn-small btn-secondary" onclick="updateFeedbackStatus('${f.id}','closed')">Close</button>` : ''}
                <button class="btn btn-small btn-danger" onclick="deleteFeedback('${f.id}')">Delete</button>
            </div>
        </div>
    `).join('') : '<div class="empty-state">No feedback found</div>';
}

// Render Admin Stats
function renderAdminStats(data) {
    document.getElementById('adminStats').innerHTML = `
        <div class="stat-card"><div class="stat-label">Total Users</div><div class="stat-value">${data.total_users || 0}</div></div>
        <div class="stat-card"><div class="stat-label">Total Feedback</div><div class="stat-value">${data.total_feedback || 0}</div></div>
        <div class="stat-card"><div class="stat-label">New</div><div class="stat-value" style="color:var(--accent-primary)">${data.feedback_stats?.new || 0}</div></div>
        <div class="stat-card"><div class="stat-label">Guest Sessions</div><div class="stat-value" style="color:var(--warning)">${data.guest_sessions || 0}</div></div>
    `;
}

// Render Guest Sessions (Admin only)
function renderGuestSessions(data) {
    const sessions = data.sessions || [];
    const container = document.getElementById('guestSessionsList');
    if (!container) return;
    
    container.innerHTML = sessions.length ? `
        <table class="data-table">
            <thead><tr><th>Guest ID</th><th>Created</th><th>Device</th><th>Location</th><th>Screen</th></tr></thead>
            <tbody>${sessions.map(s => {
                const device = s.device_info || {};
                const loc = s.location_info || {};
                const platform = device.platform || 'Unknown';
                const browser = (device.user_agent || '').includes('Chrome') ? 'Chrome' : 
                               (device.user_agent || '').includes('Firefox') ? 'Firefox' : 
                               (device.user_agent || '').includes('Safari') ? 'Safari' : 'Other';
                const location = loc.city && loc.country ? `${loc.city}, ${loc.country}` : (loc.country || loc.ip_address || 'Unknown');
                const screen = device.screen_width && device.screen_height ? `${device.screen_width}x${device.screen_height}` : '-';
                
                return `<tr>
                    <td style="font-family:var(--font-mono);font-size:0.85rem">${s.guest_id}</td>
                    <td style="color:var(--text-muted);font-size:0.85rem">${new Date(s.created_at).toLocaleString()}</td>
                    <td><span style="color:var(--accent-primary)">${browser}</span> / ${platform}</td>
                    <td>${location}</td>
                    <td style="font-family:var(--font-mono);font-size:0.85rem">${screen}</td>
                </tr>`;
            }).join('')}</tbody>
        </table>
    ` : '<div class="empty-state">No guest sessions yet</div>';
}

// Render Stock Alerts
function renderAlerts(data) {
    const alerts = data.alerts || [];
    const container = document.getElementById('alertsList');
    if (!container) return;
    
    if (!alerts.length) {
        container.innerHTML = '<div class="empty-state">No stock alerts yet. Create your first alert to track entry, stop loss, and target prices!</div>';
        return;
    }
    
    container.innerHTML = `<div class="alert-cards">${alerts.map(a => {
        const entryPrice = a.entry_price || 0;
        const stopLoss = a.stop_loss || 0;
        const targetPrice = a.target_price || 0;
        const currentPrice = a.current_price || entryPrice;
        const potentialReturn = a.potential_return || 0;
        const changePercent = a.change_percent || 0;
        
        // Calculate marker position (0-100%)
        const priceRange = targetPrice - stopLoss;
        const markerPosition = priceRange > 0 ? Math.max(0, Math.min(100, ((currentPrice - stopLoss) / priceRange) * 100)) : 50;
        
        const changeClass = changePercent >= 0 ? 'positive' : 'negative';
        const changeSign = changePercent >= 0 ? '+' : '';
        
        return `
            <div class="alert-card">
                <div class="alert-card-header">
                    <div>
                        <span class="powered-by">Powered by Trader Smith</span>
                        <div class="alert-card-symbol">${a.symbol}</div>
                        <div class="alert-card-name">${a.name || a.symbol}</div>
                    </div>
                    <div class="alert-card-ltp">
                        <div style="font-size:0.75rem;color:var(--text-muted)">${new Date(a.created_at).toLocaleDateString()} ${new Date(a.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                        <div class="alert-card-price">LTP: ${currencySymbol}${currentPrice.toLocaleString()}</div>
                        <div class="alert-card-change ${changeClass}">(${changeSign}${changePercent.toFixed(2)}%)</div>
                    </div>
                </div>
                
                <div class="alert-price-bar">
                    <div class="alert-price-marker" style="left:${markerPosition}%"></div>
                </div>
                
                <div class="alert-price-labels">
                    <div class="alert-price-label" style="text-align:left">
                        <span>Stop Loss</span>
                        <strong style="color:#ef5350">${currencySymbol}${stopLoss.toLocaleString()}</strong>
                    </div>
                    <div class="alert-price-label">
                        <span>Entry Price</span>
                        <strong>${currencySymbol}${entryPrice.toLocaleString()}</strong>
                    </div>
                    <div class="alert-price-label" style="text-align:right">
                        <span>Target Price</span>
                        <strong style="color:#4caf50">${currencySymbol}${targetPrice.toLocaleString()}</strong>
                    </div>
                </div>
                
                ${a.rationale ? `
                <div class="alert-rationale" onclick="alert('${a.rationale.replace(/'/g, "\\'")}')">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                    Click here to view rationale
                </div>
                ` : ''}
                
                <div class="alert-footer">
                    <div class="alert-potential">
                        <div class="alert-potential-icon">${currencySymbol.charAt(0)}</div>
                        <div class="alert-potential-text">
                            Potential from CMP: <span class="alert-potential-value">${potentialReturn >= 0 ? '+' : ''}${potentialReturn.toFixed(2)}%</span>
                        </div>
                    </div>
                    <div class="alert-actions">
                        <button class="alert-delete-btn" onclick="deleteAlert('${a.id}')">Delete</button>
                        <button class="alert-buy-btn" onclick="openPortfolioModal('${a.symbol}', ${currentPrice})">BUY</button>
                    </div>
                </div>
            </div>
        `;
    }).join('')}</div>`;
}

// Render Users List
function renderUsersList(data) {
    const users = data.users || [];
    document.getElementById('usersList').innerHTML = users.length ? `
        <table class="data-table">
            <thead><tr><th>User</th><th>Email</th><th>Provider</th><th>Status</th><th>Login Issues</th><th>Actions</th></tr></thead>
            <tbody>${users.map(u => `
                <tr>
                    <td style="font-weight:600">${u.first_name} ${u.last_name}${u.is_admin ? ' <span class="ai-badge">ADMIN</span>' : ''}</td>
                    <td>${u.email}</td>
                    <td>${u.sso_provider ? `<span style="color:var(--accent-primary)">${u.sso_provider}</span>` : 'Email'}</td>
                    <td><span class="feedback-status ${u.is_active ? 'new' : 'closed'}">${u.is_active ? 'Active' : 'Disabled'}</span></td>
                    <td>${u.login_issues ? '<span style="color:var(--negative)">Yes</span>' : '-'}</td>
                    <td style="white-space:nowrap">
                        <button class="btn btn-small btn-secondary" onclick="resetUserPassword('${u.email}')" title="Reset Password">Reset PW</button>
                        <button class="btn btn-small ${u.is_active ? 'btn-danger' : 'btn-primary'}" onclick="toggleUserStatus('${u.email}',${!u.is_active})">${u.is_active ? 'Disable' : 'Enable'}</button>
                    </td>
                </tr>
            `).join('')}</tbody>
        </table>
    ` : '<div class="empty-state">No users</div>';
}

// Display Sanity Results
function displaySanityResults(data) {
    const summary = data.summary || {};
    document.getElementById('sanityTotal').textContent = summary.total || 0;
    document.getElementById('sanityPassed').textContent = summary.passed || 0;
    document.getElementById('sanityFailed').textContent = summary.failed || 0;
    document.getElementById('sanityErrors').textContent = summary.errors || 0;
    
    const results = data.results || [];
    const passRate = summary.total > 0 ? ((summary.passed / summary.total) * 100).toFixed(1) : 0;
    
    document.getElementById('sanityResults').innerHTML = results.length ? `
        <div style="padding:1rem;background:var(--bg-primary);border-radius:8px;margin-bottom:1rem;display:flex;justify-content:space-between;align-items:center">
            <div>
                <span style="font-size:1.25rem;font-weight:700">${passRate}%</span>
                <span style="color:var(--text-muted);margin-left:0.5rem">Pass Rate</span>
            </div>
            <div style="display:flex;gap:1rem;align-items:center">
                <span style="color:var(--positive)">✓ ${summary.passed} Passed</span>
                <span style="color:var(--negative)">✗ ${summary.failed} Failed</span>
                <span style="color:var(--warning)">⚠ ${summary.errors} Errors</span>
            </div>
        </div>
        <table class="data-table">
            <thead><tr><th>#</th><th>Test Name</th><th>Status</th><th>Duration</th><th>Message</th></tr></thead>
            <tbody>${results.map((r, i) => `
                <tr>
                    <td style="color:var(--text-muted)">${i + 1}</td>
                    <td style="font-weight:500">${r.test_name}</td>
                    <td>
                        <span class="feedback-status ${r.status === 'PASS' ? 'new' : r.status === 'FAIL' ? 'closed' : 'in_progress'}" style="display:inline-flex;align-items:center;gap:0.25rem">
                            ${r.status === 'PASS' ? '✓' : r.status === 'FAIL' ? '✗' : '⚠'} ${r.status}
                        </span>
                    </td>
                    <td style="font-family:var(--font-mono);color:var(--text-muted)">${r.duration_ms}ms</td>
                    <td style="color:var(--text-muted);font-size:0.85rem;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${r.message}">${r.message}</td>
                </tr>
            `).join('')}</tbody>
        </table>
    ` : '<div class="empty-state">No test results available</div>';
}

