function toggleDarkMode(btn) {
    $(btn).toggleClass('active');

    if ($(btn).hasClass('active')) { // Dark mode on
        $(document.documentElement).addClass('dark-mode');
        window.backend.misc.setDarkTheme(1);
    } else { // Dark mode off (light mode)
        $(document.documentElement).removeClass('dark-mode');
        window.backend.misc.setDarkTheme(0);
    }
}