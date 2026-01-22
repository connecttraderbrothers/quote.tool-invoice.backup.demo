// Navigation functions for OMEGA application
// Updated with authentication integration

// Show splash screen on load
window.addEventListener('DOMContentLoaded', function() {
    // Show splash screen first
    document.getElementById('splashScreen').style.display = 'flex';
    document.getElementById('authScreen').style.display = 'none';
    document.getElementById('dashboardScreen').style.display = 'none';
    document.getElementById('quotationScreen').style.display = 'none';
    document.getElementById('invoiceScreen').style.display = 'none';
    
    // Reset body overflow for splash
    document.body.style.overflow = 'hidden';
});

// Enter The Matrix button function - now goes to auth
function enterMatrix() {
    const splashScreen = document.getElementById('splashScreen');
    const authScreen = document.getElementById('authScreen');
    const dashboardScreen = document.getElementById('dashboardScreen');
    const canvas = document.getElementById('matrix');
    
    // Add fade-out class to splash screen
    splashScreen.classList.add('fade-out');
    
    // After fade-out animation completes
    setTimeout(async function() {
        splashScreen.style.display = 'none';
        
        // Show a loading state while checking auth
        authScreen.style.display = 'block';
        authScreen.style.opacity = '1';
        authScreen.innerHTML = '<div style="display: flex; justify-content: center; align-items: center; height: 100vh; background: #1a1a1a;"><div style="text-align: center; color: white;"><div class="auth-spinner" style="width: 40px; height: 40px; border: 3px solid rgba(251,191,36,0.3); border-top-color: #fbbf24; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px;"></div><p style="color: #fbbf24;">Loading your account...</p></div></div><style>@keyframes spin { to { transform: rotate(360deg); } }</style>';
        
        // Check if user is already authenticated (now async - fetches from database)
        const isLoggedIn = await initAuth();
        
        if (isLoggedIn) {
            // User is logged in - go straight to dashboard
            authScreen.style.display = 'none';
            dashboardScreen.style.display = 'block';
            dashboardScreen.style.opacity = '0';
            
            setTimeout(function() {
                dashboardScreen.style.transition = 'opacity 0.8s ease-in';
                dashboardScreen.style.opacity = '1';
            }, 50);
            
            // Update dashboard header with user info
            updateDashboardHeader();
        } else {
            // User needs to log in - show auth screen
            authScreen.style.display = 'block';
            authScreen.style.opacity = '0';
            
            setTimeout(function() {
                authScreen.style.transition = 'opacity 0.8s ease-in';
                authScreen.style.opacity = '1';
            }, 50);
            
            // Render auth UI
            renderAuthScreen();
        }
        
        // Hide matrix canvas
        if (canvas) {
            canvas.style.transition = 'opacity 0.8s ease-out';
            canvas.style.opacity = '0';
            setTimeout(function() {
                canvas.style.display = 'none';
            }, 800);
        }
        
        // Enable scrolling
        document.body.style.overflow = 'auto';
        document.body.style.overflowX = 'hidden';
        
        // Scroll to top
        window.scrollTo(0, 0);
    }, 800);
}

// Update dashboard header with user info
function updateDashboardHeader() {
    const userData = window.omegaUserData;
    if (!userData) return;
    
    // Update welcome section
    const welcomeTitle = document.querySelector('.welcome-title');
    const welcomeText = document.querySelector('.welcome-text');
    
    if (welcomeTitle && userData.companyName) {
        const firstName = userData.companyName.split(' ')[0];
        welcomeTitle.textContent = `Welcome, ${firstName}!`;
    }
    
    // Add user menu to header if not exists
    addUserMenuToHeader();
}

// Add user menu to dashboard header
function addUserMenuToHeader() {
    const dashboardHeader = document.querySelector('.dashboard-header');
    if (!dashboardHeader) return;
    
    // Check if user menu already exists
    if (document.querySelector('.user-menu')) return;
    
    const userData = window.omegaUserData;
    const userInitials = userData && userData.companyName 
        ? userData.companyName.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()
        : 'U';
    
    const userMenu = document.createElement('div');
    userMenu.className = 'user-menu';
    userMenu.innerHTML = `
        <button class="user-menu-btn" onclick="toggleUserMenu()">
            ${userData && userData.logo 
                ? `<img src="${userData.logo}" alt="Logo" class="user-avatar-img">`
                : `<span class="user-avatar">${userInitials}</span>`
            }
            <svg class="dropdown-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 12 15 18 9"/>
            </svg>
        </button>
        <div class="user-dropdown" id="userDropdown">
            <div class="dropdown-header">
                <strong>${userData ? userData.companyName : 'User'}</strong>
                <span>${userData ? userData.businessEmail : ''}</span>
            </div>
            <div class="dropdown-divider"></div>
            <button class="dropdown-item" onclick="showProfile()">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                </svg>
                Profile
            </button>
            <button class="dropdown-item" onclick="showSettings()">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                </svg>
                Settings
            </button>
            <div class="dropdown-divider"></div>
            <button class="dropdown-item logout" onclick="handleLogout()">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                    <polyline points="16 17 21 12 16 7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Logout
            </button>
        </div>
    `;
    
    dashboardHeader.appendChild(userMenu);
}

