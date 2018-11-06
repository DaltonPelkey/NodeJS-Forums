$(document).ready(function() {
    $('.format_date').each(function(i, e) {
        var timestamp = new Date($(e).attr('data-timestamp'));
        var format = $(e).attr('data-format');


        if ($(e).attr('data-local') == 'true') {
            timestamp.setMinutes(timestamp.getMinutes() + timestamp.getTimezoneOffset());
        } else {
            timestamp = new Date(timestamp.toLocaleString());
        }

        if (format) {
            timestamp = moment(timestamp).format(format);
        } else {
            timestamp = moment(timestamp).fromNow();
        }

        if (timestamp == 'Invalid date') timestamp = 'N/A';

        $(e).html(timestamp);
    });

    $('input').each(function(i, e) {
        e = $(e);
        if (e.attr('name') == 'password' || e.attr('name') == 'username') return;
        e.attr('autocomplete', 'off');
    });

    // Profile Card
    var loadingUser = false;
    $('.username_hoverable').on('mouseenter', function() {
        if (loadingUser) return;
        var $this = $(this);
        var username = $this.attr('data-username');
        loadingUser = true;
        getUserProfile(username, function(user) {
            user = user[0];
            $profileCard = $('#profile_card');
            $profileCard.children(".profile_card__avatar").children('span').css('background-image', 'url(' + user.avatar + ')');
            $profileCard.css('background-image', 'linear-gradient( rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.3) ), url(' + user.cover + ')');
            $profileCard.find(".profile_card__username").html(user.username);
            $profileCard.find(".profile_card__bio").html(user.bio);
            $profileCard.find(".profile_card__stats span").html(user.reputation + ' reputation');
            $profileCard.find(".profile_card__forum_role").html(user.forum_role).addClass(user.forum_role.toLowerCase());
            $profileCard.position({
                of: $this,
                my: 'center bottom',
                at: 'center top',
                collision: 'flipfit'
            });
            $profileCard.stop().fadeTo(200, 1, function() {
                loadingUser = false;
            });
        });
    })
    $('.username_hoverable').on('mouseleave', function() {
        $('#profile_card').stop().fadeTo(200, 0, function() {
            loadingUser = false;
            $('#profile_card').position({
                of: $(document),
                my: 'right bottom',
                at: 'left top',
                collision: 'none'
            });
        });
    });
});

function getUserProfile(username, cb) {
    $.get("/api/v1/user/profile?username=" + username, function(response) {
        if (response.error) {
            return console.error(response.error);
        } else {
            return cb(response.data);
        }
    });
}
