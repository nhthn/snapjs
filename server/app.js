var fs = require('fs');
	express = require('express'),
	session = require('express-session'),
	SnapCloud = require('./cloud').Cloud,
	hex_sha512 = require('./sha512');

var app = express();

var cloudCount = 1;
var clouds = [];

app.configure(function () {
	app.use(express.static(__dirname + '/public'));
	app.use(express.cookieParser());
	app.use(express.bodyParser());
	app.use(session({ secret: 'blehhhh' }));
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
	var cloud, cloudID;
	cloudID = cloudCount;
	cloud = clouds[cloudID] = new SnapCloud('https://snapcloud.miosoft.com/miocon/app/login?_app=SnapCloud');
	cloudCount += 1;
	cloud.login(req.body.username, hex_sha512(req.body.password), function () {
		cloud.getProjectList(function (projects) {
			req.session.cloudID = cloudID;
			res.send({ projects: processProjectList(projects) });
		}, function () {
			res.send({ error: Array.prototype.slice.call(arguments) });
		});
	}, function () {
		res.send({ error: Array.prototype.slice.call(arguments) });
	});
});

app.post('/project', function (req, res) {
	var cloudID = req.session.cloudID, cloud;
	if (!cloudID) {
		res.send({ error: 'not logged in' });
	} else {
		cloud = clouds[cloudID];
		console.log(cloud);
		cloud.reconnect(function () {
			cloud.callService(
				'getProject',
				function (response) {
					var source;
					cloud.disconnect();
					source = response[0].SourceCode;
					res.send({ success: 'bla' });
				},
				function () { res.send({ error: Array.prototype.slice.call(arguments) }); },
				[req.body.name]
			);
		}, function () {
			res.send({ error: Array.prototype.slice.call(arguments) });
		});
	}
});

app.listen(3000);