import * as THREE from "three";

/*
 * The foreground objects deliberately use small, independent geometries.
 * Room teardown walks each group and disposes every geometry and material, so
 * there is no shared cache to keep alive between rooms.
 */
function makeMaterial(color, options = {}) {
  let resolved;
  try {
    resolved = new THREE.Color(color || 0x8f7352);
  } catch {
    resolved = new THREE.Color(0x8f7352);
  }
  return new THREE.MeshStandardMaterial({
    color: resolved,
    roughness: options.roughness ?? 0.72,
    metalness: options.metalness ?? 0.12,
    emissive: options.emissive ?? 0x000000,
    emissiveIntensity: options.emissiveIntensity ?? 0,
    transparent: options.transparent ?? false,
    opacity: options.opacity ?? 1,
    side: options.side ?? THREE.FrontSide,
  });
}

function place(object, transform = {}) {
  object.position.set(transform.x ?? 0, transform.y ?? 0, transform.z ?? 0);
  object.rotation.set(transform.rx ?? 0, transform.ry ?? 0, transform.rz ?? 0);
  object.scale.set(transform.sx ?? 1, transform.sy ?? 1, transform.sz ?? 1);
  object.castShadow = transform.castShadow ?? true;
  object.receiveShadow = transform.receiveShadow ?? true;
  return object;
}

function mesh(parent, geometry, material, transform = {}) {
  const object = place(new THREE.Mesh(geometry, material), transform);
  parent.add(object);
  return object;
}

function box(parent, material, width, height, depth, transform = {}) {
  return mesh(
    parent,
    new THREE.BoxGeometry(width, height, depth),
    material,
    transform,
  );
}

function cylinder(
  parent,
  material,
  radiusTop,
  radiusBottom,
  height,
  transform = {},
  segments = 16,
) {
  return mesh(
    parent,
    new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments),
    material,
    transform,
  );
}

function sphere(
  parent,
  material,
  radius,
  transform = {},
  widthSegments = 20,
  heightSegments = 12,
) {
  return mesh(
    parent,
    new THREE.SphereGeometry(radius, widthSegments, heightSegments),
    material,
    transform,
  );
}

function cone(parent, material, radius, height, transform = {}, segments = 16) {
  return mesh(
    parent,
    new THREE.ConeGeometry(radius, height, segments),
    material,
    transform,
  );
}

function torus(
  parent,
  material,
  radius,
  tube,
  transform = {},
  radialSegments = 12,
  tubularSegments = 28,
  arc = Math.PI * 2,
) {
  return mesh(
    parent,
    new THREE.TorusGeometry(
      radius,
      tube,
      radialSegments,
      tubularSegments,
      transform.arc ?? arc,
    ),
    material,
    transform,
  );
}

function addGem(parent, material, x, y, z, size = 0.1) {
  return cone(parent, material, size, size * 1.8, { x, y, z }, 6);
}

function makeMaterials(def) {
  const base = makeMaterial(def.color, { roughness: 0.7 });
  const accent = makeMaterial(def.accent || def.color, {
    roughness: 0.46,
    metalness: 0.42,
  });
  const dark = makeMaterial(def.color, { roughness: 0.86, metalness: 0.05 });
  const glow = makeMaterial(def.accent || def.color, {
    roughness: 0.28,
    metalness: 0.18,
    emissive: def.accent || def.color || 0x5dc9d0,
    emissiveIntensity: 1.3,
  });
  const paper = makeMaterial(0xd7c29a, { roughness: 0.94, metalness: 0 });
  return { base, accent, dark, glow, paper };
}

