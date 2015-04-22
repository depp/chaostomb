'use strict';
var persist = require('./persist');
var weapons = require('./weapons');
var analytics = require('./analytics');

var saveData;
var loadCount = 0;

////////////////////////////////////////////////////////////////////////
// Game state

function GameState(gameKey) {
	var i, j, name, t;
	this.hearts = 2;
	this.chests = [];
	this.weapons = [];
	this.currentWeapon = null;
	this.health = 4;
	this.weaponOrder = [];
	this.doubleJump = false;
	this.invincible = false;
	this.cheat = false;
	this.gameKey = gameKey;
	this.saveCount = 0;
	this.loadCount = 0;
	this.levelIndex = 0;
	this.levelTime = 0;
	this.level = 'entrance1';
	this.source = 'newGame';
	this.sourceId = null;

	for (name in weapons) {
		this.weaponOrder.push(name);
	}
	for (i = 1; i < this.weaponOrder.length; i++) {
		j = Math.floor(Math.random() * (i + 1));
		if (j != i) {
			t = this.weaponOrder[i];
			this.weaponOrder[i] = this.weaponOrder[j];
			this.weaponOrder[j] = t;
		}
	}
	// 'gun' is always last
	i = this.weaponOrder.indexOf('Gun');
	j = this.weaponOrder.length - 1;
	if (i >= 0 && i != j) {
			t = this.weaponOrder[i];
			this.weaponOrder[i] = this.weaponOrder[j];
			this.weaponOrder[j] = t;
	}
}

// Start the game.
GameState.prototype.start = function() {
	this.levelTime = 0;
	game.state.start('Level', true, false, this);
};

// Change the level.
GameState.prototype.changeLevel = function(level, source, sourceId) {
	this.levelIndex++;
	this.level = level;
	this.source = source;
	this.sourceId = sourceId;
	this.start();
};

// Save the game state.
GameState.prototype.save = function(savePointId) {
	this.saveCount++;
	var data = JSON.stringify({
		version: 2,
		hearts: this.hearts,
		chests: this.chests,
		weapons: this.weapons,
		currentWeapon: this.currentWeapon,
		// health is not saved
		weaponOrder: this.weaponOrder,
		doubleJump: this.doubleJump,
		cheat: this.cheat,
		// invincible is not saved
		gameKey: this.gameKey,
		saveCount: this.saveCount,
		// loadCount saved elsewhere
		levelIndex: this.levelIndex,
		// levelTime not saved
		level: this.level,
		// source + sourceId derived from savePointId
		savePointId: savePointId,
	});
	saveData = data;
	if (persist.hasLocalStorage) {
		window.localStorage.setItem('save', data);
	}
};

// Report game status to analytics.
GameState.prototype.report = function(status) {
	if (!this.gameKey) {
		return;
	}
	analytics.recordStatus({
		Game: this.gameKey,
		Status: status,
		Level: this.level,
		LevelIndex: this.levelIndex,
		LevelTime: this.levelTime,
		Weapons: this.weapons,
		DoubleJump: this.doubleJump,
		Chests: this.chests,
		Cheat: this.cheat,
		SaveCount: this.saveCount,
		LoadCount: this.loadCount,
		Health: this.health,
		Hearts: this.hearts,
	});
};

////////////////////////////////////////////////////////////////////////
// Functions

// Start a new game.
function startNewGame() {
	analytics.startGame(function(gameKey) {
		var state = new GameState(gameKey);
		state.start();
	});
}

// Load the saved game, but do not start it.  Returns null if
// there is no saved game.
function loadSavedGame() {
	if (typeof saveData == 'undefined') {
		if (persist.hasLocalStorage) {
			saveData = window.localStorage.getItem('save');
			loadCount = window.localStorage.getItem('loadCount');
			if (loadCount) {
				loadCount = parseInt(loadCount);
			} else {
				loadCount = 0;
			}
		} else {
			saveData = null;
			loadCount = 0;
		}
	}
	if (!saveData) {
		return null;
	}
	var save;
	try {
		save = JSON.parse(saveData);
	} catch (e) {
		console.warn('Corrupted save game');
		return false;
	}
	if (!save || typeof save != 'object') {
		console.warn('Corrupted save game');
		return false;
	}
	if (typeof save.version == 'undefined') {
		save.version = 1;
	}
	if (save.version < 2) {
		save.chests = [];
		save.cheat = false;
		save.gameKey = null;
		save.saveCount = 1;
		save.loadCount = 0;
		save.levelIndex = 0;
	}
	if (save.version > 2) {
		console.warn('Unknown save game version');
		return null;
	}

	var st = new GameState(save.gameKey);
	st.hearts = save.hearts;
	st.chests = save.chests;
	st.weapons = save.weapons;
	st.currentWeapon = save.currentWeapon;
	st.health = st.hearts * 2;
	st.weaponOrder = save.weaponOrder;
	st.doubleJump = !!save.doubleJump;
	st.cheat = !!save.cheat;
	// invincible is not loaded
	st.gameKey = save.gameKey;
	st.saveCount = save.saveCount;
	st.loadCount = loadCount;
	st.levelIndex = save.levelIndex;
	st.levelTime = 0;
	st.level = save.level;
	st.source = 'save';
	st.sourceId = save.savePointId;
	return st;
}

// Get a "new game" menu item.
function itemNewGame() {
	return {
		preference: 0,
		text: 'Start New Game',
		func: startNewGame,
	};
}

// Get a "load game" menu item.
function itemLoadGame() {
	var state = loadSavedGame();
	var obj = {
		text: 'Load Saved Game',
	};
	if (state) {
		obj.preference = +10;
		obj.func = function() {
			state.loadCount++;
			loadCount = state.loadCount;
			if (persist.hasLocalStorage) {
				window.localStorage.setItem('loadCount', loadCount);
			}
			state.start();
		};
	} else {
		obj.preference = -10;
	}
	return obj;
}

////////////////////////////////////////////////////////////////////////
// Exports

module.exports = {
	itemNewGame: itemNewGame,
	itemLoadGame: itemLoadGame,
};
