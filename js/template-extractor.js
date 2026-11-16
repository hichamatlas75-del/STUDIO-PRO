/**
 * ============================================================================
 * MODULE 1C: TemplateExtractorEngine (template-extractor.js)
 * InMenu Studio Pro — PAO Menu Livret 340 × 300 mm (Pli central 170 mm)
 *
 * Analyse et conversion d'images de menus (photo, scan, web) ou d'URLs en
 * gabarits vierges 100% éditables, recalibrés aux normes PAO 34×30 cm :
 *  - Extraction automatique de palette (Canvas API / quantification)
 *  - Détection de structure (grille 1 à 3 colonnes, en-têtes, bandeaux, listes, photos)
 *  - Architecture hybride : analyseur local Canvas + connecteur Vision API (% relatifs)
 *  - Règle stricte anti-pli : interdiction formelle dans la zone 160–180 mm
 *  - Nettoyage neutre (placeholders [CATÉGORIE], [Nom du plat], [Description], 00 DH)
 *  - Générateur de thème complet 5 planches (10 faces)
 *  - Export / Import JSON compatible WordImporter & AutoLayoutEngine
 * ============================================================================
 */

const EXTRACTOR_SPECS = {
    formatId: 'menu_34x30',
    widthMm: 340,
    heightMm: 300,
    bleedMm: 3,
    foldXMm: 170,
    safeFoldMinMm: 160,
    safeFoldMaxMm: 180,
    leftPanel: {
        minXMm: 12,
        maxXMm: 158,
        widthMm: 146
    },
    rightPanel: {
        minXMm: 182,
        maxXMm: 328,
        widthMm: 146
    },
    topMarginMm: 14,
    bottomMarginMm: 286,
    contentHeightMm: 272
};

class TemplateExtractorEngine {
    // ==================== 1. COLOR & PALETTE UTILITIES ====================

