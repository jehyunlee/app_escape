import scienceNotes from "./assets/wikipedia/science-notes.json" with { type: "json" };
import aiNotes from "./assets/wikipedia/ai-notes.json" with { type: "json" };
import historyNotes from "./assets/wikipedia/history-notes.json" with { type: "json" };

const notesByPassage = new Map();
for (const note of [...scienceNotes, ...aiNotes, ...historyNotes]) {
  if (notesByPassage.has(note.passageId))
    throw new Error(`Duplicate study notes: ${note.passageId}`);
  notesByPassage.set(note.passageId, note);
}
const escape = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ],
  );
export function studyNotesFor(question) {
  if (!question?.passageId) return null;
  const notes = notesByPassage.get(question.passageId);
  if (!notes) throw new Error(`Missing study notes: ${question.passageId}`);
  return notes;
}
const vocabulary = (entries) =>
  `<dl>${entries.map((entry) => `<div class="study-word"><dt lang="en">${escape(entry.term)}</dt><dd>${escape(entry.meaning)}</dd></div>`).join("")}</dl>`;
export function studyNotesMarkup(question) {
  const notes = studyNotesFor(question);
  if (!notes) return "";
  return `<section class="study-notes" data-passage-id="${escape(notes.passageId)}" aria-label="중요 단어와 핵심 개념 설명"><h4 class="study-notes-title">단어와 개념 짚어보기</h4><div class="study-vocabulary"><section><h5>중요 단어</h5>${vocabulary(notes.importantWords)}</section><section><h5>어려운 단어·표현</h5>${vocabulary(notes.difficultWords)}</section></div><section class="study-concepts"><h5>핵심 개념</h5>${notes.concepts.map((concept) => `<article><h6>${escape(concept.title)}</h6><p>${escape(concept.explanation)}</p></article>`).join("")}</section></section>`;
}
