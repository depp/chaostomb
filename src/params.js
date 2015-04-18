'use strict';
var GRAVITY = 2500;

function stats(obj) {
	// Calculate initial jump speed from target jump height.
	obj.jspeed = Math.sqrt(
		(obj.jaccel * obj.jtime * obj.jtime + 2 * obj.jheight) * GRAVITY) -
		obj.jaccel * obj.jtime;
	return obj;
}

module.exports = {
	GRAVITY: GRAVITY,

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
};
