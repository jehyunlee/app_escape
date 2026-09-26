"""Generate the 96 independently designed wardrobe shop items.

Each category is generated in four three-item sheets.  A sheet is a 1536x1024
transparent image with one different design in each 512px panel.  The panels
are cropped without resizing into assets/shop-designs/<id>.webp and then fitted
into 384px square thumbnails in assets/shop-items/<id>.webp.
"""
from __future__ import annotations

import argparse
import base64
import datetime as dt
import hashlib
import io
import json
import os
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
import urllib.error
import urllib.request

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
CATALOG_PATH = ROOT / "assets" / "wardrobe-catalog.json"
DESIGN_DIR = ROOT / "assets" / "shop-designs"
ITEM_DIR = ROOT / "assets" / "shop-items"
MODEL = "gpt-image-2.5-flare"
SOURCE_SIZE = (1536, 1024)
PANEL_SIZE = (512, 1024)
THUMBNAIL_SIZE = 384
PADDING = 0.12
PRICES = (1, 3, 5, 8, 12, 18, 26, 38, 52, 68, 84, 100)
QUALITIES = ("basic", "basic", "standard", "standard", "fine", "fine", "fine", "masterwork", "masterwork", "masterwork", "masterwork", "masterwork")
CATEGORIES = ("hat", "necklace", "cloak", "wand", "broom", "gloves", "pants", "vest")

