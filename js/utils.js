/**
 * ============================================================================
 * SHARED HELPERS: Sanitization, ID Generation & Typographic Constants
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
