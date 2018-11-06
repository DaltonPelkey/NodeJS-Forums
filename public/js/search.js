$($('input[name="search"]')[0]).attr('data-shown', 'false').hide();
$('.container .section').masonry({
    itemSelector: '.user_card',
    columnWidth: 30,
    percentPosition: true
});

$(document).ready(function() {
    $('.container .loading').fadeOut(500, function() {
        $('.container .content').css('opacity', '1');
    });
});
