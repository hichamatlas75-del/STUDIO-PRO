/**
 * ============================================================================
 * MODULE 1: DocumentEngine (engine.js)
 * Gère la géométrie physique (340x300mm, Flyer A4, A5, Dépliant), la base centrale
 * de plats/prix, les planches (faces), l'historique undo/redo et la numérotation.
 * ============================================================================
 */

const FORMAT_PRESETS = {
    'menu_34x30': {
        id: 'menu_34x30',
        name: 'Menu Livret 34 × 30 cm (2 Volets)',
        badge: 'Restaurant Signature',
        sub: 'Format ouvert 340 × 300 mm • Pli central 170 mm • 10 Faces (5 feuilles)',
        category: 'menu',
        widthMm: 340,
        heightMm: 300,
        hasFold: true,
        foldXMm: 170,
        foldMarks: [170],
        bleedMm: 3,
        safeOuterMm: 10,
        safeFoldHalfMm: 10,
        defaultFaces: 10,
        orientation: 'landscape',
        defaultBgColor: '#fdfbf7'
    },
    'flyer_a4_portrait': {
        id: 'flyer_a4_portrait',
        name: 'Flyer A4 Portrait (210 × 297 mm)',
        badge: 'Flyer A4 Standard',
        sub: 'Standard International A4 • 1 ou 2 Faces (Sans pli) • Idéal Flyer, Affiche & Carte 1 Page',
        category: 'flyer',
        widthMm: 210,
        heightMm: 297,
        hasFold: false,
        foldXMm: null,
        foldMarks: [],
        bleedMm: 3,
        safeOuterMm: 8,
        safeFoldHalfMm: 0,
        defaultFaces: 2,
        orientation: 'portrait',
        defaultBgColor: '#ffffff'
    },
    'flyer_a4_landscape': {
        id: 'flyer_a4_landscape',
        name: 'Flyer / Set de Table A4 Paysage (297 × 210 mm)',
        badge: 'A4 Paysage',
        sub: 'Format horizontal 297 × 210 mm • Set de table ou flyer panoramique (Sans pli)',
        category: 'flyer',
        widthMm: 297,
        heightMm: 210,
        hasFold: false,
        foldXMm: null,
        foldMarks: [],
        bleedMm: 3,
        safeOuterMm: 8,
        safeFoldHalfMm: 0,
        defaultFaces: 1,
        orientation: 'landscape',
        defaultBgColor: '#ffffff'
    },
    'flyer_a5_portrait': {
        id: 'flyer_a5_portrait',
        name: 'Flyer A5 Portrait (148 × 210 mm)',
        badge: 'Flyer A5 Poche',
        sub: 'Demi-A4 de poche 148 × 210 mm • Street marketing & distribution rapide (Sans pli)',
        category: 'flyer',
        widthMm: 148,
        heightMm: 210,
        hasFold: false,
        foldXMm: null,
        foldMarks: [],
        bleedMm: 3,
        safeOuterMm: 6,
        safeFoldHalfMm: 0,
        defaultFaces: 2,
        orientation: 'portrait',
        defaultBgColor: '#ffffff'
    },
    'depliant_a4_3volets': {
        id: 'depliant_a4_3volets',
        name: 'Dépliant A4 3 Volets / 2 Plis (297 × 210 mm)',
        badge: 'Menu Triptyque',
        sub: 'Triptyque plié (3 volets de 99 × 210 mm) • Plis à 99 mm et 198 mm',
        category: 'depliant',
        widthMm: 297,
        heightMm: 210,
        hasFold: true,
        foldXMm: 99,
        foldMarks: [99, 198],
        bleedMm: 3,
        safeOuterMm: 8,
        safeFoldHalfMm: 5,
        defaultFaces: 2,
        orientation: 'landscape',
        defaultBgColor: '#fdfbf7'
    }
};

