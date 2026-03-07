const CONFIG = {
    SUPABASE_URL: 'https://rmmgzviytfpwedstuhly.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtbWd6dml5dGZwd2Vkc3R1aGx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1NzAwNTYsImV4cCI6MjA4ODE0NjA1Nn0.KemNQ3DUcyDwtCL5MZuFmcL-0COiIs2-yyoXxfIZ1P8',
    SCRIPT_URLS: [
        'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js',
        'https://unpkg.com/@supabase/supabase-js@2/dist/umd/supabase.js'
    ]
};

let supabaseClient = null;
let supabaseReady = null;
function loadSupabaseScript() {
    if (supabaseReady !== null) return supabaseReady;
    if (typeof window.supabase !== 'undefined') {
        supabaseReady = Promise.resolve();
        return supabaseReady;
    }
    
    let tryIndex = 0;
    function tryLoad() {
        return new Promise((resolve, reject) => {
            if (tryIndex >= CONFIG.SCRIPT_URLS.length) {
                reject(new Error('Could not load Supabase library'));
                return;
            }
            const url = CONFIG.SCRIPT_URLS[tryIndex];
            const script = document.createElement('script');
            script.src = url;
            script.crossOrigin = 'anonymous';
            script.async = false;
            script.onload = () => {
                if (typeof window.supabase !== 'undefined') resolve();
                else reject(new Error('Supabase loaded but not ready'));
            };
            script.onerror = () => {
                tryIndex++;
                tryLoad().then(resolve, reject);
            };
            document.head.appendChild(script);
        });
    }
    
    supabaseReady = tryLoad();
    return supabaseReady;
}

async function getSupabaseClient() {
    await loadSupabaseScript();
    if (!supabaseClient && window.supabase) {
        supabaseClient = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
    }
    return supabaseClient;
}

async function isUserAdmin() {
    try {
        const client = await getSupabaseClient();

        const { data: { user }, error: userError } = await client.auth.getUser();
        if (userError || !user) return false;
        const { data, error } = await client
            .from('users')
            .select('is_admin')
            .eq('id', user.id)
            .single();
        if (error) throw error;
        return data?.is_admin === true;
    } catch (e) {
        console.error('Error checking admin status:', e);
        return false;
    }
}

async function isUserGuest() {
    const client = await getSupabaseClient();
    const { data: { user }, error: userError } = await client.auth.getUser();
    if (userError || !user) return false;
    return user.guest === true;
}

async function redirectIfNotAdmin() {
    const isAdmin = await isUserAdmin();
    if (!isAdmin) {
        showNotification('Access Denied: Admin only', 'error');
        setTimeout(() => {
            window.location.href = '/pages/homepage.html';
        }, 1500);
        return false;
    }
    return true;
}

async function redirectIfGuest() {
    const client = await getSupabaseClient();
    const { data: { user }, error: userError } = await client.auth.getUser();
    if (userError || !user) return false;
    if (user.guest) {
        showNotification('You must have an account first', 'warning');
        setTimeout(() => {
            window.location.href = '/index.html';
        }, 2000);
        return false;
    }
    return true;
}

function showNotification(message, type = 'info', duration = 3500) {
    document.querySelectorAll('.notification-toast').forEach(n => n.remove());

    const icons = {
        success: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`,
        error:   `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
        warning: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
        info:    `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`
    };

    const colors = {
        success: { bg: '#006633', bar: '#00994d' },
        error:   { bg: '#dc2626', bar: '#ef4444' },
        warning: { bg: '#d97706', bar: '#f59e0b' },
        info:    { bg: '#1d4ed8', bar: '#3b82f6' }
    };

    const c = colors[type] || colors.info;
    const icon = icons[type] || icons.info;

    const toast = document.createElement('div');
    toast.className = 'notification-toast';
    toast.innerHTML = `
        <span class="nt-message">${escapeHtml(message)}</span>
    `;

    if (!document.getElementById('notification-toast-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-toast-styles';
        style.textContent = `
            .notification-toast {
                position: fixed;
                bottom: 28px;
                left: 50%;
                transform: translateX(-50%) translateY(20px);
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 14px 18px;
                border-radius: 14px;
                font-family: 'Inter', sans-serif;
                font-size: 0.9rem;
                font-weight: 500;
                color: #fff;
                min-width: 280px;
                max-width: 440px;
                z-index: 99999;
                box-shadow: 0 12px 40px rgba(0,0,0,0.25);
                overflow: hidden;
                animation: ntSlideUp 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
            }
            @keyframes ntSlideUp {
                from { opacity: 0; transform: translateX(-50%) translateY(30px); }
                to   { opacity: 1; transform: translateX(-50%) translateY(0); }
            }
            @keyframes ntSlideDown {
                from { opacity: 1; transform: translateX(-50%) translateY(0); }
                to   { opacity: 0; transform: translateX(-50%) translateY(20px); }
            }
            @media (max-width: 480px) {
                .notification-toast {
                    left: 16px;
                    right: 16px;
                    transform: translateX(0) translateY(20px);
                    min-width: auto;
                    max-width: none;
                    bottom: 80px;
                }
                @keyframes ntSlideUp {
                    from { opacity: 0; transform: translateY(30px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes ntSlideDown {
                    from { opacity: 1; transform: translateY(0); }
                    to   { opacity: 0; transform: translateY(20px); }
                }
            }
        `;
        document.head.appendChild(style);
    }

    toast.style.background = c.bg;

    document.body.appendChild(toast);

    setTimeout(() => {
        if (toast.parentElement) {
            toast.style.animation = 'ntSlideDown 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }
    }, duration);
}

function getAvatarUrl(user) {
    if (!user) return getDefaultAvatarUrl('User');
    
    if (user.avatar_url && user.avatar_url.trim() !== '') {
        return user.avatar_url;
    }
    
    return getDefaultAvatarUrl(user.full_name || user.email || 'User');
}

function hasCustomAvatar(user) {
    return !!(user?.avatar_url && user.avatar_url.trim() !== '');
}

function getInitials(name) {
    if (!name) return 'U';
    return name
        .split(' ')
        .map(word => word.charAt(0))
        .join('')
        .toUpperCase()
        .substring(0, 2);
}


async function getUserById(userId) {
    if (!userId) return null;
    const client = await getSupabaseClient();
    const { data } = await client.from('users').select('*').eq('id', userId).single();
    return data;
}

async function getAllUsers() {
    const client = await getSupabaseClient();
    const { data } = await client.from('users').select('*').order('created_at', { ascending: false });
    return data || [];
}

async function updateUserProfile(userId, updates) {
    if (!userId) return { error: new Error('User ID missing') };
    const client = await getSupabaseClient();
    return await client.from('users').update(updates).eq('id', userId).select().single();
}

async function deleteUser(userId) {
    if (!userId) return { error: new Error('User ID missing') };
    const client = await getSupabaseClient();
    return await client.from('users').delete().eq('id', userId);
}

async function toggleUserAdmin(userId, isAdmin) {
    if (!userId) return { error: new Error('User ID missing') };
    const client = await getSupabaseClient();
    return await client.from('users').update({ is_admin: isAdmin }).eq('id', userId).select().single();
}



function formatDate(dateString, options = {}) {
    if (!dateString) return 'Unknown';
    const defaultOptions = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        ...options 
    };
    try {
        return new Date(dateString).toLocaleDateString('en-US', defaultOptions);
    } catch (e) {
        return 'date missing';
    }
}

function escapeHtml(text) {
    if (typeof text !== 'string') return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function getInitials(name) {
    if (!name) return 'U';
    return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}
