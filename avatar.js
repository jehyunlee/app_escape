const categories = ["eyes", "skin", "clothes", "accessory"];

/**
 * The wardrobe is intentionally data-only. Item IDs and prices are persisted
 * by the game, so changing them would invalidate existing saves.
 */
export const catalog = Object.freeze(
  [
    {
      id: "eyes-brown",
      category: "eyes",
      name: "갈색 눈",
      price: 0,
      color: "#5a3b2e",
    },
    {
      id: "eyes-blue",
      category: "eyes",
      name: "파란 눈",
      price: 35,
      color: "#3f75a8",
    },
    {
      id: "eyes-green",
      category: "eyes",
      name: "초록 눈",
      price: 55,
      color: "#4e8a67",
    },
    {
      id: "eyes-violet",
      category: "eyes",
      name: "보랏빛 눈",
      price: 75,
      color: "#76589b",
    },
    {
      id: "eyes-hazel",
      category: "eyes",
      name: "금갈색 눈",
      price: 90,
      color: "#8f7247",
    },

    {
      id: "skin-peach",
      category: "skin",
      name: "복숭아빛 피부",
      price: 0,
      color: "#f1c7a5",
    },
    {
      id: "skin-sand",
      category: "skin",
      name: "모래빛 피부",
      price: 40,
      color: "#d9a276",
    },
    {
      id: "skin-cocoa",
      category: "skin",
      name: "구릿빛 피부",
      price: 40,
      color: "#a96f4e",
    },
    {
      id: "skin-deep",
      category: "skin",
      name: "갈색 피부",
      price: 40,
      color: "#6f4435",
    },
    {
      id: "skin-umber",
      category: "skin",
      name: "짙은 갈색 피부",
      price: 40,
      color: "#4f3029",
    },

    {
      id: "clothes-purple",
      category: "clothes",
      name: "기본 마법사 의상",
      price: 0,
      color: "#5d3a8a",
    },
    {
      id: "clothes-emerald",
      category: "clothes",
      name: "숲빛 로브",
      price: 45,
      color: "#285d53",
    },
    {
      id: "clothes-navy",
      category: "clothes",
      name: "한밤의 로브",
      price: 70,
      color: "#304a82",
    },
    {
      id: "clothes-rose",
      category: "clothes",
      name: "장미 로브",
      price: 95,
      color: "#9b4669",
    },
    {
      id: "clothes-amber",
      category: "clothes",
      name: "호박빛 로브",
      price: 130,
      color: "#a36b2f",
    },

    {
      id: "accessory-none",
      category: "accessory",
      name: "장식 없음",
      price: 0,
      color: "#71677f",
    },
    {
      id: "accessory-wand",
      category: "accessory",
      name: "버드나무 지팡이",
      price: 25,
      color: "#c8924a",
    },
    {
      id: "accessory-star",
      category: "accessory",
      name: "별 브로치",
      price: 60,
      color: "#d7b65f",
    },
    {
      id: "accessory-scarf",
      category: "accessory",
      name: "달빛 목도리",
      price: 80,
      color: "#bf4769",
    },
    {
      id: "accessory-circlet",
      category: "accessory",
      name: "초승달 머리띠",
      price: 150,
      color: "#d9b86d",
    },
    {
      id: "accessory-moon",
      category: "accessory",
      name: "푸른 달 장식",
      price: 180,
      color: "#6b91d3",
    },
  ].map((item) => Object.freeze(item)),
);

const byId = new Map(catalog.map((item) => [item.id, item]));
const starterByCategory = new Map(
  categories.map((category) => [
    category,
    byId.get(
      {
        eyes: "eyes-brown",
        skin: "skin-peach",
        clothes: "clothes-purple",
        accessory: "accessory-none",
      }[category],
    ),
  ]),
);

const CHARACTER_IDS = new Set(["dad", "mom", "jeongan", "suan"]);
const CHARACTER_LABELS = Object.freeze({
  dad: "아빠",
  mom: "엄마",
  jeongan: "정안",
  suan: "수안",
});
const FAMILY_TOOLS = Object.freeze({
  dad: "astrolabe",
  mom: "botany",
  jeongan: "lunar",
  suan: "broom",
});

const VALID_MOODS = new Set(["neutral", "happy", "sad"]);
const WIZARD_ASSET_ROOT = new URL("./assets/wizards/", import.meta.url);
let avatarInstance = 0;

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
const preloadedCharacters = new Set();

export function preloadCharacterArt(characterId) {
  const character = normalizeCharacter(characterId);
  if (preloadedCharacters.has(character)) return;
  preloadedCharacters.add(character);
  for (const mood of VALID_MOODS) {
    const image = new Image();
    image.decoding = "async";
    image.src = assetHref(`${character}-${mood}.webp`);
  }
}

