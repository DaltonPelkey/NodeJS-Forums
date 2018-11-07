var loading = false;

$(document).ready(function() {
    // Reorder Categories
    $(document).on('click', '#reorder_category_btn', function() {
        var html = "<button id='cancel_categories_btn'>Cancel</button><button id='save_categories_btn' title='Save personal category order.'><i class='far fa-save'></i> Save</button>";
        if (currentUser && currentUser.user_id) {
            if (perms.levels[currentUser.forum_role] >= perms.levels[perms.forums.reorder_default_category]) html += "<button id='save_categories_weight_btn' title='Save as the default order of categories for new members. This will not affect your saved order.'><i class='fas fa-save'></i> Save Default</button>";
        }
        $(this).parent().html(html);
        $(document.body).css('cursor', 'move');
        $('#category_sort').sortable();
    });

    $(document).on('click', '#save_categories_btn', function() {
        var html = '<button id="reorder_category_btn" title="Change the order in which categories appear for you."><i class="fas fa-arrows-alt"></i> Reorder Categories</button>';
        if (currentUser && currentUser.user_id) {
            if (perms.levels[currentUser.forum_role] >= perms.levels[perms.forums.create_forum]) html += '<button id="open_new_forum_modal"><i class="fas fa-folder-plus"></i> New Forum</button>';
        }
        $(this).parent().html(html);
        $(document.body).css('cursor', 'inherit');
        var categoryOrder = $('#category_sort').sortable('toArray', {attribute: 'data-category-id'});
        $('#category_sort').sortable('destroy');
        reorderCategories(categoryOrder);
    });

    $(document).on('click', '#save_categories_weight_btn', function() {
        var html = '<button id="reorder_category_btn" title="Change the order in which categories appear for you."><i class="fas fa-arrows-alt"></i> Reorder Categories</button>';
        if (currentUser && currentUser.user_id) {
            if (perms.levels[currentUser.forum_role] >= perms.levels[perms.forums.create_forum]) html += '<button id="open_new_forum_modal"><i class="fas fa-folder-plus"></i> New Forum</button>';
        }
        $(this).parent().html(html);
        $(document.body).css('cursor', 'inherit');
        var categoryOrder = $('#category_sort').sortable('toArray', {attribute: 'data-category-id'});
        $('#category_sort').sortable('destroy');
        reorderCategoryWeight(categoryOrder);
    });

    $(document).on('click', '#cancel_categories_btn', function() {
        var html = '<button id="reorder_category_btn" title="Change the order in which categories appear for you."><i class="fas fa-arrows-alt"></i> Reorder Categories</button>';
        if (currentUser && currentUser.user_id) {
            if (perms.levels[currentUser.forum_role] >= perms.levels[perms.forums.create_forum]) html += '<button id="open_new_forum_modal"><i class="fas fa-folder-plus"></i> New Forum</button>';
        }
        $(this).parent().html(html);
        $(document.body).css('cursor', 'inherit');
        $('#category_sort').sortable('cancel');
        $('#category_sort').sortable('destroy');
    });

    // Reorder Forums
    var defaultCategoryOptionBtns = $('.category_action_bar').first().html();
    $(document).on('click', '.reorder_forums_btn', function() {
        $this = $(this);
        var html = "<button class='cancel_reorder_forums_btn'>Cancel</button><button id='save_forums_btn' title='Save personal forum order.'><i class='far fa-save'></i> Save</button>";
        if (currentUser && currentUser.user_id) {
            if (perms.levels[currentUser.forum_role] >= perms.levels[perms.forums.create_forum]) html += "<button id='save_forums_weight_btn' title='Save as the default order of forums for new members. This will not affect your saved order.'><i class='fas fa-save'></i> Save Default</button>";
        }
        $(document.body).css('cursor', 'move');
        $this.parent().parent().css('border', '4px solid #226ECC');
        $this.parent().parent().find('.forum_sort').sortable();
        $this.parent().html(html);
    });

    $(document).on('click', '.cancel_reorder_forums_btn', function() {
        $this = $(this);
        $(document.body).css('cursor', 'inherit');
        $this.parent().parent().css('border', 'none');
        $this.parent().parent().children('.forum_sort').sortable('cancel');
        $this.parent().parent().children('.forum_sort').sortable('destroy');
        $this.parent().html(defaultCategoryOptionBtns);
    });

    $(document).on('click', '#save_forums_btn', function() {
        $this = $(this);
        $(document.body).css('cursor', 'inherit');
        $this.parent().parent().css('border', 'none');
        var forumOrder = $this.parent().parent().children('.forum_sort').sortable('toArray',  {attribute: 'data-forum-id'});
        $this.parent().parent().children('.forum_sort').sortable('destroy');
        $this.parent().html(defaultCategoryOptionBtns);
        reorderForums(forumOrder);
    });

    $(document).on('click', '#save_forums_weight_btn', function() {
        $this = $(this);
        $(document.body).css('cursor', 'inherit');
        $this.parent().parent().css('border', 'none');
        var forumOrder = $this.parent().parent().children('.forum_sort').sortable('toArray',  {attribute: 'data-forum-id'});
        $this.parent().parent().children('.forum_sort').sortable('destroy');
        $this.parent().html(defaultCategoryOptionBtns);
        reorderForumWeight(forumOrder);
    });

    // Delete Category
    $(document).on('click', '.delete_category_btn', function() {
        $this = $(this);
        var isSure = confirm("Are you sure you want to delete this category and all forums associated with it? This action can not be undone!");
        if (!isSure) return;
        deleteCategory($this.attr('data-category-id'));
    });

    // Rename Category
    $(document).on('click', '.rename_category_btn', function() {
        $this = $(this);
        var currentName = $this.parent().parent().find('.category_title span:first-of-type').html();
        var newName = prompt("Input a new name for this category.", currentName);
        if (newName == null) return;
        if (!validateTitle(newName)) return alert("The category title provided is invalid. Please try again.");
        renameCategory($this.attr('data-category-id'), newName, function() {
            $this.parent().parent().find('.category_title span:first-of-type').html(newName)
        });
    });

    // New Forum Modal
    $(document).on('click', '#close_new_forum_modal', function() {
        closeNewForumModal();
    });

    $(document).on('click', '#open_new_forum_modal', function() {
        openNewForumModal();
    });

    if ($('#new_forum_modal_form select option:last-of-type').is(':selected')) {
        $('#new_category').show();
        $('#new_category').next().html('Input the title of the new category. (Max 50 characters)');
    }

    $('#new_forum_modal_form select').on('change', function() {
        if ($(this).find('option:last-of-type').is(':selected')) {
            $('#new_category').show();
            $('#new_category').next().html('Input the title of the new category. (Max 50 characters)');
        } else {
            $('#new_category').hide();
            $('#new_category').next().html('Select a category for the new forum.');
        }
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

    $('#save_new_forum_button').on('click', function() {
        $('#save_new_forum_button').html("<i class='fas fa-spinner fa-pulse'></i>");
        var valid = true;
        var forum = {
            title: $('#new_forum_modal_form input[name="title"]').val().trim(),
            description: $('#new_forum_modal_form textarea[name="description"]').val().trim(),
            category: $('#new_forum_modal_form select[name="category"]').val().trim() == 'new category' ? $('#new_forum_modal_form input[name="new_category"]').val().trim() : $('#new_forum_modal_form select[name="category"]').val().trim(),
            locked: $('#new_forum_modal_form input[name="locked"]').is(':checked')
        };

        if (!validateTitle(forum.title)) {
            $('#new_forum_modal_form input[name="title"]').parent().addClass('invalid_title');
            valid = false;
        }
        if (!validateTitle(forum.category)) {
            $('#new_forum_modal_form input[name="new_category"]').parent().addClass('invalid_title');
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

function reorderForums(arr) {
    $.post('/forums/reorder', {forum_array: arr}, function(data) {
        if (data !== true) {
            alert('An error occurred and the forum order was not saved. Please try again later.');
        }
    });
}

function reorderForumWeight(arr) {
    $.post('/forums/reorderweight', {forum_array: arr}, function(data) {
        if (data !== true) {
            alert('An error occurred and the category order was not saved. Please try again later.');
        }
    });
}

function reorderCategoryWeight(arr) {
    $.post('/forums/category/reorderweight', {category_array: arr}, function(data) {
        if (data !== true) {
            alert('An error occurred and the category order was not saved. Please try again later.');
        }
    });
}

function reorderCategories(arr) {
    $.post('/forums/category/reorder', {category_array: arr}, function(data) {
        if (data !== true) {
            alert('An error occurred and the category order was not saved. Please try again later.');
        }
    });
}

function renameCategory(id, name, cb) {
    $.post('/forums/category', {category_id: id, name: name}, function(data) {
        if (data == true) {
            return cb();
        } else {
            alert('An error occurred and the forum category was not renamed. Please try again later.');
        }
    });
}

function deleteCategory(id) {
    $.ajax({
        url: '/forums/category?' + $.param({"category_id": id}),
        type: 'DELETE',
        success: function(data) {
            if (data == true) {
                window.location.reload(true);
            } else {
                alert('An error occurred and the forum category was not deleted. Please try again later.');
            }
        },
        error: function() {
            alert('An error occurred and the forum category was not deleted. Please try again later.');
        }
    });
}

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
