import wardrobeCatalog from "./assets/wardrobe-catalog.json" with { type: "json" };
import rig from "./assets/doll/rigged/runtime.json" with { type: "json" };

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
    name: ["hat", "necklace", "cloak", "gloves", "vest"].includes(category)
      ? "착용 안 함"
      : category === "pants"
        ? "기본 바지"
        : category === "wand"
          ? "기본 나무 지팡이"
          : "기본 빗자루",
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
const VALID_MOODS = new Set(["neutral", "happy", "sad"]);
const DOLL_ASSET_ROOT = new URL("./assets/doll/", import.meta.url);
/** Physical body canvas; complete hatted heads may extend above it. */
export const DOLL_CANVAS = Object.freeze([1024, 1536]);
/**
 * Start without decorative clothing. The plain shirt is an underlayer;
 * bare hands and hair are anatomical parts, not equipped accessories.
 */
export const STARTER_LAYERS = Object.freeze({
  dad: Object.freeze(["wand"]),
  mom: Object.freeze(["wand"]),
  jeongan: Object.freeze(["wand"]),
  suan: Object.freeze(["wand", "broom"]),
  yewon: Object.freeze(["wand"]),
  hunho: Object.freeze(["wand", "broom"]),
});
/**
 * Each character has one neck behind the shirt and jewellery; the head owns
 * its complete jaw and hair, not another neck or collar. Fingers cover the lower wand handle;
 * its upper shaft emerges in front from the thumb/index opening. A worn hat
 * replaces the complete head and hairstyle.
 */
export const RENDER_ORDER = Object.freeze([
  "broom",
  "boots",
  "pants",
  "neck",
  "body",
  "vest",
  "cloak",
  "necklace",
  "wand",
  "hands",
  "wand-grip",
  "head",
]);
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
const dollHref = (filename) => new URL(filename, DOLL_ASSET_ROOT).href;
/** Layer file for a worn item, or null when the base clothing stays visible. */
export function garmentLayerFile(character, item, mood = "neutral") {
  normalizeCharacter(character);
  if (item.category === "hat") {
    const variant = item.price > 0 ? item.id : "bare";
    return `headwear/${character}-${normalizeMood(mood)}-${variant}.webp`;
  }
  if (item.category === "pants")
    return item.price === 0
      ? "rigged/starter-pants.webp"
      : `rigged/clothing/${item.id}.webp`;
  if (item.category === "gloves")
    return item.price === 0
      ? "rigged/hands-base.webp"
      : `rigged/gloves/${item.id}.webp`;
  if (item.category === "cloak")
    return item.price === 0 ? null : `rigged/clothing/${item.id}.webp`;
  if (item.price === 0) {
    if (
      ["wand", "broom"].includes(item.category) &&
      STARTER_LAYERS[character].includes(item.category)
    )
      return `rigged/${item.category}-base.webp`;
    return null;
  }
  return ["wand", "broom", "necklace"].includes(item.category)
    ? `rigged/${item.id}.webp`
    : `rigged/clothing/${item.id}.webp`;
}

export function preloadCharacterArt(characterId) {
  const character = normalizeCharacter(characterId);
  if (preloadedCharacters.has(character) || typeof Image === "undefined")
    return;
  preloadedCharacters.add(character);
  const files = new Set(
    [...VALID_MOODS].flatMap((mood) =>
      avatarLayers(STARTER_OUTFIT, character, mood).map((layer) => layer.file),
    ),
  );
  for (const file of files) {
    const image = new Image();
    image.decoding = "async";
    image.src = dollHref(file);
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

function selectedOutfit(equipped) {
  return Object.fromEntries(
    WARDROBE_CATEGORIES.map((category) => [
      category,
      chosenItem(equipped, category),
    ]),
  );
}

export function avatarLayers(equipped, characterId, mood = "neutral") {
  const character = normalizeCharacter(characterId),
    selected = selectedOutfit(equipped),
    layers = [];
  const add = (kind, file, item = null) => {
    if (!file) return;
    const geometry = rig.files[file];
    if (!geometry) throw new Error(`Missing paper-doll layer: ${file}`);
    layers.push({
      kind,
      file,
      ...geometry,
      category: item?.category,
      itemId: item?.id,
      name: item?.name,
    });
  };
  add("broom", garmentLayerFile(character, selected.broom), selected.broom);
  if (selected.pants.price > 0) add("boots", "rigged/boots.webp");
  add("pants", garmentLayerFile(character, selected.pants), selected.pants);
  const neckFile =
    selected.hat.price > 0
      ? `rigged/necks/${character}-${selected.hat.id}.webp`
      : `rigged/necks/${character}.webp`;
  add("neck", neckFile);
  add("body", "rigged/body-upper.webp");
  for (const category of ["vest", "cloak", "necklace"])
    add(
      category,
      garmentLayerFile(character, selected[category]),
      selected[category],
    );
  const wandFile = garmentLayerFile(character, selected.wand);
  add("wand", wandFile, selected.wand);
  add("hands", garmentLayerFile(character, selected.gloves), selected.gloves);
  const gripFile = rig.files[wandFile].gripLayer;
  if (!gripFile) throw new Error(`Missing finger-opening layer: ${wandFile}`);
  add("wand-grip", gripFile);
  add("head", garmentLayerFile(character, selected.hat, mood), selected.hat);
  return layers;
}

export function avatarMarkup(
  equipped = {},
  characterId = null,
  mood = "neutral",
) {
  const character = normalizeCharacter(characterId);
  const safeMood = normalizeMood(mood);
  const selected = selectedOutfit(equipped);
  const dataAttributes = WARDROBE_CATEGORIES.map(
    (category) => `data-${category}="${escapeXml(selected[category].id)}"`,
  ).join(" ");
  const label = `${CHARACTER_LABELS[character]} 마법사, ${moodLabel[safeMood]}`;
  const parts = avatarLayers(equipped, character, safeMood);
  const top = Math.min(0, ...parts.map((part) => part.bbox[1] - 24));
  const left = Math.min(0, ...parts.map((part) => part.bbox[0] - 24));
  const right = Math.max(1024, ...parts.map((part) => part.bbox[2] + 24));
  const bottom = Math.max(1536, ...parts.map((part) => part.bbox[3] + 24));
  const layers = parts
    .map(
      (part) =>
        `<image class="avatar-doll-${part.kind}${part.category ? ` avatar-item avatar-item-${part.category}` : ""}" data-layer="${part.kind}"${part.category ? ` data-garment-category="${part.category}" data-garment-item="${escapeXml(part.itemId)}"` : ""} href="${escapeXml(dollHref(part.file))}" x="${part.x}" y="${part.y}" width="${part.width}" height="${part.height}" preserveAspectRatio="none" aria-label="${escapeXml(part.name || label)}" />`,
    )
    .join("");
  return `<svg class="avatar-art avatar-wizard avatar-mood-${escapeXml(safeMood)}" viewBox="${left} ${top} ${right - left} ${bottom - top}" role="img" aria-label="${escapeXml(label)}" data-character="${escapeXml(character)}" data-mood="${escapeXml(safeMood)}" data-base-outfit="paper-doll-rig-v2" ${dataAttributes}><title>${escapeXml(label)} · 옷과 모자에 맞춘 종이인형</title><g class="avatar-pose" data-mood="${escapeXml(safeMood)}">${layers}</g></svg>`;
}
