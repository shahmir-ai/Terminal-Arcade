/*
// Simple orientation detection for Vibe Arcade
(function() {
    // Device detection
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    let orientationOverlay = null;
    
    // Function to check orientation and show/hide overlay
    function checkOrientation() {
        const isLandscape = window.innerWidth > window.innerHeight;
        
        if (orientationOverlay) {
            orientationOverlay.style.display = isMobile && !isLandscape ? 'flex' : 'none';
        }
    }
    
    // Initialize when DOM is loaded
    function init() {
        console.log('Initializing orientation detection...');
        
        // Get reference to overlay
        orientationOverlay = document.getElementById('orientation-overlay');
        
        // Create a rotate icon if it doesn't exist
        const img = document.querySelector('#orientation-overlay img');
        if (img && (!img.src || img.src === '')) {
            createRotateIcon();
        }
        
        // Listen for orientation/resize changes
        window.addEventListener('resize', checkOrientation);
        
        // Initial check
        checkOrientation();
        
        console.log('Orientation detection initialized, isMobile:', isMobile);
    }
    
    // Create a simple rotate icon using SVG if image is missing
    function createRotateIcon() {
        const svgNS = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(svgNS, "svg");
        svg.setAttribute("width", "80");
        svg.setAttribute("height", "80");
        svg.setAttribute("viewBox", "0 0 24 24");
        svg.setAttribute("fill", "#0F0");
        
        const path = document.createElementNS(svgNS, "path");
        path.setAttribute("d", "M7.34 6.41L.86 12.9l6.48 6.48 6.48-6.48-6.48-6.49zM3.69 12.9l3.66-3.66L11 12.9l-3.66 3.66-3.65-3.66zm15.67-6.26C17.61 4.88 15.3 4 13 4V.76L8.76 5 13 9.24V6c1.79 0 3.58.68 4.95 2.05 2.73 2.73 2.73 7.17 0 9.9C16.58 19.32 14.79 20 13 20c-.97 0-1.94-.21-2.84-.61l-1.49 1.49C10.02 21.62 11.51 22 13 22c2.3 0 4.61-.88 6.36-2.64 3.52-3.51 3.52-9.21 0-12.72z");
        
        svg.appendChild(path);
        
        const img = document.querySelector('#orientation-overlay img');
        img.replaceWith(svg);
    }
    
    // Initialize when DOM is loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
*/