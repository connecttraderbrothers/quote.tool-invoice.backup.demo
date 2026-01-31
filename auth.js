// OMEGA Authentication System
// Passwordless login with Make.com webhook integration

// ============================================
// WEBHOOK CONFIGURATION - UPDATE THESE URLs
// ============================================
const WEBHOOK_CONFIG = {
    // Webhook #1: Account Creation - Stores details and sends OTP
    // Also used for Login OTP request and Resend Code
    ACCOUNT_CREATE_OTP: 'YOUR_MAKE_COM_WEBHOOK_1_URL',
    
    // Webhook #2: Account Creation - Validates OTP
    ACCOUNT_VALIDATE_OTP: 'YOUR_MAKE_COM_WEBHOOK_2_URL',
    
    // Webhook #3: Get User Details (after account creation)
    GET_USER_DETAILS: 'YOUR_MAKE_COM_WEBHOOK_3_URL',
    
    // Webhook #4: Login Validation - Validates OTP and returns user data
    LOGIN_VALIDATE: 'YOUR_MAKE_COM_WEBHOOK_4_URL'
};

// ============================================
// AUTH STATE MANAGEMENT
// ============================================
let authState = {
    isAuthenticated: false,
    currentView: 'initial', // initial, login, signup-step1, signup-step2, signup-step3, verify-signup, verify-login
    signupStep: 1,
    email: '',
    userId: '',
    userData: null,
    isLoading: false,
    errors: {},
    rememberMe: false,
    // OTP tracking
    otpAttempts: 0,
    otpAttemptsRemaining: 3,
    otpExpiry: null,
    showResendButton: false,
    showCreateAccountButton: false,
    // Flow type
    flowType: '', // 'signup' or 'login'
    requestType: '' // 'Account creation' or 'Login requested'
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
    if (behaviorData.lastKeyPress) {
        behaviorData.keyPressIntervals.push(now - behaviorData.lastKeyPress);
        if (behaviorData.keyPressIntervals.length > 20) {
            behaviorData.keyPressIntervals.shift();
        }
    }
    behaviorData.lastKeyPress = now;
    behaviorData.lastActivity = now;
}

function trackMouseMove(e) {
    behaviorData.mouseMovements.push({ x: e.clientX, y: e.clientY, t: Date.now() });
    if (behaviorData.mouseMovements.length > 50) {
        behaviorData.mouseMovements.shift();
    }
    behaviorData.lastActivity = Date.now();
}

function detectBot() {
    // Check for consistent key press intervals (bot-like)
    if (behaviorData.keyPressIntervals.length >= 5) {
        const avg = behaviorData.keyPressIntervals.reduce((a, b) => a + b, 0) / behaviorData.keyPressIntervals.length;
        const variance = behaviorData.keyPressIntervals.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / behaviorData.keyPressIntervals.length;
        if (variance < 10 && avg < 50) {
            return true;
        }
    }
    
    // Check for no mouse movement
    if (behaviorData.mouseMovements.length < 3 && behaviorData.keyPressIntervals.length > 10) {
        return true;
    }
    
    return false;
}

// Initialize event listeners for bot detection
document.addEventListener('keydown', trackKeyPress);
document.addEventListener('mousemove', trackMouseMove);

// ============================================
// UTILITY FUNCTIONS
// ============================================

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return 'Email is required';
    if (!re.test(email)) return 'Please enter a valid email';
    return null;
}

function validatePhone(phone) {
    if (!phone) return 'Phone number is required';
    const cleaned = phone.replace(/[\s\-\(\)]/g, '');
    if (cleaned.length < 10) return 'Please enter a valid phone number';
    return null;
}

function validateRequired(value, fieldName) {
    if (!value || !value.trim()) return `${fieldName} is required`;
    return null;
}

function validateSortCode(sortCode) {
    if (!sortCode) return 'Sort code is required';
    const cleaned = sortCode.replace(/[\s\-]/g, '');
    if (!/^\d{6}$/.test(cleaned)) return 'Sort code must be 6 digits';
    return null;
}

function validateAccountNumber(accountNumber) {
    if (!accountNumber) return 'Account number is required';
    const cleaned = accountNumber.replace(/[\s\-]/g, '');
    if (!/^\d{8}$/.test(cleaned)) return 'Account number must be 8 digits';
    return null;
}

function generatePasscode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

function generateUserId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let id = '';
    for (let i = 0; i < 12; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
        if ((i + 1) % 4 === 0 && i !== 11) id += '-';
    }
    return id;
}

// ============================================
// WEBHOOK FUNCTIONS
// ============================================

// Webhook #1: Account Creation - Submit details and send OTP
async function webhookAccountCreateOTP(userData, requestType = 'Account creation') {
    try {
        // Generate OTP to send to webhook
        const otp = generatePasscode();
        const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
        
        console.log('ðŸ“§ Webhook #1: Sending account details and OTP:', otp);
        
        const response = await fetch(WEBHOOK_CONFIG.ACCOUNT_CREATE_OTP, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...userData,
                otp: otp,
                otp_expires_at: otpExpiresAt,
                request_type: requestType,
                timestamp: new Date().toISOString()
            })
        });
        
        if (!response.ok) {
            return { status: 'error', message: 'Network error' };
        }
        
        const result = await response.json();
        console.log('Webhook #1 response:', result);
        return result;
    } catch (error) {
        console.error('Webhook #1 error:', error);
        // Demo fallback
        return {
            status: 'success',
            message: 'Account details received and OTP sent',
            user_id: generateUserId(),
            email: userData.email || userData.businessEmail,
            otp_sent: true,
            otp_expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString()
        };
    }
}

