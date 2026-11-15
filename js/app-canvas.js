/**
 * MODULE 2B: Visual Canvas Rendering, Rulers, Drag/Resize, Smart Snapping & Illustrations (app-canvas.js)
 */
const OFFLINE_PHOTO_PLACEHOLDER = 'data:image/svg+xml;utf8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" width="600" height="400">' +
    '<rect width="600" height="400" fill="#1e293b"/>' +
    '<rect x="16" y="16" width="568" height="368" fill="none" stroke="#c8a96a" stroke-width="2" stroke-dasharray="6,6" opacity="0.5"/>' +
    '<circle cx="300" cy="175" r="38" fill="none" stroke="#c8a96a" stroke-width="2.5" opacity="0.8"/>' +
    '<text x="300" y="182" text-anchor="middle" fill="#c8a96a" font-family="Georgia,serif" font-size="18" font-weight="bold">PHOTO</text>' +
    '<text x="300" y="255" text-anchor="middle" fill="#e2e8f0" font-family="sans-serif" font-size="20" font-weight="bold">Photo Gastronomique</text>' +
    '<text x="300" y="285" text-anchor="middle" fill="#94a3b8" font-family="monospace" font-size="13">Importez une image locale depuis l’inspecteur</text>' +
    '</svg>'
);

Object.assign(InMenuStudioApp.prototype, {
    setupGeometryDOM() {
        const specs = this.engine.specs;
        const wrapperEl = document.getElementById('spread-wrapper');
        const bleedClipEl = document.getElementById('bleed-clip');
        const pageEl = document.getElementById('spread-page');
        const bleedEl = document.getElementById('guide-bleed');
        const marginEl = document.getElementById('guide-outer-margin');
        const foldZoneEl = document.getElementById('guide-fold-zone');
        const foldLineEl = document.getElementById('guide-fold-line');
        if (!wrapperEl || !bleedClipEl || !pageEl || !bleedEl || !marginEl) return;

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
    },

    applyZoomTransform() {
        const specs = this.engine.specs;
        const stage = document.getElementById('spread-stage');
        const wrapper = document.getElementById('spread-wrapper');

        if (stage) {
            stage.style.width = `${this.mmToPx(specs.widthMm) * this.zoom}px`;
            stage.style.height = `${this.mmToPx(specs.heightMm) * this.zoom}px`;
        }
        if (wrapper) {
            wrapper.style.transform = `scale(${this.zoom})`;
        }

        const zoomSelect = document.getElementById('zoom-select');
        const customOpt = document.getElementById('zoom-custom-opt');
        const zoomStr = String(this.zoom);
        const standardValues = ['0.35', '0.5', '0.65', '0.8', '1', '1.25', '1.5'];
        if (zoomSelect) {
            if (standardValues.includes(zoomStr)) {
                if (customOpt) customOpt.hidden = true;
                zoomSelect.value = zoomStr;
            } else if (customOpt) {
                customOpt.value = zoomStr;
                customOpt.textContent = `${Math.round(this.zoom * 100)}%`;
                customOpt.hidden = false;
                zoomSelect.value = zoomStr;
            }
        }

        requestAnimationFrame(() => this.renderRulers());
    },

    setZoom(val) {
        if (!Number.isFinite(val)) return;
        this.zoom = Math.max(0.35, Math.min(1.75, +val.toFixed(2)));
        this.applyZoomTransform();
    },

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
    },

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
    },

    // Render Current Face Objects onto the DOM Canvas
    renderCurrentFace() {
        const face = this.currentFace;
        const bleedClipEl = document.getElementById('bleed-clip');
        const pageEl = document.getElementById('spread-page');
        const layerEl = document.getElementById('objects-layer');
        if (!face || !pageEl || !layerEl) return;

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
    },

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
            if (e.target && (e.target.isContentEditable || (e.target.closest && e.target.closest('[contenteditable="true"]')))) {
                e.stopPropagation();
                return;
            }
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

        if (obj.type === 'shape' || obj.type === 'frame') {
            const bw = obj.borderWidth ?? obj.borderWidthPt ?? 0;
            content.style.backgroundColor = obj.bgColor || obj.backgroundColor || 'transparent';
            content.style.borderColor = obj.borderColor || 'transparent';
            content.style.borderWidth = `${bw}px`;
            content.style.borderStyle = (bw > 0 && obj.borderColor && obj.borderColor !== 'transparent') ? (obj.borderStyle || 'solid') : 'none';
            content.style.borderRadius = `${this.mmToPx(obj.radius ?? obj.borderRadius ?? 0)}px`;
        }
        else if (obj.type === 'vertical_banner') {
            content.style.backgroundColor = obj.bgColor || '#1e293b';
            content.style.color = obj.textColor || '#ffffff';
            content.style.borderRadius = `${this.mmToPx(obj.radius ?? 2)}px`;
            content.className += ' flex items-center justify-center font-montserrat font-bold tracking-widest uppercase shadow-sm';
            content.style.fontSize = `${this.mmToPx((obj.fontSize || 12) * PT_TO_MM)}px`;
            const span = document.createElement('span');
            span.className = 'vertical-banner-text whitespace-nowrap';
            span.title = 'Double-cliquez pour modifier le texte du bandeau';
            span.textContent = obj.text || 'CATÉGORIE';
            content.appendChild(span);
            this.attachInlineTextEditing(span, obj, (val) => {
                obj.text = val;
                obj.name = `Bandeau : ${val || 'CATÉGORIE'}`;
            }, { singleLine: true });
        }
        else if (obj.type === 'badge_new') {
            content.style.backgroundColor = obj.bgColor || '#e11d48';
            content.style.color = obj.textColor || '#ffffff';
            content.style.borderRadius = `${this.mmToPx(obj.radius ?? 8)}px`;
            content.className += ' flex items-center justify-center font-montserrat font-extrabold tracking-wider uppercase shadow-md';
            content.style.fontSize = `${Math.max(this.mmToPx(2.8), this.mmToPx(obj.h) * 0.42)}px`;
            const span = document.createElement('span');
            span.title = 'Double-cliquez pour modifier le texte du badge';
            span.textContent = obj.text || 'NOUVEAU';
            content.appendChild(span);
            this.attachInlineTextEditing(span, obj, (val) => {
                obj.text = val;
                obj.name = `Badge : ${val || 'NOUVEAU'}`;
            }, { singleLine: true });
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
                <div data-logo-field="title" title="Double-cliquez pour modifier le nom" class="font-cinzel font-bold tracking-widest leading-none truncate max-w-full" style="font-size:${titleSize}px;">${escapeHTML(obj.title ?? 'GREY CORNER')}</div>
                <div data-logo-field="subtitle" title="Double-cliquez pour modifier le sous-titre" class="font-montserrat tracking-[0.22em] opacity-85 truncate max-w-full" style="font-size:${subSize}px; margin-top:${Math.max(2, hPx * 0.04)}px;">${escapeHTML(obj.subtitle ?? 'CAFÉ • SINCE 2024')}</div>
            `;
            const titleEl = content.querySelector('[data-logo-field="title"]');
            const subEl = content.querySelector('[data-logo-field="subtitle"]');
            if (titleEl) this.attachInlineTextEditing(titleEl, obj, (val) => { obj.title = val; }, { singleLine: true });
            if (subEl) this.attachInlineTextEditing(subEl, obj, (val) => { obj.subtitle = val; }, { singleLine: true });
        }
        else if (obj.type === 'dish_item') {
            const dish = this.engine.getDishById(obj.dishId) || {
                id: '',
                name: obj.customName || 'Plat Personnalisé',
                desc: obj.customDesc ?? 'Ingrédients et préparation',
                price: obj.customPrice ?? '00 DH',
                badge: obj.customBadge || ''
            };
            content.innerHTML = this.buildDishRowHTML(dish, {
                nameColor: obj.textColor || obj.color || '#1e293b',
                descColor: obj.descColor || obj.dotsColor || '#64748b',
                priceColor: obj.priceColor || obj.color || '#9a3412',
                fontSize: obj.fontSize || obj.fontSizePt || 11
            });
            this.attachDishInlineEditing(content, obj);
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
                        <span data-edit-cat-title="true" title="Double-cliquez pour modifier le titre de section" class="font-serif font-bold tracking-wide truncate" style="color:${escapeHTML(obj.titleColor || '#9a3412')}; font-size:${titleSizePx}px; line-height:1.15;">${escapeHTML(obj.title)}</span>
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

            const catTitleEl = content.querySelector('[data-edit-cat-title="true"]');
            if (catTitleEl) {
                this.attachInlineTextEditing(catTitleEl, obj, (val) => {
                    obj.title = val;
                }, { singleLine: true });
            }
            this.attachDishInlineEditing(content, obj);

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
            imgEl.src = safeUrl || OFFLINE_PHOTO_PLACEHOLDER;
            imgEl.className = 'w-full h-full object-cover pointer-events-none';
            imgEl.onerror = function () {
                if (!this.dataset.fallbackApplied) {
                    this.dataset.fallbackApplied = '1';
                    this.src = OFFLINE_PHOTO_PLACEHOLDER;
                }
            };
            content.appendChild(imgEl);
            if (obj.caption) {
                const capEl = document.createElement('div');
                capEl.className = 'absolute bottom-0 inset-x-0 bg-black/65 text-white font-serif italic px-2 flex items-center justify-center text-center truncate';
                capEl.style.height = `${this.mmToPx(7.5)}px`;
                capEl.style.fontSize = `${this.mmToPx(3.1)}px`;
                capEl.title = 'Double-cliquez pour modifier la légende';
                capEl.textContent = obj.caption;
                content.appendChild(capEl);
                this.attachInlineTextEditing(capEl, obj, (val) => { obj.caption = val; }, { singleLine: true });
            }
        }
        else if (obj.type === 'text' || obj.type === 'title_heading' || obj.type === 'category_header') {
            content.style.fontFamily = obj.fontFamily || 'Playfair Display';
            content.style.fontSize = `${this.mmToPx((obj.fontSize || obj.fontSizePt || 12) * PT_TO_MM)}px`;
            content.style.lineHeight = obj.lineHeight || '1.35';
            if (obj.letterSpacing) content.style.letterSpacing = `${obj.letterSpacing}em`;
            content.style.color = obj.color || '#1e293b';
            content.style.textAlign = obj.align || obj.textAlign || 'left';
            content.style.fontWeight = obj.fontWeight || (obj.type === 'title_heading' ? '700' : '500');
            content.className += ' whitespace-pre-line';
            content.title = 'Double-cliquez pour modifier ce texte directement sur le canevas';
            content.textContent = obj.text ?? obj.customName ?? obj.content ?? '';
            this.attachInlineTextEditing(content, obj, (val) => {
                obj.text = val;
                if ('content' in obj) obj.content = val;
                if ('customName' in obj) obj.customName = val;
                obj.name = `Texte : ${(val || '').slice(0, 28)}`;
            }, { singleLine: false });
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
            content.title = 'Double-cliquez pour modifier le numéro de page';
            content.textContent = obj.text || `— ${this.currentFaceIndex + 1} —`;
            this.attachInlineTextEditing(content, obj, (val) => { obj.text = val; }, { singleLine: true });
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

            const isTextEditableType = ['text', 'title_heading', 'category_header', 'dish_item', 'category_list', 'vertical_banner', 'badge_new', 'logo', 'page_number'].includes(obj.type);
            const badge = document.createElement('div');
            badge.id = `coord_pill_${obj.id}`;
            badge.className = `absolute -top-5 left-0 ${obj.locked ? 'bg-amber-600' : 'bg-blue-600'} text-white font-mono text-[9px] px-1.5 py-0.5 rounded shadow whitespace-nowrap z-50 flex items-center space-x-1.5`;
            const coordSpan = document.createElement('span');
            coordSpan.className = 'pointer-events-none';
            coordSpan.textContent = `${obj.locked ? '🔒 ' : ''}${obj.w} × ${obj.h} mm  (X:${obj.x}, Y:${obj.y})`;
            badge.appendChild(coordSpan);

            if (isTextEditableType && !obj.locked) {
                const editBtn = document.createElement('button');
                editBtn.type = 'button';
                editBtn.className = 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-sans font-bold px-1.5 py-0 rounded text-[8.5px] pointer-events-auto cursor-pointer flex items-center space-x-1 shadow-sm';
                editBtn.title = 'Modifier le texte directement sur le canevas (ou double-cliquez sur un texte)';
                editBtn.innerHTML = '<i class="fa-solid fa-pen-to-square"></i><span>Éditer TXT</span>';
                editBtn.addEventListener('mousedown', (e) => e.stopPropagation());
                editBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const firstEditable = content.querySelector('[data-edit-cat-title], [data-edit-dish-field="name"], [data-logo-field="title"], span') || content;
                    firstEditable.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, cancelable: true }));
                });
                badge.appendChild(editBtn);
            }

            wrapper.appendChild(badge);
        }

        return wrapper;
    },

    /**
     * Active l'édition directe du texte sur le canevas par double-clic (type Adobe InDesign / Canva)
     */
    attachInlineTextEditing(targetEl, obj, onSave, options = {}) {
        if (!targetEl) return;
        targetEl.addEventListener('dblclick', (e) => {
            if (this.previewMode) return;
            e.stopPropagation();
            e.preventDefault();
            if (obj.locked) {
                this.showToast('Ce bloc est verrouillé. Déverrouillez-le pour modifier son texte.');
                return;
            }
            if (targetEl.isContentEditable) return;

            if (this.selectedObjectId !== obj.id) {
                this.selectedObjectId = obj.id;
                this.renderInspector();
            }

            // Si c'est un placeholder de description vide, on vide le texte avant édition
            if (targetEl.dataset.emptyDesc === 'true') {
                targetEl.textContent = '';
                delete targetEl.dataset.emptyDesc;
                targetEl.classList.remove('opacity-0', 'group-hover:opacity-60', 'italic');
            }

            const initialText = targetEl.innerText;
            targetEl.contentEditable = 'true';
            targetEl.spellcheck = false;
            targetEl.style.outline = '2px solid #10b981';
            targetEl.style.outlineOffset = '2px';
            targetEl.style.backgroundColor = 'rgba(16, 185, 129, 0.12)';
            targetEl.style.borderRadius = '3px';
            targetEl.style.cursor = 'text';
            targetEl.style.userSelect = 'text';
            targetEl.style.minWidth = '16px';

            targetEl.focus();
            try {
                const range = document.createRange();
                range.selectNodeContents(targetEl);
                const sel = window.getSelection();
                sel.removeAllRanges();
                sel.addRange(range);
            } catch (_) { /* ignore selection error */ }

            const handleLiveInput = () => {
                const raw = options.singleLine
                    ? targetEl.innerText.replace(/[\r\n]+/g, ' ')
                    : targetEl.innerText;
                onSave(raw, true);
                this.commitStateDebounced();
            };

            const handleInlineKey = (ke) => {
                ke.stopPropagation();
                if (ke.key === 'Escape') {
                    ke.preventDefault();
                    targetEl.innerText = initialText;
                    onSave(initialText, false);
                    targetEl.blur();
                } else if ((options.singleLine && ke.key === 'Enter') || ((ke.ctrlKey || ke.metaKey) && ke.key === 'Enter')) {
                    ke.preventDefault();
                    targetEl.blur();
                }
            };

            const handleInlineBlur = () => {
                targetEl.removeEventListener('input', handleLiveInput);
                targetEl.removeEventListener('keydown', handleInlineKey);
                targetEl.removeEventListener('blur', handleInlineBlur);
                targetEl.contentEditable = 'false';
                targetEl.style.outline = '';
                targetEl.style.outlineOffset = '';
                targetEl.style.backgroundColor = '';
                targetEl.style.borderRadius = '';
                targetEl.style.cursor = '';
                targetEl.style.userSelect = '';

                const finalVal = (options.singleLine
                    ? targetEl.innerText.replace(/[\r\n]+/g, ' ')
                    : targetEl.innerText).trim();
                onSave(finalVal, false);
                this.commitState(false);
                this.renderInspector();
            };

            targetEl.addEventListener('input', handleLiveInput);
            targetEl.addEventListener('keydown', handleInlineKey);
            targetEl.addEventListener('blur', handleInlineBlur);
        });
    },

    /**
     * Active l'édition directe par double-clic sur le nom, le prix ou la description
     * de chaque plat dans un bloc dish_item ou category_list
     */
    attachDishInlineEditing(containerEl, obj) {
        if (!containerEl) return;
        const rows = containerEl.querySelectorAll('[data-dish-row]');
        rows.forEach(rowEl => {
            const dishId = rowEl.dataset.dishId || '';
            const fields = rowEl.querySelectorAll('[data-edit-dish-field]');
            fields.forEach(fieldEl => {
                const field = fieldEl.dataset.editDishField; // 'name' | 'price' | 'desc'
                this.attachInlineTextEditing(fieldEl, obj, (val) => {
                    if (dishId) {
                        const dbDish = this.engine.getDishById(dishId);
                        if (dbDish) {
                            dbDish[field] = val;
                        }
                    } else if (obj.type === 'dish_item') {
                        if (field === 'name') obj.customName = val;
                        else if (field === 'price') obj.customPrice = val;
                        else if (field === 'desc') obj.customDesc = val;
                    }
                }, { singleLine: field !== 'desc' });
            });
        });
    },

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
            ? `<div data-edit-dish-field="desc" title="Double-cliquez pour modifier la description" class="font-sans leading-snug pr-4" style="color:${escapeHTML(style.descColor)}; font-size:${descSizePx}px; margin-top:${this.mmToPx(0.8)}px;">${escapeHTML(cleanDesc)}</div>`
            : (!this.previewMode
                ? `<div data-edit-dish-field="desc" data-empty-desc="true" title="Double-cliquez pour ajouter une description" class="font-sans leading-snug pr-4 opacity-0 group-hover:opacity-60 italic" style="color:${escapeHTML(style.descColor)}; font-size:${descSizePx}px; margin-top:${this.mmToPx(0.5)}px;">+ Ajouter une description (double-clic)</div>`
                : '');

        return `
            <div data-dish-row="true" data-dish-id="${escapeHTML(dish.id || '')}" class="w-full leading-tight">
                <div class="flex items-baseline justify-between font-serif font-bold" style="color:${escapeHTML(style.nameColor)}; font-size:${titleSizePx}px;">
                    <span class="flex items-center flex-wrap"><span data-edit-dish-field="name" title="Double-cliquez pour modifier l'intitulé du plat">${escapeHTML(dish.name)}</span>${badgeHTML}</span>
                    <span class="menu-dots"></span>
                    <span data-edit-dish-field="price" title="Double-cliquez pour modifier le prix" class="font-montserrat font-bold shrink-0" style="color:${escapeHTML(style.priceColor)};">${escapeHTML(dish.price)}</span>
                </div>
                ${descHTML}
            </div>
        `;
    },

    // ==================== DRAG & RESIZE WITH MAGNETIC FOLD/MARGIN SNAPPING ====================
    onViewportMouseDown(e) {
        if (e.target.closest && e.target.closest('[id^="dom_"]')) return;
        if (['viewport', 'viewport-center', 'spread-stage', 'bleed-clip', 'spread-page', 'objects-layer'].includes(e.target.id)) {
            this.selectObject(null);
        }
    },

    selectObject(id) {
        this.selectedObjectId = id;
        this.renderCurrentFace();
        this.renderInspector();
    },

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
    },

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
    },

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
    },

    hideSmartGuides() {
        const vEl = document.getElementById('smart-guide-v');
        const hEl = document.getElementById('smart-guide-h');
        if (vEl) vEl.classList.add('hidden');
        if (hEl) hEl.classList.add('hidden');
    },

    // ==================== ADDING SPECIALIZED MENU BLOCKS ====================
    addMenuBlock(type) {
        const id = generateUniqueId('obj');
        let newObj = null;
        // Normalisation des alias (menu mobile)
        const normalizedType = type === 'title_heading' ? 'text'
            : type === 'category_header' ? 'category_list'
            : type === 'badge_seal' ? 'badge_new'
            : type === 'food_image' ? 'photo'
            : type;

        if (normalizedType === 'vertical_banner') {
            newObj = {
                id, type: 'vertical_banner', name: 'Bandeau Vertical Catégorie',
                x: 15, y: 25, w: 15, h: 110,
                text: 'NOUVELLE CATÉGORIE', bgColor: '#9a3412', textColor: '#ffffff', fontSize: 12, radius: 3
            };
        } else if (normalizedType === 'dish_item') {
            const firstDish = this.engine.dishesDB[0];
            newObj = {
                id, type: 'dish_item', name: 'Ligne Plat + Prix',
                x: 36, y: 35, w: 118, h: 24,
                dishId: firstDish ? firstDish.id : '',
                textColor: '#1e293b', descColor: '#64748b', priceColor: '#9a3412', fontSize: 11
            };
        } else if (normalizedType === 'category_list') {
            const cats = this.engine.getCategories();
            newObj = {
                id, type: 'category_list', name: 'Bloc Catégorie Automatique',
                x: 36, y: 25, w: 120, h: 135,
                category: cats[0] || 'PETITS-DÉJEUNERS',
                title: cats[0] || 'Sélection du Chef',
                titleColor: '#9a3412', textColor: '#1e293b', descColor: '#64748b', priceColor: '#9a3412', fontSize: 10.5
            };
        } else if (normalizedType === 'badge_new') {
            newObj = {
                id, type: 'badge_new', name: 'Badge NOUVEAU',
                x: 120, y: 22, w: 34, h: 10,
                text: 'NOUVEAU', bgColor: '#e11d48', textColor: '#ffffff', radius: 10
            };
        } else if (normalizedType === 'photo') {
            newObj = {
                id, type: 'photo', name: 'Photo Gastronomique',
                x: 185, y: 30, w: 135, h: 105,
                imageUrl: OFFLINE_PHOTO_PLACEHOLDER,
                caption: 'Suggestion Gourmande du Chef',
                radius: 5, borderColor: '#c8a96a', borderWidth: 1.5
            };
        } else if (normalizedType === 'logo') {
            newObj = {
                id, type: 'logo', name: 'Logo Restaurant',
                x: 205, y: 25, w: 100, h: 50,
                title: 'GREY CORNER', subtitle: 'CAFÉ • SINCE 2024 • @GREYCORNERFES',
                color: '#c8a96a'
            };
        } else if (normalizedType === 'text') {
            newObj = {
                id, type: 'text', name: 'Bloc Texte Libre',
                x: 40, y: 40, w: 110, h: 25,
                text: 'Titre ou note de bas de page',
                fontFamily: 'Playfair Display', fontSize: 14, color: '#1e293b', align: 'left', fontWeight: '700'
            };
        } else if (normalizedType === 'shape') {
            newObj = {
                id, type: 'shape', name: 'Cadre Décoratif',
                x: 12, y: 12, w: 146, h: 276,
                bgColor: 'transparent', borderColor: '#c8a96a', borderWidth: 1.5, radius: 4, opacity: 1
            };
        } else if (normalizedType === 'page_number') {
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
    },

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
    },

    togglePreviewMode() {
        this.previewMode = !this.previewMode;
        const bleedEl = document.getElementById('guide-bleed');
        const guidesEl = document.getElementById('guide-overlays');
        const labelEl = document.getElementById('preview-mode-label');

        if (this.previewMode) {
            if (bleedEl) bleedEl.classList.add('hidden');
            if (guidesEl) guidesEl.classList.add('hidden');
            if (labelEl) labelEl.textContent = 'Mode Aperçu [W]';
        } else {
            if (bleedEl) bleedEl.classList.remove('hidden');
            if (guidesEl) guidesEl.classList.remove('hidden');
            if (labelEl) labelEl.textContent = 'Repères [W]';
        }
        this.setupGeometryDOM();
        this.renderCurrentFace();
        this.renderInspector();
        this.renderRulers();
    },

    toggleSnap(enabled) {
        this.snapEnabled = enabled;
    },

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
    },

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

        const html = `
            <div class="space-y-3">
                <div class="relative">
                    <input type="text"
                           value="${escapeHTML(this.illustrationsSearchQuery || '')}"
                           data-input="search-illustrations"
                           placeholder="Rechercher (filet, losange, sceau, chef, café, vegan...)"
                           class="w-full bg-idInput border border-idBorder rounded-lg px-3 py-2 pl-8 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400">
                    <i class="fa-solid fa-magnifying-glass absolute left-2.5 top-2.5 text-gray-400 text-xs"></i>
                    ${query ? `
                        <button type="button" data-action="clear-illustrations-search" class="absolute right-2.5 top-2 text-gray-400 hover:text-white">
                            <i class="fa-solid fa-xmark text-xs"></i>
                        </button>
                    ` : ''}
                </div>

                <div class="flex items-center space-x-1 overflow-x-auto pb-1 scrollbar-thin">
                    ${categories.map(c => `
                        <button type="button" data-action="filter-illustrations" data-cat="${escapeHTML(c.id)}" class="px-2 py-1 rounded text-[10px] whitespace-nowrap font-medium transition flex items-center space-x-1 ${
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
                        <div data-action="add-illustration" data-id="${escapeHTML(item.id)}"
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
    },

    filterIllustrations(cat) {
        this.activeIllustrationCategory = cat;
        this.renderIllustrationsTab();
    },

    searchIllustrations(query) {
        this.illustrationsSearchQuery = query;
        this.renderIllustrationsTab();
    },

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
});
