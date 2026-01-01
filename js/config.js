/**
 * StockAdvisor - Configuration
 * Developed by Atul Shivade @2026
 */

// API Configuration - Auto-detect environment
// For production: Set BACKEND_URL to your deployed backend URL (NO trailing slash!)
const BACKEND_URL = 'https://stockadvisor-api.onrender.com'; // NO trailing slash!

// Check if we're running locally or deployed
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const isDeployed = window.location.hostname.includes('netlify.app') || window.location.hostname.includes('vercel.app');

// Normalize BACKEND_URL (remove trailing slash if present)
const normalizedBackendUrl = BACKEND_URL.replace(/\/+$/, '');

// Use appropriate API URL
const API = isDeployed && normalizedBackendUrl.includes('localhost') 
    ? null  // Backend not deployed yet
    : `${normalizedBackendUrl}/api/v1`;

// Flag to check if backend is available
const BACKEND_AVAILABLE = !isDeployed || !normalizedBackendUrl.includes('localhost');

// Admin Configuration - HARDCODED
const ADMIN_EMAIL = 'atul.shivade@gmail.com';

// Currency Configuration
const CURRENCIES = {
    US: { s: '$', c: 'USD' },
    NSE: { s: '₹', c: 'INR' },
    LSE: { s: '£', c: 'GBP' },
    TSE: { s: '¥', c: 'JPY' },
    HKEX: { s: 'HK$', c: 'HKD' }
};

// Application State
let token = localStorage.getItem('token');
let currentUser = null;
let selectedExchange = localStorage.getItem('exchange') || 'US';
let currencySymbol = '$';
let feedbackFilter = null;
let pendingPortfolioSymbol = null;
let searchTimeout = null;

