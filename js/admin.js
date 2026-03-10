/**
 * Admin Dashboard — fetches real data from Supabase
 * Requires: utils.js (getSupabaseClient, showNotification, etc.)
 */

/** Store all users for client-side search filtering */
let _allUsersCache = [];

document.addEventListener('DOMContentLoaded', async () => {
    // Guard: must be logged-in admin
    const isGuest = await isUserGuest();
    const isAdmin = await isUserAdmin();

    if (isGuest || !isAdmin) {
        showNotification('Unauthorized access', 'error');
        setTimeout(() => { window.location.href = '/pages/profile.html'; }, 1500);
        return;
    }

    // Load data in parallel for performance
    await Promise.all([
        loadUsers(),
        loadAndRenderEvents()
    ]);
});

/* ─────────────────────────────────────────
   USERS
───────────────────────────────────────── */
async function loadUsers() {
    try {
        const client = await getSupabaseClient();
        const { data, error } = await client
            .from('users')
            .select('id,full_name,username,email,role,is_admin,is_guest,avatar_url,created_at')
            .order('created_at', { ascending: false });

        if (error) throw error;

        _allUsersCache = data || [];
        _updateStats(_allUsersCache);
        _renderUsersTable(_allUsersCache);
        _setupUserSearch();

    } catch (err) {
        console.error('Failed to load users:', err);
        const tb = document.getElementById('adminUsersTableBody');
        if (tb) tb.innerHTML = '<tr><td colspan="6" class="text-center">Failed to load users.</td></tr>';
        showNotification('Failed to load users', 'error');
    }
}

function _updateStats(users) {
    const adminsCount = users.filter(u => u.is_admin).length;
    const guestsCount = users.filter(u => u.is_guest).length;

    const setStat = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    };

    setStat('stat-users', users.length);
    setStat('stat-admins', adminsCount);
    setStat('stat-guests', guestsCount);
    // stat-events is set separately after events load
}

