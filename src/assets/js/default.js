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


// iframes
(function(document){

    'use strict';

    function debounce(func, wait, immediate) {
        var timeout;
        return function() {
            var context = this, args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(function() {
                timeout = null;
                if (!immediate) func.apply(context, args);
            }, wait);
            if (immediate && !timeout) func.apply(context, args);
        };
    }

    function forEachIframe(callback) {
        if (iframes.length > 0) {
            for (var i = 0; i < iframes.length; i++) {
                var iframe = iframes[i];
                if (iframe.className.indexOf('dont-resize') !== -1) {
                    iframes.splice(i, 1);
                } else {
                    callback(iframe);
                }
            }
            iframe = undefined;
        }
    }

    function resizeIframes() {
        forEachIframe(function(iframe) {
            var maxWidth = iframe.parentElement.getBoundingClientRect().width,
            ratio = iframe.height / iframe.width,
            height = maxWidth * ratio;
            iframe.style.height = height + 'px';
            iframe.style.width = '100%';
        });
    }

    var iframeDoms = document.getElementsByTagName('iframe'),
        iframes    = Array.prototype.slice.call( iframeDoms );

    window.onload = resizeIframes();
    window.onresize = debounce(resizeIframes, 100);

})(document);
