function animateContentChange(contentCategoryId) {
    // Set category buttons
    $('#settings .categories .category').removeClass('active');
    $(`#settings .categories .category[data-category-id="${contentCategoryId}"]`).addClass('active');

    // Step 1: Animate content out of view
    anime.remove('#settings .content');
    anime({
        targets: '#settings .content',
        scale: .95,
        opacity: 0,
        easing: 'easeInCubic',
        duration: 200,
        complete: function () {
            // Place for content-changing logic
            // This will be called after the content is out of view
            // Example:
            setContentCategory(contentCategoryId);

            // Step 2: Animate content back to original position
            anime({
                targets: '#settings .content',
                scale: [.95, 1],
                opacity: 1,
                easing: 'easeOutCubic',
                duration: 200,
            });
        }
    });
}

function setContentCategory(id) {
    $('#settings .content .category').hide();
    $(`#settings .content .category#${id}`).show();
}

// Call the function on category click
$('#settings .categories .category').on('click', function (e) {
    animateContentChange($(e.target).data('category-id'));
});

$(window).on('load', function() {
    $('#settings .categories .category:first-child').click();
});