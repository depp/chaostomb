console.log(Phaser)

var game = new Phaser.Game(900, 600, Phaser.AUTO, 'game', {
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

var player, platforms;

function create() {
	game.physics.startSystem(Phaser.Physics.ARCADE);

	player = game.add.sprite(32, game.world.height - 150, 'player');
	game.physics.arcade.enable(player);

	player.body.bounce.y = 0.2;
	player.body.gravity.y = 300;
	player.body.collideWorldBounds = true;

	// player.animations.add('left', [0, 1, 2, 3], 10, true);
	// player.animations.add('right', [5, 6, 7, 8], 10, true);
}

function update() {
	game.physics.arcade.collide(player, platforms);
}
