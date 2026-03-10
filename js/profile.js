/**
 * profile.js — User profile page
 * Requires: utils.js (getSupabaseClient, getUserById, updateUserProfile, etc.)
 */

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const client = await getSupabaseClient();
        const { data: { user }, error } = await client.auth.getUser();

        if (error || !user) {
            showNotification('Please sign in to view your profile', 'warning');
            setTimeout(() => { window.location.href = '/index.html'; }, 1500);
            return;
        }

        const userData = await getUserById(user.id);
        if (!userData) {
            showNotification('Error loading profile data', 'error');
            return;
        }

        _renderProfile(userData, user);
        _setupEditForm(userData, user);

    } catch (err) {
        console.error('Profile error:', err);
        showNotification('Failed to load profile', 'error');
    }
});

/* ─────────────────────────────────────────
   RENDER
───────────────────────────────────────── */
function _renderProfile(u, authUser) {
    const name  = u.full_name || authUser?.email?.split('@')[0] || 'User';
    const uname = u.username  || '';

    document.getElementById('profileDisplayName').textContent = name;
    document.getElementById('profileUsernameText').textContent = uname ? `@${uname}` : '';

    const avatarEl   = document.getElementById('profileAvatar');
    const initialsEl = document.getElementById('profileInitials');

    if (hasCustomAvatar(u)) {
        // Show image, fallback to initials on error
        avatarEl.innerHTML = `<img src="${escapeHtml(u.avatar_url)}" alt="${escapeHtml(name)}" loading="lazy"
            onerror="this.remove();document.getElementById('profileInitials').style.display=''">`;
        initialsEl.style.display = 'none';
    } else {
        initialsEl.textContent   = getInitials(name);
        initialsEl.style.display = '';
    }

    const setText = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    };

    setText('profile-fullname', u.full_name || '—');
    setText('profile-username', uname ? `@${uname}` : '—');
    setText('profile-email',    u.email || authUser?.email || '—');
    setText('profile-bio',      u.bio || 'No bio yet.');

    const roleLabel  = u.is_admin ? 'Admin' : (u.role || 'Member');
    const roleClass  = u.is_admin ? 'role-badge admin' : 'role-badge user';

    [document.getElementById('profile-role'), document.getElementById('profile-role-sidebar')]
        .forEach(el => {
            if (!el) return;
            el.textContent = roleLabel;
            el.className   = roleClass;
        });
}

/* ─────────────────────────────────────────
   EDIT FORM
───────────────────────────────────────── */
function _setupEditForm(userData, authUser) {
    const displayView = document.getElementById('displayView');
    const editView    = document.getElementById('editView');
    const editBtn     = document.getElementById('editProfileBtn');
    const cancelBtn   = document.getElementById('cancelEditBtn');
    const form        = document.getElementById('editProfileForm');
    const avatarFile  = document.getElementById('avatarFile');
    const editAvatar  = document.getElementById('editAvatar');

    if (!form) return;

    // Show edit form
    editBtn?.addEventListener('click', () => {
        document.getElementById('editFullname').value = userData.full_name || '';
        document.getElementById('editUsername').value = userData.username  || '';
        document.getElementById('editBio').value      = userData.bio       || '';
        if (editAvatar) editAvatar.value              = userData.avatar_url || '';

        // Update preview
        _updateAvatarPreview(userData.avatar_url || null, getInitials(userData.full_name || ''));

        displayView.hidden = true;
        editView.removeAttribute('hidden');
    });

    // Cancel
    cancelBtn?.addEventListener('click', () => {
        editView.setAttribute('hidden', '');
        displayView.hidden = false;
    });

    // Avatar file picker → preview + set URL field
    avatarFile?.addEventListener('change', async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            showNotification('Image must be under 2 MB', 'warning');
            avatarFile.value = '';
            return;
        }

        // Show local preview immediately
        const localUrl = URL.createObjectURL(file);
        _updateAvatarPreview(localUrl, '');
    });

    // Avatar URL input → live preview
    editAvatar?.addEventListener('input', () => {
        const url = editAvatar.value.trim();
        if (url) {
            _updateAvatarPreview(url, getInitials(document.getElementById('editFullname').value || ''));
            // Clear file input so URL takes precedence
            if (avatarFile) avatarFile.value = '';
        }
    });

    // Save
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('saveProfileBtn');
        if (btn) { btn.disabled = true; btn.textContent = 'Saving…'; }

        try {
            let avatarUrl = editAvatar?.value.trim() || userData.avatar_url || null;

            // If a file was chosen, upload to Supabase Storage
            const file = avatarFile?.files?.[0];
            if (file) {
                try {
                    const client   = await getSupabaseClient();
                    const ext      = file.name.split('.').pop();
                    const filePath = `avatars/${authUser.id}.${ext}`;
                    const { data: uploadData, error: uploadError } = await client
                        .storage
                        .from('user-avatars')
                        .upload(filePath, file, { upsert: true, contentType: file.type });

                    if (uploadError) throw uploadError;

                    // Get public URL
                    const { data: { publicUrl } } = client
                        .storage
                        .from('user-avatars')
                        .getPublicUrl(filePath);

                    avatarUrl = publicUrl;
                } catch (storageErr) {
                    console.warn('Storage upload failed, using URL field instead:', storageErr);
                    showNotification('Could not upload photo — using URL if provided', 'warning');
                }
            }

            const updates = {
                full_name:  document.getElementById('editFullname').value.trim(),
                username:   document.getElementById('editUsername').value.trim(),
                bio:        document.getElementById('editBio').value.trim(),
                avatar_url: avatarUrl
            };

            const { error } = await updateUserProfile(authUser.id, updates);

            if (error) {
                showNotification(error.message || 'Update failed', 'error');
            } else {
                showNotification('Profile updated!', 'success');
                setTimeout(() => window.location.reload(), 900);
            }
        } catch (err) {
            console.error('Save profile error:', err);
            showNotification('Failed to save profile', 'error');
        } finally {
            if (btn) { btn.disabled = false; btn.textContent = 'Save Changes'; }
        }
    });
}

/* ─────────────────────────────────────────
   AVATAR PREVIEW HELPER
───────────────────────────────────────── */
function _updateAvatarPreview(url, fallbackInitials) {
    const preview   = document.getElementById('avatarPreview');
    const initialsEl = document.getElementById('avatarPreviewInitials');
    if (!preview) return;

    if (url) {
        // Remove old img if any
        const existing = preview.querySelector('img');
        if (existing) existing.remove();

        const img = document.createElement('img');
        img.src     = url;
        img.alt     = 'Avatar preview';
        img.loading = 'lazy';
        img.style.cssText = 'width:100%;height:100%;object-fit:cover;border-radius:50%';
        img.onerror = () => {
            img.remove();
            if (initialsEl) { initialsEl.textContent = fallbackInitials || 'U'; initialsEl.style.display = ''; }
        };
        img.onload = () => {
            if (initialsEl) initialsEl.style.display = 'none';
        };
        preview.appendChild(img);
    } else {
        const existing = preview.querySelector('img');
        if (existing) existing.remove();
        if (initialsEl) { initialsEl.textContent = fallbackInitials || 'U'; initialsEl.style.display = ''; }
    }
}