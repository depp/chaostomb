'use strict';
var params = require('./params');

function start() {
	var game = new Phaser.Game(params.WIDTH, params.HEIGHT, Phaser.AUTO, 'game');
	global.game = game;
	var assets = require('./assets');
	var menu = require('./menu');
	var level = require('./level');
	game.state.add('Load', assets.LoadScreen);
	game.state.add('Menu', menu.MainMenu);
	game.state.add('Level', level.Level);
	game.state.start('Load', true, false);
	/*
	game.state.start('Level', true, false, {
		level: 'test',
	});
  */
}

start();
