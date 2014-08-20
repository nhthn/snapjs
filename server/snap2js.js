var xamel = require('xamel');

function Translator() {
	this.stage = null;
	this.sprites = {};
}

Translator.prototype.makeSprite = function (el) {
	this.sprites[el.attrs.name] = new Translator.Sprite(el);
};

/*****************************************************************************/

Translator.Sprite = function (el) {
	this.name = el.attrs.name;
	this.scripts = [];
	el.find('scripts/script').forEach(function (script) {
		this.makeScript(script);
	}.bind(this));
};

Translator.Sprite.prototype.makeScript = function (el) {
	this.scripts.push(new Translator.Script(el, this, true));
};

/*****************************************************************************/

Translator.Script = function (el, owner, isHeader) {
	this.owner = owner;
	this.blocks = [];
	this.isHeader = !!isHeader;
	el.map(function (block) {
		this.makeBlock(block);
	}.bind(this));
	console.log(this.toString());
};

Translator.Script.prototype.toString = function () {
	var lines, that;
	that = this;
	lines = (this.blocks.join(';\n') + ';').split('\n');
	lines = lines.map(function (line) {
		return '\t' + line;
	});
	if (this.isHeader) {
		if (this.blocks[0].type === 'receiveGo') {
			lines[0] = this.owner.name + ".addEvent('receiveGo', function () {";
			lines.push('});');
			return lines.join('\n');
		} else if (this.blocks[0].type === 'receiveClick') {
			lines[0] = this.owner.name + ".addEvent('click', function () {";
			lines.push('});');
			return lines.join('\n');
		}
	} else {
		lines.unshift('function () {');
		lines.push('}');
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
		if (arg.name === 'l' || arg.name === 'color') {
			return arg.children[0];
		} else if (arg.name === 'block') {
			return new Translator.Block(arg, owner);
		} else if (arg.name === 'script') {
			return new Translator.Script(arg, owner);
		} else {
			console.warn('Unidentified block type');
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
	});
}
module.exports = snap2js;

if (require.main === module) {
	snap2js(require('fs').readFileSync('test/sampleproject.xml').toString());
}