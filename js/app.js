/**
 * MODULE 2: Point d'entrée principal de l'application (app.js)
 *
 * L'architecture de `InMenuStudioApp` est découpée en 6 sous-modules métier :
 * - js/app-core.js      : Classe de base, état, raccourcis clavier, délégation d'événements (data-action / data-input / data-change)
 * - js/app-canvas.js    : Rendu du canevas WYSIWYG, règles millimétriques, drag & resize, guides magnétiques, pack illustrations
 * - js/app-inspector.js : Panneau de propriétés, barre de coordonnées (X/Y/L/H), pile de calques, navigateur de pages
 * - js/app-db-word.js   : Base de données centrale Plats/Prix et Assistant d'importation Word (.docx / .txt)
 * - js/app-modals.js    : Gabarits InDesign, Simulateur 3D, Formats, Numérotation des pages, Tiroirs & Menus Mobile
 * - js/app-io.js        : Export PDF/PNG Haute Définition et Synchronisation Google Drive / Disque local
 */
let app;

function initInMenuStudioApp() {
    try {
        app = new InMenuStudioApp();
        if (typeof window !== 'undefined') {
            window.app = app;
        }
    } catch (err) {
        console.error("Critical error starting InMenuStudioApp:", err);
    }
}

if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initInMenuStudioApp);
    } else {
        initInMenuStudioApp();
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { InMenuStudioApp, initInMenuStudioApp };
}
