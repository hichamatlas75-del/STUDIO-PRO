/**
 * ============================================================================
 * BANQUE DE GABARITS & MODÈLES PROFESSIONNELS CLONE ADOBE INDESIGN CC
 * InMenu Studio Pro - Module de Gabarits Éditoriaux PAO Haute Précision
 *
 * Contient 29 modèles professionnels de menus livrets 34×30 cm, flyers A4,
 * sets de table A4 paysage, dépliants 3 volets, chevalets A5, salons de thé,
 * pizzerias/street-food et gabarits maîtres vierges, configurés avec la rigueur
 * typographique et géométrique d'Adobe InDesign CC (grilles, filets doubles,
 * bandeaux verticaux, ornements vectoriels, marges et zones de sécurité pli).
 * ============================================================================
 */

const InDesignTemplatesBank = {
    categories: [
        { id: 'all', name: 'Tous les Gabarits (29)', icon: 'fa-shapes' },
        { id: 'menu_livret', name: 'Menus Livrets 2 Volets (34×30)', icon: 'fa-book-open' },
        { id: 'cafe_patisserie', name: 'Salon de Thé, Café & Pâtisserie', icon: 'fa-mug-saucer' },
        { id: 'street_urban', name: 'Trattoria, Street Food, Sushi & Grill', icon: 'fa-burger' },
        { id: 'flyers_a4', name: 'Flyers, Affiches & Sets de Table A4', icon: 'fa-file-lines' },
        { id: 'depliants_3volets', name: 'Dépliants Triptyques 3 Volets', icon: 'fa-map' },
        { id: 'a5_chevalets', name: 'Chevalets de Table & Cartes A5', icon: 'fa-tablet-screen-button' },
        { id: 'vierge', name: 'Grilles Maîtres & Projets Vierges', icon: 'fa-file-circle-plus' }
    ],

    /**
     * Normalise un objet issu d'un gabarit InDesign vers le schéma canonique de DocumentEngine / VisualCanvasEditor
     */
    normalizeObject(obj, idx = 0) {
        if (!obj || typeof obj !== 'object') return obj;
        const genId = typeof generateUniqueId === 'function'
            ? generateUniqueId(`id_tpl_${idx}`)
            : `id_tpl_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 7)}`;

        const out = Object.assign({}, obj, { id: genId });

        if (out.type === 'frame' || out.type === 'shape') {
            out.type = 'shape';
            out.bgColor = out.bgColor || out.backgroundColor || 'transparent';
            out.borderColor = out.borderColor || 'transparent';
            out.borderWidth = out.borderWidth ?? out.borderWidthPt ?? (out.borderColor !== 'transparent' ? 1 : 0);
            out.radius = out.radius ?? out.borderRadius ?? 0;
            out.opacity = out.opacity ?? 1;
            out.name = out.name || (out.bgColor !== 'transparent' ? 'Fond / Cartouche InDesign' : 'Filet / Cadre InDesign');
        } else if (out.type === 'title_heading' || out.type === 'category_header' || out.type === 'text') {
            const isHeading = out.type === 'title_heading';
            out.type = 'text';
            out.text = out.text ?? out.customName ?? out.content ?? '';
            out.fontFamily = out.fontFamily || (isHeading ? 'Cinzel' : 'Montserrat');
            out.fontSize = out.fontSize ?? out.fontSizePt ?? (isHeading ? 14 : 8.5);
            out.fontWeight = out.fontWeight || (isHeading ? '700' : '500');
            out.color = out.color || '#1e293b';
            out.align = out.align || out.textAlign || 'center';
            const cleanLabel = String(out.text).replace(/\s+/g, ' ').trim().slice(0, 24);
            out.name = out.name || (cleanLabel ? `Texte : ${cleanLabel}` : 'Bloc Texte InDesign');
        } else if (out.type === 'dish_item') {
            out.textColor = out.textColor || out.color || '#1e293b';
            // Choisir une couleur de description lisible selon la luminosité du titre
            if (!out.descColor) {
                const hex = String(out.textColor).replace('#', '');
                const r = parseInt(hex.slice(0, 2), 16) || 0;
                const g = parseInt(hex.slice(2, 4), 16) || 0;
                const b = parseInt(hex.slice(4, 6), 16) || 0;
                const isLightText = (r * 0.299 + g * 0.587 + b * 0.114) > 155;
                out.descColor = out.dotsColor || (isLightText ? '#a8a29e' : '#64748b');
            }
            out.priceColor = out.priceColor || out.color || '#9a3412';
            out.fontSize = out.fontSize ?? out.fontSizePt ?? 10;
            const cleanDish = String(out.customName || 'Plat').replace(/\s+/g, ' ').trim().slice(0, 24);
            out.name = out.name || `Plat : ${cleanDish}`;
        } else if (out.type === 'illustration') {
            out.svgKey = out.svgKey || out.illustrationId || 'cutlery_crossed';
            out.illustrationId = out.illustrationId || out.svgKey;
            out.color = out.color || '#c8a96a';
            out.opacity = out.opacity ?? 1;
            out.name = out.name || `Ornement (${out.svgKey})`;
        } else if (out.type === 'vertical_banner') {
            out.bgColor = out.bgColor || '#1e293b';
            out.textColor = out.textColor || '#ffffff';
            out.fontSize = out.fontSize ?? 11;
            out.radius = out.radius ?? 2.5;
            out.name = out.name || `Bandeau : ${out.text || 'CATÉGORIE'}`;
        } else if (out.type === 'badge_new') {
            out.bgColor = out.bgColor || '#e11d48';
            out.textColor = out.textColor || '#ffffff';
            out.radius = out.radius ?? 8;
            out.name = out.name || `Badge : ${out.text || 'NOUVEAU'}`;
        }

        return out;
    },

    normalizeFace(face) {
        if (!face || !Array.isArray(face.objects)) return face;
        face.objects = face.objects.map((o, i) => this.normalizeObject(o, i));
        return face;
    },

    normalizeEngineFaces(engine) {
        if (!engine || !Array.isArray(engine.faces)) return;
        engine.faces.forEach(f => this.normalizeFace(f));
    },

    templates: [
        // ====================================================================
        // 1. MENU PRESTIGE GASTRONOMIQUE (340×300 mm - 2 Volets)
        // ====================================================================
        {
            id: 'menu_prestige_gastronomie',
            name: 'Menu Gastronomique Prestige (Or & Ardoise)',
            subtitle: 'Livre 2 volets 340 × 300 mm • Fond ardoise chic, double filet or InDesign, typographie Cinzel, 2 colonnes avec descriptions de chef.',
            category: 'menu_livret',
            format: 'menu_34x30',
            badge: 'Gastronomique ★',
            badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
            colors: ['#1c1917', '#c8a96a', '#f5f5f4'],
            icon: 'fa-utensils',
            builder(engine, mode = 'new_project') {
                const buildFace0 = (face) => {
                    face.name = 'Feuille 1 — Recto (Couverture & Dos)';
                    face.bgColor = '#1c1917';
                    face.objects = [
                        // Panneau Gauche : Dos de Menu épuré (0 à 170 mm)
                        { type: 'frame', x: 12, y: 12, w: 146, h: 276, borderColor: '#c8a96a', borderWidthPt: 1, backgroundColor: 'transparent', opacity: 0.6 },
                        { type: 'illustration', illustrationId: 'indesign_flourish_crest', x: 65, y: 35, w: 40, h: 20, color: '#c8a96a', opacity: 1 },
                        { type: 'title_heading', x: 20, y: 62, w: 130, h: 14, customName: 'L’ATELIER DES SENS', fontFamily: 'Cinzel', fontSizePt: 13, color: '#c8a96a', align: 'center' },
                        { type: 'illustration', illustrationId: 'indesign_rule_diamond', x: 35, y: 78, w: 100, h: 6, color: '#c8a96a', opacity: 0.8 },
                        { type: 'title_heading', x: 20, y: 110, w: 130, h: 10, customName: 'HEURES DE SERVICE', fontFamily: 'Montserrat', fontSizePt: 8.5, color: '#e7e5e4', align: 'center' },
                        { type: 'category_header', x: 25, y: 122, w: 120, h: 32, customName: 'Mardi au Dimanche\nDéjeuner : 12h00 — 14h30\nDîner : 19h30 — 22h30\nFermé le Lundi', fontFamily: 'Montserrat', fontSizePt: 7.5, color: '#a8a29e', align: 'center' },
                        { type: 'illustration', illustrationId: 'badge_fait_maison_pro', x: 70, y: 175, w: 30, h: 30, color: '#c8a96a', opacity: 0.9 },
                        { type: 'category_header', x: 20, y: 240, w: 130, h: 20, customName: '14, Boulevard de la Gastronomie • 75001 Paris\nRéservations : 01 42 68 00 00 • www.atelier-sens.fr', fontFamily: 'Montserrat', fontSizePt: 7, color: '#78716c', align: 'center' },

                        // Panneau Droit : Couverture Prestige (170 à 340 mm)
                        { type: 'frame', x: 182, y: 12, w: 146, h: 276, borderColor: '#c8a96a', borderWidthPt: 1.5, backgroundColor: 'transparent', opacity: 0.8 },
                        { type: 'frame', x: 185, y: 15, w: 140, h: 270, borderColor: '#c8a96a', borderWidthPt: 0.5, backgroundColor: 'transparent', opacity: 0.4 },
                        { type: 'illustration', illustrationId: 'cloche_prestige', x: 232, y: 45, w: 46, h: 32, color: '#c8a96a', opacity: 1 },
                        { type: 'illustration', illustrationId: 'indesign_rule_floral', x: 200, y: 88, w: 110, h: 8, color: '#c8a96a', opacity: 0.9 },
                        { type: 'title_heading', x: 190, y: 105, w: 130, h: 26, customName: 'L’ATELIER\nDES SENS', fontFamily: 'Cinzel', fontSizePt: 22, color: '#f5f5f4', align: 'center' },
                        { type: 'title_heading', x: 190, y: 138, w: 130, h: 10, customName: 'RESTAURANT GASTRONOMIQUE', fontFamily: 'Montserrat', fontSizePt: 8, color: '#c8a96a', align: 'center' },
                        { type: 'illustration', illustrationId: 'badge_michelin_star5', x: 235, y: 154, w: 40, h: 16, color: '#c8a96a', opacity: 1 },
                        { type: 'illustration', illustrationId: 'indesign_rule_diamond', x: 205, y: 180, w: 100, h: 6, color: '#c8a96a', opacity: 0.8 },
                        { type: 'title_heading', x: 190, y: 200, w: 130, h: 12, customName: 'CARTE & MENUS DE SAISON', fontFamily: 'Cinzel', fontSizePt: 10, color: '#e7e5e4', align: 'center' },
                        { type: 'category_header', x: 190, y: 245, w: 130, h: 18, customName: 'Cuisine d’auteur signée par le Chef Exécutif\nProduits d’exception & Terroirs de France', fontFamily: 'Playfair Display', fontSizePt: 8, color: '#a8a29e', align: 'center' }
                    ];
                };

                const buildFaceInterior = (face) => {
                    face.name = 'Feuille 1 — Verso (Entrées & Plats Signatures)';
                    face.bgColor = '#1c1917';
                    face.objects = [
                        // Panneau Gauche : Les Entrées & Mises en bouche
                        { type: 'frame', x: 12, y: 12, w: 146, h: 276, borderColor: '#c8a96a', borderWidthPt: 0.8, backgroundColor: 'transparent', opacity: 0.5 },
                        { type: 'title_heading', x: 20, y: 22, w: 130, h: 12, customName: 'LES ENTRÉES & PRÉLUDES', fontFamily: 'Cinzel', fontSizePt: 12, color: '#c8a96a', align: 'center' },
                        { type: 'illustration', illustrationId: 'indesign_rule_diamond', x: 35, y: 35, w: 100, h: 6, color: '#c8a96a', opacity: 0.8 },
                        { type: 'dish_item', x: 20, y: 48, w: 130, h: 22, customName: 'Foie Gras de Canard Maison Poêlé', customDesc: 'Chutney de figues de Solliès au vieux balsamique, brioche toastée.', customPrice: '28 €', fontSizePt: 9.5, color: '#f5f5f4', priceColor: '#c8a96a', dotsColor: '#a8a29e' },
                        { type: 'dish_item', x: 20, y: 76, w: 130, h: 22, customName: 'Noix de Saint-Jacques Dorées au Beurre Demi-Sel', customDesc: 'Mousseline de panais à la vanille bourbon, émulsion de corail truffée.', customPrice: '32 €', fontSizePt: 9.5, color: '#f5f5f4', priceColor: '#c8a96a', dotsColor: '#a8a29e' },
                        { type: 'dish_item', x: 20, y: 104, w: 130, h: 22, customName: 'Carpaccio de Langoustines Royales Marinées', customDesc: 'Perles de caviar osciètre, gelée d’eau de tomate et huile de combava.', customPrice: '34 €', fontSizePt: 9.5, color: '#f5f5f4', priceColor: '#c8a96a', dotsColor: '#a8a29e' },
                        { type: 'dish_item', x: 20, y: 132, w: 130, h: 22, customName: 'Velouté Onctueux de Potimarron & Châtaignes', customDesc: 'Éclats de noisettes torréfiées du Piémont et copeaux de truffe noire.', customPrice: '22 €', fontSizePt: 9.5, color: '#f5f5f4', priceColor: '#c8a96a', dotsColor: '#a8a29e' },
                        // Encadré Menu Dégustation en bas à gauche
                        { type: 'frame', x: 20, y: 170, w: 130, h: 64, backgroundColor: '#292524', borderColor: '#c8a96a', borderWidthPt: 1, borderRadius: 4 },
                        { type: 'title_heading', x: 26, y: 176, w: 118, h: 10, customName: 'MENU DÉGUSTATION EN 6 TEMPS', fontFamily: 'Cinzel', fontSizePt: 9.5, color: '#c8a96a', align: 'center' },
                        { type: 'category_header', x: 26, y: 189, w: 118, h: 26, customName: 'Laissez-vous guider par l’inspiration du Chef au fil des arrivages.\nServi pour l’ensemble de la table • 115 € / pers.\nAccord Grands Crus du Sommelier (5 verres) : +55 €', fontFamily: 'Playfair Display', fontSizePt: 7.5, color: '#e7e5e4', align: 'center' },
                        { type: 'illustration', illustrationId: 'badge_chef_signature_star', x: 68, y: 242, w: 34, h: 34, color: '#c8a96a', opacity: 0.9 },

                        // Panneau Droit : Les Plats Principaux & Créations
                        { type: 'frame', x: 182, y: 12, w: 146, h: 276, borderColor: '#c8a96a', borderWidthPt: 0.8, backgroundColor: 'transparent', opacity: 0.5 },
                        { type: 'title_heading', x: 190, y: 22, w: 130, h: 12, customName: 'PLATS & CRÉATIONS SIGNATURES', fontFamily: 'Cinzel', fontSizePt: 12, color: '#c8a96a', align: 'center' },
                        { type: 'illustration', illustrationId: 'indesign_rule_diamond', x: 205, y: 35, w: 100, h: 6, color: '#c8a96a', opacity: 0.8 },
                        { type: 'dish_item', x: 190, y: 48, w: 130, h: 24, customName: 'Filet de Bœuf Wagyu Saisi au Grill', customDesc: 'Pomme purée à la truffe melanosporum, jus corsé au porto vintage.', customPrice: '52 €', fontSizePt: 9.5, color: '#f5f5f4', priceColor: '#c8a96a', dotsColor: '#a8a29e' },
                        { type: 'dish_item', x: 190, y: 78, w: 130, h: 24, customName: 'Bar de Ligne Cuit sur Peau Croustillante', customDesc: 'Fondue de poireaux à l’anis sauvage, jus réduit de coquillages safrané.', customPrice: '44 €', fontSizePt: 9.5, color: '#f5f5f4', priceColor: '#c8a96a', dotsColor: '#a8a29e' },
                        { type: 'dish_item', x: 190, y: 108, w: 130, h: 24, customName: 'Pigeon Fermier Rôti en Deux Cuissons', customDesc: 'Les cuisses confites, suprêmes rosés, mousseline de céleri et griottes.', customPrice: '46 €', fontSizePt: 9.5, color: '#f5f5f4', priceColor: '#c8a96a', dotsColor: '#a8a29e' },
                        { type: 'dish_item', x: 190, y: 138, w: 130, h: 24, customName: 'Risotto Carnaroli aux Morilles Fraîches', customDesc: 'Parmigiano Reggiano 36 mois, émulsion d’ail noir et pousses de roquette.', customPrice: '38 €', fontSizePt: 9.5, color: '#f5f5f4', priceColor: '#c8a96a', dotsColor: '#a8a29e' },
                        // Section Fromages & Desserts
                        { type: 'title_heading', x: 190, y: 174, w: 130, h: 10, customName: 'FROMAGES AFFINÉS & HAUTE PÂTISSERIE', fontFamily: 'Cinzel', fontSizePt: 10.5, color: '#c8a96a', align: 'center' },
                        { type: 'dish_item', x: 190, y: 188, w: 130, h: 20, customName: 'Chariot de Fromages Affinés de nos Provinces', customDesc: 'Sélection du Maître Fromager, pain aux noix et fruits secs.', customPrice: '18 €', fontSizePt: 9, color: '#f5f5f4', priceColor: '#c8a96a', dotsColor: '#a8a29e' },
                        { type: 'dish_item', x: 190, y: 212, w: 130, h: 20, customName: 'Sphère Chocolat Grand Cru Guanaja 70%', customDesc: 'Cœur coulant praliné noisette, glace vanille de Madagascar.', customPrice: '19 €', fontSizePt: 9, color: '#f5f5f4', priceColor: '#c8a96a', dotsColor: '#a8a29e' },
                        { type: 'category_header', x: 190, y: 252, w: 130, h: 18, customName: 'Prix nets en Euros, taxes et service compris.\nToutes nos viandes sont certifiées d’origine française ou élevage sélectionné.', fontFamily: 'Playfair Display', fontSizePt: 7.5, color: '#a8a29e', align: 'center' }
                    ];
                };

                if (mode === 'single_face') {
                    buildFaceInterior(engine.currentFace || engine.faces[0]);
                } else {
                    engine.setFormat('menu_34x30', true);
                    buildFace0(engine.faces[0]);
                    if (engine.faces[1]) buildFaceInterior(engine.faces[1]);
                }
            }
        },

        // ====================================================================
        // 2. BRASSERIE & BISTROT PARISIEN (340×300 mm - 2 Volets)
        // ====================================================================
        {
            id: 'bistro_parisien_tradition',
            name: 'Brasserie & Bistrot Parisien Tradition',
            subtitle: 'Livre 2 volets 340 × 300 mm • Fond crème chaud, double filet bistrot, typographie Playfair Display en bordeaux & noir bistre.',
            category: 'menu_livret',
            format: 'menu_34x30',
            badge: 'Bistrot Parisien',
            badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
            colors: ['#fcfaf7', '#7f1d1d', '#1e293b'],
            icon: 'fa-plate-wheat',
            builder(engine, mode = 'new_project') {
                const buildFace = (face) => {
                    face.name = 'Menu Bistrot & Brasserie';
                    face.bgColor = '#fcfaf7';
                    face.objects = [
                        { type: 'frame', x: 12, y: 12, w: 146, h: 276, borderColor: '#7f1d1d', borderWidthPt: 1.5, backgroundColor: 'transparent' },
                        { type: 'frame', x: 15, y: 15, w: 140, h: 270, borderColor: '#7f1d1d', borderWidthPt: 0.5, backgroundColor: 'transparent', opacity: 0.5 },
                        { type: 'frame', x: 182, y: 12, w: 146, h: 276, borderColor: '#7f1d1d', borderWidthPt: 1.5, backgroundColor: 'transparent' },
                        { type: 'frame', x: 185, y: 15, w: 140, h: 270, borderColor: '#7f1d1d', borderWidthPt: 0.5, backgroundColor: 'transparent', opacity: 0.5 },

                        // Panneau Gauche
                        { type: 'title_heading', x: 20, y: 22, w: 130, h: 14, customName: 'LES ENTRÉES DU BISTROT', fontFamily: 'Playfair Display', fontSizePt: 13, color: '#7f1d1d', align: 'center' },
                        { type: 'illustration', illustrationId: 'indesign_rule_diamond', x: 35, y: 36, w: 100, h: 6, color: '#7f1d1d', opacity: 0.9 },
                        { type: 'dish_item', x: 20, y: 48, w: 130, h: 18, customName: 'Œufs Mayonnaise Traditionnels', customDesc: 'Mayonnaise maison montée à la moutarde de Dijon, herbes fraîches.', customPrice: '8,50 €', fontSizePt: 10, color: '#1e293b', priceColor: '#7f1d1d' },
                        { type: 'dish_item', x: 20, y: 72, w: 130, h: 18, customName: 'Soupe à l’Oignon Gratinée au Comté', customDesc: 'Bouillon mijoté au vin blanc, croûtons dorés et comté affiné 18 mois.', customPrice: '12,00 €', fontSizePt: 10, color: '#1e293b', priceColor: '#7f1d1d' },
                        { type: 'dish_item', x: 20, y: 96, w: 130, h: 18, customName: 'Escargots de Bourgogne Sauvages (les 6)', customDesc: 'Beurre persillé généreux à l’ail rose et échalotes confites.', customPrice: '14,00 €', fontSizePt: 10, color: '#1e293b', priceColor: '#7f1d1d' },
                        { type: 'dish_item', x: 20, y: 120, w: 130, h: 18, customName: 'Terrine de Campagne Maison au Poivre Vert', customDesc: 'Pain de campagne grillé au levain et cornichons au vinaigre de cidre.', customPrice: '10,50 €', fontSizePt: 10, color: '#1e293b', priceColor: '#7f1d1d' },
                        { type: 'dish_item', x: 20, y: 144, w: 130, h: 18, customName: 'Poireaux Vinaigrette & Éclats de Noisettes', customDesc: 'Vinaigrette à l’ancienne aux œufs mimosa et ciboulette.', customPrice: '9,50 €', fontSizePt: 10, color: '#1e293b', priceColor: '#7f1d1d' },

                        { type: 'title_heading', x: 20, y: 174, w: 130, h: 12, customName: 'LES DESSERTS DE TRADITION', fontFamily: 'Playfair Display', fontSizePt: 12, color: '#7f1d1d', align: 'center' },
                        { type: 'dish_item', x: 20, y: 190, w: 130, h: 18, customName: 'Profiteroles Géantes au Chocolat Chaud', customDesc: 'Choux craquelins, glace vanille artisanale et sauce Valrhona.', customPrice: '11,00 €', fontSizePt: 9.5, color: '#1e293b', priceColor: '#7f1d1d' },
                        { type: 'dish_item', x: 20, y: 212, w: 130, h: 18, customName: 'Crème Brûlée à la Gousse de Vanille Bourbon', customDesc: 'Caramélisée minute à la cassonade ambrée.', customPrice: '9,50 €', fontSizePt: 9.5, color: '#1e293b', priceColor: '#7f1d1d' },
                        { type: 'illustration', illustrationId: 'badge_fait_maison_pro', x: 68, y: 238, w: 34, h: 34, color: '#7f1d1d' },

                        // Panneau Droit
                        { type: 'title_heading', x: 190, y: 22, w: 130, h: 14, customName: 'PLATS AUTHENTIQUES & VIANDES', fontFamily: 'Playfair Display', fontSizePt: 13, color: '#7f1d1d', align: 'center' },
                        { type: 'illustration', illustrationId: 'indesign_rule_diamond', x: 205, y: 36, w: 100, h: 6, color: '#7f1d1d', opacity: 0.9 },
                        { type: 'dish_item', x: 190, y: 48, w: 130, h: 22, customName: 'Entrecôte Normande Grillée (300g)', customDesc: 'Sauce béarnaise minute, frites fraîches maison cuites au gras de bœuf.', customPrice: '26,50 €', fontSizePt: 10, color: '#1e293b', priceColor: '#7f1d1d' },
                        { type: 'dish_item', x: 190, y: 76, w: 130, h: 22, customName: 'Tartare de Bœuf Charolais au Couteau', customDesc: 'Assaisonné à votre goût, servi avec salade verte et frites maison.', customPrice: '19,50 €', fontSizePt: 10, color: '#1e293b', priceColor: '#7f1d1d' },
                        { type: 'dish_item', x: 190, y: 104, w: 130, h: 22, customName: 'Blanquette de Veau à l’Ancienne', customDesc: 'Riz pilaf parfumé, petits oignons glacés et champignons de Paris frais.', customPrice: '21,00 €', fontSizePt: 10, color: '#1e293b', priceColor: '#7f1d1d' },
                        { type: 'dish_item', x: 190, y: 132, w: 130, h: 22, customName: 'Filet de Canard Rôti au Miel de Thym', customDesc: 'Mousseline de carottes au cumin et jus caramélisé.', customPrice: '23,00 €', fontSizePt: 10, color: '#1e293b', priceColor: '#7f1d1d' },
                        { type: 'dish_item', x: 190, y: 160, w: 130, h: 22, customName: 'Sole Meunière Entière au Beurre Noisette', customDesc: 'Pommes de terre grenailles rôties au sel de Guérande et persil plat.', customPrice: '29,00 €', fontSizePt: 10, color: '#1e293b', priceColor: '#7f1d1d' },
                        { type: 'frame', x: 190, y: 192, w: 130, h: 42, backgroundColor: '#f5ebe0', borderColor: '#7f1d1d', borderWidthPt: 1, borderRadius: 4 },
                        { type: 'title_heading', x: 196, y: 197, w: 118, h: 9, customName: 'FORMULE SEMAINIER DU MIDI — 19,50 €', fontFamily: 'Cinzel', fontSizePt: 9.5, color: '#7f1d1d', align: 'center' },
                        { type: 'category_header', x: 196, y: 208, w: 118, h: 20, customName: 'Entrée du jour + Plat de l’ardoise + Café gourmand\nDu Lundi au Vendredi de 12h00 à 14h30', fontFamily: 'Montserrat', fontSizePt: 7.5, color: '#334155', align: 'center' },
                        { type: 'category_header', x: 190, y: 246, w: 130, h: 18, customName: 'Tous nos plats sont cuisinés sur place à partir de produits frais et bruts.\nService continu 7j/7 de 12h à minuit.', fontFamily: 'Montserrat', fontSizePt: 7.5, color: '#64748b', align: 'center' }
                    ];
                };

                if (mode === 'single_face') {
                    buildFace(engine.currentFace || engine.faces[0]);
                } else {
                    engine.setFormat('menu_34x30', true);
                    buildFace(engine.faces[0]);
                }
            }
        },

        // ====================================================================
        // 3. LIVRET COMPLET 10 FACES — ÉDITION GREY CORNER CAFÉ (340×300 mm)
        // ====================================================================
        {
            id: 'menu_grey_corner_complet',
            name: 'Livret Complet 10 Faces — Café & Restaurant (Style Grey Corner)',
            subtitle: 'Livre complet 5 feuilles / 10 faces 340 × 300 mm • Bandeaux verticaux 90°, catégories liées à la Base Centrale, photos vectorielles & couverture.',
            category: 'menu_livret',
            format: 'menu_34x30',
            badge: '10 Faces Auto',
            badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
            colors: ['#fdfbf7', '#9a3412', '#c5a059'],
            icon: 'fa-book-bookmark',
            builder(engine, mode = 'new_project') {
                if (mode === 'single_face') {
                    engine.populateSampleSpread1Recto(engine.currentFace || engine.faces[0]);
                } else {
                    engine.setFormat('menu_34x30', true);
                    if (typeof WordMenuImporter !== 'undefined') {
                        WordMenuImporter.autoLayoutAcrossSpreads(engine, engine.dishesDB, {
                            mode: 'full_auto_spreads',
                            theme: 'bistro_warm',
                            brandTitle: typeof GREY_CORNER_BRAND !== 'undefined' ? GREY_CORNER_BRAND.title : 'GREY CORNER',
                            brandSub: typeof GREY_CORNER_BRAND !== 'undefined' ? GREY_CORNER_BRAND.subtitle : 'café • SINCE 2024'
                        });
                    }
                }
            }
        },

        // ====================================================================
        // 4. TABLE MÉDITERRANÉENNE & POISSONS DU JOUR (340×300 mm)
        // ====================================================================
        {
            id: 'menu_mediterraneen_azur',
            name: 'Table Méditerranéenne & Poissons du Jour (Riviera & Or)',
            subtitle: 'Livre 2 volets 340 × 300 mm • Bleu abysses profond, filets dorés cuivrés, bandeaux latéraux 90°, Crudo, Pêche du jour & Pastas de la mer.',
            category: 'menu_livret',
            format: 'menu_34x30',
            badge: 'Riviera & Mer',
            badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
            colors: ['#0c2340', '#d4a359', '#f8fafc'],
            icon: 'fa-fish',
            builder(engine, mode = 'new_project') {
                const buildFace = (face) => {
                    face.name = 'Carte Riviera & Poissons Sauvages';
                    face.bgColor = '#0c2340';
                    face.objects = [
                        { type: 'frame', x: 12, y: 12, w: 146, h: 276, borderColor: '#d4a359', borderWidthPt: 1.2, backgroundColor: 'transparent', opacity: 0.7 },
                        { type: 'frame', x: 182, y: 12, w: 146, h: 276, borderColor: '#d4a359', borderWidthPt: 1.2, backgroundColor: 'transparent', opacity: 0.7 },

                        // Bandeaux verticaux InDesign
                        { type: 'vertical_banner', x: 16, y: 20, w: 12, h: 120, text: 'CRUDO & ENTRÉES', bgColor: '#d4a359', textColor: '#0c2340', fontSize: 10, radius: 2 },
                        { type: 'illustration', illustrationId: 'fish_sea_lemon', x: 72, y: 18, w: 38, h: 22, color: '#d4a359' },
                        { type: 'title_heading', x: 34, y: 42, w: 118, h: 12, customName: 'ÉCAILLER, CRUDO & ANTIPASTI', fontFamily: 'Cinzel', fontSizePt: 11, color: '#d4a359', align: 'left' },
                        { type: 'dish_item', x: 34, y: 58, w: 118, h: 22, customName: 'Ceviche de Daurade Royale aux Agrumes', customDesc: 'Lait de tigre au citron de Menton, grenade, coriandre et oignon rouge.', customPrice: '21 €', fontSizePt: 9.5, color: '#f8fafc', priceColor: '#d4a359' },
                        { type: 'dish_item', x: 34, y: 84, w: 118, h: 22, customName: 'Poulpe de Roche Grillé à la Plancha', customDesc: 'Houmous de pois chiches au citron confit, huile vierge au paprika fumé.', customPrice: '24 €', fontSizePt: 9.5, color: '#f8fafc', priceColor: '#d4a359' },
                        { type: 'dish_item', x: 34, y: 110, w: 118, h: 22, customName: 'Burrata Crémeuse des Pouilles (250g)', customDesc: 'Tomates anciennes cœur de bœuf, pesto de pistaches de Bronte.', customPrice: '19 €', fontSizePt: 9.5, color: '#f8fafc', priceColor: '#d4a359' },
                        { type: 'dish_item', x: 34, y: 136, w: 118, h: 22, customName: 'Fritto Misto de Calamars & Gambas Sauvages', customDesc: 'Sauce tartare maison aux câpres de Pantelleria et citron jaune.', customPrice: '22 €', fontSizePt: 9.5, color: '#f8fafc', priceColor: '#d4a359' },

                        { type: 'vertical_banner', x: 16, y: 170, w: 12, h: 100, text: 'PASTA DI MARE', bgColor: '#1e3a5f', textColor: '#d4a359', fontSize: 10, radius: 2 },
                        { type: 'title_heading', x: 34, y: 172, w: 118, h: 12, customName: 'PASTA FRESCA & RISOTTI DE LA MER', fontFamily: 'Cinzel', fontSizePt: 10.5, color: '#d4a359', align: 'left' },
                        { type: 'dish_item', x: 34, y: 188, w: 118, h: 22, customName: 'Linguine alle Vongole & Boutargue Sarde', customDesc: 'Palourdes sauvages, ail doux, vin blanc sec et persil plat.', customPrice: '26 €', fontSizePt: 9.5, color: '#f8fafc', priceColor: '#d4a359' },
                        { type: 'dish_item', x: 34, y: 214, w: 118, h: 22, customName: 'Paccheri au Ragoût de Homard Bleu', customDesc: 'Bisque corsée aux tomates datterini et basilic frais.', customPrice: '36 €', fontSizePt: 9.5, color: '#f8fafc', priceColor: '#d4a359' },
                        { type: 'dish_item', x: 34, y: 240, w: 118, h: 22, customName: 'Risotto Acquerello aux Gambas & Safran', customDesc: 'Zestes de citron vert bio et bisque réduite.', customPrice: '29 €', fontSizePt: 9.5, color: '#f8fafc', priceColor: '#d4a359' },

                        // Panneau Droit : Pêche du Jour & Grillades Marines
                        { type: 'vertical_banner', x: 186, y: 20, w: 12, h: 140, text: 'PÊCHE DU JOUR', bgColor: '#d4a359', textColor: '#0c2340', fontSize: 10, radius: 2 },
                        { type: 'title_heading', x: 204, y: 22, w: 118, h: 12, customName: 'LA CRIEE & POISSONS AU FEU DE BOIS', fontFamily: 'Cinzel', fontSizePt: 11, color: '#d4a359', align: 'left' },
                        { type: 'dish_item', x: 204, y: 40, w: 118, h: 24, customName: 'Loup de Méditerranée Entier en Croûte de Sel (2 pers.)', customDesc: 'Découpé en salle, légumes du soleil rôtis au thym et huile vierge.', customPrice: '78 €', fontSizePt: 9.5, color: '#f8fafc', priceColor: '#d4a359' },
                        { type: 'dish_item', x: 204, y: 68, w: 118, h: 24, customName: 'Pavé de Thon Rouge Mi-Cuit au Sésame Doré', customDesc: 'Mousseline de patate douce au gingembre, pak-choï snacké au wok.', customPrice: '31 €', fontSizePt: 9.5, color: '#f8fafc', priceColor: '#d4a359' },
                        { type: 'dish_item', x: 204, y: 96, w: 118, h: 24, customName: 'Saint-Pierre Rôti au Fenouil Sauvage', customDesc: 'Artichauts violets barigoule, olives Taggiasche et jus de bouillabaisse.', customPrice: '35 €', fontSizePt: 9.5, color: '#f8fafc', priceColor: '#d4a359' },
                        { type: 'dish_item', x: 204, y: 124, w: 118, h: 24, customName: 'Plancha Royale de la Mer (Gambas, Saint-Jacques, Seiche)', customDesc: 'Risotto crémeux au parmesan et vierge d’herbes fraîches.', customPrice: '39 €', fontSizePt: 9.5, color: '#f8fafc', priceColor: '#d4a359' },

                        // Cartouche Dolci & Agrumes
                        { type: 'frame', x: 186, y: 170, w: 136, h: 98, backgroundColor: '#132f54', borderColor: '#d4a359', borderWidthPt: 1, borderRadius: 4 },
                        { type: 'title_heading', x: 194, y: 176, w: 120, h: 10, customName: 'DOUCEURS DU SUD & AGRUMES', fontFamily: 'Cinzel', fontSizePt: 10.5, color: '#d4a359', align: 'center' },
                        { type: 'dish_item', x: 194, y: 190, w: 120, h: 20, customName: 'Tarte au Citron de Menton Meringuée', customDesc: 'Sablé breton, crémeux acidulé et meringue italienne flambée.', customPrice: '12 €', fontSizePt: 9, color: '#f8fafc', priceColor: '#d4a359' },
                        { type: 'dish_item', x: 194, y: 214, w: 120, h: 20, customName: 'Tiramisu Classico au Café Espresso & Amaretto', customDesc: 'Mascarpone onctueux, cacao amer Valrhona.', customPrice: '11 €', fontSizePt: 9, color: '#f8fafc', priceColor: '#d4a359' },
                        { type: 'dish_item', x: 194, y: 238, w: 120, h: 20, customName: 'Pavlova aux Fruits Rouges & Basilic Frais', customDesc: 'Chantilly légère au mascarpone et coulis de framboise.', customPrice: '13 €', fontSizePt: 9, color: '#f8fafc', priceColor: '#d4a359' }
                    ];
                };

                if (mode === 'single_face') {
                    buildFace(engine.currentFace || engine.faces[0]);
                } else {
                    engine.setFormat('menu_34x30', true);
                    buildFace(engine.faces[0]);
                }
            }
        },

        // ====================================================================
        // 5. PALAIS MAROCAIN & TABLE D'HÔTES PRESTIGE (340×300 mm)
        // ====================================================================
        {
            id: 'menu_palais_oriental_fes',
            name: 'Palais Marocain & Table d’Hôtes Prestige (Fès / Marrakech)',
            subtitle: 'Livre 2 volets 340 × 300 mm • Vert émeraude impérial, or safran & ivoire • Kemia, Pastillas, Tajines Royaux, Couscous & Thé à la menthe.',
            category: 'menu_livret',
            format: 'menu_34x30',
            badge: 'Haute Tradition',
            badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
            colors: ['#064e3b', '#d97706', '#fdfbf7'],
            icon: 'fa-crown',
            builder(engine, mode = 'new_project') {
                const buildFace = (face) => {
                    face.name = 'Carte Palais Marocain & Tajines';
                    face.bgColor = '#fdfbf7';
                    face.objects = [
                        // Encadrements Émeraude & Or
                        { type: 'frame', x: 12, y: 12, w: 146, h: 276, borderColor: '#064e3b', borderWidthPt: 2, backgroundColor: 'transparent' },
                        { type: 'frame', x: 15, y: 15, w: 140, h: 270, borderColor: '#d97706', borderWidthPt: 0.8, backgroundColor: 'transparent' },
                        { type: 'frame', x: 182, y: 12, w: 146, h: 276, borderColor: '#064e3b', borderWidthPt: 2, backgroundColor: 'transparent' },
                        { type: 'frame', x: 185, y: 15, w: 140, h: 270, borderColor: '#d97706', borderWidthPt: 0.8, backgroundColor: 'transparent' },

                        // Panneau Gauche : Salades Marocaines & Pastillas
                        { type: 'illustration', illustrationId: 'indesign_flourish_crest', x: 65, y: 20, w: 40, h: 16, color: '#d97706' },
                        { type: 'title_heading', x: 22, y: 38, w: 126, h: 12, customName: 'KEMIA, SALADES FINES & PASTILLAS', fontFamily: 'Cinzel', fontSizePt: 11.5, color: '#064e3b', align: 'center' },
                        { type: 'illustration', illustrationId: 'indesign_rule_floral', x: 35, y: 50, w: 100, h: 6, color: '#d97706' },
                        { type: 'dish_item', x: 22, y: 62, w: 126, h: 22, customName: 'Assortiment Royal de Salades Marocaines (Zaalouk, Taktouka)', customDesc: 'Caviar d’aubergines fumées, poivrons doux confits, carottes au cumin.', customPrice: '85 DH', fontSizePt: 9.5, color: '#1e293b', priceColor: '#b45309' },
                        { type: 'dish_item', x: 22, y: 88, w: 126, h: 22, customName: 'Pastilla Fassi Traditionnelle au Pigeon & Amandes', customDesc: 'Feuilles de ouarka croustillantes, amandes torréfiées, fleur d’oranger et cannelle.', customPrice: '120 DH', fontSizePt: 9.5, color: '#1e293b', priceColor: '#b45309' },
                        { type: 'dish_item', x: 22, y: 114, w: 126, h: 22, customName: 'Pastilla de l’Océan aux Fruits de Mer & Vermicelles', customDesc: 'Gambas, calamars, poisson blanc, champignons noirs et coriandre fraîche.', customPrice: '115 DH', fontSizePt: 9.5, color: '#1e293b', priceColor: '#b45309' },
                        { type: 'dish_item', x: 22, y: 140, w: 126, h: 22, customName: 'Quatuor de Briouates Croustillantes Faites Maison', customDesc: 'Jben aux herbes, kefta aux épices douces, poulet citronné et crevettes.', customPrice: '75 DH', fontSizePt: 9.5, color: '#1e293b', priceColor: '#b45309' },
                        { type: 'dish_item', x: 22, y: 166, w: 126, h: 20, customName: 'Harira Marrakchia Traditionnelle', customDesc: 'Servie avec dattes Majhoul, chebakia au miel et quartier de citron.', customPrice: '55 DH', fontSizePt: 9.5, color: '#1e293b', priceColor: '#b45309' },

                        { type: 'frame', x: 22, y: 196, w: 126, h: 74, backgroundColor: '#064e3b', borderColor: '#d97706', borderWidthPt: 1, borderRadius: 4 },
                        { type: 'title_heading', x: 28, y: 204, w: 114, h: 10, customName: 'MENU DÉCOUVERTE DU RIAD — 260 DH', fontFamily: 'Cinzel', fontSizePt: 10, color: '#fbbf24', align: 'center' },
                        { type: 'category_header', x: 28, y: 218, w: 114, h: 42, customName: 'Trilogie de Salades Marocaines ou Briouates\n•\nTajine ou Couscous au choix à la carte\n•\nJawhara (Pastilla au lait) & Thé à la Menthe Fraîche', fontFamily: 'Playfair Display', fontSizePt: 8, color: '#ecfdf5', align: 'center' },

                        // Panneau Droit : Tajines & Couscous
                        { type: 'illustration', illustrationId: 'indesign_flourish_crest', x: 235, y: 20, w: 40, h: 16, color: '#d97706' },
                        { type: 'title_heading', x: 192, y: 38, w: 126, h: 12, customName: 'TAJINES MIJOTÉS & GRANDS COUSCOUS', fontFamily: 'Cinzel', fontSizePt: 11.5, color: '#064e3b', align: 'center' },
                        { type: 'illustration', illustrationId: 'indesign_rule_floral', x: 205, y: 50, w: 100, h: 6, color: '#d97706' },
                        { type: 'dish_item', x: 192, y: 62, w: 126, h: 22, customName: 'Tajine d’Agneau Mrouzia aux Pruneaux & Amandes', customDesc: 'Épaule d’agneau fondante au safran pur de Taliouine, sésame doré.', customPrice: '135 DH', fontSizePt: 9.5, color: '#1e293b', priceColor: '#b45309' },
                        { type: 'dish_item', x: 192, y: 88, w: 126, h: 22, customName: 'Tajine de Poulet Fermier au Citron Confit & Olives', customDesc: 'Olives rouges Meslalla, pommes de terre fondantes et safran.', customPrice: '110 DH', fontSizePt: 9.5, color: '#1e293b', priceColor: '#b45309' },
                        { type: 'dish_item', x: 192, y: 114, w: 126, h: 22, customName: 'Tanjia Marrakchia au Jarret de Bœuf Confit 6 Heures', customDesc: 'Cumin beldi, ail confit, smen doux et citron mariné.', customPrice: '140 DH', fontSizePt: 9.5, color: '#1e293b', priceColor: '#b45309' },
                        { type: 'dish_item', x: 192, y: 140, w: 126, h: 22, customName: 'Couscous Royal aux Sept Légumes & Tfaya', customDesc: 'Semoule fine roulée main, agneau, poulet, merguez, oignons caramélisés aux raisins.', customPrice: '145 DH', fontSizePt: 9.5, color: '#1e293b', priceColor: '#b45309' },

                        { type: 'title_heading', x: 192, y: 172, w: 126, h: 12, customName: 'DOUCEURS ORIENTALES & THÉS', fontFamily: 'Cinzel', fontSizePt: 11, color: '#064e3b', align: 'center' },
                        { type: 'dish_item', x: 192, y: 188, w: 126, h: 20, customName: 'Jawhara (Pastilla au Lait à la Fleur d’Oranger)', customDesc: 'Feuilles croustillantes, crème légère et éclats d’amandes.', customPrice: '65 DH', fontSizePt: 9.5, color: '#1e293b', priceColor: '#b45309' },
                        { type: 'dish_item', x: 192, y: 212, w: 126, h: 20, customName: 'Assiette de Pâtisseries Marocaines & Thé à la Menthe', customDesc: 'Cornes de gazelle pur amande, ghriba et briouates au miel.', customPrice: '70 DH', fontSizePt: 9.5, color: '#1e293b', priceColor: '#b45309' },
                        { type: 'category_header', x: 192, y: 248, w: 126, h: 18, customName: 'Pain Tafarnout cuit au four traditionnel servi chaud à discrétion.\nTous nos plats sont préparés à la commande.', fontFamily: 'Montserrat', fontSizePt: 7.5, color: '#64748b', align: 'center' }
                    ];
                };

                if (mode === 'single_face') {
                    buildFace(engine.currentFace || engine.faces[0]);
                } else {
                    engine.setFormat('menu_34x30', true);
                    buildFace(engine.faces[0]);
                }
            }
        },

        // ====================================================================
        // 6. MENU ART DÉCO 1920 — ROARING TWENTIES (340×300 mm)
        // ====================================================================
        {
            id: 'menu_art_deco_gatsby',
            name: 'Menu Art Déco 1920 — Grand Hôtel & Speakeasy (Noir & Laiton)',
            subtitle: 'Livre 2 volets 340 × 300 mm • Époque Gatsby, cadres géométriques Art Déco, filets laiton, Soupers fins, Caviar & Grands Classiques.',
            category: 'menu_livret',
            format: 'menu_34x30',
            badge: 'Art Déco 1920',
            badgeColor: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
            colors: ['#0a0a0c', '#eab308', '#fef9c3'],
            icon: 'fa-champagne-glasses',
            builder(engine, mode = 'new_project') {
                const buildFace = (face) => {
                    face.name = 'Carte Art Déco Grand Hôtel';
                    face.bgColor = '#0a0a0c';
                    face.objects = [
                        { type: 'illustration', illustrationId: 'frame_artdeco_border', x: 10, y: 10, w: 150, h: 280, color: '#eab308', opacity: 0.85 },
                        { type: 'illustration', illustrationId: 'frame_artdeco_border', x: 180, y: 10, w: 150, h: 280, color: '#eab308', opacity: 0.85 },

                        // Panneau Gauche
                        { type: 'title_heading', x: 24, y: 26, w: 122, h: 12, customName: 'CAVIARS, HUÎTRES & PRÉLUDES', fontFamily: 'Cinzel', fontSizePt: 11.5, color: '#eab308', align: 'center' },
                        { type: 'illustration', illustrationId: 'vintage_divider', x: 40, y: 39, w: 90, h: 7, color: '#eab308' },
                        { type: 'dish_item', x: 24, y: 52, w: 122, h: 22, customName: 'Six Huîtres Gillardeau N°2 sur Glace Vive', customDesc: 'Vinaigre à l’échalote grise, beurre de baratte demi-sel et pain de seigle.', customPrice: '29 €', fontSizePt: 9.5, color: '#fef9c3', priceColor: '#eab308' },
                        { type: 'dish_item', x: 24, y: 78, w: 122, h: 22, customName: 'Caviar Baeri Impérial (30g) & Blinis Tièdes', customDesc: 'Crème double d’Isigny et condiments traditionnels.', customPrice: '85 €', fontSizePt: 9.5, color: '#fef9c3', priceColor: '#eab308' },
                        { type: 'dish_item', x: 24, y: 104, w: 122, h: 22, customName: 'Cœur de Saumon Écossais Fumé au Bois de Hêtre', customDesc: 'Crème acidulée à l’aneth sauvage et citron grillé.', customPrice: '26 €', fontSizePt: 9.5, color: '#fef9c3', priceColor: '#eab308' },
                        { type: 'dish_item', x: 24, y: 130, w: 122, h: 22, customName: 'Pâté en Croûte Richelieu au Foie Gras & Pistaches', customDesc: 'Gelée au vieux madère et pickles de légumes racines.', customPrice: '27 €', fontSizePt: 9.5, color: '#fef9c3', priceColor: '#eab308' },

                        { type: 'title_heading', x: 24, y: 164, w: 122, h: 12, customName: 'LES GRANDS CLASSIQUES DU PALACE', fontFamily: 'Cinzel', fontSizePt: 11, color: '#eab308', align: 'center' },
                        { type: 'dish_item', x: 24, y: 180, w: 122, h: 24, customName: 'Homard Bleu en Thermidor Gratiné au Vieux Comté', customDesc: 'Moutarde fine, cognac flambé et estragon frais.', customPrice: '64 €', fontSizePt: 9.5, color: '#fef9c3', priceColor: '#eab308' },
                        { type: 'dish_item', x: 24, y: 208, w: 122, h: 24, customName: 'Tournedos Rossini au Foie Gras Poêlé & Truffe', customDesc: 'Cœur de filet de bœuf, escalope de foie gras chaud, sauce Périgueux.', customPrice: '56 €', fontSizePt: 9.5, color: '#fef9c3', priceColor: '#eab308' },
                        { type: 'dish_item', x: 24, y: 236, w: 122, h: 24, customName: 'Vol-au-Vent Impérial aux Ris de Veau & Morilles', customDesc: 'Feuilletage aérien pur beurre, quenelles de volaille et sauce suprême.', customPrice: '48 €', fontSizePt: 9.5, color: '#fef9c3', priceColor: '#eab308' },

                        // Panneau Droit : Couverture Art Déco
                        { type: 'illustration', illustrationId: 'champagne_flute_stars', x: 233, y: 38, w: 44, h: 36, color: '#eab308' },
                        { type: 'title_heading', x: 195, y: 84, w: 120, h: 28, customName: 'LE GRAND\nMAJESTIC', fontFamily: 'Cinzel', fontSizePt: 23, color: '#fef9c3', align: 'center' },
                        { type: 'title_heading', x: 195, y: 118, w: 120, h: 10, customName: 'SOUPERS FINS • CHAMPAGNES • JAZZ CLUB', fontFamily: 'Montserrat', fontSizePt: 8, color: '#eab308', align: 'center' },
                        { type: 'illustration', illustrationId: 'indesign_rule_double', x: 205, y: 134, w: 100, h: 6, color: '#eab308' },
                        { type: 'frame', x: 198, y: 152, w: 114, h: 78, backgroundColor: '#141418', borderColor: '#eab308', borderWidthPt: 1, borderRadius: 2 },
                        { type: 'title_heading', x: 204, y: 160, w: 102, h: 10, customName: 'LES DESSERTS FLAMBÉS EN SALLE', fontFamily: 'Cinzel', fontSizePt: 9.5, color: '#eab308', align: 'center' },
                        { type: 'dish_item', x: 204, y: 174, w: 102, h: 20, customName: 'Crêpes Suzette Flambées au Grand Marnier', customDesc: 'Beurre d’agrumes caramélisé devant vous.', customPrice: '22 €', fontSizePt: 8.5, color: '#fef9c3', priceColor: '#eab308' },
                        { type: 'dish_item', x: 204, y: 198, w: 102, h: 20, customName: 'Omelette Norvégienne Flambée au Rhum Ambré', customDesc: 'Meringue dorée et cœur glacé vanille-framboise.', customPrice: '24 €', fontSizePt: 8.5, color: '#fef9c3', priceColor: '#eab308' },
                        { type: 'category_header', x: 195, y: 248, w: 120, h: 18, customName: 'Orchestre Live tous les Jeudis, Vendredis & Samedis dès 20h30\nTenue de soirée appréciée • Service Voiturier', fontFamily: 'Montserrat', fontSizePt: 7.5, color: '#a1a1aa', align: 'center' }
                    ];
                };

                if (mode === 'single_face') {
                    buildFace(engine.currentFace || engine.faces[0]);
                } else {
                    engine.setFormat('menu_34x30', true);
                    buildFace(engine.faces[0]);
                }
            }
        },

        // ====================================================================
        // 7. SALON DE THÉ & HAUTE PÂTISSERIE FRANÇAISE (340×300 mm)
        // ====================================================================
        {
            id: 'salon_the_patisserie_fine',
            name: 'Salon de Thé & Haute Pâtisserie Française (Rose Poudré & Or)',
            subtitle: 'Livre 2 volets 340 × 300 mm • Crème poudrée, bordeaux velours & or, Entremets signatures, Macarons, Thés Grands Crus & Chocolat chaud.',
            category: 'cafe_patisserie',
            format: 'menu_34x30',
            badge: 'Salon de Thé',
            badgeColor: 'bg-pink-500/20 text-pink-300 border-pink-500/40',
            colors: ['#fffaf8', '#881337', '#b45309'],
            icon: 'fa-cake-candles',
            builder(engine, mode = 'new_project') {
                const buildFace = (face) => {
                    face.name = 'Carte Salon de Thé & Pâtisseries';
                    face.bgColor = '#fffaf8';
                    face.objects = [
                        { type: 'frame', x: 12, y: 12, w: 146, h: 276, borderColor: '#b45309', borderWidthPt: 1.2, backgroundColor: 'transparent' },
                        { type: 'frame', x: 182, y: 12, w: 146, h: 276, borderColor: '#b45309', borderWidthPt: 1.2, backgroundColor: 'transparent' },

                        // Panneau Gauche : Pâtisseries & Tea Time
                        { type: 'illustration', illustrationId: 'macaron_haute_couture', x: 68, y: 18, w: 34, h: 22, color: '#881337' },
                        { type: 'title_heading', x: 20, y: 42, w: 130, h: 12, customName: 'HAUTE PÂTISSERIE & ENTREMETS', fontFamily: 'Cinzel', fontSizePt: 12, color: '#881337', align: 'center' },
                        { type: 'illustration', illustrationId: 'indesign_rule_floral', x: 35, y: 54, w: 100, h: 6, color: '#b45309' },
                        { type: 'dish_item', x: 20, y: 66, w: 130, h: 22, customName: 'Le Saint-Honoré Vanille de Tahiti & Pécan', customDesc: 'Pâte feuilletée inversée caramélisée, choux garnis et chantilly mascarpone.', customPrice: '10,50 €', fontSizePt: 9.5, color: '#1e293b', priceColor: '#881337' },
                        { type: 'dish_item', x: 20, y: 92, w: 130, h: 22, customName: 'L’Éclair Framboise, Litchi & Eau de Rose', customDesc: 'Crémeux framboise intense, compotée de litchi et pétales cristallisés.', customPrice: '9,50 €', fontSizePt: 9.5, color: '#1e293b', priceColor: '#881337' },
                        { type: 'dish_item', x: 20, y: 118, w: 130, h: 22, customName: 'Millefeuille Minute Praliné Noisette du Piémont', customDesc: 'Monté à la commande, feuilletage croustillant et mousseline praliné.', customPrice: '11,00 €', fontSizePt: 9.5, color: '#1e293b', priceColor: '#881337' },
                        { type: 'dish_item', x: 20, y: 144, w: 130, h: 22, customName: 'Coffret Dégustation de 6 Macarons Signatures', customDesc: 'Pistache d’Iran, Chocolat noir, Fleur d’oranger, Citron, Caramel salé, Rose.', customPrice: '15,00 €', fontSizePt: 9.5, color: '#1e293b', priceColor: '#881337' },

                        { type: 'frame', x: 20, y: 178, w: 130, h: 86, backgroundColor: '#fdf2f8', borderColor: '#881337', borderWidthPt: 1, borderRadius: 6 },
                        { type: 'illustration', illustrationId: 'layer_cake_festive', x: 72, y: 184, w: 26, h: 22, color: '#881337' },
                        { type: 'title_heading', x: 26, y: 208, w: 118, h: 10, customName: 'LE GRAND TEA TIME IMPÉRIAL — 34 €', fontFamily: 'Cinzel', fontSizePt: 10, color: '#881337', align: 'center' },
                        { type: 'category_header', x: 26, y: 220, w: 118, h: 36, customName: 'Trois finger-sandwiches salés (Saumon, Concombre, Comté truffé)\nScones tièdes, clotted cream & confiture de fraises Gariguette\nPâtisserie au choix au chariot + Thé Grand Cru ou Chocolat à l’ancienne', fontFamily: 'Playfair Display', fontSizePt: 8, color: '#4c0519', align: 'center' },

                        // Panneau Droit : Thés Grands Crus & Chocolats
                        { type: 'illustration', illustrationId: 'coffee_cup_steam', x: 238, y: 18, w: 34, h: 22, color: '#b45309' },
                        { type: 'title_heading', x: 190, y: 42, w: 130, h: 12, customName: 'THÉS GRANDS CRUS & INFUSIONS D’EXCEPTION', fontFamily: 'Cinzel', fontSizePt: 11.5, color: '#881337', align: 'center' },
                        { type: 'illustration', illustrationId: 'indesign_rule_floral', x: 205, y: 54, w: 100, h: 6, color: '#b45309' },
                        { type: 'dish_item', x: 190, y: 66, w: 130, h: 20, customName: 'Darjeeling First Flush Margaret’s Hope (Inde)', customDesc: 'Notes florales délicates et muscatées, récolte de printemps.', customPrice: '8,50 €', fontSizePt: 9.5, color: '#1e293b', priceColor: '#881337' },
                        { type: 'dish_item', x: 190, y: 90, w: 130, h: 20, customName: 'Thé Vert Impérial Jasmin Chung Hao (Chine)', customDesc: 'Feuilles tendres parfumées aux fleurs de jasmin fraîches.', customPrice: '8,00 €', fontSizePt: 9.5, color: '#1e293b', priceColor: '#881337' },
                        { type: 'dish_item', x: 190, y: 114, w: 130, h: 20, customName: 'Matcha Cérémonial Uji Fouetté au Bambou', customDesc: 'Servi pur ou en Matcha Latte au lait d’avoine bio.', customPrice: '7,50 €', fontSizePt: 9.5, color: '#1e293b', priceColor: '#881337' },

                        { type: 'title_heading', x: 190, y: 148, w: 130, h: 12, customName: 'CHOCOLATS CHAUDS & CAFÉS DE SPÉCIALITÉ', fontFamily: 'Cinzel', fontSizePt: 11, color: '#881337', align: 'center' },
                        { type: 'dish_item', x: 190, y: 164, w: 130, h: 22, customName: 'Le Chocolat Chaud à l’Ancienne en Chocolatière', customDesc: 'Assemblage 70% Tanzanie & Venezuela, servi avec pot de chantilly vanillée.', customPrice: '9,00 €', fontSizePt: 9.5, color: '#1e293b', priceColor: '#881337' },
                        { type: 'dish_item', x: 190, y: 190, w: 130, h: 22, customName: 'Café Viennois & Éclats de Nougatine', customDesc: 'Double espresso 100% Arabica Éthiopie, crème fouettée et copeaux chocolat.', customPrice: '7,00 €', fontSizePt: 9.5, color: '#1e293b', priceColor: '#881337' },
                        { type: 'dish_item', x: 190, y: 216, w: 130, h: 22, customName: 'Coupe de Champagne Rosé & Duo de Macarons', customDesc: 'Cuvée Prestige servie frappée.', customPrice: '18,00 €', fontSizePt: 9.5, color: '#1e293b', priceColor: '#881337' }
                    ];
                };

                if (mode === 'single_face') {
                    buildFace(engine.currentFace || engine.faces[0]);
                } else {
                    engine.setFormat('menu_34x30', true);
                    buildFace(engine.faces[0]);
                }
            }
        },

        // ====================================================================
        // 8. COFFEE SHOP & TORRÉFACTEUR ARTISANAL (A4 Portrait)
        // ====================================================================
        {
            id: 'coffee_shop_barista_a4',
            name: 'Carte Coffee Shop & Torréfacteur Artisanal (A4)',
            subtitle: 'Format A4 210 × 297 mm • Style éditorial Kinfolk / Barista • Espresso Bar, Latte Signatures, Méthodes Douces V60/Chemex & Brunch.',
            category: 'cafe_patisserie',
            format: 'flyer_a4_portrait',
            badge: 'Coffee Shop A4',
            badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
            colors: ['#f5f0e6', '#3e2723', '#b45309'],
            icon: 'fa-mug-hot',
            builder(engine, mode = 'new_project') {
                const buildFace = (face) => {
                    face.name = 'Carte Coffee Shop & Barista A4';
                    face.bgColor = '#f5f0e6';
                    face.objects = [
                        { type: 'frame', x: 10, y: 10, w: 190, h: 277, borderColor: '#3e2723', borderWidthPt: 1.2, backgroundColor: 'transparent' },
                        { type: 'illustration', illustrationId: 'chemex_coffee_maker', x: 92, y: 16, w: 26, h: 24, color: '#3e2723' },
                        { type: 'title_heading', x: 20, y: 42, w: 170, h: 14, customName: 'ROASTERY & SPECIALTY COFFEE', fontFamily: 'Cinzel', fontSizePt: 16, color: '#3e2723', align: 'center' },
                        { type: 'category_header', x: 20, y: 56, w: 170, h: 8, customName: 'MICRO-TORRÉFACTION ARTISANALE • EXTRACTIONS DE PRÉCISION • PÂTISSERIES FRAÎCHES', fontFamily: 'Montserrat', fontSizePt: 7, color: '#78350f', align: 'center' },
                        { type: 'illustration', illustrationId: 'indesign_rule_dots_minimal', x: 45, y: 65, w: 120, h: 4, color: '#b45309' },

                        // Colonne Gauche : Espresso & Latte
                        { type: 'title_heading', x: 16, y: 74, w: 84, h: 10, customName: 'ESPRESSO BAR', fontFamily: 'Montserrat', fontSizePt: 10, color: '#3e2723', align: 'left' },
                        { type: 'dish_item', x: 16, y: 86, w: 84, h: 18, customName: 'Espresso / Ristretto', customDesc: 'Origine du moment (Éthiopie Yirgacheffe).', customPrice: '2,80 €', fontSizePt: 8.5, color: '#3e2723', priceColor: '#b45309' },
                        { type: 'dish_item', x: 16, y: 106, w: 84, h: 18, customName: 'Flat White Double Shot', customDesc: 'Micro-mousse de lait veloutée.', customPrice: '4,50 €', fontSizePt: 8.5, color: '#3e2723', priceColor: '#b45309' },
                        { type: 'dish_item', x: 16, y: 126, w: 84, h: 18, customName: 'Cappuccino Artisanal', customDesc: 'Lait fermier bio ou avoine Barista (+0,50€).', customPrice: '4,20 €', fontSizePt: 8.5, color: '#3e2723', priceColor: '#b45309' },
                        { type: 'dish_item', x: 16, y: 146, w: 84, h: 18, customName: 'Dirty Chai Latte Épicé', customDesc: 'Infusion masala maison + 1 shot espresso.', customPrice: '5,20 €', fontSizePt: 8.5, color: '#3e2723', priceColor: '#b45309' },

                        // Colonne Droite : Slow Coffee & Glacés
                        { type: 'title_heading', x: 110, y: 74, w: 84, h: 10, customName: 'SLOW COFFEE & COLD BREW', fontFamily: 'Montserrat', fontSizePt: 10, color: '#3e2723', align: 'left' },
                        { type: 'dish_item', x: 110, y: 86, w: 84, h: 18, customName: 'Filtre V60 / Chemex (1 ou 2 tasses)', customDesc: 'Grands crus : Kenya AA ou Colombie Geisha.', customPrice: '5,50 €', fontSizePt: 8.5, color: '#3e2723', priceColor: '#b45309' },
                        { type: 'dish_item', x: 110, y: 106, w: 84, h: 18, customName: 'Cold Brew Infusé 18 Heures', customDesc: 'Servi sur glace avec écorce d’orange bio.', customPrice: '4,80 €', fontSizePt: 8.5, color: '#3e2723', priceColor: '#b45309' },
                        { type: 'dish_item', x: 110, y: 126, w: 84, h: 18, customName: 'Iced Caramel Macchiato', customDesc: 'Caramel au beurre salé maison & lait froid.', customPrice: '5,40 €', fontSizePt: 8.5, color: '#3e2723', priceColor: '#b45309' },
                        { type: 'dish_item', x: 110, y: 146, w: 84, h: 18, customName: 'Iced Matcha Strawberry Latte', customDesc: 'Coulis de fraises fraîches & matcha Uji.', customPrice: '5,90 €', fontSizePt: 8.5, color: '#3e2723', priceColor: '#b45309' },

                        // Bas de page : Bakery & Brunch
                        { type: 'frame', x: 16, y: 174, w: 178, h: 98, backgroundColor: '#ede4d3', borderColor: '#b45309', borderWidthPt: 1, borderRadius: 4 },
                        { type: 'title_heading', x: 24, y: 180, w: 162, h: 10, customName: 'COMPTOIR BAKERY & TARTINES SALÉES', fontFamily: 'Cinzel', fontSizePt: 11, color: '#3e2723', align: 'center' },
                        { type: 'dish_item', x: 24, y: 194, w: 162, h: 16, customName: 'Cinnamon Roll Brioché à la Cardamome & Glaçage Cream Cheese', customDesc: 'Sorti du four toutes les heures.', customPrice: '4,80 €', fontSizePt: 8.5, color: '#3e2723', priceColor: '#b45309' },
                        { type: 'dish_item', x: 24, y: 213, w: 162, h: 16, customName: 'Banana Bread Toasté au Beurre de Cacahuète & Sirop d’Érable', customDesc: 'Sans gluten, aux noix de pécan caramélisées.', customPrice: '5,20 €', fontSizePt: 8.5, color: '#3e2723', priceColor: '#b45309' },
                        { type: 'dish_item', x: 24, y: 232, w: 162, h: 16, customName: 'Grilled Cheese au Cheddar Affiné, Comté 18 Mois & Oignons Confits', customDesc: 'Pain au levain naturel, servi avec salade de jeunes pousses.', customPrice: '11,50 €', fontSizePt: 8.5, color: '#3e2723', priceColor: '#b45309' },
                        { type: 'category_header', x: 24, y: 254, w: 162, h: 12, customName: 'Sachets de café en grains ou moulu (250g) disponibles au comptoir • Wi-Fi Fibre Gratuit', fontFamily: 'Montserrat', fontSizePt: 7.5, color: '#78350f', align: 'center' }
                    ];
                };

                if (mode === 'single_face') {
                    buildFace(engine.currentFace || engine.faces[0]);
                } else {
                    engine.setFormat('flyer_a4_portrait', true);
                    buildFace(engine.faces[0]);
                }
            }
        },

        // ====================================================================
        // 9. CRÊPERIE ARTISANALE, GAUFRES & COUPES GLACÉES (A4 Portrait)
        // ====================================================================
        {
            id: 'carte_glacier_creperie_a4',
            name: 'Carte Crêperie Artisanale, Gaufres & Glacier (A4)',
            subtitle: 'Format A4 210 × 297 mm • Galettes de sarrasin bio IGP, Crêpes froment flambées, Gaufres de Liège & Coupes glacées artisanales.',
            category: 'cafe_patisserie',
            format: 'flyer_a4_portrait',
            badge: 'Crêperie & Glacier',
            badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
            colors: ['#ffffff', '#1e3a8a', '#d97706'],
            icon: 'fa-ice-cream',
            builder(engine, mode = 'new_project') {
                const buildFace = (face) => {
                    face.name = 'Carte Crêperie & Glacier A4';
                    face.bgColor = '#ffffff';
                    face.objects = [
                        { type: 'frame', x: 10, y: 10, w: 190, h: 277, borderColor: '#1e3a8a', borderWidthPt: 1.5, backgroundColor: 'transparent' },
                        { type: 'frame', x: 14, y: 14, w: 182, h: 38, backgroundColor: '#1e3a8a', borderRadius: 4 },
                        { type: 'title_heading', x: 20, y: 20, w: 170, h: 14, customName: 'LA CRÊPERIE & GLACIER DU PORT', fontFamily: 'Cinzel', fontSizePt: 15, color: '#ffffff', align: 'center' },
                        { type: 'category_header', x: 20, y: 36, w: 170, h: 10, customName: 'Farine de Blé Noir Bio de Bretagne • Beurre de Baratte • Glaces Turbinées Maison', fontFamily: 'Montserrat', fontSizePt: 7.5, color: '#fde68a', align: 'center' },

                        { type: 'title_heading', x: 16, y: 60, w: 178, h: 10, customName: 'NOS GALETTES DE SARRASIN SALÉES', fontFamily: 'Cinzel', fontSizePt: 11, color: '#1e3a8a', align: 'center' },
                        { type: 'dish_item', x: 16, y: 74, w: 178, h: 18, customName: 'La Complète Traditionnelle', customDesc: 'Jambon blanc supérieur au torchon, emmental grand cru râpé, œuf bio miroir.', customPrice: '10,50 €', fontSizePt: 9, color: '#0f172a', priceColor: '#d97706' },
                        { type: 'dish_item', x: 16, y: 94, w: 178, h: 18, customName: 'La Nordique au Saumon Fumé', customDesc: 'Fondue de poireaux à la crème d’Isigny, saumon fumé, aneth et citron.', customPrice: '14,50 €', fontSizePt: 9, color: '#0f172a', priceColor: '#d97706' },
                        { type: 'dish_item', x: 16, y: 114, w: 178, h: 18, customName: 'La Chèvre Chaud, Miel & Noix du Périgord', customDesc: 'Crottin de Chavignol rôti, miel de lavande, salade de jeunes pousses.', customPrice: '12,50 €', fontSizePt: 9, color: '#0f172a', priceColor: '#d97706' },

                        { type: 'title_heading', x: 16, y: 140, w: 178, h: 10, customName: 'CRÊPES DE FROMENT & GAUFRES GOURMANDES', fontFamily: 'Cinzel', fontSizePt: 11, color: '#d97706', align: 'center' },
                        { type: 'dish_item', x: 16, y: 154, w: 178, h: 18, customName: 'Crêpe au Caramel au Beurre Salé Maison & Pommes Rôties', customDesc: 'Servie avec une boule de glace vanille de Madagascar.', customPrice: '8,50 €', fontSizePt: 9, color: '#0f172a', priceColor: '#1e3a8a' },
                        { type: 'dish_item', x: 16, y: 174, w: 178, h: 18, customName: 'Gaufre de Bruxelles Croustillante au Chocolat Chaud & Chantilly', customDesc: 'Chocolat noir fondu 64%, amandes effilées grillées.', customPrice: '8,00 €', fontSizePt: 9, color: '#0f172a', priceColor: '#1e3a8a' },

                        { type: 'title_heading', x: 16, y: 200, w: 178, h: 10, customName: 'COUPES GLACÉES ARTISANALES', fontFamily: 'Cinzel', fontSizePt: 11, color: '#1e3a8a', align: 'center' },
                        { type: 'dish_item', x: 16, y: 214, w: 178, h: 18, customName: 'Coupe Dame Blanche Authentique (3 boules)', customDesc: 'Glace vanille bourbon, sauce chocolat chaud maison et chantilly.', customPrice: '9,50 €', fontSizePt: 9, color: '#0f172a', priceColor: '#d97706' },
                        { type: 'dish_item', x: 16, y: 234, w: 178, h: 18, customName: 'Coupe Plougastel aux Fraises Fraîches & Sorbet Plein Fruit', customDesc: 'Sorbet fraise, glace vanille, fraises fraîches, coulis et meringue.', customPrice: '10,50 €', fontSizePt: 9, color: '#0f172a', priceColor: '#d97706' },
                        { type: 'category_header', x: 16, y: 262, w: 178, h: 16, customName: 'Cidre Fermier Brut ou Doux de Bretagne : Bolée 4,00 € • Bouteille 75cl 14,50 €', fontFamily: 'Montserrat', fontSizePt: 8, color: '#1e3a8a', align: 'center' }
                    ];
                };

                if (mode === 'single_face') {
                    buildFace(engine.currentFace || engine.faces[0]);
                } else {
                    engine.setFormat('flyer_a4_portrait', true);
                    buildFace(engine.faces[0]);
                }
            }
        },

        // ====================================================================
        // 10. TRATTORIA & PIZZERIA NAPOLETANA (Livret 340×300 mm)
        // ====================================================================
        {
            id: 'trattoria_pizzeria_napoletana',
            name: 'Trattoria & Pizzeria Napoletana au Feu de Bois (34×30 cm)',
            subtitle: 'Livre 2 volets 340 × 300 mm • Terracotta italien, vert basilic & crème • Antipasti, Pizzas Napolitaines DOP, Pasta Fresca & Dolci.',
            category: 'street_urban',
            format: 'menu_34x30',
            badge: 'Pizzeria & Pasta',
            badgeColor: 'bg-red-500/20 text-red-300 border-red-500/40',
            colors: ['#faf7f2', '#991b1b', '#15803d'],
            icon: 'fa-pizza-slice',
            builder(engine, mode = 'new_project') {
                const buildFace = (face) => {
                    face.name = 'Carte Trattoria & Pizzeria DOP';
                    face.bgColor = '#faf7f2';
                    face.objects = [
                        { type: 'frame', x: 12, y: 12, w: 146, h: 276, borderColor: '#991b1b', borderWidthPt: 1.5, backgroundColor: 'transparent' },
                        { type: 'frame', x: 182, y: 12, w: 146, h: 276, borderColor: '#15803d', borderWidthPt: 1.5, backgroundColor: 'transparent' },

                        // Panneau Gauche : Antipasti & Pizzas Classiques
                        { type: 'illustration', illustrationId: 'pizza_woodfire_paddle', x: 68, y: 18, w: 34, h: 22, color: '#991b1b' },
                        { type: 'title_heading', x: 20, y: 42, w: 130, h: 12, customName: 'ANTIPASTI CONVIDIALI', fontFamily: 'Cinzel', fontSizePt: 11.5, color: '#991b1b', align: 'center' },
                        { type: 'dish_item', x: 20, y: 56, w: 130, h: 20, customName: 'Burrata Pugliese & Prosciutto di Parma 24 Mesi', customDesc: 'Focaccia tiède à l’origan sauvage et huile d’olive extra-vierge.', customPrice: '16,50 €', fontSizePt: 9.5, color: '#1e293b', priceColor: '#991b1b' },
                        { type: 'dish_item', x: 20, y: 78, w: 130, h: 20, customName: 'Arancini Siciliani à la Truffe & Mozzarella Filante', customDesc: 'Servis sur crème de parmesan Reggiano.', customPrice: '12,00 €', fontSizePt: 9.5, color: '#1e293b', priceColor: '#991b1b' },

                        { type: 'title_heading', x: 20, y: 108, w: 130, h: 12, customName: 'PIZZE NAPOLETANE AU FEU DE BOIS', fontFamily: 'Cinzel', fontSizePt: 11.5, color: '#991b1b', align: 'center' },
                        { type: 'category_header', x: 20, y: 120, w: 130, h: 8, customName: 'Pâte maturée 72 heures • Farine Caputo Nuvola • Tomates San Marzano DOP', fontFamily: 'Montserrat', fontSizePt: 7, color: '#15803d', align: 'center' },
                        { type: 'dish_item', x: 20, y: 132, w: 130, h: 22, customName: 'Margherita di Bufala Campana DOP', customDesc: 'Sauce tomate San Marzano, mozzarella di bufala fraîche, basilic.', customPrice: '14,00 €', fontSizePt: 9.5, color: '#1e293b', priceColor: '#991b1b' },
                        { type: 'dish_item', x: 20, y: 156, w: 130, h: 22, customName: 'Regina Tartufata (Base Blanche)', customDesc: 'Fior di latte, crème de truffe noire d’Ombrie, champignons frais, stracciatella.', customPrice: '19,50 €', fontSizePt: 9.5, color: '#1e293b', priceColor: '#991b1b' },
                        { type: 'dish_item', x: 20, y: 180, w: 130, h: 22, customName: 'Diavola Piccante & Miel Pimenté', customDesc: 'Tomate, fior di latte, spianata calabra piquante, olives noires et origan.', customPrice: '16,50 €', fontSizePt: 9.5, color: '#1e293b', priceColor: '#991b1b' },
                        { type: 'dish_item', x: 20, y: 204, w: 130, h: 22, customName: 'Mortadella di Bologna IGP & Pistacchio', customDesc: 'Base fior di latte, mortadelle après cuisson, burrata et éclats de pistaches.', customPrice: '18,50 €', fontSizePt: 9.5, color: '#1e293b', priceColor: '#991b1b' },
                        { type: 'dish_item', x: 20, y: 228, w: 130, h: 22, customName: 'Quattro Formaggi d’Italia', customDesc: 'Gorgonzola DOP, Taleggio, Parmigiano 24 mois, Fior di latte et noix.', customPrice: '17,00 €', fontSizePt: 9.5, color: '#1e293b', priceColor: '#991b1b' },

                        // Panneau Droit : Pasta Fresca & Dolci
                        { type: 'illustration', illustrationId: 'pasta_twirl_fork', x: 238, y: 18, w: 34, h: 22, color: '#15803d' },
                        { type: 'title_heading', x: 190, y: 42, w: 130, h: 12, customName: 'PASTA FRESCA FATTA IN CASA', fontFamily: 'Cinzel', fontSizePt: 11.5, color: '#15803d', align: 'center' },
                        { type: 'dish_item', x: 190, y: 58, w: 130, h: 22, customName: 'Spaghetti alla Carbonara Autentica (Sans Crème)', customDesc: 'Guanciale croustillant du Latium, jaune d’œuf bio, Pecorino Romano DOP et poivre noir.', customPrice: '17,50 €', fontSizePt: 9.5, color: '#1e293b', priceColor: '#15803d' },
                        { type: 'dish_item', x: 190, y: 84, w: 130, h: 22, customName: 'Tagliatelle al Ragù Bolognese Mijoté 5 Heures', customDesc: 'Bœuf choisi, vin rouge Sangiovese et copeaux de Parmigiano.', customPrice: '16,50 €', fontSizePt: 9.5, color: '#1e293b', priceColor: '#15803d' },
                        { type: 'dish_item', x: 190, y: 110, w: 130, h: 22, customName: 'Ravioli Ricotta & Épinards au Beurre de Sauge', customDesc: 'Pignons de pin torréfiés et zeste de citron d’Amalfi.', customPrice: '18,00 €', fontSizePt: 9.5, color: '#1e293b', priceColor: '#15803d' },
                        { type: 'dish_item', x: 190, y: 136, w: 130, h: 22, customName: 'Lasagne Tradizionale della Nonna au Four à Bois', customDesc: 'Pâte fraîche aux œufs, bolognaise maison, béchamel muscadée et mozzarella.', customPrice: '17,00 €', fontSizePt: 9.5, color: '#1e293b', priceColor: '#15803d' },

                        { type: 'title_heading', x: 190, y: 170, w: 130, h: 12, customName: 'DOLCI DELLA CASA & CAFFÈ', fontFamily: 'Cinzel', fontSizePt: 11.5, color: '#991b1b', align: 'center' },
                        { type: 'dish_item', x: 190, y: 186, w: 130, h: 20, customName: 'Tiramisù al Caffè Espresso & Mascarpone', customDesc: 'Recette familiale de Trévise préparée chaque matin.', customPrice: '8,50 €', fontSizePt: 9.5, color: '#1e293b', priceColor: '#991b1b' },
                        { type: 'dish_item', x: 190, y: 210, w: 130, h: 20, customName: 'Cannolo Siciliano à la Ricotta Douce & Pistaches', customDesc: 'Pépites de chocolat noir et écorces d’oranges confites.', customPrice: '9,00 €', fontSizePt: 9.5, color: '#1e293b', priceColor: '#991b1b' },
                        { type: 'dish_item', x: 190, y: 234, w: 130, h: 20, customName: 'Panna Cotta Vanille & Coulis de Fruits des Bois', customDesc: 'Menthe fraîche et éclats de spéculoos.', customPrice: '7,50 €', fontSizePt: 9.5, color: '#1e293b', priceColor: '#991b1b' }
                    ];
                };

                if (mode === 'single_face') {
                    buildFace(engine.currentFace || engine.faces[0]);
                } else {
                    engine.setFormat('menu_34x30', true);
                    buildFace(engine.faces[0]);
                }
            }
        },

        // ====================================================================
        // 11. STREET FOOD & SMASH BURGERS (Format A4 Portrait)
        // ====================================================================
        {
            id: 'street_food_smash_urban',
            name: 'Street Food & Smash Burger Urbain (A4)',
            subtitle: 'Style contemporain percutant • Titres Montserrat Extra-Bold, combos frites/boissons, sides croustillants & badges "Viande Fraîche".',
            category: 'street_urban',
            format: 'flyer_a4_portrait',
            badge: 'Smash Burger',
            badgeColor: 'bg-red-500/20 text-red-400 border-red-500/40',
            colors: ['#111827', '#ef4444', '#facc15'],
            icon: 'fa-burger',
            builder(engine, mode = 'new_project') {
                const buildFace = (face) => {
                    face.name = 'Carte Smash Burger Urbain';
                    face.bgColor = '#111827';
                    face.objects = [
                        { type: 'frame', x: 10, y: 10, w: 190, h: 277, borderColor: '#facc15', borderWidthPt: 1.5, backgroundColor: 'transparent' },
                        { type: 'illustration', illustrationId: 'burger_gourmet_smash', x: 90, y: 16, w: 30, h: 22, color: '#facc15' },
                        { type: 'title_heading', x: 15, y: 40, w: 180, h: 14, customName: 'STREET SMASH BURGERS', fontFamily: 'Montserrat', fontSizePt: 18, color: '#facc15', align: 'center' },
                        { type: 'category_header', x: 15, y: 55, w: 180, h: 8, customName: '100% BŒUF FRAIS CHAROLAIS ÉCRASÉ MINUTE SUR PLANCHA FUMANTE • POTATO BUN BRIOCHÉ', fontFamily: 'Montserrat', fontSizePt: 7.5, color: '#e5e7eb', align: 'center' },

                        { type: 'dish_item', x: 18, y: 70, w: 174, h: 20, customName: 'The Classic OG Double Smash', customDesc: '2 steaks 90g croustillants, double cheddar affiné, sauce secrète fumée, pickles maison.', customPrice: '11,50 €', fontSizePt: 9.5, color: '#ffffff', priceColor: '#facc15' },
                        { type: 'dish_item', x: 18, y: 94, w: 174, h: 20, customName: 'Truffle & Crispy Bacon Deluxe', customDesc: 'Double steak wagyu, mayo à la truffe noire, oignons caramélisés au porto, poitrine fumée.', customPrice: '14,00 €', fontSizePt: 9.5, color: '#ffffff', priceColor: '#facc15' },
                        { type: 'dish_item', x: 18, y: 118, w: 174, h: 20, customName: 'Spicy Jalapeño Crunch & Cheddar Coulant', customDesc: 'Double smash, piments jalapeños rôtis, oignons frits, sauce sriracha-miel.', customPrice: '12,50 €', fontSizePt: 9.5, color: '#ffffff', priceColor: '#facc15' },
                        { type: 'dish_item', x: 18, y: 142, w: 174, h: 20, customName: 'Crispy Nashville Hot Chicken Burger', customDesc: 'Suprême de poulet fermier mariné au babeurre, panure épicée, coleslaw crémeux.', customPrice: '12,00 €', fontSizePt: 9.5, color: '#ffffff', priceColor: '#facc15' },
                        { type: 'dish_item', x: 18, y: 166, w: 174, h: 20, customName: 'Halloumi & Avocado Green Smash (Végétarien)', customDesc: 'Halloumi grillé au miel, guacamole frais, roquette et sauce yaourt citron vert.', customPrice: '11,90 €', fontSizePt: 9.5, color: '#ffffff', priceColor: '#facc15' },

                        { type: 'frame', x: 18, y: 194, w: 174, h: 52, backgroundColor: '#1f2937', borderColor: '#ef4444', borderWidthPt: 1.2, borderRadius: 6 },
                        { type: 'title_heading', x: 24, y: 200, w: 162, h: 10, customName: 'LOADED FRIES, SIDES & MILKSHAKES', fontFamily: 'Montserrat', fontSizePt: 10.5, color: '#ef4444', align: 'center' },
                        { type: 'dish_item', x: 24, y: 212, w: 162, h: 15, customName: 'Frites Maison Double Cuisson au Cheddar Fondant & Bacon', customDesc: 'Ciboulette fraîche et sauce ranch.', customPrice: '5,50 €', fontSizePt: 8.5, color: '#ffffff', priceColor: '#facc15' },
                        { type: 'dish_item', x: 24, y: 228, w: 162, h: 15, customName: 'Thick Milkshake Artisanal (Oreo, Beurre de Cacahuète, Vanille Pécan)', customDesc: 'Surmonté de crème fouettée.', customPrice: '6,50 €', fontSizePt: 8.5, color: '#ffffff', priceColor: '#facc15' },

                        { type: 'badge_new', x: 65, y: 254, w: 80, h: 12, text: 'FORMULE COMBO +4,50 €', bgColor: '#ef4444', textColor: '#ffffff', radius: 6 },
                        { type: 'category_header', x: 18, y: 270, w: 174, h: 12, customName: 'Formule Combo : Votre Burger + Frites Maison + Boisson Artisanale 33cl', fontFamily: 'Montserrat', fontSizePt: 8, color: '#9ca3af', align: 'center' }
                    ];
                };

                if (mode === 'single_face') {
                    buildFace(engine.currentFace || engine.faces[0]);
                } else {
                    engine.setFormat('flyer_a4_portrait', true);
                    buildFace(engine.faces[0]);
                }
            }
        },

        // ====================================================================
        // 12. SUSHI BAR, RAMEN & IZAKAYA JAPONAIS (A4 Portrait)
        // ====================================================================
        {
            id: 'sushi_izakaya_minimal_a4',
            name: 'Carte Sushi Bar, Ramen & Izakaya Japonais (A4)',
            subtitle: 'Format A4 210 × 297 mm • Esthétique minimaliste Tokyo, noir encre, rouge cinabre & ivoire • Sashimi, Signature Rolls, Ramen & Gyozas.',
            category: 'street_urban',
            format: 'flyer_a4_portrait',
            badge: 'Japonais & Sushi',
            badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
            colors: ['#18181b', '#dc2626', '#fafaf9'],
            icon: 'fa-fish-fins',
            builder(engine, mode = 'new_project') {
                const buildFace = (face) => {
                    face.name = 'Carte Sushi & Izakaya A4';
                    face.bgColor = '#fafaf9';
                    face.objects = [
                        { type: 'frame', x: 10, y: 10, w: 190, h: 277, borderColor: '#18181b', borderWidthPt: 1.5, backgroundColor: 'transparent' },
                        // Sceau rouge japonais (Hanko)
                        { type: 'badge_new', x: 91, y: 16, w: 28, h: 10, text: 'OMAKASE', bgColor: '#dc2626', textColor: '#ffffff', radius: 2 },
                        { type: 'title_heading', x: 20, y: 30, w: 170, h: 14, customName: 'KITSUNE — SUSHI & IZAKAYA', fontFamily: 'Cinzel', fontSizePt: 16, color: '#18181b', align: 'center' },
                        { type: 'category_header', x: 20, y: 44, w: 170, h: 8, customName: 'POISSONS DE LIGNE MATURÉS • RIZ KOSHIHIKARI AU VINAIGRE ROUGE AKAZU • BOUILLONS 14H', fontFamily: 'Montserrat', fontSizePt: 7, color: '#dc2626', align: 'center' },

                        { type: 'title_heading', x: 16, y: 58, w: 178, h: 10, customName: 'IZAKAYA TAPAS & ENTRÉES CHAUDES', fontFamily: 'Montserrat', fontSizePt: 10, color: '#dc2626', align: 'left' },
                        { type: 'dish_item', x: 16, y: 70, w: 178, h: 16, customName: 'Gyozas Grillés au Porc Fermier & Gingembre (6 pcs)', customDesc: 'Sauce ponzu maison à l’huile de sésame grillé et piment shichimi.', customPrice: '9,50 €', fontSizePt: 9, color: '#18181b', priceColor: '#dc2626' },
                        { type: 'dish_item', x: 16, y: 88, w: 178, h: 16, customName: 'Karaage de Poulet Croustillant au Citron Yuzu', customDesc: 'Mayonnaise japonaise Kewpie au wasabi frais.', customPrice: '11,00 €', fontSizePt: 9, color: '#18181b', priceColor: '#dc2626' },
                        { type: 'dish_item', x: 16, y: 106, w: 178, h: 16, customName: 'Tataki de Thon Rouge Saisi au Chalumeau', customDesc: 'Sauce soja dashi, radis daïkon râpé et ciboule.', customPrice: '16,00 €', fontSizePt: 9, color: '#18181b', priceColor: '#dc2626' },

                        { type: 'title_heading', x: 16, y: 130, w: 178, h: 10, customName: 'SASHIMI, NIGIRI & SIGNATURE DRAGON ROLLS (8 PCS)', fontFamily: 'Montserrat', fontSizePt: 10, color: '#dc2626', align: 'left' },
                        { type: 'dish_item', x: 16, y: 142, w: 178, h: 18, customName: 'Black Dragon Roll (Tempura de Gambas & Anguille Grillée Unagi)', customDesc: 'Avocat fondant, sauce kabayaki caramélisée et sésame doré.', customPrice: '18,50 €', fontSizePt: 9, color: '#18181b', priceColor: '#dc2626' },
                        { type: 'dish_item', x: 16, y: 162, w: 178, h: 18, customName: 'Truffle Salmon Aburi Roll (Saumon Mi-Cuit Flambé)', customDesc: 'Cream cheese, asperge verte croquante, perles de truffe et teriyaki.', customPrice: '17,50 €', fontSizePt: 9, color: '#18181b', priceColor: '#dc2626' },
                        { type: 'dish_item', x: 16, y: 182, w: 178, h: 18, customName: 'Plateau Omakase du Maître Sushi (18 Pièces)', customDesc: '6 Nigiri sélection du chef, 6 Sashimi nobles et 6 California signatures.', customPrice: '34,00 €', fontSizePt: 9, color: '#18181b', priceColor: '#dc2626' },

                        { type: 'title_heading', x: 16, y: 208, w: 178, h: 10, customName: 'RAMEN ARTISANAUX & DONBURI', fontFamily: 'Montserrat', fontSizePt: 10, color: '#dc2626', align: 'left' },
                        { type: 'dish_item', x: 16, y: 220, w: 178, h: 18, customName: 'Tonkotsu Ramen Traditionnel (Bouillon Crémeux 14h)', customDesc: 'Poitrine de porc Chashu braisée, œuf mollet mariné Ajitsuke, nouilles fraîches, nori.', customPrice: '16,50 €', fontSizePt: 9, color: '#18181b', priceColor: '#dc2626' },
                        { type: 'dish_item', x: 16, y: 240, w: 178, h: 18, customName: 'Miso Ramen Végétarien aux Champignons Shiitaké & Tofu Soyeux', customDesc: 'Bouillon miso rouge d’Aichi, maïs grillé, pousses de bambou et huile pimentée.', customPrice: '15,50 €', fontSizePt: 9, color: '#18181b', priceColor: '#dc2626' },
                        { type: 'category_header', x: 16, y: 266, w: 178, h: 14, customName: 'Sakés Junmai Ginjo, Whiskies Japonais & Thés Verts Sencha disponibles à la carte', fontFamily: 'Montserrat', fontSizePt: 7.5, color: '#52525b', align: 'center' }
                    ];
                };

                if (mode === 'single_face') {
                    buildFace(engine.currentFace || engine.faces[0]);
                } else {
                    engine.setFormat('flyer_a4_portrait', true);
                    buildFace(engine.faces[0]);
                }
            }
        },

        // ====================================================================
        // 13. STEAKHOUSE & GRILLADES AU FEU DE BOIS (A4 Portrait)
        // ====================================================================
        {
            id: 'steakhouse_grill_bois_a4',
            name: 'Steakhouse & Grillades au Feu de Bois (A4)',
            subtitle: 'Format A4 210 × 297 mm • Anthracite fumé & ambre braise • Viandes maturées sur l’os, Côtes de Bœuf, Sauces maison & Garnitures.',
            category: 'street_urban',
            format: 'flyer_a4_portrait',
            badge: 'Steakhouse A4',
            badgeColor: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
            colors: ['#1c1917', '#ea580c', '#fafaf9'],
            icon: 'fa-fire-flame-curved',
            builder(engine, mode = 'new_project') {
                const buildFace = (face) => {
                    face.name = 'Carte Steakhouse & Grillades A4';
                    face.bgColor = '#1c1917';
                    face.objects = [
                        { type: 'frame', x: 10, y: 10, w: 190, h: 277, borderColor: '#ea580c', borderWidthPt: 1.5, backgroundColor: 'transparent' },
                        { type: 'illustration', illustrationId: 'steak_flame_grill', x: 88, y: 16, w: 34, h: 22, color: '#ea580c' },
                        { type: 'title_heading', x: 18, y: 40, w: 174, h: 14, customName: 'BRAISE & MATURATION — STEAKHOUSE', fontFamily: 'Cinzel', fontSizePt: 16, color: '#fafaf9', align: 'center' },
                        { type: 'category_header', x: 18, y: 54, w: 174, h: 8, customName: 'CAVE DE MATURATION 45 JOURS • CUISSON AU FOUR JOSPER SUR BRAISES DE CHÊNE VERT', fontFamily: 'Montserrat', fontSizePt: 7, color: '#ea580c', align: 'center' },

                        { type: 'title_heading', x: 18, y: 68, w: 174, h: 10, customName: 'LES PIÈCES DU BOUCHER (SERVIES AVEC 2 GARNITURES)', fontFamily: 'Cinzel', fontSizePt: 11, color: '#ea580c', align: 'left' },
                        { type: 'dish_item', x: 18, y: 80, w: 174, h: 20, customName: 'Ribeye / Entrecôte Black Angus Écosse (320g)', customDesc: 'Persillage intense, saisie à la flamme vive et fleur de sel fumée.', customPrice: '32,00 €', fontSizePt: 9.5, color: '#fafaf9', priceColor: '#ea580c' },
                        { type: 'dish_item', x: 18, y: 102, w: 174, h: 20, customName: 'Cœur de Filet de Bœuf Simmental (220g)', customDesc: 'Tendreté absolue, beurre maître d’hôtel à l’ail noir.', customPrice: '34,00 €', fontSizePt: 9.5, color: '#fafaf9', priceColor: '#ea580c' },
                        { type: 'dish_item', x: 18, y: 124, w: 174, h: 20, customName: 'Travers de Porc Ibérique Bellota Caramélisés au BBQ Bourbon', customDesc: 'Fumés lentement pendant 8 heures au bois de hickory.', customPrice: '26,00 €', fontSizePt: 9.5, color: '#fafaf9', priceColor: '#ea580c' },

                        // Encadré Pièces d'exception à partager
                        { type: 'frame', x: 18, y: 150, w: 174, h: 62, backgroundColor: '#292524', borderColor: '#ea580c', borderWidthPt: 1.2, borderRadius: 4 },
                        { type: 'title_heading', x: 24, y: 156, w: 162, h: 10, customName: 'LES GRANDES PIÈCES MATURÉES À PARTAGER (2 PERSONNES)', fontFamily: 'Cinzel', fontSizePt: 10, color: '#fb923c', align: 'center' },
                        { type: 'dish_item', x: 24, y: 168, w: 162, h: 18, customName: 'Côte de Bœuf Rubia Gallega Maturée 45 Jours (1,1 kg)', customDesc: 'Découpée sur planche chauffante, moelle rôtie à la fleur de sel.', customPrice: '98,00 €', fontSizePt: 9, color: '#fafaf9', priceColor: '#fb923c' },
                        { type: 'dish_item', x: 24, y: 188, w: 162, h: 18, customName: 'Tomahawk Wagyu Australien BMS 6+ (1,2 kg)', customDesc: 'Saveur beurrée exceptionnelle, servi avec nos 4 sauces maison.', customPrice: '135,00 €', fontSizePt: 9, color: '#fafaf9', priceColor: '#fb923c' },

                        { type: 'title_heading', x: 18, y: 220, w: 174, h: 10, customName: 'GARNITURES & SAUCES MAISON AU CHOIX', fontFamily: 'Cinzel', fontSizePt: 10, color: '#ea580c', align: 'center' },
                        { type: 'category_header', x: 18, y: 232, w: 174, h: 26, customName: 'Garnitures : Frites au couteau graisse de bœuf • Mac & Cheese truffé • Purée fumée • Légumes braisés\nSauces : Chimichurri argentin • Béarnaise à l’estragon • Poivre de Kampot flambé au Cognac • Roquefort', fontFamily: 'Montserrat', fontSizePt: 8, color: '#d6d3d1', align: 'center' },
                        { type: 'category_header', x: 18, y: 264, w: 174, h: 14, customName: 'Demandez notre carte des Vins Rouges de Caractère (Malbec de Mendoza, Côte-Rôtie, Pomerol)', fontFamily: 'Playfair Display', fontSizePt: 8, color: '#a8a29e', align: 'center' }
                    ];
                };

                if (mode === 'single_face') {
                    buildFace(engine.currentFace || engine.faces[0]);
                } else {
                    engine.setFormat('flyer_a4_portrait', true);
                    buildFace(engine.faces[0]);
                }
            }
        },

        // ====================================================================
        // 14. FLYER PROMOTIONNEL A4 GRAND BRUNCH (210×297 mm)
        // ====================================================================
        {
            id: 'flyer_brunch_gourmand_a4',
            name: 'Flyer Promotionnel A4 — Grand Brunch du Dimanche',
            subtitle: 'Flyer A4 210 × 297 mm • Grand bandeau titre, macaron buffet à volonté, 3 blocs gourmands équilibrés, cartouche réservation.',
            category: 'flyers_a4',
            format: 'flyer_a4_portrait',
            badge: 'Flyer A4',
            badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
            colors: ['#ffffff', '#047857', '#d97706'],
            icon: 'fa-mug-hot',
            builder(engine, mode = 'new_project') {
                const buildFace = (face) => {
                    face.name = 'Flyer A4 Brunch du Dimanche';
                    face.bgColor = '#fdfbf7';
                    face.objects = [
                        { type: 'frame', x: 8, y: 8, w: 194, h: 281, borderColor: '#047857', borderWidthPt: 1, backgroundColor: 'transparent', opacity: 0.6 },
                        { type: 'frame', x: 12, y: 12, w: 186, h: 54, backgroundColor: '#047857', borderColor: '#065f46', borderWidthPt: 1, borderRadius: 4 },
                        { type: 'title_heading', x: 20, y: 16, w: 170, h: 8, customName: 'TOUS LES DIMANCHES DE 11H00 À 16H00', fontFamily: 'Montserrat', fontSizePt: 8, color: '#fef08a', align: 'center' },
                        { type: 'title_heading', x: 20, y: 25, w: 170, h: 18, customName: 'LE GRAND BRUNCH GOURMAND', fontFamily: 'Cinzel', fontSizePt: 17, color: '#ffffff', align: 'center' },
                        { type: 'category_header', x: 20, y: 47, w: 170, h: 12, customName: 'Buffet salé & sucré à discrétion • Produits bio & du terroir', fontFamily: 'Montserrat', fontSizePt: 8.5, color: '#a7f3d0', align: 'center' },
                        { type: 'frame', x: 145, y: 52, w: 46, h: 22, backgroundColor: '#d97706', borderColor: '#ffffff', borderWidthPt: 1.5, borderRadius: 11 },
                        { type: 'title_heading', x: 146, y: 56, w: 44, h: 14, customName: '32 € / PERS.', fontFamily: 'Montserrat', fontSizePt: 10, color: '#ffffff', align: 'center' },

                        { type: 'frame', x: 14, y: 78, w: 88, h: 86, backgroundColor: '#ffffff', borderColor: '#e5e7eb', borderWidthPt: 1, borderRadius: 6 },
                        { type: 'title_heading', x: 18, y: 83, w: 80, h: 9, customName: 'LE COIN SALÉ DU CHEF', fontFamily: 'Montserrat', fontSizePt: 9.5, color: '#047857', align: 'center' },
                        { type: 'dish_item', x: 18, y: 95, w: 80, h: 18, customName: 'Œufs Bénédicte au Saumon', customDesc: 'Sauce hollandaise sur muffin.', customPrice: 'Inclus', fontSizePt: 8, color: '#1f2937', priceColor: '#047857' },
                        { type: 'dish_item', x: 18, y: 116, w: 80, h: 18, customName: 'Avocado Toast & Granola', customDesc: 'Pain de seigle bio et féta.', customPrice: 'Inclus', fontSizePt: 8, color: '#1f2937', priceColor: '#047857' },
                        { type: 'dish_item', x: 18, y: 137, w: 80, h: 18, customName: 'Charcuteries & Fromages', customDesc: 'Comté 18 mois et jambon affiné.', customPrice: 'Inclus', fontSizePt: 8, color: '#1f2937', priceColor: '#047857' },

                        { type: 'frame', x: 108, y: 78, w: 88, h: 86, backgroundColor: '#ffffff', borderColor: '#e5e7eb', borderWidthPt: 1, borderRadius: 6 },
                        { type: 'title_heading', x: 112, y: 83, w: 80, h: 9, customName: 'DOUCEURS & BOULANGERIE', fontFamily: 'Montserrat', fontSizePt: 9.5, color: '#d97706', align: 'center' },
                        { type: 'dish_item', x: 112, y: 95, w: 80, h: 18, customName: 'Pancakes au Sirop d’Érable', customDesc: 'Myrtilles fraîches et chantilly.', customPrice: 'Inclus', fontSizePt: 8, color: '#1f2937', priceColor: '#d97706' },
                        { type: 'dish_item', x: 112, y: 116, w: 80, h: 18, customName: 'Viennoiseries Pur Beurre', customDesc: 'Croissants, brioches feuilletées.', customPrice: 'Inclus', fontSizePt: 8, color: '#1f2937', priceColor: '#d97706' },
                        { type: 'dish_item', x: 112, y: 137, w: 80, h: 18, customName: 'Açai Bowl & Fruits Frais', customDesc: 'Graines de chia et miel sauvage.', customPrice: 'Inclus', fontSizePt: 8, color: '#1f2937', priceColor: '#d97706' },

                        { type: 'frame', x: 14, y: 170, w: 182, h: 54, backgroundColor: '#ffffff', borderColor: '#e5e7eb', borderWidthPt: 1, borderRadius: 6 },
                        { type: 'title_heading', x: 20, y: 174, w: 170, h: 8, customName: 'BOISSONS DU BARISTA & JUS PRESSÉS (À VOLONTÉ)', fontFamily: 'Montserrat', fontSizePt: 9, color: '#047857', align: 'center' },
                        { type: 'category_header', x: 20, y: 186, w: 170, h: 30, customName: 'Café de spécialité torréfié localement (Espresso, Cappuccino, Flat White)\nThés bio d’origine (Vert Sencha, Noir Earl Grey, Infusions du jardin)\nJus d’oranges pressées à la minute, Cocktail détox pomme-gingembre-citron vert.', fontFamily: 'Montserrat', fontSizePt: 8, color: '#4b5563', align: 'center' },

                        { type: 'frame', x: 14, y: 232, w: 182, h: 48, backgroundColor: '#f3f4f6', borderColor: '#cbd5e1', borderWidthPt: 1, borderRadius: 6 },
                        { type: 'title_heading', x: 20, y: 237, w: 170, h: 9, customName: 'RÉSERVATION FORTEMENT RECOMMANDÉE', fontFamily: 'Montserrat', fontSizePt: 9.5, color: '#111827', align: 'center' },
                        { type: 'category_header', x: 20, y: 249, w: 170, h: 24, customName: 'En ligne sur www.notre-restaurant.fr ou au 01 45 20 00 00\nAdresse : 28, Rue Gourmande • Parking privé & Terrasse chauffée disponible\nMenu enfant (-10 ans) disponible à 16 €', fontFamily: 'Montserrat', fontSizePt: 8, color: '#4b5563', align: 'center' }
                    ];
                };

                if (mode === 'single_face') {
                    buildFace(engine.currentFace || engine.faces[0]);
                } else {
                    engine.setFormat('flyer_a4_portrait', true);
                    buildFace(engine.faces[0]);
                }
            }
        },

        // ====================================================================
        // 15. SET DE TABLE PANORAMIQUE A4 PAYSAGE (Grille 3 Colonnes InDesign)
        // ====================================================================
        {
            id: 'set_de_table_bistrot_a4_paysage',
            name: 'Set de Table Panoramique A4 Paysage (Grille 3 Colonnes InDesign)',
            subtitle: 'Format A4 Paysage 297 × 210 mm • Grille éditoriale 3 colonnes avec encadré central « Les Suggestions du Chef », Entrées, Plats & Desserts.',
            category: 'flyers_a4',
            format: 'flyer_a4_landscape',
            badge: 'Set de Table A4',
            badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
            colors: ['#fdfbf7', '#1e293b', '#b45309'],
            icon: 'fa-table-columns',
            builder(engine, mode = 'new_project') {
                const buildFace = (face) => {
                    face.name = 'Set de Table A4 Paysage (3 Colonnes)';
                    face.bgColor = '#fdfbf7';
                    face.objects = [
                        { type: 'frame', x: 8, y: 8, w: 281, h: 194, borderColor: '#1e293b', borderWidthPt: 1.5, backgroundColor: 'transparent' },
                        { type: 'frame', x: 10, y: 10, w: 277, h: 190, borderColor: '#b45309', borderWidthPt: 0.6, backgroundColor: 'transparent' },

                        // Bandeau supérieur
                        { type: 'title_heading', x: 20, y: 14, w: 257, h: 12, customName: 'GRAND CAFÉ DE LA PLACE — BRASSERIE & CUISINE DU MARCHÉ', fontFamily: 'Cinzel', fontSizePt: 14, color: '#1e293b', align: 'center' },
                        { type: 'illustration', illustrationId: 'indesign_rule_diamond', x: 98, y: 27, w: 100, h: 5, color: '#b45309' },

                        // Colonne 1 (14 à 96 mm) : Entrées & Salades
                        { type: 'title_heading', x: 14, y: 36, w: 82, h: 9, customName: 'ENTRÉES & GRANDES SALADES', fontFamily: 'Cinzel', fontSizePt: 9.5, color: '#b45309', align: 'left' },
                        { type: 'dish_item', x: 14, y: 48, w: 82, h: 20, customName: 'Croustillant de Chèvre Chaud au Miel', customDesc: 'Mesclun aux noix et pommes acidulées.', customPrice: '11,50 €', fontSizePt: 8.5, color: '#1e293b', priceColor: '#b45309' },
                        { type: 'dish_item', x: 14, y: 70, w: 82, h: 20, customName: 'Gravlax de Saumon à l’Aneth & Baies Roses', customDesc: 'Crème citronnée et blinis tièdes.', customPrice: '14,00 €', fontSizePt: 8.5, color: '#1e293b', priceColor: '#b45309' },
                        { type: 'dish_item', x: 14, y: 92, w: 82, h: 20, customName: 'Salade César au Poulet Fermier Croustillant', customDesc: 'Cœur de romaine, parmesan 24 mois, œuf bio.', customPrice: '16,50 €', fontSizePt: 8.5, color: '#1e293b', priceColor: '#b45309' },
                        { type: 'dish_item', x: 14, y: 114, w: 82, h: 20, customName: 'Planche Apéritive Terroir à Partager', customDesc: 'Charcuteries artisanales et fromages affinés.', customPrice: '19,00 €', fontSizePt: 8.5, color: '#1e293b', priceColor: '#b45309' },
                        { type: 'illustration', illustrationId: 'badge_fait_maison_pro', x: 38, y: 146, w: 34, h: 34, color: '#b45309' },

                        // Colonne 2 Centrale (104 à 193 mm) : Encadré Prestige Plats Signatures
                        { type: 'frame', x: 104, y: 36, w: 89, h: 156, backgroundColor: '#1e293b', borderColor: '#b45309', borderWidthPt: 1.2, borderRadius: 4 },
                        { type: 'title_heading', x: 108, y: 42, w: 81, h: 10, customName: 'LES PLATS SIGNATURES', fontFamily: 'Cinzel', fontSizePt: 10.5, color: '#fbbf24', align: 'center' },
                        { type: 'dish_item', x: 108, y: 56, w: 81, h: 22, customName: 'Pavé de Rumsteck Simmental au Poivre Vert', customDesc: 'Frites maison et salade de jeunes pousses.', customPrice: '22,50 €', fontSizePt: 8.5, color: '#f8fafc', priceColor: '#fbbf24' },
                        { type: 'dish_item', x: 108, y: 80, w: 81, h: 22, customName: 'Dos de Cabillaud Rôti au Chorizo Bellota', customDesc: 'Écrasé de pommes de terre à l’huile vierge.', customPrice: '23,00 €', fontSizePt: 8.5, color: '#f8fafc', priceColor: '#fbbf24' },
                        { type: 'dish_item', x: 108, y: 104, w: 81, h: 22, customName: 'Souris d’Agneau Confite 7h au Thym', customDesc: 'Gratin dauphinois traditionnel à la crème.', customPrice: '24,50 €', fontSizePt: 8.5, color: '#f8fafc', priceColor: '#fbbf24' },
                        { type: 'dish_item', x: 108, y: 128, w: 81, h: 22, customName: 'Burger du Chef au Comté Affiné & Bacon', customDesc: 'Pain brioché, oignons confits et sauce fumée.', customPrice: '18,50 €', fontSizePt: 8.5, color: '#f8fafc', priceColor: '#fbbf24' },
                        { type: 'category_header', x: 108, y: 162, w: 81, h: 22, customName: 'MENU DÉJEUNER EXPRESS : 18,90 €\nEntrée + Plat du Jour ou Plat du Jour + Café Gourmand', fontFamily: 'Montserrat', fontSizePt: 7.5, color: '#fde68a', align: 'center' },

                        // Colonne 3 (201 à 283 mm) : Desserts & Boissons
                        { type: 'title_heading', x: 201, y: 36, w: 82, h: 9, customName: 'DOUCEURS & DESSERTS MAISON', fontFamily: 'Cinzel', fontSizePt: 9.5, color: '#b45309', align: 'left' },
                        { type: 'dish_item', x: 201, y: 48, w: 82, h: 20, customName: 'Moelleux au Chocolat Noir Cœur Coulant', customDesc: 'Glace vanille de Madagascar.', customPrice: '9,00 €', fontSizePt: 8.5, color: '#1e293b', priceColor: '#b45309' },
                        { type: 'dish_item', x: 201, y: 70, w: 82, h: 20, customName: 'Tarte Fine aux Pommes Chaude & Caramel', customDesc: 'Crème fraîche épaisse d’Isigny.', customPrice: '8,50 €', fontSizePt: 8.5, color: '#1e293b', priceColor: '#b45309' },
                        { type: 'dish_item', x: 201, y: 92, w: 82, h: 20, customName: 'Le Véritable Café ou Thé Gourmand (4 mignardises)', customDesc: 'Macaron, mini-crème brûlée, financier, mousse.', customPrice: '10,50 €', fontSizePt: 8.5, color: '#1e293b', priceColor: '#b45309' },

                        { type: 'title_heading', x: 201, y: 120, w: 82, h: 9, customName: 'VINS AU VERRE & APÉRITIFS', fontFamily: 'Cinzel', fontSizePt: 9.5, color: '#b45309', align: 'left' },
                        { type: 'dish_item', x: 201, y: 132, w: 82, h: 18, customName: 'Verre de Brouilly, Chablis ou Côtes de Provence', customDesc: 'Sélection de propriétaires récoltants (14cl).', customPrice: '6,50 €', fontSizePt: 8.5, color: '#1e293b', priceColor: '#b45309' },
                        { type: 'dish_item', x: 201, y: 152, w: 82, h: 18, customName: 'Coupe de Champagne Brut ou Spritz Veneziano', customDesc: 'Servi frais avec olives marinées.', customPrice: '10,00 €', fontSizePt: 8.5, color: '#1e293b', priceColor: '#b45309' }
                    ];
                };

                if (mode === 'single_face') {
                    buildFace(engine.currentFace || engine.faces[0]);
                } else {
                    engine.setFormat('flyer_a4_landscape', true);
                    buildFace(engine.faces[0]);
                }
            }
        },

        // ====================================================================
        // 16. AFFICHE / MENU ÉVÉNEMENTIEL — SOIRÉE DÉGUSTATION (A4 Portrait)
        // ====================================================================
        {
            id: 'affiche_soiree_degustation_a4',
            name: 'Affiche / Menu Événementiel — Soirée Dégustation & Vins (A4)',
            subtitle: 'Format A4 210 × 297 mm • Menu dégustation en 5 temps avec accords mets & grands crus du sommelier, date, tarif et réservation.',
            category: 'flyers_a4',
            format: 'flyer_a4_portrait',
            badge: 'Soirée & Vins',
            badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
            colors: ['#2e1065', '#d4af37', '#faf5ff'],
            icon: 'fa-wine-glass',
            builder(engine, mode = 'new_project') {
                const buildFace = (face) => {
                    face.name = 'Menu Soirée Accords Mets & Vins A4';
                    face.bgColor = '#1e1b2e';
                    face.objects = [
                        { type: 'frame', x: 10, y: 10, w: 190, h: 277, borderColor: '#d4af37', borderWidthPt: 1.5, backgroundColor: 'transparent' },
                        { type: 'frame', x: 13, y: 13, w: 184, h: 271, borderColor: '#d4af37', borderWidthPt: 0.5, backgroundColor: 'transparent', opacity: 0.5 },
                        { type: 'illustration', illustrationId: 'wine_glass_bordeaux', x: 92, y: 18, w: 26, h: 26, color: '#d4af37' },
                        { type: 'title_heading', x: 20, y: 46, w: 170, h: 14, customName: 'DÎNER DES GRANDS CRUS', fontFamily: 'Cinzel', fontSizePt: 17, color: '#d4af37', align: 'center' },
                        { type: 'category_header', x: 20, y: 61, w: 170, h: 10, customName: 'SOIRÉE DÉGUSTATION EN 5 TEMPS • EN PRÉSENCE DU MAÎTRE SOMMELIER', fontFamily: 'Montserrat', fontSizePt: 8, color: '#e9d5ff', align: 'center' },
                        { type: 'illustration', illustrationId: 'indesign_rule_diamond', x: 55, y: 72, w: 100, h: 5, color: '#d4af37' },

                        { type: 'dish_item', x: 24, y: 84, w: 162, h: 22, customName: 'I. Gougères Truffées & Tartare de Daurade au Caviar', customDesc: 'Accord : Champagne Blanc de Blancs Grand Cru Extra-Brut.', customPrice: '1er Temps', fontSizePt: 9.5, color: '#faf5ff', priceColor: '#d4af37' },
                        { type: 'dish_item', x: 24, y: 110, w: 162, h: 22, customName: 'II. Raviole de Homard Bleu & Bisque Légère à la Citronnelle', customDesc: 'Accord : Meursault « Les Narvaux » Domaine Récoltant.', customPrice: '2e Temps', fontSizePt: 9.5, color: '#faf5ff', priceColor: '#d4af37' },
                        { type: 'dish_item', x: 24, y: 136, w: 162, h: 22, customName: 'III. Filet de Chevreuil Rôti, Sauce Grand Veneur & Coings Confits', customDesc: 'Accord : Châteauneuf-du-Pape Vieilles Vignes.', customPrice: '3e Temps', fontSizePt: 9.5, color: '#faf5ff', priceColor: '#d4af37' },
                        { type: 'dish_item', x: 24, y: 162, w: 162, h: 22, customName: 'IV. Brillat-Savarin Affiné à la Truffe Noire du Périgord', customDesc: 'Accord : Condrieu « La Doriane » Viognier.', customPrice: '4e Temps', fontSizePt: 9.5, color: '#faf5ff', priceColor: '#d4af37' },
                        { type: 'dish_item', x: 24, y: 188, w: 162, h: 22, customName: 'V. Tarte Soufflée au Chocolat Noir & Glace au Vieux Banyuls', customDesc: 'Accord : Banyuls Rimage Grand Cru.', customPrice: '5e Temps', fontSizePt: 9.5, color: '#faf5ff', priceColor: '#d4af37' },

                        { type: 'frame', x: 30, y: 220, w: 150, h: 48, backgroundColor: '#2a2440', borderColor: '#d4af37', borderWidthPt: 1, borderRadius: 4 },
                        { type: 'title_heading', x: 36, y: 226, w: 138, h: 12, customName: 'MENU COMPLET & 5 VINS INCLUS : 95 € / PERS.', fontFamily: 'Cinzel', fontSizePt: 11, color: '#d4af37', align: 'center' },
                        { type: 'category_header', x: 36, y: 240, w: 138, h: 22, customName: 'Nombre de places strictement limité à 30 convives\nRéservation au 01 42 68 00 00 • L’abus d’alcool est dangereux pour la santé.', fontFamily: 'Montserrat', fontSizePt: 7.5, color: '#d8b4fe', align: 'center' }
                    ];
                };

                if (mode === 'single_face') {
                    buildFace(engine.currentFace || engine.faces[0]);
                } else {
                    engine.setFormat('flyer_a4_portrait', true);
                    buildFace(engine.faces[0]);
                }
            }
        },

        // ====================================================================
        // 17. MENU DE GALA / FÊTES & RÉVEILLON (A4 Portrait)
        // ====================================================================
        {
            id: 'carte_fetes_reveillon_a4',
            name: 'Menu de Gala / Fêtes de Fin d’Année & Réveillon (A4)',
            subtitle: 'Format A4 210 × 297 mm • Or champagne & bleu nuit étoilé • Menu de gala festif avec coupe de Champagne, Saint-Jacques, Volaille truffée & Bûche.',
            category: 'flyers_a4',
            format: 'flyer_a4_portrait',
            badge: 'Menu de Gala',
            badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
            colors: ['#0f172a', '#fbbf24', '#f8fafc'],
            icon: 'fa-wand-magic-sparkles',
            builder(engine, mode = 'new_project') {
                const buildFace = (face) => {
                    face.name = 'Menu de Gala & Réveillon A4';
                    face.bgColor = '#0f172a';
                    face.objects = [
                        { type: 'illustration', illustrationId: 'frame_artdeco_border', x: 8, y: 8, w: 194, h: 281, color: '#fbbf24', opacity: 0.85 },
                        { type: 'illustration', illustrationId: 'champagne_flute_stars', x: 88, y: 18, w: 34, h: 26, color: '#fbbf24' },
                        { type: 'title_heading', x: 20, y: 46, w: 170, h: 14, customName: 'GRANDE SOIRÉE DE RÉVEILLON', fontFamily: 'Cinzel', fontSizePt: 16, color: '#fbbf24', align: 'center' },
                        { type: 'category_header', x: 20, y: 61, w: 170, h: 10, customName: 'MENU PRESTIGE DE FIN D’ANNÉE • COUPE DE CHAMPAGNE MILLÉSIMÉ OFFERTE', fontFamily: 'Montserrat', fontSizePt: 7.5, color: '#e2e8f0', align: 'center' },
                        { type: 'illustration', illustrationId: 'indesign_rule_floral', x: 55, y: 72, w: 100, h: 6, color: '#fbbf24' },

                        { type: 'dish_item', x: 25, y: 84, w: 160, h: 22, customName: 'L’Amuse-Bouche des Fêtes', customDesc: 'Royale de châtaignes d’Ardèche, émulsion de foie gras et éclats de truffe.', customPrice: 'Prélude', fontSizePt: 9.5, color: '#f8fafc', priceColor: '#fbbf24' },
                        { type: 'dish_item', x: 25, y: 110, w: 160, h: 22, customName: 'Marbré de Foie Gras de Canard Entier Mi-Cuit au Sauternes', customDesc: 'Chutney de mangue et pain brioché doré à la fleur de sel.', customPrice: 'Entrée', fontSizePt: 9.5, color: '#f8fafc', priceColor: '#fbbf24' },
                        { type: 'dish_item', x: 25, y: 136, w: 160, h: 22, customName: 'Noix de Saint-Jacques d’Erquy Rôties au Beurre de Caviar', customDesc: 'Risotto crémeux au safran et tombée de jeunes poireaux.', customPrice: 'Mer', fontSizePt: 9.5, color: '#f8fafc', priceColor: '#fbbf24' },
                        { type: 'dish_item', x: 25, y: 162, w: 160, h: 22, customName: 'Suprême de Chapon Fermier Contisé sous la Peau aux Morilles', customDesc: 'Jus réduit au vin jaune du Jura et mousseline de céleri truffée.', customPrice: 'Terre', fontSizePt: 9.5, color: '#f8fafc', priceColor: '#fbbf24' },
                        { type: 'dish_item', x: 25, y: 188, w: 160, h: 22, customName: 'La Bûche Haute Couture Chocolat Or & Mandarine Impériale', customDesc: 'Croustillant praliné noisette, sorbet mandarine givrée.', customPrice: 'Final', fontSizePt: 9.5, color: '#f8fafc', priceColor: '#fbbf24' },

                        { type: 'badge_new', x: 65, y: 224, w: 80, h: 14, text: '125 € PAR CONVIVE', bgColor: '#fbbf24', textColor: '#0f172a', radius: 7 },
                        { type: 'category_header', x: 25, y: 246, w: 160, h: 20, customName: 'Ambiance musicale jusqu’à l’aube • Cotillons & Mignardises de minuit\nAcompte de 30% à la réservation', fontFamily: 'Playfair Display', fontSizePt: 8, color: '#cbd5e1', align: 'center' }
                    ];
                };

                if (mode === 'single_face') {
                    buildFace(engine.currentFace || engine.faces[0]);
                } else {
                    engine.setFormat('flyer_a4_portrait', true);
                    buildFace(engine.faces[0]);
                }
            }
        },

        // ====================================================================
        // 18. DÉPLIANT COCKTAILS & VINS 3 VOLETS (297×210 mm)
        // ====================================================================
        {
            id: 'depliant_cocktails_3volets',
            name: 'Dépliant Bar & Vins 3 Volets (Triptyque 99×210 mm)',
            subtitle: 'Dépliant triptyque 297 × 210 mm • 3 volets de 99 mm • Volet 1 Vins & Champagnes, Volet 2 Cocktails signatures, Volet 3 Couverture & Tapas.',
            category: 'depliants_3volets',
            format: 'depliant_a4_3volets',
            badge: 'Triptyque 3V',
            badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
            colors: ['#0f172a', '#fbbf24', '#f1f5f9'],
            icon: 'fa-martini-glass-citrus',
            builder(engine, mode = 'new_project') {
                const buildFace = (face) => {
                    face.name = 'Carte Dépliant 3 Volets Bar & Vins';
                    face.bgColor = '#0f172a';
                    face.objects = [
                        // Volet 1 (0 à 99 mm) : Les Vins & Champagnes
                        { type: 'frame', x: 6, y: 8, w: 87, h: 194, borderColor: '#fbbf24', borderWidthPt: 0.8, backgroundColor: 'transparent', opacity: 0.5 },
                        { type: 'title_heading', x: 8, y: 15, w: 83, h: 10, customName: 'VINS & CHAMPAGNES', fontFamily: 'Cinzel', fontSizePt: 10.5, color: '#fbbf24', align: 'center' },
                        { type: 'illustration', illustrationId: 'indesign_rule_diamond', x: 18, y: 26, w: 63, h: 5, color: '#fbbf24', opacity: 0.8 },
                        { type: 'dish_item', x: 8, y: 35, w: 83, h: 20, customName: 'Chablis 1er Cru Domaine', customDesc: 'Minéral, floral et notes d’agrumes.', customPrice: '9 € / 45 €', fontSizePt: 8, color: '#f8fafc', priceColor: '#fbbf24' },
                        { type: 'dish_item', x: 8, y: 58, w: 83, h: 20, customName: 'Saint-Émilion Grand Cru', customDesc: 'Robe grenat, tanins soyeux, fruits noirs.', customPrice: '11 € / 58 €', fontSizePt: 8, color: '#f8fafc', priceColor: '#fbbf24' },
                        { type: 'dish_item', x: 8, y: 81, w: 83, h: 20, customName: 'Côtes de Provence Rosé Bio', customDesc: 'Pêche blanche, fraîcheur et rondeur.', customPrice: '7 € / 32 €', fontSizePt: 8, color: '#f8fafc', priceColor: '#fbbf24' },
                        { type: 'dish_item', x: 8, y: 104, w: 83, h: 20, customName: 'Champagne Brut Réserve', customDesc: 'Fines bulles dorées, notes de brioche.', customPrice: '14 € / 75 €', fontSizePt: 8, color: '#f8fafc', priceColor: '#fbbf24' },
                        { type: 'dish_item', x: 8, y: 127, w: 83, h: 20, customName: 'Sancerre Blanc Les Monts Damnés', customDesc: 'Sauvignon vif, bourgeon de cassis.', customPrice: '10 € / 49 €', fontSizePt: 8, color: '#f8fafc', priceColor: '#fbbf24' },

                        // Volet 2 (99 à 198 mm) : Les Cocktails Signatures
                        { type: 'frame', x: 105, y: 8, w: 87, h: 194, borderColor: '#fbbf24', borderWidthPt: 0.8, backgroundColor: 'transparent', opacity: 0.5 },
                        { type: 'title_heading', x: 107, y: 15, w: 83, h: 10, customName: 'COCKTAILS SIGNATURES', fontFamily: 'Cinzel', fontSizePt: 10.5, color: '#fbbf24', align: 'center' },
                        { type: 'illustration', illustrationId: 'indesign_rule_diamond', x: 117, y: 26, w: 63, h: 5, color: '#fbbf24', opacity: 0.8 },
                        { type: 'dish_item', x: 107, y: 35, w: 83, h: 20, customName: 'Smoky Mezcalita', customDesc: 'Mezcal artisanal, citron vert, agave & piment.', customPrice: '14 €', fontSizePt: 8, color: '#f8fafc', priceColor: '#fbbf24' },
                        { type: 'dish_item', x: 107, y: 58, w: 83, h: 20, customName: 'Basilico Gin Fizz', customDesc: 'Gin infusé au basilic frais, concombre, tonic.', customPrice: '13 €', fontSizePt: 8, color: '#f8fafc', priceColor: '#fbbf24' },
                        { type: 'dish_item', x: 107, y: 81, w: 83, h: 20, customName: 'Passion Bourbon Old Fashioned', customDesc: 'Bourbon vieilli en fût, passion, bitter orange.', customPrice: '15 €', fontSizePt: 8, color: '#f8fafc', priceColor: '#fbbf24' },
                        { type: 'dish_item', x: 107, y: 104, w: 83, h: 20, customName: 'Espresso Martini Velours', customDesc: 'Vodka grain, liqueur de café et espresso.', customPrice: '13 €', fontSizePt: 8, color: '#f8fafc', priceColor: '#fbbf24' },
                        { type: 'dish_item', x: 107, y: 127, w: 83, h: 20, customName: 'Virgin Garden (Sans Alcool)', customDesc: 'Jus de pomme bio, framboise et fleur de sureau.', customPrice: '9 €', fontSizePt: 8, color: '#f8fafc', priceColor: '#fbbf24' },

                        // Volet 3 (198 à 297 mm) : Couverture & Tapas
                        { type: 'frame', x: 204, y: 8, w: 87, h: 194, borderColor: '#fbbf24', borderWidthPt: 1.2, backgroundColor: 'transparent' },
                        { type: 'illustration', illustrationId: 'cocktail_martini_twist', x: 230, y: 20, w: 35, h: 28, color: '#fbbf24' },
                        { type: 'title_heading', x: 206, y: 55, w: 83, h: 14, customName: 'THE ROOFTOP\nLOUNGE BAR', fontFamily: 'Cinzel', fontSizePt: 12, color: '#ffffff', align: 'center' },
                        { type: 'category_header', x: 206, y: 75, w: 83, h: 10, customName: 'MIXOLOGIE & CAVISTE', fontFamily: 'Montserrat', fontSizePt: 7.5, color: '#fbbf24', align: 'center' },
                        { type: 'title_heading', x: 206, y: 95, w: 83, h: 8, customName: 'PETITES ASSIETTES & TAPAS', fontFamily: 'Montserrat', fontSizePt: 8, color: '#e2e8f0', align: 'center' },
                        { type: 'dish_item', x: 206, y: 108, w: 83, h: 18, customName: 'Planche Bellota & Manchego', customDesc: 'Focaccia tiède au romarin.', customPrice: '16 €', fontSizePt: 7.5, color: '#f8fafc', priceColor: '#fbbf24' },
                        { type: 'dish_item', x: 206, y: 128, w: 83, h: 18, customName: 'Guacamole Épicé & Nachos Bio', customDesc: 'Préparé minute au mortier.', customPrice: '11 €', fontSizePt: 7.5, color: '#f8fafc', priceColor: '#fbbf24' },
                        { type: 'dish_item', x: 206, y: 148, w: 83, h: 18, customName: 'Croquetas au Jamón Ibérico', customDesc: 'Béchamel fondante (6 pièces).', customPrice: '12 €', fontSizePt: 7.5, color: '#f8fafc', priceColor: '#fbbf24' }
                    ];
                };

                if (mode === 'single_face') {
                    buildFace(engine.currentFace || engine.faces[0]);
                } else {
                    engine.setFormat('depliant_a4_3volets', true);
                    buildFace(engine.faces[0]);
                }
            }
        },

        // ====================================================================
        // 19. DÉPLIANT LIVRAISON & VENTE À EMPORTER 3 VOLETS (Recto/Verso)
        // ====================================================================
        {
            id: 'depliant_vente_emporter_3volets',
            name: 'Dépliant Livraison & Vente à Emporter 3 Volets (Recto / Verso)',
            subtitle: 'Dépliant triptyque 297 × 210 mm • 2 faces complètes (Extérieur Couverture + Infos Livraison / Intérieur Carte complète Pizzas, Burgers & Salades).',
            category: 'depliants_3volets',
            format: 'depliant_a4_3volets',
            badge: 'Take-Away 3V',
            badgeColor: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
            colors: ['#fff7ed', '#c2410c', '#1e293b'],
            icon: 'fa-motorcycle',
            builder(engine, mode = 'new_project') {
                const buildExt = (face) => {
                    face.name = 'Recto Extérieur (Volets Pliés & Couverture)';
                    face.bgColor = '#fff7ed';
                    face.objects = [
                        // Volet 1 (Rabat intérieur gauche 0-99mm) : Les Formules Midi
                        { type: 'frame', x: 6, y: 8, w: 87, h: 194, backgroundColor: '#ffffff', borderColor: '#c2410c', borderWidthPt: 1, borderRadius: 4 },
                        { type: 'title_heading', x: 10, y: 16, w: 79, h: 10, customName: 'NOS FORMULES EXPRESS', fontFamily: 'Montserrat', fontSizePt: 9.5, color: '#c2410c', align: 'center' },
                        { type: 'dish_item', x: 10, y: 32, w: 79, h: 22, customName: 'Formule Solo Midi', customDesc: '1 Pizza ou Burger au choix + 1 Boisson 33cl + 1 Dessert maison.', customPrice: '14,90 €', fontSizePt: 8, color: '#1e293b', priceColor: '#c2410c' },
                        { type: 'dish_item', x: 10, y: 60, w: 79, h: 22, customName: 'Formule Duo Soirée', customDesc: '2 Pizzas au choix + 1 Grande Bouteille 1,25L + 2 Tiramisus.', customPrice: '29,90 €', fontSizePt: 8, color: '#1e293b', priceColor: '#c2410c' },
                        { type: 'dish_item', x: 10, y: 88, w: 79, h: 22, customName: 'Box Famille & Match (4 pers.)', customDesc: '3 Grandes Pizzas + 12 Tenders croustillants + Maxi Boisson.', customPrice: '44,90 €', fontSizePt: 8, color: '#1e293b', priceColor: '#c2410c' },
                        { type: 'badge_new', x: 18, y: 150, w: 63, h: 12, text: '-10% À EMPORTER', bgColor: '#c2410c', textColor: '#ffffff', radius: 6 },

                        // Volet 2 Central (Dos du dépliant 99-198mm) : Infos Pratiques & Livraison
                        { type: 'frame', x: 105, y: 8, w: 87, h: 194, backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderWidthPt: 1, borderRadius: 4 },
                        { type: 'title_heading', x: 109, y: 20, w: 79, h: 10, customName: 'LIVRAISON GRATUITE 7J/7', fontFamily: 'Cinzel', fontSizePt: 9.5, color: '#1e293b', align: 'center' },
                        { type: 'category_header', x: 109, y: 36, w: 79, h: 45, customName: 'Commandez par téléphone ou en Click & Collect :\n01 48 00 00 00\n\nLivraison en 30 minutes chaud à domicile ou au bureau\nMinimum de commande : 15 €', fontFamily: 'Montserrat', fontSizePt: 8, color: '#475569', align: 'center' },
                        { type: 'title_heading', x: 109, y: 100, w: 79, h: 10, customName: 'HORAIRES D’OUVERTURE', fontFamily: 'Montserrat', fontSizePt: 8.5, color: '#c2410c', align: 'center' },
                        { type: 'category_header', x: 109, y: 114, w: 79, h: 35, customName: '7j/7 de 11h30 à 14h30\net de 18h30 à 23h00\n(23h30 le Vendredi & Samedi)', fontFamily: 'Montserrat', fontSizePt: 8, color: '#334155', align: 'center' },

                        // Volet 3 Droit (Couverture de face 198-297mm)
                        { type: 'frame', x: 204, y: 8, w: 87, h: 194, backgroundColor: '#1e293b', borderColor: '#c2410c', borderWidthPt: 1.5, borderRadius: 4 },
                        { type: 'illustration', illustrationId: 'pizza_woodfire_paddle', x: 230, y: 28, w: 35, h: 25, color: '#fb923c' },
                        { type: 'title_heading', x: 208, y: 62, w: 79, h: 20, customName: 'BELLA\nFORNO', fontFamily: 'Cinzel', fontSizePt: 15, color: '#ffffff', align: 'center' },
                        { type: 'category_header', x: 208, y: 88, w: 79, h: 12, customName: 'PIZZAS AU FEU DE BOIS • BURGERS • PASTA', fontFamily: 'Montserrat', fontSizePt: 7.5, color: '#fb923c', align: 'center' },
                        { type: 'badge_new', x: 216, y: 145, w: 63, h: 12, text: 'PÂTE FRAÎCHE 72H', bgColor: '#ea580c', textColor: '#ffffff', radius: 6 }
                    ];
                };

                const buildInt = (face) => {
                    face.name = 'Verso Intérieur (Carte Complète 3 Colonnes)';
                    face.bgColor = '#fff7ed';
                    face.objects = [
                        { type: 'title_heading', x: 8, y: 12, w: 83, h: 10, customName: 'PIZZAS TRADITION (33 CM)', fontFamily: 'Cinzel', fontSizePt: 9.5, color: '#c2410c', align: 'center' },
                        { type: 'dish_item', x: 8, y: 26, w: 83, h: 20, customName: 'Margherita Classica', customDesc: 'Tomate, mozzarella fior di latte, basilic.', customPrice: '10,50 €', fontSizePt: 8, color: '#1e293b', priceColor: '#c2410c' },
                        { type: 'dish_item', x: 8, y: 48, w: 83, h: 20, customName: 'Reine / Regina', customDesc: 'Tomate, mozzarella, jambon, champignons.', customPrice: '12,50 €', fontSizePt: 8, color: '#1e293b', priceColor: '#c2410c' },
                        { type: 'dish_item', x: 8, y: 70, w: 83, h: 20, customName: 'Calzone Soufflée', customDesc: 'Jambon, mozzarella, œuf bio, sauce tomate.', customPrice: '13,50 €', fontSizePt: 8, color: '#1e293b', priceColor: '#c2410c' },
                        { type: 'dish_item', x: 8, y: 92, w: 83, h: 20, customName: 'Chèvre Miel & Noix', customDesc: 'Crème fraîche, mozzarella, chèvre, miel.', customPrice: '13,90 €', fontSizePt: 8, color: '#1e293b', priceColor: '#c2410c' },

                        { type: 'title_heading', x: 107, y: 12, w: 83, h: 10, customName: 'BURGERS GOURMETS & FRITES', fontFamily: 'Cinzel', fontSizePt: 9.5, color: '#c2410c', align: 'center' },
                        { type: 'dish_item', x: 107, y: 26, w: 83, h: 20, customName: 'Le Bistrot Montagnard', customDesc: 'Bœuf 150g, raclette fondue, lard grillé.', customPrice: '13,50 €', fontSizePt: 8, color: '#1e293b', priceColor: '#c2410c' },
                        { type: 'dish_item', x: 107, y: 48, w: 83, h: 20, customName: 'Le Double Cheese Bacon', customDesc: '2 steaks 120g, double cheddar, sauce maison.', customPrice: '14,00 €', fontSizePt: 8, color: '#1e293b', priceColor: '#c2410c' },
                        { type: 'dish_item', x: 107, y: 70, w: 83, h: 20, customName: 'L’Italien Pesto & Burrata', customDesc: 'Bœuf, tomates confites, burrata crémeuse.', customPrice: '14,50 €', fontSizePt: 8, color: '#1e293b', priceColor: '#c2410c' },

                        { type: 'title_heading', x: 206, y: 12, w: 83, h: 10, customName: 'SALADES, DESSERTS & BOISSONS', fontFamily: 'Cinzel', fontSizePt: 9.5, color: '#c2410c', align: 'center' },
                        { type: 'dish_item', x: 206, y: 26, w: 83, h: 20, customName: 'Grande Salade César Poulet', customDesc: 'Cœur de laitue, parmesan, croûtons.', customPrice: '11,50 €', fontSizePt: 8, color: '#1e293b', priceColor: '#c2410c' },
                        { type: 'dish_item', x: 206, y: 48, w: 83, h: 20, customName: 'Tiramisu Maison au Café', customDesc: 'Mascarpone et cacao amer.', customPrice: '5,00 €', fontSizePt: 8, color: '#1e293b', priceColor: '#c2410c' },
                        { type: 'dish_item', x: 206, y: 70, w: 83, h: 20, customName: 'Panna Cotta Fruits Rouges', customDesc: 'Vanille de Madagascar.', customPrice: '4,50 €', fontSizePt: 8, color: '#1e293b', priceColor: '#c2410c' }
                    ];
                };

                if (mode === 'single_face') {
                    buildExt(engine.currentFace || engine.faces[0]);
                } else {
                    engine.setFormat('depliant_a4_3volets', true);
                    buildExt(engine.faces[0]);
                    if (engine.faces[1]) buildInt(engine.faces[1]);
                }
            }
        },

        // ====================================================================
        // 20. BROCHURE TRAITEUR, BANQUETS & RÉCEPTIONS 3 VOLETS
        // ====================================================================
        {
            id: 'depliant_traiteur_reception_3volets',
            name: 'Brochure Traiteur, Banquets & Réceptions 3 Volets',
            subtitle: 'Dépliant triptyque 297 × 210 mm • Cocktails dînatoires, Buffets froids & chauds, Repas assis de mariage et événements d’entreprise.',
            category: 'depliants_3volets',
            format: 'depliant_a4_3volets',
            badge: 'Traiteur 3V',
            badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
            colors: ['#fdfbf7', '#78350f', '#d97706'],
            icon: 'fa-bell-concierge',
            builder(engine, mode = 'new_project') {
                const buildFace = (face) => {
                    face.name = 'Brochure Traiteur & Réceptions 3 Volets';
                    face.bgColor = '#fdfbf7';
                    face.objects = [
                        { type: 'frame', x: 6, y: 8, w: 87, h: 194, borderColor: '#d97706', borderWidthPt: 1, backgroundColor: 'transparent' },
                        { type: 'title_heading', x: 10, y: 15, w: 79, h: 10, customName: 'COCKTAILS DÎNATOIRES', fontFamily: 'Cinzel', fontSizePt: 10, color: '#78350f', align: 'center' },
                        { type: 'dish_item', x: 10, y: 30, w: 79, h: 24, customName: 'Cocktail Apéritif (12 Pièces / pers.)', customDesc: '8 pièces salées froides & chaudes + 4 mignardises sucrées.', customPrice: '24 € HT', fontSizePt: 8, color: '#1e293b', priceColor: '#b45309' },
                        { type: 'dish_item', x: 10, y: 58, w: 79, h: 24, customName: 'Grand Cocktail Dînatoire (20 Pièces)', customDesc: 'Avec 2 ateliers culinaires animés par nos chefs (Plancha, Découpe).', customPrice: '42 € HT', fontSizePt: 8, color: '#1e293b', priceColor: '#b45309' },

                        { type: 'frame', x: 105, y: 8, w: 87, h: 194, borderColor: '#d97706', borderWidthPt: 1, backgroundColor: 'transparent' },
                        { type: 'title_heading', x: 109, y: 15, w: 79, h: 10, customName: 'MENUS DE RÉCEPTION ASSIS', fontFamily: 'Cinzel', fontSizePt: 10, color: '#78350f', align: 'center' },
                        { type: 'dish_item', x: 109, y: 30, w: 79, h: 24, customName: 'Menu Symphonie (3 Services)', customDesc: 'Entrée de saison, Volaille fermière ou Poisson noble, Pièce montée.', customPrice: '58 € HT', fontSizePt: 8, color: '#1e293b', priceColor: '#b45309' },
                        { type: 'dish_item', x: 109, y: 58, w: 79, h: 24, customName: 'Menu Prestige Gala (4 Services)', customDesc: 'Foie gras, Saint-Jacques, Filet de bœuf aux morilles, Fromages & Dessert.', customPrice: '79 € HT', fontSizePt: 8, color: '#1e293b', priceColor: '#b45309' },

                        { type: 'frame', x: 204, y: 8, w: 87, h: 194, backgroundColor: '#292524', borderColor: '#d97706', borderWidthPt: 1.2 },
                        { type: 'illustration', illustrationId: 'cloche_prestige', x: 230, y: 28, w: 35, h: 25, color: '#fbbf24' },
                        { type: 'title_heading', x: 208, y: 62, w: 79, h: 18, customName: 'MAISON\nVALMONT', fontFamily: 'Cinzel', fontSizePt: 14, color: '#ffffff', align: 'center' },
                        { type: 'category_header', x: 208, y: 86, w: 79, h: 24, customName: 'TRAITEUR & ORGANISATEUR DE RÉCEPTIONS\nMariages • Séminaires • Galas', fontFamily: 'Montserrat', fontSizePt: 7.5, color: '#fde68a', align: 'center' }
                    ];
                };

                if (mode === 'single_face') {
                    buildFace(engine.currentFace || engine.faces[0]);
                } else {
                    engine.setFormat('depliant_a4_3volets', true);
                    buildFace(engine.faces[0]);
                }
            }
        },

        // ====================================================================
        // 21. CHEVALET / MENU DU JOUR A5 (148×210 mm)
        // ====================================================================
        {
            id: 'chevalet_menu_midi_a5',
            name: 'Chevalet de Table / Menu Midi Express A5',
            subtitle: 'Format A5 148 × 210 mm • Idéal chevalet de table, formules déjeuner express du midi, carte des desserts & vins au verre.',
            category: 'a5_chevalets',
            format: 'flyer_a5_portrait',
            badge: 'Chevalet A5',
            badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
            colors: ['#ffffff', '#0369a1', '#f59e0b'],
            icon: 'fa-tablet-screen-button',
            builder(engine, mode = 'new_project') {
                const buildFace = (face) => {
                    face.name = 'Chevalet A5 Formule Midi';
                    face.bgColor = '#ffffff';
                    face.objects = [
                        { type: 'frame', x: 6, y: 6, w: 136, h: 198, borderColor: '#0369a1', borderWidthPt: 1, backgroundColor: 'transparent' },
                        { type: 'title_heading', x: 10, y: 12, w: 128, h: 12, customName: 'FORMULE DU MARCHÉ', fontFamily: 'Cinzel', fontSizePt: 13, color: '#0369a1', align: 'center' },
                        { type: 'category_header', x: 10, y: 25, w: 128, h: 8, customName: 'Servie du Lundi au Vendredi midi (hors jours fériés)', fontFamily: 'Montserrat', fontSizePt: 7.5, color: '#64748b', align: 'center' },
                        { type: 'frame', x: 15, y: 36, w: 56, h: 16, backgroundColor: '#0369a1', borderRadius: 4 },
                        { type: 'title_heading', x: 15, y: 39, w: 56, h: 10, customName: 'E + P ou P + D : 16,50 €', fontFamily: 'Montserrat', fontSizePt: 7.5, color: '#ffffff', align: 'center' },
                        { type: 'frame', x: 77, y: 36, w: 56, h: 16, backgroundColor: '#0284c7', borderRadius: 4 },
                        { type: 'title_heading', x: 77, y: 39, w: 56, h: 10, customName: 'E + P + D : 20,50 €', fontFamily: 'Montserrat', fontSizePt: 7.5, color: '#ffffff', align: 'center' },
                        { type: 'dish_item', x: 12, y: 60, w: 124, h: 20, customName: 'Entrée : Velouté de Légumes Rôtis ou Salade Italienne', customDesc: 'Vinaigrette balsamique et graines torréfiées.', customPrice: '6,00 €', fontSizePt: 8, color: '#0f172a', priceColor: '#0369a1' },
                        { type: 'dish_item', x: 12, y: 84, w: 124, h: 20, customName: 'Plat : Suprême de Poulet Rôti ou Pavé de Saumon', customDesc: 'Purée maison à l’huile d’olive et légumes glacés.', customPrice: '13,00 €', fontSizePt: 8, color: '#0f172a', priceColor: '#0369a1' },
                        { type: 'dish_item', x: 12, y: 108, w: 124, h: 20, customName: 'Dessert : Mousse au Chocolat Noir ou Tarte du Jour', customDesc: 'Crème anglaise vanille bourbon.', customPrice: '6,00 €', fontSizePt: 8, color: '#0f172a', priceColor: '#0369a1' },
                        { type: 'category_header', x: 12, y: 165, w: 124, h: 24, customName: 'Café Illy ou Thé offert avec la formule complète !\nPain de campagne au levain tranché à discrétion.', fontFamily: 'Montserrat', fontSizePt: 7.5, color: '#475569', align: 'center' }
                    ];
                };

                if (mode === 'single_face') {
                    buildFace(engine.currentFace || engine.faces[0]);
                } else {
                    engine.setFormat('flyer_a5_portrait', true);
                    buildFace(engine.faces[0]);
                }
            }
        },

        // ====================================================================
        // 22. CHEVALET A5 — HAPPY HOUR, COCKTAILS & TAPAS (148×210 mm)
        // ====================================================================
        {
            id: 'chevalet_happy_hour_tapas_a5',
            name: 'Chevalet A5 — Happy Hour, Cocktails & Tapas à Partager',
            subtitle: 'Format A5 148 × 210 mm • Chevalet de bar & terrasse • Tarifs Happy Hour 17h–20h, Spritz, Mojitos, Bières pressions & Planches.',
            category: 'a5_chevalets',
            format: 'flyer_a5_portrait',
            badge: 'Happy Hour A5',
            badgeColor: 'bg-pink-500/20 text-pink-300 border-pink-500/40',
            colors: ['#1e1b4b', '#ec4899', '#fbbf24'],
            icon: 'fa-champagne-glasses',
            builder(engine, mode = 'new_project') {
                const buildFace = (face) => {
                    face.name = 'Chevalet A5 Happy Hour & Tapas';
                    face.bgColor = '#1e1b4b';
                    face.objects = [
                        { type: 'frame', x: 6, y: 6, w: 136, h: 198, borderColor: '#ec4899', borderWidthPt: 1.5, backgroundColor: 'transparent' },
                        { type: 'badge_new', x: 39, y: 12, w: 70, h: 11, text: 'TOUS LES JOURS 17H - 20H', bgColor: '#ec4899', textColor: '#ffffff', radius: 5 },
                        { type: 'title_heading', x: 12, y: 26, w: 124, h: 14, customName: 'HAPPY HOUR & TAPAS', fontFamily: 'Cinzel', fontSizePt: 14, color: '#fbbf24', align: 'center' },

                        { type: 'dish_item', x: 12, y: 46, w: 124, h: 18, customName: 'Tous nos Cocktails Signatures & Mojitos', customDesc: 'Spritz, Moscow Mule, Piña Colada, Margarita (hors HH : 11 €).', customPrice: '7,00 €', fontSizePt: 8.5, color: '#ffffff', priceColor: '#fbbf24' },
                        { type: 'dish_item', x: 12, y: 68, w: 124, h: 18, customName: 'Pinte de Bière Artisanale Pression (50cl)', customDesc: 'IPA locale, Blonde d’Abbaye ou Blanche bio.', customPrice: '5,50 €', fontSizePt: 8.5, color: '#ffffff', priceColor: '#fbbf24' },
                        { type: 'dish_item', x: 12, y: 90, w: 124, h: 18, customName: 'Mocktails Création Sans Alcool', customDesc: 'Virgin Mojito Passion ou Ginger Fizz.', customPrice: '5,00 €', fontSizePt: 8.5, color: '#ffffff', priceColor: '#fbbf24' },

                        { type: 'title_heading', x: 12, y: 116, w: 124, h: 10, customName: 'À PARTAGER AUTOUR D’UN VERRE', fontFamily: 'Montserrat', fontSizePt: 9, color: '#f472b6', align: 'center' },
                        { type: 'dish_item', x: 12, y: 128, w: 124, h: 18, customName: 'Grande Planche Mixte Charcuteries & Fromages', customDesc: 'Servie avec pain au levain grillé et beurre demi-sel.', customPrice: '18,00 €', fontSizePt: 8.5, color: '#ffffff', priceColor: '#fbbf24' },
                        { type: 'dish_item', x: 12, y: 150, w: 124, h: 18, customName: 'Trio Houmous, Tzatziki, Guacamole & Pita Chaude', customDesc: 'Préparés maison aux herbes fraîches.', customPrice: '13,50 €', fontSizePt: 8.5, color: '#ffffff', priceColor: '#fbbf24' },
                        { type: 'category_header', x: 12, y: 180, w: 124, h: 14, customName: 'DJ Set tous les Vendredis & Samedis dès 19h00', fontFamily: 'Montserrat', fontSizePt: 7.5, color: '#cbd5e1', align: 'center' }
                    ];
                };

                if (mode === 'single_face') {
                    buildFace(engine.currentFace || engine.faces[0]);
                } else {
                    engine.setFormat('flyer_a5_portrait', true);
                    buildFace(engine.faces[0]);
                }
            }
        },

        // ====================================================================
        // 23. CARTE DES DESSERTS, CAFÉS & DIGESTIFS A5 (148×210 mm)
        // ====================================================================
        {
            id: 'chevalet_desserts_digestifs_a5',
            name: 'Carte des Desserts, Cafés Grands Crus & Digestifs A5',
            subtitle: 'Format A5 148 × 210 mm • Carte de fin de repas élégante • Créations du chef pâtissier, Glaces artisanales, Cafés & Digestifs.',
            category: 'a5_chevalets',
            format: 'flyer_a5_portrait',
            badge: 'Carte Desserts A5',
            badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
            colors: ['#fdfbf7', '#78350f', '#b45309'],
            icon: 'fa-cookie-bite',
            builder(engine, mode = 'new_project') {
                const buildFace = (face) => {
                    face.name = 'Carte des Desserts & Digestifs A5';
                    face.bgColor = '#fdfbf7';
                    face.objects = [
                        { type: 'frame', x: 6, y: 6, w: 136, h: 198, borderColor: '#b45309', borderWidthPt: 1.2, backgroundColor: 'transparent' },
                        { type: 'illustration', illustrationId: 'indesign_flourish_crest', x: 56, y: 12, w: 36, h: 14, color: '#b45309' },
                        { type: 'title_heading', x: 12, y: 28, w: 124, h: 10, customName: 'DOUCEURS & FIN DE REPAS', fontFamily: 'Cinzel', fontSizePt: 12, color: '#78350f', align: 'center' },
                        { type: 'illustration', illustrationId: 'indesign_rule_diamond', x: 34, y: 39, w: 80, h: 5, color: '#b45309' },

                        { type: 'dish_item', x: 12, y: 48, w: 124, h: 18, customName: 'Tarte Tatin Tiède Caramélisée au Beurre Demi-Sel', customDesc: 'Crème double d’Isigny ou glace vanille bourbon.', customPrice: '9,50 €', fontSizePt: 8.5, color: '#1e293b', priceColor: '#b45309' },
                        { type: 'dish_item', x: 12, y: 68, w: 124, h: 18, customName: 'Baba au Rhum Vieux Agricole & Chantilly Légère', customDesc: 'Bouteille de rhum ambré déposée sur votre table.', customPrice: '11,00 €', fontSizePt: 8.5, color: '#1e293b', priceColor: '#b45309' },
                        { type: 'dish_item', x: 12, y: 88, w: 124, h: 18, customName: 'Mi-Cuit au Chocolat Guanaja 70% (Cuisson 10 min)', customDesc: 'Cœur coulant et glace à la fève tonka.', customPrice: '10,50 €', fontSizePt: 8.5, color: '#1e293b', priceColor: '#b45309' },
                        { type: 'dish_item', x: 12, y: 108, w: 124, h: 18, customName: 'Coupe Colonel ou After-Eight', customDesc: '2 boules de sorbet artisanal arrosées d’eau-de-vie (4cl).', customPrice: '11,50 €', fontSizePt: 8.5, color: '#1e293b', priceColor: '#b45309' },

                        { type: 'title_heading', x: 12, y: 134, w: 124, h: 9, customName: 'CAFÉS DE SPÉCIALITÉ & DIGESTIFS (4CL)', fontFamily: 'Cinzel', fontSizePt: 9.5, color: '#78350f', align: 'center' },
                        { type: 'dish_item', x: 12, y: 146, w: 124, h: 16, customName: 'Espresso, Décaféiné à l’eau ou Infusion Bio', customDesc: 'Servi avec son carré de chocolat noir grand cru.', customPrice: '3,20 €', fontSizePt: 8, color: '#1e293b', priceColor: '#b45309' },
                        { type: 'dish_item', x: 12, y: 164, w: 124, h: 16, customName: 'Cognac XO, Armagnac Hors d’Âge ou Calvados Pays d’Auge', customDesc: 'Servi en verre tulipe de dégustation.', customPrice: '12,00 €', fontSizePt: 8, color: '#1e293b', priceColor: '#b45309' },
                        { type: 'dish_item', x: 12, y: 182, w: 124, h: 16, customName: 'Limoncello di Sorrento IGP ou Amaretto Disaronno', customDesc: 'Servi givré sur glace.', customPrice: '7,50 €', fontSizePt: 8, color: '#1e293b', priceColor: '#b45309' }
                    ];
                };

                if (mode === 'single_face') {
                    buildFace(engine.currentFace || engine.faces[0]);
                } else {
                    engine.setFormat('flyer_a5_portrait', true);
                    buildFace(engine.faces[0]);
                }
            }
        },

        // ====================================================================
        // 24. GABARIT MAÎTRE INDESIGN — GRILLE PRÉ-CADRÉE (340×300 mm)
        // ====================================================================
        {
            id: 'vierge_grille_maitre_34x30',
            name: 'Gabarit Maître InDesign — Livret 34×30 cm (Filets & En-têtes pré-posés)',
            subtitle: 'Gabarit d’architecture InDesign • Double filet sur chaque panneau 17×30 cm, en-têtes courants, séparateurs losange et folios prêts à remplir.',
            category: 'vierge',
            format: 'menu_34x30',
            badge: 'Gabarit Maître',
            badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
            colors: ['#fdfbf7', '#c8a96a', '#1e293b'],
            icon: 'fa-border-all',
            builder(engine, mode = 'new_project') {
                const buildMasterSpread = (face, idx = 0) => {
                    face.bgColor = '#fdfbf7';
                    face.objects = [
                        // Panneau Gauche : Double filet maître
                        { type: 'frame', x: 12, y: 12, w: 146, h: 276, borderColor: '#c8a96a', borderWidthPt: 1.5, backgroundColor: 'transparent', locked: true },
                        { type: 'frame', x: 15, y: 15, w: 140, h: 270, borderColor: '#c8a96a', borderWidthPt: 0.5, backgroundColor: 'transparent', opacity: 0.5, locked: true },
                        { type: 'title_heading', x: 22, y: 24, w: 126, h: 12, customName: 'TITRE DE SECTION GAUCHE', fontFamily: 'Cinzel', fontSizePt: 12, color: '#1e293b', align: 'center' },
                        { type: 'illustration', illustrationId: 'indesign_rule_diamond', x: 35, y: 37, w: 100, h: 6, color: '#c8a96a' },

                        // Panneau Droit : Double filet maître
                        { type: 'frame', x: 182, y: 12, w: 146, h: 276, borderColor: '#c8a96a', borderWidthPt: 1.5, backgroundColor: 'transparent', locked: true },
                        { type: 'frame', x: 185, y: 15, w: 140, h: 270, borderColor: '#c8a96a', borderWidthPt: 0.5, backgroundColor: 'transparent', opacity: 0.5, locked: true },
                        { type: 'title_heading', x: 192, y: 24, w: 126, h: 12, customName: 'TITRE DE SECTION DROITE', fontFamily: 'Cinzel', fontSizePt: 12, color: '#1e293b', align: 'center' },
                        { type: 'illustration', illustrationId: 'indesign_rule_diamond', x: 205, y: 37, w: 100, h: 6, color: '#c8a96a' }
                    ];
                };

                if (mode === 'single_face') {
                    buildMasterSpread(engine.currentFace || engine.faces[0]);
                } else {
                    engine.setFormat('menu_34x30', true);
                    engine.faces.forEach((f, i) => buildMasterSpread(f, i));
                }
            }
        },

        // ====================================================================
        // 25-28. PROJETS VIERGES PRÉ-PARAMÉTRÉS (Pour démarrer de zéro)
        // ====================================================================
        {
            id: 'vierge_menu_34x30',
            name: 'Projet Vierge — Menu Livret 34 × 30 cm (2 Volets)',
            subtitle: 'Page vierge prête pour création sur mesure • 340 × 300 mm avec pli central 170 mm, repères de marges et fond perdu 3 mm.',
            category: 'vierge',
            format: 'menu_34x30',
            badge: 'Projet Vierge',
            badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
            colors: ['#ffffff', '#3b82f6', '#94a3b8'],
            icon: 'fa-file-circle-plus',
            builder(engine, mode = 'new_project') {
                if (mode === 'single_face') {
                    const f = engine.currentFace || engine.faces[0];
                    if (f) { f.objects = []; f.bgColor = '#fdfbf7'; }
                } else {
                    engine.setFormat('menu_34x30', true);
                    engine.faces.forEach(face => { face.objects = []; face.bgColor = '#fdfbf7'; });
                }
            }
        },
        {
            id: 'vierge_flyer_a4',
            name: 'Projet Vierge — Flyer A4 Portrait (210 × 297 mm)',
            subtitle: 'Page A4 vierge prête pour flyer, affiche ou carte 1 page • Marges de sécurité 8 mm et repères InDesign prêts.',
            category: 'vierge',
            format: 'flyer_a4_portrait',
            badge: 'Projet Vierge',
            badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
            colors: ['#ffffff', '#10b981', '#94a3b8'],
            icon: 'fa-file-circle-plus',
            builder(engine, mode = 'new_project') {
                if (mode === 'single_face') {
                    const f = engine.currentFace || engine.faces[0];
                    if (f) { f.objects = []; f.bgColor = '#ffffff'; }
                } else {
                    engine.setFormat('flyer_a4_portrait', true);
                    engine.faces.forEach(face => { face.objects = []; face.bgColor = '#ffffff'; });
                }
            }
        },
        {
            id: 'vierge_set_table_a4_landscape',
            name: 'Projet Vierge — Set de Table A4 Paysage (297 × 210 mm)',
            subtitle: 'Format horizontal A4 paysage vierge • Idéal pour set de table panoramique ou menu grand format sans pli.',
            category: 'vierge',
            format: 'flyer_a4_landscape',
            badge: 'Projet Vierge',
            badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
            colors: ['#ffffff', '#06b6d4', '#94a3b8'],
            icon: 'fa-file-circle-plus',
            builder(engine, mode = 'new_project') {
                if (mode === 'single_face') {
                    const f = engine.currentFace || engine.faces[0];
                    if (f) { f.objects = []; f.bgColor = '#ffffff'; }
                } else {
                    engine.setFormat('flyer_a4_landscape', true);
                    engine.faces.forEach(face => { face.objects = []; face.bgColor = '#ffffff'; });
                }
            }
        },
        {
            id: 'vierge_depliant_3volets',
            name: 'Projet Vierge — Dépliant 3 Volets (297 × 210 mm)',
            subtitle: 'Page triptyque vierge • 3 colonnes de 99 mm avec plis marqués à 99 mm et 198 mm.',
            category: 'vierge',
            format: 'depliant_a4_3volets',
            badge: 'Projet Vierge',
            badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
            colors: ['#ffffff', '#8b5cf6', '#94a3b8'],
            icon: 'fa-file-circle-plus',
            builder(engine, mode = 'new_project') {
                if (mode === 'single_face') {
                    const f = engine.currentFace || engine.faces[0];
                    if (f) { f.objects = []; f.bgColor = '#fdfbf7'; }
                } else {
                    engine.setFormat('depliant_a4_3volets', true);
                    engine.faces.forEach(face => { face.objects = []; face.bgColor = '#fdfbf7'; });
                }
            }
        },
        {
            id: 'vierge_a5',
            name: 'Projet Vierge — Chevalet / Flyer A5 (148 × 210 mm)',
            subtitle: 'Format de poche A5 vierge • Prêt pour fiches suggestions, chevalets ou mini-flyers.',
            category: 'vierge',
            format: 'flyer_a5_portrait',
            badge: 'Projet Vierge',
            badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
            colors: ['#ffffff', '#06b6d4', '#94a3b8'],
            icon: 'fa-file-circle-plus',
            builder(engine, mode = 'new_project') {
                if (mode === 'single_face') {
                    const f = engine.currentFace || engine.faces[0];
                    if (f) { f.objects = []; f.bgColor = '#ffffff'; }
                } else {
                    engine.setFormat('flyer_a5_portrait', true);
                    engine.faces.forEach(face => { face.objects = []; face.bgColor = '#ffffff'; });
                }
            }
        }
    ],

    getById(id) {
        return this.templates.find(t => t.id === id) || null;
    },

    filter(categoryId = 'all', searchQuery = '') {
        let results = this.templates;
        if (categoryId && categoryId !== 'all') {
            results = results.filter(t => t.category === categoryId);
        }
        if (searchQuery && searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            results = results.filter(t =>
                t.name.toLowerCase().includes(q) ||
                t.subtitle.toLowerCase().includes(q) ||
                (t.badge && t.badge.toLowerCase().includes(q)) ||
                (t.format && t.format.toLowerCase().includes(q))
            );
        }
        return results;
    }
};

if (typeof window !== 'undefined') {
    window.InDesignTemplatesBank = InDesignTemplatesBank;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { InDesignTemplatesBank };
}
