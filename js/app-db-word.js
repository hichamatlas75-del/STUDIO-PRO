/**
 * MODULE 2D: Centralized Dishes Database & Smart Word (.docx/.txt) Importer (app-db-word.js)
 */
Object.assign(InMenuStudioApp.prototype, {
    // ==================== CENTRALIZED DISH & PRICE DATABASE MODAL ====================
    populateQuickDishSelect() {
        const select = document.getElementById('quick-dish-select');
        if (!select) return;
        select.innerHTML = this.engine.dishesDB.map(d =>
            `<option value="${escapeHTML(d.id)}">${escapeHTML(d.name)} (${escapeHTML(d.price)})</option>`
        ).join('');
    },

    refreshDbCategoryFilter(preserveSelection = true) {
        const filterSelect = document.getElementById('db-filter-cat');
        if (!filterSelect) return;
        const prev = preserveSelection ? filterSelect.value : 'ALL';
        const cats = this.engine.getCategories();
        filterSelect.innerHTML = `<option value="ALL">Toutes les catégories (${this.engine.dishesDB.length} plats)</option>` +
            cats.map(c => `<option value="${escapeHTML(c)}">${escapeHTML(c)}</option>`).join('');
        if (preserveSelection && prev && (prev === 'ALL' || cats.includes(prev))) {
            filterSelect.value = prev;
        } else {
            filterSelect.value = 'ALL';
        }
    },

    openDatabaseModal() {
        this._dbDirty = false;
        this.refreshDbCategoryFilter(false);
        this.renderDatabaseTable();
        const modal = document.getElementById('modal-database');
        if (modal) modal.classList.remove('hidden');
    },

    closeDatabaseModal() {
        const modal = document.getElementById('modal-database');
        if (modal) modal.classList.add('hidden');
        if (this._dbDirty) {
            this._dbDirty = false;
            this.commitState(false);
            this.showToast('Base de données synchronisée sur les 10 faces !');
        } else {
            this.renderCurrentFace();
        }
        this.populateQuickDishSelect();
        this.renderInspector();
    },

    renderDatabaseTable() {
        const filterEl = document.getElementById('db-filter-cat');
        const filter = filterEl ? filterEl.value : 'ALL';
        const searchEl = document.getElementById('db-search-input');
        const query = (searchEl ? searchEl.value : '').trim().toLowerCase();
        const tbody = document.getElementById('db-table-body');
        if (!tbody) return;
        let list = filter === 'ALL'
            ? this.engine.dishesDB
            : this.engine.dishesDB.filter(d => d.category === filter);

        if (query) {
            list = list.filter(d =>
                (d.name && d.name.toLowerCase().includes(query)) ||
                (d.desc && d.desc.toLowerCase().includes(query)) ||
                (d.price && d.price.toLowerCase().includes(query)) ||
                (d.id && d.id.toLowerCase().includes(query)) ||
                (d.category && d.category.toLowerCase().includes(query))
            );
        }

        if (list.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" class="py-6 text-center text-gray-500 text-xs">${query ? 'Aucun plat ne correspond à votre recherche.' : 'Aucun plat dans cette catégorie.'}</td></tr>`;
            return;
        }

        tbody.innerHTML = list.map(dish => {
            const isActive = dish.active !== false;
            return `
            <tr class="hover:bg-white/5 ${!isActive ? 'opacity-60 bg-rose-950/10' : ''}" data-dish-id="${escapeHTML(dish.id)}">
                <td class="py-2 px-2 font-mono text-[11px] text-gray-400">${escapeHTML(dish.id)}</td>
                <td class="py-2 px-2">
                    <input type="text" value="${escapeHTML(dish.category)}" data-change="db-dish-field" data-field="category" class="w-full bg-idInput border border-idBorder rounded px-2 py-1 text-amber-300 font-semibold">
                </td>
                <td class="py-2 px-2">
                    <input type="text" value="${escapeHTML(dish.name)}" data-change="db-dish-field" data-field="name" class="w-full bg-idInput border border-idBorder rounded px-2 py-1 text-white font-semibold">
                </td>
                <td class="py-2 px-2">
                    <input type="text" value="${escapeHTML(dish.desc)}" data-change="db-dish-field" data-field="desc" class="w-full bg-idInput border border-idBorder rounded px-2 py-1 text-gray-300">
                </td>
                <td class="py-2 px-2">
                    <input type="text" value="${escapeHTML(dish.price)}" data-change="db-dish-field" data-field="price" class="w-full bg-idInput border border-idBorder rounded px-2 py-1 text-emerald-400 font-mono font-bold text-right">
                </td>
                <td class="py-2 px-2">
                    <select data-change="db-dish-field" data-field="badge" class="w-full bg-idInput border border-idBorder rounded px-1.5 py-1 text-white text-[11px]">
                        <option value="" ${!dish.badge ? 'selected' : ''}>Aucun</option>
                        <option value="NOUVEAU" ${dish.badge === 'NOUVEAU' ? 'selected' : ''}>NOUVEAU</option>
                        <option value="CHEF" ${dish.badge === 'CHEF' ? 'selected' : ''}>★ CHEF</option>
                    </select>
                </td>
                <td class="py-2 px-2 text-center">
                    <button type="button" data-action="toggle-dish-active" data-dish-id="${escapeHTML(dish.id)}" class="px-2 py-1 rounded text-[10px] font-bold border transition ${
                        isActive
                            ? 'bg-emerald-600/20 hover:bg-emerald-600/35 text-emerald-300 border-emerald-500/40'
                            : 'bg-rose-600/20 hover:bg-rose-600/35 text-rose-300 border-rose-500/40'
                    }" title="${isActive ? 'Plat actif dans les cartes (Cliquez pour marquer En Rupture)' : 'En rupture (Masqué des cartes, cliquez pour réactiver)'}">
                        <i class="fa-solid ${isActive ? 'fa-check' : 'fa-ban'} mr-1"></i>${isActive ? 'Actif' : 'Rupture'}
                    </button>
                </td>
                <td class="py-2 px-2 text-right space-x-1 whitespace-nowrap">
                    <button type="button" data-action="create-dish-story" data-dish-id="${escapeHTML(dish.id)}" class="bg-gradient-to-r from-purple-600/40 to-pink-600/40 hover:from-purple-600 hover:to-pink-600 border border-pink-500/40 text-pink-200 hover:text-white px-2 py-1 rounded text-[10px] font-bold" title="Créer une Story Instagram pour ce plat">
                        📱 Story
                    </button>
                    <button type="button" data-action="insert-dish-from-modal" class="bg-blue-600/30 hover:bg-blue-600 text-blue-200 hover:text-white px-2 py-1 rounded text-[10px]" title="Poser ce plat sur la planche active">
                        + Planche
                    </button>
                    <button type="button" data-action="delete-dish-db" class="bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white px-2 py-1 rounded text-[10px]">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            </tr>
            `;
        }).join('');
    },

    updateDishDB(dishId, field, value) {
        const dish = this.engine.getDishById(dishId);
        if (!dish) return;
        let clean = String(value ?? '');
        if (field === 'category') {
            clean = clean.trim() || 'GÉNÉRAL';
        } else if (field === 'name') {
            clean = clean.trim() || 'Plat Signature';
        } else if (field === 'price') {
            clean = clean.trim();
        } else if (field === 'badge') {
            clean = (clean === 'NOUVEAU' || clean === 'CHEF') ? clean : '';
        }
        dish[field] = clean;
        this._dbDirty = true;
        if (field === 'category') {
            this.refreshDbCategoryFilter(true);
            const filterEl = document.getElementById('db-filter-cat');
            if (filterEl && filterEl.value !== 'ALL') {
                this.renderDatabaseTable();
            }
        }
        this.renderCurrentFace();
        this.commitStateDebounced();
    },

    addNewDishToDB() {
        const newId = this.engine.generateUniqueDishId();
        this.engine.dishesDB.unshift({
            id: newId,
            category: 'NOUVELLE CATÉGORIE',
            name: 'Nouveau Plat Signature',
            desc: 'Description gourmande et ingrédients frais',
            price: '75 DH',
            badge: 'NOUVEAU'
        });
        this._dbDirty = true;
        this.refreshDbCategoryFilter(false);
        this.renderDatabaseTable();
        this.commitState(false);
    },

    deleteDishFromDB(id) {
        const dish = this.engine.getDishById(id);
        if (!dish) return;
        // Compte les blocs « Ligne Plat » qui référencent ce plat sur les 10 faces
        const refCount = this.engine.faces.reduce((acc, f) =>
            acc + f.objects.filter(o => o.type === 'dish_item' && o.dishId === id).length, 0);
        const warn = refCount > 0
            ? `\n\n⚠ ${refCount} bloc(s) « Ligne Plat » utilisent ce plat et afficheront « Plat Personnalisé ».`
            : '';
        if (!window.confirm(`Supprimer « ${dish.name} » de la base de données ?${warn}`)) return;
        this.engine.dishesDB = this.engine.dishesDB.filter(d => d.id !== id);
        this._dbDirty = true;
        this.refreshDbCategoryFilter(true);
        this.renderDatabaseTable();
        this.commitState(false);
    },

    insertDishFromModal(dishId) {
        this.closeDatabaseModal();
        this.insertSelectedQuickDish(dishId);
    },

    toggleDishActiveStatus(dishId) {
        const dish = this.engine.getDishById(dishId);
        if (!dish) return;
        dish.active = dish.active === false ? true : false;
        this._dbDirty = true;
        this.renderDatabaseTable();
        this.renderCurrentFace();
        this.commitStateDebounced();
        this.showToast(`Plat « ${dish.name} » marqué ${dish.active ? 'Actif' : 'En Rupture'}.`);
    },

    createStoryFromDish(dishId) {
        const dish = this.engine.getDishById(dishId);
        if (!dish) return;

        // Magic Resize ou bascule vers format INSTA_STORY (108 × 192 mm)
        this.engine.changeFormat('INSTA_STORY');
        const storyFace = {
            id: generateUniqueId('face_story'),
            name: `Story - ${dish.name}`,
            bgColor: '#121212',
            objects: [
                // Fond subtil avec bordure dorée
                {
                    id: generateUniqueId('obj'),
                    type: 'shape',
                    name: 'Cadre Chic Or',
                    x: 4,
                    y: 4,
                    w: 100,
                    h: 184,
                    bgColor: 'transparent',
                    borderColor: '#c8a96a',
                    borderWidth: 1.5,
                    radius: 4,
                    opacity: 0.8
                },
                // En-tête Logo
                {
                    id: generateUniqueId('obj'),
                    type: 'logo',
                    name: 'Logo Grey Corner',
                    title: 'GREY CORNER',
                    subtitle: 'CAFÉ • RESTAURANT',
                    color: '#c8a96a',
                    x: 14,
                    y: 12,
                    w: 80,
                    h: 18
                },
                // Badge
                {
                    id: generateUniqueId('obj'),
                    type: 'badge_new',
                    name: 'Badge Promo',
                    text: dish.badge ? (dish.badge === 'CHEF' ? '★ COUP DE CŒUR DU CHEF' : 'NOUVEAU SUR LA CARTE') : 'PLAT DU JOUR',
                    bgColor: dish.badge === 'CHEF' ? '#c8a96a' : '#e11d48',
                    textColor: '#ffffff',
                    radius: 6,
                    x: 20,
                    y: 35,
                    w: 68,
                    h: 8
                },
                // Photo centrale gourmande avec masque arrondi et ombre
                {
                    id: generateUniqueId('obj'),
                    type: 'photo',
                    name: 'Photo Plat du Jour',
                    caption: dish.name,
                    imageUrl: '',
                    maskShape: 'rounded',
                    filterPreset: 'warm',
                    brightness: 104,
                    contrast: 108,
                    saturate: 110,
                    shadowBlur: 20,
                    shadowOffsetY: 8,
                    shadowOpacity: 0.6,
                    borderColor: '#c8a96a',
                    borderWidth: 2,
                    radius: 8,
                    x: 14,
                    y: 48,
                    w: 80,
                    h: 68
                },
                // Titre du plat
                {
                    id: generateUniqueId('obj'),
                    type: 'text',
                    name: 'Titre Plat',
                    text: dish.name.toUpperCase(),
                    fontFamily: 'Playfair Display',
                    fontSize: 16,
                    fontWeight: 700,
                    color: '#ffffff',
                    align: 'center',
                    lineHeight: 1.2,
                    x: 10,
                    y: 122,
                    w: 88,
                    h: 14
                },
                // Description
                {
                    id: generateUniqueId('obj'),
                    type: 'text',
                    name: 'Description Plat',
                    text: dish.desc || 'Préparé chaque matin avec des ingrédients frais du terroir.',
                    fontFamily: 'Inter',
                    fontSize: 10,
                    fontWeight: 400,
                    color: '#cbd5e1',
                    align: 'center',
                    lineHeight: 1.3,
                    x: 12,
                    y: 138,
                    w: 84,
                    h: 16
                },
                // Prix
                {
                    id: generateUniqueId('obj'),
                    type: 'text',
                    name: 'Prix Story',
                    text: dish.price,
                    fontFamily: 'Montserrat',
                    fontSize: 22,
                    fontWeight: 800,
                    color: '#f59e0b',
                    align: 'center',
                    x: 24,
                    y: 156,
                    w: 60,
                    h: 12
                },
                // Footer Instagram
                {
                    id: generateUniqueId('obj'),
                    type: 'icon_badge',
                    name: 'Footer Instagram',
                    iconId: 'instagram',
                    text: '@GREYCORNERFES',
                    color: '#c8a96a',
                    textColor: '#94a3b8',
                    fontSize: 9.5,
                    x: 20,
                    y: 172,
                    w: 68,
                    h: 8
                }
            ]
        };

        this.engine.faces = [storyFace];
        this.currentFaceIndex = 0;
        this.selectedObjectId = null;
        this.selectedObjectIds = [];
        this.closeDatabaseModal();
        this.commitState(false);
        this.updateFormatHeaderUI();
        this.renderCurrentFace();
        this.renderInspector();
        this.showToast(`Story Instagram générée pour « ${dish.name} » ! Exportez en PNG HD depuis le menu Export.`);
    },

    exportDatabaseCSV() {
        const csv = this.engine.exportDishesCSV();
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `Menu_Plats_Grey_Corner_${new Date().toISOString().slice(0, 10)}.csv`;
        link.href = url;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        this.showToast('Base de plats exportée en CSV (compatible Excel / Google Sheets) !');
    },

    triggerImportDatabaseCSV() {
        const input = document.getElementById('db-csv-file-input');
        if (input) input.click();
    },

    async importDatabaseCSV(event) {
        const input = event.target;
        const file = input && input.files && input.files[0];
        if (!file) return;
        try {
            const text = await file.text();
            const count = this.engine.importDishesCSV(text);
            this._dbDirty = true;
            this.refreshDbCategoryFilter(false);
            this.renderDatabaseTable();
            this.renderCurrentFace();
            this.commitState(false);
            this.showToast(`${count} plats importés depuis le fichier CSV !`);
        } catch (err) {
            console.error('Erreur import CSV:', err);
            this.showToast('Erreur lors de l\'importation du fichier CSV.');
        }
        input.value = '';
    },

    // ==================== SMART WORD (.DOCX / .TXT) IMPORTER & AUTO-LAYOUT CONTROLLER ====================
    initWordDropzone() {
        const dropzone = document.getElementById('word-dropzone');
        if (!dropzone) return;

        const highlight = (active) => {
            dropzone.classList.toggle('border-indigo-400', active);
            dropzone.classList.toggle('bg-indigo-500/20', active);
        };

        ['dragenter', 'dragover'].forEach(evtName => {
            dropzone.addEventListener(evtName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                highlight(true);
            });
        });

        ['dragleave', 'dragend'].forEach(evtName => {
            dropzone.addEventListener(evtName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                highlight(false);
            });
        });

        dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            highlight(false);
            const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
            if (file) {
                this.processWordFile(file);
            }
        });
    },

    updateWordModeCardsUI() {
        const cards = document.querySelectorAll('#word-import-mode-group .word-mode-card');
        cards.forEach(card => {
            const radio = card.querySelector('input[name="word-import-mode"]');
            const checked = !!(radio && radio.checked);
            card.className = checked
                ? 'word-mode-card flex items-start space-x-2.5 p-2.5 rounded-lg border border-blue-500 bg-blue-500/10 cursor-pointer transition'
                : 'word-mode-card flex items-start space-x-2.5 p-2.5 rounded-lg border border-idBorder bg-idInput hover:border-gray-500 cursor-pointer transition';
        });
    },

    openWordImportModal() {
        const modal = document.getElementById('modal-word-import');
        if (!modal) return;
        modal.classList.remove('hidden');
        this.updateWordModeCardsUI();
        const textarea = document.getElementById('word-raw-textarea');
        if (textarea && !textarea.value.trim()) {
            this.loadFull10FacesSampleWordText();
        } else {
            this.parseWordRawText();
        }
    },

    closeWordImportModal() {
        const modal = document.getElementById('modal-word-import');
        if (modal) modal.classList.add('hidden');
    },

    loadFull10FacesSampleWordText() {
        const sample = WordMenuImporter.getSampleFullMenuText();
        const textarea = document.getElementById('word-raw-textarea');
        if (textarea) textarea.value = sample;
        this.parseWordRawText();
        const dishesCount = this.wordParsedDishes ? this.wordParsedDishes.length : 0;
        const catsCount = new Set((this.wordParsedDishes || []).map(d => d.category)).size;
        const statusEl = document.getElementById('word-file-status');
        if (statusEl) {
            statusEl.innerHTML = `
                <span class="text-amber-300"><i class="fa-solid fa-check-circle mr-1.5"></i>Exemple complet chargé (${catsCount} catégories, ${dishesCount} plats)</span>
                <button type="button" data-action="parse-word-raw" class="text-blue-400 hover:underline font-semibold">Ré-analyser</button>
            `;
        }
    },

    async handleWordFileUpload(event) {
        const input = event.target;
        const file = input.files && input.files[0];
        if (!file) return;
        await this.processWordFile(file);
        input.value = '';
    },

    async processWordFile(file) {
        if (!file) return;
        const statusEl = document.getElementById('word-file-status');
        const textarea = document.getElementById('word-raw-textarea');
        const lowerName = file.name.toLowerCase();

        if (lowerName.endsWith('.doc') && !lowerName.endsWith('.docx')) {
            if (statusEl) {
                statusEl.innerHTML = `<span class="text-rose-400"><i class="fa-solid fa-triangle-exclamation mr-1.5"></i>Format .doc ancien non supporté. Enregistrez votre document en .docx ou .txt.</span>`;
            }
            this.showToast('Veuillez convertir le fichier .doc en .docx');
            return;
        }

        if (statusEl) {
            statusEl.innerHTML = `<span class="text-blue-300"><i class="fa-solid fa-spinner fa-spin mr-1.5"></i>Lecture de « ${escapeHTML(file.name)} » en cours...</span>`;
        }

        try {
            if (lowerName.endsWith('.docx')) {
                if (typeof mammoth === 'undefined') {
                    throw new Error('Librairie Mammoth.js non chargée');
                }
                const arrayBuffer = await file.arrayBuffer();
                textarea.value = await WordMenuImporter.extractTextFromDocx(arrayBuffer);
            } else {
                textarea.value = await file.text();
            }

            if (statusEl) {
                statusEl.innerHTML = `
                    <span class="text-emerald-400"><i class="fa-solid fa-file-circle-check mr-1.5"></i>Fichier « ${escapeHTML(file.name)} » converti avec succès</span>
                    <button type="button" data-action="parse-word-raw" class="text-blue-400 hover:underline font-semibold">Actualiser</button>
                `;
            }
            this.parseWordRawText();
            this.showToast(`Fichier Word « ${file.name} » analysé !`);
        } catch (err) {
            console.error(err);
            if (statusEl) {
                statusEl.innerHTML = `<span class="text-rose-400"><i class="fa-solid fa-triangle-exclamation mr-1.5"></i>Erreur de lecture du fichier Word.</span>`;
            }
        }
    },

    parseWordRawText() {
        clearTimeout(this._wordParseTimer);
        const textarea = document.getElementById('word-raw-textarea');
        const rawText = textarea ? textarea.value : '';
        this.wordParsedDishes = WordMenuImporter.parseText(rawText);
        this.renderWordParsedPreview();
    },

    // Évite de ré-analyser tout le menu (et reconstruire l'aperçu) à chaque frappe
    parseWordRawTextDebounced() {
        clearTimeout(this._wordParseTimer);
        this._wordParseTimer = setTimeout(() => this.parseWordRawText(), 300);
    },

    renderWordParsedPreview() {
        const dishes = this.wordParsedDishes || [];
        const cats = [...new Set(dishes.map(d => d.category))];
        const summaryEl = document.getElementById('word-parsed-summary');
        if (summaryEl) summaryEl.textContent = `${cats.length} Catégories • ${dishes.length} Plats`;

        const container = document.getElementById('word-parsed-preview-container');
        if (!container) return;
        if (dishes.length === 0) {
            container.innerHTML = `
                <div class="h-full flex flex-col items-center justify-center text-center p-6 text-gray-500 border border-dashed border-idBorder rounded-lg">
                    <i class="fa-solid fa-file-lines text-2xl mb-2"></i>
                    <p class="text-xs text-gray-400">Aucun plat détecté pour le moment.</p>
                    <p class="text-[10px] mt-1">Écrivez chaque plat avec son prix en fin de ligne (ex: <code class="text-amber-300">Brunch Royal - Description ... 115 DH</code>)</p>
                </div>
            `;
            return;
        }

        container.innerHTML = cats.map(cat => {
            const catItems = dishes.filter(d => d.category === cat);
            const rowsHTML = catItems.map(item => `
                <div data-item-id="${escapeHTML(item.id)}" class="grid grid-cols-12 gap-1.5 items-center bg-idBg/70 p-1.5 rounded border border-idBorder/60 text-[11px]">
                    <input type="text" value="${escapeHTML(item.name)}" data-change="word-preview-field" data-field="name" class="col-span-4 bg-idInput border border-idBorder rounded px-1.5 py-1 text-white font-semibold" title="Nom du plat">
                    <input type="text" value="${escapeHTML(item.desc)}" data-change="word-preview-field" data-field="desc" class="col-span-5 bg-idInput border border-idBorder rounded px-1.5 py-1 text-gray-300" placeholder="Description / ingrédients">
                    <input type="text" value="${escapeHTML(item.price)}" data-change="word-preview-field" data-field="price" class="col-span-2 bg-idInput border border-idBorder rounded px-1.5 py-1 text-emerald-400 font-mono font-bold text-right">
                    <button type="button" data-action="toggle-word-badge" class="col-span-1 py-1 rounded text-[9px] font-bold text-center ${
                        item.badge === 'NOUVEAU' ? 'bg-rose-600 text-white' : (item.badge === 'CHEF' ? 'bg-amber-600 text-white' : 'bg-idInput text-gray-500 border border-idBorder')
                    }" title="Basculer badge NOUVEAU / CHEF">
                        ${item.badge === 'NOUVEAU' ? 'NEW' : (item.badge === 'CHEF' ? '★' : '—')}
                    </button>
                </div>
            `).join('');

            return `
                <div class="bg-idInput/60 border border-idBorder rounded-lg p-2.5 space-y-1.5">
                    <div class="flex items-center justify-between border-b border-idBorder pb-1">
                        <span class="font-bold text-amber-400 text-xs flex items-center">
                            <i class="fa-solid fa-grip-lines-vertical mr-1.5 text-amber-500"></i>${escapeHTML(cat)}
                        </span>
                        <span class="text-[10px] font-mono text-gray-400">${catItems.length} plats</span>
                    </div>
                    <div class="space-y-1">${rowsHTML}</div>
                </div>
            `;
        }).join('');
    },

    updateWordPreviewItem(id, field, value) {
        const item = (this.wordParsedDishes || []).find(d => d.id === id);
        if (item) item[field] = value;
    },

    toggleWordPreviewBadge(id) {
        const item = (this.wordParsedDishes || []).find(d => d.id === id);
        if (!item) return;
        if (!item.badge) item.badge = 'NOUVEAU';
        else if (item.badge === 'NOUVEAU') item.badge = 'CHEF';
        else item.badge = '';
        this.renderWordParsedPreview();
    },

    executeWordImportAndLayout() {
        if (!this.wordParsedDishes || this.wordParsedDishes.length === 0) {
            this.showToast('Aucun plat à importer.');
            return;
        }

        const modeRadio = document.querySelector('input[name="word-import-mode"]:checked');
        const mode = modeRadio ? modeRadio.value : 'full_auto_spreads';
        const theme = document.getElementById('word-layout-theme').value;
        const brandTitle = document.getElementById('word-brand-title').value || 'GREY CORNER';
        const brandSub = document.getElementById('word-brand-sub').value || 'CAFÉ • RESTAURANT • SINCE 2024';

        const summary = WordMenuImporter.autoLayoutAcrossSpreads(this.engine, this.wordParsedDishes, {
            mode,
            theme,
            brandTitle,
            brandSub,
            activeFaceIndex: this.currentFaceIndex
        });

        this.selectedObjectId = null;
        if (mode === 'full_auto_spreads') {
            this.currentFaceIndex = 1; // Jump to Sheet 1 Verso (first interior menu spread)
        }

        this.commitState(false);
        this.populateQuickDishSelect();
        this.renderInspector();
        this.closeWordImportModal();

        const catsCount = this.engine.getCategories().length;
        const omittedDishes = (summary && summary.omittedDishes) || 0;
        if (summary && summary.mode !== 'db_only' && omittedDishes > 0) {
            const omittedCats = summary.omittedCategories ? summary.omittedCategories.length : 0;
            this.showToast(`Importé (${this.wordParsedDishes.length} plats), mais ${omittedDishes} plat(s)${omittedCats ? ` dont ${omittedCats} catégorie(s) entière(s)` : ''} n'ont pas pu être placés : ajoutez-les manuellement depuis la BDD.`);
        } else {
            this.showToast(`Menu Word intégré : ${this.wordParsedDishes.length} plats (${catsCount} catégories) mis en page !`);
        }
    },

    downloadWordTemplateSample() {
        const content = WordMenuImporter.getSampleFullMenuText();
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = 'Modele_Menu_Simple_Pour_Import_InMenu.txt';
        link.href = url;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        this.showToast('Modèle de menu téléchargé !');
    }
});