// Webhook #1: Login OTP Request
async function webhookLoginOTPRequest(email) {
    try {
        // Generate OTP to send to webhook
        const otp = generatePasscode();
        const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
        
        console.log('ðŸ“§ Webhook #1: Sending login OTP request for', email, 'OTP:', otp);
        
        const response = await fetch(WEBHOOK_CONFIG.ACCOUNT_CREATE_OTP, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: email,
                otp: otp,
                otp_expires_at: otpExpiresAt,
                request_type: 'Login requested',
                timestamp: new Date().toISOString()
            })
        });
        
        if (!response.ok) {
            return { status: 'error', message: 'Network error' };
        }
        
        const result = await response.json();
        console.log('Webhook #1 (login) response:', result);
        return result;
    } catch (error) {
        console.error('Webhook #1 (login) error:', error);
        // Demo fallback
        return {
            status: 'success',
            message: 'Login OTP sent',
            email: email,
            otp_sent: true,
            otp_expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
            request_type: 'Login requested'
        };
    }
}

// Webhook #1: Resend Code Request
async function webhookResendCode(email, requestType) {
    try {
        // Generate new OTP to send to webhook
        const otp = generatePasscode();
        const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
        
        console.log('ðŸ“§ Webhook #1: Resending OTP for', email, 'New OTP:', otp);
        
        const response = await fetch(WEBHOOK_CONFIG.ACCOUNT_CREATE_OTP, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: email,
                otp: otp,
                otp_expires_at: otpExpiresAt,
                request_type: requestType,
                resend: true,
                timestamp: new Date().toISOString()
            })
        });
        
        if (!response.ok) {
            return { status: 'error', message: 'Network error' };
        }
        
        const result = await response.json();
        console.log('Webhook #1 (resend) response:', result);
        return result;
    } catch (error) {
        console.error('Webhook #1 (resend) error:', error);
        // Demo fallback
        return {
            status: 'success',
            message: 'New OTP sent',
            email: email,
            otp_sent: true,
            otp_expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
            attempts_reset: true
        };
    }
}

// Webhook #2: Account Creation - Validate OTP
async function webhookAccountValidateOTP(email, otp, attemptCount) {
    try {
        console.log('ðŸ” Webhook #2: Validating signup OTP, attempt', attemptCount);
        
        const response = await fetch(WEBHOOK_CONFIG.ACCOUNT_VALIDATE_OTP, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: email,
                otp: otp,
                attempt_count: attemptCount,
                timestamp: new Date().toISOString()
            })
        });
        
        if (!response.ok) {
            return { status: 'error', message: 'Network error' };
        }
        
        const result = await response.json();
        console.log('Webhook #2 response:', result);
        return result;
    } catch (error) {
        console.error('Webhook #2 error:', error);
        // Demo fallback - simulate success
        return {
            status: 'success',
            message: 'OTP validated successfully',
            user_id: authState.userId,
            otp_valid: true,
            attempts_used: attemptCount,
            attempts_remaining: 3 - attemptCount
        };
    }
}

// Webhook #3: Get User Details
async function webhookGetUserDetails(email) {
    try {
        console.log('ðŸ‘¤ Webhook #3: Getting user details for', email);
        
        const response = await fetch(WEBHOOK_CONFIG.GET_USER_DETAILS, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: email,
                timestamp: new Date().toISOString()
            })
        });
        
        if (!response.ok) {
            return { status: 'error', message: 'Network error' };
        }
        
        const result = await response.json();
        console.log('Webhook #3 response:', result);
        return result;
    } catch (error) {
        console.error('Webhook #3 error:', error);
        return { status: 'error', message: 'Failed to get user details' };
    }
}

// Webhook #4: Login Validation - Validate OTP and return user data
async function webhookLoginValidate(email, otp, attemptCount) {
    try {
        console.log('ðŸ” Webhook #4: Validating login, attempt', attemptCount);
        
        const response = await fetch(WEBHOOK_CONFIG.LOGIN_VALIDATE, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: email,
                otp: otp,
                attempt_count: attemptCount,
                timestamp: new Date().toISOString()
            })
        });
        
        if (!response.ok) {
            return { status: 'error', message: 'Network error' };
        }
        
        const result = await response.json();
        console.log('Webhook #4 response:', result);
        return result;
    } catch (error) {
        console.error('Webhook #4 error:', error);
        // Demo fallback
        return {
            status: 'error',
            message: 'Login validation failed',
            otp_valid: false,
            user_exists: false
        };
    }
}

// ============================================
// AUTH FLOW HANDLERS
// ============================================

// Handle Signup Step 3 Submit - Send all details to Webhook #1
async function handleSignupSubmit() {
    if (!validateStep3()) return;
    
    if (detectBot()) {
        authState.errors = { general: 'Suspicious activity detected. Please try again.' };
        renderAuthScreen();
        return;
    }
    
    authState.isLoading = true;
    authState.errors = {};
    renderAuthScreen();
    
    // Prepare full user data for Webhook #1
    const userData = {
        user_id: generateUserId(),
        // Personal Info
        name: signupData.name,
        personal_email: signupData.personalEmail,
        personal_mobile: signupData.personalMobile,
        address: signupData.address,
        // Business Info
        company_name: signupData.companyName,
        business_email: signupData.businessEmail,
        business_mobile: signupData.businessMobile,
        niche: signupData.niche,
        company_logo: signupData.companyLogo,
        // Bank Details
        bank_name: signupData.bankName,
        account_name: signupData.accountName,
        sort_code: signupData.sortCode,
        account_number: signupData.accountNumber
    };
    
    // Send to Webhook #1
    const result = await webhookAccountCreateOTP(userData, 'Account creation');
    
    authState.isLoading = false;
    
    if (result.status === 'success' && result.otp_sent) {
        // Store user ID and email from response
        authState.userId = result.user_id;
        authState.email = result.email || signupData.businessEmail;
        authState.otpExpiry = result.otp_expires_at;
        authState.otpAttempts = 0;
        authState.otpAttemptsRemaining = 3;
        authState.showResendButton = false;
        authState.flowType = 'signup';
        authState.requestType = 'Account creation';
        authState.currentView = 'verify-signup';
        renderAuthScreen();
        
        // Focus OTP input
        setTimeout(() => {
            const otpInput = document.getElementById('otpInput');
            if (otpInput) otpInput.focus();
        }, 100);
    } else {
        authState.errors = { general: result.message || 'Failed to create account. Please try again.' };
        renderAuthScreen();
    }
}