function addWings(group, mats, y = 1.05, scale = 1) {
  const wing = (side) => {
    const root = new THREE.Group();
    root.position.set(side * 0.28 * scale, y, 0);
    root.rotation.z = side * 0.2;
    group.add(root);
    box(root, mats.accent, 0.52 * scale, 0.1 * scale, 0.08 * scale, {
      x: side * 0.25 * scale,
      y: 0.08 * scale,
      rz: side * 0.22,
    });
    box(root, mats.base, 0.42 * scale, 0.08 * scale, 0.07 * scale, {
      x: side * 0.3 * scale,
      y: 0.22 * scale,
      rz: side * 0.38,
    });
    box(root, mats.accent, 0.3 * scale, 0.07 * scale, 0.06 * scale, {
      x: side * 0.27 * scale,
      y: 0.34 * scale,
      rz: side * 0.5,
    });
  };
  wing(-1);
  wing(1);
}

function addVariantSilhouette(group, mats, variant) {
  const value = String(variant || "").toLowerCase();
  if (value.includes("wing")) addWings(group, mats, 1.18, 0.85);
  if (value.includes("ornate")) {
    torus(group, mats.accent, 0.46, 0.035, { y: 1.15, rx: Math.PI / 2 });
    addGem(group, mats.glow, -0.2, 1.3, 0.08, 0.09);
    addGem(group, mats.glow, 0.2, 1.3, 0.08, 0.09);
  }
  if (value.includes("tall")) group.scale.set(0.9, 1.2, 0.9);
  else if (value.includes("slender")) group.scale.set(0.78, 1.24, 0.78);
  else if (value.includes("wide")) group.scale.set(1.2, 0.9, 1.2);
}

function makeBook(group, m) {
  box(group, m.dark, 1.12, 0.18, 0.76, { y: 0.14, rz: -0.05 });
  box(group, m.paper, 1.02, 0.12, 0.67, { y: 0.28, rz: 0.04 });
  box(group, m.accent, 0.08, 0.05, 0.76, { x: -0.32, y: 0.34 });
  box(group, m.accent, 0.08, 0.05, 0.76, { x: 0.32, y: 0.34 });
  box(group, m.glow, 0.22, 0.05, 0.32, { y: 0.36, z: 0.02 });
}

function makeScroll(group, m) {
  cylinder(group, m.paper, 0.23, 0.23, 1.12, {
    y: 0.55,
    rz: Math.PI / 2,
  });
  cylinder(group, m.accent, 0.27, 0.27, 0.08, {
    x: -0.56,
    y: 0.55,
    rz: Math.PI / 2,
  });
  cylinder(group, m.accent, 0.27, 0.27, 0.08, {
    x: 0.56,
    y: 0.55,
    rz: Math.PI / 2,
  });
  box(group, m.glow, 0.1, 0.66, 0.04, { y: 0.55, z: 0.24, rz: 0.2 });
}

function makeQuill(group, m) {
  cylinder(
    group,
    m.accent,
    0.035,
    0.055,
    1.55,
    {
      x: 0.03,
      y: 0.84,
      rz: -0.32,
    },
    8,
  );
  for (let index = 0; index < 7; index += 1) {
    sphere(
      group,
      index % 2 ? m.paper : m.base,
      0.1,
      {
        x: -0.2 + index * 0.065,
        y: 1.15 + index * 0.12,
        z: 0.01,
        sx: 1.8,
        sy: 0.34,
        sz: 0.5,
        rz: -0.2,
      },
      12,
      8,
    );
  }
  cylinder(group, m.dark, 0.2, 0.24, 0.22, { y: 0.12 }, 14);
  torus(group, m.accent, 0.21, 0.025, { y: 0.24 });
}

function makeCauldron(group, m) {
  sphere(group, m.dark, 0.62, { y: 0.6, sx: 1.08, sy: 0.78, sz: 1.08 });
  torus(group, m.accent, 0.56, 0.075, { y: 0.94, rx: Math.PI / 2 });
  sphere(group, m.glow, 0.42, {
    y: 0.92,
    sy: 0.12,
    castShadow: false,
  });
  [-0.38, 0.38].forEach((x) => {
    cylinder(group, m.accent, 0.09, 0.12, 0.5, { x, y: 0.08 }, 10);
    torus(group, m.accent, 0.33, 0.045, { x, y: 0.7, rx: 0, ry: Math.PI / 2 });
  });
  addGem(group, m.glow, 0, 1.02, 0, 0.1);
}

