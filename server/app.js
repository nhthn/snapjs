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
	var attr_whitelist = ['ProjectName', 'Updated', 'Notes', 'Public', 'Thumbnail'];
	return projects.map(function (before) {
		var after = {};
		attr_whitelist.forEach(function (attr) { after[attr] = before[attr]; });
		return after;
	});
}

app.post('/login', function (req, res) {
	var cloud;
	cloud = new SnapCloud('https://snapcloud.miosoft.com/miocon/app/login?_app=SnapCloud');
	cloud.login(req.body.username, hex_sha512(req.body.password), function () {
		cloud.getProjectList(function (projects) {
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