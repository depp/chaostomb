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
	game.add.sprite(0, 0, 'sky');
	platforms = game.add.group();
	platforms.enableBody = true;
	var ground = platforms.create(0, game.world.height - 64, 'platform');
	ground.scale.setTo(2, 2);
	ground.body.immovable = true;
	var ledge = platforms.create(400, 400, 'platform');
	ledge.body.immovable = true;
	ledge = platforms.create(-150, 250, 'platform');
	ledge.body.immovable = true;

	player = game.add.sprite(32, game.world.height - 150, 'dude');
	game.physics.arcade.enable(player);

	player.body.bounce.y = 0.2;
	player.body.gravity.y = 300;
	player.body.collideWorldBounds = true;

	player.animations.add('left', [0, 1, 2, 3], 10, true);
	player.animations.add('right', [5, 6, 7, 8], 10, true);
}

function update() {
	game.physics.arcade.collide(player, platforms);
}
