import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import * as THREE from "three";
import { buildRoomWorld } from "../room-world.js";
import { spreadRoomTargets } from "../room-renderer.js";
import { avatarMarkup, catalog } from "../avatar.js";
import { rooms, facilities } from "../rooms.js";
import { magicalItems, itemsForRoom } from "../magical-items.js";
import { STARTER } from "../engine.js";
import {
  characters,
  portraitMarkup,
  wizardPortraitMarkup,
} from "../characters.js";

test("physical objects fill the viewport aspect without overlapping projected footprints", () => {
  for (const facility of facilities) {
    const room = rooms.find((room) => room.facilityId === facility.id);
    const world = buildRoomWorld(new THREE.Scene(), room, 734);
    const forward = new THREE.Vector3(...world.camera.position)
      .sub(new THREE.Vector3(...world.camera.target))
      .normalize();
    const right = new THREE.Vector3(0, 1, 0).cross(forward).normalize();
    const up = forward.clone().cross(right).normalize();
    for (const aspect of [0.5, 1, 1.6, 2]) {
      spreadRoomTargets(world.targets, forward, aspect);
      const rects = world.targets.map(({ object }) => {
        object.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(object),
          center = box.getCenter(new THREE.Vector3()),
          size = box.getSize(new THREE.Vector3());
        return {
          x: center.dot(right),
          y: center.dot(up),
          halfX:
            (Math.abs(right.x) * size.x +
              Math.abs(right.y) * size.y +
              Math.abs(right.z) * size.z) /
            2,
          halfY:
            (Math.abs(up.x) * size.x +
              Math.abs(up.y) * size.y +
              Math.abs(up.z) * size.z) /
            2,
        };
      });
      const width =
          Math.max(...rects.map((r) => r.x)) -
          Math.min(...rects.map((r) => r.x)),
        height =
          Math.max(...rects.map((r) => r.y)) -
          Math.min(...rects.map((r) => r.y));
      assert.ok(
        Math.abs(width / height - aspect) < 1e-6,
        `${room.id}: spread must follow viewport`,
      );
      for (let i = 0; i < rects.length; i++)
        for (let j = i + 1; j < rects.length; j++) {
          const a = rects[i],
            b = rects[j];
          assert.ok(
            Math.abs(a.x - b.x) >= a.halfX + b.halfX ||
              Math.abs(a.y - b.y) >= a.halfY + b.halfY,
            `${room.id}: overlapping ${i}/${j}`,
          );
        }
    }
    spreadRoomTargets(world.targets, forward, 1.6);
    const original = world.targets.map((t) => t.object.position.toArray());
    spreadRoomTargets(world.targets, forward, 0.5);
    spreadRoomTargets(world.targets, forward, 1.6);
    assert.deepEqual(
      world.targets.map((t) => t.object.position.toArray()),
      original,
      "resizing must not accumulate layout distortion",
    );
    world.dispose?.();
  }
});

test("each Hogwarts facility has distinct GPT-generated artwork and provenance", () => {
  const images = new Set();
  for (const facility of facilities) {
    const image = readFileSync(
      new URL(`../assets/hogwarts/${facility.id}.webp`, import.meta.url),
    );
    const metadata = JSON.parse(
      readFileSync(
        new URL(`../assets/hogwarts/${facility.id}.json`, import.meta.url),
        "utf8",
      ),
    );
    assert.equal(image.subarray(0, 4).toString(), "RIFF");
    assert.equal(image.subarray(8, 12).toString(), "WEBP");
    assert.ok(image.length > 10000);
    assert.match(metadata.model, /^gpt-image-/);
    assert.equal(metadata.file, `${facility.id}.webp`);
    assert.equal(metadata.roomId, facility.id);
    assert.ok(metadata.prompt.length > 500);
    images.add(createHash("sha256").update(image).digest("hex"));
  }
  assert.equal(images.size, 40);
});

