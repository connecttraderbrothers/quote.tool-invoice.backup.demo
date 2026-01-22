// OMEGA Authentication System
// Passwordless login with Make.com webhook integration

// ============================================
// WEBHOOK CONFIGURATION - UPDATE THESE URLs
// ============================================
const WEBHOOK_CONFIG = {
    // Webhook #1: Stores passcode and sends email to user
    STORE_AND_EMAIL: 'YOUR_MAKE_COM_WEBHOOK_1_URL',
    
    // Webhook #2: Verifies passcode entered by user
    VERIFY_PASSCODE: 'YOUR_MAKE_COM_WEBHOOK_2_URL',
    
    // Webhook #3: Stores new user registration data
    REGISTER_USER: 'YOUR_MAKE_COM_WEBHOOK_3_URL',
    
    // Webhook #4: Retrieves user data on login
    GET_USER_DATA: 'YOUR_MAKE_COM_WEBHOOK_4_URL'
};

// ============================================
// AUTH STATE MANAGEMENT
// ============================================
let authState = {
    isAuthenticated: false,
    currentView: 'initial', // initial, login, signup-step1, signup-step2, signup-step3, verify
    signupStep: 1,
    email: '',
    passcode: '',
    userId: '',
    pendingUserId: '', // Generated in Webhook #1, used throughout auth flow
    userData: null,
    isLoading: false,
    errors: {},
    rememberMe: false
};

// Signup form data
let signupData = {
    // Step 1: Personal Info
    name: '',
    personalEmail: '',
    personalMobile: '',
    address: '',
    
    // Step 2: Business Info
    companyName: '',
    businessEmail: '',
    businessMobile: '',
    niche: '',
    companyLogo: null,
    
    // Step 3: Bank Details (for invoices)
    bankName: '',
    accountName: '',
    sortCode: '',
    accountNumber: ''
};

// Tradesman niches
const TRADE_NICHES = [
    'Plumber',
    'Electrician',
    'Carpenter',
    'General Builder',
    'Roofer',
    'Painter & Decorator',
    'Plasterer',
    'Tiler',
    'Landscaper',
    'Bricklayer',
    'Heating Engineer',
    'Gas Engineer',
    'Glazier',
    'Joiner',
    'Locksmith',
    'Bathroom Fitter',
    'Kitchen Fitter',
    'Flooring Specialist',
    'Driveways & Paving',
    'Fencing Contractor',
    'Groundworker',
    'Scaffolder',
    'HVAC Technician',
    'Solar Panel Installer',
    'Handyman',
    'Other'
];

// ============================================
// BEHAVIORAL ANALYSIS (Bot Detection)
// ============================================
let behaviorData = {
    keyPressIntervals: [],
    mouseMovements: [],
    lastKeyPress: Date.now(),
    lastActivity: Date.now()
};

function trackKeyPress(e) {
    const now = Date.now();
    const interval = now - behaviorData.lastKeyPress;
    behaviorData.keyPressIntervals.push(interval);
    if (behaviorData.keyPressIntervals.length > 30) {
        behaviorData.keyPressIntervals.shift();
    }
    behaviorData.lastKeyPress = now;
    behaviorData.lastActivity = now;
}

function trackMouseMove(e) {
    behaviorData.mouseMovements.push({
        x: e.clientX,
        y: e.clientY,
        time: Date.now()
    });
    if (behaviorData.mouseMovements.length > 50) {
        behaviorData.mouseMovements.shift();
    }
    behaviorData.lastActivity = Date.now();
}

function detectBot() {
    const { keyPressIntervals, mouseMovements } = behaviorData;
    
    // Check for suspiciously consistent typing
    if (keyPressIntervals.length > 10) {
        const avg = keyPressIntervals.reduce((a, b) => a + b, 0) / keyPressIntervals.length;
        const variance = keyPressIntervals.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / keyPressIntervals.length;
        
        if (variance < 100 && avg < 50) {
            return true;
        }
    }
    
    // Check for lack of mouse movement
    if (mouseMovements.length < 3 && keyPressIntervals.length > 20) {
        return true;
    }
    
    return false;
}

// ============================================
// VALIDATION FUNCTIONS
// ============================================
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return 'Email is required';
    if (!emailRegex.test(email)) return 'Please enter a valid email address';
    return '';
}

function validatePhone(phone) {
    const phoneRegex = /^[\d\s+()-]{10,}$/;
    if (!phone) return 'Phone number is required';
    if (!phoneRegex.test(phone.replace(/\s/g, ''))) return 'Please enter a valid phone number';
    return '';
}

function validateRequired(value, fieldName) {
    if (!value || !value.trim()) return `${fieldName} is required`;
    return '';
}

function validateSortCode(sortCode) {
    const cleaned = sortCode.replace(/[-\s]/g, '');
    if (!cleaned) return 'Sort code is required';
    if (!/^\d{6}$/.test(cleaned)) return 'Sort code must be 6 digits';
    return '';
}

