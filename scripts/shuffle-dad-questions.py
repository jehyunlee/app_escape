"""Shuffle the stored order of dad's Wikipedia question banks.

Gameplay already draws each deck with a seeded shuffle, so this only changes
how the banks are stored: questions stop appearing grouped article by article.
Every spec keeps its own id, passage, options and answer index, so saved games
and the passage/answer invariants are untouched.
"""
import argparse
import random
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TOPICS = ("science", "ai", "history", "psychology", "metascience")
# Fixed by default so a rerun reproduces the same stored order.
DEFAULT_SEED = 20260927


def split_specs(body: str) -> list[str]:
    """Split the questionSpecs array literal into individual object entries."""
    specs: list[str] = []
    depth = 0
    start = None
    in_string: str | None = None
    escaped = False
    for index, char in enumerate(body):
        if in_string:
            if escaped:
                escaped = False
            elif char == "\\":
                escaped = True
            elif char == in_string:
                in_string = None
            continue
        if char in "\"'`":
            in_string = char
            continue
        if char == "{":
            if depth == 0:
                start = index
            depth += 1
        elif char == "}":
            depth -= 1
            if depth == 0 and start is not None:
                specs.append(body[start : index + 1])
                start = None
    if depth or in_string:
        raise ValueError("unbalanced questionSpecs array")
    return specs


def shuffle_topic(topic: str, seed: int) -> tuple[int, bool]:
    path = ROOT / f"dad-{topic}.js"
    text = path.read_text(encoding="utf-8")
    opening = "const questionSpecs = ["
    start = text.index(opening) + len(opening)
    end = text.index("\n];", start)
    body = text[start:end]
    specs = split_specs(body)
    ids = re.findall(r'id: *"([^"]+)"', body)
    if len(specs) != len(ids):
        raise ValueError(f"{topic}: found {len(specs)} specs but {len(ids)} ids")

    shuffled = list(specs)
    random.Random(f"{seed}:{topic}").shuffle(shuffled)
    if len(specs) > 1 and shuffled == specs:
        raise ValueError(f"{topic}: shuffle produced the original order")

    rebuilt = "\n" + "\n".join(f"  {spec}," for spec in shuffled)
    updated = text[:start] + rebuilt + text[end:]
    # The set of specs must be preserved exactly; only their order may change.
    if sorted(split_specs(rebuilt)) != sorted(specs):
        raise ValueError(f"{topic}: shuffle altered spec content")
    path.write_text(updated, encoding="utf-8")
    return len(specs), True


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--seed", type=int, default=DEFAULT_SEED)
    parser.add_argument("--topics", nargs="*", default=list(TOPICS))
    arguments = parser.parse_args()
    total = 0
    for topic in arguments.topics:
        count, _ = shuffle_topic(topic, arguments.seed)
        total += count
        print(f"{topic}: shuffled {count} stored questions")
    print(f"Shuffled {total} dad questions with seed {arguments.seed}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
