/* Copyright 2015 Dietrich Epp.

   This file is part of Chaos Tomb.  The Chaos Tomb source code is
   distributed under the terms of the 2-clause BSD license.
   See LICENSE.txt for details. */
'use strict';

var MUSIC_FADE_TIME = 1;

var curAudio = null;
var curKey = null;
var nextKey = null;
var loaded = null;
var fading = false;

function update() {
	if (!nextKey || curAudio) {
		return;
	}
	if (!game.cache.checkSoundKey(nextKey)) {
		return;
	}
	curAudio = game.sound.add(nextKey, 1, true);
	curKey = nextKey;
	nextKey = null;
	curAudio.play();
}

function fileComplete(progress, key, success, loaded, total) {
	try {
	if (nextKey && key === nextKey) {
		var timer = game.time.create(true);
		timer.add(0, update);
		timer.start();
	}
	} catch (e) {
		console.error(e);
	}
}

function fadeComplete() {
	curAudio.destroy();
	curAudio = null;
	curKey = null;
	fading = false;
	update();
}

function play(name) {
	var key, paths;
	if (!name) {
		key = null;
	} else {
		key = 'music/' + name;
		paths = PATH_MAP.music[name];
		if (!paths) {
			console.error('No such music:', name);
			key = null;
		}
	}
	if (key === (nextKey || curKey)) {
		return;
	}
	if (curAudio && !fading) {
		curAudio.fadeOut(MUSIC_FADE_TIME * 1000);
		curAudio.onFadeComplete.addOnce(fadeComplete);
		fading = true;
	}
	nextKey = key;
	if (!key) {
		return;
	}
	if (!loaded) {
		loaded = {};
		game.load.onFileComplete.add(fileComplete);
	}
	if (!loaded[key]) {
		var uris = [], i;
		for (i = 0; i < paths.length; i++) {
			uris.push('music/' + paths[i]);
		}
		game.load.audio(key, uris);
		game.load.start();
	}
	update();
}

module.exports = {
	play: play,
};