function validateAccountNumber(accNum) {
    const cleaned = accNum.replace(/\s/g, '');
    if (!cleaned) return 'Account number is required';
    if (!/^\d{8}$/.test(cleaned)) return 'Account number must be 8 digits';
    return '';
}

function validateStep1() {
    const errors = {};
    
    const nameError = validateRequired(signupData.name, 'Full name');
    if (nameError) errors.name = nameError;
    
    const personalEmailError = validateEmail(signupData.personalEmail);
    if (personalEmailError) errors.personalEmail = personalEmailError;
    
    const personalMobileError = validatePhone(signupData.personalMobile);
    if (personalMobileError) errors.personalMobile = personalMobileError;
    
    const addressError = validateRequired(signupData.address, 'Address');
    if (addressError) errors.address = addressError;
    
    authState.errors = errors;
    renderErrors();
    return Object.keys(errors).length === 0;
}

function validateStep2() {
    const errors = {};
    
    const companyNameError = validateRequired(signupData.companyName, 'Company name');
    if (companyNameError) errors.companyName = companyNameError;
    
    const businessEmailError = validateEmail(signupData.businessEmail);
    if (businessEmailError) errors.businessEmail = businessEmailError;
    
    const businessMobileError = validatePhone(signupData.businessMobile);
    if (businessMobileError) errors.businessMobile = businessMobileError;
    
    if (!signupData.niche) errors.niche = 'Please select your trade';
    
    authState.errors = errors;
    renderErrors();
    return Object.keys(errors).length === 0;
}

function validateStep3() {
    const errors = {};
    
    const bankNameError = validateRequired(signupData.bankName, 'Bank name');
    if (bankNameError) errors.bankName = bankNameError;
    
    const accountNameError = validateRequired(signupData.accountName, 'Account name');
    if (accountNameError) errors.accountName = accountNameError;
    
    const sortCodeError = validateSortCode(signupData.sortCode);
    if (sortCodeError) errors.sortCode = sortCodeError;
    
    const accountNumberError = validateAccountNumber(signupData.accountNumber);
    if (accountNumberError) errors.accountNumber = accountNumberError;
    
    authState.errors = errors;
    renderErrors();
    return Object.keys(errors).length === 0;
}

// ============================================
// WEBHOOK FUNCTIONS
// ============================================

// Generate 6-digit passcode
function generatePasscode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Generate unique user ID
function generateUserId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let id = '';
    for (let i = 0; i < 12; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
        if ((i + 1) % 4 === 0 && i !== 11) id += '-';
    }
    return id;
}

// Webhook #1: Send passcode for storage and email
async function sendPasscodeToWebhook(email, passcode, userId) {
    try {
        // For demo/testing - remove in production
        console.log('📧 Passcode for', email, ':', passcode, 'userId:', userId);
        
        const response = await fetch(WEBHOOK_CONFIG.STORE_AND_EMAIL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: email,
                passcode: passcode,
                userId: userId,
                timestamp: new Date().toISOString(),
                expiresIn: 300 // 5 minutes
            })
        });
        
        return response.ok;
    } catch (error) {
        console.error('Webhook #1 error:', error);
        // For demo - return true to allow testing without webhook
        return true;
    }
}

// Webhook #2: Verify passcode
async function verifyPasscodeWithWebhook(email, passcode) {
    try {
        const response = await fetch(WEBHOOK_CONFIG.VERIFY_PASSCODE, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: email,
                passcode: passcode
            })
        });
        
        if (!response.ok) {
            return { valid: false, error: 'Network error' };
        }
        
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Webhook #2 error:', error);
        // For demo - simulate successful verification
        return { valid: true, userId: generateUserId() };
    }
}

// Webhook #3: Register new user
async function registerUserWithWebhook(userData) {
    try {
        const response = await fetch(WEBHOOK_CONFIG.REGISTER_USER, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        
        if (!response.ok) {
            return { success: false, error: 'Registration failed' };
        }
        
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Webhook #3 error:', error);
        // For demo - return success
        return { success: true, userId: generateUserId() };
    }
}

// Webhook #4: Get user data on login
async function getUserDataFromWebhook(email, userId) {
    try {
        const response = await fetch(WEBHOOK_CONFIG.GET_USER_DATA, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: email,
                userId: userId
            })
        });
        
        if (!response.ok) {
            return null;
        }
        
        const userData = await response.json();
        return userData;
    } catch (error) {
        console.error('Webhook #4 error:', error);
        return null;
    }
}

// ============================================
// AUTH FLOW HANDLERS
// ============================================

async function handleSendPasscode(email) {
    if (detectBot()) {
        authState.errors = { general: 'Suspicious activity detected. Please try again.' };
        renderAuthScreen();
        return false;
    }
    
    authState.isLoading = true;
    renderAuthScreen();
    
    const passcode = generatePasscode();
    const userId = generateUserId();
    
    authState.passcode = passcode; // Store for demo verification
    authState.pendingUserId = userId; // Store userId for use in signup/login
    
    const success = await sendPasscodeToWebhook(email, passcode, userId);
    
    authState.isLoading = false;
    
    if (success) {
        authState.email = email;
        authState.currentView = 'verify';
        renderAuthScreen();
        
        setTimeout(() => {
            const passcodeInput = document.getElementById('passcodeInput');
            if (passcodeInput) passcodeInput.focus();
        }, 100);
        
        return true;
    } else {
        authState.errors = { general: 'Failed to send passcode. Please try again.' };
        renderAuthScreen();
        return false;
    }
}

