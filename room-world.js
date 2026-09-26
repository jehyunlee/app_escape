import * as THREE from "three";
import { QUESTION_COUNT as TARGET_COUNT } from "./levels.js";
import { itemsForRoom } from "./magical-items.js";
import { createMagicalItem } from "./magical-item-models.js";

const PI2 = Math.PI * 2;

// Foreground props are intentionally substantial enough to read at a glance.
// Keep this as a named contract so renderer/layout regression checks can
// compare the visible geometry size without reaching into a generated model.
export const TARGET_MODEL_SCALE = 1.95;
const SCATTER_LAYOUT = Object.freeze({
  // Five jittered columns and three depth-staggered bands keep the props
  // spread over the artwork instead of letting best-candidate sampling drift
  // back toward the centre as the models get larger.
  minX: -13,
  width: 26,
  baseY: 1.35,
  height: 12.2,
  minZ: -4.2,
  depth: 5.9,
});
const SCATTER_COLUMNS = 5;
const SCATTER_ROWS = 3;
const SCATTER_GAP_X = 0.42;
const SCATTER_GAP_Y = 0.38;

// Geometry belongs to one room instance.  Keeping a process-wide cache here
// causes a rebuilt room to receive geometries that the renderer already
// disposed during the previous room's teardown.
function geometry(_key, factory) {
  return factory();
}

const boxGeometry = (w, h, d) =>
  geometry(`box:${w}:${h}:${d}`, () => new THREE.BoxGeometry(w, h, d));
const cylinderGeometry = (rTop, rBottom, h, segments = 16) =>
  geometry(
    `cylinder:${rTop}:${rBottom}:${h}:${segments}`,
    () => new THREE.CylinderGeometry(rTop, rBottom, h, segments),
  );
const sphereGeometry = (r, width = 16, height = 10) =>
  geometry(
    `sphere:${r}:${width}:${height}`,
    () => new THREE.SphereGeometry(r, width, height),
  );
const torusGeometry = (r, tube, radial = 16, tubular = 32, arc = PI2) =>
  geometry(
    `torus:${r}:${tube}:${radial}:${tubular}:${arc}`,
    () => new THREE.TorusGeometry(r, tube, radial, tubular, arc),
  );
const coneGeometry = (r, h, segments = 12) =>
  geometry(
    `cone:${r}:${h}:${segments}`,
    () => new THREE.ConeGeometry(r, h, segments),
  );

function material(color, options = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: options.roughness ?? 0.76,
    metalness: options.metalness ?? 0.08,
    emissive: options.emissive ?? 0x000000,
    emissiveIntensity: options.emissiveIntensity ?? 0,
    transparent: options.transparent ?? false,
    opacity: options.opacity ?? 1,
    side: options.side ?? THREE.FrontSide,
    flatShading: options.flatShading ?? false,
  });
}

