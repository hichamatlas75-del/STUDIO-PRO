/**
 * MODULE 2C: Properties Inspector, Layers Stack & Spreads/Pages Navigator (app-inspector.js)
 */
Object.assign(InMenuStudioApp.prototype, {
    renderInspector() {
        const container = document.getElementById('inspector-content');
        const badge = document.getElementById('prop-obj-type');
        if (!container || !badge) return;
        const obj = this.selectedObject;
        const safeHex = (val, fallback) => /^#[0-9a-fA-F]{6}$/.test(String(val || '').trim()) ? String(val).trim() : fallback;

        if (!obj) {
            badge.textContent = 'Planche 34×30cm';
            const faceBg = safeHex(this.currentFace.bgColor, '#fdfbf7');
            container.innerHTML = `
                <div class="space-y-4">
                    <div class="bg-idInput p-3 rounded border border-idBorder space-y-2">
                        <div class="font-semibold text-white">${escapeHTML(this.currentFace.name)}</div>
                        <div class="text-[11px] text-gray-400">Aucun bloc sélectionné. Cliquez sur un élément du canevas pour le modifier ou ajoutez un bloc depuis la boîte à outils à gauche.</div>
                    </div>
                    <div>
                        <label class="block text-[11px] text-gray-400 mb-1">Couleur de fond du papier :</label>
                        <div class="flex items-center space-x-2">
                            <input type="color" value="${faceBg}" data-input="face-bg-color" data-change="face-bg-color" class="w-8 h-8 rounded cursor-pointer bg-transparent border border-idBorder">
                            <input type="text" value="${escapeHTML(this.currentFace.bgColor || '#fdfbf7')}" data-change="face-bg-color" class="flex-1 bg-idInput border border-idBorder rounded px-2 py-1 font-mono text-white">
                        </div>
                    </div>
                    <div class="pt-2 border-t border-idBorder space-y-1.5">
                        <div class="text-[10px] font-bold uppercase text-gray-400">Vérification Pré-Presse</div>
                        <div class="flex items-center justify-between text-[11px] bg-idInput px-2.5 py-1.5 rounded">
                            <span class="text-gray-300">Dimensions ouvertes</span>
                            <span class="font-mono text-emerald-400">340 × 300 mm</span>
                        </div>
                        <div class="flex items-center justify-between text-[11px] bg-idInput px-2.5 py-1.5 rounded">
                            <span class="text-gray-300">Ligne de pli centrale</span>
                            <span class="font-mono text-cyan-400">X = 170 mm</span>
                        </div>
                        <div class="flex items-center justify-between text-[11px] bg-idInput px-2.5 py-1.5 rounded">
                            <span class="text-gray-300">Fond perdu (Bleed)</span>
                            <span class="font-mono text-red-400">3 mm (346×306)</span>
                        </div>
                        <div class="flex items-center justify-between text-[11px] bg-idInput px-2.5 py-1.5 rounded">
                            <span class="text-gray-300">Zone sécurité pli</span>
                            <span class="font-mono text-cyan-300">160 à 180 mm</span>
                        </div>
                    </div>
                </div>
            `;
            return;
        }

        badge.textContent = `${obj.type.toUpperCase()}${obj.locked ? ' (VERROUILLÉ)' : ''}`;

        // Lock notice if locked
        const lockNoticeHTML = obj.locked ? `
            <div class="bg-amber-500/15 border border-amber-500/40 text-amber-300 p-2 rounded text-[10px] flex items-center justify-between">
                <span class="flex items-center space-x-1.5">
                    <i class="fa-solid fa-lock text-amber-400"></i>
                    <span>Bloc <strong>verrouillé</strong> (protégé contre déplacement et suppression)</span>
                </span>
                <button type="button" data-action="toggle-lock" class="text-amber-300 underline font-semibold ml-2 hover:text-white shrink-0">Déverrouiller</button>
            </div>
        ` : '';

        // Warning if object crosses the central fold safety zone (160mm to 180mm) and isn't a full background
        const crossesFold = (obj.x < 180 && (obj.x + obj.w) > 160 && obj.w < 300);
        const foldWarningHTML = crossesFold ? `
            <div class="bg-amber-500/15 border border-amber-500/40 text-amber-300 p-2 rounded text-[10px] flex items-start space-x-2">
                <i class="fa-solid fa-triangle-exclamation mt-0.5 text-amber-400"></i>
                <span>Attention : Ce bloc chevauche la <strong>zone de sécurité du pli central (160–180 mm)</strong>.</span>
            </div>
        ` : '';

        // Common Geometry Controls (X, Y, W, H in mm) + Alignment Buttons
        let html = `
            ${lockNoticeHTML}
            ${foldWarningHTML}
            <!-- Quick Panel Alignment -->
            <div>
                <label class="text-[10px] font-bold uppercase text-gray-400 block mb-1.5">Alignement Rapide Panneau (17×30 cm)</label>
                <div class="grid grid-cols-3 gap-1.5">
                    <button type="button" data-action="align-selected" data-mode="center_left_panel" class="bg-idInput hover:bg-white/10 border border-idBorder rounded py-1 text-[10px] text-gray-200" title="Centrer sur le panneau gauche (X=85mm)">
                        <i class="fa-solid fa-align-center mr-1 text-cyan-400"></i>Centre G.
                    </button>
                    <button type="button" data-action="align-selected" data-mode="center_right_panel" class="bg-idInput hover:bg-white/10 border border-idBorder rounded py-1 text-[10px] text-gray-200" title="Centrer sur le panneau droit (X=255mm)">
                        <i class="fa-solid fa-align-center mr-1 text-cyan-400"></i>Centre D.
                    </button>
                    <button type="button" data-action="align-selected" data-mode="full_bleed" class="bg-idInput hover:bg-white/10 border border-idBorder rounded py-1 text-[10px] text-red-300" title="Étendre au fond perdu (-3mm à 343mm)">
                        Fond Perdu
                    </button>
                </div>
            </div>

            <!-- Coordinates in mm -->
            <div class="grid grid-cols-2 gap-2 bg-idInput p-2.5 rounded border border-idBorder font-mono text-[11px]">
                <div>
                    <label class="text-gray-400 text-[10px] block">Position X (mm)</label>
                    <input type="number" step="0.5" value="${obj.x}" data-change="obj-prop" data-prop="x" data-val-type="number" class="w-full bg-idPanel border border-idBorder rounded px-2 py-1 text-white">
                </div>
                <div>
                    <label class="text-gray-400 text-[10px] block">Position Y (mm)</label>
                    <input type="number" step="0.5" value="${obj.y}" data-change="obj-prop" data-prop="y" data-val-type="number" class="w-full bg-idPanel border border-idBorder rounded px-2 py-1 text-white">
                </div>
                <div>
                    <label class="text-gray-400 text-[10px] block">Largeur L (mm)</label>
                    <input type="number" step="0.5" min="8" value="${obj.w}" data-change="obj-prop" data-prop="w" data-val-type="number" class="w-full bg-idPanel border border-idBorder rounded px-2 py-1 text-white">
                </div>
                <div>
                    <label class="text-gray-400 text-[10px] block">Hauteur H (mm)</label>
                    <input type="number" step="0.5" min="6" value="${obj.h}" data-change="obj-prop" data-prop="h" data-val-type="number" class="w-full bg-idPanel border border-idBorder rounded px-2 py-1 text-white">
                </div>
            </div>
        `;

        // Type-Specific Inspector Fields
        if (obj.type === 'vertical_banner') {
            html += `
                <div class="space-y-2.5 border-t border-idBorder pt-3">
                    <div>
                        <label class="text-gray-400 text-[11px] block mb-1">Texte du Bandeau Vertical</label>
                        <input type="text" value="${escapeHTML(obj.text || '')}" data-input="obj-prop" data-change="obj-prop" data-prop="text" class="w-full bg-idInput border border-idBorder rounded px-2.5 py-1.5 text-white font-semibold">
                    </div>
                    <div class="grid grid-cols-2 gap-2">
                        <div>
                            <label class="text-gray-400 text-[10px] block mb-1">Couleur Fond</label>
                            <input type="color" value="${safeHex(obj.bgColor, '#9a3412')}" data-input="obj-prop" data-change="obj-prop" data-prop="bgColor" class="w-full h-8 rounded bg-idInput border border-idBorder cursor-pointer">
                        </div>
                        <div>
                            <label class="text-gray-400 text-[10px] block mb-1">Couleur Texte</label>
                            <input type="color" value="${safeHex(obj.textColor, '#ffffff')}" data-input="obj-prop" data-change="obj-prop" data-prop="textColor" class="w-full h-8 rounded bg-idInput border border-idBorder cursor-pointer">
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-2">
                        <div>
                            <label class="text-gray-400 text-[10px] block mb-1">Taille Police (pt)</label>
                            <input type="number" min="5" step="0.5" value="${obj.fontSize || 12}" data-change="obj-prop" data-prop="fontSize" data-val-type="number" class="w-full bg-idInput border border-idBorder rounded px-2 py-1 text-white">
                        </div>
                        <div>
                            <label class="text-gray-400 text-[10px] block mb-1">Arrondi (mm)</label>
                            <input type="number" min="0" step="0.5" value="${obj.radius ?? 3}" data-change="obj-prop" data-prop="radius" data-val-type="number" class="w-full bg-idInput border border-idBorder rounded px-2 py-1 text-white">
                        </div>
                    </div>
                </div>
            `;
        }
        else if (obj.type === 'dish_item') {
            const dishOptions = this.engine.dishesDB.map(d =>
                `<option value="${escapeHTML(d.id)}" ${d.id === obj.dishId ? 'selected' : ''}>[${escapeHTML(d.category)}] ${escapeHTML(d.name)} (${escapeHTML(d.price)})</option>`
            ).join('');
            html += `
                <div class="space-y-2.5 border-t border-idBorder pt-3">
                    <div class="bg-emerald-500/10 border border-emerald-500/30 p-2 rounded">
                        <label class="text-emerald-300 font-semibold text-[11px] block mb-1">
                            <i class="fa-solid fa-link mr-1"></i>Plat lié (Base de Données Centrale)
                        </label>
                        <select data-change="obj-prop" data-prop="dishId" class="w-full bg-idInput border border-idBorder rounded px-2 py-1.5 text-white text-[11px]">
                            ${dishOptions || '<option value="">Aucun plat en base</option>'}
                        </select>
                        <button type="button" data-action="open-database" class="mt-2 w-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 py-1 rounded text-[10px] font-semibold">
                            Modifier le texte/prix dans la BDD Centrale
                        </button>
                    </div>
                    <div class="grid grid-cols-3 gap-2">
                        <div>
                            <label class="text-gray-400 text-[10px] block mb-1">Nom Plat</label>
                            <input type="color" value="${safeHex(obj.textColor, '#1e293b')}" data-input="obj-prop" data-change="obj-prop" data-prop="textColor" class="w-full h-7 rounded bg-idInput border border-idBorder">
                        </div>
                        <div>
                            <label class="text-gray-400 text-[10px] block mb-1">Description</label>
                            <input type="color" value="${safeHex(obj.descColor, '#64748b')}" data-input="obj-prop" data-change="obj-prop" data-prop="descColor" class="w-full h-7 rounded bg-idInput border border-idBorder">
                        </div>
                        <div>
                            <label class="text-gray-400 text-[10px] block mb-1">Prix</label>
                            <input type="color" value="${safeHex(obj.priceColor, '#9a3412')}" data-input="obj-prop" data-change="obj-prop" data-prop="priceColor" class="w-full h-7 rounded bg-idInput border border-idBorder">
                        </div>
                    </div>
                    <div>
                        <label class="text-gray-400 text-[10px] block mb-1">Taille Police (pt)</label>
                        <input type="number" min="6" step="0.5" value="${obj.fontSize || 11}" data-change="obj-prop" data-prop="fontSize" data-val-type="number" class="w-full bg-idInput border border-idBorder rounded px-2 py-1 text-white">
                    </div>
                </div>
            `;
        }
        else if (obj.type === 'category_list') {
            const cats = this.engine.getCategories();
            const catMissing = obj.category && !cats.includes(obj.category);
            const catOptions = (catMissing ? `<option value="${escapeHTML(obj.category)}" selected>${escapeHTML(obj.category)} (aucun plat)</option>` : '') +
                cats.map(c => `<option value="${escapeHTML(c)}" ${c === obj.category ? 'selected' : ''}>${escapeHTML(c)}</option>`).join('');
            html += `
                <div class="space-y-2.5 border-t border-idBorder pt-3">
                    <div class="bg-blue-500/10 border border-blue-500/30 p-2 rounded space-y-2">
                        <label class="text-blue-300 font-semibold text-[11px] block">
                            <i class="fa-solid fa-database mr-1"></i>Catégorie liée à la Base de Données
                        </label>
                        <select data-change="obj-prop" data-prop="category" class="w-full bg-idInput border border-idBorder rounded px-2 py-1.5 text-white">
                            ${catOptions}
                        </select>
                        <input type="text" value="${escapeHTML(obj.title || '')}" placeholder="Sous-titre de section" data-input="obj-prop" data-change="obj-prop" data-prop="title" class="w-full bg-idInput border border-idBorder rounded px-2 py-1 text-white">
                    </div>
                    <div class="grid grid-cols-2 gap-2">
                        <div>
                            <label class="text-gray-400 text-[10px] block mb-1">Couleur Titre</label>
                            <input type="color" value="${safeHex(obj.titleColor, '#9a3412')}" data-input="obj-prop" data-change="obj-prop" data-prop="titleColor" class="w-full h-7 rounded bg-idInput border border-idBorder">
                        </div>
                        <div>
                            <label class="text-gray-400 text-[10px] block mb-1">Couleur Plats</label>
                            <input type="color" value="${safeHex(obj.textColor, '#1e293b')}" data-input="obj-prop" data-change="obj-prop" data-prop="textColor" class="w-full h-7 rounded bg-idInput border border-idBorder">
                        </div>
                        <div>
                            <label class="text-gray-400 text-[10px] block mb-1">Couleur Desc.</label>
                            <input type="color" value="${safeHex(obj.descColor, '#64748b')}" data-input="obj-prop" data-change="obj-prop" data-prop="descColor" class="w-full h-7 rounded bg-idInput border border-idBorder">
                        </div>
                        <div>
                            <label class="text-gray-400 text-[10px] block mb-1">Couleur Prix</label>
                            <input type="color" value="${safeHex(obj.priceColor, '#9a3412')}" data-input="obj-prop" data-change="obj-prop" data-prop="priceColor" class="w-full h-7 rounded bg-idInput border border-idBorder">
                        </div>
                    </div>
                    <div>
                        <label class="text-gray-400 text-[10px] block mb-1">Taille Police Plats (pt)</label>
                        <input type="number" min="6" step="0.5" value="${obj.fontSize || 10.5}" data-change="obj-prop" data-prop="fontSize" data-val-type="number" class="w-full bg-idInput border border-idBorder rounded px-2 py-1 text-white">
                    </div>
                    ${(() => {
                        if (typeof WordMenuImporter === 'undefined') return '';
                        const allDishes = this.engine.getDishesByCategory(obj.category);
                        const dishes = (obj.sliceStart !== undefined || obj.sliceEnd !== undefined)
                            ? allDishes.slice(obj.sliceStart || 0, obj.sliceEnd)
                            : allDishes;
                        const estimatedH = WordMenuImporter.estimateBlockHeightMm(dishes, Boolean(obj.title));
                        if (estimatedH > obj.h + 2) {
                            return `
                                <div class="bg-red-500/15 border border-red-500/40 text-red-300 p-2 rounded text-[10px] space-y-1.5 mt-2">
                                    <div class="flex items-center space-x-1.5 font-bold">
                                        <i class="fa-solid fa-triangle-exclamation text-red-400"></i>
                                        <span>Débordement : ${dishes.length} plats nécessitent ≈ ${Math.round(estimatedH)} mm (hauteur : ${obj.h} mm).</span>
                                    </div>
                                    <button type="button" data-action="fit-block-height" data-height="${Math.round(estimatedH)}" class="w-full bg-red-600 hover:bg-red-500 text-white py-1 rounded font-bold text-[10px] shadow">
                                        Ajuster la hauteur à ${Math.round(estimatedH)} mm
                                    </button>
                                </div>
                            `;
                        }
                        return '';
                    })()}
                </div>
            `;
        }
        else if (obj.type === 'badge_new') {
            html += `
                <div class="space-y-2.5 border-t border-idBorder pt-3">
                    <div>
                        <label class="text-gray-400 text-[11px] block mb-1">Texte du Badge</label>
                        <input type="text" value="${escapeHTML(obj.text ?? 'NOUVEAU')}" data-input="obj-prop" data-change="obj-prop" data-prop="text" class="w-full bg-idInput border border-idBorder rounded px-2.5 py-1.5 text-white font-bold">
                    </div>
                    <div class="grid grid-cols-2 gap-2">
                        <div>
                            <label class="text-gray-400 text-[10px] block mb-1">Fond Badge</label>
                            <input type="color" value="${safeHex(obj.bgColor, '#e11d48')}" data-input="obj-prop" data-change="obj-prop" data-prop="bgColor" class="w-full h-8 rounded bg-idInput border border-idBorder">
                        </div>
                        <div>
                            <label class="text-gray-400 text-[10px] block mb-1">Couleur Texte</label>
                            <input type="color" value="${safeHex(obj.textColor, '#ffffff')}" data-input="obj-prop" data-change="obj-prop" data-prop="textColor" class="w-full h-8 rounded bg-idInput border border-idBorder">
                        </div>
                    </div>
                    <div>
                        <label class="text-gray-400 text-[10px] block mb-1">Arrondi (mm)</label>
                        <input type="number" min="0" step="0.5" value="${obj.radius ?? 10}" data-change="obj-prop" data-prop="radius" data-val-type="number" class="w-full bg-idInput border border-idBorder rounded px-2 py-1 text-white">
                    </div>
                </div>
            `;
        }
        else if (obj.type === 'photo') {
            html += `
                <div class="space-y-2.5 border-t border-idBorder pt-3">
                    <div>
                        <label class="text-gray-400 text-[11px] block mb-1">Importer une photo locale</label>
                        <input type="file" accept="image/*" data-change="upload-photo" class="w-full text-[10px] text-gray-300 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-blue-600 file:text-white cursor-pointer">
                    </div>
                    <div>
                        <label class="text-gray-400 text-[11px] block mb-1">Ou URL de la photo</label>
                        <input type="text" value="${escapeHTML(obj.imageUrl || '')}" data-change="obj-prop" data-prop="imageUrl" class="w-full bg-idInput border border-idBorder rounded px-2 py-1 text-white font-mono text-[10px]">
                    </div>
                    <div>
                        <label class="text-gray-400 text-[11px] block mb-1">Légende de la photo</label>
                        <input type="text" value="${escapeHTML(obj.caption || '')}" data-input="obj-prop" data-change="obj-prop" data-prop="caption" class="w-full bg-idInput border border-idBorder rounded px-2 py-1 text-white">
                    </div>
                    <div class="grid grid-cols-3 gap-2">
                        <div>
                            <label class="text-gray-400 text-[10px] block mb-1">Arrondi (mm)</label>
                            <input type="number" min="0" step="0.5" value="${obj.radius ?? 0}" data-change="obj-prop" data-prop="radius" data-val-type="number" class="w-full bg-idInput border border-idBorder rounded px-2 py-1 text-white">
                        </div>
                        <div>
                            <label class="text-gray-400 text-[10px] block mb-1">Bordure (px)</label>
                            <input type="number" min="0" step="0.5" value="${obj.borderWidth ?? 1.5}" data-change="obj-prop" data-prop="borderWidth" data-val-type="number" class="w-full bg-idInput border border-idBorder rounded px-2 py-1 text-white">
                        </div>
                        <div>
                            <label class="text-gray-400 text-[10px] block mb-1">Couleur</label>
                            <input type="color" value="${safeHex(obj.borderColor, '#c8a96a')}" data-input="obj-prop" data-change="obj-prop" data-prop="borderColor" class="w-full h-7 rounded bg-idInput border border-idBorder">
                        </div>
                    </div>
                </div>
            `;
        }
        else if (obj.type === 'logo') {
            html += `
                <div class="space-y-2.5 border-t border-idBorder pt-3">
                    <div>
                        <label class="text-gray-400 text-[11px] block mb-1">Nom de l'Établissement</label>
                        <input type="text" value="${escapeHTML(obj.title || '')}" data-input="obj-prop" data-change="obj-prop" data-prop="title" class="w-full bg-idInput border border-idBorder rounded px-2 py-1 text-white font-bold">
                    </div>
                    <div>
                        <label class="text-gray-400 text-[11px] block mb-1">Sous-titre / Slogan</label>
                        <input type="text" value="${escapeHTML(obj.subtitle || '')}" data-input="obj-prop" data-change="obj-prop" data-prop="subtitle" class="w-full bg-idInput border border-idBorder rounded px-2 py-1 text-white">
                    </div>
                    <div>
                        <label class="text-gray-400 text-[10px] block mb-1">Couleur Or / Emblème</label>
                        <input type="color" value="${safeHex(obj.color, '#c8a96a')}" data-input="obj-prop" data-change="obj-prop" data-prop="color" class="w-full h-8 rounded bg-idInput border border-idBorder">
                    </div>
                </div>
            `;
        }
        else if (obj.type === 'text') {
            html += `
                <div class="space-y-2.5 border-t border-idBorder pt-3">
                    <div>
                        <label class="text-gray-400 text-[11px] block mb-1">Contenu du Texte</label>
                        <textarea rows="3" data-input="obj-prop" data-change="obj-prop" data-prop="text" class="w-full bg-idInput border border-idBorder rounded p-2 text-white">${escapeHTML(obj.text ?? obj.content ?? '')}</textarea>
                    </div>
                    <div class="grid grid-cols-2 gap-2">
                        <div>
                            <label class="text-gray-400 text-[10px] block mb-1">Police</label>
                            <select data-change="obj-prop" data-prop="fontFamily" class="w-full bg-idInput border border-idBorder rounded px-2 py-1 text-white">
                                <option value="Playfair Display" ${obj.fontFamily === 'Playfair Display' ? 'selected' : ''}>Playfair Display</option>
                                <option value="Cinzel" ${obj.fontFamily === 'Cinzel' ? 'selected' : ''}>Cinzel</option>
                                <option value="Cormorant Garamond" ${obj.fontFamily === 'Cormorant Garamond' ? 'selected' : ''}>Cormorant</option>
                                <option value="Montserrat" ${obj.fontFamily === 'Montserrat' ? 'selected' : ''}>Montserrat</option>
                                <option value="Inter" ${obj.fontFamily === 'Inter' ? 'selected' : ''}>Inter</option>
                            </select>
                        </div>
                        <div>
                            <label class="text-gray-400 text-[10px] block mb-1">Taille (pt)</label>
                            <input type="number" min="5" step="0.5" value="${obj.fontSize || obj.fontSizePt || 12}" data-change="obj-prop" data-prop="fontSize" data-val-type="number" class="w-full bg-idInput border border-idBorder rounded px-2 py-1 text-white">
                        </div>
                    </div>
                    <div class="grid grid-cols-3 gap-2">
                        <div>
                            <label class="text-gray-400 text-[10px] block mb-1">Couleur</label>
                            <input type="color" value="${safeHex(obj.color, '#1e293b')}" data-input="obj-prop" data-change="obj-prop" data-prop="color" class="w-full h-7 rounded bg-idInput border border-idBorder">
                        </div>
                        <div>
                            <label class="text-gray-400 text-[10px] block mb-1">Alignement</label>
                            <select data-change="obj-prop" data-prop="align" class="w-full bg-idInput border border-idBorder rounded px-1.5 py-1 text-white">
                                <option value="left" ${(obj.align || obj.textAlign) === 'left' ? 'selected' : ''}>Gauche</option>
                                <option value="center" ${(obj.align || obj.textAlign) === 'center' ? 'selected' : ''}>Centré</option>
                                <option value="right" ${(obj.align || obj.textAlign) === 'right' ? 'selected' : ''}>Droite</option>
                            </select>
                        </div>
                        <div>
                            <label class="text-gray-400 text-[10px] block mb-1">Graisse</label>
                            <select data-change="obj-prop" data-prop="fontWeight" class="w-full bg-idInput border border-idBorder rounded px-1.5 py-1 text-white">
                                <option value="400" ${String(obj.fontWeight) === '400' ? 'selected' : ''}>Normal</option>
                                <option value="500" ${String(obj.fontWeight || '500') === '500' ? 'selected' : ''}>Medium</option>
                                <option value="600" ${String(obj.fontWeight) === '600' ? 'selected' : ''}>Semi-Gras</option>
                                <option value="700" ${String(obj.fontWeight) === '700' ? 'selected' : ''}>Gras</option>
                                <option value="800" ${String(obj.fontWeight) === '800' ? 'selected' : ''}>Extra-Gras</option>
                            </select>
                        </div>
                    </div>
                </div>
            `;
        }
        else if (obj.type === 'shape') {
            const bgTransparent = !obj.bgColor || obj.bgColor === 'transparent';
            const borderTransparent = obj.borderColor === 'transparent';
            html += `
                <div class="space-y-2.5 border-t border-idBorder pt-3">
                    <div class="flex items-center justify-between text-[10px] text-gray-300">
                        <label class="flex items-center space-x-1.5 cursor-pointer">
                            <input type="checkbox" ${bgTransparent ? 'checked' : ''} data-change="obj-prop" data-prop="bgColor" data-val-type="transparent-toggle" data-fallback-color="#ffffff" data-refresh-inspector="true">
                            <span>Fond transparent</span>
                        </label>
                        <label class="flex items-center space-x-1.5 cursor-pointer">
                            <input type="checkbox" ${borderTransparent ? 'checked' : ''} data-change="obj-prop" data-prop="borderColor" data-val-type="transparent-toggle" data-fallback-color="#c8a96a" data-refresh-inspector="true">
                            <span>Sans bordure</span>
                        </label>
                    </div>
                    <div class="grid grid-cols-2 gap-2">
                        <div>
                            <label class="text-gray-400 text-[10px] block mb-1">Couleur Fond</label>
                            <input type="color" value="${safeHex(obj.bgColor, '#1e293b')}" data-input="obj-prop" data-change="obj-prop" data-prop="bgColor" data-refresh-inspector="true" class="w-full h-8 rounded bg-idInput border border-idBorder">
                        </div>
                        <div>
                            <label class="text-gray-400 text-[10px] block mb-1">Couleur Bordure</label>
                            <input type="color" value="${safeHex(obj.borderColor, '#c8a96a')}" data-input="obj-prop" data-change="obj-prop" data-prop="borderColor" data-refresh-inspector="true" class="w-full h-8 rounded bg-idInput border border-idBorder">
                        </div>
                    </div>
                    <div class="grid grid-cols-3 gap-2">
                        <div>
                            <label class="text-gray-400 text-[10px] block mb-1">Filet (px)</label>
                            <input type="number" min="0" step="0.5" value="${obj.borderWidth || 0}" data-change="obj-prop" data-prop="borderWidth" data-val-type="number" class="w-full bg-idInput border border-idBorder rounded px-2 py-1 text-white">
                        </div>
                        <div>
                            <label class="text-gray-400 text-[10px] block mb-1">Arrondi (mm)</label>
                            <input type="number" min="0" step="0.5" value="${obj.radius ?? 0}" data-change="obj-prop" data-prop="radius" data-val-type="number" class="w-full bg-idInput border border-idBorder rounded px-2 py-1 text-white">
                        </div>
                        <div>
                            <label class="text-gray-400 text-[10px] block mb-1">Opacité (%)</label>
                            <input type="number" min="5" max="100" step="5" value="${Math.round((obj.opacity ?? 1) * 100)}" data-change="obj-prop" data-prop="opacity" data-val-type="opacity-pct" class="w-full bg-idInput border border-idBorder rounded px-2 py-1 text-white">
                        </div>
                    </div>
                </div>
            `;
        }
        else if (obj.type === 'illustration') {
            const item = typeof CanvaIllustrationsPack !== 'undefined' ? CanvaIllustrationsPack.getById(obj.svgKey || obj.illustrationId) : null;
            const illuColor = safeHex(obj.color, item ? (item.defaultColor || '#c8a96a') : '#c8a96a');
            const quickColors = ['#c8a96a', '#9a3412', '#1e293b', '#e11d48', '#059669', '#2563eb', '#ffffff', '#000000'];

            html += `
                <div class="space-y-3 border-t border-idBorder pt-3">
                    <div class="bg-idInput p-2.5 rounded border border-idBorder flex items-center space-x-2.5">
                        <div class="w-10 h-10 rounded bg-black/40 border border-idBorder p-1 flex items-center justify-center shrink-0">
                            ${item ? CanvaIllustrationsPack.buildSVGString(item, { color: illuColor }) : '<i class="fa-solid fa-shapes text-amber-400"></i>'}
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="font-bold text-white text-xs truncate">${escapeHTML(item ? item.name : (obj.name || 'Illustration Canva'))}</div>
                            <div class="text-[10px] text-amber-400 font-mono">Pack Vectoriel Canva</div>
                        </div>
                    </div>

                    <!-- Color Palette -->
                    <div>
                        <label class="text-gray-400 text-[10px] block mb-1">Couleur Principale :</label>
                        <div class="flex items-center space-x-1.5 mb-2">
                            <input type="color" value="${illuColor}" data-input="obj-prop" data-change="obj-prop" data-prop="color" data-refresh-inspector="true" class="w-8 h-8 rounded bg-idInput border border-idBorder cursor-pointer">
                            <input type="text" value="${escapeHTML(obj.color || illuColor)}" data-change="obj-prop" data-prop="color" data-refresh-inspector="true" class="flex-1 bg-idInput border border-idBorder rounded px-2 py-1 font-mono text-xs text-white">
                        </div>
                        <div class="flex items-center space-x-1">
                            ${quickColors.map(c => `
                                <button type="button" data-action="set-obj-color" data-color="${c}" style="background-color: ${c};" class="w-5 h-5 rounded-full border border-gray-600 hover:scale-125 transition shrink-0" title="${c}"></button>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Flip & Rotate -->
                    <div>
                        <label class="text-gray-400 text-[10px] block mb-1">Orientation & Miroir :</label>
                        <div class="grid grid-cols-2 gap-2">
                            <button type="button" data-action="toggle-obj-flip" data-flip="flipH" class="px-2 py-1.5 bg-idInput hover:bg-white/10 rounded border border-idBorder text-[11px] text-gray-200 flex items-center justify-center space-x-1.5 ${obj.flipH ? 'border-blue-500 bg-blue-500/20 text-blue-300' : ''}">
                                <i class="fa-solid fa-arrows-left-right"></i>
                                <span>Miroir Horiz.</span>
                            </button>
                            <button type="button" data-action="toggle-obj-flip" data-flip="flipV" class="px-2 py-1.5 bg-idInput hover:bg-white/10 rounded border border-idBorder text-[11px] text-gray-200 flex items-center justify-center space-x-1.5 ${obj.flipV ? 'border-blue-500 bg-blue-500/20 text-blue-300' : ''}">
                                <i class="fa-solid fa-arrows-up-down"></i>
                                <span>Miroir Vert.</span>
                            </button>
                        </div>
                    </div>

                    <!-- Opacity -->
                    <div>
                        <div class="flex justify-between text-[10px] text-gray-400 mb-1">
                            <span>Transparence / Opacité :</span>
                            <span class="font-mono text-white">${Math.round((obj.opacity ?? 1) * 100)}%</span>
                        </div>
                        <input type="range" min="10" max="100" step="5" value="${Math.round((obj.opacity ?? 1) * 100)}" data-input="obj-prop" data-change="obj-prop" data-prop="opacity" data-val-type="opacity-pct" data-refresh-inspector="true" class="w-full accent-amber-500">
                    </div>
                </div>
            `;
        }
        else if (obj.type === 'page_number') {
            html += `
                <div class="space-y-3 border-t border-idBorder pt-3">
                    <div>
                        <label class="text-gray-400 text-[10px] block mb-1">Texte du numéro :</label>
                        <input type="text" value="${escapeHTML(obj.text || 'Page 1')}" data-change="obj-prop" data-prop="text" class="w-full bg-idInput border border-idBorder rounded px-2.5 py-1.5 text-xs text-white font-mono">
                    </div>
                    <div class="grid grid-cols-2 gap-2">
                        <div>
                            <label class="text-gray-400 text-[10px] block mb-1">Police</label>
                            <select data-change="obj-prop" data-prop="fontFamily" class="w-full bg-idInput border border-idBorder rounded px-2 py-1 text-xs text-white">
                                <option value="Montserrat" ${obj.fontFamily === 'Montserrat' ? 'selected' : ''}>Montserrat</option>
                                <option value="Playfair Display" ${obj.fontFamily === 'Playfair Display' ? 'selected' : ''}>Playfair Display</option>
                                <option value="Cinzel" ${obj.fontFamily === 'Cinzel' ? 'selected' : ''}>Cinzel</option>
                                <option value="Inter" ${obj.fontFamily === 'Inter' ? 'selected' : ''}>Inter</option>
                            </select>
                        </div>
                        <div>
                            <label class="text-gray-400 text-[10px] block mb-1">Taille (pt)</label>
                            <input type="number" min="6" max="24" step="0.5" value="${obj.fontSize || 8.5}" data-change="obj-prop" data-prop="fontSize" data-val-type="number" class="w-full bg-idInput border border-idBorder rounded px-2 py-1 text-xs text-white">
                        </div>
                    </div>
                    <div>
                        <label class="text-gray-400 text-[10px] block mb-1">Couleur</label>
                        <div class="flex items-center space-x-2">
                            <input type="color" value="${safeHex(obj.color, '#64748b')}" data-input="obj-prop" data-change="obj-prop" data-prop="color" data-refresh-inspector="true" class="w-8 h-8 rounded bg-idInput border border-idBorder cursor-pointer">
                            <input type="text" value="${escapeHTML(obj.color || '#64748b')}" data-change="obj-prop" data-prop="color" class="flex-1 bg-idInput border border-idBorder rounded px-2 py-1 font-mono text-xs text-white">
                        </div>
                    </div>
                </div>
            `;
        }

        // Duplicate, Lock & Delete Actions
        html += `
            <div class="pt-3 border-t border-idBorder flex space-x-2">
                <button type="button" data-action="toggle-lock" class="px-2.5 bg-idInput hover:bg-white/10 ${obj.locked ? 'text-amber-400 border-amber-500/60' : 'text-gray-300 border-idBorder'} border py-1.5 rounded font-medium text-[11px]" title="${obj.locked ? 'Déverrouiller ce bloc' : 'Verrouiller ce bloc (protège contre déplacement et suppression)'}">
                    <i class="fa-solid ${obj.locked ? 'fa-lock' : 'fa-lock-open'} mr-1"></i> ${obj.locked ? 'Déverrouiller' : 'Verrouiller'}
                </button>
                <button type="button" data-action="duplicate-selected" class="flex-1 bg-idInput hover:bg-white/10 text-gray-200 border border-idBorder py-1.5 rounded font-medium text-[11px]">
                    <i class="fa-regular fa-clone mr-1"></i> Dupliquer
                </button>
                <button type="button" data-action="delete-selected" class="flex-1 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 py-1.5 rounded font-medium text-[11px]">
                    <i class="fa-regular fa-trash-can mr-1"></i> Supprimer
                </button>
            </div>
        `;

        container.innerHTML = html;
    },

    updateSelectedProp(prop, val, debounce = true) {
        const mapped = prop === 'content' ? 'text'
            : prop === 'fontSizePt' ? 'fontSize'
            : prop;
        return this.updateObjProp(mapped, val, debounce);
    },

    updateObjProp(prop, val, debounce = false) {
        const obj = this.selectedObject;
        if (!obj) return;

        const numericProps = ['x', 'y', 'w', 'h', 'fontSize', 'radius', 'borderWidth', 'opacity', 'rotate'];
        if (numericProps.includes(prop)) {
            if (typeof val !== 'number' || !Number.isFinite(val)) return;
            if (prop === 'w') val = Math.max(4, val);
            else if (prop === 'h') val = Math.max(4, val);
            else if (prop === 'fontSize') val = Math.max(5, val);
            else if (prop === 'radius' || prop === 'borderWidth') val = Math.max(0, val);
            else if (prop === 'opacity') val = Math.max(0.05, Math.min(1, val));
        }
        if (prop === 'flipH' || prop === 'flipV') {
            val = Boolean(val);
        }

        if (prop === 'imageUrl') {
            const trimmed = String(val ?? '').trim();
            if (trimmed && !sanitizeUrl(trimmed)) {
                this.showToast('URL d\'image invalide (utilisez https://, data:image/ ou blob:)');
                this.renderInspector();
                return;
            }
            val = trimmed;
        }

        obj[prop] = val;
        if (prop === 'text' && 'content' in obj) obj.content = val;
        if (prop === 'fontSize' && 'fontSizePt' in obj) obj.fontSizePt = val;

        if (debounce) {
            this.renderCurrentFace();
            this.commitStateDebounced();
        } else {
            this.commitState(false);
            if (['x', 'y', 'w', 'h', 'category', 'dishId'].includes(prop)) {
                this.renderInspector();
            }
        }
    },

    updateFaceBgColor(color, debounce = false) {
        if (!color || typeof color !== 'string') return;
        this.currentFace.bgColor = color.trim();
        if (debounce) {
            this.renderCurrentFace();
            this.commitStateDebounced();
        } else {
            this.commitState(false);
            this.renderInspector();
        }
    },

    uploadPhotoFile(event) {
        const input = event.target;
        const file = input.files && input.files[0];
        if (!file || !this.selectedObject || this.selectedObject.type !== 'photo') {
            if (input) input.value = '';
            return;
        }
        if (file.type && !file.type.startsWith('image/')) {
            this.showToast('Format d\'image non supporté');
            input.value = '';
            return;
        }
        const targetObj = this.selectedObject;
        const reader = new FileReader();
        reader.onload = async (e) => {
            let dataUrl = e.target.result;
            try {
                dataUrl = await this.downscaleImageDataUrl(dataUrl, file);
            } catch (err) {
                console.warn('Compression photo impossible, image originale conservée :', err);
            }
            targetObj.imageUrl = dataUrl;
            this.commitState(false);
            this.renderInspector();
            if (!this.engine.lastSaveSuccess) {
                this.showToast('Photo ajoutée, mais le stockage local est plein : exportez le projet en JSON.');
            }
        };
        reader.onerror = () => {
            this.showToast('Erreur lors du chargement de la photo');
        };
        reader.readAsDataURL(file);
        input.value = '';
    },

    /**
     * Réduit les photos très lourdes avant stockage (localStorage limité à ~5 Mo).
     * 2400 px sur le grand côté suffisent pour ≈ 200 mm à 300 DPI.
     * Les PNG/GIF/SVG légers sont conservés tels quels (transparence).
     */
    downscaleImageDataUrl(dataUrl, file, maxSide = 2400, maxBytes = 1.2 * 1024 * 1024) {
        return new Promise((resolve, reject) => {
            const isLight = file.size <= maxBytes;
            const keepsAlpha = /image\/(png|gif|svg\+xml|webp)/i.test(file.type || '');
            const img = new Image();
            img.onload = () => {
                const longSide = Math.max(img.naturalWidth, img.naturalHeight);
                if (isLight && longSide <= maxSide) return resolve(dataUrl);
                if (keepsAlpha && isLight) return resolve(dataUrl);
                const ratio = Math.min(1, maxSide / longSide);
                const c = document.createElement('canvas');
                c.width = Math.max(1, Math.round(img.naturalWidth * ratio));
                c.height = Math.max(1, Math.round(img.naturalHeight * ratio));
                const cx = c.getContext('2d');
                if (keepsAlpha) {
                    cx.drawImage(img, 0, 0, c.width, c.height);
                    const mime = /webp/i.test(file.type || '') ? 'image/webp' : 'image/png';
                    const out = c.toDataURL(mime);
                    c.width = c.height = 0;
                    resolve(out.length < dataUrl.length ? out : dataUrl);
                } else {
                    cx.fillStyle = '#ffffff';
                    cx.fillRect(0, 0, c.width, c.height);
                    cx.drawImage(img, 0, 0, c.width, c.height);
                    const out = c.toDataURL('image/jpeg', 0.9);
                    c.width = c.height = 0;
                    resolve(out.length < dataUrl.length ? out : dataUrl);
                }
            };
            img.onerror = reject;
            img.src = dataUrl;
        });
    },

    alignSelected(mode) {
        const obj = this.selectedObject;
        if (!obj) return;
        if (mode === 'center_left_panel') {
            obj.x = +(85 - obj.w / 2).toFixed(1);
        } else if (mode === 'center_right_panel') {
            obj.x = +(255 - obj.w / 2).toFixed(1);
        } else if (mode === 'full_bleed') {
            obj.x = -3;
            obj.y = -3;
            obj.w = 346;
            obj.h = 306;
        }
        this.commitState(false);
        this.renderInspector();
    },

    duplicateSelected() {
        const obj = this.selectedObject;
        if (!obj) return;
        const copy = JSON.parse(JSON.stringify(obj));
        copy.id = generateUniqueId('obj');
        copy.name = (copy.name || copy.type) + ' (Copie)';
        copy.x = +(copy.x + 8).toFixed(1);
        copy.y = +(copy.y + 8).toFixed(1);
        this.currentFace.objects.push(copy);
        this.selectedObjectId = copy.id;
        this.commitState(false);
        this.renderInspector();
    },

    toggleLockSelected(targetId = null) {
        const id = targetId || this.selectedObjectId;
        if (!id) return;
        const obj = this.currentFace.objects.find(o => o.id === id);
        if (!obj) return;
        obj.locked = !obj.locked;
        this.commitState(false);
        this.renderInspector();
    },

    deleteSelected() {
        if (!this.selectedObjectId) return;
        const obj = this.selectedObject;
        if (obj && obj.locked) {
            this.showToast('Cet élément est verrouillé. Déverrouillez-le avant de le supprimer.');
            return;
        }
        this.currentFace.objects = this.currentFace.objects.filter(o => o.id !== this.selectedObjectId);
        this.selectedObjectId = null;
        this.commitState(false);
        this.renderInspector();
    },

    updateTopTransformBar() {
        const obj = this.selectedObject;
        const locked = !obj || this.previewMode;
        const bar = document.getElementById('top-transform-bar');
        const bx = document.getElementById('bar-x');
        const by = document.getElementById('bar-y');
        const bw = document.getElementById('bar-w');
        const bh = document.getElementById('bar-h');
        if (!bx || !by || !bw || !bh) return;
        bx.disabled = locked;
        by.disabled = locked;
        bw.disabled = locked;
        bh.disabled = locked;
        if (bar) bar.classList.toggle('opacity-50', locked);
        bx.value = obj ? obj.x : 0;
        by.value = obj ? obj.y : 0;
        bw.value = obj ? obj.w : 340;
        bh.value = obj ? obj.h : 300;
    },

    updateSelectedFromTopBar() {
        const obj = this.selectedObject;
        if (!obj || this.previewMode) return;
        const nx = parseFloat(document.getElementById('bar-x').value);
        const ny = parseFloat(document.getElementById('bar-y').value);
        const nw = parseFloat(document.getElementById('bar-w').value);
        const nh = parseFloat(document.getElementById('bar-h').value);
        if (Number.isFinite(nx)) obj.x = nx;
        if (Number.isFinite(ny)) obj.y = ny;
        if (Number.isFinite(nw)) obj.w = Math.max(8, nw);
        if (Number.isFinite(nh)) obj.h = Math.max(6, nh);
        this.commitState(false);
        this.renderInspector();
    },

    // ==================== LAYERS & PAGES NAVIGATOR ====================
    renderLayersList() {
        const list = document.getElementById('layers-list');
        const countEl = document.getElementById('layer-count');
        const objects = this.currentFace.objects;
        if (countEl) countEl.textContent = objects.length;
        if (!list) return;

        list.innerHTML = [...objects].reverse().map(obj => {
            const active = obj.id === this.selectedObjectId;
            return `
                <div data-action="select-object" data-obj-id="${escapeHTML(obj.id)}" class="px-2.5 py-1.5 rounded flex items-center justify-between cursor-pointer ${
                    active ? 'bg-blue-600/30 border border-blue-500 text-white' : 'bg-idInput hover:bg-white/5 text-gray-300 border border-transparent'
                }">
                    <div class="truncate flex items-center space-x-2 min-w-0">
                        <span class="w-2 h-2 rounded-full ${obj.locked ? 'bg-amber-400' : 'bg-blue-400'} shrink-0"></span>
                        <span class="truncate font-medium text-[11px]">${escapeHTML(obj.name || obj.title || obj.type)}</span>
                    </div>
                    <div class="flex items-center space-x-2 shrink-0 ml-2">
                        <button type="button" data-action="toggle-lock" data-obj-id="${escapeHTML(obj.id)}" class="p-0.5 text-[10px] ${obj.locked ? 'text-amber-400' : 'text-gray-500 hover:text-gray-300'}" title="${obj.locked ? 'Déverrouiller' : 'Verrouiller'}">
                            <i class="fa-solid ${obj.locked ? 'fa-lock' : 'fa-lock-open'}"></i>
                        </button>
                        <span class="font-mono text-[9px] text-gray-400">${obj.x},${obj.y}mm</span>
                    </div>
                </div>
            `;
        }).join('');
    },

    bringToFront() {
        const objs = this.currentFace.objects;
        const idx = objs.findIndex(o => o.id === this.selectedObjectId);
        if (idx >= 0 && idx < objs.length - 1) {
            const [obj] = objs.splice(idx, 1);
            objs.push(obj);
            this.commitState(false);
        }
    },

    bringForward() {
        const objs = this.currentFace.objects;
        const idx = objs.findIndex(o => o.id === this.selectedObjectId);
        if (idx >= 0 && idx < objs.length - 1) {
            [objs[idx], objs[idx + 1]] = [objs[idx + 1], objs[idx]];
            this.commitState(false);
        }
    },

    sendBackward() {
        const objs = this.currentFace.objects;
        const idx = objs.findIndex(o => o.id === this.selectedObjectId);
        if (idx > 0) {
            [objs[idx], objs[idx - 1]] = [objs[idx - 1], objs[idx]];
            this.commitState(false);
        }
    },

    sendToBack() {
        const objs = this.currentFace.objects;
        const idx = objs.findIndex(o => o.id === this.selectedObjectId);
        if (idx > 0) {
            const [obj] = objs.splice(idx, 1);
            objs.unshift(obj);
            this.commitState(false);
        }
    },

    renderSpreadsNavigator() {
        const container = document.getElementById('spreads-navigator-list');
        if (!container) return;

        const specs = this.engine.specs;
        let html = '';

        if (specs.hasFold) {
            const sheetCount = Math.ceil(this.engine.faces.length / 2);
            for (let sheet = 1; sheet <= sheetCount; sheet++) {
                const rectoIdx = (sheet - 1) * 2;
                const versoIdx = rectoIdx + 1;
                const recto = this.engine.faces[rectoIdx];
                const verso = this.engine.faces[versoIdx];

                html += `
                    <div class="bg-idInput border border-idBorder rounded p-2 space-y-2">
                        <div class="flex items-center justify-between text-[11px] font-bold text-gray-200 border-b border-idBorder pb-1">
                            <span><i class="fa-solid fa-scroll text-amber-400 mr-1"></i> Feuille ${sheet} (${specs.widthMm} × ${specs.heightMm} mm)</span>
                            <span class="font-mono text-[9px] text-gray-400">Pli ${specs.foldXMm || 170}mm</span>
                        </div>
                        <div class="grid grid-cols-2 gap-2">
                            <!-- Recto Miniature -->
                            ${recto ? `
                            <div data-action="go-to-face" data-index="${rectoIdx}" class="cursor-pointer p-1.5 rounded border transition ${
                                this.currentFaceIndex === rectoIdx ? 'border-blue-500 bg-blue-500/15' : 'border-idBorder hover:border-gray-500 bg-idPanel'
                            }">
                                <div class="h-14 w-full rounded-sm relative flex border border-black/40 overflow-hidden mb-1" style="background:${escapeHTML(recto.bgColor || '#fdfbf7')}">
                                    <div class="w-1/2 h-full border-r border-dashed border-cyan-500/70 flex items-center justify-center text-[8px] font-mono text-gray-500">Gauche</div>
                                    <div class="w-1/2 h-full flex items-center justify-center text-[8px] font-mono text-gray-500">Droite</div>
                                </div>
                                <div class="flex items-center justify-between text-[10px]">
                                    <span class="font-semibold text-white truncate">${escapeHTML(recto.name || 'Recto')}</span>
                                    <span class="text-gray-400 font-mono">${recto.objects.length} blocs</span>
                                </div>
                            </div>` : ''}

                            <!-- Verso Miniature -->
                            ${verso ? `
                            <div data-action="go-to-face" data-index="${versoIdx}" class="cursor-pointer p-1.5 rounded border transition ${
                                this.currentFaceIndex === versoIdx ? 'border-blue-500 bg-blue-500/15' : 'border-idBorder hover:border-gray-500 bg-idPanel'
                            }">
                                <div class="h-14 w-full rounded-sm relative flex border border-black/40 overflow-hidden mb-1" style="background:${escapeHTML(verso.bgColor || '#fdfbf7')}">
                                    <div class="w-1/2 h-full border-r border-dashed border-cyan-500/70 flex items-center justify-center text-[8px] font-mono text-gray-500">Gauche</div>
                                    <div class="w-1/2 h-full flex items-center justify-center text-[8px] font-mono text-gray-500">Droite</div>
                                </div>
                                <div class="flex items-center justify-between text-[10px]">
                                    <span class="font-semibold text-white truncate">${escapeHTML(verso.name || 'Verso')}</span>
                                    <span class="text-gray-400 font-mono">${verso.objects.length} blocs</span>
                                </div>
                            </div>` : ''}
                        </div>
                    </div>
                `;
            }
        } else {
            // Single Page Format (e.g. Flyer A4, Flyer A5)
            html += `
                <div class="flex items-center justify-between pb-1 mb-2">
                    <span class="text-[11px] font-bold text-cyan-300 uppercase tracking-wider">Pages du Flyer (${this.engine.faces.length})</span>
                    <button type="button" data-action="add-new-page" class="px-2 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-semibold text-[10px] flex items-center space-x-1 shadow">
                        <i class="fa-solid fa-plus"></i>
                        <span>+ Page</span>
                    </button>
                </div>
                <div class="space-y-2">
            `;
            this.engine.faces.forEach((face, idx) => {
                const isCurrent = this.currentFaceIndex === idx;
                html += `
                    <div data-action="go-to-face" data-index="${idx}" class="p-2 rounded-lg border cursor-pointer transition flex items-center justify-between ${
                        isCurrent ? 'border-cyan-400 bg-cyan-500/15 ring-1 ring-cyan-400' : 'border-idBorder bg-idInput hover:border-gray-500'
                    }">
                        <div class="flex items-center space-x-2.5 min-w-0">
                            <div class="w-8 h-11 rounded border border-black/40 shrink-0 shadow-sm flex items-center justify-center text-[9px] font-bold font-mono text-gray-600" style="background:${escapeHTML(face.bgColor || '#ffffff')}">
                                ${idx + 1}
                            </div>
                            <div class="min-w-0">
                                <div class="font-bold text-white text-xs truncate">${escapeHTML(face.name)}</div>
                                <div class="text-[10px] text-gray-400 font-mono">${face.objects.length} éléments • ${specs.widthMm}×${specs.heightMm}mm</div>
                            </div>
                        </div>
                        <div class="flex items-center space-x-1 shrink-0" data-action="noop">
                            <button type="button" data-action="duplicate-page" data-index="${idx}" class="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white text-[10px]" title="Dupliquer cette page">
                                <i class="fa-regular fa-clone"></i>
                            </button>
                            ${this.engine.faces.length > 1 ? `
                            <button type="button" data-action="remove-page" data-index="${idx}" class="p-1 hover:bg-rose-500/20 rounded text-gray-400 hover:text-rose-400 text-[10px]" title="Supprimer cette page">
                                <i class="fa-regular fa-trash-can"></i>
                            </button>` : ''}
                        </div>
                    </div>
                `;
            });
            html += `</div>`;
        }

        container.innerHTML = html;
    },

    addNewPage() {
        const newFace = this.engine.addPage();
        this.currentFaceIndex = this.engine.faces.length - 1;
        this.renderCurrentFace();
        this.renderInspector();
        this.renderSpreadsNavigator();
        this.showToast(`Nouvelle page ajoutée (${newFace.name}) !`);
    },

    duplicatePage(idx) {
        const dup = this.engine.duplicatePage(idx);
        if (dup) {
            this.currentFaceIndex = idx + 1;
            this.renderCurrentFace();
            this.renderInspector();
            this.renderSpreadsNavigator();
            this.showToast('Page dupliquée avec succès !');
        }
    },

    removePage(idx) {
        try {
            const ok = this.engine.removePage(idx);
            if (ok) {
                this.currentFaceIndex = Math.min(idx, this.engine.faces.length - 1);
                this.renderCurrentFace();
                this.renderInspector();
                this.renderSpreadsNavigator();
                this.showToast('Page supprimée.');
            }
        } catch (e) {
            this.showToast(e.message || 'Erreur lors de la suppression.');
        }
    },

    goToFace(index) {
        if (!Number.isFinite(index)) return;
        this.currentFaceIndex = Math.max(0, Math.min(this.engine.faces.length - 1, index));
        this.selectedObjectId = null;
        this.renderCurrentFace();
        this.renderInspector();
    },

    prevFace() {
        this.goToFace((this.currentFaceIndex + this.engine.faces.length - 1) % this.engine.faces.length);
    },

    nextFace() {
        this.goToFace((this.currentFaceIndex + 1) % this.engine.faces.length);
    },

    switchLeftTab(tab) {
        const blocksTab = document.getElementById('left-tab-blocks');
        const illuTab = document.getElementById('left-tab-illustrations');
        const pagesTab = document.getElementById('left-tab-pages');
        const btnBlocks = document.getElementById('tab-btn-blocks');
        const btnIllu = document.getElementById('tab-btn-illustrations');
        const btnPages = document.getElementById('tab-btn-pages');

        const inactiveBtn = 'flex-1 py-2 text-center border-b-2 border-transparent text-gray-400 hover:text-gray-200';
        const activeBtn = 'flex-1 py-2 text-center border-b-2 border-blue-500 text-white bg-idPanel';

        if (blocksTab) blocksTab.classList.add('hidden');
        if (illuTab) illuTab.classList.add('hidden');
        if (pagesTab) pagesTab.classList.add('hidden');

        if (btnBlocks) btnBlocks.className = inactiveBtn;
        if (btnIllu) btnIllu.className = inactiveBtn;
        if (btnPages) btnPages.className = inactiveBtn;

        if (tab === 'blocks') {
            if (blocksTab) blocksTab.classList.remove('hidden');
            if (btnBlocks) btnBlocks.className = activeBtn;
        } else if (tab === 'illustrations') {
            if (illuTab) illuTab.classList.remove('hidden');
            if (btnIllu) btnIllu.className = activeBtn;
            this.renderIllustrationsTab();
        } else if (tab === 'pages') {
            if (pagesTab) pagesTab.classList.remove('hidden');
            if (btnPages) btnPages.className = activeBtn;
            this.renderSpreadsNavigator();
        }
    }
});
