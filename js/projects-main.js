document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    var searchInput = document.getElementById('search-input');
    var fieldFilter = document.getElementById('field-filter');
    var statusFilter = document.getElementById('status-filter');
    var projectCards = document.querySelectorAll('.project-card');

    function filterProjects() {
        var searchTerm = (searchInput ? searchInput.value.toLowerCase() : '') || '';
        var field = fieldFilter ? fieldFilter.value : '';
        var status = statusFilter ? statusFilter.value : '';

        projectCards.forEach(function(card) {
            var title = (card.querySelector('.card__title') || {}).textContent || '';
            var fieldVal = card.getAttribute('data-field') || '';
            var statusVal = card.getAttribute('data-status') || '';
            var matchesSearch = !searchTerm || title.toLowerCase().indexOf(searchTerm) >= 0;
            var matchesField = !field || fieldVal === field;
            var matchesStatus = !status || statusVal === status;
            card.style.display = (matchesSearch && matchesField && matchesStatus) ? '' : 'none';
        });
    }

    if (searchInput) searchInput.addEventListener('input', filterProjects);
    if (fieldFilter) fieldFilter.addEventListener('change', filterProjects);
    if (statusFilter) statusFilter.addEventListener('change', filterProjects);

    var modal = document.getElementById('collabModal');
    var collabBtns = document.querySelectorAll('.collaborate-btn');
    var closeBtn = modal ? modal.querySelector('.modal__close') : null;

    collabBtns.forEach(function(btn) {
        btn.addEventListener('click', function() {
            if (modal) modal.style.display = 'flex';
        });
    });

    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            if (modal) modal.style.display = 'none';
        });
    }

    window.addEventListener('click', function(e) {
        if (modal && e.target === modal) {
            modal.style.display = 'none';
        }
    });

    var form = document.getElementById('collabForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            if (modal) modal.style.display = 'none';
            form.reset();
        });
    }

    document.querySelectorAll('.btn-copy').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var citation = this.getAttribute('data-citation') || '';
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(citation);
            }
        });
    });
});
