'use strict';

var BOB_MAGNITUDE = 16;
var BOB_TIME = 1.0;

////////////////////////////////////////////////////////////////////////
// Door

function Door(sprite, info) {
	this.sprite = sprite;
}
Door.prototype.markerOffset = 64;
Door.prototype.interact = function() {

};

////////////////////////////////////////////////////////////////////////
// Door

function Chest(sprite, info) {
	this.sprite = sprite;
}
Chest.prototype.markerOffset = 48;
Chest.prototype.interact = function() {

};

////////////////////////////////////////////////////////////////////////
// Save point

function SavePoint(sprite, info) {
	this.sprite = sprite;
}
SavePoint.prototype.markerOffset = 48;
SavePoint.prototype.interact = function() {

};

////////////////////////////////////////////////////////////////////////
// Prop factories

var PROP_TYPES = {
	0: function(sprite, info) { return new Door(sprite, info); },
	2: function(sprite, info) { return new Chest(sprite, info); },
	4: function(sprite, info) { return new Chest(sprite, info); },
};

////////////////////////////////////////////////////////////////////////
// Prop manager

function Props(level) {
	this.level = level;
	this.group = level.add.group();
	this.objs = {};
	this.counter = 0;
	this.markerSprite = null;
	this.markerTarget = null;
	this.markerTween = null;
}

// Spawn a prop from the map.
Props.prototype.spawn = function(index, info) {
	var factory = PROP_TYPES[index];
	var sprite = this.group.create(
		info.x + 32, info.y - 32,
		'props', index);
	sprite.anchor.set(0.5, 0.5);
	if (factory) {
		var name = 'Prop ' + this.counter;
		this.counter++;
		sprite.name = name;
		var obj = factory(sprite, info);
		game.physics.arcade.enable(sprite);
		this.objs[name] = obj;
	}
};

// Update all props.
Props.prototype.update = function(index, info) {
	var player = this.level.gPlayer.getInteractSprite();
	if (!player) {
		this.setTarget(null);
		return;
	}
	var best_dist = Infinity, best_sprite = null;
	game.physics.arcade.overlap(
		player, this.group, function(player_, sprite) {
			var u = player_.position, v = sprite.position;
			var dist = Math.max(
				Math.abs(u.x - v.x),
				Math.abs(u.y - v.y));
			if (dist < best_dist) {
				best_dist = dist;
				best_sprite = sprite;
			}
		});
	this.setTarget(best_sprite);
};

// Set the interaction target.
Props.prototype.setTarget = function(sprite) {
	if (!sprite) {
		if (this.markerTarget) {
			this.markerSprite.kill();
			this.markerTarget = null;
			this.markerTween.stop();
			this.markerTween = null;
		}
		return;
	}
	var obj = this.objs[sprite.name];
	if (!obj) {
		console.log(this.objs);
		console.error('Invalid interaction target:', sprite);
		return;
	}
	if (this.markerTarget == obj) {
		return;
	}
	this.markerTarget = obj;
	var tx = sprite.x;
	var ty0 = sprite.y - BOB_MAGNITUDE -obj.markerOffset;
	var ty1 = ty0 + BOB_MAGNITUDE * 2;
	if (!this.markerSprite) {
		this.markerSprite = this.group.create(tx, ty0, 'props', 6);
		this.markerSprite.anchor.setTo(0.5, 0.5);
	} else {
		this.markerSprite.reset(tx, ty0);
	}
	if (this.markerTween) {
		this.markerTween.stop();
		this.markerTween = null;
	}
	this.markerTween = game.add.tween(this.markerSprite);
	this.markerTween.to(
		{x: tx, y: ty1}, BOB_TIME * 500, Phaser.Easing.Sinusoidal.InOut,
		true, 0, -1, true);
};

////////////////////////////////////////////////////////////////////////
// Exports

module.exports = {
	Props: Props,
};
