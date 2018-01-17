jQuery(document).ready(function($) {
    // Main navigation actions
    $('[data-toggle="open-nav"]').click(function () {
        $('.navigation').addClass('active')
        $('.overlay').addClass('overlay-active')
    });
    // overlay
    $('[data-toggle="close-overlay"]').click(function () {
        $('.navigation').removeClass('active')
        $('.overlay').removeClass('overlay-active')
    });
    // Main Dropdown JS
    $('.dropdown').click(function () {
        $(this).toggleClass('open');
    });
});
