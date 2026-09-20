import { avatarMarkup } from "./avatar.js";

const TRAVEL_DURATION = 4_800;
const CORRIDOR_DEPTH = 1_260;
let travelSequence = 0;

const createElement = (tag, className) => {
  const element = document.createElement(tag);
  if (className) element.className = className;
  return element;
};

const asText = (value, fallback) => {
  if (typeof value === "string" && value.trim()) return value.trim();
  return fallback;
};

const hasReducedMotion = () => {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function")
    return false;
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
};

const setScenePosition = (camera, world, avatar, progress) => {
  const eased = progress * progress * (3 - 2 * progress);
  const cameraDepth = Math.round(eased * 180);
  const corridorDepth = Math.round(eased * (CORRIDOR_DEPTH - 180));
  camera.style.transform = `translate3d(0, 0, ${cameraDepth}px)`;
  world.style.transform = `translate3d(0, 0, ${corridorDepth}px)`;

  // The avatar is a separate 3-D layer so the corridor can pass behind it.
  // Its depth and small side-to-side step make the wizard visibly travel too.
  const avatarDepth = -660 + eased * 500;
  const avatarBob = Math.sin(progress * Math.PI * 10) * (1 - progress * 0.3);
  const avatarTurn = Math.sin(progress * Math.PI * 2) * 4;
  avatar.style.transform = `translate3d(-50%, ${avatarBob.toFixed(2)}px, ${avatarDepth.toFixed(1)}px) rotateY(${avatarTurn.toFixed(2)}deg)`;
  avatar.style.setProperty("--travel-progress", progress.toFixed(4));
};

/**
 * Show a short, skippable 3-D journey between two rooms.
 * The returned promise resolves only after the overlay and every listener are gone.
 */
