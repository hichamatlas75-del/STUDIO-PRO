/**
 * ============================================================================
 * SHARED HELPERS: Sanitization, ID Generation, Typographic & Storage Constants
 * ============================================================================
 */
const PT_TO_MM = 0.3528;

function escapeHTML(str) {
    return String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function sanitizeUrl(url) {
    const raw = String(url ?? '').trim();
    if (!raw) return '';
    if (/^(https?:\/\/|data:image\/|blob:)/i.test(raw)) return raw;
    return '';
}

let __uidCounter = 0;
function generateUniqueId(prefix = 'obj') {
    __uidCounter += 1;
    return `${prefix}_${Date.now().toString(36)}_${__uidCounter.toString(36)}`;
}

function isSansFontFamily(family) {
    return family === 'Inter' || family === 'Montserrat';
}

function getFontFallback(family) {
    if (family === 'Inter' || family === 'Montserrat') return 'sans-serif';
    if (family === 'JetBrains Mono') return 'monospace';
    return 'serif';
}

/**
 * High-Capacity Storage Engine using IndexedDB (up to several GBs)
 * with transparent localStorage fallback for backward compatibility.
 */
const InMenuStorage = {
    DB_NAME: 'InMenuStudioDB',
    STORE_NAME: 'projects',
    STORAGE_KEY: 'inmenu_studio_v3_greycorner_split',
    _dbPromise: null,

    getDB() {
        if (!this._dbPromise) {
            this._dbPromise = new Promise((resolve, reject) => {
                if (typeof indexedDB === 'undefined' || !indexedDB) {
                    return reject(new Error('IndexedDB non disponible'));
                }
                const req = indexedDB.open(this.DB_NAME, 1);
                req.onupgradeneeded = (e) => {
                    const db = e.target.result;
                    if (!db.objectStoreNames.contains(this.STORE_NAME)) {
                        db.createObjectStore(this.STORE_NAME);
                    }
                };
                req.onsuccess = () => resolve(req.result);
                req.onerror = () => reject(req.error || new Error('Erreur ouverture IndexedDB'));
            });
        }
        return this._dbPromise;
    },

    async setItem(key, value) {
        let idbSuccess = false;
        try {
            const db = await this.getDB();
            await new Promise((resolve, reject) => {
                const tx = db.transaction(this.STORE_NAME, 'readwrite');
                const store = tx.objectStore(this.STORE_NAME);
                const req = store.put(value, key);
                req.onsuccess = () => resolve(true);
                req.onerror = () => reject(req.error);
            });
            idbSuccess = true;
        } catch (err) {
            // Fallback vers localStorage si IndexedDB est indisponible ; l'erreur est conservée pour diagnostic.
            this.lastError = err;
            console.warn('IndexedDB: écriture impossible', err);
        }

        // Try localStorage as mirror (si la taille le permet)
        let lsSuccess = false;
        try {
            localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
            lsSuccess = true;
        } catch (_) {
            // normal si le projet dépasse 5 Mo avec photos.
            // On supprime l'ancienne copie pour ne jamais relire une version périmée.
            try { localStorage.removeItem(key); } catch (__) { /* ignore */ }
        }

        return idbSuccess || lsSuccess;
    },

    async getItem(key) {
        // 1. Try IndexedDB first (holds large projects with photos)
        try {
            const db = await this.getDB();
            const val = await new Promise((resolve, reject) => {
                const tx = db.transaction(this.STORE_NAME, 'readonly');
                const store = tx.objectStore(this.STORE_NAME);
                const req = store.get(key);
                req.onsuccess = () => resolve(req.result);
                req.onerror = () => reject(req.error);
            });
            if (val !== undefined && val !== null) return val;
        } catch (_) { /* ignore */ }

        // 2. Fallback to localStorage
        try {
            return localStorage.getItem(key);
        } catch (_) {
            return null;
        }
    }
};

function sanitizeFileName(str) {
    return String(str ?? '').replace(/[^\w.\-]+/g, '_').replace(/^_+|_+$/g, '') || 'export';
}
