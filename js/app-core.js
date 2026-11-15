/**
 * MODULE 2A: Core Controller, State Management, Shortcuts & Event Delegation (app-core.js)
 */
class InMenuStudioApp {
    constructor() {
        if (typeof window !== 'undefined') {
            window.app = this;
        }
        this.engine = new DocumentEngine();
        this.engine.loadFromLocalStorage();
        this.engine.saveState();

        this.exporter = new PrintExporter(this.engine);

        // Base scale: 1 mm = 3 px at 100% zoom (340mm = 1020px, 300mm = 900px)
        this.basePxPerMm = 3;
        this.zoom = 0.8;

        this.currentFaceIndex = 0;
        this.selectedObjectId = null;
        this.selectedObjectIds = [];
        this.clipboardObjects = null;
        this.copiedStyle = null;
        this.previewMode = false; // 'W' shortcut InDesign mode
        this.snapEnabled = true;

        // Drag / Resize Interaction State & Timers
        this.interaction = null;
        this.debounceSaveTimer = null;
        this.activeIllustrationCategory = 'all';
        this.illustrationsSearchQuery = '';

        // Google Drive / Local Disk Synchronization State (Option A)
        this.activeFileHandle = null;
        this.activeFileName = (typeof localStorage !== 'undefined' && localStorage.getItem('inmenu_last_synced_filename')) || null;
        this.isSavingDisk = false;

        this.init();
    }

    init() {
        this.setupGeometryDOM();
        this.bindViewportEvents();
        this.bindActionDelegation();
        this.initWordDropzone();
        this.renderSpreadsNavigator();
        this.populateQuickDishSelect();
        this.renderCurrentFace();
        this.renderInspector();
        this.updateUndoRedoButtons();
        this.updateAutoSaveUI(this.engine.lastSaveSuccess);
        this.bindGlobalShortcuts();
        this.initModalBackdrops();
        this.renderIllustrationsTab();
        this.updateFormatHeaderUI();
        this.updateDiskSyncUI(true);

        // Asynchronously verify if larger project exists in IndexedDB
        if (this.engine.loadFromAsyncStorage) {
            this.engine.loadFromAsyncStorage().then(loaded => {
                if (loaded) {
                    this.renderSpreadsNavigator();
                    this.populateQuickDishSelect();
                    this.renderCurrentFace();
                    this.renderInspector();
                    this.updateUndoRedoButtons();
                    this.updateAutoSaveUI(true);
                }
            }).catch(() => { this.engine.persistReady = true; });
        } else {
            this.engine.persistReady = true;
        }

        if (typeof window !== 'undefined' && window.innerWidth < 1024) {
            this.fitToScreen();
        }
        requestAnimationFrame(() => this.renderRulers());
    }

