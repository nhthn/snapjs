Number.prototype.times = function (func) {
	var i;
	for (i = 0; i < this; i += 1) {
		func();
	}
};

function random(min, max) {
    var floor = +min,
        ceil = +max;
    if ((floor % 1 !== 0) || (ceil % 1 !== 0)) {
        return Math.random() * (ceil - floor) + floor;
    }
    return Math.floor(Math.random() * (ceil - floor + 1)) + floor;
};