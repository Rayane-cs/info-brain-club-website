// ==========================================
// NAVBAR COMPONENT - Enhanced Profile Dropdown
// ==========================================

class NavbarManager {
    constructor() {
        this.currentUser = null;
        this.dropdownOpen = false;
    }

    async init() {
        // Resolve current user from utils.js if available, otherwise from localStorage
        let user = null;
        if (typeof getCurrentUser === 'function') {
            try {
                user = getCurrentUser();
            } catch (e) {
                user = null;
            }
        }

        if (!user) {
            try {
                const raw = window.localStorage ? localStorage.getItem('currentUser') : null;
                user = raw ? JSON.parse(raw) : null;
            } catch (e) {
                user = null;
            }
        }

        // Normalize empty objects to null
        if (user && typeof user === 'object' && Object.keys(user).length === 0) {
            user = null;
        }

        this.currentUser = user;

        // Render immediately
        this.render();
        this.setupEventListeners();
        this.setupMobileMenu();
        
        // Update the dynamic nav link
        this.updateDynamicNavLink();
    }

    async updateDynamicNavLink() {
        const dynamicLink = document.getElementById('dynamic-nav-link');
        if (!dynamicLink) return;

        // If not logged in, just leave it as Profile or maybe hide it? 
        // We'll leave it as Profile, they'll be redirected if they click it.
        if (!this.currentUser || this.currentUser.guest) return;

        // Check if user is admin
        if (typeof isUserAdmin === 'function') {
            const isAdmin = await isUserAdmin();
            if (isAdmin) {
                dynamicLink.textContent = 'Admin';
                dynamicLink.href = '/pages/admin.html';
                
                // If they are on the admin page, keep the active class correct
                if (window.location.pathname.includes('/pages/admin.html')) {
                    dynamicLink.classList.add('active');
                }
            }
        }
    }

    render() {
        const container = document.getElementById('header-actions');
        if (!container) return;

        // Guest or no user - show sign in button (no profile pic)
        if (!this.currentUser || this.currentUser.guest) {
            container.innerHTML = `
                <a href="/index.html" class="nav-auth-btn">
                    <span>Sign In</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                        <polyline points="10 17 15 12 10 7"/>
                        <line x1="15" y1="12" x2="3" y2="12"/>
                    </svg>
                </a>
            `;
            return;
        }

        // Logged-in user - show Sign Out only (profile and admin pages removed)
        container.innerHTML = `
            <button class="nav-auth-btn" id="logoutBtn">
                <span>Sign Out</span>
            </button>
        `;
    }

    setupEventListeners() {
        const trigger = document.getElementById('profileTrigger');
        if (trigger) {
            trigger.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.toggleDropdown();
            });
        }

        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.handleLogout();
            });
        }

        document.addEventListener('click', (e) => {
            if (this.dropdownOpen && !e.target.closest('.profile-dropdown-container')) {
                this.closeDropdown();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.dropdownOpen) {
                this.closeDropdown();
            }
        });
    }

    setupMobileMenu() {
        const navToggle = document.querySelector('.nav-toggle');
        const navLinks = document.querySelector('.nav-links');
        
        if (navToggle && navLinks) {
            navToggle.addEventListener('click', () => {
                const isOpen = navLinks.classList.toggle('active');
                navToggle.setAttribute('aria-expanded', isOpen);
                document.body.classList.toggle('nav-open', isOpen);
            });

            navLinks.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', () => {
                    navLinks.classList.remove('active');
                    navToggle.setAttribute('aria-expanded', 'false');
                    document.body.classList.remove('nav-open');
                });
            });
        }
    }

    toggleDropdown() {
        const dropdown = document.getElementById('profileDropdown');
        const trigger = document.getElementById('profileTrigger');
        const chevron = document.querySelector('.dropdown-chevron');
        
        if (!dropdown) return;

        this.dropdownOpen = !this.dropdownOpen;
        
        if (this.dropdownOpen) {
            dropdown.classList.remove('hidden');
            trigger.setAttribute('aria-expanded', 'true');
            chevron?.classList.add('rotate');
            
            const items = dropdown.querySelectorAll('.dropdown-item');
            items.forEach((item, index) => {
                item.style.animation = `slideInItem 0.2s ease ${index * 0.05}s backwards`;
            });
        } else {
            this.closeDropdown();
        }
    }

    closeDropdown() {
        const dropdown = document.getElementById('profileDropdown');
        const trigger = document.getElementById('profileTrigger');
        const chevron = document.querySelector('.dropdown-chevron');
        
        this.dropdownOpen = false;
        dropdown?.classList.add('hidden');
        trigger?.setAttribute('aria-expanded', 'false');
        chevron?.classList.remove('rotate');
    }

    async handleLogout() {
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.innerHTML = `
                <svg class="spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10" stroke-dasharray="60" stroke-dashoffset="20"/>
                </svg>
                <span>Signing out...</span>
            `;
        }

        // Try to sign out from Supabase if the helper exists
        if (typeof getSupabaseClient === 'function') {
            try {
                const client = await getSupabaseClient();
                await client.auth.signOut();
            } catch (e) {
                console.error('Logout error:', e);
            }
        }

        // Always clear local user and redirect
        try {
            if (typeof setCurrentUser === 'function') {
                setCurrentUser(null);
            } else if (window.localStorage) {
                localStorage.removeItem('currentUser');
            }
        } catch (e) {
            console.error('Error clearing user from storage:', e);
        }

        if (typeof showNotification === 'function') {
            showNotification('Logged out successfully', 'success');
        }

        setTimeout(() => {
            window.location.href = '/index.html';
        }, 400);
    }

    async refresh() {
        await this.init();
    }
}

// Initialize navbar on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    window.navbarManager = new NavbarManager();
    window.navbarManager.init();
});

