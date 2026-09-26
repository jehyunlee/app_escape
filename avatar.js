import wardrobeCatalog from "./assets/wardrobe-catalog.json" with { type: "json" };

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

if (!Array.isArray(wardrobeCatalog))
  throw new TypeError("Wardrobe catalog must be an array of paid items");
const catalogEntries = [
  ...WARDROBE_CATEGORIES.map((category) => ({
    id: `${category}-base`,
    category,
    name: "기본 장비",
    price: 0,
    color: "#6f6575",
  })),
  ...wardrobeCatalog,
];
const normalizeCatalogEntry = (entry) => {
  if (!entry || typeof entry !== "object")
    throw new TypeError("Invalid wardrobe item");
  const {
    id,
    category,
    name,
    price,
    color,
    quality,
    description,
    designPrompt,
  } = entry;
  if (
    typeof id !== "string" ||
    !WARDROBE_CATEGORIES.includes(category) ||
    !Number.isSafeInteger(price) ||
    typeof name !== "string" ||
    typeof color !== "string"
  )
    throw new TypeError(`Invalid wardrobe item: ${String(id)}`);
  return Object.freeze({
    id,
    category,
    name,
    price,
    color,
    ...(quality === undefined ? {} : { quality }),
    ...(description === undefined ? {} : { description }),
    ...(designPrompt === undefined ? {} : { designPrompt }),
  });
};
const normalizedCatalog = catalogEntries.map(normalizeCatalogEntry);
const starterItems = WARDROBE_CATEGORIES.map((category) => {
  const starter = normalizedCatalog.find(
    (entry) => entry.category === category && entry.price === 0,
  );
  if (!starter)
    throw new TypeError(`Missing starter wardrobe item: ${category}`);
  return starter;
});
const paidItems = normalizedCatalog.filter((entry) => entry.price > 0);

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
  const customHat = customItems.get("hat");
  const wornBaseImage = customHat
    ? new URL(`${character}-${safeMood}-hatless.webp`, GARMENT_ASSET_ROOT).href
    : baseImage;
  return `<svg class="avatar-art avatar-wizard avatar-mood-${escapeXml(safeMood)}" viewBox="0 0 512 1024" role="img" aria-label="${escapeXml(label)}" data-character="${escapeXml(character)}" data-mood="${escapeXml(safeMood)}" data-family-tool="${escapeXml(FAMILY_TOOLS[character])}" data-base-outfit="native-character-design" ${dataAttributes}>
  <title>${escapeXml(label)} · 기본 의상은 캐릭터 고유 디자인</title>
  <g class="avatar-pose" data-mood="${escapeXml(safeMood)}">
    ${GARMENT_RENDER_ORDER.map((layer) => {
      if (layer === "base") {
        return `<image class="avatar-generated-base" data-layer="generated-art" data-original-art="${escapeXml(baseImage)}" href="${escapeXml(wornBaseImage)}" x="0" y="0" width="512" height="1024" preserveAspectRatio="xMidYMid meet" aria-label="${escapeXml(instanceLabel)}" />`;
      }
      const item = customItems.get(layer);
      return item ? garmentLayer(item, character, safeMood) : "";
    }).join("")}
  </g>
</svg>`;
}