class DocumentEngine {
    constructor() {
        // Format & Physical Geometry (Default: Menu 34x30cm)
        this.currentFormat = 'menu_34x30';
        this.specs = Object.assign({}, FORMAT_PRESETS['menu_34x30']);

        // Centralized Dish & Price Database (Single source of truth)
        this.dishesDB = this.getDefaultDishesDatabase();

        // Automated Page Numbering Configuration
        this.pageNumbering = {
            enabled: false,           // Activer / désactiver la numérotation
            format: 'page_n',         // 'page_n' ("Page 2"), 'n_slash_total' ("2 / 10"), 'simple' ("2"), 'dash' ("— 2 —"), 'dot' ("• 2 •"), 'roman' ("II")
            position: 'bottom_center',// 'bottom_center', 'bottom_outer', 'bottom_right', 'bottom_left', 'top_center', 'top_outer'
            startNumber: 1,
            skipCover: true,          // Ne pas afficher sur la couverture (Face 1)
            skipBack: false,          // Option dos de couverture
            fontFamily: 'Montserrat',
            fontSizePt: 8.5,
            color: '#64748b',
            marginMm: 8,
            perPanelForSpreads: true  // Pour les planches ouvertes à 2 volets: 1 numéro à gauche et 1 numéro à droite
        };

        // Faces (Pages/Planches)
        this.faces = this.createInitialFaces();

        // Undo / Redo Stacks
        this.history = [];
        this.redoStack = [];
        this.maxHistory = 30;
        this.lastSaveSuccess = true;
        this.lastRestoredFaceIndex = null;

        // Empêche d'écraser un projet sauvegardé (IndexedDB) par l'état par défaut
        // tant que le chargement asynchrone n'est pas terminé.
        this.persistReady = false;
    }

    getDefaultDishesDatabase() {
        if (typeof GREY_CORNER_DEFAULT_DB !== 'undefined') {
            return JSON.parse(JSON.stringify(GREY_CORNER_DEFAULT_DB));
        }
        return [];
    }

    createInitialFaces() {
        const preset = FORMAT_PRESETS[this.currentFormat] || FORMAT_PRESETS['menu_34x30'];
        const faces = [];

        if (this.currentFormat === 'menu_34x30') {
            for (let sheet = 1; sheet <= 5; sheet++) {
                faces.push({
                    id: `sheet_${sheet}_recto`,
                    sheetNumber: sheet,
                    side: 'Recto',
                    name: `Feuille ${sheet} — Recto`,
                    bgColor: preset.defaultBgColor || '#fdfbf7',
                    objects: []
                });
                faces.push({
                    id: `sheet_${sheet}_verso`,
                    sheetNumber: sheet,
                    side: 'Verso',
                    name: `Feuille ${sheet} — Verso`,
                    bgColor: preset.defaultBgColor || '#fdfbf7',
                    objects: []
                });
            }

            // Auto-populate with complete Grey Corner Menu
            this.faces = faces;
            if (typeof WordMenuImporter !== 'undefined') {
                WordMenuImporter.autoLayoutAcrossSpreads(this, this.dishesDB, {
                    mode: 'full_auto_spreads',
                    theme: 'bistro_warm',
                    brandTitle: typeof GREY_CORNER_BRAND !== 'undefined' ? GREY_CORNER_BRAND.title : 'GREY CORNER',
                    brandSub: typeof GREY_CORNER_BRAND !== 'undefined' ? GREY_CORNER_BRAND.subtitle : 'café • SINCE 2024'
                });
            }
            return faces;
        } else if (this.currentFormat.startsWith('flyer_') || this.currentFormat.startsWith('depliant_')) {
            const count = preset.defaultFaces || 2;
            for (let i = 1; i <= count; i++) {
                const sideName = i === 1 ? 'Recto' : (i === 2 ? 'Verso' : `Page ${i}`);
                faces.push({
                    id: `page_${i}`,
                    sheetNumber: i,
                    side: sideName,
                    name: `${preset.badge} — ${sideName}`,
                    bgColor: preset.defaultBgColor || '#ffffff',
                    objects: []
                });
            }
            this.faces = faces;
            return faces;
        }

        return faces;
    }