async function handleVerifyPasscode() {
    const enteredPasscode = document.getElementById('passcodeInput').value;
    
    if (enteredPasscode.length !== 6) {
        authState.errors = { passcode: 'Please enter the 6-digit code' };
        renderErrors();
        return;
    }
    
    authState.isLoading = true;
    renderAuthScreen();
    
    const result = await verifyPasscodeWithWebhook(authState.email, enteredPasscode);
    
    authState.isLoading = false;
    
    if (result.valid) {
        // Check if this is the final step of signup (after Step 3)
        if (authState.signupStep === 3) {
            // User just completed Step 3 and verified - complete signup
            await completeSignup();
        } else if (result.isNewUser) {
            // New user from login - start signup flow
            authState.signupStep = 1;
            authState.currentView = 'signup-step1';
            renderAuthScreen();
        } else {
            // Returning user - complete login using pendingUserId from Webhook #1
            await completeLogin(authState.pendingUserId);
        }
    } else {
        let errorMessage = 'Invalid passcode. Please try again.';
        if (result.reason === 'expired') {
            errorMessage = 'Passcode expired. Please request a new one.';
        }
        authState.errors = { passcode: errorMessage };
        renderAuthScreen();
        
        // Shake animation
        const input = document.getElementById('passcodeInput');
        if (input) {
            input.classList.add('error');
            setTimeout(() => input.classList.remove('error'), 500);
        }
    }
}

async function completeSignup() {
    // Use the userId generated in Webhook #1
    const userId = authState.pendingUserId;
    
    const fullUserData = {
        userId: userId,
        ...signupData,
        createdAt: new Date().toISOString()
    };
    
    // Register with webhook (saves to database)
    const result = await registerUserWithWebhook(fullUserData);
    
    if (result.success) {
        // Store only session info locally (not full user data)
        localStorage.setItem('omegaUserId', userId);
        localStorage.setItem('omegaUserEmail', signupData.businessEmail);
        localStorage.setItem('omegaAuthenticated', 'true');
        
        if (authState.rememberMe) {
            localStorage.setItem('omegaRememberedEmail', signupData.businessEmail);
        }
        
        authState.isAuthenticated = true;
        authState.userId = userId;
        authState.userData = fullUserData;
        
        // Update global user data for quotes/invoices
        updateGlobalUserData(fullUserData);
        
        // Show success and redirect
        showAuthSuccess('Account created successfully!', () => {
            hideAuthScreen();
            showDashboard();
        });
    } else {
        authState.errors = { general: 'Registration failed. Please try again.' };
        renderAuthScreen();
    }
}

async function completeLogin(userIdFromWebhook) {
    authState.isLoading = true;
    renderAuthScreen();
    
    // Always fetch user data from webhook (database) - never use localStorage as source
    let userData = await getUserDataFromWebhook(authState.email, userIdFromWebhook);
    
    if (userData && userData.success !== false) {
        // Store session info in localStorage (just for knowing they're logged in)
        localStorage.setItem('omegaUserId', userData.userId || userIdFromWebhook);
        localStorage.setItem('omegaUserEmail', authState.email);
        localStorage.setItem('omegaAuthenticated', 'true');
        
        if (authState.rememberMe) {
            localStorage.setItem('omegaRememberedEmail', authState.email);
        }
        
        authState.isAuthenticated = true;
        authState.userId = userData.userId || userIdFromWebhook;
        authState.userData = userData;
        
        // Update global user data for quotes/invoices
        updateGlobalUserData(userData);
        
        authState.isLoading = false;
        
        showAuthSuccess('Welcome back!', () => {
            hideAuthScreen();
            showDashboard();
        });
    } else {
        authState.isLoading = false;
        authState.errors = { general: 'Could not retrieve account data. Please contact support or register a new account.' };
        renderAuthScreen();
    }
}

// ============================================
// UPDATE GLOBAL USER DATA FOR QUOTES/INVOICES
// ============================================
function updateGlobalUserData(userData) {
    // Store in window for access by quote/invoice generators
    window.omegaUserData = {
        companyName: userData.companyName || 'Your Company',
        address: userData.address || '',
        phone: userData.businessMobile || userData.personalMobile || '',
        email: userData.businessEmail || userData.personalEmail || '',
        logo: userData.companyLogo || null,
        bankDetails: {
            bankName: userData.bankName || '',
            accountName: userData.accountName || '',
            sortCode: userData.sortCode || '',
            accountNumber: userData.accountNumber || ''
        }
    };
    
    console.log('User data updated for quotes/invoices:', window.omegaUserData);
}

