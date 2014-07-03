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
					onLoginError(response.error.join(' '));
				} else {
					onLogin(response.projects);
				}
			},
			onFailure: function (xhr) {
				onLoginError(xhr.status);
			},
			onComplete: function () {
				$('login-password').value = '';
			}
		}).send();
	});
});

function onLoginError(str) {
	$('login-error').set('text', str);
}

function onLogin(projectList) {
	$('login-form').setStyle('display', 'none');
	projectList.each(function (project) {
		var li;
		new Element('li').adopt(
			new Element('h2', { text: project.name }),
			new Element('date', { datetime: project.date }),
			new Element('img', { src: project.thumbnail }),
			new Element('p', { src: project.notes })
		).inject($('project-list'));
	});
}