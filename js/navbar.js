document.addEventListener('DOMContentLoaded', async () => {
  let retries = 0;
  while (!document.querySelector('.nav-logos-left') && !document.querySelector('.mobile-nav') && retries < 50) {
    await new Promise(r => setTimeout(r, 100));
    retries++;
  }
  _initHamburger();
  _setActiveLinks();
  await _renderUserActions();
});

function _initHamburger() {
  const btn = document.getElementById('hamburgerBtn');
  const dropdown = document.getElementById('mobileDropdown');
  if (!btn || !dropdown) return;

  btn.addEventListener('click', e => {
    e.stopPropagation();
    const isOpen = dropdown.classList.toggle('open');
    btn.setAttribute('aria-expanded', isOpen);
    dropdown.setAttribute('aria-hidden', !isOpen);
  });

  document.addEventListener('click', e => {
    if (!e.target.closest('.mobile-header')) _closeDropdown(btn, dropdown);
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') _closeDropdown(btn, dropdown);
  });

  dropdown.querySelectorAll('.mobile-dropdown-link').forEach(link => {
    link.addEventListener('click', () => _closeDropdown(btn, dropdown));
  });
}

function _closeDropdown(btn, dropdown) {
  dropdown.classList.remove('open');
  btn.setAttribute('aria-expanded', 'false');
  dropdown.setAttribute('aria-hidden', 'true');
}

function _setActiveLinks() {
  const path = window.location.pathname;
  document.querySelectorAll('.nav-links a, .mobile-dropdown-link').forEach(a => {
    const href = a.getAttribute('href');
    if (href && path.endsWith(href.split('/').pop())) a.classList.add('active');
  });
}

async function _renderUserActions() {
  const desktopSlot = document.getElementById('header-actions');
  const mobileSlot = document.getElementById('mobileUserLinks');
  let user = null, isGuest = false;

  try {
    const client = await getSupabaseClient();
    const { data: { user: authUser } } = await client.auth.getUser();
    user = authUser;
  } catch {}

  if (!user) {
    const stored = _getStoredUser();
    if (stored?.guest) isGuest = true;
  }

  if (isGuest) {
    if (desktopSlot) {
      desktopSlot.innerHTML = `<div class="nav-user-actions"><span class="nav-guest-badge"><span class="nav-item-label">Guest</span></span><button class="nav-signout-guest" id="guestSignOutDesktop">Sign out</button></div>`;
      document.getElementById('guestSignOutDesktop')?.addEventListener('click', _signOutGuest);
    }
    if (mobileSlot) {
      mobileSlot.innerHTML = `<span class="mobile-dropdown-link guest-label">Guest</span><button class="mobile-dropdown-btn" id="guestSignOutMobile">Sign out</button>`;
      document.getElementById('guestSignOutMobile')?.addEventListener('click', _signOutGuest);
    }
    return;
  }

  if (user) {
    let isAdmin = false, avatarUrl = null, fullName = '';
    try {
      const client = await getSupabaseClient();
      const { data } = await client.from('users').select('is_admin,full_name,avatar_url').eq('id', user.id).single();
      isAdmin = data?.is_admin === true;
      avatarUrl = data?.avatar_url || null;
      fullName = data?.full_name || user.email?.split('@')[0] || 'User';
    } catch {}

    const initials = fullName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'U';
    const avatarHtml = (avatarUrl && avatarUrl.trim())
      ? `<img src="${escapeHtml(avatarUrl)}" alt="${escapeHtml(initials)}" class="nav-avatar-img" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><span class="nav-avatar-initials" style="display:none">${escapeHtml(initials)}</span>`
      : `<span class="nav-avatar-initials">${escapeHtml(initials)}</span>`;

    if (desktopSlot) {
      desktopSlot.innerHTML = `<div class="nav-user-actions"><a href="/pages/profile.html" class="nav-profile-link" title="Profile"><span class="nav-avatar">${avatarHtml}</span><span class="nav-item-label">Profile</span></a>${isAdmin ? `<a href="/pages/admin.html" class="nav-admin-link" title="Admin"><span class="nav-item-label">Admin</span></a>` : ''}<button class="nav-signout-btn" id="signOutDesktop" title="Sign out"><span class="nav-item-label">Sign out</span></button></div>`;
      document.getElementById('signOutDesktop')?.addEventListener('click', _signOut);
    }

    if (mobileSlot) {
      mobileSlot.innerHTML = `<a href="/pages/profile.html" class="mobile-dropdown-link">Profile</a>${isAdmin ? `<a href="/pages/admin.html" class="mobile-dropdown-link admin-link">Admin</a>` : ''}<button class="mobile-dropdown-btn" id="signOutMobile">Sign out</button>`;
      document.getElementById('signOutMobile')?.addEventListener('click', _signOut);
    }
  }
}

async function _signOut() {
  try {
    const client = await getSupabaseClient();
    await client.auth.signOut();
  } catch {}
  localStorage.removeItem('currentUser');
  window.location.href = '/index.html';
}

function _signOutGuest() {
  localStorage.removeItem('currentUser');
  window.location.href = '/index.html';
}

function _getStoredUser() {
  try { return JSON.parse(localStorage.getItem('currentUser') || 'null'); }
  catch { return null; }
}
