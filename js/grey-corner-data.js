/**
 * ============================================================================
 * BASE DE DONNÉES OFFICIELLE : GREY CORNER CAFÉ (FÈS) — MENU 2026
 * Contient l'intégralité des catégories, plats, descriptions, prix (DH) et badges
 * extraits du PDF officiel Grey Corner Café (Since 2024 - @GREYCORNERFES).
 * ============================================================================
 */
const GREY_CORNER_BRAND = {
    title: 'GREY CORNER',
    subtitle: 'café • SINCE 2024 • @GREYCORNERFES',
    footerNote: 'Tous les prix affichés sont en dirhams (DH) — GREY CORNER CAFÉ (Fès)'
};

const GREY_CORNER_DEFAULT_DB = [
    // 1. PETIT DÉJEUNER
    { id: 'PDJ01', category: 'PETIT DÉJEUNER', name: 'Light', desc: 'Pain complet grillé, jben, huile d’olive, amlou, olives noires, jus d’orange, boisson chaude au choix, dessert et eau minérale', price: '42 DH', badge: '' },
    { id: 'PDJ02', category: 'PETIT DÉJEUNER', name: 'Express', desc: 'Panier de quatre viennoiseries, jus d’orange, boisson chaude au choix, dessert et eau minérale', price: '44 DH', badge: '' },
    { id: 'PDJ03', category: 'PETIT DÉJEUNER', name: 'Beldi', desc: 'Deux mlaoui, deux harcha, un baghrir, jben, huile d’olive, miel, olives noires, jus d’orange, boisson chaude au choix, dessert et eau minérale', price: '45 DH', badge: '' },
    { id: 'PDJ04', category: 'PETIT DÉJEUNER', name: 'Hollandais', desc: 'Pain de mie complet avec deux œufs au plat, fromage, dinde fumée, mesclun salade, jus d’orange, boisson chaude au choix, dessert et eau minérale', price: '52 DH', badge: '' },
    { id: 'PDJ05', category: 'PETIT DÉJEUNER', name: 'Campagnard', desc: '3 œufs brouillés, 3 charcuteries, 2 pancakes chocolat, pain seigle, huile d’olive, jben, mesclun salade, jus d’orange, boisson chaude au choix, dessert et eau minérale', price: '52 DH', badge: 'NOUVEAU' },
    { id: 'PDJ06', category: 'PETIT DÉJEUNER', name: 'Omelette Nature (supp œufs beldi 05 DH)', desc: 'Omelette 3 œufs, mesclun salade, jus d’orange, boisson chaude au choix, dessert et eau minérale', price: '42 DH', badge: '' },
    { id: 'PDJ07', category: 'PETIT DÉJEUNER', name: 'Omelette Végétarienne (supp œufs beldi 05 DH)', desc: 'Omelette 3 œufs, légumes, mesclun salade, jus d’orange, boisson chaude au choix, dessert et eau minérale', price: '52 DH', badge: '' },
    { id: 'PDJ08', category: 'PETIT DÉJEUNER', name: 'Omelette Fromage (supp œufs beldi 05 DH)', desc: 'Omelette 3 œufs, fromage, mesclun salade, jus d’orange, boisson chaude au choix, dessert et eau minérale', price: '52 DH', badge: '' },
    { id: 'PDJ09', category: 'PETIT DÉJEUNER', name: 'Omelette Continentale (supp œufs beldi 05 DH)', desc: 'Omelette 3 œufs, charcuterie, fromage, mesclun salade, jus d’orange, boisson chaude au choix, dessert et eau minérale (huile d’olive et olives noires)', price: '52 DH', badge: '' },
    { id: 'PDJ10', category: 'PETIT DÉJEUNER', name: 'Omelette du Chef (supp œufs beldi 05 DH)', desc: 'Omelette 3 œufs, champignons, épinards, fromage, mesclun salade, jus d’orange, boisson chaude au choix, dessert et eau minérale (huile d’olive et olives noires)', price: '58 DH', badge: 'CHEF' },
    { id: 'PDJ11', category: 'PETIT DÉJEUNER', name: 'Berbère', desc: 'Baghrir, amlou, fruits secs, jben, miel, banane, jus d’orange, boisson chaude au choix, dessert et eau minérale', price: '54 DH', badge: '' },
    { id: 'PDJ12', category: 'PETIT DÉJEUNER', name: 'Fassi (supp œufs beldi 05 DH)', desc: 'Khlie, trois œufs au plat, jus d’orange, boisson chaude au choix, dessert et eau minérale (huile d’olive et olives noires)', price: '55 DH', badge: '' },
    { id: 'PDJ13', category: 'PETIT DÉJEUNER', name: 'Espagnol', desc: 'Tortilla, croquettes, tapenade, thon, tomates fraîches, 2 fromages, pain seigle et mesclun salade, jus d’orange, boisson chaude au choix, dessert et eau minérale', price: '64 DH', badge: '' },
    { id: 'PDJ14', category: 'PETIT DÉJEUNER', name: 'Mquila Merguez', desc: 'Merguez, poivrons, oignons, tomates cerises, deux œufs, jus d’orange, boisson chaude au choix, dessert et eau minérale', price: '64 DH', badge: '' },
    { id: 'PDJ15', category: 'PETIT DÉJEUNER', name: 'American', desc: 'Bacon, 2 œufs au plat, avocat, fromage, pain céréales, jus d’orange, boisson chaude au choix, dessert et eau minérale', price: '68 DH', badge: 'NOUVEAU' },
    { id: 'PDJ16', category: 'PETIT DÉJEUNER', name: 'Norvégien', desc: 'Saumon, avocat, fromage, pain céréales, jus d’orange, boisson chaude au choix, dessert et eau minérale', price: '68 DH', badge: '' },
    { id: 'PDJ17', category: 'PETIT DÉJEUNER', name: 'Mquila Fruits de Mer', desc: 'Crevettes, calamars, moules, oignons, deux œufs, jus d’orange, boisson chaude au choix, dessert et eau minérale', price: '78 DH', badge: 'NOUVEAU' },

    // 2. BRUNCH & MENU ENFANT (MATIN)
    { id: 'BRU01', category: 'BRUNCH & MENU ENFANT', name: 'Brunch GreyCorner', desc: 'Saucisses, omelette, fromage, toast hollandais, croquettes fromage, charcuteries, pain seigle, mesclun salade, gaufre, pancake, jus d’orange, boisson chaude au choix, dessert et eau minérale', price: '85 DH', badge: 'CHEF' },
    { id: 'BRU02', category: 'BRUNCH & MENU ENFANT', name: 'Brunch Duo', desc: 'Poulet pané, croquettes, croque-maison, omelette au fromage, charcuterie, fromage, pain seigle, beldi (2 mlaoui, 2 harcha), mesclun salade, muffin, gaufre, 2 jus d’orange, 2 boissons chaudes au choix, 2 desserts et 2 eaux minérales', price: '144 DH', badge: '' },
    { id: 'BRU03', category: 'BRUNCH & MENU ENFANT', name: 'Menu Enfant (Kids)', desc: 'Toast au fromage ou Crêpe Nutella, ou gaufre, ou pancake + cornflakes, Lait au chocolat', price: '40 DH', badge: '' },

    // 3. BOISSONS CHAUDES
    { id: 'BCH01', category: 'BOISSONS CHAUDES', name: 'Café Noir', desc: 'Servi avec une eau minérale 33 cl', price: '16 DH', badge: '' },
    { id: 'BCH02', category: 'BOISSONS CHAUDES', name: 'Café Américain', desc: 'Servi avec une eau minérale 33 cl', price: '18 DH', badge: '' },
    { id: 'BCH03', category: 'BOISSONS CHAUDES', name: 'Café Nespresso', desc: 'Servi avec une eau minérale 33 cl', price: '22 DH', badge: '' },
    { id: 'BCH04', category: 'BOISSONS CHAUDES', name: 'Café au Lait', desc: 'Servi avec une eau minérale 33 cl', price: '19 DH', badge: '' },
    { id: 'BCH05', category: 'BOISSONS CHAUDES', name: 'Café Latte', desc: 'Servi avec une eau minérale 33 cl', price: '19 DH', badge: '' },
    { id: 'BCH06', category: 'BOISSONS CHAUDES', name: 'Cappuccino Italien', desc: 'Servi avec une eau minérale 33 cl', price: '19 DH', badge: '' },
    { id: 'BCH07', category: 'BOISSONS CHAUDES', name: 'Cappuccino avec Chantilly', desc: 'Servi avec une eau minérale 33 cl', price: '22 DH', badge: '' },
    { id: 'BCH08', category: 'BOISSONS CHAUDES', name: 'Chocolat au Lait', desc: 'Servi avec une eau minérale 33 cl', price: '18 DH', badge: '' },
    { id: 'BCH09', category: 'BOISSONS CHAUDES', name: 'Chocolat avec Chantilly', desc: 'Servi avec une eau minérale 33 cl', price: '22 DH', badge: '' },
    { id: 'BCH10', category: 'BOISSONS CHAUDES', name: 'Chocolat Fondue', desc: 'Servi avec une eau minérale 33 cl', price: '26 DH', badge: '' },
    { id: 'BCH11', category: 'BOISSONS CHAUDES', name: 'Lait Froid / Chaud', desc: 'Servi avec une eau minérale 33 cl', price: '12 DH', badge: '' },
    { id: 'BCH12', category: 'BOISSONS CHAUDES', name: 'Thé à la Menthe', desc: 'Servi avec une eau minérale 33 cl', price: '16 DH', badge: '' },
    { id: 'BCH13', category: 'BOISSONS CHAUDES', name: 'Thé Noir', desc: 'Servi avec une eau minérale 33 cl', price: '15 DH', badge: '' },
    { id: 'BCH14', category: 'BOISSONS CHAUDES', name: 'Thé Noir au Lait', desc: 'Servi avec une eau minérale 33 cl', price: '18 DH', badge: '' },
    { id: 'BCH15', category: 'BOISSONS CHAUDES', name: 'Thé Infusion', desc: 'Servi avec une eau minérale 33 cl', price: '18 DH', badge: '' },
    { id: 'BCH16', category: 'BOISSONS CHAUDES', name: 'Verveine', desc: 'Servie avec une eau minérale 33 cl', price: '15 DH', badge: '' },
    { id: 'BCH17', category: 'BOISSONS CHAUDES', name: 'Verveine Aromatisée', desc: 'Servie avec une eau minérale 33 cl', price: '18 DH', badge: '' },

    // 4. SODAS & EAUX MINÉRALES
    { id: 'SOD01', category: 'SODAS & EAUX', name: 'Coca-Cola / Coca-Cola Zéro', desc: '', price: '17 DH', badge: '' },
    { id: 'SOD02', category: 'SODAS & EAUX', name: 'Sprite / Hawaï / Poms / Orangina', desc: '', price: '17 DH', badge: '' },
    { id: 'SOD03', category: 'SODAS & EAUX', name: 'Schweppes Citron / Tonic', desc: '', price: '17 DH', badge: '' },
    { id: 'SOD04', category: 'SODAS & EAUX', name: 'Red Bull', desc: '', price: '28 DH', badge: '' },
    { id: 'SOD05', category: 'SODAS & EAUX', name: 'Eau Minérale 0,5 L', desc: '', price: '12 DH', badge: '' },
    { id: 'SOD06', category: 'SODAS & EAUX', name: 'Eau Minérale 0,75 L', desc: '', price: '22 DH', badge: '' },
    { id: 'SOD07', category: 'SODAS & EAUX', name: 'Oulmès 0,33 L / 0,75 L', desc: '16 DH (0,33 L) / 26 DH (0,75 L)', price: '16 DH', badge: '' },

    // 5. BOISSONS FRAÎCHES
    { id: 'BFR01', category: 'BOISSONS FRAÎCHES', name: 'Jus d’Orange', desc: '100% naturel pressé minute', price: '22 DH', badge: '' },
    { id: 'BFR02', category: 'BOISSONS FRAÎCHES', name: 'Jus de Citron / Jus de Carotte', desc: '100% naturel', price: '25 DH', badge: '' },
    { id: 'BFR03', category: 'BOISSONS FRAÎCHES', name: 'Jus de Pomme / Jus de Banane', desc: '100% naturel', price: '28 DH', badge: '' },
    { id: 'BFR04', category: 'BOISSONS FRAÎCHES', name: 'Jus de Mangue / Pêche / Fraise', desc: '100% naturel', price: '30 DH', badge: '' },
    { id: 'BFR05', category: 'BOISSONS FRAÎCHES', name: 'Jus d’Avocat / Jus d’Ananas', desc: '100% naturel', price: '32 DH', badge: '' },
    { id: 'BFR06', category: 'BOISSONS FRAÎCHES', name: 'Jus de Framboise', desc: '100% naturel', price: '35 DH', badge: '' },
    { id: 'BFR07', category: 'BOISSONS FRAÎCHES', name: 'Jus de Fruits Secs Avocat', desc: '', price: '38 DH', badge: '' },
    { id: 'BFR08', category: 'BOISSONS FRAÎCHES', name: 'Panaché au Lait', desc: '', price: '38 DH', badge: '' },
    { id: 'BFR09', category: 'BOISSONS FRAÎCHES', name: 'Cocktail Orange', desc: '', price: '42 DH', badge: '' },
    { id: 'BFR10', category: 'BOISSONS FRAÎCHES', name: 'Za3 Za3', desc: 'Avocat, fruits secs, garniture gourmande', price: '46 DH', badge: 'CHEF' },

    // 6. ICE TEA, ICE COFFEE, FRAPPUCCINO & COCKTAILS
    { id: 'ICE01', category: 'ICE TEA & FRAPPUCCINO', name: 'Ice Tea (Citron, Pêche ou Framboise)', desc: '', price: '28 DH', badge: '' },
    { id: 'ICE02', category: 'ICE TEA & FRAPPUCCINO', name: 'Ice Coffee Glacé Classique', desc: '', price: '20 DH', badge: '' },
    { id: 'ICE03', category: 'ICE TEA & FRAPPUCCINO', name: 'Ice Coffee Glacé Aromatisé', desc: '', price: '23 DH', badge: '' },
    { id: 'ICE04', category: 'ICE TEA & FRAPPUCCINO', name: 'Frappuccino Classique', desc: '', price: '25 DH', badge: '' },
    { id: 'ICE05', category: 'ICE TEA & FRAPPUCCINO', name: 'Frappuccino Aromatisé', desc: '', price: '28 DH', badge: '' },

    { id: 'COC01', category: 'COCKTAILS & MOJITOS', name: 'Cocktail Gingembre', desc: 'Gingembre, citron, miel', price: '32 DH', badge: '' },
    { id: 'COC02', category: 'COCKTAILS & MOJITOS', name: 'San Francisco', desc: 'Gingembre, bissap, orange, citron', price: '34 DH', badge: '' },
    { id: 'COC03', category: 'COCKTAILS & MOJITOS', name: 'Fraîcheur', desc: 'Ananas, poire, citron, menthe', price: '42 DH', badge: '' },
    { id: 'COC04', category: 'COCKTAILS & MOJITOS', name: 'Tropical', desc: 'Mangue, banane, orange, bissap', price: '42 DH', badge: '' },
    { id: 'COC05', category: 'COCKTAILS & MOJITOS', name: 'Piña Colada', desc: 'Ananas, noix de coco, sirop curaçao', price: '42 DH', badge: '' },
    { id: 'COC06', category: 'COCKTAILS & MOJITOS', name: 'Cocktail Grey Corner', desc: 'Ananas, avocat, fruits de saison, sirop fruits de la passion', price: '48 DH', badge: 'CHEF' },
    { id: 'COC07', category: 'COCKTAILS & MOJITOS', name: 'Mojito Citron', desc: '', price: '34 DH', badge: '' },
    { id: 'COC08', category: 'COCKTAILS & MOJITOS', name: 'Mojito Tropical', desc: '', price: '38 DH', badge: '' },
    { id: 'COC09', category: 'COCKTAILS & MOJITOS', name: 'Mojito Red Bull', desc: '', price: '44 DH', badge: '' },

    // 7. SMOOTHIES & SMOOTHIE-BOWLS
    { id: 'SMO01', category: 'SMOOTHIES & BOWLS', name: 'Énergétique', desc: 'Banane, ananas, mangue', price: '42 DH', badge: '' },
    { id: 'SMO02', category: 'SMOOTHIES & BOWLS', name: 'Multi-Vitamines', desc: 'Orange, pêche, carotte', price: '42 DH', badge: '' },
    { id: 'SMO03', category: 'SMOOTHIES & BOWLS', name: 'Hawaïen', desc: 'Fraise, ananas, kiwi, avocat, menthe', price: '42 DH', badge: '' },
    { id: 'SMO04', category: 'SMOOTHIES & BOWLS', name: 'Jelly Almond', desc: 'Banane, amlou, framboise, myrtille', price: '48 DH', badge: '' },
    { id: 'SMO05', category: 'SMOOTHIES & BOWLS', name: 'Pink Smoothie', desc: 'Framboise, orange, fraise', price: '48 DH', badge: '' },
    { id: 'SMO06', category: 'SMOOTHIES & BOWLS', name: 'Triple Berry', desc: 'Myrtille, framboise, fraise', price: '48 DH', badge: '' },
    { id: 'SMO07', category: 'SMOOTHIES & BOWLS', name: 'Smoothie-Bowl Ultra-Vitamines', desc: 'Mangue, avocat, banane, fraise, orange, fruits secs', price: '48 DH', badge: '' },
    { id: 'SMO08', category: 'SMOOTHIES & BOWLS', name: 'Smoothie-Bowl Exotique', desc: 'Ananas, pêche, mangue, banane, orange', price: '48 DH', badge: '' },

    // 8. MILKSHAKES, ORANGESHAKES & GLACES
    { id: 'MLK01', category: 'MILKSHAKES & GLACES', name: 'Milkshakes (Fraise, Caramel, Chocolat, Vanille, Cookies, KitKat, Nutella)', desc: 'Supplément Chantilly +05 DH', price: '42 DH', badge: '' },
    { id: 'MLK02', category: 'MILKSHAKES & GLACES', name: 'OrangeShake Vanille', desc: '', price: '38 DH', badge: '' },
    { id: 'MLK03', category: 'MILKSHAKES & GLACES', name: 'OrangeShakes (Fraise, Caramel, Chocolat, Oreo, Nougat)', desc: '', price: '42 DH', badge: '' },
    { id: 'MLK04', category: 'MILKSHAKES & GLACES', name: 'Coupe Enfant', desc: 'Oreo, bubble, chantilly', price: '40 DH', badge: '' },
    { id: 'MLK05', category: 'MILKSHAKES & GLACES', name: 'Coupe Amor', desc: 'Fraise, yaourt, vanille', price: '45 DH', badge: '' },
    { id: 'MLK06', category: 'MILKSHAKES & GLACES', name: 'Banana Split', desc: 'Vanille, chocolat, fraise', price: '50 DH', badge: '' },
    { id: 'MLK07', category: 'MILKSHAKES & GLACES', name: 'Coupe Grey Corner', desc: 'Vanille, nougat, yaourt fruits des bois, pistache', price: '65 DH', badge: 'CHEF' },
    { id: 'MLK08', category: 'MILKSHAKES & GLACES', name: 'Boules de Glace (1 Boule : 16 DH / 2 Boules : 30 DH)', desc: 'Parfums : Vanille, chocolat, nougat, bubble, yaourt, pistache, fraise, caramel', price: '16 DH', badge: '' },

    // 9. ENTRÉES FROIDES & CHAUDES
    { id: 'ENT01', category: 'ENTRÉES FROIDES & CHAUDES', name: 'Cercle Veggie', desc: 'Crudités du jour, thon, œuf de caille, salade mesclun', price: '48 DH', badge: '' },
    { id: 'ENT02', category: 'ENTRÉES FROIDES & CHAUDES', name: 'Russe', desc: 'Pomme de terre, carotte, poulet, thon, petits pois, œuf de caille', price: '54 DH', badge: '' },
    { id: 'ENT03', category: 'ENTRÉES FROIDES & CHAUDES', name: 'César', desc: 'Blanc de poulet, parmesan, tomates cerises, croûtons, laitue romaine, sauce césar', price: '65 DH', badge: '' },
    { id: 'ENT04', category: 'ENTRÉES FROIDES & CHAUDES', name: 'Quinoa', desc: 'Quinoa varié, gambas, brunoise, pomme, kiwi, mangue, ananas, menthe, sauce miel-moutarde, fromage feta', price: '68 DH', badge: '' },
    { id: 'ENT05', category: 'ENTRÉES FROIDES & CHAUDES', name: 'Terre Mer', desc: 'Calamars, gambas, poulet pané, laitue, maïs, tomates cerises, avocat, sauce du chef', price: '78 DH', badge: '' },
    { id: 'ENT06', category: 'ENTRÉES FROIDES & CHAUDES', name: 'Tartare Saumon', desc: 'Saumon frais, saumon fumé, avocat, sauce tartare', price: '88 DH', badge: 'NOUVEAU' },
    { id: 'ENT07', category: 'ENTRÉES FROIDES & CHAUDES', name: 'Burrata', desc: 'Burrata, tomates, noix, roquette, sauce pesto, vinaigre balsamique', price: '98 DH', badge: '' },
    { id: 'ENT08', category: 'ENTRÉES FROIDES & CHAUDES', name: 'Boulettes de Poulet au Fromage (Entrée Chaude)', desc: 'Blanc de poulet haché, cheddar', price: '52 DH', badge: 'NOUVEAU' },
    { id: 'ENT09', category: 'ENTRÉES FROIDES & CHAUDES', name: 'Croustillons Gambas (Entrée Chaude)', desc: 'Purée de pommes de terre, gambas panées au sésame blanc', price: '68 DH', badge: '' },
    { id: 'ENT10', category: 'ENTRÉES FROIDES & CHAUDES', name: 'Pil-Pil Espagnol (Entrée Chaude)', desc: 'Gambas, huile d’olive, piment fort, ciboulette, tomates cerises', price: '68 DH', badge: '' },

    // 10. PLATS PRINCIPAUX & COUSCOUS
    { id: 'PLT01', category: 'PLATS & COUSCOUS', name: 'Brochettes de Poulet Marinées', desc: 'Blanc de poulet sélectionné, marinade aromatique grillé sur broche, sauce barbecue (2 accompagnements au choix)', price: '84 DH', badge: '' },
    { id: 'PLT02', category: 'PLATS & COUSCOUS', name: 'Escalope à la Milanaise « Grey Corner »', desc: 'Escalope de poulet panée dorée, sauce veloutée aux champignons frais', price: '85 DH', badge: '' },
    { id: 'PLT03', category: 'PLATS & COUSCOUS', name: 'Émincé de Poulet à la Crème de Champignons', desc: 'Morceaux de poulet saisis, sauce onctueuse aux champignons de Paris frais', price: '88 DH', badge: '' },
    { id: 'PLT04', category: 'PLATS & COUSCOUS', name: 'Ballotine de Poulet au Cœur d’Épinards et Fromage', desc: 'Volaille hachée, cœur épinards et fromage affiné, sauce exclusive du Chef', price: '94 DH', badge: '' },
    { id: 'PLT05', category: 'PLATS & COUSCOUS', name: 'Suprême de Poulet à la Duxelles', desc: 'Suprême de poulet saisi, sauce veloutée à la crème, champignons frais, persil ciselé', price: '98 DH', badge: 'NOUVEAU' },
    { id: 'PLT06', category: 'PLATS & COUSCOUS', name: 'Le Filet de Bœuf Émincé', desc: 'Cœur de filet de bœuf, champignons de Paris frais, crème onctueuse, fines herbes', price: '115 DH', badge: '' },
    { id: 'PLT07', category: 'PLATS & COUSCOUS', name: 'Roulade de Bœuf aux Saveurs de l’Atlas', desc: 'Viande de bœuf hachée, farce épinards et fromages, sauce crème fraîche et champignons frais', price: '120 DH', badge: 'NOUVEAU' },
    { id: 'PLT08', category: 'PLATS & COUSCOUS', name: 'Filet de Bœuf aux Herbes de l’Atlas', desc: 'Cœur de filet de bœuf saisi, infusé aux herbes aromatiques de l’Atlas', price: '135 DH', badge: '' },
    { id: 'PLT09', category: 'PLATS & COUSCOUS', name: 'Pavé de Saumon à la Plancha', desc: 'Pavé de saumon saisi, sauce vierge maison aux petits légumes croquants et herbes fraîches', price: '145 DH', badge: 'CHEF' },
    { id: 'PLT10', category: 'PLATS & COUSCOUS', name: 'Couscous Poulet avec Petit Lait', desc: '', price: '54 DH', badge: '' },
    { id: 'PLT11', category: 'PLATS & COUSCOUS', name: 'Couscous Viande avec Petit Lait', desc: '', price: '64 DH', badge: '' },
    { id: 'PLT12', category: 'PLATS & COUSCOUS', name: 'Menu Enfant (Plats)', desc: 'Pasta nature ou Mini pizza (margarita, poulet, pepperoni, thon) + boisson OU Burger ou nuggets + frites + boisson', price: '58 DH', badge: '' },

    // 11. SANDWICHS CIABATTA & BURGERS
    { id: 'CIA01', category: 'SANDWICHS CIABATTA', name: 'Ciabatta Thon', desc: 'Thon, sauce burger, salade, tomate, cheddar', price: '48 DH', badge: '' },
    { id: 'CIA02', category: 'SANDWICHS CIABATTA', name: 'Ciabatta Poulet', desc: 'Blanc de poulet, cheddar, salade, tomate', price: '48 DH', badge: '' },
    { id: 'CIA03', category: 'SANDWICHS CIABATTA', name: 'Ciabatta Viande Hachée', desc: 'Viande hachée, tomate, salade, sauce spéciale, cheddar', price: '54 DH', badge: '' },
    { id: 'CIA04', category: 'SANDWICHS CIABATTA', name: 'Ciabatta Poulard', desc: 'Émincé de poulet, cheddar, champignons, sauce blanche', price: '54 DH', badge: 'NOUVEAU' },
    { id: 'CIA05', category: 'SANDWICHS CIABATTA', name: 'Ciabatta Poulet Crunchy', desc: 'Bâtonnets de poulet pané, cheddar, laitue', price: '58 DH', badge: '' },
    { id: 'CIA06', category: 'SANDWICHS CIABATTA', name: 'Sandwich Cheese Steak', desc: 'Steak grillé tendre, cheddar', price: '65 DH', badge: '' },
    { id: 'CIA07', category: 'SANDWICHS CIABATTA', name: 'Ciabatta Fruits de Mer', desc: 'Crevettes, calamars, sauce du chef, cheddar', price: '65 DH', badge: '' },

    { id: 'BRG01', category: 'BURGERS', name: 'Chicken Burger', desc: 'Poulet assaisonné, cheddar, laitue, tomate, oignon, cornichon, sauce biggy', price: '50 DH', badge: 'NOUVEAU' },
    { id: 'BRG02', category: 'BURGERS', name: 'Cheese Burger', desc: 'Viande hachée, cheddar, laitue, tomate, oignon caramélisé, cornichon, sauce burger', price: '54 DH', badge: '' },
    { id: 'BRG03', category: 'BURGERS', name: 'Avocado Forestier', desc: 'Poulet, avocat, laitue, tomate, oignon caramélisé', price: '54 DH', badge: '' },
    { id: 'BRG04', category: 'BURGERS', name: 'Egg Burger', desc: 'Viande hachée, cheddar, champignons, œuf, laitue, tomate, oignon caramélisé', price: '56 DH', badge: '' },
    { id: 'BRG05', category: 'BURGERS', name: 'Big Burger', desc: '2 viandes hachées, fromage cheddar, laitue, tomate, oignon caramélisé, sauce du chef', price: '68 DH', badge: '' },
    { id: 'BRG06', category: 'BURGERS', name: 'Burger Royal', desc: 'Viande hachée, poulet pané, cheddar, oignon caramélisé, laitue, tomate, sauce spéciale', price: '70 DH', badge: 'CHEF' },

    // 12. PANINIS & WRAPS
    { id: 'PAN01', category: 'PANINIS & WRAPS', name: 'Panini Charcuterie', desc: '3 charcuteries, fromage, sauce burger', price: '40 DH', badge: '' },
    { id: 'PAN02', category: 'PANINIS & WRAPS', name: 'Panini Poulet', desc: 'Poulet grillé, fromage, sauce burger', price: '44 DH', badge: '' },
    { id: 'PAN03', category: 'PANINIS & WRAPS', name: 'Panini Viande Hachée', desc: 'Viande hachée, fromage, sauce burger', price: '45 DH', badge: '' },
    { id: 'PAN04', category: 'PANINIS & WRAPS', name: 'Panini Mixte', desc: 'Mélange de viande hachée et poulet, charcuterie, fromage', price: '58 DH', badge: '' },
    { id: 'PAN05', category: 'PANINIS & WRAPS', name: 'Panini Fruits de Mer', desc: 'Crevettes, calamars, sauce du chef', price: '64 DH', badge: '' },
    { id: 'PAN06', category: 'PANINIS & WRAPS', name: 'Panini Saumon', desc: 'Saumon frais, fromage, sauce du chef', price: '64 DH', badge: '' },
    { id: 'WRP01', category: 'PANINIS & WRAPS', name: 'Wrap Poulet', desc: 'Poulet pané, cheddar, tomate, laitue, sauce', price: '58 DH', badge: 'NOUVEAU' },
    { id: 'WRP02', category: 'PANINIS & WRAPS', name: 'Wrap Viande Hachée', desc: 'Viande hachée, cheddar, tomate, laitue, sauce', price: '62 DH', badge: 'NOUVEAU' },
    { id: 'WRP03', category: 'PANINIS & WRAPS', name: 'Wrap Gourmand', desc: 'Poulet pané, charcuterie, cheddar, tomate, laitue, sauce', price: '64 DH', badge: 'NOUVEAU' },

    // 13. PIZZAS
    { id: 'PIZ01', category: 'PIZZAS', name: 'Margarita', desc: 'Sauce tomate, basilic, olives noires, mozzarella', price: '52 DH', badge: '' },
    { id: 'PIZ02', category: 'PIZZAS', name: 'Végétarienne', desc: 'Légumes variés (poivrons, champignons, oignons, courgettes, mozzarella, aubergines)', price: '62 DH', badge: '' },
    { id: 'PIZ03', category: 'PIZZAS', name: 'Thon', desc: 'Thon, oignons, olives noires, mozzarella', price: '65 DH', badge: '' },
    { id: 'PIZ04', category: 'PIZZAS', name: 'Regina', desc: 'Dinde fumée, champignons frais, mozzarella, sauce blanche', price: '68 DH', badge: '' },
    { id: 'PIZ05', category: 'PIZZAS', name: 'Pepperoni', desc: 'Pepperoni, sauce tomate, mozzarella', price: '74 DH', badge: '' },
    { id: 'PIZ06', category: 'PIZZAS', name: '5 Fromages', desc: 'Sauce tomate, mozzarella, bleu, parmesan, gouda, brie', price: '78 DH', badge: '' },
    { id: 'PIZ07', category: 'PIZZAS', name: 'Viande Hachée', desc: 'Viande hachée, tomates cerises, sauce tomate, mozzarella', price: '78 DH', badge: '' },
    { id: 'PIZ08', category: 'PIZZAS', name: 'Poulet Sauce Blanche', desc: 'Poulet, sauce blanche, champignons, mozzarella', price: '78 DH', badge: '' },
    { id: 'PIZ09', category: 'PIZZAS', name: '4 Saisons', desc: 'Fruits de mer, viande hachée, poulet, végétarienne, mozzarella', price: '88 DH', badge: '' },
    { id: 'PIZ10', category: 'PIZZAS', name: 'Moitié-Moitié', desc: 'Tout sauf fruits de mer, saumon et burrata', price: '88 DH', badge: '' },
    { id: 'PIZ11', category: 'PIZZAS', name: 'Fruits de Mer', desc: 'Crevettes, calamars, moules, champignons, sauce blanche, mozzarella', price: '88 DH', badge: '' },
    { id: 'PIZ12', category: 'PIZZAS', name: 'Saumon', desc: 'Saumon frais, sauce blanche, roquette, câpres', price: '94 DH', badge: '' },
    { id: 'PIZ13', category: 'PIZZAS', name: 'Burrata', desc: 'Sauce tomate, burrata, tomates cerises, roquette, vinaigre balsamique, noix', price: '110 DH', badge: 'CHEF' },

    // 14. PASTA & LASAGNES
    { id: 'PAS01', category: 'PASTA & LASAGNES', name: 'Pasta Végétarien', desc: 'Spaghettis, Tagliatelles ou Linguines, légumes variés, sauce pesto, huile d’olive, aubergines (Option Spaghettis Noirs +5 DH)', price: '60 DH', badge: '' },
    { id: 'PAS02', category: 'PASTA & LASAGNES', name: 'Pasta Carbonara', desc: 'Pâtes au choix, jambon de dinde, parmesan', price: '65 DH', badge: '' },
    { id: 'PAS03', category: 'PASTA & LASAGNES', name: 'Rigatoni Ricotta', desc: 'Ricotta, parmesan, courgettes, sauce blanche', price: '68 DH', badge: '' },
    { id: 'PAS04', category: 'PASTA & LASAGNES', name: 'Pasta 5 Fromages', desc: 'Pâtes, mélange de cinq fromages (parmesan, bleu, mozzarella, cheddar, brie)', price: '70 DH', badge: '' },
    { id: 'PAS05', category: 'PASTA & LASAGNES', name: 'Pasta Bolognaise', desc: 'Pâtes, sauce bolognaise à la viande hachée, tomates cerises', price: '75 DH', badge: '' },
    { id: 'PAS06', category: 'PASTA & LASAGNES', name: 'Pasta Poulet Champignons / Épinards', desc: 'Pâtes, poulet, champignons, épinards, parmesan', price: '75 DH', badge: '' },
    { id: 'PAS07', category: 'PASTA & LASAGNES', name: 'Pasta Fruits de Mer', desc: 'Pâtes, crevettes, calamars, moules, sauce blanche', price: '88 DH', badge: '' },
    { id: 'PAS08', category: 'PASTA & LASAGNES', name: 'Pasta Saumon', desc: 'Pâtes, saumon frais, aneth, parmesan', price: '98 DH', badge: '' },
    { id: 'LAS01', category: 'PASTA & LASAGNES', name: 'Lasagne Poulet', desc: 'Poulet, pâtes lasagne, sauce blanche, béchamel, fromage', price: '60 DH', badge: 'NOUVEAU' },
    { id: 'LAS02', category: 'PASTA & LASAGNES', name: 'Lasagne Bolognaise', desc: 'Viande hachée, pâtes lasagne, sauce bolognaise, béchamel, fromage', price: '72 DH', badge: 'NOUVEAU' },
    { id: 'LAS03', category: 'PASTA & LASAGNES', name: 'Lasagne Fruits de Mer', desc: 'Crevettes, calamars, pâtes lasagne, sauce blanche, béchamel, fromage', price: '78 DH', badge: 'NOUVEAU' },

    // 15. CRÊPES, GAUFRES, PANCAKES & BUBBLE
    { id: 'CRP01', category: 'CRÊPES SUCRÉES & GAUFRES', name: 'Nutella', desc: 'Crêpe ou Gaufre au choix', price: '38 DH', badge: '' },
    { id: 'CRP02', category: 'CRÊPES SUCRÉES & GAUFRES', name: 'Banane - Nutella', desc: 'Crêpe ou Gaufre au choix', price: '42 DH', badge: '' },
    { id: 'CRP03', category: 'CRÊPES SUCRÉES & GAUFRES', name: 'Pomme Caramélisée', desc: 'Crêpe ou Gaufre au choix', price: '42 DH', badge: '' },
    { id: 'CRP04', category: 'CRÊPES SUCRÉES & GAUFRES', name: 'Chocolat Noisette', desc: 'Crêpe ou Gaufre au choix', price: '42 DH', badge: '' },
    { id: 'CRP05', category: 'CRÊPES SUCRÉES & GAUFRES', name: 'Exotique (Fruits de Saison)', desc: 'Crêpe ou Gaufre au choix', price: '48 DH', badge: '' },
    { id: 'CRP06', category: 'CRÊPES SUCRÉES & GAUFRES', name: 'Kunafa Pistache', desc: 'Crêpe ou Gaufre au choix', price: '48 DH', badge: 'CHEF' },
    { id: 'CRP07', category: 'CRÊPES SUCRÉES & GAUFRES', name: 'GreyCorner (Variétés Gourmandises)', desc: 'Crêpe ou Gaufre signature', price: '52 DH', badge: 'CHEF' },

    { id: 'CRS01', category: 'CRÊPES SALÉES & BUBBLE', name: 'Crêpe Salée Charcuterie / Fromage', desc: '', price: '45 DH', badge: '' },
    { id: 'CRS02', category: 'CRÊPES SALÉES & BUBBLE', name: 'Crêpe Salée Poulet - Champignons', desc: '', price: '48 DH', badge: '' },
    { id: 'CRS03', category: 'CRÊPES SALÉES & BUBBLE', name: 'Crêpe Salée Bolognaise', desc: '', price: '54 DH', badge: '' },
    { id: 'CRS04', category: 'CRÊPES SALÉES & BUBBLE', name: 'Crêpe Salée Pêcheur / Norvégienne / GreyCorner (Mixte)', desc: '', price: '58 DH', badge: '' },
    { id: 'CRS05', category: 'CRÊPES SALÉES & BUBBLE', name: 'Pancake / Cornet Enfant', desc: 'Supplément boule de glace au choix +16 DH', price: '40 DH', badge: '' },
    { id: 'CRS06', category: 'CRÊPES SALÉES & BUBBLE', name: 'Pancake / Cornet Fruits de Saison', desc: '', price: '48 DH', badge: '' },
    { id: 'CRS07', category: 'CRÊPES SALÉES & BUBBLE', name: 'Pancake / Cornet GreyCorner', desc: '', price: '50 DH', badge: '' },
    { id: 'CRS08', category: 'CRÊPES SALÉES & BUBBLE', name: 'Bubble Glace', desc: '', price: '50 DH', badge: '' },
    { id: 'CRS09', category: 'CRÊPES SALÉES & BUBBLE', name: 'Bubble GREY CORNER', desc: '', price: '60 DH', badge: 'CHEF' },

    // 16. GÂTEAUX & CHEESECAKES
    { id: 'GAT01', category: 'GÂTEAUX & DESSERTS', name: 'Tiramisu', desc: '', price: '38 DH', badge: '' },
    { id: 'GAT02', category: 'GÂTEAUX & DESSERTS', name: 'Fondant au Chocolat', desc: 'Servi avec boule de glace vanille', price: '40 DH', badge: '' },
    { id: 'GAT03', category: 'GÂTEAUX & DESSERTS', name: 'San Sebastian (Nutella)', desc: '', price: '40 DH', badge: '' },
    { id: 'GAT04', category: 'GÂTEAUX & DESSERTS', name: 'San Sebastian Gourmand', desc: 'Fruits rouges, Caramel, Pistache, Miel ou Chocolat noir', price: '45 DH', badge: 'CHEF' },
    { id: 'GAT05', category: 'GÂTEAUX & DESSERTS', name: 'Cheesecake Pistache', desc: '', price: '45 DH', badge: '' },
    { id: 'GAT06', category: 'GÂTEAUX & DESSERTS', name: 'Cheesecake Framboise', desc: '', price: '45 DH', badge: '' },
    { id: 'GAT07', category: 'GÂTEAUX & DESSERTS', name: 'Cheesecake Chocolat', desc: '', price: '45 DH', badge: '' }
];

function getGreyCornerSampleText() {
    const categories = [...new Set(GREY_CORNER_DEFAULT_DB.map(d => d.category))];
    const lines = [];
    categories.forEach(cat => {
        lines.push(`# ${cat}`);
        GREY_CORNER_DEFAULT_DB.filter(d => d.category === cat).forEach(item => {
            const descPart = item.desc ? ` - ${item.desc}` : '';
            const badgePart = item.badge ? ` [${item.badge}]` : '';
            lines.push(`${item.name}${descPart} ... ${item.price}${badgePart}`);
        });
        lines.push('');
    });
    return lines.join('\n').trim();
}
