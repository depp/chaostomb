/* Copyright 2015 Dietrich Epp.

   This file is part of Chaos Tomb.  The Chaos Tomb source code is
   distributed under the terms of the 2-clause BSD license.
   See LICENSE.txt for details. */
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
}

function Dummy() {}
Dummy.prototype.create = function() {};

start();