// Handle Login Submit - Send email to Webhook #1 for OTP
async function handleLoginSubmit() {
    const email = document.getElementById('loginEmail').value;
    const error = validateEmail(email);
    
    if (error) {
        authState.errors = { email: error };
        renderAuthScreen();
        return;
    }
    
    if (detectBot()) {
        authState.errors = { general: 'Suspicious activity detected. Please try again.' };
        renderAuthScreen();
        return;
    }
    
    authState.isLoading = true;
    authState.errors = {};
    renderAuthScreen();
    
    // Send to Webhook #1 for login OTP
    const result = await webhookLoginOTPRequest(email);
    
    authState.isLoading = false;
    
    if (result.status === 'success' && result.otp_sent) {
        authState.email = result.email || email;
        authState.otpExpiry = result.otp_expires_at;
        authState.otpAttempts = 0;
        authState.otpAttemptsRemaining = 3;
        authState.showResendButton = false;
        authState.showCreateAccountButton = false;
        authState.flowType = 'login';
        authState.requestType = 'Login requested';
        authState.currentView = 'verify-login';
        renderAuthScreen();
        
        // Focus OTP input
        setTimeout(() => {
            const otpInput = document.getElementById('otpInput');
            if (otpInput) otpInput.focus();
        }, 100);
    } else {
        authState.errors = { general: result.message || 'Failed to send OTP. Please try again.' };
        renderAuthScreen();
    }
}

// Handle OTP Verification for Signup (Webhook #2)
async function handleSignupOTPVerify() {
    const otp = document.getElementById('otpInput').value;
    
    if (otp.length !== 6) {
        authState.errors = { otp: 'Please enter the 6-digit code' };
        renderAuthScreen();
        return;
    }
    
    authState.isLoading = true;
    authState.errors = {};
    authState.otpAttempts++;
    renderAuthScreen();
    
    // Send to Webhook #2
    const result = await webhookAccountValidateOTP(authState.email, otp, authState.otpAttempts);
    
    authState.isLoading = false;
    
    if (result.status === 'success' && result.otp_valid) {
        // OTP valid - account created successfully
        authState.userId = result.user_id || authState.userId;
        authState.otpAttemptsRemaining = result.attempts_remaining;
        
        // Get user details from Webhook #3
        const userDetails = await webhookGetUserDetails(authState.email);
        
        if (userDetails.status === 'success' && userDetails.user) {
            // Store user data and complete signup
            completeAuthentication(userDetails.user);
        } else {
            // Use signup data as fallback
            completeAuthentication({
                user_id: authState.userId,
                email: authState.email,
                company_name: signupData.companyName,
                address: signupData.address,
                phone: signupData.businessMobile,
                logo: signupData.companyLogo,
                bank_details: {
                    bank_name: signupData.bankName,
                    account_name: signupData.accountName,
                    sort_code: signupData.sortCode,
                    account_number: signupData.accountNumber
                }
            });
        }
    } else {
        // OTP invalid
        authState.otpAttemptsRemaining = result.attempts_remaining;
        
        if (result.otp_deleted || result.attempts_remaining === 0) {
            // Max attempts reached
            authState.showResendButton = true;
            authState.errors = { otp: 'Maximum attempts exceeded. Please request a new code.' };
        } else {
            authState.errors = { 
                otp: `Invalid code. ${result.attempts_remaining} attempt${result.attempts_remaining !== 1 ? 's' : ''} remaining.` 
            };
        }
        
        renderAuthScreen();
        
        // Shake animation
        const input = document.getElementById('otpInput');
        if (input) {
            input.classList.add('error');
            input.value = '';
            setTimeout(() => input.classList.remove('error'), 500);
        }
    }
}

// Handle OTP Verification for Login (Webhook #4)
async function handleLoginOTPVerify() {
    const otp = document.getElementById('otpInput').value;
    
    if (otp.length !== 6) {
        authState.errors = { otp: 'Please enter the 6-digit code' };
        renderAuthScreen();
        return;
    }
    
    authState.isLoading = true;
    authState.errors = {};
    authState.otpAttempts++;
    renderAuthScreen();
    
    // Send to Webhook #4
    const result = await webhookLoginValidate(authState.email, otp, authState.otpAttempts);
    
    authState.isLoading = false;
    
    if (result.status === 'success' && result.otp_valid && result.user_exists) {
        // Login successful
        authState.otpAttemptsRemaining = result.attempts_remaining;
        completeAuthentication(result.user);
    } else {
        // Login failed
        authState.otpAttemptsRemaining = result.attempts_remaining;
        
        if (!result.user_exists) {
            // User doesn't exist - show Create Account button
            authState.showCreateAccountButton = true;
            authState.errors = { otp: 'Account not found. Please create an account.' };
        } else if (result.otp_deleted || result.attempts_remaining === 0) {
            // Max attempts reached
            authState.showResendButton = true;
            authState.errors = { otp: 'Maximum attempts exceeded. Please request a new code.' };
        } else {
            authState.errors = { 
                otp: `Invalid code. ${result.attempts_remaining} attempt${result.attempts_remaining !== 1 ? 's' : ''} remaining.` 
            };
        }
        
        renderAuthScreen();
        
        // Shake animation
        const input = document.getElementById('otpInput');
        if (input) {
            input.classList.add('error');
            input.value = '';
            setTimeout(() => input.classList.remove('error'), 500);
        }
    }
}