# The designPrompt is deliberately item-specific: no generated panel is a recolor
# of another item.  Names and descriptions are shown by the Korean shop UI.
SPECS: dict[str, list[dict[str, str]]] = {
    "hat": [
        {"name": "낡은 헐렁 모자", "color": "#6f6258", "description": "거친 갈색 울 펠트와 해진 가장자리를 손바느질로 꿰맨 소박한 모자.", "designPrompt": "A floppy, asymmetrical wizard cap made from coarse brown wool felt, with a collapsed crown, one patched brim and a single loose stitch at the tip; plain worn construction."},
        {"name": "접힌 여행 모자", "color": "#755d48", "description": "부드러운 회갈색 캔버스를 두 번 접어 고정한 접이식 챙과 낡은 가죽 끈.", "designPrompt": "A compact foldable travel hat with two visible creases in a low canvas crown, a rolled narrow brim and a worn leather tie; practical, plain, and visibly different from a pointed cap."},
        {"name": "짧은 둥근 모자", "color": "#4b6870", "description": "청회색 모직을 단단한 둥근 꼭지로 세우고 안쪽에 면 테이프를 덧댄 모자.", "designPrompt": "A short round wizard hat with a squat domed crown, stiff circular brim and contrasting cotton binding under the edge; tailored wool construction with no tall point."},
        {"name": "넓은 들판 챙", "color": "#566b4b", "description": "거친 녹색 리넨과 촘촘한 삼실 테두리로 만든 넓고 평평한 들판 모자.", "designPrompt": "A wide flat-brim field hat with a very low crown, rough green linen, a braided hemp edge and a plain cloth band; broad silhouette unlike every narrow hat."},
        {"name": "높은 가는 꼭지", "color": "#513d6d", "description": "보랏빛 펠트의 길고 가는 원뿔 꼭지에 낡은 은실 밴드를 두른 모자.", "designPrompt": "A very tall, narrow conical wizard hat with a straight sharp tip, violet felt panels and one weathered silver-thread band; elegant vertical silhouette, not floppy or broad."},
        {"name": "깃털 접힘 모자", "color": "#8a633f", "description": "황갈색 가죽 챙을 한쪽으로 접고 작은 까마귀 깃털을 끼운 모자.", "designPrompt": "A side-folded leather hat with one sharply turned-up brim corner, a stitched ochre crown and one small crow feather tucked under the band; clear angular profile."},
        {"name": "날개 챙 마도모", "color": "#315d73", "description": "청록색 천을 양옆으로 날개처럼 올린 비대칭 챙과 황동 리벳 장식.", "designPrompt": "A winged-brim wizard hat whose two brim sides lift like small wings, built from teal cloth with exposed brass rivets and a split crown seam; dramatic lateral silhouette."},
        {"name": "주름 탑햇", "color": "#263b4e", "description": "짙은 남색 벨벳을 여러 겹 눌러 세운 주름진 높은 왕관과 금속 테.", "designPrompt": "A tall pleated top-hat silhouette with a cylindrical navy velvet crown, deep vertical folds, a narrow metal rim and a flat brim; structured and formal."},
        {"name": "달고리 비녀모", "color": "#a27a3f", "description": "황금빛 직물 왕관을 둥글게 감고 초승달 모양 비녀와 자수 끈을 꽂은 모자.", "designPrompt": "A wrapped turban-like wizard hat with a coiled golden textile crown, crescent hairpin and embroidered tie, creating a rounded layered silhouette rather than a cone."},
        {"name": "보석 끝꼭지", "color": "#184e56", "description": "짙은 청록 비단 꼭지를 길게 말아 끝에 호박 보석을 달고 금실로 수놓은 모자.", "designPrompt": "An elongated curling silk wizard cap with a dramatically hooked tip ending in an amber jewel, dense gold embroidery and a sculpted crescent brim; luxurious curved silhouette."},
        {"name": "별자수 왕관모", "color": "#382754", "description": "자주빛 브로케이드 왕관에 은빛 별자리 자수와 진주 테를 촘촘히 놓은 모자.", "designPrompt": "A regal pointed crown hat with a broad scalloped brim, purple brocade, constellations embroidered in silver thread and a ring of tiny pearls; elaborate but still a single hat."},
        {"name": "사파이어 깃관", "color": "#234c83", "description": "푸른 실크를 겹겹이 올린 왕관형 챙과 사파이어 중앙 장식, 긴 깃털 부채.", "designPrompt": "A masterwork crown hat with layered fan-shaped blue silk panels, a large sapphire centerpiece and a sweeping fan of feathers behind one side; highly distinctive architectural silhouette."},
    ],
    "necklace": [
        {"name": "끈 매듭 펜던트", "color": "#745d45", "description": "거친 삼실 끈에 납작한 나무 매듭 조각을 꿴 소박한 목걸이.", "designPrompt": "A simple short necklace made from rough hemp cord with one flat carved wooden knot pendant, visibly handmade and matte, with no other charms."},
        {"name": "철고리 사슬", "color": "#545c66", "description": "무광 철제 타원 고리를 굵게 연결하고 작은 낡은 열쇠를 단 목걸이.", "designPrompt": "A chunky necklace of irregular matte iron oval links ending in one tiny antique key pendant; utilitarian chain construction with a completely different silhouette from a bead strand."},
        {"name": "가죽 방패목걸이", "color": "#815438", "description": "갈색 가죽 끈에 작은 방패 모양 황동판을 매단 실용적인 목걸이.", "designPrompt": "A medium-length brown leather cord necklace carrying a single flat shield-shaped brass plate with two punched holes; clean geometric pendant and visible leather weave."},
        {"name": "유리 물방울", "color": "#4d92a8", "description": "푸른 유리 물방울을 은빛 철사로 감아 만든 투명한 펜던트.", "designPrompt": "A delicate necklace with a single translucent blue teardrop glass pendant held in a spiral silver wire cage, on a fine chain; the pendant is long and vertical."},
        {"name": "삼각 수정목걸이", "color": "#7d6aaf", "description": "보랏빛 삼각 수정 세 개와 가는 백동 체인을 균형 있게 연결한 목걸이.", "designPrompt": "A geometric necklace of three separate violet triangular crystal pendants linked along a thin pale-metal chain, forming a shallow angular arc instead of one central gem."},
        {"name": "달톱니 펜던트", "color": "#b1a66f", "description": "톱니처럼 잘린 초승달 황동판과 작은 검은 구슬을 번갈아 엮은 목걸이.", "designPrompt": "A brass crescent pendant with a saw-tooth edge, suspended from alternating tiny black beads and brass links; crescent silhouette and industrial ornament are unmistakable."},
        {"name": "깃털 부채 목걸이", "color": "#83684e", "description": "청동 목걸이 고리에 세 갈래 금속 깃털을 부채처럼 겹친 장식.", "designPrompt": "A statement necklace with three overlapping bronze feather-shaped pendants fanning outward from a wide collar chain; each feather has etched barbs and a separate outline."},
        {"name": "별자리 연결고리", "color": "#374c79", "description": "짙은 남색 리본에 작은 은별 다섯 개를 연결한 천과 금속 혼합 목걸이.", "designPrompt": "A navy ribbon choker with five tiny silver star charms connected by fine arcs of chain, arranged like a constellation across the collar; textile ribbon is prominent."},
        {"name": "루비 눈물사슬", "color": "#8b3244", "description": "붉은 루비 물방울들을 두 줄의 금사슬에 층층이 매달아 만든 화려한 목걸이.", "designPrompt": "A luxurious double-tier gold chain necklace carrying graduated ruby teardrops, with the longest gem centered low on the chest; layered cascade construction."},
        {"name": "오각 보석 칼라", "color": "#267b78", "description": "청록 비취 오각석을 넓은 금속 칼라에 박고 섬세한 필리그리를 두른 목걸이.", "designPrompt": "A broad articulated collar necklace with a large pentagonal jade centerpiece, gold filigree scrollwork and five linked metal plates; a rigid collar silhouette, not a hanging chain."},
        {"name": "진주 달사슬", "color": "#e7d9c2", "description": "크림빛 진주와 은빛 초승달을 촘촘한 이중 사슬로 엮은 고급 목걸이.", "designPrompt": "An elegant pearl-and-silver necklace with two crossing chain strands, a crescent moon centerpiece and small pearl drops distributed asymmetrically; refined layered construction."},
        {"name": "태양륜 보석목걸이", "color": "#bd873d", "description": "황금 태양륜 안에 호박 보석을 박고 광선 필리그리와 작은 보석을 둘러싼 걸작.", "designPrompt": "A masterwork necklace centered on a large amber gem inside an open gold sun wheel, surrounded by radiating filigree rays and tiny jewel settings; bold circular silhouette."},
    ],
    "cloak": [
        {"name": "해진 어깨천", "color": "#5e5455", "description": "거친 회색 모직을 한쪽 어깨에만 걸치고 실밥을 그대로 둔 낡은 망토.", "designPrompt": "A short one-shoulder cloak made from coarse grey wool, fastened by a single wooden toggle, with a raw uneven hem and visible patch; unmistakable asymmetrical poncho shape."},
        {"name": "간소한 판초", "color": "#75604c", "description": "갈색 캔버스 한 장에 머리 구멍과 작은 앞주머니만 낸 투박한 판초.", "designPrompt": "A plain square-cut poncho cloak in brown canvas with a centered neck opening, tiny front pocket and straight fringe hem; boxy silhouette with no sleeves."},
        {"name": "짧은 후드망토", "color": "#385a66", "description": "청회색 모직 후드를 깊게 만들고 앞을 끈으로 여미는 짧은 여행망토.", "designPrompt": "A short hooded travel cloak with a deep attached hood, straight shoulder seam, knee-high hem and simple cord closure; compact tailored wool silhouette."},
        {"name": "앞트임 여행망토", "color": "#59644d", "description": "올리브 리넨에 중앙 앞트임과 두 개의 가죽 버클, 바느질 주름을 낸 망토.", "designPrompt": "A mid-length olive linen cloak with a full center-front opening, two leather buckle closures and stitched vertical pleats; practical split-front construction."},
        {"name": "긴 깃털 후드", "color": "#423e63", "description": "보랏빛 천의 긴 후드와 넓은 어깨, 가장자리에 인조 깃털 띠를 두른 망토.", "designPrompt": "A long violet hooded cloak with an oversized pointed hood, broad shoulder cape and a narrow faux-feather collar trim; dramatic hood-and-shoulder silhouette."},
        {"name": "사선 여밈망토", "color": "#7d4d45", "description": "붉은 갈색 가죽과 천을 겹쳐 오른쪽 어깨에서 비스듬히 잠그는 비대칭 망토.", "designPrompt": "An asymmetrical rust cloak with a diagonal front overlap from left hip to right shoulder, layered leather-and-cloth panels and three side buckles; strong slanted construction."},
        {"name": "털깃 폭풍망토", "color": "#405461", "description": "짙은 청색 울 망토에 두툼한 인조 모피 깃과 깊은 등 주름을 더한 망토.", "designPrompt": "A full storm cloak in deep blue wool with an oversized plush fur collar, deep back box pleats and a sweeping circular hem; heavy rounded outer silhouette."},
        {"name": "어깨갑옷 망토", "color": "#596875", "description": "회청색 망토 위에 두 겹의 가죽 어깨판과 황동 버클을 얹은 튼튼한 여행복.", "designPrompt": "A structured travel cloak with two layered leather shoulder plates, brass buckles, a high collar and a split back hem over blue-grey cloth; armor-like shoulder architecture."},
        {"name": "별수 진홍망토", "color": "#7c3047", "description": "진홍색 벨벳에 별빛 은실 자수와 안쪽 금색 안감을 넣은 풍성한 망토.", "designPrompt": "A luxurious crimson velvet cloak with a sweeping semicircular train, silver star embroidery across the shoulders and a glimpse of gold lining; rich formal silhouette."},
        {"name": "은사 비대칭망토", "color": "#697f9f", "description": "푸른 회색 비단을 한쪽은 짧고 한쪽은 발목까지 떨어지게 재단한 망토.", "designPrompt": "A masterwork asymmetric silk cloak with one cropped hip-length side and one ankle-length side, articulated silver clasp and fine silver piping; extreme length contrast."},
        {"name": "보석 견장 의복", "color": "#286c61", "description": "청록 브로케이드에 넓은 금실 견장, 에메랄드 보석 단추와 정교한 소용돌이 자수.", "designPrompt": "An elaborate teal brocade cloak with wide embroidered shoulder epaulettes, emerald jewel clasps, a high split collar and swirling gold embroidery; regal fitted mantle silhouette."},
        {"name": "별자리 대망토", "color": "#252c5d", "description": "남청색 겹실크를 길게 펼치고 은빛 별자리, 금속 어깨판, 보석 걸쇠를 모두 더한 최고급 망토.", "designPrompt": "A masterwork full-length midnight cloak with a sculpted crescent shoulder yoke, articulated silver shoulder plates, jeweled clasp and dense constellation embroidery flowing to a pointed train."},
    ],
    "wand": [
        {"name": "마른 나뭇가지 지팡이", "color": "#6d523b", "description": "거친 마른 나뭇가지를 짧게 다듬고 손잡이에 낡은 삼끈을 감은 지팡이.", "designPrompt": "A very plain short wand made from a dry uneven twig, with two natural knots and a frayed hemp grip wrap; rough organic silhouette and no ornament."},
        {"name": "옹이 참나무 지팡이", "color": "#805b3a", "description": "옹이가 선명한 참나무 가지를 둥글게 깎고 끝을 무딘 원뿔로 만든 지팡이.", "designPrompt": "A sturdy oak wand with three prominent knobby growths, a blunt tapered tip and a simple faceted grip; practical wood construction with a chunky profile."},
        {"name": "굽은 자작나무 지팡이", "color": "#9b7d5b", "description": "연한 자작나무 몸체를 자연스럽게 한 번 굽히고 검은 실을 십자로 묶은 지팡이.", "designPrompt": "A gently curved birch wand with pale bark, one elegant bend along its shaft and crossed black thread bindings at the handle; clear curved silhouette."},
        {"name": "가죽 손잡이 지팡이", "color": "#4f6c63", "description": "청록빛 목재에 갈색 가죽 손잡이와 작은 황동 링을 덧댄 지팡이.", "designPrompt": "A medium straight teal-stained wooden wand with a separately wrapped brown leather handle, one small brass ring and a clean pointed tip; two-material construction."},
        {"name": "뼈손잡이 지팡이", "color": "#d0c7aa", "description": "상아빛 뼈 모양 손잡이를 어두운 목재 몸체에 끼우고 가는 금속선을 두른 지팡이.", "designPrompt": "A wand with a carved ivory bone-shaped handle joined to a dark wood shaft by fine copper wire, ending in a narrow needle tip; unmistakable bone grip."},
        {"name": "나선 조각 지팡이", "color": "#6c4b65", "description": "보랏빛 나무 몸체에 깊은 나선 홈을 파고 손잡이를 세 갈래로 벌린 지팡이.", "designPrompt": "A purple wood wand carved with a deep spiral groove running the full shaft, splitting into three small prongs at the handle; sculptural helix silhouette."},
        {"name": "달고리 곡선지팡이", "color": "#536d88", "description": "청회색 목재를 크게 휘어 초승달 고리 손잡이를 만들고 은못을 박은 지팡이.", "designPrompt": "A dramatic curved wand whose shaft sweeps into a crescent-ring handle, built from blue-grey wood with visible silver rivets and a sharply tapered tip."},
        {"name": "수정면 지팡이", "color": "#7b9bca", "description": "팔각으로 깎은 푸른 수정 손잡이와 검은 금속 자루를 맞물린 지팡이.", "designPrompt": "A faceted crystal wand with a large octagonal blue crystal handle set into a dark metal shaft, with a short angular pommel; hard geometric construction."},
        {"name": "황동 톱니지팡이", "color": "#ae7d3f", "description": "황동 톱니 원판 두 개를 어두운 목재에 겹치고 붉은 보석을 박은 지팡이.", "designPrompt": "A mechanical wand with two nested brass gear discs around a dark wooden shaft, a small ruby in the center and a squared grip; precise industrial silhouette."},
        {"name": "용비늘 손잡이", "color": "#3d7c75", "description": "청록 용비늘 모양 금속판을 겹쳐 손잡이를 만들고 은빛 곡선 자루를 연결한 지팡이.", "designPrompt": "A masterwork wand with overlapping teal dragon-scale metal plates forming a broad grip, connected to a gently curved silver shaft and a faceted cap."},
        {"name": "별구슬 지팡이", "color": "#4b3977", "description": "자주색 흑단에 금실 별자리와 작은 별구슬을 박고 끝을 보석처럼 깎은 지팡이.", "designPrompt": "An ornate ebony wand with gold constellation inlay along the shaft, a floating-looking star orb in the handle and a jewel-faceted tip; rich celestial decoration."},
        {"name": "태양륜 마도지팡이", "color": "#bf8b3e", "description": "황금 태양륜 손잡이 안에 호박을 넣고 붉은 목재 자루에 필리그리를 감은 걸작 지팡이.", "designPrompt": "A masterwork wand with an open gold sun-wheel handle enclosing a glowing amber gem, a redwood shaft wrapped in delicate gold filigree and a multi-faceted crown tip."},
    ],
    "broom": [
        {"name": "짧은 묶음빗자루", "color": "#765e43", "description": "짧은 자작나무 자루에 거친 볏짚을 굵은 삼끈으로 묶은 소박한 빗자루.", "designPrompt": "A very short broom with a stubby straight birch handle and a small coarse bundle of straw bristles tied by rough hemp; humble compact silhouette."},
        {"name": "굽은 손잡이 빗자루", "color": "#895b39", "description": "갈색 나무 자루를 아래로 굽히고 한쪽에 거친 빗자루 솔을 묶은 빗자루.", "designPrompt": "A short broom with a noticeably bent wooden handle, a single offset bundle of stiff straw bristles and a plain leather binding; lopsided silhouette."},
        {"name": "긴 농장빗자루", "color": "#657c5c", "description": "긴 녹색 칠 자루와 넓고 납작한 볏짚 묶음, 낡은 철 고리의 농장 빗자루.", "designPrompt": "A traditional long-handled farm broom with a straight green-painted shaft and a broad flat fan of straw bristles held by one rusty iron ring; wide bottom silhouette."},
        {"name": "두 갈래 빗자루", "color": "#4d6f88", "description": "청색 자루 끝을 두 갈래로 갈라 각각 작은 솔 다발을 매단 독특한 빗자루.", "designPrompt": "A broom with a long blue handle that forks into two separate short bristle bundles, each tied with a different leather strap; unmistakable split-tail construction."},
        {"name": "승마형 날렵빗자루", "color": "#704e43", "description": "날씬한 적갈색 자루와 뒤로 길게 뻗은 균일한 솔, 손잡이 가죽 고리를 가진 빗자루.", "designPrompt": "A sleek riding broom with a slim reddish shaft, a long swept-back tapered bristle tail, leather hand loop and small metal foot rest; aerodynamic profile."},
        {"name": "삼각 솔빗자루", "color": "#3c806c", "description": "녹색 금속 삼각 프레임에 세 방향으로 솔 다발을 꽂은 빗자루.", "designPrompt": "A distinctive broom with a triangular green metal frame at the tail supporting three splayed bundles of bristles, attached to a straight wooden shaft; geometric fan shape."},
        {"name": "부채꼴 섬유빗자루", "color": "#b17b47", "description": "황갈색 섬유 솔이 부채처럼 펼쳐지고 자루에 황동 링을 겹친 빗자루.", "designPrompt": "A medium broom whose golden fiber bristles spread in a broad semicircular fan, with two stacked brass rings at the handle joint and a warm wood shaft."},
        {"name": "스포츠 스윕 빗자루", "color": "#4e608e", "description": "남색 복합재 자루를 길게 뽑고 넓은 공기역학 솔과 은색 보호띠를 붙인 빗자루.", "designPrompt": "A high-performance sports broom with a long navy composite handle, a streamlined broad swept bristle tail, silver guard bands and a small aerodynamic fin; athletic silhouette."},
        {"name": "달갈고리 빗자루", "color": "#6c4f78", "description": "자주색 자루 끝을 갈고리처럼 올리고 달 모양 솔 프레임과 보랏빛 섬유를 단 빗자루.", "designPrompt": "A luxury broom with a purple handle curling upward into a hook, a crescent-shaped metal bristle frame and layered violet fibers; curved moon silhouette."},
        {"name": "황동 포크빗자루", "color": "#b57d32", "description": "황동 포크형 꼬리에 여섯 솔 다발을 방사형으로 고정하고 가죽 손잡이를 덧댄 빗자루.", "designPrompt": "An elaborate broom with a brass fork-shaped tail holding six radial bristle bundles, a wrapped leather grip and engraved brass collars; unmistakable radial construction."},
        {"name": "폭풍날개 빗자루", "color": "#367f84", "description": "청록 금속 자루에서 양옆 날개 프레임을 펼치고 은실 솔을 겹친 고급 빗자루.", "designPrompt": "A masterwork broom with a teal metal shaft and two articulated wing-like side frames supporting layered silver bristles, plus engraved cuffs and a jewel pivot."},
        {"name": "별빛 혜성빗자루", "color": "#354276", "description": "남청색 유선형 자루와 금속 필리그리, 빛나는 별가루 같은 다층 솔 꼬리를 갖춘 빗자루.", "designPrompt": "A masterwork comet broom with a midnight-blue tapered handle, gold filigree rings and a long multi-layered silver bristle tail that fans like a comet, with sapphire pivot jewel."},
    ],
    "gloves": [
        {"name": "해진 손가락 장갑", "color": "#6f6258", "description": "거친 갈색 가죽 손가락 끝이 닳고 손목에 헐거운 끈을 단 장갑 한 켤레.", "designPrompt": "A matching pair of rough brown leather fingerless gloves with frayed knuckle openings, uneven stitching and loose wrist ties; visibly worn and plain."},
        {"name": "짧은 천 손목장갑", "color": "#4e6170", "description": "회청색 캔버스 손등과 짧은 손목 밴드, 손가락별 봉제선을 가진 장갑.", "designPrompt": "A pair of short canvas gloves with open fingertips, blue-grey backs, narrow wrist bands and clearly separated finger seams; compact practical silhouette."},
        {"name": "가죽 반장갑", "color": "#80563e", "description": "갈색 가죽 손등을 덮고 손가락을 반쯤 노출한 버클 장식 장갑.", "designPrompt": "A pair of mid-length brown leather half-gloves covering the palm and back while leaving fingertips exposed, each secured by one small brass buckle."},
        {"name": "긴 니트 장갑", "color": "#788b68", "description": "올리브색 니트 손가락 장갑을 팔목 중간까지 길게 짜고 골지 끝단을 낸 장갑.", "designPrompt": "A pair of full-finger knitted gloves extending to mid-forearm, olive ribbed cuffs and visible woven loops; soft textile silhouette unlike leather gloves."},
        {"name": "손목띠 마도장갑", "color": "#5f5185", "description": "보랏빛 가죽 손가락 장갑에 세 겹 손목띠와 은색 봉제선을 더한 장갑.", "designPrompt": "A pair of fitted purple leather gloves with full fingers, three layered wrist straps and silver seam piping; tailored magical workwear."},
        {"name": "팔꿈치 긴장갑", "color": "#3f6580", "description": "청색 가죽을 팔꿈치까지 길게 만들고 팔꿈치 주름과 조절 버클을 넣은 장갑.", "designPrompt": "A pair of long blue leather gauntlet gloves reaching the elbows, with articulated elbow pleats, side adjustment buckles and narrow fingers; strong elongated silhouette."},
        {"name": "금속 손등장갑", "color": "#9a8050", "description": "황갈색 가죽 손가락 위에 작은 황동 판을 겹치고 손목에 넓은 띠를 단 장갑.", "designPrompt": "A pair of leather gloves with overlapping small brass plates across the backs of hands and fingers, broad wrist cuffs and visible articulated joints; light armor construction."},
        {"name": "보석 손목장갑", "color": "#3c7f79", "description": "청록 벨벳 장갑에 금실 손가락 자수와 손목 중앙의 작은 비취를 박은 장갑.", "designPrompt": "A pair of elegant teal velvet gloves with gold embroidery tracing each finger and one jade cabochon set into each cuff; refined fitted shape."},
        {"name": "사냥꾼 갈퀴장갑", "color": "#73423d", "description": "붉은 갈색 가죽 손가락 장갑에 손목부터 팔뚝까지 겹치는 끈과 발톱 모양 금속 끝을 단 장갑.", "designPrompt": "A pair of burgundy hunter gloves with long overlapping forearm lacing and small claw-shaped metal caps on the knuckles; rugged tapered gauntlet profile."},
        {"name": "은사 장갑", "color": "#8496ae", "description": "은회색 비단 장갑에 손가락마다 은실 필리그리를 수놓고 금속 손목 고리를 단 장갑.", "designPrompt": "A masterwork pair of silver-grey silk gloves with fine silver filigree embroidered along every finger and articulated metal wrist rings; sleek formal silhouette."},
        {"name": "황금 커프 장갑", "color": "#b7893e", "description": "크림색 가죽 장갑에 넓은 황금 커프와 작은 루비 단추, 정교한 천공무늬를 더한 장갑.", "designPrompt": "A luxurious pair of cream leather gloves ending in wide engraved gold cuffs, each cuff set with a ruby button and pierced scrollwork; bold cuff silhouette."},
        {"name": "별빛 팔토시 장갑", "color": "#304674", "description": "남색 장갑과 어깨 가까이 올라오는 팔토시에 별자리 자수, 사파이어와 금속 테를 결합한 걸작.", "designPrompt": "A masterwork pair of midnight gloves with very long articulated forearm sleeves, constellation embroidery, sapphire studs and gold-edged cuffs; theatrical layered gauntlet form."},
    ],
    "pants": [
        {"name": "해진 통바지", "color": "#5d5a59", "description": "거친 회색 천을 넓게 재단하고 무릎 패치를 덧댄 낡은 통바지.", "designPrompt": "A plain pair of very wide-leg trousers in coarse grey cloth, with a patched knee, rough waistband and uneven hem; visibly worn and roomy silhouette."},
        {"name": "곧은 여행바지", "color": "#6c5a4d", "description": "갈색 캔버스의 곧은 다리와 단순한 끈 허리, 두 개의 납작한 주머니를 갖춘 바지.", "designPrompt": "A straight-leg pair of brown canvas travel trousers with a drawstring waist, two flat patch pockets and simple ankle hems; clean utilitarian cut."},
        {"name": "짧은 커프바지", "color": "#3f6370", "description": "청회색 모직 다리를 발목 위에서 넓은 커프스로 접고 황동 단추를 단 바지.", "designPrompt": "A pair of blue-grey wool trousers with tapered legs ending above the ankle in wide turned cuffs secured by brass buttons; distinctive cropped silhouette."},
        {"name": "허리끈 승마바지", "color": "#56684f", "description": "올리브색 천의 무릎부터 좁아지는 승마 재단과 허리 양옆 끈 장식.", "designPrompt": "A pair of olive riding trousers with full hips, dramatically tapered calves, side waist lacing and reinforced knee panels; equestrian silhouette."},
        {"name": "주름 넓은바지", "color": "#64548a", "description": "보랏빛 직물에 깊은 앞주름 네 줄과 넓은 다리, 평평한 허리밴드를 넣은 바지.", "designPrompt": "A pair of wide-leg violet trousers with four deep front pleats, a flat waistband and flowing tailored fabric; generous palazzo silhouette."},
        {"name": "비대칭 랩바지", "color": "#784c43", "description": "붉은 갈색 천 두 겹을 사선으로 겹쳐 한쪽 다리에 랩 패널을 만든 바지.", "designPrompt": "A pair of rust trousers with a straight base cut and one dramatic asymmetric wrap panel crossing the left thigh, held by leather ties; layered diagonal construction."},
        {"name": "가죽 패널바지", "color": "#315c61", "description": "청록 가죽과 천 패널을 교차 봉제하고 무릎에 조절 스트랩을 단 튼튼한 바지.", "designPrompt": "A pair of fitted teal trousers combining cloth and leather panels, with articulated knee seams and adjustable strap bands; composite tailored construction."},
        {"name": "금속 단추 바지", "color": "#506783", "description": "남색 직물에 양옆 금속 단추 열과 발목 끈을 세운 정장형 바지.", "designPrompt": "A pair of navy formal trousers with two vertical rows of polished metal buttons down the outer legs, narrow ankle straps and a sharp crease."},
        {"name": "층겹 치마바지", "color": "#7b3e50", "description": "버건디 바지 위에 짧은 앞뒤 겹천과 금실 가장자리를 덧댄 층겹 치마바지.", "designPrompt": "A pair of burgundy trousers under two short layered overskirt panels, front and back split for movement, edged with gold thread; unmistakable layered silhouette."},
        {"name": "별자수 궁정바지", "color": "#6d7f9d", "description": "은청색 브로케이드의 좁은 다리에 은실 별자리와 보석 벨트 고리를 수놓은 바지.", "designPrompt": "A masterwork pair of slim silver-blue brocade trousers with silver constellation embroidery on one leg, jeweled belt loops and sharply tailored crease."},
        {"name": "루비 겹주름바지", "color": "#9b553e", "description": "붉은 비단을 여러 겹 주름잡고 허리에 루비 장식 버클과 옆 필리그리를 단 고급 바지.", "designPrompt": "A luxurious pair of layered russet silk trousers with sculpted pleats widening below the knee, ruby buckle and delicate side filigree; sculptural drape."},
        {"name": "황금 자수 연미바지", "color": "#263e64", "description": "남청색 벨벳 다리에 금실 자수를 놓고 뒤로 길게 갈라진 연미 패널과 보석 단추를 단 걸작.", "designPrompt": "A masterwork pair of midnight velvet trousers with fitted legs, long split tailcoat-like panels at the back, gold embroidery and jeweled buttons; formal tail silhouette."},
    ],
    "vest": [
        {"name": "해진 단추조끼", "color": "#665a54", "description": "거친 회색 천 두 장을 잇고 낡은 나무 단추 세 개만 단 소박한 조끼.", "designPrompt": "A plain rough grey vest with two square front panels, a shallow V neck, three mismatched wooden buttons and frayed armholes; visibly patched construction."},
        {"name": "캔버스 끈조끼", "color": "#765d48", "description": "갈색 캔버스에 낮은 V넥과 옆 끈 조절, 작은 앞주머니를 낸 실용 조끼.", "designPrompt": "A simple brown canvas vest with a low V neckline, side-lacing adjustment, one small patch pocket and a straight hem; rugged utilitarian cut."},
        {"name": "둥근깃 조끼", "color": "#4f6870", "description": "청회색 모직에 둥근 칼라와 두 줄 황동 단추, 안쪽 면 테이프를 갖춘 조끼.", "designPrompt": "A short blue-grey wool vest with a rounded collar, two neat rows of brass buttons and visible cotton binding around armholes; compact rounded neckline."},
        {"name": "사선 앞판 조끼", "color": "#5b704f", "description": "올리브 가죽 앞판을 사선으로 겹치고 한쪽 어깨 버클과 큰 주머니를 단 조끼.", "designPrompt": "A practical olive leather vest with overlapping diagonal front panels, one shoulder buckle and a large offset utility pocket; asymmetrical closure silhouette."},
        {"name": "높은깃 학자조끼", "color": "#5a4a7c", "description": "보랏빛 직물에 높은 세운 칼라와 네 줄 작은 단추, 안쪽 금색 테를 둔 조끼.", "designPrompt": "A fitted violet scholar vest with a high standing collar, four vertical rows of tiny buttons and narrow gold piping inside the armholes; formal upright silhouette."},
        {"name": "등판 주름조끼", "color": "#7b4a40", "description": "붉은 갈색 천 앞판과 넓은 등 주름, 가죽 허리 조절띠를 결합한 조끼.", "designPrompt": "A rust vest with a clean tailored front and a visibly pleated back panel, cinched by a broad leather waist strap; front-versus-back construction contrast."},
        {"name": "가죽 어깨조끼", "color": "#356867", "description": "청록 가죽 몸판에 겹친 어깨 플랩과 은색 리벳, 안쪽 천 패널을 넣은 조끼.", "designPrompt": "A teal leather vest with overlapping shoulder flaps, silver rivets and contrasting cloth side panels, cut close to the torso with a squared hem."},
        {"name": "브로케이드 단추조끼", "color": "#9a783c", "description": "황금빛 브로케이드에 중앙 단추 열과 넓은 숄 칼라, 작은 주머니 두 개를 낸 조끼.", "designPrompt": "A rich gold brocade waistcoat with a broad shawl collar, a single central row of buttons and two welt pockets; classic tailored silhouette."},
        {"name": "비대칭 옷깃조끼", "color": "#7e3850", "description": "버건디 벨벳 양쪽 옷깃 높이를 다르게 만들고 한쪽에 긴 금속 사슬을 단 조끼.", "designPrompt": "A burgundy velvet vest with one high peaked lapel and one low rounded lapel, an offset metal chain closure and narrow waist; unmistakably asymmetric collar."},
        {"name": "보석 칼라조끼", "color": "#476f83", "description": "푸른 비단 조끼에 넓은 은빛 칼라, 사파이어 단추와 가장자리 필리그리를 넣은 조끼.", "designPrompt": "A masterwork blue silk vest with a wide silver collar, sapphire buttons and filigree edging around the armholes; jewel-toned structured silhouette."},
        {"name": "장식 견장조끼", "color": "#3b7b63", "description": "에메랄드 브로케이드에 금실 견장, 양쪽 보석 주머니 덮개와 촘촘한 자수.", "designPrompt": "A luxurious emerald brocade vest with embroidered gold shoulder epaulettes, two jeweled pocket flaps and dense botanical embroidery; ornate layered tailoring."},
        {"name": "황금 왕실조끼", "color": "#b4893e", "description": "짙은 자주 벨벳에 높은 칼라, 황금 필리그리 단추 열, 루비와 정교한 등판 자수를 더한 걸작 조끼.", "designPrompt": "A masterwork royal vest in deep plum velvet with a high split collar, double rows of gold filigree buttons, ruby clasps and elaborate embroidered back panel; regal elongated silhouette."},
    ],
}