    /**
     * Switch format (e.g. 'flyer_a4_portrait', 'menu_34x30', etc.)
     */
    setFormat(formatKey, resetPages = false) {
        if (!FORMAT_PRESETS[formatKey]) {
            console.warn(`Format preset "${formatKey}" non reconnu.`);
            return false;
        }
        this.currentFormat = formatKey;
        this.specs = Object.assign({}, FORMAT_PRESETS[formatKey]);

        if (resetPages) {
            this.faces = this.createInitialFaces();
        }
        this.saveState();
        return true;
    }

    /**
     * Update page numbering settings
     */
    setPageNumbering(options = {}) {
        this.pageNumbering = Object.assign({}, this.pageNumbering, options);
        this.saveState();
    }

    /**
     * Format a page number string according to current settings
     */
    formatPageNumberString(pageNumber, totalPages = null) {
        const fmt = this.pageNumbering.format || 'page_n';
        const total = totalPages || (this.specs.hasFold ? this.faces.length * 2 : this.faces.length);

        switch (fmt) {
            case 'page_n':
                return `Page ${pageNumber}`;
            case 'n_slash_total':
                return `${pageNumber} / ${total}`;
            case 'dash':
                return `— ${pageNumber} —`;
            case 'dot':
                return `• ${pageNumber} •`;
            case 'simple':
                return `${pageNumber}`;
            case 'roman': {
                let n = Math.floor(pageNumber);
                if (n < 1 || n > 3999) return `${pageNumber}`;
                const map = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
                let out = '';
                for (const [v, s] of map) { while (n >= v) { out += s; n -= v; } }
                return out;
            }
            default:
                return `Page ${pageNumber}`;
        }
    }

    /**
     * Computes the display page number for a given face and panel side ('left', 'right', 'single')
     * Returns null if page number is skipped (e.g. cover).
     */
    getPageNumberInfo(faceIndex, panelSide = 'single') {
        if (!this.pageNumbering.enabled) return null;

        const totalFaces = this.faces.length;
        const isSpread = Boolean(this.specs.hasFold);

        if (!isSpread) {
            const pageNum = faceIndex + 1;
            if (this.pageNumbering.skipCover && pageNum === 1) return null;
            if (this.pageNumbering.skipBack && pageNum === totalFaces) return null;

            return {
                number: pageNum,
                text: this.formatPageNumberString(pageNum, totalFaces),
                xMm: this.specs.widthMm / 2,
                yMm: this.pageNumbering.position.startsWith('top') ? this.pageNumbering.marginMm : (this.specs.heightMm - this.pageNumbering.marginMm),
                align: 'center'
            };
        }

        // Spread with 2 panels (e.g. 340 x 300 mm)
        // Face 0: Recto = Back Cover (left 0..170) & Front Cover (right 170..340)
        let leftPageNum = null;
        let rightPageNum = null;

        if (faceIndex === 0) {
            rightPageNum = 1; // Cover
            leftPageNum = totalFaces * 2; // Back Cover
        } else {
            leftPageNum = faceIndex * 2;
            rightPageNum = faceIndex * 2 + 1;
        }

        if (panelSide === 'left') {
            if (leftPageNum === 1 && this.pageNumbering.skipCover) return null;
            if (leftPageNum === totalFaces * 2 && this.pageNumbering.skipBack) return null;
            const panelW = (this.specs.foldXMm || (this.specs.widthMm / 2));
            return {
                number: leftPageNum,
                text: this.formatPageNumberString(leftPageNum, totalFaces * 2),
                xMm: panelW / 2,
                yMm: this.pageNumbering.position.startsWith('top') ? this.pageNumbering.marginMm : (this.specs.heightMm - this.pageNumbering.marginMm),
                align: 'center'
            };
        } else if (panelSide === 'right') {
            if (rightPageNum === 1 && this.pageNumbering.skipCover) return null;
            if (rightPageNum === totalFaces * 2 && this.pageNumbering.skipBack) return null;
            const foldX = (this.specs.foldXMm || (this.specs.widthMm / 2));
            const panelW = this.specs.widthMm - foldX;
            return {
                number: rightPageNum,
                text: this.formatPageNumberString(rightPageNum, totalFaces * 2),
                xMm: foldX + (panelW / 2),
                yMm: this.pageNumbering.position.startsWith('top') ? this.pageNumbering.marginMm : (this.specs.heightMm - this.pageNumbering.marginMm),
                align: 'center'
            };
        }

        return null;
    }

