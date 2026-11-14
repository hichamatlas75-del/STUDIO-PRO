/**
 * ============================================================================
 * BANQUE DE GABARITS & MODÈLES PROFESSIONNELS CLONE ADOBE INDESIGN
 * InMenu Studio Pro - Module de Gabarits Éditoriaux PAO
 * 
 * Contient une bibliothèque complète de modèles de menus, flyers, dépliants
 * et projets vierges professionnels, configurés avec la rigueur typographique
 * et géométrique d'Adobe InDesign CC (grilles, filets, marges et fonds perdus).
 * ============================================================================
 */

const InDesignTemplatesBank = {
    categories: [
        { id: 'all', name: 'Tous les Gabarits', icon: 'fa-shapes' },
        { id: 'menu_livret', name: 'Menus Livrets 2 Volets (34×30)', icon: 'fa-book-open' },
        { id: 'flyers_a4', name: 'Flyers & Affiches A4', icon: 'fa-file-lines' },
        { id: 'depliants_3volets', name: 'Dépliants Triptyques 3 Volets', icon: 'fa-map' },
        { id: 'a5_chevalets', name: 'Chevalets & Cartes A5', icon: 'fa-tablet-screen-button' },
        { id: 'street_urban', name: 'Street Food & Urbain', icon: 'fa-burger' },
        { id: 'vierge', name: 'Projets Vierges Pré-paramétrés', icon: 'fa-file-circle-plus' }
    ],

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
            badge: 'Gastronomique',
            badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
            colors: ['#1c1917', '#c8a96a', '#f5f5f4'],
            icon: 'fa-utensils',
            builder(engine, mode = 'new_project') {
                const w = 340;
                const h = 300;
                const fold = 170;

                // Fonction de peuplement de la face 0 (Couverture + Dos)
                const buildFace0 = (face) => {
                    face.name = 'Feuille 1 — Recto (Couverture & Dos)';
                    face.bgColor = '#1c1917';
                    face.objects = [
                        // Panneau Gauche : Dos de Menu épuré (0 à 170 mm)
                        {
                            id: 'tpl_back_border',
                            type: 'frame',
                            x: 12, y: 12, w: 146, h: 276,
                            borderColor: '#c8a96a',
                            borderWidthPt: 1,
                            backgroundColor: 'transparent',
                            borderRadius: 0,
                            borderStyle: 'solid',
                            opacity: 0.6
                        },
                        {
                            id: 'tpl_back_logo',
                            type: 'illustration',
                            illustrationId: 'indesign_flourish_crest',
                            x: 65, y: 35, w: 40, h: 20,
                            color: '#c8a96a',
                            opacity: 1
                        },
                        {
                            id: 'tpl_back_title',
                            type: 'title_heading',
                            x: 20, y: 62, w: 130, h: 14,
                            customName: 'L’ATELIER DES SENS',
                            fontFamily: 'Cinzel',
                            fontSizePt: 13,
                            color: '#c8a96a',
                            align: 'center'
                        },
                        {
                            id: 'tpl_back_divider',
                            type: 'illustration',
                            illustrationId: 'indesign_rule_diamond',
                            x: 35, y: 78, w: 100, h: 6,
                            color: '#c8a96a',
                            opacity: 0.8
                        },
                        {
                            id: 'tpl_back_hours_title',
                            type: 'title_heading',
                            x: 20, y: 110, w: 130, h: 10,
                            customName: 'HEURES DE SERVICE',
                            fontFamily: 'Montserrat',
                            fontSizePt: 8.5,
                            color: '#e7e5e4',
                            align: 'center'
                        },
                        {
                            id: 'tpl_back_hours_text',
                            type: 'category_header',
                            x: 25, y: 122, w: 120, h: 32,
                            customName: 'Mardi au Dimanche\nDéjeuner : 12h00 — 14h30\nDîner : 19h30 — 22h30\nFermé le Lundi',
                            fontFamily: 'Montserrat',
                            fontSizePt: 7.5,
                            color: '#a8a29e',
                            align: 'center'
                        },
                        {
                            id: 'tpl_back_badge',
                            type: 'illustration',
                            illustrationId: 'badge_fait_maison_pro',
                            x: 70, y: 175, w: 30, h: 30,
                            color: '#c8a96a',
                            opacity: 0.9
                        },
                        {
                            id: 'tpl_back_footer',
                            type: 'category_header',
                            x: 20, y: 240, w: 130, h: 20,
                            customName: '14, Boulevard de la Gastronomie • 75001 Paris\nRéservations : 01 42 68 00 00 • www.atelier-sens.fr',
                            fontFamily: 'Montserrat',
                            fontSizePt: 7,
                            color: '#78716c',
                            align: 'center'
                        },

                        // Panneau Droit : Couverture Prestige (170 à 340 mm)
                        {
                            id: 'tpl_cov_double_border',
                            type: 'frame',
                            x: 182, y: 12, w: 146, h: 276,
                            borderColor: '#c8a96a',
                            borderWidthPt: 1.5,
                            backgroundColor: 'transparent',
                            borderRadius: 0,
                            borderStyle: 'solid',
                            opacity: 0.8
                        },
                        {
                            id: 'tpl_cov_inner_border',
                            type: 'frame',
                            x: 185, y: 15, w: 140, h: 270,
                            borderColor: '#c8a96a',
                            borderWidthPt: 0.5,
                            backgroundColor: 'transparent',
                            borderRadius: 0,
                            borderStyle: 'solid',
                            opacity: 0.4
                        },
                        {
                            id: 'tpl_cov_crest',
                            type: 'illustration',
                            illustrationId: 'cloche_prestige',
                            x: 232, y: 45, w: 46, h: 32,
                            color: '#c8a96a',
                            opacity: 1
                        },
                        {
                            id: 'tpl_cov_rule1',
                            type: 'illustration',
                            illustrationId: 'indesign_rule_floral',
                            x: 200, y: 88, w: 110, h: 8,
                            color: '#c8a96a',
                            opacity: 0.9
                        },
                        {
                            id: 'tpl_cov_main_title',
                            type: 'title_heading',
                            x: 190, y: 105, w: 130, h: 26,
                            customName: 'L’ATELIER\nDES SENS',
                            fontFamily: 'Cinzel',
                            fontSizePt: 22,
                            color: '#f5f5f4',
                            align: 'center'
                        },
                        {
                            id: 'tpl_cov_sub',
                            type: 'title_heading',
                            x: 190, y: 138, w: 130, h: 10,
                            customName: 'RESTAURANT GASTRONOMIQUE',
                            fontFamily: 'Montserrat',
                            fontSizePt: 8,
                            color: '#c8a96a',
                            align: 'center'
                        },
                        {
                            id: 'tpl_cov_stars',
                            type: 'illustration',
                            illustrationId: 'badge_michelin_star5',
                            x: 235, y: 154, w: 40, h: 16,
                            color: '#c8a96a',
                            opacity: 1
                        },
                        {
                            id: 'tpl_cov_rule2',
                            type: 'illustration',
                            illustrationId: 'indesign_rule_diamond',
                            x: 205, y: 180, w: 100, h: 6,
                            color: '#c8a96a',
                            opacity: 0.8
                        },
                        {
                            id: 'tpl_cov_menu_label',
                            type: 'title_heading',
                            x: 190, y: 200, w: 130, h: 12,
                            customName: 'CARTE & MENUS DE SAISON',
                            fontFamily: 'Cinzel',
                            fontSizePt: 10,
                            color: '#e7e5e4',
                            align: 'center'
                        },
                        {
                            id: 'tpl_cov_chef',
                            type: 'category_header',
                            x: 190, y: 245, w: 130, h: 18,
                            customName: 'Cuisine d’auteur signée par le Chef Exécutif\nProduits d’exception & Terroirs de France',
                            fontFamily: 'Playfair Display',
                            fontSizePt: 8,
                            color: '#a8a29e',
                            align: 'center'
                        }
                    ];
                };

                // Fonction de peuplement de la face intérieure (Entrées & Plats)
                const buildFaceInterior = (face) => {
                    face.name = 'Feuille 1 — Verso (Entrées & Plats Signatures)';
                    face.bgColor = '#1c1917';
                    face.objects = [
                        // Panneau Gauche : Les Entrées & Mises en bouche
                        {
                            id: 'tpl_in_cat1_bg',
                            type: 'frame',
                            x: 12, y: 12, w: 146, h: 276,
                            borderColor: '#c8a96a',
                            borderWidthPt: 0.5,
                            backgroundColor: 'transparent',
                            opacity: 0.4
                        },
                        {
                            id: 'tpl_in_cat1_title',
                            type: 'title_heading',
                            x: 20, y: 22, w: 130, h: 12,
                            customName: 'LES ENTRÉES & PRÉLUDES',
                            fontFamily: 'Cinzel',
                            fontSizePt: 12,
                            color: '#c8a96a',
                            align: 'center'
                        },
                        {
                            id: 'tpl_in_cat1_rule',
                            type: 'illustration',
                            illustrationId: 'indesign_rule_diamond',
                            x: 35, y: 35, w: 100, h: 6,
                            color: '#c8a96a',
                            opacity: 0.8
                        },
                        {
                            id: 'tpl_in_dish1',
                            type: 'dish_item',
                            x: 20, y: 48, w: 130, h: 22,
                            customName: 'Foie Gras de Canard Maison Poêlé',
                            customDesc: 'Chutney de figues de Solliès au vieux balsamique, brioche toastée.',
                            customPrice: '28 €',
                            fontFamily: 'Cinzel',
                            fontSizePt: 9.5,
                            color: '#f5f5f4',
                            priceColor: '#c8a96a',
                            dottedLeader: true,
                            dotsColor: '#78716c'
                        },
                        {
                            id: 'tpl_in_dish2',
                            type: 'dish_item',
                            x: 20, y: 76, w: 130, h: 22,
                            customName: 'Noix de Saint-Jacques Dorées au Beurre Demi-Sel',
                            customDesc: 'Mousseline de panais à la vanille bourbon, émulsion de corail truffée.',
                            customPrice: '32 €',
                            fontFamily: 'Cinzel',
                            fontSizePt: 9.5,
                            color: '#f5f5f4',
                            priceColor: '#c8a96a',
                            dottedLeader: true,
                            dotsColor: '#78716c'
                        },
                        {
                            id: 'tpl_in_dish3',
                            type: 'dish_item',
                            x: 20, y: 104, w: 130, h: 22,
                            customName: 'Carpaccio de Langoustines Royales Marinées',
                            customDesc: 'Perles de caviar osciètre, gelée d’eau de tomate et huile de combava.',
                            customPrice: '34 €',
                            fontFamily: 'Cinzel',
                            fontSizePt: 9.5,
                            color: '#f5f5f4',
                            priceColor: '#c8a96a',
                            dottedLeader: true,
                            dotsColor: '#78716c'
                        },
                        {
                            id: 'tpl_in_dish4',
                            type: 'dish_item',
                            x: 20, y: 132, w: 130, h: 22,
                            customName: 'Velouté Onctueux de Potimarron & Châtaignes',
                            customDesc: 'Éclats de noisettes torréfiées du Piémont et copeaux de truffe noire.',
                            customPrice: '22 €',
                            fontFamily: 'Cinzel',
                            fontSizePt: 9.5,
                            color: '#f5f5f4',
                            priceColor: '#c8a96a',
                            dottedLeader: true,
                            dotsColor: '#78716c'
                        },
                        {
                            id: 'tpl_in_badge_left',
                            type: 'illustration',
                            illustrationId: 'badge_chef_signature_star',
                            x: 65, y: 225, w: 40, h: 40,
                            color: '#c8a96a',
                            opacity: 0.9
                        },

                        // Panneau Droit : Les Plats Principaux & Créations
                        {
                            id: 'tpl_in_cat2_bg',
                            type: 'frame',
                            x: 182, y: 12, w: 146, h: 276,
                            borderColor: '#c8a96a',
                            borderWidthPt: 0.5,
                            backgroundColor: 'transparent',
                            opacity: 0.4
                        },
                        {
                            id: 'tpl_in_cat2_title',
                            type: 'title_heading',
                            x: 190, y: 22, w: 130, h: 12,
                            customName: 'PLATS & CRÉATIONS SIGNATURES',
                            fontFamily: 'Cinzel',
                            fontSizePt: 12,
                            color: '#c8a96a',
                            align: 'center'
                        },
                        {
                            id: 'tpl_in_cat2_rule',
                            type: 'illustration',
                            illustrationId: 'indesign_rule_diamond',
                            x: 205, y: 35, w: 100, h: 6,
                            color: '#c8a96a',
                            opacity: 0.8
                        },
                        {
                            id: 'tpl_in_dish5',
                            type: 'dish_item',
                            x: 190, y: 48, w: 130, h: 24,
                            customName: 'Filet de Bœuf Wagyu Saisi au Grill',
                            customDesc: 'Pomme purée à la truffe melanosporum, jus corsé au porto vintage.',
                            customPrice: '52 €',
                            fontFamily: 'Cinzel',
                            fontSizePt: 9.5,
                            color: '#f5f5f4',
                            priceColor: '#c8a96a',
                            dottedLeader: true,
                            dotsColor: '#78716c'
                        },
                        {
                            id: 'tpl_in_dish6',
                            type: 'dish_item',
                            x: 190, y: 78, w: 130, h: 24,
                            customName: 'Bar de Ligne Cuit sur Peau Croustillante',
                            customDesc: 'Fondue de poireaux à l’anis sauvage, jus réduit de coquillages safrané.',
                            customPrice: '44 €',
                            fontFamily: 'Cinzel',
                            fontSizePt: 9.5,
                            color: '#f5f5f4',
                            priceColor: '#c8a96a',
                            dottedLeader: true,
                            dotsColor: '#78716c'
                        },
                        {
                            id: 'tpl_in_dish7',
                            type: 'dish_item',
                            x: 190, y: 108, w: 130, h: 24,
                            customName: 'Pigeon Fermier Rôti en Deux Cuissons',
                            customDesc: 'Les cuisses confites, suprêmes rosés, mousseline de céleri et griottes.',
                            customPrice: '46 €',
                            fontFamily: 'Cinzel',
                            fontSizePt: 9.5,
                            color: '#f5f5f4',
                            priceColor: '#c8a96a',
                            dottedLeader: true,
                            dotsColor: '#78716c'
                        },
                        {
                            id: 'tpl_in_dish8',
                            type: 'dish_item',
                            x: 190, y: 138, w: 130, h: 24,
                            customName: 'Risotto Carnaroli aux Morilles Fraîches',
                            customDesc: 'Parmigiano Reggiano 36 mois, émulsion d’ail noir et pousses de roquette.',
                            customPrice: '38 €',
                            fontFamily: 'Cinzel',
                            fontSizePt: 9.5,
                            color: '#f5f5f4',
                            priceColor: '#c8a96a',
                            dottedLeader: true,
                            dotsColor: '#78716c'
                        },
                        {
                            id: 'tpl_in_note_right',
                            type: 'category_header',
                            x: 190, y: 240, w: 130, h: 18,
                            customName: 'Accord Mets & Vins du Sommelier disponible en 4 ou 6 temps.\nToutes nos viandes sont certifiées d’origine française ou élevage sélectionné.',
                            fontFamily: 'Playfair Display',
                            fontSizePt: 7.5,
                            color: '#a8a29e',
                            align: 'center'
                        }
                    ];
                };

                if (mode === 'single_face') {
                    buildFace0(engine.currentFace || engine.faces[0]);
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
                        // Encadrement général
                        {
                            id: 'bistro_border_l',
                            type: 'frame',
                            x: 12, y: 12, w: 146, h: 276,
                            borderColor: '#7f1d1d',
                            borderWidthPt: 1.5,
                            backgroundColor: 'transparent'
                        },
                        {
                            id: 'bistro_border_r',
                            type: 'frame',
                            x: 182, y: 12, w: 146, h: 276,
                            borderColor: '#7f1d1d',
                            borderWidthPt: 1.5,
                            backgroundColor: 'transparent'
                        },
                        // Panneau Gauche
                        {
                            id: 'bistro_title_l',
                            type: 'title_heading',
                            x: 20, y: 22, w: 130, h: 14,
                            customName: 'LES ENTRÉES DU BISTROT',
                            fontFamily: 'Playfair Display',
                            fontSizePt: 13,
                            color: '#7f1d1d',
                            align: 'center'
                        },
                        {
                            id: 'bistro_rule_l',
                            type: 'illustration',
                            illustrationId: 'indesign_rule_diamond',
                            x: 35, y: 36, w: 100, h: 6,
                            color: '#7f1d1d',
                            opacity: 0.9
                        },
                        {
                            id: 'bistro_dish1',
                            type: 'dish_item',
                            x: 20, y: 48, w: 130, h: 18,
                            customName: 'Œufs Mayonnaise Traditionnels',
                            customDesc: 'Mayonnaise maison montée à la moutarde de Dijon, herbes fraîches.',
                            customPrice: '8,50 €',
                            fontFamily: 'Playfair Display',
                            fontSizePt: 10,
                            color: '#1e293b',
                            priceColor: '#7f1d1d',
                            dottedLeader: true
                        },
                        {
                            id: 'bistro_dish2',
                            type: 'dish_item',
                            x: 20, y: 72, w: 130, h: 18,
                            customName: 'Soupe à l’Oignon Gratinée au Comté',
                            customDesc: 'Bouillon mijoté au vin blanc, croûtons dorés et comté affiné 18 mois.',
                            customPrice: '12,00 €',
                            fontFamily: 'Playfair Display',
                            fontSizePt: 10,
                            color: '#1e293b',
                            priceColor: '#7f1d1d',
                            dottedLeader: true
                        },
                        {
                            id: 'bistro_dish3',
                            type: 'dish_item',
                            x: 20, y: 96, w: 130, h: 18,
                            customName: 'Escargots de Bourgogne Sauvages (les 6)',
                            customDesc: 'Beurre persillé généreux à l’ail rose et échalotes confites.',
                            customPrice: '14,00 €',
                            fontFamily: 'Playfair Display',
                            fontSizePt: 10,
                            color: '#1e293b',
                            priceColor: '#7f1d1d',
                            dottedLeader: true
                        },
                        {
                            id: 'bistro_dish4',
                            type: 'dish_item',
                            x: 20, y: 120, w: 130, h: 18,
                            customName: 'Terrine de Campagne Maison au Poivre Vert',
                            customDesc: 'Pain de campagne grillé au levain et cornichons au vinaigre de cidre.',
                            customPrice: '10,50 €',
                            fontFamily: 'Playfair Display',
                            fontSizePt: 10,
                            color: '#1e293b',
                            priceColor: '#7f1d1d',
                            dottedLeader: true
                        },
                        {
                            id: 'bistro_badge_handmade',
                            type: 'illustration',
                            illustrationId: 'badge_fait_maison_pro',
                            x: 65, y: 220, w: 40, h: 40,
                            color: '#7f1d1d'
                        },

                        // Panneau Droit
                        {
                            id: 'bistro_title_r',
                            type: 'title_heading',
                            x: 190, y: 22, w: 130, h: 14,
                            customName: 'PLATS AUTHENTIQUES & VIANDES',
                            fontFamily: 'Playfair Display',
                            fontSizePt: 13,
                            color: '#7f1d1d',
                            align: 'center'
                        },
                        {
                            id: 'bistro_rule_r',
                            type: 'illustration',
                            illustrationId: 'indesign_rule_diamond',
                            x: 205, y: 36, w: 100, h: 6,
                            color: '#7f1d1d',
                            opacity: 0.9
                        },
                        {
                            id: 'bistro_dish5',
                            type: 'dish_item',
                            x: 190, y: 48, w: 130, h: 22,
                            customName: 'Entrecôte Normande Grillée (300g)',
                            customDesc: 'Sauce béarnaise minute, frites fraîches maison cuites au gras de bœuf.',
                            customPrice: '26,50 €',
                            fontFamily: 'Playfair Display',
                            fontSizePt: 10,
                            color: '#1e293b',
                            priceColor: '#7f1d1d',
                            dottedLeader: true
                        },
                        {
                            id: 'bistro_dish6',
                            type: 'dish_item',
                            x: 190, y: 76, w: 130, h: 22,
                            customName: 'Tartare de Bœuf Charolais au Couteau',
                            customDesc: 'Assaisonné à votre goût, servi avec salade verte et frites maison.',
                            customPrice: '19,50 €',
                            fontFamily: 'Playfair Display',
                            fontSizePt: 10,
                            color: '#1e293b',
                            priceColor: '#7f1d1d',
                            dottedLeader: true
                        },
                        {
                            id: 'bistro_dish7',
                            type: 'dish_item',
                            x: 190, y: 104, w: 130, h: 22,
                            customName: 'Blanquette de Veau à l’Ancienne',
                            customDesc: 'Riz pilaf parfumé, petits oignons glacés et champignons de Paris frais.',
                            customPrice: '21,00 €',
                            fontFamily: 'Playfair Display',
                            fontSizePt: 10,
                            color: '#1e293b',
                            priceColor: '#7f1d1d',
                            dottedLeader: true
                        },
                        {
                            id: 'bistro_dish8',
                            type: 'dish_item',
                            x: 190, y: 132, w: 130, h: 22,
                            customName: 'Filet de Canard Rôti au Miel de Thym',
                            customDesc: 'Mousseline de carottes au cumin et jus caramélisé.',
                            customPrice: '23,00 €',
                            fontFamily: 'Playfair Display',
                            fontSizePt: 10,
                            color: '#1e293b',
                            priceColor: '#7f1d1d',
                            dottedLeader: true
                        },
                        {
                            id: 'bistro_footer_r',
                            type: 'category_header',
                            x: 190, y: 240, w: 130, h: 18,
                            customName: 'Tous nos plats sont cuisinés sur place à partir de produits frais et bruts.\nService continu 7j/7 de 12h à minuit.',
                            fontFamily: 'Montserrat',
                            fontSizePt: 7.5,
                            color: '#64748b',
                            align: 'center'
                        }
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
        // 3. FLYER PROMOTIONNEL A4 GRAND BRUNCH (210×297 mm)
        // ====================================================================
        {
            id: 'flyer_brunch_gourmand_a4',
            name: 'Flyer Promotionnel A4 — Grand Brunch du Dimanche',
            subtitle: 'Flyer A4 210 × 297 mm • Grand bandeau titre, macaron buffet à volonté, 3 blocs gourmands équilibrés, cartouche réservation & QR code.',
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
                        // Cadre de sécurité extérieur
                        {
                            id: 'fa4_border',
                            type: 'frame',
                            x: 8, y: 8, w: 194, h: 281,
                            borderColor: '#047857',
                            borderWidthPt: 1,
                            backgroundColor: 'transparent',
                            opacity: 0.6
                        },
                        // Header Banner
                        {
                            id: 'fa4_header_bg',
                            type: 'frame',
                            x: 12, y: 12, w: 186, h: 54,
                            backgroundColor: '#047857',
                            borderColor: '#065f46',
                            borderWidthPt: 1,
                            borderRadius: 4
                        },
                        {
                            id: 'fa4_eyebrow',
                            type: 'title_heading',
                            x: 20, y: 16, w: 170, h: 8,
                            customName: 'TOUS LES DIMANCHES DE 11H00 À 16H00',
                            fontFamily: 'Montserrat',
                            fontSizePt: 8,
                            color: '#fef08a',
                            align: 'center'
                        },
                        {
                            id: 'fa4_main_title',
                            type: 'title_heading',
                            x: 20, y: 25, w: 170, h: 18,
                            customName: 'LE GRAND BRUNCH GOURMAND',
                            fontFamily: 'Cinzel',
                            fontSizePt: 17,
                            color: '#ffffff',
                            align: 'center'
                        },
                        {
                            id: 'fa4_sub_title',
                            type: 'category_header',
                            x: 20, y: 47, w: 170, h: 12,
                            customName: 'Buffet salé & sucré à discrétion • Produits bio & du terroir',
                            fontFamily: 'Montserrat',
                            fontSizePt: 8.5,
                            color: '#a7f3d0',
                            align: 'center'
                        },
                        // Badge Formule Tarifaire
                        {
                            id: 'fa4_badge_frame',
                            type: 'frame',
                            x: 145, y: 52, w: 46, h: 22,
                            backgroundColor: '#d97706',
                            borderColor: '#ffffff',
                            borderWidthPt: 1.5,
                            borderRadius: 11
                        },
                        {
                            id: 'fa4_badge_txt',
                            type: 'title_heading',
                            x: 146, y: 56, w: 44, h: 14,
                            customName: '32 € / PERS.',
                            fontFamily: 'Montserrat',
                            fontSizePt: 10,
                            color: '#ffffff',
                            align: 'center'
                        },

                        // Bloc 1 : Le Salé Chaud & Froid
                        {
                            id: 'fa4_col1_bg',
                            type: 'frame',
                            x: 14, y: 78, w: 88, h: 86,
                            backgroundColor: '#ffffff',
                            borderColor: '#e5e7eb',
                            borderWidthPt: 1,
                            borderRadius: 6
                        },
                        {
                            id: 'fa4_col1_title',
                            type: 'title_heading',
                            x: 18, y: 83, w: 80, h: 9,
                            customName: 'LE COIN SALÉ DU CHEF',
                            fontFamily: 'Montserrat',
                            fontSizePt: 9.5,
                            color: '#047857',
                            align: 'center'
                        },
                        {
                            id: 'fa4_col1_dish1',
                            type: 'dish_item',
                            x: 18, y: 95, w: 80, h: 16,
                            customName: 'Œufs Bénédicte au Saumon Fumé',
                            customDesc: 'Sauce hollandaise maison sur muffin toasté.',
                            customPrice: 'Inclus',
                            fontSizePt: 8,
                            color: '#1f2937'
                        },
                        {
                            id: 'fa4_col1_dish2',
                            type: 'dish_item',
                            x: 18, y: 113, w: 80, h: 16,
                            customName: 'Avocado Toast & Granola Salé',
                            customDesc: 'Pain de seigle bio, féta crémeuse et grenade.',
                            customPrice: 'Inclus',
                            fontSizePt: 8,
                            color: '#1f2937'
                        },
                        {
                            id: 'fa4_col1_dish3',
                            type: 'dish_item',
                            x: 18, y: 131, w: 80, h: 16,
                            customName: 'Planche de Charcuteries & Fromages',
                            customDesc: 'Jambon de Parme, Comté affiné et confiture de figues.',
                            customPrice: 'Inclus',
                            fontSizePt: 8,
                            color: '#1f2937'
                        },

                        // Bloc 2 : Les Douceurs Sucrées
                        {
                            id: 'fa4_col2_bg',
                            type: 'frame',
                            x: 108, y: 78, w: 88, h: 86,
                            backgroundColor: '#ffffff',
                            borderColor: '#e5e7eb',
                            borderWidthPt: 1,
                            borderRadius: 6
                        },
                        {
                            id: 'fa4_col2_title',
                            type: 'title_heading',
                            x: 112, y: 83, w: 80, h: 9,
                            customName: 'DOUCEURS & BOULANGERIE',
                            fontFamily: 'Montserrat',
                            fontSizePt: 9.5,
                            color: '#d97706',
                            align: 'center'
                        },
                        {
                            id: 'fa4_col2_dish1',
                            type: 'dish_item',
                            x: 112, y: 95, w: 80, h: 16,
                            customName: 'Pancakes Moelleux au Sirop d’Érable',
                            customDesc: 'Myrtilles fraîches et chantilly vanillée.',
                            customPrice: 'Inclus',
                            fontSizePt: 8,
                            color: '#1f2937'
                        },
                        {
                            id: 'fa4_col2_dish2',
                            type: 'dish_item',
                            x: 112, y: 113, w: 80, h: 16,
                            customName: 'Viennoiseries Pur Beurre Sorties du Four',
                            customDesc: 'Croissants, pains au chocolat, brioches feuilletées.',
                            customPrice: 'Inclus',
                            fontSizePt: 8,
                            color: '#1f2937'
                        },
                        {
                            id: 'fa4_col2_dish3',
                            type: 'dish_item',
                            x: 112, y: 131, w: 80, h: 16,
                            customName: 'Açai Bowl & Fruits Frais de Saison',
                            customDesc: 'Graines de chia, copeaux de coco et miel sauvage.',
                            customPrice: 'Inclus',
                            fontSizePt: 8,
                            color: '#1f2937'
                        },

                        // Bloc 3 : Boissons Chaudes & Fraîches
                        {
                            id: 'fa4_col3_bg',
                            type: 'frame',
                            x: 14, y: 170, w: 182, h: 54,
                            backgroundColor: '#ffffff',
                            borderColor: '#e5e7eb',
                            borderWidthPt: 1,
                            borderRadius: 6
                        },
                        {
                            id: 'fa4_col3_title',
                            type: 'title_heading',
                            x: 20, y: 174, w: 170, h: 8,
                            customName: 'BOISSONS DU BARISTA & JUS PRESSÉS (À VOLONTÉ)',
                            fontFamily: 'Montserrat',
                            fontSizePt: 9,
                            color: '#047857',
                            align: 'center'
                        },
                        {
                            id: 'fa4_col3_desc',
                            type: 'category_header',
                            x: 20, y: 186, w: 170, h: 30,
                            customName: 'Café de spécialité torréfié localement (Espresso, Cappuccino, Flat White)\nThés bio d’origine (Vert Sencha, Noir Earl Grey, Infusions du jardin)\nJus d’oranges pressées à la minute, Cocktail détox pomme-gingembre-citron vert.',
                            fontFamily: 'Montserrat',
                            fontSizePt: 8,
                            color: '#4b5563',
                            align: 'center'
                        },

                        // Cartouche de Réservation & Coordonnées (Footer)
                        {
                            id: 'fa4_foot_bg',
                            type: 'frame',
                            x: 14, y: 232, w: 182, h: 48,
                            backgroundColor: '#f3f4f6',
                            borderColor: '#cbd5e1',
                            borderWidthPt: 1,
                            borderRadius: 6
                        },
                        {
                            id: 'fa4_foot_cta',
                            type: 'title_heading',
                            x: 20, y: 237, w: 170, h: 9,
                            customName: 'RÉSERVATION FORTEMENT RECOMMANDÉE',
                            fontFamily: 'Montserrat',
                            fontSizePt: 9.5,
                            color: '#111827',
                            align: 'center'
                        },
                        {
                            id: 'fa4_foot_text',
                            type: 'category_header',
                            x: 20, y: 249, w: 170, h: 24,
                            customName: 'En ligne sur www.notre-restaurant.fr ou au 01 45 20 00 00\nAdresse : 28, Rue Gourmande • Parking privé & Terrasse chauffée disponible\nMenu enfant (-10 ans) disponible à 16 €',
                            fontFamily: 'Montserrat',
                            fontSizePt: 8,
                            color: '#4b5563',
                            align: 'center'
                        }
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
        // 4. DÉPLIANT COCKTAILS & VINS 3 VOLETS (297×210 mm)
        // ====================================================================
        {
            id: 'depliant_cocktails_3volets',
            name: 'Dépliant Bar & Vins 3 Volets (Triptyque 99×210 mm)',
            subtitle: 'Dépliant triptyque 297 × 210 mm • 3 volets de 99 mm • Volet 1 Couverture bar lounge, Volet 2 Vins & Champagnes, Volet 3 Cocktails créations.',
            category: 'depliants_3volets',
            format: 'depliant_a4_3volets',
            badge: 'Triptyque 3V',
            badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
            colors: ['#0f172a', '#fbbf24', '#f1f5f9'],
            icon: 'fa-martini-glass-citrus',
            builder(engine, mode = 'new_project') {
                const buildFace = (face) => {
                    face.name = 'Carte Dépliant 3 Volets';
                    face.bgColor = '#0f172a';
                    face.objects = [
                        // Volet 1 (0 à 99 mm) : Les Vins & Champagnes
                        {
                            id: 'v3_col1_title',
                            type: 'title_heading',
                            x: 8, y: 15, w: 83, h: 10,
                            customName: 'VINS & CHAMPAGNES',
                            fontFamily: 'Cinzel',
                            fontSizePt: 10.5,
                            color: '#fbbf24',
                            align: 'center'
                        },
                        {
                            id: 'v3_col1_rule',
                            type: 'illustration',
                            illustrationId: 'indesign_rule_diamond',
                            x: 18, y: 26, w: 63, h: 5,
                            color: '#fbbf24',
                            opacity: 0.8
                        },
                        {
                            id: 'v3_dish1',
                            type: 'dish_item',
                            x: 8, y: 35, w: 83, h: 18,
                            customName: 'Chablis 1er Cru Domaine',
                            customDesc: 'Minéral, floral et notes d’agrumes.',
                            customPrice: '9 € / 45 €',
                            fontSizePt: 8,
                            color: '#f8fafc',
                            priceColor: '#fbbf24',
                            dottedLeader: true
                        },
                        {
                            id: 'v3_dish2',
                            type: 'dish_item',
                            x: 8, y: 56, w: 83, h: 18,
                            customName: 'Saint-Émilion Grand Cru',
                            customDesc: 'Robe grenat, tanins soyeux, fruits noirs.',
                            customPrice: '11 € / 58 €',
                            fontSizePt: 8,
                            color: '#f8fafc',
                            priceColor: '#fbbf24',
                            dottedLeader: true
                        },
                        {
                            id: 'v3_dish3',
                            type: 'dish_item',
                            x: 8, y: 77, w: 83, h: 18,
                            customName: 'Côtes de Provence Rosé Bio',
                            customDesc: 'Pêche blanche, fraîcheur et rondeur.',
                            customPrice: '7 € / 32 €',
                            fontSizePt: 8,
                            color: '#f8fafc',
                            priceColor: '#fbbf24',
                            dottedLeader: true
                        },
                        {
                            id: 'v3_dish4',
                            type: 'dish_item',
                            x: 8, y: 98, w: 83, h: 18,
                            customName: 'Champagne Brut Réserve',
                            customDesc: 'Fines bulles dorées, notes de brioche.',
                            customPrice: '14 € / 75 €',
                            fontSizePt: 8,
                            color: '#f8fafc',
                            priceColor: '#fbbf24',
                            dottedLeader: true
                        },

                        // Volet 2 (99 à 198 mm) : Les Cocktails Signatures
                        {
                            id: 'v3_col2_title',
                            type: 'title_heading',
                            x: 107, y: 15, w: 83, h: 10,
                            customName: 'COCKTAILS SIGNATURES',
                            fontFamily: 'Cinzel',
                            fontSizePt: 10.5,
                            color: '#fbbf24',
                            align: 'center'
                        },
                        {
                            id: 'v3_col2_rule',
                            type: 'illustration',
                            illustrationId: 'indesign_rule_diamond',
                            x: 117, y: 26, w: 63, h: 5,
                            color: '#fbbf24',
                            opacity: 0.8
                        },
                        {
                            id: 'v3_dish5',
                            type: 'dish_item',
                            x: 107, y: 35, w: 83, h: 18,
                            customName: 'Smoky Mezcalita',
                            customDesc: 'Mezcal artisanal, jus de citron vert, agave & piment fumé.',
                            customPrice: '14 €',
                            fontSizePt: 8,
                            color: '#f8fafc',
                            priceColor: '#fbbf24',
                            dottedLeader: true
                        },
                        {
                            id: 'v3_dish6',
                            type: 'dish_item',
                            x: 107, y: 56, w: 83, h: 18,
                            customName: 'Basilico Gin Fizz',
                            customDesc: 'Gin infusé au basilic frais, concombre, tonic artisanal.',
                            customPrice: '13 €',
                            fontSizePt: 8,
                            color: '#f8fafc',
                            priceColor: '#fbbf24',
                            dottedLeader: true
                        },
                        {
                            id: 'v3_dish7',
                            type: 'dish_item',
                            x: 107, y: 77, w: 83, h: 18,
                            customName: 'Passion & Bourbon Old Fashioned',
                            customDesc: 'Bourbon vieilli en fût, purée de passion, bitter orange.',
                            customPrice: '15 €',
                            fontSizePt: 8,
                            color: '#f8fafc',
                            priceColor: '#fbbf24',
                            dottedLeader: true
                        },
                        {
                            id: 'v3_dish8',
                            type: 'dish_item',
                            x: 107, y: 98, w: 83, h: 18,
                            customName: 'Virgin Garden (Sans Alcool)',
                            customDesc: 'Jus de pomme bio, purée de framboise et mousse de sureau.',
                            customPrice: '9 €',
                            fontSizePt: 8,
                            color: '#f8fafc',
                            priceColor: '#fbbf24',
                            dottedLeader: true
                        },

                        // Volet 3 (198 à 297 mm) : Couverture & Tapas
                        {
                            id: 'v3_col3_crest',
                            type: 'illustration',
                            illustrationId: 'cocktail_martini_twist',
                            x: 230, y: 20, w: 35, h: 28,
                            color: '#fbbf24'
                        },
                        {
                            id: 'v3_col3_title',
                            type: 'title_heading',
                            x: 206, y: 55, w: 83, h: 14,
                            customName: 'THE ROOFTOP\nLOUNGE BAR',
                            fontFamily: 'Cinzel',
                            fontSizePt: 12,
                            color: '#ffffff',
                            align: 'center'
                        },
                        {
                            id: 'v3_col3_sub',
                            type: 'category_header',
                            x: 206, y: 75, w: 83, h: 10,
                            customName: 'MIXOLOGIE & CAVISTE',
                            fontFamily: 'Montserrat',
                            fontSizePt: 7.5,
                            color: '#fbbf24',
                            align: 'center'
                        },
                        {
                            id: 'v3_col3_tapas_title',
                            type: 'title_heading',
                            x: 206, y: 95, w: 83, h: 8,
                            customName: 'PETITES ASSIETTES & TAPAS',
                            fontFamily: 'Montserrat',
                            fontSizePt: 8,
                            color: '#e2e8f0',
                            align: 'center'
                        },
                        {
                            id: 'v3_dish9',
                            type: 'dish_item',
                            x: 206, y: 108, w: 83, h: 16,
                            customName: 'Planche Bellota & Manchego',
                            customDesc: 'Focaccia tiède au romarin.',
                            customPrice: '16 €',
                            fontSizePt: 7.5,
                            color: '#f8fafc',
                            priceColor: '#fbbf24'
                        },
                        {
                            id: 'v3_dish10',
                            type: 'dish_item',
                            x: 206, y: 126, w: 83, h: 16,
                            customName: 'Guacamole Épicé & Nachos Bio',
                            customDesc: 'Préparé minute au mortier.',
                            customPrice: '11 €',
                            fontSizePt: 7.5,
                            color: '#f8fafc',
                            priceColor: '#fbbf24'
                        }
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
        // 5. CHEVALET / MENU DU JOUR A5 (148×210 mm)
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
                        {
                            id: 'a5_frame',
                            type: 'frame',
                            x: 6, y: 6, w: 136, h: 198,
                            borderColor: '#0369a1',
                            borderWidthPt: 1,
                            backgroundColor: 'transparent'
                        },
                        {
                            id: 'a5_header',
                            type: 'title_heading',
                            x: 10, y: 12, w: 128, h: 12,
                            customName: 'FORMULE DU MARCHÉ',
                            fontFamily: 'Cinzel',
                            fontSizePt: 13,
                            color: '#0369a1',
                            align: 'center'
                        },
                        {
                            id: 'a5_sub',
                            type: 'category_header',
                            x: 10, y: 25, w: 128, h: 8,
                            customName: 'Servie du Lundi au Vendredi midi (hors jours fériés)',
                            fontFamily: 'Montserrat',
                            fontSizePt: 7.5,
                            color: '#64748b',
                            align: 'center'
                        },
                        // Pastilles de Prix
                        {
                            id: 'a5_price1_bg',
                            type: 'frame',
                            x: 15, y: 36, w: 56, h: 16,
                            backgroundColor: '#0369a1',
                            borderRadius: 4
                        },
                        {
                            id: 'a5_price1_txt',
                            type: 'title_heading',
                            x: 15, y: 39, w: 56, h: 10,
                            customName: 'E + P ou P + D : 16,50 €',
                            fontFamily: 'Montserrat',
                            fontSizePt: 7.5,
                            color: '#ffffff',
                            align: 'center'
                        },
                        {
                            id: 'a5_price2_bg',
                            type: 'frame',
                            x: 77, y: 36, w: 56, h: 16,
                            backgroundColor: '#0284c7',
                            borderRadius: 4
                        },
                        {
                            id: 'a5_price2_txt',
                            type: 'title_heading',
                            x: 77, y: 39, w: 56, h: 10,
                            customName: 'E + P + D : 20,50 €',
                            fontFamily: 'Montserrat',
                            fontSizePt: 7.5,
                            color: '#ffffff',
                            align: 'center'
                        },
                        // Plats du jour
                        {
                            id: 'a5_d1',
                            type: 'dish_item',
                            x: 12, y: 60, w: 124, h: 18,
                            customName: 'Entrée : Velouté de Légumes Rôtis ou Salade Italienne',
                            customDesc: 'Vinaigrette balsamique et graines torréfiées.',
                            customPrice: 'À la carte : 6 €',
                            fontSizePt: 8,
                            color: '#0f172a'
                        },
                        {
                            id: 'a5_d2',
                            type: 'dish_item',
                            x: 12, y: 82, w: 124, h: 18,
                            customName: 'Plat : Suprême de Poulet Rôti ou Pavé de Saumon',
                            customDesc: 'Purée maison à l’huile d’olive et légumes de saison glacés.',
                            customPrice: 'À la carte : 13 €',
                            fontSizePt: 8,
                            color: '#0f172a'
                        },
                        {
                            id: 'a5_d3',
                            type: 'dish_item',
                            x: 12, y: 104, w: 124, h: 18,
                            customName: 'Dessert : Mousse au Chocolat Noir ou Tarte du Jour',
                            customDesc: 'Crème anglaise vanille bourbon.',
                            customPrice: 'À la carte : 6 €',
                            fontSizePt: 8,
                            color: '#0f172a'
                        },
                        {
                            id: 'a5_footer',
                            type: 'category_header',
                            x: 12, y: 165, w: 124, h: 24,
                            customName: 'Café Illy ou Thé offert avec la formule complète !\nPain de campagne au levain tranché à discrétion.',
                            fontFamily: 'Montserrat',
                            fontSizePt: 7.5,
                            color: '#475569',
                            align: 'center'
                        }
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
        // 6. STREET FOOD & SMASH BURGERS (Format A4 ou 34×30)
        // ====================================================================
        {
            id: 'street_food_smash_urban',
            name: 'Street Food & Smash Burger Urbain',
            subtitle: 'Style contemporain percutant • Titres Montserrat Extra-Bold, pastilles de prix rondes, combos frites/boissons, badges "Viande Fraîche".',
            category: 'street_urban',
            format: 'flyer_a4_portrait',
            badge: 'Street Food',
            badgeColor: 'bg-red-500/20 text-red-400 border-red-500/40',
            colors: ['#111827', '#ef4444', '#facc15'],
            icon: 'fa-burger',
            builder(engine, mode = 'new_project') {
                const buildFace = (face) => {
                    face.name = 'Carte Smash Burger Urbain';
                    face.bgColor = '#111827';
                    face.objects = [
                        {
                            id: 'sb_header_title',
                            type: 'title_heading',
                            x: 15, y: 15, w: 180, h: 18,
                            customName: 'STREET SMASH BURGERS',
                            fontFamily: 'Montserrat',
                            fontSizePt: 18,
                            color: '#facc15',
                            align: 'center'
                        },
                        {
                            id: 'sb_header_sub',
                            type: 'category_header',
                            x: 15, y: 34, w: 180, h: 10,
                            customName: '100% Bœuf Frais Charolais Écrasé Minute sur Plancha Fumante',
                            fontFamily: 'Montserrat',
                            fontSizePt: 8.5,
                            color: '#e5e7eb',
                            align: 'center'
                        },
                        {
                            id: 'sb_dish1',
                            type: 'dish_item',
                            x: 15, y: 52, w: 180, h: 22,
                            customName: 'The Classic OG Double Smash',
                            customDesc: '2 steaks 90g croustillants, double cheddar affiné, sauce secrète, pickles.',
                            customPrice: '11,50 €',
                            fontFamily: 'Montserrat',
                            fontSizePt: 10,
                            color: '#ffffff',
                            priceColor: '#facc15',
                            dottedLeader: true
                        },
                        {
                            id: 'sb_dish2',
                            type: 'dish_item',
                            x: 15, y: 78, w: 180, h: 22,
                            customName: 'Truffle & Crispy Bacon Deluxe',
                            customDesc: 'Double steak wagyu, mayo à la truffe noire, oignons caramélisés au porto, bacon.',
                            customPrice: '14,00 €',
                            fontFamily: 'Montserrat',
                            fontSizePt: 10,
                            color: '#ffffff',
                            priceColor: '#facc15',
                            dottedLeader: true
                        },
                        {
                            id: 'sb_dish3',
                            type: 'dish_item',
                            x: 15, y: 104, w: 180, h: 22,
                            customName: 'Spicy Jalapeño Crunch & Cheddar Coulant',
                            customDesc: 'Double smash, piments jalapeños rôtis, sauce sriracha douce, salade iceberg.',
                            customPrice: '12,50 €',
                            fontFamily: 'Montserrat',
                            fontSizePt: 10,
                            color: '#ffffff',
                            priceColor: '#facc15',
                            dottedLeader: true
                        },
                        {
                            id: 'sb_badge_fresh',
                            type: 'illustration',
                            illustrationId: 'badge_fait_maison_pro',
                            x: 85, y: 140, w: 40, h: 40,
                            color: '#ef4444'
                        },
                        {
                            id: 'sb_footer',
                            type: 'category_header',
                            x: 15, y: 240, w: 180, h: 20,
                            customName: 'Formule Menu : Burger + Frites Fraîches + Boisson 33cl (+4,50 €)\nPain bun brioché artisanal cuit chaque matin.',
                            fontFamily: 'Montserrat',
                            fontSizePt: 8.5,
                            color: '#9ca3af',
                            align: 'center'
                        }
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
        // 7. PROJETS VIERGES PRÉ-PARAMÉTRÉS (Pour démarrer de zéro)
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
            builder(engine) {
                engine.setFormat('menu_34x30', true);
                engine.faces.forEach((face, idx) => {
                    face.objects = [];
                    face.bgColor = '#fdfbf7';
                });
            }
        },
        {
            id: 'vierge_flyer_a4',
            name: 'Projet Vierge — Flyer A4 (210 × 297 mm)',
            subtitle: 'Page A4 vierge prête pour flyer, affiche ou carte 1 page • Marges de sécurité 8 mm et repères InDesign prêts.',
            category: 'vierge',
            format: 'flyer_a4_portrait',
            badge: 'Projet Vierge',
            badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
            colors: ['#ffffff', '#10b981', '#94a3b8'],
            icon: 'fa-file-circle-plus',
            builder(engine) {
                engine.setFormat('flyer_a4_portrait', true);
                engine.faces.forEach(face => {
                    face.objects = [];
                    face.bgColor = '#ffffff';
                });
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
            builder(engine) {
                engine.setFormat('depliant_a4_3volets', true);
                engine.faces.forEach(face => {
                    face.objects = [];
                    face.bgColor = '#fdfbf7';
                });
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
            builder(engine) {
                engine.setFormat('flyer_a5_portrait', true);
                engine.faces.forEach(face => {
                    face.objects = [];
                    face.bgColor = '#ffffff';
                });
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
                (t.badge && t.badge.toLowerCase().includes(q))
            );
        }
        return results;
    }
};

if (typeof window !== 'undefined') {
    window.InDesignTemplatesBank = InDesignTemplatesBank;
}
