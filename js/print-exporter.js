/**
 * MODULE 3: PrintExporter (print-exporter.js)
 */
class PrintExporter {
            constructor(engine) {
                this.engine = engine;
                this.imageCache = new Map();
            }

            /**
             * Remappe un objet (x, y, w, h, taille de police) lorsque le format d'export cible
             * diffère du panneau source (ex: panneau 170×300 mm exporté en A4 210×297 mm)
             */
            scaleObjectForTarget(obj, offsetXMm = 0, scaleX = 1, scaleY = 1) {
                if (offsetXMm === 0 && Math.abs(scaleX - 1) < 0.001 && Math.abs(scaleY - 1) < 0.001) {
                    return obj;
                }
                const fontScale = Math.min(scaleX, scaleY);
                const scaled = Object.assign({}, obj, {
                    x: (obj.x - offsetXMm) * scaleX,
                    y: obj.y * scaleY,
                    w: obj.w * scaleX,
                    h: obj.h * scaleY
                });
                if (obj.fontSize !== undefined) scaled.fontSize = obj.fontSize * fontScale;
                if (obj.fontSizePt !== undefined) scaled.fontSizePt = obj.fontSizePt * fontScale;
                if (obj.radius !== undefined) scaled.radius = obj.radius * fontScale;
                if (obj.borderRadius !== undefined) scaled.borderRadius = obj.borderRadius * fontScale;
                return scaled;
            }

            /**
             * Renders any face onto a high-DPI HTML5 Canvas in exact millimeters
             * @param {Object} face - The face object from DocumentEngine
             * @param {Object} options - { includeBleed, includeCropMarks, scalePxPerMm, targetWidthMm, targetHeightMm }
             */
            async renderFaceToCanvas(face, options = {}) {
                if (document.fonts && document.fonts.ready) {
                    try { await document.fonts.ready; } catch (_) { /* ignore */ }
                }

                const specs = this.engine.specs;
                const srcWidthMm = specs.widthMm;
                const srcHeightMm = specs.heightMm;
                const outWidthMm = options.targetWidthMm || srcWidthMm;
                const outHeightMm = options.targetHeightMm || srcHeightMm;
                const scaleX = outWidthMm / srcWidthMm;
                const scaleY = outHeightMm / srcHeightMm;

                const includeBleed = options.includeBleed !== false;
                const includeCropMarks = options.includeCropMarks !== false;
                const pxPerMm = options.scalePxPerMm || 4;

                const bleed = includeBleed ? specs.bleedMm : 0;
                const slugMargin = includeCropMarks ? 15 : 0; // 15mm margin outside bleed for crop marks, fold marks & slug

                const totalWidthMm = outWidthMm + (bleed * 2) + (slugMargin * 2);
                const totalHeightMm = outHeightMm + (bleed * 2) + (slugMargin * 2);

                const canvas = document.createElement('canvas');
                canvas.width = Math.round(totalWidthMm * pxPerMm);
                canvas.height = Math.round(totalHeightMm * pxPerMm);
                const ctx = canvas.getContext('2d');

                // Origin of Trim Box
                const trimOriginX = (slugMargin + bleed) * pxPerMm;
                const trimOriginY = (slugMargin + bleed) * pxPerMm;
                const failedImages = [];

                // 1. Fill Slug background white if crop marks enabled
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // 2. Clip to Bleed Box (or Trim Box if bleed disabled)
                ctx.save();
                const clipX = slugMargin * pxPerMm;
                const clipY = slugMargin * pxPerMm;
                const clipW = (outWidthMm + bleed * 2) * pxPerMm;
                const clipH = (outHeightMm + bleed * 2) * pxPerMm;

                ctx.beginPath();
                ctx.rect(clipX, clipY, clipW, clipH);
                ctx.clip();

                // Fill default page background
                ctx.fillStyle = face.bgColor || '#fdfbf7';
                ctx.fillRect(clipX, clipY, clipW, clipH);

                // 3A. Draw Master Page objects on interior faces (or all faces if not cover spread)
                const faceIndex = this.engine.faces.indexOf(face);
                const isInteriorFace = faceIndex > 0 || this.engine.faces.length === 1;
                const masterList = this.getEffectiveMasterObjects(face);
                if (isInteriorFace && masterList.length > 0) {
                    for (const mObj of masterList) {
                        if (mObj.hidden) continue;
                        const drawObj = this.scaleObjectForTarget(mObj, 0, scaleX, scaleY);
                        await this.drawObjectOnCanvas(ctx, drawObj, trimOriginX, trimOriginY, pxPerMm, failedImages);
                    }
                }

                // 3B. Draw every object on the face (remapped if target format differs)
                for (const obj of (face.objects || [])) {
                    if (obj.hidden) continue;
                    const drawObj = this.scaleObjectForTarget(obj, 0, scaleX, scaleY);
                    await this.drawObjectOnCanvas(ctx, drawObj, trimOriginX, trimOriginY, pxPerMm, failedImages);
                }

                // 3B. Draw Automated Page Numbering (if enabled)
                if (this.engine.pageNumbering && this.engine.pageNumbering.enabled) {
                    this.drawAutomaticPageNumbersOnFace(ctx, face, trimOriginX, trimOriginY, pxPerMm, scaleX, scaleY);
                }

                ctx.restore();

                // 4. Draw Printer Marks (Traits de coupe, Traits de pli, Hirondelles)
                if (includeCropMarks) {
                    this.drawPrinterMarks(ctx, trimOriginX, trimOriginY, outWidthMm * pxPerMm, outHeightMm * pxPerMm, bleed * pxPerMm, pxPerMm, face, outWidthMm, outHeightMm);
                }

                return { canvas, totalWidthMm, totalHeightMm, trimWidthMm: outWidthMm, trimHeightMm: outHeightMm, failedImages };
            }

