// Lancer : node --test tests/engine.test.js
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ctx = { console, JSON, Date, Math, Set, Object, Array, Number, String, Boolean, Error, Promise };
vm.createContext(ctx);
for (const f of ['utils.js', 'engine.js']) {
    // const/class de premier niveau ne sont pas exposés : on les rattache au contexte
    const code = fs.readFileSync(path.join(__dirname, '..', 'js', f), 'utf8');
    vm.runInContext(code + '\n;this.__exp = Object.assign(this.__exp||{}, {' +
        (f === 'utils.js' ? 'generateUniqueId, sanitizeFileName, FONT_PAIRINGS, PHOTO_FILTER_PRESETS, QRCodeGenerator, buildPhotoFilterCSS, CULINARY_ICON_BADGES' : 'DocumentEngine, FORMAT_PRESETS') + '});', ctx);
}
const { DocumentEngine, FONT_PAIRINGS, PHOTO_FILTER_PRESETS, QRCodeGenerator, buildPhotoFilterCSS, CULINARY_ICON_BADGES } = ctx.__exp;
const flyer = () => { const e = new DocumentEngine(); e.setFormat('flyer_a4_portrait', true); e.persistReady = false; return e; };

test('numérotation romaine au-delà de 20', () => {
    const e = flyer();
    e.pageNumbering.format = 'roman';
    assert.strictEqual(e.formatPageNumberString(4), 'IV');
    assert.strictEqual(e.formatPageNumberString(24), 'XXIV');
});

test('ids de pages uniques (add/duplicate)', () => {
    const e = flyer();
    e.addPage(); e.duplicatePage(0); e.duplicatePage(0);
    const ids = e.faces.map(f => f.id);
    assert.strictEqual(new Set(ids).size, ids.length);
});

test('undo / redo', () => {
    const e = flyer();
    const n = e.faces.length;
    e.addPage();
    assert.strictEqual(e.undo(), 0);
    assert.strictEqual(e.faces.length, n);
    assert.strictEqual(e.redo(), 2);
    assert.strictEqual(e.faces.length, n + 1);
});

test('import : ids de pages dédupliqués', () => {
    const e = flyer();
    const data = JSON.parse(e.toJSON(false));
    data.faces = [{ id: 'x', objects: [] }, { id: 'x', objects: [] }];
    const out = e.normalizeImportedData(data);
    assert.notStrictEqual(out.faces[0].id, out.faces[1].id);
});

test('pas de sauvegarde avant persistReady', () => {
    const e = flyer();
    e.persistReady = false;
    assert.strictEqual(e.persistToLocalStorage(), true);
});

