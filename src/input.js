'use strict';
var persist = require('./persist');

var COMMANDS = {
	left: true,
	right: true,
	up: true,
	down: true,
	fire: true,
	wprev: true,
	wnext: true,
};

var DEFAULT_BINDINGS = {
	keys: {
		left: 'LEFT',
		right: 'RIGHT',
		up: 'UP',
		down: 'DOWN',
		wprev: 'Z',
		wnext: 'X',
		fire: 'C',
	},
};

function getButtons(s) {
	var names;
	if (typeof s == 'string') {
		names = s.split(' ');
	} else if (s.constructor == Array) {
		names = s;
	} else {
		return [];
	}
	var i;
	var buttons = [];
	for (i = 0; i < names.length; i++) {
		var n = names[i], v = null;
		switch (typeof n) {
		case 'string':
			v = Phaser.Keyboard[names[i]];
			break;
		case 'number':
			v = n;
			break;
		}
		if (typeof v != 'number') {
			console.error('Invalid key:', n);
		} else {
			v = game.input.keyboard.addKey(v);
			buttons.push(v);
		}
	}
	return buttons;
}

var keys = null;
var bindings = null;
var userbindings = null;

function loadBindings() {
	userbindings = {};
	if (!persist.hasLocalStorage) {
		return;
	}
	var data = window.localStorage.getItem('bindings');
	if (data === null) {
		return;
	}
	try {
		data = JSON.parse(data);
	} catch (e) {
		return;
	}
	if (typeof data !== 'object') {
		return;
	}
	userbindings = data;
}

function loadKeys() {
	var cmd;
	if (!userbindings) {
		loadBindings();
	}
	var objs = [userbindings, DEFAULT_BINDINGS];
	bindings = {};
	var i;
	for (i = 0; i < objs.length; i++) {
		var obj = objs[i].keys;
		if (typeof obj !== 'object') {
			continue;
		}
		for (cmd in COMMANDS) {
			if (!(cmd in obj) || (cmd in bindings)) {
				continue;
			}
			var buttons = getButtons(obj[cmd]);
			if (buttons.length !== 0) {
				bindings[cmd] = buttons;
			}
		}
	}
	keys = {};
	for (cmd in COMMANDS) {
		keys[cmd] = 0;
	}
}

function getKeys() {
	if (!keys) {
		loadKeys();
	}
	return keys;
}

function update() {
	var cmd, pkeys, i, state, ostate;
	for (cmd in COMMANDS) {
		state = false;
		pkeys = bindings[cmd];
		for (i = 0; i < pkeys.length; i++) {
			if (pkeys[i].isDown) {
				state = true;
				break;
			}
		}
		if (!state) {
			keys[cmd] = 0;
		} else {
			keys[cmd] = keys[cmd] === 0 ? 1 : 2;
		}
	}
}

function rebind(cmd, buttons) {
	getKeys();
	if (!(cmd in COMMANDS)) {
		console.error('No such binding, cannot bind:', cmd);
		return;
	}
	var blist = getButtons(buttons);
	if (blist.length === 0) {
		console.error('Invalid keys, cannot bind:', buttons);
		return;
	}
	if (!('keys' in userbindings)) {
		userbindings.keys = {};
	}
	userbindings.keys[cmd] = buttons;
	bindings[cmd] = blist;
	if (persist.hasLocalStorage) {
		console.log('bindings saved');
		window.localStorage.setItem('bindings', JSON.stringify(userbindings));
	}
}

module.exports = {
	getKeys: getKeys,
	update: update,
	rebind: rebind,
};

global.rebind = rebind;
