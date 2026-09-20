import test from "node:test";
import assert from "node:assert/strict";
import { layoutHotspots } from "../hotspot-layout.js";

function verify(points, width, height) {
  for (const [index, point] of points.entries()) {
    assert.ok(point.x - point.width / 2 >= 7.99);
    assert.ok(point.y - point.height / 2 >= 7.99);
    assert.ok(point.x + point.width / 2 <= width - 7.99);
    assert.ok(point.y + point.height / 2 <= height - 7.99);
    for (const other of points.slice(index + 1)) {
      assert.ok(
        Math.abs(point.x - other.x) >= (point.width + other.width) / 2 + 2.99 ||
          Math.abs(point.y - other.y) >=
            (point.height + other.height) / 2 + 2.99,
      );
    }
  }
}

test("overlapping projected controls remain individually clickable on narrow screens", () => {
  for (const width of [254, 326, 640]) {
    const anchors = Array.from({ length: 20 }, (_, index) => ({
      x: width / 2 + (index % 3),
      y: 240 + (index % 4),
      width: 44,
      height: 44,
    }));
    const original = structuredClone(anchors);
    const placed = layoutHotspots(anchors, width, 520);
    assert.equal(placed.length, 20);
    verify(placed, width, 520);
    assert.deepEqual(
      anchors,
      original,
      "physical projected anchors are not mutated",
    );
    assert.deepEqual(
      placed,
      layoutHotspots(anchors, width, 520),
      "stable across reloads",
    );
  }
});

test("unobstructed controls stay directly on their objects", () => {
  const anchors = [
    { x: 60, y: 60, width: 44, height: 44 },
    { x: 180, y: 190, width: 44, height: 44 },
  ];
  assert.deepEqual(layoutHotspots(anchors, 254, 520), anchors);
});

test("initial projections outside the canvas still produce valid controls", () => {
  const anchors = Array.from({ length: 20 }, (_, index) => ({
    x: 20000 + index,
    y: -30000 - index,
    width: 44,
    height: 44,
  }));
  verify(layoutHotspots(anchors, 254, 520), 254, 520);
});

test("impossibly small viewports fail explicitly rather than silently overlap", () => {
  assert.throws(
    () =>
      layoutHotspots(
        [
          { x: 32, y: 32, width: 44, height: 44 },
          { x: 32, y: 32, width: 44, height: 44 },
        ],
        64,
        64,
      ),
    RangeError,
  );
});