// Handle Resend Code
async function handleResendCode() {
    authState.isLoading = true;
    authState.errors = {};
    authState.showResendButton = false;
    renderAuthScreen();
    
    const result = await webhookResendCode(authState.email, authState.requestType);
    
    authState.isLoading = false;
    
    if (result.status === 'success' && result.otp_sent) {
        authState.otpAttempts = 0;
        authState.otpAttemptsRemaining = 3;
        authState.otpExpiry = result.otp_expires_at;
        authState.errors = { success: 'New code sent! Check your email.' };
        renderAuthScreen();
        
        // Clear success message after 3 seconds
        setTimeout(() => {
            authState.errors = {};
            renderAuthScreen();
        }, 3000);
    } else {
        authState.showResendButton = true;
        authState.errors = { general: 'Failed to resend code. Please try again.' };
        renderAuthScreen();
    }
}

// Handle Create Account button (shown when user doesn't exist during login)
function handleCreateAccountRedirect() {
    // Reset state for signup flow
    authState.currentView = 'signup-step1';
    authState.signupStep = 1;
    authState.otpAttempts = 0;
    authState.otpAttemptsRemaining = 3;
    authState.showCreateAccountButton = false;
    authState.showResendButton = false;
    authState.errors = {};
    authState.flowType = 'signup';
    
    // Pre-fill email if available
    if (authState.email) {
        signupData.businessEmail = authState.email;
    }
    
    renderAuthScreen();
}

// Complete authentication and redirect to dashboard
function completeAuthentication(userData) {
    // Normalize user data
    const normalizedData = {
        userId: userData.user_id || userData.userId,
        email: userData.email || userData.business_email,
        companyName: userData.company_name || userData.companyName,
        address: userData.address,
        phone: userData.phone || userData.business_mobile,
        personalEmail: userData.personal_email,
        personalMobile: userData.personal_mobile,
        businessEmail: userData.business_email || userData.email,
        businessMobile: userData.business_mobile || userData.phone,
        niche: userData.niche,
        logo: userData.logo || userData.company_logo,
        bankDetails: userData.bank_details || userData.bankDetails || {
            bankName: userData.bank_name,
            accountName: userData.account_name,
            sortCode: userData.sort_code,
            accountNumber: userData.account_number
        }
    };
    
    // Store session info
    localStorage.setItem('omegaAuthenticated', 'true');
    localStorage.setItem('omegaUserId', normalizedData.userId);
    localStorage.setItem('omegaUserEmail', normalizedData.email);
    
    if (authState.rememberMe) {
        localStorage.setItem('omegaRememberedEmail', normalizedData.email);
    }
    
    // Update auth state
    authState.isAuthenticated = true;
    authState.userId = normalizedData.userId;
    authState.userData = normalizedData;
    
    // Update global user data for quotes/invoices
    updateGlobalUserData(normalizedData);
    
    // Show success and redirect
    const message = authState.flowType === 'signup' ? 'Account created successfully!' : 'Welcome back!';
    showAuthSuccess(message, () => {
        hideAuthScreen();
        showDashboard();
    });
}

// ============================================
// UPDATE GLOBAL USER DATA FOR QUOTES/INVOICES
// ============================================

function updateGlobalUserData(userData) {
    window.omegaUserData = {
        companyName: userData.companyName || userData.company_name || 'Your Company',
        address: userData.address || '',
        phone: userData.phone || userData.businessMobile || userData.business_mobile || '',
        email: userData.email || userData.businessEmail || userData.business_email || '',
        logo: userData.logo || userData.companyLogo || userData.company_logo || null,
        
        // Additional fields
        businessEmail: userData.businessEmail || userData.business_email || userData.email || '',
        businessMobile: userData.businessMobile || userData.business_mobile || userData.phone || '',
        personalEmail: userData.personalEmail || userData.personal_email || '',
        personalMobile: userData.personalMobile || userData.personal_mobile || '',
        tradeNiche: userData.niche || userData.tradeNiche || '',
        userId: userData.userId || userData.user_id || '',
        
        // Bank details for invoices
        bankDetails: userData.bankDetails || userData.bank_details || {
            bankName: '',
            accountName: '',
            sortCode: '',
            accountNumber: ''
        }
    };
    
    console.log('User data updated for quotes/invoices:', window.omegaUserData);
}

// ============================================
// VALIDATION FUNCTIONS
// ============================================

function validateStep1() {
    const errors = {};
    
    let nameError = validateRequired(signupData.name, 'Full name');
    if (nameError) errors.name = nameError;
    
    let personalEmailError = validateEmail(signupData.personalEmail);
    if (personalEmailError) errors.personalEmail = personalEmailError;
    
    let phoneError = validatePhone(signupData.personalMobile);
    if (phoneError) errors.personalMobile = phoneError;
    
    let addressError = validateRequired(signupData.address, 'Address');
    if (addressError) errors.address = addressError;
    
    authState.errors = errors;
    renderAuthScreen();
    
    return Object.keys(errors).length === 0;
}

function validateStep2() {
    const errors = {};
    
    let companyError = validateRequired(signupData.companyName, 'Company name');
    if (companyError) errors.companyName = companyError;
    
    let emailError = validateEmail(signupData.businessEmail);
    if (emailError) errors.businessEmail = emailError;
    
    let phoneError = validatePhone(signupData.businessMobile);
    if (phoneError) errors.businessMobile = phoneError;
    
    let nicheError = validateRequired(signupData.niche, 'Trade/Niche');
    if (nicheError) errors.niche = nicheError;
    
    authState.errors = errors;
    renderAuthScreen();
    
    return Object.keys(errors).length === 0;
}

