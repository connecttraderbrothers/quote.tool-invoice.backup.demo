// Navigation functions for OMEGA application

// Show splash screen on load and auto-transition to dashboard
window.addEventListener('DOMContentLoaded', function() {
    // Show splash screen
    document.getElementById('splashScreen').style.display = 'flex';
    document.getElementById('dashboardScreen').style.display = 'none';
    document.getElementById('quotationScreen').style.display = 'none';
    
    // Reset body overflow for splash
    document.body.style.overflow = 'hidden';
    
    // Simulate loading and transition to dashboard after 3 seconds
    setTimeout(function() {
        showDashboard();
    }, 3000);
});

// Show dashboard screen
function showDashboard() {
    document.getElementById('splashScreen').style.display = 'none';
    document.getElementById('dashboardScreen').style.display = 'block';
    document.getElementById('quotationScreen').style.display = 'none';
    
    // Enable scrolling for dashboard
    document.body.style.overflow = 'auto';
    document.body.style.overflowX = 'hidden';
    
    // Scroll to top
    window.scrollTo(0, 0);
}

// Show quotation tool screen
function showQuotationTool() {
    document.getElementById('splashScreen').style.display = 'none';
    document.getElementById('dashboardScreen').style.display = 'none';
    document.getElementById('quotationScreen').style.display = 'block';
    
    // Enable scrolling for quotation tool
    document.body.style.overflow = 'auto';
    document.body.style.overflowX = 'hidden';
    
    // Scroll to top
    window.scrollTo(0, 0);
}

// Show splash screen (if needed for refresh/reload)
function showSplash() {
    document.getElementById('splashScreen').style.display = 'flex';
    document.getElementById('dashboardScreen').style.display = 'none';
    document.getElementById('quotationScreen').style.display = 'none';
    
    // Disable scrolling for splash
    document.body.style.overflow = 'hidden';
}
