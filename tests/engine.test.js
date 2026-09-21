import test from "node:test";
import assert from "node:assert/strict";
import { levels, questionPool, questionById } from "../levels.js";
import { catalog } from "../avatar.js";
import { characters } from "../characters.js";
import {
  rooms,
  makeRoute,
  destinationRoom,
  destinationChoices,
  currentRoom,
  EXIT_ROOM,
  stageNarrative,
} from "../rooms.js";
import {
  freshState,
  chooseCharacter,
  restoreState,
  sampleDeck,
  score,
  answeredCount,
  questionForObject,
  currentQuestion,
  openQuestion,
  closeQuestion,
  answerQuestion,
  continueQuiz,
  retryStage,
  openDestination,
  chooseDestination,
  openWardrobe,
  purchaseItem,
  equipItem,
  beginTravel,
  finishTravel,
  inventory,
  POINTS,
  avatarMood,
  layoutSeed,
} from "../engine.js";

const ORDER = [
  19, 0, 13, 4, 17, 2, 11, 6, 15, 8, 1, 18, 3, 16, 5, 14, 7, 12, 9, 10,
];
const start = (seed = 123, character = "dad") =>
  chooseCharacter(freshState(seed), character);
test("English questions explain meaning and conversation without grammar terminology", () => {
  // Do not mistake ordinary phrases such as "보여 주어" for the grammar noun.
  const jargon =
    /간접의문문|관계대명사|관계부사|현재완료|수동태|가정법|분사구문|현재분사|과거분사|동명사|부정사|주어[은는이가를의와]|목적어|형용사|명사형|동사원형|접속사|선행사|indirect question|relative pronoun|passive voice|present perfect|gerund|infinitive/i;
  for (const level of [1, 6, 8]) {
    for (const question of questionPool(level)) {
      assert.doesNotMatch(
        question.prompt + " " + question.explanation,
        jargon,
        question.id,
      );
    }
    assert.doesNotMatch(
      levels[level - 1].subject + levels[level - 1].intro,
      jargon,
    );
  }
});
test("avatar reactions reflect the actual answer and survive feedback reload", () => {
  const ready = openQuestion(start(), 19);
  const question = currentQuestion(ready);
  const right = answerQuestion(ready, question.answer).state;
  const wrong = answerQuestion(ready, (question.answer + 1) % 4).state;
  assert.equal(avatarMood(ready), "neutral");
  assert.equal(avatarMood(right), "happy");
  assert.equal(avatarMood(wrong), "sad");
  assert.equal(avatarMood(restoreState(JSON.stringify(right))), "happy");
  assert.equal(avatarMood(restoreState(JSON.stringify(wrong))), "sad");
  assert.equal(avatarMood(continueQuiz(right)), "neutral");
  assert.equal(avatarMood(completeRound(start(), 14)), "sad");
  assert.equal(avatarMood(completeRound(start(), 15)), "happy");
});
test("every new game draws a distinct ten-room route from the 200-space pool", () => {
  assert.equal(rooms.length, 200);
  assert.equal(new Set(rooms.map((room) => room.id)).size, 200);
  assert.equal(new Set(rooms.map((room) => room.name)).size, 200);
  const routes = new Set();
  for (let seed = 1; seed <= 300; seed++) {
    const state = chooseCharacter(freshState(seed), "mom");
    assert.deepEqual(state.route, makeRoute(seed));
    assert.equal(new Set(state.route).size, 10);
    routes.add(state.route.join(","));
    assert.deepEqual(restoreState(JSON.stringify(state)).route, state.route);
    for (let level = 0; level < 10; level++) {
      const staged = { ...state, level };
      const destination = destinationRoom(staged);
      assert.equal(
        destination,
        level === 9
          ? EXIT_ROOM
          : rooms.find((room) => room.id === state.route[level + 1]),
      );
      const choices = destinationChoices(staged);
      assert.equal(choices.length, 3);
      assert.equal(new Set(choices.map((room) => room.id)).size, 3);
      assert.ok(choices.includes(destination));
      for (const other of choices.filter((room) => room !== destination)) {
        assert.ok(
          !state.route.includes(other.id),
          "distractors never reveal a later room",
        );
        assert.ok(
          !other.clues.some((clue) => destination.clues.includes(clue)),
          "clue words identify one option",
        );
      }
      assert.deepEqual(
        destinationChoices(staged),
        choices,
        "options are stable on reload",
      );
    }
  }
  assert.ok(routes.size > 290, "routes differ between games");
  assert.equal(
    currentRoom(chooseCharacter(freshState(7), "dad")).id,
    makeRoute(7)[0],
  );
});
test("room texts never assert a position in the journey; the stage line does", () => {
  // Any room can be first or last, so its own copy must not claim otherwise.
  const positional =
    /마지막 (관문|방|장소|시험)|첫 (번째 )?(방|장소|관문)|모험이 시작|모험의 끝|드디어 탈출|탈출에 성공/;
  for (const room of rooms)
    assert.doesNotMatch(
      room.name + " " + room.description,
      positional,
      room.id,
    );
  const state = chooseCharacter(freshState(99), "dad");
  const lines = [];
  for (let level = 0; level < 10; level++) {
    const line = stageNarrative({ ...state, level });
    lines.push(line);
    assert.doesNotMatch(line, /undefined|\$\{/);
    if (level === 0) assert.match(line, /모험이 시작/);
    else assert.doesNotMatch(line, /모험이 시작/);
    if (level === 9)
      assert.match(line, new RegExp(`마지막 관문.*${EXIT_ROOM.name}`));
    else assert.doesNotMatch(line, /마지막 관문이에요/);
    if (level > 0 && level < 9)
      assert.match(line, new RegExp(`${level + 1}번째|아홉 번째`));
  }
  assert.equal(new Set(lines).size, 10);
  // Particles follow the final consonant of the setting word.
  const gate = rooms.find((room) => room.themeId === 10);
  const hall = rooms.find((room) => room.themeId === 3);
  const corridor = rooms.find((room) => room.themeId === 9);
  const at = (room, level) =>
    stageNarrative({
      ...state,
      level,
      route: state.route.map((id, index) => (index === level ? room.id : id)),
    });
  assert.match(at(gate, 9), /이 관문이 마지막/);
  assert.match(at(hall, 9), /이 홀이 마지막/);
  assert.match(at(corridor, 9), /이 통로가 마지막/);
  assert.match(at(corridor, 4), /이 통로는 5번째/);
  assert.match(at(gate, 4), /이 관문은 5번째/);
});
test("layout seeds vary by run stage and retry but stay stable on resume", () => {
  const state = start();
  assert.equal(
    layoutSeed(state),
    layoutSeed(restoreState(JSON.stringify(state))),
  );
  assert.notEqual(layoutSeed(state), layoutSeed(start(456)));
  assert.notEqual(layoutSeed(state), layoutSeed({ ...state, level: 1 }));
  assert.notEqual(
    layoutSeed(state),
    layoutSeed(retryStage(completeRound(state, 14))),
  );
});
function completeRound(state = start(), correct = 20) {
  for (const [index, object] of ORDER.entries()) {
    state = openQuestion(state, object);
    const question = currentQuestion(state);
    assert.ok(question, `object ${object} can be opened in arbitrary order`);
    const result = answerQuestion(
      state,
      index < correct ? question.answer : (question.answer + 1) % 4,
    );
    assert.equal(result.accepted, true);
    state = continueQuiz(result.state);
  }
  return state;
}
function outfitState() {
  const state = openDestination(completeRound());
  return chooseDestination(state, destinationRoom(state).id).state;
}
function roundtrip(state) {
  assert.deepEqual(restoreState(JSON.stringify(state)), state);
}
function assertReset(raw) {
  const reset = restoreState(raw);
  assert.equal(reset.phase, "character");
  assert.equal(reset.characterId, null);
  assert.equal(reset.points, 0);
  assert.equal(answeredCount(reset), 0);
  assert.equal(reset.deckIds.length, 0);
}

test("all stages have substantial static pools and valid unique questions", () => {
  const ids = new Set();
  for (const [index, level] of levels.entries()) {
    const pool = questionPool(level.id);
    assert.ok(
      pool.length >= 80,
      `level ${level.id} must have at least 80 questions`,
    );
    assert.equal(
      new Set(pool.map((q) => q.prompt)).size,
      pool.length,
      `level ${level.id} distinct prompts`,
    );
    for (const answer of [0, 1, 2, 3]) {
      assert.ok(
        pool.filter((question) => question.answer === answer).length <=
          pool.length / 2,
        `level ${level.id}: a fixed answer must not dominate`,
      );
    }
    for (const question of pool) {
      assert.ok(
        question.id && !ids.has(question.id),
        "global unique stable ID",
      );
      ids.add(question.id);
      assert.ok(question.prompt && question.explanation);
      assert.equal(question.options.length, 4);
      assert.equal(new Set(question.options).size, 4);
      assert.ok(
        Number.isInteger(question.answer) &&
          question.answer >= 0 &&
          question.answer <= 3,
      );
      assert.ok([1, 2, 3].includes(question.difficulty));
      assert.strictEqual(questionById(level.id, question.id), question);
      if (level.id === 8) {
        const word = question.options[question.answer];
        assert.match(word, /^[a-z]+$/i);
        const hint = question.prompt.match(/\(([a-z]), (\d+) letters\)/i);
        if (hint) {
          assert.equal(
            word[0].toLowerCase(),
            hint[1].toLowerCase(),
            question.id,
          );
          assert.equal(word.length, Number(hint[2]), question.id);
        }
      }
    }
  }
  assert.ok(ids.size >= 800);
});

test("English stages explicitly use middle-school year 3 rather than elementary labels", () => {
  for (const id of [1, 6, 8]) {
    assert.match(levels[id - 1].subject, /중학교 3학년/);
    assert.ok(questionPool(id).some((q) => q.difficulty === 3));
  }
});

test("character selection gates play and persists all four family identities", () => {
  assert.deepEqual(
    characters.map((c) => [c.id, c.name]),
    [
      ["dad", "아빠"],
      ["mom", "엄마"],
      ["jeongan", "정안"],
      ["suan", "수안"],
    ],
  );
  const initial = freshState(1);
  assert.equal(openQuestion(initial, 0), initial);
  assert.equal(answerQuestion(initial, 0).accepted, false);
  assert.equal(chooseCharacter(initial, "unknown"), initial);
  roundtrip(initial);
  for (const character of characters) {
    const state = chooseCharacter(initial, character.id);
    assert.equal(state.phase, "quiz");
    assert.equal(state.characterId, character.id);
    assert.equal(state.deckIds.length, 20);
    assert.equal(state.selected, null);
    assert.strictEqual(chooseCharacter(state, "dad"), state);
    roundtrip(state);
  }
});

test("new games draw random subsets while saved decks remain stable", () => {
  for (const level of levels) {
    const first = sampleDeck(level.id, 100);
    const second = sampleDeck(level.id, 200);
    assert.equal(new Set(first).size, 20);
    assert.notDeepEqual(first, second);
    assert.notDeepEqual(
      [...first].sort(),
      [...second].sort(),
      "new games change content, not just order",
    );
    assert.deepEqual(first, sampleDeck(level.id, 100));
    assert.ok(first.every((id) => questionById(level.id, id)));
  }
  const state = start();
  roundtrip(state);
  assert.throws(
    () =>
      sampleDeck(
        1,
        1,
        questionPool(1).map((q) => q.id),
      ),
    RangeError,
  );
});

test("all 20 objects can be selected freely, dismissed, revisited and answered once", () => {
  let state = start();
  const original = [...state.deckIds];
  for (const slot of ORDER) {
    assert.equal(state.answers[slot], null);
    const preview = openQuestion(state, slot);
    assert.equal(preview.selected, slot);
    assert.equal(currentQuestion(preview).id, original[slot]);
    roundtrip(preview);
    const dismissed = closeQuestion(preview);
    assert.deepEqual(dismissed, state, "dismissal does not reroll or grade");
    const reopened = openQuestion(dismissed, slot);
    const question = currentQuestion(reopened);
    const result = answerQuestion(reopened, question.answer);
    assert.equal(result.state.answers[slot], question.answer);
    assert.equal(result.reward, POINTS[question.difficulty]);
    assert.equal(answerQuestion(result.state, question.answer).accepted, false);
    assert.strictEqual(
      openQuestion(result.state, (slot + 1) % 20),
      result.state,
    );
    roundtrip(result.state);
    state = continueQuiz(result.state);
    assert.strictEqual(
      openQuestion(state, slot),
      state,
      "answered object cannot be reused",
    );
  }
  assert.equal(state.phase, "result");
  assert.equal(score(state), 20);
  assert.equal(answeredCount(state), 20);
  assert.deepEqual(state.deckIds, original);
  assert.equal(inventory(state).length, 3);
  roundtrip(state);
});

test("wrong answers consume objects without points and invalid inputs do not consume objects", () => {
  const initial = openQuestion(start(), 17);
  const wrong = answerQuestion(initial, -1);
  assert.equal(wrong.correct, false);
  assert.equal(wrong.reward, 0);
  assert.equal(wrong.state.answers[17], -1);
  assert.equal(answeredCount(wrong.state), 1);
  assert.equal(wrong.state.points, 0);
  assert.equal(initial.answers[17], null, "immutable source");
  for (const answer of [-2, 4, 1.5, null, "0"])
    assert.equal(answerQuestion(initial, answer).accepted, false);
  for (const object of [-1, 20, 1.2, null, "1"]) {
    const state = start();
    assert.strictEqual(openQuestion(state, object), state);
  }
});

test("14 fails, 15 passes, and 20 answered objects are always required", () => {
  for (const correct of [0, 14, 15, 20]) {
    const state = completeRound(start(), correct);
    assert.equal(score(state), correct);
    assert.equal(answeredCount(state), 20);
    assert.equal(
      openDestination(state).phase,
      correct >= 15 ? "destination" : "result",
    );
    assert.equal(retryStage(state).phase, correct < 15 ? "quiz" : "result");
    roundtrip(state);
  }
  let state = start();
  for (const slot of ORDER.slice(0, 15)) {
    state = openQuestion(state, slot);
    state = continueQuiz(
      answerQuestion(state, currentQuestion(state).answer).state,
    );
  }
  assert.equal(score(state), 15);
  assert.equal(state.phase, "quiz");
  assert.strictEqual(openDestination(state), state);
  assert.strictEqual(beginTravel(state), state);
});

test("retry uses unseen questions before recycling and never overlaps the previous attempt", () => {
  for (const level of levels) {
    let state = start();
    state = {
      ...state,
      level: level.id - 1,
      deckIds: sampleDeck(level.id, 100),
    };
    const initialRounds = Math.floor(questionPool(level.id).length / 20);
    const seen = new Set();
    for (let attempt = 0; attempt < initialRounds + 3; attempt++) {
      if (attempt < initialRounds) {
        assert.ok(
          state.deckIds.every((id) => !seen.has(id)),
          `unseen level${level.id} round${attempt}`,
        );
        state.deckIds.forEach((id) => seen.add(id));
      }
      const previous = [...state.deckIds];
      const failed = completeRound(state, 14);
      state = retryStage(failed);
      assert.ok(
        state.deckIds.every((id) => !previous.includes(id)),
        "no immediately repeated questions",
      );
      assert.equal(state.points, failed.points);
      assert.equal(answeredCount(state), 0);
      assert.equal(state.selected, null);
    }
  }
  const retry = retryStage(completeRound(start(), 14));
  assert.equal(inventory(retry).length, 2);
  roundtrip(retry);
});

test("destination outfit purchase and travel remain gated and preserve character", () => {
  let state = outfitState();
  assert.equal(state.phase, "outfit");
  assert.equal(state.characterId, "dad");
  assert.strictEqual(finishTravel(state), state);
  state = openWardrobe(state);
  const item = catalog.find(
    (item) => item.price > 0 && item.price <= state.points,
  );
  const bought = purchaseItem(state, item.id);
  assert.equal(bought.purchased, true);
  assert.equal(bought.state.points, state.points - item.price);
  assert.equal(bought.state.equipped[item.category], item.id);
  assert.equal(purchaseItem(bought.state, item.id).purchased, false);
  assert.equal(purchaseItem({ ...state, points: 0 }, item.id).purchased, false);
  const starter = catalog.find(
    (entry) => entry.category === item.category && entry.price === 0,
  );
  const equipped = equipItem(bought.state, starter.id);
  assert.equal(equipped.points, bought.state.points);
  roundtrip(equipped);
  const travel = beginTravel(equipped);
  roundtrip(travel);
  const arrived = finishTravel(travel);
  assert.equal(arrived.level, 1);
  assert.equal(arrived.characterId, "dad");
  assert.equal(arrived.points, equipped.points);
  assert.equal(arrived.deckIds.length, 20);
  assert.equal(arrived.seenIds.length, 0);
  assert.equal(answeredCount(arrived), 0);
  assert.strictEqual(finishTravel(arrived), arrived);
  roundtrip(arrived);
});

test("all 200 questions can be completed in arbitrary order across 10 stages", () => {
  let state = start(4321, "jeongan");
  for (let index = 0; index < 10; index++) {
    state = completeRound(state, 15);
    assert.equal(inventory(state).length, (index + 1) * 3);
    state = chooseDestination(
      openDestination(state),
      destinationRoom(state).id,
    ).state;
    state = finishTravel(beginTravel(state));
    roundtrip(state);
  }
  assert.equal(state.phase, "complete");
  assert.equal(state.characterId, "jeongan");
  assert.equal(state.records.length, 10);
  assert.equal(
    state.records.reduce((sum, r) => sum + r.score, 0),
    150,
  );
  assert.equal(currentQuestion(state), null);
  assert.equal(inventory(state).length, 30);
});

test("corrupt saves cannot invent deck objects, scores, characters or purchases", () => {
  for (const raw of [null, "null", "{}", "[]", "{broken", "42"])
    assertReset(raw);
  const valid = start();
  for (const patch of [
    { version: 2 },
    { version: 3 },
    { version: 4 },
    { seed: -1 },
    { level: 10 },
    { attempt: -1 },
    { characterId: "missing" },
    { answers: [null] },
    { answers: Array(20).fill(4) },
    { selected: 20 },
    { selected: -1 },
    { feedback: true },
    { phase: "shop" },
    { points: -1 },
    { points: 100 },
    { earned: 100 },
    { deckIds: Array(20).fill(valid.deckIds[0]) },
    { deckIds: ["unknown", ...valid.deckIds.slice(1)] },
    { seenIds: [valid.deckIds[0]] },
    { owned: [] },
    { equipped: { eyes: "missing" } },
  ])
    assertReset(JSON.stringify({ ...valid, ...patch }));
});

test("previously reviewed arithmetic and shadow facts remain correct", () => {
  for (const [level, phrase, expected] of [
    [2, "2시 35분", "3시"],
    [2, "분모가 6인", "3/6"],
    [7, "45,678", "5000"],
    [7, "80,000 - 26,500", "53,500"],
    [7, "56,789", "6"],
    [10, "손전등과 벽은 고정", "더 커진다"],
  ]) {
    const question = questionPool(level).find((q) => q.prompt.includes(phrase));
    assert.ok(question, phrase);
    assert.equal(question.options[question.answer], expected, phrase);
  }
});
