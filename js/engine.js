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
                this.maxHistory = 40;
                this.lastSaveSuccess = true;
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

            populateSampleSpread1Recto(face) {
                WordMenuImporter.autoLayoutAcrossSpreads(this, this.dishesDB, {
                    mode: 'full_auto_spreads',
                    theme: 'bistro_warm',
                    brandTitle: GREY_CORNER_BRAND.title,
                    brandSub: GREY_CORNER_BRAND.subtitle
                });
            }

            populateSampleSpread1Verso(face) {
                WordMenuImporter.autoLayoutAcrossSpreads(this, this.dishesDB.filter(d => d.category === 'PETIT DÉJEUNER' || d.category === 'BRUNCH & MENU ENFANT'), {
                    mode: 'active_spread_only',
                    theme: 'bistro_warm',
                    brandTitle: GREY_CORNER_BRAND.title,
                    brandSub: GREY_CORNER_BRAND.subtitle,
                    activeFaceIndex: this.faces.indexOf(face) >= 0 ? this.faces.indexOf(face) : 1
                });
            }

            populateSampleSpread2Recto(face) {
                WordMenuImporter.autoLayoutAcrossSpreads(this, this.dishesDB.filter(d => d.category === 'PLATS & COUSCOUS' || d.category === 'PASTA & LASAGNES' || d.category === 'CRÊPES SUCRÉES & GAUFRES'), {
                    mode: 'active_spread_only',
                    theme: 'bistro_warm',
                    brandTitle: GREY_CORNER_BRAND.title,
                    brandSub: GREY_CORNER_BRAND.subtitle,
                    activeFaceIndex: this.faces.indexOf(face) >= 0 ? this.faces.indexOf(face) : 2
                });
            }

            // Save Snapshot for Undo/Redo
            saveState() {
                const snapshot = JSON.stringify({
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
                this.persistToLocalStorage();
                return true;
            }

            persistToLocalStorage() {
                try {
                    localStorage.setItem('inmenu_studio_v2_greycorner', this.toJSON(false));
                    this.lastSaveSuccess = true;
                    return true;
                } catch (e) {
                    console.warn('LocalStorage quota warning:', e);
                    this.lastSaveSuccess = false;
                    return false;
                }
            }

            normalizeImportedData(data) {
                if (!data || !Array.isArray(data.faces) || !Array.isArray(data.dishesDB)) {
                    throw new Error('Format JSON InMenu invalide.');
                }
                // Garantit l'unicité des identifiants (plats et objets) après import
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

                // Les propriétés numériques sont injectées dans le HTML de l'inspecteur :
                // elles doivent impérativement être des nombres (sinon risque d'injection XSS via JSON).
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
                    ['type', 'name', 'text', 'title', 'subtitle', 'caption', 'category', 'dishId', 'fontFamily', 'fontWeight', 'align',
                     'bgColor', 'borderColor', 'color', 'textColor', 'titleColor', 'descColor', 'priceColor', 'imageUrl']
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
                    const saved = localStorage.getItem('inmenu_studio_v2_greycorner');
                    if (saved) {
                        const data = JSON.parse(saved);
                        const normalized = this.normalizeImportedData(data);
                        this.dishesDB = normalized.dishesDB;
                        this.faces = normalized.faces;
                        return true;
                    }
                } catch (e) {
                    console.warn('Could not load saved state:', e);
                }
                return false;
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

        /**
         * ============================================================================
         * MODULE 1B: WordImporter & AutoLayoutEngine
         * Parses .docx (via Mammoth.js) or raw text into structured Categories & Dishes,
         * and automatically flows them across the 5 sheets (10 faces) of 340×300 mm
         * while respecting the 170 mm fold and 160–180 mm safety zone.
         * ============================================================================
         */
        