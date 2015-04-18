'use strict';

function Walker(sprite, stats) {
	sprite.body.bounce.y = stats.bounce;
	this.sprite = sprite;
	this.stats = stats;
	this.state = 0;
	this.jumptime = 0;
	this.jumpdown = false;
	this.stepdistance = 0;
}

Walker.prototype = {
	updatePlayer: function(input) {
		var xdrive = 0, ydrive = 0;
		if (input.left.isDown) {
			xdrive += -1;
		}
		if (input.right.isDown) {
			xdrive += +1;
		}
		if (input.up.isDown) {
			ydrive += -1;
		}
		if (input.down.isDown) {
			ydrive += +1;
		}
		this.update(xdrive, ydrive);
	},

	update: function(xdrive, ydrive) {
		var body = this.sprite.body;
		var stats = this.stats;

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

		// The target speed
		var xtarget = xdrive * speed;
		// Delta speed requested by player
		var xdel = xtarget - body.velocity.x;
		// Final X acceleration
		var xaccel;
		if (Math.abs(xdrive) > 0.1) {
			xaccel = accel;
			var xfrac = body.velocity.x / xtarget;
			if (xfrac > 0.8) {
				xaccel *= 0.5;
			}
		} else {
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
		if (ydrive <= -0.5) {
			if (this.jumptime > 0) {
				this.jumptime -= game.time.physicsElapsed;
				body.acceleration.y = stats.jaccel * ydrive;
			} else {
				var can_jump = !this.jumpdown &&
					(this.state === 0 || this.state === 1 && stats.jdouble);
				if (can_jump) {
					this.state++;
					this.jumptime = stats.jtime;
					if (body.velocity.y >= -stats.jspeed) {
						body.velocity.y = -stats.jspeed;
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
		if (!did_jump && body.onFloor()) {
			this.state = 0;
		}
	},
};

module.exports.Walker = Walker;