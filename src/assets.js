'use strict';

////////////////////////////////////////////////////////////////////////
// Asset functions

function setAnimations(sprite, key) {
	sprite.loadTexture(key);
	var sheet = PATH_MAP.spritesheets[key];
	if (sheet && sheet.animations) {
		var aname;
		for (aname in sheet.animations) {
			var anim = sheet.animations[aname];
			sprite.animations.add(aname, anim.frames, anim.fps, anim.loop);
		}
	}
}

////////////////////////////////////////////////////////////////////////
// LoadScreen

function LoadScreen() {
}

LoadScreen.prototype.preload = function() {
	game.load.image('loadbar', 'images/' + PATH_MAP.images.loadbar);
};

LoadScreen.prototype.create = function() {
	// Setup
	game.renderer.renderSession.roundPixels = true;
	game.antialias = false;
	game.stage.smoothed = false;

	// Sprites
	game.stage.backgroundColor = '#140c1c';
	var w = 800, h = 64;
	var x = game.world.centerX - w / 2;
	var y = game.world.height - h;
	this.gBack = game.add.image(x, y, 'loadbar');
	this.gBack.crop(new Phaser.Rectangle(0, h, w, h));
	this.gFront = game.add.image(x, y, 'loadbar');
	this.gRect = new Phaser.Rectangle(0, 0, w, h);
	this.gFront.crop(this.gRect);

	// Preload
	var key, obj, objs, uris, i;
	var images = PATH_MAP.images;
	for (key in images) {
		if (key == 'loadbar') {
			continue;
		}
		game.load.image(key, 'images/' + images[key]);
	}
	objs = PATH_MAP.spritesheets;
	for (key in objs) {
		obj = objs[key];
		game.load.spritesheet(key, 'images/' + obj.path, obj.w, obj.h);
	}
	objs = PATH_MAP.sfx;
	for (key in objs) {
		obj = objs[key];
		uris = [];
		for (i = 0; i < obj.length; i++) {
			uris.push('sfx/' + obj[i]);
		}
		game.load.audio(key, uris);
	}
	objs = PATH_MAP.levels;
	for (key in objs) {
		game.load.tilemap(
			key, 'levels/' + objs[key], null, Phaser.Tilemap.TILED_JSON);
	}
	game.load.start();
};

LoadScreen.prototype.update = function() {
	var margin = 8, w = 800;
	if (game.load.hasLoaded) {
		this.gRect.width = w;
		game.state.start('Level', true, false, {
			level: 'test',
		});
	} else {
		this.gRect.width = margin + (w - margin * 2) * (game.load.progress / 100);
	}
	this.gFront.updateCrop();
};

module.exports = {
	LoadScreen: LoadScreen,
};

////////////////////////////////////////////////////////////////////////
// Exports

module.exports = {
	setAnimations: setAnimations,
	LoadScreen: LoadScreen,
};
