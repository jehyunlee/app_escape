import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import {
  avatarMarkup,
  avatarLayers,
  catalog,
  STARTER_OUTFIT,
  RENDER_ORDER,
} from "../avatar.js";
import { characters, wizardPortraitMarkup } from "../characters.js";

const json = (path) =>
  JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));
const rig = json("../assets/doll/rigged/runtime.json");
const proof = json("../assets/doll/rigged/verification.json");
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const outfit = (price) =>
  Object.fromEntries(
    Object.keys(STARTER_OUTFIT).map((category) => [
      category,
      catalog.find((item) => item.category === category && item.price === price)
        .id,
    ]),
  );

test("runtime layers match actual verified raster files, not stale acceptance flags", () => {
  assert.equal(rig.schema, "paper-doll-rig-v2");
  assert.equal(proof.schema, "paper-doll-pixel-checks-v2");
  assert.deepEqual(proof.failures, []);
  for (const [file, entry] of Object.entries(rig.files)) {
    const bytes = readFileSync(
      new URL("../assets/doll/" + file, import.meta.url),
    );
    assert.equal(bytes.subarray(8, 12).toString(), "WEBP", file);
    assert.equal(hash(bytes), entry.sha256, file);
    assert.equal(
      proof.files[file]?.sha256,
      entry.sha256,
      `${file}: pixel verification must be current`,
    );
    assert.equal(proof.files[file].width, entry.width);
    assert.equal(proof.files[file].height, entry.height);
    assert.ok(proof.files[file].opaquePixels > 0, file);
  }
  assert.equal(proof.checks.nativeHandsInBody, 0);
  assert.equal(proof.checks.nativeTrousersInBody, 0);
  assert.equal(proof.checks.bootsPixelsAbove1320, 0);
  assert.equal(proof.checks.starterPantsHandFragments, 0);
  for (const [file, check] of Object.entries(proof.checks.gloves)) {
    assert.equal(check.outsideHandRegions, 0, file);
    assert.ok(check.leftPixels > 100 && check.rightPixels > 100, file);
  }
});

test("wearing a hat replaces the whole head and hairstyle instead of layering over free hair", () => {
  const hats = catalog.filter((item) => item.category === "hat");
  for (const character of characters)
    for (const mood of ["neutral", "happy", "sad"])
      for (const hat of hats) {
        const eq = { ...STARTER_OUTFIT, hat: hat.id };
        const layers = avatarLayers(eq, character.id, mood);
        const heads = layers.filter((layer) => layer.kind === "head");
        assert.equal(heads.length, 1);
        assert.equal(heads[0].category, "hat");
        assert.equal(heads[0].itemId, hat.id);
        if (hat.price > 0) {
          assert.equal(
            heads[0].file,
            `headwear/${character.id}-${mood}-${hat.id}.webp`,
          );
          assert.ok(!layers.some((layer) => layer.file.endsWith("-bare.webp")));
        }
        assert.ok(
          !layers.some((layer) => ["face", "hair"].includes(layer.kind)),
          "no original free hairstyle is stacked under a hat",
        );
        const html = avatarMarkup(eq, character.id, mood);
        const view = html
          .match(/viewBox="([^"]+)"/)[1]
          .split(" ")
          .map(Number);
        for (const layer of layers) {
          assert.ok(view[0] <= layer.bbox[0] && view[1] <= layer.bbox[1]);
          assert.ok(
            view[0] + view[2] >= layer.bbox[2] &&
              view[1] + view[3] >= layer.bbox[3],
            "tall hats must not be cropped",
          );
        }
      }
});

