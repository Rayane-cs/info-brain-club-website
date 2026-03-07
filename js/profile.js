document.addEventListener('DOMContentLoaded', async () => {
    const isGuest = await isUserGuest();
    const client = await getSupabaseClient();
    const { data: { user }, error: userError } = await client.auth.getUser();

    if (userError || !user || isGuest) {
        showNotification('Please log in to view your profile', 'warning');
        setTimeout(() => {
            window.location.href = '/index.html';
        }, 1500);
        return;
    }
    const userData = await getUserById(user.id);
    if (!userData) {
        showNotification('Error loading profile data', 'error');
        return;
    }

    document.getElementById('profile-fullname').textContent = userData.full_name || 'Not set';
    document.getElementById('profile-username').textContent = `@${userData.username}` || 'Not set';
    document.getElementById('profile-email').textContent = userData.email || 'Not set';

    const roleBadge = document.getElementById('profile-role');
    if (userData.is_admin) {
        roleBadge.textContent = 'Admin';
        roleBadge.className = 'role-badge admin';
    } else {
        roleBadge.textContent = userData.role || 'Member';
        roleBadge.className = 'role-badge user';
    }

    const avatarImg = document.getElementById('profile-avatar');
    const initialsDiv = document.getElementById('profile-initials');

    if (hasCustomAvatar(userData)) {
        avatarImg.src = getAvatarUrl(userData);
        avatarImg.style.display = 'block';
        initialsDiv.style.display = 'none';
    } else {
        initialsDiv.textContent = getInitials(userData.full_name || userData.email);
        avatarImg.style.display = 'none';
        initialsDiv.style.display = 'block';
    }
    
    const displayView = document.getElementById('profile-display-view');
    const editView = document.getElementById('profile-edit-view');
    const editBtn = document.getElementById('edit-profile-btn');
    const cancelBtn = document.getElementById('cancel-edit-btn');
    const editForm = document.getElementById('edit-profile-form');
    
    const editFullname = document.getElementById('edit-fullname');
    const editUsername = document.getElementById('edit-username');
    const editAvatar = document.getElementById('edit-avatar');
    
    editBtn.addEventListener('click', () => {
        editFullname.value = userData.full_name || '';
        editUsername.value = userData.username || '';
        editAvatar.value = userData.avatar_url || '';
        
        displayView.style.display = 'none';
        editView.style.display = 'block';
    });
    
    cancelBtn.addEventListener('click', () => {
        editView.style.display = 'none';
        displayView.style.display = 'grid';
    });
    
    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = document.getElementById('save-profile-btn');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Saving...';
        submitBtn.disabled = true;
        
        const updates = {
            full_name: editFullname.value.trim(),
            username: editUsername.value.trim(),
            avatar_url: editAvatar.value.trim()
        };
        
        const { error } = await updateUserProfile(user.id, updates);
        
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        
        if (error) {
            showNotification(error.message || 'Failed to update profile', 'error');
        } else {
            showNotification('Profile updated successfully', 'success');
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        }
    });
});