function createMaterials() {
  return {
    stone: material(0x3b4e56, { roughness: 0.93 }),
    stoneLight: material(0x65777b, { roughness: 0.9 }),
    stoneDark: material(0x1e3039, { roughness: 0.96 }),
    mortar: material(0x253841, { roughness: 1 }),
    slate: material(0x182833, { roughness: 0.82 }),
    floor: material(0x3b3030, { roughness: 0.88 }),
    floorLight: material(0x745343, { roughness: 0.81 }),
    floorDark: material(0x2a242c, { roughness: 0.94 }),
    wood: material(0x5b3b2e, { roughness: 0.78 }),
    woodLight: material(0x9a704d, { roughness: 0.7 }),
    woodDark: material(0x302126, { roughness: 0.88 }),
    woodGold: material(0xb78651, { roughness: 0.64, metalness: 0.18 }),
    brass: material(0xb98a45, { roughness: 0.31, metalness: 0.84 }),
    brassBright: material(0xe0bc6d, { roughness: 0.26, metalness: 0.9 }),
    iron: material(0x26333a, { roughness: 0.42, metalness: 0.72 }),
    glass: material(0x4b99a0, {
      roughness: 0.13,
      metalness: 0.06,
      transparent: true,
      opacity: 0.27,
      side: THREE.DoubleSide,
    }),
    moonGlass: material(0x6d9da8, {
      roughness: 0.2,
      metalness: 0.04,
      transparent: true,
      opacity: 0.46,
      emissive: 0x173b49,
      emissiveIntensity: 0.3,
      side: THREE.DoubleSide,
    }),
    warmGlass: material(0xb8734f, {
      roughness: 0.2,
      metalness: 0.04,
      transparent: true,
      opacity: 0.48,
      emissive: 0x8f3f25,
      emissiveIntensity: 0.65,
      side: THREE.DoubleSide,
    }),
    green: material(0x2b594c, { roughness: 0.84 }),
    greenLight: material(0x60926a, { roughness: 0.78 }),
    leaf: material(0x3f7b55, { roughness: 0.84 }),
    leafLight: material(0x8dbb73, { roughness: 0.72 }),
    red: material(0x8b3e47, { roughness: 0.76 }),
    blue: material(0x315b80, { roughness: 0.72 }),
    violet: material(0x5b477f, { roughness: 0.7 }),
    parchment: material(0xc8aa72, { roughness: 0.9 }),
    paper: material(0xd5c8a6, { roughness: 0.92 }),
    ink: material(0x141725, { roughness: 0.54 }),
    chalk: material(0xc9d6cd, { roughness: 0.78 }),
    gold: material(0xe6c56e, { roughness: 0.31, metalness: 0.86 }),
    candle: material(0xffd889, {
      roughness: 0.37,
      emissive: 0xffa62e,
      emissiveIntensity: 1.7,
    }),
    flame: material(0xffc25c, {
      roughness: 0.28,
      emissive: 0xff751f,
      emissiveIntensity: 3.3,
      transparent: true,
      opacity: 0.96,
    }),
    tealGlow: material(0x67d6ca, {
      roughness: 0.3,
      emissive: 0x39c7bb,
      emissiveIntensity: 2.2,
    }),
    star: material(0xf8e9b7, {
      roughness: 0.2,
      emissive: 0xffce75,
      emissiveIntensity: 2.9,
    }),
    portrait: material(0x745a56, { roughness: 0.9 }),
    black: material(0x10161a, { roughness: 0.72 }),
    white: material(0xdad9c7, { roughness: 0.9 }),
  };
}

function place(
  object,
  x = 0,
  y = 0,
  z = 0,
  rx = 0,
  ry = 0,
  rz = 0,
  sx = 1,
  sy = 1,
  sz = 1,
) {
  object.position.set(x, y, z);
  object.rotation.set(rx, ry, rz);
  object.scale.set(sx, sy, sz);
  return object;
}

function addMesh(parent, geo, mat, transform = {}) {
  const object = new THREE.Mesh(geo, mat);
  place(
    object,
    transform.x ?? 0,
    transform.y ?? 0,
    transform.z ?? 0,
    transform.rx ?? 0,
    transform.ry ?? 0,
    transform.rz ?? 0,
    transform.sx ?? 1,
    transform.sy ?? 1,
    transform.sz ?? 1,
  );
  object.castShadow = transform.castShadow ?? true;
  object.receiveShadow = transform.receiveShadow ?? true;
  parent.add(object);
  return object;
}

function addBox(parent, mat, w, h, d, transform = {}) {
  return addMesh(parent, boxGeometry(w, h, d), mat, transform);
}

function addCylinder(
  parent,
  mat,
  rTop,
  rBottom,
  h,
  transform = {},
  segments = 16,
) {
  return addMesh(
    parent,
    cylinderGeometry(rTop, rBottom, h, segments),
    mat,
    transform,
  );
}

function addSphere(parent, mat, r, transform = {}, width = 16, height = 10) {
  return addMesh(parent, sphereGeometry(r, width, height), mat, transform);
}

function addTorus(
  parent,
  mat,
  r,
  tube,
  transform = {},
  radial = 16,
  tubular = 32,
  arc = PI2,
) {
  return addMesh(
    parent,
    torusGeometry(r, tube, radial, tubular, arc),
    mat,
    transform,
  );
}

function addCone(parent, mat, r, h, transform = {}, segments = 12) {
  return addMesh(parent, coneGeometry(r, h, segments), mat, transform);
}

