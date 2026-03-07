document.addEventListener('DOMContentLoaded', async () => {
    // 1. Verify user is logged in AND is an admin
    const isGuest = await isUserGuest();
    const isAdmin = await isUserAdmin();

    if (isGuest || !isAdmin) {
        showNotification('Unauthorized access', 'error');
        setTimeout(() => {
            window.location.href = '/pages/profile.html';
        }, 1500);
        return;
    }

    // 2. Load all users
    const allUsers = await getAllUsers();
    
    // 3. Update stats
    const adminsCount = allUsers.filter(u => u.is_admin).length;
    document.getElementById('stat-users').textContent = allUsers.length;
    document.getElementById('stat-admins').textContent = adminsCount;

    // 4. Render users table
    const tableBody = document.getElementById('adminUsersTableBody');
    if (!allUsers || allUsers.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center">No users found.</td></tr>';
        return;
    }

    tableBody.innerHTML = allUsers.map(user => {
        let roleName = user.role || (user.guest ? 'Guest' : 'Member');
        let roleClass = user.guest ? 'role-guest' : 'role-user';

        const adminBadge = user.is_admin ? '<span class="role-badge role-admin" style="background: rgba(168, 85, 247, 0.1); color: #c084fc;">Yes</span>' : '<span class="role-badge role-user" style="background: rgba(156, 163, 175, 0.1); color: #9ca3af;">No</span>';
        
        const initials = getInitials(user.full_name || user.email);
        
        // Generate Action Buttons
        const isAdminBtnText = user.is_admin ? 'Remove Admin' : 'Make Admin';
        const isAdminBtnClass = user.is_admin ? 'btn-secondary' : 'btn-primary';
        
        return `
            <tr>
                <td>
                    <div class="user-cell">
                        <div class="user-avatar-small">${initials}</div>
                        <strong>${escapeHtml?.(user.full_name) || 'Unknown'}</strong>
                    </div>
                </td>
                <td>${escapeHtml?.(user.email) || 'N/A'}</td>
                <td><span class="role-badge ${roleClass}">${roleName}</span></td>
                <td>${adminBadge}</td>
                <td>${formatDate?.(user.created_at) || 'Unknown'}</td>
                <td>
                    <button class="btn ${isAdminBtnClass} btn-sm toggle-admin-btn" style="padding: 4px 8px; font-size: 0.75rem;" data-id="${user.id}" data-isadmin="${user.is_admin}">
                        ${isAdminBtnText}
                    </button>
                    <button class="btn btn-secondary btn-sm delete-user-btn" style="padding: 4px 8px; font-size: 0.75rem; border-color: #ef4444; color: #ff0000ff;" data-id="${user.id}">
                        Delete
                    </button>
                </td>
            </tr>
        `;
    }).join('');

    // 5. Setup Action Listeners
    setupAdminActions();

    // 6. Load and manage events
    await loadAndRenderEvents();
});

function setupAdminActions() {
    const adminToggleBtns = document.querySelectorAll('.toggle-admin-btn');
    const deleteBtns = document.querySelectorAll('.delete-user-btn');

    adminToggleBtns.forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const userId = btn.getAttribute('data-id');
            const currentStatus = btn.getAttribute('data-isadmin') === 'true';
            
            if (confirm(`Are you sure you want to ${currentStatus ? 'revoke admin rights from' : 'grant admin rights to'} this user?`)) {
                btn.disabled = true;
                btn.textContent = 'Updating...';
                
                const { error } = await toggleUserAdmin(userId, !currentStatus);
                if (error) {
                    showNotification('Failed to update admin status', 'error');
                    btn.disabled = false;
                    btn.textContent = currentStatus ? 'Remove Admin' : 'Make Admin';
                } else {
                    showNotification('User admin status updated', 'success');
                    setTimeout(() => window.location.reload(), 800);
                }
            }
        });
    });

    deleteBtns.forEach(btn => {
        btn.addEventListener('click', async () => {
            const userId = btn.getAttribute('data-id');
            const { error } = await deleteUser(userId);
            if (error) {
                showNotification('Failed to delete user', 'error');
                btn.disabled = false;
                btn.textContent = 'Delete';
            } else {
                showNotification('User deleted successfully', 'success');
                setTimeout(() => window.location.reload(), 800);
            }
        });
    });
}

