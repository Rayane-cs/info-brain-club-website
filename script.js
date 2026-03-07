
const CONFIG = {
    SUPABASE_URL: 'https://rmmgzviytfpwedstuhly.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtbWd6dml5dGZwd2Vkc3R1aGx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1NzAwNTYsImV4cCI6MjA4ODE0NjA1Nn0.KemNQ3DUcyDwtCL5MZuFmcL-0COiIs2-yyoXxfIZ1P8',
    SCRIPT_URLS: [
        'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js',
        'https://unpkg.com/@supabase/supabase-js@2/dist/umd/supabase.js'
    ],
    REDIRECT_AFTER_LOGIN: '/pages/homepage.html',
    MIN_PASSWORD_LENGTH: 8,
    NOTIFICATION_DURATION: 2500
};

// ==========================================
// ANIMATION UTILITIES
// ==========================================
const Animations = {
    retrigger(element, animationClass = 'animate-in', delay = 10) {
        if (!element) return;
        element.classList.remove(animationClass);
        void element.offsetWidth;
        setTimeout(() => element.classList.add(animationClass), delay);
    },

    fadeInBrandContent(container) {
        const brandContent = container?.querySelector('.brand-content');
        if (brandContent) {
            brandContent.classList.remove('animate-fade');
            setTimeout(() => brandContent.classList.add('animate-fade'), 10);
        }
    },

    switchPage(page) {
        const loginPage = document.getElementById('login-page');
        const registerPage = document.getElementById('register-page');
        const targetPage = page === 'login' ? loginPage : registerPage;
        
        loginPage.style.display = page === 'login' ? 'flex' : 'none';
        registerPage.style.display = page === 'register' ? 'flex' : 'none';

        const brandPanel = targetPage?.querySelector('.brand-panel');
        const formPanel = targetPage?.querySelector('.form-panel');
        
        this.retrigger(brandPanel);
        this.retrigger(formPanel);
        this.fadeInBrandContent(targetPage);
    }
};

// ==========================================
// BUTTON UTILITIES
// ==========================================
const Buttons = {
    setLoading(btn, loadingText = '') {
        if (!btn) return;
        btn.disabled = true;
        btn.classList.add('loading');
        btn.dataset.originalText = btn.textContent;
        btn.textContent = loadingText;
    },

    reset(btn) {
        if (!btn) return;
        btn.disabled = false;
        btn.classList.remove('loading');
        btn.textContent = btn.dataset.originalText || btn.textContent;
    },

    setupPasswordToggle(toggleBtn) {
        if (!toggleBtn) return;
        
        toggleBtn.addEventListener('click', () => {
            const targetId = toggleBtn.dataset.target;
            const input = document.getElementById(targetId);
            if (!input) return;

            const isPassword = input.type === 'password';
            input.type = isPassword ? 'text' : 'password';
            toggleBtn.textContent = isPassword ? '👁️‍🗨️' : '👁️';
        });
    }
};

// ==========================================
// NOTIFICATION SYSTEM
// ==========================================
const Notifications = {
    show(message, type = 'info') {
        const colors = {
            success: '#017f02',
            error: '#dc3545',
            info: '#ff8a02'
        };

        const notif = document.createElement('div');
        notif.className = 'notification';
        notif.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 24px;
            border-radius: 100px;
            background: ${colors[type] || colors.info};
            color: white;
            font-family: system-ui, -apple-system, sans-serif;
            font-size: 14px;
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        notif.textContent = message;
        document.body.appendChild(notif);

        setTimeout(() => {
            notif.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notif.remove(), 300);
        }, CONFIG.NOTIFICATION_DURATION);
    }
};

// ==========================================
// SUPABASE CLIENT MANAGER
// ==========================================
class SupabaseClient {
    constructor() {
        this.client = null;
        this.ready = null;
    }

    async load() {
        if (this.ready) return this.ready;
        if (typeof window.supabase !== 'undefined') {
            this.ready = Promise.resolve();
            return this.ready;
        }

        this.ready = this._tryLoadScripts();
        return this.ready;
    }

    async _tryLoadScripts(index = 0) {
        if (index >= CONFIG.SCRIPT_URLS.length) {
            throw new Error('Could not load Supabase. Check your connection.');
        }

        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = CONFIG.SCRIPT_URLS[index];
            script.crossOrigin = 'anonymous';
            
            script.onload = () => {
                if (typeof window.supabase !== 'undefined') resolve();
                else reject(new Error('Supabase loaded but not ready'));
            };
            
            script.onerror = () => {
                this._tryLoadScripts(index + 1).then(resolve, reject);
            };
            
            document.head.appendChild(script);
        });
    }

    get() {
        if (!this.client) {
            if (typeof window.supabase === 'undefined') {
                throw new Error('Supabase not loaded. Use a local server, not file://');
            }
            this.client = window.supabase.createClient(
                CONFIG.SUPABASE_URL, 
                CONFIG.SUPABASE_ANON_KEY
            );
        }
        return this.client;
    }
}