test("wardrobe selections retain generated art and apply selective tint or accessory layers", () => {
  assert.equal(new Set(catalog.map((item) => item.id)).size, catalog.length);
  for (const category of Object.keys(STARTER)) {
    const items = catalog.filter((item) => item.category === category);
    assert.ok(items.length >= 4);
    assert.equal(items.filter((item) => item.price === 0).length, 1);
    const renders = new Set();
    for (const item of items) {
      assert.ok(Number.isSafeInteger(item.price) && item.price >= 0);
      const html = avatarMarkup({ ...STARTER, [category]: item.id }, "dad");
      assert.ok(html.includes("dad-neutral.webp"));
      assert.ok(html.includes(`data-${category}="${item.id}"`));
      if (item.price > 0) {
        assert.ok(html.includes(item.color));
        assert.ok(html.includes(item.id));
      }
      renders.add(html);
    }
    assert.equal(renders.size, items.length);
  }
  assert.ok(
    !avatarMarkup({ hat: "<script>alert(1)</script>" }, "dad").includes(
      "<script>",
    ),
  );
  assert.throws(() => avatarMarkup(STARTER, "unknown"), RangeError);
});

test("200 3D rooms pair their artwork with fifteen independently selectable meshes", () => {
  for (const room of rooms) {
    const scene = new THREE.Scene();
    const world = buildRoomWorld(scene, room);
    assert.equal(world.targets.length, 15);
    assert.equal(new Set(world.targets.map((target) => target.name)).size, 15);
    assert.equal(
      new Set(world.targets.map((target) => target.object.userData.itemId))
        .size,
      15,
    );
    for (const target of world.targets) {
      assert.ok(
        magicalItems.some(
          (item) =>
            item.id === target.object.userData.itemId &&
            item.name === target.name,
        ),
      );
      const item = magicalItems.find(
        (item) => item.id === target.object.userData.itemId,
      );
      const model = target.object.children.find(
        (child) => child.userData.itemId === item.id,
      );
      assert.ok(model);
      if (item.variant === "wide")
        assert.ok(
          model.scale.x > model.scale.y,
          "wide variation survives room scaling",
        );
      if (item.variant === "tall" || item.variant === "slender")
        assert.ok(
          model.scale.y > model.scale.x,
          "tall variation survives room scaling",
        );
    }
    const artwork = scene.getObjectByName(`room-artwork-${room.id}`);
    assert.ok(artwork.isMesh);
    assert.ok(artwork.userData.asset.endsWith(`/${room.facilityId}.webp`));
    assert.equal(artwork.castShadow, false);
    assert.equal(artwork.receiveShadow, false);
    for (const target of world.targets) {
      let meshes = 0;
      target.object.traverse((object) => {
        if (object.isMesh) meshes++;
      });
      assert.ok(meshes > 0, target.name);
      assert.ok(target.object.userData.interactive);
      assert.ok(!new THREE.Box3().setFromObject(target.object).isEmpty());
    }
    assert.ok(world.focus > 0);
    world.tick(10);
    world.dispose?.();
    scene.traverse((object) => {
      object.geometry?.dispose();
      if (Array.isArray(object.material))
        object.material.forEach((material) => material.dispose());
      else object.material?.dispose();
      object.shadow?.dispose();
    });
  }
  assert.throws(() => buildRoomWorld(new THREE.Scene(), 11), TypeError);
  assert.throws(
    () => buildRoomWorld(new THREE.Scene(), { ...rooms[0], themeId: 11 }),
    TypeError,
  );
});

test("magical object selections fit facilities and distinguish documented items from variations", () => {
  const ids = new Map(magicalItems.map((item) => [item.id, item]));
  assert.equal(ids.size, magicalItems.length);
  for (const item of magicalItems) {
    assert.ok(item.sourceName && item.sourceUrl.includes("namu.wiki"));
    if (!item.canon) {
      assert.ok(
        ids.get(item.variantOf)?.canon,
        `${item.id} needs an original basis`,
      );
      assert.notEqual(
        item.variant,
        "plain",
        `${item.id} needs a visible variation`,
      );
      assert.ok(
        item.description.includes("게임"),
        `${item.id} must label its adaptation`,
      );
    }
  }
  for (const facility of facilities) {
    const choices = itemsForRoom(
      rooms.find((room) => room.facilityId === facility.id),
    );
    assert.equal(choices.length, 15);
    assert.equal(new Set(choices.map((item) => item.id)).size, 15);
    assert.equal(new Set(choices.map((item) => item.name)).size, 15);
  }
  const at = (name) =>
    itemsForRoom(rooms.find((room) => room.facilityName === name));
  for (const model of ["broom", "snitch", "quaffle", "bludger"])
    assert.ok(
      at("퀴디치 경기장").some((item) => item.model === model),
      model,
    );
  assert.ok(at("마법약 교실").some((item) => item.model === "cauldron"));
  assert.ok(
    at("온실").some((item) => item.model === "cauldron" && !item.canon),
  );
  assert.ok(at("도서관").some((item) => item.model === "book"));
  assert.ok(!at("금지된 숲").some((item) => item.id === "item-hand-of-glory"));
});