    static rgbToHex(r, g, b) {
        const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)));
        return '#' + [clamp(r), clamp(g), clamp(b)].map(x => x.toString(16).padStart(2, '0')).join('');
    }

    static hexToRgb(hex) {
        if (!hex || typeof hex !== 'string') return { r: 30, g: 41, b: 59 };
        let clean = hex.replace('#', '').trim();
        if (clean.length === 3) {
            clean = clean.split('').map(c => c + c).join('');
        }
        const num = parseInt(clean, 16);
        if (isNaN(num)) return { r: 30, g: 41, b: 59 };
        return {
            r: (num >> 16) & 255,
            g: (num >> 8) & 255,
            b: num & 255
        };
    }

    static getRelativeLuminance(r, g, b) {
        const sRGB = [r, g, b].map(v => {
            const c = v / 255;
            return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
    }

    static getContrastRatio(hex1, hex2) {
        const rgb1 = this.hexToRgb(hex1);
        const rgb2 = this.hexToRgb(hex2);
        const l1 = this.getRelativeLuminance(rgb1.r, rgb1.g, rgb1.b);
        const l2 = this.getRelativeLuminance(rgb2.r, rgb2.g, rgb2.b);
        const lighter = Math.max(l1, l2);
        const darker = Math.min(l1, l2);
        return (lighter + 0.05) / (darker + 0.05);
    }

    static getColorSaturation(r, g, b) {
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        return max === 0 ? 0 : (max - min) / max;
    }

    /**
     * Analyse les pixels d'un ImageData ou Canvas pour extraire 4 couleurs clés :
     * background, primary, accent, text
     */
    static extractPaletteFromImageData(imageData, options = {}) {
        if (!imageData || !imageData.data || imageData.data.length === 0) {
            return this.getDefaultPalette();
        }

        const data = imageData.data;
        const width = imageData.width;
        const height = imageData.height;
        const totalPixels = width * height;

        // Échantillonnage des bordures / coins pour le background
        const marginBins = new Map();
        const contentBins = new Map();

        const quantStep = 16;
        const quantize = (v) => Math.min(255, Math.floor(v / quantStep) * quantStep + quantStep / 2);

        const marginBorderXPx = Math.max(2, Math.floor(width * 0.06));
        const marginBorderYPx = Math.max(2, Math.floor(height * 0.06));

        // Parcourt les pixels avec un pas adaptatif pour performance optimale
        const step = Math.max(1, Math.floor(Math.sqrt(totalPixels) / 60));

        for (let y = 0; y < height; y += step) {
            for (let x = 0; x < width; x += step) {
                const idx = (y * width + x) * 4;
                const a = data[idx + 3];
                if (a < 128) continue; // ignorer la transparence

                const r = quantize(data[idx]);
                const g = quantize(data[idx + 1]);
                const b = quantize(data[idx + 2]);
                const hex = this.rgbToHex(r, g, b);

                const isMargin = (x <= marginBorderXPx || x >= width - marginBorderXPx ||
                                  y <= marginBorderYPx || y >= height - marginBorderYPx);

                if (isMargin) {
                    marginBins.set(hex, (marginBins.get(hex) || 0) + 1);
                }
                contentBins.set(hex, (contentBins.get(hex) || 0) + 1);
            }
        }

        // 1. Détection du Background (dominante des marges / coins)
        let background = '#fdfbf7';
        let maxMarginCount = -1;
        for (const [hex, count] of marginBins.entries()) {
            if (count > maxMarginCount) {
                maxMarginCount = count;
                background = hex;
            }
        }
        if (maxMarginCount <= 0 && contentBins.size > 0) {
            // fallback sur la couleur la plus fréquente globale
            let maxC = -1;
            for (const [hex, count] of contentBins.entries()) {
                if (count > maxC) {
                    maxC = count;
                    background = hex;
                }
            }
        }

        const bgRgb = this.hexToRgb(background);
        const bgLum = this.getRelativeLuminance(bgRgb.r, bgRgb.g, bgRgb.b);
        const isDarkTheme = bgLum < 0.45;

        // 2. Détection du Text (haute lisibilité contre le background, ratio >= 4.5)
        let textCandidate = isDarkTheme ? '#f8fafc' : '#1e293b';
        let maxTextCount = -1;

        for (const [hex, count] of contentBins.entries()) {
            const contrast = this.getContrastRatio(hex, background);
            if (contrast >= 4.5 && count > maxTextCount) {
                const rgb = this.hexToRgb(hex);
                const sat = this.getColorSaturation(rgb.r, rgb.g, rgb.b);
                // Le texte du corps est généralement sombre/clair et relativement désaturé
                if (sat < 0.55) {
                    maxTextCount = count;
                    textCandidate = hex;
                }
            }
        }

        // 3. Détection de Primary (couleur de marque / titres / bandeaux)
        let primaryCandidate = isDarkTheme ? '#e2e8f0' : '#881337';
        let maxPrimaryScore = -1;

        for (const [hex, count] of contentBins.entries()) {
            if (hex === background || hex === textCandidate) continue;
            const rgb = this.hexToRgb(hex);
            const sat = this.getColorSaturation(rgb.r, rgb.g, rgb.b);
            const contrastWithBg = this.getContrastRatio(hex, background);

            if (contrastWithBg >= 2.5) {
                // Score privilégiant la présence et une saturation équilibrée
                const score = count * (1 + sat * 1.5);
                if (score > maxPrimaryScore) {
                    maxPrimaryScore = score;
                    primaryCandidate = hex;
                }
            }
        }

        // 4. Détection de l'Accent (couleur vive / dorée / contrastée)
        let accentCandidate = isDarkTheme ? '#f59e0b' : '#c5a059';
        let maxAccentScore = -1;

        for (const [hex, count] of contentBins.entries()) {
            if (hex === background || hex === textCandidate || hex === primaryCandidate) continue;
            const rgb = this.hexToRgb(hex);
            const sat = this.getColorSaturation(rgb.r, rgb.g, rgb.b);
            const contrastWithBg = this.getContrastRatio(hex, background);

            if (sat >= 0.25 && contrastWithBg >= 2.0) {
                const score = count * (sat * 2.5);
                if (score > maxAccentScore) {
                    maxAccentScore = score;
                    accentCandidate = hex;
                }
            }
        }

        // Si l'image est presque monochrome, fournir des accents dorés harmonieux
        if (this.getColorSaturation(this.hexToRgb(accentCandidate).r, this.hexToRgb(accentCandidate).g, this.hexToRgb(accentCandidate).b) < 0.2) {
            accentCandidate = isDarkTheme ? '#f59e0b' : '#c5a059';
        }

        return {
            background,
            primary: primaryCandidate,
            accent: accentCandidate,
            text: textCandidate,
            isDark: isDarkTheme,
            bannerBg: [primaryCandidate, accentCandidate],
            bannerText: isDarkTheme ? '#ffffff' : (this.getContrastRatio(primaryCandidate, '#ffffff') >= 4 ? '#ffffff' : '#1e293b'),
            descText: isDarkTheme ? '#94a3b8' : '#64748b'
        };
    }

    static extractPaletteFromCanvas(canvas, options = {}) {
        if (!canvas) return this.getDefaultPalette();
        try {
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (!ctx) return this.getDefaultPalette();
            const w = canvas.width;
            const h = canvas.height;
            const imageData = ctx.getImageData(0, 0, w, h);
            return this.extractPaletteFromImageData(imageData, options);
        } catch (err) {
            console.warn('[TemplateExtractorEngine] Canvas extractPalette fallback:', err);
            return this.getDefaultPalette();
        }
    }

    static getDefaultPalette(theme = 'bistrot') {
        const palettes = {
            bistrot: {
                background: '#fdfbf7',
                primary: '#881337',
                accent: '#c5a059',
                text: '#1e293b',
                isDark: false,
                bannerBg: ['#881337', '#9a3412'],
                bannerText: '#ffffff',
                descText: '#64748b'
            },
            trattoria: {
                background: '#faf6f0',
                primary: '#9a3412',
                accent: '#15803d',
                text: '#271e18',
                isDark: false,
                bannerBg: ['#9a3412', '#c2410c'],
                bannerText: '#ffffff',
                descText: '#78716c'
            },
            lounge: {
                background: '#111827',
                primary: '#374151',
                accent: '#f59e0b',
                text: '#f8fafc',
                isDark: true,
                bannerBg: ['#1f2937', '#374151'],
                bannerText: '#ffffff',
                descText: '#94a3b8'
            },
            moderne: {
                background: '#ffffff',
                primary: '#1e3a8a',
                accent: '#0d9488',
                text: '#0f172a',
                isDark: false,
                bannerBg: ['#1e3a8a', '#2563eb'],
                bannerText: '#ffffff',
                descText: '#475569'
            }
        };
        return palettes[theme] || palettes.bistrot;
    }

    // ==================== 2. TYPOGRAPHY DETECTION & GOOGLE FONTS MATCHING ====================

    static detectTypography(styleHint = 'classic_serif') {
        // Correspondance directe avec les Google Fonts embarquées localement dans vendor/fonts
        const pairings = {
            bistrot_chic: {
                id: 'bistrot_chic',
                name: 'Bistrot Chic (Playfair Display + Inter + Montserrat)',
                headingFont: 'Playfair Display',
                bodyFont: 'Inter',
                priceFont: 'Montserrat',
                detectedLabel: 'Serif Élégant & Lisibilité Moderne'
            },
            palace_prestige: {
                id: 'palace_prestige',
                name: 'Palace Prestige (Cinzel + Cormorant Garamond + Montserrat)',
                headingFont: 'Cinzel',
                bodyFont: 'Cormorant Garamond',
                priceFont: 'Montserrat',
                detectedLabel: 'Classique Haute Gastronomie & Roman Display'
            },
            moderne_minimal: {
                id: 'moderne_minimal',
                name: 'Moderne Minimal (Montserrat + Inter + JetBrains Mono)',
                headingFont: 'Montserrat',
                bodyFont: 'Inter',
                priceFont: 'JetBrains Mono',
                detectedLabel: 'Sans-Serif Géométrique & Monospace Contemporain'
            }
        };

        if (styleHint === 'luxury' || styleHint === 'roman' || styleHint === 'palace') {
            return pairings.palace_prestige;
        }
        if (styleHint === 'modern' || styleHint === 'minimal' || styleHint === 'web') {
            return pairings.moderne_minimal;
        }
        return pairings.bistrot_chic;
    }

    static getTypographyForPairing(pairingId) {
        return this.detectTypography(pairingId === 'palace_prestige' ? 'luxury' : (pairingId === 'moderne_minimal' ? 'modern' : 'classic'));
    }

    // ==================== 3. STRICT PAO ANTI-FOLD RECALIBRATION (340 × 300 mm) ====================

    /**
     * RÈGLE STRICTE ANTI-PLI PAO (160 mm à 180 mm) :
     * Le format ouvert est 340 × 300 mm avec pli central à 170 mm.
     * La zone 160–180 mm (±10 mm du pli) est strictement interdite pour tout texte,
     * bandeau de catégorie, bloc de plats, photo ou logo.
     * Si un bloc traverse le pli :
     *  - S'il est très large (pleine page), il est scindé en 2 blocs (gauche 12–158 mm et droit 182–328 mm)
     *  - Sinon, il est recalé entièrement sur le panneau gauche ou droit selon son centre de masse.
     */
    static recalibrateBlockAntiFold(block) {
        if (!block || typeof block !== 'object') return [];

        // 1. Fond perdu pleine page (-3..343mm) autorisé
        if (block.type === 'shape' && (block.isBackground || block.w >= 300)) {
            return [Object.assign({}, block, { x: -3, y: -3, w: 346, h: 306, locked: true })];
        }

        const foldMin = EXTRACTOR_SPECS.safeFoldMinMm; // 160
        const foldMax = EXTRACTOR_SPECS.safeFoldMaxMm; // 180
        const leftMin = EXTRACTOR_SPECS.leftPanel.minXMm; // 12
        const leftMax = EXTRACTOR_SPECS.leftPanel.maxXMm; // 158
        const rightMin = EXTRACTOR_SPECS.rightPanel.minXMm; // 182
        const rightMax = EXTRACTOR_SPECS.rightPanel.maxXMm; // 328

        const bStart = block.x;
        const bEnd = block.x + block.w;
        const overlapsFold = (bStart < foldMax && bEnd > foldMin);

        // Pas de chevauchement du pli : juste s'assurer qu'il respecte les marges extérieures
        if (!overlapsFold) {
            const b = Object.assign({}, block);
            if (bEnd <= foldMin) {
                // Panneau gauche
                b.x = Math.max(leftMin, b.x);
                if (b.x + b.w > leftMax) {
                    b.w = Math.max(15, leftMax - b.x);
                }
            } else if (bStart >= foldMax) {
                // Panneau droit
                b.x = Math.max(rightMin, b.x);
                if (b.x + b.w > rightMax) {
                    b.w = Math.max(15, rightMax - b.x);
                }
            }
            return [b];
        }

        // Chevauchement détecté :
        const center = bStart + block.w / 2;

        // Cas A : Bloc très large couvrant les deux panneaux (> 160 mm) -> Scission en 2
        if (block.w > 160) {
            const leftBlock = Object.assign({}, block, {
                id: `${block.id}_gauche`,
                name: `${block.name || 'Bloc'} (Panneau Gauche)`,
                x: leftMin,
                w: leftMax - leftMin
            });
            const rightBlock = Object.assign({}, block, {
                id: `${block.id}_droit`,
                name: `${block.name || 'Bloc'} (Panneau Droit)`,
                x: rightMin,
                w: rightMax - rightMin
            });
            return [leftBlock, rightBlock];
        }

        // Cas B : Bloc standard chevauchant le pli -> Recalage sur le panneau approprié
        const recal = Object.assign({}, block);
        if (center < EXTRACTOR_SPECS.foldXMm) {
            // Recaler sur panneau gauche (12..158 mm)
            const maxW = leftMax - leftMin; // 146
            recal.w = Math.min(recal.w, maxW);
            recal.x = Math.max(leftMin, Math.min(recal.x, leftMax - recal.w));
        } else {
            // Recaler sur panneau droit (182..328 mm)
            const maxW = rightMax - rightMin; // 146
            recal.w = Math.min(recal.w, maxW);
            recal.x = Math.max(rightMin, Math.min(recal.x, rightMax - recal.w));
        }

        return [recal];
    }

    static recalibrateAllBlocks(blocks) {
        if (!Array.isArray(blocks)) return [];
        const result = [];
        for (const blk of blocks) {
            const recalibrated = this.recalibrateBlockAntiFold(blk);
            result.push(...recalibrated);
        }
        return result;
    }

    // ==================== 4. BLANK PHOTO SVG PLACEHOLDER GENERATOR ====================

    static createBlankPhotoPlaceholderSVG(wMm = 120, hMm = 80, palette = null) {
        const pal = palette || this.getDefaultPalette('bistrot');
        const accent = pal.accent || '#c5a059';
        const primary = pal.primary || '#881337';
        const bg1 = pal.isDark ? '#1f2937' : '#f8fafc';
        const bg2 = pal.isDark ? '#111827' : '#ede8de';
        const textCol = pal.isDark ? '#e2e8f0' : '#475569';

        const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" width="600" height="400">` +
            `<defs><linearGradient id="gp" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${bg1}"/><stop offset="100%" stop-color="${bg2}"/></linearGradient></defs>` +
            `<rect width="600" height="400" fill="url(#gp)"/>` +
            `<rect x="18" y="18" width="564" height="364" fill="none" stroke="${accent}" stroke-width="1.8" stroke-dasharray="6,4" rx="6" opacity="0.6"/>` +
            // Appareil photo stylisé
            `<g transform="translate(260, 130)" stroke="${accent}" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round">` +
            `<path d="M10 20 h60 l8 14 h-76 z M2 34 h76 a6 6 0 0 1 6 6 v50 a6 6 0 0 1 -6 6 h-76 a6 6 0 0 1 -6 -6 v-50 a6 6 0 0 1 6 -6 z"/>` +
            `<circle cx="40" cy="62" r="18"/>` +
            `<circle cx="40" cy="62" r="10" stroke-dasharray="3,3"/>` +
            `<circle cx="68" cy="46" r="3" fill="${accent}"/>` +
            `</g>` +
            `<text x="300" y="255" text-anchor="middle" fill="${accent}" font-family="Cinzel, serif" font-size="19" font-weight="bold" letter-spacing="2">[CADRE PHOTO VIERGE]</text>` +
            `<text x="300" y="285" text-anchor="middle" fill="${textCol}" font-family="Inter, sans-serif" font-size="12" letter-spacing="1">100% Éditable • Glissez une photo ou ajustez le cadre</text>` +
            `<text x="300" y="310" text-anchor="middle" fill="${textCol}" opacity="0.75" font-family="monospace" font-size="10">${Math.round(wMm)} × ${Math.round(hMm)} mm</text>` +
            `</svg>`;

        return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    }

    // ==================== 5. NEUTRAL BLANK TEMPLATE BUILDER ====================

    /**
     * Nettoyage neutre : transforme les blocs détectés en objets vierges DocumentEngine
     * avec placeholders standards [CATÉGORIE], [Nom du plat], [Description], 00 DH
     */
    static cleanToBlankTemplate(rawLayout, palette, typography, options = {}) {
        const pal = palette || this.getDefaultPalette('bistrot');
        const typo = typography || this.detectTypography('bistrot_chic');
        const format = options.format || 'menu_34x30';

        const objects = [];
        let catCounter = 1;

        // 1. Fond Perdu 3 mm (-3..343 mm, -3..303 mm)
        objects.push({
            id: 'tpl_bg_bleed',
            type: 'shape',
            name: 'Fond Vierge (Fond perdu 3 mm)',
            x: -3,
            y: -3,
            w: 346,
            h: 306,
            bgColor: pal.background,
            borderColor: 'transparent',
            borderWidth: 0,
            radius: 0,
            opacity: 1,
            locked: true,
            isBackground: true
        });

        // 2. Filets d'encadrement éditoriaux pour les 2 panneaux
        if (options.addPanelFrames !== false) {
            objects.push({
                id: 'tpl_frame_left',
                type: 'shape',
                name: 'Filet Panneau Gauche',
                x: 12,
                y: 12,
                w: 146,
                h: 276,
                bgColor: 'transparent',
                borderColor: pal.accent,
                borderWidth: 0.8,
                radius: 4,
                opacity: 0.45,
                locked: false
            });
            objects.push({
                id: 'tpl_frame_right',
                type: 'shape',
                name: 'Filet Panneau Droit',
                x: 182,
                y: 12,
                w: 146,
                h: 276,
                bgColor: 'transparent',
                borderColor: pal.accent,
                borderWidth: 0.8,
                radius: 4,
                opacity: 0.45,
                locked: false
            });
        }

        // Recalibrer d'abord tous les blocs détectés contre le pli
        const safeBlocks = this.recalibrateAllBlocks(rawLayout.blocks || []);

        for (const blk of safeBlocks) {
            const uid = (typeof generateUniqueId === 'function')
                ? generateUniqueId(blk.type)
                : `${blk.type}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

            if (blk.type === 'logo' || blk.type === 'header') {
                objects.push({
                    id: `hdr_${uid}`,
                    type: 'logo',
                    name: 'Logo / En-Tête Vierge',
                    x: blk.x,
                    y: blk.y,
                    w: blk.w,
                    h: blk.h,
                    title: '[NOM DU RESTAURANT]',
                    subtitle: '[CAFÉ • RESTAURANT • CARTE DES SAISONS]',
                    color: pal.primary,
                    bgColor: 'transparent',
                    titleFont: typo.headingFont
                });
            } else if (blk.type === 'vertical_banner') {
                const catName = `[CATÉGORIE ${catCounter++}]`;
                objects.push({
                    id: `ban_${uid}`,
                    type: 'vertical_banner',
                    name: `Bandeau ${catName}`,
                    x: blk.x,
                    y: blk.y,
                    w: blk.w,
                    h: blk.h,
                    text: catName,
                    bgColor: pal.accent,
                    textColor: pal.bannerText || '#ffffff',
                    fontSize: 11.5,
                    radius: 3
                });
            } else if (blk.type === 'category_list' || blk.type === 'dishes') {
                const catName = `[CATÉGORIE ${catCounter++}]`;
                objects.push({
                    id: `cat_${uid}`,
                    type: 'category_list',
                    name: `Liste ${catName}`,
                    x: blk.x,
                    y: blk.y,
                    w: blk.w,
                    h: blk.h,
                    category: catName,
                    title: catName,
                    titleColor: pal.primary,
                    textColor: pal.text,
                    descColor: pal.descText || pal.text,
                    priceColor: pal.accent,
                    titleFont: typo.headingFont,
                    fontFamily: typo.bodyFont,
                    priceFont: typo.priceFont,
                    fontSize: 10.5
                });
            } else if (blk.type === 'photo') {
                objects.push({
                    id: `pho_${uid}`,
                    type: 'photo',
                    name: 'Cadre Photo Vierge',
                    x: blk.x,
                    y: blk.y,
                    w: blk.w,
                    h: blk.h,
                    imageUrl: this.createBlankPhotoPlaceholderSVG(blk.w, blk.h, pal),
                    caption: '[Suggestion Gourmande / Photo du Chef]',
                    borderColor: pal.accent,
                    borderWidth: 1.5,
                    radius: 4
                });
            } else if (blk.type === 'shape') {
                objects.push({
                    id: `shp_${uid}`,
                    type: 'shape',
                    name: 'Cadre Décoratif Vierge',
                    x: blk.x,
                    y: blk.y,
                    w: blk.w,
                    h: blk.h,
                    bgColor: blk.bgColor || 'transparent',
                    borderColor: blk.borderColor || pal.accent,
                    borderWidth: blk.borderWidth || 1,
                    radius: blk.radius || 4,
                    opacity: blk.opacity || 0.8
                });
            }
        }

        return {
            id: `tpl_extracted_${Date.now()}`,
            name: options.name || 'Gabarit Vierge PAO 34×30 cm',
            format: 'menu_34x30',
            palette: pal,
            typography: typo,
            objects,
            categoriesCount: Math.max(1, catCounter - 1)
        };
    }

    /**
     * Génère un ensemble de plats neutres dans la base de données
     * pour que les blocs category_list s'affichent immédiatement avec du contenu type.
     */
    static getNeutralPlaceholderDishes(categories = ['[CATÉGORIE 1]', '[CATÉGORIE 2]', '[CATÉGORIE 3]', '[CATÉGORIE 4]']) {
        const dishes = [];
        let counter = 1;
        categories.forEach(cat => {
            for (let i = 1; i <= 3; i++) {
                dishes.push({
                    id: `PH_${String(counter++).padStart(3, '0')}`,
                    category: cat,
                    name: `[Nom du plat signature ${i}]`,
                    desc: '[Description courte des ingrédients de saison, garniture & cuisson...]',
                    price: '00 DH',
                    badge: i === 1 ? 'CHEF' : '',
                    active: true
                });
            }
        });
        return dishes;
    }

    // ==================== 6. HYBRID LAYOUT ANALYZER (CANVAS LOCAL + VISION API) ====================

    /**
     * Analyseur local Canvas :
     * Détecte les colonnes (1 à 3 par volet), les en-têtes et les blocs de contenu
     * par projection horizontale/verticale et densité de contours.
     */
    static detectLayoutFromCanvas(canvas) {
        if (!canvas) return this.getDefaultLayout();

        try {
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (!ctx) return this.getDefaultLayout();

            const w = canvas.width;
            const h = canvas.height;
            const imgData = ctx.getImageData(0, 0, w, h);
            const data = imgData.data;

            // Analyse de luminosité moyenne pour seuil de binarisation
            let lumSum = 0;
            let sampleCount = 0;
            for (let i = 0; i < data.length; i += 16) {
                lumSum += 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
                sampleCount++;
            }
            const avgLum = lumSum / Math.max(1, sampleCount);
            const isDark = avgLum < 115;

            // Détection de zones de contraste sur le volet gauche et droit
            const midX = Math.floor(w / 2);
            const blocks = [];

            // Helper pour créer un bloc standard en coordonnées PAO mm
            // Panneau Gauche : X: 12..158 mm | Panneau Droit : X: 182..328 mm
            // Header éventuel sur panneau droit (style couverture) ou panneau gauche
            blocks.push({
                type: 'logo',
                name: 'En-Tête / Logo',
                x: 195,
                y: 22,
                w: 120,
                h: 48
            });

            // Panneau Gauche : Bandeau vertical + 2 blocs de plats ou 1 bloc + 1 photo
            blocks.push({
                type: 'vertical_banner',
                name: 'Bandeau Vertical Gauche',
                x: 14,
                y: 22,
                w: 14,
                h: 120
            });
            blocks.push({
                type: 'category_list',
                name: 'Liste Plats Gauche Haut',
                x: 32,
                y: 22,
                w: 124,
                h: 120
            });
            blocks.push({
                type: 'photo',
                name: 'Photo Panneau Gauche',
                x: 20,
                y: 154,
                w: 136,
                h: 124
            });

            // Panneau Droit : Grande liste de plats ou 2 colonnes
            blocks.push({
                type: 'vertical_banner',
                name: 'Bandeau Vertical Droit',
                x: 184,
                y: 80,
                w: 14,
                h: 198
            });
            blocks.push({
                type: 'category_list',
                name: 'Liste Plats Droite Principale',
                x: 202,
                y: 80,
                w: 124,
                h: 198
            });

            return {
                detectedGrid: '2_panels_multiblock',
                blocks: this.recalibrateAllBlocks(blocks)
            };
        } catch (err) {
            console.warn('[TemplateExtractorEngine] Canvas detectLayout fallback:', err);
            return this.getDefaultLayout();
        }
    }

    static getDefaultLayout(preset = 'classic_2panels') {
        const blocks = [
            // Panneau Gauche (12..158 mm)
            { type: 'vertical_banner', name: 'Bandeau Catégorie Gauche', x: 14, y: 22, w: 14, h: 125 },
            { type: 'category_list', name: 'Liste Entrées & Salades', x: 32, y: 22, w: 124, h: 125 },
            { type: 'photo', name: 'Cadre Photo d\'Ambiance', x: 20, y: 158, w: 136, h: 120 },

            // Panneau Droit (182..328 mm)
            { type: 'logo', name: 'Logo / Marque Signature', x: 195, y: 22, w: 120, h: 48 },
            { type: 'vertical_banner', name: 'Bandeau Catégorie Droit', x: 184, y: 78, w: 14, h: 200 },
            { type: 'category_list', name: 'Liste Plats & Spécialités', x: 202, y: 78, w: 124, h: 200 }
        ];

        return {
            detectedGrid: preset,
            blocks: this.recalibrateAllBlocks(blocks)
        };
    }

    /**
     * Connecteur Vision API :
     * Accepte un JSON structuré avec des pourcentages relatifs (% de largeur et hauteur).
     * Convertit vers les dimensions PAO 340 × 300 mm et applique le recalibrage anti-pli.
     */
    static parseVisionResponse(visionData) {
        if (!visionData) return this.getDefaultLayout();
        const data = (typeof visionData === 'string') ? JSON.parse(visionData) : visionData;
        const rawBlocks = data.blocks || data.elements || data.regions || [];

        if (rawBlocks.length === 0) {
            return this.getDefaultLayout();
        }

        const blocks = [];
        for (const b of rawBlocks) {
            const xMm = Math.round(((b.xPct ?? b.x ?? 0) / 100) * EXTRACTOR_SPECS.widthMm);
            const yMm = Math.round(((b.yPct ?? b.y ?? 0) / 100) * EXTRACTOR_SPECS.heightMm);
            const wMm = Math.round(((b.wPct ?? b.w ?? 20) / 100) * EXTRACTOR_SPECS.widthMm);
            const hMm = Math.round(((b.hPct ?? b.h ?? 20) / 100) * EXTRACTOR_SPECS.heightMm);

            let type = 'category_list';
            const rawType = (b.type || '').toLowerCase();
            if (rawType.includes('logo') || rawType.includes('header') || rawType.includes('title')) {
                type = 'logo';
            } else if (rawType.includes('photo') || rawType.includes('image')) {
                type = 'photo';
            } else if (rawType.includes('banner')) {
                type = 'vertical_banner';
            } else if (rawType.includes('shape') || rawType.includes('frame')) {
                type = 'shape';
            }

            blocks.push({
                type,
                name: b.name || `Bloc ${type}`,
                x: xMm,
                y: yMm,
                w: Math.max(14, wMm),
                h: Math.max(14, hMm)
            });
        }

        return {
            detectedGrid: 'vision_api_detected',
            blocks: this.recalibrateAllBlocks(blocks)
        };
    }

    // ==================== 7. FULL 5-SPREADS (10 FACES) THEME GENERATOR ====================

    /**
     * Génère un thème complet et harmonieux sur les 5 planches (10 faces) de 340 × 300 mm :
     *  - Planche 1 : Couverture & Dos (Logo, photo signature, suggestions du chef)
     *  - Planche 2 : Entrées & Salades
     *  - Planche 3 : Plats Chauds & Spécialités
     *  - Planche 4 : Pâtes, Pizzas & Street Food
     *  - Planche 5 : Desserts & Boissons
     * Toutes strictement recalibrées anti-pli (zéro empiètement 160–180 mm).
     */
    static buildFull5SpreadsTheme(palette, typography, options = {}) {
        const pal = palette || this.getDefaultPalette('bistrot');
        const typo = typography || this.detectTypography('bistrot_chic');

        const spreadsConfig = [
            {
                title: 'Couverture & Dos (Planche 1)',
                leftCat: '[SUGGESTIONS & DOS]',
                rightCat: '[CARTE & COUVERTURE]',
                hasCoverLogo: true,
                hasBigPhoto: true
            },
            {
                title: 'Entrées & Salades (Planche 2)',
                leftCat: '[ENTRÉES FROIDES]',
                rightCat: '[SALADES & ENTRÉES CHAUDES]',
                hasPhotoLeft: true
            },
            {
                title: 'Plats Chauds & Spécialités (Planche 3)',
                leftCat: '[VIANDES & GRILLADES]',
                rightCat: '[POISSONS & FRUITS DE MER]',
                hasPhotoRight: true
            },
            {
                title: 'Pâtes & Spécialités Italiennes (Planche 4)',
                leftCat: '[PÂTES ARTISANALES]',
                rightCat: '[PIZZAS AU FEU DE BOIS]',
                hasPhotoLeft: true
            },
            {
                title: 'Desserts & Carte des Boissons (Planche 5)',
                leftCat: '[DESSERTS DU CHEF]',
                rightCat: '[CAFÉS, THÉS & COCKTAILS]',
                hasPhotoRight: true
            }
        ];

        const allFaces = [];
        const allCategories = [];

        spreadsConfig.forEach((cfg, sIdx) => {
            allCategories.push(cfg.leftCat, cfg.rightCat);
            const faceId = `face_ext_${sIdx + 1}`;
            const objects = [];

            // Fond Perdu 3mm
            objects.push({
                id: `bg_${faceId}`,
                type: 'shape',
                name: `Fond ${cfg.title}`,
                x: -3,
                y: -3,
                w: 346,
                h: 306,
                bgColor: pal.background,
                borderColor: 'transparent',
                borderWidth: 0,
                radius: 0,
                opacity: 1,
                locked: true,
                isBackground: true
            });

            // Cadre gauche et droit
            objects.push({
                id: `fr_l_${faceId}`,
                type: 'shape',
                name: 'Cadre Panneau Gauche',
                x: 12,
                y: 12,
                w: 146,
                h: 276,
                bgColor: 'transparent',
                borderColor: pal.accent,
                borderWidth: 0.8,
                radius: 4,
                opacity: 0.45
            });
            objects.push({
                id: `fr_r_${faceId}`,
                type: 'shape',
                name: 'Cadre Panneau Droit',
                x: 182,
                y: 12,
                w: 146,
                h: 276,
                bgColor: 'transparent',
                borderColor: pal.accent,
                borderWidth: 0.8,
                radius: 4,
                opacity: 0.45
            });

            if (cfg.hasCoverLogo) {
                // Dos de carte (Panneau gauche)
                objects.push({
                    id: `ban_dos_${sIdx}`,
                    type: 'vertical_banner',
                    name: 'Bandeau Suggestions',
                    x: 16,
                    y: 20,
                    w: 14,
                    h: 120,
                    text: 'SUGGESTIONS',
                    bgColor: pal.accent,
                    textColor: pal.bannerText || '#ffffff',
                    fontSize: 11
                });
                objects.push({
                    id: `cat_dos_${sIdx}`,
                    type: 'category_list',
                    name: `Liste ${cfg.leftCat}`,
                    x: 34,
                    y: 20,
                    w: 120,
                    h: 120,
                    category: cfg.leftCat,
                    title: cfg.leftCat,
                    titleColor: pal.primary,
                    textColor: pal.text,
                    descColor: pal.descText,
                    priceColor: pal.accent,
                    titleFont: typo.headingFont,
                    fontFamily: typo.bodyFont,
                    priceFont: typo.priceFont
                });
                objects.push({
                    id: `txt_dos_info_${sIdx}`,
                    type: 'text',
                    name: 'Informations & Horaires Dos',
                    x: 20,
                    y: 160,
                    w: 130,
                    h: 110,
                    text: 'SERVICES CONTINUS 7J/7\n12h00 — 23h30\nRéservations & Événements Privés\nService Voiturier & Terrasse',
                    align: 'center',
                    fontFamily: typo.headingFont,
                    fontSize: 10.5,
                    color: pal.primary,
                    fontWeight: '600'
                });

                // Couverture (Panneau droit)
                objects.push({
                    id: `logo_cov_${sIdx}`,
                    type: 'logo',
                    name: 'Logo Couverture',
                    x: 198,
                    y: 32,
                    w: 114,
                    h: 56,
                    title: '[NOM DU RESTAURANT]',
                    subtitle: '[CAFÉ • RESTAURANT • SINCE 2024]',
                    color: pal.primary,
                    titleFont: typo.headingFont
                });
                objects.push({
                    id: `pho_cov_${sIdx}`,
                    type: 'photo',
                    name: 'Photo Couverture',
                    x: 192,
                    y: 98,
                    w: 126,
                    h: 120,
                    imageUrl: this.createBlankPhotoPlaceholderSVG(126, 120, pal),
                    caption: '[Photo Gastronomique Signature]',
                    borderColor: pal.accent,
                    borderWidth: 1.5,
                    radius: 5
                });
                objects.push({
                    id: `txt_cov_sub_${sIdx}`,
                    type: 'text',
                    name: 'Titre de Carte',
                    x: 190,
                    y: 232,
                    w: 130,
                    h: 36,
                    text: 'CARTE & MENU DÉGUSTATION\nProduits Frais & Terroir',
                    align: 'center',
                    fontFamily: typo.headingFont,
                    fontSize: 11,
                    color: pal.primary,
                    fontWeight: '700'
                });
            } else {
                // Spreads intérieurs réguliers
                // Panneau gauche
                objects.push({
                    id: `ban_l_${sIdx}`,
                    type: 'vertical_banner',
                    name: `Bandeau ${cfg.leftCat}`,
                    x: 16,
                    y: 20,
                    w: 14,
                    h: cfg.hasPhotoLeft ? 125 : 255,
                    text: cfg.leftCat,
                    bgColor: pal.accent,
                    textColor: pal.bannerText || '#ffffff',
                    fontSize: 11
                });
                objects.push({
                    id: `cat_l_${sIdx}`,
                    type: 'category_list',
                    name: `Liste ${cfg.leftCat}`,
                    x: 34,
                    y: 20,
                    w: 120,
                    h: cfg.hasPhotoLeft ? 125 : 255,
                    category: cfg.leftCat,
                    title: cfg.leftCat,
                    titleColor: pal.primary,
                    textColor: pal.text,
                    descColor: pal.descText,
                    priceColor: pal.accent,
                    titleFont: typo.headingFont,
                    fontFamily: typo.bodyFont,
                    priceFont: typo.priceFont
                });
                if (cfg.hasPhotoLeft) {
                    objects.push({
                        id: `pho_l_${sIdx}`,
                        type: 'photo',
                        name: 'Photo Panneau Gauche',
                        x: 20,
                        y: 156,
                        w: 130,
                        h: 120,
                        imageUrl: this.createBlankPhotoPlaceholderSVG(130, 120, pal),
                        caption: '[Suggestion du Sommelier / Ambiance]',
                        borderColor: pal.accent,
                        borderWidth: 1.5,
                        radius: 4
                    });
                }

                // Panneau droit
                objects.push({
                    id: `ban_r_${sIdx}`,
                    type: 'vertical_banner',
                    name: `Bandeau ${cfg.rightCat}`,
                    x: 186,
                    y: 20,
                    w: 14,
                    h: cfg.hasPhotoRight ? 125 : 255,
                    text: cfg.rightCat,
                    bgColor: pal.accent,
                    textColor: pal.bannerText || '#ffffff',
                    fontSize: 11
                });
                objects.push({
                    id: `cat_r_${sIdx}`,
                    type: 'category_list',
                    name: `Liste ${cfg.rightCat}`,
                    x: 204,
                    y: 20,
                    w: 120,
                    h: cfg.hasPhotoRight ? 125 : 255,
                    category: cfg.rightCat,
                    title: cfg.rightCat,
                    titleColor: pal.primary,
                    textColor: pal.text,
                    descColor: pal.descText,
                    priceColor: pal.accent,
                    titleFont: typo.headingFont,
                    fontFamily: typo.bodyFont,
                    priceFont: typo.priceFont
                });
                if (cfg.hasPhotoRight) {
                    objects.push({
                        id: `pho_r_${sIdx}`,
                        type: 'photo',
                        name: 'Photo Panneau Droit',
                        x: 190,
                        y: 156,
                        w: 130,
                        h: 120,
                        imageUrl: this.createBlankPhotoPlaceholderSVG(130, 120, pal),
                        caption: '[Création Signature du Pâtissier]',
                        borderColor: pal.accent,
                        borderWidth: 1.5,
                        radius: 4
                    });
                }
            }

            allFaces.push({
                id: faceId,
                name: cfg.title,
                bgColor: pal.background,
                objects
            });
        });

        return {
            faces: allFaces,
            categories: [...new Set(allCategories)],
            placeholderDishes: this.getNeutralPlaceholderDishes(allCategories),
            palette: pal,
            typography: typo
        };
    }

    // ==================== 8. WEBSITE EXTRACTION SIMULATION & PRESETS ====================

    static simulateWebsiteExtraction(url, stylePreset = 'moderne') {
        const cleanUrl = (url || '').replace(/https?:\/\//i, '').trim();
        const domain = cleanUrl.split('/')[0] || 'mon-restaurant.fr';
        const brandName = domain.split('.')[0].replace(/[-_]/g, ' ').toUpperCase() || 'RESTAURANT';

        const palette = this.getDefaultPalette(stylePreset === 'gastro' ? 'lounge' : (stylePreset === 'bistro' ? 'bistrot' : 'moderne'));
        const typo = this.detectTypography(stylePreset === 'gastro' ? 'luxury' : (stylePreset === 'bistro' ? 'classic' : 'modern'));

        // Disposition web adaptée en 2 volets 340 × 300 mm
        const blocks = [
            { type: 'logo', name: `Logo Web : ${brandName}`, x: 195, y: 22, w: 124, h: 48 },
            { type: 'vertical_banner', name: 'Bandeau La Carte', x: 14, y: 22, w: 14, h: 250 },
            { type: 'category_list', name: 'Liste Entrées & Fraîcheurs', x: 32, y: 22, w: 124, h: 120 },
            { type: 'photo', name: 'Cadre Photo Hero Web', x: 28, y: 152, w: 128, h: 120 },
            { type: 'vertical_banner', name: 'Bandeau Plats', x: 184, y: 80, w: 14, h: 190 },
            { type: 'category_list', name: 'Liste Plats & Desserts', x: 202, y: 80, w: 124, h: 190 }
        ];

        return {
            sourceUrl: cleanUrl,
            brandName,
            palette,
            typography: typo,
            blocks: this.recalibrateAllBlocks(blocks)
        };
    }

    // ==================== 9. EXPORT & IMPORT JSON COMPATIBILITY ====================

    static exportTemplateJSON(templateData) {
        const exportObj = {
            schema: 'InMenuStudioPro_TemplateExtractor_v1',
            createdAt: new Date().toISOString(),
            id: templateData.id || `tpl_ext_${Date.now()}`,
            name: templateData.name || 'Gabarit Vierge PAO 34×30 cm',
            format: 'menu_34x30',
            palette: templateData.palette || this.getDefaultPalette(),
            typography: templateData.typography || this.detectTypography(),
            objects: templateData.objects || [],
            faces: templateData.faces || null
        };
        return JSON.stringify(exportObj, null, 2);
    }

    static importTemplateJSON(jsonString, engine, applyMode = 'active_spread') {
        const parsed = (typeof jsonString === 'string') ? JSON.parse(jsonString) : jsonString;
        if (!engine) throw new Error('DocumentEngine requis pour appliquer le gabarit');

        if (parsed.palette) {
            if (applyMode === 'active_spread' && engine.currentFace) {
                engine.currentFace.bgColor = parsed.palette.background || '#fdfbf7';
            } else if (applyMode === 'all_spreads' && Array.isArray(engine.faces)) {
                engine.faces.forEach(f => { f.bgColor = parsed.palette.background || '#fdfbf7'; });
            }
        }

        if (applyMode === 'all_spreads' && Array.isArray(parsed.faces) && parsed.faces.length > 0) {
            engine.faces = JSON.parse(JSON.stringify(parsed.faces));
            engine.currentFace = engine.faces[0];
        } else if (Array.isArray(parsed.objects) && engine.currentFace) {
            engine.currentFace.objects = JSON.parse(JSON.stringify(parsed.objects));
        }

        engine.saveState();
        return parsed;
    }

    // ==================== 10. DEMO SAMPLES (100% CLIENT-SIDE OFFLINE) ====================

    static getDemoSampleSVG(sampleId = 'bistrot') {
        if (sampleId === 'trattoria') {
            return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
                `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 680 600" width="680" height="600">` +
                `<rect width="680" height="600" fill="#faf6f0"/>` +
                `<rect x="24" y="24" width="292" height="552" fill="none" stroke="#9a3412" stroke-width="2" rx="4"/>` +
                `<rect x="364" y="24" width="292" height="552" fill="none" stroke="#9a3412" stroke-width="2" rx="4"/>` +
                `<rect x="30" y="34" width="28" height="240" fill="#9a3412" rx="3"/>` +
                `<text x="44" y="150" fill="#ffffff" font-family="Cinzel,serif" font-size="14" font-weight="bold" transform="rotate(-90 44 150)" text-anchor="middle">ANTIPASTI</text>` +
                `<text x="75" y="60" fill="#9a3412" font-family="Cinzel,serif" font-size="16" font-weight="bold">ANTIPASTI DELLA CASA</text>` +
                `<text x="75" y="95" fill="#271e18" font-family="Inter,sans-serif" font-size="12" font-weight="bold">Burrata Pugliese ......... 58 DH</text>` +
                `<text x="75" y="115" fill="#78716c" font-family="Inter,sans-serif" font-size="10">Tomates d'antan, pesto verde &amp; roquette</text>` +
                `<text x="75" y="145" fill="#271e18" font-family="Inter,sans-serif" font-size="12" font-weight="bold">Carpaccio di Manzo ........ 65 DH</text>` +
                `<text x="75" y="165" fill="#78716c" font-family="Inter,sans-serif" font-size="10">Parmigiano Reggiano 24 mois, câpres &amp; truffe</text>` +
                `<rect x="40" y="310" width="260" height="240" fill="#15803d" opacity="0.85" rx="6"/>` +
                `<text x="170" y="435" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-size="16" font-weight="bold">PHOTO TRATTORIA</text>` +
                `<text x="510" y="80" text-anchor="middle" fill="#9a3412" font-family="Cinzel,serif" font-size="22" font-weight="bold">TRATTORIA BELLA</text>` +
                `<text x="510" y="105" text-anchor="middle" fill="#15803d" font-family="Inter,sans-serif" font-size="11" letter-spacing="2">PIZZE • PASTE • DOLCI</text>` +
                `<rect x="375" y="140" width="28" height="380" fill="#15803d" rx="3"/>` +
                `<text x="389" y="320" fill="#ffffff" font-family="Cinzel,serif" font-size="14" font-weight="bold" transform="rotate(-90 389 320)" text-anchor="middle">PIZZE ARTIGIANALI</text>` +
                `<text x="420" y="170" fill="#271e18" font-family="Inter,sans-serif" font-size="12" font-weight="bold">Margherita DOP ........... 65 DH</text>` +
                `<text x="420" y="210" fill="#271e18" font-family="Inter,sans-serif" font-size="12" font-weight="bold">Tartufo &amp; Funghi ......... 85 DH</text>` +
                `<text x="420" y="250" fill="#271e18" font-family="Inter,sans-serif" font-size="12" font-weight="bold">Quattro Formaggi ......... 78 DH</text>` +
                `</svg>`
            );
        }

        if (sampleId === 'lounge') {
            return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
                `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 680 600" width="680" height="600">` +
                `<rect width="680" height="600" fill="#111827"/>` +
                `<rect x="24" y="24" width="292" height="552" fill="none" stroke="#f59e0b" stroke-width="1.5" rx="4"/>` +
                `<rect x="364" y="24" width="292" height="552" fill="none" stroke="#f59e0b" stroke-width="1.5" rx="4"/>` +
                `<rect x="30" y="34" width="28" height="240" fill="#f59e0b" rx="3"/>` +
                `<text x="44" y="150" fill="#111827" font-family="Montserrat,sans-serif" font-size="14" font-weight="bold" transform="rotate(-90 44 150)" text-anchor="middle">SIGNATURES</text>` +
                `<text x="75" y="65" fill="#f59e0b" font-family="Montserrat,sans-serif" font-size="16" font-weight="bold">COCKTAILS CRÉATION</text>` +
                `<text x="75" y="100" fill="#f8fafc" font-family="Inter,sans-serif" font-size="12" font-weight="bold">Smoked Old Fashioned ... 75 DH</text>` +
                `<text x="75" y="120" fill="#94a3b8" font-family="Inter,sans-serif" font-size="10">Bourbon infusé chêne, bitter orange &amp; zeste</text>` +
                `<text x="75" y="155" fill="#f8fafc" font-family="Inter,sans-serif" font-size="12" font-weight="bold">Velvet Passion Gin ..... 70 DH</text>` +
                `<text x="75" y="175" fill="#94a3b8" font-family="Inter,sans-serif" font-size="10">Gin floral, purée de passion, blanc d'oeuf</text>` +
                `<rect x="40" y="310" width="260" height="240" fill="#1f2937" rx="6"/>` +
                `<text x="170" y="435" text-anchor="middle" fill="#f59e0b" font-family="Montserrat,sans-serif" font-size="16" font-weight="bold">PHOTO LOUNGE BAR</text>` +
                `<text x="510" y="80" text-anchor="middle" fill="#f8fafc" font-family="Montserrat,sans-serif" font-size="22" font-weight="bold">THE NOCTURNE</text>` +
                `<text x="510" y="105" text-anchor="middle" fill="#f59e0b" font-family="Inter,sans-serif" font-size="11" letter-spacing="3">GASTRO LOUNGE • CLUB</text>` +
                `<rect x="375" y="140" width="28" height="380" fill="#374151" rx="3"/>` +
                `<text x="389" y="320" fill="#f8fafc" font-family="Montserrat,sans-serif" font-size="14" font-weight="bold" transform="rotate(-90 389 320)" text-anchor="middle">TAPAS &amp; GOURMET</text>` +
                `<text x="420" y="170" fill="#f8fafc" font-family="Inter,sans-serif" font-size="12" font-weight="bold">Tataki de Thon Rouge ... 85 DH</text>` +
                `<text x="420" y="210" fill="#f8fafc" font-family="Inter,sans-serif" font-size="12" font-weight="bold">Mini Wagyu Burgers ..... 95 DH</text>` +
                `<text x="420" y="250" fill="#f8fafc" font-family="Inter,sans-serif" font-size="12" font-weight="bold">Croustillants Gambas ... 80 DH</text>` +
                `</svg>`
            );
        }

        // Défaut : Bistrot Chic
        return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
            `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 680 600" width="680" height="600">` +
            `<rect width="680" height="600" fill="#fdfbf7"/>` +
            `<rect x="24" y="24" width="292" height="552" fill="none" stroke="#c5a059" stroke-width="2" rx="4"/>` +
            `<rect x="364" y="24" width="292" height="552" fill="none" stroke="#c5a059" stroke-width="2" rx="4"/>` +
            `<rect x="30" y="34" width="28" height="240" fill="#881337" rx="3"/>` +
            `<text x="44" y="150" fill="#ffffff" font-family="Playfair Display,serif" font-size="14" font-weight="bold" transform="rotate(-90 44 150)" text-anchor="middle">ENTRÉES</text>` +
            `<text x="75" y="60" fill="#881337" font-family="Playfair Display,serif" font-size="16" font-weight="bold">ENTRÉES DE SAISON</text>` +
            `<text x="75" y="95" fill="#1e293b" font-family="Inter,sans-serif" font-size="12" font-weight="bold">Foie Gras Maison ........ 72 DH</text>` +
            `<text x="75" y="115" fill="#64748b" font-family="Inter,sans-serif" font-size="10">Brioche toastée &amp; chutney de figues</text>` +
            `<text x="75" y="145" fill="#1e293b" font-family="Inter,sans-serif" font-size="12" font-weight="bold">Velouté de Cèpes ....... 55 DH</text>` +
            `<text x="75" y="165" fill="#64748b" font-family="Inter,sans-serif" font-size="10">Émulsion de noisettes torréfiées</text>` +
            `<rect x="40" y="310" width="260" height="240" fill="#334155" rx="6"/>` +
            `<text x="170" y="435" text-anchor="middle" fill="#c5a059" font-family="Cinzel,serif" font-size="16" font-weight="bold">PHOTO BISTROT PARISIEN</text>` +
            `<text x="510" y="80" text-anchor="middle" fill="#881337" font-family="Playfair Display,serif" font-size="22" font-weight="bold">LE BISTROT GOURMAND</text>` +
            `<text x="510" y="105" text-anchor="middle" fill="#c5a059" font-family="Inter,sans-serif" font-size="11" letter-spacing="2">CAFÉ • BRASSERIE • CARTE</text>` +
            `<rect x="375" y="140" width="28" height="380" fill="#881337" rx="3"/>` +
            `<text x="389" y="320" fill="#ffffff" font-family="Playfair Display,serif" font-size="14" font-weight="bold" transform="rotate(-90 389 320)" text-anchor="middle">PLATS DU CHEF</text>` +
            `<text x="420" y="170" fill="#1e293b" font-family="Inter,sans-serif" font-size="12" font-weight="bold">Filet de Boeuf Rossini .. 95 DH</text>` +
            `<text x="420" y="210" fill="#1e293b" font-family="Inter,sans-serif" font-size="12" font-weight="bold">Pavé de Saumon Rôti ..... 85 DH</text>` +
            `<text x="420" y="250" fill="#1e293b" font-family="Inter,sans-serif" font-size="12" font-weight="bold">Magret de Canard Miel .. 88 DH</text>` +
            `</svg>`
        );
    }
}

if (typeof window !== 'undefined') {
    window.TemplateExtractorEngine = TemplateExtractorEngine;
    window.EXTRACTOR_SPECS = EXTRACTOR_SPECS;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TemplateExtractorEngine, EXTRACTOR_SPECS };
}