test('découpage modulaire de InMenuStudioApp : les 6 modules assemblent toutes les méthodes', () => {
    const appFiles = [
        'app-core.js',
        'app-canvas.js',
        'app-inspector.js',
        'app-db-word.js',
        'app-modals.js',
        'app-io.js',
        'app.js'
    ];
    for (const f of appFiles) {
        const fullPath = path.join(__dirname, '..', 'js', f);
        assert.ok(fs.existsSync(fullPath), `Le fichier ${f} doit exister`);
        const code = fs.readFileSync(fullPath, 'utf8');
        vm.runInContext(
            code + (f === 'app-core.js' ? '\n;this.__exp.InMenuStudioApp = InMenuStudioApp;' : ''),
            ctx
        );
    }
    const { InMenuStudioApp } = ctx.__exp;
    assert.strictEqual(typeof InMenuStudioApp, 'function');

    const expectedMethods = [
        // app-core.js
        'init', 'initModalBackdrops', 'bindViewportEvents', 'bindActionDelegation',
        'handleDelegatedClick', 'handleDelegatedInput', 'handleDelegatedChange', 'handleInspectorPropEvent',
        'commitState', 'commitStateDebounced', 'flushPendingSave', 'updateAutoSaveUI',
        'mmToPx', 'pxToMm', 'undo', 'redo', 'updateUndoRedoButtons',
        'isAnyModalOpen', 'closeTopModal', 'bindGlobalShortcuts', 'showToast',
        // app-canvas.js
        'setupGeometryDOM', 'applyZoomTransform', 'setZoom', 'fitToScreen',
        'renderRulers', 'renderCurrentFace', 'createObjectDOM', 'attachInlineTextEditing', 'attachDishInlineEditing', 'buildDishRowHTML',
        'onViewportMouseDown', 'selectObject', 'startDragObject', 'startResizeObject',
        'computeSmartSnap', 'hideSmartGuides', 'addMenuBlock', 'insertSelectedQuickDish',
        'togglePreviewMode', 'toggleSnap', 'renderCanvasPageNumberOverlay',
        'renderIllustrationsTab', 'filterIllustrations', 'searchIllustrations', 'addIllustrationObject',
        // app-inspector.js
        'renderInspector', 'updateSelectedProp', 'updateObjProp', 'updateInlineDishFromInspector',
        'addDishToSelectedCategory', 'deleteDishFromInspector', 'syncSelectedCategoryTitle',
        'updateCategorySlice', 'splitSelectedCategoryIntoColumns', 'transformSelectedTextCase',
        'updateFaceBgColor', 'uploadPhotoFile', 'downscaleImageDataUrl', 'alignSelected', 'distributeSelected',
        'groupSelectedObjects', 'ungroupSelectedObjects', 'copySelectedObjects', 'pasteClipboardObjects',
        'copySelectedStyle', 'pasteSelectedStyle', 'toggleVisibilitySelected', 'toggleMasterSelected',
        'threadOversetCategory', 'toggleGridOverlay', 'setGridColumns', 'updateGridGutter',
        'applyPhotoFilterPreset', 'setPhotoMaskShape', 'setCulinaryIcon', 'onFontPairingChange', 'updateGlobalTypography',
        'duplicateSelected', 'toggleLockSelected', 'deleteSelected', 'updateTopTransformBar', 'updateSelectedFromTopBar',
        'renderLayersList', 'bringToFront', 'bringForward', 'sendBackward', 'sendToBack',
        'renderSpreadsNavigator', 'addNewPage', 'duplicatePage', 'duplicateCurrentPage',
        'removePage', 'removeCurrentPage', 'updateFaceName',
        'goToFace', 'prevFace', 'nextFace', 'switchLeftTab',
        // app-db-word.js
        'populateQuickDishSelect', 'refreshDbCategoryFilter', 'openDatabaseModal', 'closeDatabaseModal',
        'renderDatabaseTable', 'updateDishDB', 'addNewDishToDB', 'deleteDishFromDB', 'insertDishFromModal',
        'toggleDishActiveStatus', 'createStoryFromDish', 'exportDatabaseCSV', 'triggerImportDatabaseCSV', 'importDatabaseCSV',
        'initWordDropzone', 'updateWordModeCardsUI', 'openWordImportModal', 'closeWordImportModal',
        'loadFull10FacesSampleWordText', 'handleWordFileUpload', 'processWordFile',
        'parseWordRawText', 'parseWordRawTextDebounced', 'renderWordParsedPreview',
        'updateWordPreviewItem', 'toggleWordPreviewBadge', 'executeWordImportAndLayout', 'downloadWordTemplateSample',
        // app-modals.js
        'applySpreadTemplate', 'buildFlyerPromoA4Template', 'open3DFoldModal', 'update3DFoldAngle', 'close3DFoldModal',
        'openEngineInspector', 'closeEngineInspector', 'copyEngineJSON', 'updateFormatHeaderUI',
        'onHeaderFormatChange', 'magicResizeDocument',
        'openFormatModal', 'closeFormatModal', 'renderFormatModalCards', 'changeActiveFormat',
        'openTemplatesModal', 'closeTemplatesModal', 'renderTemplatesModalCategories', 'renderTemplatesModalCards',
        'filterTemplates', 'searchTemplates', 'startProjectFromTemplate', 'applyTemplateToActivePage',
        'openPageNumberingModal', 'closePageNumberingModal', 'updatePageNumberingPreview', 'savePageNumberingFromModal',
        'openMobileSheet', 'closeMobileSheets', 'toggleMobileToolsMenu', 'closeMobileToolsMenu',
        'renderMobilePagesList', 'renderMobileCanvaSheet', 'renderMobileInspector',
        // app-io.js & PWA & Fullscreen
        'openExportModal', 'closeExportModal', 'selectExportFormat',
        'getSelectedExportFormatSpecs', 'updateExportModalUI',
        'getSelectedExportScale', 'getReadingPageNumber',
        'exportCurrentFacePNG', 'exportSeparatePanelsPNG', 'exportPDF',
        'saveProjectToDisk', 'openProjectFromDisk', 'updateDiskSyncUI',
        'exportProjectJSON', 'importProjectJSON', 'installPWA', 'toggleFullscreen'
    ];

    for (const method of expectedMethods) {
        assert.strictEqual(
            typeof InMenuStudioApp.prototype[method],
            'function',
            `La méthode InMenuStudioApp.prototype.${method} doit être définie`
        );
    }
});

