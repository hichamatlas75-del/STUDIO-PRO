# InMenu Studio Pro

Éditeur de menus imprimables (livret 34×30 cm, flyers A4/A5, dépliant 3 volets) 100 % navigateur et **100 % hors-ligne** : mise en page par planches, base de plats, import Word (`.docx` / `.txt`), export PNG/PDF pré-presse avec traits de coupe.

## Lancer
Ouvrir `index.html` directement dans un navigateur récent (aucune connexion Internet requise : Tailwind CSS compilé, Google Fonts, Font Awesome, jsPDF et Mammoth.js sont embarqués localement dans `css/` et `vendor/`).

## Structure
- `samples/` : projet d'exemple (`.inmenu.json`), données et `.docx` de démonstration (hors application)
- Sécurité : CSP stricte dans `index.html` (`script-src 'self'`), import JSON assaini (`normalizeImportedData`)
- `css/tailwind.min.css` & `tailwind.config.js` : feuille de style Tailwind CSS v3 compilée pour la production
- `vendor/` : bibliothèques embarquées en local (`jspdf.umd.min.js`, `mammoth.browser.min.js`, `fontawesome/`, `fonts/`)
- `js/utils.js` : helpers (échappement HTML, ids, stockage IndexedDB + localStorage)
- `js/engine.js` : formats, pages, undo/redo, numérotation, import/export JSON
- `js/word-importer.js` : import `.docx` et mise en page automatique
- `js/indesign-templates.js`, `js/illustrations-pack.js` : gabarits et illustrations vectorielles
- `js/print-exporter.js` : rendu canvas / PDF pré-presse haute définition
- Contrôleur d'interface découpé par domaines (délégation d'événements `addEventListener` via `data-action`, `data-input`, `data-change`) :
  - `js/app-core.js` : classe `InMenuStudioApp`, état, raccourcis clavier, délégation d'événements
  - `js/app-canvas.js` : rendu du canevas WYSIWYG, règles millimétriques, drag & resize, guides magnétiques, pack illustrations
  - `js/app-inspector.js` : panneau de propriétés, barre de coordonnées, pile de calques, navigateur de pages
  - `js/app-db-word.js` : base de données centrale Plats/Prix et assistant d'importation Word
  - `js/app-modals.js` : gabarits InDesign, simulateur 3D, formats, numérotation des pages, tiroirs mobile
  - `js/app-io.js` : export PDF/PNG et synchronisation Google Drive / disque local
  - `js/app.js` : point d'entrée et initialisation

## Sauvegarde
Automatique (IndexedDB, copie localStorage si < 5 Mo). `Ctrl+S` enregistre un fichier `.inmenu.json`.

## Raccourcis
`Ctrl+Z` / `Ctrl+Y` annuler/rétablir · `W` mode aperçu · flèches déplacer (Maj = 2 mm) · `Suppr` supprimer · `Échap` fermer.

## Tests & Build CSS
- Lancer les tests : `node --test tests/engine.test.js`
- Recompiler Tailwind CSS (si ajout de classes) : `npx tailwindcss@3.4.17 -c tailwind.config.js -o css/tailwind.min.css --minify`
