'use strict';
var music = require('./music');
var text = require('./text');
var input = require('./input');

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
		var back = this.group.create(x, y, 'menu', 1);
		back.anchor.set(0.5, 0.5);
		var txt = text.create();
		txt.text = it;
		var img = new Phaser.Image(game, x, y + 2, txt);
		img.anchor.set(0.5, 0.5);
		this.group.add(img);
		this.items.push({
			txt: txt,
			x: x,
			y: y,
		});
	}
	this.pointer.bringToTop();
	this.selection = 0;
}

// Update the menu state for this frame.
Menu.prototype.update = function() {
	if (this.input.down === 1) {
		this.select(this.selection + 1);
	}
	if (this.input.up === 1) {
		this.select(this.selection - 1);
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
		'New Game',
		'Continue Saved Game',
	]);
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
