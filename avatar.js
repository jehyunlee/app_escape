const WARDROBE_CATEGORIES = Object.freeze([
  "hat",
  "necklace",
  "cloak",
  "wand",
  "broom",
  "gloves",
  "pants",
  "vest",
]);

/** The wardrobe schema is shared by the engine, shop and avatar renderer. */
export const categories = WARDROBE_CATEGORIES;
export { WARDROBE_CATEGORIES };

const item = (id, category, name, price, color) =>
  Object.freeze({ id, category, name, price, color });

const starterItems = WARDROBE_CATEGORIES.map((category) =>
  item(`${category}-base`, category, "기본 장비", 0, "#6f6575"),
);

const paidItems = [
  item("hat-sapphire", "hat", "사파이어 학자 모자 · 1 GOLD", 1, "#3155a6"),
  item("hat-burgundy", "hat", "버건디 탐험 모자 · 10 GOLD", 10, "#8e304d"),
  item("hat-emerald", "hat", "에메랄드 숲 모자 · 35 GOLD", 35, "#2e8267"),
  item("hat-silver", "hat", "은빛 별모자 · 100 GOLD", 100, "#aabfe5"),

  item("necklace-moon", "necklace", "초승달 목걸이 · 1 GOLD", 1, "#7ba4e8"),
  item("necklace-star", "necklace", "별자리 목걸이 · 10 GOLD", 10, "#e6ba58"),
  item(
    "necklace-emerald",
    "necklace",
    "숲의 보석 목걸이 · 35 GOLD",
    35,
    "#45b982",
  ),
  item(
    "necklace-pearl",
    "necklace",
    "달빛 진주 목걸이 · 100 GOLD",
    100,
    "#f1e6da",
  ),

  item("cloak-sapphire", "cloak", "사파이어 별망토 · 1 GOLD", 1, "#263d87"),
  item("cloak-burgundy", "cloak", "버건디 여행망토 · 10 GOLD", 10, "#7d2944"),
  item("cloak-emerald", "cloak", "에메랄드 숲망토 · 35 GOLD", 35, "#286c59"),
  item("cloak-silver", "cloak", "은빛 서리망토 · 100 GOLD", 100, "#7692c8"),

  item("wand-willow", "wand", "버드나무 지팡이 · 1 GOLD", 1, "#a96c3b"),
  item("wand-crystal", "wand", "수정 지팡이 · 10 GOLD", 10, "#83b8ef"),
  item("wand-ember", "wand", "불씨 지팡이 · 35 GOLD", 35, "#e47a43"),
  item("wand-silver", "wand", "은빛 별지팡이 · 100 GOLD", 100, "#d9e6f7"),

  item("broom-sky", "broom", "하늘바람 빗자루 · 1 GOLD", 1, "#77a9cf"),
  item("broom-ember", "broom", "노을 빗자루 · 10 GOLD", 10, "#d26943"),
  item("broom-jade", "broom", "비취 빗자루 · 35 GOLD", 35, "#3da47b"),
  item("broom-lunar", "broom", "달빛 빗자루 · 100 GOLD", 100, "#b8c5e9"),

  item("gloves-cream", "gloves", "크림색 마법 장갑 · 1 GOLD", 1, "#e8d2b4"),
  item(
    "gloves-burgundy",
    "gloves",
    "버건디 가죽 장갑 · 10 GOLD",
    10,
    "#8a3d4d",
  ),
  item("gloves-sapphire", "gloves", "사파이어 장갑 · 35 GOLD", 35, "#3b5fb1"),
  item("gloves-emerald", "gloves", "에메랄드 장갑 · 100 GOLD", 100, "#33856a"),

  item("pants-navy", "pants", "남빛 여행 바지 · 1 GOLD", 1, "#283d70"),
  item("pants-burgundy", "pants", "버건디 승마 바지 · 10 GOLD", 10, "#713344"),
  item("pants-forest", "pants", "숲빛 바지 · 35 GOLD", 35, "#315d4e"),
  item("pants-silver", "pants", "은빛 별바지 · 100 GOLD", 100, "#7186aa"),

  item("vest-gold", "vest", "황금 단추 조끼 · 1 GOLD", 1, "#b8873c"),
  item("vest-silver", "vest", "은빛 학자 조끼 · 10 GOLD", 10, "#9aaac0"),
  item("vest-teal", "vest", "청록 탐험 조끼 · 35 GOLD", 35, "#327e83"),
  item(
    "vest-burgundy",
    "vest",
    "버건디 사냥꾼 조끼 · 100 GOLD",
    100,
    "#813749",
  ),
];

/** Starter IDs are intentionally stable: engine saves persist these IDs. */
export const STARTER_OUTFIT = Object.freeze(
  Object.fromEntries(
    WARDROBE_CATEGORIES.map((category) => [category, `${category}-base`]),
  ),
);

export const catalog = Object.freeze([...starterItems, ...paidItems]);
const byId = new Map(catalog.map((entry) => [entry.id, entry]));
const starterByCategory = new Map(
  WARDROBE_CATEGORIES.map((category) => [
    category,
    byId.get(STARTER_OUTFIT[category]),
  ]),
);

