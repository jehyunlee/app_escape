import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { questionPool } from "../levels.js";
import { studyNotesFor, studyNotesMarkup } from "../study-notes.js";
import {
  freshState,
  chooseCharacter,
  openQuestion,
  currentQuestion,
  answerQuestion,
  continueQuiz,
  restoreState,
  declineExtraQuestion,
  questionForObject,
} from "../engine.js";

const start = () => chooseCharacter(freshState(7401), "dad");
function submit(state, slot, correct) {
  state = openQuestion(state, slot);
  const question = currentQuestion(state);
  return answerQuestion(
    state,
    correct ? question.answer : (question.answer + 1) % 4,
  ).state;
}
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const NOTE_TOPICS = ["science", "ai", "history", "psychology", "metascience"];
const NOTES_PER_TOPIC = 144;

test("all 720 Wikipedia passages have relevant Korean vocabulary and concept notes", () => {
  let total = 0;
  for (const [index, topic] of NOTE_TOPICS.entries()) {
    const notes = JSON.parse(
      readFileSync(
        new URL(`../assets/wikipedia/${topic}-notes.json`, import.meta.url),
        "utf8",
      ),
    );
    assert.equal(notes.length, NOTES_PER_TOPIC, topic);
    assert.equal(new Set(notes.map((n) => n.passageId)).size, NOTES_PER_TOPIC);
    const sources = JSON.parse(
      readFileSync(
        new URL(`../assets/wikipedia/${topic}-sources.json`, import.meta.url),
        "utf8",
      ),
    );
    for (const note of notes) {
      const passage = sources.passages.find((p) => p.id === note.passageId);
      assert.ok(passage, note.passageId);
      assert.ok(note.importantWords.length >= 2);
      assert.ok(note.difficultWords.length >= 1);
      assert.ok(note.concepts.length >= 2);
      const entries = [...note.importantWords, ...note.difficultWords];
      assert.equal(
        new Set(entries.map((e) => e.term.toLowerCase())).size,
        entries.length,
        note.passageId,
      );
      for (const entry of entries) {
        assert.ok(entry.term.length >= 2);
        assert.match(entry.meaning, /[가-힣]/);
        assert.doesNotMatch(
          entry.meaning,
          /핵심 표현이다|맥락에서 이해해야 하는 표현|지문에서 설명하는 .*의/,
          "study notes must define the term, not describe a placeholder",
        );
        assert.ok(
          new RegExp(
            `(^|[^\\p{L}\\p{N}])${escapeRegex(entry.term)}([^\\p{L}\\p{N}]|$)`,
            "iu",
          ).test(passage.text),
          `${note.passageId}: ${entry.term} must occur in the displayed excerpt`,
        );
      }
      for (const concept of note.concepts) {
        assert.match(concept.title, /[가-힣]/);
        assert.ok(concept.explanation.length >= 25);
        assert.match(concept.explanation, /[가-힣]/);
      }
      total++;
    }
    for (const q of questionPool(index + 1, "dad"))
      assert.equal(studyNotesFor(q).passageId, q.passageId);
  }
  assert.equal(total, NOTE_TOPICS.length * NOTES_PER_TOPIC);
});

test("right and wrong answers get the same passage-specific study notes", () => {
  const before = openQuestion(start(), 7),
    question = currentQuestion(before);
  const right = answerQuestion(before, question.answer).state;
  const wrong = answerQuestion(before, (question.answer + 1) % 4).state;
  assert.equal(right.feedback, true);
  assert.equal(wrong.feedback, true);
  const a = studyNotesMarkup(questionForObject(right, right.selected));
  const b = studyNotesMarkup(questionForObject(wrong, wrong.selected));
  assert.equal(a, b);
  for (const title of ["중요 단어", "어려운 단어·표현", "핵심 개념"])
    assert.ok(a.includes(title));
  assert.equal(studyNotesMarkup({ prompt: "non-Wikipedia question" }), "");
  assert.throws(
    () => studyNotesFor({ passageId: "missing-passage" }),
    /Missing study notes/,
  );
});

test("final correct answer retains study notes after instant stage clearance", () => {
  let state = start();
  for (let i = 0; i < 9; i++) state = continueQuiz(submit(state, i, true));
  state = submit(state, 14, true);
  assert.equal(state.phase, "result");
  assert.equal(state.selected, 14);
  const restored = restoreState(JSON.stringify(state));
  assert.deepEqual(restored, state);
  assert.ok(
    studyNotesMarkup(questionForObject(restored, 14)).includes("study-notes"),
  );
});

test("rescue and both game-over reasons retain the exact last wrong question on reload", () => {
  let poor = start();
  for (let i = 0; i < 5; i++) poor = continueQuiz(submit(poor, i, false));
  const poorQuestion = questionForObject(poor, 11);
  poor = submit(poor, 11, false);
  assert.equal(poor.phase, "gameover");
  assert.equal(poor.rescueSlot, 11);
  poor = restoreState(JSON.stringify(poor));
  assert.equal(poor.phase, "gameover");
  assert.equal(questionForObject(poor, poor.rescueSlot).id, poorQuestion.id);
  assert.ok(
    studyNotesMarkup(questionForObject(poor, poor.rescueSlot)).includes(
      poorQuestion.passageId,
    ),
  );
  let rich = start();
  for (let i = 0; i < 4; i++) rich = continueQuiz(submit(rich, i, true));
  for (let i = 4; i < 9; i++) rich = continueQuiz(submit(rich, i, false));
  rich = submit(rich, 14, false);
  assert.equal(rich.phase, "rescue");
  const last = questionForObject(rich, rich.rescueSlot);
  assert.ok(studyNotesMarkup(last));
  rich = declineExtraQuestion(rich);
  assert.equal(rich.phase, "gameover");
  assert.equal(rich.rescueSlot, 14);
  rich = restoreState(JSON.stringify(rich));
  assert.equal(rich.phase, "gameover");
  assert.equal(questionForObject(rich, rich.rescueSlot).id, last.id);
});
