"""Build the restrained field-wardrobe catalog and 24-image review sample.

This generator is deliberately isolated from the live shop.  It reads the
published catalog only to prove that ids, categories, prices, and schema stay
stable, then writes every candidate catalog and image artifact below
``scripts/art-sources/field-wardrobe``.  ``--samples`` makes the initial
three-panel review sheets for ids 01, 06, and 12 in each category.  A
targeted ``--hat-sample`` replaces the rejected hat review sheet without
rerunning the accepted seven category calls.  ``--all`` fills the remaining
three-item sheets and writes full-category contact sheets.  The targeted
``--pants01-revision`` performs one single-item OpenAI edit and overlays that
crop over the cached pants sample on all later ``--all`` runs.  Existing
sheets are resumed without making another API call.
"""
from __future__ import annotations

import argparse
import base64
import datetime as dt
import hashlib
import io
import json
import os
import shutil
from concurrent.futures import ThreadPoolExecutor, as_completed
from collections import deque
from pathlib import Path
import urllib.error
import urllib.request

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
PUBLISHED_CATALOG = ROOT / "assets" / "wardrobe-catalog.json"
FIELD_DIR = ROOT / "scripts" / "art-sources" / "field-wardrobe"
CATALOG_PATH = FIELD_DIR / "catalog.json"
SHEET_DIR = FIELD_DIR / "sheets"
DESIGN_DIR = FIELD_DIR / "designs"
THUMB_DIR = FIELD_DIR / "thumbs"
CONTACT_DIR = FIELD_DIR / "contacts"
ARCHIVE_DIR = FIELD_DIR / "archive"
REVISION_DIR = FIELD_DIR / "revisions"
PANTS_REVISION_RECORD = REVISION_DIR / "pants-01.json"
PANTS_REVISION_RAW = REVISION_DIR / "pants-01-raw.png"
PROVENANCE_PATH = FIELD_DIR / "provenance.json"
MANIFEST_PATH = FIELD_DIR / "manifest.json"
STARTER_PANTS_PATH = ROOT / "assets" / "doll" / "rigged" / "starter-pants.webp"
MODEL = "gpt-image-2.5-flare"
SOURCE_SIZE = (1536, 1024)
PANEL_SIZE = (512, 1024)
THUMBNAIL_SIZE = 384
PADDING = 0.12
SAMPLE_INDICES = (1, 6, 12)
SAMPLE_GROUP_SUFFIX = "samples-01-06-12"
PRICES = (1, 3, 5, 8, 12, 18, 26, 38, 52, 68, 84, 100)
CATEGORIES = ("hat", "necklace", "cloak", "wand", "broom", "gloves", "pants", "vest")
QUALITIES = (
    "basic", "basic", "standard", "standard", "fine", "fine",
    "fine", "masterwork", "masterwork", "masterwork", "masterwork",
    "masterwork",
)

# Every color is intentionally quiet and material-led.  The published color
# field remains present for callers that use it as a shop swatch.
PALETTE = {
    "charcoal": "#343b42",
    "slate": "#56616b",
    "earth": "#6c5038",
    "navy": "#34495a",
    "green": "#4b604f",
    "steel": "#70787d",
    "wood": "#77583f",
    "leather": "#684a38",
}

TIER_NOTES = {
    "basic": (
        "Use a simple, honest construction with matte material and visible hand joining; "
        "keep the silhouette clean and lightly built."
    ),
    "standard": (
        "Use durable woven cloth, wood, leather, or matte iron with one clear structural seam; "
        "the silhouette is practical and sturdier than an entry item."
    ),
    "fine": (
        "Use denser material, reinforced edges or joints, and substantial clean forms; "
        "show precise functional joining rather than decoration."
    ),
    "masterwork": (
        "Use the densest believable materials, layered structural reinforcement, substantial clean forms, "
        "and precise functional joinery; impressive through craft, never through flash."
    ),
}

