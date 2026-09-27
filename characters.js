import { avatarMarkup } from "./avatar.js";

const DOLL_ASSET_ROOT = new URL("./assets/doll/headwear/", import.meta.url);
const PORTRAIT_SIZE = 1024;

const escapeXml = (value) =>
  String(value).replace(/[&<>"']/g, (character) => {
    const escaped = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return escaped[character];
  });

const assetHref = (filename) => new URL(filename, DOLL_ASSET_ROOT).href;

/**
 * The family choices remain clockwise from the upper-left choice in the UI.
 * Titles/descriptions explain the deliberately different generated wizard
 * designs so the native starter outfits remain meaningful.
 */
export const characters = Object.freeze([
  Object.freeze({
    id: "dad",
    name: "아빠",
    title: "별빛 천문술사",
    description: "사각 안경의 별빛 마법사. 수수한 차림으로 모험을 시작해요.",
  }),
  Object.freeze({
    id: "mom",
    name: "엄마",
    title: "숲의 연금술사",
    description: "에메랄드 식물 마법을 연구하는 숲의 연금술사",
  }),
  Object.freeze({
    id: "jeongan",
    name: "정안",
    title: "달빛 마법학도",
    description: "둥근 안경과 단발머리의 달빛 견습생",
  }),
  Object.freeze({
    id: "suan",
    name: "수안",
    title: "바람의 비행술사",
    description: "안경 없이 긴 머리를 한 바람의 비행술사",
  }),
  Object.freeze({
    id: "yewon",
    name: "예원언니",
    title: "사파이어 학술마녀",
    description: "안경과 낮은 포니테일을 한 사파이어 학술마녀",
  }),
  Object.freeze({
    id: "hunho",
    name: "훈호오빠",
    title: "버건디 사슴 탐험가",
    description:
      "안경 없이 작은 뿔장식을 한 사슴 탐험가, 여행 빗자루를 멘 모험가",
  }),
]);

const characterById = new Map(
  characters.map((character) => [character.id, character]),
);

/**
 * Render the generated neutral head crop in a local SVG image. Keeping the
 * image in SVG preserves the existing portrait sizing and accessibility API.
 */
export function portraitMarkup(characterId) {
  const character = characterById.get(characterId);
  if (!character) {
    throw new RangeError(`알 수 없는 캐릭터 ID입니다: ${String(characterId)}`);
  }

  const label = `${character.name} · ${character.title}`;
  const portraitUrl = assetHref(`${character.id}-portrait.webp`);
  return `<svg class="family-portrait family-portrait-${escapeXml(character.id)}" width="180" height="150" viewBox="0 0 ${PORTRAIT_SIZE} ${PORTRAIT_SIZE}" role="img" aria-label="${escapeXml(label)}" preserveAspectRatio="xMidYMid meet" focusable="false">
  <title>${escapeXml(label)}</title>
  <desc>${escapeXml(character.description)}</desc>
  <image href="${escapeXml(portraitUrl)}" x="0" y="0" width="${PORTRAIT_SIZE}" height="${PORTRAIT_SIZE}" preserveAspectRatio="xMidYMid meet" aria-hidden="true" />
</svg>`;
}

/**
 * Character-selection cards use the same generated full-body renderer as the
 * game, so wardrobe and mood behavior cannot drift between screens.
 */
export function wizardPortraitMarkup(
  characterId,
  equipped = {},
  mood = "neutral",
) {
  if (!characterById.has(characterId)) {
    throw new RangeError(`알 수 없는 캐릭터 ID입니다: ${String(characterId)}`);
  }
  return avatarMarkup(equipped, characterId, mood);
}
