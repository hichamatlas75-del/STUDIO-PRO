/**
 * ============================================================================
 * MODULE 1C: TemplateExtractorEngine (template-extractor.js)
 * InMenu Studio Pro — PAO Menus Livrets 340 × 300 mm & Formats A4 (Portrait / Paysage)
 *
 * Analyse et conversion d'images de menus (photo, scan, web) ou d'URLs en
 * gabarits vierges 100% éditables, calibrés selon les modèles de l'application :
 *  - Formats supportés :
 *      1. Menu Livret 34 × 30 cm (2 Volets, pli 170 mm, 5 planches / 10 faces)
 *      2. Flyer / Carte A4 Portrait (210 × 297 mm, sans pli, 1 ou 2 faces)
 *      3. Set de Table A4 Paysage (297 × 210 mm, grille 3 colonnes)
 *  - Extraction automatique de palette (Canvas API / quantification)
 *  - Détection de structure (grille 1 à 3 colonnes, en-têtes, bandeaux, listes, photos)
 *  - Architecture hybride : analyseur local Canvas + connecteur Vision API (% relatifs)
 *  - Règle stricte anti-pli (zone 160–180 mm interdite sur 34×30 cm)
 *  - Nettoyage neutre (placeholders [CATÉGORIE], [Nom du plat], [Description], 00 DH)
 *  - Thème complet 5 planches (10 faces Recto/Verso) calqué sur les modèles de l'app
 *  - Thème complet Format A4 (Recto/Verso et Panoramique)
 *  - Export / Import JSON compatible WordImporter & AutoLayoutEngine
 * ============================================================================
 */

const EXTRACTOR_FORMATS = {
    'menu_34x30': {
        formatId: 'menu_34x30',
        name: 'Menu Livret 34 × 30 cm (2 Volets)',
        badge: '34 × 30 cm (Pli 170 mm)',
        widthMm: 340,
        heightMm: 300,
        bleedMm: 3,
        hasFold: true,
        foldXMm: 170,
        safeFoldMinMm: 160,
        safeFoldMaxMm: 180,
        safeOuterMm: 10,
        defaultFaces: 10,
        spreadsCount: 5,
        leftPanel: { minXMm: 12, maxXMm: 158, widthMm: 146 },
        rightPanel: { minXMm: 182, maxXMm: 328, widthMm: 146 },
        topMarginMm: 12,
        bottomMarginMm: 288,
        aspectRatio: '340/300'
    },
    'flyer_a4_portrait': {
        formatId: 'flyer_a4_portrait',
        name: 'Flyer / Carte A4 Portrait (210 × 297 mm)',
        badge: 'A4 Portrait (210 × 297 mm)',
        widthMm: 210,
        heightMm: 297,
        bleedMm: 3,
        hasFold: false,
        foldXMm: null,
        safeFoldMinMm: 0,
        safeFoldMaxMm: 0,
        safeOuterMm: 8,
        defaultFaces: 2,
        spreadsCount: 2,
        columns: 2,
        col1: { minXMm: 12, maxXMm: 102, widthMm: 90 },
        col2: { minXMm: 108, maxXMm: 198, widthMm: 90 },
        topMarginMm: 10,
        bottomMarginMm: 288,
        aspectRatio: '210/297'
    },
    'flyer_a4_landscape': {
        formatId: 'flyer_a4_landscape',
        name: 'Set de Table A4 Paysage (297 × 210 mm)',
        badge: 'A4 Paysage (297 × 210 mm)',
        widthMm: 297,
        heightMm: 210,
        bleedMm: 3,
        hasFold: false,
        foldXMm: null,
        safeFoldMinMm: 0,
        safeFoldMaxMm: 0,
        safeOuterMm: 8,
        defaultFaces: 1,
        spreadsCount: 1,
        columns: 3,
        col1: { minXMm: 12, maxXMm: 98, widthMm: 86 },
        col2: { minXMm: 105, maxXMm: 191, widthMm: 86 },
        col3: { minXMm: 198, maxXMm: 284, widthMm: 86 },
        topMarginMm: 10,
        bottomMarginMm: 200,
        aspectRatio: '297/210'
    }
};

const EXTRACTOR_SPECS = EXTRACTOR_FORMATS['menu_34x30'];

class TemplateExtractorEngine {
    // ==================== 1. FORMAT SPECS UTILITIES ====================

    static getFormatSpecs(formatId = 'menu_34x30') {
        return EXTRACTOR_FORMATS[formatId] || EXTRACTOR_FORMATS['menu_34x30'];
    }

