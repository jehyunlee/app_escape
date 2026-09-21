import { languagePools } from "./language-questions.js";
import { stemPools } from "./stem-questions.js";

export const QUESTION_COUNT = 20;
export const PASS_SCORE = 15;
// Educational progression is fixed; spatial progression is drawn from rooms.js.
export const levels = [
  {
    id: 1,
    subject: "중학교 3학년 영어 · 독해와 회화",
    title: "이야기 속 숨은 주문",
    intro:
      "짧은 이야기와 대화를 읽고, 말하는 사람의 마음과 필요한 정보를 찾아요.",
  },
  {
    id: 2,
    subject: "3학년 수학",
    title: "숫자의 자물쇠",
    intro: "숫자와 계산 속에 숨겨진 규칙을 찾아요. 차근차근 풀면 길이 열려요.",
  },
  {
    id: 3,
    subject: "3학년 과학 1단원 · 식물 관찰",
    title: "식물 관찰 기록",
    intro: "식물이 살아가는 모습을 관찰하고, 기록 속 근거를 살펴보아요.",
  },
  {
    id: 4,
    subject: "3학년 과학 2단원 · 동물 관찰",
    title: "작은 친구들의 비밀",
    intro: "동물을 배려하며 몸의 특징과 생활 모습을 알아보아요.",
  },
  {
    id: 5,
    subject: "3학년 수학 · 원",
    title: "둥근 도형의 비밀",
    intro: "원의 중심과 반지름, 지름 사이의 관계를 찾아요.",
  },
  {
    id: 6,
    subject: "중학교 3학년 영어 · 생태와 환경 독해",
    title: "환경 탐험 보고서",
    intro: "동물과 환경에 관한 영어 글을 읽고 문맥과 근거를 찾아요.",
  },
  {
    id: 7,
    subject: "4학년 수학 쉬운 예습",
    title: "한 걸음 더 큰 수",
    intro: "큰 수와 각도를 알아보고 곱셈과 나눗셈을 연습해요.",
  },
  {
    id: 8,
    subject: "중학교 3학년 영어 · 문맥 어휘와 철자",
    title: "단어의 빛",
    intro:
      "문맥과 뜻에 맞는 중3 수준의 영어 단어를 직접 써요. 대문자와 소문자는 상관없어요.",
  },
  {
    id: 9,
    subject: "한국어 읽기 평가",
    title: "글 속의 길",
    intro: "짧은 글을 꼼꼼히 읽고 글 속에 있는 근거를 찾아요.",
  },
  {
    id: 10,
    subject: "4학년 과학 쉬운 예습",
    title: "마지막 탐구",
    intro:
      "물의 상태와 자석, 빛의 기본 원리를 알아보고 마지막 탈출 문제를 풀어요.",
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
