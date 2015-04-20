'use strict';
var params = require('./params');

////////////////////////////////////////////////////////////////////////
// Corpse

function Corpse(sprite) {
	this.sprite = sprite;
	this.anim = null;
}

Corpse.prototype.update = function(xdrive, ydrive, stunned) {
	var body = this.sprite.body;
	var xaccel = body.blocked.down ? params.CORPSE_DRAG : params.CORPSE_AIR_DRAG;
	var xdel = -body.velocity.x;
	if (Math.abs(xdel) <= xaccel * game.time.physicsElapsed) {
		body.velocity.x = 0;
		body.acceleration.x = 0;
	} else {
		body.acceleration.x = Math.sign(xdel) * xaccel;
	}
	var anim = stunned ? 'hurt' : 'dead';
	if (anim != this.anim) {
		this.sprite.play(anim);
		this.anim = anim;
	}
};

////////////////////////////////////////////////////////////////////////
// Walker

function Walker(sprite, stats) {
	// Annoying, but cool
	// sprite.body.bounce.y = stats.bounce;
	this.sprite = sprite;
	this.stats = stats;
	this.state = 0;
	this.jumptime = 0;
	this.jumpdown = false;
	this.stepdistance = 0;
	this.direction = +1;
	this.anim = null;
	this.sloptime = params.JUMP_SLOP;
	this.fast = false;
}

Walker.prototype.update = function(xdrive, ydrive, stunned, can_doublejump) {
	var body = this.sprite.body;
	var stats = this.stats;
	var direction = this.direction;
	var anim = null;

	var drag, accel, speed;
	if (this.state === 0) {
		drag = stats.gdrag;
		accel = stats.gaccel;
		speed = stats.gspeed;
	} else {
		drag = stats.adrag;
		accel = stats.aaccel;
		speed = stats.aspeed;
	}
	if (stunned) {
		drag *= 0.3;
		accel *= 0.3;
	}

	// The target speed
	var xtarget = xdrive * speed;
	// Delta speed requested by player
	var xdel = xtarget - body.velocity.x;
	// Final X acceleration
	var xaccel;
	if (Math.abs(xdrive) > 0.1) {
		anim = 'walk';
		if (body.velocity.x * Math.sign(xdrive) >= -params.WALK_THRESHOLD) {
			this.sprite.scale.x = this.direction = Math.sign(xdrive);
		}
		xaccel = accel;
		var xfrac = body.velocity.x / xtarget;
		if (xfrac > 0.8) {
			xaccel *= 0.5;
		}
	} else {
		if (Math.abs(body.velocity.x) >= params.WALK_THRESHOLD) {
			anim = 'walk';
		} else {
			anim = 'stand';
		}
		xaccel = drag;
	}
	if (Math.abs(xdel) <= xaccel * game.time.physicsElapsed) {
		body.velocity.x = xtarget;
		body.acceleration.x = 0;
	} else {
		body.acceleration.x = Math.sign(xdel) * xaccel;
	}

	var did_jump = false;
	body.acceleration.y = 0;
	if (ydrive <= -0.5 && stats.jspeed > 0) {
		if (this.jumptime > 0) {
			this.jumptime -= game.time.physicsElapsed;
			body.acceleration.y = stats.jaccel * ydrive;
		} else {
			var state = this.state;
			if (state === 1 && this.sloptime > 0) {
				state = 0;
			}
			var can_jump = !this.jumpdown &&
					(state === 0 || state === 1 && can_doublejump);
			if (can_jump) {
				this.state = state + 1;
				this.jumptime = stats.jtime;
				if (body.velocity.y >= -stats.jspeed) {
					body.velocity.y = -stats.jspeed;
				}
				if (stats.sound) {
					game.sound.play('jump');
				}
				did_jump = true;
			}
		}
		this.jumpdown = true;
	} else {
		this.jumpdown = false;
		body.acceleration.y = 0;
		this.jumptime = 0;
	}
	if (!did_jump) {
		if (body.onFloor()) {
			if (stats.sound && this.state !== 0 && this.fast) {
				game.sound.play('step_1');
			}
			this.state = 0;
			this.sloptime = params.JUMP_SLOP;
		} else {
			if (this.state === 0) {
				this.state = 1;
			}
			this.sloptime -= game.time.physicsElapsed;
		}
	}
	if (this.state !== 0) {
		anim = 'jump';
	}

	if (stunned) {
		anim = 'hurt';
	}
	if (this.anim != anim) {
		this.sprite.play(anim);
		this.anim = anim;
	}
	this.fast = body.velocity.y > params.LAND_THRESHOLD;
};

////////////////////////////////////////////////////////////////////////
// Exports

module.exports = {
	Corpse: Corpse,
	Walker: Walker,
};
