import test from "node:test";
import assert from "node:assert/strict";
import {
  levels,
  questionPool,
  curriculum,
  playerTier,
  QUESTION_COUNT,
  PASS_SCORE,
} from "../levels.js";
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
  facilities,
} from "../rooms.js";
import {
  freshState,
  chooseCharacter,
  restoreState,
  score,
  answeredCount,
  currentQuestion,
  questionForObject,
  openQuestion,
  closeQuestion,
  answerQuestion,
  continueQuiz,
  acceptExtraQuestion,
  declineExtraQuestion,
  questionCapacity,
  remainingQuestions,
  canStillPass,
  chooseDestination,
  startStage,
  purchaseItem,
  equipItem,
  beginTravel,
  finishTravel,
  inventory,
  avatarMood,
  takePhoto,
  deletePhoto,
} from "../engine.js";
const start = (character = "dad", seed = 123) =>
  chooseCharacter(freshState(seed), character);

test("all 200 areas belong to referenced Hogwarts castle or grounds facilities", () => {
  assert.equal(facilities.length, 40);
  assert.ok(facilities.filter((f) => f.scope === "grounds").length >= 7);
  assert.equal(new Set(facilities.map((f) => f.name)).size, 40);
  for (const room of rooms) {
    const facility = facilities.find((f) => f.id === room.facilityId);
    assert.ok(facility, room.id);
    assert.equal(room.facilityName, facility.name);
    assert.ok(room.name.startsWith(`${facility.name} · `));
    assert.ok(facility.areas.some((area) => area.name === room.areaName));
    assert.equal(room.scope, facility.scope);
    assert.equal(room.gameArea, true);
    assert.ok(room.source.startsWith("https://namu.wiki/w/"));
    assert.equal(room.image, `assets/hogwarts/${facility.id}.webp`);
    assert.equal(new Set(room.clues).size, 3);
  }
  for (const facility of facilities)
    assert.equal(
      rooms.filter((room) => room.facilityId === facility.id).length,
      5,
    );
});
function answer(state, index, correct = true) {
  const opened = openQuestion(state, index);
  const q = currentQuestion(opened);
  assert.ok(q);
  return answerQuestion(opened, correct ? q.answer : (q.answer + 1) % 4).state;
}
function pass(state = start()) {
  for (let i = 0; i < PASS_SCORE; i++) state = continueQuiz(answer(state, i));
  return state;
}
function roundtrip(s) {
  assert.deepEqual(restoreState(JSON.stringify(s)), s);
}
function shop(state = start()) {
  const won = pass(state);
  return finishTravel(
    beginTravel(chooseDestination(won, destinationRoom(won).id).state),
  );
}

test("three clues arrive at 3, 6, and 10 correct answers", () => {
  let state = start();
  const expected = [0, 0, 1, 1, 1, 2, 2, 2, 2, 3];
  for (let i = 0; i < 10; i++) {
    state = answer(state, i);
    assert.equal(inventory(state).length, expected[i], `correct ${i + 1}`);
    roundtrip(state);
    state = continueQuiz(state);
  }
  assert.equal(state.phase, "destination");
});

test("ten correct on the fifteenth attempt passes, but nine correct does not", () => {
  let state = start();
  for (let i = 0; i < 5; i++) state = continueQuiz(answer(state, i, false));
  for (let i = 5; i < 14; i++) state = continueQuiz(answer(state, i, true));
  assert.equal(score(state), 9);
  assert.equal(state.phase, "quiz");
  state = answer(state, 14, true);
  assert.equal(score(state), 10);
  assert.equal(answeredCount(state), 15);
  assert.equal(state.phase, "result");
  roundtrip(state);
  assert.equal(continueQuiz(state).phase, "destination");
  assert.strictEqual(openQuestion(start(), 15).selected, null);
});

