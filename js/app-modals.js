/**
 * MODULE 2E: Formats, InDesign Templates, Page Numbering, 3D Fold, Engine Inspector & Mobile Sheets (app-modals.js)
 */
Object.assign(InMenuStudioApp.prototype, {
    // ==================== TEMPLATES & 3D FOLD ====================
    applySpreadTemplate(tplName) {
        const normalized = tplName === 'cover_spread' ? 'cover_back' : tplName;
        if (normalized === 'cover_back') {
            this.engine.populateSampleSpread1Recto(this.currentFace);
        } else if (normalized === 'brunch_spread') {
            this.engine.populateSampleSpread1Verso(this.currentFace);
        } else if (normalized === 'bistro_spread') {
            this.engine.populateSampleSpread2Recto(this.currentFace);
        } else if (normalized === 'flyer_promo_a4') {
            this.buildFlyerPromoA4Template(this.currentFace);
            return;
        } else {
            return;
        }
        // Les gabarits utilisent des IDs fixes : on les régénère pour éviter des doublons
        // si le même gabarit est appliqué sur plusieurs faces.
        this.currentFace.objects.forEach(o => { o.id = generateUniqueId('tpl'); });
        this.selectedObjectId = null;
        this.commitState(false);
        this.renderInspector();
        this.showToast(`Gabarit appliqué sur ${this.currentFace.name}`);
    },

    buildFlyerPromoA4Template(face) {
        if (!face) return;
        face.bgColor = '#0f172a';
        face.objects = [
            {
                id: generateUniqueId('flyer_bg_accent'),
                type: 'shape',
                shapeType: 'rectangle',
                x: 0,
                y: 0,
                w: 210,
                h: 85,
                bgColor: '#1e293b',
                borderColor: '#f59e0b',
                borderWidth: 0,
                locked: true
            },
            {
                id: generateUniqueId('flyer_badge'),
                type: 'text',
                text: '★ OFFRE SPÉCIALE RESTAURANT ★',
                content: '★ OFFRE SPÉCIALE RESTAURANT ★',
                x: 35,
                y: 18,
                w: 140,
                h: 10,
                fontFamily: 'Montserrat',
                fontSize: 10,
                fontSizePt: 10,
                fontWeight: '700',
                fontStyle: 'normal',
                align: 'center',
                textAlign: 'center',
                color: '#f59e0b',
                locked: false
            },
            {
                id: generateUniqueId('flyer_title'),
                type: 'text',
                text: 'LE MENU DÉCOUVERTE',
                content: 'LE MENU DÉCOUVERTE',
                x: 20,
                y: 30,
                w: 170,
                h: 22,
                fontFamily: 'Cinzel',
                fontSize: 26,
                fontSizePt: 26,
                fontWeight: '800',
                fontStyle: 'normal',
                align: 'center',
                textAlign: 'center',
                color: '#ffffff',
                locked: false
            },
            {
                id: generateUniqueId('flyer_subtitle'),
                type: 'text',
                text: 'Une expérience gastronomique inoubliable au cœur de la ville',
                content: 'Une expérience gastronomique inoubliable au cœur de la ville',
                x: 25,
                y: 56,
                w: 160,
                h: 12,
                fontFamily: 'Cormorant Garamond',
                fontSize: 13,
                fontSizePt: 13,
                fontWeight: '500',
                fontStyle: 'italic',
                align: 'center',
                textAlign: 'center',
                color: '#cbd5e1',
                locked: false
            },
            {
                id: generateUniqueId('flyer_separator'),
                type: 'illustration',
                illustrationId: 'sep_vintage_floral',
                title: 'Séparateur Floral',
                x: 65,
                y: 72,
                w: 80,
                h: 8,
                color: '#f59e0b',
                opacity: 1,
                locked: false
            },
            {
                id: generateUniqueId('flyer_price_box'),
                type: 'shape',
                shapeType: 'rounded_rect',
                x: 60,
                y: 245,
                w: 90,
                h: 30,
                bgColor: '#f59e0b',
                borderColor: '#ffffff',
                borderWidth: 1,
                locked: false
            },
            {
                id: generateUniqueId('flyer_price_text'),
                type: 'text',
                text: 'FORMULE COMPLÈTE : 28 €',
                content: 'FORMULE COMPLÈTE : 28 €',
                x: 60,
                y: 253,
                w: 90,
                h: 14,
                fontFamily: 'Montserrat',
                fontSize: 13,
                fontSizePt: 13,
                fontWeight: '800',
                align: 'center',
                textAlign: 'center',
                color: '#0f172a',
                locked: false
            }
        ];

        this.selectedObjectId = null;
        this.commitState();
        this.renderCurrentFace();
        this.renderInspector();
        this.showToast('Gabarit Flyer Promotionnel A4 appliqué !');
    },

    async open3DFoldModal() {
        const modal = document.getElementById('modal-3d');
        if (modal) modal.classList.remove('hidden');
        const leftPanel = document.getElementById('fold-panel-left');
        const rightPanel = document.getElementById('fold-panel-right');
        if (!leftPanel || !rightPanel) return;
        leftPanel.innerHTML = '<div class="text-xs text-gray-400 p-4">Rendu 3D...</div>';
        rightPanel.innerHTML = '';

        try {
            const { canvas } = await this.exporter.renderFaceToCanvas(this.currentFace, {
                includeBleed: false,
                includeCropMarks: false,
                scalePxPerMm: 3
            });

            const halfW = canvas.width / 2;
            const fullH = canvas.height;

            const cLeft = document.createElement('canvas');
            cLeft.width = halfW; cLeft.height = fullH;
            cLeft.getContext('2d').drawImage(canvas, 0, 0, halfW, fullH, 0, 0, halfW, fullH);
            cLeft.style.height = '68vh';
            cLeft.style.width = 'auto';

            const cRight = document.createElement('canvas');
            cRight.width = halfW; cRight.height = fullH;
            cRight.getContext('2d').drawImage(canvas, halfW, 0, halfW, fullH, 0, 0, halfW, fullH);
            cRight.style.height = '68vh';
            cRight.style.width = 'auto';

            canvas.width = 0;
            canvas.height = 0;

            leftPanel.innerHTML = '';
            rightPanel.innerHTML = '';
            leftPanel.appendChild(cLeft);
            rightPanel.appendChild(cRight);

            const slider = document.getElementById('fold-angle-slider');
            if (slider) {
                this.update3DFoldAngle(slider.value);
            }
        } catch (err) {
            console.error(err);
            this.showToast('Erreur lors du rendu de la simulation 3D');
        }
    },

    update3DFoldAngle(deg) {
        const leftPanel = document.getElementById('fold-panel-left');
        const rightPanel = document.getElementById('fold-panel-right');
        if (leftPanel) leftPanel.style.transform = `rotateY(${deg}deg)`;
        if (rightPanel) rightPanel.style.transform = `rotateY(-${deg}deg)`;
    },

    close3DFoldModal() {
        const modal = document.getElementById('modal-3d');
        if (modal) modal.classList.add('hidden');
    },

    // ==================== ENGINE.JS ARCHITECTURE INSPECTOR ====================
    openEngineInspector() {
        const viewer = document.getElementById('engine-json-viewer');
        if (viewer) viewer.value = this.engine.toJSON();
        const modal = document.getElementById('modal-engine');
        if (modal) modal.classList.remove('hidden');
    },

    closeEngineInspector() {
        const modal = document.getElementById('modal-engine');
        if (modal) modal.classList.add('hidden');
    },

    async copyEngineJSON() {
        const textarea = document.getElementById('engine-json-viewer');
        if (!textarea) return;
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(textarea.value);
            } else {
                textarea.select();
                document.execCommand('copy');
            }
            this.showToast('JSON du DocumentEngine copié dans le presse-papiers !');
        } catch (err) {
            textarea.select();
            try {
                document.execCommand('copy');
                this.showToast('JSON du DocumentEngine copié dans le presse-papiers !');
            } catch (_) {
                this.showToast('Impossible de copier automatiquement dans le presse-papiers');
            }
        }
    },

    // ==========================================
    // FORMAT & GEOMETRY METHODS
    // ==========================================
    updateFormatHeaderUI() {
        const specs = this.engine.specs;
        const formatLabel = document.getElementById('header-format-label');
        if (formatLabel) {
            formatLabel.textContent = specs.name || `${specs.widthMm}×${specs.heightMm} mm`;
        }
        const formatLabelPill = document.getElementById('header-format-label-pill');
        if (formatLabelPill) {
            formatLabelPill.textContent = `${specs.widthMm}×${specs.heightMm}`;
        }
        const specsBanner = document.getElementById('left-specs-banner');
        if (specsBanner) {
            const foldText = specs.hasFold ? ` • Pli à ${specs.foldXMm} mm` : ' • Sans pli';
            specsBanner.textContent = `${specs.name} (${specs.widthMm}×${specs.heightMm} mm${foldText})`;
        }
        const pagesCount = document.getElementById('tab-pages-count');
        if (pagesCount) {
            pagesCount.textContent = this.engine.faces.length;
        }
        const pageNumLabel = document.getElementById('header-page-num-label');
        if (pageNumLabel) {
            pageNumLabel.textContent = this.engine.pageNumbering && this.engine.pageNumbering.enabled ? 'Folios: Actif' : 'Numérotation';
        }
        const headerFormatSelect = document.getElementById('header-format-select');
        if (headerFormatSelect) {
            headerFormatSelect.value = this.engine.currentFormat;
        }
        const headerFontPairingSelect = document.getElementById('header-font-pairing-select');
        if (headerFontPairingSelect) {
            headerFontPairingSelect.value = this.engine.fontPairing || 'bistrot_chic';
        }
    },

    onHeaderFormatChange(formatKey) {
        if (!formatKey) return;
        this.changeActiveFormat(formatKey);
    },

    magicResizeDocument(formatKey) {
        const target = formatKey || this.engine.currentFormat;
        const ok = this.engine.magicResize(target);
        if (ok) {
            this.setupGeometryDOM();
            this.renderCurrentFace();
            this.renderInspector();
            this.renderSpreadsNavigator();
            this.updateFormatHeaderUI();
            this.closeFormatModal();
            this.showToast(`Magic Resize appliqué avec succès vers le format ${this.engine.specs.name} !`);
        }
    },

    openFormatModal() {
        const modal = document.getElementById('modal-format');
        if (modal) {
            this.renderFormatModalCards();
            modal.classList.remove('hidden');
        }
    },

    closeFormatModal() {
        const modal = document.getElementById('modal-format');
        if (modal) modal.classList.add('hidden');
    },

    renderFormatModalCards() {
        const container = document.getElementById('format-modal-cards');
        if (!container) return;
        const presets = window.FORMAT_PRESETS || (typeof FORMAT_PRESETS !== 'undefined' ? FORMAT_PRESETS : {});
        const currentId = this.engine.specs.id || this.engine.currentFormat;

        container.innerHTML = Object.keys(presets).map(key => {
            const p = presets[key];
            const isCurrent = (p.id === currentId || key === currentId);
            return `
                <div class="p-3.5 rounded-lg border transition ${
                    isCurrent
                        ? 'border-cyan-400 bg-cyan-500/15 ring-2 ring-cyan-400/50 shadow-lg'
                        : 'border-idBorder bg-idInput hover:border-gray-500 hover:bg-white/5'
                }">
                    <div class="flex items-center justify-between mb-1.5 cursor-pointer" data-action="change-active-format" data-format="${escapeHTML(key)}">
                        <span class="font-bold text-white text-xs flex items-center space-x-1.5">
                            <i class="fa-solid ${p.category === 'social' ? 'fa-mobile-screen text-pink-400' : (p.category === 'flyer' ? 'fa-file-lines text-amber-400' : 'fa-book-open text-cyan-400')}"></i>
                            <span>${escapeHTML(p.name)}</span>
                        </span>
                        <span class="text-[9px] px-1.5 py-0.5 rounded font-mono ${
                            isCurrent ? 'bg-cyan-500 text-black font-bold' : 'bg-white/10 text-gray-300'
                        }">${escapeHTML(p.badge || 'Format')}</span>
                    </div>
                    <p class="text-[11px] text-gray-400 mb-2 leading-relaxed cursor-pointer" data-action="change-active-format" data-format="${escapeHTML(key)}">${escapeHTML(p.sub || '')}</p>
                    <div class="flex items-center justify-between text-[10px] font-mono text-gray-400 pt-1.5 border-t border-white/5">
                        <span>${p.widthMm} × ${p.heightMm} mm</span>
                        <span>${p.hasFold ? `Pli à ${p.foldXMm} mm` : 'Sans pli'}</span>
                        <span>Fond perdu +${p.bleedMm} mm</span>
                    </div>
                    <div class="grid grid-cols-2 gap-1.5 mt-2.5">
                        <button type="button" data-action="change-active-format" data-format="${escapeHTML(key)}" class="py-1 px-2 rounded text-[10px] font-bold border ${isCurrent ? 'bg-cyan-500 text-black border-cyan-400' : 'bg-idPanel text-gray-200 border-idBorder hover:bg-white/10'}">
                            ${isCurrent ? '✓ Format Actif' : 'Choisir Format'}
                        </button>
                        <button type="button" data-action="magic-resize-current" data-format="${escapeHTML(key)}" class="py-1 px-2 rounded text-[10px] font-bold bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40" title="Adapter proportionnellement les éléments vers ce format">
                            <i class="fa-solid fa-wand-magic-sparkles mr-1 text-purple-300"></i>Magic Resize
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    },

    changeActiveFormat(formatKey) {
        if (this.engine.currentFormat === formatKey && this.engine.specs.id === formatKey) {
            this.closeFormatModal();
            return;
        }
        const ok = this.engine.setFormat(formatKey, false);
        if (ok) {
            this.setupGeometryDOM();
            this.renderCurrentFace();
            this.renderInspector();
            this.renderSpreadsNavigator();
            this.updateFormatHeaderUI();
            this.closeFormatModal();
            this.showToast(`Format basculé sur : ${this.engine.specs.name}`);
        }
    },

    // ==========================================
    // BANQUE DE GABARITS & MODÈLES INDESIGN
    // ==========================================
    openTemplatesModal() {
        const modal = document.getElementById('modal-templates');
        if (!modal) return;
        this.renderTemplatesModalCategories();
        this.renderTemplatesModalCards();
        modal.classList.remove('hidden');
    },

    closeTemplatesModal() {
        const modal = document.getElementById('modal-templates');
        if (modal) modal.classList.add('hidden');
    },

    renderTemplatesModalCategories() {
        const container = document.getElementById('templates-category-filters');
        if (!container) return;
        const bank = window.InDesignTemplatesBank || (typeof InDesignTemplatesBank !== 'undefined' ? InDesignTemplatesBank : null);
        if (!bank) return;
        const activeCat = this.activeTemplateCategory || 'all';

        container.innerHTML = bank.categories.map(cat => `
            <button type="button" data-action="filter-templates" data-cat="${escapeHTML(cat.id)}" class="px-3 py-1 rounded-full text-[11px] whitespace-nowrap font-medium transition flex items-center space-x-1.5 ${
                activeCat === cat.id
                    ? 'bg-purple-600 text-white font-bold shadow'
                    : 'bg-idInput text-gray-300 hover:bg-white/10 hover:text-white'
            }">
                <i class="fa-solid ${cat.icon} text-[10px]"></i>
                <span>${escapeHTML(cat.name)}</span>
            </button>
        `).join('');
    },

    renderTemplatesModalCards() {
        const container = document.getElementById('templates-modal-grid');
        if (!container) return;
        const bank = window.InDesignTemplatesBank || (typeof InDesignTemplatesBank !== 'undefined' ? InDesignTemplatesBank : null);
        if (!bank) {
            container.innerHTML = '<div class="p-4 text-center text-gray-400">Banque de gabarits en cours de chargement...</div>';
            return;
        }

        const activeCat = this.activeTemplateCategory || 'all';
        const query = this.templatesSearchQuery || '';
        const templates = bank.filter(activeCat, query);

        if (templates.length === 0) {
            container.innerHTML = `
                <div class="p-8 text-center text-gray-400 space-y-2">
                    <i class="fa-solid fa-shapes text-3xl text-gray-600"></i>
                    <div class="text-xs">Aucun gabarit trouvé pour votre recherche.</div>
                    <button type="button" data-action="reset-templates-filter" class="text-xs text-purple-400 hover:underline">Réinitialiser les filtres</button>
                </div>
            `;
            return;
        }

        const presets = window.FORMAT_PRESETS || (typeof FORMAT_PRESETS !== 'undefined' ? FORMAT_PRESETS : {});

        container.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                ${templates.map(tpl => {
                    const p = presets[tpl.format] || {};
                    const colorSwatches = (tpl.colors || []).map(c => `
                        <span class="w-3.5 h-3.5 rounded-full border border-white/20 inline-block shadow-sm" style="background-color: ${c};" title="${c}"></span>
                    `).join('');

                    return `
                        <div class="bg-idInput/90 border border-idBorder hover:border-purple-500/60 rounded-xl p-4 flex flex-col justify-between transition group shadow-md hover:shadow-xl">
                            <div>
                                <div class="flex items-start justify-between gap-2 mb-2">
                                    <div class="flex items-center space-x-2.5">
                                        <div class="w-8 h-8 rounded-lg bg-purple-500/15 border border-purple-500/30 text-purple-300 flex items-center justify-center shrink-0">
                                            <i class="fa-solid ${tpl.icon || 'fa-shapes'} text-sm"></i>
                                        </div>
                                        <div>
                                            <h3 class="font-bold text-white text-xs group-hover:text-purple-300 transition">${escapeHTML(tpl.name)}</h3>
                                            <div class="text-[10px] text-gray-400 font-mono flex items-center space-x-1.5 mt-0.5">
                                                <span>${p.widthMm || '340'} × ${p.heightMm || '300'} mm</span>
                                                <span>•</span>
                                                <span>${p.hasFold ? 'Plié 2 volets' : 'Page simple'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <span class="text-[9px] px-2 py-0.5 rounded-full font-semibold border shrink-0 ${tpl.badgeColor || 'bg-white/10 text-gray-300 border-white/10'}">
                                        ${escapeHTML(tpl.badge || 'Gabarit')}
                                    </span>
                                </div>

                                <p class="text-[11px] text-gray-300/90 leading-relaxed mb-3">
                                    ${escapeHTML(tpl.subtitle || '')}
                                </p>

                                <div class="flex items-center justify-between text-[10px] text-gray-400 py-1.5 border-t border-idBorder/50 mb-3">
                                    <span class="flex items-center space-x-1.5">
                                        <span>Palette :</span>
                                        <span class="flex items-center space-x-1">${colorSwatches}</span>
                                    </span>
                                    <span class="font-mono text-cyan-400 text-[9px]">${tpl.format}</span>
                                </div>
                            </div>

                            <div class="grid grid-cols-2 gap-2 pt-2 border-t border-idBorder/50">
                                <button type="button" data-action="start-project-template" data-tpl-id="${escapeHTML(tpl.id)}"
                                        class="py-2 px-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-[11px] shadow flex items-center justify-center space-x-1.5 transition active:scale-95">
                                    <i class="fa-solid fa-file-circle-plus"></i>
                                    <span>Nouveau Projet</span>
                                </button>
                                <button type="button" data-action="apply-template-page" data-tpl-id="${escapeHTML(tpl.id)}"
                                        class="py-2 px-2.5 rounded-lg bg-idHeader hover:bg-white/10 border border-idBorder hover:border-gray-400 text-gray-200 font-semibold text-[11px] flex items-center justify-center space-x-1.5 transition active:scale-95">
                                    <i class="fa-solid fa-copy text-pink-400"></i>
                                    <span>Sur cette page</span>
                                </button>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    },

    filterTemplates(cat) {
        this.activeTemplateCategory = cat;
        this.renderTemplatesModalCategories();
        this.renderTemplatesModalCards();
    },

    searchTemplates(query) {
        this.templatesSearchQuery = query;
        const input = document.getElementById('templates-search-input');
        if (input && input.value !== query) input.value = query;
        this.renderTemplatesModalCards();
    },

    startProjectFromTemplate(tplId) {
        const bank = window.InDesignTemplatesBank || (typeof InDesignTemplatesBank !== 'undefined' ? InDesignTemplatesBank : null);
        if (!bank) return;
        const tpl = bank.getById(tplId);
        if (!tpl) return;

        const hasObjects = this.engine.faces.some(f => f.objects && f.objects.length > 0);
        if (hasObjects) {
            const confirmMsg = `Démarrer un nouveau projet à partir du modèle « ${tpl.name} » ?\n(Les modifications actuelles non enregistrées seront remplacées).`;
            if (!window.confirm(confirmMsg)) {
                return;
            }
        }

        this.engine.currentFace = this.currentFace;
        tpl.builder(this.engine, 'new_project');
        if (typeof bank.normalizeEngineFaces === 'function') {
            bank.normalizeEngineFaces(this.engine);
        }
        this.currentFaceIndex = 0;
        this.selectedObjectId = null;
        this.setupGeometryDOM();
        this.renderCurrentFace();
        this.renderInspector();
        this.renderSpreadsNavigator();
        this.updateFormatHeaderUI();
        this.commitState(false);
        this.closeTemplatesModal();
        this.showToast(`Nouveau projet « ${tpl.name} » initialisé avec succès !`);
    },

    applyTemplateToActivePage(tplId) {
        const bank = window.InDesignTemplatesBank || (typeof InDesignTemplatesBank !== 'undefined' ? InDesignTemplatesBank : null);
        if (!bank) return;
        const tpl = bank.getById(tplId);
        if (!tpl) return;

        this.engine.currentFace = this.currentFace;
        tpl.builder(this.engine, 'single_face');
        if (typeof bank.normalizeFace === 'function') {
            bank.normalizeFace(this.currentFace);
        }
        this.selectedObjectId = null;
        this.renderCurrentFace();
        this.renderInspector();
        this.commitState();
        this.closeTemplatesModal();
        this.showToast(`Gabarit « ${tpl.name} » appliqué à ${this.currentFace.name} !`);
    },

    // ==========================================
    // AUTOMATED PAGE NUMBERING METHODS
    // ==========================================
    openPageNumberingModal() {
        const modal = document.getElementById('modal-page-numbering');
        if (!modal) return;
        const pn = this.engine.pageNumbering || {};

        const elEnabled = document.getElementById('pgnum-enabled');
        const elFormat = document.getElementById('pgnum-format');
        const elPos = document.getElementById('pgnum-position');
        const elFont = document.getElementById('pgnum-font');
        const elSize = document.getElementById('pgnum-size');
        const elColor = document.getElementById('pgnum-color');
        const elMargin = document.getElementById('pgnum-margin');
        const elSkipCover = document.getElementById('pgnum-skip-cover');

        if (elEnabled) elEnabled.checked = !!pn.enabled;
        if (elFormat) elFormat.value = pn.format || 'page_n';
        if (elPos) elPos.value = pn.position || 'bottom_center';
        if (elFont) elFont.value = pn.fontFamily || 'Montserrat';
        if (elSize) elSize.value = pn.fontSizePt || 8.5;
        if (elColor) elColor.value = pn.color || '#64748b';
        if (elMargin) elMargin.value = pn.marginMm || 8;
        if (elSkipCover) elSkipCover.checked = pn.skipCover !== false;

        this.updatePageNumberingPreview();
        modal.classList.remove('hidden');
    },

    closePageNumberingModal() {
        const modal = document.getElementById('modal-page-numbering');
        if (modal) modal.classList.add('hidden');
    },

    updatePageNumberingPreview() {
        const elFormat = document.getElementById('pgnum-format');
        const previewEl = document.getElementById('pgnum-preview-text');
        if (!previewEl) return;
        const fmt = elFormat ? elFormat.value : 'page_n';
        let sample = 'Page 2';
        if (fmt === 'n_slash_total') sample = '2 / 10';
        else if (fmt === 'dash') sample = '— 2 —';
        else if (fmt === 'dot') sample = '• 2 •';
        else if (fmt === 'simple') sample = '2';
        else if (fmt === 'roman') sample = 'II';
        previewEl.textContent = sample;
    },

    savePageNumberingFromModal() {
        const elEnabled = document.getElementById('pgnum-enabled');
        const elFormat = document.getElementById('pgnum-format');
        const elPos = document.getElementById('pgnum-position');
        const elFont = document.getElementById('pgnum-font');
        const elSize = document.getElementById('pgnum-size');
        const elColor = document.getElementById('pgnum-color');
        const elMargin = document.getElementById('pgnum-margin');
        const elSkipCover = document.getElementById('pgnum-skip-cover');

        const opts = {
            enabled: elEnabled ? elEnabled.checked : false,
            format: elFormat ? elFormat.value : 'page_n',
            position: elPos ? elPos.value : 'bottom_center',
            fontFamily: elFont ? elFont.value : 'Montserrat',
            fontSizePt: elSize ? parseFloat(elSize.value) || 8.5 : 8.5,
            color: elColor ? elColor.value : '#64748b',
            marginMm: elMargin ? parseFloat(elMargin.value) || 8 : 8,
            skipCover: elSkipCover ? elSkipCover.checked : true
        };

        this.engine.setPageNumbering(opts);
        this.renderCanvasPageNumberOverlay();
        this.updateFormatHeaderUI();
        this.closePageNumberingModal();
        this.showToast(opts.enabled ? 'Numérotation automatique activée !' : 'Numérotation désactivée.');
    },

    // ==========================================
    // MOBILE BOTTOM SHEETS ARCHITECTURE
    // (Page principale / canevas est la pièce maîtresse)
    // ==========================================
    openMobileSheet(sheetName) {
        this.closeMobileSheets();
        const backdrop = document.getElementById('mobile-sheet-backdrop');
        if (backdrop) backdrop.classList.remove('hidden');

        if (sheetName === 'pages') {
            this.renderMobilePagesList();
            const el = document.getElementById('sheet-mobile-pages');
            if (el) el.classList.remove('hidden');
        } else if (sheetName === 'add') {
            const el = document.getElementById('sheet-mobile-add');
            if (el) el.classList.remove('hidden');
        } else if (sheetName === 'canva') {
            this.renderMobileCanvaSheet();
            const el = document.getElementById('sheet-mobile-canva');
            if (el) el.classList.remove('hidden');
        } else if (sheetName === 'inspector') {
            this.renderMobileInspector();
            const el = document.getElementById('sheet-mobile-inspector');
            if (el) el.classList.remove('hidden');
        }
    },

    closeMobileSheets() {
        let closedAny = false;
        const sheetIds = ['sheet-mobile-pages', 'sheet-mobile-add', 'sheet-mobile-canva', 'sheet-mobile-inspector', 'modal-mobile-tools'];
        sheetIds.forEach(id => {
            const el = document.getElementById(id);
            if (el && !el.classList.contains('hidden')) {
                el.classList.add('hidden');
                closedAny = true;
            }
        });
        const backdrop = document.getElementById('mobile-sheet-backdrop');
        if (backdrop) backdrop.classList.add('hidden');
        return closedAny;
    },

    toggleMobileToolsMenu() {
        const modal = document.getElementById('modal-mobile-tools');
        if (!modal) return;
        const isHidden = modal.classList.contains('hidden');
        this.closeMobileSheets();
        if (isHidden) {
            modal.classList.remove('hidden');
            const backdrop = document.getElementById('mobile-sheet-backdrop');
            if (backdrop) backdrop.classList.remove('hidden');
        }
    },

    closeMobileToolsMenu() {
        this.closeMobileSheets();
    },

    renderMobilePagesList() {
        const container = document.getElementById('mobile-pages-list');
        const countBadge = document.getElementById('mobile-pages-count');
        if (countBadge) countBadge.textContent = this.engine.faces.length;
        if (!container) return;

        const specs = this.engine.specs;
        let html = '';

        this.engine.faces.forEach((face, idx) => {
            const isCurrent = this.currentFaceIndex === idx;
            html += `
                <div data-action="go-to-face" data-index="${idx}" data-close-mobile="true" class="p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                    isCurrent ? 'border-cyan-400 bg-cyan-500/15 ring-2 ring-cyan-400/40 shadow-lg' : 'border-idBorder bg-idInput hover:border-gray-500'
                }">
                    <div class="flex items-center space-x-3 min-w-0">
                        <div class="w-9 h-11 rounded border border-black/50 shrink-0 shadow flex items-center justify-center text-xs font-bold font-mono ${
                            isCurrent ? 'bg-cyan-400 text-black' : 'bg-gray-800 text-gray-300'
                        }" style="background:${isCurrent ? '#22d3ee' : escapeHTML(face.bgColor || '#1c1c1f')}">
                            ${idx + 1}
                        </div>
                        <div class="min-w-0">
                            <div class="font-bold text-white text-xs truncate">${escapeHTML(face.name)}</div>
                            <div class="text-[10px] text-gray-400 font-mono">${face.objects.length} éléments • ${specs.widthMm}×${specs.heightMm}mm</div>
                        </div>
                    </div>
                    <div class="flex items-center space-x-1 shrink-0" data-action="noop">
                        <button type="button" data-action="duplicate-page" data-index="${idx}" data-refresh-mobile="true" class="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white text-xs" title="Dupliquer">
                            <i class="fa-regular fa-clone"></i>
                        </button>
                        ${this.engine.faces.length > 1 ? `
                        <button type="button" data-action="remove-page" data-index="${idx}" data-refresh-mobile="true" class="p-2 hover:bg-rose-500/20 rounded-lg text-gray-400 hover:text-rose-400 text-xs" title="Supprimer">
                            <i class="fa-regular fa-trash-can"></i>
                        </button>` : ''}
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    },

    renderMobileCanvaSheet() {
        const container = document.getElementById('mobile-canva-content');
        if (!container) return;

        const pack = window.InDesignIllustrationsPack || window.CanvaIllustrationsPack || (typeof InDesignIllustrationsPack !== 'undefined' ? InDesignIllustrationsPack : (typeof CanvaIllustrationsPack !== 'undefined' ? CanvaIllustrationsPack : null));
        if (!pack || !pack.items) {
            container.innerHTML = '<div class="p-4 text-center text-gray-400">Pack en cours de chargement...</div>';
            return;
        }

        const categories = pack.categories || [];
        const activeCat = this.activeIllustrationCategory || 'all';
        const query = (this.illustrationsSearchQuery || '').toLowerCase().trim();

        let filtered = pack.items;
        if (activeCat !== 'all') {
            filtered = filtered.filter(i => i.category === activeCat);
        }
        if (query) {
            filtered = filtered.filter(i =>
                i.name.toLowerCase().includes(query) ||
                (i.tags && i.tags.some(t => t.toLowerCase().includes(query)))
            );
        }

        container.innerHTML = `
            <div class="relative">
                <input type="text"
                       value="${escapeHTML(this.illustrationsSearchQuery || '')}"
                       data-input="search-illustrations" data-refresh-mobile="true"
                       placeholder="Rechercher (filet, losange, sceau, chef, café, vegan...)"
                       class="w-full bg-idInput border border-idBorder rounded-xl px-3 py-2.5 pl-8 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-pink-400">
                <i class="fa-solid fa-magnifying-glass absolute left-2.5 top-3 text-gray-400 text-xs"></i>
                ${query ? `
                    <button type="button" data-action="clear-illustrations-search" data-refresh-mobile="true" class="absolute right-2.5 top-2.5 text-gray-400 hover:text-white">
                        <i class="fa-solid fa-xmark text-xs"></i>
                    </button>
                ` : ''}
            </div>

            <div class="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-thin">
                ${categories.map(c => `
                    <button type="button" data-action="filter-illustrations" data-cat="${escapeHTML(c.id)}" data-refresh-mobile="true" class="px-2.5 py-1 rounded-full text-[10px] whitespace-nowrap font-medium transition flex items-center space-x-1 ${
                        activeCat === c.id
                            ? 'bg-pink-500 text-white font-bold shadow'
                            : 'bg-idInput text-gray-300 hover:bg-white/10'
                    }">
                        <i class="fa-solid ${c.icon} text-[9px]"></i>
                        <span>${escapeHTML(c.name.split(' ')[0])}</span>
                    </button>
                `).join('')}
            </div>

            <div class="text-[10px] text-gray-400 flex items-center justify-between px-1">
                <span>${filtered.length} illustrations disponibles</span>
                <span class="text-pink-400 font-semibold">1 tap pour insérer</span>
            </div>

            <div class="grid grid-cols-3 gap-2.5 max-h-[50vh] overflow-y-auto pr-1">
                ${filtered.map(item => `
                    <div data-action="add-illustration" data-id="${escapeHTML(item.id)}" data-close-mobile="true"
                         class="p-2.5 rounded-xl bg-idInput border border-idBorder hover:border-pink-400 active:scale-95 cursor-pointer flex flex-col items-center justify-between transition shadow-sm aspect-square">
                        <div class="w-full h-12 flex items-center justify-center p-1">
                            ${pack.buildSVGString(item, { color: item.defaultColor || '#c8a96a' })}
                        </div>
                        <span class="text-[9px] text-gray-300 font-medium text-center truncate w-full mt-1">
                            ${escapeHTML(item.name)}
                        </span>
                    </div>
                `).join('')}
            </div>
        `;
    },

    renderMobileInspector() {
        const container = document.getElementById('mobile-inspector-body');
        const badge = document.getElementById('mobile-prop-badge');
        if (!container) return;

        const obj = this.selectedObject;
        if (!obj) {
            if (badge) badge.textContent = 'Planche';
            container.innerHTML = `
                <div class="text-center py-6 text-gray-400 text-xs space-y-2">
                    <i class="fa-solid fa-arrow-pointer text-2xl text-blue-400 animate-bounce"></i>
                    <div class="font-bold text-white">Aucun élément sélectionné</div>
                    <p class="text-[11px] text-gray-400">Touchez un bloc, texte ou illustration sur le menu pour modifier sa taille, couleur ou police.</p>
                </div>
            `;
            return;
        }

        if (badge) badge.textContent = obj.type.toUpperCase();

        let html = `
            <div class="space-y-3 text-xs">
                <div class="flex items-center justify-between pb-2 border-b border-idBorder">
                    <span class="font-bold text-white">${escapeHTML(obj.name || obj.title || obj.type)}</span>
                    <button type="button" data-action="delete-selected" data-close-mobile="true" class="text-rose-400 hover:text-rose-300 font-semibold text-xs flex items-center space-x-1 px-2 py-1 bg-rose-500/15 rounded">
                        <i class="fa-solid fa-trash-can"></i>
                        <span>Supprimer</span>
                    </button>
                </div>
        `;

        if (obj.type === 'text' || obj.type === 'title_heading' || obj.type === 'category_header') {
            html += `
                <div>
                    <label class="text-gray-400 text-[11px] block mb-1">Contenu texte :</label>
                    <textarea rows="3" data-input="mobile-selected-prop" data-prop="text" class="w-full bg-idInput border border-idBorder rounded p-2 text-white text-xs">${escapeHTML(obj.text ?? obj.customName ?? obj.content ?? '')}</textarea>
                </div>
                <div class="grid grid-cols-2 gap-2">
                    <div>
                        <label class="text-gray-400 text-[11px] block mb-1">Taille (pt) :</label>
                        <input type="number" step="0.5" value="${obj.fontSize || obj.fontSizePt || 12}" data-change="mobile-selected-prop" data-prop="fontSize" data-val-type="number" class="w-full bg-idInput border border-idBorder rounded p-1.5 text-white">
                    </div>
                    <div>
                        <label class="text-gray-400 text-[11px] block mb-1">Couleur :</label>
                        <input type="color" value="${safeHex(obj.color, '#ffffff')}" data-change="mobile-selected-prop" data-prop="color" class="w-full h-8 bg-idInput border border-idBorder rounded cursor-pointer">
                    </div>
                </div>
            `;
        } else if (obj.type === 'dish_item') {
            const linkedDish = obj.dishId ? this.engine.getDishById(obj.dishId) : null;
            const currentName = linkedDish ? linkedDish.name : (obj.customName || '');
            const currentDesc = linkedDish ? (linkedDish.desc || '') : (obj.customDesc || '');
            const currentPrice = linkedDish ? (linkedDish.price || '') : (obj.customPrice || '');
            html += `
                <div class="space-y-2">
                    <div>
                        <label class="text-gray-400 text-[11px] block mb-1">Nom du plat :</label>
                        <input type="text" value="${escapeHTML(currentName)}" data-input="inline-dish-field" data-change="inline-dish-field" data-dish-id="${escapeHTML(obj.dishId || '')}" data-field="name" class="w-full bg-idInput border border-idBorder rounded p-2 text-white font-bold">
                    </div>
                    <div>
                        <label class="text-gray-400 text-[11px] block mb-1">Prix affiché :</label>
                        <input type="text" value="${escapeHTML(currentPrice)}" data-input="inline-dish-field" data-change="inline-dish-field" data-dish-id="${escapeHTML(obj.dishId || '')}" data-field="price" class="w-full bg-idInput border border-idBorder rounded p-2 text-emerald-400 font-mono font-bold">
                    </div>
                    <div>
                        <label class="text-gray-400 text-[11px] block mb-1">Description / Ingrédients :</label>
                        <input type="text" value="${escapeHTML(currentDesc)}" data-input="inline-dish-field" data-change="inline-dish-field" data-dish-id="${escapeHTML(obj.dishId || '')}" data-field="desc" class="w-full bg-idInput border border-idBorder rounded p-2 text-gray-300">
                    </div>
                </div>
            `;
        } else if (obj.type === 'category_list') {
            html += `
                <div class="space-y-2">
                    <div>
                        <label class="text-gray-400 text-[11px] block mb-1">Titre de la section :</label>
                        <input type="text" value="${escapeHTML(obj.title || '')}" data-input="mobile-selected-prop" data-prop="title" class="w-full bg-idInput border border-idBorder rounded p-2 text-white font-bold">
                    </div>
                </div>
            `;
        } else if (obj.type === 'vertical_banner' || obj.type === 'badge_new') {
            html += `
                <div>
                    <label class="text-gray-400 text-[11px] block mb-1">Texte :</label>
                    <input type="text" value="${escapeHTML(obj.text || '')}" data-input="mobile-selected-prop" data-prop="text" class="w-full bg-idInput border border-idBorder rounded p-2 text-white font-bold">
                </div>
            `;
        } else if (obj.type === 'logo') {
            html += `
                <div class="space-y-2">
                    <div>
                        <label class="text-gray-400 text-[11px] block mb-1">Nom de l'établissement :</label>
                        <input type="text" value="${escapeHTML(obj.title || '')}" data-input="mobile-selected-prop" data-prop="title" class="w-full bg-idInput border border-idBorder rounded p-2 text-white font-bold">
                    </div>
                    <div>
                        <label class="text-gray-400 text-[11px] block mb-1">Sous-titre :</label>
                        <input type="text" value="${escapeHTML(obj.subtitle || '')}" data-input="mobile-selected-prop" data-prop="subtitle" class="w-full bg-idInput border border-idBorder rounded p-2 text-gray-300">
                    </div>
                </div>
            `;
        } else if (obj.type === 'illustration') {
            html += `
                <div>
                    <label class="text-gray-400 text-[11px] block mb-1">Teinte de l'illustration :</label>
                    <input type="color" value="${safeHex(obj.color, '#c8a96a')}" data-change="mobile-selected-prop" data-prop="color" class="w-full h-9 bg-idInput border border-idBorder rounded cursor-pointer">
                </div>
            `;
        }

        html += `
                <div class="pt-2 border-t border-idBorder flex justify-end">
                    <button type="button" data-action="close-mobile-sheets" class="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold text-xs">
                        Terminer
                    </button>
                </div>
            </div>
        `;

        container.innerHTML = html;
    },

    // ==================== TEMPLATE EXTRACTOR MODAL (PHOTO & WEB) ====================
    openTemplateExtractorModal() {
        if (!this._extractorActiveTab) this._extractorActiveTab = 'photo';
        if (!this.extractorTargetMode) this.extractorTargetMode = 'active_spread';

        const currentDocFormat = (this.engine && this.engine.currentFormat) || 'menu_34x30';
        this.extractorTargetFormat = currentDocFormat;

        const modal = document.getElementById('modal-template-extractor');
        if (!modal) return;
        modal.classList.remove('hidden');

        this.updateExtractorFormat(this.extractorTargetFormat);

        // Initialiser avec le sample "bistrot" si aucun gabarit n'est encore analysé
        if (!this.currentExtractedTemplate) {
            this.loadExtractorDemoSample('bistrot');
        } else {
            this.renderExtractorPreviewWireframe();
        }
    },

    closeTemplateExtractorModal() {
        const modal = document.getElementById('modal-template-extractor');
        if (modal) modal.classList.add('hidden');
    },

    updateExtractorFormat(newFormat) {
        if (!newFormat) return;
        this.extractorTargetFormat = newFormat;

        // 1. Badge Format
        const badge = document.getElementById('extractor-format-badge');
        if (badge) {
            if (newFormat === 'menu_34x30') {
                badge.textContent = '340 × 300 mm (Pli 170 mm)';
            } else if (newFormat === 'flyer_a4_portrait') {
                badge.textContent = 'A4 Portrait (210 × 297 mm)';
            } else if (newFormat === 'flyer_a4_landscape') {
                badge.textContent = 'A4 Paysage (297 × 210 mm)';
            }
        }

        // 2. Radio synchronisé
        const radio = document.querySelector(`input[name="extractor-format-choice"][value="${newFormat}"]`);
        if (radio) radio.checked = true;

        // 3. Libellés de portée
        const labelSingle = document.getElementById('extractor-target-label-single');
        const labelAll = document.getElementById('extractor-target-label-all');
        if (labelSingle) {
            if (newFormat === 'menu_34x30') {
                labelSingle.textContent = 'Appliquer sur la planche active (Face courante)';
            } else if (newFormat === 'flyer_a4_portrait') {
                labelSingle.textContent = 'Appliquer sur la page A4 active (Page courante)';
            } else if (newFormat === 'flyer_a4_landscape') {
                labelSingle.textContent = 'Appliquer sur la page A4 paysage (Set de table)';
            }
        }
        if (labelAll) {
            if (newFormat === 'menu_34x30') {
                labelAll.textContent = 'Générer un thème complet sur les 5 planches (10 faces)';
            } else if (newFormat === 'flyer_a4_portrait') {
                labelAll.textContent = 'Générer les 2 pages du Flyer A4 (Recto / Verso)';
            } else if (newFormat === 'flyer_a4_landscape') {
                labelAll.textContent = 'Générer le Set de Table complet (3 colonnes)';
            }
        }

        // 4. Aspect-ratio du conteneur Wireframe
        const container = document.getElementById('extractor-wireframe-container');
        if (container) {
            if (newFormat === 'menu_34x30') {
                container.style.aspectRatio = '340 / 300';
            } else if (newFormat === 'flyer_a4_portrait') {
                container.style.aspectRatio = '210 / 297';
            } else if (newFormat === 'flyer_a4_landscape') {
                container.style.aspectRatio = '297 / 210';
            }
        }

        // 5. Régénérer le gabarit vierge avec la palette & typo existantes
        const pal = (this.currentExtractedTemplate && this.currentExtractedTemplate.palette) || TemplateExtractorEngine.getDefaultPalette('bistrot');
        const typo = (this.currentExtractedTemplate && this.currentExtractedTemplate.typography) || TemplateExtractorEngine.detectTypography('bistrot_chic');

        let rawLayout = this._lastExtractedRawLayout;
        if (!rawLayout) {
            rawLayout = TemplateExtractorEngine.getDefaultLayout('bistrot', newFormat);
        }
        this.currentExtractedTemplate = TemplateExtractorEngine.cleanToBlankTemplate(rawLayout, pal, typo, {
            format: newFormat,
            name: `Gabarit Vierge (${newFormat})`
        });

        this.renderExtractorPreviewWireframe();
    },

    switchExtractorTab(tabId) {
        this._extractorActiveTab = tabId;
        const btnPhoto = document.getElementById('extractor-btn-tab-photo');
        const btnWeb = document.getElementById('extractor-btn-tab-web');
        const tabPhoto = document.getElementById('extractor-tab-content-photo');
        const tabWeb = document.getElementById('extractor-tab-content-web');

        if (tabId === 'web') {
            btnPhoto?.classList.remove('bg-emerald-600', 'text-white', 'shadow');
            btnPhoto?.classList.add('text-gray-400', 'hover:text-white', 'hover:bg-white/5');
            btnWeb?.classList.add('bg-emerald-600', 'text-white', 'shadow');
            btnWeb?.classList.remove('text-gray-400', 'hover:text-white', 'hover:bg-white/5');
            tabPhoto?.classList.add('hidden');
            tabWeb?.classList.remove('hidden');
        } else {
            btnWeb?.classList.remove('bg-emerald-600', 'text-white', 'shadow');
            btnWeb?.classList.add('text-gray-400', 'hover:text-white', 'hover:bg-white/5');
            btnPhoto?.classList.add('bg-emerald-600', 'text-white', 'shadow');
            btnPhoto?.classList.remove('text-gray-400', 'hover:text-white', 'hover:bg-white/5');
            tabWeb?.classList.add('hidden');
            tabPhoto?.classList.remove('hidden');
        }
    },

    handleExtractorImageUpload(file) {
        if (!file) return;
        if (!file.type || !file.type.startsWith('image/')) {
            this.showToast('Veuillez sélectionner un fichier image valide (JPG, PNG, WebP)');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target.result;
            this.processExtractorImageSource(dataUrl, file.name);
        };
        reader.readAsDataURL(file);
    },

    loadExtractorDemoSample(sampleId = 'bistrot') {
        const formatId = this.extractorTargetFormat || 'menu_34x30';
        const sampleUrl = TemplateExtractorEngine.getDemoSampleSVG(sampleId, formatId);
        const nameMap = {
            bistrot: 'Menu Bistrot Chic',
            trattoria: 'Carte Trattoria Bella',
            lounge: 'Menu Gastro Lounge'
        };
        this.processExtractorImageSource(sampleUrl, nameMap[sampleId] || 'Exemple Démo');
    },

    processExtractorImageSource(imageSrc, sourceLabel = 'Image') {
        const formatId = this.extractorTargetFormat || 'menu_34x30';
        const thumbEl = document.getElementById('extractor-image-preview-thumb');
        if (thumbEl) {
            thumbEl.innerHTML = `<img src="${imageSrc}" alt="Aperçu source" class="w-full h-24 object-contain rounded bg-black/40 border border-idBorder">`;
        }
        const statusEl = document.getElementById('extractor-source-label');
        if (statusEl) {
            statusEl.textContent = sourceLabel;
        }

        const img = new Image();
        // Ne JAMAIS définir crossOrigin pour les data: ou blob: URLs (provoque une erreur CORS dans Chrome)
        if (typeof imageSrc === 'string' && /^https?:\/\//i.test(imageSrc)) {
            img.crossOrigin = 'anonymous';
        }

        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                const maxDim = 400;
                let w = img.naturalWidth || img.width || 400;
                let h = img.naturalHeight || img.height || 400;
                if (w > maxDim || h > maxDim) {
                    if (w > h) {
                        h = Math.round((h * maxDim) / w);
                        w = maxDim;
                    } else {
                        w = Math.round((w * maxDim) / h);
                        h = maxDim;
                    }
                }
                canvas.width = Math.max(10, w);
                canvas.height = Math.max(10, h);
                const ctx = canvas.getContext('2d', { willReadFrequently: true });
                ctx.drawImage(img, 0, 0, w, h);

                // 1. Extraction Palette
                const palette = TemplateExtractorEngine.extractPaletteFromCanvas(canvas);

                // 2. Détection Structure & Layout
                const rawLayout = TemplateExtractorEngine.detectLayoutFromCanvas(canvas, { format: formatId });
                this._lastExtractedRawLayout = rawLayout;

                // 3. Typographie associée
                const typo = TemplateExtractorEngine.detectTypography(palette.isDark ? 'luxury' : 'classic');

                // 4. Construction du gabarit vierge
                const blankTemplate = TemplateExtractorEngine.cleanToBlankTemplate(rawLayout, palette, typo, {
                    format: formatId,
                    name: `Gabarit Vierge (${sourceLabel})`
                });

                this.currentExtractedTemplate = blankTemplate;
                this.syncExtractorUIControls();
                this.renderExtractorPreviewWireframe();
                this.showToast(`Gabarit extrait depuis ${sourceLabel} !`);
            } catch (err) {
                console.warn('[TemplateExtractor] Canvas extraction fallback:', err);
                const palette = TemplateExtractorEngine.getDefaultPalette('bistrot');
                const rawLayout = TemplateExtractorEngine.getDefaultLayout('bistrot', formatId);
                this._lastExtractedRawLayout = rawLayout;
                const typo = TemplateExtractorEngine.detectTypography('bistrot_chic');
                this.currentExtractedTemplate = TemplateExtractorEngine.cleanToBlankTemplate(rawLayout, palette, typo, {
                    format: formatId,
                    name: `Gabarit Vierge (${sourceLabel})`
                });
                this.syncExtractorUIControls();
                this.renderExtractorPreviewWireframe();
                this.showToast(`Gabarit initialisé pour ${sourceLabel}`);
            }
        };

        img.onerror = (err) => {
            console.warn('[TemplateExtractor] Image load fallback:', err);
            const palette = TemplateExtractorEngine.getDefaultPalette('bistrot');
            const rawLayout = TemplateExtractorEngine.getDefaultLayout('bistrot', formatId);
            this._lastExtractedRawLayout = rawLayout;
            const typo = TemplateExtractorEngine.detectTypography('bistrot_chic');
            this.currentExtractedTemplate = TemplateExtractorEngine.cleanToBlankTemplate(rawLayout, palette, typo, {
                format: formatId,
                name: `Gabarit Vierge (${sourceLabel})`
            });
            this.syncExtractorUIControls();
            this.renderExtractorPreviewWireframe();
            this.showToast(`Image analysée : gabarit ${sourceLabel} prêt !`);
        };

        img.src = imageSrc;
    },

    analyzeExtractorWebsite() {
        const urlInput = document.getElementById('extractor-web-url');
        const presetSelect = document.getElementById('extractor-web-preset');
        const url = (urlInput && urlInput.value) || 'mon-restaurant.fr/carte';
        const preset = (presetSelect && presetSelect.value) || 'moderne';
        const formatId = this.extractorTargetFormat || 'menu_34x30';

        const webExt = TemplateExtractorEngine.simulateWebsiteExtraction(url, preset);
        const blankTemplate = TemplateExtractorEngine.cleanToBlankTemplate(
            { blocks: webExt.blocks },
            webExt.palette,
            webExt.typography,
            { format: formatId, name: `Gabarit Web : ${webExt.brandName}` }
        );

        this.currentExtractedTemplate = blankTemplate;
        const statusEl = document.getElementById('extractor-source-label');
        if (statusEl) statusEl.textContent = `Site Web : ${webExt.brandName}`;

        this.syncExtractorUIControls();
        this.renderExtractorPreviewWireframe();
        this.showToast(`Mise en page web extraite pour ${webExt.brandName} !`);
    },

    syncExtractorUIControls() {
        if (!this.currentExtractedTemplate) return;
        const pal = this.currentExtractedTemplate.palette;
        const typo = this.currentExtractedTemplate.typography;

        const colorKeys = ['background', 'primary', 'accent', 'text'];
        colorKeys.forEach(k => {
            const input = document.getElementById(`extractor-color-${k}`);
            const textEl = document.getElementById(`extractor-color-val-${k}`);
            if (input && pal[k]) input.value = pal[k];
            if (textEl && pal[k]) textEl.textContent = pal[k].toUpperCase();
        });

        const fontSelect = document.getElementById('extractor-font-pairing-select');
        if (fontSelect && typo && typo.id) {
            fontSelect.value = typo.id;
        }
        const typoLabel = document.getElementById('extractor-typo-label');
        if (typoLabel && typo) {
            typoLabel.textContent = `${typo.headingFont} + ${typo.bodyFont} + ${typo.priceFont}`;
        }
    },

    updateExtractorPaletteColor(colorKey, hex) {
        if (!this.currentExtractedTemplate || !colorKey || !hex) return;
        this.currentExtractedTemplate.palette[colorKey] = hex;

        const textEl = document.getElementById(`extractor-color-val-${colorKey}`);
        if (textEl) textEl.textContent = hex.toUpperCase();

        const pal = this.currentExtractedTemplate.palette;
        const objs = this.currentExtractedTemplate.objects || [];
        objs.forEach(o => {
            if (o.type === 'shape' && o.isBackground) {
                o.bgColor = pal.background;
            } else if (o.type === 'logo') {
                o.color = pal.primary;
            } else if (o.type === 'vertical_banner') {
                o.bgColor = pal.accent;
            } else if (o.type === 'category_list') {
                o.titleColor = pal.primary;
                o.textColor = pal.text;
                o.priceColor = pal.accent;
            } else if (o.type === 'photo') {
                o.borderColor = pal.accent;
                o.imageUrl = TemplateExtractorEngine.createBlankPhotoPlaceholderSVG(o.w, o.h, pal);
            }
        });

        this.renderExtractorPreviewWireframe();
    },

    updateExtractorFontPairing(pairingId) {
        if (!this.currentExtractedTemplate || !pairingId) return;
        const typo = TemplateExtractorEngine.getTypographyForPairing(pairingId);
        this.currentExtractedTemplate.typography = typo;

        const typoLabel = document.getElementById('extractor-typo-label');
        if (typoLabel && typo) {
            typoLabel.textContent = `${typo.headingFont} + ${typo.bodyFont} + ${typo.priceFont}`;
        }

        const objs = this.currentExtractedTemplate.objects || [];
        objs.forEach(o => {
            if (o.type === 'category_list') {
                o.titleFont = typo.headingFont;
                o.fontFamily = typo.bodyFont;
                o.priceFont = typo.priceFont;
            } else if (o.type === 'logo') {
                o.titleFont = typo.headingFont;
            }
        });

        this.renderExtractorPreviewWireframe();
    },

    updateExtractorTargetMode(mode) {
        this.extractorTargetMode = mode;
    },

    renderExtractorPreviewWireframe() {
        const container = document.getElementById('extractor-wireframe-container');
        if (!container || !this.currentExtractedTemplate) return;

        const formatId = this.extractorTargetFormat || (this.currentExtractedTemplate && this.currentExtractedTemplate.format) || 'menu_34x30';
        container.innerHTML = TemplateExtractorEngine.renderWireframeSVG(this.currentExtractedTemplate, { format: formatId });
    },

    applyExtractedTemplate() {
        if (!this.currentExtractedTemplate) {
            this.showToast('Veuillez d\'abord charger ou extraire un gabarit');
            return;
        }

        const formatId = this.extractorTargetFormat || (this.currentExtractedTemplate && this.currentExtractedTemplate.format) || 'menu_34x30';
        const mode = this.extractorTargetMode || 'active_spread';
        const pal = this.currentExtractedTemplate.palette;
        const typo = this.currentExtractedTemplate.typography;

        // Si le format cible est différent du format actuel du document, basculer le document
        if (this.engine && this.engine.currentFormat !== formatId) {
            this.engine.setFormat(formatId, false);
        }

        const placeholderDishes = TemplateExtractorEngine.getNeutralPlaceholderDishes([
            '[CATÉGORIE 1]', '[CATÉGORIE 2]', '[CATÉGORIE 3]', '[CATÉGORIE 4]',
            '[ENTRÉES FROIDES]', '[SALADES & ENTRÉES CHAUDES]', '[VIANDES & GRILLADES]',
            '[POISSONS & FRUITS DE MER]', '[DESSERTS DU CHEF]', '[BOISSONS & COCKTAILS]',
            '[ANTIPASTI]', '[PIZZE ARTIGIANALI]', '[PRIMI PIATTI]', '[SECONDI PIATTI]',
            '[DOLCI DELLA CASA]', '[VINS & BOISSONS]', '[FORMULES DU JOUR]', '[MENU ENFANT]'
        ]);

        const existingIds = new Set(this.engine.dishesDB.map(d => d.id));
        placeholderDishes.forEach(pd => {
            if (!existingIds.has(pd.id)) {
                this.engine.dishesDB.push(pd);
                existingIds.add(pd.id);
            }
        });

        if (mode === 'all_spreads') {
            const theme = TemplateExtractorEngine.buildFull5SpreadsTheme(pal, typo, { format: formatId });
            this.engine.faces = theme.faces;
            this.currentFace = this.engine.faces[0];
            this.engine.currentFace = this.currentFace;
            this.currentFaceIndex = 0;
            this.engine.fontPairing = typo.id || 'bistrot_chic';
            const msg = formatId === 'menu_34x30'
                ? 'Thème complet vierge appliqué sur les 5 planches (10 faces) !'
                : (formatId === 'flyer_a4_portrait'
                    ? 'Gabarit Flyer A4 Recto / Verso (2 pages) appliqué !'
                    : 'Gabarit Set de Table A4 Paysage (3 colonnes) appliqué !');
            this.showToast(msg);
        } else {
            const targetFace = this.currentFace || (this.engine && this.engine.faces && this.engine.faces[this.currentFaceIndex || 0]);
            if (targetFace) {
                targetFace.bgColor = pal.background;
                targetFace.objects = JSON.parse(JSON.stringify(this.currentExtractedTemplate.objects || []));
                this.currentFace = targetFace;
                if (this.engine) this.engine.currentFace = targetFace;
            }
            const formatLabel = formatId === 'menu_34x30' ? '34×30 cm' : (formatId === 'flyer_a4_portrait' ? 'A4 Portrait' : 'A4 Paysage');
            this.showToast(`Gabarit vierge ${formatLabel} appliqué sur la face active !`);
        }

        this.selectedObjectId = null;
        this.commitState();
        this.renderSpreadsNavigator();
        this.populateQuickDishSelect();
        this.renderCurrentFace();
        this.renderInspector();
        this.closeTemplateExtractorModal();
    },

    exportExtractedTemplateJSON() {
        if (!this.currentExtractedTemplate) {
            this.showToast('Aucun gabarit à exporter');
            return;
        }

        const formatId = this.extractorTargetFormat || (this.currentExtractedTemplate && this.currentExtractedTemplate.format) || 'menu_34x30';
        const mode = this.extractorTargetMode || 'active_spread';
        let exportData = this.currentExtractedTemplate;

        if (mode === 'all_spreads') {
            const pal = this.currentExtractedTemplate.palette;
            const typo = this.currentExtractedTemplate.typography;
            const fullTheme = TemplateExtractorEngine.buildFull5SpreadsTheme(pal, typo, { format: formatId });
            exportData = Object.assign({}, this.currentExtractedTemplate, {
                format: formatId,
                faces: fullTheme.faces
            });
        }

        const jsonStr = TemplateExtractorEngine.exportTemplateJSON(exportData);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `inmenu-gabarit-vierge-${formatId}-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showToast('Gabarit réutilisable exporté en JSON !');
    }
});
