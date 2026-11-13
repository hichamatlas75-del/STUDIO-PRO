/**
 * MODULE 2: VisualCanvasEditor & Application Controller (app.js)
 */
class InMenuStudioApp {
            constructor() {
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
                requestAnimationFrame(() => this.renderRulers());
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
                const saved = this.engine.saveState();
                this.updateAutoSaveUI(saved);
                this.updateUndoRedoButtons();
                if (!skipRender) {
                    this.renderCurrentFace();
                }
            }

            commitStateDebounced() {
                clearTimeout(this.debounceSaveTimer);
                this.debounceSaveTimer = setTimeout(() => {
                    this.debounceSaveTimer = null;
                    const saved = this.engine.saveState();
                    this.updateAutoSaveUI(saved);
                    this.updateUndoRedoButtons();
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
                const saved = this.engine.saveState();
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

                // Fold Safety Zone (160mm to 180mm -> 20mm wide centered at 170mm)
                foldZoneEl.style.left = `${this.mmToPx(specs.foldXMm - specs.safeFoldHalfMm)}px`;
                foldZoneEl.style.width = `${this.mmToPx(specs.safeFoldHalfMm * 2)}px`;

                // Central Fold Line at 170mm
                foldLineEl.style.left = `${this.mmToPx(specs.foldXMm)}px`;

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
                const vw = Math.max(200, viewport.clientWidth - 96);
                const vh = Math.max(200, viewport.clientHeight - 96);
                const pageW = this.mmToPx(346);
                const pageH = this.mmToPx(306);
                const scale = Math.min(vw / pageW, vh / pageH);
                this.setZoom(scale);
            }

            renderRulers() {
                const topRuler = document.getElementById('ruler-top');
                const leftRuler = document.getElementById('ruler-left');
                const pageEl = document.getElementById('spread-page');
                if (!topRuler || !leftRuler || !pageEl) return;

                const pageRect = pageEl.getBoundingClientRect();
                const topRect = topRuler.getBoundingClientRect();
                const leftRect = leftRuler.getBoundingClientRect();

                const originX = pageRect.left - topRect.left;
                const originY = pageRect.top - leftRect.top;
                const stepCmPx = this.mmToPx(10) * this.zoom;

                topRuler.innerHTML = '';
                leftRuler.innerHTML = '';

                // Horizontal 0 to 34 cm
                for (let cm = 0; cm <= 34; cm++) {
                    const mark = document.createElement('div');
                    mark.className = 'absolute top-0 bottom-0 border-l border-gray-600 pl-1 flex items-end pb-0.5 select-none whitespace-nowrap';
                    mark.style.left = `${originX + cm * stepCmPx}px`;
                    if (cm === 17) {
                        mark.className += ' text-cyan-400 font-bold border-cyan-400';
                        mark.textContent = '17 (Pli)';
                    } else {
                        mark.textContent = String(cm);
                    }
                    topRuler.appendChild(mark);
                }

                // Vertical 0 to 30 cm
                for (let cm = 0; cm <= 30; cm++) {
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
                document.getElementById('footer-face-title').textContent = face.name;
                document.getElementById('footer-face-sub').textContent = `Face ${this.currentFaceIndex + 1} / 10 • 340×300 mm (Pli 170 mm)`;
                document.getElementById('db-count-badge').textContent = this.engine.dishesDB.length;

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
                wrapper.className = `group cursor-move select-none ${
                    isSelected
                        ? 'ring-2 ring-blue-500'
                        : (!this.previewMode ? 'hover:ring-1 hover:ring-blue-400/60' : '')
                }`;

                // Mouse Down to Select & Drag
                wrapper.addEventListener('mousedown', (e) => {
                    e.stopPropagation();
                    if (this.selectedObjectId !== obj.id) {
                        this.selectObject(obj.id);
                    }
                    const currentObj = this.currentFace.objects.find(o => o.id === obj.id);
                    if (currentObj) {
                        this.startDragObject(e, currentObj);
                    }
                });

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

                wrapper.appendChild(content);

                // If Selected: Add 8 Resize Handles + Millimeter Coordinate Pill
                if (isSelected) {
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

                    const badge = document.createElement('div');
                    badge.id = `coord_pill_${obj.id}`;
                    badge.className = 'absolute -top-5 left-0 bg-blue-600 text-white font-mono text-[9px] px-1.5 py-0.5 rounded shadow whitespace-nowrap pointer-events-none z-50';
                    badge.textContent = `${obj.w} × ${obj.h} mm  (X:${obj.x}, Y:${obj.y})`;
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
                if (this.previewMode || (e.button !== undefined && e.button !== 0)) return;
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

                badge.textContent = obj.type.toUpperCase();

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

                // Duplicate & Delete Actions
                html += `
                    <div class="pt-3 border-t border-idBorder flex space-x-2">
                        <button onclick="app.duplicateSelected()" class="flex-1 bg-idInput hover:bg-white/10 text-gray-200 border border-idBorder py-1.5 rounded font-medium">
                            <i class="fa-regular fa-clone mr-1"></i> Dupliquer
                        </button>
                        <button onclick="app.deleteSelected()" class="flex-1 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 py-1.5 rounded font-medium">
                            <i class="fa-regular fa-trash-can mr-1"></i> Supprimer
                        </button>
                    </div>
                `;

                container.innerHTML = html;
            }

            updateObjProp(prop, val, debounce = false) {
                const obj = this.selectedObject;
                if (!obj) return;

                const numericProps = ['x', 'y', 'w', 'h', 'fontSize', 'radius', 'borderWidth', 'opacity'];
                if (numericProps.includes(prop)) {
                    if (typeof val !== 'number' || !Number.isFinite(val)) return;
                    if (prop === 'w') val = Math.max(8, val);
                    else if (prop === 'h') val = Math.max(6, val);
                    else if (prop === 'fontSize') val = Math.max(5, val);
                    else if (prop === 'radius' || prop === 'borderWidth') val = Math.max(0, val);
                    else if (prop === 'opacity') val = Math.max(0.05, Math.min(1, val));
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
                        cx.fillStyle = '#ffffff';
                        cx.fillRect(0, 0, c.width, c.height);
                        cx.drawImage(img, 0, 0, c.width, c.height);
                        const out = c.toDataURL('image/jpeg', 0.9);
                        c.width = c.height = 0;
                        resolve(out.length < dataUrl.length ? out : dataUrl);
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

            deleteSelected() {
                if (!this.selectedObjectId) return;
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
                            <div class="truncate flex items-center space-x-2">
                                <span class="w-2 h-2 rounded-full bg-blue-400 shrink-0"></span>
                                <span class="truncate font-medium">${escapeHTML(obj.name || obj.type)}</span>
                            </div>
                            <span class="font-mono text-[9px] text-gray-400 ml-2 shrink-0">${obj.x},${obj.y}mm</span>
                        </div>
                    `;
                }).join('');
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

            renderSpreadsNavigator() {
                const container = document.getElementById('spreads-navigator-list');
                if (!container) return;

                let html = '';
                for (let sheet = 1; sheet <= 5; sheet++) {
                    const rectoIdx = (sheet - 1) * 2;
                    const versoIdx = rectoIdx + 1;
                    const recto = this.engine.faces[rectoIdx];
                    const verso = this.engine.faces[versoIdx];

                    html += `
                        <div class="bg-idInput border border-idBorder rounded p-2 space-y-2">
                            <div class="flex items-center justify-between text-[11px] font-bold text-gray-200 border-b border-idBorder pb-1">
                                <span><i class="fa-solid fa-scroll text-amber-400 mr-1"></i> Feuille ${sheet} (34 × 30 cm)</span>
                                <span class="font-mono text-[9px] text-gray-400">Pli 17cm</span>
                            </div>
                            <div class="grid grid-cols-2 gap-2">
                                <!-- Recto Miniature -->
                                <div onclick="app.goToFace(${rectoIdx})" class="cursor-pointer p-1.5 rounded border transition ${
                                    this.currentFaceIndex === rectoIdx ? 'border-blue-500 bg-blue-500/15' : 'border-idBorder hover:border-gray-500 bg-idPanel'
                                }">
                                    <div class="h-14 w-full rounded-sm relative flex border border-black/40 overflow-hidden mb-1" style="background:${escapeHTML(recto.bgColor || '#fdfbf7')}">
                                        <div class="w-1/2 h-full border-r border-dashed border-cyan-500/70 flex items-center justify-center text-[8px] font-mono text-gray-500">17cm G</div>
                                        <div class="w-1/2 h-full flex items-center justify-center text-[8px] font-mono text-gray-500">17cm D</div>
                                    </div>
                                    <div class="flex items-center justify-between text-[10px]">
                                        <span class="font-semibold text-white">Recto</span>
                                        <span class="text-gray-400 font-mono">${recto.objects.length} blocs</span>
                                    </div>
                                </div>
                                <!-- Verso Miniature -->
                                <div onclick="app.goToFace(${versoIdx})" class="cursor-pointer p-1.5 rounded border transition ${
                                    this.currentFaceIndex === versoIdx ? 'border-blue-500 bg-blue-500/15' : 'border-idBorder hover:border-gray-500 bg-idPanel'
                                }">
                                    <div class="h-14 w-full rounded-sm relative flex border border-black/40 overflow-hidden mb-1" style="background:${escapeHTML(verso.bgColor || '#fdfbf7')}">
                                        <div class="w-1/2 h-full border-r border-dashed border-cyan-500/70 flex items-center justify-center text-[8px] font-mono text-gray-500">17cm G</div>
                                        <div class="w-1/2 h-full flex items-center justify-center text-[8px] font-mono text-gray-500">17cm D</div>
                                    </div>
                                    <div class="flex items-center justify-between text-[10px]">
                                        <span class="font-semibold text-white">Verso</span>
                                        <span class="text-gray-400 font-mono">${verso.objects.length} blocs</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                }
                container.innerHTML = html;
            }

            goToFace(index) {
                this.currentFaceIndex = Math.max(0, Math.min(9, index));
                this.selectedObjectId = null;
                this.renderCurrentFace();
                this.renderInspector();
            }

            prevFace() {
                this.goToFace((this.currentFaceIndex + 9) % 10);
            }

            nextFace() {
                this.goToFace((this.currentFaceIndex + 1) % 10);
            }

            switchLeftTab(tab) {
                const blocksTab = document.getElementById('left-tab-blocks');
                const pagesTab = document.getElementById('left-tab-pages');
                const btnBlocks = document.getElementById('tab-btn-blocks');
                const btnPages = document.getElementById('tab-btn-pages');

                if (tab === 'blocks') {
                    blocksTab.classList.remove('hidden');
                    pagesTab.classList.add('hidden');
                    btnBlocks.className = 'flex-1 py-2 text-center border-b-2 border-blue-500 text-white bg-idPanel';
                    btnPages.className = 'flex-1 py-2 text-center border-b-2 border-transparent text-gray-400 hover:text-gray-200';
                } else {
                    blocksTab.classList.add('hidden');
                    pagesTab.classList.remove('hidden');
                    btnPages.className = 'flex-1 py-2 text-center border-b-2 border-blue-500 text-white bg-idPanel';
                    btnBlocks.className = 'flex-1 py-2 text-center border-b-2 border-transparent text-gray-400 hover:text-gray-200';
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
                const tbody = document.getElementById('db-table-body');
                const list = filter === 'ALL'
                    ? this.engine.dishesDB
                    : this.engine.dishesDB.filter(d => d.category === filter);

                if (list.length === 0) {
                    tbody.innerHTML = `<tr><td colspan="7" class="py-6 text-center text-gray-500 text-xs">Aucun plat dans cette catégorie.</td></tr>`;
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

            async exportCurrentFacePNG() {
                const includeCropMarks = document.getElementById('exp-cropmarks').checked;
                const includeBleed = document.getElementById('exp-bleed').checked;
                const scalePxPerMm = this.getSelectedExportScale();
                const progress = document.getElementById('export-progress');
                const progressText = document.getElementById('export-progress-text');
                progress.classList.remove('hidden');
                if (progressText) progressText.textContent = `Rendu PNG ${this.currentFace.name}...`;

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

                    // Blob + Object URL : évite les data-URL géantes (plusieurs dizaines de Mo à 300 DPI)
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.download = `Menu_34x30_${this.currentFace.id}.png`;
                    link.href = url;
                    link.click();
                    setTimeout(() => URL.revokeObjectURL(url), 2000);

                    if (failedImages && failedImages.length > 0) {
                        this.showToast(`PNG exporté avec avertissement : ${failedImages.length} photo(s) externe(s) bloquée(s) (CORS/réseau).`);
                    } else {
                        this.showToast('Planche exportée en PNG Haute Définition !');
                    }
                } catch (err) {
                    console.error(err);
                    this.showToast('Erreur lors de la génération PNG');
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
                    const facesToExport = scope === 'all' ? this.engine.faces : [this.currentFace];
                    const allFailedImages = new Set();

                    let pdf = null;

                    for (let i = 0; i < facesToExport.length; i++) {
                        const face = facesToExport[i];
                        progressText.textContent = `Rendu Pré-Presse ${face.name} (${i + 1}/${facesToExport.length})...`;
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
                        ? 'Menu_Complet_10_Faces_34x30cm_PrePresse.pdf'
                        : `Menu_${this.currentFace.id}_34x30cm.pdf`;

                    pdf.save(filename);
                    if (allFailedImages.size > 0) {
                        this.showToast(`PDF généré, mais ${allFailedImages.size} photo(s) externe(s) n'ont pas pu être intégrées (CORS/réseau).`);
                    } else {
                        this.showToast('PDF Imprimeur généré avec traits de coupe & pli !');
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

            exportProjectJSON() {
                const blob = new Blob([this.engine.toJSON()], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.download = 'Projet_Menu_34x30cm.inmenu.json';
                link.href = url;
                link.click();
                setTimeout(() => URL.revokeObjectURL(url), 1000);
                this.showToast('Sauvegarde JSON téléchargée !');
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
                        this.populateQuickDishSelect();
                        this.renderCurrentFace();
                        this.renderInspector();
                        this.updateUndoRedoButtons();
                        this.updateAutoSaveUI(this.engine.lastSaveSuccess);
                        this.showToast('Projet JSON chargé avec succès !');
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

                    const keyLower = e.key.toLowerCase();
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
                    }
                });
            }

            showToast(msg) {
                const toast = document.getElementById('toast');
                document.getElementById('toast-msg').textContent = msg;
                toast.classList.remove('translate-y-20', 'opacity-0');
                clearTimeout(this.toastTimer);
                this.toastTimer = setTimeout(() => {
                    toast.classList.add('translate-y-20', 'opacity-0');
                }, 2600);
            }
        }

        // Launch Application on Window Load
        let app;
        window.onload = function () {
            app = new InMenuStudioApp();
        };
    