test("all six characters have correct grade routing across ten stages", () => {
  assert.equal(characters.length, 6);
  for (const c of characters)
    for (let l = 1; l <= 10; l++) {
      const p = questionPool(l, c.id);
      assert.ok(p.length >= 80, `${c.id}/${l}`);
      assert.equal(
        new Set(p.map((q) => q.prompt)).size,
        p.length,
        `${c.id}/${l} prompt uniqueness`,
      );
      for (const q of p) {
        assert.ok(q.id && q.prompt && q.explanation);
        assert.equal(q.options.length, 4);
        assert.equal(new Set(q.options).size, 4, q.id);
        assert.ok(
          Number.isInteger(q.answer) && q.answer >= 0 && q.answer < 4,
          q.id,
        );
        assert.ok([1, 2, 3].includes(q.difficulty));
      }
      if (c.id === "hunho") {
        assert.equal(playerTier(c.id, l), "exam");
        assert.match(curriculum(l, c.id).subject, /수능/);
        assert.equal(curriculum(l, c.id).spelling, false);
      }
      if (c.id === "yewon")
        assert.equal(playerTier(c.id, l), l <= 5 ? "middle" : "high1");
    }
  assert.equal(curriculum(8, "dad").spelling, true);
});
test("new characters receive different question pools rather than relabeled elementary questions", () => {
  const ids = (c) => new Set(questionPool(2, c).map((q) => q.id));
  for (const id of ids("hunho")) {
    assert.ok(!ids("dad").has(id));
    assert.ok(!ids("yewon").has(id));
  }
  assert.match(curriculum(5, "yewon").subject, /중학교 3학년/);
  assert.match(curriculum(6, "yewon").subject, /고등학교 1학년/);
});
test("200-space route remains distinct and options do not spoil later rooms", () => {
  assert.equal(rooms.length, 200);
  const all = new Set();
  for (let seed = 0; seed < 100; seed++) {
    const state = start("mom", seed);
    roundtrip(state);
    all.add(state.route.join(","));
    assert.deepEqual(state.route, makeRoute(seed));
    assert.equal(new Set(state.route).size, 10);
    assert.equal(
      new Set(
        state.route.map(
          (id) => rooms.find((room) => room.id === id).facilityId,
        ),
      ).size,
      10,
    );
    for (let l = 0; l < 10; l++) {
      const s = { ...state, level: l };
      const choices = destinationChoices(s),
        dest = destinationRoom(s);
      assert.equal(choices.length, 3);
      assert.ok(choices.some((c) => c.id === dest.id));
      for (const c of choices.filter((c) => c.id !== dest.id))
        assert.ok(!state.route.includes(c.id));
    }
  }
  assert.ok(all.size > 95);
});
test("initial gold is 3; correct gives 2 and wrong loses 1 without going negative", () => {
  let s = start();
  assert.equal(s.gold, 3);
  for (let i = 0; i < 5; i++) {
    s = answer(s, i, false);
    assert.equal(s.gold, Math.max(0, 2 - i));
    assert.equal(avatarMood(s), "sad");
    roundtrip(s);
    s = continueQuiz(s);
  }
  s = answer(s, 8, true);
  assert.equal(s.gold, 2);
  assert.equal(s.earned, 2);
  assert.equal(s.lost, 3);
  assert.equal(avatarMood(s), "happy");
  roundtrip(s);
  const again = answerQuestion(s, 0);
  assert.equal(again.accepted, false);
  assert.equal(again.state.gold, 2);
});
test("the tenth correct answer clears immediately with five untouched objects", () => {
  let s = start();
  assert.equal(QUESTION_COUNT, 15);
  assert.equal(PASS_SCORE, 10);
  assert.equal(s.deckIds.length, 15);
  for (let i = 0; i < PASS_SCORE - 1; i++) s = continueQuiz(answer(s, i));
  s = answer(s, 14);
  assert.equal(s.phase, "result");
  assert.equal(s.feedback, true);
  assert.equal(score(s), 10);
  assert.equal(answeredCount(s), 10);
  assert.equal(s.answers.filter((a) => a === null).length, 5);
  assert.equal(inventory(s).length, 3);
  roundtrip(s);
  assert.strictEqual(openQuestion(s, 15), s);
  assert.equal(answerQuestion(s, 0).accepted, false);
  s = continueQuiz(s);
  assert.equal(s.phase, "destination");
  assert.equal(s.gold, 23);
  roundtrip(s);
});
test("mathematical impossibility asks for rescue only when five GOLD remains", () => {
  let s = start();
  for (let i = 0; i < 5; i++) s = continueQuiz(answer(s, i, false));
  assert.equal(score(s), 0);
  assert.equal(remainingQuestions(s), 10);
  assert.equal(canStillPass(s), true);
  s = answer(s, 5, false);
  assert.equal(s.phase, "gameover");
  assert.equal(s.gameOverReason, "gold");
  assert.equal(s.gold, 0);
  assert.equal(s.rescueSlot, null);
});