# name, palette key, Korean description, item-specific English design prompt.
# The prompts intentionally describe construction and silhouette rather than
# status, combat, or decorative motifs.
SPECS: dict[str, list[tuple[str, str, str, str]]] = {
    "hat": [
        ("부드러운 점끝 펠트모", "charcoal", "차콜 펠트를 부드러운 낮은 점끝으로 세우고 둥근 보강 챙을 손바느질한 여행 마법모.", "A simple practical wizard travel hat made from soft charcoal felt, with a low gently pointed crown, a rounded reinforced brim, one plain woven band, and no rigid modern cap shape."),
        ("낮은 기울임 마법모", "earth", "갈색 펠트의 낮은 기울임 꼭지와 가죽 테를 갖춘 접이식 여행 마법모.", "A foldable earth-brown felt wizard hat with a low slanted pointed crown, two deliberate fold seams, a firm narrow brim, and a flat leather band; clearly magical travel wear."),
        ("짧은 비대칭 꼭지모", "slate", "슬레이트 모직 꼭지를 한쪽으로 짧게 기울이고 촘촘한 챙 봉제를 더한 모자.", "A short slate wool wizard hat with an asymmetric pointed crown leaning slightly to one side, a circular reinforced brim, and one visible structural seam; friendly and unmistakably wizardly."),
        ("넓은 강화꼭지모", "green", "채도가 낮은 녹색 직조천에 낮고 넓은 뾰족 꼭지와 평평한 보강 챙을 만든 모자.", "A muted-green woven wizard hat with a broad low pointed crown, a wide flat reinforced brim, and a plain cloth band; practical field protection, never a modern brimmed cap."),
        ("중간 여행마법모", "navy", "남색 펠트의 중간 높이 테이퍼 꼭지와 두 줄 솔기로 형태를 잡은 여행모.", "A moderate tapered navy felt wizard hat with a clear pointed crown, two structural seam lines, and a strengthened narrow brim; a practical traveling mage silhouette."),
        ("구조 가죽 마도모", "leather", "갈색 가죽 패널을 정밀하게 이어 중간 테이퍼 꼭지와 단단한 챙을 만든 마도모.", "A structured tapered leather mage hat with a moderate pointed crown, four fitted leather panels, a firm round reinforced brim, and small matte-iron seam pins; no side-fold cap shape."),
        ("두겹 비대칭마법모", "navy", "남청색 직물 두 겹을 비대칭 점끝으로 겹치고 가죽 끈으로 결속한 마법모.", "A distinctive two-layer navy wizard hat with an asymmetric pointed crown, one shorter folded crown side, a clean circular brim, and functional leather tie joinery."),
        ("철솔기 중꼭지모", "charcoal", "차콜 펠트 중간 점끝에 가는 무광 철 솔기와 강화 챙을 더한 모자.", "A medium pointed charcoal felt wizard hat with a straight tapered crown, a narrow matte-iron seam strip, and a dense strengthened brim; restrained structural craft."),
        ("사선챙 방수마법모", "green", "무광 녹색 방수천에 사선 점끝과 이중 챙 테이프를 결합한 여행 마법모.", "A weatherproof muted-green wizard hat with a diagonally angled pointed crown, a sloped reinforced brim, double edge stitching, and a plain woven chin cord."),
        ("네모패널 가죽마법모", "earth", "갈색 가죽 네 패널을 네모 솔기로 잇고 낮은 비대칭 점끝을 세운 모자.", "A four-panel earth-brown leather wizard hat with a low slightly asymmetric pointed crown, visible square joining seams, and a short firm reinforced brim; strong clean construction."),
        ("이중챙 강화꼭지모", "slate", "슬레이트 직물 두 겹을 포개어 중간 점끝을 세우고 안쪽 철심으로 챙을 강화한 모자.", "A reinforced double-layer slate wizard hat with a moderate pointed crown, two offset brim layers, a concealed matte-iron support at the edge, and a simple cloth band."),
        ("철심 방벽모", "charcoal", "차콜 밀도 높은 가죽에 두꺼운 무광 철 구조 리브와 강화 챙을 결구한 중간 각진 마법모.", "A firm angular moderate wizard crown made from dense charcoal leather, with thick matte-iron structural ribs crossing the crown and a reinforced brim; face open, visor-free, smooth crown, no protrusions or stones, substantial protective craft without flash."),
    ],
    "necklace": [
        ("매듭 보호패", "earth", "갈색 가죽 끈에 작은 납작한 나무 보호패를 매단 단정한 목걸이.", "A compact protective necklace of earth-brown leather cord and one small flat wooden seal, with a single restrained etched mark and no extra pieces."),
        ("무광 철연결고리", "charcoal", "무광 철 타원 고리 몇 개를 짧게 연결한 튼튼한 목걸이.", "A short necklace of three chunky matte-iron oval links joined by plain pins, ending in one tiny flat seal; compact and weighty, not a long chain."),
        ("가죽 봉인패", "leather", "갈색 가죽 띠 중앙에 작은 철 봉인판을 꿰맨 실용적인 목걸이.", "A compact leather collar necklace with a small brushed-steel rectangular seal plate, two punched holes, and one restrained line mark; clean utilitarian silhouette."),
        ("납작 나무부적", "wood", "어두운 목재를 얇고 둥글게 깎아 가죽 끈에 단 소박한 보호 목걸이.", "A short leather-cord necklace carrying one small flat round wood token with a shallow single groove; matte, friendly, and deliberately understated."),
        ("짜임 띠 인장", "green", "채도가 낮은 녹색 직조 띠와 작은 슬레이트 인장을 겹친 목걸이.", "A compact woven-cloth neck band with one small slate seal set flush into a leather tab; broad textile band silhouette with one quiet mark."),
        ("브러시드강철 잠금패", "steel", "브러시드 강철 잠금패와 두꺼운 가죽 끈으로 만든 정밀한 목걸이.", "A sturdy short necklace with a small brushed-steel clasp plate at the throat, paired with two flat leather straps and a plain rectangular profile."),
        ("슬레이트 타원봉인", "slate", "슬레이트 타원판을 철 고리 하나로 고정한 차분한 보호 목걸이.", "A small oval slate pendant held by one matte-iron loop on a woven cord, with a single restrained notch mark; visibly different from a chain necklace."),
        ("겹가죽 목가리개", "leather", "두 겹 가죽 띠를 포개고 옆쪽 작은 철 버클로 조인 목가리개.", "A compact layered-leather neck guard with two overlapping horizontal bands, one small side iron buckle, and no hanging ornament; structured protective silhouette."),
        ("직조 보호끈", "navy", "남청색 직조 끈을 납작하게 짜고 끝에 작은 나무 인장을 단 목걸이.", "A flat braided navy cloth necklace with a short sliding knot and one tiny wood seal tucked close to the collar; soft woven construction, no dangling mass."),
        ("철판 결속 목걸이", "charcoal", "차콜 가죽 띠에 작은 철판 세 장을 나란히 결속한 튼튼한 목걸이.", "A compact three-plate iron necklace mounted on a charcoal leather band, each plate overlapping slightly with one tiny alignment mark; dense functional joinery."),
        ("돌판 이중인장", "earth", "갈색 가죽 끈에 작은 돌판 두 장을 포개어 단 고급 보호 목걸이.", "A masterwork short necklace with two small stacked slate tiles inside a leather frame, held by precise matte-iron pins; restrained seal detail and substantial materials."),
        ("정밀 연결 봉인", "steel", "브러시드 강철 연결부와 작은 어두운 돌 인장을 맞물린 완성도 높은 목걸이.", "A masterwork compact protective necklace built from precisely fitted brushed-steel links, a small dark stone seal set low at the collar, and a broad leather backing; clean and quiet."),
    ],
    "cloak": [
        ("짧은 들길 망토", "charcoal", "차콜 방수 직물에 맞춘 어깨와 소매, 가장자리를 두른 짧은 들길 망토.", "A short weatherproof cloak with fitted shoulders, simple sleeves, hood fully down behind the neck, and a real open front showing transparent background; charcoal cloth with reinforced binding."),
        ("닫힌 사각 판초", "earth", "갈색 방수천으로 어깨와 소매를 맞추고 앞을 완전히 닫은 사각 판초.", "A closed square-cut poncho cloak in earth-brown weatherproof cloth, fitted shoulder seams and short sleeves, hood fully down, reinforced hem, and no inner clothing visible."),
        ("분할 앞트임 망토", "slate", "슬레이트 모직에 중앙 앞트임과 양쪽 소매, 이중 가장자리를 넣은 망토.", "A mid-length cloak with fitted shoulders and sleeves, hood fully down, a true center-front opening that shows transparent background, and double stitched edge binding."),
        ("끈 여밈 여행망토", "green", "채도가 낮은 녹색 직조천에 앞 끈 여밈과 튼튼한 소매를 붙인 여행망토.", "A practical green woven-cloth cloak with shaped shoulders, full sleeves, hood fully down, a visibly open front held by two leather ties, and a clean weatherproof edge."),
        ("긴 옆트임 망토", "navy", "남청색 방수천을 길게 재단하고 옆트임과 보강 밑단을 둔 망토.", "A long navy weatherproof cloak with fitted shoulders, tapered sleeves, hood fully down, an actual transparent front opening from collar to hem, and a dense reinforced lower edge."),
        ("사선 랩 여밈망토", "leather", "갈색 가죽과 직물을 맞물리고 어깨에서 비스듬히 겹쳐 닫는 랩형 여행 망토.", "A closed asymmetric wrap-front travel coat with fitted shoulders and sleeves, hood fully down, a solid diagonal overlapping front from shoulder to hip, two matte-iron closures, and reinforced leather edges; no transparent opening and no inner clothing."),
        ("보강 닫힘 판초", "green", "녹색 방수 직물의 닫힌 판초 앞판과 겹친 어깨 보강재를 갖춘 망토.", "A closed poncho-style cloak with fitted shoulder shaping, sturdy sleeves, hood fully down, a solid front panel with no inner clothing, and layered cloth reinforcement at shoulders and hem."),
        ("폭우 앞트임 망토", "charcoal", "차콜 방수 원단과 높은 어깨선, 앞을 완전히 연 폭우용 망토.", "A storm-weather cloak with fitted shoulders and sleeves, hood fully down, a broad real open front showing transparent background, a high practical collar, and dense stitched edge tape."),
        ("겹단 닫힌 망토", "earth", "갈색 직조천 두 겹을 겹친 닫힌 앞판과 짧은 소매를 갖춘 망토.", "A closed layered cloak in earth-brown woven cloth with fitted shoulders, short sleeves, hood fully down, a solid overlapping front, and two broad reinforced hem bands; no inner clothing."),
        ("긴 앞갈림 망토", "navy", "남청색 직물에 앞 중앙 갈림과 가죽 테를 더한 긴 여행 망토.", "A full-length navy cloak with fitted shoulders and sleeves, hood fully down, a true transparent-background opening down the front, leather-bound edges, and a straight weighted hem."),
        ("철버클 닫힌 망토", "slate", "슬레이트 방수천과 작은 철 버클, 구조적인 어깨 봉제를 결합한 망토.", "A closed slate weatherproof cloak with fitted shoulders, sleeves, hood fully down, a solid front without inner clothing, and three small matte-iron buckles aligned along the reinforced edge."),
        ("장거리 닫힘 망토", "navy", "밀도 높은 남청색 방수 직물에 가죽 가장자리와 정밀 결구를 넣은 닫힌 장거리 망토.", "A masterwork closed long-travel coat-cloak with fitted shoulders and sleeves, hood fully down, a solid navy front panel with no transparent opening and no inner body or shirt, leather-bound edges, and precise functional closures."),
    ],
    "wand": [
        ("매듭 손잡이 목봉", "wood", "어두운 목재 자루 아래쪽에 삼끈 매듭 손잡이를 감은 소박한 완드.", "A vertical wizard wand, HANDLE at the bottom and narrow tip at the top, made from one matte wood shaft with a plain cord-wrapped lower grip and a modest rounded tip."),
        ("곧은 떡갈 손잡이", "earth", "갈색 목재를 곧게 다듬고 아래 손잡이와 위쪽 끝을 분명히 나눈 완드.", "A vertical straight oak wand with HANDLE at the bottom and TIP at the top, a faceted lower grip, a clean tapered upper tip, and no oversized attachment."),
        ("굽은 자작 핸들", "slate", "슬레이트빛 자작나무를 한 번 부드럽게 굽혀 손잡이를 구별한 완드.", "A vertical gently curved birch wand with HANDLE at the bottom, TIP at the top, one controlled bend above the lower grip, and a small leather wrap at the handle."),
        ("가죽그립 철심완드", "leather", "가죽 손잡이와 가는 무광 철심을 맞물린 실용 완드.", "A vertical wand with HANDLE at the bottom and TIP at the top, a reinforced wood shaft, a compact leather lower grip, and one narrow matte-iron collar at the join."),
        ("두께 보강 목완드", "wood", "두꺼운 목재 몸체와 아래쪽 보강 고리를 가진 안정적인 완드.", "A vertical stout wood wand with HANDLE at the bottom and TIP at the top, a broad lower grip, a denser central shaft, and two small wood join bands; substantial but simple."),
        ("철고리 보강봉", "charcoal", "차콜 목재에 작은 무광 철 고리 두 개를 결구한 완드.", "A vertical reinforced wand with HANDLE at the bottom and TIP at the top, charcoal wood, two small matte-iron join rings around the lower grip, and a precise blunt taper."),
        ("사각 접합완드", "navy", "남청색 목재를 네 면으로 다듬고 손잡이와 자루를 사각 접합한 완드.", "A vertical square-faceted wand with HANDLE at the bottom and TIP at the top, a clear lower handle block, a straight navy wood shaft, and a small brushed-steel tip cap."),
        ("이중목 결구완드", "earth", "두 종류의 갈색 목재를 정밀하게 이어 아래 손잡이를 넓힌 완드.", "A vertical two-wood wand with HANDLE at the bottom and TIP at the top, a wide lower grip made from joined earth-brown wood pieces, and a narrow clean upper tip."),
        ("브러시드강철 손잡이", "steel", "브러시드 강철 손잡이와 어두운 목재 자루를 절제해 결합한 완드.", "A vertical wand with HANDLE at the bottom and TIP at the top, a compact brushed-steel lower grip sleeve around a dark wood shaft, and a plain pointed upper tip."),
        ("짧은 보호캡 완드", "green", "채도가 낮은 녹색 목재와 작은 보호캡을 결구한 짧고 튼튼한 완드.", "A vertical compact wand with HANDLE at the bottom and TIP at the top, muted green wood, a small matte cap at the lower grip, and a clearly separate narrow upper tip."),
        ("정밀 결구 완드", "charcoal", "차콜 목재와 철 결구를 촘촘히 맞물린 고급 완드.", "A masterwork vertical wand with HANDLE at the bottom and TIP at the top, dense charcoal wood, a precisely fitted lower leather grip, two flush brushed-steel collars, and a restrained tapered tip."),
        ("균형 보강 완드", "navy", "밀도 높은 남청색 목재와 가죽 손잡이, 정밀한 끝 결구를 갖춘 완드.", "A masterwork vertical wand with HANDLE at the bottom and TIP at the top, dense navy wood, substantial leather lower grip, balanced matte-iron joinery, and a clean small upper tip; never an emitter-like handle."),
    ],
    "broom": [
        ("굵은 농장빗자루", "wood", "두꺼운 목재 자루와 아래쪽 굵은 섬유 솔을 가죽 끈으로 묶은 빗자루.", "A vertical practical flying broom with HANDLE at the top and a broad bristle bundle at the bottom, thick wood shaft, leather binding, and a friendly sturdy farm silhouette."),
        ("긴 삼끈 빗자루", "earth", "갈색 긴 자루와 아래쪽 삼끈 결속 솔을 가진 장거리 빗자루.", "A vertical long flying broom with HANDLE at the top and dense straw bristles at the bottom, earth-brown wood, two hemp bindings, and a straight reinforced shaft."),
        ("곧은 강화빗자루", "green", "채도가 낮은 녹색 자루와 철 고리로 눌러 고정한 아래 솔의 빗자루.", "A vertical reinforced flying broom with HANDLE at the top and a wide bristle bundle at the bottom, muted green shaft, one matte-iron collar, and a straight practical profile."),
        ("넓은 평솔 빗자루", "slate", "슬레이트 자루와 아래쪽으로 넓게 펼친 평평한 솔을 가진 빗자루.", "A vertical flying broom with HANDLE at the top and a broad flat bristle fan at the bottom, slate wood shaft, woven binding, and a substantial lower joint."),
        ("가죽결속 비행빗자루", "leather", "갈색 가죽 결속부와 길고 촘촘한 아래 솔을 갖춘 비행빗자루.", "A vertical practical flying broom with HANDLE at the top and long dense bristles at the bottom, leather-wrapped handle, reinforced lower wood joint, and no thin brush profile."),
        ("이중고리 장거리빗자루", "navy", "남청색 자루와 두 개의 무광 철 고리, 아래쪽 두툼한 솔을 결합한 빗자루.", "A vertical long-distance flying broom with HANDLE at the top and thick bristles at the bottom, navy wood shaft, two matte-iron collars, and a clean double-ring lower joint."),
        ("판재 보강 빗자루", "earth", "갈색 자루 양옆에 얇은 목재 판재를 덧대고 아래 솔을 단단히 고정한 빗자루.", "A vertical sturdy broom with HANDLE at the top and dense bristles at the bottom, earth-brown shaft strengthened by two narrow wood side rails, with leather lower binding."),
        ("두 레일 솔빗자루", "charcoal", "차콜 자루와 양옆 두 레일 사이에 고정한 아래쪽 넓은 솔을 가진 빗자루.", "A vertical flying broom with HANDLE at the top and a wide bristle bundle at the bottom held between two charcoal wood rails, matte-iron pins, and a clear reinforced construction."),
        ("브러시드강철 고리빗자루", "steel", "브러시드 강철 고리와 어두운 목재 자루, 아래쪽 균일한 솔을 맞춘 빗자루.", "A vertical practical broom with HANDLE at the top and a broad uniform bristle bundle at the bottom, dark wood shaft, brushed-steel lower collar, and a compact leather grip."),
        ("고밀도 솔빗자루", "green", "밀도 높은 녹색 섬유 솔과 단단한 목재 자루를 결구한 빗자루.", "A vertical dense-bristle flying broom with HANDLE at the top and a heavy even bristle bundle at the bottom, muted green shaft, layered woven binding, and a substantial lower block."),
        ("정밀 결구 빗자루", "navy", "남청색 자루와 무광 철 결구, 촘촘한 아래 솔을 정밀하게 맞춘 빗자루.", "A masterwork vertical flying broom with HANDLE at the top and a dense broad bristle bundle at the bottom, navy wood, precise matte-iron joinery, leather grip, and clean functional rails."),
        ("장거리 강화빗자루", "charcoal", "밀도 높은 차콜 자루와 가죽 손잡이, 넓고 두꺼운 아래 솔을 완성도 있게 결구한 빗자루.", "A masterwork vertical long flying broom with HANDLE at the top and substantial broad bristles at the bottom, dense charcoal wood, reinforced leather grip, brushed-steel collars, and precise lower joinery."),
    ],
    "gloves": [
        ("거친 가죽 주먹장갑", "leather", "거친 갈색 가죽을 단순하게 봉제한 한 쌍의 닫힌 주먹형 장갑.", "A matching pair of empty leather glove forms, each with fingers curled into a closed fist, short wrists, rough seam lines, and a plain leather cuff; no open hand shape."),
        ("캔버스 닫힌손 장갑", "slate", "슬레이트 캔버스와 짧은 손목 밴드로 만든 닫힌 주먹형 장갑 한 쌍.", "A pair of empty slate canvas glove forms with fingers curled into closed fists, compact wrist bands, separate finger seam ridges, and a softly woven surface; no person or body."),
        ("철심 커프장갑", "earth", "갈색 가죽 손등과 작은 무광 철심 커프를 결합한 닫힌 주먹장갑.", "A pair of empty earth-brown leather glove forms with closed curled-fist fingers, short matte-iron cuff inserts, and clear reinforced wrist seams; product forms only."),
        ("누빔 작업장갑", "green", "채도가 낮은 녹색 직조천을 누비고 손목을 골지로 마감한 장갑 한 쌍.", "A pair of empty muted-green woven gloves with fingers curled into closed fists, quilted backs, ribbed wrist cuffs, and visible textile stitching; never open hands."),
        ("이중가죽 주먹장갑", "leather", "두 겹 갈색 가죽과 손목 결속띠로 내구성을 높인 주먹장갑.", "A pair of empty double-layer leather glove forms with tightly curled closed fists, overlapping palm panels, and two secure wrist straps; clean rugged construction."),
        ("긴 작업 주먹장갑", "navy", "남청색 가죽을 팔뚝까지 길게 만들고 관절 봉제를 보강한 장갑.", "A pair of empty long navy leather glove forms, fingers curled into closed fists, reaching to the forearm with articulated seam bands and adjustable cuffs; no open hand."),
        ("손등 철판 장갑", "steel", "가죽 주먹 위에 작은 브러시드 강철 판을 겹친 튼튼한 장갑.", "A pair of empty leather glove forms with fingers curled into closed fists, small overlapping brushed-steel plates across the backs, and broad secure wrist cuffs; restrained workwear."),
        ("분할봉제 장갑", "charcoal", "차콜 직물과 가죽을 나눠 봉제하고 손목을 단단히 잡은 주먹장갑.", "A pair of empty charcoal cloth-and-leather glove forms with closed curled-fist fingers, sharply separated panel seams, and a squared reinforced cuff; product design detail only."),
        ("브러시드강철 커프장갑", "steel", "브러시드 강철 손목 커프와 어두운 가죽 손가락부를 맞춘 장갑.", "A pair of empty dark-leather glove forms with fingers curled into closed fists, compact brushed-steel wrist cuffs, clean finger ridges, and no decorative attachments."),
        ("패딩 손목장갑", "green", "채도가 낮은 녹색 가죽에 두꺼운 패딩과 이중 손목띠를 넣은 장갑.", "A pair of empty padded green leather glove forms with tightly curled closed fists, substantial padded backs, double wrist straps, and clear construction seams."),
        ("결속끈 주먹장갑", "earth", "갈색 가죽 주먹부를 촘촘한 끈 결속과 무광 철 고리로 보강한 장갑.", "A pair of empty earth-brown leather glove forms with fingers curled into closed fists, precise lace binding around the wrists, one matte-iron ring per cuff, and sturdy joined panels."),
        ("중량 보강 장갑", "navy", "밀도 높은 남청색 가죽과 브러시드 강철 손목부로 완성한 주먹형 장갑.", "A masterwork pair of empty dense navy leather glove forms with fingers curled into closed fists, substantial reinforced backs, fitted brushed-steel wrist guards, and precise seam joinery; no people or open hands."),
    ],
    "pants": [
        ("거친 곧은 바지", "charcoal", "거친 차콜 직물의 곧은 두 다리와 넓은 허리밴드, 소박한 무광 무릎 보강판과 하단 이중 봉제를 가진 바지.", "A pair of inexpensive straight-leg charcoal cloth trousers with two clearly separate legs, a broad waistband, modest matte knee reinforcement panels, and double-stitched lower-leg seams; plain functional construction with no flowing garment panels."),
        ("캔버스 주머니바지", "earth", "갈색 캔버스 곧은 다리에 납작한 양쪽 주머니와 단순한 무릎 봉제를 둔 바지.", "A pair of straight-leg earth-brown canvas trousers with two separate legs, two flat side pockets, a clean waistband, and practical stitched knees; no flowing panels."),
        ("슬레이트 커프바지", "slate", "슬레이트 모직을 곧게 재단하고 발목에 단단한 커프를 붙인 바지.", "A pair of straight tapered slate wool trousers with two distinct legs, broad turned ankle cuffs, reinforced knee seams, and a flat functional waistband."),
        ("허리보강 작업바지", "green", "채도가 낮은 녹색 직조천 허리와 곧은 다리, 허리 연결부를 보강한 작업바지.", "A pair of straight-leg muted-green work trousers with two separate legs, a reinforced waist yoke, clean front seams, and structured knees; practical wizard workwear."),
        ("이중무릎 바지", "navy", "남청색 천에 이중 무릎판과 곧은 발목을 넣은 튼튼한 바지.", "A pair of straight-leg navy trousers with two clearly separate legs, dense double-layer knee patches, simple ankle hems, and a substantial clean waistband."),
        ("사선솔기 바지", "earth", "갈색 직물 다리에 사선 무릎 솔기와 가죽 허리끈을 넣은 바지.", "A pair of straight-leg earth-brown trousers with two separate legs, one diagonal reinforced seam across each knee, a leather waist tie, and no overlay panels."),
        ("가죽무릎 바지", "leather", "갈색 가죽 무릎판과 어두운 직물 다리를 정밀하게 이어 만든 바지.", "A pair of straight-leg cloth trousers with two distinct legs, compact leather knee reinforcements, clean side seams, and a plain leather-tipped waistband."),
        ("브러시드강철 단추바지", "steel", "슬레이트 직물에 작은 브러시드 강철 단추와 곧은 다리를 결합한 바지.", "A pair of straight-leg slate trousers with two separate legs, small brushed-steel waist fasteners, structured knee folds, and clean ankle hems; never decorative."),
        ("겹원단 정비바지", "charcoal", "차콜 직물과 가죽을 무릎 아래까지 겹쳐 봉제한 정비용 바지.", "A pair of straight-leg charcoal trousers with two clear legs, dense cloth outer panels, narrow leather reinforcement from hip to knee, and precise functional seams."),
        ("고밀도 직선바지", "navy", "밀도 높은 남청색 직조천으로 허리와 무릎을 구조화한 직선 바지.", "A pair of dense navy straight trousers with two clearly separated legs, shaped waistband, reinforced articulated knees, and substantial clean hems."),
        ("결구주름 바지", "green", "녹색 직조천에 움직임을 위한 얕은 앞주름과 강화 무릎 결구를 넣은 바지.", "A masterwork pair of muted-green straight-leg trousers with two distinct legs, two shallow functional front pleats, precise knee joinery, and a strong flat waistband."),
        ("장거리 강화바지", "charcoal", "밀도 높은 차콜 원단과 가죽 허리, 이중 무릎을 갖춘 장거리 바지.", "A masterwork pair of straight-leg charcoal trousers with two clearly separate legs, dense woven cloth, leather-reinforced waistband, layered knees, and precise durable seams; no flowing garment panels."),
    ],
    "vest": [
        ("거친 캔버스 조끼", "earth", "갈색 캔버스 두 앞판과 나무 단추를 잇고 밑단을 곧게 만든 조끼.", "A plain functional earth-brown canvas waistcoat with two front panels, a shallow V opening, three matte wood buttons, straight hem, and no chest ornament."),
        ("가죽끈 작업조끼", "leather", "갈색 가죽 끈으로 옆선을 조절하고 작은 앞주머니를 붙인 작업 조끼.", "A practical leather-and-cloth waistcoat with side lacing, one flat pocket, fitted shoulders, a squared hem, and no chest ornament."),
        ("둥근깃 조끼", "slate", "슬레이트 모직에 둥근 깃과 무광 철 단추를 단 단정한 조끼.", "A short slate wool waistcoat with a rounded collar, two neat rows of small matte-iron buttons, shaped armholes, and clean reinforced seams."),
        ("사선잠금 조끼", "green", "채도가 낮은 녹색 가죽 앞판을 사선으로 겹치고 옆 주머니를 낸 조끼.", "A fitted muted-green leather waistcoat with overlapping diagonal front panels, one side pocket, a small shoulder buckle, and practical reinforced edges."),
        ("높은깃 학습조끼", "navy", "남청색 직물에 높은 깃과 네 줄 단추, 안쪽 보강 테를 넣은 조끼.", "A structured navy cloth waistcoat with a high standing collar, four small matte buttons, fitted shoulders, and narrow woven reinforcement along the armholes."),
        ("누빔 앞판 조끼", "earth", "갈색 직물 앞판을 누비고 가죽 허리 조절띠를 단 튼튼한 조끼.", "A sturdy earth-brown padded waistcoat with quilted front panels, fitted shoulders, a broad leather waist adjuster, and two low utility pockets."),
        ("어깨보강 조끼", "charcoal", "차콜 가죽 몸판에 겹친 어깨 플랩과 직조 옆판을 넣은 조끼.", "A charcoal leather waistcoat with layered shoulder flaps, woven side panels, small matte-iron rivets, fitted armholes, and a squared practical hem."),
        ("두꺼운 직조 조끼", "green", "밀도 높은 녹색 직조천과 넓은 앞 여밈, 납작한 주머니 두 개를 가진 조끼.", "A dense muted-green woven waistcoat with a broad central closure, fitted shoulders, two flat utility pockets, and substantial clean edge binding."),
        ("무광 철버클 조끼", "slate", "슬레이트 천 앞판에 작은 무광 철 버클과 구조적인 허리선을 둔 조끼.", "A fitted slate cloth waistcoat with two small matte-iron buckles, a shaped waist seam, reinforced armholes, and a plain functional front."),
        ("이중주머니 조끼", "navy", "남청색 캔버스와 가죽 주머니 덮개를 결합한 실용 조끼.", "A practical navy canvas waistcoat with two layered leather pocket flaps, fitted shoulders, a straight hem, and precise stitched panel joins."),
        ("정밀결구 조끼", "charcoal", "차콜 가죽과 직조천을 정밀하게 이어 어깨와 허리를 보강한 조끼.", "A masterwork charcoal waistcoat combining dense leather front panels and woven side panels, fitted shoulders, precise matte-iron fasteners, and reinforced waist seams."),
        ("고밀도 여행조끼", "navy", "밀도 높은 남청색 직물과 가죽 보강재, 넓은 주머니를 결구한 여행 조끼.", "A masterwork high-density navy travel waistcoat with fitted shoulders, padded reinforcement at chest and waist, broad flat utility pockets, leather edging, and precise functional joinery; no chest ornament."),
    ],
}

