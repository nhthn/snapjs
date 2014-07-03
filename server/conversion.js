var parseString = require('xml2js').parseString,
	fs = require('fs');

var xml = fs.readFileSync('test/sampleproject.xml').toString();

parseString(xml, function (err, result) {
	var blocks = result.project.stage[0].sprites[0].sprite[0].scripts[0].script[0].block;
	blocks.forEach(function (block) {
		var type = block.$.s;
		switch (type) {
			case 'receiveGo':
				console.log('sprite.onReceiveGo = function () {')
				break;
		}
	});
});