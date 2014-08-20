var xamel = require('xamel');

if (typeof String.prototype.startsWith != 'function') {
    String.prototype.startsWith = function (str) {
        return this.slice(0, str.length) == str;
    };
}

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

function toValidJSName(str) {
	// Keep name lowercase
	// All global library functions are in Uppercase, so this prevents collision
	str = str.toLowerCase();
	// Convert spaces to camel case
	str = str.split(/\s+/).map(function (word, i) {
		if (i === 0) {
			return word;
		}
		return word.charAt(0).toUpperCase() + word.slice(1);
	}).join('');
	return str;
}

Translator.Sprite = function (el, owner) {
	var that = this;
	this.owner = owner;

	this.name = toValidJSName(el.attrs.name);
	// Sometimes multiple sprite names will map to one
	// As a last resort we add underscores to ensure uniqueness
	while (this.owner.hasOwnProperty(this.name)) {
		this.name += '_';
	}
	// Add to translator's sprite dictionary and record the mapping
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

Translator.Script.prototype.toString = function (mode) {
	var lines, that;
	that = this;
	lines = (this.blocks.join('\n')).split('\n');
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
        // The mode 'block' indicates that we only want to encase the function body in curly braces, rather than function () {}.
        // This is useful when we're using a bare control structure like if-else.
		if (mode === 'block') {
            lines.unshift('{');
            lines.push('}');
        } else {
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

function dollarFormat(str, args) {
    return str.replace(/\$([b]?)\d+/g, function (match) {
        var m, flags, index, arg;
        m = match.match(/^\$([b]?)(\d+)$/);
        flags = m[1];
        index = m[2];
        arg = args[+m[2] - 1];
        if (~flags.indexOf('b')) {
            arg = arg.toString('block');
        }
        return arg;
    });
}

Translator.Block.templates = {
    'reportSum': '$1 + $2',
    'reportDifference': '$1 - $2',
    'reportProduct': '$1 * $2',
    'reportQuotient': '$1 / $2',
    'reportRandom': 'random($1, $2)',
    'reportLessThan': '$1 < $2',
    'reportEquals': '$1 == $2',
    'reportGreaterThan': '$1 > $2',
    'reportNot': '!$1',
    'reportAttributeOf': '$2.$1',
    'doRepeat': '($1).times($2)',
    'doIfElse': 'if ($1) $b2 else $b3'
};

Translator.Block.prototype.toString = function () {
	var result, type, template, that;
	that = this;
    type = this.type;
	if (Translator.Block.templates.hasOwnProperty(type)) {
        template = Translator.Block.templates[type];
        if (typeof template === 'string') {
            result = dollarFormat(template, this.args);
        } else if (typeof template === 'function') {
            result = template.apply(this, this.args);
        }
	} else {
		result = 'this.' + type + '(';
		if (this.args.length > 0) {
			result += this.args.join(', ');
		}
		result += ');';
	}
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
	str = require('fs').readFileSync('test/sampleproject.xml').toString();
	snap2js(str, function (code) {
		console.log(code);
	});
}

if (require.main === module) {
	main();
}