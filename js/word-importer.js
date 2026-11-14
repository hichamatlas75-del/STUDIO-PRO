/**
 * MODULE 1B: WordMenuImporter & AutoLayoutEngine (word-importer.js)
 */
class WordMenuImporter {
    static buildOfflinePhotoDataUrl(title, subtitle, bg1 = '#1f2937', bg2 = '#0f172a', accent = '#d4af37') {
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" width="600" height="400">` +
            `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${bg1}"/><stop offset="100%" stop-color="${bg2}"/></linearGradient></defs>` +
            `<rect width="600" height="400" fill="url(#g)"/>` +
            `<rect x="24" y="24" width="552" height="352" fill="none" stroke="${accent}" stroke-width="2" stroke-opacity="0.55" rx="8"/>` +
            `<rect x="34" y="34" width="532" height="332" fill="none" stroke="${accent}" stroke-width="0.8" stroke-opacity="0.3" rx="6"/>` +
            `<circle cx="300" cy="155" r="46" fill="none" stroke="${accent}" stroke-width="1.8" stroke-opacity="0.7"/>` +
            `<circle cx="300" cy="155" r="34" fill="none" stroke="${accent}" stroke-width="1" stroke-dasharray="4 3" stroke-opacity="0.5"/>` +
            `<path d="M286 135 v22 M280 135 v12 a6 6 0 0 0 12 0 v-12 M286 157 v20 M314 135 c6 0 8 10 8 18 s-4 10-8 10 v14" stroke="${accent}" stroke-width="2.2" fill="none" stroke-linecap="round"/>` +
            `<text x="300" y="245" text-anchor="middle" fill="${accent}" font-family="Georgia, serif" font-size="22" font-weight="bold" letter-spacing="3">${title}</text>` +
            `<text x="300" y="278" text-anchor="middle" fill="#e5e7eb" font-family="sans-serif" font-size="13" opacity="0.85" letter-spacing="1">${subtitle}</text>` +
            `</svg>`;
        return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    }

    static getSampleFullMenuText() {
        if (typeof getGreyCornerSampleText === 'function') {
            return getGreyCornerSampleText();
        }
        return '';
    }

    static async extractTextFromDocx(arrayBuffer) {
        if (typeof mammoth === 'undefined') {
            throw new Error('Librairie Mammoth.js non chargée');
        }
        try {
            const htmlRes = await mammoth.convertToHtml({ arrayBuffer });
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlRes.value || '', 'text/html');
            const lines = [];

            const blocks = doc.body.querySelectorAll('h1, h2, h3, h4, h5, h6, tr, p, li');
            blocks.forEach(el => {
                const tag = el.tagName;
                if ((tag === 'P' || tag === 'LI') && el.closest('table')) {
                    return; // handled by parent <tr>
                }
                if (/^H[1-6]$/.test(tag)) {
                    const txt = (el.textContent || '').replace(/\s+/g, ' ').trim();
                    if (txt) lines.push(`# ${txt}`);
                    return;
                }
                if (tag === 'TR') {
                    const cells = Array.from(el.querySelectorAll('td, th'))
                        .map(c => (c.textContent || '').replace(/\s+/g, ' ').trim())
                        .filter(Boolean);
                    if (cells.length === 1) {
                        lines.push(cells[0]);
                    } else if (cells.length >= 2) {
                        const last = cells[cells.length - 1];
                        const left = cells.slice(0, -1).join(' - ');
                        lines.push(`${left} ... ${last}`);
                    }
                    return;
                }
                // P or LI: split on <br>
                const clone = el.cloneNode(true);
                clone.querySelectorAll('br').forEach(br => br.replaceWith('\n'));
                const raw = (clone.textContent || '').split(/\r?\n/).map(s => s.replace(/\s+/g, ' ').trim()).filter(Boolean);
                lines.push(...raw);
            });

            const structured = lines.join('\n').trim();
            if (structured) return structured;
        } catch (err) {
            console.warn('Mammoth HTML parse fallback to raw text:', err);
        }

