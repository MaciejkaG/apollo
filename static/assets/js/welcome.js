const loader = document.getElementById('welcome');
const welcomeText = document.getElementById('welcomeText');

welcomeText.style = 'display: none';
window.addEventListener('load', async () => {
    refreshDarkMode();

    welcomeText.style = '';
    animaText(welcomeText);
    // Startup animation
    setTimeout(() => {
        loader.classList.add('hidden');
    }, 800);
});

async function refreshDarkMode() {
    // Activate dark theme if it's enabled in the config.
    const darkModeActive = await window.backend.settings.get('ui.darkMode');

    if (darkModeActive) {
        $(document.documentElement).addClass('dark-mode');
        $('#darkModeButton').addClass('active');
        document.getElementById('darkModeSetting').checked = true;
    } else {
        $(document.documentElement).removeClass('dark-mode');
        $('#darkModeButton').removeClass('active');
        document.getElementById('darkModeSetting').checked = false;
    }
}

let ellipsisCount = 0;
setInterval(() => {
    ellipsisCount++;
    if (ellipsisCount > 3) ellipsisCount = 0;
    $('.animated-ellipsis').html('.'.repeat(ellipsisCount))
}, 500);