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
    // A silently filtered data file leaves an empty game; fail loudly instead.
    await page
      .locator("[data-character-id]")
      .first()
      .waitFor({ timeout: 15000 })
      .catch(() => {
        throw new Error(
          "character selection never rendered; errors: " +
            JSON.stringify(errors),
        );
      });
    assert.equal(await page.locator("[data-character-id]").count(), 6);
    assert.equal(
      await page.locator(".character-selection h2").textContent(),
      "플레이어 선택 · 6명",
    );
    await page.locator("[data-character-id]").first().click();
    await page.locator("#start-adventure").click();
    await page.locator("#room-host canvas").waitFor();
    await page.waitForFunction(() => {
      const canvas = document.querySelector("#room-host canvas");
      return canvas && canvas.width > 0 && canvas.height > 0;
    });
    assert.equal(await page.locator(".world-object-button").count(), 15);
    const spread = await page.evaluate(() => {
      const canvas = document
        .querySelector("#room-host canvas")
        .getBoundingClientRect();
      const buttons = [...document.querySelectorAll("[data-room-object]")];
      const centers = buttons.map((button) => {
        const rect = button.getBoundingClientRect();
        return {
          x: (rect.left + rect.width / 2 - canvas.left) / canvas.width,
          y: (rect.top + rect.height / 2 - canvas.top) / canvas.height,
        };
      });
      return {
        x:
          Math.max(...centers.map((p) => p.x)) -
          Math.min(...centers.map((p) => p.x)),
        y:
          Math.max(...centers.map((p) => p.y)) -
          Math.min(...centers.map((p) => p.y)),
        labels: buttons.map(
          (button) =>
            button.textContent + " " + button.getAttribute("aria-label"),
        ),
      };
    });
    assert.ok(
      spread.x > 0.55 && spread.y > 0.55,
      "objects must use both axes rather than cluster in the centre",
    );
    assert.ok(spread.labels.every((label) => !label.includes("변형")));
    await page.locator('[data-room-object="0"]').click();
    await page.locator(".wikipedia-reading").waitFor();
    assert.ok(
      (await page.locator(".reading-passage").innerText()).length > 150,
    );
    assert.equal(await page.locator(".reading-attribution a").count(), 3);
    assert.match(
      await page.locator(".reading-attribution a").first().getAttribute("href"),
      /en\.wikipedia\.org\/w\/index\.php\?oldid=/,
    );
    await page.keyboard.press("Escape");
    assert.equal(
      await page.evaluate(
        () => JSON.parse(localStorage.getItem("headache-escape-v8")).version,
      ),
      8,
    );
    const savedRoute = await page.evaluate(
      () => JSON.parse(localStorage.getItem("headache-escape-v8")).route,
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
    assert.equal(await page.locator(".save-slot").count(), 10);
    await page.locator('[data-save-slot="0"]').click();
    assert.match(
      await page.locator("#slot-status").textContent(),
      /저장했어요/,
    );
    assert.equal(
      await page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("headache-escape-slots-v5")).length,
      ),
      10,
    );
    assert.equal(
      await page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("headache-escape-slots-v5"))[0].state
            .version,
      ),
      8,
    );
    await page.locator("#close-save-dialog").click();
    await page.locator("#reset-button").click();
    await page.locator("#confirm-reset").click();
    await page.locator("[data-character-id]").first().waitFor();
    await page.locator("#load-button").click();
    assert.equal(await page.locator(".save-slot").count(), 10);
    page.once("dialog", (dialog) => dialog.accept());
    await page.locator('[data-load-slot="0"]').click();
    await page.locator("#room-host canvas").waitFor();
    assert.equal(
      await page.locator("#room-host").getAttribute("data-room-id"),
      savedRoom,
    );
    assert.deepEqual(
      await page.evaluate(
        () => JSON.parse(localStorage.getItem("headache-escape-v8")).route,
      ),
      savedRoute,
    );
    const buildTerminalState = (correctCount) =>
      page.evaluate(async (wantedCorrect) => {
        const engine = await import("./engine.js");
        let next = engine.chooseCharacter(engine.freshState(0x12345678), "dad");
        for (let index = 0; index < 10; index += 1) {
          next = engine.openQuestion(next, index);
          const question = engine.currentQuestion(next);
          const answer =
            index < wantedCorrect
              ? question.answer
              : (question.answer + 1) % question.options.length;
          next = engine.answerQuestion(next, answer).state;
          if (next.feedback) next = engine.continueQuiz(next);
          if (next.phase !== "quiz") break;
        }
        return next;
      }, correctCount);
    const affordableRescue = await buildTerminalState(4);
    assert.equal(affordableRescue.phase, "rescue");
    assert.equal(affordableRescue.rescueSlot, 9);
    await page.evaluate((terminal) => {
      localStorage.setItem("headache-escape-v8", JSON.stringify(terminal));
    }, affordableRescue);
    await page.reload();
    await page.locator("#rescue-accept").waitFor();
    assert.match(
      await page.locator("#challenge").textContent(),
      /5 GOLD를 사용해서 한 문제를 더 풀 수 있습니다\. 진행하겠습니까\?/,
    );
    await page.locator("#rescue-accept").click();
    await page.locator("#room-host canvas").waitFor();
    assert.equal(await page.locator(".world-object-button").count(), 15);
    const paidState = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("headache-escape-v8")),
    );
    assert.equal(paidState.phase, "quiz");
    assert.equal(paidState.retiredQuestions.length, 1);
    assert.equal(paidState.bonusSpent, 5);
    assert.equal(paidState.gold, 0);
    const declinedRescue = await buildTerminalState(4);
    await page.evaluate((terminal) => {
      localStorage.setItem("headache-escape-v8", JSON.stringify(terminal));
    }, declinedRescue);
    await page.reload();
    await page.locator("#rescue-decline").waitFor();
    await page.locator("#rescue-decline").click();
    await page.locator("#gameover-heading").waitFor();
    assert.equal(
      await page.locator("#gameover-heading").textContent(),
      "GAME OVER",
    );
    await page.locator("#restart-no").click();
    await page.locator("#restart-later").waitFor();
    await page.locator("#restart-later").click();
    await page.locator("[data-character-id]").first().waitFor();
    const insufficientGameOver = await buildTerminalState(2);
    assert.equal(insufficientGameOver.phase, "gameover");
    assert.equal(insufficientGameOver.gameOverReason, "gold");
    await page.evaluate((terminal) => {
      localStorage.setItem("headache-escape-v8", JSON.stringify(terminal));
    }, insufficientGameOver);
    await page.reload();
    await page.locator("#gameover-heading").waitFor();
    assert.match(await page.locator("#challenge").textContent(), /GOLD가 부족/);
    await page.locator("#restart-yes").click();
    await page.locator("[data-character-id]").first().waitFor();
    assert.equal(
      await page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("headache-escape-slots-v5")).length,
      ),
      10,
    );
    assert.deepEqual(errors, []);
    await page.screenshot({
      path: "/tmp/escape-published.png",
      fullPage: true,
    });
    console.log(
      "PASS: Escape loads six characters, renders the 3D room, and saves/loads one of ten local player slots.",
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