test("exactly five GOLD buys one replacement question and charges once", () => {
  let s = start();
  for (let i = 0; i < 4; i++) s = continueQuiz(answer(s, i));
  for (let i = 4; i < 9; i++) s = continueQuiz(answer(s, i, false));
  const wrong = answer(s, 9, false);
  assert.equal(wrong.phase, "rescue");
  assert.equal(wrong.gold, 5);
  const oldId = wrong.deckIds[wrong.rescueSlot];
  const oldAnswer = wrong.answers[wrong.rescueSlot];
  const rescued = acceptExtraQuestion(wrong);
  assert.equal(rescued.phase, "quiz");
  assert.equal(rescued.gold, 0);
  assert.equal(rescued.bonusSpent, 5);
  assert.equal(rescued.retiredQuestions.length, 1);
  assert.deepEqual(rescued.retiredQuestions[0], {
    id: oldId,
    answer: oldAnswer,
  });
  assert.notEqual(rescued.deckIds[wrong.rescueSlot], oldId);
  assert.equal(rescued.answers[wrong.rescueSlot], null);
  assert.equal(questionCapacity(rescued), 16);
  assert.equal(answeredCount(rescued), 10);
  roundtrip(rescued);
});

test("rescue can repeat and decline records the terminal reason", () => {
  let s = start();
  for (let i = 0; i < 9; i++) s = continueQuiz(answer(s, i));
  for (let i = 9; i < 14; i++) s = continueQuiz(answer(s, i, false));
  s = answer(s, 14, false);
  s = acceptExtraQuestion(s);
  s = answer(s, 14, false);
  assert.equal(s.phase, "rescue");
  assert.equal(s.bonusSpent, 5);
  assert.equal(s.gold, 9);
  assert.equal(declineExtraQuestion(s).gameOverReason, "declined");
  assert.equal(declineExtraQuestion(s).phase, "gameover");
  assert.equal(answerQuestion(declineExtraQuestion(s), 0).accepted, false);
  const second = acceptExtraQuestion(s);
  assert.equal(second.gold, 4);
  assert.equal(second.bonusSpent, 10);
  const depleted = answer(second, 14, false);
  assert.equal(depleted.gold, 3);
  assert.equal(depleted.phase, "gameover");
  assert.equal(depleted.gameOverReason, "gold");
  roundtrip(depleted);
});

test("affordable rescues keep working after all unused bank questions are exhausted", () => {
  let state = start();
  for (let i = 0; i < 9; i++) state = continueQuiz(answer(state, i));
  for (let i = 9; i < 14; i++) state = continueQuiz(answer(state, i, false));
  state = answer(state, 14, false);
  // Model a player carrying savings from earlier adventures.
  state = { ...state, gold: state.gold + 600, earned: state.earned + 600 };
  roundtrip(state);
  for (let i = 0; i < 80; i++) {
    const previousId = state.deckIds[14];
    state = acceptExtraQuestion(state);
    assert.equal(state.phase, "quiz");
    assert.equal(new Set(state.deckIds).size, 15);
    assert.notEqual(state.deckIds[14], previousId);
    roundtrip(state);
    state = answer(state, 14, false);
    assert.equal(state.phase, "rescue");
    roundtrip(state);
  }
  state = acceptExtraQuestion(state);
  state = answer(state, 14, true);
  assert.equal(score(state), 10);
  assert.equal(state.phase, "result");
  roundtrip(state);
});

test("accepted bonus restores passability and preserves other answers", () => {
  let s = start();
  for (let i = 0; i < 4; i++) s = continueQuiz(answer(s, i));
  for (let i = 4; i < 9; i++) s = continueQuiz(answer(s, i, false));
  const rescue = answer(s, 9, false);
  const slot = rescue.rescueSlot;
  const before = [...rescue.answers];
  s = acceptExtraQuestion(rescue);
  assert.equal(canStillPass(s), true);
  assert.equal(remainingQuestions(s), 6);
  assert.equal(s.answers[slot], null);
  before[slot] = null;
  assert.deepEqual(s.answers, before);
  roundtrip(s);
});