# A small negative vocabulary is kept in the API-only framing rather than in
# shop-facing descriptions, so exported designPrompts stay readable.
API_NEGATIVES = (
    "Do not add celestial icons, radiating wheel ornaments, large stones, precious-metal scrollwork, "
    "plumes, regal headwear, glittering effects, large luminous balls, oversized points, or extra charms. "
    "Do not make real weapons, tactical equipment, horror props, or skeletal shapes. "
    "For hats, do not make a modern fedora, cowboy hat, bowler, baseball cap, helmet, visor, or ordinary work cap."
)


def _published_rows() -> list[dict[str, object]]:
    rows = json.loads(PUBLISHED_CATALOG.read_text(encoding="utf-8"))
    if not isinstance(rows, list) or len(rows) != 96:
        raise ValueError("published wardrobe catalog must contain exactly 96 entries")
    return rows


def make_catalog() -> list[dict[str, object]]:
    published = _published_rows()
    published_by_id = {str(item["id"]): item for item in published}
    if len(published_by_id) != 96:
        raise ValueError("published wardrobe ids must be unique")
    if set(published_by_id) != {f"{category}-{index:02d}" for category in CATEGORIES for index in range(1, 13)}:
        raise ValueError("published wardrobe ids do not match the eight 12-item categories")
    catalog: list[dict[str, object]] = []
    for category in CATEGORIES:
        specs = SPECS[category]
        if len(specs) != 12:
            raise ValueError(f"{category}: expected 12 design specs")
        for index, (name, palette_key, description, design_prompt) in enumerate(specs, 1):
            item_id = f"{category}-{index:02d}"
            source = published_by_id[item_id]
            if source["category"] != category or source["price"] != PRICES[index - 1]:
                raise ValueError(f"published id/category/price changed for {item_id}")
            if palette_key not in PALETTE:
                raise ValueError(f"unknown palette key {palette_key} for {item_id}")
            catalog.append({
                "id": item_id,
                "category": category,
                "name": name,
                "price": PRICES[index - 1],
                "color": PALETTE[palette_key],
                "quality": QUALITIES[index - 1],
                "description": description,
                "designPrompt": design_prompt + " " + TIER_NOTES[QUALITIES[index - 1]],
            })
    if len(catalog) != 96:
        raise ValueError("candidate catalog must contain exactly 96 entries")
    return catalog


