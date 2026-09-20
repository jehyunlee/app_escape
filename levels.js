import { languagePools } from "./language-questions.js";
import { stemPools } from "./stem-questions.js";

export const QUESTION_COUNT = 20;
export const PASS_SCORE = 15;
export const levels = [
  {
    id: 1,
    place: "마법 교실",
    subject: "중학교 3학년 영어 · 독해와 회화",
    title: "이야기 속 숨은 주문",
    intro:
      "짧은 이야기와 대화를 읽고, 말하는 사람의 마음과 필요한 정보를 찾아요.",
    clues: ["유리", "식물", "햇빛"],
    destination: "온실",
    choices: ["온실", "도서관", "성문"],
  },
  {
    id: 2,
    place: "온실",
    subject: "3학년 수학",
    title: "덩굴 속 계산",
    intro: "온실의 덩굴이 숫자 자물쇠를 감쌌어요. 차근차근 계산해 길을 찾아요.",
    clues: ["긴", "식탁", "잔치"],
    destination: "대연회장",
    choices: ["대연회장", "마법 교실", "시계탑"],
  },
  {
    id: 3,
    place: "대연회장",
    subject: "3학년 과학 1단원 · 식물 관찰",
    title: "식물 관찰 기록",
    intro:
      "대연회장의 마법 화분을 관찰해요. 식물이 살아가는 모습을 알아보아요.",
    clues: ["나무", "숲", "경계"],
    destination: "숲 가장자리",
    choices: ["숲 가장자리", "부엉이 탑", "온실"],
  },
  {
    id: 4,
    place: "숲 가장자리",
    subject: "3학년 과학 2단원 · 동물 관찰",
    title: "숲의 작은 친구들",
    intro:
      "동물을 놀라게 하지 않고 조용히 관찰해요. 몸의 특징과 생활을 살펴보아요.",
    clues: ["시계", "종", "탑"],
    destination: "시계탑",
    choices: ["시계탑", "대연회장", "도서관"],
  },
  {
    id: 5,
    place: "시계탑",
    subject: "3학년 수학 · 원",
    title: "둥근 시계의 비밀",
    intro: "시계판 속 원의 중심과 반지름, 지름을 찾아요.",
    clues: ["부엉이", "편지", "날개"],
    destination: "부엉이 탑",
    choices: ["부엉이 탑", "천문탑", "숲 가장자리"],
  },
  {
    id: 6,
    place: "부엉이 탑",
    subject: "중학교 3학년 영어 · 생태와 환경 독해",
    title: "부엉이의 환경 보고서",
    intro: "동물과 환경에 관한 영어 글을 읽고 문맥과 근거를 찾아요.",
    clues: ["책", "서가", "조용"],
    destination: "도서관",
    choices: ["도서관", "성문", "움직이는 계단"],
  },
  {
    id: 7,
    place: "도서관",
    subject: "4학년 수학 쉬운 예습",
    title: "한 걸음 더 큰 수",
    intro: "큰 수와 각도를 알아보고 곱셈과 나눗셈을 연습해요.",
    clues: ["별", "망원경", "밤"],
    destination: "천문탑",
    choices: ["천문탑", "시계탑", "마법 교실"],
  },
  {
    id: 8,
    place: "천문탑",
    subject: "중학교 3학년 영어 · 문맥 어휘와 철자",
    title: "별빛 철자",
    intro:
      "문맥과 뜻에 맞는 중3 수준의 영어 단어를 직접 써요. 대문자와 소문자는 상관없어요.",
    clues: ["계단", "움직임", "층"],
    destination: "움직이는 계단",
    choices: ["움직이는 계단", "온실", "대연회장"],
  },
  {
    id: 9,
    place: "움직이는 계단",
    subject: "한국어 읽기 평가",
    title: "글 속의 길",
    intro: "짧은 글을 꼼꼼히 읽고 글 속에 있는 근거를 찾아요.",
    clues: ["성벽", "문", "입구"],
    destination: "성문",
    choices: ["성문", "숲 가장자리", "부엉이 탑"],
  },
  {
    id: 10,
    place: "성문",
    subject: "4학년 과학 쉬운 예습",
    title: "성문의 마지막 실험",
    intro: "물의 상태와 자석, 빛의 기본 원리를 알아보고 성 밖 정원으로 향해요.",
    clues: ["성벽", "밖", "꽃밭"],
    destination: "성 밖 정원",
    choices: ["성 밖 정원", "성문", "천문탑"],
  },
];

const pools = { ...languagePools, ...stemPools };
const indexes = new Map(
  Object.entries(pools).map(([id, pool]) => [
    Number(id),
    new Map(pool.map((question) => [question.id, question])),
  ]),
);

export function questionPool(levelId) {
  const pool = pools[levelId];
  if (!pool) throw new RangeError(`Unknown level: ${levelId}`);
  return pool;
}

export function questionById(levelId, id) {
  return indexes.get(levelId)?.get(id);
}
