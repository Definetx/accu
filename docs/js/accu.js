$(document).ready(function () {

    SphinxRtdTheme.Navigation.onScroll = function () { }

    if ($('li.current').length) {
        $('.wy-side-scroll').scrollTop(
            $('li.current').offset().top - $('.wy-side-scroll').offset().top - 120
        );
    }
})