            /**
             * Renders a SINGLE Panel ('left' or 'right') from a face into a separate page
             * (either in Format A4 210 × 297 mm, or 170 × 300 mm, or custom target dimensions).
             * @param {Object} face - The face object from DocumentEngine
             * @param {String} side - 'left' or 'right'
             * @param {Number} pageNumber - Sequential page number
             * @param {Object} options - { includeBleed, includeCropMarks, scalePxPerMm, targetWidthMm, targetHeightMm, totalPages }
             */
            async renderSinglePanelToCanvas(face, side, pageNumber, options = {}) {
                if (document.fonts && document.fonts.ready) {
                    try { await document.fonts.ready; } catch (_) { /* ignore */ }
                }

                const specs = this.engine.specs;
                const srcPanelWidthMm = specs.hasFold ? (specs.foldXMm || (specs.widthMm / 2)) : (specs.widthMm / 2);
                const srcPanelHeightMm = specs.heightMm;

                const panelWidthMm = options.targetWidthMm || srcPanelWidthMm;
                const panelHeightMm = options.targetHeightMm || srcPanelHeightMm;
                const scaleX = panelWidthMm / srcPanelWidthMm;
                const scaleY = panelHeightMm / srcPanelHeightMm;

                const includeBleed = options.includeBleed !== false;
                const includeCropMarks = options.includeCropMarks !== false;
                const pxPerMm = options.scalePxPerMm || 4;

                const bleed = includeBleed ? specs.bleedMm : 0;
                const slugMargin = includeCropMarks ? 15 : 0;

                const totalWidthMm = panelWidthMm + (bleed * 2) + (slugMargin * 2);
                const totalHeightMm = panelHeightMm + (bleed * 2) + (slugMargin * 2);

                const canvas = document.createElement('canvas');
                canvas.width = Math.round(totalWidthMm * pxPerMm);
                canvas.height = Math.round(totalHeightMm * pxPerMm);
                const ctx = canvas.getContext('2d');

                const trimOriginX = (slugMargin + bleed) * pxPerMm;
                const trimOriginY = (slugMargin + bleed) * pxPerMm;
                const offsetXMm = side === 'right' ? srcPanelWidthMm : 0;
                const failedImages = [];

                // 1. Fill Slug background white
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // 2. Clip to panel (+3mm bleed) box
                ctx.save();
                const clipX = slugMargin * pxPerMm;
                const clipY = slugMargin * pxPerMm;
                const clipW = (panelWidthMm + bleed * 2) * pxPerMm;
                const clipH = (panelHeightMm + bleed * 2) * pxPerMm;

                ctx.beginPath();
                ctx.rect(clipX, clipY, clipW, clipH);
                ctx.clip();

                ctx.fillStyle = face.bgColor || '#fdfbf7';
                ctx.fillRect(clipX, clipY, clipW, clipH);

                // 3A. Draw Master Page objects on interior faces
                const faceIndex = this.engine.faces.indexOf(face);
                const isInteriorFace = faceIndex > 0 || this.engine.faces.length === 1;
                const masterList = this.getEffectiveMasterObjects(face);
                if (isInteriorFace && masterList.length > 0) {
                    for (const mObj of masterList) {
                        if (mObj.hidden) continue;
                        const drawObj = this.scaleObjectForTarget(mObj, offsetXMm, scaleX, scaleY);
                        await this.drawObjectOnCanvas(ctx, drawObj, trimOriginX, trimOriginY, pxPerMm, failedImages);
                    }
                }

                // 3B. Draw objects mapped onto target panel dimensions (e.g. A4 210x297mm or 170x300mm)
                for (const obj of (face.objects || [])) {
                    if (obj.hidden) continue;
                    const drawObj = this.scaleObjectForTarget(obj, offsetXMm, scaleX, scaleY);
                    await this.drawObjectOnCanvas(ctx, drawObj, trimOriginX, trimOriginY, pxPerMm, failedImages);
                }

                // 3B. Draw Automated Page Numbering on single panel
                if (this.engine.pageNumbering && this.engine.pageNumbering.enabled) {
                    const faceIndex = this.engine.faces.indexOf(face);
                    const info = this.engine.getPageNumberInfo(faceIndex, specs.hasFold ? side : 'single');
                    if (info) {
                        ctx.save();
                        const fontPt = this.engine.pageNumbering.fontSizePt || 8.5;
                        const fontPx = Math.max(2, fontPt * PT_TO_MM * pxPerMm);
                        const family = this.engine.pageNumbering.fontFamily || 'Montserrat';
                        ctx.font = `600 ${fontPx}px "${family}", sans-serif`;
                        ctx.fillStyle = this.engine.pageNumbering.color || '#64748b';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText(info.text, trimOriginX + (panelWidthMm * pxPerMm / 2), trimOriginY + (info.yMm * scaleY * pxPerMm));
                        ctx.restore();
                    }
                }

                ctx.restore();

                // 4. Draw Corner Crop Marks for this single page
                if (includeCropMarks) {
                    this.drawSinglePanelMarks(
                        ctx,
                        trimOriginX,
                        trimOriginY,
                        panelWidthMm * pxPerMm,
                        panelHeightMm * pxPerMm,
                        bleed * pxPerMm,
                        pxPerMm,
                        pageNumber,
                        face,
                        side,
                        panelWidthMm,
                        panelHeightMm,
                        options.totalPages || (this.engine.faces.length * 2)
                    );
                }

                return { canvas, totalWidthMm, totalHeightMm, trimWidthMm: panelWidthMm, trimHeightMm: panelHeightMm, failedImages };
            }

            drawSinglePanelMarks(ctx, trimX, trimY, trimW, trimH, bleedPx, pxPerMm, pageNumber, face, side, panelWidthMm = 170, panelHeightMm = 300, totalPages = 20) {
                ctx.save();
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 0.25 * pxPerMm;

                const offset = bleedPx + (1.5 * pxPerMm);
                const len = 6 * pxPerMm;

                // 4 Corners Crop Marks
                ctx.beginPath();
                // Top-Left
                ctx.moveTo(trimX - offset - len, trimY); ctx.lineTo(trimX - offset, trimY);
                ctx.moveTo(trimX, trimY - offset - len); ctx.lineTo(trimX, trimY - offset);
                // Top-Right
                ctx.moveTo(trimX + trimW + offset, trimY); ctx.lineTo(trimX + trimW + offset + len, trimY);
                ctx.moveTo(trimX + trimW, trimY - offset - len); ctx.lineTo(trimX + trimW, trimY - offset);
                // Bottom-Left
                ctx.moveTo(trimX - offset - len, trimY + trimH); ctx.lineTo(trimX - offset, trimY + trimH);
                ctx.moveTo(trimX, trimY + trimH + offset); ctx.lineTo(trimX, trimY + trimH + offset + len);
                // Bottom-Right
                ctx.moveTo(trimX + trimW + offset, trimY + trimH); ctx.lineTo(trimX + trimW + offset + len, trimY + trimH);
                ctx.moveTo(trimX + trimW, trimY + trimH + offset); ctx.lineTo(trimX + trimW, trimY + trimH + offset + len);
                ctx.stroke();

                // Slug info at top
                const slugY = trimY - offset - len - (2.0 * pxPerMm);
                ctx.fillStyle = '#000000';
                ctx.font = `600 ${2.3 * pxPerMm}px "JetBrains Mono", monospace`;
                ctx.textBaseline = 'bottom';

                ctx.textAlign = 'left';
                const sideLabel = side === 'left' ? 'GAUCHE' : 'DROITE';
                const isA4 = Math.round(panelWidthMm) === 210 && Math.round(panelHeightMm) === 297;
                const fmtTag = isA4 ? 'A4 210×297mm' : `${Math.round(panelWidthMm)}×${Math.round(panelHeightMm)}mm`;
                ctx.fillText(
                    `INMENU STUDIO PRO | PAGE ${String(pageNumber).padStart(2, '0')}/${totalPages} (${sideLabel}) | ${fmtTag} (+${this.engine.specs.bleedMm || 3}mm)`,
                    trimX + (1 * pxPerMm),
                    slugY,
                    Math.max(40 * pxPerMm, trimW - 4 * pxPerMm)
                );

                ctx.restore();
            }

