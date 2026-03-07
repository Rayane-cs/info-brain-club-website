(function() {
    const container = document.getElementById('pagesContainer');
    const dots = document.querySelectorAll('.page-dot');
    const pages = document.querySelectorAll('.page');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const index = Array.from(pages).indexOf(entry.target);
                if (index >= 0) {
                    dots.forEach((dot, i) => {
                        if (i === index) dot.classList.add('active');
                        else dot.classList.remove('active');
                    });
                }
            }
        });
    }, { threshold: 0.6, root: container });

    pages.forEach(page => observer.observe(page));

    dots.forEach((dot, idx) => {
        dot.addEventListener('click', (e) => {
            e.preventDefault();
            if (pages[idx]) {
                pages[idx].scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    setTimeout(() => {
        if (!document.querySelector('.page-dot.active')) {
            dots[0].classList.add('active');
        }
    }, 100);
})();