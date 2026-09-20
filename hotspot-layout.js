// Keep the clickable labels close to their projected 3D objects without
// covering another label. Physical object positions remain unchanged.
export function layoutHotspots(anchors, width, height, padding = 8) {
  const placed = [];
  const gap = 3;
  const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
  for (const [index, anchor] of anchors.entries()) {
    const halfWidth = anchor.width / 2;
    const halfHeight = anchor.height / 2;
    const candidate = (x, y) => ({
      x: clamp(x, padding + halfWidth, width - padding - halfWidth),
      y: clamp(y, padding + halfHeight, height - padding - halfHeight),
      width: anchor.width,
      height: anchor.height,
    });
    const fits = (point) =>
      placed.every(
        (other) =>
          Math.abs(point.x - other.x) >=
            (point.width + other.width) / 2 + gap ||
          Math.abs(point.y - other.y) >=
            (point.height + other.height) / 2 + gap,
      );
    const origin = candidate(anchor.x, anchor.y);
    let position = origin;
    if (!fits(position)) {
      let found = false;
      for (
        let radius = 5;
        radius <= Math.hypot(width, height) && !found;
        radius += 5
      ) {
        for (let step = 0; step < 24; step++) {
          const angle = (step * Math.PI) / 12 + index * 2.399963;
          const point = candidate(
            origin.x + Math.cos(angle) * radius,
            origin.y + Math.sin(angle) * radius,
          );
          if (fits(point)) {
            position = point;
            found = true;
            break;
          }
        }
      }
      if (!found)
        throw new RangeError(
          "The room viewport cannot fit its interactive objects",
        );
    }
    placed.push(position);
  }
  return placed;
}
