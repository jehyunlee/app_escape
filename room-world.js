import * as THREE from "three";

const PI2 = Math.PI * 2;

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

function makeTargetModel(kind, mats) {
  const group = new THREE.Group();
  switch (kind) {
    case "chalkboard":
      addBox(group, mats.woodGold, 1.35, 1.05, 0.1, { y: 0.78, z: 0 });
      addBox(group, mats.green, 1.13, 0.83, 0.08, { y: 0.78, z: 0.07 });
      addBox(group, mats.chalk, 0.07, 0.045, 0.03, {
        x: -0.3,
        y: 0.99,
        z: 0.13,
        rz: -0.16,
      });
      addBox(group, mats.chalk, 0.38, 0.045, 0.03, {
        x: 0.12,
        y: 0.77,
        z: 0.13,
        rz: 0.04,
      });
      addBox(group, mats.chalk, 0.26, 0.045, 0.03, {
        x: -0.16,
        y: 0.58,
        z: 0.13,
        rz: -0.05,
      });
      break;
    case "crystal":
      addCylinder(group, mats.brass, 0.28, 0.38, 0.16, { y: 0.08 }, 12);
      addCone(group, mats.violet, 0.38, 0.95, { y: 0.62, rz: Math.PI / 6 }, 6);
      addSphere(group, mats.tealGlow, 0.13, {
        x: 0.1,
        y: 0.72,
        z: 0.1,
        castShadow: false,
      });
      break;
    case "potion":
      for (let index = 0; index < 3; index += 1) {
        const colors = [mats.violet, mats.tealGlow, mats.red];
        addCylinder(
          group,
          colors[index],
          0.16,
          0.21,
          0.42,
          { x: (index - 1) * 0.3, y: 0.36, z: 0 },
          12,
        );
        addCylinder(
          group,
          mats.glass,
          0.08,
          0.1,
          0.16,
          { x: (index - 1) * 0.3, y: 0.65, z: 0 },
          10,
        );
        addBox(group, mats.woodGold, 0.12, 0.06, 0.12, {
          x: (index - 1) * 0.3,
          y: 0.76,
          z: 0,
        });
      }
      addBox(group, mats.wood, 0.94, 0.1, 0.56, { y: 0.08 });
      break;
    case "desk":
      addWoodTable(group, mats, 0, 0, 0, 1.35, 0.7, 0.72, "wood");
      addBox(group, mats.paper, 0.45, 0.025, 0.3, {
        x: -0.2,
        y: 0.85,
        z: -0.04,
        rz: 0.05,
      });
      addCylinder(
        group,
        mats.brass,
        0.07,
        0.07,
        0.45,
        { x: 0.28, y: 1.04, z: 0, rx: Math.PI / 2 },
        10,
      );
      break;
    case "plant":
      addPotPlant(group, mats, 0, 0, 0, 1.25, true);
      break;
    case "watering":
      addSphere(group, mats.brass, 0.38, {
        x: -0.1,
        y: 0.42,
        z: 0,
        sx: 1.16,
        sy: 0.8,
        sz: 0.84,
      });
      addTorus(
        group,
        mats.brassBright,
        0.32,
        0.07,
        { x: -0.08, y: 0.74, z: 0, rx: Math.PI / 2, rz: Math.PI / 2 },
        10,
        18,
        Math.PI,
      );
      addCone(
        group,
        mats.brass,
        0.14,
        0.64,
        { x: 0.49, y: 0.48, z: 0, rz: -Math.PI / 2 },
        12,
      );
      addCylinder(
        group,
        mats.brass,
        0.17,
        0.17,
        0.08,
        { x: 0.79, y: 0.48, z: 0, rz: Math.PI / 2 },
        12,
      );
      break;
    case "seedbox":
      addBox(group, mats.wood, 1.08, 0.55, 0.72, { y: 0.3 });
      addBox(group, mats.parchment, 0.84, 0.05, 0.5, { y: 0.61, z: -0.01 });
      for (let index = 0; index < 5; index += 1)
        addSphere(group, index % 2 ? mats.red : mats.green, 0.08, {
          x: -0.3 + index * 0.15,
          y: 0.7,
          z: 0.03,
        });
      break;
    case "terrarium":
      addCylinder(group, mats.woodGold, 0.48, 0.56, 0.12, { y: 0.08 }, 16);
      addSphere(group, mats.glass, 0.48, {
        y: 0.52,
        sz: 0.82,
        castShadow: false,
      });
      addCylinder(group, mats.green, 0.05, 0.07, 0.56, { y: 0.48 }, 8);
      addSphere(group, mats.leafLight, 0.18, {
        x: -0.16,
        y: 0.72,
        z: 0.04,
        sx: 1.45,
        sy: 0.42,
        sz: 0.72,
      });
      addSphere(group, mats.leaf, 0.18, {
        x: 0.16,
        y: 0.62,
        z: 0.06,
        sx: 1.4,
        sy: 0.43,
        sz: 0.7,
      });
      break;
    case "goblet":
      addCylinder(group, mats.brass, 0.23, 0.34, 0.25, { y: 0.96 }, 16);
      addCylinder(group, mats.brass, 0.05, 0.05, 0.58, { y: 0.54 }, 12);
      addCylinder(group, mats.brassBright, 0.23, 0.3, 0.08, { y: 0.2 }, 16);
      addSphere(group, mats.red, 0.2, { y: 1.07, castShadow: false });
      break;
    case "floating-candle":
      addCylinder(group, mats.brass, 0.22, 0.28, 0.1, { y: 0.15 }, 12);
      addCylinder(group, mats.candle, 0.12, 0.14, 0.56, { y: 0.48 }, 12);
      addGlow(group, mats, 0, 0.88, 0, 0.1);
      addBox(group, mats.brass, 0.08, 0.22, 0.08, {
        x: -0.26,
        y: 0.74,
        z: 0,
        rz: -0.4,
      });
      break;
    case "banner":
      addCylinder(group, mats.brass, 0.045, 0.045, 1.75, { y: 0.85 }, 8);
      addBox(group, mats.red, 0.96, 1.15, 0.07, { x: 0.34, y: 1.04, z: 0 });
      addCone(
        group,
        mats.red,
        0.32,
        0.4,
        { x: 0.34, y: 0.39, z: 0, rz: Math.PI / 4 },
        4,
      );
      addBox(group, mats.gold, 0.11, 0.7, 0.04, { x: 0.34, y: 1.1, z: 0.06 });
      break;
    case "shield":
      addCylinder(
        group,
        mats.brass,
        0.58,
        0.58,
        0.1,
        { y: 0.75, rx: Math.PI / 2 },
        16,
      );
      addBox(group, mats.red, 0.16, 0.88, 0.04, { y: 0.75, z: 0.1 });
      addBox(group, mats.brassBright, 0.82, 0.12, 0.04, { y: 0.75, z: 0.11 });
      addCone(group, mats.brassBright, 0.24, 0.32, { y: 0.02, z: 0.01 }, 4);
      break;
    case "mushroom":
      addCylinder(group, mats.parchment, 0.16, 0.23, 0.5, { y: 0.28 }, 10);
      addSphere(group, mats.red, 0.48, {
        y: 0.66,
        sx: 1.12,
        sy: 0.55,
        sz: 1.0,
      });
      for (let index = 0; index < 3; index += 1)
        addSphere(group, mats.white, 0.07, {
          x: -0.18 + index * 0.18,
          y: 0.77 + (index % 2) * 0.04,
          z: -0.4,
          castShadow: false,
        });
      break;
    case "firefly-lantern":
      addLantern(group, mats, 0, 0.72, 0, 0.9, "tealGlow");
      addSphere(group, mats.tealGlow, 0.2, {
        x: 0,
        y: 0.72,
        z: 0,
        castShadow: false,
      });
      break;
    case "fern":
      addCylinder(group, mats.green, 0.08, 0.11, 0.85, { y: 0.44 }, 8);
      for (let index = 0; index < 5; index += 1)
        addSphere(group, mats.leafLight, 0.16, {
          x: (index - 2) * 0.16,
          y: 0.52 + Math.abs(index - 2) * 0.11,
          z: 0.02,
          sx: 1.5,
          sy: 0.42,
          sz: 0.72,
        });
      break;
    case "nest":
      addTorus(
        group,
        mats.woodLight,
        0.55,
        0.16,
        { y: 0.28, rx: Math.PI / 2 },
        10,
        22,
      );
      addSphere(group, mats.paper, 0.2, {
        x: -0.18,
        y: 0.42,
        z: 0.02,
        sx: 1.1,
        sy: 0.8,
        sz: 0.85,
      });
      addSphere(group, mats.paper, 0.2, {
        x: 0.2,
        y: 0.42,
        z: 0.02,
        sx: 1.1,
        sy: 0.8,
        sz: 0.85,
      });
      break;
    case "gear":
      addGear(group, mats, 0, 0.77, 0, 0.72, 12, "brass");
      break;
    case "pendulum":
      addBox(group, mats.woodGold, 0.1, 1.3, 0.1, { y: 0.82 });
      addSphere(group, mats.brassBright, 0.3, { y: 0.17 });
      break;
    case "small-clock":
      addCylinder(
        group,
        mats.brass,
        0.62,
        0.62,
        0.14,
        { y: 0.79, rx: Math.PI / 2 },
        24,
      );
      addCylinder(
        group,
        mats.slate,
        0.5,
        0.5,
        0.04,
        { y: 0.79, z: 0.09, rx: Math.PI / 2 },
        24,
      );
      {
        const minuteHand = new THREE.Group();
        const hourHand = new THREE.Group();
        minuteHand.position.y = 0.79;
        hourHand.position.y = 0.79;
        minuteHand.name = "clock-minute-hand";
        hourHand.name = "clock-hour-hand";
        group.add(minuteHand, hourHand);
        addBox(minuteHand, mats.brassBright, 0.06, 0.36, 0.06, {
          y: 0.18,
          z: 0.16,
        });
        addBox(hourHand, mats.brassBright, 0.05, 0.25, 0.05, {
          x: 0.12,
          y: 0.13,
          z: 0.16,
          rz: -0.8,
        });
        group.userData.clockHands = { minuteHand, hourHand };
      }
      break;
    case "owl":
      addSphere(group, mats.stoneLight, 0.44, {
        y: 0.57,
        sx: 0.9,
        sy: 1.15,
        sz: 0.82,
      });
      addSphere(group, mats.stoneLight, 0.34, {
        y: 1.14,
        sx: 1.05,
        sy: 0.96,
        sz: 0.9,
      });
      addSphere(group, mats.black, 0.09, {
        x: -0.13,
        y: 1.19,
        z: 0.29,
        castShadow: false,
      });
      addSphere(group, mats.black, 0.09, {
        x: 0.13,
        y: 1.19,
        z: 0.29,
        castShadow: false,
      });
      addCone(
        group,
        mats.brass,
        0.1,
        0.22,
        { y: 1.03, z: 0.33, rx: Math.PI / 2 },
        4,
      );
      addCone(
        group,
        mats.stoneDark,
        0.23,
        0.4,
        { x: -0.18, y: 1.51, z: 0, rz: 0.2 },
        3,
      );
      addCone(
        group,
        mats.stoneDark,
        0.23,
        0.4,
        { x: 0.18, y: 1.51, z: 0, rz: -0.2 },
        3,
      );
      break;
    case "feather":
      addCylinder(
        group,
        mats.parchment,
        0.035,
        0.055,
        1.4,
        { y: 0.72, rz: -0.24 },
        8,
      );
      for (let index = 0; index < 6; index += 1)
        addSphere(group, index % 2 ? mats.white : mats.paper, 0.11, {
          x: -0.15 + index * 0.06,
          y: 0.98 + index * 0.12,
          z: 0,
          sx: 1.8,
          sy: 0.35,
          sz: 0.42,
        });
      break;
    case "tome":
      addBox(group, mats.red, 1.0, 0.18, 0.7, { y: 0.12, rz: -0.06 });
      addBox(group, mats.paper, 0.92, 0.08, 0.64, { y: 0.26, rz: 0.03 });
      addBox(group, mats.brass, 0.09, 0.04, 0.64, { x: -0.26, y: 0.31, z: 0 });
      addBox(group, mats.brass, 0.09, 0.04, 0.64, { x: 0.26, y: 0.31, z: 0 });
      break;
    case "quill":
      addCylinder(
        group,
        mats.brass,
        0.035,
        0.055,
        1.15,
        { y: 0.61, rz: -0.32 },
        8,
      );
      for (let index = 0; index < 5; index += 1)
        addSphere(group, mats.leafLight, 0.09, {
          x: -0.13 + index * 0.06,
          y: 0.88 + index * 0.12,
          z: 0,
          sx: 1.7,
          sy: 0.34,
          sz: 0.4,
        });
      addCylinder(group, mats.ink, 0.16, 0.2, 0.2, { y: 0.1 }, 12);
      break;
    case "lamp":
      addCylinder(group, mats.brass, 0.23, 0.27, 0.12, { y: 0.12 }, 12);
      addCylinder(group, mats.brass, 0.07, 0.07, 0.6, { y: 0.45 }, 10);
      addCone(group, mats.parchment, 0.4, 0.38, { y: 0.8 }, 16);
      addGlow(group, mats, 0, 1.02, 0, 0.09);
      break;
    case "telescope":
      addCylinder(
        group,
        mats.brass,
        0.28,
        0.32,
        1.45,
        { x: 0, y: 1.07, z: 0, rz: Math.PI / 2, ry: 0.2 },
        16,
      );
      addCylinder(
        group,
        mats.tealGlow,
        0.2,
        0.22,
        0.08,
        { x: 0.73, y: 1.22, z: 0, rz: Math.PI / 2 },
        16,
      );
      addCylinder(group, mats.brass, 0.08, 0.09, 0.88, { y: 0.48 }, 10);
      addBox(group, mats.brass, 1.0, 0.08, 0.08, { y: 0.08 });
      addCylinder(
        group,
        mats.brass,
        0.08,
        0.08,
        0.7,
        { x: -0.38, y: 0.28, z: 0, rz: -0.45 },
        10,
      );
      addCylinder(
        group,
        mats.brass,
        0.08,
        0.08,
        0.7,
        { x: 0.38, y: 0.28, z: 0, rz: 0.45 },
        10,
      );
      break;
    case "armillary":
      addCylinder(group, mats.brass, 0.07, 0.07, 0.76, { y: 0.42 }, 12);
      addTorus(
        group,
        mats.brassBright,
        0.54,
        0.045,
        { y: 0.84, rx: Math.PI / 2 },
        12,
        26,
      );
      addTorus(
        group,
        mats.brass,
        0.4,
        0.04,
        { y: 0.84, rx: 0.42, rz: 0.3 },
        12,
        26,
      );
      addSphere(group, mats.star, 0.14, { y: 0.84, castShadow: false });
      break;
    case "starmap":
      addBox(group, mats.slate, 1.22, 0.08, 0.88, { y: 0.12, rz: 0.04 });
      for (let index = 0; index < 7; index += 1)
        addSphere(group, mats.star, 0.05 + (index % 2) * 0.025, {
          x: -0.4 + ((index * 0.13) % 0.8),
          y: 0.2,
          z: -0.25 + (index % 3) * 0.2,
          castShadow: false,
        });
      addBox(group, mats.brass, 0.04, 0.02, 0.55, {
        x: -0.15,
        y: 0.21,
        z: -0.04,
        rz: 0.45,
      });
      break;
    case "portrait":
      addBox(group, mats.woodGold, 1.05, 1.35, 0.12, { y: 0.82 });
      addBox(group, mats.portrait, 0.78, 1.08, 0.08, { y: 0.82, z: 0.08 });
      addSphere(group, mats.parchment, 0.19, {
        y: 1.08,
        z: 0.15,
        sx: 0.8,
        sy: 1.1,
        sz: 0.35,
        castShadow: false,
      });
      addBox(group, mats.red, 0.38, 0.28, 0.04, { y: 0.68, z: 0.16, sx: 1.1 });
      break;
    case "stair-lever":
      addCylinder(group, mats.brass, 0.24, 0.3, 0.12, { y: 0.08 }, 12);
      addCylinder(
        group,
        mats.iron,
        0.08,
        0.1,
        0.92,
        { y: 0.55, rz: -0.25 },
        10,
      );
      addSphere(group, mats.brassBright, 0.16, { x: 0.13, y: 0.99, z: 0 });
      break;
    case "compass":
      addCylinder(group, mats.brass, 0.52, 0.56, 0.12, { y: 0.34 }, 20);
      addCylinder(group, mats.slate, 0.42, 0.44, 0.03, { y: 0.42 }, 20);
      addCone(
        group,
        mats.red,
        0.09,
        0.62,
        { y: 0.49, z: -0.08, rz: Math.PI / 2 },
        4,
      );
      addBox(group, mats.brassBright, 0.07, 0.62, 0.04, {
        x: 0,
        y: 0.49,
        z: -0.12,
        rz: 0.75,
      });
      break;
    case "gate-key":
      addTorus(group, mats.brassBright, 0.28, 0.075, { y: 0.91 }, 12, 20);
      addBox(group, mats.brass, 0.12, 0.78, 0.1, { y: 0.42 });
      addBox(group, mats.brass, 0.36, 0.1, 0.1, { x: 0.13, y: 0.19 });
      addBox(group, mats.brass, 0.28, 0.1, 0.1, { x: 0.1, y: 0.4 });
      break;
    case "sconce":
      addBox(group, mats.iron, 0.12, 0.7, 0.12, { y: 0.48 });
      addCylinder(group, mats.brass, 0.25, 0.3, 0.1, { y: 0.14 }, 12);
      addGlow(group, mats, 0, 0.44, 0, 0.11);
      break;
    case "gargoyle":
      addSphere(group, mats.stoneLight, 0.44, {
        y: 0.52,
        sx: 1.1,
        sy: 0.8,
        sz: 0.9,
      });
      addCone(
        group,
        mats.stoneLight,
        0.35,
        0.55,
        { x: -0.26, y: 1.02, z: 0, rz: 0.4 },
        4,
      );
      addCone(
        group,
        mats.stoneLight,
        0.35,
        0.55,
        { x: 0.26, y: 1.02, z: 0, rz: -0.4 },
        4,
      );
      addSphere(group, mats.red, 0.06, {
        x: -0.15,
        y: 0.6,
        z: -0.39,
        castShadow: false,
      });
      addSphere(group, mats.red, 0.06, {
        x: 0.15,
        y: 0.6,
        z: -0.39,
        castShadow: false,
      });
      break;
    default:
      throw new RangeError(`Unknown room object: ${kind}`);
  }
  return group;
}

