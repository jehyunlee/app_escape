import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  questionPool,
  questionById,
  curriculum,
  dadTopic,
  playerTier,
} from "../levels.js";
import {
  freshState,
  chooseCharacter,
  restoreState,
  openQuestion,
  currentQuestion,
  answerQuestion,
  continueQuiz,
} from "../engine.js";
import { wikipediaReadingMarkup } from "../wikipedia-reading.js";

const topics = ["science", "ai", "history"];

test("dad receives only English Wikipedia reading across every stage", () => {
  for (let stage = 1; stage <= 10; stage++) {
    const topic = topics[(stage - 1) % 3];
    assert.equal(dadTopic(stage), topic);
    assert.equal(playerTier("dad", stage), "wikipedia");
    assert.equal(curriculum(stage, "dad").spelling, false);
    assert.match(curriculum(stage, "dad").subject, /아빠 영어 독해/);
    assert.ok(
      questionPool(stage, "dad").every(
        (q) => q.topic === topic && q.passage && q.source,
      ),
    );
  }
  assert.throws(() => dadTopic(0), RangeError);
  assert.throws(() => dadTopic(11), RangeError);
});

test("all 240 questions use exact stored Wikipedia excerpts with traceable revisions", () => {
  const allIds = new Set();
  for (const [index, topic] of topics.entries()) {
    const data = JSON.parse(
      readFileSync(
        new URL(`../assets/wikipedia/${topic}-sources.json`, import.meta.url),
        "utf8",
      ),
    );
    assert.ok(data.articles.length >= 8, topic);
    assert.equal(data.passages.length, 20, topic);
    const articles = new Map(
      data.articles.map((article) => [article.id, article]),
    );
    const passages = new Map(
      data.passages.map((passage) => [passage.id, passage]),
    );
    assert.equal(articles.size, data.articles.length);
    assert.equal(passages.size, 20);
    assert.equal(new Set(data.passages.map((p) => p.text)).size, 20);
    for (const passage of passages.values()) {
      const article = articles.get(passage.articleId);
      assert.ok(article, passage.id);
      assert.ok(passage.text.length >= 150, passage.id);
      assert.ok(
        article.extract.includes(passage.text),
        `${passage.id}: must be a verbatim, contiguous Wikipedia excerpt`,
      );
      assert.equal(new URL(article.url).hostname, "en.wikipedia.org");
      assert.ok(Number.isInteger(article.revisionId) && article.revisionId > 0);
      assert.equal(new URL(article.revisionUrl).hostname, "en.wikipedia.org");
      assert.equal(
        Number(new URL(article.revisionUrl).searchParams.get("oldid")),
        article.revisionId,
      );
      assert.ok(Number.isFinite(Date.parse(article.revisionTimestamp)));
      assert.ok(Number.isFinite(Date.parse(article.retrievedAt)));
    }
    const pool = questionPool(index + 1, "dad");
    assert.equal(pool.length, 80);
    const usage = new Map();
    for (const q of pool) {
      assert.ok(!allIds.has(q.id), q.id);
      allIds.add(q.id);
      const p = passages.get(q.passageId),
        article = p && articles.get(p.articleId);
      assert.ok(p && article, q.id);
      assert.equal(q.passage, p.text);
      assert.equal(q.source.title, article.title);
      assert.equal(q.source.url, article.url);
      assert.equal(q.source.revisionId, article.revisionId);
      assert.equal(q.source.revisionUrl, article.revisionUrl);
      assert.equal(q.source.revisionTimestamp, article.revisionTimestamp);
      assert.equal(q.source.retrievedAt, article.retrievedAt);
      assert.equal(q.source.attribution, "Wikipedia contributors");
      assert.equal(q.source.license, "CC BY-SA 4.0");
      assert.equal(
        q.source.licenseUrl,
        "https://creativecommons.org/licenses/by-sa/4.0/",
      );
      assert.equal(q.topic, topic);
      assert.doesNotMatch(q.prompt, /[가-힣]/, q.id);
      assert.ok(
        q.options.every(
          (option) => typeof option === "string" && !/[가-힣]/.test(option),
        ),
        q.id,
      );
      assert.equal(new Set(q.options).size, 4, q.id);
      assert.ok(
        Number.isInteger(q.answer) && q.answer >= 0 && q.answer < 4,
        q.id,
      );
      assert.ok(q.explanation.length > 20, q.id);
      assert.strictEqual(questionById(index + 1, q.id, "dad"), q);
      usage.set(q.passageId, (usage.get(q.passageId) || 0) + 1);
    }
    assert.equal(usage.size, 20);
    assert.ok([...usage.values()].every((count) => count === 4));
    for (let answer = 0; answer < 4; answer++)
      assert.equal(pool.filter((q) => q.answer === answer).length, 20);
  }
  assert.equal(allIds.size, 240);
});