const CHARACTER_IDS = new Set([
  "dad",
  "mom",
  "jeongan",
  "suan",
  "yewon",
  "hunho",
]);
const CHARACTER_LABELS = Object.freeze({
  dad: "아빠",
  mom: "엄마",
  jeongan: "정안",
  suan: "수안",
  yewon: "예원언니",
  hunho: "훈호오빠",
});
const FAMILY_TOOLS = Object.freeze({
  dad: "astrolabe",
  mom: "botany",
  jeongan: "lunar",
  suan: "broom",
  yewon: "spellbook",
  hunho: "explorer-broom",
});
const VALID_MOODS = new Set(["neutral", "happy", "sad"]);
const WIZARD_ASSET_ROOT = new URL("./assets/wizards/", import.meta.url);
const GARMENT_ASSET_ROOT = new URL("./assets/garments/", import.meta.url);
const preloadedCharacters = new Set();

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
const garmentHref = (character, mood, itemId) =>
  new URL(`${character}-${mood}-${itemId}.webp`, GARMENT_ASSET_ROOT).href;

export function preloadCharacterArt(characterId) {
  const character = normalizeCharacter(characterId);
  if (preloadedCharacters.has(character) || typeof Image === "undefined")
    return;
  preloadedCharacters.add(character);
  for (const mood of VALID_MOODS) {
    const image = new Image();
    image.decoding = "async";
    image.src = assetHref(`${character}-${mood}.webp`);
  }
}

const normalizeCharacter = (characterId) => {
  if (typeof characterId === "string" && CHARACTER_IDS.has(characterId))
    return characterId;
  throw new RangeError(`알 수 없는 캐릭터 ID입니다: ${String(characterId)}`);
};
const normalizeMood = (mood) =>
  typeof mood === "string" && VALID_MOODS.has(mood) ? mood : "neutral";
const chosenItem = (equipped, category) => {
  const requestedId =
    equipped && typeof equipped === "object" ? equipped[category] : undefined;
  const requested =
    typeof requestedId === "string" ? byId.get(requestedId) : undefined;
  return requested && requested.category === category
    ? requested
    : starterByCategory.get(category);
};

const moodLabel = Object.freeze({
  neutral: "차분한 표정",
  happy: "기쁜 표정",
  sad: "걱정스러운 표정",
});

const GARMENT_RENDER_ORDER = Object.freeze([
  "broom",
  "base",
  "pants",
  "vest",
  "gloves",
  "cloak",
  "necklace",
  "hat",
  "wand",
]);

const garmentLayer = (item, character, mood) => {
  const itemId = escapeXml(item.id);
  const category = escapeXml(item.category);
  const name = escapeXml(item.name);
  return `<image class="avatar-accessory avatar-garment-layer avatar-item avatar-item-${category}" data-layer="generated-garment" data-category="${category}" data-item="${itemId}" data-color="${escapeXml(item.color)}" href="${escapeXml(garmentHref(character, mood, item.id))}" x="0" y="0" width="512" height="1024" preserveAspectRatio="none" aria-label="${name}" />`;
};

export function avatarMarkup(
  equipped = {},
  characterId = null,
  mood = "neutral",
) {
  const character = normalizeCharacter(characterId);
  const safeMood = normalizeMood(mood);
  const selected = Object.fromEntries(
    WARDROBE_CATEGORIES.map((category) => [
      category,
      chosenItem(equipped, category),
    ]),
  );
  const customItems = new Map(
    WARDROBE_CATEGORIES.map((category) => selected[category])
      .filter((entry) => entry.id !== STARTER_OUTFIT[entry.category])
      .map((entry) => [entry.category, entry]),
  );
  const dataAttributes = WARDROBE_CATEGORIES.map(
    (category) => `data-${category}="${escapeXml(selected[category].id)}"`,
  ).join(" ");
  const characterName = CHARACTER_LABELS[character];
  const label = `${characterName} 마법사, ${moodLabel[safeMood]}`;
  const baseImage = assetHref(`${character}-${safeMood}.webp`);
  const instanceLabel = `${characterName} 생성 전신 일러스트`;
  return `<svg class="avatar-art avatar-wizard avatar-mood-${escapeXml(safeMood)}" viewBox="0 0 512 1024" role="img" aria-label="${escapeXml(label)}" data-character="${escapeXml(character)}" data-mood="${escapeXml(safeMood)}" data-family-tool="${escapeXml(FAMILY_TOOLS[character])}" data-base-outfit="native-character-design" ${dataAttributes}>
  <title>${escapeXml(label)} · 기본 의상은 캐릭터 고유 디자인</title>
  <g class="avatar-pose" data-mood="${escapeXml(safeMood)}">
    ${GARMENT_RENDER_ORDER.map((layer) => {
      if (layer === "base") {
        return `<image class="avatar-generated-base" data-layer="generated-art" href="${escapeXml(baseImage)}" x="0" y="0" width="512" height="1024" preserveAspectRatio="xMidYMid meet" aria-label="${escapeXml(instanceLabel)}" />`;
      }
      const item = customItems.get(layer);
      return item ? garmentLayer(item, character, safeMood) : "";
    }).join("")}
  </g>
</svg>`;
}
