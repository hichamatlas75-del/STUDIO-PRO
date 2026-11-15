/**
 * MODULE 2F: Print PDF/PNG Export Controller & Google Drive / Local Disk Sync (app-io.js)
 */
Object.assign(InMenuStudioApp.prototype, {
    // ==================== EXPORT PDF (WITH CROP & FOLD MARKS) & PNG ====================
    openExportModal() {
        const modal = document.getElementById('modal-export');
        if (modal) modal.classList.remove('hidden');

        // Restore or smartly pick default export format
        const fmtSelect = document.getElementById('exp-target-format');
        if (fmtSelect) {
            let savedFmt = null;
            try { savedFmt = localStorage.getItem('inmenu_export_target_format'); } catch (_) { /* ignore */ }
            if (savedFmt && Array.from(fmtSelect.options).some(o => o.value === savedFmt)) {
                fmtSelect.value = savedFmt;
            } else {
                // Default to A4 (210 × 297 mm) for separate menu pages
                fmtSelect.value = 'a4_portrait';
            }
        }

        // If the project is a single-page A4 Portrait without fold, default scope to 'all' (1 page per face)
        const scopeSelect = document.getElementById('exp-scope');
        if (scopeSelect && this.engine && this.engine.specs) {
            if (!this.engine.specs.hasFold && this.engine.specs.widthMm === 210 && this.engine.specs.heightMm === 297) {
                scopeSelect.value = 'all';
            }
        }

        this.updateExportModalUI();
    },

    closeExportModal() {
        const modal = document.getElementById('modal-export');
        if (modal) modal.classList.add('hidden');
    },

    selectExportFormat(formatKey) {
        const fmtSelect = document.getElementById('exp-target-format');
        if (fmtSelect && formatKey) {
            fmtSelect.value = formatKey;
            try { localStorage.setItem('inmenu_export_target_format', formatKey); } catch (_) { /* ignore */ }
        }
        this.updateExportModalUI();
    },

    getSelectedExportFormatSpecs() {
        const fmtSelect = document.getElementById('exp-target-format');
        const key = fmtSelect ? fmtSelect.value : 'a4_portrait';
        const specs = (this.engine && this.engine.specs) ? this.engine.specs : { widthMm: 340, heightMm: 300, bleedMm: 3 };

        try { localStorage.setItem('inmenu_export_target_format', key); } catch (_) { /* ignore */ }

        switch (key) {
            case 'a4_portrait':
                return {
                    key: 'a4_portrait',
                    widthMm: 210,
                    heightMm: 297,
                    label: 'Format A4 (210 × 297 mm)',
                    shortLabel: 'A4 210×297 mm',
                    fileTag: 'A4_210x297mm'
                };
            case 'panel_170x300':
                return {
                    key: 'panel_170x300',
                    widthMm: 170,
                    heightMm: 300,
                    label: 'Format 170 × 300 mm (17 × 30 cm)',
                    shortLabel: '170×300 mm',
                    fileTag: '170x300mm'
                };
            case 'a4_landscape':
                return {
                    key: 'a4_landscape',
                    widthMm: 297,
                    heightMm: 210,
                    label: 'Format A4 Paysage (297 × 210 mm)',
                    shortLabel: 'A4 Paysage 297×210 mm',
                    fileTag: 'A4_Paysage_297x210mm'
                };
            case 'spread_340x300':
                return {
                    key: 'spread_340x300',
                    widthMm: 340,
                    heightMm: 300,
                    label: 'Format Planche 340 × 300 mm',
                    shortLabel: '340×300 mm',
                    fileTag: '340x300mm'
                };
            case 'native':
            default: {
                const w = specs.widthMm || 210;
                const h = specs.heightMm || 297;
                return {
                    key: 'native',
                    widthMm: w,
                    heightMm: h,
                    label: `Format Natif (${w} × ${h} mm)`,
                    shortLabel: `${w}×${h} mm`,
                    fileTag: `${w}x${h}mm`
                };
            }
        }
    },

    updateExportModalUI() {
        if (!this.engine || !this.engine.specs) return;
        const specs = this.engine.specs;
        const fmt = this.getSelectedExportFormatSpecs();
        const bleedMm = specs.bleedMm || 3;
        const includeBleedEl = document.getElementById('exp-bleed');
        const hasBleed = includeBleedEl ? includeBleedEl.checked : true;
        const bleedTotalW = fmt.widthMm + (hasBleed ? bleedMm * 2 : 0);
        const bleedTotalH = fmt.heightMm + (hasBleed ? bleedMm * 2 : 0);
        const facesCount = this.engine.faces.length || 1;
        const totalCutPanels = facesCount * 2;

        // Highlight quick-choice buttons
        const btnA4 = document.getElementById('btn-exp-fmt-a4');
        const btn170 = document.getElementById('btn-exp-fmt-170');
        if (btnA4) {
            btnA4.className = fmt.key === 'a4_portrait'
                ? 'flex items-center space-x-2.5 p-2.5 rounded-lg border-2 border-emerald-500 bg-emerald-500/15 text-left transition shadow-md'
                : 'flex items-center space-x-2.5 p-2.5 rounded-lg border border-idBorder bg-idInput text-left transition hover:border-emerald-500/50';
        }
        if (btn170) {
            btn170.className = fmt.key === 'panel_170x300'
                ? 'flex items-center space-x-2.5 p-2.5 rounded-lg border-2 border-blue-500 bg-blue-500/15 text-left transition shadow-md'
                : 'flex items-center space-x-2.5 p-2.5 rounded-lg border border-idBorder bg-idInput text-left transition hover:border-blue-500/50';
        }

        const badgeEl = document.getElementById('exp-active-format-badge');
        if (badgeEl) badgeEl.textContent = fmt.shortLabel;

        const trimEl = document.getElementById('exp-spec-trim');
        if (trimEl) trimEl.textContent = `${fmt.widthMm} × ${fmt.heightMm} mm${fmt.key === 'a4_portrait' ? ' (A4)' : ''}`;

        const panelEl = document.getElementById('exp-spec-panel');
        if (panelEl) panelEl.textContent = `${specs.widthMm} × ${specs.heightMm} mm (${facesCount} page${facesCount > 1 ? 's' : ''})`;

        const bleedEl = document.getElementById('exp-spec-bleed');
        if (bleedEl) {
            bleedEl.textContent = hasBleed
                ? `+${bleedMm} mm (${bleedTotalW} × ${bleedTotalH} mm)`
                : `Sans fond perdu (${fmt.widthMm} × ${fmt.heightMm} mm)`;
        }

        const scopeSelect = document.getElementById('exp-scope');
        const scopeVal = scopeSelect ? scopeSelect.value : 'single_pages_20';

        // Update scope options text with chosen format dimensions
        if (scopeSelect) {
            const optSingleAll = scopeSelect.querySelector('option[value="single_pages_20"]');
            const optSingleCurr = scopeSelect.querySelector('option[value="current_2_panels"]');
            const optAll = scopeSelect.querySelector('option[value="all"]');
            const optCurr = scopeSelect.querySelector('option[value="current"]');

            if (optSingleAll) {
                optSingleAll.textContent = `✂️ Menu Séparé (Gauche/Droite) : ${totalCutPanels} Pages en ${fmt.shortLabel}`;
            }
            if (optSingleCurr) {
                optSingleCurr.textContent = `✂️ Feuille active séparée en 2 pages (${fmt.shortLabel} — Gauche + Droite)`;
            }
            if (optAll) {
                optAll.textContent = `📄 Toutes les pages du projet (${facesCount} page${facesCount > 1 ? 's' : ''}) en ${fmt.shortLabel}`;
            }
            if (optCurr) {
                optCurr.textContent = `📄 Page active uniquement (${this.currentFace ? this.currentFace.name : 'Page 1'}) en ${fmt.shortLabel}`;
            }
        }

        const pagesEl = document.getElementById('exp-spec-pages');
        if (pagesEl) {
            if (scopeVal === 'single_pages_20') {
                pagesEl.textContent = `${totalCutPanels} pages séparées (${fmt.shortLabel})`;
            } else if (scopeVal === 'current_2_panels') {
                pagesEl.textContent = `2 pages séparées (${fmt.shortLabel})`;
            } else if (scopeVal === 'all') {
                pagesEl.textContent = `${facesCount} page${facesCount > 1 ? 's' : ''} (${fmt.shortLabel})`;
            } else {
                pagesEl.textContent = `1 page active (${fmt.shortLabel})`;
            }
        }

        const cropDesc = document.getElementById('exp-cropmarks-desc');
        if (cropDesc) {
            cropDesc.textContent = `Ajoute une marge technique autour du fond perdu de ${bleedMm} mm avec traits de coupe aux 4 coins pour le format ${fmt.shortLabel}.`;
        }

        const bleedDesc = document.getElementById('exp-bleed-desc');
        if (bleedDesc) {
            bleedDesc.textContent = `Étend les éléments de fond de ${bleedMm} mm au-delà du bord de coupe (${fmt.widthMm} × ${fmt.heightMm} mm → ${fmt.widthMm + bleedMm * 2} × ${fmt.heightMm + bleedMm * 2} mm).`;
        }

        const btnSepPng = document.getElementById('btn-exp-separate-png-label');
        if (btnSepPng) {
            btnSepPng.textContent = `Télécharger les Pages Séparément en PNG (${fmt.shortLabel})`;
        }

        const btnFacePng = document.getElementById('btn-exp-face-png-label');
        if (btnFacePng) {
            btnFacePng.textContent = `PNG Page Active (${fmt.shortLabel})`;
        }

        const btnPdf = document.getElementById('btn-exp-pdf-label');
        if (btnPdf) {
            btnPdf.textContent = `Générer le PDF Imprimeur (${fmt.shortLabel})`;
        }
    },

    getSelectedExportScale() {
        const dpiEl = document.getElementById('exp-dpi');
        const val = dpiEl ? parseFloat(dpiEl.value) : 11.81;
        return Math.max(2, Number.isFinite(val) ? val : 11.81);
    },

    getReadingPageNumber(faceIndex, side) {
        const facesCount = (this.engine && this.engine.faces) ? this.engine.faces.length : 1;
        if (facesCount <= 1) {
            return side === 'left' ? 1 : 2;
        }
        // Face 0 (Sheet 1 Recto): Right = Page 1 (Couverture), Left = Last Page (Dos)
        if (faceIndex === 0) {
            return side === 'right' ? 1 : (facesCount * 2);
        }
        // Interior faces 1..N-1: Left = fIdx*2, Right = fIdx*2 + 1
        return side === 'left' ? (faceIndex * 2) : (faceIndex * 2 + 1);
    },

    async exportCurrentFacePNG() {
        const includeCropMarks = document.getElementById('exp-cropmarks').checked;
        const includeBleed = document.getElementById('exp-bleed').checked;
        const scalePxPerMm = this.getSelectedExportScale();
        const fmt = this.getSelectedExportFormatSpecs();
        const progress = document.getElementById('export-progress');
        const progressText = document.getElementById('export-progress-text');
        if (progress) progress.classList.remove('hidden');
        if (progressText) progressText.textContent = `Rendu PNG ${fmt.shortLabel} — ${this.currentFace.name}...`;

        try {
            const { canvas, failedImages } = await this.exporter.renderFaceToCanvas(this.currentFace, {
                includeBleed,
                includeCropMarks,
                scalePxPerMm,
                targetWidthMm: fmt.widthMm,
                targetHeightMm: fmt.heightMm
            });

            const blob = await new Promise((resolve, reject) => {
                canvas.toBlob(b => b ? resolve(b) : reject(new Error('toBlob a échoué')), 'image/png');
            });
            canvas.width = 0;
            canvas.height = 0;

            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.download = `Menu_${fmt.fileTag}_${sanitizeFileName(this.currentFace.name || this.currentFace.id)}.png`;
            link.href = url;
            link.click();
            setTimeout(() => URL.revokeObjectURL(url), 2000);

            if (failedImages && failedImages.length > 0) {
                this.showToast(`PNG ${fmt.shortLabel} exporté (${failedImages.length} photo(s) externe(s) bloquée(s)).`);
            } else {
                this.showToast(`Page exportée en PNG (${fmt.label}) !`);
            }
        } catch (err) {
            console.error(err);
            this.showToast('Erreur lors de la génération PNG');
        } finally {
            if (progress) progress.classList.add('hidden');
        }
    },

    /**
     * Télécharge SÉPARÉMENT les pages du menu en PNG au format choisi
     * (Format A4 210 × 297 mm ou Format 170 × 300 mm).
     */
    async exportSeparatePanelsPNG() {
        const includeCropMarks = document.getElementById('exp-cropmarks').checked;
        const includeBleed = document.getElementById('exp-bleed').checked;
        const scalePxPerMm = this.getSelectedExportScale();
        const fmt = this.getSelectedExportFormatSpecs();
        const scopeEl = document.getElementById('exp-scope');
        const scope = scopeEl ? scopeEl.value : 'single_pages_20';
        const progress = document.getElementById('export-progress');
        const progressText = document.getElementById('export-progress-text');
        if (progress) progress.classList.remove('hidden');

        try {
            // Si l'utilisateur a choisi "Toutes les pages du projet" (scope === 'all') sur un projet multi-pages :
            // exporter chaque page (face) en PNG séparé au format choisi (ex: Format A4 210 × 297 mm)
            if (scope === 'all' && (!this.engine.specs.hasFold || this.engine.faces.length > 1)) {
                const totalFaces = this.engine.faces.length;
                for (let idx = 0; idx < totalFaces; idx++) {
                    const face = this.engine.faces[idx];
                    const pageNum = idx + 1;
                    if (progressText) {
                        progressText.textContent = `Rendu Page ${pageNum}/${totalFaces} (${fmt.shortLabel})...`;
                    }
                    await new Promise(r => setTimeout(r, 40));

                    const { canvas } = await this.exporter.renderFaceToCanvas(face, {
                        includeBleed,
                        includeCropMarks,
                        scalePxPerMm,
                        targetWidthMm: fmt.widthMm,
                        targetHeightMm: fmt.heightMm
                    });

                    const blob = await new Promise((resolve, reject) => {
                        canvas.toBlob(b => b ? resolve(b) : reject(new Error('toBlob a échoué')), 'image/png');
                    });
                    canvas.width = 0;
                    canvas.height = 0;

                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    const numStr = String(pageNum).padStart(2, '0');
                    link.download = `Menu_Separe_Page_${numStr}_sur_${totalFaces}_${fmt.fileTag}_${sanitizeFileName(face.name || face.id)}.png`;
                    link.href = url;
                    link.click();
                    await new Promise(r => setTimeout(r, 250));
                    setTimeout(() => URL.revokeObjectURL(url), 3000);
                }

                this.showToast(`${totalFaces} page(s) séparée(s) téléchargée(s) en PNG (${fmt.label}) !`);
                return;
            }

            // Découpage des 2 panneaux (Gauche + Droite) de la feuille active en 2 fichiers PNG séparés au format choisi (A4 210×297 mm ou 170×300 mm)
            const sides = ['left', 'right'];
            const totalPages = Math.max(2, this.engine.faces.length * 2);
            for (const side of sides) {
                const pageNum = this.getReadingPageNumber(this.currentFaceIndex, side);
                const sideLabel = side === 'left' ? 'Gauche' : 'Droite';
                if (progressText) {
                    progressText.textContent = `Rendu Panneau ${sideLabel} (Page ${pageNum}/${totalPages} — ${fmt.shortLabel})...`;
                }
                await new Promise(r => setTimeout(r, 40));

                const { canvas } = await this.exporter.renderSinglePanelToCanvas(
                    this.currentFace,
                    side,
                    pageNum,
                    {
                        includeBleed,
                        includeCropMarks,
                        scalePxPerMm,
                        targetWidthMm: fmt.widthMm,
                        targetHeightMm: fmt.heightMm,
                        totalPages
                    }
                );

                const blob = await new Promise((resolve, reject) => {
                    canvas.toBlob(b => b ? resolve(b) : reject(new Error('toBlob a échoué')), 'image/png');
                });
                canvas.width = 0;
                canvas.height = 0;

                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                const numStr = String(pageNum).padStart(2, '0');
                link.download = `Menu_Page_${numStr}_sur_${totalPages}_${sanitizeFileName(this.currentFace.id)}_${sideLabel}_${fmt.fileTag}.png`;
                link.href = url;
                link.click();
                await new Promise(r => setTimeout(r, 250));
                setTimeout(() => URL.revokeObjectURL(url), 3000);
            }

            this.showToast(`Les 2 pages séparées (Gauche & Droite) ont été téléchargées en PNG au ${fmt.label} !`);
        } catch (err) {
            console.error(err);
            this.showToast('Erreur lors de l\'export séparé en PNG');
        } finally {
            if (progress) progress.classList.add('hidden');
        }
    },

    async exportPDF() {
        if (!window.jspdf || !window.jspdf.jsPDF) {
            this.showToast('Librairie jsPDF non chargée.');
            return;
        }

        const preflightIssues = this.engine.preflight();
        if (preflightIssues.length) {
            const first = preflightIssues[0].msg;
            this.showToast(`Pré-presse : ${preflightIssues.length} point(s) à vérifier (ex. ${first})`);
            console.warn('Contrôle pré-presse :', preflightIssues);
        }

        const includeCropMarks = document.getElementById('exp-cropmarks').checked;
        const includeBleed = document.getElementById('exp-bleed').checked;
        const scope = document.getElementById('exp-scope').value;
        const scalePxPerMm = this.getSelectedExportScale();
        const fmt = this.getSelectedExportFormatSpecs();
        const progress = document.getElementById('export-progress');
        const progressText = document.getElementById('export-progress-text');

        if (progress) progress.classList.remove('hidden');

        try {
            const { jsPDF } = window.jspdf;
            const allFailedImages = new Set();
            let pdf = null;
            const facesCount = this.engine.faces.length || 1;

            // MODE 1 : Pages séparées (Gauche / Droite découpées) au Format A4 (210 × 297 mm) ou 170 × 300 mm
            if (scope === 'single_pages_20' || scope === 'current_2_panels') {
                const panelQueue = [];
                if (scope === 'current_2_panels' || facesCount === 1) {
                    const targetFace = scope === 'current_2_panels' ? this.currentFace : this.engine.faces[0];
                    const targetIdx = scope === 'current_2_panels' ? this.currentFaceIndex : 0;
                    panelQueue.push(
                        { face: targetFace, side: 'left', pageNum: this.getReadingPageNumber(targetIdx, 'left') },
                        { face: targetFace, side: 'right', pageNum: this.getReadingPageNumber(targetIdx, 'right') }
                    );
                } else {
                    // Ordre de lecture séquentiel Page 1 à Page (facesCount * 2) pour l'imprimeur :
                    // Page 1 = Couverture (Face 0 Droite)
                    panelQueue.push({ face: this.engine.faces[0], side: 'right', pageNum: 1 });
                    // Pages intérieures = Faces 1 .. facesCount-1 (Gauche puis Droite)
                    for (let fIdx = 1; fIdx < facesCount; fIdx++) {
                        panelQueue.push({ face: this.engine.faces[fIdx], side: 'left', pageNum: fIdx * 2 });
                        panelQueue.push({ face: this.engine.faces[fIdx], side: 'right', pageNum: fIdx * 2 + 1 });
                    }
                    // Dernière Page = Dos de couverture (Face 0 Gauche)
                    panelQueue.push({ face: this.engine.faces[0], side: 'left', pageNum: facesCount * 2 });
                }

                const totalPages = panelQueue.length;
                for (let i = 0; i < totalPages; i++) {
                    const item = panelQueue[i];
                    if (progressText) {
                        progressText.textContent = `Rendu Page séparée ${i + 1}/${totalPages} (${fmt.shortLabel})...`;
                    }
                    await new Promise(r => setTimeout(r, 25));

                    const { canvas, totalWidthMm, totalHeightMm, failedImages } = await this.exporter.renderSinglePanelToCanvas(
                        item.face,
                        item.side,
                        item.pageNum,
                        {
                            includeBleed,
                            includeCropMarks,
                            scalePxPerMm,
                            targetWidthMm: fmt.widthMm,
                            targetHeightMm: fmt.heightMm,
                            totalPages
                        }
                    );

                    if (failedImages) failedImages.forEach(u => allFailedImages.add(u));
                    const imgData = canvas.toDataURL('image/jpeg', 0.94);
                    canvas.width = 0;
                    canvas.height = 0;

                    const orient = totalWidthMm > totalHeightMm ? 'landscape' : 'portrait';
                    if (i === 0) {
                        pdf = new jsPDF({
                            orientation: orient,
                            unit: 'mm',
                            format: [totalWidthMm, totalHeightMm]
                        });
                    } else {
                        pdf.addPage([totalWidthMm, totalHeightMm], orient);
                    }
                    pdf.addImage(imgData, 'JPEG', 0, 0, totalWidthMm, totalHeightMm);
                }

                const filename = scope === 'single_pages_20'
                    ? `Menu_${totalPages}_Pages_Separees_${fmt.fileTag}_Imprimeur.pdf`
                    : `Menu_${sanitizeFileName(this.currentFace.id)}_2_Pages_Separees_${fmt.fileTag}.pdf`;

                pdf.save(filename);
                this.showToast(`PDF en pages séparées (${fmt.label}) généré avec succès !`);
                this.closeExportModal();
                return;
            }

            // MODE 2 : Pages complètes du projet (1 page par feuille/face) au format choisi (ex: Format A4 210 × 297 mm)
            const facesToExport = scope === 'all' ? this.engine.faces : [this.currentFace];

            for (let i = 0; i < facesToExport.length; i++) {
                const face = facesToExport[i];
                if (progressText) {
                    progressText.textContent = `Rendu Page ${face.name} (${i + 1}/${facesToExport.length}) — ${fmt.shortLabel}...`;
                }
                await new Promise(r => setTimeout(r, 30));

                const { canvas, totalWidthMm, totalHeightMm, failedImages } = await this.exporter.renderFaceToCanvas(face, {
                    includeBleed,
                    includeCropMarks,
                    scalePxPerMm,
                    targetWidthMm: fmt.widthMm,
                    targetHeightMm: fmt.heightMm
                });

                if (failedImages) {
                    failedImages.forEach(u => allFailedImages.add(u));
                }

                const imgData = canvas.toDataURL('image/jpeg', 0.94);
                canvas.width = 0;
                canvas.height = 0;

                const orient = totalWidthMm > totalHeightMm ? 'landscape' : 'portrait';
                if (i === 0) {
                    pdf = new jsPDF({
                        orientation: orient,
                        unit: 'mm',
                        format: [totalWidthMm, totalHeightMm]
                    });
                } else {
                    pdf.addPage([totalWidthMm, totalHeightMm], orient);
                }

                pdf.addImage(imgData, 'JPEG', 0, 0, totalWidthMm, totalHeightMm);
            }

            const filename = scope === 'all'
                ? `Menu_Complet_${facesToExport.length}_Pages_${fmt.fileTag}_PrePresse.pdf`
                : `Menu_${sanitizeFileName(this.currentFace.name || this.currentFace.id)}_${fmt.fileTag}.pdf`;

            pdf.save(filename);
            if (allFailedImages.size > 0) {
                this.showToast(`PDF (${fmt.shortLabel}) généré, mais ${allFailedImages.size} photo(s) externe(s) n'ont pas pu être intégrées.`);
            } else {
                this.showToast(`PDF Imprimeur (${fmt.label}) généré avec succès !`);
            }
            this.closeExportModal();
        } catch (err) {
            console.error(err);
            this.showToast('Erreur lors de la génération PDF');
        } finally {
            if (progress) progress.classList.add('hidden');
        }
    },

    // ==========================================
    // GOOGLE DRIVE / LOCAL DISK SYNC (OPTION A)
    // ==========================================
    async saveProjectToDisk(forceSaveAs = false) {
        if (this.isSavingDisk) return;
        this.isSavingDisk = true;
        this.flushPendingSave();

        try {
            if ('showSaveFilePicker' in window) {
                let handle = this.activeFileHandle;

                if (!handle || forceSaveAs) {
                    const defaultFormatName = (this.engine.specs.name || 'Menu').replace(/[^a-zA-Z0-9_-]/g, '_');
                    const suggested = this.activeFileName || `Projet_${defaultFormatName}.inmenu.json`;

                    handle = await window.showSaveFilePicker({
                        suggestedName: suggested,
                        types: [{
                            description: 'Projet InMenu Studio (.inmenu.json)',
                            accept: { 'application/json': ['.inmenu.json', '.json'] }
                        }]
                    });

                    this.activeFileHandle = handle;
                    this.activeFileName = handle.name;
                    try {
                        localStorage.setItem('inmenu_last_synced_filename', handle.name);
                    } catch (_) { /* ignore */ }
                }

                const json = this.engine.toJSON(true);
                const writable = await handle.createWritable();
                await writable.write(json);
                await writable.close();

                this.updateDiskSyncUI(true);
                this.showToast(`✅ Enregistré sur Google Drive : ${this.activeFileName}`);
            } else {
                // Fallback pour navigateurs sans File System Access API
                this.exportProjectJSON();
                this.showToast('Enregistré en téléchargement. Placez le fichier dans votre dossier Google Drive.');
            }
        } catch (err) {
            if (err && err.name !== 'AbortError') {
                console.error('Erreur sauvegarde disque:', err);
                this.showToast(`Erreur d'enregistrement : ${err.message || 'accès refusé'}`);
            }
        } finally {
            this.isSavingDisk = false;
        }
    },

    async openProjectFromDisk() {
        try {
            if ('showOpenFilePicker' in window) {
                const [handle] = await window.showOpenFilePicker({
                    types: [{
                        description: 'Projet InMenu Studio (.inmenu.json, .json)',
                        accept: { 'application/json': ['.inmenu.json', '.json'] }
                    }],
                    multiple: false
                });

                const file = await handle.getFile();
                const text = await file.text();
                this.engine.fromJSON(text);

                this.activeFileHandle = handle;
                this.activeFileName = handle.name;
                try {
                    localStorage.setItem('inmenu_last_synced_filename', handle.name);
                } catch (_) { /* ignore */ }

                this.currentFaceIndex = 0;
                this.selectedObjectId = null;
                this.setupGeometryDOM();
                this.populateQuickDishSelect();
                this.renderCurrentFace();
                this.renderInspector();
                this.renderSpreadsNavigator();
                this.updateUndoRedoButtons();
                this.updateFormatHeaderUI();
                this.updateDiskSyncUI(true);
                this.showToast(`Projet chargé depuis Google Drive : ${this.activeFileName}`);
            } else {
                const input = document.getElementById('disk-import-input-fallback');
                if (input) input.click();
            }
        } catch (err) {
            if (err && err.name !== 'AbortError') {
                console.error('Erreur ouverture disque:', err);
                this.showToast('Erreur lors de l\'ouverture du fichier.');
            }
        }
    },

    updateDiskSyncUI(isSynced = true) {
        const labelEl = document.getElementById('label-save-disk');
        const syncDotEl = document.getElementById('drive-sync-dot');
        const fileNameEl = document.getElementById('drive-sync-filename');
        const footerDriveStatus = document.getElementById('footer-drive-status');

        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

        if (this.activeFileName) {
            if (labelEl) {
                labelEl.textContent = isSynced ? 'Enregistré (Ctrl+S)' : 'Enregistrer (Ctrl+S)*';
            }
            if (syncDotEl) {
                syncDotEl.classList.remove('hidden');
                syncDotEl.className = isSynced
                    ? 'w-2 h-2 rounded-full bg-emerald-300 ml-1 inline-block animate-pulse'
                    : 'w-2 h-2 rounded-full bg-amber-400 ml-1 inline-block';
            }
            if (fileNameEl) {
                fileNameEl.textContent = this.activeFileName;
                fileNameEl.title = `Fichier actif : ${this.activeFileName}\nStatut : ${isSynced ? 'Synchronisé' : 'Modifications non enregistrées sur disque'}`;
            }
            if (footerDriveStatus) {
                footerDriveStatus.innerHTML = `
                    <i class="fa-brands fa-google-drive mr-1 ${isSynced ? 'text-emerald-400' : 'text-amber-400'}"></i>
                    <span>Drive: <strong class="${isSynced ? 'text-emerald-300' : 'text-amber-300'} font-mono">${escapeHTML(this.activeFileName)}</strong> ${isSynced ? `(${timeStr})` : '• Modifié*'}</span>
                `;
            }
        } else {
            if (labelEl) {
                labelEl.textContent = 'Enregistrer (Ctrl+S)';
            }
            if (syncDotEl) {
                syncDotEl.classList.add('hidden');
            }
            if (fileNameEl) {
                fileNameEl.textContent = 'Prêt pour synchronisation';
            }
            if (footerDriveStatus) {
                footerDriveStatus.innerHTML = `
                    <i class="fa-brands fa-google-drive mr-1 text-emerald-400"></i>
                    <span>Drive: Prêt (Ctrl+S)</span>
                `;
            }
        }
    },

    exportProjectJSON() {
        const blob = new Blob([this.engine.toJSON()], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const defaultFormatName = (this.engine.specs.name || 'Menu').replace(/[^a-zA-Z0-9_-]/g, '_');
        link.download = this.activeFileName || `Projet_${defaultFormatName}.inmenu.json`;
        link.href = url;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        this.showToast('Copie JSON téléchargée !');
    },

    importProjectJSON(event) {
        const input = event.target;
        const file = input.files && input.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                this.engine.fromJSON(e.target.result);
                this.currentFaceIndex = 0;
                this.selectedObjectId = null;
                this.activeFileName = file.name;
                try {
                    localStorage.setItem('inmenu_last_synced_filename', file.name);
                } catch (_) { /* ignore */ }
                this.setupGeometryDOM();
                this.populateQuickDishSelect();
                this.renderCurrentFace();
                this.renderInspector();
                this.renderSpreadsNavigator();
                this.updateUndoRedoButtons();
                this.updateFormatHeaderUI();
                this.updateAutoSaveUI(this.engine.lastSaveSuccess);
                this.updateDiskSyncUI(true);
                this.showToast(`Projet « ${file.name} » chargé avec succès !`);
            } catch (err) {
                console.error(err);
                this.showToast('Fichier JSON invalide');
            }
        };
        reader.onerror = () => {
            this.showToast('Erreur de lecture du fichier JSON');
        };
        reader.readAsText(file);
        input.value = '';
    }
});
