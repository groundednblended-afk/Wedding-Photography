document.addEventListener('DOMContentLoaded', () => {
    initActiveNavHighlight();
    initGalleryLightbox();
    initBookingForm();
});

/* Highlights the sidebar nav link that matches the section currently in view */
function initActiveNavHighlight() {
    const navLinks = document.querySelectorAll('.nav-links a');
    const sections = document.querySelectorAll('main section[id]');

    if (!navLinks.length || !sections.length) return;

    const linkFor = (id) => document.querySelector(`.nav-links a[href="#${id}"]`);

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            const link = linkFor(entry.target.id);
            if (!link) return;

            if (entry.isIntersecting) {
                navLinks.forEach((l) => l.classList.remove('active'));
                link.classList.add('active');
            }
        });
    }, {
        rootMargin: '-45% 0px -45% 0px',
        threshold: 0
    });

    sections.forEach((section) => observer.observe(section));
}

/* Click-to-enlarge lightbox for the portfolio gallery, with next/prev navigation */
function initGalleryLightbox() {
    const galleryImages = Array.from(document.querySelectorAll('.gallery-item img'));
    if (!galleryImages.length) return;

    const overlay = document.createElement('div');
    overlay.className = 'lightbox-overlay';
    overlay.innerHTML = `
        <button class="lightbox-close" aria-label="Close">&times;</button>
        <button class="lightbox-prev" aria-label="Previous image">&#10094;</button>
        <img class="lightbox-image" src="" alt="">
        <button class="lightbox-next" aria-label="Next image">&#10095;</button>
    `;
    document.body.appendChild(overlay);

    const lightboxImage = overlay.querySelector('.lightbox-image');
    const closeBtn = overlay.querySelector('.lightbox-close');
    const prevBtn = overlay.querySelector('.lightbox-prev');
    const nextBtn = overlay.querySelector('.lightbox-next');

    let currentIndex = 0;
    let isTransitioning = false;

    const setImage = (index) => {
        currentIndex = (index + galleryImages.length) % galleryImages.length;
        const img = galleryImages[currentIndex];
        lightboxImage.src = img.src;
        lightboxImage.alt = img.alt;
    };

    /* Slides the current image out, swaps the src, then slides the new one in */
    const transitionToImage = (index, direction) => {
        if (isTransitioning) return;
        isTransitioning = true;

        const outClass = direction === 'next' ? 'is-sliding-out-left' : 'is-sliding-out-right';
        lightboxImage.classList.add(outClass);

        lightboxImage.addEventListener('transitionend', function onOut() {
            lightboxImage.removeEventListener('transitionend', onOut);
            setImage(index);

            const inClass = direction === 'next' ? 'is-sliding-in-right' : 'is-sliding-in-left';
            lightboxImage.classList.remove(outClass);
            lightboxImage.classList.add(inClass);

            void lightboxImage.offsetWidth;
            lightboxImage.classList.remove(inClass);

            isTransitioning = false;
        }, { once: true });
    };

    const openLightbox = (index) => {
        setImage(index);
        overlay.classList.add('is-open');
        document.body.style.overflow = 'hidden';
    };

    const closeLightbox = () => {
        overlay.classList.remove('is-open');
        document.body.style.overflow = '';
    };

    galleryImages.forEach((img, index) => {
        img.style.cursor = 'pointer';
        img.addEventListener('click', () => openLightbox(index));
    });

    closeBtn.addEventListener('click', closeLightbox);
    prevBtn.addEventListener('click', () => transitionToImage(currentIndex - 1, 'prev'));
    nextBtn.addEventListener('click', () => transitionToImage(currentIndex + 1, 'next'));

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeLightbox();
    });

    document.addEventListener('keydown', (e) => {
        if (!overlay.classList.contains('is-open')) return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') transitionToImage(currentIndex - 1, 'prev');
        if (e.key === 'ArrowRight') transitionToImage(currentIndex + 1, 'next');
    });
}

/* Handles booking form validation + submits the inquiry to FormSubmit.co, which emails it on */
function initBookingForm() {
    const form = document.querySelector('.booking-form');
    if (!form) return;

    const dateInput = form.querySelector('#date');
    if (dateInput) {
        dateInput.min = new Date().toISOString().split('T')[0];
    }

    let feedback = form.querySelector('.form-feedback');
    if (!feedback) {
        feedback = document.createElement('p');
        feedback.className = 'form-feedback';
        form.appendChild(feedback);
    }

    const submitBtn = form.querySelector('.submit-btn');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const names = form.querySelector('#names').value.trim();

        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';

        try {
            const response = await fetch(form.action, {
                method: 'POST',
                headers: { Accept: 'application/json' },
                body: new FormData(form)
            });

            if (!response.ok) throw new Error('Submission failed');

            feedback.textContent = `Thank you, ${names}! Your inquiry has been received — I'll be in touch within 48 hours.`;
            feedback.classList.remove('is-error');
            feedback.classList.add('is-visible');
            form.reset();
        } catch (err) {
            feedback.textContent = "Something went wrong sending your inquiry. Please email me directly instead.";
            feedback.classList.add('is-visible', 'is-error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Send Inquiry';
        }
    });
}