// ============================================
// UI RENDERING FUNCTIONS
// ============================================

function renderAuthScreen() {
    const authContainer = document.getElementById('authScreen');
    if (!authContainer) return;
    
    let content = '';
    
    switch (authState.currentView) {
        case 'initial':
            content = renderInitialView();
            break;
        case 'login':
            content = renderLoginView();
            break;
        case 'signup-step1':
            content = renderSignupStep1();
            break;
        case 'signup-step2':
            content = renderSignupStep2();
            break;
        case 'signup-step3':
            content = renderSignupStep3();
            break;
        case 'verify':
            content = renderVerifyView();
            break;
    }
    
    authContainer.innerHTML = `
        <div class="auth-container" onmousemove="trackMouseMove(event)">
            <div class="auth-card">
                <div class="security-badge">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    </svg>
                    Secure Connection
                </div>
                ${content}
                <div class="auth-footer">
                    <p>OMEGA Professional Tools</p>
                </div>
            </div>
        </div>
    `;
    
    // Add event listeners
    attachAuthEventListeners();
}

function renderInitialView() {
    const rememberedEmail = localStorage.getItem('omegaRememberedEmail');
    const hasExistingAccount = localStorage.getItem('omegaAuthenticated') === 'true';
    
    return `
        <div class="auth-header">
            <img src="https://github.com/connecttraderbrothers/omega.app.icon/blob/main/icon-512x512.png?raw=true" 
                 alt="OMEGA Logo" class="auth-logo">
            <h1 class="auth-title">
                <span class="highlight">OMEGA</span>
            </h1>
            <p class="auth-subtitle">Professional Business Tools</p>
        </div>
        
        <div class="initial-buttons">
            <button class="auth-btn primary" onclick="showLoginView()">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                Login
            </button>
            
            ${!hasExistingAccount ? `
            <button class="auth-btn success" onclick="showSignupStep1()">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="8.5" cy="7" r="4"/>
                    <line x1="20" y1="8" x2="20" y2="14"/>
                    <line x1="23" y1="11" x2="17" y2="11"/>
                </svg>
                Create Account
            </button>
            ` : ''}
        </div>
        
        ${hasExistingAccount ? `
        <div class="user-id-display">
            <p>Logged in previously as:</p>
            <p class="user-id">${localStorage.getItem('omegaUserId') || 'Unknown'}</p>
        </div>
        ` : ''}
    `;
}

function renderLoginView() {
    const rememberedEmail = localStorage.getItem('omegaRememberedEmail') || '';
    
    return `
        <div class="auth-header">
            <h1 class="auth-title">Welcome Back</h1>
            <p class="auth-subtitle">Enter your email to receive a login code</p>
        </div>
        
        <div class="auth-form">
            <div class="form-group">
                <label class="form-label">Business Email</label>
                <div class="input-wrapper">
                    <input type="email" 
                           id="loginEmail" 
                           class="form-input ${authState.errors.email ? 'error' : ''}"
                           placeholder="you@company.com"
                           value="${rememberedEmail}"
                           onkeypress="trackKeyPress(event)"
                           onkeyup="if(event.key === 'Enter') handleLoginSubmit()">
                    <span class="input-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                            <polyline points="22,6 12,13 2,6"/>
                        </svg>
                    </span>
                </div>
                ${authState.errors.email ? `<div class="error-message"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>${authState.errors.email}</div>` : ''}
            </div>
            
            <div class="checkbox-wrapper">
                <input type="checkbox" id="rememberMe" class="checkbox-input" ${authState.rememberMe ? 'checked' : ''} onchange="authState.rememberMe = this.checked">
                <label for="rememberMe" class="checkbox-label">Remember me</label>
            </div>
            
            ${authState.errors.general ? `<div class="alert error"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>${authState.errors.general}</div>` : ''}
            
            <div class="btn-group">
                <button class="auth-btn primary" onclick="handleLoginSubmit()" ${authState.isLoading ? 'disabled' : ''}>
                    ${authState.isLoading ? '<span class="spinner"></span> Sending...' : 'Send Login Code'}
                </button>
                <button class="auth-btn secondary" onclick="showInitialView()">
                    Back
                </button>
            </div>
        </div>
    `;
}

function renderProgressSteps(currentStep) {
    const steps = ['Personal', 'Business', 'Banking'];
    
    return `
        <div class="progress-steps">
            ${steps.map((step, index) => `
                <div class="progress-step">
                    <div class="step-circle ${index + 1 < currentStep ? 'completed' : index + 1 === currentStep ? 'active' : 'inactive'}">
                        ${index + 1 < currentStep ? '✓' : index + 1}
                    </div>
                    <span class="step-label">${step}</span>
                </div>
                ${index < steps.length - 1 ? `<div class="step-connector ${index + 1 < currentStep ? 'active' : ''}"></div>` : ''}
            `).join('')}
        </div>
    `;
}