test("other characters retain their original curriculum and questions", () => {
  for (const character of ["mom", "jeongan", "suan", "yewon", "hunho"])
    for (let stage = 1; stage <= 10; stage++) {
      assert.notEqual(playerTier(character, stage), "wikipedia");
      assert.ok(
        questionPool(stage, character).every((q) => !q.id.startsWith("dad-")),
      );
    }
  assert.equal(curriculum(8, "mom").spelling, true);
  assert.match(curriculum(2, "mom").subject, /3학년 수학/);
  assert.match(curriculum(6, "yewon").subject, /고등학교 1학년/);
  assert.match(curriculum(9, "hunho").subject, /수능/);
});

test("corrected questions do not import facts from an unshown article paragraph", () => {
  const science = questionPool(1, "dad");
  for (const id of [
    "dad-science-013",
    "dad-science-014",
    "dad-science-015",
    "dad-science-016",
  ]) {
    const q = science.find((question) => question.id === id);
    assert.match(q.passage, /ionizing radiation/);
    assert.doesNotMatch(
      q.prompt + " " + q.options[q.answer] + " " + q.explanation,
      /Röntgen|1895|뢴트겐/,
    );
  }
  const germ = science.find((q) => q.id === "dad-science-077");
  assert.match(germ.passage, /struggling to compete/);
  assert.doesNotMatch(
    germ.options[germ.answer] + " " + germ.explanation,
    /Galen|remained dominant/,
  );
  const printing = questionPool(3, "dad").find(
    (q) => q.id === "dad-history-002",
  );
  assert.match(printing.passage, /vernacular languages/);
  assert.doesNotMatch(
    printing.options[printing.answer],
    /transfer ink|pressure/i,
  );
});

test("saved dad reading decks remain fixed and scores still clear at ten", () => {
  let state = chooseCharacter(freshState(451), "dad");
  const deck = [...state.deckIds];
  for (let i = 0; i < 10; i++) {
    state = openQuestion(state, i);
    const question = currentQuestion(state);
    assert.ok(question.source.revisionId);
    const resumed = restoreState(JSON.stringify(state));
    assert.deepEqual(resumed, state);
    assert.equal(currentQuestion(resumed).passage, question.passage);
    state = continueQuiz(answerQuestion(state, question.answer).state);
  }
  assert.equal(state.phase, "destination");
  assert.deepEqual(state.deckIds, deck);
  assert.equal(state.gold, 23);
});

test("passage presentation escapes text and exposes stable attribution links", () => {
  const q = questionPool(1, "dad")[0];
  const html = wikipediaReadingMarkup({
    ...q,
    passage: 'A <script> & "quoted" passage.',
  });
  assert.ok(html.includes("&lt;script&gt;"));
  assert.ok(!html.includes("<script>"));
  assert.ok(html.includes(q.source.revisionUrl.replaceAll("&", "&amp;")));
  assert.ok(html.includes("Wikipedia contributors"));
  assert.ok(html.includes("CC BY-SA 4.0"));
  assert.ok(html.includes('lang="en"'));
  assert.ok(html.includes("자동 갱신되지 않습니다"));
  assert.equal(wikipediaReadingMarkup({ prompt: "ordinary question" }), "");
  assert.throws(
    () =>
      wikipediaReadingMarkup({
        ...q,
        source: { ...q.source, url: "javascript:alert(1)" },
      }),
    TypeError,
  );
  assert.throws(
    () =>
      wikipediaReadingMarkup({
        ...q,
        source: { ...q.source, revisionUrl: "https://example.com/source" },
      }),
    TypeError,
  );
});