test('aucun gestionnaire inline onclick/onchange/oninput/onmousedown dans index.html et js/*.js', () => {
    const rootDir = path.join(__dirname, '..');
    const htmlContent = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
    const inlineRegex = /\bon(click|change|input|mousedown|mouseup|keydown|keyup|submit)\s*=/i;

    assert.strictEqual(inlineRegex.test(htmlContent), false, 'index.html ne doit contenir aucun attribut on*=');

    const jsDir = path.join(rootDir, 'js');
    for (const file of fs.readdirSync(jsDir).filter(f => f.endsWith('.js'))) {
        const content = fs.readFileSync(path.join(jsDir, file), 'utf8');
        assert.strictEqual(inlineRegex.test(content), false, `js/${file} ne doit contenir aucun attribut on*=`);
    }
});

test('tous les attributs data-action, data-input et data-change sont pris en charge par app-core.js', () => {
    const rootDir = path.join(__dirname, '..');
    const coreCode = fs.readFileSync(path.join(rootDir, 'js', 'app-core.js'), 'utf8');
    const handledCases = new Set(
        Array.from(coreCode.matchAll(/case\s+'([^']+)'\s*:/g), m => m[1])
    );

    const filesToScan = [
        path.join(rootDir, 'index.html'),
        ...fs.readdirSync(path.join(rootDir, 'js'))
            .filter(f => f.endsWith('.js'))
            .map(f => path.join(rootDir, 'js', f))
    ];

    const attrRegex = /data-(?:action|input|change)="([^"$]+)"/g;
    for (const filePath of filesToScan) {
        const content = fs.readFileSync(filePath, 'utf8');
        for (const match of content.matchAll(attrRegex)) {
            const actionName = match[1];
            assert.ok(
                handledCases.has(actionName),
                `L'action déléguée "${actionName}" dans ${path.basename(filePath)} doit être gérée dans app-core.js`
            );
        }
    }
});

