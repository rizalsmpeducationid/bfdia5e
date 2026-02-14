/*
 * CopperSalt HTML5b Console Patch: Full Content Loader (tiles + characters + water flow)
 * Paste this entire file into DevTools console on vanilla HTML5b.
 */
(function () {
	if (window.CS5BContentPatch && window.CS5BContentPatch.__installed) {
		console.log('[CS5BContentPatch] already installed');
		return;
	}

	const DEFAULT_MANIFEST = {
		assetBase: '',
		tiles: [
			{
				name: 'sandheart',
				id: 'Ͳ',
				imagePath: 'master/visuals/newblock/sandheart.svg',
				canCollide: true,
				collision: ['up', 'down', 'left', 'right'],
				isSwimmable: false,
				isDeadly: false
			},
			{
				name: 'grasstile',
				id: '♳',
				imagePath: 'master/visuals/newblock/grasstile.svg',
				canCollide: false,
				collision: [],
				isSwimmable: false,
				isDeadly: false
			},
			{
				name: 'flowers',
				id: '¶',
				imagePath: 'master/visuals/newblock/flowers.svg',
				canCollide: false,
				collision: [],
				isSwimmable: false,
				isDeadly: false
			}
		],
		characters: [
			{
				character_id: 'firey',
				display_name: 'firey',
				placeholder_gif_path: 'data/newchar/firey.gif',
				mechanics: {
					has_arms: true,
					movement: { speed: 1, jump_height: 4 },
					collision: { character_scale: 1.0, hitbox: { width: 32, height: 64 } }
				}
			},
			{
				character_id: 'leafy',
				display_name: 'leafy',
				placeholder_gif_path: 'data/newchar/leafy.gif',
				mechanics: {
					has_arms: true,
					movement: { speed: 1, jump_height: 4 },
					collision: { character_scale: 1.0, hitbox: { width: 32, height: 64 } }
				}
			}
		]
	};

	function clamp(n, mn, mx) { return Math.min(mx, Math.max(mn, n)); }
	function safeScaleFactor() { return Number(window.scaleFactor) > 0 ? Number(window.scaleFactor) : 1; }

	function tileIdFromToken(token) {
		const raw = String(token || '').trim();
		if (!raw) return -1;
		if (!Number.isNaN(Number(raw))) return Math.floor(Number(raw));
		if (typeof window.tileIDFromChar !== 'function') return -1;
		if (raw.length === 1) return window.tileIDFromChar(raw.charCodeAt(0));
		if (raw.length === 2) {
			return 111 * window.tileIDFromChar(raw.charCodeAt(0)) + window.tileIDFromChar(raw.charCodeAt(1));
		}
		return -1;
	}

	function ensureArraysToTileId(tileId) {
		while (window.blockProperties.length <= tileId) {
			window.blockProperties.push([false,false,false,false,false,false,false,false,false,false,false,0,0,false,false,true,1,false]);
			window.tileNames.push('');
		}
	}

	function normalizeImagePath(path, assetBase) {
		let p = String(path || '').trim();
		if (p.startsWith('master/')) p = p.slice('master/'.length);
		if (/^(https?:|data:|blob:)/.test(p)) return p;
		if (!assetBase) return p;
		return assetBase.replace(/\/$/, '') + '/' + p.replace(/^\//, '');
	}

	function loadImage(path) {
		return new Promise((resolve, reject) => {
			const img = new Image();
			img.onload = () => resolve(img);
			img.onerror = reject;
			img.src = path;
		});
	}

	function toTileCanvas(image) {
		const scaleFactor = safeScaleFactor();
		const c = document.createElement('canvas');
		c.width = 30 * scaleFactor;
		c.height = 30 * scaleFactor;
		const ctx = c.getContext('2d');
		ctx.imageSmoothingEnabled = false;
		ctx.drawImage(image, 0, 0, c.width, c.height);
		return c;
	}

	function makeProps(tile) {
		const props = [false,false,false,false,false,false,false,false,false,false,false,0,0,false,false,true,1,false];
		const collision = Array.isArray(tile.collision) ? tile.collision.map(v => String(v).toLowerCase()) : [];
		const canCollide = !!tile.canCollide;
		props[0] = canCollide && collision.includes('down');
		props[1] = canCollide && collision.includes('up');
		props[2] = canCollide && collision.includes('right');
		props[3] = canCollide && collision.includes('left');
		props[4] = !!tile.isDeadly;
		props[5] = !!tile.isDeadly;
		props[6] = !!tile.isDeadly;
		props[7] = !!tile.isDeadly;
		props[14] = !!tile.isSwimmable;
		return props;
	}

	async function installTiles(manifest) {
		if (!Array.isArray(manifest.tiles)) return;
		for (const tile of manifest.tiles) {
			const tileId = tileIdFromToken(tile.id);
			if (tileId < 0) continue;
			ensureArraysToTileId(tileId);
			const src = normalizeImagePath(tile.imagePath, manifest.assetBase);
			let image;
			try {
				image = await loadImage(src);
			} catch (e) {
				console.warn('[CS5BContentPatch] failed loading tile image, fallback used:', src, e);
				if (typeof window.createImage === 'function' && window.resourceData && window.resourceData['blocks/b0001.svg']) {
					image = await window.createImage(window.resourceData['blocks/b0001.svg']);
				} else {
					continue;
				}
			}
			window.blockProperties[tileId] = makeProps(tile);
			window.tileNames[tileId] = tile.name || ('custom_' + tileId);
			window.svgTiles[tileId] = toTileCanvas(image);
			window.svgTilesVB[tileId] = [0, 0, 30, 30];
			console.log(`[CS5BContentPatch] tile installed: ${window.tileNames[tileId]} (${tileId}) from ${src}`);
		}
	}

	function registerCharacter(cfg, assetBase) {
		if (!cfg || !window.charD || !window.names || !window.charModels) return;
		if (!window.customCharacterSpriteData) window.customCharacterSpriteData = [];
		const displayName = cfg.display_name || cfg.character_id || 'Custom Character';
		const hitbox = (cfg.mechanics && cfg.mechanics.collision && cfg.mechanics.collision.hitbox) || {};
		const scale = clamp(Number(cfg.mechanics?.collision?.character_scale) || 1, 0.2, 4);
		const hitboxWidth = clamp(Number(hitbox.width) || 32, 8, 200);
		const hitboxHeight = clamp(Number(hitbox.height) || 64, 8, 300);
		const halfWidth = (hitboxWidth * scale) / 2;
		const fullHeight = hitboxHeight * scale;
		const speed = Number(cfg.mechanics?.movement?.speed);
		const friction = clamp(Number.isFinite(speed) ? 0.9 - speed * 0.03 : 0.78, 0.45, 0.9);
		const hasArms = cfg.mechanics?.has_arms !== false;
		const gifPath = normalizeImagePath(cfg.placeholder_gif_path || 'data/newchar/firey.gif', assetBase);

		const charId = window.charD.length;
		window.charD.push([halfWidth, fullHeight, 0.4, Math.round(fullHeight * 0.45), friction, true, 1, 1, hasArms, 10]);
		window.names.push(displayName);
		window.charModels.push({
			firemat: {a:-0.35,b:0,c:0,d:0.35,tx:0,ty:-fullHeight * 0.55},
			burstmat: {a:1,b:0,c:0,d:1,tx:0,ty:-fullHeight * 0.6},
			charimgmat: {a:0.4,b:0,c:0,d:0.4,tx:0,ty:0}
		});
		window.customCharacterSpriteData[charId] = { gifPath, vb: [-halfWidth, -fullHeight, halfWidth * 2, fullHeight] };
		console.log(`[CS5BContentPatch] character installed: ${displayName} (${charId}) gif=${gifPath}`);
	}

	function installCharacters(manifest) {
		if (!Array.isArray(manifest.characters)) return;
		for (const c of manifest.characters) registerCharacter(c, manifest.assetBase);
	}

	function applyWaterFlow(tileToken, frameCount, frameOrder) {
		const tileId = tileIdFromToken(tileToken);
		if (tileId < 0 || !window.blockProperties[tileId]) return false;
		const props = window.blockProperties[tileId].slice();
		props[14] = true;
		props[16] = Math.max(2, Math.floor(Number(frameCount) || 2));
		props[17] = true;
		if (Array.isArray(frameOrder) && frameOrder.length > 0) props[18] = frameOrder.map(v => Math.floor(Number(v) || 0));
		else props[18] = Array.from({ length: props[16] }, (_, i) => i);
		window.blockProperties[tileId] = props;
		console.log(`[CS5BContentPatch] water flow enabled on tile ${tileId} with ${props[16]} frames`);
		return true;
	}

	function install(manifestOverride) {
		if (!window.blockProperties || !window.svgTiles || !window.tileNames || !window.svgTilesVB) {
			throw new Error('Game globals not ready. Run this after HTML5b has fully loaded.');
		}
		const manifest = Object.assign({}, DEFAULT_MANIFEST, manifestOverride || {});
		installTiles(manifest)
			.then(() => {
				installCharacters(manifest);
				if (typeof window.getTileDepths === 'function') window.getTileDepths();
				console.log('[CS5BContentPatch] install complete');
			})
			.catch(err => console.error('[CS5BContentPatch] install failed', err));
	}

	window.CS5BContentPatch = {
		__installed: true,
		manifest: JSON.parse(JSON.stringify(DEFAULT_MANIFEST)),
		install,
		applyWaterFlow,
		help() {
			console.log([
				'[CS5BContentPatch] Quick start:',
				'1) CS5BContentPatch.install();',
				'2) (optional) CS5BContentPatch.applyWaterFlow("♳", 4, [0,1,2,1]);',
				'',
				'Important embedded asset paths:',
				' - firey gif: data/newchar/firey.gif',
				' - leafy gif: data/newchar/leafy.gif',
				' - grass tile svg: master/visuals/newblock/grasstile.svg',
				' - sandheart svg: master/visuals/newblock/sandheart.svg',
				' - flowers svg: master/visuals/newblock/flowers.svg',
				'',
				'If assets are hosted elsewhere, pass an override:',
				'CS5BContentPatch.install({ assetBase: "https://raw.githubusercontent.com/<you>/<repo>/main" });'
			].join('\n'));
		}
	};

	console.log('[CS5BContentPatch] installed. Run CS5BContentPatch.help()');
})();