test("all expressions use the same body, two hand anchors and non-head equipment", () => {
  for (const character of characters)
    for (const eq of [STARTER_OUTFIT, outfit(1), outfit(100)]) {
      const normal = avatarLayers(eq, character.id, "neutral");
      const geometry = normal.filter((layer) => layer.kind !== "head");
      for (const mood of ["neutral", "happy", "sad"]) {
        const layers = avatarLayers(eq, character.id, mood);
        assert.deepEqual(
          layers.filter((layer) => layer.kind !== "head"),
          geometry,
          "success/failure cannot add or move arms",
        );
        assert.equal(layers.filter((layer) => layer.kind === "body").length, 1);
        assert.equal(
          layers.filter((layer) => layer.kind === "hands").length,
          1,
        );
        const handIndex = layers.findIndex((layer) => layer.kind === "hands");
        for (const kind of ["wand"]) {
          const i = layers.findIndex((layer) => layer.kind === kind);
          if (i >= 0)
            assert.ok(
              i < handIndex,
              "fingers wrap in front of the lower handle",
            );
        }
        const gripIndex = layers.findIndex(
          (layer) => layer.kind === "wand-grip",
        );
        assert.ok(
          gripIndex > handIndex,
          "the continuous upper shaft emerges in front of the hand from its finger opening",
        );
        assert.equal(
          layers[gripIndex].file,
          rig.files[layers.find((layer) => layer.kind === "wand").file]
            .gripLayer,
        );
        const broom = layers.findIndex((layer) => layer.kind === "broom");
        if (broom >= 0) {
          assert.ok(
            broom < layers.findIndex((layer) => layer.kind === "body"),
            "back-carried broom is behind the torso",
          );
          assert.ok(
            broom < layers.findIndex((layer) => layer.kind === "pants"),
            "back-carried broom is behind the lower body",
          );
        }
        const ordered = layers.map((layer) => RENDER_ORDER.indexOf(layer.kind));
        assert.deepEqual(
          ordered,
          [...ordered].sort((a, b) => a - b),
        );
        const html = wizardPortraitMarkup(character.id, eq, mood);
        assert.ok(html.includes("paper-doll-rig-v2"));
        assert.ok(!html.includes("feMorphology"));
        assert.ok(!html.includes("assets/wizards/"));
      }
    }
});

test("every wand uses its own finger-opening foreground with every glove", () => {
  const wands = catalog.filter((item) => item.category === "wand");
  const gloves = catalog.filter((item) => item.category === "gloves");
  for (const wand of wands)
    for (const glove of gloves) {
      const layers = avatarLayers(
        { ...STARTER_OUTFIT, wand: wand.id, gloves: glove.id },
        "dad",
      );
      const back = layers.find((layer) => layer.kind === "wand");
      const front = layers.find((layer) => layer.kind === "wand-grip");
      assert.ok(front, `${wand.id}/${glove.id}`);
      assert.equal(front.file, rig.files[back.file].gripLayer);
      assert.equal(
        layers.filter((layer) => layer.kind === "wand-grip").length,
        1,
      );
      assert.ok(
        layers.indexOf(front) >
          layers.findIndex((layer) => layer.kind === "hands"),
      );
      assert.equal(
        layers.filter((layer) => layer.category === "wand").length,
        1,
        "split rendering still represents one equipped wand",
      );
    }
});

test("a purchased garment removes its default part rather than covering another outfit", () => {
  for (const character of characters)
    for (const item of catalog.filter((item) => item.price > 0)) {
      const defaults = avatarLayers(STARTER_OUTFIT, character.id);
      const layers = avatarLayers(
        { ...STARTER_OUTFIT, [item.category]: item.id },
        character.id,
      );
      const selected = layers.filter(
        (layer) => layer.category === item.category,
      );
      assert.equal(selected.length, 1, `${character.id}/${item.id}`);
      assert.equal(selected[0].itemId, item.id);
      const original = defaults.find(
        (layer) => layer.category === item.category,
      );
      if (original)
        assert.ok(
          !layers.some((layer) => layer.file === original.file),
          `${item.id}: old ${item.category} must be removed`,
        );
      if (item.category === "pants")
        assert.ok(
          !layers.some((layer) => layer.file === "rigged/starter-pants.webp"),
        );
      if (item.category === "gloves")
        assert.ok(
          !layers.some((layer) => layer.file === "rigged/hands-base.webp"),
        );
    }
});

