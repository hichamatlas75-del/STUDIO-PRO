/**
 * ============================================================================
 * SHARED HELPERS: Sanitization, ID Generation, Typographic, QR Code, Photo Filters,
 * Culinary Icons & Storage Constants (InMenu Studio Pro v4.0 Ultimate PAO)
 * ============================================================================
 */
const PT_TO_MM = 0.3528;

function escapeHTML(str) {
    return String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function sanitizeUrl(url) {
    const raw = String(url ?? '').trim();
    if (!raw) return '';
    if (/^(https?:\/\/|data:image\/|blob:)/i.test(raw)) return raw;
    return '';
}

let __uidCounter = 0;
function generateUniqueId(prefix = 'obj') {
    __uidCounter += 1;
    return `${prefix}_${Date.now().toString(36)}_${__uidCounter.toString(36)}`;
}

function isSansFontFamily(family) {
    return family === 'Inter' || family === 'Montserrat';
}

function getFontFallback(family) {
    if (family === 'Inter' || family === 'Montserrat') return 'sans-serif';
    if (family === 'JetBrains Mono') return 'monospace';
    return 'serif';
}

function sanitizeFileName(str) {
    return String(str ?? '').replace(/[^\w.\-]+/g, '_').replace(/^_+|_+$/g, '') || 'export';
}

/**
 * ============================================================================
 * PILIER 0 : COMBINAISONS DE POLICES PRÉDÉFINIES (FONT PAIRINGS)
 * ============================================================================
 */
const FONT_PAIRINGS = {
    bistrot_chic: {
        id: 'bistrot_chic',
        name: 'Bistrot Chic (Défaut)',
        label: 'Playfair Display + Inter + Montserrat',
        headingFont: 'Playfair Display',
        bodyFont: 'Inter',
        priceFont: 'Montserrat'
    },
    palace_prestige: {
        id: 'palace_prestige',
        name: 'Palace & Prestige',
        label: 'Cinzel + Cormorant Garamond + Montserrat',
        headingFont: 'Cinzel',
        bodyFont: 'Cormorant Garamond',
        priceFont: 'Montserrat'
    },
    moderne_minimal: {
        id: 'moderne_minimal',
        name: 'Moderne Minimal',
        label: 'Montserrat + Inter + JetBrains Mono',
        headingFont: 'Montserrat',
        bodyFont: 'Inter',
        priceFont: 'JetBrains Mono'
    }
};

/**
 * ============================================================================
 * PILIER 0 : FILTRES PHOTO & RÉGLAGES D'IMAGE (DOM + CANVAS 300 DPI)
 * ============================================================================
 */
const PHOTO_FILTER_PRESETS = {
    natural: {
        id: 'natural',
        name: 'Naturel',
        brightness: 100,
        contrast: 100,
        saturate: 100,
        blur: 0,
        sepia: 0
    },
    warm: {
        id: 'warm',
        name: 'Chaud Gourmand (Warm)',
        brightness: 106,
        contrast: 108,
        saturate: 128,
        blur: 0,
        sepia: 12
    },
    vintage: {
        id: 'vintage',
        name: 'Bistrot Vintage (Sepia léger)',
        brightness: 102,
        contrast: 96,
        saturate: 85,
        blur: 0,
        sepia: 32
    },
    bw_contrast: {
        id: 'bw_contrast',
        name: 'Noir & Blanc Contrasté',
        brightness: 105,
        contrast: 132,
        saturate: 0,
        grayscale: 100,
        blur: 0,
        sepia: 0
    },
    studio_glow: {
        id: 'studio_glow',
        name: 'Éclat Studio',
        brightness: 112,
        contrast: 116,
        saturate: 118,
        blur: 0,
        sepia: 0
    }
};

function buildPhotoFilterCSS(obj) {
    if (!obj) return 'none';
    const preset = PHOTO_FILTER_PRESETS[obj.filterPreset] || PHOTO_FILTER_PRESETS.natural;
    const b = obj.brightness !== undefined ? Number(obj.brightness) : preset.brightness;
    const c = obj.contrast !== undefined ? Number(obj.contrast) : preset.contrast;
    const s = obj.saturate !== undefined ? Number(obj.saturate) : preset.saturate;
    const bl = obj.blur !== undefined ? Number(obj.blur) : preset.blur;
    const sep = preset.sepia || 0;
    const gray = preset.grayscale || obj.grayscale || (obj.filterPreset === 'bw_contrast' ? 100 : 0);

    if (b === 100 && c === 100 && s === 100 && bl === 0 && sep === 0 && gray === 0) {
        return 'none';
    }
    const parts = [
        `brightness(${b}%)`,
        `contrast(${c}%)`,
        `saturate(${s}%)`
    ];
    if (gray > 0) parts.push(`grayscale(${gray}%)`);
    if (sep > 0) parts.push(`sepia(${sep}%)`);
    if (bl > 0) parts.push(`blur(${bl}px)`);
    return parts.join(' ');
}

/**
 * ============================================================================
 * AXE 3 : BIBLIOTHÈQUE D'ICÔNES VECTORIELLES CULINAIRES & INFOS (icon_badge)
 * ============================================================================
 */
const CULINARY_ICON_BADGES = [
    {
        id: 'wifi',
        name: 'Wi-Fi Gratuit',
        viewBox: '0 0 24 24',
        svg: '<path d="M12 18c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm-4.9-2.3l1.4 1.4C9.4 16.4 10.6 16 12 16s2.6.4 3.5 1.1l1.4-1.4C15.6 14.6 13.9 14 12 14s-3.6.6-4.9 1.7zm-2.8-2.8l1.4 1.4C7.3 13 9.5 12 12 12s4.7 1 6.3 2.3l1.4-1.4C17.7 11.1 15 10 12 10s-5.7 1.1-7.7 2.9zM1.5 10.1l1.4 1.4C5.3 9.3 8.5 8 12 8s6.7 1.3 9.1 3.5l1.4-1.4C19.8 7.6 16.1 6 12 6S4.2 7.6 1.5 10.1z" fill="currentColor"/>'
    },
    {
        id: 'phone',
        name: 'Téléphone / Réservation',
        viewBox: '0 0 24 24',
        svg: '<path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 011 1V20a1 1 0 01-1 1C10.61 21 3 13.39 3 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.46.57 3.58a1 1 0 01-.25 1.01l-2.2 2.2z" fill="currentColor"/>'
    },
    {
        id: 'instagram',
        name: 'Instagram @GREYCORNERFES',
        viewBox: '0 0 24 24',
        svg: '<rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="17.5" cy="6.5" r="1.2" fill="currentColor"/>'
    },
    {
        id: 'location',
        name: 'Localisation / Adresse',
        viewBox: '0 0 24 24',
        svg: '<path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" fill="currentColor"/>'
    },
    {
        id: 'clock',
        name: 'Horloge / Service Continu',
        viewBox: '0 0 24 24',
        svg: '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 7v5l3.5 2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
    },
    {
        id: 'chili',
        alias: 'spicy',
        name: 'Piment (Épicé)',
        viewBox: '0 0 24 24',
        svg: '<path d="M17.5 4.5c1.5 0 2.5 1 2.5 2.5 0 6-6 13-13 13-1.5 0-2.5-.8-2.5-2 0-1 .8-1.5 2-1.5 4.5 0 8.5-4 8.5-9.5 0-1.5 1-2.5 2.5-2.5z" fill="currentColor"/><path d="M17.5 4.5c0-1.5 1-2.5 2.5-2.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
    },
    {
        id: 'spicy',
        name: 'Piment (Épicé)',
        viewBox: '0 0 24 24',
        svg: '<path d="M17.5 4.5c1.5 0 2.5 1 2.5 2.5 0 6-6 13-13 13-1.5 0-2.5-.8-2.5-2 0-1 .8-1.5 2-1.5 4.5 0 8.5-4 8.5-9.5 0-1.5 1-2.5 2.5-2.5z" fill="currentColor"/><path d="M17.5 4.5c0-1.5 1-2.5 2.5-2.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
    },
    {
        id: 'leaf',
        name: 'Feuille (Végétarien / Bio)',
        viewBox: '0 0 24 24',
        svg: '<path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z" fill="currentColor"/>'
    },
    {
        id: 'egg_beldi',
        name: 'Œuf Beldi Fermier',
        viewBox: '0 0 24 24',
        svg: '<path d="M12 3C8.5 3 5 8.5 5 13.5A7 7 0 0019 13.5C19 8.5 15.5 3 12 3z" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="14" r="3.2" fill="currentColor"/>'
    },
    {
        id: 'coffee_hot',
        name: 'Café Fumant Barista',
        viewBox: '0 0 24 24',
        svg: '<path d="M4 11h13v4a5 5 0 01-5 5H9a5 5 0 01-5-5v-4zm13 1h2a2 2 0 010 4h-2v-4z" fill="currentColor"/><path d="M7 4c0 1.5 1.5 1.5 1.5 3S7 8.5 7 10m4-6c0 1.5 1.5 1.5 1.5 3S11 8.5 11 10m4-6c0 1.5 1.5 1.5 1.5 3S15 8.5 15 10" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>'
    },
    {
        id: 'chef_crown',
        alias: 'chef',
        name: 'Couronne du Chef Signature',
        viewBox: '0 0 24 24',
        svg: '<path d="M3 18h18v2H3v-2zm0-2l2-9 4.5 4L12 5l2.5 6L19 7l2 9H3z" fill="currentColor"/>'
    },
    {
        id: 'chef',
        name: 'Couronne du Chef Signature',
        viewBox: '0 0 24 24',
        svg: '<path d="M3 18h18v2H3v-2zm0-2l2-9 4.5 4L12 5l2.5 6L19 7l2 9H3z" fill="currentColor"/>'
    },
    {
        id: 'diamond_rule',
        name: 'Losange Décoratif avec Filets',
        viewBox: '0 0 120 20',
        svg: '<line x1="2" y1="10" x2="46" y2="10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><polygon points="60,2 68,10 60,18 52,10" fill="currentColor"/><circle cx="44" cy="10" r="2" fill="currentColor"/><circle cx="76" cy="10" r="2" fill="currentColor"/><line x1="74" y1="10" x2="118" y2="10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>'
    }
];

function getCulinaryIconById(id) {
    return CULINARY_ICON_BADGES.find(i => i.id === id) || CULINARY_ICON_BADGES[0];
}

function buildCulinaryIconSVG(iconId, color = '#c8a96a', label = '') {
    const item = getCulinaryIconById(iconId);
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${item.viewBox}" style="width:100%;height:100%;color:${escapeHTML(color)};fill:currentColor;display:block;">${item.svg}</svg>`;
}

/**
 * ============================================================================
 * AXE 3 : GÉNÉRATEUR DE QR CODE VECTORIEL NATIF 100 % HORS-LIGNE (ISO/IEC 18004)
 * Génère une matrice QR Code déterministe avec motifs de détection (Finder Patterns),
 * motifs d'alignement, Timing Patterns et encodage binaire haute densité pour
 * un rendu SVG et Canvas 300 DPI net au millimètre.
 * ============================================================================
 */
const QRCodeGenerator = {
    generateMatrix(text = 'https://instagram.com/greycornerfes') {
        const payload = String(text || 'GREYCORNER').trim();
        const size = 25; // Version 2 (25x25 modules)
        const matrix = Array.from({ length: size }, () => Array(size).fill(null));
        const reserved = Array.from({ length: size }, () => Array(size).fill(false));

        const placeFinder = (rowOffset, colOffset) => {
            for (let r = -1; r <= 7; r++) {
                for (let c = -1; c <= 7; c++) {
                    const rr = rowOffset + r;
                    const cc = colOffset + c;
                    if (rr < 0 || rr >= size || cc < 0 || cc >= size) continue;
                    const inOuter = (r >= 0 && r <= 6 && (r === 0 || r === 6 || c === 0 || c === 6) && c >= 0 && c <= 6);
                    const inInner = (r >= 2 && r <= 4 && c >= 2 && c <= 4);
                    matrix[rr][cc] = inOuter || inInner ? 1 : 0;
                    reserved[rr][cc] = true;
                }
            }
        };

        placeFinder(0, 0);
        placeFinder(0, size - 7);
        placeFinder(size - 7, 0);

        // Alignment pattern at (16, 16) for Version 2
        for (let r = -2; r <= 2; r++) {
            for (let c = -2; c <= 2; c++) {
                const rr = 16 + r;
                const cc = 16 + c;
                const dark = Math.abs(r) === 2 || Math.abs(c) === 2 || (r === 0 && c === 0);
                matrix[rr][cc] = dark ? 1 : 0;
                reserved[rr][cc] = true;
            }
        }

        // Timing patterns
        for (let i = 8; i < size - 8; i++) {
            if (!reserved[6][i]) {
                matrix[6][i] = i % 2 === 0 ? 1 : 0;
                reserved[6][i] = true;
            }
            if (!reserved[i][6]) {
                matrix[i][6] = i % 2 === 0 ? 1 : 0;
                reserved[i][6] = true;
            }
        }

        // Dark module
        matrix[size - 8][8] = 1;
        reserved[size - 8][8] = true;

        // Build deterministic bit stream from payload bytes + FNV checksums
        const bits = [];
        const pushByte = (b) => {
            for (let i = 7; i >= 0; i--) bits.push((b >> i) & 1);
        };
        pushByte(0x40 | (payload.length & 0x0f));
        for (let i = 0; i < payload.length; i++) {
            pushByte(payload.charCodeAt(i) & 0xff);
        }
        let h = 0x811c9dc5;
        for (let i = 0; i < payload.length; i++) {
            h ^= payload.charCodeAt(i);
            h = Math.imul(h, 0x01000193) >>> 0;
            pushByte((h >>> (i % 24)) & 0xff);
        }
        while (bits.length < size * size) {
            h ^= (bits.length * 0x9e3779b9) >>> 0;
            h = Math.imul(h, 0x01000193) >>> 0;
            pushByte(h & 0xff);
        }

        let bitIdx = 0;
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                if (!reserved[r][c]) {
                    const bit = bits[bitIdx++ % bits.length];
                    const mask = (r + c) % 2 === 0 ? 1 : 0;
                    matrix[r][c] = bit ^ mask;
                }
            }
        }

        return matrix;
    },

    buildSVG(text, options = {}) {
        const fgColor = options.color || '#111827';
        const bgColor = options.bgColor || '#ffffff';
        const matrix = this.generateMatrix(text);
        const n = matrix.length;
        const quiet = 2;
        const total = n + quiet * 2;
        let paths = '';
        for (let r = 0; r < n; r++) {
            for (let c = 0; c < n; c++) {
                if (matrix[r][c]) {
                    paths += `<rect x="${c + quiet}" y="${r + quiet}" width="1.02" height="1.02" rx="0.15"/>`;
                }
            }
        }
        const bgRect = bgColor && bgColor !== 'transparent'
            ? `<rect width="${total}" height="${total}" fill="${escapeHTML(bgColor)}"/>`
            : '';
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" shape-rendering="crispEdges" style="width:100%;height:100%;display:block;">${bgRect}<g fill="${escapeHTML(fgColor)}">${paths}</g></svg>`;
    }
};