function makeWand(group, m) {
  cylinder(group, m.base, 0.05, 0.08, 1.52, { y: 0.75, rz: -0.64 }, 10);
  cylinder(
    group,
    m.accent,
    0.11,
    0.12,
    0.46,
    {
      x: -0.48,
      y: 0.42,
      rz: -0.64,
    },
    10,
  );
  torus(group, m.glow, 0.13, 0.025, { x: -0.48, y: 0.42, rz: Math.PI / 2 });
  sphere(group, m.glow, 0.09, { x: 0.57, y: 1.48, castShadow: false });
}

function makeBroom(group, m) {
  cylinder(group, m.base, 0.045, 0.07, 1.85, { y: 0.95, rz: -0.58 }, 10);
  cylinder(
    group,
    m.accent,
    0.22,
    0.34,
    0.68,
    {
      x: -0.63,
      y: 0.37,
      rz: -0.58,
    },
    12,
  );
  for (let index = -2; index <= 2; index += 1) {
    box(group, m.dark, 0.1, 0.52, 0.1, {
      x: -0.74 + index * 0.12,
      y: 0.2,
      z: 0,
      rz: index * 0.08,
    });
  }
  torus(group, m.glow, 0.22, 0.025, {
    x: -0.59,
    y: 0.62,
    rx: Math.PI / 2,
    rz: -0.58,
  });
}

function makeSnitch(group, m) {
  sphere(group, m.accent, 0.25, { y: 0.92 });
  torus(group, m.glow, 0.18, 0.025, { y: 0.92, rx: Math.PI / 2 });
  addWings(group, m, 0.94, 1.4);
}

function makeQuaffle(group, m) {
  sphere(group, m.base, 0.55, { y: 0.62, sx: 1.05, sy: 1.05, sz: 1.05 });
  torus(group, m.accent, 0.49, 0.035, { y: 0.62, rx: Math.PI / 2 });
  torus(group, m.accent, 0.49, 0.035, { y: 0.62, ry: Math.PI / 2 });
}

function makeBludger(group, m) {
  sphere(group, m.dark, 0.54, { y: 0.62 });
  for (let index = 0; index < 3; index += 1) {
    torus(group, m.accent, 0.49, 0.04, {
      y: 0.62,
      rx: Math.PI / 2,
      rz: index * 0.45,
    });
  }
  addGem(group, m.glow, 0, 0.63, 0.5, 0.08);
}

function makeMirror(group, m) {
  box(group, m.accent, 1.05, 1.55, 0.12, { y: 0.83 });
  box(group, m.dark, 0.78, 1.26, 0.1, { y: 0.83, z: 0.08 });
  box(group, m.glow, 0.11, 1.28, 0.06, { x: -0.45, y: 0.83, z: 0.16 });
  box(group, m.glow, 0.11, 1.28, 0.06, { x: 0.45, y: 0.83, z: 0.16 });
  torus(group, m.accent, 0.18, 0.03, { y: 1.22, z: 0.18 });
  box(group, m.dark, 0.72, 0.08, 0.4, { y: 0.03 });
}

function makeHat(group, m) {
  torus(group, m.accent, 0.63, 0.11, { y: 0.24, rx: Math.PI / 2 });
  cone(group, m.base, 0.43, 1.25, { y: 0.84 }, 16);
  // Two tapered sections make a clearly bent Sorting Hat tip rather than a
  // mathematically perfect cone.
  cone(group, m.base, 0.22, 0.58, { x: 0.18, y: 1.65, rz: -0.34 }, 14);
  sphere(group, m.accent, 0.12, { x: 0.35, y: 1.9, sx: 1.5, sy: 0.8, sz: 0.9 });
  box(group, m.glow, 0.08, 0.48, 0.08, {
    x: -0.27,
    y: 0.84,
    z: 0.32,
    rz: 0.14,
  });
}

