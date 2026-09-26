import {
  levels,
  curriculum,
  questionPool,
  QUESTION_COUNT,
  PASS_SCORE,
  CLUE_THRESHOLDS,
} from "./levels.js";
import { catalog, avatarMarkup, preloadCharacterArt } from "./avatar.js";
import {
  characters,
  portraitMarkup,
  wizardPortraitMarkup,
} from "./characters.js";
import { playTravel } from "./travel.js";
import { createRoomView } from "./room-renderer.js";
import {
  rooms,
  currentRoom,
  roomById,
  destinationRoom,
  destinationChoices,
  stageNarrative,
  EXIT_ROOM,
} from "./rooms.js";
import {
  SAVE_KEY,
  SAVE_VERSION,
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
  acceptExtraQuestion,
  declineExtraQuestion,
  questionCapacity,
  remainingQuestions,
  chooseDestination,
  startStage,
  takePhoto,
  deletePhoto,
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
  hat: "모자",
  necklace: "목걸이",
  cloak: "망토",
  wand: "마법지팡이",
  broom: "빗자루",
  gloves: "장갑",
  pants: "바지",
  vest: "조끼",
};

const characterGrades = {
  dad: "기본 과정",
  mom: "기본 과정",
  jeongan: "기본 과정",
  suan: "기본 과정",
  yewon: "중3 · 고1",
  hunho: "수능 대비",
};
const SLOT_KEY = "headache-escape-slots-v5";
const SLOT_COUNT = 10;
let state = freshState();
let canSave = true;
let slotMode = "save";
let traveling = false;
let pendingItem = null;
let shopCategory = "hat";
let trialItem = null;
let pendingCharacter = null;
let roomView = null;
let roomViewLevel = null;
let roomViewLayoutSeed = null;
let roomViewId = null;
let gameOverPromptDismissed = false;
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
        entry.state.version !== SAVE_VERSION
      )
        return null;
      const restored = restoreState(JSON.stringify(entry.state));
      return restored.seed === entry.state.seed
        ? { ...entry, state: restored }
        : null;
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
      : entry.state.phase === "character"
        ? "캐릭터 선택 대기"
        : `LEVEL ${entry.state.level + 1} · ${currentRoom(entry.state).name}`;
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
      ? "플레이어·GOLD·의상·포토북·진행을 이 브라우저의 10개 슬롯에 저장해요."
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
      trialItem = null;
      pendingItem = null;
      gameOverPromptDismissed = false;
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
  if (state.phase === "character") {
    pendingCharacter = null;
    pendingItem = null;
    trialItem = null;
  }
  if (state.phase !== "gameover") gameOverPromptDismissed = false;
  save();
  renderGame(moveFocus);
}
function renderStatus() {
  $("#save-status").textContent = canSave
    ? "플레이어·GOLD·의상·포토북이 이 브라우저에 저장돼요. 다른 기기로 자동 공유되지 않아요."
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
  $("#point-count").textContent = state.gold;
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
  $("#player-points").textContent = `${state.gold} GOLD`;
  $("#progress-label").textContent =
    `${state.phase === "complete" ? levels.length : state.level} / ${levels.length}개의 방 탈출 완료`;
  $("#level-map").innerHTML = levels
    .map(
      (level, index) =>
        `<li class="${state.phase === "complete" || index < state.level ? "map-done" : index === state.level && state.phase !== "character" ? "map-current" : ""}" ${state.phase !== "complete" && state.phase !== "character" && index === state.level ? 'aria-current="step"' : ""}><span class="map-number">${state.phase === "complete" || index < state.level ? "✓" : index <= state.level && state.phase !== "character" ? level.id : "?"}</span>${index <= state.level && state.phase !== "character" ? escape(roomById(state.route[index]).name) : "미지의 방"}<span class="sr-only">${state.phase === "complete" || index < state.level ? " 완료" : index === state.level && state.phase !== "character" ? " 현재" : " 잠김"}</span></li>`,
    )
    .join("");
  const current = items.filter((item) => item.level === levels[state.level].id);
  $("#current-clues").innerHTML = current.length
    ? chips(current)
    : `<span class="empty-clue">정답 ${CLUE_THRESHOLDS.join("·")}개에 단서를 얻어요.</span>`;
  $("#bag-content").innerHTML = items.length
    ? levels
        .filter((level) => items.some((item) => item.level === level.id))
        .map(
          (level) =>
            `<section class="bag-group"><h3>LEVEL ${level.id} · ${escape(roomById(state.route[level.id - 1]).name)}</h3>${chips(items.filter((item) => item.level === level.id))}</section>`,
        )
        .join("")
    : `<p>정답 ${CLUE_THRESHOLDS.join("·")}개에 단서를 얻어요.</p>`;
  renderStatus();
}
function renderGame(moveFocus = false) {
  if (
    roomView &&
    (roomViewLevel !== state.level ||
      roomViewId !== currentRoom(state).id ||
      roomViewLayoutSeed !== layoutSeed(state) ||
      ["complete", "character"].includes(state.phase))
  ) {
    roomView.dispose();
    roomView = null;
    roomViewLevel = null;
    roomViewLayoutSeed = null;
    roomViewId = null;
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
      `<div class="victory"><div class="victory-seal" aria-hidden="true">${levels.length}</div><p class="eyebrow">MISSION COMPLETE</p><h2 tabindex="-1">호그와트 탈출 성공!</h2><p>모든 방에서 정답 ${PASS_SCORE}개를 맞혀 탈출했어요.<br>모은 단서 ${inventory(state).length}개 · 누적 획득 ${state.earned} GOLD</p><div class="victory-avatar">${avatarMarkup(state.equipped, state.characterId, avatarMood(state))}</div><ol class="score-records">${state.records.map((record, index) => `<li>${escape(roomById(state.route[index]).name)} <strong>정답 ${record.score}개 / 풀이 ${record.answered}개</strong> · ${record.attempt + 1}번째 도전</li>`).join("")}</ol><button class="primary" id="victory-bag">모은 단서 돌아보기</button></div>`;
    $("#victory-bag").onclick = () => $("#bag-dialog").showModal();
  } else {
    const level = curriculum(state.level + 1, state.characterId);
    const room = currentRoom(state);
    $("#game").innerHTML =
      `<div class="room-heading" style="--room-accent:${room.accent}"><div><span class="level-badge">LEVEL ${String(level.id).padStart(2, "0")} / ${levels.length} · ${state.attempt + 1}번째 도전</span><h2 tabindex="-1">${escape(room.name)}</h2></div><span class="subject-badge">${escape(level.subject)}</span></div><div class="question-body"><div id="challenge"></div></div>`;
    $(".room-heading > div").insertAdjacentHTML(
      "beforeend",
      `<p class="room-scope-note">호그와트 ${room.scope === "grounds" ? "성외" : "성내"} · 세부 탐색 구역은 게임 연출</p>`,
    );
    if (state.phase === "quiz" || state.feedback) {
      renderRoom();
      if (state.selected !== null) {
        renderQuestion();
        $("#question-dialog").showModal();
        $("#question-modal-title").textContent = state.feedback
          ? "발견한 문제 · 해설"
          : "물건 속에 숨겨진 문제";
      }
    } else if (state.phase === "rescue") renderRescue();
    else if (state.phase === "gameover") renderGameOver();
    else if (state.phase === "destination") renderDestination();
    else if (state.phase === "departure") renderDeparture();
    else if (state.phase === "shop") renderShop();
    else if (state.phase === "travel") {
      $("#challenge").innerHTML =
        `<h3>이동 중</h3><p class="intro">가방과 함께 새로운 공간으로 향해요.</p>`;
      runTravel();
    }
    if (state.phase === "destination") {
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
    `<section class="character-selection"><p class="eyebrow">CHOOSE YOUR WIZARD</p><h2 tabindex="-1">플레이어 선택 · ${characters.length}명</h2><p class="intro">${rooms.length}개 공간을 탐험하며 ${PASS_SCORE}개 정답에 바로 통과해요. 캐릭터별 맞춤 난이도로 모험을 시작해요.</p><div class="character-grid" role="group" aria-label="모험 캐릭터 선택">${characters.map((character) => `<button class="character-option" data-character-id="${character.id}" aria-pressed="${pendingCharacter === character.id}">${wizardPortraitMarkup(character.id, state.equipped)}<strong>${escape(character.name)}</strong><small class="character-specialty">${escape(character.title)}</small><span class="character-grade-badge">${escape(characterGrades[character.id] || "기본 과정")}</span></button>`).join("")}</div><p id="character-choice" role="status">${pendingCharacter ? `${escape(characters.find((character) => character.id === pendingCharacter).name)} 선택됨` : "함께할 캐릭터를 눌러 주세요."}</p><button id="start-adventure" class="primary" ${pendingCharacter ? "" : "disabled"}>선택한 캐릭터로 모험 시작</button></section>`;
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
  const level = curriculum(state.level + 1, state.characterId);
  const room = currentRoom(state);
  const capacity = questionCapacity(state);
  const remaining = remainingQuestions(state);
  const repeatNote = state.retiredQuestions.length
    ? "보너스 문제로 다시 열린 물건이 있어요"
    : "푼 물건은 다시 선택할 수 없어요";
  $("#challenge").innerHTML =
    `<p class="intro">${escape(room.description)}</p><p class="stage-narrative" data-stage-index="${state.level}">${escape(stageNarrative(state))}</p><p class="room-learning">${escape(level.intro)}</p><div class="scene-instructions"><span>${QUESTION_COUNT}개 물건 중 아무거나 골라 문제를 찾아요</span><small>문제은행 ${questionPool(level.id, state.characterId).length}개에서 추첨 · ${repeatNote}</small></div><div id="room-host" data-room-id="${room.id}" data-stage="${level.id}"></div><div class="quiz-score room-score"><span>찾아 푼 문제 <strong>${answeredCount(state)} / ${capacity}</strong></span><span>남은 문제 <strong>${remaining}</strong></span><span>정답 <strong>${score(state)}개</strong> / 통과 ${PASS_SCORE}개</span></div>`;
  const host = $("#room-host");
  const frame = document.createElement("div");
  frame.className = "room-and-companion";
  host.replaceWith(frame);
  frame.append(host);
  frame.insertAdjacentHTML("beforeend", companionMarkup());
  if (!roomView) {
    roomView = createRoomView(
      room,
      (objectIndex) => update(openQuestion(state, objectIndex), false),
      layoutSeed(state),
    );
    roomViewLevel = state.level;
    roomViewLayoutSeed = layoutSeed(state);
    roomViewId = room.id;
  }
  $("#room-host").append(roomView.element);
  roomView.update({
    answered: state.answers.map((answer) => answer !== null),
    selected: state.selected,
  });
  roomView.pause(state.selected !== null);
}
function renderQuestion() {
  const level = curriculum(state.level + 1, state.characterId),
    index = state.selected,
    count = answeredCount(state),
    capacity = questionCapacity(state);
  const question = state.feedback
    ? questionForObject(state, index)
    : currentQuestion(state);
  const difficulty = { 1: "쉬움", 2: "보통", 3: "도전" }[question.difficulty];
  $("#question-character").innerHTML = companionMarkup("question-companion");
  const answers = level.spelling
    ? '<form class="spell-form"><label for="spelling">영어 단어를 직접 써요. 답은 한 번만 제출할 수 있어요.</label><div class="spell-row"><input id="spelling" aria-labelledby="question-prompt" autocomplete="off" autocapitalize="none" spellcheck="false" maxlength="80" required><button class="primary" type="submit">정답 제출</button></div></form>'
    : `<p class="answer-rule">답을 신중하게 골라요. 한 문제당 한 번 채점해요.</p><div class="answers">${question.options.map((option, i) => `<button class="answer" data-answer="${i}"><span class="answer-key" aria-hidden="true">${i + 1}</span><span>${escape(option)}</span></button>`).join("")}</div>`;
  $("#question-content").innerHTML =
    `<div class="quiz-score"><span>푼 문제 <strong>${count} / ${capacity}</strong></span><span>남은 문제 <strong>${remainingQuestions(state)}</strong></span><span>정답 <strong>${score(state)}개</strong> / 통과 ${PASS_SCORE}개</span></div><progress class="quiz-progress" value="${count}" max="${capacity}" aria-label="푼 문제 수"></progress><div class="question-meta"><span>사물 ${index + 1} · ${escape(level.title)}</span><span class="reward-badge">${difficulty} · 정답 +2 GOLD / 오답 −1 GOLD</span></div><h3 id="question-prompt" class="question-prompt">${escape(question.prompt)}</h3>${answers}<div id="feedback" aria-live="polite" aria-atomic="true"></div>`;
  if (state.feedback) {
    const answer = state.answers[index],
      correct = answer === question.answer;
    document
      .querySelectorAll(".answer,.spell-form input,.spell-form button")
      .forEach((element) => (element.disabled = true));
    if (level.spelling)
      $("#spelling").value = correct
        ? question.options[question.answer]
        : "오답으로 제출됨";
    else {
      $(`[data-answer="${question.answer}"]`).classList.add("correct");
      if (!correct && answer >= 0)
        $(`[data-answer="${answer}"]`).classList.add("wrong");
    }
    const cleared = score(state) >= PASS_SCORE;
    $("#feedback").className = `feedback ${correct ? "good" : "bad"}`;
    $("#feedback").innerHTML =
      `<p><strong>${correct ? "정답이에요! +2 GOLD" : `아쉬워요. ${state.lastDelta} GOLD · 정답: ${escape(question.options[question.answer])}`}</strong><br>${escape(question.explanation)}</p>${cleared ? `<p class="instant-clear">${PASS_SCORE}개 정답! 남은 문제를 풀지 않아도 즉시 클리어예요.</p>` : ""}<button class="primary" id="continue-button">${cleared ? "단서로 다음 장소 찾기" : count === capacity ? "스테이지 결과 보기" : "방으로 돌아가 다른 물건 고르기"}</button>`;
    $("#continue-button").onclick = () => update(continueQuiz(state));
    return;
  }
  const submit = (answer) => {
    const result = answerQuestion(state, answer);
    if (result.accepted) {
      update(result.state, false);
      const nextPrompt =
        result.state.phase === "rescue"
          ? $("#rescue-heading")
          : result.state.phase === "gameover"
            ? $("#gameover-heading")
            : $("#continue-button");
      nextPrompt?.focus({
        preventScroll: !["rescue", "gameover"].includes(result.state.phase),
      });
    }
  };
  document
    .querySelectorAll("[data-answer]")
    .forEach(
      (button) =>
        (button.onclick = () => submit(Number(button.dataset.answer))),
    );
  if (level.spelling) {
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
    $("#spelling").oninput = () => $("#spelling").setCustomValidity("");
  }
}
function renderRescue() {
  const question =
    state.rescueSlot === null
      ? null
      : questionForObject(state, state.rescueSlot);
  const explanation = question?.explanation
    ? `<div class="rescue-explanation"><strong>직전 문제 해설</strong><p>${escape(question.explanation)}</p></div>`
    : "";
  $("#challenge").innerHTML =
    `<section class="rescue-panel"><p class="eyebrow">LAST CHANCE</p><h3 id="rescue-heading" tabindex="-1">한 번 더 도전할까요?</h3>${companionMarkup("stage-companion-summary")} ${explanation}<p class="rescue-prompt">5 GOLD를 사용해서 한 문제를 더 풀 수 있습니다. 진행하겠습니까?</p><p class="rescue-balance">보유 GOLD <strong>${state.gold} GOLD</strong> · 남은 문제 <strong>${remainingQuestions(state)}</strong></p><div class="rescue-actions"><button id="rescue-accept" class="primary">YES</button><button id="rescue-decline">NO</button></div></section>`;
  $("#rescue-accept").onclick = () => update(acceptExtraQuestion(state));
  $("#rescue-decline").onclick = () => update(declineExtraQuestion(state));
}
function renderGameOver() {
  const reason =
    state.gameOverReason === "gold"
      ? "GOLD가 부족해서 더 풀 수 없어요."
      : "추가 문제를 풀지 않기로 했어요.";
  const prompt = gameOverPromptDismissed
    ? `<p class="gameover-followup">현재 진행은 그대로 보관했어요.</p><button id="restart-later" class="primary">나중에 다시 시작</button>`
    : `<p class="gameover-prompt">다시 시작하겠습니까?</p><div class="gameover-actions"><button id="restart-yes" class="primary">YES</button><button id="restart-no">NO</button></div>`;
  $("#challenge").innerHTML =
    `<section class="gameover-panel"><p class="eyebrow">GAME OVER</p><h3 id="gameover-heading" tabindex="-1">GAME OVER</h3>${prompt}<p>${reason}</p><p class="gameover-progress">남은 문제 ${remainingQuestions(state)}</p>${companionMarkup("stage-companion-summary")}</section>`;
  $("#restart-yes")?.addEventListener("click", () => update(freshState()));
  $("#restart-no")?.addEventListener("click", () => {
    gameOverPromptDismissed = true;
    renderGame(false);
  });
  $("#restart-later")?.addEventListener("click", () => update(freshState()));
}

function renderDestination() {
  const level = curriculum(state.level + 1, state.characterId);
  const choices = destinationChoices(state);
  const capacity = questionCapacity(state);
  $("#challenge").innerHTML =
    `<div class="question-meta"><span>${score(state)} / ${capacity} 정답 · 마지막 자물쇠 열림</span></div><h3 class="question-prompt">가방 속 단서가 가리키는 곳은?</h3><p>${chips(inventory(state).filter((item) => item.level === level.id))}</p><p class="destination-line">우리가 갈 곳은 <button class="blank-button" aria-expanded="false" aria-controls="word-box" id="blank-button">[ 빈칸 누르기 ]</button></p><div id="word-box" class="word-box" hidden><h3>장소 워드박스 · 목적지를 골라요</h3><div class="word-options">${choices.map((room, index) => `<button data-place="${index}" data-room-choice="${room.id}">${escape(room.name)}</button>`).join("")}</div></div><div id="feedback" aria-live="polite"></div>`;
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
        choices[Number(button.dataset.place)].id,
      );
      if (!result.accepted) return;
      update(result.state);
    };
  });
}
function renderDeparture() {
  const target =
    state.travel.destinationId === EXIT_ROOM.id
      ? EXIT_ROOM
      : roomById(state.travel.destinationId);
  const expected =
    state.travel.expectedId === EXIT_ROOM.id
      ? EXIT_ROOM
      : roomById(state.travel.expectedId);
  const correct = state.travel.mode === "carriage";
  $("#challenge").innerHTML =
    `<div class="departure-result ${correct ? "good" : "bad"}"><h3>${correct ? "목적지를 찾았어요!" : "정답: " + escape(expected.name)}</h3><p>${correct ? "마법 수레가 도착했어요. 우아하게 올라타요." : "장소를 틀려서 엉뚱한 곳으로 날아갑니다: " + escape(target.name)}</p>${!correct && state.level === 9 ? "<p>다른 방에서 마지막 단계를 다시 풀어 탈출구를 찾아요.</p>" : ""}${companionMarkup()}<button id="depart-button" class="primary">${correct ? "마법 수레에 타기" : "회오리바람 타고 이동"}</button></div>`;
  $("#depart-button").onclick = () => update(beginTravel(state));
}
function renderShop(message = "") {
  const trial = catalog.find((item) => item.id === trialItem);
  const outfit = trial
    ? { ...state.equipped, [trial.category]: trial.id }
    : state.equipped;
  const statusFor = (item) =>
    state.equipped[item.category] === item.id
      ? "착용 중"
      : state.owned.includes(item.id)
        ? "보유 중"
        : "시험착용";
  $("#challenge").innerHTML =
    `<section class="wizard-boutique"><div class="shop-heading"><div><p class="eyebrow">THE ENCHANTED WARDROBE</p><h3>${state.level + 1}단계 입장 전 · 마법 옷가게</h3></div><strong class="shop-balance">${state.gold} GOLD</strong></div><div class="shop-layout"><aside class="shop-fitting-column"><div class="fitting-room"><div class="fitting-mirror">${avatarMarkup(outfit, state.characterId, "neutral")}<span>${trial ? "시험착용 중 · " + escape(trial.name) : "현재 착용 모습"}</span></div></div></aside><div class="shop-catalog"><div class="category-buttons" role="group" aria-label="옷가게 품목">${Object.entries(
      categoryNames,
    )
      .map(
        ([id, name]) =>
          `<button data-category="${id}" aria-pressed="${shopCategory === id}">${name}</button>`,
      )
      .join("")}</div><div class="shop-items">${catalog
      .filter((item) => item.category === shopCategory && item.price > 0)
      .map(
        (item) =>
          `<button class="shop-item${state.equipped[item.category] === item.id ? " equipped" : ""}" data-item="${item.id}" aria-label="${escape(item.name)} 시험착용"><img class="shop-item-image" src="assets/shop-items/${escape(item.id)}.webp" alt="${escape(item.name)}" loading="lazy" decoding="async"><span class="shop-item-copy"><strong>${escape(item.name)}</strong><span class="shop-item-price">${item.price} GOLD</span><span class="shop-item-state">${statusFor(item)}</span></span></button>`,
      )
      .join(
        "",
      )}</div><div class="fitting-actions"><p>시험착용은 무료예요. 구매를 확정할 때만 GOLD가 줄어들어요.</p>${trial ? `<strong>${escape(trial.name)} · ${trial.price} GOLD</strong><button id="buy-trial" class="primary">${state.owned.includes(trial.id) ? "이 모습으로 착용" : "구매 결정하기"}</button><button id="cancel-trial">시험착용 취소</button>` : ""}</div><p id="shop-message" class="shop-message" role="status">${escape(message || "사진으로 남기려면 구매·착용을 확정한 뒤 포토북을 열어 주세요.")}</p><button id="finish-customizing" class="primary">옷가게 나가기 · 스테이지 시작</button></div></div></section>`;
  document.querySelectorAll(".category-buttons [data-category]").forEach(
    (button) =>
      (button.onclick = () => {
        shopCategory = button.dataset.category;
        renderShop();
      }),
  );
  document.querySelectorAll(".shop-items [data-item]").forEach(
    (button) =>
      (button.onclick = () => {
        trialItem = button.dataset.item;
        renderShop();
      }),
  );
  if (trial) {
    $("#cancel-trial").onclick = () => {
      trialItem = null;
      renderShop("구매 없이 원래 모습으로 돌아왔어요.");
    };
    $("#buy-trial").onclick = () => {
      if (state.owned.includes(trial.id)) {
        state = equipItem(state, trial.id);
        trialItem = null;
        save();
        renderSidebars();
        renderShop("착용했어요.");
        return;
      }
      pendingItem = trial.id;
      $("#purchase-description").textContent =
        `${trial.name} · ${trial.price} GOLD (보유 ${state.gold} GOLD)`;
      $("#purchase-status").textContent =
        state.gold < trial.price
          ? "GOLD가 부족해요. 시험착용은 무료예요."
          : "구매하면 바로 착용하고 영구 보관해요.";
      $("#confirm-purchase").disabled = state.gold < trial.price;
      $("#purchase-dialog").showModal();
      $("#cancel-purchase").focus();
    };
  }
  $("#finish-customizing").onclick = () => {
    trialItem = null;
    update(startStage(state));
  };
}
async function runTravel() {
  if (traveling) return;
  traveling = true;
  try {
    const target =
      state.travel.destinationId === EXIT_ROOM.id
        ? EXIT_ROOM
        : roomById(state.travel.destinationId);
    await playTravel({
      from: currentRoom(state).name,
      to: target.name,
      equipped: state.equipped,
      characterId: state.characterId,
      image: target.image,
      mode: state.travel.mode,
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
  if (result.purchased) trialItem = null;
  save();
  $("#purchase-dialog").close();
  renderSidebars();
  renderShop(result.reason);
  $("#shop-message").setAttribute("tabindex", "-1");
  $("#shop-message").focus();
};
$("#bag-button").onclick = () => $("#bag-dialog").showModal();
$("#close-bag").onclick = () => $("#bag-dialog").close();
function renderPhotobook(message = "") {
  $("#photo-status").textContent = message;
  $("#capture-photo").disabled = !state.characterId;
  $("#photo-gallery").innerHTML = state.photos.length
    ? state.photos
        .slice()
        .reverse()
        .map(
          (photo) =>
            `<article class="photo-card"><div class="photo-scene" style="background-image:url('${roomById(photo.roomId).image}')">${avatarMarkup(photo.equipped, photo.characterId, photo.mood)}</div><h3>${escape(characters.find((c) => c.id === photo.characterId).name)} · ${escape(roomById(photo.roomId).name)}</h3><p>${escape(new Date(photo.takenAt).toLocaleString())} · ${photo.level}단계</p><button data-photo-delete="${escape(photo.id)}">사진 삭제</button></article>`,
        )
        .join("")
    : "<p>아직 사진이 없어요. 현재 착용한 모습과 장소를 사진으로 남겨 보세요.</p>";
  document.querySelectorAll("[data-photo-delete]").forEach(
    (button) =>
      (button.onclick = () => {
        state = deletePhoto(state, button.dataset.photoDelete);
        save();
        renderPhotobook("사진을 삭제했어요.");
      }),
  );
}
$("#photobook-button").onclick = () => {
  renderPhotobook();
  $("#photobook-dialog").showModal();
};
$("#close-photobook").onclick = () => $("#photobook-dialog").close();
$("#capture-photo").onclick = () => {
  state = takePhoto(state);
  save();
  renderPhotobook(
    canSave
      ? "사진을 저장했어요. 최근 100장을 보관해요."
      : "저장 공간을 사용할 수 없어 이번 사진은 창을 닫으면 사라져요.",
  );
};
$("#save-button").onclick = () => openSlots("save");
$("#load-button").onclick = () => openSlots("load");
$("#close-save-dialog").onclick = () => $("#save-dialog").close();
$("#reset-button").onclick = () => $("#reset-dialog").showModal();
$("#cancel-reset").onclick = () => $("#reset-dialog").close();
$("#confirm-reset").onclick = () => {
  $("#reset-dialog").close();
  pendingCharacter = null;
  trialItem = null;
  update(freshState());
};
if (state.characterId) preloadCharacterArt(state.characterId);
renderGame();