function renderSignupStep1() {
    return `
        <div class="auth-header">
            <h1 class="auth-title">Create Account</h1>
            <p class="auth-subtitle">Step 1: Personal Information</p>
        </div>
        
        ${renderProgressSteps(1)}
        
        <div class="auth-form form-section">
            <div class="form-group">
                <label class="form-label">Full Name <span class="required">*</span></label>
                <div class="input-wrapper">
                    <input type="text" 
                           id="signupName" 
                           class="form-input ${authState.errors.name ? 'error' : ''}"
                           placeholder="John Smith"
                           value="${signupData.name}"
                           onkeypress="trackKeyPress(event)"
                           oninput="signupData.name = this.value">
                    <span class="input-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                            <circle cx="12" cy="7" r="4"/>
                        </svg>
                    </span>
                </div>
                ${authState.errors.name ? `<div class="error-message"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>${authState.errors.name}</div>` : ''}
            </div>
            
            <div class="form-group">
                <label class="form-label">Personal Email <span class="required">*</span></label>
                <div class="input-wrapper">
                    <input type="email" 
                           id="signupPersonalEmail" 
                           class="form-input ${authState.errors.personalEmail ? 'error' : ''}"
                           placeholder="john@email.com"
                           value="${signupData.personalEmail}"
                           onkeypress="trackKeyPress(event)"
                           oninput="signupData.personalEmail = this.value">
                    <span class="input-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                            <polyline points="22,6 12,13 2,6"/>
                        </svg>
                    </span>
                </div>
                ${authState.errors.personalEmail ? `<div class="error-message"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>${authState.errors.personalEmail}</div>` : ''}
            </div>
            
            <div class="form-group">
                <label class="form-label">Personal Mobile <span class="required">*</span></label>
                <div class="input-wrapper">
                    <input type="tel" 
                           id="signupPersonalMobile" 
                           class="form-input ${authState.errors.personalMobile ? 'error' : ''}"
                           placeholder="07123 456789"
                           value="${signupData.personalMobile}"
                           onkeypress="trackKeyPress(event)"
                           oninput="signupData.personalMobile = this.value">
                    <span class="input-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                        </svg>
                    </span>
                </div>
                ${authState.errors.personalMobile ? `<div class="error-message"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>${authState.errors.personalMobile}</div>` : ''}
            </div>
            
            <div class="form-group">
                <label class="form-label">Address <span class="required">*</span></label>
                <textarea id="signupAddress" 
                          class="form-textarea ${authState.errors.address ? 'error' : ''}"
                          placeholder="123 Main Street, City, Postcode"
                          onkeypress="trackKeyPress(event)"
                          oninput="signupData.address = this.value">${signupData.address}</textarea>
                ${authState.errors.address ? `<div class="error-message"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>${authState.errors.address}</div>` : ''}
            </div>
            
            ${authState.errors.general ? `<div class="alert error"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>${authState.errors.general}</div>` : ''}
            
            <div class="btn-group">
                <button class="auth-btn primary" onclick="handleSignupStep1Next()">
                    Continue
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="5" y1="12" x2="19" y2="12"/>
                        <polyline points="12 5 19 12 12 19"/>
                    </svg>
                </button>
                <button class="auth-btn secondary" onclick="showInitialView()">
                    Back
                </button>
            </div>
        </div>
    `;
}

