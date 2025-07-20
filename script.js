// Cursor Glow Effect (Desktop only)
const cursorGlow = document.querySelector('.cursor-glow');
let mouseX = 0, mouseY = 0;
let glowX = 0, glowY = 0;

// Only enable cursor glow on non-touch devices
const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

if (!isTouchDevice && cursorGlow) {
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        cursorGlow.style.opacity = '1';
    });

    // Smooth cursor follow
    function animateCursor() {
        glowX += (mouseX - glowX) * 0.1;
        glowY += (mouseY - glowY) * 0.1;
        
        cursorGlow.style.left = glowX + 'px';
        cursorGlow.style.top = glowY + 'px';
        
        requestAnimationFrame(animateCursor);
    }
    animateCursor();
} else if (cursorGlow) {
    // Hide cursor glow on touch devices
    cursorGlow.style.display = 'none';
}

// Intersection Observer for scroll animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            
            // Animate numbers in truth cards
            if (entry.target.classList.contains('truth-card')) {
                const number = entry.target.querySelector('.truth-number');
                animateNumber(number);
            }
        }
    });
}, observerOptions);

// Observe elements
document.querySelectorAll('.story-beat, .truth-card, .difference-card, .testimonial').forEach(el => {
    observer.observe(el);
});

// Number animation
function animateNumber(element) {
    const target = element.textContent;
    const isPercentage = target.includes('%');
    const isDecimal = target.includes('.');
    const numericValue = parseFloat(target);
    
    let current = 0;
    const increment = numericValue / 50;
    const timer = setInterval(() => {
        current += increment;
        if (current >= numericValue) {
            current = numericValue;
            clearInterval(timer);
        }
        
        if (isDecimal) {
            element.textContent = current.toFixed(1) + (isPercentage ? '%' : 'x');
        } else {
            element.textContent = Math.floor(current) + (isPercentage ? '%' : '');
        }
    }, 30);
}

// Member stories carousel
const stories = document.querySelectorAll('.member-story');
let currentStory = 0;

function rotateStories() {
    stories.forEach(story => story.classList.remove('active'));
    currentStory = (currentStory + 1) % stories.length;
    stories[currentStory].classList.add('active');
}

setInterval(rotateStories, 4000);

// Form handling - only run if form exists
const form = document.getElementById('applicationForm');
let submitBtn = null;
if (form) {
    submitBtn = form.querySelector('.submit-application');

    form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    submitBtn.classList.add('loading');
    
    // Simulate submission
    setTimeout(() => {
        submitBtn.classList.remove('loading');
        
        // Create success message
        const successMessage = document.createElement('div');
        successMessage.className = 'success-overlay';
        successMessage.innerHTML = `
            <div class="success-content">
                <h2>🌱</h2>
                <h3>Application Received</h3>
                <p>We'll review your story within 24 hours.</p>
                <p class="success-note">Check your email for next steps.</p>
            </div>
        `;
        document.body.appendChild(successMessage);
        
        setTimeout(() => {
            successMessage.classList.add('show');
        }, 100);
        
        // Remove after 3 seconds
        setTimeout(() => {
            successMessage.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(successMessage);
            }, 500);
        }, 3000);
        
        form.reset();
    }, 2000);
    });
}

// Smooth scroll for CTA buttons
document.querySelectorAll('.cta-final').forEach(button => {
    button.addEventListener('click', () => {
        window.location.href = 'application.html';
    });
});

// Add parallax effect to opening screen and hide scroll hint
let scrollHintHidden = false;
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const openingContent = document.querySelector('.opening-content');
    const scrollHint = document.querySelector('.scroll-hint');
    
    // Hide scroll hint permanently after scrolling past 30% of viewport height
    if (scrollHint && scrolled > window.innerHeight * 0.3 && !scrollHintHidden) {
        scrollHint.style.opacity = '0';
        scrollHint.style.pointerEvents = 'none';
        scrollHintHidden = true;
        
        // Remove the element after animation completes
        setTimeout(() => {
            if (scrollHint && scrollHint.parentNode) {
                scrollHint.parentNode.removeChild(scrollHint);
            }
        }, 500);
    }
    
    if (openingContent && scrolled < window.innerHeight) {
        openingContent.style.transform = `translateY(${scrolled * 0.5}px)`;
        openingContent.style.opacity = 1 - (scrolled / window.innerHeight);
    }
});

// City spots ticker - duplicate content for seamless loop
const tickerContent = document.querySelector('.ticker-content');
if (tickerContent) {
    const clone = tickerContent.cloneNode(true);
    tickerContent.parentElement.appendChild(clone);
}

// Add hover effects to cards
document.querySelectorAll('.truth-card, .difference-card').forEach(card => {
    card.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-10px) scale(1.02)';
    });
    
    card.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0) scale(1)';
    });
});

// Story beats entrance animation
const storyBeats = document.querySelectorAll('.story-beat');
storyBeats.forEach((beat, index) => {
    beat.style.opacity = '0';
    beat.style.transform = 'translateX(-50px)';
    
    setTimeout(() => {
        beat.style.transition = 'all 0.6s ease';
        beat.style.opacity = '1';
        beat.style.transform = 'translateX(0)';
    }, 200 * index);
});


// Typewriter effect for tagline
const tagline = document.querySelector('.tagline');
if (tagline) {
    const text = tagline.textContent;
    tagline.textContent = '';
    tagline.style.opacity = '1';
    
    let i = 0;
    function typeWriter() {
        if (i < text.length) {
            tagline.textContent += text.charAt(i);
            i++;
            setTimeout(typeWriter, 50);
        }
    }
    
    // Start typewriter after logo animation
    setTimeout(typeWriter, 1200);
}