function makeClock(group, m) {
  cylinder(group, m.accent, 0.7, 0.7, 0.14, { y: 0.84, rx: Math.PI / 2 }, 24);
  cylinder(
    group,
    m.paper,
    0.56,
    0.56,
    0.04,
    { y: 0.84, z: 0.09, rx: Math.PI / 2 },
    24,
  );
  torus(group, m.glow, 0.62, 0.035, { y: 0.84, rx: Math.PI / 2 });
  const minuteHand = new THREE.Group();
  const hourHand = new THREE.Group();
  minuteHand.position.y = 0.84;
  hourHand.position.y = 0.84;
  minuteHand.name = "clock-minute-hand";
  hourHand.name = "clock-hour-hand";
  group.add(minuteHand, hourHand);
  box(minuteHand, m.dark, 0.045, 0.44, 0.04, { y: 0.22, z: 0.15 });
  box(hourHand, m.dark, 0.06, 0.3, 0.05, {
    x: 0.11,
    y: 0.15,
    z: 0.16,
    rz: -0.72,
  });
  sphere(group, m.accent, 0.07, { y: 0.84, z: 0.17 });
  group.userData.clockHands = { minuteHand, hourHand };
}

function makePensieve(group, m) {
  torus(group, m.accent, 0.67, 0.12, { y: 0.65, rx: Math.PI / 2 });
  sphere(group, m.dark, 0.67, { y: 0.58, sy: 0.34 });
  sphere(group, m.glow, 0.52, { y: 0.71, sy: 0.08, castShadow: false });
  for (const x of [-0.4, 0.4])
    cylinder(group, m.accent, 0.09, 0.12, 0.48, { x, y: 0.12 }, 10);
  torus(group, m.glow, 0.32, 0.035, { y: 0.86, rx: Math.PI / 2 });
}

function makeCabinet(group, m) {
  box(group, m.dark, 1.1, 1.75, 0.58, { y: 0.94 });
  box(group, m.accent, 0.49, 1.52, 0.07, { x: -0.27, y: 0.94, z: 0.32 });
  box(group, m.base, 0.49, 1.52, 0.07, { x: 0.27, y: 0.94, z: 0.32 });
  for (const y of [0.53, 1.35]) {
    torus(group, m.glow, 0.07, 0.025, {
      x: -0.07,
      y,
      z: 0.38,
      rx: Math.PI / 2,
    });
    torus(group, m.glow, 0.07, 0.025, { x: 0.07, y, z: 0.38, rx: Math.PI / 2 });
  }
  box(group, m.accent, 1.22, 0.08, 0.68, { y: 1.84 });
}

function makeGoblet(group, m) {
  sphere(group, m.base, 0.4, { y: 1.1, sy: 0.65, sx: 1.16, sz: 1.16 });
  torus(group, m.accent, 0.35, 0.045, { y: 1.08, rx: Math.PI / 2 });
  cylinder(group, m.accent, 0.06, 0.06, 0.72, { y: 0.58 }, 12);
  cylinder(group, m.accent, 0.32, 0.4, 0.09, { y: 0.2 }, 16);
  cone(group, m.glow, 0.15, 0.4, { y: 1.55 }, 12);
  sphere(group, m.glow, 0.08, { y: 1.77, castShadow: false });
}

