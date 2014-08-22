Number.prototype.times = function (func) {
	var i;
	for (i = 0; i < this; i += 1) {
		func();
	}
};