// ==========================================================================
// DOM Manipulation and Initial Setup
// ==========================================================================

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

// Cache DOM elements for form handling
const contactForm = document.getElementById('contact-form');
const formInputs = contactForm.querySelectorAll('input, textarea');
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
});

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
});

// Enhanced mobile menu toggle with animation
mobileMenu.addEventListener('click', () => {
    navLinks.classList.toggle('active');
    mobileMenu.style.transform = navLinks.classList.contains('active') ? 'rotate(90deg)' : 'rotate(0)';
});

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
                mobileMenu.style.transform = 'rotate(0)';
            }
        }
    });
});

// Close dropdown menu when clicking outside
document.addEventListener('click', (e) => {
    const dropdown = document.querySelector('.dropdown');
    const isClickInside = dropdown.contains(e.target);

    if (!isClickInside) {
        dropdown.querySelector('.dropdown-menu').classList.remove('show');
    }
});

// ==========================================================================
// Form Handling and Validation
// ==========================================================================

// Form input focus and blur animations
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

// Form submission with async fetch
contactForm.addEventListener('submit', async function (e) {
    e.preventDefault(); // Prevent default form submission and page reload

    const form = e.target;
    const formData = new FormData(form);
    const submitButton = form.querySelector('button');

    // Show a loading state
    submitButton.textContent = 'Sending...';
    submitButton.disabled = true;

    try {
        const response = await fetch(form.action, {
            method: form.method,
            body: formData,
            headers: { 'Accept': 'application/json' }
        });

        if (response.ok) {
            statusMessage.textContent = 'Message sent successfully!';
            statusMessage.style.color = 'green';
            form.reset(); // Clear the form fields
        } else {
            statusMessage.textContent = 'Error sending message. Please try again.';
            statusMessage.style.color = 'red';
        }
    } catch (error) {
        statusMessage.textContent = 'Error sending message. Please try again.';
        statusMessage.style.color = 'red';
    }

    // Reset button state after 3 seconds
    setTimeout(() => {
        submitButton.textContent = 'Send Message';
        submitButton.disabled = false;
        statusMessage.textContent = '';
    }, 3000);
});

// ==========================================================================
// Animations
// ==========================================================================

// IntersectionObserver to trigger stats counter animation when section is visible
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
