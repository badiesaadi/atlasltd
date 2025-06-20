// ==========================================================================
// DOM Manipulation and Initial Setup
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
    // Add scroll progress bar
    const scrollProgress = document.createElement('div');
    scrollProgress.className = 'scroll-progress';
    const scrollProgressBar = document.createElement('div');    
    scrollProgressBar.className = 'scroll-progress-bar';
    scrollProgress.appendChild(scrollProgressBar);
    document.body.appendChild(scrollProgress);

    // Cache DOM elements for navigation
    const nav = document.querySelector('nav');
    const mobileMenu = document.querySelector('.mobile-menu');
    const navLinks = document.querySelector('.nav-links');
    const dropdownToggles = document.querySelectorAll('.dropdown-toggle');

    // Cache DOM elements for form handling
    const contactForm = document.getElementById('contact-form');
    const formInputs = contactForm ? contactForm.querySelectorAll('input, textarea') : [];
    const statusMessage = document.getElementById('form-status');

    // Cache DOM elements for stats animation
    const statsSection = document.querySelector('.stats-section');
    const counters = document.querySelectorAll('.stat-box h2');

    // ==========================================================================
    // Event Listeners
    // ==========================================================================

    // Update scroll progress bar on scroll
    window.addEventListener('scroll', () => {
        const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (window.scrollY / windowHeight) * 100;
        scrollProgressBar.style.width = `${scrolled}%`;
    }, { passive: true }); // Mark as passive to avoid scroll-blocking warning

    // Enhanced sticky navigation with hide/show on scroll
    let lastScroll = 0;
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll > lastScroll && currentScroll > 100) {
            nav.style.transform = 'translateY(-100%)';
        } else {
            nav.style.transform = 'translateY(0)';
        }
        
        if (currentScroll > 100) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
        
        lastScroll = currentScroll;
    }, { passive: true }); // Mark as passive to avoid scroll-blocking warning

    // Enhanced mobile menu toggle with animation
    if (mobileMenu) {
        mobileMenu.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            mobileMenu.style.transform = navLinks.classList.contains('active') ? 'rotate(90deg)' : 'rotate(0)';
        });
    }

    // Enhanced smooth scrolling for anchor links with dynamic offset
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const headerOffset = 80;
                const elementPosition = target.offsetTop;
                const offsetPosition = elementPosition - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });

                // Close mobile menu if open
                if (window.innerWidth <= 768) {
                    navLinks.classList.remove('active');
                    if (mobileMenu) mobileMenu.style.transform = 'rotate(0)';
                }
            }
        });
    });

    // Close dropdown menu when clicking outside
    document.addEventListener('click', (e) => {
        const dropdown = document.querySelector('.dropdown');
        if (dropdown) {
            const isClickInside = dropdown.contains(e.target);
            if (!isClickInside) {
                const menu = dropdown.querySelector('.dropdown-menu');
                if (menu) menu.classList.remove('show');
            }
        }
    });

    // Handle dropdown menus
    function setupDropdowns() {
        if (dropdownToggles && dropdownToggles.length > 0) {
            dropdownToggles.forEach(toggle => {
                const dropdown = toggle.parentElement;
                const menu = dropdown.querySelector('.dropdown-menu');

                // Desktop hover behavior
                dropdown.addEventListener('mouseenter', () => {
                    if (window.innerWidth > 768) {
                        menu.style.opacity = '1';
                        menu.style.visibility = 'visible';
                        menu.style.transform = 'translateY(0)';
                    }
                });

                dropdown.addEventListener('mouseleave', () => {
                    if (window.innerWidth > 768) {
                        menu.style.opacity = '0';
                        menu.style.visibility = 'hidden';
                        menu.style.transform = 'translateY(10px)';
                    }
                });

                // Mobile click behavior
                toggle.addEventListener('click', (e) => {
                    if (window.innerWidth <= 768) {
                        e.preventDefault();
                        
                        // Close other dropdowns
                        document.querySelectorAll('.dropdown-menu').forEach(otherMenu => {
                            if (otherMenu !== menu) {
                                otherMenu.style.opacity = '0';
                                otherMenu.style.visibility = 'hidden';
                                otherMenu.style.transform = 'translateY(10px)';
                            }
                        });

                        // Toggle current dropdown
                        if (menu.style.visibility === 'visible') {
                            menu.style.opacity = '0';
                            menu.style.visibility = 'hidden';
                            menu.style.transform = 'translateY(10px)';
                        } else {
                            menu.style.opacity = '1';
                            menu.style.visibility = 'visible';
                            menu.style.transform = 'translateY(0)';
                        }
                    }
                });
            });

            // Close dropdowns when clicking outside
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.dropdown') && window.innerWidth <= 768) {
                    document.querySelectorAll('.dropdown-menu').forEach(menu => {
                        menu.style.opacity = '0';
                        menu.style.visibility = 'hidden';
                        menu.style.transform = 'translateY(10px)';
                    });
                }
            });
        } else {
            console.warn('No elements with class .dropdown-toggle found.');
        }
    }

    setupDropdowns();

    // ==========================================================================
    // Form Handling and Validation
    // ==========================================================================

    // Form input focus and blur animations
    if (formInputs.length > 0) {
        formInputs.forEach(input => {
            input.addEventListener('focus', () => {
                input.style.transform = 'translateY(-2px)';
            });

            input.addEventListener('blur', () => {
                input.style.transform = 'translateY(0)';
            });

            // Real-time validation on input
            input.addEventListener('input', () => {
                validateInput(input);
            });
        });
    }

    // Form submission with async fetch
   if (contactForm) {
    contactForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const form = e.target;
        const formData = new FormData(form);
        const submitButton = form.querySelector('button');
        const statusMessage = document.getElementById('form-status');

        submitButton.textContent = 'Sending...';
        submitButton.disabled = true;

        try {
            const { createClient } = Supabase;
            const supabase = createClient(window.env.SUPABASE_URL, window.env.SUPABASE_ANON_KEY);

            const name = DOMPurify.sanitize(formData.get('name')?.trim() || '');
            const email = DOMPurify.sanitize(formData.get('email')?.trim() || '');
            const message = DOMPurify.sanitize(formData.get('message')?.trim() || '');

            if (!/^[a-zA-Z\s]+$/.test(name) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || message.length < 2) {
                throw new Error('Invalid input data');
            }

            const { error } = await supabase.from('contacts').insert({
                name,
                email,
                message,
                created_at: new Date().toISOString()
            });

            if (error) throw error;

            statusMessage.textContent = 'Message sent successfully!';
            statusMessage.style.color = 'green';
            form.reset();
        } catch (error) {
            statusMessage.textContent = `Error sending message: ${error.message}. Please try again.`;
            statusMessage.style.color = 'red';
        }

        setTimeout(() => {
            submitButton.textContent = 'Send Message';
            submitButton.disabled = false;
            statusMessage.textContent = '';
        }, 3000);
    });
}

    // ==========================================================================
    // Animations
    // ==========================================================================

    // IntersectionObserver to trigger stats counter animation when section is visible
    if (statsSection) {
        const observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    counters.forEach(counter => {
                        const target = parseInt(counter.getAttribute('data-target'));
                        animateCounter(counter, target, 2000); // 2000ms duration
                    });
                    observer.unobserve(statsSection); // Stop observing after animation
                }
            });
        }, { threshold: 0.5 }); // Trigger when 50% of the section is visible

        observer.observe(statsSection);
    }

    // ==========================================================================
    // Utility Functions
    // ==========================================================================

    // Function to validate form inputs
    function validateInput(input) {
        const value = input.value.trim();

        if (input.type === 'email') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (emailRegex.test(value)) {
                input.classList.remove('invalid');
                input.classList.add('valid');
            } else {
                input.classList.remove('valid');
                input.classList.add('invalid');
            }
        } else if (input.type === 'tel') {
            const phoneRegex = /^\+?[\d\s-]{10,}$/;
            if (phoneRegex.test(value)) {
                input.classList.remove('invalid');
                input.classList.add('valid');
            } else {
                input.classList.remove('valid');
                input.classList.add('invalid');
            }
        } else {
            if (value.length > 2) {
                input.classList.remove('invalid');
                input.classList.add('valid');
            } else {
                input.classList.remove('valid');
                input.classList.add('invalid');
            }
        }
    }

    // Function to animate the counter with a "+" sign
    function animateCounter(element, target, duration) {
        let start = 0;
        const increment = target / (duration / 16); // 60 FPS (1000ms / 16ms per frame)
        const step = () => {
            start += increment;
            if (start >= target) {
                element.textContent = `+${Math.floor(target)}`;
                return;
            }
            element.textContent = `+${Math.floor(start)}`;
            requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }
});