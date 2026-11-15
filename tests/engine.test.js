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
        (f === 'utils.js' ? 'generateUniqueId, sanitizeFileName' : 'DocumentEngine, FORMAT_PRESETS') + '});', ctx);
}
const { DocumentEngine } = ctx.__exp;
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
    e.undo();
    assert.strictEqual(e.faces.length, n);
    e.redo();
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
        'updateFaceBgColor', 'uploadPhotoFile', 'downscaleImageDataUrl', 'alignSelected', 'duplicateSelected',
        'toggleLockSelected', 'deleteSelected', 'updateTopTransformBar', 'updateSelectedFromTopBar',
        'renderLayersList', 'bringToFront', 'bringForward', 'sendBackward', 'sendToBack',
        'renderSpreadsNavigator', 'addNewPage', 'duplicatePage', 'duplicateCurrentPage',
        'removePage', 'removeCurrentPage', 'updateFaceName',
        'goToFace', 'prevFace', 'nextFace', 'switchLeftTab',
        // app-db-word.js
        'populateQuickDishSelect', 'refreshDbCategoryFilter', 'openDatabaseModal', 'closeDatabaseModal',
        'renderDatabaseTable', 'updateDishDB', 'addNewDishToDB', 'deleteDishFromDB', 'insertDishFromModal',
        'initWordDropzone', 'updateWordModeCardsUI', 'openWordImportModal', 'closeWordImportModal',
        'loadFull10FacesSampleWordText', 'handleWordFileUpload', 'processWordFile',
        'parseWordRawText', 'parseWordRawTextDebounced', 'renderWordParsedPreview',
        'updateWordPreviewItem', 'toggleWordPreviewBadge', 'executeWordImportAndLayout', 'downloadWordTemplateSample',
        // app-modals.js
        'applySpreadTemplate', 'buildFlyerPromoA4Template', 'open3DFoldModal', 'update3DFoldAngle', 'close3DFoldModal',
        'openEngineInspector', 'closeEngineInspector', 'copyEngineJSON', 'updateFormatHeaderUI',
        'openFormatModal', 'closeFormatModal', 'renderFormatModalCards', 'changeActiveFormat',
        'openTemplatesModal', 'closeTemplatesModal', 'renderTemplatesModalCategories', 'renderTemplatesModalCards',
        'filterTemplates', 'searchTemplates', 'startProjectFromTemplate', 'applyTemplateToActivePage',
        'openPageNumberingModal', 'closePageNumberingModal', 'updatePageNumberingPreview', 'savePageNumberingFromModal',
        'openMobileSheet', 'closeMobileSheets', 'toggleMobileToolsMenu', 'closeMobileToolsMenu',
        'renderMobilePagesList', 'renderMobileCanvaSheet', 'renderMobileInspector',
        // app-io.js
        'openExportModal', 'closeExportModal', 'selectExportFormat',
        'getSelectedExportFormatSpecs', 'updateExportModalUI',
        'getSelectedExportScale', 'getReadingPageNumber',
        'exportCurrentFacePNG', 'exportSeparatePanelsPNG', 'exportPDF',
        'saveProjectToDisk', 'openProjectFromDisk', 'updateDiskSyncUI',
        'exportProjectJSON', 'importProjectJSON'
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




