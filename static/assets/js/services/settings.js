// Change categories here
$('#settings .categories span').on('click', function(e) {
    $('#settings .categories span').removeClass('active');
    $(e.target).addClass('active');
});