window.addEvent('load', function () {
	$('login-button').addEvent('click', function () {
		var xhr;
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
				console.log(response);
			},
			onFailure: function () {
				$('login-password').value = '';
			}
		}).send();
	});
});