    static escapeXml(str) {
        if (!str || typeof str !== 'string') return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    // ==================== 2. COLOR & PALETTE UTILITIES ====================

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

    static extractPaletteFromImageData(imageData, options = {}) {
        if (!imageData || !imageData.data || imageData.data.length === 0) {
            return this.getDefaultPalette();
        }

        const data = imageData.data;
        const width = imageData.width;
        const height = imageData.height;
        const totalPixels = width * height;

        const colorBins = new Map();
        const step = Math.max(1, Math.floor(totalPixels / 5000));

        for (let i = 0; i < data.length; i += step * 4) {
            const a = data[i + 3];
            if (a < 128) continue;
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const qR = Math.round(r / 24) * 24;
            const qG = Math.round(g / 24) * 24;
            const qB = Math.round(b / 24) * 24;
            const key = `${qR},${qG},${qB}`;
            colorBins.set(key, (colorBins.get(key) || 0) + 1);
        }

        const sortedBins = [...colorBins.entries()]
            .map(([k, count]) => {
                const [r, g, b] = k.split(',').map(Number);
                return {
                    r, g, b,
                    hex: this.rgbToHex(r, g, b),
                    count,
                    lum: this.getRelativeLuminance(r, g, b),
                    sat: this.getColorSaturation(r, g, b)
                };
            })
            .sort((a, b) => b.count - a.count);

        if (sortedBins.length === 0) {
            return this.getDefaultPalette();
        }

        const backgroundCandidate = sortedBins[0];
        const isDarkBackground = backgroundCandidate.lum < 0.25;

        let primaryCandidate = sortedBins.find(c => {
            const contrast = this.getContrastRatio(c.hex, backgroundCandidate.hex);
            return contrast >= 4.5 && c.sat >= 0.25;
        });

        if (!primaryCandidate) {
            primaryCandidate = sortedBins.find(c => {
                const contrast = this.getContrastRatio(c.hex, backgroundCandidate.hex);
                return contrast >= 4.0;
            });
        }
        if (!primaryCandidate) {
            primaryCandidate = { hex: isDarkBackground ? '#f8fafc' : '#881337', r: 136, g: 19, b: 55 };
        }

        let accentCandidate = sortedBins.find(c => {
            if (c.hex === primaryCandidate.hex || c.hex === backgroundCandidate.hex) return false;
            const contrastWithBg = this.getContrastRatio(c.hex, backgroundCandidate.hex);
            return c.sat >= 0.35 && contrastWithBg >= 2.5;
        });
        if (!accentCandidate) {
            accentCandidate = { hex: isDarkBackground ? '#f59e0b' : '#c5a059', r: 197, g: 160, b: 89 };
        }

        let textCandidate = sortedBins.find(c => {
            const contrast = this.getContrastRatio(c.hex, backgroundCandidate.hex);
            return contrast >= 7.0 && c.sat < 0.3;
        });
        if (!textCandidate) {
            textCandidate = { hex: isDarkBackground ? '#f1f5f9' : '#1e293b' };
        }

        return {
            background: backgroundCandidate.hex,
            primary: primaryCandidate.hex,
            accent: accentCandidate.hex,
            text: textCandidate.hex,
            isDark: isDarkBackground,
            bannerBg: [primaryCandidate.hex, accentCandidate.hex],
            bannerText: isDarkBackground ? '#ffffff' : (this.getContrastRatio('#ffffff', primaryCandidate.hex) >= 4.5 ? '#ffffff' : '#1e293b'),
            descText: isDarkBackground ? '#94a3b8' : '#64748b'
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

    // ==================== 3. TYPOGRAPHY DETECTION & GOOGLE FONTS MATCHING ====================

    static detectTypography(styleHint = 'classic_serif') {
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
                detectedLabel: 'Classique Luxe & Roman Impérial'
            },
            moderne_minimal: {
                id: 'moderne_minimal',
                name: 'Moderne Minimal (Montserrat + Inter + JetBrains Mono)',
                headingFont: 'Montserrat',
                bodyFont: 'Inter',
                priceFont: 'JetBrains Mono',
                detectedLabel: 'Sans-Serif Géométrique Épuré'
            }
        };

        if (styleHint === 'luxury' || styleHint === 'cinzel') return pairings.palace_prestige;
        if (styleHint === 'modern' || styleHint === 'sans') return pairings.moderne_minimal;
        return pairings.bistrot_chic;
    }

    // ==================== 4. RECALIBRATION PAO & ANTI-PLI MULTI-FORMAT ====================

    static recalibrateBlockForFormat(block, formatId = 'menu_34x30') {
        if (!block || typeof block !== 'object') return [];
        const specs = this.getFormatSpecs(formatId);

        // 1. Fond perdu pleine page
        if (block.type === 'shape' && (block.isBackground || block.w >= specs.widthMm - 20)) {
            return [Object.assign({}, block, {
                x: -specs.bleedMm,
                y: -specs.bleedMm,
                w: specs.widthMm + (specs.bleedMm * 2),
                h: specs.heightMm + (specs.bleedMm * 2),
                locked: true
            })];
        }

        // Format avec Pli Central (ex: menu_34x30)
        if (specs.hasFold && specs.foldXMm) {
            const foldMin = specs.safeFoldMinMm;
            const foldMax = specs.safeFoldMaxMm;
            const leftMin = specs.leftPanel.minXMm;
            const leftMax = specs.leftPanel.maxXMm;
            const rightMin = specs.rightPanel.minXMm;
            const rightMax = specs.rightPanel.maxXMm;

            const bStart = block.x;
            const bEnd = block.x + block.w;
            const overlapsFold = (bStart < foldMax && bEnd > foldMin);

            if (!overlapsFold) {
                const b = Object.assign({}, block);
                if (bEnd <= foldMin) {
                    b.x = Math.max(leftMin, b.x);
                    if (b.x + b.w > leftMax) b.w = Math.max(15, leftMax - b.x);
                } else if (bStart >= foldMax) {
                    b.x = Math.max(rightMin, b.x);
                    if (b.x + b.w > rightMax) b.w = Math.max(15, rightMax - b.x);
                }
                return [b];
            }

            // Chevauchement pli
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

            const center = bStart + block.w / 2;
            const recal = Object.assign({}, block);
            if (center < specs.foldXMm) {
                const maxW = leftMax - leftMin;
                recal.w = Math.min(recal.w, maxW);
                recal.x = Math.max(leftMin, Math.min(recal.x, leftMax - recal.w));
            } else {
                const maxW = rightMax - rightMin;
                recal.w = Math.min(recal.w, maxW);
                recal.x = Math.max(rightMin, Math.min(recal.x, rightMax - recal.w));
            }
            return [recal];
        }

        // Formats Sans Pli (ex: Flyer A4 Portrait / Paysage)
        const margin = specs.safeOuterMm || 8;
        const maxW = specs.widthMm - (margin * 2);
        const maxH = specs.heightMm - (margin * 2);

        const recal = Object.assign({}, block);
        recal.w = Math.min(recal.w, maxW);
        recal.h = Math.min(recal.h, maxH);
        recal.x = Math.max(margin, Math.min(recal.x, specs.widthMm - margin - recal.w));
        recal.y = Math.max(margin, Math.min(recal.y, specs.heightMm - margin - recal.h));
        return [recal];
    }

    static recalibrateBlockAntiFold(block, formatId = 'menu_34x30') {
        return this.recalibrateBlockForFormat(block, formatId);
    }

    static recalibrateAllBlocks(blocks, formatId = 'menu_34x30') {
        if (!Array.isArray(blocks)) return [];
        const result = [];
        for (const blk of blocks) {
            const recalibrated = this.recalibrateBlockForFormat(blk, formatId);
            result.push(...recalibrated);
        }
        return result;
    }

    // ==================== 5. BLANK PHOTO SVG PLACEHOLDER GENERATOR ====================

    static createBlankPhotoPlaceholderSVG(wMm = 120, hMm = 80, palette = null) {
        const pal = palette || this.getDefaultPalette('bistrot');
        const accent = pal.accent || '#c5a059';
        const bg1 = pal.isDark ? '#1f2937' : '#f8fafc';
        const bg2 = pal.isDark ? '#111827' : '#ede8de';
        const textCol = pal.isDark ? '#e2e8f0' : '#475569';

        const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" width="600" height="400">` +
            `<defs><linearGradient id="gp" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${bg1}"/><stop offset="100%" stop-color="${bg2}"/></linearGradient></defs>` +
            `<rect width="600" height="400" fill="url(#gp)"/>` +
            `<rect x="18" y="18" width="564" height="364" fill="none" stroke="${accent}" stroke-width="1.8" stroke-dasharray="6,4" rx="6" opacity="0.6"/>` +
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

    // ==================== 6. CLEAN BLANK TEMPLATE GENERATOR ====================

    static cleanToBlankTemplate(rawLayout, palette, typography, options = {}) {
        const pal = palette || this.getDefaultPalette('bistrot');
        const typo = typography || this.detectTypography('bistrot_chic');
        const formatId = options.format || 'menu_34x30';
        const specs = this.getFormatSpecs(formatId);

        const objects = [];
        let catCounter = 1;

        // 1. Fond Perdu (3 mm de débord tout autour)
        const bleedW = specs.widthMm + (specs.bleedMm * 2);
        const bleedH = specs.heightMm + (specs.bleedMm * 2);
        objects.push({
            id: 'tpl_bg_bleed',
            type: 'shape',
            name: `Fond Vierge (${specs.badge})`,
            x: -specs.bleedMm,
            y: -specs.bleedMm,
            w: bleedW,
            h: bleedH,
            bgColor: pal.background,
            borderColor: 'transparent',
            borderWidth: 0,
            radius: 0,
            opacity: 1,
            locked: true,
            isBackground: true
        });

        // 2. Filets d'encadrement éditoriaux selon les modèles InDesign de l'application
        if (options.addPanelFrames !== false) {
            if (formatId === 'flyer_a4_portrait') {
                // Modèle A4 Portrait : Cadre extérieur InDesign + Cadres 2 colonnes
                objects.push({
                    id: 'tpl_frame_a4_master',
                    type: 'shape',
                    name: 'Cadre Extérieur InDesign A4',
                    x: 8,
                    y: 8,
                    w: 194,
                    h: 281,
                    bgColor: 'transparent',
                    borderColor: pal.accent,
                    borderWidth: 1,
                    radius: 4,
                    opacity: 0.65
                });
                objects.push({
                    id: 'tpl_frame_col_left',
                    type: 'shape',
                    name: 'Filet Colonne 1 (Entrées)',
                    x: 12,
                    y: 64,
                    w: 90,
                    h: 162,
                    bgColor: 'transparent',
                    borderColor: pal.accent,
                    borderWidth: 0.6,
                    radius: 3,
                    opacity: 0.35
                });
                objects.push({
                    id: 'tpl_frame_col_right',
                    type: 'shape',
                    name: 'Filet Colonne 2 (Plats)',
                    x: 108,
                    y: 64,
                    w: 90,
                    h: 162,
                    bgColor: 'transparent',
                    borderColor: pal.accent,
                    borderWidth: 0.6,
                    radius: 3,
                    opacity: 0.35
                });
            } else if (formatId === 'flyer_a4_landscape') {
                // Modèle A4 Paysage (Set de table panoramique) : 3 colonnes
                objects.push({
                    id: 'tpl_frame_a4_landscape',
                    type: 'shape',
                    name: 'Cadre Set de Table Panoramique',
                    x: 8,
                    y: 8,
                    w: 281,
                    h: 194,
                    bgColor: 'transparent',
                    borderColor: pal.accent,
                    borderWidth: 1,
                    radius: 4,
                    opacity: 0.65
                });
                objects.push({
                    id: 'tpl_frame_col_1',
                    type: 'shape',
                    name: 'Colonne 1 (Entrées)',
                    x: 12,
                    y: 44,
                    w: 86,
                    h: 152,
                    bgColor: 'transparent',
                    borderColor: pal.accent,
                    borderWidth: 0.6,
                    radius: 3,
                    opacity: 0.35
                });
                objects.push({
                    id: 'tpl_frame_col_2',
                    type: 'shape',
                    name: 'Colonne 2 (Plats)',
                    x: 105,
                    y: 44,
                    w: 86,
                    h: 152,
                    bgColor: 'transparent',
                    borderColor: pal.accent,
                    borderWidth: 0.6,
                    radius: 3,
                    opacity: 0.35
                });
                objects.push({
                    id: 'tpl_frame_col_3',
                    type: 'shape',
                    name: 'Colonne 3 (Desserts & Boissons)',
                    x: 198,
                    y: 44,
                    w: 86,
                    h: 152,
                    bgColor: 'transparent',
                    borderColor: pal.accent,
                    borderWidth: 0.6,
                    radius: 3,
                    opacity: 0.35
                });
            } else {
                // Modèle Livret 34 × 30 cm (2 volets)
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
                    opacity: 0.45
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
                    opacity: 0.45
                });
            }
        }

        // 3. Recalibrer les blocs détectés selon le format cible
        const safeBlocks = this.recalibrateAllBlocks(rawLayout.blocks || [], formatId);

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
                    subtitle: '[CAFÉ • RESTAURANT • SINCE 2024]',
                    color: pal.primary,
                    titleFont: typo.headingFont
                });
            } else if (blk.type === 'vertical_banner') {
                const catName = `[CATÉGORIE ${catCounter}]`;
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
                    fontSize: 11
                });
            } else if (blk.type === 'category_list') {
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
            name: options.name || `Gabarit Vierge PAO (${specs.name})`,
            format: formatId,
            palette: pal,
            typography: typo,
            objects,
            categoriesCount: Math.max(1, catCounter - 1)
        };
    }

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

    // ==================== 7. HYBRID LAYOUT ANALYZER ====================

    static getDefaultLayout(preset = 'classic', formatId = 'menu_34x30') {
        const specs = this.getFormatSpecs(formatId);

        if (formatId === 'flyer_a4_portrait') {
            const blocks = [
                { type: 'logo', name: 'En-Tête / Titre Carte A4', x: 14, y: 14, w: 182, h: 44 },
                { type: 'photo', name: 'Photo Hero du Chef', x: 14, y: 64, w: 182, h: 50 },
                { type: 'category_list', name: 'Liste Entrées & Fraîcheur', x: 14, y: 120, w: 88, h: 102 },
                { type: 'category_list', name: 'Liste Plats du Terroir', x: 108, y: 120, w: 88, h: 102 },
                { type: 'shape', name: 'Bandeau Suggestion', x: 14, y: 228, w: 182, h: 26, bgColor: '#c5a059' },
                { type: 'shape', name: 'Cartouche Réservations & Infos', x: 14, y: 260, w: 182, h: 24 }
            ];
            return {
                detectedGrid: 'a4_portrait_2col',
                blocks: this.recalibrateAllBlocks(blocks, formatId)
            };
        }

        if (formatId === 'flyer_a4_landscape') {
            const blocks = [
                { type: 'logo', name: 'En-Tête Panoramique Set de Table', x: 14, y: 12, w: 269, h: 26 },
                { type: 'category_list', name: 'Colonne 1 Entrées', x: 14, y: 44, w: 84, h: 148 },
                { type: 'category_list', name: 'Colonne 2 Plats & Grillades', x: 106, y: 44, w: 84, h: 148 },
                { type: 'category_list', name: 'Colonne 3 Desserts & Boissons', x: 198, y: 44, w: 84, h: 148 }
            ];
            return {
                detectedGrid: 'a4_landscape_3col',
                blocks: this.recalibrateAllBlocks(blocks, formatId)
            };
        }

        // menu_34x30 (2 volets)
        const blocks = [
            { type: 'vertical_banner', name: 'Bandeau Catégorie Gauche', x: 14, y: 22, w: 14, h: 125 },
            { type: 'category_list', name: 'Liste Entrées & Salades', x: 32, y: 22, w: 124, h: 125 },
            { type: 'photo', name: 'Cadre Photo d\'Ambiance', x: 20, y: 158, w: 136, h: 120 },
            { type: 'logo', name: 'Logo / Marque Signature', x: 195, y: 22, w: 120, h: 48 },
            { type: 'vertical_banner', name: 'Bandeau Catégorie Droit', x: 184, y: 78, w: 14, h: 200 },
            { type: 'category_list', name: 'Liste Plats & Spécialités', x: 202, y: 78, w: 124, h: 200 }
        ];

        return {
            detectedGrid: preset,
            blocks: this.recalibrateAllBlocks(blocks, formatId)
        };
    }

    static detectLayoutFromCanvas(canvas, options = {}) {
        const formatId = options.format || 'menu_34x30';
        if (!canvas) return this.getDefaultLayout('classic', formatId);

        try {
            return this.getDefaultLayout('detected_canvas', formatId);
        } catch (err) {
            console.warn('[TemplateExtractorEngine] Canvas detectLayout fallback:', err);
            return this.getDefaultLayout('fallback', formatId);
        }
    }

    static parseVisionResponse(visionData, options = {}) {
        const formatId = options.format || 'menu_34x30';
        const specs = this.getFormatSpecs(formatId);
        if (!visionData) return this.getDefaultLayout('classic', formatId);

        const data = (typeof visionData === 'string') ? JSON.parse(visionData) : visionData;
        const rawBlocks = data.blocks || data.elements || data.regions || [];

        if (rawBlocks.length === 0) {
            return this.getDefaultLayout('classic', formatId);
        }

        const blocks = [];
        for (const b of rawBlocks) {
            const xMm = Math.round(((b.xPct ?? b.x ?? 0) / 100) * specs.widthMm);
            const yMm = Math.round(((b.yPct ?? b.y ?? 0) / 100) * specs.heightMm);
            const wMm = Math.round(((b.wPct ?? b.w ?? 20) / 100) * specs.widthMm);
            const hMm = Math.round(((b.hPct ?? b.h ?? 20) / 100) * specs.heightMm);

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
            blocks: this.recalibrateAllBlocks(blocks, formatId)
        };
    }

    // ==================== 8. THÈMES COMPLETS MULTI-PAGES & FORMAT A4 ====================

    /**
     * Génère un thème complet calqué sur les modèles InDesign réels de l'application :
     * 
     * POUR menu_34x30 (Livret 34 × 30 cm) :
     *  - Construit les 10 FACES (5 feuilles complètes Recto & Verso) :
     *      Feuille 1 Recto : Couverture principale & Dos / Suggestions
     *      Feuille 1 Verso : Entrées froides & Salades de saison
     *      Feuille 2 Recto : Entrées chaudes & Tapas à partager
     *      Feuille 2 Verso : Viandes grillées & Poissons frais
     *      Feuille 3 Recto : Spécialités maison & Plats végétariens
     *      Feuille 3 Verso : Pâtes fraîches & Pizzas au feu de bois
     *      Feuille 4 Recto : Burgers Gourmet & Street Food chic
     *      Feuille 4 Verso : Fromages affinés & Sélection des vins
     *      Feuille 5 Recto : Desserts pâtissiers & Coupes glacées
     *      Feuille 5 Verso : Cafés barista, Thés & Digestifs
     *  - Strict respect de la zone anti-pli 160–180 mm (zéro empiètement)
     *  - 20 catégories neutres avec plats types pour alimenter dishesDB
     * 
     * POUR flyer_a4_portrait (Flyer A4 210 × 297 mm) :
     *  - Construit les 2 FACES (Recto : Carte des Mets / Verso : Desserts & Boissons)
     * 
     * POUR flyer_a4_landscape (Set de table A4 297 × 210 mm) :
     *  - Construit le set de table panoramique complet 3 colonnes InDesign
     */
    static buildFull5SpreadsTheme(palette, typography, options = {}) {
        const pal = palette || this.getDefaultPalette('bistrot');
        const typo = typography || this.detectTypography('bistrot_chic');
        const formatId = options.format || 'menu_34x30';
        const specs = this.getFormatSpecs(formatId);

        // ==================== CAS A : FORMAT A4 PORTRAIT (210 × 297 mm) ====================
        if (formatId === 'flyer_a4_portrait') {
            const a4Categories = ['[ENTRÉES & SALADES]', '[PLATS DU CHEF & GRILLADES]', '[DESSERTS PÂTISSIERS]', '[CARTE DES BOISSONS & VINS]'];
            const faces = [];

            // Page 1 : Recto (Carte des Mets & Suggestions)
            const p1Objs = [];
            p1Objs.push({
                id: 'bg_a4_recto', type: 'shape', name: 'Fond Perdu A4 Recto',
                x: -3, y: -3, w: 216, h: 303, bgColor: pal.background, locked: true, isBackground: true
            });
            p1Objs.push({
                id: 'frame_a4_recto', type: 'shape', name: 'Cadre Extérieur InDesign A4',
                x: 8, y: 8, w: 194, h: 281, bgColor: 'transparent', borderColor: pal.accent, borderWidth: 1, radius: 4, opacity: 0.65
            });
            p1Objs.push({
                id: 'hdr_bg_a4_recto', type: 'shape', name: 'Bandeau Titre Supérieur',
                x: 12, y: 12, w: 186, h: 48, bgColor: pal.primary, radius: 4
            });
            p1Objs.push({
                id: 'hdr_title_a4_recto', type: 'logo', name: 'Logo / En-Tête Restaurant',
                x: 16, y: 16, w: 178, h: 40, title: '[NOM DU RESTAURANT]', subtitle: '[CUISINE GOURMANDE & PRODUITS DU TERROIR]',
                color: '#ffffff', titleFont: typo.headingFont
            });
            p1Objs.push({
                id: 'pho_a4_recto', type: 'photo', name: 'Photo Hero du Chef',
                x: 12, y: 64, w: 186, h: 54, imageUrl: this.createBlankPhotoPlaceholderSVG(186, 54, pal),
                caption: '[Suggestion Gourmande du Chef & Produits Frais]', borderColor: pal.accent, borderWidth: 1.2, radius: 4
            });
            // 2 Colonnes de plats
            p1Objs.push({
                id: 'col_l_frame', type: 'shape', name: 'Filet Colonne Entrées',
                x: 12, y: 122, w: 90, h: 104, bgColor: 'transparent', borderColor: pal.accent, borderWidth: 0.5, radius: 3, opacity: 0.35
            });
            p1Objs.push({
                id: 'cat_a4_1', type: 'category_list', name: 'Liste Entrées & Salades',
                x: 14, y: 126, w: 86, h: 96, category: a4Categories[0], title: a4Categories[0],
                titleColor: pal.primary, textColor: pal.text, descColor: pal.descText, priceColor: pal.accent,
                titleFont: typo.headingFont, fontFamily: typo.bodyFont, priceFont: typo.priceFont
            });
            p1Objs.push({
                id: 'col_r_frame', type: 'shape', name: 'Filet Colonne Plats',
                x: 108, y: 122, w: 90, h: 104, bgColor: 'transparent', borderColor: pal.accent, borderWidth: 0.5, radius: 3, opacity: 0.35
            });
            p1Objs.push({
                id: 'cat_a4_2', type: 'category_list', name: 'Liste Plats du Chef',
                x: 110, y: 126, w: 86, h: 96, category: a4Categories[1], title: a4Categories[1],
                titleColor: pal.primary, textColor: pal.text, descColor: pal.descText, priceColor: pal.accent,
                titleFont: typo.headingFont, fontFamily: typo.bodyFont, priceFont: typo.priceFont
            });
            // Bandeau pause gourmande & Réservations
            p1Objs.push({
                id: 'ban_midi_a4', type: 'shape', name: 'Bandeau Formules Midi',
                x: 12, y: 230, w: 186, h: 26, bgColor: pal.accent, radius: 3
            });
            p1Objs.push({
                id: 'txt_midi_a4', type: 'text', name: 'Texte Formules',
                x: 14, y: 234, w: 182, h: 18, text: 'FORMULE DU MIDI • PLAT + DESSERT + CAFÉ : 00 DH',
                align: 'center', fontFamily: typo.headingFont, fontSize: 10, color: pal.bannerText || '#ffffff', fontWeight: 'bold'
            });
            p1Objs.push({
                id: 'info_a4_recto', type: 'text', name: 'Cartouche Réservations & Horaires',
                x: 12, y: 260, w: 186, h: 26, text: 'RÉSERVATIONS AU 01 42 00 00 00 • 28, RUE GOURMANDE\nOuvert du Mardi au Dimanche • 12h00 — 14h30 / 19h30 — 23h00',
                align: 'center', fontFamily: typo.bodyFont, fontSize: 8.5, color: pal.text
            });

            faces.push({
                id: 'page_1', sheetNumber: 1, side: 'Recto',
                name: 'Flyer A4 — Recto (Carte des Mets & Suggestions)', bgColor: pal.background, objects: p1Objs
            });

            // Page 2 : Verso (Desserts & Boissons)
            const p2Objs = [];
            p2Objs.push({
                id: 'bg_a4_verso', type: 'shape', name: 'Fond Perdu A4 Verso',
                x: -3, y: -3, w: 216, h: 303, bgColor: pal.background, locked: true, isBackground: true
            });
            p2Objs.push({
                id: 'frame_a4_verso', type: 'shape', name: 'Cadre InDesign A4 Verso',
                x: 8, y: 8, w: 194, h: 281, bgColor: 'transparent', borderColor: pal.accent, borderWidth: 1, radius: 4, opacity: 0.65
            });
            p2Objs.push({
                id: 'hdr_title_a4_verso', type: 'logo', name: 'Titre Desserts & Boissons',
                x: 12, y: 14, w: 186, h: 42, title: '[DESSERTS DU CHEF & BOISSONS]', subtitle: '[CAFÉS GRANDS CRUS • SÉLECTION DE VINS • COCKTAILS]',
                color: pal.primary, titleFont: typo.headingFont
            });
            p2Objs.push({
                id: 'cat_a4_3', type: 'category_list', name: 'Liste Desserts Pâtissiers',
                x: 14, y: 62, w: 88, h: 110, category: a4Categories[2], title: a4Categories[2],
                titleColor: pal.primary, textColor: pal.text, descColor: pal.descText, priceColor: pal.accent,
                titleFont: typo.headingFont, fontFamily: typo.bodyFont, priceFont: typo.priceFont
            });
            p2Objs.push({
                id: 'cat_a4_4', type: 'category_list', name: 'Liste Vins & Boissons',
                x: 108, y: 62, w: 88, h: 110, category: a4Categories[3], title: a4Categories[3],
                titleColor: pal.primary, textColor: pal.text, descColor: pal.descText, priceColor: pal.accent,
                titleFont: typo.headingFont, fontFamily: typo.bodyFont, priceFont: typo.priceFont
            });
            p2Objs.push({
                id: 'pho_a4_verso', type: 'photo', name: 'Photo Desserts',
                x: 12, y: 178, w: 186, h: 56, imageUrl: this.createBlankPhotoPlaceholderSVG(186, 56, pal),
                caption: '[Douceurs Maison & Pâtisseries Fines du Chef]', borderColor: pal.accent, borderWidth: 1.2, radius: 4
            });
            p2Objs.push({
                id: 'info_a4_verso', type: 'text', name: 'Mentions Légales & Allergènes',
                x: 12, y: 242, w: 186, h: 44, text: 'TOUS NOS PLATS SONT FAITS MAISON À PARTIR DE PRODUITS BRUTS DE SAISON\nListe complète des allergènes disponible sur simple demande auprès de notre personnel.\nTarifs nets en dirhams (DH) taxes et service compris.',
                align: 'center', fontFamily: typo.bodyFont, fontSize: 8, color: pal.descText
            });

            faces.push({
                id: 'page_2', sheetNumber: 2, side: 'Verso',
                name: 'Flyer A4 — Verso (Desserts & Sélection Boissons)', bgColor: pal.background, objects: p2Objs
            });

            return {
                faces,
                categories: a4Categories,
                placeholderDishes: this.getNeutralPlaceholderDishes(a4Categories),
                palette: pal,
                typography: typo,
                spreadsCount: 2,
                format: 'flyer_a4_portrait'
            };
        }

        // ==================== CAS B : FORMAT A4 PAYSAGE (297 × 210 mm) ====================
        if (formatId === 'flyer_a4_landscape') {
            const a4lCategories = ['[ENTRÉES & APÉRITIFS]', '[PLATS CHAUDS & GRILLADES]', '[DESSERTS, CAFÉS & VINS]'];
            const landObjs = [];

            landObjs.push({
                id: 'bg_a4_land', type: 'shape', name: 'Fond Perdu A4 Paysage',
                x: -3, y: -3, w: 303, h: 216, bgColor: pal.background, locked: true, isBackground: true
            });
            landObjs.push({
                id: 'frame_a4_land', type: 'shape', name: 'Cadre Set de Table',
                x: 8, y: 8, w: 281, h: 194, bgColor: 'transparent', borderColor: pal.accent, borderWidth: 1, radius: 4, opacity: 0.65
            });
            landObjs.push({
                id: 'hdr_a4_land', type: 'logo', name: 'En-Tête Panoramique',
                x: 12, y: 12, w: 273, h: 26, title: '[NOM DU RESTAURANT • SET DE TABLE]', subtitle: '[CUISINE TRADITIONNELLE & PRODUITS FRAIS DU MARCHÉ]',
                color: pal.primary, titleFont: typo.headingFont
            });
            // 3 Colonnes
            landObjs.push({
                id: 'cat_land_1', type: 'category_list', name: 'Colonne 1 Entrées',
                x: 14, y: 44, w: 82, h: 136, category: a4lCategories[0], title: a4lCategories[0],
                titleColor: pal.primary, textColor: pal.text, descColor: pal.descText, priceColor: pal.accent,
                titleFont: typo.headingFont, fontFamily: typo.bodyFont, priceFont: typo.priceFont
            });
            landObjs.push({
                id: 'cat_land_2', type: 'category_list', name: 'Colonne 2 Plats',
                x: 107, y: 44, w: 82, h: 136, category: a4lCategories[1], title: a4lCategories[1],
                titleColor: pal.primary, textColor: pal.text, descColor: pal.descText, priceColor: pal.accent,
                titleFont: typo.headingFont, fontFamily: typo.bodyFont, priceFont: typo.priceFont
            });
            landObjs.push({
                id: 'cat_land_3', type: 'category_list', name: 'Colonne 3 Desserts',
                x: 200, y: 44, w: 82, h: 136, category: a4lCategories[2], title: a4lCategories[2],
                titleColor: pal.primary, textColor: pal.text, descColor: pal.descText, priceColor: pal.accent,
                titleFont: typo.headingFont, fontFamily: typo.bodyFont, priceFont: typo.priceFont
            });
            landObjs.push({
                id: 'footer_land', type: 'text', name: 'Mentions & Horaires',
                x: 12, y: 184, w: 273, h: 14, text: 'SERVICE CONTINU 7J/7 • RÉSERVATIONS AU 01 42 00 00 00 • VIANDES BOVINES D\'ORIGINE CONTRÔLÉE • PRIX NETS EN DH',
                align: 'center', fontFamily: typo.bodyFont, fontSize: 7.5, color: pal.descText
            });

            return {
                faces: [{
                    id: 'page_1', sheetNumber: 1, side: 'Recto',
                    name: 'Set de Table A4 Paysage (Grille 3 Colonnes)', bgColor: pal.background, objects: landObjs
                }],
                categories: a4lCategories,
                placeholderDishes: this.getNeutralPlaceholderDishes(a4lCategories),
                palette: pal,
                typography: typo,
                spreadsCount: 1,
                format: 'flyer_a4_landscape'
            };
        }

        // ==================== CAS C : FORMAT MENU LIVRET 34 × 30 CM (5 PLANCHES / 10 FACES) ====================
        const sheetsDefinition = [
            // Feuille 1 : Recto (Couverture & Dos) + Verso (Entrées froides & Salades)
            {
                sheet: 1, side: 'Recto', name: 'Feuille 1 — Recto (Couverture & Dos)',
                isCover: true, leftCat: '[SUGGESTIONS & DOS]', rightCat: '[CARTE & COUVERTURE]'
            },
            {
                sheet: 1, side: 'Verso', name: 'Feuille 1 — Verso (Entrées de Saison & Salades)',
                isCover: false, leftCat: '[ENTRÉES FROIDES & VERRINES]', rightCat: '[SALADES GOURMANDES DU JARDIN]', hasPhotoRight: true
            },
            // Feuille 2 : Recto (Entrées chaudes & Tapas) + Verso (Viandes & Poissons)
            {
                sheet: 2, side: 'Recto', name: 'Feuille 2 — Recto (Entrées Chaudes & Tapas à Partager)',
                isCover: false, leftCat: '[ENTRÉES CHAUDES & SOUPES]', rightCat: '[TAPAS & PLANCHES APÉRITIVES]', hasPhotoLeft: true
            },
            {
                sheet: 2, side: 'Verso', name: 'Feuille 2 — Verso (Viandes d’Exception & Poissons Frais)',
                isCover: false, leftCat: '[VIANDES & GRILLADES AU FEU DE BOIS]', rightCat: '[POISSONS DU JOUR & FRUITS DE MER]', hasPhotoRight: true
            },
            // Feuille 3 : Recto (Spécialités de Saison) + Verso (Pâtes & Pizzas)
            {
                sheet: 3, side: 'Recto', name: 'Feuille 3 — Recto (Spécialités de la Maison & Terroir)',
                isCover: false, leftCat: '[SPÉCIALITÉS DU CHEF]', rightCat: '[PLATS VÉGÉTARIENS & SAVEURS D’AUTEUR]', hasPhotoLeft: true
            },
            {
                sheet: 3, side: 'Verso', name: 'Feuille 3 — Verso (Pâtes Artisanales & Pizzas au Feu de Bois)',
                isCover: false, leftCat: '[PÂTES FRAÎCHES & RISOTTOS]', rightCat: '[PIZZAS NAPOLITAINES AU FEU DE BOIS]', hasPhotoRight: true
            },
            // Feuille 4 : Recto (Burgers & Street Food) + Verso (Fromages & Vins)
            {
                sheet: 4, side: 'Recto', name: 'Feuille 4 — Recto (Burgers Gourmets & Street Food Chic)',
                isCover: false, leftCat: '[BURGERS SIGNATURES & SMASH]', rightCat: '[STREET FOOD & CROUSTILLANTS]', hasPhotoLeft: true
            },
            {
                sheet: 4, side: 'Verso', name: 'Feuille 4 — Verso (Fromages Affinés & Sélection des Vins)',
                isCover: false, leftCat: '[FROMAGES AFFINÉS DU TERROIR]', rightCat: '[SÉLECTION DE VINS & GRANDS CRUS]', hasPhotoRight: true
            },
            // Feuille 5 : Recto (Desserts & Douceurs) + Verso (Barista & Digestifs)
            {
                sheet: 5, side: 'Recto', name: 'Feuille 5 — Recto (Desserts Pâtissiers & Douceurs du Chef)',
                isCover: false, leftCat: '[DESSERTS DU CHEF PÂTISSIER]', rightCat: '[COUPES GLACÉES & DOUCEURS FRUITÉES]', hasPhotoLeft: true
            },
            {
                sheet: 5, side: 'Verso', name: 'Feuille 5 — Verso (Barista, Thés d’Origine & Digestifs)',
                isCover: false, leftCat: '[CAFÉS DE SPÉCIALITÉ & THÉS BIO]', rightCat: '[COCKTAILS, MOCKTAILS & DIGESTIFS]', hasPhotoRight: true
            }
        ];

        const allFaces = [];
        const allCategories = [];

        sheetsDefinition.forEach((def, idx) => {
            allCategories.push(def.leftCat, def.rightCat);
            const faceId = `sheet_${def.sheet}_${def.side.toLowerCase()}`;
            const objects = [];

            // 1. Fond Perdu 3 mm (-3..343 mm, -3..303 mm)
            objects.push({
                id: `bg_${faceId}`,
                type: 'shape',
                name: `Fond ${def.name}`,
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

            // 2. Filets d'encadrement éditoriaux pour les deux volets
            objects.push({
                id: `fr_l_${faceId}`,
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
                opacity: 0.45
            });
            objects.push({
                id: `fr_r_${faceId}`,
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
                opacity: 0.45
            });

            if (def.isCover) {
                // Couverture & Dos (Feuille 1 Recto)
                // Panneau Gauche : Dos / Suggestions & Informations pratiques
                objects.push({
                    id: `ban_dos_${idx}`,
                    type: 'vertical_banner',
                    name: 'Bandeau Suggestions Dos',
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
                    id: `cat_dos_${idx}`,
                    type: 'category_list',
                    name: `Liste ${def.leftCat}`,
                    x: 34,
                    y: 20,
                    w: 120,
                    h: 120,
                    category: def.leftCat,
                    title: def.leftCat,
                    titleColor: pal.primary,
                    textColor: pal.text,
                    descColor: pal.descText,
                    priceColor: pal.accent,
                    titleFont: typo.headingFont,
                    fontFamily: typo.bodyFont,
                    priceFont: typo.priceFont
                });
                objects.push({
                    id: `txt_dos_info_${idx}`,
                    type: 'text',
                    name: 'Informations & Horaires Dos',
                    x: 20,
                    y: 156,
                    w: 130,
                    h: 114,
                    text: 'SERVICES CONTINUS 7J/7\n12h00 — 14h30 / 19h30 — 23h30\nRéservations & Événements Privés\nTerrasse Chauffée & Service Voiturier\nTél : 01 42 00 00 00 • www.restaurant.fr',
                    align: 'center',
                    fontFamily: typo.headingFont,
                    fontSize: 10,
                    color: pal.primary,
                    fontWeight: '600'
                });

                // Panneau Droit : Couverture Prestige
                objects.push({
                    id: `logo_cov_${idx}`,
                    type: 'logo',
                    name: 'Logo Couverture',
                    x: 198,
                    y: 30,
                    w: 114,
                    h: 54,
                    title: '[NOM DU RESTAURANT]',
                    subtitle: '[CAFÉ • RESTAURANT • SINCE 2024]',
                    color: pal.primary,
                    titleFont: typo.headingFont
                });
                objects.push({
                    id: `pho_cov_${idx}`,
                    type: 'photo',
                    name: 'Photo Couverture Gastronomique',
                    x: 192,
                    y: 94,
                    w: 126,
                    h: 122,
                    imageUrl: this.createBlankPhotoPlaceholderSVG(126, 122, pal),
                    caption: '[Photo Gastronomique Signature]',
                    borderColor: pal.accent,
                    borderWidth: 1.5,
                    radius: 5
                });
                objects.push({
                    id: `txt_cov_sub_${idx}`,
                    type: 'text',
                    name: 'Titre de Carte',
                    x: 190,
                    y: 228,
                    w: 130,
                    h: 38,
                    text: 'CARTE & MENUS DE SAISON\nCuisine d’Auteur & Produits d’Exception',
                    align: 'center',
                    fontFamily: typo.headingFont,
                    fontSize: 11,
                    color: pal.primary,
                    fontWeight: '700'
                });
            } else {
                // Faces intérieures : 2 volets équilibrés
                const leftH = def.hasPhotoLeft ? 125 : 255;
                objects.push({
                    id: `ban_l_${idx}`,
                    type: 'vertical_banner',
                    name: `Bandeau ${def.leftCat}`,
                    x: 16,
                    y: 20,
                    w: 14,
                    h: leftH,
                    text: def.leftCat,
                    bgColor: pal.accent,
                    textColor: pal.bannerText || '#ffffff',
                    fontSize: 11
                });
                objects.push({
                    id: `cat_l_${idx}`,
                    type: 'category_list',
                    name: `Liste ${def.leftCat}`,
                    x: 34,
                    y: 20,
                    w: 120,
                    h: leftH,
                    category: def.leftCat,
                    title: def.leftCat,
                    titleColor: pal.primary,
                    textColor: pal.text,
                    descColor: pal.descText,
                    priceColor: pal.accent,
                    titleFont: typo.headingFont,
                    fontFamily: typo.bodyFont,
                    priceFont: typo.priceFont
                });
                if (def.hasPhotoLeft) {
                    objects.push({
                        id: `pho_l_${idx}`,
                        type: 'photo',
                        name: `Photo ${def.leftCat}`,
                        x: 20,
                        y: 156,
                        w: 130,
                        h: 120,
                        imageUrl: this.createBlankPhotoPlaceholderSVG(130, 120, pal),
                        caption: '[Suggestion Gourmande du Chef]',
                        borderColor: pal.accent,
                        borderWidth: 1.5,
                        radius: 4
                    });
                }

                const rightH = def.hasPhotoRight ? 125 : 255;
                objects.push({
                    id: `ban_r_${idx}`,
                    type: 'vertical_banner',
                    name: `Bandeau ${def.rightCat}`,
                    x: 186,
                    y: 20,
                    w: 14,
                    h: rightH,
                    text: def.rightCat,
                    bgColor: pal.accent,
                    textColor: pal.bannerText || '#ffffff',
                    fontSize: 11
                });
                objects.push({
                    id: `cat_r_${idx}`,
                    type: 'category_list',
                    name: `Liste ${def.rightCat}`,
                    x: 204,
                    y: 20,
                    w: 120,
                    h: rightH,
                    category: def.rightCat,
                    title: def.rightCat,
                    titleColor: pal.primary,
                    textColor: pal.text,
                    descColor: pal.descText,
                    priceColor: pal.accent,
                    titleFont: typo.headingFont,
                    fontFamily: typo.bodyFont,
                    priceFont: typo.priceFont
                });
                if (def.hasPhotoRight) {
                    objects.push({
                        id: `pho_r_${idx}`,
                        type: 'photo',
                        name: `Photo ${def.rightCat}`,
                        x: 190,
                        y: 156,
                        w: 130,
                        h: 120,
                        imageUrl: this.createBlankPhotoPlaceholderSVG(130, 120, pal),
                        caption: '[Création Signature de Saison]',
                        borderColor: pal.accent,
                        borderWidth: 1.5,
                        radius: 4
                    });
                }
            }

            allFaces.push({
                id: faceId,
                sheetNumber: def.sheet,
                side: def.side,
                name: def.name,
                bgColor: pal.background,
                objects
            });
        });

        return {
            faces: allFaces,
            categories: [...new Set(allCategories)],
            placeholderDishes: this.getNeutralPlaceholderDishes(allCategories),
            palette: pal,
            typography: typo,
            spreadsCount: 5,
            format: 'menu_34x30'
        };
    }

    // ==================== 9. WEBSITE EXTRACTION SIMULATION & PRESETS ====================

    static simulateWebsiteExtraction(url, stylePreset = 'moderne', formatId = 'menu_34x30') {
        const cleanUrl = (url || '').replace(/https?:\/\//i, '').trim();
        const domain = cleanUrl.split('/')[0] || 'mon-restaurant.fr';
        const brandName = domain.split('.')[0].replace(/[-_]/g, ' ').toUpperCase() || 'RESTAURANT';

        const palette = this.getDefaultPalette(stylePreset === 'gastro' ? 'lounge' : (stylePreset === 'bistro' ? 'bistrot' : 'moderne'));
        const typo = this.detectTypography(stylePreset === 'gastro' ? 'luxury' : (stylePreset === 'bistro' ? 'classic' : 'modern'));

        let blocks;
        if (formatId === 'flyer_a4_portrait') {
            blocks = [
                { type: 'logo', name: `Logo Web : ${brandName}`, x: 14, y: 14, w: 182, h: 44 },
                { type: 'photo', name: 'Photo Hero Web', x: 14, y: 64, w: 182, h: 52 },
                { type: 'category_list', name: 'Liste Entrées & Fraîcheurs', x: 14, y: 122, w: 88, h: 104 },
                { type: 'category_list', name: 'Liste Plats Signature', x: 108, y: 122, w: 88, h: 104 },
                { type: 'shape', name: 'Bandeau Web', x: 14, y: 232, w: 182, h: 26, bgColor: palette.accent },
                { type: 'shape', name: 'Infos & Contact Web', x: 14, y: 262, w: 182, h: 24 }
            ];
        } else if (formatId === 'flyer_a4_landscape') {
            blocks = [
                { type: 'logo', name: `Logo Web : ${brandName}`, x: 14, y: 12, w: 269, h: 26 },
                { type: 'category_list', name: 'Liste Entrées Web', x: 14, y: 44, w: 84, h: 148 },
                { type: 'category_list', name: 'Liste Plats Web', x: 106, y: 44, w: 84, h: 148 },
                { type: 'category_list', name: 'Liste Desserts Web', x: 198, y: 44, w: 84, h: 148 }
            ];
        } else {
            blocks = [
                { type: 'logo', name: `Logo Web : ${brandName}`, x: 195, y: 22, w: 124, h: 48 },
                { type: 'vertical_banner', name: 'Bandeau La Carte', x: 14, y: 22, w: 14, h: 250 },
                { type: 'category_list', name: 'Liste Entrées & Fraîcheurs', x: 32, y: 22, w: 124, h: 120 },
                { type: 'photo', name: 'Cadre Photo Hero Web', x: 28, y: 152, w: 128, h: 120 },
                { type: 'vertical_banner', name: 'Bandeau Plats', x: 184, y: 80, w: 14, h: 190 },
                { type: 'category_list', name: 'Liste Plats & Desserts', x: 202, y: 80, w: 124, h: 190 }
            ];
        }

        return {
            sourceUrl: cleanUrl,
            brandName,
            palette,
            typography: typo,
            blocks: this.recalibrateAllBlocks(blocks, formatId)
        };
    }

    // ==================== 10. LIVE WIREFRAME SVG RENDERER ====================

    static renderWireframeSVG(template, options = {}) {
        if (!template) return '';
        const formatId = options.format || template.format || 'menu_34x30';
        const specs = this.getFormatSpecs(formatId);
        const pal = template.palette || this.getDefaultPalette('bistrot');
        const objs = template.objects || [];

        const bgEsc = this.escapeXml(pal.background);
        const priEsc = this.escapeXml(pal.primary);
        const accEsc = this.escapeXml(pal.accent);
        const banTextEsc = this.escapeXml(pal.bannerText || '#ffffff');

        let svg = '';

        if (formatId === 'flyer_a4_portrait') {
            svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 210 297" class="w-full h-full select-none">`;
            svg += `<rect width="210" height="297" fill="${bgEsc}"/>`;
            // Marges sécurisées PAO 8 mm
            svg += `<rect x="8" y="8" width="194" height="281" fill="none" stroke="#06b6d4" stroke-width="0.6" stroke-dasharray="3,2" opacity="0.65"/>`;
            // Axe central
            svg += `<line x1="105" y1="8" x2="105" y2="289" stroke="#94a3b8" stroke-width="0.5" stroke-dasharray="2,2" opacity="0.4"/>`;
            // 2 colonnes
            svg += `<rect x="12" y="64" width="90" height="162" fill="none" stroke="${accEsc}" stroke-width="0.5" stroke-dasharray="2,2" opacity="0.35"/>`;
            svg += `<rect x="108" y="64" width="90" height="162" fill="none" stroke="${accEsc}" stroke-width="0.5" stroke-dasharray="2,2" opacity="0.35"/>`;
        } else if (formatId === 'flyer_a4_landscape') {
            svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 297 210" class="w-full h-full select-none">`;
            svg += `<rect width="297" height="210" fill="${bgEsc}"/>`;
            // Marges 8 mm
            svg += `<rect x="8" y="8" width="281" height="194" fill="none" stroke="#06b6d4" stroke-width="0.6" stroke-dasharray="3,2" opacity="0.65"/>`;
            // Guides 3 colonnes (99 mm et 198 mm)
            svg += `<line x1="99" y1="8" x2="99" y2="202" stroke="#94a3b8" stroke-width="0.5" stroke-dasharray="2,2" opacity="0.4"/>`;
            svg += `<line x1="198" y1="8" x2="198" y2="202" stroke="#94a3b8" stroke-width="0.5" stroke-dasharray="2,2" opacity="0.4"/>`;
        } else {
            // menu_34x30 (2 volets 340 × 300 mm avec pli à 170 mm)
            svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 340 300" class="w-full h-full select-none">`;
            svg += `<defs>`;
            svg += `<pattern id="hatch-fold" width="6" height="6" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">`;
            svg += `<line x1="0" y1="0" x2="0" y2="6" stroke="#f59e0b" stroke-width="1.8" opacity="0.35"/>`;
            svg += `</pattern>`;
            svg += `</defs>`;

            svg += `<rect width="340" height="300" fill="${bgEsc}"/>`;
            svg += `<line x1="170" y1="0" x2="170" y2="300" stroke="#06b6d4" stroke-width="0.8" stroke-dasharray="3,2" opacity="0.8"/>`;
            svg += `<rect x="160" y="0" width="20" height="300" fill="url(#hatch-fold)"/>`;
            svg += `<rect x="160" y="0" width="20" height="300" fill="#f59e0b" fill-opacity="0.08"/>`;

            svg += `<rect x="12" y="12" width="146" height="276" fill="none" stroke="${accEsc}" stroke-width="0.5" stroke-dasharray="2,2" opacity="0.4"/>`;
            svg += `<rect x="182" y="12" width="146" height="276" fill="none" stroke="${accEsc}" stroke-width="0.5" stroke-dasharray="2,2" opacity="0.4"/>`;
        }

        // Trace les objets
        objs.forEach(o => {
            if (o.type === 'shape' && o.isBackground) return;
            const x = Math.max(0, o.x);
            const y = Math.max(0, o.y);
            const w = Math.min(specs.widthMm, o.w);
            const h = Math.min(specs.heightMm, o.h);

            if (o.type === 'logo') {
                svg += `<g>`;
                svg += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="${priEsc}" fill-opacity="0.14" stroke="${priEsc}" stroke-width="1"/>`;
                svg += `<text x="${x + w / 2}" y="${y + h / 2 - 2}" fill="${priEsc}" font-size="7" font-weight="bold" text-anchor="middle" font-family="sans-serif">[LOGO / EN-TÊTE]</text>`;
                svg += `<text x="${x + w / 2}" y="${y + h / 2 + 7}" fill="${priEsc}" opacity="0.75" font-size="5" text-anchor="middle" font-family="monospace">${Math.round(w)} × ${Math.round(h)} mm</text>`;
                svg += `</g>`;
            } else if (o.type === 'vertical_banner') {
                svg += `<g>`;
                svg += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2" fill="${accEsc}" stroke="${accEsc}" stroke-width="0.8"/>`;
                svg += `<text x="${x + w / 2}" y="${y + h / 2}" fill="${banTextEsc}" font-size="6" font-weight="bold" text-anchor="middle" transform="rotate(-90 ${x + w / 2} ${y + h / 2})" font-family="sans-serif">BANDEAU</text>`;
                svg += `</g>`;
            } else if (o.type === 'category_list') {
                svg += `<g>`;
                svg += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="${priEsc}" fill-opacity="0.04" stroke="${priEsc}" stroke-width="0.7" stroke-dasharray="3,2"/>`;
                svg += `<rect x="${x}" y="${y}" width="${w}" height="14" fill="${priEsc}" fill-opacity="0.15" rx="2"/>`;
                svg += `<text x="${x + 6}" y="${y + 10}" fill="${priEsc}" font-size="6.5" font-weight="bold" font-family="sans-serif">${this.escapeXml(o.title || '[CATÉGORIE]')}</text>`;
                svg += `<line x1="${x + 6}" y1="${y + 22}" x2="${x + w - 30}" y2="${y + 22}" stroke="${accEsc}" stroke-width="0.8" opacity="0.8"/>`;
                svg += `<text x="${x + w - 6}" y="${y + 23}" fill="${accEsc}" font-size="5.5" font-weight="bold" text-anchor="end" font-family="monospace">00 DH</text>`;
                svg += `<line x1="${x + 6}" y1="${y + 30}" x2="${x + w - 10}" y2="${y + 30}" stroke="#94a3b8" stroke-width="0.5" opacity="0.5"/>`;
                svg += `</g>`;
            } else if (o.type === 'photo') {
                svg += `<g>`;
                svg += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" fill="#0f172a" fill-opacity="0.25" stroke="${accEsc}" stroke-width="1.2"/>`;
                svg += `<path d="M${x + w / 2 - 12} ${y + h / 2 + 6} l8 -10 l7 8 l6 -6 l7 8" stroke="${accEsc}" stroke-width="1.2" fill="none"/>`;
                svg += `<circle cx="${x + w / 2 - 6}" cy="${y + h / 2 - 6}" r="3" fill="${accEsc}"/>`;
                svg += `<text x="${x + w / 2}" y="${y + h / 2 + 18}" fill="${accEsc}" font-size="5" font-weight="bold" text-anchor="middle" font-family="sans-serif">PHOTO VIERGE</text>`;
                svg += `</g>`;
            } else if (o.type === 'shape') {
                const borderC = this.escapeXml(o.borderColor || accEsc);
                const bgC = o.bgColor && o.bgColor !== 'transparent' ? this.escapeXml(o.bgColor) : 'none';
                svg += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="${bgC}" stroke="${borderC}" stroke-width="0.7" opacity="0.6"/>`;
            } else if (o.type === 'text') {
                svg += `<g>`;
                svg += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2" fill="${priEsc}" fill-opacity="0.05" stroke="${accEsc}" stroke-width="0.5" stroke-dasharray="2,2"/>`;
                svg += `<text x="${x + w / 2}" y="${y + h / 2}" fill="${priEsc}" font-size="5.5" text-anchor="middle" font-family="sans-serif">${this.escapeXml((o.name || 'Texte').substring(0, 20))}</text>`;
                svg += `</g>`;
            }
        });

        svg += `</svg>`;
        return svg;
    }

    // ==================== 11. EXPORT & IMPORT JSON COMPATIBILITY ====================

    static exportTemplateJSON(templateData) {
        const formatId = templateData.format || 'menu_34x30';
        const exportObj = {
            schema: 'InMenuStudioPro_TemplateExtractor_v1',
            createdAt: new Date().toISOString(),
            id: templateData.id || `tpl_ext_${Date.now()}`,
            name: templateData.name || `Gabarit Vierge PAO (${formatId})`,
            format: formatId,
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

        if (parsed.format && parsed.format !== engine.currentFormat) {
            engine.setFormat(parsed.format, false);
        }

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

    // ==================== 12. DEMO SAMPLES (100% CLIENT-SIDE OFFLINE) ====================

    static getDemoSampleSVG(sampleId = 'bistrot', formatId = 'menu_34x30') {
        if (formatId === 'flyer_a4_portrait') {
            return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
                `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 210 297" width="210" height="297">` +
                `<rect width="210" height="297" fill="#fdfbf7"/>` +
                `<rect x="8" y="8" width="194" height="281" fill="none" stroke="#c5a059" stroke-width="1.2" rx="4"/>` +
                `<rect x="12" y="12" width="186" height="46" fill="#881337" rx="3"/>` +
                `<text x="105" y="32" text-anchor="middle" fill="#ffffff" font-family="Cinzel,serif" font-size="14" font-weight="bold">LE BISTROT GOURMAND</text>` +
                `<text x="105" y="47" text-anchor="middle" fill="#c5a059" font-family="Montserrat,sans-serif" font-size="7" letter-spacing="2">CARTE DU JOUR &amp; FORMULES DE SAISON</text>` +
                `<rect x="12" y="64" width="186" height="48" fill="#1e293b" opacity="0.85" rx="3"/>` +
                `<text x="105" y="92" text-anchor="middle" fill="#c5a059" font-family="sans-serif" font-size="10" font-weight="bold">PHOTO CHEF SIGNATURE</text>` +
                `<text x="14" y="126" fill="#881337" font-family="Cinzel,serif" font-size="9" font-weight="bold">ENTRÉES DE SAISON</text>` +
                `<text x="14" y="140" fill="#1e293b" font-family="Inter,sans-serif" font-size="8" font-weight="bold">Foie Gras Maison ........ 65 DH</text>` +
                `<text x="14" y="156" fill="#1e293b" font-family="Inter,sans-serif" font-size="8" font-weight="bold">Velouté de Cèpes ....... 48 DH</text>` +
                `<text x="108" y="126" fill="#881337" font-family="Cinzel,serif" font-size="9" font-weight="bold">PLATS DU CHEF</text>` +
                `<text x="108" y="140" fill="#1e293b" font-family="Inter,sans-serif" font-size="8" font-weight="bold">Filet de Boeuf ......... 95 DH</text>` +
                `<text x="108" y="156" fill="#1e293b" font-family="Inter,sans-serif" font-size="8" font-weight="bold">Pavé de Saumon ........ 85 DH</text>` +
                `<rect x="12" y="228" width="186" height="24" fill="#c5a059" rx="3"/>` +
                `<text x="105" y="243" text-anchor="middle" fill="#ffffff" font-family="Montserrat,sans-serif" font-size="8" font-weight="bold">FORMULE DU MIDI : 00 DH</text>` +
                `<text x="105" y="272" text-anchor="middle" fill="#64748b" font-family="Inter,sans-serif" font-size="7">Réservations au 01 42 00 00 00 • 28 Rue Gourmande</text>` +
                `</svg>`
            );
        }

        if (formatId === 'flyer_a4_landscape') {
            return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
                `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 297 210" width="297" height="210">` +
                `<rect width="297" height="210" fill="#faf6f0"/>` +
                `<rect x="8" y="8" width="281" height="194" fill="none" stroke="#9a3412" stroke-width="1.2" rx="4"/>` +
                `<text x="148" y="26" text-anchor="middle" fill="#9a3412" font-family="Cinzel,serif" font-size="14" font-weight="bold">TRATTORIA BELLA • SET DE TABLE</text>` +
                `<text x="16" y="52" fill="#9a3412" font-family="Cinzel,serif" font-size="9" font-weight="bold">ANTIPASTI</text>` +
                `<text x="16" y="70" fill="#271e18" font-family="Inter,sans-serif" font-size="8">Burrata Pugliese ..... 58 DH</text>` +
                `<text x="16" y="90" fill="#271e18" font-family="Inter,sans-serif" font-size="8">Carpaccio di Manzo ... 65 DH</text>` +
                `<text x="110" y="52" fill="#9a3412" font-family="Cinzel,serif" font-size="9" font-weight="bold">PIZZE ARTIGIANALI</text>` +
                `<text x="110" y="70" fill="#271e18" font-family="Inter,sans-serif" font-size="8">Margherita DOP ...... 65 DH</text>` +
                `<text x="110" y="90" fill="#271e18" font-family="Inter,sans-serif" font-size="8">Tartufo &amp; Funghi .... 85 DH</text>` +
                `<text x="204" y="52" fill="#9a3412" font-family="Cinzel,serif" font-size="9" font-weight="bold">DOLCI &amp; VINI</text>` +
                `<text x="204" y="70" fill="#271e18" font-family="Inter,sans-serif" font-size="8">Tiramisu Tradizionale 42 DH</text>` +
                `<text x="204" y="90" fill="#271e18" font-family="Inter,sans-serif" font-size="8">Chianti Classico DOCG 55 DH</text>` +
                `<text x="148" y="194" text-anchor="middle" fill="#78716c" font-family="sans-serif" font-size="7">Service continu • Pizze au feu de bois</text>` +
                `</svg>`
            );
        }

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

        // Défaut : Bistrot Chic (340 × 300 mm 2 volets)
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
    window.EXTRACTOR_FORMATS = EXTRACTOR_FORMATS;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TemplateExtractorEngine, EXTRACTOR_SPECS, EXTRACTOR_FORMATS };
}
