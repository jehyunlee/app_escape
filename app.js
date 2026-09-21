import { levels, questionPool, QUESTION_COUNT, PASS_SCORE } from "./levels.js";
import { catalog, avatarMarkup, preloadCharacterArt } from "./avatar.js";
import {
  characters,
  portraitMarkup,
  wizardPortraitMarkup,
} from "./characters.js";
import { playTravel } from "./travel.js";
import { createRoomView } from "./room-renderer.js";
import {
  SAVE_KEY,
  POINTS,
  freshState,
  restoreState,
  score,
  answeredCount,
  chooseCharacter,
  questionForObject,
  currentQuestion,
  openQuestion,
  closeQuestion,
  answerQuestion,
  continueQuiz,
  retryStage,
  openDestination,
  chooseDestination,
  openWardrobe,
  purchaseItem,
  equipItem,
  beginTravel,
  finishTravel,
  inventory,
  avatarMood,
  layoutSeed,
} from "./engine.js";

const $ = (selector) => document.querySelector(selector);
const escape = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ],
  );
const categoryNames = {
  eyes: "눈색",
  skin: "피부색",
  clothes: "옷",
  accessory: "액세서리",
};
const SLOT_KEY = "headache-escape-slots-v1";
const SLOT_COUNT = 5;
let state = freshState();
let canSave = true;
let slotMode = "save";
let traveling = false;
let pendingItem = null;
let shopCategory = "eyes";
let pendingCharacter = null;
let roomView = null;
let roomViewLevel = null;
let roomViewLayoutSeed = null;
try {
  state = restoreState(localStorage.getItem(SAVE_KEY));
} catch {
  canSave = false;
}