            wrapCanvasText(ctx, text, maxWidth) {
                const rawLines = String(text ?? '').split('\n');
                const out = [];
                for (const raw of rawLines) {
                    if (!raw.trim()) {
                        out.push('');
                        continue;
                    }
                    const words = raw.split(/\s+/);
                    let line = '';
                    for (let i = 0; i < words.length; i++) {
                        const word = words[i];
                        const testLine = line ? `${line} ${word}` : word;
                        if (ctx.measureText(testLine).width > maxWidth && line) {
                            out.push(line);
                            line = word;
                        } else {
                            line = testLine;
                        }
                    }
                    if (line) out.push(line);
                }
                return out;
            }

            /**
             * Retourne la liste consolidée des éléments de Page Maître applicables à une face intérieure
             */
            getEffectiveMasterObjects(currentFace) {
                const list = [];
                const seenIds = new Set();
                (this.engine.masterObjects || []).forEach(o => {
                    if (o && !seenIds.has(o.id)) {
                        seenIds.add(o.id);
                        list.push(o);
                    }
                });
                (this.engine.faces || []).forEach(f => {
                    if (f === currentFace) return;
                    (f.objects || []).forEach(o => {
                        if (o && o.isMaster && !seenIds.has(o.id)) {
                            seenIds.add(o.id);
                            list.push(o);
                        }
                    });
                });
                return list;
            }

            /**
             * Construit le tracé de découpe (masque de forme) pour un bloc photo ou forme
             */
            buildMaskPath(ctx, x, y, w, h, radiusPx = 0, maskShape = 'rounded') {
                ctx.beginPath();
                if (maskShape === 'circle') {
                    ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
                    ctx.closePath();
                } else if (maskShape === 'arch') {
                    const archR = Math.min(w / 2, h * 0.48);
                    ctx.moveTo(x, y + h);
                    ctx.lineTo(x, y + archR);
                    ctx.arc(x + w / 2, y + archR, w / 2, Math.PI, 0, false);
                    ctx.lineTo(x + w, y + h);
                    ctx.closePath();
                } else if (maskShape === 'diamond') {
                    ctx.moveTo(x + w / 2, y);
                    ctx.lineTo(x + w, y + h / 2);
                    ctx.lineTo(x + w / 2, y + h);
                    ctx.lineTo(x, y + h / 2);
                    ctx.closePath();
                } else if (maskShape === 'hexagon') {
                    ctx.moveTo(x + w * 0.25, y);
                    ctx.lineTo(x + w * 0.75, y);
                    ctx.lineTo(x + w, y + h * 0.5);
                    ctx.lineTo(x + w * 0.75, y + h);
                    ctx.lineTo(x + w * 0.25, y + h);
                    ctx.lineTo(x, y + h * 0.5);
                    ctx.closePath();
                } else {
                    this.roundRect(ctx, x, y, w, h, radiusPx);
                }
            }