export async function playTravel(options = {}) {
  if (typeof document === "undefined" || !document.body) return;

  const {
    from = "",
    to = "",
    equipped = {},
    characterId,
    image,
  } = options ?? {};
  const source = asText(from, "출발지");
  const destination = asText(to, "다음 방");
  const overlay = createElement("div", "travel-overlay");
  const headingId = `travel-heading-${++travelSequence}`;
  const statusId = `travel-status-${travelSequence}`;
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-labelledby", headingId);
  overlay.setAttribute("aria-describedby", statusId);
  overlay.tabIndex = -1;

  const scene = createElement("div", "travel-scene");
  scene.setAttribute("aria-hidden", "true");
  const camera = createElement("div", "travel-camera");
  const world = createElement("div", "travel-world travel-corridor");
  const avatar = createElement("div", "travel-avatar");
  avatar.setAttribute("aria-hidden", "true");
  avatar.innerHTML = avatarMarkup(equipped, characterId);

  const floor = createElement("div", "travel-floor");
  const ceiling = createElement("div", "travel-ceiling");
  const leftWall = createElement("div", "travel-wall travel-wall-left");
  const rightWall = createElement("div", "travel-wall travel-wall-right");
  const rearGlow = createElement("div", "travel-rear-glow");
  world.append(floor, ceiling, leftWall, rightWall, rearGlow);

  // Each arch, window, and lamp has its own depth. This is intentional 3-D
  // geometry rather than a stack of flat opacity transitions.
  [-180, -430, -700, -970].forEach((depth, index) => {
    const arch = createElement("div", "travel-arch");
    arch.style.setProperty("--travel-depth", `${depth}px`);
    arch.setAttribute("aria-hidden", "true");
    arch.dataset.index = String(index);
    world.append(arch);
  });

  [-150, -390, -630, -870, -1110].forEach((depth, index) => {
    for (const side of ["left", "right"]) {
      const window = createElement(
        "div",
        `travel-window travel-window-${side}`,
      );
      window.style.setProperty("--travel-window-depth", `${depth}px`);
      window.style.setProperty("--travel-window-index", String(index));
      window.setAttribute("aria-hidden", "true");
      world.append(window);
    }

    const lamp = createElement("div", "travel-lamp");
    lamp.style.setProperty("--travel-lamp-depth", `${depth - 34}px`);
    lamp.setAttribute("aria-hidden", "true");
    world.append(lamp);
  });

  const doorway = createElement("div", "travel-doorway");
  doorway.style.setProperty("--travel-depth", `${-CORRIDOR_DEPTH}px`);
  doorway.setAttribute("aria-hidden", "true");
  if (image) {
    doorway.style.backgroundImage = `linear-gradient(0deg, #10172566, transparent), url("${encodeURI(image)}")`;
    doorway.style.backgroundSize = "cover";
    doorway.style.backgroundPosition = "center";
  }
  world.append(doorway);

  // Keeping the avatar next to the moving world lets depth sorting show the
  // wizard approaching while windows and arches sweep past in the background.
  camera.append(world, avatar);
  scene.append(camera);

  const hud = createElement("section", "travel-hud");
  const eyebrow = createElement("p", "travel-eyebrow");
  eyebrow.textContent = "마법의 통로";
  const heading = createElement("h2", "travel-heading");
  heading.id = headingId;
  heading.textContent = "다음 방으로 이동 중";
  const route = createElement("p", "travel-route");
  const routeFrom = createElement("span", "travel-route-point");
  routeFrom.textContent = source;
  const routeArrow = createElement("span", "travel-route-arrow");
  routeArrow.setAttribute("aria-hidden", "true");
  routeArrow.textContent = "→";
  const routeTo = createElement("span", "travel-route-point");
  routeTo.textContent = destination;
  route.append(routeFrom, routeArrow, routeTo);

  const progressTrack = createElement("div", "travel-progress-track");
  const progressBar = createElement("div", "travel-progress-bar");
  progressTrack.append(progressBar);
  progressTrack.setAttribute("role", "progressbar");
  progressTrack.setAttribute("aria-label", "이동 진행률");
  progressTrack.setAttribute("aria-valuemin", "0");
  progressTrack.setAttribute("aria-valuemax", "100");
  progressTrack.setAttribute("aria-valuenow", "0");
  const status = createElement("p", "travel-status");
  status.id = statusId;
  status.setAttribute("aria-live", "polite");
  status.textContent = "통로를 여는 중…";

  const skip = createElement("button", "travel-skip");
  skip.type = "button";
  skip.textContent = "건너뛰기";
  skip.setAttribute("aria-label", "이동 장면 건너뛰고 도착하기");
  hud.append(eyebrow, heading, route, progressTrack, status, skip);
  overlay.append(scene, hud);
  const previousFocus = document.activeElement;
  const background = Array.from(document.body.children).map((element) => ({
    element,
    inert: element.inert,
  }));
  const previousOverflow = document.body.style.overflow;
  background.forEach(({ element }) => {
    element.inert = true;
  });
  document.body.style.overflow = "hidden";
  document.body.append(overlay);

  let animationFrame = null;
  let reducedMotionTimer = null;
  let completed = false;
  const fallbackFrame = (callback) =>
    setTimeout(() => callback(Date.now()), 16);
  const requestFrame =
    typeof window !== "undefined" &&
    typeof window.requestAnimationFrame === "function"
      ? (callback) => window.requestAnimationFrame(callback)
      : fallbackFrame;
  const cancelFrame = (frame) => {
    if (
      typeof window !== "undefined" &&
      typeof window.cancelAnimationFrame === "function"
    ) {
      window.cancelAnimationFrame(frame);
    } else {
      clearTimeout(frame);
    }
  };

  const restoreFocus = () => {
    if (
      previousFocus &&
      typeof previousFocus.focus === "function" &&
      (typeof previousFocus.isConnected !== "boolean" ||
        previousFocus.isConnected)
    ) {
      try {
        previousFocus.focus({ preventScroll: true });
      } catch {
        previousFocus.focus();
      }
    }
  };

  return new Promise((resolve) => {
    const cleanup = () => {
      if (animationFrame !== null) cancelFrame(animationFrame);
      if (reducedMotionTimer !== null) clearTimeout(reducedMotionTimer);
      document.removeEventListener("keydown", onKeyDown);
      skip.removeEventListener("click", finish);
      if (
        typeof window !== "undefined" &&
        typeof window.removeEventListener === "function"
      ) {
        window.removeEventListener("resize", updateViewport);
      }
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      background.forEach(({ element, inert }) => {
        element.inert = inert;
      });
      document.body.style.overflow = previousOverflow;
      restoreFocus();
    };

    const finish = () => {
      if (completed) return;
      completed = true;
      cleanup();
      resolve();
    };

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        finish();
      } else if (event.key === "Tab") {
        // The skip button is the only interactive control in this dialog.
        // Keep keyboard focus inside the full-screen scene while it is open.
        event.preventDefault();
        try {
          skip.focus({ preventScroll: true });
        } catch {
          skip.focus();
        }
      }
    };

    const updateViewport = () => {
      if (typeof window === "undefined") return;
      scene.style.setProperty(
        "--travel-viewport-width",
        `${Math.max(1, window.innerWidth || 1)}px`,
      );
      scene.style.setProperty(
        "--travel-viewport-height",
        `${Math.max(1, window.innerHeight || 1)}px`,
      );
    };

    const updateProgress = (progress) => {
      const percentage = Math.round(progress * 100);
      progressBar.style.width = `${percentage}%`;
      progressTrack.setAttribute("aria-valuenow", String(percentage));
      const announcement =
        percentage >= 100
          ? `${destination}에 도착했습니다.`
          : percentage >= 1
            ? `${source}에서 ${destination}(으)로 이동 중`
            : "통로를 여는 중…";
      if (status.textContent !== announcement)
        status.textContent = announcement;
      setScenePosition(camera, world, avatar, progress);
    };

    skip.addEventListener("click", finish);
    document.addEventListener("keydown", onKeyDown);
    updateViewport();
    if (
      typeof window !== "undefined" &&
      typeof window.addEventListener === "function"
    ) {
      window.addEventListener("resize", updateViewport, { passive: true });
    }

    const reducedMotion = hasReducedMotion();
    if (reducedMotion) {
      overlay.classList.add("travel-overlay--reduced");
      updateProgress(1);
      status.textContent = `동작을 줄여 ${destination}까지 짧게 이동했습니다.`;
      reducedMotionTimer = setTimeout(finish, 260);
    } else {
      let startedAt = null;
      const animate = (now) => {
        if (completed) return;
        if (startedAt === null) startedAt = now;
        const progress = Math.min(
          1,
          Math.max(0, (now - startedAt) / TRAVEL_DURATION),
        );
        updateProgress(progress);
        if (progress >= 1) {
          finish();
          return;
        }
        animationFrame = requestFrame(animate);
      };
      // Calling once before the first frame keeps the scene positioned in a
      // deterministic state even when a browser delays its first animation frame.
      updateProgress(0);
      animationFrame = requestFrame(animate);
    }

    if (typeof skip.focus === "function") {
      try {
        skip.focus({ preventScroll: true });
      } catch {
        skip.focus();
      }
    }
  });
}