test('mode 100% hors-ligne : assets locaux présents et aucun CDN dans index.html', () => {
    const rootDir = path.join(__dirname, '..');
    const htmlContent = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
    assert.strictEqual(/https?:\/\//i.test(htmlContent), false, 'index.html ne doit charger aucune ressource distante http(s)://');

    const requiredLocalAssets = [
        'css/tailwind.min.css',
        'css/styles.css',
        'vendor/fonts/google-fonts.css',
        'vendor/fontawesome/css/all.min.css',
        'vendor/jspdf.umd.min.js',
        'vendor/mammoth.browser.min.js'
    ];
    for (const relPath of requiredLocalAssets) {
        const fullPath = path.join(rootDir, relPath);
        assert.ok(fs.existsSync(fullPath), `L'asset hors-ligne ${relPath} doit exister`);
        assert.ok(fs.statSync(fullPath).size > 1000, `L'asset ${relPath} ne doit pas être vide`);
    }
});

test('Banque de gabarits InDesign : 29 modèles valides, constructibles et normalisés', () => {
    const rootDir = path.join(__dirname, '..');
    const illCode = fs.readFileSync(path.join(rootDir, 'js', 'illustrations-pack.js'), 'utf8');
    vm.runInContext(illCode + '\n;this.__exp.InDesignIllustrationsPack = InDesignIllustrationsPack;', ctx);
    const tplCode = fs.readFileSync(path.join(rootDir, 'js', 'indesign-templates.js'), 'utf8');
    vm.runInContext(tplCode + '\n;this.__exp.InDesignTemplatesBank = InDesignTemplatesBank;', ctx);

    const { InDesignTemplatesBank, InDesignIllustrationsPack, FORMAT_PRESETS } = ctx.__exp;
    assert.ok(InDesignTemplatesBank, 'InDesignTemplatesBank doit être défini');
    assert.strictEqual(InDesignTemplatesBank.templates.length, 29, 'La banque doit contenir 29 gabarits');

    const validCategories = new Set(InDesignTemplatesBank.categories.map(c => c.id));
    const validTypes = new Set([
        'shape', 'text', 'dish_item', 'vertical_banner',
        'badge_new', 'logo', 'photo', 'illustration', 'category_list'
    ]);
    const seenIds = new Set();

    for (const tpl of InDesignTemplatesBank.templates) {
        assert.ok(tpl.id && !seenIds.has(tpl.id), `ID de gabarit unique requis : ${tpl.id}`);
        seenIds.add(tpl.id);
        assert.ok(validCategories.has(tpl.category), `Catégorie valide requise pour ${tpl.id}`);
        assert.ok(FORMAT_PRESETS[tpl.format], `Format ${tpl.format} valide requis pour ${tpl.id}`);
        assert.strictEqual(typeof tpl.builder, 'function', `Builder requis pour ${tpl.id}`);

        // Test en mode new_project
        const engProject = new DocumentEngine();
        engProject.persistReady = false;
        tpl.builder(engProject, 'new_project');
        InDesignTemplatesBank.normalizeEngineFaces(engProject);

        assert.strictEqual(engProject.currentFormat, tpl.format);
        assert.ok(Array.isArray(engProject.faces) && engProject.faces.length >= 1);

        const objIds = new Set();
        for (const face of engProject.faces) {
            assert.ok(Array.isArray(face.objects), `face.objects doit être un tableau (${tpl.id})`);
            for (const obj of face.objects) {
                assert.ok(obj.id && !objIds.has(obj.id), `Chaque objet normalisé doit avoir un ID unique (${tpl.id})`);
                objIds.add(obj.id);
                assert.ok(validTypes.has(obj.type), `Type d'objet canonique "${obj.type}" invalide dans ${tpl.id}`);
                if (obj.type === 'illustration') {
                    assert.ok(
                        InDesignIllustrationsPack.getById(obj.illustrationId),
                        `Illustration "${obj.illustrationId}" introuvable dans InDesignIllustrationsPack (${tpl.id})`
                    );
                }
                assert.strictEqual(typeof obj.x, 'number', `Coordonnée x numérique requise dans ${tpl.id}`);
                assert.strictEqual(typeof obj.y, 'number', `Coordonnée y numérique requise dans ${tpl.id}`);
                assert.strictEqual(typeof obj.w, 'number', `Largeur w numérique requise dans ${tpl.id}`);
                assert.strictEqual(typeof obj.h, 'number', `Hauteur h numérique requise dans ${tpl.id}`);
            }
        }

        // Test en mode single_face
        const engSingle = new DocumentEngine();
        engSingle.persistReady = false;
        engSingle.setFormat(tpl.format, true);
        engSingle.currentFace = engSingle.faces[0];
        tpl.builder(engSingle, 'single_face');
        InDesignTemplatesBank.normalizeFace(engSingle.currentFace);
        assert.ok(Array.isArray(engSingle.currentFace.objects));
    }
});

test('PrintExporter : mise à l’échelle vers Format A4 (210 × 297 mm) et 170 × 300 mm pour Menu Séparé', () => {
    const rootDir = path.join(__dirname, '..');
    const expCode = fs.readFileSync(path.join(rootDir, 'js', 'print-exporter.js'), 'utf8');
    vm.runInContext(expCode + '\n;this.__exp.PrintExporter = PrintExporter;', ctx);

    const { PrintExporter } = ctx.__exp;
    assert.ok(PrintExporter, 'PrintExporter doit être défini');

    const eng = new DocumentEngine();
    eng.persistReady = false;
    const exporter = new PrintExporter(eng);

    // Remapping d'un panneau 170 × 300 mm (panneau droit x=182..328) vers Format A4 (210 × 297 mm)
    const scaleX = 210 / 170;
    const scaleY = 297 / 300;
    const srcObj = {
        id: 'obj_test',
        type: 'category_list',
        x: 182,
        y: 25,
        w: 146,
        h: 250,
        fontSize: 10.5
    };
    const mappedA4 = exporter.scaleObjectForTarget(srcObj, 170, scaleX, scaleY);
    assert.ok(Math.abs(mappedA4.x - (12 * scaleX)) < 0.01, 'Coordonnée X du panneau droit ramenée à 0..210 mm pour A4');
    assert.ok(Math.abs(mappedA4.w - (146 * scaleX)) < 0.01, 'Largeur adaptée proportionnellement à 210 mm (A4)');
    assert.ok(Math.abs(mappedA4.h - (250 * scaleY)) < 0.01, 'Hauteur adaptée proportionnellement à 297 mm (A4)');
});





test('import : couleurs, polices et URLs d\'image sont assainies', () => {
    const e = flyer();
    const data = JSON.parse(e.toJSON(false));
    data.faces = [{ id: 'a', objects: [{
        type: 'text', x: 1e9, y: 0, w: 10, h: 10,
        color: 'red;} body{display:none', bgColor: '#fff', fontFamily: "Inter'; background:url(x)",
        imageUrl: 'javascript:alert(1)', align: 'evil'
    }] }];
    const o = e.normalizeImportedData(data).faces[0].objects[0];
    assert.strictEqual(o.color, undefined);
    assert.strictEqual(o.bgColor, '#fff');
    assert.ok(!/['";:()]/.test(o.fontFamily));
    assert.strictEqual(o.imageUrl, '');
    assert.strictEqual(o.align, undefined);
    assert.strictEqual(o.x, 5000);
});

test('historique : les grosses images sont dédupliquées et restaurées par undo', () => {
    const e = flyer();
    const big = 'data:image/png;base64,' + 'A'.repeat(50000);
    e.faces[0].objects.push({ id: 'img1', type: 'image', x: 0, y: 0, w: 10, h: 10, imageUrl: big });
    e.saveState(0);
    e.faces[0].objects[0].x = 5;
    e.saveState(0);
    assert.ok(e.history[e.history.length - 1].length < 5000, 'snapshot léger');
    e.undo();
    assert.strictEqual(e.faces[0].objects[0].imageUrl, big);
    assert.strictEqual(e.faces[0].objects[0].x, 0);
});

test('preflight : détecte hors-page, texte minuscule et image sans source', () => {
    const e = flyer();
    const { widthMm: W } = e.specs;
    e.faces[0].objects = [
        { id: 'a', type: 'text', x: W + 10, y: 0, w: 10, h: 10 },
        { id: 'b', type: 'text', x: 20, y: 20, w: 10, h: 10, fontSize: 3 },
        { id: 'c', type: 'image', x: 20, y: 40, w: 10, h: 10, imageUrl: '' },
        { id: 'd', type: 'text', x: 20, y: 60, w: 10, h: 10, fontSize: 12 }
    ];
    const ids = e.preflight().map(i => i.id);
    assert.strictEqual(JSON.stringify(ids.sort()), JSON.stringify(['a', 'b', 'c']));
});

test('v4.0 - Formats v4 et Magic Resize', () => {
    const e = new DocumentEngine();
    e.persistReady = false;

    // Vérifie les formats v4.0 requis
    const requiredFormats = ['BOOKLET_34x30', 'A4_PORTRAIT', 'A3_LANDSCAPE', 'A6_TENT', 'INSTA_STORY', 'INSTA_POST'];
    for (const fmt of requiredFormats) {
        assert.ok(e.FORMAT_SPECS[fmt], `Format ${fmt} doit être présent dans FORMAT_SPECS`);
        assert.ok(e.FORMAT_SPECS[fmt].widthMm > 0);
        assert.ok(e.FORMAT_SPECS[fmt].heightMm > 0);
    }

    // Test Magic Resize
    e.setFormat('A4_PORTRAIT', true);
    e.faces[0].objects = [
        { id: 'test_obj', type: 'text', x: 21, y: 29.7, w: 105, h: 50, fontSize: 20 }
    ];
    const ok = e.magicResize('INSTA_STORY');
    assert.strictEqual(ok, true);
    assert.strictEqual(e.currentFormat, 'INSTA_STORY');
    const resized = e.faces[0].objects[0];
    const expectedRatioX = 108 / 210;
    const expectedRatioY = 192 / 297;
    assert.ok(Math.abs(resized.x - (21 * expectedRatioX)) < 0.5, 'X proportionnel');
    assert.ok(Math.abs(resized.y - (29.7 * expectedRatioY)) < 0.5, 'Y proportionnel');
    assert.ok(Math.abs(resized.w - (105 * expectedRatioX)) < 0.5, 'W proportionnel');
    assert.ok(Math.abs(resized.h - (50 * expectedRatioY)) < 0.5, 'H proportionnel');
});

test('v4.0 - Duos Typographiques (Font Pairings)', () => {
    const e = flyer();
    assert.ok(FONT_PAIRINGS.bistrot_chic);
    assert.ok(FONT_PAIRINGS.palace_prestige);
    assert.ok(FONT_PAIRINGS.moderne_minimal);

    e.faces[0].objects = [
        { id: 'title_1', type: 'title_heading', fontFamily: 'Arial' },
        { id: 'cat_1', type: 'category_list', fontFamily: 'Arial', descFontFamily: 'Arial', priceFontFamily: 'Arial' },
        { id: 'text_1', type: 'text', fontFamily: 'Arial' }
    ];

    e.applyFontPairing('palace_prestige');
    assert.strictEqual(e.fontPairing, 'palace_prestige');
    assert.strictEqual(e.faces[0].objects[0].fontFamily, 'Cinzel');
    assert.strictEqual(e.faces[0].objects[1].fontFamily, 'Cinzel');
    assert.strictEqual(e.faces[0].objects[1].descFontFamily, 'Cormorant Garamond');
    assert.strictEqual(e.faces[0].objects[1].priceFontFamily, 'Montserrat');
});

test('v4.0 - Filtres Photo & Presets', () => {
    assert.ok(PHOTO_FILTER_PRESETS.natural);
    assert.ok(PHOTO_FILTER_PRESETS.warm);
    assert.ok(PHOTO_FILTER_PRESETS.vintage);
    assert.ok(PHOTO_FILTER_PRESETS.bw_contrast);
    assert.ok(PHOTO_FILTER_PRESETS.studio_glow);

    const warmCSS = buildPhotoFilterCSS(PHOTO_FILTER_PRESETS.warm);
    assert.ok(warmCSS.includes('brightness('));
    assert.ok(warmCSS.includes('contrast('));
    assert.ok(warmCSS.includes('saturate('));

    const bwCSS = buildPhotoFilterCSS(PHOTO_FILTER_PRESETS.bw_contrast);
    assert.ok(bwCSS.includes('grayscale(100%)'));
});

test('v4.0 - QR Code Generator & Icônes Culinaires', () => {
    assert.ok(QRCodeGenerator, 'QRCodeGenerator doit être disponible');
    const matrix = QRCodeGenerator.generateMatrix('https://example.com');
    assert.ok(Array.isArray(matrix));
    assert.ok(matrix.length >= 21);
    assert.ok(matrix[0].length >= 21);

    const svg = QRCodeGenerator.buildSVG('https://example.com', { color: '#000000', bgColor: '#ffffff' });
    assert.ok(svg.includes('<svg'));
    assert.ok(svg.includes('</svg>'));

    assert.ok(Array.isArray(CULINARY_ICON_BADGES));
    assert.ok(CULINARY_ICON_BADGES.some(i => i.id === 'wifi'));
    assert.ok(CULINARY_ICON_BADGES.some(i => i.id === 'spicy'));
    assert.ok(CULINARY_ICON_BADGES.some(i => i.id === 'chef'));
});

test('v4.0 - Statut Actif / Rupture & Import/Export CSV', () => {
    const e = flyer();
    if (e.dishesDB.length === 0) {
        e.dishesDB = [
            { id: 'PDJ01', category: 'PETIT DÉJEUNER', name: 'Light', desc: 'Pain complet', price: '42 DH', badge: '', active: true },
            { id: 'PDJ02', category: 'PETIT DÉJEUNER', name: 'Express', desc: 'Viennoiseries', price: '45 DH', badge: '', active: true }
        ];
    }
    assert.ok(e.dishesDB.length > 0);

    // Test de plat inactif
    const firstDish = e.dishesDB[0];
    const cat = firstDish.category;
    const initialCount = e.getDishesByCategory(cat).length;

    firstDish.active = false;
    const activeCount = e.getDishesByCategory(cat, false).length;
    const allCount = e.getDishesByCategory(cat, true).length;
    assert.strictEqual(activeCount, initialCount - 1, 'Plat inactif masqué par défaut');
    assert.strictEqual(allCount, initialCount, 'Plat inactif inclus si includeInactive=true');

    // Test Export & Import CSV
    const csv = e.exportDishesCSV();
    assert.ok(csv.includes('ID,Catégorie,Plat,Description,Prix,Badge,Actif'));
    assert.ok(csv.includes(firstDish.name));

    const sampleCSV = `ID,Catégorie,Plat,Description,Prix,Badge,Actif\ntest_1,DESSERTS,Tarte Tatin,Pommes caramélisées,45 DH,CHEF,OUI`;
    const count = e.importDishesCSV(sampleCSV);
    assert.strictEqual(count, 1);
    const imported = e.getDishById('test_1');
    assert.ok(imported);
    assert.strictEqual(imported.name, 'Tarte Tatin');
    assert.strictEqual(imported.price, '45 DH');
    assert.strictEqual(imported.active, true);
});

test('PWA : manifest.json, service worker et icônes haute fidélité valides', () => {
    const rootDir = path.join(__dirname, '..');

    // 1. Manifest
    const manifestPath = path.join(rootDir, 'manifest.json');
    assert.ok(fs.existsSync(manifestPath), 'manifest.json doit exister à la racine');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    assert.ok(manifest.name && manifest.short_name);
    assert.strictEqual(manifest.display, 'standalone');
    assert.ok(Array.isArray(manifest.icons) && manifest.icons.length >= 3);

    // 2. Icônes référencées
    for (const icon of manifest.icons) {
        const iconPath = path.join(rootDir, icon.src);
        assert.ok(fs.existsSync(iconPath), `L'icône PWA ${icon.src} doit exister sur le disque`);
        assert.ok(fs.statSync(iconPath).size > 100, `L'icône PWA ${icon.src} ne doit pas être vide`);
    }

    // 3. Apple Touch Icon & Maskable Icon
    assert.ok(fs.existsSync(path.join(rootDir, 'icons', 'apple-touch-icon.png')));
    assert.ok(fs.existsSync(path.join(rootDir, 'icons', 'icon-maskable.png')));

    // 4. Service Worker
    const swPath = path.join(rootDir, 'sw.js');
    assert.ok(fs.existsSync(swPath), 'sw.js doit exister à la racine');
    const swContent = fs.readFileSync(swPath, 'utf8');
    assert.ok(swContent.includes('CACHE_NAME'));
    assert.ok(swContent.includes('addEventListener(\'install\''));
    assert.ok(swContent.includes('addEventListener(\'fetch\''));

    // 5. Index HTML liens PWA
    const html = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
    assert.ok(html.includes('rel="manifest"'));
    assert.ok(html.includes('name="theme-color"'));
    assert.ok(html.includes('data-action="install-pwa"'));
});
