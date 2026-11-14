/**
 * ============================================================================
 * PACK DES ILLUSTRATIONS STYLE CANVA (Vector SVG Library)
 * Plus de 50 illustrations professionnelles spécialement conçues pour la
 * restauration, cafés, bistros, pâtisseries, ornements de menus et flyers.
 * Toutes les illustrations sont 100% vectorielles (SVG) et teintables en direct.
 * ============================================================================
 */

const CanvaIllustrationsPack = {
    categories: [
        { id: 'all', name: 'Toutes les illustrations', icon: 'fa-wand-magic-sparkles' },
        { id: 'gastronomie', name: 'Gastronomie & Plats', icon: 'fa-utensils' },
        { id: 'cafe_bar', name: 'Café & Boissons', icon: 'fa-mug-hot' },
        { id: 'brunch_dessert', name: 'Brunch & Pâtisserie', icon: 'fa-cake-candles' },
        { id: 'ornements', name: 'Séparateurs & Ornements', icon: 'fa-gem' },
        { id: 'sceaux_badges', name: 'Sceaux, Badges & Rubans', icon: 'fa-award' },
        { id: 'elements', name: 'Symboles & Flèches', icon: 'fa-star' }
    ],

    items: [
        {
          "id": "taco_mexican",
          "name": "Taco Mexicain Gourmand",
          "category": "gastronomie",
          "tags": [
                    "taco",
                    "mexicain",
                    "street food",
                    "tortilla",
                    "snack"
          ],
          "defaultW": 26,
          "defaultH": 22,
          "defaultColor": "#c8a96a",
          "viewBox": "0 0 64 64",
          "svg": "<path fill=\"currentColor\" d=\"M10 38c0-12 10-22 22-22s22 10 22 22H10z\"/><ellipse cx=\"32\" cy=\"38\" rx=\"22\" ry=\"6\" fill=\"#ffffff\" opacity=\"0.4\"/><circle cx=\"24\" cy=\"32\" r=\"2.5\" fill=\"#e11d48\"/><circle cx=\"34\" cy=\"30\" r=\"2.5\" fill=\"#059669\"/><circle cx=\"42\" cy=\"33\" r=\"2\" fill=\"#e11d48\"/><path fill=\"currentColor\" d=\"M12 40c4 4 11 6 20 6s16-2 20-6H12z\"/>"
},
        {
          "id": "bbq_skewers",
          "name": "Brochettes Grillées Barbecue",
          "category": "gastronomie",
          "tags": [
                    "brochette",
                    "grill",
                    "bbq",
                    "viande",
                    "poulet",
                    "marinade"
          ],
          "defaultW": 28,
          "defaultH": 24,
          "defaultColor": "#c8a96a",
          "viewBox": "0 0 64 64",
          "svg": "<line x1=\"8\" y1=\"56\" x2=\"56\" y2=\"8\" stroke=\"currentColor\" stroke-width=\"2.5\" stroke-linecap=\"round\"/><rect x=\"18\" y=\"38\" width=\"8\" height=\"8\" rx=\"2\" fill=\"currentColor\" transform=\"rotate(-45 22 42)\"/><rect x=\"28\" y=\"28\" width=\"8\" height=\"8\" rx=\"2\" fill=\"currentColor\" transform=\"rotate(-45 32 32)\"/><rect x=\"38\" y=\"18\" width=\"8\" height=\"8\" rx=\"2\" fill=\"currentColor\" transform=\"rotate(-45 42 22)\"/>"
},
        {
          "id": "pan_sizzle",
          "name": "Poêle & Flammes du Chef",
          "category": "gastronomie",
          "tags": [
                    "poele",
                    "cuisson",
                    "flamme",
                    "wok",
                    "chaud"
          ],
          "defaultW": 28,
          "defaultH": 24,
          "defaultColor": "#c8a96a",
          "viewBox": "0 0 64 64",
          "svg": "<ellipse cx=\"28\" cy=\"36\" rx=\"18\" ry=\"10\" fill=\"currentColor\"/><line x1=\"44\" y1=\"36\" x2=\"58\" y2=\"28\" stroke=\"currentColor\" stroke-width=\"4\" stroke-linecap=\"round\"/><path fill=\"currentColor\" d=\"M22 24c0-4 3-7 3-7s3 3 3 7c0 2-1 3-3 3s-3-1-3-3zm10-2c0-3 2-6 2-6s2 3 2 6c0 1.5-1 2.5-2 2.5s-2-1-2-2.5z\"/>"
},
        {
          "id": "french_baguette",
          "name": "Baguette Tradition & Épi de Blé",
          "category": "gastronomie",
          "tags": [
                    "pain",
                    "baguette",
                    "ble",
                    "boulangerie",
                    "tradition"
          ],
          "defaultW": 30,
          "defaultH": 22,
          "defaultColor": "#c8a96a",
          "viewBox": "0 0 64 64",
          "svg": "<path fill=\"currentColor\" d=\"M10 46c-2-2-2-6 1-9L43 9c3-3 7-3 9-1 2 2 2 6-1 9L19 45c-3 3-7 3-9 1z\"/><line x1=\"22\" y1=\"28\" x2=\"26\" y2=\"34\" stroke=\"#ffffff\" stroke-width=\"2\" stroke-linecap=\"round\"/><line x1=\"32\" y1=\"18\" x2=\"36\" y2=\"24\" stroke=\"#ffffff\" stroke-width=\"2\" stroke-linecap=\"round\"/><line x1=\"42\" y1=\"8\" x2=\"46\" y2=\"14\" stroke=\"#ffffff\" stroke-width=\"2\" stroke-linecap=\"round\"/>"
},
        {
          "id": "wine_bottle_grapes",
          "name": "Bouteille de Vin Millésimé",
          "category": "cafe_bar",
          "tags": [
                    "bouteille",
                    "vin",
                    "millesime",
                    "raisin",
                    "cave"
          ],
          "defaultW": 20,
          "defaultH": 30,
          "defaultColor": "#c8a96a",
          "viewBox": "0 0 64 64",
          "svg": "<rect x=\"29\" y=\"8\" width=\"6\" height=\"10\" rx=\"1\" fill=\"currentColor\"/><path fill=\"currentColor\" d=\"M26 18c-3 3-6 7-6 12v22c0 2 2 4 4 4h16c2 0 4-2 4-4V30c0-5-3-9-6-12h-12z\"/><rect x=\"22\" y=\"32\" width=\"20\" height=\"14\" rx=\"1\" fill=\"#ffffff\" opacity=\"0.3\"/>"
},
        {
          "id": "smoothie_tropical",
          "name": "Smoothie Tropical & Paille",
          "category": "cafe_bar",
          "tags": [
                    "smoothie",
                    "jus",
                    "fruits",
                    "frais",
                    "ete",
                    "boisson"
          ],
          "defaultW": 22,
          "defaultH": 28,
          "defaultColor": "#c8a96a",
          "viewBox": "0 0 64 64",
          "svg": "<path fill=\"currentColor\" d=\"M18 20l5 36h18l5-36H18z\"/><ellipse cx=\"32\" cy=\"20\" rx=\"14\" ry=\"4\" fill=\"currentColor\"/><line x1=\"34\" y1=\"20\" x2=\"44\" y2=\"6\" stroke=\"currentColor\" stroke-width=\"2.5\" stroke-linecap=\"round\"/><path fill=\"#ffffff\" opacity=\"0.4\" d=\"M21 28l3 22h16l3-22H21z\"/>"
},
        {
          "id": "champagne_flutes",
          "name": "Duo Flûtes de Champagne Toast",
          "category": "cafe_bar",
          "tags": [
                    "champagne",
                    "flutes",
                    "fete",
                    "toast",
                    "celebration"
          ],
          "defaultW": 26,
          "defaultH": 28,
          "defaultColor": "#c8a96a",
          "viewBox": "0 0 64 64",
          "svg": "<path fill=\"currentColor\" d=\"M22 10l-4 18c0 4 3 6 6 6h1c3 0 6-2 6-6l-4-18h-5zm-2 24v14h-4v2h12v-2h-4V34h-4z\" transform=\"rotate(-15 24 30)\"/><path fill=\"currentColor\" d=\"M42 10l-4 18c0 4 3 6 6 6h1c3 0 6-2 6-6l-4-18h-5zm-2 24v14h-4v2h12v-2h-4V34h-4z\" transform=\"rotate(15 40 30)\"/><circle cx=\"32\" cy=\"14\" r=\"1.5\" fill=\"currentColor\"/>"
},
        {
          "id": "coffee_togo",
          "name": "Gobelet Café à Emporter",
          "category": "cafe_bar",
          "tags": [
                    "cafe",
                    "togo",
                    "emporter",
                    "gobelet",
                    "express"
          ],
          "defaultW": 20,
          "defaultH": 28,
          "defaultColor": "#c8a96a",
          "viewBox": "0 0 64 64",
          "svg": "<rect x=\"22\" y=\"10\" width=\"20\" height=\"4\" rx=\"2\" fill=\"currentColor\"/><path fill=\"currentColor\" d=\"M20 14l3 40c0 2 2 3 4 3h10c2 0 4-1 4-3l3-40H20z\"/><rect x=\"22\" y=\"28\" width=\"20\" height=\"12\" rx=\"1\" fill=\"#ffffff\" opacity=\"0.3\"/>"
},
        {
          "id": "donut_glazed",
          "name": "Donut Glacé Gourmand",
          "category": "brunch_dessert",
          "tags": [
                    "donut",
                    "glace",
                    "sucre",
                    "patisserie",
                    "gouter"
          ],
          "defaultW": 26,
          "defaultH": 26,
          "defaultColor": "#c8a96a",
          "viewBox": "0 0 64 64",
          "svg": "<circle cx=\"32\" cy=\"32\" r=\"22\" fill=\"currentColor\"/><circle cx=\"32\" cy=\"32\" r=\"8\" fill=\"#ffffff\"/><path fill=\"#ffffff\" opacity=\"0.4\" d=\"M32 14c-10 0-18 8-18 18 2-1 4 2 6 0s4-2 6 0 4 2 6 0 4-2 6 0 4 2 6 0 4-2 6 0c0-10-8-18-18-18zm0 10c4.4 0 8 3.6 8 8s-3.6 8-8 8-8-3.6-8-8 3.6-8 8-8z\"/>"
},
        {
          "id": "cheesecake_slice",
          "name": "Part de Cheesecake Coulis",
          "category": "brunch_dessert",
          "tags": [
                    "cheesecake",
                    "gateau",
                    "dessert",
                    "part",
                    "coulis"
          ],
          "defaultW": 28,
          "defaultH": 24,
          "defaultColor": "#c8a96a",
          "viewBox": "0 0 64 64",
          "svg": "<path fill=\"currentColor\" d=\"M10 44l38-24v18l-38 6z\"/><path fill=\"currentColor\" d=\"M10 44L32 16l26 4-10 24H10z\" opacity=\"0.85\"/><circle cx=\"34\" cy=\"18\" r=\"3\" fill=\"#e11d48\"/><circle cx=\"40\" cy=\"20\" r=\"2.5\" fill=\"#e11d48\"/>"
},
        {
          "id": "macarons_duo",
          "name": "Duo de Macarons Parisiens",
          "category": "brunch_dessert",
          "tags": [
                    "macaron",
                    "paris",
                    "patisserie",
                    "chic",
                    "douceur"
          ],
          "defaultW": 24,
          "defaultH": 26,
          "defaultColor": "#c8a96a",
          "viewBox": "0 0 64 64",
          "svg": "<rect x=\"18\" y=\"16\" width=\"28\" height=\"8\" rx=\"4\" fill=\"currentColor\"/><rect x=\"20\" y=\"24\" width=\"24\" height=\"3\" fill=\"#ffffff\" opacity=\"0.7\"/><rect x=\"18\" y=\"27\" width=\"28\" height=\"8\" rx=\"4\" fill=\"currentColor\"/><rect x=\"16\" y=\"38\" width=\"32\" height=\"8\" rx=\"4\" fill=\"currentColor\"/><rect x=\"18\" y=\"46\" width=\"28\" height=\"3\" fill=\"#ffffff\" opacity=\"0.7\"/><rect x=\"16\" y=\"49\" width=\"32\" height=\"8\" rx=\"4\" fill=\"currentColor\"/>"
},
        {
          "id": "eclair_chocolat",
          "name": "Éclair Chocolat Gourmand",
          "category": "brunch_dessert",
          "tags": [
                    "eclair",
                    "chocolat",
                    "patisserie",
                    "creme"
          ],
          "defaultW": 30,
          "defaultH": 18,
          "defaultColor": "#c8a96a",
          "viewBox": "0 0 64 64",
          "svg": "<rect x=\"10\" y=\"24\" width=\"44\" height=\"16\" rx=\"8\" fill=\"currentColor\"/><path fill=\"#ffffff\" opacity=\"0.3\" d=\"M14 26h36c3 0 6 2 6 5s-3 5-6 5H14c-3 0-6-2-6-5s3-5 6-5z\"/>"
},
        {
          "id": "divider_botanical_leaves",
          "name": "Frise Feuilles d'Olivier",
          "category": "ornements",
          "tags": [
                    "separateur",
                    "olivier",
                    "feuilles",
                    "nature",
                    "chic",
                    "italien"
          ],
          "defaultW": 60,
          "defaultH": 8,
          "defaultColor": "#c8a96a",
          "viewBox": "0 0 160 20",
          "svg": "<line x1=\"10\" y1=\"10\" x2=\"150\" y2=\"10\" stroke=\"currentColor\" stroke-width=\"1.2\"/><ellipse cx=\"50\" cy=\"6\" rx=\"4\" ry=\"2\" fill=\"currentColor\" transform=\"rotate(-20 50 6)\"/><ellipse cx=\"70\" cy=\"14\" rx=\"4\" ry=\"2\" fill=\"currentColor\" transform=\"rotate(20 70 14)\"/><ellipse cx=\"90\" cy=\"6\" rx=\"4\" ry=\"2\" fill=\"currentColor\" transform=\"rotate(-20 90 6)\"/><ellipse cx=\"110\" cy=\"14\" rx=\"4\" ry=\"2\" fill=\"currentColor\" transform=\"rotate(20 110 14)\"/><circle cx=\"80\" cy=\"10\" r=\"2.5\" fill=\"currentColor\"/>"
},
        {
          "id": "badge_chef_selection",
          "name": "Sceau Sélection du Chef",
          "category": "sceaux_badges",
          "tags": [
                    "chef",
                    "selection",
                    "recommandation",
                    "etoile",
                    "sceau"
          ],
          "defaultW": 28,
          "defaultH": 28,
          "defaultColor": "#c8a96a",
          "viewBox": "0 0 64 64",
          "svg": "<circle cx=\"32\" cy=\"32\" r=\"30\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"/><circle cx=\"32\" cy=\"32\" r=\"25\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.2\" stroke-dasharray=\"4 2\"/><path fill=\"currentColor\" d=\"M32 18l2 5 5 1-4 3 1 5-4-3-4 3 1-5-4-3 5-1z\"/><text x=\"32\" y=\"44\" font-family=\"'Montserrat', sans-serif\" font-size=\"5\" font-weight=\"800\" text-anchor=\"middle\" fill=\"currentColor\">CHEF'S CHOICE</text>"
},
        {
          "id": "badge_fresh_daily",
          "name": "Tampon Arrivage Frais du Jour",
          "category": "sceaux_badges",
          "tags": [
                    "frais",
                    "du jour",
                    "qualite",
                    "marche",
                    "tampon"
          ],
          "defaultW": 28,
          "defaultH": 28,
          "defaultColor": "#059669",
          "viewBox": "0 0 64 64",
          "svg": "<polygon points=\"32,4 40,8 49,6 54,14 62,18 62,27 68,34 64,42 66,51 58,56 55,64 46,64 40,70 32,67 24,70 18,64 9,64 6,56 -2,51 0,42 -4,34 2,27 2,18 10,14 15,6 24,8\" transform=\"scale(0.8) translate(8, 4)\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.5\"/><text x=\"32\" y=\"30\" font-family=\"'Montserrat', sans-serif\" font-size=\"6.5\" font-weight=\"900\" text-anchor=\"middle\" fill=\"currentColor\">ARRIVAGE</text><text x=\"32\" y=\"40\" font-family=\"'Montserrat', sans-serif\" font-size=\"6.5\" font-weight=\"900\" text-anchor=\"middle\" fill=\"currentColor\">DU JOUR</text>"
},
        {
          "id": "pepper_spicy",
          "name": "Piment Rouge Piquant (Spicy)",
          "category": "elements",
          "tags": [
                    "piment",
                    "piquant",
                    "spicy",
                    "epice",
                    "chili"
          ],
          "defaultW": 20,
          "defaultH": 22,
          "defaultColor": "#e11d48",
          "viewBox": "0 0 48 48",
          "svg": "<path fill=\"currentColor\" d=\"M36 8c-8 0-18 8-22 18-3 8 0 14 6 14 8 0 18-12 18-24 0-4-1-8-2-8z\"/><path fill=\"none\" stroke=\"#059669\" stroke-width=\"2.5\" stroke-linecap=\"round\" d=\"M36 8c3-4 7-4 9-5\"/>"
},
        {
          "id": "citrus_lemon_slice",
          "name": "Rondelle d'Agrume / Citron Frais",
          "category": "elements",
          "tags": [
                    "citron",
                    "agrume",
                    "frais",
                    "cocktail",
                    "rondelle"
          ],
          "defaultW": 22,
          "defaultH": 22,
          "defaultColor": "#c8a96a",
          "viewBox": "0 0 48 48",
          "svg": "<circle cx=\"24\" cy=\"24\" r=\"20\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.5\"/><circle cx=\"24\" cy=\"24\" r=\"16\" fill=\"currentColor\" opacity=\"0.2\"/><path fill=\"currentColor\" d=\"M24 24L14 14c3-3 7-4 10-4v14zm0 0V10c3 0 7 1 10 4L24 24zm0 0l10 10c-3 3-7 4-10 4V24zm0 0v14c-3 0-7-1-10-4l10-10z\"/>"
},
        {
          "id": "clock_bistro_hours",
          "name": "Horloge Bistrot Service Continu",
          "category": "elements",
          "tags": [
                    "horloge",
                    "heure",
                    "service continu",
                    "temps",
                    "ouvert"
          ],
          "defaultW": 20,
          "defaultH": 20,
          "defaultColor": "#c8a96a",
          "viewBox": "0 0 48 48",
          "svg": "<circle cx=\"24\" cy=\"24\" r=\"20\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.5\"/><line x1=\"24\" y1=\"24\" x2=\"24\" y2=\"12\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\"/><line x1=\"24\" y1=\"24\" x2=\"33\" y2=\"24\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\"/><circle cx=\"24\" cy=\"24\" r=\"2.5\" fill=\"currentColor\"/>"
},
        // ==========================================
        // 1. GASTRONOMIE & PLATS
        // ==========================================
        {
            id: 'cutlery_crossed',
            name: 'Couverts Croisés Étoilés',
            category: 'gastronomie',
            tags: ['couverts', 'fourchette', 'couteau', 'restaurant', 'gastronomie', 'dîner'],
            defaultW: 24,
            defaultH: 24,
            defaultColor: '#c8a96a',
            viewBox: '0 0 64 64',
            svg: `
                <path fill="currentColor" d="M18.5 6c-.8 0-1.5.7-1.5 1.5v12.2c0 3.1 2.1 5.7 5 6.5v28.3c0 1.9 1.6 3.5 3.5 3.5s3.5-1.6 3.5-3.5V26.2c2.9-.8 5-3.4 5-6.5V7.5c0-.8-.7-1.5-1.5-1.5s-1.5.7-1.5 1.5v10c0 .8-.7 1.5-1.5 1.5s-1.5-.7-1.5-1.5v-10c0-.8-.7-1.5-1.5-1.5s-1.5.7-1.5 1.5v10c0 .8-.7 1.5-1.5 1.5s-1.5-.7-1.5-1.5v-10c0-.8-.7-1.5-1.5-1.5s-1.5.7-1.5 1.5v10c0 .8-.7 1.5-1.5 1.5s-1.5-.7-1.5-1.5v-10c0-.8-.7-1.5-1.5-1.5z" transform="rotate(-30 32 32)"/>
                <path fill="currentColor" d="M37 6c-4.4 0-8 3.6-8 8v16.5c0 1.9 1.6 3.5 3.5 3.5h1.5v20.5c0 1.9 1.6 3.5 3.5 3.5s3.5-1.6 3.5-3.5V6.5c0-.3-.3-.5-.5-.5H37z" transform="rotate(30 32 32)"/>
                <circle cx="32" cy="10" r="2" fill="currentColor"/>
                <circle cx="26" cy="13" r="1.5" fill="currentColor"/>
                <circle cx="38" cy="13" r="1.5" fill="currentColor"/>
            `
        },
        {
            id: 'chef_hat_prestige',
            name: 'Toque de Chef Prestige',
            category: 'gastronomie',
            tags: ['chef', 'toque', 'cuisinier', 'maître', 'chapeau'],
            defaultW: 28,
            defaultH: 26,
            defaultColor: '#c8a96a',
            viewBox: '0 0 64 64',
            svg: `
                <path fill="currentColor" d="M47 24c0-2.2-.9-4.2-2.3-5.7.8-1.4 1.3-3 1.3-4.8 0-5.5-4.5-10-10-10-1.8 0-3.5.5-4 1.3-.5-.8-2.2-1.3-4-1.3-5.5 0-10 4.5-10 10 0 1.8.5 3.4 1.3 4.8-1.4 1.5-2.3 3.5-2.3 5.7 0 4.2 3.2 7.7 7.3 8.2v11.8h25.4V32.2c4.1-.5 7.3-4 7.3-8.2zM28.5 45.5h-8v-3h8v3zm15 0h-8v-3h8v3z"/>
                <rect x="20" y="50" width="24" height="4" rx="2" fill="currentColor"/>
                <path fill="currentColor" d="M32 18l1.5 3.1 3.4.5-2.5 2.4.6 3.4-3-1.6-3 1.6.6-3.4-2.5-2.4 3.4-.5z"/>
            `
        },
        {
            id: 'cloche_service',
            name: 'Cloche de Service Restaurant',
            category: 'gastronomie',
            tags: ['cloche', 'service', 'plat', 'repas', 'serveur', 'gastronomique'],
            defaultW: 28,
            defaultH: 22,
            defaultColor: '#c8a96a',
            viewBox: '0 0 64 64',
            svg: `
                <circle cx="32" cy="14" r="3.5" fill="currentColor"/>
                <path fill="currentColor" d="M32 18c-14.3 0-24 10.5-24 22h48c0-11.5-9.7-22-24-22zm-12 18c0-5 5.4-9 12-9s12 4 12 9H20z"/>
                <rect x="6" y="44" width="52" height="4" rx="2" fill="currentColor"/>
                <rect x="14" y="50" width="36" height="2" rx="1" fill="currentColor" opacity="0.6"/>
            `
        },
        {
            id: 'gourmet_burger',
            name: 'Burger Gourmet Décomposé',
            category: 'gastronomie',
            tags: ['burger', 'sandwich', 'viande', 'fastfood', 'bistro'],
            defaultW: 28,
            defaultH: 26,
            defaultColor: '#c8a96a',
            viewBox: '0 0 64 64',
            svg: `
                <path fill="currentColor" d="M12 28c0-10 9-18 20-18s20 8 20 18H12z"/>
                <ellipse cx="24" cy="18" rx="1.5" ry="0.8" fill="#ffffff" opacity="0.8"/>
                <ellipse cx="32" cy="15" rx="1.5" ry="0.8" fill="#ffffff" opacity="0.8"/>
                <ellipse cx="40" cy="19" rx="1.5" ry="0.8" fill="#ffffff" opacity="0.8"/>
                <path fill="currentColor" d="M10 32c2-1 4-1 6 1s4 2 6 0 4-2 6 0 4 2 6 0 4-2 6 0 4 2 6 0 4-2 6 0v2H10v-3z"/>
                <rect x="8" y="37" width="48" height="6" rx="3" fill="currentColor"/>
                <path fill="currentColor" d="M12 47c0 4 9 7 20 7s20-3 20-7H12z"/>
            `
        },
        {
            id: 'pizza_slice',
            name: 'Part de Pizza Italienne',
            category: 'gastronomie',
            tags: ['pizza', 'fromage', 'italien', 'snack', 'part'],
            defaultW: 26,
            defaultH: 28,
            defaultColor: '#c8a96a',
            viewBox: '0 0 64 64',
            svg: `
                <path fill="currentColor" d="M32 54L10 18c7-4 37-4 44 0L32 54z"/>
                <path fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" d="M12 18c6-3 34-3 40 0"/>
                <circle cx="28" cy="28" r="2.8" fill="#ffffff" opacity="0.75"/>
                <circle cx="36" cy="38" r="2.2" fill="#ffffff" opacity="0.75"/>
                <circle cx="35" cy="24" r="2" fill="#ffffff" opacity="0.75"/>
                <circle cx="25" cy="42" r="1.6" fill="#ffffff" opacity="0.75"/>
            `
        },
        {
            id: 'steak_grill',
            name: 'Steak & Flammes de Grill',
            category: 'gastronomie',
            tags: ['steak', 'viande', 'boeuf', 'grill', 'barbecue', 'bbq'],
            defaultW: 28,
            defaultH: 24,
            defaultColor: '#c8a96a',
            viewBox: '0 0 64 64',
            svg: `
                <path fill="currentColor" d="M16 26c-6 2-8 8-4 14 5 7 14 8 20 6s12 1 16-4c4-6 2-12-3-15-7-4-15-4-21-2l-8 1z"/>
                <circle cx="22" cy="32" r="3" fill="#ffffff" opacity="0.8"/>
                <path fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" d="M28 26l8 12M35 24l8 12M22 28l6 10"/>
                <path fill="currentColor" d="M24 16c0-4 4-8 4-8s4 4 4 8c0 3-2 5-4 5s-4-2-4-5zm14 2c0-3 3-6 3-6s3 3 3 6c0 2-1 4-3 4s-3-2-3-4z"/>
            `
        },
        {
            id: 'ramen_bowl',
            name: 'Bol Gourmand & Baguettes',
            category: 'gastronomie',
            tags: ['ramen', 'bol', 'soupe', 'nouilles', 'asiatique', 'baguettes'],
            defaultW: 28,
            defaultH: 26,
            defaultColor: '#c8a96a',
            viewBox: '0 0 64 64',
            svg: `
                <path fill="currentColor" d="M12 28c0 14 9 22 20 22s20-8 20-22H12z"/>
                <rect x="24" y="50" width="16" height="4" rx="2" fill="currentColor"/>
                <path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M8 20l46-12M6 24l48-12"/>
                <path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M22 18c0-4 3-6 3-6s3 2 3 6M32 16c0-4 3-6 3-6s3 2 3 6M42 18c0-4 3-6 3-6s3 2 3 6"/>
            `
        },
        {
            id: 'fish_gourmet',
            name: 'Poisson Fin Gourmet',
            category: 'gastronomie',
            tags: ['poisson', 'saumon', 'mer', 'fruits de mer', 'plancha'],
            defaultW: 30,
            defaultH: 20,
            defaultColor: '#c8a96a',
            viewBox: '0 0 64 64',
            svg: `
                <path fill="currentColor" d="M54 32s-10-14-26-14c-12 0-18 6-22 14 4 8 10 14 22 14 16 0 26-14 26-14zm-42 0c2-5 7-10 16-10 11 0 19 8 22 10-3 2-11 10-22 10-9 0-14-5-16-10z"/>
                <path fill="currentColor" d="M48 32l10-10v20L48 32z"/>
                <circle cx="18" cy="30" r="2" fill="currentColor"/>
                <path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M26 26c2 4 2 8 0 12M32 26c2 4 2 8 0 12M38 27c2 3 2 7 0 10"/>
            `
        },

        // ==========================================
        // 2. CAFÉ, BAR & BOISSONS
        // ==========================================
        {
            id: 'steaming_coffee',
            name: 'Tasse Café Expresso Fumant',
            category: 'cafe_bar',
            tags: ['cafe', 'expresso', 'tasse', 'chaud', 'vapeur', 'pause'],
            defaultW: 26,
            defaultH: 26,
            defaultColor: '#c8a96a',
            viewBox: '0 0 64 64',
            svg: `
                <path fill="currentColor" d="M12 28v14c0 6 5 11 11 11h14c6 0 11-5 11-11v-3h4c3.3 0 6-2.7 6-6s-2.7-6-6-6h-4v-5H12zm36 5h4c1.1 0 2 .9 2 2s-.9 2-2 2h-4v-4z"/>
                <rect x="8" y="55" width="44" height="4" rx="2" fill="currentColor"/>
                <path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M20 20c-1-3 1-6 1-9M28 20c-1-4 1-7 1-11M36 20c-1-3 1-6 1-9"/>
            `
        },
        {
            id: 'latte_art_heart',
            name: 'Latte Art Cœur',
            category: 'cafe_bar',
            tags: ['latte', 'cappuccino', 'coeur', 'art', 'mousse', 'lait'],
            defaultW: 26,
            defaultH: 26,
            defaultColor: '#c8a96a',
            viewBox: '0 0 64 64',
            svg: `
                <ellipse cx="32" cy="34" rx="22" ry="16" fill="currentColor"/>
                <ellipse cx="32" cy="34" rx="18" ry="12" fill="#ffffff" opacity="0.9"/>
                <path fill="currentColor" d="M32 39s-6-5-6-9c0-2.2 1.8-4 4-4 1.5 0 2.8.8 3.5 2 .7-1.2 2-2 3.5-2 2.2 0 4 1.8 4 4 0 4-6 9-6 9z" transform="scale(0.8) translate(8, 6)"/>
                <rect x="14" y="48" width="36" height="4" rx="2" fill="currentColor"/>
            `
        },
        {
            id: 'coffee_beans_duo',
            name: 'Grains de Café Torréfiés',
            category: 'cafe_bar',
            tags: ['grains', 'cafe', 'torrefie', 'naturel', 'arabica'],
            defaultW: 26,
            defaultH: 24,
            defaultColor: '#c8a96a',
            viewBox: '0 0 64 64',
            svg: `
                <g transform="rotate(-20 26 34)">
                    <ellipse cx="26" cy="34" rx="10" ry="15" fill="currentColor"/>
                    <path fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" d="M26 21c-3 5 3 11 0 16-3 5 1 10 0 10"/>
                </g>
                <g transform="rotate(35 42 30)">
                    <ellipse cx="42" cy="30" rx="9" ry="13" fill="currentColor" opacity="0.9"/>
                    <path fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" d="M42 19c-2.5 4 2.5 9 0 14-2.5 4 .8 8 0 8"/>
                </g>
            `
        },
        {
            id: 'teapot_moroccan',
            name: 'Théière Orientale Ciselée',
            category: 'cafe_bar',
            tags: ['the', 'theiere', 'marocain', 'menthe', 'oriental', 'infusion'],
            defaultW: 30,
            defaultH: 26,
            defaultColor: '#c8a96a',
            viewBox: '0 0 64 64',
            svg: `
                <circle cx="32" cy="12" r="2.5" fill="currentColor"/>
                <path fill="currentColor" d="M32 15c-1.5 0-7 2-7 4h14c0-2-5.5-4-7-4z"/>
                <path fill="currentColor" d="M20 22c0 10 5 18 12 18s12-8 12-18H20z"/>
                <path fill="currentColor" d="M26 40h12l2 8H24l2-8z"/>
                <path fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" d="M42 24c8-3 14 2 12 12-2 9-10 10-12 8"/>
                <path fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" d="M22 28C14 24 8 20 8 16"/>
            `
        },
        {
            id: 'cocktail_martini',
            name: 'Verre à Cocktail & Olive',
            category: 'cafe_bar',
            tags: ['cocktail', 'martini', 'bar', 'soiree', 'apero', 'boisson'],
            defaultW: 24,
            defaultH: 28,
            defaultColor: '#c8a96a',
            viewBox: '0 0 64 64',
            svg: `
                <path fill="currentColor" d="M12 16l20 22 20-22H12z"/>
                <rect x="30" y="38" width="4" height="16" fill="currentColor"/>
                <ellipse cx="32" cy="55" rx="14" ry="3" fill="currentColor"/>
                <line x1="20" y1="12" x2="38" y2="30" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round"/>
                <circle cx="28" cy="20" r="2.8" fill="#ffffff"/>
            `
        },
        {
            id: 'wine_glass_prestige',
            name: 'Verre à Vin Prestige',
            category: 'cafe_bar',
            tags: ['vin', 'verre', 'rouge', 'blanc', 'degustation'],
            defaultW: 22,
            defaultH: 30,
            defaultColor: '#c8a96a',
            viewBox: '0 0 64 64',
            svg: `
                <path fill="currentColor" d="M20 12c0 10 5 18 12 18s12-8 12-18H20z"/>
                <path fill="#ffffff" opacity="0.6" d="M23 18c0 6 3 10 9 10s9-4 9-10H23z"/>
                <rect x="30.5" y="30" width="3" height="22" fill="currentColor"/>
                <ellipse cx="32" cy="54" rx="12" ry="3" fill="currentColor"/>
            `
        },
        {
            id: 'beer_mug',
            name: 'Choppe de Bière Mousseuse',
            category: 'cafe_bar',
            tags: ['biere', 'mousse', 'bar', 'choppe', 'frais'],
            defaultW: 26,
            defaultH: 28,
            defaultColor: '#c8a96a',
            viewBox: '0 0 64 64',
            svg: `
                <rect x="18" y="24" width="24" height="30" rx="3" fill="currentColor"/>
                <path fill="currentColor" d="M42 28h6c3 0 5 2 5 5v12c0 3-2 5-5 5h-6v-4h6c1 0 2-1 2-2V34c0-1-1-2-2-2h-6v-4z"/>
                <path fill="#ffffff" d="M16 22c-2 0-4-2-4-4s2-4 4-4 4 1 5 3c1-2 3-3 5-3s4 2 5 4c1-2 3-3 5-3s4 2 5 4c2 0 4 2 4 4s-2 4-4 4H16z"/>
                <line x1="24" y1="28" x2="24" y2="48" stroke="#ffffff" stroke-width="2" opacity="0.4"/>
                <line x1="30" y1="28" x2="30" y2="48" stroke="#ffffff" stroke-width="2" opacity="0.4"/>
                <line x1="36" y1="28" x2="36" y2="48" stroke="#ffffff" stroke-width="2" opacity="0.4"/>
            `
        },

        // ==========================================
        // 3. BRUNCH, PÂTISSERIE & DOUCEURS
        // ==========================================
        {
            id: 'french_croissant',
            name: 'Croissant Doré Parisien',
            category: 'brunch_dessert',
            tags: ['croissant', 'viennoiserie', 'petit dejeuner', 'boulangerie', 'brunch'],
            defaultW: 28,
            defaultH: 22,
            defaultColor: '#c8a96a',
            viewBox: '0 0 64 64',
            svg: `
                <path fill="currentColor" d="M32 16c-9 0-18 6-22 15-2 4-1 9 3 11 3 2 7 1 9-2 2-3 5-6 10-6s8 3 10 6c2 3 6 4 9 2 4-2 5-7 3-11-4-9-13-15-22-15z"/>
                <path fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" d="M26 21c-2 4-2 9 0 13M32 19c0 5 0 11 0 16M38 21c2 4 2 9 0 13"/>
            `
        },
        {
            id: 'pancakes_stack',
            name: 'Pancakes Sirop & Myrtilles',
            category: 'brunch_dessert',
            tags: ['pancake', 'sirop', 'crepe', 'brunch', 'dejeuner', 'sucre'],
            defaultW: 28,
            defaultH: 26,
            defaultColor: '#c8a96a',
            viewBox: '0 0 64 64',
            svg: `
                <ellipse cx="32" cy="46" rx="22" ry="7" fill="currentColor"/>
                <ellipse cx="32" cy="38" rx="20" ry="6.5" fill="currentColor"/>
                <ellipse cx="32" cy="30" rx="18" ry="6" fill="currentColor"/>
                <path fill="#ffffff" opacity="0.8" d="M26 22h12v4c0 3-3 4-6 4s-6-1-6-4v-4z"/>
                <circle cx="30" cy="20" r="2.5" fill="currentColor"/>
                <circle cx="36" cy="19" r="2" fill="currentColor"/>
                <path fill="none" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" d="M30 30c0 4 3 6 3 10"/>
            `
        },
        {
            id: 'waffle_belgian',
            name: 'Gaufre Belge Alvéolée',
            category: 'brunch_dessert',
            tags: ['gaufre', 'sucre', 'chocolat', 'brunch', 'dessert'],
            defaultW: 26,
            defaultH: 26,
            defaultColor: '#c8a96a',
            viewBox: '0 0 64 64',
            svg: `
                <rect x="12" y="12" width="40" height="40" rx="5" fill="currentColor"/>
                <rect x="18" y="18" width="8" height="8" rx="1.5" fill="#ffffff" opacity="0.8"/>
                <rect x="30" y="18" width="8" height="8" rx="1.5" fill="#ffffff" opacity="0.8"/>
                <rect x="42" y="18" width="8" height="8" rx="1.5" fill="#ffffff" opacity="0.8"/>
                <rect x="18" y="30" width="8" height="8" rx="1.5" fill="#ffffff" opacity="0.8"/>
                <rect x="30" y="30" width="8" height="8" rx="1.5" fill="#ffffff" opacity="0.8"/>
                <rect x="42" y="30" width="8" height="8" rx="1.5" fill="#ffffff" opacity="0.8"/>
                <rect x="18" y="42" width="8" height="8" rx="1.5" fill="#ffffff" opacity="0.8"/>
                <rect x="30" y="42" width="8" height="8" rx="1.5" fill="#ffffff" opacity="0.8"/>
                <rect x="42" y="42" width="8" height="8" rx="1.5" fill="#ffffff" opacity="0.8"/>
            `
        },
        {
            id: 'cupcake_cherry',
            name: 'Cupcake Crème & Cerise',
            category: 'brunch_dessert',
            tags: ['cupcake', 'patisserie', 'gateau', 'sucre', 'cerise'],
            defaultW: 24,
            defaultH: 28,
            defaultColor: '#c8a96a',
            viewBox: '0 0 64 64',
            svg: `
                <path fill="currentColor" d="M18 36l4 20h20l4-20H18z"/>
                <path fill="#ffffff" opacity="0.9" d="M14 36c-2 0-3-2-3-4 0-6 7-12 21-12s21 6 21 12c0 2-1 4-3 4H14z"/>
                <circle cx="32" cy="16" r="3.5" fill="currentColor"/>
                <path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M34 14c4-4 8-3 10-6"/>
                <line x1="25" y1="38" x2="27" y2="52" stroke="#ffffff" stroke-width="1.5" opacity="0.4"/>
                <line x1="32" y1="38" x2="32" y2="52" stroke="#ffffff" stroke-width="1.5" opacity="0.4"/>
                <line x1="39" y1="38" x2="37" y2="52" stroke="#ffffff" stroke-width="1.5" opacity="0.4"/>
            `
        },
        {
            id: 'ice_cream_cone',
            name: 'Cône Glace Italienne',
            category: 'brunch_dessert',
            tags: ['glace', 'cornet', 'cone', 'italienne', 'dessert'],
            defaultW: 22,
            defaultH: 30,
            defaultColor: '#c8a96a',
            viewBox: '0 0 64 64',
            svg: `
                <path fill="currentColor" d="M22 36l10 24 10-24H22z"/>
                <path fill="#ffffff" opacity="0.9" d="M20 36c-2 0-4-2-4-4 0-4 3-7 6-7 1-4 5-7 10-7s9 3 10 7c3 0 6 3 6 7 0 2-2 4-4 4H20z"/>
                <circle cx="32" cy="14" r="3" fill="currentColor"/>
                <line x1="25" y1="40" x2="38" y2="54" stroke="#ffffff" stroke-width="1.2" opacity="0.5"/>
                <line x1="39" y1="40" x2="26" y2="54" stroke="#ffffff" stroke-width="1.2" opacity="0.5"/>
            `
        },

        // ==========================================
        // 4. SÉPARATEURS & ORNEMENTS (STYLE CANVA PRESTIGE)
        // ==========================================
        {
            id: 'divider_baroque_royal',
            name: 'Séparateur Baroque Royal',
            category: 'ornements',
            tags: ['separateur', 'baroque', 'ligne', 'royal', 'luxe', 'ornement'],
            defaultW: 60,
            defaultH: 8,
            defaultColor: '#c8a96a',
            viewBox: '0 0 160 24',
            svg: `
                <path fill="currentColor" d="M80 6l4 6-4 6-4-6 4-6zm-12 6c-8-6-18-6-28-2s-16 1-22-2l-1 2c7 4 13 3 23-1 10-4 18-3 26 2l2-3zm24 0c8-6 18-6 28-2s16 1 22-2l1 2c-7 4-13 3-23-1-10-4-18-3-26 2l-2-3z"/>
                <circle cx="80" cy="12" r="1.5" fill="#ffffff"/>
                <circle cx="60" cy="12" r="1.5" fill="currentColor"/>
                <circle cx="100" cy="12" r="1.5" fill="currentColor"/>
                <circle cx="35" cy="12" r="1" fill="currentColor"/>
                <circle cx="125" cy="12" r="1" fill="currentColor"/>
            `
        },
        {
            id: 'divider_diamond_line',
            name: 'Filet avec Losanges & Perles',
            category: 'ornements',
            tags: ['separateur', 'losange', 'perle', 'filet', 'ligne', 'bistro'],
            defaultW: 55,
            defaultH: 6,
            defaultColor: '#c8a96a',
            viewBox: '0 0 140 16',
            svg: `
                <line x1="6" y1="8" x2="52" y2="8" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
                <path fill="currentColor" d="M70 2l6 6-6 6-6-6 6-6zm-12 6l3 3-3 3-3-3 3-3zm24 0l3 3-3 3-3-3 3-3z"/>
                <line x1="88" y1="8" x2="134" y2="8" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
            `
        },
        {
            id: 'divider_star_flourish',
            name: 'Étoile Centrale & Arabesques',
            category: 'ornements',
            tags: ['separateur', 'etoile', 'arabesque', 'chic', 'menu'],
            defaultW: 50,
            defaultH: 8,
            defaultColor: '#c8a96a',
            viewBox: '0 0 120 20',
            svg: `
                <path fill="currentColor" d="M60 4l2.5 5 5.5 1-4 4 1 5.5-5-3-5 3 1-5.5-4-4 5.5-1z"/>
                <path fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" d="M10 10c12 0 22-4 38 0M110 10c-12 0-22-4-38 0"/>
                <circle cx="48" cy="10" r="1.5" fill="currentColor"/>
                <circle cx="72" cy="10" r="1.5" fill="currentColor"/>
            `
        },
        {
            id: 'corner_flourish_vintage',
            name: 'Coin Décoratif Vintage',
            category: 'ornements',
            tags: ['coin', 'angle', 'cadre', 'vintage', 'arabesque'],
            defaultW: 24,
            defaultH: 24,
            defaultColor: '#c8a96a',
            viewBox: '0 0 48 48',
            svg: `
                <path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M6 42V12c0-3.3 2.7-6 6-6h30"/>
                <path fill="currentColor" d="M12 6c3 3 3 8 0 11-3-3-3-8 0-11zm0 0c3 3 8 3 11 0-3-3-8-3-11 0z"/>
                <circle cx="28" cy="6" r="2" fill="currentColor"/>
                <circle cx="6" cy="28" r="2" fill="currentColor"/>
            `
        },
        {
            id: 'crown_laurel_wreath',
            name: 'Couronne de Lauriers Gourmet',
            category: 'ornements',
            tags: ['lauriers', 'couronne', 'or', 'gagnant', 'prestige'],
            defaultW: 30,
            defaultH: 26,
            defaultColor: '#c8a96a',
            viewBox: '0 0 64 64',
            svg: `
                <path fill="currentColor" d="M32 50c-10 0-18-8-18-18 0-6 3-12 8-16l2 2c-4 3-7 8-7 14 0 8 7 15 15 15s15-7 15-15c0-6-3-11-7-14l2-2c5 4 8 10 8 16 0 10-8 18-18 18z"/>
                <ellipse cx="18" cy="20" rx="3" ry="5" fill="currentColor" transform="rotate(-30 18 20)"/>
                <ellipse cx="14" cy="30" rx="3" ry="5" fill="currentColor" transform="rotate(-60 14 30)"/>
                <ellipse cx="46" cy="20" rx="3" ry="5" fill="currentColor" transform="rotate(30 46 20)"/>
                <ellipse cx="50" cy="30" rx="3" ry="5" fill="currentColor" transform="rotate(60 50 30)"/>
                <circle cx="32" cy="18" r="2.5" fill="currentColor"/>
            `
        },
        {
            id: 'magic_sparkles',
            name: 'Étoiles Scintillantes (Sparkles)',
            category: 'ornements',
            tags: ['etoiles', 'sparkles', 'magie', 'brillant', 'effet', 'luxe'],
            defaultW: 24,
            defaultH: 24,
            defaultColor: '#c8a96a',
            viewBox: '0 0 48 48',
            svg: `
                <path fill="currentColor" d="M24 4c0 10-6 16-16 16 10 0 16 6 16 16 0-10 6-16 16-16-10 0-16-6-16-16z"/>
                <path fill="currentColor" d="M38 28c0 4-3 7-7 7 4 0 7 3 7 7 0-4 3-7 7-7-4 0-7-3-7-7z"/>
                <circle cx="12" cy="38" r="2" fill="currentColor"/>
            `
        },

        // ==========================================
        // 5. SCEAUX, BADGES & RUBANS
        // ==========================================
        {
            id: 'badge_100_homemade',
            name: 'Sceau 100% Fait Maison',
            category: 'sceaux_badges',
            tags: ['fait maison', '100%', 'qualite', 'sceau', 'tampon', 'artisanal'],
            defaultW: 30,
            defaultH: 30,
            defaultColor: '#c8a96a',
            viewBox: '0 0 72 72',
            svg: `
                <circle cx="36" cy="36" r="33" fill="none" stroke="currentColor" stroke-width="2.5"/>
                <circle cx="36" cy="36" r="28" fill="none" stroke="currentColor" stroke-width="1.2" stroke-dasharray="3 2"/>
                <text x="36" y="27" font-family="'Montserrat', sans-serif" font-size="7" font-weight="900" text-anchor="middle" fill="currentColor" letter-spacing="1">100%</text>
                <text x="36" y="38" font-family="'Cinzel', serif" font-size="6" font-weight="700" text-anchor="middle" fill="currentColor" letter-spacing="1.5">FAIT MAISON</text>
                <path fill="currentColor" d="M36 43l1.5 3 3.5.5-2.5 2.5.6 3.5-3.1-1.6-3.1 1.6.6-3.5-2.5-2.5 3.5-.5z"/>
            `
        },
        {
            id: 'ribbon_banner_vintage',
            name: 'Ruban Bannière Vintage',
            category: 'sceaux_badges',
            tags: ['ruban', 'banniere', 'special', 'promo', 'titre', 'vintage'],
            defaultW: 55,
            defaultH: 18,
            defaultColor: '#c8a96a',
            viewBox: '0 0 120 40',
            svg: `
                <path fill="currentColor" d="M20 10h80v20H20z"/>
                <path fill="#ffffff" opacity="0.3" d="M20 12h80v2H20zM20 26h80v2H20z"/>
                <path fill="currentColor" d="M20 10L6 18l14 8V10zm80 0l14 8-14 8V10z" opacity="0.85"/>
                <polygon points="20,30 20,36 14,30" fill="currentColor" opacity="0.6"/>
                <polygon points="100,30 100,36 106,30" fill="currentColor" opacity="0.6"/>
            `
        },
        {
            id: 'badge_star_quality',
            name: 'Écusson Qualité 5 Étoiles',
            category: 'sceaux_badges',
            tags: ['etoiles', '5 etoiles', 'qualite', 'selection', 'chef'],
            defaultW: 28,
            defaultH: 32,
            defaultColor: '#c8a96a',
            viewBox: '0 0 64 72',
            svg: `
                <path fill="currentColor" d="M32 4l24 10v22c0 16-10 26-24 32C18 62 8 52 8 36V14L32 4z"/>
                <path fill="#ffffff" opacity="0.2" d="M32 8l20 8v20c0 13-8 22-20 27-12-5-20-14-20-27V16L32 8z"/>
                <g fill="#ffffff">
                    <polygon points="32,24 34,29 39,29 35,32 37,37 32,34 27,37 29,32 25,29 30,29"/>
                    <polygon points="22,34 23.5,37.5 27,37.5 24,40 25.5,43.5 22,41.5 18.5,43.5 20,40 17,37.5 20.5,37.5" transform="scale(0.8) translate(3, 4)"/>
                    <polygon points="42,34 43.5,37.5 47,37.5 44,40 45.5,43.5 42,41.5 38.5,43.5 40,40 37,37.5 40.5,37.5" transform="scale(0.8) translate(11, 4)"/>
                </g>
            `
        },
        {
            id: 'stamp_fresh_organic',
            name: 'Tampon Produits Frais & Terroir',
            category: 'sceaux_badges',
            tags: ['bio', 'frais', 'terroir', 'nature', 'tampon'],
            defaultW: 28,
            defaultH: 28,
            defaultColor: '#059669',
            viewBox: '0 0 64 64',
            svg: `
                <circle cx="32" cy="32" r="30" fill="none" stroke="currentColor" stroke-width="2.5" stroke-dasharray="6 3"/>
                <circle cx="32" cy="32" r="23" fill="none" stroke="currentColor" stroke-width="1.5"/>
                <path fill="currentColor" d="M32 18c0 8-6 14-14 14 0-8 6-14 14-14zm0 0c0 8 6 14 14 14 0-8-6-14-14-14z"/>
                <text x="32" y="46" font-family="'Montserrat', sans-serif" font-size="6" font-weight="800" text-anchor="middle" fill="currentColor">100% FRAIS</text>
            `
        },

        // ==========================================
        // 6. SYMBOLES, CITATIONS & FLÈCHES
        // ==========================================
        {
            id: 'quote_marks_gourmet',
            name: 'Guillemets Citations Chef',
            category: 'elements',
            tags: ['citation', 'texte', 'guillemets', 'parole', 'prose'],
            defaultW: 22,
            defaultH: 16,
            defaultColor: '#c8a96a',
            viewBox: '0 0 48 36',
            svg: `
                <path fill="currentColor" d="M8 24c0-7 4-12 10-14l2 3c-4 1-6 4-6 7h6v12H8V24zm18 0c0-7 4-12 10-14l2 3c-4 1-6 4-6 7h6v12H26V24z"/>
            `
        },
        {
            id: 'arrow_vintage_right',
            name: 'Flèche Décorative Droite',
            category: 'elements',
            tags: ['fleche', 'direction', 'pointer', 'bistro'],
            defaultW: 36,
            defaultH: 12,
            defaultColor: '#c8a96a',
            viewBox: '0 0 80 24',
            svg: `
                <path fill="currentColor" d="M6 11h60v2H6zm56-7l12 8-12 8v-5H58v-6h4V4z"/>
                <circle cx="6" cy="12" r="3" fill="currentColor"/>
            `
        },
        {
            id: 'heart_bistro',
            name: 'Cœur Coup de Cœur du Chef',
            category: 'elements',
            tags: ['coeur', 'favori', 'specialite', 'coup de coeur'],
            defaultW: 20,
            defaultH: 20,
            defaultColor: '#e11d48',
            viewBox: '0 0 48 48',
            svg: `
                <path fill="currentColor" d="M24 40s-16-10-16-20c0-6 4.5-10 10-10 4 0 7 2 9 5 2-3 5-5 9-5 5.5 0 10 4 10 10 0 10-16 20-16 20z"/>
            `
        }
    ],

    getAll() {
        return this.items;
    },

    getById(id) {
        return this.items.find(item => item.id === id) || null;
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

    /**
     * Produces clean inline SVG string with custom colors, dimensions and transforms
     */
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

if (typeof window !== 'undefined') {
    window.CanvaIllustrationsPack = CanvaIllustrationsPack;
}