def validate_catalog(catalog: list[dict[str, object]]) -> None:
    expected_keys = {"id", "category", "name", "price", "color", "quality", "description", "designPrompt"}
    published = {item["id"]: item for item in _published_rows()}
    for index, item in enumerate(catalog):
        if set(item) != expected_keys:
            raise ValueError(f"{item.get('id', index)}: field set changed")
        source = published[item["id"]]
        if (item["id"], item["category"], item["price"]) != (source["id"], source["category"], source["price"]):
            raise ValueError(f"{item['id']}: id/category/price changed")
        if item["color"] not in PALETTE.values():
            raise ValueError(f"{item['id']}: color is outside the restrained palette")
        if not item["name"] or not item["description"] or not item["designPrompt"]:
            raise ValueError(f"{item['id']}: missing candidate copy")
    for category in CATEGORIES:
        rows = [item for item in catalog if item["category"] == category]
        if len(rows) != 12 or [item["price"] for item in rows] != list(PRICES):
            raise ValueError(f"{category}: prices must remain the published array")


def write_catalog(catalog: list[dict[str, object]]) -> None:
    FIELD_DIR.mkdir(parents=True, exist_ok=True)
    CATALOG_PATH.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def sample_groups(catalog: list[dict[str, object]]) -> list[dict[str, object]]:
    by_category = {category: [item for item in catalog if item["category"] == category] for category in CATEGORIES}
    return [
        {
            "id": f"{category}-{SAMPLE_GROUP_SUFFIX}",
            "category": category,
            "items": [by_category[category][index - 1] for index in SAMPLE_INDICES],
        }
        for category in CATEGORIES
    ]


