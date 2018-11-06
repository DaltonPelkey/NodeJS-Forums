var loading = false;

$(document).ready(function(){
	$("#register_form .input_container input").focusout(function(){
		if( $(this).val() != "" ) {
			$(this).addClass("has-content");
		} else {
			$(this).removeClass("has-content");
		}
	});

	$('input').focusout(function() {
		var name = $(this).attr('name');
		var value = $(this).val().trim();

		if (value == '') return resetInput($(this));

		switch(name) {
			case 'fname':
			case 'lname':
				if (!validateName(value)) return errInput($(this));
				return resetInput($(this));
			break;
			case 'username':
				var $this = $(this);
				if (!validateUsername(value)) return errInput($this);
				$.post('/account/checkExisting', { username: value }, function(data) {
					if (data == true) {
						return errInput($this);
					} else {
						return resetInput($this);
					}
				});
			break;
			case 'email':
				var $this = $(this);
				if (!validateEmail(value)) return errInput($this);
				$.post('/account/checkExisting', { email: value }, function(data) {
					if (data == true) {
						return errInput($this);
					} else {
						return resetInput($this);
					}
				});
			break;
			case 'password':
			case 'cpassword':
				if (!validatePassword(value)) return errInput($(this));
				return resetInput($(this));
			break;
		}
	});

	$('#register_button').on('click', function(e) {
		e.preventDefault();

		if (loading) return;

		$(this).html("<i class='fas fa-spinner fa-pulse'></i>");
		$(this).addClass('disabled');
		loading = true;


		var user = {
			fname: $("#register_form input[name='fname']").val().trim(),
			lname: $("#register_form input[name='lname']").val().trim(),
			username: $("#register_form input[name='username']").val().trim(),
			email: $("#register_form input[name='email']").val().trim(),
			password: $("#register_form input[name='password']").val().trim(),
			cpassword: $("#register_form input[name='cpassword']").val().trim()
		};

		isInputErrors(user, function(errors) {
			if (errors && errors.length > 0) {
				$("#register_button").html('Create Account <span><i class="fas fa-arrow-right"></i></span>');
				$("#register_button").removeClass('disabled');
				loading = false;
				return showErrorBox(errors);
			}
			return submitRegistration(user);
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

function submitRegistration(user) {
	$.ajax({
		type: "POST",
		url: "/account/register",
		data: user,
		success: handleRegistrationResponse,
	});
}

function handleRegistrationResponse(data) {
	if (data == true) {
		window.location = '/account/login';
	} else {
		$("#register_button").html('Create Account <span><i class="fas fa-arrow-right"></i></span>');
		$("#register_button").removeClass('disabled');
		loading = false;
		showErrorBox(data);
	}
}

function errInput(el) {
	$(el).parent().find('.focus-border').addClass('error');
	$(el).parent().find('label').addClass('error');
}

function resetInput(el) {
	$(el).parent().find('.focus-border').removeClass('error');
	$(el).parent().find('label').removeClass('error');
}

function isInputErrors(user, cb) {
	var errors = [];

	if (!validateName(user.fname)) errors.push("First name must be between 2-20 characters.");
	if (!validateName(user.lname)) errors.push("Last name must be between 2-20 characters.");
	if (!validateUsername(user.username)) errors.push("Username must be between 2-20 characters, must be alphanumeric, and may only contain underscores and periods.");
	if (!validateEmail(user.email)) errors.push("Email is invalid.");
	if (!validatePassword(user.password)) errors.push("Password must be between 8-60 characters.");
	if (user.password !== user.cpassword) errors.push("Passwords do not match.");

	if (errors.length > 0) {
		return cb(errors);
	} else {
		$.post('/account/checkExisting', { username: user.username }, function(data) {
			if (data == true) errors.push("That username exists already.");
			$.post('/account/checkExisting', { email: user.email }, function(data) {
				if (data == true) errors.push("That email exists already.");
				return cb(errors);
			});
		});
	}
}

function validatePassword(password) {
	if (!password || password.length < 1) return false;
	if (password && password.checkLength(8, 60) && !/\s/.test(password)) return true;
	return false;
}

function validateEmail(email) {
	if (!email || email.length < 1) return false;
	if (email && email.indexOf('@') > -1 && email.checkLength(8, 255) && !/\s/.test(email)) return true;
	return false;
}

function validateUsername(username) {
	if (!username || username.length < 1) return false;
	if (username && /^(?![_.])(?!.*[_.]{2})[a-zA-Z0-9._]+(?<![_.])$/.test(username) && username.checkLength(3, 20) && !/\s/.test(username)) return true;
	return false;
}

function validateName(name) {
	if (!name || name.length < 1) return false;
	if (name.checkLength(2, 20)) return true;
	return false;
}

String.prototype.checkLength = function (min, max) {
	if (this.length < min || this.length > max) return false;
	return true;
}
