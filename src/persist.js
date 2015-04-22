/* Copyright 2015 Dietrich Epp.

   This file is part of Chaos Tomb.  The Chaos Tomb source code is
   distributed under the terms of the 2-clause BSD license.
   See LICENSE.txt for details. */
'use strict';

var hasLocalStorage = (function() {
	try {
		return 'localStorage' in window && window.localStorage !== null;
	} catch (e) {
		return false;
	}
})();

module.exports = {
	hasLocalStorage: hasLocalStorage,
};
