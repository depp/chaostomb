'use strict';

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

module.exports = {
	setAnimations: setAnimations
};
