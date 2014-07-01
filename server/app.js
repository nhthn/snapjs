var fs = require('fs');
	express = require('express'),
	SnapCloud = require('./cloud').Cloud,
	hex_sha512 = require('./sha512');

var app = express();

app.configure(function () {
	app.use(express.static(__dirname + '/public'));
	app.use(express.cookieParser());
	app.use(express.bodyParser());
});

function processProjectList(projects) {
	return projects.map(function (p) {
		return {
			name: p.ProjectName,
			date: p.Updated,
			notes: p.Notes,
			public: p.Public,
			thumbnail: p.Thumbnail
		}
	});
}

app.post('/login', function (req, res) {
	var cloud;
	cloud = new SnapCloud('https://snapcloud.miosoft.com/miocon/app/login?_app=SnapCloud');
	cloud.login(req.body.username, hex_sha512(req.body.password), function () {
		cloud.getProjectList(function (projects) {
			console.log(processProjectList(projects));
			res.send({ projects: processProjectList(projects) });
		}, function () {
			res.send({ error: Array.prototype.slice.call(arguments) });
		});
	}, function () {
		console.log(arguments);
		res.send({ error: Array.prototype.slice.call(arguments) });
	});
});

app.listen(3000);