// Requires Playwright on NODE_PATH. Set ESCAPE_URL to a served app subdirectory.
const assert = require("node:assert/strict");
const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ["--enable-unsafe-swiftshader"],
  });
  const page = await browser.newPage({
    viewport: { width: 1280, height: 900 },
  });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("response", (response) => {
    if (response.status() >= 400)
      errors.push(response.status() + " " + response.url());
  });
  try {
    const response = await page.goto(
      process.env.ESCAPE_URL || "http://127.0.0.1:4173/",
    );
    assert.equal(response.status(), 200);
    await page.locator("[data-character-id]").first().waitFor();
    assert.equal(await page.locator("[data-character-id]").count(), 4);
    await page.locator("[data-character-id]").first().click();
    await page.locator("#start-adventure").click();
    await page.locator("#room-host canvas").waitFor();
    await page.waitForFunction(() => {
      const canvas = document.querySelector("#room-host canvas");
      return canvas && canvas.width > 0 && canvas.height > 0;
    });
    const savedRoute = await page.evaluate(
      () => JSON.parse(localStorage.getItem("headache-escape-v5")).route,
    );
    assert.equal(savedRoute.length, 10);
    assert.equal(new Set(savedRoute).size, 10);
    const savedRoom = await page
      .locator("#room-host")
      .getAttribute("data-room-id");
    await page.locator("#bag-button").click();
    await page.locator("#bag-dialog[open]").waitFor();
    await page.locator("#close-bag").click();
    await page.locator("#save-button").click();
    await page.locator("#save-dialog[open]").waitFor();
    assert.equal(await page.locator(".save-slot").count(), 5);
    await page.locator('[data-save-slot="0"]').click();
    assert.match(
      await page.locator("#slot-status").textContent(),
      /저장했어요/,
    );
    assert.equal(
      await page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("headache-escape-slots-v2")).length,
      ),
      5,
    );
    await page.locator("#close-save-dialog").click();
    await page.locator("#reset-button").click();
    await page.locator("#confirm-reset").click();
    await page.locator("[data-character-id]").first().waitFor();
    await page.locator("#load-button").click();
    assert.equal(await page.locator(".save-slot").count(), 5);
    page.once("dialog", (dialog) => dialog.accept());
    await page.locator('[data-load-slot="0"]').click();
    await page.locator("#room-host canvas").waitFor();
    assert.equal(
      await page.locator("#room-host").getAttribute("data-room-id"),
      savedRoom,
    );
    assert.deepEqual(
      await page.evaluate(
        () => JSON.parse(localStorage.getItem("headache-escape-v5")).route,
      ),
      savedRoute,
    );
    assert.deepEqual(errors, []);
    await page.screenshot({
      path: "/tmp/escape-published.png",
      fullPage: true,
    });
    console.log(
      "PASS: Escape published subpath loads all modules and art, renders the 3D room, and saves/loads one of five local slots.",
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