function renderSignupStep2() {
    const nicheOptions = TRADE_NICHES.map(niche => 
        `<option value="${niche}" ${signupData.niche === niche ? 'selected' : ''}>${niche}</option>`
    ).join('');
    
    return `
        <div class="auth-header">
            <h1 class="auth-title">Create Account</h1>
            <p class="auth-subtitle">Step 2: Business Information</p>
        </div>
        
        ${renderProgressSteps(2)}
        
        <div class="auth-form form-section">
            <div class="form-group">
                <label class="form-label">Company Name <span class="required">*</span></label>
                <div class="input-wrapper">
                    <input type="text" 
                           id="signupCompanyName" 
                           class="form-input ${authState.errors.companyName ? 'error' : ''}"
                           placeholder="Smith Plumbing Ltd"
                           value="${signupData.companyName}"
                           onkeypress="trackKeyPress(event)"
                           oninput="signupData.companyName = this.value">
                    <span class="input-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                            <polyline points="9 22 9 12 15 12 15 22"/>
                        </svg>
                    </span>
                </div>
                ${authState.errors.companyName ? `<div class="error-message"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>${authState.errors.companyName}</div>` : ''}
            </div>
            
            <div class="form-group">
                <label class="form-label">Business Email <span class="required">*</span></label>
                <div class="input-wrapper">
                    <input type="email" 
                           id="signupBusinessEmail" 
                           class="form-input ${authState.errors.businessEmail ? 'error' : ''}"
                           placeholder="info@smithplumbing.com"
                           value="${signupData.businessEmail}"
                           onkeypress="trackKeyPress(event)"
                           oninput="signupData.businessEmail = this.value">
                    <span class="input-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                            <polyline points="22,6 12,13 2,6"/>
                        </svg>
                    </span>
                </div>
                <small style="color: #666; font-size: 11px;">This will be used for login</small>
                ${authState.errors.businessEmail ? `<div class="error-message"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>${authState.errors.businessEmail}</div>` : ''}
            </div>
            
            <div class="form-group">
                <label class="form-label">Business Mobile <span class="required">*</span></label>
                <div class="input-wrapper">
                    <input type="tel" 
                           id="signupBusinessMobile" 
                           class="form-input ${authState.errors.businessMobile ? 'error' : ''}"
                           placeholder="07987 654321"
                           value="${signupData.businessMobile}"
                           onkeypress="trackKeyPress(event)"
                           oninput="signupData.businessMobile = this.value">
                    <span class="input-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                        </svg>
                    </span>
                </div>
                ${authState.errors.businessMobile ? `<div class="error-message"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>${authState.errors.businessMobile}</div>` : ''}
            </div>
            
            <div class="form-group">
                <label class="form-label">Trade/Niche <span class="required">*</span></label>
                <div class="input-wrapper">
                    <select id="signupNiche" 
                            class="form-select ${authState.errors.niche ? 'error' : ''}"
                            onchange="signupData.niche = this.value">
                        <option value="">Select your trade...</option>
                        ${nicheOptions}
                    </select>
                    <span class="input-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="6 9 12 15 18 9"/>
                        </svg>
                    </span>
                </div>
                ${authState.errors.niche ? `<div class="error-message"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>${authState.errors.niche}</div>` : ''}
            </div>
            
            <div class="form-group">
                <label class="form-label">Company Logo (Optional)</label>
                <div class="logo-upload">
                    ${signupData.companyLogo ? `
                        <div class="logo-preview">
                            <img src="${signupData.companyLogo}" alt="Company Logo">
                            <button type="button" class="logo-remove" onclick="removeCompanyLogo()">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="18" y1="6" x2="6" y2="18"/>
                                    <line x1="6" y1="6" x2="18" y2="18"/>
                                </svg>
                            </button>
                        </div>
                    ` : `
                        <label for="logoUpload" class="logo-upload-area">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                <polyline points="17 8 12 3 7 8"/>
                                <line x1="12" y1="3" x2="12" y2="15"/>
                            </svg>
                            <span>Click to upload logo</span>
                            <small>PNG, JPG up to 5MB</small>
                        </label>
                        <input type="file" id="logoUpload" accept="image/*" style="display: none" onchange="handleLogoUpload(event)">
                    `}
                </div>
                ${authState.errors.logo ? `<div class="error-message"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>${authState.errors.logo}</div>` : ''}
            </div>
            
            ${authState.errors.general ? `<div class="alert error"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>${authState.errors.general}</div>` : ''}
            
            <div class="btn-group">
                <button class="auth-btn primary" onclick="handleSignupStep2Next()">
                    Continue
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="5" y1="12" x2="19" y2="12"/>
                        <polyline points="12 5 19 12 12 19"/>
                    </svg>
                </button>
                <button class="auth-btn secondary" onclick="showSignupStep1()">
                    Back
                </button>
            </div>
        </div>
    `;
}

function renderSignupStep3() {
    return `
        <div class="auth-header">
            <h1 class="auth-title">Create Account</h1>
            <p class="auth-subtitle">Step 3: Bank Details (for Invoices)</p>
        </div>
        
        ${renderProgressSteps(3)}
        
        <div class="auth-form form-section">
            <div class="alert info">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="16" x2="12" y2="12"/>
                    <line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>
                These details will appear on your invoices for client payments
            </div>
            
            <div class="form-group">
                <label class="form-label">Bank Name <span class="required">*</span></label>
                <div class="input-wrapper">
                    <input type="text" 
                           id="signupBankName" 
                           class="form-input ${authState.errors.bankName ? 'error' : ''}"
                           placeholder="e.g. Barclays, HSBC, Lloyds"
                           value="${signupData.bankName}"
                           onkeypress="trackKeyPress(event)"
                           oninput="signupData.bankName = this.value">
                    <span class="input-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="1" y="3" width="15" height="13" rx="2"/>
                            <path d="M10 3v13"/>
                            <path d="M18 12h4"/>
                            <path d="M18 8h4"/>
                            <path d="M18 16h4"/>
                        </svg>
                    </span>
                </div>
                ${authState.errors.bankName ? `<div class="error-message"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>${authState.errors.bankName}</div>` : ''}
            </div>
            
            <div class="form-group">
                <label class="form-label">Account Name <span class="required">*</span></label>
                <div class="input-wrapper">
                    <input type="text" 
                           id="signupAccountName" 
                           class="form-input ${authState.errors.accountName ? 'error' : ''}"
                           placeholder="Name on the account"
                           value="${signupData.accountName}"
                           onkeypress="trackKeyPress(event)"
                           oninput="signupData.accountName = this.value">
                    <span class="input-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                            <circle cx="12" cy="7" r="4"/>
                        </svg>
                    </span>
                </div>
                ${authState.errors.accountName ? `<div class="error-message"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>${authState.errors.accountName}</div>` : ''}
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Sort Code <span class="required">*</span></label>
                    <input type="text" 
                           id="signupSortCode" 
                           class="form-input ${authState.errors.sortCode ? 'error' : ''}"
                           placeholder="00-00-00"
                           value="${signupData.sortCode}"
                           maxlength="8"
                           onkeypress="trackKeyPress(event)"
                           oninput="signupData.sortCode = this.value">
                    ${authState.errors.sortCode ? `<div class="error-message"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>${authState.errors.sortCode}</div>` : ''}
                </div>
                
                <div class="form-group">
                    <label class="form-label">Account Number <span class="required">*</span></label>
                    <input type="text" 
                           id="signupAccountNumber" 
                           class="form-input ${authState.errors.accountNumber ? 'error' : ''}"
                           placeholder="12345678"
                           value="${signupData.accountNumber}"
                           maxlength="8"
                           onkeypress="trackKeyPress(event)"
                           oninput="signupData.accountNumber = this.value">
                    ${authState.errors.accountNumber ? `<div class="error-message"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>${authState.errors.accountNumber}</div>` : ''}
                </div>
            </div>
            
            <div class="checkbox-wrapper">
                <input type="checkbox" id="rememberMeSignup" class="checkbox-input" ${authState.rememberMe ? 'checked' : ''} onchange="authState.rememberMe = this.checked">
                <label for="rememberMeSignup" class="checkbox-label">Remember me on this device</label>
            </div>
            
            ${authState.errors.general ? `<div class="alert error"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>${authState.errors.general}</div>` : ''}
            
            <div class="btn-group">
                <button class="auth-btn success" onclick="handleSignupStep3Submit()" ${authState.isLoading ? 'disabled' : ''}>
                    ${authState.isLoading ? '<span class="spinner"></span> Processing...' : 'Create Account'}
                </button>
                <button class="auth-btn secondary" onclick="showSignupStep2()">
                    Back
                </button>
            </div>
        </div>
    `;
}

