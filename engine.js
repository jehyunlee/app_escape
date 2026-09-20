import {
  levels,
  questionPool,
  questionById,
  QUESTION_COUNT,
  PASS_SCORE,
} from "./levels.js";
import { catalog } from "./avatar.js";
import { characters } from "./characters.js";

// Reading/dialogue questions replace the old content: never regrade old answers.
export const SAVE_KEY = "headache-escape-v4";
export const POINTS = { 1: 10, 2: 20, 3: 30 };
export const STARTER = {
  eyes: "eyes-brown",
  skin: "skin-peach",
  clothes: "clothes-purple",
  accessory: "accessory-none",
};
const phases = [
  "character",
  "quiz",
  "result",
  "destination",
  "outfit",
  "shop",
  "travel",
  "complete",
];
const integer = (value, min, max = Number.MAX_SAFE_INTEGER) =>
  Number.isSafeInteger(value) && value >= min && value <= max;

function randomSeed() {
  return globalThis.crypto.getRandomValues(new Uint32Array(1))[0];
}
function seededRandom(seed) {
  let value = seed >>> 0;
  return () => {
    value = (value + 0x6d2b79f5) >>> 0;
    let mixed = Math.imul(value ^ (value >>> 15), value | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}
export function sampleDeck(levelId, seed, excludedIds = []) {
  const excluded = new Set(excludedIds);
  const ids = questionPool(levelId)
    .filter((question) => !excluded.has(question.id))
    .map((question) => question.id);
  if (ids.length < QUESTION_COUNT)
    throw new RangeError("Not enough unused questions for a full stage");
  const random = seededRandom(seed);
  for (let index = ids.length - 1; index > 0; index--) {
    const other = Math.floor(random() * (index + 1));
    [ids[index], ids[other]] = [ids[other], ids[index]];
  }
  return ids.slice(0, QUESTION_COUNT);
}
function stageSeed(state) {
  return (
    (state.seed ^
      Math.imul(state.level + 1, 0x9e3779b1) ^
      Math.imul(state.attempt + 1, 0x85ebca6b)) >>>
    0
  );
}
export function layoutSeed(state) {
  return stageSeed(state);
}
function enterStage(state, seenIds = []) {
  return {
    ...state,
    phase: "quiz",
    deckIds: sampleDeck(levels[state.level].id, stageSeed(state), seenIds),
    seenIds: [...seenIds],
    answers: Array(QUESTION_COUNT).fill(null),
    selected: null,
    feedback: false,
  };
}
export function freshState(seed = randomSeed()) {
  if (!integer(seed, 0, 0xffffffff)) throw new RangeError("Invalid game seed");
  return {
    version: 4,
    seed,
    characterId: null,
    level: 0,
    attempt: 0,
    deckIds: [],
    seenIds: [],
    answers: Array(QUESTION_COUNT).fill(null),
    selected: null,
    feedback: false,
    phase: "character",
    points: 0,
    earned: 0,
    owned: Object.values(STARTER),
    equipped: { ...STARTER },
    clueCounts: Array(10).fill(0),
    records: [],
  };
}
export function chooseCharacter(state, characterId) {
  if (
    state.phase !== "character" ||
    !characters.some((character) => character.id === characterId)
  )
    return state;
  return enterStage({ ...state, characterId });
}
export function answeredCount(state) {
  return state.answers.filter((answer) => answer !== null).length;
}
export function questionForObject(state, objectIndex) {
  if (!integer(objectIndex, 0, QUESTION_COUNT - 1)) return null;
  return (
    questionById(levels[state.level].id, state.deckIds[objectIndex]) ?? null
  );
}
export function score(state) {
  return state.answers.reduce(
    (total, answer, index) =>
      total +
      Number(
        answer !== null && answer === questionForObject(state, index)?.answer,
      ),
    0,
  );
}
export function avatarMood(state) {
  if (state.phase === "complete") return "happy";
  if (state.phase === "result")
    return score(state) >= PASS_SCORE ? "happy" : "sad";
  if (state.feedback && state.selected !== null) {
    const question = questionForObject(state, state.selected);
    return question && state.answers[state.selected] === question.answer
      ? "happy"
      : "sad";
  }
  return "neutral";
}
export function restoreState(raw) {
  try {
    const value = JSON.parse(raw);
    if (
      !value ||
      value.version !== 4 ||
      !integer(value.seed, 0, 0xffffffff) ||
      !integer(value.level, 0, 9) ||
      !integer(value.attempt, 0) ||
      !phases.includes(value.phase) ||
      typeof value.feedback !== "boolean" ||
      !(
        value.selected === null ||
        integer(value.selected, 0, QUESTION_COUNT - 1)
      ) ||
      !Array.isArray(value.answers) ||
      value.answers.length !== QUESTION_COUNT ||
      !value.answers.every(
        (answer) => answer === null || integer(answer, -1, 3),
      ) ||
      !Array.isArray(value.deckIds) ||
      !value.deckIds.every((id) => typeof id === "string") ||
      new Set(value.deckIds).size !== value.deckIds.length ||
      !Array.isArray(value.seenIds) ||
      !value.seenIds.every((id) => typeof id === "string") ||
      new Set(value.seenIds).size !== value.seenIds.length ||
      !integer(value.points, 0) ||
      !integer(value.earned, 0) ||
      value.points > value.earned ||
      !Array.isArray(value.owned) ||
      new Set(value.owned).size !== value.owned.length ||
      !value.owned.every((id) => catalog.some((item) => item.id === id)) ||
      !Object.values(STARTER).every((id) => value.owned.includes(id)) ||
      !value.equipped ||
      !Object.keys(STARTER).every(
        (category) =>
          value.owned.includes(value.equipped[category]) &&
          catalog.some(
            (item) =>
              item.id === value.equipped[category] &&
              item.category === category,
          ),
      ) ||
      !Array.isArray(value.clueCounts) ||
      value.clueCounts.length !== 10 ||
      !value.clueCounts.every((count) => integer(count, 0, 3)) ||
      !Array.isArray(value.records) ||
      value.records.length !==
        (value.phase === "complete" ? 10 : value.level) ||
      !value.records.every(
        (record) =>
          record &&
          integer(record.score, PASS_SCORE, QUESTION_COUNT) &&
          integer(record.attempt, 0),
      )
    )
      return freshState();
    const spent = value.owned.reduce(
      (sum, id) => sum + catalog.find((item) => item.id === id).price,
      0,
    );
    if (value.points + spent !== value.earned) return freshState();
    const count = answeredCount(value);
    if (value.phase === "character") {
      if (
        value.characterId !== null ||
        value.level !== 0 ||
        value.attempt !== 0 ||
        value.deckIds.length ||
        value.seenIds.length ||
        count ||
        value.selected !== null ||
        value.feedback ||
        value.earned ||
        value.clueCounts.some(Boolean)
      )
        return freshState();
    } else {
      if (
        !characters.some((character) => character.id === value.characterId) ||
        value.deckIds.length !== QUESTION_COUNT ||
        ![...value.deckIds, ...value.seenIds].every((id) =>
          questionById(levels[value.level].id, id),
        ) ||
        value.seenIds.some((id) => value.deckIds.includes(id))
      )
        return freshState();
      if (value.phase === "quiz") {
        if (value.feedback) {
          if (value.selected === null || value.answers[value.selected] === null)
            return freshState();
        } else if (
          count === QUESTION_COUNT ||
          (value.selected !== null && value.answers[value.selected] !== null)
        )
          return freshState();
      } else if (
        value.feedback ||
        value.selected !== null ||
        count !== QUESTION_COUNT
      )
        return freshState();
    }
    const correct = score(value);
    if (
      ["destination", "outfit", "shop", "travel", "complete"].includes(
        value.phase,
      ) &&
      correct < PASS_SCORE
    )
      return freshState();
    if (value.phase === "complete" && value.level !== 9) return freshState();
    if (
      value.clueCounts.some((count, index) =>
        index < value.level
          ? count !== 3
          : index > value.level
            ? count !== 0
            : count < Math.min(3, Math.floor(correct / 5)),
      )
    )
      return freshState();
    const roundEarned = value.answers.reduce((sum, answer, index) => {
      const question = questionForObject(value, index);
      return (
        sum +
        (question && answer === question.answer
          ? POINTS[question.difficulty]
          : 0)
      );
    }, 0);
    if (value.earned < roundEarned) return freshState();
    return {
      version: 4,
      seed: value.seed,
      characterId: value.characterId,
      level: value.level,
      attempt: value.attempt,
      deckIds: [...value.deckIds],
      seenIds: [...value.seenIds],
      answers: [...value.answers],
      selected: value.selected,
      feedback: value.feedback,
      phase: value.phase,
      points: value.points,
      earned: value.earned,
      owned: [...value.owned],
      equipped: { ...value.equipped },
      clueCounts: [...value.clueCounts],
      records: value.records.map((record) => ({
        score: record.score,
        attempt: record.attempt,
      })),
    };
  } catch {
    return freshState();
  }
}
export function currentQuestion(state) {
  if (
    state.phase !== "quiz" ||
    state.feedback ||
    state.selected === null ||
    state.answers[state.selected] !== null
  )
    return null;
  return questionForObject(state, state.selected);
}
export function openQuestion(state, objectIndex) {
  if (
    state.phase !== "quiz" ||
    state.feedback ||
    state.selected !== null ||
    !integer(objectIndex, 0, QUESTION_COUNT - 1) ||
    state.answers[objectIndex] !== null
  )
    return state;
  return { ...state, selected: objectIndex };
}
export function answerQuestion(state, answer) {
  const question = currentQuestion(state);
  if (!question || !integer(answer, -1, 3))
    return { state, accepted: false, correct: false, reward: 0 };
  const correct = answer === question.answer;
  const reward = correct ? POINTS[question.difficulty] : 0;
  const next = {
    ...state,
    answers: [...state.answers],
    feedback: true,
    points: state.points + reward,
    earned: state.earned + reward,
    clueCounts: [...state.clueCounts],
  };
  next.answers[state.selected] = answer;
  next.clueCounts[state.level] = Math.max(
    next.clueCounts[state.level],
    Math.min(3, Math.floor(score(next) / 5)),
  );
  return { state: next, accepted: true, correct, reward };
}
export function continueQuiz(state) {
  if (state.phase !== "quiz" || !state.feedback) return state;
  return {
    ...state,
    selected: null,
    feedback: false,
    phase: answeredCount(state) === QUESTION_COUNT ? "result" : "quiz",
  };
}
export function closeQuestion(state) {
  if (state.phase !== "quiz" || state.selected === null) return state;
  return state.feedback ? continueQuiz(state) : { ...state, selected: null };
}
export function retryStage(state) {
  if (state.phase !== "result" || score(state) >= PASS_SCORE) return state;
  let seen = [...state.seenIds, ...state.deckIds];
  if (
    questionPool(levels[state.level].id).length - seen.length <
    QUESTION_COUNT
  )
    seen = [...state.deckIds];
  return enterStage({ ...state, attempt: state.attempt + 1 }, seen);
}
export function openDestination(state) {
  return state.phase === "result" && score(state) >= PASS_SCORE
    ? { ...state, phase: "destination" }
    : state;
}
export function chooseDestination(state, destination) {
  if (
    state.phase !== "destination" ||
    destination !== levels[state.level].destination
  )
    return { state, correct: false };
  return { state: { ...state, phase: "outfit" }, correct: true };
}
export function openWardrobe(state) {
  return state.phase === "outfit" ? { ...state, phase: "shop" } : state;
}
export function purchaseItem(state, id) {
  const item = catalog.find((entry) => entry.id === id);
  if (state.phase !== "shop" || !item)
    return { state, purchased: false, reason: "지금은 구매할 수 없어요." };
  if (state.owned.includes(id))
    return { state, purchased: false, reason: "이미 가지고 있는 물건이에요." };
  if (state.points < item.price)
    return {
      state,
      purchased: false,
      reason: "포인트가 부족해요. 가지고 있는 물건으로도 이동할 수 있어요.",
    };
  return {
    state: {
      ...state,
      points: state.points - item.price,
      owned: [...state.owned, id],
      equipped: { ...state.equipped, [item.category]: id },
    },
    purchased: true,
    reason: `${item.name} 구매 완료! 바로 착용했어요.`,
  };
}
export function equipItem(state, id) {
  const item = catalog.find((entry) => entry.id === id);
  if (state.phase !== "shop" || !item || !state.owned.includes(id))
    return state;
  return { ...state, equipped: { ...state.equipped, [item.category]: id } };
}
export function beginTravel(state) {
  return ["outfit", "shop"].includes(state.phase)
    ? { ...state, phase: "travel" }
    : state;
}
export function finishTravel(state) {
  if (state.phase !== "travel") return state;
  const records = [
    ...state.records,
    { score: score(state), attempt: state.attempt },
  ];
  return state.level === levels.length - 1
    ? { ...state, phase: "complete", records }
    : enterStage({ ...state, level: state.level + 1, attempt: 0, records });
}
export function inventory(state) {
  return levels.flatMap((level, index) =>
    level.clues
      .slice(0, state.clueCounts[index])
      .map((word) => ({ level: level.id, place: level.place, word })),
  );
}
