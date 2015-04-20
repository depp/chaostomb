'use strict';
var params = require('./params');

function Weapon() {}

Weapon.prototype.getFrame = function(selected) {
	var icon = this.icon;
	var x = icon & 3, y = icon >> 2;
	if (selected) {
		x += 4;
	}
	return x + y * 8;
};

var WEAPONS = {
	Heart: {
		icon: 0,
		name: 'Power of Love',
	},
	Boot: {
		icon: 1,
		name: 'Fearsome Boot',
	},
	Doll: {
		icon: 2,
		name: 'Creepy Doll',
	},
	Fish: {
		icon: 3,
		name: 'Fish Schooler',
	},
	Teleport: {
		icon: 4,
		name: 'Transmat',
		cooldown: 0,
		fire: function(level) {
			var targets = [], view = game.camera.view;
			level.gMonsters.group.forEachAlive(function(monster) {
				var pos = monster.position;
				if (monster.name && view.contains(pos.x, pos.y)) {
					targets.push(monster);
				}
			});
			var target;
			if (targets.length > 1) {
				target = targets[Math.floor(Math.random() * targets.length)];
			} else if (targets.length > 0) {
				target = targets[0];
			} else {
				target = level.gPlayer.getSprite();
			}
			if (!target) {
				return;
			}
			game.sound.play('warp');
			level.gFx.emitSparks(target.x, target.y);
			var pos = level.findEmptySpace(target.body.width, target.body.height);
			if (pos !== null) {
				target.x = pos.x;
				target.y = pos.y;
				level.gFx.emitSparks(pos.x, pos.y);
			}
		}
	},
	Wind: {
		icon: 5,
		name: 'Broken Wind',
	},
	Potato: {
		icon: 6,
		name: 'Potato',
	},
	Breakout: {
		icon: 7,
		name: 'Brick Breaker',
	},
	Billiards: {
		icon: 8,
		name: 'Pool Shark',
	},
	Artillery: {
		icon: 9,
		name: 'Heavy Cannon',
	},
	Math: {
		icon: 10,
		name: 'Arithmetical Emblem',
	},
	Snake: {
		icon: 11,
		name: 'King Cobra',
	},
	Gun: {
		icon: 12,
		name: 'Gun',
		fire: function(level) {
			var face = level.gPlayer.getFacing();
			console.log(face);
			level.gShots.spawn(true, 'Bolt', face.x, face.y, face.direction, 0);
			game.sound.play('shot_short');
		}
	},
	Sheep: {
		icon: 13,
		name: 'Baa Ram Ewe',
	},
	Type: {
		icon: 14,
		name: 'Key Pounder',
	},
	Shield: {
		icon: 15,
		name: 'Shield Emitter',
		cooldown: 0.1,
		auto: true,
		fire: function(level) {
			if (level.gPlayer.spawnHex()) {
				game.sound.play('hex');
			} else {
				game.sound.play('click');
			}
		}
	},
};

(function() {
	var name, w, y, attr;
	for (name in WEAPONS) {
		w = WEAPONS[name];
		y = new Weapon();
		for (attr in w) {
			y[attr] = w[attr];
		}
		WEAPONS[name] = y;
	}
})();

module.exports = WEAPONS;