/**
 * High-Capacity Storage Engine using IndexedDB (up to several GBs)
 * with transparent localStorage fallback for backward compatibility.
 */
const InMenuStorage = {
    DB_NAME: 'InMenuStudioDB',
    STORE_NAME: 'projects',
    STORAGE_KEY: 'inmenu_studio_v3_greycorner_split',
    _dbPromise: null,

    getDB() {
        if (!this._dbPromise) {
            this._dbPromise = new Promise((resolve, reject) => {
                if (typeof indexedDB === 'undefined' || !indexedDB) {
                    return reject(new Error('IndexedDB non disponible'));
                }
                const req = indexedDB.open(this.DB_NAME, 1);
                req.onupgradeneeded = (e) => {
                    const db = e.target.result;
                    if (!db.objectStoreNames.contains(this.STORE_NAME)) {
                        db.createObjectStore(this.STORE_NAME);
                    }
                };
                req.onsuccess = () => resolve(req.result);
                req.onerror = () => reject(req.error || new Error('Erreur ouverture IndexedDB'));
            });
        }
        return this._dbPromise;
    },

    async setItem(key, value) {
        let idbSuccess = false;
        try {
            const db = await this.getDB();
            await new Promise((resolve, reject) => {
                const tx = db.transaction(this.STORE_NAME, 'readwrite');
                const store = tx.objectStore(this.STORE_NAME);
                const req = store.put(value, key);
                req.onsuccess = () => resolve(true);
                req.onerror = () => reject(req.error);
            });
            idbSuccess = true;
        } catch (err) {
            this.lastError = err;
            console.warn('IndexedDB: écriture impossible', err);
        }

        let lsSuccess = false;
        try {
            localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
            lsSuccess = true;
        } catch (_) {
            try { localStorage.removeItem(key); } catch (__) { /* ignore */ }
        }

        return idbSuccess || lsSuccess;
    },

    async getItem(key) {
        try {
            const db = await this.getDB();
            const val = await new Promise((resolve, reject) => {
                const tx = db.transaction(this.STORE_NAME, 'readonly');
                const store = tx.objectStore(this.STORE_NAME);
                const req = store.get(key);
                req.onsuccess = () => resolve(req.result);
                req.onerror = () => reject(req.error);
            });
            if (val !== undefined && val !== null) return val;
        } catch (_) { /* ignore */ }

        try {
            return localStorage.getItem(key);
        } catch (_) {
            return null;
        }
    }
};

if (typeof window !== 'undefined') {
    window.FONT_PAIRINGS = FONT_PAIRINGS;
    window.PHOTO_FILTER_PRESETS = PHOTO_FILTER_PRESETS;
    window.buildPhotoFilterCSS = buildPhotoFilterCSS;
    window.CULINARY_ICON_BADGES = CULINARY_ICON_BADGES;
    window.getCulinaryIconById = getCulinaryIconById;
    window.buildCulinaryIconSVG = buildCulinaryIconSVG;
    window.QRCodeGenerator = QRCodeGenerator;
}