test("every category has twelve distinct illustrated products from 1 to 100 GOLD", () => {
  const paid = catalog.filter((item) => item.price > 0);
  assert.equal(paid.length, 96);
  const hashes = new Set();
  for (const category of Object.keys(STARTER)) {
    const items = paid.filter((item) => item.category === category);
    assert.equal(items.length, 12);
    assert.deepEqual(
      items.map((item) => item.price),
      [1, 3, 5, 8, 12, 18, 26, 38, 52, 68, 84, 100],
    );
    assert.equal(new Set(items.map((item) => item.designPrompt)).size, 12);
    for (const item of items) {
      const thumbnail = readFileSync(
        new URL(`../assets/shop-items/${item.id}.webp`, import.meta.url),
      );
      const original = readFileSync(
        new URL(`../assets/shop-designs/${item.id}.webp`, import.meta.url),
      );
      assert.equal(thumbnail.subarray(8, 12).toString(), "WEBP");
      assert.equal(original.subarray(8, 12).toString(), "WEBP");
      hashes.add(createHash("sha256").update(original).digest("hex"));
    }
  }
  assert.equal(hashes.size, 96);
});

test("family portraits use distinct generated head crops and named wizard designs", () => {
  const portraits = characters.map((character) => portraitMarkup(character.id));
  assert.equal(new Set(portraits).size, 6);
  for (const [index, portrait] of portraits.entries()) {
    assert.ok(portrait.includes(`${characters[index].id}-portrait.webp`));
    assert.ok(portrait.includes(characters[index].title));
    const asset = readFileSync(
      new URL(
        `../assets/wizards/${characters[index].id}-portrait.webp`,
        import.meta.url,
      ),
    );
    assert.equal(asset.subarray(8, 12).toString(), "WEBP");
  }
  const appearances = characters.map((character) =>
    avatarMarkup(STARTER, character.id),
  );
  assert.equal(new Set(appearances).size, 6);
  assert.equal(new Set(characters.map((character) => character.title)).size, 6);
});

test("clock hands and gears animate on actual 3D foreground objects", () => {
  const world = buildRoomWorld(
    new THREE.Scene(),
    rooms.find((room) =>
      itemsForRoom(room).some((item) => item.model === "clock"),
    ),
  );
  const hands = world.targets.find(
    (target) => target.object.userData.clockHands,
  ).object.userData.clockHands;
  world.tick(0);
  const initial = hands.minuteHand.rotation.z;
  world.tick(60);
  assert.notEqual(hands.minuteHand.rotation.z, initial);
  assert.ok(Math.abs(hands.minuteHand.rotation.z + Math.PI / 30) < 0.0001);
});

test("scattered objects have no shared rows and are reproducible only for the same seed", () => {
  for (const level of [1, 4, 8]) {
    const positions = (seed) =>
      buildRoomWorld(
        new THREE.Scene(),
        rooms.find((room) => room.themeId === level),
        seed,
      ).targets.map((target) => target.object.position.toArray());
    const first = positions(12345);
    assert.deepEqual(first, positions(12345));
    const other = positions(67890);
    assert.ok(
      first.some(
        (position, index) =>
          new THREE.Vector3(...position).distanceTo(
            new THREE.Vector3(...other[index]),
          ) > 1,
      ),
    );
    for (const axis of [0, 1, 2])
      assert.ok(
        new Set(first.map((position) => position[axis].toFixed(2))).size >= 12,
      );
    for (let index = 0; index < first.length; index++) {
      for (let next = index + 1; next < first.length; next++) {
        assert.ok(
          new THREE.Vector3(...first[index]).distanceTo(
            new THREE.Vector3(...first[next]),
          ) > 0.7,
        );
      }
    }
  }
});

