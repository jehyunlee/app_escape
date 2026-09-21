import catalog from "./rooms-catalog.json" with { type: "json" };

export const ROUTE_LENGTH = 10;
export const rooms = Object.freeze(
  catalog.map((room) =>
    Object.freeze({
      ...room,
      clues: Object.freeze([...room.clues]),
      image: `assets/spaces/${room.id}.webp`,
    }),
  ),
);
const byId = new Map(rooms.map((room) => [room.id, room]));
export const EXIT_ROOM = Object.freeze({
  id: "castle-exit",
  name: "성 밖 정원",
  description: "성 밖의 정원에 도착했어요. 모든 방을 탈출했어요!",
  themeId: 4,
  accent: "#b7d28b",
  clues: Object.freeze(["성벽 밖", "꽃밭", "탈출"]),
  image: "assets/hogwarts-reference.webp",
});

function randomFrom(seed) {
  let value = seed >>> 0;
  return () => {
    value = (value + 0x6d2b79f5) >>> 0;
    let mixed = Math.imul(value ^ (value >>> 15), value | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}
function shuffle(values, random) {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index--) {
    const other = Math.floor(random() * (index + 1));
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
}
export function roomById(id) {
  return byId.get(id);
}
export function makeRoute(seed) {
  if (!Number.isSafeInteger(seed) || seed < 0 || seed > 0xffffffff)
    throw new RangeError("Invalid route seed");
  return shuffle(
    rooms.map((room) => room.id),
    randomFrom(seed ^ 0x23d4a761),
  ).slice(0, ROUTE_LENGTH);
}
export function validRoute(route) {
  return (
    Array.isArray(route) &&
    route.length === ROUTE_LENGTH &&
    new Set(route).size === ROUTE_LENGTH &&
    route.every((id) => byId.has(id))
  );
}
export function currentRoom(state) {
  return roomById(state.route[state.level]);
}
export function destinationRoom(state, stage = state.level) {
  return stage < ROUTE_LENGTH - 1
    ? roomById(state.route[stage + 1])
    : EXIT_ROOM;
}
export function destinationChoices(state) {
  const destination = destinationRoom(state);
  // Exclude the entire actual route from distractors: the word box cannot
  // accidentally disclose a later room. Different themes keep clues distinct.
  const candidates = rooms.filter(
    (room) =>
      !state.route.includes(room.id) &&
      room.id !== destination.id &&
      room.themeId !== destination.themeId &&
      !room.clues.some((clue) => destination.clues.includes(clue)),
  );
  const random = randomFrom(state.seed ^ Math.imul(state.level + 1, 0x45d9f3b));
  const alternatives = shuffle(candidates, random).slice(0, 2);
  if (alternatives.length !== 2)
    throw new RangeError("Not enough distinct destination choices");
  return shuffle([destination, ...alternatives], random);
}
