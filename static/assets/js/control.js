function toggleDarkMode(btn) {
    $(btn).toggleClass('active');

    if ($(btn).hasClass('active')) { // Dark mode on
        $('body').addClass('dark-mode');
    } else {
        $('body').removeClass('dark-mode');
    }
}