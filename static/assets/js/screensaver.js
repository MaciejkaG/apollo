const container = document.getElementById('uiContainer');
const appsContainer = document.getElementById('apps');
const screensaver = document.getElementById('screensaver');

// Constants for timings
//const IDLE_FADE_TIME = 50000;                            // Seconds of idle required to start fading
//const SCREENSAVER_TIME = 60000;                          // Seconds of idle required to activate screensaver

const IDLE_FADE_TIME = 5000;                            // Seconds of idle required to start fading
const SCREENSAVER_TIME = 10000;                          // Seconds of idle required to activate screensaver
const FADE_DURATION = SCREENSAVER_TIME - IDLE_FADE_TIME; // Fade-out duration
const BLUR_AMOUNT = 10;                                  // Maximum blur in pixels
const MIN_SCALE = 0.7;                                   // Minimum scale of the container

// Track idle time and timeout IDs
let idleTimeout, screensaverTimeout;

// Set up the screensaver background
$('#screensaver canvas').gradient({
    colors: ['#a20000', '#1d82ff', '#701dff']
});

let resettingContainer = false;
// Function to reset idle time
function resetIdleTimer() {
    if (resettingContainer) return;

    // Clear existing timeouts
    clearTimeout(idleTimeout);
    clearTimeout(screensaverTimeout);

    // Restore container properties if active animations are present
    anime.remove(container); // Cancel any ongoing animation
    anime.remove(appsContainer); // Cancel any ongoing animation
    resettingContainer = true;
    anime({
        targets: [container, appsContainer],
        scale: 1,
        opacity: [1],
        filter: 'blur(0px)',
        duration: 500,
        easing: 'easeOutQuad',
        complete: () => {
            container.style = '';

            appsContainer.style.transform = '';
            appsContainer.style.filter = '';
            appsContainer.style.opacity = '';

            resettingContainer = false;
        }
    });

    // Deactivate screensaver
    screensaver.classList.remove('active');

    // Restart idle timers
    idleTimeout = setTimeout(startFade, IDLE_FADE_TIME);
    screensaverTimeout = setTimeout(activateScreensaver, SCREENSAVER_TIME);
}

// Function to start fading (blur, scale down, fade out) effect
function startFade() {
    anime({
        targets: [container, appsContainer],
        scale: MIN_SCALE,
        filter: `blur(${BLUR_AMOUNT}px)`,
        opacity: 0.05,
        duration: FADE_DURATION, // Smooth transition to match screensaver timing
        easing: 'easeInOutSine'
    });
}

// Function to activate the screensaver
function activateScreensaver() {
    screensaver.classList.add('active');
}

// Event listeners to reset idle time on user interactions
['mousemove', 'keydown', 'mousedown', 'touchstart'].forEach(event => {
    document.addEventListener(event, resetIdleTimer);
});

// Initialize idle timer
resetIdleTimer();