const chosenItem = (equipped, category) => {
  const requestedId =
    equipped && typeof equipped === "object" ? equipped[category] : undefined;
  const requested =
    typeof requestedId === "string" ? byId.get(requestedId) : undefined;
  return requested && requested.category === category
    ? requested
    : starterByCategory.get(category);
};

const normalizeMood = (mood) =>
  typeof mood === "string" && VALID_MOODS.has(mood) ? mood : "neutral";

const normalizeCharacter = (characterId) => {
  if (typeof characterId === "string" && CHARACTER_IDS.has(characterId)) {
    return characterId;
  }
  throw new RangeError(`알 수 없는 캐릭터 ID입니다: ${String(characterId)}`);
};

const maskSuffix = Object.freeze({
  eyes: "eyes",
  skin: "skin",
  clothes: "robe",
});

const maskIdFor = (instanceId, category) =>
  `avatar-${instanceId}-${category}-mask`;

/**
 * Only non-starter wardrobe choices get recoloured. The generated base art is
 * deliberately left untouched for starter IDs so every family member keeps
 * the outfit, eye colour and skin tone designed for that character.
 */
const recolourLayers = (selected, characterId, mood, instanceId) => {
  const recolours = categories.filter(
    (category) =>
      category !== "accessory" &&
      selected[category].id !== starterByCategory.get(category).id,
  );
  if (!recolours.length) return { defs: "", layers: "" };

  const defs = recolours
    .map((category) => {
      const maskId = maskIdFor(instanceId, category);
      const filename = `${characterId}-${mood}-${maskSuffix[category]}.webp`;
      const rgb = selected[category].color
        .slice(1)
        .match(/../g)
        .map((channel) => parseInt(channel, 16) / 255);
      const matrix = rgb
        .flatMap((channel) => [
          0.2126 * 0.8 * channel,
          0.7152 * 0.8 * channel,
          0.0722 * 0.8 * channel,
          0,
          0.25 * channel,
        ])
        .concat([0, 0, 0, 1, 0])
        .join(" ");
      return `<mask id="${escapeXml(maskId)}" mask-type="alpha" maskUnits="userSpaceOnUse" maskContentUnits="userSpaceOnUse" x="0" y="0" width="512" height="1024">
      <image href="${escapeXml(assetHref(filename))}" x="0" y="0" width="512" height="1024" preserveAspectRatio="none" aria-hidden="true" />
    </mask>${category === "skin" ? `<filter id="${maskId}-tone" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="${matrix}"/></filter>` : ""}`;
    })
    .join("");

  const layers = recolours
    .map((category) => {
      const item = selected[category];
      const maskId = maskIdFor(instanceId, category);
      if (category === "skin") {
        return `<image class="avatar-mask-tint avatar-mask-tint-skin" data-mask-category="skin" data-color="${item.color}" href="${escapeXml(assetHref(`${characterId}-${mood}.webp`))}" x="0" y="0" width="512" height="1024" mask="url(#${maskId})" filter="url(#${maskId}-tone)" aria-label="${escapeXml(item.name)}"/>`;
      }
      return `<rect class="avatar-mask-tint avatar-mask-tint-${escapeXml(category)}" data-mask-category="${escapeXml(category)}" x="0" y="0" width="512" height="1024" fill="${escapeXml(item.color)}" mask="url(#${escapeXml(maskId)})" style="mix-blend-mode:color" aria-label="${escapeXml(item.name)}" />`;
    })
    .join("");

  return { defs, layers };
};

const accessoryAnchors = Object.freeze({
  dad: Object.freeze({
    head: Object.freeze({ x: 256, y: 252 }),
    neck: Object.freeze({ x: 260, y: 378 }),
    chest: Object.freeze({ x: 252, y: 448 }),
    hand: Object.freeze({ x: 350, y: 600 }),
  }),
  mom: Object.freeze({
    head: Object.freeze({ x: 280, y: 313 }),
    neck: Object.freeze({ x: 280, y: 425 }),
    chest: Object.freeze({ x: 275, y: 485 }),
    hand: Object.freeze({ x: 340, y: 525 }),
  }),
  jeongan: Object.freeze({
    head: Object.freeze({ x: 270, y: 316 }),
    neck: Object.freeze({ x: 270, y: 438 }),
    chest: Object.freeze({ x: 280, y: 505 }),
    hand: Object.freeze({ x: 370, y: 660 }),
  }),
  suan: Object.freeze({
    head: Object.freeze({ x: 269, y: 279 }),
    neck: Object.freeze({ x: 269, y: 386 }),
    chest: Object.freeze({ x: 267, y: 442 }),
    hand: Object.freeze({ x: 370, y: 620 }),
  }),
});