// Toggle user dropdown menu
function toggleUserMenu() {
    const dropdown = document.getElementById('userDropdown');
    if (dropdown) {
        dropdown.classList.toggle('show');
    }
}

// Close dropdown when clicking outside
document.addEventListener('click', function(e) {
    if (!e.target.closest('.user-menu')) {
        const dropdown = document.getElementById('userDropdown');
        if (dropdown) {
            dropdown.classList.remove('show');
        }
    }
});

// Show profile (placeholder - can expand later)
function showProfile() {
    toggleUserMenu();
    alert('Profile settings coming soon!');
}

// Show settings (placeholder - can expand later)
function showSettings() {
    toggleUserMenu();
    alert('Settings coming soon!');
}

// Handle logout
function handleLogout() {
    toggleUserMenu();
    if (confirm('Are you sure you want to logout?')) {
        logout(); // Call auth.js logout function
    }
}

// Show dashboard screen
function showDashboard() {
    const canvas = document.getElementById('matrix');
    
    document.getElementById('splashScreen').style.display = 'none';
    document.getElementById('authScreen').style.display = 'none';
    document.getElementById('dashboardScreen').style.display = 'block';
    document.getElementById('quotationScreen').style.display = 'none';
    document.getElementById('invoiceScreen').style.display = 'none';
    
    // Hide matrix canvas
    if (canvas) {
        canvas.style.display = 'none';
    }
    
    // Update header with user info
    updateDashboardHeader();
    
    // Enable scrolling for dashboard
    document.body.style.overflow = 'auto';
    document.body.style.overflowX = 'hidden';
    
    // Scroll to top
    window.scrollTo(0, 0);
}

// Show quotation tool screen
function showQuotationTool() {
    const canvas = document.getElementById('matrix');
    
    document.getElementById('splashScreen').style.display = 'none';
    document.getElementById('authScreen').style.display = 'none';
    document.getElementById('dashboardScreen').style.display = 'none';
    document.getElementById('quotationScreen').style.display = 'block';
    document.getElementById('invoiceScreen').style.display = 'none';
    
    // Hide matrix canvas
    if (canvas) {
        canvas.style.display = 'none';
    }
    
    // Enable scrolling for quotation tool
    document.body.style.overflow = 'auto';
    document.body.style.overflowX = 'hidden';
    
    // Scroll to top
    window.scrollTo(0, 0);
}

// Show invoice tool screen
function showInvoiceTool() {
    const canvas = document.getElementById('matrix');
    
    document.getElementById('splashScreen').style.display = 'none';
    document.getElementById('authScreen').style.display = 'none';
    document.getElementById('dashboardScreen').style.display = 'none';
    document.getElementById('quotationScreen').style.display = 'none';
    document.getElementById('invoiceScreen').style.display = 'block';
    
    // Hide matrix canvas
    if (canvas) {
        canvas.style.display = 'none';
    }
    
    // Enable scrolling for invoice tool
    document.body.style.overflow = 'auto';
    document.body.style.overflowX = 'hidden';
    
    // Scroll to top
    window.scrollTo(0, 0);
}

// Show splash screen (if needed for refresh/reload)
function showSplash() {
    const canvas = document.getElementById('matrix');
    
    document.getElementById('splashScreen').style.display = 'flex';
    document.getElementById('authScreen').style.display = 'none';
    document.getElementById('dashboardScreen').style.display = 'none';
    document.getElementById('quotationScreen').style.display = 'none';
    document.getElementById('invoiceScreen').style.display = 'none';
    
    // Show matrix canvas
    if (canvas) {
        canvas.style.display = 'block';
        canvas.style.opacity = '1';
    }
    
    // Disable scrolling for splash
    document.body.style.overflow = 'hidden';
}
