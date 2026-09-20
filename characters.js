import { avatarMarkup } from "./avatar.js";

const WIZARD_ASSET_ROOT = new URL("./assets/wizards/", import.meta.url);
const PORTRAIT_SIZE = 512;

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

const assetHref = (filename) => new URL(filename, WIZARD_ASSET_ROOT).href;

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
    description: "남색 로브와 금빛 아스트롤라베를 든 별빛 마법사",
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
    description: "보랏빛과 청록빛을 두른 둥근 안경의 달빛 견습생",
  }),
  Object.freeze({
    id: "suan",
    name: "수안",
    title: "바람의 비행술사",
    description:
      "안경 없이 산호빛과 호박빛을 입고 빗자루를 타는 바람의 비행술사",
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
