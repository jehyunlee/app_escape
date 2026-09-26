// Lives under assets/ so every static publisher ships it alongside the images.
import catalog from "./assets/rooms-catalog.json" with { type: "json" };
import facilityCatalog from "./assets/hogwarts-facilities.json" with { type: "json" };

export const ROUTE_LENGTH = 10;
export const facilities = Object.freeze(
  facilityCatalog.map((facility) => Object.freeze(facility)),
);
const facilityById = new Map(
  facilities.map((facility) => [facility.id, facility]),
);
for (const room of catalog) {
  const facility = facilityById.get(room.facilityId);
  if (
    !facility ||
    room.facilityName !== facility.name ||
    room.scope !== facility.scope
  ) {
    throw new Error(`Room outside the Hogwarts facility catalog: ${room.id}`);
  }
}
export const rooms = Object.freeze(
  catalog.map((room) =>
    Object.freeze({
      ...room,
      clues: Object.freeze([...room.clues]),
      image: `assets/hogwarts/${room.facilityId}.webp`,
    }),
  ),
);
const byId = new Map(rooms.map((room) => [room.id, room]));
export const EXIT_ROOM = Object.freeze({
  id: "castle-exit",
  name: "성 밖 정원",
  description: "호그와트 성외 부지의 정원에 도착했어요. 모든 방을 탈출했어요!",
  scope: "grounds",
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
  const facilities = new Set();
  const route = [];
  for (const room of shuffle(rooms, randomFrom(seed ^ 0x23d4a761))) {
    if (facilities.has(room.facilityId)) continue;
    facilities.add(room.facilityId);
    route.push(room.id);
    if (route.length === ROUTE_LENGTH) break;
  }
  return route;
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
/**
 * Rooms are drawn in random order, so their own text never says where they
 * fall in the journey. This line adds that context from the actual stage.
 */
export function stageNarrative(state) {
  const setting = "이곳";
  const subject = "이곳이";
  const topic = "이곳은";
  const remaining = ROUTE_LENGTH - state.level - 1;
  if (state.level === 0)
    return `${setting}에서 모험이 시작돼요. 첫 번째 자물쇠를 열면 다음 장소의 단서가 나타나요.`;
  if (state.level === ROUTE_LENGTH - 1)
    return `${subject} 마지막 관문이에요. 여기를 지나면 ${EXIT_ROOM.name}으로 나갈 수 있어요.`;
  if (remaining === 1)
    return `${topic} 아홉 번째 방이에요. 이제 마지막 관문까지 한 곳 남았어요.`;
  return `${topic} ${state.level + 1}번째 방이에요. 남은 방은 ${remaining}곳이에요.`;
}
export function destinationChoices(state) {
  const destination = destinationRoom(state);
  const routeFacilities = new Set(
    state.route.map((id) => roomById(id).facilityId),
  );
  // Exclude the entire actual route from distractors: the word box cannot
  // accidentally disclose a later room. Different themes keep clues distinct.
  const candidates = rooms.filter(
    (room) =>
      !state.route.includes(room.id) &&
      !routeFacilities.has(room.facilityId) &&
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
