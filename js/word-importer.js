/**
 * MODULE 1B: WordMenuImporter & AutoLayoutEngine
 */
class WordMenuImporter {
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
             */
            static parseText(rawText) {
                const lines = (rawText || '').split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
                const parsedDishes = [];
                let currentCategory = 'SÉLECTION DU CHEF';
                let counter = 1;

                const badgeRegex = /\[(NOUVEAU|NEW|CHEF|ETOILE|★)\]/i;
                const badgeGlobalRegex = /\[(NOUVEAU|NEW|CHEF|ETOILE|★)\]/gi;
                const priceWithCurrencySuffix = /(?:[.\-–—…|:]|\s)+(\d+(?:[.,]\d{1,2})?\s*(?:DH|DHS|MAD|€|EUR|CHF|FCFA|\$|£))\s*$/i;
                const priceWithCurrencyPrefix = /(?:[.\-–—…|:]|\s)+([$€£]\s*\d+(?:[.,]\d{1,2})?)\s*$/i;
                const priceWithSeparatorOnly = /(?:[.\-–—…|:\t]+|\s{2,})(\d{1,5}(?:[.,]\d{1,2})?)\s*$/;

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
                    if (matchLinePrice(cleaned)) return false;

                    const hasDigits = /\d/.test(cleaned);
                    const isAllCapsCategory = !hasDigits && cleaned.length >= 3 && cleaned.length <= 48 && cleaned === cleaned.toUpperCase() && !/^\[/.test(cleaned);
                    const isColonCategory = !hasDigits && cleaned.endsWith(':') && cleaned.length >= 3 && cleaned.length <= 48;
                    return isAllCapsCategory || isColonCategory;
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

                    // 2. Check if line contains a Badge and/or Dish + Price
                    let badge = '';
                    const badgeMatch = line.match(badgeRegex);
                    if (badgeMatch) {
                        const rawBadge = badgeMatch[1].toUpperCase();
                        badge = (rawBadge === 'NEW' || rawBadge === 'NOUVEAU') ? 'NOUVEAU' : 'CHEF';
                        line = line.replace(badgeGlobalRegex, '').trim();
                    }

                    const priceMatch = matchLinePrice(line);
                    if (priceMatch) {
                        let rawPrice = priceMatch[1].trim();
                        if (!/(DH|MAD|€|EUR|CHF|FCFA|\$|£)/i.test(rawPrice)) {
                            rawPrice += ' DH';
                        } else {
                            rawPrice = rawPrice.replace(/dhs?/i, 'DH').replace(/eur/i, '€').toUpperCase();
                        }

                        // Remove price and trailing separators from line
                        const contentPart = line.slice(0, priceMatch.index).replace(/[.\-–—…|:\s]+$/, '').trim();

                        // Split Name and Description by " - ", " – ", " : ", or " | "
                        let name = contentPart;
                        let desc = '';
                        const sepMatch = contentPart.match(/\s+(?:[-–—:|])\s+/);
                        if (sepMatch) {
                            name = contentPart.slice(0, sepMatch.index).trim();
                            desc = contentPart.slice(sepMatch.index + sepMatch[0].length).trim();
                        } else if (i + 1 < lines.length) {
                            // Look ahead: if next line has no price and isn't a category, treat it as description
                            const nextLine = lines[i + 1];
                            const nextCleaned = nextLine.replace(badgeGlobalRegex, '').trim();
                            const nextHasPrice = Boolean(matchLinePrice(nextCleaned));
                            if (!nextHasPrice && !isCategoryLine(nextLine)) {
                                desc = nextLine;
                                i++; // consume description line
                            }
                        }

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
             * Automatically flows categories across the 10 faces (or current face)
             * while strictly respecting:
             * - Left panel: X = 12mm to 158mm (safe from 10mm outer margin and 160mm fold safety zone)
             * - Right panel: X = 182mm to 328mm (safe from 180mm fold safety zone and 330mm outer margin)
             */
            static autoLayoutAcrossSpreads(engine, dishes, options = {}) {
                const themeKey = options.theme || 'bistro_warm';
                const brandTitle = options.brandTitle || 'GREY CORNER';
                const brandSub = options.brandSub || 'CAFÉ • RESTAURANT • SINCE 2024';
                const targetMode = options.mode || 'full_auto_spreads';

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

                const palette = themes[themeKey] || themes.bistro_warm;

                // Update Central Database first
                engine.dishesDB = JSON.parse(JSON.stringify(dishes));
                const categories = engine.getCategories();

                if (targetMode === 'db_only') {
                    return { mode: targetMode, totalCategories: categories.length, placedCount: 0, omittedCategories: [] };
                }

                // Split any oversized category into panel-sized chunks and pack chunks by real estimated mm height
                const maxPanelHeightMm = 264;
                const chunks = [];
                categories.forEach(catName => {
                    const catDishes = engine.getDishesByCategory(catName);
                    if (catDishes.length === 0) return;

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
                    omittedDishes: Math.max(0, engine.dishesDB.length - placedDishes)
                });

                // Helper to build a single panel's blocks (Left panel or Right panel)
                const buildPanelCategoryBlocks = (face, panelSide, chunkList, colorOffset) => {
                    const isLeft = panelSide === 'left';
                    const bannerX = isLeft ? 12 : 182;
                    const listX = isLeft ? 31 : 201;
                    const listW = 126; // Ends at 157mm (Left) or 327mm (Right) -> 100% safe from 160-180mm fold!

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
                    const activeFace = engine.faces[options.activeFaceIndex || 0];
                    activeFace.bgColor = palette.paperBg;
                    activeFace.objects = [
                        {
                            id: generateUniqueId(`bg_${activeFace.id}`), type: 'shape', name: 'Fond Papier (+3mm fond perdu)',
                            x: -3, y: -3, w: 346, h: 306,
                            bgColor: palette.paperBg, borderColor: 'transparent', borderWidth: 0, radius: 0, opacity: 1
                        }
                    ];

                    // Fill left panel then right panel up to available height
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
                // Face 0 (Sheet 1 Recto): Luxury Front Cover (Right Panel) + Suggestions & Info (Left Panel)
                const coverFace = engine.faces[0];
                coverFace.bgColor = palette.coverBg;
                const featuredDishes = dishes.filter(d => d.badge === 'NOUVEAU' || d.badge === 'CHEF').slice(0, 3);
                while (featuredDishes.length < 3 && dishes.length > featuredDishes.length) {
                    const candidate = dishes.find(d => !featuredDishes.includes(d));
                    if (!candidate) break;
                    featuredDishes.push(candidate);
                }

                coverFace.objects = [
                    {
                        id: 'cov_bleed_bg', type: 'shape', name: 'Fond Couverture (Fond perdu 3mm)',
                        x: -3, y: -3, w: 346, h: 306,
                        bgColor: palette.coverBg, borderColor: 'transparent', borderWidth: 0, radius: 0, opacity: 1
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
                        imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80',
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

                // Group chunks into panel buckets based on actual available vertical height (266mm)
                const panelBuckets = [];
                let currentBucket = [];
                let currentUsedH = 0;

                chunks.forEach(chunk => {
                    const neededWithGap = currentBucket.length > 0 ? chunk.estHeight + 9 : chunk.estHeight;
                    if (currentBucket.length > 0 && (currentUsedH + neededWithGap > 266 || currentBucket.length >= 2)) {
                        panelBuckets.push(currentBucket);
                        currentBucket = [chunk];
                        currentUsedH = chunk.estHeight;
                    } else {
                        currentBucket.push(chunk);
                        currentUsedH += neededWithGap;
                    }
                });
                if (currentBucket.length > 0) {
                    panelBuckets.push(currentBucket);
                }

                // Culinary photography pool for visual breathing room when a panel has room at bottom
                const gourmetPhotos = [
                    { url: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=900&q=80', cap: 'Nos Brunchs & Petits-Déjeuners préparés minute' },
                    { url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=900&q=80', cap: 'Sélection de viandes maturées et grillades au feu de bois' },
                    { url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=900&q=80', cap: 'Pizzas artisanales et pâtes fraîches maison' },
                    { url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=900&q=80', cap: 'Douceurs pâtissières & Mocktails rafraîchissants' }
                ];

                let bucketCursor = 0;
                for (let fIdx = 1; fIdx < 10; fIdx++) {
                    const face = engine.faces[fIdx];
                    face.bgColor = palette.paperBg;
                    const leftPageNum = fIdx * 2 - 1;
                    const rightPageNum = fIdx * 2;
                    face.objects = [
                        {
                            id: `bg_f${fIdx}`, type: 'shape', name: 'Fond Papier (+3mm fond perdu)',
                            x: -3, y: -3, w: 346, h: 306,
                            bgColor: palette.paperBg, borderColor: 'transparent', borderWidth: 0, radius: 0, opacity: 1
                        },
                        // Subtle running header on Left & Right panels
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
                    }

                    // Right Panel (170 - 340mm)
                    if (bucketCursor < panelBuckets.length) {
                        const rightChunks = panelBuckets[bucketCursor++];
                        buildPanelCategoryBlocks(face, 'right', rightChunks, fIdx * 2 + 1);

                        // Add an editorial gourmet photo below if enough vertical space remains
                        const usedRightH = rightChunks.reduce((acc, c, i) => acc + c.estHeight + (i > 0 ? 9 : 0), 18);
                        if (usedRightH <= 165) {
                            const photoY = Math.max(168, usedRightH + 10);
                            const photoH = Math.min(114, 284 - photoY);
                            if (photoH >= 55) {
                                const pInfo = gourmetPhotos[fIdx % gourmetPhotos.length];
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

        /**
         * ============================================================================
         * MODULE 3: PrintExporter
         * High-Resolution Canvas & PDF Exporter with Crop Marks (Traits de coupe),
         * Central Fold Marks (Traits de pli à 170 mm), Registration Marks, and 3mm Bleed.
         * ============================================================================
         */
        