const supabaseManager = new SupabaseClient();


// ==========================================
// FORM MANAGER - FIXED NAVIGATION
// ==========================================
class FormManager {
    constructor() {
        this.resetEmail = '';
        this.setupEventListeners();
        this.checkRecoveryHash();
    }

    setupEventListeners() {
        // Page navigation
        document.getElementById('show-login-link')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showLogin();
        });
        
        document.getElementById('show-register-link')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showRegister();
        });

        // Forgot password flow - STEP 1: Request reset email
        document.getElementById('forgot-password-link')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showForgotStep(1);
        });
        
        // Back to sign in from step 1
        document.getElementById('cancel-forgot-step1')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.backToSignIn();
        });
        
        // Back to sign in from step 2 (check email)
        document.getElementById('cancel-forgot-step2')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.backToSignIn();
        });
        
        // Send reset code
        document.getElementById('send-code-btn')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleRequestReset();
        });
        
        // Resend code
        document.getElementById('resend-link')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleResendCode();
        });
        
        // Back to sign in from step 3 (set new password) - THE FIX
        document.getElementById('cancel-recovery-link')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.backToSignIn();
        });
        
        // Set new password
        document.getElementById('set-new-password-btn')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleSetNewPassword();
        });

        // Guest mode
        document.getElementById('guest-btn')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleGuestLogin();
        });

        // Role selector
        document.getElementById('role')?.addEventListener('change', (e) => {
            const container = document.getElementById('other-role-container');
            if (container) {
                container.style.display = e.target.value === 'Other' ? 'block' : 'none';
            }
        });

        // Password toggles
        document.querySelectorAll('.toggle-password').forEach(btn => {
            Buttons.setupPasswordToggle(btn);
        });

        // Form submissions
        document.getElementById('register-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegister();
        });
        
        document.getElementById('login-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // Auto-generate username from fullname
        document.getElementById('fullname')?.addEventListener('input', (e) => {
            const usernameField = document.getElementById('username');
            if (usernameField && e.target.value) {
                usernameField.value = e.target.value
                    .toLowerCase()
                    .replace(/\s+/g, '.')
                    .replace(/[^a-z0-9.]/g, '');
            }
        });
    }

    // ==========================================
    // NAVIGATION METHODS - THE KEY FIXES
    // ==========================================
    
    /**
     * Show login page and reset forgot password flow
     */
    showLogin() {
        Animations.switchPage('login');
        this.hideForgotPassword();
        this.clearForms();
    }

    /**
     * Show register page
     */
    showRegister() {
        Animations.switchPage('register');
        this.clearForms();
    }

    /**
     * Universal "Back to Sign In" - works from ANY step
     */
    backToSignIn() {
        // Hide all forgot password steps
        this.hideForgotPassword();
        
        // Show login form
        const loginDefault = document.getElementById('login-default');
        if (loginDefault) {
            loginDefault.classList.remove('hidden');
        }
        
        // Clear any password fields for security
        document.getElementById('login-password') && (document.getElementById('login-password').value = '');
        
        // Clean URL if coming from recovery
        if (window.location.hash.includes('recovery')) {
            if (window.history?.replaceState) {
                window.history.replaceState(null, '', window.location.pathname + window.location.search);
            } else {
                window.location.hash = '';
            }
        }
    }

    /**
     * Show specific forgot password step
     */
    showForgotStep(step) {
        const loginDefault = document.getElementById('login-default');
        const forgotContainer = document.getElementById('forgot-container');
        const step1 = document.getElementById('forgot-step1');
        const step2 = document.getElementById('forgot-step2');
        const step3 = document.getElementById('forgot-step3');

        // Hide login form, show forgot container
        loginDefault?.classList.add('hidden');
        forgotContainer?.classList.remove('hidden');

        // Toggle steps
        step1?.classList.toggle('hidden', step !== 1);
        step2?.classList.toggle('hidden', step !== 2);
        step3?.classList.toggle('hidden', step !== 3);

        // Clear email field when showing step 1
        if (step === 1) {
            const emailInput = document.getElementById('reset-email');
            if (emailInput) emailInput.value = '';
        }
    }

    /**
     * Hide all forgot password UI and reset to login view
     */
    hideForgotPassword() {
        const loginDefault = document.getElementById('login-default');
        const forgotContainer = document.getElementById('forgot-container');
        const step1 = document.getElementById('forgot-step1');
        const step2 = document.getElementById('forgot-step2');
        const step3 = document.getElementById('forgot-step3');

        // Show login, hide forgot container
        loginDefault?.classList.remove('hidden');
        forgotContainer?.classList.add('hidden');

        // Reset all steps to hidden except step 1 for next time
        step1?.classList.remove('hidden');
        step2?.classList.add('hidden');
        step3?.classList.add('hidden');

        // Clear password fields in step 3
        document.getElementById('new-password-input') && (document.getElementById('new-password-input').value = '');
        document.getElementById('confirm-password-input') && (document.getElementById('confirm-password-input').value = '');
    }

    // ==========================================
    // FORM HANDLERS
    // ==========================================
    
    async handleRegister() {
        const btn = document.getElementById('register-submit');
        
        try {
            Buttons.setLoading(btn);

            const userData = {
                fullname: document.getElementById('fullname').value.trim(),
                username: document.getElementById('username').value.trim(),
                email: document.getElementById('email').value.trim(),
                password: document.getElementById('password').value,
                role: document.getElementById('role').value,
                roleCustom: document.getElementById('other-role')?.value.trim()
            };

            await AuthService.register(userData);
            
            Notifications.show('Registered successfully! Please sign in.', 'success');
            setTimeout(() => this.showLogin(), 1200);
            
        } catch (err) {
            Notifications.show(err.message, 'error');
        } finally {
            Buttons.reset(btn);
        }
    }

    async handleLogin() {
        const identifier = document.getElementById('login-identifier').value.trim();
        const password = document.getElementById('login-password').value;

        try {
            await AuthService.login(identifier, password);
            Notifications.show('Login successful!', 'success');
            setTimeout(() => {
                window.location.href = CONFIG.REDIRECT_AFTER_LOGIN;
            }, 200);
        } catch (err) {
            Notifications.show(err.message, 'error');
        }
    }

    async handleRequestReset() {
        const email = document.getElementById('reset-email').value.trim();
        
        try {
            await AuthService.requestPasswordReset(email);
            this.resetEmail = email;
            
            // Show email in step 2
            const display = document.getElementById('reset-email-display');
            if (display) display.innerText = `📧 ${email}`;
            
            this.showForgotStep(2);
            Notifications.show('Check your email for the reset link.', 'success');
        } catch (err) {
            Notifications.show(err.message, 'error');
        }
    }

    async handleResendCode() {
        if (!this.resetEmail) return;
        
        try {
            await AuthService.requestPasswordReset(this.resetEmail);
            Notifications.show('Reset link sent again.', 'success');
        } catch (err) {
            Notifications.show(err.message, 'error');
        }
    }

    async handleSetNewPassword() {
        const newPwd = document.getElementById('new-password-input').value;
        const confirmPwd = document.getElementById('confirm-password-input').value;
        const btn = document.getElementById('set-new-password-btn');

        // Clear errors
        const errNew = document.getElementById('new-password-error');
        const errConfirm = document.getElementById('confirm-password-error');
        if (errNew) {
            errNew.textContent = '';
            errNew.style.display = 'none';
        }
        if (errConfirm) {
            errConfirm.textContent = '';
            errConfirm.style.display = 'none';
        }

        // Validation
        if (newPwd !== confirmPwd) {
            if (errConfirm) {
                errConfirm.textContent = 'Passwords do not match';
                errConfirm.style.display = 'block';
            }
            return;
        }

        try {
            Buttons.setLoading(btn, 'Updating...');
            await AuthService.updatePassword(newPwd);
            
            Notifications.show('Password updated! Please sign in.', 'success');
            
            // Go back to login after successful password change
            setTimeout(() => {
                this.backToSignIn();
            }, 1500);
            
        } catch (err) {
            Notifications.show(err.message, 'error');
            Buttons.reset(btn);
        }
    }

    handleGuestLogin() {
        AuthService.continueAsGuest();
        Notifications.show('You\'re browsing as Guest.', 'success');
        setTimeout(() => {
            window.location.href = CONFIG.REDIRECT_AFTER_LOGIN;
        }, 800);
    }

    // ==========================================
    // HELPERS
    // ==========================================
    
    clearForms() {
        document.querySelectorAll('input, select').forEach(el => {
            el.value = '';
            el.classList.remove('success', 'error');
        });
        
        document.querySelectorAll('.error-message').forEach(msg => {
            msg.style.display = 'none';
            msg.textContent = '';
        });

        const otherRole = document.getElementById('other-role-container');
        if (otherRole) otherRole.style.display = 'none';
    }

    checkRecoveryHash() {
        const hash = window.location.hash || '';
        const isRecovery = hash.includes('type=recovery') || hash.includes('recovery');
        
        if (isRecovery) {
            // Show login page first
            Animations.switchPage('login');
            
            supabaseManager.load()
                .then(() => {
                    supabaseManager.get();
                    // Show step 3 (set new password) directly
                    this.showForgotStep(3);
                })
                .catch(() => {
                    Notifications.show('Could not load. Please try the reset link again.', 'error');
                    this.backToSignIn();
                });
        } else {
            // Normal startup - show login
            this.showLogin();
            if (window.location.hash === '#register') {
                this.showRegister();
            }
        }
    }
}

// ==========================================
// INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    supabaseManager.load().catch(() => {
        // Will show error when user tries to auth
    });
    
    new FormManager();
});