    /**
     * Add a new page / face to the current project
     */
    addPage(name = null, bgColor = null) {
        const nextIdx = this.faces.length + 1;
        const badge = (this.specs && this.specs.badge) ? this.specs.badge : 'Page';
        const defaultName = `${badge} — Page ${nextIdx}`;
        const lastFaceBg = this.faces.length > 0 ? this.faces[this.faces.length - 1].bgColor : null;

        const newFace = {
            id: generateUniqueId('face'),
            sheetNumber: Math.ceil(nextIdx / 2),
            side: nextIdx % 2 === 1 ? 'Recto' : 'Verso',
            name: name || defaultName,
            bgColor: bgColor || lastFaceBg || (this.specs && this.specs.defaultBgColor) || '#ffffff',
            objects: []
        };
        this.faces.push(newFace);
        this.saveState(this.faces.length - 1);
        return newFace;
    }

    /**
     * Duplicate an entire page / face (with all its objects and background)
     */
    duplicatePage(faceIndex) {
        if (faceIndex < 0 || faceIndex >= this.faces.length) return null;
        const src = this.faces[faceIndex];
        const copy = JSON.parse(JSON.stringify(src));
        copy.id = generateUniqueId('face_copy');
        const cleanBase = String(src.name || 'Page').replace(/\s*\(Copie(?:\s*\d+)?\)$/i, '');
        copy.name = `${cleanBase} (Copie)`;
        copy.objects = (copy.objects || []).map((o, idx) => Object.assign({}, o, {
            id: generateUniqueId(`obj_dup_${idx}`)
        }));

        this.faces.splice(faceIndex + 1, 0, copy);
        this.saveState(faceIndex + 1);
        return copy;
    }

    /**
     * Remove a page / face (with min 1 safeguard)
     */
    removePage(faceIndex) {
        if (this.faces.length <= 1) {
            throw new Error('Le document doit comporter au moins une page.');
        }
        if (faceIndex < 0 || faceIndex >= this.faces.length) return false;
        this.faces.splice(faceIndex, 1);
        const targetFace = Math.min(faceIndex, this.faces.length - 1);
        this.saveState(targetFace);
        return true;
    }

    // Applies Cover + Back spread ONLY on the specified face (without touching the other 9 faces)
    populateSampleSpread1Recto(face) {
        if (typeof WordMenuImporter !== 'undefined') {
            WordMenuImporter.buildCoverSpread(face, this, {
                theme: 'bistro_warm',
                brandTitle: typeof GREY_CORNER_BRAND !== 'undefined' ? GREY_CORNER_BRAND.title : 'GREY CORNER',
                brandSub: typeof GREY_CORNER_BRAND !== 'undefined' ? GREY_CORNER_BRAND.subtitle : 'café • SINCE 2024'
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
                brandTitle: typeof GREY_CORNER_BRAND !== 'undefined' ? GREY_CORNER_BRAND.title : 'GREY CORNER',
                brandSub: typeof GREY_CORNER_BRAND !== 'undefined' ? GREY_CORNER_BRAND.subtitle : 'café • SINCE 2024',
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
                brandTitle: typeof GREY_CORNER_BRAND !== 'undefined' ? GREY_CORNER_BRAND.title : 'GREY CORNER',
                brandSub: typeof GREY_CORNER_BRAND !== 'undefined' ? GREY_CORNER_BRAND.subtitle : 'café • SINCE 2024',
                activeFaceIndex: targetFaceIdx
            });
        }
    }

