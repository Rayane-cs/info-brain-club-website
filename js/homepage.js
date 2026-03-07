// zoom while scrolling
const heroBg = document.querySelector(".hero-bg");

window.addEventListener("scroll", () => {
    let scrollY = window.scrollY;
    let scale = 1 + scrollY * 0.0005;
    heroBg.style.transform = `scale(${scale})`;
});

// ===== Mini Image Slider =====
(function() {
    const slides = document.querySelectorAll('.mini-slide');
    const dots = document.querySelectorAll('.dot');
    const prevBtn = document.querySelector('.slick-prev');
    const nextBtn = document.querySelector('.slick-next');
    
    let currentSlide = 0;
    let slideInterval;
    const intervalTime = 5000; // 5 seconds
    
    // Show specific slide
    function showSlide(index) {
        // clear exiting/active from all slides
        slides.forEach(slide => {
            slide.classList.remove('active', 'exiting');
        });
        dots.forEach(dot => dot.classList.remove('active'));

        // handle index bounds
        if (index >= slides.length) index = 0;
        else if (index < 0) index = slides.length - 1;

        // mark outgoing slide (currentSlide) if exists
        if (slides[currentSlide]) {
            slides[currentSlide].classList.add('exiting');
        }

        currentSlide = index;

        // new slide will animate in from right due to base transform
        slides[currentSlide].classList.add('active');
        dots[currentSlide].classList.add('active');
    }
    
    // Next slide
    function nextSlide() {
        showSlide(currentSlide + 1);
    }
    
    // Previous slide
    function prevSlide() {
        showSlide(currentSlide - 1);
    }
    
    // Start auto-slide
    function startAutoSlide() {
        slideInterval = setInterval(nextSlide, intervalTime);
    }
    
    // Stop auto-slide
    function stopAutoSlide() {
        clearInterval(slideInterval);
    }
    
    // Event listeners for arrows
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            prevSlide();
            stopAutoSlide();
            startAutoSlide();
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            nextSlide();
            stopAutoSlide();
            startAutoSlide();
        });
    }
    
    // Event listeners for dots
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            showSlide(index);
            stopAutoSlide();
            startAutoSlide();
        });
    });
    
    // Pause on hover
    const slider = document.querySelector('.hero-slider');
    if (slider) {
        slider.addEventListener('mouseenter', stopAutoSlide);
        slider.addEventListener('mouseleave', startAutoSlide);
    }
    
    // Start auto-slide on load
    startAutoSlide();
})();

// ===== Mobile Navigation Toggle =====
(function() {
    const navToggle = document.querySelector('.nav-toggle');
    const navLinks = document.querySelectorAll('.nav-links a');
    
    if (navToggle) {
        navToggle.addEventListener('click', () => {
            document.body.classList.toggle('nav-open');
        });
    }
    
    // Close menu when clicking a link
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            document.body.classList.remove('nav-open');
        });
    });
})();

// ===== Active Navigation Link on Scroll & Reveal Animation =====
(function() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-links a');
    const reveals = document.querySelectorAll(".reveal");
    
    function handleScroll() {
        let current = '';
        const scrollPos = window.pageYOffset + 100;
        const windowHeight = window.innerHeight;
        const elementVisible = 3;
        
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === '#' + current) {
                link.classList.add('active');
            }
        });

        // Reveal Animation
        reveals.forEach(el => {
            const elementTop = el.getBoundingClientRect().top;
            if (elementTop < windowHeight - elementVisible) {
                el.classList.add("active");
            }
        });
    }
    
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('load', () => {
        handleScroll();
        // Performance: Lazy load images
        document.querySelectorAll('img').forEach(img => {
            if (!img.getAttribute('loading')) {
                img.setAttribute('loading', 'lazy');
            }
        });
    });
})();

// ===== Smooth Scroll for Anchor Links =====
(function() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const headerOffset = 70;
                const elementPosition = target.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                
                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
})();

