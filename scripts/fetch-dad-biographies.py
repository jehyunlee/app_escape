"""Add biography reading passages to dad's Wikipedia banks.

The existing passages were sliced near a 150-character floor and run about 60
words, which is too short for real reading practice. Longer passages cannot be
cut from the current articles without swallowing a neighbouring passage, so
this adds new people-focused articles and takes long, non-overlapping passages
from them.

Only real API extracts are stored, with the revision that was actually fetched.
"""
import argparse
import json
import re
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCES = ROOT / "assets/wikipedia"
API = "https://en.wikipedia.org/w/api.php"
AGENT = "room-escape-study/1.0 (family education project)"
TARGET_WORDS = 300
PER_ARTICLE = 6

PEOPLE = {
    "science": [
        "Charles Darwin",
        "Marie Curie",
        "Isaac Newton",
        "Rosalind Franklin",
        "Louis Pasteur",
        "Michael Faraday",
    ],
    "ai": [
        "Alan Turing",
        "Geoffrey Hinton",
        "Claude Shannon",
        "John McCarthy (computer scientist)",
        "Ada Lovelace",
        "Herbert A. Simon",
    ],
    "history": [
        "Leonardo da Vinci",
        "Genghis Khan",
        "Nelson Mandela",
        "Marco Polo",
        "Johannes Gutenberg",
        "Sejong the Great",
    ],
    "psychology": [
        "Sigmund Freud",
        "Jean Piaget",
        "B. F. Skinner",
        "Ivan Pavlov",
        "Daniel Kahneman",
        "Carl Jung",
    ],
    "metascience": [
        "Bruno Latour",
        "Derek J. de Solla Price",
        "Thomas Kuhn",
        "Karl Popper",
        "John Ioannidis",
        "Robert K. Merton",
    ],
}


def slug(title):
    text = re.sub(r"\s*\([^)]*\)", "", title).lower()
    return re.sub(r"[^a-z0-9]+", "-", text).strip("-")


def fetch(title, attempts=6):
    """Fetch one article, backing off when Wikipedia rate-limits us.

    The API returns 429 readily for back-to-back requests, so retries wait
    exponentially and honour Retry-After when the response supplies it.
    """
    query = {
        "action": "query",
        "format": "json",
        "formatversion": "2",
        "prop": "extracts|revisions",
        "explaintext": "1",
        "rvprop": "ids|timestamp",
        "titles": title,
        "redirects": "1",
    }
    request = urllib.request.Request(
        API + "?" + urllib.parse.urlencode(query), headers={"User-Agent": AGENT}
    )
    for attempt in range(attempts):
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                return json.load(response)["query"]["pages"][0]
        except urllib.error.HTTPError as error:
            if attempt == attempts - 1:
                raise
            wait = 5 * (2**attempt)
            if error.code == 429:
                header = error.headers.get("Retry-After")
                if header and header.isdigit():
                    wait = max(wait, int(header))
            print(f"    HTTP {error.code}; retrying in {wait}s", flush=True)
            time.sleep(wait)
        except (urllib.error.URLError, TimeoutError):
            if attempt == attempts - 1:
                raise
            time.sleep(5 * (2**attempt))
    raise RuntimeError("unreachable")


def sentence_ends(text):
    offsets = {len(text)}
    for match in re.finditer(r"[.!?](?=\s|$)|\n", text):
        offsets.add(match.end())
    return sorted(offsets)


def sentence_starts(text):
    offsets = {0}
    for match in re.finditer(r"(?<=[.!?])\s+|\n+", text):
        offsets.add(match.end())
    return sorted(offsets)


def slice_passages(extract, count):
    """Cut `count` non-overlapping passages of at least TARGET_WORDS each."""
    starts, ends = sentence_starts(extract), sentence_ends(extract)
    passages = []
    cursor = 0
    for _ in range(count):
        candidates = [o for o in starts if o >= cursor]
        left = candidates[0] if candidates else cursor
        right = None
        for offset in ends:
            if offset > left and len(extract[left:offset].split()) >= TARGET_WORDS:
                right = offset
                break
        if right is None:
            break
        text = extract[left:right].strip()
        if len(text.split()) < TARGET_WORDS:
            break
        passages.append(text)
        cursor = right
    return passages


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--apply", action="store_true")
    parser.add_argument("--topics", nargs="*", default=list(PEOPLE))
    arguments = parser.parse_args()

    for topic in arguments.topics:
        path = SOURCES / f"{topic}-sources.json"
        data = json.loads(path.read_text(encoding="utf-8"))
        known = {a["id"] for a in data["articles"]}
        added_articles, added_passages = [], []

        for title in PEOPLE[topic]:
            page = fetch(title)
            if page.get("missing"):
                print(f"  MISSING {title}")
                continue
            article_id = f"{topic}-{slug(page['title'])}"
            if article_id in known:
                print(f"  skip (already present) {page['title']}")
                continue
            revision = page["revisions"][0]
            extract = page["extract"]
            texts = slice_passages(extract, PER_ARTICLE)
            if len(texts) < PER_ARTICLE:
                print(f"  too short: {page['title']} gave {len(texts)}/{PER_ARTICLE}")
                continue
            added_articles.append(
                {
                    "id": article_id,
                    "title": page["title"],
                    "url": "https://en.wikipedia.org/wiki/"
                    + urllib.parse.quote(page["title"].replace(" ", "_")),
                    "revisionId": int(revision["revid"]),
                    "revisionUrl": f"https://en.wikipedia.org/w/index.php?oldid={revision['revid']}",
                    "revisionTimestamp": revision["timestamp"],
                    "retrievedAt": datetime.now(timezone.utc).isoformat(),
                    "extract": extract,
                }
            )
            for index, text in enumerate(texts, start=1):
                added_passages.append(
                    {"id": f"{article_id}-p{index}", "articleId": article_id, "text": text}
                )
            print(f"  {page['title']}: {len(texts)} passages")
            time.sleep(3)  # stay polite to the API

        print(
            f"{topic}: +{len(added_articles)} articles, +{len(added_passages)} passages"
        )
        if arguments.apply and added_passages:
            data["articles"].extend(added_articles)
            data["passages"].extend(added_passages)
            path.write_text(
                json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
            )

    if not arguments.apply:
        print("\ndry run; pass --apply to write")


if __name__ == "__main__":
    raise SystemExit(main())
