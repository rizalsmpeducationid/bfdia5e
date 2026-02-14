/*
 * CopperSalt HTML5b Console Patch: Create/Destroy Triggers
 * Paste this whole file into DevTools console after the game is loaded.
 */
(function () {
	if (window.CS5BTriggers && window.CS5BTriggers.__installed) {
		console.log('[CS5BTriggers] already installed');
		return;
	}

	function safeCall(fn, args) {
		try {
			return fn.apply(null, args || []);
		} catch (e) {
			console.warn('[CS5BTriggers] hook error:', e);
		}
	}

	function parsePos(raw) {
		let parts = String(raw || '').split(',').map(v => Number(v.trim()));
		if (!Number.isFinite(parts[0]) || !Number.isFinite(parts[1])) return null;
		return {x: Math.floor(parts[0]), y: Math.floor(parts[1])};
	}

	function resolveTileId(token) {
		let raw = String(token || '').trim();
		if (!raw) return -1;
		if (!Number.isNaN(Number(raw))) return Math.floor(Number(raw));
		if (typeof window.tileIDFromChar !== 'function') return -1;
		if (raw.length == 1) return window.tileIDFromChar(raw.charCodeAt(0));
		if (raw.length == 2) return 111 * window.tileIDFromChar(raw.charCodeAt(0)) + window.tileIDFromChar(raw.charCodeAt(1));
		return -1;
	}

	function getPlayerTilePos() {
		if (!Array.isArray(window.char)) return null;
		if (!Number.isFinite(window.control)) return null;
		let c = window.char[window.control];
		if (!c) return null;
		return {x: Math.floor(c.x / 30), y: Math.floor(c.y / 30)};
	}

	function inBounds(x, y) {
		return x >= 0 && y >= 0 && x < window.levelWidth && y < window.levelHeight;
	}

	let state = {
		links: [],
		firedKeys: {},
		dialogueEvents: {},
		lastDialogueCode: null
	};

	function fireDialogueCode(code) {
		let key = String(code || '').trim();
		if (!key) return;
		state.dialogueEvents[key] = true;
		state.lastDialogueCode = key;
	}

	function clearFrameEvents() {
		state.dialogueEvents = {};
	}

	function applyAction(link) {
		if (!Array.isArray(window.thisLevel)) return;
		if (link.action === 'create') {
			let parts = String(link.value || '').split('@');
			if (parts.length < 2) return;
			let tileId = resolveTileId(parts[0]);
			let pos = parsePos(parts[1]);
			if (!pos || tileId < 0 || !inBounds(pos.x, pos.y)) return;
			window.thisLevel[pos.y][pos.x] = tileId;
		} else if (link.action === 'destroy') {
			let pos = parsePos(link.value);
			if (!pos || !inBounds(pos.x, pos.y)) return;
			window.thisLevel[pos.y][pos.x] = 0;
		}
		if (typeof window.getTileDepths === 'function') safeCall(window.getTileDepths);
	}

	function shouldRun(link, playerPos) {
		switch (link.when) {
			case 'onTouchedByPlayer':
				return !!playerPos && playerPos.x === link.triggerX && playerPos.y === link.triggerY;
			case 'PlayerOnTheSameXCoordinate':
				return !!playerPos && playerPos.x === link.triggerX;
			case 'PlayerOnTheSameYCoordinate':
				return !!playerPos && playerPos.y === link.triggerY;
			case 'TriggeredByDialogue': {
				let src = String(link.sourceTriggerId || '').trim();
				if (!src) return Object.keys(state.dialogueEvents).length > 0;
				return !!state.dialogueEvents[src];
			}
			default:
				return false;
		}
	}

	function updateRuntime() {
		if (window.menuScreen !== 3) {
			clearFrameEvents();
			return;
		}
		let playerPos = getPlayerTilePos();
		for (let i = 0; i < state.links.length; i++) {
			let link = state.links[i];
			let key = `${link.id}:${link.triggerX},${link.triggerY}`;
			if (state.firedKeys[key]) continue;
			if (!shouldRun(link, playerPos)) continue;
			state.firedKeys[key] = true;
			applyAction(link);
		}
		clearFrameEvents();
	}

	function wrapFunction(name, wrapper) {
		if (typeof window[name] !== 'function') return false;
		let old = window[name];
		window[name] = wrapper(old);
		return true;
	}

	// Capture +NN dialogue trigger codes.
	wrapFunction('displayLine', old => function (level, line) {
		let out = old.apply(this, arguments);
		try {
			let arr = window.cLevelDialogueText || [];
			let txt = String(arr[line] || '');
			let m = txt.match(/^\+([0-9]{2})\b/);
			if (m) fireDialogueCode(m[1]);
		} catch (e) {
			console.warn('[CS5BTriggers] dialogue hook error:', e);
		}
		return out;
	});

	// Clear state on level reset/load flows.
	function resetState() {
		state.firedKeys = {};
		state.dialogueEvents = {};
		state.lastDialogueCode = null;
	}
	wrapFunction('resetLevel', old => function () {
		resetState();
		return old.apply(this, arguments);
	});
	wrapFunction('readLevelString', old => function () {
		resetState();
		return old.apply(this, arguments);
	});
	wrapFunction('readExploreLevelString', old => function () {
		resetState();
		return old.apply(this, arguments);
	});

	// Runtime execution every frame.
	wrapFunction('draw', old => function () {
		let out = old.apply(this, arguments);
		updateRuntime();
		return out;
	});

	window.CS5BTriggers = {
		__installed: true,
		configure: function (links) {
			if (!Array.isArray(links)) throw new Error('configure(links): links must be an array');
			state.links = links.map((link, i) => ({
				id: String(link.id || `link_${i}`),
				triggerX: Math.floor(Number(link.triggerX) || 0),
				triggerY: Math.floor(Number(link.triggerY) || 0),
				action: String(link.action || 'create').toLowerCase(),
				value: String(link.value || ''),
				when: String(link.when || 'onTouchedByPlayer'),
				sourceTriggerId: String(link.sourceTriggerId || '')
			}));
			resetState();
			console.log('[CS5BTriggers] configured links:', state.links);
		},
		addLink: function (link) {
			this.configure(state.links.concat([link]));
		},
		reset: resetState,
		getState: function () {
			return JSON.parse(JSON.stringify(state));
		},
		help: function () {
			console.log(`\n[CS5BTriggers] Usage:\n\nCS5BTriggers.configure([\n  {\n    id: 'create_1',\n    triggerX: 10,\n    triggerY: 12,\n    action: 'create',\n    value: 'R@12,19',\n    when: 'onTouchedByPlayer'\n  },\n  {\n    id: 'destroy_1',\n    triggerX: 15,\n    triggerY: 8,\n    action: 'destroy',\n    value: '32,22',\n    when: 'TriggeredByDialogue',\n    sourceTriggerId: '51'\n  }\n]);\n`);
		}
	};

	console.log('[CS5BTriggers] installed. Run CS5BTriggers.help()');
})();
