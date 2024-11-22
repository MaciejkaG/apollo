function toggleDarkMode(btn) {
    $(btn).toggleClass('active');

    if ($(btn).hasClass('active')) { // Dark mode on
        window.backend.settings.set('ui.darkMode', true);
    } else { // Dark mode off (light mode)
        window.backend.settings.set('ui.darkMode', false);
    }

    refreshDarkMode();
}