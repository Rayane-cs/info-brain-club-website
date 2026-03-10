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

const Notifications = {
    show(message, type = 'info') {
        // Use unified notification system if available (utils.js loaded on other pages)
        if (typeof showNotification === 'function') {
            showNotification(message, type);
            return;
        }
        // Standalone fallback for login/register page
        const colors = {
            success: '#006633',
            error:   '#dc2626',
            warning: '#d97706',
            info:    '#1d4ed8'
        };
        const icons = {
            success: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`,
            error:   `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
            warning: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
            info:    `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`
        };
        // Inject styles once
        if (!document.getElementById('_nt_styles_login')) {
            const s = document.createElement('style');
            s.id = '_nt_styles_login';
            s.textContent = `.nt-toast{position:fixed;top:1.5rem;right:1.5rem;display:flex;align-items:center;gap:.75rem;padding:.875rem 1.25rem;border-radius:.875rem;font-family:'Plus Jakarta Sans',system-ui,sans-serif;font-size:.9rem;font-weight:500;color:#fff;min-width:17rem;max-width:27rem;z-index:99999;box-shadow:0 8px 32px rgba(0,0,0,.25);animation:ntIn .35s cubic-bezier(.34,1.56,.64,1) forwards}.nt-toast .nt-close{margin-left:auto;background:none;border:none;color:#fff;opacity:.7;cursor:pointer;padding:0;line-height:1;font-size:1.1rem}.nt-toast .nt-close:hover{opacity:1}@keyframes ntIn{from{opacity:0;transform:translateX(2rem)}to{opacity:1;transform:translateX(0)}}@keyframes ntOut{from{opacity:1;transform:translateX(0)}to{opacity:0;transform:translateX(2rem)}}@media(max-width:48rem){.nt-toast{top:auto;bottom:5rem;right:1rem;left:1rem;min-width:auto;max-width:none}@keyframes ntIn{from{opacity:0;transform:translateY(1.25rem)}to{opacity:1;transform:translateY(0)}}@keyframes ntOut{from{opacity:1;transform:translateY(0)}to{opacity:0;transform:translateY(1.25rem)}}}`;
            document.head.appendChild(s);
        }
        // Remove existing toasts
        document.querySelectorAll('.nt-toast').forEach(n => n.remove());
        const bg = colors[type] || colors.info;
        const icon = icons[type] || icons.info;
        const toast = document.createElement('div');
        toast.className = 'nt-toast';
        toast.style.background = bg;
        const safeMsg = String(message).replace(/</g,'&lt;').replace(/>/g,'&gt;');
        toast.innerHTML = `<span>${icon}</span><span>${safeMsg}</span><button class="nt-close" aria-label="Close">✕</button>`;
        toast.querySelector('.nt-close').onclick = () => {
            toast.style.animation = 'ntOut .3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        };
        document.body.appendChild(toast);
        setTimeout(() => {
            if (!toast.parentElement) return;
            toast.style.animation = 'ntOut .3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }, CONFIG.NOTIFICATION_DURATION);
    }
};

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
        if (index >= CONFIG.SCRIPT_URLS.length) throw new Error('Could not load Supabase. Check your connection.');
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = CONFIG.SCRIPT_URLS[index];
            script.crossOrigin = 'anonymous';
            script.onload = () => { if (typeof window.supabase !== 'undefined') resolve(); else reject(new Error('Supabase loaded but not ready')); };
            script.onerror = () => { this._tryLoadScripts(index + 1).then(resolve, reject); };
            document.head.appendChild(script);
        });
    }

    get() {
        if (!this.client) {
            if (typeof window.supabase === 'undefined') throw new Error('Supabase not loaded. Use a local server, not file://');
            this.client = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
        }
        return this.client;
    }
}

const supabaseManager = new SupabaseClient();

class FormManager {
    constructor() {
        this.resetEmail = '';
        this.setupEventListeners();
        this.checkRecoveryHash();
    }

    setupEventListeners() {
        document.getElementById('show-login-link')?.addEventListener('click', (e) => { e.preventDefault(); this.showLogin(); });
        document.getElementById('show-register-link')?.addEventListener('click', (e) => { e.preventDefault(); this.showRegister(); });
        document.getElementById('forgot-password-link')?.addEventListener('click', (e) => { e.preventDefault(); this.showForgotStep(1); });
        document.getElementById('cancel-forgot-step1')?.addEventListener('click', (e) => { e.preventDefault(); this.backToSignIn(); });
        document.getElementById('cancel-forgot-step2')?.addEventListener('click', (e) => { e.preventDefault(); this.backToSignIn(); });
        document.getElementById('send-code-btn')?.addEventListener('click', (e) => { e.preventDefault(); this.handleRequestReset(); });
        document.getElementById('resend-link')?.addEventListener('click', (e) => { e.preventDefault(); this.handleResendCode(); });
        document.getElementById('cancel-recovery-link')?.addEventListener('click', (e) => { e.preventDefault(); this.backToSignIn(); });
        document.getElementById('set-new-password-btn')?.addEventListener('click', (e) => { e.preventDefault(); this.handleSetNewPassword(); });
        document.getElementById('guest-btn')?.addEventListener('click', (e) => { e.preventDefault(); this.handleGuestLogin(); });

        document.getElementById('role')?.addEventListener('change', (e) => {
            const container = document.getElementById('other-role-container');
            if (container) container.style.display = e.target.value === 'Other' ? 'block' : 'none';
        });

        document.querySelectorAll('.toggle-password').forEach(btn => Buttons.setupPasswordToggle(btn));

        document.getElementById('register-form')?.addEventListener('submit', (e) => { e.preventDefault(); this.handleRegister(); });
        document.getElementById('login-form')?.addEventListener('submit', (e) => { e.preventDefault(); this.handleLogin(); });

        document.getElementById('fullname')?.addEventListener('input', (e) => {
            const usernameField = document.getElementById('username');
            if (usernameField && e.target.value) {
                usernameField.value = e.target.value.toLowerCase().replace(/\s+/g, '.').replace(/[^a-z0-9.]/g, '');
            }
        });
    }

