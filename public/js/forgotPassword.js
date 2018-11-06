var loading = false;

$(document).ready(function(){
	$("#forgot_password_form .input_container input").focusout(function(){
		if( $(this).val() != "" ) {
			$(this).addClass("has-content");
		} else {
			$(this).removeClass("has-content");
		}
	});

	$("#send_button").on('click', function(e) {
		e.preventDefault();

		if (loading) return;

		var email = $('input[name="email"]').val().trim();

		if (!email || email == '') return errInput($('input[name="email"]'));

		$(this).html("<i class='fas fa-spinner fa-pulse'></i>");
		$(this).addClass('disabled');
		loading = true;

		$.post('/account/checkExisting', { email: email }, function(data) {
			if (data == true) {
				sendPasswordReset(email);

				$('#error_box').fadeOut(200, function() {
					var errBody = $('#error_box .error_box__body ul');
					errBody.html("");
				});
			} else {
				errInput($('input[name="email"]'));
				$("#send_button").html('Send <span><i class="far fa-share-square"></i></span>');
				$("#send_button").removeClass('disabled');
				loading = false;
				return showErrorBox(['The email provided does not exist on our servers.']);
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

function showSuccess() {
    $('#forgot_password_container .forgot_password_container__body').html("<p class='success'>Success!<br><span>Check your inbox for an email with instructions on how to reset your password.</span></p>");
}

function sendPasswordReset(email) {
    $.post('/account/forgot', {email, email}, function(data) {
        console.log(data)
        if (data == true) return showSuccess();
        return showErrorBox(data);
    });
}

function errInput(el) {
	$(el).parent().find('.focus-border').addClass('error');
	$(el).parent().find('label').addClass('error');
}

function resetInput(el) {
	$(el).parent().find('.focus-border').removeClass('error');
	$(el).parent().find('label').removeClass('error');
}

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