def remaining_groups(catalog: list[dict[str, object]]) -> list[dict[str, object]]:
    """Return exactly the 24 three-item groups not represented by the review sample."""
    by_category = {category: [item for item in catalog if item["category"] == category] for category in CATEGORIES}
    remaining_indices = ((2, 3, 4), (5, 7, 8), (9, 10, 11))
    groups = []
    for category in CATEGORIES:
        entries = by_category[category]
        for indices in remaining_indices:
            groups.append({
                "id": f"{category}-" + "-".join(f"{index:02d}" for index in indices),
                "category": category,
                "items": [entries[index - 1] for index in indices],
            })
    return groups


def all_groups(catalog: list[dict[str, object]]) -> list[dict[str, object]]:
    """Return the eight cached sample groups plus the 24 remaining groups."""
    return sample_groups(catalog) + remaining_groups(catalog)


def _archive_hat_revision_inputs() -> Path:
    """Archive rejected hat raw/crops and the pre-revision provenance exactly once."""
    revision_dir = ARCHIVE_DIR / "hat-before-revision"
    if revision_dir.exists():
        return revision_dir
    revision_dir.mkdir(parents=True, exist_ok=True)
    for source, target_name in (
        (PROVENANCE_PATH, "provenance-before-hat-revision.json"),
        (MANIFEST_PATH, "manifest-before-hat-revision.json"),
    ):
        if source.is_file():
            shutil.copy2(source, revision_dir / target_name)
    for source_dir, target_dir_name, names in (
        (SHEET_DIR, "sheets", ["hat-samples-01-06-12.png"]),
        (DESIGN_DIR, "designs", [f"hat-{index:02d}.webp" for index in SAMPLE_INDICES]),
        (THUMB_DIR, "thumbs", [f"hat-{index:02d}.webp" for index in SAMPLE_INDICES]),
    ):
        target_dir = revision_dir / target_dir_name
        target_dir.mkdir(parents=True, exist_ok=True)
        for name in names:
            source = source_dir / name
            if source.is_file():
                shutil.move(str(source), str(target_dir / name))
    return revision_dir


def _archived_initial_groups() -> list[dict[str, object]]:
    archived = ARCHIVE_DIR / "hat-before-revision" / "provenance-before-hat-revision.json"
    if not archived.is_file():
        return []
    data = json.loads(archived.read_text(encoding="utf-8"))
    return list(data.get("groups", []))


def group_prompt(group: dict[str, object]) -> str:
    category = str(group["category"])
    lines = []
    for position, item in zip(("LEFT", "MIDDLE", "RIGHT"), group["items"]):
        lines.append(
            f"{position} panel — {item['id']} — {item['quality']} tier — {item['color']}: {item['designPrompt']}"
        )
    orientation = ""
    if category == "hat":
        orientation = " Every hat must have a recognizable practical wizard silhouette: a low or moderate tapered/asymmetric pointed crown and a strengthened brim; vary crown structures rather than making ordinary modern brimmed caps."
    elif category == "wand":
        orientation = " Every wand must be vertical, with HANDLE at the bottom and TIP at the top."
    elif category == "broom":
        orientation = " Every broom must be vertical, with HANDLE at the top and BRISTLES at the bottom."
    elif category == "gloves":
        orientation = " Show two empty product glove forms per design, fingers curled into closed fists; never open hands."
    elif category == "cloak":
        orientation = " Every cloak has a hood fully DOWN behind the neck and fitted shoulders and sleeves; follow each item's open or closed construction exactly. An OPEN design has an actual transparent front opening; a closed wrap coat or poncho has a solid fabric front with no inner body or shirt."
    elif category == "pants":
        orientation = " Show a clear pair of separate straight legs; no extra garment panels."
    elif category == "vest":
        orientation = " Treat every item as a functional waistcoat with fitted shoulders or padded reinforcement; no chest ornament."
    return (
        "Create a restrained, sturdy product sheet for a friendly stylized 3D fantasy wizard game. "
        "MANDATORY CANVAS: exactly 1536x1024 pixels, true transparent background. "
        "Divide the canvas into three equal 512x1024 vertical panels. Render exactly one complete unoccupied "
        f"{category} design in each panel, with generous transparent cell margins. "
        "Each object must stay wholly inside its own panel and be fully visible; no neighboring bits may cross a boundary. "
        "Use matte charcoal, slate, earth brown, muted navy or muted green with matte iron or brushed steel, wood, leather, and woven cloth. "
        "Higher tiers look denser and more structurally reinforced, with substantial clean forms and precise functional joinery, never flashy. "
        "No people, faces, bodies, mannequins, hangers, hands, scenes, floors, cast shadows, text, logos, frames, borders, or painted backdrop. "
        "Keep the full object isolated as a product cutout. "
        + API_NEGATIVES
        + orientation
        + "\n\n"
        + "\n".join(lines)
    )


