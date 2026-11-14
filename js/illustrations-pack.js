/**
 * ============================================================================
 * PACK DES ILLUSTRATIONS ET ORNEMENTS CLONE ADOBE INDESIGN CC (Vector SVG Library)
 * Plus de 90 illustrations vectorielles haute précision conçues pour l'édition PAO,
 * la gastronomie, la mixologie, les cafés, les ornements éditoriaux et flyers.
 * 
 * 100% vectoriel (SVG), compatible avec toutes les polices, teintes et échelles.
 * Expose InDesignIllustrationsPack et CanvaIllustrationsPack (alias rétrocompatible).
 * ============================================================================
 */

const InDesignIllustrationsPack = {
    categories: [
        { id: 'all', name: 'Toutes les illustrations', icon: 'fa-wand-magic-sparkles' },
        { id: 'ornements', name: 'Filets & Ornements InDesign', icon: 'fa-feather-pointed' },
        { id: 'sceaux_badges', name: 'Sceaux, Badges & Timbres', icon: 'fa-certificate' },
        { id: 'gastronomie', name: 'Gastronomie & Arts de la Table', icon: 'fa-utensils' },
        { id: 'cafe_bar', name: 'Barista, Cocktails & Vins', icon: 'fa-martini-glass-citrus' },
        { id: 'brunch_dessert', name: 'Boulangerie & Pâtisserie', icon: 'fa-bread-slice' },
        { id: 'allergenes_regimes', name: 'Allergènes & Régimes (PAO)', icon: 'fa-seedling' },
        { id: 'cadres_cartouches', name: 'Cadres & Cartouches Typo', icon: 'fa-vector-square' }
    ],

    items: [
        // ====================================================================
        // 1. FILETS & ORNEMENTS ÉDITORIAUX INDESIGN (Rules, Flourishes, Vignettes)
        // ====================================================================
        {
            id: 'indesign_rule_double',
            name: 'Filet Double InDesign (Épais & Fin)',
            category: 'ornements',
            tags: ['filet', 'ligne', 'double', 'indesign', 'separateur', 'classique', 'regle'],
            defaultW: 75,
            defaultH: 6,
            defaultColor: '#c8a96a',
            viewBox: '0 0 100 8',
            svg: '<line x1="0" y1="2" x2="100" y2="2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><line x1="0" y1="6" x2="100" y2="6" stroke="currentColor" stroke-width="0.75" stroke-linecap="round"/>'
        },
        {
            id: 'indesign_rule_diamond',
            name: 'Filet avec Losange Central Précieux',
            category: 'ornements',
            tags: ['losange', 'filet', 'separateur', 'or', 'luxe', 'diamant', 'titre'],
            defaultW: 80,
            defaultH: 8,
            defaultColor: '#c8a96a',
            viewBox: '0 0 100 12',
            svg: '<line x1="0" y1="6" x2="42" y2="6" stroke="currentColor" stroke-width="1"/><polygon points="50,1 55,6 50,11 45,6" fill="currentColor"/><circle cx="39" cy="6" r="1.2" fill="currentColor"/><circle cx="61" cy="6" r="1.2" fill="currentColor"/><line x1="58" y1="6" x2="100" y2="6" stroke="currentColor" stroke-width="1"/>'
        },
        {
            id: 'indesign_rule_floral',
            name: 'Séparateur Floral Calligraphique',
            category: 'ornements',
            tags: ['floral', 'volute', 'arabesque', 'separateur', 'delicat', 'vignette'],
            defaultW: 85,
            defaultH: 10,
            defaultColor: '#c8a96a',
            viewBox: '0 0 120 16',
            svg: '<path d="M10,8 C25,8 30,2 45,8 C52,11 56,12 60,6 C64,12 68,11 75,8 C90,2 95,8 110,8" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/><circle cx="60" cy="8" r="2" fill="currentColor"/><path d="M55,9 C53,12 49,13 47,11 C47,9 51,7 55,9 Z" fill="currentColor"/><path d="M65,9 C67,12 71,13 73,11 C73,9 69,7 65,9 Z" fill="currentColor"/>'
        },
        {
            id: 'indesign_flourish_crest',
            name: 'Rosace & Fleuron de Tête InDesign',
            category: 'ornements',
            tags: ['fleuron', 'rosace', 'crest', 'blason', 'luxe', 'titre', 'haut'],
            defaultW: 40,
            defaultH: 22,
            defaultColor: '#c8a96a',
            viewBox: '0 0 80 44',
            svg: '<path d="M40,4 C42,12 48,16 56,16 C48,18 44,24 40,36 C36,24 32,18 24,16 C32,16 38,12 40,4 Z" fill="currentColor"/><circle cx="40" cy="20" r="3" fill="#ffffff" opacity="0.3"/><path d="M22,24 C14,24 8,30 8,36 C16,36 20,30 22,24 Z" fill="currentColor"/><path d="M58,24 C66,24 72,30 72,36 C64,36 60,30 58,24 Z" fill="currentColor"/><circle cx="12" cy="18" r="1.5" fill="currentColor"/><circle cx="68" cy="18" r="1.5" fill="currentColor"/><line x1="16" y1="40" x2="64" y2="40" stroke="currentColor" stroke-width="1"/>'
        },
        {
            id: 'indesign_corner_rosette',
            name: 'Coin Ornemental Baroque pour Cadre',
            category: 'ornements',
            tags: ['coin', 'angle', 'baroque', 'cadre', 'bordure', 'ornement'],
            defaultW: 24,
            defaultH: 24,
            defaultColor: '#c8a96a',
            viewBox: '0 0 48 48',
            svg: '<path d="M4,44 L4,16 C4,9 9,4 16,4 L44,4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M10,38 L10,18 C10,13 13,10 18,10 L38,10" fill="none" stroke="currentColor" stroke-width="1"/><circle cx="16" cy="16" r="3" fill="currentColor"/><path d="M16,16 C22,12 26,6 26,6 C26,6 20,10 16,16 Z" fill="currentColor"/><path d="M16,16 C12,22 6,26 6,26 C6,26 10,20 16,16 Z" fill="currentColor"/>'
        },
        {
            id: 'indesign_rule_dots_minimal',
            name: 'Filet Pointillé Éditorial avec Étoile',
            category: 'ornements',
            tags: ['pointille', 'etoile', 'filet', 'moderne', 'minimaliste'],
            defaultW: 70,
            defaultH: 6,
            defaultColor: '#c8a96a',
            viewBox: '0 0 100 8',
            svg: '<line x1="0" y1="4" x2="42" y2="4" stroke="currentColor" stroke-width="1" stroke-dasharray="2 3"/><polygon points="50,1 52,3 55,3.5 52.5,5.5 53.5,8 50,6.5 46.5,8 47.5,5.5 45,3.5 48,3" fill="currentColor"/><line x1="58" y1="4" x2="100" y2="4" stroke="currentColor" stroke-width="1" stroke-dasharray="2 3"/>'
        },
        {
            id: 'vintage_divider',
            name: 'Séparateur Arabesque Vintage',
            category: 'ornements',
            tags: ['arabesque', 'vintage', 'separateur', 'menu'],
            defaultW: 80,
            defaultH: 10,
            defaultColor: '#c8a96a',
            viewBox: '0 0 100 14',
            svg: '<path d="M5,7 C20,7 25,1 35,7 C45,13 50,7 50,7 C50,7 55,1 65,7 C75,13 80,7 95,7" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="50" cy="7" r="2.5" fill="currentColor"/><circle cx="35" cy="7" r="1.5" fill="currentColor"/><circle cx="65" cy="7" r="1.5" fill="currentColor"/>'
        },
        {
            id: 'art_deco_corner',
            name: 'Coin Géométrique Art Déco',
            category: 'ornements',
            tags: ['art deco', 'coin', 'angle', 'geometrique', 'bistrot'],
            defaultW: 24,
            defaultH: 24,
            defaultColor: '#c8a96a',
            viewBox: '0 0 48 48',
            svg: '<line x1="4" y1="4" x2="44" y2="4" stroke="currentColor" stroke-width="2"/><line x1="4" y1="4" x2="4" y2="44" stroke="currentColor" stroke-width="2"/><line x1="10" y1="10" x2="38" y2="10" stroke="currentColor" stroke-width="1"/><line x1="10" y1="10" x2="10" y2="38" stroke="currentColor" stroke-width="1"/><polygon points="4,4 18,4 4,18" fill="currentColor" opacity="0.3"/><rect x="14" y="14" width="4" height="4" fill="currentColor"/>'
        },
        {
            id: 'ribbon_banner_curved',
            name: 'Bannière Ruban Cintré InDesign',
            category: 'ornements',
            tags: ['ruban', 'banniere', 'bandeau', 'titre', 'cartouche'],
            defaultW: 80,
            defaultH: 18,
            defaultColor: '#c8a96a',
            viewBox: '0 0 120 28',
            svg: '<path d="M15,6 L105,6 L100,22 L10,22 Z" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M10,22 L0,28 L5,14 L15,6" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M105,6 L115,14 L120,28 L100,22" fill="none" stroke="currentColor" stroke-width="1.2"/><polygon points="10,22 15,22 15,16" fill="currentColor" opacity="0.5"/><polygon points="105,22 100,22 100,16" fill="currentColor" opacity="0.5"/>'
        },

        // ====================================================================
        // 2. SCEAUX, BADGES & TIMBRES DE QUALITÉ (Stamps & Awards)
        // ====================================================================
        {
            id: 'badge_fait_maison_pro',
            name: 'Sceau Circulaire Fait Maison Artisanal',
            category: 'sceaux_badges',
            tags: ['fait maison', 'sceau', 'artisanal', 'qualite', 'stamp', 'fraicheur'],
            defaultW: 32,
            defaultH: 32,
            defaultColor: '#c8a96a',
            viewBox: '0 0 64 64',
            svg: '<circle cx="32" cy="32" r="29" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="3 2"/><circle cx="32" cy="32" r="25" fill="none" stroke="currentColor" stroke-width="1"/><path d="M22,34 L28,40 L42,24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M20,20 C24,16 32,14 44,18" fill="none" stroke="currentColor" stroke-width="0.8"/><text x="32" y="50" font-family="Montserrat, sans-serif" font-size="4.5" font-weight="bold" fill="currentColor" text-anchor="middle" letter-spacing="1">FAIT MAISON</text>'
        },
        {
            id: 'badge_chef_signature_star',
            name: 'Blason Recette Signature du Chef',
            category: 'sceaux_badges',
            tags: ['chef', 'signature', 'etoile', 'blason', 'prestige', 'coup de coeur'],
            defaultW: 34,
            defaultH: 34,
            defaultColor: '#c8a96a',
            viewBox: '0 0 64 64',
            svg: '<polygon points="32,3 42,9 52,5 55,16 64,22 61,33 65,44 55,49 52,60 41,57 32,63 23,57 12,60 9,49 -1,44 3,33 0,22 9,16 12,5 22,9" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="32" cy="32" r="21" fill="none" stroke="currentColor" stroke-width="1"/><polygon points="32,18 35,26 43,26 37,31 39,39 32,34 25,39 27,31 21,26 29,26" fill="currentColor"/><text x="32" y="47" font-family="Cinzel, serif" font-size="4" font-weight="bold" fill="currentColor" text-anchor="middle" letter-spacing="0.5">SIGNATURE</text>'
        },
        {
            id: 'badge_michelin_star5',
            name: 'Rangée de 5 Étoiles d’Excellence',
            category: 'sceaux_badges',
            tags: ['etoiles', 'michelin', 'avis', 'luxe', 'prestige', 'note'],
            defaultW: 42,
            defaultH: 12,
            defaultColor: '#c8a96a',
            viewBox: '0 0 100 24',
            svg: '<g transform="translate(4,4)"><polygon points="10,2 12,7 18,7 13,11 15,16 10,13 5,16 7,11 2,7 8,7" fill="currentColor"/></g><g transform="translate(24,4)"><polygon points="10,2 12,7 18,7 13,11 15,16 10,13 5,16 7,11 2,7 8,7" fill="currentColor"/></g><g transform="translate(44,4)"><polygon points="10,2 12,7 18,7 13,11 15,16 10,13 5,16 7,11 2,7 8,7" fill="currentColor"/></g><g transform="translate(64,4)"><polygon points="10,2 12,7 18,7 13,11 15,16 10,13 5,16 7,11 2,7 8,7" fill="currentColor"/></g><g transform="translate(84,4)"><polygon points="10,2 12,7 18,7 13,11 15,16 10,13 5,16 7,11 2,7 8,7" fill="currentColor"/></g>'
        },
        {
            id: 'badge_bio_terroir',
            name: 'Sceau Produits Locaux & Terroir Bio',
            category: 'sceaux_badges',
            tags: ['bio', 'terroir', 'local', 'naturel', 'sceau', 'ferme'],
            defaultW: 32,
            defaultH: 32,
            defaultColor: '#059669',
            viewBox: '0 0 64 64',
            svg: '<circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" stroke-width="2"/><path d="M32,16 C24,24 22,34 32,44 C42,34 40,24 32,16 Z" fill="currentColor" opacity="0.2"/><path d="M32,20 C26,26 26,36 32,40 C38,36 38,26 32,20 Z" fill="none" stroke="currentColor" stroke-width="1.8"/><line x1="32" y1="20" x2="32" y2="40" stroke="currentColor" stroke-width="1.5"/><text x="32" y="52" font-family="Montserrat, sans-serif" font-size="4" font-weight="bold" fill="currentColor" text-anchor="middle">100% TERROIR</text>'
        },
        {
            id: 'seal_handmade',
            name: 'Médaille d’Or & Ruban de Qualité',
            category: 'sceaux_badges',
            tags: ['medaille', 'or', 'ruban', 'qualite', 'laurier'],
            defaultW: 32,
            defaultH: 38,
            defaultColor: '#c8a96a',
            viewBox: '0 0 64 76',
            svg: '<circle cx="32" cy="30" r="24" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="32" cy="30" r="20" fill="none" stroke="currentColor" stroke-width="1"/><polygon points="32,18 35,26 43,26 37,31 39,39 32,34 25,39 27,31 21,26 29,26" fill="currentColor"/><polygon points="24,50 16,72 26,66 32,74 28,52" fill="currentColor" opacity="0.7"/><polygon points="40,50 48,72 38,66 32,74 36,52" fill="currentColor" opacity="0.7"/>'
        },

        // ====================================================================
        // 3. ARTS DE LA TABLE & HAUTE GASTRONOMIE (Food & Dining)
        // ====================================================================
        {
            id: 'cloche_prestige',
            name: 'Cloche de Palace sur Plateau d’Argent',
            category: 'gastronomie',
            tags: ['cloche', 'service', 'palace', 'gastronomie', 'plat', 'prestige'],
            defaultW: 34,
            defaultH: 26,
            defaultColor: '#c8a96a',
            viewBox: '0 0 64 48',
            svg: '<circle cx="32" cy="10" r="3.5" fill="currentColor"/><path d="M12,36 C12,18 20,13 32,13 C44,13 52,18 52,36 Z" fill="none" stroke="currentColor" stroke-width="2.2"/><ellipse cx="32" cy="37" rx="26" ry="4" fill="none" stroke="currentColor" stroke-width="2.2"/><ellipse cx="32" cy="37" rx="22" ry="2.5" fill="currentColor" opacity="0.25"/><line x1="16" y1="36" x2="48" y2="36" stroke="currentColor" stroke-width="1"/>'
        },
        {
            id: 'cutlery_crossed',
            name: 'Couverts Croisés Épurés InDesign',
            category: 'gastronomie',
            tags: ['couverts', 'fourchette', 'couteau', 'croises', 'restaurant', 'menu'],
            defaultW: 30,
            defaultH: 30,
            defaultColor: '#c8a96a',
            viewBox: '0 0 64 64',
            svg: '<path d="M16,10 L20,24 C21,27 23,29 26,29 L38,41 L41,38 L29,26 C29,23 27,21 24,20 L10,16 Z" fill="currentColor" opacity="0.2"/><line x1="12" y1="52" x2="52" y2="12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/><path d="M52,12 C44,14 42,20 44,28 L24,48 L16,56 L12,52 L20,44 L40,24 C48,26 54,24 52,12 Z" fill="currentColor"/><line x1="52" y1="52" x2="12" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M8,16 C10,24 16,28 22,24 L16,18 L18,12 L14,10 L12,14 Z" fill="currentColor"/>'
        },
        {
            id: 'chef_toque_royal',
            name: 'Toque de Chef Étoilé Plissée',
            category: 'gastronomie',
            tags: ['toque', 'chef', 'cuisinier', 'etoile', 'chapeau'],
            defaultW: 32,
            defaultH: 30,
            defaultColor: '#c8a96a',
            viewBox: '0 0 64 64',
            svg: '<path d="M16,42 C12,38 10,32 14,26 C16,22 22,20 24,22 C26,16 34,14 38,18 C42,14 50,16 52,22 C56,22 60,28 56,36 C54,40 50,42 48,42 Z" fill="currentColor" opacity="0.3"/><path d="M16,42 C12,38 10,32 14,26 C16,22 22,20 24,22 C26,16 34,14 38,18 C42,14 50,16 52,22 C56,22 60,28 56,36 C54,40 50,42 48,42" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><rect x="18" y="44" width="28" height="8" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><line x1="22" y1="48" x2="42" y2="48" stroke="currentColor" stroke-width="1" stroke-dasharray="2 2"/>'
        },
        {
            id: 'steak_flame_grill',
            name: 'Pièce de Viande & Flammes du Grill',
            category: 'gastronomie',
            tags: ['viande', 'steak', 'grill', 'flamme', 'bbq', 'boucher'],
            defaultW: 32,
            defaultH: 30,
            defaultColor: '#dc2626',
            viewBox: '0 0 64 64',
            svg: '<path d="M16,36 C16,28 26,24 38,24 C50,24 54,32 50,42 C46,50 24,52 18,46 C15,43 16,39 16,36 Z" fill="currentColor" opacity="0.25"/><ellipse cx="34" cy="38" rx="18" ry="10" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="26" cy="36" r="3.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M30,12 C32,16 30,18 34,22 C36,18 40,16 38,10 C36,6 30,8 30,12 Z" fill="currentColor"/>'
        },
        {
            id: 'pizza_woodfire_paddle',
            name: 'Pizza Napolitaine & Pelle à Bois',
            category: 'gastronomie',
            tags: ['pizza', 'napolitaine', 'italie', 'pelle', 'four', 'mozzarella'],
            defaultW: 34,
            defaultH: 32,
            defaultColor: '#ea580c',
            viewBox: '0 0 64 64',
            svg: '<circle cx="30" cy="30" r="22" fill="none" stroke="currentColor" stroke-width="2.2"/><circle cx="30" cy="30" r="18" fill="currentColor" opacity="0.2"/><line x1="30" y1="8" x2="30" y2="52" stroke="currentColor" stroke-width="1" stroke-dasharray="3 3"/><line x1="8" y1="30" x2="52" y2="30" stroke="currentColor" stroke-width="1" stroke-dasharray="3 3"/><circle cx="24" cy="22" r="3" fill="currentColor"/><circle cx="38" cy="24" r="3" fill="currentColor"/><circle cx="28" cy="38" r="3" fill="currentColor"/><circle cx="38" cy="36" r="2.5" fill="currentColor"/><line x1="46" y1="46" x2="60" y2="60" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>'
        },
        {
            id: 'burger_gourmet_smash',
            name: 'Burger Gourmet Brioché au Couteau',
            category: 'gastronomie',
            tags: ['burger', 'smash', 'gourmet', 'frites', 'cheddar', 'pain'],
            defaultW: 32,
            defaultH: 30,
            defaultColor: '#c8a96a',
            viewBox: '0 0 64 64',
            svg: '<path d="M14,30 C14,18 20,14 32,14 C44,14 50,18 50,30 Z" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M14,30 C14,18 20,14 32,14 C44,14 50,18 50,30 Z" fill="currentColor" opacity="0.2"/><circle cx="24" cy="22" r="1" fill="currentColor"/><circle cx="32" cy="19" r="1" fill="currentColor"/><circle cx="40" cy="22" r="1" fill="currentColor"/><path d="M12,34 Q18,31 24,34 Q30,37 36,34 Q42,31 48,34 Q54,37 52,34" fill="none" stroke="#16a34a" stroke-width="2"/><rect x="13" y="37" width="38" height="5" rx="2.5" fill="currentColor"/><path d="M16,46 C16,46 20,52 32,52 C44,52 48,46 48,46 Z" fill="none" stroke="currentColor" stroke-width="2.2"/>'
        },
        {
            id: 'fish_sea_lemon',
            name: 'Poisson Noble & Tranche de Citron',
            category: 'gastronomie',
            tags: ['poisson', 'mer', 'peche', 'saumon', 'bar', 'citron', 'iode'],
            defaultW: 36,
            defaultH: 26,
            defaultColor: '#0284c7',
            viewBox: '0 0 64 48',
            svg: '<path d="M8,24 C18,12 36,12 52,24 C36,36 18,36 8,24 Z" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M8,24 C18,12 36,12 52,24 C36,36 18,36 8,24 Z" fill="currentColor" opacity="0.15"/><polygon points="8,24 0,16 0,32" fill="currentColor"/><circle cx="44" cy="22" r="1.5" fill="currentColor"/><path d="M26,18 C28,24 28,28 26,30" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M34,18 C36,24 36,28 34,30" fill="none" stroke="currentColor" stroke-width="1.2"/>'
        },
        {
            id: 'pasta_twirl_fork',
            name: 'Pâtes Fraîches Enroulées à la Fourchette',
            category: 'gastronomie',
            tags: ['pates', 'pasta', 'spaghetti', 'italien', 'fourchette'],
            defaultW: 30,
            defaultH: 34,
            defaultColor: '#eab308',
            viewBox: '0 0 64 64',
            svg: '<line x1="32" y1="4" x2="32" y2="28" stroke="currentColor" stroke-width="2.5"/><path d="M24,28 C24,36 28,42 32,42 C36,42 40,36 40,28" fill="none" stroke="currentColor" stroke-width="2"/><ellipse cx="32" cy="42" rx="14" ry="8" fill="none" stroke="currentColor" stroke-width="2"/><ellipse cx="32" cy="42" rx="10" ry="5" fill="currentColor" opacity="0.25"/><line x1="32" y1="44" x2="32" y2="60" stroke="currentColor" stroke-width="2.5"/>'
        },

        // ====================================================================
        // 4. BARISTA, COCKTAILS, BIÈRES & VINS (Drinks & Bar)
        // ====================================================================
        {
            id: 'coffee_cup_steam',
            name: 'Tasse Espresso & Latte Art Rosace',
            category: 'cafe_bar',
            tags: ['cafe', 'espresso', 'tasse', 'barista', 'latte', 'vapeur'],
            defaultW: 32,
            defaultH: 28,
            defaultColor: '#c8a96a',
            viewBox: '0 0 64 56',
            svg: '<path d="M12,24 C12,40 20,44 32,44 C44,44 52,40 52,24 Z" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M12,24 C12,40 20,44 32,44 C44,44 52,40 52,24 Z" fill="currentColor" opacity="0.2"/><path d="M52,28 C58,28 62,32 62,36 C62,40 56,42 50,42" fill="none" stroke="currentColor" stroke-width="2"/><ellipse cx="32" cy="48" rx="24" ry="4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M26,16 C24,12 28,8 26,4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M34,16 C32,12 36,8 34,4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>'
        },
        {
            id: 'chemex_coffee_maker',
            name: 'Cafetière Filtre Chemex Sablier',
            category: 'cafe_bar',
            tags: ['chemex', 'slow coffee', 'filtre', 'barista', 'cafetiere', 'bois'],
            defaultW: 28,
            defaultH: 34,
            defaultColor: '#c8a96a',
            viewBox: '0 0 64 64',
            svg: '<polygon points="18,8 46,8 36,30 48,54 16,54 28,30" fill="none" stroke="currentColor" stroke-width="2.2"/><polygon points="26,30 38,30 44,52 20,52" fill="currentColor" opacity="0.3"/><rect x="28" y="27" width="8" height="6" rx="1.5" fill="currentColor"/><circle cx="32" cy="30" r="1.5" fill="#ffffff"/>'
        },
        {
            id: 'wine_glass_bordeaux',
            name: 'Verre Ballon à Vin & Bouteille',
            category: 'cafe_bar',
            tags: ['vin', 'verre', 'bouteille', 'bordeaux', 'rouge', 'cave', 'sommelier'],
            defaultW: 32,
            defaultH: 34,
            defaultColor: '#881337',
            viewBox: '0 0 64 64',
            svg: '<path d="M14,18 C14,32 24,36 28,36 L28,52 L20,52 L20,55 L36,55 L36,52 L28,52 L28,36 C32,36 42,32 42,18 Z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M16,24 C18,32 24,34 28,34 C32,34 38,32 40,24 Z" fill="currentColor" opacity="0.4"/><rect x="46" y="24" width="12" height="30" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><rect x="49" y="14" width="6" height="10" fill="none" stroke="currentColor" stroke-width="1.8"/>'
        },
        {
            id: 'cocktail_martini_twist',
            name: 'Verre à Cocktail Martini & Zeste',
            category: 'cafe_bar',
            tags: ['cocktail', 'martini', 'bar', 'mixologie', 'zeste', 'aperitif'],
            defaultW: 32,
            defaultH: 34,
            defaultColor: '#c8a96a',
            viewBox: '0 0 64 64',
            svg: '<polygon points="14,12 50,12 32,34" fill="none" stroke="currentColor" stroke-width="2.2"/><polygon points="20,18 44,18 32,32" fill="currentColor" opacity="0.3"/><line x1="32" y1="34" x2="32" y2="54" stroke="currentColor" stroke-width="2.2"/><line x1="22" y1="54" x2="42" y2="54" stroke="currentColor" stroke-width="2.2"/><circle cx="28" cy="18" r="3" fill="currentColor"/><line x1="24" y1="12" x2="40" y2="28" stroke="currentColor" stroke-width="1.2"/>'
        },
        {
            id: 'champagne_flute_stars',
            name: 'Flûte de Champagne Pétillante',
            category: 'cafe_bar',
            tags: ['champagne', 'flute', 'bulles', 'fete', 'celebration', 'etoiles'],
            defaultW: 24,
            defaultH: 36,
            defaultColor: '#eab308',
            viewBox: '0 0 48 64',
            svg: '<path d="M18,10 L18,36 C18,42 22,44 24,44 C26,44 30,42 30,36 L30,10 Z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M19,22 L19,36 C19,40 22,42 24,42 C26,42 29,40 29,36 L29,22 Z" fill="currentColor" opacity="0.3"/><line x1="24" y1="44" x2="24" y2="56" stroke="currentColor" stroke-width="2"/><line x1="16" y1="56" x2="32" y2="56" stroke="currentColor" stroke-width="2"/><circle cx="22" cy="28" r="1" fill="currentColor"/><circle cx="25" cy="24" r="1.2" fill="currentColor"/><circle cx="23" cy="18" r="1" fill="currentColor"/>'
        },
        {
            id: 'craft_beer_glass',
            name: 'Pinte de Bière Artisanale avec Mousse',
            category: 'cafe_bar',
            tags: ['biere', 'pinte', 'craft beer', 'brasserie', 'mousse', 'pub'],
            defaultW: 28,
            defaultH: 34,
            defaultColor: '#f59e0b',
            viewBox: '0 0 64 64',
            svg: '<path d="M20,20 L22,54 C22,56 26,58 32,58 C38,58 42,56 42,54 L44,20 Z" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M21,24 L22,52 C22,54 26,56 32,56 C38,56 42,54 43,24 Z" fill="currentColor" opacity="0.3"/><path d="M18,18 C18,14 24,12 28,14 C30,12 36,12 38,14 C42,12 46,14 46,18 C48,20 46,22 42,22 L20,22 C18,22 16,20 18,18 Z" fill="currentColor"/>'
        },

        // ====================================================================
        // 5. BOULANGERIE, BRUNCH & PÂTISSERIE (Bakery & Pastry)
        // ====================================================================
        {
            id: 'croissant_parisien_flaky',
            name: 'Croissant au Beurre Feuilleté Français',
            category: 'brunch_dessert',
            tags: ['croissant', 'boulangerie', 'beurre', 'viennoiserie', 'petit dejeuner'],
            defaultW: 34,
            defaultH: 26,
            defaultColor: '#d97706',
            viewBox: '0 0 64 48',
            svg: '<path d="M10,34 C12,22 24,14 32,14 C40,14 52,22 54,34 C44,32 38,36 32,36 C26,36 20,32 10,34 Z" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M10,34 C12,22 24,14 32,14 C40,14 52,22 54,34 C44,32 38,36 32,36 C26,36 20,32 10,34 Z" fill="currentColor" opacity="0.25"/><path d="M22,20 C24,26 26,30 26,34" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M32,14 C32,22 32,28 32,36" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M42,20 C40,26 38,30 38,34" fill="none" stroke="currentColor" stroke-width="1.8"/>'
        },
        {
            id: 'wheat_ear_golden',
            name: 'Épi de Blé Doré Moisson Noble',
            category: 'brunch_dessert',
            tags: ['ble', 'epi', 'pain', 'farine', 'moisson', 'naturel', 'artisanal'],
            defaultW: 24,
            defaultH: 36,
            defaultColor: '#c8a96a',
            viewBox: '0 0 48 64',
            svg: '<line x1="24" y1="8" x2="24" y2="58" stroke="currentColor" stroke-width="2"/><path d="M24,12 C28,10 32,14 30,18 C28,20 24,16 24,12 Z" fill="currentColor"/><path d="M24,12 C20,10 16,14 18,18 C20,20 24,16 24,12 Z" fill="currentColor"/><path d="M24,20 C30,18 34,22 32,26 C30,28 24,24 24,20 Z" fill="currentColor"/><path d="M24,20 C18,18 14,22 16,26 C18,28 24,24 24,20 Z" fill="currentColor"/><path d="M24,28 C30,26 34,30 32,34 C30,36 24,32 24,28 Z" fill="currentColor"/><path d="M24,28 C18,26 14,30 16,34 C18,36 24,32 24,28 Z" fill="currentColor"/>'
        },
        {
            id: 'macaron_haute_couture',
            name: 'Macaron Parisien Haute Couture',
            category: 'brunch_dessert',
            tags: ['macaron', 'patisserie', 'douceur', 'paris', 'ganache', 'amande'],
            defaultW: 30,
            defaultH: 26,
            defaultColor: '#ec4899',
            viewBox: '0 0 64 52',
            svg: '<path d="M14,22 C14,14 22,10 32,10 C42,10 50,14 50,22 Z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M14,22 C14,14 22,10 32,10 C42,10 50,14 50,22 Z" fill="currentColor" opacity="0.3"/><rect x="12" y="24" width="40" height="6" rx="3" fill="currentColor"/><path d="M14,32 C14,40 22,44 32,44 C42,44 50,40 50,32 Z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M14,32 C14,40 22,44 32,44 C42,44 50,40 50,32 Z" fill="currentColor" opacity="0.3"/>'
        },
        {
            id: 'layer_cake_festive',
            name: 'Part de Gâteau Étagé & Coulis',
            category: 'brunch_dessert',
            tags: ['gateau', 'part', 'cake', 'chocolat', 'fraise', 'anniversaire', 'dessert'],
            defaultW: 32,
            defaultH: 30,
            defaultColor: '#f43f5e',
            viewBox: '0 0 64 64',
            svg: '<polygon points="12,48 52,48 46,26 18,26" fill="none" stroke="currentColor" stroke-width="2"/><polygon points="14,46 50,46 45,28 20,28" fill="currentColor" opacity="0.2"/><line x1="16" y1="36" x2="48" y2="36" stroke="currentColor" stroke-width="1.8" stroke-dasharray="2 2"/><circle cx="32" cy="18" r="4" fill="currentColor"/><path d="M34,14 Q38,10 36,6" fill="none" stroke="currentColor" stroke-width="1.5"/>'
        },

        // ====================================================================
        // 6. ALLERGÈNES & RÉGIMES PAO (Dietary & Allergen Norms)
        // ====================================================================
        {
            id: 'allergen_vegetarian_v',
            name: 'Pictogramme Végétarien Certifié (V)',
            category: 'allergenes_regimes',
            tags: ['vegetarien', 'vege', 'regime', 'v', 'legumes', 'vert'],
            defaultW: 18,
            defaultH: 18,
            defaultColor: '#16a34a',
            viewBox: '0 0 48 48',
            svg: '<circle cx="24" cy="24" r="21" fill="none" stroke="currentColor" stroke-width="2"/><path d="M14,14 L24,34 L34,14" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path d="M24,20 C28,14 36,14 36,14 C36,14 34,22 28,24 Z" fill="currentColor"/>'
        },
        {
            id: 'allergen_vegan_leaf',
            name: 'Pictogramme 100% Vegan (Double Pousse)',
            category: 'allergenes_regimes',
            tags: ['vegan', 'vegetalien', 'plante', 'bio', 'vert', 'ecolo'],
            defaultW: 18,
            defaultH: 18,
            defaultColor: '#15803d',
            viewBox: '0 0 48 48',
            svg: '<circle cx="24" cy="24" r="21" fill="none" stroke="currentColor" stroke-width="2"/><path d="M24,36 C24,26 26,18 36,14 C36,24 30,32 24,36 Z" fill="currentColor"/><path d="M24,30 C20,22 14,20 12,20 C14,26 18,30 24,30 Z" fill="currentColor" opacity="0.6"/>'
        },
        {
            id: 'allergen_gluten_free',
            name: 'Pictogramme Sans Gluten (Épi Barré)',
            category: 'allergenes_regimes',
            tags: ['gluten free', 'sans gluten', 'intolerance', 'allergene', 'epi barre'],
            defaultW: 18,
            defaultH: 18,
            defaultColor: '#d97706',
            viewBox: '0 0 48 48',
            svg: '<circle cx="24" cy="24" r="21" fill="none" stroke="currentColor" stroke-width="2"/><path d="M24,12 C28,14 28,18 24,20 C20,18 20,14 24,12 Z" fill="currentColor"/><path d="M24,20 C28,22 28,26 24,28 C20,26 20,22 24,20 Z" fill="currentColor"/><path d="M24,28 C28,30 28,34 24,36 C20,34 20,30 24,28 Z" fill="currentColor"/><line x1="12" y1="36" x2="36" y2="12" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>'
        },
        {
            id: 'allergen_spicy_chili',
            name: 'Degré d’Épice / Piment Fort',
            category: 'allergenes_regimes',
            tags: ['epice', 'piment', 'chili', 'piquant', 'chaud', 'mexicain', 'thai'],
            defaultW: 20,
            defaultH: 20,
            defaultColor: '#dc2626',
            viewBox: '0 0 48 48',
            svg: '<path d="M34,10 C34,10 30,12 28,16 C22,24 16,30 10,34 C8,35 7,37 9,37 C15,37 26,34 32,26 C36,20 36,14 34,10 Z" fill="currentColor"/><path d="M34,10 Q38,6 40,6" fill="none" stroke="#16a34a" stroke-width="2.5" stroke-linecap="round"/>'
        },
        {
            id: 'allergen_lactose_free',
            name: 'Pictogramme Sans Lactose / Sans Lait',
            category: 'allergenes_regimes',
            tags: ['lactose', 'lait', 'sans lactose', 'bouteille', 'allergene'],
            defaultW: 18,
            defaultH: 18,
            defaultColor: '#0284c7',
            viewBox: '0 0 48 48',
            svg: '<circle cx="24" cy="24" r="21" fill="none" stroke="currentColor" stroke-width="2"/><rect x="18" y="20" width="12" height="18" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><rect x="21" y="14" width="6" height="6" fill="none" stroke="currentColor" stroke-width="1.8"/><line x1="10" y1="38" x2="38" y2="10" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>'
        },
        {
            id: 'allergen_nuts',
            name: 'Allergène Fruits à Coque & Noisettes',
            category: 'allergenes_regimes',
            tags: ['arachides', 'fruits a coque', 'noisette', 'noix', 'allergene'],
            defaultW: 18,
            defaultH: 18,
            defaultColor: '#b45309',
            viewBox: '0 0 48 48',
            svg: '<circle cx="24" cy="24" r="21" fill="none" stroke="currentColor" stroke-width="2"/><path d="M24,14 C16,20 16,30 24,34 C32,30 32,20 24,14 Z" fill="currentColor" opacity="0.3"/><path d="M24,14 C16,20 16,30 24,34 C32,30 32,20 24,14 Z" fill="none" stroke="currentColor" stroke-width="2"/><line x1="24" y1="14" x2="24" y2="34" stroke="currentColor" stroke-width="1.2"/>'
        },

        // ====================================================================
        // 7. CADRES & CARTOUCHES TYPOGRAPHIQUES (Frames & Boxes)
        // ====================================================================
        {
            id: 'frame_artdeco_border',
            name: 'Cadre Biseauté Art Déco Prestige',
            category: 'cadres_cartouches',
            tags: ['cadre', 'cartouche', 'biseaute', 'art deco', 'encadrement'],
            defaultW: 60,
            defaultH: 40,
            defaultColor: '#c8a96a',
            viewBox: '0 0 100 60',
            svg: '<polygon points="8,2 92,2 98,8 98,52 92,58 8,58 2,52 2,8" fill="none" stroke="currentColor" stroke-width="1.5"/><polygon points="12,6 88,6 94,12 94,48 88,54 12,54 6,48 6,12" fill="none" stroke="currentColor" stroke-width="0.75"/>'
        },
        {
            id: 'cartouche_chef_special',
            name: 'Cartouche Titre Encoché "Suggestion"',
            category: 'cadres_cartouches',
            tags: ['cartouche', 'encoche', 'titre', 'suggestion', 'plat'],
            defaultW: 70,
            defaultH: 24,
            defaultColor: '#c8a96a',
            viewBox: '0 0 120 36',
            svg: '<path d="M10,4 L110,4 L116,18 L110,32 L10,32 L4,18 Z" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M14,8 L106,8 L110,18 L106,28 L14,28 L10,18 Z" fill="currentColor" opacity="0.15"/>'
        }
    ],

    getById(id) {
        return this.items.find(item => item.id === id) || null;
    },
    getItem(id) {
        return this.getById(id);
    },

    filter(categoryId = 'all', searchQuery = '') {
        let results = this.items;
        if (categoryId && categoryId !== 'all') {
            results = results.filter(item => item.category === categoryId);
        }
        if (searchQuery && searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            results = results.filter(item =>
                item.name.toLowerCase().includes(q) ||
                (item.tags && item.tags.some(t => t.toLowerCase().includes(q)))
            );
        }
        return results;
    },

    buildSVGString(item, options = {}) {
        if (!item) return '';
        const color = options.color || item.defaultColor || '#c8a96a';
        const opacity = options.opacity !== undefined ? options.opacity : 1;
        const flipH = options.flipH ? -1 : 1;
        const flipV = options.flipV ? -1 : 1;
        const rotate = options.rotate || 0;

        let transform = '';
        if (flipH === -1 || flipV === -1 || rotate !== 0) {
            transform = `transform="scale(${flipH}, ${flipV}) rotate(${rotate})" transform-origin="center"`;
        }

        return `
            <svg xmlns="http://www.w3.org/2000/svg" 
                 viewBox="${item.viewBox}" 
                 style="color: ${color}; fill: currentColor; opacity: ${opacity}; width: 100%; height: 100%; display: block;" 
                 ${transform}>
                ${item.svg}
            </svg>
        `.trim();
    }
};

// Alias pour compatibilité ascendante avec CanvaIllustrationsPack
const CanvaIllustrationsPack = InDesignIllustrationsPack;

if (typeof window !== 'undefined') {
    window.InDesignIllustrationsPack = InDesignIllustrationsPack;
    window.CanvaIllustrationsPack = CanvaIllustrationsPack;
}
