const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
    // Vide le stockage pour partir d'un projet par défaut
    await page.addInitScript(() => { try { localStorage.clear(); } catch (_) {} });
});

test('chargement : aucune erreur JS, canevas rendu, CSP respectée', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(String(e)));
    page.on('console', m => { if (/Content Security Policy/i.test(m.text())) errors.push(m.text()); });
    await page.goto('index.html');
    await expect(page.locator('#spread-page')).toBeVisible();
    await expect(page.locator('#objects-layer > *').first()).toBeAttached();
    await expect(page.locator('#autosave-text')).toHaveText(/Auto-Save OK/);
    expect(errors).toEqual([]);
});

test('édition : sélection d\'un objet, déplacement clavier puis annulation', async ({ page }) => {
    await page.goto('index.html');
    const target = page.locator('#dom_cov_logo');
    await target.click();
    const x0 = await page.evaluate(() => app.engine.faces[app.currentFaceIndex].objects.find(o => o.id === app.selectedObjectId).x);
    await page.keyboard.press('ArrowRight');
    const x1 = await page.evaluate(() => app.engine.faces[app.currentFaceIndex].objects.find(o => o.id === app.selectedObjectId).x);
    expect(x1).toBeGreaterThan(x0);
    await page.keyboard.press('Control+z');
    const x2 = await page.evaluate(() => app.engine.faces[app.currentFaceIndex].objects.find(o => o.id === 'cov_logo')?.x);
    expect(x2).toBe(x0);
});

test('export JSON : le projet exporté est ré-importable', async ({ page }) => {
    await page.goto('index.html');
    const ok = await page.evaluate(() => {
        const json = app.engine.toJSON(false);
        const copy = new DocumentEngine();
        copy.persistReady = false;
        copy.fromJSON(json);
        return copy.faces.length === app.engine.faces.length;
    });
    expect(ok).toBe(true);
});

test('import malveillant : couleur et URL neutralisées dans le DOM', async ({ page }) => {
    await page.goto('index.html');
    await page.evaluate(() => {
        const data = JSON.parse(app.engine.toJSON(false));
        data.faces[0].objects = [{ id: 'evil', type: 'image', x: 10, y: 10, w: 40, h: 40,
            imageUrl: 'javascript:alert(1)', bgColor: 'red;background:url(//evil)' }];
        app.engine.fromJSON(JSON.stringify(data));
        app.currentFaceIndex = 0;
        app.renderCurrentFace();
    });
    const html = await page.locator('#objects-layer').innerHTML();
    expect(html).not.toContain('javascript:');
    expect(html).not.toContain('evil)');
});

test('ouverture de la fenêtre d\'export', async ({ page }) => {
    await page.goto('index.html');
    await page.locator('[data-action="open-export-modal"]').first().click();
    await expect(page.locator('#modal-export')).toBeVisible();
});
