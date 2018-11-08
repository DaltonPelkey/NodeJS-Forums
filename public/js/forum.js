var loading = false;

$(document).ready(function() {

    // New Forum Modal
    $(document).on('click', '#close_new_forum_modal', function() {
        closeNewForumModal();
    });

    $(document).on('click', '#open_new_forum_modal', function() {
        openNewForumModal();
    });

    $('#new_forum_modal_form input, #new_forum_modal_form textarea').on('change input', function() {
        var name = $(this).attr('name');
        var val = $(this).val().trim();

        if (name == 'title' || name == 'new_category') {
            if (!validateTitle(val)) {
                return $(this).parent().addClass('invalid_title');
            } else {
                return $(this).parent().removeClass('invalid_title');
            }
        } else if (name == 'description') {
            if (val.length > 100) $(this).val(val.substring(0,100));
            if (!validateDescription(val.substring(0,100))) {
                return $(this).parent().addClass('invalid_desc');
            } else {
                return $(this).parent().removeClass('invalid_desc');
            }
        }
    });

    $(document).on('click', '#save_new_forum_button', function() {
        $('#save_new_forum_button').html("<i class='fas fa-spinner fa-pulse'></i>");
        var valid = true;
        var forum = {
            title: $('#new_forum_modal_form input[name="title"]').val().trim(),
            description: $('#new_forum_modal_form textarea[name="description"]').val().trim(),
            locked: $('#new_forum_modal_form input[name="locked"]').is(':checked'),
            parent_forum_id: $('#new_forum_modal_form input[name="parent_forum_id"]').val()
        };

        if (!validateTitle(forum.title)) {
            $('#new_forum_modal_form input[name="title"]').parent().addClass('invalid_title');
            valid = false;
        }
        if (!validateDescription(forum.description)) {
            $('#new_forum_modal_form textarea[name="description"]').parent().addClass('invalid_desc');
            valid = false;
        }
        if (valid) {
            if (loading) return;
            loading = true;
            return submitNewForum(forum);
        } else {
            $('#save_new_forum_button').html('save forum <span><i class="far fa-save"></i></span>');
        }
    });
});

function submitNewForum(forum) {
    $.post('/forums', {forum: forum}, function(data) {
        if (data == true) {
            window.location.reload(true);
        } else {
            alert(data);
            loading = false;
        }
    });
}

function closeNewForumModal() {
    $('#new_forum_modal').fadeOut(200);
    $(document.body).css('overflow', 'auto');
}

function openNewForumModal() {
    $('#new_forum_modal').fadeIn(200);
    $(document.body).css('overflow', 'hidden');
}

function validateTitle(title) {
	if (!title || title.length < 1) return false;
	if (title.checkLength(3, 50)) return true;
	return false;
}

function validateDescription(desc) {
    if (!desc || desc.length < 1) return false;
	if (desc.checkLength(3, 100)) return true;
	return false;
}

String.prototype.checkLength = function (min, max) {
	if (this.length < min || this.length > max) return false;
	return true;
}