test("every character starts without decorative clothes and with plain starter equipment", () => {
  for (const character of characters) {
    const layers = avatarLayers(STARTER_OUTFIT, character.id);
    assert.ok(
      !layers.some((layer) =>
        ["cloak", "necklace", "vest"].includes(layer.kind),
      ),
    );
    assert.equal(
      layers.find((layer) => layer.kind === "head").file,
      `headwear/${character.id}-neutral-bare.webp`,
    );
    assert.equal(
      layers.find((layer) => layer.kind === "hands").file,
      "rigged/hands-base.webp",
    );
    assert.equal(
      layers.find((layer) => layer.kind === "pants").file,
      "rigged/starter-pants.webp",
    );
    assert.equal(
      layers.find((layer) => layer.kind === "wand").file,
      "rigged/wand-base.webp",
    );
  }
  for (const category of ["hat", "necklace", "cloak", "gloves", "vest"])
    assert.equal(
      catalog.find((item) => item.id === `${category}-base`).name,
      "착용 안 함",
    );
});

test("props and jewellery retain object-only OpenAI source provenance", () => {
  const accessories = json("../assets/doll/rigged/accessories.json");
  for (const [file, entry] of Object.entries(accessories)) {
    const source = readFileSync(new URL("../" + entry.source, import.meta.url));
    assert.equal(hash(source), entry.sourceSha256, file);
    assert.match(entry.method, /isolated.*product/);
    const measured = proof.checks.accessories[file];
    if (file.startsWith("wand-")) {
      assert.deepEqual(entry.transform.targetGripStart, [289, 884]);
      assert.equal(entry.transform.sourceOrientationDegrees, 0, file);
      assert.equal(
        entry.transform.shaftPixelsErased,
        0,
        "do not erase a shaft to hide wrist intersection",
      );
      assert.equal(measured.forearmOverlapPixels, 0, file);
      assert.ok(
        measured.gripAlpha >= 180,
        `${file}: fingers must grasp solid handle material`,
      );
      assert.ok(measured.frontGripAlpha >= 180, file);
      assert.ok(
        measured.frontReachesUpperShaft,
        "a disconnected patch on the knuckles is not a held shaft",
      );
      assert.equal(measured.partitionAlphaErrorPixels, 0, file);
      assert.equal(measured.partitionColourErrorPixels, 0, file);
      assert.equal(measured.frontMaskLeakPixels, 0, file);
      assert.equal(
        measured.unpartitionedSha256,
        hash(
          readFileSync(
            new URL(
              `../assets/doll/rigged/${entry.transform.frontLayer.unpartitionedProof.file}`,
              import.meta.url,
            ),
          ),
        ),
      );
      assert.equal(
        rig.files[`rigged/${file}`].gripLayer,
        `rigged/${entry.gripLayer.file}`,
      );
    }
    if (file.startsWith("broom-")) {
      assert.equal(entry.transform.layer, "back-prop-before-body");
      const top = entry.transform.handleTipTarget,
        bottom = entry.transform.predictedBristleBottom;
      assert.ok(
        top[0] > 600 && top[1] < 469,
        "handle above viewer-right shoulder",
      );
      assert.ok(
        bottom[0] < 400 && bottom[1] > 1350,
        "bristles below viewer-left side",
      );
      assert.equal(entry.transform.lengthScale, 1.25);
      assert.equal(entry.transform.aspectRatioPreserved, true);
      assert.equal(
        measured.opaqueEdgePixels,
        0,
        `${file}: keep whole broom visible`,
      );
    }
    if (file.startsWith("necklace-")) {
      assert.equal(measured.rearArcVisiblePixels, 0, file);
      assert.ok(
        measured.frontPixels > 100,
        "do not erase the pendant with the rear chain",
      );
      const mask = readFileSync(
        new URL(
          `../assets/doll/rigged/${entry.transform.occlusion.mask}`,
          import.meta.url,
        ),
      );
      assert.equal(
        hash(mask),
        measured.maskSha256,
        "occlusion evidence matches the actual mask",
      );
    }
  }
  assert.equal(Object.keys(accessories).length, 38);
});

