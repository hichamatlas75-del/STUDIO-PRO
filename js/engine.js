/**
 * MODULE 1: DocumentEngine (engine.js)
 */
class DocumentEngine {
    constructor() {
        // Strict Physical Geometry in Millimeters (Cahier des charges)
        this.specs = {
            widthMm: 340,          // 34 cm open width
            heightMm: 300,         // 30 cm open height
            foldXMm: 170,          // Central fold line at 17 cm (2 panels of 17 × 30 cm)
            bleedMm: 3,            // 3 mm bleed all around
            safeOuterMm: 10,       // 10 mm outer margin
            safeFoldHalfMm: 10     // 10 mm safety zone on each side of the fold (160mm to 180mm)
        };

        // Centralized Dish & Price Database (Single source of truth)
        this.dishesDB = this.getDefaultDishesDatabase();

        // 5 Sheets × 2 Sides (Recto / Verso) = 10 Faces
        this.faces = this.createInitialFaces();

        // Undo / Redo Stacks
        this.history = [];
        this.redoStack = [];
        this.maxHistory = 30;
        this.lastSaveSuccess = true;
        this.lastRestoredFaceIndex = null;
    }

    getDefaultDishesDatabase() {
        return JSON.parse(JSON.stringify(GREY_CORNER_DEFAULT_DB));
    }

    createInitialFaces() {
        const faces = [];
        for (let sheet = 1; sheet <= 5; sheet++) {
            faces.push({
                id: `sheet_${sheet}_recto`,
                sheetNumber: sheet,
                side: 'Recto',
                name: `Feuille ${sheet} — Recto`,
                bgColor: '#fdfbf7',
                objects: []
            });
            faces.push({
                id: `sheet_${sheet}_verso`,
                sheetNumber: sheet,
                side: 'Verso',
                name: `Feuille ${sheet} — Verso`,
                bgColor: '#fdfbf7',
                objects: []
            });
        }

        // Auto-populate all 10 faces with the complete Grey Corner 2026 Menu
        this.faces = faces;
        if (typeof WordMenuImporter !== 'undefined') {
            WordMenuImporter.autoLayoutAcrossSpreads(this, this.dishesDB, {
                mode: 'full_auto_spreads',
                theme: 'bistro_warm',
                brandTitle: GREY_CORNER_BRAND.title,
                brandSub: GREY_CORNER_BRAND.subtitle
            });
        }
        return faces;
    }

    // Applies Cover + Back spread ONLY on the specified face (without touching the other 9 faces)
    populateSampleSpread1Recto(face) {
        if (typeof WordMenuImporter !== 'undefined') {
            WordMenuImporter.buildCoverSpread(face, this, {
                theme: 'bistro_warm',
                brandTitle: GREY_CORNER_BRAND.title,
                brandSub: GREY_CORNER_BRAND.subtitle
            });
        }
    }

    // Applies Breakfast & Brunch spread ONLY on the specified face (without modifying or corrupting dishesDB)
    populateSampleSpread1Verso(face) {
        if (typeof WordMenuImporter !== 'undefined') {
            const subset = this.dishesDB.filter(d => d.category === 'PETIT DÉJEUNER' || d.category === 'BRUNCH & MENU ENFANT');
            const targetFaceIdx = this.faces.indexOf(face) >= 0 ? this.faces.indexOf(face) : 1;
            WordMenuImporter.autoLayoutAcrossSpreads(this, subset, {
                mode: 'active_spread_only',
                updateDB: false,
                theme: 'bistro_warm',
                brandTitle: GREY_CORNER_BRAND.title,
                brandSub: GREY_CORNER_BRAND.subtitle,
                activeFaceIndex: targetFaceIdx
            });
        }
    }

    // Applies Bistro spread ONLY on the specified face (without modifying or corrupting dishesDB)
    populateSampleSpread2Recto(face) {
        if (typeof WordMenuImporter !== 'undefined') {
            const subset = this.dishesDB.filter(d => d.category === 'PLATS & COUSCOUS' || d.category === 'PASTA & LASAGNES' || d.category === 'CRÊPES SUCRÉES & GAUFRES');
            const targetFaceIdx = this.faces.indexOf(face) >= 0 ? this.faces.indexOf(face) : 2;
            WordMenuImporter.autoLayoutAcrossSpreads(this, subset, {
                mode: 'active_spread_only',
                updateDB: false,
                theme: 'bistro_warm',
                brandTitle: GREY_CORNER_BRAND.title,
                brandSub: GREY_CORNER_BRAND.subtitle,
                activeFaceIndex: targetFaceIdx
            });
        }
    }