    initModalBackdrops() {
        const modalIds = [
            'modal-database', 'modal-export', 'modal-3d', 'modal-engine',
            'modal-word-import', 'modal-format', 'modal-page-numbering',
            'modal-templates', 'modal-mobile-tools'
        ];
        modalIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('click', (e) => {
                    if (e.target === el) {
                        this.closeTopModal();
                    }
                });
            }
        });
    }

    bindViewportEvents() {
        const viewport = document.getElementById('viewport');
        if (viewport) {
            viewport.addEventListener('scroll', () => {
                requestAnimationFrame(() => this.renderRulers());
            }, { passive: true });
            viewport.addEventListener('mousedown', (e) => {
                this.onViewportMouseDown(e);
            });
        }
        window.addEventListener('resize', () => {
            requestAnimationFrame(() => this.renderRulers());
        });
        // Ne pas perdre une saisie en attente de debounce lors de la fermeture / mise en arrière-plan
        window.addEventListener('beforeunload', () => this.flushPendingSave());
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') this.flushPendingSave();
        });
    }

    /**
     * Délégation centralisée des événements (click, input, change)
     * Remplace tous les attributs inline onclick / oninput / onchange.
     */
    bindActionDelegation() {
        if (typeof document === 'undefined' || this._delegationBound) return;
        this._delegationBound = true;

        document.addEventListener('click', (e) => {
            const ctxMenu = document.getElementById('canvas-context-menu');
            if (ctxMenu && !ctxMenu.classList.contains('hidden') && !e.target.closest('[data-action]')) {
                ctxMenu.classList.add('hidden');
            }
            const el = e.target.closest('[data-action]');
            if (!el) return;
            const action = el.dataset.action;
            if (ctxMenu && !ctxMenu.classList.contains('hidden')) {
                ctxMenu.classList.add('hidden');
            }
            if (el.dataset.closeTools === 'true') {
                this.closeMobileToolsMenu();
            }
            this.handleDelegatedClick(action, el, e);
            if (el.dataset.closeMobile === 'true') {
                this.closeMobileSheets();
            }
        });

        document.addEventListener('input', (e) => {
            const el = e.target.closest('[data-input]');
            if (!el) return;
            this.handleDelegatedInput(el.dataset.input, el, e);
        });

        document.addEventListener('change', (e) => {
            const el = e.target.closest('[data-change]');
            if (!el) return;
            this.handleDelegatedChange(el.dataset.change, el, e);
        });
    }

    handleDelegatedClick(action, el, e) {
        switch (action) {
            case 'noop':
                e.stopPropagation();
                break;
            case 'undo':
                this.undo();
                break;
            case 'redo':
                this.redo();
                break;
            case 'open-word-import':
                if (el.dataset.closeDb === 'true') this.closeDatabaseModal();
                this.openWordImportModal();
                break;
            case 'close-word-import':
                this.closeWordImportModal();
                break;
            case 'open-database':
                this.openDatabaseModal();
                break;
            case 'close-database':
                this.closeDatabaseModal();
                break;
            case 'open-engine-inspector':
                this.openEngineInspector();
                break;
            case 'close-engine-inspector':
                this.closeEngineInspector();
                break;
            case 'copy-engine-json':
                this.copyEngineJSON();
                break;
            case 'open-templates-modal':
                this.openTemplatesModal();
                break;
            case 'close-templates-modal':
                this.closeTemplatesModal();
                break;
            case 'open-format-modal':
                this.openFormatModal();
                break;
            case 'close-format-modal':
                this.closeFormatModal();
                break;
            case 'open-page-numbering':
                this.openPageNumberingModal();
                break;
            case 'close-page-numbering':
                this.closePageNumberingModal();
                break;
            case 'save-page-numbering':
                this.savePageNumberingFromModal();
                break;
            case 'toggle-preview-mode':
                this.togglePreviewMode();
                break;
            case 'open-3d-fold':
                this.open3DFoldModal();
                break;
            case 'close-3d-fold':
                this.close3DFoldModal();
                break;
            case 'save-disk':
                this.saveProjectToDisk(el.dataset.saveAs === 'true');
                break;
            case 'open-disk':
                this.openProjectFromDisk();
                break;
            case 'export-json':
                this.exportProjectJSON();
                break;
            case 'open-export-modal':
                this.openExportModal();
                break;
            case 'close-export-modal':
                this.closeExportModal();
                break;
            case 'export-separate-png':
                this.exportSeparatePanelsPNG();
                break;
            case 'export-face-png':
                this.exportCurrentFacePNG();
                break;
            case 'export-pdf':
                this.exportPDF();
                break;
            case 'toggle-mobile-tools':
                this.toggleMobileToolsMenu();
                break;
            case 'close-mobile-tools':
                this.closeMobileToolsMenu();
                break;
            case 'open-mobile-sheet':
                this.openMobileSheet(el.dataset.sheet);
                break;
            case 'close-mobile-sheets':
                this.closeMobileSheets();
                break;
            case 'switch-left-tab':
                this.switchLeftTab(el.dataset.tab);
                break;
            case 'add-menu-block':
                this.addMenuBlock(el.dataset.type);
                break;
            case 'insert-quick-dish':
                this.insertSelectedQuickDish();
                break;
            case 'apply-spread-template':
                this.applySpreadTemplate(el.dataset.template);
                break;
            case 'prev-face':
                this.prevFace();
                break;
            case 'next-face':
                this.nextFace();
                break;
            case 'go-to-face':
                this.goToFace(parseInt(el.dataset.index, 10));
                break;
            case 'add-new-page':
                this.addNewPage();
                if (el.dataset.refreshMobile === 'true') this.renderMobilePagesList();
                break;
            case 'duplicate-page':
                e.stopPropagation();
                this.duplicatePage(parseInt(el.dataset.index, 10));
                if (el.dataset.refreshMobile === 'true') this.renderMobilePagesList();
                break;
            case 'duplicate-current-page':
                this.duplicateCurrentPage();
                if (el.dataset.refreshMobile === 'true') this.renderMobilePagesList();
                break;
            case 'remove-page':
                e.stopPropagation();
                this.removePage(parseInt(el.dataset.index, 10));
                if (el.dataset.refreshMobile === 'true') this.renderMobilePagesList();
                break;
            case 'remove-current-page':
                this.removeCurrentPage();
                if (el.dataset.refreshMobile === 'true') this.renderMobilePagesList();
                break;
            case 'zoom-step':
                this.setZoom(this.zoom + parseFloat(el.dataset.delta));
                break;
            case 'fit-to-screen':
                this.fitToScreen();
                break;
            case 'bring-to-front':
                this.bringToFront();
                break;
            case 'bring-forward':
                this.bringForward();
                break;
            case 'send-backward':
                this.sendBackward();
                break;
            case 'send-to-back':
                this.sendToBack();
                break;
            case 'add-dish-db':
                this.addNewDishToDB();
                break;
            case 'insert-dish-from-modal': {
                const tr = el.closest('tr');
                this.insertDishFromModal((tr && tr.dataset.dishId) || el.dataset.dishId);
                break;
            }
            case 'delete-dish-db': {
                const tr = el.closest('tr');
                this.deleteDishFromDB((tr && tr.dataset.dishId) || el.dataset.dishId);
                break;
            }
            case 'download-word-sample':
                this.downloadWordTemplateSample();
                break;
            case 'load-word-sample':
                this.loadFull10FacesSampleWordText();
                break;
            case 'parse-word-raw':
                this.parseWordRawText();
                break;
            case 'toggle-word-badge': {
                const row = el.closest('[data-item-id]');
                this.toggleWordPreviewBadge((row && row.dataset.itemId) || el.dataset.itemId);
                break;
            }
            case 'execute-word-import':
                this.executeWordImportAndLayout();
                break;
            case 'change-active-format':
                this.changeActiveFormat(el.dataset.format);
                break;
            case 'filter-templates':
                this.filterTemplates(el.dataset.cat);
                break;
            case 'reset-templates-filter':
                this.searchTemplates('');
                this.filterTemplates('all');
                break;
            case 'start-project-template':
                this.startProjectFromTemplate(el.dataset.tplId);
                break;
            case 'apply-template-page':
                this.applyTemplateToActivePage(el.dataset.tplId);
                break;
            case 'filter-illustrations':
                this.filterIllustrations(el.dataset.cat);
                if (el.dataset.refreshMobile === 'true') this.renderMobileCanvaSheet();
                break;
            case 'clear-illustrations-search':
                this.searchIllustrations('');
                if (el.dataset.refreshMobile === 'true') this.renderMobileCanvaSheet();
                break;
            case 'add-illustration':
                this.addIllustrationObject(el.dataset.id);
                break;
            case 'select-object':
                this.selectObject(el.dataset.objId, e.shiftKey);
                break;
            case 'toggle-lock':
                e.stopPropagation();
                this.toggleLockSelected(el.dataset.objId || null);
                break;
            case 'toggle-visibility':
                e.stopPropagation();
                this.toggleVisibilitySelected(el.dataset.objId || null);
                break;
            case 'toggle-master-object':
                this.toggleMasterSelected(el.dataset.objId || null);
                break;
            case 'group-selected':
                this.groupSelectedObjects();
                break;
            case 'ungroup-selected':
                this.ungroupSelectedObjects();
                break;
            case 'copy-selected':
                this.copySelectedObjects();
                break;
            case 'paste-selected':
            case 'paste-clipboard':
                this.pasteClipboardObjects();
                break;
            case 'copy-style':
                this.copySelectedStyle();
                break;
            case 'paste-style':
                this.pasteSelectedStyle();
                break;
            case 'align-selected':
                this.alignSelected(el.dataset.mode);
                break;
            case 'distribute-selected':
                this.distributeSelected(el.dataset.axis);
                break;
            case 'duplicate-selected':
                this.duplicateSelected();
                break;
            case 'delete-selected':
                this.deleteSelected();
                break;
            case 'fit-block-height':
                this.updateObjProp('h', parseFloat(el.dataset.height));
                this.renderInspector();
                break;
            case 'set-obj-color':
                this.updateObjProp('color', el.dataset.color, false);
                this.renderInspector();
                break;
            case 'toggle-obj-flip':
                if (this.selectedObject) {
                    const prop = el.dataset.flip;
                    this.updateObjProp(prop, !this.selectedObject[prop], false);
                    this.renderInspector();
                }
                break;
            case 'add-dish-to-category':
                this.addDishToSelectedCategory();
                break;
            case 'delete-dish-from-inspector':
                this.deleteDishFromInspector(el.dataset.dishId);
                break;
            case 'split-category-columns':
                this.splitSelectedCategoryIntoColumns();
                break;
            case 'sync-category-title':
                this.syncSelectedCategoryTitle();
                break;
            case 'thread-overset-category':
                e.stopPropagation();
                this.threadOversetCategory(el.dataset.objId);
                break;
            case 'text-transform-case':
                this.transformSelectedTextCase(el.dataset.case);
                break;
            case 'select-export-format':
                this.selectExportFormat(el.dataset.format);
                break;
            case 'toggle-grid-overlay':
                this.toggleGridOverlay();
                break;
            case 'set-grid-columns':
                this.setGridColumns(parseInt(el.dataset.cols, 10));
                break;
            case 'apply-photo-filter-preset':
                this.applyPhotoFilterPreset(el.dataset.preset);
                break;
            case 'set-photo-mask-shape':
                this.setPhotoMaskShape(el.dataset.shape);
                break;
            case 'set-culinary-icon':
                this.setCulinaryIcon(el.dataset.iconId);
                break;
            case 'toggle-dish-active': {
                const tr = el.closest('tr');
                this.toggleDishActiveStatus((tr && tr.dataset.dishId) || el.dataset.dishId);
                break;
            }
            case 'create-dish-story': {
                const tr = el.closest('tr');
                this.createStoryFromDish((tr && tr.dataset.dishId) || el.dataset.dishId);
                break;
            }
            case 'export-db-csv':
                this.exportDatabaseCSV();
                break;
            case 'trigger-import-db-csv':
                this.triggerImportDatabaseCSV();
                break;
            case 'magic-resize-current':
                this.magicResizeDocument(el.dataset.format);
                break;
        }
    }

    handleDelegatedInput(type, el) {
        switch (type) {
            case 'face-bg-color':
                this.updateFaceBgColor(el.value, true);
                break;
            case 'face-name':
                this.updateFaceName(el.value, true);
                break;
            case 'obj-prop':
                this.handleInspectorPropEvent(el, true);
                break;
            case 'inline-dish-field':
                this.updateInlineDishFromInspector(el.dataset.dishId, el.dataset.field, el.value, true);
                break;
            case 'db-search':
                this.renderDatabaseTable();
                break;
            case 'fold-angle':
                this.update3DFoldAngle(el.value);
                break;
            case 'word-raw':
                this.parseWordRawTextDebounced();
                break;
            case 'search-templates':
                this.searchTemplates(el.value);
                break;
            case 'search-illustrations':
                this.searchIllustrations(el.value);
                if (el.dataset.refreshMobile === 'true') this.renderMobileCanvaSheet();
                break;
            case 'mobile-selected-prop':
                this.updateSelectedProp(el.dataset.prop, el.value, true);
                break;
            case 'grid-gutter':
                this.updateGridGutter(parseFloat(el.value), true);
                break;
        }
    }

    handleDelegatedChange(type, el, e) {
        switch (type) {
            case 'top-bar-transform':
                this.updateSelectedFromTopBar();
                break;
            case 'import-json':
                this.importProjectJSON(e);
                break;
            case 'toggle-snap':
                this.toggleSnap(el.checked);
                break;
            case 'zoom-select':
                this.setZoom(parseFloat(el.value));
                break;
            case 'db-filter-cat':
                this.renderDatabaseTable();
                break;
            case 'word-file-upload':
                this.handleWordFileUpload(e);
                break;
            case 'word-import-mode':
                this.updateWordModeCardsUI();
                break;
            case 'pgnum-format':
                this.updatePageNumberingPreview();
                break;
            case 'face-bg-color':
                this.updateFaceBgColor(el.value, false);
                break;
            case 'face-name':
                this.updateFaceName(el.value, false);
                break;
            case 'obj-prop':
                this.handleInspectorPropEvent(el, false);
                break;
            case 'inline-dish-field':
                this.updateInlineDishFromInspector(el.dataset.dishId, el.dataset.field, el.value, false);
                break;
            case 'category-slice':
                this.updateCategorySlice(el.dataset.bound, el.value);
                break;
            case 'upload-photo':
                this.uploadPhotoFile(e);
                break;
            case 'db-dish-field': {
                const tr = el.closest('tr');
                if (tr) this.updateDishDB(tr.dataset.dishId, el.dataset.field, el.value);
                break;
            }
            case 'word-preview-field': {
                const row = el.closest('[data-item-id]');
                if (row) this.updateWordPreviewItem(row.dataset.itemId, el.dataset.field, el.value);
                break;
            }
            case 'mobile-selected-prop': {
                const val = el.dataset.valType === 'number' ? parseFloat(el.value) : el.value;
                this.updateSelectedProp(el.dataset.prop, val, false);
                break;
            }
            case 'exp-format-change':
                this.updateExportModalUI();
                break;
            case 'header-format-select':
                this.onHeaderFormatChange(el.value);
                break;
            case 'font-pairing-select':
                this.onFontPairingChange(el.value);
                break;
            case 'global-leader-style':
                this.updateGlobalTypography('leaderStyle', el.value);
                break;
            case 'global-show-currency':
                this.updateGlobalTypography('showCurrency', el.checked);
                break;
            case 'grid-gutter':
                this.updateGridGutter(parseFloat(el.value), false);
                break;
            case 'import-db-csv':
                this.importDatabaseCSV(e);
                break;
        }
    }

    handleInspectorPropEvent(el, isLiveInput) {
        const prop = el.dataset.prop;
        if (!prop) return;
        let val;
        const valType = el.dataset.valType;
        if (valType === 'number') {
            val = parseFloat(el.value);
        } else if (valType === 'opacity-pct') {
            val = Math.max(0.05, Math.min(1, parseFloat(el.value) / 100));
        } else if (valType === 'transparent-toggle') {
            val = el.checked ? 'transparent' : (el.dataset.fallbackColor || '#ffffff');
        } else {
            val = el.value;
        }
        this.updateObjProp(prop, val, isLiveInput);
        if (!isLiveInput && el.dataset.refreshInspector === 'true') {
            this.renderInspector();
        }
    }

    commitState(skipRender = false) {
        clearTimeout(this.debounceSaveTimer);
        this.debounceSaveTimer = null;
        const saved = this.engine.saveState(this.currentFaceIndex);
        this.updateAutoSaveUI(saved);
        this.updateUndoRedoButtons();
        if (this.activeFileName) {
            this.updateDiskSyncUI(false);
        }
        if (!skipRender) {
            this.renderCurrentFace();
        }
    }

    commitStateDebounced() {
        clearTimeout(this.debounceSaveTimer);
        this.debounceSaveTimer = setTimeout(() => {
            this.debounceSaveTimer = null;
            const saved = this.engine.saveState(this.currentFaceIndex);
            this.updateAutoSaveUI(saved);
            this.updateUndoRedoButtons();
            if (this.activeFileName) {
                this.updateDiskSyncUI(false);
            }
        }, 400);
    }

    /**
     * Enregistre immédiatement une modification encore en attente de debounce.
     * Indispensable avant Undo/Redo (sinon l'annulation saute une étape et perd la saisie)
     * et avant fermeture de l'onglet (sinon les 400 dernières ms sont perdues).
     */
    flushPendingSave() {
        if (!this.debounceSaveTimer) return;
        clearTimeout(this.debounceSaveTimer);
        this.debounceSaveTimer = null;
        const saved = this.engine.saveState(this.currentFaceIndex);
        this.updateAutoSaveUI(saved);
        this.updateUndoRedoButtons();
    }

    updateAutoSaveUI(ok) {
        const statusEl = document.getElementById('autosave-status');
        const dotEl = document.getElementById('autosave-dot');
        const textEl = document.getElementById('autosave-text');
        if (!statusEl || !dotEl || !textEl) return;
        if (ok) {
            statusEl.className = 'flex items-center text-emerald-400 font-mono';
            dotEl.className = 'w-2 h-2 rounded-full bg-emerald-400 mr-1.5 animate-pulse';
            textEl.textContent = 'Auto-Save OK';
        } else {
            statusEl.className = 'flex items-center text-amber-400 font-mono';
            dotEl.className = 'w-2 h-2 rounded-full bg-amber-400 mr-1.5';
            textEl.textContent = 'Stockage local saturé (Export JSON conseillé)';
        }
    }

    // Convert mm to screen canvas pixels (at 100% unscaled DOM layer)
    mmToPx(mm) {
        return mm * this.basePxPerMm;
    }

    pxToMm(px) {
        return +(px / this.basePxPerMm).toFixed(1);
    }

    get currentFace() {
        return this.engine.faces[this.currentFaceIndex];
    }

    get selectedObject() {
        if (!this.selectedObjectId || !this.currentFace) return null;
        return this.currentFace.objects.find(o => o.id === this.selectedObjectId) || null;
    }

    get selectedObjects() {
        if (!this.currentFace) return [];
        if (Array.isArray(this.selectedObjectIds) && this.selectedObjectIds.length > 0) {
            return this.currentFace.objects.filter(o => this.selectedObjectIds.includes(o.id));
        }
        if (this.selectedObjectId) {
            const single = this.currentFace.objects.find(o => o.id === this.selectedObjectId);
            return single ? [single] : [];
        }
        return [];
    }

    undo() {
        this.flushPendingSave();
        const restoredIdx = this.engine.undo();
        if (restoredIdx !== null && restoredIdx !== false) {
            if (typeof restoredIdx === 'number' && restoredIdx >= 0 && restoredIdx < this.engine.faces.length) {
                this.currentFaceIndex = restoredIdx;
            }
            this.selectedObjectId = null;
            this.selectedObjectIds = [];
            this.populateQuickDishSelect();
            this.updateFormatHeaderUI();
            this.renderCurrentFace();
            this.renderInspector();
            this.updateUndoRedoButtons();
            this.updateAutoSaveUI(this.engine.lastSaveSuccess);
            this.showToast('Action annulée (Ctrl+Z)');
        }
    }

    redo() {
        this.flushPendingSave();
        const restoredIdx = this.engine.redo();
        if (restoredIdx !== null && restoredIdx !== false) {
            if (typeof restoredIdx === 'number' && restoredIdx >= 0 && restoredIdx < this.engine.faces.length) {
                this.currentFaceIndex = restoredIdx;
            }
            this.selectedObjectId = null;
            this.selectedObjectIds = [];
            this.populateQuickDishSelect();
            this.updateFormatHeaderUI();
            this.renderCurrentFace();
            this.renderInspector();
            this.updateUndoRedoButtons();
            this.updateAutoSaveUI(this.engine.lastSaveSuccess);
            this.showToast('Action rétablie (Ctrl+Y)');
        }
    }

    updateUndoRedoButtons() {
        const undoBtn = document.getElementById('btn-undo');
        const redoBtn = document.getElementById('btn-redo');
        if (undoBtn) undoBtn.disabled = this.engine.history.length <= 1;
        if (redoBtn) redoBtn.disabled = this.engine.redoStack.length === 0;
    }

    isAnyModalOpen() {
        const modalIds = [
            'modal-database', 'modal-export', 'modal-3d', 'modal-engine',
            'modal-word-import', 'modal-format', 'modal-page-numbering', 'modal-templates'
        ];
        return modalIds.some(id => {
            const el = document.getElementById(id);
            return el && !el.classList.contains('hidden');
        });
    }

    closeTopModal() {
        if (this.closeMobileSheets()) {
            return true;
        }
        const modalTemplates = document.getElementById('modal-templates');
        if (modalTemplates && !modalTemplates.classList.contains('hidden')) {
            this.closeTemplatesModal();
            return true;
        }
        const modalFormat = document.getElementById('modal-format');
        if (modalFormat && !modalFormat.classList.contains('hidden')) {
            this.closeFormatModal();
            return true;
        }
        const modalPageNum = document.getElementById('modal-page-numbering');
        if (modalPageNum && !modalPageNum.classList.contains('hidden')) {
            this.closePageNumberingModal();
            return true;
        }
        const modalWord = document.getElementById('modal-word-import');
        if (modalWord && !modalWord.classList.contains('hidden')) {
            this.closeWordImportModal();
            return true;
        }
        const modalEngine = document.getElementById('modal-engine');
        if (modalEngine && !modalEngine.classList.contains('hidden')) {
            this.closeEngineInspector();
            return true;
        }
        const modal3d = document.getElementById('modal-3d');
        if (modal3d && !modal3d.classList.contains('hidden')) {
            this.close3DFoldModal();
            return true;
        }
        const modalExport = document.getElementById('modal-export');
        if (modalExport && !modalExport.classList.contains('hidden')) {
            this.closeExportModal();
            return true;
        }
        const modalDb = document.getElementById('modal-database');
        if (modalDb && !modalDb.classList.contains('hidden')) {
            this.closeDatabaseModal();
            return true;
        }
        return false;
    }

    bindGlobalShortcuts() {
        window.addEventListener('keydown', (e) => {
            const keyLower = e.key.toLowerCase();

            // Ctrl + S or Cmd + S: Save directly to Google Drive / Disk file
            if ((e.ctrlKey || e.metaKey) && keyLower === 's') {
                e.preventDefault();
                this.saveProjectToDisk(false);
                return;
            }

            if (e.key === 'Escape') {
                const ctxMenu = document.getElementById('canvas-context-menu');
                if (ctxMenu && !ctxMenu.classList.contains('hidden')) {
                    ctxMenu.classList.add('hidden');
                    e.preventDefault();
                    return;
                }
                if (this.closeTopModal()) {
                    e.preventDefault();
                    return;
                }
                if (this.selectedObjectId || (this.selectedObjectIds && this.selectedObjectIds.length > 0)) {
                    e.preventDefault();
                    this.selectObject(null);
                    return;
                }
            }

            if (this.isAnyModalOpen()) return;
            const activeEl = document.activeElement;
            const tag = activeEl ? activeEl.tagName : '';
            if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (activeEl && activeEl.isContentEditable)) return;

            if ((e.ctrlKey || e.metaKey) && keyLower === 'z') {
                e.preventDefault();
                if (e.shiftKey) {
                    this.redo();
                } else {
                    this.undo();
                }
            } else if ((e.ctrlKey || e.metaKey) && keyLower === 'y') {
                e.preventDefault();
                this.redo();
            } else if ((e.ctrlKey || e.metaKey) && keyLower === 'g') {
                e.preventDefault();
                if (e.shiftKey) {
                    this.ungroupSelectedObjects();
                } else {
                    this.groupSelectedObjects();
                }
            } else if ((e.ctrlKey || e.metaKey) && keyLower === 'c') {
                if (this.selectedObjects.length > 0) {
                    e.preventDefault();
                    this.copySelectedObjects();
                }
            } else if ((e.ctrlKey || e.metaKey) && keyLower === 'v') {
                if (this.clipboardObjects && this.clipboardObjects.length > 0) {
                    e.preventDefault();
                    this.pasteClipboardObjects();
                }
            } else if ((e.ctrlKey || e.metaKey) && keyLower === 'd') {
                if (this.selectedObjects.length > 0) {
                    e.preventDefault();
                    this.duplicateSelected();
                }
            } else if (e.key === 'Delete' || e.key === 'Backspace') {
                if ((this.selectedObjectId || this.selectedObjectIds.length > 0) && !this.previewMode) {
                    e.preventDefault();
                    this.deleteSelected();
                }
            } else if (keyLower === 'w' && !e.ctrlKey && !e.metaKey && !e.altKey) {
                e.preventDefault();
                this.togglePreviewMode();
            } else if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
                const selected = this.selectedObjects.filter(o => !o.locked);
                if (selected.length > 0 && !this.previewMode) {
                    e.preventDefault();
                    const step = e.shiftKey ? 2.0 : 0.5;
                    selected.forEach(obj => {
                        if (e.key === 'ArrowLeft') obj.x = +(obj.x - step).toFixed(1);
                        else if (e.key === 'ArrowRight') obj.x = +(obj.x + step).toFixed(1);
                        else if (e.key === 'ArrowUp') obj.y = +(obj.y - step).toFixed(1);
                        else if (e.key === 'ArrowDown') obj.y = +(obj.y + step).toFixed(1);
                    });
                    this.commitState(false);
                    this.renderInspector();
                }
            }
        });
    }

    showToast(msg) {
        const toast = document.getElementById('toast');
        const toastMsg = document.getElementById('toast-msg');
        if (toastMsg) toastMsg.textContent = msg;
        if (toast) {
            toast.classList.remove('translate-y-20', 'opacity-0');
            clearTimeout(this.toastTimer);
            this.toastTimer = setTimeout(() => {
                toast.classList.add('translate-y-20', 'opacity-0');
            }, 2600);
        }
    }
}