function addRearArtwork(root, room) {
  const assetUrl = new URL(`./${room.image}`, import.meta.url).href;
  const artworkMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    fog: false,
    side: THREE.FrontSide,
  });
  artworkMaterial.name = `room-artwork-material-${room.id}`;
  const artwork = new THREE.Mesh(
    geometry("rear-artwork-plane", () => new THREE.PlaneGeometry(23.4, 15.6)),
    artworkMaterial,
  );
  artwork.name = `room-artwork-${room.id}`;
  const camera = CAMERA_CONFIG[room.themeId];
  const eye = new THREE.Vector3(...camera.position);
  const look = new THREE.Vector3(...camera.target);
  artwork.position.copy(look.sub(eye).normalize().multiplyScalar(18).add(eye));
  artwork.lookAt(eye);
  artwork.castShadow = false;
  artwork.receiveShadow = false;
  artwork.userData.asset = assetUrl;
  root.add(artwork);
  if (typeof document !== "undefined" && typeof Image !== "undefined") {
    const loader = new THREE.TextureLoader();
    loader.load(
      assetUrl,
      (texture) => {
        if (root.userData.disposed) {
          texture.dispose();
          return;
        }
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = 4;
        artworkMaterial.map = texture;
        artworkMaterial.needsUpdate = true;
      },
      undefined,
      (error) => {
        root.userData.assetError =
          error || new Error(`Unable to load ${room.image}`);
        artworkMaterial.color.set(0x7a1e2c);
        artworkMaterial.needsUpdate = true;
      },
    );
  }
  return artwork;
}

function addGlow(parent, mats, x, y, z, radius = 0.1) {
  return addSphere(parent, mats.flame, radius, {
    x,
    y,
    z,
    sx: 0.72,
    sy: 1.45,
    sz: 0.72,
    castShadow: false,
  });
}

function addGear(
  parent,
  mats,
  x,
  y,
  z,
  radius = 0.9,
  teeth = 12,
  materialKey = "brass",
) {
  const group = new THREE.Group();
  group.position.set(x, y, z);
  parent.add(group);
  addCylinder(
    group,
    mats[materialKey],
    radius * 0.74,
    radius * 0.74,
    0.2,
    { rx: Math.PI / 2 },
    20,
  );
  addTorus(
    group,
    mats[materialKey],
    radius * 0.23,
    radius * 0.12,
    { rx: Math.PI / 2 },
    12,
    20,
  );
  for (let index = 0; index < teeth; index += 1) {
    const angle = (index / teeth) * PI2;
    addBox(group, mats[materialKey], radius * 0.26, radius * 0.15, 0.19, {
      x: Math.cos(angle) * radius * 0.88,
      y: Math.sin(angle) * radius * 0.88,
      z: 0,
      rz: angle,
    });
  }
  return group;
}

function addWoodTable(
  parent,
  mats,
  x,
  y,
  z,
  width = 3.2,
  depth = 1.1,
  height = 1.1,
  materialKey = "wood",
) {
  addBox(parent, mats[materialKey], width, 0.18, depth, {
    x,
    y: y + height,
    z,
  });
  for (let side of [-1, 1]) {
    addBox(parent, mats[materialKey], 0.18, height, 0.18, {
      x: x + side * (width / 2 - 0.25),
      y: y + height / 2,
      z: z + depth * 0.28,
    });
    addBox(parent, mats[materialKey], 0.18, height, 0.18, {
      x: x + side * (width / 2 - 0.25),
      y: y + height / 2,
      z: z - depth * 0.28,
    });
  }
  addBox(parent, mats.woodGold, width - 0.18, 0.07, 0.08, {
    x,
    y: y + height + 0.12,
    z: z + depth / 2 - 0.04,
  });
}

function addPotPlant(parent, mats, x, y, z, scale = 1, lush = true) {
  addCone(
    parent,
    mats.red,
    0.38 * scale,
    0.58 * scale,
    { x, y: y + 0.29 * scale, z },
    12,
  );
  addCylinder(
    parent,
    mats.woodGold,
    0.38 * scale,
    0.38 * scale,
    0.07 * scale,
    { x, y: y + 0.58 * scale, z },
    12,
  );
  const leaves = lush ? 6 : 4;
  for (let index = 0; index < leaves; index += 1) {
    const angle = (index / leaves) * PI2;
    const leaf = addSphere(
      parent,
      index % 2 ? mats.leaf : mats.leafLight,
      0.24 * scale,
      {
        x: x + Math.cos(angle) * 0.27 * scale,
        y: y + 0.92 * scale + (index % 2) * 0.18 * scale,
        z: z + Math.sin(angle) * 0.2 * scale,
        sx: 1.4,
        sy: 0.42,
        sz: 0.72,
      },
    );
    leaf.rotation.z = Math.cos(angle) * 0.45;
  }
  addCylinder(
    parent,
    mats.green,
    0.06 * scale,
    0.08 * scale,
    0.8 * scale,
    { x, y: y + 0.88 * scale, z },
    8,
  );
}

