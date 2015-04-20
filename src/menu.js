'use strict';
var music = require('./music');
var text = require('./text');

////////////////////////////////////////////////////////////////////////
// Menu

function Menu(items) {
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

////////////////////////////////////////////////////////////////////////
// Exports

module.exports = {
	Menu: Menu,
	MainMenu: MainMenu,
};
