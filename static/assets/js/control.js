function toggleDarkMode(btn) {
    $(btn).toggleClass('active');

    if ($(btn).hasClass('active')) { // Dark mode on
        $('body').addClass('dark-mode');
        window.backend.misc.setDarkTheme(1);
    } else { // Dark mode off (light mode)
        $('body').removeClass('dark-mode');
        window.backend.misc.setDarkTheme(0);
    }
}