test("all six wizards use separate generated full-body expressions", () => {
  const hashes = new Set();
  for (const character of characters) {
    const portrait = wizardPortraitMarkup(character.id, STARTER);
    assert.ok(portrait.includes(`${character.id}-neutral.webp`));
    assert.ok(portrait.includes('viewBox="0 0 512 1024"'));
    const metadata = JSON.parse(
      readFileSync(
        new URL(`../assets/wizards/${character.id}.json`, import.meta.url),
        "utf8",
      ),
    );
    assert.match(metadata.model, /^gpt-image-/);
    for (const mood of ["neutral", "happy", "sad"]) {
      const html = avatarMarkup(STARTER, character.id, mood);
      assert.ok(html.includes(`${character.id}-${mood}.webp`));
      assert.ok(html.includes(`data-mood="${mood}"`));
      const asset = readFileSync(
        new URL(
          `../assets/wizards/${character.id}-${mood}.webp`,
          import.meta.url,
        ),
      );
      assert.equal(asset.subarray(8, 12).toString(), "WEBP");
      hashes.add(createHash("sha256").update(asset).digest("hex"));
    }
  }
  assert.equal(hashes.size, 18);
});

test("all eight categories can be equipped together without losing character or mood", () => {
  const outfit = Object.fromEntries(
    Object.keys(STARTER).map((category) => [
      category,
      catalog.find((item) => item.category === category && item.price === 1).id,
    ]),
  );
  for (const character of characters)
    for (const mood of ["neutral", "happy", "sad"]) {
      const html = avatarMarkup(outfit, character.id, mood);
      assert.ok(html.includes(`${character.id}-${mood}.webp`));
      for (const [category, id] of Object.entries(outfit))
        assert.ok(html.includes(`data-${category}="${id}"`));
    }
});

test("1728 pose-specific garment layers exist and preserve protected face areas", () => {
  const report = JSON.parse(
    readFileSync(
      new URL("../assets/garments/fit-report.json", import.meta.url),
      "utf8",
    ),
  ).files;
  const manifest = JSON.parse(
    readFileSync(
      new URL("../assets/garments/manifest.json", import.meta.url),
      "utf8",
    ),
  );
  assert.equal(manifest.sourceDirectory, "assets/shop-designs");
  assert.equal(manifest.items, 96);
  assert.equal(manifest.files, 1728);
  const sourceManifest = JSON.parse(
    readFileSync(
      new URL("../assets/shop-designs/manifest.json", import.meta.url),
      "utf8",
    ),
  );
  assert.match(sourceManifest.model, /^gpt-image-/);
  let count = 0;
  for (const character of characters)
    for (const mood of ["neutral", "happy", "sad"])
      for (const item of catalog.filter((item) => item.price > 0)) {
        const file = `${character.id}-${mood}-${item.id}.webp`;
        const bytes = readFileSync(
          new URL(`../assets/garments/${file}`, import.meta.url),
        );
        assert.equal(bytes.subarray(8, 12).toString(), "WEBP");
        assert.ok(report[file].pixels >= 40, file);
        assert.equal(report[file].faceOverlap, 0, file);
        assert.deepEqual(report[file].size, [512, 1024]);
        count++;
      }
  assert.equal(count, 1728);
});

test("custom hats use prepared bases rather than destructive SVG face cutouts", () => {
  for (const character of characters)
    for (const mood of ["neutral", "happy", "sad"]) {
      const file = `${character.id}-${mood}-hatless.webp`;
      const bytes = readFileSync(
        new URL(`../assets/garments/${file}`, import.meta.url),
      );
      assert.equal(bytes.subarray(8, 12).toString(), "WEBP");
      const html = avatarMarkup(
        { ...STARTER, hat: "hat-01" },
        character.id,
        mood,
      );
      assert.ok(html.includes(file));
      assert.ok(!html.includes("feMorphology"));
      assert.ok(!avatarMarkup(STARTER, character.id, mood).includes(file));
    }
});
