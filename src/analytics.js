'use strict';
var persist = require('./persist');

var endpoint = process.env.ANALYTICS;
var playerKey;

// Initialize analytics, call a callback when done.
// The callback is always called, analytics is optional.
function init(callback, context) {
	if (typeof playerKey !== 'undefined') {
		callback.call(context);
		return;
	}
	if (persist.hasLocalStorage) {
		var key = window.localStorage.getItem('key');
		if (key !== null) {
			playerKey = key;
			callback.call(context);
			return;
		}
	}
	if (typeof endpoint !== 'string') {
		console.warn('Analytics is not configured.');
		callback.call(context);
		return;
	}
	var xhr = new XMLHttpRequest();
	xhr.open('POST', endpoint + 'player', true);
	xhr.timeout = 15 * 1000;
	xhr.onreadystatechange = function() {
		if (xhr.readyState !== 4) {
			return;
		}
		var key;
		if (xhr.status == 200) {
			var data;
			try {
				data = JSON.parse(xhr.responseText);
				key = data.Player;
			} catch (e) {
			}
		}
		if (typeof key == 'string') {
			playerKey = key;
			if (persist.hasLocalStorage) {
				window.localStorage.setItem('key', key);
			}
		} else {
			playerKey = null;
		}
		callback.call(context);
	};
	xhr.setRequestHeader('Content-Type', 'application/json');
	xhr.send(JSON.stringify({
		Referrer: document.referrer,
	}));
}

// Start a new game, call a callback when the game key is ready.
// The callback is always called.
function startGame(callback, context) {
	if (!playerKey) {
		callback.call(context, null);
		return;
	}
	var xhr = new XMLHttpRequest();
	xhr.open('POST', endpoint + 'game', true);
	xhr.timeout = 15 * 1000;
	xhr.onreadystatechange = function() {
		if (xhr.readyState !== 4) {
			return;
		}
		var key;
		if (xhr.status == 200) {
			var data;
			try {
				data = JSON.parse(xhr.responseText);
				key = data.Game;
			} catch (e) {
			}
		}
		if (typeof key != 'string') {
			key = null;
		}
		callback.call(context, key);
	};
	xhr.setRequestHeader('Content-Type', 'application/json');
	xhr.send(JSON.stringify({
		Player: playerKey,
	}));
}

// Record game status.
function recordStatus(data) {
	if (!data.Game) {
		return;
	}
	var xhr = new XMLHttpRequest();
	xhr.open('POST', endpoint + 'status', true);
	xhr.timeout = 30 * 1000;
	xhr.setRequestHeader('Content-Type', 'application/json');
	xhr.send(JSON.stringify(data));
}

module.exports = {
	init: init,
	startGame: startGame,
	recordStatus: recordStatus,
};
