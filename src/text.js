/* Copyright 2015 Dietrich Epp.

   This file is part of Chaos Tomb.  The Chaos Tomb source code is
   distributed under the terms of the 2-clause BSD license.
   See LICENSE.txt for details. */
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
