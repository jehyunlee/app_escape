import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import * as THREE from "three";
import { buildRoomWorld } from "../room-world.js";
import { avatarMarkup, catalog } from "../avatar.js";
import { rooms } from "../rooms.js";
import { STARTER } from "../engine.js";
import {
  characters,
  portraitMarkup,
  wizardPortraitMarkup,
} from "../characters.js";

test("each room has distinct GPT-generated WebP artwork and generation provenance", () => {
  const images = new Set();
  for (const room of rooms) {
    const image = readFileSync(new URL(`../${room.image}`, import.meta.url));
    const metadata = JSON.parse(
      readFileSync(
        new URL(`../assets/spaces/${room.id}.json`, import.meta.url),
        "utf8",
      ),
    );
    assert.equal(image.subarray(0, 4).toString(), "RIFF");
    assert.equal(image.subarray(8, 12).toString(), "WEBP");
    assert.ok(image.length > 10000);
    assert.match(metadata.model, /^gpt-image-/);
    assert.equal(metadata.file, `${room.id}.webp`);
    assert.equal(metadata.roomId, room.id);
    assert.ok(metadata.prompt.length > 500);
    images.add(createHash("sha256").update(image).digest("hex"));
  }
  assert.equal(images.size, 200);
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
      new Set(world.targets.map((target) => target.object.userData.kind)).size,
      15,
    );
    for (const target of world.targets)
      assert.doesNotMatch(target.name, /\d+$/);
    const artwork = scene.getObjectByName(`room-artwork-${room.id}`);
    assert.ok(artwork.isMesh);
    assert.ok(artwork.userData.asset.endsWith(`/${room.id}.webp`));
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
    rooms.find((room) => room.themeId === 5),
  );
  const hands = world.targets[0].object.userData.clockHands;
  world.tick(0);
  const initial = hands.minuteHand.rotation.z;
  world.tick(60);
  assert.notEqual(hands.minuteHand.rotation.z, initial);
  assert.ok(Math.abs(hands.minuteHand.rotation.z + Math.PI / 30) < 0.0001);
});

test("scattered objects have no shared rows and are reproducible only for the same seed", () => {
  for (const level of [1, 5, 8]) {
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

test("576 pose-specific garment layers exist and preserve protected face areas", () => {
  const report = JSON.parse(
    readFileSync(
      new URL("../assets/garments/fit-report.json", import.meta.url),
      "utf8",
    ),
  ).coverage;
  const manifest = JSON.parse(
    readFileSync(
      new URL("../assets/garments/manifest.json", import.meta.url),
      "utf8",
    ),
  );
  assert.match(manifest.model, /^gpt-image-/);
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
  assert.equal(count, 576);
});
