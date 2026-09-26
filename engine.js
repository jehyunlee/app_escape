import {
  levels,
  questionPool,
  questionById,
  QUESTION_COUNT,
  PASS_SCORE,
  CLUE_THRESHOLDS,
} from "./levels.js";
import { catalog, STARTER_OUTFIT } from "./avatar.js";
import { characters } from "./characters.js";
import {
  makeRoute,
  validRoute,
  roomById,
  destinationRoom,
  destinationChoices,
  EXIT_ROOM,
} from "./rooms.js";

export const SAVE_VERSION = 7;
export const SAVE_KEY = "headache-escape-v7";
export const STARTER = STARTER_OUTFIT;
export const INITIAL_GOLD = 3;
const integer = (n, min = 0, max = Number.MAX_SAFE_INTEGER) =>
  Number.isSafeInteger(n) && n >= min && n <= max;
const characterExists = (id) =>
  characters.some((character) => character.id === id);
const resolveRoom = (id) => (id === EXIT_ROOM.id ? EXIT_ROOM : roomById(id));
const earnedClues = (correct) =>
  CLUE_THRESHOLDS.filter((threshold) => correct >= threshold).length;
function randomSeed() {
  return globalThis.crypto.getRandomValues(new Uint32Array(1))[0];
}
function rng(seed) {
  let value = seed >>> 0;
  return () => {
    value = (value + 0x6d2b79f5) >>> 0;
    let m = Math.imul(value ^ (value >>> 15), value | 1);
    m ^= m + Math.imul(m ^ (m >>> 7), m | 61);
    return ((m ^ (m >>> 14)) >>> 0) / 4294967296;
  };
}
export function layoutSeed(state) {
  return (
    (state.seed ^
      Math.imul(state.level + 1, 0x9e3779b1) ^
      Math.imul(state.attempt + 1, 0x85ebca6b)) >>>
    0
  );
}
export function sampleDeck(
  levelId,
  seed,
  excludedIds = [],
  characterId = null,
) {
  const excluded = new Set(excludedIds);
  const ids = questionPool(levelId, characterId)
    .filter((q) => !excluded.has(q.id))
    .map((q) => q.id);
  if (ids.length < QUESTION_COUNT)
    throw new RangeError("Not enough unused questions");
  const random = rng(seed);
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  return ids.slice(0, QUESTION_COUNT);
}
function enterStage(state, seenIds = [], shop = false) {
  const clueTargets = [...state.clueTargets];
  clueTargets[state.level] = destinationRoom(state).id;
  return {
    ...state,
    phase: shop ? "shop" : "quiz",
    deckIds: sampleDeck(
      state.level + 1,
      layoutSeed(state),
      seenIds,
      state.characterId,
    ),
    seenIds: [...seenIds],
    answers: Array(QUESTION_COUNT).fill(null),
    selected: null,
    feedback: false,
    lastDelta: 0,
    travel: null,
    clueTargets,
  };
}
export function freshState(seed = randomSeed()) {
  if (!integer(seed, 0, 0xffffffff)) throw new RangeError("Invalid seed");
  const route = makeRoute(seed);
  return {
    version: SAVE_VERSION,
    seed,
    route,
    characterId: null,
    level: 0,
    attempt: 0,
    deckIds: [],
    seenIds: [],
    answers: Array(QUESTION_COUNT).fill(null),
    selected: null,
    feedback: false,
    phase: "character",
    gold: INITIAL_GOLD,
    earned: 0,
    lost: 0,
    lastDelta: 0,
    owned: Object.values(STARTER),
    equipped: { ...STARTER },
    clueCounts: Array(10).fill(0),
    clueTargets: [...route.slice(1), EXIT_ROOM.id],
    records: [],
    travel: null,
    photos: [],
  };
}
export function chooseCharacter(state, id) {
  return state.phase === "character" && characterExists(id)
    ? enterStage({ ...state, characterId: id })
    : state;
}
export function answeredCount(state) {
  return state.answers.filter((answer) => answer !== null).length;
}
export function questionForObject(state, index) {
  return integer(index, 0, QUESTION_COUNT - 1)
    ? (questionById(state.level + 1, state.deckIds[index], state.characterId) ??
        null)
    : null;
}
export function score(state) {
  return state.answers.reduce(
    (total, answer, i) =>
      total +
      Number(answer !== null && answer === questionForObject(state, i)?.answer),
    0,
  );
}
export function currentQuestion(state) {
  return state.phase === "quiz" &&
    !state.feedback &&
    state.selected !== null &&
    state.answers[state.selected] === null &&
    score(state) < PASS_SCORE
    ? questionForObject(state, state.selected)
    : null;
}
export function avatarMood(state) {
  if (state.phase === "complete") return "happy";
  if (state.feedback && state.selected !== null)
    return state.answers[state.selected] ===
      questionForObject(state, state.selected)?.answer
      ? "happy"
      : "sad";
  if (state.phase === "result")
    return score(state) >= PASS_SCORE ? "happy" : "sad";
  return "neutral";
}
export function openQuestion(state, index) {
  return state.phase === "quiz" &&
    !state.feedback &&
    state.selected === null &&
    integer(index, 0, QUESTION_COUNT - 1) &&
    state.answers[index] === null &&
    score(state) < PASS_SCORE
    ? { ...state, selected: index }
    : state;
}
export function answerQuestion(state, answer) {
  const question = currentQuestion(state);
  if (!question || !integer(answer, -1, 3))
    return { state, accepted: false, correct: false, reward: 0 };
  const correct = answer === question.answer;
  const delta = correct ? 2 : state.gold > 0 ? -1 : 0;
  const next = {
    ...state,
    answers: [...state.answers],
    feedback: true,
    gold: state.gold + delta,
    earned: state.earned + (correct ? 2 : 0),
    lost: state.lost + (correct ? 0 : -delta),
    lastDelta: delta,
    clueCounts: [...state.clueCounts],
  };
  next.answers[state.selected] = answer;
  next.clueCounts[state.level] = Math.max(
    next.clueCounts[state.level],
    earnedClues(score(next)),
  );
  if (score(next) >= PASS_SCORE || answeredCount(next) === QUESTION_COUNT)
    next.phase = "result";
  return { state: next, accepted: true, correct, reward: delta };
}
export function continueQuiz(state) {
  if (!state.feedback) return state;
  return {
    ...state,
    selected: null,
    feedback: false,
    phase:
      score(state) >= PASS_SCORE
        ? "destination"
        : answeredCount(state) === QUESTION_COUNT
          ? "result"
          : "quiz",
  };
}
export function closeQuestion(state) {
  if (!state.feedback && state.phase !== "quiz") return state;
  return state.feedback ? continueQuiz(state) : { ...state, selected: null };
}
export function retryStage(state) {
  if (state.phase !== "result" || state.feedback || score(state) >= PASS_SCORE)
    return state;
  let seen = [...state.seenIds, ...state.deckIds];
  if (
    questionPool(state.level + 1, state.characterId).length - seen.length <
    QUESTION_COUNT
  )
    seen = [...state.deckIds];
  return enterStage({ ...state, attempt: state.attempt + 1 }, seen);
}
export function openDestination(state) {
  return state.phase === "result" &&
    !state.feedback &&
    score(state) >= PASS_SCORE
    ? { ...state, phase: "destination" }
    : state;
}
export function chooseDestination(state, id) {
  if (
    state.phase !== "destination" ||
    !destinationChoices(state).some((room) => room.id === id)
  )
    return { state, accepted: false, correct: false };
  const expected = destinationRoom(state);
  const correct = id === expected.id;
  return {
    state: {
      ...state,
      phase: "departure",
      travel: {
        mode: correct ? "carriage" : "whirlwind",
        destinationId: id,
        expectedId: expected.id,
      },
    },
    accepted: true,
    correct,
  };
}
export function beginTravel(state) {
  return state.phase === "departure" && state.travel
    ? { ...state, phase: "travel" }
    : state;
}
export function finishTravel(state) {
  if (state.phase !== "travel" || !state.travel) return state;
  const destination = state.travel.destinationId;
  if (state.level === 9 && destination === EXIT_ROOM.id)
    return {
      ...state,
      phase: "complete",
      travel: null,
      records: [
        ...state.records,
        {
          score: score(state),
          attempt: state.attempt,
          answered: answeredCount(state),
          roomId: state.route[state.level],
        },
      ],
    };
  const route = [...state.route];
  if (state.level === 9) {
    route[9] = destination;
    const clueCounts = [...state.clueCounts];
    clueCounts[9] = 0;
    return enterStage(
      { ...state, route, attempt: state.attempt + 1, clueCounts },
      [],
      true,
    );
  }
  route[state.level + 1] = destination;
  return enterStage(
    {
      ...state,
      route,
      level: state.level + 1,
      attempt: 0,
      records: [
        ...state.records,
        {
          score: score(state),
          attempt: state.attempt,
          answered: answeredCount(state),
          roomId: state.route[state.level],
        },
      ],
    },
    [],
    true,
  );
}
export function startStage(state) {
  return state.phase === "shop" ? { ...state, phase: "quiz" } : state;
}
export function purchaseItem(state, id) {
  const item = catalog.find((item) => item.id === id);
  if (state.phase !== "shop" || !item)
    return { state, purchased: false, reason: "지금은 구매할 수 없어요." };
  if (state.owned.includes(id))
    return { state, purchased: false, reason: "이미 가지고 있는 물건이에요." };
  if (state.gold < item.price)
    return {
      state,
      purchased: false,
      reason: "GOLD가 부족해요. 구매하지 않고 출발해도 괜찮아요.",
    };
  return {
    state: {
      ...state,
      gold: state.gold - item.price,
      owned: [...state.owned, id],
      equipped: { ...state.equipped, [item.category]: id },
    },
    purchased: true,
    reason: `${item.name} 구매 완료!`,
  };
}
export function equipItem(state, id) {
  const item = catalog.find((item) => item.id === id);
  return state.phase === "shop" && item && state.owned.includes(id)
    ? { ...state, equipped: { ...state.equipped, [item.category]: id } }
    : state;
}
export function inventory(state) {
  return state.clueCounts.flatMap((count, index) =>
    resolveRoom(state.clueTargets[index])
      .clues.slice(0, count)
      .map((word) => ({
        level: index + 1,
        roomId: state.route[index],
        place: roomById(state.route[index]).name,
        word,
      })),
  );
}
export function takePhoto(state, timestamp = new Date().toISOString()) {
  if (!state.characterId || !Number.isFinite(Date.parse(timestamp)))
    return state;
  return {
    ...state,
    photos: [
      ...state.photos,
      {
        id: `${state.seed}-${timestamp}-${state.photos.length}`,
        characterId: state.characterId,
        equipped: { ...state.equipped },
        mood: avatarMood(state),
        roomId: state.route[state.level],
        level: state.level + 1,
        takenAt: timestamp,
      },
    ].slice(-100),
  };
}
export function deletePhoto(state, id) {
  return { ...state, photos: state.photos.filter((photo) => photo.id !== id) };
}
function validOutfit(outfit, owned) {
  return (
    outfit &&
    Object.keys(STARTER).every(
      (category) =>
        owned.includes(outfit[category]) &&
        catalog.some(
          (item) => item.id === outfit[category] && item.category === category,
        ),
    )
  );
}
export function restoreState(raw) {
  try {
    const v = JSON.parse(raw);
    if (
      !v ||
      v.version !== SAVE_VERSION ||
      !integer(v.seed, 0, 0xffffffff) ||
      !validRoute(v.route) ||
      !integer(v.level, 0, 9) ||
      !integer(v.attempt) ||
      ![
        "character",
        "quiz",
        "result",
        "destination",
        "departure",
        "travel",
        "shop",
        "complete",
      ].includes(v.phase) ||
      typeof v.feedback !== "boolean" ||
      !(v.selected === null || integer(v.selected, 0, QUESTION_COUNT - 1)) ||
      !Array.isArray(v.answers) ||
      v.answers.length !== QUESTION_COUNT ||
      !v.answers.every((a) => a === null || integer(a, -1, 3))
    )
      return freshState();
    for (const key of ["deckIds", "seenIds", "owned"])
      if (
        !Array.isArray(v[key]) ||
        !v[key].every((id) => typeof id === "string") ||
        new Set(v[key]).size !== v[key].length
      )
        return freshState();
    if (
      !Object.values(STARTER).every((id) => v.owned.includes(id)) ||
      !v.owned.every((id) => catalog.some((item) => item.id === id)) ||
      !validOutfit(v.equipped, v.owned)
    )
      return freshState();
    if (
      ![v.gold, v.earned, v.lost].every((n) => integer(n)) ||
      ![2, 0, -1].includes(v.lastDelta)
    )
      return freshState();
    const spent = v.owned.reduce(
      (sum, id) => sum + catalog.find((item) => item.id === id).price,
      0,
    );
    if (v.gold + spent + v.lost !== INITIAL_GOLD + v.earned)
      return freshState();
    if (
      !Array.isArray(v.clueCounts) ||
      v.clueCounts.length !== 10 ||
      !v.clueCounts.every((n) => integer(n, 0, 3)) ||
      !Array.isArray(v.clueTargets) ||
      v.clueTargets.length !== 10 ||
      !v.clueTargets.every((id) => resolveRoom(id))
    )
      return freshState();
    if (
      !Array.isArray(v.records) ||
      v.records.length !== (v.phase === "complete" ? 10 : v.level) ||
      !v.records.every(
        (r, i) =>
          r &&
          integer(r.score, PASS_SCORE, PASS_SCORE) &&
          integer(r.answered, PASS_SCORE, QUESTION_COUNT) &&
          integer(r.attempt) &&
          r.roomId === v.route[i],
      )
    )
      return freshState();
    const count = answeredCount(v);
    const correct = score(v);
    if (v.phase === "character") {
      if (
        v.characterId !== null ||
        v.level ||
        v.attempt ||
        v.deckIds.length ||
        v.seenIds.length ||
        count ||
        v.feedback ||
        v.selected !== null ||
        v.earned ||
        v.lost ||
        v.gold !== 3 ||
        v.records.length ||
        v.clueCounts.some(Boolean)
      )
        return freshState();
    } else {
      if (
        !characterExists(v.characterId) ||
        v.deckIds.length !== QUESTION_COUNT ||
        ![...v.deckIds, ...v.seenIds].every((id) =>
          questionById(v.level + 1, id, v.characterId),
        ) ||
        v.seenIds.some((id) => v.deckIds.includes(id)) ||
        correct > PASS_SCORE
      )
        return freshState();
      if (v.feedback) {
        if (
          !["quiz", "result"].includes(v.phase) ||
          v.selected === null ||
          v.answers[v.selected] === null
        )
          return freshState();
      } else if (v.phase !== "quiz" && v.selected !== null) return freshState();
      if (
        v.phase === "quiz" &&
        (correct >= PASS_SCORE ||
          count === QUESTION_COUNT ||
          (!v.feedback &&
            v.selected !== null &&
            v.answers[v.selected] !== null))
      )
        return freshState();
      if (
        v.phase === "result" &&
        correct < PASS_SCORE &&
        count !== QUESTION_COUNT
      )
        return freshState();
      if (
        ["destination", "departure", "travel", "complete"].includes(v.phase) &&
        (correct !== PASS_SCORE || v.feedback)
      )
        return freshState();
      if (
        v.phase === "shop" &&
        (v.level === 0 || count || v.feedback || v.selected !== null)
      )
        return freshState();
    }
    if (v.phase === "complete" && v.level !== 9) return freshState();
    if (
      v.clueCounts.some((n, i) =>
        i < v.level
          ? n !== 3
          : i > v.level
            ? n !== 0
            : n < earnedClues(correct),
      )
    )
      return freshState();
    if (v.earned < correct * 2) return freshState();
    if (["departure", "travel"].includes(v.phase)) {
      if (
        !v.travel ||
        !["carriage", "whirlwind"].includes(v.travel.mode) ||
        v.travel.expectedId !== destinationRoom(v).id ||
        !destinationChoices(v).some(
          (room) => room.id === v.travel.destinationId,
        ) ||
        (v.travel.mode === "carriage") !==
          (v.travel.expectedId === v.travel.destinationId)
      )
        return freshState();
    } else if (v.travel !== null) return freshState();
    if (
      !Array.isArray(v.photos) ||
      v.photos.length > 100 ||
      !v.photos.every(
        (photo) =>
          photo &&
          typeof photo.id === "string" &&
          photo.characterId === v.characterId &&
          validOutfit(photo.equipped, v.owned) &&
          ["neutral", "happy", "sad"].includes(photo.mood) &&
          roomById(photo.roomId) &&
          integer(photo.level, 1, 10) &&
          typeof photo.takenAt === "string" &&
          Number.isFinite(Date.parse(photo.takenAt)),
      ) ||
      new Set(v.photos.map((p) => p.id)).size !== v.photos.length
    )
      return freshState();
    return structuredClone(v);
  } catch {
    return freshState();
  }
}
