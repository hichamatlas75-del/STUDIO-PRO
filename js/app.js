/**
 * MODULE 2: VisualCanvasEditor & Application Controller (app.js)
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
                    }).catch(() => {});
                }

                if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                    this.fitToScreen();
                }
                requestAnimationFrame(() => this.renderRulers());
            }

            initModalBackdrops() {
                const modalIds = ['modal-database', 'modal-export', 'modal-3d', 'modal-engine', 'modal-word-import', 'modal-format', 'modal-page-numbering', 'modal-mobile-tools'];
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
                if (!this.selectedObjectId) return null;
                return this.currentFace.objects.find(o => o.id === this.selectedObjectId) || null;
            }

            setupGeometryDOM() {
                const specs = this.engine.specs;
                const wrapperEl = document.getElementById('spread-wrapper');
                const bleedClipEl = document.getElementById('bleed-clip');
                const pageEl = document.getElementById('spread-page');
                const bleedEl = document.getElementById('guide-bleed');
                const marginEl = document.getElementById('guide-outer-margin');
                const foldZoneEl = document.getElementById('guide-fold-zone');
                const foldLineEl = document.getElementById('guide-fold-line');

                const trimW = this.mmToPx(specs.widthMm);
                const trimH = this.mmToPx(specs.heightMm);
                const bleedPx = this.mmToPx(specs.bleedMm);

                wrapperEl.style.width = `${trimW}px`;
                wrapperEl.style.height = `${trimH}px`;

                // Set 340 x 300 mm trim box
                pageEl.style.width = `${trimW}px`;
                pageEl.style.height = `${trimH}px`;
                pageEl.style.position = 'relative';

                // Bleed clip container: shows 3mm bleed in Normal mode, trims to 340x300mm in Preview mode
                if (this.previewMode) {
                    bleedClipEl.style.left = '0px';
                    bleedClipEl.style.top = '0px';
                    bleedClipEl.style.width = `${trimW}px`;
                    bleedClipEl.style.height = `${trimH}px`;
                    pageEl.style.left = '0px';
                    pageEl.style.top = '0px';
                } else {
                    bleedClipEl.style.left = `-${bleedPx}px`;
                    bleedClipEl.style.top = `-${bleedPx}px`;
                    bleedClipEl.style.width = `${this.mmToPx(specs.widthMm + specs.bleedMm * 2)}px`;
                    bleedClipEl.style.height = `${this.mmToPx(specs.heightMm + specs.bleedMm * 2)}px`;
                    pageEl.style.left = `${bleedPx}px`;
                    pageEl.style.top = `${bleedPx}px`;
                }

                // Set -3mm Bleed Outline (346 x 306 mm)
                bleedEl.style.left = `-${bleedPx}px`;
                bleedEl.style.top = `-${bleedPx}px`;
                bleedEl.style.width = `${this.mmToPx(specs.widthMm + specs.bleedMm * 2)}px`;
                bleedEl.style.height = `${this.mmToPx(specs.heightMm + specs.bleedMm * 2)}px`;

                // Outer margin 10mm
                const marginPx = this.mmToPx(specs.safeOuterMm);
                marginEl.style.left = `${marginPx}px`;
                marginEl.style.top = `${marginPx}px`;
                marginEl.style.right = `${marginPx}px`;
                marginEl.style.bottom = `${marginPx}px`;

                // Fold Safety Zone & Central Fold Line
                if (foldZoneEl && foldLineEl) {
                    if (specs.hasFold && specs.foldXMm) {
                        foldZoneEl.style.display = '';
                        foldLineEl.style.display = '';
                        foldZoneEl.style.left = `${this.mmToPx(specs.foldXMm - specs.safeFoldHalfMm)}px`;
                        foldZoneEl.style.width = `${this.mmToPx(specs.safeFoldHalfMm * 2)}px`;
                        foldLineEl.style.left = `${this.mmToPx(specs.foldXMm)}px`;
                    } else {
                        foldZoneEl.style.display = 'none';
                        foldLineEl.style.display = 'none';
                    }
                }
                this.updateFormatHeaderUI();

                this.applyZoomTransform();
            }

            applyZoomTransform() {
                const specs = this.engine.specs;
                const stage = document.getElementById('spread-stage');
                const wrapper = document.getElementById('spread-wrapper');

                if (stage) {
                    stage.style.width = `${this.mmToPx(specs.widthMm) * this.zoom}px`;
                    stage.style.height = `${this.mmToPx(specs.heightMm) * this.zoom}px`;
                }
                wrapper.style.transform = `scale(${this.zoom})`;

                const zoomSelect = document.getElementById('zoom-select');
                const customOpt = document.getElementById('zoom-custom-opt');
                const zoomStr = String(this.zoom);
                const standardValues = ['0.5', '0.65', '0.8', '1', '1.25', '1.5'];
                if (standardValues.includes(zoomStr)) {
                    if (customOpt) customOpt.hidden = true;
                    zoomSelect.value = zoomStr;
                } else if (customOpt) {
                    customOpt.value = zoomStr;
                    customOpt.textContent = `${Math.round(this.zoom * 100)}%`;
                    customOpt.hidden = false;
                    zoomSelect.value = zoomStr;
                }

                requestAnimationFrame(() => this.renderRulers());
            }

            setZoom(val) {
                if (!Number.isFinite(val)) return;
                this.zoom = Math.max(0.35, Math.min(1.75, +val.toFixed(2)));
                this.applyZoomTransform();
            }

            fitToScreen() {
                const viewport = document.getElementById('viewport');
                if (!viewport) return;
                const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;
                const pad = isMobile ? 24 : 96;
                const vw = Math.max(160, viewport.clientWidth - pad);
                const vh = Math.max(160, viewport.clientHeight - pad);
                const specs = this.engine.specs;
                const pageW = this.mmToPx(specs.widthMm + (specs.bleedMm * 2));
                const pageH = this.mmToPx(specs.heightMm + (specs.bleedMm * 2));
                const scale = Math.max(0.25, Math.min(1.5, Math.min(vw / pageW, vh / pageH)));
                this.setZoom(scale);
            }

            renderRulers() {
                const topRuler = document.getElementById('ruler-top');
                const leftRuler = document.getElementById('ruler-left');
                const pageEl = document.getElementById('spread-page');
                if (!topRuler || !leftRuler || !pageEl || topRuler.offsetParent === null) return;

                const pageRect = pageEl.getBoundingClientRect();
                const topRect = topRuler.getBoundingClientRect();
                const leftRect = leftRuler.getBoundingClientRect();

                const originX = pageRect.left - topRect.left;
                const originY = pageRect.top - leftRect.top;
                const stepCmPx = this.mmToPx(10) * this.zoom;

                topRuler.innerHTML = '';
                leftRuler.innerHTML = '';

                const maxCmX = Math.ceil(this.engine.specs.widthMm / 10);
                const maxCmY = Math.ceil(this.engine.specs.heightMm / 10);
                const foldCm = (this.engine.specs.hasFold && this.engine.specs.foldXMm) ? Math.round(this.engine.specs.foldXMm / 10) : null;

                // Horizontal
                for (let cm = 0; cm <= maxCmX; cm++) {
                    const mark = document.createElement('div');
                    mark.className = 'absolute top-0 bottom-0 border-l border-gray-600 pl-1 flex items-end pb-0.5 select-none whitespace-nowrap';
                    mark.style.left = `${originX + cm * stepCmPx}px`;
                    if (cm === foldCm) {
                        mark.className += ' text-cyan-400 font-bold border-cyan-400';
                        mark.textContent = `${cm} (Pli)`;
                    } else {
                        mark.textContent = String(cm);
                    }
                    topRuler.appendChild(mark);
                }

                // Vertical
                for (let cm = 0; cm <= maxCmY; cm++) {
                    const mark = document.createElement('div');
                    mark.className = 'absolute left-0 right-0 border-t border-gray-600 pt-0.5 text-center select-none text-[8px]';
                    mark.style.top = `${originY + cm * stepCmPx}px`;
                    mark.textContent = String(cm);
                    leftRuler.appendChild(mark);
                }
            }

            // Render Current Face Objects onto the DOM Canvas
            renderCurrentFace() {
                const face = this.currentFace;
                const bleedClipEl = document.getElementById('bleed-clip');
                const pageEl = document.getElementById('spread-page');
                const layerEl = document.getElementById('objects-layer');

                const bg = face.bgColor || '#fdfbf7';
                if (bleedClipEl) bleedClipEl.style.backgroundColor = bg;
                pageEl.style.backgroundColor = bg;
                layerEl.innerHTML = '';

                face.objects.forEach((obj, idx) => {
                    const el = this.createObjectDOM(obj, idx);
                    layerEl.appendChild(el);
                });

                // Update Footer & Badges
                const specs = this.engine.specs;
                const footerFaceTitle = document.getElementById('footer-face-title');
                if (footerFaceTitle) footerFaceTitle.textContent = face.name;
                const footerFaceSub = document.getElementById('footer-face-sub');
                const foldTxt = specs.hasFold ? ` (Pli ${specs.foldXMm} mm)` : '';
                if (footerFaceSub) footerFaceSub.textContent = `Face ${this.currentFaceIndex + 1} / ${this.engine.faces.length} • ${specs.widthMm}×${specs.heightMm} mm${foldTxt}`;
                const dbCountBadge = document.getElementById('db-count-badge');
                if (dbCountBadge) dbCountBadge.textContent = this.engine.dishesDB.length;

                const mobHeaderPill = document.getElementById('mobile-header-face-pill');
                if (mobHeaderPill) mobHeaderPill.textContent = `${face.name} (${this.currentFaceIndex + 1}/${this.engine.faces.length})`;
                const mobCanvasPill = document.getElementById('mobile-canvas-face-pill');
                if (mobCanvasPill) mobCanvasPill.textContent = `${face.name} (${this.currentFaceIndex + 1}/${this.engine.faces.length})`;

                this.renderCanvasPageNumberOverlay();

                this.renderLayersList();
                this.renderSpreadsNavigator();
                this.updateTopTransformBar();
            }

            createObjectDOM(obj, zIndex) {
                const isSelected = obj.id === this.selectedObjectId && !this.previewMode;
                const wrapper = document.createElement('div');
                wrapper.id = `dom_${obj.id}`;
                wrapper.style.position = 'absolute';
                wrapper.style.left = `${this.mmToPx(obj.x)}px`;
                wrapper.style.top = `${this.mmToPx(obj.y)}px`;
                wrapper.style.width = `${this.mmToPx(obj.w)}px`;
                wrapper.style.height = `${this.mmToPx(obj.h)}px`;
                wrapper.style.zIndex = zIndex + 1;
                wrapper.style.opacity = obj.opacity !== undefined ? obj.opacity : 1;
                const cursorClass = obj.locked ? 'cursor-default' : 'cursor-move';
                wrapper.className = `group ${cursorClass} select-none ${
                    isSelected
                        ? (obj.locked ? 'ring-2 ring-amber-500' : 'ring-2 ring-blue-500')
                        : (!this.previewMode ? (obj.locked ? 'hover:ring-1 hover:ring-amber-400/60' : 'hover:ring-1 hover:ring-blue-400/60') : '')
                }`;

                // Mouse Down to Select & Drag
                wrapper.addEventListener('mousedown', (e) => {
                    e.stopPropagation();
                    if (this.selectedObjectId !== obj.id) {
                        this.selectObject(obj.id);
                    }
                    if (!obj.locked) {
                        const currentObj = this.currentFace.objects.find(o => o.id === obj.id);
                        if (currentObj) {
                            this.startDragObject(e, currentObj);
                        }
                    }
                });

                if (obj.locked && !this.previewMode) {
                    const lockBadge = document.createElement('div');
                    lockBadge.className = 'absolute top-1 right-1 bg-amber-500 text-slate-900 rounded px-1 py-0.5 text-[8px] font-bold shadow flex items-center space-x-1 pointer-events-none z-30';
                    lockBadge.innerHTML = '<i class="fa-solid fa-lock"></i>';
                    wrapper.appendChild(lockBadge);
                }

                // Inner Visual Content according to Block Type
                const content = document.createElement('div');
                content.className = 'w-full h-full overflow-hidden relative';

                if (obj.type === 'shape') {
                    content.style.backgroundColor = obj.bgColor || 'transparent';
                    content.style.borderColor = obj.borderColor || 'transparent';
                    content.style.borderWidth = `${obj.borderWidth || 0}px`;
                    content.style.borderStyle = (obj.borderWidth > 0 && obj.borderColor !== 'transparent') ? 'solid' : 'none';
                    content.style.borderRadius = `${this.mmToPx(obj.radius ?? 0)}px`;
                }
                else if (obj.type === 'vertical_banner') {
                    content.style.backgroundColor = obj.bgColor || '#1e293b';
                    content.style.color = obj.textColor || '#ffffff';
                    content.style.borderRadius = `${this.mmToPx(obj.radius ?? 2)}px`;
                    content.className += ' flex items-center justify-center font-montserrat font-bold tracking-widest uppercase shadow-sm';
                    content.style.fontSize = `${this.mmToPx((obj.fontSize || 12) * PT_TO_MM)}px`;
                    const span = document.createElement('span');
                    span.className = 'vertical-banner-text whitespace-nowrap';
                    span.textContent = obj.text || 'CATÉGORIE';
                    content.appendChild(span);
                }
                else if (obj.type === 'badge_new') {
                    content.style.backgroundColor = obj.bgColor || '#e11d48';
                    content.style.color = obj.textColor || '#ffffff';
                    content.style.borderRadius = `${this.mmToPx(obj.radius ?? 8)}px`;
                    content.className += ' flex items-center justify-center font-montserrat font-extrabold tracking-wider uppercase shadow-md';
                    content.style.fontSize = `${Math.max(this.mmToPx(2.8), this.mmToPx(obj.h) * 0.42)}px`;
                    const span = document.createElement('span');
                    span.textContent = obj.text || 'NOUVEAU';
                    content.appendChild(span);
                }
                else if (obj.type === 'logo') {
                    const color = obj.color || '#c8a96a';
                    const hPx = this.mmToPx(obj.h);
                    const crestSize = Math.max(12, Math.round(hPx * 0.36));
                    const iconSize = Math.max(7, Math.round(crestSize * 0.44));
                    const titleSize = Math.max(8, Math.round(hPx * 0.22));
                    const subSize = Math.max(5, Math.round(hPx * 0.10));

                    content.style.color = color;
                    content.className += ' flex flex-col items-center justify-center text-center px-1';
                    content.innerHTML = `
                        <div class="rounded-full flex items-center justify-center shrink-0" style="width:${crestSize}px; height:${crestSize}px; border:${Math.max(1, hPx * 0.018)}px solid ${escapeHTML(color)}; margin-bottom:${Math.max(2, hPx * 0.05)}px;">
                            <i class="fa-solid fa-utensils" style="font-size:${iconSize}px;"></i>
                        </div>
                        <div class="font-cinzel font-bold tracking-widest leading-none truncate max-w-full" style="font-size:${titleSize}px;">${escapeHTML(obj.title ?? 'GREY CORNER')}</div>
                        <div class="font-montserrat tracking-[0.22em] opacity-85 truncate max-w-full" style="font-size:${subSize}px; margin-top:${Math.max(2, hPx * 0.04)}px;">${escapeHTML(obj.subtitle ?? 'CAFÉ • SINCE 2024')}</div>
                    `;
                }
                else if (obj.type === 'dish_item') {
                    const dish = this.engine.getDishById(obj.dishId) || {
                        name: obj.customName || 'Plat Personnalisé',
                        desc: obj.customDesc || 'Ingrédients et préparation',
                        price: obj.customPrice || '00 DH',
                        badge: ''
                    };
                    content.innerHTML = this.buildDishRowHTML(dish, {
                        nameColor: obj.textColor || '#1e293b',
                        descColor: obj.descColor || '#64748b',
                        priceColor: obj.priceColor || '#9a3412',
                        fontSize: obj.fontSize || 11
                    });
                }
                else if (obj.type === 'category_list') {
                    const allDishes = this.engine.getDishesByCategory(obj.category);
                    const dishes = (obj.sliceStart !== undefined || obj.sliceEnd !== undefined)
                        ? allDishes.slice(obj.sliceStart || 0, obj.sliceEnd)
                        : allDishes;
                    let html = `<div class="flex flex-col" style="gap:${this.mmToPx(2.5)}px">`;
                    if (obj.title) {
                        const titleSizePx = this.mmToPx(4.4);
                        html += `
                            <div class="border-b flex items-center justify-between" style="border-color:${escapeHTML(obj.titleColor || '#9a3412')}; padding-bottom:${this.mmToPx(1.2)}px;">
                                <span class="font-serif font-bold tracking-wide truncate" style="color:${escapeHTML(obj.titleColor || '#9a3412')}; font-size:${titleSizePx}px; line-height:1.15;">${escapeHTML(obj.title)}</span>
                                ${this.previewMode ? '' : `<span class="font-mono opacity-60 shrink-0 ml-2" style="color:${escapeHTML(obj.titleColor || '#9a3412')}; font-size:${this.mmToPx(2.5)}px;" title="Indication éditeur (non imprimée)">${dishes.length} plats</span>`}
                            </div>
                        `;
                    }
                    dishes.forEach(d => {
                        html += this.buildDishRowHTML(d, {
                            nameColor: obj.textColor || '#1e293b',
                            descColor: obj.descColor || '#64748b',
                            priceColor: obj.priceColor || '#9a3412',
                            fontSize: obj.fontSize || 10.5
                        });
                    });
                    html += `</div>`;
                    content.innerHTML = html;

                    // Détection de débordement de texte en mode édition
                    if (!this.previewMode && typeof WordMenuImporter !== 'undefined') {
                        const estimatedH = WordMenuImporter.estimateBlockHeightMm(dishes, Boolean(obj.title));
                        if (estimatedH > obj.h + 2) {
                            const overflowBadge = document.createElement('button');
                            overflowBadge.type = 'button';
                            overflowBadge.className = 'absolute bottom-1 right-1 bg-red-600 hover:bg-red-500 text-white font-mono text-[9px] font-bold px-1.5 py-0.5 rounded shadow z-40 flex items-center space-x-1 cursor-pointer';
                            overflowBadge.title = `Débordement de texte détecté (${Math.round(estimatedH)} mm requis vs ${obj.h} mm actuel). Cliquez pour ajuster automatiquement.`;
                            overflowBadge.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i><span>+${Math.round(estimatedH - obj.h)}mm</span>`;
                            overflowBadge.addEventListener('mousedown', (e) => e.stopPropagation());
                            overflowBadge.addEventListener('click', (e) => {
                                e.stopPropagation();
                                this.updateObjProp('h', Math.round(estimatedH));
                                this.renderInspector();
                            });
                            wrapper.appendChild(overflowBadge);
                        }
                    }
                }
                else if (obj.type === 'photo') {
                    content.style.borderRadius = `${this.mmToPx(obj.radius ?? 4)}px`;
                    content.style.border = (obj.borderWidth > 0 && obj.borderColor !== 'transparent')
                        ? `${obj.borderWidth}px solid ${obj.borderColor || '#c8a96a'}`
                        : 'none';
                    const safeUrl = sanitizeUrl(obj.imageUrl);
                    const imgEl = document.createElement('img');
                    imgEl.src = safeUrl || 'https://placehold.co/600x400/1e293b/e2e8f0?text=Photo+Gastronomique';
                    imgEl.className = 'w-full h-full object-cover pointer-events-none';
                    imgEl.onerror = function () {
                        if (!this.dataset.fallbackApplied) {
                            this.dataset.fallbackApplied = '1';
                            this.src = 'https://placehold.co/600x400/1e293b/e2e8f0?text=Photo+Indisponible';
                        }
                    };
                    content.appendChild(imgEl);
                    if (obj.caption) {
                        const capEl = document.createElement('div');
                        capEl.className = 'absolute bottom-0 inset-x-0 bg-black/65 text-white font-serif italic px-2 flex items-center justify-center text-center truncate';
                        capEl.style.height = `${this.mmToPx(7.5)}px`;
                        capEl.style.fontSize = `${this.mmToPx(3.1)}px`;
                        capEl.textContent = obj.caption;
                        content.appendChild(capEl);
                    }
                }
                else if (obj.type === 'text') {
                    content.style.fontFamily = obj.fontFamily || 'Playfair Display';
                    content.style.fontSize = `${this.mmToPx((obj.fontSize || 12) * PT_TO_MM)}px`;
                    content.style.lineHeight = '1.35';
                    content.style.color = obj.color || '#1e293b';
                    content.style.textAlign = obj.align || 'left';
                    content.style.fontWeight = obj.fontWeight || '500';
                    content.className += ' whitespace-pre-line';
                    content.textContent = obj.text || '';
                }
                else if (obj.type === 'illustration') {
                    const item = typeof CanvaIllustrationsPack !== 'undefined'
                        ? (CanvaIllustrationsPack.getById(obj.svgKey || obj.illustrationId) || CanvaIllustrationsPack.getById('cutlery_crossed'))
                        : null;
                    content.className += ' flex items-center justify-center pointer-events-none select-none';
                    if (item) {
                        content.innerHTML = CanvaIllustrationsPack.buildSVGString(item, {
                            color: obj.color || item.defaultColor || '#c8a96a',
                            opacity: obj.opacity !== undefined ? obj.opacity : 1,
                            flipH: obj.flipH,
                            flipV: obj.flipV,
                            rotate: obj.rotate || 0
                        });
                    } else {
                        content.innerHTML = '<div class="w-full h-full border border-dashed border-amber-400/50 flex items-center justify-center text-[10px] text-amber-400 font-mono">Illustration</div>';
                    }
                }
                else if (obj.type === 'page_number') {
                    content.className += ' flex items-center justify-center select-none font-mono';
                    content.style.fontFamily = obj.fontFamily || 'Montserrat';
                    content.style.fontSize = `${this.mmToPx((obj.fontSize || 8.5) * PT_TO_MM)}px`;
                    content.style.color = obj.color || '#64748b';
                    content.style.fontWeight = '600';
                    content.textContent = obj.text || `— ${this.currentFaceIndex + 1} —`;
                }

                wrapper.appendChild(content);

                // If Selected: Add 8 Resize Handles (if unlocked) + Millimeter Coordinate Pill
                if (isSelected) {
                    if (!obj.locked) {
                        const dirs = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
                        dirs.forEach(dir => {
                            const h = document.createElement('div');
                            h.className = `resize-handle handle-${dir}`;
                            h.addEventListener('mousedown', (e) => {
                                e.stopPropagation();
                                const currentObj = this.currentFace.objects.find(o => o.id === obj.id);
                                if (currentObj) {
                                    this.startResizeObject(e, currentObj, dir);
                                }
                            });
                            wrapper.appendChild(h);
                        });
                    }

                    const badge = document.createElement('div');
                    badge.id = `coord_pill_${obj.id}`;
                    badge.className = `absolute -top-5 left-0 ${obj.locked ? 'bg-amber-600' : 'bg-blue-600'} text-white font-mono text-[9px] px-1.5 py-0.5 rounded shadow whitespace-nowrap pointer-events-none z-50 flex items-center space-x-1`;
                    badge.textContent = `${obj.locked ? '🔒 ' : ''}${obj.w} × ${obj.h} mm  (X:${obj.x}, Y:${obj.y})`;
                    wrapper.appendChild(badge);
                }

                return wrapper;
            }

            buildDishRowHTML(dish, style) {
                let badgeHTML = '';
                const badgeFontPx = this.mmToPx(2.0);
                if (dish.badge === 'NOUVEAU') {
                    badgeHTML = `<span class="ml-1.5 bg-rose-600 text-white font-montserrat font-bold px-1.5 py-0.2 rounded uppercase shrink-0" style="font-size:${badgeFontPx}px;">NOUVEAU</span>`;
                } else if (dish.badge === 'CHEF') {
                    badgeHTML = `<span class="ml-1.5 bg-amber-600 text-white font-montserrat font-bold px-1.5 py-0.2 rounded uppercase shrink-0" style="font-size:${badgeFontPx}px;">★ CHEF</span>`;
                }

                const titleSizePx = this.mmToPx((style.fontSize || 10.5) * PT_TO_MM);
                const descSizePx = Math.max(7, titleSizePx * 0.82);
                const cleanDesc = (dish.desc || '').trim();
                const descHTML = cleanDesc
                    ? `<div class="font-sans leading-snug pr-4" style="color:${escapeHTML(style.descColor)}; font-size:${descSizePx}px; margin-top:${this.mmToPx(0.8)}px;">${escapeHTML(cleanDesc)}</div>`
                    : '';

                return `
                    <div class="w-full leading-tight">
                        <div class="flex items-baseline justify-between font-serif font-bold" style="color:${escapeHTML(style.nameColor)}; font-size:${titleSizePx}px;">
                            <span class="flex items-center flex-wrap">${escapeHTML(dish.name)}${badgeHTML}</span>
                            <span class="menu-dots"></span>
                            <span class="font-montserrat font-bold shrink-0" style="color:${escapeHTML(style.priceColor)};">${escapeHTML(dish.price)}</span>
                        </div>
                        ${descHTML}
                    </div>
                `;
            }

            // ==================== DRAG & RESIZE WITH MAGNETIC FOLD/MARGIN SNAPPING ====================
            onViewportMouseDown(e) {
                if (e.target.closest && e.target.closest('[id^="dom_"]')) return;
                if (['viewport', 'viewport-center', 'spread-stage', 'bleed-clip', 'spread-page', 'objects-layer'].includes(e.target.id)) {
                    this.selectObject(null);
                }
            }

            selectObject(id) {
                this.selectedObjectId = id;
                this.renderCurrentFace();
                this.renderInspector();
            }

            startDragObject(e, obj) {
                if (this.previewMode || (e.button !== undefined && e.button !== 0)) return;
                const startMouseX = e.clientX;
                const startMouseY = e.clientY;
                const origX = obj.x;
                const origY = obj.y;
                const domEl = document.getElementById(`dom_${obj.id}`);
                const barX = document.getElementById('bar-x');
                const barY = document.getElementById('bar-y');

                const onMove = (moveEvt) => {
                    const dxMm = (moveEvt.clientX - startMouseX) / (this.basePxPerMm * this.zoom);
                    const dyMm = (moveEvt.clientY - startMouseY) / (this.basePxPerMm * this.zoom);

                    let newX = +(origX + dxMm).toFixed(1);
                    let newY = +(origY + dyMm).toFixed(1);

                    if (this.snapEnabled) {
                        const snapped = this.computeSmartSnap(newX, newY, obj.w, obj.h);
                        newX = snapped.x;
                        newY = snapped.y;
                    }

                    obj.x = newX;
                    obj.y = newY;

                    if (domEl) {
                        domEl.style.left = `${this.mmToPx(newX)}px`;
                        domEl.style.top = `${this.mmToPx(newY)}px`;
                    }
                    if (barX) barX.value = newX;
                    if (barY) barY.value = newY;
                };

                const onUp = () => {
                    this.hideSmartGuides();
                    window.removeEventListener('mousemove', onMove);
                    window.removeEventListener('mouseup', onUp);
                    if (obj.x !== origX || obj.y !== origY) {
                        this.commitState(false);
                        this.renderInspector();
                    }
                };

                window.addEventListener('mousemove', onMove);
                window.addEventListener('mouseup', onUp);
            }

            startResizeObject(e, obj, dir) {
                if (this.previewMode || obj.locked || (e.button !== undefined && e.button !== 0)) return;
                const startMouseX = e.clientX;
                const startMouseY = e.clientY;
                const origX = obj.x, origY = obj.y, origW = obj.w, origH = obj.h;
                const domEl = document.getElementById(`dom_${obj.id}`);
                const barX = document.getElementById('bar-x');
                const barY = document.getElementById('bar-y');
                const barW = document.getElementById('bar-w');
                const barH = document.getElementById('bar-h');

                const onMove = (moveEvt) => {
                    const dxMm = (moveEvt.clientX - startMouseX) / (this.basePxPerMm * this.zoom);
                    const dyMm = (moveEvt.clientY - startMouseY) / (this.basePxPerMm * this.zoom);

                    let x = origX, y = origY, w = origW, h = origH;

                    if (dir.includes('e')) w = Math.max(8, +(origW + dxMm).toFixed(1));
                    if (dir.includes('s')) h = Math.max(6, +(origH + dyMm).toFixed(1));
                    if (dir.includes('w')) {
                        const clampedW = Math.max(8, origW - dxMm);
                        w = +clampedW.toFixed(1);
                        x = +(origX + (origW - clampedW)).toFixed(1);
                    }
                    if (dir.includes('n')) {
                        const clampedH = Math.max(6, origH - dyMm);
                        h = +clampedH.toFixed(1);
                        y = +(origY + (origH - clampedH)).toFixed(1);
                    }

                    if (this.snapEnabled) {
                        const snapped = this.computeSmartSnap(x, y, w, h);
                        if (dir.includes('w')) {
                            const diffX = snapped.x - x;
                            x = snapped.x;
                            w = Math.max(8, +(w - diffX).toFixed(1));
                        } else if (dir.includes('e')) {
                            const rightEdge = x + w;
                            const vGuides = [10, 85, 160, 170, 180, 255, 330, 340];
                            for (const gx of vGuides) {
                                if (Math.abs(rightEdge - gx) < 2.0) {
                                    w = Math.max(8, +(gx - x).toFixed(1));
                                    break;
                                }
                            }
                        }
                        if (dir.includes('n')) {
                            const diffY = snapped.y - y;
                            y = snapped.y;
                            h = Math.max(6, +(h - diffY).toFixed(1));
                        } else if (dir.includes('s')) {
                            const bottomEdge = y + h;
                            const hGuides = [10, 150, 290, 300];
                            for (const gy of hGuides) {
                                if (Math.abs(bottomEdge - gy) < 2.0) {
                                    h = Math.max(6, +(gy - y).toFixed(1));
                                    break;
                                }
                            }
                        }
                    }

                    obj.x = x; obj.y = y; obj.w = w; obj.h = h;

                    if (domEl) {
                        domEl.style.left = `${this.mmToPx(x)}px`;
                        domEl.style.top = `${this.mmToPx(y)}px`;
                        domEl.style.width = `${this.mmToPx(w)}px`;
                        domEl.style.height = `${this.mmToPx(h)}px`;
                    }
                    if (barX) barX.value = x;
                    if (barY) barY.value = y;
                    if (barW) barW.value = w;
                    if (barH) barH.value = h;
                };

                const onUp = () => {
                    this.hideSmartGuides();
                    window.removeEventListener('mousemove', onMove);
                    window.removeEventListener('mouseup', onUp);
                    if (obj.x !== origX || obj.y !== origY || obj.w !== origW || obj.h !== origH) {
                        this.commitState(false);
                        this.renderInspector();
                    }
                };

                window.addEventListener('mousemove', onMove);
                window.addEventListener('mouseup', onUp);
            }

            /**
             * Magnetic Snapping to:
             * - Left Margin (10mm), Fold Left Safety (160mm), Central Fold (170mm),
             *   Fold Right Safety (180mm), Right Margin (330mm), Panel Centers (85mm, 255mm)
             */
            computeSmartSnap(x, y, w, h) {
                const threshold = 2.0; // 2mm snap tolerance
                const vGuides = [0, 10, 85, 160, 170, 180, 255, 330, 340];
                const hGuides = [0, 10, 150, 290, 300];

                let snappedX = x;
                let snappedY = y;
                let activeV = null;
                let activeH = null;

                for (const gx of vGuides) {
                    if (Math.abs(x - gx) < threshold) { snappedX = gx; activeV = gx; break; }
                    if (Math.abs((x + w) - gx) < threshold) { snappedX = +(gx - w).toFixed(1); activeV = gx; break; }
                    if (Math.abs((x + w / 2) - gx) < threshold) { snappedX = +(gx - w / 2).toFixed(1); activeV = gx; break; }
                }

                for (const gy of hGuides) {
                    if (Math.abs(y - gy) < threshold) { snappedY = gy; activeH = gy; break; }
                    if (Math.abs((y + h) - gy) < threshold) { snappedY = +(gy - h).toFixed(1); activeH = gy; break; }
                    if (Math.abs((y + h / 2) - gy) < threshold) { snappedY = +(gy - h / 2).toFixed(1); activeH = gy; break; }
                }

                const vEl = document.getElementById('smart-guide-v');
                const hEl = document.getElementById('smart-guide-h');
                if (vEl) {
                    if (activeV !== null) {
                        vEl.style.left = `${this.mmToPx(activeV)}px`;
                        vEl.classList.remove('hidden');
                    } else {
                        vEl.classList.add('hidden');
                    }
                }
                if (hEl) {
                    if (activeH !== null) {
                        hEl.style.top = `${this.mmToPx(activeH)}px`;
                        hEl.classList.remove('hidden');
                    } else {
                        hEl.classList.add('hidden');
                    }
                }

                return { x: snappedX, y: snappedY };
            }

            hideSmartGuides() {
                const vEl = document.getElementById('smart-guide-v');
                const hEl = document.getElementById('smart-guide-h');
                if (vEl) vEl.classList.add('hidden');
                if (hEl) hEl.classList.add('hidden');
            }

            // ==================== ADDING SPECIALIZED MENU BLOCKS ====================
            addMenuBlock(type) {
                const id = generateUniqueId('obj');
                let newObj = null;

                if (type === 'vertical_banner') {
                    newObj = {
                        id, type: 'vertical_banner', name: 'Bandeau Vertical Catégorie',
                        x: 15, y: 25, w: 15, h: 110,
                        text: 'NOUVELLE CATÉGORIE', bgColor: '#9a3412', textColor: '#ffffff', fontSize: 12, radius: 3
                    };
                } else if (type === 'dish_item') {
                    const firstDish = this.engine.dishesDB[0];
                    newObj = {
                        id, type: 'dish_item', name: 'Ligne Plat + Prix',
                        x: 36, y: 35, w: 118, h: 24,
                        dishId: firstDish ? firstDish.id : '',
                        textColor: '#1e293b', descColor: '#64748b', priceColor: '#9a3412', fontSize: 11
                    };
                } else if (type === 'category_list') {
                    const cats = this.engine.getCategories();
                    newObj = {
                        id, type: 'category_list', name: 'Bloc Catégorie Automatique',
                        x: 36, y: 25, w: 120, h: 135,
                        category: cats[0] || 'PETITS-DÉJEUNERS',
                        title: cats[0] || 'Sélection du Chef',
                        titleColor: '#9a3412', textColor: '#1e293b', descColor: '#64748b', priceColor: '#9a3412', fontSize: 10.5
                    };
                } else if (type === 'badge_new') {
                    newObj = {
                        id, type: 'badge_new', name: 'Badge NOUVEAU',
                        x: 120, y: 22, w: 34, h: 10,
                        text: 'NOUVEAU', bgColor: '#e11d48', textColor: '#ffffff', radius: 10
                    };
                } else if (type === 'photo') {
                    newObj = {
                        id, type: 'photo', name: 'Photo Gastronomique',
                        x: 185, y: 30, w: 135, h: 105,
                        imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80',
                        caption: 'Suggestion Gourmande du Chef',
                        radius: 5, borderColor: '#c8a96a', borderWidth: 1.5
                    };
                } else if (type === 'logo') {
                    newObj = {
                        id, type: 'logo', name: 'Logo Restaurant',
                        x: 205, y: 25, w: 100, h: 50,
                        title: 'GREY CORNER', subtitle: 'CAFÉ • SINCE 2024 • @GREYCORNERFES',
                        color: '#c8a96a'
                    };
                } else if (type === 'text') {
                    newObj = {
                        id, type: 'text', name: 'Bloc Texte Libre',
                        x: 40, y: 40, w: 110, h: 25,
                        text: 'Titre ou note de bas de page',
                        fontFamily: 'Playfair Display', fontSize: 14, color: '#1e293b', align: 'left', fontWeight: '700'
                    };
                } else if (type === 'shape') {
                    newObj = {
                        id, type: 'shape', name: 'Cadre Décoratif',
                        x: 12, y: 12, w: 146, h: 276,
                        bgColor: 'transparent', borderColor: '#c8a96a', borderWidth: 1.5, radius: 4, opacity: 1
                    };
                } else if (type === 'page_number') {
                    newObj = {
                        id, type: 'page_number', name: 'Numéro de Page',
                        x: Math.round((this.engine.specs.widthMm - 30) / 2),
                        y: this.engine.specs.heightMm - 14,
                        w: 30, h: 8,
                        text: this.engine.formatPageNumberString(this.currentFaceIndex + 1),
                        fontSize: 9, fontFamily: 'Montserrat', color: '#64748b', align: 'center'
                    };
                }

                if (newObj) {
                    this.currentFace.objects.push(newObj);
                    this.selectedObjectId = newObj.id;
                    this.commitState(false);
                    this.renderInspector();
                    this.showToast(`Bloc « ${newObj.name} » ajouté sur ${this.currentFace.name}`);
                }
            }

            insertSelectedQuickDish(explicitDishId = null) {
                const selectEl = document.getElementById('quick-dish-select');
                const dishId = explicitDishId || (selectEl ? selectEl.value : '');
                const dish = this.engine.getDishById(dishId);
                if (!dish) return;
                if (selectEl && selectEl.value !== dish.id) selectEl.value = dish.id;
                const newObj = {
                    id: generateUniqueId('obj'),
                    type: 'dish_item',
                    name: `Plat : ${dish.name}`,
                    x: 35, y: 45, w: 120, h: 25,
                    dishId: dish.id,
                    textColor: '#1e293b', descColor: '#64748b', priceColor: '#9a3412', fontSize: 11
                };
                this.currentFace.objects.push(newObj);
                this.selectedObjectId = newObj.id;
                this.commitState(false);
                this.renderInspector();
                this.showToast(`Plat « ${dish.name} » inséré !`);
            }

            // ==================== RIGHT INSPECTOR PANEL (MILLIMETERS & PROPERTIES) ====================
            renderInspector() {
                const container = document.getElementById('inspector-content');
                const badge = document.getElementById('prop-obj-type');
                const obj = this.selectedObject;
                const safeHex = (val, fallback) => /^#[0-9a-fA-F]{6}$/.test(String(val || '').trim()) ? String(val).trim() : fallback;

                if (!obj) {
                    badge.textContent = 'Planche 34×30cm';
                    const faceBg = safeHex(this.currentFace.bgColor, '#fdfbf7');
                    container.innerHTML = `
                        <div class="space-y-4">
                            <div class="bg-idInput p-3 rounded border border-idBorder space-y-2">
                                <div class="font-semibold text-white">${escapeHTML(this.currentFace.name)}</div>
                                <div class="text-[11px] text-gray-400">Aucun bloc sélectionné. Cliquez sur un élément du canevas pour le modifier ou ajoutez un bloc depuis la boîte à outils à gauche.</div>
                            </div>
                            <div>
                                <label class="block text-[11px] text-gray-400 mb-1">Couleur de fond du papier :</label>
                                <div class="flex items-center space-x-2">
                                    <input type="color" value="${faceBg}" oninput="app.updateFaceBgColor(this.value, true)" onchange="app.updateFaceBgColor(this.value, false)" class="w-8 h-8 rounded cursor-pointer bg-transparent border border-idBorder">
                                    <input type="text" value="${escapeHTML(this.currentFace.bgColor || '#fdfbf7')}" onchange="app.updateFaceBgColor(this.value, false)" class="flex-1 bg-idInput border border-idBorder rounded px-2 py-1 font-mono text-white">
                                </div>
                            </div>
                            <div class="pt-2 border-t border-idBorder space-y-1.5">
                                <div class="text-[10px] font-bold uppercase text-gray-400">Vérification Pré-Presse</div>
                                <div class="flex items-center justify-between text-[11px] bg-idInput px-2.5 py-1.5 rounded">
                                    <span class="text-gray-300">Dimensions ouvertes</span>
                                    <span class="font-mono text-emerald-400">340 × 300 mm</span>
                                </div>
                                <div class="flex items-center justify-between text-[11px] bg-idInput px-2.5 py-1.5 rounded">
                                    <span class="text-gray-300">Ligne de pli centrale</span>
                                    <span class="font-mono text-cyan-400">X = 170 mm</span>
                                </div>
                                <div class="flex items-center justify-between text-[11px] bg-idInput px-2.5 py-1.5 rounded">
                                    <span class="text-gray-300">Fond perdu (Bleed)</span>
                                    <span class="font-mono text-red-400">3 mm (346×306)</span>
                                </div>
                                <div class="flex items-center justify-between text-[11px] bg-idInput px-2.5 py-1.5 rounded">
                                    <span class="text-gray-300">Zone sécurité pli</span>
                                    <span class="font-mono text-cyan-300">160 à 180 mm</span>
                                </div>
                            </div>
                        </div>
                    `;
                    return;
                }

                badge.textContent = `${obj.type.toUpperCase()}${obj.locked ? ' (VERROUILLÉ)' : ''}`;

                // Lock notice if locked
                const lockNoticeHTML = obj.locked ? `
                    <div class="bg-amber-500/15 border border-amber-500/40 text-amber-300 p-2 rounded text-[10px] flex items-center justify-between">
                        <span class="flex items-center space-x-1.5">
                            <i class="fa-solid fa-lock text-amber-400"></i>
                            <span>Bloc <strong>verrouillé</strong> (protégé contre déplacement et suppression)</span>
                        </span>
                        <button onclick="app.toggleLockSelected()" class="text-amber-300 underline font-semibold ml-2 hover:text-white shrink-0">Déverrouiller</button>
                    </div>
                ` : '';

                // Warning if object crosses the central fold safety zone (160mm to 180mm) and isn't a full background
                const crossesFold = (obj.x < 180 && (obj.x + obj.w) > 160 && obj.w < 300);
                const foldWarningHTML = crossesFold ? `
                    <div class="bg-amber-500/15 border border-amber-500/40 text-amber-300 p-2 rounded text-[10px] flex items-start space-x-2">
                        <i class="fa-solid fa-triangle-exclamation mt-0.5 text-amber-400"></i>
                        <span>Attention : Ce bloc chevauche la <strong>zone de sécurité du pli central (160–180 mm)</strong>.</span>
                    </div>
                ` : '';

                // Common Geometry Controls (X, Y, W, H in mm) + Alignment Buttons
                let html = `
                    ${lockNoticeHTML}
                    ${foldWarningHTML}
                    <!-- Quick Panel Alignment -->
                    <div>
                        <label class="text-[10px] font-bold uppercase text-gray-400 block mb-1.5">Alignement Rapide Panneau (17×30 cm)</label>
                        <div class="grid grid-cols-3 gap-1.5">
                            <button onclick="app.alignSelected('center_left_panel')" class="bg-idInput hover:bg-white/10 border border-idBorder rounded py-1 text-[10px] text-gray-200" title="Centrer sur le panneau gauche (X=85mm)">
                                <i class="fa-solid fa-align-center mr-1 text-cyan-400"></i>Centre G.
                            </button>
                            <button onclick="app.alignSelected('center_right_panel')" class="bg-idInput hover:bg-white/10 border border-idBorder rounded py-1 text-[10px] text-gray-200" title="Centrer sur le panneau droit (X=255mm)">
                                <i class="fa-solid fa-align-center mr-1 text-cyan-400"></i>Centre D.
                            </button>
                            <button onclick="app.alignSelected('full_bleed')" class="bg-idInput hover:bg-white/10 border border-idBorder rounded py-1 text-[10px] text-red-300" title="Étendre au fond perdu (-3mm à 343mm)">
                                Fond Perdu
                            </button>
                        </div>
                    </div>

                    <!-- Coordinates in mm -->
                    <div class="grid grid-cols-2 gap-2 bg-idInput p-2.5 rounded border border-idBorder font-mono text-[11px]">
                        <div>
                            <label class="text-gray-400 text-[10px] block">Position X (mm)</label>
                            <input type="number" step="0.5" value="${obj.x}" onchange="app.updateObjProp('x', parseFloat(this.value), false)" class="w-full bg-idPanel border border-idBorder rounded px-2 py-1 text-white">
                        </div>
                        <div>
                            <label class="text-gray-400 text-[10px] block">Position Y (mm)</label>
                            <input type="number" step="0.5" value="${obj.y}" onchange="app.updateObjProp('y', parseFloat(this.value), false)" class="w-full bg-idPanel border border-idBorder rounded px-2 py-1 text-white">
                        </div>
                        <div>
                            <label class="text-gray-400 text-[10px] block">Largeur L (mm)</label>
                            <input type="number" step="0.5" min="8" value="${obj.w}" onchange="app.updateObjProp('w', parseFloat(this.value), false)" class="w-full bg-idPanel border border-idBorder rounded px-2 py-1 text-white">
                        </div>
                        <div>
                            <label class="text-gray-400 text-[10px] block">Hauteur H (mm)</label>
                            <input type="number" step="0.5" min="6" value="${obj.h}" onchange="app.updateObjProp('h', parseFloat(this.value), false)" class="w-full bg-idPanel border border-idBorder rounded px-2 py-1 text-white">
                        </div>
                    </div>
                `;

                // Type-Specific Inspector Fields
                if (obj.type === 'vertical_banner') {
                    html += `
                        <div class="space-y-2.5 border-t border-idBorder pt-3">
                            <div>
                                <label class="text-gray-400 text-[11px] block mb-1">Texte du Bandeau Vertical</label>
                                <input type="text" value="${escapeHTML(obj.text || '')}" oninput="app.updateObjProp('text', this.value, true)" onchange="app.updateObjProp('text', this.value, false)" class="w-full bg-idInput border border-idBorder rounded px-2.5 py-1.5 text-white font-semibold">
                            </div>
                            <div class="grid grid-cols-2 gap-2">
                                <div>
                                    <label class="text-gray-400 text-[10px] block mb-1">Couleur Fond</label>
                                    <input type="color" value="${safeHex(obj.bgColor, '#9a3412')}" oninput="app.updateObjProp('bgColor', this.value, true)" onchange="app.updateObjProp('bgColor', this.value, false)" class="w-full h-8 rounded bg-idInput border border-idBorder cursor-pointer">
                                </div>
                                <div>
                                    <label class="text-gray-400 text-[10px] block mb-1">Couleur Texte</label>
                                    <input type="color" value="${safeHex(obj.textColor, '#ffffff')}" oninput="app.updateObjProp('textColor', this.value, true)" onchange="app.updateObjProp('textColor', this.value, false)" class="w-full h-8 rounded bg-idInput border border-idBorder cursor-pointer">
                                </div>
                            </div>
                            <div class="grid grid-cols-2 gap-2">
                                <div>
                                    <label class="text-gray-400 text-[10px] block mb-1">Taille Police (pt)</label>
                                    <input type="number" min="5" step="0.5" value="${obj.fontSize || 12}" onchange="app.updateObjProp('fontSize', parseFloat(this.value), false)" class="w-full bg-idInput border border-idBorder rounded px-2 py-1 text-white">
                                </div>
                                <div>
                                    <label class="text-gray-400 text-[10px] block mb-1">Arrondi (mm)</label>
                                    <input type="number" min="0" step="0.5" value="${obj.radius ?? 3}" onchange="app.updateObjProp('radius', parseFloat(this.value), false)" class="w-full bg-idInput border border-idBorder rounded px-2 py-1 text-white">
                                </div>
                            </div>
                        </div>
                    `;
                }
                else if (obj.type === 'dish_item') {
                    const dishOptions = this.engine.dishesDB.map(d =>
                        `<option value="${escapeHTML(d.id)}" ${d.id === obj.dishId ? 'selected' : ''}>[${escapeHTML(d.category)}] ${escapeHTML(d.name)} (${escapeHTML(d.price)})</option>`
                    ).join('');
                    html += `
                        <div class="space-y-2.5 border-t border-idBorder pt-3">
                            <div class="bg-emerald-500/10 border border-emerald-500/30 p-2 rounded">
                                <label class="text-emerald-300 font-semibold text-[11px] block mb-1">
                                    <i class="fa-solid fa-link mr-1"></i>Plat lié (Base de Données Centrale)
                                </label>
                                <select onchange="app.updateObjProp('dishId', this.value, false)" class="w-full bg-idInput border border-idBorder rounded px-2 py-1.5 text-white text-[11px]">
                                    ${dishOptions || '<option value="">Aucun plat en base</option>'}
                                </select>
                                <button onclick="app.openDatabaseModal()" class="mt-2 w-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 py-1 rounded text-[10px] font-semibold">
                                    Modifier le texte/prix dans la BDD Centrale
                                </button>
                            </div>
                            <div class="grid grid-cols-3 gap-2">
                                <div>
                                    <label class="text-gray-400 text-[10px] block mb-1">Nom Plat</label>
                                    <input type="color" value="${safeHex(obj.textColor, '#1e293b')}" oninput="app.updateObjProp('textColor', this.value, true)" onchange="app.updateObjProp('textColor', this.value, false)" class="w-full h-7 rounded bg-idInput border border-idBorder">
                                </div>
                                <div>
                                    <label class="text-gray-400 text-[10px] block mb-1">Description</label>
                                    <input type="color" value="${safeHex(obj.descColor, '#64748b')}" oninput="app.updateObjProp('descColor', this.value, true)" onchange="app.updateObjProp('descColor', this.value, false)" class="w-full h-7 rounded bg-idInput border border-idBorder">
                                </div>
                                <div>
                                    <label class="text-gray-400 text-[10px] block mb-1">Prix</label>
                                    <input type="color" value="${safeHex(obj.priceColor, '#9a3412')}" oninput="app.updateObjProp('priceColor', this.value, true)" onchange="app.updateObjProp('priceColor', this.value, false)" class="w-full h-7 rounded bg-idInput border border-idBorder">
                                </div>
                            </div>
                            <div>
                                <label class="text-gray-400 text-[10px] block mb-1">Taille Police (pt)</label>
                                <input type="number" min="6" step="0.5" value="${obj.fontSize || 11}" onchange="app.updateObjProp('fontSize', parseFloat(this.value), false)" class="w-full bg-idInput border border-idBorder rounded px-2 py-1 text-white">
                            </div>
                        </div>
                    `;
                }
                else if (obj.type === 'category_list') {
                    const cats = this.engine.getCategories();
                    const catMissing = obj.category && !cats.includes(obj.category);
                    const catOptions = (catMissing ? `<option value="${escapeHTML(obj.category)}" selected>${escapeHTML(obj.category)} (aucun plat)</option>` : '') +
                        cats.map(c => `<option value="${escapeHTML(c)}" ${c === obj.category ? 'selected' : ''}>${escapeHTML(c)}</option>`).join('');
                    html += `
                        <div class="space-y-2.5 border-t border-idBorder pt-3">
                            <div class="bg-blue-500/10 border border-blue-500/30 p-2 rounded space-y-2">
                                <label class="text-blue-300 font-semibold text-[11px] block">
                                    <i class="fa-solid fa-database mr-1"></i>Catégorie liée à la Base de Données
                                </label>
                                <select onchange="app.updateObjProp('category', this.value, false)" class="w-full bg-idInput border border-idBorder rounded px-2 py-1.5 text-white">
                                    ${catOptions}
                                </select>
                                <input type="text" value="${escapeHTML(obj.title || '')}" placeholder="Sous-titre de section" oninput="app.updateObjProp('title', this.value, true)" onchange="app.updateObjProp('title', this.value, false)" class="w-full bg-idInput border border-idBorder rounded px-2 py-1 text-white">
                            </div>
                            <div class="grid grid-cols-2 gap-2">
                                <div>
                                    <label class="text-gray-400 text-[10px] block mb-1">Couleur Titre</label>
                                    <input type="color" value="${safeHex(obj.titleColor, '#9a3412')}" oninput="app.updateObjProp('titleColor', this.value, true)" onchange="app.updateObjProp('titleColor', this.value, false)" class="w-full h-7 rounded bg-idInput border border-idBorder">
                                </div>
                                <div>
                                    <label class="text-gray-400 text-[10px] block mb-1">Couleur Plats</label>
                                    <input type="color" value="${safeHex(obj.textColor, '#1e293b')}" oninput="app.updateObjProp('textColor', this.value, true)" onchange="app.updateObjProp('textColor', this.value, false)" class="w-full h-7 rounded bg-idInput border border-idBorder">
                                </div>
                                <div>
                                    <label class="text-gray-400 text-[10px] block mb-1">Couleur Desc.</label>
                                    <input type="color" value="${safeHex(obj.descColor, '#64748b')}" oninput="app.updateObjProp('descColor', this.value, true)" onchange="app.updateObjProp('descColor', this.value, false)" class="w-full h-7 rounded bg-idInput border border-idBorder">
                                </div>
                                <div>
                                    <label class="text-gray-400 text-[10px] block mb-1">Couleur Prix</label>
                                    <input type="color" value="${safeHex(obj.priceColor, '#9a3412')}" oninput="app.updateObjProp('priceColor', this.value, true)" onchange="app.updateObjProp('priceColor', this.value, false)" class="w-full h-7 rounded bg-idInput border border-idBorder">
                                </div>
                            </div>
                            <div>
                                <label class="text-gray-400 text-[10px] block mb-1">Taille Police Plats (pt)</label>
                                <input type="number" min="6" step="0.5" value="${obj.fontSize || 10.5}" onchange="app.updateObjProp('fontSize', parseFloat(this.value), false)" class="w-full bg-idInput border border-idBorder rounded px-2 py-1 text-white">
                            </div>
                            ${(() => {
                                if (typeof WordMenuImporter === 'undefined') return '';
                                const allDishes = this.engine.getDishesByCategory(obj.category);
                                const dishes = (obj.sliceStart !== undefined || obj.sliceEnd !== undefined)
                                    ? allDishes.slice(obj.sliceStart || 0, obj.sliceEnd)
                                    : allDishes;
                                const estimatedH = WordMenuImporter.estimateBlockHeightMm(dishes, Boolean(obj.title));
                                if (estimatedH > obj.h + 2) {
                                    return `
                                        <div class="bg-red-500/15 border border-red-500/40 text-red-300 p-2 rounded text-[10px] space-y-1.5 mt-2">
                                            <div class="flex items-center space-x-1.5 font-bold">
                                                <i class="fa-solid fa-triangle-exclamation text-red-400"></i>
                                                <span>Débordement : ${dishes.length} plats nécessitent ≈ ${Math.round(estimatedH)} mm (hauteur : ${obj.h} mm).</span>
                                            </div>
                                            <button onclick="app.updateObjProp('h', ${Math.round(estimatedH)}); app.renderInspector();" class="w-full bg-red-600 hover:bg-red-500 text-white py-1 rounded font-bold text-[10px] shadow">
                                                Ajuster la hauteur à ${Math.round(estimatedH)} mm
                                            </button>
                                        </div>
                                    `;
                                }
                                return '';
                            })()}
                        </div>
                    `;
                }
                else if (obj.type === 'badge_new') {
                    html += `
                        <div class="space-y-2.5 border-t border-idBorder pt-3">
                            <div>
                                <label class="text-gray-400 text-[11px] block mb-1">Texte du Badge</label>
                                <input type="text" value="${escapeHTML(obj.text ?? 'NOUVEAU')}" oninput="app.updateObjProp('text', this.value, true)" onchange="app.updateObjProp('text', this.value, false)" class="w-full bg-idInput border border-idBorder rounded px-2.5 py-1.5 text-white font-bold">
                            </div>
                            <div class="grid grid-cols-2 gap-2">
                                <div>
                                    <label class="text-gray-400 text-[10px] block mb-1">Fond Badge</label>
                                    <input type="color" value="${safeHex(obj.bgColor, '#e11d48')}" oninput="app.updateObjProp('bgColor', this.value, true)" onchange="app.updateObjProp('bgColor', this.value, false)" class="w-full h-8 rounded bg-idInput border border-idBorder">
                                </div>
                                <div>
                                    <label class="text-gray-400 text-[10px] block mb-1">Couleur Texte</label>
                                    <input type="color" value="${safeHex(obj.textColor, '#ffffff')}" oninput="app.updateObjProp('textColor', this.value, true)" onchange="app.updateObjProp('textColor', this.value, false)" class="w-full h-8 rounded bg-idInput border border-idBorder">
                                </div>
                            </div>
                            <div>
                                <label class="text-gray-400 text-[10px] block mb-1">Arrondi (mm)</label>
                                <input type="number" min="0" step="0.5" value="${obj.radius ?? 10}" onchange="app.updateObjProp('radius', parseFloat(this.value), false)" class="w-full bg-idInput border border-idBorder rounded px-2 py-1 text-white">
                            </div>
                        </div>
                    `;
                }
                else if (obj.type === 'photo') {
                    html += `
                        <div class="space-y-2.5 border-t border-idBorder pt-3">
                            <div>
                                <label class="text-gray-400 text-[11px] block mb-1">Importer une photo locale</label>
                                <input type="file" accept="image/*" onchange="app.uploadPhotoFile(event)" class="w-full text-[10px] text-gray-300 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-blue-600 file:text-white cursor-pointer">
                            </div>
                            <div>
                                <label class="text-gray-400 text-[11px] block mb-1">Ou URL de la photo</label>
                                <input type="text" value="${escapeHTML(obj.imageUrl || '')}" onchange="app.updateObjProp('imageUrl', this.value, false)" class="w-full bg-idInput border border-idBorder rounded px-2 py-1 text-white font-mono text-[10px]">
                            </div>
                            <div>
                                <label class="text-gray-400 text-[11px] block mb-1">Légende de la photo</label>
                                <input type="text" value="${escapeHTML(obj.caption || '')}" oninput="app.updateObjProp('caption', this.value, true)" onchange="app.updateObjProp('caption', this.value, false)" class="w-full bg-idInput border border-idBorder rounded px-2 py-1 text-white">
                            </div>
                            <div class="grid grid-cols-3 gap-2">
                                <div>
                                    <label class="text-gray-400 text-[10px] block mb-1">Arrondi (mm)</label>
                                    <input type="number" min="0" step="0.5" value="${obj.radius ?? 0}" onchange="app.updateObjProp('radius', parseFloat(this.value), false)" class="w-full bg-idInput border border-idBorder rounded px-2 py-1 text-white">
                                </div>
                                <div>
                                    <label class="text-gray-400 text-[10px] block mb-1">Bordure (px)</label>
                                    <input type="number" min="0" step="0.5" value="${obj.borderWidth ?? 1.5}" onchange="app.updateObjProp('borderWidth', parseFloat(this.value), false)" class="w-full bg-idInput border border-idBorder rounded px-2 py-1 text-white">
                                </div>
                                <div>
                                    <label class="text-gray-400 text-[10px] block mb-1">Couleur</label>
                                    <input type="color" value="${safeHex(obj.borderColor, '#c8a96a')}" oninput="app.updateObjProp('borderColor', this.value, true)" onchange="app.updateObjProp('borderColor', this.value, false)" class="w-full h-7 rounded bg-idInput border border-idBorder">
                                </div>
                            </div>
                        </div>
                    `;
                }
                else if (obj.type === 'logo') {
                    html += `
                        <div class="space-y-2.5 border-t border-idBorder pt-3">
                            <div>
                                <label class="text-gray-400 text-[11px] block mb-1">Nom de l'Établissement</label>
                                <input type="text" value="${escapeHTML(obj.title || '')}" oninput="app.updateObjProp('title', this.value, true)" onchange="app.updateObjProp('title', this.value, false)" class="w-full bg-idInput border border-idBorder rounded px-2 py-1 text-white font-bold">
                            </div>
                            <div>
                                <label class="text-gray-400 text-[11px] block mb-1">Sous-titre / Slogan</label>
                                <input type="text" value="${escapeHTML(obj.subtitle || '')}" oninput="app.updateObjProp('subtitle', this.value, true)" onchange="app.updateObjProp('subtitle', this.value, false)" class="w-full bg-idInput border border-idBorder rounded px-2 py-1 text-white">
                            </div>
                            <div>
                                <label class="text-gray-400 text-[10px] block mb-1">Couleur Or / Emblème</label>
                                <input type="color" value="${safeHex(obj.color, '#c8a96a')}" oninput="app.updateObjProp('color', this.value, true)" onchange="app.updateObjProp('color', this.value, false)" class="w-full h-8 rounded bg-idInput border border-idBorder">
                            </div>
                        </div>
                    `;
                }
                else if (obj.type === 'text') {
                    html += `
                        <div class="space-y-2.5 border-t border-idBorder pt-3">
                            <div>
                                <label class="text-gray-400 text-[11px] block mb-1">Contenu du Texte</label>
                                <textarea rows="3" oninput="app.updateObjProp('text', this.value, true)" onchange="app.updateObjProp('text', this.value, false)" class="w-full bg-idInput border border-idBorder rounded p-2 text-white">${escapeHTML(obj.text || '')}</textarea>
                            </div>
                            <div class="grid grid-cols-2 gap-2">
                                <div>
                                    <label class="text-gray-400 text-[10px] block mb-1">Police</label>
                                    <select onchange="app.updateObjProp('fontFamily', this.value, false)" class="w-full bg-idInput border border-idBorder rounded px-2 py-1 text-white">
                                        <option value="Playfair Display" ${obj.fontFamily === 'Playfair Display' ? 'selected' : ''}>Playfair Display</option>
                                        <option value="Cinzel" ${obj.fontFamily === 'Cinzel' ? 'selected' : ''}>Cinzel</option>
                                        <option value="Cormorant Garamond" ${obj.fontFamily === 'Cormorant Garamond' ? 'selected' : ''}>Cormorant</option>
                                        <option value="Montserrat" ${obj.fontFamily === 'Montserrat' ? 'selected' : ''}>Montserrat</option>
                                        <option value="Inter" ${obj.fontFamily === 'Inter' ? 'selected' : ''}>Inter</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="text-gray-400 text-[10px] block mb-1">Taille (pt)</label>
                                    <input type="number" min="5" step="0.5" value="${obj.fontSize || 12}" onchange="app.updateObjProp('fontSize', parseFloat(this.value), false)" class="w-full bg-idInput border border-idBorder rounded px-2 py-1 text-white">
                                </div>
                            </div>
                            <div class="grid grid-cols-3 gap-2">
                                <div>
                                    <label class="text-gray-400 text-[10px] block mb-1">Couleur</label>
                                    <input type="color" value="${safeHex(obj.color, '#1e293b')}" oninput="app.updateObjProp('color', this.value, true)" onchange="app.updateObjProp('color', this.value, false)" class="w-full h-7 rounded bg-idInput border border-idBorder">
                                </div>
                                <div>
                                    <label class="text-gray-400 text-[10px] block mb-1">Alignement</label>
                                    <select onchange="app.updateObjProp('align', this.value, false)" class="w-full bg-idInput border border-idBorder rounded px-1.5 py-1 text-white">
                                        <option value="left" ${obj.align === 'left' ? 'selected' : ''}>Gauche</option>
                                        <option value="center" ${obj.align === 'center' ? 'selected' : ''}>Centré</option>
                                        <option value="right" ${obj.align === 'right' ? 'selected' : ''}>Droite</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="text-gray-400 text-[10px] block mb-1">Graisse</label>
                                    <select onchange="app.updateObjProp('fontWeight', this.value, false)" class="w-full bg-idInput border border-idBorder rounded px-1.5 py-1 text-white">
                                        <option value="400" ${String(obj.fontWeight) === '400' ? 'selected' : ''}>Normal</option>
                                        <option value="500" ${String(obj.fontWeight || '500') === '500' ? 'selected' : ''}>Medium</option>
                                        <option value="600" ${String(obj.fontWeight) === '600' ? 'selected' : ''}>Semi-Gras</option>
                                        <option value="700" ${String(obj.fontWeight) === '700' ? 'selected' : ''}>Gras</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    `;
                }
                else if (obj.type === 'shape') {
                    const bgTransparent = !obj.bgColor || obj.bgColor === 'transparent';
                    const borderTransparent = obj.borderColor === 'transparent';
                    html += `
                        <div class="space-y-2.5 border-t border-idBorder pt-3">
                            <div class="flex items-center justify-between text-[10px] text-gray-300">
                                <label class="flex items-center space-x-1.5 cursor-pointer">
                                    <input type="checkbox" ${bgTransparent ? 'checked' : ''} onchange="app.updateObjProp('bgColor', this.checked ? 'transparent' : '#ffffff', false); app.renderInspector()">
                                    <span>Fond transparent</span>
                                </label>
                                <label class="flex items-center space-x-1.5 cursor-pointer">
                                    <input type="checkbox" ${borderTransparent ? 'checked' : ''} onchange="app.updateObjProp('borderColor', this.checked ? 'transparent' : '#c8a96a', false); app.renderInspector()">
                                    <span>Sans bordure</span>
                                </label>
                            </div>
                            <div class="grid grid-cols-2 gap-2">
                                <div>
                                    <label class="text-gray-400 text-[10px] block mb-1">Couleur Fond</label>
                                    <input type="color" value="${safeHex(obj.bgColor, '#1e293b')}" oninput="app.updateObjProp('bgColor', this.value, true)" onchange="app.updateObjProp('bgColor', this.value, false); app.renderInspector()" class="w-full h-8 rounded bg-idInput border border-idBorder">
                                </div>
                                <div>
                                    <label class="text-gray-400 text-[10px] block mb-1">Couleur Bordure</label>
                                    <input type="color" value="${safeHex(obj.borderColor, '#c8a96a')}" oninput="app.updateObjProp('borderColor', this.value, true)" onchange="app.updateObjProp('borderColor', this.value, false); app.renderInspector()" class="w-full h-8 rounded bg-idInput border border-idBorder">
                                </div>
                            </div>
                            <div class="grid grid-cols-3 gap-2">
                                <div>
                                    <label class="text-gray-400 text-[10px] block mb-1">Filet (px)</label>
                                    <input type="number" min="0" step="0.5" value="${obj.borderWidth || 0}" onchange="app.updateObjProp('borderWidth', parseFloat(this.value), false)" class="w-full bg-idInput border border-idBorder rounded px-2 py-1 text-white">
                                </div>
                                <div>
                                    <label class="text-gray-400 text-[10px] block mb-1">Arrondi (mm)</label>
                                    <input type="number" min="0" step="0.5" value="${obj.radius ?? 0}" onchange="app.updateObjProp('radius', parseFloat(this.value), false)" class="w-full bg-idInput border border-idBorder rounded px-2 py-1 text-white">
                                </div>
                                <div>
                                    <label class="text-gray-400 text-[10px] block mb-1">Opacité (%)</label>
                                    <input type="number" min="5" max="100" step="5" value="${Math.round((obj.opacity ?? 1) * 100)}" onchange="app.updateObjProp('opacity', Math.max(0.05, Math.min(1, parseFloat(this.value) / 100)), false)" class="w-full bg-idInput border border-idBorder rounded px-2 py-1 text-white">
                                </div>
                            </div>
                        </div>
                    `;
                }
                else if (obj.type === 'illustration') {
                    const item = typeof CanvaIllustrationsPack !== 'undefined' ? CanvaIllustrationsPack.getById(obj.svgKey || obj.illustrationId) : null;
                    const illuColor = safeHex(obj.color, item ? (item.defaultColor || '#c8a96a') : '#c8a96a');
                    const quickColors = ['#c8a96a', '#9a3412', '#1e293b', '#e11d48', '#059669', '#2563eb', '#ffffff', '#000000'];

                    html += `
                        <div class="space-y-3 border-t border-idBorder pt-3">
                            <div class="bg-idInput p-2.5 rounded border border-idBorder flex items-center space-x-2.5">
                                <div class="w-10 h-10 rounded bg-black/40 border border-idBorder p-1 flex items-center justify-center shrink-0">
                                    ${item ? CanvaIllustrationsPack.buildSVGString(item, { color: illuColor }) : '<i class="fa-solid fa-shapes text-amber-400"></i>'}
                                </div>
                                <div class="flex-1 min-w-0">
                                    <div class="font-bold text-white text-xs truncate">${escapeHTML(item ? item.name : (obj.name || 'Illustration Canva'))}</div>
                                    <div class="text-[10px] text-amber-400 font-mono">Pack Vectoriel Canva</div>
                                </div>
                            </div>

                            <!-- Color Palette -->
                            <div>
                                <label class="text-gray-400 text-[10px] block mb-1">Couleur Principale :</label>
                                <div class="flex items-center space-x-1.5 mb-2">
                                    <input type="color" value="${illuColor}" oninput="app.updateObjProp('color', this.value, true)" onchange="app.updateObjProp('color', this.value, false); app.renderInspector()" class="w-8 h-8 rounded bg-idInput border border-idBorder cursor-pointer">
                                    <input type="text" value="${escapeHTML(obj.color || illuColor)}" onchange="app.updateObjProp('color', this.value, false); app.renderInspector()" class="flex-1 bg-idInput border border-idBorder rounded px-2 py-1 font-mono text-xs text-white">
                                </div>
                                <div class="flex items-center space-x-1">
                                    ${quickColors.map(c => `
                                        <button onclick="app.updateObjProp('color', '${c}', false); app.renderInspector()" style="background-color: ${c};" class="w-5 h-5 rounded-full border border-gray-600 hover:scale-125 transition shrink-0" title="${c}"></button>
                                    `).join('')}
                                </div>
                            </div>

                            <!-- Flip & Rotate -->
                            <div>
                                <label class="text-gray-400 text-[10px] block mb-1">Orientation & Miroir :</label>
                                <div class="grid grid-cols-2 gap-2">
                                    <button onclick="app.updateObjProp('flipH', !app.selectedObject.flipH, false); app.renderInspector()" class="px-2 py-1.5 bg-idInput hover:bg-white/10 rounded border border-idBorder text-[11px] text-gray-200 flex items-center justify-center space-x-1.5 ${obj.flipH ? 'border-blue-500 bg-blue-500/20 text-blue-300' : ''}">
                                        <i class="fa-solid fa-arrows-left-right"></i>
                                        <span>Miroir Horiz.</span>
                                    </button>
                                    <button onclick="app.updateObjProp('flipV', !app.selectedObject.flipV, false); app.renderInspector()" class="px-2 py-1.5 bg-idInput hover:bg-white/10 rounded border border-idBorder text-[11px] text-gray-200 flex items-center justify-center space-x-1.5 ${obj.flipV ? 'border-blue-500 bg-blue-500/20 text-blue-300' : ''}">
                                        <i class="fa-solid fa-arrows-up-down"></i>
                                        <span>Miroir Vert.</span>
                                    </button>
                                </div>
                            </div>

                            <!-- Opacity -->
                            <div>
                                <div class="flex justify-between text-[10px] text-gray-400 mb-1">
                                    <span>Transparence / Opacité :</span>
                                    <span class="font-mono text-white">${Math.round((obj.opacity ?? 1) * 100)}%</span>
                                </div>
                                <input type="range" min="10" max="100" step="5" value="${Math.round((obj.opacity ?? 1) * 100)}" oninput="app.updateObjProp('opacity', parseFloat(this.value) / 100, true)" onchange="app.updateObjProp('opacity', parseFloat(this.value) / 100, false); app.renderInspector()" class="w-full accent-amber-500">
                            </div>
                        </div>
                    `;
                }
                else if (obj.type === 'page_number') {
                    html += `
                        <div class="space-y-3 border-t border-idBorder pt-3">
                            <div>
                                <label class="text-gray-400 text-[10px] block mb-1">Texte du numéro :</label>
                                <input type="text" value="${escapeHTML(obj.text || 'Page 1')}" onchange="app.updateObjProp('text', this.value, false)" class="w-full bg-idInput border border-idBorder rounded px-2.5 py-1.5 text-xs text-white font-mono">
                            </div>
                            <div class="grid grid-cols-2 gap-2">
                                <div>
                                    <label class="text-gray-400 text-[10px] block mb-1">Police</label>
                                    <select onchange="app.updateObjProp('fontFamily', this.value, false)" class="w-full bg-idInput border border-idBorder rounded px-2 py-1 text-xs text-white">
                                        <option value="Montserrat" ${obj.fontFamily === 'Montserrat' ? 'selected' : ''}>Montserrat</option>
                                        <option value="Playfair Display" ${obj.fontFamily === 'Playfair Display' ? 'selected' : ''}>Playfair Display</option>
                                        <option value="Cinzel" ${obj.fontFamily === 'Cinzel' ? 'selected' : ''}>Cinzel</option>
                                        <option value="Inter" ${obj.fontFamily === 'Inter' ? 'selected' : ''}>Inter</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="text-gray-400 text-[10px] block mb-1">Taille (pt)</label>
                                    <input type="number" min="6" max="24" step="0.5" value="${obj.fontSize || 8.5}" onchange="app.updateObjProp('fontSize', parseFloat(this.value), false)" class="w-full bg-idInput border border-idBorder rounded px-2 py-1 text-xs text-white">
                                </div>
                            </div>
                            <div>
                                <label class="text-gray-400 text-[10px] block mb-1">Couleur</label>
                                <div class="flex items-center space-x-2">
                                    <input type="color" value="${safeHex(obj.color, '#64748b')}" oninput="app.updateObjProp('color', this.value, true)" onchange="app.updateObjProp('color', this.value, false); app.renderInspector()" class="w-8 h-8 rounded bg-idInput border border-idBorder cursor-pointer">
                                    <input type="text" value="${escapeHTML(obj.color || '#64748b')}" onchange="app.updateObjProp('color', this.value, false)" class="flex-1 bg-idInput border border-idBorder rounded px-2 py-1 font-mono text-xs text-white">
                                </div>
                            </div>
                        </div>
                    `;
                }

                // Duplicate, Lock & Delete Actions
                html += `
                    <div class="pt-3 border-t border-idBorder flex space-x-2">
                        <button onclick="app.toggleLockSelected()" class="px-2.5 bg-idInput hover:bg-white/10 ${obj.locked ? 'text-amber-400 border-amber-500/60' : 'text-gray-300 border-idBorder'} border py-1.5 rounded font-medium text-[11px]" title="${obj.locked ? 'Déverrouiller ce bloc' : 'Verrouiller ce bloc (protège contre déplacement et suppression)'}">
                            <i class="fa-solid ${obj.locked ? 'fa-lock' : 'fa-lock-open'} mr-1"></i> ${obj.locked ? 'Déverrouiller' : 'Verrouiller'}
                        </button>
                        <button onclick="app.duplicateSelected()" class="flex-1 bg-idInput hover:bg-white/10 text-gray-200 border border-idBorder py-1.5 rounded font-medium text-[11px]">
                            <i class="fa-regular fa-clone mr-1"></i> Dupliquer
                        </button>
                        <button onclick="app.deleteSelected()" class="flex-1 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 py-1.5 rounded font-medium text-[11px]">
                            <i class="fa-regular fa-trash-can mr-1"></i> Supprimer
                        </button>
                    </div>
                `;

                container.innerHTML = html;
            }

            updateObjProp(prop, val, debounce = false) {
                const obj = this.selectedObject;
                if (!obj) return;

                const numericProps = ['x', 'y', 'w', 'h', 'fontSize', 'radius', 'borderWidth', 'opacity', 'rotate'];
                if (numericProps.includes(prop)) {
                    if (typeof val !== 'number' || !Number.isFinite(val)) return;
                    if (prop === 'w') val = Math.max(4, val);
                    else if (prop === 'h') val = Math.max(4, val);
                    else if (prop === 'fontSize') val = Math.max(5, val);
                    else if (prop === 'radius' || prop === 'borderWidth') val = Math.max(0, val);
                    else if (prop === 'opacity') val = Math.max(0.05, Math.min(1, val));
                }
                if (prop === 'flipH' || prop === 'flipV') {
                    val = Boolean(val);
                }

                if (prop === 'imageUrl') {
                    const trimmed = String(val ?? '').trim();
                    if (trimmed && !sanitizeUrl(trimmed)) {
                        this.showToast('URL d\'image invalide (utilisez https://, data:image/ ou blob:)');
                        this.renderInspector();
                        return;
                    }
                    val = trimmed;
                }

                obj[prop] = val;

                if (debounce) {
                    this.renderCurrentFace();
                    this.commitStateDebounced();
                } else {
                    this.commitState(false);
                    if (['x', 'y', 'w', 'h', 'category', 'dishId'].includes(prop)) {
                        this.renderInspector();
                    }
                }
            }

            updateFaceBgColor(color, debounce = false) {
                if (!color || typeof color !== 'string') return;
                this.currentFace.bgColor = color.trim();
                if (debounce) {
                    this.renderCurrentFace();
                    this.commitStateDebounced();
                } else {
                    this.commitState(false);
                    this.renderInspector();
                }
            }

            uploadPhotoFile(event) {
                const input = event.target;
                const file = input.files && input.files[0];
                if (!file || !this.selectedObject || this.selectedObject.type !== 'photo') {
                    if (input) input.value = '';
                    return;
                }
                if (file.type && !file.type.startsWith('image/')) {
                    this.showToast('Format d\'image non supporté');
                    input.value = '';
                    return;
                }
                const targetObj = this.selectedObject;
                const reader = new FileReader();
                reader.onload = async (e) => {
                    let dataUrl = e.target.result;
                    try {
                        dataUrl = await this.downscaleImageDataUrl(dataUrl, file);
                    } catch (err) {
                        console.warn('Compression photo impossible, image originale conservée :', err);
                    }
                    targetObj.imageUrl = dataUrl;
                    this.commitState(false);
                    this.renderInspector();
                    if (!this.engine.lastSaveSuccess) {
                        this.showToast('Photo ajoutée, mais le stockage local est plein : exportez le projet en JSON.');
                    }
                };
                reader.onerror = () => {
                    this.showToast('Erreur lors du chargement de la photo');
                };
                reader.readAsDataURL(file);
                input.value = '';
            }

            /**
             * Réduit les photos très lourdes avant stockage (localStorage limité à ~5 Mo).
             * 2400 px sur le grand côté suffisent pour ≈ 200 mm à 300 DPI.
             * Les PNG/GIF/SVG légers sont conservés tels quels (transparence).
             */
            downscaleImageDataUrl(dataUrl, file, maxSide = 2400, maxBytes = 1.2 * 1024 * 1024) {
                return new Promise((resolve, reject) => {
                    const isLight = file.size <= maxBytes;
                    const keepsAlpha = /image\/(png|gif|svg\+xml|webp)/i.test(file.type || '');
                    const img = new Image();
                    img.onload = () => {
                        const longSide = Math.max(img.naturalWidth, img.naturalHeight);
                        if (isLight && longSide <= maxSide) return resolve(dataUrl);
                        if (keepsAlpha && isLight) return resolve(dataUrl);
                        const ratio = Math.min(1, maxSide / longSide);
                        const c = document.createElement('canvas');
                        c.width = Math.max(1, Math.round(img.naturalWidth * ratio));
                        c.height = Math.max(1, Math.round(img.naturalHeight * ratio));
                        const cx = c.getContext('2d');
                        if (keepsAlpha) {
                            cx.drawImage(img, 0, 0, c.width, c.height);
                            const mime = /webp/i.test(file.type || '') ? 'image/webp' : 'image/png';
                            const out = c.toDataURL(mime);
                            c.width = c.height = 0;
                            resolve(out.length < dataUrl.length ? out : dataUrl);
                        } else {
                            cx.fillStyle = '#ffffff';
                            cx.fillRect(0, 0, c.width, c.height);
                            cx.drawImage(img, 0, 0, c.width, c.height);
                            const out = c.toDataURL('image/jpeg', 0.9);
                            c.width = c.height = 0;
                            resolve(out.length < dataUrl.length ? out : dataUrl);
                        }
                    };
                    img.onerror = reject;
                    img.src = dataUrl;
                });
            }

            alignSelected(mode) {
                const obj = this.selectedObject;
                if (!obj) return;
                if (mode === 'center_left_panel') {
                    obj.x = +(85 - obj.w / 2).toFixed(1);
                } else if (mode === 'center_right_panel') {
                    obj.x = +(255 - obj.w / 2).toFixed(1);
                } else if (mode === 'full_bleed') {
                    obj.x = -3;
                    obj.y = -3;
                    obj.w = 346;
                    obj.h = 306;
                }
                this.commitState(false);
                this.renderInspector();
            }

            duplicateSelected() {
                const obj = this.selectedObject;
                if (!obj) return;
                const copy = JSON.parse(JSON.stringify(obj));
                copy.id = generateUniqueId('obj');
                copy.name = (copy.name || copy.type) + ' (Copie)';
                copy.x = +(copy.x + 8).toFixed(1);
                copy.y = +(copy.y + 8).toFixed(1);
                this.currentFace.objects.push(copy);
                this.selectedObjectId = copy.id;
                this.commitState(false);
                this.renderInspector();
            }

            toggleLockSelected(targetId = null) {
                const id = targetId || this.selectedObjectId;
                if (!id) return;
                const obj = this.currentFace.objects.find(o => o.id === id);
                if (!obj) return;
                obj.locked = !obj.locked;
                this.commitState(false);
                this.renderInspector();
            }

            deleteSelected() {
                if (!this.selectedObjectId) return;
                const obj = this.selectedObject;
                if (obj && obj.locked) {
                    this.showToast('Cet élément est verrouillé. Déverrouillez-le avant de le supprimer.');
                    return;
                }
                this.currentFace.objects = this.currentFace.objects.filter(o => o.id !== this.selectedObjectId);
                this.selectedObjectId = null;
                this.commitState(false);
                this.renderInspector();
            }

            updateTopTransformBar() {
                const obj = this.selectedObject;
                const locked = !obj || this.previewMode;
                const bar = document.getElementById('top-transform-bar');
                const bx = document.getElementById('bar-x');
                const by = document.getElementById('bar-y');
                const bw = document.getElementById('bar-w');
                const bh = document.getElementById('bar-h');
                if (!bx || !by || !bw || !bh) return;
                bx.disabled = locked;
                by.disabled = locked;
                bw.disabled = locked;
                bh.disabled = locked;
                if (bar) bar.classList.toggle('opacity-50', locked);
                bx.value = obj ? obj.x : 0;
                by.value = obj ? obj.y : 0;
                bw.value = obj ? obj.w : 340;
                bh.value = obj ? obj.h : 300;
            }

            updateSelectedFromTopBar() {
                const obj = this.selectedObject;
                if (!obj || this.previewMode) return;
                const nx = parseFloat(document.getElementById('bar-x').value);
                const ny = parseFloat(document.getElementById('bar-y').value);
                const nw = parseFloat(document.getElementById('bar-w').value);
                const nh = parseFloat(document.getElementById('bar-h').value);
                if (Number.isFinite(nx)) obj.x = nx;
                if (Number.isFinite(ny)) obj.y = ny;
                if (Number.isFinite(nw)) obj.w = Math.max(8, nw);
                if (Number.isFinite(nh)) obj.h = Math.max(6, nh);
                this.commitState(false);
                this.renderInspector();
            }

            // ==================== LAYERS & PAGES NAVIGATOR ====================
            renderLayersList() {
                const list = document.getElementById('layers-list');
                const objects = this.currentFace.objects;
                document.getElementById('layer-count').textContent = objects.length;

                list.innerHTML = [...objects].reverse().map(obj => {
                    const active = obj.id === this.selectedObjectId;
                    return `
                        <div data-obj-id="${escapeHTML(obj.id)}" onclick="app.selectObject(this.dataset.objId)" class="px-2.5 py-1.5 rounded flex items-center justify-between cursor-pointer ${
                            active ? 'bg-blue-600/30 border border-blue-500 text-white' : 'bg-idInput hover:bg-white/5 text-gray-300 border border-transparent'
                        }">
                            <div class="truncate flex items-center space-x-2 min-w-0">
                                <span class="w-2 h-2 rounded-full ${obj.locked ? 'bg-amber-400' : 'bg-blue-400'} shrink-0"></span>
                                <span class="truncate font-medium text-[11px]">${escapeHTML(obj.name || obj.type)}</span>
                            </div>
                            <div class="flex items-center space-x-2 shrink-0 ml-2">
                                <button type="button" onclick="event.stopPropagation(); app.toggleLockSelected('${escapeHTML(obj.id)}')" class="p-0.5 text-[10px] ${obj.locked ? 'text-amber-400' : 'text-gray-500 hover:text-gray-300'}" title="${obj.locked ? 'Déverrouiller' : 'Verrouiller'}">
                                    <i class="fa-solid ${obj.locked ? 'fa-lock' : 'fa-lock-open'}"></i>
                                </button>
                                <span class="font-mono text-[9px] text-gray-400">${obj.x},${obj.y}mm</span>
                            </div>
                        </div>
                    `;
                }).join('');
            }

            bringToFront() {
                const objs = this.currentFace.objects;
                const idx = objs.findIndex(o => o.id === this.selectedObjectId);
                if (idx >= 0 && idx < objs.length - 1) {
                    const [obj] = objs.splice(idx, 1);
                    objs.push(obj);
                    this.commitState(false);
                }
            }

            bringForward() {
                const objs = this.currentFace.objects;
                const idx = objs.findIndex(o => o.id === this.selectedObjectId);
                if (idx >= 0 && idx < objs.length - 1) {
                    [objs[idx], objs[idx + 1]] = [objs[idx + 1], objs[idx]];
                    this.commitState(false);
                }
            }

            sendBackward() {
                const objs = this.currentFace.objects;
                const idx = objs.findIndex(o => o.id === this.selectedObjectId);
                if (idx > 0) {
                    [objs[idx], objs[idx - 1]] = [objs[idx - 1], objs[idx]];
                    this.commitState(false);
                }
            }

            sendToBack() {
                const objs = this.currentFace.objects;
                const idx = objs.findIndex(o => o.id === this.selectedObjectId);
                if (idx > 0) {
                    const [obj] = objs.splice(idx, 1);
                    objs.unshift(obj);
                    this.commitState(false);
                }
            }

            renderSpreadsNavigator() {
                const container = document.getElementById('spreads-navigator-list');
                if (!container) return;

                const specs = this.engine.specs;
                let html = '';

                if (specs.hasFold) {
                    const sheetCount = Math.ceil(this.engine.faces.length / 2);
                    for (let sheet = 1; sheet <= sheetCount; sheet++) {
                        const rectoIdx = (sheet - 1) * 2;
                        const versoIdx = rectoIdx + 1;
                        const recto = this.engine.faces[rectoIdx];
                        const verso = this.engine.faces[versoIdx];

                        html += `
                            <div class="bg-idInput border border-idBorder rounded p-2 space-y-2">
                                <div class="flex items-center justify-between text-[11px] font-bold text-gray-200 border-b border-idBorder pb-1">
                                    <span><i class="fa-solid fa-scroll text-amber-400 mr-1"></i> Feuille ${sheet} (${specs.widthMm} × ${specs.heightMm} mm)</span>
                                    <span class="font-mono text-[9px] text-gray-400">Pli ${specs.foldXMm || 170}mm</span>
                                </div>
                                <div class="grid grid-cols-2 gap-2">
                                    <!-- Recto Miniature -->
                                    ${recto ? `
                                    <div onclick="app.goToFace(${rectoIdx})" class="cursor-pointer p-1.5 rounded border transition ${
                                        this.currentFaceIndex === rectoIdx ? 'border-blue-500 bg-blue-500/15' : 'border-idBorder hover:border-gray-500 bg-idPanel'
                                    }">
                                        <div class="h-14 w-full rounded-sm relative flex border border-black/40 overflow-hidden mb-1" style="background:${escapeHTML(recto.bgColor || '#fdfbf7')}">
                                            <div class="w-1/2 h-full border-r border-dashed border-cyan-500/70 flex items-center justify-center text-[8px] font-mono text-gray-500">Gauche</div>
                                            <div class="w-1/2 h-full flex items-center justify-center text-[8px] font-mono text-gray-500">Droite</div>
                                        </div>
                                        <div class="flex items-center justify-between text-[10px]">
                                            <span class="font-semibold text-white truncate">${escapeHTML(recto.name || 'Recto')}</span>
                                            <span class="text-gray-400 font-mono">${recto.objects.length} blocs</span>
                                        </div>
                                    </div>` : ''}

                                    <!-- Verso Miniature -->
                                    ${verso ? `
                                    <div onclick="app.goToFace(${versoIdx})" class="cursor-pointer p-1.5 rounded border transition ${
                                        this.currentFaceIndex === versoIdx ? 'border-blue-500 bg-blue-500/15' : 'border-idBorder hover:border-gray-500 bg-idPanel'
                                    }">
                                        <div class="h-14 w-full rounded-sm relative flex border border-black/40 overflow-hidden mb-1" style="background:${escapeHTML(verso.bgColor || '#fdfbf7')}">
                                            <div class="w-1/2 h-full border-r border-dashed border-cyan-500/70 flex items-center justify-center text-[8px] font-mono text-gray-500">Gauche</div>
                                            <div class="w-1/2 h-full flex items-center justify-center text-[8px] font-mono text-gray-500">Droite</div>
                                        </div>
                                        <div class="flex items-center justify-between text-[10px]">
                                            <span class="font-semibold text-white truncate">${escapeHTML(verso.name || 'Verso')}</span>
                                            <span class="text-gray-400 font-mono">${verso.objects.length} blocs</span>
                                        </div>
                                    </div>` : ''}
                                </div>
                            </div>
                        `;
                    }
                } else {
                    // Single Page Format (e.g. Flyer A4, Flyer A5)
                    html += `
                        <div class="flex items-center justify-between pb-1 mb-2">
                            <span class="text-[11px] font-bold text-cyan-300 uppercase tracking-wider">Pages du Flyer (${this.engine.faces.length})</span>
                            <button onclick="app.addNewPage()" class="px-2 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-semibold text-[10px] flex items-center space-x-1 shadow">
                                <i class="fa-solid fa-plus"></i>
                                <span>+ Page</span>
                            </button>
                        </div>
                        <div class="space-y-2">
                    `;
                    this.engine.faces.forEach((face, idx) => {
                        const isCurrent = this.currentFaceIndex === idx;
                        html += `
                            <div onclick="app.goToFace(${idx})" class="p-2 rounded-lg border cursor-pointer transition flex items-center justify-between ${
                                isCurrent ? 'border-cyan-400 bg-cyan-500/15 ring-1 ring-cyan-400' : 'border-idBorder bg-idInput hover:border-gray-500'
                            }">
                                <div class="flex items-center space-x-2.5 min-w-0">
                                    <div class="w-8 h-11 rounded border border-black/40 shrink-0 shadow-sm flex items-center justify-center text-[9px] font-bold font-mono text-gray-600" style="background:${escapeHTML(face.bgColor || '#ffffff')}">
                                        ${idx + 1}
                                    </div>
                                    <div class="min-w-0">
                                        <div class="font-bold text-white text-xs truncate">${escapeHTML(face.name)}</div>
                                        <div class="text-[10px] text-gray-400 font-mono">${face.objects.length} éléments • ${specs.widthMm}×${specs.heightMm}mm</div>
                                    </div>
                                </div>
                                <div class="flex items-center space-x-1 shrink-0" onclick="event.stopPropagation()">
                                    <button onclick="app.duplicatePage(${idx})" class="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white text-[10px]" title="Dupliquer cette page">
                                        <i class="fa-regular fa-clone"></i>
                                    </button>
                                    ${this.engine.faces.length > 1 ? `
                                    <button onclick="app.removePage(${idx})" class="p-1 hover:bg-rose-500/20 rounded text-gray-400 hover:text-rose-400 text-[10px]" title="Supprimer cette page">
                                        <i class="fa-regular fa-trash-can"></i>
                                    </button>` : ''}
                                </div>
                            </div>
                        `;
                    });
                    html += `</div>`;
                }

                container.innerHTML = html;
            }

            addNewPage() {
                const newFace = this.engine.addPage();
                this.currentFaceIndex = this.engine.faces.length - 1;
                this.renderCurrentFace();
                this.renderInspector();
                this.renderSpreadsNavigator();
                this.showToast(`Nouvelle page ajoutée (${newFace.name}) !`);
            }

            duplicatePage(idx) {
                const dup = this.engine.duplicatePage(idx);
                if (dup) {
                    this.currentFaceIndex = idx + 1;
                    this.renderCurrentFace();
                    this.renderInspector();
                    this.renderSpreadsNavigator();
                    this.showToast(`Page dupliquée avec succès !`);
                }
            }

            removePage(idx) {
                try {
                    const ok = this.engine.removePage(idx);
                    if (ok) {
                        this.currentFaceIndex = Math.min(idx, this.engine.faces.length - 1);
                        this.renderCurrentFace();
                        this.renderInspector();
                        this.renderSpreadsNavigator();
                        this.showToast(`Page supprimée.`);
                    }
                } catch (e) {
                    this.showToast(e.message || 'Erreur lors de la suppression.');
                }
            }

            goToFace(index) {
                this.currentFaceIndex = Math.max(0, Math.min(this.engine.faces.length - 1, index));
                this.selectedObjectId = null;
                this.renderCurrentFace();
                this.renderInspector();
            }

            prevFace() {
                this.goToFace((this.currentFaceIndex + this.engine.faces.length - 1) % this.engine.faces.length);
            }

            nextFace() {
                this.goToFace((this.currentFaceIndex + 1) % this.engine.faces.length);
            }

            switchLeftTab(tab) {
                const blocksTab = document.getElementById('left-tab-blocks');
                const illuTab = document.getElementById('left-tab-illustrations');
                const pagesTab = document.getElementById('left-tab-pages');
                const btnBlocks = document.getElementById('tab-btn-blocks');
                const btnIllu = document.getElementById('tab-btn-illustrations');
                const btnPages = document.getElementById('tab-btn-pages');

                const inactiveBtn = 'flex-1 py-2 text-center border-b-2 border-transparent text-gray-400 hover:text-gray-200';
                const activeBtn = 'flex-1 py-2 text-center border-b-2 border-blue-500 text-white bg-idPanel';

                if (blocksTab) blocksTab.classList.add('hidden');
                if (illuTab) illuTab.classList.add('hidden');
                if (pagesTab) pagesTab.classList.add('hidden');

                if (btnBlocks) btnBlocks.className = inactiveBtn;
                if (btnIllu) btnIllu.className = inactiveBtn;
                if (btnPages) btnPages.className = inactiveBtn;

                if (tab === 'blocks') {
                    if (blocksTab) blocksTab.classList.remove('hidden');
                    if (btnBlocks) btnBlocks.className = activeBtn;
                } else if (tab === 'illustrations') {
                    if (illuTab) illuTab.classList.remove('hidden');
                    if (btnIllu) btnIllu.className = activeBtn;
                    this.renderIllustrationsTab();
                } else if (tab === 'pages') {
                    if (pagesTab) pagesTab.classList.remove('hidden');
                    if (btnPages) btnPages.className = activeBtn;
                    this.renderSpreadsNavigator();
                }
            }

            // ==================== CENTRALIZED DISH & PRICE DATABASE MODAL ====================
            populateQuickDishSelect() {
                const select = document.getElementById('quick-dish-select');
                if (!select) return;
                select.innerHTML = this.engine.dishesDB.map(d =>
                    `<option value="${escapeHTML(d.id)}">${escapeHTML(d.name)} (${escapeHTML(d.price)})</option>`
                ).join('');
            }

            refreshDbCategoryFilter(preserveSelection = true) {
                const filterSelect = document.getElementById('db-filter-cat');
                if (!filterSelect) return;
                const prev = preserveSelection ? filterSelect.value : 'ALL';
                const cats = this.engine.getCategories();
                filterSelect.innerHTML = `<option value="ALL">Toutes les catégories (${this.engine.dishesDB.length} plats)</option>` +
                    cats.map(c => `<option value="${escapeHTML(c)}">${escapeHTML(c)}</option>`).join('');
                if (preserveSelection && prev && (prev === 'ALL' || cats.includes(prev))) {
                    filterSelect.value = prev;
                } else {
                    filterSelect.value = 'ALL';
                }
            }

            openDatabaseModal() {
                this._dbDirty = false;
                this.refreshDbCategoryFilter(false);
                this.renderDatabaseTable();
                document.getElementById('modal-database').classList.remove('hidden');
            }

            closeDatabaseModal() {
                document.getElementById('modal-database').classList.add('hidden');
                if (this._dbDirty) {
                    this._dbDirty = false;
                    this.commitState(false);
                    this.showToast('Base de données synchronisée sur les 10 faces !');
                } else {
                    this.renderCurrentFace();
                }
                this.populateQuickDishSelect();
                this.renderInspector();
            }

            renderDatabaseTable() {
                const filter = document.getElementById('db-filter-cat').value;
                const searchEl = document.getElementById('db-search-input');
                const query = (searchEl ? searchEl.value : '').trim().toLowerCase();
                const tbody = document.getElementById('db-table-body');
                let list = filter === 'ALL'
                    ? this.engine.dishesDB
                    : this.engine.dishesDB.filter(d => d.category === filter);

                if (query) {
                    list = list.filter(d =>
                        (d.name && d.name.toLowerCase().includes(query)) ||
                        (d.desc && d.desc.toLowerCase().includes(query)) ||
                        (d.price && d.price.toLowerCase().includes(query)) ||
                        (d.id && d.id.toLowerCase().includes(query)) ||
                        (d.category && d.category.toLowerCase().includes(query))
                    );
                }

                if (list.length === 0) {
                    tbody.innerHTML = `<tr><td colspan="7" class="py-6 text-center text-gray-500 text-xs">${query ? 'Aucun plat ne correspond à votre recherche.' : 'Aucun plat dans cette catégorie.'}</td></tr>`;
                    return;
                }

                tbody.innerHTML = list.map(dish => `
                    <tr class="hover:bg-white/5" data-dish-id="${escapeHTML(dish.id)}">
                        <td class="py-2 px-2 font-mono text-[11px] text-gray-400">${escapeHTML(dish.id)}</td>
                        <td class="py-2 px-2">
                            <input type="text" value="${escapeHTML(dish.category)}" onchange="app.updateDishDB(this.closest('tr').dataset.dishId, 'category', this.value)" class="w-full bg-idInput border border-idBorder rounded px-2 py-1 text-amber-300 font-semibold">
                        </td>
                        <td class="py-2 px-2">
                            <input type="text" value="${escapeHTML(dish.name)}" onchange="app.updateDishDB(this.closest('tr').dataset.dishId, 'name', this.value)" class="w-full bg-idInput border border-idBorder rounded px-2 py-1 text-white font-semibold">
                        </td>
                        <td class="py-2 px-2">
                            <input type="text" value="${escapeHTML(dish.desc)}" onchange="app.updateDishDB(this.closest('tr').dataset.dishId, 'desc', this.value)" class="w-full bg-idInput border border-idBorder rounded px-2 py-1 text-gray-300">
                        </td>
                        <td class="py-2 px-2">
                            <input type="text" value="${escapeHTML(dish.price)}" onchange="app.updateDishDB(this.closest('tr').dataset.dishId, 'price', this.value)" class="w-full bg-idInput border border-idBorder rounded px-2 py-1 text-emerald-400 font-mono font-bold text-right">
                        </td>
                        <td class="py-2 px-2">
                            <select onchange="app.updateDishDB(this.closest('tr').dataset.dishId, 'badge', this.value)" class="w-full bg-idInput border border-idBorder rounded px-1.5 py-1 text-white text-[11px]">
                                <option value="" ${!dish.badge ? 'selected' : ''}>Aucun</option>
                                <option value="NOUVEAU" ${dish.badge === 'NOUVEAU' ? 'selected' : ''}>NOUVEAU</option>
                                <option value="CHEF" ${dish.badge === 'CHEF' ? 'selected' : ''}>★ CHEF</option>
                            </select>
                        </td>
                        <td class="py-2 px-2 text-right space-x-1">
                            <button onclick="app.insertDishFromModal(this.closest('tr').dataset.dishId)" class="bg-blue-600/30 hover:bg-blue-600 text-blue-200 hover:text-white px-2 py-1 rounded text-[10px]" title="Poser ce plat sur la planche active">
                                + Planche
                            </button>
                            <button onclick="app.deleteDishFromDB(this.closest('tr').dataset.dishId)" class="bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white px-2 py-1 rounded text-[10px]">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `).join('');
            }

            updateDishDB(dishId, field, value) {
                const dish = this.engine.getDishById(dishId);
                if (!dish) return;
                let clean = String(value ?? '');
                if (field === 'category') {
                    clean = clean.trim() || 'GÉNÉRAL';
                } else if (field === 'name') {
                    clean = clean.trim() || 'Plat Signature';
                } else if (field === 'price') {
                    clean = clean.trim();
                } else if (field === 'badge') {
                    clean = (clean === 'NOUVEAU' || clean === 'CHEF') ? clean : '';
                }
                dish[field] = clean;
                this._dbDirty = true;
                if (field === 'category') {
                    this.refreshDbCategoryFilter(true);
                    // Si un filtre de catégorie est actif, le plat renommé doit disparaître / apparaître
                    if (document.getElementById('db-filter-cat').value !== 'ALL') {
                        this.renderDatabaseTable();
                    }
                }
                this.renderCurrentFace();
                this.commitStateDebounced();
            }

            addNewDishToDB() {
                const newId = this.engine.generateUniqueDishId();
                this.engine.dishesDB.unshift({
                    id: newId,
                    category: 'NOUVELLE CATÉGORIE',
                    name: 'Nouveau Plat Signature',
                    desc: 'Description gourmande et ingrédients frais',
                    price: '75 DH',
                    badge: 'NOUVEAU'
                });
                this._dbDirty = true;
                this.refreshDbCategoryFilter(false);
                this.renderDatabaseTable();
                this.commitState(false);
            }

            deleteDishFromDB(id) {
                const dish = this.engine.getDishById(id);
                if (!dish) return;
                // Compte les blocs « Ligne Plat » qui référencent ce plat sur les 10 faces
                const refCount = this.engine.faces.reduce((acc, f) =>
                    acc + f.objects.filter(o => o.type === 'dish_item' && o.dishId === id).length, 0);
                const warn = refCount > 0
                    ? `\n\n⚠ ${refCount} bloc(s) « Ligne Plat » utilisent ce plat et afficheront « Plat Personnalisé ».`
                    : '';
                if (!window.confirm(`Supprimer « ${dish.name} » de la base de données ?${warn}`)) return;
                this.engine.dishesDB = this.engine.dishesDB.filter(d => d.id !== id);
                this._dbDirty = true;
                this.refreshDbCategoryFilter(true);
                this.renderDatabaseTable();
                this.commitState(false);
            }

            insertDishFromModal(dishId) {
                this.closeDatabaseModal();
                this.insertSelectedQuickDish(dishId);
            }

            // ==================== TEMPLATES, PREVIEW MODE & 3D FOLD ====================
            applySpreadTemplate(tplName) {
                if (tplName === 'cover_back') {
                    this.engine.populateSampleSpread1Recto(this.currentFace);
                } else if (tplName === 'brunch_spread') {
                    this.engine.populateSampleSpread1Verso(this.currentFace);
                } else if (tplName === 'bistro_spread') {
                    this.engine.populateSampleSpread2Recto(this.currentFace);
                } else if (tplName === 'flyer_promo_a4') {
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
            }

            togglePreviewMode() {
                this.previewMode = !this.previewMode;
                const bleedEl = document.getElementById('guide-bleed');
                const guidesEl = document.getElementById('guide-overlays');
                const labelEl = document.getElementById('preview-mode-label');

                if (this.previewMode) {
                    bleedEl.classList.add('hidden');
                    guidesEl.classList.add('hidden');
                    labelEl.textContent = 'Mode Aperçu [W]';
                } else {
                    bleedEl.classList.remove('hidden');
                    guidesEl.classList.remove('hidden');
                    labelEl.textContent = 'Repères [W]';
                }
                this.setupGeometryDOM();
                this.renderCurrentFace();
                this.renderInspector();
                this.renderRulers();
            }

            toggleSnap(enabled) {
                this.snapEnabled = enabled;
            }

            async open3DFoldModal() {
                document.getElementById('modal-3d').classList.remove('hidden');
                const leftPanel = document.getElementById('fold-panel-left');
                const rightPanel = document.getElementById('fold-panel-right');
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
            }

            update3DFoldAngle(deg) {
                document.getElementById('fold-panel-left').style.transform = `rotateY(${deg}deg)`;
                document.getElementById('fold-panel-right').style.transform = `rotateY(-${deg}deg)`;
            }

            close3DFoldModal() {
                document.getElementById('modal-3d').classList.add('hidden');
            }

            // ==================== EXPORT PDF (WITH CROP & FOLD MARKS) & PNG ====================
            openExportModal() {
                document.getElementById('modal-export').classList.remove('hidden');
            }

            closeExportModal() {
                document.getElementById('modal-export').classList.add('hidden');
            }

            getSelectedExportScale() {
                const dpiEl = document.getElementById('exp-dpi');
                const val = dpiEl ? parseFloat(dpiEl.value) : 11.81;
                return Math.max(2, Number.isFinite(val) ? val : 11.81);
            }

            getReadingPageNumber(faceIndex, side) {
                // Face 0 (Sheet 1 Recto): Right = Page 1 (Couverture), Left = Page 20 (Dos)
                if (faceIndex === 0) {
                    return side === 'right' ? 1 : 20;
                }
                // Interior faces 1..9: Left = fIdx*2, Right = fIdx*2 + 1 (Pages 2..19)
                return side === 'left' ? (faceIndex * 2) : (faceIndex * 2 + 1);
            }

            async exportCurrentFacePNG() {
                const includeCropMarks = document.getElementById('exp-cropmarks').checked;
                const includeBleed = document.getElementById('exp-bleed').checked;
                const scalePxPerMm = this.getSelectedExportScale();
                const progress = document.getElementById('export-progress');
                const progressText = document.getElementById('export-progress-text');
                progress.classList.remove('hidden');
                if (progressText) progressText.textContent = `Rendu PNG 34×30cm ${this.currentFace.name}...`;

                try {
                    const { canvas, failedImages } = await this.exporter.renderFaceToCanvas(this.currentFace, {
                        includeBleed,
                        includeCropMarks,
                        scalePxPerMm
                    });

                    const blob = await new Promise((resolve, reject) => {
                        canvas.toBlob(b => b ? resolve(b) : reject(new Error('toBlob a échoué')), 'image/png');
                    });
                    canvas.width = 0;
                    canvas.height = 0;

                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.download = `Menu_Planche_34x30_${this.currentFace.id}.png`;
                    link.href = url;
                    link.click();
                    setTimeout(() => URL.revokeObjectURL(url), 2000);

                    if (failedImages && failedImages.length > 0) {
                        this.showToast(`PNG exporté avec avertissement : ${failedImages.length} photo(s) externe(s) bloquée(s).`);
                    } else {
                        this.showToast('Planche 34×30 cm exportée en PNG !');
                    }
                } catch (err) {
                    console.error(err);
                    this.showToast('Erreur lors de la génération PNG');
                } finally {
                    progress.classList.add('hidden');
                }
            }

            /**
             * Télécharge SÉPARÉMENT les 2 panneaux 17×30 cm (Gauche + Droite) de la feuille active
             * pour que l'imprimeur puisse les assembler/imposer librement.
             */
            async exportSeparatePanelsPNG() {
                const includeCropMarks = document.getElementById('exp-cropmarks').checked;
                const includeBleed = document.getElementById('exp-bleed').checked;
                const scalePxPerMm = this.getSelectedExportScale();
                const progress = document.getElementById('export-progress');
                const progressText = document.getElementById('export-progress-text');
                progress.classList.remove('hidden');

                try {
                    const sides = ['left', 'right'];
                    for (const side of sides) {
                        const pageNum = this.getReadingPageNumber(this.currentFaceIndex, side);
                        const sideLabel = side === 'left' ? 'Gauche' : 'Droite';
                        if (progressText) {
                            progressText.textContent = `Rendu Panneau ${sideLabel} (Page ${pageNum}/20 — 17×30 cm)...`;
                        }
                        await new Promise(r => setTimeout(r, 40));

                        const { canvas } = await this.exporter.renderSinglePanelToCanvas(
                            this.currentFace,
                            side,
                            pageNum,
                            { includeBleed, includeCropMarks, scalePxPerMm }
                        );

                        const blob = await new Promise((resolve, reject) => {
                            canvas.toBlob(b => b ? resolve(b) : reject(new Error('toBlob a échoué')), 'image/png');
                        });
                        canvas.width = 0;
                        canvas.height = 0;

                        const url = URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        const numStr = String(pageNum).padStart(2, '0');
                        link.download = `Menu_Page_${numStr}_sur_20_${this.currentFace.id}_${sideLabel}_17x30cm.png`;
                        link.href = url;
                        link.click();
                        await new Promise(r => setTimeout(r, 250));
                        setTimeout(() => URL.revokeObjectURL(url), 3000);
                    }

                    this.showToast('Les 2 pages 17×30 cm (Gauche & Droite) ont été téléchargées séparément !');
                } catch (err) {
                    console.error(err);
                    this.showToast('Erreur lors de l\'export séparé des 2 panneaux');
                } finally {
                    progress.classList.add('hidden');
                }
            }

            async exportPDF() {
                if (!window.jspdf || !window.jspdf.jsPDF) {
                    this.showToast('Librairie jsPDF non chargée (vérifiez votre connexion Internet).');
                    return;
                }

                const includeCropMarks = document.getElementById('exp-cropmarks').checked;
                const includeBleed = document.getElementById('exp-bleed').checked;
                const scope = document.getElementById('exp-scope').value;
                const scalePxPerMm = this.getSelectedExportScale();
                const progress = document.getElementById('export-progress');
                const progressText = document.getElementById('export-progress-text');

                progress.classList.remove('hidden');

                try {
                    const { jsPDF } = window.jspdf;
                    const allFailedImages = new Set();
                    let pdf = null;

                    // MODE 1 : Pages séparées 17×30 cm (Recommandé pour l'imprimeur qui fait l'assemblage/agrafage)
                    if (scope === 'single_pages_20' || scope === 'current_2_panels') {
                        const panelQueue = [];
                        if (scope === 'current_2_panels') {
                            panelQueue.push(
                                { face: this.currentFace, side: 'left', pageNum: this.getReadingPageNumber(this.currentFaceIndex, 'left') },
                                { face: this.currentFace, side: 'right', pageNum: this.getReadingPageNumber(this.currentFaceIndex, 'right') }
                            );
                        } else {
                            // Ordre de lecture séquentiel Page 1 à Page 20 pour l'imprimeur :
                            // Page 1 = Couverture (Face 0 Droite)
                            panelQueue.push({ face: this.engine.faces[0], side: 'right', pageNum: 1 });
                            // Pages 2 à 19 = Faces intérieures 1..9 (Gauche puis Droite : jamais de catégorie coupée !)
                            for (let fIdx = 1; fIdx < 10; fIdx++) {
                                panelQueue.push({ face: this.engine.faces[fIdx], side: 'left', pageNum: fIdx * 2 });
                                panelQueue.push({ face: this.engine.faces[fIdx], side: 'right', pageNum: fIdx * 2 + 1 });
                            }
                            // Page 20 = Dos de couverture (Face 0 Gauche)
                            panelQueue.push({ face: this.engine.faces[0], side: 'left', pageNum: 20 });
                        }

                        for (let i = 0; i < panelQueue.length; i++) {
                            const item = panelQueue[i];
                            progressText.textContent = `Rendu Page séparée ${item.pageNum}/20 (17×30 cm)...`;
                            await new Promise(r => setTimeout(r, 25));

                            const { canvas, totalWidthMm, totalHeightMm, failedImages } = await this.exporter.renderSinglePanelToCanvas(
                                item.face,
                                item.side,
                                item.pageNum,
                                { includeBleed, includeCropMarks, scalePxPerMm }
                            );

                            if (failedImages) failedImages.forEach(u => allFailedImages.add(u));
                            const imgData = canvas.toDataURL('image/jpeg', 0.94);
                            canvas.width = 0;
                            canvas.height = 0;

                            const orient = totalWidthMm > totalHeightMm ? 'landscape' : 'portrait';
                            if (i === 0) {
                                pdf = new jsPDF({
                                    orientation: orient,
                                    unit: 'mm',
                                    format: [totalWidthMm, totalHeightMm]
                                });
                            } else {
                                pdf.addPage([totalWidthMm, totalHeightMm], orient);
                            }
                            pdf.addImage(imgData, 'JPEG', 0, 0, totalWidthMm, totalHeightMm);
                        }

                        const filename = scope === 'single_pages_20'
                            ? 'Menu_Grey_Corner_20_Pages_Separees_17x30cm_Imprimeur.pdf'
                            : `Menu_Grey_Corner_${this.currentFace.id}_2_Pages_Separees_17x30cm.pdf`;

                        pdf.save(filename);
                        this.showToast('PDF en pages séparées 17×30 cm généré pour l\'imprimeur !');
                        this.closeExportModal();
                        return;
                    }

                    // MODE 2 : Planches ouvertes 34×30 cm
                    const facesToExport = scope === 'all' ? this.engine.faces : [this.currentFace];

                    for (let i = 0; i < facesToExport.length; i++) {
                        const face = facesToExport[i];
                        progressText.textContent = `Rendu Planche 34×30cm ${face.name} (${i + 1}/${facesToExport.length})...`;
                        await new Promise(r => setTimeout(r, 30));

                        const { canvas, totalWidthMm, totalHeightMm, failedImages } = await this.exporter.renderFaceToCanvas(face, {
                            includeBleed,
                            includeCropMarks,
                            scalePxPerMm
                        });

                        if (failedImages) {
                            failedImages.forEach(u => allFailedImages.add(u));
                        }

                        const imgData = canvas.toDataURL('image/jpeg', 0.94);
                        canvas.width = 0;
                        canvas.height = 0;

                        if (i === 0) {
                            pdf = new jsPDF({
                                orientation: 'landscape',
                                unit: 'mm',
                                format: [totalWidthMm, totalHeightMm]
                            });
                        } else {
                            pdf.addPage([totalWidthMm, totalHeightMm], 'landscape');
                        }

                        pdf.addImage(imgData, 'JPEG', 0, 0, totalWidthMm, totalHeightMm);
                    }

                    const filename = scope === 'all'
                        ? 'Menu_Complet_10_Planches_34x30cm_PrePresse.pdf'
                        : `Menu_${this.currentFace.id}_34x30cm.pdf`;

                    pdf.save(filename);
                    if (allFailedImages.size > 0) {
                        this.showToast(`PDF généré, mais ${allFailedImages.size} photo(s) externe(s) n'ont pas pu être intégrées.`);
                    } else {
                        this.showToast('PDF Imprimeur généré avec succès !');
                    }
                    this.closeExportModal();
                } catch (err) {
                    console.error(err);
                    this.showToast('Erreur lors de la génération PDF');
                } finally {
                    progress.classList.add('hidden');
                }
            }

            // ==================== UNDO / REDO / JSON SERIALIZATION ====================
            undo() {
                this.flushPendingSave();
                if (this.engine.undo()) {
                    if (typeof this.engine.activeFaceIndex === 'number' && this.engine.activeFaceIndex >= 0 && this.engine.activeFaceIndex < this.engine.faces.length) {
                        this.currentFaceIndex = this.engine.activeFaceIndex;
                    }
                    this.selectedObjectId = null;
                    this.populateQuickDishSelect();
                    this.renderCurrentFace();
                    this.renderInspector();
                    this.updateUndoRedoButtons();
                    this.updateAutoSaveUI(this.engine.lastSaveSuccess);
                    this.showToast('Action annulée (Ctrl+Z)');
                }
            }

            redo() {
                this.flushPendingSave();
                if (this.engine.redo()) {
                    if (typeof this.engine.activeFaceIndex === 'number' && this.engine.activeFaceIndex >= 0 && this.engine.activeFaceIndex < this.engine.faces.length) {
                        this.currentFaceIndex = this.engine.activeFaceIndex;
                    }
                    this.selectedObjectId = null;
                    this.populateQuickDishSelect();
                    this.renderCurrentFace();
                    this.renderInspector();
                    this.updateUndoRedoButtons();
                    this.updateAutoSaveUI(this.engine.lastSaveSuccess);
                    this.showToast('Action rétablie (Ctrl+Y)');
                }
            }

            updateUndoRedoButtons() {
                document.getElementById('btn-undo').disabled = this.engine.history.length <= 1;
                document.getElementById('btn-redo').disabled = this.engine.redoStack.length === 0;
            }

            // ==========================================
            // GOOGLE DRIVE / LOCAL DISK SYNC (OPTION A)
            // ==========================================
            async saveProjectToDisk(forceSaveAs = false) {
                if (this.isSavingDisk) return;
                this.isSavingDisk = true;
                this.flushPendingSave();

                try {
                    if ('showSaveFilePicker' in window) {
                        let handle = this.activeFileHandle;

                        if (!handle || forceSaveAs) {
                            const defaultFormatName = (this.engine.specs.name || 'Menu').replace(/[^a-zA-Z0-9_-]/g, '_');
                            const suggested = this.activeFileName || `Projet_${defaultFormatName}.inmenu.json`;

                            handle = await window.showSaveFilePicker({
                                suggestedName: suggested,
                                types: [{
                                    description: 'Projet InMenu Studio (.inmenu.json)',
                                    accept: { 'application/json': ['.inmenu.json', '.json'] }
                                }]
                            });

                            this.activeFileHandle = handle;
                            this.activeFileName = handle.name;
                            try {
                                localStorage.setItem('inmenu_last_synced_filename', handle.name);
                            } catch (_) {}
                        }

                        const json = this.engine.toJSON(true);
                        const writable = await handle.createWritable();
                        await writable.write(json);
                        await writable.close();

                        this.updateDiskSyncUI(true);
                        this.showToast(`✅ Enregistré sur Google Drive : ${this.activeFileName}`);
                    } else {
                        // Fallback pour navigateurs sans File System Access API
                        this.exportProjectJSON();
                        this.showToast('Enregistré en téléchargement. Placez le fichier dans votre dossier Google Drive.');
                    }
                } catch (err) {
                    if (err && err.name !== 'AbortError') {
                        console.error('Erreur sauvegarde disque:', err);
                        this.showToast(`Erreur d'enregistrement : ${err.message || 'accès refusé'}`);
                    }
                } finally {
                    this.isSavingDisk = false;
                }
            }

            async openProjectFromDisk() {
                try {
                    if ('showOpenFilePicker' in window) {
                        const [handle] = await window.showOpenFilePicker({
                            types: [{
                                description: 'Projet InMenu Studio (.inmenu.json, .json)',
                                accept: { 'application/json': ['.inmenu.json', '.json'] }
                            }],
                            multiple: false
                        });

                        const file = await handle.getFile();
                        const text = await file.text();
                        this.engine.fromJSON(text);

                        this.activeFileHandle = handle;
                        this.activeFileName = handle.name;
                        try {
                            localStorage.setItem('inmenu_last_synced_filename', handle.name);
                        } catch (_) {}

                        this.currentFaceIndex = 0;
                        this.selectedObjectId = null;
                        this.setupGeometryDOM();
                        this.populateQuickDishSelect();
                        this.renderCurrentFace();
                        this.renderInspector();
                        this.renderSpreadsNavigator();
                        this.updateUndoRedoButtons();
                        this.updateFormatHeaderUI();
                        this.updateDiskSyncUI(true);
                        this.showToast(`Projet chargé depuis Google Drive : ${this.activeFileName}`);
                    } else {
                        const input = document.getElementById('disk-import-input-fallback');
                        if (input) input.click();
                    }
                } catch (err) {
                    if (err && err.name !== 'AbortError') {
                        console.error('Erreur ouverture disque:', err);
                        this.showToast('Erreur lors de l\'ouverture du fichier.');
                    }
                }
            }

            updateDiskSyncUI(isSynced = true) {
                const labelEl = document.getElementById('label-save-disk');
                const syncDotEl = document.getElementById('drive-sync-dot');
                const fileNameEl = document.getElementById('drive-sync-filename');
                const footerDriveStatus = document.getElementById('footer-drive-status');

                const now = new Date();
                const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

                if (this.activeFileName) {
                    if (labelEl) {
                        labelEl.textContent = isSynced ? `Enregistré (Ctrl+S)` : `Enregistrer (Ctrl+S)*`;
                    }
                    if (syncDotEl) {
                        syncDotEl.classList.remove('hidden');
                        syncDotEl.className = isSynced
                            ? 'w-2 h-2 rounded-full bg-emerald-300 ml-1 inline-block animate-pulse'
                            : 'w-2 h-2 rounded-full bg-amber-400 ml-1 inline-block';
                    }
                    if (fileNameEl) {
                        fileNameEl.textContent = this.activeFileName;
                        fileNameEl.title = `Fichier actif : ${this.activeFileName}\nStatut : ${isSynced ? 'Synchronisé' : 'Modifications non enregistrées sur disque'}`;
                    }
                    if (footerDriveStatus) {
                        footerDriveStatus.innerHTML = `
                            <i class="fa-brands fa-google-drive mr-1 ${isSynced ? 'text-emerald-400' : 'text-amber-400'}"></i>
                            <span>Drive: <strong class="${isSynced ? 'text-emerald-300' : 'text-amber-300'} font-mono">${escapeHTML(this.activeFileName)}</strong> ${isSynced ? `(${timeStr})` : '• Modifié*'}</span>
                        `;
                    }
                } else {
                    if (labelEl) {
                        labelEl.textContent = `Enregistrer (Ctrl+S)`;
                    }
                    if (syncDotEl) {
                        syncDotEl.classList.add('hidden');
                    }
                    if (fileNameEl) {
                        fileNameEl.textContent = 'Prêt pour synchronisation';
                    }
                    if (footerDriveStatus) {
                        footerDriveStatus.innerHTML = `
                            <i class="fa-brands fa-google-drive mr-1 text-emerald-400"></i>
                            <span>Drive: Prêt (Ctrl+S)</span>
                        `;
                    }
                }
            }

            exportProjectJSON() {
                const blob = new Blob([this.engine.toJSON()], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                const defaultFormatName = (this.engine.specs.name || 'Menu').replace(/[^a-zA-Z0-9_-]/g, '_');
                link.download = this.activeFileName || `Projet_${defaultFormatName}.inmenu.json`;
                link.href = url;
                link.click();
                setTimeout(() => URL.revokeObjectURL(url), 1000);
                this.showToast('Copie JSON téléchargée !');
            }

            importProjectJSON(event) {
                const input = event.target;
                const file = input.files && input.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        this.engine.fromJSON(e.target.result);
                        this.currentFaceIndex = 0;
                        this.selectedObjectId = null;
                        this.activeFileName = file.name;
                        try {
                            localStorage.setItem('inmenu_last_synced_filename', file.name);
                        } catch (_) {}
                        this.setupGeometryDOM();
                        this.populateQuickDishSelect();
                        this.renderCurrentFace();
                        this.renderInspector();
                        this.renderSpreadsNavigator();
                        this.updateUndoRedoButtons();
                        this.updateFormatHeaderUI();
                        this.updateAutoSaveUI(this.engine.lastSaveSuccess);
                        this.updateDiskSyncUI(true);
                        this.showToast(`Projet « ${file.name} » chargé avec succès !`);
                    } catch (err) {
                        console.error(err);
                        this.showToast('Fichier JSON invalide');
                    }
                };
                reader.onerror = () => {
                    this.showToast('Erreur de lecture du fichier JSON');
                };
                reader.readAsText(file);
                input.value = '';
            }

            openEngineInspector() {
                document.getElementById('engine-json-viewer').value = this.engine.toJSON();
                document.getElementById('modal-engine').classList.remove('hidden');
            }

            closeEngineInspector() {
                document.getElementById('modal-engine').classList.add('hidden');
            }

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
            }

            // ==================== SMART WORD (.DOCX / .TXT) IMPORTER & AUTO-LAYOUT CONTROLLER ====================
            initWordDropzone() {
                const dropzone = document.getElementById('word-dropzone');
                if (!dropzone) return;

                const highlight = (active) => {
                    dropzone.classList.toggle('border-indigo-400', active);
                    dropzone.classList.toggle('bg-indigo-500/20', active);
                };

                ['dragenter', 'dragover'].forEach(evtName => {
                    dropzone.addEventListener(evtName, (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        highlight(true);
                    });
                });

                ['dragleave', 'dragend'].forEach(evtName => {
                    dropzone.addEventListener(evtName, (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        highlight(false);
                    });
                });

                dropzone.addEventListener('drop', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    highlight(false);
                    const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
                    if (file) {
                        this.processWordFile(file);
                    }
                });
            }

            updateWordModeCardsUI() {
                const cards = document.querySelectorAll('#word-import-mode-group .word-mode-card');
                cards.forEach(card => {
                    const radio = card.querySelector('input[name="word-import-mode"]');
                    const checked = !!(radio && radio.checked);
                    card.className = checked
                        ? 'word-mode-card flex items-start space-x-2.5 p-2.5 rounded-lg border border-blue-500 bg-blue-500/10 cursor-pointer transition'
                        : 'word-mode-card flex items-start space-x-2.5 p-2.5 rounded-lg border border-idBorder bg-idInput hover:border-gray-500 cursor-pointer transition';
                });
            }

            openWordImportModal() {
                const modal = document.getElementById('modal-word-import');
                modal.classList.remove('hidden');
                this.updateWordModeCardsUI();
                const textarea = document.getElementById('word-raw-textarea');
                if (!textarea.value.trim()) {
                    this.loadFull10FacesSampleWordText();
                } else {
                    this.parseWordRawText();
                }
            }

            closeWordImportModal() {
                document.getElementById('modal-word-import').classList.add('hidden');
            }

            loadFull10FacesSampleWordText() {
                const sample = WordMenuImporter.getSampleFullMenuText();
                document.getElementById('word-raw-textarea').value = sample;
                this.parseWordRawText();
                const dishesCount = this.wordParsedDishes ? this.wordParsedDishes.length : 0;
                const catsCount = new Set((this.wordParsedDishes || []).map(d => d.category)).size;
                document.getElementById('word-file-status').innerHTML = `
                    <span class="text-amber-300"><i class="fa-solid fa-check-circle mr-1.5"></i>Exemple complet chargé (${catsCount} catégories, ${dishesCount} plats)</span>
                    <button onclick="app.parseWordRawText()" class="text-blue-400 hover:underline font-semibold">Ré-analyser</button>
                `;
            }

            async handleWordFileUpload(event) {
                const input = event.target;
                const file = input.files && input.files[0];
                if (!file) return;
                await this.processWordFile(file);
                input.value = '';
            }

            async processWordFile(file) {
                if (!file) return;
                const statusEl = document.getElementById('word-file-status');
                const textarea = document.getElementById('word-raw-textarea');
                const lowerName = file.name.toLowerCase();

                if (lowerName.endsWith('.doc') && !lowerName.endsWith('.docx')) {
                    statusEl.innerHTML = `<span class="text-rose-400"><i class="fa-solid fa-triangle-exclamation mr-1.5"></i>Format .doc ancien non supporté. Enregistrez votre document en .docx ou .txt.</span>`;
                    this.showToast('Veuillez convertir le fichier .doc en .docx');
                    return;
                }

                statusEl.innerHTML = `<span class="text-blue-300"><i class="fa-solid fa-spinner fa-spin mr-1.5"></i>Lecture de « ${escapeHTML(file.name)} » en cours...</span>`;

                try {
                    if (lowerName.endsWith('.docx')) {
                        if (typeof mammoth === 'undefined') {
                            throw new Error('Librairie Mammoth.js non chargée');
                        }
                        const arrayBuffer = await file.arrayBuffer();
                        textarea.value = await WordMenuImporter.extractTextFromDocx(arrayBuffer);
                    } else {
                        textarea.value = await file.text();
                    }

                    statusEl.innerHTML = `
                        <span class="text-emerald-400"><i class="fa-solid fa-file-circle-check mr-1.5"></i>Fichier « ${escapeHTML(file.name)} » converti avec succès</span>
                        <button onclick="app.parseWordRawText()" class="text-blue-400 hover:underline font-semibold">Actualiser</button>
                    `;
                    this.parseWordRawText();
                    this.showToast(`Fichier Word « ${file.name} » analysé !`);
                } catch (err) {
                    console.error(err);
                    statusEl.innerHTML = `<span class="text-rose-400"><i class="fa-solid fa-triangle-exclamation mr-1.5"></i>Erreur de lecture du fichier Word.</span>`;
                }
            }

            parseWordRawText() {
                clearTimeout(this._wordParseTimer);
                const rawText = document.getElementById('word-raw-textarea').value;
                this.wordParsedDishes = WordMenuImporter.parseText(rawText);
                this.renderWordParsedPreview();
            }

            // Évite de ré-analyser tout le menu (et reconstruire l'aperçu) à chaque frappe
            parseWordRawTextDebounced() {
                clearTimeout(this._wordParseTimer);
                this._wordParseTimer = setTimeout(() => this.parseWordRawText(), 300);
            }

            renderWordParsedPreview() {
                const dishes = this.wordParsedDishes || [];
                const cats = [...new Set(dishes.map(d => d.category))];
                document.getElementById('word-parsed-summary').textContent = `${cats.length} Catégories • ${dishes.length} Plats`;

                const container = document.getElementById('word-parsed-preview-container');
                if (dishes.length === 0) {
                    container.innerHTML = `
                        <div class="h-full flex flex-col items-center justify-center text-center p-6 text-gray-500 border border-dashed border-idBorder rounded-lg">
                            <i class="fa-solid fa-file-lines text-2xl mb-2"></i>
                            <p class="text-xs text-gray-400">Aucun plat détecté pour le moment.</p>
                            <p class="text-[10px] mt-1">Écrivez chaque plat avec son prix en fin de ligne (ex: <code class="text-amber-300">Brunch Royal - Description ... 115 DH</code>)</p>
                        </div>
                    `;
                    return;
                }

                container.innerHTML = cats.map(cat => {
                    const catItems = dishes.filter(d => d.category === cat);
                    const rowsHTML = catItems.map(item => `
                        <div data-item-id="${escapeHTML(item.id)}" class="grid grid-cols-12 gap-1.5 items-center bg-idBg/70 p-1.5 rounded border border-idBorder/60 text-[11px]">
                            <input type="text" value="${escapeHTML(item.name)}" onchange="app.updateWordPreviewItem(this.closest('[data-item-id]').dataset.itemId, 'name', this.value)" class="col-span-4 bg-idInput border border-idBorder rounded px-1.5 py-1 text-white font-semibold" title="Nom du plat">
                            <input type="text" value="${escapeHTML(item.desc)}" onchange="app.updateWordPreviewItem(this.closest('[data-item-id]').dataset.itemId, 'desc', this.value)" class="col-span-5 bg-idInput border border-idBorder rounded px-1.5 py-1 text-gray-300" placeholder="Description / ingrédients">
                            <input type="text" value="${escapeHTML(item.price)}" onchange="app.updateWordPreviewItem(this.closest('[data-item-id]').dataset.itemId, 'price', this.value)" class="col-span-2 bg-idInput border border-idBorder rounded px-1.5 py-1 text-emerald-400 font-mono font-bold text-right">
                            <button onclick="app.toggleWordPreviewBadge(this.closest('[data-item-id]').dataset.itemId)" class="col-span-1 py-1 rounded text-[9px] font-bold text-center ${
                                item.badge === 'NOUVEAU' ? 'bg-rose-600 text-white' : (item.badge === 'CHEF' ? 'bg-amber-600 text-white' : 'bg-idInput text-gray-500 border border-idBorder')
                            }" title="Basculer badge NOUVEAU / CHEF">
                                ${item.badge === 'NOUVEAU' ? 'NEW' : (item.badge === 'CHEF' ? '★' : '—')}
                            </button>
                        </div>
                    `).join('');

                    return `
                        <div class="bg-idInput/60 border border-idBorder rounded-lg p-2.5 space-y-1.5">
                            <div class="flex items-center justify-between border-b border-idBorder pb-1">
                                <span class="font-bold text-amber-400 text-xs flex items-center">
                                    <i class="fa-solid fa-grip-lines-vertical mr-1.5 text-amber-500"></i>${escapeHTML(cat)}
                                </span>
                                <span class="text-[10px] font-mono text-gray-400">${catItems.length} plats</span>
                            </div>
                            <div class="space-y-1">${rowsHTML}</div>
                        </div>
                    `;
                }).join('');
            }

            updateWordPreviewItem(id, field, value) {
                const item = (this.wordParsedDishes || []).find(d => d.id === id);
                if (item) item[field] = value;
            }

            toggleWordPreviewBadge(id) {
                const item = (this.wordParsedDishes || []).find(d => d.id === id);
                if (!item) return;
                if (!item.badge) item.badge = 'NOUVEAU';
                else if (item.badge === 'NOUVEAU') item.badge = 'CHEF';
                else item.badge = '';
                this.renderWordParsedPreview();
            }

            executeWordImportAndLayout() {
                if (!this.wordParsedDishes || this.wordParsedDishes.length === 0) {
                    this.showToast('Aucun plat à importer.');
                    return;
                }

                const modeRadio = document.querySelector('input[name="word-import-mode"]:checked');
                const mode = modeRadio ? modeRadio.value : 'full_auto_spreads';
                const theme = document.getElementById('word-layout-theme').value;
                const brandTitle = document.getElementById('word-brand-title').value || 'GREY CORNER';
                const brandSub = document.getElementById('word-brand-sub').value || 'CAFÉ • RESTAURANT • SINCE 2024';

                const summary = WordMenuImporter.autoLayoutAcrossSpreads(this.engine, this.wordParsedDishes, {
                    mode,
                    theme,
                    brandTitle,
                    brandSub,
                    activeFaceIndex: this.currentFaceIndex
                });

                this.selectedObjectId = null;
                if (mode === 'full_auto_spreads') {
                    this.currentFaceIndex = 1; // Jump to Sheet 1 Verso (first interior menu spread)
                }

                this.commitState(false);
                this.populateQuickDishSelect();
                this.renderInspector();
                this.closeWordImportModal();

                const catsCount = this.engine.getCategories().length;
                const omittedDishes = (summary && summary.omittedDishes) || 0;
                if (summary && summary.mode !== 'db_only' && omittedDishes > 0) {
                    const omittedCats = summary.omittedCategories ? summary.omittedCategories.length : 0;
                    this.showToast(`Importé (${this.wordParsedDishes.length} plats), mais ${omittedDishes} plat(s)${omittedCats ? ` dont ${omittedCats} catégorie(s) entière(s)` : ''} n'ont pas pu être placés : ajoutez-les manuellement depuis la BDD.`);
                } else {
                    this.showToast(`Menu Word intégré : ${this.wordParsedDishes.length} plats (${catsCount} catégories) mis en page !`);
                }
            }

            downloadWordTemplateSample() {
                const content = WordMenuImporter.getSampleFullMenuText();
                const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.download = 'Modele_Menu_Simple_Pour_Import_InMenu.txt';
                link.href = url;
                link.click();
                setTimeout(() => URL.revokeObjectURL(url), 1000);
                this.showToast('Modèle de menu téléchargé !');
            }

            isAnyModalOpen() {
                const modalIds = ['modal-database', 'modal-export', 'modal-3d', 'modal-engine', 'modal-word-import'];
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
                if (!document.getElementById('modal-word-import').classList.contains('hidden')) {
                    this.closeWordImportModal();
                    return true;
                }
                if (!document.getElementById('modal-engine').classList.contains('hidden')) {
                    this.closeEngineInspector();
                    return true;
                }
                if (!document.getElementById('modal-3d').classList.contains('hidden')) {
                    this.close3DFoldModal();
                    return true;
                }
                if (!document.getElementById('modal-export').classList.contains('hidden')) {
                    this.closeExportModal();
                    return true;
                }
                if (!document.getElementById('modal-database').classList.contains('hidden')) {
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
                        if (this.closeTopModal()) {
                            e.preventDefault();
                            return;
                        }
                        if (this.selectedObjectId) {
                            e.preventDefault();
                            this.selectObject(null);
                            return;
                        }
                    }

                    if (this.isAnyModalOpen()) return;
                    const tag = document.activeElement ? document.activeElement.tagName : '';
                    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

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
                    } else if (e.key === 'Delete' || e.key === 'Backspace') {
                        if (this.selectedObjectId && !this.previewMode) {
                            e.preventDefault();
                            this.deleteSelected();
                        }
                    } else if (keyLower === 'w' && !e.ctrlKey && !e.metaKey && !e.altKey) {
                        e.preventDefault();
                        this.togglePreviewMode();
                    } else if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
                        const obj = this.selectedObject;
                        if (obj && !obj.locked && !this.previewMode) {
                            e.preventDefault();
                            const step = e.shiftKey ? 2.0 : 0.5;
                            if (e.key === 'ArrowLeft') obj.x = +(obj.x - step).toFixed(1);
                            else if (e.key === 'ArrowRight') obj.x = +(obj.x + step).toFixed(1);
                            else if (e.key === 'ArrowUp') obj.y = +(obj.y - step).toFixed(1);
                            else if (e.key === 'ArrowDown') obj.y = +(obj.y + step).toFixed(1);
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
            }

            openFormatModal() {
                const modal = document.getElementById('modal-format');
                if (modal) {
                    this.renderFormatModalCards();
                    modal.classList.remove('hidden');
                }
            }

            closeFormatModal() {
                const modal = document.getElementById('modal-format');
                if (modal) modal.classList.add('hidden');
            }

            renderFormatModalCards() {
                const container = document.getElementById('format-modal-cards');
                if (!container) return;
                const presets = window.FORMAT_PRESETS || (typeof FORMAT_PRESETS !== 'undefined' ? FORMAT_PRESETS : {});
                const currentId = this.engine.specs.id || this.engine.currentFormat;

                container.innerHTML = Object.keys(presets).map(key => {
                    const p = presets[key];
                    const isCurrent = (p.id === currentId || key === currentId);
                    return `
                        <div onclick="app.changeActiveFormat('${key}')" class="p-3.5 rounded-lg border cursor-pointer transition ${
                            isCurrent 
                                ? 'border-cyan-400 bg-cyan-500/15 ring-2 ring-cyan-400/50 shadow-lg' 
                                : 'border-idBorder bg-idInput hover:border-gray-500 hover:bg-white/5'
                        }">
                            <div class="flex items-center justify-between mb-1.5">
                                <span class="font-bold text-white text-xs flex items-center space-x-1.5">
                                    <i class="fa-solid ${p.category === 'flyer' ? 'fa-file-lines text-amber-400' : 'fa-book-open text-cyan-400'}"></i>
                                    <span>${escapeHTML(p.name)}</span>
                                </span>
                                <span class="text-[9px] px-1.5 py-0.5 rounded font-mono ${
                                    isCurrent ? 'bg-cyan-500 text-black font-bold' : 'bg-white/10 text-gray-300'
                                }">${escapeHTML(p.badge || 'Format')}</span>
                            </div>
                            <p class="text-[11px] text-gray-400 mb-2 leading-relaxed">${escapeHTML(p.sub || '')}</p>
                            <div class="flex items-center justify-between text-[10px] font-mono text-gray-400 pt-1.5 border-t border-white/5">
                                <span>${p.widthMm} × ${p.heightMm} mm</span>
                                <span>${p.hasFold ? `Pli à ${p.foldXMm} mm` : 'Page simple'}</span>
                                <span>Fond perdu +${p.bleedMm} mm</span>
                            </div>
                            ${isCurrent ? `
                                <div class="mt-2 text-center py-1 bg-cyan-500/20 text-cyan-300 text-[10px] font-bold rounded">
                                    <i class="fa-solid fa-check mr-1"></i>Format Actif
                                </div>
                            ` : ''}
                        </div>
                    `;
                }).join('');
            }

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
            }

            // ==========================================
            // BANQUE DE GABARITS & MODÈLES INDESIGN
            // ==========================================
            openTemplatesModal() {
                const modal = document.getElementById('modal-templates');
                if (!modal) return;
                this.renderTemplatesModalCategories();
                this.renderTemplatesModalCards();
                modal.classList.remove('hidden');
            }

            closeTemplatesModal() {
                const modal = document.getElementById('modal-templates');
                if (modal) modal.classList.add('hidden');
            }

            renderTemplatesModalCategories() {
                const container = document.getElementById('templates-category-filters');
                if (!container) return;
                const bank = window.InDesignTemplatesBank || (typeof InDesignTemplatesBank !== 'undefined' ? InDesignTemplatesBank : null);
                if (!bank) return;
                const activeCat = this.activeTemplateCategory || 'all';

                container.innerHTML = bank.categories.map(cat => `
                    <button onclick="app.filterTemplates('${cat.id}')" class="px-3 py-1 rounded-full text-[11px] whitespace-nowrap font-medium transition flex items-center space-x-1.5 ${
                        activeCat === cat.id
                            ? 'bg-purple-600 text-white font-bold shadow'
                            : 'bg-idInput text-gray-300 hover:bg-white/10 hover:text-white'
                    }">
                        <i class="fa-solid ${cat.icon} text-[10px]"></i>
                        <span>${escapeHTML(cat.name)}</span>
                    </button>
                `).join('');
            }

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
                            <button onclick="app.searchTemplates(''); app.filterTemplates('all');" class="text-xs text-purple-400 hover:underline">Réinitialiser les filtres</button>
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
                                        <button onclick="app.startProjectFromTemplate('${tpl.id}')" 
                                                class="py-2 px-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-[11px] shadow flex items-center justify-center space-x-1.5 transition active:scale-95">
                                            <i class="fa-solid fa-file-circle-plus"></i>
                                            <span>Nouveau Projet</span>
                                        </button>
                                        <button onclick="app.applyTemplateToActivePage('${tpl.id}')" 
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
            }

            filterTemplates(cat) {
                this.activeTemplateCategory = cat;
                this.renderTemplatesModalCategories();
                this.renderTemplatesModalCards();
            }

            searchTemplates(query) {
                this.templatesSearchQuery = query;
                const input = document.getElementById('templates-search-input');
                if (input && input.value !== query) input.value = query;
                this.renderTemplatesModalCards();
            }

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

                tpl.builder(this.engine, 'new_project');
                this.setupGeometryDOM();
                this.renderCurrentFace();
                this.renderInspector();
                this.renderSpreadsNavigator();
                this.updateFormatHeaderUI();
                this.commitState(false);
                this.closeTemplatesModal();
                this.showToast(`Nouveau projet « ${tpl.name} » initialisé avec succès !`);
            }

            applyTemplateToActivePage(tplId) {
                const bank = window.InDesignTemplatesBank || (typeof InDesignTemplatesBank !== 'undefined' ? InDesignTemplatesBank : null);
                if (!bank) return;
                const tpl = bank.getById(tplId);
                if (!tpl) return;

                tpl.builder(this.engine, 'single_face');
                this.renderCurrentFace();
                this.renderInspector();
                this.commitState();
                this.closeTemplatesModal();
                this.showToast(`Gabarit « ${tpl.name} » appliqué à ${this.currentFace.name} !`);
            }

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
            }

            closePageNumberingModal() {
                const modal = document.getElementById('modal-page-numbering');
                if (modal) modal.classList.add('hidden');
            }

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
            }

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
            }

            renderCanvasPageNumberOverlay() {
                const pageEl = document.getElementById('spread-page');
                if (!pageEl) return;

                const oldOverlay = document.getElementById('canvas-page-number-overlay');
                if (oldOverlay) oldOverlay.remove();

                if (!this.engine.pageNumbering || !this.engine.pageNumbering.enabled) return;

                const overlay = document.createElement('div');
                overlay.id = 'canvas-page-number-overlay';
                overlay.className = 'absolute inset-0 pointer-events-none select-none z-20';

                const pn = this.engine.pageNumbering;
                const isSpread = Boolean(this.engine.specs.hasFold);

                const makeFolioSpan = (info) => {
                    if (!info) return '';
                    const xPx = this.mmToPx(info.xMm);
                    const yPx = this.mmToPx(info.yMm);
                    const fontSizePx = Math.max(9, (pn.fontSizePt * 1.333) * (this.zoom || 0.8));
                    return `
                        <div style="position:absolute; left:${xPx}px; top:${yPx}px; transform:translate(-50%, -50%); 
                                    font-family:'${pn.fontFamily}', sans-serif; font-size:${fontSizePx}px; 
                                    color:${pn.color}; font-weight:600; letter-spacing:0.05em; opacity:0.9;" 
                             class="px-2 py-0.5 rounded backdrop-blur-sm bg-black/10">
                            ${escapeHTML(info.text)}
                        </div>
                    `;
                };

                let innerHTML = '';
                if (!isSpread) {
                    const info = this.engine.getPageNumberInfo(this.currentFaceIndex, 'single');
                    if (info) innerHTML += makeFolioSpan(info);
                } else {
                    const leftInfo = this.engine.getPageNumberInfo(this.currentFaceIndex, 'left');
                    const rightInfo = this.engine.getPageNumberInfo(this.currentFaceIndex, 'right');
                    if (leftInfo) innerHTML += makeFolioSpan(leftInfo);
                    if (rightInfo) innerHTML += makeFolioSpan(rightInfo);
                }

                if (innerHTML) {
                    overlay.innerHTML = innerHTML;
                    pageEl.appendChild(overlay);
                }
            }

            // ==========================================
            // INDESIGN-STYLE VECTOR ASSETS & ILLUSTRATIONS PACK
            // ==========================================
            renderIllustrationsTab() {
                const tabEl = document.getElementById('left-tab-illustrations');
                if (!tabEl) return;

                const pack = window.InDesignIllustrationsPack || window.CanvaIllustrationsPack || (typeof InDesignIllustrationsPack !== 'undefined' ? InDesignIllustrationsPack : (typeof CanvaIllustrationsPack !== 'undefined' ? CanvaIllustrationsPack : null));
                if (!pack || !pack.items) {
                    tabEl.innerHTML = '<div class="p-4 text-center text-gray-400">Pack d\'illustrations en cours de chargement...</div>';
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

                let html = `
                    <div class="space-y-3">
                        <div class="relative">
                            <input type="text" 
                                   value="${escapeHTML(this.illustrationsSearchQuery || '')}" 
                                   oninput="app.searchIllustrations(this.value)"
                                   placeholder="Rechercher (filet, losange, sceau, chef, café, vegan...)" 
                                   class="w-full bg-idInput border border-idBorder rounded-lg px-3 py-2 pl-8 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400">
                            <i class="fa-solid fa-magnifying-glass absolute left-2.5 top-2.5 text-gray-400 text-xs"></i>
                            ${query ? `
                                <button onclick="app.searchIllustrations('')" class="absolute right-2.5 top-2 text-gray-400 hover:text-white">
                                    <i class="fa-solid fa-xmark text-xs"></i>
                                </button>
                            ` : ''}
                        </div>

                        <div class="flex items-center space-x-1 overflow-x-auto pb-1 scrollbar-thin">
                            ${categories.map(c => `
                                <button onclick="app.filterIllustrations('${c.id}')" class="px-2 py-1 rounded text-[10px] whitespace-nowrap font-medium transition flex items-center space-x-1 ${
                                    activeCat === c.id 
                                        ? 'bg-cyan-500 text-black font-bold shadow' 
                                        : 'bg-idInput text-gray-300 hover:bg-white/10 hover:text-white'
                                }">
                                    <i class="fa-solid ${c.icon} text-[9px]"></i>
                                    <span>${escapeHTML(c.name.split(' ')[0])}</span>
                                </button>
                            `).join('')}
                        </div>

                        <div class="text-[10px] text-gray-400 flex items-center justify-between px-0.5">
                            <span>${filtered.length} illustrations trouvées</span>
                            <span class="text-cyan-400 font-semibold">Clic pour insérer</span>
                        </div>

                        <div class="grid grid-cols-3 gap-2 max-h-[calc(100vh-270px)] overflow-y-auto pr-1">
                            ${filtered.map(item => `
                                <div onclick="app.addIllustrationObject('${item.id}')" 
                                     title="${escapeHTML(item.name)} (Cliquer pour ajouter au menu)"
                                     class="group aspect-square p-2 rounded-lg bg-idInput/80 border border-idBorder hover:border-cyan-400 hover:bg-cyan-500/10 cursor-pointer flex flex-col items-center justify-between transition transform hover:scale-105 shadow-sm">
                                    <div class="w-full h-12 flex items-center justify-center p-1">
                                        ${pack.buildSVGString(item, { color: item.defaultColor || '#c8a96a' })}
                                    </div>
                                    <span class="text-[9px] text-gray-400 group-hover:text-cyan-300 font-medium text-center truncate w-full mt-1">
                                        ${escapeHTML(item.name)}
                                    </span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;

                tabEl.innerHTML = html;
            }

            filterIllustrations(cat) {
                this.activeIllustrationCategory = cat;
                this.renderIllustrationsTab();
            }

            searchIllustrations(query) {
                this.illustrationsSearchQuery = query;
                this.renderIllustrationsTab();
            }

            addIllustrationObject(id) {
                const pack = window.InDesignIllustrationsPack || window.CanvaIllustrationsPack || (typeof InDesignIllustrationsPack !== 'undefined' ? InDesignIllustrationsPack : (typeof CanvaIllustrationsPack !== 'undefined' ? CanvaIllustrationsPack : null));
                if (!pack) return;
                const item = pack.getItem ? pack.getItem(id) : pack.getById(id);
                if (!item) return;

                const wMm = item.defaultW || (item.category === 'ornements' ? 75 : (item.category === 'allergenes_regimes' ? 18 : 32));
                const hMm = item.defaultH || (item.category === 'ornements' ? 8 : (item.category === 'allergenes_regimes' ? 18 : 32));
                const xMm = Math.max(10, Math.round((this.engine.specs.widthMm - wMm) / 2));
                const yMm = Math.max(10, Math.round((this.engine.specs.heightMm - hMm) / 2));

                const newObj = {
                    id: `illu_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
                    type: 'illustration',
                    title: item.name,
                    illustrationId: item.id,
                    x: xMm,
                    y: yMm,
                    w: wMm,
                    h: hMm,
                    color: item.defaultColor || '#c8a96a',
                    opacity: 1,
                    locked: false,
                    visible: true,
                    flipH: false,
                    flipV: false,
                    rotation: 0
                };

                this.currentFace.objects.push(newObj);
                this.selectedObjectId = newObj.id;
                this.commitState();
                this.renderCurrentFace();
                this.renderInspector();
                this.showToast(`Illustration « ${item.name} » ajoutée !`);
            }

            buildFlyerPromoA4Template(face) {
                if (!face) return;
                face.bgColor = '#0f172a';
                face.objects = [
                    {
                        id: 'flyer_bg_accent',
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
                        id: 'flyer_badge',
                        type: 'text',
                        content: '★ OFFRE SPÉCIALE RESTAURANT ★',
                        x: 35,
                        y: 18,
                        w: 140,
                        h: 10,
                        fontFamily: 'Montserrat',
                        fontSizePt: 10,
                        fontWeight: '700',
                        fontStyle: 'normal',
                        textAlign: 'center',
                        color: '#f59e0b',
                        locked: false
                    },
                    {
                        id: 'flyer_title',
                        type: 'text',
                        content: 'LE MENU DÉCOUVERTE',
                        x: 20,
                        y: 30,
                        w: 170,
                        h: 22,
                        fontFamily: 'Cinzel',
                        fontSizePt: 26,
                        fontWeight: '800',
                        fontStyle: 'normal',
                        textAlign: 'center',
                        color: '#ffffff',
                        locked: false
                    },
                    {
                        id: 'flyer_subtitle',
                        type: 'text',
                        content: 'Une expérience gastronomique inoubliable au cœur de la ville',
                        x: 25,
                        y: 56,
                        w: 160,
                        h: 12,
                        fontFamily: 'Cormorant Garamond',
                        fontSizePt: 13,
                        fontWeight: '500',
                        fontStyle: 'italic',
                        textAlign: 'center',
                        color: '#cbd5e1',
                        locked: false
                    },
                    {
                        id: 'flyer_separator',
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
                        id: 'flyer_price_box',
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
                        id: 'flyer_price_text',
                        type: 'text',
                        content: 'FORMULE COMPLÈTE : 28 €',
                        x: 60,
                        y: 253,
                        w: 90,
                        h: 14,
                        fontFamily: 'Montserrat',
                        fontSizePt: 13,
                        fontWeight: '800',
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
            }

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
            }

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
            }

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
            }

            closeMobileToolsMenu() {
                this.closeMobileSheets();
            }

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
                        <div onclick="app.goToFace(${idx}); app.closeMobileSheets();" class="p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${
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
                            <div class="flex items-center space-x-1 shrink-0" onclick="event.stopPropagation()">
                                <button onclick="app.duplicatePage(${idx}); app.renderMobilePagesList();" class="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white text-xs" title="Dupliquer">
                                    <i class="fa-regular fa-clone"></i>
                                </button>
                                ${this.engine.faces.length > 1 ? `
                                <button onclick="app.removePage(${idx}); app.renderMobilePagesList();" class="p-2 hover:bg-rose-500/20 rounded-lg text-gray-400 hover:text-rose-400 text-xs" title="Supprimer">
                                    <i class="fa-regular fa-trash-can"></i>
                                </button>` : ''}
                            </div>
                        </div>
                    `;
                });

                container.innerHTML = html;
            }

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
                               oninput="app.searchIllustrations(this.value); app.renderMobileCanvaSheet();"
                               placeholder="Rechercher (filet, losange, sceau, chef, café, vegan...)" 
                               class="w-full bg-idInput border border-idBorder rounded-xl px-3 py-2.5 pl-8 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-pink-400">
                        <i class="fa-solid fa-magnifying-glass absolute left-2.5 top-3 text-gray-400 text-xs"></i>
                        ${query ? `
                            <button onclick="app.searchIllustrations(''); app.renderMobileCanvaSheet();" class="absolute right-2.5 top-2.5 text-gray-400 hover:text-white">
                                <i class="fa-solid fa-xmark text-xs"></i>
                            </button>
                        ` : ''}
                    </div>

                    <div class="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-thin">
                        ${categories.map(c => `
                            <button onclick="app.filterIllustrations('${c.id}'); app.renderMobileCanvaSheet();" class="px-2.5 py-1 rounded-full text-[10px] whitespace-nowrap font-medium transition flex items-center space-x-1 ${
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
                            <div onclick="app.addIllustrationObject('${item.id}'); app.closeMobileSheets();" 
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
            }

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
                            <span class="font-bold text-white">${escapeHTML(obj.title || obj.type)}</span>
                            <button onclick="app.deleteSelected(); app.closeMobileSheets();" class="text-rose-400 hover:text-rose-300 font-semibold text-xs flex items-center space-x-1 px-2 py-1 bg-rose-500/15 rounded">
                                <i class="fa-solid fa-trash-can"></i>
                                <span>Supprimer</span>
                            </button>
                        </div>
                `;

                if (obj.type === 'text') {
                    html += `
                        <div>
                            <label class="text-gray-400 text-[11px] block mb-1">Contenu texte :</label>
                            <textarea oninput="app.updateSelectedProp('content', this.value)" class="w-full bg-idInput border border-idBorder rounded p-2 text-white text-xs">${escapeHTML(obj.content || '')}</textarea>
                        </div>
                        <div class="grid grid-cols-2 gap-2">
                            <div>
                                <label class="text-gray-400 text-[11px] block mb-1">Taille (pt) :</label>
                                <input type="number" step="0.5" value="${obj.fontSizePt || 12}" onchange="app.updateSelectedProp('fontSizePt', parseFloat(this.value))" class="w-full bg-idInput border border-idBorder rounded p-1.5 text-white">
                            </div>
                            <div>
                                <label class="text-gray-400 text-[11px] block mb-1">Couleur :</label>
                                <input type="color" value="${obj.color || '#ffffff'}" onchange="app.updateSelectedProp('color', this.value)" class="w-full h-8 bg-idInput border border-idBorder rounded cursor-pointer">
                            </div>
                        </div>
                    `;
                } else if (obj.type === 'dish_row') {
                    html += `
                        <div class="space-y-2">
                            <div>
                                <label class="text-gray-400 text-[11px] block mb-1">Nom du plat :</label>
                                <input type="text" value="${escapeHTML(obj.dishName || '')}" oninput="app.updateSelectedProp('dishName', this.value)" class="w-full bg-idInput border border-idBorder rounded p-2 text-white font-bold">
                            </div>
                            <div>
                                <label class="text-gray-400 text-[11px] block mb-1">Prix affiché :</label>
                                <input type="text" value="${escapeHTML(obj.priceText || '')}" oninput="app.updateSelectedProp('priceText', this.value)" class="w-full bg-idInput border border-idBorder rounded p-2 text-emerald-400 font-mono font-bold">
                            </div>
                            <div>
                                <label class="text-gray-400 text-[11px] block mb-1">Description / Ingrédients :</label>
                                <input type="text" value="${escapeHTML(obj.descText || '')}" oninput="app.updateSelectedProp('descText', this.value)" class="w-full bg-idInput border border-idBorder rounded p-2 text-gray-300">
                            </div>
                        </div>
                    `;
                } else if (obj.type === 'illustration') {
                    html += `
                        <div>
                            <label class="text-gray-400 text-[11px] block mb-1">Teinte de l'illustration :</label>
                            <input type="color" value="${obj.color || '#c8a96a'}" onchange="app.updateSelectedProp('color', this.value)" class="w-full h-9 bg-idInput border border-idBorder rounded cursor-pointer">
                        </div>
                    `;
                }

                html += `
                        <div class="pt-2 border-t border-idBorder flex justify-end">
                            <button onclick="app.closeMobileSheets()" class="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold text-xs">
                                Terminer
                            </button>
                        </div>
                    </div>
                `;

                container.innerHTML = html;
            }
        }

        // Launch Application on DOM ready
        let app;
        function initInMenuStudioApp() {
            try {
                app = new InMenuStudioApp();
                if (typeof window !== 'undefined') {
                    window.app = app;
                }
            } catch (err) {
                console.error("Critical error starting InMenuStudioApp:", err);
            }
        }

        if (typeof document !== 'undefined') {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', initInMenuStudioApp);
            } else {
                initInMenuStudioApp();
            }
        }
    