function createScatteredPositions(roomId, layoutSeed) {
  const random = seededRandom(hashLayoutSeed(roomId, layoutSeed));
  const positions = [];
  const supports = ["lowtable", "crate", "stool", "rock"];
  // Best-candidate sampling spreads objects without rows or columns. The
  // fixed candidate budget makes layouts deterministic and bounded.
  for (let index = 0; index < 20; index++) {
    let selected;
    let bestDistance = -1;
    for (let attempt = 0; attempt < 96; attempt++) {
      const x = -4.7 + random() * 9.4;
      const projectedY = 0.9 + random() * 11.8;
      const z = -4 + random() * 6;
      const candidate = { x, y: projectedY + z * 0.11, z };
      const distance = positions.length
        ? Math.min(
            ...positions.map((previous) =>
              Math.hypot(
                x - previous.x,
                projectedY - (previous.y - previous.z * 0.11),
              ),
            ),
          )
        : 1;
      if (distance > bestDistance) {
        selected = candidate;
        bestDistance = distance;
      }
      if (!positions.length) break;
    }
    positions.push({
      ...selected,
      support: supports[Math.floor(random() * supports.length)],
      rotation: (random() - 0.5) * 0.65,
    });
  }
  return positions;
}

function addTargets(root, mats, definitions, roomId, layoutSeed) {
  const targets = [];
  const baseDefinitions = definitions.slice(0, 4);
  const positions = createScatteredPositions(roomId, layoutSeed);
  for (let index = 0; index < 20; index += 1) {
    const definition = baseDefinitions[index % baseDefinitions.length];
    const label = `${definition.label}${Math.floor(index / baseDefinitions.length) + 1}`;
    const position = positions[index];
    const target = new THREE.Group();
    target.name = label;
    target.index = index;
    target.userData = {
      interactive: true,
      label,
      index,
      kind: definition.kind,
      support: position.support,
    };
    target.position.set(position.x, position.y, position.z);
    target.rotation.y = position.rotation;
    addScatteredSupport(
      root,
      mats,
      position.support,
      position.x,
      position.y,
      position.z,
      0.9 + (index % 3) * 0.07,
      position.rotation,
    );
    const model = makeTargetModel(definition.kind, mats);
    // The room contains many more foreground props than before.  Keep the
    // visual models compact while the renderer supplies generous hit buttons.
    model.scale.setScalar(0.78);
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

const ROOM_OBJECTS = [
  [
    ["고서", "tome"],
    ["수정구", "crystal"],
    ["물약병", "potion"],
    ["작은 책상", "desk"],
  ],
  [
    ["화분", "plant"],
    ["물뿌리개", "watering"],
    ["씨앗 상자", "seedbox"],
    ["유리 화분", "terrarium"],
  ],
  [
    ["황금 잔", "goblet"],
    ["촛대", "floating-candle"],
    ["기숙사 깃발", "banner"],
    ["문장 방패", "shield"],
  ],
  [
    ["버섯", "mushroom"],
    ["반딧불 등불", "firefly-lantern"],
    ["양치식물", "fern"],
    ["새 둥지", "nest"],
  ],
  [
    ["탁상시계", "small-clock"],
    ["황동 톱니", "gear"],
    ["시계추", "pendulum"],
    ["황동 촛대", "sconce"],
  ],
  [
    ["부엉이 조각", "owl"],
    ["깃털", "feather"],
    ["새 둥지", "nest"],
    ["작은 초상화", "portrait"],
  ],
  [
    ["고서", "tome"],
    ["깃펜과 잉크", "quill"],
    ["독서 램프", "lamp"],
    ["서랍 열쇠", "gate-key"],
  ],
  [
    ["천체 망원경", "telescope"],
    ["천구의", "armillary"],
    ["별자리 지도", "starmap"],
    ["관측 램프", "lamp"],
  ],
  [
    ["초상화", "portrait"],
    ["계단 레버", "stair-lever"],
    ["나침반", "compass"],
    ["난간 방패", "shield"],
  ],
  [
    ["성문 열쇠", "gate-key"],
    ["문장 방패", "shield"],
    ["횃불", "sconce"],
    ["수호상", "gargoyle"],
  ],
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
    gears: [],
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
    ROOM_OBJECTS[themeId - 1].map(([label, kind]) => ({ label, kind })),
    room.id,
    layoutSeed,
  );
  targets.forEach(({ object }) => {
    if (object.userData.clockHands)
      state.clockHands.push(object.userData.clockHands);
    if (object.userData.kind === "gear") {
      const gear = object.children[0]?.children[0];
      if (gear) state.gears.push({ gear, speed: 0.045 });
    }
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
      state.gears.forEach(({ gear, speed }) => {
        gear.rotation.z = time * speed;
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
