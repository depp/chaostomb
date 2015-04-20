'use strict';
var music = require('./music');
var text = require('./text');
var input = require('./input');
var persist = require('./persist');

////////////////////////////////////////////////////////////////////////
// Menu

function Menu(items) {
	this.input = input.getKeys();
	this.group = game.add.group();
	this.group.fixedToCamera = true;
	var i, it;
	this.items = [];
	var x = game.world.centerX, y = game.world.centerY + 64;
	this.pointer = this.group.create(x, y, 'menu', 0);
	this.pointer.anchor.set(0.5, 0.5);
	for (i = 0; i < items.length; i++, y += 56) {
		it = items[i];
		var enabled = it.enabled;
		if (typeof enabled == 'undefined') {
			enabled = true;
		}
		var back = this.group.create(x, y, 'menu', 1);
		back.anchor.set(0.5, 0.5);
		var txt = text.create();
		txt.text = it.text;
		var img = new Phaser.Image(game, x, y + 2, txt);
		img.anchor.set(0.5, 0.5);
		if (!enabled) {
			img.tint = '#000000';
		}
		this.group.add(img);
		this.items.push({
			txt: txt,
			x: x,
			y: y,
			func: it.func,
			context: it.context,
			enabled: enabled,
		});
	}
	this.pointer.bringToTop();
	this.selection = 0;
}

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
	var items = [];
	items.push({
		text: 'New Game',
		func: function() {
			game.state.start('Level', true, false, {'level': 'entrance1'});
		}
	});
	var saveData = persist.loadSave();
	items.push({
		text: 'Continue Saved Game',
		enabled: !!saveData,
		func: function() {
			game.state.start('Level', true, false, saveData);
		}
	});
	this.menu = new Menu(items);
}

MainMenu.prototype.update = function() {
	input.update();
	this.menu.update();
};

////////////////////////////////////////////////////////////////////////
// Exports

module.exports = {
	Menu: Menu,
	MainMenu: MainMenu,
};