test("rescue, gameover, and every persisted rescue field survive save/load", () => {
  const character = freshState(123);
  roundtrip(character);
  let quiz = start();
  quiz = openQuestion(quiz, 0);
  roundtrip(quiz);
  const feedback = answerQuestion(quiz, currentQuestion(quiz).answer).state;
  roundtrip(feedback);
  const result = pass();
  roundtrip(result);
  const destination = continueQuiz(result);
  roundtrip(destination);
  const departure = chooseDestination(
    destination,
    destinationRoom(destination).id,
  ).state;
  roundtrip(departure);
  roundtrip(beginTravel(departure));
  const rescue = (() => {
    let s = start();
    for (let i = 0; i < 4; i++) s = continueQuiz(answer(s, i));
    for (let i = 4; i < 9; i++) s = continueQuiz(answer(s, i, false));
    return answer(s, 9, false);
  })();
  assert.equal(rescue.phase, "rescue");
  roundtrip(rescue);
  const gameover = (() => {
    let s = start();
    for (let i = 0; i < 5; i++) s = continueQuiz(answer(s, i, false));
    return answer(s, 5, false);
  })();
  assert.equal(gameover.phase, "gameover");
  roundtrip(gameover);
});

test("tampered bonus accounting fails closed and bonusSpent persists across stages", () => {
  const valid = start();
  assert.equal(
    restoreState(JSON.stringify({ ...valid, bonusSpent: 5 })).phase,
    "character",
  );
  let s = start();
  for (let i = 0; i < 4; i++) s = continueQuiz(answer(s, i));
  for (let i = 4; i < 9; i++) s = continueQuiz(answer(s, i, false));
  s = acceptExtraQuestion(answer(s, 9, false));
  assert.equal(s.bonusSpent, 5);
  for (const i of [9, 10, 11, 12, 13, 14]) {
    s = answer(s, i);
    if (s.feedback) s = continueQuiz(s);
  }
  assert.equal(score(s), PASS_SCORE);
  s = continueQuiz(s);
  s = finishTravel(
    beginTravel(chooseDestination(s, destinationRoom(s).id).state),
  );
  assert.equal(s.phase, "shop");
  assert.equal(s.records[0].answered, 16);
  assert.equal(s.bonusSpent, 5);
  assert.equal(s.retiredQuestions.length, 0);
  roundtrip(s);
});
test("all unresolved objects are selectable and previewing does not consume them", () => {
  const s = start();
  for (let i = 0; i < QUESTION_COUNT; i++) {
    const opened = openQuestion(s, i);
    assert.ok(currentQuestion(opened));
    roundtrip(opened);
    assert.deepEqual(closeQuestion(opened), s);
  }
  const graded = continueQuiz(answer(s, 14, false));
  assert.strictEqual(openQuestion(graded, 14), graded);
  assert.equal(answeredCount(graded), 1);
});
test("correct place boards carriage; wrong place reveals intended answer and actually changes next room", () => {
  for (const correct of [true, false]) {
    const s = pass();
    const expected = destinationRoom(s);
    const selected = destinationChoices(s).find((r) =>
      correct ? r.id === expected.id : r.id !== expected.id,
    );
    const chosen = chooseDestination(s, selected.id);
    assert.equal(chosen.correct, correct);
    assert.equal(chosen.accepted, true);
    assert.equal(chosen.state.phase, "departure");
    assert.equal(chosen.state.travel.expectedId, expected.id);
    assert.equal(chosen.state.travel.mode, correct ? "carriage" : "whirlwind");
    roundtrip(chosen.state);
    const flight = beginTravel(chosen.state);
    roundtrip(flight);
    const next = finishTravel(flight);
    assert.equal(next.phase, "shop");
    assert.equal(next.level, 1);
    assert.equal(currentRoom(next).id, selected.id);
    assert.equal(next.gold, s.gold);
    assert.deepEqual(
      inventory(next).map((c) => c.word),
      inventory(s).map((c) => c.word),
      "collected clue words do not change when route changes",
    );
    roundtrip(next);
    const ready = startStage(next);
    assert.equal(ready.phase, "quiz");
    assert.equal(answeredCount(ready), 0);
    roundtrip(ready);
  }
  assert.equal(chooseDestination(pass(), "nonexistent").accepted, false);
});
test("each of eight shop categories spans 1 to 100 GOLD and purchases are atomic", () => {
  const s = shop();
  assert.equal(s.phase, "shop");
  assert.equal(currentQuestion(s), null);
  for (const category of [
    "hat",
    "necklace",
    "cloak",
    "wand",
    "broom",
    "gloves",
    "pants",
    "vest",
  ]) {
    const priced = catalog.filter(
      (i) => i.category === category && i.price > 0,
    );
    assert.ok(priced.length >= 4);
    assert.equal(Math.min(...priced.map((i) => i.price)), 1);
    assert.equal(Math.max(...priced.map((i) => i.price)), 100);
  }
  const cheap = catalog.find((i) => i.price === 1),
    expensive = catalog.find((i) => i.price === 100);
  assert.equal(purchaseItem(s, expensive.id).purchased, false);
  assert.equal(s.gold, 23);
  const bought = purchaseItem(s, cheap.id);
  assert.equal(bought.purchased, true);
  assert.equal(bought.state.gold, 22);
  assert.equal(bought.state.equipped[cheap.category], cheap.id);
  roundtrip(bought.state);
  assert.equal(purchaseItem(bought.state, cheap.id).purchased, false);
  assert.equal(equipItem(s, expensive.id), s);
  assert.equal(purchaseItem(start(), cheap.id).purchased, false);
});
test("photobook snapshots keep exact pose outfit and room across saves and later purchases", () => {
  let s = shop();
  s = takePhoto(s, "2026-09-25T01:00:00.000Z");
  const picture = structuredClone(s.photos[0]);
  const item = catalog.find((i) => i.price === 1);
  s = purchaseItem(s, item.id).state;
  assert.deepEqual(s.photos[0], picture);
  roundtrip(s);
  for (let i = 0; i < 101; i++)
    s = takePhoto(s, new Date(1790000000000 + i * 1000).toISOString());
  assert.equal(s.photos.length, 100);
  roundtrip(s);
  const removed = deletePhoto(s, s.photos[0].id);
  assert.equal(removed.photos.length, 99);
});
test("six characters can finish ten stages with ten correct answers per room", () => {
  for (const c of characters) {
    let s = start(c.id);
    for (let l = 0; l < 10; l++) {
      assert.equal(s.phase, "quiz");
      s = pass(s);
      assert.equal(s.phase, "destination");
      assert.equal(score(s), 10);
      roundtrip(s);
      s = finishTravel(
        beginTravel(chooseDestination(s, destinationRoom(s).id).state),
      );
      if (l < 9) {
        assert.equal(s.phase, "shop");
        s = startStage(s);
      }
      roundtrip(s);
    }
    assert.equal(s.phase, "complete");
    assert.equal(s.records.length, 10);
    assert.equal(s.gold, 203);
    assert.equal(inventory(s).length, 30);
  }
});
test("wrong final destination does not falsely escape and opens another final-stage room", () => {
  let s = start();
  for (let l = 0; l < 9; l++) {
    s = pass(s);
    s = startStage(
      finishTravel(
        beginTravel(chooseDestination(s, destinationRoom(s).id).state),
      ),
    );
  }
  s = pass(s);
  const wrong = destinationChoices(s).find((room) => room.id !== EXIT_ROOM.id);
  s = finishTravel(beginTravel(chooseDestination(s, wrong.id).state));
  assert.equal(s.phase, "shop");
  assert.equal(s.level, 9);
  assert.equal(s.records.length, 9);
  assert.equal(currentRoom(s).id, wrong.id);
  roundtrip(s);
  s = pass(startStage(s));
  s = finishTravel(beginTravel(chooseDestination(s, EXIT_ROOM.id).state));
  assert.equal(s.phase, "complete");
  roundtrip(s);
});
test("corrupt and obsolete save data fail closed rather than minting GOLD or invalid clothes", () => {
  const valid = start();
  for (const patch of [
    { version: 5 },
    { version: 6 },
    { gold: 99 },
    { earned: 22 },
    { lost: -1 },
    { characterId: "missing" },
    { deckIds: ["bad"] },
    { route: Array(10).fill(valid.route[0]) },
    { phase: "complete" },
    { phase: "destination" },
    { owned: [] },
    { photos: [{ id: "fake" }] },
    { travel: { mode: "carriage" } },
  ]) {
    const restored = restoreState(JSON.stringify({ ...valid, ...patch }));
    assert.equal(restored.phase, "character");
    assert.equal(restored.gold, 3);
  }
});
test("stage narrative is based on actual progress, not random room name", () => {
  const s = start();
  assert.match(stageNarrative(s), /모험이 시작/);
  assert.match(stageNarrative({ ...s, level: 9 }), /마지막 관문/);
  for (const room of rooms)
    assert.doesNotMatch(room.description, /마지막 관문|첫 번째 방/);
});