function makeTrunk(group, m) {
  box(group, m.dark, 1.28, 0.68, 0.9, { y: 0.4 });
  box(group, m.base, 1.12, 0.18, 0.82, { y: 0.83, rz: -0.06 });
  box(group, m.accent, 0.09, 0.82, 0.08, { x: -0.37, y: 0.48, z: 0.46 });
  box(group, m.accent, 0.09, 0.82, 0.08, { x: 0.37, y: 0.48, z: 0.46 });
  box(group, m.glow, 0.24, 0.1, 0.08, { y: 0.4, z: 0.5 });
  for (const x of [-0.47, 0.47]) {
    torus(group, m.accent, 0.1, 0.03, { x, y: 0.78, z: 0.47, rx: Math.PI / 2 });
  }
}

function makeBottle(group, m) {
  cylinder(group, m.glow, 0.29, 0.38, 0.66, { y: 0.5 }, 16);
  cylinder(group, m.base, 0.13, 0.17, 0.35, { y: 0.98 }, 14);
  cylinder(group, m.accent, 0.14, 0.14, 0.1, { y: 1.2 }, 12);
  torus(group, m.accent, 0.29, 0.03, { y: 0.73, rx: Math.PI / 2 });
  box(group, m.paper, 0.28, 0.22, 0.03, { y: 0.46, z: 0.34, rz: 0.04 });
}

function makeEnvelope(group, m) {
  box(group, m.paper, 1.16, 0.06, 0.82, { y: 0.3, rz: -0.04 });
  box(group, m.accent, 0.08, 0.05, 0.72, { y: 0.34, z: 0.02 });
  box(group, m.accent, 0.95, 0.05, 0.07, { y: 0.34, z: 0.29, rz: 0.12 });
  cone(group, m.base, 0.22, 0.45, { y: 0.55, z: 0.01, rx: Math.PI / 2 }, 4);
  torus(group, m.glow, 0.1, 0.025, { y: 0.34, z: 0.42, rx: Math.PI / 2 });
}

function makeCoin(group, m) {
  cylinder(group, m.accent, 0.52, 0.52, 0.12, { y: 0.56, rx: Math.PI / 2 }, 24);
  torus(group, m.glow, 0.42, 0.035, { y: 0.56, z: 0.08, rx: Math.PI / 2 });
  sphere(group, m.base, 0.17, { y: 0.56, z: 0.1, sx: 1, sy: 0.4, sz: 0.3 });
}

function makeLantern(group, m) {
  cylinder(group, m.accent, 0.43, 0.48, 0.1, { y: 0.12 }, 16);
  cylinder(group, m.glow, 0.34, 0.34, 0.78, { y: 0.56 }, 16);
  for (const angle of [0, Math.PI / 2, Math.PI, (Math.PI * 3) / 2]) {
    box(group, m.accent, 0.08, 0.76, 0.08, {
      x: Math.cos(angle) * 0.37,
      y: 0.56,
      z: Math.sin(angle) * 0.37,
    });
  }
  cone(group, m.accent, 0.47, 0.2, { y: 1.04 }, 12);
  torus(group, m.accent, 0.27, 0.04, { y: 1.27, rx: Math.PI / 2 });
}

function makeOrb(group, m) {
  sphere(group, m.glow, 0.48, { y: 0.92, castShadow: false });
  torus(group, m.accent, 0.63, 0.045, { y: 0.92, rx: 0.35, rz: 0.2 });
  torus(group, m.base, 0.59, 0.04, { y: 0.92, rx: -0.35, rz: -0.2 });
  cylinder(group, m.accent, 0.28, 0.38, 0.16, { y: 0.17 }, 14);
}

function makeChess(group, m) {
  cylinder(group, m.accent, 0.42, 0.52, 0.14, { y: 0.1 }, 16);
  cylinder(group, m.base, 0.24, 0.34, 0.62, { y: 0.46 }, 14);
  cone(group, m.base, 0.32, 0.56, { y: 1.02 }, 12);
  sphere(group, m.glow, 0.15, { y: 1.38 });
  torus(group, m.accent, 0.3, 0.035, { y: 0.8, rx: Math.PI / 2 });
}