    showLogin() { Animations.switchPage('login'); this.hideForgotPassword(); this.clearForms(); }
    showRegister() { Animations.switchPage('register'); this.clearForms(); }

    backToSignIn() {
        this.hideForgotPassword();
        document.getElementById('login-default')?.classList.remove('hidden');
        const lp = document.getElementById('login-password');
        if (lp) lp.value = '';
        if (window.location.hash.includes('recovery')) {
            window.history?.replaceState ? window.history.replaceState(null, '', window.location.pathname + window.location.search) : (window.location.hash = '');
        }
    }

    showForgotStep(step) {
        document.getElementById('login-default')?.classList.add('hidden');
        document.getElementById('forgot-container')?.classList.remove('hidden');
        document.getElementById('forgot-step1')?.classList.toggle('hidden', step !== 1);
        document.getElementById('forgot-step2')?.classList.toggle('hidden', step !== 2);
        document.getElementById('forgot-step3')?.classList.toggle('hidden', step !== 3);
        if (step === 1) { const e = document.getElementById('reset-email'); if (e) e.value = ''; }
    }

    hideForgotPassword() {
        document.getElementById('login-default')?.classList.remove('hidden');
        document.getElementById('forgot-container')?.classList.add('hidden');
        document.getElementById('forgot-step1')?.classList.remove('hidden');
        document.getElementById('forgot-step2')?.classList.add('hidden');
        document.getElementById('forgot-step3')?.classList.add('hidden');
        const np = document.getElementById('new-password-input'); if (np) np.value = '';
        const cp = document.getElementById('confirm-password-input'); if (cp) cp.value = '';
    }

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
            setTimeout(() => { window.location.href = CONFIG.REDIRECT_AFTER_LOGIN; }, 200);
        } catch (err) {
            Notifications.show(err.message, 'error');
        }
    }

    async handleRequestReset() {
        const email = document.getElementById('reset-email').value.trim();
        try {
            await AuthService.requestPasswordReset(email);
            this.resetEmail = email;
            const display = document.getElementById('reset-email-display');
            if (display) display.innerText = `📧 ${email}`;
            this.showForgotStep(2);
            Notifications.show('Check your email for the reset link.', 'success');
        } catch (err) { Notifications.show(err.message, 'error'); }
    }

    async handleResendCode() {
        if (!this.resetEmail) return;
        try {
            await AuthService.requestPasswordReset(this.resetEmail);
            Notifications.show('Reset link sent again.', 'success');
        } catch (err) { Notifications.show(err.message, 'error'); }
    }

    async handleSetNewPassword() {
        const newPwd = document.getElementById('new-password-input').value;
        const confirmPwd = document.getElementById('confirm-password-input').value;
        const btn = document.getElementById('set-new-password-btn');
        const errNew = document.getElementById('new-password-error');
        const errConfirm = document.getElementById('confirm-password-error');

        if (errNew) { errNew.textContent = ''; errNew.style.display = 'none'; }
        if (errConfirm) { errConfirm.textContent = ''; errConfirm.style.display = 'none'; }

        if (newPwd !== confirmPwd) {
            if (errConfirm) { errConfirm.textContent = 'Passwords do not match'; errConfirm.style.display = 'block'; }
            return;
        }
        try {
            Buttons.setLoading(btn, 'Updating...');
            await AuthService.updatePassword(newPwd);
            Notifications.show('Password updated! Please sign in.', 'success');
            setTimeout(() => { this.backToSignIn(); }, 1500);
        } catch (err) {
            Notifications.show(err.message, 'error');
            Buttons.reset(btn);
        }
    }

    handleGuestLogin() {
        AuthService.continueAsGuest();
        Notifications.show("You're browsing as Guest.", 'success');
        setTimeout(() => { window.location.href = CONFIG.REDIRECT_AFTER_LOGIN; }, 800);
    }

    clearForms() {
        document.querySelectorAll('input, select').forEach(el => { el.value = ''; el.classList.remove('success', 'error'); });
        document.querySelectorAll('.error-message').forEach(msg => { msg.style.display = 'none'; msg.textContent = ''; });
        const otherRole = document.getElementById('other-role-container');
        if (otherRole) otherRole.style.display = 'none';
    }

    checkRecoveryHash() {
        const hash = window.location.hash || '';
        const isRecovery = hash.includes('type=recovery') || hash.includes('recovery');
        if (isRecovery) {
            Animations.switchPage('login');
            supabaseManager.load().then(() => { supabaseManager.get(); this.showForgotStep(3); })
                .catch(() => { Notifications.show('Could not load. Please try the reset link again.', 'error'); this.backToSignIn(); });
        } else {
            this.showLogin();
            if (window.location.hash === '#register') this.showRegister();
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    supabaseManager.load().catch(() => {});
    new FormManager();
});