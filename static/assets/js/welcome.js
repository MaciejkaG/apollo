const loader = document.getElementById('welcome');
const welcomeText = document.getElementById('welcomeText');

window.addEventListener('load', async () => {
    // Activate dark theme if it's enabled in the config.
    const darkModeActive = await window.backend.misc.getDarkTheme();
    if (darkModeActive) {
        $(document.body).addClass('dark-mode');
        $('#darkModeButton').toggleClass('active');
    }

    // Startup animation
    setTimeout(() => {
        loader.classList.add('hidden');
    }, 500);
});