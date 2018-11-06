var loading = false;

$(document).ready(function(){
	$("#login_form .input_container input").focusout(function(){
		if( $(this).val() != "" ) {
			$(this).addClass("has-content");
		} else {
			$(this).removeClass("has-content");
		}
	});

	$("#next_button").on('click', function(e) {
		e.preventDefault();

		if (loading || $(this).attr('onclick') == 'submitLogin()') return;

		var email = $('input[name="email"]').val().trim();

		if (!email || email == '') return errInput($('input[name="email"]'));

		$(this).html("<i class='fas fa-spinner fa-pulse'></i>");
		$(this).addClass('disabled');
		loading = true;

		$.post('/account/checkExisting', { email: email }, function(data) {
			if (data == true) {
				continueLogin();
				$("#next_button").html('Next <span><i class="fas fa-arrow-right"></i></span>');
				$("#next_button").removeClass('disabled');
				loading = false;
				resetInput($('input[name="email"]'));

				$('#error_box').fadeOut(200, function() {
					var errBody = $('#error_box .error_box__body ul');
					errBody.html("");
				});
			} else {
				errInput($('input[name="email"]'));
				$("#next_button").html('Next <span><i class="fas fa-arrow-right"></i></span>');
				$("#next_button").removeClass('disabled');
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

function submitLogin() {
	if (loading) return;

	$('#next_button').html("<i class='fas fa-spinner fa-pulse'></i>");
	$('#next_button').addClass('disabled');
	loading = true;

	var user = {
		email: $('input[name="email"]').val().trim(),
		password: $('input[name="password"]').val().trim()
	};

	$.ajax({
		type: "POST",
		url: "/account/login",
		data: user,
		success: handleLoginResponse,
	});
}

function handleLoginResponse(data) {
	if (data == true) {
		window.location = document.referrer == "https://indicacorp.net/account/register" ? "/" : document.referrer;
	} else {
		$("#next_button").html('Login <span><i class="fas fa-sign-in-alt"></i></span>');
		$("#next_button").removeClass('disabled');
		loading = false;
		showErrorBox(data);
	}
}

function continueLogin() {
	$('#login_container .email_input').hide('slide', {direction: 'left'}, 200, function() {
		$('#login_container .password_input').show('slide', {direction: 'right'}, 200);
		$('#next_button').html('Login <span><i class="fas fa-sign-in-alt"></i></span>').attr('onclick', 'submitLogin()');
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
