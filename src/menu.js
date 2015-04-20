'use strict';
var music = require('./music');
var text = require('./text');
var input = require('./input');
var params = require('./params');
var persist = require('./persist');

////////////////////////////////////////////////////////////////////////
// Menu Items

function itemExit() {
	return {
		text: 'Exit',
		func: function() {
			game.state.start('Menu', true, false)
		}
	};
}

function itemNewGame() {
	return {
		text: 'Start New Game',
		func: function() {
			game.state.start('Level', true, false, {'level': 'entrance1'});
		}
	};
}

function itemSavedGame() {
	var saveData = persist.loadSave();
	return {
		preference: saveData ? +10 : -10,
		text: 'Load Saved Game',
		enabled: !!saveData,
		func: function() {
			game.state.start('Level', true, false, saveData);
		}
	};
}

////////////////////////////////////////////////////////////////////////
// Menu

function Menu(items, title) {
	var back, txt, image;
	this.input = input.getKeys();
	this.group = game.add.group();

	this.group.fixedToCamera = true;
	var i, it, obj;
	this.items = [];
	var x = params.WIDTH / 2, y = params.HEIGHT / 2 + 64;
	this.title = title ? this.makeItem(x, y - 96, title, true, false) : null;
	this.pointer = this.group.create(x, y, 'menu', 0);
	this.pointer.anchor.set(0.5, 0.5);
	this.selection = 0;
	var preference = 0;
	for (i = 0; i < items.length; i++, y += 56) {
		it = items[i];
		if (typeof it.preference == 'number' && it.preference > preference) {
			preference = it.preference;
			this.selection = i;
			this.pointer.position.set(x, y);
		}
		obj = this.makeItem(x, y, it.text, it.enabled, true);
		obj.func = it.func;
		obj.context = it.context;
		this.items.push(obj);
	}
	this.pointer.bringToTop();
}

Menu.prototype.makeItem = function(x, y, txt, enabled, makeBack) {
	if (typeof enabled == 'undefined') {
		enabled = true;
	}
	var back;
	if (makeBack) {
		back = this.group.create(x, y, 'menu', 1);
		back.anchor.set(0.5, 0.5);
	}
	var txtobj = text.create();
	txtobj.text = txt;
	var img = new Phaser.Image(game, x, y + 2, txtobj);
	img.anchor.set(0.5, 0.5);
	if (!enabled) {
		img.tint = '#000000';
	}
	this.group.add(img);
	return {
		txt: txtobj,
		x: x,
		y: y,
		enabled: enabled,
	};
};

// Update the menu state for this frame.
Menu.prototype.update = function() {
	var sound = null;
	if (this.input.down === 1) {
		this.select(this.selection + 1);
		sound = 'clack';
	}
	if (this.input.up === 1) {
		this.select(this.selection - 1);
		sound = 'clack';
	}
	if (this.input.fire === 1) {
		var it = this.items[this.selection];
		if (it.enabled) {
			it.func.call(it.context);
			sound = 'clack';
		} else {
			sound = 'buzz';
		}
	}
	if (sound) {
		game.sound.play(sound);
	}
};

// Set the current menu selection.
Menu.prototype.select = function(index) {
	if (index < 0) {
		index = this.items.length - 1;
	} else if (index >= this.items.length) {
		index = 0;
	}
	if (this.selection === index) {
		return;
	}
	var it = this.items[index];
	this.pointer.position.set(it.x, it.y);
	this.selection = index;
}

////////////////////////////////////////////////////////////////////////
// Main Menu (state)

function MainMenu() {
	this.menu = null;
};

MainMenu.prototype.create = function() {
	this.menu = new Menu([
		itemNewGame(),
		itemSavedGame(),
	]);
}

MainMenu.prototype.update = function() {
	input.update();
	this.menu.update();
};

////////////////////////////////////////////////////////////////////////
// Exports

module.exports = {
	itemExit: itemExit,
	itemNewGame: itemNewGame,
	itemSavedGame: itemSavedGame,
	Menu: Menu,
	MainMenu: MainMenu,
};
