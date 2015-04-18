'use strict';

function start() {
	var game = new Phaser.Game(800, 480, Phaser.AUTO, 'game');
	global.game = game;
	var level = require('./level');
	game.state.add('Level', new level.Level());
	game.state.start('Level', true, false, {
		level: 'test',
	});
}

start();