function validateStep3() {
    const errors = {};
    
    let bankError = validateRequired(signupData.bankName, 'Bank name');
    if (bankError) errors.bankName = bankError;
    
    let accountNameError = validateRequired(signupData.accountName, 'Account name');
    if (accountNameError) errors.accountName = accountNameError;
    
    let sortCodeError = validateSortCode(signupData.sortCode);
    if (sortCodeError) errors.sortCode = sortCodeError;
    
    let accountNumberError = validateAccountNumber(signupData.accountNumber);
    if (accountNumberError) errors.accountNumber = accountNumberError;
    
    authState.errors = errors;
    renderAuthScreen();
    
    return Object.keys(errors).length === 0;
}

// ============================================
// UI RENDERING
// ============================================

function renderAuthScreen() {
    const authScreen = document.getElementById('authScreen');
    if (!authScreen) return;
    
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
        case 'verify-signup':
            content = renderVerifySignup();
            break;
        case 'verify-login':
            content = renderVerifyLogin();
            break;
        default:
            content = renderInitialView();
    }
    
    authScreen.innerHTML = content;
}

function renderInitialView() {
    const rememberedEmail = localStorage.getItem('omegaRememberedEmail');
    const hasExistingAccount = localStorage.getItem('omegaAuthenticated') === 'true';
    
    return `
        <div class="auth-container">
            <div class="auth-card">
                <div class="auth-header">
                    <img src="https://github.com/connecttraderbrothers/omega.app.icon/blob/main/icon-512x512.png?raw=true" alt="OMEGA" class="auth-logo">
                    <h1 class="auth-title">OMEGA</h1>
                    <p class="auth-subtitle">Professional Business Tools</p>
                </div>
                
                <div class="auth-content">
                    ${hasExistingAccount ? `
                        <div class="welcome-back-message">
                            <p>Welcome back!</p>
                            <p class="user-email">${rememberedEmail || ''}</p>
                        </div>
                    ` : `
                        <p class="auth-description">
                            Create professional quotes and invoices in minutes. 
                            Sign up for free or log in to continue.
                        </p>
                    `}
                    
                    <div class="auth-buttons">
                        <button class="auth-btn primary" onclick="showSignupStep1()">
                            Create Account
                        </button>
                        <button class="auth-btn secondary" onclick="showLoginView()">
                            ${hasExistingAccount ? 'Log In' : 'I have an account'}
                        </button>
                    </div>
                </div>
                
                <div class="auth-footer">
                    <p>By continuing, you agree to our Terms of Service</p>
                </div>
            </div>
        </div>
    `;
}

function renderLoginView() {
    const rememberedEmail = localStorage.getItem('omegaRememberedEmail') || '';
    
    return `
        <div class="auth-container">
            <div class="auth-card">
                <div class="auth-header">
                    <img src="https://github.com/connecttraderbrothers/omega.app.icon/blob/main/icon-512x512.png?raw=true" alt="OMEGA" class="auth-logo">
                    <h1 class="auth-title">Welcome Back</h1>
                    <p class="auth-subtitle">Enter your email to receive a login code</p>
                </div>
                
                <div class="auth-content">
                    ${authState.errors.general ? `<div class="auth-error-banner">${authState.errors.general}</div>` : ''}
                    
                    <div class="form-group">
                        <label for="loginEmail">Email Address</label>
                        <input 
                            type="email" 
                            id="loginEmail" 
                            class="auth-input ${authState.errors.email ? 'error' : ''}"
                            placeholder="your@email.com"
                            value="${rememberedEmail}"
                            ${authState.isLoading ? 'disabled' : ''}
                        >
                        ${authState.errors.email ? `<span class="error-text">${authState.errors.email}</span>` : ''}
                    </div>
                    
                    <div class="form-group remember-me">
                        <label class="checkbox-label">
                            <input type="checkbox" id="rememberMe" ${authState.rememberMe ? 'checked' : ''} onchange="authState.rememberMe = this.checked">
                            <span>Remember me</span>
                        </label>
                    </div>
                    
                    <button class="auth-btn primary" onclick="handleLoginSubmit()" ${authState.isLoading ? 'disabled' : ''}>
                        ${authState.isLoading ? '<span class="spinner"></span> Sending...' : 'Send Login Code'}
                    </button>
                    
                    <div class="auth-divider">
                        <span>or</span>
                    </div>
                    
                    <button class="auth-btn secondary" onclick="showSignupStep1()" ${authState.isLoading ? 'disabled' : ''}>
                        Create New Account
                    </button>
                </div>
                
                <div class="auth-back">
                    <a href="#" onclick="showInitialView(); return false;">&lt; Back</a>
                </div>
            </div>
        </div>
    `;
}

