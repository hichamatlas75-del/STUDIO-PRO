/**
 * MODULE 2F: Print PDF/PNG Export Controller & Google Drive / Local Disk Sync (app-io.js)
 */
Object.assign(InMenuStudioApp.prototype, {
    // ==================== EXPORT PDF (WITH CROP & FOLD MARKS) & PNG ====================
    openExportModal() {
        const modal = document.getElementById('modal-export');
        if (modal) modal.classList.remove('hidden');
    },

    closeExportModal() {
        const modal = document.getElementById('modal-export');
        if (modal) modal.classList.add('hidden');
    },

    getSelectedExportScale() {
        const dpiEl = document.getElementById('exp-dpi');
        const val = dpiEl ? parseFloat(dpiEl.value) : 11.81;
        return Math.max(2, Number.isFinite(val) ? val : 11.81);
    },

    getReadingPageNumber(faceIndex, side) {
        // Face 0 (Sheet 1 Recto): Right = Page 1 (Couverture), Left = Page 20 (Dos)
        if (faceIndex === 0) {
            return side === 'right' ? 1 : 20;
        }
        // Interior faces 1..9: Left = fIdx*2, Right = fIdx*2 + 1 (Pages 2..19)
        return side === 'left' ? (faceIndex * 2) : (faceIndex * 2 + 1);
    },

    async exportCurrentFacePNG() {
        const includeCropMarks = document.getElementById('exp-cropmarks').checked;
        const includeBleed = document.getElementById('exp-bleed').checked;
        const scalePxPerMm = this.getSelectedExportScale();
        const progress = document.getElementById('export-progress');
        const progressText = document.getElementById('export-progress-text');
        if (progress) progress.classList.remove('hidden');
        if (progressText) progressText.textContent = `Rendu PNG 34×30cm ${this.currentFace.name}...`;

        try {
            const { canvas, failedImages } = await this.exporter.renderFaceToCanvas(this.currentFace, {
                includeBleed,
                includeCropMarks,
                scalePxPerMm
            });

            const blob = await new Promise((resolve, reject) => {
                canvas.toBlob(b => b ? resolve(b) : reject(new Error('toBlob a échoué')), 'image/png');
            });
            canvas.width = 0;
            canvas.height = 0;

            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.download = `Menu_Planche_${this.engine.specs.widthMm}x${this.engine.specs.heightMm}_${sanitizeFileName(this.currentFace.id)}.png`;
            link.href = url;
            link.click();
            setTimeout(() => URL.revokeObjectURL(url), 2000);

            if (failedImages && failedImages.length > 0) {
                this.showToast(`PNG exporté avec avertissement : ${failedImages.length} photo(s) externe(s) bloquée(s).`);
            } else {
                this.showToast('Planche 34×30 cm exportée en PNG !');
            }
        } catch (err) {
            console.error(err);
            this.showToast('Erreur lors de la génération PNG');
        } finally {
            if (progress) progress.classList.add('hidden');
        }
    },

    /**
     * Télécharge SÉPARÉMENT les 2 panneaux 17×30 cm (Gauche + Droite) de la feuille active
     * pour que l'imprimeur puisse les assembler/imposer librement.
     */
    async exportSeparatePanelsPNG() {
        const includeCropMarks = document.getElementById('exp-cropmarks').checked;
        const includeBleed = document.getElementById('exp-bleed').checked;
        const scalePxPerMm = this.getSelectedExportScale();
        const progress = document.getElementById('export-progress');
        const progressText = document.getElementById('export-progress-text');
        if (progress) progress.classList.remove('hidden');

        try {
            const sides = ['left', 'right'];
            for (const side of sides) {
                const pageNum = this.getReadingPageNumber(this.currentFaceIndex, side);
                const sideLabel = side === 'left' ? 'Gauche' : 'Droite';
                if (progressText) {
                    progressText.textContent = `Rendu Panneau ${sideLabel} (Page ${pageNum}/${this.engine.faces.length * 2} — ${Math.round(this.engine.specs.foldXMm ? this.engine.specs.foldXMm / 10 : this.engine.specs.widthMm / 10)}×${Math.round(this.engine.specs.heightMm / 10)} cm)...`;
                }
                await new Promise(r => setTimeout(r, 40));

                const { canvas } = await this.exporter.renderSinglePanelToCanvas(
                    this.currentFace,
                    side,
                    pageNum,
                    { includeBleed, includeCropMarks, scalePxPerMm }
                );

                const blob = await new Promise((resolve, reject) => {
                    canvas.toBlob(b => b ? resolve(b) : reject(new Error('toBlob a échoué')), 'image/png');
                });
                canvas.width = 0;
                canvas.height = 0;

                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                const numStr = String(pageNum).padStart(2, '0');
                link.download = `Menu_Page_${numStr}_sur_${this.engine.faces.length * 2}_${sanitizeFileName(this.currentFace.id)}_${sideLabel}_${Math.round((this.engine.specs.foldXMm || this.engine.specs.widthMm) / 10)}x${Math.round(this.engine.specs.heightMm / 10)}cm.png`;
                link.href = url;
                link.click();
                await new Promise(r => setTimeout(r, 250));
                setTimeout(() => URL.revokeObjectURL(url), 3000);
            }

            this.showToast('Les 2 pages 17×30 cm (Gauche & Droite) ont été téléchargées séparément !');
        } catch (err) {
            console.error(err);
            this.showToast('Erreur lors de l\'export séparé des 2 panneaux');
        } finally {
            if (progress) progress.classList.add('hidden');
        }
    },

    async exportPDF() {
        if (!window.jspdf || !window.jspdf.jsPDF) {
            this.showToast('Librairie jsPDF non chargée.');
            return;
        }

        const includeCropMarks = document.getElementById('exp-cropmarks').checked;
        const includeBleed = document.getElementById('exp-bleed').checked;
        const scope = document.getElementById('exp-scope').value;
        const scalePxPerMm = this.getSelectedExportScale();
        const progress = document.getElementById('export-progress');
        const progressText = document.getElementById('export-progress-text');

        if (progress) progress.classList.remove('hidden');

        try {
            const { jsPDF } = window.jspdf;
            const allFailedImages = new Set();
            let pdf = null;

            // MODE 1 : Pages séparées 17×30 cm (Recommandé pour l'imprimeur qui fait l'assemblage/agrafage)
            if (scope === 'single_pages_20' || scope === 'current_2_panels') {
                const panelQueue = [];
                if (scope === 'current_2_panels') {
                    panelQueue.push(
                        { face: this.currentFace, side: 'left', pageNum: this.getReadingPageNumber(this.currentFaceIndex, 'left') },
                        { face: this.currentFace, side: 'right', pageNum: this.getReadingPageNumber(this.currentFaceIndex, 'right') }
                    );
                } else {
                    // Ordre de lecture séquentiel Page 1 à Page 20 pour l'imprimeur :
                    // Page 1 = Couverture (Face 0 Droite)
                    panelQueue.push({ face: this.engine.faces[0], side: 'right', pageNum: 1 });
                    // Pages 2 à 19 = Faces intérieures 1..9 (Gauche puis Droite : jamais de catégorie coupée !)
                    for (let fIdx = 1; fIdx < 10; fIdx++) {
                        panelQueue.push({ face: this.engine.faces[fIdx], side: 'left', pageNum: fIdx * 2 });
                        panelQueue.push({ face: this.engine.faces[fIdx], side: 'right', pageNum: fIdx * 2 + 1 });
                    }
                    // Page 20 = Dos de couverture (Face 0 Gauche)
                    panelQueue.push({ face: this.engine.faces[0], side: 'left', pageNum: 20 });
                }

                for (let i = 0; i < panelQueue.length; i++) {
                    const item = panelQueue[i];
                    if (progressText) progressText.textContent = `Rendu Page séparée ${item.pageNum}/20 (17×30 cm)...`;
                    await new Promise(r => setTimeout(r, 25));

                    const { canvas, totalWidthMm, totalHeightMm, failedImages } = await this.exporter.renderSinglePanelToCanvas(
                        item.face,
                        item.side,
                        item.pageNum,
                        { includeBleed, includeCropMarks, scalePxPerMm }
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
                    ? `Menu_${this.engine.faces.length * 2}_Pages_Separees_${Math.round((this.engine.specs.foldXMm || this.engine.specs.widthMm) / 10)}x${Math.round(this.engine.specs.heightMm / 10)}cm_Imprimeur.pdf`
                    : `Menu_${sanitizeFileName(this.currentFace.id)}_2_Pages_Separees_${Math.round((this.engine.specs.foldXMm || this.engine.specs.widthMm) / 10)}x${Math.round(this.engine.specs.heightMm / 10)}cm.pdf`;

                pdf.save(filename);
                this.showToast('PDF en pages séparées 17×30 cm généré pour l\'imprimeur !');
                this.closeExportModal();
                return;
            }

            // MODE 2 : Planches ouvertes 34×30 cm
            const facesToExport = scope === 'all' ? this.engine.faces : [this.currentFace];

            for (let i = 0; i < facesToExport.length; i++) {
                const face = facesToExport[i];
                if (progressText) progressText.textContent = `Rendu Planche 34×30cm ${face.name} (${i + 1}/${facesToExport.length})...`;
                await new Promise(r => setTimeout(r, 30));

                const { canvas, totalWidthMm, totalHeightMm, failedImages } = await this.exporter.renderFaceToCanvas(face, {
                    includeBleed,
                    includeCropMarks,
                    scalePxPerMm
                });

                if (failedImages) {
                    failedImages.forEach(u => allFailedImages.add(u));
                }

                const imgData = canvas.toDataURL('image/jpeg', 0.94);
                canvas.width = 0;
                canvas.height = 0;

                if (i === 0) {
                    pdf = new jsPDF({
                        orientation: 'landscape',
                        unit: 'mm',
                        format: [totalWidthMm, totalHeightMm]
                    });
                } else {
                    pdf.addPage([totalWidthMm, totalHeightMm], 'landscape');
                }

                pdf.addImage(imgData, 'JPEG', 0, 0, totalWidthMm, totalHeightMm);
            }

            const filename = scope === 'all'
                ? `Menu_Complet_${this.engine.faces.length}_Planches_${this.engine.specs.widthMm / 10}x${this.engine.specs.heightMm / 10}cm_PrePresse.pdf`
                : `Menu_${sanitizeFileName(this.currentFace.id)}_${this.engine.specs.widthMm / 10}x${this.engine.specs.heightMm / 10}cm.pdf`;

            pdf.save(filename);
            if (allFailedImages.size > 0) {
                this.showToast(`PDF généré, mais ${allFailedImages.size} photo(s) externe(s) n'ont pas pu être intégrées.`);
            } else {
                this.showToast('PDF Imprimeur généré avec succès !');
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
                    } catch (_) {}
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
                } catch (_) {}

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
                } catch (_) {}
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