// Form field animations
const formInputs = document.querySelectorAll('input, select, textarea');
formInputs.forEach(input => {
    input.addEventListener('focus', function() {
        this.parentElement.style.transform = 'scale(1.02)';
    });
    
    input.addEventListener('blur', function() {
        this.parentElement.style.transform = 'scale(1)';
    });
});

// Loading messages
const loadingMessages = [
    "Reading your story...",
    "Finding your people...",
    "Cultivating connections...",
    "Growing possibilities..."
];

let messageIndex = 0;
if (submitBtn) {
    submitBtn.addEventListener('click', function() {
        const loadingText = this.querySelector('.btn-loading');
        if (loadingText) {
            loadingText.textContent = loadingMessages[messageIndex % loadingMessages.length];
            messageIndex++;
        }
    });
}

// Mobile-specific UX improvements
if (isTouchDevice) {
    // Disable parallax on mobile for better performance
    const parallaxHandler = window.addEventListener;
    window.addEventListener = function(type, handler, options) {
        if (type === 'scroll' && handler.toString().includes('parallax')) {
            return; // Skip parallax scroll handlers on mobile
        }
        return parallaxHandler.call(this, type, handler, options);
    };
    
    // Add touch-friendly interactions
    document.querySelectorAll('.truth-card, .difference-card, .testimonial').forEach(card => {
        card.addEventListener('touchstart', function() {
            this.style.transform = 'scale(0.98)';
        });
        
        card.addEventListener('touchend', function() {
            this.style.transform = 'scale(1)';
        });
    });
    
    // Redirect to application for mobile navigation
    document.querySelectorAll('.cta-final').forEach(button => {
        button.addEventListener('touchend', function(e) {
            e.preventDefault();
            window.location.href = 'application.html';
        });
    });
    
    // Mobile scroll hint is handled by the main scroll handler above
}

// Improved form validation for mobile
const mobileFormInputs = document.querySelectorAll('input, select, textarea');
mobileFormInputs.forEach(input => {
    // Prevent zoom on focus for iOS
    if (isTouchDevice) {
        input.addEventListener('focus', function() {
            this.style.fontSize = '16px';
        });
    }
    
    // Better error handling
    input.addEventListener('invalid', function(e) {
        e.preventDefault();
        this.classList.add('error');
        
        // Remove error state after user starts typing
        this.addEventListener('input', function() {
            this.classList.remove('error');
        }, { once: true });
    });
});

// Performance optimizations for mobile
if (isTouchDevice) {
    // Reduce animation complexity on mobile
    const style = document.createElement('style');
    style.textContent = `
        @media (max-width: 768px) {
            * {
                animation-duration: 0.3s !important;
                transition-duration: 0.3s !important;
            }
            
            .cursor-glow {
                display: none !important;
            }
            
            .input.error {
                border-color: #ff4444;
                animation: shake 0.3s ease-in-out;
            }
            
            @keyframes shake {
                0%, 100% { transform: translateX(0); }
                25% { transform: translateX(-5px); }
                75% { transform: translateX(5px); }
            }
        }
    `;
    document.head.appendChild(style);
}

// FAQ Accordion Functionality - Run after page fully loads
window.addEventListener('load', function() {
    setTimeout(() => {
        const faqQuestions = document.querySelectorAll('.faq-question');
        
        if (faqQuestions.length > 0) {
            console.log(`Found ${faqQuestions.length} FAQ questions`);
            
            faqQuestions.forEach((question, index) => {
                question.style.cursor = 'pointer';
                
                question.addEventListener('click', function(e) {
                    e.preventDefault();
                    console.log(`FAQ ${index + 1} clicked`);
                    
                    const faqItem = this.parentElement;
                    const isActive = faqItem.classList.contains('active');
                    
                    // Close all FAQ items
                    document.querySelectorAll('.faq-item').forEach(item => {
                        item.classList.remove('active');
                    });
                    
                    // Open clicked item if it wasn't active
                    if (!isActive) {
                        faqItem.classList.add('active');
                        console.log(`FAQ ${index + 1} opened`);
                    } else {
                        console.log(`FAQ ${index + 1} closed`);
                    }
                });
            });
        } else {
            console.warn('No FAQ questions found on page');
        }
    }, 100);
});

// Smooth scroll for footer links (since they're placeholder links)
document.querySelectorAll('.footer-links a').forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Show a simple alert for now since these are placeholder links
        const linkText = this.textContent;
        
        if (linkText === 'Privacy Policy') {
            alert('Privacy Policy: We take your privacy seriously. Your data is encrypted, never sold, and used only to help you find meaningful connections.');
        } else if (linkText === 'Terms of Service') {
            alert('Terms of Service: By using Planted, you agree to be respectful, authentic, and committed to plant-based values. Full terms available after signup.');
        } else if (linkText === 'Contact') {
            alert('Contact us at: hello@planted.app\n\nWe read every message personally and typically respond within 24 hours.');
        } else if (linkText === 'Security') {
            alert('Security: SSL encryption, GDPR compliance, video verification, and US-based servers ensure your safety and privacy.');
        }
    });
});

// Add smooth scrolling to work steps for better UX
document.querySelectorAll('.work-step').forEach((step, index) => {
    step.style.opacity = '0';
    step.style.transform = 'translateY(30px)';
    
    setTimeout(() => {
        step.style.transition = 'all 0.6s ease';
        step.style.opacity = '1';
        step.style.transform = 'translateY(0)';
    }, 300 * index);
});

// Add intersection observer for trust badges
const trustObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.animationDelay = `${Math.random() * 0.5}s`;
            entry.target.classList.add('fade-in-up');
        }
    });
}, { threshold: 0.3 });

document.querySelectorAll('.trust-badge').forEach(badge => {
    trustObserver.observe(badge);
});