'use strict';

var MUSIC_FADE_TIME = 1;

var curAudio = null;
var curName = null;
var nextAudio = null;
var nextName = null;

function play(name) {
	if (!name) {
		name = null;
	}
	if (name === (nextName || curName)) {
		return;
	}
	var s = PATH_MAP.music[name];
	if (!s) {
		console.error('No such music:', name);
		return;
	}
	var uris = [], i;
	for (i = 0; i < s.length; i++) {
		uris.push('music/' + s[i]);
	}
	var audio = null;
	if (name) {
		audio = game.add.audio('music/' + name);
	}
	if (nextAudio) {
		nextAudio = audio;
		nextName = name;
	} else if (curAudio) {
		curAudio.fadeOut(MUSIC_FADE_TIME * 1000);
		curAudio.onFadeComplete.addOnce(function() {
			curAudio = nextAudio;
			curName = nextName;
			nextAudio = null;
			nextName = null;
			if (curAudio) {
				curAudio.play();
			}
		});
	} else {
		curAudio = audio;
		curName = name;
		if (curAudio) {
			curAudio.play();
		}
	}
}

module.exports = {
	play: play
};
