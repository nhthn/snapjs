function showOnly(section) {
	$$('body > div').setStyle('display', 'none');
	$(section).setStyle('display', 'block');
}

window.addEvent('load', function () {
	showOnly('login-form');

	$('login-button').addEvent('click', function () {
		new Request.JSON({
			url: '/login',
			method: 'post',
			data: {
				username: $('login-username').value,
				password: $('login-password').value
			},
			onRequest: function () {
				// display loading animation?
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

	$('source-return-button').addEvent('click', function () {
		showOnly('project-list-ctr');
	});
});

function onLoginError(str) {
	$('login-error').set('text', str);
}

function onLogin(projectList) {
	showOnly('project-list-ctr');
	projectList.each(function (project) {
		new Element('li')
			.adopt(
				new Element('img', { src: project.thumbnail, 'class': 'project-thumbnail' }),
				new Element('h2', { text: project.name, 'class': 'project-name' }),
				new Element('date', { text: 'Last updated ' + project.date, 'class': 'project-date' }),
				new Element('p', { text: project.notes, 'class': 'project-notes' }),
				new Element('button', {
					text: 'Select this project',
					'class': 'project-select',
					events: { click: function () { selectProject(project.name); } }
				})
			)
			.inject($('project-list'));
	});
}

function selectProject(name) {
	new Request.JSON({
		url: '/project',
		method: 'post',
		data: { name: name },
		onSuccess: function (response) {
			onReceiveJS(response.js);
		},
		onFailure: function (xhr) {
			console.log('error :(');
		}
	}).send();
}

function onReceiveJS(js) {
	showOnly('source-viewer');
	$('source').set('text', js);
}