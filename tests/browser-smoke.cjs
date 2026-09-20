// Requires Playwright on NODE_PATH. Set ESCAPE_URL to a served app subdirectory.
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) errors.push(response.status() + ' ' + response.url()); });
  try {
    const response = await page.goto(process.env.ESCAPE_URL || 'http://127.0.0.1:4173/');
    assert.equal(response.status(), 200);
    await page.locator('[data-character-id]').first().waitFor();
    assert.equal(await page.locator('[data-character-id]').count(), 4);
    await page.locator('[data-character-id]').first().click();
    await page.locator('#start-adventure').click();
    await page.locator('#room-host canvas').waitFor();
    await page.waitForFunction(() => {
      const canvas = document.querySelector('#room-host canvas');
      return canvas && canvas.width > 0 && canvas.height > 0;
    });
    await page.locator('#bag-button').click();
    await page.locator('#bag-dialog[open]').waitFor();
    await page.locator('#close-bag').click();
    assert.deepEqual(errors, []);
    await page.screenshot({ path: '/tmp/escape-published.png', fullPage: true });
    console.log('PASS: Escape published subpath loads all modules and art, selects a wizard, renders the 3D room, and opens the bag.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
