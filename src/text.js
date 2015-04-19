'use strict';

function create() {
	var x = game.add.retroFont(
		'terminus', 10*2, 18*2,
		Phaser.RetroFont.TEXT_SET1, 16);
	x.autoUpperCase = false;
	x.customSpacingX = -2;
	return x;
}

module.exports = {
	create: create,
};