// ===== Dynamic Events Loading - Shared with Events Page =====
(function() {
    const eventsGrid = document.getElementById('events-grid');
    const eventsEmpty = document.getElementById('events-empty');
    
    if (!eventsGrid) return;
    
    // Helper: Get event detail URL (same as events page)
    function getEventDetailUrl(evt) {
        if (!evt || !evt.id) return "/pages/events.html";
        return "/pages/event-detail.html?id=" + encodeURIComponent(evt.id);
    }
    
    // Helper: Create event card HTML (matches events page style)
    function createEventCard(evt) {
        var dateText = evt.event_date || "";
        var taken = typeof evt.regis_user === "number" ? evt.regis_user : 0;
        var capacityText = typeof evt.capacity === "number" ? String(evt.capacity) : "—";
        var seatsText = evt.capacity ? "Seats: " + taken + " / " + capacityText : "";
        var category = evt.category || "Event";
        var img = evt.image_url ||
            "https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&w=800";
        
        var detailsUrl = getEventDetailUrl(evt);
        
        return (
            '<article class="event-card reveal active" data-event="' + (evt.title || "") + '">' +
            '  <div class="event-image">' +
            '    <img src="' + img + '" alt="' + (evt.title || "Event") + '" loading="lazy" onerror="this.parentElement.innerHTML=\'<div class=\\\'image-placeholder\\\'>' + category[0] + '</div>\'">' +
            (dateText ? '    <div class="date-badge">' + dateText + "</div>" : "") +
            "  </div>" +
            '  <div class="event-content">' +
            '    <span class="cat-tag">' + category + "</span>" +
            '    <h3 class="event-title">' + (evt.title || "Event") + "</h3>" +
            (seatsText ? '    <p class="event-seats" style="font-size:0.85rem;color:#666;margin-bottom:8px;">' + seatsText + "</p>" : "") +
            '    <a href="' + detailsUrl + '" class="event-link">View More →</a>' +
            "  </div>" +
            "</article>"
        );
    }
    
    // Helper: Get Supabase client (same pattern as events page)
    async function getSupabaseClient() {
        if (typeof createClient === "function") {
            return createClient();
        }
        if (typeof supabase !== "undefined" && supabase.from) {
            return supabase;
        }
        throw new Error("Supabase not available");
    }
    
    // Main: Load events from database (same query as events page)
    async function loadEvents() {
        // Show loading state
        eventsGrid.innerHTML = '<div class="events-loading" style="grid-column:1/-1;text-align:center;padding:40px;"><div class="spinner" style="width:40px;height:40px;border:3px solid #e2e8f0;border-top-color:#FF6B00;border-radius:50%;animation:spin 1s linear infinite;margin:0 auto 16px;"></div><p>Loading events...</p></div>';
        
        try {
            var client = await getSupabaseClient();
            
            // Same query as events page: future events, ordered by date, limit 4
            var response = await client
                .from("events")
                .select("id,title,description,location,event_date,event_time,category,image_url,capacity,regis_user")
                .gte("event_date", new Date().toISOString().split('T')[0]) // Only future events
                .order("event_date", { ascending: true })
                .order("event_time", { ascending: true })
                .limit(4);
            
            if (response.error) {
                throw response.error;
            }
            
            var events = response.data || [];
            
            // Check if we have events
            if (!events.length) {
                eventsGrid.innerHTML = '';
                if (eventsEmpty) eventsEmpty.classList.remove('hidden');
                return;
            }
            
            // Hide empty state
            if (eventsEmpty) eventsEmpty.classList.add('hidden');
            
            // Render events
            eventsGrid.innerHTML = events.map(createEventCard).join("");
            
            // Re-trigger reveal animation for new elements
            const newCards = eventsGrid.querySelectorAll('.event-card');
            newCards.forEach((card, index) => {
                setTimeout(() => {
                    card.classList.add('active');
                }, index * 100);
            });
            
        } catch (err) {
            console.error('Failed to load events:', err);
            showFallbackEvents();
        }
    }
    
    // Fallback: Static events if database fails
    function showFallbackEvents() {
        var fallbackEvents = [
            {
                id: 1,
                title: "Deep Learning Workshop Series",
                event_date: "March 15, 2026",
                category: "Training",
                image_url: "https://images.unsplash.com/photo-1591453089816-0fbb971b454c?auto=format&w=800",
                regis_user: 12,
                capacity: 30
            },
            {
                id: 2,
                title: "AI Ethics Roundtable",
                event_date: "March 22, 2026",
                category: "Ethics",
                image_url: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&w=800",
                regis_user: 8,
                capacity: 20
            },
            {
                id: 3,
                title: "Startup Pitch Competition",
                event_date: "April 05, 2026",
                category: "Innovation",
                image_url: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&w=800",
                regis_user: 15,
                capacity: 50
            },
            {
                id: 4,
                title: "Research Symposium 2026",
                event_date: "April 12, 2026",
                category: "Research",
                image_url: "https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&w=800",
                regis_user: 45,
                capacity: 100
            }
        ];
        
        if (eventsEmpty) eventsEmpty.classList.add('hidden');
        eventsGrid.innerHTML = fallbackEvents.map(createEventCard).join("");
        
        // Trigger animations
        const newCards = eventsGrid.querySelectorAll('.event-card');
        newCards.forEach((card, index) => {
            setTimeout(() => {
                card.classList.add('active');
            }, index * 100);
        });
    }
    
    // Load events when page loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadEvents);
    } else {
        loadEvents();
    }
})();