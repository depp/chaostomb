'use strict';
var weapons = require('./weapons');

var cheats = {
	allWeapons: function(level) {
		var name;
		for (name in weapons) {
			level.gPlayer.addWeapon(name);
		}
	},
	addWeapon: function(level) {
		var w = level.gPlayer.getNextWeapon();
		if (w) {
			level.gPlayer.addWeapon(w);
		}
	},
	invincible: function(level) {
		level.gState.invincible = true;
	},
};

function wrap(func) {
	return function() {
		if (game.state.current !== 'Level') {
			console.error('The game is not running.');
			return;
		}
		var level = game.state.getCurrentState();
		func(level);
	};
}

global.cheat = (function() {
	var obj = {}, name;
	for (name in cheats) {
		obj[name] = wrap(cheats[name]);
	}
	return obj;
})();
