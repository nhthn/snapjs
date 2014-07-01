var fs = require('fs');
	express = require('express'),
	passport = require('passport'),
	LocalStrategy = require('passport-local').Strategy,
	SnapCloud = require('./cloud').Cloud,
	hex_sha512 = require('./sha512');

var app = express();

var secret = fs.readFileSync(__dirname + '/secret.txt').toString();

passport.use(new LocalStrategy(
	function (username, password, done) {
		var cloud = new SnapCloud('https://snapcloud.miosoft.com/miocon/app/login?_app=SnapCloud');
		cloud.login(username, hex_sha512(password), function () {
			done(null, cloud);
		}, function () {
			done(null, false);
		});
	}
));

passport.serializeUser(function(user, done) {
	done(null, user.username);
});

/*passport.deserializeUser(function(id, done) {
	User.findById(id, function(err, user) {
		done(err, user);
	});
});*/

app.configure(function () {
	app.use(express.static(__dirname + '/public'));
	app.use(express.cookieParser());
	app.use(express.bodyParser());
	app.use(express.session({ secret: secret }));
	app.use(passport.initialize());
	app.use(passport.session());
});

app.post('/login',
	passport.authenticate('local', {
		successRedirect: '/',
		failureRedirect: '/login',
		failureFlash: true
	})
);

app.listen(3000);

/*

SnapCloud.login(username, hex_sha512(password), function () {
	console.log('logged in');
	SnapCloud.getProjectList(function (projects) {
		console.log(projects);
	}, function () {
		console.log('failed to retrieve list :(');
		console.log(arguments);
	});
}, function () {
	console.log('login failed :(');
	console.log(arguments);
});

*/