            async drawObjectOnCanvas(ctx, obj, originX, originY, pxPerMm, failedImages = []) {
                if (obj.hidden) return;
                const rawX = originX + obj.x * pxPerMm;
                const rawY = originY + obj.y * pxPerMm;
                const w = obj.w * pxPerMm;
                const h = obj.h * pxPerMm;

                ctx.save();
                ctx.globalAlpha = obj.opacity !== undefined ? obj.opacity : 1;

                // Rotation autour du centre du bloc (Axe 1.2)
                const rotDeg = Number(obj.rotation ?? obj.rotate ?? 0);
                let x = rawX;
                let y = rawY;
                if (rotDeg && obj.type !== 'illustration') {
                    ctx.translate(rawX + w / 2, rawY + h / 2);
                    ctx.rotate((rotDeg * Math.PI) / 180);
                    x = -w / 2;
                    y = -h / 2;
                }

                // Ombre portée paramétrable (Axe 3.2)
                const applyShadowIfNeeded = () => {
                    const sBlur = Number(obj.shadowBlur ?? (obj.shadow ? 10 : 0));
                    const sOffsetY = Number(obj.shadowOffsetY ?? (obj.shadow ? 4 : 0));
                    const sOpacity = Number(obj.shadowOpacity ?? 0.28);
                    if (sBlur > 0 || sOffsetY !== 0) {
                        ctx.shadowColor = `rgba(0, 0, 0, ${Math.max(0, Math.min(1, sOpacity))})`;
                        ctx.shadowBlur = sBlur * (pxPerMm * 0.28);
                        ctx.shadowOffsetX = 0;
                        ctx.shadowOffsetY = sOffsetY * (pxPerMm * 0.28);
                    }
                };
                const resetShadow = () => {
                    ctx.shadowColor = 'transparent';
                    ctx.shadowBlur = 0;
                    ctx.shadowOffsetX = 0;
                    ctx.shadowOffsetY = 0;
                };

                if (obj.type === 'shape' || obj.type === 'frame') {
                    const bg = obj.bgColor || obj.backgroundColor || 'transparent';
                    const bw = obj.borderWidth ?? obj.borderWidthPt ?? 0;
                    const rad = obj.radius ?? obj.borderRadius ?? 0;
                    this.roundRect(ctx, x, y, w, h, rad * pxPerMm);
                    if (bg && bg !== 'transparent') {
                        ctx.save();
                        applyShadowIfNeeded();
                        ctx.fillStyle = bg;
                        ctx.fill();
                        ctx.restore();
                    }
                    if (bw > 0 && obj.borderColor && obj.borderColor !== 'transparent') {
                        ctx.lineWidth = bw * (pxPerMm * 0.35);
                        ctx.strokeStyle = obj.borderColor;
                        ctx.stroke();
                    }
                }
                else if (obj.type === 'vertical_banner') {
                    this.roundRect(ctx, x, y, w, h, (obj.radius ?? 2) * pxPerMm);
                    ctx.save();
                    ctx.clip();
                    ctx.fillStyle = obj.bgColor || '#1e293b';
                    ctx.fillRect(x, y, w, h);

                    ctx.translate(x + w / 2, y + h / 2);
                    ctx.rotate(-Math.PI / 2);
                    ctx.fillStyle = obj.textColor || '#ffffff';
                    const fontPx = Math.max(1, (obj.fontSize || 12) * PT_TO_MM * pxPerMm);
                    const family = obj.fontFamily || 'Montserrat';
                    ctx.font = `700 ${fontPx}px "${family}", sans-serif`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText((obj.text || 'CATÉGORIE').toUpperCase(), 0, 0, Math.max(10, h - 4 * pxPerMm));
                    ctx.restore();
                }
                else if (obj.type === 'badge_new') {
                    this.roundRect(ctx, x, y, w, h, (obj.radius ?? 8) * pxPerMm);
                    ctx.save();
                    applyShadowIfNeeded();
                    ctx.fillStyle = obj.bgColor || '#e11d48';
                    ctx.fill();
                    resetShadow();
                    ctx.clip();

                    ctx.fillStyle = obj.textColor || '#ffffff';
                    const fontPx = Math.max(2.8 * pxPerMm, h * 0.42);
                    ctx.font = `800 ${fontPx}px Montserrat, sans-serif`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(obj.text || 'NOUVEAU', x + w / 2, y + h / 2, Math.max(10, w - 2 * pxPerMm));
                    ctx.restore();
                }
                else if (obj.type === 'logo') {
                    const color = obj.color || '#c8a96a';
                    const centerX = x + w / 2;
                    const crestY = y + h * 0.28;
                    const crestR = Math.max(2 * pxPerMm, h * 0.18);

                    ctx.save();
                    ctx.beginPath();
                    ctx.rect(x, y, w, h);
                    ctx.clip();

                    ctx.strokeStyle = color;
                    ctx.fillStyle = color;
                    ctx.lineWidth = Math.max(0.4 * pxPerMm, h * 0.018);
                    ctx.beginPath();
                    ctx.arc(centerX, crestY, crestR, 0, Math.PI * 2);
                    ctx.stroke();

                    // Crossed cutlery vector emblem inside crest
                    const ic = crestR * 0.46;
                    ctx.lineCap = 'round';
                    ctx.beginPath();
                    ctx.moveTo(centerX - ic, crestY - ic);
                    ctx.lineTo(centerX + ic, crestY + ic);
                    ctx.moveTo(centerX + ic, crestY - ic);
                    ctx.lineTo(centerX - ic, crestY + ic);
                    ctx.stroke();

                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    const titleFont = obj.fontFamily || 'Cinzel';
                    ctx.font = `700 ${Math.max(2.5 * pxPerMm, h * 0.22)}px "${titleFont}", serif`;
                    ctx.fillText(obj.title ?? 'GREY CORNER', centerX, y + h * 0.65, Math.max(10, w - 2 * pxPerMm));

                    ctx.globalAlpha *= 0.85;
                    ctx.font = `500 ${Math.max(1.8 * pxPerMm, h * 0.10)}px Montserrat, sans-serif`;
                    // Même valeur par défaut que l'éditeur (WYSIWYG) ; un sous-titre vidé n'est pas réimprimé
                    ctx.fillText(obj.subtitle ?? 'CAFÉ • SINCE 2024', centerX, y + h * 0.85, Math.max(10, w - 2 * pxPerMm));
                    ctx.restore();
                }
                else if (obj.type === 'dish_item') {
                    ctx.save();
                    ctx.beginPath();
                    ctx.rect(x, y, w, h);
                    ctx.clip();
                    const dish = this.engine.getDishById(obj.dishId) || {
                        name: obj.customName || 'Plat Personnalisé',
                        desc: obj.customDesc ?? 'Ingrédients et préparation',
                        price: obj.customPrice ?? '00 DH',
                        badge: obj.customBadge || ''
                    };
                    const typo = this.engine.typography || {};
                    this.drawSingleDishRow(ctx, dish, x, y, w, pxPerMm, {
                        nameColor: obj.textColor || obj.color || '#1e293b',
                        descColor: obj.descColor || obj.dotsColor || '#64748b',
                        priceColor: obj.priceColor || obj.color || '#9a3412',
                        fontSize: obj.fontSize || obj.fontSizePt || 11,
                        titleFont: obj.titleFont || 'Playfair Display',
                        bodyFont: obj.fontFamily || 'Inter',
                        priceFont: obj.priceFont || 'Montserrat',
                        leaderStyle: obj.leaderStyle || typo.leaderStyle || 'dots',
                        showCurrency: obj.showCurrency !== undefined ? obj.showCurrency : (typo.showCurrency !== false),
                        lineHeight: obj.lineHeight || typo.lineHeight || 1.28
                    });
                    ctx.restore();
                }
                else if (obj.type === 'category_list') {
                    ctx.save();
                    ctx.beginPath();
                    ctx.rect(x, y, w, h);
                    ctx.clip();

                    const allDishes = this.engine.getDishesByCategory(obj.category);
                    const dishes = (obj.sliceStart !== undefined || obj.sliceEnd !== undefined)
                        ? allDishes.slice(obj.sliceStart || 0, obj.sliceEnd)
                        : allDishes;
                    const typo = this.engine.typography || {};
                    const titleFont = obj.titleFont || 'Playfair Display';
                    let currY = y;
                    if (obj.title) {
                        ctx.fillStyle = obj.titleColor || '#9a3412';
                        ctx.font = `700 ${4.4 * pxPerMm}px "${titleFont}", serif`;
                        ctx.textAlign = 'left';
                        ctx.textBaseline = 'top';
                        ctx.fillText(obj.title, x, currY, w);
                        currY += 6.2 * pxPerMm;

                        // Decorative underline
                        ctx.strokeStyle = obj.titleColor || '#9a3412';
                        ctx.lineWidth = 0.35 * pxPerMm;
                        ctx.beginPath();
                        ctx.moveTo(x, currY - 1.2 * pxPerMm);
                        ctx.lineTo(x + w, currY - 1.2 * pxPerMm);
                        ctx.stroke();
                        currY += 1.8 * pxPerMm;
                    }

                    for (const dish of dishes) {
                        if (currY >= y + h) break;
                        const rowHeight = this.drawSingleDishRow(ctx, dish, x, currY, w, pxPerMm, {
                            nameColor: obj.textColor || '#1e293b',
                            descColor: obj.descColor || '#64748b',
                            priceColor: obj.priceColor || '#9a3412',
                            fontSize: obj.fontSize || 10.5,
                            titleFont: obj.titleFont || 'Playfair Display',
                            bodyFont: obj.fontFamily || 'Inter',
                            priceFont: obj.priceFont || 'Montserrat',
                            leaderStyle: obj.leaderStyle || typo.leaderStyle || 'dots',
                            showCurrency: obj.showCurrency !== undefined ? obj.showCurrency : (typo.showCurrency !== false),
                            lineHeight: obj.lineHeight || typo.lineHeight || 1.28
                        });
                        currY += rowHeight + (2.5 * pxPerMm);
                    }
                    ctx.restore();
                }
                else if (obj.type === 'photo') {
                    const radiusPx = (obj.radius ?? 4) * pxPerMm;
                    const maskShape = obj.maskShape || 'rounded';

                    // Drop shadow under photo mask
                    if (obj.shadow || obj.shadowBlur > 0) {
                        ctx.save();
                        applyShadowIfNeeded();
                        this.buildMaskPath(ctx, x, y, w, h, radiusPx, maskShape);
                        ctx.fillStyle = '#000000';
                        ctx.fill();
                        ctx.restore();
                    }

                    this.buildMaskPath(ctx, x, y, w, h, radiusPx, maskShape);
                    ctx.save();
                    ctx.clip();

                    // Filtres Photo 300 DPI (Pilier 0.3)
                    const filterCss = typeof buildPhotoFilterCSS === 'function' ? buildPhotoFilterCSS(obj) : 'none';
                    if (filterCss && filterCss !== 'none') {
                        ctx.filter = filterCss;
                    }

                    const safeUrl = sanitizeUrl(obj.imageUrl);
                    try {
                        if (!safeUrl) throw new Error('Invalid image URL');
                        const img = await this.loadImage(safeUrl);
                        // Cover fit
                        const imgRatio = img.width / img.height;
                        const boxRatio = w / h;
                        let drawW = w, drawH = h, drawX = x, drawY = y;
                        if (imgRatio > boxRatio) {
                            drawW = h * imgRatio;
                            drawX = x - (drawW - w) / 2;
                        } else {
                            drawH = w / imgRatio;
                            drawY = y - (drawH - h) / 2;
                        }
                        ctx.drawImage(img, drawX, drawY, drawW, drawH);
                    } catch (e) {
                        if (obj.imageUrl) failedImages.push(obj.name || obj.imageUrl);
                        ctx.fillStyle = '#334155';
                        ctx.fillRect(x, y, w, h);
                        ctx.fillStyle = '#cbd5e1';
                        ctx.font = `600 ${3 * pxPerMm}px Inter, sans-serif`;
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText('Image non chargée (CORS / URL)', x + w / 2, y + h / 2, Math.max(10, w - 6 * pxPerMm));
                    }
                    ctx.filter = 'none';
                    if (obj.caption) {
                        const capH = 7.5 * pxPerMm;
                        ctx.fillStyle = 'rgba(0,0,0,0.65)';
                        ctx.fillRect(x, y + h - capH, w, capH);
                        ctx.fillStyle = '#ffffff';
                        ctx.font = `italic 500 ${3.1 * pxPerMm}px "Playfair Display", serif`;
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText(obj.caption, x + w / 2, y + h - capH / 2, Math.max(10, w - 4 * pxPerMm));
                    }
                    ctx.restore();

                    if (obj.borderWidth > 0 && obj.borderColor !== 'transparent') {
                        this.buildMaskPath(ctx, x, y, w, h, radiusPx, maskShape);
                        ctx.lineWidth = obj.borderWidth * (pxPerMm * 0.35);
                        ctx.strokeStyle = obj.borderColor || '#c8a96a';
                        ctx.stroke();
                    }
                }
                else if (obj.type === 'qrcode') {
                    // Générateur de QR Code vectoriel haute résolution 300 DPI (Axe 3.1)
                    const radPx = (obj.radius ?? 3) * pxPerMm;
                    ctx.save();
                    applyShadowIfNeeded();
                    this.roundRect(ctx, x, y, w, h, radPx);
                    ctx.fillStyle = obj.bgColor || '#ffffff';
                    ctx.fill();
                    resetShadow();
                    ctx.clip();

                    const captionText = (obj.caption || '').trim();
                    const capHeight = captionText ? Math.max(4 * pxPerMm, h * 0.16) : 0;
                    const qrBoxH = h - capHeight;
                    const qrSize = Math.min(w, qrBoxH) * 0.84;
                    const qrX = x + (w - qrSize) / 2;
                    const qrY = y + (qrBoxH - qrSize) / 2;

                    if (typeof QRCodeGenerator !== 'undefined') {
                        const matrix = QRCodeGenerator.generateMatrix(obj.qrText || obj.text || 'GREY CORNER CAFE');
                        const n = matrix.length;
                        const cell = qrSize / n;
                        ctx.fillStyle = obj.color || '#1e293b';
                        for (let r = 0; r < n; r++) {
                            for (let c = 0; c < n; c++) {
                                if (matrix[r][c]) {
                                    ctx.fillRect(qrX + c * cell, qrY + r * cell, Math.ceil(cell), Math.ceil(cell));
                                }
                            }
                        }
                    }

                    if (captionText) {
                        ctx.fillStyle = obj.color || '#1e293b';
                        const fontPx = Math.max(2 * pxPerMm, capHeight * 0.45);
                        ctx.font = `700 ${fontPx}px Montserrat, sans-serif`;
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText(captionText.toUpperCase(), x + w / 2, y + h - capHeight / 2, w - 2 * pxPerMm);
                    }
                    ctx.restore();

                    if (obj.borderWidth > 0 && obj.borderColor && obj.borderColor !== 'transparent') {
                        this.roundRect(ctx, x, y, w, h, radPx);
                        ctx.lineWidth = obj.borderWidth * (pxPerMm * 0.35);
                        ctx.strokeStyle = obj.borderColor;
                        ctx.stroke();
                    }
                }
                else if (obj.type === 'icon_badge') {
                    // Icône Vectorielle Culinaire & Infos (Axe 3.3)
                    if (typeof buildCulinaryIconSVG === 'function') {
                        const labelText = (obj.text || '').trim();
                        const iconBoxH = labelText ? h * 0.72 : h;
                        const svgString = buildCulinaryIconSVG(obj.iconId || 'wifi', obj.color || '#c8a96a', '');
                        const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
                        const blobUrl = URL.createObjectURL(blob);
                        try {
                            const img = await this.loadImage(blobUrl, 5000);
                            const iconSize = Math.min(w, iconBoxH);
                            ctx.drawImage(img, x + (w - iconSize) / 2, y + (iconBoxH - iconSize) / 2, iconSize, iconSize);
                        } catch (err) {
                            console.warn('Erreur rendu icon_badge:', err);
                        } finally {
                            URL.revokeObjectURL(blobUrl);
                        }
                        if (labelText) {
                            ctx.save();
                            ctx.fillStyle = obj.textColor || obj.color || '#c8a96a';
                            const fontPx = Math.max(2 * pxPerMm, (obj.fontSize || 9) * PT_TO_MM * pxPerMm);
                            ctx.font = `600 ${fontPx}px Montserrat, sans-serif`;
                            ctx.textAlign = 'center';
                            ctx.textBaseline = 'middle';
                            ctx.fillText(labelText, x + w / 2, y + h * 0.86, w);
                            ctx.restore();
                        }
                    }
                }
                else if (obj.type === 'text' || obj.type === 'title_heading' || obj.type === 'category_header' || obj.type === 'section_header') {
                    ctx.save();
                    ctx.beginPath();
                    ctx.rect(x, y, w, h);
                    ctx.clip();

                    const fontPt = obj.fontSize || obj.fontSizePt || 12;
                    const fontPx = Math.max(1, fontPt * PT_TO_MM * pxPerMm);
                    const family = obj.fontFamily || 'Playfair Display';
                    const fallback = typeof getFontFallback === 'function' ? getFontFallback(family) : (isSansFontFamily(family) ? 'sans-serif' : 'serif');
                    const weight = obj.fontWeight || (obj.type === 'title_heading' ? '700' : '500');
                    const align = obj.align || obj.textAlign || 'left';
                    const lineHeightMult = Number(obj.lineHeight || (this.engine.typography && this.engine.typography.lineHeight) || 1.35);
                    ctx.fillStyle = obj.color || '#1e293b';
                    ctx.font = `${weight} ${fontPx}px "${family}", ${fallback}`;
                    ctx.textBaseline = 'top';

                    const rawText = obj.text ?? obj.customName ?? obj.content ?? '';
                    const lines = this.wrapCanvasText(ctx, rawText, Math.max(10, w));
                    let lineY = y;
                    for (const line of lines) {
                        if (lineY > y + h) break;
                        let lineX = x;
                        if (align === 'center') {
                            ctx.textAlign = 'center';
                            lineX = x + w / 2;
                        } else if (align === 'right') {
                            ctx.textAlign = 'right';
                            lineX = x + w;
                        } else {
                            ctx.textAlign = 'left';
                        }
                        ctx.fillText(line, lineX, lineY);
                        lineY += fontPx * lineHeightMult;
                    }
                    ctx.restore();
                }
                else if (obj.type === 'illustration') {
                    const item = typeof CanvaIllustrationsPack !== 'undefined'
                        ? (CanvaIllustrationsPack.getById(obj.svgKey || obj.illustrationId) || CanvaIllustrationsPack.getById('cutlery_crossed'))
                        : null;
                    if (item) {
                        const svgString = CanvaIllustrationsPack.buildSVGString(item, {
                            color: obj.color || item.defaultColor || '#c8a96a',
                            opacity: obj.opacity !== undefined ? obj.opacity : 1,
                            flipH: obj.flipH,
                            flipV: obj.flipV,
                            rotate: obj.rotation ?? obj.rotate ?? 0
                        });
                        const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
                        const blobUrl = URL.createObjectURL(blob);
                        try {
                            const img = await this.loadImage(blobUrl, 6000);
                            ctx.save();
                            ctx.drawImage(img, x, y, w, h);
                            ctx.restore();
                        } catch (err) {
                            console.warn('Erreur rendu illustration:', err);
                        } finally {
                            URL.revokeObjectURL(blobUrl);
                        }
                    }
                }
                else if (obj.type === 'page_number') {
                    ctx.save();
                    const fontPt = obj.fontSize || 8.5;
                    const fontPx = Math.max(2, fontPt * PT_TO_MM * pxPerMm);
                    const family = obj.fontFamily || 'Montserrat';
                    ctx.font = `600 ${fontPx}px "${family}", sans-serif`;
                    ctx.fillStyle = obj.color || '#64748b';
                    ctx.textAlign = obj.align || 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(obj.text || 'Page 1', x + w / 2, y + h / 2);
                    ctx.restore();
                }

                ctx.restore();
            }

