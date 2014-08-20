var xamel = require('xamel');

function Translator() {
	this.stage = null;
	this.sprites = {};
	this.spriteNameMappings = {};
}

Translator.prototype.makeSprite = function (el) {
	new Translator.Sprite(el, this);
};

Translator.prototype.toString = function (el) {
	var spriteNames, result, that;
	that = this;
	spriteNames = Object.keys(this.sprites).sort();

	result = 'var ' + spriteNames.join(', ') + ';\n\n';
	result += spriteNames.map(function (spriteName) {
		return that.sprites[spriteName].toString();
	}).join('\n\n');

	return result;
};

/*****************************************************************************/

Translator.Sprite = function (el, owner) {
	var that = this;
	this.owner = owner;

	this.name = el.attrs.name.replace(' ', '_');
	this.owner.sprites[this.name] = this;
	this.owner.spriteNameMappings[el.attrs.name] = this.name;

	this.scripts = [];
	el.find('scripts/script').forEach(function (script) {
		that.makeScript(script);
	});
};

Translator.Sprite.prototype.makeScript = function (el) {
	this.scripts.push(new Translator.Script(el, this, true));
};

Translator.Sprite.prototype.toString = function () {
	var result;
	result = this.name + ' = new Sprite();\n\n';
	result += this.scripts.join('\n\n');
	return result;
};

/*****************************************************************************/

Translator.Script = function (el, owner, isHeader) {
	this.owner = owner;
	this.blocks = [];
	this.isHeader = !!isHeader;
	el.map(function (block) {
		this.makeBlock(block);
	}.bind(this));
};

Translator.Script.prototype.toString = function (raw) {
	var lines, that;
	that = this;
	lines = (this.blocks.join(';\n') + ';').split('\n');
	lines = lines.map(function (line) { return '\t' + line; });
	if (this.isHeader) {
		if (this.blocks[0].type === 'receiveGo') {
			lines[0] = this.owner.name + ".addEvent('receiveGo', function () {";
			lines.push('});');
			return lines.join('\n');
		} else if (this.blocks[0].type === 'receiveClick') {
			lines[0] = this.owner.name + ".addEvent('click', function () {";
			lines.push('});');
			return lines.join('\n');
		} else {
			lines[0] = this.owner.name + ".addEvent('" + this.blocks[0].type + "', function () {";
			lines.push('});');
			return lines.join('\n');
		}
	} else {
		if (!raw) {
			lines.unshift('function () {');
			lines.push('}');
		}
		return lines.join('\n');
	}
};

Translator.Script.prototype.makeBlock = function (el) {
	this.blocks.push(new Translator.Block(el, this));
};

/*****************************************************************************/

Translator.Block = function (el, owner) {
	this.owner = owner;
	this.type = el.attrs.s;
	this.args = el.children.map(function (arg) {
		if (arg.name === 'l') {
			return arg.children[0];
		} else if (arg.name === 'color') {
			return 'new Color(' + arg.children[0].split(',').join(', ') + ')';
		} else if (arg.name === 'block') {
			return new Translator.Block(arg, owner);
		} else if (arg.name === 'script') {
			return new Translator.Script(arg, owner);
		} else {
			console.warn('Unidentified block type ' + arg.name);
			console.log(arg);
		}
	});
};

Translator.Block.prototype.toString = function () {
	var result, that;
	that = this;
	result = 'this.' + this.type + '(';
	if (this.args.length > 0) {
		result += this.args.join(', ');
	}
	result += ')';
	return result;
};

/*****************************************************************************/

function snap2js(xml, callback) {
	xamel.parse(xml, function (err, xml) {
		var translator;
		if (err) throw err;
		translator = new Translator();
		//sprites = xml.find('project/stage');
		xml.find('project/stage/sprites/sprite').forEach(function (sprite) {
			translator.makeSprite(sprite);
		});
		if (callback instanceof Function) {
			callback(translator.toString());
		}
	});
}
module.exports = snap2js;

function main() {
	var str;
	str = require('fs').readFileSync('test/swimmer.xml').toString();
	snap2js(str, function (code) {
		console.log(code);
	});
}

if (require.main === module) {
	main();
}