        const rawRes = await mammoth.extractRawText({ arrayBuffer });
        return rawRes.value || '';
    }

    /**
     * Parses unstructured or semi-structured text from Word into an array of dish objects
     * Handles single-line formats, inline prices, multiline descriptions, and standalone prices.
     */
    static parseText(rawText) {
        const lines = (rawText || '').split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
        const parsedDishes = [];
        let currentCategory = 'SÉLECTION DU CHEF';
        let counter = 1;

        const badgeRegex = /\[(NOUVEAU|NEW|CHEF|ETOILE|★)\]/i;
        const badgeGlobalRegex = /\[(NOUVEAU|NEW|CHEF|ETOILE|★)\]/gi;
        const priceWithCurrencySuffix = /(?:(?:\s*[.\-–—…|:]+\s*)|\s+)(\d+(?:[.,]\d{1,2})?\s*(?:DH|DHS|MAD|€|EUR|CHF|FCFA|\$|£))\s*$/i;
        const priceWithCurrencyPrefix = /(?:(?:\s*[.\-–—…|:]+\s*)|\s+)([$€£]\s*\d+(?:[.,]\d{1,2})?)\s*$/i;
        const priceWithSeparatorOnly = /(?:(?:\s*[.\-–—…|:]+\s*)|\s{2,})(\d{1,5}(?:[.,]\d{1,2})?)\s*$/;
        const standalonePriceRegex = /^(\d+(?:[.,]\d{1,2})?\s*(?:DH|DHS|MAD|€|EUR|CHF|FCFA|\$|£)|[$€£]\s*\d+(?:[.,]\d{1,2})?|\d{1,5}(?:[.,]\d{1,2})?)$/i;

        const matchLinePrice = (line) => {
            return line.match(priceWithCurrencySuffix)
                || line.match(priceWithCurrencyPrefix)
                || line.match(priceWithSeparatorOnly);
        };

        const isCategoryLine = (line) => {
            const hasLetters = /[A-Za-zÀ-ÖØ-öø-ÿ]/.test(line);
            if (!hasLetters) return false;
            if (/^#+\s+/.test(line) || /^CAT[ÉE]GORIE\s*:/i.test(line)) return true;

            const cleaned = line.replace(badgeGlobalRegex, '').trim();
            if (matchLinePrice(cleaned) || standalonePriceRegex.test(cleaned)) return false;

            const hasDigits = /\d/.test(cleaned);
            const isAllCapsCategory = !hasDigits && cleaned.length >= 3 && cleaned.length <= 50 && cleaned === cleaned.toUpperCase() && !/^\[/.test(cleaned);
            const isColonCategory = !hasDigits && cleaned.endsWith(':') && cleaned.length >= 3 && cleaned.length <= 50;
            return isAllCapsCategory || isColonCategory;
        };

        const formatPrice = (raw) => {
            let p = String(raw || '').trim();
            if (!/(DH|MAD|€|EUR|CHF|FCFA|\$|£)/i.test(p)) {
                p += ' DH';
            } else {
                p = p.replace(/dhs?/i, 'DH').replace(/eur/i, '€').toUpperCase();
            }
            return p;
        };

        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];

            // 1. Check if line is a Category Heading
            if (isCategoryLine(line)) {
                currentCategory = line
                    .replace(/^#+\s*/, '')
                    .replace(/^CAT[ÉE]GORIE\s*:\s*/i, '')
                    .replace(/:$/, '')
                    .trim()
                    .toUpperCase();
                continue;
            }

            // 2. Extract badge if any
            let badge = '';
            const badgeMatch = line.match(badgeRegex);
            if (badgeMatch) {
                const rawBadge = badgeMatch[1].toUpperCase();
                badge = (rawBadge === 'NEW' || rawBadge === 'NOUVEAU') ? 'NOUVEAU' : 'CHEF';
                line = line.replace(badgeGlobalRegex, '').trim();
            }

            let priceMatch = matchLinePrice(line);
            let name = '';
            let desc = '';
            let rawPrice = '';

            if (priceMatch) {
                rawPrice = formatPrice(priceMatch[1]);
                const contentPart = line.slice(0, priceMatch.index).replace(/[.\-–—…|:\s]+$/, '').trim();

                const sepMatch = contentPart.match(/\s+(?:[-–—:|])\s+/);
                if (sepMatch) {
                    name = contentPart.slice(0, sepMatch.index).trim();
                    desc = contentPart.slice(sepMatch.index + sepMatch[0].length).trim();
                } else {
                    name = contentPart;
                    // Look ahead: only consume next line if it is a pure description (not a dish name with price)
                    if (i + 1 < lines.length) {
                        const nextLine = lines[i + 1];
                        const nextCleaned = nextLine.replace(badgeGlobalRegex, '').trim();
                        const nextHasPrice = Boolean(matchLinePrice(nextCleaned)) || standalonePriceRegex.test(nextCleaned);
                        if (!nextHasPrice && !isCategoryLine(nextLine)) {
                            const lineAfterNextHasPrice = (i + 2 < lines.length) &&
                                (Boolean(matchLinePrice(lines[i + 2])) || standalonePriceRegex.test(lines[i + 2].trim()));
                            if (!lineAfterNextHasPrice) {
                                desc = nextLine;
                                i++; // consume description line
                            }
                        }
                    }
                }
            } else {
                // Line has NO price. Check multiline pattern:
                // Format A: Line i = Name, Line i+1 = Standalone price
                // Format B: Line i = Name, Line i+1 = "Desc ... 48 DH"
                // Format C: Line i = Name, Line i+1 = Desc, Line i+2 = Standalone price
                if (i + 1 < lines.length) {
                    const next1 = lines[i + 1].trim();
                    const next1StandPrice = next1.match(standalonePriceRegex);
                    const next1PriceMatch = matchLinePrice(next1);

                    if (next1StandPrice) {
                        name = line;
                        rawPrice = formatPrice(next1StandPrice[1]);
                        i++;
                    } else if (next1PriceMatch && !isCategoryLine(next1)) {
                        name = line;
                        rawPrice = formatPrice(next1PriceMatch[1]);
                        desc = next1.slice(0, next1PriceMatch.index).replace(/[.\-–—…|:\s]+$/, '').trim();
                        i++;
                    } else if (i + 2 < lines.length) {
                        const next2 = lines[i + 2].trim();
                        const next2StandPrice = next2.match(standalonePriceRegex);
                        if (next2StandPrice && !isCategoryLine(next1)) {
                            name = line;
                            desc = next1;
                            rawPrice = formatPrice(next2StandPrice[1]);
                            i += 2;
                        }
                    }
                }
            }

            if (name && rawPrice) {
                const catPrefix = currentCategory
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '')
                    .replace(/[^A-Z]/g, '')
                    .slice(0, 3) || 'PLT';
                parsedDishes.push({
                    id: `${catPrefix}${String(counter++).padStart(2, '0')}`,
                    category: currentCategory,
                    name: name || 'Plat Signature',
                    desc: desc || '',
                    price: rawPrice,
                    badge: badge
                });
            }
        }

        return parsedDishes;
    }

    static estimateDishRowHeightMm(dish) {
        const descLen = (dish.desc || '').trim().length;
        if (descLen === 0) return 9.5;
        const lines = Math.max(1, Math.ceil(descLen / 54));
        return 8.5 + lines * 4.2;
    }

    static estimateBlockHeightMm(dishesSlice, hasTitle = true) {
        const headerH = hasTitle ? 11 : 2;
        const bodyH = dishesSlice.reduce((sum, d) => sum + this.estimateDishRowHeightMm(d) + 2.5, 0);
        return Math.ceil(headerH + bodyH + 4);
    }

    /**
     * Builds Front Cover (Right Panel) + Back Cover / Suggestions (Left Panel)
     * safely on any target spread without modifying other faces.
     */
    static buildCoverSpread(coverFace, engine, options = {}) {
        const themeKey = options.theme || 'bistro_warm';
        const brandTitle = options.brandTitle || 'GREY CORNER';
        const brandSub = options.brandSub || 'CAFÉ • RESTAURANT • SINCE 2024';
        const palette = options.palette || this.getThemePalette(themeKey);

        coverFace.bgColor = palette.coverBg;
        const allDishes = engine.dishesDB || [];
        const featuredDishes = allDishes.filter(d => d.badge === 'NOUVEAU' || d.badge === 'CHEF').slice(0, 3);
        while (featuredDishes.length < 3 && allDishes.length > featuredDishes.length) {
            const candidate = allDishes.find(d => !featuredDishes.includes(d));
            if (!candidate) break;
            featuredDishes.push(candidate);
        }

        coverFace.objects = [
            {
                id: 'cov_bleed_bg', type: 'shape', name: 'Fond Couverture (Fond perdu 3mm)',
                x: -3, y: -3, w: 346, h: 306,
                bgColor: palette.coverBg, borderColor: 'transparent', borderWidth: 0, radius: 0, opacity: 1, locked: true
            },
            {
                id: 'cov_frame_left', type: 'shape', name: 'Cadre Dos (Panneau Gauche)',
                x: 14, y: 14, w: 142, h: 272,
                bgColor: palette.frameBg, borderColor: palette.frameBorder, borderWidth: 1.5, radius: 4, opacity: 1
            },
            {
                id: 'cov_frame_right', type: 'shape', name: 'Cadre Couverture (Panneau Droit)',
                x: 184, y: 14, w: 142, h: 272,
                bgColor: palette.frameBg, borderColor: palette.frameBorder, borderWidth: 1.5, radius: 4, opacity: 1
            },
            {
                id: 'cov_logo', type: 'logo', name: 'Logo Couverture',
                x: 205, y: 36, w: 100, h: 55,
                title: brandTitle, subtitle: brandSub,
                color: palette.accent, bgColor: 'transparent'
            },
            {
                id: 'cov_photo', type: 'photo', name: 'Photo Couverture',
                x: 200, y: 104, w: 110, h: 115,
                imageUrl: this.buildOfflinePhotoDataUrl('GREY CORNER CAFÉ', 'Créations Gourmandes & Produits Frais', '#292018', '#14110f', '#c5a059'),
                caption: 'Créations Gourmandes & Produits Frais',
                radius: 6, borderColor: palette.frameBorder, borderWidth: 1.5
            },
            {
                id: 'cov_footer_txt', type: 'text', name: 'Pied de Couverture',
                x: 195, y: 238, w: 120, h: 32,
                text: 'CARTE & MENU DÉGUSTATION\nOuvert 7j/7 — Service continu',
                fontFamily: 'Cinzel', fontSize: 11, color: palette.coverText, align: 'center', fontWeight: '600'
            },
            {
                id: 'cov_back_banner', type: 'vertical_banner', name: 'Bandeau Suggestions',
                x: 20, y: 26, w: 14, h: 112,
                text: 'SUGGESTIONS', bgColor: palette.accent, textColor: palette.coverBannerText, fontSize: 12, radius: 3
            },
            {
                id: 'cov_back_title', type: 'text', name: 'Titre Suggestions',
                x: 40, y: 26, w: 108, h: 16,
                text: 'À Découvrir Absolument',
                fontFamily: 'Playfair Display', fontSize: 15, color: palette.accent, align: 'left', fontWeight: '700'
            }
        ];

        featuredDishes.forEach((fd, idx) => {
            coverFace.objects.push({
                id: `cov_feat_${idx}`, type: 'dish_item', name: `Suggestion ${idx + 1}`,
                x: 40, y: 46 + idx * 30, w: 108, h: 26,
                dishId: fd.id, textColor: palette.coverText, descColor: palette.coverMuted, priceColor: palette.accent, fontSize: 11
            });
        });

        coverFace.objects.push({
            id: 'cov_back_info', type: 'text', name: 'Mentions Légales Dos',
            x: 26, y: 215, w: 118, h: 55,
            text: `${brandTitle}\nCuisine préparée minute à partir d'ingrédients frais.\n\nPrix taxes et service compris.\nMerci de votre visite.`,
            fontFamily: 'Inter', fontSize: 9.5, color: palette.coverMuted, align: 'center', fontWeight: '400'
        });
    }

    static getThemePalette(themeKey) {
        const themes = {
            bistro_warm: {
                paperBg: '#faf7f2',
                coverBg: '#17191e',
                frameBg: '#1e2128',
                frameBorder: '#c8a96a',
                accent: '#c8a96a',
                coverText: '#f3f4f6',
                coverMuted: '#cbd5e1',
                coverBannerText: '#17191e',
                bannerBg: ['#1e293b', '#9a3412', '#b45309', '#15803d', '#7c2d12'],
                bannerText: '#ffffff',
                titleColor: '#9a3412',
                dishName: '#1e293b',
                dishDesc: '#64748b',
                dishPrice: '#9a3412'
            },
            luxury_dark: {
                paperBg: '#161920',
                coverBg: '#0c0e12',
                frameBg: '#14171f',
                frameBorder: '#d4af37',
                accent: '#d4af37',
                coverText: '#f8fafc',
                coverMuted: '#94a3b8',
                coverBannerText: '#111318',
                bannerBg: ['#d4af37', '#b45309', '#e5c158', '#9a3412'],
                bannerText: '#111318',
                titleColor: '#d4af37',
                dishName: '#f8fafc',
                dishDesc: '#94a3b8',
                dishPrice: '#d4af37'
            },
            minimal_slate: {
                paperBg: '#ffffff',
                coverBg: '#0f172a',
                frameBg: '#1e293b',
                frameBorder: '#94a3b8',
                accent: '#e2e8f0',
                coverText: '#f8fafc',
                coverMuted: '#cbd5e1',
                coverBannerText: '#0f172a',
                bannerBg: ['#0f172a', '#334155', '#1e293b', '#475569'],
                bannerText: '#ffffff',
                titleColor: '#0f172a',
                dishName: '#0f172a',
                dishDesc: '#64748b',
                dishPrice: '#0f172a'
            }
        };
        return themes[themeKey] || themes.bistro_warm;
    }

    /**
     * Automatically flows categories across the 10 faces (or current face)
     * while strictly respecting:
     * - Left panel: X = 12mm to 158mm (safe from 10mm outer margin and 160mm fold safety zone)
     * - Right panel: X = 182mm to 328mm (safe from 180mm fold safety zone and 330mm outer margin)
     * - Guarantees that ALL 18 interior panels (Faces 1 to 9) receive content without leaving Face 9 empty.
     */
    static autoLayoutAcrossSpreads(engine, dishes, options = {}) {
        const themeKey = options.theme || 'bistro_warm';
        const brandTitle = options.brandTitle || 'GREY CORNER';
        const brandSub = options.brandSub || 'CAFÉ • RESTAURANT • SINCE 2024';
        const targetMode = options.mode || 'full_auto_spreads';
        const palette = this.getThemePalette(themeKey);

        // SAFEGUARD: Only overwrite engine.dishesDB if explicitly requested (full auto layout or db_only)
        const shouldUpdateFullDB = options.updateDB !== false && (targetMode === 'full_auto_spreads' || targetMode === 'db_only');
        if (shouldUpdateFullDB && Array.isArray(dishes) && dishes.length > 0) {
            engine.dishesDB = JSON.parse(JSON.stringify(dishes));
        } else if (targetMode === 'active_spread_only' && options.mergeToDB && Array.isArray(dishes)) {
            // Merge newly imported dishes without erasing existing database
            const existingIds = new Set(engine.dishesDB.map(d => d.id));
            dishes.forEach(d => {
                if (!existingIds.has(d.id)) {
                    engine.dishesDB.push(JSON.parse(JSON.stringify(d)));
                    existingIds.add(d.id);
                }
            });
        }

        // Determine list of categories to layout
        const categories = (targetMode === 'active_spread_only' && Array.isArray(dishes) && dishes.length > 0)
            ? [...new Set(dishes.map(d => d.category))]
            : engine.getCategories();

        if (targetMode === 'db_only') {
            return { mode: targetMode, totalCategories: categories.length, placedCount: 0, omittedCategories: [] };
        }

        // Split oversized categories into panel chunks
        const maxPanelHeightMm = 264;
        const chunks = [];
        categories.forEach(catName => {
            const catDishes = (targetMode === 'active_spread_only' && Array.isArray(dishes))
                ? dishes.filter(d => d.category === catName)
                : engine.getDishesByCategory(catName);

            if (!catDishes || catDishes.length === 0) return;

            let sliceStart = 0;
            let part = 1;
            while (sliceStart < catDishes.length) {
                let sliceEnd = sliceStart + 1;
                while (
                    sliceEnd < catDishes.length &&
                    this.estimateBlockHeightMm(catDishes.slice(sliceStart, sliceEnd + 1), true) <= maxPanelHeightMm
                ) {
                    sliceEnd++;
                }
                const slice = catDishes.slice(sliceStart, sliceEnd);
                const estH = Math.min(maxPanelHeightMm, Math.max(46, this.estimateBlockHeightMm(slice, true)));
                const hasMore = sliceEnd < catDishes.length || part > 1;
                chunks.push({
                    category: catName,
                    title: part > 1 ? `${catName} (suite)` : catName,
                    bannerText: part > 1 ? `${catName} • ${part}` : catName,
                    sliceStart,
                    sliceEnd,
                    estHeight: estH,
                    dishCount: slice.length,
                    isSplit: hasMore
                });
                sliceStart = sliceEnd;
                part++;
            }
        });

        const placedCategories = new Set();
        let placedChunks = 0;
        let placedDishes = 0;
        const buildSummary = () => ({
            mode: targetMode,
            totalCategories: categories.length,
            placedCount: placedCategories.size,
            omittedCategories: categories.filter(c => !placedCategories.has(c)),
            omittedChunks: chunks.length - placedChunks,
            omittedDishes: Math.max(0, (dishes || engine.dishesDB).length - placedDishes)
        });

        // Helper to build a single panel's blocks (Left panel or Right panel)
        const buildPanelCategoryBlocks = (face, panelSide, chunkList, colorOffset) => {
            const isLeft = panelSide === 'left';
            const bannerX = isLeft ? 12 : 182;
            const listX = isLeft ? 31 : 201;
            const listW = 126; // Safe from 160-180mm fold!

            let currentY = 18;
            const maxPanelY = 284;

            chunkList.forEach((chunk, idx) => {
                const availableH = maxPanelY - currentY;
                if (availableH < 38) return;

                const blockH = Math.min(availableH, chunk.estHeight);
                const bannerColor = palette.bannerBg[(colorOffset + idx) % palette.bannerBg.length];
                const uid = generateUniqueId(`${face.id}_${panelSide}_${idx}`);

                // 1. Vertical Category Banner (Bandeau vertical)
                face.objects.push({
                    id: `ban_${uid}`,
                    type: 'vertical_banner',
                    name: `Bandeau ${chunk.title}`,
                    x: bannerX,
                    y: currentY,
                    w: 14,
                    h: blockH,
                    text: chunk.bannerText,
                    bgColor: bannerColor,
                    textColor: palette.bannerText,
                    fontSize: 11.5,
                    radius: 3
                });

                // 2. Category Auto-List Block (Plats + Descriptions + Prix liés BDD)
                const catObj = {
                    id: `cat_${uid}`,
                    type: 'category_list',
                    name: `Liste ${chunk.title}`,
                    x: listX,
                    y: currentY,
                    w: listW,
                    h: blockH,
                    category: chunk.category,
                    title: chunk.title,
                    titleColor: palette.titleColor,
                    textColor: palette.dishName,
                    descColor: palette.dishDesc,
                    priceColor: palette.dishPrice
                };
                if (chunk.isSplit) {
                    catObj.sliceStart = chunk.sliceStart;
                    catObj.sliceEnd = chunk.sliceEnd;
                }
                face.objects.push(catObj);
                placedCategories.add(chunk.category);
                placedChunks++;
                placedDishes += chunk.dishCount;

                currentY += blockH + 9;
            });
        };

        if (targetMode === 'active_spread_only') {
            const activeIdx = options.activeFaceIndex !== undefined ? options.activeFaceIndex : 0;
            const activeFace = engine.faces[activeIdx] || engine.faces[0];
            activeFace.bgColor = palette.paperBg;
            activeFace.objects = [
                {
                    id: generateUniqueId(`bg_${activeFace.id}`), type: 'shape', name: 'Fond Papier (+3mm fond perdu)',
                    x: -3, y: -3, w: 346, h: 306,
                    bgColor: palette.paperBg, borderColor: 'transparent', borderWidth: 0, radius: 0, opacity: 1, locked: true
                }
            ];

            const leftChunks = [];
            const rightChunks = [];
            let leftY = 18;
            let rightY = 18;
            for (const ch of chunks) {
                if (leftY + ch.estHeight <= 284 && leftChunks.length < 3) {
                    leftChunks.push(ch);
                    leftY += ch.estHeight + 9;
                } else if (rightY + ch.estHeight <= 284 && rightChunks.length < 3) {
                    rightChunks.push(ch);
                    rightY += ch.estHeight + 9;
                }
            }

            buildPanelCategoryBlocks(activeFace, 'left', leftChunks, 0);
            buildPanelCategoryBlocks(activeFace, 'right', rightChunks, leftChunks.length);
            return buildSummary();
        }

        // FULL 5 SHEETS (10 FACES) AUTO-LAYOUT
        // 1. Face 0 (Sheet 1 Recto): Front Cover (Right Panel) + Suggestions & Info (Left Panel)
        this.buildCoverSpread(engine.faces[0], engine, { palette, brandTitle, brandSub });

        // 2. Interior Panels (Faces 1 to 9): 9 faces × 2 panels = 18 panels total!
        // Optimally group chunks into at most 18 panel buckets to occupy all panels evenly
        const maxPanels = 18;
        const maxPanelH = 266;
        let panelBuckets = chunks.map(c => [c]);

        while (panelBuckets.length > maxPanels) {
            let bestIdx = -1;
            let minCombinedH = Infinity;
            for (let i = 0; i < panelBuckets.length - 1; i++) {
                const h1 = panelBuckets[i].reduce((s, c) => s + c.estHeight, 0);
                const h2 = panelBuckets[i + 1].reduce((s, c) => s + c.estHeight, 0);
                const combinedH = h1 + h2 + 9;
                if (combinedH <= maxPanelH && combinedH < minCombinedH) {
                    minCombinedH = combinedH;
                    bestIdx = i;
                }
            }
            if (bestIdx === -1) break; // cannot merge any more within maxPanelH
            panelBuckets[bestIdx] = panelBuckets[bestIdx].concat(panelBuckets[bestIdx + 1]);
            panelBuckets.splice(bestIdx + 1, 1);
        }

        const gourmetPhotos = [
            { url: this.buildOfflinePhotoDataUrl('BRUNCH & MATIN', 'Préparés minute • Produits du terroir', '#2c1e16', '#17110d', '#d97706'), cap: 'Nos Brunchs & Petits-Déjeuners préparés minute' },
            { url: this.buildOfflinePhotoDataUrl('GRILLADES & VIANDES', 'Sélection de viandes grillées au feu de bois', '#2d1616', '#160b0b', '#e11d48'), cap: 'Sélection de viandes grillées au feu de bois' },
            { url: this.buildOfflinePhotoDataUrl('PASTA & PIZZAS', 'Pizzas artisanales et pâtes fraîches maison', '#1e291b', '#0f160e', '#10b981'), cap: 'Pizzas artisanales et pâtes fraîches maison' },
            { url: this.buildOfflinePhotoDataUrl('DOUCEURS & GLACES', 'Pâtisseries, Cheesecakes & Glaces artisanales', '#281829', '#140c15', '#ec4899'), cap: 'Douceurs pâtissières, Cheesecakes & Glaces artisanales' },
            { url: this.buildOfflinePhotoDataUrl('CUISINE D\'AUTEUR', 'Recettes signatures & produits frais de saison', '#1e2433', '#0f131c', '#c5a059'), cap: 'Cuisine d\'auteur & produits frais de saison' }
        ];

        let bucketCursor = 0;
        for (let fIdx = 1; fIdx < 10; fIdx++) {
            const face = engine.faces[fIdx];
            face.bgColor = palette.paperBg;
            const leftPageNum = fIdx * 2;
            const rightPageNum = fIdx * 2 + 1;
            face.objects = [
                {
                    id: `bg_f${fIdx}`, type: 'shape', name: 'Fond Papier (+3mm fond perdu)',
                    x: -3, y: -3, w: 346, h: 306,
                    bgColor: palette.paperBg, borderColor: 'transparent', borderWidth: 0, radius: 0, opacity: 1, locked: true
                },
                // Subtle running headers
                {
                    id: `hdr_l_f${fIdx}`, type: 'text', name: 'En-tête Panneau Gauche',
                    x: 12, y: 8, w: 145, h: 8,
                    text: `${brandTitle}  —  PAGE ${leftPageNum}`,
                    fontFamily: 'Cinzel', fontSize: 7.5, color: palette.dishDesc, align: 'left', fontWeight: '600'
                },
                {
                    id: `hdr_r_f${fIdx}`, type: 'text', name: 'En-tête Panneau Droit',
                    x: 182, y: 8, w: 145, h: 8,
                    text: `PAGE ${rightPageNum}`,
                    fontFamily: 'Cinzel', fontSize: 7.5, color: palette.dishDesc, align: 'right', fontWeight: '600'
                }
            ];

            // Left Panel (0 - 170mm)
            if (bucketCursor < panelBuckets.length) {
                const leftChunks = panelBuckets[bucketCursor++];
                buildPanelCategoryBlocks(face, 'left', leftChunks, fIdx * 2);

                const usedLeftH = leftChunks.reduce((acc, c, i) => acc + c.estHeight + (i > 0 ? 9 : 0), 18);
                if (usedLeftH <= 165) {
                    const photoY = Math.max(168, usedLeftH + 10);
                    const photoH = Math.min(114, 284 - photoY);
                    if (photoH >= 55) {
                        const pInfo = gourmetPhotos[(fIdx * 2) % gourmetPhotos.length];
                        face.objects.push({
                            id: `pho_l_f${fIdx}`,
                            type: 'photo',
                            name: 'Photo Illustration Gastronomique',
                            x: 12,
                            y: photoY,
                            w: 145,
                            h: photoH,
                            imageUrl: pInfo.url,
                            caption: pInfo.cap,
                            radius: 5,
                            borderColor: palette.frameBorder,
                            borderWidth: 1.5
                        });
                    }
                }
            }

            // Right Panel (170 - 340mm)
            if (bucketCursor < panelBuckets.length) {
                const rightChunks = panelBuckets[bucketCursor++];
                buildPanelCategoryBlocks(face, 'right', rightChunks, fIdx * 2 + 1);

                const usedRightH = rightChunks.reduce((acc, c, i) => acc + c.estHeight + (i > 0 ? 9 : 0), 18);
                if (usedRightH <= 165) {
                    const photoY = Math.max(168, usedRightH + 10);
                    const photoH = Math.min(114, 284 - photoY);
                    if (photoH >= 55) {
                        const pInfo = gourmetPhotos[(fIdx * 2 + 1) % gourmetPhotos.length];
                        face.objects.push({
                            id: `pho_r_f${fIdx}`,
                            type: 'photo',
                            name: 'Photo Illustration Gastronomique',
                            x: 182,
                            y: photoY,
                            w: 145,
                            h: photoH,
                            imageUrl: pInfo.url,
                            caption: pInfo.cap,
                            radius: 5,
                            borderColor: palette.frameBorder,
                            borderWidth: 1.5
                        });
                    }
                }
            }
        }

        return buildSummary();
    }
}