def request_sheet(group: dict[str, object], quality: str = "high") -> bytes:
    payload = json.dumps({
        "model": MODEL,
        "prompt": group_prompt(group),
        "size": "1536x1024",
        "quality": quality,
        "background": "transparent",
        "output_format": "png",
        "n": 1,
    }).encode("utf-8")
    key = os.environ.get("OPENAI_API_KEY")
    if not key:
        raise RuntimeError("OPENAI_API_KEY is not configured")
    request = urllib.request.Request(
        "https://api.openai.com/v1/images/generations",
        data=payload,
        headers={"Authorization": "Bearer " + key, "Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(request, timeout=600) as response:
            result = json.load(response)
    except urllib.error.HTTPError as error:
        try:
            detail = json.loads(error.read()).get("error", {}).get("message", "image API error")
        except (ValueError, UnicodeDecodeError):
            detail = "image API error"
        raise RuntimeError(f"{group['id']}: HTTP {error.code}: {detail}") from None
    encoded = result.get("data", [{}])[0].get("b64_json")
    if not encoded:
        raise RuntimeError(f"{group['id']}: image API returned no b64_json")
    return base64.b64decode(encoded, validate=True)


PANTS01_EDIT_PROMPT = (
    "Edit the supplied isolated product image of plain low-tier charcoal straight-leg wizard trousers. "
    "Preserve the exact front-facing product pose, two separate legs, full silhouette, framing, matte dark cloth, "
    "and true transparent background. Add only modest functional matte knee reinforcement panels over both knees "
    "and tidy double stitching running along each lower-leg seam from the knee toward the hem. "
    "Keep this an inexpensive basic item: subtle cloth reinforcement and visible utility stitching, not armor, "
    "jewelry, gems, shine, ornament, extra pockets, belt, logo, text, robe, skirt, person, body, or mannequin. "
    "Return one complete isolated pair of trousers with no other object."
)


def request_single_item_edit(source_path: Path, prompt: str, quality: str = "high") -> bytes:
    """Run one OpenAI image edit using the existing isolated product crop."""
    key = os.environ.get("OPENAI_API_KEY")
    if not key:
        raise RuntimeError("OPENAI_API_KEY is not configured")
    source_buffer = io.BytesIO()
    with Image.open(source_path) as source:
        source.convert("RGBA").save(source_buffer, format="PNG")
    boundary = "field-pants-" + hashlib.sha256(source_buffer.getvalue()).hexdigest()[:24]
    fields = {
        "model": MODEL,
        "prompt": prompt,
        "size": "1024x1536",
        "quality": quality,
        "background": "transparent",
        "output_format": "png",
        "n": "1",
    }
    parts: list[bytes] = []
    for name, value in fields.items():
        parts.append(
            f"--{boundary}\r\nContent-Disposition: form-data; name=\"{name}\"\r\n\r\n{value}\r\n".encode()
        )
    parts.append(
        f"--{boundary}\r\nContent-Disposition: form-data; name=\"image[]\"; "
        f"filename=\"pants-01-source.png\"\r\nContent-Type: image/png\r\n\r\n".encode()
    )
    parts.append(source_buffer.getvalue())
    parts.append(b"\r\n")
    parts.append(f"--{boundary}--\r\n".encode())
    request = urllib.request.Request(
        "https://api.openai.com/v1/images/edits",
        data=b"".join(parts),
        headers={
            "Authorization": "Bearer " + key,
            "Content-Type": "multipart/form-data; boundary=" + boundary,
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=600) as response:
            result = json.load(response)
    except urllib.error.HTTPError as error:
        try:
            detail = json.loads(error.read()).get("error", {}).get("message", "image edit error")
        except (ValueError, UnicodeDecodeError):
            detail = "image edit error"
        raise RuntimeError(f"pants-01-revision: HTTP {error.code}: {detail}") from None
    encoded = result.get("data", [{}])[0].get("b64_json")
    if not encoded:
        raise RuntimeError("pants-01-revision: image edit returned no b64_json")
    return base64.b64decode(encoded, validate=True)


def _trim_single_item(image: Image.Image, item_id: str) -> Image.Image:
    image = image.convert("RGBA")
    alpha = image.getchannel("A")
    if alpha.getextrema()[0] > 0:
        raise ValueError(f"{item_id}: edited image has no transparent margin")
    visible = alpha.point(lambda value: value if value >= 220 else 0)
    image.putalpha(visible)
    image = _cleanup_detached_alpha(image, minimum_component=1000)
    bbox = image.getchannel("A").getbbox()
    if bbox is None:
        raise ValueError(f"{item_id}: edited image has no visible object")
    return image.crop(bbox)


def _archive_pants_revision_inputs() -> Path:
    """Preserve the old pants crop, raw sheet, catalog, and receipt before edit."""
    archive = ARCHIVE_DIR / "pants-01-before-revision"
    if archive.exists():
        return archive
    archive.mkdir(parents=True, exist_ok=True)
    for source, target_name in (
        (PUBLISHED_CATALOG, "published-catalog.json"),
        (CATALOG_PATH, "candidate-catalog-before-revision.json"),
        (PROVENANCE_PATH, "provenance-before-pants-01-revision.json"),
        (MANIFEST_PATH, "manifest-before-pants-01-revision.json"),
    ):
        if source.is_file():
            shutil.copy2(source, archive / target_name)
    for source_dir, target_dir_name, names in (
        (SHEET_DIR, "sheets", ["pants-samples-01-06-12.png"]),
        (DESIGN_DIR, "designs", ["pants-01.webp"]),
        (THUMB_DIR, "thumbs", ["pants-01.webp"]),
    ):
        target_dir = archive / target_dir_name
        target_dir.mkdir(parents=True, exist_ok=True)
        for name in names:
            source = source_dir / name
            if source.is_file():
                shutil.copy2(source, target_dir / name)
    return archive


def _load_item_revision(item_id: str) -> dict[str, object] | None:
    """Return an active single-item overlay, never falling back to its old sheet."""
    if item_id != "pants-01" or not PANTS_REVISION_RECORD.is_file():
        return None
    revision = json.loads(PANTS_REVISION_RECORD.read_text(encoding="utf-8"))
    source_path, thumb_path = _item_paths(item_id)
    if not source_path.is_file() or not thumb_path.is_file():
        raise RuntimeError(f"{item_id}: revision receipt exists but revised design/thumb is missing")
    return revision


def _revision_item_record(item_id: str, revision: dict[str, object]) -> dict[str, object]:
    source_path, thumb_path = _item_paths(item_id)
    with Image.open(source_path) as image:
        source_size = list(image.size)
    return {
        "id": item_id,
        "source": str(source_path.relative_to(ROOT)),
        "thumbnail": str(thumb_path.relative_to(ROOT)),
        "sourceSize": source_size,
        "sha256": hashlib.sha256(source_path.read_bytes()).hexdigest(),
        "revision": str(revision.get("revisionId", "single-item-edit")),
    }


def _cleanup_detached_alpha(image: Image.Image, minimum_component: int = 1000) -> Image.Image:
    """Drop tiny disconnected alpha islands without touching RGB art."""
    alpha = image.getchannel("A")
    width, height = image.size
    mask = alpha.load()
    visited = bytearray(width * height)
    components: list[list[tuple[int, int]]] = []
    for y in range(height):
        for x in range(width):
            offset = y * width + x
            if visited[offset] or mask[x, y] < 220:
                continue
            queue = deque([(x, y)])
            visited[offset] = 1
            component: list[tuple[int, int]] = []
            while queue:
                cx, cy = queue.popleft()
                component.append((cx, cy))
                for nx in range(max(0, cx - 1), min(width, cx + 2)):
                    for ny in range(max(0, cy - 1), min(height, cy + 2)):
                        if nx == cx and ny == cy:
                            continue
                        neighbor = ny * width + nx
                        if not visited[neighbor] and mask[nx, ny] >= 220:
                            visited[neighbor] = 1
                            queue.append((nx, ny))
            components.append(component)
    if len(components) <= 1:
        return image
    keep = {id(component) for component in components if len(component) >= minimum_component}
    if not keep:
        keep = {id(max(components, key=len))}
    for component in components:
        if id(component) in keep:
            continue
        for x, y in component:
            mask[x, y] = 0
    image.putalpha(alpha)
    return image


def _trim_panel(sheet: Image.Image, item_id: str, panel_index: int) -> Image.Image:
    if sheet.size != SOURCE_SIZE:
        raise ValueError(f"{item_id}: expected 1536x1024 sheet, got {sheet.size}")
    panel = sheet.crop((panel_index * PANEL_SIZE[0], 0, (panel_index + 1) * PANEL_SIZE[0], PANEL_SIZE[1])).convert("RGBA")
    alpha = panel.getchannel("A")
    if alpha.getextrema()[0] > 0:
        raise ValueError(f"{item_id}: generated panel has no transparent margin")
    # Remove only faint alpha haze; this is an alpha cleanup, not painted art.
    visible = alpha.point(lambda value: value if value >= 220 else 0)
    panel.putalpha(visible)
    # Generated alpha can contain isolated one-pixel specks. Keep all
    # substantial product components (gloves intentionally have two), while
    # removing only tiny disconnected islands; this is technical alpha
    # cleanup, never painted content.
    panel = _cleanup_detached_alpha(panel)
    visible = panel.getchannel("A")
    bbox = visible.getbbox()
    if bbox is None:
        raise ValueError(f"{item_id}: generated panel has no visible object")
    return panel.crop(bbox)


def _thumbnail(image: Image.Image) -> Image.Image:
    max_extent = round(THUMBNAIL_SIZE * (1 - 2 * PADDING))
    scale = min(max_extent / image.width, max_extent / image.height)
    size = (max(1, round(image.width * scale)), max(1, round(image.height * scale)))
    fitted = image.resize(size, Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (THUMBNAIL_SIZE, THUMBNAIL_SIZE), (0, 0, 0, 0))
    canvas.alpha_composite(fitted, ((THUMBNAIL_SIZE - size[0]) // 2, (THUMBNAIL_SIZE - size[1]) // 2))
    return canvas


def _item_paths(item_id: str) -> tuple[Path, Path]:
    return DESIGN_DIR / f"{item_id}.webp", THUMB_DIR / f"{item_id}.webp"


def _group_complete(group: dict[str, object]) -> bool:
    sheet_path = SHEET_DIR / f"{group['id']}.png"
    return sheet_path.is_file() and all(all(path.is_file() for path in _item_paths(item["id"])) for item in group["items"])


def _extract_group(group: dict[str, object], raw: bytes, status: str) -> dict[str, object]:
    FIELD_DIR.mkdir(parents=True, exist_ok=True)
    SHEET_DIR.mkdir(parents=True, exist_ok=True)
    DESIGN_DIR.mkdir(parents=True, exist_ok=True)
    THUMB_DIR.mkdir(parents=True, exist_ok=True)
    sheet_path = SHEET_DIR / f"{group['id']}.png"
    temporary = sheet_path.with_suffix(".part.png")
    temporary.write_bytes(raw)
    temporary.replace(sheet_path)
    with Image.open(io.BytesIO(raw)) as opened:
        sheet = opened.convert("RGBA")
    records = []
    revision_ids = []
    for panel_index, item in enumerate(group["items"]):
        item_id = str(item["id"])
        revision = _load_item_revision(item_id)
        if revision is not None:
            # The raw three-panel sheet remains provenance, but its obsolete
            # pants-01 crop must never overwrite the single-item overlay.
            records.append(_revision_item_record(item_id, revision))
            revision_ids.append(item_id)
            continue
        source_path, thumb_path = _item_paths(item_id)
        if source_path.is_file() and thumb_path.is_file():
            # A complete cached crop is immutable candidate art. Do not
            # rewrite accepted designs merely because --all refreshed receipts.
            with Image.open(source_path) as existing:
                source_size = list(existing.size)
            records.append({
                "id": item_id,
                "source": str(source_path.relative_to(ROOT)),
                "thumbnail": str(thumb_path.relative_to(ROOT)),
                "sourceSize": source_size,
                "sha256": hashlib.sha256(source_path.read_bytes()).hexdigest(),
            })
            continue
        cropped = _trim_panel(sheet, item_id, panel_index)
        source_tmp = source_path.with_suffix(".part.webp")
        thumb_tmp = thumb_path.with_suffix(".part.webp")
        cropped.save(source_tmp, format="WEBP", lossless=True, method=6)
        _thumbnail(cropped).save(thumb_tmp, format="WEBP", lossless=True, method=6)
        source_tmp.replace(source_path)
        thumb_tmp.replace(thumb_path)
        encoded = io.BytesIO()
        cropped.save(encoded, format="WEBP", lossless=True, method=6)
        records.append({
            "id": item_id,
            "source": str(source_path.relative_to(ROOT)),
            "thumbnail": str(thumb_path.relative_to(ROOT)),
            "sourceSize": list(cropped.size),
            "sha256": hashlib.sha256(encoded.getvalue()).hexdigest(),
        })
    return {
        "id": group["id"],
        "category": group["category"],
        "items": records,
        "status": status,
        "sheet": str(sheet_path.relative_to(ROOT)),
        "sheetSha256": hashlib.sha256(raw).hexdigest(),
        "prompt": group_prompt(group),
        "model": MODEL,
        "revisionOverlay": revision_ids,
    }


def process_group(group: dict[str, object], quality: str, generated_status: str = "generated") -> dict[str, object]:
    sheet_path = SHEET_DIR / f"{group['id']}.png"
    if _group_complete(group):
        raw = sheet_path.read_bytes()
        return _extract_group(group, raw, "skipped-existing")
    if sheet_path.is_file():
        # A prior process can have saved the raw response before being
        # interrupted during crop/write.  Resume locally without an API call.
        return _extract_group(group, sheet_path.read_bytes(), "resumed-raw-sheet")
    raw = request_sheet(group, quality)
    return _extract_group(group, raw, generated_status)


def _sample_contact_sheet(catalog: list[dict[str, object]], output: Path) -> None:
    sample_items = [item for item in catalog if int(str(item["id"]).split("-")[-1]) in SAMPLE_INDICES]
    width, cell = 3 * 360, 360
    height = len(CATEGORIES) * cell
    contact = Image.new("RGBA", (width, height), (239, 239, 235, 255))
    draw = ImageDraw.Draw(contact)
    by_category = {category: [item for item in sample_items if item["category"] == category] for category in CATEGORIES}
    for row, category in enumerate(CATEGORIES):
        draw.text((8, row * cell + 6), category, fill=(35, 42, 46, 255))
        for column, item in enumerate(by_category[category]):
            thumbnail = THUMB_DIR / f"{item['id']}.webp"
            if not thumbnail.is_file():
                continue
            with Image.open(thumbnail) as opened:
                image = opened.convert("RGBA").resize((300, 300), Image.Resampling.LANCZOS)
            x = column * cell + 30
            y = row * cell + 36
            contact.alpha_composite(image, (x, y))
            draw.text((x, row * cell + 338), str(item["id"]), fill=(35, 42, 46, 255))
    output.parent.mkdir(parents=True, exist_ok=True)
    contact.save(output, format="PNG")
    # Keep a copy with the candidate provenance, without touching live assets.
    contact.save(FIELD_DIR / "sample-contact-sheet.png", format="PNG")


def _full_contact_sheets(catalog: list[dict[str, object]], output_dir: Path) -> list[Path]:
    """Write one 12-item contact sheet per category plus a compact full sheet."""
    output_dir.mkdir(parents=True, exist_ok=True)
    paths: list[Path] = []
    cell = 300
    columns = 4
    rows = 3
    for category in CATEGORIES:
        contact = Image.new("RGBA", (columns * cell, rows * cell), (239, 239, 235, 255))
        draw = ImageDraw.Draw(contact)
        items = [item for item in catalog if item["category"] == category]
        for index, item in enumerate(items):
            thumbnail = THUMB_DIR / f"{item['id']}.webp"
            if not thumbnail.is_file():
                continue
            with Image.open(thumbnail) as opened:
                image = opened.convert("RGBA").resize((250, 250), Image.Resampling.LANCZOS)
            x = (index % columns) * cell + 25
            y = (index // columns) * cell + 8
            contact.alpha_composite(image, (x, y))
            draw.text((x, y + 258), str(item["id"]), fill=(35, 42, 46, 255))
        path = output_dir / f"{category}-contact-sheet.png"
        contact.save(path, format="PNG")
        paths.append(path)

    full = Image.new("RGBA", (columns * cell, len(CATEGORIES) * rows * cell), (239, 239, 235, 255))
    for row, category in enumerate(CATEGORIES):
        path = output_dir / f"{category}-contact-sheet.png"
        with Image.open(path) as opened:
            full.alpha_composite(opened.convert("RGBA"), (0, row * rows * cell))
    full_path = FIELD_DIR / "contact-sheet.png"
    full.save(full_path, format="PNG")
    paths.append(full_path)
    return paths


def _revision_receipts() -> list[dict[str, object]]:
    receipts = []
    for path in sorted(REVISION_DIR.glob("*.json")):
        try:
            receipts.append(json.loads(path.read_text(encoding="utf-8")))
        except (OSError, json.JSONDecodeError):
            continue
    return receipts


def write_provenance(
    catalog: list[dict[str, object]],
    records: list[dict[str, object]],
    quality: str,
    sample_contact_path: Path,
    api_history: list[dict[str, object]],
    full_contact_paths: list[Path] | None = None,
) -> None:
    FIELD_DIR.mkdir(parents=True, exist_ok=True)
    serialized_catalog = CATALOG_PATH.read_bytes()
    historical_calls = sum(int(entry.get("calls", 0)) for entry in api_history if entry["phase"] == "initial-review")
    current_calls = sum(int(entry.get("calls", 0)) for entry in api_history if entry["phase"] != "initial-review")
    provenance = {
        "schemaVersion": 1,
        "sourceCatalog": str(PUBLISHED_CATALOG.relative_to(ROOT)),
        "candidateCatalog": str(CATALOG_PATH.relative_to(ROOT)),
        "sourceCatalogSha256": hashlib.sha256(PUBLISHED_CATALOG.read_bytes()).hexdigest(),
        "candidateCatalogSha256": hashlib.sha256(serialized_catalog).hexdigest(),
        "model": MODEL,
        "quality": quality,
        "background": "transparent",
        "sourceSize": list(SOURCE_SIZE),
        "panelSize": list(PANEL_SIZE),
        "thumbnailSize": [THUMBNAIL_SIZE, THUMBNAIL_SIZE],
        "padding": PADDING,
        "sampleIndices": list(SAMPLE_INDICES),
        "requestedApiCalls": current_calls,
        "historicalApiCalls": historical_calls,
        "totalApiCalls": historical_calls + current_calls,
        "apiCalls": historical_calls + current_calls,
        "apiCallHistory": api_history,
        "generatedApiCalls": current_calls,
        "generatedAt": dt.datetime.now(dt.timezone.utc).isoformat(),
        "sampleContactSheet": str(sample_contact_path),
        "fullContactSheets": [
            str(path.relative_to(ROOT)) if path.is_absolute() and str(path).startswith(str(ROOT)) else str(path)
            for path in (full_contact_paths or [])
        ],
        "singleItemRevisions": _revision_receipts(),
        "groups": records,
        "sampleIds": [item["id"] for item in catalog if int(str(item["id"]).split("-")[-1]) in SAMPLE_INDICES],
        "itemCount": len(catalog),
    }
    serialized = json.dumps(provenance, ensure_ascii=False, indent=2) + "\n"
    PROVENANCE_PATH.write_text(serialized, encoding="utf-8")
    # Keep the familiar generator-manifest name beside the provenance alias;
    # both stay entirely inside the candidate field-wardrobe directory.
    MANIFEST_PATH.write_text(serialized, encoding="utf-8")


def _ordered_records(records: list[dict[str, object]]) -> list[dict[str, object]]:
    order = {category: index for index, category in enumerate(CATEGORIES)}
    return sorted(records, key=lambda record: (order[record["category"]], str(record["id"])))


def _initial_history() -> list[dict[str, object]]:
    return [{
        "phase": "initial-review",
        "calls": 8,
        "groups": [f"{category}-{SAMPLE_GROUP_SUFFIX}" for category in CATEGORIES],
        "source": "scripts/art-sources/field-wardrobe/archive/hat-before-revision/provenance-before-hat-revision.json",
        "note": "Historical accepted review calls; not rerun during the hat revision or remaining batch.",
    }]


def _current_history() -> list[dict[str, object]]:
    if PROVENANCE_PATH.is_file():
        data = json.loads(PROVENANCE_PATH.read_text(encoding="utf-8"))
        history = data.get("apiCallHistory")
        if isinstance(history, list) and history:
            return history
    return _initial_history()


def generate_samples(catalog: list[dict[str, object]], quality: str, max_parallel: int) -> list[dict[str, object]]:
    groups = sample_groups(catalog)
    records: list[dict[str, object]] = []
    failures: list[str] = []
    with ThreadPoolExecutor(max_workers=max_parallel) as executor:
        futures = {executor.submit(process_group, group, quality): group for group in groups}
        for future in as_completed(futures):
            group = futures[future]
            try:
                record = future.result()
                records.append(record)
                print(f"{record['id']}: {record['status']}", flush=True)
            except Exception as error:
                failures.append(f"{group['id']}: {error}")
                print(f"FAILED {group['id']}: {error}", flush=True)
    if failures:
        raise RuntimeError("; ".join(failures))
    records = _ordered_records(records)
    contact_path = Path("/tmp/paper-doll-qa/field-wardrobe-samples.png")
    _sample_contact_sheet(catalog, contact_path)
    write_provenance(catalog, records, quality, contact_path, [{
        "phase": "initial-review",
        "calls": sum(record["status"] == "generated" for record in records),
        "groups": [record["id"] for record in records if record["status"] == "generated"],
    }])
    return records


def generate_hat_revision(catalog: list[dict[str, object]], quality: str, max_parallel: int) -> list[dict[str, object]]:
    revision_dir = _archive_hat_revision_inputs()
    groups = sample_groups(catalog)
    hat_group = next(group for group in groups if group["category"] == "hat")
    if _group_complete(hat_group) and PROVENANCE_PATH.is_file():
        print("hat-samples-01-06-12: skipped-existing-revision", flush=True)
        records = [process_group(group, quality) for group in groups]
        history = _current_history()
    else:
        hat_record = process_group(hat_group, quality, generated_status="generated-hat-revision")
        records = [hat_record]
        for group in groups:
            if group["category"] != "hat":
                records.append(process_group(group, quality))
        records = _ordered_records(records)
        history = _initial_history() + [{
            "phase": "hat-revision",
            "calls": 1 if hat_record["status"] == "generated-hat-revision" else 0,
            "groups": [hat_record["id"]] if hat_record["status"] == "generated-hat-revision" else [],
            "archive": str(revision_dir.relative_to(ROOT)),
            "note": "Rejected hat sheet/crops and pre-revision provenance are archived; accepted non-hat samples were reused.",
        }]
    contact_path = Path("/tmp/paper-doll-qa/field-wardrobe-samples.png")
    _sample_contact_sheet(catalog, contact_path)
    write_provenance(catalog, _ordered_records(records), quality, contact_path, history)
    print("Hat review samples ready: hat-01, hat-06, hat-12", flush=True)
    return _ordered_records(records)


def generate_remaining(
    catalog: list[dict[str, object]],
    quality: str,
    max_parallel: int,
    history_override: list[dict[str, object]] | None = None,
) -> list[dict[str, object]]:
    revision_dir = ARCHIVE_DIR / "hat-before-revision"
    if not revision_dir.is_dir():
        raise RuntimeError("run --hat-sample first; the rejected hat review must be archived before --all")
    groups = all_groups(catalog)
    records: list[dict[str, object]] = []
    failures: list[str] = []
    with ThreadPoolExecutor(max_workers=max_parallel) as executor:
        futures = {executor.submit(process_group, group, quality): group for group in groups}
        for future in as_completed(futures):
            group = futures[future]
            try:
                record = future.result()
                records.append(record)
                print(f"{record['id']}: {record['status']}", flush=True)
            except Exception as error:
                failures.append(f"{group['id']}: {error}")
                print(f"FAILED {group['id']}: {error}", flush=True)
    if failures:
        raise RuntimeError("; ".join(failures))
    records = _ordered_records(records)
    generated_groups = [record["id"] for record in records if record["status"] == "generated"]
    history = history_override if history_override is not None else _current_history()
    if generated_groups:
        history = history + [{
            "phase": "remaining-72",
            "calls": len(generated_groups),
            "groups": generated_groups,
            "note": "Three-item groups generated after the accepted 21 samples and revised hat trio.",
        }]
    else:
        # A later local resume re-extracts completed sheets for alpha cleanup
        # and updated prompts. Preserve the original API provenance status
        # rather than making completed remote work look newly skipped.
        historical_generated = {
            group_id
            for entry in history
            if entry["phase"] == "remaining-72"
            for group_id in entry.get("groups", [])
        }
        revised_hat = {
            group_id
            for entry in history
            if entry["phase"] == "hat-revision"
            for group_id in entry.get("groups", [])
        }
        for record in records:
            if record["id"] in historical_generated:
                record["status"] = "generated"
            elif record["id"] in revised_hat:
                record["status"] = "generated-hat-revision"
            elif record["id"].endswith(SAMPLE_GROUP_SUFFIX):
                record["status"] = "preserved-accepted"
    sample_contact_path = Path("/tmp/paper-doll-qa/field-wardrobe-samples.png")
    _sample_contact_sheet(catalog, sample_contact_path)
    full_contact_paths = _full_contact_sheets(catalog, CONTACT_DIR)
    write_provenance(catalog, records, quality, sample_contact_path, history, full_contact_paths)
    print(f"Full candidate wardrobe ready: {len(records)} sheets, {len(generated_groups)} API calls this pass", flush=True)
    return records


def _write_pants_comparison(old_source: Path, revised_source: Path, output: Path) -> None:
    """Render a neutral three-way QA comparison without altering either source."""
    panels = [
        (STARTER_PANTS_PATH, "starter-pants (baseline 0)"),
        (old_source, "field pants-01 before"),
        (revised_source, "field pants-01 revised"),
    ]
    panel_width, panel_height = 420, 620
    comparison = Image.new("RGBA", (panel_width * len(panels), panel_height), (239, 239, 235, 255))
    draw = ImageDraw.Draw(comparison)
    for index, (source, label) in enumerate(panels):
        with Image.open(source) as opened:
            image = opened.convert("RGBA")
        max_width, max_height = panel_width - 36, panel_height - 70
        scale = min(max_width / image.width, max_height / image.height)
        size = (max(1, round(image.width * scale)), max(1, round(image.height * scale)))
        fitted = image.resize(size, Image.Resampling.LANCZOS)
        x = index * panel_width + (panel_width - size[0]) // 2
        y = 20 + (max_height - size[1]) // 2
        comparison.alpha_composite(fitted, (x, y))
        draw.text((index * panel_width + 12, panel_height - 36), label, fill=(35, 42, 46, 255))
    output.parent.mkdir(parents=True, exist_ok=True)
    comparison.save(output, format="PNG")


def generate_pants01_revision(catalog: list[dict[str, object]], quality: str) -> None:
    """Make exactly one pants-01 edit, then refresh local full-batch receipts."""
    existing_revision = _load_item_revision("pants-01")
    if existing_revision is not None:
        print("pants-01-revision: skipped-existing (no API call)", flush=True)
        generate_remaining(catalog, quality, 1)
        return

    archive = _archive_pants_revision_inputs()
    old_source = archive / "designs" / "pants-01.webp"
    if not old_source.is_file():
        raise RuntimeError("pants-01 revision archive is missing the old design crop")
    source = old_source
    REVISION_DIR.mkdir(parents=True, exist_ok=True)
    if PANTS_REVISION_RAW.is_file():
        # A prior process may have persisted the response before being
        # interrupted. Resume locally rather than spending a second call.
        raw = PANTS_REVISION_RAW.read_bytes()
        api_calls = 0
        call_status = "resumed-raw-response"
    else:
        raw = request_single_item_edit(source, PANTS01_EDIT_PROMPT, quality)
        temporary_raw = PANTS_REVISION_RAW.with_suffix(".part.png")
        temporary_raw.write_bytes(raw)
        temporary_raw.replace(PANTS_REVISION_RAW)
        api_calls = 1
        call_status = "generated"
    with Image.open(io.BytesIO(raw)) as opened:
        revised = _trim_single_item(opened, "pants-01")

    design_path, thumb_path = _item_paths("pants-01")
    design_tmp = design_path.with_suffix(".part.webp")
    thumb_tmp = thumb_path.with_suffix(".part.webp")
    design_tmp.parent.mkdir(parents=True, exist_ok=True)
    thumb_tmp.parent.mkdir(parents=True, exist_ok=True)
    revised.save(design_tmp, format="WEBP", lossless=True, method=6)
    _thumbnail(revised).save(thumb_tmp, format="WEBP", lossless=True, method=6)
    design_tmp.replace(design_path)
    thumb_tmp.replace(thumb_path)

    comparison_path = Path("/tmp/paper-doll-qa/field-pants01-vs-starter.png")
    _write_pants_comparison(old_source, design_path, comparison_path)
    with Image.open(source) as source_image:
        source_size = list(source_image.size)
    revision = {
        "revisionId": "pants-01-single-item-edit",
        "item": "pants-01",
        "kind": "single-item-edit-overlay",
        "status": call_status,
        "apiCalls": api_calls,
        "model": MODEL,
        "quality": quality,
        "prompt": PANTS01_EDIT_PROMPT,
        "source": str(old_source.relative_to(ROOT)),
        "sourceSha256": hashlib.sha256(old_source.read_bytes()).hexdigest(),
        "rawResponse": str(PANTS_REVISION_RAW.relative_to(ROOT)),
        "rawResponseSha256": hashlib.sha256(PANTS_REVISION_RAW.read_bytes()).hexdigest(),
        "output": str(design_path.relative_to(ROOT)),
        "outputSha256": hashlib.sha256(design_path.read_bytes()).hexdigest(),
        "thumbnail": str(thumb_path.relative_to(ROOT)),
        "comparison": str(comparison_path),
        "baseline": str(STARTER_PANTS_PATH.relative_to(ROOT)),
        "baselineSha256": hashlib.sha256(STARTER_PANTS_PATH.read_bytes()).hexdigest(),
        "baselinePreserved": True,
        "archive": str(archive.relative_to(ROOT)),
        "sourceSize": source_size,
        "outputSize": list(revised.size),
        "generatedAt": dt.datetime.now(dt.timezone.utc).isoformat(),
    }
    PANTS_REVISION_RECORD.write_text(
        json.dumps(revision, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    history = _current_history()
    if api_calls:
        history = history + [{
            "phase": "pants-01-revision",
            "calls": api_calls,
            "groups": ["pants-01-single-item-edit"],
            "overlay": str(PANTS_REVISION_RECORD.relative_to(ROOT)),
            "archive": str(archive.relative_to(ROOT)),
            "note": "One OpenAI edit overlays the pants-01 crop; future --all runs never extract pants-01 from its old sheet.",
        }]
    generate_remaining(catalog, quality, 1, history_override=history)
    print("pants-01 revision ready: one edit call, baseline preserved, overlay recorded", flush=True)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--catalog-only", action="store_true", help="write the 96-item candidate catalog and stop")
    parser.add_argument("--samples", action="store_true", help="generate the initial 24 review samples")
    parser.add_argument("--hat-sample", action="store_true", help="archive rejected hats and regenerate only hat-01, hat-06, hat-12")
    parser.add_argument("--pants01-revision", action="store_true", help="edit only pants-01 once and overlay it over the cached sample crop")
    parser.add_argument("--all", action="store_true", help="preserve/reuse samples and generate the remaining 72 designs in 24 three-item calls")
    parser.add_argument("--quality", choices=("medium", "high"), default="high")
    parser.add_argument("--max-parallel", type=int, choices=range(1, 5), default=4)
    args = parser.parse_args()
    modes = sum(bool(value) for value in (args.catalog_only, args.samples, args.hat_sample, args.pants01_revision, args.all))
    if modes != 1:
        parser.error("choose exactly one of --catalog-only, --samples, --hat-sample, --pants01-revision, or --all")
    catalog = make_catalog()
    validate_catalog(catalog)
    if args.pants01_revision and _load_item_revision("pants-01") is None:
        _archive_pants_revision_inputs()
    write_catalog(catalog)
    print(f"Wrote candidate catalog: {CATALOG_PATH.relative_to(ROOT)} ({len(catalog)} items)", flush=True)
    if args.catalog_only:
        return
    if args.samples:
        records = generate_samples(catalog, args.quality, args.max_parallel)
        print(f"Wrote {len(records)} sample sheets / 24 sample items", flush=True)
    elif args.hat_sample:
        generate_hat_revision(catalog, args.quality, args.max_parallel)
    elif args.pants01_revision:
        generate_pants01_revision(catalog, args.quality)
    else:
        generate_remaining(catalog, args.quality, args.max_parallel)


if __name__ == "__main__":
    main()
