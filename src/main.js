'use strict';
var params = require('./params');

function start() {
	var game = new Phaser.Game(params.WIDTH, params.HEIGHT, Phaser.AUTO, 'game');
	global.game = game;
	require('./cheat');
	var assets = require('./assets');
	var menu = require('./menu');
	var level = require('./level');
	var mfinal = require('./final');
	game.state.add('Load', assets.LoadScreen);
	game.state.add('Menu', menu.MainMenu);
	game.state.add('Level', level.Level);
	game.state.add('Final', mfinal.FinalScreen);
	game.state.add('Dummy', Dummy);
	game.state.start('Load', true, false);
	/*
	game.state.start('Level', true, false, {
		level: 'test',
	});
  */
}

function Dummy() {}
Dummy.prototype.create = function() {};

start();
