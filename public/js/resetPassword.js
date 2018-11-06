var loading = false;

$(document).ready(function(){
	$("#reset_password_form .input_container input").focusout(function(){
		if( $(this).val() != "" ) {
			$(this).addClass("has-content");
		} else {
			$(this).removeClass("has-content");
		}
	});

	$("#reset_button").on('click', function(e) {
		e.preventDefault();

		if (loading) return;

        var password = $('input[name="password"]').val().trim();

		if (!password || password == '') return errInput($('input[name="email"]'));

		$(this).html("<i class='fas fa-spinner fa-pulse'></i>");
		$(this).addClass('disabled');
		loading = true;

        if (!validatePassword(password)) return showErrorBox(["Password must be between 8-60 characters."]);

        var user_id = $('input[name="user_id"]').val();
        var token = $('input[name="token"]').val();

		$.post('/account/resetPassword', { password: password, user_id: user_id, token: token }, function(data) {
			if (data == true) {
				$("#reset_password_container .reset_password_container__body").html("<p>Success!<br><span>Your password was successfully changed.</span></p>");
                setTimeout(function() {
                    window.location = '/account/login';
                }, 15000);
			} else {
				$("#reset_button").html('Reset <span><i class="fas fa-arrow-right"></i></span>');
				$("#reset_button").removeClass('disabled');
				loading = false;
				return showErrorBox(data);
			}
		});
	});

	$('#error_box .error_box__close_btn').on('click', function() {
		$('#error_box').fadeOut(200, function() {
			var errBody = $('#error_box .error_box__body ul');
			errBody.html("");
		});
	});
});

function showErrorBox(errors) {
	var errBody = $('#error_box .error_box__body');
	errBody.html("");

	errBody.append("<p>You must fix the following before proceeding:</p>");
	errBody.append("<ul></ul>");

	errors.forEach(function(e) {
		errBody.find('ul').append("<li>" + e + "</li>");
	});

	$('#error_box').fadeIn(200);
}

function errInput(el) {
	$(el).parent().find('.focus-border').addClass('error');
	$(el).parent().find('label').addClass('error');
}

function resetInput(el) {
	$(el).parent().find('.focus-border').removeClass('error');
	$(el).parent().find('label').removeClass('error');
}

function validatePassword(password) {
	if (!password || password.length < 1) return false;
	if (password && password.checkLength(8, 60) && !/\s/.test(password)) return true;
	return false;
}
String.prototype.checkLength = function (min, max) {
	if (this.length < min || this.length > max) return false;
	return true;
}
