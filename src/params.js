'use strict';

var GRAVITY = 2500;

// In one 60 Hz tick, don't move more than 90% of a half tile.
var MAX_VELOCITY = 16 * 60 * 0.9;

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

function monster(obj) {
	var accel = obj.accel || 1;
	return {
		stats: stats({
			bounce: obj.bounce || 0.2,
			steptime: null,
			gdrag: obj.speed * 4 * accel,
			gaccel: obj.speed * 8 * accel,
			gspeed: obj.speed,
			adrag: 0,
			aaccel: 0,
			aspeed: 0,
			jtime: 0,
			jaccel: 0,
			jheight: obj.jheight,
			jdouble: false
		})
	};
}

module.exports = {
	GRAVITY: GRAVITY,

	MAX_VELOCITY: MAX_VELOCITY,

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
		aaccel: 300,
		aspeed: 180,

		// Jumping
		jtime: 0.5,
		jaccel: 1800,
		jheight: 180,
		jdouble: true
	}),

	MONSTERS: {
		Eye: monster({
			speed: 200,
			accel: 1,
			jheight: 180
		})
	}
};
