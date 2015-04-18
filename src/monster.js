'use strict';

var TYPES = {
	Eye: {}
};

function spawn(group, obj) {
	var sprite = group.create(
		obj.x + obj.width / 2, obj.y + obj.height / 2, obj.type.toLowerCase());
	sprite.anchor.setTo(0.5, 0.5);
}

function Monster(group, type) {

}

module.exports = {
	TYPES: TYPES,
	Monster: Monster,
	spawn: spawn
};
