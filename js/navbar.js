document.addEventListener('DOMContentLoaded', async () => {
  let retries = 0;
  while (!document.querySelector('.nav-logos-left') && retries < 50) {
    await new Promise(r => setTimeout(r, 100));
    retries++;
  }
  _initMobileMenu();
  await _renderHeaderActions();
});

function _initMobileMenu() {
  const nav = document.querySelector('.nav-links');
  if (!nav) return;

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.navbar')) _closeMenu(nav);
  });

  nav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => _closeMenu(nav));
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') _closeMenu(nav);
  });
}

function _closeMenu(nav) {
  nav.classList.remove('active');
  document.body.classList.remove('nav-open');
}

const SVG = {
  profile:  `<svg class="nav-mobile-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>`,
  admin:    `<svg class="nav-mobile-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
  guest:    `<svg class="nav-mobile-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/><line x1="17" y1="3" x2="21" y2="7"/><line x1="21" y1="3" x2="17" y2="7"/></svg>`,
  signout:  `<svg class="nav-mobile-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`,
};

async function _renderHeaderActions() {
  const container = document.getElementById('header-actions');
  if (!container) return;

  let user    = null;
  let isGuest = false;

  try {
    const client = await getSupabaseClient();
    const { data: { user: authUser } } = await client.auth.getUser();
    user = authUser;
  } catch {}

  if (!user) {
    const stored = _getStoredUser();
    if (stored && stored.guest) isGuest = true;
  }

  if (isGuest) {
    container.innerHTML = `
      <div class="nav-user-actions">
        <span class="nav-guest-badge">
          ${SVG.guest}
          <span class="nav-item-label">Guest</span>
        </span>
        <button class="nav-signout-guest" id="guestSignOutBtn">
          ${SVG.signout}
          <span class="nav-item-label">Sign out</span>
        </button>
      </div>`;
    document.getElementById('guestSignOutBtn')?.addEventListener('click', _handleSignOutGuest);
    return;
  }

  if (user) {
    let isAdmin   = false;
    let avatarUrl = null;
    let fullName  = '';

    try {
      const client = await getSupabaseClient();
      const { data } = await client
        .from('users')
        .select('is_admin, full_name, avatar_url')
        .eq('id', user.id)
        .single();
      isAdmin   = data?.is_admin === true;
      avatarUrl = data?.avatar_url || null;
      fullName  = data?.full_name  || user.email?.split('@')[0] || 'User';
    } catch {}

    const initials   = fullName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'U';
    const avatarHtml = (avatarUrl && avatarUrl.trim())
      ? `<img src="${escapeHtml(avatarUrl)}" alt="${escapeHtml(initials)}" class="nav-avatar-img" loading="lazy"
             onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"
         ><span class="nav-avatar-initials" style="display:none">${escapeHtml(initials)}</span>`
      : `<span class="nav-avatar-initials">${escapeHtml(initials)}</span>`;

    container.innerHTML = `
      <div class="nav-user-actions">
        <a href="/pages/profile.html" class="nav-profile-link" title="Profile">
          <span class="nav-avatar">${avatarHtml}</span>
          <span class="nav-item-label">Profile</span>
        </a>
        ${isAdmin
          ? `<a href="/pages/admin.html" class="nav-admin-link" title="Admin">
               ${SVG.admin}
               <span class="nav-item-label">Admin</span>
             </a>`
          : ''}
        <button class="nav-signout-btn" id="signOutBtn" title="Sign out">
          ${SVG.signout}
          <span class="nav-item-label">Sign out</span>
        </button>
      </div>`;

    document.getElementById('signOutBtn')?.addEventListener('click', _handleSignOut);
  }
}

async function _handleSignOut() {
  try {
    const client = await getSupabaseClient();
    await client.auth.signOut();
  } catch {}
  localStorage.removeItem('currentUser');
  window.location.href = '/index.html';
}

function _handleSignOutGuest() {
  localStorage.removeItem('currentUser');
  window.location.href = '/index.html';
}

function _getStoredUser() {
  try { return JSON.parse(localStorage.getItem('currentUser') || 'null'); }
  catch { return null; }
}
