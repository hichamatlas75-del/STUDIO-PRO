const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

async function buildIcons() {
    console.log('Lancement du rendu des icônes PWA...');
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ deviceScaleFactor: 1 });
    const page = await context.newPage();

    const rootDir = path.resolve(__dirname, '..');
    const svgPath = path.join(rootDir, 'icons', 'icon.svg');
    const maskableSvgPath = path.join(rootDir, 'icons', 'icon-maskable.svg');

    const svgContent = fs.readFileSync(svgPath, 'utf8');
    const maskableSvgContent = fs.readFileSync(maskableSvgPath, 'utf8');

    // 1. icon-512.png
    await page.setViewportSize({ width: 512, height: 512 });
    await page.setContent(`<!DOCTYPE html><html><body style="margin:0;padding:0;overflow:hidden;background:transparent;">${svgContent}</body></html>`);
    await page.screenshot({ path: path.join(rootDir, 'icons', 'icon-512.png'), omitBackground: false });
    console.log('✓ icons/icon-512.png générée (512x512)');

    // 2. icon-192.png
    await page.setViewportSize({ width: 192, height: 192 });
    await page.setContent(`<!DOCTYPE html><html><body style="margin:0;padding:0;overflow:hidden;background:transparent;"><div style="width:192px;height:192px;">${svgContent}</div></body></html>`);
    await page.screenshot({ path: path.join(rootDir, 'icons', 'icon-192.png'), omitBackground: false });
    console.log('✓ icons/icon-192.png générée (192x192)');

    // 3. apple-touch-icon.png (180x180)
    await page.setViewportSize({ width: 180, height: 180 });
    await page.setContent(`<!DOCTYPE html><html><body style="margin:0;padding:0;overflow:hidden;background:transparent;"><div style="width:180px;height:180px;">${svgContent}</div></body></html>`);
    await page.screenshot({ path: path.join(rootDir, 'icons', 'apple-touch-icon.png'), omitBackground: false });
    console.log('✓ icons/apple-touch-icon.png générée (180x180)');

    // 4. icon-maskable.png (512x512)
    await page.setViewportSize({ width: 512, height: 512 });
    await page.setContent(`<!DOCTYPE html><html><body style="margin:0;padding:0;overflow:hidden;background:#0a0b0f;">${maskableSvgContent}</body></html>`);
    await page.screenshot({ path: path.join(rootDir, 'icons', 'icon-maskable.png'), omitBackground: false });
    console.log('✓ icons/icon-maskable.png générée (512x512 maskable)');

    await browser.close();
    console.log('Toutes les icônes PWA ont été générées avec succès !');
}

buildIcons().catch(err => {
    console.error('Erreur génération icônes:', err);
    process.exit(1);
});