            drawSingleDishRow(ctx, dish, x, y, w, pxPerMm, style) {
                const titlePx = (style.fontSize || 10.5) * PT_TO_MM * pxPerMm;
                const descPx = titlePx * 0.82;
                const badgeH = 3.1 * pxPerMm;
                const badgeFontPx = 2.0 * pxPerMm;
                const hasBadge = dish.badge === 'NOUVEAU' || dish.badge === 'CHEF';
                const badgeLabel = dish.badge === 'NOUVEAU' ? 'NOUVEAU' : '★ CHEF';
                const badgeBg = dish.badge === 'NOUVEAU' ? '#e11d48' : '#d97706';
                const titleFont = style.titleFont || 'Playfair Display';
                const bodyFont = style.bodyFont || 'Inter';
                const priceFont = style.priceFont || 'Montserrat';
                const leaderStyle = style.leaderStyle || 'dots';
                const showCurrency = style.showCurrency !== false;
                const lineHeightMult = Number(style.lineHeight || 1.28);

                let badgeW = 0;
                if (hasBadge) {
                    ctx.font = `700 ${badgeFontPx}px Montserrat, sans-serif`;
                    badgeW = ctx.measureText(badgeLabel).width + (2.4 * pxPerMm);
                }

                // Measure Price on right (strip DH if showCurrency is false)
                const rawPrice = String(dish.price || '');
                const priceText = showCurrency ? rawPrice : rawPrice.replace(/\s*DH\b/gi, '').trim();
                ctx.font = `700 ${titlePx}px "${priceFont}", sans-serif`;
                const priceW = ctx.measureText(priceText).width;

                // Draw Price aligned right on first line
                ctx.fillStyle = style.priceColor;
                ctx.textAlign = 'right';
                ctx.textBaseline = 'top';
                ctx.fillText(priceText, x + w, y);

                // Wrap Name so it never collides with Price
                ctx.font = `700 ${titlePx}px "${titleFont}", serif`;
                const maxNameFirstLineW = Math.max(10 * pxPerMm, w - priceW - (3 * pxPerMm));
                const nameWords = String(dish.name || '').split(/\s+/).filter(Boolean);
                const nameLines = [];
                let currentNameLine = '';
                for (let i = 0; i < nameWords.length; i++) {
                    const test = currentNameLine ? `${currentNameLine} ${nameWords[i]}` : nameWords[i];
                    const limit = nameLines.length === 0 ? maxNameFirstLineW : (w - (2 * pxPerMm));
                    if (ctx.measureText(test).width > limit && currentNameLine) {
                        nameLines.push(currentNameLine);
                        currentNameLine = nameWords[i];
                    } else {
                        currentNameLine = test;
                    }
                }
                if (currentNameLine) nameLines.push(currentNameLine);
                if (nameLines.length === 0) nameLines.push('');

                // Draw Name lines
                ctx.fillStyle = style.nameColor;
                ctx.textAlign = 'left';
                let nameY = y;
                let lastLineW = 0;
                for (let idx = 0; idx < nameLines.length; idx++) {
                    ctx.fillText(nameLines[idx], x, nameY);
                    lastLineW = ctx.measureText(nameLines[idx]).width;
                    if (idx < nameLines.length - 1) nameY += titlePx * 1.15;
                }

                // Draw inline Badge after last line of dish name
                let firstLineUsedEndX = x + (nameLines.length === 1 ? lastLineW : maxNameFirstLineW);
                if (hasBadge) {
                    const limitForBadge = nameLines.length === 1 ? maxNameFirstLineW : w;
                    let bx = x + lastLineW + (1.6 * pxPerMm);
                    let by = nameY + (titlePx - badgeH) * 0.45;
                    if (lastLineW + (1.6 * pxPerMm) + badgeW > limitForBadge) {
                        nameY += titlePx * 1.15;
                        bx = x;
                        by = nameY + (titlePx - badgeH) * 0.45;
                    } else if (nameLines.length === 1) {
                        firstLineUsedEndX = bx + badgeW;
                    }
                    ctx.save();
                    this.roundRect(ctx, bx, by, badgeW, badgeH, 0.7 * pxPerMm);
                    ctx.fillStyle = badgeBg;
                    ctx.fill();
                    ctx.fillStyle = '#ffffff';
                    ctx.font = `700 ${badgeFontPx}px Montserrat, sans-serif`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(badgeLabel, bx + badgeW / 2, by + badgeH / 2);
                    ctx.restore();
                }

                // Leader line on first line when space allows (Axe 2.3 : dots / dashes / solid / none)
                if (nameLines.length === 1 && leaderStyle !== 'none') {
                    const dotsStart = firstLineUsedEndX + (2 * pxPerMm);
                    const dotsEnd = x + w - priceW - (2 * pxPerMm);
                    if (dotsEnd > dotsStart + (2 * pxPerMm)) {
                        ctx.save();
                        ctx.strokeStyle = style.descColor;
                        ctx.globalAlpha *= 0.45;
                        ctx.lineWidth = 0.3 * pxPerMm;
                        if (leaderStyle === 'dashes') {
                            ctx.setLineDash([1.6 * pxPerMm, 1.2 * pxPerMm]);
                        } else if (leaderStyle === 'solid') {
                            ctx.setLineDash([]);
                            ctx.lineWidth = 0.22 * pxPerMm;
                        } else {
                            ctx.setLineDash([0.6 * pxPerMm, 1.2 * pxPerMm]);
                        }
                        ctx.beginPath();
                        ctx.moveTo(dotsStart, y + titlePx * 0.78);
                        ctx.lineTo(dotsEnd, y + titlePx * 0.78);
                        ctx.stroke();
                        ctx.restore();
                    }
                }

                // Description wrapped (only if non-empty)
                let currY = Math.max(y + titlePx, nameY + titlePx);
                const cleanDesc = (dish.desc || '').trim();
                if (cleanDesc) {
                    currY += 1.1 * pxPerMm;
                    ctx.fillStyle = style.descColor;
                    ctx.font = `400 ${descPx}px "${bodyFont}", sans-serif`;
                    ctx.textAlign = 'left';
                    const maxDescW = Math.max(10 * pxPerMm, w - (6 * pxPerMm));
                    const descLines = this.wrapCanvasText(ctx, cleanDesc, maxDescW);
                    for (const dl of descLines) {
                        ctx.fillText(dl, x, currY);
                        currY += descPx * lineHeightMult;
                    }
                }

                return (currY - y);
            }