const accessoryMarkup = (accessory, characterId) => {
  if (accessory.id === "accessory-none") return "";
  const color = escapeXml(accessory.color);
  const anchor = accessoryAnchors[characterId];
  const { head, neck, chest, hand } = anchor;

  switch (accessory.id) {
    case "accessory-star":
      return `<path class="avatar-accessory-star" d="M${chest.x} ${chest.y - 27}l7 19 20 1-16 12 5 20-16-11-17 11 6-20-16-12 20-1z" fill="${color}" stroke="#fff0bf" stroke-width="4" stroke-linejoin="round" />`;
    case "accessory-scarf":
      return `<g class="avatar-accessory-scarf" fill="${color}" stroke="#f9d8b0" stroke-width="4" stroke-linejoin="round"><path d="M${neck.x - 68} ${neck.y - 15}q68 35 136 0l-9 42q-59 25-118 0z" /><path d="M${neck.x + 38} ${neck.y + 18}l34 112-25 9-28-111z" /></g>`;
    case "accessory-circlet":
      return `<g class="avatar-accessory-circlet" fill="none" stroke="${color}" stroke-width="12" stroke-linecap="round"><path d="M${head.x - 72} ${head.y + 20}q72-80 144 0" /></g><path class="avatar-accessory-circlet-gem" d="M${head.x} ${head.y - 42}l12 18-12 18-12-18z" fill="${color}" stroke="#fff0bf" stroke-width="4" />`;
    case "accessory-wand":
      return `<g class="avatar-accessory-wand" stroke-linecap="round"><path d="M${hand.x - 16} ${hand.y + 30}L${hand.x + 86} ${hand.y - 176}" fill="none" stroke="#80562f" stroke-width="14" /><path d="M${hand.x + 86} ${hand.y - 176}l25-29" fill="none" stroke="${color}" stroke-width="10" /><path d="M${hand.x + 113} ${hand.y - 224}l7 21 21 7-21 7-7 21-7-21-21-7 21-7z" fill="${color}" stroke="#fff0bf" stroke-width="4" /></g>`;
    case "accessory-moon":
      return `<path class="avatar-accessory-moon" d="M${chest.x + 2} ${chest.y - 30}a42 42 0 1 0 35 66 34 34 0 1 1-35-66z" fill="${color}" stroke="#dceaff" stroke-width="5" /><circle cx="${chest.x + 3}" cy="${chest.y + 35}" r="8" fill="#dceaff" />`;
    default:
      return "";
  }
};

const moodLabel = Object.freeze({
  neutral: "차분한 표정",
  happy: "기쁜 표정",
  sad: "걱정스러운 표정",
});

/**
 * Render generated, transparent full-body wizard art and optional wardrobe
 * overlays. Every image is resolved from this module so the markup works from
 * any page that renders an avatar; no external image or API request is made.
 */
export function avatarMarkup(
  equipped = {},
  characterId = null,
  mood = "neutral",
) {
  const character = normalizeCharacter(characterId);
  const safeMood = normalizeMood(mood);
  const selected = Object.fromEntries(
    categories.map((category) => [category, chosenItem(equipped, category)]),
  );
  const instanceId = ++avatarInstance;
  const { defs, layers } = recolourLayers(
    selected,
    character,
    safeMood,
    instanceId,
  );
  const accessory = selected.accessory;
  const characterName = CHARACTER_LABELS[character];
  const tool = FAMILY_TOOLS[character];
  const dataAttributes = categories
    .map((category) => `data-${category}="${escapeXml(selected[category].id)}"`)
    .join(" ");
  const baseImage = assetHref(`${character}-${safeMood}.webp`);
  const accessoryLabel = accessory.name;
  const label = `${characterName} 마법사, ${moodLabel[safeMood]}`;

  return `<svg class="avatar-art avatar-wizard avatar-mood-${escapeXml(safeMood)}" viewBox="0 0 512 1024" role="img" aria-label="${escapeXml(label)}" data-character="${escapeXml(character)}" data-mood="${escapeXml(safeMood)}" data-family-tool="${escapeXml(tool)}" data-base-outfit="native-character-design" ${dataAttributes}>
  <title>${escapeXml(label)} · 기본 의상은 캐릭터 고유 디자인</title>
  <g class="avatar-pose" data-mood="${escapeXml(safeMood)}">
    <image class="avatar-generated-base" data-layer="generated-art" href="${escapeXml(baseImage)}" x="0" y="0" width="512" height="1024" preserveAspectRatio="xMidYMid meet" aria-label="${escapeXml(characterName)} 생성 전신 일러스트" />
    ${layers}
    <g class="avatar-accessory" data-item="${escapeXml(accessory.id)}" data-color="${escapeXml(accessory.color)}" aria-label="${escapeXml(accessoryLabel)}">
      ${accessoryMarkup(accessory, character)}
    </g>
  </g>
  ${defs ? `<defs>${defs}</defs>` : ""}
</svg>`;
}
