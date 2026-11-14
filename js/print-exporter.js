/**
 * MODULE 3: PrintExporter (print-exporter.js)
 */
class PrintExporter {
            constructor(engine) {
                this.engine = engine;
                this.imageCache = new Map();
            }

            /**
             * Renders any face onto a high-DPI HTML5 Canvas in exact millimeters
             * @param {Object} face - The face object from DocumentEngine
             * @param {Object} options - { includeBleed, includeCropMarks, scalePxPerMm }
             */
            async renderFaceToCanvas(face, options = {}) {
                if (document.fonts && document.fonts.ready) {
                    try { await document.fonts.ready; } catch (_) {}
                }

                const specs = this.engine.specs;
                const includeBleed = options.includeBleed !== false;
                const includeCropMarks = options.includeCropMarks !== false;
                const pxPerMm = options.scalePxPerMm || 4;

                const bleed = includeBleed ? specs.bleedMm : 0;
                const slugMargin = includeCropMarks ? 15 : 0; // 15mm margin outside bleed for crop marks, fold marks & slug

                const totalWidthMm = specs.widthMm + (bleed * 2) + (slugMargin * 2);
                const totalHeightMm = specs.heightMm + (bleed * 2) + (slugMargin * 2);

                const canvas = document.createElement('canvas');
                canvas.width = Math.round(totalWidthMm * pxPerMm);
                canvas.height = Math.round(totalHeightMm * pxPerMm);
                const ctx = canvas.getContext('2d');

                // Origin of Trim Box (0,0 of the 340x300mm page)
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
                const clipW = (specs.widthMm + bleed * 2) * pxPerMm;
                const clipH = (specs.heightMm + bleed * 2) * pxPerMm;

                ctx.beginPath();
                ctx.rect(clipX, clipY, clipW, clipH);
                ctx.clip();

                // Fill default page background
                ctx.fillStyle = face.bgColor || '#fdfbf7';
                ctx.fillRect(clipX, clipY, clipW, clipH);

                // 3. Draw every object on the face
                for (const obj of face.objects) {
                    await this.drawObjectOnCanvas(ctx, obj, trimOriginX, trimOriginY, pxPerMm, failedImages);
                }

                ctx.restore();

                // 4. Draw Printer Marks (Traits de coupe, Traits de pli à 170mm, Hirondelles)
                if (includeCropMarks) {
                    this.drawPrinterMarks(ctx, trimOriginX, trimOriginY, specs.widthMm * pxPerMm, specs.heightMm * pxPerMm, bleed * pxPerMm, pxPerMm, face);
                }

                return { canvas, totalWidthMm, totalHeightMm, failedImages };
            }

            
            /**
             * Renders a SINGLE 170 x 300 mm Panel ('left' or 'right') from a 340 x 300 mm face
             * for printers who impose single pages (Page 1 to Page 20) into a saddle-stitched booklet.
             * @param {Object} face - The spread face object from DocumentEngine
             * @param {String} side - 'left' (0..170mm) or 'right' (170..340mm)
             * @param {Number} pageNumber - Sequential page number (1..20)
             * @param {Object} options - { includeBleed, includeCropMarks, scalePxPerMm }
             */
            async renderSinglePanelToCanvas(face, side, pageNumber, options = {}) {
                if (document.fonts && document.fonts.ready) {
                    try { await document.fonts.ready; } catch (_) {}
                }

                const panelWidthMm = 170;
                const panelHeightMm = 300;
                const specs = this.engine.specs;
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
                const offsetXMm = side === 'right' ? 170 : 0;
                const failedImages = [];

                // 1. Fill Slug background white
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // 2. Clip to 170x300mm (+3mm bleed) box
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

                // 3. Shift origin by -170mm when rendering right panel so objects in [170..340] map to [0..170]
                const shiftedOriginX = trimOriginX - (offsetXMm * pxPerMm);
                for (const obj of face.objects) {
                    await this.drawObjectOnCanvas(ctx, obj, shiftedOriginX, trimOriginY, pxPerMm, failedImages);
                }

                ctx.restore();

                // 4. Draw Corner Crop Marks for this 170x300mm single page
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
                        side
                    );
                }

                return { canvas, totalWidthMm, totalHeightMm, failedImages };
            }

            drawSinglePanelMarks(ctx, trimX, trimY, trimW, trimH, bleedPx, pxPerMm, pageNumber, face, side) {
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
                const sideLabel = side === 'left' ? 'PANNEAU GAUCHE' : 'PANNEAU DROIT';
                ctx.fillText(
                    `GREY CORNER | PAGE ${String(pageNumber).padStart(2, '0')} / 20 (${sideLabel}) | 170×300mm (+3mm)`,
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

            async drawObjectOnCanvas(ctx, obj, originX, originY, pxPerMm, failedImages = []) {
                const x = originX + obj.x * pxPerMm;
                const y = originY + obj.y * pxPerMm;
                const w = obj.w * pxPerMm;
                const h = obj.h * pxPerMm;

                ctx.save();
                ctx.globalAlpha = obj.opacity !== undefined ? obj.opacity : 1;

                if (obj.type === 'shape') {
                    this.roundRect(ctx, x, y, w, h, (obj.radius ?? 0) * pxPerMm);
                    if (obj.bgColor && obj.bgColor !== 'transparent') {
                        ctx.fillStyle = obj.bgColor;
                        ctx.fill();
                    }
                    if (obj.borderWidth > 0 && obj.borderColor && obj.borderColor !== 'transparent') {
                        ctx.lineWidth = obj.borderWidth * (pxPerMm * 0.35);
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
                    ctx.font = `700 ${fontPx}px Montserrat, sans-serif`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText((obj.text || 'CATÉGORIE').toUpperCase(), 0, 0, Math.max(10, h - 4 * pxPerMm));
                    ctx.restore();
                }
                else if (obj.type === 'badge_new') {
                    this.roundRect(ctx, x, y, w, h, (obj.radius ?? 8) * pxPerMm);
                    ctx.save();
                    ctx.clip();
                    ctx.fillStyle = obj.bgColor || '#e11d48';
                    ctx.fillRect(x, y, w, h);

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
                    ctx.font = `700 ${Math.max(2.5 * pxPerMm, h * 0.22)}px Cinzel, serif`;
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
                        desc: obj.customDesc || 'Ingrédients et préparation',
                        price: obj.customPrice || '00 DH',
                        badge: ''
                    };
                    this.drawSingleDishRow(ctx, dish, x, y, w, pxPerMm, {
                        nameColor: obj.textColor || '#1e293b',
                        descColor: obj.descColor || '#64748b',
                        priceColor: obj.priceColor || '#9a3412',
                        fontSize: obj.fontSize || 11
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
                    let currY = y;
                    if (obj.title) {
                        ctx.fillStyle = obj.titleColor || '#9a3412';
                        ctx.font = `700 ${4.4 * pxPerMm}px "Playfair Display", serif`;
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
                            fontSize: obj.fontSize || 10.5
                        });
                        currY += rowHeight + (2.5 * pxPerMm);
                    }
                    ctx.restore();
                }
                else if (obj.type === 'photo') {
                    const radiusPx = (obj.radius ?? 4) * pxPerMm;
                    this.roundRect(ctx, x, y, w, h, radiusPx);
                    ctx.save();
                    ctx.clip();
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
                        this.roundRect(ctx, x, y, w, h, radiusPx);
                        ctx.lineWidth = obj.borderWidth * (pxPerMm * 0.35);
                        ctx.strokeStyle = obj.borderColor || '#c8a96a';
                        ctx.stroke();
                    }
                }
                else if (obj.type === 'text') {
                    ctx.save();
                    ctx.beginPath();
                    ctx.rect(x, y, w, h);
                    ctx.clip();

                    const fontPx = Math.max(1, (obj.fontSize || 12) * PT_TO_MM * pxPerMm);
                    const family = obj.fontFamily || 'Playfair Display';
                    const fallback = typeof getFontFallback === 'function' ? getFontFallback(family) : (isSansFontFamily(family) ? 'sans-serif' : 'serif');
                    ctx.fillStyle = obj.color || '#1e293b';
                    ctx.font = `${obj.fontWeight || '500'} ${fontPx}px "${family}", ${fallback}`;
                    ctx.textBaseline = 'top';

                    const lines = this.wrapCanvasText(ctx, obj.text || '', Math.max(10, w));
                    let lineY = y;
                    for (const line of lines) {
                        if (lineY > y + h) break;
                        let lineX = x;
                        if (obj.align === 'center') {
                            ctx.textAlign = 'center';
                            lineX = x + w / 2;
                        } else if (obj.align === 'right') {
                            ctx.textAlign = 'right';
                            lineX = x + w;
                        } else {
                            ctx.textAlign = 'left';
                        }
                        ctx.fillText(line, lineX, lineY);
                        lineY += fontPx * 1.35;
                    }
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

                let badgeW = 0;
                if (hasBadge) {
                    ctx.font = `700 ${badgeFontPx}px Montserrat, sans-serif`;
                    badgeW = ctx.measureText(badgeLabel).width + (2.4 * pxPerMm);
                }

                // Measure Price on right
                const priceText = dish.price || '';
                ctx.font = `700 ${titlePx}px Montserrat, sans-serif`;
                const priceW = ctx.measureText(priceText).width;

                // Draw Price aligned right on first line
                ctx.fillStyle = style.priceColor;
                ctx.textAlign = 'right';
                ctx.textBaseline = 'top';
                ctx.fillText(priceText, x + w, y);

                // Wrap Name so it never collides with Price
                ctx.font = `700 ${titlePx}px "Playfair Display", serif`;
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

                // Dotted Leader on first line when space allows
                if (nameLines.length === 1) {
                    const dotsStart = firstLineUsedEndX + (2 * pxPerMm);
                    const dotsEnd = x + w - priceW - (2 * pxPerMm);
                    if (dotsEnd > dotsStart + (2 * pxPerMm)) {
                        ctx.save();
                        ctx.strokeStyle = style.descColor;
                        ctx.globalAlpha *= 0.45;
                        ctx.lineWidth = 0.3 * pxPerMm;
                        ctx.setLineDash([0.6 * pxPerMm, 1.2 * pxPerMm]);
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
                    ctx.font = `400 ${descPx}px Inter, sans-serif`;
                    ctx.textAlign = 'left';
                    const maxDescW = Math.max(10 * pxPerMm, w - (6 * pxPerMm));
                    const descLines = this.wrapCanvasText(ctx, cleanDesc, maxDescW);
                    for (const dl of descLines) {
                        ctx.fillText(dl, x, currY);
                        currY += descPx * 1.28;
                    }
                }

                return (currY - y);
            }

            /**
             * Draws authentic Pre-Press Crop Marks (Traits de coupe aux 4 coins),
             * Fold Marks (Traits de pli pointillés à X = 170 mm), and Slug Info.
             */
            drawPrinterMarks(ctx, trimX, trimY, trimW, trimH, bleedPx, pxPerMm, face) {
                ctx.save();
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 0.25 * pxPerMm;

                const offset = bleedPx + (1.5 * pxPerMm);
                const len = 6 * pxPerMm;

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

                // Central Fold Line Marks (Traits de pli en pointillés) — position issue des specs
                const foldMm = this.engine.specs.foldXMm;
                const foldX = trimX + (foldMm * pxPerMm);
                ctx.save();
                ctx.setLineDash([1 * pxPerMm, 1 * pxPerMm]);
                ctx.beginPath();
                ctx.moveTo(foldX, trimY - offset - len);
                ctx.lineTo(foldX, trimY - offset);
                ctx.moveTo(foldX, trimY + trimH + offset);
                ctx.lineTo(foldX, trimY + trimH + offset + len);
                ctx.stroke();
                ctx.restore();

                // Technical Slug Label cleanly placed ABOVE the crop & fold marks (no line intersection)
                const slugY = trimY - offset - len - (2.0 * pxPerMm);
                ctx.fillStyle = '#000000';
                ctx.font = `500 ${2.4 * pxPerMm}px "JetBrains Mono", monospace`;
                ctx.textBaseline = 'bottom';

                ctx.textAlign = 'center';
                ctx.fillText(`▼ PLI ${foldMm}mm ▼`, foldX, slugY);

                ctx.textAlign = 'left';
                const leftMaxW = (foldX - trimX) - (20 * pxPerMm);
                const specs = this.engine.specs;
                ctx.fillText(
                    `INMENU STUDIO PRO | ${String(face.name || '').toUpperCase()} | ${specs.widthMm}×${specs.heightMm}mm (+${specs.bleedMm}mm)`,
                    trimX + (2 * pxPerMm),
                    slugY,
                    Math.max(40 * pxPerMm, leftMaxW)
                );

                ctx.textAlign = 'right';
                const dateStr = new Date().toISOString().slice(0, 10);
                ctx.fillText(`PRÉ-PRESSE • ${dateStr}`, trimX + trimW - (2 * pxPerMm), slugY);

                ctx.restore();
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

        /**
         * ============================================================================
         * MODULE 2: VisualCanvasEditor & Application Controller
         * Manages the interactive InDesign workspace, millimeter coordinates,
         * drag/resize handles, magnetic fold/margin snapping, and modals.
         * ============================================================================
         */
        