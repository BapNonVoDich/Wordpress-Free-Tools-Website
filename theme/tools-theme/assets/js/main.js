/**
 * Tools Theme Main JavaScript
 */

(function() {
    'use strict';
    
    // Mobile menu toggle (if needed)
    const initMobileMenu = () => {
        const nav = document.querySelector('.main-navigation');
        if (!nav) return;
        
        // Add mobile menu toggle button if needed
        // This can be enhanced based on design requirements
    };
    
    // Smooth scroll for anchor links
    const initSmoothScroll = () => {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                const href = this.getAttribute('href');
                if (href === '#') return;
                
                const target = document.querySelector(href);
                if (target) {
                    e.preventDefault();
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    };
    
    // Initialize on DOM ready
    document.addEventListener('DOMContentLoaded', () => {
        initMobileMenu();
        initSmoothScroll();
    });
    
})();