async function loadAndRenderEvents() {
    const tableBody = document.getElementById('adminEventsTableBody');
    const toggleFormBtn = document.getElementById('toggleEventFormBtn');
    const cancelFormBtn = document.getElementById('cancelEventFormBtn');
    const formWrapper = document.getElementById('eventFormWrapper');
    const eventForm = document.getElementById('eventForm');

    if (!tableBody) return;

    // Toggle form visibility
    function showForm(show) {
        if (!formWrapper) return;
        formWrapper.style.display = show ? 'block' : 'none';
    }

    if (toggleFormBtn) {
        toggleFormBtn.addEventListener('click', () => {
            showForm(formWrapper && formWrapper.style.display !== 'block');
        });
    }
    if (cancelFormBtn) {
        cancelFormBtn.addEventListener('click', () => {
            if (eventForm) eventForm.reset();
            showForm(false);
        });
    }

    // Load events
    try {
        const client = await getSupabaseClient();
        const { data, error } = await client
            .from('events')
            .select('id,title,event_date,event_time,category,capacity')
            .order('event_date', { ascending: true })
            .order('event_time', { ascending: true });

        if (error) throw error;

        const events = data || [];
        if (!events.length) {
            tableBody.innerHTML = '<tr><td colspan="6" class="text-center">No events yet.</td></tr>';
        } else {
            tableBody.innerHTML = events.map(ev => {
                const dateText = ev.event_date || '—';
                const timeText = ev.event_time || '—';
                const category = ev.category || 'Event';
                const capacity = typeof ev.capacity === 'number' ? ev.capacity : '—';
                return `
                    <tr>
                        <td>${escapeHtml?.(ev.title) || 'Untitled'}</td>
                        <td>${escapeHtml?.(dateText)}</td>
                        <td>${escapeHtml?.(timeText)}</td>
                        <td>${escapeHtml?.(category)}</td>
                        <td>${capacity}</td>
                        <td>
                            <button class="btn btn-secondary btn-sm delete-event-btn"
                                    style="padding:4px 8px;font-size:0.75rem;border-color:#ef4444;color:#ef4444;"
                                    data-id="${ev.id}">
                                Delete
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');
        }
    } catch (e) {
        console.error('Error loading events:', e);
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center">Failed to load events.</td></tr>';
    }

    // Delete event handler
    document.querySelectorAll('.delete-event-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = btn.getAttribute('data-id');
            if (!id) return;
            if (!confirm('Delete this event? Registrations may be removed as well.')) return;

            btn.disabled = true;
            btn.textContent = 'Deleting...';

            try {
                const client = await getSupabaseClient();
                const { error } = await client.from('events').delete().eq('id', id);
                if (error) throw error;
                showNotification('Event deleted', 'success');
                setTimeout(() => window.location.reload(), 600);
            } catch (e) {
                console.error('Error deleting event:', e);
                showNotification('Failed to delete event', 'error');
                btn.disabled = false;
                btn.textContent = 'Delete';
            }
        });
    });

    // Add event handler
    if (eventForm) {
        eventForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = new FormData(eventForm);
            const payload = {
                title: formData.get('title') || '',
                category: formData.get('category') || '',
                event_date: formData.get('event_date') || null,
                event_time: formData.get('event_time') || null,
                location: formData.get('location') || '',
                image_url: formData.get('image_url') || '',
                description: formData.get('description') || ''
            };

            const capacityValue = formData.get('capacity');
            if (capacityValue) {
                const parsed = parseInt(capacityValue, 10);
                if (!isNaN(parsed) && parsed > 0) {
                    payload.capacity = parsed;
                }
            }

            try {
                const client = await getSupabaseClient();
                const { data: userData } = await client.auth.getUser();
                const user = userData ? userData.user : null;
                if (user && user.id) {
                    payload.created_by = user.id;
                }

                const { error } = await client.from('events').insert(payload);
                if (error) throw error;

                showNotification('Event created', 'success');
                eventForm.reset();
                showForm(false);
                setTimeout(() => window.location.reload(), 700);
            } catch (err) {
                console.error('Error creating event:', err);
                showNotification('Failed to create event', 'error');
            }
        });
    }
}