function renderVerifyView() {
    return `
        <div class="auth-header">
            <div class="success-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                </svg>
            </div>
            <h1 class="auth-title">Check Your Email</h1>
            <div class="passcode-sent-to">
                <p>We've sent a 6-digit code to</p>
                <p class="email">${authState.email}</p>
                <p class="expires">Code expires in 5 minutes</p>
            </div>
        </div>
        
        <div class="auth-form">
            <div class="form-group">
                <label class="form-label">Enter Verification Code</label>
                <input type="text" 
                       id="passcodeInput" 
                       class="passcode-input ${authState.errors.passcode ? 'error' : ''}"
                       inputmode="numeric"
                       maxlength="6"
                       placeholder="000000"
                       onkeypress="trackKeyPress(event)"
                       oninput="handlePasscodeInput(this)"
                       onkeyup="if(event.key === 'Enter') handleVerifyPasscode()"
                       ${authState.isLoading ? 'disabled' : ''}>
                ${authState.errors.passcode ? `<div class="error-message" style="justify-content: center; margin-top: 8px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>${authState.errors.passcode}</div>` : ''}
            </div>
            
            <div class="btn-group">
                <button class="auth-btn primary" onclick="handleVerifyPasscode()" ${authState.isLoading ? 'disabled' : ''}>
                    ${authState.isLoading ? '<span class="spinner"></span> Verifying...' : 'Verify & Continue'}
                </button>
                <button class="auth-btn outline" onclick="handleResendPasscode()" ${authState.isLoading ? 'disabled' : ''}>
                    Resend Code
                </button>
                <button class="auth-btn secondary" onclick="goBackFromVerify()">
                    Back
                </button>
            </div>
        </div>
    `;
}

// ============================================
// EVENT HANDLERS
// ============================================

function showInitialView() {
    authState.currentView = 'initial';
    authState.errors = {};
    renderAuthScreen();
}

function showLoginView() {
    authState.currentView = 'login';
    authState.errors = {};
    renderAuthScreen();
    setTimeout(() => {
        const emailInput = document.getElementById('loginEmail');
        if (emailInput) emailInput.focus();
    }, 100);
}

function showSignupStep1() {
    authState.currentView = 'signup-step1';
    authState.signupStep = 1;
    authState.errors = {};
    renderAuthScreen();
}

function showSignupStep2() {
    authState.currentView = 'signup-step2';
    authState.signupStep = 2;
    authState.errors = {};
    renderAuthScreen();
}

function showSignupStep3() {
    authState.currentView = 'signup-step3';
    authState.signupStep = 3;
    authState.errors = {};
    renderAuthScreen();
}

function handleSignupStep1Next() {
    if (validateStep1()) {
        showSignupStep2();
    }
}

function handleSignupStep2Next() {
    if (validateStep2()) {
        showSignupStep3();
    }
}

async function handleSignupStep3Submit() {
    if (!validateStep3()) return;
    
    if (detectBot()) {
        authState.errors = { general: 'Suspicious activity detected. Please try again.' };
        renderAuthScreen();
        return;
    }
    
    // Send passcode to business email
    authState.email = signupData.businessEmail;
    const success = await handleSendPasscode(signupData.businessEmail);
}

function handleLoginSubmit() {
    const email = document.getElementById('loginEmail').value;
    const error = validateEmail(email);
    
    if (error) {
        authState.errors = { email: error };
        renderAuthScreen();
        return;
    }
    
    handleSendPasscode(email);
}

function handlePasscodeInput(input) {
    // Only allow numbers
    input.value = input.value.replace(/\D/g, '');
    
    // Auto-submit when 6 digits entered
    if (input.value.length === 6) {
        setTimeout(() => handleVerifyPasscode(), 300);
    }
}

async function handleResendPasscode() {
    authState.errors = {};
    await handleSendPasscode(authState.email);
}

function goBackFromVerify() {
    if (authState.signupStep === 3) {
        showSignupStep3();
    } else {
        showLoginView();
    }
}

function handleLogoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
        authState.errors = { logo: 'File size must be less than 5MB' };
        renderAuthScreen();
        return;
    }
    
    const reader = new FileReader();
    reader.onloadend = () => {
        signupData.companyLogo = reader.result;
        authState.errors = {};
        renderAuthScreen();
    };
    reader.readAsDataURL(file);
}

function removeCompanyLogo() {
    signupData.companyLogo = null;
    renderAuthScreen();
}

function renderErrors() {
    // Update error displays without full re-render
    Object.keys(authState.errors).forEach(field => {
        const input = document.getElementById(`signup${field.charAt(0).toUpperCase() + field.slice(1)}`);
        if (input) {
            input.classList.add('error');
        }
    });
}

function attachAuthEventListeners() {
    // Add any additional event listeners here
}

function showAuthSuccess(message, callback) {
    const authCard = document.querySelector('.auth-card');
    if (!authCard) return;
    
    authCard.innerHTML = `
        <div class="security-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            Secure Connection
        </div>
        <div class="auth-header" style="padding: 40px 0;">
            <div class="success-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20 6 9 17 4 12"/>
                </svg>
            </div>
            <h1 class="auth-title">${message}</h1>
            <p class="auth-subtitle">Redirecting to dashboard...</p>
        </div>
        <div class="auth-footer">
            <p>OMEGA Professional Tools</p>
        </div>
    `;
    
    setTimeout(callback, 2000);
}

// ============================================
// AUTH SCREEN VISIBILITY
// ============================================

function showAuthScreen() {
    const authScreen = document.getElementById('authScreen');
    if (authScreen) {
        authScreen.style.display = 'block';
        renderAuthScreen();
    }
}

function hideAuthScreen() {
    const authScreen = document.getElementById('authScreen');
    if (authScreen) {
        authScreen.style.display = 'none';
    }
}

// ============================================
// LOGOUT FUNCTION
// ============================================

function logout() {
    // Clear auth state
    authState.isAuthenticated = false;
    authState.userId = '';
    authState.userData = null;
    authState.currentView = 'initial';
    
    // Clear localStorage (keep remembered email if set)
    localStorage.removeItem('omegaAuthenticated');
    localStorage.removeItem('omegaUserId');
    localStorage.removeItem('omegaUserEmail');
    
    // Clear global user data
    window.omegaUserData = null;
    
    // Show auth screen
    showAuthScreen();
    
    // Hide dashboard
    const dashboardScreen = document.getElementById('dashboardScreen');
    if (dashboardScreen) {
        dashboardScreen.style.display = 'none';
    }
}

// ============================================
// INITIALIZATION
// ============================================

async function initAuth() {
    // Check if user has an active session
    const isAuthenticated = localStorage.getItem('omegaAuthenticated') === 'true';
    const storedEmail = localStorage.getItem('omegaUserEmail');
    const storedUserId = localStorage.getItem('omegaUserId');
    
    if (isAuthenticated && storedEmail) {
        try {
            // Always fetch fresh data from the database (Webhook #4)
            const userData = await getUserDataFromWebhook(storedEmail, storedUserId);
            
            if (userData && userData.success !== false) {
                authState.isAuthenticated = true;
                authState.userData = userData;
                authState.userId = userData.userId || storedUserId;
                authState.email = storedEmail;
                
                // Update global user data for quotes/invoices
                updateGlobalUserData(userData);
                
                return true; // User is logged in with fresh data
            } else {
                // Database doesn't have this user - clear session
                console.warn('User not found in database, clearing session');
                localStorage.removeItem('omegaAuthenticated');
                localStorage.removeItem('omegaUserId');
                localStorage.removeItem('omegaUserEmail');
                return false;
            }
        } catch (e) {
            console.error('Error fetching user data:', e);
            // On error, require fresh login
            localStorage.removeItem('omegaAuthenticated');
            return false;
        }
    }
    
    return false; // User needs to log in
}

// Export for use in navigation
window.initAuth = initAuth;
window.showAuthScreen = showAuthScreen;
window.hideAuthScreen = hideAuthScreen;
window.renderAuthScreen = renderAuthScreen;
window.logout = logout;
window.authState = authState;