    // Save Snapshot for Undo/Redo (records active face index so undo restores view)
    saveState(activeFaceIndex = 0) {
        const snapshot = JSON.stringify({
            activeFaceIndex,
            currentFormat: this.currentFormat,
            specs: this.specs,
            pageNumbering: this.pageNumbering,
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
        this.lastSaveSuccess = this.persistToLocalStorage();
        return this.lastSaveSuccess;
    }

    undo() {
        if (this.history.length <= 1) return null;
        const current = this.history.pop();
        this.redoStack.push(current);
        const prev = JSON.parse(this.history[this.history.length - 1]);
        if (prev.currentFormat && FORMAT_PRESETS[prev.currentFormat]) {
            this.currentFormat = prev.currentFormat;
            this.specs = prev.specs || Object.assign({}, FORMAT_PRESETS[prev.currentFormat]);
        }
        if (prev.pageNumbering) {
            this.pageNumbering = Object.assign({}, this.pageNumbering, prev.pageNumbering);
        }
        this.dishesDB = prev.dishesDB;
        this.faces = prev.faces;
        this.lastRestoredFaceIndex = typeof prev.activeFaceIndex === 'number' ? prev.activeFaceIndex : 0;
        this.persistToLocalStorage();
        return this.lastRestoredFaceIndex;
    }

    redo() {
        if (this.redoStack.length === 0) return null;
        const nextSnap = this.redoStack.pop();
        this.history.push(nextSnap);
        const next = JSON.parse(nextSnap);
        if (next.currentFormat && FORMAT_PRESETS[next.currentFormat]) {
            this.currentFormat = next.currentFormat;
            this.specs = next.specs || Object.assign({}, FORMAT_PRESETS[next.currentFormat]);
        }
        if (next.pageNumbering) {
            this.pageNumbering = Object.assign({}, this.pageNumbering, next.pageNumbering);
        }
        this.dishesDB = next.dishesDB;
        this.faces = next.faces;
        this.lastRestoredFaceIndex = typeof next.activeFaceIndex === 'number' ? next.activeFaceIndex : 0;
        this.persistToLocalStorage();
        return this.lastRestoredFaceIndex;
    }

    persistToLocalStorage() {
        if (!this.persistReady) return true;
        if (typeof InMenuStorage !== 'undefined' && InMenuStorage.setItem) {
            InMenuStorage.setItem('inmenu_studio_v3_greycorner_split', this.toJSON(false))
                .then(ok => {
                    this.lastSaveSuccess = ok;
                    if (typeof app !== 'undefined' && app.updateAutoSaveUI) {
                        app.updateAutoSaveUI(ok);
                    }
                })
                .catch(() => {
                    this.lastSaveSuccess = false;
                    if (typeof app !== 'undefined' && app.updateAutoSaveUI) {
                        app.updateAutoSaveUI(false);
                    }
                });
            return true;
        }

        try {
            localStorage.setItem('inmenu_studio_v3_greycorner_split', this.toJSON(false));
            return true;
        } catch (e) {
            console.warn('LocalStorage full, large images in project:', e);
            return false;
        }
    }

    normalizeImportedData(data) {
        if (!data || !Array.isArray(data.faces) || !Array.isArray(data.dishesDB)) {
            throw new Error('Format JSON InMenu invalide.');
        }

        // Format & Specs recovery
        let currentFormat = data.currentFormat || 'menu_34x30';
        let specs = Object.assign({}, FORMAT_PRESETS[currentFormat] || FORMAT_PRESETS['menu_34x30']);
        if (data.specs && typeof data.specs === 'object') {
            specs = Object.assign({}, specs, data.specs);
            if (specs.id && FORMAT_PRESETS[specs.id]) {
                currentFormat = specs.id;
            }
        }

        // Page Numbering recovery
        let pageNumbering = {
            enabled: false,
            format: 'page_n',
            position: 'bottom_center',
            startNumber: 1,
            skipCover: true,
            skipBack: false,
            fontFamily: 'Montserrat',
            fontSizePt: 8.5,
            color: '#64748b',
            marginMm: 8,
            perPanelForSpreads: true
        };
        if (data.pageNumbering && typeof data.pageNumbering === 'object') {
            pageNumbering = Object.assign({}, pageNumbering, data.pageNumbering);
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

        const optionalNumericProps = ['fontSize', 'radius', 'borderWidth', 'opacity', 'sliceStart', 'sliceEnd', 'rotate'];
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
            if (o.flipH !== undefined) o.flipH = Boolean(o.flipH);
            if (o.flipV !== undefined) o.flipV = Boolean(o.flipV);

            ['type', 'name', 'text', 'title', 'subtitle', 'caption', 'category', 'dishId', 'fontFamily', 'fontWeight', 'align',
             'bgColor', 'borderColor', 'color', 'textColor', 'titleColor', 'descColor', 'priceColor', 'imageUrl',
             'customName', 'customDesc', 'customPrice', 'svgKey', 'illustrationId']
                .forEach(prop => {
                    if (o[prop] !== undefined && o[prop] !== null && typeof o[prop] !== 'string') o[prop] = String(o[prop]);
                });
            return o;
        };

        const targetCount = Math.max(1, data.faces.length);
        const faces = [];
        const seenFaceIds = new Set();
        for (let i = 0; i < targetCount; i++) {
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

            let faceId = (src && src.id) ? String(src.id) : `page_${i + 1}`;
            if (seenFaceIds.has(faceId)) faceId = generateUniqueId('page');
            seenFaceIds.add(faceId);
            faces.push({
                id: faceId,
                sheetNumber: sheet,
                side,
                name: (src && src.name) ? String(src.name) : `Page ${i + 1}`,
                bgColor: (src && src.bgColor) ? String(src.bgColor) : (specs.defaultBgColor || '#fdfbf7'),
                objects
            });
        }

        return { dishesDB, faces, currentFormat, specs, pageNumbering };
    }

    loadFromLocalStorage() {
        try {
            const saved = localStorage.getItem('inmenu_studio_v3_greycorner_split');
            if (saved) {
                const data = JSON.parse(saved);
                const normalized = this.normalizeImportedData(data);
                this.dishesDB = normalized.dishesDB;
                this.faces = normalized.faces;
                if (normalized.currentFormat) this.currentFormat = normalized.currentFormat;
                if (normalized.specs) this.specs = normalized.specs;
                if (normalized.pageNumbering) this.pageNumbering = normalized.pageNumbering;
                return true;
            }
        } catch (e) {
            console.warn('Could not load saved state from localStorage:', e);
        }
        return false;
    }

    async loadFromAsyncStorage() {
        let loaded = false;
        try {
            if (typeof InMenuStorage !== 'undefined' && InMenuStorage.getItem) {
                try {
                    const saved = await InMenuStorage.getItem('inmenu_studio_v3_greycorner_split');
                    if (saved) {
                        const data = typeof saved === 'string' ? JSON.parse(saved) : saved;
                        const normalized = this.normalizeImportedData(data);
                        this.dishesDB = normalized.dishesDB;
                        this.faces = normalized.faces;
                        if (normalized.currentFormat) this.currentFormat = normalized.currentFormat;
                        if (normalized.specs) this.specs = normalized.specs;
                        if (normalized.pageNumbering) this.pageNumbering = normalized.pageNumbering;
                        loaded = true;
                    }
                } catch (err) {
                    console.warn('Could not load saved state from IndexedDB:', err);
                }
            }
            if (!loaded) loaded = this.loadFromLocalStorage();
        } finally {
            this.persistReady = true;
            if (loaded) {
                // Historique cohérent avec l'état réellement chargé
                this.history = [];
                this.redoStack = [];
                this.saveState(0);
            }
        }
        return loaded;
    }

    toJSON(pretty = true) {
        const payload = {
            app: 'InMenu Studio Pro',
            version: '2.0',
            currentFormat: this.currentFormat,
            specs: this.specs,
            pageNumbering: this.pageNumbering,
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
        if (normalized.currentFormat) this.currentFormat = normalized.currentFormat;
        if (normalized.specs) this.specs = normalized.specs;
        if (normalized.pageNumbering) this.pageNumbering = normalized.pageNumbering;
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

if (typeof window !== 'undefined') {
    window.FORMAT_PRESETS = FORMAT_PRESETS;
    window.DocumentEngine = DocumentEngine;
}