function addLantern(parent, mats, x, y, z, scale = 1, colorMat = "candle") {
  addCylinder(
    parent,
    mats.brass,
    0.3 * scale,
    0.38 * scale,
    0.08 * scale,
    { x, y: y + 0.55 * scale, z },
    12,
  );
  addCylinder(
    parent,
    mats.brass,
    0.3 * scale,
    0.38 * scale,
    0.08 * scale,
    { x, y: y - 0.55 * scale, z },
    12,
  );
  addBox(parent, mats.brass, 0.07 * scale, 1.08 * scale, 0.07 * scale, {
    x: x - 0.3 * scale,
    y,
    z,
  });
  addBox(parent, mats.brass, 0.07 * scale, 1.08 * scale, 0.07 * scale, {
    x: x + 0.3 * scale,
    y,
    z,
  });
  addBox(parent, mats[colorMat], 0.42 * scale, 0.5 * scale, 0.42 * scale, {
    x,
    y,
    z,
    castShadow: false,
  });
}

function hashLayoutSeed(roomId, layoutSeed) {
  const source = `${roomId}:${layoutSeed == null ? "default" : String(layoutSeed)}`;
  let hash = 2166136261;
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
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

function addScatteredSupport(
  parent,
  mats,
  kind,
  x,
  y,
  z,
  scale = 1,
  rotation = 0,
) {
  const support = new THREE.Group();
  support.name = `room-support-${kind}`;
  support.position.set(x, y, z);
  support.rotation.y = rotation;
  support.scale.setScalar(scale);
  parent.add(support);

  switch (kind) {
    case "lowtable": {
      const height = 0.72;
      addWoodTable(support, mats, 0, -height, 0, 1.48, 0.88, height, "wood");
      addBox(support, mats.woodGold, 1.08, 0.06, 0.08, {
        y: -0.08,
        z: 0.39,
      });
      break;
    }
    case "stool": {
      addCylinder(support, mats.woodLight, 0.46, 0.5, 0.18, { y: -0.09 }, 14);
      for (const angle of [0.2, Math.PI + 0.2]) {
        addCylinder(
          support,
          mats.wood,
          0.065,
          0.085,
          0.68,
          {
            x: Math.cos(angle) * 0.31,
            y: -0.43,
            z: Math.sin(angle) * 0.31,
            rz: Math.cos(angle) * 0.08,
            rx: Math.sin(angle) * 0.08,
          },
          8,
        );
      }
      break;
    }
    case "crate": {
      addBox(support, mats.woodDark, 1.12, 0.62, 0.84, { y: -0.31 });
      addBox(support, mats.woodLight, 1.2, 0.07, 0.08, {
        y: -0.3,
        z: 0.43,
      });
      addBox(support, mats.woodLight, 0.08, 0.54, 0.08, {
        x: -0.48,
        y: -0.31,
        z: 0.43,
      });
      addBox(support, mats.woodLight, 0.08, 0.54, 0.08, {
        x: 0.48,
        y: -0.31,
        z: 0.43,
      });
      break;
    }
    case "rock":
      addSphere(
        support,
        mats.stoneLight,
        0.62,
        {
          y: -0.43,
          sx: 1.1,
          sy: 0.7,
          sz: 0.9,
        },
        12,
        8,
      );
      addSphere(
        support,
        mats.stoneDark,
        0.42,
        {
          x: 0.27,
          y: -0.26,
          z: 0.08,
          sx: 0.95,
          sy: 0.52,
          sz: 0.75,
        },
        10,
        7,
      );
      break;
    default:
      throw new RangeError(`Unknown room support: ${kind}`);
  }
  return support;
}

function createScatteredPositions(roomId, layoutSeed, footprints = []) {
  const random = seededRandom(hashLayoutSeed(roomId, layoutSeed));
  const positions = [];
  const supports = ["lowtable", "crate", "stool", "rock"];
  const cellWidth = SCATTER_LAYOUT.width / SCATTER_COLUMNS;
  const cellHeight = SCATTER_LAYOUT.height / SCATTER_ROWS;
  const strata = [];
  for (let row = 0; row < SCATTER_ROWS; row += 1) {
    for (let column = 0; column < SCATTER_COLUMNS; column += 1) {
      strata.push({
        x: SCATTER_LAYOUT.minX + (column + 0.5) * cellWidth,
        y: SCATTER_LAYOUT.baseY + (row + 0.5) * cellHeight,
      });
    }
  }
  // Keep every band represented but vary which item occupies it. This avoids
  // a visible grid while preventing all of the widest meshes from landing in
  // one part of the room.
  for (let index = strata.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [strata[index], strata[swap]] = [strata[swap], strata[index]];
  }

  // Footprints are measured from the actual scaled item meshes. The support
  // pieces use a conservative extra margin below, so the separation is based
  // on visible geometry rather than one size that happens to fit most items.
  const footprintFor = (index) => {
    const footprint = footprints[index] || {};
    const width = Number.isFinite(Number(footprint.width))
      ? Number(footprint.width)
      : 1.1;
    const height = Number.isFinite(Number(footprint.height))
      ? Number(footprint.height)
      : 1.8;
    return {
      halfWidth: Math.max(width * 0.5 + 0.28, 0.82),
      halfHeight: Math.max(height * 0.5 + 0.32, 0.88),
      offsetY: Number.isFinite(Number(footprint.offsetY))
        ? Number(footprint.offsetY) - 0.26
        : 1.25,
    };
  };

  for (let index = 0; index < TARGET_COUNT; index++) {
    const footprint = footprintFor(index);
    const stratum = strata[index];
    let selected = null;
    let bestScore = -Infinity;
    for (let attempt = 0; attempt < 144; attempt += 1) {
      const x = stratum.x + (random() - 0.5) * cellWidth * 0.72;
      const projectedY = stratum.y + (random() - 0.5) * cellHeight * 0.72;
      const z = SCATTER_LAYOUT.minZ + random() * SCATTER_LAYOUT.depth;
      let clearance = 2;
      for (const previous of positions) {
        const previousFootprint = previous.footprint;
        const horizontalGap =
          footprint.halfWidth + previousFootprint.halfWidth + SCATTER_GAP_X;
        const verticalGap =
          footprint.halfHeight + previousFootprint.halfHeight + SCATTER_GAP_Y;
        // A screen-space rectangle is clear when either axis has enough
        // separation. Normalize both axes so a broad item cannot be packed
        // beside a narrow one merely because their centres are far apart.
        clearance = Math.min(
          clearance,
          Math.max(
            Math.abs(x - previous.x) / horizontalGap,
            Math.abs(projectedY - previous.projectedY) / verticalGap,
          ),
        );
      }
      // Stay close to the assigned stratum so the candidate search adds
      // irregularity without undoing the deliberate whole-canvas coverage.
      const jitter =
        Math.hypot(
          (x - stratum.x) / cellWidth,
          (projectedY - stratum.y) / cellHeight,
        ) * 0.11;
      const score = clearance - jitter + random() * 0.008;
      if (score > bestScore) {
        selected = { x, projectedY, z };
        bestScore = score;
      }
    }

    if (!selected) {
      // The loop above always selects at least one candidate, but retaining a
      // bounded fallback makes malformed footprint data fail soft.
      selected = {
        x: stratum.x,
        projectedY: stratum.y,
        z: SCATTER_LAYOUT.minZ + SCATTER_LAYOUT.depth * 0.5,
      };
    }
    const support = supports[Math.floor(random() * supports.length)];
    positions.push({
      x: selected.x,
      y: selected.projectedY - footprint.offsetY,
      z: selected.z,
      projectedY: selected.projectedY,
      footprint,
      support,
      rotation: (random() - 0.5) * 0.65,
    });
  }
  return positions;
}

function addTargets(root, mats, definitions, roomId, layoutSeed) {
  const targets = [];
  if (definitions.length !== TARGET_COUNT)
    throw new RangeError("Each room must define fifteen foreground objects.");
  const itemIds = new Set(definitions.map((definition) => definition.id));
  const names = new Set(definitions.map((definition) => definition.name));
  if (
    itemIds.size !== TARGET_COUNT ||
    names.size !== TARGET_COUNT ||
    definitions.some(
      (definition) =>
        typeof definition?.id !== "string" ||
        typeof definition?.name !== "string" ||
        typeof definition?.model !== "string",
    )
  )
    throw new RangeError(
      "Each room foreground item must have a unique id and name.",
    );
  const entries = definitions.map((definition) => {
    const model = createMagicalItem(definition);
    model.scale.multiplyScalar(TARGET_MODEL_SCALE);
    model.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(model);
    const size = bounds.getSize(new THREE.Vector3());
    return {
      definition,
      model,
      footprint: {
        width: size.x,
        height: size.y,
        offsetY: (bounds.min.y + bounds.max.y) * 0.5,
      },
    };
  });
  const positions = createScatteredPositions(
    roomId,
    layoutSeed,
    entries.map((entry) => entry.footprint),
  );
  for (let index = 0; index < TARGET_COUNT; index += 1) {
    const { definition, model } = entries[index];
    const label = definition.name;
    const position = positions[index];
    const target = new THREE.Group();
    target.name = label;
    target.index = index;
    target.userData = {
      interactive: true,
      label,
      index,
      itemId: definition.id,
      kind: definition.model,
      variant: definition.variant,
      canon: definition.canon,
      sourceName: definition.sourceName,
      description: definition.description,
      support: position.support,
    };
    target.position.set(position.x, position.y, position.z);
    target.rotation.y = position.rotation;
    // Keep the support under the same interactive root as its item. Besides
    // making the raycast ownership unambiguous, this lets renderer auto-fit
    // include the full visible prop instead of fitting only the floating mesh.
    addScatteredSupport(
      target,
      mats,
      position.support,
      0,
      0,
      0,
      1.03 + (index % 3) * 0.08,
      0,
    );
    target.add(model);
    if (model.userData.clockHands)
      target.userData.clockHands = model.userData.clockHands;
    root.add(target);
    targets.push({ name: label, object: target, index });
  }
  return targets;
}

function createLights(root, themeId, mats, accent) {
  const hemisphere = new THREE.HemisphereLight(0x9ccbd4, 0x1b1420, 1.45);
  hemisphere.position.set(0, 7, 1);
  root.add(hemisphere);
  const moon = new THREE.DirectionalLight(0x8ec3d8, 2.25);
  moon.position.set(-5.5, 9.5, 5.5);
  moon.target.position.set(0, 2, -4);
  moon.castShadow = true;
  moon.shadow.mapSize.set(1024, 1024);
  moon.shadow.camera.near = 0.5;
  moon.shadow.camera.far = 35;
  moon.shadow.camera.left = -11;
  moon.shadow.camera.right = 11;
  moon.shadow.camera.top = 11;
  moon.shadow.camera.bottom = -6;
  root.add(moon, moon.target);
  const warm = new THREE.PointLight(accent, 20, 18, 2);
  warm.position.set(0, 4.1, 1.2);
  warm.castShadow = false;
  root.add(warm);
  const teal = new THREE.PointLight(0x4aafbc, 9, 18, 2);
  teal.position.set(0, 4.8, -6.5);
  teal.castShadow = false;
  root.add(teal);
  const glowLights = [];
  if (themeId === 3 || themeId === 5 || themeId === 10) {
    const candleLight = new THREE.PointLight(accent, 12, 11, 2);
    candleLight.position.set(0, 4.8, -2.3);
    root.add(candleLight);
    glowLights.push(candleLight);
  }
  return { glowLights };
}

const CAMERA_CONFIG = {
  1: { position: [0, 2.6, 8.5], target: [0, 1.5, -1], focus: 8.0 },
  2: { position: [0, 2.92, 8.5], target: [0, 1.95, -1.6], focus: 8.2 },
  3: { position: [0, 3.0, 8.7], target: [0, 2.15, -2.2], focus: 8.3 },
  4: { position: [0, 2.9, 8.4], target: [0, 1.8, -1.8], focus: 8.0 },
  5: { position: [0, 3.1, 8.7], target: [0, 3.1, -3.45], focus: 8.2 },
  6: { position: [0, 3.0, 8.6], target: [0, 2.15, -2.3], focus: 8.1 },
  7: { position: [0, 2.85, 8.5], target: [0, 2.35, -2.8], focus: 8.1 },
  8: { position: [0, 3.05, 8.55], target: [0, 2.15, -2.6], focus: 8.2 },
  9: { position: [0, 3.05, 8.5], target: [0, 2.15, -2.35], focus: 8.0 },
  10: { position: [0, 2.78, 8.5], target: [0, 1.85, -2.3], focus: 8.1 },
};

const BACKGROUNDS = [
  0x10262e, 0x123338, 0x171b31, 0x122b31, 0x121d2b, 0x142936, 0x171b2b,
  0x101f35, 0x1d1c35, 0x172632,
];

export function buildRoomWorld(scene, room, layoutSeed) {
  if (!scene || typeof scene.add !== "function")
    throw new TypeError("buildRoomWorld requires a THREE.Scene");
  if (
    !room ||
    typeof room !== "object" ||
    !/^space-\d{3}$/.test(room.id) ||
    typeof room.name !== "string" ||
    !Number.isInteger(room.themeId) ||
    room.themeId < 1 ||
    room.themeId > 10 ||
    typeof room.description !== "string" ||
    !Array.isArray(room.clues) ||
    room.clues.length !== 3 ||
    typeof room.accent !== "string" ||
    !/^#[0-9a-f]{6}$/i.test(room.accent) ||
    typeof room.image !== "string" ||
    !room.image
  ) {
    throw new TypeError("buildRoomWorld requires a valid room descriptor");
  }
  const themeId = room.themeId;
  const previous = scene.getObjectByName?.("__room-world-root");
  if (previous) {
    previous.userData.disposed = true;
    scene.remove(previous);
  }
  const root = new THREE.Group();
  root.name = "__room-world-root";
  root.userData.roomId = room.id;
  root.userData.themeId = themeId;
  scene.add(root);
  addRearArtwork(root, room);
  const mats = createMaterials();
  scene.background = new THREE.Color(BACKGROUNDS[themeId - 1]);
  scene.fog = new THREE.FogExp2(0x163039, themeId === 4 ? 0.035 : 0.027);
  const lightState = createLights(root, themeId, mats, room.accent);
  const state = {
    clockHands: [],
    pendulum: null,
    glows: [],
    lightState,
  };
  // The generated distant architecture supplies the baked environment detail;
  // only foreground props and their shadows are rendered as close geometry.
  // This prevents duplicate block walls from obscuring the cinematic artwork.
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(30, 30),
    new THREE.ShadowMaterial({ opacity: 0.2 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  root.add(floor);
  const targets = addTargets(
    root,
    mats,
    itemsForRoom(room),
    room.id,
    layoutSeed,
  );
  targets.forEach(({ object }) => {
    if (object.userData.clockHands)
      state.clockHands.push(object.userData.clockHands);
  });
  const cameraConfig = CAMERA_CONFIG[themeId];
  const glowMeshes = [];
  root.traverse((object) => {
    if (object.isMesh && object.material?.emissiveIntensity > 0)
      glowMeshes.push({
        material: object.material,
        base: object.material.emissiveIntensity,
        phase: glowMeshes.length * 0.37,
      });
    if (object.userData?.fireflyPhase != null)
      glowMeshes.push({
        material: object.material,
        base: object.material.emissiveIntensity,
        phase: object.userData.fireflyPhase,
      });
  });
  return {
    root,
    targets,
    tick(seconds) {
      const time = Number.isFinite(Number(seconds)) ? Number(seconds) : 0;
      state.clockHands.forEach(({ minuteHand, hourHand }) => {
        minuteHand.rotation.z = (-time / 3600) * PI2;
        hourHand.rotation.z = (-time / 43200) * PI2;
      });
      if (state.pendulum)
        state.pendulum.rotation.z = Math.sin(time * 1.55) * 0.17;
      glowMeshes.forEach(({ material: targetMaterial, base, phase }) => {
        targetMaterial.emissiveIntensity =
          base * (0.9 + 0.1 * Math.sin(time * 2.05 + phase));
      });
      state.lightState.glowLights.forEach((light, index) => {
        light.intensity = 10.6 + Math.sin(time * 1.8 + index) * 1.4;
      });
    },
    camera: {
      position: [...cameraConfig.position],
      target: [...cameraConfig.target],
    },
    focus: cameraConfig.focus,
  };
}
