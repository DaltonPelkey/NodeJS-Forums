var dropdownMenuShown = false;
var originalPageTitle = $('title').html();
var loading = false;

$(document).ready(function() {
    if ($('input[name="birthday"]').attr('data-birthday')) {
        var birthday = new Date($('input[name="birthday"]').attr('data-birthday'));
        birthday.setMinutes(birthday.getMinutes() + birthday.getTimezoneOffset());
        $('input[name="birthday"]').attr('value', moment(birthday).format('MM/DD/YYYY'))
    }

    $('.date_picker').datepicker();
    $('.date_picker').mask("00/00/0000", {placeholder: "__/__/____"});
    var settingsCache = $("#settings_form").serialize();
    var invalidImage = false;
    var invalidMinecraftName = false;

    $('#main_header .main_header__dropdown_btn').on('click', function(e) {
        e.stopPropagation();

        if (!dropdownMenuShown) {
            openMainMenu($(this));
        } else {
            closeMainMenu($(this));
        }
    });

    $(document).on('click', function(e) {
        if ($(e.target) !== $('#main_header .main_header__dropdown_menu')) {
            closeMainMenu($('#main_header .main_header__dropdown_btn'));
        }
    });

    $('#settings_btn').on('click', function() {
        showSettingsModal();
    });

    $('#close_settings_modal').on('click', function() {
        hideSettingsModal();
    });

    $('#settings_form input, #settings_form textarea').on('change input', function() {
        var newSettings = $('#settings_form').serialize();
        var name = $(this).attr('name');
        var currentValue = $(this).val().trim();

        if (newSettings !== settingsCache) {
            $('#save_settings_button').fadeIn(200);
        } else {
            $('#save_settings_button').fadeOut(200);
        }

        if (name == 'bio') {
            if (currentValue.length > 100) return $(this).val(currentValue.substring(0, 200));
        }

        if (name == 'minecraft_username') {
            if (currentValue.length > 0 && !validateMinecraftName(currentValue)) {
                $(this).parent().addClass('invalid_ign');
                invalidMinecraftName = true;
            }  else {
                $(this).parent().removeClass('invalid_ign');
                invalidMinecraftName = false;
            }
        }
    });

    $('#settings_form input[name="minecraft_username"]').on('change', function() {
        var $this = $(this);
        verifyMinecraftUsername($this.val(), function(exists) {
            if (!exists) {
                $this.parent().addClass('invalid_ign');
                invalidMinecraftName = true;
                alert('The provided Minecraft username does not exist.');
            } else {
                $this.parent().removeClass('invalid_ign');
                invalidMinecraftName = false;
            }
        });
    });

    $('#settings_form input.image_input').on('input', function() {
        var val = $(this).val();
        if (val.length > 0 && !validateUrl(val)) {
            $(this).parent().addClass('invalid_url');
            invalidImage = true;
        } else {
            $(this).parent().removeClass('invalid_url');
            invalidImage = false;
        }
    });

    $('#settings_form input.image_input').on('change', function() {
        var url = $(this).val().trim();
        var $this = $(this);
        if (url.length < 1) return;
        if (invalidImage) return;
        loading = true;
        validateImage(url, function(err) {
            if (err) {
                invalidImage = true;
                loading = false;
                alert(err);
            } else {
                loading = false;
                invalidImage = false;
            }
        });
    });

    $('#save_settings_button').on('click', function() {
        if (loading) return;
        if (validateSubmit(settingsCache, invalidImage, invalidMinecraftName)) {
            loading = true;
            $(this).html("<i class='fas fa-spinner fa-pulse'></i>");
            $(this).addClass("disabled");
            saveSettings(function(data) {
                if (data && data.length > 0) {
                    var string = '';
                    for(var i = 0; i < data.length; i++) {
                        string += data[i] + '\n';
                    }
                    loading = false;
                    $('#save_settings_button').html('save changes <i class="far fa-save"></i>');
                    $('#save_settings_button').removeClass("disabled");
                    alert(string);
                } else {
                    $('#save_settings_button').html('settings saved...');
                    setTimeout(function() {
                        loading = false;
                        $('#save_settings_button').html('save changes <i class="far fa-save"></i>');
                        $('#save_settings_button').removeClass("disabled");
                    }, 2000);
                }
            });
        }
    });

    $('input[name="search"]').on('focus', function() {
        var value = $(this).val();
        if (value == 'Search') $(this).val('');
    });

    $('input[name="search"]').on('focusout', function() {
        var value = $(this).val();
        if (value == '') $(this).val('Search');
    });

    $('input[name="search"]').on('keyup', function (e) {
        if (e.keyCode == 13) {
            var val = $(this).val();
            window.location = '/search?q=' + encodeURIComponent(val);
        }
    });

    $(window).scroll(function() {
        var searchBar = $('input[name="search"]');
        if (searchBar.attr('data-shown') == 'false') return;
        if ($(document).scrollTop() > 300) {
            searchBar.fadeOut(200);
        } else {
            searchBar.fadeIn(200);
        }
    });
});

function saveSettings(cb) {
    $.post('/profile/updateSettings', $("#settings_form").serialize(), function(data) {
        return cb(data);
    });
}

function validateSubmit(settingsCache, invalidImage, invalidMinecraftName) {
    if (settingsCache == $("#settings_form").serialize()) return false;
    if (invalidImage || invalidMinecraftName) return false;
    return true;
}

function validateImage(url, cb) {
    $.post('/uploads/validateImage', {url: url}, function(data) {
        if (data == true) return cb(null);
        return cb(data);
    });
}

function validateUrl(value) {
  return /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:[/?#]\S*)?$/i.test(value);
}

function showSettingsModal() {
    $('body').css('overflow', 'hidden');
    $('title').html('Settings | Indica');
    $('#settings_modal').fadeIn(200);
}

function hideSettingsModal() {
    $('body').css('overflow', 'inherit');
    $('title').html(originalPageTitle);
    $('#settings_modal').fadeOut(200);
}

function openMainMenu($this) {
    $this.find('i').addClass('fa-angle-up');
    $this.find('i').removeClass('fa-angle-down');
    $('#main_header .main_header__dropdown_menu').finish().show('slide', {direction: 'up'}, 200);
    dropdownMenuShown = true;
}

function closeMainMenu($this) {
    $this.find('i').removeClass('fa-angle-up');
    $this.find('i').addClass('fa-angle-down');
    $('#main_header .main_header__dropdown_menu').finish().hide('slide', {direction: 'up'}, 200);
    dropdownMenuShown = false;
}

function validateMinecraftName(name) {
	if (/^(?![_])(?!.*[_]{2})[a-zA-Z0-9_]+(?<![_])$/.test(name) && name.checkLength(3, 16)) return true;
	return false;
}

function verifyMinecraftUsername(name, cb) {
    if (name.length < 1) return cb(true);
    $.get("https://use.gameapis.net/mc/player/uuid/" + name, function(data) {
        if (data.error) return cb(false);
        return cb(true);
    });
}

String.prototype.checkLength = function (min, max) {
	if (this.length < min || this.length > max) return false;
	return true;
}