function makeRadio(group, m) {
  box(group, m.dark, 1.22, 0.72, 0.52, { y: 0.48 });
  box(group, m.base, 0.72, 0.34, 0.06, { y: 0.52, z: 0.29 });
  for (let index = -2; index <= 2; index += 1)
    box(group, m.accent, 0.07, 0.2, 0.04, {
      x: index * 0.12,
      y: 0.52,
      z: 0.34,
      rz: index * 0.15,
    });
  for (const x of [-0.42, 0.42])
    cylinder(
      group,
      m.glow,
      0.1,
      0.1,
      0.08,
      { x, y: 0.97, z: 0.3, rx: Math.PI / 2 },
      12,
    );
  cylinder(
    group,
    m.accent,
    0.025,
    0.04,
    0.86,
    { x: 0.38, y: 1.23, rz: -0.18 },
    8,
  );
}

function makeRibbon(group, m) {
  torus(group, m.base, 0.52, 0.09, {
    y: 0.72,
    rx: Math.PI / 2,
    arc: Math.PI * 1.35,
  });
  box(group, m.accent, 0.16, 0.84, 0.08, { x: -0.28, y: 0.35, rz: 0.22 });
  box(group, m.base, 0.16, 0.84, 0.08, { x: 0.28, y: 0.35, rz: -0.22 });
  torus(group, m.glow, 0.2, 0.045, { y: 0.72, z: 0.04, rx: Math.PI / 2 });
}

function makeSword(group, m) {
  box(group, m.glow, 0.16, 1.55, 0.09, { y: 1.02, rz: 0.04 });
  cone(group, m.glow, 0.14, 0.34, { y: 1.97, rz: 0.04 }, 4);
  box(group, m.accent, 0.84, 0.12, 0.12, { y: 0.43 });
  cylinder(group, m.base, 0.08, 0.08, 0.56, { y: 0.12 }, 10);
  sphere(group, m.accent, 0.14, { y: -0.2 });
  torus(group, m.accent, 0.1, 0.025, { y: 0.43, rx: Math.PI / 2 });
}

function makeTwinLensGadget(group, m) {
  // The Omniculars silhouette is deliberately a pair of optical barrels,
  // rather than a generic cube. It is selected by the gadget variant.
  for (const x of [-0.29, 0.29]) {
    cylinder(
      group,
      m.base,
      0.2,
      0.24,
      0.9,
      { x, y: 0.92, rz: Math.PI / 2 },
      16,
    );
    cylinder(
      group,
      m.glow,
      0.16,
      0.16,
      0.08,
      { x: x + 0.46, y: 0.92, rz: Math.PI / 2 },
      16,
    );
    torus(group, m.accent, 0.21, 0.035, { x, y: 0.92, rx: Math.PI / 2 });
  }
  box(group, m.accent, 0.34, 0.12, 0.16, { y: 0.92 });
  box(group, m.dark, 0.12, 0.42, 0.14, { y: 0.34, z: -0.06, rz: 0.22 });
}

function makeGadget(group, m, variant) {
  const value = String(variant || "").toLowerCase();
  if (
    value.includes("twin") ||
    value.includes("omni") ||
    value.includes("binoc")
  ) {
    makeTwinLensGadget(group, m);
    return;
  }
  box(group, m.dark, 0.9, 0.65, 0.54, { y: 0.5 });
  cylinder(
    group,
    m.glow,
    0.22,
    0.25,
    0.12,
    { y: 0.62, z: 0.31, rx: Math.PI / 2 },
    16,
  );
  torus(group, m.accent, 0.27, 0.035, { y: 0.62, z: 0.39, rx: Math.PI / 2 });
  cylinder(group, m.accent, 0.04, 0.06, 0.7, { x: 0.3, y: 1.08, rz: -0.16 }, 8);
  box(group, m.base, 0.5, 0.08, 0.12, { y: 0.94 });
}