            /**
             * Draws authentic Pre-Press Crop Marks (Traits de coupe aux 4 coins),
             * Fold Marks (Traits de pli pointillés), and Slug Info.
             */
            drawPrinterMarks(ctx, trimX, trimY, trimW, trimH, bleedPx, pxPerMm, face, outWidthMm = null, outHeightMm = null) {
                const specs = this.engine.specs;
                const finalW = outWidthMm || specs.widthMm;
                const finalH = outHeightMm || specs.heightMm;
                const scaleX = finalW / (specs.widthMm || 1);

                ctx.save();
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 0.25 * pxPerMm;

                const offset = bleedPx + (1.5 * pxPerMm);
                const len = 6 * pxPerMm;
                const slugY = trimY - offset - len - (2.0 * pxPerMm);

                // Top-Left Corner Crop Marks
                ctx.beginPath();
                ctx.moveTo(trimX - offset - len, trimY); ctx.lineTo(trimX - offset, trimY);
                ctx.moveTo(trimX, trimY - offset - len); ctx.lineTo(trimX, trimY - offset);
                // Top-Right Corner Crop Marks
                ctx.moveTo(trimX + trimW + offset, trimY); ctx.lineTo(trimX + trimW + offset + len, trimY);
                ctx.moveTo(trimX + trimW, trimY - offset - len); ctx.lineTo(trimX + trimW, trimY - offset);
                // Bottom-Left Corner Crop Marks
                ctx.moveTo(trimX - offset - len, trimY + trimH); ctx.lineTo(trimX - offset, trimY + trimH);
                ctx.moveTo(trimX, trimY + trimH + offset); ctx.lineTo(trimX, trimY + trimH + offset + len);
                // Bottom-Right Corner Crop Marks
                ctx.moveTo(trimX + trimW + offset, trimY + trimH); ctx.lineTo(trimX + trimW + offset + len, trimY + trimH);
                ctx.moveTo(trimX + trimW, trimY + trimH + offset); ctx.lineTo(trimX + trimW, trimY + trimH + offset + len);
                ctx.stroke();

                // Central Fold Line Marks (only if document has fold and we are not overriding to a single-page portrait A4)
                const isOverriddenToSinglePortrait = (finalW === 210 && finalH === 297) || (finalW === 170 && finalH === 300);
                if (specs.hasFold && specs.foldXMm && !isOverriddenToSinglePortrait) {
                    const foldMarks = specs.foldMarks && specs.foldMarks.length > 0
                        ? specs.foldMarks
                        : [specs.foldXMm];

                    foldMarks.forEach(foldMm => {
                        const scaledFoldMm = Math.round(foldMm * scaleX * 10) / 10;
                        const foldX = trimX + (scaledFoldMm * pxPerMm);
                        ctx.save();
                        ctx.setLineDash([1 * pxPerMm, 1 * pxPerMm]);
                        ctx.beginPath();
                        ctx.moveTo(foldX, trimY - offset - len);
                        ctx.lineTo(foldX, trimY - offset);
                        ctx.moveTo(foldX, trimY + trimH + offset);
                        ctx.lineTo(foldX, trimY + trimH + offset + len);
                        ctx.stroke();
                        ctx.restore();

                        ctx.save();
                        ctx.fillStyle = '#000000';
                        ctx.font = `500 ${2.4 * pxPerMm}px "JetBrains Mono", monospace`;
                        ctx.textBaseline = 'bottom';
                        ctx.textAlign = 'center';
                        ctx.fillText(`▼ PLI ${scaledFoldMm}mm ▼`, foldX, slugY);
                        ctx.restore();
                    });
                }

                // Technical Slug Label cleanly placed ABOVE the crop & fold marks (no line intersection)
                ctx.fillStyle = '#000000';
                ctx.font = `500 ${2.4 * pxPerMm}px "JetBrains Mono", monospace`;
                ctx.textBaseline = 'bottom';

                ctx.textAlign = 'left';
                const formatTag = (finalW === 210 && finalH === 297)
                    ? `A4 210×297mm`
                    : (finalW === 297 && finalH === 210)
                        ? `A4 PAYSAGE 297×210mm`
                        : `${finalW}×${finalH}mm`;
                ctx.fillText(
                    `INMENU STUDIO PRO | ${String(face.name || '').toUpperCase()} | ${formatTag} (+${specs.bleedMm}mm)`,
                    trimX + (2 * pxPerMm),
                    slugY,
                    trimW * 0.65
                );

                ctx.textAlign = 'right';
                const dateStr = new Date().toISOString().slice(0, 10);
                ctx.fillText(`PRÉ-PRESSE • ${dateStr}`, trimX + trimW - (2 * pxPerMm), slugY);

                ctx.restore();
            }

