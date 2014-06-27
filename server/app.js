var express = require('express'),
	SnapCloud = require('./cloud').SnapCloud,
	hex_sha512 = require('./sha512');

SnapCloud.connect(function () {
	console.log('connected');
	SnapCloud.login('', hex_sha512(''), function () {
		console.log('logged in!');
	}, function () {
		console.log('login failed :(');
		console.log(arguments);
	});
}, function () {
	console.log('connection failed :(');
	console.log(arguments);
});