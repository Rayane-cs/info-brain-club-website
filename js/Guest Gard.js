document.addEventListener('DOMContentLoaded', () => {
    document.addEventListener('click', async (e) => {
        const btn = e.target.closest('[data-register-event], .event-register-btn, .btn-register-event, [data-action="register"]');
        if (!btn) return;

        const guest = await isUserGuest();
        if (guest) {
            e.preventDefault();
            e.stopPropagation();
            showNotification('Join us first! Create an account to register for events.', 'warning');
        }
    }, true);
});