function save() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    canSave = true;
  } catch {
    canSave = false;
  }
  renderStatus();
}
function readSlots() {
  try {
    const parsed = JSON.parse(localStorage.getItem(SLOT_KEY) || "[]");
    if (!Array.isArray(parsed)) return Array(SLOT_COUNT).fill(null);
    return Array.from({ length: SLOT_COUNT }, (_, index) => {
      const entry = parsed[index];
      if (
        !entry ||
        entry.version !== 1 ||
        typeof entry.savedAt !== "string" ||
        !entry.state ||
        entry.state.version !== 4
      )
        return null;
      const restored = restoreState(JSON.stringify(entry.state));
      return restored.seed === entry.state.seed ? { ...entry, state: restored } : null;
    });
  } catch {
    return Array(SLOT_COUNT).fill(null);
  }
}
function writeSlots(slots) {
  try {
    localStorage.setItem(SLOT_KEY, JSON.stringify(slots.slice(0, SLOT_COUNT)));
    canSave = true;
    return true;
  } catch {
    canSave = false;
    renderStatus();
    return false;
  }
}
function slotSummary(entry) {
  if (!entry) return "비어 있음";
  const character = characters.find(
    (candidate) => candidate.id === entry.state.characterId,
  );
  const progress =
    entry.state.phase === "complete"
      ? "모든 방 탈출 완료"
      : `LEVEL ${entry.state.level + 1} · ${levels[entry.state.level].place}`;
  const date = new Date(entry.savedAt);
  const savedAt = Number.isNaN(date.getTime())
    ? "저장 시간 알 수 없음"
    : date.toLocaleString();
  return `${character ? character.name : "캐릭터 미선택"} · ${progress} · ${savedAt}`;
}
function renderSlots(message = "") {
  const slots = readSlots();
  $("#save-dialog-title").textContent =
    slotMode === "save" ? "게임 저장" : "게임 불러오기";
  $("#save-dialog-description").textContent =
    slotMode === "save"
      ? "현재 진행을 이 브라우저에 최대 5개까지 저장할 수 있어요."
      : "이 브라우저에 저장한 진행을 불러와요.";
  $("#slot-status").textContent = message;
  $("#save-slots").innerHTML = slots
    .map(
      (entry, index) =>
        `<section class="save-slot" data-slot="${index}"><div><h3>저장 ${index + 1}</h3><p>${escape(slotSummary(entry))}</p></div><div class="slot-actions">${
          slotMode === "save"
            ? `<button class="primary save-slot-button" data-save-slot="${index}">${entry ? "덮어쓰기" : "저장하기"}</button>`
            : `<button class="primary load-slot-button" data-load-slot="${index}" ${entry ? "" : "disabled"}>불러오기</button>`
        }${entry ? `<button class="delete-slot" data-delete-slot="${index}">삭제</button>` : ""}</div></section>`,
    )
    .join("");
  document.querySelectorAll("[data-save-slot]").forEach((button) => {
    button.onclick = () => {
      const index = Number(button.dataset.saveSlot);
      const current = readSlots();
      if (
        current[index] &&
        !window.confirm(`저장 ${index + 1}의 기존 기록을 덮어쓸까요?`)
      )
        return;
      current[index] = {
        version: 1,
        savedAt: new Date().toISOString(),
        state: JSON.parse(JSON.stringify(state)),
      };
      if (writeSlots(current))
        renderSlots(`저장 ${index + 1}에 현재 진행을 저장했어요.`);
    };
  });
  document.querySelectorAll("[data-load-slot]").forEach((button) => {
    button.onclick = () => {
      const index = Number(button.dataset.loadSlot);
      const entry = readSlots()[index];
      if (
        !entry ||
        !window.confirm(
          `현재 진행을 바꾸고 저장 ${index + 1}의 기록을 불러올까요?`,
        )
      )
        return;
      $("#save-dialog").close();
      pendingCharacter = null;
      update(restoreState(JSON.stringify(entry.state)));
    };
  });
  document.querySelectorAll("[data-delete-slot]").forEach((button) => {
    button.onclick = () => {
      const index = Number(button.dataset.deleteSlot);
      if (!window.confirm(`저장 ${index + 1}의 기록을 삭제할까요?`)) return;
      const current = readSlots();
      current[index] = null;
      if (writeSlots(current))
        renderSlots(`저장 ${index + 1}의 기록을 삭제했어요.`);
    };
  });
}
function openSlots(mode) {
  slotMode = mode;
  renderSlots();
  $("#save-dialog").showModal();
}
function update(next, moveFocus = true) {
  state = next;
  save();
  renderGame(moveFocus);
}
function renderStatus() {
  $("#save-status").textContent = canSave
    ? "점수·포인트·의상이 이 브라우저에 자동 저장돼요."
    : "저장 공간을 사용할 수 없어요. 창을 닫으면 진행이 사라질 수 있어요.";
}
function chips(items) {
  return items
    .map((item) => `<span class="clue">${escape(item.word)}</span>`)
    .join("");
}
function renderSidebars() {
  const items = inventory(state);
  $("#bag-count").textContent = items.length;
  $("#point-count").textContent = state.points;
  $("#player-avatar").innerHTML = state.characterId
    ? avatarMarkup(state.equipped, state.characterId, avatarMood(state))
    : '<span class="character-unselected" aria-hidden="true">?</span>';
  const character = characters.find((entry) => entry.id === state.characterId);
  $("#player-name").textContent = character
    ? `${character.name}의 모험`
    : "캐릭터를 골라요";
  $("#player-portrait").innerHTML = character
    ? portraitMarkup(state.characterId)
    : "";
  $("#player-points").textContent = `${state.points} P`;
  $("#progress-label").textContent =
    `${state.phase === "complete" ? 10 : state.level} / 10개의 방 탈출 완료`;
  $("#level-map").innerHTML = levels
    .map(
      (level, index) =>
        `<li class="${state.phase === "complete" || index < state.level ? "map-done" : index === state.level ? "map-current" : ""}" ${state.phase !== "complete" && index === state.level ? 'aria-current="step"' : ""}><span class="map-number">${state.phase === "complete" || index < state.level ? "✓" : index <= state.level ? level.id : "?"}</span>${index <= state.level ? escape(level.place) : "미지의 방"}<span class="sr-only">${state.phase === "complete" || index < state.level ? " 완료" : index === state.level ? " 현재" : " 잠김"}</span></li>`,
    )
    .join("");
  const current = items.filter((item) => item.level === levels[state.level].id);
  $("#current-clues").innerHTML = current.length
    ? chips(current)
    : '<span class="empty-clue">정답 5개마다 단서를 하나씩 찾아요.</span>';
  $("#bag-content").innerHTML = items.length
    ? levels
        .filter((level) => items.some((item) => item.level === level.id))
        .map(
          (level) =>
            `<section class="bag-group"><h3>LEVEL ${level.id} · ${escape(level.place)}</h3>${chips(items.filter((item) => item.level === level.id))}</section>`,
        )
        .join("")
    : "<p>가방이 비어 있어요. 정답 5개를 모으면 첫 단서를 얻어요.</p>";
  renderStatus();
}
function renderGame(moveFocus = false) {
  if (
    roomView &&
    (roomViewLevel !== state.level ||
      roomViewLayoutSeed !== layoutSeed(state) ||
      ["complete", "character"].includes(state.phase))
  ) {
    roomView.dispose();
    roomView = null;
    roomViewLevel = null;
    roomViewLayoutSeed = null;
  }
  roomView?.pause(true);
  if ($("#question-dialog").open) $("#question-dialog").close();
  $("#question-content").replaceChildren();
  $("#question-character").replaceChildren();
  renderSidebars();
  if (state.phase === "character") {
    renderCharacterSelection();
  } else if (state.phase === "complete") {
    $("#game").innerHTML =
      `<div class="victory"><div class="victory-seal" aria-hidden="true">10</div><p class="eyebrow">MISSION COMPLETE</p><h2 tabindex="-1">호그와트 탈출 성공!</h2><p>모든 스테이지에서 20문제 중 15개 이상 맞혔어요.<br>200문제의 도전을 넘어 성 밖 정원에 도착했어요.<br>모은 단서 ${inventory(state).length}개 · 누적 획득 ${state.earned} P</p><div class="victory-avatar">${avatarMarkup(state.equipped, state.characterId, avatarMood(state))}</div><ol class="score-records">${state.records.map((record, index) => `<li>${escape(levels[index].place)} <strong>${record.score}/20</strong> · ${record.attempt + 1}번째 도전</li>`).join("")}</ol><button class="primary" id="victory-bag">모은 단서 돌아보기</button></div>`;
    $("#victory-bag").onclick = () => $("#bag-dialog").showModal();
  } else {
    const level = levels[state.level];
    $("#game").innerHTML =
      `<div class="room-heading"><div><span class="level-badge">LEVEL ${String(level.id).padStart(2, "0")} / 10 · ${state.attempt + 1}번째 도전</span><h2 tabindex="-1">${escape(level.place)}</h2></div><span class="subject-badge">${escape(level.subject)}</span></div><div class="question-body"><div id="challenge"></div></div>`;
    if (state.phase === "quiz") {
      renderRoom();
      if (state.selected !== null) {
        renderQuestion();
        $("#question-dialog").showModal();
        $("#question-modal-title").textContent = state.feedback
          ? "발견한 문제 · 해설"
          : "물건 속에 숨겨진 문제";
      }
    } else if (state.phase === "result") renderResult();
    else if (state.phase === "destination") renderDestination();
    else if (state.phase === "outfit") renderOutfit();
    else if (state.phase === "shop") renderShop();
    else if (state.phase === "travel") {
      $("#challenge").innerHTML =
        `<h3>다음 목적지: ${escape(level.destination)}</h3><p class="intro">가방을 메고 3D 통로를 지나 다음 장소로 향해요.</p>`;
      runTravel();
    }
    if (["result", "destination"].includes(state.phase)) {
      $("#challenge").insertAdjacentHTML(
        "afterbegin",
        companionMarkup("stage-companion-summary"),
      );
    }
  }
  if (moveFocus && !$("#question-dialog").open) {
    $("#game h2")?.focus({ preventScroll: true });
    if (window.innerWidth <= 650)
      $("#game").scrollIntoView({ block: "start", behavior: "instant" });
  }
}
function companionMarkup(extraClass = "") {
  const mood = avatarMood(state);
  const character = characters.find((entry) => entry.id === state.characterId);
  const message =
    mood === "happy"
      ? "해냈어! 정말 멋져!"
      : mood === "sad"
        ? "아쉽지만 괜찮아. 함께 다시 해 보자."
        : "마음에 드는 물건을 골라 봐. 내가 함께할게!";
  return `<section class="stage-companion ${extraClass}" data-mood="${mood}" aria-label="${escape(character.name)} 마법사 전신"><div class="companion-figure">${avatarMarkup(state.equipped, state.characterId, mood)}</div><div class="companion-speech"><strong>${escape(character.name)}</strong><p>${message}</p></div></section>`;
}
function renderCharacterSelection() {
  $("#game").innerHTML =
    `<section class="character-selection"><p class="eyebrow">CHOOSE YOUR WIZARD</p><h2 tabindex="-1">누구와 모험을 떠날까요?</h2><p class="intro">캐릭터를 고르면 매번 새로운 문제 20개가 방 속 물건에 숨어요.<br>영어 스테이지는 중학교 3학년 수준이에요.</p><div class="character-grid" role="group" aria-label="모험 캐릭터 선택">${characters.map((character) => `<button class="character-option" data-character-id="${character.id}" aria-pressed="${pendingCharacter === character.id}">${wizardPortraitMarkup(character.id, state.equipped)}<strong>${escape(character.name)}</strong><small class="character-specialty">${escape(character.title)}</small></button>`).join("")}</div><p id="character-choice" role="status">${pendingCharacter ? `${escape(characters.find((character) => character.id === pendingCharacter).name)} 선택됨` : "함께할 캐릭터를 눌러 주세요."}</p><button id="start-adventure" class="primary" ${pendingCharacter ? "" : "disabled"}>선택한 캐릭터로 모험 시작</button></section>`;
  document.querySelectorAll("[data-character-id]").forEach((button) => {
    button.onclick = () => {
      pendingCharacter = button.dataset.characterId;
      preloadCharacterArt(pendingCharacter);
      renderCharacterSelection();
      $(`[data-character-id="${pendingCharacter}"]`).focus({
        preventScroll: true,
      });
    };
  });
  $("#start-adventure").onclick = () =>
    update(chooseCharacter(state, pendingCharacter));
}
function renderRoom() {
  const level = levels[state.level];
  $("#challenge").innerHTML =
    `<p class="intro">${escape(level.intro)}</p><div class="scene-instructions"><span>20개 물건 중 아무거나 골라 문제를 찾아요</span><small>문제은행 ${questionPool(level.id).length}개에서 추첨 · 푼 물건은 다시 선택할 수 없어요</small></div><div id="room-host" data-room-id="${level.id}"></div><div class="quiz-score room-score"><span>찾아 푼 문제 <strong>${answeredCount(state)} / 20</strong></span><span>정답 <strong>${score(state)}개</strong> / 통과 15개</span></div>`;
  const host = $("#room-host");
  const frame = document.createElement("div");
  frame.className = "room-and-companion";
  host.replaceWith(frame);
  frame.append(host);
  frame.insertAdjacentHTML("beforeend", companionMarkup());
  if (!roomView) {
    roomView = createRoomView(
      level.id,
      (objectIndex) => update(openQuestion(state, objectIndex), false),
      layoutSeed(state),
    );
    roomViewLevel = state.level;
    roomViewLayoutSeed = layoutSeed(state);
  }
  $("#room-host").append(roomView.element);
  roomView.update({
    answered: state.answers.map((answer) => answer !== null),
    selected: state.selected,
  });
  roomView.pause(state.selected !== null);
}
function renderQuestion() {
  const level = levels[state.level];
  const questionIndex = state.selected;
  const count = answeredCount(state);
  const question = state.feedback
    ? questionForObject(state, questionIndex)
    : currentQuestion(state);
  const spelling = level.id === 8;
  const labels = { 1: "쉬움", 2: "보통", 3: "도전" };
  $("#question-character").innerHTML = companionMarkup("question-companion");
  $("#question-content").innerHTML =
    `<div class="quiz-score"><span>진행 <strong>${answeredCount(state)} / 20</strong></span><span>정답 <strong>${score(state)}개</strong> / 통과 15개</span></div><progress class="quiz-progress" value="${answeredCount(state)}" max="20" aria-label="푼 문제 수"></progress><div class="question-meta"><span>${`사물 ${questionIndex + 1} · ${state.feedback ? count : count + 1}번째 풀이`} / 20 · ${escape(level.title)}</span><span class="reward-badge">${labels[question.difficulty]} · 정답 +${POINTS[question.difficulty]} P</span></div><h3 class="question-prompt" id="question-prompt">${escape(question.prompt)}</h3>${spelling ? '<form class="spell-form"><label for="spelling">영어 단어를 직접 써요. 한 번 제출하면 답을 바꿀 수 없어요.</label><div class="spell-row"><input id="spelling" aria-labelledby="question-prompt" autocomplete="off" autocapitalize="none" spellcheck="false" maxlength="80" required><button class="primary" type="submit">정답 제출</button></div></form>' : `<p class="answer-rule">한 문제당 한 번만 채점해요. 답을 신중하게 골라요.</p><div class="answers">${question.options.map((option, index) => `<button class="answer" data-answer="${index}"><span class="answer-key" aria-hidden="true">${index + 1}</span><span>${escape(option)}</span></button>`).join("")}</div>`}<div id="feedback" aria-live="polite" aria-atomic="true"></div>`;
  if (state.feedback) {
    const answer = state.answers[questionIndex];
    const correct = answer === question.answer;
    document
      .querySelectorAll(".answer, .spell-form input, .spell-form button")
      .forEach((element) => {
        element.disabled = true;
      });
    if (spelling)
      $("#spelling").value = correct
        ? question.options[question.answer]
        : "오답으로 제출됨";
    else {
      $(`[data-answer="${question.answer}"]`).classList.add("correct");
      if (!correct && answer >= 0)
        $(`[data-answer="${answer}"]`).classList.add("wrong");
    }
    $("#feedback").className = `feedback ${correct ? "good" : "bad"}`;
    $("#feedback").innerHTML =
      `<p><strong>${correct ? `정답이에요! +${POINTS[question.difficulty]} P` : `이번에는 틀렸어요. 정답: ${escape(question.options[question.answer])}`}</strong><br>${escape(question.explanation)}</p><button class="primary" id="continue-button">${count === QUESTION_COUNT ? "스테이지 결과 보기" : "방으로 돌아가 다른 물건 고르기"}</button>`;
    $("#continue-button").onclick = () => update(continueQuiz(state));
    return;
  }
  function submit(answer) {
    const result = answerQuestion(state, answer);
    if (!result.accepted) return;
    update(result.state, false);
    $("#continue-button").focus({ preventScroll: true });
  }
  document.querySelectorAll("[data-answer]").forEach((button) => {
    button.onclick = () => submit(Number(button.dataset.answer));
  });
  if (spelling)
    $(".spell-form").onsubmit = (event) => {
      event.preventDefault();
      const word = $("#spelling").value.trim().toLowerCase();
      if (!word) {
        $("#spelling").setCustomValidity("영어 단어를 입력해 주세요.");
        $("#spelling").reportValidity();
        return;
      }
      submit(
        question.options.findIndex((option) => option.toLowerCase() === word),
      );
    };
  if (spelling)
    $("#spelling").oninput = () => $("#spelling").setCustomValidity("");
}
function renderResult() {
  const correct = score(state);
  const passed = correct >= PASS_SCORE;
  $("#challenge").innerHTML =
    `<div class="stage-result ${passed ? "passed" : "retry"}"><p class="eyebrow">STAGE RESULT</p><h3>${passed ? "스테이지 통과!" : "새로운 문제로 다시 도전해요"}</h3><div class="result-score">${correct}<span> / 20</span></div><p>${passed ? "15개 이상 맞혔어요. 단서를 보고 다음 장소를 찾아요." : `15개 이상 맞혀야 통과해요. 이번에는 ${correct}개를 맞혔어요.<br>직전 도전과 겹치지 않는 다른 20문제로 다시 시작해요.`}</p><p class="intro">모은 포인트와 물건, 찾은 단서는 유지돼요.</p><button class="primary" id="result-button">${passed ? "다음 장소 찾기" : "다른 문제로 재도전"}</button></div>`;
  $("#result-button").onclick = () =>
    update(passed ? openDestination(state) : retryStage(state));
}
function renderDestination() {
  const level = levels[state.level];
  $("#challenge").innerHTML =
    `<div class="question-meta"><span>${score(state)} / 20 정답 · 마지막 자물쇠 열림</span></div><h3 class="question-prompt">가방 속 단서가 가리키는 곳은?</h3><p>${chips(inventory(state).filter((item) => item.level === level.id))}</p><p class="destination-line">우리가 갈 곳은 <button class="blank-button" aria-expanded="false" aria-controls="word-box" id="blank-button">[ 빈칸 누르기 ]</button></p><div id="word-box" class="word-box" hidden><h3>장소 워드박스 · 목적지를 골라요</h3><div class="word-options">${level.choices.map((place, index) => `<button data-place="${index}">${escape(place)}</button>`).join("")}</div></div><div id="feedback" aria-live="polite"></div>`;
  $("#blank-button").onclick = () => {
    const box = $("#word-box");
    box.hidden = !box.hidden;
    $("#blank-button").setAttribute("aria-expanded", String(!box.hidden));
    if (!box.hidden) box.querySelector("button").focus();
  };
  document.querySelectorAll("[data-place]").forEach((button) => {
    button.onclick = () => {
      const result = chooseDestination(
        state,
        level.choices[Number(button.dataset.place)],
      );
      if (!result.correct) {
        $("#feedback").className = "feedback bad";
        $("#feedback").textContent =
          "그곳으로 가는 문은 열리지 않아요. 단서 세 개를 함께 살펴보세요.";
        return;
      }
      update(result.state);
    };
  });
}
function renderOutfit() {
  $("#challenge").innerHTML =
    `<div class="outfit-check"><p class="eyebrow">BEFORE YOU GO</p><div class="outfit-avatar">${avatarMarkup(state.equipped, state.characterId, avatarMood(state))}</div><h3>의상을 그대로 입고 갈건가요? 적절하지 않을 수도 있어요.</h3><p class="intro">목적지: ${escape(levels[state.level].destination)}<br>어떤 의상이든 이동할 수 있어요. 바꾸고 싶으면 ‘아니오’를 눌러요.</p><div class="outfit-actions"><button id="keep-outfit" class="primary">네</button><button id="change-outfit">아니오</button></div></div>`;
  $("#keep-outfit").onclick = () => update(beginTravel(state));
  $("#change-outfit").onclick = () => update(openWardrobe(state));
}
function renderShop(message = "") {
  $("#challenge").innerHTML =
    `<div class="shop-heading"><div><p class="eyebrow">WIZARD WARDROBE</p><h3>아바타 꾸미기</h3></div><strong class="shop-balance">${state.points} P</strong></div><div class="wardrobe-preview">${avatarMarkup(state.equipped, state.characterId, avatarMood(state))}<p>가방은 언제나 함께해요.<br>산 물건은 바로 착용되고 계속 보관돼요.</p></div><div class="category-buttons" role="group" aria-label="꾸미기 종류">${Object.entries(
      categoryNames,
    )
      .map(
        ([category, name]) =>
          `<button data-category="${category}" aria-pressed="${shopCategory === category}">${name}</button>`,
      )
      .join("")}</div><div class="shop-items">${catalog
      .filter((item) => item.category === shopCategory)
      .map((item) => {
        const owned = state.owned.includes(item.id);
        const equipped = state.equipped[item.category] === item.id;
        return `<button class="shop-item ${equipped ? "equipped" : ""}" data-item="${item.id}" aria-label="${escape(item.name)} · ${equipped ? "착용 중" : owned ? "보유 · 착용하기" : `${item.price} 포인트 · 구매하기`}"><span class="item-swatch" style="--item-color:${escape(item.color)}" aria-hidden="true"></span><strong>${escape(item.name)}</strong><span>${equipped ? "착용 중" : owned ? "보유 · 착용하기" : `${item.price} P`}</span></button>`;
      })
      .join(
        "",
      )}</div><p class="shop-message" id="shop-message" role="status">${escape(message || "포인트가 부족해도 구매하지 않고 다음 장소로 갈 수 있어요.")}</p><button id="finish-customizing" class="primary">꾸미기 완료 · 다음 장소로 이동</button>`;
  document.querySelectorAll("[data-category]").forEach((button) => {
    button.onclick = () => {
      shopCategory = button.dataset.category;
      renderShop();
      $(`[data-category="${shopCategory}"]`).focus({ preventScroll: true });
    };
  });
  document.querySelectorAll("[data-item]").forEach((button) => {
    button.onclick = () => {
      const item = catalog.find((entry) => entry.id === button.dataset.item);
      if (state.owned.includes(item.id)) {
        state = equipItem(state, item.id);
        save();
        renderSidebars();
        renderShop(`${item.name} 착용 완료!`);
        $(`[data-item="${item.id}"]`).focus({ preventScroll: true });
        return;
      }
      pendingItem = item.id;
      $("#purchase-description").textContent =
        `${item.name} · ${item.price} P (현재 ${state.points} P)`;
      $("#purchase-status").textContent =
        state.points < item.price
          ? "포인트가 부족해요. 다른 물건을 고르거나 그대로 이동할 수 있어요."
          : "구매하면 포인트가 차감되고 바로 착용돼요.";
      $("#confirm-purchase").disabled = state.points < item.price;
      $("#purchase-dialog").showModal();
      $("#cancel-purchase").focus();
    };
  });
  $("#finish-customizing").onclick = () => update(beginTravel(state));
}
async function runTravel() {
  if (traveling) return;
  traveling = true;
  try {
    await playTravel({
      from: levels[state.level].place,
      to: levels[state.level].destination,
      equipped: state.equipped,
      characterId: state.characterId,
      image:
        state.level < 9
          ? `assets/rooms/room-${state.level + 2}.webp`
          : "assets/hogwarts-reference.webp",
    });
    traveling = false;
    update(finishTravel(state));
  } catch {
    traveling = false;
    $("#challenge").innerHTML =
      '<p role="alert">이동 화면을 표시하지 못했어요. 진행은 저장되어 있어요.</p><button id="retry-travel" class="primary">이동 다시 시도</button>';
    $("#retry-travel").onclick = runTravel;
  }
}
$("#cancel-purchase").onclick = () => $("#purchase-dialog").close();
function returnToRoom() {
  update(closeQuestion(state));
}
$("#close-question").onclick = returnToRoom;
$("#question-dialog").addEventListener("cancel", (event) => {
  event.preventDefault();
  returnToRoom();
});
$("#purchase-dialog").addEventListener("close", () => {
  pendingItem = null;
});
$("#confirm-purchase").onclick = () => {
  if (!pendingItem) return;
  const result = purchaseItem(state, pendingItem);
  state = result.state;
  save();
  $("#purchase-dialog").close();
  renderSidebars();
  renderShop(result.reason);
  $("#shop-message").setAttribute("tabindex", "-1");
  $("#shop-message").focus();
};
$("#bag-button").onclick = () => $("#bag-dialog").showModal();
$("#close-bag").onclick = () => $("#bag-dialog").close();
$("#save-button").onclick = () => openSlots("save");
$("#load-button").onclick = () => openSlots("load");
$("#close-save-dialog").onclick = () => $("#save-dialog").close();
$("#reset-button").onclick = () => $("#reset-dialog").showModal();
$("#cancel-reset").onclick = () => $("#reset-dialog").close();
$("#confirm-reset").onclick = () => {
  $("#reset-dialog").close();
  pendingCharacter = null;
  update(freshState());
};
if (state.characterId) preloadCharacterArt(state.characterId);
renderGame();
