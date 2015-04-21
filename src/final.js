'use strict';
var params = require('./params');
var text = require('./text');
var music = require('./music');

function FinalScreen() {}

FinalScreen.prototype.init = function(state) {
	var wcount = state.weapons.length;
	var hcount = state.hearts - 2;
	var djump = state.doubleJump;
	var txt = '';

	txt += 'You left the Chaos Tomb for the surface.\n';
	txt += 'The sun warms your skin, and you feel a\n';
	txt += 'cool spring breeze.\n';
	txt += '\n';

	txt += 'Weapons: ' + wcount + ' / ';
	if (wcount < 6) {
		txt += '???';
	} else {
		txt += '6';
	}
	txt += '\n';

	txt += 'Hearts:  ' + hcount + ' / ';
	if (hcount < 6) {
		txt += '???';
	} else {
		txt += '6';
	}
	txt += '\n';

	txt += 'Other:   ';
	if (djump) {
		txt += '1 / 1 (Double Jump)';
	} else {
		txt += '0 / ???';
	}
	txt += '\n';

	txt += '\n';
	if (!wcount) {
		txt += 'You are a loser Loser LOSER!\n';
	} else if (wcount < 3) {
		txt += 'You did not find much.\n';
	} else if (wcount < 6) {
		txt += 'You found some good weapons, for sure.\n';
		txt += 'Ultimate weapons?  Maybe not.\n';
	} else {
		if (hcount == 0) {
			txt += 'You relied solely on your wits,\n';
			txt += '  and SOMEHOW made it through alive.\n';
			txt += '(Wow, you picked up no hearts.)\n';
		} else if (hcount >= 6) {
			txt += 'You perservered and left no stone unturned.\n';
		}
		txt += 'You found the ultimate weapon!\n';
	}

	this.message = txt.replace(/\n$/, '');
};

FinalScreen.prototype.create = function(state) {
	music.play('glimmer_of_light');
	var txt = text.create();
	txt.multiLine = true;
	txt.text = this.message;
	var img = game.add.image(params.WIDTH/2, params.HEIGHT/2, txt);
	img.anchor.set(0.5, 0.5);
	img.fixedToCamera = true;
	global.txt = txt;
	global.img = img;
};

module.exports = {
	FinalScreen: FinalScreen,
};
