'use strict';

var loaded = false;
var saveData = null;

////////////////////////////////////////////////////////////////////////
// Functions

var hasLocalStorage = (function() {
	try {
		return 'localStorage' in window && window.localStorage !== null;
	} catch (e) {
		return false;
	}
})();

function decode() {
	var st = new GameState();
	var save;
	try {
		save = JSON.parse(saveData);
	} catch (e) {
		return null;
	}
	if (typeof save != 'object') {
		return null;
	}
	st.hearts = save.hearts;
	st.chests = save.chests;
	st.weapons = save.weapons;
	return {
		state: st,
		level: save.level,
		source: 'save',
		sourceId: save.savePointId
	};
}

function load() {
	if (!loaded) {
		if (hasLocalStorage) {
			saveData = window.localStorage.getItem('save');
		}
		loaded = true;
	}
	if (!saveData) {
		return null;
	}
	var state = decode(saveData);
	if (!state) {
		console.error('Save data is corrupted');
	}
	return state;
}

////////////////////////////////////////////////////////////////////////
// Game state

function GameState() {
	this.hearts = 2;
	this.chests = {};
	this.weapons = [];
	this.currentWeapon = null;
	this.health = 4;
}

// Save the game state.
GameState.prototype.save = function(levelName, savePointId) {
	var data = JSON.stringify({
		hearts: this.hearts,
		chests: this.chests,
		weapons: this.weapons,
		currentWeapon: this.currentWeapon,
		level: levelName,
		savePointId: savePointId
	});
	saveData = data;
	if (hasLocalStorage) {
		window.localStorage.setItem('save', data);
	}
};

////////////////////////////////////////////////////////////////////////
// Exports

module.exports = {
	hasLocalStorage: hasLocalStorage,
	GameState: GameState,
};
