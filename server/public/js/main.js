function loginError(str) {
	$('login-error').set('text', str);
}

window.addEvent('load', function () {
	$('login-button').addEvent('click', function () {
		new Request.JSON({
			url: '/login',
			method: 'post',
			data: {
				username: $('login-username').value,
				password: $('login-password').value
			},
			onRequest: function () {
				console.log('...');
			},
			onSuccess: function (response) {
				if (response.error) {
					loginError(response.error.join('\n'));
				} else {
					console.log(response);
				}
			},
			onFailure: function (xhr) {
				loginError(xhr.status);
			},
			onComplete: function () {
				$('login-password').value = '';
			}
		}).send();
	});
});