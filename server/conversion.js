var xamel = require('xamel'),
	fs = require('fs');

var xml = fs.readFileSync('test/sampleproject.xml').toString();

function HeaderBlock(block) {
	this.body = [];
	this.type = block.attrs.s;
	// TODO:
	// this.key
	// this.message
}

HeaderBlock.types = ['receiveGo', 'receiveMessage', 'receiveClick', 'receiveKey'];

HeaderBlock.prototype.toString = function () {
	return this.body.join('\n');
};

function MethodBlock(block) {
	this.type = block.attrs.s;
	//this.args = block.l;
}

MethodBlock.types = {
	// i have no idea what the args thing is
	'forward': { name: 'forward', args: 'n' },
	'turn': { name: 'turnRight', args: 'n' },
	'turnLeft': { name: 'turnLeft', args: 'n' },
	'setHeading': { name: 'setHeading', args: 'n' },
	'doFaceTowards': { name: 'faceTowards', args: '?' },
	'gotoXY': { name: 'setPosition', args: 'nn' },
	'doGotoObject': { name: 'goToObject', args: '??' },
	'changeXPosition': { name: 'moveX', args: 'n' },
	'changeYPosition': { name: 'moveY', args: 'n' },
	'setXPosition': { name: 'setX', args: 'n' },
	'setYPosition': { name: 'setY', args: 'n' },
	'bounceOffEdge': { name: 'bounce', args: '' },
	'doSwitchToCostume': { name: 'switchCostume', args: 'c' },
	'doWearNextCostume': { name: 'nextCostume', args: 0 },
	'bubble': { name: 'say', args: 's' },
	'doThink': { name: 'think', args: 's' },
	'changeEffect': { name: 'changeEffect', args: '' },
	'setEffect': { name: 'setEffect', args: 2 },
	'clearEffects': { name: 'clearEffects', args: 0 },
	'changeScale': { name: 'changeScale', args: 1 },
	'setScale': { name: 'setScale', args: 1 },
	'show': { name: 'show', args: 1 },
	'hide': { name: 'hide', args: 1 },
	'comeToFront': { name: 'front', args: 0 },
	'goBack': { name: 'back', args: 0 },
	'clear': { name: 'clear', args: 0 },
	'down': { name: 'down', args: 0 },
	'up': { name: 'up', args: 0 },
	'setColor': { name: 'setColor', args: 1 },
	'changeHue': { name: 'changeHue', args: 1 },
	'setHue': { name: 'setHue', args: 1 },
	'changeBrightness': { name: 'changeBrightness', args: 1 },
	'setBrightness': { name: 'setBrightness', args: 1 },
	'doStamp': { name: 'stamp', args: 1 }
};

MethodBlock.prototype.toString = function () {
	return MethodBlock.types[this.type].name + '()';
};

function MethodWaitBlock(block) {
	this.type = MethodWaitBlock.types[block.$.s].name;
	this.args = block.l;
}

MethodWaitBlock.types = {
	'doGlide': { name: 'glideTo', args: '' },
	'doSayFor': { name: 'sayWait', args: '' },
	'doThinkFor': { name: 'thinkWait', args: '' }
};

MethodWaitBlock.prototype.toString = function () {
	return MethodWaitBlock.types[this.type].name + '()';
};

function ControlBlock(block) {
	this.type = block.attrs.s;
	this.cond = null;
	this.times = null;
	this.body1 = null;
	this.body2 = null;
	switch (this.type) {
		case 'doRepeat':
			this.times = block.children[0];
			this.body1 = processBlocks(block.children[1].children);
			break;
		case 'doIf':
			this.cond = block.children[0];
			this.body1 = processBlocks(block.children[1].children);
			break;
		case 'doIfElse':
			this.cond = block.children[0];
			this.body1 = processBlocks(block.children[1].children);
			this.body2 = processBlocks(block.children[2].children);
			break;
		case 'doUntil':
			this.cond = block.children[0];
			this.body1 = processBlocks(block.children[1],children);
			break;
		default:
			throw new Error('Unrecognized or unsupported block type.');
	}
}

ControlBlock.types = {
	'doRepeat': true,
	'doIf': true,
	'doIfElse': true,
	'doUntil': true
};

ControlBlock.prototype.toString = function () {
	switch (this.type) {
		case 'doRepeat':
			return 'for (i = 0; i < ' + this.times + '; i++) { ' + this.body1.join('\n') + ' }';
		case 'doIf':
			return 'if (' + this.cond + ') { ' + this.body1.join('\n') + ' }';
		case 'doIfElse':
			return 'if (' + this.cond + ') { ' + this.body1.join('\n') + ' } { ' + this.body2.join('\n') + ' }';
			break;
		case 'doUntil':
			return 'while (!' + this.cond + ') { ' + this.body1.join('\n') + ' }';
	}
};

function processBlocks(xBlocks, startAtOne) {
	var blocks, i;
	blocks = [];
	i = 0;
	if (startAtOne) { i = 1; }
	for ( ; i < xBlocks.length; i += 1) {
		xBlock = xBlocks[i];
		type = xBlock.attrs.s;
		if (MethodBlock.types.hasOwnProperty(type)) {
			blocks.push(new MethodBlock(xBlock));
		} else if (MethodWaitBlock.types.hasOwnProperty(type)) {
			blocks.push(new MethodWaitBlock(xBlock));
		} else if (ControlBlock.types.hasOwnProperty(type)) {
			blocks.push(new ControlBlock(xBlock));
		} else {
			blocks.push(xBlock);
		}
	}
	return blocks;
}

xamel.parse(xml, function (err, result) {
	//var blocks = result.project.stage[0].sprites[0].sprite[0].scripts[0].script[0].block;
	var scripts = result.$('project/stage/sprites/sprite/scripts/*').children;
	scripts.forEach(function (script) {
		var i,
			xBlocks, xFirstBlock,
			xBlock, type,
			block, headerBlock;
		xBlocks = script.children;

		xFirstBlock = xBlocks[0];
		if (HeaderBlock.types.indexOf(xFirstBlock.attrs.s) === -1) {
			console.log('Script lacks a valid header');
			return;
		}
		headerBlock = new HeaderBlock(xFirstBlock);

		headerBlock.body = processBlocks(xBlocks, true);

		console.log(headerBlock.toString());

	});
	/*
	if (blocks[])
	for (i = 1; i < blocks.length; i++) {
		xmlBlock = blocks[i];
		type = xmlBlock.attrs.s;
		if (MethodBlock.types.hasOwnProperty(type)) {
			block = new MethodBlock(xmlBlock);
			console.log(block);
		} else if (MethodWaitBlock.types.hasOwnProperty(type)) {
			block = new MethodWaitBlock(xmlBlock);
			console.log(block);
		} else {
			console.log(xmlBlock);
		}
	}*/
});