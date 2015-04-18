var game = new Phaser.Game(800, 480, Phaser.AUTO, 'game', {
	preload: preload,
	create: create,
	update: update
});

function preload() {
	var x, s;
	var images = PATH_MAP.images;
	for (x in images) {
		game.load.image(x, 'images/' + images[x]);
	}
	var spritesheets = PATH_MAP.spritesheets;
	for (x in spritesheets) {
		s = spritesheets[x];
		game.load.spritesheet(x, 'images/' + s.path, s.w, s.h);
	}
}

var player, platforms, cursors, walker;

function create() {
	cursors = game.input.keyboard.createCursorKeys();

	game.antialias = false;
	game.stage.smoothed = false;
	// game.scale.scaleMode = Phaser.ScaleManager.USER_SCALE;
	// game.scale.setUserScale(2);
	game.physics.startSystem(Phaser.Physics.ARCADE);

	player = game.add.sprite(32, game.world.height - 150, 'player');
	game.physics.arcade.enable(player);

	player.body.bounce.y = 0.2;
	player.body.gravity.y = 300;
	player.body.collideWorldBounds = true;

	// player.animations.add('left', [0, 1, 2, 3], 10, true);
	// player.animations.add('right', [5, 6, 7, 8], 10, true);

	walker = new Walker(player, PLAYER_STATS);
}

function update() {
	game.physics.arcade.collide(player, platforms);
	processInput();
}

function processInput() {
	var xdrive = 0, ydrive = 0;
	if (cursors.left.isDown) {
		xdrive += -1;
	}
	if (cursors.right.isDown) {
		xdrive += +1;
	}
	if (cursors.up.isDown) {
		ydrive += -1;
	}
	if (cursors.down.isDown) {
		ydrive += +1;
	}
	walker.update(xdrive, ydrive);
}

var PLAYER_STATS = {
	// Gravity
	gravity: 1200,

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
	jtime: 0.8,
	jaccel: 400,
	jspeed: 280,
	jdouble: true
};

function Walker(sprite, stats) {
	this.sprite = sprite;
	this.stats = stats;
	this.state = 0;
	this.jump_time = 0;
	this.step_distance = 0;
}

Walker.prototype = {
	update: function(xdrive, ydrive) {
		this.sprite.body.acceler
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
		if (Math.abs(xdel) <= xaccel * game.time.physicsElabsed) {
			body.velocity.x = xtarget;
			body.acceleration.x = 0;
		} else {
			body.acceleration.x = Math.sign(xdel) * xaccel;
		}
	},
};