function _renderUsersTable(users) {
    const tableBody = document.getElementById('adminUsersTableBody');
    if (!tableBody) return;

    if (!users || users.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center">No users found.</td></tr>';
        return;
    }

    tableBody.innerHTML = users.map(user => {
        const roleName  = user.is_admin ? 'Admin' : (user.role || (user.is_guest ? 'Guest' : 'Member'));
        const roleClass = user.is_admin ? 'role-admin' : (user.is_guest ? 'role-guest' : 'role-user');
        const adminBadge = user.is_admin
            ? '<span class="role-badge badge-yes">Yes</span>'
            : '<span class="role-badge badge-no">No</span>';

        // Avatar: show image if avatar_url, else initials
        const initials = getInitials(user.full_name || user.email);
        const avatarInner = (user.avatar_url && user.avatar_url.trim())
            ? `<img src="${escapeHtml(user.avatar_url)}" alt="${escapeHtml(initials)}" loading="lazy" onerror="this.parentElement.textContent='${initials}'">`
            : initials;

        const adminBtnText  = user.is_admin ? 'Remove Admin' : 'Make Admin';
        const adminBtnClass = user.is_admin ? 'btn btn-secondary btn-sm' : 'btn btn-primary btn-sm';

        return `
            <tr>
                <td>
                    <div class="user-cell">
                        <div class="user-avatar-small">${avatarInner}</div>
                        <div>
                            <strong>${escapeHtml(user.full_name || 'Unknown')}</strong>
                            ${user.username ? `<br><small style="color:var(--text-muted)">@${escapeHtml(user.username)}</small>` : ''}
                        </div>
                    </div>
                </td>
                <td>${escapeHtml(user.email || 'N/A')}</td>
                <td><span class="role-badge ${roleClass}">${escapeHtml(roleName)}</span></td>
                <td>${adminBadge}</td>
                <td>${formatDate(user.created_at)}</td>
                <td>
                    <div class="action-btns">
                        <button class="${adminBtnClass} toggle-admin-btn"
                            data-id="${user.id}"
                            data-isadmin="${user.is_admin}">
                            ${adminBtnText}
                        </button>
                        <button class="btn-danger delete-user-btn" data-id="${user.id}">
                            Delete
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    _attachUserActionListeners();
}

function _setupUserSearch() {
    const input = document.getElementById('userSearch');
    if (!input) return;
    input.addEventListener('input', debounce(() => {
        const query = input.value.trim().toLowerCase();
        if (!query) {
            _renderUsersTable(_allUsersCache);
            return;
        }
        const filtered = _allUsersCache.filter(u =>
            (u.full_name || '').toLowerCase().includes(query) ||
            (u.email     || '').toLowerCase().includes(query) ||
            (u.username  || '').toLowerCase().includes(query) ||
            (u.role      || '').toLowerCase().includes(query)
        );
        _renderUsersTable(filtered);
    }, 250));
}

function _attachUserActionListeners() {
    // Toggle admin
    document.querySelectorAll('.toggle-admin-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const userId  = btn.dataset.id;
            const current = btn.dataset.isadmin === 'true';
            const action  = current ? 'revoke admin rights from' : 'grant admin rights to';

            if (!confirm(`Are you sure you want to ${action} this user?`)) return;

            btn.disabled    = true;
            btn.textContent = 'Updating…';

            const { error } = await toggleUserAdmin(userId, !current);
            if (error) {
                showNotification('Failed to update admin status', 'error');
                btn.disabled    = false;
                btn.textContent = current ? 'Remove Admin' : 'Make Admin';
            } else {
                showNotification('Admin status updated', 'success');
                setTimeout(() => window.location.reload(), 800);
            }
        });
    });

    // Delete user
    document.querySelectorAll('.delete-user-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            if (!confirm('Delete this user permanently? This cannot be undone.')) return;

            const userId = btn.dataset.id;
            btn.disabled    = true;
            btn.textContent = 'Deleting…';

            const { error } = await deleteUser(userId);
            if (error) {
                showNotification('Failed to delete user', 'error');
                btn.disabled    = false;
                btn.textContent = 'Delete';
            } else {
                showNotification('User deleted', 'success');
                setTimeout(() => window.location.reload(), 800);
            }
        });
    });
}

/* ─────────────────────────────────────────
   EVENTS
───────────────────────────────────────── */
async function loadAndRenderEvents() {
    const tableBody     = document.getElementById('adminEventsTableBody');
    const toggleFormBtn = document.getElementById('toggleEventFormBtn');
    const cancelFormBtn = document.getElementById('cancelEventFormBtn');
    const formWrapper   = document.getElementById('eventFormWrapper');
    const eventForm     = document.getElementById('eventForm');

    if (!tableBody) return;

    // Toggle form visibility using `hidden` attribute
    const showForm = (show) => {
        if (!formWrapper) return;
        if (show) {
            formWrapper.removeAttribute('hidden');
        } else {
            formWrapper.setAttribute('hidden', '');
        }
    };

    toggleFormBtn?.addEventListener('click', () => {
        const isHidden = formWrapper?.hasAttribute('hidden');
        showForm(isHidden);
    });

    cancelFormBtn?.addEventListener('click', () => {
        eventForm?.reset();
        showForm(false);
    });

    // Fetch events
    try {
        const client = await getSupabaseClient();
        const { data, error } = await client
            .from('events')
            .select('id,title,event_date,event_time,category,capacity')
            .order('event_date', { ascending: true });

        if (error) throw error;

        const events = data || [];
        const statEl = document.getElementById('stat-events');
        if (statEl) statEl.textContent = events.length;

        if (!events.length) {
            tableBody.innerHTML = '<tr><td colspan="6" class="text-center">No events yet.</td></tr>';
        } else {
            tableBody.innerHTML = events.map(ev => `
                <tr>
                    <td>${escapeHtml(ev.title || 'Untitled')}</td>
                    <td>${escapeHtml(ev.event_date || '—')}</td>
                    <td>${escapeHtml(ev.event_time || '—')}</td>
                    <td>${escapeHtml(ev.category || 'Event')}</td>
                    <td>${typeof ev.capacity === 'number' ? ev.capacity : '—'}</td>
                    <td>
                        <button class="btn-danger delete-event-btn" data-id="${ev.id}">
                            Delete
                        </button>
                    </td>
                </tr>
            `).join('');
        }

    } catch (err) {
        console.error('Error loading events:', err);
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center">Failed to load events.</td></tr>';
    }

    // Delete event
    tableBody.addEventListener('click', async (e) => {
        const btn = e.target.closest('.delete-event-btn');
        if (!btn) return;

        const id = btn.dataset.id;
        if (!id) return;
        if (!confirm('Delete this event? Registrations may be removed.')) return;

        btn.disabled    = true;
        btn.textContent = 'Deleting…';

        try {
            const client = await getSupabaseClient();
            const { error } = await client.from('events').delete().eq('id', id);
            if (error) throw error;
            showNotification('Event deleted', 'success');
            setTimeout(() => window.location.reload(), 600);
        } catch (err) {
            console.error('Delete event error:', err);
            showNotification('Failed to delete event', 'error');
            btn.disabled    = false;
            btn.textContent = 'Delete';
        }
    });

    // Create event
    eventForm?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const fd = new FormData(eventForm);
        const payload = {
            title:       fd.get('title')       || '',
            category:    fd.get('category')    || '',
            event_date:  fd.get('event_date')  || null,
            event_time:  fd.get('event_time')  || null,
            location:    fd.get('location')    || '',
            image_url:   fd.get('image_url')   || '',
            description: fd.get('description') || ''
        };

        const cap = parseInt(fd.get('capacity'), 10);
        if (!isNaN(cap) && cap > 0) payload.capacity = cap;

        const submitBtn = eventForm.querySelector('[type="submit"]');
        if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Saving…'; }

        try {
            const client = await getSupabaseClient();
            const { data: { user } } = await client.auth.getUser();
            if (user?.id) payload.created_by = user.id;

            const { error } = await client.from('events').insert(payload);
            if (error) throw error;

            showNotification('Event created', 'success');
            eventForm.reset();
            showForm(false);
            setTimeout(() => window.location.reload(), 700);
        } catch (err) {
            console.error('Create event error:', err);
            showNotification('Failed to create event', 'error');
            if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Save Event'; }
        }
    });
}