def make_catalog() -> list[dict[str, object]]:
    catalog: list[dict[str, object]] = []
    for category in CATEGORIES:
        for index, spec in enumerate(SPECS[category], 1):
            catalog.append({
                "id": f"{category}-{index:02d}",
                "category": category,
                "name": spec["name"],
                "price": PRICES[index - 1],
                "color": spec["color"],
                "quality": QUALITIES[index - 1],
                "description": spec["description"],
                "designPrompt": spec["designPrompt"],
            })
    return catalog


def write_catalog() -> None:
    CATALOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    CATALOG_PATH.write_text(json.dumps(make_catalog(), ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def request_sheet(group: dict[str, object], quality: str) -> bytes:
    items = group["items"]
    lines = []
    for position, item in zip(("LEFT", "MIDDLE", "RIGHT"), items):
        lines.append(f"{position} panel, {item['id']}, {item['quality']} tier, {item['color']}: {item['designPrompt']}")
    prompt = (
        "Create a product sheet for a polished family fantasy game wardrobe. "
        "MANDATORY CANVAS: exactly 1536x1024 pixels, TRUE TRANSPARENT background. "
        "Divide the canvas into three equal 512x1024 vertical panels. Render exactly one complete, unoccupied "
        f"{group['category']} design in each panel, with generous transparent space around each object. "
        "The three designs must be independent silhouettes and constructions, not recolors or copies. "
        "Keep each item entirely inside its own panel, full object visible, no overlap across panel boundaries, "
        "consistent high-quality stylized-realistic 3D game asset style, physically believable materials, soft studio lighting. "
        "No human, body, mannequin, hand, hanger, scene, floor, cast shadow, text, logo, frame, border, or painted background. "
        "Do not add any object not requested.\n\n" + "\n".join(lines)
    )
    payload = json.dumps({
        "model": MODEL,
        "prompt": prompt,
        "size": "1536x1024",
        "quality": quality,
        "background": "transparent",
        "output_format": "png",
        "n": 1,
    }).encode("utf-8")
    request = urllib.request.Request(
        "https://api.openai.com/v1/images/generations",
        data=payload,
        headers={
            "Authorization": "Bearer " + os.environ["OPENAI_API_KEY"],
            "Content-Type": "application/json",
        },
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


def crop_panel(sheet: Image.Image, item_id: str, panel_index: int) -> Image.Image:
    if sheet.size != SOURCE_SIZE:
        raise ValueError(f"{item_id}: expected 1536x1024 sheet, got {sheet.size}")
    panel = sheet.crop((panel_index * PANEL_SIZE[0], 0, (panel_index + 1) * PANEL_SIZE[0], PANEL_SIZE[1])).convert("RGBA")
    alpha = panel.getchannel("A")
    if alpha.getextrema()[0] > 0:
        raise ValueError(f"{item_id}: panel is not transparent around the object")
    # Image generation can leave a very faint studio haze in nominally
    # transparent pixels. Keep the solid/antialiased object edge while
    # removing that haze so garment overlays remain truly transparent.
    visible = alpha.point(lambda value: value if value >= 220 else 0)
    bbox = visible.getbbox()
    if bbox is None:
        raise ValueError(f"{item_id}: panel has no visible object")
    panel.putalpha(visible)
    return panel.crop(bbox)


def thumb(image: Image.Image) -> Image.Image:
    max_extent = round(THUMBNAIL_SIZE * (1 - 2 * PADDING))
    scale = min(max_extent / image.width, max_extent / image.height)
    size = (max(1, round(image.width * scale)), max(1, round(image.height * scale)))
    fitted = image.resize(size, Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (THUMBNAIL_SIZE, THUMBNAIL_SIZE), (0, 0, 0, 0))
    canvas.alpha_composite(fitted, ((THUMBNAIL_SIZE - size[0]) // 2, (THUMBNAIL_SIZE - size[1]) // 2))
    return canvas


def item_paths(item_id: str) -> tuple[Path, Path]:
    return DESIGN_DIR / f"{item_id}.webp", ITEM_DIR / f"{item_id}.webp"


def group_complete(group: dict[str, object]) -> bool:
    return all(all(path.is_file() for path in item_paths(item["id"])) for item in group["items"])


def group_prompt(group: dict[str, object]) -> str:
    lines = []
    for position, item in zip(("LEFT", "MIDDLE", "RIGHT"), group["items"]):
        lines.append(f"{position} panel, {item['id']}, {item['quality']} tier, {item['color']}: {item['designPrompt']}")
    return (
        "Create a product sheet for a polished family fantasy game wardrobe. MANDATORY CANVAS: exactly 1536x1024 pixels, TRUE TRANSPARENT background. "
        "Divide the canvas into three equal 512x1024 vertical panels. Render exactly one complete, unoccupied "
        f"{group['category']} design in each panel, with generous transparent space around each object. The three designs must be independent silhouettes and constructions, not recolors or copies. "
        "Keep each item entirely inside its own panel, full object visible, no overlap across panel boundaries, consistent high-quality stylized-realistic 3D game asset style, physically believable materials, soft studio lighting. "
        "No human, body, mannequin, hand, hanger, scene, floor, cast shadow, text, logo, frame, border, or painted background. Do not add any object not requested.\n\n" + "\n".join(lines)
    )


def process_group(group: dict[str, object], quality: str, force: bool = False) -> dict[str, object]:
    group_id = str(group["id"])
    sheet_path = DESIGN_DIR / "sheets" / f"{group_id}.png"
    if not force and group_complete(group):
        return {"id": group_id, "category": group["category"], "items": [item["id"] for item in group["items"]], "status": "skipped", "sheet": str(sheet_path.relative_to(ROOT)), "prompt": group_prompt(group), "model": MODEL, "quality": quality}
    raw = request_sheet(group, quality)
    DESIGN_DIR.mkdir(parents=True, exist_ok=True)
    (DESIGN_DIR / "sheets").mkdir(parents=True, exist_ok=True)
    temporary_sheet = sheet_path.with_suffix(".part.png")
    temporary_sheet.write_bytes(raw)
    temporary_sheet.replace(sheet_path)
    with Image.open(io.BytesIO(raw)) as opened:
        sheet = opened.convert("RGBA")
    records = []
    for panel_index, item in enumerate(group["items"]):
        item_id = item["id"]
        source_path, thumb_path = item_paths(item_id)
        cropped = crop_panel(sheet, item_id, panel_index)
        source_tmp = source_path.with_suffix(".part.webp")
        thumb_tmp = thumb_path.with_suffix(".part.webp")
        source_path.parent.mkdir(parents=True, exist_ok=True)
        thumb_path.parent.mkdir(parents=True, exist_ok=True)
        cropped.save(source_tmp, format="WEBP", lossless=True, method=6)
        thumb(cropped).save(thumb_tmp, format="WEBP", lossless=True, method=6)
        source_tmp.replace(source_path)
        thumb_tmp.replace(thumb_path)
        encoded = io.BytesIO()
        cropped.save(encoded, format="WEBP", lossless=True, method=6)
        records.append({"id": item_id, "source": str(source_path.relative_to(ROOT)), "thumbnail": str(thumb_path.relative_to(ROOT)), "sourceSize": list(cropped.size), "sha256": hashlib.sha256(encoded.getvalue()).hexdigest()})
    return {"id": group_id, "category": group["category"], "items": records, "status": "generated", "sheet": str(sheet_path.relative_to(ROOT)), "prompt": group_prompt(group), "model": MODEL, "quality": quality}


def make_groups(catalog: list[dict[str, object]]) -> list[dict[str, object]]:
    by_category = {category: [item for item in catalog if item["category"] == category] for category in CATEGORIES}
    groups = []
    for category in CATEGORIES:
        entries = by_category[category]
        for offset in range(0, 12, 3):
            groups.append({"id": f"{category}-{offset + 1:02d}-{offset + 3:02d}", "category": category, "items": entries[offset : offset + 3]})
    return groups


def write_manifest(records: list[dict[str, object]], quality: str) -> None:
    items = []
    for record in records:
        if record["status"] == "generated":
            items.extend(record["items"])
        else:
            for item in record["items"]:
                source_path, thumb_path = item_paths(item)
                with Image.open(source_path) as image:
                    items.append({"id": item, "source": str(source_path.relative_to(ROOT)), "thumbnail": str(thumb_path.relative_to(ROOT)), "sourceSize": list(image.size), "sha256": hashlib.sha256(source_path.read_bytes()).hexdigest()})
    manifest = {
        "model": MODEL,
        "quality": quality,
        "background": "transparent",
        "sourceSize": list(SOURCE_SIZE),
        "panelSize": list(PANEL_SIZE),
        "thumbnailSize": [THUMBNAIL_SIZE, THUMBNAIL_SIZE],
        "padding": PADDING,
        "apiCalls": len(records),
        "generatedAt": dt.datetime.now(dt.timezone.utc).isoformat(),
        "groups": records,
        "items": items,
    }
    DESIGN_DIR.mkdir(parents=True, exist_ok=True)
    ITEM_DIR.mkdir(parents=True, exist_ok=True)
    serialized = json.dumps(manifest, ensure_ascii=False, indent=2) + "\n"
    (DESIGN_DIR / "manifest.json").write_text(serialized, encoding="utf-8")
    # Keep the shop-facing manifest in sync while design provenance remains
    # discoverable beside the source crops.
    (ITEM_DIR / "manifest.json").write_text(serialized, encoding="utf-8")


def write_contact_sheet(catalog: list[dict[str, object]]) -> None:
    columns, cell = 12, 160
    rows = 8
    contact = Image.new("RGBA", (columns * cell, rows * cell), (245, 245, 245, 255))
    for index, item in enumerate(catalog):
        _, thumbnail = item_paths(item["id"])
        if not thumbnail.is_file():
            continue
        with Image.open(thumbnail) as image:
            image = image.convert("RGBA").resize((128, 128), Image.Resampling.LANCZOS)
            x = (index % columns) * cell + 16
            y = (index // columns) * cell + 16
            contact.alpha_composite(image, (x, y))
    contact.save(ITEM_DIR / "contact-sheet.webp", format="WEBP", quality=90, method=6)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--catalog-only", action="store_true", help="write the exact 96-item catalog and stop")
    parser.add_argument("--quality", choices=("medium", "high"), default="high")
    parser.add_argument("--max-parallel", type=int, choices=range(1, 5), default=4)
    parser.add_argument("--force", action="store_true", help="regenerate groups even when all three items exist")
    args = parser.parse_args()
    write_catalog()
    if args.catalog_only:
        print(f"Wrote {len(make_catalog())} catalog entries to {CATALOG_PATH.relative_to(ROOT)}")
        return
    if not os.environ.get("OPENAI_API_KEY"):
        raise SystemExit("OPENAI_API_KEY is not configured")
    catalog = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
    if not isinstance(catalog, list) or len(catalog) != 96:
        raise SystemExit("wardrobe catalog must contain exactly 96 entries")
    groups = make_groups(catalog)
    records: list[dict[str, object]] = []
    failures: list[str] = []
    pending = [group for group in groups if args.force or not group_complete(group)]
    print(f"Wardrobe groups: {len(groups)} total, {len(pending)} pending, max_parallel={args.max_parallel}", flush=True)
    with ThreadPoolExecutor(max_workers=args.max_parallel) as executor:
        futures = {executor.submit(process_group, group, args.quality, args.force): group for group in pending}
        for future in as_completed(futures):
            group = futures[future]
            try:
                record = future.result()
                records.append(record)
                print(f"{record['id']}: {record['status']}", flush=True)
            except Exception as error:
                failures.append(str(group["id"]))
                print(f"FAILED {group['id']}: {error}", flush=True)
    # Existing complete groups still belong in the durable manifest.
    complete_records = []
    record_map = {record["id"]: record for record in records}
    for group in groups:
        if group["id"] in record_map:
            complete_records.append(record_map[group["id"]])
        elif group_complete(group):
            complete_records.append({"id": group["id"], "category": group["category"], "items": [item["id"] for item in group["items"]], "status": "skipped", "sheet": str((DESIGN_DIR / "sheets" / f"{group['id']}.png").relative_to(ROOT)), "prompt": group_prompt(group), "model": MODEL, "quality": args.quality})
    if complete_records:
        write_manifest(complete_records, args.quality)
        if all(group_complete(group) for group in groups):
            ITEM_DIR.mkdir(parents=True, exist_ok=True)
            write_contact_sheet(catalog)
    print(f"Finished {len(complete_records)}/{len(groups)} groups; images={sum(group_complete(group) * 3 for group in groups)}; failures={failures}", flush=True)
    if failures:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