function makeCarpet(group, m) {
  box(group, m.base, 1.55, 0.08, 0.9, { y: 0.16, rz: 0.06 });
  box(group, m.accent, 1.14, 0.035, 0.48, { y: 0.22, z: 0.02 });
  for (const x of [-0.72, -0.48, 0.48, 0.72])
    box(group, m.glow, 0.06, 0.1, 0.18, { x, y: 0.08, z: 0.52 });
  torus(group, m.accent, 0.18, 0.025, { y: 0.23, rx: Math.PI / 2 });
}

function makeCamera(group, m) {
  box(group, m.dark, 0.92, 0.72, 0.62, { y: 0.6 });
  cylinder(
    group,
    m.glow,
    0.28,
    0.33,
    0.2,
    { z: 0.38, y: 0.62, rx: Math.PI / 2 },
    18,
  );
  torus(group, m.accent, 0.31, 0.04, { z: 0.49, y: 0.62, rx: Math.PI / 2 });
  cylinder(group, m.accent, 0.12, 0.12, 0.72, { x: -0.37, y: 0.98 }, 12);
  box(group, m.base, 0.35, 0.1, 0.18, { x: 0.2, y: 1.02 });
}

function makeKnife(group, m) {
  box(group, m.glow, 0.12, 1.3, 0.09, { y: 1.0, rz: 0.12 });
  cone(group, m.glow, 0.12, 0.34, { x: 0.08, y: 1.81, rz: 0.12 }, 4);
  box(group, m.base, 0.18, 0.58, 0.13, { x: -0.18, y: 0.15, rz: 0.12 });
  box(group, m.accent, 0.64, 0.1, 0.15, { x: -0.1, y: 0.48, rz: 0.12 });
  sphere(group, m.accent, 0.1, { x: -0.18, y: -0.2 });
}

function makeTent(group, m) {
  cone(group, m.base, 0.88, 1.35, { y: 0.82, rz: Math.PI / 4 }, 4);
  box(group, m.accent, 0.1, 0.7, 0.04, { y: 0.42, z: 0.88 });
  box(group, m.glow, 0.42, 0.08, 0.05, { y: 0.62, z: 0.89 });
  box(group, m.dark, 0.14, 0.12, 0.14, { y: 0.14 });
}

const BUILDERS = {
  book: makeBook,
  scroll: makeScroll,
  quill: makeQuill,
  cauldron: makeCauldron,
  wand: makeWand,
  broom: makeBroom,
  snitch: makeSnitch,
  quaffle: makeQuaffle,
  bludger: makeBludger,
  mirror: makeMirror,
  hat: makeHat,
  clock: makeClock,
  pensieve: makePensieve,
  cabinet: makeCabinet,
  goblet: makeGoblet,
  trunk: makeTrunk,
  bottle: makeBottle,
  envelope: makeEnvelope,
  coin: makeCoin,
  lantern: makeLantern,
  orb: makeOrb,
  chess: makeChess,
  radio: makeRadio,
  ribbon: makeRibbon,
  sword: makeSword,
  gadget: makeGadget,
  carpet: makeCarpet,
  camera: makeCamera,
  knife: makeKnife,
  tent: makeTent,
};

export function createMagicalItem(definition) {
  if (!definition || typeof definition !== "object")
    throw new TypeError("createMagicalItem requires an item definition");
  const model = String(definition.model || "");
  const builder = BUILDERS[model];
  if (!builder) throw new RangeError(`Unknown magical item model: ${model}`);
  const group = new THREE.Group();
  group.name = String(definition.name || definition.id || model);
  group.userData.itemId = definition.id;
  group.userData.model = model;
  group.userData.variant = definition.variant;
  const materials = makeMaterials(definition);
  builder(group, materials, definition.variant);
  addVariantSilhouette(group, materials, definition.variant);
  return group;
}

export const magicalItemModels = Object.freeze(Object.keys(BUILDERS));