            /**
             * Renders automated page numbers directly on the printed canvas face
             */
            drawAutomaticPageNumbersOnFace(ctx, face, trimOriginX, trimOriginY, pxPerMm, scaleX = 1, scaleY = 1) {
                const faceIndex = this.engine.faces.indexOf(face);
                if (faceIndex < 0) return;

                const isSpread = Boolean(this.engine.specs.hasFold);
                const sides = isSpread ? ['left', 'right'] : ['single'];

                sides.forEach(side => {
                    const info = this.engine.getPageNumberInfo(faceIndex, side);
                    if (!info) return;

                    ctx.save();
                    const fontPt = this.engine.pageNumbering.fontSizePt || 8.5;
                    const fontPx = Math.max(2, fontPt * PT_TO_MM * pxPerMm * ((scaleX + scaleY) / 2));
                    const family = this.engine.pageNumbering.fontFamily || 'Montserrat';
                    ctx.font = `600 ${fontPx}px "${family}", sans-serif`;
                    ctx.fillStyle = this.engine.pageNumbering.color || '#64748b';
                    ctx.textAlign = info.align || 'center';
                    ctx.textBaseline = 'middle';

                    const posX = trimOriginX + (info.xMm * scaleX * pxPerMm);
                    const posY = trimOriginY + (info.yMm * scaleY * pxPerMm);

                    ctx.fillText(info.text, posX, posY);
                    ctx.restore();
                });
            }

