const { defineConfig } = require('@playwright/test');
const path = require('path');
const { pathToFileURL } = require('url');

module.exports = defineConfig({
    testDir: 'e2e',
    timeout: 30000,
    retries: process.env.CI ? 1 : 0,
    use: { baseURL: pathToFileURL(path.join(__dirname, 'index.html')).href, headless: true },
    projects: [{ name: 'chromium', use: { browserName: 'chromium' } }]
});