function renderSignupStep1() {
    return `
        <div class="auth-container">
            <div class="auth-card">
                <div class="auth-header">
                    <img src="https://github.com/connecttraderbrothers/omega.app.icon/blob/main/icon-512x512.png?raw=true" alt="OMEGA" class="auth-logo">
                    <h1 class="auth-title">Create Account</h1>
                    <p class="auth-subtitle">Step 1: Personal Information</p>
                </div>
                
                <div class="progress-bar">
                    <div class="progress-step active">1</div>
                    <div class="progress-line"></div>
                    <div class="progress-step">2</div>
                    <div class="progress-line"></div>
                    <div class="progress-step">3</div>
                </div>
                
                <div class="auth-content">
                    ${authState.errors.general ? `<div class="auth-error-banner">${authState.errors.general}</div>` : ''}
                    
                    <div class="form-group">
                        <label for="name">Full Name *</label>
                        <input 
                            type="text" 
                            id="name" 
                            class="auth-input ${authState.errors.name ? 'error' : ''}"
                            placeholder="John Smith"
                            value="${signupData.name}"
                            onchange="signupData.name = this.value"
                        >
                        ${authState.errors.name ? `<span class="error-text">${authState.errors.name}</span>` : ''}
                    </div>
                    
                    <div class="form-group">
                        <label for="personalEmail">Personal Email *</label>
                        <input 
                            type="email" 
                            id="personalEmail" 
                            class="auth-input ${authState.errors.personalEmail ? 'error' : ''}"
                            placeholder="john@personal.com"
                            value="${signupData.personalEmail}"
                            onchange="signupData.personalEmail = this.value"
                        >
                        ${authState.errors.personalEmail ? `<span class="error-text">${authState.errors.personalEmail}</span>` : ''}
                    </div>
                    
                    <div class="form-group">
                        <label for="personalMobile">Mobile Number *</label>
                        <input 
                            type="tel" 
                            id="personalMobile" 
                            class="auth-input ${authState.errors.personalMobile ? 'error' : ''}"
                            placeholder="07700 900123"
                            value="${signupData.personalMobile}"
                            onchange="signupData.personalMobile = this.value"
                        >
                        ${authState.errors.personalMobile ? `<span class="error-text">${authState.errors.personalMobile}</span>` : ''}
                    </div>
                    
                    <div class="form-group">
                        <label for="address">Address *</label>
                        <textarea 
                            id="address" 
                            class="auth-input ${authState.errors.address ? 'error' : ''}"
                            placeholder="123 Main Street, Edinburgh, EH1 1AA"
                            rows="3"
                            onchange="signupData.address = this.value"
                        >${signupData.address}</textarea>
                        ${authState.errors.address ? `<span class="error-text">${authState.errors.address}</span>` : ''}
                    </div>
                    
                    <div class="auth-buttons">
                        <button class="auth-btn secondary" onclick="showInitialView()">
                            Back
                        </button>
                        <button class="auth-btn primary" onclick="handleStep1Next()">
                            Next &gt;
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderSignupStep2() {
    const nicheOptions = TRADE_NICHES.map(niche => 
        `<option value="${niche}" ${signupData.niche === niche ? 'selected' : ''}>${niche}</option>`
    ).join('');
    
    return `
        <div class="auth-container">
            <div class="auth-card">
                <div class="auth-header">
                    <img src="https://github.com/connecttraderbrothers/omega.app.icon/blob/main/icon-512x512.png?raw=true" alt="OMEGA" class="auth-logo">
                    <h1 class="auth-title">Create Account</h1>
                    <p class="auth-subtitle">Step 2: Business Information</p>
                </div>
                
                <div class="progress-bar">
                    <div class="progress-step completed">OK</div>
                    <div class="progress-line completed"></div>
                    <div class="progress-step active">2</div>
                    <div class="progress-line"></div>
                    <div class="progress-step">3</div>
                </div>
                
                <div class="auth-content">
                    ${authState.errors.general ? `<div class="auth-error-banner">${authState.errors.general}</div>` : ''}
                    
                    <div class="form-group">
                        <label for="companyName">Company Name *</label>
                        <input 
                            type="text" 
                            id="companyName" 
                            class="auth-input ${authState.errors.companyName ? 'error' : ''}"
                            placeholder="Smith Plumbing Ltd"
                            value="${signupData.companyName}"
                            onchange="signupData.companyName = this.value"
                        >
                        ${authState.errors.companyName ? `<span class="error-text">${authState.errors.companyName}</span>` : ''}
                    </div>
                    
                    <div class="form-group">
                        <label for="businessEmail">Business Email *</label>
                        <input 
                            type="email" 
                            id="businessEmail" 
                            class="auth-input ${authState.errors.businessEmail ? 'error' : ''}"
                            placeholder="info@smithplumbing.com"
                            value="${signupData.businessEmail}"
                            onchange="signupData.businessEmail = this.value"
                        >
                        ${authState.errors.businessEmail ? `<span class="error-text">${authState.errors.businessEmail}</span>` : ''}
                        <span class="help-text">OTP will be sent to this email</span>
                    </div>
                    
                    <div class="form-group">
                        <label for="businessMobile">Business Phone *</label>
                        <input 
                            type="tel" 
                            id="businessMobile" 
                            class="auth-input ${authState.errors.businessMobile ? 'error' : ''}"
                            placeholder="0131 123 4567"
                            value="${signupData.businessMobile}"
                            onchange="signupData.businessMobile = this.value"
                        >
                        ${authState.errors.businessMobile ? `<span class="error-text">${authState.errors.businessMobile}</span>` : ''}
                    </div>
                    
                    <div class="form-group">
                        <label for="niche">Trade / Niche *</label>
                        <select 
                            id="niche" 
                            class="auth-input ${authState.errors.niche ? 'error' : ''}"
                            onchange="signupData.niche = this.value"
                        >
                            <option value="">Select your trade...</option>
                            ${nicheOptions}
                        </select>
                        ${authState.errors.niche ? `<span class="error-text">${authState.errors.niche}</span>` : ''}
                    </div>
                    
                    <div class="form-group">
                        <label>Company Logo (Optional)</label>
                        <div class="logo-upload-area" onclick="document.getElementById('logoUpload').click()">
                            ${signupData.companyLogo ? 
                                `<img src="${signupData.companyLogo}" class="uploaded-logo" alt="Logo">
                                 <button class="remove-logo" onclick="event.stopPropagation(); removeCompanyLogo()">Ã—</button>` : 
                                `<div class="upload-placeholder">
                                    <span class="upload-icon">+</span>
                                    <span>Click to upload logo</span>
                                    <span class="upload-hint">PNG, JPG up to 5MB</span>
                                </div>`
                            }
                        </div>
                        <input type="file" id="logoUpload" accept="image/*" style="display:none" onchange="handleLogoUpload(event)">
                        ${authState.errors.logo ? `<span class="error-text">${authState.errors.logo}</span>` : ''}
                    </div>
                    
                    <div class="auth-buttons">
                        <button class="auth-btn secondary" onclick="showSignupStep1()">
                            &lt; Back
                        </button>
                        <button class="auth-btn primary" onclick="handleStep2Next()">
                            Next &gt;
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderSignupStep3() {
    return `
        <div class="auth-container">
            <div class="auth-card">
                <div class="auth-header">
                    <img src="https://github.com/connecttraderbrothers/omega.app.icon/blob/main/icon-512x512.png?raw=true" alt="OMEGA" class="auth-logo">
                    <h1 class="auth-title">Create Account</h1>
                    <p class="auth-subtitle">Step 3: Bank Details (for Invoices)</p>
                </div>
                
                <div class="progress-bar">
                    <div class="progress-step completed">OK</div>
                    <div class="progress-line completed"></div>
                    <div class="progress-step completed">OK</div>
                    <div class="progress-line completed"></div>
                    <div class="progress-step active">3</div>
                </div>
                
                <div class="auth-content">
                    ${authState.errors.general ? `<div class="auth-error-banner">${authState.errors.general}</div>` : ''}
                    
                    <div class="bank-info-notice">
                        <span class="info-icon">*</span>
                        <p>Your bank details are stored securely and only used to display on your invoices for client payments.</p>
                    </div>
                    
                    <div class="form-group">
                        <label for="bankName">Bank Name *</label>
                        <input 
                            type="text" 
                            id="bankName" 
                            class="auth-input ${authState.errors.bankName ? 'error' : ''}"
                            placeholder="Bank of Scotland"
                            value="${signupData.bankName}"
                            onchange="signupData.bankName = this.value"
                        >
                        ${authState.errors.bankName ? `<span class="error-text">${authState.errors.bankName}</span>` : ''}
                    </div>
                    
                    <div class="form-group">
                        <label for="accountName">Account Name *</label>
                        <input 
                            type="text" 
                            id="accountName" 
                            class="auth-input ${authState.errors.accountName ? 'error' : ''}"
                            placeholder="Smith Plumbing Ltd"
                            value="${signupData.accountName}"
                            onchange="signupData.accountName = this.value"
                        >
                        ${authState.errors.accountName ? `<span class="error-text">${authState.errors.accountName}</span>` : ''}
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="sortCode">Sort Code *</label>
                            <input 
                                type="text" 
                                id="sortCode" 
                                class="auth-input ${authState.errors.sortCode ? 'error' : ''}"
                                placeholder="80-12-34"
                                value="${signupData.sortCode}"
                                onchange="signupData.sortCode = this.value"
                                maxlength="8"
                            >
                            ${authState.errors.sortCode ? `<span class="error-text">${authState.errors.sortCode}</span>` : ''}
                        </div>
                        
                        <div class="form-group">
                            <label for="accountNumber">Account Number *</label>
                            <input 
                                type="text" 
                                id="accountNumber" 
                                class="auth-input ${authState.errors.accountNumber ? 'error' : ''}"
                                placeholder="12345678"
                                value="${signupData.accountNumber}"
                                onchange="signupData.accountNumber = this.value"
                                maxlength="8"
                            >
                            ${authState.errors.accountNumber ? `<span class="error-text">${authState.errors.accountNumber}</span>` : ''}
                        </div>
                    </div>
                    
                    <div class="auth-buttons">
                        <button class="auth-btn secondary" onclick="showSignupStep2()">
                            &lt; Back
                        </button>
                        <button class="auth-btn success" onclick="handleSignupSubmit()" ${authState.isLoading ? 'disabled' : ''}>
                            ${authState.isLoading ? '<span class="spinner"></span> Creating...' : 'Create Account'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderVerifySignup() {
    return `
        <div class="auth-container">
            <div class="auth-card">
                <div class="auth-header">
                    <img src="https://github.com/connecttraderbrothers/omega.app.icon/blob/main/icon-512x512.png?raw=true" alt="OMEGA" class="auth-logo">
                    <h1 class="auth-title">Verify Your Email</h1>
                    <p class="auth-subtitle">Enter the 6-digit code sent to</p>
                    <p class="auth-email">${authState.email}</p>
                </div>
                
                <div class="auth-content">
                    ${authState.errors.general ? `<div class="auth-error-banner">${authState.errors.general}</div>` : ''}
                    ${authState.errors.success ? `<div class="auth-success-banner">${authState.errors.success}</div>` : ''}
                    
                    <div class="otp-section">
                        <div class="form-group">
                            <input 
                                type="text" 
                                id="otpInput" 
                                class="auth-input otp-input ${authState.errors.otp ? 'error' : ''}"
                                placeholder="000000"
                                maxlength="6"
                                inputmode="numeric"
                                pattern="[0-9]*"
                                oninput="handleOTPInput(this)"
                                ${authState.isLoading ? 'disabled' : ''}
                            >
                            ${authState.errors.otp ? `<span class="error-text">${authState.errors.otp}</span>` : ''}
                        </div>
                        
                        <div class="attempts-info">
                            ${authState.otpAttemptsRemaining} attempt${authState.otpAttemptsRemaining !== 1 ? 's' : ''} remaining
                        </div>
                    </div>
                    
                    ${authState.showResendButton ? `
                        <button class="auth-btn primary" onclick="handleResendCode()" ${authState.isLoading ? 'disabled' : ''}>
                            ${authState.isLoading ? '<span class="spinner"></span> Sending...' : 'Resend Code'}
                        </button>
                    ` : `
                        <button class="auth-btn primary" onclick="handleSignupOTPVerify()" ${authState.isLoading ? 'disabled' : ''}>
                            ${authState.isLoading ? '<span class="spinner"></span> Verifying...' : 'Verify Code'}
                        </button>
                    `}
                    
                    <div class="resend-section">
                        <p>Didn't receive the code?</p>
                        ${!authState.showResendButton ? `
                            <a href="#" onclick="handleResendCode(); return false;">Resend Code</a>
                        ` : ''}
                    </div>
                </div>
                
                <div class="auth-back">
                    <a href="#" onclick="showSignupStep3(); return false;">&lt; Back to Details</a>
                </div>
            </div>
        </div>
    `;
}

function renderVerifyLogin() {
    return `
        <div class="auth-container">
            <div class="auth-card">
                <div class="auth-header">
                    <img src="https://github.com/connecttraderbrothers/omega.app.icon/blob/main/icon-512x512.png?raw=true" alt="OMEGA" class="auth-logo">
                    <h1 class="auth-title">Enter Login Code</h1>
                    <p class="auth-subtitle">Enter the 6-digit code sent to</p>
                    <p class="auth-email">${authState.email}</p>
                </div>
                
                <div class="auth-content">
                    ${authState.errors.general ? `<div class="auth-error-banner">${authState.errors.general}</div>` : ''}
                    ${authState.errors.success ? `<div class="auth-success-banner">${authState.errors.success}</div>` : ''}
                    
                    <div class="otp-section">
                        <div class="form-group">
                            <input 
                                type="text" 
                                id="otpInput" 
                                class="auth-input otp-input ${authState.errors.otp ? 'error' : ''}"
                                placeholder="000000"
                                maxlength="6"
                                inputmode="numeric"
                                pattern="[0-9]*"
                                oninput="handleOTPInput(this)"
                                ${authState.isLoading ? 'disabled' : ''}
                            >
                            ${authState.errors.otp ? `<span class="error-text">${authState.errors.otp}</span>` : ''}
                        </div>
                        
                        <div class="attempts-info">
                            ${authState.otpAttemptsRemaining} attempt${authState.otpAttemptsRemaining !== 1 ? 's' : ''} remaining
                        </div>
                    </div>
                    
                    ${authState.showCreateAccountButton ? `
                        <button class="auth-btn primary" onclick="handleCreateAccountRedirect()">
                            Create Account
                        </button>
                    ` : authState.showResendButton ? `
                        <button class="auth-btn primary" onclick="handleResendCode()" ${authState.isLoading ? 'disabled' : ''}>
                            ${authState.isLoading ? '<span class="spinner"></span> Sending...' : 'Resend Code'}
                        </button>
                    ` : `
                        <button class="auth-btn primary" onclick="handleLoginOTPVerify()" ${authState.isLoading ? 'disabled' : ''}>
                            ${authState.isLoading ? '<span class="spinner"></span> Verifying...' : 'Login'}
                        </button>
                    `}
                    
                    <div class="resend-section">
                        <p>Didn't receive the code?</p>
                        ${!authState.showResendButton && !authState.showCreateAccountButton ? `
                            <a href="#" onclick="handleResendCode(); return false;">Resend Code</a>
                        ` : ''}
                    </div>
                </div>
                
                <div class="auth-back">
                    <a href="#" onclick="showLoginView(); return false;">&lt; Back to Login</a>
                </div>
            </div>
        </div>
    `;
}

// ============================================
// NAVIGATION FUNCTIONS
// ============================================

function showInitialView() {
    authState.currentView = 'initial';
    authState.errors = {};
    renderAuthScreen();
}

function showLoginView() {
    authState.currentView = 'login';
    authState.errors = {};
    authState.flowType = 'login';
    renderAuthScreen();
}

function showSignupStep1() {
    authState.currentView = 'signup-step1';
    authState.signupStep = 1;
    authState.errors = {};
    authState.flowType = 'signup';
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

function handleStep1Next() {
    if (validateStep1()) {
        showSignupStep2();
    }
}

function handleStep2Next() {
    if (validateStep2()) {
        showSignupStep3();
    }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function handleOTPInput(input) {
    // Only allow numbers
    input.value = input.value.replace(/\D/g, '');
    
    // Auto-submit when 6 digits entered
    if (input.value.length === 6) {
        setTimeout(() => {
            if (authState.flowType === 'signup') {
                handleSignupOTPVerify();
            } else {
                handleLoginOTPVerify();
            }
        }, 300);
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
    document.getElementById('logoUpload').value = '';
    renderAuthScreen();
}

function showAuthSuccess(message, callback) {
    const authScreen = document.getElementById('authScreen');
    authScreen.innerHTML = `
        <div class="auth-container">
            <div class="auth-card success-card">
                <div class="success-icon">OK</div>
                <h2>${message}</h2>
                <p>Redirecting to dashboard...</p>
            </div>
        </div>
    `;
    
    setTimeout(callback, 1500);
}

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
// LOGOUT
// ============================================

function logout() {
    // Clear auth state
    authState.isAuthenticated = false;
    authState.userId = '';
    authState.userData = null;
    authState.currentView = 'initial';
    authState.otpAttempts = 0;
    authState.otpAttemptsRemaining = 3;
    authState.showResendButton = false;
    authState.showCreateAccountButton = false;
    
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
            // Fetch fresh data from the database (Webhook #3)
            const result = await webhookGetUserDetails(storedEmail);
            
            if (result.status === 'success' && result.user) {
                authState.isAuthenticated = true;
                authState.userData = result.user;
                authState.userId = result.user.user_id || storedUserId;
                authState.email = storedEmail;
                
                // Update global user data for quotes/invoices
                updateGlobalUserData(result.user);
                
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
