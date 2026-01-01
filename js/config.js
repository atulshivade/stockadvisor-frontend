/**
 * StockAdvisor - Configuration
 * Developed by Atul Shivade @2026
 */

// API Configuration
const API = 'http://localhost:8000/api/v1';

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