            roundRect(ctx, x, y, w, h, r) {
                const radius = Math.max(0, Math.min(r, w / 2, h / 2));
                ctx.beginPath();
                ctx.moveTo(x + radius, y);
                ctx.lineTo(x + w - radius, y);
                ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
                ctx.lineTo(x + w, y + h - radius);
                ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
                ctx.lineTo(x + radius, y + h);
                ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
                ctx.lineTo(x, y + radius);
                ctx.quadraticCurveTo(x, y, x + radius, y);
                ctx.closePath();
            }

            loadImage(url, timeoutMs = 15000) {
                if (this.imageCache.has(url)) {
                    return this.imageCache.get(url);
                }
                const promise = new Promise((resolve, reject) => {
                    const img = new Image();
                    // Évite un export bloqué indéfiniment si un serveur d'images ne répond jamais
                    const timer = setTimeout(() => {
                        img.onload = img.onerror = null;
                        img.src = '';
                        this.imageCache.delete(url);
                        reject(new Error(`Timeout image: ${url}`));
                    }, timeoutMs);
                    img.crossOrigin = 'anonymous';
                    img.onload = () => {
                        clearTimeout(timer);
                        resolve(img);
                    };
                    img.onerror = (e) => {
                        clearTimeout(timer);
                        this.imageCache.delete(url);
                        reject(e);
                    };
                    img.src = url;
                });
                this.imageCache.set(url, promise);
                return promise;
            }
        }

        if (typeof window !== 'undefined') {
            window.PrintExporter = PrintExporter;
        }

        /**
         * ============================================================================
         * MODULE 2: VisualCanvasEditor & Application Controller
         * Manages the interactive InDesign workspace, millimeter coordinates,
         * drag/resize handles, magnetic fold/margin snapping, and modals.
         * ============================================================================
         */
        