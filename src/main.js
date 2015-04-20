'use strict';
var params = require('./params');

function start() {
	var game = new Phaser.Game(params.WIDTH, params.HEIGHT, Phaser.AUTO, 'game');
	global.game = game;
	var level = require('./level');
	var boot = require('./assets');
	game.state.add('Load', boot.LoadScreen);
	game.state.add('Level', level.Level);
	game.state.start('Load', true, false);
	/*
	game.state.start('Level', true, false, {
		level: 'test',
	});
  */
}

start();