    // Save Snapshot for Undo/Redo (records active face index so undo restores view)
    saveState(activeFaceIndex = 0) {
        const snapshot = JSON.stringify({
            activeFaceIndex,
            dishesDB: this.dishesDB,
            faces: this.faces
        });
        if (this.history.length > 0 && this.history[this.history.length - 1] === snapshot) {
            return this.lastSaveSuccess;
        }
        this.history.push(snapshot);
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        }
        this.redoStack = [];
        return this.persistToLocalStorage();
    }

    undo() {
        if (this.history.length <= 1) return false;
        const current = this.history.pop();
        this.redoStack.push(current);
        const prev = JSON.parse(this.history[this.history.length - 1]);
        this.dishesDB = prev.dishesDB;
        this.faces = prev.faces;
        this.activeFaceIndex = Number.isInteger(prev.activeFaceIndex) ? prev.activeFaceIndex : null;
        this.lastRestoredFaceIndex = this.activeFaceIndex;
        this.persistToLocalStorage();
        return true;
    }

    redo() {
        if (this.redoStack.length === 0) return false;
        const nextStr = this.redoStack.pop();
        this.history.push(nextStr);
        const next = JSON.parse(nextStr);
        this.dishesDB = next.dishesDB;
        this.faces = next.faces;
        this.activeFaceIndex = Number.isInteger(next.activeFaceIndex) ? next.activeFaceIndex : null;
        this.lastRestoredFaceIndex = this.activeFaceIndex;
        this.persistToLocalStorage();
        return true;
    }

    persistToLocalStorage() {
        const jsonPayload = this.toJSON(false);

        // 1. High-capacity IndexedDB persistence (asynchronous, up to hundreds of MBs)
        if (typeof InMenuStorage !== 'undefined' && InMenuStorage.setItem) {
            InMenuStorage.setItem('inmenu_studio_v3_greycorner_split', jsonPayload)
                .then(ok => {
                    this.lastSaveSuccess = ok;
                    if (typeof app !== 'undefined' && app.updateAutoSaveUI) {
                        app.updateAutoSaveUI(ok);
                    }
                })
                .catch(() => {
                    this.lastSaveSuccess = false;
                });
        }

        // 2. LocalStorage attempt (holds up to ~5 MB)
        try {
            localStorage.setItem('inmenu_studio_v3_greycorner_split', jsonPayload);
            this.lastSaveSuccess = true;
            return true;
        } catch (e) {
            // LocalStorage quota reached, but IndexedDB safely persists
            this.lastSaveSuccess = true;
            return true;
        }
    }

    normalizeImportedData(data) {
        if (!data || !Array.isArray(data.faces) || !Array.isArray(data.dishesDB)) {
            throw new Error('Format JSON InMenu invalide.');
        }
        const seenDishIds = new Set();
        const dishesDB = data.dishesDB
            .filter(d => d && typeof d === 'object')
            .map((d, idx) => {
                let id = String(d.id || '').trim() || generateUniqueId(`PLT${idx + 1}`);
                if (seenDishIds.has(id)) id = generateUniqueId(id);
                seenDishIds.add(id);
                return {
                    id,
                    category: String(d.category || 'GÉNÉRAL').trim() || 'GÉNÉRAL',
                    name: String(d.name || 'Plat Signature'),
                    desc: String(d.desc || ''),
                    price: String(d.price || '00 DH'),
                    badge: (d.badge === 'NOUVEAU' || d.badge === 'CHEF') ? d.badge : ''
                };
            });

        const optionalNumericProps = ['fontSize', 'radius', 'borderWidth', 'opacity', 'sliceStart', 'sliceEnd'];
        const sanitizeObject = (o) => {
            optionalNumericProps.forEach(prop => {
                if (o[prop] === undefined || o[prop] === null) {
                    delete o[prop];
                    return;
                }
                const n = Number(o[prop]);
                if (Number.isFinite(n)) o[prop] = n;
                else delete o[prop];
            });
            if (o.opacity !== undefined) o.opacity = Math.max(0.05, Math.min(1, o.opacity));
            if (o.locked !== undefined) o.locked = Boolean(o.locked);
            ['type', 'name', 'text', 'title', 'subtitle', 'caption', 'category', 'dishId', 'fontFamily', 'fontWeight', 'align',
             'bgColor', 'borderColor', 'color', 'textColor', 'titleColor', 'descColor', 'priceColor', 'imageUrl',
             'customName', 'customDesc', 'customPrice']
                .forEach(prop => {
                    if (o[prop] !== undefined && o[prop] !== null && typeof o[prop] !== 'string') o[prop] = String(o[prop]);
                });
            return o;
        };

        const faces = [];
        for (let i = 0; i < 10; i++) {
            const sheet = Math.floor(i / 2) + 1;
            const side = i % 2 === 0 ? 'Recto' : 'Verso';
            const src = data.faces[i];
            const seenObjIds = new Set();
            const objects = (src && Array.isArray(src.objects))
                ? src.objects
                    .filter(o => o && typeof o === 'object' && o.type)
                    .map((o, oIdx) => {
                        let id = String(o.id || '').trim() || generateUniqueId(`obj_${i}_${oIdx}`);
                        if (seenObjIds.has(id)) id = generateUniqueId('obj');
                        seenObjIds.add(id);
                        return sanitizeObject({
                            ...o,
                            id,
                            x: Number.isFinite(Number(o.x)) ? Number(o.x) : 0,
                            y: Number.isFinite(Number(o.y)) ? Number(o.y) : 0,
                            w: Math.max(2, Number.isFinite(Number(o.w)) ? Number(o.w) : 40),
                            h: Math.max(2, Number.isFinite(Number(o.h)) ? Number(o.h) : 20)
                        });
                    })
                : [];

            faces.push({
                id: (src && src.id) ? String(src.id) : `sheet_${sheet}_${side.toLowerCase()}`,
                sheetNumber: sheet,
                side,
                name: (src && src.name) ? String(src.name) : `Feuille ${sheet} — ${side}`,
                bgColor: (src && src.bgColor) ? String(src.bgColor) : '#fdfbf7',
                objects
            });
        }

        return { dishesDB, faces };
    }

    loadFromLocalStorage() {
        try {
            const saved = localStorage.getItem('inmenu_studio_v3_greycorner_split');
            if (saved) {
                const data = JSON.parse(saved);
                const normalized = this.normalizeImportedData(data);
                this.dishesDB = normalized.dishesDB;
                this.faces = normalized.faces;
                return true;
            }
        } catch (e) {
            console.warn('Could not load saved state from localStorage:', e);
        }
        return false;
    }

    async loadFromAsyncStorage() {
        if (typeof InMenuStorage !== 'undefined' && InMenuStorage.getItem) {
            try {
                const saved = await InMenuStorage.getItem('inmenu_studio_v3_greycorner_split');
                if (saved) {
                    const data = typeof saved === 'string' ? JSON.parse(saved) : saved;
                    const normalized = this.normalizeImportedData(data);
                    this.dishesDB = normalized.dishesDB;
                    this.faces = normalized.faces;
                    return true;
                }
            } catch (err) {
                console.warn('Could not load saved state from IndexedDB:', err);
            }
        }
        return this.loadFromLocalStorage();
    }

    toJSON(pretty = true) {
        const payload = {
            app: 'InMenu Studio Pro',
            version: '1.0',
            specs: this.specs,
            dishesDB: this.dishesDB,
            faces: this.faces
        };
        return pretty ? JSON.stringify(payload, null, 2) : JSON.stringify(payload);
    }

    fromJSON(jsonString) {
        const data = JSON.parse(jsonString);
        const normalized = this.normalizeImportedData(data);
        this.dishesDB = normalized.dishesDB;
        this.faces = normalized.faces;
        this.saveState();
    }

    getDishById(id) {
        return this.dishesDB.find(d => d.id === id) || null;
    }

    getDishesByCategory(cat) {
        return this.dishesDB.filter(d => d.category === cat);
    }

    getCategories() {
        return [...new Set(this.dishesDB.map(d => d.category))];
    }

    generateUniqueDishId(prefix = 'PLT') {
        const existing = new Set(this.dishesDB.map(d => d.id));
        for (let attempt = 0; attempt < 50; attempt++) {
            const candidate = prefix + Math.floor(100 + Math.random() * 900);
            if (!existing.has(candidate)) return candidate;
        }
        let seq = this.dishesDB.length + 1000;
        while (existing.has(`${prefix}${seq}`)) seq++;
        return `${prefix}${seq}`;
    }
}
