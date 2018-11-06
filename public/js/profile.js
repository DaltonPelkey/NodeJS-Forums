$(document).ready(function() {
    $('#follow_button').on('click', function() {
        var to_id = $(this).attr('data-to-id');
        var from_id = $(this).attr('data-from-id');
        var action = $(this).attr('data-action');
        var currentFollowCount = parseInt($('#followCount').html());

        if ($(this).hasClass('disabled')) return;
        if (to_id == from_id) return;
        if (from_id == 'false') return window.location = '/account/login';

        if (action == 'follow') {
            $.post('/profile/follow', {to: to_id, from: from_id});
            $(this).attr('data-action', 'unfollow');
            $(this).html('unfollow');
            $('#followCount').html(currentFollowCount + 1);
        } else {
            $.post('/profile/unfollow', {to: to_id, from: from_id});
            $(this).attr('data-action', 'follow');
            $(this).html('follow');
            $('#followCount').html(currentFollowCount - 1);
        }
    });
});