test("every paid appearance and shop image belongs to the reviewed new collection", () => {
  const shop = json("../assets/shop-items/manifest.json");
  const clothing = json("../assets/doll/rigged/clothing/manifest.json");
  const gloves = json("../assets/doll/rigged/gloves/manifest.json");
  const paid = catalog.filter((item) => item.price > 0);
  assert.equal(Object.keys(shop.publishedThumbnails).length, paid.length);
  for (const item of paid) {
    const filename = `${item.id}.webp`;
    const thumbnail = shop.publishedThumbnails[filename];
    assert.equal(
      hash(
        readFileSync(
          new URL(`../assets/shop-items/${filename}`, import.meta.url),
        ),
      ),
      thumbnail.sha256,
    );
    const master = `scripts/art-sources/field-wardrobe/designs/${filename}`;
    const masterHash = hash(
      readFileSync(new URL(`../${master}`, import.meta.url)),
    );
    assert.equal(thumbnail.source, master);
    if (item.category === "hat") {
      for (const character of characters) {
        const record = json(
          `../assets/doll/headwear/${character.id}-${item.id}.json`,
        );
        assert.equal(
          record.status,
          "visual-review-passed",
          `${character.id}/${item.id}`,
        );
        assert.equal(record.sources.product.sha256, masterHash);
        for (const [file, raster] of Object.entries(record.files))
          assert.equal(raster.sha256, rig.files[`headwear/${file}`].sha256);
      }
    } else if (item.category === "gloves") {
      const record = gloves.files[item.id];
      assert.equal(record.visualStatus, "passed", item.id);
      assert.equal(record.sources.product.sha256, masterHash);
      assert.equal(
        record.sha256,
        rig.files[`rigged/gloves/${filename}`].sha256,
      );
    } else if (["cloak", "vest", "pants"].includes(item.category)) {
      const record = clothing.items[item.id];
      assert.equal(record.review, "visual-review-passed", item.id);
      assert.match(
        record.source.path,
        /^scripts\/art-sources\/field-wardrobe\//,
      );
      assert.equal(
        hash(
          readFileSync(new URL(`../${record.source.path}`, import.meta.url)),
        ),
        record.source.sha256,
      );
      assert.equal(
        record.output.sha256,
        rig.files[`rigged/clothing/${filename}`].sha256,
      );
    }
  }
});

test("corrected poncho exits and vest openings align with the actual body", () => {
  const clothing = json("../assets/doll/rigged/clothing/manifest.json");
  const ids = [
    "cloak-02",
    "cloak-07",
    "cloak-09",
    ...Array.from(
      { length: 12 },
      (_, index) => `vest-${String(index + 1).padStart(2, "0")}`,
    ),
  ];
  assert.deepEqual(
    Object.keys(proof.checks.clothingFit).sort(),
    [...ids].sort(),
  );
  for (const id of ids) {
    const fit = proof.checks.clothingFit[id];
    const probes = clothing.items[id].registration.fitProbes;
    assert.deepEqual(
      fit.fabric.map((point) => point.point),
      probes.fabric,
    );
    assert.deepEqual(
      fit.underlayer.map((point) => point.point),
      probes.underlayer,
    );
    assert.equal(fit.sha256, rig.files[`rigged/clothing/${id}.webp`].sha256);
    assert.equal(fit.fitErrors, 0, id);
    if (id.startsWith("vest-")) {
      assert.equal(fit.shoulderAlpha.length, 2);
      assert.ok(
        fit.shoulderAlpha.every((alpha) => alpha >= 180),
        `${id}: both vest shoulders must reach the body's shoulder roots`,
      );
    }
    assert.ok(fit.fabric.length > 0 && fit.underlayer.length > 0, id);
    for (const point of fit.fabric)
      assert.ok(point.alpha >= 180, `${id}: garment must reach its attachment`);
    for (const point of fit.underlayer) {
      assert.ok(
        point.bodyAlpha >= 180,
        `${id}: opening must lead to the real arm or shirt`,
      );
      assert.ok(
        point.garmentAlpha <= 20,
        `${id}: back lining must not fill a wearing opening`,
      );
    }
  }
});
