/* Copyright 2015 Dietrich Epp.

   This file is part of Chaos Tomb.  The Chaos Tomb source code is
   distributed under the terms of the 2-clause BSD license.
   See LICENSE.txt for details. */
'use strict';

var WIDTH = 800;
var HEIGHT = 480;
var GRAVITY = 2500;

// In one 60 Hz tick, don't move more than 90% of a half tile.
var MAX_VELOCITY = 16 * 60 * 0.9;

// Threshold at which the walk animation triggers.
// Also, sprite will not flip until the speed in the previous direction
// drops below this value.
var WALK_THRESHOLD = 50;

function stats(obj) {
	// Calculate initial jump speed from target jump height.
	if (obj.jheight > 0) {
		obj.jspeed = Math.sqrt(
			(obj.jaccel * obj.jtime * obj.jtime + 2 * obj.jheight) * GRAVITY) -
			obj.jaccel * obj.jtime;
	} else {
		obj.jspeed = 0;
	}
	return obj;
}

var MON_DEFAULTS = {
	accel: 1,
	bounce: 0.2,
	patrolpause: 0.3,
	scaninterval: 2,
	shotdelay: 0.2,
	shotinterval: 0.5,
	shotrecover: 0.2,
	shotcount: 1,
	shotrange: 600,
};

function monster(obj) {
	var key;
	for (key in MON_DEFAULTS) {
		if (!(key in obj)) {
			obj[key] = MON_DEFAULTS[key];
		}
	}
	var result = {
		stats: stats({
			bounce: obj.bounce,
			steptime: null,
			gdrag: obj.speed * 4 * obj.accel,
			gaccel: obj.speed * 8 * obj.accel,
			gspeed: obj.speed,
			adrag: 0,
			aaccel: 0,
			aspeed: 0,
			jtime: 0,
			jaccel: 0,
			jheight: obj.jheight,
		}),
		patrolpause: obj.patrolpause,
		scaninterval: obj.scaninterval,
		health: obj.health,
		shot: obj.shot,
		shotdelay: obj.shotdelay,
		shotinterval: obj.shotinterval,
		shotrecover: obj.shotrecover,
		shotcount: obj.shotcount,
		shotrange: obj.shotrange,
		width: obj.width,
		height: obj.height,
	};
	for (key in result) {
		var val = result[key];
		switch (typeof val) {
		case 'undefined':
			console.error('Undefined key in monster:', key);
			break;
		case 'number':
			if (!isFinite(val)) {
				console.error('Invalid number in monster:', key);
			}
			break;
		}
	}
	return result;
}

module.exports = {
	LAND_THRESHOLD: 400,
	WIDTH: WIDTH,
	HEIGHT: HEIGHT,
	GRAVITY: GRAVITY,
	MAX_VELOCITY: MAX_VELOCITY,
	WALK_THRESHOLD: WALK_THRESHOLD,
	MONSTER_DEATH_TIME: 0.5,
	MONSTER_STUN_TIME: 0.5,
	PLAYER_DEATH_TIME: 0.5,
	PLAYER_STUN_TIME: 0.3,
	CORPSE_DRAG: 800,
	CORPSE_AIR_DRAG: 50,

	// Time after leaving a platform while you can still jump.
	JUMP_SLOP: 0.2,

	// Speed at which player jumps when hitting the bottom of a pool.
	DROWN_JUMP_SPEED: 600,

	PLAYER_STATS: stats({
		bounce: 0.2,

		// Time between steps
		steptime: 0.16,

		// Ground movement
		gdrag: 1200,
		gaccel: 2400,
		gspeed: 300,

		// Air movement
		adrag: 0,
		aaccel: 1000,
		aspeed: 250,

		// Jumping
		jtime: 0.4,
		jaccel: 1800,
		jheight: 165,

		// Play sounds
		sound: true,
	}),

	MONSTERS: {
		Eye: monster({
			speed: 200,
			accel: 1,
			jheight: 180,
			health: 2,
			scanperiod: 2,
			shot: 'Eye',
			shotcount: 2,
			width: 32,
			height: 48,
		})
	},
};
